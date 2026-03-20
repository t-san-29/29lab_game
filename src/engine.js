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
    isKeyDown, isKeyJustPressed, start
  };
})();
