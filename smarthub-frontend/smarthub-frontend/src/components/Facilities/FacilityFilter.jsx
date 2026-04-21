import { useState } from 'react';

/**
 * FacilityFilter Component
 * Allows users to filter facilities by type, status, and search
 */
export default function FacilityFilter({ filters, onFilterChange, onSearch }) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleFilterTypeChange = (e) => {
    onFilterChange({
      ...filters,
      type: e.target.value,
    });
  };

  const handleFilterStatusChange = (e) => {
    onFilterChange({
      ...filters,
      status: e.target.value,
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFilterChange({
      type: '',
      status: '',
      search: '',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Bar */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
            Search
          </label>
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Name or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </form>
        </div>

        {/* Facility Type Filter */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
            Type
          </label>
          <select
            value={filters.type}
            onChange={handleFilterTypeChange}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            <option value="">All Types</option>
            <option value="LECTURE_HALL">Lecture Hall</option>
            <option value="LAB">Lab</option>
            <option value="MEETING_ROOM">Meeting Room</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
            Status
          </label>
          <select
            value={filters.status}
            onChange={handleFilterStatusChange}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>
        </div>

        {/* Clear Filters - if any active */}
        {(searchInput || filters.type || filters.status) && (
          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-3.5 py-2.5 bg-muted/10 text-muted hover:bg-muted/20 text-sm font-medium rounded-xl transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
