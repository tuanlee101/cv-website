/* =====================================================================
   CV website — script.js
   Nội dung được render 100% từ data.json. Muốn đổi nội dung: sửa data.json.
   Không dùng thư viện ngoài. Không build step.
   ===================================================================== */

(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------ tiện ích */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Chỉ coi là link thật khi bắt đầu bằng http(s)/mailto/tel; còn lại là chỗ cần điền
  function isRealUrl(url) {
    return typeof url === 'string' && /^(https?:|mailto:|tel:)/i.test(url.trim());
  }

  function isPlaceholder(text) {
    return typeof text === 'string' && text.indexOf('[CẦN ĐIỀN') !== -1;
  }

  var ICONS = {
    github: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5.5h18v13H3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m3.6 6.4 8.4 6.4 8.4-6.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 3.2h2.9L11 7.3l-1.9 1.4a12.4 12.4 0 0 0 5.7 5.7L16.2 12.5l4.1 1.5v2.9a2.1 2.1 0 0 1-2.3 2.1A16.5 16.5 0 0 1 4.5 4.9 2.1 2.1 0 0 1 6.6 3.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.4 12h17.2M12 3.2c2.4 2.8 2.4 14.8 0 17.6M12 3.2c-2.4 2.8-2.4 14.8 0 17.6" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3.5v11m0 0 4.2-4.2M12 14.5 7.8 10.3M4.5 19.5h15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 12.2c0 3.9-3.8 7-8.5 7a10 10 0 0 1-2.6-.3L5 20.5l1.2-3.2A6.7 6.7 0 0 1 3.5 12.2c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    external: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 4h6v6M20 4l-8.5 8.5M18 14.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    code: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9 8-4 4 4 4m6-8 4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.5 8.5 0 1 0 10.4 10.4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    print: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 9V3.5h10V9M7 18H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14.5h10v6H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19.5v-15m0 0 5 5m-5-5-5 5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="9" width="11.5" height="11.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 6.5V5a2 2 0 0 0-2-2H5.5a2 2 0 0 0-2 2V13a2 2 0 0 0 2 2H7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
  };

  function icon(name) { return ICONS[name] || ICONS.globe; }

  /* Inject icon tĩnh vào header/footer */
  function paintStaticIcons() {
    var t = $('#theme-toggle');
    if (t) { $('.icon-sun', t).innerHTML = ICONS.sun; $('.icon-moon', t).innerHTML = ICONS.moon; }
    var p = $('#print-btn'); if (p) $('.icon-print', p).innerHTML = ICONS.print;
    var u = $('#to-top'); if (u) $('.icon-up', u).innerHTML = ICONS.up;
  }

  /* ------------------------------------------------------------- 1. HERO */
  function renderHero(d) {
    var p = d.profile || {};
    var socials = (p.socials || []).map(function (s) {
      var inner = icon(s.icon);
      if (isRealUrl(s.url)) {
        return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label) + '" title="' + esc(s.label) + '">' + inner + '</a></li>';
      }
      return '<li><span class="social-disabled" role="link" aria-disabled="true" aria-label="' + esc(s.label) + ' — ' + esc(s.url || '[CẦN ĐIỀN]') + '" title="' + esc(s.url || '[CẦN ĐIỀN]') + '">' + inner + '</span></li>';
    }).join('');

    var meta = [];
    if (p.location) meta.push('<li>' + ICONS.pin + '<span>' + esc(p.location) + '</span></li>');
    if (p.email) meta.push('<li>' + ICONS.mail + '<span>' + esc(p.email) + '</span></li>');
    if (p.phone) meta.push('<li>' + ICONS.phone + '<span>' + esc(p.phone) + '</span></li>');
    if (p.availability) meta.push('<li>' + ICONS.chat + '<span>' + esc(p.availability) + '</span></li>');

    var cvBtn = isRealUrl(p.cvFile)
      ? '<a class="btn btn-primary" href="' + esc(p.cvFile) + '" download>' + ICONS.download + 'Tải CV (PDF)</a>'
      : '<button type="button" class="btn btn-primary" id="cv-btn" title="Chưa có file PDF — nút này mở hộp thoại In để bạn lưu thành PDF">' + ICONS.download + 'Tải CV (PDF)</button>';

    $('#hero-content').innerHTML =
      '<img class="avatar" src="' + esc(p.avatar || 'assets/avatar-placeholder.svg') + '" alt="' + esc(p.avatarAlt || '') + '" width="148" height="148" decoding="async">' +
      '<div>' +
        '<h1 class="hero-name" id="hero-name">' + esc(p.name) + '</h1>' +
        '<p class="hero-title">' + esc(p.title) + '</p>' +
        '<p class="hero-summary">' + esc(p.summary) + '</p>' +
      '</div>' +
      (meta.length ? '<ul class="hero-meta">' + meta.join('') + '</ul>' : '') +
      '<div class="cta-row">' + cvBtn +
        '<a class="btn btn-outline" href="#contact">' + ICONS.chat + 'Liên hệ</a>' +
      '</div>' +
      (socials ? '<ul class="social-list">' + socials + '</ul>' : '');

    // Nút CV khi chưa có file PDF → mở hộp thoại in (Save as PDF)
    var cv = $('#cv-btn');
    if (cv) cv.addEventListener('click', function () { window.print(); });

    document.title = p.name + ' — ' + p.title + ' | CV';
  }

  /* ------------------------------------------------------------ 2. ABOUT */
  function renderAbout(d) {
    var a = d.about || {};
    var paras = (a.paragraphs || []).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('');
    var facts = (a.facts || []).map(function (f) {
      return '<li class="fact"><div class="fact-value">' + esc(f.value) + '</div><div class="fact-label">' + esc(f.label) + '</div></li>';
    }).join('');
    $('#about-content').innerHTML =
      '<div class="about-body" data-reveal>' + paras + '</div>' +
      (facts ? '<ul class="facts" data-reveal>' + facts + '</ul>' : '');
  }

  /* ----------------------------------------------------------- 3. SKILLS */
  function renderSkills(d) {
    var groups = (d.skills || []).map(function (g) {
      var rows = (g.items || []).map(function (it) {
        var lvl = typeof it.level === 'number' && it.level >= 0 && it.level <= 100 ? it.level : null;
        if (lvl !== null) {
          return '<li class="skill-row"><div class="skill-top"><b>' + esc(it.name) + '</b><span>' + lvl + '%</span></div>' +
                 '<div class="bar" aria-hidden="true"><span style="width:' + lvl + '%"></span></div></li>';
        }
        return '<li class="chip">' + esc(it.name) + '</li>';
      });
      var hasBars = (g.items || []).some(function (it) { return typeof it.level === 'number'; });
      var body = hasBars
        ? '<ul>' + rows.join('') + '</ul>'
        : '<ul class="chips">' + rows.join('') + '</ul>';
      return '<article class="skill-card" data-reveal><h3>' + esc(g.group) + '</h3>' + body + '</article>';
    }).join('');
    $('#skills-grid').innerHTML = groups;
  }

  /* ------------------------------------------------------- 4. EXPERIENCE */
  function renderExperience(d) {
    var items = (d.experience || []).map(function (e) {
      var bullets = (e.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
      return '<li data-reveal><div class="entry">' +
        '<div class="entry-head">' +
          '<h3 class="entry-title">' + esc(e.title) + '</h3>' +
          (e.company ? '<span class="entry-company">· ' + esc(e.company) + '</span>' : '') +
        '</div>' +
        '<p class="entry-meta">' +
          (e.period ? '<span>' + esc(e.period) + '</span>' : '') +
          (e.location ? '<span>' + esc(e.location) + '</span>' : '') +
        '</p>' +
        (bullets ? '<ul class="entry-body">' + bullets + '</ul>' : '') +
      '</div></li>';
    }).join('');
    $('#experience-timeline').innerHTML = items;
  }

  /* --------------------------------------------------------- 5. PROJECTS */
  function renderProjects(d) {
    var cards = (d.projects || []).map(function (pr) {
      var tech = (pr.tech || []).map(function (t) { return '<li class="chip">' + esc(t) + '</li>'; }).join('');
      var links = '';
      if (isRealUrl(pr.demo)) links += '<a href="' + esc(pr.demo) + '" target="_blank" rel="noopener noreferrer">' + ICONS.external + 'Demo</a>';
      else if (pr.demo) links += '<span class="link-placeholder" title="' + esc(pr.demo) + '">' + ICONS.external + 'Demo: ' + esc(pr.demo) + '</span>';
      if (isRealUrl(pr.source)) links += '<a href="' + esc(pr.source) + '" target="_blank" rel="noopener noreferrer">' + ICONS.code + 'Mã nguồn</a>';
      else if (pr.source) links += '<span class="link-placeholder" title="' + esc(pr.source) + '">' + ICONS.code + 'Mã nguồn: ' + esc(pr.source) + '</span>';

      return '<article class="card" data-reveal>' +
        '<h3>' + esc(pr.name) + '</h3>' +
        '<p>' + esc(pr.description) + '</p>' +
        (tech ? '<ul class="chips">' + tech + '</ul>' : '') +
        (links ? '<div class="card-links">' + links + '</div>' : '') +
      '</article>';
    }).join('');
    $('#projects-grid').innerHTML = cards;
  }

  /* ------------------------------------------------- 6. HỌC VẤN / CERT */
  function renderEducation(d) {
    var edu = (d.education || []).map(function (e) {
      return '<li data-reveal><div class="entry">' +
        '<div class="entry-head"><h4 class="entry-title">' + esc(e.title) + '</h4>' +
          (e.school ? '<span class="entry-company">· ' + esc(e.school) + '</span>' : '') + '</div>' +
        '<p class="entry-meta">' + (e.period ? '<span>' + esc(e.period) + '</span>' : '') + '</p>' +
        (e.note ? '<p class="entry-body">' + esc(e.note) + '</p>' : '') +
      '</div></li>';
    }).join('');
    $('#education-list').innerHTML = edu;

    var certs = (d.certificates || []).map(function (c) {
      return '<li data-reveal><span class="cert-name">' + esc(c.name) + '</span>' +
             '<span class="cert-meta">' + esc([c.issuer, c.year].filter(Boolean).join(' · ')) + '</span></li>';
    }).join('');
    $('#cert-list').innerHTML = certs;
  }

  /* ---------------------------------------------------------- 7. CONTACT */
  function renderContact(d) {
    var c = d.contact || {};
    if (c.note) $('#contact-note').textContent = c.note;

    var items = (c.items || []).map(function (it) {
      var value = isRealUrl(it.url)
        ? '<a class="contact-value" href="' + esc(it.url) + '">' + esc(it.value) + '</a>'
        : '<span class="contact-value">' + esc(it.value) + '</span>';
      var copyBtn = it.label === 'Email' && !isPlaceholder(it.value)
        ? ' <button type="button" class="btn btn-ghost" id="copy-email" style="min-height:32px;padding:.25rem .6rem;font-size:.8rem">' + ICONS.copy + 'Chép</button>'
        : '';
      return '<li>' + icon(it.icon) + '<div><span class="contact-label">' + esc(it.label) + '</span>' + value + copyBtn + '</div></li>';
    }).join('');
    $('#contact-info').innerHTML = items;

    var copy = $('#copy-email');
    if (copy) copy.addEventListener('click', function () { copyEmail(c.value || c.items[0].value, copy); });
  }

  // Chép email: 3 tầng (clipboard API → textarea + execCommand → hiện hộp chọn được)
  function copyEmail(text, btn) {
    var done = function () { flash(btn, 'Đã chép ✓'); };
    var fallback = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) { done(); return; }
      } catch (e) { /* rơi xuống tầng 3 */ }
      window.prompt('Chép email thủ công (Ctrl/Cmd + C):', text);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
  }

  function flash(btn, msg) {
    if (!btn) return;
    var old = btn.innerHTML;
    btn.innerHTML = msg;
    btn.disabled = true;
    setTimeout(function () { btn.innerHTML = old; btn.disabled = false; }, 1600);
  }

  /* Form liên hệ: chỉ validate phía client, gửi bằng mailto */
  function initForm(emailTo) {
    var form = $('#contact-form');
    if (!form) return;
    var statusEl = $('#form-status');

    var rules = [
      { id: 'cf-name', errId: 'cf-name-err', test: function (v) { return v.trim().length >= 2; }, msg: 'Vui lòng nhập họ tên (ít nhất 2 ký tự).' },
      { id: 'cf-email', errId: 'cf-email-err', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'Email chưa đúng định dạng.' },
      { id: 'cf-subject', errId: 'cf-subject-err', test: function (v) { return v.trim().length <= 120; }, msg: 'Tiêu đề tối đa 120 ký tự.' },
      { id: 'cf-message', errId: 'cf-message-err', test: function (v) { return v.trim().length >= 10; }, msg: 'Nội dung cần ít nhất 10 ký tự.' }
    ];

    function validateField(rule) {
      var input = document.getElementById(rule.id);
      var err = document.getElementById(rule.errId);
      var ok = rule.test(input.value);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      err.textContent = ok ? '' : rule.msg;
      err.hidden = ok;
      return ok;
    }

    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      input.addEventListener('blur', function () { validateField(rule); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(rule);
      });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var firstBad = null;
      rules.forEach(function (rule) {
        if (!validateField(rule) && !firstBad) firstBad = document.getElementById(rule.id);
      });

      if (firstBad) {
        statusEl.className = 'form-status err';
        statusEl.textContent = 'Còn thông tin chưa hợp lệ — vui lòng kiểm tra các ô được đánh dấu.';
        firstBad.focus();
        return;
      }

      var name = $('#cf-name').value.trim();
      var mail = $('#cf-email').value.trim();
      var subject = $('#cf-subject').value.trim() || ('Liên hệ từ website CV — ' + name);
      var message = $('#cf-message').value.trim();

      if (!isRealUrl('mailto:' + emailTo) || isPlaceholder(emailTo)) {
        statusEl.className = 'form-status err';
        statusEl.textContent = 'Chưa cấu hình email nhận tin trong data.json (contact.items) — hãy điền rồi thử lại.';
        return;
      }

      var body = message + '\n\n— ' + name + '\n' + mail;
      statusEl.className = 'form-status ok';
      statusEl.textContent = 'Đang mở ứng dụng email của bạn để gửi tới ' + emailTo + ' …';
      window.location.href = 'mailto:' + encodeURIComponent(emailTo) +
        '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });

    form.addEventListener('reset', function () {
      rules.forEach(function (rule) {
        var input = document.getElementById(rule.id);
        var err = document.getElementById(rule.errId);
        input.setAttribute('aria-invalid', 'false');
        err.hidden = true; err.textContent = '';
      });
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    });
  }

  /* ------------------------------------------------------------ 8. SEO */
  function syncMeta(d) {
    var p = d.profile || {};
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', (p.summary || '').replace(/\s+/g, ' ').slice(0, 300));
    [['og:title', p.name + ' — ' + p.title], ['twitter:title', p.name + ' — ' + p.title]]
      .forEach(function (pair) {
        var el = $('meta[property="' + pair[0] + '"], meta[name="' + pair[0] + '"]');
        if (el) el.setAttribute('content', pair[1]);
      });

    // JSON-LD Person đồng bộ từ data.json
    var el = $('#ld-json');
    if (!el) return;
    var sameAs = (p.socials || []).filter(function (s) { return isRealUrl(s.url) && /^https?:/i.test(s.url); })
      .map(function (s) { return s.url; });
    var loc = (p.location || '').split(',')[0].trim();
    var ld = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: p.name,
      jobTitle: p.title,
      description: (p.summary || '').replace(/\s+/g, ' '),
      url: 'https://tuanlee101.github.io/cv-website/',
      image: new URL(p.avatar || 'assets/avatar-placeholder.svg', location.href).href,
      address: { '@type': 'PostalAddress', addressLocality: loc || undefined, addressCountry: 'VN' },
      knowsAbout: (d.skills || []).reduce(function (acc, g) { return acc.concat((g.items || []).map(function (i) { return i.name; })); }, []),
      alumniOf: (d.education || []).filter(function (e) { return e.school; }).map(function (e) {
        return { '@type': 'EducationalOrganization', name: e.school };
      }),
      sameAs: sameAs
    };
    if (isRealUrl('mailto:' + p.email) && !isPlaceholder(p.email)) ld.email = 'mailto:' + p.email;
    el.textContent = JSON.stringify(ld, null, 2);
  }

  /* --------------------------------------------------- theme / UI chrome */
  function initTheme() {
    var root = document.documentElement;
    var btn = $('#theme-toggle');
    var KEY = 'cv-theme';

    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (stored === 'dark' || stored === 'light') root.setAttribute('data-theme', stored);

    function isDark() {
      var attr = root.getAttribute('data-theme');
      if (attr) return attr === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function sync() {
      var dark = isDark();
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      btn.setAttribute('aria-label', dark ? 'Tắt chế độ tối' : 'Bật chế độ tối');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#0B1220' : '#ffffff');
    }

    btn.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      sync();
    });

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (!root.getAttribute('data-theme')) sync();
      });
    }
    sync();
  }

  function initReveal() {
    var items = $$('[data-reveal]');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  function initChrome() {
    $('#print-btn').addEventListener('click', function () { window.print(); });
    $('#to-top').addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });

    // Thanh tiến trình đọc + nav đang xem
    var bar = $('#scroll-bar');
    var links = $$('.site-nav a');
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);

    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';

      var current = null;
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= 120) current = s.id;
      });
      links.forEach(function (a) {
        if (current && a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ----------------------------------------------------------- khởi động */
  function boot(data) {
    paintStaticIcons();
    renderHero(data);
    renderAbout(data);
    renderSkills(data);
    renderExperience(data);
    renderProjects(data);
    renderEducation(data);
    renderContact(data);
    syncMeta(data);
    $('#footer-copy').textContent = '© ' + new Date().getFullYear() + ' ' + ((data.footer && data.footer.copyright) || (data.profile || {}).name || '');

    var contactEmail = (function () {
      var items = (data.contact && data.contact.items) || [];
      for (var i = 0; i < items.length; i++) if (items[i].label === 'Email') return items[i].value;
      return (data.profile || {}).email || '';
    })();

    initForm(contactEmail);
    initTheme();
    initChrome();
    initReveal();
    document.body.setAttribute('data-ready', 'true');
  }

  function fail(err) {
    console.error('[CV] Không nạp được data.json:', err, (err && err.stack) || '');
    var box = document.createElement('div');
    box.className = 'wrap';
    box.innerHTML = '<p class="noscript">Không đọc được <code>data.json</code>. Nếu bạn đang mở file bằng <code>file://</code>, hãy chạy một server tĩnh: <code>python3 -m http.server 8000</code> rồi mở http://localhost:8000</p>';
    var main = $('#main');
    if (main) main.prepend(box);
  }

  fetch('data.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(boot)
    .catch(fail);
})();
