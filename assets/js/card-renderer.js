window.PenombraCards = {
  getFrameClass(cardType) {
    const frames = {
      monster: 'frame-monster',
      extra: 'frame-extra',
      sorcery: 'frame-sorcery',
      instant: 'frame-instant',
      structure: 'frame-structure',
      equipment: 'frame-equipment',
      territory: 'frame-territory'
    };

    return frames[cardType] || 'frame-monster';
  },

  getTypeLabel(cardType) {
    const labels = {
      monster: 'Mostro',
      extra: 'Extra Deck',
      sorcery: 'Stregoneria',
      instant: 'Istantaneo',
      structure: 'Struttura',
      equipment: 'Equipaggiamento',
      territory: 'Territorio'
    };

    return labels[cardType] || cardType;
  },

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  },

  render(card, options = {}) {
    const isMonster = ['monster', 'extra'].includes(card.card_type);

    const typeLabel = this.getTypeLabel(card.card_type);

    const frameClass = this.getFrameClass(card.card_type);

    const imageUrl = options.imageUrl || card.image_url || '';

    const interactive = options.interactive
      ? 'is-interactive'
      : '';

    const version = card.version_number
      ? `v${card.version_number}`
      : '';

    return `
      <article
        class="penumombra-card ${frameClass} ${interactive}"
        data-card-id="${card.card_id || card.id || ''}"
      >
        <header class="penumombra-card__header">
          <div class="penumombra-card__name">
            ${this.escapeHtml(card.name)}
          </div>

          <div class="penumombra-card__mana">
            💎 ${card.mana_cost ?? 0}
          </div>
        </header>

        <div class="penumombra-card__type">
          ${typeLabel}${card.rarity ? ` · ${this.escapeHtml(card.rarity)}` : ''}
        </div>

        <div class="penumombra-card__art">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${this.escapeHtml(card.name)}">`
              : `
                <div class="penumombra-card__art-placeholder">
                  ✦
                  <span>Illustrazione</span>
                </div>
              `
          }
        </div>

        <div class="penumombra-card__rules">
          ${this.escapeHtml(card.rules_text || 'Nessun testo effetto.')}
        </div>

        ${
          isMonster
            ? `
              <footer class="penumombra-card__footer">
                <div class="penumombra-card__stat">
                  ⚔ <strong>${card.attack ?? 0}</strong>
                </div>

                <div class="penumombra-card__code">
                  ${this.escapeHtml(card.card_code || '')} ${version}
                </div>

                <div class="penumombra-card__stat">
                  🛡 <strong>${card.health ?? 0}</strong>
                </div>
              </footer>
            `
            : `
              <footer class="penumombra-card__footer penumombra-card__footer--spell">
                <div class="penumombra-card__code">
                  ${this.escapeHtml(card.card_code || '')} ${version}
                </div>
              </footer>
            `
        }
      </article>
    `;
  }
};
