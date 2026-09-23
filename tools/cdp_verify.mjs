#!/usr/bin/env node
// Reusable zero-dependency Chrome CDP client (Node 22+ has global fetch + WebSocket).
//
// Launch a test browser first:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//     --disable-gpu --no-first-run --remote-debugging-port=9222 \
//     --user-data-dir=/tmp/cdp-profile "http://localhost:8000" &
// (Linux: google-chrome --headless=new ... ; use a UNIQUE --user-data-dir and
//  CDP_PORT to avoid colliding with other instances.)
//
// CLI usage:
//   node cdp_verify.mjs --eval 'document.title'                  # print eval result
//   node cdp_verify.mjs --wait 8000 --eval 'state.coins.length'  # wait for async load
//   node cdp_verify.mjs --shot /tmp/page.png                     # screenshot
//   CDP_PORT=9333 node cdp_verify.mjs --eval '...'               # pick another port
//
// Import usage (ESM):
//   import { evalJS, screenshot, sleep } from './cdp_verify.mjs'
//   await evalJS(`document.querySelector('#btn').click()`)
//   console.log(await evalJS(`getComputedStyle(document.getElementById('modal')).display`))

import { writeFileSync } from 'fs';

const PORT = process.env.CDP_PORT || '9222';
const args = process.argv.slice(2);
const getArg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

const expr = getArg('--eval');
const waitMs = parseInt(getArg('--wait') || '0', 10);
const shot = getArg('--shot');

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === 'page');
if (!page) { console.error('No page target on CDP port ' + PORT + ' — is Chrome running with --remote-debugging-port?'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
export function send(method, params = {}) {
  return new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id);
    pending.delete(m.id);
    m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
  }
};
await new Promise((r, j) => { ws.onopen = r; ws.onerror = () => j(new Error('WS connect failed')); });

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function evalJS(expression) {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

export async function screenshot(path) {
  await send('Page.enable');
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path, Buffer.from(r.data, 'base64'));
  console.log('screenshot ->', path);
}

// Poll helper: re-run a readiness predicate until true or timeout (ms)
export async function poll(expr, timeoutMs = 60000, intervalMs = 3000) {
  const start = Date.now();
  for (;;) {
    if (await evalJS(expr)) return true;
    if (Date.now() - start > timeoutMs) return false;
    await sleep(intervalMs);
  }
}

// CLI mode
if (expr || shot) {
  if (waitMs) await sleep(waitMs);
  if (expr) {
    try { console.log(JSON.stringify(await evalJS(expr), null, 2)); }
    catch (e) { console.error('eval error:', e.message); process.exit(1); }
  }
  if (shot) await screenshot(shot);
  ws.close();
  process.exit(0);
}
console.log('CDP client ready on port ' + PORT + ' (pass --eval / --wait / --shot)');
