#!/usr/bin/env python3
"""Add useTranslation to files missing it."""
import re, os, glob

base = r'C:\Users\A C E R\Downloads\SchoolSystem-master\frontend\src\pages'
dirs = ['academic','admissions','calendar','certificates','documents','eca','sports','settings','audit','notifications','users','department']

for d in dirs:
    for f in glob.glob(os.path.join(base, d, '*.tsx')):
        if f.endswith('.test.tsx'):
            continue
        with open(f, 'r', encoding='utf-8') as fh:
            content = fh.read()
        
        rel = os.path.relpath(f, base)
        
        if 'useTranslation' in content:
            continue
        
        original = content
        
        # Add import after last import line
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') and ';' in line:
                last_import_idx = i
            elif line.strip().startswith('} from '):
                last_import_idx = i
        
        if last_import_idx >= 0:
            lines.insert(last_import_idx + 1, "import { useTranslation } from 'react-i18next';")
        
        content = '\n'.join(lines)
        
        # Add const { t } = useTranslation() after S declaration or at function start
        # Find useAdminStyles line
        s_match = re.search(r'(  const S = useAdminStyles\(theme\);)', content)
        if s_match:
            pos = s_match.end()
            content = content[:pos] + '\n  const { t } = useTranslation();' + content[pos:]
        else:
            # Find component function opening and add after first line
            func_patterns = [
                r'(export\s+(?:default\s+)?const\s+\w+\s*(?::\s*\w+(?:\.\w+)?\s*)?=\s*\([^)]*\)\s*(?::\s*\w+\s*)?=>\s*\{)',
                r'(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{)',
            ]
            for pat in func_patterns:
                m = re.search(pat, content)
                if m:
                    pos = m.end()
                    content = content[:pos] + '\n  const { t } = useTranslation();' + content[pos:]
                    break
        
        if content != original:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(content)
            print(f'{rel}: Added useTranslation')
