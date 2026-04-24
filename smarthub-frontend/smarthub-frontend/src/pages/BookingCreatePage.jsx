import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { createBooking } from '../api/bookingApi';
import { getAllFacilities } from '../api/facilityApi';

/**
 * Booking creation page.
 * Supports pre-selection of a facility via ?facilityId= query param.
 */
export default function BookingCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFacilityId = searchParams.get('facilityId');

  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);

  const [form, setForm] = useState({
    facilityId: preselectedFacilityId || '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Load facilities for the dropdown
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await getAllFacilities();
        const activeFacilities = (response.data.data || []).filter(
          (f) => f.status === 'ACTIVE'
        );
        setFacilities(activeFacilities);
      } catch {
        setError('Failed to load facilities list.');
      } finally {
        setLoadingFacilities(false);
      }
    };
    fetchFacilities();
  }, []);

  const selectedFacility = facilities.find(
    (f) => String(f.id) === String(form.facilityId)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.facilityId) errors.facilityId = 'Please select a facility';
    if (!form.bookingDate) errors.bookingDate = 'Date is required';
    if (!form.startTime) errors.startTime = 'Start time is required';
    if (!form.endTime) errors.endTime = 'End time is required';
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      errors.endTime = 'End time must be after start time';
    }
    if (!form.purpose.trim()) errors.purpose = 'Purpose is required';
    if (form.expectedAttendees && parseInt(form.expectedAttendees, 10) < 1) {
      errors.expectedAttendees = 'Must be at least 1';
    }
    if (
      selectedFacility?.capacity &&
      form.expectedAttendees &&
      parseInt(form.expectedAttendees, 10) > selectedFacility.capacity
    ) {
      errors.expectedAttendees = `Exceeds facility capacity (${selectedFacility.capacity})`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        facilityId: parseInt(form.facilityId, 10),
        bookingDate: form.bookingDate,
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
        purpose: form.purpose.trim(),
        expectedAttendees: form.expectedAttendees
          ? parseInt(form.expectedAttendees, 10)
          : null,
      };
      await createBooking(payload);
      navigate('/bookings/my', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.data && typeof data.data === 'object') {
        setFieldErrors(data.data);
      } else {
        setError(data?.message || 'Failed to create booking.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
   