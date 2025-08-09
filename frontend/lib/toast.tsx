"use client"
import React, { createContext, useContext, useMemo, useState } from 'react'

type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info' }

type ToastContextType = {
  push: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const ctx = useMemo<ToastContextType>(() => ({
    push: (message, type) => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, type }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
    },
  }), [])

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed inset-x-0 top-4 flex justify-center pointer-events-none z-50">
        <div className="flex flex-col gap-2 w-full max-w-md px-4">
          {toasts.map((t) => (
            <div key={t.id} className={`pointer-events-auto rounded-md px-4 py-2 border ${
              t.type === 'success' ? 'bg-green-500/10 border-green-500/40 text-green-200' :
              t.type === 'error' ? 'bg-red-500/10 border-red-500/40 text-red-200' :
              'bg-accent/10 border-border text-text'
            } shadow-card animate-fade-in`}>{t.message}</div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

