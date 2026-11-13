import React, { useState, useEffect } from 'react'
import {
  X,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Award,
  Crown,
  ExternalLink,
  Flame
} from 'lucide-react'
import {
  generateAwardsGraphicCanvas,
  generateAwardsWhatsAppText,
  downloadAwardsGraphic,
  shareAwardsGraphic,
  copyAwardsGraphicToClipboard
} from '../lib/awardsGraphicGenerator'
import { useToast } from '../context/ToastContext'

export default function AwardsGraphicModal({
  isOpen,
  onClose,
  standings = [],
  fixtures = [],
  playersMap = {},
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  if (!isOpen) return null

  const { toast } = useToast()
  const [dataUrl, setDataUrl] = useState(null)
  const [generating, setGenerating] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const cleanShareUrl = (shareUrl || `${window.location.origin}/stats?org=${encodeURIComponent(orgName || 'club 18')}&share=true`)

  const params = {
    standings: standings || [],
    fixtures: fixtures || [],
    playersMap: playersMap || {},
    orgName: orgName || 'club 18',
    seasonName: seasonName || 'Season 1',
    shareUrl: cleanShareUrl
  }

  const whatsAppText = generateAwardsWhatsAppText(params)

  const handleRegenerate = () => {
    setDataUrl(null)
    setGenerating(true)
    setRefreshKey(prev => prev + 1)
  }

  useEffect(() => {
    if (!isOpen) {
      setDataUrl(null)
      return
    }

    let isMounted = true
    setGenerating(true)

    generateAwardsGraphicCanvas(params)
      .then((canvas) => {
        if (isMounted) {
          setDataUrl(canvas.toDataURL('image/png', 1.0))
          setGenerating(false)
        }
      })
      .catch((err) => {
        console.error('Failed to generate awards poster:', err)
        if (isMounted) setGenerating(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, refreshKey, standings?.length, fixtures?.length, orgName, seasonName])

  const handleDownload = async () => {
    try {
      await downloadAwardsGraphic(params)
      toast.success('Awards poster downloaded in HD! Ready to post on WhatsApp status or Instagram.')
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    }
  }

  const handleCopyImage = async () => {
    try {
      const ok = await copyAwardsGraphicToClipboard(params)
      if (ok) {
        setCopiedImage(true)
        toast.success('Poster image copied! In WhatsApp Web, simply press Ctrl+V to paste & send in 1 message.')
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
      const res = await shareAwardsGraphic(params)
      if (res?.shared) {
        if (res.downloaded) {
          toast.success('Poster saved and ready to send via WhatsApp!')
        } else {
          toast.success('Awards poster shared successfully!')
        }
      }
    } catch (err) {
      toast.error('Share failed: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(whatsAppText)
    setCopiedCaption(true)
    toast.success('WhatsApp Awards caption copied to clipboard!')
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(whatsAppText)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[140] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border-2 border-amber-500/50 w-full max-w-xl rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-amber-500/30 flex items-center justify-between bg-gradient-to-r from-amber-500/20 via-[#131b2e] to-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Award className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="font-black text-amber-300 text-lg font-heading flex items-center gap-2">
                <span>LEAGUE AWARDS POSTER</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                  HD Poster
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                {orgName} • {seasonName} • Golden Boot & Glove
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
          
          {/* Quick instructions pill */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Tap <strong>Share via WhatsApp</strong> to send this Ultra-HD awards card directly to your league chat!</span>
            </div>
          </div>

          {/* Graphic Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-[#1f2b42] bg-[#070a13] shadow-inner flex items-center justify-center min-h-[300px]">
            {generating ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Rendering Ultra-HD League Awards Graphic...</p>
              </div>
            ) : dataUrl ? (
              <div className="relative w-full group">
                <img
                  src={dataUrl}
                  alt="League Awards Poster"
                  className="w-full h-auto max-h-[460px] object-contain mx-auto transition duration-300"
                />
                <button
                  onClick={handleRegenerate}
                  title="Re-render poster"
                  className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-amber-400 rounded-xl border border-slate-700/80 backdrop-blur-sm transition shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-rose-400 py-16">Failed to render graphic preview.</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleShare}
              disabled={generating || sharing}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>{sharing ? 'Sharing...' : 'Share via WhatsApp (Poster + Caption)'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                disabled={generating}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download HD Image</span>
              </button>

              <button
                onClick={handleCopyImage}
                disabled={generating}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 active:scale-95 disabled:opacity-50"
              >
                {copiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copiedImage ? 'Copied!' : 'Copy Image'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 px-1">
              <button
                onClick={handleCopyCaption}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCaption ? 'Caption Copied!' : 'Copy Text Caption'}</span>
              </button>

              <button
                onClick={handleOpenWhatsApp}
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

