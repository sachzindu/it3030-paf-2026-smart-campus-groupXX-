import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

/**
 * Technician dashboard — dummy placeholder with task-oriented cards.
 * Full functionality will be implemented later.
 */
export default function TechnicianDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      label: 'Assigned Tickets',
      value: '—',
      icon: TicketIcon,
      bgColor: 'bg-cyan/10',
    },
    {
      label: 'In Progress',
      value: '—',
      icon: ProgressIcon,
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Resolved Today',
      value: '—',
      icon: CheckIcon,
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Hello, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted mt-1">
            Here are your assigned maintenance tasks.
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

        {/* Assigned Tickets Placeholder */}
        <div className="bg-white rounded-2xl border border-border/50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink mb-4">My Assigned Tickets</h2>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan/10 flex items-center justify-center mb-4">
              <TicketIcon className="w-8 h-8 text-cyan/40" />
            </div>
            <p className="text-muted text-sm font-medium">No tickets assigned yet</p>
            <p className="text-muted/60 text-xs mt-1">Tickets assigned to you will appear here</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* Icon Components */
function TicketIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  );
}

function ProgressIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
