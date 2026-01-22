/**
 * Component Registry Types and Utilities
 * Provides type-safe access to the auto-generated component registry
 */

export interface ComponentProp {
  name: string;
  type: string;
  optional: boolean;
}

export interface ComponentMetadata {
  name: string;
  category: string;
  path: string;
  importPath: string;
  props: ComponentProp[];
  description: string;
}

export interface ComponentRegistry {
  version: string;
  generatedAt: string;
  components: ComponentMetadata[];
  categories: string[];
}

// Import the generated registry
import registryData from '../component-registry.json';

export const componentRegistry: ComponentRegistry = registryData as ComponentRegistry;

/**
 * Get all components for a specific category
 * @param category - The category name (e.g., 'common', 'cash-market')
 * @returns Array of components in that category
 */
export function getComponentsByCategory(category: string): ComponentMetadata[] {
  return componentRegistry.components.filter(c => c.category === category);
}

/**
 * Search components by name or description
 * @param query - Search query string
 * @returns Array of matching components
 */
export function searchComponents(query: string): ComponentMetadata[] {
  const lowerQuery = query.toLowerCase();
  return componentRegistry.components.filter(c =>
    c.name.toLowerCase().includes(lowerQuery) ||
    c.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get component metadata by exact name
 * @param name - Component name
 * @returns Component metadata or undefined if not found
 */
export function getComponent(name: string): ComponentMetadata | undefined {
  return componentRegistry.components.find(c => c.name === name);
}

/**
 * Get all available categories
 * @returns Array of category names
 */
export function getCategories(): string[] {
  return componentRegistry.categories;
}

/**
 * Get total number of components in the registry
 * @returns Total component count
 */
export function getComponentCount(): number {
  return componentRegistry.components.length;
}
