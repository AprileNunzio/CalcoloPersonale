import argparse
import csv
import datetime
import hashlib
import io
import json
import os
from pathlib import Path
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def normalized(value):
    value = unicodedata.normalize("NFKD", value)
    return "".join(character.lower() for character in value if character.isalnum() and not unicodedata.combining(character))


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "CalcoloPersonale/0.1 public-directory-import"})
    with urllib.request.urlopen(request, timeout=90) as response:
        if not response.url.startswith("https://"):
            raise ValueError("Insecure source redirect")
        data = response.read(80_000_001)
    if len(data) > 80_000_000:
        raise ValueError("Source exceeds size limit")
    return data


def csv_rows(data):
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = data.decode("cp1252")
    dialect = csv.Sniffer().sniff(text[:8192], delimiters=",;\t")
    return list(csv.DictReader(io.StringIO(text), dialect=dialect))


def xlsx_rows(data):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        if sum(item.file_size for item in archive.infolist()) > 120_000_000:
            raise ValueError("Workbook exceeds expanded size limit")
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            document = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(item.itertext()) for item in document.findall("s:si", NS)]
        document = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in document.findall("s:sheetData/s:row", NS):
            cells = {}
            for cell in row.findall("s:c", NS):
                reference = re.sub(r"\d", "", cell.attrib["r"])
                value = cell.findtext("s:v", default="", namespaces=NS)
                if cell.attrib.get("t") == "s":
                    value = shared[int(value)]
                elif cell.attrib.get("t") == "inlineStr":
                    value = "".join(cell.find("s:is", NS).itertext())
                cells[reference] = value
            rows.append(cells)
    headers = next((row for row in rows if any("denominazioneinitaliano" in normalized(value) for value in row.values())), None)
    if not headers:
        raise ValueError("ISTAT column headers not recognized")
    return [{title: row.get(column, "") for column, title in headers.items()} for row in rows[rows.index(headers) + 1:]]


def pick(row, *names):
    values = {normalized(key): str(value or "").strip() for key, value in row.items()}
    return next((values[normalized(name)] for name in names if values.get(normalized(name))), "")


def entry(row, category):
    school = category != "municipality"
    code = pick(row, "CodiceScuola") if school else pick(row, "Codice Comune formato alfanumerico", "Codice Comune formato numerico")
    if not school:
        code = code.zfill(6)
    name = pick(row, "DenominazioneScuola") if school else pick(row, "Denominazione in italiano", "Denominazione (italiana e straniera)")
    if not name or not re.fullmatch(r"[A-Z0-9]{10}" if school else r"\d{6}", code):
        raise ValueError(f"Invalid directory row: {code}")
    return {
        "code": code, "name": name,
        "municipality": pick(row, "DescrizioneComune") if school else name,
        "province": pick(row, "Provincia", "Sigla automobilistica"),
        "region": pick(row, "Regione", "Denominazione Regione"),
        "address": pick(row, "IndirizzoScuola"),
        "postalCode": pick(row, "CAPScuola"),
        "email": pick(row, "IndirizzoEmailScuola"),
        "pec": pick(row, "IndirizzoPecScuola"),
        "website": pick(row, "SitoWebScuola"),
        "schoolYear": pick(row, "AnnoScolastico"),
        "category": category,
        "details": {str(key): str(value or "").strip() for key, value in row.items()},
    }


def source_metadata(url, data, count, category):
    return {"url": url, "sha256": hashlib.sha256(data).hexdigest(), "records": count,
            "category": category, "retrievedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}


def municipalities():
    url = "https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx"
    data = download(url)
    entries = [entry(row, "municipality") for row in xlsx_rows(data) if pick(row, "Denominazione in italiano", "Denominazione (italiana e straniera)")]
    if not 7000 < len(entries) < 9000 or len({item["code"] for item in entries}) != len(entries):
        raise ValueError("ISTAT record count or unique codes failed validation")
    return {"entries": entries, "sources": [source_metadata(url, data, len(entries), "ISTAT")], "status": "imported"}


def schools():
    entries, sources = [], []
    for category in ("SCUANAGRAFESTAT", "SCUANAGRAFEPAR", "SCUANAAUTSTAT", "SCUANAAUTPAR"):
        url = f"https://dati.istruzione.it/opendata/opendata/catalogo/elements1/{category}20262720260901.csv"
        data = download(url)
        imported = [entry(row, category) for row in csv_rows(data)]
        if not imported:
            raise ValueError(f"Empty school category: {category}")
        entries.extend(imported)
        sources.append(source_metadata(url, data, len(imported), category))
    keys = {(item["code"], item["schoolYear"], item["category"]) for item in entries}
    if len(keys) != len(entries) or len(entries) < 30000:
        raise ValueError("MIM record count or unique codes failed validation")
    return {"entries": entries, "sources": sources, "status": "imported", "schoolYear": "202627"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", choices=["all", "schools", "municipalities"], default="all")
    arguments = parser.parse_args()
    completed = {}
    for name, importer in (("municipalities", municipalities), ("schools", schools)):
        if arguments.kind in ("all", name):
            completed[name] = importer()
    for name, data in completed.items():
        path = ROOT / f"src-tauri/resources/{name}.json"
        temporary = path.with_suffix(".pending")
        temporary.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        os.replace(temporary, path)
        print(f"{name}: {len(data['entries'])} verified records")


if __name__ == "__main__":
    main()
