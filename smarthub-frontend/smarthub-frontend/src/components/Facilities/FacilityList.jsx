import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../DashboardLayout';
import { getAllFacilities, searchFacilities } from '../../api/facilityApi';
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
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: 'ACTIVE',
    search: '',
  });

  // Fetch facilities with current filters and pagination
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAllFacilities(currentPage, pageSize, filters.type, filters.status);
      
      setFacilities(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
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
  }, [currentPage, pageSize, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(0); // Reset to first page when filters change
  };

  // Handle search
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      handleFilterChange(filters);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await searchFacilities({
        name: searchTerm,
      });

      setFacilities(response.data || []);
      setTotalPages(1);
      setCurrentPage(0);
    } catch (err) {
      console.error('Error searching facilities:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to facility detail
  const handleViewDetails = (facilityId) => {
    navigate(`/facilities/${facilityId}`);
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
              {filters.search || filters.type || filters.status !== 'ACTIVE'
                ? 'Try adjusting your filters.'
                : 'No facilities available at the moment.'}
            </p>
          </div>
        )}

        {/* Facilities Grid */}
        {!loading && facilities.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {facilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  onViewDetails={() => handleViewDetails(facility.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center py-4 border-t border-border">
                <div className="text-sm text-muted">
                  Page {currentPage + 1} of {totalPages} • Showing {facilities.length} facilities
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-border rounded-lg text-ink hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-4 py-2 border border-border rounded-lg text-ink hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
