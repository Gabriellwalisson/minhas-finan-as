import React, { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { fmtBRL, monthNames } from '../lib/utils'

export default function AiModal({ transactions, income, expense, invest, balance, month, year, onClose }) {
  const [loading, setLoading]   = useState(true)
  const [insight, setInsight]   = useState('')
  const [error,   setError]     = useState('')
  const abortRef = useRef(null)

  const analyze = async () => {
    setLoading(true)
    setInsight('')
    setError('')

    const txSummary = transactions
      .slice(0, 40)
      .map(t => `${t.date} | ${t.description} | ${t.category} | ${t.type} | ${fmtBRL(t.amount)}`)
      .join('\n')

    const prompt = `Você é um consultor financeiro pessoal simpático e direto. Analise as finanças de ${monthNames[month]}/${year} abaixo e forneça conselhos práticos em português do Brasil.

RESUMO:
- Entradas: ${fmtBRL(income)}
- Gastos: ${fmtBRL(expense)}
- Investimentos: ${fmtBRL(invest)}
- Saldo final: ${fmtBRL(balance)}

TRANSAÇÕES:
${txSummary || 'Nenhuma transação registrada.'}

Por favor:
1. Avalie o mês em 2-3 frases diretas
2. Destaque os maiores gastos e se estão adequados
3. Dê 2-3 dicas práticas e personalizadas para melhorar
4. Termine com uma frase motivacional

Use marcadores simples (•) para as dicas. Seja encorajador mas honesto. Máximo 300 palavras.`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: abortRef.current?.signal
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      const text = data.content?.[0]?.text ?? 'Não foi possível gerar análise.'
      setInsight(text)
    } catch (err) {
      if (err.name === 'AbortError') return
      setError('Não foi possível conectar à IA. Verifique sua conexão e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    analyze()
    return () => ctrl.abort()
  }, [])

  // Renderiza texto formatado com bullets e negrito
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2" />

      // Substitui **texto** por <strong>
      const parts = line.split(/(\*\*.*?\*\*)/).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={j} className="font-black" style={{ color: 'var(--text)' }}>{part.slice(2,-2)}</strong>
        return part
      })

      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              {parts}
            </p>
          </div>
        )
      }

      return (
        <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
          {parts}
        </p>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-xl rounded-3xl border overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[85vh]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0"
          style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm" style={{ color: 'var(--text)' }}>Conselheiro Financeiro IA</h3>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>Claude · {monthNames[month]} {year}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <button onClick={analyze}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-400 transition-all"
                title="Analisar novamente">
                <RefreshCw size={14} />
              </button>
            )}
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Resumo rápido */}
        <div className="grid grid-cols-4 gap-0 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: 'Entradas', value: income, color: '#10b981' },
            { label: 'Gastos',   value: expense, color: '#f43f5e' },
            { label: 'Investido',value: invest,  color: '#3b82f6' },
            { label: 'Saldo',    value: balance, color: balance >= 0 ? '#10b981' : '#f43f5e' },
          ].map((item, i) => (
            <div key={i} className="p-3 text-center border-r last:border-r-0" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>{item.label}</p>
              <p className="text-xs font-black font-mono" style={{ color: item.color }}>
                {fmtBRL(item.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <Loader2 size={24} className="text-white animate-spin-slow" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Analisando suas finanças...</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>O Claude está a processar seus dados</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm font-bold text-rose-500 mb-3">{error}</p>
              <button onClick={analyze}
                className="px-4 py-2 rounded-full text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {renderText(insight)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
