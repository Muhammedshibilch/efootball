import React from 'react'
import { Trophy, Plus, Lock, Unlock, Calendar, BarChart3, Scale, Settings, Sun, Moon, ArrowLeft, Home, Share2, Eye, Swords } from 'lucide-react'

export default function Navbar({
  activeTab,
  setActiveTab,
  organization,
  onExitToHome,
  tournament,
  seasons,
  onSwitchSeason,
  onOpenNewSeason,
  isAdmin,
  onToggleAdmin,
  onShareLeague,
  pendingCount,
  isPlayoffLive = false,
  theme,
  onToggleTheme
}) {
  const isDark = theme === 'dark'

  return (
    <header className={`border-b sticky top-0 z-40 transition-colors backdrop-blur-md ${
      isDark
        ? 'border-[#1c2438] bg-[#0f1420]/90 text-white'
        : 'border-slate-200 bg-white/95 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Brand & Organization & Season Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          
          {/* Back to Home & Auto-Logout Button */}
          <button
            onClick={onExitToHome}
            title="Log Out & Return to Home"
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition flex items-center gap-1 text-xs font-semibold shrink-0 ${
              isDark
                ? 'bg-slate-900 border-[#243048] hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300'
                : 'bg-slate-100 border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700 hover:text-rose-600 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/20 shrink-0">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className={`font-bold text-xs xs:text-sm sm:text-lg font-heading tracking-tight truncate max-w-[85px] xs:max-w-[130px] sm:max-w-[260px] ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                {organization?.name || 'eFootball League'}
              </h1>
              
              {/* Season Dropdown */}
              <select
                value={seasons.some(s => s.id === tournament?.id) ? (tournament?.id || '') : (seasons[0]?.id || '')}
                onChange={(e) => {
                  if (e.target.value === '__NEW__') {
                    onOpenNewSeason();
                  } else {
                    onSwitchSeason(e.target.value);
                  }
                }}
                className={`text-[11px] sm:text-xs rounded-lg px-1.5 py-0.5 sm:px-2.5 sm:py-1 font-bold cursor-pointer transition focus:outline-none border shrink-0 max-w-[85px] xs:max-w-[110px] sm:max-w-none truncate ${
                  isDark
                    ? 'bg-slate-900 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60'
                    : 'bg-white border-slate-300 text-emerald-700 hover:border-emerald-500 shadow-sm'
                }`}
              >
                {seasons.map((s, idx) => {
                  let label = s.name || `Season ${idx + 1}`;
                  if (organization?.name) {
                    label = label.replace(new RegExp(`^${organization.name}\\s*-\\s*`, 'i'), '');
                  }
                  label = label.replace(/^eFootball League - /i, '');
                  return (
                    <option key={s.id} value={s.id}>{label}</option>
                  );
                })}
                <option value="__NEW__">+ New Season</option>
              </select>
            </div>
            <p className={`hidden xs:block text-[10px] sm:text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Community Organization</p>
          </div>
        </div>

        {/* Actions: Theme Toggle, Share, Cloud, Admin */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            type="button"
            title={isDark ? "Switch to White / Light Mode" : "Switch to Dark Mode"}
            className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold border transition ${
              isDark
                ? 'bg-slate-900 border-slate-700/80 hover:border-emerald-500/50 text-amber-400'
                : 'bg-white border-slate-200 hover:border-slate-300 text-indigo-600 shadow-sm'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="hidden sm:inline text-slate-200">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                <span className="hidden sm:inline text-slate-700">Dark</span>
              </>
            )}
          </button>

          {/* Share Public Read-Only Link */}
          <button
            onClick={onShareLeague}
            type="button"
            title="Share Read-Only League Link for Players"
            className={`flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition ${
              isDark
                ? 'bg-slate-900 border-[#243048] hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400'
                : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-700 shadow-sm'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* New Season button (Admin only) */}
          {isAdmin && (
            <button
              onClick={onOpenNewSeason}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                isDark
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Season</span>
            </button>
          )}

          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
            isDark
              ? 'bg-slate-900 text-slate-300 border-slate-800'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-medium">Cloud Synced</span>
          </div>

          {/* Admin / Read-Only Switcher */}
          {isAdmin ? (
            <button
              onClick={onToggleAdmin}
              title="Click to lock admin mode"
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition ${
                isDark
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
              }`}
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden xs:inline">Admin Active</span>
              <span className="xs:hidden">Admin</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <span className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <Eye className="w-3 h-3 text-slate-400" /> Read-Only
              </span>
              <button
                onClick={onToggleAdmin}
                title="Unlock Organizer Mode with PIN"
                className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/80'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-sm'
                }`}
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="hidden xs:inline">Admin PIN</span>
                <span className="xs:hidden">PIN</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={`max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 flex space-x-1 border-t overflow-x-auto scrollbar-none touch-scroll py-1 sm:py-1.5 ${
        isDark ? 'border-[#1c2438]/60' : 'border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('standings')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap shrink-0 ${
            activeTab === 'standings'
              ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' : 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-sm font-bold')
              : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
          }`}
        >
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Standings</span>
        </button>

        <button
          onClick={() => setActiveTab('fixtures')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap shrink-0 ${
            activeTab === 'fixtures'
              ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' : 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-sm font-bold')
              : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
          }`}
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Fixtures & Results</span>
          {pendingCount > 0 && (
            <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full border ${
              isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300 font-bold'
            }`}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('playoffs')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap shrink-0 ${
            activeTab === 'playoffs'
              ? (isDark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold' : 'bg-amber-50 text-amber-800 border border-amber-300 shadow-sm font-bold')
              : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
          }`}
        >
          <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>Playoffs</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-extrabold ${
            isPlayoffLive
              ? 'bg-amber-500 text-slate-950 animate-pulse'
              : (isDark ? 'bg-slate-800 text-amber-400/80 border border-slate-700' : 'bg-slate-100 text-amber-700 border border-slate-300')
          }`}>
            Top 4
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap shrink-0 ${
            activeTab === 'stats'
              ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' : 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-sm font-bold')
              : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Player Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap shrink-0 ${
            activeTab === 'rules'
              ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' : 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-sm font-bold')
              : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
          }`}
        >
          <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Rules</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'setup'
                ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold' : 'bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-sm font-bold')
                : (isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>League Setup</span>
          </button>
        )}
      </div>
    </header>
  )
}
