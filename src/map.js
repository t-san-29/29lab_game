// マップシステム - タイルマップの定義と描画
const GameMap = (() => {
  const TILES = {
    GRASS: 0, WALL: 1, WATER: 2, PATH: 3, DOOR: 4,
    FLOOR: 5, TREE: 6, BONFIRE: 7, CAVE_WALL: 8, CAVE_FLOOR: 9,
  };

  const TILE_COLORS = {
    [TILES.GRASS]:      '#4a8c3f',
    [TILES.WALL]:       '#6b6b6b',
    [TILES.WATER]:      '#3a7ecf',
    [TILES.PATH]:       '#c4a35a',
    [TILES.DOOR]:       '#8b5e3c',
    [TILES.FLOOR]:      '#b0a080',
    [TILES.TREE]:       '#2d6b2d',
    [TILES.BONFIRE]:    '#4a8c3f',
    [TILES.CAVE_WALL]:  '#2a2a3a',
    [TILES.CAVE_FLOOR]: '#4a4a5a',
  };

  const SOLID_TILES = new Set([TILES.WALL, TILES.WATER, TILES.TREE, TILES.CAVE_WALL]);

  const W = 8, F = 9; // shorthand

  const maps = {
    village: {
      width: 20,
      height: 15,
      data: [
        6,6,6,6,6,6,6,6,6,3,3,3,6,6,6,6,6,6,6,6,
        6,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,6,
        6,0,0,0,0,3,3,3,3,3,3,3,3,0,1,1,1,1,1,6,
        6,0,0,1,1,1,1,3,0,0,0,0,3,0,1,5,5,5,1,6,
        6,0,0,1,5,5,1,3,0,0,0,0,3,0,1,5,5,5,1,6,
        6,0,0,1,5,5,4,3,0,0,0,0,3,0,1,1,4,1,1,6,
        6,0,0,1,1,1,1,3,0,0,0,0,3,0,0,0,3,0,0,6,
        6,0,0,0,0,0,0,3,0,0,0,0,0,0,3,3,3,3,3,3,
        6,0,0,0,0,0,0,3,3,3,0,0,0,0,3,0,0,0,0,6,
        6,0,2,2,0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,6,
        6,0,2,2,0,0,0,0,0,3,3,3,3,3,3,0,0,0,0,6,
        6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
        6,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
        6,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,6,
        6,6,6,6,6,6,6,6,6,3,3,3,6,6,6,6,6,6,6,6,
      ],
      playerStart: { x: 9, y: 9 },
      npcs: [
        { id: 'elder', x: 4, y: 4, name: '村長', color: '#e0c040',
          dialog: [
            'ようこそ、冒険者よ！',
            'ここは「はじまりの村」じゃ。',
            '東のダンジョンには強い魔獣がおる。',
            '北にも不気味な洞窟があるらしい...',
            '草むらでレベルを上げてから挑むんじゃぞ！',
          ]
        },
        { id: 'villager', x: 16, y: 3, name: '村人', color: '#60a0e0',
          dialog: [
            'いい天気ですね！',
            '左下の焚き火で肉を焼けるらしいですよ。',
            'Eキーでステータス、Cキーでクラフトですよ！',
            '北の闇の洞窟には恐ろしい魔物がいるとか...',
          ]
        },
      ],
      exits: [
        { x: 19, y: 7, target: 'dungeon', targetX: 1, targetY: 7 },
        { x: 9, y: 14, target: 'sacred_grove', targetX: 10, targetY: 1 },
        { x: 10, y: 14, target: 'sacred_grove', targetX: 10, targetY: 1 },
        { x: 11, y: 14, target: 'sacred_grove', targetX: 10, targetY: 1 },
        { x: 9, y: 0, target: 'dungeon_north_1', targetX: 10, targetY: 13 },
        { x: 10, y: 0, target: 'dungeon_north_1', targetX: 10, targetY: 13 },
        { x: 11, y: 0, target: 'dungeon_north_1', targetX: 10, targetY: 13 },
      ],
    },
    dungeon: {
      width: 20,
      height: 15,
      data: [
        W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,
        W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,
        W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,
        W,W,W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,
        W,W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,
        W,W,W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,
        W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,
        W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,
        W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,
      ],
      playerStart: { x: 1, y: 7 },
      npcs: [
        { id: 'warning_sign', x: 4, y: 7, name: '看板', type: 'sign', color: '#8b6040',
          dialog: [
            'キケン！この先に魔獣ムラコンがいます。',
            '強すぎるので引き返して下さい',
          ]
        },
        { id: 'murakon', x: 16, y: 7, name: '魔獣ムラコン', type: 'boss', bossId: 'murakon', color: '#8020a0',
          dialog: [
            'グルルル......',
            '愚かな人間め...この洞窟に足を踏み入れるとは！',
            '我が牙の錆にしてくれる！',
          ]
        },
      ],
      exits: [
        { x: 0, y: 6, target: 'village', targetX: 18, targetY: 7 },
        { x: 0, y: 7, target: 'village', targetX: 18, targetY: 7 },
        { x: 0, y: 8, target: 'village', targetX: 18, targetY: 7 },
      ],
    },
    sacred_grove: {
      width: 20,
      height: 15,
      data: [
        6,6,6,6,6,6,6,6,6,3,3,3,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,3,3,3,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,3,3,0,3,3,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,3,3,0,0,0,3,3,6,6,6,6,6,6,
        6,6,6,6,6,6,3,3,0,0,0,0,0,3,3,6,6,6,6,6,
        6,6,6,6,6,3,3,0,0,0,0,0,0,0,3,3,6,6,6,6,
        6,6,6,6,3,3,0,0,0,0,0,0,0,0,0,3,3,6,6,6,
        6,6,6,3,3,0,0,0,0,0,0,0,0,0,0,0,3,3,6,6,
        6,6,6,6,3,3,0,0,0,0,0,0,0,0,0,3,3,6,6,6,
        6,6,6,6,6,3,3,0,0,0,0,0,0,0,3,3,6,6,6,6,
        6,6,6,6,6,6,3,3,0,0,0,0,0,3,3,6,6,6,6,6,
        6,6,6,6,6,6,6,3,3,0,0,0,3,3,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,3,3,0,3,3,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,3,3,3,6,6,6,6,6,6,6,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
      ],
      playerStart: { x: 10, y: 1 },
      npcs: [
        { id: 'holy_sword', x: 10, y: 7, name: 'せいけんタケテーン', type: 'sword', color: '#f0e860',
          dialogFn: () => [
            '...光を放つ剣が、大地に深く突き刺さっている。',
            'この剣からは、とてつもない力を感じる...',
            PlayerData.getName() + 'は 剣に手をかけた！',
            '......ズズズズ......!!',
            'せいけんタケテーン を ひきぬいた！！',
          ]
        },
      ],
      exits: [
        { x: 9, y: 0, target: 'village', targetX: 10, targetY: 13 },
        { x: 10, y: 0, target: 'village', targetX: 10, targetY: 13 },
        { x: 11, y: 0, target: 'village', targetX: 10, targetY: 13 },
      ],
    },
    // === 闇の洞窟 第1層 ===
    dungeon_north_1: {
      width: 20,
      height: 15,
      data: [
        W,W,W,W,W,W,W,W,W,F,F,F,W,W,W,W,W,W,W,W,
        W,W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,W,
        W,W,W,F,F,F,F,F,W,W,W,F,F,F,F,F,F,W,W,W,
        W,W,F,F,F,F,W,F,F,F,F,F,W,F,F,F,F,F,W,W,
        W,F,F,F,F,W,W,F,F,F,F,F,W,W,F,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,W,W,F,F,F,F,F,F,F,F,W,W,F,F,F,W,
        W,F,F,F,F,W,W,F,F,F,F,F,F,W,W,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,
        W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,
        W,W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,W,
        W,W,W,W,W,W,W,W,W,F,F,F,W,W,W,W,W,W,W,W,
      ],
      playerStart: { x: 10, y: 13 },
      npcs: [
        { id: 'dn1_sign', x: 10, y: 11, name: '看板', type: 'sign', color: '#8b6040',
          dialog: [
            'ここは闇の洞窟。強い魔物が住んでいる。',
            '奥に進むほど危険になるぞ。覚悟はいいか？',
          ]
        },
      ],
      exits: [
        { x: 9, y: 14, target: 'village', targetX: 10, targetY: 1 },
        { x: 10, y: 14, target: 'village', targetX: 10, targetY: 1 },
        { x: 11, y: 14, target: 'village', targetX: 10, targetY: 1 },
        { x: 9, y: 0, target: 'dungeon_north_2', targetX: 10, targetY: 13 },
        { x: 10, y: 0, target: 'dungeon_north_2', targetX: 10, targetY: 13 },
        { x: 11, y: 0, target: 'dungeon_north_2', targetX: 10, targetY: 13 },
      ],
    },
    // === 闇の洞窟 第2層 ===
    dungeon_north_2: {
      width: 20,
      height: 15,
      data: [
        W,W,W,W,W,W,W,W,W,F,F,F,W,W,W,W,W,W,W,W,
        W,F,F,F,F,F,W,W,F,F,F,F,W,W,F,F,F,F,F,W,
        W,F,F,F,F,F,F,W,F,F,F,F,W,F,F,F,F,F,F,W,
        W,F,F,2,2,F,F,F,F,F,F,F,F,F,F,2,2,F,F,W,
        W,F,F,2,2,F,F,F,F,F,F,F,F,F,F,2,2,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,2,F,F,F,F,F,F,F,F,F,F,F,F,2,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,
        W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,
        W,W,W,W,W,W,W,W,W,F,F,F,W,W,W,W,W,W,W,W,
      ],
      playerStart: { x: 10, y: 13 },
      npcs: [],
      exits: [
        { x: 9, y: 14, target: 'dungeon_north_1', targetX: 10, targetY: 1 },
        { x: 10, y: 14, target: 'dungeon_north_1', targetX: 10, targetY: 1 },
        { x: 11, y: 14, target: 'dungeon_north_1', targetX: 10, targetY: 1 },
        { x: 9, y: 0, target: 'dungeon_north_3', targetX: 10, targetY: 13 },
        { x: 10, y: 0, target: 'dungeon_north_3', targetX: 10, targetY: 13 },
        { x: 11, y: 0, target: 'dungeon_north_3', targetX: 10, targetY: 13 },
      ],
    },
    // === 闇の洞窟 最深部 ===
    dungeon_north_3: {
      width: 20,
      height: 15,
      data: [
        W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,W,
        W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,
        W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,2,2,F,F,F,F,F,F,F,F,2,2,F,F,F,W,
        W,F,F,F,2,F,F,F,F,F,F,F,F,F,F,2,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,2,F,F,F,F,F,F,F,F,F,F,2,F,F,F,W,
        W,F,F,F,2,2,F,F,F,F,F,F,F,F,2,2,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,
        W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,
        W,W,W,F,F,F,F,F,F,F,F,F,F,F,F,F,F,W,W,W,
        W,W,W,W,W,W,W,W,W,F,F,F,W,W,W,W,W,W,W,W,
      ],
      playerStart: { x: 10, y: 13 },
      npcs: [
        { id: 'dn3_sign', x: 10, y: 10, name: '看板', type: 'sign', color: '#8b6040',
          dialog: [
            'ここは闇の洞窟の最深部。',
            '最強の魔物がうろついている...引き返すなら今のうちだ。',
          ]
        },
        { id: 'oobaan', x: 10, y: 3, name: '闇竜オオバーン', type: 'boss', bossId: 'oobaan', color: '#a01020',
          dialog: [
            'グオオオオオオ......！！',
            'この闇の底にまで辿り着くとはな...人間。',
            'だが...ここがお前の墓場だ！',
            '我が炎で、灰にしてくれる！！',
          ]
        },
      ],
      exits: [
        { x: 9, y: 14, target: 'dungeon_north_2', targetX: 10, targetY: 1 },
        { x: 10, y: 14, target: 'dungeon_north_2', targetX: 10, targetY: 1 },
        { x: 11, y: 14, target: 'dungeon_north_2', targetX: 10, targetY: 1 },
      ],
    },
  };

  let currentMap = null;
  let currentMapName = '';
  let bonfireAnim = 0;

  function load(mapName) {
    currentMap = maps[mapName];
    currentMapName = mapName;
    return currentMap;
  }

  function getCurrentMapName() { return currentMapName; }

  function getTile(x, y) {
    if (!currentMap) return TILES.WALL;
    if (x < 0 || x >= currentMap.width || y < 0 || y >= currentMap.height) return TILES.WALL;
    return currentMap.data[y * currentMap.width + x];
  }

  function isSolid(x, y) { return SOLID_TILES.has(getTile(x, y)); }

  function getExit(x, y) {
    if (!currentMap || !currentMap.exits) return null;
    return currentMap.exits.find(e => e.x === x && e.y === y) || null;
  }

  function render(ctx) {
    if (!currentMap) return;
    const ts = Engine.TILE_SIZE;
    bonfireAnim += 0.05;

    for (let y = 0; y < currentMap.height; y++) {
      for (let x = 0; x < currentMap.width; x++) {
        const tile = getTile(x, y);
        ctx.fillStyle = TILE_COLORS[tile] || '#000';
        ctx.fillRect(x * ts, y * ts, ts, ts);

        if (tile === TILES.GRASS) {
          ctx.fillStyle = '#5a9c4f';
          ctx.fillRect(x * ts + 8, y * ts + 6, 2, 6);
          ctx.fillRect(x * ts + 20, y * ts + 14, 2, 6);
        } else if (tile === TILES.TREE) {
          ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x * ts + 13, y * ts + 18, 6, 14);
          ctx.fillStyle = '#1a5a1a'; ctx.beginPath(); ctx.arc(x * ts + 16, y * ts + 14, 12, 0, Math.PI * 2); ctx.fill();
        } else if (tile === TILES.WATER) {
          ctx.fillStyle = '#5a9eef';
          ctx.fillRect(x * ts + 4, y * ts + 10, 12, 2);
          ctx.fillRect(x * ts + 14, y * ts + 20, 10, 2);
        } else if (tile === TILES.WALL) {
          ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 1;
          ctx.strokeRect(x * ts + 1, y * ts + 1, ts - 2, ts / 2 - 1);
        } else if (tile === TILES.DOOR) {
          ctx.fillStyle = '#a07040'; ctx.fillRect(x * ts + 6, y * ts + 2, ts - 12, ts - 4);
          ctx.fillStyle = '#d4a040'; ctx.beginPath(); ctx.arc(x * ts + ts - 10, y * ts + ts / 2, 3, 0, Math.PI * 2); ctx.fill();
        } else if (tile === TILES.BONFIRE) {
          ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(x * ts + 16, y * ts + 20, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(x * ts + 16, y * ts + 20, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x * ts + 8, y * ts + 18, 16, 4); ctx.fillRect(x * ts + 12, y * ts + 16, 4, 10);
          const f1 = Math.sin(bonfireAnim * 3) * 2, f2 = Math.cos(bonfireAnim * 4) * 2;
          ctx.fillStyle = '#ff4020'; ctx.beginPath(); ctx.ellipse(x * ts + 16, y * ts + 14 + f1, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff8020'; ctx.beginPath(); ctx.ellipse(x * ts + 14 + f2, y * ts + 12 + f1, 4, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffe040'; ctx.beginPath(); ctx.ellipse(x * ts + 16, y * ts + 14 + f2, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffcc66'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('焚き火', x * ts + 16, y * ts - 2);
        } else if (tile === TILES.CAVE_WALL) {
          ctx.fillStyle = '#3a3a4a'; ctx.fillRect(x * ts + 2, y * ts + 2, ts - 4, ts - 4);
          ctx.fillStyle = '#22222f'; ctx.fillRect(x * ts + 4, y * ts + 8, 8, 6); ctx.fillRect(x * ts + 18, y * ts + 16, 6, 8);
        } else if (tile === TILES.CAVE_FLOOR) {
          ctx.fillStyle = '#555568'; ctx.fillRect(x * ts + 10, y * ts + 12, 3, 2); ctx.fillRect(x * ts + 22, y * ts + 22, 2, 2);
        }
      }
    }

    // マップラベル描画
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    if (currentMapName === 'village') {
      ctx.fillStyle = '#ffe080';
      ctx.fillText('→ダンジョン', 19 * ts + ts / 2, 7 * ts - 4);
      ctx.fillText('↓聖なる森', 10 * ts + ts / 2, 14 * ts - 4);
      ctx.fillStyle = '#ff8080';
      ctx.fillText('↑闇の洞窟', 10 * ts + ts / 2, 0 * ts + ts + 10);
    }
    if (currentMapName === 'dungeon') {
      ctx.fillStyle = '#80ffe0';
      ctx.fillText('←村へ戻る', 0 * ts + ts, 6 * ts - 4);
    }
    if (currentMapName === 'sacred_grove') {
      ctx.fillStyle = '#80ffe0';
      ctx.fillText('↑村へ戻る', 10 * ts + ts / 2, 0 * ts + ts + 10);
    }
    if (currentMapName === 'dungeon_north_1') {
      ctx.fillStyle = '#80ffe0';
      ctx.fillText('↓村へ戻る', 10 * ts + ts / 2, 14 * ts - 4);
      ctx.fillStyle = '#ff8080';
      ctx.fillText('↑奥へ進む', 10 * ts + ts / 2, 0 * ts + ts + 10);
      ctx.fillStyle = '#c080ff';
      ctx.fillText('闇の洞窟 第1層', 10 * ts, 1 * ts + 6);
    }
    if (currentMapName === 'dungeon_north_2') {
      ctx.fillStyle = '#80ffe0';
      ctx.fillText('↓戻る', 10 * ts + ts / 2, 14 * ts - 4);
      ctx.fillStyle = '#ff8080';
      ctx.fillText('↑最深部へ', 10 * ts + ts / 2, 0 * ts + ts + 10);
      ctx.fillStyle = '#c080ff';
      ctx.fillText('闇の洞窟 第2層', 10 * ts, 1 * ts + 6);
    }
    if (currentMapName === 'dungeon_north_3') {
      ctx.fillStyle = '#80ffe0';
      ctx.fillText('↓戻る', 10 * ts + ts / 2, 14 * ts - 4);
      ctx.fillStyle = '#ff4040';
      ctx.fillText('闇の洞窟 最深部', 10 * ts, 1 * ts + 6);
    }
  }

  return {
    TILES, load, getTile, isSolid, render, getExit, getCurrentMapName,
    get current() { return currentMap; }
  };
})();
