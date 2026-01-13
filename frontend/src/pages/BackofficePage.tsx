import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Activity,
  ArrowRightLeft,
  Search,
  X,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/common';
import { adminApi, backofficeApi } from '../services/api';
import { cn, formatRelativeTime, formatCurrency, formatQuantity } from '../utils';

interface ContactRequest {
  id: string;
  entity_name: string;
  contact_email: string;
  contact_name?: string;
  position: string;
  reference?: string;
  request_type: 'join' | 'nda';
  nda_file_name?: string;
  status: string;
  notes?: string;
  created_at: string;
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
  status: string;
  notes?: string;
  created_at: string;
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

  // Contact requests state
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [contactRequestsCount, setContactRequestsCount] = useState(0);

  // KYC state
  const [kycUsers, setKycUsers] = useState<KYCUser[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);

  // User details state
  const [selectedUser, setSelectedUser] = useState<SelectedUserDetails | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState<{ fileName: string; type: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'requests') {
        const response = await adminApi.getContactRequests({ per_page: 50 });
        setContactRequests(response.data);
        setContactRequestsCount(response.pagination.total);
      } else if (activeTab === 'kyc') {
        const [users, docs] = await Promise.all([
          backofficeApi.getPendingUsers(),
          backofficeApi.getKYCDocuments()
        ]);
        // Map User[] to KYCUser[] format
        setKycUsers(users.map(u => ({
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          entity_name: undefined,
          documents_count: 0,
          created_at: u.last_login || new Date().toISOString(),
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

  const handleApproveRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await adminApi.updateContactRequest(requestId, { status: 'enrolled' });
      setContactRequests(prev => prev.filter(r => r.id !== requestId));
      setContactRequestsCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to approve request:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await adminApi.updateContactRequest(requestId, { status: 'rejected' });
      setContactRequests(prev => prev.filter(r => r.id !== requestId));
      setContactRequestsCount(prev => prev - 1);
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setActionLoading(null);
    }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
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
                            {request.nda_file_name && (
                              <div className="col-span-2">
                                <span className="text-navy-500 dark:text-navy-400">NDA File:</span>
                                <a
                                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/admin/contact-requests/${request.id}/nda`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  {request.nda_file_name}
                                </a>
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
                            onClick={() => handleApproveRequest(request.id)}
                            loading={actionLoading === request.id}
                          >
                            <CheckCircle className="w-4 h-4" />
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
            <Card>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                KYC Documents Review
              </h2>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse p-6 bg-navy-50 dark:bg-navy-700/50 rounded-xl">
                      <div className="h-5 bg-navy-100 dark:bg-navy-600 rounded w-1/4 mb-3" />
                      <div className="h-4 bg-navy-100 dark:bg-navy-600 rounded w-1/3" />
                    </div>
                  ))}
                </div>
              ) : kycUsers.length > 0 ? (
                <div className="space-y-6">
                  {kycUsers.map((user) => {
                    const userDocs = getUserDocuments(user.id);

                    return (
                      <div
                        key={user.id}
                        className="p-6 bg-navy-50 dark:bg-navy-700/50 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-navy-900 dark:text-white">
                              {user.first_name} {user.last_name}
                            </h3>
                            <p className="text-sm text-navy-500 dark:text-navy-400">
                              {user.email} {user.entity_name && `- ${user.entity_name}`}
                            </p>
                          </div>
                          <p className="text-xs text-navy-400">
                            {user.documents_count} documents uploaded
                          </p>
                        </div>

                        <div className="grid gap-3">
                          {userDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-white dark:bg-navy-800 rounded-lg border border-navy-100 dark:border-navy-600"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-navy-400" />
                                <div>
                                  <p className="font-medium text-navy-900 dark:text-white text-sm">
                                    {doc.document_type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-navy-500 dark:text-navy-400">{doc.file_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'danger' : 'warning'}>
                                  {doc.status.toUpperCase()}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowDocumentViewer({ fileName: doc.file_name, type: doc.document_type })}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {doc.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReviewDocument(doc.id, 'rejected')}
                                      loading={actionLoading === doc.id}
                                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReviewDocument(doc.id, 'approved')}
                                      loading={actionLoading === doc.id}
                                      className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectKYC(user.id)}
                            loading={actionLoading === user.id}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject User
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleApproveKYC(user.id)}
                            loading={actionLoading === user.id}
                            disabled={userDocs.some((d) => d.status === 'pending')}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve Full KYC
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                  <p className="text-navy-500 dark:text-navy-400">No KYC reviews pending</p>
                </div>
              )}
            </Card>
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
              className="bg-white dark:bg-navy-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-navy-100 dark:border-navy-700">
                <div>
                  <h2 className="font-semibold text-navy-900 dark:text-white">
                    {showDocumentViewer.type.replace(/_/g, ' ')}
                  </h2>
                  <p className="text-sm text-navy-500 dark:text-navy-400">{showDocumentViewer.fileName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <button
                    onClick={() => setShowDocumentViewer(null)}
                    className="p-2 hover:bg-navy-100 dark:hover:bg-navy-700 rounded-lg"
                  >
                    <X className="w-5 h-5 text-navy-500" />
                  </button>
                </div>
              </div>
              <div className="p-8 min-h-[400px] flex items-center justify-center bg-navy-50 dark:bg-navy-900">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-navy-300 mx-auto mb-4" />
                  <p className="text-navy-500 dark:text-navy-400">Document preview would appear here</p>
                  <p className="text-sm text-navy-400">{showDocumentViewer.fileName}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
