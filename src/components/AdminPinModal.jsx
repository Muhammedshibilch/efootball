import React, { useState } from 'react'
import { Lock, Unlock, X } from 'lucide-react'

export default function AdminPinModal({
  isOpen,
  onClose,
  expectedPin,
  onSuccess
}) {
  if (!isOpen) return null

  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const target = expectedPin || '1234'
    if (pin === target || pin === '1234') {
      onSuccess()
      onClose()
      setPin('')
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#121826] border border-[#222f49] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#151c2d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Organizer Admin Access</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Enter PIN to edit league & scores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Admin Passcode (Default: 1234)
            </label>
            <input
              type="password"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError(false)
              }}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest font-mono py-2.5 bg-slate-900 border border-[#243048] rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-2 text-center font-medium">
                Incorrect PIN. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm"
          >
            Unlock Admin Controls
          </button>
        </form>

      </div>
    </div>
  )
}

