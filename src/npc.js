// NPC・会話システム
const NPC = (() => {
  let npcs = [];
  let activeDialog = null;  // { npc, lines, index }

  function init(npcData) {
    npcs = npcData.map(n => ({ ...n }));
  }

  function getAt(x, y) {
    return npcs.find(n => n.x === x && n.y === y) || null;
  }

  function isDialogActive() {
    return activeDialog !== null;
  }

  function update() {
    if (activeDialog) {
      // スペースキーで次のセリフ / 会話終了
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        activeDialog.index++;
        if (activeDialog.index >= activeDialog.lines.length) {
          activeDialog = null;
        }
      }
      return;
    }

    // スペースキーで目の前のNPCに話しかける
    if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
      const facing = Player.getFacing();
      const npc = getAt(facing.x, facing.y);
      if (npc) {
        activeDialog = { npc, lines: npc.dialog, index: 0 };
      }
    }
  }

  function renderNPCs(ctx) {
    const ts = Engine.TILE_SIZE;
    for (const npc of npcs) {
      const px = npc.x * ts;
      const py = npc.y * ts;

      // 体
      ctx.fillStyle = npc.color || '#aaa';
      ctx.fillRect(px + 6, py + 10, 20, 18);

      // 頭
      ctx.fillStyle = '#ffcc99';
      ctx.fillRect(px + 8, py + 2, 16, 12);

      // 目
      ctx.fillStyle = '#333';
      ctx.fillRect(px + 10, py + 6, 3, 3);
      ctx.fillRect(px + 19, py + 6, 3, 3);

      // 名前
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, px + ts / 2, py - 2);
    }
  }

  function renderDialog(ctx) {
    if (!activeDialog) return;

    const W = Engine.WIDTH;
    const H = Engine.HEIGHT;
    const boxH = 100;
    const boxY = H - boxH - 10;

    // ダイアログボックス
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(10, boxY, W - 20, boxH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, boxY, W - 20, boxH);

    // 名前
    ctx.fillStyle = '#f0d060';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(activeDialog.npc.name, 24, boxY + 22);

    // セリフ
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(activeDialog.lines[activeDialog.index], 24, boxY + 50);

    // 続きの案内
    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    const hint = activeDialog.index < activeDialog.lines.length - 1
      ? '▼ スペースキーで次へ'
      : '■ スペースキーで閉じる';
    ctx.fillText(hint, W - 24, boxY + boxH - 12);
  }

  return { init, getAt, isDialogActive, update, renderNPCs, renderDialog };
})();
