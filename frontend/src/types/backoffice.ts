/**
 * Backoffice-specific type definitions
 * Shared types for backoffice components and pages
 */

import type { CertificateType } from './index';

/**
 * Contact Request interface
 * Used across BackofficeOnboardingPage and ContactRequestsTab
 */
export interface ContactRequest {
  id: string;
  entity_name: string;
  contact_email: string;
  contact_name?: string;
  position: string;
  request_type: 'join' | 'nda';
  nda_file_name?: string;
  submitter_ip?: string;
  status: string;
  notes?: string;
  created_at: string;
}

/**
 * Pending User Response from API
 * Response format from backofficeApi.getPendingUsers()
 */
export interface PendingUserResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  entity_name?: string;
  documents_count?: number;
  created_at?: string;
}

/**
 * Pending Deposit Response from API
 * Response format from backofficeApi.getPendingDeposits()
 * Note: This extends Deposit but may have additional fields
 */
export interface PendingDepositResponse {
  id: string;
  entity_id: string;
  entity_name?: string;
  user_email?: string;
  reported_amount?: number | null;
  reported_currency?: string | null;
  wire_reference?: string | null;
  bank_reference?: string | null;
  status: string;
  reported_at?: string | null;
  notes?: string | null;
  created_at: string;
}

/**
 * User Trade Response from API
 * Response format from backofficeApi.getUserTrades()
 */
export interface UserTradeResponse {
  id: string;
  trade_type?: string;
  type?: string;
  certificate_type?: CertificateType;
  certificate?: CertificateType;
  quantity?: number;
  total_value?: number;
  value?: number;
  price_per_unit?: number;
  status?: string;
  is_buyer?: boolean;
  side?: 'buy' | 'sell';
  created_at?: string;
  timestamp?: string;
}

/**
 * KYC User interface
 * Used in BackofficeOnboardingPage for KYC review
 */
export interface KYCUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  entity_name?: string;
  documents_count: number;
  created_at: string;
}

/**
 * KYC Document interface
 * Used in BackofficeOnboardingPage for document review
 */
export interface KYCDocument {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  document_type: string;
  file_name: string;
  mime_type?: string;
  status: string;
  notes?: string;
  created_at: string;
}

/**
 * Pending Deposit interface
 * Internal format used in PendingDepositsTab
 */
export interface PendingDeposit {
  id: string;
  entity_id: string;
  entity_name: string;
  user_email: string;
  reported_amount: number | null;
  reported_currency: string | null;
  wire_reference: string | null;
  bank_reference: string | null;
  status: string;
  reported_at: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * User Trade interface
 * Internal format used in BackofficeOnboardingPage for user details
 */
export interface UserTrade {
  id: string;
  trade_type: string;
  certificate_type: string;
  quantity: number;
  total_value: number;
  status: string;
  is_buyer: boolean;
  created_at: string;
}

/**
 * Document Viewer State
 * Used in DocumentViewerModal
 */
export interface DocumentViewerState {
  id: string;
  fileName: string;
  type: string;
  mimeType?: string;
}
