import React, { useState, useEffect } from 'react'
import { X, Trophy, Crown, Download, Copy, Share2, Sparkles, RefreshCw, ExternalLink } from 'lucide-react'
import confetti from 'canvas-confetti'
import {
  generateChampionGraphicCanvas,
  generateChampionWhatsAppText,
  downloadChampionGraphic,
  copyChampionGraphicToClipboard,
  shareChampionGraphic
} from '../lib/championGraphicGenerator'
import { useToast } from '../context/ToastContext'

export default function ChampionCelebrationModal({
  isOpen,
  onClose,
  playoffsData,
  playersMap = {},
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  if (!isOpen || !playoffsData?.championId) return null

  const { toast } = useToast()
  const [dataUrl, setDataUrl] = useState(null)
  const [generating, setGenerating] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)

  const champion = playersMap[playoffsData.championId] || { name: 'Champion', gamertag: 'winner', avatar_color: '#f59e0b' }
  const runnerUp = playersMap[playoffsData.runnerUpId] || { name: 'Runner-Up' }
  const third = playersMap[playoffsData.thirdPlaceId] || { name: '3rd Place' }

  const params = {
    playoffsData,
    playersMap,
    orgName: orgName || 'club 18',
    seasonName: seasonName || 'Season 1',
    shareUrl
  }

  const whatsAppText = generateChampionWhatsAppText(params)

  // Fire celebratory gold confetti
  useEffect(() => {
    if (!isOpen) return

    const duration = 3.5 * 1000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#00e676', '#38bdf8']
      })
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#00e676', '#38bdf8']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }, [isOpen])

  // Generate Champion Poster
  useEffect(() => {
    if (!isOpen) {
      setDataUrl(null)
      return
    }

    let isMounted = true
    setGenerating(true)

    generateChampionGraphicCanvas(params)
      .then((canvas) => {
        if (isMounted) {
          setDataUrl(canvas.toDataURL('image/png', 1.0))
          setGenerating(false)
        }
      })
      .catch((err) => {
        console.error('Failed to generate champion poster:', err)
        if (isMounted) setGenerating(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, playoffsData?.championId])

  const handleDownload = async () => {
    try {
      await downloadChampionGraphic(params)
      toast.success('Champion Winner Poster downloaded in HD! Ready for WhatsApp status.')
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    }
  }

  const handleCopyImage = async () => {
    try {
      const ok = await copyChampionGraphicToClipboard(params)
      if (ok) {
        setCopiedImage(true)
        toast.success('Champion Poster copied! Press Ctrl+V in WhatsApp Web.')
        setTimeout(() => setCopiedImage(false), 2500)
      } else {
        await handleDownload()
      }
    } catch {
      await handleDownload()
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const res = await shareChampionGraphic(params)
      if (res?.shared) {
        toast.success('Champion Poster shared successfully!')
      }
    } catch (err) {
      toast.error('Share failed: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppText)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[140] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border-2 border-amber-500 w-full max-w-xl rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-amber-500/20 via-[#131b2e] to-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Trophy className="w-5 h-5 text-slate-950 animate-bounce" />
            </div>
            <div>
              <h3 className="font-black text-amber-300 text-lg font-heading flex items-center gap-2">
                <span>CHAMPION CROWNED!</span>
                <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                  2026 Winner
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {orgName} • {seasonName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Winner Hero Plaque */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/15 via-[#162035] to-[#0f1422] border-2 border-amber-500/50 text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-2 right-3 text-amber-400 text-xs font-black flex items-center gap-1">
              <Crown className="w-4 h-4 text-amber-400" /> #1 Champion
            </div>

            <div
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl border-4 border-amber-300 my-2"
              style={{ backgroundColor: champion.avatar_color || '#f59e0b' }}
            >
              {(champion.name || 'CH').substring(0, 2).toUpperCase()}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white font-heading mt-1">
              {champion.name}
            </h2>
            <p className="text-xs font-mono text-amber-400 font-bold">@{champion.gamertag || 'gamer'}</p>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-amber-500/20 text-xs">
              <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">🥈 2nd Place</span>
                <span className="text-white font-bold">{runnerUp.name}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">🥉 3rd Place</span>
                <span className="text-white font-bold">{third.name}</span>
              </div>
            </div>
          </div>

          {/* HD Graphic Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-[#1f2b42] bg-[#070a13] shadow-inner flex items-center justify-center min-h-[280px]">
            {generating ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Generating HD Champion Poster Card...</p>
              </div>
            ) : dataUrl ? (
              <div className="relative w-full group">
                <img
                  src={dataUrl}
                  alt="Champion Poster"
                  className="w-full h-auto max-h-[420px] object-contain mx-auto transition duration-300"
                />
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-400 border border-amber-500/30 flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" /> 1080 HD Poster
                </div>
              </div>
            ) : (
              <p className="text-rose-400 text-xs py-10">Failed to render graphic preview.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-[#1c263c] bg-[#131b2e] shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <button
              onClick={handleDownload}
              disabled={generating}
              className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <span className="truncate">Download PNG</span>
            </button>

            <button
              onClick={handleCopyImage}
              disabled={generating}
              className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-xl transition border border-amber-500/30 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{copiedImage ? 'Copied!' : 'Copy (Ctrl+V)'}</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              disabled={generating}
              className="px-2.5 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-bold text-xs rounded-xl transition border border-[#25D366]/40 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">WA Text</span>
            </button>

            <button
              onClick={handleShare}
              disabled={generating || sharing}
              className="px-2.5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {sharing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Share2 className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">Share Poster</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

