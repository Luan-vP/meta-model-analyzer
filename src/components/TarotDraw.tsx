import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { drawRandomCard, SUIT_LABELS, type TarotCard } from '../data/tarot'

const SUIT_ACCENTS: Record<TarotCard['suit'], string> = {
  major: 'bg-violet-50 text-violet-700 border-violet-200',
  wands: 'bg-orange-50 text-orange-700 border-orange-200',
  cups: 'bg-sky-50 text-sky-700 border-sky-200',
  swords: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  pentacles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export function TarotContent() {
  const [card, setCard] = useState<TarotCard | null>(null)
  const [drawKey, setDrawKey] = useState(0)

  function draw() {
    const next = drawRandomCard(card)
    setCard(next)
    setDrawKey(k => k + 1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Daily tarot</h2>
        <span className="text-[11px] uppercase tracking-widest text-zinc-400">Upright only</span>
      </div>

      {!card ? (
        <p className="text-sm leading-relaxed text-zinc-600">
          Pull a single card for a moment of reflection. Meanings are drawn from{' '}
          <a
            href="https://labyrinthos.co/blogs/tarot-card-meanings-list"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
          >
            labyrinthos
          </a>
          .
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={drawKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3"
          >
            <div>
              <div className="text-xs uppercase tracking-widest text-zinc-400">
                {SUIT_LABELS[card.suit]}
              </div>
              <div className="mt-0.5 text-lg font-semibold text-zinc-900">{card.name}</div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {card.keywords.map(kw => (
                <span
                  key={kw}
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${SUIT_ACCENTS[card.suit]}`}
                >
                  {kw}
                </span>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-zinc-700">{card.meaning}</p>
          </motion.div>
        </AnimatePresence>
      )}

      <button
        type="button"
        onClick={draw}
        className="mt-1 rounded-md border border-zinc-200 bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
      >
        {card ? 'Draw another card' : 'Draw a card'}
      </button>
    </div>
  )
}
