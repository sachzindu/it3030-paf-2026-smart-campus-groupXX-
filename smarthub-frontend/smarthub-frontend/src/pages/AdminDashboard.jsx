import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getAllBookings, reviewBooking } from '../api/bookingApi';
import { getAllIncidents, updateStatus } from '../api/incidentApi';
import { getAllFacilities } from '../api/facilityApi';
import api from '../api/axios';
import UserManagementPanel from '../components/UserManagementPanel';

/**
 * Admin Dashboard — operations command center.
 * Fetches live data from users, bookings, incidents, and facilities.
 */

// ===========================
// Status & Priority Styling
// ===========================

const BOOKING_STATUS_COLORS = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
  CANCELLED: 'bg-muted/10 text-muted',
};
const BOOKING_STATUS_DOT = {
  PENDING: 'bg-warning',
  APPROVED: 'bg-success',
  REJECTED: 'bg-danger',
  CANCELLED: 'bg-muted',
};

const INCIDENT_STATUS_COLORS = {
  PENDING: 'bg-warning/10 text-warning',
  OPEN: 'bg-primary/10 text-primary',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success',
  CLOSED: 'bg-muted/10 text-muted',
  REJECTED: 'bg-danger/10 text-danger',
};
const INCIDENT_STATUS_DOT = {
  PENDING: 'bg-warning',
  OPEN: 'bg-primary',
  IN_PROGRESS: 'bg-warning',
  RESOLVED: 'bg-success',
  CLOSED: 'bg-muted',
  REJECTED: 'bg-danger',
};

const INCIDENT_STATUS_OPTIONS = ['PENDING', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

const PRIORITY_COLORS = {
  LOW: 'text-success',
  MEDIUM: 'text-warning',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-danger',
};

const FACILITY_STATUS_COLORS = {
  ACTIVE: 'bg-success/10 text-success',
  OUT_OF_SERVICE: 'bg-danger/10 text-danger',
};

// ===========================
// Helpers
// ===========================

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ===========================
  // State
  // ===========================
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingFacilities, setLoadingFacilities] = useState(true);

  const [errorUsers, setErrorUsers] = useState('');
  const [errorBookings, setErrorBookings] = useState('');
  const [errorIncidents, setErrorIncidents] = useState('');
  const [errorFacilities, setErrorFacilities] = useState('');

  // Review modal
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [incidentStatusUpdating, setIncidentStatusUpdating] = useState({});

  // ===========================
  // Data Fetching
  // ===========================

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setErrorUsers('');
    try {
      const res = await api.get('/api/auth/users');
      setUsers(res.data.data || []);
    } catch (err) {
      setErrorUsers(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    setErrorBookings('');
    try {
      const res = await getAllBookings({});
      setBookings(res.data.data || []);
    } catch (err) {
      setErrorBookings(err.response?.data?.message || 'Unable to load bookings.');
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    setErrorIncidents('');
    try {
      const res = await getAllIncidents();
      setIncidents(res.data.data || []);
    } catch (err) {
      setErrorIncidents(err.response?.data?.message || 'Unable to load tickets.');
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  const fetchFacilities = useCallback(async () => {
    setLoadingFacilities(true);
    setErrorFacilities('');
    try {
      const res = await getAllFacilities();
      setFacilities(res.data.data || []);
    } catch (err) {
      setErrorFacilities(err.response?.data?.message || 'Unable to load facilities.');
    } finally {
      setLoadingFacilities(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchBookings();
    fetchIncidents();
    fetchFacilities();
  }, [fetchUsers, fetchBookings, fetchIncidents, fetchFacilities]);

  // ===========================
  // Derived Statistics
  // ===========================

  const userStats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const technicians = users.filter((u) => u.role === 'TECHNICIAN').length;
    const regularUsers = users.filter((u) => u.role === 'USER').length;
    return { total, admins, technicians, regularUsers };
  }, [users]);

  const bookingStats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    const approved = bookings.filter((b) => b.status === 'APPROVED').length;
    const rejected = bookings.filter((b) => b.status === 'REJECTED').length;
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter((b) => b.bookingDate === today).length;
    return { total, pending, approved, rejected, todayBookings };
  }, [bookings]);

  const incidentStats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status === 'PENDING' || i.status === 'OPEN').length;
    const inProgress = incidents.filter((i) => i.status === 'IN_PROGRESS').length;
    const resolved = incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
    const critical = incidents.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
    const unassigned = incidents.filter((i) => !i.assigneeId && (i.status === 'PENDING' || i.status === 'OPEN')).length;
    return { total, open, inProgress, resolved, critical, unassigned };
  }, [incidents]);

  const facilityStats = useMemo(() => {
    const total = facilities.length;
    const active = facilities.filter((f) => f.status === 'ACTIVE').length;
    const outOfService = facilities.filter((f) => f.status === 'OUT_OF_SERVICE').length;
    return { total, active, outOfService };
  }, [facilities]);

  // ===========================
  // Recent / Pending Items
  // ===========================

  const pendingBookings = useMemo(() => {
    return [...bookings]
      .filter((b) => b.status === 'PENDING')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 5);
  }, [bookings]);

  const recentIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [incidents]);

  const criticalIncidents = useMemo(() => {
    return incidents.filter(
      (i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    );
  }, [incidents]);

  // ===========================
  // Review Booking Modal
  // ===========================

  const openReviewModal = (booking, action) => {
    setReviewTarget(booking);
    setReviewAction(action);
    setAdminRemarks('');
    setReviewError('');
  };

  const handleReview = async () => {
    if (reviewAction === 'REJECTED' && !adminRemarks.trim()) {
      setReviewError('Remarks are required when rejecting a booking.');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    try {
      await reviewBooking(reviewTarget.id, {
        status: reviewAction,
        adminRemarks: adminRemarks.trim() || null,
      });
      setReviewTarget(null);
      fetchBookings();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to review booking.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleIncidentStatusUpdate = async (incident, nextStatus) => {
    if (incident.status === nextStatus) return;

    const payload = { status: nextStatus };
    if (nextStatus === 'RESOLVED' || nextStatus === 'REJECTED') {
      const notes = window.prompt(
        nextStatus === 'RESOLVED'
          ? 'Add resolution notes:'
          : 'Add rejection reason:'
      );
      if (!notes?.trim()) {
        alert('Notes are required for this status.');
        return;
      }
      payload.resolutionNotes = notes.trim();
    }

    try {
      setIncidentStatusUpdating((prev) => ({ ...prev, [incident.id]: true }));
      await updateStatus(incident.id, payload);
      await fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update incident status.');
    } finally {
      setIncidentStatusUpdating((prev) => ({ ...prev, [incident.id]: false }));
    }
  };

  // ===========================
  // Stat Cards Config
  // ===========================

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const statCards = [
    {
      label: 'Total Users',
      value: loadingUsers ? '...' : userStats.total,
      sub: `${userStats.technicians} technicians • ${userStats.regularUsers} users`,
      icon: UsersIcon,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Pending Bookings',
      value: loadingBookings ? '...' : bookingStats.pending,
      sub: `${bookingStats.total} total • ${bookingStats.todayBookings} today`,
      icon: CalendarIcon,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
      alert: bookingStats.pending > 0,
    },
    {
      label: 'Open Tickets',
      value: loadingIncidents ? '...' : incidentStats.open + incidentStats.inProgress,
      sub: `${incidentStats.critical} critical • ${incidentStats.unassigned} unassigned`,
      icon: TicketIcon,
      bgColor: incidentStats.critical > 0 ? 'bg-danger/10' : 'bg-violet/10',
      iconColor: incidentStats.critical > 0 ? 'text-danger' : 'text-violet',
      alert: incidentStats.critical > 0,
    },
    {
      label: 'Facilities',
      value: loadingFacilities ? '...' : facilityStats.total,
      sub: `${facilityStats.active} active • ${facilityStats.outOfService} down`,
      icon: FacilityIcon,
      bgColor: 'bg-indigo/10',
      iconColor: 'text-indigo',
    },
  ];

  // ===========================
  // Render
  // ===========================

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* ====== Header ====== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-muted mt-1 text-sm">
              Campus operations at a glance.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              id="admin-add-facility-btn"
              onClick={() => navigate('/facilities/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4" />
              Add Facility
            </button>
            <button
              id="admin-manage-bookings-btn"
              onClick={() => navigate('/bookings')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-ink border border-border text-sm font-semibold rounded-xl hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <CalendarIcon className="w-4 h-4 text-primary" />
              Manage Bookings
            </button>
          </div>
        </div>

        {/* ====== Stat Cards ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, index) => (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-fade-in ${
                stat.alert ? 'border-warning/30' : 'border-border/50'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                {stat.alert && (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-warning" />
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-ink">{stat.value}</p>
              <p className="text-sm text-muted mt-1 font-medium">{stat.label}</p>
              <p className="text-xs text-muted/60 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ====== Critical Alerts Banner ====== */}
        {!loadingIncidents && criticalIncidents.length > 0 && (
          <div className="bg-danger/5 border border-danger/20 rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <AlertIcon className="w-5 h-5 text-danger" />
              <h2 className="text-sm font-bold text-danger">
                {criticalIncidents.length} Critical Incident{criticalIncidents.length > 1 ? 's' : ''} Requiring Attention
              </h2>
            </div>
            <div className="space-y-2">
              {criticalIncidents.slice(0, 3).map((inc) => (
                <div
                  key={inc.id}
                  className="w-full flex items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-danger/10 hover:shadow-md transition-all"
                >
                  <button
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-sm font-semibold text-ink truncate">{inc.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {inc.location} • Reported {formatDate(inc.createdAt)}
                      {inc.assigneeName ? ` • Assigned to ${inc.assigneeName}` : ' • Unassigned'}
                    </p>
                  </button>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${INCIDENT_STATUS_COLORS[inc.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${INCIDENT_STATUS_DOT[inc.status]}`} />
                      {inc.status?.replace('_', ' ')}
                    </span>
                    <select
                      value={inc.status}
                      onChange={(e) => handleIncidentStatusUpdate(inc, e.target.value)}
                      disabled={Boolean(incidentStatusUpdating[inc.id]) || inc.adminLocked}
                      className="px-2 py-1 border border-border rounded-lg text-xs bg-white outline-none"
                    >
                      {INCIDENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {criticalIncidents.length > 3 && (
                <button
                  onClick={() => navigate('/incidents')}
                  className="text-xs font-semibold text-danger hover:underline ml-1"
                >
                  View all {criticalIncidents.length} critical incidents →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ====== Pending Bookings + Recent Incidents ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ---- Pending Bookings (actionable) ---- */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-warning" />
                <h2 className="text-base font-semibold text-ink">
                  Pending Approvals
                  {!loadingBookings && bookingStats.pending > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-warning text-white text-xs font-bold rounded-full">
                      {bookingStats.pending}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => navigate('/bookings')}
                className="text-xs font-semibold text-primary hover:text-royal transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-border/50">
              {loadingBookings && (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {errorBookings && (
                <ErrorRetry message={errorBookings} onRetry={fetchBookings} />
              )}

              {!loadingBookings && !errorBookings && pendingBookings.length === 0 && (
                <EmptyState
                  icon={<CheckCircleIcon className="w-8 h-8 text-success/30" />}
                  title="All caught up!"
                  description="No pending booking requests to review."
                />
              )}

              {!loadingBookings &&
                !errorBookings &&
                pendingBookings.map((booking, idx) => (
                  <div
                    key={booking.id}
                    className="px-6 py-4 hover:bg-surface/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <button
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-semibold text-ink truncate">
                          {booking.facilityName}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {booking.userName} • {formatDate(booking.bookingDate)} • {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                        </p>
                        <p className="text-xs text-muted/70 mt-0.5 truncate">{booking.purpose}</p>
                      </button>
                      <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openReviewModal(booking, 'APPROVED')}
                          className="px-3 py-1.5 text-xs font-semibold text-success bg-success/10 rounded-lg hover:bg-success/20 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openReviewModal(booking, 'REJECTED')}
                          className="px-3 py-1.5 text-xs font-semibold text-danger bg-danger/10 rounded-lg hover:bg-danger/20 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ---- Recent Incidents ---- */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-violet" />
                <h2 className="text-base font-semibold text-ink">Recent Tickets</h2>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs font-semibold text-primary hover:text-royal transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-border/50">
              {loadingIncidents && (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {errorIncidents && (
                <ErrorRetry message={errorIncidents} onRetry={fetchIncidents} />
              )}

              {!loadingIncidents && !errorIncidents && recentIncidents.length === 0 && (
                <EmptyState
                  icon={<TicketIcon className="w-8 h-8 text-violet/30" />}
                  title="No incidents reported"
                  description="Campus systems are running smoothly."
                />
              )}

              {!loadingIncidents &&
                !errorIncidents &&
                recentIncidents.map((incident, idx) => (
                  <div
                    key={incident.id}
                    className="w-full flex items-center gap-3 px-6 py-4 hover:bg-surface/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <button
                      onClick={() => navigate(`/incidents/${incident.id}`)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">{incident.title}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${INCIDENT_STATUS_COLORS[incident.status]}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${INCIDENT_STATUS_DOT[incident.status]}`} />
                          {incident.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                        <span className={`font-medium ${PRIORITY_COLORS[incident.priority] || ''}`}>
                          {incident.priority}
                        </span>
                        <span className="text-border">•</span>
                        <span>{incident.reporterName}</span>
                        <span className="text-border">•</span>
                        <span>{formatDate(incident.createdAt)}</span>
                        {incident.assigneeName && (
                          <>
                            <span className="text-border">•</span>
                            <span className="text-cyan">{incident.assigneeName}</span>
                          </>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={incident.status}
                        onChange={(e) => handleIncidentStatusUpdate(incident, e.target.value)}
                        disabled={Boolean(incidentStatusUpdating[incident.id]) || incident.adminLocked}
                        className="px-2.5 py-1.5 border border-border rounded-lg text-xs bg-white outline-none"
                      >
                        {INCIDENT_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <ChevronRightIcon className="w-4 h-4 text-muted flex-shrink-0" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ====== Facility Overview + User Breakdown ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---- Facility Status List ---- */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FacilityIcon className="w-5 h-5 text-indigo" />
                <h2 className="text-base font-semibold text-ink">Facilities Overview</h2>
              </div>
              <button
                onClick={() => navigate('/facilities')}
                className="text-xs font-semibold text-primary hover:text-royal transition-colors"
              >
                Manage →
              </button>
            </div>

            {loadingFacilities && (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {errorFacilities && <ErrorRetry message={errorFacilities} onRetry={fetchFacilities} />}

            {!loadingFacilities && !errorFacilities && facilities.length === 0 && (
              <EmptyState
                icon={<FacilityIcon className="w-8 h-8 text-indigo/30" />}
                title="No facilities configured"
                description="Add your first campus facility to get started."
                actionLabel="Add Facility"
                onAction={() => navigate('/facilities/new')}
              />
            )}

            {!loadingFacilities && !errorFacilities && facilities.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface text-left">
                      <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Facility</th>
                      <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Type</th>
                      <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Location</th>
                      <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {facilities.slice(0, 6).map((f) => (
                      <tr
                        key={f.id}
                        className="hover:bg-surface/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/facilities/${f.id}`)}
                      >
                        <td className="px-5 py-3">
                          <p className="font-semibold text-ink">{f.name}</p>
                          {f.capacity && <p className="text-xs text-muted">Capacity: {f.capacity}</p>}
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {f.facilityType?.replace('_', ' ')}
                        </td>
                        <td className="px-5 py-3 text-muted">{f.location}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${FACILITY_STATUS_COLORS[f.status] || 'bg-muted/10 text-muted'}`}>
                            {f.status?.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {facilities.length > 6 && (
                  <div className="px-5 py-3 border-t border-border/50 text-center">
                    <button
                      onClick={() => navigate('/facilities')}
                      className="text-xs font-semibold text-primary hover:text-royal transition-colors"
                    >
                      View all {facilities.length} facilities →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ---- User Breakdown ---- */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50">
              <UsersIcon className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-ink">User Breakdown</h2>
            </div>

            {loadingUsers && (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {errorUsers && <ErrorRetry message={errorUsers} onRetry={fetchUsers} />}

            {!loadingUsers && !errorUsers && (
              <div className="p-6 space-y-4">
                <RoleBar label="Users" count={userStats.regularUsers} total={userStats.total} color="bg-primary" />
                <RoleBar label="Technicians" count={userStats.technicians} total={userStats.total} color="bg-cyan" />
                <RoleBar label="Admins" count={userStats.admins} total={userStats.total} color="bg-violet" />

                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted font-medium">Total Accounts</span>
                    <span className="text-ink font-bold text-lg">{userStats.total}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ====== User Management ====== */}
        <UserManagementPanel />

        {/* ====== Quick Links ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <QuickLinkCard
            title="Manage Facilities"
            icon={<FacilityIcon className="w-5 h-5 text-indigo" />}
            bgColor="bg-indigo/5" borderColor="border-indigo/10"
            onClick={() => navigate('/facilities')}
          />
          <QuickLinkCard
            title="All Bookings"
            icon={<CalendarIcon className="w-5 h-5 text-primary" />}
            bgColor="bg-primary/5" borderColor="border-primary/10"
            onClick={() => navigate('/bookings')}
          />
          <QuickLinkCard
            title="Ticketing System"
            icon={<TicketIcon className="w-5 h-5 text-violet" />}
            bgColor="bg-violet/5" borderColor="border-violet/10"
            onClick={() => navigate('/incidents')}
          />
        </div>
      </div>

      {/* ====== Review Booking Modal ====== */}
      {reviewTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-ink mb-1">
              {reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Booking
            </h3>
            <p className="text-muted text-sm mb-5">
              <span className="font-semibold text-ink">{reviewTarget.facilityName}</span>
              {' — '}{formatDate(reviewTarget.bookingDate)}, {formatTime(reviewTarget.startTime)} – {formatTime(reviewTarget.endTime)}
              <br />
              Requested by <span className="font-medium">{reviewTarget.userName}</span>
            </p>

            <div className="bg-surface rounded-xl p-3 mb-4">
              <p className="text-xs font-semibold text-muted uppercase mb-1">Purpose</p>
              <p className="text-sm text-ink">{reviewTarget.purpose}</p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Remarks{' '}
                {reviewAction === 'REJECTED' && <span className="text-danger">*</span>}
              </label>
              <textarea
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                rows={3}
                placeholder={reviewAction === 'REJECTED' ? 'Reason for rejection (required)...' : 'Optional remarks...'}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
            </div>

            {reviewError && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-3 py-2 rounded-lg text-xs font-medium mb-4">
                {reviewError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setReviewTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted bg-surface border border-border rounded-xl hover:bg-mist transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewLoading}
                className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 ${
                  reviewAction === 'APPROVED' ? 'bg-success hover:bg-emerald-600' : 'bg-danger hover:bg-red-600'
                }`}
              >
                {reviewLoading ? 'Processing...' : reviewAction === 'APPROVED' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ===================================================================
// Reusable Sub-Components
// ===================================================================

function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="text-xs text-muted/60 mt-1">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ErrorRetry({ message, onRetry }) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-danger">
        <AlertIcon className="w-4 h-4 flex-shrink-0" />
        <p>{message}</p>
      </div>
      <button onClick={onRetry} className="mt-2 text-xs font-semibold text-primary hover:underline">
        Retry
      </button>
    </div>
  );
}

function RoleBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="text-sm font-bold text-ink">{count}</span>
      </div>
      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuickLinkCard({ title, icon, bgColor, borderColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${bgColor} rounded-2xl border ${borderColor} p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group flex items-center gap-3`}
    >
      {icon}
      <span className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">{title}</span>
    </button>
  );
}

// ===================================================================
// Icon Components
// ===================================================================

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function FacilityIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
