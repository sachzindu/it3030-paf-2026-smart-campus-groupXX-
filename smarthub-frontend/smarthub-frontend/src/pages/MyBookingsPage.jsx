import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getMyBookings, cancelBooking } from '../api/bookingApi';

/**
 * User's booking list page with status filtering and cancel functionality.
 */

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_COLORS = {
  PENDING: 'bg-warning/10 text-warning',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-danger/10 text-danger',
  CANCELLED: 'bg-muted/10 text-muted',
};

const STATUS_DOT_COLORS = {
  PENDING: 'bg-warning',
  APPROVED: 'bg-success',
  REJECTED: 'bg-danger',
  CANCELLED: 'bg-muted',
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyBookings();
      setBookings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await cancelBooking(cancelTarget.id);
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  const filtered = statusFilter
    ? bookings.filter((b) => b.status === statusFilter)
    : bookings;

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              My Bookings
            </h1>
            <p className="text-muted mt-1">
              View and manage your resource booking requests.
            </p>
          </div>
          <button
            id="new-booking-btn"
            onClick={() => navigate('/bookings/new')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-royal text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.value
              ? statusCounts[tab.value] || 0
              : bookings.length;
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-muted border border-border hover:border-primary/30 hover:text-ink'
                }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20'
                      : 'bg-surface'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
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
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-border/50 p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-mist flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-muted text-sm font-medium">
              {statusFilter ? 'No bookings with this status.' : 'No bookings yet.'}
            </p>
            <p className="text-muted/60 text-xs mt-1">
              Book a facility to get started.
            </p>
          </div>
        )}

        {/* Booking Cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((booking, idx) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 p-5 animate-fade-in cursor-pointer"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate(`/bookings/${booking.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Facility + Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-ink truncate">
                        {booking.facilityName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                          STATUS_COLORS[booking.status] || 'bg-muted/10 text-muted'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            STATUS_DOT_COLORS[booking.status] || 'bg-muted'
                          }`}
                        />
                        {booking.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {booking.bookingDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {booking.startTime?.substring(0, 5)} – {booking.endTime?.substring(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {booking.facilityLocation}
                      </span>
                    </div>

                    {/* Purpose */}
                    <p className="text-sm text-muted/80 mt-2 truncate">
                      {booking.purpose}
                    </p>

                    {/* Admin Remarks */}
                    {booking.adminRemarks && (
                      <p className="text-xs mt-2 px-3 py-1.5 rounded-lg bg-surface text-muted italic">
                        Admin: {booking.adminRemarks}
                      </p>
                    )}
                  </div>

                  {/* Cancel Button */}
                  {(booking.status === 'PENDING' ||
                    booking.status === 'APPROVED') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelTarget(booking);
                      }}
                      className="ml-4 px-4 py-2 text-xs font-semibold text-danger bg-danger/10 rounded-lg hover:bg-danger/20 transition-colors flex-shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {cancelTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-ink mb-2">
                Cancel Booking
              </h3>
              <p className="text-muted text-sm mb-6">
                Are you sure you want to cancel your booking for{' '}
                <span className="font-semibold text-ink">
                  {cancelTarget.facilityName}
                </span>{' '}
                on{' '}
                <span className="font-semibold text-ink">
                  {cancelTarget.bookingDate}
                </span>
                ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelTarget(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted bg-surface border border-border rounded-xl hover:bg-mist transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
