// プレイヤーキャラクター - 移動・描画・当たり判定
const Player = (() => {
  let x = 0, y = 0;
  let dir = 'down'; // up, down, left, right
  let moveTimer = 0;
  const MOVE_COOLDOWN = 0.15; // 秒

  const DIR_OFFSETS = {
    up:    { dx: 0, dy: -1 },
    down:  { dx: 0, dy:  1 },
    left:  { dx: -1, dy: 0 },
    right: { dx:  1, dy: 0 },
  };

  const KEY_MAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
  };

  function init(startX, startY) {
    x = startX;
    y = startY;
  }

  function update(dt) {
    moveTimer -= dt;
    if (moveTimer > 0) return;

    for (const [key, direction] of Object.entries(KEY_MAP)) {
      if (Engine.isKeyDown(key)) {
        dir = direction;
        const { dx, dy } = DIR_OFFSETS[direction];
        const nx = x + dx;
        const ny = y + dy;

        // NPCとの衝突チェック
        const npc = NPC.getAt(nx, ny);
        if (npc) {
          // NPCの方を向くだけ（話しかけはスペースキー）
          moveTimer = MOVE_COOLDOWN;
          return;
        }

        if (!GameMap.isSolid(nx, ny)) {
          x = nx;
          y = ny;
        }
        moveTimer = MOVE_COOLDOWN;
        return;
      }
    }
  }

  function getFacing() {
    const { dx, dy } = DIR_OFFSETS[dir];
    return { x: x + dx, y: y + dy };
  }

  function render(ctx) {
    const ts = Engine.TILE_SIZE;
    const px = x * ts;
    const py = y * ts;

    // 体
    ctx.fillStyle = '#e06060';
    ctx.fillRect(px + 6, py + 10, 20, 18);

    // 頭
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(px + 8, py + 2, 16, 12);

    // 目
    ctx.fillStyle = '#333';
    if (dir === 'down' || dir === 'left') {
      ctx.fillRect(px + 10, py + 6, 3, 3);
    }
    if (dir === 'down' || dir === 'right') {
      ctx.fillRect(px + 19, py + 6, 3, 3);
    }
    if (dir === 'up') {
      // 後ろ向き - 髪だけ
      ctx.fillStyle = '#6a3a1a';
      ctx.fillRect(px + 8, py + 2, 16, 10);
    }

    // 方向インジケータ（足元の小さな三角）
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    const facing = getFacing();
    const fx = (facing.x - x) * 4;
    const fy = (facing.y - y) * 4;
    ctx.beginPath();
    ctx.arc(px + 16 + fx * 2, py + 30 + fy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  return {
    init, update, render, getFacing,
    get x() { return x; },
    get y() { return y; },
    get dir() { return dir; },
  };
})();
