// マップシステム - タイルマップの定義と描画
const GameMap = (() => {
  // タイル種類
  const TILES = {
    GRASS: 0,
    WALL: 1,
    WATER: 2,
    PATH: 3,
    DOOR: 4,
    FLOOR: 5,
    TREE: 6,
  };

  // タイルの色
  const TILE_COLORS = {
    [TILES.GRASS]: '#4a8c3f',
    [TILES.WALL]:  '#6b6b6b',
    [TILES.WATER]: '#3a7ecf',
    [TILES.PATH]:  '#c4a35a',
    [TILES.DOOR]:  '#8b5e3c',
    [TILES.FLOOR]: '#b0a080',
    [TILES.TREE]:  '#2d6b2d',
  };

  // 通行不可タイル
  const SOLID_TILES = new Set([TILES.WALL, TILES.WATER, TILES.TREE]);

  // マップデータ (20x15)
  const maps = {
    village: {
      width: 20,
      height: 15,
      data: [
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
        6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
        6,0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0,0,0,6,
        6,0,0,1,1,1,1,3,0,0,0,0,3,0,0,0,0,0,0,6,
        6,0,0,1,5,5,1,3,0,0,0,0,3,0,0,1,1,1,0,6,
        6,0,0,1,5,5,4,3,0,0,0,0,3,0,0,1,5,1,0,6,
        6,0,0,1,1,1,1,3,0,0,0,0,3,3,3,1,4,1,0,6,
        6,0,0,0,0,0,0,3,0,0,0,0,0,0,3,1,1,1,0,6,
        6,0,0,0,0,0,0,3,3,3,0,0,0,0,3,0,0,0,0,6,
        6,0,2,2,0,0,0,0,0,3,0,0,0,0,3,0,0,0,0,6,
        6,0,2,2,0,0,0,0,0,3,3,3,3,3,3,0,0,0,0,6,
        6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
        6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
        6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,
        6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,
      ],
      playerStart: { x: 9, y: 9 },
      npcs: [
        { id: 'elder', x: 4, y: 4, name: '村長', color: '#e0c040',
          dialog: [
            'ようこそ、冒険者よ！',
            'ここは「はじまりの村」じゃ。',
            '東の森には不思議なダンジョンがあるらしい...',
            '気をつけて行くのじゃぞ！',
          ]
        },
        { id: 'villager', x: 16, y: 5, name: '村人', color: '#60a0e0',
          dialog: [
            'いい天気ですね！',
            '池の魚がよく釣れるんですよ。',
          ]
        },
      ],
    },
  };

  let currentMap = null;

  function load(mapName) {
    currentMap = maps[mapName];
    return currentMap;
  }

  function getTile(x, y) {
    if (!currentMap) return TILES.WALL;
    if (x < 0 || x >= currentMap.width || y < 0 || y >= currentMap.height) return TILES.WALL;
    return currentMap.data[y * currentMap.width + x];
  }

  function isSolid(x, y) {
    return SOLID_TILES.has(getTile(x, y));
  }

  function render(ctx) {
    if (!currentMap) return;
    const ts = Engine.TILE_SIZE;
    for (let y = 0; y < currentMap.height; y++) {
      for (let x = 0; x < currentMap.width; x++) {
        const tile = getTile(x, y);
        ctx.fillStyle = TILE_COLORS[tile] || '#000';
        ctx.fillRect(x * ts, y * ts, ts, ts);

        // タイルの装飾
        if (tile === TILES.GRASS) {
          ctx.fillStyle = '#5a9c4f';
          ctx.fillRect(x * ts + 8, y * ts + 6, 2, 6);
          ctx.fillRect(x * ts + 20, y * ts + 14, 2, 6);
        } else if (tile === TILES.TREE) {
          ctx.fillStyle = '#5a3a1a';
          ctx.fillRect(x * ts + 13, y * ts + 18, 6, 14);
          ctx.fillStyle = '#1a5a1a';
          ctx.beginPath();
          ctx.arc(x * ts + 16, y * ts + 14, 12, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === TILES.WATER) {
          ctx.fillStyle = '#5a9eef';
          ctx.fillRect(x * ts + 4, y * ts + 10, 12, 2);
          ctx.fillRect(x * ts + 14, y * ts + 20, 10, 2);
        } else if (tile === TILES.WALL) {
          ctx.strokeStyle = '#5a5a5a';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * ts + 1, y * ts + 1, ts - 2, ts / 2 - 1);
        } else if (tile === TILES.DOOR) {
          ctx.fillStyle = '#a07040';
          ctx.fillRect(x * ts + 6, y * ts + 2, ts - 12, ts - 4);
          ctx.fillStyle = '#d4a040';
          ctx.beginPath();
          ctx.arc(x * ts + ts - 10, y * ts + ts / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  return { TILES, load, getTile, isSolid, render, get current() { return currentMap; } };
})();
