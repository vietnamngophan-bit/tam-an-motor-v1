(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const app = $('#app');
  const toastBox = $('#toast');
  const state = {
    site: null, products: [], categories: [], promotions: [], accessories: [], policies: [],
    admin: null, chatTimer: null, visitorKey: null
  };
  const CATEGORY = {
    motor_new: 'Xe máy mới',
    motor_used: 'Xe máy cũ',
    electric_new: 'Xe điện mới',
    electric_used: 'Xe điện cũ'
  };


  // 65 Google Fonts that render Vietnamese. Fonts are loaded on demand when selected.
  const FONT_GROUPS = [
    ['Sans hiện đại', ['Be Vietnam Pro','Inter','Manrope','Plus Jakarta Sans','DM Sans','Urbanist','Lexend','Archivo','Montserrat','Sora','Outfit','Figtree','Public Sans','Noto Sans','Nunito Sans','Mulish','Karla','Work Sans','IBM Plex Sans','Source Sans 3','Lato','Open Sans','Roboto','Cabin','Quicksand','Raleway','Barlow','Barlow Semi Condensed','Asap','Assistant','Rubik','Exo 2','Teko','Chakra Petch']],
    ['Tiêu đề mạnh', ['Barlow Condensed','Roboto Condensed','Oswald','Space Grotesk','Bebas Neue','Anton','Saira Condensed','Kanit','League Spartan','Archivo Black','Black Ops One','Orbitron','Russo One','Fjalla One','Alfa Slab One']],
    ['Serif premium', ['Noto Serif','Noto Serif Display','Source Serif 4','Merriweather','Playfair Display','Libre Baskerville','Cormorant Garamond','DM Serif Display','Fraunces','Lora','Crimson Pro','Bitter','Spectral','Prata','Bodoni Moda','Cormorant']]
  ];
  const FONT_CATALOG = FONT_GROUPS.flatMap(([, fonts]) => fonts);

  function fontOptions(selected = '') {
    return FONT_GROUPS.map(([label, fonts]) => `<optgroup label="${escapeHTML(label)}">${fonts.map(font => `<option value="${escapeHTML(font)}" ${font === selected ? 'selected' : ''}>${escapeHTML(font)}</option>`).join('')}</optgroup>`).join('');
  }
  function googleFontHref(font) {
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}&display=swap`;
  }
  function ensureGoogleFont(font) {
    if (!font || !FONT_CATALOG.includes(font)) return;
    const id = `ta-font-${font.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet'; link.href = googleFontHref(font);
    document.head.appendChild(link);
  }

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
  }
  function money(value) {
    return value === null || value === undefined || value === '' ? '' : `${Number(value).toLocaleString('vi-VN')}đ`;
  }
  function multiline(value = '') { return escapeHTML(value).replace(/\n/g, '<br>'); }
  function notify(message) {
    toastBox.textContent = message;
    toastBox.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toastBox.classList.remove('show'), 3500);
  }
  function productImage(product) {
    const color = Array.isArray(product.colors) ? product.colors.find(c => c.images && c.images.length) : null;
    return color?.images?.[0] || product.images?.[0] || '/assets/tam-an-promo.jpg';
  }
  function statusName(status) {
    return { in_stock:'Còn hàng', incoming:'Sắp về', reserved:'Đang giữ xe', sold:'Đã bán' }[status] || 'Còn hàng';
  }
  function normalize(text = '') {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  }
  function fuzzyMatch(product, query) {
    const needle = normalize(query);
    if (!needle) return true;
    const source = normalize([product.name, product.brand, product.category, ...(product.colors || []).map(c => c.name)].join(' '));
    if (source.includes(needle)) return true;
    let cursor = 0;
    for (const char of source) {
      if (char === needle[cursor]) cursor += 1;
      if (cursor === needle.length) return true;
    }
    return false;
  }
  function pipeRows(text = '') {
    return String(text).split('\n').map(line => line.split('|').map(x => x.trim())).filter(parts => parts[0]);
  }


  const PAYMENT_PLAN_LABEL = {
    cash: 'Trả thẳng',
    installment: 'Trả góp',
    bad_debt: 'Hồ sơ cần kiểm tra nợ xấu'
  };

  function paymentPlanLabel(value) {
    return PAYMENT_PLAN_LABEL[value] || 'Chưa chọn hình thức';
  }

  function configuredDownPayments(productMinimum = null) {
    const saved = String(state.site?.installment_down_payments || 'Từ 3 triệu\nTừ 5 triệu\nTừ 7 triệu\nTừ 10 triệu\nTheo tư vấn')
      .split(/\n|\|/).map(v => v.trim()).filter(Boolean);
    const byProduct = productMinimum ? `Từ ${money(productMinimum)} (theo xe đang chọn)` : '';
    return [...new Set([byProduct, ...saved].filter(Boolean))];
  }

  function paymentIntentFields(productMinimum = null) {
    const choices = configuredDownPayments(productMinimum);
    return `<div class="field full payment-intent-field"><label>Dự kiến thanh toán *</label><select name="payment_plan" class="payment-plan" required><option value="">Chọn hình thức</option><option value="cash">Trả thẳng</option><option value="installment">Trả góp</option><option value="bad_debt">Hồ sơ có nợ xấu / cần kiểm tra</option></select><small class="field-help">Chọn đúng nhu cầu để Tâm An tư vấn phù hợp. Hồ sơ nợ xấu cần được kiểm tra thực tế, không cam kết duyệt trước.</small></div><div class="field full down-payment-field is-hidden"><label>Dự kiến trả trước *</label><select name="down_payment" class="down-payment"><option value="">Chọn mức trả trước</option>${choices.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('')}</select><small class="field-help">Chỉ cần chọn khi anh/chị dự kiến trả góp.</small></div>`;
  }

  function bindPaymentIntent(form) {
    const plan = $('[name="payment_plan"]', form);
    const downWrap = $('.down-payment-field', form);
    const down = $('[name="down_payment"]', form);
    if (!plan || !downWrap || !down) return;
    const sync = () => {
      const installment = plan.value === 'installment';
      downWrap.classList.toggle('is-hidden', !installment);
      down.required = installment;
      if (!installment) down.value = '';
    };
    plan.addEventListener('change', sync);
    sync();
  }

  function paymentLeadPayload(form) {
    return {
      payment_plan: form.get('payment_plan') || '',
      down_payment: form.get('down_payment') || ''
    };
  }

  async function request(path, options = {}) {
    const config = { ...options, headers: { ...(options.headers || {}) } };
    if (config.body && typeof config.body !== 'string' && !(config.body instanceof FormData)) {
      config.headers['content-type'] = 'application/json';
      config.body = JSON.stringify(config.body);
    }
    let response;
    try { response = await fetch(path, config); }
    catch { throw new Error('Không kết nối được máy chủ.'); }
    let data;
    try { data = await response.json(); }
    catch { data = { ok:false, error:'Máy chủ trả về dữ liệu không hợp lệ.' }; }
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Có lỗi xảy ra.');
    return data;
  }

  function setSiteTheme(site) {
    const bodyFont = site.body_font || 'Be Vietnam Pro';
    const headingFont = site.heading_font || 'Barlow Condensed';
    ensureGoogleFont(bodyFont); ensureGoogleFont(headingFont);
    document.documentElement.style.setProperty('--red', site.primary_color || '#c81924');
    document.documentElement.style.setProperty('--accent', site.accent_color || '#ff6b76');
    document.documentElement.style.setProperty('--page-bg', site.background_color || '#ffffff');
    document.documentElement.style.setProperty('--ink', site.text_color || '#1b1214');
    document.documentElement.style.setProperty('--body', `'${bodyFont}', Arial, sans-serif`);
    document.documentElement.style.setProperty('--heading', `'${headingFont}', Arial, sans-serif`);
    document.documentElement.style.setProperty('--base-size', `${Math.max(14, Math.min(20, Number(site.body_font_size || 16)))}px`);
    document.documentElement.style.setProperty('--heading-scale', `${Math.max(.85, Math.min(1.35, Number(site.heading_scale || 1)))}`);
    document.documentElement.style.setProperty('--body-leading', `${Math.max(1.35, Math.min(2, Number(site.body_line_height || 1.55)))}`);
    document.documentElement.style.setProperty('--radius', `${Math.max(8, Math.min(32, Number(site.corner_radius || 22)))}px`);
    document.title = site.page_title || site.brand_name || 'Xe Máy Tâm An';
    $('#site-favicon').href = site.favicon_url || site.logo_url || '/assets/logo.jpg';
  }

  function injectTracking(site) {
    if (site.meta_pixel_id && !window.__taMetaPixel) {
      window.__taMetaPixel = true;
      const script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.onload = () => { try { window.fbq?.('init', site.meta_pixel_id); window.fbq?.('track', 'PageView'); } catch {} };
      document.head.appendChild(script);
    }
    if (site.tiktok_pixel_id && !window.__taTiktokPixel) {
      window.__taTiktokPixel = true;
      const script = document.createElement('script'); script.async = true; script.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + encodeURIComponent(site.tiktok_pixel_id); document.head.appendChild(script);
    }
  }
  function trackEvent(name, params = {}) {
    try { window.fbq?.('trackCustom', name, params); } catch {}
    try { window.ttq?.track?.(name, params); } catch {}
  }
  function trackVisit() {
    const key = visitorKey();
    request('/api/track', { method:'POST', body:{ visitor_key:key, path:location.pathname } }).catch(() => {});
  }

  async function loadPublicData() {
    const [siteResponse, productResponse] = await Promise.all([request('/api/site'), request('/api/products')]);
    state.site = siteResponse.site;
    state.categories = siteResponse.categories || [];
    state.promotions = siteResponse.promotions || [];
    state.accessories = siteResponse.accessories || [];
    state.policies = siteResponse.policies || [];
    state.products = productResponse.products || [];
    setSiteTheme(state.site);
    injectTracking(state.site);
  }

  function nav(active = '') {
    const links = [
      ['/#inventory', 'Kho xe', 'inventory'],
      ['/#promo', 'Khuyến mại', 'promo'],
      ...(state.accessories?.length ? [['/#accessories', 'Phụ kiện', 'accessories']] : []),
      ['/tra-gop', 'Trả góp', 'finance'],
      ['/#showroom', 'Showroom', 'showroom']
    ];
    const s = state.site;
    return `<header class="site-header">
      <div class="topbar"><div class="container topbar-inner"><span>${escapeHTML(s.address || '')}</span><a href="tel:${String(s.hotline || '').replace(/\s/g, '')}">☎ ${escapeHTML(s.hotline || '')}</a></div></div>
      <div class="container nav">
        <a class="brand" href="/"><img class="brand-logo" src="${escapeHTML(s.logo_url || '/assets/logo.jpg')}" alt=""><span class="brand-copy"><b>${escapeHTML(s.brand_name || 'TÂM AN')}</b><span>XE MỚI • XE CŨ • XE ĐIỆN</span></span></a>
        <nav id="mainNav" class="main-nav">${links.map(([url, label, key]) => `<a href="${url}" class="${key === active ? 'active' : ''}">${label}</a>`).join('')}</nav>
        <div class="header-actions"><a class="phone-pill" href="tel:${String(s.hotline || '').replace(/\s/g, '')}">☎ ${escapeHTML(s.hotline || '')}</a><button id="menuBtn" class="menu-btn">☰</button></div>
      </div>
    </header>`;
  }

  function socialIcon(name) {
    const icons = {
      facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.1 0-5 2-5 5.2V12H6v4h3v8h4v-8h3.3l.7-4H13V9.5c0-1 .4-1.5 1-1.5Z"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v10.2a3.3 3.3 0 1 1-2.3-3.15V7.15A7.3 7.3 0 1 0 17 14V8.4c1.1 1.05 2.45 1.72 4 1.9V6.4c-2.05-.35-3.45-1.52-4-3.4H14Z"/></svg>',
      youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12s0-3.15-.4-4.65a3 3 0 0 0-2.1-2.1C18 4.85 12 4.85 12 4.85s-6 0-7.5.4a3 3 0 0 0-2.1 2.1C2 8.85 2 12 2 12s0 3.15.4 4.65a3 3 0 0 0 2.1 2.1c1.5.4 7.5.4 7.5.4s6 0 7.5-.4a3 3 0 0 0 2.1-2.1C22 15.15 22 12 22 12Zm-12.1 3.8V8.2l6.2 3.8-6.2 3.8Z"/></svg>',
      messenger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.92 1.47 5.52 3.77 7.22V22l3.4-1.86c.9.25 1.85.39 2.83.39 5.52 0 10-4.14 10-9.28S17.52 2 12 2Zm1 12.47-2.55-2.72-4.98 2.72L11 8.65l2.55 2.72 4.98-2.72L13 14.47Z"/></svg>',
      zalo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 3.4h17.2v13.1a4.1 4.1 0 0 1-4.1 4.1H9.2L5.1 23v-2.45a4.08 4.08 0 0 1-1.7-3.25V3.4Zm4.18 4.12v2.1h4.48l-4.65 5.5v1.37h8.18v-2.1h-4.8l4.8-5.68V7.52H7.58Z"/></svg>',
      phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 2.9 4.7 4.8c-.7.7-1 1.7-.7 2.7 1.6 5.6 6 10 11.6 11.6 1 .3 2-.1 2.7-.7l1.9-1.9-3.8-3.8-1.5 1.5c-2.1-.9-3.8-2.6-4.7-4.7L11.7 8 7.9 4.2 6.6 2.9Z"/></svg>',
      chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10l-5.3 3.5A.45.45 0 0 1 4 21.1V18a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 6v2h10V9H7Zm0 4v2h7v-2H7Z"/></svg>',
      top: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.7 14.7 5.3-5.3 5.3 5.3 1.4-1.4L12 6.6l-6.7 6.7 1.4 1.4Z"/></svg>'
    };
    return icons[name] || '';
  }
  function socialLink(type, label, url, extra = '') {
    if (!url) return '';
    return `<a class="social social-${type} ${extra}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">${socialIcon(type)}<span class="sr-only">${escapeHTML(label)}</span></a>`;
  }
  function footer() {
    const s = state.site;
    const social = [
      socialLink('facebook', 'Facebook', s.facebook_url), socialLink('tiktok', 'TikTok', s.tiktok_url), socialLink('youtube', 'YouTube', s.youtube_url), socialLink('zalo', 'Zalo', s.zalo_url), socialLink('messenger', 'Messenger', s.messenger_url)
    ].filter(Boolean).join('');
    return `<footer class="site-footer"><div class="container footer-grid">
      <div><div class="footer-brand"><img src="${escapeHTML(s.logo_url || '/assets/logo.jpg')}" alt=""><div><b>${escapeHTML(s.brand_name)}</b><p>Chọn xe ưng ý. Lên đường an tâm.</p></div></div><p>${escapeHTML(s.address || '')}</p><p>${escapeHTML(s.hotline || '')}<br>${escapeHTML(s.support_email || '')}</p></div>
      <div><h3>Chính sách</h3><div class="footer-links">${state.policies.map(p => `<a href="#" data-policy="${escapeHTML(p.slug)}">${escapeHTML(p.title)}</a>`).join('')}</div></div>
      <div><h3>Giờ làm việc</h3><p style="white-space:pre-line">${escapeHTML(s.business_hours || '')}</p></div>
      <div><h3>Kết nối</h3><p class="footer-social-note">Dán link Facebook, TikTok, Zalo, YouTube trong Admin để biểu tượng hiển thị.</p><div class="socials">${social || '<span class="muted">Chưa gắn mạng xã hội.</span>'}</div></div>
    </div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} ${escapeHTML(s.brand_name)}</span><span>Xe mới • Xe cũ • Xe điện</span></div></footer>`;
  }

  function card(product) {
    const colors = (product.colors || []).slice(0, 8);
    const discount = product.old_price && product.price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
    return `<article class="product-card">
      <button class="product-media open-product" data-slug="${escapeHTML(product.slug)}"><img src="${escapeHTML(productImage(product))}" alt="${escapeHTML(product.name)}"><span class="status-badge">${statusName(product.status)}</span>${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}</button>
      <div class="product-body"><div class="product-meta">${escapeHTML(product.brand || 'TÂM AN')} • ${escapeHTML(CATEGORY[product.category] || '')}</div><h3>${escapeHTML(product.name)}</h3>
      <div class="product-details">${product.year ? `<span class="mini-tag">${product.year}</span>` : ''}${product.engine ? `<span class="mini-tag">${escapeHTML(product.engine)}</span>` : ''}</div>
      <div class="price-line">${product.price ? `<span class="price">${money(product.price)}</span>${product.old_price ? `<span class="old-price">${money(product.old_price)}</span>` : ''}` : `<span class="price-hidden">Liên hệ nhận giá</span>`}</div>
      ${colors.length ? `<div class="color-dots">${colors.map(c => `<button class="color-dot preview-color" data-image="${escapeHTML(c.images?.[0] || productImage(product))}" style="background:${escapeHTML(c.hex || '#c81924')}" title="${escapeHTML(c.name)}"></button>`).join('')}</div>` : ''}
      <div class="product-cta"><button class="btn btn-ghost open-product" data-slug="${escapeHTML(product.slug)}">Xem chi tiết</button><button class="btn btn-primary lead-button" data-product="${product.id}" data-name="${escapeHTML(product.name)}">Giữ xe</button></div></div>
    </article>`;
  }

  function scrollToCurrentHash(behavior = 'auto') {
    const hash = decodeURIComponent(location.hash || '');
    if (!hash || hash === '#') return;
    const target = document.querySelector(hash);
    if (!target) return;
    requestAnimationFrame(() => target.scrollIntoView({ behavior, block: 'start' }));
  }

  function bindHomeAnchorLinks() {
    $$('a[href^="/#"], a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const href = link.getAttribute('href') || '';
        const hashIndex = href.indexOf('#');
        const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
        const target = hash ? document.querySelector(hash) : null;
        // On the home page, the section exists now: smooth-scroll instead of relying on
        // the browser anchor jump that happened before the SPA finished rendering.
        if (target) {
          event.preventDefault();
          history.replaceState(null, '', `/${hash}`);
          $('#mainNav')?.classList.remove('mobile-open');
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function renderHome() {
    const s = state.site;
    const counts = Object.fromEntries(state.categories.map(x => [x.category, Number(x.count)]));
    const categoryCards = Object.keys(CATEGORY).filter(key => counts[key] > 0).map(key => `<a href="/#inventory" class="category-card filter-category" data-category="${key}"><b>${CATEGORY[key]}</b><span>${counts[key]} sản phẩm đang hiển thị</span><i>${key.includes('electric') ? '⚡' : '🏍️'}</i></a>`).join('');
    const promo = state.promotions[0] || { title:s.promo_title, content:s.promo_text, image_url:s.promo_image };
    app.className = '';
    app.innerHTML = `${nav()}<main>
      <section class="hero"><div class="hero-bg" style="background-image:url('${escapeHTML(s.hero_image || '/assets/tam-an-promo.jpg')}')"></div><div class="container hero-inner"><div class="hero-copy"><div class="eyebrow">${escapeHTML(s.brand_name)}</div><h1>${multiline(s.hero_title || 'Chọn xe ưng ý.\nLên đường an tâm.')}</h1><p>${escapeHTML(s.hero_subtitle || '')}</p><div class="hero-actions"><a class="btn btn-primary" href="/#inventory">Xem xe đang có</a><a class="btn btn-light" href="/tra-gop">Tư vấn trả góp</a></div></div></div></section>
      <div class="trust-strip"><div class="container"><div class="trust-grid"><div class="trust-item"><i class="trust-icon">✓</i><div><b>Thông tin rõ ràng</b><span>Giá hiển thị theo cài đặt cửa hàng.</span></div></div><div class="trust-item"><i class="trust-icon">✦</i><div><b>Hỗ trợ trả góp</b><span>Kiểm tra hồ sơ trước khi xác nhận.</span></div></div><div class="trust-item"><i class="trust-icon">⌁</i><div><b>Tình trạng cập nhật</b><span>Còn hàng, sắp về, đang giữ xe.</span></div></div><div class="trust-item"><i class="trust-icon">☎</i><div><b>Tư vấn nhanh</b><span>Gọi điện hoặc chat trực tiếp.</span></div></div></div></div></div>
      ${categoryCards ? `<section class="section"><div class="container"><div class="section-head"><div><div class="section-kicker">Khám phá kho xe</div><h2>Chọn đúng dòng xe bạn cần.</h2><p class="section-lead">Danh mục chỉ xuất hiện khi đang có sản phẩm.</p></div></div><div class="category-grid">${categoryCards}</div></div></section>` : ''}
      <section id="inventory" class="section section-soft"><div class="container"><div class="section-head"><div><div class="section-kicker">Kho xe Tâm An</div><h2>Xe đang có & xe sắp về.</h2><p class="section-lead">Gõ gần đúng tên xe, hãng hoặc màu xe để tìm nhanh.</p></div><div class="search-box">⌕<input id="searchInput" placeholder="Tìm tên xe, hãng, màu xe…"></div></div><div class="chips" id="categoryChips"><button class="chip active" data-category="">Tất cả xe</button>${Object.keys(CATEGORY).filter(key => counts[key] > 0).map(key => `<button class="chip" data-category="${key}">${CATEGORY[key]}</button>`).join('')}</div><div class="section-head" style="margin-top:18px"><p class="section-lead" id="productCount">${state.products.length} xe phù hợp</p><div class="slider-controls"><button class="icon-btn" id="slideLeft">←</button><button class="icon-btn" id="slideRight">→</button></div></div><div id="productRow" class="product-row">${state.products.map(card).join('') || '<div class="admin-empty">Kho xe đang được cập nhật.</div>'}</div></div></section>
      <section id="promo" class="section"><div class="container promo-grid"><div class="promo-visual"><img src="${escapeHTML(promo.image_url || '/assets/tam-an-promo.jpg')}" alt="Khuyến mại"></div><div class="promo-copy"><div class="section-kicker" style="color:#ffb7be">Chương trình ưu đãi</div><h2>${escapeHTML(promo.title || 'Ưu đãi đang diễn ra')}</h2><p>${escapeHTML(promo.content || '')}</p><div class="benefits"><div class="benefit"><b>Trả góp rõ ràng</b><span>Hỗ trợ tìm phương án phù hợp.</span></div><div class="benefit"><b>Quà tặng theo xe</b><span>Kiểm tra ưu đãi thực tế cùng nhân viên.</span></div><div class="benefit"><b>Hỗ trợ nhanh</b><span>Gửi số điện thoại để nhận tư vấn.</span></div></div><div style="margin-top:22px"><a class="btn btn-light" href="/tra-gop">Tư vấn trả góp →</a></div></div></div></section>
      ${state.accessories.length ? `<section id="accessories" class="section section-soft"><div class="container"><div class="section-head"><div><div class="section-kicker">Phụ tùng & phụ kiện</div><h2>Chọn thêm cho xe. Đi đường yên tâm hơn.</h2></div></div><div class="accessory-grid">${state.accessories.map(a => `<article class="accessory"><img src="${escapeHTML(a.image_url || '/assets/logo.jpg')}" alt="${escapeHTML(a.name)}"><div class="accessory-body"><h3>${escapeHTML(a.name)}</h3>${a.price ? `<b class="price">${money(a.price)}</b>` : '<b class="price-hidden">Liên hệ</b>'}${a.description ? `<p class="muted">${escapeHTML(a.description)}</p>` : ''}</div></article>`).join('')}</div></div></section>` : ''}
      <section class="section"><div class="container delivery"><div class="delivery-img" style="background-image:url('${escapeHTML(s.showroom_image || '/assets/showroom.jpg')}')"></div><div class="delivery-copy"><div class="section-kicker">Dịch vụ Tâm An</div><h2>${escapeHTML(s.delivery_title || 'Hỗ trợ giao xe tận nơi')}</h2><p>${escapeHTML(s.delivery_text || '')}</p><button class="btn btn-primary lead-button" data-name="Giao xe tận nơi">Đăng ký tư vấn giao xe</button></div></div></section>
      <section id="showroom" class="section section-soft"><div class="container showroom-grid"><div class="showroom-photo"><img src="${escapeHTML(s.showroom_image || '/assets/showroom.jpg')}" alt="Showroom"></div><div class="showroom-info"><div class="section-kicker">Đến showroom</div><h2>Ghé Tâm An, xem xe thật.</h2><div class="info-list"><div class="info-item"><b>Địa chỉ</b><span>${escapeHTML(s.address || '')}</span></div><div class="info-item"><b>Hotline</b><span>${escapeHTML(s.hotline || '')}</span></div><div class="info-item"><b>Giờ làm việc</b><span>${escapeHTML(s.business_hours || '')}</span></div></div><iframe class="map-frame" src="${escapeHTML(s.map_embed_url || '')}" loading="lazy"></iframe></div></div></section>
    </main>${footer()}${floatingButtons()}`;
    bindHomeEvents();
    bindHomeAnchorLinks();
    scrollToCurrentHash('auto');
  }

  function floatingButtons() {
    const s = state.site;
    const callHref = `tel:${String(s.hotline || '').replace(/\s/g, '')}`;
    const social = [
      socialLink('zalo', 'Nhắn Zalo', s.zalo_url, 'float-btn'),
      socialLink('messenger', 'Nhắn Messenger', s.messenger_url, 'float-btn'),
      socialLink('facebook', 'Facebook', s.facebook_url, 'float-btn'),
      socialLink('tiktok', 'TikTok', s.tiktok_url, 'float-btn')
    ].filter(Boolean).join('');
    return `<div class="floating" aria-label="Liên hệ nhanh">
      <a class="float-btn float-call is-pulsing" href="${escapeHTML(callHref)}" aria-label="Gọi ${escapeHTML(s.hotline || '')}" title="Gọi ngay">${socialIcon('phone')}<span class="float-label">Gọi ngay</span></a>
      ${social}
      <button class="float-btn float-top" id="backTop" aria-label="Lên đầu trang" title="Lên đầu trang">${socialIcon('top')}</button>
    </div>
    <button id="chatOpen" class="chat-launch is-pulsing" aria-label="Chat trực tuyến" title="Chat trực tuyến">${socialIcon('chat')}<span class="chat-launch-text">Tư vấn</span></button><div id="chatPanel" class="chat-panel"></div>`;
  }

  function bindHomeEvents() {
    $('#menuBtn')?.addEventListener('click', () => $('#mainNav')?.classList.toggle('mobile-open'));
    $$('#mainNav a').forEach(link => link.addEventListener('click', () => $('#mainNav')?.classList.remove('mobile-open')));
    const renderProducts = () => {
      const query = $('#searchInput').value;
      const selected = $('#categoryChips .chip.active')?.dataset.category || '';
      const items = state.products.filter(p => (!selected || p.category === selected) && fuzzyMatch(p, query));
      $('#productRow').innerHTML = items.map(card).join('') || '<div class="admin-empty">Không tìm thấy xe phù hợp.</div>';
      $('#productCount').textContent = `${items.length} xe phù hợp`;
      bindProductEvents();
    };
    $('#searchInput')?.addEventListener('input', renderProducts);
    $$('#categoryChips .chip').forEach(button => button.addEventListener('click', () => { $$('#categoryChips .chip').forEach(x => x.classList.remove('active')); button.classList.add('active'); renderProducts(); }));
    $$('.filter-category').forEach(link => link.addEventListener('click', () => setTimeout(() => { const chip = $(`#categoryChips .chip[data-category="${link.dataset.category}"]`); chip?.click(); }, 30)));
    $('#slideLeft')?.addEventListener('click', () => $('#productRow').scrollBy({ left:-340, behavior:'smooth' }));
    $('#slideRight')?.addEventListener('click', () => $('#productRow').scrollBy({ left:340, behavior:'smooth' }));
    $('#backTop')?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
    window.addEventListener('scroll', () => $('#backTop')?.classList.toggle('show', window.scrollY > 400), { passive:true });
    $$('.footer-links [data-policy]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); openPolicy(link.dataset.policy); }));
    bindProductEvents();
    initChat();
  }

  function bindProductEvents() {
    $$('.open-product').forEach(button => button.onclick = () => openProduct(button.dataset.slug));
    $$('.lead-button').forEach(button => button.onclick = () => openLeadModal({ id:button.dataset.product || null, name:button.dataset.name || '' }));
    $$('.preview-color').forEach(button => button.onclick = () => { const image = button.closest('.product-card')?.querySelector('.product-media img'); if (image) image.src = button.dataset.image; });
  }

  async function openProduct(slug) {
    try {
      const data = await request(`/api/products/${encodeURIComponent(slug)}`);
      const product = data.product;
      trackEvent('ViewProduct', { content_name: product.name, content_category: product.category, value: product.price || 0, currency: 'VND' });
      const primaryColor = (product.colors || [])[0];
      const initialImages = primaryColor?.images?.length ? primaryColor.images : (product.images || []);
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `<div class="modal-card"><button class="modal-close">×</button><div class="product-modal"><div class="gallery"><div class="gallery-main"><img id="galleryImage" src="${escapeHTML(initialImages[0] || productImage(product))}" alt="${escapeHTML(product.name)}"></div><div id="thumbs" class="thumb-row"></div><div id="colorChoices" class="gallery-colors"></div></div><div class="product-content"><span class="status-badge" style="position:static;display:inline-block">${statusName(product.status)}</span><div class="product-meta" style="margin-top:12px">${escapeHTML(product.brand || 'TÂM AN')} • ${escapeHTML(CATEGORY[product.category] || '')}</div><h2>${escapeHTML(product.name)}</h2><div class="price-line">${product.price ? `<span class="price">${money(product.price)}</span>${product.old_price ? `<span class="old-price">${money(product.old_price)}</span>` : ''}` : '<span class="price-hidden">Liên hệ nhận giá</span>'}</div><p>${escapeHTML(product.description || '')}</p><div class="detail-grid"><div class="detail-item"><small>Năm sản xuất</small><b>${product.year || '—'}</b></div><div class="detail-item"><small>Số km</small><b>${product.mileage === null || product.mileage === undefined ? '—' : `${Number(product.mileage).toLocaleString('vi-VN')} km`}</b></div><div class="detail-item"><small>Động cơ</small><b>${escapeHTML(product.engine || '—')}</b></div><div class="detail-item"><small>Giấy tờ</small><b>${escapeHTML(product.documents || '—')}</b></div></div>${product.installment_from || product.bad_debt_from ? `<div class="finance-box"><b>Hỗ trợ trả góp</b><div>${product.installment_from ? `Trả trước tham khảo từ ${money(product.installment_from)}. ` : ''}${product.bad_debt_from ? `Thông tin hỗ trợ hồ sơ từ ${money(product.bad_debt_from)}.` : ''}</div><small>Thông tin tham khảo, Tâm An kiểm tra hồ sơ trước khi xác nhận.</small></div>` : ''}${product.versions?.length ? `<div class="versions-box"><b>Phiên bản</b>${product.versions.map(v => `<div class="version-item"><strong>${escapeHTML(v.name)}</strong><span>${v.price ? money(v.price) : 'Liên hệ'}${v.old_price ? ` <s>${money(v.old_price)}</s>` : ''}</span>${v.description ? `<small>${escapeHTML(v.description)}</small>` : ''}</div>`).join('')}</div>` : ''}<div class="consult-box"><h3>Để lại thông tin tư vấn</h3><p class="muted">Nhân viên Tâm An sẽ liên hệ theo số điện thoại của bạn.</p><form id="detailLead" class="form-grid"><input type="hidden" name="product_id" value="${product.id}"><div class="field"><label>Họ và tên *</label><input name="name" required></div><div class="field"><label>Số điện thoại *</label><input name="phone" required inputmode="tel"></div>${paymentIntentFields(product.installment_from)}<div class="field full"><label>Ghi chú</label><textarea name="note" placeholder="Muốn xem xe, giữ xe hoặc hỏi trả góp…"></textarea></div><div class="field full"><button class="btn btn-primary">Gửi yêu cầu tư vấn</button></div></form></div></div></div>${data.related?.length ? `<div class="related"><div class="section-kicker">Gợi ý thêm</div><h2 style="font-size:34px">Xe tương tự</h2><div class="product-row">${data.related.map(card).join('')}</div></div>` : ''}</div>`;
      document.body.appendChild(modal); document.body.classList.add('modal-open');
      const close = () => { modal.remove(); document.body.classList.remove('modal-open'); };
      $('.modal-close', modal).onclick = close;
      modal.addEventListener('click', event => { if (event.target === modal) close(); });
      let gallery = initialImages.length ? initialImages : [productImage(product)];
      const draw = () => {
        $('#thumbs', modal).innerHTML = gallery.map((url, index) => `<button class="thumb ${index === 0 ? 'active' : ''}" data-url="${escapeHTML(url)}"><img src="${escapeHTML(url)}" alt=""></button>`).join('');
        $$('#thumbs .thumb', modal).forEach(btn => btn.onclick = () => { $('#galleryImage', modal).src = btn.dataset.url; $$('#thumbs .thumb', modal).forEach(x => x.classList.toggle('active', x === btn)); });
      };
      $('#colorChoices', modal).innerHTML = (product.colors || []).map((color, index) => `<button class="color-choice ${index === 0 ? 'active' : ''}" data-index="${index}"><i style="background:${escapeHTML(color.hex || '#c81924')}"></i>${escapeHTML(color.name)}</button>`).join('');
      $$('#colorChoices .color-choice', modal).forEach(button => button.onclick = () => {
        const selected = product.colors[Number(button.dataset.index)];
        gallery = selected.images?.length ? selected.images : (product.images || [productImage(product)]);
        $('#galleryImage', modal).src = gallery[0];
        $$('#colorChoices .color-choice', modal).forEach(x => x.classList.toggle('active', x === button));
        draw();
      });
      draw();
      $('.gallery-main', modal).onclick = () => openLightbox(gallery, $('#galleryImage', modal).src);
      const detailLeadForm = $('#detailLead', modal);
      bindPaymentIntent(detailLeadForm);
      detailLeadForm.onsubmit = async event => {
        event.preventDefault(); const form = new FormData(event.target);
        try { await request('/api/leads', { method:'POST', body:{ type:'product_consultation', product_id:Number(form.get('product_id')), name:form.get('name'), phone:form.get('phone'), note:form.get('note'), ...paymentLeadPayload(form) } }); trackEvent('Lead', { content_name: product.name, content_category: product.category }); notify('Tâm An đã nhận thông tin và sẽ liên hệ sớm.'); event.target.reset(); $('[name="payment_plan"]', event.target)?.dispatchEvent(new Event('change')); }
        catch (error) { notify(error.message); }
      };
      bindProductEvents();
    } catch (error) { notify(error.message); }
  }

  function openLightbox(images, current) {
    let index = Math.max(0, images.indexOf(current));
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `<button class="lb-close">×</button><button class="lb-prev">‹</button><img src="${escapeHTML(images[index] || current)}" alt=""><button class="lb-next">›</button>`;
    document.body.appendChild(box);
    const paint = () => $('img', box).src = images[index] || current;
    $('.lb-close', box).onclick = () => box.remove();
    $('.lb-prev', box).onclick = () => { index = (index - 1 + images.length) % images.length; paint(); };
    $('.lb-next', box).onclick = () => { index = (index + 1) % images.length; paint(); };
    box.addEventListener('click', event => { if (event.target === box) box.remove(); });
  }

  function openLeadModal(info = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-card" style="width:min(560px,100%)"><button class="modal-close">×</button><div class="policy-modal"><div class="section-kicker">Tư vấn Tâm An</div><h2>Để lại thông tin.</h2><p class="muted">${escapeHTML(info.name || 'Tâm An sẽ gọi lại để tư vấn nhanh nhất.')}</p><form id="quickLead" class="form-grid"><div class="field"><label>Họ và tên *</label><input name="name" required></div><div class="field"><label>Số điện thoại *</label><input name="phone" required inputmode="tel"></div>${paymentIntentFields()}<div class="field full"><label>Nhu cầu</label><textarea name="note"></textarea></div><div class="field full"><button class="btn btn-primary">Gửi yêu cầu</button></div></form></div></div>`;
    document.body.appendChild(modal); document.body.classList.add('modal-open');
    const close = () => { modal.remove(); document.body.classList.remove('modal-open'); };
    $('.modal-close', modal).onclick = close;
    const quickLeadForm = $('#quickLead', modal);
    bindPaymentIntent(quickLeadForm);
    quickLeadForm.onsubmit = async event => {
      event.preventDefault(); const form = new FormData(event.target);
      try { await request('/api/leads', { method:'POST', body:{ type:info.name || 'consultation', product_id:Number(info.id) || null, name:form.get('name'), phone:form.get('phone'), note:form.get('note'), ...paymentLeadPayload(form) } }); trackEvent('Lead', { content_name: info.name || 'consultation' }); notify('Đã gửi yêu cầu thành công.'); close(); }
      catch (error) { notify(error.message); }
    };
  }

  async function openPolicy(slug) {
    try {
      const data = await request(`/api/policies/${encodeURIComponent(slug)}`);
      const modal = document.createElement('div'); modal.className = 'modal';
      modal.innerHTML = `<div class="modal-card" style="width:min(760px,100%)"><button class="modal-close">×</button><article class="policy-modal"><div class="section-kicker">Chính sách Tâm An</div><h2>${escapeHTML(data.policy.title)}</h2><div class="policy-content">${escapeHTML(data.policy.content)}</div></article></div>`;
      document.body.appendChild(modal); document.body.classList.add('modal-open');
      $('.modal-close', modal).onclick = () => { modal.remove(); document.body.classList.remove('modal-open'); };
    } catch (error) { notify(error.message); }
  }

  function renderFinance() {
    const s = state.site;
    const steps = pipeRows(s.installment_steps || 'Đăng ký tư vấn|Liên hệ hotline hoặc để lại thông tin trực tuyến.\nNộp hồ sơ|Nhân viên hướng dẫn giấy tờ theo từng trường hợp.\nThẩm định|Đơn vị tài chính kiểm tra hồ sơ theo quy trình.\nNhận xe|Hoàn tất thủ tục và bàn giao xe theo thoả thuận.');
    const faqs = pipeRows(s.installment_faqs || 'Khi mua xe trả góp cần mang theo giấy tờ gì?|Tâm An sẽ hướng dẫn theo hồ sơ thực tế.');
    app.className = '';
    app.innerHTML = `${nav('finance')}<main><section class="finance-hero" style="background-image:url('${escapeHTML(s.installment_image || s.hero_image || '/assets/tam-an-promo.jpg')}');background-size:cover;background-position:center"><div class="container"><div class="eyebrow">Tư vấn trả góp</div><h1>${multiline(s.installment_title || 'Mua xe rõ ràng.\nChọn phương án phù hợp.')}</h1><p>${escapeHTML(s.installment_text || '')}</p></div></section><section class="section"><div class="container finance-layout"><div><div class="section-kicker">Thủ tục mua trả góp</div><h2>Đơn giản, rõ ràng từng bước.</h2><div class="procedure" style="margin-top:22px">${steps.map((step,index) => `<div class="procedure-card"><div class="procedure-icon">${['①','②','③','④','⑤','⑥'][index] || '•'}</div><b>${escapeHTML(step[0])}</b><p>${escapeHTML(step[1] || '')}</p></div>`).join('')}</div><div class="admin-card"><h2>Giấy tờ thường cần</h2><div class="policy-content">${multiline(s.installment_docs || '')}</div></div><div class="admin-card"><h2>Câu hỏi thường gặp</h2><div id="faq" class="faq">${faqs.map(row => `<div class="faq-item"><button class="faq-q">${escapeHTML(row[0])}<span>⌄</span></button><div class="faq-a">${escapeHTML(row[1] || '')}</div></div>`).join('')}</div></div></div><aside class="finance-form"><div class="section-kicker">Đăng ký tư vấn trả góp</div><h2>Nhận tư vấn hồ sơ.</h2><p class="muted">Không cam kết duyệt khi chưa kiểm tra hồ sơ.</p><form id="financeLead" class="form-grid"><div class="field full"><label>Họ và tên *</label><input name="name" required></div><div class="field full"><label>Số điện thoại *</label><input name="phone" required inputmode="tel"></div>${paymentIntentFields()}<div class="field full"><label>Nhu cầu</label><textarea name="note" placeholder="Ví dụ: đang quan tâm Vision, Air Blade…"></textarea></div><div class="field full"><label class="consent-control"><input class="consent-input" type="checkbox" required><span class="consent-box" aria-hidden="true">✓</span><span><b>Tôi đồng ý để Tâm An liên hệ tư vấn.</b><small>Thông tin chỉ dùng để phản hồi yêu cầu của bạn theo Chính sách bảo mật.</small></span></label></div><div class="field full"><button class="btn btn-primary">Gửi thông tin</button></div></form></aside></div></section></main>${footer()}${floatingButtons()}`;
    $('#menuBtn')?.addEventListener('click', () => $('#mainNav').classList.toggle('mobile-open'));
    $$('.faq-q').forEach(button => button.onclick = () => button.closest('.faq-item').classList.toggle('open'));
    const financeLeadForm = $('#financeLead');
    bindPaymentIntent(financeLeadForm);
    financeLeadForm.onsubmit = async event => { event.preventDefault(); const form = new FormData(event.target); try { await request('/api/leads', { method:'POST', body:{ type:'installment', name:form.get('name'), phone:form.get('phone'), note:form.get('note'), ...paymentLeadPayload(form) } }); trackEvent('Lead', { content_name: 'installment' }); notify('Đã gửi yêu cầu. Tâm An sẽ liên hệ sớm.'); event.target.reset(); $('[name="payment_plan"]', event.target)?.dispatchEvent(new Event('change')); } catch (error) { notify(error.message); } };
    $('#backTop')?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
    window.addEventListener('scroll', () => $('#backTop')?.classList.toggle('show', window.scrollY > 400), { passive:true });
    $$('.footer-links [data-policy]').forEach(link => link.onclick = event => { event.preventDefault(); openPolicy(link.dataset.policy); });
    initChat();
  }

  function visitorKey() {
    let key = localStorage.getItem('ta_visitor_key');
    if (!key) { key = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; localStorage.setItem('ta_visitor_key', key); }
    return key;
  }
  function initChat() {
    const panel = $('#chatPanel'); if (!panel) return;
    state.visitorKey = visitorKey();
    const hasName = localStorage.getItem('ta_visitor_name');
    panel.innerHTML = `<div class="chat-head"><div><b>${escapeHTML(state.site.ai_name || 'Tâm An hỗ trợ')}</b><span>Chat trực tiếp với showroom</span></div><button id="chatClose" class="small-btn">×</button></div><div id="chatBody" class="chat-body"></div><form id="chatForm" class="chat-form"><input name="message" placeholder="Nhập tin nhắn…"><button>Gửi</button></form><div id="chatNameBox" class="chat-name ${hasName ? 'hidden' : ''}"><h3>Chào bạn 👋</h3><p class="muted">Nhập tên để nhân viên biết cách xưng hô.</p><input id="visitorName" placeholder="Tên của bạn"><button id="chatStart" class="btn btn-primary">Bắt đầu trò chuyện</button></div>`;
    const ensureConversation = async () => {
      const savedName = localStorage.getItem('ta_visitor_name');
      if (!savedName) return;
      try { await request('/api/chat/start', { method:'POST', body:{ visitor_key:state.visitorKey, visitor_name:savedName } }); } catch {}
    };
    $('#chatOpen')?.addEventListener('click', async () => { panel.classList.add('show'); await ensureConversation(); refreshChat(); });
    $('#chatClose')?.addEventListener('click', () => panel.classList.remove('show'));
    $('#chatStart')?.addEventListener('click', async () => {
      const name = $('#visitorName').value.trim(); if (!name) return notify('Nhập tên của bạn trước nhé.');
      try { await request('/api/chat/start', { method:'POST', body:{ visitor_key:state.visitorKey, visitor_name:name } }); localStorage.setItem('ta_visitor_name', name); $('#chatNameBox').classList.add('hidden'); refreshChat(); }
      catch (error) { notify(error.message); }
    });
    $('#chatForm')?.addEventListener('submit', async event => {
      event.preventDefault(); const input = $('input', event.target); const body = input.value.trim(); if (!body) return;
      try { await request('/api/chat/messages', { method:'POST', body:{ visitor_key:state.visitorKey, body } }); input.value = ''; refreshChat(); }
      catch (error) { notify(error.message); }
    });
    clearInterval(state.chatTimer);
    state.chatTimer = setInterval(() => { if (panel.classList.contains('show')) refreshChat(true); }, 8000);
  }
  async function refreshChat(silent = false) {
    const box = $('#chatBody'); if (!box) return;
    try { const data = await request(`/api/chat/messages?visitor_key=${encodeURIComponent(state.visitorKey)}`); box.innerHTML = (data.messages || []).map(m => `<div class="chat-msg ${escapeHTML(m.sender_type)}"><small>${escapeHTML(m.sender_type === 'visitor' ? 'Bạn' : (m.sender_name || 'Tâm An'))}</small>${escapeHTML(m.body)}</div>`).join('') || `<div class="muted">${escapeHTML(state.site.ai_greeting || 'Tâm An xin chào! Bạn cần tư vấn xe nào ạ?')}</div>`; box.scrollTop = box.scrollHeight; }
    catch (error) { if (!silent) notify(error.message); }
  }

  // ----- ADMIN -----
  async function renderAdmin() {
    try { const data = await request('/api/admin/me'); state.admin = data.user; renderAdminShell(); }
    catch { renderLogin(); }
  }
  function renderLogin() {
    app.className = 'admin-wrap';
    app.innerHTML = `<main class="admin-login"><form id="loginForm" class="login-card"><img src="${escapeHTML(state.site.logo_url || '/assets/logo.jpg')}" alt=""><div class="section-kicker">Khu vực nội bộ</div><h1>Đăng nhập quản trị.</h1><p class="muted">Nhân viên có quyền thêm/sửa xe, xử lý form và chat. Không có quyền xoá.</p><div class="field"><label>Tên đăng nhập</label><input name="username" value="admin" required></div><div class="field"><label>Mật khẩu</label><input type="password" name="password" required></div><button class="btn btn-primary" style="width:100%;margin-top:16px">Đăng nhập</button><a class="muted" href="/" style="display:block;text-align:center;margin-top:12px">← Về website</a></form></main>`;
    $('#loginForm').onsubmit = async event => { event.preventDefault(); const form = new FormData(event.target); try { const data = await request('/api/admin/login', { method:'POST', body:{ username:form.get('username'), password:form.get('password') } }); state.admin = data.user; renderAdminShell(); } catch (error) { notify(error.message); } };
  }
  function adminTabs() {
    const tabs = [['overview','Tổng quan'],['products','Kho xe'],['leads','Form khách'],['chats','Chat trực tuyến'],['accessories','Phụ kiện']];
    if (state.admin.role === 'admin') tabs.push(['promotions','Khuyến mại'],['site','Nội dung website'],['policies','Chính sách'],['users','Nhân viên'],['analytics','Lượt truy cập'],['logs','Nhật ký hệ thống']);
    return tabs;
  }
  function renderAdminShell() {
    app.className = 'admin-wrap';
    app.innerHTML = `<header class="admin-header"><div class="container admin-header-inner"><a href="/" class="admin-brand"><img src="${escapeHTML(state.site.logo_url || '/assets/logo.jpg')}" alt=""><span>TÂM AN<small style="display:block;color:#8e8284;font-size:10px">KHU VỰC NỘI BỘ</small></span></a><div class="admin-user"><span>${escapeHTML(state.admin.name)} • ${state.admin.role === 'admin' ? 'Chủ cửa hàng' : 'Nhân viên'}</span><button id="logoutButton" class="small-btn">Đăng xuất</button></div></div></header><div class="admin-shell"><aside class="admin-side">${adminTabs().map(([id, label], index) => `<button data-tab="${id}" class="${index === 0 ? 'active' : ''}">${label}</button>`).join('')}</aside><main id="adminMain" class="admin-main"></main></div>`;
    $$('[data-tab]').forEach(button => button.onclick = () => { $$('[data-tab]').forEach(x => x.classList.remove('active')); button.classList.add('active'); loadAdminTab(button.dataset.tab); });
    $('#logoutButton').onclick = async () => { await request('/api/admin/logout', { method:'POST' }); state.admin = null; renderLogin(); };
    loadAdminTab('overview');
  }
  async function loadAdminTab(tab) {
    const main = $('#adminMain'); main.innerHTML = '<div class="admin-empty">Đang tải…</div>';
    try {
      if (tab === 'overview') return adminOverview(main);
      if (tab === 'products') return adminProducts(main);
      if (tab === 'promotions') return adminPromotions(main);
      if (tab === 'accessories') return adminAccessories(main);
      if (tab === 'site') return adminSite(main);
      if (tab === 'policies') return adminPolicies(main);
      if (tab === 'leads') return adminLeads(main);
      if (tab === 'chats') return adminChats(main);
      if (tab === 'users') return adminUsers(main);
      if (tab === 'analytics') return adminAnalytics(main);
      if (tab === 'logs') return adminLogs(main);
    } catch (error) {
      main.innerHTML = `<div class="admin-card"><h2>Lỗi tải dữ liệu</h2><p>${escapeHTML(error.message)}</p><button class="btn btn-primary" onclick="location.reload()">Tải lại</button></div>`;
    }
  }
  async function adminOverview(main) {
    const data = await request('/api/admin/overview');
    main.innerHTML = `<h1 class="admin-title">Quản lý Tâm An</h1><p class="admin-sub">${state.admin.role === 'admin' ? 'Quản lý toàn bộ website, dữ liệu và nhân viên.' : 'Bạn có thể thêm/sửa xe, xử lý form và trả lời khách.'}</p><div class="admin-grid"><div class="metric"><b>${data.counts.products}</b><span>Sản phẩm</span></div><div class="metric"><b>${data.counts.leads}</b><span>Form chưa xong</span></div><div class="metric"><b>${data.counts.chats}</b><span>Chat đang mở</span></div><div class="metric"><b>${data.counts.accessories}</b><span>Phụ kiện</span></div></div><div class="admin-card"><h2>Phân quyền</h2><p class="muted">Nhân viên không thể xoá dữ liệu, sửa nội dung website hay xem nhật ký hệ thống. Admin có toàn quyền.</p></div>`;
  }

  async function adminProducts(main) {
    const data = await request('/api/admin/products');
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Kho xe</h1><p class="admin-sub">4 nhóm: xe máy mới, xe máy cũ, xe điện mới, xe điện cũ.</p></div><button id="addProduct" class="btn btn-primary">+ Thêm xe</button></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ảnh</th><th>Tên xe</th><th>Nhóm</th><th>Trạng thái</th><th>Giá</th><th></th></tr></thead><tbody>${data.products.map(p => `<tr><td><img src="${escapeHTML(productImage(p))}"></td><td><b>${escapeHTML(p.name)}</b><br><span class="muted">${escapeHTML(p.brand || '')}</span></td><td>${escapeHTML(CATEGORY[p.category] || '')}</td><td>${statusName(p.status)}</td><td>${p.price ? money(p.price) : 'Liên hệ'}</td><td><button class="small-btn edit-product" data-id="${p.id}">Sửa</button>${state.admin.role === 'admin' ? `<button class="small-btn danger delete-product" data-id="${p.id}">Xoá</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="admin-empty">Chưa có sản phẩm.</td></tr>'}</tbody></table></div></div>`;
    $('#addProduct').onclick = () => openProductEditor();
    $$('.edit-product').forEach(button => button.onclick = () => openProductEditor(data.products.find(p => p.id === Number(button.dataset.id))));
    $$('.delete-product').forEach(button => button.onclick = async () => { if (!confirm('Xoá sản phẩm này?')) return; try { await request(`/api/admin/products/${button.dataset.id}`, { method:'DELETE' }); notify('Đã xoá sản phẩm'); adminProducts(main); } catch (error) { notify(error.message); } });
  }

  function adminModal(title, content) {
    const modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = `<div class="modal-card" style="width:min(1040px,100%)"><button class="modal-close">×</button><div class="policy-modal"><div class="section-kicker">Quản trị</div><h2>${escapeHTML(title)}</h2>${content}</div></div>`;
    document.body.appendChild(modal); document.body.classList.add('modal-open');
    $('.modal-close', modal).onclick = () => { modal.remove(); document.body.classList.remove('modal-open'); };
    return modal;
  }
  async function uploadFile(file) {
    if (!file) throw new Error('Chưa chọn ảnh.');
    const form = new FormData(); form.append('file', file);
    const data = await request('/api/admin/upload', { method:'POST', body:form });
    return data.url;
  }

  function openProductEditor(product) {
    const p = product || { category:'motor_new', status:'in_stock', published:true, images:[], colors:[], versions:[] };
    const modal = adminModal(product ? 'Sửa sản phẩm' : 'Thêm sản phẩm', `<form id="productForm" class="admin-product-form"><fieldset class="fieldset"><legend>Thông tin xe</legend><div class="form-three"><div class="field"><label>Tên xe *</label><input name="name" required value="${escapeHTML(p.name || '')}"></div><div class="field"><label>Hãng</label><input name="brand" value="${escapeHTML(p.brand || 'Honda')}"></div><div class="field"><label>Nhóm xe</label><select name="category">${Object.entries(CATEGORY).map(([key, label]) => `<option value="${key}" ${p.category === key ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label>Trạng thái</label><select name="status">${['in_stock','incoming','reserved','sold'].map(key => `<option value="${key}" ${p.status === key ? 'selected' : ''}>${statusName(key)}</option>`).join('')}</select></div><div class="field"><label>Giá bán</label><input name="price" type="number" value="${p.price ?? ''}"></div><div class="field"><label>Giá cũ</label><input name="old_price" type="number" value="${p.old_price ?? ''}"></div><div class="field"><label>Năm sản xuất</label><input name="year" type="number" value="${p.year ?? ''}"></div><div class="field"><label>Số km</label><input name="mileage" type="number" value="${p.mileage ?? ''}"></div><div class="field"><label>Động cơ</label><input name="engine" value="${escapeHTML(p.engine || '')}"></div><div class="field"><label>Trả trước từ</label><input name="installment_from" type="number" value="${p.installment_from ?? ''}"></div><div class="field"><label>Hỗ trợ hồ sơ từ</label><input name="bad_debt_from" type="number" value="${p.bad_debt_from ?? ''}"></div><div class="field"><label>Giấy tờ</label><input name="documents" value="${escapeHTML(p.documents || '')}"></div></div><div class="field"><label>Mô tả</label><textarea name="description">${escapeHTML(p.description || '')}</textarea></div><div class="check-row"><label><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Xe nổi bật</label><label><input type="checkbox" name="published" ${p.published !== 0 ? 'checked' : ''}> Hiển thị ngoài website</label></div></fieldset><fieldset class="fieldset"><legend>Ảnh chung</legend><input id="productImagesInput" type="file" accept="image/*" multiple><div id="productImages" class="thumb-row"></div></fieldset><fieldset class="fieldset"><legend>Màu xe & album ảnh</legend><p class="muted">Mỗi màu có nhiều ảnh. Khách bấm màu sẽ đổi đúng album.</p><div id="colorRows"></div><button id="addColorRow" type="button" class="small-btn">+ Thêm màu</button></fieldset><fieldset class="fieldset"><legend>Phiên bản xe</legend><textarea id="versionText" placeholder="Tiêu chuẩn | 35000000 | 38000000 | Mô tả (mỗi dòng 1 phiên bản)"></textarea></fieldset><button class="btn btn-primary">${product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button></form>`);
    const form = $('#productForm', modal);
    let images = [...(p.images || [])];
    let colors = (p.colors || []).map(c => ({ name:c.name || '', hex:c.hex || '#c81924', images:[...(c.images || [])] }));
    function renderImages() {
      $('#productImages', modal).innerHTML = images.map((url, index) => `<button type="button" class="thumb remove-image" data-index="${index}"><img src="${escapeHTML(url)}" alt=""><span>×</span></button>`).join('');
      $$('.remove-image', modal).forEach(button => button.onclick = () => { images.splice(Number(button.dataset.index), 1); renderImages(); });
    }
    async function uploadMany(files) {
      const out = []; for (const file of Array.from(files)) out.push(await uploadFile(file)); return out;
    }
    function renderColors() {
      $('#colorRows', modal).innerHTML = colors.map((color, index) => `<div class="variant-box"><div class="variant-head"><b>Màu ${index + 1}</b><button type="button" class="small-btn danger remove-color" data-index="${index}">Xoá màu</button></div><div class="form-three"><div class="field"><label>Tên màu</label><input class="color-name" data-index="${index}" value="${escapeHTML(color.name)}"></div><div class="field"><label>Màu hiển thị</label><input class="color-hex" data-index="${index}" type="color" value="${escapeHTML(color.hex)}"></div><div class="field"><label>Chọn nhiều ảnh</label><input class="color-upload" data-index="${index}" type="file" accept="image/*" multiple></div></div><div class="thumb-row">${color.images.map((url, imageIndex) => `<button type="button" class="thumb remove-color-image" data-index="${index}" data-image-index="${imageIndex}"><img src="${escapeHTML(url)}" alt=""><span>×</span></button>`).join('')}</div></div>`).join('');
      $$('.remove-color', modal).forEach(button => button.onclick = () => { colors.splice(Number(button.dataset.index), 1); renderColors(); });
      $$('.color-name', modal).forEach(input => input.oninput = () => { colors[Number(input.dataset.index)].name = input.value; });
      $$('.color-hex', modal).forEach(input => input.oninput = () => { colors[Number(input.dataset.index)].hex = input.value; });
      $$('.color-upload', modal).forEach(input => input.onchange = async () => { try { colors[Number(input.dataset.index)].images.push(...await uploadMany(input.files)); renderColors(); notify('Đã tải ảnh màu xe'); } catch (error) { notify(error.message); } });
      $$('.remove-color-image', modal).forEach(button => button.onclick = () => { colors[Number(button.dataset.index)].images.splice(Number(button.dataset.imageIndex), 1); renderColors(); });
    }
    $('#productImagesInput', modal).onchange = async event => { try { images.push(...await uploadMany(event.target.files)); renderImages(); } catch (error) { notify(error.message); } };
    $('#addColorRow', modal).onclick = () => { colors.push({ name:'', hex:'#c81924', images:[] }); renderColors(); };
    $('#versionText', modal).value = (p.versions || []).map(v => [v.name, v.price || '', v.old_price || '', v.description || ''].join(' | ')).join('\n');
    renderImages(); renderColors();
    form.onsubmit = async event => {
      event.preventDefault(); const fd = new FormData(form); const body = Object.fromEntries(fd.entries());
      body.images = images; body.colors = colors.filter(c => c.name); body.featured = fd.get('featured') === 'on'; body.published = fd.get('published') === 'on';
      body.versions = String($('#versionText', modal).value || '').split('\n').map(line => line.split('|').map(x => x.trim())).filter(x => x[0]).map(x => ({ name:x[0], price:x[1] || null, old_price:x[2] || null, description:x[3] || '' }));
      try { await request(product ? `/api/admin/products/${product.id}` : '/api/admin/products', { method:product ? 'PUT' : 'POST', body }); notify('Đã lưu sản phẩm'); modal.remove(); document.body.classList.remove('modal-open'); loadAdminTab('products'); }
      catch (error) { notify(error.message); }
    };
  }

  async function adminPromotions(main) {
    const data = await request('/api/admin/promotions');
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Khuyến mại</h1><p class="admin-sub">Đăng ảnh, tiêu đề, nội dung và bật/tắt chương trình.</p></div><button class="btn btn-primary" id="addPromotion">+ Thêm khuyến mại</button></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ảnh</th><th>Tiêu đề</th><th>Hiển thị</th><th></th></tr></thead><tbody>${data.promotions.map(p => `<tr><td><img src="${escapeHTML(p.image_url || '/assets/tam-an-promo.jpg')}"></td><td><b>${escapeHTML(p.title)}</b><br><span class="muted">${escapeHTML(p.content || '')}</span></td><td>${p.active ? 'Bật' : 'Tắt'}</td><td><button class="small-btn edit-promo" data-id="${p.id}">Sửa</button><button class="small-btn danger delete-promo" data-id="${p.id}">Xoá</button></td></tr>`).join('') || '<tr><td colspan="4" class="admin-empty">Chưa có khuyến mại.</td></tr>'}</tbody></table></div></div>`;
    $('#addPromotion').onclick = () => openPromotionEditor();
    $$('.edit-promo').forEach(button => button.onclick = () => openPromotionEditor(data.promotions.find(x => x.id === Number(button.dataset.id))));
    $$('.delete-promo').forEach(button => button.onclick = async () => { if (!confirm('Xoá chương trình?')) return; try { await request(`/api/admin/promotions/${button.dataset.id}`, { method:'DELETE' }); adminPromotions(main); } catch (error) { notify(error.message); } });
  }
  function openPromotionEditor(promotion) {
    const p = promotion || { active:true };
    const modal = adminModal(promotion ? 'Sửa khuyến mại' : 'Thêm khuyến mại', `<form id="promoForm" class="admin-product-form"><div class="field"><label>Tiêu đề *</label><input name="title" required value="${escapeHTML(p.title || '')}"></div><div class="field"><label>Ảnh khuyến mại</label><input id="promoImageFile" type="file" accept="image/*"><input name="image_url" value="${escapeHTML(p.image_url || '')}" placeholder="Link ảnh"></div><div class="field"><label>Nội dung ưu đãi</label><textarea name="content">${escapeHTML(p.content || '')}</textarea></div><label><input name="active" type="checkbox" ${p.active ? 'checked' : ''}> Hiển thị chương trình</label><button class="btn btn-primary">Lưu</button></form>`);
    const form = $('#promoForm', modal);
    $('#promoImageFile', modal).onchange = async event => { try { form.image_url.value = await uploadFile(event.target.files[0]); } catch (error) { notify(error.message); } };
    form.onsubmit = async event => { event.preventDefault(); const fd = new FormData(form); const body = Object.fromEntries(fd.entries()); body.active = fd.get('active') === 'on'; try { await request(promotion ? `/api/admin/promotions/${p.id}` : '/api/admin/promotions', { method:promotion ? 'PUT' : 'POST', body }); notify('Đã lưu khuyến mại'); modal.remove(); document.body.classList.remove('modal-open'); loadAdminTab('promotions'); } catch (error) { notify(error.message); } };
  }

  async function adminAccessories(main) {
    const data = await request('/api/admin/accessories');
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Phụ kiện</h1><p class="admin-sub">Giá có thể để trống để hiển thị “Liên hệ”.</p></div><button class="btn btn-primary" id="addAccessory">+ Thêm phụ kiện</button></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ảnh</th><th>Tên</th><th>Giá</th><th></th></tr></thead><tbody>${data.accessories.map(a => `<tr><td><img src="${escapeHTML(a.image_url || '/assets/logo.jpg')}"></td><td><b>${escapeHTML(a.name)}</b><br><span class="muted">${escapeHTML(a.description || '')}</span></td><td>${a.price ? money(a.price) : 'Liên hệ'}</td><td><button class="small-btn edit-accessory" data-id="${a.id}">Sửa</button>${state.admin.role === 'admin' ? `<button class="small-btn danger delete-accessory" data-id="${a.id}">Xoá</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="4" class="admin-empty">Chưa có phụ kiện.</td></tr>'}</tbody></table></div></div>`;
    $('#addAccessory').onclick = () => openAccessoryEditor();
    $$('.edit-accessory').forEach(button => button.onclick = () => openAccessoryEditor(data.accessories.find(a => a.id === Number(button.dataset.id))));
    $$('.delete-accessory').forEach(button => button.onclick = async () => { if (!confirm('Xoá phụ kiện?')) return; try { await request(`/api/admin/accessories/${button.dataset.id}`, { method:'DELETE' }); adminAccessories(main); } catch (error) { notify(error.message); } });
  }
  function openAccessoryEditor(accessory) {
    const a = accessory || { published:true };
    const modal = adminModal(accessory ? 'Sửa phụ kiện' : 'Thêm phụ kiện', `<form id="accessoryForm" class="admin-product-form"><div class="field"><label>Tên *</label><input name="name" required value="${escapeHTML(a.name || '')}"></div><div class="field"><label>Giá</label><input name="price" type="number" value="${a.price ?? ''}"></div><div class="field"><label>Ảnh</label><input id="accessoryImageFile" type="file" accept="image/*"><input name="image_url" value="${escapeHTML(a.image_url || '')}"></div><div class="field"><label>Mô tả</label><textarea name="description">${escapeHTML(a.description || '')}</textarea></div><label><input name="published" type="checkbox" ${a.published !== 0 ? 'checked' : ''}> Hiển thị ngoài website</label><button class="btn btn-primary">Lưu</button></form>`);
    const form = $('#accessoryForm', modal);
    $('#accessoryImageFile', modal).onchange = async event => { try { form.image_url.value = await uploadFile(event.target.files[0]); } catch (error) { notify(error.message); } };
    form.onsubmit = async event => { event.preventDefault(); const fd = new FormData(form); const body = Object.fromEntries(fd.entries()); body.published = fd.get('published') === 'on'; try { await request(accessory ? `/api/admin/accessories/${a.id}` : '/api/admin/accessories', { method:accessory ? 'PUT' : 'POST', body }); notify('Đã lưu phụ kiện'); modal.remove(); document.body.classList.remove('modal-open'); loadAdminTab('accessories'); } catch (error) { notify(error.message); } };
  }

  function imageField(label, name, value) {
    return `<div class="field"><label>${label}</label><input class="site-image-file" data-field="${name}" type="file" accept="image/*"><input name="${name}" value="${escapeHTML(value || '')}" placeholder="Link ảnh"></div>`;
  }
  async function adminSite(main) {
    const data = await request('/api/admin/site'); const s = data.site;
    main.innerHTML = `<h1 class="admin-title">Nội dung website</h1><p class="admin-sub">Chỉnh logo, ảnh, chữ, hơn 50 font, màu sắc, kích cỡ, mạng xã hội, pixel và chatbot ngay từ Admin.</p>
    <form id="siteForm" class="admin-product-form">
      <fieldset class="fieldset"><legend>Thương hiệu & Theme Studio</legend>
        <div class="form-three">
          <div class="field"><label>Tên thương hiệu</label><input name="brand_name" value="${escapeHTML(s.brand_name || '')}"></div>
          <div class="field"><label>Tiêu đề tab trình duyệt</label><input name="page_title" value="${escapeHTML(s.page_title || '')}"></div>
          <div class="field"><label>Màu chủ đạo</label><input name="primary_color" type="color" value="${escapeHTML(s.primary_color || '#c81924')}"></div>
          <div class="field"><label>Màu nhấn</label><input name="accent_color" type="color" value="${escapeHTML(s.accent_color || '#ff6b76')}"></div>
          <div class="field"><label>Màu nền</label><input name="background_color" type="color" value="${escapeHTML(s.background_color || '#ffffff')}"></div>
          <div class="field"><label>Màu chữ</label><input name="text_color" type="color" value="${escapeHTML(s.text_color || '#1b1214')}"></div>
          <div class="field"><label>Font nội dung (65 lựa chọn)</label><select name="body_font">${fontOptions(s.body_font || 'Be Vietnam Pro')}</select></div>
          <div class="field"><label>Font tiêu đề (65 lựa chọn)</label><select name="heading_font">${fontOptions(s.heading_font || 'Barlow Condensed')}</select></div>
          <div class="field"><label>Cỡ chữ nội dung: <output id="bodySizeOut">${escapeHTML(s.body_font_size || 16)}px</output></label><input name="body_font_size" id="bodySize" type="range" min="14" max="20" step="1" value="${escapeHTML(s.body_font_size || 16)}"></div>
          <div class="field"><label>Tỷ lệ tiêu đề: <output id="headingScaleOut">${escapeHTML(s.heading_scale || 1)}x</output></label><input name="heading_scale" id="headingScale" type="range" min="0.85" max="1.35" step="0.05" value="${escapeHTML(s.heading_scale || 1)}"></div>
          <div class="field"><label>Giãn dòng: <output id="lineHeightOut">${escapeHTML(s.body_line_height || 1.55)}</output></label><input name="body_line_height" id="lineHeight" type="range" min="1.35" max="2" step="0.05" value="${escapeHTML(s.body_line_height || 1.55)}"></div>
          <div class="field"><label>Bo góc: <output id="radiusOut">${escapeHTML(s.corner_radius || 22)}px</output></label><input name="corner_radius" id="cornerRadius" type="range" min="8" max="32" step="1" value="${escapeHTML(s.corner_radius || 22)}"></div>
          <div class="field"><label>Logo</label><input id="logoFile" type="file" accept="image/*"><input name="logo_url" value="${escapeHTML(s.logo_url || '')}"></div>
          <div class="field"><label>Favicon / icon tab</label><input id="faviconFile" type="file" accept="image/*"><input name="favicon_url" value="${escapeHTML(s.favicon_url || '')}"></div>
        </div>
        <div class="theme-preview"><span class="theme-preview-kicker">XEM TRƯỚC THEME</span><h3 id="themePreviewTitle">Chọn xe ưng ý. Lên đường an tâm.</h3><p id="themePreviewText">Font, màu sắc, cỡ chữ và bo góc sẽ áp dụng toàn website sau khi bấm Lưu.</p><button type="button" class="btn btn-primary">Nút hành động</button></div>
      </fieldset>
      <fieldset class="fieldset"><legend>Trang chủ & ảnh</legend>
        <div class="field"><label>Tiêu đề Hero</label><textarea name="hero_title">${escapeHTML(s.hero_title || '')}</textarea></div>
        <div class="field"><label>Mô tả Hero</label><textarea name="hero_subtitle">${escapeHTML(s.hero_subtitle || '')}</textarea></div>
        ${imageField('Ảnh Hero (riêng)', 'hero_image', s.hero_image)}${imageField('Ảnh Showroom (riêng)', 'showroom_image', s.showroom_image)}${imageField('Ảnh trang trả góp', 'installment_image', s.installment_image)}${imageField('Ảnh khuyến mại mặc định', 'promo_image', s.promo_image)}
        <div class="form-two"><div class="field"><label>Tiêu đề giao xe</label><input name="delivery_title" value="${escapeHTML(s.delivery_title || '')}"></div><div class="field"><label>Nội dung giao xe</label><textarea name="delivery_text">${escapeHTML(s.delivery_text || '')}</textarea></div></div>
      </fieldset>
      <fieldset class="fieldset"><legend>Liên hệ, Map & mạng xã hội</legend>
        <div class="form-three">
          <div class="field"><label>Hotline</label><input name="hotline" value="${escapeHTML(s.hotline || '')}"></div><div class="field"><label>Email</label><input name="support_email" value="${escapeHTML(s.support_email || '')}"></div><div class="field"><label>Địa chỉ</label><input name="address" value="${escapeHTML(s.address || '')}"></div>
          <div class="field"><label>Zalo URL</label><input name="zalo_url" placeholder="https://zalo.me/..." value="${escapeHTML(s.zalo_url || '')}"></div><div class="field"><label>Messenger URL</label><input name="messenger_url" placeholder="https://m.me/..." value="${escapeHTML(s.messenger_url || '')}"></div><div class="field"><label>Facebook URL</label><input name="facebook_url" placeholder="https://facebook.com/..." value="${escapeHTML(s.facebook_url || '')}"></div><div class="field"><label>TikTok URL</label><input name="tiktok_url" placeholder="https://tiktok.com/@..." value="${escapeHTML(s.tiktok_url || '')}"></div><div class="field"><label>YouTube URL</label><input name="youtube_url" placeholder="https://youtube.com/..." value="${escapeHTML(s.youtube_url || '')}"></div><div class="field"><label>Google Map embed URL</label><input name="map_embed_url" value="${escapeHTML(s.map_embed_url || '')}"></div>
        </div><p class="muted">Biểu tượng Facebook, TikTok, YouTube, Zalo, Messenger tự hiện ở chân trang và thanh liên hệ ngay khi có link hợp lệ.</p><div class="field"><label>Giờ làm việc</label><textarea name="business_hours">${escapeHTML(s.business_hours || '')}</textarea></div>
      </fieldset>
      <fieldset class="fieldset"><legend>Trả góp, Pixel & AI</legend>
        <div class="field"><label>Tiêu đề trả góp</label><textarea name="installment_title">${escapeHTML(s.installment_title || '')}</textarea></div><div class="field"><label>Nội dung trả góp</label><textarea name="installment_text">${escapeHTML(s.installment_text || '')}</textarea></div><div class="field"><label>Giấy tờ / thủ tục</label><textarea name="installment_docs">${escapeHTML(s.installment_docs || '')}</textarea></div><div class="field"><label>Mức trả trước gợi ý (mỗi dòng một lựa chọn)</label><textarea name="installment_down_payments" placeholder="Từ 3 triệu&#10;Từ 5 triệu&#10;Từ 7 triệu&#10;Theo tư vấn">${escapeHTML(s.installment_down_payments || 'Từ 3 triệu\nTừ 5 triệu\nTừ 7 triệu\nTừ 10 triệu\nTheo tư vấn')}</textarea><small class="field-help">Chỉ hiện khi khách chọn Trả góp. Với từng xe, mức “Trả trước từ” của xe đó sẽ được thêm vào đầu danh sách.</small></div><div class="field"><label>Các bước thủ tục (mỗi dòng: Tiêu đề | Mô tả)</label><textarea name="installment_steps">${escapeHTML(s.installment_steps || '')}</textarea></div><div class="field"><label>Câu hỏi thường gặp (mỗi dòng: Câu hỏi | Trả lời)</label><textarea name="installment_faqs">${escapeHTML(s.installment_faqs || '')}</textarea></div>
        <div class="form-two"><div class="field"><label>Facebook Pixel ID</label><input name="meta_pixel_id" value="${escapeHTML(s.meta_pixel_id || '')}"></div><div class="field"><label>TikTok Pixel ID</label><input name="tiktok_pixel_id" value="${escapeHTML(s.tiktok_pixel_id || '')}"></div><div class="field"><label>Tên chatbot</label><input name="ai_name" value="${escapeHTML(s.ai_name || 'Tâm An AI')}"></div><div class="field"><label>Nhà cung cấp bot</label><select name="ai_provider"><option value="gemini" ${s.ai_provider !== 'webhook' ? 'selected' : ''}>Gemini API</option><option value="webhook" ${s.ai_provider === 'webhook' ? 'selected' : ''}>Webhook / chatbot khác</option></select></div><div class="field"><label>Model Gemini</label><input name="ai_model" value="${escapeHTML(s.ai_model || 'gemini-2.0-flash-lite')}"></div></div><label class="admin-check"><input name="ai_enabled" type="checkbox" ${s.ai_enabled ? 'checked' : ''}><span>✓</span> Bật chatbot tự động</label><div class="field"><label>Lời chào chatbot</label><textarea name="ai_greeting">${escapeHTML(s.ai_greeting || '')}</textarea></div><p class="muted">Gemini dùng Secret <code>GEMINI_API_KEY</code>. Chế độ Webhook dùng Secret <code>AI_WEBHOOK_URL</code>; không dán API key vào đây.</p><div class="field"><label>Kiến thức chatbot</label><textarea name="ai_knowledge">${escapeHTML(s.ai_knowledge || '')}</textarea></div><div class="field"><label>Từ khoá chuyển nhân viên</label><input name="ai_handoff_words" value="${escapeHTML(s.ai_handoff_words || '')}"></div>
      </fieldset>
      <button class="btn btn-primary">Lưu thay đổi website</button>
    </form>`;
    $$('.site-image-file', main).forEach(input => input.onchange = async () => { try { const url = await uploadFile(input.files[0]); $(`[name="${input.dataset.field}"]`, main).value = url; notify('Đã tải ảnh'); } catch (error) { notify(error.message); } });
    $('#logoFile', main).onchange = async event => { try { const url = await uploadFile(event.target.files[0]); $('[name="logo_url"]', main).value = url; $('[name="favicon_url"]', main).value = url; notify('Đã tải logo'); } catch (error) { notify(error.message); } };
    $('#faviconFile', main).onchange = async event => { try { $('[name="favicon_url"]', main).value = await uploadFile(event.target.files[0]); notify('Đã tải favicon'); } catch (error) { notify(error.message); } };
    const preview = () => {
      const form = $('#siteForm', main); const fd = new FormData(form); const draft = Object.fromEntries(fd.entries()); setSiteTheme({ ...state.site, ...draft });
      $('#bodySizeOut').value = `${draft.body_font_size}px`; $('#headingScaleOut').value = `${draft.heading_scale}x`; $('#lineHeightOut').value = draft.body_line_height; $('#radiusOut').value = `${draft.corner_radius}px`;
      $('#themePreviewTitle').style.fontFamily = `'${draft.heading_font}', Arial, sans-serif`; $('#themePreviewText').style.fontFamily = `'${draft.body_font}', Arial, sans-serif`;
    };
    ['bodySize','headingScale','lineHeight','cornerRadius'].forEach(id => $(`#${id}`, main).addEventListener('input', preview));
    ['body_font','heading_font','primary_color','accent_color','background_color','text_color'].forEach(name => $(`[name="${name}"]`, main).addEventListener('change', preview));
    preview();
    $('#siteForm', main).onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.target); const body = Object.fromEntries(fd.entries()); body.ai_enabled = fd.get('ai_enabled') === 'on'; try { const out = await request('/api/admin/site', { method:'PUT', body }); state.site = out.site; setSiteTheme(state.site); notify('Đã lưu giao diện và nội dung website'); } catch (error) { notify(error.message); } };
  }

  async function adminPolicies(main) {
    const data = await request('/api/admin/policies');
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Chính sách & bài viết</h1><p class="admin-sub">Viết nội dung chính sách hiển thị tại website.</p></div><button class="btn btn-primary" id="addPolicy">+ Viết bài</button></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Tiêu đề</th><th>Slug</th><th>Hiển thị</th><th></th></tr></thead><tbody>${data.policies.map(p => `<tr><td><b>${escapeHTML(p.title)}</b></td><td>${escapeHTML(p.slug)}</td><td>${p.published ? 'Có' : 'Ẩn'}</td><td><button class="small-btn edit-policy" data-id="${p.id}">Sửa</button><button class="small-btn danger delete-policy" data-id="${p.id}">Xoá</button></td></tr>`).join('')}</tbody></table></div></div>`;
    $('#addPolicy').onclick = () => openPolicyEditor();
    $$('.edit-policy').forEach(button => button.onclick = () => openPolicyEditor(data.policies.find(p => p.id === Number(button.dataset.id))));
    $$('.delete-policy').forEach(button => button.onclick = async () => { if (!confirm('Xoá bài này?')) return; try { await request(`/api/admin/policies/${button.dataset.id}`, { method:'DELETE' }); adminPolicies(main); } catch (error) { notify(error.message); } });
  }
  function openPolicyEditor(policy) {
    const p = policy || { published:true };
    const modal = adminModal(policy ? 'Sửa bài chính sách' : 'Viết bài chính sách', `<form id="policyForm" class="admin-product-form"><div class="field"><label>Tiêu đề</label><input name="title" required value="${escapeHTML(p.title || '')}"></div><div class="field"><label>Slug</label><input name="slug" value="${escapeHTML(p.slug || '')}"></div><div class="field"><label>Nội dung</label><textarea name="content" style="min-height:260px">${escapeHTML(p.content || '')}</textarea></div><label><input name="published" type="checkbox" ${p.published !== 0 ? 'checked' : ''}> Hiển thị</label><button class="btn btn-primary">Lưu bài viết</button></form>`);
    $('#policyForm', modal).onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.target); const body = Object.fromEntries(fd.entries()); body.published = fd.get('published') === 'on'; try { await request(policy ? `/api/admin/policies/${p.id}` : '/api/admin/policies', { method:policy ? 'PUT' : 'POST', body }); notify('Đã lưu bài viết'); modal.remove(); document.body.classList.remove('modal-open'); loadAdminTab('policies'); } catch (error) { notify(error.message); } };
  }

  async function adminLeads(main) {
    const users = state.admin.role === 'admin' ? (await request('/api/admin/users')).users : [];
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Form khách hàng</h1><p class="admin-sub">Tích xử lý xong, lọc theo ngày; admin được xoá và gán nhân viên.</p></div><div class="form-three"><select id="leadStatus"><option value="">Tất cả trạng thái</option><option value="new">Chưa xử lý</option><option value="in_progress">Đang xử lý</option><option value="done">Đã xong</option></select>${state.admin.role === 'admin' ? `<select id="leadAssigned"><option value="">Tất cả nhân viên</option>${users.filter(u => u.role === 'employee').map(u => `<option value="${u.id}">${escapeHTML(u.full_name)}</option>`).join('')}</select>` : ''}<input id="leadFrom" type="date"><input id="leadTo" type="date"></div></div><div id="leadRows" class="admin-card"></div>`;
    async function load() {
      const qs = new URLSearchParams(); if ($('#leadStatus').value) qs.set('status', $('#leadStatus').value); if ($('#leadFrom').value) qs.set('from', $('#leadFrom').value); if ($('#leadTo').value) qs.set('to', $('#leadTo').value);
      const data = await request(`/api/admin/leads?${qs}`);
      $('#leadRows').innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Khách</th><th>Nội dung</th><th>Ngày</th><th>Nhân viên</th><th>Trạng thái</th><th></th></tr></thead><tbody>${data.leads.map(lead => `<tr><td><b>${escapeHTML(lead.name)}</b><br><a href="tel:${escapeHTML(lead.phone)}">${escapeHTML(lead.phone)}</a></td><td><b>${escapeHTML(lead.type)}</b><br><span class="lead-payment">${escapeHTML(paymentPlanLabel(lead.payment_plan))}${lead.down_payment ? ` • ${escapeHTML(lead.down_payment)}` : ''}</span>${lead.note ? `<br><span class="muted">${escapeHTML(lead.note)}</span>` : ''}</td><td>${escapeHTML(lead.created_at)}</td><td>${state.admin.role === 'admin' ? `<select class="lead-assignee" data-id="${lead.id}"><option value="">Chưa gán</option>${users.filter(u => u.role === 'employee').map(u => `<option value="${u.id}" ${lead.assigned_to === u.id ? 'selected' : ''}>${escapeHTML(u.full_name)}</option>`).join('')}</select>` : escapeHTML(lead.assigned_name || '')}</td><td><select class="lead-state" data-id="${lead.id}"><option value="new" ${lead.status === 'new' ? 'selected' : ''}>Chưa xử lý</option><option value="in_progress" ${lead.status === 'in_progress' ? 'selected' : ''}>Đang xử lý</option><option value="done" ${lead.status === 'done' ? 'selected' : ''}>Đã xong</option></select></td><td>${state.admin.role === 'admin' ? `<button class="small-btn danger delete-lead" data-id="${lead.id}">Xoá</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="admin-empty">Chưa có form phù hợp.</td></tr>'}</tbody></table></div>`;
      $$('.lead-state').forEach(select => select.onchange = async () => { const row = select.closest('tr'); const payload = { status:select.value }; if (state.admin.role === 'admin') payload.assigned_to = $('.lead-assignee', row)?.value || null; try { await request(`/api/admin/leads/${select.dataset.id}`, { method:'PUT', body:payload }); notify('Đã cập nhật'); } catch (error) { notify(error.message); } });
      $$('.lead-assignee').forEach(select => select.onchange = async () => { const row = select.closest('tr'); const status = $('.lead-state', row).value; try { await request(`/api/admin/leads/${select.dataset.id}`, { method:'PUT', body:{ status, assigned_to:select.value || null } }); notify('Đã gán nhân viên'); } catch (error) { notify(error.message); } });
      $$('.delete-lead').forEach(button => button.onclick = async () => { if (!confirm('Xoá form này?')) return; try { await request(`/api/admin/leads/${button.dataset.id}`, { method:'DELETE' }); load(); } catch (error) { notify(error.message); } });
    }
    ['leadStatus','leadAssigned','leadFrom','leadTo'].forEach(id => $(`#${id}`) && ($(`#${id}`).onchange = load)); await load();
  }

  async function adminChats(main) {
    const users = state.admin.role === 'admin' ? (await request('/api/admin/users')).users : [];
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Chat trực tuyến</h1><p class="admin-sub">Khách thấy tên nhân viên trả lời. Nhân viên nhận chat là AI tự nhường.</p></div><button id="chatSound" class="small-btn">Bật chuông chat</button></div><div class="admin-toolbar"><div class="form-three"><select id="chatStatus"><option value="">Tất cả</option><option value="open">Đang mở</option><option value="done">Đã xong</option></select>${state.admin.role === 'admin' ? `<select id="chatAssigned"><option value="">Tất cả nhân viên</option>${users.filter(u => u.role === 'employee').map(u => `<option value="${u.id}">${escapeHTML(u.full_name)}</option>`).join('')}</select>` : ''}<input id="chatFrom" type="date"><input id="chatTo" type="date"></div></div><div class="admin-chat"><div id="conversationList" class="chat-list-admin"></div><div id="conversationThread" class="chat-admin-thread"><div class="admin-empty">Chọn hội thoại để trả lời.</div></div></div>`;
    let selected = null; let soundOn = false;
    $('#chatSound').onclick = () => { soundOn = true; notify('Đã bật chuông chat cho tab này.'); };
    const beep = () => { if (!soundOn) return; try { const context = new AudioContext(); const osc = context.createOscillator(); const gain = context.createGain(); osc.connect(gain); gain.connect(context.destination); gain.gain.value = .08; osc.frequency.value = 720; osc.start(); osc.stop(context.currentTime + .12); } catch {} };
    async function openThread(id) {
      selected = id; const data = await request(`/api/admin/conversations/${id}`); const conv = data.conversation;
      $('#conversationThread').innerHTML = `<div class="chat-body">${data.messages.map(m => `<div class="chat-msg ${escapeHTML(m.sender_type)}"><small>${escapeHTML(m.sender_type === 'visitor' ? 'Khách' : (m.sender_name || 'Tâm An'))}</small>${escapeHTML(m.body)}</div>`).join('')}</div><div style="padding:12px;border-top:1px solid var(--line)"><div class="form-two"><select id="conversationState"><option value="open" ${conv.status === 'open' ? 'selected' : ''}>Đang mở</option><option value="done" ${conv.status === 'done' ? 'selected' : ''}>Đã xong</option></select>${state.admin.role === 'admin' ? `<select id="conversationAssignee"><option value="">Chưa gán</option>${users.filter(u => u.role === 'employee').map(u => `<option value="${u.id}" ${conv.assigned_to === u.id ? 'selected' : ''}>${escapeHTML(u.full_name)}</option>`).join('')}</select>` : `<input value="${escapeHTML(conv.assigned_name || state.admin.name)}" disabled>`}</div><form id="replyForm" class="chat-form" style="margin-top:8px"><input name="body" placeholder="Trả lời với tên ${escapeHTML(state.admin.name)}…"><button>Gửi</button></form>${state.admin.role === 'admin' ? '<button id="deleteConversation" class="small-btn danger" style="margin-top:8px">Xoá hội thoại</button>' : ''}</div>`;
      $('.chat-body', $('#conversationThread')).scrollTop = 999999;
      $('#conversationState').onchange = async () => { try { const payload = { status:$('#conversationState').value }; if (state.admin.role === 'admin') payload.assigned_to = $('#conversationAssignee')?.value || null; await request(`/api/admin/conversations/${id}`, { method:'PUT', body:payload }); refresh(true); } catch (error) { notify(error.message); } };
      $('#conversationAssignee')?.addEventListener('change', async () => { try { await request(`/api/admin/conversations/${id}`, { method:'PUT', body:{ status:$('#conversationState').value, assigned_to:$('#conversationAssignee').value || null } }); refresh(true); } catch (error) { notify(error.message); } });
      $('#replyForm').onsubmit = async event => { event.preventDefault(); const input = $('input', event.target); const body = input.value.trim(); if (!body) return; try { await request(`/api/admin/conversations/${id}/messages`, { method:'POST', body:{ body } }); input.value = ''; openThread(id); refresh(true); } catch (error) { notify(error.message); } };
      $('#deleteConversation')?.addEventListener('click', async () => { if (!confirm('Xoá toàn bộ hội thoại?')) return; try { await request(`/api/admin/conversations/${id}`, { method:'DELETE' }); selected = null; $('#conversationThread').innerHTML = '<div class="admin-empty">Đã xoá hội thoại.</div>'; refresh(true); } catch (error) { notify(error.message); } });
    }
    async function refresh(silent = false) {
      const qs = new URLSearchParams(); if ($('#chatStatus').value) qs.set('status', $('#chatStatus').value); if ($('#chatFrom').value) qs.set('from', $('#chatFrom').value); if ($('#chatTo').value) qs.set('to', $('#chatTo').value); if ($('#chatAssigned')?.value) qs.set('assigned_to', $('#chatAssigned').value);
      const data = await request(`/api/admin/conversations?${qs}`);
      const previous = $('#conversationList').dataset.ids || ''; const now = data.conversations.map(c => `${c.id}:${c.updated_at}`).join(','); if (previous && previous !== now && !silent) beep(); $('#conversationList').dataset.ids = now;
      $('#conversationList').innerHTML = data.conversations.map(c => `<div class="chat-list-item ${selected === c.id ? 'active' : ''}" data-id="${c.id}"><b>${escapeHTML(c.visitor_name || 'Khách')} ${c.status === 'done' ? '✓' : ''}</b><span>${escapeHTML(c.assigned_name || 'Chưa gán')} • ${escapeHTML(c.last_message || '')}</span></div>`).join('') || '<div class="admin-empty">Chưa có hội thoại.</div>';
      $$('.chat-list-item').forEach(item => item.onclick = () => openThread(Number(item.dataset.id)));
    }
    ['chatStatus','chatAssigned','chatFrom','chatTo'].forEach(id => $(`#${id}`) && ($(`#${id}`).onchange = () => refresh()));
    await refresh(); clearInterval(window.__tamAnAdminChatTimer); window.__tamAnAdminChatTimer = setInterval(() => refresh(true).catch(() => {}), 9000);
  }

  async function adminUsers(main) {
    const data = await request('/api/admin/users');
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Nhân viên</h1><p class="admin-sub">Tài khoản nhân viên không có quyền xoá hoặc sửa website.</p></div><button id="addUser" class="btn btn-primary">+ Thêm nhân viên</button></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th></tr></thead><tbody>${data.users.map(u => `<tr><td><b>${escapeHTML(u.full_name)}</b></td><td>${escapeHTML(u.username)}</td><td>${u.role === 'admin' ? 'Chủ cửa hàng' : 'Nhân viên'}</td><td>${u.active ? 'Đang hoạt động' : 'Đã khoá'}</td></tr>`).join('')}</tbody></table></div></div>`;
    $('#addUser').onclick = () => {
      const modal = adminModal('Thêm nhân viên', `<form id="userForm" class="admin-product-form"><div class="field"><label>Họ và tên</label><input name="full_name" required></div><div class="field"><label>Tên đăng nhập</label><input name="username" required></div><div class="field"><label>Mật khẩu ban đầu</label><input name="password" type="password" required></div><button class="btn btn-primary">Tạo tài khoản</button></form>`);
      $('#userForm', modal).onsubmit = async event => { event.preventDefault(); try { await request('/api/admin/users', { method:'POST', body:Object.fromEntries(new FormData(event.target).entries()) }); notify('Đã tạo tài khoản nhân viên'); modal.remove(); document.body.classList.remove('modal-open'); loadAdminTab('users'); } catch (error) { notify(error.message); } };
    };
  }
  async function adminAnalytics(main) {
    const data = await request('/api/admin/analytics');
    main.innerHTML = `<h1 class="admin-title">Lượt truy cập</h1><p class="admin-sub">Số liệu nội bộ 30 ngày gần nhất. Pixel Facebook/TikTok được cấu hình trong Nội dung website.</p><div class="admin-grid"><div class="metric"><b>${data.total}</b><span>Lượt xem trang / 30 ngày</span></div></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ngày</th><th>Lượt xem</th><th>Khách gần đúng</th></tr></thead><tbody>${data.days.map(day => `<tr><td>${escapeHTML(day.day)}</td><td>${day.visits}</td><td>${day.visitors}</td></tr>`).join('') || '<tr><td colspan="3" class="admin-empty">Chưa có dữ liệu.</td></tr>'}</tbody></table></div></div>`;
  }
  async function adminLogs(main) {
    const data = await request('/api/admin/logs');
    main.innerHTML = `<h1 class="admin-title">Nhật ký hệ thống</h1><p class="admin-sub">Chỉ admin xem được lịch sử thao tác quan trọng.</p><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hoạt động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>${data.logs.map(log => `<tr><td>${escapeHTML(log.created_at)}</td><td>${escapeHTML(log.actor_name || '')}</td><td><b>${escapeHTML(log.action)}</b></td><td>${escapeHTML(log.entity_type || '')} #${escapeHTML(log.entity_id || '')}</td><td>${escapeHTML(log.detail || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="admin-empty">Chưa có nhật ký.</td></tr>'}</tbody></table></div></div>`;
  }

  async function boot() {
    try {
      await loadPublicData();
      trackVisit();
      if (location.pathname === '/admin') renderAdmin();
      else if (location.pathname === '/tra-gop') renderFinance();
      else renderHome();
    } catch (error) {
      app.innerHTML = `<main class="admin-login"><div class="login-card"><img src="/assets/logo.jpg" alt=""><h1>Không tải được website</h1><p>${escapeHTML(error.message)}</p><button class="btn btn-primary" onclick="location.reload()">Thử lại</button></div></main>`;
    }
  }
  boot();
})();
