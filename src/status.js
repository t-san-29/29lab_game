// ステータス・装備画面
const StatusScreen = (() => {
  let showUI = false;
  let cursor = 0;         // 0=weapon, 1=armor, 2=accessory1, 3=accessory2
  let selectMode = false;  // 装備選択中
  let selectCursor = 0;
  let availableItems = [];

  const SLOTS = [
    { key: 'weapon',     label: '武器' },
    { key: 'armor',      label: '防具' },
    { key: 'accessory1', label: '装飾1' },
    { key: 'accessory2', label: '装飾2' },
  ];

  function isOpen() { return showUI; }

  function toggle() {
    showUI = !showUI;
    if (showUI) {
      cursor = 0;
      selectMode = false;
    }
  }

  function close() {
    showUI = false;
    selectMode = false;
  }

  function update() {
    if (Engine.isKeyJustPressed('e') || Engine.isKeyJustPressed('E')) {
      toggle();
    }
    if (!showUI) return;

    if (Engine.isKeyJustPressed('Escape')) {
      if (selectMode) {
        selectMode = false;
      } else {
        close();
      }
      return;
    }

    if (selectMode) {
      // 装備選択モード
      const totalOptions = availableItems.length + 1; // +1 for "はずす"

      if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
        selectCursor = (selectCursor - 1 + totalOptions) % totalOptions;
      }
      if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
        selectCursor = (selectCursor + 1) % totalOptions;
      }
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        const slot = SLOTS[cursor].key;
        if (selectCursor === 0) {
          // はずす
          Equipment.unequip(slot);
        } else {
          // 装備する
          const item = availableItems[selectCursor - 1];
          Equipment.equip(item.id, slot);
        }
        selectMode = false;
      }
    } else {
      // スロット選択モード
      if (Engine.isKeyJustPressed('ArrowUp') || Engine.isKeyJustPressed('w')) {
        cursor = (cursor - 1 + SLOTS.length) % SLOTS.length;
      }
      if (Engine.isKeyJustPressed('ArrowDown') || Engine.isKeyJustPressed('s')) {
        cursor = (cursor + 1) % SLOTS.length;
      }
      if (Engine.isKeyJustPressed(' ') || Engine.isKeyJustPressed('Enter')) {
        const slot = SLOTS[cursor].key;
        availableItems = Equipment.getAvailable(slot);
        selectCursor = 0;
        selectMode = true;
      }
    }
  }

  function render(ctx) {
    if (!showUI) return;

    const W = Engine.WIDTH;
    const H = Engine.HEIGHT;
    const pad = 20;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 20, 0.94)';
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);
    ctx.strokeStyle = '#4080ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
    ctx.strokeStyle = '#3060c0';
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 4, pad + 4, W - pad * 2 - 8, H - pad * 2 - 8);

    // タイトル
    ctx.fillStyle = '#80d0ff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ステータス', W / 2, pad + 28);

    // === 左側: ステータス ===
    const stats = Battle.getPlayerStats();
    const bonus = Equipment.getBonus();
    const leftX = pad + 20;
    let sy = pad + 55;

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';

    ctx.fillStyle = '#80d0ff';
    ctx.fillText(PlayerData.getName(), leftX, sy);
    sy += 26;

    ctx.fillStyle = '#fff';
    ctx.fillText(`Lv ${stats.level}`, leftX, sy);
    sy += 22;

    ctx.fillStyle = '#40c040';
    ctx.fillText(`HP  ${stats.hp} / ${stats.maxHp}`, leftX, sy);
    sy += 22;

    ctx.fillStyle = '#4080e0';
    ctx.fillText(`MP  ${stats.mp} / ${stats.maxMp}`, leftX, sy);
    sy += 22;

    const totalAtk = stats.atk + bonus.atk;
    const totalDef = stats.def + bonus.def;
    ctx.fillStyle = '#ff8060';
    ctx.fillText(`ATK ${stats.atk}`, leftX, sy);
    if (bonus.atk > 0) {
      ctx.fillStyle = '#ffcc40';
      ctx.fillText(` +${bonus.atk} = ${totalAtk}`, leftX + 70, sy);
    }
    sy += 22;

    ctx.fillStyle = '#6080ff';
    ctx.fillText(`DEF ${stats.def}`, leftX, sy);
    if (bonus.def > 0) {
      ctx.fillStyle = '#ffcc40';
      ctx.fillText(` +${bonus.def} = ${totalDef}`, leftX + 70, sy);
    }
    sy += 22;

    ctx.fillStyle = '#d0d0d0';
    ctx.fillText(`EXP ${stats.exp} / ${stats.nextExp}`, leftX, sy);

    // === 右側: 装備スロット ===
    const eq = Equipment.getEquipped();
    const rightX = W / 2 + 10;
    const eqY = pad + 55;

    ctx.fillStyle = '#ffcc40';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('そうび', rightX, eqY);

    ctx.font = '13px sans-serif';

    SLOTS.forEach((slot, i) => {
      const y = eqY + 26 + i * 34;
      const selected = !selectMode && cursor === i;
      const item = eq[slot.key];

      // ラベル
      ctx.fillStyle = '#aaa';
      ctx.fillText(slot.label + ':', rightX, y);

      // 装備名
      ctx.fillStyle = selected ? '#ffe080' : '#fff';
      const equipName = item ? item.name : '---';
      ctx.fillText(`${selected ? '▶' : '　'} ${equipName}`, rightX + 50, y);

      // ステータスボーナス
      if (item) {
        ctx.fillStyle = '#888';
        let bonusText = '';
        if (item.atk > 0) bonusText += `ATK+${item.atk} `;
        if (item.def > 0) bonusText += `DEF+${item.def}`;
        ctx.fillText(bonusText, rightX + 50, y + 14);
      }
    });

    // === 装備選択パネル ===
    if (selectMode) {
      const panelW = 250, panelH = 40 + (availableItems.length + 1) * 26;
      const panelX = W / 2 + 10;
      const panelY = eqY + 26 + SLOTS.length * 34 + 5;

      ctx.fillStyle = 'rgba(0, 0, 40, 0.95)';
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.strokeStyle = '#ffcc40';
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX, panelY, panelW, panelH);

      ctx.fillStyle = '#ffcc40';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('装備を選ぶ', panelX + 10, panelY + 18);

      ctx.font = '13px sans-serif';

      // はずすオプション
      const sel0 = selectCursor === 0;
      ctx.fillStyle = sel0 ? '#ffe080' : '#aaa';
      ctx.fillText(`${sel0 ? '▶' : '　'} はずす`, panelX + 10, panelY + 38);

      // 装備候補
      availableItems.forEach((item, i) => {
        const y = panelY + 38 + (i + 1) * 26;
        const sel = selectCursor === i + 1;
        ctx.fillStyle = sel ? '#ffe080' : '#fff';
        ctx.fillText(`${sel ? '▶' : '　'} ${item.name}`, panelX + 10, y);
        ctx.fillStyle = '#888';
        let bText = '';
        if (item.atk > 0) bText += `A+${item.atk} `;
        if (item.def > 0) bText += `D+${item.def}`;
        ctx.fillText(bText, panelX + 170, y);
      });
    }

    // 操作ヒント
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    if (selectMode) {
      ctx.fillText('↑↓:選択  Space:決定  Esc:戻る', W / 2, H - pad - 10);
    } else {
      ctx.fillText('↑↓:スロット選択  Space:装備変更  Eキーで閉じる', W / 2, H - pad - 10);
    }
  }

  return { isOpen, update, render };
})();
