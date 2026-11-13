import React, { useState, useEffect } from 'react'
import { X, Trophy, AlertTriangle, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export default function MatchScoreModal({
  isOpen,
  onClose,
  fixture,
  playersMap,
  onSaveScore,
  onMarkForfeit,
  onResetMatch,
  onOpenGraphic,
  isAdmin
}) {
  if (!isOpen || !fixture) return null

  const home = playersMap[fixture.home_player_id] || { name: 'Home Player', gamertag: 'HOME' }
  const away = playersMap[fixture.away_player_id] || { name: 'Away Player', gamertag: 'AWAY' }

  const { toast, confirmModal } = useToast()
  const [homeScore, setHomeScore] = useState(fixture.home_score ?? '')
  const [awayScore, setAwayScore] = useState(fixture.away_score ?? '')
  const [notes, setNotes] = useState(fixture.notes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setHomeScore(fixture.home_score ?? '')
    setAwayScore(fixture.away_score ?? '')
    setNotes(fixture.notes || '')
  }, [fixture])

  const handleScoreSubmit = async (e) => {
    e.preventDefault()
    if (homeScore === '' || awayScore === '') {
      toast.error('Please enter scores for both players')
      return
    }
    const h = parseInt(homeScore, 10)
    const a = parseInt(awayScore, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      toast.error('Scores must be non-negative numbers')
      return
    }

    setSaving(true)
    try {
      await onSaveScore(fixture.id, h, a, notes)
      toast.success(`Score saved: ${home.name} ${h} - ${a} ${away.name}`)
      onClose()
    } catch (err) {
      toast.error('Failed to save score: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleForfeit = async () => {
    const confirmed = await confirmModal({
      title: 'Mark 24h Forfeit / No-Show?',
      message: 'Both players will receive 0 points, but it will count as 1 match played in the standings table.',
      confirmText: 'Mark 24h Forfeit',
      cancelText: 'Cancel',
      type: 'danger'
    })
    if (!confirmed) {
      return
    }
    setSaving(true)
    try {
      await onMarkForfeit(fixture.id, notes || '24h match window expired (Organizer forfeit)')
      toast.info('Match marked as 24h forfeit')
      onClose()
    } catch (err) {
      toast.error('Failed to mark forfeit: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const confirmed = await confirmModal({
      title: 'Reset Match to Pending?',
      message: 'Previous scores and statistics for this match will be cleared.',
      confirmText: 'Reset to Pending',
      cancelText: 'Cancel',
      type: 'warning'
    })
    if (!confirmed) {
      return
    }
    setSaving(true)
    try {
      await onResetMatch(fixture.id)
      toast.info('Match has been reset to pending')
      onClose()
    } catch (err) {
      toast.error('Failed to reset match: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#121826] border border-[#222f49] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#151c2d] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Match Score & Status</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Week {fixture.round_number} {fixture.leg_type ? `• ${fixture.leg_type === 'LEG_1' ? 'Leg 1' : fixture.leg_type === 'LEG_2' ? 'Leg 2' : fixture.leg_type}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status Badge */}
          <div>
            {fixture.status === 'COMPLETED' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> Match Completed ({fixture.home_score} - {fixture.away_score})
              </div>
            )}
            {fixture.status === 'EXPIRED_DISQUALIFIED' && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Marked as 24h Forfeit (0 pts each, +1 played)
              </div>
            )}
            {fixture.status === 'PENDING' && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                Pending match result
              </div>
            )}
          </div>

          {/* Players & Scores */}
          <form onSubmit={handleScoreSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-11 items-center gap-1.5 sm:gap-2 bg-[#0d121c] p-3 sm:p-4 rounded-xl border border-[#1c263c]">
              {/* Home Player */}
              <div className="col-span-5 flex flex-col items-center text-center min-w-0">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md text-xs sm:text-base border-2 border-slate-700 mb-1.5 sm:mb-2 shrink-0"
                  style={{ backgroundColor: home.avatar_color || '#3b82f6' }}
                >
                  {home.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-white text-xs sm:text-sm truncate max-w-full px-1">{home.name}</span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-mono truncate max-w-full">@{home.gamertag || 'player'}</span>
                
                {isAdmin ? (
                  <div className="mt-2 sm:mt-3 w-full max-w-[65px] sm:max-w-[80px]">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      disabled={saving}
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      placeholder="0"
                      className="w-full text-center text-xl sm:text-2xl font-black py-1.5 sm:py-2 bg-slate-900 border border-[#2b3954] rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-black text-emerald-400 font-mono py-1">
                    {fixture.status === 'COMPLETED' ? fixture.home_score : '-'}
                  </div>
                )}
              </div>

              {/* VS divider */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <span className="text-slate-500 font-black text-xs sm:text-sm">VS</span>
              </div>

              {/* Away Player */}
              <div className="col-span-5 flex flex-col items-center text-center min-w-0">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md text-xs sm:text-base border-2 border-slate-700 mb-1.5 sm:mb-2 shrink-0"
                  style={{ backgroundColor: away.avatar_color || '#10b981' }}
                >
                  {away.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-white text-xs sm:text-sm truncate max-w-full px-1">{away.name}</span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-mono truncate max-w-full">@{away.gamertag || 'player'}</span>

                {isAdmin ? (
                  <div className="mt-2 sm:mt-3 w-full max-w-[65px] sm:max-w-[80px]">
                    <input
                      type="number"
                      min="0"
                      max="99"
                      disabled={saving}
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      placeholder="0"
                      className="w-full text-center text-xl sm:text-2xl font-black py-1.5 sm:py-2 bg-slate-900 border border-[#2b3954] rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <div className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-black text-emerald-400 font-mono py-1">
                    {fixture.status === 'COMPLETED' ? fixture.away_score : '-'}
                  </div>
                )}
              </div>
            </div>

            {/* Organizer Notes */}
            {isAdmin ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Match Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  disabled={saving}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Played on 12 Nov, overtime penalties"
                  className="w-full px-3 py-2 bg-slate-900 border border-[#243048] rounded-lg text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : notes ? (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-300">
                <span className="font-semibold text-slate-400 mr-1.5">Organizer Note:</span>
                <span>{notes}</span>
              </div>
            ) : null}

            {/* Graphic Poster Generator Button (Visible for completed & forfeit matches) */}
            {(fixture.status === 'COMPLETED' || fixture.status === 'EXPIRED_DISQUALIFIED') && onOpenGraphic && (
              <button
                type="button"
                onClick={() => onOpenGraphic(fixture)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Download Match Graphic Poster (PNG)</span>
              </button>
            )}

            {!isAdmin && (
              <div className="pt-2 border-t border-[#1f2b42] flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  👀 Read-Only Player View
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            )}

            {/* Action Buttons */}
            {isAdmin && (
              <div className="space-y-2 pt-2 border-t border-[#1f2b42]">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 text-xs sm:text-sm"
                >
                  {saving ? 'Saving...' : 'Save Match Score'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleForfeit}
                    className="py-2 px-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">Mark 24h Forfeit</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleReset}
                    className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Reset to Pending</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

      </div>
    </div>
  )
}

