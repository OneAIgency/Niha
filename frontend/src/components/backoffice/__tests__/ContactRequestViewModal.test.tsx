/**
 * ContactRequestViewModal Component Tests
 * Verifies all contact request fields are shown and NDA link/button is present when applicable.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/utils';
import { ContactRequestViewModal } from '../ContactRequestViewModal';
import { createMockContactRequest } from '../../../test/factories';

describe('ContactRequestViewModal', () => {
  const onClose = vi.fn();
  const onOpenNDA = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    const request = createMockContactRequest();
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={false}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should not render when open but request is null', () => {
    render(
      <ContactRequestViewModal
        request={null}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render dialog with title when open and request provided', () => {
    const request = createMockContactRequest();
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Contact Request')).toBeInTheDocument();
  });

  it('should display all contact request fields', () => {
    const request = createMockContactRequest({
      id: 'req-123',
      entityName: 'Acme Corp',
      contactName: 'Jane Doe',
      contactEmail: 'jane@acme.com',
      position: 'Director',
      userRole: 'NDA',
      notes: 'Optional notes',
      createdAt: '2026-01-15T10:00:00Z',
    });
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
      />
    );

    // Contact section
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Director')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();

    // Request section
    expect(screen.getByText('req-123')).toBeInTheDocument();
    expect(screen.getByText('Optional notes')).toBeInTheDocument();
  });

  it('should show NDA section and open button when ndaFileName is set', () => {
    const request = createMockContactRequest({
      ndaFileName: 'agreement.pdf',
    });
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
      />
    );

    expect(screen.getByText('NDA Document')).toBeInTheDocument();
    const openButton = screen.getByRole('button', {
      name: /Open NDA agreement\.pdf/i,
    });
    expect(openButton).toBeInTheDocument();

    fireEvent.click(openButton);
    expect(onOpenNDA).toHaveBeenCalledWith(request.id);
  });

  it('should not show NDA section when ndaFileName is missing', () => {
    const request = createMockContactRequest({ ndaFileName: undefined });
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
      />
    );

    expect(screen.queryByText('NDA Document')).not.toBeInTheDocument();
  });

  it('should call onClose when Close button is clicked', async () => {
    const request = createMockContactRequest();
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
      />
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable NDA open button when openNDALoading is true', () => {
    const request = createMockContactRequest({ ndaFileName: 'doc.pdf' });
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
        openNDALoading={true}
      />
    );

    const openButton = screen.getByRole('button', {
      name: /Open NDA doc\.pdf/i,
    });
    expect(openButton).toBeDisabled();
    expect(screen.getByText('Opening…')).toBeInTheDocument();
  });

  it('should show submitter IP and Lookup button when onIpLookup provided', () => {
    const onIpLookup = vi.fn();
    const request = createMockContactRequest({ submitterIp: '192.168.1.1' });
    render(
      <ContactRequestViewModal
        request={request}
        isOpen={true}
        onClose={onClose}
        onOpenNDA={onOpenNDA}
        onIpLookup={onIpLookup}
      />
    );

    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    const lookupButton = screen.getByRole('button', { name: /Lookup IP 192\.168\.1\.1/i });
    fireEvent.click(lookupButton);
    expect(onIpLookup).toHaveBeenCalledWith('192.168.1.1');
  });
});
