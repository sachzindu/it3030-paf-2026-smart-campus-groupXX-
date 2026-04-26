import { useState } from 'react';

/**
 * FacilityFilter Component
 * Allows users to filter facilities by type, status, and search
 */
export default function FacilityFilter({ filters, onFilterChange, onSearch }) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const syncSearchAndNotify = (nextSearch) => {
    setSearchInput(nextSearch);
    onSearch(nextSearch);
  };

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

  const handleMinHealthChange = (e) => {
    onFilterChange({
      ...filters,
      minHealth: e.target.value,
    });
  };

  const handleSortChange = (e) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value,
    });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onSearch('');
    onFilterChange({
      type: '',
      status: '',
      search: '',
      minHealth: '',
      sortBy: 'health-desc',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-border/50 p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              onChange={(e) => syncSearchAndNotify(e.target.value)}
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
            <option value="AUDITORIUM">Auditorium</option>
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

        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
            Min Health
          </label>
          <select
            value={filters.minHealth}
            onChange={handleMinHealthChange}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            <option value="">Any Score</option>
            <option value="80">80+ Strong</option>
            <option value="60">60+ Moderate</option>
            <option value="40">40+ Low</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={handleSortChange}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            <option value="health-desc">Health Score: High to Low</option>
            <option value="health-asc">Health Score: Low to High</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
        </div>

        {/* Clear Filters - if any active */}
        {(searchInput || filters.type || filters.status || filters.minHealth || filters.sortBy !== 'health-desc') && (
          <div className="flex items-end lg:col-span-5">
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
