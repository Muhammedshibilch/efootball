import React, { useState } from 'react'
import {
  Trophy,
  Swords,
  Crown,
  Sparkles,
  Lock,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  Calendar,
  Layers
} from 'lucide-react'
import { isDoubleChanceFormat, playoffMatchToFixture } from '../lib/playoffsEngine'

export default function PlayoffsView({
  playoffsData,
  standings = [],
  fixtures = [],
  playersMap = {},
  isAdmin = false,
  onOpenScoreModal,
  onInitializePlayoffs,
  onOpenChampionModal,
  onSwitchFormat,
  onLockFormat,
  onOpenGraphic
}) {
  const isFormatLocked = Boolean(playoffsData?.isFormatLocked)
  const [selectedFormat, setSelectedFormat] = useState(
    isDoubleChanceFormat(playoffsData?.format) ? 'DOUBLE_CHANCE' : 'NORMAL_KNOCKOUT'
  )

  const isDoubleChance = isDoubleChanceFormat(playoffsData?.format || selectedFormat)

  // Calculate league progress
  const totalFixtures = fixtures.length
  const completedFixtures = fixtures.filter(f => f.status === 'COMPLETED' || f.status === 'EXPIRED_DISQUALIFIED').length
  const pendingFixtures = totalFixtures - completedFixtures
  const isLeagueComplete = totalFixtures > 0 && pendingFixtures === 0

  const hasPlayoffs = Boolean(playoffsData && playoffsData.matches)
  const isChampionCrowned = Boolean(playoffsData?.championId)
  const champion = playersMap[playoffsData?.championId]

  // Top 4 from Standings
  const top4 = standings.slice(0, 4)

  const handleFormatChange = (newFormat) => {
    if (isFormatLocked) return
    setSelectedFormat(newFormat)
    if (onSwitchFormat) {
      onSwitchFormat(newFormat)
    }
  }

  const handleConfirmLockFormat = () => {
    if (window.confirm(`Are you sure you want to permanently lock "${isDoubleChance ? 'Double Chance Playoff' : 'Normal Knockout'}" format for this season? This cannot be changed once confirmed.`)) {
      if (onLockFormat) {
        onLockFormat(selectedFormat)
      }
    }
  }

  // Render a Match Card in the Bracket
  const renderMatchCard = (match, label, isHighlight = false) => {
    if (!match) return null

    const home = playersMap[match.homePlayerId]
    const away = playersMap[match.awayPlayerId]
    const isCompleted = match.status === 'COMPLETED'
    const isLocked = match.status === 'LOCKED'
    const canClick = isAdmin && !isLocked && home && away && isLeagueComplete

    const isHomeWinner = isCompleted && match.winnerId === match.homePlayerId
    const isAwayWinner = isCompleted && match.winnerId === match.awayPlayerId

    return (
      <div
        onClick={() => {
          if (!isLeagueComplete && isAdmin && home && away) {
            alert(`Playoff scores cannot be entered yet! All ${totalFixtures} regular season matches must be finished first (${pendingFixtures} matches still pending).`)
            return
          }
          if (canClick) onOpenScoreModal(match)
        }}
        className={`relative rounded-2xl transition duration-200 border overflow-hidden flex flex-col ${
          canClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
        } ${
          isHighlight
            ? 'bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 dark:from-[#1c1809] dark:via-[#121624] dark:to-[#0a0d18] border-amber-300 dark:border-amber-500/60 shadow-md dark:shadow-xl dark:shadow-amber-500/10'
            : isCompleted
            ? 'bg-white dark:bg-[#0f1422] border-emerald-300 dark:border-emerald-500/40 shadow-sm dark:shadow-md'
            : isLocked || !isLeagueComplete
            ? 'bg-slate-50/90 dark:bg-[#090d18]/60 border-slate-200 dark:border-slate-800/80 opacity-90'
            : 'bg-white dark:bg-[#0f1422] border-slate-200 dark:border-slate-700/80 hover:border-amber-400 dark:hover:border-amber-500/40 shadow-sm'
        }`}
      >
        {/* Card Header */}
        <div className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-bold ${
          isHighlight
            ? 'bg-amber-100/80 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300'
            : isCompleted
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
            : !isLeagueComplete
            ? 'bg-slate-100 text-amber-800 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-amber-400/90'
            : isLocked
            ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500'
            : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300'
        }`}>
          <span className="flex items-center gap-1.5 font-heading">
            {isHighlight && <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />}
            {match.name || label}
          </span>
          <div className="flex items-center gap-1.5">
            {isCompleted && home && away && onOpenGraphic && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenGraphic(playoffMatchToFixture(match))
                }}
                title="Share Match Result Poster for WhatsApp"
                className="p-1 rounded-md text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/60 dark:hover:bg-emerald-500/30 transition flex items-center gap-0.5 text-[10px] font-bold"
              >
                <Share2 className="w-3 h-3" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <span className="text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
              {isCompleted ? 'Final' : !isLeagueComplete ? <><Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Locked</> : isLocked ? 'Awaiting Opponent' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Card Body: Home vs Away */}
        <div className="p-3 space-y-2">
          {/* Home Player */}
          <div className={`flex items-center justify-between p-2 rounded-xl transition ${
            isHomeWinner
              ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-extrabold dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-white'
              : 'bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/60 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-bold text-[10px] shadow"
                style={{ backgroundColor: home?.avatar_color || '#3b82f6' }}
              >
                {home ? (home.name || 'P1').substring(0, 2).toUpperCase() : '?'}
              </div>
              <div className="truncate">
                <span className={`text-xs block truncate font-bold ${
                  isHomeWinner
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {home ? home.name : <span className="text-slate-400 italic font-normal">TBD</span>}
                </span>
                {home?.gamertag && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block">@{home.gamertag}</span>
                )}
              </div>
            </div>
            <div className="text-sm font-black font-mono px-2 text-slate-900 dark:text-white">
              {isCompleted ? match.homeScore : '-'}
            </div>
          </div>

          {/* Away Player */}
          <div className={`flex items-center justify-between p-2 rounded-xl transition ${
            isAwayWinner
              ? 'bg-emerald-100/70 border border-emerald-300 text-emerald-950 font-extrabold dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-white'
              : 'bg-slate-100/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/60 text-slate-800 dark:text-slate-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-bold text-[10px] shadow"
                style={{ backgroundColor: away?.avatar_color || '#10b981' }}
              >
                {away ? (away.name || 'P2').substring(0, 2).toUpperCase() : '?'}
              </div>
              <div className="truncate">
                <span className={`text-xs block truncate font-bold ${
                  isAwayWinner
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {away ? away.name : <span className="text-slate-400 italic font-normal">TBD</span>}
                </span>
                {away?.gamertag && (
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block">@{away.gamertag}</span>
                )}
              </div>
            </div>
            <div className="text-sm font-black font-mono px-2 text-slate-900 dark:text-white">
              {isCompleted ? match.awayScore : '-'}
            </div>
          </div>

          {/* Penalties note */}
          {match.homePens !== null && match.awayPens !== null && (
            <div className="text-center text-[10px] text-amber-700 dark:text-amber-400 font-mono pt-0.5 font-bold">
              Pens: {match.homePens} - {match.awayPens}
            </div>
          )}

          {/* Share Poster Button (Directly visible on every completed playoff match) */}
          {isCompleted && home && away && onOpenGraphic && (
            <div className="pt-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenGraphic(playoffMatchToFixture(match))
                }}
                title="Share this playoff match result poster to WhatsApp & Instagram"
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs border border-emerald-400/60 dark:border-emerald-500/40 transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Share Match Poster 📸</span>
              </button>
            </div>
          )}

          {/* Action Callout */}
          {!isLeagueComplete && (
            <div className="pt-1 text-center">
              <span className="text-[10px] text-amber-800 dark:text-amber-400/90 font-medium flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Locked until league ends ({pendingFixtures} left)</span>
              </span>
            </div>
          )}
          {canClick && !isCompleted && isLeagueComplete && (
            <div className="pt-1 text-center">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline">
                Click to enter score →
              </span>
            </div>
          )}
          {canClick && isCompleted && (
            <div className="pt-1 text-center">
              <span className="text-[9px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                Click to edit score
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">

      {/* Header Bar */}
      <div className="bg-white dark:bg-[#0d121c] border border-slate-200 dark:border-[#1c2438] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
              <Swords className="w-5 h-5 text-amber-500" />
            </span>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <span>Championship Playoffs</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                Top 4
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isDoubleChance
              ? 'Double Chance Playoff (Top 2 Advantage) • Qualifier 1, Eliminator, Qualifier 2 & Grand Final'
              : 'Normal Knockout • Semi-Final 1, Semi-Final 2, 3rd Place Match & Grand Final'}
          </p>
        </div>

        {/* Controls: Format Toggle & Re-seed (Admin) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isAdmin && (
            isFormatLocked ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-inner">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Format Locked: {isDoubleChance ? 'Double Chance Playoff' : 'Normal Knockout'}</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-inner">
                  <button
                    onClick={() => handleFormatChange('NORMAL_KNOCKOUT')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      !isDoubleChance
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Normal Knockout
                  </button>
                  <button
                    onClick={() => handleFormatChange('DOUBLE_CHANCE')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      isDoubleChance
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Double Chance Playoff
                  </button>
                </div>

                <button
                  onClick={handleConfirmLockFormat}
                  title="Confirm and lock this playoff format permanently (cannot be changed after locking)"
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm & Lock Format</span>
                </button>
              </div>
            )
          )}

          {isAdmin && (
            <button
              onClick={() => onInitializePlayoffs(selectedFormat, true)}
              title="Re-seed playoffs using latest Standings"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span>Re-Seed</span>
            </button>
          )}

          {isChampionCrowned && (
            <button
              onClick={onOpenChampionModal}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-slate-950" />
              <span>Winner Poster</span>
            </button>
          )}
        </div>
      </div>

      {/* Alert banner if league is not complete */}
      {!isLeagueComplete && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p>
              <strong>Playoff score entry is locked:</strong> All regular season matches must finish before playoff scores can be written. ({completedFixtures}/{totalFixtures} completed, <strong className="text-amber-950 dark:text-white font-bold">{pendingFixtures} matches remaining</strong>).
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300 shrink-0 font-bold">
            Season In Progress
          </span>
        </div>
      )}

      {/* Alert banner if format not locked yet */}
      {isAdmin && !isFormatLocked && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-900 dark:text-blue-300 flex items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p>
              <strong>Admin Step:</strong> Choose between <strong>Normal Knockout</strong> or <strong>Double Chance Playoff</strong>, then click <strong>"Confirm & Lock Format"</strong>. Once locked, it cannot be changed for this season.
            </p>
          </div>
        </div>
      )}

      {/* Pre-Playoff / Qualifying Zone Race if league is still pending */}
      {!hasPlayoffs && (
        <div className="bg-white dark:bg-gradient-to-b dark:from-[#121826] dark:to-[#0a0d18] border border-slate-200 dark:border-amber-500/30 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm dark:shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1c263c] pb-5">
            <div>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
                <span>Playoff Qualification Race (Top 4)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
                Regular Season Ongoing
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {completedFixtures} of {totalFixtures} league matches completed. {pendingFixtures} matches remaining.
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => onInitializePlayoffs(selectedFormat, false)}
                className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Swords className="w-4 h-4" />
                <span>Initialize Playoffs Now</span>
              </button>
            )}
          </div>

          {/* Current Top 4 Grid */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Current Top 4 in the Qualifying Zone</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {top4.map((row, idx) => {
                const pos = idx + 1
                const isDoubleChance = pos <= 2
                return (
                  <div
                    key={row.player?.id || idx}
                    className={`p-4 rounded-2xl border transition relative overflow-hidden ${
                      isDoubleChance
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-sm dark:bg-gradient-to-b dark:from-[#18233c] dark:to-[#0f1422] dark:border-emerald-500/40 dark:shadow-lg'
                        : 'bg-slate-50 border-slate-200 shadow-sm dark:bg-[#0f1422] dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        pos === 1 ? 'bg-amber-500 text-slate-950' : pos === 2 ? 'bg-slate-200 text-slate-900 dark:bg-slate-300 dark:text-slate-950' : 'bg-amber-700 text-white'
                      }`}>
                        #{pos}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDoubleChance
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                      }`}>
                        {isDoubleChance ? 'Double Chance (Q1)' : 'Eliminator'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-950 font-black text-xs shadow-md"
                        style={{ backgroundColor: row.player?.avatar_color || '#3b82f6' }}
                      >
                        {(row.player?.name || 'P').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{row.player?.name}</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-black">{row.points} PTS • {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference} GD</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rules explainer card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0b0e17] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">💡 Playoff Formats (Admin can select either):</span>
            <p>• <strong>Double Chance Playoff:</strong> 1st vs 2nd play Qualifier 1 (winner to Final, loser gets a 2nd chance in Q2). 3rd vs 4th play the Eliminator (loser out). High drama format rewarding regular season leaders!</p>
            <p>• <strong>Normal Knockout:</strong> Classic Semi-Final 1 (1st vs 4th) & Semi-Final 2 (2nd vs 3rd), followed by Bronze Medal Match & Grand Final.</p>
          </div>
        </div>
      )}

      {/* ACTIVE PLAYOFF BRACKET VIEW */}
      {hasPlayoffs && (
        <div className="bg-slate-50/70 dark:bg-[#090d18] border border-slate-200 dark:border-[#1c2438] rounded-3xl p-4 sm:p-7 shadow-sm dark:shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1c263c] pb-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Tournament Bracket Tree
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {isAdmin ? 'Admin: Click any ready match to record scores' : 'Real-time Playoff Bracket'}
            </span>
          </div>

          {/* Double Chance vs Normal Knockout Layout */}
          {isDoubleChance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              
              {/* Column 1: Round 1 (Q1 & Eliminator) */}
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-2">
                    Round 1: Double Chance
                  </span>
                  {renderMatchCard(playoffsData.matches.q1, 'Qualifier 1')}
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block mb-2">
                    Round 1: Knockout
                  </span>
                  {renderMatchCard(playoffsData.matches.eliminator, 'Eliminator')}
                </div>
              </div>

              {/* Column 2: Round 2 (Qualifier 2) */}
              <div className="space-y-3 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block text-center mb-1">
                  Semi-Final (2nd Chance)
                </span>
                {renderMatchCard(playoffsData.matches.q2, 'Qualifier 2')}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight">
                  Loser of Q1 plays Winner of Eliminator for the final spot!
                </p>
              </div>

              {/* Column 3: Grand Final */}
              <div className="space-y-3 flex flex-col justify-center">
                <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider block text-center mb-1 flex items-center justify-center gap-1">
                  <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Grand Final
                </span>
                {renderMatchCard(playoffsData.matches.final, 'Grand Final', true)}
                {isChampionCrowned && (
                  <button
                    onClick={onOpenChampionModal}
                    className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-300 dark:border-amber-500/40 transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>View Winner Poster</span>
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Standard Knockout Layout */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              {/* Column 1: Semi-Finals */}
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block mb-1">
                  Semi-Finals
                </span>
                {renderMatchCard(playoffsData.matches.sf1, 'Semi-Final 1')}
                {renderMatchCard(playoffsData.matches.sf2, 'Semi-Final 2')}
              </div>

              {/* Column 2: 3rd Place */}
              <div className="space-y-3 flex flex-col justify-center">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider block text-center mb-1">
                  Bronze Medal Match
                </span>
                {renderMatchCard(playoffsData.matches.third_place, '3rd Place Match')}
              </div>

              {/* Column 3: Grand Final */}
              <div className="space-y-3 flex flex-col justify-center">
                <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider block text-center mb-1 flex items-center justify-center gap-1">
                  <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Grand Final
                </span>
                {renderMatchCard(playoffsData.matches.final, 'Grand Final', true)}
              </div>
            </div>
          )}

          {/* Podiums Table if completed */}
          {playoffsData.status === 'COMPLETED' && (
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#1c263c] grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/40 shadow-sm">
                <span className="text-[11px] text-amber-800 dark:text-amber-400 font-black block uppercase">🥇 1st (Champion)</span>
                <span className="text-amber-950 dark:text-white font-extrabold text-sm">{playersMap[playoffsData.championId]?.name || 'Champion'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold block uppercase">🥈 2nd (Runner-Up)</span>
                <span className="text-slate-900 dark:text-white font-bold text-sm">{playersMap[playoffsData.runnerUpId]?.name || 'Runner-Up'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-amber-900/30 border border-orange-200 dark:border-amber-800/50 shadow-sm">
                <span className="text-[11px] text-orange-800 dark:text-amber-500 font-bold block uppercase">🥉 3rd Place</span>
                <span className="text-orange-950 dark:text-white font-bold text-sm">{playersMap[playoffsData.thirdPlaceId]?.name || '3rd Place'}</span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

