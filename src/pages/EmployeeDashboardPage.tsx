import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  fetchLawyers,
  approveOrRejectLawyer,
  type PendingLawyerDTO,
  type ApproveLawyerRequestDTO,
} from '@/lib/employee-api';
import {
  ShieldCheck,
  Building2,
  LogOut,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  BadgeAlert,
  Search,
  ChevronRight,
  Phone,
  Mail,
  Scale,
  Award,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';

export default function EmployeeDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [lawyers, setLawyers] = useState<PendingLawyerDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter & Search states
  const [isSuspendedView, setIsSuspendedView] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState<PendingLawyerDTO | null>(null);

  // Action Dialog states (Approve / Reject)
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalValidTill, setApprovalValidTill] = useState(() => {
    // Default validTill to 2 years from today: YYYY-MM-DD
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });

  // Fetch lawyers from backend API
  const loadLawyers = useCallback(async () => {
    if (!user?.idToken) return;
    setLoading(true);
    setApiError(null);

    try {
      const data = await fetchLawyers(user.idToken, isSuspendedView);
      setLawyers(data);

      // Automatically select the first lawyer if current selection is not in list
      if (data.length > 0) {
        setSelectedLawyer((current) => {
          if (!current || !data.some((l) => l.lawyerId === current.lawyerId)) {
            return data[0];
          }
          return current;
        });
      } else {
        setSelectedLawyer(null);
      }
    } catch (err: unknown) {
      console.error('Failed to load lawyers from employee API:', err);
      const msg = err instanceof Error ? err.message : 'Failed to retrieve lawyers from backend.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }, [user?.idToken, isSuspendedView]);

  useEffect(() => {
    loadLawyers();
  }, [loadLawyers]);

  const handleLogout = async () => {
    await logout();
    navigate('/employee/login', { replace: true });
  };

  // 1. Submit Approval
  const handleConfirmApproval = async () => {
    if (!selectedLawyer || !user?.idToken) return;
    setActionLoading(true);

    const payload: ApproveLawyerRequestDTO = {
      lawyerId: selectedLawyer.lawyerId,
      number: selectedLawyer.mobileNumber || selectedLawyer.barCouncilId,
      isApproved: true,
      validTill: approvalValidTill,
      rejectionReason: '',
    };

    try {
      const result = await approveOrRejectLawyer(user.idToken, payload);
      setActionNotice(result || `Advocate ${selectedLawyer.fullName} approved successfully!`);
      setShowApproveModal(false);

      // Remove from pending list or reload
      setLawyers((prev) => prev.filter((l) => l.lawyerId !== selectedLawyer.lawyerId));
      setSelectedLawyer(null);

      // Refresh list
      loadLawyers();
    } catch (err: unknown) {
      console.error('Error approving lawyer:', err);
      setApiError(err instanceof Error ? err.message : 'Approval submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Submit Rejection
  const handleConfirmRejection = async () => {
    if (!selectedLawyer || !user?.idToken) return;
    if (!rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    setActionLoading(true);

    const payload: ApproveLawyerRequestDTO = {
      lawyerId: selectedLawyer.lawyerId,
      number: selectedLawyer.mobileNumber || selectedLawyer.barCouncilId,
      isApproved: false,
      validTill: '',
      rejectionReason: rejectionReason.trim(),
    };

    try {
      const result = await approveOrRejectLawyer(user.idToken, payload);
      setActionNotice(result || `Advocate ${selectedLawyer.fullName} registration rejected.`);
      setShowRejectModal(false);
      setRejectionReason('');

      // Remove from list
      setLawyers((prev) => prev.filter((l) => l.lawyerId !== selectedLawyer.lawyerId));
      setSelectedLawyer(null);

      loadLawyers();
    } catch (err: unknown) {
      console.error('Error rejecting lawyer:', err);
      setApiError(err instanceof Error ? err.message : 'Rejection submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter lawyers by search query
  const filteredLawyers = lawyers.filter((l) => {
    const q = searchTerm.toLowerCase();
    return (
      l.fullName?.toLowerCase().includes(q) ||
      l.barCouncilId?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.mobileNumber?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.state?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="dash-logo-box">
            <Building2 className="dash-logo-icon" />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="dash-brand-title">HireALawyer</span>
              <span className="dash-badge">Employee Workspace</span>
            </div>
            <p className="dash-subtitle">Employee ID: {user?.id.slice(0, 12)}...</p>
          </div>
        </div>

        <div className="header-right">
          <div className="user-profile-summary">
            <div className="avatar-circle">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'E'}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.displayName || 'Authorized Employee'}</span>
              <div className="user-role-row">
                <span className="role-tag">ROLE_APPROVER</span>
                {user?.phoneNumber && <span className="phone-tag">{user.phoneNumber}</span>}
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="logout-btn" title="Sign out of Employee Portal">
            <LogOut className="logout-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="dashboard-main">
        {/* Banner with Token/Auth info */}
        <div className="session-status-banner">
          <div className="session-left">
            <div className="shield-icon-circle">
              <ShieldCheck className="shield-pulse-icon" />
            </div>
            <div>
              <h2 className="session-heading">Active Employee Session (Authenticated via HalUser)</h2>
              <p className="session-desc">
                Session verified with UID <code>{user?.id}</code> under issuer{' '}
                <code>{user?.decodedToken.iss || 'haluser'}</code>.
              </p>
            </div>
          </div>
          <div className="session-badges">
            <span className="verified-pill">
              <CheckCircle className="pill-icon" /> Verified Auth
            </span>
            <span className="role-approver-pill">
              <Award className="pill-icon" /> Approver Authority
            </span>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionNotice && (
          <div className="dashboard-toast">
            <CheckCircle className="toast-icon" />
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="toast-close-btn"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <AlertCircle className="alert-icon" />
            <div style={{ flex: 1 }}>
              <strong>API Notice: </strong>
              <span>{apiError}</span>
            </div>
            <button
              onClick={loadLawyers}
              className="action-btn"
              style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#fff', padding: '4px 10px' }}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper pending">
              <Clock className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Pending Reviews</span>
              <span className="stat-value">{lawyers.length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper approved">
              <UserCheck className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Queue Category</span>
              <span className="stat-value" style={{ fontSize: '1.05rem', marginTop: 4 }}>
                {isSuspendedView ? 'Suspended Lawyers' : 'Pending Registrations'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper security">
              <Scale className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Target Service</span>
              <span className="stat-value" style={{ fontSize: '0.92rem', marginTop: 6, color: '#38bdf8' }}>
                /employee/approve-lawyer
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper auth">
              <ShieldCheck className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Endpoint Status</span>
              <span className="stat-value status-online">Connected</span>
            </div>
          </div>
        </div>

        {/* Section Title & Filters */}
        <div className="section-title-bar">
          <div>
            <h3 className="section-title">Lawyer Approval & Verification Queue</h3>
            <p className="section-subtitle">
              Fetch advocates via <code>GET /employee/get-lawyers</code> and review/approve licenses.
            </p>
          </div>

          <div className="filter-controls">
            {/* Search */}
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search name, bar ID, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Suspended toggle */}
            <div className="filter-buttons">
              <button
                onClick={() => setIsSuspendedView(false)}
                className={`filter-btn ${!isSuspendedView ? 'active' : ''}`}
              >
                Pending Registration
              </button>
              <button
                onClick={() => setIsSuspendedView(true)}
                className={`filter-btn ${isSuspendedView ? 'active' : ''}`}
              >
                Suspended Lawyers
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadLawyers}
              className="filter-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              title="Refresh Queue"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'spinner-icon' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Queue & Details Split Grid */}
        <div className="queue-grid">
          {/* List Column */}
          <div className="lawyers-list-card">
            <div className="list-card-header">
              <span className="queue-count">
                {loading
                  ? 'Loading advocates...'
                  : `Showing ${filteredLawyers.length} advocate${filteredLawyers.length === 1 ? '' : 's'}`}
              </span>
            </div>

            <div className="lawyers-list">
              {loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                  <RefreshCw className="spinner-icon" style={{ margin: '0 auto 10px auto' }} />
                  <p>Fetching queue from /employee/get-lawyers...</p>
                </div>
              ) : filteredLawyers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <BadgeAlert style={{ width: 32, height: 32, margin: '0 auto 8px auto', opacity: 0.6 }} />
                  <p>No lawyers found in this queue.</p>
                </div>
              ) : (
                filteredLawyers.map((lawyer) => (
                  <div
                    key={lawyer.lawyerId}
                    onClick={() => setSelectedLawyer(lawyer)}
                    className={`lawyer-item ${selectedLawyer?.lawyerId === lawyer.lawyerId ? 'active' : ''}`}
                  >
                    <div className="lawyer-item-main">
                      <div className="lawyer-avatar">
                        {lawyer.fullName ? lawyer.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="lawyer-brief">
                        <div className="lawyer-name-row">
                          <span className="lawyer-name">{lawyer.fullName}</span>
                          <span className="status-badge pending">PENDING</span>
                        </div>
                        <span className="lawyer-meta">
                          {lawyer.barCouncilId || 'Bar ID Pending'} • {lawyer.city || lawyer.state || 'India'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="chevron-icon" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Details Column */}
          {selectedLawyer ? (
            <div className="lawyer-details-card">
              <div className="details-header">
                <div>
                  <div className="badge-row">
                    <span className="status-badge pending">
                      {isSuspendedView ? 'SUSPENDED' : 'PENDING APPROVAL'}
                    </span>
                    {selectedLawyer.submittedAt && (
                      <span className="timestamp">
                        Submitted: {new Date(selectedLawyer.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h4 className="detail-name">{selectedLawyer.fullName}</h4>
                  <p className="detail-sub">
                    ID: <code className="font-mono text-xs">{selectedLawyer.lawyerId}</code>
                  </p>
                </div>

                <div className="detail-actions">
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="action-btn approve-btn"
                    disabled={actionLoading}
                  >
                    <CheckCircle className="btn-icon" />
                    <span>Approve Advocate</span>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="action-btn reject-btn"
                    disabled={actionLoading}
                  >
                    <XCircle className="btn-icon" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>

              <div className="details-body">
                {/* Contact & Location Info */}
                <div className="detail-block">
                  <span className="block-title">Advocate Credentials & Standing</span>
                  <div className="info-fields-grid">
                    <div className="info-field">
                      <span className="field-label">Bar Council ID</span>
                      <span className="field-value font-mono">
                        {selectedLawyer.barCouncilId || 'N/A'}
                      </span>
                    </div>

                    <div className="info-field">
                      <span className="field-label">Bar Council State</span>
                      <span className="field-value">
                        {selectedLawyer.barCouncilState || 'N/A'}
                      </span>
                    </div>

                    <div className="info-field">
                      <span className="field-label">Enrollment Year</span>
                      <span className="field-value flex-center">
                        <Calendar className="field-icon" />
                        {selectedLawyer.enrollmentYear || 'N/A'}
                      </span>
                    </div>

                    <div className="info-field">
                      <span className="field-label">Years of Experience</span>
                      <span className="field-value">
                        {selectedLawyer.experienceYears != null
                          ? `${selectedLawyer.experienceYears} Years`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="info-field">
                      <span className="field-label">Mobile Number</span>
                      <span className="field-value flex-center">
                        <Phone className="field-icon" />
                        {selectedLawyer.mobileNumber || 'N/A'}
                      </span>
                    </div>

                    <div className="info-field">
                      <span className="field-label">Registered Email</span>
                      <span className="field-value flex-center">
                        <Mail className="field-icon" />
                        {selectedLawyer.email || 'N/A'}
                      </span>
                    </div>

                    <div className="info-field">
                      <span className="field-label">Jurisdiction City</span>
                      <span className="field-value flex-center">
                        <MapPin className="field-icon" />
                        {selectedLawyer.city || 'N/A'}
                      </span>
                    </div>

                    <div className="info-field">
                      <span className="field-label">Jurisdiction State</span>
                      <span className="field-value">
                        {selectedLawyer.state || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submitted Documents for Verification */}
                <div className="detail-block">
                  <span className="block-title">Verification Documents & Certificates</span>
                  <div className="document-checks">
                    {/* Bar Council ID Card Document */}
                    <div className="doc-item">
                      <FileText className="doc-icon" />
                      <div className="doc-text">
                        <span className="doc-title">Bar Council ID Card</span>
                        <span className="doc-meta">
                          {selectedLawyer.barCouncilIdDocumentUrl
                            ? 'Document uploaded by lawyer'
                            : 'No document attached'}
                        </span>
                      </div>
                      {selectedLawyer.barCouncilIdDocumentUrl ? (
                        <a
                          href={selectedLawyer.barCouncilIdDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-status verified"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="doc-status" style={{ color: '#94a3b8' }}>NOT ATTACHED</span>
                      )}
                    </div>

                    {/* Certificate of Practice (COP) */}
                    <div className="doc-item">
                      <FileText className="doc-icon" />
                      <div className="doc-text">
                        <span className="doc-title">Certificate of Practice (COP)</span>
                        <span className="doc-meta">
                          {selectedLawyer.copDocumentUrl
                            ? 'Document uploaded by lawyer'
                            : 'No COP document attached'}
                        </span>
                      </div>
                      {selectedLawyer.copDocumentUrl ? (
                        <a
                          href={selectedLawyer.copDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-status verified"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="doc-status" style={{ color: '#94a3b8' }}>NOT ATTACHED</span>
                      )}
                    </div>

                    {/* Enrollment Certificate */}
                    <div className="doc-item">
                      <FileText className="doc-icon" />
                      <div className="doc-text">
                        <span className="doc-title">State Bar Enrollment Certificate</span>
                        <span className="doc-meta">
                          {selectedLawyer.enrollmentCertificateUrl
                            ? 'Document uploaded by lawyer'
                            : 'No certificate attached'}
                        </span>
                      </div>
                      {selectedLawyer.enrollmentCertificateUrl ? (
                        <a
                          href={selectedLawyer.enrollmentCertificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-status verified"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="doc-status" style={{ color: '#94a3b8' }}>NOT ATTACHED</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-card">
              <BadgeAlert className="empty-icon" />
              <span>Select an advocate from the queue on the left to inspect their details and approve them.</span>
            </div>
          )}
        </div>
      </main>

      {/* Approval Confirmation Modal */}
      {showApproveModal && selectedLawyer && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="brand-logo-container" style={{ margin: 0 }}>
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <h3 className="modal-title">Confirm Lawyer Approval</h3>
              </div>
              <button onClick={() => setShowApproveModal(false)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: 16 }}>
                You are about to approve <strong>{selectedLawyer.fullName}</strong> (Bar ID:{' '}
                <code>{selectedLawyer.barCouncilId || 'N/A'}</code>).
              </p>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Approval Valid Till (Date)</label>
                <input
                  type="date"
                  value={approvalValidTill}
                  onChange={(e) => setApprovalValidTill(e.target.value)}
                  className="text-input"
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '8px 14px',
                    color: '#fff',
                  }}
                  required
                />
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: 12, borderRadius: 8, fontSize: '0.8rem', color: '#6ee7b7' }}>
                This request will be sent to <code>POST /employee/approve-lawyer</code> with <code>isApproved: true</code>.
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowApproveModal(false)}
                className="action-btn"
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1' }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                className="action-btn approve-btn"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="spinner-icon w-4 h-4 mr-1" />
                    <span>Submitting Approval...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedLawyer && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="brand-logo-container" style={{ margin: 0 }}>
                <XCircle className="w-6 h-6 text-red-400" />
                <h3 className="modal-title">Reject Lawyer Registration</h3>
              </div>
              <button onClick={() => setShowRejectModal(false)} className="modal-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: 16 }}>
                Please specify why <strong>{selectedLawyer.fullName}</strong> is being rejected.
              </p>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Rejection Reason</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Bar council card illegible, name mismatch, expired COP..."
                  className="text-input"
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: '#fff',
                    height: 'auto',
                    resize: 'vertical',
                  }}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowRejectModal(false)}
                className="action-btn"
                style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.2)', color: '#cbd5e1' }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                className="action-btn reject-btn"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw className="spinner-icon w-4 h-4 mr-1" />
                    <span>Submitting Rejection...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
