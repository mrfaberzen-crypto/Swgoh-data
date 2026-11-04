import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('worker/index.js', 'utf8');
const worker = (await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))).default;
const realFetch = globalThis.fetch;
const origin = 'https://mrfaberzen-crypto.github.io';
const env = {DASHBOARD_ACCESS_TOKEN:'test-dashboard', MHANNDALORIAN_API_KEY:'test-api', PRIVATE_DATA_GITHUB_TOKEN:'test-github'};
const inventory = {items:[{id:'test-item',quantity:7}]};
let calls;
function queue(responses) {
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({url, options});
    assert.ok(responses.length, 'Unexpected outbound request');
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return Response.json(next.body ?? {}, {status:next.status ?? 200});
  };
}
function request(token = env.DASHBOARD_ACCESS_TOKEN) {
  return new Request('https://swgoh-data.mrfaberzen.workers.dev/api/private/inventory', {
    method:'POST', headers:{Origin:origin, Authorization:'Bearer ' + token}
  });
}
async function verifyLive(response, saved) {
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), inventory);
  assert.equal(response.headers.get('X-Snapshot-Saved'), String(saved));
  assert.equal(response.headers.get('Cache-Control'), 'no-store, private');
  assert.ok(response.headers.get('Access-Control-Expose-Headers').includes('X-Snapshot-Error'));
}
try {
  queue([{body:inventory},{body:{sha:'old'}},{status:201}]);
  await verifyLive(await worker.fetch(request(),env),true);
  const write = JSON.parse(calls[2].options.body);
  assert.equal(write.sha,'old');
  assert.deepEqual(JSON.parse(Buffer.from(write.content,'base64').toString()).data,inventory);

  queue([{body:inventory},{body:{sha:'old'}},{status:500},{body:{sha:'new'}},{status:201}]);
  await verifyLive(await worker.fetch(request(),env),true);
  assert.equal(JSON.parse(calls[4].options.body).sha,'new');

  queue([{body:inventory},{body:{sha:'old'}},{status:409},{body:{sha:'new'}},{status:201}]);
  await verifyLive(await worker.fetch(request(),env),true);

  queue([{body:inventory},{status:401}]);
  const expired = await worker.fetch(request(),env);
  assert.ok(expired.headers.get('X-Snapshot-Error').includes('HTTP 401'));
  await verifyLive(expired,false);
  assert.equal(calls.length,2,'Do not retry invalid credentials');

  queue([{body:inventory},{status:404},{status:404}]);
  const denied = await worker.fetch(request(),env);
  assert.ok(denied.headers.get('X-Snapshot-Error').includes('HTTP 404'));
  await verifyLive(denied,false);

  queue([{body:inventory},{status:500},{status:503},{status:502}]);
  await verifyLive(await worker.fetch(request(),env),false);
  assert.equal(calls.length,4,'Bound retries');

  queue([{body:inventory},new Error('private transport detail'),new Error('private transport detail'),new Error('private transport detail')]);
  const network = await worker.fetch(request(),env);
  assert.ok(!network.headers.get('X-Snapshot-Error').includes('private transport detail'));
  await verifyLive(network,false);

  queue([{body:inventory}]);
  await verifyLive(await worker.fetch(request(),{...env,PRIVATE_DATA_GITHUB_TOKEN:undefined}),false);

  queue([]);
  assert.equal((await worker.fetch(request('wrong'),env)).status,401);
  assert.equal(calls.length,0);
  const blocked = new Request(request(),{headers:{Origin:'https://other.example',Authorization:'Bearer test-dashboard'}});
  assert.equal((await worker.fetch(blocked,env)).status,403);
  assert.equal(calls.length,0);

  // Exercise the actual page handler against both persistence outcomes.
  const app = readFileSync('app.js','utf8');
  const handler = app.slice(app.indexOf('async function loadPrivateData('),app.indexOf("document.querySelectorAll('[data-private]')"));
  for (const saved of [true,false]) {
    const nodes = {'access-token':{value:'test-dashboard'},'private-status':{},'private-output':{textContent:'No private data loaded.'}};
    const context = vm.createContext({$:id=>nodes[id], privateApiBase:'https://example.test', Date, JSON, encodeURIComponent,
      fetch:async()=>Response.json(inventory,{headers:{'X-Snapshot-Saved':String(saved),'X-Snapshot-Error':'GitHub snapshot save failed (HTTP 401).'}})});
    vm.runInContext(handler, context);
    const button = {};
    await context.loadPrivateData('inventory',button);
    assert.equal(nodes['private-output'].textContent, JSON.stringify(inventory,null,2));
    assert.equal(button.disabled,false);
    assert.ok(nodes['private-status'].textContent.includes(saved ? 'and saved to your private GitHub' : 'snapshot was not saved'));
    if (!saved) assert.ok(nodes['private-status'].textContent.includes('HTTP 401'));
  }
  console.log('PASS: private data success, retries, conflicts, expired token, missing token, network failure, access checks and page display.');
} finally { globalThis.fetch = realFetch; }
