import React, { useState, useMemo } from 'react'
import { Calendar, Filter, CheckCircle2, AlertTriangle, Clock, ArrowRight, Play, CheckCircle, Sparkles, Lock, Shield, Search, X, Users, RotateCcw, Share2 } from 'lucide-react'

export default function FixturesList({
  fixtures,
  playersMap,
  isAdmin,
  onSelectFixture,
  onGenerateFixtures,
  onNavigateToSetup,
  onOpenGraphic,
  onOpenWeekGraphic
}) {
  const [selectedRound, setSelectedRound] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayerA, setSelectedPlayerA] = useState('ALL')
  const [selectedPlayerB, setSelectedPlayerB] = useState('ALL')

  // Get distinct rounds / weeks in chronological order
  const allTotalRounds = Array.from(new Set(fixtures.map(f => f.round_number))).sort((a, b) => a - b)

  // Current active round: earliest round with at least one pending match
  const firstPendingRound = allTotalRounds.find(r => fixtures.some(f => f.round_number === r && f.status === 'PENDING'))
  const currentActiveRound = firstPendingRound !== undefined 
    ? firstPendingRound 
    : (allTotalRounds.length > 0 ? allTotalRounds[allTotalRounds.length - 1] : 1)

  // Non-admins can only see past rounds and the current active round. Future rounds are locked.
  const visibleFixtures = isAdmin 
    ? fixtures 
    : fixtures.filter(f => f.round_number <= currentActiveRound)

  // Rounds available in filters
  const availableRounds = isAdmin
    ? allTotalRounds
    : allTotalRounds.filter(r => r <= currentActiveRound)

  // Safe fallback if selectedRound is outside unlocked range
  const effectiveSelectedRound = (!isAdmin && selectedRound !== 'ALL' && parseInt(selectedRound, 10) > currentActiveRound)
    ? 'ALL'
    : selectedRound

  // Extract all distinct players involved in fixtures or roster
  const sortedPlayers = useMemo(() => {
    const ids = Array.from(new Set([
      ...fixtures.map(f => f.home_player_id),
      ...fixtures.map(f => f.away_player_id),
      ...Object.keys(playersMap || {})
    ])).filter(id => id && id !== 'BYE')

    return ids.map(id => playersMap[id] || { id, name: id, gamertag: '' })
      .filter(p => p.name && p.name !== 'BYE')
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [fixtures, playersMap])

  // Filter visible fixtures by round, status, head-to-head players, and search term
  const filteredFixtures = visibleFixtures.filter(f => {
    // 1. Week filter
    if (effectiveSelectedRound !== 'ALL' && f.round_number !== parseInt(effectiveSelectedRound, 10)) {
      return false
    }
    // 2. Status filter
    if (selectedStatus === 'PENDING' && f.status !== 'PENDING') return false
    if (selectedStatus === 'COMPLETED' && f.status !== 'COMPLETED') return false
    if (selectedStatus === 'FORFEIT' && f.status !== 'EXPIRED_DISQUALIFIED') return false

    const home = playersMap[f.home_player_id] || { name: 'Player 1', gamertag: '' }
    const away = playersMap[f.away_player_id] || { name: 'Player 2', gamertag: '' }
    const homeName = (home.name || '').toLowerCase()
    const homeTag = (home.gamertag || '').toLowerCase()
    const awayName = (away.name || '').toLowerCase()
    const awayTag = (away.gamertag || '').toLowerCase()

    // 3. Head-to-Head User vs User selection
    if (selectedPlayerA !== 'ALL' && selectedPlayerB !== 'ALL') {
      const isMatchBetweenBoth =
        (f.home_player_id === selectedPlayerA && f.away_player_id === selectedPlayerB) ||
        (f.home_player_id === selectedPlayerB && f.away_player_id === selectedPlayerA)
      if (!isMatchBetweenBoth) return false
    } else if (selectedPlayerA !== 'ALL') {
      if (f.home_player_id !== selectedPlayerA && f.away_player_id !== selectedPlayerA) {
        return false
      }
    } else if (selectedPlayerB !== 'ALL') {
      if (f.home_player_id !== selectedPlayerB && f.away_player_id !== selectedPlayerB) {
        return false
      }
    }

    // 4. Search input term filter (supports "shibil", "@gamer", or "jadier vs taju")
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      const vsSeparator = term.includes(' vs ') ? ' vs ' : term.includes(' vs. ') ? ' vs. ' : term.includes(' - ') ? ' - ' : null
      if (vsSeparator) {
        const [part1, part2] = term.split(vsSeparator).map(s => s.trim())
        const matchForward = (homeName.includes(part1) || homeTag.includes(part1)) && (awayName.includes(part2) || awayTag.includes(part2))
        const matchReverse = (homeName.includes(part2) || homeTag.includes(part2)) && (awayName.includes(part1) || awayTag.includes(part1))
        if (!matchForward && !matchReverse) return false
      } else {
        const matchesHome = homeName.includes(term) || homeTag.includes(term)
        const matchesAway = awayName.includes(term) || awayTag.includes(term)
        if (!matchesHome && !matchesAway) return false
      }
    }

    return true
  })

  // Group filtered fixtures by round/week
  const groupedRounds = Array.from(new Set(filteredFixtures.map(f => f.round_number))).sort((a, b) => a - b)

  const pendingCount = visibleFixtures.filter(f => f.status === 'PENDING').length
  const completedCount = visibleFixtures.filter(f => f.status === 'COMPLETED').length
  const forfeitCount = visibleFixtures.filter(f => f.status === 'EXPIRED_DISQUALIFIED').length

  const hasActiveFilter = Boolean(
    searchTerm.trim() !== '' ||
    selectedPlayerA !== 'ALL' ||
    selectedPlayerB !== 'ALL' ||
    effectiveSelectedRound !== 'ALL' ||
    selectedStatus !== 'ALL'
  )

  const handleResetFilters = () => {
    setSearchTerm('')
    setSelectedPlayerA('ALL')
    setSelectedPlayerB('ALL')
    setSelectedRound('ALL')
    setSelectedStatus('ALL')
  }

  const formatLeg = (leg) => {
    if (!leg) return ''
    if (leg === 'LEG_1') return 'Leg 1'
    if (leg === 'LEG_2') return 'Leg 2'
    return leg
  }

  return (
    <div className="space-y-6">
      
      {/* Top Bar with Filters, Head-to-Head & Search */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-3.5 sm:p-5 space-y-3.5 shadow-sm dark:shadow-md">
        
        {/* Row 1: Title, Match Count & Admin Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" /> Fixtures & Scores
              </h2>
              <span className="text-[11px] sm:text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full font-mono font-medium">
                {isAdmin 
                  ? `${fixtures.length} matches • ${allTotalRounds.length} wks` 
                  : `${visibleFixtures.length} matches • Week ${currentActiveRound} of ${allTotalRounds.length}`}
              </span>
              {isAdmin ? (
                <span className="text-[10px] sm:text-[11px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin: All Weeks
                </span>
              ) : allTotalRounds.length > currentActiveRound ? (
                <span className="text-[10px] sm:text-[11px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Future Weeks Locked
                </span>
              ) : null}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin 
                ? 'Organizer mode: Full schedule access across all rounds.'
                : `Current active week: Week ${currentActiveRound}. Future weeks unlock automatically once this week concludes.`}
            </p>
          </div>

          {hasActiveFilter && (
            <button
              onClick={handleResetFilters}
              className="self-start sm:self-auto text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5 font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Row 2: Search Input & Dropdown Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1b253a]">
          
          {/* Quick Search Bar (Span 4 on md) */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search player or 'player vs player'..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Head-to-Head: User vs User Picker (Span 5 on md) */}
          <div className="md:col-span-5 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-xl px-2 py-1 shadow-sm">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            
            {/* Player 1 Select */}
            <select
              value={selectedPlayerA}
              onChange={(e) => setSelectedPlayerA(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer font-medium text-xs flex-1 truncate py-1"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">👤 Any Player</option>
              {sortedPlayers.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {p.name}
                </option>
              ))}
            </select>

            <span className="text-[10px] font-black tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/30 shrink-0">
              VS
            </span>

            {/* Player 2 Select */}
            <select
              value={selectedPlayerB}
              onChange={(e) => setSelectedPlayerB(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer font-medium text-xs flex-1 truncate py-1"
            >
              <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">👤 Any Opponent</option>
              {sortedPlayers.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Week & Status Selector (Span 3 on md) */}
          <div className="md:col-span-3 grid grid-cols-2 gap-2">
            {/* Week Selector */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-xl px-2 py-1.5 text-xs shadow-sm">
              <Filter className="w-3 h-3 text-slate-400 shrink-0" />
              <select
                value={effectiveSelectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer font-medium w-full text-xs truncate"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {isAdmin ? `All Wks (${allTotalRounds.length})` : `Wks (${availableRounds.length})`}
                </option>
                {availableRounds.map(r => (
                  <option key={r} value={r} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    Week {r} {r === currentActiveRound && !isAdmin ? '• (Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-xl px-2 py-1.5 text-xs shadow-sm">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-white focus:outline-none cursor-pointer font-medium w-full text-xs truncate"
              >
                <option value="ALL" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Status (All)</option>
                <option value="PENDING" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending ({pendingCount})</option>
                <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Completed ({completedCount})</option>
                <option value="FORFEIT" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Forfeit ({forfeitCount})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 3: Active Filters Summary Chips */}
        {hasActiveFilter && (
          <div className="pt-2 flex items-center justify-between gap-2 flex-wrap text-xs border-t border-slate-100 dark:border-[#1a2336]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Active Filters:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 hover:text-emerald-900" /></button>
                </span>
              )}

              {selectedPlayerA !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                  Player: {playersMap[selectedPlayerA]?.name || selectedPlayerA}
                  <button onClick={() => setSelectedPlayerA('ALL')}><X className="w-3 h-3 hover:text-blue-900" /></button>
                </span>
              )}

              {selectedPlayerB !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                  Opponent: {playersMap[selectedPlayerB]?.name || selectedPlayerB}
                  <button onClick={() => setSelectedPlayerB('ALL')}><X className="w-3 h-3 hover:text-purple-900" /></button>
                </span>
              )}

              {effectiveSelectedRound !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Week {effectiveSelectedRound}
                  <button onClick={() => setSelectedRound('ALL')}><X className="w-3 h-3 hover:text-slate-900" /></button>
                </span>
              )}

              {selectedStatus !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                  Status: {selectedStatus}
                  <button onClick={() => setSelectedStatus('ALL')}><X className="w-3 h-3 hover:text-slate-900" /></button>
                </span>
              )}
            </div>

            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Found {filteredFixtures.length} match{filteredFixtures.length === 1 ? '' : 'es'}
            </span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {fixtures.length === 0 ? (
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-12 text-center max-w-xl mx-auto shadow-sm dark:shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-heading">No Fixtures Generated Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Once you have added players to this season, generate the round-robin schedule to start recording match scores.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAdmin ? (
              <button
                onClick={onGenerateFixtures}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Generate Fixtures Now
              </button>
            ) : (
              <button
                onClick={onNavigateToSetup}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium text-sm rounded-xl transition border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2"
              >
                Go to League Setup
              </button>
            )}
          </div>
        </div>
      ) : filteredFixtures.length === 0 ? (
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-8 sm:p-12 text-center shadow-sm max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">No Matches Found</h4>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            No fixtures match your current player, head-to-head, or search filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition inline-flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Fixtures Grouped by Week */
        <div className="space-y-8">
          {groupedRounds.map((roundNum) => {
            const weekFixtures = filteredFixtures.filter(f => f.round_number === roundNum)
            const weekFinished = weekFixtures.filter(f => f.status === 'COMPLETED' || f.status === 'EXPIRED_DISQUALIFIED').length
            const isWeekAllDone = weekFinished === weekFixtures.length && weekFixtures.length > 0
            const isCurrentActiveWeek = roundNum === currentActiveRound
            const legLabel = formatLeg(weekFixtures[0]?.leg_type)

            return (
              <section key={roundNum} className="space-y-3">
                {/* Week Heading Banner */}
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-100 via-slate-50 to-transparent dark:from-[#141b2b] dark:via-[#101724] dark:to-transparent border-l-4 border-emerald-500 px-4 py-2.5 rounded-r-xl">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      isCurrentActiveWeek && !isWeekAllDone 
                        ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20' 
                        : isWeekAllDone 
                          ? 'bg-emerald-500' 
                          : 'bg-slate-400'
                    }`}></span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-wide font-heading">
                      Week {roundNum}
                    </h3>
                    {legLabel && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 shadow-sm">
                        {legLabel}
                      </span>
                    )}
                    {isCurrentActiveWeek && !isWeekAllDone && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1 shadow-xs">
                        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Current Week</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline">
                      {weekFinished}/{weekFixtures.length} Done
                    </span>
                    {isWeekAllDone && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    )}
                    {onOpenWeekGraphic && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenWeekGraphic({ roundNum, weekFixtures, legLabel })
                        }}
                        title={`Share Week ${roundNum} Poster & WhatsApp link`}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition active:scale-95 shadow-sm shadow-emerald-500/25 cursor-pointer ml-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share Week {roundNum}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of Match Cards for this Week */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weekFixtures.map((fixture) => {
                    const home = playersMap[fixture.home_player_id] || { name: 'Player 1', gamertag: 'P1' }
                    const away = playersMap[fixture.away_player_id] || { name: 'Player 2', gamertag: 'P2' }

                    const isCompleted = fixture.status === 'COMPLETED'
                    const isForfeit = fixture.status === 'EXPIRED_DISQUALIFIED'
                    const isPending = fixture.status === 'PENDING'

                    return (
                      <div
                        key={fixture.id}
                        id={`match-card-${fixture.id}`}
                        onClick={() => onSelectFixture(fixture)}
                        className="bg-white dark:bg-[#121826] hover:bg-slate-50 dark:hover:bg-[#151d2e] border border-slate-200 dark:border-[#1f2b42] hover:border-emerald-500/50 rounded-xl p-4 transition duration-200 cursor-pointer shadow-sm dark:shadow-md group relative overflow-hidden"
                      >
                        {/* Header inside card */}
                        <div className="flex items-center justify-between text-xs mb-3 pb-2 border-b border-slate-100 dark:border-[#1b253a]">
                          <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            Week {fixture.round_number} {legLabel ? `• ${legLabel}` : ''}
                          </span>

                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Final
                            </span>
                          )}
                          {isForfeit && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> 24h Forfeit
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </div>

                        {/* Matchup row */}
                        <div className="grid grid-cols-7 items-center gap-1.5 sm:gap-2 py-1">
                          {/* Home */}
                          <div className="col-span-3 flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-[10px] sm:text-xs border border-slate-700 shadow-sm"
                              style={{ backgroundColor: home.avatar_color || '#3b82f6' }}
                            >
                              {home.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="truncate min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                                {home.name}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                @{home.gamertag || 'gamer'}
                              </p>
                            </div>
                          </div>

                          {/* Center Score / VS */}
                          <div className="col-span-1 flex flex-col items-center justify-center">
                            {isCompleted ? (
                              <div className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-slate-100 dark:bg-slate-900 border border-emerald-500/40 rounded-lg text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs sm:text-sm tracking-wider shadow-inner text-center">
                                {fixture.home_score} - {fixture.away_score}
                              </div>
                            ) : isForfeit ? (
                              <div className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-400 dark:border-rose-500/40 rounded text-rose-700 dark:text-rose-400 font-mono font-bold text-[10px] sm:text-xs text-center">
                                0 - 0
                              </div>
                            ) : (
                              <span className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                VS
                              </span>
                            )}
                          </div>

                          {/* Away */}
                          <div className="col-span-3 flex items-center justify-end gap-1.5 sm:gap-2.5 min-w-0 text-right">
                            <div className="truncate min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                                {away.name}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                @{away.gamertag || 'gamer'}
                              </p>
                            </div>
                            <div
                              className="w-7 h-7 sm:w-9 sm:h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-[10px] sm:text-xs border border-slate-700 shadow-sm"
                              style={{ backgroundColor: away.avatar_color || '#10b981' }}
                            >
                              {away.name.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {/* Footer action */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-[#1a2336] flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate max-w-[130px] sm:max-w-[200px] italic">
                            {fixture.notes || (isForfeit ? 'Both 0 pts (+1 played)' : 'Click to enter score')}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {(isCompleted || isForfeit) && onOpenGraphic && (
                              <button
                                type="button"
                                title="Download HD Match Poster (PNG)"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onOpenGraphic(fixture)
                                }}
                                className="px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1 font-bold text-[10px] transition shadow-sm cursor-pointer active:scale-95"
                              >
                                <Sparkles className="w-3 h-3 text-emerald-500" />
                                <span>Poster</span>
                              </button>
                            )}
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                              {isAdmin ? (isPending ? 'Record Score →' : 'Edit →') : 'Details →'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {/* Locked Future Weeks Teaser for Spectators / Friends */}
          {!isAdmin && allTotalRounds.length > currentActiveRound && (
            <div className="mt-8 p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 dark:from-[#111726] dark:to-[#0c121e] border border-dashed border-slate-300 dark:border-[#223048] text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Week {currentActiveRound + 1} {allTotalRounds[allTotalRounds.length - 1] > currentActiveRound + 1 ? `to Week ${allTotalRounds[allTotalRounds.length - 1]}` : ''} Locked
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                Future fixtures will unlock automatically once all matches in <strong className="text-emerald-600 dark:text-emerald-400">Week {currentActiveRound}</strong> are finished!
              </p>
              <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>
                  {fixtures.filter(f => f.round_number === currentActiveRound && f.status === 'PENDING').length} match{fixtures.filter(f => f.round_number === currentActiveRound && f.status === 'PENDING').length === 1 ? '' : 'es'} remaining in Week {currentActiveRound}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
