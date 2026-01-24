import { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { ComponentMetadata } from '../tools/component-registry';

interface CodeGeneratorProps {
  component: ComponentMetadata | null;
  props: Record<string, any>;
}

type Language = 'tsx' | 'jsx';

export function CodeGenerator({ component, props }: CodeGeneratorProps) {
  const [language, setLanguage] = useState<Language>('tsx');
  const [copied, setCopied] = useState(false);

  // Empty state when no component selected
  if (!component) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <Code2 className="h-16 w-16 text-navy-300 dark:text-navy-600" />
        <p className="text-center text-navy-600 dark:text-navy-400">
          Select a component to see generated code
        </p>
      </div>
    );
  }

  // Generate import statement
  const importStatement = `import { ${component.name} } from '@/components/${component.category}/${component.name}';`;

  // Generate props string
  const propsString = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      }
      if (typeof value === 'boolean') {
        return value ? key : '';  // True: just prop name, False: omit
      }
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter(Boolean)
    .join('\n  ');

  // Generate component usage
  const componentUsage = propsString
    ? `<${component.name}\n  ${propsString}\n/>`
    : `<${component.name} />`;

  // Final generated code
  const generatedCode = `${importStatement}\n\n${componentUsage}`;

  // Calculate stats
  const propsCount = Object.entries(props).filter(
    ([, value]) => value !== undefined && value !== ''
  ).length;
  const lineCount = generatedCode.split('\n').length;

  // Copy to clipboard handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-navy-600 dark:text-navy-400" />
          <h3 className="text-base font-semibold text-navy-900 dark:text-white">
            Generated Code
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="inline-flex rounded-lg bg-navy-100 dark:bg-navy-700 p-1">
            <button
              onClick={() => setLanguage('tsx')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                language === 'tsx'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              TSX
            </button>
            <button
              onClick={() => setLanguage('jsx')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                language === 'jsx'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-navy-600 dark:text-navy-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              JSX
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 hover:shadow-xl"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 bg-[#1e1e1e]">
        <Editor
          height="100%"
          language={language === 'tsx' ? 'typescript' : 'javascript'}
          value={generatedCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 }
          }}
        />
      </div>

      {/* Footer Stats */}
      <div className="flex items-center gap-6 border-t border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-navy-600 dark:text-navy-400">
          <span className="font-medium">Props:</span>
          <span className="font-mono">{propsCount}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-navy-600 dark:text-navy-400">
          <span className="font-medium">Lines:</span>
          <span className="font-mono">{lineCount}</span>
        </div>
      </div>
    </div>
  );
}
