// Harness kiểm tra thật cho cv-website (headless Chrome + CDP, không Puppeteer)
// Chạy: node verify.mjs   (Chrome phải đang mở với --remote-debugging-port=9222)
import { evalJS, screenshot, sleep, send } from './cdp_verify.mjs';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// thư mục ảnh: luôn là tools/shots/ dù chạy từ đâu
const SHOTS = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(SHOTS, { recursive: true });

const BASE = process.env.BASE || 'http://localhost:8000/';
let pass = 0, fail = 0;
const fails = [];
function check(name, ok, extra = '') {
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; fails.push(name + (extra ? ' → ' + extra : '')); console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')); }
}

async function setViewport(w, h) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(400);
}

async function reload() {
  await send('Page.enable');
  await send('Page.reload', { ignoreCache: true });
  await sleep(1800);
  // chờ render xong
  for (let i = 0; i < 20; i++) {
    if (await evalJS(`document.body.getAttribute('data-ready') === 'true'`)) return true;
    await sleep(400);
  }
  return false;
}

console.log('\n=== 1. Render nội dung từ data.json ===');
await setViewport(1440, 900);
await send('Page.enable');
// nếu tab đang mở ở URL khác (vd chạy với BASE=https://...github.io/cv-website/) thì điều hướng tới BASE
if ((await evalJS('location.href')) !== BASE) {
  await send('Page.navigate', { url: BASE });
  await sleep(3500);
}
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__cvErrors=[];
    window.addEventListener('error', function(e){ window.__cvErrors.push('error: ' + e.message + ' @' + e.filename + ':' + e.lineno); });
    window.addEventListener('unhandledrejection', function(e){ window.__cvErrors.push('rejection: ' + e.reason); });
    var _ce = console.error; console.error = function(){ window.__cvErrors.push('console.error: ' + Array.prototype.join.call(arguments,' ')); _ce.apply(console, arguments); };`
});
check('trang render xong (body[data-ready])', await reload());
check('title lấy từ data.json', (await evalJS('document.title')).includes('[CẦN ĐIỀN: Họ và tên]'), await evalJS('document.title'));

const counts = await evalJS(`JSON.stringify({
  heroName: (document.querySelector('#hero-name')||{}).textContent,
  avatar: (document.querySelector('.avatar')||{}).getAttribute ? document.querySelector('.avatar').getAttribute('alt') : null,
  meta: document.querySelectorAll('.hero-meta li').length,
  cta: document.querySelectorAll('.cta-row .btn').length,
  socials: document.querySelectorAll('.social-list a, .social-list .social-disabled').length,
  aboutParas: document.querySelectorAll('#about-content .about-body p').length,
  facts: document.querySelectorAll('#about-content .fact').length,
  skillCards: document.querySelectorAll('#skills-grid .skill-card').length,
  skillItems: document.querySelectorAll('#skills-grid .chip, #skills-grid .skill-row').length,
  expItems: document.querySelectorAll('#experience-timeline > li').length,
  expBullets: document.querySelectorAll('#experience-timeline .entry-body li').length,
  projectCards: document.querySelectorAll('#projects-grid .card').length,
  projectTech: document.querySelectorAll('#projects-grid .card .chip').length,
  edu: document.querySelectorAll('#education-list > li').length,
  certs: document.querySelectorAll('#cert-list > li').length,
  contactItems: document.querySelectorAll('#contact-info > li').length,
  brokenLinks: document.querySelectorAll('a[href=""], a[href="#"]').length,
  placeholderText: (document.body.innerText.match(/\\[CẦN ĐIỀN/g)||[]).length
})`);
const c = JSON.parse(counts);
console.log('   ' + counts);
check('hero có tên', !!c.heroName);
check('hero meta 4 mục (địa điểm/email/sđt/trạng thái)', c.meta === 4, 'có ' + c.meta);
check('2 nút CTA', c.cta === 2, 'có ' + c.cta);
check('4 icon mạng xã hội', c.socials === 4, 'có ' + c.socials);
check('about có 3 đoạn văn', c.aboutParas === 3, 'có ' + c.aboutParas);
check('about có 3 ô số liệu', c.facts === 3, 'có ' + c.facts);
check('kỹ năng: 3 nhóm', c.skillCards === 3, 'có ' + c.skillCards);
check('kỹ năng: 9 mục', c.skillItems === 9, 'có ' + c.skillItems);
check('kinh nghiệm: 2 mục timeline', c.expItems === 2, 'có ' + c.expItems);
check('kinh nghiệm: 5 bullet tổng', c.expBullets === 5, 'có ' + c.expBullets);
check('dự án: 3 card', c.projectCards === 3, 'có ' + c.projectCards);
check('dự án: 7 tag tech', c.projectTech === 7, 'có ' + c.projectTech);
check('học vấn: 1 mục', c.edu === 1, 'có ' + c.edu);
check('chứng chỉ: 2 mục', c.certs === 2, 'có ' + c.certs);
check('liên hệ: 3 mục', c.contactItems === 3, 'có ' + c.contactItems);
check('KHÔNG có link rỗng href="" hay "#"', c.brokenLinks === 0, 'có ' + c.brokenLinks);
check('placeholder [CẦN ĐIỀN] hiện trên trang (đúng như yêu cầu)', c.placeholderText > 20, 'có ' + c.placeholderText);

console.log('\n=== 2. SEO / JSON-LD / favicon ===');
const seo = JSON.parse(await evalJS(`JSON.stringify({
  desc: (document.querySelector('meta[name=description]')||{}).content,
  ogTitle: (document.querySelector('meta[property="og:title"]')||{}).content,
  ogImage: (document.querySelector('meta[property="og:image"]')||{}).content,
  ldType: (()=>{try{return JSON.parse(document.getElementById('ld-json').textContent)['@type']}catch(e){return 'PARSE_ERROR: '+e.message}})(),
  ldName: (()=>{try{return JSON.parse(document.getElementById('ld-json').textContent).name}catch(e){return null}})(),
  knowsAbout: (()=>{try{return JSON.parse(document.getElementById('ld-json').textContent).knowsAbout.length}catch(e){return -1}})(),
  favicon: !!document.querySelector('link[rel=icon][href*="favicon.svg"]'),
  lang: document.documentElement.lang,
  h1: document.querySelectorAll('h1').length,
  imgsNoAlt: document.querySelectorAll('img:not([alt])').length
})`));
console.log('   ' + JSON.stringify(seo));
check('meta description có nội dung', !!seo.desc && seo.desc.length > 20);
check('og:title + og:image', !!seo.ogTitle && /og-image\.png$/.test(seo.ogImage), seo.ogImage);
check('JSON-LD hợp lệ, @type=Person', seo.ldType === 'Person', String(seo.ldType));
check('JSON-LD có name + knowsAbout từ data.json', !!seo.ldName && seo.knowsAbout === 9, 'knowsAbout=' + seo.knowsAbout);
check('favicon svg', seo.favicon);
check('lang="vi"', seo.lang === 'vi');
check('chỉ 1 thẻ h1', seo.h1 === 1, 'có ' + seo.h1);
check('ảnh nào cũng có alt', seo.imgsNoAlt === 0, 'thiếu ' + seo.imgsNoAlt);

console.log('\n=== 3. Dark mode + localStorage ===');
// xoá lựa chọn cũ để kiểm tra đúng trạng thái "theo hệ thống"
await evalJS(`localStorage.removeItem('cv-theme')`);
await reload();
check('lần đầu (chưa chọn) KHÔNG set data-theme → theo hệ thống', (await evalJS(`document.documentElement.getAttribute('data-theme')`)) === null, String(await evalJS(`document.documentElement.getAttribute('data-theme')`)));
await evalJS(`document.documentElement.removeAttribute('data-theme')`);
const before = await evalJS(`getComputedStyle(document.body).backgroundColor`);
await evalJS(`document.getElementById('theme-toggle').click()`);
await sleep(500);
const after = await evalJS(`getComputedStyle(document.body).backgroundColor`);
const theme = await evalJS(`document.documentElement.getAttribute('data-theme')`);
const ls = await evalJS(`localStorage.getItem('cv-theme')`);
const pressed = await evalJS(`document.getElementById('theme-toggle').getAttribute('aria-pressed')`);
console.log(`   bg: ${before} → ${after}, theme=${theme}, ls=${ls}, aria-pressed=${pressed}`);
check('click toggle → theme đổi thật (màu nền khác)', before !== after, `${before} vs ${after}`);
check('localStorage lưu lựa chọn', ls === theme, 'ls=' + ls);
check('aria-pressed cập nhật', pressed === 'true');
await reload();
await sleep(300);
check('reload vẫn giữ dark mode', (await evalJS(`document.documentElement.getAttribute('data-theme')`)) === 'dark');
check('dark mode đổi biến CSS thật (--ink khác)', (await evalJS(`getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()`)) === '#E8EEF9', await evalJS(`getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()`));

console.log('\n=== 4. Điều hướng & về đầu trang ===');
const nav0 = JSON.parse(await evalJS(`JSON.stringify({
  anchors: [...document.querySelectorAll('.site-nav a')].map(a=>a.getAttribute('href')),
  targetsOk: [...document.querySelectorAll('.site-nav a')].every(a=>document.querySelector(a.getAttribute('href')))
})`));
check('6 anchor nav, tất cả section tồn tại', nav0.anchors.length === 6 && nav0.targetsOk, JSON.stringify(nav0.anchors));

await evalJS(`document.getElementById('projects').scrollIntoView()`);
await sleep(700);
const nav1 = JSON.parse(await evalJS(`JSON.stringify({
  current: (document.querySelector('.site-nav a[aria-current="true"]')||{}).textContent || null,
  barWidth: document.getElementById('scroll-bar').style.width,
  scrollTop: Math.round(window.scrollY)
})`));
console.log('   sau khi cuộn tới #projects: ' + JSON.stringify(nav1));
check('cuộn tới Dự án → nav đánh dấu đúng mục', nav1.current === 'Dự án', String(nav1.current));
check('thanh tiến trình đọc chạy theo scroll', parseFloat(nav1.barWidth) > 0, nav1.barWidth);

await evalJS(`document.getElementById('to-top').click()`);
await sleep(1200);
check('nút "Về đầu trang" đưa về đỉnh trang', (await evalJS('Math.round(window.scrollY)')) === 0, 'y=' + await evalJS('Math.round(window.scrollY)'));

console.log('\n=== 5. Form liên hệ: validate phía client ===');
await evalJS(`document.getElementById('contact-form').scrollIntoView()`);
await evalJS(`document.getElementById('contact-form').requestSubmit()`);
await sleep(300);
const empty = JSON.parse(await evalJS(`JSON.stringify({
  nameErr: !document.getElementById('cf-name-err').hidden,
  emailErr: !document.getElementById('cf-email-err').hidden,
  msgErr: !document.getElementById('cf-message-err').hidden,
  invalid: document.querySelectorAll('#contact-form [aria-invalid="true"]').length,
  status: document.getElementById('form-status').textContent,
  navigated: location.href !== '${BASE}'
})`));
console.log('   ' + JSON.stringify(empty));
check('bỏ trống → báo lỗi 3 ô bắt buộc', empty.nameErr && empty.emailErr && empty.msgErr && empty.invalid === 3, JSON.stringify(empty));
check('form không tự gửi đi khi lỗi', empty.navigated === false);
check('vẫn ở lại trang, báo lỗi rõ', /chưa hợp lệ/.test(empty.status), empty.status);

await evalJS(`(() => {
  document.getElementById('cf-name').value = 'Nguyễn Văn Test';
  document.getElementById('cf-email').value = 'sai-dinh-dang';
  document.getElementById('cf-message').value = 'Nội dung thử nghiệm đủ dài.';
  document.getElementById('contact-form').requestSubmit();
  return true;
})()`);
await sleep(300);
const badMail = JSON.parse(await evalJS(`JSON.stringify({
  emailErr: !document.getElementById('cf-email-err').hidden,
  emailVal: document.getElementById('cf-email-err').textContent
})`));
check('email sai định dạng → báo lỗi riêng ô email', badMail.emailErr === true && /định dạng/.test(badMail.emailVal), JSON.stringify(badMail));

await evalJS(`(() => {
  document.getElementById('cf-email').value = 'ok@example.com';
  document.getElementById('cf-message').value = 'Nội dung thử nghiệm đủ dài để hợp lệ.';
  document.getElementById('contact-form').requestSubmit();
  return true;
})()`);
await sleep(400);
const okState = JSON.parse(await evalJS(`JSON.stringify({
  errs: document.querySelectorAll('#contact-form .field-error:not([hidden])').length,
  status: document.getElementById('form-status').textContent,
  statusClass: document.getElementById('form-status').className,
  hash: location.hash
})`));
console.log('   ' + JSON.stringify(okState));
check('dữ liệu hợp lệ → không còn lỗi ô nào', okState.errs === 0, 'còn ' + okState.errs);
check('email placeholder → nhắc điền data.json, KHÔNG tạo mailto hỏng', /Chưa cấu hình email/.test(okState.status), okState.status);

console.log('\n=== 6. Ảnh / lazy / print CSS ===');
const assetsCheck = JSON.parse(await evalJS(`JSON.stringify({
  avOk: (()=>{const i=document.querySelector('.avatar');return i.complete && i.naturalWidth>0})(),
  avSrc: (document.querySelector('.avatar')||{}).src,
  printRule: [...document.styleSheets].some(s=>{try{return [...s.cssRules].some(r=>r.conditionText && r.conditionText.includes('print'))}catch(e){return false}}),
  noPrintEls: document.querySelectorAll('.no-print').length,
  printHidden: (() => {
    return (async()=>true)();
  })()
})`));
console.log('   ' + JSON.stringify(assetsCheck));
check('ảnh đại diện load thật (naturalWidth>0)', assetsCheck.avOk === true, assetsCheck.avSrc);
check('có @media print trong stylesheet', assetsCheck.printRule === true);
check('phần tử đánh dấu .no-print (nút/nav/form)', assetsCheck.noPrintEls >= 3, 'có ' + assetsCheck.noPrintEls);

// Kiểm tra thật chế độ in bằng cách giả lập media print
await send('Emulation.setEmulatedMedia', { media: 'print' });
await sleep(1400);
const printState = JSON.parse(await evalJS(`JSON.stringify({
  header: getComputedStyle(document.querySelector('.site-header')).display,
  cta: getComputedStyle(document.querySelector('.cta-row')).display,
  form: getComputedStyle(document.getElementById('contact-form')).display,
  social: getComputedStyle(document.querySelector('.social-list')).display,
  footerBtn: getComputedStyle(document.getElementById('to-top')).display,
  avatarW: document.querySelector('.avatar').getBoundingClientRect().width,
  cards: getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns,
  bodyBg: getComputedStyle(document.body).backgroundColor,
  bodyColor: getComputedStyle(document.body).color,
  breakInside: getComputedStyle(document.querySelector('.card')).breakInside,
  revealOpacity: getComputedStyle(document.querySelector('[data-reveal]')).opacity
})`));
console.log('   ' + JSON.stringify(printState));
check('bản in ẩn header/nav', printState.header === 'none');
check('bản in ẩn nút CTA + danh sách icon xã hội', printState.cta === 'none' && printState.social === 'none');
check('bản in ẩn form', printState.form === 'none');
check('bản in ẩn nút về đầu trang', printState.footerBtn === 'none');
check('bản in: chữ đen trên nền trắng', printState.bodyBg === 'rgb(255, 255, 255)', printState.bodyBg);
check('bản in: card không bị cắt (break-inside avoid)', printState.breakInside === 'avoid', printState.breakInside);
check('bản in: nội dung fade hiện đủ (opacity 1)', printState.revealOpacity === '1', printState.revealOpacity);
check('bản in: card chia 2 cột', (printState.cards || '').split(' ').length === 2, printState.cards);
await send('Emulation.setEmulatedMedia', { media: '' });
await sleep(300);

console.log('\n=== 7. Responsive 360 / 768 / 1440 ===');
const sizes = [[360, 800], [768, 1000], [1440, 900]];
const overflow = [];
for (const [w, h] of sizes) {
  await setViewport(w, h);
  await evalJS(`window.scrollTo(0,0)`);
  await sleep(600);
  const s = JSON.parse(await evalJS(`JSON.stringify({
    docW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
    heroNameSize: parseFloat(getComputedStyle(document.querySelector('.hero-name')).fontSize),
    skillCols: getComputedStyle(document.querySelector('.skills-grid')).gridTemplateColumns.split(' ').length,
    cardCols: getComputedStyle(document.querySelector('.cards-grid')).gridTemplateColumns.split(' ').length,
    toggleSize: document.getElementById('theme-toggle').getBoundingClientRect().width,
    btnH: document.querySelector('.cta-row .btn').getBoundingClientRect().height,
    minFont: Math.min(...[...document.querySelectorAll('p, li, a, span')].filter(e=>e.offsetParent!==null && e.textContent.trim()).map(e=>parseFloat(getComputedStyle(e).fontSize)))
  })`));
  console.log(`   ${w}px → ` + JSON.stringify(s));
  check(`${w}px: viewport đúng ${w}px`, s.winW === w, 'innerWidth=' + s.winW);
  check(`${w}px: không tràn ngang (scrollWidth ≤ innerWidth)`, s.docW <= s.winW + 1, `${s.docW} > ${s.winW}`);
  check(`${w}px: nút bấm ≥ 40px`, s.toggleSize >= 40 && s.btnH >= 44, `toggle ${s.toggleSize}, btn ${s.btnH}`);
  await screenshot(join(SHOTS, `cv-${w}.png`));
  if (w === 360) {
    check('360px: skills 1 cột', s.skillCols === 1, 'có ' + s.skillCols);
    check('360px: card dự án 1 cột', s.cardCols === 1, 'có ' + s.cardCols);
  }
  if (w === 768) {
    check('768px: skills 3 cột', s.skillCols === 3, 'có ' + s.skillCols);
    check('768px: card dự án 2 cột', s.cardCols === 2, 'có ' + s.cardCols);
  }
  if (w === 1440) {
    check('1440px: card dự án 3 cột', s.cardCols === 3, 'có ' + s.cardCols);
  }
}

console.log('\n=== 8. Tương phản màu (WCAG AA, nền sáng & nền tối) ===');
function lum(rgb) {
  const [r, g, b] = rgb.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function parse(css) {
  const m = String(css).match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  const h = String(css).trim().match(/^#([0-9a-f]{6})$/i);
  if (h) { const n = parseInt(h[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  return null;
}
function ratio(a, b) { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); }

for (const theme of ['light', 'dark']) {
  await evalJS(`document.documentElement.setAttribute('data-theme','${theme}')`);
  await sleep(300);
  const pairs = JSON.parse(await evalJS(`JSON.stringify({
    bg: getComputedStyle(document.body).backgroundColor,
    card: getComputedStyle(document.querySelector('.card')).backgroundColor,
    ink: getComputedStyle(document.querySelector('.card h3')).color,
    soft: getComputedStyle(document.querySelector('.card p')).color,
    accentInk: getComputedStyle(document.querySelector('.hero-title')).color,
    navLink: getComputedStyle(document.querySelector('.site-nav a')).color,
    meta: getComputedStyle(document.querySelector('.entry-meta')).color,
    danger: getComputedStyle(document.documentElement).getPropertyValue('--danger').trim(),
    ok: getComputedStyle(document.documentElement).getPropertyValue('--ok').trim(),
    errColor: (()=>{const p = document.querySelector('#cf-name-err'); return getComputedStyle(p).color})(),
    okColor: (()=>{const el = document.getElementById('form-status'); const old = el.className; el.className='form-status ok'; const c = getComputedStyle(el).color; el.className = old; return c})()
  })`));
  const bg = parse(pairs.bg), card = parse(pairs.card);
  const tests = [
    ['chữ chính trên nền trang', parse(pairs.ink), bg, 4.5],
    ['chữ phụ trên nền trang', parse(pairs.soft), bg, 4.5],
    ['chữ phụ trên nền card', parse(pairs.soft), card, 4.5],
    ['accent (hero title) trên nền trang', parse(pairs.accentInk), bg, 4.5],
    ['link nav trên nền trang', parse(pairs.navLink), bg, 4.5],
    ['meta (thời gian) trên nền trang', parse(pairs.meta), bg, 4.5],
    ['thông báo lỗi form trên nền card', parse(pairs.errColor), card, 4.5],
    ['thông báo thành công trên nền card', parse(pairs.okColor), card, 4.5]
  ];
  for (const [name, fg, b, min] of tests) {
    const r = ratio(fg, b);
    check(`${theme}: ${name} = ${r.toFixed(2)}:1 (≥${min})`, r >= min, r.toFixed(2));
  }
}
await evalJS(`document.documentElement.setAttribute('data-theme','light')`);

console.log('\n=== 9. Không lỗi console / không request hỏng ===');
const errs = await evalJS(`JSON.stringify(window.__cvErrors || [])`);
check('không có lỗi JS khi tải trang', errs === '[]', errs);
const res = JSON.parse(await evalJS(`JSON.stringify(performance.getEntriesByType('resource').map(r=>({n:r.name.split('/').pop(), s:r.responseStatus||0, t:Math.round(r.transferSize||0)})).filter(r=>r.s>=400||r.t===0))`));
check('mọi tài nguyên tải OK (không 404, không rỗng)', res.length === 0, JSON.stringify(res));
const resAll = JSON.parse(await evalJS(`JSON.stringify(performance.getEntriesByType('resource').map(r=>r.name.split('/').pop()))`));
console.log('   tài nguyên đã tải: ' + resAll.join(', '));

console.log(`\n================ KẾT QUẢ: ${pass} pass / ${fail} fail ================`);
if (fails.length) { console.log('FAIL:'); fails.forEach(f => console.log(' - ' + f)); }
process.exit(fail ? 1 : 0);
