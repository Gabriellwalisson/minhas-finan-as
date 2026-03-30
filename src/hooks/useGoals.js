import { useState, useEffect, useCallback } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useGoals(userId) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const q = query(
      collection(db, 'users', userId, 'goals'),
      orderBy('createdAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return () => unsub()
  }, [userId])

  const addGoal = useCallback(async (goal) => {
    if (!userId) return
    await addDoc(collection(db, 'users', userId, 'goals'), {
      ...goal,
      saved: goal.saved || 0,
      createdAt: serverTimestamp(),
    })
  }, [userId])

  const updateGoal = useCallback(async (id, data) => {
    if (!userId) return
    await updateDoc(doc(db, 'users', userId, 'goals', id), data)
  }, [userId])

  const deleteGoal = useCallback(async (id) => {
    if (!userId) return
    await deleteDoc(doc(db, 'users', userId, 'goals', id))
  }, [userId])

  return { goals, loading, addGoal, updateGoal, deleteGoal }
}
