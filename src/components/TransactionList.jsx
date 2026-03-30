import React, { useState, useMemo } from 'react'
import {
  ArrowUpCircle, ArrowDownCircle, TrendingUp,
  Edit, Trash2, Search, Filter, X
} from 'lucide-react'
import { fmtBRL, fmtDate, CATEGORIES } from '../lib/utils'

const TYPE_ICONS = {
  income:     <ArrowUpCircle size={18} className="text-emerald-500" />,
  expense:    <ArrowDownCircle size={18} className="text-rose-500" />,
  investment: <TrendingUp size={18} className="text-blue-500" />,
}
const TYPE_BG = {
  income:     'bg-emerald-50 dark:bg-emerald-900/20',
  expense:    'bg-rose-50 dark:bg-rose-900/20',
  investment: 'bg-blue-50 dark:bg-blue-900/20',
}
const TYPE_TEXT = {
  income:     'text-emerald-600',
  expense:    'text-rose-600',
  investment: 'text-blue-600',
}

export default function TransactionList({ transactions, onEdit, onDelete }) {
  const [search,    setSearch]    = useState('')
  const [filterType,setFilterType]= useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [showFilter,setShowFilter]= useState(false)

  const allCategories = useMemo(() => {
    const s = new Set(transactions.map(t => t.category).filter(Boolean))
    return ['all', ...Array.from(s).sort()]
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category?.toLowerCase().includes(search.toLowerCase())
      const matchType = filterType === 'all' || t.type === filterType
      const matchCat  = filterCat  === 'all' || t.category === filterCat
      return matchSearch && matchType && matchCat
    })
  }, [transactions, search, filterType, filterCat])

  const hasFilters = search || filterType !== 'all' || filterCat !== 'all'

  return (
    <div className="flex flex-col h-full">
      {/* Barra de busca e filtros */}
      <div className="p-4 space-y-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar transações..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-sm border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }} />
          </div>
          <button onClick={() => setShowFilter(!showFilter)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-1.5 border transition-all ${showFilter ? 'bg-indigo-600 text-white border-indigo-600' : 'border'}`}
            style={showFilter ? {} : { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
            <Filter size={14} /> Filtrar
          </button>
        </div>

        {/* Painel de filtros */}
        {showFilter && (
          <div className="flex flex-wrap gap-2 pt-1">
            {/* Tipo */}
            {['all','income','expense','investment'].map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${filterType === t ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}
                style={filterType !== t ? { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text2)' } : {}}>
                {t === 'all' ? 'Todos' : t === 'income' ? 'Entradas' : t === 'expense' ? 'Gastos' : 'Investimentos'}
              </button>
            ))}
            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            {/* Categoria */}
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map(c => (
                <button key={c} onClick={() => setFilterCat(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${filterCat === c ? 'bg-indigo-600 text-white border-indigo-600' : ''}`}
                  style={filterCat !== c ? { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text2)' } : {}}>
                  {c === 'all' ? 'Todas' : c}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasFilters && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text3)' }}>
            <span>{filtered.length} resultado(s)</span>
            <button onClick={() => { setSearch(''); setFilterType('all'); setFilterCat('all') }}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-500 font-bold">
              <X size={12} /> Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--surface2)' }}>
              <Search size={24} style={{ color: 'var(--text3)' }} />
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--text2)' }}>
              {hasFilters ? 'Nenhum resultado encontrado' : 'Nenhum lançamento neste mês'}
            </p>
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id}
              className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:border group transition-all"
              style={{ ':hover': { borderColor: 'var(--border)' } }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

              {/* Ícone */}
              <div className={`p-2.5 rounded-2xl shrink-0 ${TYPE_BG[t.type]}`}>
                {TYPE_ICONS[t.type]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{t.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase"
                    style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                    {t.category}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text3)' }}>
                    {fmtDate(t.date)}
                  </span>
                </div>
              </div>

              {/* Valor + ações */}
              <div className="flex items-center gap-3 shrink-0">
                <p className={`font-black text-sm font-money ${TYPE_TEXT[t.type]}`}>
                  {t.type === 'income' ? '+' : '-'}{fmtBRL(t.amount)}
                </p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(t)}
                    className="p-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-400">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => onDelete(t.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
