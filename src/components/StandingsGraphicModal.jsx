import React, { useState, useEffect } from 'react'
import { X, Download, Share2, Sparkles, RefreshCw, Copy, Check, ExternalLink, Trophy, Image as ImageIcon } from 'lucide-react'
import {
  generateStandingsGraphicCanvas,
  generateStandingsWhatsAppText,
  downloadStandingsGraphic,
  shareStandingsGraphic,
  copyStandingsGraphicToClipboard
} from '../lib/standingsGraphicGenerator'
import { useToast } from '../context/ToastContext'

export default function StandingsGraphicModal({
  isOpen,
  onClose,
  standings = [],
  orgName = 'club 18',
  seasonName = 'Season 1',
  shareUrl = ''
}) {
  if (!isOpen) return null

  const { toast } = useToast()
  const [dataUrl, setDataUrl] = useState(null)
  const [generating, setGenerating] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const cleanShareUrl = (shareUrl || `${window.location.origin}/standings?org=${encodeURIComponent(orgName || 'club 18')}&share=true`)
    .replace(/&season=[a-f0-9-]+/gi, '')

  const params = {
    standings: standings || [],
    orgName: orgName || 'club 18',
    seasonName: seasonName || 'Season 1',
    shareUrl: cleanShareUrl
  }

  const whatsAppText = generateStandingsWhatsAppText(params)

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

    generateStandingsGraphicCanvas(params)
      .then((canvas) => {
        if (isMounted) {
          setDataUrl(canvas.toDataURL('image/png', 1.0))
          setGenerating(false)
        }
      })
      .catch((err) => {
        console.error('Failed to generate standings poster:', err)
        if (isMounted) setGenerating(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, refreshKey, standings?.length, orgName, seasonName, cleanShareUrl])

  const handleDownload = async () => {
    try {
      await downloadStandingsGraphic(params)
      toast.success('League Standings poster downloaded in HD! Ready to post on WhatsApp status or Instagram.')
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    }
  }

  const handleCopyImage = async () => {
    try {
      const ok = await copyStandingsGraphicToClipboard(params)
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
      const res = await shareStandingsGraphic(params)
      if (res?.shared) {
        toast.success('League Standings poster shared as a single image!')
      }
    } catch (err) {
      toast.error('Share failed: ' + err.message)
    } finally {
      setSharing(false)
    }
  }

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(whatsAppText).then(() => {
      setCopiedCaption(true)
      toast.success('WhatsApp text caption copied!')
      setTimeout(() => setCopiedCaption(false), 2500)
    })
  }

  const handleOpenWhatsAppDirect = () => {
    const encoded = encodeURIComponent(whatsAppText)
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1422] border-2 border-emerald-500/40 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1c263c] flex items-center justify-between bg-[#131b2e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
              <Trophy className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold !text-white text-sm sm:text-base font-heading flex items-center gap-2">
                <span className="!text-white">League Standings Poster</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                  Points Table
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Full Rankings + Live Website Link Embedded Inside Image (Single Message)
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
                <p className="text-xs text-slate-400 font-medium">Generating HD League Standings Poster...</p>
              </div>
            ) : dataUrl ? (
              <div className="relative w-full group">
                <img
                  src={dataUrl}
                  alt="League Standings"
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
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border border-emerald-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                Full points table and website link are drawn directly on this image!
              </span>
              <button
                onClick={handleCopyImage}
                disabled={generating}
                className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-semibold rounded-lg border border-emerald-500/40 flex items-center gap-1 transition"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedImage ? 'Copied Image!' : 'Copy Image'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>WhatsApp Web:</strong> Click <strong>Copy Image</strong>, open your WhatsApp group, and press <kbd className="px-1.5 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700 font-mono text-[10px]">Ctrl+V</kbd> to paste & send in 1 message!
              <br />
              <strong>Mobile:</strong> Click <strong>Share Poster Image</strong> to send the poster with caption attached in a single WhatsApp bubble.
            </p>
          </div>

          {/* WhatsApp Text Caption Preview */}
          <div className="rounded-2xl border border-[#1f2b42] bg-[#090d18] p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                WhatsApp Text Caption (Optional)
              </span>
              <button
                onClick={handleCopyCaption}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
              >
                {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCaption ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <pre className="p-2.5 rounded-xl bg-[#060913] text-[11px] text-slate-300 font-mono overflow-x-auto max-h-36 scrollbar-none whitespace-pre-wrap leading-relaxed border border-[#172033]">
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
              className="px-2.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
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

