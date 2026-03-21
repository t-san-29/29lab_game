// クラフトシステム - 素材から装備品を作成
const Crafting = (() => {
  let showUI = false;
  let cursor = 0;
  let resultMessage = '';
  let resultTimer = 0;

  // レシピ一覧
  const RECIPES = [
    { result: 'tusk_knife',    materials: { boar_tusk: 1 },                          desc: 'ATK+3' },
    { result: 'antler_spear',  materials: { deer_antler: 1, chicken_feather: 1 },    desc: 'ATK+5 DEF+1' },
    { result: 'bear_sword',    materials: { bear_claw: 1, boar_tusk: 1 },            desc: 'ATK+6' },
    { result: 'feather_hat',   materials: { chicken_feather: 2 },                    desc: 'DEF+1' },
    { result: 'fur_armor',     materials: { rabbit_fur: 2 },                         desc: 'DEF+2' },
    { result: 'antler_shield', materials: { deer_antler: 1, rabbit_fur: 1 },         desc: 'DEF+4' },
    { result: 'bear_armor',    materials: { bear_claw: 1, rabbit_fur: 1 },           desc: 'DEF+5' },
    { result: 'murakon_blade', materials: { murakon_fang: 1, bear_claw: 1 },         desc: 'ATK+10 DEF+2' },
    { result: 'murakon_armor', materials: { murakon_scale: 1, rabbit_fur: 1 },       desc: 'ATK+2 DEF+8' },
  ];

  // 素材名マップ
  const MATERIAL_NAMES = {
    rabbit_fur:      'うさぎの毛皮',
    boar_tusk:       'イノシシの牙',
    chicken_feather: 'とりの羽',
    bear_claw:       'クマの爪',
    deer_antler:     'シカの角',
    murakon_fang:    'ムラコンの牙',
    murakon_scale:   'ムラコンの鱗',
  };

  function isOpen() { return showUI; }

  function toggle() {
    showUI = !showUI;
    if (showUI) {
      cursor = 0;
      resultMessage = '';
    }
  }

  function close() { showUI = false; }

  function canCraft(recipe) {
    for (const [matId, needed] of Object.entries(recipe.materials)) {
      const item = Inventory.getItem(matId);
      if (!item || item.count < needed) return false;
    }
    return true;
  }

  function craft(recipe) {
    if (!canCraft(recipe)) return;

    // 素材消費
    for (const [matId, needed] of Object.entries(recipe.materials)) {
      Inventory.remove(matId, needed);
    }

    // 装備品をインベントリに追加
    const eqData = Equipment.DB[recipe.result];
    Inventory.add(recipe.result, eqData.name, eqData.desc);

    resultMessage = `${eqData.name}を作った！`;
    resultTimer = 2.0;
  }

  function update() {
    if (resultTimer > 0) {
      resultTimer -= 0.016;
      if (resultTimer <= 0) resultMessage = '';
    }

    if (Engine.isKeyJustPressed('c') || Engine.isKeyJustPressed('C')) {
      toggle();
    }
    if (!showUI) return;

    if (Engine.isKeyJustPressed('Escape')) {
      close();
      return;
    }

    if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
      cursor = (cursor - 1 + RECIPES.length) % RECIPES.length;
    }
    if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
      cursor = (cursor + 1) % RECIPES.length;
    }
    if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
      const recipe = RECIPES[cursor];
      if (canCraft(recipe)) {
        craft(recipe);
      } else {
        resultMessage = '素材が足りない...';
        resultTimer = 1.5;
      }
    }
  }

  function render(ctx) {
    if (!showUI) return;

    const W = Engine.WIDTH;
    const H = Engine.HEIGHT;
    const pad = 20;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);
    ctx.strokeStyle = '#ff8040';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // タイトル
    ctx.fillStyle = '#ffa040';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('クラフト', W / 2, pad + 28);

    // レシピ一覧
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';

    const listTop = pad + 45;
    const lineH = 26;

    RECIPES.forEach((recipe, i) => {
      const y = listTop + i * lineH;
      const eqData = Equipment.DB[recipe.result];
      const craftable = canCraft(recipe);
      const selected = i === cursor;

      // 選択カーソル
      ctx.fillStyle = selected ? '#ffe080' : (craftable ? '#fff' : '#666');
      ctx.fillText(`${selected ? '▶' : '　'} ${eqData.name}`, pad + 10, y);

      // ステータス
      ctx.fillStyle = selected ? '#80ff80' : '#888';
      ctx.fillText(recipe.desc, pad + 180, y);

      // 必要素材（選択中のみ詳細表示）
      if (selected) {
        const matY = listTop + RECIPES.length * lineH + 16;
        ctx.fillStyle = '#c0c0c0';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('必要素材:', pad + 16, matY);
        ctx.font = '13px sans-serif';

        let matX = pad + 100;
        for (const [matId, needed] of Object.entries(recipe.materials)) {
          const have = Inventory.getItem(matId);
          const haveCount = have ? have.count : 0;
          const enough = haveCount >= needed;
          ctx.fillStyle = enough ? '#80ff80' : '#ff6060';
          const matName = MATERIAL_NAMES[matId] || matId;
          ctx.fillText(`${matName} ${haveCount}/${needed}`, matX, matY);
          matX += 150;
        }
      }
    });

    // 結果メッセージ
    if (resultMessage) {
      const msgW = 300, msgH = 36;
      const msgX = W / 2 - msgW / 2, msgY = H - pad - 60;
      ctx.fillStyle = 'rgba(0, 80, 0, 0.9)';
      ctx.fillRect(msgX, msgY, msgW, msgH);
      ctx.strokeStyle = '#80ff80';
      ctx.lineWidth = 1;
      ctx.strokeRect(msgX, msgY, msgW, msgH);
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(resultMessage, W / 2, msgY + 24);
    }

    // 操作ヒント
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓:選択  Space:作る  Cキーで閉じる', W / 2, H - pad - 10);
  }

  return { isOpen, update, render };
})();
