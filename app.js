const $ = id => document.getElementById(id);
// Pages builds are not triggered by GITHUB_TOKEN data commits; read main directly there.
const snapshotUrl = location.hostname === 'mrfaberzen-crypto.github.io'
  ? 'https://raw.githubusercontent.com/mrfaberzen-crypto/Swgoh-data/main/data/dashboard.json'
  : 'data/dashboard.json';
let snapshot;

const farmGoals = {
  executor: [
    {id:'BOSSK',name:'Bossk',track:'relic',target:5,goal:'R5'},
    {id:'TIEFIGHTERPILOT',name:'TIE Fighter Pilot',track:'relic',target:5,goal:'R5'},
    {id:'DENGAR',name:'Dengar',track:'relic',target:5,goal:'R5'},
    {id:'IG88',name:'IG-88',track:'relic',target:5,goal:'R5'},
    {id:'BOBAFETT',name:'Boba Fett',track:'relic',target:8,goal:'R8'},
    {id:'ADMIRALPIETT',name:'Admiral Piett',track:'relic',target:8,goal:'R8'},
    {id:'RAZORCREST',name:'Razor Crest',track:'stars',target:7,goal:'7★'},
    {id:'IG2000',name:'IG-2000',track:'stars',target:7,goal:'7★'},
    {id:'CAPITALFINALIZER',name:'Finalizer',track:'stars',target:5,goal:'5★'}
  ],
  fleet: [
    {id:'PUNISHINGONE',name:'Punishing One',track:'stars',target:7,goal:'7★'},
    {id:'TIEECHELON',name:'TIE Echelon',track:'stars',target:7,goal:'7★'},
    {id:'TIEBOMBERIMPERIAL',name:'Imperial TIE Bomber',track:'stars',target:7,goal:'7★'}
  ],
  slkr: [
    {id:'EMPERORPALPATINE',name:'Emperor Palpatine',track:'relic',target:7,goal:'R7'},
    {id:'KYLORENUNMASKED',name:'Kylo Ren (Unmasked)',track:'relic',target:7,goal:'R7'},
    {id:'KYLOREN',name:'Kylo Ren',track:'relic',target:7,goal:'R7'}
  ],
  era: [
    {id:'DARTHJARJAR',name:'Darth Jar Jar',track:'stars',target:5,goal:'5★'},
    {id:'LUKESTARKILLER',name:'Starkiller (Luke Concept)',track:'stars',target:5,goal:'5★'}
  ]
};
function renderGoalList(containerId, goals) {
  const container = $(containerId);
  container.replaceChildren(...goals.map(goal => {
    const unit = snapshot.units.find(u => u.id === goal.id);
    const current = unit ? (goal.track === 'relic' ? (unit.relic ?? 0) : (unit.stars ?? 0)) : 0;
    const complete = Boolean(unit && current >= goal.target);
    const card = document.createElement('div');
    card.className = 'farm-target';
    const line = document.createElement('div');
    line.className = 'farm-target-line';
    const name = document.createElement('span');
    name.className = 'farm-target-name';
    name.textContent = goal.name;
    const target = document.createElement('span');
    target.className = 'farm-target-goal';
    target.textContent = goal.goal;
    line.append(name, target);
    const status = document.createElement('div');
    status.className = 'farm-target-current' + (complete ? ' done' : '');
    status.textContent = unit
      ? (goal.track === 'relic'
          ? (unit.gear != null && unit.gear < 13 ? 'G' + unit.gear + ' · ' : '') + 'R' + current + ' of ' + goal.goal
          : unit.stars + '★ of ' + goal.goal)
      : 'Not in saved roster';
    card.append(line, status);
    if (unit) {
      const progress = document.createElement('progress');
      progress.max = goal.target;
      progress.value = Math.min(current, goal.target);
      progress.setAttribute('aria-label', goal.name + ' progress to ' + goal.goal);
      card.append(progress);
    }
    return card;
  }));
}
function renderFarmPlan() {
  renderGoalList('executor-targets', farmGoals.executor);
  renderGoalList('fleet-targets', farmGoals.fleet);
  renderGoalList('slkr-targets', farmGoals.slkr);
  renderGoalList('era-targets', farmGoals.era);
  const date = new Date(snapshot.refreshedAt);
  $('farm-freshness').textContent = Number.isFinite(date.getTime())
    ? 'Character and ship progress uses the saved roster · refreshed ' + date.toLocaleString()
    : 'Character and ship progress uses the saved roster.';
}
function render() {
  const query = $('search').value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
  const filter = $('filter').value;
  const sort = $('sort').value;
  const shown = snapshot.units.filter(u =>
    (u.name + u.id).toLocaleLowerCase().replace(/[^a-z0-9]/g, '').includes(query) &&
    (filter === 'all' || (filter === 'characters' && u.type === 'Character') ||
     (filter === 'ships' && u.type === 'Ship') || (filter === 'seven' && u.stars === 7) ||
     (filter === 'relic' && u.relic !== null)));
  shown.sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) :
    sort === 'stars' ? b.stars-a.stars || a.name.localeCompare(b.name) :
    (b.relic ?? -1)-(a.relic ?? -1) || (b.gear ?? 0)-(a.gear ?? 0) || a.name.localeCompare(b.name));
  $('count').textContent = shown.length + ' of ' + snapshot.units.length + ' units';
  $('rows').replaceChildren(...shown.map(u => {
    const tr = document.createElement('tr');
    const cells = [u.name, u.type, u.stars + '★', u.level,
      u.type === 'Ship' ? '—' : u.relic !== null ? 'R' + u.relic : u.gear !== null ? 'G' + u.gear : '—',
      u.mods ?? '—'];
    for (const value of cells) {
      const td = document.createElement('td'); td.textContent = String(value); tr.append(td);
    }
    tr.firstChild.title = u.id;
    return tr;
  }));
  $('empty').hidden = shown.length > 0;
  renderFarmPlan();
}
async function load() {
  $('reload').disabled = true;
  try {
    const response = await fetch(snapshotUrl, {cache: 'no-store'});
    if (!response.ok) throw Error('Roster unavailable (HTTP ' + response.status + ')');
    const data = await response.json();
    if (data.allyCode !== '843153117' || !Array.isArray(data.units) || !data.units.length)
      throw Error('Unexpected roster response');
    snapshot = data;
    $('name').textContent = data.name;
    $('guild').textContent = data.guild;
    $('ally').textContent = data.allyCode;
    $('total').textContent = data.units.length;
    $('seven').textContent = data.units.filter(u => u.stars === 7).length;
    $('g13').textContent = data.units.filter(u => u.type === 'Character' && u.gear === 13).length;
    $('fleet').textContent = data.arena['2'] ? '#' + data.arena['2'] : '—';
    const date = new Date(data.refreshedAt);
    const valid = Number.isFinite(date.getTime()) && date.getTime() <= Date.now() + 300000;
    const old = valid && Date.now() - date.getTime() > 86400000;
    $('freshness').textContent = valid
      ? 'Saved ' + date.toLocaleString() + (old ? ' · More than 24 hours old' : '')
      : 'Refresh time unavailable';
    $('freshness').classList.toggle('warning', !valid || old);
    $('status').textContent = '';
    render();
  } catch(error) {
    $('status').textContent = (snapshot ? 'Keeping the previous view. ' : '') +
      error.message + '. Run a roster refresh, then reload.';
  } finally { $('reload').disabled = false; }
}
$('search').addEventListener('input', () => snapshot && render());
$('filter').addEventListener('change', () => snapshot && render());
$('sort').addEventListener('change', () => snapshot && render());
$('reload').addEventListener('click', load);
load();
