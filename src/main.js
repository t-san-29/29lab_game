// メインエントリーポイント - ゲームの初期化と実行
(() => {
  let map = GameMap.load('village');
  Player.init(map.playerStart.x, map.playerStart.y);
  NPC.init(map.npcs);

  // ゲーム開始時のモノローグ
  NPC.showMonologue([
    'ここは...どこだろう？',
    '知らない村に来てしまったみたいだ。',
    'まずは村人に話しかけてみよう。',
  ]);

  // マップ遷移
  function changeMap(mapName, targetX, targetY) {
    map = GameMap.load(mapName);
    Player.init(targetX, targetY);
    NPC.init(map.npcs);
    stepCount = 0;
    lastPlayerX = targetX;
    lastPlayerY = targetY;
  }

  // ランダムエンカウント
  let stepCount = 0;
  let lastPlayerX = map.playerStart.x;
  let lastPlayerY = map.playerStart.y;
  const ENCOUNTER_CHANCE = 0.12;

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

  // ボス戦トリガー
  function checkBossTrigger() {
    const bossNpc = NPC.consumeCompletedBoss();
    if (bossNpc && bossNpc.bossId) {
      NPC.removeNpc(bossNpc.id);
      Battle.startBoss(bossNpc.bossId);
    }
  }

  // 更新処理
  function update(dt) {
    if (Battle.isActive()) { Battle.update(dt); return; }
    if (Cooking.isActive()) { Cooking.update(); return; }
    if (StatusScreen.isOpen()) { StatusScreen.update(); return; }
    if (Crafting.isOpen()) { Crafting.update(); return; }
    if (Inventory.isOpen()) { Inventory.update(); return; }

    if (NPC.isDialogActive()) {
      NPC.update();
      return;
    }

    // ダイアログが終わった直後のボス戦チェック
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

  // 描画処理
  function render(ctx) {
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
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 310, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv${stats.level} ミズキチ  HP ${stats.hp}/${stats.maxHp}  ATK ${stats.atk + bonus.atk}  DEF ${stats.def + bonus.def}`, 8, 15);

    // 操作説明
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('移動:矢印  話す:Space  I:持物  E:装備  C:クラフト', Engine.WIDTH - 8, 15);
  }

  Engine.start(update, render);
})();
