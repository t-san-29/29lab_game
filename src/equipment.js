// 装備システム - 武器・防具・アクセサリーの装備とステータスボーナス
const Equipment = (() => {
  // 装備データベース
  const DB = {
    // === 武器 ===
    tusk_knife:    { name: '牙のナイフ',     type: 'weapon', atk: 3, def: 0, desc: 'イノシシの牙で作った短刀' },
    bear_sword:    { name: 'クマ爪の剣',     type: 'weapon', atk: 6, def: 0, desc: 'クマの爪を刃にした大剣' },
    antler_spear:  { name: 'シカ角の槍',     type: 'weapon', atk: 5, def: 1, desc: 'シカの角を穂先にした槍' },
    murakon_blade: { name: 'ムラコンの魔剣', type: 'weapon', atk: 10, def: 2, desc: '魔獣の牙から作った最強の剣' },
    holy_sword:    { name: 'せいけんタケテーン', type: 'weapon', atk: 18, def: 3, desc: '聖なる森に眠っていた伝説の剣。圧倒的な力を秘める' },
    shadow_blade:  { name: '闇狼の剣',       type: 'weapon', atk: 14, def: 1, desc: '闇狼の牙で作った漆黒の剣' },
    golem_hammer:  { name: 'ゴーレムハンマー', type: 'weapon', atk: 17, def: 3, desc: '魔石で作った巨大なハンマー' },
    dragon_lance:  { name: '竜騎の槍',       type: 'weapon', atk: 24, def: 4, desc: '竜の鱗を穂先にした最強の槍' },
    dark_blade:    { name: '漆黒の魔剣',     type: 'weapon', atk: 30, def: 5, desc: '闇の力が宿る究極の剣' },
    // === 防具 ===
    fur_armor:     { name: '毛皮の鎧',       type: 'armor', atk: 0, def: 2, desc: 'うさぎの毛皮で作った軽い鎧' },
    feather_hat:   { name: '羽の帽子',       type: 'armor', atk: 0, def: 1, desc: '鳥の羽で作った帽子' },
    antler_shield: { name: 'シカ角の盾',     type: 'armor', atk: 0, def: 4, desc: 'シカの角を組み合わせた盾' },
    bear_armor:    { name: 'クマ皮の鎧',     type: 'armor', atk: 0, def: 5, desc: 'クマの素材で作った重厚な鎧' },
    murakon_armor: { name: 'ムラコンの魔鎧', type: 'armor', atk: 2, def: 8, desc: '魔獣の鱗から作った最強の鎧' },
    shadow_cloak:  { name: '闇狼のマント',   type: 'armor', atk: 1, def: 10, desc: '闇狼の毛皮で作ったマント' },
    golem_armor:   { name: 'ゴーレムの鎧',   type: 'armor', atk: 0, def: 14, desc: '魔石で作った堅固な鎧' },
    dragon_mail:   { name: '竜鱗の鎧',       type: 'armor', atk: 3, def: 20, desc: '竜の鱗で作った究極の鎧' },
    dark_armor:    { name: '漆黒の魔鎧',     type: 'armor', atk: 5, def: 24, desc: '闇の力が宿る究極の鎧' },
    // === アクセサリー ===
    wolf_charm:    { name: '狼牙のお守り',     type: 'accessory', atk: 4, def: 4, desc: '闇狼の牙で作ったお守り' },
    golem_ring:    { name: '魔石の指輪',       type: 'accessory', atk: 2, def: 8, desc: 'ゴーレムの核で作った指輪' },
    dragon_pendant:{ name: '竜のペンダント',   type: 'accessory', atk: 8, def: 6, desc: '竜の力が宿るペンダント' },
    dark_amulet:   { name: '漆黒のアミュレット', type: 'accessory', atk: 10, def: 10, desc: '闇の力が凝縮されたお守り' },
  };

  // 装備スロット
  const equipped = { weapon: null, armor: null, accessory1: null, accessory2: null };

  function getDB() {
    return DB;
  }

  function equip(itemId, slot) {
    const data = DB[itemId];
    if (!data) return false;

    // アクセサリーの場合、指定されたスロットを使う
    let targetSlot;
    if (data.type === 'accessory') {
      targetSlot = slot || 'accessory1';
    } else {
      targetSlot = data.type;
    }

    // 既に装備中のものを外す
    if (equipped[targetSlot]) {
      Inventory.add(equipped[targetSlot], DB[equipped[targetSlot]].name, DB[equipped[targetSlot]].desc);
    }

    // インベントリから消費して装備
    Inventory.remove(itemId, 1);
    equipped[targetSlot] = itemId;
    return true;
  }

  function unequip(slot) {
    if (!equipped[slot]) return false;
    const itemId = equipped[slot];
    Inventory.add(itemId, DB[itemId].name, DB[itemId].desc);
    equipped[slot] = null;
    return true;
  }

  function getEquipped() {
    const result = {};
    for (const slot of ['weapon', 'armor', 'accessory1', 'accessory2']) {
      result[slot] = equipped[slot] ? { id: equipped[slot], ...DB[equipped[slot]] } : null;
    }
    return result;
  }

  function getBonus() {
    let atk = 0, def = 0;
    for (const slot of ['weapon', 'armor', 'accessory1', 'accessory2']) {
      if (equipped[slot] && DB[equipped[slot]]) {
        atk += DB[equipped[slot]].atk;
        def += DB[equipped[slot]].def;
      }
    }
    return { atk, def };
  }

  // インベントリ内の装備可能アイテムを取得
  function getAvailable(slot) {
    const targetType = slot.startsWith('accessory') ? 'accessory' : slot;
    const result = [];
    const allItems = Inventory.getAllWithIds();
    for (const item of allItems) {
      if (DB[item.id] && DB[item.id].type === targetType) {
        result.push({ id: item.id, ...DB[item.id], count: item.count });
      }
    }
    return result;
  }

  // セーブ/ロード用
  function getSaveData() {
    return { ...equipped };
  }

  function loadSaveData(data) {
    equipped.weapon = data.weapon || null;
    equipped.armor = data.armor || null;
    equipped.accessory1 = data.accessory1 || null;
    equipped.accessory2 = data.accessory2 || null;
  }

  return { DB, getDB, equip, unequip, getEquipped, getBonus, getAvailable, getSaveData, loadSaveData };
})();
