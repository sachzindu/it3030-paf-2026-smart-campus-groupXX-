"import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getIncidentById, updateIncident } from '../api/incidentApi';
import { getAllFacilities } from '../api/facilityApi';

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'HARDWARE',
  priority: 'LOW',
  facilityId: '',
  location: '',
  contactDetails: '',
};

const CATEGORY_OPTIONS = [
  { value: 'HARDWARE', label: 'Hardware' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'FACILITY', label: 'Facility / Building' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'OTHER', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const BASE_URL = 'http://localhost:8080';

export default function IncidentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [incident, setIncident] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incidentRes, facilitiesRes] = await Promise.all([
          getIncidentById(id),
          getAllFacilities(),
        ]);

        const data = incidentRes.data.data;
        setIncident(data);
        setFacilities(facilitiesRes.data.data || []);

        if (data.status !== 'PENDING') {
          setError('Only PENDING incidents can be edited.');
          return;
        }

        setForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'HARDWARE',
          priority: data.priority || 'LOW',
          facilityId: data.facilityId || '',
          location: data.location || '',
          contactDetails: data.contactDetails || '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load incident.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (!form.description.trim()) nextErrors.description = 'Description is required';
    if (!form.location.trim()) nextErrors.location = 'Location is required';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      alert('You can only upload a maximum of 3 images.');
      return;
    }

    const nextImages = [...images, ...files].slice(0, 3);
    setImages(nextImages);
    setPreviews(nextImages.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (index) => {
    const nextImages = images.filter((_, i) => i !== index);
    const nextPreviews = previews.filter((_, i) => i !== index);
    setImages(nextImages);
    setPreviews(nextPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('priority', form.priority);
      if (form.facilityId) formData.append('facilityId', form.facilityId);
      formData.append('location', form.location.trim());
      formData.append('contactDetails', form.contactDetails);

      images.forEach((img) => formData.append('images', img));

      await updateIncident(id, formData);
      navigate(`/incidents/${id}`, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.data && typeof data.data === 'object') {
        setFieldErrors(data.data);
      } else {
        setError(data?.message || 'Failed to update incident.');
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
      <div className="max-w-2xl mx-auto py-8">
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
            <h1 className="text-xl font-bold text-ink mb-2">Edit Incident</h1>
            <p className="text-sm text-muted mb-6">You can only edit this ticket while it is still pending.</p>

            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded-xl text-sm font-medium mb-6">
                {error}
              </div>
            )}

            {incident?.imageUrls?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-ink mb-2">Current Images</p>
                <div className="flex flex-wrap gap-3">
                  {incident.imageUrls.map((url, idx) => (
                    <a key={idx} href={`${BASE_URL}${url}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${BASE_URL}${url}`}
                        alt="incident evidence"
                        className="w-24 h-24 object-cover rounded-xl border border-border shadow-sm"
                      />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-muted mt-2">Uploading new images will replace the current attachments.</p>
              </div>
            )}

            {incident && incident.status === 'PENDING' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <FormField
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  error={fieldErrors.title}
                  required
                  placeholder="e.g. Projector not turning on"
                />

                <FormField
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  error={fieldErrors.description}
                  required
                  multiline
                  rows="4"
                  placeholder="Provide detailed information about the issue..."
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormSelect
                    label="Category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    options={CATEGORY_OPTIONS}
                  />
                  <FormSelect
                    label="Priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    options={PRIORITY_OPTIONS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">Facility (Optional)</label>
                    <select
                      name="facilityId"
                      value={form.facilityId}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-xl bg-white outline-none"
                    >
                      <option value="">-- Select Facility --</option>
                      {facilities.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">Specific Location</label>
                    <input
                      required
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-xl outline-none ${fieldErrors.location ? 'border-danger' : 'border-border'}`}
                      placeholder="e.g. Room 301, near door"
                    />
                    {fieldErrors.location && <p className="text-xs text-danger mt-1">{fieldErrors.location}</p>}
                  </div>
                </div>

                <FormField
                  label="Contact Details"
                  name="contactDetails"
                  value={form.contactDetails}
                  onChange={handleChange}
                  placeholder="Phone number or extension (optional)"
                />

                <div className="pt-4 border-t border-border/50">
                  <label className="block text-sm font-semibold text-ink mb-2">Replace Evidence Images (Max 3)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={images.length >= 3}
                    className="block w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition cursor-pointer"
                  />

                  {previews.length > 0 && (
                    <div className="flex gap-4 mt-4">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border">
                          <img src={src} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 text-sm font-semibold text-muted bg-surface rounded-xl hover:bg-mist"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-royal disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {incident && incident.status !== 'PENDING' && (
              <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-xl text-sm font-medium">
                This incident is no longer pending, so it cannot be edited.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function FormField({ label, name, value, onChange, error, required = false, multiline = false, rows = 3, placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-1">{label}</label>
      {multiline ? (
        <textarea
          required={required}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${error ? 'border-danger' : 'border-border'}`}
        />
      ) : (
        <input
          required={required}
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${error ? 'border-danger' : 'border-border'}`}
        />
      )}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

function FormSelect({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-border rounded-xl bg-white outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
