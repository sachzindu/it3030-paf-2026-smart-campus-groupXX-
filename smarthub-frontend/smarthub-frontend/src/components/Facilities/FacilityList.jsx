import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import {
  getAllFacilities,
  searchFacilities,
  deleteFacility,
  getResponseData,
} from '../../api/facilityApi';
import FacilityCard from './FacilityCard';
import FacilityFilter from './FacilityFilter';

/**
 * FacilityList Component
 * Displays a paginated list of facilities with filtering and search capabilities.
 * All authenticated users can browse and search.
 * Admins can create and delete facilities.
 */
export default function FacilityList() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    minHealth: '',
    sortBy: 'health-desc',
  });

  const applyHealthPresentation = (facilitiesList, activeFilters) => {
    const minHealth = activeFilters.minHealth ? Number(activeFilters.minHealth) : null;

    let nextFacilities = Array.isArray(facilitiesList) ? [...facilitiesList] : [];

    if (minHealth !== null && !Number.isNaN(minHealth)) {
      nextFacilities = nextFacilities.filter(
        (facility) => (facility.healthScore ?? 0) >= minHealth
      );
    }

    switch (activeFilters.sortBy) {
      case 'health-asc':
        nextFacilities.sort((left, right) => (left.healthScore ?? 0) - (right.healthScore ?? 0));
        break;
      case 'name-asc':
        nextFacilities.sort((left, right) => left.name.localeCompare(right.name));
        break;
      case 'name-desc':
        nextFacilities.sort((left, right) => right.name.localeCompare(left.name));
        break;
      case 'health-desc':
      default:
        nextFacilities.sort((left, right) => (right.healthScore ?? 0) - (left.healthScore ?? 0));
        break;
    }

    return nextFacilities;
  };

  // Fetch facilities with current backend-supported filters, then apply local health filtering/sorting
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = filters.search.trim()
        ? await searchFacilities({
            keyword: filters.search,
            type: filters.type || undefined,
            status: filters.status || undefined,
          })
        : await getAllFacilities(filters.type, filters.status);

      const facilitiesList = getResponseData(response) || [];
      setFacilities(applyHealthPresentation(facilitiesList, filters));
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setError(err.response?.data?.message || 'Failed to load facilities');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch facilities when filters or pagination changes
  useEffect(() => {
    fetchFacilities();
  }, [filters.type, filters.status, filters.search, filters.minHealth, filters.sortBy]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle search
  const handleSearch = (searchTerm) => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm,
    }));
  };

  // Navigate to facility detail
  const handleViewDetails = (facilityId) => {
    navigate(`/facilities/${facilityId}`);
  };

  // Navigate to edit facility (admin only)
  const handleEditFacility = (facilityId) => {
    navigate(`/facilities/${facilityId}/edit`);
  };

  // Delete facility (admin only)
  const handleDeleteFacility = async (facilityId) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteFacility(facilityId);
      // Refresh the list
      fetchFacilities();
    } catch (err) {
      console.error('Error deleting facility:', err);
      setError(err.response?.data?.message || 'Failed to delete facility');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to create new facility (admin only)
  const handleCreateFacility = () => {
    navigate('/facilities/new');
  };

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
              onClick={handleCreateFacility}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
            >
              + Add Facility
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <FacilityFilter 
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
        />

        {/* Error Message */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && facilities.length === 0 && (
          <div className="bg-white rounded-2xl border border-border/50 p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-mist flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m5 0h5M9 7h.01M9 11h.01M9 15h.01" />
              </svg>
            </div>
            <p className="text-muted text-sm font-medium">
              No facilities found.
            </p>
            <p className="text-muted/60 text-xs mt-1">
              {filters.search || filters.type || filters.status
                ? 'Try adjusting your filters.'
                : 'No facilities available at the moment.'}
            </p>
          </div>
        )}

        {/* Facilities Grid */}
        {!loading && facilities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                onViewDetails={() => handleViewDetails(facility.id)}
                onEdit={() => handleEditFacility(facility.id)}
                onDelete={() => handleDeleteFacility(facility.id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
