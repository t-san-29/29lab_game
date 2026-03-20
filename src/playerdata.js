// プレイヤーデータ - 名前などのグローバル情報
const PlayerData = (() => {
  let name = '';

  function setName(n) { name = n; }
  function getName() { return name; }

  return { setName, getName };
})();
