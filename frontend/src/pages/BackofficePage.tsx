import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Activity,
  ArrowRightLeft,
  Search,
  X,
  Download,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/common';
import { ApproveInviteModal } from '../components/backoffice/ApproveInviteModal';
import { KYCReviewPanel } from '../components/backoffice/KYCReviewPanel';
import { adminApi, backofficeApi } from '../services/api';
import { cn, formatRelativeTime, formatCurrency, formatQuantity } from '../utils';
import { useBackofficeRealtime } from '../hooks/useBackofficeRealtime';

interface ContactRequest {
  id: string;
  entity_name: string;
  contact_email: string;
  contact_name?: string;
  position: string;
  reference?: string;
  request_type: 'join' | 'nda';
  nda_file_name?: string;
  submitter_ip?: string;
  status: string;
  notes?: string;
  created_at: string;
}

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

interface KYCUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  entity_name?: string;
  documents_count: number;
  created_at: string;
}

interface KYCDocument {
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

interface DocumentViewerState {
  id: string;
  fileName: string;
  type: string;
  mimeType?: string;
}

interface UserSession {
  id: string;
  ip_address: string;
  user_agent?: string;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
}

interface UserTrade {
  id: string;
  trade_type: string;
  certificate_type: string;
  quantity: number;
  total_value: number;
  status: string;
  is_buyer: boolean;
  created_at: string;
}

interface SelectedUserDetails {
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    entity_name?: string;
  };
  sessions: UserSession[];
  trades: UserTrade[];
}

type TabType = 'requests' | 'kyc' | 'details';

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
  const [selectedUser, setSelectedUser] = useState<SelectedUserDetails | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState<DocumentViewerState | null>(null);
  const [documentContentUrl, setDocumentContentUrl] = useState<string | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  // IP Lookup Modal state
  const [ipLookupData, setIpLookupData] = useState<IPLookupResult | null>(null);
  const [ipLookupLoading, setIpLookupLoading] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Approve/Invite Modal state
  const [approveModalRequest, setApproveModalRequest] = useState<ContactRequest | null>(null);

  useEffect(() => {
    // Contact requests are now loaded via realtime hook, only load other tabs
    if (activeTab !== 'requests') {
      loadData();
    } else {
      // For requests tab, use realtime data
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
        // Map response to KYCUser[] format (backend returns documents_count and entity_name)
        setKycUsers(users.map((u: any) => ({
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          entity_name: u.entity_name,
          documents_count: u.documents_count || 0,
          created_at: u.created_at || new Date().toISOString(),
        })));
        setKycDocuments(docs);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh based on active tab
  const handleRefresh = () => {
    if (activeTab === 'requests') {
      refreshContactRequests();
    } else {
      loadData();
    }
  };

  // Handle NDA download with authentication
  const handleDownloadNDA = async (requestId: string, fileName: string) => {
    setActionLoading(`download-${requestId}`);
    try {
      await adminApi.downloadNDA(requestId, fileName);
    } catch (err) {
      console.error('Failed to download NDA:', err);
      setError('Failed to download NDA file');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle IP WHOIS lookup
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
      console.error('Failed to lookup IP:', err);
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
      // WebSocket will broadcast the update and refresh the store automatically
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this contact request?')) return;

    setActionLoading(`delete-${requestId}`);
    try {
      await adminApi.deleteContactRequest(requestId);
      // WebSocket will broadcast deletion and update the store automatically
    } catch (err) {
      console.error('Failed to delete request:', err);
      setError('Failed to delete contact request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveModalSuccess = () => {
    // Refresh the list after successful user creation
    refreshContactRequests();
  };

  // Document preview functions
  const loadDocumentContent = async (documentId: string) => {
    setDocumentLoading(true);
    setDocumentError(null);
    setDocumentContentUrl(null);

    try {
      const blob = await backofficeApi.getDocumentContent(documentId);
      const url = URL.createObjectURL(blob);
      setDocumentContentUrl(url);
    } catch (err) {
      console.error('Failed to load document:', err);
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

  const renderDocumentPreview = () => {
    if (!documentContentUrl || !showDocumentViewer) return null;

    const mimeType = showDocumentViewer.mimeType?.toLowerCase() || '';
    const fileName = showDocumentViewer.fileName.toLowerCase();

    // Image preview
    if (mimeType.startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileName)) {
      return (
        <img
          src={documentContentUrl}
          alt={showDocumentViewer.fileName}
          className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
          onError={() => setDocumentError('Failed to display image')}
        />
      );
    }

    // PDF preview
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return (
        <iframe
          src={documentContentUrl}
          title={showDocumentViewer.fileName}
          className="w-full h-[60vh] rounded-lg border border-navy-200 dark:border-navy-600"
        />
      );
    }

    // Unsupported file type - show download prompt
    return (
      <div className="text-center">
        <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
        <p className="text-navy-500 dark:text-navy-400 mb-4">
          Preview not available for this file type
        </p>
        <Button variant="primary" onClick={handleDownloadDocument}>
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  const handleApproveKYC = async (userId: string) => {
    setActionLoading(userId);
    try {
      await backofficeApi.approveUser(userId);
      setKycUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Failed to approve user:', err);
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
      console.error('Failed to reject user:', err);
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
      console.error('Failed to review document:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearchUser = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await adminApi.getUsers({ search: searchQuery });
      if (response.data.length > 0) {
        const user = response.data[0];
        const [sessions, trades] = await Promise.all([
          backofficeApi.getUserSessions(user.id),
          backofficeApi.getUserTrades(user.id)
        ]);

        setSelectedUser({
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            entity_name: undefined
          },
          sessions: sessions.map(s => ({
            ...s,
            is_active: !s.ended_at
          })),
          trades
        });
      } else {
        setSelectedUser(null);
        setError('No user found with that email');
      }
    } catch (err) {
      console.error('Failed to search user:', err);
      setError('Failed to search user');
    } finally {
      setLoading(false);
    }
  };

  const getUserDocuments = (userId: string) => {
    return kycDocuments.filter(d => d.user_id === userId);
  };

  const tabs = [
    { id: 'requests' as TabType, label: 'Contact Requests', icon: Users, count: contactRequestsCount },
    { id: 'kyc' as TabType, label: 'KYC Review', icon: FileText, count: kycUsers.length },
    { id: 'details' as TabType, label: 'User Details', icon: Activity, count: null },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">Backoffice</h1>
          <p className="text-navy-600 dark:text-navy-300">
            Review access requests, KYC documents, and user activity
          </p>
        </div>

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
                  ? 'bg-emerald-500 text-white'
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
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
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
              connectionStatus === 'connected' && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
              connectionStatus === 'connecting' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Contact Requests
              </h2>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                      <div className="h-5 bg-navy-100 dark:bg-navy-600 rounded w-1/3 mb-3" />
                      <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : contactRequests.length > 0 ? (
                <div className="space-y-4">
                  {contactRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-navy-900 dark:text-white">
                              {request.entity_name}
                            </h3>
                            <Badge variant={request.request_type === 'nda' ? 'warning' : 'info'}>
                              {request.request_type?.toUpperCase() || 'JOIN'}
                            </Badge>
                            <Badge variant={request.status === 'new' ? 'info' : request.status === 'contacted' ? 'warning' : 'success'}>
                              {request.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-navy-500 dark:text-navy-400">Contact:</span>
                              <span className="ml-2 text-navy-700 dark:text-navy-200">{request.contact_email}</span>
                            </div>
                            {request.contact_name && (
                              <div>
                                <span className="text-navy-500 dark:text-navy-400">Name:</span>
                                <span className="ml-2 text-navy-700 dark:text-navy-200">{request.contact_name}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-navy-500 dark:text-navy-400">Position:</span>
                              <span className="ml-2 text-navy-700 dark:text-navy-200">{request.position}</span>
                            </div>
                            {request.reference && (
                              <div>
                                <span className="text-navy-500 dark:text-navy-400">Reference:</span>
                                <span className="ml-2 text-navy-700 dark:text-navy-200">{request.reference}</span>
                              </div>
                            )}
                            {request.submitter_ip && (
                              <div>
                                <span className="text-navy-500 dark:text-navy-400">IP:</span>
                                <button
                                  onClick={() => handleIpLookup(request.submitter_ip!)}
                                  className="ml-2 text-teal-600 dark:text-teal-400 hover:underline font-mono text-xs"
                                >
                                  {request.submitter_ip}
                                </button>
                              </div>
                            )}
                            {request.nda_file_name && (
                              <div className="col-span-2">
                                <span className="text-navy-500 dark:text-navy-400">NDA File:</span>
                                <button
                                  onClick={() => handleDownloadNDA(request.id, request.nda_file_name!)}
                                  disabled={actionLoading === `download-${request.id}`}
                                  className="ml-2 text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  <Download className={cn("w-3 h-3", actionLoading === `download-${request.id}` && "animate-spin")} />
                                  {request.nda_file_name}
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-navy-400 dark:text-navy-500 mt-2">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Submitted {formatRelativeTime(request.created_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id)}
                            loading={actionLoading === `delete-${request.id}`}
                            className="text-navy-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectRequest(request.id)}
                            loading={actionLoading === request.id}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setApproveModalRequest(request)}
                            loading={actionLoading === request.id}
                          >
                            <UserPlus className="w-4 h-4" />
                            Approve & Invite
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                  <p className="text-navy-500 dark:text-navy-400">No pending contact requests</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {activeTab === 'kyc' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                KYC Documents Review
              </h2>
              <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
                Review and approve user KYC documents by category
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="p-4 border-b border-navy-100 dark:border-navy-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-navy-200 dark:bg-navy-700" />
                        <div className="flex-1">
                          <div className="h-5 bg-navy-200 dark:bg-navy-700 rounded w-1/4 mb-2" />
                          <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/3" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="h-10 bg-navy-100 dark:bg-navy-700 rounded mb-3" />
                      <div className="space-y-3">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="h-16 bg-navy-100 dark:bg-navy-700 rounded" />
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : kycUsers.length > 0 ? (
              <div className="space-y-6">
                {kycUsers.map((user) => {
                  const userDocs = getUserDocuments(user.id);
                  return (
                    <KYCReviewPanel
                      key={user.id}
                      userId={user.id}
                      userEmail={user.email}
                      userName={`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                      entityName={user.entity_name}
                      documents={userDocs}
                      onDocumentApprove={async (docId) => {
                        setActionLoading(`approve-${docId}`);
                        await handleReviewDocument(docId, 'approved');
                        setActionLoading(null);
                      }}
                      onDocumentReject={async (docId, notes) => {
                        setActionLoading(`reject-${docId}`);
                        await handleReviewDocument(docId, 'rejected', notes);
                        setActionLoading(null);
                      }}
                      onDocumentPreview={handleOpenDocumentViewer}
                      onUserApprove={async () => {
                        setActionLoading(`approve-user-${user.id}`);
                        await handleApproveKYC(user.id);
                        setActionLoading(null);
                      }}
                      onUserReject={async () => {
                        setActionLoading(`reject-user-${user.id}`);
                        await handleRejectKYC(user.id);
                        setActionLoading(null);
                      }}
                      actionLoading={actionLoading}
                    />
                  );
                })}
              </div>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                  <p className="text-navy-500 dark:text-navy-400">No KYC reviews pending</p>
                  <p className="text-xs text-navy-400 mt-1">All users have completed their verification</p>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {activeTab === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search User */}
            <Card>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type="text"
                    placeholder="Search user by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <Button variant="primary" onClick={handleSearchUser} loading={loading}>
                  Search
                </Button>
              </div>
            </Card>

            {/* User Details */}
            {selectedUser && (
              <>
                {/* User Info */}
                <Card>
                  <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    User Details
                  </h2>
                  <div className="flex items-center gap-4 p-4 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                      {(selectedUser.user.first_name?.[0] || selectedUser.user.email[0]).toUpperCase()}
                      {(selectedUser.user.last_name?.[0] || selectedUser.user.email[1]).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-navy-900 dark:text-white text-lg">
                        {selectedUser.user.first_name} {selectedUser.user.last_name}
                      </p>
                      <p className="text-navy-500 dark:text-navy-400">{selectedUser.user.email}</p>
                      {selectedUser.user.entity_name && (
                        <p className="text-sm text-navy-400">{selectedUser.user.entity_name}</p>
                      )}
                    </div>
                    <Badge variant="success" className="ml-auto">
                      {selectedUser.user.role.toUpperCase()}
                    </Badge>
                  </div>
                </Card>

                {/* Sessions */}
                <Card>
                  <h3 className="font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Session History (IP Addresses)
                  </h3>
                  {selectedUser.sessions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-navy-100 dark:bg-navy-600 rounded-full flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-navy-500" />
                            </div>
                            <div>
                              <p className="font-mono text-sm text-navy-900 dark:text-white">{session.ip_address}</p>
                              {session.is_active && (
                                <span className="text-xs text-emerald-500">Active</span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-navy-400">
                            {formatRelativeTime(session.started_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-navy-500 dark:text-navy-400 py-4">No sessions found</p>
                  )}
                </Card>

                {/* Trading History */}
                <Card>
                  <h3 className="font-semibold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                    Trading History
                  </h3>
                  {selectedUser.trades.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.trades.map((trade) => (
                        <div
                          key={trade.id}
                          className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-700/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={trade.trade_type === 'buy' ? 'success' : trade.trade_type === 'swap' ? 'info' : 'warning'}>
                              {trade.trade_type.toUpperCase()}
                            </Badge>
                            <div>
                              <p className="font-medium text-navy-900 dark:text-white">
                                {formatQuantity(trade.quantity)} {trade.certificate_type}
                              </p>
                              <p className="text-xs text-navy-500 dark:text-navy-400">
                                {formatRelativeTime(trade.created_at)}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(trade.total_value, 'USD')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-navy-500 dark:text-navy-400 py-4">No trades found</p>
                  )}
                </Card>
              </>
            )}

            {!selectedUser && !loading && (
              <Card>
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
                  <p className="text-navy-500 dark:text-navy-400">Search for a user to view their details</p>
                </div>
              </Card>
            )}
          </motion.div>
        )}

        {/* Document Viewer Modal */}
        {showDocumentViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-navy-100 dark:border-navy-700">
                <div>
                  <h2 className="font-semibold text-navy-900 dark:text-white">
                    {showDocumentViewer.type.replace(/_/g, ' ')}
                  </h2>
                  <p className="text-sm text-navy-500 dark:text-navy-400">{showDocumentViewer.fileName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadDocument}
                    disabled={!documentContentUrl}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <button
                    onClick={handleCloseDocumentViewer}
                    className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
                  >
                    <X className="w-5 h-5 text-navy-500" />
                  </button>
                </div>
              </div>
              <div className="p-4 min-h-[400px] max-h-[70vh] overflow-auto flex items-center justify-center bg-navy-50 dark:bg-navy-900">
                {documentLoading ? (
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-navy-400 animate-spin mx-auto mb-4" />
                    <p className="text-navy-500 dark:text-navy-400">Loading document...</p>
                  </div>
                ) : documentError ? (
                  <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-500 dark:text-red-400">{documentError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => loadDocumentContent(showDocumentViewer.id)}
                    >
                      Retry
                    </Button>
                  </div>
                ) : documentContentUrl ? (
                  renderDocumentPreview()
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
                    <p className="text-navy-500 dark:text-navy-400">Document preview not available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* IP Lookup Modal */}
        {showIpModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-navy-800 rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="flex items-center justify-between p-4 border-b border-navy-200 dark:border-navy-700">
                <h3 className="font-semibold text-navy-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-500" />
                  IP Address Lookup
                </h3>
                <button
                  onClick={() => {
                    setShowIpModal(false);
                    setIpLookupData(null);
                  }}
                  className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4">
                {ipLookupLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
                    <span className="ml-2 text-navy-600 dark:text-navy-300">Looking up IP...</span>
                  </div>
                ) : ipLookupData ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-navy-500 dark:text-navy-400 block">IP Address</span>
                        <span className="font-mono text-navy-900 dark:text-white">{ipLookupData.ip}</span>
                      </div>
                      <div>
                        <span className="text-navy-500 dark:text-navy-400 block">Country</span>
                        <span className="text-navy-900 dark:text-white">{ipLookupData.country} ({ipLookupData.country_code})</span>
                      </div>
                      <div>
                        <span className="text-navy-500 dark:text-navy-400 block">Region</span>
                        <span className="text-navy-900 dark:text-white">{ipLookupData.region}</span>
                      </div>
                      <div>
                        <span className="text-navy-500 dark:text-navy-400 block">City</span>
                        <span className="text-navy-900 dark:text-white">{ipLookupData.city} {ipLookupData.zip}</span>
                      </div>
                      <div>
                        <span className="text-navy-500 dark:text-navy-400 block">Timezone</span>
                        <span className="text-navy-900 dark:text-white">{ipLookupData.timezone}</span>
                      </div>
                      <div>
                        <span className="text-navy-500 dark:text-navy-400 block">Coordinates</span>
                        <span className="font-mono text-xs text-navy-900 dark:text-white">{ipLookupData.lat}, {ipLookupData.lon}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-navy-500 dark:text-navy-400 block">ISP</span>
                        <span className="text-navy-900 dark:text-white">{ipLookupData.isp}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-navy-500 dark:text-navy-400 block">Organization</span>
                        <span className="text-navy-900 dark:text-white">{ipLookupData.org}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-navy-500 dark:text-navy-400 block">AS</span>
                        <span className="font-mono text-xs text-navy-900 dark:text-white">{ipLookupData.as}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-navy-500 dark:text-navy-400">
                    Failed to load IP information
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Approve & Invite Modal */}
        {approveModalRequest && (
          <ApproveInviteModal
            contactRequest={{
              id: approveModalRequest.id,
              entity_name: approveModalRequest.entity_name,
              contact_email: approveModalRequest.contact_email,
              contact_name: approveModalRequest.contact_name,
              position: approveModalRequest.position,
              reference: approveModalRequest.reference,
              request_type: approveModalRequest.request_type,
              nda_file_name: approveModalRequest.nda_file_name,
              submitter_ip: approveModalRequest.submitter_ip,
              status: approveModalRequest.status as 'pending' | 'approved' | 'rejected' | 'enrolled',
              notes: approveModalRequest.notes,
              created_at: approveModalRequest.created_at,
            }}
            isOpen={!!approveModalRequest}
            onClose={() => setApproveModalRequest(null)}
            onSuccess={handleApproveModalSuccess}
          />
        )}
      </div>
    </div>
  );
}
