#!/usr/bin/env node
'use strict';

/**
 * Consolida janelas de execução (NDJSON) em test-windows.json para correlação CloudWatch.
 *
 * Uso (interno — chamado por run-all.sh):
 *   node load-tests/emit-test-windows.js \
 *     --out=load-tests/results/20260517T120000/test-windows.json \
 *     --run-id=20260517T120000 \
 *     --batch-started-at=2026-05-17T12:00:00.123Z \
 *     --batch-started-epoch-ms=1715952000123 \
 *     --batch-ended-at=2026-05-17T13:00:00.456Z \
 *     --batch-ended-epoch-ms=1715955600456 \
 *     --ndjson=load-tests/results/.../.test-windows.ndjson
 */

const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  }),
);

const outFile = args.out;
const ndjsonPath = args.ndjson;

if (!outFile || !ndjsonPath) {
  console.error(
    '[emit-test-windows] Uso: --out=... --ndjson=... [--run-id=] [--batch-started-at=] ...',
  );
  process.exit(1);
}

const tests = [];
if (fs.existsSync(ndjsonPath)) {
  const lines = fs.readFileSync(ndjsonPath, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      tests.push(JSON.parse(line));
    } catch (e) {
      console.warn(`[emit-test-windows] linha ignorada: ${e.message}`);
    }
  }
}

const batchStartedMs = Number(args['batch-started-epoch-ms'] || 0);
const batchEndedMs = Number(args['batch-ended-epoch-ms'] || 0);

const output = {
  run_id: args['run-id'] || null,
  timezone: 'UTC',
  cloudwatch: {
    note:
      'No console CloudWatch Metrics, use intervalo absoluto (UTC) de cada teste. ' +
      'Métricas ECS/RDS/ElastiCache: filtre pelo período started_at → ended_at.',
    console_time_range_format: 'absolute UTC',
  },
  batch: {
    started_at: args['batch-started-at'] || null,
    ended_at: args['batch-ended-at'] || null,
    started_at_epoch_ms: batchStartedMs || null,
    ended_at_epoch_ms: batchEndedMs || null,
    duration_ms:
      batchStartedMs && batchEndedMs ? batchEndedMs - batchStartedMs : null,
  },
  tests: Object.fromEntries(
    tests.map((t) => [
      t.name,
      {
        label: t.label || t.name,
        scenario: t.scenario ?? null,
        status: t.status || 'unknown',
        exit_code: t.exit_code ?? null,
        started_at: t.started_at || null,
        ended_at: t.ended_at || null,
        started_at_epoch_ms: t.started_at_epoch_ms ?? null,
        ended_at_epoch_ms: t.ended_at_epoch_ms ?? null,
        duration_ms: t.duration_ms ?? null,
        cloudwatch: t.started_at && t.ended_at
          ? {
              from: t.started_at,
              to: t.ended_at,
              from_epoch_ms: t.started_at_epoch_ms,
              to_epoch_ms: t.ended_at_epoch_ms,
            }
          : null,
      },
    ]),
  ),
};

fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
console.log(`[emit-test-windows] ${tests.length} janela(s) → ${outFile}`);
