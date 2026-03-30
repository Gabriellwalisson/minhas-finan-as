import React, { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Wallet, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function AuthScreen() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const errorMap = {
    'auth/user-not-found': 'E-mail não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/email-already-in-use': 'E-mail já cadastrado.',
    'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres).',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await sendPasswordResetEmail(auth, email)
        setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
      }
    } catch (err) {
      setError(errorMap[err.code] || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0f1117 100%)' }}>

      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-4">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Minhas Finanças</h1>
          <p className="text-white/60 mt-1 text-sm">Controle financeiro pessoal</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)' }}>

          <h2 className="text-white font-bold text-xl mb-6">
            {mode === 'login' ? 'Entrar na conta' : mode === 'register' ? 'Criar conta' : 'Recuperar senha'}
          </h2>

          {error && (
            <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 text-rose-200 rounded-2xl p-3 mb-4 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-2xl p-3 mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-white placeholder-white/30 border border-white/10 focus:border-white/30 text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="text-white/60 text-xs font-bold uppercase tracking-wider block mb-1.5">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPass ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3.5 rounded-2xl text-white placeholder-white/30 border border-white/10 focus:border-white/30 text-sm"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              {loading ? <Loader2 size={18} className="animate-spin-slow" /> : null}
              {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Enviar e-mail'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                  className="text-white/50 hover:text-white/80 text-xs block w-full">
                  Esqueci minha senha
                </button>
                <button onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                  className="text-white/70 hover:text-white text-sm font-medium">
                  Não tem conta? <span className="text-indigo-300 font-bold">Criar agora</span>
                </button>
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="text-white/70 hover:text-white text-sm font-medium">
                ← Voltar para o login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
