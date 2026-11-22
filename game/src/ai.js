// ai.js — Rook, the AI opponent for Cinder Pact.
// A readable, counterable heuristic: it reacts to life totals, your shield and
// its own momentum, and says why it picked what it picked. No hidden search,
// no lookahead — just rules a player can learn and play around.

(function () {
  'use strict';

  // Pick one card from the AI hand. Returns { card, reason }.
  // ctx: { aiLife, aiShield, playerLife, playerShield, aiPrevSuit, rng }
  function chooseCard(hand, ctx) {
    if (!hand.length) return { card: null, reason: 'Rook has no cards left and passes.' };
    var rng = ctx.rng || Math.random;

    function ofSuit(suit) {
      return hand.filter(function (c) { return c.suit === suit; });
    }
    function highest(cards) {
      var best = cards[0], i;
      for (i = 1; i < cards.length; i++) {
        if (cards[i].value > best.value) best = cards[i];
      }
      return best;
    }
    function highestOf(suit) {
      var cards = ofSuit(suit);
      return cards.length ? highest(cards) : null;
    }
    // Among tied best values, take a random one so play is not fully predictable.
    function pickBest(cards, reason) {
      var top = 0, i;
      for (i = 1; i < cards.length; i++) {
        if (cards[i].value > cards[top].value) top = i;
      }
      var tied = cards.filter(function (c) { return c.value === cards[top].value; });
      var card = tied[Math.floor(rng() * tied.length)];
      return { card: card, reason: reason };
    }

    // 1. Hurt and low: stay alive. Tide shields, Thorn heals through shield.
    if (ctx.aiLife <= 7) {
      var survival = ofSuit('tide').concat(ofSuit('thorn'));
      if (survival.length) {
        return pickBest(survival, 'Rook is hurt (life ' + ctx.aiLife + ') — plays safe to survive.');
      }
    }

    // 2. Your shield is thick: pierce it with Thorn, or smash it with big Flame.
    if (ctx.playerShield >= 6) {
      var pierce = highestOf('thorn');
      if (pierce) {
        return { card: pierce, reason: 'Your shield is ' + ctx.playerShield + ' — Rook leeches straight through it.' };
      }
      var smash = highestOf('flame');
      if (smash && smash.value >= 7) {
        return { card: smash, reason: 'Your shield is ' + ctx.playerShield + ' — Rook brings a heavy Flame to break it.' };
      }
    }

    // 3. Momentum: keep the suit rolling for +2.
    if (ctx.aiPrevSuit) {
      var momentum = highestOf(ctx.aiPrevSuit);
      if (momentum) {
        return { card: momentum, reason: 'Rook keeps its ' + momentum.suit + ' momentum rolling (+2).' };
      }
    }

    // 4. Otherwise: the biggest Flame it holds.
    var flame = highestOf('flame');
    if (flame) {
      return { card: flame, reason: 'Rook attacks with its strongest Flame.' };
    }

    // 5. Fallback: the highest card in hand.
    var best = highest(hand);
    return { card: best, reason: 'Rook plays its highest card.' };
  }

  window.EmberAI = { chooseCard: chooseCard };
})();
