import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

/**
 * User management panel for the Admin Dashboard.
 * Provides CRUD operations for users and technicians.
 */

const ROLE_BADGE = {
  ADMIN: 'bg-violet/10 text-violet',
  TECHNICIAN: 'bg-cyan/10 text-cyan',
  USER: 'bg-primary/10 text-primary',
};

const INITIAL_FORM = { name: '', email: '', password: '', role: 'USER' };

export default function UserManagementPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editUserId, setEditUserId] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/auth/users');
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ---- Filtering ----
  const filtered = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // ---- Create / Edit ----
  const openCreate = () => {
    setModalMode('create');
    setFormData(INITIAL_FORM);
    setEditUserId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setModalMode('edit');
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setEditUserId(user.id);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    if (modalMode === 'create' && formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === 'create') {
        await api.post('/api/auth/users', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        });
      } else {
        await api.put(`/api/auth/users/${editUserId}`, {
          name: formData.name.trim(),
          role: formData.role,
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/auth/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ---- Toggle Enable/Disable ----
  const toggleEnabled = async (user) => {
    try {
      if (user.enabled) {
        await api.put(`/api/auth/users/${user.id}/disable`);
      } else {
        await api.put(`/api/auth/users/${user.id}/enable`);
      }
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-border/50 gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h2 className="text-base font-semibold text-ink">User Management</h2>
          <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{users.length} total</span>
        </div>
        <button
          id="admin-add-user-btn"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-border/30 bg-surface/50">
        <div className="flex gap-1.5">
          {[{ v: '', l: 'All' }, { v: 'USER', l: 'Users' }, { v: 'TECHNICIAN', l: 'Technicians' }, { v: 'ADMIN', l: 'Admins' }].map((t) => (
            <button
              key={t.v}
              onClick={() => setRoleFilter(t.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === t.v ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-ink hover:bg-white'
              }`}
            >
              {t.l} {t.v ? `(${roleCounts[t.v] || 0})` : `(${users.length})`}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto px-3 py-1.5 border border-border rounded-lg text-sm text-ink bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none w-56 transition-all"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 bg-danger/10 border border-danger/20 text-danger px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-danger/60 hover:text-danger ml-2">&times;</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted text-sm font-medium">No users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-left">
                <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider">User</th>
                <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-semibold text-muted text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} alt="" className="w-8 h-8 rounded-full ring-1 ring-border" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet flex items-center justify-center text-white text-xs font-bold">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{u.name}</p>
                        <p className="text-xs text-muted truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role] || 'bg-muted/10 text-muted'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleEnabled(u)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                        u.enabled ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-danger/10 text-danger hover:bg-danger/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.enabled ? 'bg-success' : 'bg-danger'}`} />
                      {u.enabled ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="px-3 py-1.5 text-xs font-semibold text-danger bg-danger/10 rounded-lg hover:bg-danger/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-ink mb-5">
              {modalMode === 'create' ? 'Add New User' : 'Edit User'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={modalMode === 'edit'}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="user@example.com"
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Min. 6 characters"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="USER">User</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {formError && (
              <div className="mt-4 bg-danger/10 border border-danger/20 text-danger px-3 py-2 rounded-lg text-xs font-medium">
                {formError}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted bg-surface border border-border rounded-xl hover:bg-mist transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-royal transition-all disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <h3 className="text-lg font-bold text-ink mb-2">Delete User</h3>
            <p className="text-muted text-sm mb-6">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-ink">{deleteTarget.name}</span>{' '}
              (<span className="text-muted">{deleteTarget.email}</span>)?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted bg-surface border border-border rounded-xl hover:bg-mist transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
