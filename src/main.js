// メインエントリーポイント - ゲームの初期化と実行
(() => {
  // === 名前選択フェーズ ===
  const NAME_CHOICES = [
    'レイ・ララー',
    'ミズキチ・イェーガー',
    'キュウイチ・ロウ',
  ];
  let gamePhase = 'title'; // title → name_select → playing → ending
  let nameCursor = 0;
  let nameDialogPhase = 'ask'; // ask → select → confirm
  let endingPhase = 0; // 0=wake, 1=room, 2=mom_voice
  let endingTimer = 0;
  let titleTimer = 0; // タイトル画面アニメ用
  let titleCursor = 0; // 0=はじめから, 1=つづきから
  let wasBattleActive = false; // バトル終了検知用
  let wasBossBattle = false; // ボス戦かどうか
  let bgmStarted = false; // BGM開始済み
  let currentBgmScene = ''; // 現在のBGMシーン
  let holySwordObtained = false; // 聖剣入手済み
  let lastBossId = ''; // 最後に倒したボスID
  let murakonDefeatedTime = 0; // ムラコン撃破時刻（復活タイマー用）
  const MURAKON_RESPAWN_MS = 5 * 60 * 1000; // 5分で復活
  let saveMessage = ''; // セーブ通知メッセージ
  let saveMessageTimer = 0;
  const SAVE_KEY = 'mizukichi_save';

  // === セーブ/ロード ===
  function saveGame() {
    const data = {
      version: 1,
      name: PlayerData.getName(),
      mapName: GameMap.getCurrentMapName(),
      playerX: Player.x,
      playerY: Player.y,
      battle: Battle.getSaveData(),
      inventory: Inventory.getSaveData(),
      equipment: Equipment.getSaveData(),
      holySwordObtained,
      murakonDefeatedTime: murakonDefeatedTime > 0 ? Date.now() - murakonDefeatedTime : 0,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      saveMessage = 'セーブしました！';
      saveMessageTimer = 2.0;
    } catch (e) {
      saveMessage = 'セーブに失敗しました...';
      saveMessageTimer = 2.0;
    }
  }

  function hasSaveData() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      PlayerData.setName(data.name);
      Battle.loadSaveData(data.battle);
      Inventory.loadSaveData(data.inventory);
      Equipment.loadSaveData(data.equipment);
      holySwordObtained = data.holySwordObtained || false;
      if (data.murakonDefeatedTime > 0) {
        murakonDefeatedTime = Date.now() - data.murakonDefeatedTime;
      } else {
        murakonDefeatedTime = 0;
      }
      // マップをロードしてプレイヤー配置
      map = GameMap.load(data.mapName);
      Player.init(data.playerX, data.playerY);
      NPC.init(map.npcs);
      if (holySwordObtained) NPC.removeNpc('holy_sword');
      // ムラコン復活チェック（セーブ中に5分経ってたら復活済みにする）
      if (murakonDefeatedTime > 0 && Date.now() - murakonDefeatedTime >= MURAKON_RESPAWN_MS) {
        murakonDefeatedTime = 0;
      } else if (murakonDefeatedTime > 0) {
        NPC.removeNpc('murakon');
      }
      stepCount = 0;
      lastPlayerX = data.playerX;
      lastPlayerY = data.playerY;
      gamePhase = 'playing';
      const bgm = (data.mapName === 'village' || data.mapName === 'sacred_grove') ? 'village' : 'dungeon';
      BGM.playTrack(bgm);
      currentBgmScene = bgm;
      return true;
    } catch (e) {
      return false;
    }
  }

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
    BGM.playTrack('village');
    currentBgmScene = 'village';
  }

  // マップ遷移
  function changeMap(mapName, targetX, targetY) {
    map = GameMap.load(mapName);
    Player.init(targetX, targetY);
    NPC.init(map.npcs);
    // 入手済みの聖剣NPCを除去
    if (holySwordObtained) NPC.removeNpc('holy_sword');
    stepCount = 0;
    lastPlayerX = targetX;
    lastPlayerY = targetY;
    // マップに応じたBGM切り替え
    const bgm = (mapName === 'village' || mapName === 'sacred_grove') ? 'village' : 'dungeon';
    if (currentBgmScene !== bgm) {
      BGM.playTrack(bgm);
      currentBgmScene = bgm;
    }
  }

  function checkEncounter() {
    if (Player.x === lastPlayerX && Player.y === lastPlayerY) return;
    lastPlayerX = Player.x;
    lastPlayerY = Player.y;
    const tile = GameMap.getTile(Player.x, Player.y);
    const mapName = GameMap.getCurrentMapName();
    const isGrass = tile === GameMap.TILES.GRASS;
    const isDungeonFloor = tile === GameMap.TILES.CAVE_FLOOR && mapName.startsWith('dungeon_north');
    if (!isGrass && !isDungeonFloor) return;
    stepCount++;
    if (stepCount <= 5) return;
    if (Math.random() < ENCOUNTER_CHANCE) {
      stepCount = 0;
      Battle.start(mapName);
      BGM.playTrack('battle');
    }
  }

  function checkExit() {
    // プレイヤーの現在地で出口チェック
    let exit = GameMap.getExit(Player.x, Player.y);
    // 現在地に出口がなければ、向いている方向の隣タイルもチェック
    // （壁タイルに出口が設定されている場合に対応）
    if (!exit) {
      const facing = Player.getFacing();
      exit = GameMap.getExit(facing.x, facing.y);
      if (exit) {
        // 向いている方向のタイルが壁なら、隣接している場合だけ発動
        const dx = facing.x - Player.x;
        const dy = facing.y - Player.y;
        const isEdge = (dx === 0 && (facing.y === 0 || facing.y === GameMap.getHeight() - 1)) ||
                       (dy === 0 && (facing.x === 0 || facing.x === GameMap.getWidth() - 1));
        if (!isEdge) exit = null;
      }
    }
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
      lastBossId = bossNpc.bossId;
      Battle.startBoss(bossNpc.bossId);
      BGM.playTrack('boss');
      wasBossBattle = true;
    }
  }

  // ムラコン復活チェック
  function checkMurakonRespawn() {
    if (murakonDefeatedTime > 0 && GameMap.getCurrentMapName() === 'dungeon') {
      if (Date.now() - murakonDefeatedTime >= MURAKON_RESPAWN_MS) {
        murakonDefeatedTime = 0;
        // ムラコンNPCがいなければ再追加
        const murakonData = {
          id: 'murakon', x: 16, y: 7, name: '魔獣ムラコン', type: 'boss', bossId: 'murakon', color: '#8020a0',
          dialog: [
            'グルルル......また来たか、人間め！',
            '何度でも相手になってやる！',
            '我が牙の錆にしてくれる！',
          ]
        };
        NPC.addNpc(murakonData);
      }
    }
  }

  // 聖剣ピックアップ
  function checkSwordPickup() {
    if (holySwordObtained) return;
    const completed = NPC.consumeCompleted('sword');
    if (completed) {
      holySwordObtained = true;
      NPC.removeNpc('holy_sword');
      Inventory.add('holy_sword', 'せいけんタケテーン', '聖なる森に眠っていた伝説の剣。圧倒的な力を秘める');
      NPC.showMonologue([
        'せいけんタケテーン を てにいれた！',
        'すさまじい力が みなぎってくる...！',
        'Eキーの装備画面から装備できそうだ。',
      ]);
    }
  }

  // バトル終了後の処理
  function checkBattleEnd() {
    if (wasBattleActive && !Battle.isActive()) {
      wasBattleActive = false;
      const result = Battle.getLastResult();
      if (result === 'lose') {
        // 敗北 → 村の開始位置にリスポーン
        const villageMap = GameMap.load('village');
        changeMap('village', villageMap.playerStart.x, villageMap.playerStart.y);
        NPC.showMonologue([
          '...はっ！ 気がつくと村に戻っていた。',
          'まだ体が痛む...でも、あきらめないぞ。',
        ]);
        wasBossBattle = false;
        lastBossId = '';
      } else if (result === 'win' && wasBossBattle) {
        wasBossBattle = false;
        if (lastBossId === 'oobaan') {
          // オオバーン撃破 → エンディング
          gamePhase = 'ending';
          endingPhase = 0;
          endingTimer = 0;
          BGM.playTrack('ending');
        } else if (lastBossId === 'murakon') {
          // ムラコン撃破 → エンディングには行かない、5分後に復活
          NPC.removeNpc('murakon');
          murakonDefeatedTime = Date.now();
          NPC.showMonologue([
            '魔獣ムラコンを倒した！',
            'しかし...北の闇の洞窟から、もっと恐ろしい気配がする...',
            'まだ冒険は終わらないようだ。',
          ]);
          BGM.playTrack(currentBgmScene);
        } else {
          BGM.playTrack(currentBgmScene);
        }
        lastBossId = '';
      } else {
        wasBossBattle = false;
        lastBossId = '';
        // 通常勝利/逃走 → マップBGMに戻す
        BGM.playTrack(currentBgmScene);
      }
    }
  }

  // === 更新処理 ===
  function update(dt) {
    // タイトル画面
    if (gamePhase === 'title') {
      titleTimer += dt;
      // 最初のタッチ/キー入力でAudioContext解除＆BGM開始
      if (titleTimer > 0.3 && !bgmStarted) {
        // タイトルBGMは操作なしでは鳴らない（ブラウザ制限）
      }
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        BGM.unlock();
        bgmStarted = true;
        if (hasSaveData()) {
          gamePhase = 'title_menu';
          titleCursor = 0;
        } else {
          BGM.playTrack('title');
          gamePhase = 'name_select';
        }
      }
      return;
    }

    // タイトルメニュー（はじめから/つづきから）
    if (gamePhase === 'title_menu') {
      titleTimer += dt;
      if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
        titleCursor = (titleCursor - 1 + 2) % 2;
      }
      if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
        titleCursor = (titleCursor + 1) % 2;
      }
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        if (titleCursor === 0) {
          // はじめから
          BGM.playTrack('title');
          gamePhase = 'name_select';
        } else {
          // つづきから
          if (loadGame()) {
            // ロード成功
          } else {
            saveMessage = 'ロードに失敗しました...';
            saveMessageTimer = 2.0;
          }
        }
      }
      return;
    }

    // 名前選択フェーズ
    if (gamePhase === 'name_select') {
      updateNameSelect();
      return;
    }

    // エンディングフェーズ
    if (gamePhase === 'ending') {
      updateEnding(dt);
      return;
    }

    if (Battle.isActive()) {
      wasBattleActive = true;
      Battle.update(dt);
      return;
    }

    // バトル終了チェック（リスポーン or エンディング）
    checkBattleEnd();

    if (Cooking.isActive()) { Cooking.update(); return; }
    if (StatusScreen.isOpen()) { StatusScreen.update(); return; }
    if (Crafting.isOpen()) { Crafting.update(); return; }
    if (Inventory.isOpen()) { Inventory.update(); return; }

    if (NPC.isDialogActive()) {
      NPC.update();
      return;
    }

    // セーブ（Pキー）
    if (Engine.isKeyJustPressed('p') || Engine.isKeyJustPressed('P')) {
      if (!NPC.isDialogActive() && !Inventory.isOpen() && !StatusScreen.isOpen() && !Crafting.isOpen() && !Cooking.isActive()) {
        saveGame();
      }
    }
    // セーブメッセージタイマー
    if (saveMessageTimer > 0) {
      saveMessageTimer -= 0.016;
      if (saveMessageTimer <= 0) saveMessage = '';
    }

    checkBossTrigger();
    checkSwordPickup();
    checkMurakonRespawn();
    Inventory.update();
    StatusScreen.update();
    Crafting.update();
    Player.update(dt);
    NPC.update();
    checkBonfire();
    checkExit();
    checkEncounter();
  }

  // エンディング更新
  function updateEnding(dt) {
    endingTimer += dt;
    if (endingPhase === 0 && endingTimer > 3.0) {
      // 画面暗転後 → 子供部屋へ
      endingPhase = 1;
      endingTimer = 0;
    } else if (endingPhase === 1 && endingTimer > 3.0) {
      // 部屋表示後 → お母さんの声
      endingPhase = 2;
      endingTimer = 0;
    } else if (endingPhase === 2) {
      // お母さんの声表示中 → キー入力で終了メッセージ
      if (endingTimer > 2.0 && (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter'))) {
        endingPhase = 3;
        endingTimer = 0;
      }
    }
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
    // タイトル画面
    if (gamePhase === 'title') {
      renderTitle(ctx);
      return;
    }

    // タイトルメニュー
    if (gamePhase === 'title_menu') {
      renderTitle(ctx);
      renderTitleMenu(ctx);
      return;
    }

    // 名前選択画面
    if (gamePhase === 'name_select') {
      renderNameSelect(ctx);
      return;
    }

    // エンディング画面
    if (gamePhase === 'ending') {
      renderEnding(ctx);
      return;
    }

    if (Battle.isActive()) {
      if (Engine.isTouchDevice) Engine.setTouchButtons([]);
      Battle.render(ctx);
      return;
    }

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
    ctx.fillRect(0, 0, 400, 22);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv${stats.level} ${pName}  HP ${stats.hp}/${stats.maxHp}  MP ${stats.mp}/${stats.maxMp}  ATK ${stats.atk + bonus.atk}  DEF ${stats.def + bonus.def}`, 8, 15);

    if (Engine.isTouchDevice) {
      // スマホ用タッチボタン
      const btnDefs = [
        { label: 'セーブ', key: 'p' },
        { label: 'もちもの', key: 'i' },
        { label: 'そうび', key: 'e' },
        { label: 'クラフト', key: 'c' },
        { label: 'Esc', key: 'Escape' },
      ];
      const btnW = 58, btnH = 28, gap = 4;
      const totalW = btnDefs.length * (btnW + gap) - gap;
      const startX = Engine.WIDTH / 2 - totalW / 2;
      const btnY = Engine.HEIGHT - 30;
      const buttons = [];
      btnDefs.forEach((def, i) => {
        const bx = startX + i * (btnW + gap);
        buttons.push({ id: def.label, x: bx, y: btnY, w: btnW, h: btnH, key: def.key });
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(bx, btnY, btnW, btnH);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, btnY, btnW, btnH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(def.label, bx + btnW / 2, btnY + 19);
      });
      Engine.setTouchButtons(buttons);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('移動:矢印  話す:Space  I:持物  E:装備  C:クラフト  P:セーブ', Engine.WIDTH - 8, 15);
      Engine.setTouchButtons([]);
    }

    // セーブメッセージ
    if (saveMessage) {
      const msgW = 200, msgH = 36;
      const msgX = Engine.WIDTH / 2 - msgW / 2, msgY = 30;
      ctx.fillStyle = 'rgba(0, 60, 0, 0.9)';
      ctx.fillRect(msgX, msgY, msgW, msgH);
      ctx.strokeStyle = '#80ff80'; ctx.lineWidth = 1;
      ctx.strokeRect(msgX, msgY, msgW, msgH);
      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(saveMessage, Engine.WIDTH / 2, msgY + 23);
    }
  }

  // エンディング描画
  function renderEnding(ctx) {
    const W = Engine.WIDTH, H = Engine.HEIGHT;

    if (endingPhase === 0) {
      // フェーズ0: 暗転 + 目覚めテキスト
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const alpha = Math.min(1, endingTimer / 1.5);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('...........', W / 2, H / 2 - 20);
      if (endingTimer > 1.5) {
        ctx.fillText('......あれ？', W / 2, H / 2 + 10);
      }
    } else if (endingPhase === 1) {
      // フェーズ1: 子供部屋描画
      drawChildRoom(ctx, W, H);
      const alpha = Math.min(1, endingTimer / 1.0);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${PlayerData.getName()}は 目をさました。`, W / 2, H - 80);
      ctx.font = '13px sans-serif';
      ctx.fillText('ここは...自分の部屋だ。 全部、夢だったのか...？', W / 2, H - 55);
    } else if (endingPhase === 2) {
      // フェーズ2: お母さんの声
      drawChildRoom(ctx, W, H);
      // メッセージウィンドウ
      const boxW = W - 40, boxH = 100;
      const boxX = 20, boxY = H - boxH - 20;
      ctx.fillStyle = 'rgba(0, 0, 40, 0.92)';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      ctx.fillStyle = '#f0d060';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('1階から声が聞こえる。', boxX + 14, boxY + 24);

      ctx.fillStyle = '#fff';
      ctx.font = '13px sans-serif';
      const momLine = `ほらほら！${PlayerData.getName()}！`;
      ctx.fillText(momLine, boxX + 14, boxY + 50);
      ctx.fillText('ゲームやテレビもいいけど、他にもたくさん遊んで', boxX + 14, boxY + 70);
      ctx.fillText('好きなことみつけるんですよ', boxX + 14, boxY + 88);

      if (endingTimer > 2.0) {
        ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('▼ スペースキー', W / 2, boxY - 5);
      }
    } else if (endingPhase === 3) {
      // フェーズ3: エンドクレジット
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f0d060';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fin.', W / 2, H / 2 - 30);
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.fillText('ミズキチの冒険  〜 はじまりの村 〜', W / 2, H / 2 + 10);
      ctx.fillStyle = '#aaa';
      ctx.font = '12px sans-serif';
      ctx.fillText('ありがとうございました！', W / 2, H / 2 + 40);
    }
  }

  // 子供部屋の描画
  function drawChildRoom(ctx, W, H) {
    // 壁
    ctx.fillStyle = '#f5e8d0';
    ctx.fillRect(0, 0, W, H);
    // 床
    ctx.fillStyle = '#c8a870';
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
    // フローリング線
    ctx.strokeStyle = '#b89860';
    ctx.lineWidth = 1;
    for (let y = H * 0.6; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, H * 0.6); ctx.lineTo(x, H); ctx.stroke();
    }
    // 窓（朝の光）
    ctx.fillStyle = '#88ccff';
    ctx.fillRect(W * 0.6, 30, 120, 100);
    ctx.strokeStyle = '#a09080'; ctx.lineWidth = 4;
    ctx.strokeRect(W * 0.6, 30, 120, 100);
    ctx.beginPath(); ctx.moveTo(W * 0.6 + 60, 30); ctx.lineTo(W * 0.6 + 60, 130); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W * 0.6, 80); ctx.lineTo(W * 0.6 + 120, 80); ctx.stroke();
    // カーテン
    ctx.fillStyle = '#ff9966';
    ctx.fillRect(W * 0.6 - 10, 25, 15, 110);
    ctx.fillRect(W * 0.6 + 115, 25, 15, 110);
    // ベッド
    ctx.fillStyle = '#8060a0';
    ctx.fillRect(60, H * 0.45, 180, 90);
    ctx.fillStyle = '#fff';
    ctx.fillRect(65, H * 0.45 + 5, 50, 40);
    // 布団
    ctx.fillStyle = '#a080c0';
    ctx.fillRect(60, H * 0.45 + 30, 180, 60);
    // テレビ台
    ctx.fillStyle = '#6a5040';
    ctx.fillRect(W * 0.7, H * 0.5, 100, 60);
    // テレビ
    ctx.fillStyle = '#222';
    ctx.fillRect(W * 0.7 + 10, H * 0.5 - 50, 80, 55);
    ctx.fillStyle = '#335';
    ctx.fillRect(W * 0.7 + 14, H * 0.5 - 46, 72, 47);
    // ゲーム機
    ctx.fillStyle = '#444';
    ctx.fillRect(W * 0.7 + 25, H * 0.5 + 5, 50, 10);
    // 本棚
    ctx.fillStyle = '#8b7050';
    ctx.fillRect(10, 30, 60, 120);
    ctx.fillStyle = '#c04040'; ctx.fillRect(15, 38, 12, 20);
    ctx.fillStyle = '#4080c0'; ctx.fillRect(30, 38, 10, 20);
    ctx.fillStyle = '#40a040'; ctx.fillRect(43, 38, 12, 20);
    ctx.fillStyle = '#e0c040'; ctx.fillRect(15, 65, 15, 20);
    ctx.fillStyle = '#a060a0'; ctx.fillRect(33, 65, 12, 20);
    ctx.fillStyle = '#e08040'; ctx.fillRect(48, 65, 10, 20);
  }

  // ドラクエ風タイトル画面
  function renderTitle(ctx) {
    const W = Engine.WIDTH, H = Engine.HEIGHT;
    const t = titleTimer;

    // 背景グラデーション（深い青～紫）
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a30');
    grad.addColorStop(0.5, '#1a1050');
    grad.addColorStop(1, '#0a0a30');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 星空
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137 + 50) % W;
      const sy = (i * 97 + 30) % (H * 0.6);
      const twinkle = Math.sin(t * 2 + i) * 0.5 + 0.5;
      ctx.globalAlpha = 0.3 + twinkle * 0.7;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // 地平線の山並み
    ctx.fillStyle = '#1a1040';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.65);
    ctx.lineTo(80, H * 0.5);
    ctx.lineTo(160, H * 0.58);
    ctx.lineTo(250, H * 0.45);
    ctx.lineTo(340, H * 0.55);
    ctx.lineTo(430, H * 0.48);
    ctx.lineTo(520, H * 0.56);
    ctx.lineTo(600, H * 0.5);
    ctx.lineTo(W, H * 0.6);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 地面
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(0, H * 0.75, W, H * 0.25);
    ctx.fillStyle = '#102010';
    for (let x = 0; x < W; x += 15) {
      const gh = 3 + Math.sin(x * 0.3 + t) * 2;
      ctx.fillRect(x, H * 0.75 - gh, 3, gh);
    }

    // タイトルロゴ
    const titleY = 100 + Math.sin(t * 0.8) * 8;

    // タイトル影
    ctx.fillStyle = '#000';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ミズキチの冒険', W / 2 + 3, titleY + 3);

    // タイトル本体（金色グラデ風）
    const titleGrad = ctx.createLinearGradient(W / 2 - 150, titleY - 40, W / 2 + 150, titleY);
    titleGrad.addColorStop(0, '#f0d060');
    titleGrad.addColorStop(0.3, '#fff8c0');
    titleGrad.addColorStop(0.5, '#f0d060');
    titleGrad.addColorStop(0.7, '#fff8c0');
    titleGrad.addColorStop(1, '#c0a030');
    ctx.fillStyle = titleGrad;
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText('ミズキチの冒険', W / 2, titleY);

    // タイトル外枠光
    ctx.strokeStyle = `rgba(255, 240, 160, ${0.4 + Math.sin(t * 1.5) * 0.3})`;
    ctx.lineWidth = 2;
    ctx.strokeText('ミズキチの冒険', W / 2, titleY);

    // サブタイトル
    const subAlpha = Math.min(1, Math.max(0, (t - 1.0) / 1.0));
    ctx.fillStyle = `rgba(200, 200, 255, ${subAlpha})`;
    ctx.font = '16px sans-serif';
    ctx.fillText('〜 はじまりの村 〜', W / 2, titleY + 45);

    // 装飾ライン
    ctx.strokeStyle = `rgba(240, 208, 96, ${0.5 + Math.sin(t) * 0.3})`;
    ctx.lineWidth = 1;
    const lineW = 180;
    ctx.beginPath();
    ctx.moveTo(W / 2 - lineW, titleY + 55);
    ctx.lineTo(W / 2 - 20, titleY + 55);
    ctx.moveTo(W / 2 + 20, titleY + 55);
    ctx.lineTo(W / 2 + lineW, titleY + 55);
    ctx.stroke();
    // ダイヤ装飾
    ctx.fillStyle = '#f0d060';
    ctx.beginPath();
    ctx.moveTo(W / 2, titleY + 50);
    ctx.lineTo(W / 2 + 5, titleY + 55);
    ctx.lineTo(W / 2, titleY + 60);
    ctx.lineTo(W / 2 - 5, titleY + 55);
    ctx.closePath();
    ctx.fill();

    // 勇者シルエット
    const heroY = H * 0.65;
    ctx.fillStyle = '#1a1a3a';
    // 体
    ctx.fillRect(W / 2 - 8, heroY - 30, 16, 24);
    // 頭
    ctx.beginPath();
    ctx.arc(W / 2, heroY - 38, 10, 0, Math.PI * 2);
    ctx.fill();
    // 剣
    ctx.fillRect(W / 2 + 12, heroY - 50, 3, 35);
    ctx.fillRect(W / 2 + 8, heroY - 20, 11, 3);
    // 足
    ctx.fillRect(W / 2 - 8, heroY - 6, 6, 10);
    ctx.fillRect(W / 2 + 2, heroY - 6, 6, 10);
    // マント（なびく）
    ctx.beginPath();
    ctx.moveTo(W / 2 - 8, heroY - 28);
    ctx.lineTo(W / 2 - 20 - Math.sin(t * 2) * 5, heroY - 10);
    ctx.lineTo(W / 2 - 8, heroY - 8);
    ctx.closePath();
    ctx.fill();

    // 「Press Space」点滅
    if (t > 1.5) {
      const blink = Math.sin(t * 3) > -0.3;
      if (blink) {
        ctx.fillStyle = '#fff';
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS SPACE KEY', W / 2, H - 50);
      }
    }

    // コピーライト
    ctx.fillStyle = '#556';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('29lab.', W / 2, H - 15);
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
    ctx.fillText('ミズキチの冒険', W / 2, 60);
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

  // タイトルメニュー描画（はじめから/つづきから）
  function renderTitleMenu(ctx) {
    const W = Engine.WIDTH, H = Engine.HEIGHT;
    const menuW = 220, menuH = 90;
    const menuX = W / 2 - menuW / 2, menuY = H - 130;

    ctx.fillStyle = 'rgba(0, 0, 30, 0.92)';
    ctx.fillRect(menuX, menuY, menuW, menuH);
    ctx.strokeStyle = '#f0d060'; ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuW, menuH);

    const options = ['はじめから', 'つづきから'];
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    options.forEach((opt, i) => {
      const y = menuY + 35 + i * 32;
      const sel = i === titleCursor;
      ctx.fillStyle = sel ? '#ffe080' : '#fff';
      ctx.fillText(`${sel ? '▶ ' : '　 '}${opt}`, menuX + 20, y);
    });
  }

  Engine.start(update, render);
})();
