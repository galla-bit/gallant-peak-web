"""Standard-library gate regression; no peer code or network is executed."""
import json
from pathlib import Path
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


if __name__=='__main__':unittest.main()
