/**
 * Backoffice-specific type definitions
 * Shared types for backoffice components and pages
 */

import type { CertificateType } from './index';

/**
 * Contact Request interface.
 * Used across BackofficeOnboardingPage and ContactRequestsTab.
 * Client/request state: use ONLY userRole (NDA, KYC, REJECTED). Do not use request_type.
 */
export interface ContactRequest {
  id: string;
  entityName: string;
  contactEmail: string;
  contactName?: string;
  position: string;
  ndaFileName?: string;
  submitterIp?: string;
  /** Sole source for request state; values NDA, KYC, REJECTED (aligned with UserRole). */
  userRole: string;
  notes?: string;
  createdAt: string;
}

/**
 * Pending User Response from API
 * Response format from backofficeApi.getPendingUsers()
 */
export interface PendingUserResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  entityName?: string;
  documentsCount?: number;
  createdAt?: string;
}

/**
 * Pending Deposit Response from API
 * Response format from backofficeApi.getPendingDeposits()
 * Note: This extends Deposit but may have additional fields
 */
export interface PendingDepositResponse {
  id: string;
  entityId: string;
  entityName?: string;
  userEmail?: string;
  userRole?: string;  // Reporting user's role (client status); FUNDING when announced
  reportedAmount?: number | null;
  reportedCurrency?: string | null;
  wireReference?: string | null;
  bankReference?: string | null;
  status: string;
  reportedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

/**
 * User Trade Response from API
 * Response format from backofficeApi.getUserTrades()
 */
export interface UserTradeResponse {
  id: string;
  tradeType?: string;
  type?: string;
  certificateType?: CertificateType;
  certificate?: CertificateType;
  quantity?: number;
  totalValue?: number;
  value?: number;
  pricePerUnit?: number;
  status?: string;
  isBuyer?: boolean;
  side?: 'buy' | 'sell';
  createdAt?: string;
  timestamp?: string;
}

/**
 * KYC User interface
 * Used in BackofficeOnboardingPage for KYC review
 */
export interface KYCUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  entityName?: string;
  documentsCount: number;
  createdAt: string;
}

/**
 * KYC Document interface
 * Used in BackofficeOnboardingPage for document review
 */
export interface KYCDocument {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  documentType: string;
  fileName: string;
  mimeType?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

/**
 * Pending Deposit interface
 * Internal format used in PendingDepositsTab
 * Client state: use ONLY userRole; single source of truth.
 */
export interface PendingDeposit {
  id: string;
  entityId: string;
  entityName: string;
  userEmail: string;
  userRole?: string;  // Reporting user's role (client status); FUNDING when announced
  reportedAmount: number | null;
  reportedCurrency: string | null;
  wireReference: string | null;
  bankReference: string | null;
  status: string;
  reportedAt: string | null;
  notes: string | null;
  createdAt: string;
}

/**
 * User Trade interface
 * Internal format used in BackofficeOnboardingPage for user details
 */
export interface UserTrade {
  id: string;
  tradeType: string;
  certificateType: string;
  quantity: number;
  totalValue: number;
  status: string;
  isBuyer: boolean;
  createdAt: string;
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
