export const AVATAR_COLORS = [
  '#10b981', '#3b82f6', '#06b6d4', '#8b5cf6', 
  '#ec4899', '#f59e0b', '#14b8a6', '#6366f1',
  '#84cc16', '#f97316', '#e11d48', '#0ea5e9',
  '#a855f7', '#eab308'
];

export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Calculates live standings table based on:
 * Win = 3 points
 * Draw = 1 point
 * 24h Forfeit / No-Show = 0 points (Counts towards matches played)
 */
export function calculateStandings(players = [], fixtures = []) {
  const statsMap = {};

  players.forEach(p => {
    statsMap[p.id] = {
      player: p,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      forfeit: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: []
    };
  });

  const sortedFixtures = [...fixtures].sort((a, b) => {
    const timeA = a.completed_at ? new Date(a.completed_at).getTime() : a.round_number;
    const timeB = b.completed_at ? new Date(b.completed_at).getTime() : b.round_number;
    return timeA - timeB;
  });

  sortedFixtures.forEach(fix => {
    const home = statsMap[fix.home_player_id];
    const away = statsMap[fix.away_player_id];
    if (!home || !away) return;

    if (fix.status === 'COMPLETED') {
      const hScore = Number(fix.home_score) || 0;
      const aScore = Number(fix.away_score) || 0;

      home.played += 1;
      away.played += 1;
      home.goalsFor += hScore;
      home.goalsAgainst += aScore;
      away.goalsFor += aScore;
      away.goalsAgainst += hScore;

      if (hScore > aScore) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
        home.form.push('W');
        away.form.push('L');
      } else if (hScore < aScore) {
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
      // 24H Forfeit rule: 0 points each, but +1 played!
      home.played += 1;
      away.played += 1;
      home.forfeit += 1;
      away.forfeit += 1;
      home.form.push('F');
      away.form.push('F');
    }
  });

  const table = Object.values(statsMap).map(row => {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.form = row.form.slice(-5);
    
    // Top-level aliases for robust access across all components
    row.id = row.player?.id || '';
    row.name = row.player?.name || 'Player';
    row.gamertag = row.player?.gamertag || '';
    row.avatar_color = row.player?.avatar_color || '#10b981';
    row.p = row.played;
    row.w = row.won;
    row.d = row.drawn;
    row.l = row.lost;
    row.gf = row.goalsFor;
    row.ga = row.goalsAgainst;
    row.gd = row.goalDifference;
    row.pts = row.points;
    return row;
  });

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.won - a.won;
  });

  return table;
}

/**
 * Check if format is Home & Away (2 matches per pair)
 */
export function isHomeAndAwayFormat(format) {
  if (!format) return true; // Default format is Home & Away
  const clean = String(format).trim().toLowerCase();
  if (clean === 'single_round' || clean === 'single' || clean === 'single_match') {
    return false;
  }
  return clean === 'home_away' || clean === 'home_and_away' || clean.includes('home') || clean.includes('2');
}

/**
 * Berger Round-Robin Fixture Generator
 * Supports Single Match or Home & Away (2 Matches)
 */
export function generateRoundRobinFixtures(playersList = [], tournamentId, format = 'HOME_AWAY', durationHours = 24) {
  if (playersList.length < 2) return [];

  const players = [...playersList];
  if (players.length % 2 !== 0) {
    players.push({ id: 'BYE', name: 'BYE' });
  }

  const numPlayers = players.length;
  const numRoundsSingle = numPlayers - 1;
  const matchesPerRound = numPlayers / 2;
  const durationMs = durationHours * 3600 * 1000;
  const baseTime = Date.now();

  let fixtures = [];
  let currentRoundNumber = 1;

  // Leg 1
  for (let round = 0; round < numRoundsSingle; round++) {
    const roundDeadline = new Date(baseTime + ((round + 1) * durationMs)).toISOString();

    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = (round + match) % (numPlayers - 1);
      let awayIdx = (numPlayers - 1 - match + round) % (numPlayers - 1);
      if (match === 0) awayIdx = numPlayers - 1;

      const homePlayer = players[homeIdx];
      const awayPlayer = players[awayIdx];

      if (homePlayer.id !== 'BYE' && awayPlayer.id !== 'BYE') {
        fixtures.push({
          id: generateUUID(),
          tournament_id: tournamentId,
          round_number: currentRoundNumber,
          leg_type: 'LEG_1',
          home_player_id: homePlayer.id,
          away_player_id: awayPlayer.id,
          home_score: null,
          away_score: null,
          deadline_at: roundDeadline,
          status: 'PENDING',
          completed_at: null,
          notes: ''
        });
      }
    }
    currentRoundNumber++;
  }

  // Leg 2 (Home and Away inverted)
  const isHomeAway = isHomeAndAwayFormat(format);
  if (isHomeAway) {
    const leg1Fixtures = [...fixtures];
    for (let round = 0; round < numRoundsSingle; round++) {
      const roundDeadline = new Date(baseTime + ((round + numRoundsSingle + 1) * durationMs)).toISOString();
      const leg1MatchesInRound = leg1Fixtures.filter(f => f.round_number === (round + 1));

      leg1MatchesInRound.forEach(f => {
        fixtures.push({
          id: generateUUID(),
          tournament_id: tournamentId,
          round_number: currentRoundNumber,
          leg_type: 'LEG_2',
          home_player_id: f.away_player_id,
          away_player_id: f.home_player_id,
          home_score: null,
          away_score: null,
          deadline_at: roundDeadline,
          status: 'PENDING',
          completed_at: null,
          notes: ''
        });
      });
      currentRoundNumber++;
    }
  }

  return fixtures;
}

