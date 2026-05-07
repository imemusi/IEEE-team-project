import { useState } from 'react'

const MEMBERS = [
  { initials: 'MS', name: 'M. Smith',   color: 'purple' },
  { initials: 'AI', name: 'Alex I.',    color: 'teal'   },
  { initials: 'JK', name: 'J. Kim',     color: 'orange' },
  { initials: 'PW', name: 'P. Wong',    color: 'green'  },
  { initials: 'JL', name: 'Jordan Lee', color: 'blue'   },
  { initials: 'RK', name: 'R. Kim',     color: 'pink'   },
]

const AVATAR_COLORS = {
  purple: 'bg-brand text-white',
  teal:   'bg-teal-500 text-white',
  green:  'bg-green-500 text-white',
  orange: 'bg-orange-400 text-white',
  pink:   'bg-pink-500 text-white',
  blue:   'bg-blue-500 text-white',
}

function Avatar({ initials, color, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-xxs', md: 'w-9 h-9 text-xxs' }
  return (
    <div className={`rounded-avatar font-bold flex items-center justify-center flex-shrink-0 ${sizes[size]} ${AVATAR_COLORS[color] || AVATAR_COLORS.purple}`}>
      {initials}
    </div>
  )
}

export default function CreateSessionModal({ onClose, onCreate }) {
  const [name, setName]                 = useState('')
  const [description, setDescription]   = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selected, setSelected]         = useState([])
  const [date, setDate]                 = useState('')
  const [startTime, setStartTime]       = useState('')
  const [endTime, setEndTime]           = useState('')
  const [location, setLocation]         = useState('')
  const [topicInput, setTopicInput]     = useState('')
  const [topics, setTopics]             = useState([])

  function addTopic(e) {
    if (e.key === 'Enter' && topicInput.trim()) {
      e.preventDefault()
      const t = topicInput.trim().toLowerCase().replace(/\s+/g, '_')
      if (!topics.includes(t)) setTopics(prev => [...prev, t])
      setTopicInput('')
    }
  }

  function removeTopic(t) {
    setTopics(prev => prev.filter(x => x !== t))
  }

  function toggleMember(member) {
    setSelected(prev =>
      prev.find(m => m.initials === member.initials)
        ? prev.filter(m => m.initials !== member.initials)
        : [...prev, member]
    )
  }

  function handleCreate() {
    if (!name.trim()) return
    const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'TBD'
    const formattedTime = startTime && endTime ? `${startTime} – ${endTime}` : 'TBD'
    onCreate({ name, description, participants: selected, date: formattedDate, time: formattedTime, location: location || 'TBD', topics })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-page rounded-modal w-full max-w-sm flex flex-col overflow-hidden shadow-xl" style={{ maxHeight: '90vh' }}>

        {/* Top bar */}
        <div className="bg-surface px-4 py-3 flex items-center justify-between border-b border-line">
          <button onClick={onClose} className="text-muted hover:text-brand text-lg transition-colors">✕</button>
          <p className="text-xxs text-muted font-semibold uppercase tracking-widest">Create group page</p>
          <div className="w-5" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Group image + name */}
          <div className="bg-surface mx-4 mt-4 rounded-card border-2 border-brand overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 rounded-full bg-page border-2 border-line flex items-center justify-center text-2xl">
                  📚
                </div>
                <button className="text-brand text-xxs font-semibold hover:underline">Edit</button>
              </div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter group name and an optional profile picture"
                className="flex-1 text-sm text-primary placeholder:text-muted bg-transparent focus:outline-none"
              />
            </div>
            <div className="border-t border-line px-4 py-2">
              <input
                type="text"
                placeholder="Session name e.g. Mudd-us"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-sm text-primary placeholder:text-muted bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Invite participants */}
          <div className="px-4 mt-5">
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-2">Invite Participants</p>
            <div className="bg-surface rounded-card border border-line overflow-hidden">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-sub hover:bg-page transition-colors"
              >
                <span>
                  {selected.length === 0
                    ? 'Select participants...'
                    : selected.map(m => m.name).join(', ')
                  }
                </span>
                <span className={`text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>⌄</span>
              </button>

              {dropdownOpen && (
                <div className="border-t border-line">
                  {MEMBERS.map(member => (
                    <label
                      key={member.initials}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-page cursor-pointer transition-colors"
                    >
                      <Avatar initials={member.initials} color={member.color} size="sm" />
                      <span className="flex-1 text-label text-primary">{member.name}</span>
                      <input
                        type="checkbox"
                        checked={!!selected.find(m => m.initials === member.initials)}
                        onChange={() => toggleMember(member)}
                        className="accent-brand w-4 h-4"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selected.map(m => (
                  <span key={m.initials} className="flex items-center gap-1 bg-brand-light text-brand text-xxs font-medium px-2 py-0.5 rounded-badge">
                    {m.name}
                    <button onClick={() => toggleMember(m)} className="hover:text-brand-hover leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="px-4 mt-5">
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-2">🕐 Date &amp; Time</p>
            <div className="bg-surface rounded-card border border-line overflow-hidden divide-y divide-line">
              <div className="flex items-center px-4 py-2.5 gap-3">
                <span className="text-muted text-sm w-16 flex-shrink-0">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="flex-1 text-sm text-primary bg-transparent focus:outline-none"
                />
              </div>
              <div className="flex items-center px-4 py-2.5 gap-3">
                <span className="text-muted text-sm w-16 flex-shrink-0">Start</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="flex-1 text-sm text-primary bg-transparent focus:outline-none"
                />
              </div>
              <div className="flex items-center px-4 py-2.5 gap-3">
                <span className="text-muted text-sm w-16 flex-shrink-0">End</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="flex-1 text-sm text-primary bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="px-4 mt-5">
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-2">📍 Location</p>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Tech LG52 – Study Lounge"
              className="w-full bg-surface border border-line rounded-card px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand"
            />
          </div>

          {/* Topics (optional) */}
          <div className="px-4 mt-5">
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-2">Topics <span className="normal-case font-normal">(optional)</span></p>
            <input
              type="text"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              onKeyDown={addTopic}
              placeholder="Type a topic and press Enter..."
              className="w-full bg-surface border border-line rounded-card px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand"
            />
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {topics.map(t => (
                  <span key={t} className="flex items-center gap-1 bg-brand-light text-brand text-xxs font-medium px-2 py-0.5 rounded-badge">
                    #{t}
                    <button onClick={() => removeTopic(t)} className="hover:text-brand-hover leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="px-4 mt-5 pb-4">
            <p className="text-xxs text-muted font-semibold uppercase tracking-widest mb-2">Description</p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What will you be working on?"
              rows={3}
              className="w-full bg-surface border border-line rounded-card px-4 py-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand resize-none"
            />
          </div>
        </div>

        {/* Bottom actions */}
        <div className="bg-surface border-t border-line flex">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-label font-semibold text-muted hover:text-primary transition-colors border-r border-line"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-3 text-label font-semibold text-brand hover:text-brand-hover disabled:opacity-40 transition-colors"
          >
            Create
          </button>
        </div>

      </div>
    </div>
  )
}
