import React from 'react'
import { Scale, Clock, Award, Shield, CheckCircle } from 'lucide-react'

export default function RulesSection() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Intro Header */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-6 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">Official League Regulations</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Neighborhood eFootball Championship Standards</p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        
        {/* Scoring System */}
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Award className="w-4 h-4" /> Scoring Points Matrix
          </div>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0e131d] border border-slate-200 dark:border-[#1b2334] gap-2">
              <span>Win in 90 mins / Extra Time</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">3 Points</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0e131d] border border-slate-200 dark:border-[#1b2334] gap-2">
              <span>Draw / Tie</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded shrink-0">1 Point</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0e131d] border border-slate-200 dark:border-[#1b2334] gap-2">
              <span>Defeat / Loss</span>
              <span className="font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">0 Points</span>
            </li>
          </ul>
        </div>

        {/* 24-Hour Rule */}
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <Clock className="w-4 h-4" /> 24-Hour Match Window Rule
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl space-y-2 text-xs text-rose-800 dark:text-rose-200">
            <p className="font-semibold text-rose-700 dark:text-rose-300">Organizer Calculated Forfeiture:</p>
            <p className="leading-relaxed">
              Every fixture round has a 24-hour window from the day it is unlocked. If two players fail to coordinate and play their scheduled match within 24 hours, the organizer marks it as <strong>Forfeit</strong>.
            </p>
            <div className="pt-1 text-[11px] text-rose-700 dark:text-rose-300/80 font-mono">
              • Result: Both players receive 0 Points.<br />
              • Matches Played count: Increments +1 for both.<br />
              • Goals: Recorded as 0 - 0.
            </div>
          </div>
        </div>

        {/* Tiebreakers */}
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            <Shield className="w-4 h-4" /> Standings Tie-Breakers
          </div>
          <ol className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside">
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d]"><strong>Total Points:</strong> Highest points ranks higher.</li>
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d]"><strong>Goal Difference (GD):</strong> (Goals For - Goals Against).</li>
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d]"><strong>Goals For (GF):</strong> Most total goals scored.</li>
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d]"><strong>Head-to-Head:</strong> Direct match score between tied players.</li>
          </ol>
        </div>

        {/* eFootball Match Settings */}
        <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1f2b42] rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" /> Recommended In-Game Setup
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d] flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Match Length:</span>
              <span className="font-semibold text-slate-900 dark:text-white">10 Minutes</span>
            </li>
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d] flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Injuries:</span>
              <span className="font-semibold text-slate-900 dark:text-white">On</span>
            </li>
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d] flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Substitutions:</span>
              <span className="font-semibold text-slate-900 dark:text-white">5 (3 stoppage windows)</span>
            </li>
            <li className="p-1.5 rounded bg-slate-50 dark:bg-[#0e131d] flex justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400">Connection:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Friend Match Room</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  )
}

