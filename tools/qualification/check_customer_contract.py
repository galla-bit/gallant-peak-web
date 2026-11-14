"""Compare only bounded synthetic JSON artifacts; never execute peer code."""
import argparse
import json
from pathlib import Path


def _load(path):
    path=Path(path)
    if path.is_symlink() or path.is_junction() or not path.is_file() or path.stat().st_size>131072:
        raise ValueError('customer runtime contract unavailable')
    def pairs(rows):
        record={}
        for key,value in rows:
            if key in record:raise ValueError('duplicate contract field')
            record[key]=value
        return record
    result=json.loads(path.read_text(encoding='utf-8'),object_pairs_hook=pairs,
        parse_constant=lambda value:(_ for _ in ()).throw(ValueError('invalid contract number')))
    if type(result) is not dict or type(result.get('contract_version')) is not int or result['contract_version']!=1 or type(result.get('cases')) is not dict:
        raise ValueError('customer runtime contract invalid')
    return result


def verify(own,peer):
    try:
        canonical=lambda value:json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False)
        if canonical(_load(own))!=canonical(_load(peer)):raise ValueError()
    except (OSError,ValueError,TypeError,RecursionError):
        raise ValueError('customer runtime contract mismatch or unavailable') from None
    return True


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('own');parser.add_argument('peer')
    args=parser.parse_args()
    try:verify(args.own,args.peer)
    except ValueError:raise SystemExit('customer runtime contract mismatch or unavailable')
    print('Paired customer runtime contract verified')
