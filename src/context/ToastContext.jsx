import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle } from 'lucide-react'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)
  const idCounter = useRef(0)

  // Remove a toast by id
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Add toast
  const showToast = useCallback((message, type = 'info', title = null, duration = 3600) => {
    const id = ++idCounter.current
    const newToast = { id, message, type, title, duration }
    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    return id
  }, [removeToast])

  const toast = {
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title),
    warning: (msg, title) => showToast(msg, 'warning', title),
    info: (msg, title) => showToast(msg, 'info', title),
  }

  // Promise-based confirm modal
  const confirmModal = useCallback(({
    title = 'Are you sure?',
    message = '',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning' // 'danger' | 'warning' | 'info' | 'success'
  }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        }
      })
    })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, toast, confirmModal }}>
      {children}

      {/* Floating Toast Notification Stack */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((t) => {
          const typeStyles = {
            success: {
              border: 'border-emerald-500/40 dark:border-emerald-500/50',
              bg: 'bg-white dark:bg-[#0d1624]',
              badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
              glow: 'shadow-[0_10px_30px_rgba(16,185,129,0.18)] dark:shadow-[0_10px_35px_rgba(16,185,129,0.22)]',
              bar: 'bg-emerald-500'
            },
            error: {
              border: 'border-rose-500/40 dark:border-rose-500/50',
              bg: 'bg-white dark:bg-[#0d1624]',
              badge: 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
              icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
              glow: 'shadow-[0_10px_30px_rgba(244,63,94,0.18)] dark:shadow-[0_10px_35px_rgba(244,63,94,0.22)]',
              bar: 'bg-rose-500'
            },
            warning: {
              border: 'border-amber-500/40 dark:border-amber-500/50',
              bg: 'bg-white dark:bg-[#0d1624]',
              badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
              icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
              glow: 'shadow-[0_10px_30px_rgba(245,158,11,0.18)] dark:shadow-[0_10px_35px_rgba(245,158,11,0.22)]',
              bar: 'bg-amber-500'
            },
            info: {
              border: 'border-sky-500/40 dark:border-sky-500/50',
              bg: 'bg-white dark:bg-[#0d1624]',
              badge: 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400',
              icon: <Info className="w-5 h-5 text-sky-500 shrink-0" />,
              glow: 'shadow-[0_10px_30px_rgba(14,165,233,0.18)] dark:shadow-[0_10px_35px_rgba(14,165,233,0.22)]',
              bar: 'bg-sky-500'
            }
          }[t.type] || {
            border: 'border-slate-300 dark:border-slate-700',
            bg: 'bg-white dark:bg-[#0d1624]',
            badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            icon: <Info className="w-5 h-5 text-slate-500 shrink-0" />,
            glow: 'shadow-lg',
            bar: 'bg-slate-400'
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto relative overflow-hidden rounded-xl border ${typeStyles.border} ${typeStyles.bg} ${typeStyles.glow} p-3.5 sm:p-4 text-slate-900 dark:text-white transition-all duration-300 animate-in fade-in slide-in-from-top-4`}
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg shrink-0 ${typeStyles.badge}`}>
                  {typeStyles.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  {t.title && (
                    <h4 className="text-xs font-bold tracking-wide uppercase text-slate-900 dark:text-white mb-0.5">
                      {t.title}
                    </h4>
                  )}
                  <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug break-words">
                    {t.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
                  aria-label="Close notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress timer bar */}
              {t.duration > 0 && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${typeStyles.bar} opacity-75 origin-left animate-[toast-progress_linear_forwards]`}
                  style={{ animationDuration: `${t.duration}ms` }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-[#223049] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    confirmDialog.type === 'danger'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                      : confirmDialog.type === 'warning'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                  }`}
                >
                  {confirmDialog.type === 'danger' ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : confirmDialog.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {confirmDialog.title}
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {confirmDialog.message}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={confirmDialog.onCancel}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg transition ${
                    confirmDialog.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : confirmDialog.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

