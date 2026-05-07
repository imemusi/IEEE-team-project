import { useState, useRef, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useClasses } from './context/ClassesContext';
import { subscribeToQuestions, postQuestion, getQuestionReplies, addQuestionReply, voteQuestion, subscribeRepliesByUser } from './services/firestore';

function Tag({ label, isActive }) {
  return (
    <span className={`inline-block text-xxs font-medium px-2 py-0.5 rounded-badge transition-colors ${isActive ? 'bg-brand text-white' : 'bg-brand-light text-brand hover:bg-brand/20'}`}>
      #{label}
    </span>
  );
}

function Question({ qdoc, classId, isMentorView, onAddReply }) {
  const { id, authorName, role, title, text, time, tags, votes = 0, isForUpperclassmen } = qdoc
  const [currentVotes, setCurrentVotes] = useState(votes);
  const [userVote, setUserVote] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState([])
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    setCurrentVotes(qdoc.votes || 0)
    if (qdoc.voters && user) setUserVote(qdoc.voters[user.uid] || 0)
  }, [qdoc, user])

  useEffect(() => {
    if (!classId) return
    let unsub = null
    try {
      unsub = getQuestionReplies(classId, id, (items) => setReplies(items))
    } catch (e) {
      console.warn('could not subscribe to replies', e)
    }
    return () => { try { unsub && unsub() } catch (_) {} }
  }, [classId, id])

  const handleVote = async (val) => {
    if (!user) {
      alert('Please sign in to vote')
      return
    }
    const numeric = val
    const optimisticDelta = (numeric === userVote) ? -userVote : (numeric - userVote)
    setCurrentVotes((v) => v + optimisticDelta)
    const prevVote = userVote
    const newVote = numeric === userVote ? 0 : numeric
    setUserVote(newVote)
    try {
      const result = await voteQuestion(classId, id, user.uid, newVote)
      setCurrentVotes(result.votes)
    } catch (e) {
      console.error('vote failed', e)
      setUserVote(prevVote)
      setCurrentVotes((v) => v - optimisticDelta)
    }
  }

  return (
    <div className="bg-surface rounded-card border border-line p-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex flex-col items-center justify-start gap-1 text-muted text-sm min-w-[32px]">
          <button 
            onClick={() => handleVote(1)} 
            className={`transition-colors ${userVote === 1 ? 'text-brand font-bold' : 'hover:text-brand'}`}
          >
            ⬆
          </button>
          <span className={`font-medium ${userVote ? 'text-brand' : 'text-primary'}`}>{currentVotes}</span>
          <button 
            onClick={() => handleVote(-1)} 
            className={`transition-colors ${userVote === -1 ? 'text-red-500 font-bold' : 'hover:text-red-500'}`}
          >
            ⬇
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-label text-sub">{authorName || 'Student'} • {role || 'Student'}</span>
            <span className="text-xxs text-muted">{time || ''}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-primary font-semibold cursor-pointer hover:text-brand" onClick={() => setExpanded(!expanded)}>
              {isForUpperclassmen && (
                <span className="inline-flex items-center gap-1 bg-brand text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded mr-2 align-middle" title="Question directed to Upperclassmen">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"></path></svg>
                  Upperclassmen
                </span>
              )}
              {title}
            </h3>
          </div>
          <p className="text-sub text-sm mb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>{text}</p>

          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>

          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xxs text-muted hover:text-brand font-semibold transition-colors"
          >
            {expanded ? 'Hide replies' : `View ${qdoc.replyCount || replies.length} replies`}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="ml-12 pl-4 border-l-2 border-line space-y-3 mt-2">
          {replies.map(r => (
            <div key={r.id} className="bg-surface p-3 rounded-md">
              <div className="text-xxs text-muted">{r.authorName || (r.anonymous ? 'Anonymous' : 'Student')} • {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString() : ''}</div>
              <div className="mt-1 text-sm">{r.text}</div>
            </div>
          ))}

          {replying ? (
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!replyText.trim()) return
              try {
                await addQuestionReply(classId, id, { text: replyText.trim(), authorName: user?.displayName, authorId: user?.uid, anonymous: false })
                setReplyText('')
                setReplying(false)
              } catch (e) {
                console.error('reply failed', e)
                alert('Failed to post reply')
              }
            }}>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="w-full rounded-btn border border-line p-2" rows={3} />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => { setReplying(false); setReplyText('') }} className="px-3 py-1 rounded-btn border">Cancel</button>
                <button type="submit" className="px-3 py-1 rounded-btn bg-brand text-white">Reply</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setReplying(true)} className="text-xs font-semibold text-brand hover:text-brand-hover bg-brand/5 px-3 py-1.5 rounded-lg w-full text-left transition-colors">+ Add a reply...</button>
          )}
        </div>
      )}
    </div>
  );
}

function QAndA({ isMentorView = false }) {
  const scrollRef = useRef(null);
  const { user } = useAuth()
  const { activeClass } = useClasses()
  const classId = activeClass?.id || null
  const [showModal, setShowModal] = useState(false);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionBody, setQuestionBody] = useState('');
  const [askUpperclassmen, setAskUpperclassmen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTopic, setActiveTopic] = useState(null);
  const [questions, setQuestions] = useState([])
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState([])

  const scrollAmount = 320;

  const scrollUp = () => {
    scrollRef.current?.scrollBy({ top: -scrollAmount, left: 0, behavior: 'smooth' });
  };

  const scrollDown = () => {
    scrollRef.current?.scrollBy({ top: scrollAmount, left: 0, behavior: 'smooth' });
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const submitQuestion = (event) => {
    event.preventDefault();
    if (!classId) return
    postQuestion(classId, {
      title: questionTitle,
      text: questionBody,
      authorName: user?.displayName || 'Anonymous',
      authorId: user?.uid || null,
      isForUpperclassmen: askUpperclassmen,
      tags: activeTopic ? [activeTopic] : [],
    }).then(() => {
      setQuestionTitle('')
      setQuestionBody('')
      setAskUpperclassmen(false)
      setShowModal(false)
    }).catch((e) => {
      console.error('postQuestion failed', e)
      setQuestionTitle('')
      setQuestionBody('')
      setAskUpperclassmen(false)
      setShowModal(false)
    })
  };

  // Mock data for the two different views
  const normalQuestions = [
    {
      id: 1,
      author: "M. Smith",
      role: "Student",
      title: "Help needed on Assignment 3",
      text: "I'm trying to implement a while loop, but it keeps running forever. Can someone help me figure out what's wrong?",
      time: "2 hours ago",
      tags: ['loops', 'logic', 'A3'],
      replies: 12,
      votes: 23,
      isForUpperclassmen: true
    },
    {
      id: 2,
      author: "Jordan Lee",
      role: "Student",
      title: "Difference between pass by value and pass by reference?",
      text: "I'm confused about what happens when you modify parameters inside a function. Can someone explain with examples?",
      time: "5 hours ago",
      tags: ['midterm_review', 'functions', 'concepts'],
      replies: 18,
      votes: 45,
      isForUpperclassmen: false
    }
  ];

  const mentorQuestions = [
    {
      id: 3,
      author: "Freshman Alex",
      role: "Student",
      title: "How to prepare for the CS 111 Final?",
      text: "What are the common mistakes people make on this final? Is it mostly coding or multiple choice?",
      time: "1 hour ago",
      tags: ['exam_prep', 'general'],
      replies: 0,
      votes: 5,
      isForUpperclassmen: true
    },
    {
      id: 4,
      author: "Katie S.",
      role: "Student",
      title: "Are structs heavily tested?",
      text: "We just learned structs yesterday, I'm worried they'll be a massive part of the quiz on friday.",
      time: "4 hours ago",
      tags: ['structs', 'quiz'],
      replies: 2,
      votes: 11,
      isForUpperclassmen: true
    }
  ];

  useEffect(() => {
    setQuestions([])
    let unsub = null
    try {
      unsub = subscribeToQuestions(classId, (items) => setQuestions(items))
    } catch (e) {
      console.warn('subscribeToQuestions failed:', e.message)
    }
    return () => { try { unsub?.() } catch (_) {} }
  }, [classId])

  // subscribe to replies authored by current user so we can filter "Questions I Answered"
  useEffect(() => {
    let unsub = null
    try {
      unsub = subscribeRepliesByUser(user?.uid, (ids) => setAnsweredQuestionIds(ids))
    } catch (e) {
      console.warn('subscribeRepliesByUser failed:', e.message)
    }
    return () => { try { unsub?.() } catch (_) {} }
  }, [user?.uid])

  let displayedQuestions = isMentorView ? questions.filter(q => q.isForUpperclassmen) : questions
  if (activeFilter === 'Questions I Answered') {
    displayedQuestions = displayedQuestions.filter(q => answeredQuestionIds.includes(q.id))
  }

  return (
    <div className="relative flex-1 overflow-hidden p-6">
      <div ref={scrollRef} className="h-full overflow-y-auto pr-2 space-y-4">
        <div className="bg-surface rounded-card border border-line p-4 flex items-center justify-between">
          <div>
            <h2 className="text-primary font-bold text-lg">
              {isMentorView
                ? `Questions for Upperclassmen${activeClass ? ` in ${activeClass.code}` : ''}`
                : activeClass ? `${activeClass.code} — ${activeClass.title}` : 'Q&A'}
            </h2>
            <p className="text-label text-sub mt-0.5">
              <span className="text-brand font-medium">{isMentorView ? '2 Answered' : '4 Answered'}</span>
              <span className="mx-1 text-muted">|</span>
              <span>1 Unanswered</span>
            </p>
          </div>
          {!isMentorView && (
            <button
              onClick={openModal}
              className="bg-brand hover:bg-brand-hover text-white text-label font-medium px-4 py-2 rounded-btn transition-colors"
            >
              + Ask a Question
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Search questions by topic, keyword, or author..."
          className="w-full bg-surface border border-line rounded-btn px-4 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-brand"
        />

        <div className="flex gap-2">
          <button 
            onClick={() => setActiveFilter('All')} 
            className={`text-label px-3 py-1.5 rounded-btn transition-colors border ${activeFilter === 'All' ? 'bg-brand text-white border-brand' : 'bg-surface border-line text-sub hover:border-brand hover:text-brand'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveFilter('Questions I Answered')} 
            className={`text-label px-3 py-1.5 rounded-btn transition-colors border ${activeFilter === 'Questions I Answered' ? 'bg-brand text-white border-brand' : 'bg-surface border-line text-sub hover:border-brand hover:text-brand'}`}
          >
            Questions I Answered
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(isMentorView ? ['exam_prep', 'general', 'structs', 'quiz'] : ['loops', 'conditionals', 'functions', 'arrays', 'objects', 'recursion']).map((tag) => (
            <button 
              key={tag} 
              onClick={() => setActiveTopic(activeTopic === tag ? null : tag)} 
              className="transition-transform active:scale-95"
            >
              <Tag label={tag} isActive={activeTopic === tag} />
            </button>
          ))}
        </div>

        {displayedQuestions.map((q) => (
          <Question
            key={q.id}
            qdoc={q}
            classId={classId}
            isMentorView={isMentorView}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute right-4 top-1/2 flex flex-col gap-2 -translate-y-1/2">
        <button
          onClick={scrollUp}
          aria-label="Scroll up"
          className="pointer-events-auto rounded-full bg-surface border border-line p-3 text-primary shadow-sm hover:bg-brand hover:text-white transition-colors"
        >
          ▲
        </button>
        <button
          onClick={scrollDown}
          aria-label="Scroll down"
          className="pointer-events-auto rounded-full bg-surface border border-line p-3 text-primary shadow-sm hover:bg-brand hover:text-white transition-colors"
        >
          ▼
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-card bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Ask a Question</h3>
              <button
                onClick={closeModal}
                className="text-muted hover:text-primary"
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitQuestion} className="space-y-4">
              <label className="block text-sm font-medium text-sub">
                Title
                <input
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  className="mt-2 w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
                  placeholder="Enter your question title"
                  required
                />
              </label>
              <label className="block text-sm font-medium text-sub">
                Details
                <textarea
                  value={questionBody}
                  onChange={(e) => setQuestionBody(e.target.value)}
                  className="mt-2 w-full rounded-btn border border-line bg-surface px-3 py-2 text-sm text-primary focus:border-brand focus:outline-none"
                  placeholder="Add more context or details..."
                  rows={5}
                  required
                />
              </label>
              
              <label className="flex items-center gap-2 mt-2 cursor-pointer bg-brand-light p-3 rounded-lg border border-brand/20">
                <input 
                  type="checkbox" 
                  checked={askUpperclassmen}
                  onChange={(e) => setAskUpperclassmen(e.target.checked)}
                  className="accent-brand w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-brand">Direct this question to Upperclassmen / Alumni</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-btn border border-line px-4 py-2 text-sm text-sub hover:border-brand hover:text-brand"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-btn bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QAndA;
