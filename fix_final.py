#!/usr/bin/env python3
"""Final fix: add missing theme/S/t declarations and S.GLASS."""
import re, os, glob

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
        
        has_dt = 'designTokens' in content
        has_S_call = 'useAdminStyles(theme)' in content
        has_theme_call = 'useTheme()' in content  
        has_t_call = 'useTranslation()' in content
        has_useTranslation_import = "from 'react-i18next'" in content
        has_paper = '<Paper' in content
        has_card = '<Card' in content
        has_glass = 'S.GLASS' in content
        
        # Skip files that are fully done
        if has_S_call and has_t_call and (has_glass or (not has_paper and not has_card)):
            continue
        
        # Find component function body start
        # Match various patterns: export const X = () => {, export function X() {, etc.
        func_patterns = [
            r'(export\s+(?:default\s+)?const\s+\w+\s*(?::\s*\w+(?:\.\w+)?\s*)?=\s*\([^)]*\)\s*(?::\s*\w+\s*)?=>\s*\{)',
            r'(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*\w+\s*)?\{)',
            r'(const\s+\w+\s*(?::\s*\w+(?:\.\w+)?\s*)?=\s*\([^)]*\)\s*(?::\s*\w+\s*)?=>\s*\{)',
        ]
        
        func_match = None
        for pat in func_patterns:
            m = re.search(pat, content)
            if m:
                func_match = m
                break
        
        if not func_match:
            print(f'{rel}: WARN - could not find component function')
            continue
        
        func_end = func_match.end()
        
        # Check what's already after the function opening
        after_func = content[func_end:func_end+500]
        
        # Collect what we need to insert
        inserts = []
        
        if has_dt and not has_theme_call:
            inserts.append('  const theme = useTheme();')
        
        if has_dt and not has_S_call:
            inserts.append('  const S = useAdminStyles(theme);')
        
        if has_useTranslation_import and not has_t_call:
            inserts.append('  const { t } = useTranslation();')
        
        if inserts:
            insert_text = '\n' + '\n'.join(inserts)
            content = content[:func_end] + insert_text + content[func_end:]
            file_changes.append(f'Added declarations: {", ".join(inserts)}')
        
        # Now add S.GLASS to Paper and Card if S is available
        if 'useAdminStyles(theme)' in content:
            before = content
            
            # Plain <Card> without sx
            content = re.sub(r'<Card(?=\s*>)', '<Card sx={{ ...S.GLASS }}', content)
            
            # Plain <Paper> without sx (followed by >)
            content = re.sub(r'<Paper(?=\s*>)', '<Paper sx={{ ...S.GLASS }}', content)
            
            # Paper/Card with sx={{ but no S.GLASS
            def add_glass(m):
                tag = m.group(1)
                sx_content = m.group(2)
                if 'S.GLASS' in sx_content:
                    return m.group(0)
                return f'<{tag} sx={{{{ ...S.GLASS,{sx_content}}}}}'
            
            content = re.sub(r'<(Paper|Card)\s+sx=\{\{([^}]*)\}\}', add_glass, content)
            
            # Clean up any double S.GLASS
            while '...S.GLASS, ...S.GLASS' in content:
                content = content.replace('...S.GLASS, ...S.GLASS', '...S.GLASS')
            
            if content != before:
                file_changes.append('Added S.GLASS to containers')
        
        if content != original:
            with open(f, 'w', encoding='utf-8') as fh:
                fh.write(content)
            changes_log.append(f'{rel}: {len(file_changes)} changes')
            for c in file_changes:
                changes_log.append(f'  {c}')

print('\n'.join(changes_log) if changes_log else 'No additional changes needed')
