#!/usr/bin/env python3
"""Check remaining borderRadius values."""
import re, glob, os

base = r'C:\Users\A C E R\Downloads\SchoolSystem-master\frontend\src\pages'
dirs = ['academic','admissions','calendar','certificates','documents','eca','sports','settings','audit','notifications','users','department']

for d in dirs:
    for f in glob.glob(os.path.join(base, d, '*.tsx')):
        if f.endswith('.test.tsx'):
            continue
        with open(f, 'r', encoding='utf-8') as fh:
            c = fh.read()
        hardcoded = re.findall(r'borderRadius:\s*(\d+\.?\d*)(?=\s*[,}\s])', c)
        r_tokens = len(re.findall(r'borderRadius:\s*R\.', c))
        str_vals = re.findall(r"borderRadius:\s*['\"]([^'\"]+)['\"]", c)
        rel = os.path.relpath(f, base)
        if hardcoded or r_tokens or str_vals:
            print(f'{rel:55s} hardcoded={hardcoded} R={r_tokens} str={str_vals}')
