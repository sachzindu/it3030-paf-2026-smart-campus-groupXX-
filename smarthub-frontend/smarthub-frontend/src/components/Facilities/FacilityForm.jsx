import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import { getFacilityById, createFacility, updateFacility } from '../../api/facilityApi';

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
    type: 'LECTURE_HALL',
    location: '',
    capacity: '',
    amenities: [],
    imageUrl: '',
  });

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [amenityInput, setAmenityInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
            type: facility.type || 'LECTURE_HALL',
            location: facility.location || '',
            capacity: facility.capacity || '',
            amenities: facility.amenities || [],
            imageUrl: facility.imageUrl || '',
          });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || '' : value,
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index),
    }));
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

      let response;
      if (isEditMode) {
        response = await updateFacility(id, payload);
        setSuccessMessage('Facility updated successfully!');
      } else {
        response = await createFacility(payload);
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
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="LECTURE_HALL">Lecture Hall</option>
                  <option value="LAB">Laboratory</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
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

            {/* Capacity and Image URL Row */}
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

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-2">
                Amenities
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                  className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Add amenity (e.g., Projector)"
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 transition font-medium"
                >
                  Add
                </button>
              </div>

              {/* Amenities List */}
              {formData.amenities.length > 0 && (
                <div className="space-y-2">
                  {formData.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center justify-between bg-surface p-3 rounded-xl border border-border">
                      <span className="text-ink">{amenity}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(index)}
                        className="text-danger hover:text-danger/90"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
