/* Dynamic card loading and setup rules for Mixxit. */
(function () {
  'use strict';

  const RULES = {
    initialPool: 11,
    openingHand: 4,
    sidePool: 11,
    extraPool: 3,
    draftOptions: 3,
    minInitialMana: 25,
    maxInitialMana: 50,
    minInitialTypes: 3,
    extraType: 'extra'
  };

  const TYPE_LABELS = {
    monster: 'Mostro',
    instant: 'Istantaneo',
    sorcery: 'Stregoneria',
    enchantment: 'Incantesimo',
    extra: 'Mostrissimo',
    structure: 'Struttura',
    equipment: 'Equipaggiamento',
    territory: 'Territorio'
  };

  function shuffle(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  function value(object, ...keys) {
    for (const key of keys) {
      if (object && object[key] !== undefined && object[key] !== null) return object[key];
    }
    return null;
  }

  function normalizeCard(card) {
    const type = String(value(card, 'card_type', 'cardType', 'cardtype', 'type') || '').toLowerCase();
    const rawEffectParameters = value(card, 'effect_parameters', 'effectParameters', 'effectparameters') || {};
    return {
      ...card,
      id: value(card, 'id', 'card_id', 'cardId'),
      code: value(card, 'card_code', 'cardCode', 'cardcode', 'code'),
      name: value(card, 'name') || 'Carta senza nome',
      type,
      typeLabel: TYPE_LABELS[type] || type,
      mana: Number(value(card, 'mana_cost', 'manaCost', 'manacost', 'mana') || 0),
      attack: value(card, 'attack') === null ? null : Number(value(card, 'attack') || 0),
      health: value(card, 'health') === null ? null : Number(value(card, 'health') || 0),
      sacrifices: Number(value(card, 'sacrifice_requirement', 'sacrificeRequirement', 'sacrificerequirement', 'sacrifices') || 0),
      effect: value(card, 'effect_code', 'effectCode', 'effectcode', 'effect') || 'none',
      effectParameters: rawEffectParameters,
      rulesText: value(card, 'rules_text', 'rulesText', 'rulestext', 'text') || '',
      imagePath: value(card, 'image_path', 'imagePath', 'imagepath', 'image') || '',
      engineSupported: value(card, 'engine_supported', 'engineSupported', 'enginesupported') !== false,
      aiSupported: value(card, 'ai_supported', 'aiSupported', 'aisupported') !== false
    };
  }

  function normalCards(cards) {
    return cards.filter(card => card.type !== RULES.extraType);
  }

  function extraCards(cards) {
    return cards.filter(card => card.type === RULES.extraType);
  }

  function manaTotal(cards) {
    return cards.reduce((total, card) => total + Number(card.mana || 0), 0);
  }

  function typeCount(cards) {
    return new Set(cards.map(card => card.type)).size;
  }

  function validInitialPool(cards) {
    const total = manaTotal(cards);
    return cards.length === RULES.initialPool && total >= RULES.minInitialMana && total <= RULES.maxInitialMana && typeCount(cards) >= RULES.minInitialTypes;
  }

  function chooseInitialPool(cards) {
    if (cards.length < RULES.initialPool) throw new Error(`Servono almeno ${RULES.initialPool} carte normali attive.`);
    for (let attempt = 0; attempt < 5000; attempt += 1) {
      const candidate = shuffle(cards).slice(0, RULES.initialPool);
      if (validInitialPool(candidate)) return candidate;
    }
    throw new Error('Non riesco a generare un mazzo iniziale valido con le carte attive disponibili.');
  }

  function chooseSidePool(cards, excludedIds = []) {
    const excluded = new Set(excludedIds);
    const available = cards.filter(card => !excluded.has(card.id));
    if (available.length < RULES.sidePool) throw new Error(`Servono almeno ${RULES.sidePool} carte normali attive per il Side Deck iniziale.`);
    return shuffle(available).slice(0, RULES.sidePool);
  }

  function chooseExtraPool(cards) {
    if (cards.length < RULES.extraPool) throw new Error(`Servono almeno ${RULES.extraPool} Mostrissimi attivi.`);
    return shuffle(cards).slice(0, RULES.extraPool);
  }

  function draftOptions(cards, ownedIds) {
    const owned = new Set(ownedIds || []);
    return shuffle(normalCards(cards).filter(card => !owned.has(card.id))).slice(0, RULES.draftOptions);
  }

  async function loadActiveCards(supabaseClient) {
    if (!supabaseClient) throw new Error('Client Supabase non disponibile.');
    const { data, error } = await supabaseClient
      .from('cards')
      .select(`id, card_code, status, deleted_at, current_version:card_versions!cards_current_version_fk (id, version_number, name, card_type, mana_cost, attack, health, sacrifice_requirement, special_requirement, rules_text, effect_code, effect_parameters, timing, tags, rarity, threat_rating, image_path, image_crop, frame_style, engine_supported, ai_supported)`)
      .eq('status', 'active')
      .is('deleted_at', null);
    if (error) throw error;
    return (data || []).filter(row => row.current_version).map(row => normalizeCard({ ...row.current_version, id: row.current_version.id, card_id: row.id, card_code: row.card_code }));
  }

  window.MixxitCardCatalog = { RULES, TYPE_LABELS, shuffle, normalizeCard, normalCards, extraCards, manaTotal, typeCount, validInitialPool, chooseInitialPool, chooseSidePool, chooseExtraPool, draftOptions, loadActiveCards };
})();