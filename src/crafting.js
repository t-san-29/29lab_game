// クラフトシステム - 素材から装備品を作成
const Crafting = (() => {
  let showUI = false;
  let cursor = 0;
  let resultMessage = '';
  let resultTimer = 0;
  let scrollOffset = 0;

  // レシピ一覧
  const RECIPES = [
    // --- 既存レシピ ---
    { result: 'tusk_knife',    materials: { boar_tusk: 1 },                          desc: 'ATK+3' },
    { result: 'antler_spear',  materials: { deer_antler: 1, chicken_feather: 1 },    desc: 'ATK+5 DEF+1' },
    { result: 'bear_sword',    materials: { bear_claw: 1, boar_tusk: 1 },            desc: 'ATK+6' },
    { result: 'feather_hat',   materials: { chicken_feather: 2 },                    desc: 'DEF+1' },
    { result: 'fur_armor',     materials: { rabbit_fur: 2 },                         desc: 'DEF+2' },
    { result: 'antler_shield', materials: { deer_antler: 1, rabbit_fur: 1 },         desc: 'DEF+4' },
    { result: 'bear_armor',    materials: { bear_claw: 1, rabbit_fur: 1 },           desc: 'DEF+5' },
    { result: 'murakon_blade', materials: { murakon_fang: 1, bear_claw: 1 },         desc: 'ATK+10 DEF+2' },
    { result: 'murakon_armor', materials: { murakon_scale: 1, rabbit_fur: 1 },       desc: 'ATK+2 DEF+8' },
    // --- 闇の洞窟 武器 ---
    { result: 'shadow_blade',  materials: { shadow_fang: 2 },                        desc: 'ATK+14 DEF+1' },
    { result: 'golem_hammer',  materials: { golem_core: 1, shadow_fang: 1 },         desc: 'ATK+17 DEF+3' },
    { result: 'dragon_lance',  materials: { dragon_scale: 1, golem_core: 1 },        desc: 'ATK+24 DEF+4' },
    { result: 'dark_blade',    materials: { dark_armor_piece: 1, dragon_scale: 1 },  desc: 'ATK+30 DEF+5' },
    // --- 闇の洞窟 防具 ---
    { result: 'shadow_cloak',  materials: { shadow_fang: 1, rabbit_fur: 2 },         desc: 'ATK+1 DEF+10' },
    { result: 'golem_armor',   materials: { golem_core: 1, bear_claw: 1 },           desc: 'DEF+14' },
    { result: 'dragon_mail',   materials: { dragon_scale: 2 },                       desc: 'ATK+3 DEF+20' },
    { result: 'dark_armor',    materials: { dark_armor_piece: 1, dragon_scale: 1 },  desc: 'ATK+5 DEF+24' },
    // --- アクセサリー ---
    { result: 'wolf_charm',    materials: { shadow_fang: 1 },                        desc: 'ATK+4 DEF+4' },
    { result: 'golem_ring',    materials: { golem_core: 1 },                         desc: 'ATK+2 DEF+8' },
    { result: 'dragon_pendant',materials: { dragon_scale: 1, shadow_fang: 1 },       desc: 'ATK+8 DEF+6' },
    { result: 'dark_amulet',   materials: { dark_armor_piece: 1, golem_core: 1 },    desc: 'ATK+10 DEF+10' },
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
    shadow_fang:     '闇狼の牙',
    golem_core:      'ゴーレムの核',
    dragon_scale:    '竜の鱗',
    dark_armor_piece:'漆黒の鎧片',
  };

  const MAX_VISIBLE = 10;

  function isOpen() { return showUI; }

  function toggle() {
    showUI = !showUI;
    if (showUI) {
      cursor = 0;
      scrollOffset = 0;
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

    // スクロール調整
    if (cursor < scrollOffset) scrollOffset = cursor;
    if (cursor >= scrollOffset + MAX_VISIBLE) scrollOffset = cursor - MAX_VISIBLE + 1;

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

    // レシピ一覧（スクロール対応）
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';

    const listTop = pad + 45;
    const lineH = 24;
    const visibleCount = Math.min(MAX_VISIBLE, RECIPES.length);

    for (let vi = 0; vi < visibleCount; vi++) {
      const i = vi + scrollOffset;
      if (i >= RECIPES.length) break;

      const recipe = RECIPES[i];
      const y = listTop + vi * lineH;
      const eqData = Equipment.DB[recipe.result];
      const craftable = canCraft(recipe);
      const selected = i === cursor;

      // タイプ表示
      const typeLabel = eqData.type === 'accessory' ? '[飾]' : eqData.type === 'weapon' ? '[武]' : '[防]';
      ctx.fillStyle = eqData.type === 'accessory' ? '#c080ff' : eqData.type === 'weapon' ? '#ff8060' : '#6080ff';
      ctx.fillText(typeLabel, pad + 10, y);

      // 選択カーソル
      ctx.fillStyle = selected ? '#ffe080' : (craftable ? '#fff' : '#666');
      ctx.fillText(`${selected ? '▶' : '　'} ${eqData.name}`, pad + 36, y);

      // ステータス
      ctx.fillStyle = selected ? '#80ff80' : '#888';
      ctx.fillText(recipe.desc, pad + 200, y);
    }

    // スクロールインジケータ
    if (scrollOffset > 0) {
      ctx.fillStyle = '#aaa'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('▲', W / 2, listTop - 5);
    }
    if (scrollOffset + MAX_VISIBLE < RECIPES.length) {
      ctx.fillStyle = '#aaa'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('▼', W / 2, listTop + visibleCount * lineH + 5);
    }

    // 必要素材（選択中のみ詳細表示）
    const matY = listTop + visibleCount * lineH + 20;
    const recipe = RECIPES[cursor];
    ctx.fillStyle = '#c0c0c0';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
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
