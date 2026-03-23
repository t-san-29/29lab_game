// ドラクエ風ターン制バトルシステム
const Battle = (() => {
  // === 敵（動物）データ ===
  const ENEMIES = [
    {
      id: 'slime_rabbit', name: 'スライムうさぎ',
      hp: 15, atk: 5, def: 2, exp: 10,
      meat: { id: 'rabbit_meat', name: 'うさぎ肉', desc: 'やわらかくておいしい', healAmount: 5 },
      material: { id: 'rabbit_fur', name: 'うさぎの毛皮', desc: '柔らかい毛皮', dropRate: 0.6 },
      color: '#e8a0c8', draw: drawRabbit,
    },
    {
      id: 'wild_boar', name: 'イノシシ',
      hp: 30, atk: 9, def: 4, exp: 22,
      meat: { id: 'boar_meat', name: 'イノシシ肉', desc: 'ジビエの王様', healAmount: 5 },
      material: { id: 'boar_tusk', name: 'イノシシの牙', desc: '鋭い牙', dropRate: 0.5 },
      color: '#8b6040', draw: drawBoar,
    },
    {
      id: 'wild_chicken', name: 'ヤドリドリ',
      hp: 10, atk: 4, def: 1, exp: 8,
      meat: { id: 'chicken_meat', name: 'とり肉', desc: 'ジューシーなもも肉', healAmount: 5 },
      material: { id: 'chicken_feather', name: 'とりの羽', desc: 'ふわふわの羽', dropRate: 0.7 },
      color: '#e0c060', draw: drawChicken,
    },
    {
      id: 'bear', name: 'ツキノワグマ',
      hp: 50, atk: 14, def: 7, exp: 45,
      meat: { id: 'bear_meat', name: 'クマ肉', desc: '力がみなぎる味', healAmount: 5 },
      material: { id: 'bear_claw', name: 'クマの爪', desc: '鋭く頑丈な爪', dropRate: 0.4 },
      color: '#4a3a2a', draw: drawBear,
    },
    {
      id: 'deer', name: 'シカ',
      hp: 20, atk: 7, def: 3, exp: 15,
      meat: { id: 'deer_meat', name: 'シカ肉', desc: 'さっぱりした赤身', healAmount: 5 },
      material: { id: 'deer_antler', name: 'シカの角', desc: '立派な角', dropRate: 0.5 },
      color: '#b08050', draw: drawDeer,
    },
  ];

  // === ダンジョン敵データ ===
  const DUNGEON_ENEMIES_1 = [
    {
      id: 'shadow_wolf', name: 'シャドウウルフ',
      hp: 80, atk: 22, def: 10, exp: 80,
      meat: { id: 'wolf_meat', name: '狼肉', desc: '野性味あふれる肉', healAmount: 8 },
      material: { id: 'shadow_fang', name: '闇狼の牙', desc: '闇の力を帯びた牙', dropRate: 0.45 },
      color: '#3a2a4a', draw: drawShadowWolf,
    },
    {
      id: 'rock_golem', name: 'ロックゴーレム',
      hp: 150, atk: 20, def: 16, exp: 100,
      meat: { id: 'magic_stone_s', name: '小さな魔石', desc: '淡く光る石', healAmount: 10 },
      material: { id: 'golem_core', name: 'ゴーレムの核', desc: '魔力が凝縮した核', dropRate: 0.35 },
      color: '#6a6a7a', draw: drawGolem,
    },
  ];
  const DUNGEON_ENEMIES_2 = [
    {
      id: 'rock_golem', name: 'ロックゴーレム',
      hp: 150, atk: 20, def: 16, exp: 100,
      meat: { id: 'magic_stone_s', name: '小さな魔石', desc: '淡く光る石', healAmount: 10 },
      material: { id: 'golem_core', name: 'ゴーレムの核', desc: '魔力が凝縮した核', dropRate: 0.35 },
      color: '#6a6a7a', draw: drawGolem,
    },
    {
      id: 'dragon_puppy', name: 'ドラゴンパピー',
      hp: 100, atk: 28, def: 12, exp: 130,
      meat: { id: 'dragon_meat', name: '竜肉', desc: '生命力に満ちた肉', healAmount: 15 },
      material: { id: 'dragon_scale', name: '竜の鱗', desc: '虹色に輝く硬い鱗', dropRate: 0.4 },
      color: '#c04040', draw: drawDragonPuppy,
    },
  ];
  const DUNGEON_ENEMIES_3 = [
    {
      id: 'dragon_puppy', name: 'ドラゴンパピー',
      hp: 100, atk: 28, def: 12, exp: 130,
      meat: { id: 'dragon_meat', name: '竜肉', desc: '生命力に満ちた肉', healAmount: 15 },
      material: { id: 'dragon_scale', name: '竜の鱗', desc: '虹色に輝く硬い鱗', dropRate: 0.4 },
      color: '#c04040', draw: drawDragonPuppy,
    },
    {
      id: 'death_knight', name: 'デスナイト',
      hp: 200, atk: 32, def: 20, exp: 200,
      meat: { id: 'cursed_bone', name: '呪いの骨', desc: '不思議な力で回復する', healAmount: 20 },
      material: { id: 'dark_armor_piece', name: '漆黒の鎧片', desc: '闇の力が宿る鎧の欠片', dropRate: 0.3 },
      color: '#2a1a2a', draw: drawDeathKnight,
    },
  ];

  // ボスデータ
  const BOSSES = {
    murakon: {
      id: 'murakon', name: '魔獣ムラコン',
      hp: 120, atk: 18, def: 8, exp: 150,
      meat: { id: 'murakon_fang', name: 'ムラコンの牙', desc: '魔力を帯びた牙' },
      material: { id: 'murakon_scale', name: 'ムラコンの鱗', desc: '禍々しい鱗', dropRate: 1.0 },
      color: '#8020a0', draw: drawMurakon, isBoss: true,
    },
  };

  // === 描画関数 ===
  function drawRabbit(ctx, cx, cy) {
    ctx.fillStyle = '#e8a0c8';
    ctx.fillRect(cx - 15, cy - 55, 10, 30);
    ctx.fillRect(cx + 5, cy - 55, 10, 30);
    ctx.fillStyle = '#f0c0d8';
    ctx.fillRect(cx - 12, cy - 50, 4, 20);
    ctx.fillRect(cx + 8, cy - 50, 4, 20);
    ctx.fillStyle = '#e8a0c8';
    ctx.beginPath(); ctx.ellipse(cx, cy, 25, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy - 18, 18, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c02040';
    ctx.beginPath(); ctx.arc(cx - 7, cy - 20, 3, 0, Math.PI * 2); ctx.arc(cx + 7, cy - 20, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6080'; ctx.fillRect(cx - 2, cy - 14, 4, 3);
  }

  function drawBoar(ctx, cx, cy) {
    ctx.fillStyle = '#8b6040';
    ctx.beginPath(); ctx.ellipse(cx, cy, 40, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5030';
    ctx.beginPath(); ctx.ellipse(cx - 30, cy - 5, 22, 18, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(cx - 50, cy - 8, 8, 4); ctx.fillRect(cx - 50, cy + 2, 8, 4);
    ctx.fillStyle = '#ff3030'; ctx.beginPath(); ctx.arc(cx - 38, cy - 10, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(cx - 20, cy + 20, 8, 15); ctx.fillRect(cx + 12, cy + 20, 8, 15);
  }

  function drawChicken(ctx, cx, cy) {
    ctx.fillStyle = '#e0c060';
    ctx.beginPath(); ctx.ellipse(cx, cy + 5, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - 18, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e03030';
    ctx.beginPath(); ctx.arc(cx, cy - 32, 6, 0, Math.PI * 2); ctx.arc(cx - 5, cy - 28, 4, 0, Math.PI * 2); ctx.arc(cx + 5, cy - 28, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0a020';
    ctx.beginPath(); ctx.moveTo(cx - 2, cy - 16); ctx.lineTo(cx - 10, cy - 13); ctx.lineTo(cx - 2, cy - 10); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx + 2, cy - 20, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0a020'; ctx.fillRect(cx - 8, cy + 20, 3, 12); ctx.fillRect(cx + 5, cy + 20, 3, 12);
  }

  function drawBear(ctx, cx, cy) {
    ctx.fillStyle = '#4a3a2a';
    ctx.beginPath(); ctx.ellipse(cx, cy + 5, 35, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy - 28, 22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 18, cy - 44, 8, 0, Math.PI * 2); ctx.arc(cx + 18, cy - 44, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0e080'; ctx.beginPath(); ctx.ellipse(cx, cy - 5, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6a5a4a'; ctx.beginPath(); ctx.ellipse(cx, cy - 20, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff2020';
    ctx.beginPath(); ctx.arc(cx - 10, cy - 32, 3, 0, Math.PI * 2); ctx.arc(cx + 10, cy - 32, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(cx - 40, cy - 10, 12, 30); ctx.fillRect(cx + 28, cy - 10, 12, 30);
  }

  function drawDeer(ctx, cx, cy) {
    ctx.fillStyle = '#b08050';
    ctx.beginPath(); ctx.ellipse(cx, cy + 5, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 20, cy - 20, 14, 12, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 25, cy - 32); ctx.lineTo(cx - 30, cy - 55); ctx.lineTo(cx - 40, cy - 50);
    ctx.moveTo(cx - 30, cy - 48); ctx.lineTo(cx - 22, cy - 55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 15, cy - 32); ctx.lineTo(cx - 10, cy - 55); ctx.lineTo(cx, cy - 50);
    ctx.moveTo(cx - 10, cy - 48); ctx.lineTo(cx - 18, cy - 55); ctx.stroke();
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx - 28, cy - 22, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(cx - 15, cy + 22, 6, 18); ctx.fillRect(cx + 10, cy + 22, 6, 18);
  }

  function drawMurakon(ctx, cx, cy) {
    // 巨大な魔獣
    // 体
    ctx.fillStyle = '#4a1060';
    ctx.beginPath(); ctx.ellipse(cx, cy + 10, 50, 40, 0, 0, Math.PI * 2); ctx.fill();
    // 頭
    ctx.fillStyle = '#6020a0';
    ctx.beginPath(); ctx.arc(cx, cy - 35, 30, 0, Math.PI * 2); ctx.fill();
    // 角
    ctx.fillStyle = '#a040e0';
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy - 55); ctx.lineTo(cx - 30, cy - 90); ctx.lineTo(cx - 10, cy - 60);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 20, cy - 55); ctx.lineTo(cx + 30, cy - 90); ctx.lineTo(cx + 10, cy - 60);
    ctx.fill();
    // 目（赤く光る）
    ctx.fillStyle = '#ff0040';
    ctx.beginPath();
    ctx.arc(cx - 12, cy - 40, 5, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy - 40, 5, 0, Math.PI * 2);
    ctx.fill();
    // 目の光
    ctx.fillStyle = '#ff8080';
    ctx.beginPath();
    ctx.arc(cx - 12, cy - 41, 2, 0, Math.PI * 2);
    ctx.arc(cx + 12, cy - 41, 2, 0, Math.PI * 2);
    ctx.fill();
    // 牙
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy - 20); ctx.lineTo(cx - 10, cy - 5); ctx.lineTo(cx - 5, cy - 20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 15, cy - 20); ctx.lineTo(cx + 10, cy - 5); ctx.lineTo(cx + 5, cy - 20);
    ctx.fill();
    // 腕
    ctx.fillStyle = '#4a1060';
    ctx.fillRect(cx - 55, cy - 15, 15, 40);
    ctx.fillRect(cx + 40, cy - 15, 15, 40);
    // 爪
    ctx.fillStyle = '#a040e0';
    ctx.fillRect(cx - 58, cy + 20, 4, 10);
    ctx.fillRect(cx - 52, cy + 22, 4, 10);
    ctx.fillRect(cx + 46, cy + 20, 4, 10);
    ctx.fillRect(cx + 52, cy + 22, 4, 10);
    // オーラ
    const t = performance.now() / 300;
    ctx.strokeStyle = `rgba(160, 40, 255, ${0.3 + Math.sin(t) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy - 10, 60 + Math.sin(t) * 5, 55 + Math.cos(t) * 5, 0, 0, Math.PI * 2); ctx.stroke();
  }

  // === ダンジョン敵の描画関数 ===
  function drawShadowWolf(ctx, cx, cy) {
    // 体
    ctx.fillStyle = '#3a2a4a';
    ctx.beginPath(); ctx.ellipse(cx, cy + 5, 35, 22, 0, 0, Math.PI * 2); ctx.fill();
    // 頭
    ctx.beginPath(); ctx.ellipse(cx - 28, cy - 10, 18, 14, -0.3, 0, 0, Math.PI * 2); ctx.fill();
    // 耳
    ctx.beginPath(); ctx.moveTo(cx - 38, cy - 22); ctx.lineTo(cx - 45, cy - 45); ctx.lineTo(cx - 30, cy - 25); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 25, cy - 22); ctx.lineTo(cx - 28, cy - 42); ctx.lineTo(cx - 18, cy - 25); ctx.fill();
    // 目（赤く光る）
    ctx.fillStyle = '#ff2040';
    ctx.beginPath(); ctx.arc(cx - 35, cy - 14, 3, 0, Math.PI * 2); ctx.arc(cx - 25, cy - 14, 3, 0, Math.PI * 2); ctx.fill();
    // 牙
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 42, cy - 2, 3, 8); ctx.fillRect(cx - 35, cy - 2, 3, 8);
    // 足
    ctx.fillStyle = '#2a1a3a';
    ctx.fillRect(cx - 20, cy + 22, 6, 16); ctx.fillRect(cx + 14, cy + 22, 6, 16);
    // しっぽ
    ctx.strokeStyle = '#3a2a4a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx + 30, cy); ctx.quadraticCurveTo(cx + 50, cy - 20, cx + 45, cy - 35); ctx.stroke();
    // オーラ
    const t = performance.now() / 400;
    ctx.strokeStyle = `rgba(100, 40, 160, ${0.2 + Math.sin(t) * 0.15})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, 45 + Math.sin(t) * 3, 35 + Math.cos(t) * 3, 0, 0, Math.PI * 2); ctx.stroke();
  }

  function drawGolem(ctx, cx, cy) {
    // 体
    ctx.fillStyle = '#6a6a7a';
    ctx.fillRect(cx - 30, cy - 20, 60, 50);
    // 頭
    ctx.fillStyle = '#7a7a8a';
    ctx.fillRect(cx - 18, cy - 45, 36, 30);
    // 目
    ctx.fillStyle = '#40ff80';
    ctx.beginPath(); ctx.arc(cx - 8, cy - 32, 4, 0, Math.PI * 2); ctx.arc(cx + 8, cy - 32, 4, 0, Math.PI * 2); ctx.fill();
    // 腕
    ctx.fillStyle = '#5a5a6a';
    ctx.fillRect(cx - 48, cy - 15, 18, 40); ctx.fillRect(cx + 30, cy - 15, 18, 40);
    // 足
    ctx.fillRect(cx - 22, cy + 28, 16, 18); ctx.fillRect(cx + 6, cy + 28, 16, 18);
    // ひび割れ模様
    ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy - 15); ctx.lineTo(cx - 5, cy + 5); ctx.lineTo(cx + 10, cy + 15); ctx.stroke();
    // 核（光る）
    const t = performance.now() / 300;
    ctx.fillStyle = `rgba(64, 255, 128, ${0.5 + Math.sin(t) * 0.3})`;
    ctx.beginPath(); ctx.arc(cx, cy + 5, 8, 0, Math.PI * 2); ctx.fill();
  }

  function drawDragonPuppy(ctx, cx, cy) {
    // 体
    ctx.fillStyle = '#c04040';
    ctx.beginPath(); ctx.ellipse(cx, cy + 5, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
    // 頭
    ctx.fillStyle = '#d05050';
    ctx.beginPath(); ctx.arc(cx - 5, cy - 22, 16, 0, Math.PI * 2); ctx.fill();
    // 角
    ctx.fillStyle = '#e0a020';
    ctx.beginPath(); ctx.moveTo(cx - 15, cy - 34); ctx.lineTo(cx - 20, cy - 55); ctx.lineTo(cx - 8, cy - 36); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 5, cy - 34); ctx.lineTo(cx + 10, cy - 55); ctx.lineTo(cx + 12, cy - 36); ctx.fill();
    // 目
    ctx.fillStyle = '#ff8000';
    ctx.beginPath(); ctx.arc(cx - 12, cy - 24, 3, 0, Math.PI * 2); ctx.arc(cx + 2, cy - 24, 3, 0, Math.PI * 2); ctx.fill();
    // 翼
    ctx.fillStyle = '#a03030';
    ctx.beginPath(); ctx.moveTo(cx + 15, cy - 10); ctx.lineTo(cx + 55, cy - 30); ctx.lineTo(cx + 50, cy + 5); ctx.lineTo(cx + 25, cy + 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 20, cy - 10); ctx.lineTo(cx - 55, cy - 25); ctx.lineTo(cx - 50, cy + 5); ctx.lineTo(cx - 25, cy + 10); ctx.fill();
    // 足
    ctx.fillStyle = '#903030';
    ctx.fillRect(cx - 15, cy + 22, 8, 14); ctx.fillRect(cx + 7, cy + 22, 8, 14);
    // 火の息
    const t = performance.now() / 200;
    ctx.fillStyle = `rgba(255, 100, 20, ${0.3 + Math.sin(t) * 0.2})`;
    ctx.beginPath(); ctx.ellipse(cx - 5, cy - 6, 4 + Math.sin(t) * 2, 3, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawDeathKnight(ctx, cx, cy) {
    // 鎧（体）
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - 25, cy - 20, 50, 55);
    // 肩当て
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx - 35, cy - 22, 15, 20); ctx.fillRect(cx + 20, cy - 22, 15, 20);
    // トゲ
    ctx.fillStyle = '#4a3060';
    ctx.beginPath(); ctx.moveTo(cx - 35, cy - 22); ctx.lineTo(cx - 42, cy - 38); ctx.lineTo(cx - 28, cy - 22); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 35, cy - 22); ctx.lineTo(cx + 42, cy - 38); ctx.lineTo(cx + 28, cy - 22); ctx.fill();
    // ヘルメット
    ctx.fillStyle = '#2a2a3a';
    ctx.beginPath(); ctx.arc(cx, cy - 35, 18, 0, Math.PI * 2); ctx.fill();
    // バイザー
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(cx - 12, cy - 40, 24, 8);
    // 目（紫の光）
    const t = performance.now() / 300;
    ctx.fillStyle = `rgba(180, 60, 255, ${0.6 + Math.sin(t) * 0.3})`;
    ctx.beginPath(); ctx.arc(cx - 6, cy - 37, 3, 0, Math.PI * 2); ctx.arc(cx + 6, cy - 37, 3, 0, Math.PI * 2); ctx.fill();
    // 剣
    ctx.fillStyle = '#888';
    ctx.fillRect(cx + 30, cy - 50, 4, 60);
    ctx.fillStyle = '#666';
    ctx.fillRect(cx + 24, cy - 2, 16, 4);
    // 足
    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(cx - 18, cy + 33, 12, 14); ctx.fillRect(cx + 6, cy + 33, 12, 14);
    // オーラ
    ctx.strokeStyle = `rgba(140, 40, 200, ${0.25 + Math.sin(t * 0.8) * 0.15})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, 48 + Math.sin(t) * 4, 55 + Math.cos(t) * 4, 0, 0, Math.PI * 2); ctx.stroke();
  }

  // === バトル状態 ===
  let active = false;
  let enemy = null;
  let enemyHp = 0;
  let playerHp = 0;
  let playerMaxHp = 0;
  let playerAtk = 0;
  let playerDef = 0;

  let phase = 'select';
  let cursor = 0;
  let message = '';
  let messageTimer = 0;
  let resultType = '';
  let animTimer = 0;
  let flashEnemy = false;
  let flashPlayer = false;
  let shakeAmount = 0;

  const COMMANDS = ['たたかう', 'どうぐ', 'ぼうぎょ', 'にげる'];
  let defending = false;
  let itemPhase = false; // どうぐ選択中
  let itemCursor = 0;
  let itemList = []; // 戦闘中の回復アイテム一覧

  // プレイヤーステータス
  let level = 1;
  let exp = 0;
  let baseHp = 30;
  let baseAtk = 8;
  let baseDef = 3;
  let currentHp = -1;

  function getMaxHp() { return baseHp + level * 5; }

  function getCurrentHp() {
    if (currentHp < 0) currentHp = getMaxHp();
    return currentHp;
  }

  function heal(amount) {
    if (currentHp < 0) currentHp = getMaxHp();
    const maxHp = getMaxHp();
    const before = currentHp;
    currentHp = Math.min(maxHp, currentHp + amount);
    return currentHp - before;
  }

  function getPlayerStats() {
    return {
      level,
      hp: getCurrentHp(),
      maxHp: getMaxHp(),
      atk: baseAtk + level * 2,
      def: baseDef + level * 1,
      exp,
      nextExp: level * 12,
    };
  }

  function checkLevelUp() {
    const needed = level * 12;
    if (exp >= needed) {
      exp -= needed;
      level++;
      currentHp = getMaxHp();
      return true;
    }
    return false;
  }

  // === バトル開始 ===
  function start(mapName) {
    // ダンジョン別の敵プール
    if (mapName === 'dungeon_north_1') {
      const pool = DUNGEON_ENEMIES_1;
      beginBattle({ ...pool[Math.floor(Math.random() * pool.length)] });
      return;
    }
    if (mapName === 'dungeon_north_2') {
      const pool = DUNGEON_ENEMIES_2;
      beginBattle({ ...pool[Math.floor(Math.random() * pool.length)] });
      return;
    }
    if (mapName === 'dungeon_north_3') {
      const pool = DUNGEON_ENEMIES_3;
      beginBattle({ ...pool[Math.floor(Math.random() * pool.length)] });
      return;
    }

    // 通常フィールド
    let pool = ENEMIES;
    if (level < 5) {
      pool = ENEMIES.filter(e => e.id !== 'bear');
      if (level >= 3 && Math.random() < 0.15) {
        const bear = ENEMIES.find(e => e.id === 'bear');
        beginBattle({ ...bear });
        return;
      }
    }
    const idx = Math.floor(Math.random() * pool.length);
    beginBattle({ ...pool[idx] });
  }

  function startBoss(bossId) {
    const boss = BOSSES[bossId];
    if (!boss) return;
    beginBattle({ ...boss });
  }

  function beginBattle(enemyData) {
    enemy = enemyData;
    enemyHp = enemy.hp;

    const bonus = Equipment.getBonus();
    playerMaxHp = getMaxHp();
    playerHp = getCurrentHp();
    playerAtk = baseAtk + level * 2 + bonus.atk;
    playerDef = baseDef + level * 1 + bonus.def;

    active = true;
    phase = 'select';
    cursor = 0;
    message = `${enemy.name}が あらわれた！`;
    messageTimer = 0;
    resultType = '';
    defending = false;
    itemPhase = false;
    flashEnemy = false;
    flashPlayer = false;
    shakeAmount = 0;
  }

  function isActive() { return active; }

  // === 更新処理 ===
  function update(dt) {
    if (!active) return;
    animTimer += dt;

    if (phase === 'select') {
      if (itemPhase) {
        // どうぐ選択中
        if (Engine.isKeyJustPressed('Escape')) {
          itemPhase = false;
        } else if (itemList.length > 0) {
          if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
            itemCursor = (itemCursor - 1 + itemList.length) % itemList.length;
          }
          if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
            itemCursor = (itemCursor + 1) % itemList.length;
          }
          if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
            useBattleItem(itemList[itemCursor]);
          }
        }
      } else {
        if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
          cursor = (cursor - 1 + COMMANDS.length) % COMMANDS.length;
        }
        if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
          cursor = (cursor + 1) % COMMANDS.length;
        }
        if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
          executeCommand(COMMANDS[cursor]);
        }
      }
    } else if (phase === 'player_attack' || phase === 'enemy_attack') {
      messageTimer += dt;
      if (messageTimer > 0.3) {
        flashEnemy = false; flashPlayer = false; shakeAmount = 0;
      }
      if (messageTimer > 1.2) {
        if (phase === 'player_attack') {
          enemyHp <= 0 ? onWin() : enemyTurn();
        } else if (phase === 'enemy_attack') {
          playerHp <= 0 ? onLose() : (() => { phase = 'select'; defending = false; })();
        }
      }
    } else if (phase === 'result') {
      messageTimer += dt;
      if (messageTimer > 2.0 && (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter'))) {
        active = false;
      }
    }
  }

  function useBattleItem(item) {
    if (item.healAmount > 0) {
      const before = playerHp;
      playerHp = Math.min(playerMaxHp, playerHp + item.healAmount);
      currentHp = playerHp;
      const healed = playerHp - before;
      Inventory.remove(item.id, 1);
      message = `${PlayerData.getName()}は ${item.name}を たべた！\nHPが ${healed} かいふくした！`;
      phase = 'player_attack'; messageTimer = 0;
      itemPhase = false;
    }
  }

  function executeCommand(cmd) {
    if (cmd === 'どうぐ') {
      // 回復アイテム一覧を取得
      itemList = Inventory.getAllWithIds().filter(i => i.healAmount > 0);
      if (itemList.length === 0) {
        message = '使えるどうぐがない...';
        phase = 'player_attack'; messageTimer = 0;
      } else {
        itemCursor = 0;
        itemPhase = true;
      }
      return;
    }
    if (cmd === 'たたかう') {
      const dmg = Math.max(1, playerAtk - enemy.def + Math.floor(Math.random() * 4) - 2);
      enemyHp = Math.max(0, enemyHp - dmg);
      message = `${PlayerData.getName()}の こうげき！\n${enemy.name}に ${dmg} のダメージ！`;
      phase = 'player_attack'; messageTimer = 0; flashEnemy = true; shakeAmount = 5;
    } else if (cmd === 'ぼうぎょ') {
      defending = true;
      message = `${PlayerData.getName()}は みをまもっている！`;
      phase = 'player_attack'; messageTimer = 0;
    } else if (cmd === 'にげる') {
      if (enemy.isBoss) {
        message = 'ボスからは逃げられない！';
        phase = 'player_attack'; messageTimer = 0;
      } else if (Math.random() < 0.5) {
        message = 'うまく にげきれた！';
        phase = 'result'; resultType = 'run'; messageTimer = 0;
      } else {
        message = 'しかし まわりこまれてしまった！';
        phase = 'player_attack'; messageTimer = 0;
      }
    }
  }

  function enemyTurn() {
    const defMod = defending ? playerDef * 2 : playerDef;
    const dmg = Math.max(1, enemy.atk - defMod + Math.floor(Math.random() * 3) - 1);
    playerHp = Math.max(0, playerHp - dmg);
    currentHp = playerHp;
    message = `${enemy.name}の こうげき！\n${PlayerData.getName()}に ${dmg} のダメージ！`;
    phase = 'enemy_attack'; messageTimer = 0; flashPlayer = true; shakeAmount = 3;
  }

  function onWin() {
    exp += enemy.exp;
    const meat = enemy.meat;
    Inventory.add(meat.id, meat.name, meat.desc, meat.healAmount || 0);
    currentHp = playerHp;

    let msg = `${enemy.name}を たおした！\n${meat.name}を てにいれた！  ${enemy.exp}EXP かくとく！`;

    // 素材ドロップ判定
    if (enemy.material && Math.random() < enemy.material.dropRate) {
      Inventory.add(enemy.material.id, enemy.material.name, enemy.material.desc);
      msg += `\n${enemy.material.name}を てにいれた！`;
    }

    if (checkLevelUp()) {
      msg += `\nレベルアップ！ Lv${level} になった！`;
    }

    message = msg;
    phase = 'result'; resultType = 'win'; messageTimer = 0;
  }

  function onLose() {
    currentHp = Math.floor(getMaxHp() / 2);
    message = `${PlayerData.getName()}は たおれてしまった...\nきぜつから もどった。（HPが半分で回復）`;
    phase = 'result'; resultType = 'lose'; messageTimer = 0;
  }

  // === 描画 ===
  function render(ctx) {
    if (!active) return;
    const W = Engine.WIDTH, H = Engine.HEIGHT;

    // 背景
    ctx.fillStyle = enemy.isBoss ? '#1a0a2a' : '#1a2a1a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = enemy.isBoss ? '#2a1a3a' : '#3a5a2a';
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    ctx.fillStyle = enemy.isBoss ? '#3a2a4a' : '#4a6a3a';
    for (let i = 0; i < W; i += 20) { ctx.fillRect(i, H * 0.55, 10, 3); }

    // 敵描画
    const ex = W / 2 + (flashEnemy ? (Math.random() - 0.5) * shakeAmount * 2 : 0);
    const ey = H * 0.35;
    if (!flashEnemy || Math.floor(animTimer * 10) % 2 === 0) {
      enemy.draw(ctx, ex, ey);
    }

    // 敵名とHP
    ctx.fillStyle = enemy.isBoss ? '#e040ff' : '#fff';
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(enemy.name, W / 2, 30);
    const barW = 150, hpRatio = enemyHp / enemy.hp;
    ctx.fillStyle = '#333'; ctx.fillRect(W / 2 - barW / 2, 38, barW, 10);
    ctx.fillStyle = hpRatio > 0.3 ? '#40c040' : '#e04040';
    ctx.fillRect(W / 2 - barW / 2, 38, barW * hpRatio, 10);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - barW / 2, 38, barW, 10);

    // プレイヤーステータス
    const sw = 200, sh = 70;
    const sx = W - sw - 15, sy = H * 0.55 + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, sw, sh);
    ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`Lv${level}  ${PlayerData.getName()}`, sx + 10, sy + 20);
    const phpRatio = playerHp / playerMaxHp;
    ctx.fillText('HP', sx + 10, sy + 42);
    ctx.fillStyle = '#333'; ctx.fillRect(sx + 35, sy + 33, 100, 10);
    ctx.fillStyle = phpRatio > 0.3 ? '#40c040' : '#e04040';
    ctx.fillRect(sx + 35, sy + 33, 100 * phpRatio, 10);
    ctx.fillStyle = '#fff'; ctx.fillText(`${playerHp}/${playerMaxHp}`, sx + 140, sy + 42);
    ctx.fillText(`EXP ${exp}/${level * 12}`, sx + 10, sy + 60);

    if (flashPlayer && Math.floor(animTimer * 10) % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.fillRect(sx, sy, sw, sh);
    }

    // メッセージ
    const mw = W - 30, mh = 70, mx = 15, my = H - mh - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(mx, my, mw, mh);
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
    message.split('\n').forEach((line, i) => { ctx.fillText(line, mx + 14, my + 24 + i * 20); });

    // コマンド
    if (phase === 'select') {
      const cw = 130, ch = 128, ccx = 15, ccy = H - mh - ch - 20;
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(ccx, ccy, cw, ch);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(ccx, ccy, cw, ch);
      ctx.font = '14px sans-serif';
      COMMANDS.forEach((cmd, i) => {
        ctx.fillStyle = i === cursor ? '#f0d060' : '#fff';
        ctx.fillText(`${i === cursor ? '▶' : '　'} ${cmd}`, ccx + 12, ccy + 28 + i * 28);
      });

      // どうぐ選択ウィンドウ
      if (itemPhase) {
        const iw = 220, ih = Math.max(60, 30 + itemList.length * 24);
        const ix = ccx + cw + 10, iy = ccy;
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(ix, iy, iw, ih);
        ctx.strokeStyle = '#80d0ff'; ctx.lineWidth = 2; ctx.strokeRect(ix, iy, iw, ih);
        ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
        if (itemList.length === 0) {
          ctx.fillStyle = '#888';
          ctx.fillText('使えるどうぐがない', ix + 10, iy + 30);
        } else {
          itemList.forEach((item, i) => {
            const sel = i === itemCursor;
            ctx.fillStyle = sel ? '#ffe080' : '#fff';
            ctx.fillText(`${sel ? '▶' : '　'} ${item.name} x${item.count}`, ix + 8, iy + 22 + i * 24);
            ctx.fillStyle = '#ff6080';
            ctx.fillText(`♥+${item.healAmount}`, ix + 170, iy + 22 + i * 24);
          });
        }
        ctx.fillStyle = '#666'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Esc:もどる', ix + iw / 2, iy + ih - 5);
      }
    }

    if (phase === 'result' && messageTimer > 2.0) {
      ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('スペースキーで戻る', W / 2, H - 5);
    }
  }

  function getLastResult() { return resultType; }

  // セーブ/ロード用
  function getSaveData() {
    return { level, exp, currentHp: getCurrentHp() };
  }

  function loadSaveData(data) {
    level = data.level || 1;
    exp = data.exp || 0;
    currentHp = data.currentHp || getMaxHp();
  }

  return { start, startBoss, isActive, update, render, getPlayerStats, heal, getCurrentHp, getMaxHp, getLastResult, getSaveData, loadSaveData };
})();
