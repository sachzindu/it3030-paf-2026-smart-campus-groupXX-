import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getMyBookings } from '../api/bookingApi';
import { getMyIncidents } from '../api/incidentApi';

/**
 * User Dashboard — live overview of the authenticated user's bookings,
 * incidents, and quick actions. Fetches real data from the backend.
 */

// ===========================
// Status / Priority Styling
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
  OPEN: 'bg-primary/10 text-primary',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success',
  CLOSED: 'bg-muted/10 text-muted',
  REJECTED: 'bg-danger/10 text-danger',
};

const INCIDENT_STATUS_DOT = {
  OPEN: 'bg-primary',
  IN_PROGRESS: 'bg-warning',
  RESOLVED: 'bg-success',
  CLOSED: 'bg-muted',
  REJECTED: 'bg-danger',
};

const PRIORITY_COLORS = {
  LOW: 'text-success',
  MEDIUM: 'text-warning',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-danger',
};

// ===========================
// Helpers
// ===========================

/** Formats an ISO date string or LocalDate to a short human date. */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // fallback for LocalDate strings like "2026-04-05"
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Formats a time string like "09:00:00" or "09:00" to "09:00". */
function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
}

/** Returns a friendly greeting based on the current hour. */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [errorBookings, setErrorBookings] = useState('');
  const [errorIncidents, setErrorIncidents] = useState('');

  // ===========================
  // Data Fetching
  // ===========================

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    setErrorBookings('');
    try {
      const res = await getMyBookings();
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
      const res = await getMyIncidents();
      setIncidents(res.data.data || []);
    } catch (err) {
      setErrorIncidents(err.response?.data?.message || 'Unable to load tickets.');
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchIncidents();
  }, [fetchBookings, fetchIncidents]);

  // ===========================
  // Derived Statistics
  // ===========================

  const bookingStats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    const approved = bookings.filter((b) => b.status === 'APPROVED').length;
    const today = new Date().toISOString().split('T')[0];
    const upcoming = bookings.filter(
      (b) => b.bookingDate >= today && (b.status === 'APPROVED' || b.status === 'PENDING')
    ).length;
    return { total, pending, approved, upcoming };
  }, [bookings]);

  const incidentStats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status === 'OPEN').length;
    const inProgress = incidents.filter((i) => i.status === 'IN_PROGRESS').length;
    const resolved = incidents.filter(
      (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
    ).length;
    return { total, open, inProgress, resolved };
  }, [incidents]);

  // ===========================
  // Recent items (latest 5, sorted by creation date desc)
  // ===========================

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [bookings]);

  const recentIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [incidents]);

  // Upcoming bookings — future dates, approved/pending, sorted by date asc
  const upcomingBookings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return [...bookings]
      .filter((b) => b.bookingDate >= today && (b.status === 'APPROVED' || b.status === 'PENDING'))
      .sort((a, b) => a.bookingDate.localeCompare(b.bookingDate) || (a.startTime || '').localeCompare(b.startTime || ''))
      .slice(0, 3);
  }, [bookings]);

  const isLoading = loadingBookings || loadingIncidents;
  const firstName = user?.name?.split(' ')[0] || 'there';

  // ===========================
  // Stat Cards Config
  // ===========================

  const statCards = [
    {
      label: 'Total Bookings',
      value: loadingBookings ? '...' : bookingStats.total,
      sub: `${bookingStats.pending} pending`,
      icon: CalendarIcon,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Upcoming',
      value: loadingBookings ? '...' : bookingStats.upcoming,
      sub: `${bookingStats.approved} approved`,
      icon: ClockIcon,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: 'Open Tickets',
      value: loadingIncidents ? '...' : incidentStats.open,
      sub: `${incidentStats.inProgress} in progress`,
      icon: TicketIcon,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
    },
    {
      label: 'Resolved Tickets',
      value: loadingIncidents ? '...' : incidentStats.resolved,
      sub: `${incidentStats.total} total`,
      icon: CheckCircleIcon,
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
              Here&apos;s a snapshot of your campus activity.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              id="quick-book-btn"
              onClick={() => navigate('/bookings/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4" />
              Book Resource
            </button>
            <button
              id="quick-report-btn"
              onClick={() => navigate('/incidents/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-ink border border-border text-sm font-semibold rounded-xl hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <AlertIcon className="w-4 h-4 text-warning" />
              Report Issue
            </button>
          </div>
        </div>

        {/* ====== Stat Cards ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-ink">{stat.value}</p>
              <p className="text-sm text-muted mt-1 font-medium">{stat.label}</p>
              <p className="text-xs text-muted/60 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* ====== Upcoming Bookings Banner ====== */}
        {!loadingBookings && upcomingBookings.length > 0 && (
          <div className="bg-gradient-to-r from-primary/5 via-royal/5 to-primary/5 rounded-2xl border border-primary/15 p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-ink">Upcoming Bookings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/bookings/${b.id}`)}
                  className="bg-white rounded-xl p-4 border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
                >
                  <p className="font-semibold text-ink text-sm truncate">{b.facilityName}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{formatDate(b.bookingDate)}</span>
                    <span className="text-border">•</span>
                    <span>
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        BOOKING_STATUS_COLORS[b.status] || 'bg-muted/10 text-muted'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${BOOKING_STATUS_DOT[b.status] || 'bg-muted'}`} />
                      {b.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====== Recent Bookings + Recent Incidents (Side by Side) ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ---- Recent Bookings ---- */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-ink">Recent Bookings</h2>
              </div>
              <button
                onClick={() => navigate('/bookings/my')}
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
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-danger">
                    <AlertIcon className="w-4 h-4 flex-shrink-0" />
                    <p>{errorBookings}</p>
                  </div>
                  <button
                    onClick={fetchBookings}
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loadingBookings && !errorBookings && recentBookings.length === 0 && (
                <EmptyState
                  icon={<CalendarIcon className="w-8 h-8 text-primary/30" />}
                  title="No bookings yet"
                  description="Book a room, lab, or equipment to get started."
                  actionLabel="Book Now"
                  onAction={() => navigate('/bookings/new')}
                />
              )}

              {!loadingBookings &&
                !errorBookings &&
                recentBookings.map((booking, idx) => (
                  <button
                    key={booking.id}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface/50 transition-colors text-left animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">
                          {booking.facilityName}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                            BOOKING_STATUS_COLORS[booking.status] || 'bg-muted/10 text-muted'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              BOOKING_STATUS_DOT[booking.status] || 'bg-muted'
                            }`}
                          />
                          {booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {formatDate(booking.bookingDate)}
                        </span>
                        <span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
                        {booking.facilityLocation && (
                          <span className="flex items-center gap-1 truncate">
                            <LocationIcon className="w-3.5 h-3.5 flex-shrink-0" />
                            {booking.facilityLocation}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-muted flex-shrink-0" />
                  </button>
                ))}
            </div>
          </div>

          {/* ---- Recent Incidents ---- */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-warning" />
                <h2 className="text-base font-semibold text-ink">My Tickets</h2>
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
                <div className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-danger">
                    <AlertIcon className="w-4 h-4 flex-shrink-0" />
                    <p>{errorIncidents}</p>
                  </div>
                  <button
                    onClick={fetchIncidents}
                    className="mt-2 text-xs font-semibold text-primary hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loadingIncidents && !errorIncidents && recentIncidents.length === 0 && (
                <EmptyState
                  icon={<TicketIcon className="w-8 h-8 text-warning/30" />}
                  title="No tickets reported"
                  description="Report a facility issue to create your first ticket."
                  actionLabel="Report Issue"
                  onAction={() => navigate('/incidents/new')}
                />
              )}

              {!loadingIncidents &&
                !errorIncidents &&
                recentIncidents.map((incident, idx) => (
                  <button
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface/50 transition-colors text-left animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">
                          {incident.title}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                            INCIDENT_STATUS_COLORS[incident.status] || 'bg-muted/10 text-muted'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              INCIDENT_STATUS_DOT[incident.status] || 'bg-muted'
                            }`}
                          />
                          {incident.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                        <span className={`font-medium ${PRIORITY_COLORS[incident.priority] || ''}`}>
                          {incident.priority}
                        </span>
                        <span className="text-border">•</span>
                        <span>{incident.category}</span>
                        <span className="text-border">•</span>
                        <span>{formatDate(incident.createdAt)}</span>
                      </div>
                      {incident.location && (
                        <p className="text-xs text-muted/70 mt-1 truncate flex items-center gap-1">
                          <LocationIcon className="w-3 h-3 flex-shrink-0" />
                          {incident.location}
                        </p>
                      )}
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-muted flex-shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* ====== Quick Links ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLinkCard
            title="Browse Facilities"
            description="Explore available rooms, labs, and equipment across campus."
            icon={<FacilityIcon className="w-6 h-6 text-primary" />}
            bgColor="bg-primary/5"
            borderColor="border-primary/10"
            onClick={() => navigate('/facilities')}
          />
          <QuickLinkCard
            title="My Bookings"
            description="View, track, or cancel your resource booking requests."
            icon={<CalendarIcon className="w-6 h-6 text-royal" />}
            bgColor="bg-royal/5"
            borderColor="border-royal/10"
            onClick={() => navigate('/bookings/my')}
          />
          <QuickLinkCard
            title="My Tickets"
            description="Check the status of your reported incidents and issues."
            icon={<TicketIcon className="w-6 h-6 text-warning" />}
            bgColor="bg-warning/5"
            borderColor="border-warning/10"
            onClick={() => navigate('/incidents')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// ===================================================================
// Reusable Sub-Components
// ===================================================================

/** Empty state with optional action button. */
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

/** Quick link card for navigating to key sections. */
function QuickLinkCard({ title, description, icon, bgColor, borderColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${bgColor} rounded-2xl border ${borderColor} p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-muted mt-1">{description}</p>
    </button>
  );
}

// ===================================================================
// Icon Components
// ===================================================================

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

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function LocationIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
