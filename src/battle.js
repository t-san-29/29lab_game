// ドラクエ風ターン制バトルシステム
const Battle = (() => {
  // === 敵（動物）データ ===
  const ENEMIES = [
    {
      id: 'slime_rabbit', name: 'スライムうさぎ',
      hp: 12, atk: 3, def: 1, exp: 5,
      meat: { id: 'rabbit_meat', name: 'うさぎ肉', desc: 'やわらかくておいしい' },
      color: '#e8a0c8', draw: drawRabbit,
    },
    {
      id: 'wild_boar', name: 'イノシシ',
      hp: 25, atk: 6, def: 3, exp: 12,
      meat: { id: 'boar_meat', name: 'イノシシ肉', desc: 'ジビエの王様' },
      color: '#8b6040', draw: drawBoar,
    },
    {
      id: 'wild_chicken', name: 'ヤドリドリ',
      hp: 8, atk: 2, def: 0, exp: 3,
      meat: { id: 'chicken_meat', name: 'とり肉', desc: 'ジューシーなもも肉' },
      color: '#e0c060', draw: drawChicken,
    },
    {
      id: 'bear', name: 'ツキノワグマ',
      hp: 45, atk: 10, def: 5, exp: 25,
      meat: { id: 'bear_meat', name: 'クマ肉', desc: '力がみなぎる味' },
      color: '#4a3a2a', draw: drawBear,
    },
    {
      id: 'deer', name: 'シカ',
      hp: 18, atk: 4, def: 2, exp: 8,
      meat: { id: 'deer_meat', name: 'シカ肉', desc: 'さっぱりした赤身' },
      color: '#b08050', draw: drawDeer,
    },
  ];

  // === 描画関数（ドット絵風） ===
  function drawRabbit(ctx, cx, cy) {
    // 耳
    ctx.fillStyle = '#e8a0c8';
    ctx.fillRect(cx - 15, cy - 55, 10, 30);
    ctx.fillRect(cx + 5, cy - 55, 10, 30);
    // 耳の内側
    ctx.fillStyle = '#f0c0d8';
    ctx.fillRect(cx - 12, cy - 50, 4, 20);
    ctx.fillRect(cx + 8, cy - 50, 4, 20);
    // 体
    ctx.fillStyle = '#e8a0c8';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 25, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // 顔
    ctx.beginPath();
    ctx.ellipse(cx, cy - 18, 18, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    // 目
    ctx.fillStyle = '#c02040';
    ctx.beginPath();
    ctx.arc(cx - 7, cy - 20, 3, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy - 20, 3, 0, Math.PI * 2);
    ctx.fill();
    // 鼻
    ctx.fillStyle = '#ff6080';
    ctx.fillRect(cx - 2, cy - 14, 4, 3);
  }

  function drawBoar(ctx, cx, cy) {
    // 体
    ctx.fillStyle = '#8b6040';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 40, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    // 頭
    ctx.fillStyle = '#7a5030';
    ctx.beginPath();
    ctx.ellipse(cx - 30, cy - 5, 22, 18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // 牙
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 50, cy - 8, 8, 4);
    ctx.fillRect(cx - 50, cy + 2, 8, 4);
    // 目
    ctx.fillStyle = '#ff3030';
    ctx.beginPath();
    ctx.arc(cx - 38, cy - 10, 3, 0, Math.PI * 2);
    ctx.fill();
    // 足
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(cx - 20, cy + 20, 8, 15);
    ctx.fillRect(cx + 12, cy + 20, 8, 15);
  }

  function drawChicken(ctx, cx, cy) {
    // 体
    ctx.fillStyle = '#e0c060';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // 頭
    ctx.fillStyle = '#e0c060';
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 12, 0, Math.PI * 2);
    ctx.fill();
    // トサカ
    ctx.fillStyle = '#e03030';
    ctx.beginPath();
    ctx.arc(cx, cy - 32, 6, 0, Math.PI * 2);
    ctx.arc(cx - 5, cy - 28, 4, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 28, 4, 0, Math.PI * 2);
    ctx.fill();
    // くちばし
    ctx.fillStyle = '#f0a020';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy - 16);
    ctx.lineTo(cx - 10, cy - 13);
    ctx.lineTo(cx - 2, cy - 10);
    ctx.fill();
    // 目
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 20, 2, 0, Math.PI * 2);
    ctx.fill();
    // 足
    ctx.fillStyle = '#f0a020';
    ctx.fillRect(cx - 8, cy + 20, 3, 12);
    ctx.fillRect(cx + 5, cy + 20, 3, 12);
  }

  function drawBear(ctx, cx, cy) {
    // 体
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 35, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    // 頭
    ctx.beginPath();
    ctx.arc(cx, cy - 28, 22, 0, Math.PI * 2);
    ctx.fill();
    // 耳
    ctx.beginPath();
    ctx.arc(cx - 18, cy - 44, 8, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy - 44, 8, 0, Math.PI * 2);
    ctx.fill();
    // 月の輪
    ctx.fillStyle = '#f0e080';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 5, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // 口元
    ctx.fillStyle = '#6a5a4a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // 目
    ctx.fillStyle = '#ff2020';
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 32, 3, 0, Math.PI * 2);
    ctx.arc(cx + 10, cy - 32, 3, 0, Math.PI * 2);
    ctx.fill();
    // 腕
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(cx - 40, cy - 10, 12, 30);
    ctx.fillRect(cx + 28, cy - 10, 12, 30);
  }

  function drawDeer(ctx, cx, cy) {
    // 体
    ctx.fillStyle = '#b08050';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // 頭
    ctx.beginPath();
    ctx.ellipse(cx - 20, cy - 20, 14, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // 角
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy - 32);
    ctx.lineTo(cx - 30, cy - 55);
    ctx.lineTo(cx - 40, cy - 50);
    ctx.moveTo(cx - 30, cy - 48);
    ctx.lineTo(cx - 22, cy - 55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 32);
    ctx.lineTo(cx - 10, cy - 55);
    ctx.lineTo(cx, cy - 50);
    ctx.moveTo(cx - 10, cy - 48);
    ctx.lineTo(cx - 18, cy - 55);
    ctx.stroke();
    // 目
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - 28, cy - 22, 2, 0, Math.PI * 2);
    ctx.fill();
    // 足
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(cx - 15, cy + 22, 6, 18);
    ctx.fillRect(cx + 10, cy + 22, 6, 18);
  }

  // === バトル状態 ===
  let active = false;
  let enemy = null;      // 現在の敵インスタンス
  let enemyHp = 0;
  let playerHp = 0;
  let playerMaxHp = 0;
  let playerAtk = 0;
  let playerDef = 0;

  let phase = 'select';  // select, player_attack, enemy_attack, result
  let cursor = 0;
  let message = '';
  let messageTimer = 0;
  let resultType = '';    // 'win', 'lose', 'run'
  let animTimer = 0;
  let flashEnemy = false;
  let flashPlayer = false;
  let shakeAmount = 0;

  const COMMANDS = ['たたかう', 'ぼうぎょ', 'にげる'];
  let defending = false;

  // プレイヤーステータス（簡易レベルシステム）
  let level = 1;
  let exp = 0;
  let baseHp = 30;
  let baseAtk = 8;
  let baseDef = 3;

  function getPlayerStats() {
    return {
      level,
      hp: baseHp + level * 5,
      atk: baseAtk + level * 2,
      def: baseDef + level * 1,
      exp,
      nextExp: level * 20,
    };
  }

  function checkLevelUp() {
    const needed = level * 20;
    if (exp >= needed) {
      exp -= needed;
      level++;
      return true;
    }
    return false;
  }

  // === バトル開始 ===
  function start() {
    const idx = Math.floor(Math.random() * ENEMIES.length);
    enemy = { ...ENEMIES[idx] };
    enemyHp = enemy.hp;

    const stats = getPlayerStats();
    playerMaxHp = stats.hp;
    playerHp = stats.hp;
    playerAtk = stats.atk;
    playerDef = stats.def;

    active = true;
    phase = 'select';
    cursor = 0;
    message = `${enemy.name}が あらわれた！`;
    messageTimer = 0;
    resultType = '';
    defending = false;
    flashEnemy = false;
    flashPlayer = false;
    shakeAmount = 0;
  }

  function isActive() {
    return active;
  }

  // === 更新処理 ===
  function update(dt) {
    if (!active) return;

    animTimer += dt;

    if (phase === 'select') {
      if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
        cursor = (cursor - 1 + COMMANDS.length) % COMMANDS.length;
      }
      if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
        cursor = (cursor + 1) % COMMANDS.length;
      }
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        executeCommand(COMMANDS[cursor]);
      }
    } else if (phase === 'player_attack' || phase === 'enemy_attack') {
      messageTimer += dt;
      if (messageTimer > 0.3) {
        flashEnemy = false;
        flashPlayer = false;
        shakeAmount = 0;
      }
      if (messageTimer > 1.2) {
        if (phase === 'player_attack') {
          if (enemyHp <= 0) {
            onWin();
          } else {
            enemyTurn();
          }
        } else if (phase === 'enemy_attack') {
          if (playerHp <= 0) {
            onLose();
          } else {
            phase = 'select';
            defending = false;
          }
        }
      }
    } else if (phase === 'result') {
      messageTimer += dt;
      if (messageTimer > 2.0) {
        if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
          active = false;
        }
      }
    }
  }

  function executeCommand(cmd) {
    if (cmd === 'たたかう') {
      const dmg = Math.max(1, playerAtk - enemy.def + Math.floor(Math.random() * 4) - 2);
      enemyHp = Math.max(0, enemyHp - dmg);
      message = `プレイヤーの こうげき！\n${enemy.name}に ${dmg} のダメージ！`;
      phase = 'player_attack';
      messageTimer = 0;
      flashEnemy = true;
      shakeAmount = 5;
    } else if (cmd === 'ぼうぎょ') {
      defending = true;
      message = 'プレイヤーは みをまもっている！';
      phase = 'player_attack';
      messageTimer = 0;
    } else if (cmd === 'にげる') {
      if (Math.random() < 0.5) {
        message = 'うまく にげきれた！';
        phase = 'result';
        resultType = 'run';
        messageTimer = 0;
      } else {
        message = 'しかし まわりこまれてしまった！';
        phase = 'player_attack';
        messageTimer = 0;
      }
    }
  }

  function enemyTurn() {
    const defMod = defending ? playerDef * 2 : playerDef;
    const dmg = Math.max(1, enemy.atk - defMod + Math.floor(Math.random() * 3) - 1);
    playerHp = Math.max(0, playerHp - dmg);
    message = `${enemy.name}の こうげき！\nプレイヤーに ${dmg} のダメージ！`;
    phase = 'enemy_attack';
    messageTimer = 0;
    flashPlayer = true;
    shakeAmount = 3;
  }

  function onWin() {
    exp += enemy.exp;
    const meat = enemy.meat;
    Inventory.add(meat.id, meat.name, meat.desc);

    let msg = `${enemy.name}を たおした！\n${meat.name}を てにいれた！  ${enemy.exp}EXP かくとく！`;

    if (checkLevelUp()) {
      msg += `\n🎉 レベルアップ！ Lv${level} になった！`;
    }

    message = msg;
    phase = 'result';
    resultType = 'win';
    messageTimer = 0;
  }

  function onLose() {
    message = 'プレイヤーは たおれてしまった...\nきぜつから もどった。';
    phase = 'result';
    resultType = 'lose';
    messageTimer = 0;
  }

  // === 描画 ===
  function render(ctx) {
    if (!active) return;

    const W = Engine.WIDTH;
    const H = Engine.HEIGHT;

    // バトル背景
    ctx.fillStyle = '#1a2a1a';
    ctx.fillRect(0, 0, W, H);

    // 地面
    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    ctx.fillStyle = '#4a6a3a';
    for (let i = 0; i < W; i += 20) {
      ctx.fillRect(i, H * 0.55, 10, 3);
    }

    // 敵の描画
    const ex = W / 2 + (flashEnemy ? (Math.random() - 0.5) * shakeAmount * 2 : 0);
    const ey = H * 0.35;
    if (!flashEnemy || Math.floor(animTimer * 10) % 2 === 0) {
      enemy.draw(ctx, ex, ey);
    }

    // 敵HP
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.name, W / 2, 30);
    // HPバー
    const barW = 150;
    const hpRatio = enemyHp / enemy.hp;
    ctx.fillStyle = '#333';
    ctx.fillRect(W / 2 - barW / 2, 38, barW, 10);
    ctx.fillStyle = hpRatio > 0.3 ? '#40c040' : '#e04040';
    ctx.fillRect(W / 2 - barW / 2, 38, barW * hpRatio, 10);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.strokeRect(W / 2 - barW / 2, 38, barW, 10);

    // プレイヤーステータスウィンドウ
    const sw = 200, sh = 70;
    const sx = W - sw - 15, sy = H * 0.55 + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sw, sh);

    const stats = getPlayerStats();
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv${level}  プレイヤー`, sx + 10, sy + 20);

    // プレイヤーHP
    const phpRatio = playerHp / playerMaxHp;
    ctx.fillText(`HP`, sx + 10, sy + 42);
    ctx.fillStyle = '#333';
    ctx.fillRect(sx + 35, sy + 33, 100, 10);
    ctx.fillStyle = phpRatio > 0.3 ? '#40c040' : '#e04040';
    ctx.fillRect(sx + 35, sy + 33, 100 * phpRatio, 10);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${playerHp}/${playerMaxHp}`, sx + 140, sy + 42);

    ctx.fillText(`EXP ${exp}/${stats.nextExp}`, sx + 10, sy + 60);

    // プレイヤーのフラッシュ
    if (flashPlayer && Math.floor(animTimer * 10) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(sx, sy, sw, sh);
    }

    // メッセージウィンドウ
    const mw = W - 30, mh = 70;
    const mx = 15, my = H - mh - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(mx, my, mw, mh);

    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    const lines = message.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, mx + 14, my + 24 + i * 20);
    });

    // コマンド選択
    if (phase === 'select') {
      const cw = 130, ch = 100;
      const cx = 15, cy = H - mh - ch - 20;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(cx, cy, cw, ch);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, cw, ch);

      ctx.font = '14px sans-serif';
      COMMANDS.forEach((cmd, i) => {
        ctx.fillStyle = i === cursor ? '#f0d060' : '#fff';
        ctx.fillText(`${i === cursor ? '▶' : '　'} ${cmd}`, cx + 12, cy + 28 + i * 28);
      });
    }

    // リザルト時のヒント
    if (phase === 'result' && messageTimer > 2.0) {
      ctx.fillStyle = '#aaa';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('スペースキーで戻る', W / 2, H - 5);
    }
  }

  return { start, isActive, update, render, getPlayerStats };
})();
