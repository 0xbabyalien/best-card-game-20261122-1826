// deck.js — cards, suits and the deck for Cinder Pact.
// A card is { suit, value, id }. Suits are told apart by colour AND shape,
// never by text alone: Flame ▲ red, Tide ● blue, Thorn ◆ green, Stone ■ amber.

(function () {
  'use strict';

  var SUITS = {
    flame: { key: 'flame', name: 'Flame', glyph: '\u25B2', color: '#e5484d', dark: '#8f1d22', effect: 'Attack', blurb: 'Deal damage. Shield absorbs it first.' },
    tide:  { key: 'tide',  name: 'Tide',  glyph: '\u25CF', color: '#3e8fe0', dark: '#1c4f86', effect: 'Guard',  blurb: 'Gain shield up to 12.' },
    thorn: { key: 'thorn', name: 'Thorn', glyph: '\u25C6', color: '#46a758', dark: '#1f5c2e', effect: 'Leech',  blurb: 'Piercing damage, heal the same.' },
    stone: { key: 'stone', name: 'Stone', glyph: '\u25A0', color: '#e8a13a', dark: '#8a5a12', effect: 'Quarry', blurb: 'Gain shield and draw a card.' }
  };
  var SUIT_KEYS = ['flame', 'tide', 'thorn', 'stone'];

  function suitOf(key) { return SUITS[key]; }

  function makeCard(suit, value) {
    return { suit: suit, value: value, id: suit + '-' + value };
  }

  // The full 40-card deck: four suits, values 1-10.
  function buildDeck() {
    var deck = [];
    var s, v;
    for (s = 0; s < SUIT_KEYS.length; s++) {
      for (v = 1; v <= 10; v++) {
        deck.push(makeCard(SUIT_KEYS[s], v));
      }
    }
    return deck;
  }

  // Small deterministic PRNG (mulberry32) so screenshot states are reproducible.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Fisher-Yates shuffle. Pass a seeded rng for reproducible deals.
  function shuffle(deck, rng) {
    var random = rng || Math.random;
    var i, j, tmp;
    for (i = deck.length - 1; i > 0; i--) {
      j = Math.floor(random() * (i + 1));
      tmp = deck[i]; deck[i] = deck[j]; deck[j] = tmp;
    }
    return deck;
  }

  function drawCard(deck) {
    return deck.length ? deck.pop() : null;
  }

  // Human-readable effect line for a card at a given power.
  function effectText(card, power) {
    if (card.suit === 'flame') return 'Attack ' + power;
    if (card.suit === 'tide') return 'Guard ' + power;
    if (card.suit === 'thorn') return 'Leech ' + Math.ceil(power / 2);
    return 'Quarry ' + Math.ceil(power / 2) + ' + draw';
  }

  window.EmberDeck = {
    SUITS: SUITS, SUIT_KEYS: SUIT_KEYS, suitOf: suitOf,
    makeCard: makeCard, buildDeck: buildDeck, mulberry32: mulberry32,
    shuffle: shuffle, drawCard: drawCard, effectText: effectText
  };
})();
