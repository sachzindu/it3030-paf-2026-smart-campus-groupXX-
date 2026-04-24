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

 