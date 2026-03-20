// 焚き火の料理システム
const Cooking = (() => {
  let active = false;
  let cursor = 0;
  let cookableMeats = [];
  let resultMessage = '';
  let resultTimer = 0;
  let phase = 'select'; // select, result

  // 生肉のIDリスト
  const RAW_MEATS = [
    'rabbit_meat', 'boar_meat', 'chicken_meat', 'bear_meat', 'deer_meat'
  ];

  // 焼き結果（こんがり肉になる確率は肉の種類で変わる）
  const COOK_DATA = {
    rabbit_meat:  { name: 'うさぎ肉',     kongari: 0.4 },
    boar_meat:    { name: 'イノシシ肉',   kongari: 0.6 },
    chicken_meat: { name: 'とり肉',       kongari: 0.3 },
    bear_meat:    { name: 'クマ肉',       kongari: 0.7 },
    deer_meat:    { name: 'シカ肉',       kongari: 0.5 },
  };

  function isActive() {
    return active;
  }

  function open() {
    // 焼ける肉があるか確認
    cookableMeats = Inventory.getAll().filter(item =>
      RAW_MEATS.some(id => Inventory.hasItem(id) && item.name === Inventory.getItem(id).name)
    );

    // IDベースで取得し直す
    cookableMeats = [];
    for (const meatId of RAW_MEATS) {
      const item = Inventory.getItem(meatId);
      if (item && item.count > 0) {
        cookableMeats.push({ id: meatId, ...item });
      }
    }

    if (cookableMeats.length === 0) {
      NPC.showMonologue([
        '焼ける肉を持っていない...',
        '草むらで動物を倒して肉を手に入れよう。',
      ]);
      return;
    }

    active = true;
    cursor = 0;
    phase = 'select';
    resultMessage = '';
  }

  function close() {
    active = false;
  }

  function update() {
    if (!active) return;

    if (phase === 'select') {
      if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
        cursor = (cursor - 1 + cookableMeats.length) % cookableMeats.length;
      }
      if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
        cursor = (cursor + 1) % cookableMeats.length;
      }
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        cook(cookableMeats[cursor]);
      }
      if (Engine.isKeyJustPressed('Escape')) {
        close();
      }
    } else if (phase === 'result') {
      resultTimer += 0.016;
      if (resultTimer > 0.5 && (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter'))) {
        // メニューに戻るか閉じる
        // 焼ける肉を再チェック
        cookableMeats = [];
        for (const meatId of RAW_MEATS) {
          const item = Inventory.getItem(meatId);
          if (item && item.count > 0) {
            cookableMeats.push({ id: meatId, ...item });
          }
        }
        if (cookableMeats.length === 0) {
          close();
        } else {
          cursor = Math.min(cursor, cookableMeats.length - 1);
          phase = 'select';
        }
      }
    }
  }

  function cook(meat) {
    const data = COOK_DATA[meat.id];
    if (!data) return;

    // 肉を消費
    Inventory.remove(meat.id, 1);

    // こんがり肉か普通の焼き肉か判定
    if (Math.random() < data.kongari) {
      Inventory.add('kongari_' + meat.id, 'こんがり' + data.name, 'うまく焼けた！HP大回復');
      resultMessage = `${data.name}をじっくり焼いた...\nこんがり${data.name}ができた！`;
    } else {
      Inventory.add('yaki_' + meat.id, data.name + 'の焼き肉', 'まあまあの焼き加減。HP回復');
      resultMessage = `${data.name}を焼いた...\n${data.name}の焼き肉ができた！`;
    }

    phase = 'result';
    resultTimer = 0;
  }

  function render(ctx) {
    if (!active) return;

    const W = Engine.WIDTH;
    const H = Engine.HEIGHT;

    // 背景を暗く
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, W, H);

    // 焚き火の炎を大きく描画
    const cx = W / 2, cy = H * 0.3;
    const t = performance.now() / 200;
    // 石の囲い
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 20, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // 炎
    for (let i = 0; i < 5; i++) {
      const ox = Math.sin(t + i * 1.3) * 8;
      const oy = Math.cos(t + i * 0.9) * 4;
      ctx.fillStyle = ['#ff3010', '#ff6020', '#ff8030', '#ffa040', '#ffe060'][i];
      ctx.beginPath();
      ctx.ellipse(cx + ox, cy - 5 + oy - i * 4, 15 - i * 2, 25 - i * 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (phase === 'select') {
      // メニューウィンドウ
      const mw = 280, mh = 40 + cookableMeats.length * 30;
      const mx = W / 2 - mw / 2, my = H * 0.5;
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#ff8040';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, mw, mh);

      ctx.fillStyle = '#ffa040';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('どの肉を焼く？', W / 2, my + 22);

      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      cookableMeats.forEach((meat, i) => {
        const y = my + 45 + i * 30;
        ctx.fillStyle = i === cursor ? '#ffe080' : '#fff';
        ctx.fillText(`${i === cursor ? '▶' : '　'} ${meat.name}  x${meat.count}`, mx + 16, y);
      });

      // ヒント
      ctx.fillStyle = '#888';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Escキーで戻る', W / 2, my + mh + 16);
    } else if (phase === 'result') {
      // 結果メッセージ
      const mw = 350, mh = 80;
      const mx = W / 2 - mw / 2, my = H * 0.55;
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#ff8040';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, mw, mh);

      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      const lines = resultMessage.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, mx + 16, my + 28 + i * 22);
      });

      if (resultTimer > 0.5) {
        ctx.fillStyle = '#aaa';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('スペースキーで続ける', W / 2, my + mh + 16);
      }
    }
  }

  return { isActive, open, close, update, render };
})();
