import { db } from '../firebase'
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  collectionGroup,
  doc,
  setDoc,
  updateDoc,
  increment,
  getDoc,
  runTransaction,
  where,
} from 'firebase/firestore'

// -- Chat/messages (class-scoped) --
// All chat data lives under classes/{classId}/chat so each class has its own isolated feed.

function chatCol(classId) {
  return collection(db, `classes/${classId}/chat`)
}
function repliesCol(classId, messageId) {
  return collection(db, `classes/${classId}/chat/${messageId}/replies`)
}

export function subscribeToClassMessages(classId, onUpdate) {
  if (!classId) { onUpdate([]); return () => {} }
  const unsubMessages = onSnapshot(
    query(chatCol(classId), orderBy('createdAt', 'asc')),
    (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }))
      onUpdate(msgs)
    },
    (err) => { console.warn(`classes/${classId}/chat snapshot error:`, err.code, err.message) }
  )
  return unsubMessages
}

/** Subscribe to replies for a single message within a class chat */
export function subscribeToMessageReplies(classId, messageId, onUpdate) {
  if (!classId || !messageId) { onUpdate([]); return () => {} }
  const q = query(repliesCol(classId, messageId), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }))
      onUpdate(items)
    },
    (err) => { console.warn(`classes/${classId}/chat/${messageId}/replies error:`, err.code, err.message) }
  )
}

export async function sendClassMessage(classId, { text, anonymous, authorName, authorId, avatarBg, initials, badge }) {
  return addDoc(chatCol(classId), {
    text,
    anonymous: !!anonymous,
    authorName: authorName || null,
    authorId: authorId || null,
    avatarBg: avatarBg || null,
    initials: initials || null,
    badge: badge || null,
    createdAt: serverTimestamp(),
  })
}

export async function sendClassReply(classId, parentId, { text, anonymous, authorName, authorId, avatarBg, initials, badge }) {
  return addDoc(repliesCol(classId, parentId), {
    text,
    anonymous: !!anonymous,
    authorName: authorName || null,
    authorId: authorId || null,
    avatarBg: avatarBg || null,
    initials: initials || null,
    badge: badge || null,
    createdAt: serverTimestamp(),
  })
}

// -- Q&A (class-scoped) --
function qaCol(classId) {
  return collection(db, `classes/${classId}/qa`)
}

export function subscribeToQuestions(classId, onUpdate) {
  if (!classId) { onUpdate([]); return () => {} }
  const q = query(qaCol(classId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }))
      onUpdate(items)
    },
    (err) => { console.warn(`classes/${classId}/qa snapshot error:`, err.code, err.message) }
  )
}

export async function postQuestion(classId, { title, text, authorName, authorId, isForUpperclassmen = false, tags = [] }) {
  return addDoc(qaCol(classId), {
    title,
    text,
    authorName: authorName || null,
    authorId: authorId || null,
    isForUpperclassmen: !!isForUpperclassmen,
    tags: tags || [],
    votes: 0,
    replyCount: 0,
    createdAt: serverTimestamp(),
  })
}

export async function addQuestionReply(classId, questionId, { text, authorName, authorId, anonymous }) {
  const repliesCol = collection(db, `classes/${classId}/qa/${questionId}/replies`)
  const r = await addDoc(repliesCol, {
    text,
    authorName: authorName || null,
    authorId: authorId || null,
    anonymous: !!anonymous,
    createdAt: serverTimestamp(),
  })
  const qDoc = doc(db, `classes/${classId}/qa`, questionId)
  await updateDoc(qDoc, { replyCount: increment(1) })
  return r
}

export function getQuestionReplies(classId, questionId, onUpdate) {
  const repliesQuery = query(collection(db, `classes/${classId}/qa/${questionId}/replies`), orderBy('createdAt', 'asc'))
  return onSnapshot(
    repliesQuery,
    (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...(d.data()||{}) }))
      onUpdate(items)
    },
    (err) => { console.warn(`classes/${classId}/qa/${questionId}/replies snapshot error:`, err.code, err.message) }
  )
}

export function subscribeRepliesByUser(userId, onUpdate) {
  if (!userId) {
    onUpdate([])
    return () => {}
  }
  const q = query(collectionGroup(db, 'replies'), where('authorId', '==', userId))
  return onSnapshot(
    q,
    (snap) => {
      const questionIds = new Set()
      snap.docs.forEach((d) => {
        const parent = d.ref.parent.parent
        if (parent) questionIds.add(parent.id)
      })
      onUpdate(Array.from(questionIds))
    },
    (err) => { console.warn('subscribeRepliesByUser snapshot error:', err.code, err.message) }
  )
}

/**
 * Atomically apply a user's vote to a question and enforce one-vote-per-user.
 */
export async function voteQuestion(classId, questionId, userId, voteValue) {
  if (!userId) throw new Error('userId required to vote')
  const qRef = doc(db, `classes/${classId}/qa`, questionId)
  return runTransaction(db, async (tx) => {
    const qSnap = await tx.get(qRef)
    if (!qSnap.exists()) throw new Error('question not found')
    const data = qSnap.data() || {}
    const voters = data.voters || {}
    const current = voters[userId] || 0

    let delta = 0
    if (voteValue === current) {
      delete voters[userId]
      delta = -current
    } else {
      voters[userId] = voteValue
      delta = voteValue - current
    }

    tx.update(qRef, { voters, votes: (data.votes || 0) + delta })
    return { votes: (data.votes || 0) + delta, voters }
  })
}
