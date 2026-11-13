import React, { useState, useEffect } from 'react'
import { X, LogIn, Lock, Trophy, Eye, EyeOff, Search, AlertCircle, Sparkles, Check } from 'lucide-react'

export default function LoginOrgModal({
  isOpen,
  onClose,
  organizations = [],
  onLogin,
  onGuestAccess
}) {
  if (!isOpen) return null

  // Pre-fill with last visited org or first
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Initialize selected org
  useEffect(() => {
    if (organizations.length > 0) {
      const savedOrgId = localStorage.getItem('efootball_last_login_org_id')
      const initial = organizations.find(o => o.id === savedOrgId) || organizations[0]
      setSelectedOrg(initial)
      setSearchTerm(initial?.name || '')
    }
  }, [organizations])

  // Filter organizations matching search term
  const filteredOrgs = organizations.filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  )

  const handleSelectOrg = (org) => {
    setSelectedOrg(org)
    setSearchTerm(org.name)
    setShowSuggestions(false)
    setErrorMsg('')
  }

  const handleLoginSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')

    // Try finding org by exact match or selected
    let targetOrg = selectedOrg
    if (!targetOrg || targetOrg.name.toLowerCase() !== searchTerm.toLowerCase().trim()) {
      targetOrg = organizations.find(o => o.name.toLowerCase() === searchTerm.toLowerCase().trim()) || filteredOrgs[0]
    }

    if (!targetOrg) {
      setErrorMsg('League not found. Check the name or create a new league.')
      return
    }

    // Verify PIN (matches org PIN or master PIN 1234)
    if (pin.trim() === targetOrg.pin || pin.trim() === '1234') {
      localStorage.setItem('efootball_last_login_org_id', targetOrg.id)
      onLogin(targetOrg)
      onClose()
    } else {
      setErrorMsg('Incorrect PIN. Please try again.')
    }
  }

  const handleGuest = () => {
    let targetOrg = selectedOrg || filteredOrgs[0] || organizations[0]
    if (targetOrg) {
      onGuestAccess(targetOrg)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#121826] border border-[#222f49] w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-[#1f2b42] flex items-center justify-between bg-[#151c2d] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-base sm:text-lg shadow-md shadow-emerald-500/20 shrink-0">
              <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base font-heading">Organizer Sign In</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Unlock your league management dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleLoginSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-3.5 sm:space-y-4">
          
          {/* Quick Select Chips */}
          {organizations.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Available Leagues
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none">
                {organizations.map(org => {
                  const isSelected = selectedOrg?.id === org.id
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => handleSelectOrg(org)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                          : 'bg-slate-900 border-[#222f47] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <Trophy className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{org.name}</span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* League Name Search / Text Field */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              League / Organization Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowSuggestions(true)
                  setErrorMsg('')
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type your league name..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-[#243048] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Suggestions Dropdown (Only appears when typing) */}
            {showSuggestions && filteredOrgs.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-[#101625] border border-[#243048] rounded-xl shadow-2xl max-h-40 overflow-y-auto overflow-x-hidden">
                {filteredOrgs.map(org => (
                  <div
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className="px-3.5 py-2.5 text-xs text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer flex items-center justify-between transition border-b border-slate-800/60 last:border-none"
                  >
                    <span className="font-semibold">{org.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Select</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secret 4-Digit PIN Input with Visibility Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Organizer Passcode (PIN)
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
              </button>
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                required
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value)
                  setErrorMsg('')
                }}
                placeholder="Enter 4-digit PIN (e.g. 1234)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-[#243048] rounded-xl text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl transition shadow-xl shadow-emerald-500/25 text-sm flex items-center justify-center gap-2"
            >
              <span>Sign In as Organizer</span>
              <LogIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGuest}
              className="w-full py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white font-medium rounded-xl text-xs transition border border-slate-800 flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Or View as Player / Spectator (No PIN Needed)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
