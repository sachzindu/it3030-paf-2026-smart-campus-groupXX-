import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getAllBookings, reviewBooking } from '../api/bookingApi';
import { getAllFacilities } from '../api/facilityApi';

/**
 * Admin booking management page.
 * View all bookings with filters and approve/reject pending bookings.
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

export default function AdminBookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');

  // Review modal
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewAction, setReviewAction] = useState(''); // APPROVED or REJECTED
  const [adminRemarks, setAdminRemarks] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (facilityFilter) params.facilityId = facilityFilter;
      const response = await getAllBookings(params);
      setBookings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, facilityFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await getAllFacilities();
        setFacilities(response.data.data || []);
      } catch {
        // Non-critical — facility filter just won't work
      }
    };
    fetchFacilities();
  }, []);

  const openReviewModal = (booking, action) => {
    setReviewTarget(booking);
    setReviewAction(action);
    setAdminRemarks('');
    setReviewError('');
  };

  const handleReview = async () => {
    if (reviewAction === 'REJECTED' && !adminRemarks.trim()) {
      setReviewError('Remarks are required when rejecting a booking.');
      return;
    }
    setReviewLoading(true);
    setReviewError('');
    try {
      await reviewBooking(reviewTarget.id, {
        status: reviewAction,
        adminRemarks: adminRemarks.trim() || null,
      });
      setReviewTarget(null);
      fetchBookings();
    } catch (err) {
      setReviewError(
        err.response?.data?.message || 'Failed to review booking.'
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Booking Management
          </h1>
          <p className="text-muted mt-1">
            Review, approve, or reject booking requests.
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
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
                      isActive ? 'bg-white/20' : 'bg-surface'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Facility Filter */}
          <div className="w-64">
            <select
              id="booking-facility-filter"
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            >
              <option value="">All Facilities</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
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
        {!loading && bookings.length === 0 && (
          <div className="bg-white rounded-2xl border border-border/50 p-12 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-mist flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-muted text-sm font-medium">No bookings found.</p>
          </div>
        )}

        {/* Bookings Table */}
        {!loading && bookings.length > 0 && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-left">
                    <th className="px-5 py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">
                      Facility
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-surface/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">
                          {booking.facilityName}
                        </p>
                        <p className="text-xs text-muted">
                          {booking.facilityLocation}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">
                          {booking.userName}
                        </p>
                        <p className="text-xs text-muted">
                          {booking.userEmail}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">
                          {booking.bookingDate}
                        </p>
                        <p className="text-xs text-muted">
                          {booking.startTime?.substring(0, 5)} –{' '}
                          {booking.endTime?.substring(0, 5)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                      </td>
                      <td className="px-5 py-4">
                        {booking.status === 'PENDING' && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openReviewModal(booking, 'APPROVED')}
                              className="px-3 py-1.5 text-xs font-semibold text-success bg-success/10 rounded-lg hover:bg-success/20 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openReviewModal(booking, 'REJECTED')}
                              className="px-3 py-1.5 text-xs font-semibold text-danger bg-danger/10 rounded-lg hover:bg-danger/20 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {reviewTarget && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-ink mb-1">
                {reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Booking
              </h3>
              <p className="text-muted text-sm mb-5">
                <span className="font-semibold text-ink">
                  {reviewTarget.facilityName}
                </span>{' '}
                — {reviewTarget.bookingDate},{' '}
                {reviewTarget.startTime?.substring(0, 5)} –{' '}
                {reviewTarget.endTime?.substring(0, 5)}
                <br />
                Requested by{' '}
                <span className="font-medium">{reviewTarget.userName}</span>
              </p>

              {/* Purpose */}
              <div className="bg-surface rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-muted uppercase mb-1">
                  Purpose
                </p>
                <p className="text-sm text-ink">{reviewTarget.purpose}</p>
              </div>

              {/* Remarks */}
              <div className="mb-5">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Remarks{' '}
                  {reviewAction === 'REJECTED' && (
                    <span className="text-danger">*</span>
                  )}
                </label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  rows={3}
                  placeholder={
                    reviewAction === 'REJECTED'
                      ? 'Reason for rejection (required)...'
                      : 'Optional remarks...'
                  }
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              {reviewError && (
                <div className="bg-danger/10 border border-danger/20 text-danger px-3 py-2 rounded-lg text-xs font-medium mb-4">
                  {reviewError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setReviewTarget(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted bg-surface border border-border rounded-xl hover:bg-mist transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={reviewLoading}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 ${
                    reviewAction === 'APPROVED'
                      ? 'bg-success hover:bg-emerald-600'
                      : 'bg-danger hover:bg-red-600'
                  }`}
                >
                  {reviewLoading
                    ? 'Processing...'
                    : reviewAction === 'APPROVED'
                    ? 'Approve'
                    : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
