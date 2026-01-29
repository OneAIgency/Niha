/**
 * ClientStatusBadge component tests.
 * Verifies role display, "—" when missing, and variant styling.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClientStatusBadge } from '../common/ClientStatusBadge';

describe('ClientStatusBadge', () => {
  it('renders role when provided', () => {
    render(<ClientStatusBadge role="FUNDING" />);
    expect(screen.getByText('FUNDING')).toBeInTheDocument();
  });

  it('renders "—" when role is undefined', () => {
    render(<ClientStatusBadge role={undefined} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders "—" when role is empty string', () => {
    render(<ClientStatusBadge role="" />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('applies variant classes for FUNDING (warning)', () => {
    render(<ClientStatusBadge role="FUNDING" />);
    const el = screen.getByText('FUNDING');
    expect(el).toHaveClass('bg-amber-100');
    expect(el).toHaveClass('text-amber-700');
  });

  it('applies variant classes for APPROVED (info)', () => {
    render(<ClientStatusBadge role="APPROVED" />);
    const el = screen.getByText('APPROVED');
    expect(el).toHaveClass('bg-blue-100');
    expect(el).toHaveClass('text-blue-700');
  });

  it('accepts optional className', () => {
    render(<ClientStatusBadge role="FUNDING" className="custom" />);
    const el = screen.getByText('FUNDING');
    expect(el).toHaveClass('custom');
  });
});
