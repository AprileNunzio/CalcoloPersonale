import os
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
if os.environ.get("GITHUB_REF", "").startswith("refs/tags/"):
    raise SystemExit("Dependency bootstrap is forbidden for release tags")
if not (root / "package-lock.json").exists():
    subprocess.run(["npm.cmd" if os.name == "nt" else "npm", "install", "--package-lock-only", "--ignore-scripts"], cwd=root, check=True)
if not (root / "src-tauri/Cargo.lock").exists():
    subprocess.run(["cargo", "generate-lockfile", "--manifest-path", "src-tauri/Cargo.toml"], cwd=root, check=True)
