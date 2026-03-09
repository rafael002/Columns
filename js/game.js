(function () {
  if (typeof CONFIG === 'undefined') {
    console.error('CONFIG não está definido!'); return;
  }
  if (typeof Board === 'undefined' || typeof Piece === 'undefined' || typeof Screen === 'undefined') {
    console.error('Classes não estão definidas!'); return;
  }

  // ── Áudio ──────────────────────────────────────────────────────────────────

  // ── Settings ──────────────────────────────────────────────────────────────

  const _settings = { musicVolume: 0.7, sfxVolume: 0.7, musicMuted: false, sfxMuted: false };

  function loadSettings() {
    _settings.musicVolume = parseFloat(localStorage.getItem('columns_music_vol') ?? '0.7');
    _settings.sfxVolume   = parseFloat(localStorage.getItem('columns_sfx_vol')   ?? '0.7');
    _settings.musicMuted  = localStorage.getItem('columns_music_muted') === 'true';
    _settings.sfxMuted    = localStorage.getItem('columns_sfx_muted')   === 'true';
  }

  function saveSettings() {
    localStorage.setItem('columns_music_vol',   _settings.musicVolume);
    localStorage.setItem('columns_sfx_vol',     _settings.sfxVolume);
    localStorage.setItem('columns_music_muted', _settings.musicMuted);
    localStorage.setItem('columns_sfx_muted',   _settings.sfxMuted);
  }

  function applyMusicSettings(audio) {
    if (!audio) return;
    audio.muted  = _settings.musicMuted;
    audio.volume = _settings.musicVolume;
  }

  function applyMusicSettingsToAll() {
    applyMusicSettings(_menuAudio);
    applyMusicSettings(_musicAudio);
    applyMusicSettings(_gameOverAudio);
  }

  const _SVG_SOUND_ON  = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  const _SVG_SOUND_OFF = `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

  function updateMuteBtn(id, muted) {
    const btn = document.getElementById(id);
    btn.innerHTML = muted ? _SVG_SOUND_OFF : _SVG_SOUND_ON;
    btn.classList.toggle('muted', muted);
  }

  function initSettingsUI() {
    const musicVal = Math.round(_settings.musicVolume * 100);
    const sfxVal   = Math.round(_settings.sfxVolume   * 100);
    document.getElementById('slider-music').value = musicVal;
    document.getElementById('slider-sfx').value   = sfxVal;
    document.getElementById('val-music').textContent = musicVal;
    document.getElementById('val-sfx').textContent   = sfxVal;
    updateMuteBtn('btn-mute-music', _settings.musicMuted);
    updateMuteBtn('btn-mute-sfx',   _settings.sfxMuted);

    document.getElementById('slider-music').addEventListener('input', e => {
      _settings.musicVolume = e.target.value / 100;
      document.getElementById('val-music').textContent = e.target.value;
      applyMusicSettingsToAll();
      saveSettings();
    });

    document.getElementById('slider-sfx').addEventListener('input', e => {
      _settings.sfxVolume = e.target.value / 100;
      document.getElementById('val-sfx').textContent = e.target.value;
      saveSettings();
    });

    document.getElementById('btn-mute-music').addEventListener('click', () => {
      _settings.musicMuted = !_settings.musicMuted;
      updateMuteBtn('btn-mute-music', _settings.musicMuted);
      applyMusicSettingsToAll();
      saveSettings();
    });

    document.getElementById('btn-mute-sfx').addEventListener('click', () => {
      _settings.sfxMuted = !_settings.sfxMuted;
      updateMuteBtn('btn-mute-sfx', _settings.sfxMuted);
      saveSettings();
    });
  }

  loadSettings();
  initSettingsUI();

  // ── Áudio ──────────────────────────────────────────────────────────────────

  let _rm = null;
  let _menuAudio = null;
  let _musicAudio = null;
  let _gameOverAudio = null;

  fetch('js/config/resources.json')
    .then(r => r.json())
    .then(config => {
      _rm = new ResourceManager(config);
      return Promise.all([
        _rm.loadResource('audio', 'music_lathesis'),
        _rm.loadResource('audio', 'music_game_start'),
        _rm.loadResource('audio', 'music_clotho'),
        _rm.loadResource('audio', 'music_game_over'),
        _rm.loadResource('audio', 'sfx_shuffle'),
        _rm.loadResource('audio', 'sfx_click'),
        _rm.loadResource('audio', 'sfx_drop'),
        _rm.loadResource('audio', 'sfx_match'),
        _rm.loadResource('audio', 'sfx_level_up'),
      ]);
    })
    .catch(err => console.warn('Erro ao carregar áudio:', err));

  function getCountdownDuration() {
    const res = _rm?.get('audio', 'music_game_start');
    const dur = res?.audio?.duration;
    return (dur && isFinite(dur)) ? Math.round(dur * 1000) : 3700;
  }

  function startMenuMusic() {
    const res = _rm?.get('audio', 'music_lathesis');
    if (!res?.audio) return;
    _menuAudio = res.audio;
    applyMusicSettings(_menuAudio);
    _menuAudio.currentTime = 0;
    _menuAudio.play().catch(() => {});
  }

  function stopMenuMusic() {
    if (_menuAudio) {
      _menuAudio.pause();
      _menuAudio.currentTime = 0;
      _menuAudio = null;
    }
  }

  function playCountdownMusic() {
    stopGameOverMusic();
    const a = _rm?.playSound('music_game_start');
    applyMusicSettings(a);
  }

  function startGameMusic() {
    stopMusic();
    _musicAudio = _rm?.playSound('music_clotho');
    applyMusicSettings(_musicAudio);
  }

  function pauseMusic() {
    if (_musicAudio) _musicAudio.pause();
  }

  function resumeMusic() {
    if (_musicAudio) _musicAudio.play().catch(() => {});
  }

  function stopMusic() {
    if (_musicAudio) {
      _musicAudio.pause();
      _musicAudio.currentTime = 0;
      _musicAudio = null;
    }
  }

  function playGameOverMusic() {
    stopGameOverMusic();
    stopMusic();
    _gameOverAudio = _rm?.playSound('music_game_over');
    applyMusicSettings(_gameOverAudio);
  }

  function stopGameOverMusic() {
    if (_gameOverAudio) {
      _gameOverAudio.pause();
      _gameOverAudio.currentTime = 0;
      _gameOverAudio = null;
    }
  }

  function playSfx(key) {
    if (_settings.sfxMuted) return;
    const audio = _rm?.playSound(key);
    if (audio) audio.volume = _settings.sfxVolume;
  }

  function playSfxThen(key, callback) {
    if (_settings.sfxMuted) { callback(); return; }
    const audio = _rm?.playSound(key);
    if (!audio) { callback(); return; }
    audio.volume = _settings.sfxVolume;
    audio.addEventListener('ended', callback, { once: true });
  }

  // SFX: shuffle para o jogador 1 (SPACE)
  window.addEventListener('keydown', e => {
    if (e.keyCode !== CONFIG.KEYS.SPACE) return;
    if (!window.game || window.game.gameOver) return;
    playSfx('sfx_shuffle');
  });

  // ── Navegação entre telas ──────────────────────────────────────────────────

  function showGame() {
    stopMenuMusic();
    document.getElementById('game-wrapper').style.display = 'flex';
  }

  function goToMenu() {
    stopMusic();
    stopGameOverMusic();

    // Para os loops de todos os jogos ativos
    [window.game, window.game2].forEach(g => {
      if (!g) return;
      clearInterval(g._updateLoopId);
      g._updateLoopId = null;
      g.gameOver = true;
      g.isGameOverAnimating = false;
      g._countdownGen++;
    });
    window.game = null;
    window.game2 = null;

    // Reseta a UI do jogo
    document.getElementById('game-over').classList.remove('visible', 'paused', 'confirming');
    document.getElementById('board-wrapper-p2').style.display = 'none';
    document.getElementById('side-panel-p2').style.display = 'none';
    document.getElementById('main-area').classList.remove('two-player');
    document.getElementById('game-wrapper').style.display = 'none';
    document.getElementById('btn-start').style.display = '';
    document.getElementById('press-start-hint').style.display = '';
    document.getElementById('main-nav').style.display = 'none';
    startMenuMusic();
  }

  // ── Confirmação de saída ───────────────────────────────────────────────────

  let _savedOverlayClasses = '';
  let _pausedByConfirm     = false;

  function showConfirm() {
    if (window.game?._duringCountdown) return;
    const overlay = document.getElementById('game-over');

    // Salva estado atual do overlay para restaurar se cancelar
    _savedOverlayClasses = overlay.className;

    // Pausa silenciosamente se o jogo estiver rodando
    _pausedByConfirm = false;
    if (window.game && !window.game.gameOver && !window.game.isPaused) {
      window.game.pauseSilent();
      window.game2?.pauseSilent();
      pauseMusic();
      _pausedByConfirm = true;
    }

    document.getElementById('modal-title').textContent = 'DESEJA REALMENTE SAIR?';
    overlay.className = 'game-over visible confirming';
  }

  function cancelConfirm() {
    const overlay = document.getElementById('game-over');
    overlay.className = _savedOverlayClasses;

    if (_pausedByConfirm) {
      window.game?.resumeSilent();
      window.game2?.resumeSilent();
      resumeMusic();
      _pausedByConfirm = false;
    }
  }

  document.getElementById('btn-back-to-menu').addEventListener('click', () => {
    playSfxThen('sfx_click', showConfirm);
  });
  document.getElementById('btn-confirm-yes').addEventListener('click', () => {
    playSfxThen('sfx_click', goToMenu);
  });
  document.getElementById('btn-confirm-no').addEventListener('click', () => {
    playSfxThen('sfx_click', cancelConfirm);
  });
  document.getElementById('retry-btn')?.addEventListener('click', () => {
    playSfx('sfx_click');
  });

  // ── Confirmação de saída da página ────────────────────────────────────────

  window.addEventListener('beforeunload', (e) => {
    if (!window.game || window.game.gameOver) return;

    // Pausa o(s) jogo(s) antes do diálogo nativo do navegador aparecer
    if (!window.game.isPaused) window.game.togglePause();
    if (window.game2 && !window.game2.isPaused) window.game2.togglePause();

    e.preventDefault();
    e.returnValue = '';
  });

  // ── Settings ──────────────────────────────────────────────────────────────

  document.getElementById('btn-settings').addEventListener('click', () => {
    playSfxThen('sfx_click', () => {
      document.getElementById('screen-menu').style.display = 'none';
      document.getElementById('screen-settings').style.display = 'flex';
    });
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    playSfxThen('sfx_click', () => {
      document.getElementById('screen-settings').style.display = 'none';
      document.getElementById('screen-menu').style.display = 'flex';
    });
  });

  // ── Start ─────────────────────────────────────────────────────────────────

  document.getElementById('btn-start').addEventListener('click', () => {
    startMenuMusic();
    playSfxThen('sfx_click', () => {
      document.getElementById('btn-start').style.display = 'none';
      document.getElementById('press-start-hint').style.display = 'none';
      document.getElementById('main-nav').style.display = '';
    });
  });

  // ── Modos de jogo ─────────────────────────────────────────────────────────

  function makeGameOptions(extraOpts = {}) {
    return {
      countdownDuration: getCountdownDuration(),
      onCountdownStart:  playCountdownMusic,
      onGameStart:       startGameMusic,
      onGameOver:        playGameOverMusic,
      onPause:           pauseMusic,
      onResume:          resumeMusic,
      onShuffle:         () => playSfx('sfx_shuffle'),
      onDrop:            () => playSfx('sfx_drop'),
      onMatch:           () => playSfx('sfx_match'),
      onLevelUp:         () => playSfx('sfx_level_up'),
      ...extraOpts,
    };
  }

  document.getElementById('btn-1p').addEventListener('click', () => {
    playSfxThen('sfx_click', () => {
      showGame();
      window.game = new Game(document.getElementById('game-board'), makeGameOptions());
    });
  });

  document.getElementById('btn-2p').addEventListener('click', () => {
    playSfxThen('sfx_click', () => {
      document.getElementById('board-wrapper-p2').style.display = '';
      document.getElementById('side-panel-p2').style.display = '';
      document.getElementById('main-area').classList.add('two-player');
      showGame();

      window.game = new Game(document.getElementById('game-board'), makeGameOptions({ label: '1P' }));

      window.game2 = new Game(document.getElementById('game-board-p2'), makeGameOptions({
        scoreId:       'score-p2',
        gemsId:        'gems-p2',
        levelId:       'level-p2',
        nextPreviewId: 'next-piece-preview-p2',
        gameOverId:    'game-over',
        finalScoreId:  'final-score',
        retryBtnId:    'retry-btn',
        titleId:       'modal-title',
        keys:          { LEFT: 65, RIGHT: 68, DOWN: 83, SHUFFLE: 87 }, // A, D, S, W
        label:         '2P',
        onCountdownStart: null,
        onGameStart:      null,
        onPause:          null,
        onResume:         null,
      }));

      window.game.setPeer(window.game2);
      window.game2.setPeer(window.game);
    });
  });
})();
