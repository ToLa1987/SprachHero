const net = require('node:net');
const crypto = require('node:crypto');

function connect(url) {
  const target = new URL(url);
  const socket = net.connect(Number(target.port || 80), target.hostname);
  const state = { socket, buffer: Buffer.alloc(0), pending: new Map(), nextId: 1, opened: false };
  let handshake = Buffer.alloc(0), resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  function receive(data) {
    if (!state.opened) {
      handshake = Buffer.concat([handshake, data]);
      const split = handshake.indexOf('\r\n\r\n');
      if (split < 0) return;
      state.opened = true;
      data = handshake.subarray(split + 4);
      resolveReady();
    }
    if (data?.length) state.buffer = Buffer.concat([state.buffer, data]);
    while (state.buffer.length >= 2) {
      const a = state.buffer[0], b = state.buffer[1];
      let length = b & 127, offset = 2;
      if (length === 126) { if (state.buffer.length < 4) return; length = state.buffer.readUInt16BE(2); offset = 4; }
      else if (length === 127) { if (state.buffer.length < 10) return; length = Number(state.buffer.readBigUInt64BE(2)); offset = 10; }
      const masked = Boolean(b & 128);
      if (masked) offset += 4;
      if (state.buffer.length < offset + length) return;
      let payload = state.buffer.subarray(offset, offset + length);
      if (masked) { const mask = state.buffer.subarray(offset - 4, offset); payload = Buffer.from(payload.map((value, i) => value ^ mask[i % 4])); }
      state.buffer = state.buffer.subarray(offset + length);
      if ((a & 15) === 1) {
        const message = JSON.parse(payload.toString('utf8'));
        const waiter = state.pending.get(message.id);
        if (waiter) { state.pending.delete(message.id); waiter(message); }
      }
    }
  }
  socket.on('data', receive);
  socket.on('error', error => { for (const done of state.pending.values()) done({ error: { message: error.message } }); });
  const key = crypto.randomBytes(16).toString('base64');
  socket.write(`GET ${target.pathname} HTTP/1.1\r\nHost: ${target.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
  function command(method, params = {}) {
    const id = state.nextId++;
    const payload = Buffer.from(JSON.stringify({ id, method, params }));
    const mask = crypto.randomBytes(4);
    let header;
    if (payload.length < 126) header = Buffer.from([0x81, 0x80 | payload.length]);
    else { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0xfe; header.writeUInt16BE(payload.length, 2); }
    const masked = Buffer.from(payload.map((value, i) => value ^ mask[i % 4]));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { state.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 90000);
      state.pending.set(id, response => { clearTimeout(timer); response.error ? reject(new Error(response.error.message)) : resolve(response.result); });
      socket.write(Buffer.concat([header, mask, masked]));
    });
  }
  return { ready, command, close: () => socket.destroy() };
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  let browser, page, browserContextId;
  try {
    const version = await fetch('http://127.0.0.1:9222/json/version').then(response => response.json());
    browser = connect(version.webSocketDebuggerUrl);
    await browser.ready;
    ({ browserContextId } = await browser.command('Target.createBrowserContext', { disposeOnDetach: true }));
    const { targetId } = await browser.command('Target.createTarget', { url: 'about:blank', browserContextId });
    await wait(250);
    const targets = await fetch('http://127.0.0.1:9222/json/list').then(response => response.json());
    const tab = targets.find(target => target.id === targetId);
    if (!tab) throw new Error('Isolierter Testtab wurde nicht angelegt.');
    page = connect(tab.webSocketDebuggerUrl);
    await page.ready;
    await page.command('Page.enable');
    await page.command('Network.enable');
    await page.command('Network.setBypassServiceWorker', { bypass: true });
    await page.command('Page.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    const seed = `localStorage.setItem('sprachhero_users',JSON.stringify([{id:'learningpath-regression',name:'Regression Test',avatar:'🧪'}]));localStorage.setItem('sprachhero_current_user','learningpath-regression');localStorage.setItem('sprachhero_global_v7',JSON.stringify({language:'en',darkMode:false,dailyGoal:30,weeklyGoal:150,monthlyGoal:600,streaks:{}}));`;
    await page.command('Page.addScriptToEvaluateOnNewDocument', { source: seed });
    await page.command('Page.navigate', { url: 'http://127.0.0.1:5500/index.html' });
    await wait(1200);
    await page.command('Runtime.evaluate', { expression: `document.querySelector('.user-card')?.click()` });
    await wait(200);
    await page.command('Runtime.evaluate', { expression: `document.querySelector('.lang-popup-box button')?.click()` });
    await wait(800);
    await page.command('Runtime.evaluate', { expression: `document.querySelector('#mainNav [data-page="learningpath"]')?.click()` });
    let ready = false;
    for (let i = 0; i < 30 && !ready; i++) {
      await wait(500);
      const result = await page.command('Runtime.evaluate', { expression: `!!document.querySelector('.lp-level-class') && !!document.querySelector('.lp-view-switch')`, returnByValue: true });
      ready = result.result.value;
    }
    if (!ready) throw new Error('Lernpfad konnte nicht geladen werden.');
    await page.command('Runtime.evaluate', { expression: `document.querySelector('.lp-view-switch [data-mode="sub"]').click()` });
    await wait(350);
    const stagesBefore = await page.command('Runtime.evaluate', { expression: `(()=>{const cards=[...document.querySelectorAll('.lp-level-sub')];return cards.slice(0,3).map(card=>({title:card.querySelector('.lp-title')?.innerText,status:card.querySelector('.lp-stage-status')?.innerText,locked:card.classList.contains('lp-stage-locked'),trainDisabled:card.querySelector('.lp-train-btn')?.disabled,words:Number((card.querySelector(':scope > p')?.innerText||'').match(/\d+/)?.[0]||0)}))})()`, returnByValue: true });
    const initialStages = stagesBefore.result.value;
    if (initialStages.length < 3 || initialStages[0].locked || !initialStages[1].locked || !initialStages[1].trainDisabled) throw new Error('Etappenstatus vor dem Trainer stimmt nicht: '+JSON.stringify(initialStages));
    const startCardTitle = initialStages[0].title;
    await page.command('Runtime.evaluate', { expression: `document.querySelector('.lp-level-sub .lp-train-btn').click()` });
    let trainerReady = false;
    for (let i = 0; i < 40 && !trainerReady; i++) {
      await wait(500);
      const result = await page.command('Runtime.evaluate', { expression: `!!document.querySelector('.trainer-main-card') && !!document.querySelector('#filterSub')`, returnByValue: true });
      trainerReady = result.result.value;
    }
    if (!trainerReady) throw new Error('Trainer wurde aus der Etappe nicht geöffnet.');
    const filter = await page.command('Runtime.evaluate', { expression: `({cls:document.querySelector('#filterClass').value,unit:document.querySelector('#filterUnit').value,sub:document.querySelector('#filterSub').value,pool:document.querySelector('#poolCountInfo').innerText})`, returnByValue: true });
    const filterState = filter.result.value;
    const expectedPool = Number(filterState.pool.match(/\d+/)?.[0] || 0);
    if (!filterState.cls || !filterState.unit || !filterState.sub || !expectedPool) throw new Error('Trainerfilter oder Wortpool fehlt: '+JSON.stringify(filterState));
    await page.command('Runtime.evaluate', { expression: `document.querySelector('#startSessionBtn').click()` });
    const train = await page.command('Runtime.evaluate', { expression: `(()=>{const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));return (async()=>{const rounds=[];for(let i=0;i<${expectedPool};i++){const show=document.querySelector('.trainer-show-btn'),right=document.querySelector('.trainer-right-btn');if(!show||!right)throw new Error('Trainerbuttons fehlen bei Runde '+i);show.click();await delay(30);if(right.disabled)throw new Error('Antwortbutton blieb deaktiviert bei Runde '+i);right.click();rounds.push(i+1);await delay(625)}return {rounds:rounds.length,sessionText:document.querySelector('.feedback')?.innerText}})()})()`, awaitPromise: true, returnByValue: true });
    await page.command('Runtime.evaluate', { expression: `document.querySelector('#startSessionBtn').click()` });
    await wait(200);
    await page.command('Runtime.evaluate', { expression: `document.querySelector('#mainNav [data-page="learningpath"]')?.click()` });
    let pathBack = false;
    for (let i = 0; i < 40 && !pathBack; i++) {
      await wait(400);
      const result = await page.command('Runtime.evaluate', { expression: `!!document.querySelector('.lp-level-sub .lp-stage-status')`, returnByValue: true });
      pathBack = result.result.value;
    }
    if (!pathBack) throw new Error('Lernpfad nach der Trainersession nicht wieder geöffnet.');
    const stageButton = await page.command('Runtime.evaluate', { expression: `document.querySelector('.lp-view-switch [data-mode="sub"]')?.click();true`, returnByValue: true });
    await wait(300);
    const afterStages = await page.command('Runtime.evaluate', { expression: `(()=>[...document.querySelectorAll('.lp-level-sub')].slice(0,3).map(card=>({title:card.querySelector('.lp-title')?.innerText,status:card.querySelector('.lp-stage-status')?.innerText,locked:card.classList.contains('lp-stage-locked'),complete:card.classList.contains('lp-stage-complete'),trainDisabled:card.querySelector('.lp-train-btn')?.disabled})))()`, returnByValue: true });
    const finalStages = afterStages.result.value;
    if (!finalStages[0]?.complete || finalStages[0]?.trainDisabled || finalStages[1]?.locked || finalStages[1]?.trainDisabled || !finalStages[2]?.locked || !finalStages[2]?.trainDisabled) throw new Error('Freischaltung nach der Session stimmt nicht: '+JSON.stringify(finalStages));
    await page.command('Runtime.evaluate', { expression: 'document.querySelector("#hero-intro")?.remove();window.scrollTo(0,700);true' });
    await wait(700);
    const scroll = await page.command('Runtime.evaluate', { expression: `(()=>{const main=document.querySelector('.lp-main-area'),header=document.querySelector('.lp-header'),spy=document.querySelector('.lp-scrollspy'),active=document.querySelectorAll('.lp-spy-item.active');return {scrollY,documentHeight:document.documentElement.scrollHeight,mainOverflow:getComputedStyle(main).overflowY,mainHeight:getComputedStyle(main).height,mainScrollHeight:main.scrollHeight,mainClientHeight:main.clientHeight,headerPosition:getComputedStyle(header).position,spyPosition:getComputedStyle(spy).position,spyTop:getComputedStyle(spy).top,activeSpyItems:active.length,activeSpyText:active[0]?.innerText}})()`, returnByValue: true });
    const shot = await page.command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    require('node:fs').writeFileSync('.lp-regression.png', Buffer.from(shot.data, 'base64'));
    console.log(JSON.stringify({ isolatedProfileOnly: true, startingStage: startCardTitle, trainerFilters: filterState, trainerRounds: train.result.value, firstThreeStagesAfterTraining: finalStages, scrollCheck: scroll.result.value, screenshot: '.lp-regression.png' }, null, 2));
  } finally {
    if (browser && browserContextId) {
      try { await browser.command('Target.disposeBrowserContext', { browserContextId }); } catch {}
    }
    page?.close();
    browser?.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
