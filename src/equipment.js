// 装備システム - 武器・防具の装備とステータスボーナス
const Equipment = (() => {
  // 装備データベース
  const DB = {
    // 武器
    tusk_knife:    { name: '牙のナイフ',     type: 'weapon', atk: 3, def: 0, desc: 'イノシシの牙で作った短刀' },
    bear_sword:    { name: 'クマ爪の剣',     type: 'weapon', atk: 6, def: 0, desc: 'クマの爪を刃にした大剣' },
    antler_spear:  { name: 'シカ角の槍',     type: 'weapon', atk: 5, def: 1, desc: 'シカの角を穂先にした槍' },
    murakon_blade: { name: 'ムラコンの魔剣', type: 'weapon', atk: 10, def: 2, desc: '魔獣の牙から作った最強の剣' },
    holy_sword:    { name: 'せいけんタケテーン', type: 'weapon', atk: 18, def: 3, desc: '聖なる森に眠っていた伝説の剣。圧倒的な力を秘める' },
    // 防具
    fur_armor:     { name: '毛皮の鎧',       type: 'armor', atk: 0, def: 2, desc: 'うさぎの毛皮で作った軽い鎧' },
    feather_hat:   { name: '羽の帽子',       type: 'armor', atk: 0, def: 1, desc: '鳥の羽で作った帽子' },
    antler_shield: { name: 'シカ角の盾',     type: 'armor', atk: 0, def: 4, desc: 'シカの角を組み合わせた盾' },
    bear_armor:    { name: 'クマ皮の鎧',     type: 'armor', atk: 0, def: 5, desc: 'クマの素材で作った重厚な鎧' },
    murakon_armor: { name: 'ムラコンの魔鎧', type: 'armor', atk: 2, def: 8, desc: '魔獣の鱗から作った最強の鎧' },
  };

  // 装備スロット
  const equipped = { weapon: null, armor: null };

  function getDB() {
    return DB;
  }

  function equip(itemId) {
    const data = DB[itemId];
    if (!data) return false;
    const slot = data.type;

    // 既に装備中のものを外す
    if (equipped[slot]) {
      Inventory.add(equipped[slot], DB[equipped[slot]].name, DB[equipped[slot]].desc);
    }

    // インベントリから消費して装備
    Inventory.remove(itemId, 1);
    equipped[slot] = itemId;
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
    return {
      weapon: equipped.weapon ? { id: equipped.weapon, ...DB[equipped.weapon] } : null,
      armor: equipped.armor ? { id: equipped.armor, ...DB[equipped.armor] } : null,
    };
  }

  function getBonus() {
    let atk = 0, def = 0;
    if (equipped.weapon && DB[equipped.weapon]) {
      atk += DB[equipped.weapon].atk;
      def += DB[equipped.weapon].def;
    }
    if (equipped.armor && DB[equipped.armor]) {
      atk += DB[equipped.armor].atk;
      def += DB[equipped.armor].def;
    }
    return { atk, def };
  }

  // インベントリ内の装備可能アイテムを取得
  function getAvailable(slot) {
    const result = [];
    const allItems = Inventory.getAllWithIds();
    for (const item of allItems) {
      if (DB[item.id] && DB[item.id].type === slot) {
        result.push({ id: item.id, ...DB[item.id], count: item.count });
      }
    }
    return result;
  }

  return { DB, getDB, equip, unequip, getEquipped, getBonus, getAvailable };
})();
