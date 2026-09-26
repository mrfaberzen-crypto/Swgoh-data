const $ = id => document.getElementById(id);
let snapshot;
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
}
async function load() {
  $('reload').disabled = true;
  try {
    const response = await fetch('data/dashboard.json', {cache: 'no-store'});
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
