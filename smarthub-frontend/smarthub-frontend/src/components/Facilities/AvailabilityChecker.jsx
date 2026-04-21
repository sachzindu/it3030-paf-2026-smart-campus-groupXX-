import { useState } from 'react';
import { checkAvailability } from '../../api/facilityApi';

/**
 * AvailabilityChecker Component
 * Modal for checking if a facility is available during a specific time slot
 */
export default function AvailabilityChecker({ facilityId, onClose }) {
  const [formData, setFormData] = useState({
    bookingDate: '',
    startTime: '09:00',
    endTime: '10:00',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkAvailability(facilityId, formData);
      setResult(response.data.data || response.data);
    } catch (err) {
      console.error('Error checking availability:', err);
      setError(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-border/50">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-ink">Check Availability</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-2xl transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCheck} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Date *
            </label>
            <input
              type="date"
              name="bookingDate"
              value={formData.bookingDate}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              Start Time *
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-semibold text-ink mb-2">
              End Time *
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              required
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-ink bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl">
              <p className="text-danger text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-xl ${result.isAvailable ? 'bg-success/10 border border-success/20' : 'bg-danger/10 border border-danger/20'}`}>
              <p className={`font-medium ${result.isAvailable ? 'text-success' : 'text-danger'}`}>
                {result.isAvailable ? '✓ Available!' : '✗ Not Available'}
              </p>
              {result.message && (
                <p className={`text-sm mt-2 ${result.isAvailable ? 'text-success' : 'text-danger'}`}>
                  {result.message}
                </p>
              )}
              {result.conflicts && result.conflicts.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-2 text-ink">Conflicting bookings:</p>
                  <ul className="text-xs space-y-1 text-muted">
                    {result.conflicts.map((conflict, idx) => (
                      <li key={idx}>
                        • {conflict.startTime} - {conflict.endTime}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-surface text-ink hover:bg-border transition font-medium rounded-xl"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
