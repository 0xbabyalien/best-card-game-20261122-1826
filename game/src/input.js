// input.js — mouse and keyboard input for Cinder Pact.
// Keys: 1-7 select a card, Enter/Space play it, N new game, H help, Esc title.
// Mouse: click a card to select it, click Play (or double-click the card).

(function () {
  'use strict';

  var state = null;

  function attach(s) {
    state = s;
    document.getElementById('play-btn').addEventListener('click', playCard);
    document.getElementById('new-game-btn').addEventListener('click', function () { newGame(); });
    document.getElementById('title-btn').addEventListener('click', function () { toTitle(); });
    document.getElementById('help-btn').addEventListener('click', function () { toHelp(); });
    document.getElementById('help-close-btn').addEventListener('click', function () { backFromHelp(); });
    document.getElementById('start-btn').addEventListener('click', function () { newGame(); });
    document.getElementById('howto-btn').addEventListener('click', function () { toHelp(); });
    document.getElementById('end-new-btn').addEventListener('click', function () { newGame(); });
    document.getElementById('end-title-btn').addEventListener('click', function () { toTitle(); });
    document.addEventListener('keydown', onKey);
  }

  function selectCard(idx) {
    if (!state || state.screen !== 'table' || state.phase !== 'pick') return;
    if (idx < 0 || idx >= state.player.hand.length) return;
    state.selected = idx;
    EmberRender.renderTable(state);
  }

  function playCard() {
    if (!state) return;
    if (state.screen !== 'table') return;
    if (EmberGame.playSelected(state)) {
      EmberRender.render(state);
    }
  }

  function newGame() {
    state = EmberGame.newGame();
    EmberRender.render(state);
  }

  function toTitle() {
    if (!state) state = EmberGame.newGame();
    state.screen = 'title';
    EmberRender.render(state);
  }

  function toHelp() {
    if (!state) state = EmberGame.newGame();
    state._returnScreen = state.screen;
    state.screen = 'help';
    EmberRender.render(state);
  }

  function backFromHelp() {
    if (!state) return;
    state.screen = state._returnScreen === 'help' ? 'title' : (state._returnScreen || 'title');
    EmberRender.render(state);
  }

  function onKey(e) {
    if (!state) return;
    var k = e.key;
    if (k >= '1' && k <= '7') {
      selectCard(parseInt(k, 10) - 1);
      e.preventDefault();
    } else if (k === 'Enter' || k === ' ') {
      if (state.screen === 'table') { playCard(); e.preventDefault(); }
      else if (state.screen === 'title') { newGame(); e.preventDefault(); }
    } else if (k === 'n' || k === 'N') {
      newGame();
    } else if (k === 'h' || k === 'H') {
      if (state.screen === 'help') backFromHelp(); else toHelp();
    } else if (k === 'Escape') {
      if (state.screen === 'help') backFromHelp(); else toTitle();
    }
  }

  window.EmberInput = {
    attach: attach, selectCard: selectCard, playCard: playCard,
    newGame: newGame, toTitle: toTitle, toHelp: toHelp
  };
})();
