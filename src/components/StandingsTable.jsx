import React, { useState } from 'react'
import { Trophy, Crown, Share2, RefreshCw, Link2, Sparkles } from 'lucide-react'
import PlayerProfileModal from './PlayerProfileModal'

export default function StandingsTable({
  standings = [],
  fixtures = [],
  playersMap = {},
  seasonName = 'Season 1',
  onRefresh,
  onShareWhatsApp,
  onShareLink,
  onOpenPoster
}) {
  const [profilePlayer, setProfilePlayer] = useState(null)
  const completedCount = standings.reduce((acc, row) => acc + (row.played || 0), 0) / 2;

  return (
    <div className="bg-white dark:bg-[#0d121c] border border-slate-200 dark:border-[#1c2438] rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
      {/* Header */}
      <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-[#1c2438] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
            <span>League Standings</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Win: 3 Pts • Draw: 1 Pt • Loss: 0 Pts • 24h Forfeit: 0 Pts</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {onOpenPoster && (
            <button
              onClick={onOpenPoster}
              title="Generate & Share High-Definition Points Table Poster"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span>Share Poster</span>
            </button>
          )}
          {onShareLink && (
            <button
              onClick={onShareLink}
              title="Copy Read-Only Link for Players & WhatsApp"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5 shadow-sm transition"
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xs:inline">Share Link</span>
              <span className="xs:hidden">Share</span>
            </button>
          )}
          <button
            onClick={onShareWhatsApp}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span className="hidden xs:inline">WhatsApp</span>
            <span className="xs:hidden">WA</span>
          </button>
          <button
            onClick={onRefresh}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shadow-sm transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto touch-scroll scrollbar-none">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100/90 dark:bg-[#0b101b] text-slate-600 dark:text-slate-400 uppercase text-[10px] sm:text-[11px] tracking-wider font-semibold border-b border-slate-200 dark:border-[#1c2438]">
            <tr>
              <th className="py-2.5 sm:py-3.5 px-2 text-center w-8 sm:w-12">#</th>
              <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 min-w-[120px] sm:min-w-[160px]">Player</th>
              <th className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center" title="Matches Played">P</th>
              <th className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-emerald-600 dark:text-emerald-400" title="Won">W</th>
              <th className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-amber-600 dark:text-amber-400" title="Drawn">D</th>
              <th className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-rose-600 dark:text-rose-400" title="Lost">L</th>
              <th className="py-2.5 sm:py-3.5 px-2 text-center hidden md:table-cell" title="Goals For">GF</th>
              <th className="py-2.5 sm:py-3.5 px-2 text-center hidden md:table-cell" title="Goals Against">GA</th>
              <th className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center font-medium" title="Goal Difference">GD</th>
              <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base" title="Points">PTS</th>
              <th className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center min-w-[85px] sm:min-w-[105px] whitespace-nowrap">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1c2438]/60 text-slate-800 dark:text-slate-200">
            {standings.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-10 text-slate-400 text-xs">
                  No players registered yet. Go to League Setup to add your players!
                </td>
              </tr>
            ) : (
              standings.map((row, idx) => {
                const pos = idx + 1;
                return (
                  <tr key={row.player.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition duration-150">
                    <td className="py-2.5 sm:py-3.5 px-2 text-center">
                      {pos === 1 ? (
                        <span className="rank-pill rank-1">
                          <Crown className="w-3 h-3 text-slate-950" />
                        </span>
                      ) : pos === 2 ? (
                        <span className="rank-pill rank-2">2</span>
                      ) : pos === 3 ? (
                        <span className="rank-pill rank-3">3</span>
                      ) : (
                        <span className="font-bold text-slate-500 dark:text-slate-400 text-xs">{pos}</span>
                      )}
                    </td>

                    <td
                      onClick={() => setProfilePlayer(row.player)}
                      title="Click to view detailed player profile card"
                      className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 cursor-pointer hover:opacity-85 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-bold text-[10px] sm:text-xs shadow-md"
                          style={{ backgroundColor: row.player.avatar_color || row.player.avatarColor || '#10b981' }}
                        >
                          {row.player.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1">
                            <span className="truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none group-hover:underline">{row.player.name}</span>
                            {row.forfeit > 0 && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                                {row.forfeit}F
                              </span>
                            )}
                          </div>
                          {row.player.gamertag && (
                            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block font-mono truncate">@{row.player.gamertag}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{row.played}</td>
                    <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-emerald-600 dark:text-emerald-400 font-medium text-xs sm:text-sm">{row.won}</td>
                    <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-amber-600 dark:text-amber-400 font-medium text-xs sm:text-sm">{row.drawn}</td>
                    <td className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center text-rose-600 dark:text-rose-400 font-medium text-xs sm:text-sm">{row.lost}</td>
                    <td className="py-2.5 sm:py-3.5 px-2 text-center text-slate-500 dark:text-slate-400 hidden md:table-cell text-xs sm:text-sm">{row.goalsFor}</td>
                    <td className="py-2.5 sm:py-3.5 px-2 text-center text-slate-500 dark:text-slate-400 hidden md:table-cell text-xs sm:text-sm">{row.goalsAgainst}</td>
                    <td className={`py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-center font-semibold text-xs sm:text-sm ${
                      row.goalDifference > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.goalDifference < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-4 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">{row.points}</td>

                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        {row.form.length === 0 ? (
                          <span className="text-slate-400 text-xs">-</span>
                        ) : (
                          row.form.map((f, i) => (
                            <span
                              key={i}
                              className={`form-badge ${
                                f === 'W'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                                  : f === 'D'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                                  : f === 'L'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {f}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer summary */}
      <div className="p-3.5 bg-slate-50 dark:bg-[#0b101b] border-t border-slate-200 dark:border-[#1c2438] text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> 1st Place (Champion)</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> 2nd & 3rd Podium</span>
        </div>
        <div className="font-semibold text-slate-600 dark:text-slate-300">
          Rankings auto-update as scores are submitted
        </div>
      </div>

      {/* 👤 Detailed Player Profile Modal */}
      <PlayerProfileModal
        isOpen={Boolean(profilePlayer)}
        onClose={() => setProfilePlayer(null)}
        player={profilePlayer}
        standings={standings}
        fixtures={fixtures}
        playersMap={playersMap}
        seasonName={seasonName}
      />
    </div>
  )
}

