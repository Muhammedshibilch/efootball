/**
 * eFootball High-Definition Week Fixtures Poster Generator
 * Generates 1080 x (1350-1600)px HD posters showing the full week match schedule,
 * custom player avatar badges, live scores/status, and the viral website read-only link.
 *
 * Designed to be shared as a SINGLE clean image containing all match data and the live link
 * without sending separate text messages that clutter WhatsApp chats.
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
 * Generate full week fixtures canvas poster
 */
export async function generateWeekGraphicCanvas({
  weekNumber = 1,
  weekFixtures = [],
  playersMap = {},
  orgName = 'club 18',
  seasonName = 'Season 1',
  legLabel = 'Leg 1',
  shareUrl = ''
}) {
  const width = 1080
  const matchCount = Math.max(1, weekFixtures.length)
  const cardHeight = matchCount <= 5 ? 135 : matchCount <= 7 ? 120 : 105
  const cardGap = matchCount <= 5 ? 16 : 12
  const cardsStartY = 330
  const totalCardsHeight = (matchCount * cardHeight) + ((matchCount - 1) * cardGap)
  const footerHeight = 230
  const height = Math.max(1350, cardsStartY + totalCardsHeight + footerHeight + 40)

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
  rightLight.addColorStop(0, 'rgba(56, 189, 248, 0.32)')
  rightLight.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)')
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

  // Inner text: 100% PURE WHITE with crisp legibility
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
  ctx.fillText(`${(seasonName || 'SEASON 1').trim().toUpperCase()} • OFFICIAL MATCH SCHEDULE`, width / 2, seasonY)
  ctx.letterSpacing = '0px'

  // Big Glowing Week Title
  const weekTitleY = seasonY + 54
  ctx.font = '900 62px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(255, 255, 255, 0.6)'
  ctx.shadowBlur = 20
  ctx.fillText(`WEEK ${weekNumber} FIXTURES`, width / 2, weekTitleY)
  ctx.shadowBlur = 0

  // Bottom Pill: Leg & Match Count (High-Contrast Cyan Cyber Badge)
  const legPillText = legLabel ? `${legLabel.trim().toUpperCase()}  •  ${matchCount} MATCHES` : `${matchCount} MATCHES ROUND-ROBIN`
  ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  const legTextWidth = ctx.measureText(legPillText).width
  const legPillW = Math.max(220, legTextWidth + 60)
  const legPillH = 44
  const legPillX = (width - legPillW) / 2
  const legPillY = weekTitleY + 46

  // Gradient fill for sleek ocean/cyan cyber badge
  const legGrad = ctx.createLinearGradient(legPillX, legPillY, legPillX + legPillW, legPillY + legPillH)
  legGrad.addColorStop(0, '#0c4a6e')
  legGrad.addColorStop(0.5, '#0284c7')
  legGrad.addColorStop(1, '#0c4a6e')
  ctx.fillStyle = legGrad
  roundRect(ctx, legPillX, legPillY, legPillW, legPillH, 22)
  ctx.fill()

  // Crisp vibrant neon cyan border
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 3
  roundRect(ctx, legPillX, legPillY, legPillW, legPillH, 22)
  ctx.stroke()

  // Inner text: 100% PURE WHITE with crisp legibility
  ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#38bdf8'
  ctx.shadowBlur = 8
  ctx.fillText(legPillText, width / 2, legPillY + (legPillH / 2))
  ctx.shadowBlur = 0
  ctx.restore()

  // 5. MATCH CARDS
  const cardX = 60
  const cardWidth = width - (cardX * 2)

  weekFixtures.forEach((fixture, idx) => {
    const cardY = cardsStartY + idx * (cardHeight + cardGap)
    const home = playersMap[fixture.home_player_id] || { name: 'Player 1', gamertag: 'gamer1', avatar_color: '#3b82f6' }
    const away = playersMap[fixture.away_player_id] || { name: 'Player 2', gamertag: 'gamer2', avatar_color: '#10b981' }

    const isCompleted = fixture.status === 'COMPLETED'
    const isForfeit = fixture.status === 'EXPIRED_DISQUALIFIED'
    const isPending = fixture.status === 'PENDING'

    // Card background
    ctx.fillStyle = idx % 2 === 0 ? 'rgba(15, 23, 42, 0.88)' : 'rgba(13, 19, 36, 0.88)'
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 18)
    ctx.fill()

    // Card border
    ctx.strokeStyle = isCompleted
      ? 'rgba(0, 230, 118, 0.28)'
      : isForfeit
      ? 'rgba(244, 63, 94, 0.28)'
      : 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1.5
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 18)
    ctx.stroke()

    // Match Index Badge (#1, #2...)
    ctx.fillStyle = '#64748b'
    ctx.font = '800 13px "Montserrat", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`M${idx + 1}`, cardX + 18, cardY + 28)

    // HOME PLAYER (Left Side)
    const homeAvatarX = cardX + 68
    const avatarY = cardY + cardHeight / 2
    const avatarRadius = cardHeight <= 110 ? 24 : 28

    // Avatar Circle
    ctx.beginPath()
    ctx.arc(homeAvatarX, avatarY, avatarRadius, 0, Math.PI * 2)
    ctx.fillStyle = home.avatar_color || '#3b82f6'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Avatar Initials
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 ${avatarRadius <= 24 ? '13px' : '15px'} "Montserrat", sans-serif`
    ctx.fillText((home.name || 'P1').substring(0, 2).toUpperCase(), homeAvatarX, avatarY + 5)

    // Home Name & Tag
    ctx.textAlign = 'left'
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 ${cardHeight <= 110 ? '19px' : '22px'} "Montserrat", sans-serif`
    const homeName = (home.name || 'Player 1').length > 13 ? (home.name || 'Player 1').substring(0, 12) + '…' : home.name
    ctx.fillText(homeName, homeAvatarX + avatarRadius + 16, avatarY - 3)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '600 13px "Montserrat", monospace'
    ctx.fillText(`@${home.gamertag || 'gamer'}`, homeAvatarX + avatarRadius + 16, avatarY + 18)

    // CENTER PILL (Score or VS)
    const centerX = cardX + cardWidth / 2
    ctx.textAlign = 'center'

    if (isCompleted) {
      // Completed Score Pill
      const scoreText = `${fixture.home_score ?? 0}  -  ${fixture.away_score ?? 0}`
      const pillW = 120
      const pillH = cardHeight <= 110 ? 44 : 50
      ctx.fillStyle = 'rgba(6, 78, 59, 0.45)'
      roundRect(ctx, centerX - pillW / 2, avatarY - pillH / 2, pillW, pillH, 12)
      ctx.fill()
      ctx.strokeStyle = '#00e676'
      ctx.lineWidth = 1.5
      roundRect(ctx, centerX - pillW / 2, avatarY - pillH / 2, pillW, pillH, 12)
      ctx.stroke()

      ctx.font = `900 ${cardHeight <= 110 ? '24px' : '28px'} "Montserrat", monospace`
      ctx.fillStyle = '#00e676'
      ctx.shadowColor = '#00e676'
      ctx.shadowBlur = 10
      ctx.fillText(scoreText, centerX, avatarY + (cardHeight <= 110 ? 8 : 10))
      ctx.shadowBlur = 0

      ctx.font = '800 10px "Montserrat", sans-serif'
      ctx.fillStyle = '#10b981'
      ctx.fillText('FINAL', centerX, avatarY + pillH / 2 + 14)
    } else if (isForfeit) {
      // 24h Forfeit Pill
      const pillW = 110
      const pillH = cardHeight <= 110 ? 38 : 44
      ctx.fillStyle = 'rgba(136, 19, 55, 0.45)'
      roundRect(ctx, centerX - pillW / 2, avatarY - pillH / 2, pillW, pillH, 10)
      ctx.fill()
      ctx.strokeStyle = '#f43f5e'
      ctx.lineWidth = 1.5
      roundRect(ctx, centerX - pillW / 2, avatarY - pillH / 2, pillW, pillH, 10)
      ctx.stroke()

      ctx.font = `900 ${cardHeight <= 110 ? '17px' : '20px'} "Montserrat", monospace`
      ctx.fillStyle = '#fda4af'
      ctx.fillText('0 - 0', centerX, avatarY + 6)

      ctx.font = '800 10px "Montserrat", sans-serif'
      ctx.fillStyle = '#f43f5e'
      ctx.fillText('24H FORFEIT', centerX, avatarY + pillH / 2 + 13)
    } else {
      // Pending VS Pill
      const pillW = 76
      const pillH = cardHeight <= 110 ? 36 : 42
      ctx.fillStyle = 'rgba(30, 41, 59, 0.75)'
      roundRect(ctx, centerX - pillW / 2, avatarY - pillH / 2, pillW, pillH, 10)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.lineWidth = 1
      roundRect(ctx, centerX - pillW / 2, avatarY - pillH / 2, pillW, pillH, 10)
      ctx.stroke()

      ctx.font = `900 ${cardHeight <= 110 ? '16px' : '18px'} "Montserrat", sans-serif`
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText('VS', centerX, avatarY + 6)

      ctx.font = '700 10px "Montserrat", sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText('PENDING', centerX, avatarY + pillH / 2 + 13)
    }

    // AWAY PLAYER (Right Side)
    const awayAvatarX = cardX + cardWidth - 68

    // Avatar Circle
    ctx.beginPath()
    ctx.arc(awayAvatarX, avatarY, avatarRadius, 0, Math.PI * 2)
    ctx.fillStyle = away.avatar_color || '#10b981'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Avatar Initials
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = `900 ${avatarRadius <= 24 ? '13px' : '15px'} "Montserrat", sans-serif`
    ctx.fillText((away.name || 'P2').substring(0, 2).toUpperCase(), awayAvatarX, avatarY + 5)

    // Away Name & Tag
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffffff'
    ctx.font = `800 ${cardHeight <= 110 ? '19px' : '22px'} "Montserrat", sans-serif`
    const awayName = (away.name || 'Player 2').length > 13 ? (away.name || 'Player 2').substring(0, 12) + '…' : away.name
    ctx.fillText(awayName, awayAvatarX - avatarRadius - 16, avatarY - 3)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '600 13px "Montserrat", monospace'
    ctx.fillText(`@${away.gamertag || 'gamer'}`, awayAvatarX - avatarRadius - 16, avatarY + 18)
  })

  // 6. FOOTER VIRAL BOX WITH COMPLETE WEBSITE LINK
  const footerY = height - 200
  const footerBoxW = cardWidth
  const footerBoxH = 150

  // Glowing Viral Container
  const footerGrad = ctx.createLinearGradient(cardX, footerY, cardX + footerBoxW, footerY + footerBoxH)
  footerGrad.addColorStop(0, 'rgba(6, 78, 59, 0.6)')
  footerGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.92)')
  footerGrad.addColorStop(1, 'rgba(14, 116, 144, 0.6)')
  ctx.fillStyle = footerGrad
  roundRect(ctx, cardX, footerY, footerBoxW, footerBoxH, 20)
  ctx.fill()

  ctx.strokeStyle = '#00e676'
  ctx.lineWidth = 2
  roundRect(ctx, cardX, footerY, footerBoxW, footerBoxH, 20)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#38bdf8'
  ctx.font = '800 16px "Montserrat", sans-serif'
  ctx.letterSpacing = '1.5px'
  ctx.fillText('🔗 VIEW LIVE LEAGUE STANDINGS, SCORES & STATS', width / 2, footerY + 38)
  ctx.letterSpacing = '0px'

  // Clean URL Display: remove long messy internal parameters like &season=UUID
  const rawUrl = shareUrl || `${window.location.origin}/fixtures?org=${encodeURIComponent(orgName)}&share=true`
  const cleanDisplayUrl = rawUrl.replace(/&season=[a-f0-9-]+/gi, '')

  // Inner Pill for URL
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  roundRect(ctx, cardX + 30, footerY + 54, footerBoxW - 60, 44, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
  ctx.lineWidth = 1
  roundRect(ctx, cardX + 30, footerY + 54, footerBoxW - 60, 44, 12)
  ctx.stroke()

  // Dynamic font sizing so the link NEVER gets truncated with '...'
  ctx.font = '800 24px "Montserrat", monospace'
  let urlWidth = ctx.measureText(cleanDisplayUrl).width
  const maxAllowedUrlWidth = footerBoxW - 80
  if (urlWidth > maxAllowedUrlWidth) {
    const scale = maxAllowedUrlWidth / urlWidth
    const newSize = Math.max(14, Math.floor(24 * scale))
    ctx.font = `800 ${newSize}px "Montserrat", monospace`
  }

  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#38bdf8'
  ctx.shadowBlur = 12
  ctx.fillText(cleanDisplayUrl, width / 2, footerY + 82)
  ctx.shadowBlur = 0

  // Verification tagline
  ctx.font = '600 13px "Montserrat", sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Official Match Schedule • 24h Match Window • eFootball Tournament Hub', width / 2, footerY + 125)

  return canvas
}

/**
 * Generate formatted text for WhatsApp caption
 */
export function generateWeekWhatsAppText({
  weekNumber = 1,
  weekFixtures = [],
  playersMap = {},
  orgName = 'club 18',
  legLabel = 'Leg 1',
  shareUrl = ''
}) {
  const cleanOrg = orgName || 'eFootball League'
  const rawUrl = shareUrl || `${window.location.origin}/fixtures?org=${encodeURIComponent(cleanOrg)}&share=true`
  const finalUrl = rawUrl.replace(/&season=[a-f0-9-]+/gi, '')

  let text = `🏆 *${cleanOrg.toUpperCase()} — WEEK ${weekNumber} FIXTURES*\n`
  text += `📅 *Official Match Schedule (${legLabel || 'Round-Robin'})*\n`
  text += `━━━━━━━━━━━━━━━━━━━━\n`

  weekFixtures.forEach((f) => {
    const home = playersMap[f.home_player_id] || { name: 'Player 1' }
    const away = playersMap[f.away_player_id] || { name: 'Player 2' }

    if (f.status === 'COMPLETED') {
      text += `⚽ *${home.name}* [ ${f.home_score} - ${f.away_score} ] *${away.name}*  (Final)\n`
    } else if (f.status === 'EXPIRED_DISQUALIFIED') {
      text += `⚠️ *${home.name}* [ 0 - 0 ] *${away.name}*  (Forfeit)\n`
    } else {
      text += `⚔️ *${home.name}*  _vs_  *${away.name}*\n`
    }
  })

  text += `━━━━━━━━━━━━━━━━━━━━\n`
  text += `🔥 *View live scores, standings & download posters:*\n`
  text += `👉 ${finalUrl}\n`

  return text
}

/**
 * Download Week Fixture Poster directly to device
 */
export async function downloadWeekGraphic(params) {
  const canvas = await generateWeekGraphicCanvas(params)
  const { weekNumber, orgName } = params
  const cleanOrg = (orgName || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const link = document.createElement('a')
  link.download = `${cleanOrg}-week-${weekNumber}-fixtures.png`
  link.href = canvas.toDataURL('image/png', 1.0)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Copy Week Graphic Image & Text Caption to Clipboard
 * Writes both 'image/png' and 'text/plain' to clipboard so in WhatsApp Web:
 * 1st Ctrl+V loads the image, and pasting in caption box fills the live link!
 */
export async function copyWeekGraphicToClipboard(params) {
  const canvas = await generateWeekGraphicCanvas(params)
  const text = generateWeekWhatsAppText(params)
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
      // Fallback: write image only
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
 * Share Week Fixture Poster with Caption
 * On Mobile (Android / iPhone): WhatsApp natively attaches 'text' as the image caption in 1 single bubble!
 */
export async function shareWeekGraphic(params) {
  const canvas = await generateWeekGraphicCanvas(params)
  const text = generateWeekWhatsAppText(params)
  const { weekNumber, orgName } = params
  const cleanOrg = orgName || 'eFootball League'
  const title = `${cleanOrg} Week ${weekNumber} Fixture Schedule`

  if (navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
      const file = new File([blob], `${cleanOrg.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-week-${weekNumber}-fixtures.png`, {
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
  await copyWeekGraphicToClipboard(params)
  await downloadWeekGraphic(params)
  return { shared: true, downloaded: true }
}
