import { useState, useRef, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { subscribeSessionMessages, sendSessionMessage } from './services/firestore'

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

function ChatMessage({ message, isOwn }) {
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <Avatar initials={message.authorInitials} color={message.authorColor} />}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isOwn && (
          <span className="text-xxs text-muted px-1">{message.author || message.authorName || 'Student'}</span>
        )}
        <div className={`px-3 py-2 rounded-card text-label leading-relaxed ${
          isOwn
            ? 'bg-brand text-white rounded-tr-sm'
            : 'bg-surface border border-line text-primary rounded-tl-sm'
        }`}>
          {message.text}
        </div>
        <span className="text-xxs text-muted px-1">{message.time}</span>
      </div>
    </div>
  )
}

export default function SessionChat({ session, classId, onBack }) {
  const { user } = useAuth()
  // Chat placeholders removed — start with an empty message list
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  // Real-time Firestore subscription — scoped to this session
  useEffect(() => {
    setMessages([])
    let unsub = null
    try {
      unsub = subscribeSessionMessages(classId, session.id, (items) => {
        setMessages(items.map((m) => ({
          id: m.id,
          text: m.text,
          author: m.authorName,
          authorInitials: m.authorInitials || 'UN',
          authorColor: m.authorColor || 'purple',
          isOwn: m.authorId === user?.uid,
          time: m.createdAt?.toDate
            ? m.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
        })))
      })
    } catch (e) {
      console.warn('subscribeSessionMessages failed:', e)
    }
    return () => { try { unsub?.() } catch (_) {} }
  }, [classId, session.id, user?.uid])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function getAuthorInfo() {
    const name = user?.displayName || (user?.email ? user.email.split('@')[0] : 'You')
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    return { name, initials, color: 'purple' }
  }

  function sendMessage() {
    const text = input.trim()
    if (!text || !classId) return
    const author = getAuthorInfo()
    const localId = `local_${Date.now()}`
    const optimistic = {
      id: localId,
      text,
      author: author.name,
      authorInitials: author.initials,
      authorColor: author.color,
      isOwn: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')
    sendSessionMessage(classId, session.id, {
      text,
      authorName: author.name,
      authorId: user?.uid || null,
      authorInitials: author.initials,
      authorColor: author.color,
    }).then(() => {
      setMessages(prev => prev.filter(m => m.id !== localId))
    }).catch((e) => {
      console.warn('sendSessionMessage failed, keeping local fallback', e)
    })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="bg-surface border-b border-line px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-muted hover:text-brand transition-colors text-lg leading-none"
          title="Back to sessions"
        >
          ←
        </button>
        <div className="w-9 h-9 rounded-card bg-brand flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary font-semibold text-label truncate">{session.title}</p>
          <p className="text-xxs text-muted">{session.attendees.length} members · {session.date}</p>
        </div>
        {/* Member avatars */}
        <div className="flex -space-x-2">
          {session.attendees.map((a) => (
            <Avatar key={a.initials} initials={a.initials} color={a.color} />
          ))}
          <Avatar initials="UN" color="purple" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-page">
        {/* Date divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xxs text-muted px-2">{session.date}</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} isOwn={msg.isOwn} />
        ))}
        {messages.length === 0 && (
          <p className="text-center text-muted text-xxs py-8">No messages yet. Say hi!</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-surface border-t border-line px-4 py-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${session.title}...`}
          className="flex-1 bg-page border border-line rounded-btn px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 text-white text-label font-medium px-4 py-2 rounded-btn transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
