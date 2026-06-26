/**
 * benchmark-auth.js — Measures JWT verify() vs simulated MongoDB session lookup
 * Run: node scripts/benchmark-auth.js
 */

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'benchmark-test-secret-32charslong!!';
const ITERATIONS = 1000;

// ── JWT verify ────────────────────────────────────────────────────────────────
const token = jwt.sign({ userId: 'abc123', email: 'user@test.com', name: 'Test' }, SECRET, { expiresIn: '7d' });

const jwtTimes = [];
for (let i = 0; i < ITERATIONS; i++) {
  const start = process.hrtime.bigint();
  jwt.verify(token, SECRET);
  const end = process.hrtime.bigint();
  jwtTimes.push(Number(end - start) / 1_000_000); // ms
}

// ── Simulated MongoDB lookup (async delay ~1-3ms) ─────────────────────────────
async function simulatedMongoLookup() {
  const mongoTimes = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const delay = 0.8 + Math.random() * 2.4; // simulate 0.8–3.2ms round-trip
    const start = process.hrtime.bigint();
    await new Promise(resolve => setTimeout(resolve, delay));
    const end = process.hrtime.bigint();
    mongoTimes.push(Number(end - start) / 1_000_000);
  }
  return mongoTimes;
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * p / 100)].toFixed(3);
}

(async () => {
  const mongoTimes = await simulatedMongoLookup();

  console.log('\n=== JWT verify() ===');
  console.log(`p50: ${percentile(jwtTimes, 50)} ms`);
  console.log(`p95: ${percentile(jwtTimes, 95)} ms`);
  console.log(`p99: ${percentile(jwtTimes, 99)} ms`);

  console.log('\n=== Simulated MongoDB session.findOne() ===');
  console.log(`p50: ${percentile(mongoTimes, 50)} ms`);
  console.log(`p95: ${percentile(mongoTimes, 95)} ms`);
  console.log(`p99: ${percentile(mongoTimes, 99)} ms`);

  const ratio = parseFloat(percentile(mongoTimes, 50)) / parseFloat(percentile(jwtTimes, 50));
  console.log(`\nJWT is ${ratio.toFixed(0)}x faster at p50\n`);
})();
