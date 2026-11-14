"""Verify the frontend fixture against the reviewed private-backend contract reference."""
import hashlib
import json
from pathlib import Path
import re
import sys

from check_customer_contract import _load

PROVENANCE = {
    'repository': 'galla-bit/GallantDiscoveries',
    'commit': '1deadf11149ae773f8efda7a69895d0b67c19fd5',
    'path': 'tests/customer_runtime/fixtures/customer-runtime-http.json',
}


def unique_fields(pairs):
    result = dict(pairs)
    if len(result) != len(pairs):
        raise ValueError('duplicate field')
    return result


def verify_pinned(fixture, reference):
    reference = Path(reference)
    if reference.is_symlink() or reference.is_junction() or not reference.is_file():
        raise ValueError('reference unavailable')
    with reference.open('rb') as handle:
        data = handle.read(4097)
    if len(data) > 4096:
        raise ValueError('oversized reference')
    record = json.loads(data.decode('utf-8'), object_pairs_hook=unique_fields)
    if type(record) is not dict:
        raise ValueError('invalid reference')
    digest = record.pop('canonical_sha256', None)
    if record != PROVENANCE or not isinstance(digest, str) or not re.fullmatch('[0-9a-f]{64}', digest):
        raise ValueError('invalid reference')
    canonical = json.dumps(_load(fixture), sort_keys=True, separators=(',', ':'), allow_nan=False)
    if hashlib.sha256(canonical.encode('utf-8')).hexdigest() != digest:
        raise ValueError('contract mismatch')


if __name__ == '__main__':
    try:
        fixture, reference = sys.argv[1:]
        verify_pinned(fixture, reference)
    except (OSError, ValueError, TypeError, RecursionError):
        raise SystemExit('Customer runtime contract mismatch or unavailable')
    print('Pinned customer runtime contract verified')
