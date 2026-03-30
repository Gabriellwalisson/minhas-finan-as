import React, { useState, useEffect } from 'react'
import { Plus, Edit, X, Repeat } from 'lucide-react'
import { CATEGORIES } from '../lib/utils'

const TYPES = [
  { key: 'income',     label: 'Entrada'    },
  { key: 'expense',    label: 'Gasto'      },
  { key: 'investment', label: 'Investir'   },
]

export default function TransactionForm({ onAdd, onUpdate, onCancel, editing }) {
  const [type,       setType]       = useState('expense')
  const [description,setDescription]= useState('')
  const [amount,     setAmount]     = useState('')
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0])
  const [category,   setCategory]   = useState('')
  const [installment,setInstallment]= useState(false)
  const [installCount,setInstallCount]= useState(2)

  // Preenche o formulário ao editar
  useEffect(() => {
    if (editing) {
      setType(editing.type)
      setDescription(editing.description)
      setAmount(String(editing.amount))
      setDate(editing.date)
      setCategory(editing.category)
      setInstallment(false)
    } else {
      reset()
    }
  }, [editing])

  // Reseta categoria ao trocar tipo
  useEffect(() => {
    if (!editing) setCategory(CATEGORIES[type]?.[0] ?? '')
  }, [type])

  const reset = () => {
    setType('expense')
    setDescription('')
    setAmount('')
    setDate(new Date().toISOString().split('T')[0])
    setCategory(CATEGORIES['expense'][0])
    setInstallment(false)
    setInstallCount(2)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!description || isNaN(num) || num <= 0) return

    if (editing) {
      onUpdate(editing.id, { description, amount: num, type, date, category })
      return
    }

    if (type === 'expense' && installment && installCount > 1) {
      const perInstall = num / installCount
      const [y, m, d] = date.split('-')
      const txns = []
      for (let i = 0; i < installCount; i++) {
        const dt = new Date(+y, +m - 1 + i, +d)
        const fd = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
        txns.push({ description: `${description} (${i+1}/${installCount})`, amount: perInstall, type, date: fd, category })
      }
      txns.forEach(t => onAdd(t))
    } else {
      onAdd({ description, amount: num, type, date, category })
    }

    reset()
  }

  const isEditing = !!editing

  return (
    <div className={`rounded-3xl p-6 border transition-all ${isEditing ? 'ring-2 ring-amber-400/40' : ''}`}
      style={{ background: 'var(--surface)', borderColor: isEditing ? '#f59e0b' : 'var(--border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-black text-lg flex items-center gap-2" style={{ color: 'var(--text)' }}>
          {isEditing
            ? <><Edit size={18} className="text-amber-500" /> Editar</>
            : <><Plus size={18} className="text-indigo-500" /> Novo Lançamento</>}
        </h2>
        {isEditing && (
          <button onClick={onCancel} className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400">
            <X size={14} /> Cancelar
          </button>
        )}
      </div>

      {/* Tipo */}
      <div className="flex rounded-2xl p-1 mb-5 gap-1" style={{ background: 'var(--surface2)' }}>
        {TYPES.map(t => (
          <button key={t.key} type="button" onClick={() => setType(t.key)}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-wider ${type === t.key ? 'shadow-sm' : 'opacity-50 hover:opacity-75'}`}
            style={type === t.key ? { background: 'var(--surface)', color: 'var(--text)' } : { color: 'var(--text2)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text3)' }}>Valor (R$)</label>
            <input type="number" step="0.01" min="0.01" required value={amount}
              onChange={e => setAmount(e.target.value)} placeholder="0,00"
              className="w-full p-3 rounded-2xl text-sm font-bold border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text3)' }}>Data</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)}
              className="w-full p-3 rounded-2xl text-sm border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text3)' }}>Descrição</label>
          <input required value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Ex: Supermercado, Netflix..."
            className="w-full p-3 rounded-2xl text-sm border"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text3)' }}>Categoria</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full p-3 rounded-2xl text-sm border"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            {CATEGORIES[type]?.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Parcelamento */}
        {type === 'expense' && !isEditing && (
          <div className="rounded-2xl p-3 border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={installment} onChange={e => setInstallment(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded" />
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text2)' }}>
                <Repeat size={13} /> Parcelado em vários meses
              </span>
            </label>
            {installment && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs font-bold" style={{ color: 'var(--text3)' }}>Parcelas:</span>
                <input type="number" min={2} max={72} value={installCount}
                  onChange={e => setInstallCount(parseInt(e.target.value) || 2)}
                  className="w-16 p-2 rounded-xl text-center font-bold text-sm border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
                {amount && !isNaN(parseFloat(amount)) && (
                  <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                    = R$ {(parseFloat(amount) / installCount).toFixed(2)}/mês
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <button type="submit"
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mt-1 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ background: isEditing ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          {isEditing ? <Edit size={16} /> : <Plus size={16} />}
          {isEditing ? 'Guardar Alterações' : 'Adicionar'}
        </button>
      </form>
    </div>
  )
}
