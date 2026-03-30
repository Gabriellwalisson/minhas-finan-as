import React, { useState } from 'react'
import { Target, Plus, Trash2, Edit, Check, X, TrendingUp } from 'lucide-react'
import { fmtBRL } from '../lib/utils'

const GOAL_COLORS = [
  '#4f46e5', '#7c3aed', '#10b981', '#f59e0b',
  '#3b82f6', '#ef4444', '#ec4899', '#14b8a6'
]

export default function GoalsPanel({ goals, onAdd, onUpdate, onDelete }) {
  const [adding,    setAdding]    = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form,      setForm]      = useState({ name: '', target: '', saved: '', color: GOAL_COLORS[0], emoji: '🎯' })

  const EMOJIS = ['🎯','🏠','✈️','🚗','📱','💍','🏋️','📚','💊','🌍','🛍️','🎓']

  const resetForm = () => {
    setForm({ name: '', target: '', saved: '', color: GOAL_COLORS[0], emoji: '🎯' })
    setAdding(false)
    setEditingId(null)
  }

  const handleSave = () => {
    const target = parseFloat(form.target)
    const saved  = parseFloat(form.saved) || 0
    if (!form.name || isNaN(target) || target <= 0) return

    if (editingId) {
      onUpdate(editingId, { name: form.name, target, saved, color: form.color, emoji: form.emoji })
    } else {
      onAdd({ name: form.name, target, saved, color: form.color, emoji: form.emoji })
    }
    resetForm()
  }

  const startEdit = (g) => {
    setForm({ name: g.name, target: String(g.target), saved: String(g.saved), color: g.color, emoji: g.emoji || '🎯' })
    setEditingId(g.id)
    setAdding(true)
  }

  const handleDeposit = (g) => {
    const v = parseFloat(prompt(`Adicionar valor à meta "${g.name}"\nAtual: ${fmtBRL(g.saved)}`, ''))
    if (isNaN(v) || v <= 0) return
    onUpdate(g.id, { saved: Math.min(g.target, g.saved + v) })
  }

  return (
    <div className="rounded-3xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="font-black text-base flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Target size={18} className="text-indigo-500" /> Metas de Economia
        </h2>
        <button onClick={() => { setAdding(!adding); setEditingId(null); setForm({ name:'', target:'', saved:'', color: GOAL_COLORS[0], emoji:'🎯' }) }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <Plus size={13} /> Nova Meta
        </button>
      </div>

      {/* Formulário de adição/edição */}
      {adding && (
        <div className="p-5 border-b space-y-3" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map(em => (
              <button key={em} onClick={() => setForm(f => ({...f, emoji: em}))}
                className={`text-lg p-1 rounded-lg transition-all ${form.emoji === em ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-60 hover:opacity-100'}`}>
                {em}
              </button>
            ))}
          </div>

          <input placeholder="Nome da meta (ex: Viagem à Europa)"
            value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
            className="w-full p-3 rounded-2xl text-sm border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text3)' }}>Valor Total (R$)</label>
              <input type="number" placeholder="10000" value={form.target}
                onChange={e => setForm(f => ({...f, target: e.target.value}))}
                className="w-full p-3 rounded-2xl text-sm border font-mono"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text3)' }}>Já guardado (R$)</label>
              <input type="number" placeholder="0" value={form.saved}
                onChange={e => setForm(f => ({...f, saved: e.target.value}))}
                className="w-full p-3 rounded-2xl text-sm border font-mono"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }} />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {GOAL_COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({...f, color: c}))}
                className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''}`}
                style={{ background: c }} />
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Check size={15} /> {editingId ? 'Salvar' : 'Criar Meta'}
            </button>
            <button onClick={resetForm}
              className="py-3 px-4 rounded-2xl text-sm font-bold border flex items-center gap-2"
              style={{ borderColor: 'var(--border)', color: 'var(--text2)', background: 'var(--surface)' }}>
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Lista de metas */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-medium" style={{ color: 'var(--text3)' }}>Nenhuma meta criada ainda.</p>
          </div>
        ) : goals.map(g => {
          const pct = Math.min(100, (g.saved / g.target) * 100)
          const done = pct >= 100
          return (
            <div key={g.id} className="rounded-2xl p-4 border group" style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{g.emoji || '🎯'}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{g.name}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                      {fmtBRL(g.saved)} de {fmtBRL(g.target)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!done && (
                    <button onClick={() => handleDeposit(g)}
                      className="p-1.5 rounded-xl text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Adicionar valor">
                      <TrendingUp size={14} />
                    </button>
                  )}
                  <button onClick={() => startEdit(g)} className="p-1.5 rounded-xl text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => onDelete(g.id)} className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full progress-bar transition-all"
                  style={{ width: `${pct}%`, background: done ? '#10b981' : g.color }} />
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-bold font-mono" style={{ color: done ? '#10b981' : g.color }}>
                  {pct.toFixed(1)}%
                </span>
                {done
                  ? <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check size={11} /> Concluída!</span>
                  : <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>
                      Faltam {fmtBRL(g.target - g.saved)}
                    </span>
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
