import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/axios';
import {
  getIncidentById,
  updateStatus,
  updatePriority,
  assignTechnician,
  getComments,
  addComment,
  deleteComment,
  deleteIncident,
  getUsersByRole,
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
  LOW: 'text-green-600',
  MEDIUM: 'text-warning',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-danger',
};

export default function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [incident, setIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newComment, setNewComment] = useState('');
  
  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const canUpdateStatus = isAdmin || isTechnician;
  const isRegularUser = user?.role === 'USER';
  const isAdminLocked = isAdmin && incident?.adminLocked;
  const isOwner = incident && user?.email && incident.reporterEmail?.toLowerCase() === user.email.toLowerCase();
  const canEditOwnIncident = isRegularUser && isOwner && incident?.status === 'PENDING';

  // Status Update state
  const [statusUpdate, setStatusUpdate] = useState('');
  const [resNotes, setResNotes] = useState('');

  // ---- Admin: Assign Technician state ----
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  // ---- Admin: Edit Priority state ----
  const [selectedPriority, setSelectedPriority] = useState('');
  const [adminUpdateLoading, setAdminUpdateLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  // Fetch available technicians when admin opens the page
  useEffect(() => {
    if (isAdmin) {
      fetchTechnicians();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const incRes = await getIncidentById(id);
      const incData = incRes.data.data;
      setIncident(incData);
      setStatusUpdate(incData.status);
      setResNotes(incData.resolutionNotes || '');
      setSelectedPriority(incData.priority);
      setSelectedTechnicianId(incData.assigneeId || '');

      const comRes = await getComments(id);
      setComments(comRes.data.data);
    } catch {
      setError('Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      // Fetch both TECHNICIANs and ADMINs since both can be assigned
      const [techRes, adminRes] = await Promise.all([
        getUsersByRole('TECHNICIAN'),
        getUsersByRole('ADMIN'),
      ]);
      const allAssignees = [...(techRes.data.data || []), ...(adminRes.data.data || [])];
      // Deduplicate by id
      const unique = Array.from(new Map(allAssignees.map(u => [u.id, u])).values());
      setTechnicians(unique);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await updateStatus(id, { status: statusUpdate, resolutionNotes: resNotes });
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating status');
    }
  };

  const handleUpdateTicket = async () => {
    if (isAdmin) {
      const currentAssigneeId = incident?.assigneeId ? String(incident.assigneeId) : '';
      const hasAssigneeChange = Boolean(selectedTechnicianId) && selectedTechnicianId !== currentAssigneeId;
      const hasPriorityChange = Boolean(selectedPriority) && selectedPriority !== incident.priority;
      const hasStatusChange =
        statusUpdate !== incident.status ||
        (resNotes || '') !== (incident.resolutionNotes || '');

      if (!hasAssigneeChange && !hasPriorityChange && !hasStatusChange) return;

      try {
        setAdminUpdateLoading(true);

        if (hasAssigneeChange) {
          await assignTechnician(id, { technicianId: Number(selectedTechnicianId) });
        }
        if (hasPriorityChange) {
          await updatePriority(id, { priority: selectedPriority });
        }
        if (hasStatusChange) {
          await updateStatus(id, { status: statusUpdate, resolutionNotes: resNotes });
        }

        await fetchData();
      } catch (e) {
        alert(e.response?.data?.message || 'Error updating ticket');
      } finally {
        setAdminUpdateLoading(false);
      }
      return;
    }

    await handleStatusUpdate();
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment(id, { content: newComment });
      setNewComment('');
      const comRes = await getComments(id);
      setComments(comRes.data.data);
    } catch {
      alert('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch {
      alert('Failed to delete comment');
    }
  }

  const handleEditIncident = () => {
    navigate(`/incidents/${id}/edit`);
  };

  const handleDeleteIncident = async () => {
    if (!window.confirm('Delete this pending incident? This action cannot be undone.')) return;
    try {
      await deleteIncident(id);
      navigate('/incidents', { replace: true });
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete incident');
    }
  };

  if (loading) return <DashboardLayout><div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div></DashboardLayout>;
  if (error) return <DashboardLayout><div className="bg-danger/10 text-danger p-4 rounded-xl">{error}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-ink">{incident.title}</h1>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${STATUS_COLORS[incident.status]}`}>
                {incident.status}
              </span>
            </div>
            
            <p className="text-ink mb-6 whitespace-pre-wrap">{incident.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm bg-surface p-4 rounded-xl mb-6">
              <div><span className="text-muted">Category:</span> <span className="font-semibold">{incident.category}</span></div>
              <div><span className="text-muted">Priority:</span> <span className={`font-semibold ${PRIORITY_COLORS[incident.priority] || 'text-warning'}`}>{incident.priority}</span></div>
              <div><span className="text-muted">Reporter:</span> <span className="font-semibold">{incident.reporterName}</span></div>
              <div><span className="text-muted">Target:</span> <span className="font-semibold">{incident.facilityName || incident.location}</span></div>
            </div>

            {incident.imageUrls?.length > 0 && (
              <div className="mb-2">
                <h3 className="text-sm font-bold text-ink mb-3">Evidence Images</h3>
                <div className="flex gap-4">
                  {incident.imageUrls.map((url, idx) => (
                    <a key={idx} href={`${API_BASE_URL}${url}`} target="_blank" rel="noreferrer">
                      <img src={`${API_BASE_URL}${url}`} alt="evidence" className="w-32 h-32 object-cover rounded-xl border border-border shadow-sm hover:opacity-80 transition cursor-zoom-in" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {canEditOwnIncident && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleEditIncident}
                  className="px-4 py-2.5 text-sm font-semibold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  Edit Incident
                </button>
                <button
                  onClick={handleDeleteIncident}
                  className="px-4 py-2.5 text-sm font-semibold text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors"
                >
                  Delete Incident
                </button>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
            <h2 className="text-lg font-bold text-ink mb-4">Discussion</h2>
            
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-muted italic">No comments yet.</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="bg-surface p-4 rounded-xl relative group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-ink">{c.authorName} <span className="text-xs text-muted font-normal">({c.authorRole})</span></span>
                      <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-ink">{c.content}</p>
                    
                    {(isAdmin || c.authorId === user.id) && (
                      <button onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 text-danger text-xs hover:underline transition">Delete</button>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Type a comment..." className="flex-1 px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
              <button disabled={!newComment.trim()} type="submit" className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-royal disabled:opacity-50">Send</button>
            </form>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {isRegularUser && (
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
              <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Ticket Details</h2>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-muted text-xs">Assigned Technician</p>
                  <p className="font-semibold text-ink">{incident.assigneeName || 'Not assigned yet'}</p>
                </div>
                <div>
                  <p className="text-muted text-xs">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[incident.status] || ''}`}>
                    {incident.status?.replace('_', ' ')}
                  </span>
                </div>
                {canEditOwnIncident && (
                  <div className="text-xs text-muted bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
                    You can edit or delete this ticket while it remains pending.
                  </div>
                )}
                <div>
                  <p className="text-muted text-xs">Resolution Notes</p>
                  <p className="text-ink text-sm whitespace-pre-wrap">
                    {incident.resolutionNotes || 'No resolution notes yet.'}
                  </p>
                </div>
              </div>
            </div>
          )}

           <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
             <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Ticketing Info</h2>
             <div className="space-y-4 text-sm">
               <div>
                 <p className="text-muted text-xs">Assignee</p>
                 <p className="font-semibold">{incident.assigneeName || 'Unassigned'}</p>
               </div>
               <div>
                 <p className="text-muted text-xs">Created At</p>
                 <p className="font-semibold">{new Date(incident.createdAt).toLocaleString()}</p>
               </div>
             </div>
           </div>

          {/* Admin: Assign Technician */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
              <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Assign Technician</h2>
              <div className="space-y-4">
                {isAdminLocked && (
                  <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                    Admin updates are locked after the first admin action.
                  </div>
                )}
                <div>
                  <label htmlFor="technician-select" className="block text-xs font-semibold text-ink mb-1">Select Technician</label>
                  <select
                    id="technician-select"
                    value={selectedTechnicianId}
                    onChange={e => setSelectedTechnicianId(e.target.value)}
                    disabled={isAdminLocked}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">— Select —</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>
                {incident.assigneeName && (
                  <p className="text-xs text-muted">
                    Currently assigned to: <span className="font-semibold text-ink">{incident.assigneeName}</span>
                  </p>
                )}
                <p className="text-xs text-muted">Saved when you click Update Ticket.</p>
              </div>
            </div>
          )}

          {/* Admin: Edit Priority */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
              <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Edit Priority</h2>
              <div className="space-y-4">
                {isAdminLocked && (
                  <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                    Admin updates are locked after the first admin action.
                  </div>
                )}
                <div>
                  <label htmlFor="priority-select" className="block text-xs font-semibold text-ink mb-1">Priority</label>
                  <select
                    id="priority-select"
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value)}
                    disabled={isAdminLocked}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <p className="text-xs text-muted">Saved when you click Update Ticket.</p>
              </div>
            </div>
          )}

          {canUpdateStatus && (
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
              <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Update Ticket</h2>
              <div className="space-y-4">
                {isAdminLocked && (
                  <div className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                    Admin updates are locked after the first admin action.
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                  <select
                    value={statusUpdate}
                    onChange={e => setStatusUpdate(e.target.value)}
                    disabled={isAdminLocked}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Resolution / Rejection Notes</label>
                  <textarea
                    rows="3"
                    value={resNotes}
                    onChange={e => setResNotes(e.target.value)}
                    disabled={isAdminLocked}
                    placeholder="Required when resolving or rejecting..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none"
                  ></textarea>
                </div>
                <button
                  onClick={handleUpdateTicket}
                  disabled={isAdminLocked || adminUpdateLoading}
                  className="w-full px-4 py-2 bg-ink text-white font-semibold rounded-lg hover:bg-gray-800 text-sm disabled:opacity-50"
                >
                  {adminUpdateLoading ? 'Updating...' : 'Update Ticket'}
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
