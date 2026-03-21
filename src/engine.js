// ゲームエンジン - Canvas管理・ゲームループ・入力処理
const Engine = (() => {
  const TILE_SIZE = 32;
  const SCREEN_COLS = 20;
  const SCREEN_ROWS = 15;
  const WIDTH = TILE_SIZE * SCREEN_COLS;   // 640
  const HEIGHT = TILE_SIZE * SCREEN_ROWS;  // 480

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  // 入力管理
  const keys = {};
  const justPressed = {};
  window.addEventListener('keydown', e => {
    if (!keys[e.key]) justPressed[e.key] = true;
    keys[e.key] = true;
    e.preventDefault();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  // --- タッチ入力 ---
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  let touchHoldKey = null; // スワイプで押しっぱなしにするキー
  let touchHoldTimer = null;

  function getCanvasPos(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left) * (WIDTH / rect.width),
      y: (touch.clientY - rect.top) * (HEIGHT / rect.height),
    };
  }

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
    // スワイプ中の押しっぱなしを解除
    clearTouchHold();
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - touchStartTime;

    if (dist < 20) {
      // タップ → スペースキー扱い
      justPressed[' '] = true;
      keys[' '] = true;
      setTimeout(() => { keys[' '] = false; }, 50);
    } else if (dist > 30) {
      // スワイプ → 方向キー（押しっぱなしにする）
      let key;
      if (Math.abs(dx) > Math.abs(dy)) {
        key = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
      } else {
        key = dy > 0 ? 'ArrowDown' : 'ArrowUp';
      }
      justPressed[key] = true;
      keys[key] = true;
      touchHoldKey = key;
      // 一定時間後に離す（連続移動のため少し長め）
      touchHoldTimer = setTimeout(() => {
        keys[key] = false;
        touchHoldKey = null;
      }, 180);
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
  }, { passive: false });

  function clearTouchHold() {
    if (touchHoldKey) {
      keys[touchHoldKey] = false;
      touchHoldKey = null;
    }
    if (touchHoldTimer) {
      clearTimeout(touchHoldTimer);
      touchHoldTimer = null;
    }
  }

  // 仮想ボタン押下（外部からEngine経由で呼ぶ）
  function simulateKey(key) {
    justPressed[key] = true;
    keys[key] = true;
    setTimeout(() => { keys[key] = false; }, 50);
  }

  function isKeyDown(key) {
    return !!keys[key];
  }

  function isKeyJustPressed(key) {
    return !!justPressed[key];
  }

  function clearJustPressed() {
    for (const k in justPressed) delete justPressed[k];
  }

  // ゲームループ
  let updateFn = null;
  let renderFn = null;
  let lastTime = 0;

  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (updateFn) updateFn(dt);
    if (renderFn) renderFn(ctx);
    clearJustPressed();

    requestAnimationFrame(loop);
  }

  function start(update, render) {
    updateFn = update;
    renderFn = render;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  return {
    canvas, ctx, TILE_SIZE, SCREEN_COLS, SCREEN_ROWS, WIDTH, HEIGHT,
    isKeyDown, isKeyJustPressed, simulateKey, start
  };
})();
