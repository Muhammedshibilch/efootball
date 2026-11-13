import React, { useState } from 'react'
import {
  Trophy,
  Zap,
  ShieldCheck,
  Calendar,
  Share2,
  Users,
  Clock,
  ArrowRight,
  PlusCircle,
  LogIn,
  Sun,
  Moon,
  Sparkles,
  Flame,
  CheckCircle2,
  Star,
  Activity,
  Play,
  Award,
  ChevronRight,
  Shield
} from 'lucide-react'

// Authentic eFootball Cards Data with rich visual assets
const HERO_TRIO = [
  {
    id: 'ronaldo',
    name: 'Cristiano Ronaldo',
    cardName: 'C. RONALDO',
    rating: 101,
    position: 'CF',
    nation: 'POR',
    tier: 'SHOWTIME',
    badge: 'PHENOMENAL',
    tagline: 'Finishing • 101',
    image: '/images/ronaldo.jpg',
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-cyan-500/25',
    accentText: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    cardBg: 'from-[#081524] via-[#0d121c] to-[#060810]',
    rotation: '-rotate-2 sm:-rotate-3',
    stats: [
      { label: 'Kicking Power', val: 102, color: 'text-cyan-400' },
      { label: 'Finishing', val: 101, color: 'text-amber-400' },
      { label: 'Speed', val: 95, color: 'text-emerald-400' }
    ]
  },
  {
    id: 'messi',
    name: 'Lionel Messi',
    cardName: 'L. MESSI',
    rating: 102,
    position: 'RWF',
    nation: 'ARG',
    tier: 'EPIC BOOSTER',
    badge: 'BIG TIME',
    tagline: 'Tight Possession • 99',
    image: '/images/messi.jpg',
    borderColor: 'border-amber-400',
    glowColor: 'shadow-amber-500/35 ring-2 ring-amber-400/50',
    accentText: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    cardBg: 'from-[#1c1407] via-[#0e1420] to-[#060810]',
    rotation: 'rotate-0 scale-105 z-10', // elevated centerpiece
    stats: [
      { label: 'Dribbling', val: 101, color: 'text-amber-400' },
      { label: 'Finishing', val: 98, color: 'text-amber-400' },
      { label: 'Speed', val: 96, color: 'text-emerald-400' }
    ]
  },
  {
    id: 'yamal',
    name: 'Lamine Yamal',
    cardName: 'L. YAMAL',
    rating: 100,
    position: 'RWF',
    nation: 'ESP',
    tier: 'WONDERKID',
    badge: 'HIGHLIGHT',
    tagline: 'Curler • 99',
    image: '/images/yamal.jpg',
    borderColor: 'border-emerald-400',
    glowColor: 'shadow-emerald-500/25',
    accentText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    cardBg: 'from-[#071c14] via-[#0d121c] to-[#060810]',
    rotation: 'rotate-2 sm:rotate-3',
    stats: [
      { label: 'Dribbling', val: 101, color: 'text-emerald-400' },
      { label: 'Speed', val: 99, color: 'text-cyan-400' },
      { label: 'Curling', val: 97, color: 'text-emerald-400' }
    ]
  }
]

// All 9 superstar cards for the Full Size Card Gallery
const ALL_SUPERSTARS = [
  ...HERO_TRIO,
  {
    id: 'mbappe',
    name: 'Kylian Mbappé',
    cardName: 'K. MBAPPÉ',
    rating: 102,
    position: 'CF',
    nation: 'FRA',
    tier: 'BIG TIME',
    badge: 'SPEED DEMON',
    tagline: 'Acceleration • 101',
    image: '/images/mbappe.jpg',
    borderColor: 'border-indigo-400',
    glowColor: 'shadow-indigo-500/30',
    accentText: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    cardBg: 'from-[#140b29] via-[#0d121c] to-[#060810]',
    stats: [
      { label: 'Speed', val: 102, color: 'text-cyan-400' },
      { label: 'Finishing', val: 99, color: 'text-amber-400' },
      { label: 'Dribbling', val: 98, color: 'text-emerald-400' }
    ]
  },
  {
    id: 'haaland',
    name: 'Erling Haaland',
    cardName: 'E. HAALAND',
    rating: 102,
    position: 'CF',
    nation: 'NOR',
    tier: 'PHENOMENAL',
    badge: 'GOAL MACHINE',
    tagline: 'Physical Contact • 100',
    image: '/images/haaland.jpg',
    borderColor: 'border-sky-400',
    glowColor: 'shadow-sky-500/30',
    accentText: 'text-sky-400',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    cardBg: 'from-[#08182b] via-[#0d121c] to-[#060810]',
    stats: [
      { label: 'Finishing', val: 102, color: 'text-amber-400' },
      { label: 'Physicality', val: 100, color: 'text-sky-400' },
      { label: 'Speed', val: 97, color: 'text-emerald-400' }
    ]
  },
  {
    id: 'neymar',
    name: 'Neymar Jr',
    cardName: 'NEYMAR JR',
    rating: 101,
    position: 'LWF',
    nation: 'BRA',
    tier: 'SHOWTIME',
    badge: 'SAMBA SKILL',
    tagline: 'Ball Control • 102',
    image: '/images/neymar.jpg',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-500/30',
    accentText: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    cardBg: 'from-[#1a1707] via-[#0d121c] to-[#060810]',
    stats: [
      { label: 'Dribbling', val: 102, color: 'text-yellow-400' },
      { label: 'Tight Space', val: 100, color: 'text-emerald-400' },
      { label: 'Balance', val: 99, color: 'text-cyan-400' }
    ]
  },
  {
    id: 'suarez',
    name: 'Luis Suárez',
    cardName: 'L. SUÁREZ',
    rating: 101,
    position: 'CF',
    nation: 'URU',
    tier: 'EPIC LEGEND',
    badge: 'EL PISTOLERO',
    tagline: 'Offensive Aware • 101',
    image: '/images/suarez.jpg',
    borderColor: 'border-rose-400',
    glowColor: 'shadow-rose-500/30',
    accentText: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    cardBg: 'from-[#220710] via-[#0d121c] to-[#060810]',
    stats: [
      { label: 'Finishing', val: 101, color: 'text-rose-400' },
      { label: 'Aggression', val: 99, color: 'text-amber-400' },
      { label: 'Heading', val: 95, color: 'text-cyan-400' }
    ]
  },
  {
    id: 'pedri',
    name: 'Pedri González',
    cardName: 'PEDRI',
    rating: 100,
    position: 'CMF',
    nation: 'ESP',
    tier: 'PLAYMAKER',
    badge: 'MAESTRO',
    tagline: 'Low Pass • 101',
    image: '/images/pedri.jpg',
    borderColor: 'border-purple-400',
    glowColor: 'shadow-purple-500/30',
    accentText: 'text-purple-400',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    cardBg: 'from-[#19092b] via-[#0d121c] to-[#060810]',
    stats: [
      { label: 'Passing', val: 101, color: 'text-purple-400' },
      { label: 'Stamina', val: 99, color: 'text-emerald-400' },
      { label: 'Vision', val: 98, color: 'text-cyan-400' }
    ]
  },
  {
    id: 'aguero',
    name: 'Sergio Agüero',
    cardName: 'S. AGÜERO',
    rating: 100,
    position: 'CF',
    nation: 'ARG',
    tier: 'ICONIC 93:20',
    badge: 'CLUTCH KING',
    tagline: 'Poacher • 100',
    image: '/images/aguero.jpg',
    borderColor: 'border-teal-400',
    glowColor: 'shadow-teal-500/30',
    accentText: 'text-teal-400',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    cardBg: 'from-[#071f1b] via-[#0d121c] to-[#060810]',
    stats: [
      { label: 'Acceleration', val: 100, color: 'text-teal-400' },
      { label: 'Finishing', val: 100, color: 'text-amber-400' },
      { label: 'Balance', val: 97, color: 'text-emerald-400' }
    ]
  }
]

export default function LandingPage({
  onOpenCreateOrg,
  onOpenLoginOrg,
  onOpenDemo,
  theme,
  onToggleTheme
}) {
  const isDark = theme === 'dark'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#06090e] text-slate-100' : 'bg-[#f4f6fa] text-slate-900'} font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors`}>
      
      {/* 1. Header Navigation Bar */}
      <header className={`sticky top-0 z-50 border-b ${isDark ? 'border-[#182338]/80 bg-[#080d16]/90' : 'border-slate-200 bg-white/95'} backdrop-blur-xl transition-colors`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-base sm:text-xl shadow-lg shadow-emerald-500/30 shrink-0">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div className="min-w-0">
              <span className={`font-extrabold text-sm sm:text-lg tracking-tight font-heading block leading-none truncate ${isDark ? 'text-white' : 'text-slate-950'}`}>
                eFootball League
              </span>
              <span className="text-[9px] sm:text-[11px] text-emerald-500 font-semibold uppercase tracking-wider block">
                Tournament Platform
              </span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={onToggleTheme}
              type="button"
              title={isDark ? 'Switch to White / Light Mode' : 'Switch to Dark Mode'}
              className={`p-1.5 sm:p-2 rounded-xl border transition ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:border-slate-700'
                  : 'bg-white border-slate-300 text-indigo-600 hover:border-slate-400 shadow-sm'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            <button
              onClick={onOpenLoginOrg}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:border-emerald-500/50'
                  : 'bg-white border-slate-300 text-slate-800 hover:border-emerald-500/50 shadow-sm'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign In</span>
            </button>

            <button
              onClick={onOpenCreateOrg}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 transition shadow-lg shadow-emerald-500/30"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Create League Free</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION: Full Stadium Arena + MESSI, RONALDO, YAMAL IN ONE VIEW */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24">
        
        {/* Stadium Background */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <img
            src="/images/stadium.jpg"
            alt="Football Stadium Floodlights"
            className={`w-full h-full object-cover object-center ${
              isDark 
                ? 'filter brightness-[0.42] contrast-[1.25] saturate-[1.3] scale-105'
                : 'filter brightness-[0.9] contrast-[1.1] saturate-[1.2] scale-105 opacity-70'
            }`}
          />
          <div className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-t from-[#06090e] via-[#06090e]/80 to-transparent'
              : 'bg-gradient-to-t from-[#f4f6fa] via-[#f4f6fa]/75 to-[#f4f6fa]/30'
          }`}></div>
          <div className={`absolute inset-0 ${
            isDark
              ? 'bg-gradient-to-r from-[#06090e]/95 via-[#06090e]/75 to-[#06090e]/90'
              : 'bg-gradient-to-r from-[#f4f6fa]/95 via-[#f4f6fa]/60 to-[#f4f6fa]/85'
          }`}></div>
          
          <div className={`absolute -top-32 left-1/3 w-[600px] h-[500px] blur-[140px] rounded-full pointer-events-none ${
            isDark ? 'bg-emerald-500/20' : 'bg-emerald-400/25'
          }`}></div>
          <div className={`absolute -top-32 right-1/4 w-[600px] h-[500px] blur-[140px] rounded-full pointer-events-none ${
            isDark ? 'bg-cyan-500/20' : 'bg-cyan-400/25'
          }`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            
            {/* Left Column: Headlines & Action Buttons */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-5">
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                isDark
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-emerald-100/90 border border-emerald-300 text-emerald-800'
              }`}>
                <Sparkles className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span>COMMUNITY eFOOTBALL PLATFORM</span>
              </div>

              <h1 className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-heading leading-[1.1] ${
                isDark ? 'text-white' : 'text-slate-950'
              }`}>
                KICK OFF YOUR <br />
                <span className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                  eFOOTBALL LEAGUE
                </span> <br />
                WITH ZERO MATH.
              </h1>

              <p className={`text-xs sm:text-sm max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Automated Berger round-robin schedules, organizer 24h forfeit enforcement, live standings, and 1-click WhatsApp tables.
              </p>

              {/* CTAs */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={onOpenCreateOrg}
                  className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 group transform hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>Create League Organization</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>

                <button
                  onClick={onOpenDemo}
                  className={`w-full sm:w-auto px-5 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center justify-center gap-1.5 backdrop-blur-md shadow-md ${
                    isDark
                      ? 'bg-[#0c1424]/90 hover:bg-[#121c32] text-white border-[#223352]'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-emerald-500" />
                  <span>Live Demo</span>
                </button>
              </div>

              {/* Feature Chips */}
              <div className={`pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-3 text-[11px] sm:text-xs ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <span className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border shadow-sm ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/95 border-slate-200'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 100% Free
                </span>
                <span className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border shadow-sm ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/95 border-slate-200'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 24H Forfeits
                </span>
                <span className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border shadow-sm ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white/95 border-slate-200'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Multi-Seasons
                </span>
              </div>

            </div>

            {/* Right Column: RONALDO + MESSI + YAMAL IN ONE VIEW (SIDE-BY-SIDE FULL SIZE) */}
            <div className="lg:col-span-7 flex justify-center items-center py-2">
              <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 max-w-[640px] w-full items-center">
                {HERO_TRIO.map((card) => renderFullCard(card, card.rotation))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. FULL SIZE SUPERSTAR CARD GALLERY: ALL 9 CARDS FULL HEIGHT & STATS */}
      <section className={`py-16 border-t ${isDark ? 'border-[#182338] bg-[#090e18]' : 'border-slate-200 bg-[#f8fafc]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${
              isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-100/80 border-amber-300 text-amber-700 shadow-sm'
            }`}>
              <Flame className="w-4 h-4 text-amber-500" />
              <span>FULL SIZE eFOOTBALL CARDS</span>
            </div>
            <h2 className={`text-2xl sm:text-4xl font-black font-heading ${isDark ? 'text-white' : 'text-slate-950'}`}>
              Legendary Cards in Your Tournament
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Mbappé, Haaland, Neymar, Pedri, Suárez & Agüero — full statistics, ratings, and artwork.
            </p>
          </div>

          {/* Full Size Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6 max-w-5xl mx-auto justify-items-center">
            {ALL_SUPERSTARS.slice(3).map((player) => renderFullCard(player, 'hover:-translate-y-2', true))}
          </div>

        </div>
      </section>

      {/* 4. SOFTWARE FEATURES SHOWCASE */}
      <section className="py-14 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className={`border rounded-3xl p-6 sm:p-10 shadow-xl ${
            isDark
              ? 'bg-gradient-to-r from-[#0d1627] via-[#09101d] to-[#0d1627] border-emerald-500/30'
              : 'bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 border-slate-200 shadow-md'
          }`}>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-6 space-y-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                }`}>
                  NEIGHBORHOOD TOURNAMENT ENGINE
                </span>
                
                <h3 className={`text-2xl sm:text-3xl font-black font-heading leading-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Auto-Calculated Standings for 10 to 14 Friends
                </h3>

                <ul className={`space-y-2.5 text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Win = 3pts, Draw = 1pt, Loss = 0pts:</strong> Live updates across all phones.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span><strong>24-Hour Forfeit Rule:</strong> Eliminates ghosting by awarding 0 pts to both and incrementing played count.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <span><strong>1-Click WhatsApp Table:</strong> Formatted tables with rank trophies ready to share.</span>
                  </li>
                </ul>

                <div className="pt-2">
                  <button
                    onClick={onOpenCreateOrg}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                  >
                    <span>Create Your League Organization Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sample Standings Preview */}
              <div className="lg:col-span-6">
                <div className={`border rounded-2xl p-4 sm:p-5 shadow-lg ${
                  isDark
                    ? 'bg-[#060a12] border-[#1c2a42]'
                    : 'bg-white border-slate-200 shadow-md'
                }`}>
                  <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
                    isDark ? 'border-[#1c2a42]' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-500" />
                      <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Live Standings Preview
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                      isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Realtime Sync
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className={`flex items-center justify-between p-2 rounded-xl border ${
                      isDark
                        ? 'bg-slate-900/90 border-amber-500/30'
                        : 'bg-amber-50/70 border-amber-300 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">1</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Shibil FC</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>6P 5W 1D</span>
                        <span className="text-emerald-600 font-bold">+12 GD</span>
                        <span className="text-amber-600 font-black text-sm">16 PTS</span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-xl border ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-950 font-black text-[10px] flex items-center justify-center">2</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Adinan</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>6P 4W 1D</span>
                        <span className="text-emerald-600 font-bold">+7 GD</span>
                        <span className={`font-black text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>13 PTS</span>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-xl border ${
                      isDark
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-700 text-white font-black text-[10px] flex items-center justify-center">3</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Sinan</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>6P 3W 2D</span>
                        <span className="text-emerald-600 font-bold">+4 GD</span>
                        <span className={`font-black text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>11 PTS</span>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                    isDark ? 'border-[#1c2a42] text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <Share2 className="w-3.5 h-3.5" /> Instant WhatsApp Formatter
                    </span>
                    <span className="text-slate-400 font-mono">1 Click to Copy</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 5. Footer */}
      <footer className={`border-t py-8 text-center text-xs ${isDark ? 'border-[#182338] text-slate-500' : 'border-slate-200 text-slate-500'}`}>
        <p className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span>© 2026 eFootball League Platform</span>
          <span>•</span>
          <span>Developed by Shibil</span>
          <span>•</span>
          <a
            href="mailto:shibilmuhammed069@gmail.com"
            className="text-emerald-500 hover:text-emerald-400 hover:underline transition font-mono"
          >
            shibilmuhammed069@gmail.com
          </a>
        </p>
      </footer>

    </div>
  )
}

// Full Size eFootball Card Renderer
function renderFullCard(card, customClass = '', isFullGallery = false) {
  const cardWidthClass = isFullGallery ? 'w-full max-w-[260px]' : 'w-full'
  const portraitHeightClass = isFullGallery ? 'h-40 sm:h-44' : 'h-20 xs:h-26 sm:h-36'

  return (
    <div
      key={card.id}
      className={`efootball-card ${cardWidthClass} bg-gradient-to-b ${card.cardBg} border-2 ${card.borderColor} rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-2xl ${card.glowColor} ${customClass} hover:rotate-0 hover:scale-105 transition duration-300 relative group overflow-hidden`}
    >
      {/* Top Holographic Tier Banner */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <span className={`text-[7px] xs:text-[8px] sm:text-[9px] font-black tracking-widest uppercase truncate ${card.accentText}`}>
          {card.tier}
        </span>
        <div className="flex items-center text-amber-400 shrink-0">
          <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400" />
          <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400" />
          <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400" />
        </div>
      </div>

      {/* Rating & Position */}
      <div className="flex items-baseline justify-between mt-1 sm:mt-2 mb-0.5 sm:mb-1">
        <div className="flex items-baseline gap-0.5 sm:gap-1">
          <span className={`text-xl xs:text-2xl sm:text-3xl font-black font-mono tracking-tight ${card.accentText}`}>
            {card.rating}
          </span>
          <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black !text-white bg-white/20 border border-white/25 px-0.5 sm:px-1 rounded">
            {card.position}
          </span>
        </div>
        <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-bold !text-slate-300 font-mono">{card.nation}</span>
      </div>

      {/* Portrait Image */}
      <div className={`relative my-1 sm:my-1.5 ${portraitHeightClass} w-full rounded-lg sm:rounded-xl overflow-hidden border border-white/20 bg-slate-950 shadow-inner`}>
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-full object-cover object-top filter contrast-110 group-hover:scale-105 transition duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060810] via-transparent to-transparent"></div>
        <span className={`absolute bottom-0.5 right-1 sm:bottom-1 sm:right-1.5 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[7px] xs:text-[8px] font-black border shadow ${card.badgeBg}`}>
          {card.badge}
        </span>
      </div>

      {/* Name & Tagline */}
      <div className="text-center pt-0.5 sm:pt-1 pb-0.5">
        <p className="font-black text-[10px] xs:text-xs sm:text-sm !text-white font-heading tracking-wide truncate">
          {card.cardName || card.name}
        </p>
        <p className={`text-[8px] xs:text-[9px] sm:text-[10px] font-mono truncate ${card.accentText}`}>
          {card.tagline}
        </p>
      </div>

      {/* Full Stat Bars */}
      <div className="mt-1 sm:mt-2 pt-1 border-t border-white/10 space-y-0.5 sm:space-y-1 text-[7px] xs:text-[8px] sm:text-[9px] font-mono !text-slate-300">
        {card.stats.map(s => (
          <div key={s.label} className="flex justify-between items-center">
            <span className="!text-slate-400 truncate pr-1">{s.label}</span>
            <span className={`font-bold shrink-0 ${card.accentText}`}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
