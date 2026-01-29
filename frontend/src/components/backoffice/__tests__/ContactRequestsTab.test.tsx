/**
 * ContactRequestsTab Component Tests
 * Verifies list shows Entity and Name with fallbacks and View button aria-label.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../../test/utils';
import { ContactRequestsTab } from '../ContactRequestsTab';
import { createMockContactRequest } from '../../../test/factories';
import type { ContactRequest } from '../../../types/backoffice';

function toContactRequest(
  mock: ReturnType<typeof createMockContactRequest>
): ContactRequest {
  return {
    ...mock,
    position: mock.position ?? '',
  };
}

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

  it('should display entity_name and contact_name for each request', () => {
    const requests: ContactRequest[] = [
      toContactRequest(
        createMockContactRequest({
          id: '1',
          entity_name: 'Company A',
          contact_name: 'Alice',
        })
      ),
      toContactRequest(
        createMockContactRequest({
          id: '2',
          entity_name: 'Company B',
          contact_name: 'Bob',
        })
      ),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Company B')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show fallback "—" when entity_name is missing', () => {
    const requests: ContactRequest[] = [
      toContactRequest(
        createMockContactRequest({
          id: '1',
          entity_name: undefined as unknown as string,
          contact_name: 'Only Name',
        })
      ),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    expect(screen.getByText('Only Name')).toBeInTheDocument();
    const row = document.querySelector('.card_contact_request_list');
    expect(row).toBeTruthy();
    expect(row?.textContent).toContain('—');
  });

  it('should show fallback "—" when contact_name is missing', () => {
    const requests: ContactRequest[] = [
      toContactRequest(
        createMockContactRequest({
          id: '1',
          entity_name: 'Entity Only',
          contact_name: undefined,
        })
      ),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    expect(screen.getByText('Entity Only')).toBeInTheDocument();
    const row = document.querySelector('.card_contact_request_list');
    expect(row?.textContent).toContain('—');
  });

  it('should use safe aria-label for View button when entity_name is present', () => {
    const requests: ContactRequest[] = [
      toContactRequest(
        createMockContactRequest({
          id: 'req-1',
          entity_name: 'Acme Corp',
          contact_email: 'user@acme.com',
        })
      ),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for Acme Corp',
    });
    expect(viewButton).toBeInTheDocument();
  });

  it('should use contact_email fallback in View button aria-label when entity_name is missing', () => {
    const requests: ContactRequest[] = [
      toContactRequest(
        createMockContactRequest({
          id: 'req-1',
          entity_name: undefined as unknown as string,
          contact_email: 'fallback@test.com',
        })
      ),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for fallback@test.com',
    });
    expect(viewButton).toBeInTheDocument();
  });

  it('should use id fallback in View button aria-label when entity_name and contact_email missing', () => {
    const requests: ContactRequest[] = [
      toContactRequest(
        createMockContactRequest({
          id: 'req-xyz',
          entity_name: undefined as unknown as string,
          contact_email: undefined as unknown as string,
        })
      ),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for req-xyz',
    });
    expect(viewButton).toBeInTheDocument();
  });

  it('should open view modal when View button is clicked', () => {
    const requests: ContactRequest[] = [
      toContactRequest(
        createMockContactRequest({
          id: 'req-1',
          entity_name: 'Test Entity',
          contact_name: 'Test User',
        })
      ),
    ];
    render(<ContactRequestsTab {...defaultProps} contactRequests={requests} />);

    const viewButton = screen.getByRole('button', {
      name: 'View details for Test Entity',
    });
    fireEvent.click(viewButton);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Contact request details')).toBeInTheDocument();
    expect(within(dialog).getByText('Test Entity')).toBeInTheDocument();
    expect(within(dialog).getByText('Test User')).toBeInTheDocument();
  });
});
