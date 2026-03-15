#!/usr/bin/env python3
"""Fix remaining GLASS and useTranslation issues."""
import re, glob, os

base = r'C:\Users\A C E R\Downloads\SchoolSystem-master\frontend\src\pages'
dirs = ['academic','admissions','calendar','certificates','documents','eca','sports','settings','audit','notifications','users','department']

changes_log = []

for d in dirs:
    for f in glob.glob(os.path.join(base, d, '*.tsx')):
        if f.endswith('.test.tsx'):
            continue
        with open(f, 'r', encoding='utf-8') as fh:
            original = fh.read()
        
        content = original
        rel = os.path.relpath(f, base)
        file_changes = []
        
        # 1. Add useTranslation import if missing
        if 'useTranslation' not in content:
            import_matches = list(re.finditer(r"^import\s+.+;\s*$", content, re.MULTILINE))
            if import_matches:
                last_end = import_matches[-1].end()
                new_import = "\nimport { useTranslation } from 'react-i18next';"
                content = content[:last_end] + new_import + content[last_end:]
                file_changes.append('Added useTranslation import')
        
        # 2. Add const { t } = useTranslation() if missing
        if 'useTranslation' in content and "useTranslation()" not in content:
            # Find component function and add after opening
            func_match = re.search(
                r'(export\s+(?:default\s+)?(?:const|function)\s+\w+\s*(?::\s*React\.FC\s*)?=?\s*\([^)]*\)\s*(?::\s*\w+\s*)?(?:=>\s*)?\{)',
                content
            )
            if func_match:
                insert_pos = func_match.end()
                # Check if there's already a const { t } line nearby
                after_func = content[insert_pos:insert_pos+200]
                if 'useTranslation()' not in after_func:
                    # Insert after existing theme/S declarations if present
                    theme_match = re.search(r'(const S = useAdminStyles\(theme\);)', content[insert_pos:])
                    if theme_match:
                        actual_pos = insert_pos + theme_match.end()
                        content = content[:actual_pos] + '\n  const { t } = useTranslation();' + content[actual_pos:]
                    else:
                        content = content[:insert_pos] + '\n  const { t } = useTranslation();' + content[insert_pos:]
                    file_changes.append('Added const { t } = useTranslation()')
        
        # 3. Add S.GLASS to remaining Card/Paper components without it
        has_S = 'const S = useAdminStyles' in content
        if has_S:
            # Handle <Card sx={{ without S.GLASS (but NOT MotionCard which has animation props)
            before = content
            
            # Paper with sx={{ ... }} but no S.GLASS
            def add_glass(tag, content):
                pattern = rf'(<{tag}\s+)sx=\{{\{{([^}}]*)\}}\}}'
                def replacer(m):
                    prefix = m.group(1)
                    sx_content = m.group(2)
                    if 'S.GLASS' in sx_content:
                        return m.group(0)
                    return f'{prefix}sx={{{{ ...S.GLASS,{sx_content}}}}}'
                return re.sub(pattern, replacer, content)
            
            # Only add to Paper (Card is typically styled differently)
            content = add_glass('Paper', content)
            
            if content != before:
                content = content.replace('...S.GLASS, ...S.GLASS,', '...S.GLASS,')
                file_changes.append('Added S.GLASS to remaining containers')
        
        if content != original:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(content)
            changes_log.append(f'{rel}: {len(file_changes)} changes')
            for c in file_changes:
                changes_log.append(f'  {c}')

print('\n'.join(changes_log) if changes_log else 'No changes needed')
