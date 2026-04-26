import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { getFacilityById, deleteFacility } from '../api/facilityApi';

/**
 * Facility detail page — shows full metadata for a single facility.
 * Users see a "Book Now" button; Admins see Edit/Delete actions.
 */

const FACILITY_TYPE_LABELS = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  AUDITORIUM: 'Auditorium',
  EQUIPMENT: 'Equipment',
};

const ASSET_TYPE_LABELS = {
  PROJECTOR: 'Projector',
  CAMERA: 'Camera',
  MICROPHONE: 'Microphone',
  WHITEBOARD: 'Whiteboard',
  LAPTOP: 'Laptop',
  PRINTER: 'Printer',
  OTHER: 'Other',
};

export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await getFacilityById(id);
        setFacility(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load facility.');
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [id]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteFacility(id);
      navigate('/facilities', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete facility.');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !facility) {
    return (
      <DashboardLayout>
        <div className="bg-danger/10 border border-danger/20 text-danger px-6 py-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6 animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => navigate('/facilities')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Facilities
        </button>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {/* Gradient header */}
          <div className="h-3 bg-gradient-to-r from-primary to-royal" />

          <div className="p-8">
            {/* Top section */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      facility.status === 'ACTIVE'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        facility.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'
                      }`}
                    />
                    {facility.status === 'ACTIVE' ? 'Active' : 'Out of Service'}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {FACILITY_TYPE_LABELS[facility.facilityType] || facility.facilityType}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-ink">{facility.name}</h1>
              </div>

              <div className="flex gap-2">
                {facility.status === 'ACTIVE' && (
                  <button
                    id="book-facility-btn"
                    onClick={() =>
                      navigate(`/bookings/new?facilityId=${facility.id}`)
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Now
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => navigate(`/facilities/${id}/edit`)}
                      className="px-4 py-2.5 text-sm font-semibold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2.5 text-sm font-semibold text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {facility.description && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                  Description
                </h2>
                <p className="text-ink text-sm leading-relaxed">
                  {facility.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailItem
                label="Location"
                value={facility.location}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />

              {facility.capacity && (
                <DetailItem
                  label="Capacity"
                  value={`${facility.capacity} people`}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
              )}

              {facility.assetType && (
                <DetailItem
                  label="Asset Type"
                  value={ASSET_TYPE_LABELS[facility.assetType] || facility.assetType}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  }
                />
              )}

              {facility.availableFrom && facility.availableTo && (
                <DetailItem
                  label="Availability Window"
                  value={`${facility.availableFrom} – ${facility.availableTo}`}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-ink mb-2">Delete Facility</h3>
              <p className="text-muted text-sm mb-6">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-ink">{facility.name}</span>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
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

function DetailItem({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-surface rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-ink mt-0.5">{value}</p>
      </div>
    </div>
  );
}
