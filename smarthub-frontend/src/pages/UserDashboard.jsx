import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

/**
 * User dashboard — dummy placeholder with booking and ticket overview.
 * Full functionality will be implemented later.
 */
export default function UserDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'My Bookings',
      value: '—',
      icon: BookingIcon,
      bgColor: 'bg-primary/10',
    },
    {
      label: 'My Tickets',
      value: '—',
      icon: TicketIcon,
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Notifications',
      value: '—',
      icon: BellIcon,
      bgColor: 'bg-indigo/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted mt-1">
            Manage your bookings and report incidents from here.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-4">Book a Resource</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-mist flex items-center justify-center mb-4">
                <BookingIcon className="w-8 h-8 text-primary/40" />
              </div>
              <p className="text-muted text-sm font-medium">Resource booking coming soon</p>
              <p className="text-muted/60 text-xs mt-1">Book rooms, labs, and equipment</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-4">Report an Issue</h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
                <TicketIcon className="w-8 h-8 text-warning/40" />
              </div>
              <p className="text-muted text-sm font-medium">Incident reporting coming soon</p>
              <p className="text-muted/60 text-xs mt-1">Report facility issues and faults</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* Icon Components */
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

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
