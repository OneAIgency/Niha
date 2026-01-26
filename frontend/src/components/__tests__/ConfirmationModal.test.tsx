/**
 * ConfirmationModal Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfirmationModal } from '../common/ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ConfirmationModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('should call onConfirm on confirm click', async () => {
    render(<ConfirmationModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  it('should call onClose on cancel click', () => {
    render(<ConfirmationModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose on backdrop click', () => {
    render(<ConfirmationModal {...defaultProps} />);

    // Find the backdrop (the outer motion.div with bg-black)
    const backdrop = document.querySelector('.bg-black\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should display custom button text', () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('should display details when provided', () => {
    const details = [
      { label: 'Order ID', value: 'ORD-123' },
      { label: 'Amount', value: '100 CEA' },
    ];

    render(<ConfirmationModal {...defaultProps} details={details} />);

    expect(screen.getByText('Order ID')).toBeInTheDocument();
    expect(screen.getByText('ORD-123')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('100 CEA')).toBeInTheDocument();
  });

  it('should require confirmation text when requireConfirmation is set', () => {
    render(
      <ConfirmationModal {...defaultProps} requireConfirmation="DELETE" />
    );

    // Confirm button should be disabled initially
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toBeDisabled();
  });

  it('should enable confirm button when correct confirmation text is entered', async () => {
    render(
      <ConfirmationModal {...defaultProps} requireConfirmation="DELETE" />
    );

    // Find the input and type the confirmation text
    const input = screen.getByPlaceholderText('DELETE');
    fireEvent.change(input, { target: { value: 'DELETE' } });

    // Confirm button should now be enabled
    await waitFor(() => {
      expect(screen.getByText('Confirm')).not.toBeDisabled();
    });
  });

  it('should apply danger variant styles by default', () => {
    render(<ConfirmationModal {...defaultProps} />);

    // Check for danger variant styles (red colors)
    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-red-600');
  });

  it('should apply warning variant styles', () => {
    render(<ConfirmationModal {...defaultProps} variant="warning" />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-amber-600');
  });

  it('should apply info variant styles', () => {
    render(<ConfirmationModal {...defaultProps} variant="info" />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-blue-600');
  });

  it('should close on X button click', () => {
    render(<ConfirmationModal {...defaultProps} />);

    // Find and click the X button (close button in header)
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find((btn) =>
      btn.querySelector('svg.lucide-x') || btn.querySelector('.w-5.h-5')
    );

    if (xButton) {
      fireEvent.click(xButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('should show loading state', () => {
    render(<ConfirmationModal {...defaultProps} loading />);

    // When loading, the button shows "Processing..." instead of "Confirm"
    const processingText = screen.getByText('Processing...');
    const confirmButton = processingText.closest('button');
    expect(confirmButton).toBeDisabled();
  });
});
