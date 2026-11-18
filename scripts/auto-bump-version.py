import json
import os
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]


def get_latest_released_version():
    try:
        output = subprocess.check_output(
            ["gh", "release", "list", "--limit", "30", "--json", "tagName"],
            text=True,
            cwd=str(root),
        )
        releases = json.loads(output)
        versions = []
        for r in releases:
            tag = r.get("tagName", "")
            match = re.match(r"^v?(\d+)\.(\d+)\.(\d+)$", tag)
            if match:
                versions.append(
                    (int(match.group(1)), int(match.group(2)), int(match.group(3)))
                )
        if versions:
            versions.sort()
            latest = versions[-1]
            return f"{latest[0]}.{latest[1]}.{latest[2]}"
    except Exception as e:
        print(f"Warning: could not fetch releases: {e}")
    return None


def bump_patch(ver_str):
    parts = [int(p) for p in ver_str.split(".")]
    parts[2] += 1
    return f"{parts[0]}.{parts[1]}.{parts[2]}"


def parse_semver(ver_str):
    return tuple(int(p) for p in ver_str.split("."))


def main():
    package_json_path = root / "package.json"
    tauri_conf_path = root / "src-tauri/tauri.conf.json"
    cargo_toml_path = root / "src-tauri/Cargo.toml"
    cargo_lock_path = root / "src-tauri/Cargo.lock"
    types_path = root / "src/shared/types.ts"

    pkg_data = json.loads(package_json_path.read_text(encoding="utf-8"))
    current_ver = pkg_data.get("version", "0.1.0")

    ref_name = os.environ.get("GITHUB_REF_NAME", "")
    is_tag = os.environ.get("GITHUB_REF_TYPE") == "tag" or (
        ref_name.startswith("v") and bool(re.match(r"^v\d+\.\d+\.\d+$", ref_name))
    )

    if is_tag:
        target_version = ref_name.lstrip("v")
        tag_name = ref_name
        should_commit = False
    else:
        latest_released = get_latest_released_version()
        print(f"Latest release: {latest_released}, Local package version: {current_ver}")
        if latest_released:
            if parse_semver(current_ver) > parse_semver(latest_released):
                target_version = current_ver
            else:
                target_version = bump_patch(latest_released)
        else:
            target_version = current_ver
        tag_name = f"v{target_version}"
        should_commit = True

    print(f"Target release: {target_version} (Tag: {tag_name})")

    # Update files with target_version
    if current_ver != target_version:
        pkg_data["version"] = target_version
        package_json_path.write_text(json.dumps(pkg_data, indent=2) + "\n", encoding="utf-8")

        tauri_data = json.loads(tauri_conf_path.read_text(encoding="utf-8"))
        tauri_data["version"] = target_version
        tauri_conf_path.write_text(json.dumps(tauri_data, indent=2) + "\n", encoding="utf-8")

        cargo_toml_content = cargo_toml_path.read_text(encoding="utf-8")
        cargo_toml_content = re.sub(
            r'(name\s*=\s*"calcolo-personale"\s*\nversion\s*=\s*)"[^"]+"',
            rf'\g<1>"{target_version}"',
            cargo_toml_content,
        )
        cargo_toml_path.write_text(cargo_toml_content, encoding="utf-8")

        if cargo_lock_path.exists():
            cargo_lock_content = cargo_lock_path.read_text(encoding="utf-8")
            cargo_lock_content = re.sub(
                r'(name\s*=\s*"calcolo-personale"\s*\nversion\s*=\s*)"[^"]+"',
                rf'\g<1>"{target_version}"',
                cargo_lock_content,
            )
            cargo_lock_path.write_text(cargo_lock_content, encoding="utf-8")

        if types_path.exists():
            types_content = types_path.read_text(encoding="utf-8")
            types_content = re.sub(
                r"export const APP_VERSION = '[^']+';",
                f"export const APP_VERSION = '{target_version}';",
                types_content,
            )
            types_path.write_text(types_content, encoding="utf-8")

    # Set GITHUB_ENV and GITHUB_OUTPUT
    github_env = os.environ.get("GITHUB_ENV")
    if github_env:
        with open(github_env, "a", encoding="utf-8") as f:
            f.write(f"RELEASE_VERSION={target_version}\n")
            f.write(f"RELEASE_TAG={tag_name}\n")

    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as f:
            f.write(f"version={target_version}\n")
            f.write(f"tag={tag_name}\n")

    if should_commit:
        try:
            subprocess.run(["git", "config", "user.name", "github-actions[bot]"], check=True)
            subprocess.run(
                ["git", "config", "user.email", "github-actions[bot]@users.noreply.github.com"],
                check=True,
            )
            subprocess.run(
                [
                    "git",
                    "add",
                    "package.json",
                    "src-tauri/tauri.conf.json",
                    "src-tauri/Cargo.toml",
                    "src-tauri/Cargo.lock",
                    "src/shared/types.ts",
                ],
                check=True,
            )
            diff_res = subprocess.run(["git", "diff", "--staged", "--quiet"])
            if diff_res.returncode != 0:
                subprocess.run(
                    ["git", "commit", "-m", f"chore(release): bump version to {tag_name} [skip ci]"],
                    check=True,
                )
                subprocess.run(["git", "push", "origin", "HEAD:main"], check=True)
            subprocess.run(["git", "tag", "-f", tag_name], check=True)
            subprocess.run(["git", "push", "origin", tag_name, "--force"], check=True)
        except Exception as e:
            print(f"Git commit/tag step: {e}")


if __name__ == "__main__":
    main()
