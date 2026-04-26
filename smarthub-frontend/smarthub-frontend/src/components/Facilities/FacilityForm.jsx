import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import {
  getFacilityById,
  createFacility,
  updateFacility,
  uploadFacilityImage,
  getResponseData,
  resolveFacilityImageUrl,
} from '../../api/facilityApi';

/**
 * FacilityForm Component
 * Form for creating and editing facilities (ADMIN only)
 */
export default function FacilityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    facilityType: 'LECTURE_HALL',
    location: '',
    capacity: '',
    status: 'ACTIVE',
    imageUrl: '',
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // Fetch facility data if editing
  useEffect(() => {
    if (isEditMode) {
      const fetchFacility = async () => {
        try {
          const response = await getFacilityById(id);
          const facility = response.data.data || response.data;
          setFormData({
            name: facility.name || '',
            description: facility.description || '',
            facilityType: facility.facilityType || 'LECTURE_HALL',
            location: facility.location || '',
            capacity: facility.capacity || '',
            status: facility.status || 'ACTIVE',
            imageUrl: facility.imageUrl || '',
          });
          setImagePreviewUrl(resolveFacilityImageUrl(facility.imageUrl || ''));
        } catch (err) {
          console.error('Error fetching facility:', err);
          setError('Failed to load facility data');
        } finally {
          setLoading(false);
        }
      };
      fetchFacility();
    }
  }, [id, isEditMode]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage('');

    try {
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
      };

      if (selectedImageFile) {
        const uploadResponse = await uploadFacilityImage(selectedImageFile);
        const uploadData = getResponseData(uploadResponse);
        payload.imageUrl = uploadData.imageUrl;
      }

      if (isEditMode) {
        await updateFacility(id, payload);
        setSuccessMessage('Facility updated successfully!');
      } else {
        await createFacility(payload);
        setSuccessMessage('Facility created successfully!');
      }

      setTimeout(() => {
        navigate('/facilities');
      }, 1500);
    } catch (err) {
      console.error('Error saving facility:', err);
      setError(err.response?.data?.message || 'Failed to save facility');
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
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            {isEditMode ? 'Edit Facility' : 'Create New Facility'}
          </h1>
          <p className="text-muted mt-1">
            {isEditMode ? 'Update facility information' : 'Add a new facility to the catalogue'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-success/10 border border-success/20 text-success px-4 py-3 rounded-xl text-sm font-medium">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border/50 shadow-sm p-8">
          {/* Basic Information */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Facility Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="e.g., Lecture Hall A1"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Describe the facility..."
              />
            </div>

            {/* Type and Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Facility Type *
                </label>
                <select
                  name="facilityType"
                  value={formData.facilityType}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="LECTURE_HALL">Lecture Hall</option>
                  <option value="LAB">Laboratory</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="AUDITORIUM">Auditorium</option>
                  <option value="EQUIPMENT">Equipment</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g., Building A, Floor 2"
                />
              </div>
            </div>

            {/* Capacity and Image Upload Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Capacity */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Capacity (Persons) *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g., 100"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Facility Image
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-medium"
                />
                <p className="text-xs text-muted mt-2">
                  Upload JPG, PNG, GIF, or WEBP up to 5MB.
                </p>
              </div>
            </div>

            {(imagePreviewUrl || formData.imageUrl) && (
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Image Preview
                </label>
                <div className="rounded-2xl border border-border/50 overflow-hidden bg-mist max-w-sm">
                  <img
                    src={imagePreviewUrl || resolveFacilityImageUrl(formData.imageUrl)}
                    alt="Facility preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
                {selectedImageFile ? (
                  <p className="text-xs text-muted mt-2">Selected file: {selectedImageFile.name}</p>
                ) : formData.imageUrl ? (
                  <p className="text-xs text-muted mt-2">Current image will be kept unless you choose a new file.</p>
                ) : null}
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-royal text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {submitting ? 'Saving...' : (isEditMode ? 'Update Facility' : 'Create Facility')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/facilities')}
              className="flex-1 px-6 py-3 bg-surface text-ink hover:bg-border transition font-medium rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
