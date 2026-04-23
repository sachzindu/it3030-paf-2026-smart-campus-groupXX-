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

 