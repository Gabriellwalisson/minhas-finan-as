import React from 'react'
import { Wallet, ChevronLeft, ChevronRight, Sun, Moon, LogOut, Calendar } from 'lucide-react'
import { monthNames } from '../lib/utils'

export default function Header({ month, year, onPrev, onNext, isDark, onToggleDark, onLogout, userEmail }) {
  return (
    <div className="header-gradient w-full px-4 pt-6 pb-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/15 border border-white/20">
            <Wallet size={20} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-white font-black text-lg leading-none tracking-tight">Minhas Finanças</h1>
            <p className="text-white/50 text-xs mt-0.5 truncate max-w-[180px]">{userEmail}</p>
          </div>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-2xl px-2 py-1.5">
          <button onClick={onPrev}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white transition-all">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 px-2 min-w-[130px] justify-center">
            <Calendar size={14} className="text-white/60" />
            <span className="text-white font-bold text-sm">
              {monthNames[month]} {year}
            </span>
          </div>
          <button onClick={onNext}
            className="p-1.5 rounded-xl hover:bg-white/15 text-white transition-all">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <button onClick={onToggleDark}
            className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all">
            <LogOut size={15} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

      </div>
    </div>
  )
}
