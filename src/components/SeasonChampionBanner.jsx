import React from 'react'
import { Trophy, Crown, Sparkles, ChevronRight, Award } from 'lucide-react'

export default function SeasonChampionBanner({
  playoffsData,
  playersMap = {},
  seasonName = 'Season 1',
  onOpenChampionModal,
  onViewPlayoffs
}) {
  if (!playoffsData || playoffsData.status !== 'COMPLETED' || !playoffsData.championId) {
    return null
  }

  const champion = playersMap[playoffsData.championId] || { name: 'Champion', gamertag: 'winner', avatar_color: '#f59e0b' }
  const runnerUp = playersMap[playoffsData.runnerUpId] || { name: 'Runner-Up' }
  const third = playersMap[playoffsData.thirdPlaceId] || { name: '3rd Place' }

  return (
    <div className="mb-6 rounded-3xl bg-gradient-to-r from-amber-100 via-amber-50 to-yellow-100 dark:from-amber-500/25 dark:via-[#182238] dark:to-yellow-500/25 border-2 border-amber-400 dark:border-amber-500 shadow-lg dark:shadow-2xl dark:shadow-amber-500/20 p-4 sm:p-6 overflow-hidden relative animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        
        {/* Left: Champion Badge & Hero Avatar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="relative">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-slate-950 font-black text-2xl sm:text-3xl shadow-2xl border-4 border-amber-300 ring-4 ring-amber-500/30"
              style={{ backgroundColor: champion.avatar_color || '#f59e0b' }}
            >
              {(champion.name || 'CH').substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -top-2 -right-2 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 p-1.5 rounded-full shadow-lg border border-yellow-200">
              <Crown className="w-4 h-4 fill-slate-950" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <Trophy className="w-3 h-3 fill-slate-950" /> Season Concluded
              </span>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                {seasonName} Official Winner
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span>{champion.name}</span>
            </h2>
            <p className="text-xs font-mono text-amber-900 dark:text-amber-300/90 font-semibold">
              @{champion.gamertag || 'champion'} • Tournament Champion 🏆
            </p>
          </div>
        </div>

        {/* Center: Podium Summary (2nd & 3rd) */}
        <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
          <div className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700/80 text-center min-w-[125px] shadow-sm">
            <span className="text-[10px] uppercase font-extrabold text-slate-600 dark:text-slate-400 block">
              🥈 2nd Place
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
              {runnerUp.name}
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-amber-300 dark:border-amber-800/60 text-center min-w-[125px] shadow-sm">
            <span className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-400 block">
              🥉 3rd Place
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
              {third.name}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {onViewPlayoffs && (
            <button
              onClick={onViewPlayoffs}
              className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <span>Playoff Bracket</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {onOpenChampionModal && (
            <button
              onClick={onOpenChampionModal}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/30 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Winner Poster</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

