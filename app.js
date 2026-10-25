const $ = id => document.getElementById(id);
// Pages builds are not triggered by GITHUB_TOKEN data commits; read main directly there.
const snapshotUrl = location.hostname === 'mrfaberzen-crypto.github.io'
  ? 'https://raw.githubusercontent.com/mrfaberzen-crypto/Swgoh-data/main/data/dashboard.json'
  : 'data/dashboard.json';
let snapshot;

const farmGoals = {
  // Complete Executor prerequisites; incomplete targets are shown first.
  executor: [
    {id:'VADER',name:'Darth Vader',track:'relic',target:7,goal:'R7'},
    {id:'ADMIRALPIETT',name:'Admiral Piett',track:'relic',target:8,goal:'R8'},
    {id:'BOBAFETT',name:'Boba Fett',track:'relic',target:8,goal:'R8'},
    {id:'RAZORCREST',name:'Razor Crest',track:'stars',target:7,goal:'7★'},
    {id:'IG2000',name:'IG-2000',track:'stars',target:7,goal:'7★'},
    {id:'TIEBOMBERIMPERIAL',name:'Imperial TIE Bomber',track:'stars',target:7,goal:'7★'},
    {id:'DENGAR',name:'Dengar',track:'relic',target:5,goal:'R5'},
    {id:'IG88',name:'IG-88',track:'relic',target:5,goal:'R5'},
    {id:'BOSSK',name:'Bossk',track:'relic',target:5,goal:'R5'},
    {id:'TIEFIGHTERPILOT',name:'TIE Fighter Pilot',track:'relic',target:5,goal:'R5'},
    {id:'SLAVE1',name:'Slave I',track:'stars',target:7,goal:'7★'},
    {id:'HOUNDSTOOTH',name:"Hound's Tooth",track:'stars',target:7,goal:'7★'},
    {id:'TIEADVANCED',name:'TIE Advanced x1',track:'stars',target:7,goal:'7★'},
    {id:'TIEFIGHTERIMPERIAL',name:'Imperial TIE Fighter',track:'stars',target:7,goal:'7★'}
  ],
  // Fleet targets support Executor and First Order; they are not all journey prerequisites.
  fleet: [
    {id:'PUNISHINGONE',name:'Punishing One',track:'stars',target:7,goal:'7★'},
    {id:'FIRSTORDERTIEECHELON',name:'TIE Echelon',track:'stars',target:7,goal:'7★'},
    {id:'TIEBOMBERIMPERIAL',name:'Imperial TIE Bomber',track:'stars',target:7,goal:'7★'}
  ],
  // All 12 relic characters plus Finalizer are required for SLKR.
  slkr: [
    {id:'KYLORENUNMASKED',name:'Kylo Ren (Unmasked)',track:'relic',target:7,goal:'R7'},
    {id:'FIRSTORDERTROOPER',name:'First Order Stormtrooper',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDEROFFICERMALE',name:'First Order Officer',track:'relic',target:5,goal:'R5'},
    {id:'KYLOREN',name:'Kylo Ren',track:'relic',target:7,goal:'R7'},
    {id:'PHASMA',name:'Captain Phasma',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDEREXECUTIONER',name:'First Order Executioner',track:'relic',target:5,goal:'R5'},
    {id:'SMUGGLERHAN',name:'Veteran Smuggler Han Solo',track:'relic',target:3,goal:'R3'},
    {id:'FOSITHTROOPER',name:'Sith Trooper',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDERSPECIALFORCESPILOT',name:'First Order SF TIE Pilot',track:'relic',target:3,goal:'R3'},
    {id:'GENERALHUX',name:'General Hux',track:'relic',target:5,goal:'R5'},
    {id:'FIRSTORDERTIEPILOT',name:'First Order TIE Pilot',track:'relic',target:3,goal:'R3'},
    {id:'EMPERORPALPATINE',name:'Emperor Palpatine',track:'relic',target:7,goal:'R7'},
    {id:'CAPITALFINALIZER',name:'Finalizer',track:'stars',target:5,goal:'5★'}
  ],
  era: [
    // Mandalorian and Grogu mini-era: 20 Oct – 17 Nov 2026.
    // 5★ is the current collection goal, not the GL requirement.
    {id:'ADELPHIRANGER',name:'Adelphi Ranger',track:'stars',target:5,goal:'5★'},
    {id:'B1MERCDROID',name:'Mercenary Guard Droid (B1)',track:'stars',target:5,goal:'5★',releaseDate:'2026-11-03'}
  ]
};
function renderGoalList(containerId, goals) {
  const container = $(containerId);
  const evaluated = goals.map(goal => {
    const unit = snapshot.units.find(u => u.id === goal.id);
    const current = !unit || goal.track === 'manual' ? null
      : goal.track === 'relic' ? (unit.relic ?? 0) : (unit.stars ?? 0);
    return {goal, unit, current, complete:current !== null && current >= goal.target};
  });
  const makeCard = ({goal, unit, current, complete}) => {
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
    status.textContent = goal.track === 'manual'
      ? 'Check in game · episode level is not in this roster snapshot'
      : !unit ? (goal.releaseDate && new Date() < new Date(goal.releaseDate + 'T00:00:00-07:00')
          ? 'Marquee begins 3 Nov 2026'
          : 'Not unlocked in saved roster')
      : goal.track === 'relic'
        ? (unit.gear != null && unit.gear < 13 ? 'G' + unit.gear + ' · ' : '') + 'R' + current + ' of ' + goal.goal
        : unit.stars + '★ of ' + goal.goal;
    card.append(line, status);
    if (unit && goal.track !== 'manual') {
      const progress = document.createElement('progress');
      progress.max = goal.target;
      progress.value = Math.min(current, goal.target);
      progress.setAttribute('aria-label', goal.name + ' progress to ' + goal.goal);
      card.append(progress);
    }
    return card;
  };
  const outstanding = evaluated.filter(item => !item.complete);
  const completed = evaluated.filter(item => item.complete);
  container.replaceChildren(...outstanding.map(makeCard));
  if (!outstanding.length) {
    const message = document.createElement('p');
    message.className = 'muted plan-note';
    message.textContent = 'All tracked targets complete.';
    container.append(message);
  }
  if (completed.length) {
    const details = document.createElement('details');
    details.className = 'completed-goals';
    const summary = document.createElement('summary');
    summary.textContent = 'Completed targets (' + completed.length + ')';
    details.append(summary, ...completed.map(makeCard));
    container.append(details);
  }
  const summaryNode = $(containerId.replace('-targets', '-summary'));
  const tracked = evaluated.filter(item => item.goal.track !== 'manual').length;
  if (summaryNode) summaryNode.textContent =
    completed.length + ' of ' + tracked + ' tracked targets complete' +
    (evaluated.length > tracked ? ' · ' + (evaluated.length - tracked) + ' manual target' : '');
}
function renderFarmPlan() {
  renderGoalList('executor-targets', farmGoals.executor);
  renderGoalList('fleet-targets', farmGoals.fleet);
  renderGoalList('slkr-targets', farmGoals.slkr);
  renderGoalList('era-targets', farmGoals.era);
  const unlocked = snapshot.units.some(u => u.name === 'Supreme Leader Kylo Ren');
  const slkrReady = farmGoals.slkr.every(goal => {
    const unit = snapshot.units.find(u => u.id === goal.id);
    return unit && (goal.track === 'relic' ? (unit.relic ?? 0) : unit.stars) >= goal.target;
  });
  $('slkr-status').textContent = unlocked
    ? 'SLKR is unlocked. All prerequisites are complete.'
    : slkrReady
      ? 'All 13 prerequisites met — you can start Heir to the Dark Side. Earn Dark Side tickets and complete the unlock tiers.'
      : 'Complete the outstanding prerequisites below before beginning the SLKR event.';
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
    const response = await fetch(freshSnapshotUrl(), {cache: 'no-store'});
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
$('reload').addEventListener('click', async () => {
  const prior = snapshot?.refreshedAt;
  await load();
  if (snapshot?.refreshedAt && snapshot.refreshedAt !== prior) {
    $('refresh-status').textContent = 'New roster loaded · ' +
      new Date(snapshot.refreshedAt).toLocaleString();
  } else if (snapshot?.refreshedAt) {
    $('refresh-status').textContent = 'Showing the latest saved roster · ' +
      new Date(snapshot.refreshedAt).toLocaleString();
  }
});

const privateApiBase = 'https://swgoh-data.mrfaberzen.workers.dev';
// A Pages site cannot securely dispatch GitHub Actions itself. The Worker holds
// the server-side GitHub credential and authenticates the dashboard access token.
const pollDelayMs = 15000;
const pollMaximumMs = 10 * 60 * 1000;
const freshSnapshotUrl = () => snapshotUrl + (snapshotUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();

// Read-only workflow status, so the mobile dashboard can diagnose a failed
// GitHub action without requiring navigation to GitHub or a browser token.
async function checkRefreshStatus() {
  const button = $('check-refresh');
  const status = $('workflow-status');
  button.disabled = true;
  status.textContent = 'Checking GitHub refresh status…';
  try {
    const response = await fetch(privateApiBase + '/api/roster/status', {cache:'no-store'});
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Status request failed (HTTP ' + response.status + ')');
    // Prefer the newest workflow run. An older failed manual run must not
    // conceal a newer successful automatic roster refresh.
    const run = data.active || data.latest || data.latestManual;
    if (!run) {
      status.textContent = 'No roster refresh runs found.';
      return;
    }
    const when = run.createdAt && Number.isFinite(Date.parse(run.createdAt))
      ? new Date(run.createdAt).toLocaleString() : 'unknown time';
    const trigger = run.event === 'workflow_dispatch' ? 'Button/manual refresh'
      : run.event === 'schedule' ? 'Scheduled refresh'
      : run.event === 'push' ? 'Automatic code-change refresh' : 'Roster refresh';
    const state = run.status !== 'completed'
      ? 'currently ' + String(run.status).replaceAll('_',' ')
      : run.conclusion === 'success' ? 'completed successfully'
      : run.conclusion === 'failure' ? 'failed' : 'finished: ' + (run.conclusion || 'unknown');
    status.textContent = trigger + ' · ' + when + ' · ' + state +
      (run.conclusion === 'failure' && data.failedStep ? ' · Failed step: ' + data.failedStep : '') +
      (run.conclusion === 'success' ? '. Reload saved roster to see the latest snapshot.' : '.');
  } catch (error) {
    status.textContent = 'Could not check the workflow: ' + error.message;
  } finally {
    button.disabled = false;
  }
}
$('check-refresh').addEventListener('click', checkRefreshStatus);

async function refreshFromGame() {
  const button = $('trigger-refresh');
  const status = $('refresh-status');
  const previousRefreshAt = snapshot ? Date.parse(snapshot.refreshedAt) : 0;
  button.disabled = true;
  status.textContent = 'Sending secure roster refresh request…';
  try {
    const response = await fetch(privateApiBase + '/api/roster/refresh', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: '{}',
      cache: 'no-store'
    });
    const result = await response.json();
    if (!response.ok) {
      throw Error(result.error || 'Roster refresh was not accepted (HTTP ' + response.status + ')');
    }
    if (result.recentlyRequested) {
      await load();
      status.textContent = result.message || 'A roster refresh is already running or was requested recently.';
      return;
    }
    if (!result.queued) throw Error('Roster refresh response was not recognized.');
    status.textContent = 'Refresh requested. Checking for the updated roster automatically…';
    const began = Date.now();
    while (Date.now() - began < pollMaximumMs) {
      await new Promise(resolve => setTimeout(resolve, pollDelayMs));
      let data;
      try {
        const check = await fetch(freshSnapshotUrl(), {cache:'no-store'});
        if (!check.ok) continue;
        data = await check.json();
      } catch {
        continue;
      }
      if (data.allyCode === '843153117' && Array.isArray(data.units) &&
          Date.parse(data.refreshedAt) > previousRefreshAt) {
        await load();
        status.textContent = 'Roster refreshed from the game · ' +
          new Date(data.refreshedAt).toLocaleString();
        return;
      }
    }
    status.textContent = 'Refresh requested, but no newer snapshot was found within 10 minutes. Try Reload saved roster or check the manual GitHub fallback for workflow errors.';
  } catch (error) {
    status.textContent = 'Could not start roster refresh: ' + error.message;
  } finally {
    button.disabled = false;
  }
}
$('trigger-refresh').addEventListener('click', refreshFromGame);

// Keep a standard password form for Android password-manager autofill.
// The secret is not persisted to browser storage by site code.
$('private-key-form').addEventListener('submit', event => event.preventDefault());

async function loadPrivateData(resource, button) {
  const token = $('access-token').value;
  const status = $('private-status');
  const output = $('private-output');
  if (!token) {
    status.textContent = 'Enter the Cloudflare dashboard access token first.';
    $('access-token').focus();
    return;
  }
  button.disabled = true;
  status.textContent = 'Requesting ' + resource.toUpperCase() + ' data…';
  try {
    const response = await fetch(privateApiBase + '/api/private/' + encodeURIComponent(resource), {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: '{}',
      cache: 'no-store'
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Request failed (HTTP ' + response.status + ')');
    output.textContent = JSON.stringify(data, null, 2);
    status.textContent = resource.toUpperCase() + ' data loaded at ' + new Date().toLocaleTimeString() +
      (response.headers.get('X-Snapshot-Saved') === 'true' ? ' and saved to your private GitHub repository.' : '.');
  } catch (error) {
    status.textContent = 'Could not load ' + resource.toUpperCase() + ': ' + error.message;
  } finally {
    button.disabled = false;
  }
}
document.querySelectorAll('[data-private]').forEach(button => {
  button.addEventListener('click', () => loadPrivateData(button.dataset.private, button));
});

load();
