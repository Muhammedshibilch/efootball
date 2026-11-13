/**
 * eFootball High-Definition League Standings Poster Generator
 * Generates 1080 x (1350-1650)px HD posters showing the full points table,
 * champion/podium badges, player avatars, goals, goal difference, points, and viral website link.
 *
 * Designed to be shared as a SINGLE clean image directly to WhatsApp, Instagram, or saved as PNG.
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

/**
 * Generate full league standings canvas poster
 */
export async function generateStandingsGraphicCanvas({
  standings = [],
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  const width = 1080
  const rowCount = Math.max(1, standings.length)
  const rowHeight = rowCount <= 8 ? 76 : rowCount <= 12 ? 66 : 56
  const rowGap = rowCount <= 8 ? 8 : 6
  const tableStartY = 330
  const tableHeaderHeight = 48
  const totalTableHeight = tableHeaderHeight + (rowCount * rowHeight) + ((rowCount - 1) * rowGap)
  const footerHeight = 220
  const height = Math.max(1350, tableStartY + totalTableHeight + footerHeight + 50)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // 1. Dark Stadium Background
  ctx.fillStyle = '#060a13'
  ctx.fillRect(0, 0, width, height)

  // 2. Try loading stadium floodlights background
  try {
    const stadiumImg = await loadImage('/images/stadium.jpg')
    if (stadiumImg) {
      ctx.save()
      ctx.globalAlpha = 0.18
      ctx.drawImage(stadiumImg, 0, 0, width, height)
      ctx.restore()
    }
  } catch {}

  // 3. Cyber Gradient Overlays & Floodlights
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, 'rgba(6, 12, 24, 0.94)')
  bgGrad.addColorStop(0.5, 'rgba(8, 12, 20, 0.97)')
  bgGrad.addColorStop(1, 'rgba(4, 7, 14, 0.99)')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Top Floodlights
  const leftLight = ctx.createRadialGradient(160, 0, 50, 200, 200, 650)
  leftLight.addColorStop(0, 'rgba(0, 230, 118, 0.32)')
  leftLight.addColorStop(0.6, 'rgba(0, 230, 118, 0.08)')
  leftLight.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = leftLight
  ctx.fillRect(0, 0, width, 700)

  const rightLight = ctx.createRadialGradient(width - 160, 0, 50, width - 200, 200, 650)
  rightLight.addColorStop(0, 'rgba(245, 158, 11, 0.32)') // Amber gold right floodlight
  rightLight.addColorStop(0.6, 'rgba(245, 158, 11, 0.08)')
  rightLight.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = rightLight
  ctx.fillRect(0, 0, width, 700)

  // Tactical Pitch Center Circle (Watermark)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(width / 2, height / 2, 280, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.fill()

  // 4. HEADER SECTION
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Top Organization Pill (High-Contrast Emerald Cyber Badge)
  const orgText = (orgName || 'CLUB 18').trim().toUpperCase()
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  const orgTextWidth = ctx.measureText(orgText).width
  const orgPillW = Math.max(240, orgTextWidth + 80)
  const orgPillH = 54
  const orgPillX = (width - orgPillW) / 2
  const orgPillY = 46

  // Gradient fill for sleek emerald cyber badge
  const orgGrad = ctx.createLinearGradient(orgPillX, orgPillY, orgPillX + orgPillW, orgPillY + orgPillH)
  orgGrad.addColorStop(0, '#064e3b')
  orgGrad.addColorStop(0.5, '#047857')
  orgGrad.addColorStop(1, '#064e3b')
  ctx.fillStyle = orgGrad
  roundRect(ctx, orgPillX, orgPillY, orgPillW, orgPillH, 27)
  ctx.fill()

  // Crisp vibrant neon emerald border
  ctx.strokeStyle = '#00e676'
  ctx.lineWidth = 3
  roundRect(ctx, orgPillX, orgPillY, orgPillW, orgPillH, 27)
  ctx.stroke()

  // Inner text: 100% PURE WHITE with subtle glowing edge
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#00e676'
  ctx.shadowBlur = 8
  ctx.fillText(orgText, width / 2, orgPillY + (orgPillH / 2))
  ctx.shadowBlur = 0

  // Season Subtitle
  const seasonY = orgPillY + orgPillH + 28
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText(`${(seasonName || 'SEASON 1').trim().toUpperCase()} • OFFICIAL LEAGUE TABLE`, width / 2, seasonY)
  ctx.letterSpacing = '0px'

  // Big Glowing Standings Title
  const titleY = seasonY + 54
  ctx.font = '900 62px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.6)'
  ctx.shadowBlur = 20
  ctx.fillText('LEAGUE STANDINGS', width / 2, titleY)
  ctx.shadowBlur = 0

  // Bottom Pill: Total Players & Matches Played (Gold/Amber Cyber Badge)
  const totalPlayed = Math.round(standings.reduce((acc, row) => acc + (row.played || 0), 0) / 2)
  const pillText = `ROUND-ROBIN  •  ${standings.length} TEAMS  •  ${totalPlayed} MATCHES PLAYED`
  ctx.font = '900 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  const pillTextWidth = ctx.measureText(pillText).width
  const subPillW = Math.max(260, pillTextWidth + 60)
  const subPillH = 42
  const subPillX = (width - subPillW) / 2
  const subPillY = titleY + 46

  const subGrad = ctx.createLinearGradient(subPillX, subPillY, subPillX + subPillW, subPillY + subPillH)
  subGrad.addColorStop(0, '#78350f') // Deep amber
  subGrad.addColorStop(0.5, '#b45309') // Vibrant gold
  subGrad.addColorStop(1, '#78350f')
  ctx.fillStyle = subGrad
  roundRect(ctx, subPillX, subPillY, subPillW, subPillH, 21)
  ctx.fill()

  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2.5
  roundRect(ctx, subPillX, subPillY, subPillW, subPillH, 21)
  ctx.stroke()

  ctx.font = '900 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#f59e0b'
  ctx.shadowBlur = 8
  ctx.fillText(pillText, width / 2, subPillY + (subPillH / 2))
  ctx.shadowBlur = 0
  ctx.restore()

  // 5. POINTS TABLE CONTAINER
  const tableX = 50
  const tableW = width - (tableX * 2) // 980px
  const tableY = tableStartY

  // Column Positions (Center X for stats, Left X for player)
  const colPos = tableX + 36      // # Pos
  const colPlayer = tableX + 80   // Player Name & Avatar
  const colP = tableX + 470       // P
  const colW = tableX + 540       // W
  const colD = tableX + 610       // D
  const colL = tableX + 680       // L
  const colGD = tableX + 760      // GD
  const colPTS = tableX + 850     // PTS
  const colForm = tableX + 930    // Form

  // Table Header Row
  ctx.save()
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
  roundRect(ctx, tableX, tableY, tableW, tableHeaderHeight, 14)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.5
  roundRect(ctx, tableX, tableY, tableW, tableHeaderHeight, 14)
  ctx.stroke()

  ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.letterSpacing = '1px'
  ctx.textBaseline = 'middle'

  // Header Titles
  ctx.textAlign = 'center'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('#', colPos, tableY + tableHeaderHeight / 2)

  ctx.textAlign = 'left'
  ctx.fillText('PLAYER', colPlayer + 44, tableY + tableHeaderHeight / 2)

  ctx.textAlign = 'center'
  ctx.fillText('P', colP, tableY + tableHeaderHeight / 2)

  ctx.fillStyle = '#10b981'
  ctx.fillText('W', colW, tableY + tableHeaderHeight / 2)

  ctx.fillStyle = '#f59e0b'
  ctx.fillText('D', colD, tableY + tableHeaderHeight / 2)

  ctx.fillStyle = '#f43f5e'
  ctx.fillText('L', colL, tableY + tableHeaderHeight / 2)

  ctx.fillStyle = '#94a3b8'
  ctx.fillText('GD', colGD, tableY + tableHeaderHeight / 2)

  ctx.fillStyle = '#00e676'
  ctx.font = '900 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('PTS', colPTS, tableY + tableHeaderHeight / 2)

  ctx.fillStyle = '#94a3b8'
  ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('FORM', colForm, tableY + tableHeaderHeight / 2)
  ctx.letterSpacing = '0px'
  ctx.restore()

  // 6. PLAYER ROWS
  const rowsStartY = tableY + tableHeaderHeight + 10

  standings.forEach((row, idx) => {
    const rowY = rowsStartY + idx * (rowHeight + rowGap)
    const pos = idx + 1
    const p = row.player || { name: 'Player', gamertag: 'gamer', avatar_color: '#3b82f6' }
    const isChampion = pos === 1
    const isPodium = pos === 2 || pos === 3

    ctx.save()

    // Row Background
    if (isChampion) {
      // 1st Place Champion Golden Sheen
      const champGrad = ctx.createLinearGradient(tableX, rowY, tableX + tableW, rowY)
      champGrad.addColorStop(0, 'rgba(120, 53, 15, 0.45)')
      champGrad.addColorStop(0.5, 'rgba(18, 25, 43, 0.95)')
      champGrad.addColorStop(1, 'rgba(120, 53, 15, 0.35)')
      ctx.fillStyle = champGrad
      roundRect(ctx, tableX, rowY, tableW, rowHeight, 14)
      ctx.fill()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      roundRect(ctx, tableX, rowY, tableW, rowHeight, 14)
      ctx.stroke()
    } else if (isPodium) {
      // 2nd & 3rd Place Podium
      const podGrad = ctx.createLinearGradient(tableX, rowY, tableX + tableW, rowY)
      podGrad.addColorStop(0, 'rgba(12, 74, 110, 0.35)')
      podGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.92)')
      podGrad.addColorStop(1, 'rgba(12, 74, 110, 0.25)')
      ctx.fillStyle = podGrad
      roundRect(ctx, tableX, rowY, tableW, rowHeight, 14)
      ctx.fill()
      ctx.strokeStyle = pos === 2 ? 'rgba(148, 163, 184, 0.6)' : 'rgba(217, 119, 6, 0.6)'
      ctx.lineWidth = 1.5
      roundRect(ctx, tableX, rowY, tableW, rowHeight, 14)
      ctx.stroke()
    } else {
      // Regular Rows
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(15, 23, 42, 0.88)' : 'rgba(13, 19, 36, 0.88)'
      roundRect(ctx, tableX, rowY, tableW, rowHeight, 14)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
      ctx.lineWidth = 1
      roundRect(ctx, tableX, rowY, tableW, rowHeight, 14)
      ctx.stroke()
    }

    ctx.textBaseline = 'middle'

    // POS BADGE (#)
    const centerY = rowY + (rowHeight / 2)
    const posPillR = rowHeight <= 60 ? 14 : 16

    if (isChampion) {
      ctx.fillStyle = '#f59e0b'
      ctx.beginPath()
      ctx.arc(colPos, centerY, posPillR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.font = `900 ${rowHeight <= 60 ? '13px' : '15px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('1', colPos, centerY)
    } else if (pos === 2) {
      ctx.fillStyle = '#94a3b8'
      ctx.beginPath()
      ctx.arc(colPos, centerY, posPillR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.font = `900 ${rowHeight <= 60 ? '13px' : '15px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('2', colPos, centerY)
    } else if (pos === 3) {
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.arc(colPos, centerY, posPillR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = `900 ${rowHeight <= 60 ? '13px' : '15px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('3', colPos, centerY)
    } else {
      ctx.fillStyle = '#64748b'
      ctx.font = `800 ${rowHeight <= 60 ? '13px' : '14px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(`${pos}`, colPos, centerY)
    }

    // PLAYER AVATAR
    const avatarR = rowHeight <= 60 ? 18 : 22
    const avatarX = colPlayer + 16
    ctx.beginPath()
    ctx.arc(avatarX, centerY, avatarR, 0, Math.PI * 2)
    ctx.fillStyle = p.avatar_color || p.avatarColor || '#3b82f6'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Avatar Initials
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 ${avatarR <= 18 ? '11px' : '13px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillText((p.name || 'P').substring(0, 2).toUpperCase(), avatarX, centerY)

    // Player Name & Gamertag
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 ${rowHeight <= 60 ? '16px' : '18px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    const displayName = (p.name || 'Player').length > 15 ? (p.name || 'Player').substring(0, 14) + '…' : (p.name || 'Player')
    
    if (rowHeight <= 60) {
      // Single line layout
      ctx.fillText(displayName, avatarX + avatarR + 12, centerY)
    } else {
      // Two-line layout with gamertag
      ctx.fillText(displayName, avatarX + avatarR + 14, centerY - 8)
      ctx.fillStyle = '#94a3b8'
      ctx.font = '600 12px "Montserrat", monospace'
      ctx.fillText(`@${p.gamertag || 'gamer'}`, avatarX + avatarR + 14, centerY + 12)
    }

    // STATS COLUMNS
    ctx.textAlign = 'center'
    ctx.font = `800 ${rowHeight <= 60 ? '14px' : '16px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

    // P (Played)
    ctx.fillStyle = '#cbd5e1'
    ctx.fillText(`${row.played || 0}`, colP, centerY)

    // W (Won)
    ctx.fillStyle = '#10b981'
    ctx.fillText(`${row.won || 0}`, colW, centerY)

    // D (Drawn)
    ctx.fillStyle = '#f59e0b'
    ctx.fillText(`${row.drawn || 0}`, colD, centerY)

    // L (Lost)
    ctx.fillStyle = '#f43f5e'
    ctx.fillText(`${row.lost || 0}`, colL, centerY)

    // GD (Goal Diff)
    const gd = row.goalDifference || 0
    ctx.fillStyle = gd > 0 ? '#10b981' : gd < 0 ? '#f43f5e' : '#94a3b8'
    ctx.fillText(gd > 0 ? `+${gd}` : `${gd}`, colGD, centerY)

    // PTS BADGE (Points)
    const pts = row.points || 0
    const ptsBoxW = 48
    const ptsBoxH = rowHeight <= 60 ? 30 : 34
    const ptsBoxX = colPTS - (ptsBoxW / 2)
    const ptsBoxY = centerY - (ptsBoxH / 2)

    if (isChampion) {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)'
      roundRect(ctx, ptsBoxX, ptsBoxY, ptsBoxW, ptsBoxH, 8)
      ctx.fill()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 1.5
      roundRect(ctx, ptsBoxX, ptsBoxY, ptsBoxW, ptsBoxH, 8)
      ctx.stroke()
      ctx.fillStyle = '#fbbf24'
    } else {
      ctx.fillStyle = 'rgba(0, 230, 118, 0.15)'
      roundRect(ctx, ptsBoxX, ptsBoxY, ptsBoxW, ptsBoxH, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.35)'
      ctx.lineWidth = 1
      roundRect(ctx, ptsBoxX, ptsBoxY, ptsBoxW, ptsBoxH, 8)
      ctx.stroke()
      ctx.fillStyle = '#00e676'
    }

    ctx.font = `900 ${rowHeight <= 60 ? '16px' : '18px'} -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
    ctx.fillText(`${pts}`, colPTS, centerY)

    // FORM BADGES (Last 4)
    const formArr = (row.form || []).slice(-4)
    if (formArr.length === 0) {
      ctx.fillStyle = '#475569'
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText('-', colForm, centerY)
    } else {
      const badgeW = 16
      const badgeGap = 3
      const totalFormW = (formArr.length * badgeW) + ((formArr.length - 1) * badgeGap)
      let formStartX = colForm - (totalFormW / 2)

      formArr.forEach((res) => {
        const bX = formStartX
        const bY = centerY - 8
        ctx.fillStyle = res === 'W' ? '#10b981' : res === 'D' ? '#f59e0b' : '#f43f5e'
        roundRect(ctx, bX, bY, badgeW, 16, 4)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.font = '900 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillText(res, bX + badgeW / 2, centerY)
        formStartX += badgeW + badgeGap
      })
    }

    ctx.restore()
  })

  // 7. FOOTER SECTION: VIRAL LIVE LINK CARD
  const footerY = height - 190
  const footerBoxW = tableW
  const footerBoxH = 150

  const footerGrad = ctx.createLinearGradient(tableX, footerY, tableX + footerBoxW, footerY + footerBoxH)
  footerGrad.addColorStop(0, 'rgba(6, 78, 59, 0.6)')
  footerGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.92)')
  footerGrad.addColorStop(1, 'rgba(14, 116, 144, 0.6)')
  ctx.fillStyle = footerGrad
  roundRect(ctx, tableX, footerY, footerBoxW, footerBoxH, 20)
  ctx.fill()

  ctx.strokeStyle = '#00e676'
  ctx.lineWidth = 2
  roundRect(ctx, tableX, footerY, footerBoxW, footerBoxH, 20)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Header Callout
  ctx.fillStyle = '#38bdf8'
  ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  ctx.letterSpacing = '1.5px'
  ctx.fillText('🔗 VIEW LIVE LEAGUE STANDINGS, SCORES & STATS', width / 2, footerY + 38)
  ctx.letterSpacing = '0px'

  // Link URL Pill
  const rawUrl = shareUrl || `${window.location.origin}/standings?org=${encodeURIComponent(orgName || 'club 18')}&share=true`
  const cleanUrl = rawUrl.replace(/&season=[a-f0-9-]+/gi, '')

  const urlBoxY = footerY + 54
  const urlBoxH = 44
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  roundRect(ctx, tableX + 30, urlBoxY, footerBoxW - 60, urlBoxH, 12)
  ctx.fill()

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
  ctx.lineWidth = 1
  roundRect(ctx, tableX + 30, urlBoxY, footerBoxW - 60, urlBoxH, 12)
  ctx.stroke()

  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", monospace'
  let urlWidth = ctx.measureText(cleanUrl).width
  const maxUrlW = footerBoxW - 80
  if (urlWidth > maxUrlW) {
    const scale = maxUrlW / urlWidth
    const newSize = Math.max(14, Math.floor(24 * scale))
    ctx.font = `800 ${newSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", monospace`
  }
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#38bdf8'
  ctx.shadowBlur = 12
  ctx.fillText(cleanUrl, width / 2, urlBoxY + (urlBoxH / 2))
  ctx.shadowBlur = 0

  // Tagline
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Official Standings • Real-Time Cloud Updates • eFootball Tournament Hub', width / 2, footerY + 125)

  return canvas
}

/**
 * Generate formatted WhatsApp caption text for Standings
 */
export function generateStandingsWhatsAppText({
  standings = [],
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  const cleanOrg = orgName || 'eFootball League'
  const cleanSeason = seasonName || 'Season 1'
  const rawUrl = shareUrl || `${window.location.origin}/standings?org=${encodeURIComponent(cleanOrg)}&share=true`
  const cleanUrl = rawUrl.replace(/&season=[a-f0-9-]+/gi, '')

  let text = `🏆 *${cleanOrg.toUpperCase()} — LEAGUE STANDINGS* 🏆\n`
  text += `📅 *${cleanSeason} • Official Points Table*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `*Pos  Player           P   W  D  L   GD   PTS*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━\n`

  standings.forEach((row, idx) => {
    const pos = idx + 1
    const icon = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}.`
    const pName = (row.player?.name || 'Player').padEnd(12, ' ').substring(0, 12)
    const p = `${row.played || 0}`.padStart(2, ' ')
    const w = `${row.won || 0}`.padStart(2, ' ')
    const d = `${row.drawn || 0}`.padStart(2, ' ')
    const l = `${row.lost || 0}`.padStart(2, ' ')
    const gdNum = row.goalDifference || 0
    const gd = (gdNum > 0 ? `+${gdNum}` : `${gdNum}`).padStart(4, ' ')
    const pts = `${row.points || 0}`.padStart(3, ' ')

    text += `${icon} *${pName}* ${p}  ${w} ${d} ${l}  ${gd}  *${pts}pts*\n`
  })

  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `🔥 *View live scores, fixtures & download HD posters:*\n`
  text += `👉 ${cleanUrl}\n`

  return text
}

/**
 * Download Standings Poster as HD PNG
 */
export async function downloadStandingsGraphic(params) {
  const canvas = await generateStandingsGraphicCanvas(params)
  const { orgName, seasonName } = params
  const cleanOrg = (orgName || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const cleanSeason = (seasonName || 'season-1').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const fileName = `${cleanOrg}-${cleanSeason}-standings.png`

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve(true)
    }, 'image/png', 1.0)
  })
}

/**
 * Copy Standings Poster Image to Clipboard (For WhatsApp Web Ctrl+V)
 */
export async function copyStandingsGraphicToClipboard(params) {
  const canvas = await generateStandingsGraphicCanvas(params)
  const text = generateStandingsWhatsAppText(params)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
  const textBlob = new Blob([text], { type: 'text/plain' })

  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
          'text/plain': textBlob
        })
      ])
      return true
    } catch {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        return true
      } catch {
        return false
      }
    }
  }
  return false
}

/**
 * Share Standings Poster with Caption
 * On Mobile (Android / iPhone): WhatsApp natively attaches 'text' as the image caption in 1 single bubble!
 */
export async function shareStandingsGraphic(params) {
  const canvas = await generateStandingsGraphicCanvas(params)
  const text = generateStandingsWhatsAppText(params)
  const { orgName, seasonName } = params
  const cleanOrg = orgName || 'eFootball League'
  const title = `${cleanOrg} ${seasonName || 'Season 1'} League Standings`

  if (navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
      const file = new File([blob], `${cleanOrg.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-standings.png`, {
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

  // Fallback: Copy to clipboard and download
  await copyStandingsGraphicToClipboard(params)
  await downloadStandingsGraphic(params)
  return { shared: true, downloaded: true }
}

