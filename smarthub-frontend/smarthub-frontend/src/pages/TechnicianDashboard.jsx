import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getAssignedIncidents, getAllIncidents, updateStatus } from '../api/incidentApi';

/**
 * Technician Dashboard — task-oriented command center for assigned tickets.
 * Fetches live data from the backend: assigned + all incidents.
 */

// ===========================
// Status & Priority Styling
// ===========================

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

const PRIORITY_COLORS = {
  LOW: 'text-success',
  MEDIUM: 'text-warning',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-danger',
};

const PRIORITY_BG = {
  LOW: 'bg-success/10 text-success',
  MEDIUM: 'bg-warning/10 text-warning',
  HIGH: 'bg-orange-500/10 text-orange-500',
  CRITICAL: 'bg-danger/10 text-danger',
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Check if a date string is today (comparing in local time). */
function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ===========================
  // State
  // ===========================
  const [assignedIncidents, setAssignedIncidents] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]);

  const [loadingAssigned, setLoadingAssigned] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);

  const [errorAssigned, setErrorAssigned] = useState('');
  const [errorAll, setErrorAll] = useState('');

  // Filter for assigned tickets list
  const [assignedFilter, setAssignedFilter] = useState('ACTIVE'); // ACTIVE | ALL | RESOLVED

  // Quick-action status update
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  // ===========================
  // Data Fetching
  // ===========================

  const fetchAssigned = useCallback(async () => {
    setLoadingAssigned(true);
    setErrorAssigned('');
    try {
      const res = await getAssignedIncidents();
      setAssignedIncidents(res.data.data || []);
    } catch (err) {
      setErrorAssigned(err.response?.data?.message || 'Unable to load assigned tickets.');
    } finally {
      setLoadingAssigned(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoadingAll(true);
    setErrorAll('');
    try {
      const res = await getAllIncidents();
      setAllIncidents(res.data.data || []);
    } catch (err) {
      setErrorAll(err.response?.data?.message || 'Unable to load all tickets.');
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    fetchAssigned();
    fetchAll();
  }, [fetchAssigned, fetchAll]);

  // ===========================
  // Derived Statistics
  // ===========================

  const stats = useMemo(() => {
    const total = assignedIncidents.length;
    const open = assignedIncidents.filter((i) => i.status === 'PENDING' || i.status === 'OPEN').length;
    const inProgress = assignedIncidents.filter((i) => i.status === 'IN_PROGRESS').length;
    const resolved = assignedIncidents.filter((i) => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
    const resolvedToday = assignedIncidents.filter(
      (i) => (i.status === 'RESOLVED' || i.status === 'CLOSED') && isToday(i.updatedAt)
    ).length;
    const critical = assignedIncidents.filter(
      (i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    ).length;
    const high = assignedIncidents.filter(
      (i) => i.priority === 'HIGH' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    ).length;

    // All-tickets stats (for context)
    const allOpen = allIncidents.filter((i) => i.status === 'PENDING' || i.status === 'OPEN').length;
    const allUnassigned = allIncidents.filter((i) => !i.assigneeId && (i.status === 'PENDING' || i.status === 'OPEN')).length;

    return { total, open, inProgress, resolved, resolvedToday, critical, high, allOpen, allUnassigned };
  }, [assignedIncidents, allIncidents]);

  // ===========================
  // Filtered & Sorted Lists
  // ===========================

  const filteredAssigned = useMemo(() => {
    let filtered;
    switch (assignedFilter) {
      case 'ACTIVE':
        filtered = assignedIncidents.filter(
          (i) => i.status === 'PENDING' || i.status === 'OPEN' || i.status === 'IN_PROGRESS'
        );
        break;
      case 'RESOLVED':
        filtered = assignedIncidents.filter(
          (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
        );
        break;
      default:
        filtered = assignedIncidents;
    }
    // Sort: critical first, then high, then by creation date desc
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...filtered].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 9;
      const pb = priorityOrder[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [assignedIncidents, assignedFilter]);

  const urgentTickets = useMemo(() => {
    return assignedIncidents.filter(
      (i) =>
        (i.priority === 'CRITICAL' || i.priority === 'HIGH') &&
        i.status !== 'RESOLVED' &&
        i.status !== 'CLOSED'
    );
  }, [assignedIncidents]);

  const recentUnassigned = useMemo(() => {
    return [...allIncidents]
      .filter((i) => !i.assigneeId && (i.status === 'PENDING' || i.status === 'OPEN'))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [allIncidents]);

  // ===========================
  // Quick Status Update
  // ===========================

  const handleQuickStatus = async (ticketId, newStatus) => {
    try {
      setUpdatingTicketId(ticketId);
      await updateStatus(ticketId, { status: newStatus });
      await fetchAssigned();
      await fetchAll();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating status');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  // ===========================
  // Stat Cards Config
  // ===========================

  const firstName = user?.name?.split(' ')[0] || 'Technician';

  const statCards = [
    {
      label: 'Assigned Tickets',
      value: loadingAssigned ? '...' : stats.total,
      sub: `${stats.open} open • ${stats.inProgress} in progress`,
      icon: TicketIcon,
      bgColor: 'bg-cyan/10',
      iconColor: 'text-cyan',
    },
    {
      label: 'In Progress',
      value: loadingAssigned ? '...' : stats.inProgress,
      sub: `${stats.critical} critical • ${stats.high} high`,
      icon: ProgressIcon,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
      alert: stats.critical > 0,
    },
    {
      label: 'Resolved Today',
      value: loadingAssigned ? '...' : stats.resolvedToday,
      sub: `${stats.resolved} resolved total`,
      icon: CheckCircleIcon,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      label: 'Unassigned Tickets',
      value: loadingAll ? '...' : stats.allUnassigned,
      sub: `${stats.allOpen} total open campus-wide`,
      icon: AlertIcon,
      bgColor: stats.allUnassigned > 0 ? 'bg-danger/10' : 'bg-muted/10',
      iconColor: stats.allUnassigned > 0 ? 'text-danger' : 'text-muted',
      alert: stats.allUnassigned > 3,
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
              Here are your assigned maintenance tasks.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              id="tech-view-all-tickets-btn"
              onClick={() => navigate('/incidents')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan to-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <TicketIcon className="w-4 h-4" />
              All Tickets
            </button>
            <button
              id="tech-report-incident-btn"
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

        {/* ====== Urgent Tickets Alert Banner ====== */}
        {!loadingAssigned && urgentTickets.length > 0 && (
          <div className="bg-danger/5 border border-danger/20 rounded-2xl p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <AlertIcon className="w-5 h-5 text-danger" />
              <h2 className="text-sm font-bold text-danger">
                {urgentTickets.length} Urgent Ticket{urgentTickets.length > 1 ? 's' : ''} Assigned to You
              </h2>
            </div>
            <div className="space-y-2">
              {urgentTickets.slice(0, 3).map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="w-full flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-danger/10 hover:shadow-md transition-all text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{inc.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {inc.location || inc.facilityName} • Reported {formatDate(inc.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_BG[inc.priority]}`}>
                      {inc.priority}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${INCIDENT_STATUS_COLORS[inc.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${INCIDENT_STATUS_DOT[inc.status]}`} />
                      {inc.status?.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
              {urgentTickets.length > 3 && (
                <button
                  onClick={() => navigate('/incidents')}
                  className="text-xs font-semibold text-danger hover:underline ml-1"
                >
                  View all {urgentTickets.length} urgent tickets →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ====== My Assigned Tickets + Unassigned Tickets ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---- Assigned Tickets (main, 2/3 width) ---- */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-cyan" />
                <h2 className="text-base font-semibold text-ink">
                  My Assigned Tickets
                  {!loadingAssigned && stats.total > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-cyan text-white text-xs font-bold rounded-full">
                      {stats.open + stats.inProgress}
                    </span>
                  )}
                </h2>
              </div>
              {/* Filter Tabs */}
              <div className="flex gap-1 bg-surface rounded-lg p-0.5">
                {[
                  { key: 'ACTIVE', label: 'Active' },
                  { key: 'RESOLVED', label: 'Resolved' },
                  { key: 'ALL', label: 'All' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setAssignedFilter(tab.key)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      assignedFilter === tab.key
                        ? 'bg-white text-ink shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-border/50">
              {loadingAssigned && (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-3 border-cyan border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {errorAssigned && (
                <ErrorRetry message={errorAssigned} onRetry={fetchAssigned} />
              )}

              {!loadingAssigned && !errorAssigned && filteredAssigned.length === 0 && (
                <EmptyState
                  icon={<TicketIcon className="w-8 h-8 text-cyan/30" />}
                  title={
                    assignedFilter === 'ACTIVE'
                      ? 'No active tickets'
                      : assignedFilter === 'RESOLVED'
                      ? 'No resolved tickets'
                      : 'No assigned tickets'
                  }
                  description={
                    assignedFilter === 'ACTIVE'
                      ? 'All your assigned tasks are complete. Great work!'
                      : 'Tickets assigned to you will appear here.'
                  }
                />
              )}

              {!loadingAssigned &&
                !errorAssigned &&
                filteredAssigned.map((incident, idx) => (
                  <div
                    key={incident.id}
                    className="px-6 py-4 hover:bg-surface/50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
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
                          <span>{incident.category}</span>
                          <span className="text-border">•</span>
                          <span>{incident.location || incident.facilityName || '—'}</span>
                          <span className="text-border">•</span>
                          <span>{formatDate(incident.createdAt)}</span>
                        </div>
                        {incident.reporterName && (
                          <p className="text-xs text-muted/70 mt-1">
                            Reported by {incident.reporterName}
                          </p>
                        )}
                      </button>

                      {/* Quick action buttons for active tickets */}
                      {(incident.status === 'OPEN' || incident.status === 'IN_PROGRESS') && (
                        <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {incident.status === 'OPEN' && (
                            <button
                              onClick={() => handleQuickStatus(incident.id, 'IN_PROGRESS')}
                              disabled={updatingTicketId === incident.id}
                              className="px-2.5 py-1.5 text-xs font-semibold text-warning bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors disabled:opacity-50"
                              title="Start working on this ticket"
                            >
                              {updatingTicketId === incident.id ? '...' : 'Start'}
                            </button>
                          )}
                          {incident.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => navigate(`/incidents/${incident.id}`)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-success bg-success/10 rounded-lg hover:bg-success/20 transition-colors"
                              title="Open ticket to resolve"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ---- Unassigned Tickets (sidebar, 1/3 width) ---- */}
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <AlertIcon className="w-5 h-5 text-danger" />
                <h2 className="text-base font-semibold text-ink">
                  Unassigned
                  {!loadingAll && stats.allUnassigned > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-danger text-white text-xs font-bold rounded-full">
                      {stats.allUnassigned}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs font-semibold text-primary hover:text-royal transition-colors"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-border/50">
              {loadingAll && (
                <div className="flex justify-center py-10">
                  <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {errorAll && (
                <ErrorRetry message={errorAll} onRetry={fetchAll} />
              )}

              {!loadingAll && !errorAll && recentUnassigned.length === 0 && (
                <EmptyState
                  icon={<CheckCircleIcon className="w-8 h-8 text-success/30" />}
                  title="All tickets assigned"
                  description="No open tickets are waiting for assignment."
                />
              )}

              {!loadingAll &&
                !errorAll &&
                recentUnassigned.map((incident, idx) => (
                  <button
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="w-full flex items-start gap-3 px-6 py-4 hover:bg-surface/50 transition-colors text-left animate-fade-in"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{incident.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                        <span className={`font-medium ${PRIORITY_COLORS[incident.priority] || ''}`}>
                          {incident.priority}
                        </span>
                        <span className="text-border">•</span>
                        <span>{formatDate(incident.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted/70 mt-0.5 truncate">
                        {incident.location || incident.facilityName || '—'}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-muted flex-shrink-0 mt-1" />
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* ====== Workload Summary ====== */}
        {!loadingAssigned && stats.total > 0 && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 animate-fade-in">
            <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Your Workload Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <WorkloadBar label="Open" count={stats.open} total={stats.total} color="bg-primary" />
              <WorkloadBar label="In Progress" count={stats.inProgress} total={stats.total} color="bg-warning" />
              <WorkloadBar label="Resolved" count={stats.resolved} total={stats.total} color="bg-success" />
              <WorkloadBar
                label="Critical/High"
                count={stats.critical + stats.high}
                total={stats.total}
                color="bg-danger"
              />
            </div>
          </div>
        )}

        {/* ====== Quick Links ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLinkCard
            title="All Tickets"
            description="Browse all campus incident and maintenance tickets."
            icon={<TicketIcon className="w-6 h-6 text-cyan" />}
            bgColor="bg-cyan/5"
            borderColor="border-cyan/10"
            onClick={() => navigate('/incidents')}
          />
          <QuickLinkCard
            title="Report Issue"
            description="Report a new facility issue or incident."
            icon={<AlertIcon className="w-6 h-6 text-warning" />}
            bgColor="bg-warning/5"
            borderColor="border-warning/10"
            onClick={() => navigate('/incidents/new')}
          />
          <QuickLinkCard
            title="My Dashboard"
            description="Refresh your task overview and ticket assignments."
            icon={<RefreshIcon className="w-6 h-6 text-primary" />}
            bgColor="bg-primary/5"
            borderColor="border-primary/10"
            onClick={() => { fetchAssigned(); fetchAll(); }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// ===================================================================
// Reusable Sub-Components
// ===================================================================

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-muted">{title}</p>
      <p className="text-xs text-muted/60 mt-1">{description}</p>
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

function WorkloadBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-sm font-bold text-ink">{count}</span>
      </div>
      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted/50 mt-0.5">{pct}%</p>
    </div>
  );
}

// ===================================================================
// Icon Components
// ===================================================================

function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function ProgressIcon({ className }) {
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

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
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

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}
