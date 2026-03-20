// メインエントリーポイント - ゲームの初期化と実行
(() => {
  // マップ読み込み
  const map = GameMap.load('village');

  // プレイヤー初期化
  Player.init(map.playerStart.x, map.playerStart.y);

  // NPC初期化
  NPC.init(map.npcs);

  // ゲーム開始時のモノローグ
  NPC.showMonologue([
    'ここは...どこだろう？',
    '知らない村に来てしまったみたいだ。',
    'まずは村人に話しかけてみよう。',
  ]);

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

  // 焚き火インタラクション
  function checkBonfire() {
    if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
      const facing = Player.getFacing();
      const tile = GameMap.getTile(facing.x, facing.y);
      if (tile === GameMap.TILES.BONFIRE) {
        Cooking.open();
      }
    }
  }

  // 更新処理
  function update(dt) {
    // バトル中
    if (Battle.isActive()) {
      Battle.update(dt);
      return;
    }

    // 料理中
    if (Cooking.isActive()) {
      Cooking.update();
      return;
    }

    // インベントリ表示中
    if (Inventory.isOpen()) {
      Inventory.update();
      return;
    }

    // 会話中
    if (NPC.isDialogActive()) {
      NPC.update();
      return;
    }

    Inventory.update();
    Player.update(dt);
    NPC.update();
    checkBonfire();
    checkEncounter();
  }

  // 描画処理
  function render(ctx) {
    // バトル画面
    if (Battle.isActive()) {
      Battle.render(ctx);
      return;
    }

    // マップ
    GameMap.render(ctx);

    // NPC
    NPC.renderNPCs(ctx);

    // プレイヤー
    Player.render(ctx);

    // ダイアログ（最前面）
    NPC.renderDialog(ctx);

    // インベントリ
    Inventory.render(ctx);

    // 料理画面
    Cooking.render(ctx);

    // ステータス表示
    const stats = Battle.getPlayerStats();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 200, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv${stats.level}  HP ${stats.hp}  EXP ${stats.exp}/${stats.nextExp}`, 8, 15);

    // 操作説明
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('移動:矢印/WASD  話す:Space  持物:I', Engine.WIDTH - 8, 15);
  }

  // ゲーム開始
  Engine.start(update, render);
})();
