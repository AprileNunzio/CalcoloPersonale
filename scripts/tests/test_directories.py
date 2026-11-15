import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / "import-directories.py"
spec = importlib.util.spec_from_file_location("directories", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class DirectoryImportTests(unittest.TestCase):
    def test_csv_preserves_quoted_school_names_and_missing_contacts(self):
        rows = module.csv_rows(b'CodiceScuola,DenominazioneScuola,DescrizioneComune\nABIC000001,"Scuola, di prova",Roma\n')
        school = module.entry(rows[0], "SCUANAGRAFESTAT")
        self.assertEqual(school["name"], "Scuola, di prova")
        self.assertEqual(school["pec"], "")
        self.assertEqual(school["municipality"], "Roma")

    def test_istat_numeric_code_retains_leading_zeroes(self):
        item = module.entry({"Codice Comune formato numerico": "1001", "Denominazione in italiano": "Comune prova"}, "municipality")
        self.assertEqual(item["code"], "001001")

    def test_malformed_source_is_rejected(self):
        with self.assertRaises(ValueError):
            module.entry({"CodiceScuola": "invalid", "DenominazioneScuola": "Example"}, "SCUANAGRAFESTAT")


if __name__ == "__main__":
    unittest.main()
