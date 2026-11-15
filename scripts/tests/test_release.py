import base64
import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).resolve().parents[1] / "configure-release.py"
spec = importlib.util.spec_from_file_location("release", path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ReleaseConfigurationTests(unittest.TestCase):
    def test_rejects_missing_or_malformed_public_key(self):
        for value in ("", "placeholder", base64.b64encode(b"private key").decode()):
            with self.subTest(value=value), self.assertRaises(ValueError):
                module.configuration(value)

    def test_accepts_public_key_envelope_and_enforces_https(self):
        binary = b"Ed" + bytes(range(40))
        envelope = "untrusted comment: test fixture\n" + base64.b64encode(binary).decode()
        config = module.configuration(base64.b64encode(envelope.encode()).decode())
        self.assertTrue(config["bundle"]["createUpdaterArtifacts"])
        self.assertTrue(config["plugins"]["updater"]["endpoints"][0].startswith("https://"))


if __name__ == "__main__":
    unittest.main()
