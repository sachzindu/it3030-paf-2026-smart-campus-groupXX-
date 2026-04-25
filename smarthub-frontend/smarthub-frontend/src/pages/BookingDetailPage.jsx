import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { getBookingById, cancelBooking, reviewBooking } from '../api/bookingApi';

/**
 * Booking detail page — shows full booking info.
 * Users see cancel button; Admins see review actions for PENDING bookings.
 */

const STATUS_COLORS = {
  PENDING: 'bg-warning/10 text-warning border-warning/20',
  APPROVED: 'bg-success/10 text-success border-success/20',
  REJECTED: 'bg-danger/10 text-danger border-danger/20',
  CANCELLED: 'bg-muted/10 text-muted border-muted/20',
};

const STATUS_DOT = {
  PENDING: 'bg-warning',
  APPROVED: 'bg-success',
  REJECTED: 'bg-danger',
  CANCELLED: 'bg-muted',
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Review form
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [reviewError, setReviewError] = useState('');

  const fetchBooking = async () => {
    try {
      const response = await getBookingById(id);
      setBooking(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await cancelBooking(id);
      fetchBooking();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async () => {
    if (reviewAction === 'REJECTED' && !adminRemarks.trim()) {
      setReviewError('Remarks are required when rejecting.');
      return;
    }
    setActionLoading(true);
    setReviewError('');
    try {
      await reviewBooking(id, {
        status: reviewAction,
        adminRemarks: adminRemarks.trim() || null,
      });
      setShowReviewModal(false);
      fetchBooking();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to review booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const isOwner = booking?.userEmail === user?.email;
  const canCancel =
    isOwner &&
    (booking?.status === 'PENDING' || booking?.status === 'APPROVED');
  const canReview = isAdmin && booking?.status === 'PENDING';

 if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !booking) {
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
      <div className="max-w-3xl space-y-6 animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {error && (
          <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-primary to-royal" />

          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      STATUS_COLORS[booking.status]
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[booking.status]}`} />
                    {booking.status}
                  </span>
                  <span className="text-xs text-muted">
                    Booking #{booking.id}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-ink">
                  {booking.facilityName}
                </h1>
                <p className="text-muted text-sm mt-1">
                  {booking.facilityLocation} • {booking.facilityType?.replace('_', ' ')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {canReview && (
                  <>
                    <button
                      onClick={() => {
                        setReviewAction('APPROVED');
                        setAdminRemarks('');
                        setReviewError('');
                        setShowReviewModal(true);
                      }}
                      className="px-4 py-2.5 text-sm font-semibold text-success bg-success/10 rounded-xl hover:bg-success/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setReviewAction('REJECTED');
                        setAdminRemarks('');
                        setReviewError('');
                        setShowReviewModal(true);
                      }}
                      className="px-4 py-2.5 text-sm font-semibold text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="px-4 py-2.5 text-sm font-semibold text-danger bg-danger/10 rounded-xl hover:bg-danger/20 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <InfoCard
                icon={<CalendarIcon />}
                label="Date"
                value={booking.bookingDate}
              />
              <InfoCard
                icon={<ClockIcon />}
                label="Time"
                value={`${booking.startTime?.substring(0, 5)} – ${booking.endTime?.substring(0, 5)}`}
              />
              <InfoCard
                icon={<UserIcon />}
                label="Requested By"
                value={`${booking.userName} (${booking.userEmail})`}
              />
              {booking.expectedAttendees && (
                <InfoCard
                  icon={<UsersIcon />}
                  label="Expected Attendees"
                  value={booking.expectedAttendees}
                />
              )}
            </div>

            {/* Purpose */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Purpose
              </h2>
              <div className="bg-surface rounded-xl p-4">
                <p className="text-sm text-ink leading-relaxed">
                  {booking.purpose}
                </p>
              </div>
            </div>

            {/* Review Info */}
            {booking.reviewedByName && (
              <div className="border-t border-border/50 pt-6">
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                  Review Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard
                    icon={<ShieldIcon />}
                    label="Reviewed By"
                    value={booking.reviewedByName}
                  />
                  {booking.reviewedAt && (
                    <InfoCard
                      icon={<ClockIcon />}
                      label="Reviewed At"
                      value={new Date(booking.reviewedAt).toLocaleString()}
                    />
                  )}
                </div>
                {booking.adminRemarks && (
                  <div className="mt-4 bg-surface rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted uppercase mb-1">
                      Admin Remarks
                    </p>
                    <p className="text-sm text-ink italic">
                      {booking.adminRemarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-ink mb-4">
                {reviewAction === 'APPROVED' ? 'Approve' : 'Reject'} Booking
              </h3>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Remarks
                  {reviewAction === 'REJECTED' && (
                    <span className="text-danger"> *</span>
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
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted bg-surface border border-border rounded-xl hover:bg-mist transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50 ${
                    reviewAction === 'APPROVED'
                      ? 'bg-success hover:bg-emerald-600'
                      : 'bg-danger hover:bg-red-600'
                  }`}
                >
                  {actionLoading
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

/* ===== Reusable Components ===== */
function InfoCard({ icon, label, value }) {
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

/* ===== Icons ===== */
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
