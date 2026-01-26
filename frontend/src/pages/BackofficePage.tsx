import { useState, useEffect } from 'react';
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
import { logger } from '../utils/logger';
import type {
  ContactRequest,
  PendingUserResponse,
  PendingDepositResponse,
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

type TabType = 'requests' | 'kyc' | 'deposits' | 'details';

export function BackofficePage() {
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use realtime hook for contact requests
  const {
    contactRequests: realtimeContactRequests,
    connectionStatus,
    refresh: refreshContactRequests,
  } = useBackofficeRealtime();

  // Map realtime data to local interface
  const contactRequests: ContactRequest[] = realtimeContactRequests.map(r => ({
    id: r.id,
    entity_name: r.entity_name,
    contact_email: r.contact_email,
    contact_name: r.contact_name,
    position: r.position || '',
    reference: r.reference,
    request_type: r.request_type,
    nda_file_name: r.nda_file_name,
    submitter_ip: r.submitter_ip,
    status: r.status,
    notes: r.notes,
    created_at: r.created_at,
  }));
  const contactRequestsCount = contactRequests.length;

  // KYC state
  const [kycUsers, setKycUsers] = useState<KYCUser[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);

  // User details state
  const [showDocumentViewer, setShowDocumentViewer] = useState<DocumentViewerState | null>(null);
  const [documentContentUrl, setDocumentContentUrl] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  // IP Lookup Modal state
  const [ipLookupData, setIpLookupData] = useState<IPLookupResult | null>(null);
  const [ipLookupLoading, setIpLookupLoading] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Deposits state
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);

  useEffect(() => {
    if (activeTab !== 'requests') {
      loadData();
    } else {
      setLoading(realtimeContactRequests.length === 0 && connectionStatus === 'connecting');
    }
  }, [activeTab, realtimeContactRequests.length, connectionStatus]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'kyc') {
        const [users, docs] = await Promise.all([
          backofficeApi.getPendingUsers(),
          backofficeApi.getKYCDocuments()
        ]);
        setKycUsers(users.map((u: PendingUserResponse): KYCUser => ({
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          entity_name: u.entity_name,
          documents_count: u.documents_count || 0,
          created_at: u.created_at || new Date().toISOString(),
        })));
        setKycDocuments(docs);
      } else if (activeTab === 'deposits') {
        const deposits = await backofficeApi.getPendingDeposits();
        setPendingDeposits(deposits.map((d: PendingDepositResponse): PendingDeposit => ({
          id: d.id,
          entity_id: d.entity_id,
          entity_name: d.entity_name || '',
          user_email: d.user_email || '',
          reported_amount: d.reported_amount ?? null,
          reported_currency: d.reported_currency ?? null,
          wire_reference: d.wire_reference ?? null,
          bank_reference: d.bank_reference ?? null,
          status: d.status,
          reported_at: d.reported_at ?? null,
          notes: d.notes ?? null,
          created_at: d.created_at,
        })));
      }
    } catch (err) {
      logger.error('Failed to load data', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'requests') {
      refreshContactRequests();
    } else {
      loadData();
    }
  };

  const handleDownloadNDA = async (requestId: string) => {
    setActionLoading(`download-${requestId}`);
    try {
      const request = contactRequests.find(r => r.id === requestId);
      if (request?.nda_file_name) {
        await adminApi.downloadNDA(requestId, request.nda_file_name);
      }
    } catch (err) {
      logger.error('Failed to download NDA', err);
      setError('Failed to download NDA file');
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
    setActionLoading(requestId);
    try {
      await adminApi.updateContactRequest(requestId, { status: 'rejected' });
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
    if (documentContentUrl) {
      URL.revokeObjectURL(documentContentUrl);
    }
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
        prev.map(d => d.id === docId ? { ...d, status } : d)
      );
    } catch (err) {
      logger.error('Failed to review document', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getUserDocuments = (userId: string) => {
    return kycDocuments.filter(d => d.user_id === userId);
  };

  const tabs = [
    { id: 'requests' as TabType, label: 'Contact Requests', icon: Users, count: contactRequestsCount },
    { id: 'kyc' as TabType, label: 'KYC Review', icon: FileText, count: kycUsers.length },
    { id: 'deposits' as TabType, label: 'Deposits', icon: Banknote, count: pendingDeposits.length },
  ];

  return (
    <BackofficeLayout>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-navy-600 text-white'
                : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-600'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-400'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        {/* Connection Status Indicator (only for requests tab) */}
        {activeTab === 'requests' && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
            connectionStatus === 'connected' && 'bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-300',
            connectionStatus === 'connecting' && 'bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-400',
            connectionStatus === 'disconnected' && 'bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-400',
            connectionStatus === 'error' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          )}>
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
          className="ml-auto"
          icon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}
        >
          Refresh
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'requests' && (
        <ContactRequestsTab
          contactRequests={contactRequests}
          loading={loading}
          connectionStatus={connectionStatus}
          onRefresh={handleRefresh}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          onDelete={handleDeleteRequest}
          onDownloadNDA={handleDownloadNDA}
          onIpLookup={handleIpLookup}
          actionLoading={actionLoading}
        />
      )}

      {activeTab === 'kyc' && (
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

      {activeTab === 'deposits' && (
        <PendingDepositsTab
          pendingDeposits={pendingDeposits}
          loading={loading}
          onConfirm={handleConfirmDeposit}
          onReject={handleRejectDeposit}
          actionLoading={actionLoading}
        />
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        document={showDocumentViewer}
        documentContentUrl={documentContentUrl}
        documentError={documentError}
        documentLoading={documentLoading}
        onClose={handleCloseDocumentViewer}
        onDownload={handleDownloadDocument}
        onRetry={showDocumentViewer ? () => loadDocumentContent(showDocumentViewer.id) : undefined}
      />

      {/* IP Lookup Modal */}
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
