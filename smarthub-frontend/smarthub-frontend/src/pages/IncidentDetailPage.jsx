import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import {
  getIncidentById,
  updateStatus,
  updatePriority,
  assignTechnician,
  getComments,
  addComment,
  deleteComment,
  getUsersByRole,
} from '../api/incidentApi';

const STATUS_COLORS = {
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

const BASE_URL = 'http://localhost:8080'; // Typically read from env

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

  // Status Update state
  const [statusUpdate, setStatusUpdate] = useState('');
  const [resNotes, setResNotes] = useState('');

  // ---- Admin: Assign Technician state ----
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // ---- Admin: Edit Priority state ----
  const [selectedPriority, setSelectedPriority] = useState('');
  const [priorityLoading, setPriorityLoading] = useState(false);

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
    } catch (err) {
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

  const handleAssignTechnician = async () => {
    if (!selectedTechnicianId) {
      alert('Please select a technician to assign.');
      return;
    }
    try {
      setAssignLoading(true);
      await assignTechnician(id, { technicianId: Number(selectedTechnicianId) });
      await fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error assigning technician');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUpdatePriority = async () => {
    if (!selectedPriority) return;
    if (selectedPriority === incident.priority) return; // No change
    try {
      setPriorityLoading(true);
      await updatePriority(id, { priority: selectedPriority });
      await fetchData();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating priority');
    } finally {
      setPriorityLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await addComment(id, { content: newComment });
      setNewComment('');
      const comRes = await getComments(id);
      setComments(comRes.data.data);
    } catch (e) {
      alert('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (e) {
      alert('Failed to delete comment');
    }
  }

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
                    <a key={idx} href={`${BASE_URL}${url}`} target="_blank" rel="noreferrer">
                      <img src={`${BASE_URL}${url}`} alt="evidence" className="w-32 h-32 object-cover rounded-xl border border-border shadow-sm hover:opacity-80 transition cursor-zoom-in" />
                    </a>
                  ))}
                </div>
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
                <div>
                  <label htmlFor="technician-select" className="block text-xs font-semibold text-ink mb-1">Select Technician</label>
                  <select
                    id="technician-select"
                    value={selectedTechnicianId}
                    onChange={e => setSelectedTechnicianId(e.target.value)}
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
                <button
                  onClick={handleAssignTechnician}
                  disabled={assignLoading || !selectedTechnicianId}
                  className="w-full px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-royal text-sm disabled:opacity-50 transition"
                >
                  {assignLoading ? 'Assigning...' : 'Assign Technician'}
                </button>
              </div>
            </div>
          )}

          {/* Admin: Edit Priority */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
              <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Edit Priority</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="priority-select" className="block text-xs font-semibold text-ink mb-1">Priority</label>
                  <select
                    id="priority-select"
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <button
                  onClick={handleUpdatePriority}
                  disabled={priorityLoading || selectedPriority === incident.priority}
                  className="w-full px-4 py-2 bg-ink text-white font-semibold rounded-lg hover:bg-gray-800 text-sm disabled:opacity-50 transition"
                >
                  {priorityLoading ? 'Updating...' : 'Update Priority'}
                </button>
              </div>
            </div>
          )}

          {canUpdateStatus && (
            <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-6">
              <h2 className="text-sm font-bold text-ink mb-4 uppercase tracking-wider">Manage Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                  <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none">
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Resolution / Rejection Notes</label>
                  <textarea rows="3" value={resNotes} onChange={e => setResNotes(e.target.value)} placeholder="Required when resolving or rejecting..." className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none"></textarea>
                </div>
                <button onClick={handleStatusUpdate} className="w-full px-4 py-2 bg-ink text-white font-semibold rounded-lg hover:bg-gray-800 text-sm">
                  Update Ticket
                </button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
