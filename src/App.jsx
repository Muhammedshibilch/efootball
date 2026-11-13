import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import { calculateStandings, generateRoundRobinFixtures, generateUUID, AVATAR_COLORS } from './lib/leagueEngine'
import LandingPage from './components/LandingPage'
import CreateOrgModal from './components/CreateOrgModal'
import LoginOrgModal from './components/LoginOrgModal'
import Navbar from './components/Navbar'
import StandingsTable from './components/StandingsTable'
import FixturesList from './components/FixturesList'
import StatsSection from './components/StatsSection'
import RulesSection from './components/RulesSection'
import LeagueSetup from './components/LeagueSetup'
import MatchScoreModal from './components/MatchScoreModal'
import MatchGraphicModal from './components/MatchGraphicModal'
import WeekGraphicModal from './components/WeekGraphicModal'
import StandingsGraphicModal from './components/StandingsGraphicModal'
import PlayoffsView from './components/PlayoffsView'
import PlayoffScoreModal from './components/PlayoffScoreModal'
import ChampionCelebrationModal from './components/ChampionCelebrationModal'
import SeasonChampionBanner from './components/SeasonChampionBanner'
import {
  loadPlayoffsData,
  savePlayoffsData,
  initializePlayoffs,
  recordPlayoffScore,
  resetPlayoffScore,
  lockPlayoffFormat
} from './lib/playoffsEngine'
import NewSeasonModal from './components/NewSeasonModal'
import AdminPinModal from './components/AdminPinModal'
import { Trophy, RefreshCw, AlertCircle, ArrowRight, X, Sparkles, Calendar } from 'lucide-react'
import { useToast } from './context/ToastContext'

const DEFAULT_DEMO_ORG = {
  id: 'default-community-org',
  name: 'eFootball Community League',
  pin: '1234'
}

// Helper to strictly match tournaments to their parent organization
const isTourneyInOrg = (tourney, org) => {
  if (!tourney || !org) return false

  const orgNameClean = (org.name || '').toLowerCase().trim()
  const tourneyNameClean = (tourney.name || '').toLowerCase().trim()

  // 1. Explicit organization_id match
  if (tourney.organization_id && (tourney.organization_id === org.id || tourney.organization_id === org.name)) {
    return true
  }

  // 2. Default community league matches default demo tournaments
  if (org.id === 'default-community-org' || orgNameClean === 'efootball community league') {
    return tourneyNameClean.startsWith('efootball league') || tourneyNameClean === 'season 1' || tourneyNameClean.startsWith('default')
  }

  // 3. Name starts with organization name prefix (e.g. "club 18 - Season 1")
  if (tourneyNameClean.startsWith(orgNameClean + ' -') || tourneyNameClean === orgNameClean) {
    return true
  }

  // 4. Admin PIN match (only for non-default custom PINs to avoid false collisions with default '1234')
  if (org.pin && org.pin !== '1234' && tourney.admin_pin && tourney.admin_pin === org.pin) {
    // Ensure the tournament name doesn't explicitly belong to another organization with " - "
    if (!tourneyNameClean.includes(' - ') || tourneyNameClean.startsWith(orgNameClean + ' -')) {
      return true
    }
  }

  return false
}

// Helper to parse path and query parameters from window.location
const parseCurrentRoute = () => {
  if (typeof window === 'undefined') return { view: 'landing', tab: 'fixtures', orgParam: null, seasonParam: null, isSharedLink: false }
  const raw = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, '')
  const params = new URLSearchParams(window.location.search)
  const orgParam = params.get('org')
  const seasonParam = params.get('season')
  const isShared = params.get('share') === 'true' || params.get('share') === '1' || Boolean(orgParam && (raw === '' || raw === 'home' || raw === 'landing' || raw === 'fixtures' || raw === 'standings'))

  // When clicking a shared invite link, initially show Landing page for 6s showcase before redirecting!
  if (isShared && (orgParam || seasonParam)) {
    const targetTab = ['standings', 'fixtures', 'playoffs', 'stats', 'rules'].includes(raw) ? raw : 'fixtures'
    return { view: 'landing', tab: targetTab, orgParam, seasonParam, isSharedLink: true }
  }

  // Direct tab navigation without invite
  if (orgParam || ['standings', 'fixtures', 'playoffs', 'stats', 'rules', 'setup'].includes(raw)) {
    const validTab = ['standings', 'fixtures', 'playoffs', 'stats', 'rules'].includes(raw) ? raw : 'standings'
    return { view: 'league', tab: validTab, orgParam, seasonParam, isSharedLink: false }
  }
  return { view: 'landing', tab: 'standings', orgParam: null, seasonParam: null, isSharedLink: false }
}

export default function App() {
  const { toast } = useToast()
  
  // URL Route State
  const initialRoute = parseCurrentRoute()
  const [view, setView] = useState(initialRoute.view)
  const [activeTab, setActiveTab] = useState(initialRoute.tab)

  // 6-Second Auto-Redirect Welcome Experience for Shared Links
  const [shareWelcome, setShareWelcome] = useState(() => initialRoute.isSharedLink)
  const [countdown, setCountdown] = useState(6)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Organizations & Seasons
  const [organizations, setOrganizations] = useState([DEFAULT_DEMO_ORG])
  const [activeOrg, setActiveOrg] = useState(DEFAULT_DEMO_ORG)
  const [allTournaments, setAllTournaments] = useState([])
  const [activeTournament, setActiveTournament] = useState(null)

  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])

  // Shared link visitors are strictly non-admin read-only players
  const [isAdmin, setIsAdmin] = useState(false)

  // Unified Page Navigation (updates state AND address bar URL)
  const navigateTo = useCallback((targetView, targetTab = 'standings', replace = false) => {
    setView(targetView)
    if (targetView === 'league') {
      setActiveTab(targetTab)
      const targetPath = `/${targetTab}`
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({ view: 'league', tab: targetTab }, '', targetPath)
        } else {
          window.history.pushState({ view: 'league', tab: targetTab }, '', targetPath)
        }
      }
    } else {
      if (window.location.pathname !== '/') {
        if (replace) {
          window.history.replaceState({ view: 'landing' }, '', '/')
        } else {
          window.history.pushState({ view: 'landing' }, '', '/')
        }
      }
    }
  }, [])

  const navigateToTab = useCallback((tab) => {
    navigateTo('league', tab)
  }, [navigateTo])

  // Proceed from 6s landing welcome directly into Fixtures
  const handleProceedToFixtures = useCallback(() => {
    setIsRedirecting(true)
    setTimeout(() => {
      setIsRedirecting(false)
      setShareWelcome(false)
      navigateTo('league', 'fixtures')
      toast.success(
        `Welcome to ${activeOrg?.name || 'Tournament League'}! Viewing live round-robin fixtures.`,
        'Fixtures Loaded'
      )
    }, 650)
  }, [activeOrg?.name, navigateTo, toast])

  const handleCancelAutoRedirect = useCallback(() => {
    setShareWelcome(false)
    toast.info('Auto-redirect paused. Feel free to explore our website!')
  }, [toast])

  // 6-Second Auto-Redirect Countdown
  useEffect(() => {
    if (!shareWelcome || view !== 'landing') return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleProceedToFixtures()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [shareWelcome, view, handleProceedToFixtures])

  // Guard setup tab: non-admin users cannot access League Setup
  useEffect(() => {
    if (!isAdmin && activeTab === 'setup') {
      navigateToTab('standings')
    }
  }, [isAdmin, activeTab, navigateToTab])

  // Sync state on Browser Back & Forward button presses
  useEffect(() => {
    const onPopState = () => {
      const route = parseCurrentRoute()
      setView(route.view)
      if (route.view === 'league') {
        setActiveTab(route.tab)
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)

  // Theme (Dark / Light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('efootball_theme') || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
    }
    localStorage.setItem('efootball_theme', theme)
  }, [theme])

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Modals
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
  const [isLoginOrgOpen, setIsLoginOrgOpen] = useState(false)
  const [isNewSeasonOpen, setIsNewSeasonOpen] = useState(false)
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false)
  const [activeScoreFixture, setActiveScoreFixture] = useState(null)
  const [activeGraphicFixture, setActiveGraphicFixture] = useState(null)
  const [activeWeekGraphicData, setActiveWeekGraphicData] = useState(null)
  const [isStandingsGraphicOpen, setIsStandingsGraphicOpen] = useState(false)
  const [playoffsData, setPlayoffsData] = useState(null)
  const [activePlayoffScoreMatch, setActivePlayoffScoreMatch] = useState(null)
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false)
  const lastScrollYRef = useRef(0)
  const lastFixtureIdRef = useRef(null)

  const handleOpenScoreModal = (fixture) => {
    lastScrollYRef.current = window.scrollY
    lastFixtureIdRef.current = fixture?.id
    setActiveScoreFixture(fixture)
  }

  const handleCloseScoreModal = () => {
    setActiveScoreFixture(null)
    const savedY = lastScrollYRef.current
    const fixtureId = lastFixtureIdRef.current
    requestAnimationFrame(() => {
      if (savedY > 0) {
        window.scrollTo({ top: savedY, behavior: 'instant' })
      } else if (fixtureId) {
        const el = document.getElementById(`match-card-${fixtureId}`)
        if (el) el.scrollIntoView({ behavior: 'auto', block: 'nearest' })
      }
    })
    setTimeout(() => {
      if (savedY > 0 && Math.abs(window.scrollY - savedY) > 50) {
        window.scrollTo({ top: savedY, behavior: 'instant' })
      }
    }, 60)
  }

  // Strictly filter seasons belonging to the active organization
  const activeOrgSeasons = useMemo(() => {
    if (!activeOrg) return allTournaments
    return allTournaments.filter(t => isTourneyInOrg(t, activeOrg))
  }, [allTournaments, activeOrg])

  // Map of players by ID for fast lookup
  const playersMap = useMemo(() => {
    const map = {}
    players.forEach(p => {
      map[p.id] = p
    })
    return map
  }, [players])

  // Calculated Standings
  const standings = useMemo(() => {
    return calculateStandings(players, fixtures)
  }, [players, fixtures])

  // Load Organizations (from Supabase or local cache)
  const loadOrganizations = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('organizations').select('*').order('name', { ascending: true })
      if (!error && data && data.length > 0) {
        setOrganizations(data)
        return data
      }
    } catch {
      // Organizations table may not exist yet in Supabase
    }
    // Fallback: check localStorage
    const savedOrgs = localStorage.getItem('efootball_orgs')
    if (savedOrgs) {
      try {
        const parsed = JSON.parse(savedOrgs)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrganizations(parsed)
          return parsed
        }
      } catch {}
    }
    return [DEFAULT_DEMO_ORG]
  }, [])

  // Load All Tournaments / Seasons
  const loadTournaments = useCallback(async () => {
    try {
      setErrorMsg(null)
      const { data: tourneys, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      if (!tourneys || tourneys.length === 0) {
        // Create initial default Season 1 tournament
        const defaultTourney = {
          id: generateUUID(),
          name: 'eFootball League - Season 1',
          admin_pin: '1234',
          format: 'HOME_AWAY',
          match_duration_hours: 24,
          status: 'ACTIVE'
        }
        const { data: created, error: createErr } = await supabase
          .from('tournaments')
          .insert([defaultTourney])
          .select()
          .single()

        if (createErr) throw createErr
        setAllTournaments([created])
        setActiveTournament(created)
        return [created]
      }

      // Discover organizations from existing tournament names if not already present
      const discoveredMap = new Map()
      tourneys.forEach(t => {
        if (!t.name) return
        const parts = t.name.split(' - ')
        if (parts.length > 1) {
          const orgName = parts[0].trim()
          const key = orgName.toLowerCase()
          if (orgName && key !== 'efootball league' && !discoveredMap.has(key)) {
            discoveredMap.set(key, {
              id: 'org-' + key.replace(/[^a-z0-9]+/g, '-'),
              name: orgName,
              pin: t.admin_pin || '1234'
            })
          }
        }
      })

      if (discoveredMap.size > 0) {
        setOrganizations(prev => {
          const merged = [...prev]
          discoveredMap.forEach(org => {
            if (!merged.some(m => m.name.toLowerCase() === org.name.toLowerCase())) {
              merged.push(org)
            }
          })
          return merged
        })
      }

      setAllTournaments(tourneys)
      return tourneys
    } catch (err) {
      console.error('Error loading tournaments:', err)
      setErrorMsg('Failed to connect to Supabase: ' + err.message)
      return []
    }
  }, [])

  // Load players and fixtures for current tournament (silent = true prevents UI flicker & keeps scroll position)
  const loadLeagueData = useCallback(async (tourneyId, silent = false) => {
    if (!tourneyId) return
    if (!silent) {
      setLoading(true)
    }
    try {
      setErrorMsg(null)
      const [playersRes, fixturesRes] = await Promise.all([
        supabase
          .from('players')
          .select('*')
          .eq('tournament_id', tourneyId)
          .order('name', { ascending: true }),
        supabase
          .from('fixtures')
          .select('*')
          .eq('tournament_id', tourneyId)
          .order('round_number', { ascending: true })
      ])

      if (playersRes.error) throw playersRes.error
      if (fixturesRes.error) throw fixturesRes.error

      setPlayers(playersRes.data || [])
      setFixtures(fixturesRes.data || [])
      const pData = loadPlayoffsData(tourneyId)
      setPlayoffsData(pData)
    } catch (err) {
      console.error('Error loading league data:', err)
      setErrorMsg('Failed to fetch players/fixtures: ' + err.message)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  // Initial Load on Mount (supports incognito mode & shared links seamlessly)
  useEffect(() => {
    Promise.all([loadOrganizations(), loadTournaments()]).then(([orgs, tourneys]) => {
      if (tourneys && tourneys.length > 0) {
        const { orgParam, seasonParam } = parseCurrentRoute()
        const allLoadedOrgs = [...(orgs || [])]

        // Discover and merge all organizations from tournament names
        tourneys.forEach(t => {
          if (!t.name) return
          const parts = t.name.split(' - ')
          if (parts.length > 1) {
            const orgName = parts[0].trim()
            if (orgName && !allLoadedOrgs.some(o => o.name.toLowerCase().trim() === orgName.toLowerCase().trim())) {
              allLoadedOrgs.push({
                id: t.organization_id || ('org-' + orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
                name: orgName,
                pin: t.admin_pin || '1234'
              })
            }
          }
        })

        // STEP 1: Find target tournament first by seasonParam (exact ID) or orgParam
        let targetTourney = null
        if (seasonParam) {
          targetTourney = tourneys.find(t => 
            t.id === seasonParam || 
            (t.name && t.name.toLowerCase().trim() === seasonParam.toLowerCase().trim())
          )
        }

        if (!targetTourney && orgParam) {
          const cleanOrg = orgParam.toLowerCase().trim()
          targetTourney = tourneys.find(t => 
            (t.name && t.name.toLowerCase().startsWith(cleanOrg + ' -')) ||
            (t.name && t.name.toLowerCase() === cleanOrg) ||
            (t.organization_id && (t.organization_id.toLowerCase() === cleanOrg || t.organization_id.toLowerCase().includes(cleanOrg)))
          )
        }

        // STEP 2: Resolve the active organization
        let currentOrg = null
        if (targetTourney) {
          let orgName = orgParam
          if (!orgName && targetTourney.name && targetTourney.name.includes(' - ')) {
            orgName = targetTourney.name.split(' - ')[0].trim()
          }
          if (!orgName) orgName = targetTourney.name

          currentOrg = allLoadedOrgs.find(o => o.name.toLowerCase().trim() === orgName.toLowerCase().trim()) || {
            id: targetTourney.organization_id || ('org-' + orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
            name: orgName,
            pin: targetTourney.admin_pin || '1234'
          }
        } else if (orgParam) {
          const cleanOrg = orgParam.toLowerCase().trim()
          currentOrg = allLoadedOrgs.find(o => 
            (o.name && o.name.toLowerCase().trim() === cleanOrg) || 
            (o.id && o.id.toLowerCase().trim() === cleanOrg)
          ) || {
            id: 'org-' + cleanOrg.replace(/[^a-z0-9]+/g, '-'),
            name: orgParam,
            pin: '1234'
          }
        } else {
          const savedOrgId = localStorage.getItem('efootball_last_login_org_id')
          currentOrg = (savedOrgId && allLoadedOrgs.find(o => o.id === savedOrgId || o.name === savedOrgId)) || activeOrg || DEFAULT_DEMO_ORG
        }

        // STEP 3: Fallback target tournament within currentOrg if needed
        if (!targetTourney) {
          const matchingSeasons = tourneys.filter(t => isTourneyInOrg(t, currentOrg))
          const savedSeasonId = localStorage.getItem('efootball_active_season')
          targetTourney = (savedSeasonId && matchingSeasons.find(t => t.id === savedSeasonId)) || matchingSeasons[0] || tourneys[0]
        }

        // STEP 4: Persist organization and tournament to state & storage
        setActiveOrg(currentOrg)
        setActiveTournament(targetTourney)
        setOrganizations(allLoadedOrgs)
        try {
          localStorage.setItem('efootball_last_login_org_id', currentOrg.id)
          localStorage.setItem('efootball_active_season', targetTourney.id)
        } catch {}

        loadLeagueData(targetTourney.id)
      } else {
        setLoading(false)
      }
    })
  }, [loadOrganizations, loadTournaments, loadLeagueData])

  // Strictly ensure activeTournament belongs to the active organization
  useEffect(() => {
    if (!activeOrg || allTournaments.length === 0) return

    const orgSeasons = allTournaments.filter(t => isTourneyInOrg(t, activeOrg))

    if (orgSeasons.length > 0) {
      // If current activeTournament does not belong to activeOrg, switch to activeOrg's first season
      if (!activeTournament || !orgSeasons.some(s => s.id === activeTournament.id)) {
        setActiveTournament(orgSeasons[0])
        loadLeagueData(orgSeasons[0].id)
      }
    } else if (view === 'league') {
      // Auto-create initial Season 1 for this organization if none exists
      const initialSeasonName = `${activeOrg.name} - Season 1`
      const newTourney = {
        id: generateUUID(),
        name: initialSeasonName,
        admin_pin: activeOrg.pin || '1234',
        format: 'HOME_AWAY',
        match_duration_hours: 24,
        status: 'ACTIVE',
        organization_id: activeOrg.id
      }
      supabase.from('tournaments').insert([newTourney]).select().single().then(({ data, error }) => {
        if (!error && data) {
          setAllTournaments(prev => [...prev, data])
          setActiveTournament(data)
          loadLeagueData(data.id)
        } else {
          delete newTourney.organization_id
          supabase.from('tournaments').insert([newTourney]).select().single().then(({ data: fallback }) => {
            if (fallback) {
              setAllTournaments(prev => [...prev, fallback])
              setActiveTournament(fallback)
              loadLeagueData(fallback.id)
            }
          })
        }
      })
    }
  }, [activeOrg, allTournaments, activeTournament, view, loadLeagueData])

  // Real-time Supabase Subscription
  useEffect(() => {
    if (!activeTournament?.id) return

    const channel = supabase
      .channel('efootball-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures', filter: `tournament_id=eq.${activeTournament.id}` },
        () => {
          loadLeagueData(activeTournament.id, true) // silent = true: background update preserves scroll & avoids UI flicker
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `tournament_id=eq.${activeTournament.id}` },
        () => {
          loadLeagueData(activeTournament.id, true) // silent = true
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTournament?.id, loadLeagueData])

  // Switch Season (strictly within current organization's seasons)
  const handleSwitchSeason = (seasonId) => {
    const target = activeOrgSeasons.find(s => s.id === seasonId) || allTournaments.find(s => s.id === seasonId)
    if (target) {
      localStorage.setItem('efootball_active_season', target.id)
      setActiveTournament(target)
      loadLeagueData(target.id)
    }
  }

  // Create Organization Handler
  const handleCreateOrganization = async ({ name, pin, seasonName, format }) => {
    const newOrgId = generateUUID()
    const newOrg = {
      id: newOrgId,
      name,
      pin
    }

    // Try saving org in Supabase
    try {
      await supabase.from('organizations').insert([newOrg])
    } catch {}

    // Save in local state & cache
    const updatedOrgs = [...organizations, newOrg]
    setOrganizations(updatedOrgs)
    localStorage.setItem('efootball_orgs', JSON.stringify(updatedOrgs))
    setActiveOrg(newOrg)

    // Create Initial Season for this Organization
    const newTourneyId = generateUUID()
    const cleanSeasonName = seasonName.startsWith(name) ? seasonName : `${name} - ${seasonName}`
    const newTourney = {
      id: newTourneyId,
      name: cleanSeasonName,
      admin_pin: pin,
      format,
      match_duration_hours: 24,
      status: 'ACTIVE',
      organization_id: newOrgId
    }

    try {
      const { data: created, error } = await supabase.from('tournaments').insert([newTourney]).select().single()
      if (error) {
        // Fallback without organization_id column if not yet added in Supabase
        delete newTourney.organization_id
        const fallbackRes = await supabase.from('tournaments').insert([newTourney]).select().single()
        if (fallbackRes.error) throw fallbackRes.error
        setAllTournaments(prev => [...prev, fallbackRes.data])
        setActiveTournament(fallbackRes.data)
        await loadLeagueData(fallbackRes.data.id)
      } else {
        setAllTournaments(prev => [...prev, created])
        setActiveTournament(created)
        await loadLeagueData(created.id)
      }
    } catch (err) {
      console.error('Error creating initial season:', err)
    }

    setIsAdmin(true)
    navigateTo('league', 'standings')
  }

  // Sign In to Organization Handler
  const handleLoginOrganization = (targetOrg) => {
    setActiveOrg(targetOrg)
    setIsAdmin(true)
    navigateTo('league', 'standings')

    // Switch strictly to the first season of this organization
    const orgTourneys = allTournaments.filter(t => isTourneyInOrg(t, targetOrg))
    if (orgTourneys.length > 0) {
      setActiveTournament(orgTourneys[0])
      loadLeagueData(orgTourneys[0].id)
    }
  }

  // Guest / Demo Access Handler
  const handleGuestAccess = (targetOrg) => {
    const org = targetOrg || DEFAULT_DEMO_ORG
    setActiveOrg(org)
    setIsAdmin(false)
    navigateTo('league', 'standings')

    const orgTourneys = allTournaments.filter(t => isTourneyInOrg(t, org))
    if (orgTourneys.length > 0) {
      setActiveTournament(orgTourneys[0])
      loadLeagueData(orgTourneys[0].id)
    }
  }

  // Create New Season inside Current Organization
  const handleCreateSeason = async ({ name, format, copyPlayers }) => {
    const newId = generateUUID()
    const orgPrefix = activeOrg?.name || 'eFootball League'
    const cleanName = name.startsWith(orgPrefix) ? name : `${orgPrefix} - ${name}`
    const newTournament = {
      id: newId,
      name: cleanName,
      admin_pin: activeOrg?.pin || activeTournament?.admin_pin || '1234',
      format,
      match_duration_hours: 24,
      status: 'ACTIVE',
      organization_id: activeOrg?.id
    }

    let createdTourney
    const { data, error } = await supabase.from('tournaments').insert([newTournament]).select().single()
    if (error) {
      delete newTournament.organization_id
      const fallback = await supabase.from('tournaments').insert([newTournament]).select().single()
      if (fallback.error) throw fallback.error
      createdTourney = fallback.data
    } else {
      createdTourney = data
    }

    if (copyPlayers && copyPlayers.length > 0) {
      const playersToInsert = copyPlayers.map(p => ({
        id: generateUUID(),
        tournament_id: newId,
        name: p.name,
        gamertag: p.gamertag,
        avatar_color: p.avatar_color
      }))
      await supabase.from('players').insert(playersToInsert)
    }

    setAllTournaments(prev => [...prev, createdTourney])
    localStorage.setItem('efootball_active_season', newId)
    setActiveTournament(createdTourney)
    await loadLeagueData(newId)
    navigateToTab('fixtures')
  }

  // Update Season Settings
  const handleUpdateTournament = async (updates) => {
    if (!activeTournament?.id) return
    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', activeTournament.id)
      .select()
      .single()

    if (error) throw error
    setActiveTournament(data)
    setAllTournaments(prev => prev.map(s => s.id === data.id ? data : s))
  }

  // Add Player
  const handleAddPlayer = async ({ name, gamertag, avatar_color }) => {
    if (!activeTournament?.id) return
    const newPlayer = {
      id: generateUUID(),
      tournament_id: activeTournament.id,
      name,
      gamertag,
      avatar_color
    }

    const { data, error } = await supabase
      .from('players')
      .insert([newPlayer])
      .select()
      .single()

    if (error) throw error
    setPlayers(prev => [...prev, data])
  }

  // Remove Player
  const handleRemovePlayer = async (playerId) => {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId)

    if (error) throw error
    setPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  // Clear All Players
  const handleClearAllPlayers = async () => {
    if (!activeTournament?.id) return
    await supabase.from('fixtures').delete().eq('tournament_id', activeTournament.id)
    const { error } = await supabase.from('players').delete().eq('tournament_id', activeTournament.id)
    if (error) throw error
    setPlayers([])
    setFixtures([])
  }

  // Load Preset Players
  const handleLoadPreset = async (presetList) => {
    if (!activeTournament?.id) return
    const playersToInsert = presetList.map(p => ({
      id: generateUUID(),
      tournament_id: activeTournament.id,
      name: p.name,
      gamertag: p.gamertag,
      avatar_color: p.avatar_color
    }))

    const { data, error } = await supabase
      .from('players')
      .insert(playersToInsert)
      .select()

    if (error) throw error
    setPlayers(prev => [...prev, ...data])
  }

  // Generate Fixtures
  const handleGenerateFixtures = async (overrideFormat) => {
    if (!activeTournament?.id || players.length < 2) return
    const formatToUse = overrideFormat || activeTournament.format || 'HOME_AWAY'
    
    await supabase.from('fixtures').delete().eq('tournament_id', activeTournament.id)
    const newFixtures = generateRoundRobinFixtures(players, activeTournament.id, formatToUse)

    const { data, error } = await supabase
      .from('fixtures')
      .insert(newFixtures)
      .select()

    if (error) throw error
    setFixtures(data || [])
    navigateToTab('fixtures')
  }

  // Save Match Score
  const handleSaveScore = async (fixtureId, homeScore, awayScore, notes) => {
    const { data, error } = await supabase
      .from('fixtures')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        notes
      })
      .eq('id', fixtureId)
      .select()
      .single()

    if (error) throw error
    setFixtures(prev => prev.map(f => f.id === fixtureId ? data : f))
  }

  // Mark 24h Forfeit
  const handleMarkForfeit = async (fixtureId, notes) => {
    const { data, error } = await supabase
      .from('fixtures')
      .update({
        home_score: 0,
        away_score: 0,
        status: 'EXPIRED_DISQUALIFIED',
        completed_at: new Date().toISOString(),
        notes: notes || '24h match window expired (0 pts each, +1 played)'
      })
      .eq('id', fixtureId)
      .select()
      .single()

    if (error) throw error
    setFixtures(prev => prev.map(f => f.id === fixtureId ? data : f))
  }

  // Reset Match
  const handleResetMatch = async (fixtureId) => {
    const { data, error } = await supabase
      .from('fixtures')
      .update({
        home_score: null,
        away_score: null,
        status: 'PENDING',
        completed_at: null,
        notes: ''
      })
      .eq('id', fixtureId)
      .select()
      .single()

    if (error) throw error
    setFixtures(prev => prev.map(f => f.id === fixtureId ? data : f))
  }

  // WhatsApp Standings Text Export
  const handleWhatsAppShare = () => {
    const seasonTitle = activeTournament?.name || 'eFootball League'
    let text = `🏆 *${seasonTitle.toUpperCase()} STANDINGS* 🏆\n`
    text += `📊 Win = 3pts | Draw = 1pt | 24h Forfeit = 0pts\n`
    text += `━━━━━━━━━━━━━━━━━━━━━\n`
    text += `Pos | Team | P | W | D | L | GD | PTS\n`
    text += `━━━━━━━━━━━━━━━━━━━━━\n`

    standings.forEach((s, idx) => {
      const playerName = s.name || s.player?.name || 'Player'
      const p = s.p ?? s.played ?? 0
      const w = s.w ?? s.won ?? 0
      const d = s.d ?? s.drawn ?? 0
      const l = s.l ?? s.lost ?? 0
      const gd = s.gd ?? s.goalDifference ?? 0
      const pts = s.pts ?? s.points ?? 0
      const gdSign = gd > 0 ? `+${gd}` : gd
      text += `${idx + 1}. *${playerName}* | ${p}P | ${w}W | ${d}D | ${l}L | ${gdSign} | *${pts}pts*\n`
    })

    text += `━━━━━━━━━━━━━━━━━━━━━\n`
    text += `Generated via eFootball League Platform`

    navigator.clipboard.writeText(text).then(() => {
      toast.success('📋 Standings copied to clipboard! Ready to paste into your WhatsApp group.')
    }).catch(() => {
      toast.info('Could not copy automatically. Standings ready.')
    })
  }

  // Playoff Handlers
  const handleInitializePlayoffs = (format = 'NORMAL_KNOCKOUT', force = false) => {
    if (!activeTournament) return
    try {
      const data = initializePlayoffs({
        tournamentId: activeTournament.id,
        standings,
        format,
        force
      })
      setPlayoffsData(data)
      toast.success(force ? 'Playoffs re-seeded from current standings!' : 'Playoffs initialized! Match 1 & 2 are ready.')
    } catch (err) {
      toast.error('Failed to initialize playoffs: ' + err.message)
    }
  }

  const handleSavePlayoffScore = async ({ matchKey, homeScore, awayScore, homePens, awayPens }) => {
    try {
      const updated = recordPlayoffScore({
        playoffsData,
        matchKey,
        homeScore,
        awayScore,
        homePens,
        awayPens
      })
      setPlayoffsData(updated)
      toast.success('Playoff score recorded & bracket updated!')
      if (updated.championId) {
        setIsChampionModalOpen(true)
        // Mark season tournament status as COMPLETED
        if (activeTournament?.id) {
          try {
            await supabase.from('tournaments').update({ status: 'COMPLETED' }).eq('id', activeTournament.id)
            setActiveTournament(prev => prev ? { ...prev, status: 'COMPLETED' } : prev)
            setAllTournaments(prev => prev.map(t => t.id === activeTournament.id ? { ...t, status: 'COMPLETED' } : t))
          } catch (err) {
            console.warn('Could not update tournament status:', err)
          }
        }
      }
    } catch (err) {
      toast.error('Error saving playoff score: ' + err.message)
    }
  }

  const handleLockPlayoffFormat = (formatToLock) => {
    if (!activeTournament) return
    try {
      const locked = lockPlayoffFormat({
        tournamentId: activeTournament.id,
        format: formatToLock,
        standings
      })
      setPlayoffsData(locked)
      toast.success(`Playoff format permanently locked to ${formatToLock === 'DOUBLE_CHANCE' ? 'Double Chance Playoff' : 'Normal Knockout'}!`)
    } catch (err) {
      toast.error('Failed to lock format: ' + err.message)
    }
  }

  const handleResetPlayoffScore = (matchKey) => {
    try {
      const updated = resetPlayoffScore({
        playoffsData,
        matchKey
      })
      setPlayoffsData(updated)
      toast.info('Playoff match reset.')
    } catch (err) {
      toast.error('Error resetting match: ' + err.message)
    }
  }

  const handleSwitchPlayoffFormat = (newFormat) => {
    if (!activeTournament || playoffsData?.isFormatLocked) return
    handleInitializePlayoffs(newFormat, true)
  }

  // Share Public Read-Only League Link (opens landing showcase for 6s then auto-redirects to Fixtures)
  const getShareUrl = () => {
    const origin = window.location.origin
    const orgParam = activeOrg ? `?org=${encodeURIComponent(activeOrg.name)}` : ''
    const seasonParam = activeTournament?.id ? `&season=${encodeURIComponent(activeTournament.id)}` : ''
    const shareParam = `&share=true`
    return `${origin}/fixtures${orgParam}${seasonParam}${shareParam}`
  }

  const handleShareLeagueLink = () => {
    const shareUrl = getShareUrl()

    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(
        '🔗 Read-only league link copied! Anyone opening this link will see your website for 6 seconds and then automatically enter the fixtures.',
        'Share Link Copied'
      )
    }).catch(() => {
      prompt('Copy this read-only link to share with players:', shareUrl)
    })
  }

  // Pending matches count (Spectator sees current active week pending count; Admin sees all pending matches)
  const allTotalRounds = Array.from(new Set(fixtures.map(f => f.round_number))).sort((a, b) => a - b)
  const firstPendingRound = allTotalRounds.find(r => fixtures.some(f => f.round_number === r && f.status === 'PENDING'))
  const currentActiveRound = firstPendingRound !== undefined 
    ? firstPendingRound 
    : (allTotalRounds.length > 0 ? allTotalRounds[allTotalRounds.length - 1] : 1)

  const pendingMatchesCount = isAdmin 
    ? fixtures.filter(f => f.status === 'PENDING').length
    : fixtures.filter(f => f.round_number <= currentActiveRound && f.status === 'PENDING').length

  // Automatic Logout and return to Landing Page
  const handleLogoutAndGoHome = () => {
    setIsAdmin(false)
    setActiveOrg(DEFAULT_DEMO_ORG)
    localStorage.removeItem('efootball_last_login_org_id')
    localStorage.removeItem('efootball_active_season')
    navigateTo('landing')
  }

  // ==========================================
  // RENDER VIEW: 1. MARKETING LANDING PAGE
  // ==========================================
  if (view === 'landing') {
    return (
      <>
        {/* Floating Pro eFootball Welcome & 6-Second Auto-Redirect HUD */}
        {shareWelcome && countdown > 0 && (
          <div className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[100] w-[95%] sm:w-[94%] max-w-lg animate-in fade-in slide-in-from-top-6 duration-300">
            <div className="bg-slate-900/95 dark:bg-[#0c1322]/95 backdrop-blur-xl border-2 border-emerald-500/50 rounded-2xl p-3 sm:p-4 shadow-[0_10px_40px_rgba(16,185,129,0.25)] text-white relative overflow-hidden">
              {/* Top Animated Emerald Pulse */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />

              <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        League Invite
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-white truncate font-heading">
                        {activeOrg?.name || 'Tournament'}
                      </h4>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 truncate">
                      Entering Fixtures in{' '}
                      <span className="font-black text-emerald-400 font-mono text-xs sm:text-sm px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/30">
                        {countdown}s
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    onClick={handleProceedToFixtures}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-[11px] sm:text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>View Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCancelAutoRedirect}
                    title="Stay on website"
                    className="p-1 sm:p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Smooth 6-Second Depletion Progress Bar */}
              <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-sm"
                  style={{ width: `${(countdown / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading Transition Screen when entering league from landing */}
        {isRedirecting && (
          <div className="fixed inset-0 z-[200] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                  <Trophy className="w-8 h-8 text-emerald-400" />
                </div>
                <RefreshCw className="w-24 h-24 text-emerald-500/40 animate-spin absolute -inset-4" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-heading">
                  Entering {activeOrg?.name || 'Tournament'}...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Loading live Berger round-robin fixtures & match schedule
                </p>
              </div>
            </div>
          </div>
        )}

        <LandingPage
          onOpenCreateOrg={() => setIsCreateOrgOpen(true)}
          onOpenLoginOrg={() => setIsLoginOrgOpen(true)}
          onOpenDemo={() => {
            if (shareWelcome) {
              handleProceedToFixtures()
            } else {
              setActiveOrg(DEFAULT_DEMO_ORG)
              setIsAdmin(false)
              navigateTo('league', 'standings')
            }
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Modals for Landing Page */}
        <CreateOrgModal
          isOpen={isCreateOrgOpen}
          onClose={() => setIsCreateOrgOpen(false)}
          onCreateOrg={handleCreateOrganization}
        />

        <LoginOrgModal
          isOpen={isLoginOrgOpen}
          onClose={() => setIsLoginOrgOpen(false)}
          organizations={organizations}
          onLogin={handleLoginOrganization}
          onGuestAccess={handleGuestAccess}
        />
      </>
    )
  }

  // ==========================================
  // RENDER VIEW: 2. LEAGUE DASHBOARD
  // ==========================================
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0d14] text-slate-100' : 'bg-[#f4f6f8] text-slate-900'} flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors`}>
      
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        organization={activeOrg}
        onExitToHome={handleLogoutAndGoHome}
        tournament={activeTournament}
        seasons={activeOrgSeasons}
        onSwitchSeason={handleSwitchSeason}
        onOpenNewSeason={() => setIsNewSeasonOpen(true)}
        isAdmin={isAdmin}
        onToggleAdmin={() => {
          if (isAdmin) {
            setIsAdmin(false)
          } else {
            setIsAdminPinOpen(true)
          }
        }}
        onShareLeague={handleShareLeagueLink}
        pendingCount={pendingMatchesCount}
        isPlayoffLive={Boolean(playoffsData && playoffsData.status === 'IN_PROGRESS')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => activeTournament && loadLeagueData(activeTournament.id)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400 font-medium">Syncing league data with cloud...</p>
          </div>
        ) : (
          <>
            {/* Champion Winner Banner across EVERY page in the season */}
            <SeasonChampionBanner
              playoffsData={playoffsData}
              playersMap={playersMap}
              seasonName={activeTournament?.name || 'Season 1'}
              onOpenChampionModal={() => setIsChampionModalOpen(true)}
              onViewPlayoffs={() => navigateToTab('playoffs')}
            />

            {/* Active Tab View */}
            {activeTab === 'standings' && (
              <StandingsTable
                standings={standings}
                fixtures={fixtures}
                playersMap={playersMap}
                seasonName={activeTournament?.name || 'Season 1'}
                onWhatsAppShare={handleWhatsAppShare}
                onShareLink={handleShareLeagueLink}
                onOpenPoster={() => setIsStandingsGraphicOpen(true)}
                onRefresh={() => loadLeagueData(activeTournament?.id)}
              />
            )}

            {activeTab === 'fixtures' && (
              <FixturesList
                fixtures={fixtures}
                playersMap={playersMap}
                isAdmin={isAdmin}
                onSelectFixture={handleOpenScoreModal}
                onOpenGraphic={(fix) => setActiveGraphicFixture(fix)}
                onOpenWeekGraphic={(data) => setActiveWeekGraphicData(data)}
                onGenerateFixtures={handleGenerateFixtures}
                onNavigateToSetup={() => navigateToTab('setup')}
              />
            )}

            {activeTab === 'playoffs' && (
              <PlayoffsView
                playoffsData={playoffsData}
                standings={standings}
                fixtures={fixtures}
                playersMap={playersMap}
                isAdmin={isAdmin}
                onOpenScoreModal={(match) => setActivePlayoffScoreMatch(match)}
                onInitializePlayoffs={handleInitializePlayoffs}
                onOpenChampionModal={() => setIsChampionModalOpen(true)}
                onSwitchFormat={handleSwitchPlayoffFormat}
                onLockFormat={handleLockPlayoffFormat}
                onOpenGraphic={(playoffFix) => setActiveGraphicFixture(playoffFix)}
              />
            )}

            {activeTab === 'stats' && (
              <StatsSection
                standings={standings}
                fixtures={fixtures}
                playersMap={playersMap}
                activeTournament={activeTournament}
                allOrgTournaments={activeOrgSeasons}
                activeOrg={activeOrg}
                playoffsData={playoffsData}
              />
            )}

            {activeTab === 'rules' && (
              <RulesSection />
            )}

            {activeTab === 'setup' && (
              <LeagueSetup
                tournament={activeTournament}
                players={players}
                fixturesCount={fixtures.length}
                isAdmin={isAdmin}
                onUpdateTournament={handleUpdateTournament}
                onAddPlayer={handleAddPlayer}
                onRemovePlayer={handleRemovePlayer}
                onClearAllPlayers={handleClearAllPlayers}
                onLoadPreset={handleLoadPreset}
                onGenerateFixtures={handleGenerateFixtures}
              />
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#161d2d] py-5 text-center text-xs text-slate-500">
        <p>eFootball Community Platform • Multi-Tenant League System • Powered by React & Supabase</p>
      </footer>

      {/* Modals */}
      <MatchScoreModal
        isOpen={Boolean(activeScoreFixture)}
        onClose={handleCloseScoreModal}
        fixture={activeScoreFixture}
        playersMap={playersMap}
        isAdmin={isAdmin}
        onSaveScore={handleSaveScore}
        onMarkForfeit={handleMarkForfeit}
        onResetMatch={handleResetMatch}
        onOpenGraphic={(fix) => setActiveGraphicFixture(fix)}
      />

      <MatchGraphicModal
        isOpen={Boolean(activeGraphicFixture)}
        onClose={() => setActiveGraphicFixture(null)}
        fixture={activeGraphicFixture}
        playersMap={playersMap}
        orgName={activeOrg?.name || 'club 18'}
        seasonName={activeTournament?.name || 'Season 1'}
      />

      <WeekGraphicModal
        isOpen={Boolean(activeWeekGraphicData)}
        onClose={() => setActiveWeekGraphicData(null)}
        weekData={activeWeekGraphicData}
        playersMap={playersMap}
        orgName={activeOrg?.name || 'club 18'}
        seasonName={activeTournament?.name || 'Season 1'}
        shareUrl={getShareUrl()}
      />

      <StandingsGraphicModal
        isOpen={isStandingsGraphicOpen}
        onClose={() => setIsStandingsGraphicOpen(false)}
        standings={standings}
        orgName={activeOrg?.name || 'club 18'}
        seasonName={activeTournament?.name || 'Season 1'}
        shareUrl={getShareUrl()}
      />

      <PlayoffScoreModal
        isOpen={Boolean(activePlayoffScoreMatch)}
        onClose={() => setActivePlayoffScoreMatch(null)}
        match={activePlayoffScoreMatch}
        playersMap={playersMap}
        onSaveScore={handleSavePlayoffScore}
        onResetScore={handleResetPlayoffScore}
        onOpenGraphic={(playoffFix) => setActiveGraphicFixture(playoffFix)}
      />

      <ChampionCelebrationModal
        isOpen={isChampionModalOpen}
        onClose={() => setIsChampionModalOpen(false)}
        playoffsData={playoffsData}
        playersMap={playersMap}
        orgName={activeOrg?.name || 'club 18'}
        seasonName={activeTournament?.name || 'Season 1'}
        shareUrl={getShareUrl()}
      />

      <NewSeasonModal
        isOpen={isNewSeasonOpen}
        onClose={() => setIsNewSeasonOpen(false)}
        currentPlayers={players}
        onCreateSeason={handleCreateSeason}
      />

      <AdminPinModal
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        expectedPin={activeOrg?.pin || activeTournament?.admin_pin || '1234'}
        onSuccess={() => setIsAdmin(true)}
      />

    </div>
  )
}
