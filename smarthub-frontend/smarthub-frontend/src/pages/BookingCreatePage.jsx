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
 <DashboardLayout>
      <div className="max-w-2xl animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-royal" />

          <div className="p-8">
            <h1 className="text-xl font-bold text-ink mb-6">
              Book a Resource
            </h1>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Facility Selector */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                  Facility <span className="text-danger">*</span>
                </label>
                {loadingFacilities ? (
                  <div className="h-10 bg-surface rounded-xl animate-pulse" />
                ) : (
                  <select
                    id="field-facilityId"
                    name="facilityId"
                    value={form.facilityId}
                    onChange={handleChange}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      fieldErrors.facilityId ? 'border-danger' : 'border-border'
                    }`}
                  >
                    <option value="">Select a facility...</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.location}
                        {f.capacity ? ` (cap: ${f.capacity})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.facilityId && (
                  <p className="mt-1 text-xs text-danger font-medium">
                    {fieldErrors.facilityId}
                  </p>
                )}
              </div>

              {/* Selected Facility Info */}
              {selectedFacility && (
                <div className="bg-mist/50 border border-primary/10 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {selectedFacility.name}
                      </p>
                      <p className="text-xs text-muted">
                        {selectedFacility.location}
                        {selectedFacility.capacity &&
                          ` • Capacity: ${selectedFacility.capacity}`}
                        {selectedFacility.availableFrom &&
                          selectedFacility.availableTo &&
                          ` • ${selectedFacility.availableFrom}–${selectedFacility.availableTo}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  id="field-bookingDate"
                  name="bookingDate"
                  type="date"
                  value={form.bookingDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                    fieldErrors.bookingDate ? 'border-danger' : 'border-border'
                  }`}
                />
                {fieldErrors.bookingDate && (
                  <p className="mt-1 text-xs text-danger font-medium">
                    {fieldErrors.bookingDate}
                  </p>
                )}
              </div>

             