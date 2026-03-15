#!/usr/bin/env python3
"""Fix missing newlines after imports."""
import re, os, glob

base = r'C:\Users\A C E R\Downloads\SchoolSystem-master\frontend\src\pages'
dirs = ['academic','admissions','calendar','certificates','documents','eca','sports','settings','audit','notifications','users','department']

for d in dirs:
    for f in glob.glob(os.path.join(base, d, '*.tsx')):
        if f.endswith('.test.tsx'):
            continue
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        original = content
        rel = os.path.relpath(f, base)
        
        # Fix: import from X;\ninterface -> import from X;\n\ninterface
        content = re.sub(
            r"(from '[^']+designTokens';\n)(interface\s)",
            r'\1\n\2',
            content
        )
        content = re.sub(
            r"(from 'react-i18next';\n)(interface\s)",
            r'\1\n\2',
            content
        )
        # Also fix: import from X;\nconst (not a hook)
        content = re.sub(
            r"(from 'react-i18next';\n)(const\s+\w+\s*[=:])",
            r'\1\n\2',
            content
        )
        content = re.sub(
            r"(from '[^']+designTokens';\n)(const\s+\w+\s*[=:])",
            r'\1\n\2',
            content
        )
        # Fix import;\nexport
        content = re.sub(
            r"(from 'react-i18next';\n)(export\s)",
            r'\1\n\2',
            content
        )
        
        if content != original:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print(f'{rel}: Fixed missing newlines')
