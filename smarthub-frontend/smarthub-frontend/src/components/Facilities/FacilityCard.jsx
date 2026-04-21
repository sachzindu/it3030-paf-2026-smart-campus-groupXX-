import { useAuth } from '../../context/AuthContext';

/**
 * FacilityCard Component
 * Displays a single facility as a card with key information
 */
export default function FacilityCard({ facility, onViewDetails, onEdit, onDelete }) {
  const { user } = useAuth();
  // Determine status color
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

  // Determine type badge color
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

  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col h-full group cursor-pointer">
      {/* Image/Gradient Header */}
      <div className="h-2 bg-gradient-to-r from-primary to-royal" />
      {facility.imageUrl && (
        <div className="h-40 overflow-hidden bg-mist">
          <img
            src={facility.imageUrl}
            alt={facility.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      {!facility.imageUrl && (
        <div className="h-40 bg-gradient-to-br from-primary/50 to-royal/50 flex items-center justify-center">
          <svg
            className="w-20 h-20 text-primary/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(facility.type)}`}>
            {facility.type?.replace(/_/g, ' ')}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(facility.status)}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${facility.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`} />
            {facility.status === 'ACTIVE' ? 'Active' : facility.status}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-ink mb-1 group-hover:text-primary transition-colors line-clamp-2">
          {facility.name}
        </h3>

        {/* Location */}
        {facility.location && (
          <div className="flex items-center gap-1.5 text-muted text-sm mb-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L9.9 13.95a7 7 0 01-9.9-9.9zM9 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{facility.location}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-muted text-sm mb-4 line-clamp-2">
          {facility.description}
        </p>

        {/* Details */}
        <div className="flex items-center gap-4 text-xs text-muted mb-4 flex-grow">
          {facility.capacity && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>{facility.capacity} capacity</span>
            </div>
          )}
          {facility.amenities && facility.amenities.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011-1h8a1 1 0 011 1v14a1 1 0 11-2 0V4H7v12a1 1 0 11-2 0V2z" clipRule="evenodd" />
              </svg>
              <span>{facility.amenities.length} amenities</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={onViewDetails}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-primary to-royal text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200 font-medium text-sm"
        >
          View Details
        </button>

        {/* Admin Actions */}
        {user?.role === 'ADMIN' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={onEdit}
              className="flex-1 py-2 px-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 py-2 px-3 bg-danger/10 text-danger rounded-lg hover:bg-danger/20 transition-colors font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
