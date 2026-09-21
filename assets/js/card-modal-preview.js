/* Card preview modal for Mixxit. Uses #modal from game.html. */
(function () {
  'use strict';

  const LABELS = {
    monster: 'Mostro',
    instant: 'Istantaneo',
    sorcery: 'Stregoneria',
    enchantment: 'Incantesimo',
    extra: 'Mostrissimo'
  };

  function label(card) {
    return LABELS[card?.type] || card?.type || 'Carta';
  }

  function close() {
    const modal = document.getElementById('modal');
    const standard = document.getElementById('standardDialog');
    const preview = document.getElementById('cardDialog');
    if (modal) modal.classList.remove('open');
    if (standard) standard.hidden = false;
    if (preview) preview.hidden = true;
  }

  function open(card, onConfirm, options = {}) {
    const modal = document.getElementById('modal');
    const standard = document.getElementById('standardDialog');
    const preview = document.getElementById('cardDialog');
    if (!modal || !standard || !preview) return;

    standard.hidden = true;
    preview.hidden = false;

    document.getElementById('cardPreviewTitle').textContent = card.name || 'Carta';
    document.getElementById('cardPreviewType').textContent = `${label(card)} · ${Number(card.mana ?? card.mana_cost ?? 0)} mana`;
    document.getElementById('cardPreviewStats').textContent = card.type === 'extra'
      ? `✨ ${Number(card.sacrifices ?? card.sacrifice_requirement ?? 0)} sacrifici`
      : card.attack != null || card.health != null
        ? `⚔ ${card.attack ?? 0} · 🛡 ${card.health ?? 0}`
        : '';
    document.getElementById('cardPreviewRules').textContent = card.rulesText || card.rules_text || 'Nessun effetto.';

    const art = document.getElementById('cardPreviewArt');
    art.textContent = '✦';
    const image = card.imageUrl || card.image_path || card.imagePath || '';
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = card.name || 'Illustrazione carta';
      art.textContent = '';
      art.appendChild(img);
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

  window.MixxitCardPreview = { open, close, label };
})();