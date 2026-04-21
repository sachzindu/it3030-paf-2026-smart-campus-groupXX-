import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import { getFacilityById, deleteFacility } from '../../api/facilityApi';
import AvailabilityChecker from './AvailabilityChecker';

/**
 * FacilityDetail Component
 * Shows detailed information about a single facility with availability checking
 */
export default function FacilityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAvailabilityChecker, setShowAvailabilityChecker] = useState(false);

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        setLoading(true);
        const response = await getFacilityById(id);
        setFacility(response.data.data || response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching facility:', err);
        setError(err.response?.data?.message || 'Failed to load facility details');
        setFacility(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this facility?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteFacility(id);
      navigate('/facilities', { replace: true });
    } catch (err) {
      console.error('Error deleting facility:', err);
      setError(err.response?.data?.message || 'Failed to delete facility');
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success/10 text-success';
      case 'MAINTENANCE':
        return 'bg-warning/10 text-warning';
      case 'OUT_OF_SERVICE':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-muted/10 text-muted';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'LECTURE_HALL':
        return 'bg-primary/10 text-primary';
      case 'LAB':
        return 'bg-violet/10 text-violet';
      case 'MEETING_ROOM':
        return 'bg-success/10 text-success';
      case 'EQUIPMENT':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted/10 text-muted';
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-danger/10 border border-danger/20 text-danger px-6 py-4 rounded-xl text-sm font-medium">
          {error}
          <button
            onClick={() => navigate('/facilities')}
            className="ml-4 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 transition"
          >
            Back to Facilities
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (!facility) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-border/50 p-12 shadow-sm text-center">
          <p className="text-muted text-sm font-medium">Facility not found</p>
          <button
            onClick={() => navigate('/facilities')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            Back to Facilities
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
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

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {/* Image Section */}
          {facility.imageUrl && (
            <div className="h-96 overflow-hidden bg-mist">
              <img
                src={facility.imageUrl}
                alt={facility.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {!facility.imageUrl && (
            <div className="h-96 bg-gradient-to-br from-primary/50 to-royal/50 flex items-center justify-center">
              <svg className="w-32 h-32 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          )}

          {/* Content Section */}
          <div className="p-8">
            {/* Title and Badges */}
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-ink mb-4">{facility.name}</h1>
              <div className="flex gap-3 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getTypeColor(facility.type)}`}>
                  {facility.type?.replace(/_/g, ' ')}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(facility.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${facility.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`} />
                  {facility.status === 'ACTIVE' ? 'Active' : facility.status}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted text-lg mb-8">{facility.description}</p>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-b border-border py-8">
              <div>
                <h2 className="text-lg font-bold text-ink mb-4">Facility Details</h2>
                <div className="space-y-4">
                  {facility.capacity && (
                    <div>
                      <p className="text-muted text-sm">Capacity</p>
                      <p className="text-2xl font-bold text-ink">{facility.capacity} persons</p>
                    </div>
                  )}
                  {facility.location && (
                    <div>
                      <p className="text-muted text-sm">Location</p>
                      <p className="text-lg font-semibold text-ink">{facility.location}</p>
                    </div>
                  )}
                  {facility.type && (
                    <div>
                      <p className="text-muted text-sm">Type</p>
                      <p className="text-lg font-semibold text-ink">{facility.type}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-lg font-bold text-ink mb-4">Amenities</h2>
                {facility.amenities && facility.amenities.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3">
                    {facility.amenities.map((amenity, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="text-success">✓</span>
                        <span className="text-ink">{amenity}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted text-sm">No amenities listed</p>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-muted mb-8">
              {facility.createdAt && <p>Created: {new Date(facility.createdAt).toLocaleDateString()}</p>}
              {facility.updatedAt && <p>Updated: {new Date(facility.updatedAt).toLocaleDateString()}</p>}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowAvailabilityChecker(true)}
                className="flex-1 min-w-[200px] px-6 py-3 bg-gradient-to-r from-success to-success text-white rounded-xl hover:shadow-lg hover:shadow-success/25 transition font-medium"
              >
                Check Availability
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => navigate(`/facilities/${facility.id}/edit`)}
                    className="flex-1 min-w-[200px] px-6 py-3 bg-primary/10 text-primary hover:bg-primary/20 transition font-medium rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 min-w-[200px] px-6 py-3 bg-danger/10 text-danger hover:bg-danger/20 transition font-medium rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={() => navigate('/facilities')}
                className="flex-1 min-w-[200px] px-6 py-3 bg-surface text-ink hover:bg-border transition font-medium rounded-xl"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Availability Checker Modal */}
        {showAvailabilityChecker && (
          <AvailabilityChecker
            facilityId={facility.id}
            onClose={() => setShowAvailabilityChecker(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
