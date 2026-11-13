/**
 * eFootball Tournament Playoffs & Finals Engine
 * Supports:
 * 1. Double Chance Playoff (Top 2 Advantage):
 *    - Qualifier 1: Rank 1 vs Rank 2 (Winner to Final, Loser to Q2)
 *    - Eliminator: Rank 3 vs Rank 4 (Winner to Q2, Loser 4th)
 *    - Qualifier 2: Loser Q1 vs Winner Eliminator (Winner to Final, Loser 3rd)
 *    - Grand Final: Winner Q1 vs Winner Q2 (Winner is Champion)
 *
 * 2. Normal Knockout:
 *    - Semi-Final 1 (1st vs 4th) & Semi-Final 2 (2nd vs 3rd)
 *    - 3rd Place Match & Grand Final
 */

const STORAGE_PREFIX = 'efootball_playoffs_'

export const isDoubleChanceFormat = (format) => {
  return format === 'DOUBLE_CHANCE' || format === 'IPL_PAGE' || format === 'PAGE_PLAYOFF'
}

export function getPlayoffStorageKey(tournamentId) {
  return `${STORAGE_PREFIX}${tournamentId || 'default'}`
}

export function loadPlayoffsData(tournamentId) {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getPlayoffStorageKey(tournamentId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.warn('Failed to load playoffs from storage:', err)
    return null
  }
}

export function savePlayoffsData(tournamentId, data) {
  if (typeof window === 'undefined' || !tournamentId) return
  try {
    localStorage.setItem(getPlayoffStorageKey(tournamentId), JSON.stringify(data))
  } catch (err) {
    console.warn('Failed to save playoffs to storage:', err)
  }
}

/**
 * Initialize or seed playoffs from regular league standings
 */
export function initializePlayoffs({
  tournamentId,
  standings = [],
  format = 'DOUBLE_CHANCE', // 'DOUBLE_CHANCE' or 'NORMAL_KNOCKOUT'
  force = false,
  isFormatLocked = false
}) {
  const existing = loadPlayoffsData(tournamentId)
  if (existing && !force) {
    return existing
  }

  // If format was previously locked, retain the locked format!
  const lockedFormat = existing?.isFormatLocked ? existing.format : format
  const isDoubleChance = isDoubleChanceFormat(lockedFormat)
  const normalizedFormat = isDoubleChance ? 'DOUBLE_CHANCE' : 'NORMAL_KNOCKOUT'
  const finalFormatLocked = Boolean(existing?.isFormatLocked || isFormatLocked)

  // Need at least top 4 players
  const top4 = standings.slice(0, 4)
  const p1 = top4[0]?.player || null
  const p2 = top4[1]?.player || null
  const p3 = top4[2]?.player || null
  const p4 = top4[3]?.player || null

  const seeds = [
    { rank: 1, player: p1 },
    { rank: 2, player: p2 },
    { rank: 3, player: p3 },
    { rank: 4, player: p4 }
  ]

  let matches = {}

  if (isDoubleChance) {
    matches = {
      q1: {
        id: 'q1',
        key: 'q1',
        name: 'Qualifier 1',
        roundLabel: 'Playoffs • Match 1',
        description: '1st vs 2nd • Winner to Grand Final, Loser to Qualifier 2',
        homePlayerId: p1?.id || null,
        awayPlayerId: p2?.id || null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: p1 && p2 ? 'PENDING' : 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      },
      eliminator: {
        id: 'eliminator',
        key: 'eliminator',
        name: 'Eliminator',
        roundLabel: 'Playoffs • Match 2',
        description: '3rd vs 4th • Winner to Qualifier 2, Loser Knocked Out',
        homePlayerId: p3?.id || null,
        awayPlayerId: p4?.id || null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: p3 && p4 ? 'PENDING' : 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      },
      q2: {
        id: 'q2',
        key: 'q2',
        name: 'Qualifier 2',
        roundLabel: 'Playoffs • Match 3 (Semi-Final)',
        description: 'Loser of Q1 vs Winner of Eliminator • Winner to Grand Final',
        homePlayerId: null,
        awayPlayerId: null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      },
      final: {
        id: 'final',
        key: 'final',
        name: 'Grand Final',
        roundLabel: 'Championship Final 🏆',
        description: 'Winner of Q1 vs Winner of Q2 • Winner is crowned Champion!',
        homePlayerId: null,
        awayPlayerId: null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      }
    }
  } else {
    // NORMAL KNOCKOUT
    matches = {
      sf1: {
        id: 'sf1',
        key: 'sf1',
        name: 'Semi-Final 1',
        roundLabel: 'Semi-Finals',
        description: '1st vs 4th • Winner to Grand Final, Loser to 3rd Place Match',
        homePlayerId: p1?.id || null,
        awayPlayerId: p4?.id || null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: p1 && p4 ? 'PENDING' : 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      },
      sf2: {
        id: 'sf2',
        key: 'sf2',
        name: 'Semi-Final 2',
        roundLabel: 'Semi-Finals',
        description: '2nd vs 3rd • Winner to Grand Final, Loser to 3rd Place Match',
        homePlayerId: p2?.id || null,
        awayPlayerId: p3?.id || null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: p2 && p3 ? 'PENDING' : 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      },
      third_place: {
        id: 'third_place',
        key: 'third_place',
        name: '3rd Place Playoff',
        roundLabel: 'Bronze Medal Match 🥉',
        description: 'Loser SF1 vs Loser SF2 • Winner takes 3rd Place Podium',
        homePlayerId: null,
        awayPlayerId: null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      },
      final: {
        id: 'final',
        key: 'final',
        name: 'Grand Final',
        roundLabel: 'Championship Final 🏆',
        description: 'Winner SF1 vs Winner SF2 • Winner is crowned Champion!',
        homePlayerId: null,
        awayPlayerId: null,
        homeScore: null,
        awayScore: null,
        homePens: null,
        awayPens: null,
        status: 'LOCKED',
        winnerId: null,
        loserId: null,
        completedAt: null
      }
    }
  }

  const initialData = {
    tournamentId,
    format: normalizedFormat,
    isFormatLocked: finalFormatLocked,
    status: 'IN_PROGRESS',
    seeds,
    matches,
    championId: null,
    runnerUpId: null,
    thirdPlaceId: null,
    fourthPlaceId: null,
    updatedAt: new Date().toISOString()
  }

  savePlayoffsData(tournamentId, initialData)
  return initialData
}

/**
 * Permanently lock in the playoff format for the tournament
 */
export function lockPlayoffFormat({
  tournamentId,
  format = 'NORMAL_KNOCKOUT',
  standings = []
}) {
  const isDoubleChance = isDoubleChanceFormat(format)
  const normalizedFormat = isDoubleChance ? 'DOUBLE_CHANCE' : 'NORMAL_KNOCKOUT'

  const data = initializePlayoffs({
    tournamentId,
    standings,
    format: normalizedFormat,
    force: true,
    isFormatLocked: true
  })

  data.isFormatLocked = true
  savePlayoffsData(tournamentId, data)
  return data
}

/**
 * Record score and advance tournament bracket
 */
export function recordPlayoffScore({
  playoffsData,
  matchKey,
  homeScore,
  awayScore,
  homePens = null,
  awayPens = null
}) {
  if (!playoffsData || !playoffsData.matches || !playoffsData.matches[matchKey]) {
    throw new Error('Invalid match key or playoff data')
  }

  const currentMatch = playoffsData.matches[matchKey]
  const { homePlayerId, awayPlayerId } = currentMatch

  if (!homePlayerId || !awayPlayerId) {
    throw new Error('Match participants not yet determined')
  }

  // Determine winner & loser
  let winnerId = null
  let loserId = null

  if (homeScore > awayScore) {
    winnerId = homePlayerId
    loserId = awayPlayerId
  } else if (awayScore > homeScore) {
    winnerId = awayPlayerId
    loserId = homePlayerId
  } else {
    // Tied score requires penalties in knockout playoffs!
    if (homePens === null || awayPens === null) {
      throw new Error('Knockout match ended in a tie. Please enter penalty shootout scores.')
    }
    if (homePens === awayPens) {
      throw new Error('Penalty shootout cannot be a draw in knockout playoffs.')
    }
    if (homePens > awayPens) {
      winnerId = homePlayerId
      loserId = awayPlayerId
    } else {
      winnerId = awayPlayerId
      loserId = homePlayerId
    }
  }

  // Clone state
  const updated = JSON.parse(JSON.stringify(playoffsData))
  updated.isFormatLocked = true
  const match = updated.matches[matchKey]
  match.homeScore = homeScore
  match.awayScore = awayScore
  match.homePens = homePens
  match.awayPens = awayPens
  match.winnerId = winnerId
  match.loserId = loserId
  match.status = 'COMPLETED'
  match.completedAt = new Date().toISOString()

  // Propagate according to format
  if (isDoubleChanceFormat(updated.format)) {
    const q1 = updated.matches.q1
    const elim = updated.matches.eliminator
    const q2 = updated.matches.q2
    const final = updated.matches.final

    // Q1 Winner goes directly to Grand Final (home side)
    if (q1.status === 'COMPLETED') {
      final.homePlayerId = q1.winnerId
      q2.homePlayerId = q1.loserId // Q1 loser gets second chance in Q2!
    }

    // Eliminator Winner goes to Q2 (away side)
    if (elim.status === 'COMPLETED') {
      q2.awayPlayerId = elim.winnerId
      updated.fourthPlaceId = elim.loserId // Eliminator loser finishes 4th
    }

    // Unlock Q2 if both Q1 and Eliminator are done
    if (q1.status === 'COMPLETED' && elim.status === 'COMPLETED') {
      if (q2.status !== 'COMPLETED') {
        q2.status = 'PENDING'
      }
    }

    // Q2 Winner goes to Grand Final (away side)
    if (q2.status === 'COMPLETED') {
      final.awayPlayerId = q2.winnerId
      updated.thirdPlaceId = q2.loserId // Q2 loser finishes 3rd
    }

    // Unlock Grand Final if Q1 and Q2 are done
    if (q1.status === 'COMPLETED' && q2.status === 'COMPLETED') {
      if (final.status !== 'COMPLETED') {
        final.status = 'PENDING'
      }
    }

    // Final finishes -> Champion & Runner-up crowned!
    if (final.status === 'COMPLETED') {
      updated.championId = final.winnerId
      updated.runnerUpId = final.loserId
      updated.status = 'COMPLETED'
    }

  } else {
    // STANDARD KNOCKOUT
    const sf1 = updated.matches.sf1
    const sf2 = updated.matches.sf2
    const third = updated.matches.third_place
    const final = updated.matches.final

    if (sf1.status === 'COMPLETED') {
      final.homePlayerId = sf1.winnerId
      third.homePlayerId = sf1.loserId
    }

    if (sf2.status === 'COMPLETED') {
      final.awayPlayerId = sf2.winnerId
      third.awayPlayerId = sf2.loserId
    }

    if (sf1.status === 'COMPLETED' && sf2.status === 'COMPLETED') {
      if (third.status !== 'COMPLETED') third.status = 'PENDING'
      if (final.status !== 'COMPLETED') final.status = 'PENDING'
    }

    if (third.status === 'COMPLETED') {
      updated.thirdPlaceId = third.winnerId
      updated.fourthPlaceId = third.loserId
    }

    if (final.status === 'COMPLETED') {
      updated.championId = final.winnerId
      updated.runnerUpId = final.loserId
      updated.status = 'COMPLETED'
    }
  }

  updated.updatedAt = new Date().toISOString()
  savePlayoffsData(updated.tournamentId, updated)
  return updated
}

/**
 * Reset a match score and reset downstream dependencies
 */
export function resetPlayoffScore({ playoffsData, matchKey }) {
  if (!playoffsData || !playoffsData.matches[matchKey]) return playoffsData

  const updated = JSON.parse(JSON.stringify(playoffsData))
  const match = updated.matches[matchKey]
  match.homeScore = null
  match.awayScore = null
  match.homePens = null
  match.awayPens = null
  match.winnerId = null
  match.loserId = null
  match.status = 'PENDING'
  match.completedAt = null

  if (isDoubleChanceFormat(updated.format)) {
    if (matchKey === 'q1' || matchKey === 'eliminator') {
      updated.matches.q2.status = 'LOCKED'
      updated.matches.q2.homeScore = null
      updated.matches.q2.awayScore = null
      updated.matches.q2.winnerId = null
      updated.matches.q2.loserId = null
      if (matchKey === 'q1') {
        updated.matches.q2.homePlayerId = null
        updated.matches.final.homePlayerId = null
      }
      if (matchKey === 'eliminator') {
        updated.matches.q2.awayPlayerId = null
        updated.fourthPlaceId = null
      }
      updated.matches.final.status = 'LOCKED'
      updated.matches.final.homeScore = null
      updated.matches.final.awayScore = null
      updated.matches.final.winnerId = null
      updated.matches.final.loserId = null
      updated.championId = null
      updated.runnerUpId = null
      updated.thirdPlaceId = null
      updated.status = 'IN_PROGRESS'
    } else if (matchKey === 'q2') {
      updated.matches.final.status = 'LOCKED'
      updated.matches.final.awayPlayerId = null
      updated.matches.final.homeScore = null
      updated.matches.final.awayScore = null
      updated.matches.final.winnerId = null
      updated.matches.final.loserId = null
      updated.championId = null
      updated.runnerUpId = null
      updated.thirdPlaceId = null
      updated.status = 'IN_PROGRESS'
    } else if (matchKey === 'final') {
      updated.championId = null
      updated.runnerUpId = null
      updated.status = 'IN_PROGRESS'
    }
  } else {
    // STANDARD KNOCKOUT
    if (matchKey === 'sf1' || matchKey === 'sf2') {
      if (matchKey === 'sf1') {
        updated.matches.final.homePlayerId = null
        updated.matches.third_place.homePlayerId = null
      }
      if (matchKey === 'sf2') {
        updated.matches.final.awayPlayerId = null
        updated.matches.third_place.awayPlayerId = null
      }
      updated.matches.final.status = 'LOCKED'
      updated.matches.third_place.status = 'LOCKED'
      updated.championId = null
      updated.runnerUpId = null
      updated.thirdPlaceId = null
      updated.fourthPlaceId = null
      updated.status = 'IN_PROGRESS'
    } else if (matchKey === 'final') {
      updated.championId = null
      updated.runnerUpId = null
      updated.status = 'IN_PROGRESS'
    } else if (matchKey === 'third_place') {
      updated.thirdPlaceId = null
      updated.fourthPlaceId = null
    }
  }

  updated.updatedAt = new Date().toISOString()
  savePlayoffsData(updated.tournamentId, updated)
  return updated
}

/**
 * Convert a playoff match object to a normalized fixture object compatible with MatchGraphicModal
 */
export function playoffMatchToFixture(match, seasonName = 'Season 1') {
  if (!match) return null
  return {
    id: `playoff-${match.key || match.id}`,
    matchKey: match.key || match.id,
    home_player_id: match.homePlayerId,
    away_player_id: match.awayPlayerId,
    home_score: match.homeScore,
    away_score: match.awayScore,
    home_pens: match.homePens ?? null,
    away_pens: match.awayPens ?? null,
    winner_id: match.winnerId,
    loser_id: match.loserId,
    status: match.status || 'COMPLETED',
    isPlayoff: true,
    playoffStageName: match.name || 'Championship Playoff',
    playoffDescription: match.description || '',
    round_number: 'Playoffs',
    notes: (match.homePens !== null && match.homePens !== undefined && match.awayPens !== null && match.awayPens !== undefined)
      ? `Penalty Shootout: ${match.homePens} - ${match.awayPens}`
      : (match.description || 'Championship Knockout Match')
  }
}

