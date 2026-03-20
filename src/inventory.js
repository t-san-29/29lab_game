// インベントリ（所持品）システム
const Inventory = (() => {
  const items = {}; // { itemId: { name, count, desc } }
  let showUI = false;

  function add(id, name, desc) {
    if (items[id]) {
      items[id].count++;
    } else {
      items[id] = { name, count: 1, desc };
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

  function toggle() {
    showUI = !showUI;
  }

  function isOpen() {
    return showUI;
  }

  function close() {
    showUI = false;
  }

  function update() {
    if (Engine.isKeyJustPressed('i') || Engine.isKeyJustPressed('I')) {
      toggle();
    }
    if (showUI && Engine.isKeyJustPressed('Escape')) {
      close();
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
    const allItems = getAll();
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';

    if (allItems.length === 0) {
      ctx.fillStyle = '#888';
      ctx.fillText('何も持っていない...', pad + 20, pad + 65);
    } else {
      allItems.forEach((item, i) => {
        const y = pad + 60 + i * 28;
        ctx.fillStyle = '#fff';
        ctx.fillText(`${item.name}`, pad + 20, y);
        ctx.fillStyle = '#aaa';
        ctx.fillText(`x${item.count}`, pad + 180, y);
        ctx.fillStyle = '#888';
        ctx.fillText(item.desc, pad + 220, y);
      });
    }

    // 閉じるヒント
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Iキーで閉じる', W / 2, H - pad - 10);
  }

  return { add, remove, hasItem, getItem, getAll, isOpen, close, update, render };
})();
