import React, { useState } from 'react'
import { Users, Plus, Trash2, Play, AlertCircle, Sparkles, Key, Check, ShieldAlert, Eye, EyeOff } from 'lucide-react'
import { AVATAR_COLORS } from '../lib/leagueEngine'
import { useToast } from '../context/ToastContext'

const SAMPLE_PRESETS = {
  10: [
    { name: 'Adinan', gamertag: 'adi_pes', avatar_color: '#10b981' },
    { name: 'Shibil', gamertag: 'shibil_fc', avatar_color: '#3b82f6' },
    { name: 'Sinan', gamertag: 'sinan_king', avatar_color: '#8b5cf6' },
    { name: 'Jadier', gamertag: 'jadier_9', avatar_color: '#f59e0b' },
    { name: 'Fahiz', gamertag: 'fahiz_striker', avatar_color: '#ec4899' },
    { name: 'Rashid', gamertag: 'rashid_mf', avatar_color: '#06b6d4' },
    { name: 'Salman', gamertag: 'salman_cb', avatar_color: '#6366f1' },
    { name: 'Nihal', gamertag: 'nihal_cr7', avatar_color: '#f97316' },
    { name: 'Ameen', gamertag: 'ameen_gk', avatar_color: '#14b8a6' },
    { name: 'Rayees', gamertag: 'rayees_lm', avatar_color: '#a855f7' }
  ],
  12: [
    { name: 'Adinan', gamertag: 'adi_pes', avatar_color: '#10b981' },
    { name: 'Shibil', gamertag: 'shibil_fc', avatar_color: '#3b82f6' },
    { name: 'Sinan', gamertag: 'sinan_king', avatar_color: '#8b5cf6' },
    { name: 'Jadier', gamertag: 'jadier_9', avatar_color: '#f59e0b' },
    { name: 'Fahiz', gamertag: 'fahiz_striker', avatar_color: '#ec4899' },
    { name: 'Rashid', gamertag: 'rashid_mf', avatar_color: '#06b6d4' },
    { name: 'Salman', gamertag: 'salman_cb', avatar_color: '#6366f1' },
    { name: 'Nihal', gamertag: 'nihal_cr7', avatar_color: '#f97316' },
    { name: 'Ameen', gamertag: 'ameen_gk', avatar_color: '#14b8a6' },
    { name: 'Rayees', gamertag: 'rayees_lm', avatar_color: '#a855f7' },
    { name: 'Basil', gamertag: 'basil_winger', avatar_color: '#ef4444' },
    { name: 'Hisham', gamertag: 'hisham_cf', avatar_color: '#eab308' }
  ],
  14: [
    { name: 'Adinan', gamertag: 'adi_pes', avatar_color: '#10b981' },
    { name: 'Shibil', gamertag: 'shibil_fc', avatar_color: '#3b82f6' },
    { name: 'Sinan', gamertag: 'sinan_king', avatar_color: '#8b5cf6' },
    { name: 'Jadier', gamertag: 'jadier_9', avatar_color: '#f59e0b' },
    { name: 'Fahiz', gamertag: 'fahiz_striker', avatar_color: '#ec4899' },
    { name: 'Rashid', gamertag: 'rashid_mf', avatar_color: '#06b6d4' },
    { name: 'Salman', gamertag: 'salman_cb', avatar_color: '#6366f1' },
    { name: 'Nihal', gamertag: 'nihal_cr7', avatar_color: '#f97316' },
    { name: 'Ameen', gamertag: 'ameen_gk', avatar_color: '#14b8a6' },
    { name: 'Rayees', gamertag: 'rayees_lm', avatar_color: '#a855f7' },
    { name: 'Basil', gamertag: 'basil_winger', avatar_color: '#ef4444' },
    { name: 'Hisham', gamertag: 'hisham_cf', avatar_color: '#eab308' },
    { name: 'Faheem', gamertag: 'faheem_rb', avatar_color: '#3b82f6' },
    { name: 'Zayan', gamertag: 'zayan_lw', avatar_color: '#10b981' }
  ]
}

export default function LeagueSetup({
  tournament,
  players,
  fixturesCount,
  isAdmin,
  onUpdateTournament,
  onAddPlayer,
  onRemovePlayer,
  onClearAllPlayers,
  onLoadPreset,
  onGenerateFixtures
}) {
  const { toast, confirmModal } = useToast()
  const [seasonName, setSeasonName] = useState(tournament?.name || '')
  const [format, setFormat] = useState(tournament?.format || 'HOME_AWAY')
  const [adminPin, setAdminPin] = useState(tournament?.admin_pin || '1234')
  const [showPin, setShowPin] = useState(false)

  const [newPlayerName, setNewPlayerName] = useState('')
  const [newPlayerTag, setNewPlayerTag] = useState('')
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0])
  const [loadingAction, setLoadingAction] = useState(false)

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.warning('Unlock Admin mode in the top right to save settings.')
      return
    }
    setLoadingAction(true)
    try {
      await onUpdateTournament({
        name: seasonName.trim() || tournament?.name,
        format,
        admin_pin: adminPin.trim() || '1234'
      })
      toast.success('Season settings updated!')
    } catch (err) {
      toast.error('Failed to update: ' + err.message)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleAddPlayerSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.warning('Unlock Admin mode to add players.')
      return
    }
    const name = newPlayerName.trim()
    if (!name) return

    setLoadingAction(true)
    try {
      await onAddPlayer({
        name,
        gamertag: (newPlayerTag.trim() || name.toLowerCase().replace(/\s+/g, '_')).replace(/^@/, ''),
        avatar_color: selectedColor
      })
      toast.success(`${name} added to roster!`)
      setNewPlayerName('')
      setNewPlayerTag('')
      // Pick next color
      const nextIdx = (AVATAR_COLORS.indexOf(selectedColor) + 1) % AVATAR_COLORS.length
      setSelectedColor(AVATAR_COLORS[nextIdx])
    } catch (err) {
      toast.error('Failed to add player: ' + err.message)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleClearPlayers = async () => {
    if (!isAdmin) {
      toast.warning('Unlock Admin mode to clear players.')
      return
    }
    const confirmed = await confirmModal({
      title: 'Remove All Players?',
      message: 'Are you sure you want to remove ALL players from this season?\nAll existing fixtures will also be cleared.',
      confirmText: 'Remove All Players',
      cancelText: 'Cancel',
      type: 'danger'
    })
    if (!confirmed) return

    setLoadingAction(true)
    try {
      await onClearAllPlayers()
      toast.info('All players and fixtures have been cleared.')
    } catch (err) {
      toast.error('Failed to clear: ' + err.message)
    } finally {
      setLoadingAction(false)
    }
  }

  const handlePreset = async (count) => {
    if (!isAdmin) {
      toast.warning('Unlock Admin mode to load presets.')
      return
    }
    const preset = SAMPLE_PRESETS[count]
    if (!preset) return

    const confirmed = await confirmModal({
      title: `Load ${count} Players Preset?`,
      message: `This will add ${count} players to the current season roster.`,
      confirmText: `Load ${count} Players`,
      cancelText: 'Cancel',
      type: 'info'
    })
    if (!confirmed) return

    setLoadingAction(true)
    try {
      await onLoadPreset(preset)
      toast.success(`Successfully loaded ${count} players!`)
    } catch (err) {
      toast.error('Failed to load preset: ' + err.message)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleGenerate = async () => {
    if (!isAdmin) {
      toast.warning('Unlock Admin mode to generate fixtures.')
      return
    }
    if (players.length < 2) {
      toast.error('You need at least 2 players to generate fixtures!')
      return
    }
    if (fixturesCount > 0) {
      const confirmed = await confirmModal({
        title: 'Generate New Fixtures?',
        message: `Warning: You already have ${fixturesCount} fixtures.\nGenerating new fixtures will REPLACE all existing fixtures and scores for this season. Continue?`,
        confirmText: 'Generate & Replace',
        cancelText: 'Cancel',
        type: 'warning'
      })
      if (!confirmed) {
        return
      }
    }
    setLoadingAction(true)
    try {
      if (format !== tournament?.format || seasonName.trim() !== tournament?.name || adminPin !== tournament?.admin_pin) {
        await onUpdateTournament({
          name: seasonName.trim() || tournament?.name,
          format,
          admin_pin: adminPin.trim() || '1234'
        })
      }
      await onGenerateFixtures(format)
      toast.success('Fixtures successfully generated!')
    } catch (err) {
      toast.error('Failed to generate fixtures: ' + err.message)
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Admin Notice */}
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200">
              You are currently viewing in <strong>Read-Only mode</strong>. Click the <strong>Admin</strong> button in the top navbar to unlock full controls (add players, generate fixtures, enter scores).
            </p>
          </div>
        </div>
      )}

      {/* 1. Season & League Configuration */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 font-heading">
          <Key className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Season & Format Settings
        </h3>

        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Season Title</label>
            <input
              type="text"
              disabled={!isAdmin || loadingAction}
              value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)}
              placeholder="e.g. Season 1"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Format</label>
            <select
              disabled={!isAdmin || loadingAction}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 shadow-sm"
            >
              <option value="HOME_AWAY">Home & Away (2 Matches per pair)</option>
              <option value="SINGLE_ROUND">Single Round (1 Match per pair)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Admin Passcode (PIN)</label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                disabled={!isAdmin || loadingAction}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 font-mono shadow-sm tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
                title={showPin ? "Hide Passcode" : "Show Passcode"}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="md:col-span-3 flex justify-end pt-1">
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold rounded-lg text-xs transition border border-slate-300 dark:border-slate-700 shadow-sm disabled:opacity-50"
              >
                Save Season Settings
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 2. Fixture Generator Panel */}
      {(() => {
        const isHomeAway = format === 'HOME_AWAY';
        const effectivePlayerCount = players.length % 2 === 0 ? players.length : players.length + 1;
        const roundsPerLeg = Math.max(0, effectivePlayerCount - 1);
        const expectedWeeks = isHomeAway ? roundsPerLeg * 2 : roundsPerLeg;
        const matchesPerRound = Math.floor(players.length / 2);
        const expectedMatches = expectedWeeks * matchesPerRound;

        return (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-[#121826] dark:to-[#162235] border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">Fixture Engine (Round-Robin)</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg">
                Generates balanced Berger schedule for <strong className="text-slate-900 dark:text-white">{players.length} players</strong> in <strong className="text-emerald-700 dark:text-emerald-400">{isHomeAway ? 'Home & Away (2 Matches per pair)' : 'Single Round (1 Match per pair)'}</strong> format.
              </p>
              <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono font-medium shadow-xs">
                  {expectedWeeks} Weeks {isHomeAway ? `(Leg 1: Wk 1–${roundsPerLeg}, Leg 2: Wk ${roundsPerLeg + 1}–${expectedWeeks})` : ''}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono font-medium shadow-xs">
                  {expectedMatches} Total Matches
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-semibold shadow-xs">
                  Currently recorded: {fixturesCount} fixtures
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!isAdmin || players.length < 2 || loadingAction}
              className="w-full md:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              {fixturesCount > 0 ? 'Re-Generate Fixtures' : 'Generate Fixtures Now'}
            </button>
          </div>
        );
      })()}

      {/* 3. Player Roster Management */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-200 dark:border-[#1f2b42]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-heading">
              <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Players Roster ({players.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ideal for 10 to 14 friends in your neighborhood league
            </p>
          </div>

          {/* Quick Presets & Clear */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets:
              </span>
              <button
                onClick={() => handlePreset(10)}
                disabled={loadingAction}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold shadow-sm transition"
              >
                10 Friends
              </button>
              <button
                onClick={() => handlePreset(12)}
                disabled={loadingAction}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold shadow-sm transition"
              >
                12 Friends
              </button>
              <button
                onClick={() => handlePreset(14)}
                disabled={loadingAction}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-semibold shadow-sm transition"
              >
                14 Friends
              </button>

              {players.length > 0 && (
                <button
                  onClick={handleClearPlayers}
                  disabled={loadingAction}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded text-xs font-semibold shadow-sm transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3 text-rose-500 dark:text-rose-400" /> Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Player Input Form */}
        {isAdmin && (
          <form onSubmit={handleAddPlayerSubmit} className="bg-slate-50 dark:bg-[#0e131d] border border-slate-200 dark:border-[#1b253a] p-3.5 sm:p-4 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-300">Add New Player</p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Player Name (e.g. Adinan)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={newPlayerTag}
                  onChange={(e) => setNewPlayerTag(e.target.value)}
                  placeholder="PES ID / Gamertag (e.g. adi_9)"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-[#243048] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-sm"
                />
              </div>

              {/* Color picker */}
              <div className="sm:col-span-2 flex items-center justify-between sm:justify-start gap-1.5 overflow-x-auto py-1">
                {AVATAR_COLORS.slice(0, 5).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="w-6 h-6 rounded-full shrink-0 border-2 transition shadow-sm"
                    style={{
                      backgroundColor: c,
                      borderColor: selectedColor === c ? '#10b981' : 'transparent'
                    }}
                  />
                ))}
              </div>

              <div className="sm:col-span-1">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center transition shadow-sm h-9"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Players List */}
        {players.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
            No players registered in this season yet. Use the form above or click a preset to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="bg-slate-50 dark:bg-[#0e131d] border border-slate-200 dark:border-[#1b253a] hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-3 flex items-center justify-between group transition shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-white text-xs border border-slate-700 shadow-sm"
                    style={{ backgroundColor: p.avatar_color || '#3b82f6' }}
                  >
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">@{p.gamertag || 'player'}</p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={async () => {
                      const ok = await confirmModal({
                        title: `Remove ${p.name}?`,
                        message: `Are you sure you want to remove ${p.name} from this season?`,
                        confirmText: 'Remove Player',
                        cancelText: 'Cancel',
                        type: 'danger'
                      })
                      if (ok) {
                        onRemovePlayer(p.id)
                        toast.info(`${p.name} removed from roster`)
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

