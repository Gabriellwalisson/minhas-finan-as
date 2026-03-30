import { useState, useEffect, useCallback } from "react"
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch,
  getDoc, setDoc
} from "firebase/firestore"
import { db } from "../lib/firebase"

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  // null = ainda verificando | false = nao feito | true = ja feito
  const [isSetupDone,  setIsSetupDone]  = useState(null)

  // Escuta as transacoes em tempo real
  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const q = query(
      collection(db, "users", userId, "transactions"),
      orderBy("date", "desc")
    )

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        type: d.data().type === "invest" ? "investment" : d.data().type,
      }))
      setTransactions(data)
      setLoading(false)
    }, (err) => {
      console.error("Firestore error:", err)
      setLoading(false)
    })

    return () => unsub()
  }, [userId])

  // Verifica a flag de setup UMA VEZ no Firestore (nao no localStorage)
  useEffect(() => {
    if (!userId) return

    const flagRef = doc(db, "users", userId, "meta", "setup")
    getDoc(flagRef).then(snap => {
      setIsSetupDone(snap.exists() && snap.data()?.done === true)
    }).catch(() => {
      setIsSetupDone(false)
    })
  }, [userId])

  // Grava a flag de setup no Firestore
  const markSetupDone = useCallback(async () => {
    if (!userId) return
    const flagRef = doc(db, "users", userId, "meta", "setup")
    await setDoc(flagRef, { done: true, createdAt: serverTimestamp() })
    setIsSetupDone(true)
  }, [userId])

  const addTransaction = useCallback(async (tx) => {
    if (!userId) return
    await addDoc(collection(db, "users", userId, "transactions"), {
      ...tx,
      createdAt: serverTimestamp(),
    })
  }, [userId])

  const addBatch = useCallback(async (txList) => {
    if (!userId || !txList?.length) return
    const CHUNK = 450
    for (let i = 0; i < txList.length; i += CHUNK) {
      const batch = writeBatch(db)
      txList.slice(i, i + CHUNK).forEach(tx => {
        const ref = doc(collection(db, "users", userId, "transactions"))
        batch.set(ref, { ...tx, createdAt: serverTimestamp() })
      })
      await batch.commit()
    }
  }, [userId])

  const updateTransaction = useCallback(async (id, data) => {
    if (!userId) return
    const ref = doc(db, "users", userId, "transactions", id)
    await updateDoc(ref, data)
  }, [userId])

  const deleteTransaction = useCallback(async (id) => {
    if (!userId) return
    await deleteDoc(doc(db, "users", userId, "transactions", id))
  }, [userId])

  return {
    transactions,
    loading,
    isSetupDone,
    markSetupDone,
    addTransaction,
    addBatch,
    updateTransaction,
    deleteTransaction,
  }
}
