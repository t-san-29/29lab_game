// メインエントリーポイント - ゲームの初期化と実行
(() => {
  // === 名前選択フェーズ ===
  const NAME_CHOICES = [
    'レイ・ララー',
    'ミズキチ・イェーガー',
    'ヒータン・ミータン',
  ];
  let gamePhase = 'name_select'; // name_select → playing
  let nameCursor = 0;
  let nameDialogPhase = 'ask'; // ask → select → confirm

  // === ゲーム本体の初期化（名前決定後に呼ぶ） ===
  let map, stepCount, lastPlayerX, lastPlayerY;
  const ENCOUNTER_CHANCE = 0.12;

  function initGame() {
    map = GameMap.load('village');
    Player.init(map.playerStart.x, map.playerStart.y);
    NPC.init(map.npcs);
    stepCount = 0;
    lastPlayerX = map.playerStart.x;
    lastPlayerY = map.playerStart.y;

    NPC.showMonologue([
      'ここは...どこだろう？',
      '知らない村に来てしまったみたいだ。',
      'まずは村人に話しかけてみよう。',
    ]);

    gamePhase = 'playing';
  }

  // マップ遷移
  function changeMap(mapName, targetX, targetY) {
    map = GameMap.load(mapName);
    Player.init(targetX, targetY);
    NPC.init(map.npcs);
    stepCount = 0;
    lastPlayerX = targetX;
    lastPlayerY = targetY;
  }

  function checkEncounter() {
    if (Player.x === lastPlayerX && Player.y === lastPlayerY) return;
    lastPlayerX = Player.x;
    lastPlayerY = Player.y;
    const tile = GameMap.getTile(Player.x, Player.y);
    if (tile !== GameMap.TILES.GRASS) return;
    stepCount++;
    if (stepCount <= 5) return;
    if (Math.random() < ENCOUNTER_CHANCE) {
      stepCount = 0;
      Battle.start();
    }
  }

  function checkExit() {
    const exit = GameMap.getExit(Player.x, Player.y);
    if (exit) changeMap(exit.target, exit.targetX, exit.targetY);
  }

  function checkBonfire() {
    if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
      const facing = Player.getFacing();
      const tile = GameMap.getTile(facing.x, facing.y);
      if (tile === GameMap.TILES.BONFIRE) Cooking.open();
    }
  }

  function checkBossTrigger() {
    const bossNpc = NPC.consumeCompletedBoss();
    if (bossNpc && bossNpc.bossId) {
      NPC.removeNpc(bossNpc.id);
      Battle.startBoss(bossNpc.bossId);
    }
  }

  // === 更新処理 ===
  function update(dt) {
    // 名前選択フェーズ
    if (gamePhase === 'name_select') {
      updateNameSelect();
      return;
    }

    if (Battle.isActive()) { Battle.update(dt); return; }
    if (Cooking.isActive()) { Cooking.update(); return; }
    if (StatusScreen.isOpen()) { StatusScreen.update(); return; }
    if (Crafting.isOpen()) { Crafting.update(); return; }
    if (Inventory.isOpen()) { Inventory.update(); return; }

    if (NPC.isDialogActive()) {
      NPC.update();
      return;
    }

    checkBossTrigger();
    Inventory.update();
    StatusScreen.update();
    Crafting.update();
    Player.update(dt);
    NPC.update();
    checkBonfire();
    checkExit();
    checkEncounter();
  }

  // 名前選択の更新
  function updateNameSelect() {
    if (nameDialogPhase === 'ask') {
      // 最初のセリフ表示中 → Space で選択へ
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        nameDialogPhase = 'select';
      }
    } else if (nameDialogPhase === 'select') {
      if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
        nameCursor = (nameCursor - 1 + NAME_CHOICES.length) % NAME_CHOICES.length;
      }
      if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
        nameCursor = (nameCursor + 1) % NAME_CHOICES.length;
      }
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        PlayerData.setName(NAME_CHOICES[nameCursor]);
        nameDialogPhase = 'confirm';
      }
    } else if (nameDialogPhase === 'confirm') {
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        initGame();
      }
    }
  }

  // === 描画処理 ===
  function render(ctx) {
    // 名前選択画面
    if (gamePhase === 'name_select') {
      renderNameSelect(ctx);
      return;
    }

    if (Battle.isActive()) { Battle.render(ctx); return; }

    GameMap.render(ctx);
    NPC.renderNPCs(ctx);
    Player.render(ctx);
    NPC.renderDialog(ctx);
    Inventory.render(ctx);
    Cooking.render(ctx);
    StatusScreen.render(ctx);
    Crafting.render(ctx);

    // ステータスバー
    const stats = Battle.getPlayerStats();
    const bonus = Equipment.getBonus();
    const pName = PlayerData.getName();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 340, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv${stats.level} ${pName}  HP ${stats.hp}/${stats.maxHp}  ATK ${stats.atk + bonus.atk}  DEF ${stats.def + bonus.def}`, 8, 15);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('移動:矢印  話す:Space  I:持物  E:装備  C:クラフト', Engine.WIDTH - 8, 15);
  }

  // 名前選択画面の描画
  function renderNameSelect(ctx) {
    const W = Engine.WIDTH, H = Engine.HEIGHT;

    // 背景（村のイメージ）
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, W, H);
    // 装飾
    ctx.fillStyle = '#2a4a2a';
    for (let i = 0; i < W; i += 40) {
      for (let j = 0; j < H; j += 40) {
        ctx.fillRect(i + 5, j + 5, 2, 8);
        ctx.fillRect(i + 25, j + 20, 2, 8);
      }
    }

    // タイトル
    ctx.fillStyle = '#f0d060';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('29Lab RPG', W / 2, 60);
    ctx.fillStyle = '#c0a040';
    ctx.font = '12px sans-serif';
    ctx.fillText('〜 はじまりの村 〜', W / 2, 85);

    // 村長キャラ描画
    const ex = W / 2, ey = 150;
    ctx.fillStyle = '#e0c040';
    ctx.fillRect(ex - 10, ey + 5, 20, 18);
    ctx.fillStyle = '#ffcc99';
    ctx.fillRect(ex - 8, ey - 5, 16, 12);
    ctx.fillStyle = '#333';
    ctx.fillRect(ex - 6, ey - 1, 3, 3);
    ctx.fillRect(ex + 3, ey - 1, 3, 3);
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.fillText('村長', ex, ey - 12);

    // ダイアログボックス
    const boxW = W - 60, boxH = 90;
    const boxX = 30, boxY = 190;
    ctx.fillStyle = 'rgba(0, 0, 40, 0.92)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 4, boxY + 4, boxW - 8, boxH - 8);

    ctx.fillStyle = '#f0d060';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('村長', boxX + 14, boxY + 22);

    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';

    if (nameDialogPhase === 'ask') {
      ctx.fillText('おお、旅の者よ！', boxX + 14, boxY + 48);
      ctx.fillText('そなたの名はなんだったかの？', boxX + 14, boxY + 70);

      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('▼ スペースキーで次へ', boxX + boxW - 14, boxY + boxH - 8);
    } else if (nameDialogPhase === 'select') {
      ctx.fillText('そなたの名はなんだったかの？', boxX + 14, boxY + 50);

      // 選択肢ウィンドウ
      const selW = 280, selH = 30 + NAME_CHOICES.length * 32;
      const selX = W / 2 - selW / 2, selY = boxY + boxH + 15;
      ctx.fillStyle = 'rgba(0, 0, 40, 0.92)';
      ctx.fillRect(selX, selY, selW, selH);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.strokeRect(selX, selY, selW, selH);

      ctx.font = '15px sans-serif';
      ctx.textAlign = 'left';
      NAME_CHOICES.forEach((name, i) => {
        const y = selY + 28 + i * 32;
        const sel = i === nameCursor;
        ctx.fillStyle = sel ? '#ffe080' : '#fff';
        ctx.fillText(`${sel ? '▶' : '　'} ${name}`, selX + 20, y);
      });

      ctx.fillStyle = '#666'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('↑↓:選択  Space:決定', W / 2, selY + selH + 18);
    } else if (nameDialogPhase === 'confirm') {
      const chosenName = PlayerData.getName();
      ctx.fillText(`${chosenName}じゃな！`, boxX + 14, boxY + 48);
      ctx.fillText('よい名前じゃ。さあ、冒険の始まりじゃ！', boxX + 14, boxY + 70);

      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('■ スペースキーで始める', boxX + boxW - 14, boxY + boxH - 8);
    }
  }

  Engine.start(update, render);
})();
