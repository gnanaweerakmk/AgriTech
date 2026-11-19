const { test } = require('node:test');
const assert = require('node:assert/strict');
const model = require('../.test-build/demo-model.js');
const store = require('../.test-build/demo-store.js');

test('chart excludes held/refunded value from completed totals and preserves zero days', () => {
  const rows = model.aggregateTransactions(model.transactions, 7, '2026-10-20');
  assert.equal(rows.length, 7);
  assert.equal(rows[0].date, '2026-10-14');
  const settled = model.transactions.filter(t => t.status === 'Settled' && t.date.slice(0, 10) >= '2026-10-14');
  assert.equal(rows.reduce((s, r) => s + r.value, 0), settled.reduce((s, r) => s + r.gross, 0));
  assert.equal(rows.reduce((s, r) => s + r.count, 0), settled.length);
  assert.ok(rows.some(r => r.held > 0)); assert.ok(rows.some(r => r.refunded > 0));
  assert.deepEqual(model.aggregateTransactions([], 1, '2026-10-20')[0], {date:'2026-10-20',value:0,count:0,average:0,held:0,refunded:0});
});
test('forecast uses seven days, exposes capacity breach and reacts to changed current stock', () => {
  const first = model.forecastStock(6, 10, model.stockDays);
  assert.equal(first.length, 14);
  assert.ok(Math.abs(first[13].projected - 10.4) < 1e-8);
  assert.equal(first.find(r => r.shortage > 0).day, 13);
  assert.ok(Math.abs(model.forecastStock(7, 10, model.stockDays)[13].projected - first[13].projected - 1) < 1e-8);
  assert.equal(model.forecastStock(6, 10, model.stockDays.slice(1)), null);
  const out = model.forecastStock(1, 10, model.stockDays.map(d => ({...d,incoming:0,outgoing:1})));
  assert.equal(out[13].stockout, 13);
});
test('consent and insufficient evidence are independent gates', () => {
  assert.equal(model.financialAccess(model.applicants[0]), true);
  assert.equal(model.financialAccess(model.applicants[3]), false);
  assert.equal(model.applicants[2].assessment, null);
  assert.equal(model.financialAccess(model.applicants[2]), true);
});
test('land suitability requires verified ownership and adverse decisions require reasons', () => {
  const initial = {ownership:'Pending',suitability:'Pending',note:'',actor:'',date:''};
  assert.throws(() => model.reviewLand(initial, 'Approve suitability', '', '2026-11-19'), /Verify ownership/);
  assert.throws(() => model.reviewLand(initial, 'Reject ownership', '  ', '2026-11-19'), /reason/);
  assert.throws(() => model.reviewLand(initial, 'Request information', '', '2026-11-19'), /reason/);
  const verified = model.reviewLand(initial, 'Verify ownership', 'Deed checked', '2026-11-19');
  const approved = model.reviewLand(verified, 'Approve suitability', 'Soil reviewed', '2026-11-19');
  assert.equal(approved.suitability, 'Approved');
  const rejected = model.reviewLand(approved, 'Reject ownership', 'Conflicting title', '2026-11-19');
  assert.equal(rejected.suitability, 'Pending');
  assert.equal(initial.ownership, 'Pending');
});
test('browser history persists, broadcasts changes, skips no-ops and keeps separate records', () => {
  const data = new Map();
  global.window = new EventTarget();
  global.localStorage = {getItem:key=>data.get(key)??null,setItem:(key,val)=>data.set(key,val)};
  let broadcasts = 0; window.addEventListener(store.demoChange, () => broadcasts++);
  store.writeDemo('activity-events', []);
  store.trackChange('loan-decisions', {}, {'LN-101':'Reviewed'});
  store.trackChange('loan-decisions', {'LN-101':'Reviewed'}, {'LN-101':'Reviewed'});
  store.trackChange('market-bids', {}, {'BID-591':'Accepted'});
  const saved = JSON.parse(data.get(store.storagePrefix+'activity-events'));
  assert.equal(saved.length, 2);
  assert.equal(saved[0].reference, 'LN-101'); assert.equal(saved[1].module, 'market');
  assert.equal(store.readDemo('activity-events', []).length, 2);
  assert.ok(broadcasts >= 3);
  assert.equal(model.appendActivity(saved,saved[0]).length,2);
  store.trackChange('warehouse-stock', {cold:6,dry:12,moves:[]}, {cold:6.4,dry:12,moves:[['LOT-036','Stock-in','400 kg','C-01']]});
  const changes = store.readDemo('stock-changes', []);
  assert.ok(Math.abs(changes[0].incoming-.4)<1e-8);
  assert.equal(changes[0].type, 'cold');
});
