// メインエントリーポイント - ゲームの初期化と実行
(() => {
  // マップ読み込み
  const map = GameMap.load('village');

  // プレイヤー初期化
  Player.init(map.playerStart.x, map.playerStart.y);

  // NPC初期化
  NPC.init(map.npcs);

  // 更新処理
  function update(dt) {
    if (NPC.isDialogActive()) {
      NPC.update();
    } else {
      Player.update(dt);
      NPC.update();
    }
  }

  // 描画処理
  function render(ctx) {
    // マップ
    GameMap.render(ctx);

    // NPC
    NPC.renderNPCs(ctx);

    // プレイヤー
    Player.render(ctx);

    // ダイアログ（最前面）
    NPC.renderDialog(ctx);

    // 操作説明（初回のみフェードアウトしてもいいが、シンプルに常時表示）
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('矢印キー/WASD: 移動 ｜ スペース: 話す', 10, 16);
  }

  // ゲーム開始
  Engine.start(update, render);
})();
