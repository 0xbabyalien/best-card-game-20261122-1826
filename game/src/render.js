// render.js — DOM rendering for Cinder Pact.
// Cards are real DOM, not canvas: big readable rank + suit glyph, colour-coded,
// so the table stays legible even at thumbnail size.

(function () {
  'use strict';

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function suitClass(suit) { return 'suit-' + suit; }

  // One face-up card. opts: { small, selected, faceDown, disabled }
  function cardElement(card, opts) {
    opts = opts || {};
    var node = el('div', 'card ' + (opts.small ? 'card-small ' : '') + (opts.selected ? 'selected ' : '') + (opts.disabled ? 'disabled ' : ''));
    if (opts.faceDown || !card) {
      node.classList.add('card-back');
      var ember = el('div', 'card-back-mark', '\u25B2');
      node.appendChild(ember);
      node.appendChild(el('div', 'card-back-word', 'CINDER'));
      return node;
    }
    var suit = EmberDeck.suitOf(card.suit);
    node.classList.add(suitClass(card.suit));
    node.style.setProperty('--suit', suit.color);
    node.style.setProperty('--suit-dark', suit.dark);
    var top = el('div', 'card-corner');
    top.appendChild(el('span', 'card-rank', String(card.value)));
    top.appendChild(el('span', 'card-glyph', suit.glyph));
    node.appendChild(top);
    node.appendChild(el('div', 'card-big-glyph', suit.glyph));
    node.appendChild(el('div', 'card-name', suit.name));
    node.appendChild(el('div', 'card-effect', EmberDeck.effectText(card, card.value)));
    node.setAttribute('data-card-id', card.id);
    return node;
  }

  function lifeBar(side, label) {
    var wrap = el('div', 'life-wrap');
    var head = el('div', 'life-head');
    head.appendChild(el('span', 'life-name', label));
    head.appendChild(el('span', 'life-num', side.life + ' / 20'));
    wrap.appendChild(head);
    var bar = el('div', 'life-bar');
    var fill = el('div', 'life-fill');
    fill.style.width = Math.max(0, side.life / 20 * 100) + '%';
    if (side.life <= 7) fill.classList.add('low');
    bar.appendChild(fill);
    wrap.appendChild(bar);
    var shield = el('div', 'shield-line');
    var pips = '';
    var i;
    for (i = 0; i < 12; i++) pips += i < side.shield ? '\u25C6' : '\u25C7';
    shield.appendChild(el('span', 'shield-label', 'Shield ' + side.shield));
    shield.appendChild(el('span', 'shield-pips', pips));
    wrap.appendChild(shield);
    return wrap;
  }

  function renderLog(state) {
    ['log', 'log-end'].forEach(function (id) {
      var box = document.getElementById(id);
      if (!box) return;
      box.innerHTML = '';
      var lines = state.log.slice(-9);
      lines.forEach(function (line) {
        box.appendChild(el('div', 'log-line', line));
      });
      box.scrollTop = box.scrollHeight;
    });
  }

  function renderTable(state) {
    // Opponent row: life, face-down hand with count.
    var opp = document.getElementById('opp-area');
    opp.innerHTML = '';
    opp.appendChild(lifeBar(state.ai, 'ROOK — the rival'));
    var oppHand = el('div', 'opp-hand');
    var i, shown = Math.min(state.ai.hand.length, 7);
    for (i = 0; i < shown; i++) oppHand.appendChild(cardElement(null, { small: true, faceDown: true }));
    oppHand.appendChild(el('div', 'hand-count', state.ai.hand.length + ' cards'));
    opp.appendChild(oppHand);

    // Centre: the played cards.
    var centre = document.getElementById('centre-area');
    centre.innerHTML = '';
    var pPlayed = el('div', 'played-slot');
    pPlayed.appendChild(el('div', 'played-label', 'ROOK PLAYED'));
    pPlayed.appendChild(cardElement(state.ai.played, { small: false }));
    centre.appendChild(pPlayed);
    var vs = el('div', 'versus', 'VS');
    centre.appendChild(vs);
    var yPlayed = el('div', 'played-slot');
    yPlayed.appendChild(el('div', 'played-label', 'YOU PLAYED'));
    yPlayed.appendChild(cardElement(state.player.played, { small: false }));
    centre.appendChild(yPlayed);

    // Player row: life + hand.
    var you = document.getElementById('you-area');
    you.innerHTML = '';
    you.appendChild(lifeBar(state.player, 'YOU'));
    var hand = el('div', 'hand');
    state.player.hand.forEach(function (card, idx) {
      var node = cardElement(card, { selected: idx === state.selected });
      node.addEventListener('click', function () { window.EmberInput.selectCard(idx); });
      node.addEventListener('dblclick', function () {
        window.EmberInput.selectCard(idx);
        window.EmberInput.playCard();
      });
      hand.appendChild(node);
    });
    if (state.player.hand.length === 0) {
      hand.appendChild(el('div', 'hand-empty', 'No cards — press Play to pass.'));
    }
    you.appendChild(hand);

    // Meta row: round, deck, momentum hints.
    document.getElementById('round-label').textContent = 'Round ' + state.round;
    document.getElementById('deck-label').textContent = 'Deck: ' + state.deck.length + ' / 40';
    var hint = '';
    if (state.player.prevSuit) {
      var s = EmberDeck.suitOf(state.player.prevSuit);
      hint = 'Momentum: play ' + s.name + ' ' + s.glyph + ' again for +2';
    }
    document.getElementById('momentum-label').textContent = hint;

    var playBtn = document.getElementById('play-btn');
    playBtn.disabled = state.phase !== 'pick';
    playBtn.textContent = state.player.hand.length === 0 ? 'Pass' : 'Play Card';

    renderLog(state);
  }

  function renderEnd(state) {
    var title = document.getElementById('end-title');
    var sub = document.getElementById('end-sub');
    if (state.winner === 'player') {
      title.textContent = 'YOU WIN THE PACT';
      title.className = 'end-title win';
      sub.textContent = 'Rook falls. The embers are yours.';
    } else if (state.winner === 'ai') {
      title.textContent = 'ROOK WINS';
      title.className = 'end-title loss';
      sub.textContent = 'Your life reaches 0. The pact slips away.';
    } else {
      title.textContent = 'A DRAW';
      title.className = 'end-title draw';
      sub.textContent = 'Neither side yields. The pact holds, for now.';
    }
    var stats = document.getElementById('end-stats');
    stats.innerHTML = '';
    var rows = [
      ['Rounds played', String(state.stats.rounds)],
      ['Damage you dealt', String(state.stats.damageDealt)],
      ['Damage you took', String(state.stats.damageTaken)],
      ['Cards you played', String(state.stats.cardsPlayed)],
      ['Life healed by leech', String(state.stats.leeched)],
      ['Your life', state.player.life + ' — Rook: ' + state.ai.life]
    ];
    rows.forEach(function (r) {
      var row = el('div', 'stat-row');
      row.appendChild(el('span', 'stat-key', r[0]));
      row.appendChild(el('span', 'stat-val', r[1]));
      stats.appendChild(row);
    });
    renderLog(state);
  }

  function showScreen(name) {
    var screens = ['title', 'table', 'end', 'help'];
    screens.forEach(function (s) {
      document.getElementById('screen-' + s).classList.toggle('hidden', s !== name);
    });
  }

  function render(state) {
    if (state.screen === 'title') { showScreen('title'); return; }
    if (state.screen === 'help') { showScreen('help'); return; }
    if (state.screen === 'table') { showScreen('table'); renderTable(state); return; }
    showScreen('end');
    renderEnd(state);
  }

  window.EmberRender = {
    render: render, renderTable: renderTable, renderEnd: renderEnd,
    showScreen: showScreen, cardElement: cardElement
  };
})();
