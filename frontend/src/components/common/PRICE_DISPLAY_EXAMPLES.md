# Price Display Components Usage Examples

## Overview

Two components have been created to display CEA and EUA prices in EUR from scraped sources:

- `CEAPriceDisplay` - Displays CEA (China Emissions Allowance) price in EUR
- `EUAPriceDisplay` - Displays EUA (EU Emissions Allowance) price in EUR

Both components automatically fetch prices from the backend scraping service using the `usePrices` hook.

## Usage in Subheader

```tsx
import { Subheader } from '../components/common';
import { CEAPriceDisplay, EUAPriceDisplay } from '../components/common';
import { TrendingUp } from 'lucide-react';

function MyPage() {
  return (
    <Subheader
      icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
      title="Market Overview"
      description="Current carbon prices"
    >
      {/* Display prices in the subheader */}
      <div className="flex items-center gap-4">
        <EUAPriceDisplay size="md" showLabel />
        <CEAPriceDisplay size="md" showLabel />
      </div>
    </Subheader>
  );
}
```

## Usage Standalone

```tsx
import { CEAPriceDisplay, EUAPriceDisplay } from '../components/common';

function PriceWidget() {
  return (
    <div className="flex items-center gap-6">
      <EUAPriceDisplay size="lg" showLabel />
      <CEAPriceDisplay size="lg" showLabel />
    </div>
  );
}
```

## Component Props

### CEAPriceDisplay & EUAPriceDisplay

Both components accept the same props:

- `className?: string` - Additional CSS classes
- `showLoading?: boolean` - Show loading state (default: true)
- `size?: 'sm' | 'md' | 'lg'` - Size variant (default: 'md')
- `showLabel?: boolean` - Show the label (CEA/EUA) (default: true)

## Features

- Automatically fetches prices from scraped sources via backend API
- Shows loading state while fetching
- Displays prices in EUR format
- Responsive design with size variants
- Dark mode compatible
- Type-safe with TypeScript
