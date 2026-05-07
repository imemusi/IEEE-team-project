import { useState } from 'react'
import SessionChat from './SessionChat'
import CreateSessionModal from './CreateSessionModal'

function Tag({ label }) {
  return (
    <span className="inline-block bg-brand-light text-brand text-xxs font-medium px-2 py-0.5 rounded-badge">
      #{label}
    </span>
  )
}

function Avatar({ initials, color }) {
  const colors = {
    purple: 'bg-brand text-white',
    teal:   'bg-teal-500 text-white',
    green:  'bg-green-500 text-white',
    orange: 'bg-orange-400 text-white',
    pink:   'bg-pink-500 text-white',
    blue:   'bg-blue-500 text-white',
  }
  return (
    <div className={`w-8 h-8 rounded-avatar text-xxs font-bold flex items-center justify-center flex-shrink-0 ${colors[color] || colors.purple}`}>
      {initials}
    </div>
  )
}

function SessionCard({ session, onOpen }) {
  const { title, joined, host, attendingCount, date, time, location, topics, description, attendees, spotsTotal } = session
  const spotsFilled = attendees.length
  const spotsLeft = spotsTotal - spotsFilled

  return (
    <div
      className={`bg-surface rounded-card border border-line overflow-hidden transition-all ${
        joined
          ? 'cursor-pointer hover:border-brand hover:shadow-sm'
          : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={joined ? onOpen : undefined}
    >
      {/* Card header */}
      <div className="bg-brand p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-card bg-brand-hover flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <h3 className="text-white font-bold text-base leading-tight">{title}</h3>
        </div>
        {joined ? (
          <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xxs font-semibold px-3 py-1 rounded-full flex-shrink-0">
            ✓ Joined
          </span>
        ) : (
          <span className="flex items-center gap-1 border-2 border-white text-white text-xxs font-semibold px-3 py-1 rounded-full flex-shrink-0">
            + Join
          </span>
        )}
      </div>

      {/* Host row */}
      <div className="px-4 pt-3 pb-1 text-label text-sub">
        Hosted by <span className="text-primary font-semibold">{host}</span> · {attendingCount} attending
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex gap-3">
          <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div>
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-0.5">Date &amp; Time</p>
            <p className="text-label text-primary">{date} · {time}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <div>
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-0.5">Location</p>
            <p className="text-label text-primary">{location}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <div>
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-0.5">Topics</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {topics.map((t) => <Tag key={t} label={t} />)}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <svg className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <div>
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-0.5">Description</p>
            <p className="text-label text-sub leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="flex -space-x-2">
            {attendees.map((a) => (
              <Avatar key={a.initials} initials={a.initials} color={a.color} />
            ))}
          </div>
          {spotsLeft > 0 && (
            <span className="text-xxs text-muted ml-2">+{spotsLeft} more</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xxs text-muted">{spotsFilled}/{spotsTotal} spots</span>
          {joined
            ? <span className="text-xxs text-brand font-medium">Open chat →</span>
            : <span className="text-xxs text-muted">Members only</span>
          }
        </div>
      </div>
    </div>
  )
}

const SESSIONS = [
  {
    id: 1,
    title: 'Midterm Prep – Trees & Graphs',
    joined: true,
    host: 'M. Smith',
    attendingCount: 4,
    date: 'Thursday, Apr 10',
    time: '6:00 PM – 8:00 PM',
    location: 'Tech LG52 – Study Lounge',
    topics: ['trees', 'graphs', 'midterm_review'],
    description: 'Going through HW4 problems on BFS/DFS and practicing tree traversal problems from past exams.',
    attendees: [
      { initials: 'MS', name: 'M. Smith',  color: 'purple' },
      { initials: 'AI', name: 'Alex I.',   color: 'teal'   },
      { initials: 'JK', name: 'J. Kim',    color: 'orange' },
      { initials: 'PW', name: 'P. Wong',   color: 'green'  },
    ],
    spotsTotal: 8,
  },
  {
    id: 2,
    title: 'Dynamic Programming',
    joined: false,
    host: 'Jordan Lee',
    attendingCount: 2,
    date: 'Saturday, Apr 12',
    time: '2:00 PM – 4:00 PM',
    location: 'Mudd Library – Room 3300',
    topics: ['dynamic_programming', 'recursion', 'memoization'],
    description: 'Working through classic DP problems — knapsack, longest common subsequence, and coin change.',
    attendees: [
      { initials: 'JL', name: 'Jordan Lee', color: 'blue' },
      { initials: 'RK', name: 'R. Kim',     color: 'pink' },
    ],
    spotsTotal: 6,
  },
]

function StudySessions() {
  const [openSession, setOpenSession] = useState(null)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('classhub-sessions')
      return saved ? JSON.parse(saved) : SESSIONS
    } catch {
      return SESSIONS
    }
  })

  function handleCreate({ name, description, participants, date, time, location, topics }) {
    const newSession = {
      id: sessions.length + 1,
      title: name,
      joined: true,
      host: 'You',
      attendingCount: participants.length + 1,
      date,
      time,
      location,
      topics,
      description,
      attendees: [{ initials: 'UN', name: 'You', color: 'purple' }, ...participants],
      spotsTotal: 10,
    }
    setSessions(prev => {
      const updated = [newSession, ...prev]
      localStorage.setItem('classhub-sessions', JSON.stringify(updated))
      return updated
    })
  }

  const filtered = sessions.filter((s) => {
    const q = query.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.host.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.topics.some((t) => t.toLowerCase().includes(q))
    )
  })

  if (openSession) {
    return <SessionChat session={openSession} onBack={() => setOpenSession(null)} />
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {showCreate && (
        <CreateSessionModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {/* Banner */}
      <div className="bg-brand rounded-card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">Study Sessions</h2>
          <p className="text-brand-light text-label mt-0.5">Schedule and join peer study sessions for this course</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-white text-brand font-semibold text-label px-4 py-2 rounded-btn hover:bg-brand-light transition-colors flex-shrink-0"
        >
          + Create Session
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Upcoming Sessions', value: '4'  },
          { label: 'Students Joined',   value: '18' },
          { label: 'My Sessions',       value: '1'  },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-card border border-line p-4 text-center">
            <p className="text-2xl font-bold text-brand">{s.value}</p>
            <p className="text-xxs text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, host, location, or topic..."
        className="w-full bg-surface border border-line rounded-btn px-4 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand"
      />

      {/* Session cards */}
      {filtered.length > 0 ? (
        filtered.map((s) => (
          <SessionCard key={s.id} session={s} onOpen={() => setOpenSession(s)} />
        ))
      ) : (
        <div className="text-center py-12 text-muted text-label">
          No sessions match "{query}"
        </div>
      )}
    </div>
  )
}

export default StudySessions
