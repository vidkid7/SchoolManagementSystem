#!/usr/bin/env python3
"""Add missing designTokens imports, useTheme, S declarations, and S.GLASS to Paper/Card."""
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
        
        has_paper = '<Paper' in content
        has_card = '<Card' in content or 'MotionCard' in content
        needs_glass = (has_paper or has_card) and 'S.GLASS' not in content
        has_dt = 'designTokens' in content
        has_useTheme_import = 'useTheme' in content
        has_useTheme_call = 'useTheme()' in content
        has_S = 'useAdminStyles(theme)' in content
        has_useTranslation = 'useTranslation' in content
        
        # Skip files that already have everything
        if not needs_glass and has_dt and has_S:
            continue
        
        # 1. Add designTokens import if missing
        if not has_dt and (needs_glass or True):  # Always add for consistency
            import_matches = list(re.finditer(r"^import\s+.+;\s*$", content, re.MULTILINE))
            if import_matches:
                last_end = import_matches[-1].end()
                new_import = "\nimport { C, useAdminStyles, R } from '../../theme/designTokens';"
                content = content[:last_end] + new_import + content[last_end:]
                file_changes.append('Added designTokens import')
                has_dt = True
        
        # 2. Ensure useTheme is imported
        if has_dt and 'useTheme' not in content:
            mui_match = re.search(r"(import\s*\{)([^}]*)(}\s*from\s*'@mui/material')", content, re.DOTALL)
            if mui_match:
                old_imports = mui_match.group(2)
                new_full = mui_match.group(1) + old_imports.rstrip() + ',\n  useTheme,\n' + mui_match.group(3)
                content = content.replace(mui_match.group(0), new_full, 1)
                file_changes.append('Added useTheme to MUI import')
        
        # 3. Add theme and S declarations
        has_useTheme_call = 'useTheme()' in content
        has_S = 'useAdminStyles(theme)' in content
        
        if has_dt and not has_S:
            if has_useTheme_call:
                content = re.sub(
                    r'(const theme\s*=\s*useTheme\(\)\s*;)',
                    r'\1\n  const S = useAdminStyles(theme);',
                    content, count=1
                )
                file_changes.append('Added const S = useAdminStyles(theme)')
            else:
                # Find component function and add both
                func_match = re.search(
                    r'(export\s+(?:default\s+)?(?:const|function)\s+\w+\s*(?::\s*React\.FC\s*)?=?\s*\([^)]*\)\s*(?::\s*\w+\s*)?(?:=>\s*)?\{)',
                    content
                )
                if func_match:
                    insert_pos = func_match.end()
                    content = content[:insert_pos] + '\n  const theme = useTheme();\n  const S = useAdminStyles(theme);' + content[insert_pos:]
                    file_changes.append('Added theme + S declarations')
        
        # 4. Add S.GLASS to Paper/Card containers
        if needs_glass and 'const S = useAdminStyles' in content:
            # Paper with sx but no GLASS
            # Pattern: <Paper sx={{ ... }}  where ... doesn't contain S.GLASS
            # Replace: <Paper sx={{ ...S.GLASS, ... }}
            
            def add_glass_to_paper(match):
                full = match.group(0)
                if 'S.GLASS' in full:
                    return full
                # Add ...S.GLASS as first prop in sx
                return full.replace('sx={{', 'sx={{ ...S.GLASS,', 1)
            
            # Simple Paper with sx={{ }}
            before = content
            content = re.sub(
                r'<Paper\s+sx=\{\{([^}]*)\}\}',
                lambda m: '<Paper sx={{ ...S.GLASS,' + m.group(1) + '}}' if 'S.GLASS' not in m.group(1) else m.group(0),
                content
            )
            
            # Paper component={...} sx={{ }} 
            content = re.sub(
                r'(<Paper\s+(?:component=\{[^}]+\}\s+)?(?:elevation=\{[^}]+\}\s+)?)sx=\{\{([^}]*)\}\}',
                lambda m: m.group(1) + 'sx={{ ...S.GLASS,' + m.group(2) + '}}' if 'S.GLASS' not in m.group(2) else m.group(0),
                content
            )
            
            # Paper with no sx at all - add sx={{ ...S.GLASS }}
            content = re.sub(
                r'<Paper(?=\s*>)',
                '<Paper sx={{ ...S.GLASS }}',
                content
            )
            
            if content != before:
                # Clean up double S.GLASS
                content = content.replace('...S.GLASS, ...S.GLASS,', '...S.GLASS,')
                content = content.replace('...S.GLASS,...S.GLASS,', '...S.GLASS,')
                file_changes.append('Added S.GLASS to Paper components')
        
        if content != original:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(content)
            changes_log.append(f'{rel}: {len(file_changes)} changes')
            for c in file_changes:
                changes_log.append(f'  {c}')
        
print('\n'.join(changes_log) if changes_log else 'No changes needed')
