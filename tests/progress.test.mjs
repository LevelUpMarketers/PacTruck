import assert from 'node:assert/strict';
import test from 'node:test';
import { RunProgress } from '../.test-build/state/RunProgress.js';

const setup = () => ({
  companyName: 'Cool Air',
  email: 'private@example.test',
  competitorNames: ['North HVAC', 'South HVAC', 'West HVAC'],
  profileId: 'balanced',
});
const result = (month, counts = [100, 100, 100, 100]) => ({ month, leadPellets: counts });

test('a new run starts at Month 1 with no completed results', () => {
  const run = new RunProgress(setup());
  assert.equal(run.month, 1);
  assert.equal(run.isFinished, false);
  assert.deepEqual(run.results, []);
  for (let id = 0; id < 4; id++) assert.equal(run.totalLeads(id), 0);
  assert.throws(() => run.advanceMonth());
});

test('all twelve months reuse progress and preserve cumulative leads', () => {
  const run = new RunProgress(setup());
  for (let month = 1; month <= 12; month++) {
    assert.equal(run.month, month);
    run.record(result(month, [200, 100, 60, 40]));
    assert.equal(run.results.length, month);
    assert.equal(run.totalLeads(0), month * 400);
    assert.equal(run.totalLeads(1), month * 200);
    assert.equal(run.totalLeads(2), month * 120);
    assert.equal(run.totalLeads(3), month * 80);
    assert.equal(run.isFinished, month === 12);
    assert.equal(run.advanceMonth(), month < 12);
  }
  assert.equal(run.month, 12);
  assert.equal(run.advanceMonth(), false);
  assert.deepEqual(run.results.map(entry => entry.month), Array.from({ length: 12 }, (_, i) => i + 1));
});

test('months cannot be skipped, recorded out of order, or credited twice', () => {
  const run = new RunProgress(setup());
  assert.throws(() => run.record(result(0)));
  assert.throws(() => run.record(result(2)));
  run.record(result(1));
  assert.throws(() => run.record(result(1)));
  run.advanceMonth();
  assert.throws(() => run.record(result(1)));
  assert.throws(() => run.record(result(3)));
  assert.throws(() => run.advanceMonth());
  run.record(result(2));
  assert.equal(run.results.length, 2);
});

test('completed results must have four whole, nonnegative counts totaling 400', () => {
  const run = new RunProgress(setup());
  for (const counts of [
    [100, 100, 100],
    [100, 100, 100, 99],
    [100, 100, 100, 101],
    [-1, 201, 100, 100],
    [100.5, 99.5, 100, 100],
    [NaN, 100, 100, 100],
    [Infinity, 100, 100, 100],
    [100, 100, 100, '100'],
  ]) assert.throws(() => run.record(result(1, counts)));
  assert.deepEqual(run.results, []);
  run.record(result(1, [400, 0, 0, 0]));
  assert.equal(run.totalLeads(0), 800);
});

test('setup and recorded results are independent of caller-owned objects', () => {
  const draft = setup();
  const run = new RunProgress(draft);
  draft.companyName = 'Different company';
  draft.email = '';
  draft.competitorNames[0] = 'Changed competitor';
  assert.equal(run.setup.companyName, 'Cool Air');
  assert.equal(run.setup.email, 'private@example.test');
  assert.deepEqual(run.setup.competitorNames, ['North HVAC', 'South HVAC', 'West HVAC']);

  const entry = result(1);
  run.record(entry);
  entry.month = 9;
  entry.leadPellets[0] = 400;
  const list = run.results;
  list.push(result(2));
  assert.equal(run.results.length, 1);
  assert.equal(run.results[0].month, 1);
  assert.deepEqual(run.results[0].leadPellets, [100, 100, 100, 100]);
  assert.throws(() => { run.results[0].leadPellets[0] = 200; });
});

test('company lookup rejects IDs outside the four companies', () => {
  const run = new RunProgress(setup());
  for (const id of [-1, 4, 0.5, NaN]) assert.throws(() => run.totalLeads(id));
});
