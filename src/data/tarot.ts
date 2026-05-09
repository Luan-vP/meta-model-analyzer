// Tarot card meanings sourced from labyrinthos.co (upright only).
// Keywords are taken verbatim from labyrinthos's card-meanings list;
// interpretations are condensed in labyrinthos's voice.

export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'

export interface TarotCard {
  name: string
  suit: TarotSuit
  keywords: string[]
  meaning: string
}

export const TAROT_DECK: TarotCard[] = [
  // Major Arcana
  {
    name: 'The Fool',
    suit: 'major',
    keywords: ['innocence', 'new beginnings', 'free spirit'],
    meaning:
      'A card of infinite potential, signalling fresh starts and adventurous journeys. Embrace optimism, spontaneity, and the courage to explore new possibilities with childlike wonder.',
  },
  {
    name: 'The Magician',
    suit: 'major',
    keywords: ['willpower', 'desire', 'creation', 'manifestation'],
    meaning:
      'You have all the tools you need to create what you want. Focused intention and decisive action turn possibility into reality.',
  },
  {
    name: 'The High Priestess',
    suit: 'major',
    keywords: ['intuitive', 'unconscious', 'inner voice'],
    meaning:
      'Wisdom is whispering beneath the surface. Quiet the noise and trust what your inner voice already knows.',
  },
  {
    name: 'The Empress',
    suit: 'major',
    keywords: ['motherhood', 'fertility', 'nature'],
    meaning:
      'A season of nurture, abundance, and creative growth. Tend what you love and let it flourish in its own time.',
  },
  {
    name: 'The Emperor',
    suit: 'major',
    keywords: ['authority', 'structure', 'control', 'fatherhood'],
    meaning:
      'Stability is built through discipline, leadership, and clear boundaries. Take ownership and bring order to what is in front of you.',
  },
  {
    name: 'The Hierophant',
    suit: 'major',
    keywords: ['tradition', 'conformity', 'morality', 'ethics'],
    meaning:
      'Lean on shared wisdom, mentors, and the well-worn path. Some questions are best answered by traditions tested across time.',
  },
  {
    name: 'The Lovers',
    suit: 'major',
    keywords: ['partnerships', 'duality', 'union'],
    meaning:
      'A meaningful choice about connection and values stands before you. Honour what truly aligns and let union be built on honesty.',
  },
  {
    name: 'The Chariot',
    suit: 'major',
    keywords: ['direction', 'control', 'willpower'],
    meaning:
      'Victory comes to those who hold the reins firmly. Focus your drive, harmonise opposing forces, and move forward with conviction.',
  },
  {
    name: 'Strength',
    suit: 'major',
    keywords: ['inner strength', 'bravery', 'compassion', 'focus'],
    meaning:
      'True power is gentle. Meet your fears and your wildness with patience, and you will find a courage that does not need to shout.',
  },
  {
    name: 'The Hermit',
    suit: 'major',
    keywords: ['contemplation', 'search for truth', 'inner guidance'],
    meaning:
      'Step back from the crowd and turn inward. The lantern you seek shines from within, lighting only the next step at a time.',
  },
  {
    name: 'Wheel of Fortune',
    suit: 'major',
    keywords: ['change', 'cycles', 'inevitable fate'],
    meaning:
      'Life turns; what rises will fall and what falls will rise again. Trust the cycle and meet change with an open hand.',
  },
  {
    name: 'Justice',
    suit: 'major',
    keywords: ['cause and effect', 'clarity', 'truth'],
    meaning:
      'Decisions ripple outward and return. Act with honesty and you will find the balance you are looking for.',
  },
  {
    name: 'The Hanged Man',
    suit: 'major',
    keywords: ['sacrifice', 'release', 'martyrdom'],
    meaning:
      'A pause that asks you to surrender control and see things from another angle. What you let go of now opens the way to deeper insight.',
  },
  {
    name: 'Death',
    suit: 'major',
    keywords: ['end of cycle', 'beginnings', 'change', 'metamorphosis'],
    meaning:
      'Something is ending so that something truer can begin. Allow the old form to fall away and trust the transformation underneath.',
  },
  {
    name: 'Temperance',
    suit: 'major',
    keywords: ['middle path', 'patience', 'finding meaning'],
    meaning:
      'Blend, balance, and breathe. Healing arrives through measured steps and the quiet alchemy of patience.',
  },
  {
    name: 'The Devil',
    suit: 'major',
    keywords: ['addiction', 'materialism', 'playfulness'],
    meaning:
      'Notice the chains you are still holding. The shadow only has the power you give it; awareness is the first key.',
  },
  {
    name: 'The Tower',
    suit: 'major',
    keywords: ['sudden upheaval', 'broken pride', 'disaster'],
    meaning:
      'A structure built on shaky truth is being shaken loose. Painful as it is, the lightning clears space for something more honest.',
  },
  {
    name: 'The Star',
    suit: 'major',
    keywords: ['hope', 'faith', 'rejuvenation'],
    meaning:
      'After the storm, a clear sky. Renewal, hope, and a quiet sense that you are guided are returning to you.',
  },
  {
    name: 'The Moon',
    suit: 'major',
    keywords: ['unconscious', 'illusions', 'intuition'],
    meaning:
      'Not everything is what it appears in this dim light. Walk slowly, listen to dreams, and let your intuition lead through the fog.',
  },
  {
    name: 'The Sun',
    suit: 'major',
    keywords: ['joy', 'success', 'celebration', 'positivity'],
    meaning:
      'A radiant, generous yes. Vitality, clarity, and warmth are flowing your way — let yourself enjoy them.',
  },
  {
    name: 'Judgement',
    suit: 'major',
    keywords: ['reflection', 'reckoning', 'awakening'],
    meaning:
      'A call to rise into who you have been becoming. Look back honestly, forgive what you can, and answer the next chapter.',
  },
  {
    name: 'The World',
    suit: 'major',
    keywords: ['fulfillment', 'harmony', 'completion'],
    meaning:
      'A cycle closes in wholeness. Pause to honour what you have built before stepping into the next great circle.',
  },

  // Wands
  {
    name: 'Ace of Wands',
    suit: 'wands',
    keywords: ['creation', 'willpower', 'inspiration', 'desire'],
    meaning:
      'A fresh spark of inspiration is offered to you. Take it in your hand and let your enthusiasm shape what comes next.',
  },
  {
    name: 'Two of Wands',
    suit: 'wands',
    keywords: ['planning', 'making decisions', 'leaving home'],
    meaning:
      'You stand at the edge of familiar ground, surveying wider horizons. Map the route, then commit to the path that calls you.',
  },
  {
    name: 'Three of Wands',
    suit: 'wands',
    keywords: ['looking ahead', 'expansion', 'rapid growth'],
    meaning:
      'Your earlier efforts are beginning to ripple outward. Keep your gaze on the horizon and stay ready for opportunity to arrive.',
  },
  {
    name: 'Four of Wands',
    suit: 'wands',
    keywords: ['community', 'home', 'celebration'],
    meaning:
      'A milestone worth honouring with the people who matter. Joy multiplies when it is shared.',
  },
  {
    name: 'Five of Wands',
    suit: 'wands',
    keywords: ['competition', 'rivalry', 'conflict'],
    meaning:
      'Tensions spar and ideas clash. Engage with the friction honestly — it can sharpen everyone involved.',
  },
  {
    name: 'Six of Wands',
    suit: 'wands',
    keywords: ['victory', 'success', 'public reward'],
    meaning:
      'A win that others see and acknowledge. Receive the recognition with grace and credit those who carried you here.',
  },
  {
    name: 'Seven of Wands',
    suit: 'wands',
    keywords: ['perseverance', 'defensive', 'maintaining control'],
    meaning:
      'You have the higher ground; hold it. Stand by what you believe in even when the pressure mounts.',
  },
  {
    name: 'Eight of Wands',
    suit: 'wands',
    keywords: ['rapid action', 'movement', 'quick decisions'],
    meaning:
      'Things move quickly now — messages, momentum, motion. Stay light on your feet and let progress happen.',
  },
  {
    name: 'Nine of Wands',
    suit: 'wands',
    keywords: ['resilience', 'grit', 'last stand'],
    meaning:
      'Tired but not finished. Gather what strength you have left; you are closer to the end than you think.',
  },
  {
    name: 'Ten of Wands',
    suit: 'wands',
    keywords: ['accomplishment', 'responsibility', 'burden'],
    meaning:
      'You have achieved much, and you are carrying a great deal. Notice what is yours to put down before it weighs you over.',
  },
  {
    name: 'Page of Wands',
    suit: 'wands',
    keywords: ['exploration', 'excitement', 'freedom'],
    meaning:
      'A youthful, eager spark wants to wander. Let curiosity lead and follow wherever the heat of interest takes you.',
  },
  {
    name: 'Knight of Wands',
    suit: 'wands',
    keywords: ['action', 'adventure', 'fearlessness'],
    meaning:
      'Bold, fast, and unafraid. Leap if the cause is true — but remember the destination behind the gallop.',
  },
  {
    name: 'Queen of Wands',
    suit: 'wands',
    keywords: ['courage', 'determination', 'joy'],
    meaning:
      'Warm, magnetic, and unshakably herself. Embody your confidence and others will gather around your fire.',
  },
  {
    name: 'King of Wands',
    suit: 'wands',
    keywords: ['big picture', 'leader', 'overcoming challenges'],
    meaning:
      'A visionary leader who turns ideas into movements. Hold the larger purpose and rally others toward it.',
  },

  // Cups
  {
    name: 'Ace of Cups',
    suit: 'cups',
    keywords: ['new feelings', 'spirituality', 'intuition'],
    meaning:
      'An overflowing cup of love, compassion, and emotional renewal is offered. Open your heart and let the feeling pour through.',
  },
  {
    name: 'Two of Cups',
    suit: 'cups',
    keywords: ['unity', 'partnership', 'connection'],
    meaning:
      'A meeting of equals built on mutual respect. What grows here is grounded in genuine reciprocity.',
  },
  {
    name: 'Three of Cups',
    suit: 'cups',
    keywords: ['friendship', 'community', 'happiness'],
    meaning:
      'Raise a glass with the people who lift you. Belonging is itself a kind of medicine.',
  },
  {
    name: 'Four of Cups',
    suit: 'cups',
    keywords: ['apathy', 'contemplation', 'disconnectedness'],
    meaning:
      'You are looking past a gift already in front of you. Notice what is being offered before turning away in restlessness.',
  },
  {
    name: 'Five of Cups',
    suit: 'cups',
    keywords: ['loss', 'grief', 'self-pity'],
    meaning:
      'Some cups have spilled, and the grief is real. Yet two cups still stand — turn around when you are ready.',
  },
  {
    name: 'Six of Cups',
    suit: 'cups',
    keywords: ['familiarity', 'happy memories', 'healing'],
    meaning:
      'A return to something tender and familiar. Let nostalgia be a doorway, not a place to live.',
  },
  {
    name: 'Seven of Cups',
    suit: 'cups',
    keywords: ['searching for purpose', 'choices', 'daydreaming'],
    meaning:
      'Many shimmering options, not all of them real. Discern which dreams are worth your hands and which are only mist.',
  },
  {
    name: 'Eight of Cups',
    suit: 'cups',
    keywords: ['walking away', 'disillusionment', 'leaving behind'],
    meaning:
      'Something has run its course and you know it. Walking away is not failure when it is in service of what is true.',
  },
  {
    name: 'Nine of Cups',
    suit: 'cups',
    keywords: ['satisfaction', 'emotional stability', 'luxury'],
    meaning:
      'A wish granted; the table is set. Take a moment to feel genuinely content with what you have.',
  },
  {
    name: 'Ten of Cups',
    suit: 'cups',
    keywords: ['inner happiness', 'fulfillment', 'dreams coming true'],
    meaning:
      'A rainbow over the home you have made. Emotional harmony, family, and the quiet joy of belonging.',
  },
  {
    name: 'Page of Cups',
    suit: 'cups',
    keywords: ['happy surprise', 'dreamer', 'sensitivity'],
    meaning:
      'A small message from the heart, perhaps unexpected. Receive it with gentleness and wonder.',
  },
  {
    name: 'Knight of Cups',
    suit: 'cups',
    keywords: ['following the heart', 'idealist', 'romantic'],
    meaning:
      'An offer made in the language of feeling. Follow the heart, and let it temper itself with discernment.',
  },
  {
    name: 'Queen of Cups',
    suit: 'cups',
    keywords: ['compassion', 'calm', 'comfort'],
    meaning:
      'Steady, deep, and emotionally fluent. Hold space for yourself and others with quiet, generous attention.',
  },
  {
    name: 'King of Cups',
    suit: 'cups',
    keywords: ['compassion', 'control', 'balance'],
    meaning:
      'Master of emotional waters: feeling deeply without being swept away. Lead with empathy and steady judgement.',
  },

  // Swords
  {
    name: 'Ace of Swords',
    suit: 'swords',
    keywords: ['breakthrough', 'clarity', 'sharp mind'],
    meaning:
      'A clean cut of truth. Speak the thing precisely and the path forward becomes visible.',
  },
  {
    name: 'Two of Swords',
    suit: 'swords',
    keywords: ['difficult choices', 'indecision', 'stalemate'],
    meaning:
      'You have blindfolded yourself to avoid choosing. Lower the swords, look honestly, and decide from what you actually see.',
  },
  {
    name: 'Three of Swords',
    suit: 'swords',
    keywords: ['heartbreak', 'suffering', 'grief'],
    meaning:
      'Heartbreak and painful loss, a moment when life knocks us down. What determines your future is whether you choose to remain down, or rise again.',
  },
  {
    name: 'Four of Swords',
    suit: 'swords',
    keywords: ['rest', 'restoration', 'contemplation'],
    meaning:
      'Lay your sword aside and rest. Recovery is not a delay; it is part of the work.',
  },
  {
    name: 'Five of Swords',
    suit: 'swords',
    keywords: ['unbridled ambition', 'win at all costs', 'sneakiness'],
    meaning:
      'A win that costs more than it gains. Ask what is truly worth fighting for, and what you would rather walk away from.',
  },
  {
    name: 'Six of Swords',
    suit: 'swords',
    keywords: ['transition', 'leaving behind', 'moving on'],
    meaning:
      'A quiet crossing toward calmer waters. Take only what you need and let the shore behind grow smaller.',
  },
  {
    name: 'Seven of Swords',
    suit: 'swords',
    keywords: ['deception', 'trickery', 'tactics and strategy'],
    meaning:
      'Strategy or sleight of hand is at play. Be honest with yourself about what you are taking — and what is being taken.',
  },
  {
    name: 'Eight of Swords',
    suit: 'swords',
    keywords: ['imprisonment', 'entrapment', 'self-victimization'],
    meaning:
      'The cage is mostly in the mind. Look again — the swords have left an opening, and the blindfold can be removed.',
  },
  {
    name: 'Nine of Swords',
    suit: 'swords',
    keywords: ['anxiety', 'hopelessness', 'trauma'],
    meaning:
      'The 3am card — fear feels enormous in the dark. Daylight tends to right-size what the night exaggerates.',
  },
  {
    name: 'Ten of Swords',
    suit: 'swords',
    keywords: ['failure', 'collapse', 'defeat'],
    meaning:
      'The very bottom — nothing more can fall. From here, the only direction is up; let the worst be over.',
  },
  {
    name: 'Page of Swords',
    suit: 'swords',
    keywords: ['curiosity', 'restlessness', 'mental energy'],
    meaning:
      'A quick, eager mind seeking the next idea. Stay curious, but watch the impulse to speak before listening.',
  },
  {
    name: 'Knight of Swords',
    suit: 'swords',
    keywords: ['action', 'impulsiveness', 'defending beliefs'],
    meaning:
      'Charging forward with conviction. Worth the boldness, but check the direction before the gallop.',
  },
  {
    name: 'Queen of Swords',
    suit: 'swords',
    keywords: ['complexity', 'perceptiveness', 'clear mindedness'],
    meaning:
      'Clear-eyed and unsentimental, shaped by what she has lived through. Speak the truth plainly and with compassion.',
  },
  {
    name: 'King of Swords',
    suit: 'swords',
    keywords: ['head over heart', 'discipline', 'truth'],
    meaning:
      'Authority through reason and integrity. Make decisions on principle, not on mood.',
  },

  // Pentacles
  {
    name: 'Ace of Pentacles',
    suit: 'pentacles',
    keywords: ['opportunity', 'prosperity', 'new venture'],
    meaning:
      'A tangible seed of opportunity, often material or practical. Plant it carefully — what grows here can be lasting.',
  },
  {
    name: 'Two of Pentacles',
    suit: 'pentacles',
    keywords: ['balancing decisions', 'priorities', 'adapting to change'],
    meaning:
      'Juggling commitments with a steady rhythm. Stay light on your feet and the dance will keep working.',
  },
  {
    name: 'Three of Pentacles',
    suit: 'pentacles',
    keywords: ['teamwork', 'collaboration', 'building'],
    meaning:
      'Skilled hands working together produce more than any one alone. Welcome feedback and contribute your craft.',
  },
  {
    name: 'Four of Pentacles',
    suit: 'pentacles',
    keywords: ['conservation', 'frugality', 'security'],
    meaning:
      'Holding tightly to what you have. Some prudence is wise, but a closed fist cannot also receive.',
  },
  {
    name: 'Five of Pentacles',
    suit: 'pentacles',
    keywords: ['need', 'poverty', 'insecurity'],
    meaning:
      'A lean season, easy to feel alone in. Help is often nearer than it appears — look up and ask.',
  },
  {
    name: 'Six of Pentacles',
    suit: 'pentacles',
    keywords: ['charity', 'generosity', 'sharing'],
    meaning:
      'A balanced flow of giving and receiving. Notice which side of the scale you are standing on today.',
  },
  {
    name: 'Seven of Pentacles',
    suit: 'pentacles',
    keywords: ['hard work', 'perseverance', 'diligence'],
    meaning:
      'Pause to assess what your efforts are growing. Patient, steady work is doing more than you can see in a single day.',
  },
  {
    name: 'Eight of Pentacles',
    suit: 'pentacles',
    keywords: ['apprenticeship', 'passion', 'high standards'],
    meaning:
      'Devotion to your craft, refining one detail at a time. Mastery is built quietly through disciplined practice.',
  },
  {
    name: 'Nine of Pentacles',
    suit: 'pentacles',
    keywords: ['fruits of labor', 'rewards', 'luxury'],
    meaning:
      'A garden of your own making, tended into abundance. Enjoy what your discipline has earned.',
  },
  {
    name: 'Ten of Pentacles',
    suit: 'pentacles',
    keywords: ['legacy', 'culmination', 'inheritance'],
    meaning:
      'Lasting prosperity, family, and the structures that outlive a single life. Build with the long view in mind.',
  },
  {
    name: 'Page of Pentacles',
    suit: 'pentacles',
    keywords: ['ambition', 'desire', 'diligence'],
    meaning:
      'A studious beginning, eager to learn the craft. Honour the early hours; they shape everything that follows.',
  },
  {
    name: 'Knight of Pentacles',
    suit: 'pentacles',
    keywords: ['efficiency', 'hard work', 'responsibility'],
    meaning:
      'Slow, steady, and dependable. The unglamorous work, done well, is exactly what the moment needs.',
  },
  {
    name: 'Queen of Pentacles',
    suit: 'pentacles',
    keywords: ['practicality', 'creature comforts', 'financial security'],
    meaning:
      'Grounded, nurturing, and resourceful. Tend home, body, and finances with calm capability.',
  },
  {
    name: 'King of Pentacles',
    suit: 'pentacles',
    keywords: ['abundance', 'prosperity', 'security'],
    meaning:
      'Mastery in the material realm, generous because secure. Steward what you have built so others can prosper too.',
  },
]

export const SUIT_LABELS: Record<TarotSuit, string> = {
  major: 'Major Arcana',
  wands: 'Suit of Wands',
  cups: 'Suit of Cups',
  swords: 'Suit of Swords',
  pentacles: 'Suit of Pentacles',
}

export function drawRandomCard(exclude?: TarotCard | null): TarotCard {
  if (TAROT_DECK.length === 0) throw new Error('Empty deck')
  if (TAROT_DECK.length === 1 || !exclude) {
    return TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)]
  }
  let card = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)]
  while (card.name === exclude.name) {
    card = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)]
  }
  return card
}
