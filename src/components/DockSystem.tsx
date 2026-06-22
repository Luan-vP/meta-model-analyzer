import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type DockSide = 'left' | 'right'

export interface DockItemConfig {
  id: string
  label: string
  content: React.ReactNode
  desktopDock: DockSide
  mobileOrder?: number
}

interface SideDockProps {
  items: DockItemConfig[]
  side: DockSide
  openId: string | null
  onToggle: (id: string) => void
}

function SideDock({ items, side, openId, onToggle }: SideDockProps) {
  if (items.length === 0) return null
  const isLeft = side === 'left'
  const openItem = items.find(i => i.id === openId)

  return (
    <div
      className={`hidden sm:flex fixed inset-y-0 z-20 items-stretch ${isLeft ? 'left-0 flex-row' : 'right-0 flex-row-reverse'}`}
      style={{ pointerEvents: 'none' }}
    >
      <AnimatePresence>
        {openItem && (
          <motion.aside
            key={openItem.id}
            initial={{ x: isLeft ? '-100%' : '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isLeft ? '-100%' : '100%', opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{
              pointerEvents: 'auto',
              // Directional drop shadow cast toward the page content, so the
              // panel reads as floating above it while open.
              boxShadow: isLeft
                ? '14px 0 34px -6px rgba(60, 43, 20, 0.22)'
                : '-14px 0 34px -6px rgba(60, 43, 20, 0.22)',
            }}
            className={`w-80 overflow-y-auto bg-zinc-100 paper-surface ${isLeft ? 'border-r border-zinc-200' : 'border-l border-zinc-200'}`}
          >
            <div className="p-5">
              {openItem.content}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Tab strip — stacks vertically, positions assigned by flex, can't overlap */}
      <div
        style={{ pointerEvents: 'auto' }}
        className={`flex flex-col ${isLeft ? 'border-r border-zinc-200' : 'border-l border-zinc-200'}`}
      >
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            aria-expanded={openId === item.id}
            className={`px-2 py-4 text-[11px] font-semibold uppercase tracking-widest bg-zinc-100 paper-surface border-zinc-200 transition-colors ${
              openId === item.id
                ? 'text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-50'
            } ${isLeft ? '' : 'border-l'}`}
            style={{
              writingMode: 'vertical-rl',
              transform: isLeft ? 'rotate(180deg)' : undefined,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function DockSystem({ items }: { items: DockItemConfig[] }) {
  const [leftOpen, setLeftOpen] = useState<string | null>(null)
  const [rightOpen, setRightOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState<string | null>(null)

  const leftItems = items.filter(i => i.desktopDock === 'left')
  const rightItems = items.filter(i => i.desktopDock === 'right')
  const mobileItems = [...items].sort((a, b) => (a.mobileOrder ?? 99) - (b.mobileOrder ?? 99))

  const mobileOpenItem = items.find(i => i.id === mobileOpen)

  return (
    <>
      <SideDock
        items={leftItems}
        side="left"
        openId={leftOpen}
        onToggle={id => setLeftOpen(p => (p === id ? null : id))}
      />
      <SideDock
        items={rightItems}
        side="right"
        openId={rightOpen}
        onToggle={id => setRightOpen(p => (p === id ? null : id))}
      />

      {/* Mobile: bottom tab bar + sliding bottom sheet */}
      <div className="sm:hidden">
        <AnimatePresence>
          {mobileOpenItem && (
            <motion.div
              key={mobileOpenItem.id}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-10 z-20 max-h-[70vh] overflow-y-auto bg-zinc-100 paper-surface border-t border-zinc-200 shadow-soft"
            >
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800">{mobileOpenItem.label}</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(null)}
                    className="p-1 text-xl leading-none text-zinc-400 hover:text-zinc-700"
                    aria-label="Close panel"
                  >
                    ×
                  </button>
                </div>
                {mobileOpenItem.content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom tab bar — order driven by mobileOrder, not desktopDock */}
        <div className="fixed bottom-0 inset-x-0 z-30 flex border-t border-zinc-200 bg-zinc-100 paper-surface">
          {mobileItems.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileOpen(p => (p === item.id ? null : item.id))}
              aria-expanded={mobileOpen === item.id}
              className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                mobileOpen === item.id ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {item.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
