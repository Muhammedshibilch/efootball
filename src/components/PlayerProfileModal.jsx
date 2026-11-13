import React, { useMemo } from 'react'
import {
  X,
  Trophy,
  Flame,
  ShieldCheck,
  Target,
  Award,
  Zap,
  TrendingUp,
  Calendar,
  Share2,
  CheckCircle2,
  Crown
} from 'lucide-react'

export default function PlayerProfileModal({
  isOpen,
  onClose,
  player,
  standings = [],
  fixtures = [],
  playersMap = {},
  seasonName = 'Season 1'
}) {
  if (!isOpen || !player) return null

  // 1. Find Standing Row for this player
  const standingIndex = standings.findIndex(s => {
    const id = s.id || s.player?.id
    return id === player.id || (s.name && s.name.toLowerCase() === player.name?.toLowerCase())
  })

  const standingRow = standingIndex !== -1 ? standings[standingIndex] : null
  const rank = standingIndex !== -1 ? standingIndex + 1 : null

  const p = standingRow?.p ?? standingRow?.played ?? 0
  const w = standingRow?.w ?? standingRow?.won ?? 0
  const d = standingRow?.d ?? standingRow?.drawn ?? 0
  const l = standingRow?.l ?? standingRow?.lost ?? 0
  const gf = standingRow?.gf ?? standingRow?.goalsFor ?? 0
  const ga = standingRow?.ga ?? standingRow?.goalsAgainst ?? 0
  const gd = standingRow?.gd ?? standingRow?.goalDifference ?? (gf - ga)
  const pts = standingRow?.pts ?? standingRow?.points ?? 0

  // 2. Win Rate %
  const winRate = p > 0 ? Math.round((w / p) * 100) : 0

  // 3. Averages
  const avgScored = p > 0 ? (gf / p).toFixed(1) : '0.0'
  const avgConceded = p > 0 ? (ga / p).toFixed(1) : '0.0'

  // 4. Extract player match log from fixtures
  const matchLog = useMemo(() => {
    const playerId = player.id
    const playerName = (player.name || '').trim().toLowerCase()

    const playerFixtures = fixtures.filter(f => {
      if (f.status !== 'COMPLETED' && f.status !== 'EXPIRED_DISQUALIFIED') return false
      const hId = f.home_player_id
      const aId = f.away_player_id
      const hName = (playersMap[hId]?.name || '').trim().toLowerCase()
      const aName = (playersMap[aId]?.name || '').trim().toLowerCase()

      return hId === playerId || aId === playerId || hName === playerName || aName === playerName
    }).sort((a, b) => (a.round_number || 0) - (b.round_number || 0) || (a.id || '').localeCompare(b.id || ''))

    return playerFixtures.map(f => {
      const isForfeit = f.status === 'EXPIRED_DISQUALIFIED'
      const isHome = f.home_player_id === playerId || (playersMap[f.home_player_id]?.name || '').trim().toLowerCase() === playerName

      const opponentId = isHome ? f.away_player_id : f.home_player_id
      const opponent = playersMap[opponentId] || { name: 'Opponent', avatar_color: '#94a3b8' }

      const playerGoals = Number(isHome ? f.home_score : f.away_score)
      const oppGoals = Number(isHome ? f.away_score : f.home_score)

      let result = 'D'
      let resultText = 'Draw'
      let points = 1

      if (isForfeit) {
        result = 'L'
        resultText = 'Forfeit Loss'
        points = 0
      } else if (playerGoals > oppGoals) {
        result = 'W'
        resultText = 'Win'
        points = 3
      } else if (playerGoals < oppGoals) {
        result = 'L'
        resultText = 'Loss'
        points = 0
      }

      return {
        id: f.id,
        round: f.round_number,
        legType: f.leg_type,
        isHome,
        opponent,
        playerGoals,
        oppGoals,
        result,
        resultText,
        points,
        isForfeit,
        scoreString: isForfeit ? '0 - 0 (Forfeit)' : `${playerGoals} - ${oppGoals}`
      }
    })
  }, [fixtures, player, playersMap])

  // 5. Clean Sheets Count
  const cleanSheets = matchLog.filter(m => !m.isForfeit && m.oppGoals === 0).length
  const cleanSheetRate = p > 0 ? Math.round((cleanSheets / p) * 100) : 0

  // 6. Biggest Win
  const biggestWin = useMemo(() => {
    let best = null
    matchLog.forEach(m => {
      if (m.result === 'W' && !m.isForfeit) {
        const diff = m.playerGoals - m.oppGoals
        if (!best || diff > best.diff || (diff === best.diff && m.playerGoals > best.playerGoals)) {
          best = {
            diff,
            playerGoals: m.playerGoals,
            oppGoals: m.oppGoals,
            opponentName: m.opponent.name,
            round: m.round,
            score: `${m.playerGoals} - ${m.oppGoals}`
          }
        }
      }
    })
    return best
  }, [matchLog])

  // 7. Active Streak
  const streak = useMemo(() => {
    if (matchLog.length === 0) return null
    const reversed = [...matchLog].reverse()
    const latest = reversed[0].result

    if (latest === 'W') {
      let count = 0
      for (const m of reversed) {
        if (m.result === 'W') count++
        else break
      }
      return { type: 'HOT', text: `${count}-match win streak`, icon: '🔥' }
    } else if (latest === 'D') {
      let count = 0
      for (const m of reversed) {
        if (m.result === 'W' || m.result === 'D') count++
        else break
      }
      if (count >= 3) {
        return { type: 'HOT', text: `Unbeaten in ${count}`, icon: '🔥' }
      }
      return { type: 'NEUTRAL', text: `Last match was a draw`, icon: '🤝' }
    } else if (latest === 'L') {
      let count = 0
      for (const m of reversed) {
        if (m.result === 'L') count++
        else break
      }
      return { type: 'COLD', text: `${count}-match losing streak`, icon: '❄️' }
    }
    return null
  }, [matchLog])

  // 8. Recent Form Pills (Last 5)
  const recentForm = matchLog.slice(-5)

  return (
    <div className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0f1422] border-2 border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Hero Banner */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-slate-100 via-slate-50 to-white dark:from-[#151c2e] dark:via-[#111726] dark:to-[#0c101a] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-slate-950 font-black text-xl sm:text-2xl shadow-md border-2 border-white dark:border-slate-800"
                style={{ backgroundColor: player.avatar_color || '#3b82f6' }}
              >
                {(player.name || 'P').substring(0, 2).toUpperCase()}
              </div>
              {rank && rank <= 3 && (
                <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-sm">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                </div>
              )}
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {seasonName}
                </span>
                {rank && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 font-mono">
                    #{rank} in League
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading truncate">
                {player.name}
              </h2>
              {player.gamertag && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  @{player.gamertag}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            
            {/* 1. Win Rate */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                Win Rate %
              </span>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                {winRate}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {w}W - {d}D - {l}L
              </span>
            </div>

            {/* 2. Attack Average */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                Avg Attack
              </span>
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 block">
                {avgScored}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {gf} goals in {p} games
              </span>
            </div>

            {/* 3. Defense Average */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                Avg Defense
              </span>
              <span className="text-xl font-black font-mono text-teal-600 dark:text-teal-400 block">
                {avgConceded}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {ga} conceded ({gd > 0 ? `+${gd}` : gd} GD)
              </span>
            </div>

            {/* 4. Clean Sheets */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                Shutouts 🧤
              </span>
              <span className="text-xl font-black font-mono text-cyan-600 dark:text-cyan-400 block">
                {cleanSheets}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {cleanSheetRate}% Clean Sheet Rate
              </span>
            </div>

          </div>

          {/* Highlights Row: Biggest Win & Recent Streak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Biggest Win Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-500/10 dark:to-transparent border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                🏆
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 uppercase font-extrabold block">
                  Biggest Victory
                </span>
                {biggestWin ? (
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {biggestWin.score} vs {biggestWin.opponentName} <span className="text-[10px] font-normal text-slate-500">(Wk {biggestWin.round})</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">No victories recorded yet</p>
                )}
              </div>
            </div>

            {/* Current Streak & Form Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/10 dark:to-transparent border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] text-amber-800 dark:text-amber-400 uppercase font-extrabold block">
                  Current Streak
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {streak ? `${streak.icon} ${streak.text}` : 'No active streak'}
                </p>
              </div>

              {/* Last 5 Form Pills */}
              <div className="flex items-center gap-1 shrink-0">
                {recentForm.length === 0 ? (
                  <span className="text-[10px] text-slate-400">-</span>
                ) : (
                  recentForm.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      title={`Week ${m.round}: vs ${m.opponent.name} (${m.scoreString})`}
                      className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white ${
                        m.result === 'W' ? 'bg-emerald-500' : m.result === 'D' ? 'bg-slate-400' : 'bg-rose-500'
                      }`}
                    >
                      {m.result}
                    </span>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Full Match Log for this Player */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Full Season Match Log ({matchLog.length} Matches)</span>
              </h3>
              <span className="text-[11px] font-mono font-bold text-slate-500">
                Total: {pts} PTS
              </span>
            </div>

            {matchLog.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                No completed matches for {player.name} yet this season.
              </div>
            ) : (
              <div className="space-y-2">
                {matchLog.map((m) => {
                  const isWin = m.result === 'W'
                  const isLoss = m.result === 'L'
                  const isDraw = m.result === 'D'

                  return (
                    <div
                      key={m.id}
                      className="p-2.5 sm:p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-[#0c101a] dark:hover:bg-[#121826] border border-slate-200/80 dark:border-slate-800/80 transition flex items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Round & Home/Away Badge */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                          Wk {m.round}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0">
                          {m.isHome ? 'Home' : 'Away'}
                        </span>
                        <span className="text-slate-400 px-0.5">vs</span>
                        
                        {/* Opponent Info */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-slate-950 font-bold text-[9px] shadow-xs shrink-0"
                            style={{ backgroundColor: m.opponent.avatar_color || '#94a3b8' }}
                          >
                            {(m.opponent.name || 'O').substring(0, 1).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {m.opponent.name}
                          </span>
                        </div>
                      </div>

                      {/* Right: Scoreline & Result Pill */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
                          {m.scoreString}
                        </span>

                        <span className={`w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] text-white shadow-xs ${
                          isWin ? 'bg-emerald-500' : isDraw ? 'bg-slate-400' : 'bg-rose-500'
                        }`}>
                          {m.result}
                        </span>

                        <span className="text-[11px] font-mono font-bold text-slate-500 w-10 text-right">
                          {m.points > 0 ? `+${m.points}p` : '0p'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

