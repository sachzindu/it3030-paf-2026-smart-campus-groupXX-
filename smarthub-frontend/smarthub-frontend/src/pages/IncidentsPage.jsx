import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  getMyIncidents,
  getAllIncidents,
  getAssignedIncidents,
  updateStatus,
  deleteIncident,
} from '../api/incidentApi';

const STATUS_COLORS = {
  PENDING: 'bg-warning/10 text-warning',
  OPEN: 'bg-primary/10 text-primary',
  IN_PROGRESS: 'bg-warning/10 text-warning',
  RESOLVED: 'bg-success/10 text-success',
  CLOSED: 'bg-muted/10 text-muted border-border',
  REJECTED: 'bg-danger/10 text-danger'
};

const PRIORITY_COLORS = {
  LOW: 'text-success',
  MEDIUM: 'text-warning',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-danger font-bold'
};

export default function IncidentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rowUpdating, setRowUpdating] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  
  // For Technician/Admin toggles if they want to see "All" vs "Assigned/My"
  const [viewMode, setViewMode] = useState(isTechnician ? 'ASSIGNED' : 'ALL');

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (isAdmin) {
        res = await getAllIncidents();
      } else if (isTechnician) {
        if (viewMode === 'ASSIGNED') {
          res = await getAssignedIncidents();
        } else {
          res = await getAllIncidents();
        }
      } else {
        res = await getMyIncidents();
      }
      setIncidents(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isTechnician, viewMode]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleRowStatusUpdate = async (ticket, nextStatus) => {
    if (ticket.status === nextStatus) return;

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
      setRowUpdating((prev) => ({ ...prev, [ticket.id]: true }));
      await updateStatus(ticket.id, payload);
      await fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update ticket status.');
    } finally {
      setRowUpdating((prev) => ({ ...prev, [ticket.id]: false }));
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this pending ticket? This action cannot be undone.')) return;
    try {
      setDeletingId(ticketId);
      await deleteIncident(ticketId);
      await fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ticket.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Ticketing System</h1>
            <p className="text-muted mt-1">Manage and track campus maintenance requests.</p>
          </div>
          <button
            onClick={() => navigate('/incidents/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
          >
            + Report Incident
          </button>
        </div>

        {isTechnician && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode('ASSIGNED')}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${viewMode === 'ASSIGNED' ? 'bg-primary text-white' : 'bg-surface text-muted'}`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${viewMode === 'ALL' ? 'bg-primary text-white' : 'bg-surface text-muted'}`}
            >
              All Open Tickets
            </button>
          </div>
        )}

        {error && <div className="text-danger bg-danger/10 px-4 py-3 rounded-lg text-sm">{error}</div>}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-border/50">
             <p className="text-muted font-medium">No tickets found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface border-b border-border text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Ticket</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  {(isAdmin || isTechnician) && <th className="px-6 py-4 font-semibold">Update Status</th>}
                  <th className="px-6 py-4 font-semibold hidden md:table-cell">Reporter / Date</th>
                  <th className="px-6 py-4 font-semibold">Target</th>
                  {!isAdmin && !isTechnician && <th className="px-6 py-4 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {incidents.map((t) => (
                  // Keep row-click navigation, but stop propagation inside inline action controls.
                  <tr 
                    key={t.id} 
                    className="hover:bg-surface/50 cursor-pointer transition"
                    onClick={() => navigate(`/incidents/${t.id}`)}
                  >
                    <td className="px-6 py-4 w-1/3">
                      <p className="font-semibold text-ink line-clamp-1">{t.title}</p>
                      <p className="text-xs text-muted mt-0.5 max-w-[200px] truncate">{t.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${PRIORITY_COLORS[t.priority]} font-medium`}>{t.priority}</span>
                    </td>
                    <td className="px-6 py-4 text-muted">{t.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status] || ''}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    {(isAdmin || isTechnician) && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status}
                          onChange={(e) => handleRowStatusUpdate(t, e.target.value)}
                          disabled={Boolean(rowUpdating[t.id])}
                          className="px-2.5 py-1.5 border border-border rounded-lg text-xs outline-none"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    )}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-ink">{t.reporterName}</p>
                      <p className="text-xs text-muted">{new Date(t.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary font-semibold hover:underline">View →</button>
                    </td>
                    {!isAdmin && !isTechnician && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        {t.status === 'PENDING' ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => navigate(`/incidents/${t.id}/edit`)}
                              className="text-primary font-semibold hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(t.id)}
                              disabled={deletingId === t.id}
                              className="text-danger font-semibold hover:underline disabled:opacity-60"
                            >
                              {deletingId === t.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">Locked after pending</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
