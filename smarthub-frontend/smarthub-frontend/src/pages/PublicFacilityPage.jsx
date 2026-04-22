import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8080`;

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  OUT_OF_SERVICE: 'bg-red-100 text-red-800',
};

const TYPE_LABELS = {
  LECTURE_HALL: 'Lecture Hall',
  LAB: 'Lab',
  MEETING_ROOM: 'Meeting Room',
  AUDITORIUM: 'Auditorium',
  EQUIPMENT: 'Equipment',
};

export default function PublicFacilityPage() {
  const { id } = useParams();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/facilities/public/${id}`)
      .then((res) => setFacility(res.data.data || res.data))
      .catch(() => setError('Facility not found or unavailable.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700">Not Found</p>
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const statusLabel = facility.status?.replace('_', ' ') ?? 'Unknown';
  const statusStyle = STATUS_STYLES[facility.status] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = TYPE_LABELS[facility.facilityType] ?? facility.facilityType;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-5">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-widest">Smart Campus</p>
          <h1 className="text-white text-2xl font-bold mt-1">{facility.name}</h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {facility.description && (
            <p className="text-gray-600 text-sm">{facility.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Type" value={typeLabel} />
            <InfoItem label="Location" value={facility.location} />
            {facility.capacity && (
              <InfoItem label="Capacity" value={`${facility.capacity} people`} />
            )}
            {facility.assetType && (
              <InfoItem label="Asset Type" value={facility.assetType} />
            )}
            {facility.availableFrom && facility.availableTo && (
              <InfoItem
                label="Available"
                value={`${facility.availableFrom} – ${facility.availableTo}`}
                wide
              />
            )}
          </div>
        </div>

        <div className="px-6 pb-5">
          <p className="text-center text-xs text-gray-400">
            Scan the QR code to view this page · Smart Campus Hub
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-800 font-medium text-sm mt-0.5">{value}</p>
    </div>
  );
}
