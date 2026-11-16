import argparse
import json
import os
import tomllib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--release", action="store_true")
arguments = parser.parse_args()
failures = []
for directory in ("src", "src-tauri/src", "scripts", ".github"):
    for path in (root / directory).rglob("*"):
        if path.is_file() and path.suffix in {".ts", ".tsx", ".rs", ".py", ".yml", ".css"}:
            if len(path.read_text(encoding="utf-8").splitlines()) > 500:
                failures.append(f"File exceeds 500 lines: {path.relative_to(root)}")
for path in (root / "src-tauri").glob("*.json"):
    json.loads(path.read_text(encoding="utf-8"))
if arguments.release:
    version = json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]
    tauri = json.loads((root / "src-tauri/tauri.conf.json").read_text(encoding="utf-8"))
    cargo = tomllib.loads((root / "src-tauri/Cargo.toml").read_text(encoding="utf-8"))
    ref_name = os.environ.get("RELEASE_TAG") or os.environ.get("GITHUB_REF_NAME", "")
    if (ref_name and ref_name != f"v{version}") or tauri["version"] != version or cargo["package"]["version"] != version:
        failures.append("Release tag and application versions must match")
    for name in ("package-lock.json", "src-tauri/Cargo.lock", "src-tauri/icons/icon.ico"):
        if not (root / name).exists():
            failures.append(f"Required release file missing: {name}")
    for name in ("schools", "municipalities"):
        data = json.loads((root / f"src-tauri/resources/{name}.json").read_text(encoding="utf-8"))
        if not data.get("entries") or not data.get("sources"):
            failures.append(f"National directory incomplete: {name}")
if failures:
    raise SystemExit("\n".join(failures))
print("Project checks passed")
