/**
 * eFootball High-Definition Match Poster Graphic Generator
 * Generates 1080 x 1350 px (Instagram / WhatsApp Status 4:5 format) match graphics
 * Uses HTML5 Canvas with rich stadium atmosphere, neon glows, and player badges.
 */

function roundRect(ctx, x, y, width, height, radius) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius)
  } else {
    ctx.beginPath()
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

export async function generateMatchGraphicCanvas({
  fixture,
  homePlayer = { name: 'Home Player', gamertag: 'home', avatar_color: '#3b82f6' },
  awayPlayer = { name: 'Away Player', gamertag: 'away', avatar_color: '#10b981' },
  orgName = 'eFootball League',
  seasonName = 'Season 1'
}) {
  const width = 1080
  const height = 1350
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const isCompleted = fixture.status === 'COMPLETED'
  const isForfeit = fixture.status === 'EXPIRED_DISQUALIFIED'
  const isPlayoff = Boolean(fixture.isPlayoff)
  const homeScore = isCompleted ? (fixture.home_score ?? 0) : 0
  const awayScore = isCompleted ? (fixture.away_score ?? 0) : 0
  const hasPens = (fixture.home_pens !== null && fixture.home_pens !== undefined) && (fixture.away_pens !== null && fixture.away_pens !== undefined)

  // 1. Base Dark Stadium Background
  ctx.fillStyle = '#070a12'
  ctx.fillRect(0, 0, width, height)

  // 2. Try loading stadium floodlights image
  try {
    const stadiumImg = await loadImage('/images/stadium.jpg')
    if (stadiumImg) {
      ctx.save()
      ctx.globalAlpha = 0.22
      ctx.drawImage(stadiumImg, 0, 0, width, height)
      ctx.restore()
    }
  } catch {}

  // 3. Cyber Gradient Overlays & Floodlights
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, 'rgba(6, 12, 24, 0.92)')
  bgGrad.addColorStop(0.5, 'rgba(7, 10, 18, 0.95)')
  bgGrad.addColorStop(1, 'rgba(4, 8, 16, 0.98)')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Neon Floodlights from top corners
  const leftLight = ctx.createRadialGradient(150, 0, 50, 200, 200, 600)
  leftLight.addColorStop(0, 'rgba(0, 230, 118, 0.28)')
  leftLight.addColorStop(0.5, 'rgba(0, 230, 118, 0.08)')
  leftLight.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = leftLight
  ctx.fillRect(0, 0, width, 700)

  const rightLight = ctx.createRadialGradient(width - 150, 0, 50, width - 200, 200, 600)
  rightLight.addColorStop(0, 'rgba(56, 189, 248, 0.28)')
  rightLight.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)')
  rightLight.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = rightLight
  ctx.fillRect(0, 0, width, 700)

  // Tactical Pitch Grid Accents
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(width / 2, height / 2 + 30, 240, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(80, height / 2 + 30)
  ctx.lineTo(width - 80, height / 2 + 30)
  ctx.stroke()

  // 4. Outer Glowing Frame
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)'
  ctx.lineWidth = 3
  roundRect(ctx, 40, 40, width - 80, height - 80, 36)
  ctx.stroke()

  // Top Neon Glow Strip
  const topStrip = ctx.createLinearGradient(100, 40, width - 100, 40)
  topStrip.addColorStop(0, '#00e676')
  topStrip.addColorStop(0.5, '#38bdf8')
  topStrip.addColorStop(1, '#00e676')
  ctx.strokeStyle = topStrip
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(140, 40)
  ctx.lineTo(width - 140, 40)
  ctx.stroke()

  // 5. Header: Organization Name & Badge
  // Trophy Badge Box
  ctx.fillStyle = isPlayoff ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.15)'
  ctx.strokeStyle = isPlayoff ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.4)'
  ctx.lineWidth = 2
  roundRect(ctx, width / 2 - 210, 85, 420, 56, 16)
  ctx.fill()
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = isPlayoff ? '#fbbf24' : '#10b981'
  ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('🏆  ' + orgName.toUpperCase(), width / 2, 121)

  // Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif'
  ctx.fillText(isPlayoff ? 'OFFICIAL CHAMPIONSHIP PLAYOFF MATCH' : 'OFFICIAL eFOOTBALL TOURNAMENT MATCH', width / 2, 175)

  // Round / Leg / Season Pill
  let weekLabel = ''
  if (isPlayoff) {
    weekLabel = `${(fixture.playoffStageName || 'PLAYOFF MATCH').toUpperCase()}  |  ${seasonName.toUpperCase()}`
  } else {
    let legLabel = ''
    if (fixture.leg_type === 'LEG_1') legLabel = ' • 1ST LEG'
    if (fixture.leg_type === 'LEG_2') legLabel = ' • 2ND LEG'
    weekLabel = `WEEK ${fixture.round_number}${legLabel}  |  ${seasonName.toUpperCase()}`
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  ctx.strokeStyle = isPlayoff ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.5
  roundRect(ctx, width / 2 - 220, 205, 440, 42, 12)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = isPlayoff ? '#fde047' : '#38bdf8'
  ctx.font = 'bold 15px monospace'
  ctx.fillText(weekLabel, width / 2, 232)

  // 6. Match Status Badge (FULL TIME / 24H FORFEIT / PLAYOFF FINAL)
  const statusBoxY = 285
  if (isForfeit) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.18)'
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)'
    ctx.lineWidth = 2
    roundRect(ctx, width / 2 - 140, statusBoxY, 280, 48, 24)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#f43f5e'
    ctx.font = 'black 20px "Space Grotesk", sans-serif'
    ctx.fillText('⚠️  24H FORFEIT', width / 2, statusBoxY + 31)
  } else if (isPlayoff) {
    const isGrandFinal = fixture.playoffStageName?.toLowerCase().includes('final') && !fixture.playoffStageName?.toLowerCase().includes('semi')
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)'
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)'
    ctx.lineWidth = 2
    roundRect(ctx, width / 2 - 150, statusBoxY, 300, 48, 24)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#fde047'
    ctx.font = 'bold 20px "Space Grotesk", sans-serif'
    ctx.fillText(isGrandFinal ? '👑  CHAMPIONSHIP FINAL' : '⚡  PLAYOFF FULL TIME', width / 2, statusBoxY + 31)
  } else {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)'
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'
    ctx.lineWidth = 2
    roundRect(ctx, width / 2 - 130, statusBoxY, 260, 48, 24)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#00e676'
    ctx.font = 'bold 20px "Space Grotesk", sans-serif'
    ctx.fillText('⚡  FULL TIME', width / 2, statusBoxY + 31)
  }

  // 7. Center Scorecard Arena
  const arenaY = 380
  const arenaH = 590
  const arenaW = width - 160
  const arenaX = 80

  // Glassmorphic arena card
  ctx.fillStyle = 'rgba(13, 20, 36, 0.75)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 2
  roundRect(ctx, arenaX, arenaY, arenaW, arenaH, 32)
  ctx.fill()
  ctx.stroke()

  // Inner Subtle Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.beginPath()
  ctx.moveTo(width / 2, arenaY + 30)
  ctx.lineTo(width / 2, arenaY + arenaH - 30)
  ctx.stroke()

  // Center "VS" Emblem
  ctx.fillStyle = '#0f172a'
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(width / 2, arenaY + arenaH / 2, 42, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = 'black 22px "Space Grotesk", sans-serif'
  ctx.fillText('VS', width / 2, arenaY + arenaH / 2 + 8)

  // 8. HOME PLAYER SIDE (Left)
  const homeCenterX = arenaX + (arenaW / 4)
  const avatarY = arenaY + 120

  // Home Avatar Circle (130px diameter)
  ctx.save()
  ctx.shadowColor = homePlayer.avatar_color || '#3b82f6'
  ctx.shadowBlur = 25
  ctx.fillStyle = homePlayer.avatar_color || '#3b82f6'
  ctx.beginPath()
  ctx.arc(homeCenterX, avatarY, 65, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Border ring
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(homeCenterX, avatarY, 65, 0, Math.PI * 2)
  ctx.stroke()

  // Initials
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 44px "Space Grotesk", sans-serif'
  ctx.fillText((homePlayer.name || 'P1').substring(0, 2).toUpperCase(), homeCenterX, avatarY + 15)

  // Home Player Name
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px "Space Grotesk", sans-serif'
  const cleanHomeName = (homePlayer.name || 'Player 1').length > 14 
    ? (homePlayer.name || 'Player 1').substring(0, 12) + '...'
    : (homePlayer.name || 'Player 1')
  ctx.fillText(cleanHomeName.toUpperCase(), homeCenterX, avatarY + 115)

  // Home Gamertag
  ctx.fillStyle = '#38bdf8'
  ctx.font = '600 20px monospace'
  ctx.fillText('@' + (homePlayer.gamertag || 'gamer'), homeCenterX, avatarY + 148)

  const isGrandFinal = isPlayoff && fixture.playoffStageName?.toLowerCase().includes('final') && !fixture.playoffStageName?.toLowerCase().includes('semi')
  const isHomeWinner = isCompleted && (
    (fixture.winner_id && fixture.winner_id === fixture.home_player_id) ||
    homeScore > awayScore ||
    (homeScore === awayScore && hasPens && Number(fixture.home_pens) > Number(fixture.away_pens))
  )
  const isAwayWinner = isCompleted && (
    (fixture.winner_id && fixture.winner_id === fixture.away_player_id) ||
    awayScore > homeScore ||
    (homeScore === awayScore && hasPens && Number(fixture.away_pens) > Number(fixture.home_pens))
  )

  // Home Score (Huge Glowing Digit)
  ctx.save()
  if (isHomeWinner) {
    ctx.shadowColor = isGrandFinal ? '#f59e0b' : '#00e676'
    ctx.shadowBlur = 35
    ctx.fillStyle = isGrandFinal ? '#fde047' : '#00e676'
  } else {
    ctx.fillStyle = '#ffffff'
  }
  ctx.font = '900 130px "Space Grotesk", monospace'
  ctx.fillText(String(homeScore), homeCenterX, arenaY + 460)
  ctx.restore()

  // Penalties subtext if applicable
  if (hasPens) {
    ctx.fillStyle = '#fde047'
    ctx.font = 'bold 18px monospace'
    ctx.fillText(`(PENS: ${fixture.home_pens})`, homeCenterX, arenaY + 500)
  }

  // Winner Tag if applicable
  if (isHomeWinner) {
    ctx.fillStyle = isGrandFinal ? '#fde047' : '#00e676'
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(isGrandFinal ? '👑 CHAMPION 👑' : isPlayoff ? '★ ADVANCES ★' : '★ WINNER ★', homeCenterX, arenaY + (hasPens ? 530 : 510))
  }

  // 9. AWAY PLAYER SIDE (Right)
  const awayCenterX = arenaX + (arenaW * 3 / 4)

  // Away Avatar Circle (130px diameter)
  ctx.save()
  ctx.shadowColor = awayPlayer.avatar_color || '#10b981'
  ctx.shadowBlur = 25
  ctx.fillStyle = awayPlayer.avatar_color || '#10b981'
  ctx.beginPath()
  ctx.arc(awayCenterX, avatarY, 65, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Border ring
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(awayCenterX, avatarY, 65, 0, Math.PI * 2)
  ctx.stroke()

  // Initials
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 44px "Space Grotesk", sans-serif'
  ctx.fillText((awayPlayer.name || 'P2').substring(0, 2).toUpperCase(), awayCenterX, avatarY + 15)

  // Away Player Name
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px "Space Grotesk", sans-serif'
  const cleanAwayName = (awayPlayer.name || 'Player 2').length > 14 
    ? (awayPlayer.name || 'Player 2').substring(0, 12) + '...'
    : (awayPlayer.name || 'Player 2')
  ctx.fillText(cleanAwayName.toUpperCase(), awayCenterX, avatarY + 115)

  // Away Gamertag
  ctx.fillStyle = '#38bdf8'
  ctx.font = '600 20px monospace'
  ctx.fillText('@' + (awayPlayer.gamertag || 'gamer'), awayCenterX, avatarY + 148)

  // Away Score (Huge Glowing Digit)
  ctx.save()
  if (isAwayWinner) {
    ctx.shadowColor = isGrandFinal ? '#f59e0b' : '#00e676'
    ctx.shadowBlur = 35
    ctx.fillStyle = isGrandFinal ? '#fde047' : '#00e676'
  } else {
    ctx.fillStyle = '#ffffff'
  }
  ctx.font = '900 130px "Space Grotesk", monospace'
  ctx.fillText(String(awayScore), awayCenterX, arenaY + 460)
  ctx.restore()

  // Penalties subtext if applicable
  if (hasPens) {
    ctx.fillStyle = '#fde047'
    ctx.font = 'bold 18px monospace'
    ctx.fillText(`(PENS: ${fixture.away_pens})`, awayCenterX, arenaY + 500)
  }

  // Winner Tag if applicable
  if (isAwayWinner) {
    ctx.fillStyle = isGrandFinal ? '#fde047' : '#00e676'
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif'
    ctx.fillText(isGrandFinal ? '👑 CHAMPION 👑' : isPlayoff ? '★ ADVANCES ★' : '★ WINNER ★', awayCenterX, arenaY + (hasPens ? 530 : 510))
  }

  // Draw or Penalties note in center
  if (isCompleted && homeScore === awayScore) {
    if (hasPens) {
      ctx.fillStyle = '#fde047'
      ctx.font = 'bold 19px "Space Grotesk", sans-serif'
      const penWinnerName = isHomeWinner ? (homePlayer.name || 'Home') : (awayPlayer.name || 'Away')
      ctx.fillText(`PENS: ${fixture.home_pens} - ${fixture.away_pens}  (${penWinnerName.toUpperCase()} WINS)`, width / 2, arenaY + arenaH - 35)
    } else {
      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif'
      ctx.fillText('DRAW (1 PT EACH)', width / 2, arenaY + arenaH - 35)
    }
  }

  // 10. Match Note / Remarks Banner (if any)
  const notesY = arenaY + arenaH + 30
  if (fixture.notes) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    roundRect(ctx, 120, notesY, width - 240, 48, 14)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#cbd5e1'
    ctx.font = 'italic 16px "Plus Jakarta Sans", sans-serif'
    const cleanNote = fixture.notes.length > 55 ? fixture.notes.substring(0, 52) + '...' : fixture.notes
    ctx.fillText('💬  "' + cleanNote + '"', width / 2, notesY + 30)
  }

  // 11. Footer Branding & Security Verification Seal
  const footerY = height - 140

  // Divider Line
  const divGrad = ctx.createLinearGradient(120, footerY, width - 120, footerY)
  divGrad.addColorStop(0, 'transparent')
  divGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.4)')
  divGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = divGrad
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, footerY)
  ctx.lineTo(width - 120, footerY)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = 'extrabold 20px "Space Grotesk", sans-serif'
  ctx.fillText('eFOOTBALL LEAGUE TOURNAMENT PLATFORM', width / 2, footerY + 40)

  ctx.fillStyle = '#64748b'
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif'
  ctx.fillText('Verified Result • Automated Round-Robin Standings • Berger Engine', width / 2, footerY + 68)

  return canvas
}

/**
 * Downloads the generated match graphic directly to user's device
 */
export async function downloadMatchGraphic(params) {
  const canvas = await generateMatchGraphicCanvas(params)
  const { fixture, homePlayer, awayPlayer, orgName } = params

  const link = document.createElement('a')
  const cleanOrg = (orgName || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const cleanHome = (homePlayer?.name || 'home').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const cleanAway = (awayPlayer?.name || 'away').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const stage = fixture?.isPlayoff ? (fixture.playoffStageName || 'playoff').toLowerCase().replace(/[^a-z0-9]+/g, '-') : `week${fixture?.round_number || 1}`
  link.download = `${cleanOrg}-${stage}-${cleanHome}-vs-${cleanAway}.png`
  link.href = canvas.toDataURL('image/png', 1.0)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Triggers native OS share sheet (WhatsApp, Instagram, AirDrop, etc.) or falls back to download
 */
export async function shareMatchGraphic(params) {
  const canvas = await generateMatchGraphicCanvas(params)
  const { fixture, homePlayer, awayPlayer, orgName } = params

  const cleanOrg = orgName || 'eFootball League'
  const isPlayoff = Boolean(fixture?.isPlayoff)
  const stage = isPlayoff ? (fixture.playoffStageName || 'Playoffs') : `Week ${fixture?.round_number}`
  const pens = (fixture?.home_pens !== null && fixture?.home_pens !== undefined && fixture?.away_pens !== null && fixture?.away_pens !== undefined)
    ? ` (Pens: ${fixture.home_pens}-${fixture.away_pens})`
    : ''
  const title = `${cleanOrg} ${stage}: ${homePlayer.name} vs ${awayPlayer.name}`
  const text = isPlayoff
    ? `🏆 ${cleanOrg} Playoffs • ${stage}\n${homePlayer.name} (${fixture?.home_score ?? 0}) - (${fixture?.away_score ?? 0}) ${awayPlayer.name}${pens}\nPlayoff Match Result • Verified on Platform`
    : `Final Result: ${homePlayer.name} (${fixture?.home_score ?? 0}) - (${fixture?.away_score ?? 0}) ${awayPlayer.name} | ${cleanOrg}`

  // Check Web Share API with files
  if (navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
      const file = new File([blob], `match-result-${cleanOrg.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`, { type: 'image/png' })
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
        console.warn('Web share failed, falling back to download:', err)
      } else {
        return { shared: false }
      }
    }
  }

  // Fallback: Download Image
  await downloadMatchGraphic(params)
  return { downloaded: true }
}

