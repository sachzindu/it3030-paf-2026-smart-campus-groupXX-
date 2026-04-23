import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getFacilityById, createFacility, updateFacility } from '../api/facilityApi';

/**
 * Admin-only form for creating or editing a facility.
 * When :id is present in the URL, it operates in edit mode.
 */

const FACILITY_TYPES = [
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting Room' },
  { value: 'AUDITORIUM', label: 'Auditorium' },
  { value: 'EQUIPMENT', label: 'Equipment' },
];

const ASSET_TYPES = [
  { value: 'PROJECTOR', label: 'Projector' },
  { value: 'CAMERA', label: 'Camera' },
  { value: 'MICROPHONE', label: 'Microphone' },
  { value: 'WHITEBOARD', label: 'Whiteboard' },
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'PRINTER', label: 'Printer' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

const INITIAL_FORM = {
  name: '',
  description: '',
  facilityType: 'LECTURE_HALL',
  assetType: '',
  capacity: '',
  location: '',
  status: 'ACTIVE',
  availableFrom: '',
  availableTo: '',
  imageUrl: '',
};

export default function FacilityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Load existing facility data in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const fetchFacility = async () => {
      try {
        const response = await getFacilityById(id);
        const f = response.data.data;
        setForm({
          name: f.name || '',
          description: f.description || '',
          facilityType: f.facilityType || 'LECTURE_HALL',
          assetType: f.assetType || '',
          capacity: f.capacity != null ? String(f.capacity) : '',
          location: f.location || '',
          status: f.status || 'ACTIVE',
          availableFrom: f.availableFrom || '',
          availableTo: f.availableTo || '',
          imageUrl: f.imageUrl || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load facility.');
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.location.trim()) errors.location = 'Location is required';
    if (!form.facilityType) errors.facilityType = 'Type is required';
    if (form.facilityType === 'EQUIPMENT' && !form.assetType) {
      errors.assetType = 'Asset type is required for equipment';
    }
    if (form.capacity && parseInt(form.capacity, 10) < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    if (form.availableFrom && form.availableTo && form.availableFrom >= form.availableTo) {
      errors.availableTo = 'End time must be after start time';
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
        name: form.name.trim(),
        description: form.description.trim() || null,
        facilityType: form.facilityType,
        assetType: form.facilityType === 'EQUIPMENT' ? form.assetType : null,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
        location: form.location.trim(),
        status: form.status,
        availableFrom: form.availableFrom || null,
        availableTo: form.availableTo || null,
        imageUrl: form.imageUrl.trim() || null,
      };

      if (isEditMode) {
        await updateFacility(id, payload);
      } else {
        await createFacility(payload);
      }

      navigate('/facilities', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.data && typeof data.data === 'object') {
        // Server-side validation errors
        setFieldErrors(data.data);
      } else {
        setError(data?.message || 'Failed to save facility.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate('/facilities')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Facilities
        </button>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-primary to-royal" />

          <div className="p-8">
            <h1 className="text-xl font-bold text-ink mb-6">
              {isEditMode ? 'Edit Facility' : 'Add New Facility'}
            </h1>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <FormField
                label="Facility Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={fieldErrors.name}
                required
                placeholder="e.g., Lecture Hall A1"
              />

              {/* Type + Status row */}
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Type"
                  name="facilityType"
                  value={form.facilityType}
                  onChange={handleChange}
                  options={FACILITY_TYPES}
                  error={fieldErrors.facilityType}
                  required
                />
                <FormSelect
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                />
              </div>

              {/* Asset Type (conditional) */}
              {form.facilityType === 'EQUIPMENT' && (
                <FormSelect
                  label="Asset Type"
                  name="assetType"
                  value={form.assetType}
                  onChange={handleChange}
                  options={ASSET_TYPES}
                  error={fieldErrors.assetType}
                  required
                  placeholder="Select asset type"
                />
              )}

              {/* Location */}
              <FormField
                label="Location"
                name="location"
                value={form.location}
                onChange={handleChange}
                error={fieldErrors.location}
                required
                placeholder="e.g., Block A, Floor 2, Room 201"
              />

              {/* Capacity */}
              <FormField
                label="Capacity"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                error={fieldErrors.capacity}
                type="number"
                min="1"
                placeholder="Max number of people"
              />

              {/* Availability Window */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Available From"
                  name="availableFrom"
                  value={form.availableFrom}
                  onChange={handleChange}
                  type="time"
                />
                <FormField
                  label="Available To"
                  name="availableTo"
                  value={form.availableTo}
                  onChange={handleChange}
                  error={fieldErrors.availableTo}
                  type="time"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional description of this facility..."
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              {/* Image URL */}
              <FormField
                label="Image URL"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
              />

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/facilities')}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-muted bg-surface border border-border rounded-xl hover:bg-mist transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-royal rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : isEditMode
                    ? 'Update Facility'
                    : 'Create Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ===== Reusable Form Components ===== */
function FormField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  type = 'text',
  placeholder,
  ...rest
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        id={`field-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
          error ? 'border-danger' : 'border-border'
        }`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <select
        id={`field-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-3.5 py-2.5 border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
          error ? 'border-danger' : 'border-border'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
}
