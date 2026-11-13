/**
 * eFootball High-Definition Champion Winner Poster Generator
 * Generates 1080 x 1450px HD posters celebrating the crowned tournament Champion,
 * featuring gold podiums, playoff road to glory, and viral website link.
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

export async function generateChampionGraphicCanvas({
  playoffsData,
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

  // Background
  ctx.fillStyle = '#05070e'
  ctx.fillRect(0, 0, width, height)

  // Stadium Image
  try {
    const stadiumImg = await loadImage('/images/stadium.jpg')
    if (stadiumImg) {
      ctx.save()
      ctx.globalAlpha = 0.2
      ctx.drawImage(stadiumImg, 0, 0, width, height)
      ctx.restore()
    }
  } catch {}

  // Golden Sheen Gradients
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, 'rgba(8, 12, 24, 0.94)')
  bgGrad.addColorStop(0.35, 'rgba(40, 24, 5, 0.96)') // Gold ambient
  bgGrad.addColorStop(0.7, 'rgba(10, 15, 26, 0.98)')
  bgGrad.addColorStop(1, 'rgba(5, 7, 14, 0.99)')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Top Floodlights: Golden Halo
  const goldLight = ctx.createRadialGradient(width / 2, 260, 50, width / 2, 260, 600)
  goldLight.addColorStop(0, 'rgba(245, 158, 11, 0.45)')
  goldLight.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)')
  goldLight.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = goldLight
  ctx.fillRect(0, 0, width, 800)

  // HEADER
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Organization Pill
  const orgText = (orgName || 'CLUB 18').trim().toUpperCase()
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const orgTextWidth = ctx.measureText(orgText).width
  const orgPillW = Math.max(240, orgTextWidth + 80)
  const orgPillH = 54
  const orgPillX = (width - orgPillW) / 2
  const orgPillY = 46

  const orgGrad = ctx.createLinearGradient(orgPillX, orgPillY, orgPillX + orgPillW, orgPillY + orgPillH)
  orgGrad.addColorStop(0, '#78350f')
  orgGrad.addColorStop(0.5, '#b45309')
  orgGrad.addColorStop(1, '#78350f')
  ctx.fillStyle = orgGrad
  roundRect(ctx, orgPillX, orgPillY, orgPillW, orgPillH, 27)
  ctx.fill()
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 3
  roundRect(ctx, orgPillX, orgPillY, orgPillW, orgPillH, 27)
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#f59e0b'
  ctx.shadowBlur = 8
  ctx.fillText(orgText, width / 2, orgPillY + (orgPillH / 2))
  ctx.shadowBlur = 0

  // Subtitle
  const seasonY = orgPillY + orgPillH + 28
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '800 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText(`${(seasonName || 'SEASON 1').trim().toUpperCase()} • GRAND FINALS`, width / 2, seasonY)
  ctx.letterSpacing = '0px'

  // Big Glowing Title
  const titleY = seasonY + 54
  ctx.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Montserrat", sans-serif'
  ctx.fillStyle = '#fef08a'
  ctx.shadowColor = 'rgba(245, 158, 11, 0.7)'
  ctx.shadowBlur = 24
  ctx.fillText('LEAGUE CHAMPION', width / 2, titleY)
  ctx.shadowBlur = 0

  // Crown Icon / Banner
  ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#f59e0b'
  ctx.fillText('👑 🏆 👑', width / 2, titleY + 54)

  // CHAMPION CENTERPIECE HERO
  const champId = playoffsData?.championId
  const champion = playersMap[champId] || { name: 'Champion', gamertag: 'winner', avatar_color: '#f59e0b' }
  const champBoxY = titleY + 110
  const champBoxW = 760
  const champBoxH = 340
  const champBoxX = (width - champBoxW) / 2

  // Golden Trophy Plaque
  const plaqueGrad = ctx.createLinearGradient(champBoxX, champBoxY, champBoxX + champBoxW, champBoxY + champBoxH)
  plaqueGrad.addColorStop(0, 'rgba(120, 53, 15, 0.75)')
  plaqueGrad.addColorStop(0.5, 'rgba(24, 18, 10, 0.95)')
  plaqueGrad.addColorStop(1, 'rgba(120, 53, 15, 0.75)')
  ctx.fillStyle = plaqueGrad
  roundRect(ctx, champBoxX, champBoxY, champBoxW, champBoxH, 28)
  ctx.fill()
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 3
  roundRect(ctx, champBoxX, champBoxY, champBoxW, champBoxH, 28)
  ctx.stroke()

  // Large Champion Avatar
  const avatarY = champBoxY + 105
  const avatarR = 64
  ctx.beginPath()
  ctx.arc(width / 2, avatarY, avatarR, 0, Math.PI * 2)
  ctx.fillStyle = champion.avatar_color || '#f59e0b'
  ctx.fill()
  ctx.strokeStyle = '#fef08a'
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.fillStyle = '#0f172a'
  ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText((champion.name || 'CH').substring(0, 2).toUpperCase(), width / 2, avatarY + 4)

  // Champion Name
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.shadowColor = 'rgba(245, 158, 11, 0.8)'
  ctx.shadowBlur = 16
  ctx.fillText(champion.name || 'Champion', width / 2, avatarY + avatarR + 42)
  ctx.shadowBlur = 0

  // Gamertag Pill
  ctx.fillStyle = '#fef08a'
  ctx.font = '800 18px "Montserrat", monospace'
  ctx.fillText(`@${champion.gamertag || 'gamer'}`, width / 2, avatarY + avatarR + 78)

  // Official Champion Ribbon
  const ribbonY = avatarY + avatarR + 115
  ctx.fillStyle = '#f59e0b'
  roundRect(ctx, width / 2 - 200, ribbonY - 18, 400, 36, 18)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  ctx.font = '900 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.letterSpacing = '2px'
  ctx.fillText('★ OFFICIAL TOURNAMENT WINNER ★', width / 2, ribbonY)
  ctx.letterSpacing = '0px'

  // PODIUM BREAKDOWN (1st, 2nd, 3rd)
  const podiumY = champBoxY + champBoxH + 40
  const runnerUp = playersMap[playoffsData?.runnerUpId] || { name: 'Runner-Up', gamertag: 'p2' }
  const thirdPlace = playersMap[playoffsData?.thirdPlaceId] || { name: '3rd Place', gamertag: 'p3' }

  const cardW = 440
  const cardH = 90
  const cardGap = 20

  // 2nd Place Card (Silver)
  const silverX = (width - (cardW * 2 + cardGap)) / 2
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  roundRect(ctx, silverX, podiumY, cardW, cardH, 18)
  ctx.fill()
  ctx.strokeStyle = '#94a3b8'
  ctx.lineWidth = 2
  roundRect(ctx, silverX, podiumY, cardW, cardH, 18)
  ctx.stroke()

  ctx.fillStyle = '#94a3b8'
  ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🥈 RUNNER-UP (2nd)', silverX + 22, podiumY + 32)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(runnerUp.name || 'Runner-Up', silverX + 22, podiumY + 62)

  // 3rd Place Card (Bronze)
  const bronzeX = silverX + cardW + cardGap
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
  roundRect(ctx, bronzeX, podiumY, cardW, cardH, 18)
  ctx.fill()
  ctx.strokeStyle = '#d97706'
  ctx.lineWidth = 2
  roundRect(ctx, bronzeX, podiumY, cardW, cardH, 18)
  ctx.stroke()

  ctx.fillStyle = '#d97706'
  ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('🥉 PODIUM (3rd)', bronzeX + 22, podiumY + 32)
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(thirdPlace.name || '3rd Place', bronzeX + 22, podiumY + 62)

  // ROAD TO GLORY / GRAND FINAL SCORE SUMMARY
  const roadY = podiumY + cardH + 34
  const roadW = cardW * 2 + cardGap
  const roadH = 150
  const roadX = silverX

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
  roundRect(ctx, roadX, roadY, roadW, roadH, 20)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1.5
  roundRect(ctx, roadX, roadY, roadW, roadH, 20)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#94a3b8'
  ctx.font = '900 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.letterSpacing = '1.5px'
  ctx.fillText('🏆 GRAND FINAL MATCH RESULT', width / 2, roadY + 34)
  ctx.letterSpacing = '0px'

  const finalMatch = playoffsData?.matches?.final
  const fHome = playersMap[finalMatch?.homePlayerId] || champion
  const fAway = playersMap[finalMatch?.awayPlayerId] || runnerUp
  const fHScore = finalMatch?.homeScore ?? 3
  const fAScore = finalMatch?.awayScore ?? 1
  const pensText = finalMatch?.homePens !== null && finalMatch?.awayPens !== null ? `(${finalMatch.homePens} - ${finalMatch.awayPens} Pens)` : ''

  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'right'
  ctx.fillText(fHome.name || 'Player 1', width / 2 - 80, roadY + 85)

  ctx.textAlign = 'center'
  ctx.font = '900 32px "Montserrat", monospace'
  ctx.fillStyle = '#f59e0b'
  ctx.fillText(`${fHScore}  -  ${fAScore}`, width / 2, roadY + 84)

  ctx.textAlign = 'left'
  ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(fAway.name || 'Player 2', width / 2 + 80, roadY + 85)

  if (pensText) {
    ctx.textAlign = 'center'
    ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillStyle = '#f59e0b'
    ctx.fillText(pensText, width / 2, roadY + 120)
  }

  // FOOTER: VIRAL LINK CARD
  const footerY = height - 190
  const footerBoxW = roadW
  const footerBoxH = 150

  const footerGrad = ctx.createLinearGradient(roadX, footerY, roadX + footerBoxW, footerY + footerBoxH)
  footerGrad.addColorStop(0, 'rgba(120, 53, 15, 0.6)')
  footerGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.92)')
  footerGrad.addColorStop(1, 'rgba(6, 78, 59, 0.6)')
  ctx.fillStyle = footerGrad
  roundRect(ctx, roadX, footerY, footerBoxW, footerBoxH, 20)
  ctx.fill()
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 2
  roundRect(ctx, roadX, footerY, footerBoxW, footerBoxH, 20)
  ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#fbbf24'
  ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.letterSpacing = '1.5px'
  ctx.fillText('🔗 VIEW FULL PLAYOFF BRACKET & TOURNAMENT STATS', width / 2, footerY + 38)
  ctx.letterSpacing = '0px'

  const rawUrl = shareUrl || `${window.location.origin}/playoffs?org=${encodeURIComponent(orgName || 'club 18')}&share=true`
  const cleanUrl = rawUrl.replace(/&season=[a-f0-9-]+/gi, '')

  const urlBoxY = footerY + 54
  const urlBoxH = 44
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  roundRect(ctx, roadX + 30, urlBoxY, footerBoxW - 60, urlBoxH, 12)
  ctx.fill()
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'
  ctx.lineWidth = 1
  roundRect(ctx, roadX + 30, urlBoxY, footerBoxW - 60, urlBoxH, 12)
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
  ctx.shadowColor = '#f59e0b'
  ctx.shadowBlur = 12
  ctx.fillText(cleanUrl, width / 2, urlBoxY + (urlBoxH / 2))
  ctx.shadowBlur = 0

  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#94a3b8'
  ctx.fillText('Official League Archive • eFootball Tournament Hub', width / 2, footerY + 125)

  ctx.restore()
  return canvas
}

export function generateChampionWhatsAppText({
  playoffsData,
  playersMap = {},
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  const cleanOrg = orgName || 'eFootball League'
  const cleanSeason = seasonName || 'Season 1'
  const champion = playersMap[playoffsData?.championId] || { name: 'Champion' }
  const runnerUp = playersMap[playoffsData?.runnerUpId] || { name: 'Runner-Up' }
  const third = playersMap[playoffsData?.thirdPlaceId] || { name: '3rd Place' }

  const rawUrl = shareUrl || `${window.location.origin}/playoffs?org=${encodeURIComponent(cleanOrg)}&share=true`
  const cleanUrl = rawUrl.replace(/&season=[a-f0-9-]+/gi, '')

  let text = `👑 *${cleanOrg.toUpperCase()} — CHAMPION CROWNED!* 🏆\n`
  text += `📅 *${cleanSeason} • Grand Finals Result*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `🥇 *CHAMPION:* 👑 *${champion.name}*\n`
  text += `🥈 *RUNNER-UP:* *${runnerUp.name}*\n`
  text += `🥉 *3RD PLACE:* *${third.name}*\n`
  text += `━━━━━━━━━━━━━━━━━━━━━\n`
  text += `🔥 View full tournament bracket & download Champion poster:\n`
  text += `👉 ${cleanUrl}\n`

  return text
}

export async function downloadChampionGraphic(params) {
  const canvas = await generateChampionGraphicCanvas(params)
  const { orgName, seasonName } = params
  const cleanOrg = (orgName || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const cleanSeason = (seasonName || 'season-1').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const fileName = `${cleanOrg}-${cleanSeason}-champion.png`

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

export async function copyChampionGraphicToClipboard(params) {
  const canvas = await generateChampionGraphicCanvas(params)
  const text = generateChampionWhatsAppText(params)

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

export async function shareChampionGraphic(params) {
  const canvas = await generateChampionGraphicCanvas(params)
  const text = generateChampionWhatsAppText(params)
  const { orgName, seasonName } = params
  const cleanOrg = orgName || 'eFootball League'
  const title = `${cleanOrg} ${seasonName || 'Season 1'} Champion`

  if (navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0))
      const file = new File([blob], `${cleanOrg.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-champion.png`, {
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

  await copyChampionGraphicToClipboard(params)
  await downloadChampionGraphic(params)
  return { shared: true, downloaded: true }
}

