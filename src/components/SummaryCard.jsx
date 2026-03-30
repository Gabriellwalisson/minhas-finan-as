import React from 'react'
import { fmtBRL } from '../lib/utils'

export default function SummaryCard({ title, value, icon, colorClass, dotColor, sub, subLabel }) {
  return (
    <div className="rounded-3xl p-6 flex flex-col gap-3 border animate-fade-in-up"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        {dotColor && <div className={`w-2 h-2 rounded-full ${dotColor}`} />}
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <h3 className={`text-2xl font-black font-money leading-none ${colorClass}`}>
          {fmtBRL(value)}
        </h3>
        <div className="opacity-20">{icon}</div>
      </div>
      {sub !== undefined && (
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            <span className="font-bold" style={{ color: 'var(--blue)' }}>{fmtBRL(sub)}</span>
            {subLabel && <span className="ml-1">{subLabel}</span>}
          </p>
        </div>
      )}
    </div>
  )
}
