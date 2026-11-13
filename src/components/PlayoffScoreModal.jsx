import React, { useState } from 'react'
import { X, Trophy, Swords, ShieldAlert, Sparkles, Check, Share2 } from 'lucide-react'
import { playoffMatchToFixture } from '../lib/playoffsEngine'

export default function PlayoffScoreModal({
  isOpen,
  onClose,
  match,
  playersMap = {},
  onSaveScore,
  onResetScore,
  onOpenGraphic
}) {
  if (!isOpen || !match) return null

  const home = playersMap[match.homePlayerId] || { name: 'Player 1', avatar_color: '#3b82f6' }
  const away = playersMap[match.awayPlayerId] || { name: 'Player 2', avatar_color: '#10b981' }

  const [homeScore, setHomeScore] = useState(match.homeScore ?? '')
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '')
  const [homePens, setHomePens] = useState(match.homePens ?? '')
  const [awayPens, setAwayPens] = useState(match.awayPens ?? '')
  const [error, setError] = useState('')

  const isTied = homeScore !== '' && awayScore !== '' && Number(homeScore) === Number(awayScore)

  const validateAndExtract = () => {
    setError('')
    const h = Number(homeScore)
    const a = Number(awayScore)

    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Please enter valid match scores.')
      return null
    }

    let hp = null
    let ap = null

    if (h === a) {
      hp = Number(homePens)
      ap = Number(awayPens)
      if (isNaN(hp) || isNaN(ap) || hp < 0 || ap < 0) {
        setError('Match is tied! Knockout rules require a penalty shootout winner.')
        return null
      }
      if (hp === ap) {
        setError('Penalty shootout cannot end in a draw in playoffs.')
        return null
      }
    }

    return { h, a, hp, ap }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = validateAndExtract()
    if (!data) return

    onSaveScore({
      matchKey: match.key || match.id,
      homeScore: data.h,
      awayScore: data.a,
      homePens: data.hp,
      awayPens: data.ap
    })
    onClose()
  }

  const handleSaveAndShare = (e) => {
    e.preventDefault()
    const data = validateAndExtract()
    if (!data) return

    onSaveScore({
      matchKey: match.key || match.id,
      homeScore: data.h,
      awayScore: data.a,
      homePens: data.hp,
      awayPens: data.ap
    })

    if (onOpenGraphic) {
      const winnerId = data.h > data.a
        ? match.homePlayerId
        : data.a > data.h
        ? match.awayPlayerId
        : data.hp > data.ap
        ? match.homePlayerId
        : match.awayPlayerId

      onOpenGraphic(playoffMatchToFixture({
        ...match,
        homeScore: data.h,
        awayScore: data.a,
        homePens: data.hp,
        awayPens: data.ap,
        winnerId,
        status: 'COMPLETED'
      }))
    }
    onClose()
  }

  const handleReset = () => {
    if (window.confirm('Reset this playoff match score? Any downstream matches will also be reset.')) {
      onResetScore(match.key || match.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0f1422] border-2 border-slate-200 dark:border-amber-500/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1c263c] flex items-center justify-between bg-slate-50 dark:bg-[#131b2e]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Swords className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base font-heading flex items-center gap-2">
                <span>{match.name}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  Playoffs
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{match.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Versus Header Cards */}
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Home Player */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#162035] border border-slate-200 dark:border-slate-700/60 flex flex-col items-center text-center space-y-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-slate-950 font-black text-sm shadow-md"
                style={{ backgroundColor: home.avatar_color || '#3b82f6' }}
              >
                {(home.name || 'P1').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold text-sm truncate max-w-[130px]">{home.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">@{home.gamertag || 'gamer'}</p>
              </div>
              <input
                type="number"
                min="0"
                max="99"
                required
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                placeholder="0"
                className="w-16 h-14 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-amber-500/40 focus:border-amber-500 text-center text-2xl font-black text-slate-900 dark:text-white rounded-xl focus:outline-none shadow-inner"
              />
            </div>

            {/* Away Player */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#162035] border border-slate-200 dark:border-slate-700/60 flex flex-col items-center text-center space-y-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-slate-950 font-black text-sm shadow-md"
                style={{ backgroundColor: away.avatar_color || '#10b981' }}
              >
                {(away.name || 'P2').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-slate-900 dark:text-white font-bold text-sm truncate max-w-[130px]">{away.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">@{away.gamertag || 'gamer'}</p>
              </div>
              <input
                type="number"
                min="0"
                max="99"
                required
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                placeholder="0"
                className="w-16 h-14 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-amber-500/40 focus:border-amber-500 text-center text-2xl font-black text-slate-900 dark:text-white rounded-xl focus:outline-none shadow-inner"
              />
            </div>
          </div>

          {/* Tie Breaker / Penalties Section */}
          {isTied && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Knockout Tie-Breaker: Penalty Shootout</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Regular time ended in a tie ({homeScore} - {awayScore}). Enter penalty shootout score to determine winner:
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-500/20 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 truncate font-semibold">{home.name}:</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    required
                    value={homePens}
                    onChange={(e) => setHomePens(e.target.value)}
                    placeholder="Pens"
                    className="w-12 h-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-amber-500/40 text-center font-bold text-sm text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-500/20 shadow-sm">
                  <span className="text-xs text-slate-800 dark:text-slate-300 truncate font-semibold">{away.name}:</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    required
                    value={awayPens}
                    onChange={(e) => setAwayPens(e.target.value)}
                    placeholder="Pens"
                    className="w-12 h-8 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-amber-500/40 text-center font-bold text-sm text-slate-900 dark:text-white rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {match.status === 'COMPLETED' && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2.5 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl border border-rose-300 dark:border-rose-500/30 transition shadow-sm"
                >
                  Reset Match
                </button>
              )}
              {match.status === 'COMPLETED' && onOpenGraphic && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onOpenGraphic(playoffMatchToFixture(match))
                  }}
                  className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-500/30 transition shadow-sm flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Poster 📸</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSaveAndShare}
                title="Save score and immediately open WhatsApp / Instagram share graphic"
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Save & Share 📸</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Only</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}

