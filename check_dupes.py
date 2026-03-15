#!/usr/bin/env python3
"""Check for duplicate imports and other issues."""
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
        issues = []
        
        # Check duplicate designTokens import
        dt_count = content.count("from '../../theme/designTokens'")
        if dt_count > 1:
            issues.append(f'DUPLICATE designTokens import ({dt_count}x)')
        
        # Check duplicate useTranslation import
        ut_count = content.count("from 'react-i18next'")
        if ut_count > 1:
            issues.append(f'DUPLICATE react-i18next import ({ut_count}x)')
        
        # Check duplicate useTheme() calls
        theme_count = len(re.findall(r'const theme\s*=\s*useTheme\(\)', content))
        if theme_count > 1:
            issues.append(f'DUPLICATE useTheme() call ({theme_count}x)')
        
        # Check duplicate S = useAdminStyles
        s_count = len(re.findall(r'const S\s*=\s*useAdminStyles', content))
        if s_count > 1:
            issues.append(f'DUPLICATE useAdminStyles call ({s_count}x)')
        
        # Check duplicate t = useTranslation
        t_count = len(re.findall(r'useTranslation\(\)', content))
        if t_count > 1:
            issues.append(f'DUPLICATE useTranslation() call ({t_count}x)')
        
        # Check for missing newline between import and interface
        if re.search(r"from '../../theme/designTokens';\ninterface", content):
            issues.append('Missing newline after designTokens import')
        if re.search(r"from 'react-i18next';\ninterface", content):
            issues.append('Missing newline after i18next import')
        
        if issues:
            print(f'{rel}:')
            for i in issues:
                print(f'  {i}')
