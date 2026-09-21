/* Reusable card preview modal for Mixxit. */
(function () {
  'use strict';

  const LABELS = {
    monster: 'Mostro',
    instant: 'Istantaneo',
    sorcery: 'Stregoneria',
    enchantment: 'Incantesimo',
    extra: 'Mostrissimo'
  };

  function escape(value) {
    const node = document.createElement('span');
    node.textContent = value == null ? '' : String(value);
    return node.innerHTML;
  }

  function label(card) {
    return LABELS[card?.type] || card?.type || 'Carta';
  }

  function open(card, onConfirm, options = {}) {
    const modal = document.getElementById('cardPreviewModal');
    if (!modal) return;

    const image = card.imageUrl || card.image_path || card.imagePath || '';
    const stats = card.type === 'extra'
      ? `✨ ${Number(card.sacrifices ?? card.sacrifice_requirement ?? 0)} sacrifici`
      : card.attack != null || card.health != null
        ? `⚔ ${card.attack ?? 0} · 🛡 ${card.health ?? 0}`
        : '';

    document.getElementById('cardPreviewTitle').textContent = card.name || 'Carta';
    document.getElementById('cardPreviewType').textContent = `${label(card)} · ${Number(card.mana ?? card.mana_cost ?? 0)} mana`;
    document.getElementById('cardPreviewStats').textContent = stats;
    document.getElementById('cardPreviewRules').textContent = card.rulesText || card.rules_text || 'Nessun effetto.';

    const art = document.getElementById('cardPreviewArt');
    art.innerHTML = '';
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = card.name || 'Illustrazione carta';
      art.appendChild(img);
    } else {
      art.textContent = '✦';
    }

    const confirm = document.getElementById('cardPreviewConfirm');
    confirm.textContent = options.confirmText || 'Gioca carta';
    confirm.disabled = Boolean(options.disabled);
    confirm.onclick = () => {
      close();
      if (typeof onConfirm === 'function') onConfirm(card);
    };

    document.getElementById('cardPreviewCancel').onclick = close;
    modal.classList.add('open');
  }

  function close() {
    const modal = document.getElementById('cardPreviewModal');
    if (modal) modal.classList.remove('open');
  }

  window.MixxitCardPreview = { open, close, escape, label };
})();