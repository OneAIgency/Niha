import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label';
type TextVariant = 'pageTitle' | 'pageTitleSm' | 'sectionHeading' | 'sectionLabel' | 'body' | 'bodySmall' | 'caption' | 'mono' | 'monoLg' | 'muted';
type TextColor = 'default' | 'primary' | 'secondary' | 'muted' | 'positive' | 'negative' | 'eua' | 'cea';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  as?: TextElement;
  variant?: TextVariant;
  color?: TextColor;
  mono?: boolean;
}

const variantStyles: Record<TextVariant, string> = {
  pageTitle: 'page-title',
  pageTitleSm: 'page-title-sm',
  sectionHeading: 'section-heading',
  sectionLabel: 'section-label',
  body: 'text-navy-700 dark:text-navy-300',
  bodySmall: 'text-sm text-navy-600 dark:text-navy-400',
  caption: 'text-xs text-navy-500 dark:text-navy-400',
  mono: 'text-value',
  monoLg: 'text-value-lg',
  muted: 'text-muted',
};

const colorStyles: Record<TextColor, string> = {
  default: '',
  primary: 'text-navy-900 dark:text-white',
  secondary: 'text-navy-600 dark:text-navy-300',
  muted: 'text-navy-500 dark:text-navy-400',
  positive: 'price-positive',
  negative: 'price-negative',
  eua: 'text-blue-600 dark:text-blue-400',
  cea: 'text-amber-600 dark:text-amber-400',
};

const defaultElements: Record<TextVariant, TextElement> = {
  pageTitle: 'h1',
  pageTitleSm: 'h1',
  sectionHeading: 'h2',
  sectionLabel: 'span',
  body: 'p',
  bodySmall: 'p',
  caption: 'span',
  mono: 'span',
  monoLg: 'span',
  muted: 'span',
};

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ as, variant = 'body', color = 'default', mono, className, children, ...props }, ref) => {
    const Component = as || defaultElements[variant];

    return (
      <Component
        ref={ref as React.Ref<HTMLElement>}
        className={cn(
          variantStyles[variant],
          color !== 'default' && colorStyles[color],
          mono && 'font-mono',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Typography.displayName = 'Typography';
