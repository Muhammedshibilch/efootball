/**
 * eFootball High-Definition Individual Awards Poster Generator
 * Generates 1080 x 1520px HD posters celebrating tournament individual honors:
 * 🥇 Golden Boot (Top Goalscorer)
 * 🧤 Golden Glove (Most Clean Sheets)
 * 🎯 Most Lethal Attack (Highest Goals / Game)
 * 🏆 Most Consistent (Best Win Rate)
 */

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius)
  } else {
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Calculate the 4 official awards
export function calculateTournamentAwards({ standings = [], fixtures = [], playersMap = {} }) {
  // 1. Safe player extraction
  const playerStatsMap = {}

  standings.forEach(item => {
    const id = item.id || item.player?.id
    if (!id) return
    const name = item.name || item.player?.name || 'Player'
    const color = item.avatar_color || item.player?.avatar_color || '#3b82f6'
    const gamertag = item.gamertag || item.player?.gamertag || ''
    const p = item.p ?? item.played ?? 0
    const w = item.w ?? item.won ?? 0
    const d = item.d ?? item.drawn ?? 0
    const l = item.l ?? item.lost ?? 0
    const gf = item.gf ?? item.goalsFor ?? 0
    const ga = item.ga ?? item.goalsAgainst ?? 0
    const pts = item.pts ?? item.points ?? 0

    playerStatsMap[id] = {
      id,
      name,
      color,
      gamertag,
      p,
      w,
      d,
      l,
      gf,
      ga,
      pts,
      cleanSheets: 0,
      avgGoals: p > 0 ? gf / p : 0,
      winRate: p > 0 ? (w / p) * 100 : 0
    }
  })

  // Scan fixtures for clean sheets
  fixtures.forEach(f => {
    if (f.status === 'COMPLETED' && f.home_score !== null && f.away_score !== null) {
      const hScore = Number(f.home_score)
      const aScore = Number(f.away_score)

      if (aScore === 0 && f.home_player_id && playerStatsMap[f.home_player_id]) {
        playerStatsMap[f.home_player_id].cleanSheets += 1
      }
      if (hScore === 0 && f.away_player_id && playerStatsMap[f.away_player_id]) {
        playerStatsMap[f.away_player_id].cleanSheets += 1
      }
    }
  })

  const players = Object.values(playerStatsMap)

  // 1. Golden Boot (Top Scorer)
  const goldenBoot = [...players]
    .sort((a, b) => b.gf - a.gf || b.pts - a.pts || a.p - b.p)[0] || null

  // 2. Golden Glove (Most Clean Sheets)
  const goldenGlove = [...players]
    .sort((a, b) => b.cleanSheets - a.cleanSheets || a.ga - b.ga || b.pts - a.pts)[0] || null

  // 3. Most Lethal Attack (Highest Goals / Game, min 1 match)
  const mostLethal = [...players]
    .filter(p => p.p > 0)
    .sort((a, b) => b.avgGoals - a.avgGoals || b.gf - a.gf || b.pts - a.pts)[0] || null

  // 4. Most Consistent (Highest Win Rate %, min 1 match)
  const mostConsistent = [...players]
    .filter(p => p.p > 0)
    .sort((a, b) => b.winRate - a.winRate || b.w - a.w || b.pts - a.pts)[0] || null

  return {
    goldenBoot,
    goldenGlove,
    mostLethal,
    mostConsistent,
    totalPlayers: players.length
  }
}

export async function generateAwardsGraphicCanvas({
  standings = [],
  fixtures = [],
  playersMap = {},
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  const width = 1080
  const height = 1520

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const awards = calculateTournamentAwards({ standings, fixtures, playersMap })

  // 1. Base dark background
  ctx.fillStyle = '#060913'
  ctx.fillRect(0, 0, width, height)

  // 2. Optional stadium image underlay
  try {
    const stadiumImg = await loadImage('/images/stadium.jpg')
    if (stadiumImg) {
      ctx.save()
      ctx.globalAlpha = 0.18
      ctx.drawImage(stadiumImg, 0, 0, width, height)
      ctx.restore()
    }
  } catch {}

  // 3. Ambient Atmospheric Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, 'rgba(10, 15, 28, 0.96)')
  bgGrad.addColorStop(0.35, 'rgba(28, 22, 10, 0.94)') // Warm awards gold
  bgGrad.addColorStop(0.7, 'rgba(8, 20, 24, 0.97)') // Teal/emerald ambient
  bgGrad.addColorStop(1, 'rgba(5, 7, 14, 0.99)')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // 4. Radial floodlight top halo
  const topLight = ctx.createRadialGradient(width / 2, 200, 30, width / 2, 200, 550)
  topLight.addColorStop(0, 'rgba(245, 158, 11, 0.38)')
  topLight.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)')
  topLight.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = topLight
  ctx.fillRect(0, 0, width, 600)

  // HEADER SECTION
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Organization Pill
  const orgText = (orgName || 'CLUB 18').trim().toUpperCase()
  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const orgTextWidth = ctx.measureText(orgText).width
  const orgPillW = Math.max(220, orgTextWidth + 60)
  const orgPillH = 46
  const orgPillX = (width - orgPillW) / 2
  const orgPillY = 48

  roundRect(ctx, orgPillX, orgPillY, orgPillW, orgPillH, 23)
  const orgGrad = ctx.createLinearGradient(orgPillX, orgPillY, orgPillX + orgPillW, orgPillY + orgPillH)
  orgGrad.addColorStop(0, '#78350f')
  orgGrad.addColorStop(0.5, '#b45309')
  orgGrad.addColorStop(1, '#78350f')
  ctx.fillStyle = orgGrad
  ctx.fill()
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.fillText(orgText, width / 2, orgPillY + orgPillH / 2)

  // Sub-header Season Tracker
  ctx.font = '700 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#fcd34d'
  ctx.fillText(`${(seasonName || 'SEASON 1').toUpperCase()} • OFFICIAL TOURNAMENT HONORS`, width / 2, 122)

  // MAIN HERO TITLE: "PLAYER AWARDS"
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const titleGrad = ctx.createLinearGradient(0, 145, 0, 195)
  titleGrad.addColorStop(0, '#ffffff')
  titleGrad.addColorStop(0.5, '#fef3c7')
  titleGrad.addColorStop(1, '#f59e0b')
  ctx.fillStyle = titleGrad
  ctx.fillText('LEAGUE AWARDS', width / 2, 175)

  // Ribbon tag
  ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('★ INDIVIDUAL LEADERS & TOURNAMENT MVP HONORS ★', width / 2, 222)
  ctx.restore()

  // 4 AWARDS CARDS (2 x 2 GRID)
  const marginX = 60
  const cardGap = 28
  const cardW = (width - marginX * 2 - cardGap) / 2 // ~466px
  const cardH = 540
  const startY = 265

  const awardsConfigs = [
    {
      title: 'GOLDEN BOOT',
      icon: '🥇',
      subtitle: 'Top Goalscorer',
      badge: 'MOST GOALS',
      themeColor: '#f59e0b',
      themeBg: 'rgba(245, 158, 11, 0.12)',
      borderGrad: ['#f59e0b', '#78350f'],
      player: awards.goldenBoot,
      statMain: `${awards.goldenBoot?.gf ?? 0} GOALS`,
      statSub: `${(awards.goldenBoot?.avgGoals ?? 0).toFixed(1)} goals per match`,
      statDetail: `${awards.goldenBoot?.p ?? 0} matches • ${awards.goldenBoot?.pts ?? 0} pts`
    },
    {
      title: 'GOLDEN GLOVE',
      icon: '🧤',
      subtitle: 'Most Clean Sheets',
      badge: 'DEFENSIVE WALL',
      themeColor: '#10b981',
      themeBg: 'rgba(16, 185, 129, 0.12)',
      borderGrad: ['#10b981', '#064e3b'],
      player: awards.goldenGlove,
      statMain: `${awards.goldenGlove?.cleanSheets ?? 0} CLEAN SHEETS`,
      statSub: `${awards.goldenGlove?.ga ?? 0} goals conceded in ${awards.goldenGlove?.p ?? 0} games`,
      statDetail: `${awards.goldenGlove?.p > 0 ? Math.round((awards.goldenGlove.cleanSheets / awards.goldenGlove.p) * 100) : 0}% shutout rate`
    },
    {
      title: 'LETHAL ATTACK',
      icon: '🎯',
      subtitle: 'Highest Goals / Match',
      badge: 'BEST EFFICIENCY',
      themeColor: '#f43f5e',
      themeBg: 'rgba(244, 63, 94, 0.12)',
      borderGrad: ['#f43f5e', '#881337'],
      player: awards.mostLethal,
      statMain: `${(awards.mostLethal?.avgGoals ?? 0).toFixed(2)} GOALS / GM`,
      statSub: `${awards.mostLethal?.gf ?? 0} goals across ${awards.mostLethal?.p ?? 0} games`,
      statDetail: `+${(awards.mostLethal?.gf ?? 0) - (awards.mostLethal?.ga ?? 0)} Goal Difference`
    },
    {
      title: 'MOST CONSISTENT',
      icon: '🏆',
      subtitle: 'Best Win Ratio',
      badge: 'TOP WIN RATE',
      themeColor: '#06b6d4',
      themeBg: 'rgba(6, 182, 212, 0.12)',
      borderGrad: ['#06b6d4', '#164e63'],
      player: awards.mostConsistent,
      statMain: `${Math.round(awards.mostConsistent?.winRate ?? 0)}% WIN RATE`,
      statSub: `${awards.mostConsistent?.w ?? 0} Wins • ${awards.mostConsistent?.d ?? 0} Draws • ${awards.mostConsistent?.l ?? 0} Losses`,
      statDetail: `${awards.mostConsistent?.pts ?? 0} total league points`
    }
  ]

  // Render each of the 4 award cards
  for (let i = 0; i < 4; i++) {
    const config = awardsConfigs[i]
    const row = Math.floor(i / 2)
    const col = i % 2
    const cx = marginX + col * (cardW + cardGap)
    const cy = startY + row * (cardH + cardGap)

    ctx.save()

    // Card background
    roundRect(ctx, cx, cy, cardW, cardH, 26)
    ctx.fillStyle = '#0c1222'
    ctx.fill()

    // Card subtle inner gradient
    const cardInnerGrad = ctx.createLinearGradient(cx, cy, cx, cy + cardH)
    cardInnerGrad.addColorStop(0, config.themeBg)
    cardInnerGrad.addColorStop(0.4, 'rgba(12, 18, 34, 0.85)')
    cardInnerGrad.addColorStop(1, 'rgba(8, 11, 20, 0.98)')
    ctx.fillStyle = cardInnerGrad
    roundRect(ctx, cx, cy, cardW, cardH, 26)
    ctx.fill()

    // Card border
    ctx.strokeStyle = config.themeColor
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Top Card Header: Icon & Title
    roundRect(ctx, cx + 18, cy + 18, cardW - 36, 68, 16)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = '32px -apple-system, sans-serif'
    ctx.fillText(config.icon, cx + 32, cy + 52)

    ctx.font = '900 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = config.themeColor
    ctx.fillText(config.title, cx + 80, cy + 42)

    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(config.subtitle, cx + 80, cy + 64)

    // Center Hero Avatar
    const p = config.player
    const avatarY = cy + 185
    const avatarR = 54

    // Glow ring
    const avatarGlow = ctx.createRadialGradient(cx + cardW / 2, avatarY, 30, cx + cardW / 2, avatarY, 80)
    avatarGlow.addColorStop(0, config.themeColor)
    avatarGlow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = avatarGlow
    ctx.beginPath()
    ctx.arc(cx + cardW / 2, avatarY, 80, 0, Math.PI * 2)
    ctx.fill()

    // Circle
    ctx.beginPath()
    ctx.arc(cx + cardW / 2, avatarY, avatarR, 0, Math.PI * 2)
    ctx.fillStyle = p?.color || '#3b82f6'
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.stroke()

    // Initials
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = '#0a0d18'
    ctx.fillText((p?.name || 'P').substring(0, 2).toUpperCase(), cx + cardW / 2, avatarY)

    // Player Name & Gamertag
    ctx.font = '900 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = '#ffffff'
    const displayName = (p?.name || 'Player').length > 18 ? (p?.name || 'Player').substring(0, 16) + '...' : (p?.name || 'Player')
    ctx.fillText(displayName, cx + cardW / 2, cy + 275)

    if (p?.gamertag) {
      ctx.font = '600 14px monospace'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(`@${p.gamertag}`, cx + cardW / 2, cy + 302)
    }

    // Main Stat Plaque Box
    const boxW = cardW - 44
    const boxH = 160
    const boxX = cx + 22
    const boxY = cy + 350

    roundRect(ctx, boxX, boxY, boxW, boxH, 18)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Stat Main
    ctx.font = '900 28px monospace'
    ctx.fillStyle = config.themeColor
    ctx.fillText(config.statMain, cx + cardW / 2, boxY + 45)

    // Stat Sub
    ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = '#f8fafc'
    ctx.fillText(config.statSub, cx + cardW / 2, boxY + 85)

    // Stat Detail
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(config.statDetail, cx + cardW / 2, boxY + 120)

    ctx.restore()
  }

  // FOOTER BAR
  const footY = 1400
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  roundRect(ctx, marginX, footY, width - marginX * 2, 75, 20)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.font = '800 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('⚽ OFFICIAL eFOOTBALL TOURNAMENT INDIVIDUAL AWARDS', width / 2, footY + 26)

  ctx.font = '700 14px monospace'
  ctx.fillStyle = '#34d399'
  ctx.fillText(shareUrl || 'Live League Tracker • Updated in Real-Time', width / 2, footY + 52)

  ctx.restore()

  return canvas
}

export function generateAwardsWhatsAppText({
  standings = [],
  fixtures = [],
  playersMap = {},
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  const awards = calculateTournamentAwards({ standings, fixtures, playersMap })
  const cleanOrg = orgName || 'club 18'
  const cleanSeason = seasonName || 'Season 1'

  const lines = [
    `🏆 *${cleanOrg.toUpperCase()} — ${cleanSeason.toUpperCase()}* 🏆`,
    `🌟 *OFFICIAL INDIVIDUAL AWARDS & TOURNAMENT MVP* 🌟`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🥇 *GOLDEN BOOT (Top Goalscorer)*`,
    `👤 *${awards.goldenBoot?.name || 'Leader'}* (@${awards.goldenBoot?.gamertag || 'player'})`,
    `⚽ *${awards.goldenBoot?.gf ?? 0} Goals* in ${awards.goldenBoot?.p ?? 0} matches (${(awards.goldenBoot?.avgGoals ?? 0).toFixed(1)} goals/game)`,
    ``,
    `🧤 *GOLDEN GLOVE (Most Clean Sheets)*`,
    `👤 *${awards.goldenGlove?.name || 'Leader'}* (@${awards.goldenGlove?.gamertag || 'player'})`,
    `🛡️ *${awards.goldenGlove?.cleanSheets ?? 0} Clean Sheets* (${awards.goldenGlove?.ga ?? 0} conceded)`,
    ``,
    `🎯 *MOST LETHAL ATTACK (Best Scoring Average)*`,
    `👤 *${awards.mostLethal?.name || 'Leader'}* (@${awards.mostLethal?.gamertag || 'player'})`,
    `⚡ *${(awards.mostLethal?.avgGoals ?? 0).toFixed(2)} Goals / Match* (${awards.mostLethal?.gf ?? 0} total goals)`,
    ``,
    `💎 *MOST CONSISTENT (Best Win Ratio)*`,
    `👤 *${awards.mostConsistent?.name || 'Leader'}* (@${awards.mostConsistent?.gamertag || 'player'})`,
    `🔥 *${Math.round(awards.mostConsistent?.winRate ?? 0)}% Win Rate* (${awards.mostConsistent?.w ?? 0}W - ${awards.mostConsistent?.d ?? 0}D - ${awards.mostConsistent?.l ?? 0}L)`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 View complete points table & live stats:`,
    shareUrl || 'https://pes-league.netlify.app'
  ]

  return lines.join('\n')
}

export async function downloadAwardsGraphic(params) {
  const canvas = await generateAwardsGraphicCanvas(params)
  const { orgName, seasonName } = params
  const cleanOrg = (orgName || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const cleanSeason = (seasonName || 'season-1').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const fileName = `${cleanOrg}-${cleanSeason}-awards-poster.png`

  const link = document.createElement('a')
  link.download = fileName
  link.href = canvas.toDataURL('image/png', 1.0)
  link.click()
}

export async function copyAwardsGraphicToClipboard(params) {
  const canvas = await generateAwardsGraphicCanvas(params)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
  if (!blob) return false

  if (navigator.clipboard && navigator.clipboard.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      return true
    } catch {
      return false
    }
  }
  return false
}

export async function shareAwardsGraphic(params) {
  const canvas = await generateAwardsGraphicCanvas(params)
  const text = generateAwardsWhatsAppText(params)
  const { orgName, seasonName } = params
  const cleanOrg = orgName || 'eFootball League'
  const title = `${cleanOrg} ${seasonName || 'Season 1'} Awards Poster`

  if (navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
      const file = new File([blob], `${cleanOrg.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-awards.png`, {
        type: 'image/png'
      })

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text
        })
        return { shared: true }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Web share file failed, falling back:', err)
      } else {
        return { shared: false }
      }
    }
  }

  await copyAwardsGraphicToClipboard(params)
  await downloadAwardsGraphic(params)
  return { shared: true, downloaded: true }
}

