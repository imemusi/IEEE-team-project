import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useClasses } from './context/ClassesContext';
import { useNavigate } from 'react-router-dom';
import { subscribeSessions } from './services/firestore';

export default function DashboardOverview() {
  const { user } = useAuth();
  const { classes, activeClass, setActiveClass } = useClasses();
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  // Subscribe to sessions for the active class (or first class as fallback)
  const sessionClassId = activeClass?.id || classes[0]?.id || null;
  useEffect(() => {
    let unsub = null;
    try {
      unsub = subscribeSessions(sessionClassId, (items) => setUpcomingSessions(items));
    } catch (e) {
      console.warn('subscribeSessions (dashboard) failed:', e);
    }
    return () => { try { unsub?.() } catch (_) {} };
  }, [sessionClassId]);

  const handleClassClick = (cls) => {
    setActiveClass(cls);
    navigate('/chat');
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-page">
      {/* Welcome Banner */}
      <div className="bg-brand rounded-2xl p-8 mb-8 text-white shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold mb-2">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-brand-light font-medium text-lg">
            {upcomingSessions.length > 0
              ? `You have ${upcomingSessions.length} study session${upcomingSessions.length === 1 ? '' : 's'} coming up.`
              : 'No study sessions scheduled yet.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (takes up 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div 
                  key={cls.id || cls.code} 
                  onClick={() => handleClassClick(cls)}
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

        {/* Right Column (takes up 1/3) */}
        <div className="space-y-8">
          
          {/* Upcoming Sessions */}
          <section>
            <h2 className="text-xl font-bold text-primary mb-4">Upcoming Sessions</h2>
            <div className="bg-surface border border-line rounded-xl p-4 space-y-4">
              {upcomingSessions.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No upcoming sessions yet.</p>
              ) : (
                upcomingSessions.slice(0, 3).map(session => (
                  <div key={session.id} className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-primary leading-tight mb-1">{session.title}</h4>
                      <p className="text-xs text-brand font-medium mb-1">{session.date} · {session.time}</p>
                      <p className="text-xs text-sub">{(session.attendees || []).length} attending</p>
                    </div>
                  </div>
                ))
              )}
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/study')}
                  className="w-full py-2 bg-page border border-line rounded-lg text-sm font-semibold text-sub hover:text-brand hover:border-brand transition-colors"
                >
                  View All Sessions
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}