/**
 * ThemeContainersPage smoke tests.
 * Verifies the page renders without error and shows key sections.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/utils';
import { ThemeContainersPage } from '../ThemeContainersPage';

describe('ThemeContainersPage', () => {
  it('renders without error', () => {
    expect(() => render(<ThemeContainersPage />)).not.toThrow();
  });

  it('shows page title and container sections', () => {
    render(<ThemeContainersPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Containers' })).toBeInTheDocument();
    expect(screen.getByText('Page containers')).toBeInTheDocument();
    expect(screen.getByText('Content containers')).toBeInTheDocument();
    expect(screen.getByText('Section / card wrapper')).toBeInTheDocument();
    expect(screen.getByText('Table containers')).toBeInTheDocument();
    expect(screen.getByText('Others')).toBeInTheDocument();
  });
});
