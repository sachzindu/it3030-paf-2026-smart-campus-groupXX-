import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

/**
 * Admin dashboard — dummy placeholder with stat cards.
 * Full functionality will be implemented later.
 */
export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Total Users',
      value: '—',
      icon: UsersIcon,
      color: 'from-primary to-royal',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Bookings',
      value: '—',
      icon: BookingIcon,
      color: 'from-success to-emerald-600',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Open Tickets',
      value: '—',
      icon: TicketIcon,
      color: 'from-warning to-amber-600',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Facilities',
      value: '—',
      icon: FacilityIcon,
      color: 'from-violet to-purple-700',
      bgColor: 'bg-violet/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted mt-1">
            Here&apos;s an overview of your campus operations.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-ink/70" />
                </div>
              </div>
              <p className="text-3xl font-bold text-ink">{stat.value}</p>
              <p className="text-sm text-muted mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Placeholder Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-4">Recent Bookings</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-mist flex items-center justify-center mb-4">
                <BookingIcon className="w-8 h-8 text-primary/40" />
              </div>
              <p className="text-muted text-sm">Booking management coming soon</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-4">Incident Tickets</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
                <TicketIcon className="w-8 h-8 text-warning/40" />
              </div>
              <p className="text-muted text-sm">Ticket management coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* Icon Components */
function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function BookingIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function FacilityIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
