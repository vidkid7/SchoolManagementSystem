#!/usr/bin/env python3
"""Fix borderRadius and design token imports across page files."""
import os, re, glob

base = r'C:\Users\A C E R\Downloads\SchoolSystem-master\frontend\src\pages'
dirs = ['academic','admissions','calendar','certificates','documents','eca','sports','settings','audit','notifications','users','department']

files = []
for d in dirs:
    for f in glob.glob(os.path.join(base, d, '*.tsx')):
        bn = os.path.basename(f)
        if bn.endswith('.test.tsx') or bn == 'index.ts' or bn == 'index.tsx':
            continue
        files.append(f)

changes_log = []

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as fh:
        original = fh.read()
    
    content = original
    rel = os.path.relpath(filepath, base)
    file_changes = []
    
    # 1. Fix borderRadius numeric values -> R constants
    replacements = [
        (r'borderRadius:\s*4(?=\s*[,}\n\r])', 'borderRadius: R.lg'),
        (r'borderRadius:\s*3(?=\s*[,}\n\r])', 'borderRadius: R.lg'),
        (r'borderRadius:\s*2\.5(?=\s*[,}\n\r])', 'borderRadius: R.xl'),
        (r'borderRadius:\s*2(?=\s*[,}\n\r])', 'borderRadius: R.lg'),
        (r'borderRadius:\s*1\.5(?=\s*[,}\n\r])', 'borderRadius: R.md'),
        (r'borderRadius:\s*1(?=\s*[,}\n\r])', 'borderRadius: R.sm'),
    ]
    
    for pattern, replacement in replacements:
        matches = re.findall(pattern, content)
        if matches:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                file_changes.append(f'  {replacement} ({len(matches)}x)')
                content = new_content
    
    # 2. Remove redundant borderRadius when ...S.GLASS is spread  
    # Match: ...S.GLASS, borderRadius: R.xxx  or  ...S.GLASS, other, borderRadius: R.xxx
    before = content
    content = re.sub(r'(\.\.\.\s*S\.GLASS\w*),\s*borderRadius:\s*R\.\w+', r'\1', content)
    if content != before:
        file_changes.append('  Removed redundant borderRadius in S.GLASS spread')
    
    # 3. Ensure designTokens import exists with needed symbols
    needs_R = bool(re.search(r'\bR\.(lg|md|sm|xs|xl)\b', content))
    has_dt_import = "designTokens'" in content or 'designTokens"' in content
    
    if needs_R and not has_dt_import:
        import_matches = list(re.finditer(r"^import\s+.+;\s*$", content, re.MULTILINE))
        if import_matches:
            last_end = import_matches[-1].end()
            new_import = "\nimport { C, useAdminStyles, R } from '../../theme/designTokens';"
            content = content[:last_end] + new_import + content[last_end:]
            file_changes.append('  Added designTokens import')
    elif needs_R and has_dt_import:
        dt_match = re.search(r"import\s*\{([^}]*)\}\s*from\s*'[^']*designTokens'", content)
        if dt_match:
            imports_str = dt_match.group(1)
            missing = []
            if not re.search(r'\bR\b', imports_str):
                missing.append('R')
            if 'useAdminStyles' not in imports_str:
                missing.append('useAdminStyles')
            if not re.search(r'\bC\b', imports_str):
                missing.append('C')
            if missing:
                new_imports = imports_str.rstrip() + ', ' + ', '.join(missing)
                old_full = dt_match.group(0)
                new_full = old_full.replace('{' + dt_match.group(1) + '}', '{ ' + new_imports.strip() + ' }')
                content = content.replace(old_full, new_full, 1)
                file_changes.append(f'  Added {missing} to designTokens import')
    
    # 4. Ensure useTheme is imported if needed
    needs_theme = needs_R and 'useTheme' not in content
    if needs_theme:
        mui_match = re.search(r"(import\s*\{)([^}]*)(}\s*from\s*'@mui/material')", content, re.DOTALL)
        if mui_match:
            old_imports = mui_match.group(2)
            if 'useTheme' not in old_imports:
                new_full = mui_match.group(1) + old_imports.rstrip() + ',\n  useTheme,\n' + mui_match.group(3)
                content = content.replace(mui_match.group(0), new_full, 1)
                file_changes.append('  Added useTheme to MUI import')
    
    # 5. Add S = useAdminStyles(theme) if needed
    has_S_call = 'useAdminStyles(theme)' in content
    has_theme_call = 'useTheme()' in content
    
    if needs_R and not has_S_call:
        if has_theme_call:
            content = re.sub(
                r'(const theme\s*=\s*useTheme\(\)\s*;)',
                r'\1\n  const S = useAdminStyles(theme);',
                content, count=1
            )
            file_changes.append('  Added const S = useAdminStyles(theme)')
        else:
            # Find component function declaration
            func_match = re.search(r'(export\s+(?:default\s+)?(?:const|function)\s+\w+\s*=?\s*\([^)]*\)\s*(?:=>\s*)?\{)', content)
            if func_match:
                insert_pos = func_match.end()
                content = content[:insert_pos] + '\n  const theme = useTheme();\n  const S = useAdminStyles(theme);' + content[insert_pos:]
                file_changes.append('  Added theme + S declarations')
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as fh:
            fh.write(content)
        changes_log.append(f'{rel}: {len(file_changes)} changes')
        for c in file_changes:
            changes_log.append(c)
    else:
        changes_log.append(f'{rel}: no changes needed')

print('\n'.join(changes_log))
