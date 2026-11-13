import React, { useState } from 'react'
import { X, Plus, Trophy, Users, Layers } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function NewSeasonModal({
  isOpen,
  onClose,
  currentPlayers,
  onCreateSeason
}) {
  if (!isOpen) return null

  const { toast } = useToast()
  const [seasonName, setSeasonName] = useState('')
  const [format, setFormat] = useState('HOME_AWAY')
  const [copyPlayers, setCopyPlayers] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = seasonName.trim()
    if (!name) {
      toast.warning('Please enter a season name (e.g. Season 2)')
      return
    }

    setLoading(true)
    try {
      await onCreateSeason({
        name,
        format,
        copyPlayers: copyPlayers ? currentPlayers : []
      })
      toast.success(`Season "${name}" created successfully!`)
      onClose()
    } catch (err) {
      toast.error('Failed to create season: ' + err.message)
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
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Create New Season</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Past seasons remain archived and viewable</p>
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
              Season Name / Title *
            </label>
            <input
              type="text"
              required
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              placeholder="e.g. Season 2, Winter Championship"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-[#243048] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Match Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-[#243048] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="HOME_AWAY">Home & Away (2 Matches per pair)</option>
              <option value="SINGLE_ROUND">Single Round (1 Match per pair)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Home & Away ensures fair play with both players playing 1st leg and 2nd leg.
            </p>
          </div>

          {currentPlayers.length > 0 && (
            <div className="bg-[#0e131d] p-3.5 rounded-xl border border-[#1b2334] space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyPlayers}
                  onChange={(e) => setCopyPlayers(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    Copy existing {currentPlayers.length} players to new season
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Saves time re-typing players. You can still add, edit, or remove players after creating.
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 text-sm disabled:opacity-50"
            >
              {loading ? 'Creating Season...' : 'Start New Season'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

