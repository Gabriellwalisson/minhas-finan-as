import React, { useMemo } from 'react'
import { X, PieChart } from 'lucide-react'
import { fmtBRL } from '../lib/utils'

const COLORS = [
  '#4f46e5','#7c3aed','#10b981','#f59e0b',
  '#3b82f6','#f43f5e','#ec4899','#14b8a6',
  '#f97316','#84cc16'
]

export default function ChartModal({ transactions, onClose }) {
  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const total = expenses.reduce((s, t) => s + t.amount, 0)
    if (total === 0) return []

    const totals = {}
    expenses.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount })

    let currentAngle = 0
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount], i) => {
        const pct = (amount / total) * 100
        const start = currentAngle
        currentAngle += pct
        return { cat, amount, pct, color: COLORS[i % COLORS.length], start, end: currentAngle }
      })
  }, [transactions])

  const gradient = data.map(d => `${d.color} ${d.start}% ${d.end}%`).join(', ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-md rounded-3xl border overflow-hidden shadow-2xl animate-fade-in-up"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-black text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <PieChart size={18} className="text-indigo-500" /> Gastos por Categoria
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {data.length === 0 ? (
            <p className="text-center py-8 font-medium" style={{ color: 'var(--text3)' }}>
              Nenhum gasto registrado neste mês.
            </p>
          ) : (
            <>
              {/* Donut chart */}
              <div className="flex justify-center mb-6">
                <div className="relative w-44 h-44">
                  <div className="w-full h-full rounded-full shadow-inner"
                    style={{ background: `conic-gradient(${gradient})` }} />
                  {/* Buraco central */}
                  <div className="absolute inset-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--surface)' }}>
                    <PieChart size={24} className="text-indigo-400 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="grid grid-cols-2 gap-2">
                {data.map((d, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl"
                    style={{ background: 'var(--surface2)' }}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase truncate" style={{ color: 'var(--text)' }}>{d.cat}</p>
                      <p className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                        {d.pct.toFixed(1)}% · {fmtBRL(d.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
