import React, { useState, useEffect } from 'react'
import { X, Download, Share2, Sparkles, Check, RefreshCw } from 'lucide-react'
import { generateMatchGraphicCanvas, downloadMatchGraphic, shareMatchGraphic } from '../lib/matchGraphicGenerator'
import { useToast } from '../context/ToastContext'

export default function MatchGraphicModal({
  isOpen,
  onClose,
  fixture,
  playersMap,
  orgName = 'club 18',
  seasonName = 'Season 1'
}) {
  if (!isOpen || !fixture) return null

  const { toast } = useToast()
  const [dataUrl, setDataUrl] = useState(null)
  const [generating, setGenerating] = useState(true)
  const [sharing, setSharing] = useState(false)

  const home = playersMap[fixture.home_player_id] || { name: 'Player 1', gamertag: 'home', avatar_color: '#3b82f6' }
  const away = playersMap[fixture.away_player_id] || { name: 'Player 2', gamertag: 'away', avatar_color: '#10b981' }

  const params = {
    fixture,
    homePlayer: home,
    awayPlayer: away,
    orgName,
    seasonName
  }

  useEffect(() => {
    let isMounted = true
    setGenerating(true)

    generateMatchGraphicCanvas(params)
      .then((canvas) => {
        if (isMounted) {
          setDataUrl(canvas.toDataURL('image/png', 1.0))
          setGenerating(false)
        }
      })
      .catch((err) => {
        console.error('Failed to generate match graphic:', err)
        if (isMounted) setGenerating(false)
      })

    return () => {
      isMounted = false
    }
  }, [fixture?.id, fixture?.home_score, fixture?.away_score, fixture?.status, orgName, seasonName])

  const handleDownload = async () => {
    try {
      await downloadMatchGraphic(params)
      toast.success('Match poster downloaded! Ready to share on WhatsApp & Instagram.')
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      const res = await shareMatchGraphic(params)
      if (res?.shared) {
        toast.success('Shared successfully!')
      } else if (res?.downloaded) {
        toast.info('Image saved to downloads for sharing.')
      }
    } catch (err) {
      toast.error('Share failed: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border-2 border-emerald-500/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1c263c] flex items-center justify-between bg-[#131b2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base font-heading">
                Match Result Graphic
              </h3>
              <p className="text-[11px] text-slate-400">
                1080×1350 HD Poster • WhatsApp Status & Instagram Story
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

        {/* Poster Preview Arena */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col items-center justify-center bg-[#070a12]/90">
          {generating ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium font-mono">Generating HD stadium poster...</p>
            </div>
          ) : dataUrl ? (
            <div className="relative group max-w-[340px] sm:max-w-[380px] w-full rounded-2xl overflow-hidden shadow-[0_12px_45px_rgba(0,0,0,0.7)] border border-emerald-500/30">
              <img
                src={dataUrl}
                alt={`${home.name} vs ${away.name} Match Result`}
                className="w-full h-auto object-contain block"
              />
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-rose-400">
              Failed to load preview. Please try again.
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 sm:p-5 border-t border-[#1c263c] bg-[#0c1220] flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="text-center sm:text-left">
            <span className="text-[11px] text-slate-400 font-medium block">
              Official {orgName} Matchday Graphic
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">
              Ready to post with 1 click
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShare}
              disabled={generating || sharing}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Share</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Download Image (PNG)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

