"""Standard-library gate regression; no peer code or network is executed."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from check_customer_contract import verify


class ContractGateTests(unittest.TestCase):
    def test_one_sided_drift_and_invalid_json_fail(self):
        with tempfile.TemporaryDirectory(prefix='.contract-test-',dir=Path.cwd()) as directory:
            root=Path(directory).resolve()
            if not root.is_relative_to(Path.cwd().resolve()):raise RuntimeError('unowned test directory')
            own=root/'own.json';peer=root/'peer.json'
            own.write_text(json.dumps({'contract_version':1,'cases':{'free':{'count':1}}}))
            peer.write_bytes(own.read_bytes());self.assertTrue(verify(own,peer))
            peer.write_text(own.read_text().replace('count": 1','count": 2'))
            with self.assertRaises(ValueError):verify(own,peer)
            peer.write_text(own.read_text().replace('count": 1','count": true'))
            with self.assertRaises(ValueError):verify(own,peer)
            peer.write_text('{"cases":{},"cases":{}}')
            with self.assertRaises(ValueError):verify(own,peer)


class PinnedContractTests(unittest.TestCase):
    tools_dir = Path(__file__).resolve().parent
    fixture = tools_dir/'fixtures/customer-runtime-http.json'
    reference = tools_dir/'fixtures/customer-runtime-backend-reference.json'
    expected = {
        'repository':'galla-bit/GallantDiscoveries',
        'commit':'1deadf11149ae773f8efda7a69895d0b67c19fd5',
        'path':'tests/customer_runtime/fixtures/customer-runtime-http.json',
        'canonical_sha256':'f48c3cbc5ab73f381d50773525c5fe72bdc322d294de2e1ecba0df965d4845f1',
    }

    def invoke(self, fixture, reference):
        return subprocess.run([sys.executable, self.tools_dir/'verify_pinned_contract.py', fixture, reference],
                              capture_output=True, text=True)

    def assert_rejected(self, fixture, reference):
        result = self.invoke(fixture, reference)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stdout, '')
        self.assertEqual(result.stderr.strip(), 'Customer runtime contract mismatch or unavailable')

    def test_qualified_reference_and_real_fixture_match(self):
        self.assertEqual(self.invoke(self.fixture, self.reference).returncode, 0)
        self.assertEqual(json.loads(self.reference.read_text()), self.expected)

    def test_formatting_does_not_change_contract(self):
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as folder:
            fixture = Path(folder)/'fixture.json'
            fixture.write_text(json.dumps(json.loads(self.fixture.read_text()), sort_keys=True))
            self.assertEqual(self.invoke(fixture, self.reference).returncode, 0)

    def test_missing_malformed_or_modified_fixture_is_denied(self):
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as folder:
            fixture = Path(folder)/'fixture.json'
            self.assert_rejected(fixture, self.reference)
            for text in ('{', '{"cases":{},"cases":{},"contract_version":1}',
                         '{"cases":{},"contract_version":1}'):
                with self.subTest(case=text):
                    fixture.write_text(text)
                    self.assert_rejected(fixture, self.reference)

    def test_missing_malformed_or_modified_reference_is_denied(self):
        with tempfile.TemporaryDirectory(dir=Path.cwd()) as folder:
            reference = Path(folder)/'reference.json'
            self.assert_rejected(self.fixture, reference)
            wrong_values = {'repository':'other/project', 'commit':'0'*40, 'path':'other.json',
                            'canonical_sha256':'0'*64, 'extra':'unexpected'}
            cases = ['{', '{}', '[]', '{"repository":"bad","repository":"bad"}',
                     '{"repository":"private-error-canary' + 'x'*131072 + '"}']
            cases.extend(json.dumps(self.expected | {k:v}) for k,v in wrong_values.items())
            for i, text in enumerate(cases):
                with self.subTest(case=i):
                    reference.write_text(text)
                    self.assert_rejected(self.fixture, reference)


if __name__=='__main__':unittest.main()
