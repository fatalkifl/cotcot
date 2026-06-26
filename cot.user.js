(() => {
  'use strict';

  const ROOT_ID = 'cot-strategy-director';
  const CAMPAIGN_FARMED_KEY = 'cotStrategyCampaignFarmed';
  const AUTO_COLLECT_INTERVAL_MS = 45_000;
  document.getElementById(ROOT_ID)?.remove();
  window.__cotStrategyDirector?.remove?.();

  const M = 60;
  const H = 3600;
  const BUILD = {
    town_hall: {name: 'Town Hall', res: 'gold', fp: 4, levels: [[0, 0], [1000, M], [1500, 30 * M], [25000, 3 * H], [50000, 12 * H], [100000, 24 * H]]},
    gold_mine: {name: 'Gold Mine', res: 'elixir', fp: 3, produce: 'gold', levels: [[200, 10], [1500, 5 * M], [3000, 30 * M], [7000, 2 * H], [14000, 5 * H], [28000, 10 * H]]},
    elixir_collector: {name: 'Elixir Collector', res: 'gold', fp: 3, produce: 'elixir', levels: [[200, 10], [1500, 5 * M], [3000, 30 * M], [7000, 2 * H], [14000, 5 * H], [28000, 10 * H]]},
    gold_storage: {name: 'Gold Storage', res: 'elixir', fp: 3, levels: [[300, M], [1500, 10 * M], [4000, H], [9000, 3 * H], [18000, 7 * H], [36000, 14 * H]]},
    elixir_storage: {name: 'Elixir Storage', res: 'gold', fp: 3, levels: [[300, M], [1500, 10 * M], [4000, H], [9000, 3 * H], [18000, 7 * H], [36000, 14 * H]]},
    army_camp: {name: 'Army Camp', res: 'elixir', fp: 4, levels: [[250, 15], [2500, 20 * M], [10000, 90 * M], [20000, 4 * H], [35000, 8 * H], [60000, 14 * H]]},
    barracks: {name: 'Barracks', res: 'elixir', fp: 3, levels: [[200, 15], [1000, 8 * M], [2500, 30 * M], [6000, 2 * H], [12000, 5 * H], [24000, 10 * H]]},
    cannon: {name: 'Cannon', res: 'gold', fp: 3, levels: [[250, 30], [1000, 8 * M], [4000, 30 * M], [12000, 2 * H], [28000, 5 * H], [60000, 10 * H]]},
    archer_tower: {name: 'Archer Tower', res: 'gold', fp: 3, levels: [[1000, 10 * M], [4000, 40 * M], [9000, 2 * H], [18000, 4 * H], [32000, 8 * H], [60000, 14 * H]]},
    mortar: {name: 'Mortar', res: 'gold', fp: 3, levels: [[8000, H], [16000, 3 * H], [28000, 6 * H], [45000, 10 * H], [70000, 16 * H], [100000, 24 * H]]},
    builders_hut: {name: "Builder's Hut", res: 'gold', fp: 2, levels: [[0, 0]]},
  };
  const CAPS = {
    town_hall: [1, 1, 1, 1, 1, 1],
    gold_mine: [1, 2, 3, 4, 5, 6],
    elixir_collector: [1, 2, 3, 4, 5, 6],
    gold_storage: [1, 2, 3, 3, 4, 4],
    elixir_storage: [1, 2, 3, 3, 4, 4],
    army_camp: [1, 1, 2, 2, 3, 4],
    barracks: [1, 2, 2, 3, 3, 4],
    cannon: [2, 2, 2, 2, 3, 4],
    archer_tower: [0, 1, 1, 2, 3, 4],
    mortar: [0, 0, 1, 1, 1, 2],
    builders_hut: [2, 2, 2, 2, 2, 2],
  };
  const TROOPS = {
    warrior: {name: 'Goblin', cost: 40, space: 1, barracks: 1},
    archer: {name: 'Archer', cost: 60, space: 1, barracks: 2},
    brute: {name: 'Brute', cost: 150, space: 5, barracks: 3},
    raider: {name: 'Raider', cost: 220, space: 3, barracks: 4},
  };
  const BUILD_ORDER = ['gold_mine', 'elixir_collector', 'gold_storage', 'elixir_storage', 'barracks', 'army_camp', 'cannon', 'archer_tower', 'mortar'];
  const UPGRADE_ORDER = ['barracks', 'army_camp', 'town_hall', 'elixir_collector', 'gold_mine', 'elixir_storage', 'gold_storage', 'cannon', 'archer_tower', 'mortar'];
  const TH_CAPACITY = [1500, 3000, 10000, 25000, 60000, 100000];
  const STORAGE_CAPACITY = [1500, 4000, 9000, 20000, 40000, 80000];

  const state = {
    running: false,
    autoCollect: true,
    autoUpgrade: true,
    autoBuild: true,
    autoTrain: true,
    autoCampaign: true,
    autoOnline: false,
    autoDismissAttacks: true,
    autoRepairTownHall: true,
    onlinePending: false,
    lastCollectAt: 0,
    loopTimer: 0,
    renderTimer: 0,
    actions: 0,
  };

  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.style.cssText = 'position:fixed;right:16px;bottom:112px;z-index:2147483647;width:430px;max-height:620px;overflow:hidden;font:12px/1.35 system-ui,Segoe UI,Arial,sans-serif;color:#f8fafc;background:rgba(13,18,28,.95);border:1px solid rgba(255,255,255,.18);border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,.35);padding:10px;user-select:none';
  root.innerHTML = `
    <div data-drag-handle style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:-2px -2px 8px -2px;padding:2px;cursor:move">
      <strong style="font-size:13px">COT Strategy Director</strong>
      <button data-a="close" style="background:#293241;color:white;border:1px solid #556070;border-radius:6px;padding:2px 7px;cursor:pointer">x</button>
    </div>
    <div data-summary style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:6px;padding:8px;margin-bottom:8px">Loading...</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
      <button data-a="run" style="background:#1f7a4d;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Start</button>
      <button data-a="step" style="background:#31598a;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Step once</button>
      <button data-a="campaign" style="background:#374151;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Campaign off</button>
      <button data-a="collect" style="background:#1f7a4d;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Collect on</button>
      <button data-a="build" style="background:#1f7a4d;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Build on</button>
      <button data-a="upgrade" style="background:#1f7a4d;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Upgrade on</button>
      <button data-a="train" style="background:#1f7a4d;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Train on</button>
      <button data-a="online" style="background:#374151;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Online off</button>
      <button data-a="dismiss" style="background:#1f7a4d;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Dismiss on</button>
      <button data-a="repair" style="background:#1f7a4d;color:white;border:0;border-radius:6px;padding:7px;cursor:pointer">Repair on</button>
    </div>
    <div data-plan style="display:grid;gap:6px;max-height:170px;overflow:auto;padding-right:2px"></div>
    <div data-log style="margin-top:8px;height:150px;overflow:auto;color:#cbd5e1;font-size:11px;border-top:1px solid rgba(255,255,255,.12);padding-top:6px"></div>
  `;
  document.body.appendChild(root);

  const summaryEl = root.querySelector('[data-summary]');
  const planEl = root.querySelector('[data-plan]');
  const logEl = root.querySelector('[data-log]');
  const dragHandle = root.querySelector('[data-drag-handle]');
  const $ = selector => root.querySelector(selector);
  const gs = () => window.gameStore;
  const game = () => gs()?.game;
  const now = () => gs()?.now?.() ?? Date.now();
  const num = value => Number.isFinite(value) ? value : 0;
  const fmt = value => Math.floor(num(value)).toLocaleString();
  const log = message => {
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.prepend(line);
    while (logEl.children.length > 6) logEl.lastChild.remove();
  };

  function makeDraggable() {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    dragHandle.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      dragging = true;
      const rect = root.getBoundingClientRect();
      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;
      root.style.left = `${rect.left}px`;
      root.style.top = `${rect.top}px`;
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      dragHandle.setPointerCapture(event.pointerId);
    });
    dragHandle.addEventListener('pointermove', event => {
      if (!dragging) return;
      const maxLeft = window.innerWidth - root.offsetWidth;
      const maxTop = window.innerHeight - 48;
      const left = Math.max(0, Math.min(maxLeft, event.clientX - offsetX));
      const top = Math.max(0, Math.min(maxTop, event.clientY - offsetY));
      root.style.left = `${left}px`;
      root.style.top = `${top}px`;
    });
    dragHandle.addEventListener('pointerup', event => {
      dragging = false;
      try {
        dragHandle.releasePointerCapture(event.pointerId);
      } catch {}
    });
  }

  function townHallLevel(g) {
    return g?.buildings?.find(b => b.type === 'town_hall')?.level ?? 1;
  }

  function maxCount(type, th) {
    const row = CAPS[type];
    return row?.[Math.min(th, row.length) - 1] ?? 0;
  }

  function maxLevel(type, th) {
    if (type === 'town_hall') return BUILD.town_hall.levels.length;
    return Math.min(BUILD[type]?.levels.length ?? 1, maxCount(type, th));
  }

  function builders(g) {
    const total = g.buildings.filter(b => b.type === 'builders_hut' && !b.construction).length + (g.extraBuilders ?? 0);
    const busy = g.buildings.filter(b => b.construction && b.type !== 'wall').length;
    return {total, busy, free: Math.max(0, total - busy)};
  }

  function capacity(g, resource) {
    let cap = TH_CAPACITY[townHallLevel(g) - 1] ?? 3000;
    const storageType = resource === 'gold' ? 'gold_storage' : 'elixir_storage';
    for (const b of g.buildings) {
      if (b.type === storageType && !b.construction) {
        cap += STORAGE_CAPACITY[(b.level ?? 1) - 1] ?? 0;
      }
    }
    return Math.max(cap, g.walletCapOverride ?? 0);
  }

  function usedArmySpace(g) {
    let used = 0;
    for (const [type, count] of Object.entries(g.army ?? {})) used += (TROOPS[type]?.space ?? 0) * count;
    for (const item of g.trainingQueue ?? []) used += TROOPS[item.troop]?.space ?? 0;
    return used;
  }

  function readyArmySpace(g) {
    let used = 0;
    for (const [type, count] of Object.entries(g.army ?? {})) used += (TROOPS[type]?.space ?? 0) * count;
    return used;
  }

  function armyCapacity(g) {
    let cap = 0;
    for (const b of g.buildings) {
      if (b.type === 'army_camp' && !b.construction) {
        cap += [20, 30, 40, 50, 60, 70][(b.level ?? 1) - 1] ?? 20;
      }
    }
    return cap;
  }

  function bestBarracks(g) {
    return Math.max(0, ...g.buildings.filter(b => b.type === 'barracks' && !b.construction).map(b => b.level ?? 0));
  }

  function occupied(g, x, y, fp, ignoreId = null) {
    for (const b of g.buildings) {
      if (b.id === ignoreId) continue;
      const bfp = BUILD[b.type]?.fp ?? 1;
      if (x < b.x + bfp && x + fp > b.x && y < b.y + bfp && y + fp > b.y) return true;
    }
    for (const o of g.obstacles ?? []) {
      if (x <= o.x && o.x < x + fp && y <= o.y && o.y < y + fp) return true;
    }
    return false;
  }

  function findPlace(g, type) {
    const fp = BUILD[type].fp;
    const th = g.buildings.find(b => b.type === 'town_hall') ?? {x: 16, y: 16};
    const candidates = [];
    for (let radius = 0; radius < g.grid.w; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          candidates.push({x: th.x + dx, y: th.y + dy});
        }
      }
    }
    for (const p of candidates) {
      if (p.x < 0 || p.y < 0 || p.x + fp > g.grid.w || p.y + fp > g.grid.h) continue;
      if (!occupied(g, p.x, p.y, fp)) return p;
    }
    return null;
  }

  function collectReadyButton() {
    return Array.from(document.querySelectorAll('button')).find(button => {
      const text = button.innerText.replace(/\s+/g, ' ').trim().toLowerCase();
      return text.startsWith('collect') && !button.disabled && button.offsetParent !== null;
    });
  }

  function upgradeRows() {
    const g = game();
    if (!g) return [];
    const th = townHallLevel(g);
    const b = builders(g);
    return g.buildings.filter(x => BUILD[x.type]).map(building => {
      const cfg = BUILD[building.type];
      const nextLevel = (building.level ?? 0) + 1;
      const info = cfg.levels[nextLevel - 1];
      let ok = true;
      let reason = 'Ready';
      if (building.construction) {
        ok = false;
        reason = 'Busy';
      } else if (!info || nextLevel > maxLevel(building.type, th)) {
        ok = false;
        reason = building.type === 'town_hall' ? 'Max level' : 'Needs higher Town Hall';
      } else if (num(g.resources?.[cfg.res]) < info[0]) {
        ok = false;
        reason = `Need ${fmt(info[0])} ${cfg.res}`;
      } else if (b.free < 1) {
        ok = false;
        reason = 'No free builder';
      }
      return {
        kind: 'upgrade',
        id: building.id,
        type: building.type,
        name: cfg.name,
        level: building.level ?? 0,
        nextLevel,
        cost: info?.[0] ?? 0,
        resource: cfg.res,
        ok,
        reason,
        priority: UPGRADE_ORDER.indexOf(building.type) === -1 ? 100 : UPGRADE_ORDER.indexOf(building.type),
      };
    }).sort((a, b) => Number(b.ok) - Number(a.ok) || a.priority - b.priority || a.cost - b.cost);
  }

  function buildRows() {
    const g = game();
    if (!g) return [];
    const th = townHallLevel(g);
    const b = builders(g);
    return BUILD_ORDER.map(type => {
      const cfg = BUILD[type];
      const have = g.buildings.filter(x => x.type === type).length;
      const cap = maxCount(type, th);
      const cost = cfg.levels[0][0];
      let ok = have < cap;
      let reason = 'Ready';
      if (!ok) reason = 'At cap';
      else if (num(g.resources?.[cfg.res]) < cost) reason = `Need ${fmt(cost)} ${cfg.res}`, ok = false;
      else if (b.free < 1) reason = 'No free builder', ok = false;
      else if (!findPlace(g, type)) reason = 'No clear space', ok = false;
      return {kind: 'build', type, name: cfg.name, have, cap, cost, resource: cfg.res, ok, reason, priority: BUILD_ORDER.indexOf(type)};
    }).sort((a, b) => Number(b.ok) - Number(a.ok) || a.priority - b.priority || a.cost - b.cost);
  }

  function availableTroop(g) {
    const barracks = bestBarracks(g);
    if (barracks >= 4) return 'raider';
    if (barracks >= 3) return 'brute';
    if (barracks >= 2) return 'archer';
    return 'warrior';
  }

  function nextArmyUpgradeReserve(g) {
    const wanted = upgradeRows()
      .filter(row => row.ok && (row.type === 'barracks' || row.type === 'army_camp') && row.resource === 'elixir')
      .sort((a, b) => a.priority - b.priority || a.cost - b.cost)[0];
    if (!wanted) return 0;
    const reserve = Math.floor(wanted.cost * 0.9);
    return Math.min(reserve, capacity(g, 'elixir'));
  }

  function upgradeScore(row, g) {
    let score = 1000 - row.priority * 40;
    const goldRatio = num(g.resources?.gold) / Math.max(1, capacity(g, 'gold'));
    const elixirRatio = num(g.resources?.elixir) / Math.max(1, capacity(g, 'elixir'));
    const resourceRatio = row.resource === 'gold' ? goldRatio : elixirRatio;
    const th = townHallLevel(g);
    const capBlocked = buildRows().some(item => !item.ok && item.reason === 'At cap' && maxCount(item.type, th + 1) > item.cap);

    if (row.type === 'barracks') score += 500;
    if (row.type === 'army_camp') score += armyCapacity(g) <= readyArmySpace(g) + 5 ? 430 : 340;
    if (row.type === 'town_hall' && capBlocked) score += 420;
    if (row.type === 'elixir_collector' || row.type === 'gold_mine') score += 210;
    if (row.type === 'elixir_storage' && elixirRatio > 0.72) score += 260;
    if (row.type === 'gold_storage' && goldRatio > 0.72) score += 260;
    if (row.type === 'cannon' || row.type === 'archer_tower' || row.type === 'mortar') score -= 180;
    if (resourceRatio > 0.85) score += 380;
    if (resourceRatio > 0.95) score += 250;
    if (row.cost <= num(g.resources?.[row.resource]) * 0.35) score += 90;
    return score;
  }

  function bestUpgradeRow(rows = upgradeRows()) {
    const g = game();
    if (!g) return rows.find(row => row.ok);
    return rows
      .filter(row => row.ok)
      .sort((a, b) => upgradeScore(b, g) - upgradeScore(a, g) || a.cost - b.cost)[0];
  }

  function buildScore(row, g) {
    let score = 1000 - row.priority * 35;
    const goldRatio = num(g.resources?.gold) / Math.max(1, capacity(g, 'gold'));
    const elixirRatio = num(g.resources?.elixir) / Math.max(1, capacity(g, 'elixir'));
    const resourceRatio = row.resource === 'gold' ? goldRatio : elixirRatio;
    const hasBarracks = g.buildings.some(building => building.type === 'barracks' && !building.construction);
    const hasArmyCamp = g.buildings.some(building => building.type === 'army_camp' && !building.construction);

    if (row.type === 'barracks' && !hasBarracks) score += 520;
    if (row.type === 'army_camp' && !hasArmyCamp) score += 480;
    if (row.type === 'army_camp') score += 260;
    if (row.type === 'barracks') score += 240;
    if (row.type === 'gold_mine' || row.type === 'elixir_collector') score += 230;
    if (row.type === 'gold_storage' && goldRatio > 0.7) score += 260;
    if (row.type === 'elixir_storage' && elixirRatio > 0.7) score += 260;
    if (row.type === 'cannon' || row.type === 'archer_tower' || row.type === 'mortar') score -= 120;
    if (resourceRatio > 0.85) score += 330;
    if (row.cost <= num(g.resources?.[row.resource]) * 0.4) score += 80;
    return score;
  }

  function bestBuildRow(rows = buildRows()) {
    const g = game();
    if (!g) return rows.find(row => row.ok);
    return rows
      .filter(row => row.ok)
      .sort((a, b) => buildScore(b, g) - buildScore(a, g) || a.cost - b.cost)[0];
  }

  function keyArmyUpgradeRow() {
    return upgradeRows()
      .filter(row => row.ok && (row.type === 'barracks' || row.type === 'army_camp'))
      .sort((a, b) => upgradeScore(b, game()) - upgradeScore(a, game()) || a.cost - b.cost)[0];
  }

  function campaignStars(g, bot) {
    const campaign = g.campaign ?? {};
    const keys = [bot.id, bot.level, bot.name].filter(key => key !== undefined && key !== null);
    for (const key of keys) {
      const direct = campaign[key]?.stars ?? campaign[key];
      if (Number.isFinite(direct)) return direct;
      const byStars = campaign.stars?.[key];
      if (Number.isFinite(byStars)) return byStars;
    }
    if (Number.isFinite(bot.stars)) return bot.stars;
    if (Number.isFinite(bot.bestStars)) return bot.bestStars;
    return 0;
  }

  function campaignFarmed() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CAMPAIGN_FARMED_KEY) ?? '{}');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function campaignKey(bot) {
    return bot.id ?? `level_${bot.level}`;
  }

  function campaignKeys(bot) {
    return [bot.id, `lvl_${bot.level}`, `level_${bot.level}`, String(bot.level), bot.name]
      .filter(key => key !== undefined && key !== null && key !== '');
  }

  function isCampaignFarmed(bot) {
    const farmed = campaignFarmed();
    return campaignKeys(bot).some(key => farmed[key] === true);
  }

  function isCampaignFarmedOutInUi(bot) {
    const rows = Array.from(document.querySelectorAll('.sheet.panel.campaign .camprow'));
    return rows.some(row => {
      const level = row.querySelector('.lvlchip')?.textContent?.trim();
      const name = row.querySelector('.name')?.textContent ?? '';
      const meta = row.querySelector('.meta')?.textContent?.toLowerCase() ?? '';
      const matchesLevel = level === String(bot.level);
      const matchesName = name.toLowerCase().includes(String(bot.name ?? '').toLowerCase());
      return (matchesLevel || matchesName) && meta.includes('farmed out');
    });
  }

  function parseRewardNumber(text) {
    const value = String(text ?? '').trim().toLowerCase().replace(/,/g, '');
    const match = value.match(/(\d+(?:\.\d+)?)(k)?/);
    if (!match) return null;
    const number = Number(match[1]);
    if (!Number.isFinite(number)) return null;
    return Math.floor(number * (match[2] === 'k' ? 1000 : 1));
  }

  function campaignUiLoot(bot) {
    const rows = Array.from(document.querySelectorAll('.sheet.panel.campaign .camprow'));
    for (const row of rows) {
      const level = row.querySelector('.lvlchip')?.textContent?.trim();
      const name = row.querySelector('.name')?.textContent ?? '';
      const matchesLevel = level === String(bot.level);
      const matchesName = name.toLowerCase().includes(String(bot.name ?? '').toLowerCase());
      if (!matchesLevel && !matchesName) continue;

      const values = Array.from(row.querySelectorAll('.meta .cost'))
        .map(item => parseRewardNumber(item.textContent))
        .filter(value => Number.isFinite(value));
      if (values.length < 2) return null;
      return {gold: values[0], elixir: values[1], total: values[0] + values[1]};
    }
    return null;
  }

  function markCampaignFarmed(bot) {
    const farmed = campaignFarmed();
    for (const key of campaignKeys(bot)) farmed[key] = true;
    localStorage.setItem(CAMPAIGN_FARMED_KEY, JSON.stringify(farmed));
  }

  function raidLootValue(result) {
    const loot = result?.loot ?? result?.rewards ?? result?.reward ?? {};
    const gold = loot.gold ?? result?.gold ?? result?.goldLoot ?? 0;
    const elixir = loot.elixir ?? result?.elixir ?? result?.elixirLoot ?? 0;
    return num(gold) + num(elixir);
  }

  function hasExplicitRaidLoot(result) {
    const loot = result?.loot ?? result?.rewards ?? result?.reward;
    return Boolean(
      loot && ('gold' in loot || 'elixir' in loot) ||
      result && ('gold' in result || 'elixir' in result || 'goldLoot' in result || 'elixirLoot' in result)
    );
  }

  function campaignNeededArmy(g, bot) {
    const explicit = bot.minArmySpace ?? bot.recommendedArmySpace ?? bot.requiredArmySpace;
    if (Number.isFinite(explicit)) return Math.min(armyCapacity(g), explicit);
    return Math.min(armyCapacity(g), Math.max(10, 6 + bot.level * 4));
  }

  function selectCampaignBot(s, g) {
    const candidates = [...(s.bots ?? [])]
      .filter(bot => s.levelUnlocked(bot.level) && s.campaignLootMult(bot.level) > 0)
      .map(bot => ({
        bot,
        stars: campaignStars(g, bot),
        uiLoot: campaignUiLoot(bot),
        farmed: isCampaignFarmed(bot) || isCampaignFarmedOutInUi(bot),
        neededArmy: campaignNeededArmy(g, bot),
        lootMult: s.campaignLootMult(bot.level),
      }))
      .filter(row => readyArmySpace(g) >= row.neededArmy)
      .filter(row => !row.farmed)
      .filter(row => !row.uiLoot || row.uiLoot.total > 0)
      .sort((a, b) => {
        const starDiff = Math.min(a.stars, 3) - Math.min(b.stars, 3);
        if (starDiff) return starDiff;
        const lootDiff = (b.uiLoot?.total ?? 0) - (a.uiLoot?.total ?? 0);
        if (lootDiff) return lootDiff;
        return a.bot.level - b.bot.level || b.lootMult - a.lootMult;
      });
    return candidates[0] ?? null;
  }

  function collect() {
    const currentTime = Date.now();
    if (currentTime - state.lastCollectAt < AUTO_COLLECT_INTERVAL_MS) return false;
    const button = collectReadyButton();
    if (button) {
      button.click();
      state.lastCollectAt = currentTime;
      log('Collected via visible button');
      return true;
    }
    if (typeof gs()?.collectAll === 'function') {
      gs().collectAll();
      state.lastCollectAt = currentTime;
      return true;
    }
    return false;
  }

  function defenseMaintenance() {
    const s = gs();
    const g = game();
    if (!s || !g) return false;
    let acted = false;

    if (state.autoRepairTownHall && (g.repairDue ?? 0) > 0) {
      const before = g.repairDue;
      s.repairTownHall?.();
      if ((game()?.repairDue ?? 0) < before) {
        log(`Repaired Town Hall for ${fmt(before)} gold`);
        acted = true;
      }
    }

    if (state.autoDismissAttacks) {
      const pending = typeof s.pendingDefense === 'function' ? s.pendingDefense() : [];
      if (s.ui?.underAttackOpen || s.lastDefense || pending.length > 0) {
        s.dismissUnderAttack?.();
        log(`Dismissed attack notice${pending.length ? ` (${pending.length})` : ''}`);
        acted = true;
      }
    }

    return acted;
  }

  function train() {
    const g = game();
    if (!g) return false;
    const cap = armyCapacity(g);
    if (usedArmySpace(g) >= cap) return false;
    const type = availableTroop(g);
    const troop = TROOPS[type];
    const reserve = nextArmyUpgradeReserve(g);
    if (num(g.resources?.elixir) - troop.cost < reserve) return false;
    if (num(g.resources?.elixir) < troop.cost) return false;
    if (bestBarracks(g) < troop.barracks) return false;
    gs().train(type);
    log(`Training ${troop.name}`);
    return true;
  }

  function build(row = bestBuildRow()) {
    const g = game();
    if (!row || !g) return false;
    const place = findPlace(g, row.type);
    if (!place) return false;
    gs().beginPlace(row.type);
    gs().movePlace(place.x, place.y);
    if (!gs().canConfirmPlace()) {
      log(`Could not place ${row.name}`);
      return false;
    }
    gs().confirmPlace();
    log(`Built ${row.name} at ${place.x},${place.y}`);
    return true;
  }

  function upgrade(row = bestUpgradeRow()) {
    if (!row) return false;
    gs().upgrade(row.id);
    log(`Upgrading ${row.name} #${row.id} to Lv ${row.nextLevel}`);
    return true;
  }

  function campaign() {
    const s = gs();
    const g = game();
    if (!s || !g) return false;
    const cap = armyCapacity(g);
    if (cap < 1 || readyArmySpace(g) < Math.min(10, cap)) return false;
    const target = selectCampaignBot(s, g);
    if (!target) return false;
    s.openRaid(target.bot);
    const result = s.runRaid();
    if (!result) return false;
    s.finishRaid();
    if (hasExplicitRaidLoot(result) && raidLootValue(result) <= 0) {
      markCampaignFarmed(target.bot);
    }
    log(`Campaign ${target.bot.name}: ${result.stars} stars`);
    return true;
  }

  function onlineRaid() {
    const s = gs();
    const g = game();
    if (!state.autoOnline || state.onlinePending || !s || !g) return false;
    if (typeof s.attackRandomPlayer !== 'function') return false;
    if (typeof s.attackCooldownSeconds === 'function' && s.attackCooldownSeconds() > 0) return false;
    if (readyArmySpace(g) < Math.max(10, Math.floor(armyCapacity(g) * 0.75))) return false;
    state.onlinePending = true;
    log('Online raid: finding opponent');
    Promise.resolve()
      .then(async () => {
        await s.attackRandomPlayer();
        if (!s.ui?.online || s.ui?.scene !== 'raid' || !s.ui?.raidBot) {
          log('Online raid: no opponent or blocked');
          return;
        }
        log(`Online raid: attacking ${s.ui.raidBot.name ?? 'opponent'}`);
        await s.runOnlineRaid();
        const result = s.ui?.raidResult;
        if (result) {
          log(`Online raid: ${result.stars} stars, ${Math.round(result.destruction)}%`);
          await s.finishOnlineRaid();
        } else {
          s.exitRaid?.();
          log('Online raid: no result');
        }
      })
      .catch(error => {
        log(`Online raid failed: ${error?.message ?? error}`);
      })
      .finally(() => {
        state.onlinePending = false;
        render();
      });
    return true;
  }

  function strategicStep() {
    const s = gs();
    if (!s?.loaded || !game()) {
      log('Waiting for game load');
      return false;
    }
    s.tick?.();
    if (defenseMaintenance()) return true;
    if (state.autoCollect) collect();
    const g = game();
    const th = townHallLevel(g);
    const gold = num(g.resources?.gold);
    const elixir = num(g.resources?.elixir);
    const nearGoldCap = gold >= capacity(g, 'gold') * 0.85;
    const nearElixirCap = elixir >= capacity(g, 'elixir') * 0.85;

    const armyUpgrade = keyArmyUpgradeRow();
    if (state.autoUpgrade && armyUpgrade) return upgrade(armyUpgrade);

    if (state.autoOnline && onlineRaid()) return true;
    if (state.autoTrain && train()) return true;
    if (state.autoOnline && onlineRaid()) return true;
    if (state.autoCampaign && campaign()) return true;

    const buildableRows = buildRows();
    const nextBuild = state.autoBuild ? bestBuildRow(buildableRows.filter(row => th >= 2 || row.type !== 'cannon')) : null;
    const nextUpgrade = state.autoUpgrade ? bestUpgradeRow() : null;
    const buildValue = nextBuild ? buildScore(nextBuild, g) : -Infinity;
    const upgradeValue = nextUpgrade ? upgradeScore(nextUpgrade, g) : -Infinity;

    if (nextUpgrade && (upgradeValue >= buildValue || nearGoldCap || nearElixirCap || !nextBuild)) {
      return upgrade(nextUpgrade);
    }

    if (nextBuild) {
      return build(nextBuild);
    }

    if (nextUpgrade) return upgrade(nextUpgrade);
    return false;
  }

  function loop() {
    clearTimeout(state.loopTimer);
    if (!state.running) return;
    const acted = strategicStep();
    if (acted) state.actions += 1;
    render();
    state.loopTimer = setTimeout(loop, acted ? 3500 : 8000);
  }

  function render() {
    const g = game();
    if (!g) {
      summaryEl.textContent = 'Waiting for gameStore...';
      return;
    }
    const b = builders(g);
    const army = `${usedArmySpace(g)}/${armyCapacity(g)}`;
    summaryEl.textContent = [
      `Mode: ${state.running ? 'running' : 'paused'} | Actions: ${state.actions}`,
      `Gold: ${fmt(g.resources?.gold)} / ${fmt(capacity(g, 'gold'))}`,
      `Elixir: ${fmt(g.resources?.elixir)} / ${fmt(capacity(g, 'elixir'))}`,
      `Town Hall: ${townHallLevel(g)} | Builders: ${b.free}/${b.total}`,
      `Army space: ${army} (${readyArmySpace(g)} ready) | Best troop: ${TROOPS[availableTroop(g)].name}`,
      `Campaign: ${state.autoCampaign ? 'on' : 'off'} | Online: ${state.autoOnline ? 'on' : 'off'} | Trophies: ${fmt(g.trophies)}`,
      `Defense: dismiss ${state.autoDismissAttacks ? 'on' : 'off'} | repair ${state.autoRepairTownHall ? 'on' : 'off'}${g.repairDue ? ` (${fmt(g.repairDue)} due)` : ''}`,
    ].join('\n');
    const rows = [...upgradeRows().slice(0, 6), ...buildRows().slice(0, 6)];
    planEl.innerHTML = rows.map(row => `
      <div style="border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:7px;background:${row.ok ? 'rgba(31,122,77,.22)' : 'rgba(255,255,255,.045)'}">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <strong>${row.kind === 'build' ? 'Build' : 'Upgrade'} ${row.name}</strong>
          <span style="color:${row.ok ? '#86efac' : '#fca5a5'}">${row.ok ? 'Ready' : row.reason}</span>
        </div>
        <div style="color:#cbd5e1">${row.kind === 'build' ? `${row.have}/${row.cap}` : `Lv ${row.level} -> ${row.nextLevel}`} - ${fmt(row.cost)} ${row.resource}</div>
      </div>
    `).join('');
    $('[data-a="run"]').textContent = state.running ? 'Stop' : 'Start';
    $('[data-a="run"]').style.background = state.running ? '#8a3131' : '#1f7a4d';
    $('[data-a="campaign"]').textContent = `Campaign ${state.autoCampaign ? 'on' : 'off'}`;
    $('[data-a="campaign"]').style.background = state.autoCampaign ? '#1f7a4d' : '#374151';
    $('[data-a="online"]').textContent = `Online ${state.autoOnline ? 'on' : 'off'}`;
    $('[data-a="online"]').style.background = state.autoOnline ? '#8a3131' : '#374151';
    $('[data-a="dismiss"]').textContent = `Dismiss ${state.autoDismissAttacks ? 'on' : 'off'}`;
    $('[data-a="dismiss"]').style.background = state.autoDismissAttacks ? '#1f7a4d' : '#374151';
    $('[data-a="repair"]').textContent = `Repair ${state.autoRepairTownHall ? 'on' : 'off'}`;
    $('[data-a="repair"]').style.background = state.autoRepairTownHall ? '#1f7a4d' : '#374151';
    $('[data-a="collect"]').textContent = `Collect ${state.autoCollect ? 'on' : 'off'}`;
    $('[data-a="build"]').textContent = `Build ${state.autoBuild ? 'on' : 'off'}`;
    $('[data-a="upgrade"]').textContent = `Upgrade ${state.autoUpgrade ? 'on' : 'off'}`;
    $('[data-a="train"]').textContent = `Train ${state.autoTrain ? 'on' : 'off'}`;
  }

  function remove() {
    clearTimeout(state.loopTimer);
    clearInterval(state.renderTimer);
    root.remove();
    delete window.__cotStrategyDirector;
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const action = button.getAttribute('data-a');
    if (action === 'close') remove();
    if (action === 'run') {
      state.running = !state.running;
      log(state.running ? 'Director started' : 'Director stopped');
      if (state.running) loop();
    }
    if (action === 'step') {
      strategicStep();
      render();
    }
    if (action === 'campaign') state.autoCampaign = !state.autoCampaign;
    if (action === 'online') {
      state.autoOnline = !state.autoOnline;
      log(`Online raids ${state.autoOnline ? 'enabled' : 'disabled'}`);
    }
    if (action === 'dismiss') state.autoDismissAttacks = !state.autoDismissAttacks;
    if (action === 'repair') state.autoRepairTownHall = !state.autoRepairTownHall;
    if (action === 'collect') state.autoCollect = !state.autoCollect;
    if (action === 'build') state.autoBuild = !state.autoBuild;
    if (action === 'upgrade') state.autoUpgrade = !state.autoUpgrade;
    if (action === 'train') state.autoTrain = !state.autoTrain;
    render();
  });

  state.renderTimer = setInterval(render, 1000);
  window.__cotStrategyDirector = {state, step: strategicStep, render, remove};
  makeDraggable();
  render();
  log('Strategy Director loaded');
})();
