// main.js — bootstrap, screens and deterministic screenshot states for Cinder Pact.
// ?shot=title|play|win|loss renders a fixed seeded board so screenshots are
// reproducible. Without the param the game starts on the title screen.

(function () {
  'use strict';

  var SHOT_SEED = 20261122;

  // Build a fixed mid-game board: life 14 vs 11, shields up, cards on the
  // table, a log with several lines. Hands come from a seeded shuffle, with
  // two cards swapped in so the table matches the log exactly.
  function shotPlayState() {
    var state = EmberGame.newGame(SHOT_SEED);
    state.screen = 'table';
    state.round = 6;
    state.player.life = 14;
    state.player.shield = 4;
    state.ai.life = 11;
    state.ai.shield = 2;
    state.player.prevSuit = 'thorn';
    state.ai.prevSuit = 'thorn';
    // Swaps run on the full deck first; the deck count is staged afterwards.
    // Guarantee the exact cards the log talks about: Thorn 7 in your hand,
    // a Thorn in Rook's hand. Swap with the deck or the other hand so no
    // card is duplicated or lost.
    function swapInto(hand, suit, value) {
      var i, j, tmp;
      var places = [state.player.hand, state.ai.hand, state.deck];
      for (i = 0; i < hand.length; i++) {
        if (hand[i].suit === suit && hand[i].value === value) return hand[i];
      }
      for (i = 0; i < places.length; i++) {
        for (j = 0; j < places[i].length; j++) {
          if (places[i][j].suit === suit && places[i][j].value === value) {
            tmp = hand[0]; hand[0] = places[i][j]; places[i][j] = tmp;
            return hand[0];
          }
        }
      }
      return null;
    }
    var pCard = swapInto(state.player.hand, 'thorn', 7);
    var aCard = null;
    var k;
    for (k = 0; k < state.ai.hand.length; k++) {
      if (state.ai.hand[k].suit === 'thorn') { aCard = state.ai.hand[k]; break; }
    }
    if (!aCard) {
      for (k = 0; k < state.deck.length; k++) {
        if (state.deck[k].suit === 'thorn') {
          var tmp2 = state.ai.hand[0]; state.ai.hand[0] = state.deck[k]; state.deck[k] = tmp2;
          aCard = state.ai.hand[0]; break;
        }
      }
    }
    if (!pCard) pCard = state.player.hand[0];
    if (!aCard) aCard = state.ai.hand[0];
    state.deck = state.deck.slice(0, 22); // stage the deck count at 22
    state.player.hand.splice(state.player.hand.indexOf(pCard), 1);
    state.ai.hand.splice(state.ai.hand.indexOf(aCard), 1);
    state.player.played = pCard;
    state.ai.played = aCard;

    var aPower = aCard.value + 2; // momentum: Rook also played Thorn last round
    state.log = [
      'The pact is sealed. You draw 5 cards; Rook draws 5.',
      'Round 1 — pick a card. Same suit as last round: Momentum +2.',
      'You reveal Flame 8 — Momentum +2 (power 10)',
      'Rook reveals Tide 6',
      'You ▲ Flame 8 hits Rook for 10 — shield absorbs 6.',
      'Rook ● Tide 6 raises shield 0 → 6.',
      '— Round 5 —',
      'Rook: Your shield is 6 — Rook leeches straight through it.',
      'You reveal Thorn 7 — Momentum +2 (power 9)',
      'Rook reveals ' + EmberGame.cardName(aCard) + ' — Momentum +2 (power ' + aPower + ')',
      'You ◆ Thorn 7 leeches 5 straight through shield and heals 5.',
      'Rook ◆ ' + EmberGame.cardName(aCard) + ' leeches ' + Math.ceil(aPower / 2) + ' straight through shield.',
      'Round 6 — pick a card. Same suit as last round: Momentum +2.'
    ];
    state.phase = 'pick';
    state.selected = 1;
    state.stats = { rounds: 5, damageDealt: 23, damageTaken: 11, cardsPlayed: 5, leeched: 9 };
    return state;
  }

  function shotEndState(winner) {
    var state = EmberGame.newGame(SHOT_SEED);
    state.winner = winner;
    state.phase = 'over';
    state.screen = winner === 'player' ? 'win' : 'loss';
    state.round = 9;
    state.stats = { rounds: 9, damageDealt: 24, damageTaken: 17, cardsPlayed: 9, leeched: 6 };
    if (winner === 'player') {
      state.player.life = 6;
      state.ai.life = 0;
      state.log = ['— Round 9 —', 'You reveal Flame 9 — Momentum +2 (power 11)',
        'You ▲ Flame 9 hits Rook for 11.', 'Rook falls to 0 life. The pact is yours.'];
    } else {
      state.player.life = 0;
      state.ai.life = 8;
      state.log = ['— Round 9 —', 'Rook reveals Flame 10',
        'Rook ▲ Flame 10 hits you for 10.', 'Your life reaches 0. Rook takes the pact.'];
    }
    return state;
  }

  function shotState(kind) {
    if (kind === 'play') return shotPlayState();
    if (kind === 'win') return shotEndState('player');
    if (kind === 'loss') return shotEndState('ai');
    return null;
  }

  function bootstrap() {
    var params = new URLSearchParams(window.location.search);
    var shot = params.get('shot');
    var state;
    if (shot) {
      state = shotState(shot);
      if (state) {
        EmberInput.attach(state);
        EmberRender.render(state);
        return;
      }
    }
    // Normal start: title screen, with a fresh game waiting behind it.
    state = EmberGame.newGame();
    state.screen = 'title';
    EmberInput.attach(state);
    EmberRender.render(state);
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
