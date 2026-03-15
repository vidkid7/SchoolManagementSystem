#!/usr/bin/env python3
"""Check import status of all target files."""
import re, glob, os

base = r'C:\Users\A C E R\Downloads\SchoolSystem-master\frontend\src\pages'
dirs = ['academic','admissions','calendar','certificates','documents','eca','sports','settings','audit','notifications','users','department']

for d in dirs:
    for f in glob.glob(os.path.join(base, d, '*.tsx')):
        if f.endswith('.test.tsx'):
            continue
        with open(f, 'r', encoding='utf-8') as fh:
            c = fh.read()
        rel = os.path.relpath(f, base)
        has_dt = 'designTokens' in c
        has_useTheme = 'useTheme' in c
        has_S = 'useAdminStyles(theme)' in c
        has_t = 'useTranslation' in c
        has_paper = '<Paper' in c
        has_card = '<Card' in c or 'MotionCard' in c
        has_glass = 'S.GLASS' in c
        
        issues = []
        if not has_dt:
            issues.append('NO_DT')
        if has_dt and not has_S:
            issues.append('NO_S')
        if not has_t:
            issues.append('NO_t()')
        if (has_paper or has_card) and not has_glass:
            issues.append('NO_GLASS')
        
        if issues:
            print(f'{rel:55s} {" ".join(issues)}')
