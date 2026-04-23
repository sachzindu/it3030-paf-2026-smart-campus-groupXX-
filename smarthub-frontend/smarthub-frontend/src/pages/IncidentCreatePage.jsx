import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { createIncident } from '../api/incidentApi';
import { getAllFacilities } from '../api/facilityApi';

export default function IncidentCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [facilities, setFacilities] = useState([]);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'HARDWARE',
    priority: 'LOW',
    facilityId: '',
    location: '',
    contactDetails: ''
  });

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const fetchFac = async () => {
      try {
        const res = await getAllFacilities();
        setFacilities(res.data.data);
      } catch (e) {
        console.error("Could not fetch facilities", e);
      }
    };
    fetchFac();
  }, []);

  const validateField = (name, value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;

    if (['title', 'description', 'location'].includes(name)) {
      if (!trimmed) return 'This field is required.';
    }

    if (name === 'title' && trimmed && trimmed.length < 5) {
      return 'Title should be at least 5 characters.';
    }

    if (name === 'description' && trimmed && trimmed.length < 10) {
      return 'Description should be at least 10 characters.';
    }

    return '';
  };

  const validateForm = (data) => {
    const nextErrors = {};
    ['title', 'description', 'location'].forEach((field) => {
      const message = validateField(field, data[field]);
      if (message) nextErrors[field] = message;
    });
    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };
    setForm(nextForm);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 3) {
      alert("You can only upload a maximum of 3 images.");
      return;
    }

    const newImages = [...images, ...files].slice(0, 3);
    setImages(newImages);

    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setTouched({ title: true, description: true, location: true });
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('priority', form.priority);
      if (form.facilityId) formData.append('facilityId', form.facilityId);
      formData.append('location', form.location);
      formData.append('contactDetails', form.contactDetails);

      images.forEach((img) => {
        formData.append('images', img);
      });

      await createIncident(formData);
      navigate('/incidents');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit incident ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold text-ink mb-2">Report an Incident</h1>
        <p className="text-muted mb-8">Submit a maintenance request or report a fault.</p>

        {error && <div className="mb-6 p-4 bg-danger/10 text-danger border border-danger/20 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-border/50 space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Title</label>
            <input
              required
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${errors.title && touched.title ? 'border-danger' : 'border-border'}`}
              placeholder="e.g. Projector not turning on"
            />
            {errors.title && touched.title && (
              <p className="text-xs text-danger mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Description</label>
            <textarea
              required
              name="description"
              value={form.description}
              onChange={handleChange}
              onBlur={handleBlur}
              rows="4"
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none ${errors.description && touched.description ? 'border-danger' : 'border-border'}`}
              placeholder="Provide detailed information about the issue..."
            ></textarea>
            {errors.description && touched.description && (
              <p className="text-xs text-danger mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-white outline-none">
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="FACILITY">Facility / Building</option>
                <option value="NETWORKING">Networking</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-white outline-none">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Facility (Optional)</label>
              <select name="facilityId" value={form.facilityId} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-white outline-none">
                <option value="">-- Select Facility --</option>
                {facilities.map(f => (
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
                onBlur={handleBlur}
                className={`w-full px-4 py-2 border rounded-xl outline-none ${errors.location && touched.location ? 'border-danger' : 'border-border'}`}
                placeholder="e.g. Room 301, near door"
              />
              {errors.location && touched.location && (
                <p className="text-xs text-danger mt-1">{errors.location}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Contact Details</label>
            <input type="text" name="contactDetails" value={form.contactDetails} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Phone number or extension (optional)" />
          </div>

          {/* Image Upload */}
          <div className="pt-4 border-t border-border/50">
            <label className="block text-sm font-semibold text-ink mb-2">Evidence Images (Max 3)</label>
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
                    <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-semibold text-muted bg-surface rounded-xl hover:bg-mist">Cancel</button>
            <button
              type="submit"
              disabled={loading || Object.values(errors).some(Boolean)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-royal disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Incident'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
