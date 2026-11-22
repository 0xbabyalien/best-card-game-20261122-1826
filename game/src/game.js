// game.js — the rules and state machine for Cinder Pact.
// One round: draw, both sides pick a card, reveal simultaneously, resolve.
// Momentum: playing the same suit as your previous round adds +2 to the card's
// value before its effect. Life 20 each; first to 0 loses, both at 0 is a draw.

(function () {
  'use strict';

  var START_LIFE = 20;
  var START_HAND = 5;
  var HAND_CAP = 7;
  var SHIELD_CAP = 12;
  var DECK_SIZE = 40;

  function newSide() {
    return { life: START_LIFE, shield: 0, hand: [], prevSuit: null, played: null };
  }

  function newGame(seed) {
    var rng = seed == null ? Math.random : EmberDeck.mulberry32(seed);
    var deck = EmberDeck.shuffle(EmberDeck.buildDeck(), rng);
    var state = {
      screen: 'table',
      phase: 'pick',           // 'pick' | 'revealed' | 'over'
      round: 1,
      deck: deck,
      player: newSide(),
      ai: newSide(),
      log: [],
      selected: -1,
      winner: null,           // 'player' | 'ai' | 'draw' once over
      stats: { rounds: 0, damageDealt: 0, damageTaken: 0, cardsPlayed: 0, leeched: 0 },
      rng: rng
    };
    dealOpeningHands(state);
    addLog(state, 'The pact is sealed. You draw ' + START_HAND + ' cards; Rook draws ' + START_HAND + '.');
    addLog(state, 'Round 1 — pick a card. Same suit as last round: Momentum +2.');
    return state;
  }

  function dealOpeningHands(state) {
    var i;
    for (i = 0; i < START_HAND; i++) {
      state.player.hand.push(EmberDeck.drawCard(state.deck));
      state.ai.hand.push(EmberDeck.drawCard(state.deck));
    }
  }

  function addLog(state, line) {
    state.log.push(line);
    if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
  }

  function cardName(card) {
    if (!card) return '—';
    var suit = EmberDeck.suitOf(card.suit);
    return suit.name + ' ' + card.value;
  }

  function powerOf(state, side, card) {
    var momentum = side.prevSuit && side.prevSuit === card.suit;
    return { power: card.value + (momentum ? 2 : 0), momentum: momentum };
  }

  // Apply one card's effect. Returns a list of log lines.
  function applyEffect(state, actor, target, card, power) {
    var lines = [];
    var suit = EmberDeck.suitOf(card.suit);
    var who = actor === state.player ? 'You' : 'Rook';
    var foe = actor === state.player ? 'Rook' : 'you';
    if (card.suit === 'flame') {
      var remaining = power;
      var absorbed = Math.min(target.shield, remaining);
      if (absorbed > 0) {
        target.shield -= absorbed;
        remaining -= absorbed;
        lines.push(who + ' ' + suit.glyph + ' Flame ' + card.value + ' hits ' + foe + ' for ' + power +
          ' — shield absorbs ' + absorbed + '.');
      } else {
        lines.push(who + ' ' + suit.glyph + ' Flame ' + card.value + ' hits ' + foe + ' for ' + power + '.');
      }
      if (remaining > 0) {
        target.life = Math.max(0, target.life - remaining);
        if (actor === state.player) state.stats.damageDealt += remaining;
        else state.stats.damageTaken += remaining;
      }
    } else if (card.suit === 'tide') {
      var before = actor.shield;
      actor.shield = Math.min(SHIELD_CAP, actor.shield + power);
      lines.push(who + ' ' + suit.glyph + ' Tide ' + card.value + ' raises shield ' + before + ' → ' + actor.shield + '.');
    } else if (card.suit === 'thorn') {
      var leech = Math.ceil(power / 2);
      target.life = Math.max(0, target.life - leech);
      var healed = Math.min(leech, START_LIFE - actor.life);
      actor.life += healed;
      if (actor === state.player) { state.stats.damageDealt += leech; state.stats.leeched += healed; }
      else state.stats.damageTaken += leech;
      lines.push(who + ' ' + suit.glyph + ' Thorn ' + card.value + ' leeches ' + leech +
        ' straight through shield' + (healed > 0 ? ' and heals ' + healed : '') + '.');
    } else if (card.suit === 'stone') {
      var gain = Math.ceil(power / 2);
      var sb = actor.shield;
      actor.shield = Math.min(SHIELD_CAP, actor.shield + gain);
      var drawn = EmberDeck.drawCard(state.deck);
      var drew = '';
      if (drawn) {
        if (actor.hand.length < HAND_CAP) { actor.hand.push(drawn); drew = ' and draws ' + cardName(drawn) + '.'; }
        else drew = ' but the hand is full — the drawn card is lost.';
      } else {
        drew = ' but the deck is empty.';
      }
      lines.push(who + ' ' + suit.glyph + ' Stone ' + card.value + ' quarries ' + gain + ' shield (' + sb + ' → ' + actor.shield + ')' + drew);
    }
    return lines;
  }

  // Draw one card at the start of a round (after round 1), respecting the cap.
  function drawPhase(state) {
    var who = [['player', 'You'], ['ai', 'Rook']];
    var i, side, card;
    for (i = 0; i < who.length; i++) {
      side = state[who[i][0]];
      if (state.deck.length === 0) continue;
      if (side.hand.length >= HAND_CAP) {
        addLog(state, who[i][1] + ' hand is full (' + HAND_CAP + ') — no draw.');
        continue;
      }
      card = EmberDeck.drawCard(state.deck);
      side.hand.push(card);
      if (who[i][0] === 'player') addLog(state, 'You draw ' + cardName(card) + '.');
    }
  }

  // Play the selected card (or pass when the hand is empty). Returns false if
  // no card is selected and the hand is not empty.
  function playSelected(state) {
    if (state.phase !== 'pick' || state.screen !== 'table') return false;
    var card = null;
    if (state.selected >= 0 && state.selected < state.player.hand.length) {
      card = state.player.hand[state.selected];
    } else if (state.player.hand.length > 0) {
      return false;
    }
    return resolveRound(state, card);
  }

  function resolveRound(state, playerCard) {
    var aiChoice = EmberAI.chooseCard(state.ai.hand, {
      aiLife: state.ai.life, aiShield: state.ai.shield,
      playerLife: state.player.life, playerShield: state.player.shield,
      aiPrevSuit: state.ai.prevSuit, rng: state.rng
    });
    var aiCard = aiChoice.card;

    // Remove the played cards from the hands.
    if (playerCard) {
      state.player.hand.splice(state.player.hand.indexOf(playerCard), 1);
    }
    if (aiCard) {
      state.ai.hand.splice(state.ai.hand.indexOf(aiCard), 1);
    }
    state.player.played = playerCard;
    state.ai.played = aiCard;
    state.phase = 'revealed';
    state.stats.rounds = state.round;
    if (playerCard) state.stats.cardsPlayed++;

    addLog(state, '— Round ' + state.round + ' —');
    addLog(state, 'Rook: ' + aiChoice.reason);

    var pPower = playerCard ? powerOf(state, state.player, playerCard) : null;
    var aPower = aiCard ? powerOf(state, state.ai, aiCard) : null;

    addLog(state, 'You reveal ' + (playerCard ? cardName(playerCard) + (pPower.momentum ? ' — Momentum +2 (power ' + pPower.power + ')' : '') : 'nothing — you pass.'));
    addLog(state, 'Rook reveals ' + (aiCard ? cardName(aiCard) + (aPower.momentum ? ' — Momentum +2 (power ' + aPower.power + ')' : '') : 'nothing — Rook passes.'));

    // Simultaneous reveal: both effects resolve, then deaths are judged.
    if (playerCard) {
      applyEffect(state, state.player, state.ai, playerCard, pPower.power).forEach(function (l) { addLog(state, l); });
      state.player.prevSuit = playerCard.suit;
    }
    if (aiCard) {
      applyEffect(state, state.ai, state.player, aiCard, aPower.power).forEach(function (l) { addLog(state, l); });
      state.ai.prevSuit = aiCard.suit;
    }

    state.selected = -1;
    return finishRound(state);
  }

  function finishRound(state) {
    var pDead = state.player.life <= 0;
    var aDead = state.ai.life <= 0;
    var deckEmpty = state.deck.length === 0;
    var handsEmpty = state.player.hand.length === 0 && state.ai.hand.length === 0;

    if (pDead && aDead) return endGame(state, 'draw', 'Both fall in the same round — a draw.');
    if (aDead) return endGame(state, 'player', 'Rook falls to 0 life. The pact is yours.');
    if (pDead) return endGame(state, 'ai', 'Your life reaches 0. Rook takes the pact.');
    if (deckEmpty && handsEmpty) {
      if (state.player.life > state.ai.life) return endGame(state, 'player', 'Hands empty — higher life wins.');
      if (state.ai.life > state.player.life) return endGame(state, 'ai', 'Hands empty — higher life wins.');
      return endGame(state, 'draw', 'Hands empty and life tied — a draw.');
    }

    state.round++;
    state.phase = 'pick';
    if (state.round > 1) drawPhase(state);
    addLog(state, 'Round ' + state.round + ' — pick a card.');
    return true;
  }

  function endGame(state, winner, line) {
    state.winner = winner;
    state.phase = 'over';
    state.screen = winner === 'player' ? 'win' : winner === 'ai' ? 'loss' : 'draw';
    addLog(state, line);
    return true;
  }

  window.EmberGame = {
    START_LIFE: START_LIFE, START_HAND: START_HAND, HAND_CAP: HAND_CAP,
    SHIELD_CAP: SHIELD_CAP, DECK_SIZE: DECK_SIZE,
    newGame: newGame, playSelected: playSelected, addLog: addLog,
    cardName: cardName, powerOf: powerOf
  };
})();
