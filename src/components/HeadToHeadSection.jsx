import React, { useState, useEffect, useMemo } from 'react'
import {
  Swords,
  RotateCw,
  Trophy,
  Flame,
  Shield,
  Calendar,
  Layers,
  ArrowRightLeft,
  ChevronDown,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { loadPlayoffsData } from '../lib/playoffsEngine'

export default function HeadToHeadSection({
  standings = [],
  fixtures = [],
  playersMap = {},
  activeTournament = null,
  allOrgTournaments = [],
  activeOrg = null,
  playoffsData = null
}) {
  // Extract distinct players for current season
  const playerList = useMemo(() => {
    const list = [...standings].map(s => {
      const p = s.player || s
      return {
        id: p.id,
        name: p.name || 'Player',
        gamertag: p.gamertag || '',
        avatar_color: p.avatar_color || '#3b82f6'
      }
    }).filter(p => p.id && p.name !== 'BYE')

    if (list.length === 0) {
      return Object.values(playersMap).filter(p => p?.id && p.name !== 'BYE')
    }
    return list
  }, [standings, playersMap])

  // Default Player A and Player B to top 2 if available
  const [playerAId, setPlayerAId] = useState('')
  const [playerBId, setPlayerBId] = useState('')
  const [scope, setScope] = useState('CURRENT') // 'CURRENT' | 'ALL_TIME'
  const [loadingAllTime, setLoadingAllTime] = useState(false)
  const [allTimeData, setAllTimeData] = useState(null) // { fixtures: [], players: [], tourneysMap: {} }

  // Set initial selected players
  useEffect(() => {
    if (playerList.length >= 2) {
      if (!playerAId) setPlayerAId(playerList[0].id)
      if (!playerBId) setPlayerBId(playerList[1].id)
    } else if (playerList.length === 1 && !playerAId) {
      setPlayerAId(playerList[0].id)
    }
  }, [playerList])

  // Swap Player A and Player B
  const handleSwapPlayers = () => {
    const temp = playerAId
    setPlayerAId(playerBId)
    setPlayerBId(temp)
  }

  // Selected player objects
  const playerA = useMemo(() => {
    return playerList.find(p => p.id === playerAId) || playersMap[playerAId] || { name: 'Player 1', avatar_color: '#3b82f6' }
  }, [playerList, playersMap, playerAId])

  const playerB = useMemo(() => {
    return playerList.find(p => p.id === playerBId) || playersMap[playerBId] || { name: 'Player 2', avatar_color: '#10b981' }
  }, [playerList, playersMap, playerBId])

  // Fetch all-time fixtures across all tournaments in this organization
  useEffect(() => {
    if (scope !== 'ALL_TIME' || allTimeData) return

    let isMounted = true
    setLoadingAllTime(true)

    const fetchAllSeasons = async () => {
      try {
        const tourneys = allOrgTournaments && allOrgTournaments.length > 0
          ? allOrgTournaments
          : (activeTournament ? [activeTournament] : [])

        const tourneyIds = tourneys.map(t => t.id)
        const tourneysMap = {}
        tourneys.forEach(t => {
          tourneysMap[t.id] = t.name || 'Season'
        })

        // Fetch fixtures & players for all tournaments
        const [fixturesRes, playersRes] = await Promise.all([
          supabase.from('fixtures').select('*').in('tournament_id', tourneyIds),
          supabase.from('players').select('*').in('tournament_id', tourneyIds)
        ])

        if (fixturesRes.error) throw fixturesRes.error
        if (playersRes.error) throw playersRes.error

        // Also check playoffs data for all tournaments from storage
        const allPlayoffMatches = []
        tourneyIds.forEach(tId => {
          const pData = loadPlayoffsData(tId)
          if (pData?.matches) {
            Object.values(pData.matches).forEach(m => {
              if (m?.status === 'COMPLETED' && m.homePlayerId && m.awayPlayerId) {
                allPlayoffMatches.push({
                  id: `playoff-${m.id || m.key}-${tId}`,
                  tournament_id: tId,
                  round_number: 99,
                  home_player_id: m.homePlayerId,
                  away_player_id: m.awayPlayerId,
                  home_score: m.homeScore,
                  away_score: m.awayScore,
                  status: 'COMPLETED',
                  match_type: 'PLAYOFFS',
                  playoff_round_name: m.name
                })
              }
            })
          }
        })

        if (isMounted) {
          setAllTimeData({
            fixtures: [...(fixturesRes.data || []), ...allPlayoffMatches],
            players: playersRes.data || [],
            tourneysMap
          })
          setLoadingAllTime(false)
        }
      } catch (err) {
        console.error('Failed to load all-time H2H data:', err)
        if (isMounted) {
          setLoadingAllTime(false)
        }
      }
    }

    fetchAllSeasons()

    return () => {
      isMounted = false
    }
  }, [scope, allOrgTournaments, activeTournament, allTimeData])

  // Calculate H2H matches between Player A and Player B
  const h2hStats = useMemo(() => {
    if (!playerA?.name || !playerB?.name) return null

    const nameA = (playerA.name || '').trim().toLowerCase()
    const nameB = (playerB.name || '').trim().toLowerCase()

    let rawMatches = []

    if (scope === 'CURRENT') {
      // Current season: regular season fixtures + current playoffs
      const currentTourneyName = activeTournament?.name || 'Current Season'
      
      // Regular league fixtures
      fixtures.forEach(f => {
        if (f.status === 'COMPLETED' || f.status === 'EXPIRED_DISQUALIFIED') {
          const home = playersMap[f.home_player_id]
          const away = playersMap[f.away_player_id]
          const hName = (home?.name || '').trim().toLowerCase()
          const aName = (away?.name || '').trim().toLowerCase()

          if ((hName === nameA && aName === nameB) || (hName === nameB && aName === nameA)) {
            rawMatches.push({
              id: f.id,
              tournamentName: currentTourneyName,
              round: f.round_number,
              legType: f.leg_type,
              homeName: home?.name || 'Home',
              awayName: away?.name || 'Away',
              homeScore: Number(f.home_score ?? 0),
              awayScore: Number(f.away_score ?? 0),
              isForfeit: f.status === 'EXPIRED_DISQUALIFIED',
              isPlayoff: false,
              rawFixture: f
            })
          }
        }
      })

      // Current playoffs matches
      if (playoffsData?.matches) {
        Object.values(playoffsData.matches).forEach(m => {
          if (m?.status === 'COMPLETED' && m.homePlayerId && m.awayPlayerId) {
            const home = playersMap[m.homePlayerId]
            const away = playersMap[m.awayPlayerId]
            const hName = (home?.name || '').trim().toLowerCase()
            const aName = (away?.name || '').trim().toLowerCase()

            if ((hName === nameA && aName === nameB) || (hName === nameB && aName === nameA)) {
              rawMatches.push({
                id: `playoff-${m.id || m.key}`,
                tournamentName: currentTourneyName,
                round: 'Playoffs',
                legType: null,
                playoffRoundName: m.name || 'Grand Final',
                homeName: home?.name || 'Home',
                awayName: away?.name || 'Away',
                homeScore: Number(m.homeScore ?? 0),
                awayScore: Number(m.awayScore ?? 0),
                isForfeit: false,
                isPlayoff: true,
                rawFixture: m
              })
            }
          }
        })
      }
    } else {
      // All-Time Scope
      if (!allTimeData) return null

      const playerMapById = {}
      allTimeData.players.forEach(p => {
        playerMapById[p.id] = p
      })

      allTimeData.fixtures.forEach(f => {
        if (f.status === 'COMPLETED' || f.status === 'EXPIRED_DISQUALIFIED') {
          const home = playerMapById[f.home_player_id] || playersMap[f.home_player_id]
          const away = playerMapById[f.away_player_id] || playersMap[f.away_player_id]
          const hName = (home?.name || '').trim().toLowerCase()
          const aName = (away?.name || '').trim().toLowerCase()

          if ((hName === nameA && aName === nameB) || (hName === nameB && aName === nameA)) {
            const tName = allTimeData.tourneysMap[f.tournament_id] || 'Season'
            rawMatches.push({
              id: f.id,
              tournamentName: tName,
              round: f.match_type === 'PLAYOFFS' ? 'Playoffs' : f.round_number,
              legType: f.leg_type,
              playoffRoundName: f.playoff_round_name,
              homeName: home?.name || 'Home',
              awayName: away?.name || 'Away',
              homeScore: Number(f.home_score ?? 0),
              awayScore: Number(f.away_score ?? 0),
              isForfeit: f.status === 'EXPIRED_DISQUALIFIED',
              isPlayoff: f.match_type === 'PLAYOFFS',
              rawFixture: f
            })
          }
        }
      })
    }

    // Process outcomes from Player A's perspective
    let winsA = 0
    let draws = 0
    let winsB = 0
    let goalsA = 0
    let goalsB = 0
    let cleanSheetsA = 0
    let cleanSheetsB = 0
    let biggestWinA = null
    let biggestWinB = null

    const processedMatches = rawMatches.map(m => {
      const isAHome = m.homeName.trim().toLowerCase() === nameA
      const scoreA = isAHome ? m.homeScore : m.awayScore
      const scoreB = isAHome ? m.awayScore : m.homeScore

      let outcome = 'D' // 'A_WIN' | 'B_WIN' | 'DRAW'
      if (m.isForfeit) {
        outcome = 'DRAW'
        draws++
      } else if (scoreA > scoreB) {
        outcome = 'A_WIN'
        winsA++
      } else if (scoreB > scoreA) {
        outcome = 'B_WIN'
        winsB++
      } else {
        outcome = 'DRAW'
        draws++
      }

      if (!m.isForfeit) {
        goalsA += scoreA
        goalsB += scoreB
        if (scoreB === 0) cleanSheetsA++
        if (scoreA === 0) cleanSheetsB++

        const diffA = scoreA - scoreB
        if (diffA > 0 && (!biggestWinA || diffA > biggestWinA.diff)) {
          biggestWinA = { diff: diffA, score: `${scoreA} - ${scoreB}`, tournament: m.tournamentName, round: m.round }
        }

        const diffB = scoreB - scoreA
        if (diffB > 0 && (!biggestWinB || diffB > biggestWinB.diff)) {
          biggestWinB = { diff: diffB, score: `${scoreB} - ${scoreA}`, tournament: m.tournamentName, round: m.round }
        }
      }

      return {
        ...m,
        scoreA,
        scoreB,
        outcome
      }
    })

    const totalMatches = processedMatches.length

    // Active rivalry streak (from latest match backwards)
    let streak = null
    if (totalMatches > 0) {
      const latest = processedMatches[processedMatches.length - 1]
      if (latest.outcome === 'A_WIN') {
        let count = 0
        for (let i = processedMatches.length - 1; i >= 0; i--) {
          if (processedMatches[i].outcome === 'A_WIN') count++
          else break
        }
        streak = {
          holder: playerA.name,
          color: 'emerald',
          badge: `${playerA.name} won last ${count} meeting${count > 1 ? 's' : ''}`
        }
      } else if (latest.outcome === 'B_WIN') {
        let count = 0
        for (let i = processedMatches.length - 1; i >= 0; i--) {
          if (processedMatches[i].outcome === 'B_WIN') count++
          else break
        }
        streak = {
          holder: playerB.name,
          color: 'cyan',
          badge: `${playerB.name} won last ${count} meeting${count > 1 ? 's' : ''}`
        }
      } else {
        streak = {
          holder: 'Draw',
          color: 'slate',
          badge: `Last meeting was a ${latest.scoreA} - ${latest.scoreB} draw`
        }
      }
    }

    return {
      matches: processedMatches,
      totalMatches,
      winsA,
      draws,
      winsB,
      goalsA,
      goalsB,
      cleanSheetsA,
      cleanSheetsB,
      biggestWinA,
      biggestWinB,
      streak,
      winRateA: totalMatches > 0 ? Math.round((winsA / totalMatches) * 100) : 0,
      winRateB: totalMatches > 0 ? Math.round((winsB / totalMatches) * 100) : 0,
      drawRate: totalMatches > 0 ? Math.round((draws / totalMatches) * 100) : 0
    }
  }, [playerA, playerB, scope, fixtures, playersMap, activeTournament, playoffsData, allTimeData])

  const totalSeasonsCount = allOrgTournaments && allOrgTournaments.length > 0 ? allOrgTournaments.length : 1

  return (
    <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-6">
      
      {/* Header & Scope Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-[#1b253a]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Swords className="w-4 h-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <span>Head-to-Head (H2H) Rivalry</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Versus
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare rivalry records, goals scored, win rates, and direct meeting history.
          </p>
        </div>

        {/* Scope Switcher: Current Season vs All Seasons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-inner w-full md:w-auto shrink-0">
          <button
            onClick={() => setScope('CURRENT')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              scope === 'CURRENT'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Current Season</span>
          </button>
          <button
            onClick={() => setScope('ALL_TIME')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
              scope === 'ALL_TIME'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All-Time ({totalSeasonsCount} Season{totalSeasonsCount !== 1 ? 's' : ''})</span>
          </button>
        </div>
      </div>

      {/* Versus Player Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
        
        {/* Player A Picker */}
        <div className="sm:col-span-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-black text-xs shadow shrink-0"
            style={{ backgroundColor: playerA.avatar_color || '#3b82f6' }}
          >
            {(playerA.name || 'P1').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Player 1</span>
            <select
              value={playerAId}
              onChange={(e) => setPlayerAId(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-sm focus:outline-none cursor-pointer truncate"
            >
              {playerList.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">
                  {p.name} {p.gamertag ? `(@${p.gamertag})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button (Col 1 on sm) */}
        <div className="sm:col-span-1 flex justify-center">
          <button
            type="button"
            onClick={handleSwapPlayers}
            title="Swap Player 1 & Player 2"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition shadow-xs active:scale-90"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Player B Picker */}
        <div className="sm:col-span-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-black text-xs shadow shrink-0"
            style={{ backgroundColor: playerB.avatar_color || '#10b981' }}
          >
            {(playerB.name || 'P2').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Player 2</span>
            <select
              value={playerBId}
              onChange={(e) => setPlayerBId(e.target.value)}
              className="w-full bg-transparent text-slate-900 dark:text-white font-bold text-sm focus:outline-none cursor-pointer truncate"
            >
              {playerList.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">
                  {p.name} {p.gamertag ? `(@${p.gamertag})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Loading All-Time State */}
      {loadingAllTime ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <RotateCw className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
          <p>Analyzing all-time head-to-head match history across all seasons...</p>
        </div>
      ) : h2hStats ? (
        <div className="space-y-6">

          {/* Tale of the Tape Summary Card */}
          <div className="bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 dark:from-[#151c2e] dark:via-[#111726] dark:to-[#0c101a] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-md">
            
            {/* Top Score Comparison */}
            <div className="grid grid-cols-3 items-center text-center pb-4 border-b border-slate-100 dark:border-slate-800">
              
              {/* Player A Stats */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                  {playerA.name}
                </span>
                <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {h2hStats.winsA}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Wins ({h2hStats.winRateA}%)
                </span>
              </div>

              {/* Center Match Info */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  {h2hStats.totalMatches} Clashes
                </span>
                <span className="text-xl sm:text-3xl font-black font-mono text-slate-400">
                  {h2hStats.draws}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Draws ({h2hStats.drawRate}%)
                </span>
              </div>

              {/* Player B Stats */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-none">
                  {playerB.name}
                </span>
                <span className="text-2xl sm:text-4xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                  {h2hStats.winsB}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Wins ({h2hStats.winRateB}%)
                </span>
              </div>
            </div>

            {/* Proportional Rivalry Bar */}
            {h2hStats.totalMatches > 0 && (
              <div className="mt-4 pt-1">
                <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 shadow-inner">
                  {h2hStats.winsA > 0 && (
                    <div
                      title={`${playerA.name}: ${h2hStats.winsA} Wins (${h2hStats.winRateA}%)`}
                      style={{ width: `${(h2hStats.winsA / h2hStats.totalMatches) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all duration-300"
                    />
                  )}
                  {h2hStats.draws > 0 && (
                    <div
                      title={`Draws: ${h2hStats.draws} (${h2hStats.drawRate}%)`}
                      style={{ width: `${(h2hStats.draws / h2hStats.totalMatches) * 100}%` }}
                      className="bg-slate-400 dark:bg-slate-600 h-full transition-all duration-300"
                    />
                  )}
                  {h2hStats.winsB > 0 && (
                    <div
                      title={`${playerB.name}: ${h2hStats.winsB} Wins (${h2hStats.winRateB}%)`}
                      style={{ width: `${(h2hStats.winsB / h2hStats.totalMatches) * 100}%` }}
                      className="bg-cyan-500 h-full transition-all duration-300"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-xs">
              
              {/* Head-to-Head Goals */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  H2H Goals
                </span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  <span className="text-emerald-600 dark:text-emerald-400">{h2hStats.goalsA}</span>
                  <span className="text-slate-400 mx-1.5">-</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{h2hStats.goalsB}</span>
                </span>
              </div>

              {/* Clean Sheets Against Each Other */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  Shutouts 🧤
                </span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  <span className="text-emerald-600 dark:text-emerald-400">{h2hStats.cleanSheetsA}</span>
                  <span className="text-slate-400 mx-1.5">-</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{h2hStats.cleanSheetsB}</span>
                </span>
              </div>

              {/* Biggest Victory */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  Biggest Win
                </span>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate block">
                  {h2hStats.biggestWinA ? (
                    <span>{playerA.name} ({h2hStats.biggestWinA.score})</span>
                  ) : h2hStats.biggestWinB ? (
                    <span>{playerB.name} ({h2hStats.biggestWinB.score})</span>
                  ) : (
                    <span className="text-slate-400 italic font-normal">None yet</span>
                  )}
                </span>
              </div>

              {/* Current Rivalry Streak */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">
                  Current Streak
                </span>
                <span className="font-bold text-xs text-amber-600 dark:text-amber-400 truncate block">
                  {h2hStats.streak?.badge || <span className="text-slate-400 italic font-normal">No streak</span>}
                </span>
              </div>

            </div>

          </div>

          {/* Past Encounters History Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>
                Meeting History ({h2hStats.matches.length} Clash{h2hStats.matches.length !== 1 ? 'es' : ''})
              </span>
            </h4>

            {h2hStats.matches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No completed matches found between these two players.</p>
                <p className="text-slate-500 dark:text-slate-400">
                  {scope === 'CURRENT'
                    ? "They haven't played each other in the current season yet. Try switching to 'All-Time' to check past seasons!"
                    : "No head-to-head matches recorded across any season yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {h2hStats.matches.map((m, idx) => {
                  const isAWin = m.outcome === 'A_WIN'
                  const isBWin = m.outcome === 'B_WIN'
                  const isDraw = m.outcome === 'DRAW'

                  return (
                    <div
                      key={m.id || idx}
                      className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 dark:bg-[#0f1422] dark:hover:bg-[#141b2e] border border-slate-200 dark:border-slate-800/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Season & Round tags */}
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shrink-0">
                          {m.tournamentName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 shrink-0">
                          {m.isPlayoff ? (m.playoffRoundName || 'Playoffs') : `Week ${m.round}`}
                        </span>
                      </div>

                      {/* Center: Matchup Scoreline */}
                      <div className="flex items-center justify-center gap-3">
                        <span className={`font-bold truncate max-w-[100px] sm:max-w-none text-right ${
                          isAWin ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {playerA.name}
                        </span>

                        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-xs">
                          {m.scoreA} - {m.scoreB}
                        </span>

                        <span className={`font-bold truncate max-w-[100px] sm:max-w-none text-left ${
                          isBWin ? 'text-cyan-600 dark:text-cyan-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {playerB.name}
                        </span>
                      </div>

                      {/* Right: Outcome Callout */}
                      <div className="sm:text-right shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isAWin
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                            : isBWin
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30'
                            : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                        }`}>
                          {isAWin ? `${playerA.name} Won` : isBWin ? `${playerB.name} Won` : 'Draw'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      ) : null}

    </div>
  )
}

