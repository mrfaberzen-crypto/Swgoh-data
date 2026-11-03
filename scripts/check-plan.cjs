// Non-browser checks for goal progression, public mod evidence and tab structure.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('app.js', 'utf8');
const {farmGoals, slkrProgressText, modReadiness} = vm.runInNewContext(
  source.split('function renderFarmPlan()')[0] + '\n({farmGoals, slkrProgressText, modReadiness});',
  {location:{hostname:'localhost'}}
);
assert.match(slkrProgressText({gear:12,relic:null}), /Finish G13/);
assert.match(slkrProgressText({gear:13,relic:6}), /R6 saved. Finish R7/);
assert.match(slkrProgressText({gear:13,relic:7}), /R7 target complete/);
assert.doesNotMatch(slkrProgressText({gear:13,relic:7}), /Finish R7/);
assert.equal(modReadiness({modLevels:[1,12,12,3,12,12]}),6);
assert.equal(modReadiness({mods:6}),null, 'Missing level data must not appear ready');
assert.equal(modReadiness({modLevels:[15,15,15,15,15,15]}),0);
assert.equal(farmGoals.slkrBuild.filter(g=>g.track==='manual').length,2);
const raw=JSON.parse(fs.readFileSync('data/player.json','utf8'));
const view=JSON.parse(fs.readFileSync('data/dashboard.json','utf8'));
const meta=JSON.parse(fs.readFileSync('data/refresh.json','utf8'));
assert.equal(view.refreshedAt,meta.refreshedAt,'Derived view must preserve saved refresh time');
const rawById=new Map(raw.rosterUnit.map(u=>[u.definitionId.split(':')[0],u]));
for (const u of view.units) {
  const r=rawById.get(u.id);assert.ok(r);
  assert.equal(u.stars,r.currentRarity);
  if(u.type==='Character') {
    assert.deepEqual(u.modLevels,r.equippedStatMod.map(m=>m.level ?? 0));
    assert.equal(u.mods,u.modLevels.length);
    assert.equal(u.gear,r.currentTier);
    assert.equal(u.relic,r.relic.currentTier>=2 ? r.relic.currentTier-2 : null);
  } else assert.equal(u.modLevels,null);
}
const html=fs.readFileSync('index.html','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate HTML IDs');
for(const [attribute,expected] of [['data-tab',['farm-plan','squads-5v5','squads-3v3','roster','private-data']],['data-goal-tab',['slkr','executor','energy','tokens','inquisitors','era']]]) {
  const found=[...html.matchAll(new RegExp(attribute+'="([^"]+)"','g'))].map(m=>m[1]);
  assert.deepEqual(found,expected,'Preserve tab order and destinations');
}
for(const match of html.matchAll(/aria-controls="([^"]+)"/g)) assert.ok(ids.includes(match[1]));
for(const id of ['slkr-build-targets','executor-targets','inquisitor-targets','grievous-targets','fleet-targets']) assert.ok(ids.includes(id));
console.log('PASS: progression branches, unknown abilities, public mod evidence, snapshot timestamp and tab structure.');
