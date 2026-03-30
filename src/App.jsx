import React, { useState, useEffect, useMemo } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './lib/firebase'
import { useDarkMode }      from './hooks/useDarkMode'
import { useTransactions }  from './hooks/useTransactions'
import { useGoals }         from './hooks/useGoals'
import { monthNames, generateInitialTransactions, exportPDF, fmtBRL } from './lib/utils'

import AuthScreen      from './components/AuthScreen'
import Header          from './components/Header'
import SummaryCard     from './components/SummaryCard'
import TransactionForm from './components/TransactionForm'
import TransactionList from './components/TransactionList'
import GoalsPanel      from './components/GoalsPanel'
import ChartModal      from './components/ChartModal'
import AiModal         from './components/AiModal'

import {
  Wallet, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, PieChart, Sparkles, FileDown,
  BarChart3, Loader2
} from 'lucide-react'

export default function App() {
  const { isDark, toggle: toggleDark } = useDarkMode()

  // Auth
  const [user,        setUser]        = useState(undefined) // undefined = carregando
  const [authReady,   setAuthReady]   = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
    })
    return unsub
  }, [])

  // Dados
  const { transactions, loading: txLoading, addTransaction, addBatch, updateTransaction, deleteTransaction, isSetupDone, markSetupDone } = useTransactions(user?.uid)
  const { goals, addGoal, updateGoal, deleteGoal } = useGoals(user?.uid)

  // Setup inicial - flag no Firestore, funciona em qualquer maquina
  useEffect(() => {
    if (!user || txLoading) return
    if (isSetupDone === null) return
    if (isSetupDone === true) return
    const initial = generateInitialTransactions()
    addBatch(initial).then(() => markSetupDone())
  }, [user, txLoading, isSetupDone])

  // Navegação de mês
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year,  setYear]  = useState(today.getFullYear())

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1) } else setMonth(m => m-1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1) } else setMonth(m => m+1) }

  // Edição
  const [editing, setEditing] = useState(null)

  // Modais
  const [showChart, setShowChart] = useState(false)
  const [showAi,    setShowAi]    = useState(false)

  // Transações filtradas pelo mês
  const filtered = useMemo(() => {
    return transactions
      .filter(t => {
        if (!t.date) return false
        const [y, m] = t.date.split('-')
        return +y === year && +m === month + 1
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, month, year])

  // Totais
  const { income, expense, invest } = useMemo(() => filtered.reduce((acc, t) => {
    if (t.type === 'income')     acc.income  += t.amount
    if (t.type === 'expense')    acc.expense += t.amount
    if (t.type === 'investment') acc.invest  += t.amount
    return acc
  }, { income: 0, expense: 0, invest: 0 }), [filtered])

  const balance = income - expense - invest

  // Investimento acumulado com rendimento de 0,8%/mês
  const accumulated = useMemo(() => {
    let total = 0
    const viewDate = new Date(year, month, 1)
    transactions.forEach(t => {
      if (t.type === 'investment' && t.date) {
        const [y, m] = t.date.split('-')
        const txDate = new Date(+y, +m - 1, 1)
        if (txDate <= viewDate) {
          const months = (year - txDate.getFullYear()) * 12 + (month - txDate.getMonth())
          total += t.amount * Math.pow(1.008, months)
        }
      }
    })
    return total
  }, [transactions, month, year])

  // Handlers
  const handleAdd = (tx) => addTransaction(tx)

  const handleUpdate = (id, data) => {
    updateTransaction(id, data)
    setEditing(null)
  }

  const handleDelete = (id) => {
    if (window.confirm('Apagar esta transação?')) deleteTransaction(id)
  }

  const handleEdit = (t) => setEditing(t)

  const handleExportPDF = () => {
    exportPDF({ transactions: filtered, month, year, income, expense, invest, balance })
  }

  // Tela de carregamento inicial
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 size={32} className="animate-spin-slow text-indigo-500" />
      </div>
    )
  }

  // Tela de login
  if (!user) return <AuthScreen />

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      <Header
        month={month} year={year}
        onPrev={prevMonth} onNext={nextMonth}
        isDark={isDark} onToggleDark={toggleDark}
        onLogout={() => signOut(auth)}
        userEmail={user.email}
      />

      <div className="max-w-6xl mx-auto px-4 -mt-14 pb-10">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger">
          <SummaryCard
            title="Saldo do Mês"
            value={balance}
            icon={<Wallet size={44} />}
            colorClass={balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}
          />
          <SummaryCard
            title="Entradas"
            value={income}
            icon={<ArrowUpCircle size={44} />}
            colorClass="text-emerald-600"
            dotColor="bg-emerald-500"
          />
          <SummaryCard
            title="Gastos"
            value={expense}
            icon={<ArrowDownCircle size={44} />}
            colorClass="text-rose-600"
            dotColor="bg-rose-500"
          />
          <SummaryCard
            title="Investido"
            value={invest}
            icon={<TrendingUp size={44} />}
            colorClass="text-blue-600"
            dotColor="bg-blue-500"
            sub={accumulated}
            subLabel="acumulado (0,8%/mês)"
          />
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna esquerda: Formulário + Metas */}
          <div className="space-y-4">
            <TransactionForm
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onCancel={() => setEditing(null)}
              editing={editing}
            />
            <GoalsPanel
              goals={goals}
              onAdd={addGoal}
              onUpdate={updateGoal}
              onDelete={deleteGoal}
            />
          </div>

          {/* Coluna direita: Extrato */}
          <div className="lg:col-span-2 rounded-3xl border flex flex-col overflow-hidden"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', minHeight: '600px' }}>

            {/* Header do extrato */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b shrink-0"
              style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-black text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <BarChart3 size={18} className="text-indigo-500" />
                Extrato — {monthNames[month]} {year}
              </h2>

              <div className="flex flex-wrap gap-2">
                {expense > 0 && (
                  <button onClick={() => setShowChart(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    style={{ borderColor: 'var(--border)', color: 'var(--text2)', background: 'var(--surface2)' }}>
                    <PieChart size={13} /> Gráfico
                  </button>
                )}
                <button onClick={() => setShowAi(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  <Sparkles size={13} /> Análise IA
                </button>
                <button onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800"
                  style={{ background: 'var(--surface2)' }}>
                  <FileDown size={13} /> PDF
                </button>
              </div>
            </div>

            {/* Loader ou lista */}
            {txLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin-slow text-indigo-400" />
              </div>
            ) : (
              <TransactionList
                transactions={filtered}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      {showChart && (
        <ChartModal
          transactions={filtered}
          onClose={() => setShowChart(false)}
        />
      )}
      {showAi && (
        <AiModal
          transactions={filtered}
          income={income} expense={expense} invest={invest} balance={balance}
          month={month} year={year}
          onClose={() => setShowAi(false)}
        />
      )}
    </div>
  )
}
