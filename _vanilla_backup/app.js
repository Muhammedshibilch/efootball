/**
 * eFootball Neighborhood League Manager
 * Core Application Logic, Dynamic Fixtures, 24-Hour Expiration Engine,
 * Standings Calculator, and Free Supabase Sync.
 */

// --- Default State & Storage Keys ---
const STORAGE_KEY = 'efootball_league_data_v1';
const SUPABASE_CONFIG_KEY = 'efootball_supabase_config_v1';
const ADMIN_AUTH_KEY = 'efootball_admin_unlocked';

// Pre-configured Supabase project credentials
const DEFAULT_SUPABASE_URL = 'https://afqrcrjmbuopzzxecifi.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_05LIKxeW85N6mS1936VVwA_hIlZZPxb';

// Standard UUID Generator compatible with Postgres UUID columns
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Stable default tournament UUID (Season 1)
const DEFAULT_TOURNAMENT_ID = 'e3b0c442-98fc-1c14-9af7-4a8a0e8825c1';

let appState = {
  tournament: {
    id: DEFAULT_TOURNAMENT_ID,
    name: 'eFootball League - Season 1',
    format: 'home_and_away', // 'home_and_away' (2 matches) or 'single' (1 match)
    matchDurationHours: 24,
    adminPin: '1234',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE'
  },
  seasons: [],
  players: [],
  fixtures: []
};

let supabaseClient = null;
let isAdminUnlocked = false;
let currentScoreModalFixtureId = null;
let timerInterval = null;

// Avatar color palette for nice player tags
const AVATAR_COLORS = [
  '#10b981', '#3b82f6', '#06b6d4', '#8b5cf6', 
  '#ec4899', '#f59e0b', '#14b8a6', '#6366f1',
  '#84cc16', '#f97316', '#e11d48', '#0ea5e9',
  '#a855f7', '#eab308'
];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  initSupabaseFromStorage();
  checkAdminSession();

  // Populate config UI
  populateConfigFields();

  // Initial render
  renderAll();
});

// --- Tab Switching ---
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active-tab'));

  const view = document.getElementById(`view-${tabName}`);
  const btn = document.getElementById(`tab-${tabName}`);
  if (view) view.classList.remove('hidden');
  if (btn) btn.classList.add('active-tab');

  if (tabName === 'standings') renderStandingsTable();
  if (tabName === 'fixtures') renderFixtures();
  if (tabName === 'stats') renderPlayerStats();
  if (tabName === 'manage') renderManageView();
}

// --- Dynamic Round-Robin Generator ---
/**
 * Generates round-robin fixtures using the Berger / Polygon rotation algorithm.
 * Supports:
 * - Single match (each plays once)
 * - Home & Away (each plays twice: Leg 1 and Leg 2 reversed)
 * Staggers deadlines by round so each round has its own 24-hour window!
 */
async function generateTournamentFixtures(confirmWithUser = true) {
  if (appState.players.length < 2) {
    showToast('Add at least 2 players to generate fixtures.', 'warning');
    switchTab('manage');
    return;
  }

  if (confirmWithUser && appState.fixtures.length > 0) {
    if (!confirm('Generating new fixtures will reset existing match results in this season. Continue?')) {
      return;
    }
  }

  const players = [...appState.players];
  const isOdd = players.length % 2 !== 0;
  if (isOdd) {
    players.push({ id: 'BYE', name: 'BYE', gamertag: 'BYE' });
  }

  const numPlayers = players.length;
  const numRoundsSingle = numPlayers - 1;
  const matchesPerRound = numPlayers / 2;

  let fixtures = [];
  let currentRoundNumber = 1;
  const durationMs = (appState.tournament.matchDurationHours || 24) * 60 * 60 * 1000;
  const baseTime = Date.now();

  // Generate Leg 1
  for (let round = 0; round < numRoundsSingle; round++) {
    const roundScheduledAt = new Date(baseTime + (round * durationMs)).toISOString();
    const roundDeadlineAt = new Date(baseTime + ((round + 1) * durationMs)).toISOString();

    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = (round + match) % (numPlayers - 1);
      let awayIdx = (numPlayers - 1 - match + round) % (numPlayers - 1);

      if (match === 0) {
        awayIdx = numPlayers - 1;
      }

      const homePlayer = players[homeIdx];
      const awayPlayer = players[awayIdx];

      // Exclude BYE matches
      if (homePlayer.id !== 'BYE' && awayPlayer.id !== 'BYE') {
        fixtures.push({
          id: generateUUID(),
          tournamentId: appState.tournament.id,
          round: currentRoundNumber,
          legType: 'LEG_1',
          homePlayerId: homePlayer.id,
          awayPlayerId: awayPlayer.id,
          homeScore: null,
          awayScore: null,
          scheduledAt: roundScheduledAt,
          deadlineAt: roundDeadlineAt,
          status: 'PENDING',
          completedAt: null,
          notes: ''
        });
      }
    }
    currentRoundNumber++;
  }

  // Generate Leg 2 (Home and Away) if selected
  if (appState.tournament.format === 'home_and_away') {
    const leg1Fixtures = [...fixtures];
    for (let round = 0; round < numRoundsSingle; round++) {
      const roundScheduledAt = new Date(baseTime + ((round + numRoundsSingle) * durationMs)).toISOString();
      const roundDeadlineAt = new Date(baseTime + ((round + numRoundsSingle + 1) * durationMs)).toISOString();

      const leg1MatchesInRound = leg1Fixtures.filter(f => f.round === (round + 1));
      leg1MatchesInRound.forEach(f => {
        fixtures.push({
          id: generateUUID(),
          tournamentId: appState.tournament.id,
          round: currentRoundNumber,
          legType: 'LEG_2',
          homePlayerId: f.awayPlayerId, // Invert Home & Away
          awayPlayerId: f.homePlayerId,
          homeScore: null,
          awayScore: null,
          scheduledAt: roundScheduledAt,
          deadlineAt: roundDeadlineAt,
          status: 'PENDING',
          completedAt: null,
          notes: ''
        });
      });
      currentRoundNumber++;
    }
  }

  appState.fixtures = fixtures;
  saveAppState();

  // Instant Cloud Sync to Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('fixtures').delete().eq('tournament_id', appState.tournament.id);

      const payload = fixtures.map(f => ({
        id: f.id,
        tournament_id: f.tournamentId,
        round_number: f.round,
        leg_type: f.legType,
        home_player_id: f.homePlayerId,
        away_player_id: f.awayPlayerId,
        home_score: f.homeScore,
        away_score: f.awayScore,
        deadline_at: f.deadlineAt,
        status: f.status,
        completed_at: f.completedAt,
        notes: f.notes
      }));

      await supabaseClient.from('fixtures').insert(payload);
    } catch (e) {
      console.error('Error saving fixtures to Supabase:', e);
    }
  }

  renderAll();
  switchTab('fixtures');
  showToast(`⚡ Generated ${fixtures.length} matches across ${currentRoundNumber - 1} rounds!`, 'success');
}

// --- Standings & Points Calculation Engine ---
/**
 * Calculates live standings according to neighborhood rules:
 * - Win = 3 points
 * - Draw = 1 point
 * - Loss = 0 points
 * - Disqualified / Overdue 24h: BOTH get 0 points, but it DOES increment 'Played' (P)!
 */
function calculateStandings() {
  const statsMap = {};

  // Initialize stats for each active player
  appState.players.forEach(p => {
    statsMap[p.id] = {
      player: p,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      disqualified: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [] // Last 5 matches: 'W', 'D', 'L', 'E' (Expired)
    };
  });

  // Sort fixtures by completion time or round for accurate form
  const sortedFixtures = [...appState.fixtures].sort((a, b) => {
    const timeA = a.completedAt ? new Date(a.completedAt).getTime() : a.round;
    const timeB = b.completedAt ? new Date(b.completedAt).getTime() : b.round;
    return timeA - timeB;
  });

  sortedFixtures.forEach(fix => {
    const home = statsMap[fix.homePlayerId];
    const away = statsMap[fix.awayPlayerId];

    if (!home || !away) return;

    if (fix.status === 'COMPLETED') {
      home.played += 1;
      away.played += 1;
      home.goalsFor += fix.homeScore;
      home.goalsAgainst += fix.awayScore;
      away.goalsFor += fix.awayScore;
      away.goalsAgainst += fix.homeScore;

      if (fix.homeScore > fix.awayScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
        home.form.push('W');
        away.form.push('L');
      } else if (fix.homeScore < fix.awayScore) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
        home.form.push('L');
        away.form.push('W');
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
        home.form.push('D');
        away.form.push('D');
      }
    } else if (fix.status === 'EXPIRED_DISQUALIFIED') {
      // RULE: Both players get 0 points, but match counts in 'Played' count!
      home.played += 1;
      away.played += 1;
      home.disqualified += 1;
      away.disqualified += 1;
      home.form.push('E');
      away.form.push('E');
    }
  });

  // Calculate GD and sort table
  const table = Object.values(statsMap).map(row => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    // Keep only last 5 form elements
    row.form = row.form.slice(-5);
    return row;
  });

  // Ranking Criteria: Points > Goal Difference > Goals For > Wins
  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.won - a.won;
  });

  return table;
}

// --- Multi-Season Management ---
function updateSeasonSelectorUI() {
  const selector = document.getElementById('seasonSelector');
  if (!selector) return;

  const seasons = (appState.seasons && appState.seasons.length > 0) ? appState.seasons : (appState.tournament ? [appState.tournament] : []);
  
  let html = '';
  seasons.forEach((s, idx) => {
    if (!s) return;
    const isSelected = appState.tournament && s.id === appState.tournament.id;
    const rawName = s.name || `Season ${idx + 1}`;
    const displayName = rawName.replace(/^eFootball League - /i, '') || `Season ${idx + 1}`;
    html += `<option value="${s.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(displayName)}</option>`;
  });
  html += `<option value="__NEW__">+ New Season</option>`;
  selector.innerHTML = html;
}

async function handleSeasonChange(val) {
  if (val === '__NEW__') {
    openNewSeasonModal();
    updateSeasonSelectorUI();
    return;
  }
  await switchSeason(val);
}

async function switchSeason(tournamentId) {
  if (tournamentId === appState.tournament.id) return;

  if (supabaseClient) {
    try {
      const { data: tData } = await supabaseClient.from('tournaments').select('*').eq('id', tournamentId).single();
      if (tData) {
        appState.tournament = {
          id: tData.id,
          name: tData.name,
          format: tData.format,
          matchDurationHours: tData.match_duration_hours,
          adminPin: tData.admin_pin,
          createdAt: tData.created_at
        };

        const { data: pData } = await supabaseClient.from('players').select('*').eq('tournament_id', tournamentId);
        appState.players = pData ? pData.map(p => ({
          id: p.id,
          name: p.name,
          gamertag: p.gamertag,
          avatarColor: p.avatar_color
        })) : [];

        const { data: fData } = await supabaseClient.from('fixtures').select('*').eq('tournament_id', tournamentId).order('round_number', { ascending: true });
        appState.fixtures = fData ? fData.map(f => ({
          id: f.id,
          round: f.round_number,
          legType: f.leg_type,
          homePlayerId: f.home_player_id,
          awayPlayerId: f.away_player_id,
          homeScore: f.home_score,
          awayScore: f.away_score,
          deadlineAt: f.deadline_at,
          status: f.status,
          completedAt: f.completed_at,
          notes: f.notes
        })) : [];

        saveToLocalStorage();
        renderAll();
        showToast(`Switched to ${appState.tournament.name}!`, 'info');
      }
    } catch (e) {
      console.error('Error switching season:', e);
    }
  }
}

function openNewSeasonModal() {
  const count = (appState.seasons ? appState.seasons.length : 1) + 1;
  const input = document.getElementById('newSeasonTitle');
  if (input) input.value = `Season ${count}`;
  document.getElementById('newSeasonModal').classList.remove('hidden');
}

function closeNewSeasonModal() {
  document.getElementById('newSeasonModal').classList.add('hidden');
}

async function confirmCreateNewSeason() {
  const input = document.getElementById('newSeasonTitle');
  const formatInput = document.getElementById('newSeasonFormat');
  const rosterOption = document.querySelector('input[name="newSeasonRosterOption"]:checked')?.value || 'fresh';

  const seasonName = input.value.trim() || 'Season';
  const format = formatInput.value || 'home_and_away';
  const newTournId = generateUUID();

  const newTournament = {
    id: newTournId,
    name: seasonName.startsWith('Season') ? `eFootball League - ${seasonName}` : seasonName,
    format: format,
    matchDurationHours: appState.tournament.matchDurationHours || 24,
    adminPin: appState.tournament.adminPin || '1234',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE'
  };

  let newPlayers = [];
  if (rosterOption === 'copy' && appState.players.length > 0) {
    newPlayers = appState.players.map(p => ({
      id: generateUUID(),
      name: p.name,
      gamertag: p.gamertag,
      avatarColor: p.avatarColor
    }));
  }

  // Add to seasons list
  if (!appState.seasons) appState.seasons = [];
  if (!appState.seasons.some(s => s.id === appState.tournament.id)) {
    appState.seasons.push(appState.tournament);
  }
  appState.seasons.push(newTournament);

  appState.tournament = newTournament;
  appState.players = newPlayers;
  appState.fixtures = [];

  saveAppState();

  if (supabaseClient) {
    try {
      await supabaseClient.from('tournaments').insert([{
        id: newTournament.id,
        name: newTournament.name,
        format: newTournament.format,
        match_duration_hours: newTournament.matchDurationHours,
        admin_pin: newTournament.adminPin
      }]);

      if (newPlayers.length > 0) {
        const payload = newPlayers.map(p => ({
          id: p.id,
          tournament_id: newTournament.id,
          name: p.name,
          gamertag: p.gamertag,
          avatar_color: p.avatarColor
        }));
        await supabaseClient.from('players').insert(payload);
      }
    } catch (e) {
      console.error('Error saving new season in Supabase:', e);
    }
  }

  closeNewSeasonModal();
  renderAll();
  showToast(`Created ${seasonName}! Previous season history is preserved.`, 'success');
  switchTab('manage');
}

// --- Render Functions ---
function renderAll() {
  renderHeaderInfo();
  renderStandingsTable();
  renderFixtures();
  renderPlayerStats();
  renderManageView();
}

function renderHeaderInfo() {
  const titleEl = document.getElementById('leagueTitleDisplay');
  const subEl = document.getElementById('leagueSubtitleDisplay');
  const formatText = appState.tournament.format === 'home_and_away' ? 'Home & Away (2 Matches)' : 'Single Round';
  
  if (titleEl) titleEl.textContent = 'eFootball League';
  if (subEl) subEl.textContent = `${appState.players.length} Players • ${formatText} • 24h Rule Active`;

  updateSeasonSelectorUI();

  // Count pending matches
  const pendingCount = appState.fixtures.filter(f => f.status === 'PENDING').length;
  const countBadge = document.getElementById('pendingMatchesCount');
  if (countBadge) countBadge.textContent = pendingCount;

  // Deadline banner visibility
  const banner = document.getElementById('deadlinesAlertBanner');
  if (banner) {
    if (pendingCount > 0) banner.classList.remove('hidden');
    else banner.classList.add('hidden');
  }
}

function renderStandingsTable() {
  const tbody = document.getElementById('standingsTableBody');
  if (!tbody) return;

  const standings = calculateStandings();
  tbody.innerHTML = '';

  if (standings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center py-8 text-slate-500 text-xs">
          No players registered yet. Add players in League Setup.
        </td>
      </tr>
    `;
    return;
  }

  standings.forEach((row, index) => {
    const pos = index + 1;
    let posBadge = `<span class="font-bold text-slate-400">${pos}</span>`;

    if (pos === 1) {
      posBadge = `<span class="rank-pill rank-1"><i class="fa-solid fa-crown text-[9px]"></i></span>`;
    } else if (pos === 2) {
      posBadge = `<span class="rank-pill rank-2">2</span>`;
    } else if (pos === 3) {
      posBadge = `<span class="rank-pill rank-3">3</span>`;
    }

    const formPills = row.form.map(f => {
      if (f === 'W') return '<span class="form-badge form-w" title="Won">W</span>';
      if (f === 'D') return '<span class="form-badge form-d" title="Draw">D</span>';
      if (f === 'L') return '<span class="form-badge form-l" title="Lost">L</span>';
      if (f === 'E') return '<span class="form-badge form-e" title="24h Forfeit">F</span>';
      return '';
    }).join(' ');

    const tr = document.createElement('tr');
    tr.className = 'table-row-hover transition duration-150';
    tr.innerHTML = `
      <td class="py-3 px-3 text-center">${posBadge}</td>
      <td class="py-3 px-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-bold text-xs shadow-md" style="background-color: ${row.player.avatarColor || '#10b981'};">
            ${row.player.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div class="font-bold text-white text-sm flex items-center gap-1.5">
              <span>${escapeHtml(row.player.name)}</span>
              ${row.disqualified > 0 ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-800" title="${row.disqualified} forfeit(s)">${row.disqualified} Forfeit</span>` : ''}
            </div>
            ${row.player.gamertag ? `<div class="text-[11px] text-slate-400 font-mono">@${escapeHtml(row.player.gamertag)}</div>` : ''}
          </div>
        </div>
      </td>
      <td class="py-3 px-3 text-center font-semibold text-slate-200">${row.played}</td>
      <td class="py-3 px-3 text-center text-emerald-400 font-medium">${row.won}</td>
      <td class="py-3 px-3 text-center text-amber-400 font-medium">${row.drawn}</td>
      <td class="py-3 px-3 text-center text-rose-400 font-medium">${row.lost}</td>
      <td class="py-3 px-3 text-center text-slate-400 hidden md:table-cell">${row.goalsFor}</td>
      <td class="py-3 px-3 text-center text-slate-400 hidden md:table-cell">${row.goalsAgainst}</td>
      <td class="py-3 px-3 text-center font-semibold ${row.goalDifference > 0 ? 'text-emerald-400' : row.goalDifference < 0 ? 'text-rose-400' : 'text-slate-400'}">
        ${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}
      </td>
      <td class="py-3 px-4 text-center font-black text-emerald-400 text-base">${row.points}</td>
      <td class="py-3 px-3 text-center hidden lg:table-cell">
        <div class="flex items-center justify-center gap-1">
          ${formPills || '<span class="text-slate-600 text-xs">-</span>'}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Progress Summary
  const total = appState.fixtures.length;
  const completed = appState.fixtures.filter(f => f.status !== 'PENDING').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const summaryEl = document.getElementById('leagueProgressSummary');
  if (summaryEl) {
    summaryEl.textContent = `${completed} / ${total} Matches Played (${pct}%)`;
  }
}

function renderFixtures() {
  const container = document.getElementById('fixturesContainer');
  const notice = document.getElementById('noFixturesNotice');
  const roundFilter = document.getElementById('fixtureRoundFilter');
  const statusFilter = document.getElementById('fixtureStatusFilter');
  if (!container) return;

  if (appState.fixtures.length === 0) {
    container.innerHTML = '';
    if (notice) notice.classList.remove('hidden');
    return;
  }
  if (notice) notice.classList.add('hidden');

  // Populate Round Dropdown Filter
  const rounds = [...new Set(appState.fixtures.map(f => f.round))].sort((a, b) => a - b);
  const selectedRound = roundFilter ? roundFilter.value : 'ALL';
  const selectedStatus = statusFilter ? statusFilter.value : 'ALL';

  if (roundFilter && roundFilter.options.length <= 1) {
    rounds.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = `Round ${r}`;
      roundFilter.appendChild(opt);
    });
  }

  // Filter fixtures
  let filtered = appState.fixtures.filter(f => {
    if (selectedRound !== 'ALL' && f.round !== parseInt(selectedRound, 10)) return false;
    if (selectedStatus !== 'ALL' && f.status !== selectedStatus) return false;
    return true;
  });

  container.innerHTML = '';

  filtered.forEach(fix => {
    const home = appState.players.find(p => p.id === fix.homePlayerId) || { name: 'Player 1', avatarColor: '#10b981' };
    const away = appState.players.find(p => p.id === fix.awayPlayerId) || { name: 'Player 2', avatarColor: '#06b6d4' };

    const isPending = fix.status === 'PENDING';
    const isCompleted = fix.status === 'COMPLETED';
    const isExpired = fix.status === 'EXPIRED_DISQUALIFIED';

    let statusBadge = '';
    if (isCompleted) {
      statusBadge = `<span class="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold"><i class="fa-solid fa-check mr-1"></i> Finished</span>`;
    } else if (isExpired) {
      statusBadge = `<span class="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold"><i class="fa-solid fa-ban mr-1"></i> 24h Forfeit</span>`;
    } else {
      statusBadge = `<span class="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">To Play</span>`;
    }

    const card = document.createElement('div');
    card.className = 'match-card flex flex-col justify-between';
    card.innerHTML = `
      <!-- Header / Round & Status -->
      <div class="flex items-center justify-between border-b border-brand-border/60 pb-2.5 mb-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="font-bold text-white uppercase tracking-wider font-heading">Round ${fix.round}</span>
          <span class="text-[10px] text-slate-500">• ${fix.legType === 'LEG_2' ? 'Leg 2 (Away)' : 'Leg 1 (Home)'}</span>
        </div>
        ${statusBadge}
      </div>

      <!-- Match Players Scoreboard -->
      <div class="grid grid-cols-7 items-center gap-2 my-2">
        <!-- Home Player -->
        <div class="col-span-3 flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md" style="background-color: ${home.avatarColor || '#10b981'};">
            ${home.name.substring(0, 2).toUpperCase()}
          </div>
          <div class="truncate">
            <h4 class="font-bold text-sm text-white truncate">${escapeHtml(home.name)}</h4>
            <span class="text-[10px] text-slate-400 font-medium">(Home)</span>
          </div>
        </div>

        <!-- Score or VS -->
        <div class="col-span-1 text-center">
          ${isCompleted ? `
            <div class="font-mono font-black text-lg text-emerald-400 bg-slate-900/90 py-1 px-2.5 rounded-xl border border-slate-800 inline-block shadow-inner">
              ${fix.homeScore} - ${fix.awayScore}
            </div>
          ` : isExpired ? `
            <div class="font-mono font-bold text-xs text-rose-400 bg-rose-950/40 py-1 px-1.5 rounded-lg border border-rose-900/40">
              0 - 0*
            </div>
          ` : `
            <span class="text-xs font-bold text-slate-400 bg-slate-900 py-1 px-2.5 rounded-lg border border-slate-800">VS</span>
          `}
        </div>

        <!-- Away Player -->
        <div class="col-span-3 flex items-center justify-end gap-2.5 text-right">
          <div class="truncate">
            <h4 class="font-bold text-sm text-white truncate">${escapeHtml(away.name)}</h4>
            <span class="text-[10px] text-slate-400 font-medium">(Away)</span>
          </div>
          <div class="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md" style="background-color: ${away.avatarColor || '#06b6d4'};">
            ${away.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="border-t border-brand-border/60 pt-2.5 mt-3 flex items-center justify-between text-xs">
        <span class="text-[11px] text-slate-500 truncate">
          ${fix.notes ? `<i class="fa-solid fa-circle-info mr-1 text-amber-400"></i> ${escapeHtml(fix.notes)}` : '<span class="text-slate-500">24h Match Window</span>'}
        </span>

        <button onclick="openScoreModal('${fix.id}')" class="px-3 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/40 transition flex items-center gap-1.5">
          <i class="fa-solid ${isPending ? 'fa-pen-to-square text-emerald-400' : 'fa-rotate text-cyan-400'}"></i>
          <span>${isPending ? 'Enter Result' : 'Edit Result'}</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

function filterFixtures() {
  renderFixtures();
}

function renderPlayerStats() {
  const standings = calculateStandings();
  const topScorersEl = document.getElementById('topScorersList');
  const bestDefenseEl = document.getElementById('bestDefenseList');
  const punctualityEl = document.getElementById('punctualityList');

  if (!topScorersEl || !bestDefenseEl || !punctualityEl) return;

  // 1. Top Scorers (Goals For)
  const byGoals = [...standings].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 5);
  topScorersEl.innerHTML = byGoals.map((item, i) => `
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-400 w-4">${i + 1}.</span>
        <span class="font-bold text-white">${escapeHtml(item.player.name)}</span>
      </div>
      <span class="font-mono font-bold text-emerald-400">${item.goalsFor} Goals</span>
    </div>
  `).join('') || '<p class="text-xs text-slate-500">No matches scored yet.</p>';

  // 2. Best Defense (Fewest Goals Against among players who played)
  const byDefense = [...standings].filter(s => s.played > 0).sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 5);
  bestDefenseEl.innerHTML = byDefense.map((item, i) => `
    <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
      <div class="flex items-center gap-2">
        <span class="font-bold text-slate-400 w-4">${i + 1}.</span>
        <span class="font-bold text-white">${escapeHtml(item.player.name)}</span>
      </div>
      <span class="font-mono font-bold text-cyan-400">${item.goalsAgainst} Conceded</span>
    </div>
  `).join('') || '<p class="text-xs text-slate-500">No matches completed yet.</p>';

  // 3. Default / Disqualification Log
  const byExpired = [...standings].filter(s => s.disqualified > 0).sort((a, b) => b.disqualified - a.disqualified);
  if (byExpired.length === 0) {
    punctualityEl.innerHTML = `
      <div class="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-center text-xs text-emerald-300">
        <i class="fa-solid fa-circle-check text-lg mb-1 block"></i>
        100% Punctual! No players have exceeded the 24h deadline so far.
      </div>
    `;
  } else {
    punctualityEl.innerHTML = byExpired.map(item => `
      <div class="flex items-center justify-between p-2 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          <span class="font-bold text-white">${escapeHtml(item.player.name)}</span>
        </div>
        <span class="font-mono font-bold text-rose-400">${item.disqualified} Overdue (0 pts)</span>
      </div>
    `).join('');
  }
}

function renderManageView() {
  const container = document.getElementById('playersListContainer');
  const countDisplay = document.getElementById('playersCountDisplay');
  if (!container) return;

  const count = appState.players.length;
  if (countDisplay) countDisplay.textContent = count;
  container.innerHTML = '';

  if (count === 0) {
    container.innerHTML = `
      <div class="col-span-1 sm:col-span-2 text-center py-6 px-4 bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
        <i class="fa-solid fa-users-slash text-2xl text-slate-600 mb-2 block"></i>
        <p class="text-xs font-semibold text-slate-300">No players registered yet</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Use the quick presets above (10, 12, or 14 players) or type names to add friends.</p>
      </div>
    `;
    return;
  }

  appState.players.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition shadow-sm group';
    card.innerHTML = `
      <div class="flex items-center gap-2.5 truncate">
        <span class="text-slate-500 font-mono text-[10px] w-4 text-center">${idx + 1}.</span>
        <div class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md" style="background-color: ${p.avatarColor || '#10b981'};">
          ${p.name.substring(0, 2).toUpperCase()}
        </div>
        <div class="truncate">
          <span class="font-bold text-white text-xs truncate block">${escapeHtml(p.name)}</span>
          ${p.gamertag ? `<span class="text-[10px] text-slate-400 block font-mono">@${escapeHtml(p.gamertag)}</span>` : '<span class="text-[10px] text-slate-600 block">No Gamertag</span>'}
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="openEditPlayerModal('${p.id}')" class="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-slate-800 transition" title="Edit Player">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button onclick="removePlayer('${p.id}')" class="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition" title="Remove Player">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function populateConfigFields() {
  const nameInput = document.getElementById('configLeagueName');
  const formatInput = document.getElementById('configFormat');
  const deadlineInput = document.getElementById('configDeadlineHours');
  const pinInput = document.getElementById('configAdminPin');

  if (nameInput && appState.tournament) nameInput.value = appState.tournament.name || 'eFootball League - Season 1';
  if (formatInput && appState.tournament) formatInput.value = appState.tournament.format || 'home_and_away';
  if (deadlineInput && appState.tournament) deadlineInput.value = appState.tournament.matchDurationHours || 24;
  if (pinInput && appState.tournament) pinInput.value = appState.tournament.adminPin || '1234';
}

async function saveLeagueConfig() {
  const nameInput = document.getElementById('configLeagueName');
  const formatInput = document.getElementById('configFormat');
  const deadlineInput = document.getElementById('configDeadlineHours');
  const pinInput = document.getElementById('configAdminPin');

  if (nameInput) appState.tournament.name = nameInput.value.trim() || 'eFootball League - Season 1';
  if (formatInput) appState.tournament.format = formatInput.value;
  if (deadlineInput) appState.tournament.matchDurationHours = parseInt(deadlineInput.value, 10) || 24;
  if (pinInput) appState.tournament.adminPin = pinInput.value.trim() || '1234';

  saveAppState();

  if (supabaseClient) {
    try {
      await supabaseClient.from('tournaments').upsert([{
        id: appState.tournament.id,
        name: appState.tournament.name,
        format: appState.tournament.format,
        match_duration_hours: appState.tournament.matchDurationHours,
        admin_pin: appState.tournament.adminPin
      }]);
    } catch (e) {
      console.error('Error syncing config to Supabase:', e);
    }
  }

  renderAll();
  showToast('League settings saved and synced to cloud!', 'success');
}

// --- Player Management Functions (Phase 2) ---
async function addPlayer() {
  const nameInput = document.getElementById('newPlayerName');
  const tagInput = document.getElementById('newPlayerTag');
  const name = nameInput.value.trim();
  const tag = tagInput.value.trim();

  if (!name) {
    showToast('Please enter a player name.', 'warning');
    return;
  }

  // Prevent duplicate player names
  const isDuplicate = appState.players.some(p => p.name.toLowerCase() === name.toLowerCase());
  if (isDuplicate) {
    showToast(`A player named "${name}" is already registered.`, 'warning');
    return;
  }

  const color = AVATAR_COLORS[appState.players.length % AVATAR_COLORS.length];
  const newPlayer = {
    id: generateUUID(),
    name: name,
    gamertag: tag || '',
    avatarColor: color
  };

  appState.players.push(newPlayer);
  nameInput.value = '';
  tagInput.value = '';
  nameInput.focus();

  saveAppState();

  // Instant Cloud Sync to Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('players').upsert([{
        id: newPlayer.id,
        tournament_id: appState.tournament.id,
        name: newPlayer.name,
        gamertag: newPlayer.gamertag,
        avatar_color: newPlayer.avatarColor
      }]);
    } catch (err) {
      console.error('Error saving player to Supabase:', err);
    }
  }

  renderAll();
  showToast(`Added ${name} to roster (${appState.players.length} total).`, 'success');
}

async function removePlayer(id) {
  const player = appState.players.find(p => p.id === id);
  const playerName = player ? player.name : 'player';

  if (!confirm(`Are you sure you want to remove ${playerName}?`)) {
    return;
  }

  appState.players = appState.players.filter(p => p.id !== id);
  // Also remove associated fixtures if any
  appState.fixtures = appState.fixtures.filter(f => f.homePlayerId !== id && f.awayPlayerId !== id);

  saveAppState();

  if (supabaseClient) {
    try {
      await supabaseClient.from('players').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting player from Supabase:', err);
    }
  }

  renderAll();
  showToast(`Removed ${playerName} from roster.`, 'info');
}

// Edit Player Modal Handlers
let editingPlayerId = null;
let selectedEditColor = null;

function openEditPlayerModal(id) {
  const player = appState.players.find(p => p.id === id);
  if (!player) return;

  editingPlayerId = id;
  selectedEditColor = player.avatarColor || '#10b981';

  document.getElementById('editPlayerId').value = player.id;
  document.getElementById('editPlayerName').value = player.name;
  document.getElementById('editPlayerTag').value = player.gamertag || '';

  const avatarPreview = document.getElementById('editModalAvatarPreview');
  avatarPreview.textContent = player.name.substring(0, 2).toUpperCase();
  avatarPreview.style.backgroundColor = selectedEditColor;

  // Render color options
  const palette = document.getElementById('editColorPalette');
  palette.innerHTML = AVATAR_COLORS.map(c => `
    <button type="button" onclick="selectEditColor('${c}')" class="w-6 h-6 rounded-full transition transform hover:scale-110 border ${c === selectedEditColor ? 'border-white ring-2 ring-emerald-400' : 'border-transparent'}" style="background-color: ${c};"></button>
  `).join('');

  document.getElementById('editPlayerModal').classList.remove('hidden');
}

function selectEditColor(color) {
  selectedEditColor = color;
  const avatarPreview = document.getElementById('editModalAvatarPreview');
  if (avatarPreview) avatarPreview.style.backgroundColor = color;

  const palette = document.getElementById('editColorPalette');
  if (palette) {
    palette.innerHTML = AVATAR_COLORS.map(c => `
      <button type="button" onclick="selectEditColor('${c}')" class="w-6 h-6 rounded-full transition transform hover:scale-110 border ${c === selectedEditColor ? 'border-white ring-2 ring-emerald-400' : 'border-transparent'}" style="background-color: ${c};"></button>
    `).join('');
  }
}

function closeEditPlayerModal() {
  document.getElementById('editPlayerModal').classList.add('hidden');
  editingPlayerId = null;
}

async function saveEditedPlayer() {
  if (!editingPlayerId) return;

  const name = document.getElementById('editPlayerName').value.trim();
  const tag = document.getElementById('editPlayerTag').value.trim();

  if (!name) {
    showToast('Player name cannot be empty.', 'warning');
    return;
  }

  const player = appState.players.find(p => p.id === editingPlayerId);
  if (!player) return;

  player.name = name;
  player.gamertag = tag;
  player.avatarColor = selectedEditColor;

  saveAppState();

  if (supabaseClient) {
    try {
      await supabaseClient.from('players').upsert([{
        id: player.id,
        tournament_id: appState.tournament.id,
        name: player.name,
        gamertag: player.gamertag,
        avatar_color: player.avatarColor
      }]);
    } catch (e) {
      console.error('Error updating player in Supabase:', e);
    }
  }

  renderAll();
  closeEditPlayerModal();
  showToast(`Updated profile for ${name}!`, 'success');
}

async function clearAllPlayers() {
  if (!confirm('Clear all players from the roster? This will also clear fixtures.')) {
    return;
  }

  const oldTournamentId = appState.tournament.id;
  appState.players = [];
  appState.fixtures = [];

  saveAppState();

  if (supabaseClient) {
    try {
      await supabaseClient.from('players').delete().eq('tournament_id', oldTournamentId);
      await supabaseClient.from('fixtures').delete().eq('tournament_id', oldTournamentId);
    } catch (err) {
      console.error('Error clearing roster from Supabase:', err);
    }
  }

  renderAll();
  showToast('Roster and fixtures cleared.', 'info');
}

async function loadSamplePlayers(count = 10, notify = true) {
  const samples = [
    { name: 'Alex', gamertag: 'Alex_PES' },
    { name: 'Rahul', gamertag: 'Rahul_99' },
    { name: 'David', gamertag: 'DaveStriker' },
    { name: 'Nikhil', gamertag: 'Nik_CR7' },
    { name: 'Marcus', gamertag: 'MarcusMessi' },
    { name: 'Sam', gamertag: 'Sammy_GK' },
    { name: 'Arjun', gamertag: 'Arjun_PES' },
    { name: 'Leo', gamertag: 'LeoKing' },
    { name: 'Kiran', gamertag: 'Kiran_X' },
    { name: 'Vikram', gamertag: 'Vicky_Goal' },
    { name: 'Carlos', gamertag: 'Carlos_10' },
    { name: 'Bilal', gamertag: 'Bilal_Pro' },
    { name: 'Zack', gamertag: 'ZackAttack' },
    { name: 'Toby', gamertag: 'TobyPlay' }
  ];

  const chosen = samples.slice(0, count);
  appState.players = chosen.map((s, idx) => ({
    id: generateUUID(),
    name: s.name,
    gamertag: s.gamertag,
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length]
  }));

  saveAppState();

  if (supabaseClient) {
    try {
      // First ensure tournament exists
      await supabaseClient.from('tournaments').upsert([{
        id: appState.tournament.id,
        name: appState.tournament.name,
        format: appState.tournament.format,
        match_duration_hours: appState.tournament.matchDurationHours,
        admin_pin: appState.tournament.adminPin
      }]);

      // Bulk upsert players
      const payload = appState.players.map(p => ({
        id: p.id,
        tournament_id: appState.tournament.id,
        name: p.name,
        gamertag: p.gamertag,
        avatar_color: p.avatarColor
      }));
      await supabaseClient.from('players').upsert(payload);
    } catch (err) {
      console.error('Error saving sample players to Supabase:', err);
    }
  }

  renderAll();
  if (notify) showToast(`Loaded preset of ${count} neighborhood players to cloud!`, 'success');
}

// --- Score Submission Modal Logic ---
function openScoreModal(fixtureId) {
  const fix = appState.fixtures.find(f => f.id === fixtureId);
  if (!fix) return;

  currentScoreModalFixtureId = fixtureId;
  const home = appState.players.find(p => p.id === fix.homePlayerId) || { name: 'Home', avatarColor: '#10b981' };
  const away = appState.players.find(p => p.id === fix.awayPlayerId) || { name: 'Away', avatarColor: '#06b6d4' };

  document.getElementById('modalRoundBadge').textContent = `Round ${fix.round} • ${fix.legType === 'LEG_2' ? 'Leg 2' : 'Leg 1'}`;
  document.getElementById('modalHomeName').textContent = home.name;
  document.getElementById('modalAwayName').textContent = away.name;
  document.getElementById('modalHomeAvatar').textContent = home.name.substring(0, 2).toUpperCase();
  document.getElementById('modalAwayAvatar').textContent = away.name.substring(0, 2).toUpperCase();
  document.getElementById('modalHomeAvatar').style.backgroundColor = home.avatarColor || '#10b981';
  document.getElementById('modalAwayAvatar').style.backgroundColor = away.avatarColor || '#06b6d4';

  document.getElementById('modalHomeScore').value = fix.homeScore !== null ? fix.homeScore : 0;
  document.getElementById('modalAwayScore').value = fix.awayScore !== null ? fix.awayScore : 0;

  // Show/Hide PIN section if already authenticated as Admin
  const pinSection = document.getElementById('modalPinSection');
  if (pinSection) {
    if (isAdminUnlocked) pinSection.classList.add('hidden');
    else pinSection.classList.remove('hidden');
  }

  document.getElementById('scoreModal').classList.remove('hidden');
}

function closeScoreModal() {
  document.getElementById('scoreModal').classList.add('hidden');
  currentScoreModalFixtureId = null;
}

async function confirmScoreSubmission(targetStatus = 'COMPLETED') {
  const fix = appState.fixtures.find(f => f.id === currentScoreModalFixtureId);
  if (!fix) return;

  if (targetStatus === 'COMPLETED') {
    const homeScore = parseInt(document.getElementById('modalHomeScore').value, 10);
    const awayScore = parseInt(document.getElementById('modalAwayScore').value, 10);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      showToast('Please enter valid match scores.', 'warning');
      return;
    }

    fix.homeScore = homeScore;
    fix.awayScore = awayScore;
    fix.status = 'COMPLETED';
    fix.completedAt = new Date().toISOString();
    fix.notes = 'Result verified';

    if (typeof confetti === 'function') {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }
  } else if (targetStatus === 'EXPIRED_DISQUALIFIED') {
    // 24H Deadline Double Disqualification rule:
    // Both 0 points, but counted in played!
    fix.homeScore = 0;
    fix.awayScore = 0;
    fix.status = 'EXPIRED_DISQUALIFIED';
    fix.completedAt = new Date().toISOString();
    fix.notes = '24h Forfeit / No-Show (0 pts each, +1 played)';
  } else if (targetStatus === 'PENDING') {
    fix.homeScore = null;
    fix.awayScore = null;
    fix.status = 'PENDING';
    fix.completedAt = null;
    fix.notes = '';
  }

  saveAppState();

  // Instant update to Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from('fixtures').upsert([{
        id: fix.id,
        tournament_id: appState.tournament.id,
        round_number: fix.round,
        leg_type: fix.legType,
        home_player_id: fix.homePlayerId,
        away_player_id: fix.awayPlayerId,
        home_score: fix.homeScore,
        away_score: fix.awayScore,
        deadline_at: fix.deadlineAt,
        status: fix.status,
        completed_at: fix.completedAt,
        notes: fix.notes
      }]);
    } catch (e) {
      console.error('Error saving score to Supabase:', e);
    }
  }

  renderAll();
  closeScoreModal();
  showToast('Match record updated!', 'success');
}

  saveAppState();
  renderAll();
  closeScoreModal();
  showToast('Match record updated successfully!', 'success');
}

// --- Admin Authentication ---
function toggleAdminModal() {
  const modal = document.getElementById('adminModal');
  if (isAdminUnlocked) {
    isAdminUnlocked = false;
    updateAdminUI();
    showToast('Admin locked.', 'info');
    return;
  }
  modal.classList.toggle('hidden');
  const input = document.getElementById('adminPinPrompt');
  if (input) {
    input.value = '';
    input.focus();
  }
}

function verifyAdminPin() {
  const input = document.getElementById('adminPinPrompt');
  const pin = input.value.trim();

  if (pin === appState.tournament.adminPin) {
    isAdminUnlocked = true;
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    updateAdminUI();
    document.getElementById('adminModal').classList.add('hidden');
    showToast('Admin unlocked! You can now manage fixtures and scores.', 'success');
  } else {
    showToast('Incorrect Admin PIN. Default is 1234.', 'error');
  }
}

function checkAdminSession() {
  if (sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') {
    isAdminUnlocked = true;
    updateAdminUI();
  }
}

function updateAdminUI() {
  const btnText = document.getElementById('adminBtnText');
  const lockIcon = document.getElementById('adminLockIcon');
  if (btnText && lockIcon) {
    if (isAdminUnlocked) {
      btnText.textContent = 'Admin Unlocked';
      lockIcon.className = 'fa-solid fa-lock-open text-emerald-400';
    } else {
      btnText.textContent = 'Admin Unlock';
      lockIcon.className = 'fa-solid fa-lock text-slate-400';
    }
  }
}

// --- Free Cloud Sync (Supabase) Integration ---
function initSupabaseFromStorage() {
  try {
    let url = DEFAULT_SUPABASE_URL;
    let key = DEFAULT_SUPABASE_KEY;

    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      if (config.url) url = config.url;
      if (config.key) key = config.key;
    }

    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');
    if (urlInput) urlInput.value = url;
    if (keyInput) keyInput.value = key;

    if (url && key && window.supabase) {
      supabaseClient = window.supabase.createClient(url, key);
      updateCloudSyncBadge(true, 'Supabase Connected');
      fetchFromSupabase();

      // Subscribe to Realtime cloud updates
      try {
        supabaseClient.channel('public:all_changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            fetchFromSupabase();
          })
          .subscribe();
      } catch (subErr) {
        console.warn('Realtime subscription non-critical warning:', subErr);
      }
    }
  } catch (err) {
    console.error('Supabase init error:', err);
  }
}

function connectSupabase() {
  const url = document.getElementById('supabaseUrlInput').value.trim();
  const key = document.getElementById('supabaseKeyInput').value.trim();

  if (!url || !key) {
    showToast('Please provide both Supabase URL and Anon Key.', 'warning');
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(url, key);
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
    updateCloudSyncBadge(true, 'Supabase Connected');
    syncToSupabase();
    showToast('Successfully connected to Supabase!', 'success');
  } catch (err) {
    showToast('Could not connect to Supabase: ' + err.message, 'error');
  }
}

function disconnectSupabase() {
  supabaseClient = null;
  localStorage.removeItem(SUPABASE_CONFIG_KEY);
  updateCloudSyncBadge(false, 'Local Storage');
  showToast('Switched back to Local Storage mode.', 'info');
}

function updateCloudSyncBadge(connected, text) {
  const dot = document.getElementById('syncDot');
  const label = document.getElementById('syncText');
  if (dot && label) {
    if (connected) {
      dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      label.textContent = text;
    } else {
      dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      label.textContent = text;
    }
  }
}

async function syncToSupabase() {
  if (!supabaseClient) return;
  try {
    // Upsert tournament
    await supabaseClient.from('tournaments').upsert([{
      id: appState.tournament.id,
      name: appState.tournament.name,
      format: appState.tournament.format,
      match_duration_hours: appState.tournament.matchDurationHours,
      admin_pin: appState.tournament.adminPin
    }]);

    // Upsert players
    for (const p of appState.players) {
      await supabaseClient.from('players').upsert([{
        id: p.id,
        tournament_id: appState.tournament.id,
        name: p.name,
        gamertag: p.gamertag,
        avatar_color: p.avatarColor
      }]);
    }

    // Upsert fixtures
    for (const f of appState.fixtures) {
      await supabaseClient.from('fixtures').upsert([{
        id: f.id,
        tournament_id: appState.tournament.id,
        round_number: f.round,
        leg_type: f.legType,
        home_player_id: f.homePlayerId,
        away_player_id: f.awayPlayerId,
        home_score: f.homeScore,
        away_score: f.awayScore,
        deadline_at: f.deadlineAt,
        status: f.status,
        completed_at: f.completedAt,
        notes: f.notes
      }]);
    }
  } catch (err) {
    console.error('Cloud sync error:', err);
  }
}

async function fetchFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data: tournaments } = await supabaseClient.from('tournaments').select('*').order('created_at', { ascending: true });
    if (tournaments && tournaments.length > 0) {
      appState.seasons = tournaments.map(t => ({
        id: t.id,
        name: t.name,
        format: t.format,
        matchDurationHours: t.match_duration_hours,
        adminPin: t.admin_pin,
        createdAt: t.created_at
      }));

      // Pick currently selected tournament or fallback to the latest one
      let currentTourn = tournaments.find(t => t.id === appState.tournament.id) || tournaments[tournaments.length - 1];

      appState.tournament = {
        id: currentTourn.id,
        name: currentTourn.name,
        format: currentTourn.format,
        matchDurationHours: currentTourn.match_duration_hours,
        adminPin: currentTourn.admin_pin,
        createdAt: currentTourn.created_at
      };

      const { data: players } = await supabaseClient.from('players').select('*').eq('tournament_id', currentTourn.id);
      appState.players = players ? players.map(p => ({
        id: p.id,
        name: p.name,
        gamertag: p.gamertag,
        avatarColor: p.avatar_color
      })) : [];

      const { data: fixtures } = await supabaseClient.from('fixtures').select('*').eq('tournament_id', currentTourn.id).order('round_number', { ascending: true });
      appState.fixtures = fixtures ? fixtures.map(f => ({
        id: f.id,
        round: f.round_number,
        legType: f.leg_type,
        homePlayerId: f.home_player_id,
        awayPlayerId: f.away_player_id,
        homeScore: f.home_score,
        awayScore: f.away_score,
        deadlineAt: f.deadline_at,
        status: f.status,
        completedAt: f.completed_at,
        notes: f.notes
      })) : [];

      saveToLocalStorage();
      renderAll();
    } else {
      // First time initialization in Supabase: sync initial tournament & players
      await syncToSupabase();
    }
  } catch (err) {
    console.error('Supabase fetch error:', err);
  }
}

// --- Local Storage Management ---
function saveAppState() {
  saveToLocalStorage();
  if (supabaseClient) {
    syncToSupabase();
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (parsed.tournament) appState.tournament = parsed.tournament;
        if (Array.isArray(parsed.players)) appState.players = parsed.players;
        if (Array.isArray(parsed.fixtures)) appState.fixtures = parsed.fixtures;
        if (Array.isArray(parsed.seasons)) appState.seasons = parsed.seasons;
      }
    }
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }

  // Safety fallbacks so nothing ever crashes
  if (!appState.tournament) {
    appState.tournament = {
      id: DEFAULT_TOURNAMENT_ID,
      name: 'eFootball League - Season 1',
      format: 'home_and_away',
      matchDurationHours: 24,
      adminPin: '1234',
      createdAt: new Date().toISOString(),
      status: 'ACTIVE'
    };
  }
  if (!appState.tournament.name) {
    appState.tournament.name = 'eFootball League - Season 1';
  }
  if (!Array.isArray(appState.seasons) || appState.seasons.length === 0) {
    appState.seasons = [appState.tournament];
  }
  if (!Array.isArray(appState.players)) appState.players = [];
  if (!Array.isArray(appState.fixtures)) appState.fixtures = [];
}

// --- Backup & Share (WhatsApp / JSON) ---
function exportLeagueDataJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `efootball_league_backup_${Date.now()}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
  showToast('Tournament backup downloaded!', 'success');
}

function importLeagueDataJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.tournament && parsed.players && parsed.fixtures) {
        appState = parsed;
        saveAppState();
        renderAll();
        showToast('Tournament backup restored successfully!', 'success');
      } else {
        showToast('Invalid tournament file format.', 'error');
      }
    } catch (err) {
      showToast('Error parsing JSON backup file.', 'error');
    }
  };
  reader.readAsText(file);
}

function exportStandingsImage() {
  const table = calculateStandings();
  let text = `⚽ *${appState.tournament.name} Standings*\n`;
  text += `──────────────────────\n`;
  table.forEach((row, idx) => {
    text += `${idx + 1}. *${row.player.name}* — P:${row.played} W:${row.won} D:${row.drawn} L:${row.lost} GD:${row.goalDifference > 0 ? '+' : ''}${row.goalDifference} *PTS:${row.points}*\n`;
  });
  text += `──────────────────────\n`;
  text += `Rule: 24h overdue matches = 0 points (counted as played).\n`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Standings copied to clipboard! Paste it into your WhatsApp group.', 'success');
    }).catch(() => {
      showToast('Could not copy automatically.', 'warning');
    });
  }
}

// --- Utilities & Toast Notifications ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200' :
             type === 'error' ? 'bg-rose-950 border-rose-500/40 text-rose-200' :
             type === 'warning' ? 'bg-amber-950 border-amber-500/40 text-amber-200' :
             'bg-slate-900 border-slate-700 text-slate-200';

  const icon = type === 'success' ? 'fa-circle-check text-emerald-400' :
               type === 'error' ? 'fa-circle-xmark text-rose-400' :
               type === 'warning' ? 'fa-triangle-exclamation text-amber-400' :
               'fa-circle-info text-blue-400';

  toast.className = `p-3 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs font-medium max-w-sm transition-all transform duration-300 pointer-events-auto ${bg}`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

