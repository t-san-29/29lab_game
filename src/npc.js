// NPC・会話・モノローグシステム
const NPC = (() => {
  let npcs = [];
  let activeDialog = null;
  let lastCompletedNpc = null; // 最後に会話が終わったNPC

  function init(npcData) {
    npcs = npcData.map(n => ({ ...n }));
  }

  function removeNpc(npcId) {
    npcs = npcs.filter(n => n.id !== npcId);
  }

  function getAt(x, y) {
    return npcs.find(n => n.x === x && n.y === y) || null;
  }

  function isDialogActive() {
    return activeDialog !== null;
  }

  function showMonologue(lines) {
    activeDialog = {
      npc: { name: PlayerData.getName() },
      lines: lines,
      index: 0,
    };
  }

  // ボス会話が終わったかチェック（呼ぶと消費される）
  function consumeCompletedBoss() {
    if (lastCompletedNpc && lastCompletedNpc.type === 'boss') {
      const npc = lastCompletedNpc;
      lastCompletedNpc = null;
      return npc;
    }
    lastCompletedNpc = null;
    return null;
  }

  // 特定タイプの会話完了をチェック（呼ぶと消費される）
  function consumeCompleted(type) {
    if (lastCompletedNpc && lastCompletedNpc.type === type) {
      const npc = lastCompletedNpc;
      lastCompletedNpc = null;
      return npc;
    }
    return null;
  }

  function update() {
    if (activeDialog) {
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        activeDialog.index++;
        if (activeDialog.index >= activeDialog.lines.length) {
          lastCompletedNpc = activeDialog.npc;
          activeDialog = null;
        }
      }
      return;
    }

    if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
      const facing = Player.getFacing();
      const npc = getAt(facing.x, facing.y);
      if (npc) {
        const lines = npc.dialogFn ? npc.dialogFn() : npc.dialog;
        activeDialog = { npc, lines, index: 0 };
      }
    }
  }

  function renderNPCs(ctx) {
    const ts = Engine.TILE_SIZE;
    for (const npc of npcs) {
      const px = npc.x * ts;
      const py = npc.y * ts;

      if (npc.type === 'sign') {
        // 看板
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(px + 13, py + 16, 6, 16);
        ctx.fillStyle = '#a07040'; ctx.fillRect(px + 4, py + 4, 24, 16);
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1; ctx.strokeRect(px + 4, py + 4, 24, 16);
        ctx.fillStyle = '#fff'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('!注意!', px + ts / 2, py + 16);
      } else if (npc.type === 'boss') {
        // ボスNPC（大きく描画）
        ctx.fillStyle = '#4a1060';
        ctx.beginPath(); ctx.ellipse(px + 16, py + 18, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6020a0';
        ctx.beginPath(); ctx.arc(px + 16, py + 6, 10, 0, Math.PI * 2); ctx.fill();
        // 角
        ctx.fillStyle = '#a040e0';
        ctx.beginPath(); ctx.moveTo(px + 8, py); ctx.lineTo(px + 4, py - 10); ctx.lineTo(px + 12, py + 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(px + 24, py); ctx.lineTo(px + 28, py - 10); ctx.lineTo(px + 20, py + 2); ctx.fill();
        // 目
        ctx.fillStyle = '#ff0040';
        ctx.beginPath(); ctx.arc(px + 12, py + 4, 2, 0, Math.PI * 2); ctx.arc(px + 20, py + 4, 2, 0, Math.PI * 2); ctx.fill();
        // オーラ
        const t = performance.now() / 300;
        ctx.strokeStyle = `rgba(160, 40, 255, ${0.3 + Math.sin(t) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(px + 16, py + 12, 16 + Math.sin(t) * 2, 14 + Math.cos(t) * 2, 0, 0, Math.PI * 2); ctx.stroke();
      } else if (npc.type === 'sword') {
        // 聖剣（地面に突き刺さった剣）
        const st = performance.now() / 500;
        // 光の柱エフェクト
        const glowAlpha = 0.15 + Math.sin(st) * 0.1;
        ctx.fillStyle = `rgba(255, 232, 96, ${glowAlpha})`;
        ctx.fillRect(px + 10, py - 20, 12, 52);
        // 刀身
        ctx.fillStyle = '#e0e8ff';
        ctx.fillRect(px + 14, py - 8, 4, 20);
        // 刀身のハイライト
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 15, py - 6, 2, 16);
        // ツバ（横棒）
        ctx.fillStyle = '#f0d060';
        ctx.fillRect(px + 8, py + 12, 16, 4);
        // 柄
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(px + 14, py + 16, 4, 10);
        // 宝玉
        ctx.fillStyle = '#40c0ff';
        ctx.beginPath(); ctx.arc(px + 16, py + 14, 3, 0, Math.PI * 2); ctx.fill();
        // キラキラエフェクト
        ctx.fillStyle = `rgba(255, 255, 200, ${0.5 + Math.sin(st * 2) * 0.5})`;
        ctx.fillRect(px + 6 + Math.sin(st * 1.3) * 4, py - 4, 2, 2);
        ctx.fillRect(px + 22 + Math.cos(st * 1.7) * 4, py + 4, 2, 2);
        ctx.fillRect(px + 12 + Math.sin(st * 2.1) * 3, py - 12, 2, 2);
      } else {
        // 通常NPC
        ctx.fillStyle = npc.color || '#aaa'; ctx.fillRect(px + 6, py + 10, 20, 18);
        ctx.fillStyle = '#ffcc99'; ctx.fillRect(px + 8, py + 2, 16, 12);
        ctx.fillStyle = '#333'; ctx.fillRect(px + 10, py + 6, 3, 3); ctx.fillRect(px + 19, py + 6, 3, 3);
      }

      // 名前
      ctx.fillStyle = npc.type === 'boss' ? '#e040ff' : '#fff';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(npc.name, px + ts / 2, py - 2);
    }
  }

  function renderDialog(ctx) {
    if (!activeDialog) return;
    const W = Engine.WIDTH, H = Engine.HEIGHT;
    const boxH = 100, boxY = H - boxH - 10;

    ctx.fillStyle = 'rgba(0, 0, 40, 0.92)';
    ctx.fillRect(10, boxY, W - 20, boxH);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(10, boxY, W - 20, boxH);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1; ctx.strokeRect(14, boxY + 4, W - 28, boxH - 8);

    const isProtag = activeDialog.npc.name === PlayerData.getName();
    const isSign = activeDialog.npc.type === 'sign';
    const isBoss = activeDialog.npc.type === 'boss';
    const isSword = activeDialog.npc.type === 'sword';
    ctx.fillStyle = isProtag ? '#80d0ff' : (isBoss ? '#e040ff' : (isSword ? '#f0e860' : (isSign ? '#ff8060' : '#f0d060')));
    ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(activeDialog.npc.name, 24, boxY + 22);

    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText(activeDialog.lines[activeDialog.index], 24, boxY + 50);

    ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right';
    const hint = activeDialog.index < activeDialog.lines.length - 1
      ? '▼ スペースキーで次へ' : '■ スペースキーで閉じる';
    ctx.fillText(hint, W - 24, boxY + boxH - 12);
  }

  return { init, removeNpc, getAt, isDialogActive, showMonologue, consumeCompletedBoss, consumeCompleted, update, renderNPCs, renderDialog };
})();
