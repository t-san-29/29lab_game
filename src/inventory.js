// インベントリ（所持品）システム
const Inventory = (() => {
  const items = {}; // { itemId: { name, count, desc, healAmount } }
  let showUI = false;
  let cursor = 0;
  let useMessage = '';
  let useMessageTimer = 0;

  function add(id, name, desc, healAmount) {
    if (items[id]) {
      items[id].count++;
    } else {
      items[id] = { name, count: 1, desc, healAmount: healAmount || 0 };
    }
  }

  function remove(id, amount) {
    if (!items[id]) return false;
    items[id].count -= amount;
    if (items[id].count <= 0) {
      delete items[id];
    }
    return true;
  }

  function hasItem(id) {
    return !!items[id] && items[id].count > 0;
  }

  function getItem(id) {
    return items[id] || null;
  }

  function getAll() {
    return Object.values(items);
  }

  function getAllWithIds() {
    return Object.entries(items).map(([id, item]) => ({ id, ...item }));
  }

  function toggle() {
    showUI = !showUI;
    if (showUI) {
      cursor = 0;
      useMessage = '';
    }
  }

  function isOpen() {
    return showUI;
  }

  function close() {
    showUI = false;
  }

  function useItem(itemData) {
    if (itemData.healAmount && itemData.healAmount > 0) {
      const healed = Battle.heal(itemData.healAmount);
      if (healed > 0) {
        remove(itemData.id, 1);
        useMessage = `${itemData.name}を使った！ HPが${healed}回復した！`;
        useMessageTimer = 2.0;
      } else {
        useMessage = 'HPは満タンだ！';
        useMessageTimer = 1.5;
      }
    } else {
      useMessage = 'このアイテムは使えない...';
      useMessageTimer = 1.5;
    }
  }

  function update() {
    if (useMessageTimer > 0) {
      useMessageTimer -= 0.016;
      if (useMessageTimer <= 0) {
        useMessage = '';
      }
    }

    if (Engine.isKeyJustPressed('i') || Engine.isKeyJustPressed('I')) {
      toggle();
    }
    if (showUI && Engine.isKeyJustPressed('Escape')) {
      close();
    }

    if (!showUI) return;

    const allItems = getAllWithIds();
    if (allItems.length === 0) return;

    if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
      cursor = (cursor - 1 + allItems.length) % allItems.length;
    }
    if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
      cursor = (cursor + 1) % allItems.length;
    }
    if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
      if (cursor < allItems.length) {
        useItem(allItems[cursor]);
        // アイテムが消えた場合にカーソル調整
        const newItems = getAllWithIds();
        if (cursor >= newItems.length) {
          cursor = Math.max(0, newItems.length - 1);
        }
      }
    }
  }

  function render(ctx) {
    if (!showUI) return;

    const W = Engine.WIDTH;
    const H = Engine.HEIGHT;
    const pad = 30;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);
    ctx.strokeStyle = '#c0a050';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

    // タイトル
    ctx.fillStyle = '#f0d060';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('もちもの', W / 2, pad + 30);

    // アイテム一覧
    const allItems = getAllWithIds();
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';

    if (allItems.length === 0) {
      ctx.fillStyle = '#888';
      ctx.fillText('何も持っていない...', pad + 20, pad + 65);
    } else {
      allItems.forEach((item, i) => {
        const y = pad + 60 + i * 28;
        const selected = i === cursor;
        ctx.fillStyle = selected ? '#ffe080' : '#fff';
        ctx.fillText(`${selected ? '▶' : '　'} ${item.name}`, pad + 10, y);
        ctx.fillStyle = '#aaa';
        ctx.fillText(`x${item.count}`, pad + 180, y);
        ctx.fillStyle = '#888';
        ctx.fillText(item.desc, pad + 220, y);
        // 回復アイテムにはハートマーク
        if (item.healAmount > 0) {
          ctx.fillStyle = '#ff6080';
          ctx.fillText(`♥+${item.healAmount}`, pad + 440, y);
        }
      });
    }

    // 使用メッセージ
    if (useMessage) {
      const msgW = 400, msgH = 40;
      const msgX = W / 2 - msgW / 2, msgY = H - pad - 70;
      ctx.fillStyle = 'rgba(0, 80, 0, 0.9)';
      ctx.fillRect(msgX, msgY, msgW, msgH);
      ctx.strokeStyle = '#80ff80';
      ctx.lineWidth = 1;
      ctx.strokeRect(msgX, msgY, msgW, msgH);
      ctx.fillStyle = '#fff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(useMessage, W / 2, msgY + 26);
    }

    // 操作ヒント
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓:選択  Space:使う  Iキーで閉じる', W / 2, H - pad - 10);

    // HP表示
    const stats = Battle.getPlayerStats();
    ctx.fillStyle = '#80d0ff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`HP: ${stats.hp} / ${stats.maxHp}`, W - pad - 10, pad + 30);
  }

  return { add, remove, hasItem, getItem, getAll, getAllWithIds, isOpen, close, update, render };
})();
