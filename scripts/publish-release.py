import json
import os
import subprocess

repository = os.environ["GITHUB_REPOSITORY"]
tag = os.environ.get("RELEASE_TAG") or os.environ["GITHUB_REF_NAME"]
output = subprocess.check_output(
    ["gh", "release", "view", tag, "--repo", repository, "--json", "assets,isDraft"],
    text=True,
)
release = json.loads(output)
names = [asset["name"] for asset in release["assets"]]
print(f"Found release assets: {names}")
installers = [name for name in names if name.endswith("-setup.exe")]
if not installers or "latest.json" not in names:
    raise SystemExit("Installer or updater manifest missing; release remains a draft")
if any(
    f"{name}.sig" not in names and f"{name.removesuffix('.exe')}.nsis.zip.sig" not in names
    for name in installers
):
    raise SystemExit("Unsigned installer; release remains a draft")
subprocess.run(
    ["gh", "release", "edit", tag, "--repo", repository, "--draft=false", "--latest"],
    check=True,
)
