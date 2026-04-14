import React, { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  onClose: () => void
  closeOnBackdrop?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  footer,
  onClose,
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#020617]/75 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div className="relative w-full max-w-[480px] rounded-3xl border border-[#1F2937] bg-[#111827] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1F2937] px-5 py-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-2 py-1 text-slate-400 transition hover:text-white"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-[#1F2937] px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
