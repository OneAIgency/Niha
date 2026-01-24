import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import componentRegistry from '../component-registry.json';
import { searchComponents, getCategories } from '../tools/component-registry';
import { ComponentBrowserItem } from './ComponentBrowserItem';
import type { ComponentMetadata } from '../tools/component-registry';

interface ComponentBrowserProps {
  selectedComponent: ComponentMetadata | null;
  onSelectComponent: (component: ComponentMetadata) => void;
}

export function ComponentBrowser({ selectedComponent, onSelectComponent }: ComponentBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => getCategories(), []);

  const filteredComponents = useMemo(() => {
    let components = componentRegistry.components;

    // Filter by search query
    if (searchQuery) {
      components = searchComponents(searchQuery);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      components = components.filter(c => c.category === selectedCategory);
    }

    return components;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-navy-200 dark:border-navy-700 p-4">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">
          Components
        </h2>
        <p className="text-xs text-navy-600 dark:text-navy-400" aria-live="polite" aria-atomic="true">
          {filteredComponents.length} available
        </p>
      </div>

      {/* Search */}
      <div className="border-b border-navy-200 dark:border-navy-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search components"
            className="w-full rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 py-2 pl-10 pr-4 text-sm text-navy-900 dark:text-white placeholder-navy-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b border-navy-200 dark:border-navy-700 p-4">
        <label htmlFor="category-filter" className="text-xs font-medium text-navy-600 dark:text-navy-400">
          Category
        </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter components by category"
          className="mt-2 w-full rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-3 py-2 text-sm text-navy-900 dark:text-white transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {filteredComponents.length === 0 ? (
          <p className="text-center text-sm text-navy-500 dark:text-navy-500">
            No components found
          </p>
        ) : (
          filteredComponents.map((component) => (
            <ComponentBrowserItem
              key={`${component.category}-${component.name}`}
              component={component}
              isSelected={
                selectedComponent?.name === component.name &&
                selectedComponent?.category === component.category
              }
              onClick={() => onSelectComponent(component)}
            />
          ))
        )}
      </div>
    </div>
  );
}
