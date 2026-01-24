import { RotateCcw } from 'lucide-react';
import type { ComponentMetadata } from '../tools/component-registry';
import { StringControl } from './prop-controls/StringControl';
import { BooleanControl } from './prop-controls/BooleanControl';
import { NumberControl } from './prop-controls/NumberControl';
import { SelectControl } from './prop-controls/SelectControl';

interface PropsPanelProps {
  component: ComponentMetadata | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPropsChange: (props: Record<string, any>) => void;
}

type ControlType = 'string' | 'boolean' | 'number' | 'select';

/**
 * Infer the appropriate control type from a TypeScript type string
 */
const inferControlType = (type: string): ControlType => {
  if (type.includes('boolean')) return 'boolean';
  if (type.includes('number')) return 'number';
  if (type.includes('|') && type.includes("'")) return 'select'; // Union of string literals
  return 'string';
};

/**
 * Extract string literal options from a union type
 * e.g., "'primary' | 'secondary' | 'ghost'" => ['primary', 'secondary', 'ghost']
 */
const extractOptions = (type: string): string[] => {
  const matches = type.match(/'([^']+)'/g);
  return matches ? matches.map(m => m.replace(/'/g, '')) : [];
};

export function PropsPanel({ component, props, onPropsChange }: PropsPanelProps) {
  // Handle prop value changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePropChange = (propName: string, value: any) => {
    onPropsChange({
      ...props,
      [propName]: value,
    });
  };

  // Reset all props to default values
  const handleReset = () => {
    onPropsChange({});
  };

  // Check if any props have been set
  const hasSetProps = Object.keys(props).length > 0;

  // Empty state: no component selected
  if (!component) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-center text-sm text-navy-600 dark:text-navy-400">
          No component selected
        </p>
      </div>
    );
  }

  // No props state: component has no configurable props
  if (component.props.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-4 py-3">
          <h3 className="text-lg font-bold text-navy-900 dark:text-white">
            Properties
          </h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-sm text-navy-600 dark:text-navy-400">
            This component has no configurable props
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 px-4 py-3">
        <h3 className="text-lg font-bold text-navy-900 dark:text-white">
          Properties
        </h3>
        <p className="mt-1 text-xs text-navy-600 dark:text-navy-400">
          {component.props.length} props available
        </p>
      </div>

      {/* Scrollable Body with Controls */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {component.props.map((prop) => {
            const controlType = inferControlType(prop.type);
            const currentValue = props[prop.name];

            switch (controlType) {
              case 'boolean':
                return (
                  <BooleanControl
                    key={prop.name}
                    label={prop.name}
                    value={currentValue ?? false}
                    optional={prop.optional}
                    onChange={(value) => handlePropChange(prop.name, value)}
                  />
                );

              case 'number':
                return (
                  <NumberControl
                    key={prop.name}
                    label={prop.name}
                    value={currentValue ?? 0}
                    optional={prop.optional}
                    onChange={(value) => handlePropChange(prop.name, value)}
                  />
                );

              case 'select': {
                const options = extractOptions(prop.type);
                return (
                  <SelectControl
                    key={prop.name}
                    label={prop.name}
                    value={currentValue ?? options[0]}
                    optional={prop.optional}
                    options={options}
                    onChange={(value) => handlePropChange(prop.name, value)}
                  />
                );
              }

              case 'string':
              default:
                return (
                  <StringControl
                    key={prop.name}
                    label={prop.name}
                    value={currentValue ?? ''}
                    optional={prop.optional}
                    onChange={(value) => handlePropChange(prop.name, value)}
                  />
                );
            }
          })}
        </div>
      </div>

      {/* Footer with Reset Button */}
      {hasSetProps && (
        <div className="border-t border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-4">
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-2 text-sm font-semibold text-navy-900 dark:text-white transition-all hover:border-navy-300 dark:hover:border-navy-500"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Props
          </button>
        </div>
      )}
    </div>
  );
}
