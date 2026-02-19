/**
 * ContactRequestsTab Component Tests
 * Verifies list shows Entity and Name with fallbacks and View button aria-label.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../../test/utils';
import { ContactRequestsTab } from '../ContactRequestsTab';
import { createMockContactRequest } from '../../../test/factories';
import type { ContactRequest } from '../../../types/backoffice';

describe('ContactRequestsTab', () => {
  const onApprove = vi.fn();
  const onReject = vi.fn();
  const onDelete = vi.fn();
  const onOpenNDA = vi.fn().mockResolvedValue(undefined);

  const defaultProps = {
    contactRequests: [] as ContactRequest[],
    loading: false,
    connectionStatus: 'connected' as const,
    onRefresh: vi.fn(),
    onApprove,
    onReject,
    onDelete,
    onOpenNDA,
    onIpLookup: vi.fn(),
    actionLoading: null as string | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no contact requests', () => {
    render(<ContactRequestsTab {...defaultProps} />);

    expect(screen.getByText('No contact requests')).toBeInTheDocument();
  });

  it('should show loading skeletons when loading', () => {
    render(<ContactRequestsTab {...defaultProps} loading={true} />);

    const skeletons = document.querySelectorAll('.card_contact_request_list.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('should display entityName and contactName for each request', () => {
    const requests: ContactRequest[] = [
      createMockContactRequest({
        id: '1',
        entityName: 'Company A',
        contactName: 'Alice',
      }),
      createMockContactRequest({
        id: '2',
        entityName: 'Company B',
        contactName: 'Bob',
      }),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Company B')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show fallback "---" when entityName is missing', () => {
    const requests: ContactRequest[] = [
      createMockContactRequest({
        id: '1',
        entityName: undefined as unknown as string,
        contactName: 'Only Name',
      }),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    expect(screen.getByText('Only Name')).toBeInTheDocument();
    const row = document.querySelector('.card_contact_request_list');
    expect(row).toBeTruthy();
    expect(row?.textContent).toContain('---');
  });

  it('should show fallback "---" when contactName is missing', () => {
    const requests: ContactRequest[] = [
      createMockContactRequest({
        id: '1',
        entityName: 'Entity Only',
        contactName: undefined,
      }),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    expect(screen.getByText('Entity Only')).toBeInTheDocument();
    const row = document.querySelector('.card_contact_request_list');
    expect(row?.textContent).toContain('---');
  });

  it('should use safe aria-label for View button when entityName is present', () => {
    const requests: ContactRequest[] = [
      createMockContactRequest({
        id: 'req-1',
        entityName: 'Acme Corp',
        contactEmail: 'user@acme.com',
      }),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for Acme Corp',
    });
    expect(viewButton).toBeInTheDocument();
  });

  it('should use contactEmail fallback in View button aria-label when entityName is missing', () => {
    const requests: ContactRequest[] = [
      createMockContactRequest({
        id: 'req-1',
        entityName: undefined as unknown as string,
        contactEmail: 'fallback@test.com',
      }),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for fallback@test.com',
    });
    expect(viewButton).toBeInTheDocument();
  });

  it('should use id fallback in View button aria-label when entityName and contactEmail missing', () => {
    const requests: ContactRequest[] = [
      createMockContactRequest({
        id: 'req-xyz',
        entityName: undefined as unknown as string,
        contactEmail: undefined as unknown as string,
      }),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for req-xyz',
    });
    expect(viewButton).toBeInTheDocument();
  });

  it('should open view modal when View button is clicked', () => {
    const requests: ContactRequest[] = [
      createMockContactRequest({
        id: 'req-1',
        entityName: 'Test Entity',
        contactName: 'Test User',
      }),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for Test Entity',
    });
    fireEvent.click(viewButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Contact Request')).toBeInTheDocument();
    expect(within(dialog).getByText('Test Entity')).toBeInTheDocument();
    expect(within(dialog).getByText('Test User')).toBeInTheDocument();
  });
});
