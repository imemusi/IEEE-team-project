import { useAuth } from './context/AuthContext';
import { useClasses } from './context/ClassesContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { classes, setActiveClass } = useClasses();
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-page">
      {/* Welcome Banner */}
      <div className="bg-brand rounded-2xl p-8 mb-8 text-white shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-brand-light font-medium text-lg">
            Select a class to view its study sessions.
          </p>
        </div>
      </div>

      {/* My Classes Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-primary">My Classes</h2>
          <button
            onClick={() => navigate('/discover')}
            className="text-brand text-sm font-semibold hover:text-brand-hover"
          >
            + Add Class
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id || cls.code}
              onClick={() => { setActiveClass(cls); navigate('/study'); }}
              className="bg-surface border border-line rounded-xl p-5 hover:border-brand hover:shadow-sm transition-all cursor-pointer group"
            >
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${cls.color || 'bg-brand/10 text-brand'}`}>
                {cls.code}
              </span>
              <h3 className="text-lg font-bold text-primary mb-1 group-hover:text-brand transition-colors">
                {cls.title || cls.name}
              </h3>
              <div className="flex items-center gap-4 text-xs text-muted mt-4">
                <span className="flex items-center gap-1">124 Peers</span>
                <span className="flex items-center gap-1">3 Active Q&A</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}