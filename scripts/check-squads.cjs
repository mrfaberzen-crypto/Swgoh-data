const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const plans = vm.runInNewContext(fs.readFileSync('squads.js','utf8') + '\nsquadPlans;');
const roster = JSON.parse(fs.readFileSync('data/dashboard.json','utf8'));
const ids = new Set(roster.units.map(u => u.id));
for (const [mode, squads] of Object.entries(plans)) {
  const used = new Set();
  for (const s of squads) {
    assert.equal(s.members.length, Number(mode[0]), `${s.name}: wrong format size`);
    assert.equal(new Set(s.members).size, s.members.length, `${s.name}: duplicate member`);
    for (const id of s.members) {
      assert.ok(ids.has(id), `${s.name}: unknown roster ID ${id}`);
      if (!s.project) { assert.ok(!used.has(id), `${mode}: reused ${id}`); used.add(id); }
    }
  }
}
const mothers5 = plans['5v5'].find(s => s.name==='Great Mothers');
assert.ok(mothers5.members.includes('NIGHTTROOPER') && mothers5.members.includes('DEATHTROOPERPERIDEA'));
assert.ok(!plans['5v5'].some(s=>s.members[0]==='CAPTAINENOCH'));
assert.ok(plans['3v3'].find(s=>s.members[0]==='CAPTAINENOCH').project);
for(const mode of Object.keys(plans))assert.ok(plans[mode].find(s=>s.members[0]==='SUPREMELEADERKYLOREN').project);
console.log('PASS: both formats have correct sizes, valid IDs, no repeated main-lineup characters, and protected Mothers allocation.');
