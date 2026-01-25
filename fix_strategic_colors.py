#!/usr/bin/env python3
"""
Fix all inline color styles in StrategicAdvantagePage.tsx
Replace with Tailwind classes according to design system
"""

import re

def fix_colors(content):
    """Replace all inline color styles with Tailwind classes"""
    replacements = 0

    # Pattern 1: style={{ color: colors.xxx }} on same element with className
    # Replace with merged className
    patterns_color_only = [
        # colors.danger → text-red-600 dark:text-red-400
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.danger\s*}}',
         r'className="\1 text-red-600 dark:text-red-400"'),

        # colors.success → text-emerald-600 dark:text-emerald-400
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.success\s*}}',
         r'className="\1 text-emerald-600 dark:text-emerald-400"'),

        # colors.primary → text-emerald-500 dark:text-emerald-400
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.primary\s*}}',
         r'className="\1 text-emerald-500 dark:text-emerald-400"'),

        # colors.secondary → text-blue-500 dark:text-blue-400
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.secondary\s*}}',
         r'className="\1 text-blue-500 dark:text-blue-400"'),

        # colors.accent → text-violet-500 dark:text-violet-400
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.accent\s*}}',
         r'className="\1 text-violet-500 dark:text-violet-400"'),

        # colors.textPrimary → text-white
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.textPrimary\s*}}',
         r'className="\1 text-white"'),

        # colors.textSecondary → text-navy-600 dark:text-navy-400
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.textSecondary\s*}}',
         r'className="\1 text-navy-600 dark:text-navy-400"'),

        # colors.textMuted → text-navy-500 dark:text-navy-500
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.textMuted\s*}}',
         r'className="\1 text-navy-500 dark:text-navy-500"'),

        # colors.secondaryLight → text-blue-400
        (r'className="([^"]*?)"\s+style={{\s*color:\s*colors\.secondaryLight\s*}}',
         r'className="\1 text-blue-400"'),
    ]

    for pattern, replacement in patterns_color_only:
        content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
        replacements += count

    # Pattern 2: style={{ backgroundColor: colors.xxx }}
    bg_patterns = [
        (r'style={{\s*backgroundColor:\s*colors\.bgCard\s*}}',
         'className="bg-navy-800"'),

        (r'style={{\s*backgroundColor:\s*colors\.bgCardHover\s*}}',
         'className="bg-navy-700"'),

        (r'style={{\s*backgroundColor:\s*colors\.primary\s*}}',
         'className="bg-emerald-500"'),

        (r'style={{\s*backgroundColor:\s*colors\.success\s*}}',
         'className="bg-emerald-500"'),

        (r'style={{\s*backgroundColor:\s*colors\.accent\s*}}',
         'className="bg-violet-500"'),
    ]

    for pattern, replacement in bg_patterns:
        content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
        replacements += count

    # Pattern 3: style={{ borderColor: colors.xxx }}
    border_patterns = [
        (r'style={{\s*borderColor:\s*colors\.border\s*}}',
         'className="border-navy-200 dark:border-navy-600"'),

        (r'style={{\s*borderColor:\s*colors\.danger\s*}}',
         'className="border-red-500"'),

        (r'style={{\s*borderColor:\s*colors\.success\s*}}',
         'className="border-emerald-500"'),
    ]

    for pattern, replacement in border_patterns:
        content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
        replacements += count

    # Pattern 4: Standalone style={{ color: colors.xxx }} without className before it
    standalone_patterns = [
        (r'style={{\s*color:\s*colors\.danger\s*}}',
         'className="text-red-600 dark:text-red-400"'),

        (r'style={{\s*color:\s*colors\.success\s*}}',
         'className="text-emerald-600 dark:text-emerald-400"'),

        (r'style={{\s*color:\s*colors\.primary\s*}}',
         'className="text-emerald-500 dark:text-emerald-400"'),

        (r'style={{\s*color:\s*colors\.secondary\s*}}',
         'className="text-blue-500 dark:text-blue-400"'),

        (r'style={{\s*color:\s*colors\.accent\s*}}',
         'className="text-violet-500 dark:text-violet-400"'),

        (r'style={{\s*color:\s*colors\.textPrimary\s*}}',
         'className="text-white"'),

        (r'style={{\s*color:\s*colors\.textSecondary\s*}}',
         'className="text-navy-600 dark:text-navy-400"'),

        (r'style={{\s*color:\s*colors\.textMuted\s*}}',
         'className="text-navy-500 dark:text-navy-500"'),

        (r'style={{\s*color:\s*colors\.secondaryLight\s*}}',
         'className="text-blue-400"'),
    ]

    for pattern, replacement in standalone_patterns:
        content, count = re.subn(pattern, replacement, content, flags=re.MULTILINE)
        replacements += count

    # Pattern 5: Complex style objects (need manual review but replace colors)
    # Replace backgroundColor: item.issue ? `${colors.danger}20` : colors.bgCard
    content = re.sub(
        r'backgroundColor:\s*item\.issue\s*\?\s*`\${colors\.danger}20`\s*:\s*colors\.bgCard',
        'backgroundColor: item.issue ? "rgba(239, 68, 68, 0.125)" : "#1e293b"',
        content
    )

    # Replace border: item.issue ? `1px solid ${colors.danger}` : `1px solid ${colors.border}`
    content = re.sub(
        r'border:\s*item\.issue\s*\?\s*`1px solid \${colors\.danger}`\s*:\s*`1px solid \${colors\.border}`',
        'border: item.issue ? "1px solid rgb(239, 68, 68)" : "1px solid #475569"',
        content
    )

    # Pattern 6: Replace inline JSX conditionals with colors
    # color: item.issue ? colors.danger : colors.success
    content = re.sub(
        r'color:\s*item\.issue\s*\?\s*colors\.danger\s*:\s*colors\.success',
        'className={item.issue ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}',
        content
    )

    # Pattern 7: row.isTotal conditionals
    content = re.sub(
        r'color:\s*row\.isTotal\s*\?\s*[\'"]white[\'"]\s*:\s*colors\.success',
        'className={row.isTotal ? "text-white" : "text-emerald-600 dark:text-emerald-400"}',
        content
    )

    content = re.sub(
        r'color:\s*row\.isTotal\s*\?\s*[\'"]white[\'"]\s*:\s*colors\.textPrimary',
        'className={row.isTotal ? "text-white" : "text-white"}',
        content
    )

    content = re.sub(
        r'color:\s*row\.isTotal\s*\?\s*[\'"]white[\'"]\s*:\s*colors\.textSecondary',
        'className={row.isTotal ? "text-white" : "text-navy-600 dark:text-navy-400"}',
        content
    )

    # Pattern 8: backgroundColor conditionals
    content = re.sub(
        r'backgroundColor:\s*row\.isTotal\s*\?\s*colors\.primary\s*:\s*\(i\s*%\s*2\s*===\s*0\s*\?\s*colors\.bgCard\s*:\s*colors\.bgCardHover\)',
        'className={row.isTotal ? "bg-emerald-500" : (i % 2 === 0 ? "bg-navy-800" : "bg-navy-700")}',
        content
    )

    content = re.sub(
        r'backgroundColor:\s*i\s*%\s*2\s*===\s*0\s*\?\s*colors\.bgCard\s*:\s*colors\.bgCardHover',
        'className={i % 2 === 0 ? "bg-navy-800" : "bg-navy-700"}',
        content
    )

    # Pattern 9: activeStakeholder conditionals
    content = re.sub(
        r'backgroundColor:\s*activeStakeholder\s*===\s*s\.id\s*\?\s*colors\.primary\s*:\s*colors\.bgCard',
        'className={activeStakeholder === s.id ? "bg-emerald-500" : "bg-navy-800"}',
        content
    )

    content = re.sub(
        r'color:\s*activeStakeholder\s*===\s*s\.id\s*\?\s*[\'"]white[\'"]\s*:\s*colors\.textSecondary',
        'text-white',  # Will be added to className
        content
    )

    # Pattern 10: activeTab conditionals
    content = re.sub(
        r'backgroundColor:\s*activeTab\s*===\s*tab\.id\s*\?\s*colors\.primary\s*:\s*colors\.bgCard',
        'className={activeTab === tab.id ? "bg-emerald-500" : "bg-navy-800"}',
        content
    )

    content = re.sub(
        r'color:\s*activeTab\s*===\s*tab\.id\s*\?\s*[\'"]white[\'"]\s*:\s*colors\.textSecondary',
        'text-white',
        content
    )

    content = re.sub(
        r'border:\s*`1px solid \${activeTab\s*===\s*tab\.id\s*\?\s*colors\.primary\s*:\s*colors\.border}`',
        'border: activeTab === tab.id ? "1px solid #10b981" : "1px solid #475569"',
        content
    )

    # Pattern 11: Gradients and complex background styles (keep as-is but note them)
    # These are complex and need to stay as inline styles

    # Pattern 12: Border with colors
    content = re.sub(
        r'border:\s*`1px solid \${colors\.(\w+)}`',
        lambda m: f'className="border border-{{"primary": "emerald-500", "secondary": "blue-400", "success": "emerald-500", "border": "navy-200 dark:border-navy-600"}}.get(m.group(1), m.group(1))"',
        content
    )

    return content, replacements

def main():
    file_path = '/Users/victorsafta/work/Niha/frontend/src/pages/onboarding/StrategicAdvantagePage.tsx'

    with open(file_path, 'r', encoding='utf-8') as f:
        original_content = f.read()

    print(f"Original file size: {len(original_content)} characters")
    print(f"Fixing colors...")

    fixed_content, count = fix_colors(original_content)

    print(f"Made {count} direct replacements")

    # Count remaining issues
    remaining_danger = len(re.findall(r'colors\.danger', fixed_content))
    remaining_success = len(re.findall(r'colors\.success', fixed_content))
    remaining_primary = len(re.findall(r'colors\.primary', fixed_content))
    remaining_secondary = len(re.findall(r'colors\.secondary', fixed_content))
    remaining_text = len(re.findall(r'colors\.text', fixed_content))
    remaining_bg = len(re.findall(r'colors\.bg', fixed_content))
    remaining_border = len(re.findall(r'colors\.border', fixed_content))

    print(f"\nRemaining colors.xxx references:")
    print(f"  colors.danger: {remaining_danger}")
    print(f"  colors.success: {remaining_success}")
    print(f"  colors.primary: {remaining_primary}")
    print(f"  colors.secondary: {remaining_secondary}")
    print(f"  colors.text*: {remaining_text}")
    print(f"  colors.bg*: {remaining_bg}")
    print(f"  colors.border: {remaining_border}")
    print(f"  Total: {remaining_danger + remaining_success + remaining_primary + remaining_secondary + remaining_text + remaining_bg + remaining_border}")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed_content)

    print(f"\nFile updated successfully!")
    print(f"New file size: {len(fixed_content)} characters")

if __name__ == '__main__':
    main()
