// config.js - Catalogo delle 20 carte e funzioni di generazione mazzo/draft

export const CARD_CATALOG = [
  // --- 10 MOSTRI ---
  { id: 'm1', name: 'Goblin Scout', type: 'monster', level: 1, atk: 1000, cost: 1, desc: 'Un piccolo mostro rapido.' },
  { id: 'm2', name: 'Knight of Valor', type: 'monster', level: 2, atk: 1400, cost: 2, desc: 'Un soldato fedele.' },
  { id: 'm3', name: 'Elven Archer', type: 'monster', level: 3, atk: 1600, cost: 2, desc: 'Colpisce dalla distanza.' },
  { id: 'm4', name: 'Armored Ogre', type: 'monster', level: 4, atk: 1900, cost: 3, desc: 'Pesantemente corazzato.' },
  { id: 'm5', name: 'Flame Mage', type: 'monster', level: 5, atk: 2200, cost: 3, desc: 'Evoca fiamme ardenti.' },
  { id: 'm6', name: 'Royal Guard', type: 'monster', level: 6, atk: 2500, cost: 4, desc: 'Difensore del regno.' },
  { id: 'm7', name: 'Shadow Assassin', type: 'monster', level: 7, atk: 2800, cost: 5, desc: 'Colpisce nell\'ombra.' },
  { id: 'm8', name: 'Ancient Dragon', type: 'monster', level: 8, atk: 3400, cost: 6, desc: 'Una fiera leggendaria.' },
  { id: 'm9', name: 'Titan Golem', type: 'monster', level: 9, atk: 4000, cost: 8, desc: 'Un colosso di pietra.' },
  { id: 'm10', name: 'Lord of Chaos', type: 'monster', level: 10, atk: 5000, cost: 10, desc: 'Distruttore di mondi.' },

  // --- 6 INSTANT ---
  { id: 'i1', name: 'Minor Heal', type: 'instant', effect: 'heal', value: 2, cost: 1, desc: 'Ripristina 2 HP.' },
  { id: 'i2', name: 'Quick Strike', type: 'instant', effect: 'damage', value: 2, cost: 1, desc: 'Infligge 2 danni diretti.' },
  { id: 'i3', name: 'Healing Light', type: 'instant', effect: 'heal', value: 3, cost: 2, desc: 'Ripristina 3 HP.' },
  { id: 'i4', name: 'Fire Bolt', type: 'instant', effect: 'damage', value: 3, cost: 2, desc: 'Infligge 3 danni.' },
  { id: 'i5', name: 'Greater Heal', type: 'instant', effect: 'heal', value: 5, cost: 3, desc: 'Ripristina 5 HP.' },
  { id: 'i6', name: 'Plasma Blast', type: 'instant', effect: 'damage', value: 4, cost: 3, desc: 'Infligge 4 danni.' },

  // --- 4 SORCERY ---
  { id: 's1', name: 'Dark Pact', type: 'sorcery', effect: 'destroy', cost: 3, desc: 'Distrugge un mostro bersaglio.' },
  { id: 's2', name: 'Energy Surge', type: 'sorcery', effect: 'draw', value: 2, cost: 3, desc: 'Pesca 2 carte.' },
  { id: 's3', name: 'Apocalypse', type: 'sorcery', effect: 'wipe', cost: 4, desc: 'Rimuove una minaccia maggiore.' },
  { id: 's4', name: 'Time Warp', type: 'sorcery', effect: 'bonus', cost: 4, desc: 'Manipola il flusso temporale.' }
];

// Genera un mazzo iniziale di 10 carte uniche con costo medio tra 2.5 e 5
export function generateInitialDeck() {
  let deck = [];
  let attempts = 0;
  
  while (attempts < 1000) {
    attempts++;
    // Mescola il catalogo e prendi 10 carte uniche
    const shuffled = [...CARD_CATALOG].sort(() => 0.5 - Math.random());
    const candidate = shuffled.slice(0, 10);
    
    // Calcola il costo totale
    const totalCost = candidate.reduce((sum, card) => sum + card.cost, 0);
    const avgCost = totalCost / candidate.length;
    
    // Verifica che il costo medio sia tra 2.5 e 5 (totale tra 25 e 50)
    if (avgCost >= 2.5 && avgCost <= 5.0) {
      deck = candidate.map(card => ({ ...card, uniqueInstanceId: Math.random().toString(36.substring(2, 9)) }));
      break;
    }
  }
  
  // Fallback di sicurezza se non trova il target perfetto al primo colpo
  if (deck.length === 0) {
    const fallback = [...CARD_CATALOG].sort(() => 0.5 - Math.random()).slice(0, 10);
    deck = fallback.map(card => ({ ...card, uniqueInstanceId: Math.random().toString(36.substring(2, 9)) }));
  }
  
  return deck;
}

// Genera 3 carte per il draft che non siano già presenti nel mazzo del giocatore
export function generateDraftOptions(currentDeck) {
  const deckIds = new Set(currentDeck.map(c => c.id));
  const availablePool = CARD_CATALOG.filter(c => !deckIds.has(c.id));
  
  // Se per qualche motivo il pool è esaurito, prendi comunque dal catalogo generale
  const poolToUse = availablePool.length >= 3 ? availablePool : CARD_CATALOG;
  const shuffled = [...poolToUse].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, 3).map(card => ({ ...card, uniqueInstanceId: Math.random().toString(36.substring(2, 9)) }));
}
