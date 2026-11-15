import base64
import json
import os
from pathlib import Path


def configuration(public_key):
    decoded = base64.b64decode(public_key, validate=True).decode("ascii")
    lines = decoded.strip().splitlines()
    if len(lines) != 2 or not lines[0].startswith("untrusted comment:"):
        raise ValueError("Invalid updater public key envelope")
    binary = base64.b64decode(lines[1], validate=True)
    if len(binary) != 42 or binary[:2] != b"Ed":
        raise ValueError("Invalid Ed25519 updater public key")
    return {
        "bundle": {"createUpdaterArtifacts": True},
        "plugins": {
            "updater": {
                "pubkey": public_key,
                "endpoints": [
                    "https://github.com/AprileNunzio/CalcoloPersonale/releases/latest/download/latest.json"
                ],
                "windows": {"installMode": "passive"},
            }
        },
    }


if __name__ == "__main__":
    destination = Path(__file__).resolve().parents[1] / "src-tauri/tauri.release.conf.json"
    config = configuration(os.environ["TAURI_UPDATER_PUBLIC_KEY"].strip())
    destination.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
