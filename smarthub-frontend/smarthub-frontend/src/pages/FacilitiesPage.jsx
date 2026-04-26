import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { getAllFacilities, searchFacilities, deleteFacility } from '../api/facilityApi';

/**
 * Facilities & Assets Catalogue page.
 * All authenticated users can browse and search.
 * Admins can create, edit, and delete facilities.
 */

const FACILITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'AUDITORIUM', label: 'Auditorium' },
  { value: 'EQUIPMENT', label: 'Equipment' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

export default function FacilitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search/filter state
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [minCapacity, setMinCapacity] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const hasFilters = keyword || typeFilter || statusFilter || minCapacity;
      let response;
      if (hasFilters) {
        const params = {};
        if (keyword) params.keyword = keyword;
        if (typeFilter) params.type = typeFilter;
        if (statusFilter) params.status = statusFilter;
        if (minCapacity) params.minCapacity = parseInt(minCapacity, 10);
        response = await searchFacilities(params);
      } else {
        response = await getAllFacilities();
      }
      setFacilities(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load facilities.');
    } finally {
      setLoading(false);
    }
  }, [keyword, typeFilter, statusFilter, minCapacity]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteFacility(deleteTarget.id);
      setDeleteTarget(null);
      fetchFacilities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete facility.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const found = FACILITY_TYPES.find((t) => t.value === type);
    return found ? found.label : type;
  };

  const getTypeColor = (type) => {
    const colors = {
      LECTURE_HALL: 'bg-primary/10 text-primary',
      LAB: 'bg-violet/10 text-violet',
      MEETING_ROOM: 'bg-success/10 text-success',
      AUDITORIUM: 'bg-indigo/10 text-indigo',
      EQUIPMENT: 'bg-warning/10 text-warning',
    };
    return colors[type] || 'bg-muted/10 text-muted';
  };

  const getStatusColor = (status) =>
    status === 'ACTIVE'
      ? 'bg-success/10 text-success'
      : 'bg-danger/10 text-danger';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              Facilities & Assets
            </h1>
            <p className="text-muted mt-1">
              Browse and search bookable campus resources.
            </p>
          </div>
          {isAdmin && (
            <button
              id="add-facility-btn"
              onClick={() => navigate('/facilities/new')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4" />
              Add Facility
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-border/50 p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Search
              </label>
              <input
                id="facility-search-input"
                type="text"
                placeholder="Name or location..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Type
              </label>
              <select
                id="facility-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <select
                id="facility-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                Min Capacity
              </label>
              <input
                id="facility-capacity-filter"
                type="number"
                min="1"
                placeholder="Any"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && facilities.length === 0 && (
          <div className="bg-white rounded-2xl border border-border/50 p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-mist flex items-center justify-center mx-auto mb-4">
              <FacilityIcon className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-muted text-sm font-medium">
              No facilities found.
            </p>
            <p className="text-muted/60 text-xs mt-1">
              {keyword || typeFilter || statusFilter || minCapacity
                ? 'Try adjusting your filters.'
                : 'Add a facility to get started.'}
            </p>
          </div>
        )}

        {/* Facility Cards Grid */}
        {!loading && facilities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((facility, idx) => (
              <div
                key={facility.id}
                className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group animate-fade-in cursor-pointer"
                style={{ animationDelay: `${idx * 60}ms` }}
                onClick={() => navigate(`/facilities/${facility.id}`)}
              >
                {/* Card Header with gradient */}
                <div className="h-2 bg-gradient-to-r from-primary to-royal" />

                <div className="p-5">
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(facility.facilityType)}`}
                    >
                      {getTypeLabel(facility.facilityType)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(facility.status)}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${facility.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}
                      />
                      {facility.status === 'ACTIVE' ? 'Active' : 'Out of Service'}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-bold text-ink mb-1 group-hover:text-primary transition-colors">
                    {facility.name}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-muted text-sm mb-3">
                    <LocationIcon className="w-4 h-4" />
                    <span>{facility.location}</span>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted">
                    {facility.capacity && (
                      <div className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5" />
                        <span>{facility.capacity} capacity</span>
                      </div>
                    )}
                    {facility.availableFrom && facility.availableTo && (
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>
                          {facility.availableFrom} – {facility.availableTo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/facilities/${facility.id}/edit`);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(facility);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold text-danger bg-danger/10 rounded-lg hover:bg-danger/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-ink mb-2">
                Delete Facility
              </h3>
              <p className="text-muted text-sm mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-ink">
                  {deleteTarget.name}
                </span>
                ? This action cannot be undone.
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
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ===== Icons ===== */
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
function LocationIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
