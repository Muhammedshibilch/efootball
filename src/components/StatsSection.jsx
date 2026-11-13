import React, { useState, useMemo } from 'react'
import {
  Flame,
  ShieldCheck,
  Trophy,
  AlertTriangle,
  Award,
  Sparkles,
  Shield,
  Crown,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  TrendingUp,
  Activity,
  Zap,
  Snowflake,
  Filter
} from 'lucide-react'
import HeadToHeadSection from './HeadToHeadSection'
import PlayerProfileModal from './PlayerProfileModal'
import AwardsGraphicModal from './AwardsGraphicModal'

export default function StatsSection({
  standings = [],
  fixtures = [],
  playersMap = {},
  activeTournament = null,
  allOrgTournaments = [],
  activeOrg = null,
  playoffsData = null
}) {
  const [activeCategory, setActiveCategory] = useState('GOLDEN_GLOVE') // 'GOLDEN_GLOVE' | 'TOP_ATTACK' | 'BEST_DEFENSE' | 'MOST_WINS'
  const [selectedCleanSheetPlayer, setSelectedCleanSheetPlayer] = useState(null)
  const [showAllCleanSheets, setShowAllCleanSheets] = useState(false)
  const [showAllAttack, setShowAllAttack] = useState(false)
  const [showAllDefense, setShowAllDefense] = useState(false)
  const [showAllWins, setShowAllWins] = useState(false)
  const [formFilter, setFormFilter] = useState('ALL') // 'ALL' | 'HOT' | 'COLD'
  const [selectedMatchTooltip, setSelectedMatchTooltip] = useState(null)
  const [inspectedPlayer, setInspectedPlayer] = useState(null)
  const [isAwardsModalOpen, setIsAwardsModalOpen] = useState(false)

  // Safe helper to extract player info from either row or row.player
  const getPlayerInfo = (item) => {
    const name = item.name || item.player?.name || 'Player'
    const color = item.avatar_color || item.player?.avatar_color || '#3b82f6'
    const gamertag = item.gamertag || item.player?.gamertag || ''
    const id = item.id || item.player?.id || Math.random().toString()
    const gf = item.gf ?? item.goalsFor ?? 0
    const ga = item.ga ?? item.goalsAgainst ?? 0
    const w = item.w ?? item.won ?? 0
    const p = item.p ?? item.played ?? 0
    const pts = item.pts ?? item.points ?? 0
    return { id, name, color, gamertag, gf, ga, w, p, pts }
  }

  // 1. Calculate Clean Sheets from completed matches (excluding 24h forfeits)
  const cleanSheetsData = useMemo(() => {
    const map = {}

    standings.forEach(item => {
      const info = getPlayerInfo(item)
      map[info.id] = {
        ...info,
        cleanSheets: 0,
        shutoutMatches: []
      }
    })

    Object.values(playersMap).forEach(p => {
      if (p?.id && !map[p.id]) {
        map[p.id] = {
          id: p.id,
          name: p.name || 'Player',
          color: p.avatar_color || '#3b82f6',
          gamertag: p.gamertag || '',
          gf: 0, ga: 0, w: 0, p: 0, pts: 0,
          cleanSheets: 0,
          shutoutMatches: []
        }
      }
    })

    fixtures.forEach(f => {
      if (f.status === 'COMPLETED' && f.home_score !== null && f.away_score !== null) {
        const hScore = Number(f.home_score)
        const aScore = Number(f.away_score)

        if (aScore === 0 && f.home_player_id) {
          if (!map[f.home_player_id]) {
            const p = playersMap[f.home_player_id] || {}
            map[f.home_player_id] = {
              id: f.home_player_id,
              name: p.name || 'Player',
              color: p.avatar_color || '#3b82f6',
              gamertag: p.gamertag || '',
              gf: 0, ga: 0, w: 0, p: 0, pts: 0,
              cleanSheets: 0,
              shutoutMatches: []
            }
          }
          map[f.home_player_id].cleanSheets += 1
          map[f.home_player_id].shutoutMatches.push({
            round: f.round_number,
            opponentName: playersMap[f.away_player_id]?.name || 'Opponent',
            score: `${hScore} - ${aScore}`,
            isHome: true
          })
        }

        if (hScore === 0 && f.away_player_id) {
          if (!map[f.away_player_id]) {
            const p = playersMap[f.away_player_id] || {}
            map[f.away_player_id] = {
              id: f.away_player_id,
              name: p.name || 'Player',
              color: p.avatar_color || '#3b82f6',
              gamertag: p.gamertag || '',
              gf: 0, ga: 0, w: 0, p: 0, pts: 0,
              cleanSheets: 0,
              shutoutMatches: []
            }
          }
          map[f.away_player_id].cleanSheets += 1
          map[f.away_player_id].shutoutMatches.push({
            round: f.round_number,
            opponentName: playersMap[f.home_player_id]?.name || 'Opponent',
            score: `${aScore} - ${hScore}`,
            isHome: false
          })
        }
      }
    })

    return Object.values(map).sort((a, b) => {
      if (b.cleanSheets !== a.cleanSheets) return b.cleanSheets - a.cleanSheets
      if (a.ga !== b.ga) return a.ga - b.ga
      return b.pts - a.pts
    })
  }, [standings, fixtures, playersMap])

  const goldenGloveLeader = cleanSheetsData[0] && cleanSheetsData[0].cleanSheets > 0 ? cleanSheetsData[0] : null
  const goldenGloveTop5 = showAllCleanSheets ? cleanSheetsData : cleanSheetsData.slice(0, 5)

  // 2. Form Guide & Streaks Calculation
  const formGuideData = useMemo(() => {
    const map = {}

    standings.forEach(item => {
      const info = getPlayerInfo(item)
      map[info.id] = {
        ...info,
        history: []
      }
    })

    Object.values(playersMap).forEach(p => {
      if (p?.id && !map[p.id]) {
        map[p.id] = {
          id: p.id,
          name: p.name || 'Player',
          color: p.avatar_color || '#3b82f6',
          gamertag: p.gamertag || '',
          gf: 0, ga: 0, w: 0, p: 0, pts: 0,
          history: []
        }
      }
    })

    // Sort completed fixtures chronologically by round number
    const completedFixtures = fixtures
      .filter(f => f.status === 'COMPLETED' || f.status === 'EXPIRED_DISQUALIFIED')
      .sort((a, b) => (a.round_number || 0) - (b.round_number || 0) || (a.id || '').localeCompare(b.id || ''))

    completedFixtures.forEach(f => {
      const isForfeit = f.status === 'EXPIRED_DISQUALIFIED'
      const hScore = Number(f.home_score ?? 0)
      const aScore = Number(f.away_score ?? 0)

      // Home player result
      if (f.home_player_id && map[f.home_player_id]) {
        let res = 'D'
        let pts = 1
        if (isForfeit) {
          res = 'L'
          pts = 0
        } else if (hScore > aScore) {
          res = 'W'
          pts = 3
        } else if (hScore < aScore) {
          res = 'L'
          pts = 0
        }

        map[f.home_player_id].history.push({
          matchId: f.id,
          round: f.round_number,
          result: res,
          points: pts,
          opponentName: playersMap[f.away_player_id]?.name || 'Opponent',
          score: isForfeit ? '0 - 0 (Forfeit)' : `${hScore} - ${aScore}`,
          isHome: true
        })
      }

      // Away player result
      if (f.away_player_id && map[f.away_player_id]) {
        let res = 'D'
        let pts = 1
        if (isForfeit) {
          res = 'L'
          pts = 0
        } else if (aScore > hScore) {
          res = 'W'
          pts = 3
        } else if (aScore < hScore) {
          res = 'L'
          pts = 0
        }

        map[f.away_player_id].history.push({
          matchId: f.id,
          round: f.round_number,
          result: res,
          points: pts,
          opponentName: playersMap[f.home_player_id]?.name || 'Opponent',
          score: isForfeit ? '0 - 0 (Forfeit)' : `${aScore} - ${hScore}`,
          isHome: false
        })
      }
    })

    // Calculate streaks and last 5 form sequence
    return Object.values(map).map(player => {
      const totalMatches = player.history.length
      const recentForm = player.history.slice(-5)
      const formPoints = recentForm.reduce((sum, m) => sum + m.points, 0)

      let streak = null
      if (totalMatches > 0) {
        const reversed = [...player.history].reverse()
        const latest = reversed[0].result

        if (latest === 'W') {
          let winCount = 0
          for (const m of reversed) {
            if (m.result === 'W') winCount++
            else break
          }
          if (winCount >= 2) {
            streak = {
              type: 'HOT',
              category: 'WIN_STREAK',
              badge: `${winCount}-match win streak`,
              short: `${winCount}W Streak`,
              icon: '🔥',
              count: winCount
            }
          } else {
            let unbeatenCount = 0
            for (const m of reversed) {
              if (m.result === 'W' || m.result === 'D') unbeatenCount++
              else break
            }
            if (unbeatenCount >= 3) {
              streak = {
                type: 'HOT',
                category: 'UNBEATEN',
                badge: `Unbeaten in ${unbeatenCount}`,
                short: `${unbeatenCount} Unbeaten`,
                icon: '🔥',
                count: unbeatenCount
              }
            }
          }
        } else if (latest === 'D') {
          let unbeatenCount = 0
          for (const m of reversed) {
            if (m.result === 'W' || m.result === 'D') unbeatenCount++
            else break
          }
          if (unbeatenCount >= 3) {
            streak = {
              type: 'HOT',
              category: 'UNBEATEN',
              badge: `Unbeaten in ${unbeatenCount}`,
              short: `${unbeatenCount} Unbeaten`,
              icon: '🔥',
              count: unbeatenCount
            }
          } else {
            let winlessCount = 0
            for (const m of reversed) {
              if (m.result === 'D' || m.result === 'L') winlessCount++
              else break
            }
            if (winlessCount >= 2) {
              streak = {
                type: 'COLD',
                category: 'WINLESS',
                badge: `Winless in ${winlessCount}`,
                short: `${winlessCount} Winless`,
                icon: '❄️',
                count: winlessCount
              }
            }
          }
        } else if (latest === 'L') {
          let loseCount = 0
          for (const m of reversed) {
            if (m.result === 'L') loseCount++
            else break
          }
          if (loseCount >= 2) {
            streak = {
              type: 'COLD',
              category: 'LOSE_STREAK',
              badge: `${loseCount}-match losing streak`,
              short: `${loseCount}L Streak`,
              icon: '❄️',
              count: loseCount
            }
          } else {
            let winlessCount = 0
            for (const m of reversed) {
              if (m.result === 'L' || m.result === 'D') winlessCount++
              else break
            }
            if (winlessCount >= 2) {
              streak = {
                type: 'COLD',
                category: 'WINLESS',
                badge: `Winless in ${winlessCount}`,
                short: `${winlessCount} Winless`,
                icon: '❄️',
                count: winlessCount
              }
            }
          }
        }
      }

      return {
        ...player,
        recentForm,
        formPoints,
        streak
      }
    }).sort((a, b) => {
      // Sort primarily by form points, then overall points, then goal difference
      if (b.formPoints !== a.formPoints) return b.formPoints - a.formPoints
      if (b.pts !== a.pts) return b.pts - a.pts
      return (b.gf - b.ga) - (a.gf - a.ga)
    })
  }, [standings, fixtures, playersMap])

  // Filter form guide based on active selection
  const filteredFormGuide = useMemo(() => {
    if (formFilter === 'HOT') {
      return formGuideData.filter(p => p.streak?.type === 'HOT')
    }
    if (formFilter === 'COLD') {
      return formGuideData.filter(p => p.streak?.type === 'COLD')
    }
    return formGuideData
  }, [formGuideData, formFilter])

  // Form guide stats
  const hotStreaksCount = formGuideData.filter(p => p.streak?.type === 'HOT').length
  const coldStreaksCount = formGuideData.filter(p => p.streak?.type === 'COLD').length
  const formLeader = formGuideData[0]?.recentForm?.length > 0 ? formGuideData[0] : null

  // 3. Top attack (all and visible slice)
  const allAttack = useMemo(() => {
    return [...standings]
      .map(getPlayerInfo)
      .sort((a, b) => b.gf - a.gf || b.pts - a.pts || a.p - b.p)
  }, [standings])
  const topAttack = showAllAttack ? allAttack : allAttack.slice(0, 5)
  const topAttackLeader = allAttack[0] && allAttack[0].gf > 0 ? allAttack[0] : null

  // 4. Best defense (min 1 match played, all and visible slice)
  const allDefense = useMemo(() => {
    return [...standings]
      .map(getPlayerInfo)
      .filter(s => s.p > 0)
      .sort((a, b) => a.ga - b.ga || b.pts - a.pts || b.p - a.p)
  }, [standings])
  const bestDefense = showAllDefense ? allDefense : allDefense.slice(0, 5)
  const bestDefenseLeader = allDefense[0] || null

  // 5. Most wins (all and visible slice)
  const allWins = useMemo(() => {
    return [...standings]
      .map(getPlayerInfo)
      .sort((a, b) => b.w - a.w || b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga))
  }, [standings])
  const mostWins = showAllWins ? allWins : allWins.slice(0, 5)
  const mostWinsLeader = allWins[0] && allWins[0].w > 0 ? allWins[0] : null

  // Dynamic Spotlight Config based on activeCategory
  const spotlightConfig = useMemo(() => {
    switch (activeCategory) {
      case 'TOP_ATTACK':
        return {
          key: 'TOP_ATTACK',
          icon: '🔥',
          iconBg: 'from-amber-500 to-orange-400 shadow-amber-500/25',
          bannerBg: 'from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-amber-500/50',
          badgeText: 'Official Award',
          badgeSub: 'Golden Boot Championship',
          badgeSubColor: 'text-amber-700 dark:text-amber-400',
          badgeTagBg: 'bg-amber-500 text-slate-950',
          title: 'Top Attack & Golden Boot Leaderboard',
          description: 'Awarded to the deadliest goalscorer with the highest total goals scored across all completed league matches.',
          leader: topAttackLeader,
          leaderCrown: '#1 Golden Boot Leader',
          leaderCrownColor: 'text-amber-700 dark:text-amber-400',
          leaderBorder: 'border-amber-400 dark:border-amber-500/50',
          leaderStatPrimary: topAttackLeader ? `${topAttackLeader.gf} Goal${topAttackLeader.gf !== 1 ? 's' : ''}` : '',
          leaderStatSecondary: topAttackLeader && topAttackLeader.p > 0 ? `${(topAttackLeader.gf / topAttackLeader.p).toFixed(1)} goals/game` : null,
          leaderStatColor: 'text-amber-600 dark:text-amber-400',
          emptyTitle: 'Race In Progress',
          emptyDesc: 'Score goals in completed matches to claim #1 🔥'
        }
      case 'BEST_DEFENSE':
        return {
          key: 'BEST_DEFENSE',
          icon: '🛡️',
          iconBg: 'from-teal-500 to-emerald-400 shadow-teal-500/25',
          bannerBg: 'from-teal-500/10 via-emerald-500/10 to-cyan-500/10 border-2 border-teal-500/50',
          badgeText: 'Official Award',
          badgeSub: 'Iron Defense Honors',
          badgeSubColor: 'text-teal-700 dark:text-teal-400',
          badgeTagBg: 'bg-teal-500 text-slate-950',
          title: 'Best Defense Leaderboard',
          description: 'Awarded to the most disciplined defensive player with the fewest goals conceded this season.',
          leader: bestDefenseLeader,
          leaderCrown: '#1 Best Defense Leader',
          leaderCrownColor: 'text-teal-700 dark:text-teal-400',
          leaderBorder: 'border-teal-400 dark:border-teal-500/50',
          leaderStatPrimary: bestDefenseLeader ? `${bestDefenseLeader.ga} Conceded in ${bestDefenseLeader.p} match${bestDefenseLeader.p !== 1 ? 'es' : ''}` : '',
          leaderStatSecondary: bestDefenseLeader && bestDefenseLeader.p > 0 ? `${(bestDefenseLeader.ga / bestDefenseLeader.p).toFixed(1)} avg/game` : null,
          leaderStatColor: 'text-teal-600 dark:text-teal-400',
          emptyTitle: 'Race In Progress',
          emptyDesc: 'Complete matches to establish defensive record 🛡️'
        }
      case 'MOST_WINS':
        return {
          key: 'MOST_WINS',
          icon: '🏆',
          iconBg: 'from-cyan-500 to-blue-400 shadow-cyan-500/25',
          bannerBg: 'from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border-2 border-cyan-500/50',
          badgeText: 'Official Award',
          badgeSub: 'League Dominator',
          badgeSubColor: 'text-cyan-700 dark:text-cyan-400',
          badgeTagBg: 'bg-cyan-500 text-slate-950',
          title: 'Most Wins & Victories Leaderboard',
          description: 'Awarded to the player with the highest number of match victories across the season.',
          leader: mostWinsLeader,
          leaderCrown: '#1 Most Wins Leader',
          leaderCrownColor: 'text-cyan-700 dark:text-cyan-400',
          leaderBorder: 'border-cyan-400 dark:border-cyan-500/50',
          leaderStatPrimary: mostWinsLeader ? `${mostWinsLeader.w} Victor${mostWinsLeader.w !== 1 ? 'ies' : 'y'}` : '',
          leaderStatSecondary: mostWinsLeader && mostWinsLeader.p > 0 ? `${Math.round((mostWinsLeader.w / mostWinsLeader.p) * 100)}% Win Rate` : null,
          leaderStatColor: 'text-cyan-600 dark:text-cyan-400',
          emptyTitle: 'Race In Progress',
          emptyDesc: 'Win matches to climb to #1 🏆'
        }
      case 'GOLDEN_GLOVE':
      default:
        return {
          key: 'GOLDEN_GLOVE',
          icon: '🧤',
          iconBg: 'from-emerald-500 to-teal-300 shadow-emerald-500/20',
          bannerBg: 'from-emerald-500/10 via-amber-500/10 to-teal-500/10 border-2 border-emerald-500/40',
          badgeText: 'Official Award',
          badgeSub: 'Golden Glove Championship',
          badgeSubColor: 'text-emerald-700 dark:text-emerald-400',
          badgeTagBg: 'bg-emerald-500 text-slate-950',
          title: 'Clean Sheets Leaderboard',
          description: 'Awarded to the player who kept the most shutouts (conceding 0 goals) across all completed league matches.',
          leader: goldenGloveLeader,
          leaderCrown: '#1 Golden Glove Leader',
          leaderCrownColor: 'text-amber-700 dark:text-amber-400',
          leaderBorder: 'border-emerald-400 dark:border-emerald-500/50',
          leaderStatPrimary: goldenGloveLeader ? `${goldenGloveLeader.cleanSheets} Clean Sheet${goldenGloveLeader.cleanSheets !== 1 ? 's' : ''}` : '',
          leaderStatSecondary: goldenGloveLeader && goldenGloveLeader.p > 0 ? `${Math.round((goldenGloveLeader.cleanSheets / goldenGloveLeader.p) * 100)}% CS Rate` : null,
          leaderStatColor: 'text-emerald-600 dark:text-emerald-400',
          emptyTitle: 'Race In Progress',
          emptyDesc: 'Concede 0 goals in any match to claim #1 🧤'
        }
    }
  }, [activeCategory, goldenGloveLeader, topAttackLeader, bestDefenseLeader, mostWinsLeader])

  // 6. Forfeited fixtures
  const forfeits = fixtures.filter(f => f.status === 'EXPIRED_DISQUALIFIED')

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      
      {/* Dynamic Spotlight Banner (Switches based on activeCategory) */}
      <div className={`bg-gradient-to-r ${spotlightConfig.bannerBg} rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-xl relative overflow-hidden transition-all duration-300`}>
        
        {/* Category Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline">
            Spotlight Category:
          </span>
          <button
            onClick={() => setActiveCategory('GOLDEN_GLOVE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'GOLDEN_GLOVE'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span>🧤</span>
            <span>Golden Glove</span>
          </button>
          <button
            onClick={() => setActiveCategory('TOP_ATTACK')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'TOP_ATTACK'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span>🔥</span>
            <span>Top Attack</span>
          </button>
          <button
            onClick={() => setActiveCategory('BEST_DEFENSE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'BEST_DEFENSE'
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span>🛡️</span>
            <span>Best Defense</span>
          </button>
          <button
            onClick={() => setActiveCategory('MOST_WINS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'MOST_WINS'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span>🏆</span>
            <span>Most Wins</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${spotlightConfig.iconBg} flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shrink-0`}>
              {spotlightConfig.icon}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-0.5">
                <span className={`text-[10px] font-black uppercase tracking-wider ${spotlightConfig.badgeTagBg} px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs`}>
                  <Award className="w-3 h-3" /> {spotlightConfig.badgeText}
                </span>
                <span className={`text-xs font-bold ${spotlightConfig.badgeSubColor}`}>
                  {spotlightConfig.badgeSub}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-heading">
                {spotlightConfig.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {spotlightConfig.description}
              </p>
            </div>
          </div>

          {/* Right: Current Frontrunner & Share Awards Poster Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
            {spotlightConfig.leader ? (
              <div
                onClick={() => setInspectedPlayer(spotlightConfig.leader)}
                title="Click to view detailed player profile card"
                className={`w-full sm:w-auto bg-white dark:bg-slate-900/90 border ${spotlightConfig.leaderBorder} p-3 rounded-2xl shadow-md flex items-center gap-3 shrink-0 cursor-pointer hover:scale-[1.02] active:scale-95 transition`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-black text-xs shadow shrink-0"
                  style={{ backgroundColor: spotlightConfig.leader.color }}
                >
                  {spotlightConfig.leader.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className={`text-[10px] ${spotlightConfig.leaderCrownColor} font-extrabold uppercase flex items-center gap-1`}>
                    <Crown className="w-3 h-3 text-amber-500" /> {spotlightConfig.leaderCrown}
                  </span>
                  <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{spotlightConfig.leader.name}</span>
                    <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 underline">View Card →</span>
                  </p>
                  <p className={`text-xs font-bold ${spotlightConfig.leaderStatColor} font-mono`}>
                    {spotlightConfig.leaderStatPrimary}
                    {spotlightConfig.leaderStatSecondary && ` • ${spotlightConfig.leaderStatSecondary}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full sm:w-auto bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 shrink-0">
                <span className="font-semibold block text-slate-700 dark:text-slate-300">{spotlightConfig.emptyTitle}</span>
                <span>{spotlightConfig.emptyDesc}</span>
              </div>
            )}

            {/* Share Awards Poster Button */}
            <button
              onClick={() => setIsAwardsModalOpen(true)}
              title="Generate & Share High-Definition Awards Poster for WhatsApp"
              className="w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Share Awards Poster 📸</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards (Responsive Grid - Click to spotlight & View All toggles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Golden Glove (Clean Sheets) */}
        <div
          onClick={() => setActiveCategory('GOLDEN_GLOVE')}
          className={`bg-white dark:bg-[#121826] rounded-2xl p-4 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all ${
            activeCategory === 'GOLDEN_GLOVE'
              ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10'
              : 'border border-slate-200 dark:border-[#1f2b42] hover:border-emerald-300 dark:hover:border-emerald-500/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-[#1b253a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm shadow-xs">
                  🧤
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <span>Golden Glove</span>
                  </h3>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Most Clean Sheets</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeCategory === 'GOLDEN_GLOVE' && (
                  <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    Active
                  </span>
                )}
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  0 Conceded
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {goldenGloveTop5.map((player, idx) => {
                const isSelected = selectedCleanSheetPlayer?.id === player.id
                const hasShutouts = player.cleanSheets > 0

                return (
                  <div key={player.id} className="flex flex-col">
                    <div
                      className={`flex items-center justify-between text-xs p-1.5 rounded-xl transition ${
                        isSelected ? 'bg-emerald-50 dark:bg-slate-800/80 border border-emerald-300 dark:border-emerald-500/40' : ''
                      }`}
                    >
                      {/* Clicking avatar or name opens Player Profile Modal */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          setInspectedPlayer(player)
                        }}
                        title="Click to view detailed player profile card"
                        className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition"
                      >
                        <span className={`w-5 text-center font-bold font-mono text-xs ${
                          idx === 0 && player.cleanSheets > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div
                          className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-950 shadow-sm"
                          style={{ backgroundColor: player.color }}
                        >
                          {(player.name || 'P').substring(0, 1).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate block hover:underline">
                            {player.name}
                          </span>
                        </div>
                      </div>

                      {/* Clicking clean sheets badge toggles shutouts list */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          if (hasShutouts) {
                            setSelectedCleanSheetPlayer(isSelected ? null : player)
                          }
                        }}
                        className={`flex items-center gap-1.5 shrink-0 ${hasShutouts ? 'cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-slate-700/50 px-1.5 py-0.5 rounded-lg' : ''}`}
                      >
                        <div className="text-right">
                          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                            {player.cleanSheets}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">
                            {player.cleanSheets === 1 ? 'sheet' : 'sheets'}
                          </span>
                        </div>
                        {hasShutouts && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expandable shutout matches log */}
                    {isSelected && player.shutoutMatches.length > 0 && (
                      <div className="mt-1 ml-7 mr-1 p-2 rounded-lg bg-emerald-50/80 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-500/30 text-[10px] space-y-1 animate-in fade-in duration-150">
                        <span className="font-bold text-emerald-800 dark:text-emerald-400 block uppercase tracking-wider text-[9px]">
                          Shutout Matches:
                        </span>
                        {player.shutoutMatches.map((m, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span>Wk {m.round} vs <strong>{m.opponentName}</strong></span>
                            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{m.score}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {goldenGloveTop5.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-2">No stats yet</p>
              )}
            </div>
          </div>

          {cleanSheetsData.length > 5 && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAllCleanSheets(!showAllCleanSheets)
                }}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                {showAllCleanSheets ? 'Show Top 5' : `View All (${cleanSheetsData.length})`}
              </button>
            </div>
          )}
        </div>

        {/* 2. Top Attack */}
        <div
          onClick={() => setActiveCategory('TOP_ATTACK')}
          className={`bg-white dark:bg-[#121826] rounded-2xl p-4 shadow-sm dark:shadow-lg flex flex-col justify-between cursor-pointer transition-all ${
            activeCategory === 'TOP_ATTACK'
              ? 'border-2 border-amber-500 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10'
              : 'border border-slate-200 dark:border-[#1f2b42] hover:border-amber-300 dark:hover:border-amber-500/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-[#1b253a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Top Attack</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Most Goals Scored</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeCategory === 'TOP_ATTACK' && (
                  <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    Active
                  </span>
                )}
                <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  Goals
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {topAttack.map((player, idx) => (
                <div
                  key={player.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setInspectedPlayer(player)
                  }}
                  title="Click to view detailed player profile card"
                  className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center font-bold text-slate-400 font-mono text-xs">#{idx + 1}</span>
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {(player.name || 'P').substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-200 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    <span>{player.gf}</span>
                    <span className="text-[10px] text-slate-500 font-normal">goals</span>
                  </div>
                </div>
              ))}
              {topAttack.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-2">No stats yet</p>
              )}
            </div>
          </div>

          {allAttack.length > 5 && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAllAttack(!showAllAttack)
                }}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {showAllAttack ? 'Show Top 5' : `View All (${allAttack.length})`}
              </button>
            </div>
          )}
        </div>

        {/* 3. Best Defense */}
        <div
          onClick={() => setActiveCategory('BEST_DEFENSE')}
          className={`bg-white dark:bg-[#121826] rounded-2xl p-4 shadow-sm dark:shadow-lg flex flex-col justify-between cursor-pointer transition-all ${
            activeCategory === 'BEST_DEFENSE'
              ? 'border-2 border-teal-500 ring-2 ring-teal-500/25 shadow-md shadow-teal-500/10'
              : 'border border-slate-200 dark:border-[#1f2b42] hover:border-teal-300 dark:hover:border-teal-500/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-[#1b253a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-500/10 border border-teal-300 dark:border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Best Defense</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Fewest Conceded</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeCategory === 'BEST_DEFENSE' && (
                  <span className="text-[9px] bg-teal-500 text-slate-950 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    Active
                  </span>
                )}
                <span className="text-[10px] bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  Defense
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {bestDefense.map((player, idx) => (
                <div
                  key={player.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setInspectedPlayer(player)
                  }}
                  title="Click to view detailed player profile card"
                  className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center font-bold text-slate-400 font-mono text-xs">#{idx + 1}</span>
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {(player.name || 'P').substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-teal-600 dark:text-teal-400 shrink-0">
                    <span>{player.ga}</span>
                    <span className="text-[10px] text-slate-500 font-normal">conceded</span>
                  </div>
                </div>
              ))}
              {bestDefense.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-2">Play matches to track defense</p>
              )}
            </div>
          </div>

          {allDefense.length > 5 && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAllDefense(!showAllDefense)
                }}
                className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                {showAllDefense ? 'Show Top 5' : `View All (${allDefense.length})`}
              </button>
            </div>
          )}
        </div>

        {/* 4. Most Wins */}
        <div
          onClick={() => setActiveCategory('MOST_WINS')}
          className={`bg-white dark:bg-[#121826] rounded-2xl p-4 shadow-sm dark:shadow-lg flex flex-col justify-between cursor-pointer transition-all ${
            activeCategory === 'MOST_WINS'
              ? 'border-2 border-cyan-500 ring-2 ring-cyan-500/25 shadow-md shadow-cyan-500/10'
              : 'border border-slate-200 dark:border-[#1f2b42] hover:border-cyan-300 dark:hover:border-cyan-500/30'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-[#1b253a]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Most Wins</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Total Victories</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {activeCategory === 'MOST_WINS' && (
                  <span className="text-[9px] bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    Active
                  </span>
                )}
                <span className="text-[10px] bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold">
                  Victories
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {mostWins.map((player, idx) => (
                <div
                  key={player.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setInspectedPlayer(player)
                  }}
                  title="Click to view detailed player profile card"
                  className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center font-bold text-slate-400 font-mono text-xs">#{idx + 1}</span>
                    <div
                      className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {(player.name || 'P').substring(0, 1).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
                    <span>{player.w}</span>
                    <span className="text-[10px] text-slate-500 font-normal">wins</span>
                  </div>
                </div>
              ))}
              {mostWins.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-2">No stats yet</p>
              )}
            </div>
          </div>

          {allWins.length > 5 && (
            <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAllWins(!showAllWins)
                }}
                className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                {showAllWins ? 'Show Top 5' : `View All (${allWins.length})`}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 5. 🔥 Form Guide & Win Streaks Tracker (Last 5 Matches) */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-3xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4">
        
        {/* Header & Quick Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1b253a]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
                <Activity className="w-4 h-4 text-amber-500" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <span>Recent Form & Streaks Tracker</span>
                <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  Last 5 Matches
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent momentum sequence (Oldest ➡️ Latest), form points, and active hot & cold streaks.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-inner shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setFormFilter('ALL')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                formFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>All ({formGuideData.length})</span>
            </button>
            <button
              onClick={() => setFormFilter('HOT')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                formFilter === 'HOT'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-500'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Hot ({hotStreaksCount})</span>
            </button>
            <button
              onClick={() => setFormFilter('COLD')}
              className={`flex-1 sm:flex-none px-3 py-1 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                formFilter === 'COLD'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-sky-600 dark:text-sky-400 hover:text-sky-500'
              }`}
            >
              <Snowflake className="w-3 h-3" />
              <span>Cold ({coldStreaksCount})</span>
            </button>
          </div>
        </div>

        {/* Form Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3 text-center">Form Sequence (Oldest ➡️ Latest)</th>
                <th className="py-2.5 px-3 text-center">Form Pts</th>
                <th className="py-2.5 px-3 text-right">Active Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredFormGuide.map((p, idx) => {
                const totalPlayed = p.recentForm.length

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Player Info - Clicking opens Profile Card */}
                    <td
                      onClick={() => setInspectedPlayer(p)}
                      title="Click to view detailed player profile card"
                      className="py-3 px-3 cursor-pointer hover:opacity-85 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-[140px]">
                        <span className="w-5 text-center font-mono font-bold text-slate-400 text-xs">
                          #{idx + 1}
                        </span>
                        <div
                          className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-bold text-[10px] shadow-sm"
                          style={{ backgroundColor: p.color }}
                        >
                          {(p.name || 'P').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 dark:text-white truncate hover:underline">
                            {p.name}
                          </p>
                          {p.gamertag && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              @{p.gamertag}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Form Pills (5 slots) */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        {totalPlayed === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No matches played</span>
                        ) : (
                          <>
                            {/* Empty placeholders if played fewer than 5 */}
                            {Array.from({ length: Math.max(0, 5 - totalPlayed) }).map((_, emptyIdx) => (
                              <div
                                key={`empty-${emptyIdx}`}
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-mono text-slate-400 dark:text-slate-600"
                              >
                                -
                              </div>
                            ))}

                            {/* Actual match pills */}
                            {p.recentForm.map((m, mIdx) => {
                              const isWin = m.result === 'W'
                              const isDraw = m.result === 'D'
                              const isLoss = m.result === 'L'

                              return (
                                <div
                                  key={mIdx}
                                  title={`Week ${m.round}: vs ${m.opponentName} (${m.score}) • ${isWin ? 'Win (+3 pts)' : isDraw ? 'Draw (+1 pt)' : 'Loss (0 pts)'}`}
                                  onClick={() => setSelectedMatchTooltip(m)}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black cursor-pointer shadow-xs transition hover:scale-115 active:scale-95 ${
                                    isWin
                                      ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                                      : isDraw
                                      ? 'bg-slate-400 dark:bg-slate-600 text-white hover:bg-slate-300'
                                      : 'bg-rose-500 text-white hover:bg-rose-400'
                                  }`}
                                >
                                  {m.result}
                                </div>
                              )
                            })}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Form Points */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                          {p.formPoints} <span className="text-[10px] text-slate-400 font-normal">/ {totalPlayed * 3}</span>
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                          {totalPlayed > 0 ? `${Math.round((p.formPoints / (totalPlayed * 3)) * 100)}% PTS` : '0%'}
                        </span>
                      </div>
                    </td>

                    {/* Active Streak Badge */}
                    <td className="py-3 px-3 text-right">
                      {p.streak ? (
                        p.streak.type === 'HOT' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 shadow-xs">
                            <span>🔥</span>
                            <span>{p.streak.badge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-900 border border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 shadow-xs">
                            <span>❄️</span>
                            <span>{p.streak.badge}</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono italic">
                          {totalPlayed > 0 ? 'Neutral' : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {filteredFormGuide.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-xs text-slate-500 italic">
                    {formFilter === 'HOT' && 'No players currently on a 2+ win streak or 3+ unbeaten streak.'}
                    {formFilter === 'COLD' && 'No players currently on a 2+ losing or winless streak.'}
                    {formFilter === 'ALL' && 'No matches have been completed yet this season.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Match Details Pop-card */}
        {selectedMatchTooltip && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-5 h-5 rounded flex items-center justify-center font-black text-[10px] text-white shrink-0 ${
                selectedMatchTooltip.result === 'W' ? 'bg-emerald-500' : selectedMatchTooltip.result === 'D' ? 'bg-slate-500' : 'bg-rose-500'
              }`}>
                {selectedMatchTooltip.result}
              </span>
              <span className="text-slate-800 dark:text-slate-200 truncate">
                Week {selectedMatchTooltip.round} vs <strong>{selectedMatchTooltip.opponentName}</strong>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {selectedMatchTooltip.score}
              </span>
            </div>
            <button
              onClick={() => setSelectedMatchTooltip(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

      </div>

      {/* 6. ⚔️ Head-to-Head (H2H) Rivalry Tool (Single Season + All-Time All Seasons) */}
      <HeadToHeadSection
        standings={standings}
        fixtures={fixtures}
        playersMap={playersMap}
        activeTournament={activeTournament}
        allOrgTournaments={allOrgTournaments}
        activeOrg={activeOrg}
        playoffsData={playoffsData}
      />

      {/* 7. 24-Hour Forfeit Log */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2 font-heading">
          <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span>24-Hour Forfeit Incident Log</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Matches marked as forfeit due to deadline expiry (awarded 0 points each, counted as +1 played)
        </p>

        {forfeits.length === 0 ? (
          <div className="p-6 text-center text-xs text-emerald-700 dark:text-emerald-400/80 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
            Great sportsmanship! No matches have been forfeited this season.
          </div>
        ) : (
          <div className="space-y-2.5">
            {forfeits.map((f) => {
              const home = playersMap[f.home_player_id]?.name || 'Home'
              const away = playersMap[f.away_player_id]?.name || 'Away'
              return (
                <div
                  key={f.id}
                  className="bg-rose-50/60 dark:bg-[#0e131d] border border-rose-200 dark:border-rose-500/30 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-[10px] border border-rose-200 dark:border-rose-500/30 shadow-sm shrink-0">
                      Week {f.round_number}
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm truncate">
                      {home} <span className="text-slate-400 dark:text-slate-500 font-medium text-xs px-1">vs</span> {away}
                    </span>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                    <span className="text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">0 - 0 (0 pts)</span>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-medium">{f.notes || 'Organizer 24h Forfeit'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 8. 👤 Detailed Player Profile Modal */}
      <PlayerProfileModal
        isOpen={Boolean(inspectedPlayer)}
        onClose={() => setInspectedPlayer(null)}
        player={inspectedPlayer}
        standings={standings}
        fixtures={fixtures}
        playersMap={playersMap}
        seasonName={activeTournament?.name || 'Season 1'}
      />

      {/* 9. 📸 Shareable Awards Graphic Modal */}
      <AwardsGraphicModal
        isOpen={isAwardsModalOpen}
        onClose={() => setIsAwardsModalOpen(false)}
        standings={standings}
        fixtures={fixtures}
        playersMap={playersMap}
        orgName={activeOrg?.name || 'club 18'}
        seasonName={activeTournament?.name || 'Season 1'}
      />

    </div>
  )
}
