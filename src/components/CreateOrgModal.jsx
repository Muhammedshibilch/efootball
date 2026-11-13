import React, { useState } from 'react'
import { X, Trophy, Key, PlusCircle, ShieldCheck } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function CreateOrgModal({
  isOpen,
  onClose,
  onCreateOrg
}) {
  if (!isOpen) return null

  const { toast } = useToast()
  const [orgName, setOrgName] = useState('')
  const [pin, setPin] = useState('')
  const [seasonName, setSeasonName] = useState('Season 1')
  const [format, setFormat] = useState('HOME_AWAY')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = orgName.trim()
    const cleanPin = pin.trim()

    if (!name) {
      toast.warning('Please enter an Organization or League Name')
      return
    }
    if (!cleanPin || cleanPin.length < 4) {
      toast.warning('Please enter a 4-digit PIN for organizer security')
      return
    }

    setLoading(true)
    try {
      await onCreateOrg({
        name,
        pin: cleanPin,
        seasonName: seasonName.trim() || 'Season 1',
        format
      })
      toast.success(`Organization "${name}" created successfully!`)
      onClose()
    } catch (err) {
      toast.error('Failed to create organization: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#121826] border border-[#222f49] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#151c2d] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Create League Organization</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Host multiple seasons under one roof</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Organization / Community Name *
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Calicut eFootball Arena, PES Friends Club"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-[#243048] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Organizer Secret Passcode (4-digit PIN) *
            </label>
            <input
              type="password"
              required
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="e.g. 5544"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-[#243048] rounded-xl text-sm text-white placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You will use this PIN to sign in and record scores.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                First Season Title
              </label>
              <input
                type="text"
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="Season 1"
                className="w-full px-3 py-2 bg-slate-900 border border-[#243048] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Match Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-[#243048] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="HOME_AWAY">Home & Away (2 Matches)</option>
                <option value="SINGLE_ROUND">Single Round (1 Match)</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-50"
            >
              {loading ? 'Creating Organization...' : 'Launch League Dashboard →'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

