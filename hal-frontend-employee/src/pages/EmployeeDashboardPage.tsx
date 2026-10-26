import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
} from 'lucide-react';

interface PendingLawyer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  barCouncilNumber: string;
  experienceYears: number;
  specialization: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

const mockPendingLawyers: PendingLawyer[] = [
  {
    id: 'lawyer-001',
    fullName: 'Adv. Rajesh Verma',
    email: 'rajesh.verma@delhibarcouncil.org',
    phone: '+91 98112 34567',
    barCouncilNumber: 'D/1482/2012',
    experienceYears: 12,
    specialization: 'Corporate & Commercial Disputes',
    submittedAt: 'Today, 10:30 AM',
    status: 'PENDING',
  },
  {
    id: 'lawyer-002',
    fullName: 'Adv. Priya Sundaram',
    email: 'priya.s@chennailegal.com',
    phone: '+91 94441 87654',
    barCouncilNumber: 'TN/0894/2016',
    experienceYears: 8,
    specialization: 'Civil Litigation & Property Law',
    submittedAt: 'Yesterday, 4:15 PM',
    status: 'PENDING',
  },
  {
    id: 'lawyer-003',
    fullName: 'Adv. Mohammed Al-Hassan',
    email: 'adv.mohammed@mumbailaw.in',
    phone: '+91 98200 99881',
    barCouncilNumber: 'MAH/3301/2018',
    experienceYears: 6,
    specialization: 'Intellectual Property & Patents',
    submittedAt: '24 Oct 2026',
    status: 'PENDING',
  },
  {
    id: 'lawyer-004',
    fullName: 'Adv. Ananya Sengupta',
    email: 'ananya.s@kolkatalegal.org',
    phone: '+91 98311 22334',
    barCouncilNumber: 'WB/0411/2014',
    experienceYears: 10,
    specialization: 'Family & Matrimonial Law',
    submittedAt: '22 Oct 2026',
    status: 'APPROVED',
  },
];

export default function EmployeeDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [lawyers, setLawyers] = useState<PendingLawyer[]>(mockPendingLawyers);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState<PendingLawyer | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Auto-select first pending lawyer
  useEffect(() => {
    if (!selectedLawyer && lawyers.length > 0) {
      setSelectedLawyer(lawyers[0]);
    }
  }, [lawyers, selectedLawyer]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleApprove = (id: string) => {
    setLawyers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'APPROVED' } : l))
    );
    if (selectedLawyer?.id === id) {
      setSelectedLawyer((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
    }
    setActionNotice(`Lawyer ${id} has been APPROVED successfully!`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = (id: string) => {
    setLawyers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'REJECTED' } : l))
    );
    if (selectedLawyer?.id === id) {
      setSelectedLawyer((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
    }
    setActionNotice(`Lawyer ${id} registration has been REJECTED.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredLawyers = lawyers.filter((l) => {
    const matchesFilter = filterStatus === 'ALL' || l.status === filterStatus;
    const matchesSearch =
      l.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.barCouncilNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = lawyers.filter((l) => l.status === 'PENDING').length;
  const approvedCount = lawyers.filter((l) => l.status === 'APPROVED').length;

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
                Your session is verified with user ID <code>{user?.id}</code> under issuer{' '}
                <code>{user?.decodedToken.iss || 'https://securetoken.google.com/haluser'}</code>.
              </p>
            </div>
          </div>
          <div className="session-badges">
            <span className="verified-pill">
              <CheckCircle className="pill-icon" /> Verified Credentials
            </span>
            <span className="role-approver-pill">
              <Award className="pill-icon" /> Approver Clearance Active
            </span>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionNotice && (
          <div className="dashboard-toast">
            <CheckCircle className="toast-icon" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper pending">
              <Clock className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Pending Approval</span>
              <span className="stat-value">{pendingCount}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper approved">
              <UserCheck className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Approved Lawyers</span>
              <span className="stat-value">{approvedCount}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper security">
              <Scale className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Total Submissions</span>
              <span className="stat-value">{lawyers.length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper auth">
              <ShieldCheck className="stat-icon" />
            </div>
            <div className="stat-data">
              <span className="stat-label">Security Clearance</span>
              <span className="stat-value status-online">Level 3 (Approver)</span>
            </div>
          </div>
        </div>

        {/* Workflow Section: Pending Lawyer Approvals (From EmployeeController) */}
        <div className="section-title-bar">
          <div>
            <h3 className="section-title">Lawyer Verification & Onboarding Queue</h3>
            <p className="section-subtitle">
              Review bar credentials, license authenticity, and activate advocate profiles.
            </p>
          </div>

          <div className="filter-controls">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search advocate, bar number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-buttons">
              {(['ALL', 'PENDING', 'APPROVED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Queue & Details Split Grid */}
        <div className="queue-grid">
          {/* List column */}
          <div className="lawyers-list-card">
            <div className="list-card-header">
              <span className="queue-count">Showing {filteredLawyers.length} advocates</span>
            </div>

            <div className="lawyers-list">
              {filteredLawyers.map((lawyer) => (
                <div
                  key={lawyer.id}
                  onClick={() => setSelectedLawyer(lawyer)}
                  className={`lawyer-item ${selectedLawyer?.id === lawyer.id ? 'active' : ''}`}
                >
                  <div className="lawyer-item-main">
                    <div className="lawyer-avatar">
                      {lawyer.fullName.charAt(4) || 'A'}
                    </div>
                    <div className="lawyer-brief">
                      <div className="lawyer-name-row">
                        <span className="lawyer-name">{lawyer.fullName}</span>
                        <span className={`status-badge ${lawyer.status.toLowerCase()}`}>
                          {lawyer.status}
                        </span>
                      </div>
                      <span className="lawyer-meta">
                        {lawyer.barCouncilNumber} • {lawyer.specialization}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="chevron-icon" />
                </div>
              ))}
            </div>
          </div>

          {/* Details Column */}
          {selectedLawyer ? (
            <div className="lawyer-details-card">
              <div className="details-header">
                <div>
                  <div className="badge-row">
                    <span className={`status-badge ${selectedLawyer.status.toLowerCase()}`}>
                      {selectedLawyer.status}
                    </span>
                    <span className="timestamp">Received: {selectedLawyer.submittedAt}</span>
                  </div>
                  <h4 className="detail-name">{selectedLawyer.fullName}</h4>
                  <p className="detail-sub">{selectedLawyer.specialization}</p>
                </div>

                <div className="detail-actions">
                  {selectedLawyer.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedLawyer.id)}
                        className="action-btn approve-btn"
                      >
                        <CheckCircle className="btn-icon" />
                        <span>Approve License</span>
                      </button>
                      <button
                        onClick={() => handleReject(selectedLawyer.id)}
                        className="action-btn reject-btn"
                      >
                        <XCircle className="btn-icon" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {selectedLawyer.status === 'APPROVED' && (
                    <span className="approved-indicator">
                      <CheckCircle className="approved-icon" />
                      <span>Approved by Staff</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="details-body">
                <div className="detail-block">
                  <span className="block-title">Verification Credentials</span>
                  <div className="info-fields-grid">
                    <div className="info-field">
                      <span className="field-label">Bar Council Enrollment ID</span>
                      <span className="field-value font-mono">{selectedLawyer.barCouncilNumber}</span>
                    </div>
                    <div className="info-field">
                      <span className="field-label">Standing Experience</span>
                      <span className="field-value">{selectedLawyer.experienceYears} Years</span>
                    </div>
                    <div className="info-field">
                      <span className="field-label">Direct Contact Phone</span>
                      <span className="field-value flex-center">
                        <Phone className="field-icon" /> {selectedLawyer.phone}
                      </span>
                    </div>
                    <div className="info-field">
                      <span className="field-label">Registered Email</span>
                      <span className="field-value flex-center">
                        <Mail className="field-icon" /> {selectedLawyer.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-block">
                  <span className="block-title">Document Audit & Compliance</span>
                  <div className="document-checks">
                    <div className="doc-item">
                      <FileText className="doc-icon" />
                      <div className="doc-text">
                        <span className="doc-title">Bar Council ID Card (Front & Back)</span>
                        <span className="doc-meta">Verified cryptographic signature</span>
                      </div>
                      <span className="doc-status verified">PASSED</span>
                    </div>
                    <div className="doc-item">
                      <FileText className="doc-icon" />
                      <div className="doc-text">
                        <span className="doc-title">Certificate of Practice (COP)</span>
                        <span className="doc-meta">Valid through 2028</span>
                      </div>
                      <span className="doc-status verified">PASSED</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-card">
              <BadgeAlert className="empty-icon" />
              <span>Select an advocate from the queue to view and verify credentials.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
