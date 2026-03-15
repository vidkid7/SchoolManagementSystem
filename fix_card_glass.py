#!/usr/bin/env python3
"""Add S.GLASS to plain Card components."""
import re, os

base = r'C:\Users\A C E R\Downloads\SchoolSystem-master\frontend\src\pages'

files_to_fix = [
    os.path.join(base, 'calendar', 'CalendarDashboard.tsx'),
    os.path.join(base, 'certificates', 'CertificateDashboard.tsx'),
    os.path.join(base, 'academic', 'AcademicDashboard.tsx'),
    os.path.join(base, 'academic', 'Syllabus.tsx'),
    os.path.join(base, 'academic', 'Timetable.tsx'),
    os.path.join(base, 'academic', 'SubjectTeachersView.tsx'),
    os.path.join(base, 'academic', 'ClassSubjects.tsx'),
    os.path.join(base, 'admissions', 'AdmissionDashboard.tsx'),
    os.path.join(base, 'certificates', 'CertificateVerification.tsx'),
]

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as fh:
        original = fh.read()
    
    content = original
    rel = os.path.relpath(filepath, base)
    
    # Check file has S defined
    if 'const S = useAdminStyles' not in content:
        continue
    
    # Add sx={{ ...S.GLASS }} to plain <Card> (no existing sx)
    content = re.sub(r'<Card>', '<Card sx={{ ...S.GLASS }}>', content)
    
    # Add ...S.GLASS to <Card sx={{ existing }}> where GLASS is missing
    def add_glass_to_card_sx(m):
        if 'S.GLASS' in m.group(0):
            return m.group(0)
        return m.group(0).replace('sx={{', 'sx={{ ...S.GLASS,', 1)
    content = re.sub(r'<Card\s+sx=\{\{[^}]*\}\}', add_glass_to_card_sx, content)
    
    # Clean up MotionCard similarly
    content = re.sub(r'(<MotionCard[^>]*?)(?=>)', 
        lambda m: m.group(0) if 'S.GLASS' in m.group(0) else m.group(0).replace('sx={{', 'sx={{ ...S.GLASS,', 1) if 'sx={{' in m.group(0) else m.group(0),
        content)
    
    # Add ...S.GLASS to Paper with sx={{ }} where missing
    def add_glass_to_paper_sx(m):
        if 'S.GLASS' in m.group(0):
            return m.group(0)
        return m.group(0).replace('sx={{', 'sx={{ ...S.GLASS,', 1)
    content = re.sub(r'<Paper\s+sx=\{\{[^}]*\}\}', add_glass_to_paper_sx, content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as fh:
            fh.write(content)
        count = content.count('S.GLASS') - original.count('S.GLASS')
        print(f'{rel}: Added {count} S.GLASS references')
    else:
        print(f'{rel}: no changes')
