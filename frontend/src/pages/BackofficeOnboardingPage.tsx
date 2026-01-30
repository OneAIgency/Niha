import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  Users,
  AlertCircle,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Banknote,
} from 'lucide-react';
import { Button } from '../components/common';
import { BackofficeLayout } from '../components/layout';
import {
  ContactRequestsTab,
  PendingDepositsTab,
  DocumentViewerModal,
  KYCReviewTab,
  IPLookupModal,
} from '../components/backoffice';
import { adminApi, backofficeApi } from '../services/api';
import { cn } from '../utils';
import { useBackofficeRealtime } from '../hooks/useBackofficeRealtime';
import { isPendingContactRequest } from '../utils/contactRequest';
import { logger } from '../utils/logger';
import type {
  ContactRequest,
  PendingUserResponse,
  KYCUser,
  KYCDocument,
  PendingDeposit,
  DocumentViewerState,
} from '../types/backoffice';

interface IPLookupResult {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

type OnboardingSubpage = 'requests' | 'kyc' | 'deposits';

const ONBOARDING_SUBPAGES: { path: OnboardingSubpage; label: string; icon: React.ElementType }[] = [
  { path: 'requests', label: 'Contact Requests', icon: Users },
  { path: 'kyc', label: 'KYC Review', icon: FileText },
  { path: 'deposits', label: 'Deposits/AML', icon: Banknote },
];

function getOnboardingSubpage(pathname: string): OnboardingSubpage {
  if (pathname.endsWith('/kyc') || pathname.includes('/onboarding/kyc')) return 'kyc';
  if (pathname.endsWith('/deposits') || pathname.includes('/onboarding/deposits')) return 'deposits';
  return 'requests';
}

export function BackofficeOnboardingPage() {
  const { pathname } = useLocation();
  const activeSubpage = getOnboardingSubpage(pathname);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    contactRequests: realtimeContactRequests,
    connectionStatus,
    refresh: refreshContactRequests,
  } = useBackofficeRealtime();

  const allMapped: ContactRequest[] = realtimeContactRequests.map(r => ({
    id: r.id,
    entity_name: r.entity_name,
    contact_email: r.contact_email,
    contact_name: r.contact_name,
    position: r.position || '',
    nda_file_name: r.nda_file_name,
    submitter_ip: r.submitter_ip,
    user_role: ('user_role' in r ? r.user_role : (r as { status?: string }).status) ?? 'new',
    notes: r.notes,
    created_at: r.created_at,
  }));
  // Only show pending requests (NDA, new); KYC and REJECTED disappear immediately after approval
  const contactRequests: ContactRequest[] = allMapped.filter(r =>
    isPendingContactRequest(r.user_role)
  );
  const contactRequestsCount = contactRequests.length;

  const [kycUsers, setKycUsers] = useState<KYCUser[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
  const [showDocumentViewer, setShowDocumentViewer] = useState<DocumentViewerState | null>(null);
  const [documentContentUrl, setDocumentContentUrl] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [ipLookupData, setIpLookupData] = useState<IPLookupResult | null>(null);
  const [ipLookupLoading, setIpLookupLoading] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeSubpage === 'kyc') {
        const [users, docs] = await Promise.all([
          backofficeApi.getPendingUsers(),
          backofficeApi.getKYCDocuments(),
        ]);
        setKycUsers(users.map((u: PendingUserResponse & { firstName?: string; lastName?: string; entityName?: string; documentsCount?: number; createdAt?: string }): KYCUser => ({
          id: u.id,
          email: u.email,
          first_name: u.first_name ?? u.firstName ?? '',
          last_name: u.last_name ?? u.lastName ?? '',
          entity_name: u.entity_name ?? u.entityName ?? '',
          documents_count: u.documents_count ?? u.documentsCount ?? 0,
          created_at: u.created_at ?? u.createdAt ?? new Date().toISOString(),
        })));
        // API response is camelCase; normalize so getUserDocuments and KYCReviewPanel work
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setKycDocuments((docs as any[]).map((d: any) => ({
          ...d,
          id: d.id,
          status: d.status,
          created_at: d.created_at ?? d.createdAt,
          user_id: d.user_id ?? d.userId,
          document_type: d.document_type ?? d.documentType,
          file_name: d.file_name ?? d.fileName,
        })));
      } else if (activeSubpage === 'deposits') {
        const deposits = await backofficeApi.getPendingDeposits();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPendingDeposits(deposits.map((d: any): PendingDeposit => ({
          id: d.id,
          entity_id: d.entity_id ?? d.entityId ?? '',
          entity_name: d.entity_name ?? d.entityName ?? '',
          user_email: d.user_email ?? d.userEmail ?? '',
          user_role: d.user_role ?? d.userRole,
          reported_amount: d.reported_amount ?? d.reportedAmount ?? null,
          reported_currency: d.reported_currency ?? d.reportedCurrency ?? null,
          wire_reference: d.wire_reference ?? d.wireReference ?? null,
          bank_reference: d.bank_reference ?? d.bankReference ?? null,
          status: d.status,
          reported_at: d.reported_at ?? d.reportedAt ?? null,
          notes: d.notes ?? null,
          created_at: d.created_at ?? d.createdAt ?? '',
        })));
      }
    } catch (err) {
      logger.error('Failed to load data', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeSubpage]);

  useEffect(() => {
    if (activeSubpage !== 'requests') {
      loadData();
    } else {
      setLoading(realtimeContactRequests.length === 0 && connectionStatus === 'connecting');
    }
  }, [activeSubpage, realtimeContactRequests.length, connectionStatus, loadData]);

  const handleRefresh = () => {
    if (activeSubpage === 'requests') {
      refreshContactRequests();
    } else {
      loadData();
    }
  };

  const handleOpenNDA = async (requestId: string) => {
    setActionLoading(`open-${requestId}`);
    try {
      const request = contactRequests.find(r => r.id === requestId);
      if (request?.nda_file_name) {
        await adminApi.openNDAInBrowser(requestId, request.nda_file_name);
      }
    } catch (err) {
      logger.error('Failed to open NDA', err);
      setError(
        err instanceof Error && err.message === 'POPUP_BLOCKED'
          ? 'Allow pop-ups for this site and try again.'
          : 'Failed to open NDA file'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleIpLookup = async (ip: string) => {
    if (!ip || ip === 'null' || ip === 'None') {
      setError('Invalid IP address');
      return;
    }
    setIpLookupLoading(true);
    setShowIpModal(true);
    try {
      const data = await adminApi.lookupIP(ip);
      setIpLookupData(data);
    } catch (err) {
      logger.error('Failed to lookup IP', err);
      setIpLookupData(null);
      setError('Failed to lookup IP address');
    } finally {
      setIpLookupLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(`reject-${requestId}`);
    try {
      await adminApi.updateContactRequest(requestId, { user_role: 'REJECTED' });
    } catch (err) {
      logger.error('Failed to reject request', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveRequest = async () => {
    refreshContactRequests();
  };

  const handleDeleteRequest = async (requestId: string) => {
    setActionLoading(`delete-${requestId}`);
    try {
      await adminApi.deleteContactRequest(requestId);
    } catch (err) {
      logger.error('Failed to delete request', err);
      setError('Failed to delete contact request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDeposit = async (depositId: string, amount: number, currency: string, notes?: string) => {
    setActionLoading(`confirm-${depositId}`);
    try {
      await backofficeApi.confirmDeposit(depositId, amount, currency, notes);
      setPendingDeposits(prev => prev.filter(d => d.id !== depositId));
    } catch (err) {
      logger.error('Failed to confirm deposit', err);
      setError('Failed to confirm deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    setActionLoading(`reject-${depositId}`);
    try {
      await backofficeApi.rejectDeposit(depositId);
      setPendingDeposits(prev => prev.filter(d => d.id !== depositId));
    } catch (err) {
      logger.error('Failed to reject deposit', err);
      setError('Failed to reject deposit');
    } finally {
      setActionLoading(null);
    }
  };

  const loadDocumentContent = async (documentId: string) => {
    setDocumentLoading(true);
    setDocumentError(null);
    setDocumentContentUrl(null);
    try {
      const blob = await backofficeApi.getDocumentContent(documentId);
      const url = URL.createObjectURL(blob);
      setDocumentContentUrl(url);
    } catch (err) {
      logger.error('Failed to load document', err);
      setDocumentError('Failed to load document preview');
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleOpenDocumentViewer = (doc: KYCDocument) => {
    setShowDocumentViewer({
      id: doc.id,
      fileName: doc.file_name,
      type: doc.document_type,
      mimeType: doc.mime_type,
    });
    loadDocumentContent(doc.id);
  };

  const handleCloseDocumentViewer = () => {
    if (documentContentUrl) URL.revokeObjectURL(documentContentUrl);
    setShowDocumentViewer(null);
    setDocumentContentUrl(null);
    setDocumentError(null);
  };

  const handleDownloadDocument = () => {
    if (!showDocumentViewer || !documentContentUrl) return;
    const link = document.createElement('a');
    link.href = documentContentUrl;
    link.download = showDocumentViewer.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveKYC = async (userId: string) => {
    setActionLoading(userId);
    try {
      await backofficeApi.approveUser(userId);
      setKycUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      logger.error('Failed to approve user', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectKYC = async (userId: string) => {
    setActionLoading(userId);
    try {
      await backofficeApi.rejectUser(userId, 'KYC verification failed');
      setKycUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      logger.error('Failed to reject user', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewDocument = async (docId: string, status: 'approved' | 'rejected', notes?: string) => {
    setActionLoading(docId);
    try {
      await backofficeApi.reviewDocument(docId, status, notes);
      setKycDocuments(prev =>
        prev.map(d => (d.id === docId ? { ...d, status } : d))
      );
    } catch (err) {
      logger.error('Failed to review document', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getUserDocuments = (userId: string) =>
    kycDocuments.filter(d => d.user_id === userId);

  const subSubHeaderLeft = (
    <nav className="flex items-center gap-2" aria-label="Onboarding subpages">
      {ONBOARDING_SUBPAGES.map(({ path, label, icon: Icon }) => {
        const to = `/backoffice/onboarding/${path}`;
        const isActive = activeSubpage === path;
        const count = path === 'requests' ? contactRequestsCount : path === 'kyc' ? kycUsers.length : pendingDeposits.length;
        return (
          <Link
            key={path}
            to={to}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            title={label}
            className={cn(
              'group subsubheader-nav-btn flex items-center gap-2',
              isActive ? 'subsubheader-nav-btn-active' : 'subsubheader-nav-btn-inactive'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
            {count > 0 && (
              <span className="subsubheader-nav-badge" aria-label={`${count} items`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const subSubHeaderRight = (
    <div className="flex items-center gap-2">
      {activeSubpage === 'requests' && (
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium',
            connectionStatus === 'connected' && 'bg-navy-700 text-navy-300',
            connectionStatus === 'connecting' && 'bg-navy-700 text-navy-400',
            connectionStatus === 'disconnected' && 'bg-navy-700 text-navy-400',
            connectionStatus === 'error' && 'bg-red-500/20 text-red-400'
          )}
        >
          {connectionStatus === 'connected' ? (
            <><Wifi className="w-3 h-3" /> Live</>
          ) : connectionStatus === 'connecting' ? (
            <><RefreshCw className="w-3 h-3 animate-spin" /> Connecting...</>
          ) : connectionStatus === 'error' ? (
            <><WifiOff className="w-3 h-3" /> Error</>
          ) : (
            <><WifiOff className="w-3 h-3" /> Offline</>
          )}
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        icon={<RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />}
      >
        Refresh
      </Button>
    </div>
  );

  return (
    <BackofficeLayout
      subSubHeaderLeft={subSubHeaderLeft}
      subSubHeader={subSubHeaderRight}
    >
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto p-1 rounded-xl text-navy-400 hover:bg-navy-700 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeSubpage === 'requests' && (
        <ContactRequestsTab
          contactRequests={contactRequests}
          loading={loading}
          connectionStatus={connectionStatus}
          onRefresh={handleRefresh}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          onDelete={handleDeleteRequest}
          onOpenNDA={handleOpenNDA}
          onIpLookup={handleIpLookup}
          actionLoading={actionLoading}
        />
      )}

      {activeSubpage === 'kyc' && (
        <KYCReviewTab
          kycUsers={kycUsers}
          kycDocuments={kycDocuments}
          loading={loading}
          actionLoading={actionLoading}
          onApproveKYC={handleApproveKYC}
          onRejectKYC={handleRejectKYC}
          onReviewDocument={handleReviewDocument}
          onOpenDocumentViewer={handleOpenDocumentViewer}
          getUserDocuments={getUserDocuments}
          setActionLoading={setActionLoading}
        />
      )}

      {activeSubpage === 'deposits' && (
        <PendingDepositsTab
          pendingDeposits={pendingDeposits}
          loading={loading}
          onConfirm={handleConfirmDeposit}
          onReject={handleRejectDeposit}
          actionLoading={actionLoading}
        />
      )}

      <DocumentViewerModal
        document={showDocumentViewer}
        documentContentUrl={documentContentUrl}
        documentError={documentError}
        documentLoading={documentLoading}
        onClose={handleCloseDocumentViewer}
        onDownload={handleDownloadDocument}
        onRetry={showDocumentViewer ? () => loadDocumentContent(showDocumentViewer.id) : undefined}
      />

      <IPLookupModal
        isOpen={showIpModal}
        onClose={() => {
          setShowIpModal(false);
          setIpLookupData(null);
        }}
        ipLookupData={ipLookupData}
        ipLookupLoading={ipLookupLoading}
      />
    </BackofficeLayout>
  );
}
