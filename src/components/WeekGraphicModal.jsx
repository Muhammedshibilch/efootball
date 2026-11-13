import React, { useState, useEffect } from 'react'
import { X, Download, Share2, Sparkles, RefreshCw, Copy, Check, ExternalLink, Calendar, Image as ImageIcon } from 'lucide-react'
import {
  generateWeekGraphicCanvas,
  generateWeekWhatsAppText,
  downloadWeekGraphic,
  shareWeekGraphic,
  copyWeekGraphicToClipboard
} from '../lib/weekGraphicGenerator'
import { useToast } from '../context/ToastContext'

export default function WeekGraphicModal({
  isOpen,
  onClose,
  weekData,
  playersMap,
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  if (!isOpen || !weekData) return null

  const { toast } = useToast()
  const [dataUrl, setDataUrl] = useState(null)
  const [generating, setGenerating] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)

  const { roundNum, weekFixtures, legLabel } = weekData

  const cleanShareUrl = (shareUrl || `${window.location.origin}/fixtures?org=${encodeURIComponent(orgName || 'club 18')}&share=true`)
    .replace(/&season=[a-f0-9-]+/gi, '')

  const params = {
    weekNumber: roundNum,
    weekFixtures: weekFixtures || [],
    playersMap: playersMap || {},
    orgName: orgName || 'club 18',
    seasonName: seasonName || 'Season 1',
    legLabel: legLabel || 'Leg 1',
    shareUrl: cleanShareUrl
  }

  const whatsAppText = generateWeekWhatsAppText(params)

  const [refreshKey, setRefreshKey] = useState(0)

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

    generateWeekGraphicCanvas(params)
      .then((canvas) => {
        if (isMounted) {
          setDataUrl(canvas.toDataURL('image/png', 1.0))
          setGenerating(false)
        }
      })
      .catch((err) => {
        console.error('Failed to generate week poster:', err)
        if (isMounted) setGenerating(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, refreshKey, roundNum, weekFixtures?.length, orgName, seasonName, cleanShareUrl])

  const handleDownload = async () => {
    try {
      await downloadWeekGraphic(params)
      toast.success(`Week ${roundNum} fixture poster downloaded in HD! Ready to post on WhatsApp status or Instagram.`)
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    }
  }

  const handleCopyImage = async () => {
    try {
      const ok = await copyWeekGraphicToClipboard(params)
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
      const res = await shareWeekGraphic(params)
      if (res?.shared) {
        toast.success(`Week ${roundNum} fixture poster shared as a single image!`)
      }
    } catch (err) {
      toast.error('Share failed: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  const handleOpenWhatsAppDirect = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`
    window.open(waUrl, '_blank')
    toast.success('Opening WhatsApp with schedule & viral website link!')
  }

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(whatsAppText).then(() => {
      setCopiedCaption(true)
      toast.success('WhatsApp text with live website link copied to clipboard!')
      setTimeout(() => setCopiedCaption(false), 2500)
    })
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border-2 border-emerald-500/40 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1c263c] flex items-center justify-between bg-[#131b2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              <Calendar className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold !text-white text-sm sm:text-base font-heading flex items-center gap-2">
                <span className="!text-white">Week {roundNum} Fixture Poster</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                  {legLabel || 'Leg 1'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                All Matches + Live Website Link Embedded Inside Image (Single Message)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRegenerate}
              disabled={generating}
              title="Regenerate Poster Preview"
              className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* HD Graphic Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-[#1f2b42] bg-[#070a13] shadow-inner flex items-center justify-center min-h-[300px]">
            {generating ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs text-slate-400 font-medium">Generating HD Week {roundNum} Stadium Poster...</p>
              </div>
            ) : dataUrl ? (
              <div className="relative w-full group">
                <img
                  src={dataUrl}
                  alt={`Week ${roundNum} Fixtures`}
                  className="w-full h-auto max-h-[460px] object-contain mx-auto transition duration-300"
                />
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-lg">
                  <Sparkles className="w-3 h-3" /> 1080 HD
                </div>
              </div>
            ) : (
              <p className="text-rose-400 text-xs py-10">Failed to render graphic preview.</p>
            )}
          </div>

          {/* How to send as 1 single message like Paytm */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Single-Message WhatsApp Share (Image + Caption)</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                1 Bubble
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              • <strong>On Mobile (Android / iPhone)</strong>: Tap <strong>"Share Poster"</strong> → WhatsApp automatically attaches the link directly inside the image caption box!<br/>
              • <strong>On WhatsApp Web (PC)</strong>: Click <strong>"Copy (Ctrl+V)"</strong> → Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] border border-slate-700">Ctrl + V</kbd> in WhatsApp chat, then paste the link into the caption box!
            </p>
          </div>

          {/* Optional WhatsApp Caption with Attached Live Link Preview Box */}
          <div className="p-3.5 rounded-2xl bg-[#141b2c] border border-[#22304d] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Text Caption (Optional)
              </span>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="text-[11px] font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCaption ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <pre className="text-[11px] text-slate-300 bg-[#0a0d16] p-2.5 rounded-xl border border-[#1b253b] whitespace-pre-wrap font-mono leading-relaxed max-h-24 overflow-y-auto">
              {whatsAppText}
            </pre>
          </div>
        </div>

        {/* Footer Actions - Grid Layout so buttons never overlap */}
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
              title="Copy image to clipboard. Then press Ctrl+V in WhatsApp Web!"
              className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs rounded-xl transition border border-emerald-500/30 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{copiedImage ? 'Copied!' : 'Copy (Ctrl+V)'}</span>
            </button>

            <button
              onClick={handleOpenWhatsAppDirect}
              disabled={generating}
              className="px-2.5 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-bold text-xs rounded-xl transition border border-[#25D366]/40 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">WA Text</span>
            </button>

            <button
              onClick={handleShare}
              disabled={generating || sharing}
              className="px-2.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-950 shrink-0" />
              <span className="truncate">{sharing ? 'Sharing...' : 'Share Poster'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

