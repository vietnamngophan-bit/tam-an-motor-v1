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

  // D1 stores CURRENT_TIMESTAMP in UTC. All timestamps shown to staff are converted
  // to Vietnam time (Asia/Ho_Chi_Minh, GMT+7) before rendering.
  function vietnamTime(value, withSeconds = false) {
    if (!value) return '—';
    let source = String(value).trim();
    // D1 returns `YYYY-MM-DD HH:MM:SS` without an offset; treat it as UTC.
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(source)) source = `${source.replace(' ', 'T')}Z`;
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
      ...(withSeconds ? { second: '2-digit' } : {})
    }).format(date).replace(',', ' •');
  }
  function multiline(value = '') { return escapeHTML(value).replace(/\n/g, '<br>'); }

  // Product description: keeps Word-like formatting created by the admin editor,
  // while turning old plain-text descriptions into clean paragraphs/lists.
  function inlineDescriptionHTML(value = '') {
    let text = escapeHTML(value)
      .replace(/\s*\[(?:\d+\s*,?\s*)+\]/g, '')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    return text;
  }

  function sanitizeRichHTML(value = '') {
    const raw = String(value || '');
    if (!raw) return '';
    const template = document.createElement('template');
    template.innerHTML = raw;
    const allowed = new Set(['P','DIV','BR','STRONG','B','EM','I','U','H2','H3','H4','UL','OL','LI','SPAN','FONT','BLOCKQUOTE']);
    const removeCompletely = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','LINK','META']);
    const allowedStyles = new Set(['font-weight','font-style','text-decoration','color','font-family','font-size','text-align','line-height']);
    const clean = node => {
      if (node.nodeType === Node.TEXT_NODE) return;
      if (node.nodeType !== Node.ELEMENT_NODE) { node.remove(); return; }
      const tag = node.tagName.toUpperCase();
      if (removeCompletely.has(tag)) { node.remove(); return; }
      Array.from(node.childNodes).forEach(clean);
      if (!allowed.has(tag)) {
        const fragment = document.createDocumentFragment();
        while (node.firstChild) fragment.appendChild(node.firstChild);
        node.replaceWith(fragment);
        return;
      }
      Array.from(node.attributes).forEach(attr => {
        const key = attr.name.toLowerCase();
        if (key === 'style') {
          const safeStyle = attr.value.split(';').map(part => part.trim()).filter(Boolean).map(part => {
            const [prop, ...rest] = part.split(':');
            const name = String(prop || '').trim().toLowerCase();
            const val = rest.join(':').trim();
            if (!allowedStyles.has(name) || /url\s*\(|expression\s*\(|javascript:/i.test(val)) return '';
            return `${name}:${val}`;
          }).filter(Boolean).join(';');
          if (safeStyle) node.setAttribute('style', safeStyle); else node.removeAttribute('style');
        } else if (!((tag === 'FONT' && ['face','size','color'].includes(key)))) {
          node.removeAttribute(attr.name);
        }
      });
    };
    Array.from(template.content.childNodes).forEach(clean);
    return template.innerHTML;
  }

  function plainDescriptionHTML(value = '') {
    const raw = String(value || '').replace(/\r\n?/g, '\n').trim();
    if (!raw) return '';
    const blocks = raw.split(/\n\s*\n/).filter(Boolean);
    return blocks.map(block => {
      const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
      if (!lines.length) return '';
      if (lines.every(line => /^[-•*]\s+/.test(line))) {
        return `<ul>${lines.map(line => `<li>${inlineDescriptionHTML(line.replace(/^[-•*]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      if (/^#{1,3}\s+/.test(lines[0])) {
        const title = lines.shift().replace(/^#{1,3}\s+/, '');
        return `<h3>${inlineDescriptionHTML(title)}</h3>${lines.length ? `<p>${lines.map(inlineDescriptionHTML).join('<br>')}</p>` : ''}`;
      }
      // Markdown-style bold headers such as **Thông số kỹ thuật**.
      if (lines.length === 1 && /^\*\*.+\*\*$/.test(lines[0])) return `<h3>${inlineDescriptionHTML(lines[0])}</h3>`;
      return `<p>${lines.map(inlineDescriptionHTML).join('<br>')}</p>`;
    }).join('');
  }

  function descriptionHTML(value = '') {
    const raw = String(value || '').trim();
    if (!raw) return '<p class="muted">Tâm An sẽ cập nhật thông tin chi tiết cho mẫu xe này.</p>';
    return /<\/?[a-z][\s\S]*>/i.test(raw) ? sanitizeRichHTML(raw) : plainDescriptionHTML(raw);
  }

  function editorInitialHTML(value = '') {
    const raw = String(value || '').trim();
    return /<\/?[a-z][\s\S]*>/i.test(raw) ? sanitizeRichHTML(raw) : plainDescriptionHTML(raw);
  }

  function bindDescriptionEditor(modal) {
    const editor = $('#descriptionEditor', modal);
    const output = $('#descriptionValue', modal);
    if (!editor || !output) return;
    const sync = () => { output.value = sanitizeRichHTML(editor.innerHTML); };
    const focusEditor = () => editor.focus({ preventScroll: true });
    $$('.rich-toolbar [data-command]', modal).forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      focusEditor();
      document.execCommand(button.dataset.command, false, button.dataset.value || null);
      sync();
    }));
    const fontPicker = $('.rich-font-picker', modal);
    const sizePicker = $('.rich-size-picker', modal);
    const colorPicker = $('.rich-color-picker', modal);
    fontPicker?.addEventListener('change', () => { focusEditor(); document.execCommand('fontName', false, fontPicker.value); sync(); });
    sizePicker?.addEventListener('change', () => { focusEditor(); document.execCommand('fontSize', false, sizePicker.value); sync(); });
    colorPicker?.addEventListener('input', () => { focusEditor(); document.execCommand('foreColor', false, colorPicker.value); sync(); });
    editor.addEventListener('input', sync);
    editor.addEventListener('blur', sync);
    sync();
  }
  function notify(message) {
    toastBox.textContent = message;
    toastBox.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toastBox.classList.remove('show'), 3500);
  }

  // Overlay helpers: every modal/lightbox can be closed by X, clicking the dark backdrop,
  // or pressing Escape. This avoids fixed header/contact buttons intercepting touch events.
  function removeOverlay(element) {
    if (!element) return;
    element.remove();
    if (!document.querySelector('.modal, .lightbox')) document.body.classList.remove('modal-open');
  }
  function bindOverlayDismissal(overlay, selector = '.modal-close') {
    const onKey = event => { if (event.key === 'Escape') close(); };
    const close = () => {
      document.removeEventListener('keydown', onKey);
      removeOverlay(overlay);
    };
    const button = $(selector, overlay);
    if (button) {
      button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); close(); });
      button.addEventListener('pointerup', event => { event.preventDefault(); event.stopPropagation(); close(); });
    }
    overlay.addEventListener('pointerdown', event => { if (event.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    return close;
  }

  // A vehicle colour is a complete paint combination, not separate selectable colours.
  // `swatches` contains 1–3 contiguous visual blocks, e.g. [white, red, black].
  function validHex(value, fallback = '#c81924') {
    const text = String(value || '').trim();
    return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
  }
  function paletteOf(color = {}) {
    const raw = Array.isArray(color.swatches) && color.swatches.length ? color.swatches : [color.hex || '#c81924'];
    const out = raw.map(hex => validHex(hex)).slice(0, 3);
    return out.length ? out : ['#c81924'];
  }
  function paletteStrip(color = {}, className = '') {
    const swatches = paletteOf(color);
    return `<span class="paint-strip ${escapeHTML(className)}" aria-label="Phối màu ${escapeHTML(color.name || '')}">${swatches.map(hex => `<i style="background:${escapeHTML(hex)}"></i>`).join('')}</span>`;
  }
  function colorClone(color = {}) {
    const swatches = paletteOf(color);
    const availability = ['in_stock','out_of_stock','incoming'].includes(color.availability) ? color.availability : 'in_stock';
    const rawQuantity = color.stock_quantity === '' || color.stock_quantity === undefined || color.stock_quantity === null ? null : Number(color.stock_quantity);
    return { name: color.name || '', hex: swatches[0], swatches, images: [...(color.images || [])], availability, stock_quantity: Number.isFinite(rawQuantity) ? Math.max(0, Math.floor(rawQuantity)) : null };
  }
  function productVariantColors(product) {
    return (product.versions || []).flatMap(version => Array.isArray(version.colors) ? version.colors : []);
  }
  function allProductColors(product) {
    const output = [...(product.colors || []), ...productVariantColors(product)];
    const used = new Set();
    return output.filter(color => {
      const key = `${color.name || ''}|${paletteOf(color).join(',')}|${(color.images || [])[0] || ''}`;
      if (used.has(key)) return false; used.add(key); return true;
    });
  }
  function productImage(product) {
    const color = allProductColors(product).find(c => c.images && c.images.length);
    return color?.images?.[0] || product.images?.[0] || '/assets/tam-an-promo.jpg';
  }
  function statusName(status) {
    return { in_stock:'Còn hàng', incoming:'Sắp về', reserved:'Đang giữ xe', sold:'Đã bán' }[status] || 'Còn hàng';
  }
  function colorAvailabilityName(status) {
    return { in_stock:'Còn hàng', out_of_stock:'Hết hàng', incoming:'Sắp về' }[status] || 'Còn hàng';
  }
  function colorStockText(color = {}) {
    const status = color.availability || 'in_stock';
    const quantity = color.stock_quantity === '' || color.stock_quantity === undefined || color.stock_quantity === null ? null : Number(color.stock_quantity);
    if (status === 'out_of_stock') return 'Hết hàng';
    if (status === 'incoming') return quantity && quantity > 0 ? `Sắp về · dự kiến ${quantity} xe` : 'Sắp về';
    return Number.isFinite(quantity) ? `Còn ${Math.max(0, Math.floor(quantity))} xe` : 'Còn hàng';
  }
  function colorStockClass(color = {}) { return `stock-${String(color.availability || 'in_stock').replace(/[^a-z_]/g, '')}`; }
  function inventorySummary(product = {}) {
    const colors = allProductColors(product);
    if (!colors.length) return '<span class="muted">Chưa khai báo</span>';
    return `<div class="inventory-summary">${colors.slice(0,5).map(color => `<span class="${colorStockClass(color)}">${escapeHTML(color.name || 'Màu')} · ${escapeHTML(colorStockText(color))}</span>`).join('')}${colors.length > 5 ? `<span class="muted">+${colors.length - 5} màu</span>` : ''}</div>`;
  }
  function leadLocationHTML(locationText = '') {
    const raw = String(locationText || '').trim();
    if (!raw) return '';
    const url = (raw.match(/https?:\/\/\S+/) || [])[0] || '';
    const readable = raw.replace(/\s*\|\s*https?:\/\/\S+/g, '').trim();
    return `<br><span class="lead-location-text">⌖ ${escapeHTML(readable)}</span>${url ? `<br><a class="location-link" target="_blank" rel="noopener" href="${escapeHTML(url)}">Mở vị trí trên bản đồ ↗</a>` : ''}`;
  }
  function normalize(text = '') {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  }
  function fuzzyMatch(product, query) {
    const needle = normalize(query);
    if (!needle) return true;
    const source = normalize([
      product.name, product.brand, product.category,
      ...allProductColors(product).map(c => c.name),
      ...(product.versions || []).map(v => v.name)
    ].join(' '));
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


  // Admin-configured announcement ticker. It deliberately presents curated store notices,
  // not unverified live customer activity.
  function noticeRows() {
    const raw = String(state.site?.notice_items || '').trim();
    if (!raw) return [];
    const products = state.products.filter(product => product.published !== 0 && product.status !== 'sold');
    return raw.split('\n').map((line, index) => {
      const parts = line.split('|').map(part => part.trim());
      const label = parts.length > 1 ? parts.shift() : 'Tâm An';
      let message = parts.join('|').trim() || line.trim();
      const product = products.length ? products[index % products.length] : null;
      message = message.replace(/\{xe\}/gi, product?.name || 'mẫu xe đang quan tâm');
      return { label: label || 'Tâm An', message };
    }).filter(row => row.message);
  }

  function noticeTicker() {
    const s = state.site || {};
    const rows = noticeRows();
    if (!s.notice_enabled || !rows.length) return '';
    const position = ['left', 'center', 'right'].includes(s.notice_position) ? s.notice_position : 'left';
    const positionClass = `notice-${position}`;
    return `<aside id="noticeTicker" class="notice-ticker ${positionClass}" role="status" aria-live="polite" aria-label="${escapeHTML(s.notice_title || 'Thông báo nổi bật')}">
      <span class="notice-orbit" aria-hidden="true"></span>
      <div class="notice-symbol" aria-hidden="true">✦</div>
      <div class="notice-copy"><span class="notice-title">${escapeHTML(s.notice_title || 'Thông báo nổi bật')}</span><p id="noticeMessage"></p></div>
      <button id="noticeClose" class="notice-close" type="button" aria-label="Đóng thông báo">×</button>
    </aside>`;
  }

  function bindNoticeTicker() {
    const ticker = $('#noticeTicker');
    const output = $('#noticeMessage');
    if (!ticker || !output) return;
    const rows = noticeRows();
    if (!rows.length) return;

    const interval = Math.max(3500, Math.min(30000, Number(state.site?.notice_interval || 6000)));
    // A single notice visibly appears, then fades away before the next one shows.
    const visibleFor = Math.max(2100, interval - 1100);
    let index = 0;
    let timer = null;
    let stopped = false;

    const clearTimers = () => { if (timer) window.clearTimeout(timer); timer = null; };
    const showNext = () => {
      if (stopped) return;
      const row = rows[index % rows.length];
      ticker.classList.remove('is-fading');
      output.classList.remove('is-visible');
      window.setTimeout(() => {
        if (stopped) return;
        output.innerHTML = `<b>${escapeHTML(row.label)}</b><span>${escapeHTML(row.message)}</span>`;
        output.classList.add('is-visible');
        timer = window.setTimeout(() => {
          if (stopped) return;
          ticker.classList.add('is-fading');
          output.classList.remove('is-visible');
          timer = window.setTimeout(() => {
            index = (index + 1) % rows.length;
            showNext();
          }, 460);
        }, visibleFor);
      }, 110);
    };
    const pause = () => { clearTimers(); };
    const resume = () => { clearTimers(); showNext(); };

    showNext();
    ticker.addEventListener('mouseenter', pause);
    ticker.addEventListener('mouseleave', resume);
    ticker.addEventListener('touchstart', pause, { passive:true });
    ticker.addEventListener('touchend', () => { timer = window.setTimeout(resume, 1800); }, { passive:true });
    $('#noticeClose')?.addEventListener('click', () => { stopped = true; clearTimers(); ticker.remove(); });
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
    setClientShareMeta(site);
  }

  function setClientShareMeta(site) {
    const ensure = (property, content, kind = 'property') => {
      let tag = document.head.querySelector(`meta[${kind}="${property}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute(kind, property); document.head.appendChild(tag); }
      tag.setAttribute('content', content || '');
    };
    const title = site.share_title || site.page_title || site.brand_name || 'Xe Máy Tâm An';
    const description = site.share_description || site.hero_subtitle || site.tagline || '';
    const image = site.share_image || heroImages(site)[0] || site.showroom_image || site.logo_url || '';
    ensure('og:title', title); ensure('og:description', description); ensure('og:image', image);
    ensure('twitter:title', title, 'name'); ensure('twitter:description', description, 'name'); ensure('twitter:image', image, 'name');
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
      'phone-ring': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 3.6 5.1 5.8c-.7.7-.9 1.7-.6 2.7 1.7 5.2 5.8 9.3 11 11 .9.3 2-.1 2.7-.8l1.9-1.9-3.6-3.6-1.5 1.5c-2-.9-3.6-2.5-4.5-4.5l1.5-1.5L8.4 5.1 7.3 3.6Zm9.3-1.4c2.9.5 5.2 2.8 5.7 5.7l-1.9.3c-.4-2.1-2-3.7-4.1-4.1l.3-1.9Zm-.4 4.4c.8.2 1.4.8 1.6 1.6l-1.8.4c-.1-.2-.2-.4-.4-.4l.6-1.6Z"/></svg>',
      headset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a8 8 0 0 0-8 8v6a3 3 0 0 0 3 3h2v-7H6v-2a6 6 0 0 1 12 0v2h-3v7h2a3 3 0 0 0 3-3v-6a8 8 0 0 0-8-8Z"/></svg>',
      'message-circle': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.2 14.4L3 21l3.7-1.2A9 9 0 1 0 12 3Zm-4 8h8v2H8v-2Zm0 4h5v2H8v-2Z"/></svg>',
      sparkles: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Zm7 11 .9 2.1L22 16l-2.1.9L19 19l-.9-2.1L16 16l2.1-.9L19 13ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z"/></svg>',
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.8v16.4c0 1 1.1 1.6 2 1l12-8.2a1.2 1.2 0 0 0 0-2L7 2.8c-.9-.6-2 0-2 1Z"/></svg>',
      heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.5-9.4-9.1C1 8.2 3.2 5 6.8 5c2 0 3.5 1 4.2 2.4C11.7 6 13.2 5 15.2 5c3.6 0 5.8 3.2 4.2 6.9C19.5 16.5 12 21 12 21Z"/></svg>',
      chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10l-5.3 3.5A.45.45 0 0 1 4 21.1V18a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 6v2h10V9H7Zm0 4v2h7v-2H7Z"/></svg>',
      top: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.7 14.7 5.3-5.3 5.3 5.3 1.4-1.4L12 6.6l-6.7 6.7 1.4 1.4Z"/></svg>'
    };
    return icons[name] || '';
  }
  function socialLink(type, label, url, extra = '') {
    if (!url) return '';
    return `<a class="social social-${type} ${extra}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">${socialIcon(type)}<span class="sr-only">${escapeHTML(label)}</span></a>`;
  }

  const CONTACT_ICON_OPTIONS = {
    call: [['phone','Điện thoại'],['phone-ring','Điện thoại đổ chuông'],['headset','Tổng đài'],['chat','Tin nhắn']],
    zalo: [['zalo','Zalo'],['chat','Bong bóng chat'],['message-circle','Tin nhắn tròn']],
    messenger: [['messenger','Messenger'],['chat','Bong bóng chat'],['message-circle','Tin nhắn tròn']],
    facebook: [['facebook','Facebook'],['chat','Chat'],['heart','Yêu thích']],
    tiktok: [['tiktok','TikTok'],['play','Phát video'],['sparkles','Nổi bật']],
    chat: [['chat','Tin nhắn'],['message-circle','Tin nhắn tròn'],['headset','Tư vấn viên']]
  };
  function iconOptionsFor(type, selected = '') {
    const items = CONTACT_ICON_OPTIONS[type] || [];
    return items.map(([value,label]) => `<option value="${value}" ${value === (selected || items[0]?.[0]) ? 'selected' : ''}>${label}</option>`).join('');
  }
  function contactIcon(type, fallback) {
    const s = state.site || {};
    const custom = s[`floating_${type}_icon_url`];
    const choice = s[`floating_${type}_icon`] || fallback;
    return custom ? `<img class="custom-float-icon" src="${escapeHTML(custom)}" alt="">` : socialIcon(choice);
  }
  function contactButtonStyle(type) {
    const s = state.site || {};
    const color = s[`floating_${type}_color`] || '';
    const shape = s[`floating_${type}_shape`] || 'rounded';
    const style = color ? `--float-color:${escapeHTML(color)};` : '';
    return { style, shape };
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
    const colors = allProductColors(product).slice(0, 8);
    const discount = product.old_price && product.price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
    return `<article class="product-card">
      <button class="product-media open-product" data-slug="${escapeHTML(product.slug)}"><img src="${escapeHTML(productImage(product))}" alt="${escapeHTML(product.name)}"><span class="status-badge">${statusName(product.status)}</span>${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}</button>
      <div class="product-body"><div class="product-meta">${escapeHTML(product.brand || 'TÂM AN')} • ${escapeHTML(categoryLabel(product.category))}</div><h3>${escapeHTML(product.name)}</h3>
      <div class="product-details">${product.year ? `<span class="mini-tag">${product.year}</span>` : ''}${product.engine ? `<span class="mini-tag">${escapeHTML(product.engine)}</span>` : ''}</div>
      <div class="price-line">${product.price ? `<span class="price">${money(product.price)}</span>${product.old_price ? `<span class="old-price">${money(product.old_price)}</span>` : ''}` : `<span class="price-hidden">Liên hệ nhận giá</span>`}</div>
      ${colors.length ? `<div class="color-dots paint-preview-row">${colors.map(c => `<button class="paint-preview preview-color ${colorStockClass(c)}" data-image="${escapeHTML(c.images?.[0] || productImage(product))}" title="${escapeHTML(`${c.name} — ${colorStockText(c)}`)}">${paletteStrip(c)}<span class="paint-preview-copy"><b>${escapeHTML(c.name)}</b><small>${escapeHTML(colorStockText(c))}</small></span></button>`).join('')}</div>` : ''}
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

  function heroImages(site) {
    const raw = site?.hero_images_json;
    let images = [];
    // Khi đã lưu slider dạng JSON thì dùng đúng danh sách đó, không tự chèn lại ảnh cũ.
    if (Array.isArray(raw)) {
      images = raw;
    } else if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        images = Array.isArray(parsed) ? parsed : [];
      } catch {
        images = raw.split(/\n|\|/);
      }
    }
    images = [...new Set(images.map(value => String(value || '').trim()).filter(value => /^\/?(?:media\/|assets\/)|^https?:\/\//.test(value)))];
    if (!images.length && site?.hero_image) images = [String(site.hero_image).trim()];
    return images.length ? images : ['/assets/tam-an-promo.jpg'];
  }

  function heroSliderField(site) {
    const images = heroImages(site);
    return `<div class="hero-slider-admin field full">
      <label>Slider ảnh Hero</label>
      <p class="field-help">Có thể tải nhiều ảnh. Chữ Hero giữ nguyên, chỉ ảnh tự chạy ngang. Ảnh đầu sẽ dùng làm ảnh dự phòng khi chia sẻ link nếu chưa đặt ảnh preview riêng.</p>
      <input id="heroImagesInput" type="file" accept="image/*" multiple>
      <input type="hidden" name="hero_images_json" value="${escapeHTML(JSON.stringify(images))}">
      <input type="hidden" name="hero_image" value="${escapeHTML(images[0] || site.hero_image || '')}">
      <div id="heroImagesList" class="hero-images-admin-list"></div>
    </div>`;
  }

  function bindHeroSliderAdmin(main, site) {
    const input = $('#heroImagesInput', main);
    const list = $('#heroImagesList', main);
    const jsonField = $('[name="hero_images_json"]', main);
    const firstField = $('[name="hero_image"]', main);
    if (!input || !list || !jsonField || !firstField) return;
    let images = heroImages(site);
    const sync = () => {
      jsonField.value = JSON.stringify(images);
      firstField.value = images[0] || '';
      list.innerHTML = images.map((url, index) => `<article class="hero-image-admin-item">
        <img src="${escapeHTML(url)}" alt="Ảnh Hero ${index + 1}">
        <div><b>Ảnh ${index + 1}</b><small>${index === 0 ? 'Ảnh đầu tiên' : 'Ảnh slider'}</small></div>
        <div class="hero-image-admin-actions">
          <button type="button" class="small-btn hero-move" data-hero-index="${index}" data-hero-dir="-1" ${index === 0 ? 'disabled' : ''}>←</button>
          <button type="button" class="small-btn hero-move" data-hero-index="${index}" data-hero-dir="1" ${index === images.length - 1 ? 'disabled' : ''}>→</button>
          <button type="button" class="small-btn danger hero-remove" data-hero-index="${index}" ${images.length === 1 ? 'disabled title="Cần giữ ít nhất 1 ảnh Hero"' : ''}>×</button>
        </div>
      </article>`).join('');
      $$('.hero-move', list).forEach(button => button.onclick = () => {
        const from = Number(button.dataset.heroIndex), to = from + Number(button.dataset.heroDir);
        if (to < 0 || to >= images.length) return;
        [images[from], images[to]] = [images[to], images[from]];
        sync();
      });
      $$('.hero-remove', list).forEach(button => button.onclick = () => {
        if (images.length <= 1) return;
        images.splice(Number(button.dataset.heroIndex), 1);
        sync();
      });
    };
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (!files.length) return;
      input.disabled = true;
      try {
        for (const file of files) images.push(await uploadFile(file));
        images = [...new Set(images)];
        sync();
        notify(`Đã thêm ${files.length} ảnh Hero.`);
      } catch (error) { notify(error.message); }
      finally { input.disabled = false; input.value = ''; }
    };
    sync();
  }

  function bindHeroSlider() {
    const hero = $('.hero-slider');
    if (!hero) return;
    const slides = $$('.hero-slide', hero);
    const dots = $$('.hero-dot', hero);
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;
    let startX = null;
    const apply = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      stop();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = window.setInterval(() => apply(index + 1), 5200);
    };
    $('#heroPrev')?.addEventListener('click', () => { apply(index - 1); start(); });
    $('#heroNext')?.addEventListener('click', () => { apply(index + 1); start(); });
    dots.forEach(dot => dot.addEventListener('click', () => { apply(Number(dot.dataset.heroDot)); start(); }));
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('touchstart', event => { startX = event.changedTouches?.[0]?.clientX ?? null; stop(); }, { passive:true });
    hero.addEventListener('touchend', event => {
      const endX = event.changedTouches?.[0]?.clientX ?? startX;
      if (startX !== null && Math.abs(endX - startX) > 34) apply(index + (endX < startX ? 1 : -1));
      startX = null;
      start();
    }, { passive:true });
    start();
  }

  function renderHome() {
    const s = state.site;
    const counts = Object.fromEntries(state.categories.map(x => [x.category, Number(x.count)]));
    const categoryCards = Object.keys(CATEGORY).filter(key => counts[key] > 0).map(key => `<a href="/#inventory" class="category-card filter-category" data-category="${key}"><b>${CATEGORY[key]}</b><span>${counts[key]} sản phẩm đang hiển thị</span><i>${key.includes('electric') ? '⚡' : '🏍️'}</i></a>`).join('');
    // Hiển thị tất cả chương trình đang bật. Khi có nhiều chương trình, phần khuyến mại
    // sẽ thành carousel tự chạy; khách vẫn có thể vuốt, bấm mũi tên và chọn chấm điều hướng.
    const promotions = state.promotions
      .filter(item => Number(item.active ?? 1) !== 0)
      .filter(item => item.title || item.content || item.image_url);
    if (!promotions.length && (s.promo_title || s.promo_text || s.promo_image)) {
      promotions.push({ title:s.promo_title, content:s.promo_text, image_url:s.promo_image, active:1 });
    }
    const promoSlides = promotions.map((promo, index) => `
      <article class="promo-slide" data-promo-index="${index}">
        <div class="promo-slide-media">
          <img src="${escapeHTML(promo.image_url || '/assets/tam-an-promo.jpg')}" alt="${escapeHTML(promo.title || 'Chương trình khuyến mại')}" loading="lazy">
          <span class="promo-slide-number">${String(index + 1).padStart(2, '0')}</span>
        </div>
        <div class="promo-slide-copy">
          <span class="promo-slide-kicker">Ưu đãi đang diễn ra</span>
          <h3>${escapeHTML(promo.title || 'Chương trình ưu đãi')}</h3>
          ${promo.content ? `<p>${escapeHTML(promo.content)}</p>` : '<p>Liên hệ Tâm An để nhận thông tin ưu đãi và quà tặng hiện hành.</p>'}
          <button class="promo-consult-btn" type="button" data-promo-lead="${escapeHTML(promo.title || 'Khuyến mại')}">Nhận tư vấn ưu đãi <span>→</span></button>
        </div>
      </article>`).join('');
    app.className = '';
    app.innerHTML = `${nav()}<main>
      <section class="hero hero-slider"><div class="hero-slides" aria-hidden="true">${heroImages(s).map((url, index) => `<div class="hero-slide ${index === 0 ? 'is-active' : ''}" style="background-image:url('${escapeHTML(url)}')"></div>`).join('')}</div><div class="container hero-inner"><div class="hero-copy"><div class="eyebrow">${escapeHTML(s.brand_name)}</div><h1>${multiline(s.hero_title || 'Chọn xe ưng ý.\nLên đường an tâm.')}</h1><p>${escapeHTML(s.hero_subtitle || '')}</p><div class="hero-actions"><a class="btn btn-primary" href="/#inventory">Xem xe đang có</a><a class="btn btn-light" href="/tra-gop">Tư vấn trả góp</a></div></div></div>${heroImages(s).length > 1 ? `<div class="hero-slider-ui"><div class="hero-slider-arrows"><button id="heroPrev" class="hero-arrow" type="button" aria-label="Ảnh Hero trước">←</button><button id="heroNext" class="hero-arrow" type="button" aria-label="Ảnh Hero tiếp theo">→</button></div><div class="hero-dots">${heroImages(s).map((_, index) => `<button type="button" class="hero-dot ${index === 0 ? 'is-active' : ''}" data-hero-dot="${index}" aria-label="Xem ảnh Hero ${index + 1}"></button>`).join('')}</div></div>` : ''}</section>
      <div class="trust-strip"><div class="container"><div class="trust-grid"><div class="trust-item"><i class="trust-icon">✓</i><div><b>Thông tin rõ ràng</b><span>Giá hiển thị theo cài đặt cửa hàng.</span></div></div><div class="trust-item"><i class="trust-icon">✦</i><div><b>Hỗ trợ trả góp</b><span>Kiểm tra hồ sơ trước khi xác nhận.</span></div></div><div class="trust-item"><i class="trust-icon">⌁</i><div><b>Tình trạng cập nhật</b><span>Còn hàng, sắp về, đang giữ xe.</span></div></div><div class="trust-item"><i class="trust-icon">☎</i><div><b>Tư vấn nhanh</b><span>Gọi điện hoặc chat trực tiếp.</span></div></div></div></div></div>
      ${categoryCards ? `<section class="section"><div class="container"><div class="section-head"><div><div class="section-kicker">Khám phá kho xe</div><h2>Chọn đúng dòng xe bạn cần.</h2><p class="section-lead">Danh mục chỉ xuất hiện khi đang có sản phẩm.</p></div></div><div class="category-grid">${categoryCards}</div></div></section>` : ''}
      <section id="inventory" class="section section-soft"><div class="container"><div class="section-head"><div><div class="section-kicker">Kho xe Tâm An</div><h2>Xe đang có & xe sắp về.</h2><p class="section-lead">Gõ gần đúng tên xe, hãng hoặc màu xe để tìm nhanh.</p></div><div class="search-box">⌕<input id="searchInput" placeholder="Tìm tên xe, hãng, màu xe…"></div></div><div class="chips" id="categoryChips"><button class="chip active" data-category="">Tất cả xe</button>${Object.keys(CATEGORY).filter(key => counts[key] > 0).map(key => `<button class="chip" data-category="${key}">${CATEGORY[key]}</button>`).join('')}</div><div class="section-head" style="margin-top:18px"><p class="section-lead" id="productCount">${state.products.length} xe phù hợp</p><div class="slider-controls"><button class="icon-btn" id="slideLeft">←</button><button class="icon-btn" id="slideRight">→</button></div></div><div id="productRow" class="product-row">${state.products.map(card).join('') || '<div class="admin-empty">Kho xe đang được cập nhật.</div>'}</div></div></section>
      ${promoSlides ? `<section id="promo" class="section promo-section"><div class="container"><div class="section-head promo-section-head"><div><div class="section-kicker">Chương trình ưu đãi</div><h2>Nhiều ưu đãi. Chọn đúng thời điểm.</h2><p class="section-lead">Vuốt để xem từng chương trình đang áp dụng tại Tâm An.</p></div>${promotions.length > 1 ? `<div class="promo-controls"><button id="promoPrev" class="icon-btn" type="button" aria-label="Khuyến mại trước">←</button><button id="promoNext" class="icon-btn" type="button" aria-label="Khuyến mại tiếp theo">→</button></div>` : ''}</div><div class="promo-carousel" aria-label="Các chương trình khuyến mại"><div id="promoTrack" class="promo-track">${promoSlides}</div></div>${promotions.length > 1 ? `<div id="promoDots" class="promo-dots" aria-label="Chọn chương trình">${promotions.map((_, index) => `<button type="button" class="promo-dot ${index === 0 ? 'is-active' : ''}" data-promo-dot="${index}" aria-label="Xem chương trình ${index + 1}"></button>`).join('')}</div>` : ''}</div></section>` : ''}
      ${state.accessories.length ? `<section id="accessories" class="section section-soft"><div class="container"><div class="section-head"><div><div class="section-kicker">Phụ tùng & phụ kiện</div><h2>Chọn thêm cho xe. Đi đường yên tâm hơn.</h2></div></div><div class="accessory-grid">${state.accessories.map(a => `<article class="accessory"><img src="${escapeHTML(a.image_url || '/assets/logo.jpg')}" alt="${escapeHTML(a.name)}"><div class="accessory-body"><h3>${escapeHTML(a.name)}</h3>${a.price ? `<b class="price">${money(a.price)}</b>` : '<b class="price-hidden">Liên hệ</b>'}${a.description ? `<p class="muted">${escapeHTML(a.description)}</p>` : ''}</div></article>`).join('')}</div></div></section>` : ''}
      <section class="section"><div class="container delivery"><div class="delivery-img" style="background-image:url('${escapeHTML(s.delivery_image || s.showroom_image || '/assets/showroom.jpg')}')"></div><div class="delivery-copy"><div class="section-kicker">Dịch vụ Tâm An</div><h2>${escapeHTML(s.delivery_title || 'Hỗ trợ giao xe tận nơi')}</h2><p>${escapeHTML(s.delivery_text || '')}</p><button class="btn btn-primary lead-button" data-name="Giao xe tận nơi">Đăng ký tư vấn giao xe</button></div></div></section>
      <section id="showroom" class="section section-soft"><div class="container showroom-grid"><div class="showroom-photo"><img src="${escapeHTML(s.showroom_image || '/assets/showroom.jpg')}" alt="Showroom"></div><div class="showroom-info"><div class="section-kicker">Đến showroom</div><h2>Ghé Tâm An, xem xe thật.</h2><div class="info-list"><div class="info-item"><b>Địa chỉ</b><span>${escapeHTML(s.address || '')}</span></div><div class="info-item"><b>Hotline</b><span>${escapeHTML(s.hotline || '')}</span></div><div class="info-item"><b>Giờ làm việc</b><span>${escapeHTML(s.business_hours || '')}</span></div></div><iframe class="map-frame" src="${escapeHTML(s.map_embed_url || '')}" loading="lazy"></iframe></div></div></section>
    </main>${footer()}${noticeTicker()}${floatingButtons()}`;
    bindHomeEvents();
    bindHeroSlider();
    bindPromotionCarousel();
    bindNoticeTicker();
    bindHomeAnchorLinks();
    scrollToCurrentHash('auto');
  }

  function floatingButtons() {
    const s = state.site;
    const callHref = `tel:${String(s.hotline || '').replace(/\s/g, '')}`;
    const pulse = s.floating_primary_action || 'call';
    const pulseOn = s.floating_pulse_enabled !== false;
    const pulseClass = type => pulseOn && pulse === type ? `is-pulsing pulse-${s.floating_pulse_speed || 'normal'}` : '';
    const enabled = key => s[key] !== false;
    const button = (type, className, href, label, fallback, external = true) => {
      const cfg = contactButtonStyle(type);
      const tag = external ? 'a' : 'button';
      const attrs = external ? `href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer"` : `type="button"`;
      return `<${tag} class="float-btn ${className} ${pulseClass(type)} shape-${cfg.shape}" style="${cfg.style}" ${attrs} aria-label="${escapeHTML(label)}" title="${escapeHTML(label)}">${contactIcon(type, fallback)}<span class="sr-only">${escapeHTML(label)}</span></${tag}>`;
    };
    const normal = [];
    if (enabled('floating_show_zalo') && s.zalo_url) normal.push(button('zalo','float-zalo',s.zalo_url,'Nhắn Zalo','zalo'));
    if (enabled('floating_show_messenger') && s.messenger_url) normal.push(button('messenger','float-messenger',s.messenger_url,'Nhắn Messenger','messenger'));
    if (enabled('floating_show_facebook') && s.facebook_url) normal.push(button('facebook','float-facebook',s.facebook_url,'Facebook','facebook'));
    if (enabled('floating_show_tiktok') && s.tiktok_url) normal.push(button('tiktok','float-tiktok',s.tiktok_url,'TikTok','tiktok'));
    const callCfg = contactButtonStyle('call');
    const chatCfg = contactButtonStyle('chat');
    return `<div class="floating" aria-label="Liên hệ nhanh">
      <a class="float-btn float-call ${pulseClass('call')} shape-${callCfg.shape}" style="${callCfg.style}" href="${escapeHTML(callHref)}" aria-label="Gọi ${escapeHTML(s.hotline || '')}" title="Gọi ngay">${contactIcon('call','phone')}<span class="float-label">${escapeHTML(s.floating_call_label || 'Gọi ngay')}</span></a>
      ${normal.join('')}
      <button class="float-btn float-top" id="backTop" aria-label="Lên đầu trang" title="Lên đầu trang">${socialIcon('top')}</button>
    </div>
    ${enabled('floating_show_chat') ? `<button id="chatOpen" class="chat-launch ${pulseClass('chat')} shape-${chatCfg.shape}" style="${chatCfg.style}" aria-label="Chat trực tuyến" title="Chat trực tuyến">${contactIcon('chat','chat')}<span class="chat-launch-text">${escapeHTML(s.floating_chat_label || 'Tư vấn')}</span></button>` : ''}<div id="chatPanel" class="chat-panel"></div>`;
  }

  function bindPromotionCarousel() {
    const track = $('#promoTrack');
    if (!track) return;
    const slides = $$('.promo-slide', track);
    const dots = $$('.promo-dot');
    const setActive = index => {
      dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === index));
    };
    const nearestIndex = () => {
      const current = track.scrollLeft;
      let bestIndex = 0;
      let bestDistance = Infinity;
      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetLeft - current);
        if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
      });
      return bestIndex;
    };
    const moveTo = index => {
      if (!slides.length) return;
      const target = (index + slides.length) % slides.length;
      track.scrollTo({ left: slides[target].offsetLeft, behavior:'smooth' });
      setActive(target);
    };
    let index = 0;
    let timer = null;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      stop();
      if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(() => { index = (nearestIndex() + 1) % slides.length; moveTo(index); }, 4800);
    };
    $('#promoPrev')?.addEventListener('click', () => { index = (nearestIndex() - 1 + slides.length) % slides.length; moveTo(index); start(); });
    $('#promoNext')?.addEventListener('click', () => { index = (nearestIndex() + 1) % slides.length; moveTo(index); start(); });
    dots.forEach(dot => dot.addEventListener('click', () => { index = Number(dot.dataset.promoDot); moveTo(index); start(); }));
    $$('.promo-consult-btn').forEach(button => button.addEventListener('click', () => openLeadModal({ name:button.dataset.promoLead || 'Khuyến mại' })));
    let scrollTimer;
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => { index = nearestIndex(); setActive(index); }, 90);
    }, { passive:true });
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);
    track.addEventListener('touchstart', stop, { passive:true });
    track.addEventListener('touchend', start, { passive:true });
    start();
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
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `<div class="modal-card product-modal-card"><button class="modal-close">×</button><div class="product-modal"><div class="gallery"><div class="gallery-main"><img id="galleryImage" alt="${escapeHTML(product.name)}"></div><div id="thumbs" class="thumb-row"></div><div id="versionChoices" class="version-choices"></div><div id="colorChoices" class="gallery-colors"></div></div><div class="product-content"><span class="status-badge" style="position:static;display:inline-block">${statusName(product.status)}</span><div class="product-meta" style="margin-top:12px">${escapeHTML(product.brand || 'TÂM AN')} • ${escapeHTML(categoryLabel(product.category))}</div><div class="product-title-row"><h2>${escapeHTML(product.name)}</h2><button type="button" id="copyProductShare" class="share-product-btn" title="Sao chép link có ảnh xem trước">↗ Chia sẻ</button></div><div id="selectedVersionInfo" class="selected-version-info"></div><div id="selectedColorStock" class="selected-color-stock"></div><div id="dynamicPrice" class="price-line"></div><section class="product-description"><div class="product-description-head"><span>THÔNG TIN XE</span><h3>Mô tả & thông số chi tiết</h3></div><div class="product-description-body">${descriptionHTML(product.description)}</div><button type="button" id="openDescriptionReader" class="description-reader-btn">Đọc toàn bộ mô tả & thông số <span>→</span></button></section><div class="detail-grid"><div class="detail-item"><small>Năm sản xuất</small><b>${product.year || '—'}</b></div><div class="detail-item"><small>Số km</small><b>${product.mileage === null || product.mileage === undefined ? '—' : `${Number(product.mileage).toLocaleString('vi-VN')} km`}</b></div><div class="detail-item"><small>Động cơ</small><b>${escapeHTML(product.engine || '—')}</b></div><div class="detail-item"><small>Giấy tờ</small><b>${escapeHTML(product.documents || '—')}</b></div></div>${product.installment_from || product.bad_debt_from ? `<div class="finance-box"><b>Hỗ trợ trả góp</b><div>${product.installment_from ? `Trả trước tham khảo từ ${money(product.installment_from)}. ` : ''}${product.bad_debt_from ? `Thông tin hỗ trợ hồ sơ từ ${money(product.bad_debt_from)}.` : ''}</div><small>Thông tin tham khảo, Tâm An kiểm tra hồ sơ trước khi xác nhận.</small></div>` : ''}<div class="consult-box"><h3>Để lại thông tin tư vấn</h3><p class="muted">Nhân viên Tâm An sẽ liên hệ theo số điện thoại của bạn.</p><form id="detailLead" class="form-grid"><input type="hidden" name="product_id" value="${product.id}"><div class="field"><label>Họ và tên *</label><input name="name" required></div><div class="field"><label>Số điện thoại *</label><input name="phone" required inputmode="tel"></div>${paymentIntentFields(product.installment_from)}<div class="field full"><label>Ghi chú</label><textarea name="note" placeholder="Muốn xem xe, giữ xe hoặc hỏi trả góp…"></textarea></div><div class="field full"><button class="btn btn-primary">Gửi yêu cầu tư vấn</button></div></form></div></div></div>${data.related?.length ? `<div class="related"><div class="section-kicker">Gợi ý thêm</div><h2 style="font-size:34px">Xe tương tự</h2><div class="product-row">${data.related.map(card).join('')}</div></div>` : ''}</div>`;
      document.body.appendChild(modal); document.body.classList.add('modal-open');
      const close = bindOverlayDismissal(modal);
      const hasVersions = Array.isArray(product.versions) && product.versions.length;
      let versionIndex = hasVersions ? 0 : -1;
      let colorIndex = 0;
      let gallery = [];
      const getVersion = () => versionIndex >= 0 ? product.versions[versionIndex] : null;
      const getColors = () => getVersion()?.colors?.length ? getVersion().colors : (product.colors || []);
      const selectedColor = () => getColors()[colorIndex] || null;
      const priceBlock = () => {
        const version = getVersion(); const price = version?.price ?? product.price; const old = version?.old_price ?? product.old_price;
        return price ? `<span class="price">${money(price)}</span>${old ? `<span class="old-price">${money(old)}</span>` : ''}` : '<span class="price-hidden">Liên hệ nhận giá</span>';
      };
      const draw = () => {
        const version = getVersion(); const colors = getColors();
        if (colorIndex >= colors.length) colorIndex = 0;
        const color = selectedColor();
        gallery = color?.images?.length ? color.images : (product.images?.length ? product.images : [productImage(product)]);
        $('#galleryImage', modal).src = gallery[0] || productImage(product);
        $('#dynamicPrice', modal).innerHTML = priceBlock();
        $('#selectedVersionInfo', modal).innerHTML = version ? `<b>${escapeHTML(version.name)}</b>${version.description ? `<small>${escapeHTML(version.description)}</small>` : ''}` : '';
        $('#selectedColorStock', modal).innerHTML = color ? `<span class="selected-color-label">${escapeHTML(color.name || 'Phối màu')}</span><span class="stock-pill ${colorStockClass(color)}">${escapeHTML(colorStockText(color))}</span>` : '';
        $('#versionChoices', modal).innerHTML = hasVersions ? `<div class="choice-label">Chọn phiên bản</div><div class="choice-row">${product.versions.map((v, index) => `<button type="button" class="version-choice ${index === versionIndex ? 'active' : ''}" data-index="${index}">${escapeHTML(v.name)}</button>`).join('')}</div>` : '';
        $('#colorChoices', modal).innerHTML = colors.length ? `<div class="choice-label">Phối màu${version?.name ? ` · Bản ${escapeHTML(version.name)}` : ''}<small>${colors.length} lựa chọn · tồn kho theo từng màu</small></div><div class="choice-row color-choice-row">${colors.map((color, index) => `<button type="button" class="color-choice ${colorStockClass(color)} ${index === colorIndex ? 'active' : ''}" data-index="${index}" title="${escapeHTML(`${color.name} — ${colorStockText(color)}`)}">${paletteStrip(color, 'color-choice-strip')}<span class="color-choice-copy"><b>${escapeHTML(color.name)}</b><small>${escapeHTML(colorStockText(color))}</small></span></button>`).join('')}</div>` : '<div class="color-empty">Phiên bản này chưa cập nhật phối màu.</div>';
        $('#thumbs', modal).innerHTML = gallery.map((url, index) => `<button class="thumb ${index === 0 ? 'active' : ''}" data-url="${escapeHTML(url)}"><img src="${escapeHTML(url)}" alt=""></button>`).join('');
        $$('#versionChoices .version-choice', modal).forEach(button => button.onclick = () => { versionIndex = Number(button.dataset.index); colorIndex = 0; draw(); });
        $$('#colorChoices .color-choice', modal).forEach(button => button.onclick = () => { colorIndex = Number(button.dataset.index); draw(); });
        $$('#thumbs .thumb', modal).forEach(btn => btn.onclick = () => { $('#galleryImage', modal).src = btn.dataset.url; $$('#thumbs .thumb', modal).forEach(x => x.classList.toggle('active', x === btn)); });
      };
      draw();
      $('#openDescriptionReader', modal)?.addEventListener('click', () => openDescriptionReader(product));
      $('#copyProductShare', modal)?.addEventListener('click', async () => { const link = `${location.origin}/xe/${encodeURIComponent(product.slug)}`; try { await navigator.clipboard.writeText(link); notify('Đã sao chép link xe. Khi gửi link sẽ hiện ảnh và thông tin xe.'); } catch { window.prompt('Sao chép link xe:', link); } });
      $('.gallery-main', modal).onclick = () => openLightbox(gallery, $('#galleryImage', modal).src);
      const detailLeadForm = $('#detailLead', modal);
      bindPaymentIntent(detailLeadForm);
      detailLeadForm.onsubmit = async event => {
        event.preventDefault(); const form = new FormData(event.target); const version = getVersion(); const color = selectedColor();
        const chosen = [version?.name ? `Phiên bản: ${version.name}` : '', color?.name ? `Phối màu: ${color.name}` : ''].filter(Boolean).join(' • ');
        const note = [chosen, form.get('note') || ''].filter(Boolean).join('\n');
        try { await request('/api/leads', { method:'POST', body:{ type:'product_consultation', product_id:Number(form.get('product_id')), name:form.get('name'), phone:form.get('phone'), note, ...paymentLeadPayload(form), location_text:await captureOptInLocation(event.target) } }); trackEvent('Lead', { content_name: product.name, content_category: product.category }); notify('Tâm An đã nhận thông tin và sẽ liên hệ sớm.'); event.target.reset(); $('[name="payment_plan"]', event.target)?.dispatchEvent(new Event('change')); }
        catch (error) { notify(error.message); }
      };
      bindProductEvents();
    } catch (error) { notify(error.message); }
  }

  function openDescriptionReader(product) {
    const reader = document.createElement('div');
    reader.className = 'modal description-reader-modal';
    reader.innerHTML = `<div class="modal-card description-reader-card"><button class="modal-close">×</button><article><div class="product-meta">${escapeHTML(product.brand || 'TÂM AN')} • ${escapeHTML(product.name || '')}</div><h2>Mô tả & thông số chi tiết</h2><div class="description-reader-content">${descriptionHTML(product.description)}</div></article></div>`;
    document.body.appendChild(reader);
    document.body.classList.add('modal-open');
    bindOverlayDismissal(reader);
  }

  function openLightbox(images, current) {
    let index = Math.max(0, images.indexOf(current));
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = `<button class="lb-close">×</button><button class="lb-prev">‹</button><img src="${escapeHTML(images[index] || current)}" alt=""><button class="lb-next">›</button>`;
    document.body.appendChild(box); document.body.classList.add('modal-open');
    const paint = () => $('img', box).src = images[index] || current;
    bindOverlayDismissal(box, '.lb-close');
    $('.lb-prev', box).onclick = () => { index = (index - 1 + images.length) % images.length; paint(); };
    $('.lb-next', box).onclick = () => { index = (index + 1) % images.length; paint(); };
  }

  function openLeadModal(info = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-card" style="width:min(560px,100%)"><button class="modal-close">×</button><div class="policy-modal"><div class="section-kicker">Tư vấn Tâm An</div><h2>Để lại thông tin.</h2><p class="muted">${escapeHTML(info.name || 'Tâm An sẽ gọi lại để tư vấn nhanh nhất.')}</p><form id="quickLead" class="form-grid"><div class="field"><label>Họ và tên *</label><input name="name" required></div><div class="field"><label>Số điện thoại *</label><input name="phone" required inputmode="tel"></div>${paymentIntentFields()}<div class="field full"><label>Nhu cầu</label><textarea name="note"></textarea></div><div class="field full"><button class="btn btn-primary">Gửi yêu cầu</button></div></form></div></div>`;
    document.body.appendChild(modal); document.body.classList.add('modal-open');
    const close = bindOverlayDismissal(modal);
    const quickLeadForm = $('#quickLead', modal);
    bindPaymentIntent(quickLeadForm);
    quickLeadForm.onsubmit = async event => {
      event.preventDefault(); const form = new FormData(event.target);
      try { await request('/api/leads', { method:'POST', body:{ type:info.name || 'consultation', product_id:Number(info.id) || null, name:form.get('name'), phone:form.get('phone'), note:form.get('note'), ...paymentLeadPayload(form), location_text:await captureOptInLocation(event.target) } }); trackEvent('Lead', { content_name: info.name || 'consultation' }); notify('Đã gửi yêu cầu thành công.'); close(); }
      catch (error) { notify(error.message); }
    };
  }

  async function openPolicy(slug) {
    try {
      const data = await request(`/api/policies/${encodeURIComponent(slug)}`);
      const modal = document.createElement('div'); modal.className = 'modal';
      modal.innerHTML = `<div class="modal-card" style="width:min(760px,100%)"><button class="modal-close">×</button><article class="policy-modal"><div class="section-kicker">Chính sách Tâm An</div><h2>${escapeHTML(data.policy.title)}</h2><div class="policy-content">${escapeHTML(data.policy.content)}</div></article></div>`;
      document.body.appendChild(modal); document.body.classList.add('modal-open');
      bindOverlayDismissal(modal);
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
    financeLeadForm.onsubmit = async event => { event.preventDefault(); const form = new FormData(event.target); try { await request('/api/leads', { method:'POST', body:{ type:'installment', name:form.get('name'), phone:form.get('phone'), note:form.get('note'), ...paymentLeadPayload(form), location_text:await captureOptInLocation(event.target) } }); trackEvent('Lead', { content_name: 'installment' }); notify('Đã gửi yêu cầu. Tâm An sẽ liên hệ sớm.'); event.target.reset(); $('[name="payment_plan"]', event.target)?.dispatchEvent(new Event('change')); } catch (error) { notify(error.message); } };
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
    const closeChat = () => {
      panel.classList.remove('show');
      panel.setAttribute('aria-hidden', 'true');
    };
    $('#chatOpen')?.addEventListener('click', async () => {
      panel.classList.add('show');
      panel.setAttribute('aria-hidden', 'false');
      await ensureConversation();
      refreshChat();
    });
    // Delegation makes the close action resilient when the chat panel is re-rendered.
    panel.addEventListener('click', event => {
      if (event.target.closest('#chatClose')) { event.preventDefault(); event.stopPropagation(); closeChat(); }
    });
    panel.addEventListener('pointerup', event => {
      if (event.target.closest('#chatClose')) { event.preventDefault(); event.stopPropagation(); closeChat(); }
    });
    if (!state.chatEscapeBound) {
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') $('#chatPanel')?.classList.remove('show');
      });
      state.chatEscapeBound = true;
    }
    $('#chatStart')?.addEventListener('click', async () => {
      const name = $('#visitorName').value.trim(); if (!name) return notify('Nhập tên của bạn trước nhé.');
      try { await request('/api/chat/start', { method:'POST', body:{ visitor_key:state.visitorKey, visitor_name:name } }); localStorage.setItem('ta_visitor_name', name); $('#chatNameBox').classList.add('hidden'); refreshChat(); }
      catch (error) { notify(error.message); }
    });
    $('#chatForm')?.addEventListener('submit', event => {
      event.preventDefault(); const input = $('input', event.target); const body = input.value.trim(); if (!body) return;
      // Hiển thị tin nhắn ngay lập tức; AI/nhân viên phản hồi chạy nền để nút Gửi không bị delay.
      const box = $('#chatBody');
      const optimistic = document.createElement('div');
      optimistic.className = 'chat-msg visitor optimistic';
      optimistic.innerHTML = `<small>Bạn</small>${escapeHTML(body)}`;
      box?.appendChild(optimistic); if (box) box.scrollTop = box.scrollHeight;
      input.value = '';
      request('/api/chat/messages', { method:'POST', body:{ visitor_key:state.visitorKey, body } })
        .then(out => { optimistic.remove(); refreshChat(true); if (out.ai?.status === 'unavailable') notify('Tâm An AI đang chưa sẵn sàng. Nhân viên sẽ hỗ trợ bạn sớm.'); })
        .catch(error => { optimistic.classList.add('failed'); notify(error.message); });
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
    const groups = [
      { title:'Vận hành', items:[['overview','Tổng quan'],['products','Kho xe'],['leads','Form khách'],['chats','Chat trực tuyến'],['accessories','Phụ kiện']] }
    ];
    if (state.admin.role === 'admin') groups.push(
      { title:'Nội dung & giao diện', items:[['promotions','Khuyến mại'],['site','Giao diện & nội dung'],['contacts','Liên hệ & nút nổi'],['notices','Thông báo nổi bật'],['policies','Chính sách']] },
      { title:'Quảng cáo & AI', items:[['marketing_ai','Pixel & Chatbot AI'],['analytics','Lượt truy cập']] },
      { title:'Hệ thống', items:[['users','Nhân viên'],['logs','Nhật ký hệ thống']] }
    );
    return groups;
  }
  function renderAdminShell() {
    app.className = 'admin-wrap';
    const nav = adminTabs().map((group, groupIndex) => `<div class="admin-nav-group"><span>${escapeHTML(group.title)}</span>${group.items.map(([id, label], index) => `<button data-tab="${id}" class="${groupIndex === 0 && index === 0 ? 'active' : ''}">${escapeHTML(label)}${id === 'leads' ? '<i class="admin-live-badge" data-activity="leads" hidden></i>' : ''}${id === 'chats' ? '<i class="admin-live-badge" data-activity="chats" hidden></i>' : ''}</button>`).join('')}</div>`).join('');
    app.innerHTML = `<header class="admin-header"><div class="container admin-header-inner"><a href="/" class="admin-brand"><img src="${escapeHTML(state.site.logo_url || '/assets/logo.jpg')}" alt=""><span>TÂM AN<small>KHU VỰC NỘI BỘ</small></span></a><div class="admin-user"><span>${escapeHTML(state.admin.name)} <em>${state.admin.role === 'admin' ? 'Chủ cửa hàng' : 'Nhân viên'}</em></span><button id="logoutButton" class="small-btn">Đăng xuất</button></div></div></header><div class="admin-shell"><aside class="admin-side"><div class="admin-side-title">Bảng điều khiển</div>${nav}</aside><main id="adminMain" class="admin-main"></main></div>`;
    $$('[data-tab]').forEach(button => button.onclick = () => { $$('[data-tab]').forEach(x => x.classList.remove('active')); button.classList.add('active'); loadAdminTab(button.dataset.tab); });
    const updateActivity = async () => {
      try {
        const activity = await request('/api/admin/activity');
        const leadBadge = $('[data-activity="leads"]'); const chatBadge = $('[data-activity="chats"]');
        if (leadBadge) { leadBadge.hidden = !activity.new_leads; leadBadge.textContent = activity.new_leads > 99 ? '99+' : String(activity.new_leads || ''); }
        if (chatBadge) { chatBadge.hidden = !activity.open_chats; chatBadge.textContent = activity.open_chats > 99 ? '99+' : String(activity.open_chats || ''); }
      } catch {}
    };
    updateActivity(); clearInterval(window.__tamAnAdminActivityTimer); window.__tamAnAdminActivityTimer = setInterval(updateActivity, 8000);
    $('#logoutButton').onclick = async () => { clearInterval(window.__tamAnAdminActivityTimer); await request('/api/admin/logout', { method:'POST' }); state.admin = null; renderLogin(); };
    loadAdminTab('overview');
  }
  async function loadAdminTab(tab) {
    clearInterval(window.__tamAnAdminLeadTimer);
    if (tab !== 'chats') clearInterval(window.__tamAnAdminChatTimer);
    const main = $('#adminMain'); main.innerHTML = '<div class="admin-empty">Đang tải…</div>';
    try {
      if (tab === 'overview') return adminOverview(main);
      if (tab === 'products') return adminProducts(main);
      if (tab === 'promotions') return adminPromotions(main);
      if (tab === 'accessories') return adminAccessories(main);
      if (tab === 'site') return adminSite(main);
      if (tab === 'contacts') return adminContacts(main);
      if (tab === 'notices') return adminNotices(main);
      if (tab === 'marketing_ai') return adminMarketingAi(main);
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
    main.innerHTML = `<div class="admin-toolbar"><div><h1 class="admin-title">Kho xe</h1><p class="admin-sub">4 nhóm: xe máy mới, xe máy cũ, xe điện mới, xe điện cũ.</p></div><button id="addProduct" class="btn btn-primary">+ Thêm xe</button></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Ảnh</th><th>Tên xe</th><th>Nhóm</th><th>Tồn theo màu</th><th>Trạng thái</th><th>Giá</th><th></th></tr></thead><tbody>${data.products.map(p => `<tr><td><img src="${escapeHTML(productImage(p))}"></td><td><b>${escapeHTML(p.name)}</b><br><span class="muted">${escapeHTML(p.brand || '')}</span></td><td>${escapeHTML(categoryLabel(p.category))}</td><td>${inventorySummary(p)}</td><td>${statusName(p.status)}</td><td>${p.price ? money(p.price) : 'Liên hệ'}</td><td><button class="small-btn edit-product" data-id="${p.id}">Sửa</button>${state.admin.role === 'admin' ? `<button class="small-btn danger delete-product" data-id="${p.id}">Xoá</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="7" class="admin-empty">Chưa có sản phẩm.</td></tr>'}</tbody></table></div></div>`;
    $('#addProduct').onclick = () => openProductEditor();
    $$('.edit-product').forEach(button => button.onclick = () => openProductEditor(data.products.find(p => p.id === Number(button.dataset.id))));
    $$('.delete-product').forEach(button => button.onclick = async () => { if (!confirm('Xoá sản phẩm này?')) return; try { await request(`/api/admin/products/${button.dataset.id}`, { method:'DELETE' }); notify('Đã xoá sản phẩm'); adminProducts(main); } catch (error) { notify(error.message); } });
  }

  function adminModal(title, content) {
    const modal = document.createElement('div'); modal.className = 'modal';
    modal.innerHTML = `<div class="modal-card" style="width:min(1040px,100%)"><button class="modal-close">×</button><div class="policy-modal"><div class="section-kicker">Quản trị</div><h2>${escapeHTML(title)}</h2>${content}</div></div>`;
    document.body.appendChild(modal); document.body.classList.add('modal-open');
    bindOverlayDismissal(modal);
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
    const modal = adminModal(product ? 'Sửa sản phẩm' : 'Thêm sản phẩm', `<form id="productForm" class="admin-product-form"><fieldset class="fieldset"><legend>Thông tin xe</legend><div class="form-three"><div class="field"><label>Tên xe *</label><input name="name" required value="${escapeHTML(p.name || '')}"></div><div class="field"><label>Hãng</label><input name="brand" value="${escapeHTML(p.brand || 'Honda')}"></div><div class="field"><label>Nhóm xe</label><select name="category">${categoryDefinitions().map(({id:key, label}) => `<option value="${key}" ${p.category === key ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('')}</select></div><div class="field"><label>Trạng thái</label><select name="status">${['in_stock','incoming','reserved','sold'].map(key => `<option value="${key}" ${p.status === key ? 'selected' : ''}>${statusName(key)}</option>`).join('')}</select></div><div class="field"><label>Giá chung (không bắt buộc)</label><input name="price" class="vnd-input" inputmode="numeric" value="${formatVndInput(p.price)}" placeholder="Ví dụ: 35.900.000"></div><div class="field"><label>Giá cũ chung</label><input name="old_price" class="vnd-input" inputmode="numeric" value="${formatVndInput(p.old_price)}" placeholder="Ví dụ: 38.900.000"></div><div class="field"><label>Năm sản xuất</label><input name="year" type="number" value="${p.year ?? ''}"></div><div class="field"><label>Số km</label><input name="mileage" type="number" value="${p.mileage ?? ''}"></div><div class="field"><label>Động cơ</label><input name="engine" value="${escapeHTML(p.engine || '')}"></div><div class="field"><label>Trả trước từ</label><input name="installment_from" class="vnd-input" inputmode="numeric" value="${formatVndInput(p.installment_from)}" placeholder="Ví dụ: 5.000.000"></div><div class="field"><label>Hỗ trợ hồ sơ từ</label><input name="bad_debt_from" class="vnd-input" inputmode="numeric" value="${formatVndInput(p.bad_debt_from)}" placeholder="Ví dụ: 8.000.000"></div><div class="field"><label>Giấy tờ</label><input name="documents" value="${escapeHTML(p.documents || '')}"></div></div><div class="field"><label>Mô tả chi tiết</label><div class="rich-editor"><div class="rich-toolbar" role="toolbar" aria-label="Định dạng mô tả"><button type="button" data-command="bold" title="In đậm"><b>B</b></button><button type="button" data-command="italic" title="In nghiêng"><i>I</i></button><button type="button" data-command="underline" title="Gạch chân"><u>U</u></button><span class="toolbar-sep"></span><button type="button" data-command="formatBlock" data-value="H3" title="Tiêu đề">Tt</button><button type="button" data-command="insertUnorderedList" title="Danh sách chấm">•≡</button><button type="button" data-command="insertOrderedList" title="Danh sách số">1≡</button><span class="toolbar-sep"></span><button type="button" data-command="justifyLeft" title="Căn trái">≡</button><button type="button" data-command="justifyCenter" title="Căn giữa">≡</button><select class="rich-font-picker" title="Font chữ"><option value="Be Vietnam Pro">Be Vietnam Pro</option><option value="Arial">Arial</option><option value="Tahoma">Tahoma</option><option value="Times New Roman">Times New Roman</option><option value="Georgia">Georgia</option><option value="Montserrat">Montserrat</option><option value="Manrope">Manrope</option></select><select class="rich-size-picker" title="Cỡ chữ"><option value="2">Nhỏ</option><option value="3" selected>Vừa</option><option value="4">Lớn</option><option value="5">Rất lớn</option></select><input class="rich-color-picker" type="color" value="#1b1214" title="Màu chữ"></div><div id="descriptionEditor" class="rich-editor-area" contenteditable="true" role="textbox" aria-multiline="true">${editorInitialHTML(p.description || '')}</div><textarea id="descriptionValue" name="description" hidden></textarea></div><small class="field-help">Dùng thanh công cụ như Word. Xuống dòng, tiêu đề, danh sách, in đậm/nghiêng sẽ được giữ nguyên ngoài website.</small></div><div class="check-row"><label><input type="checkbox" name="featured" ${p.featured ? 'checked' : ''}> Xe nổi bật</label><label><input type="checkbox" name="published" ${p.published !== 0 ? 'checked' : ''}> Hiển thị ngoài website</label></div></fieldset><fieldset class="fieldset"><legend>Ảnh chung của mẫu xe</legend><p class="muted">Ảnh này dùng khi mẫu xe chưa có phiên bản/màu riêng.</p><input id="productImagesInput" type="file" accept="image/*" multiple><div id="productImages" class="thumb-row"></div></fieldset><fieldset class="fieldset"><legend>Phiên bản → phối màu → album ảnh</legend><p class="muted"><b>Ví dụ đúng:</b> Air Blade → <b>Sport</b> → <b>Trắng Đỏ Đen</b> (3 ô màu), <b>Xám Đỏ Đen</b>; <b>Tiêu chuẩn</b> → Trắng, Đen. Mỗi phối màu là một lựa chọn hoàn chỉnh có album ảnh riêng.</p><div id="versionRows"></div><button id="addVersion" type="button" class="small-btn">+ Thêm phiên bản</button></fieldset><fieldset class="fieldset"><legend>Phối màu chung (chỉ dùng khi xe không phân phiên bản)</legend><p class="muted">Nếu xe đã có phiên bản, hãy khai báo phối màu trong từng phiên bản phía trên. Phần này dành cho xe chỉ có một bản.</p><div id="generalColorRows"></div><button id="addGeneralColor" type="button" class="small-btn">+ Thêm phối màu chung</button></fieldset><button class="btn btn-primary">${product ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</button></form>`);
    const form = $('#productForm', modal);
    bindDescriptionEditor(modal);
    let images = [...(p.images || [])];
    let generalColors = (p.colors || []).map(colorClone);
    let versions = (p.versions || []).map(v => ({ name:v.name || '', price:v.price ?? '', old_price:v.old_price ?? '', description:v.description || '', colors:(v.colors || []).map(colorClone) }));
    const uploadMany = async files => { const out = []; for (const file of Array.from(files || [])) out.push(await uploadFile(file)); return out; };
    function renderImages() { $('#productImages', modal).innerHTML = images.map((url, index) => `<button type="button" class="thumb remove-image" data-index="${index}"><img src="${escapeHTML(url)}" alt=""><span>×</span></button>`).join(''); $$('.remove-image', modal).forEach(button => button.onclick = () => { images.splice(Number(button.dataset.index),1); renderImages(); }); }
    function colorBox(color, path, label) {
      const swatches = paletteOf(color);
      color.swatches = swatches;
      color.hex = swatches[0];
      return `<div class="nested-color-box"><div class="variant-head"><b>${label}</b><button type="button" class="small-btn danger remove-nested-color" data-path="${path}">Xoá phối màu</button></div><div class="form-three"><div class="field"><label>Tên phối màu</label><input class="nested-color-name" data-path="${path}" value="${escapeHTML(color.name)}" placeholder="Ví dụ: Trắng Đỏ Đen / Đen sần"></div><div class="field palette-field"><label>Phối màu trên xe</label><div class="palette-editor" data-path="${path}">${swatches.map((hex, index) => `<span class="palette-editor-chip"><input class="nested-swatch" data-path="${path}" data-index="${index}" type="color" value="${escapeHTML(hex)}" title="Ô màu ${index + 1}">${swatches.length > 1 ? `<button type="button" class="remove-swatch" data-path="${path}" data-index="${index}" title="Bỏ ô màu">×</button>` : ''}</span>`).join('')}${swatches.length < 3 ? `<button type="button" class="add-swatch" data-path="${path}">+ Thêm ô màu</button>` : ''}</div><small class="field-help">Chọn 1–3 ô liền nhau. Đây là một phối màu hoàn chỉnh, không phải ba màu chọn riêng.</small></div><div class="field"><label>Tình trạng màu</label><select class="nested-color-availability" data-path="${path}"><option value="in_stock" ${color.availability !== 'out_of_stock' && color.availability !== 'incoming' ? 'selected' : ''}>Còn hàng</option><option value="out_of_stock" ${color.availability === 'out_of_stock' ? 'selected' : ''}>Hết hàng</option><option value="incoming" ${color.availability === 'incoming' ? 'selected' : ''}>Sắp về</option></select></div><div class="field"><label>Số lượng tồn</label><input class="nested-color-stock" data-path="${path}" type="number" min="0" step="1" inputmode="numeric" value="${color.stock_quantity ?? ''}" placeholder="Để trống nếu không theo dõi"></div><div class="field"><label>Album ảnh của phối màu</label><input class="nested-color-upload" data-path="${path}" type="file" accept="image/*" multiple></div></div><div class="thumb-row">${(color.images || []).map((url,imageIndex) => `<button type="button" class="thumb remove-nested-image" data-path="${path}" data-image="${imageIndex}"><img src="${escapeHTML(url)}" alt=""><span>×</span></button>`).join('')}</div></div>`;
    }
    function atPath(path) { const [a,b] = path.split(':').map(Number); return b === undefined ? generalColors[a] : versions[a]?.colors?.[b]; }
    function removeAtPath(path) { const [a,b] = path.split(':').map(Number); if (b === undefined) generalColors.splice(a,1); else versions[a].colors.splice(b,1); }
    function renderGeneralColors() { $('#generalColorRows', modal).innerHTML = generalColors.map((color,index) => colorBox(color, String(index), `Phối màu chung ${index+1}`)).join('') || '<p class="muted">Chưa có màu chung.</p>'; bindColorInputs(); }
    function renderVersions() { $('#versionRows', modal).innerHTML = versions.map((version,versionIndex) => `<div class="version-editor"><div class="variant-head"><b>Phiên bản ${versionIndex+1}</b><button type="button" class="small-btn danger remove-version" data-index="${versionIndex}">Xoá phiên bản</button></div><div class="form-three"><div class="field"><label>Tên phiên bản *</label><input class="version-name" data-index="${versionIndex}" value="${escapeHTML(version.name)}" placeholder="Sport / Tiêu chuẩn / Đặc biệt"></div><div class="field"><label>Giá phiên bản</label><input class="version-price vnd-input" data-index="${versionIndex}" inputmode="numeric" value="${escapeHTML(formatVndInput(version.price))}" placeholder="Ví dụ: 56.500.000"></div><div class="field"><label>Giá cũ phiên bản</label><input class="version-old-price vnd-input" data-index="${versionIndex}" inputmode="numeric" value="${escapeHTML(formatVndInput(version.old_price))}" placeholder="Ví dụ: 59.500.000"></div></div><div class="field"><label>Mô tả phiên bản</label><input class="version-description" data-index="${versionIndex}" value="${escapeHTML(version.description)}" placeholder="Ví dụ: Mâm trước, phanh ABS, tem thể thao…"></div><div class="version-colors"><div class="version-colors-title"><b class="version-color-heading" data-version-title="${versionIndex}">Phối màu · Bản ${escapeHTML(version.name || `Phiên bản ${versionIndex+1}`)}</b><span>${version.colors.length} phối màu</span></div>${version.colors.map((color,colorIndex)=>colorBox(color, `${versionIndex}:${colorIndex}`, `Màu ${colorIndex+1}`)).join('') || '<p class="muted">Chưa thêm màu cho phiên bản này.</p>'}<button type="button" class="small-btn add-version-color" data-index="${versionIndex}">+ Thêm phối màu cho phiên bản này</button></div></div>`).join('') || '<p class="muted">Chưa thêm phiên bản. Xe sẽ sử dụng “Màu chung”.</p>';
      $$('.remove-version', modal).forEach(button => button.onclick = () => { versions.splice(Number(button.dataset.index),1); renderVersions(); });
      $$('.version-name', modal).forEach(input => input.oninput = () => { const index = Number(input.dataset.index); versions[index].name = input.value; const title = $(`.version-color-heading[data-version-title="${index}"]`, modal); if (title) title.textContent = `Phối màu · Bản ${input.value || `Phiên bản ${index + 1}`}`; });
      $$('.version-price', modal).forEach(input => input.oninput = () => { versions[Number(input.dataset.index)].price = input.value; });
      $$('.version-old-price', modal).forEach(input => input.oninput = () => { versions[Number(input.dataset.index)].old_price = input.value; });
      $$('.version-description', modal).forEach(input => input.oninput = () => { versions[Number(input.dataset.index)].description = input.value; });
      $$('.add-version-color', modal).forEach(button => button.onclick = () => { versions[Number(button.dataset.index)].colors.push({name:'',hex:'#c81924',swatches:['#c81924'],images:[],availability:'in_stock',stock_quantity:null}); renderVersions(); });
      bindColorInputs();
    }
    function bindColorInputs() {
      $$('.remove-nested-color', modal).forEach(button => button.onclick = () => { removeAtPath(button.dataset.path); renderVersions(); renderGeneralColors(); });
      $$('.nested-color-name', modal).forEach(input => input.oninput = () => { const color=atPath(input.dataset.path); if(color) color.name=input.value; });
      $$('.nested-color-availability', modal).forEach(input => input.onchange = () => { const color=atPath(input.dataset.path); if(color) color.availability=input.value; });
      $$('.nested-color-stock', modal).forEach(input => input.oninput = () => { const color=atPath(input.dataset.path); if(color) { const amount = input.value === '' ? null : Number(input.value); color.stock_quantity = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : null; } });
      $$('.nested-swatch', modal).forEach(input => input.oninput = () => {
        const color = atPath(input.dataset.path); const index = Number(input.dataset.index);
        if (!color) return;
        color.swatches = paletteOf(color); color.swatches[index] = validHex(input.value); color.hex = color.swatches[0];
      });
      $$('.add-swatch', modal).forEach(button => button.onclick = () => {
        const color = atPath(button.dataset.path); if (!color) return;
        color.swatches = paletteOf(color); if (color.swatches.length < 3) color.swatches.push('#c81924'); color.hex = color.swatches[0];
        renderVersions(); renderGeneralColors();
      });
      $$('.remove-swatch', modal).forEach(button => button.onclick = () => {
        const color = atPath(button.dataset.path); if (!color) return;
        color.swatches = paletteOf(color); if (color.swatches.length > 1) color.swatches.splice(Number(button.dataset.index), 1); color.hex = color.swatches[0];
        renderVersions(); renderGeneralColors();
      });
      $$('.nested-color-upload', modal).forEach(input => input.onchange = async () => { try { const color=atPath(input.dataset.path); color.images.push(...await uploadMany(input.files)); renderVersions(); renderGeneralColors(); notify('Đã tải ảnh cho màu xe'); } catch (error) { notify(error.message); } });
      $$('.remove-nested-image', modal).forEach(button => button.onclick = () => { const color=atPath(button.dataset.path); color.images.splice(Number(button.dataset.image),1); renderVersions(); renderGeneralColors(); });
    }
    $('#productImagesInput', modal).onchange = async event => { try { images.push(...await uploadMany(event.target.files)); renderImages(); } catch (error) { notify(error.message); } };
    $('#addVersion', modal).onclick = () => { versions.push({name:'',price:'',old_price:'',description:'',colors:[]}); renderVersions(); };
    $('#addGeneralColor', modal).onclick = () => { generalColors.push({name:'',hex:'#c81924',swatches:['#c81924'],images:[],availability:'in_stock',stock_quantity:null}); renderGeneralColors(); };
    renderImages(); renderVersions(); renderGeneralColors();
    form.onsubmit = async event => { event.preventDefault(); const fd = new FormData(form); const body = Object.fromEntries(fd.entries()); body.images=images; body.colors=generalColors.filter(c=>c.name); body.versions=versions.filter(v=>v.name).map(v=>({...v, colors:(v.colors||[]).filter(c=>c.name)})); body.featured=fd.get('featured')==='on'; body.published=fd.get('published')==='on'; try { await request(product ? `/api/admin/products/${p.id}` : '/api/admin/products', {method:product?'PUT':'POST',body}); notify('Đã lưu sản phẩm'); modal.remove(); document.body.classList.remove('modal-open'); loadAdminTab('products'); } catch(error) { notify(error.message); } };
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
    const modal = adminModal(accessory ? 'Sửa phụ kiện' : 'Thêm phụ kiện', `<form id="accessoryForm" class="admin-product-form"><div class="field"><label>Tên *</label><input name="name" required value="${escapeHTML(a.name || '')}"></div><div class="field"><label>Giá</label><input name="price" class="vnd-input" inputmode="numeric" value="${formatVndInput(a.price)}" placeholder="Ví dụ: 250.000"></div><div class="field"><label>Ảnh</label><input id="accessoryImageFile" type="file" accept="image/*"><input name="image_url" value="${escapeHTML(a.image_url || '')}"></div><div class="field"><label>Mô tả</label><textarea name="description">${escapeHTML(a.description || '')}</textarea></div><label><input name="published" type="checkbox" ${a.published !== 0 ? 'checked' : ''}> Hiển thị ngoài website</label><button class="btn btn-primary">Lưu</button></form>`);
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
        ${imageField('Ảnh Hero (riêng)', 'hero_image', s.hero_image)}${imageField('Ảnh Showroom (riêng)', 'showroom_image', s.showroom_image)}${imageField('Ảnh Giao xe tận nơi (riêng)', 'delivery_image', s.delivery_image)}${imageField('Ảnh trang trả góp', 'installment_image', s.installment_image)}${imageField('Ảnh khuyến mại mặc định', 'promo_image', s.promo_image)}
        <div class="form-two"><div class="field"><label>Tiêu đề giao xe</label><input name="delivery_title" value="${escapeHTML(s.delivery_title || '')}"></div><div class="field"><label>Nội dung giao xe</label><textarea name="delivery_text">${escapeHTML(s.delivery_text || '')}</textarea></div></div>
      </fieldset>
      <fieldset class="fieldset"><legend>Liên hệ, Map & mạng xã hội</legend>
        <div class="form-three">
          <div class="field"><label>Hotline</label><input name="hotline" value="${escapeHTML(s.hotline || '')}"></div><div class="field"><label>Email</label><input name="support_email" value="${escapeHTML(s.support_email || '')}"></div><div class="field"><label>Địa chỉ</label><input name="address" value="${escapeHTML(s.address || '')}"></div>
          <div class="field"><label>Zalo URL</label><input name="zalo_url" placeholder="https://zalo.me/..." value="${escapeHTML(s.zalo_url || '')}"></div><div class="field"><label>Messenger URL</label><input name="messenger_url" placeholder="https://m.me/..." value="${escapeHTML(s.messenger_url || '')}"></div><div class="field"><label>Facebook URL</label><input name="facebook_url" placeholder="https://facebook.com/..." value="${escapeHTML(s.facebook_url || '')}"></div><div class="field"><label>TikTok URL</label><input name="tiktok_url" placeholder="https://tiktok.com/@..." value="${escapeHTML(s.tiktok_url || '')}"></div><div class="field"><label>YouTube URL</label><input name="youtube_url" placeholder="https://youtube.com/..." value="${escapeHTML(s.youtube_url || '')}"></div><div class="field"><label>Google Map embed URL</label><input name="map_embed_url" value="${escapeHTML(s.map_embed_url || '')}"></div><div class="field"><label>Nút nhấp nháy chính</label><select name="floating_primary_action"><option value="call" ${s.floating_primary_action === 'call' || !s.floating_primary_action ? 'selected' : ''}>Gọi ngay</option><option value="zalo" ${s.floating_primary_action === 'zalo' ? 'selected' : ''}>Zalo</option><option value="chat" ${s.floating_primary_action === 'chat' ? 'selected' : ''}>Chat trực tuyến</option></select></div>
        </div><div class="check-row floating-settings"><label><input name="floating_show_zalo" type="checkbox" ${s.floating_show_zalo !== false ? 'checked' : ''}> Hiện nút Zalo</label><label><input name="floating_show_messenger" type="checkbox" ${s.floating_show_messenger !== false ? 'checked' : ''}> Hiện Messenger</label><label><input name="floating_show_facebook" type="checkbox" ${s.floating_show_facebook ? 'checked' : ''}> Hiện Facebook</label><label><input name="floating_show_tiktok" type="checkbox" ${s.floating_show_tiktok ? 'checked' : ''}> Hiện TikTok</label><label><input name="floating_show_chat" type="checkbox" ${s.floating_show_chat !== false ? 'checked' : ''}> Hiện Chat</label></div><p class="muted">Nút nào đang nhấp nháy được chọn ở “Nút nhấp nháy chính”. Zalo hiển thị đúng biểu tượng Zalo khi đã dán link.</p><div class="field"><label>Giờ làm việc</label><textarea name="business_hours">${escapeHTML(s.business_hours || '')}</textarea></div>
      </fieldset>
      <fieldset class="fieldset"><legend>Trang trả góp</legend>
        <div class="field"><label>Tiêu đề trả góp</label><textarea name="installment_title">${escapeHTML(s.installment_title || '')}</textarea></div><div class="field"><label>Nội dung trả góp</label><textarea name="installment_text">${escapeHTML(s.installment_text || '')}</textarea></div><div class="field"><label>Giấy tờ / thủ tục</label><textarea name="installment_docs">${escapeHTML(s.installment_docs || '')}</textarea></div><div class="field"><label>Mức trả trước gợi ý (mỗi dòng một lựa chọn)</label><textarea name="installment_down_payments" placeholder="Từ 3 triệu&#10;Từ 5 triệu&#10;Từ 7 triệu&#10;Theo tư vấn">${escapeHTML(s.installment_down_payments || 'Từ 3 triệu\nTừ 5 triệu\nTừ 7 triệu\nTừ 10 triệu\nTheo tư vấn')}</textarea><small class="field-help">Chỉ hiện khi khách chọn Trả góp. Với từng xe, mức “Trả trước từ” của xe đó sẽ được thêm vào đầu danh sách.</small></div><div class="field"><label>Các bước thủ tục (mỗi dòng: Tiêu đề | Mô tả)</label><textarea name="installment_steps">${escapeHTML(s.installment_steps || '')}</textarea></div><div class="field"><label>Câu hỏi thường gặp (mỗi dòng: Câu hỏi | Trả lời)</label><textarea name="installment_faqs">${escapeHTML(s.installment_faqs || '')}</textarea></div>
        <div class="admin-card" style="margin-top:18px;background:linear-gradient(135deg,#fff8f8,#fff);border-color:#efcfd2"><div class="section-kicker">Quảng cáo & tự động hoá</div><h3 style="margin:4px 0 8px">Pixel & Chatbot AI</h3><p class="muted" style="margin:0 0 14px">Phần Pixel, Gemini và nút kiểm tra kết nối đã được tách riêng để tránh nhầm với nội dung trang trả góp.</p><button type="button" id="openMarketingAi" class="btn btn-dark">Mở Pixel & Chatbot AI →</button></div>
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
    $('#siteForm', main).onsubmit = async event => { event.preventDefault(); const fd = new FormData(event.target); const body = Object.fromEntries(fd.entries()); ['floating_show_zalo','floating_show_messenger','floating_show_facebook','floating_show_tiktok','floating_show_chat'].forEach(key => body[key] = fd.get(key) === 'on'); try { const out = await request('/api/admin/site', { method:'PUT', body }); state.site = out.site; setSiteTheme(state.site); notify('Đã lưu giao diện và nội dung website'); } catch (error) { notify(error.message); } };
    $('#openMarketingAi', main)?.addEventListener('click', () => { const target = $('[data-tab="marketing_ai"]'); if (target) target.click(); });
  }

  function sitePayload(form, checkboxes = []) {
    const fd = new FormData(form);
    const body = Object.fromEntries(fd.entries());
    checkboxes.forEach(key => body[key] = fd.get(key) === 'on');
    return body;
  }
  async function saveSiteForm(form, checkboxes, successMessage) {
    const out = await request('/api/admin/site', { method:'PUT', body:sitePayload(form, checkboxes) });
    state.site = out.site;
    setSiteTheme(state.site);
    notify(successMessage || 'Đã lưu thay đổi.');
    return out.site;
  }
  function iconConfigCard(type, title, note, site) {
    const key = `floating_${type}`;
    const selected = site[`${key}_icon`] || (type === 'call' ? 'phone' : type);
    const color = site[`${key}_color`] || '';
    const shape = site[`${key}_shape`] || 'rounded';
    const image = site[`${key}_icon_url`] || '';
    return `<section class="dock-config-card"><div class="dock-config-head"><div><b>${escapeHTML(title)}</b><span>${escapeHTML(note)}</span></div><span class="dock-preview-icon">${image ? `<img src="${escapeHTML(image)}" alt="">` : socialIcon(selected)}</span></div><div class="form-two"><div class="field"><label>Biểu tượng mặc định</label><select name="${key}_icon">${iconOptionsFor(type, selected)}</select></div><div class="field"><label>Kiểu bo góc</label><select name="${key}_shape"><option value="rounded" ${shape==='rounded'?'selected':''}>Bo tròn</option><option value="circle" ${shape==='circle'?'selected':''}>Tròn</option><option value="square" ${shape==='square'?'selected':''}>Vuông mềm</option></select></div><div class="field"><label>Màu nút</label><input name="${key}_color" type="color" value="${escapeHTML(/^#[0-9a-fA-F]{6}$/.test(color)?color:'#c81924')}"></div><div class="field"><label>Ảnh icon riêng (không bắt buộc)</label><input class="floating-icon-upload" data-field="${key}_icon_url" type="file" accept="image/*"><input name="${key}_icon_url" value="${escapeHTML(image)}" placeholder="Link ảnh icon"></div></div></section>`;
  }
  async function adminSite(main) {
    const data = await request('/api/admin/site'); const s = data.site;
    main.innerHTML = `<div class="admin-page-head"><div><span>Giao diện website</span><h1 class="admin-title">Theme Studio</h1><p class="admin-sub">Chỉnh font, màu sắc, chữ và ảnh chính. Liên hệ, nút nổi, Pixel và AI được đặt ở các mục riêng để dễ quản lý.</p></div><div class="admin-page-badge">65+ font tiếng Việt</div></div>
    <form id="siteForm" class="admin-product-form admin-pro-form">
      <fieldset class="fieldset"><legend>Thương hiệu & Theme</legend><div class="form-three">
        <div class="field"><label>Tên thương hiệu</label><input name="brand_name" value="${escapeHTML(s.brand_name || '')}"></div><div class="field"><label>Tiêu đề tab trình duyệt</label><input name="page_title" value="${escapeHTML(s.page_title || '')}"></div><div class="field"><label>Logo</label><input id="logoFile" type="file" accept="image/*"><input name="logo_url" value="${escapeHTML(s.logo_url || '')}"></div><div class="field"><label>Favicon / icon tab</label><input id="faviconFile" type="file" accept="image/*"><input name="favicon_url" value="${escapeHTML(s.favicon_url || '')}"></div>
        <div class="field"><label>Màu chủ đạo</label><input name="primary_color" type="color" value="${escapeHTML(s.primary_color || '#c81924')}"></div><div class="field"><label>Màu nhấn</label><input name="accent_color" type="color" value="${escapeHTML(s.accent_color || '#ff6b76')}"></div><div class="field"><label>Màu nền</label><input name="background_color" type="color" value="${escapeHTML(s.background_color || '#ffffff')}"></div><div class="field"><label>Màu chữ</label><input name="text_color" type="color" value="${escapeHTML(s.text_color || '#1b1214')}"></div>
        <div class="field"><label>Font nội dung</label><select name="body_font">${fontOptions(s.body_font || 'Be Vietnam Pro')}</select></div><div class="field"><label>Font tiêu đề</label><select name="heading_font">${fontOptions(s.heading_font || 'Barlow Condensed')}</select></div>
        <div class="field"><label>Cỡ chữ nội dung <output id="bodySizeOut">${escapeHTML(s.body_font_size || 16)}px</output></label><input name="body_font_size" id="bodySize" type="range" min="14" max="20" step="1" value="${escapeHTML(s.body_font_size || 16)}"></div><div class="field"><label>Tỷ lệ tiêu đề <output id="headingScaleOut">${escapeHTML(s.heading_scale || 1)}x</output></label><input name="heading_scale" id="headingScale" type="range" min="0.85" max="1.35" step="0.05" value="${escapeHTML(s.heading_scale || 1)}"></div><div class="field"><label>Giãn dòng <output id="lineHeightOut">${escapeHTML(s.body_line_height || 1.55)}</output></label><input name="body_line_height" id="lineHeight" type="range" min="1.35" max="2" step="0.05" value="${escapeHTML(s.body_line_height || 1.55)}"></div><div class="field"><label>Bo góc <output id="radiusOut">${escapeHTML(s.corner_radius || 22)}px</output></label><input name="corner_radius" id="cornerRadius" type="range" min="8" max="32" step="1" value="${escapeHTML(s.corner_radius || 22)}"></div>
      </div><div class="theme-preview"><span class="theme-preview-kicker">XEM TRƯỚC THEME</span><h3 id="themePreviewTitle">Chọn xe ưng ý. Lên đường an tâm.</h3><p id="themePreviewText">Thay đổi màu, font và kích cỡ sẽ áp dụng khi bấm lưu.</p><button type="button" class="btn btn-primary">Nút hành động</button></div></fieldset>
      <fieldset class="fieldset share-settings"><legend>Ảnh xem trước khi gửi link</legend><p class="muted">Khi dán link website vào Facebook, Zalo, Messenger hoặc TikTok, nền tảng sẽ dùng ảnh, tiêu đề và mô tả ở đây. Nên dùng ảnh ngang <b>1200 × 630 px</b>.</p><div class="form-two"><div class="field"><label>Tiêu đề khi chia sẻ</label><input name="share_title" value="${escapeHTML(s.share_title || s.page_title || '')}" maxlength="120"></div><div class="field"><label>Mô tả khi chia sẻ</label><textarea name="share_description" maxlength="280">${escapeHTML(s.share_description || s.hero_subtitle || '')}</textarea></div></div>${imageField('Ảnh preview link (1200 × 630 px)', 'share_image', s.share_image)}<div class="share-preview-card"><div class="share-preview-image" id="sharePreviewImage" style="background-image:url('${escapeHTML(s.share_image || s.hero_image || s.showroom_image || s.logo_url || '')}')"></div><div><small>XEM TRƯỚC KHI CHIA SẺ</small><b id="sharePreviewTitle">${escapeHTML(s.share_title || s.page_title || s.brand_name || '')}</b><p id="sharePreviewDescription">${escapeHTML(s.share_description || s.hero_subtitle || '')}</p></div></div></fieldset>
      <fieldset class="fieldset"><legend>Trang chủ & nội dung</legend><div class="field"><label>Tiêu đề Hero</label><textarea name="hero_title">${escapeHTML(s.hero_title || '')}</textarea></div><div class="field"><label>Mô tả Hero</label><textarea name="hero_subtitle">${escapeHTML(s.hero_subtitle || '')}</textarea></div>${heroSliderField(s)}${imageField('Ảnh Showroom (riêng)', 'showroom_image', s.showroom_image)}${imageField('Ảnh Giao xe tận nơi (riêng)', 'delivery_image', s.delivery_image)}${imageField('Ảnh trang trả góp', 'installment_image', s.installment_image)}${imageField('Ảnh khuyến mại mặc định', 'promo_image', s.promo_image)}<div class="form-two"><div class="field"><label>Tiêu đề giao xe</label><input name="delivery_title" value="${escapeHTML(s.delivery_title || '')}"></div><div class="field"><label>Nội dung giao xe</label><textarea name="delivery_text">${escapeHTML(s.delivery_text || '')}</textarea></div></div></fieldset>
      <fieldset class="fieldset"><legend>Trang trả góp</legend><div class="field"><label>Tiêu đề trả góp</label><textarea name="installment_title">${escapeHTML(s.installment_title || '')}</textarea></div><div class="field"><label>Nội dung trả góp</label><textarea name="installment_text">${escapeHTML(s.installment_text || '')}</textarea></div><div class="field"><label>Giấy tờ / thủ tục</label><textarea name="installment_docs">${escapeHTML(s.installment_docs || '')}</textarea></div><div class="field"><label>Mức trả trước gợi ý (mỗi dòng một lựa chọn)</label><textarea name="installment_down_payments">${escapeHTML(s.installment_down_payments || '')}</textarea></div><div class="field"><label>Các bước thủ tục (mỗi dòng: Tiêu đề | Mô tả)</label><textarea name="installment_steps">${escapeHTML(s.installment_steps || '')}</textarea></div><div class="field"><label>Câu hỏi thường gặp (mỗi dòng: Câu hỏi | Trả lời)</label><textarea name="installment_faqs">${escapeHTML(s.installment_faqs || '')}</textarea></div></fieldset>
      <button class="btn btn-primary">Lưu giao diện & nội dung</button></form>`;
    $$('.site-image-file', main).forEach(input => input.onchange = async () => { try { const url = await uploadFile(input.files[0]); $(`[name="${input.dataset.field}"]`, main).value = url; if (input.dataset.field === 'share_image') { const preview=$('#sharePreviewImage', main); if(preview) preview.style.backgroundImage=`url("${url.replace(/"/g,'%22')}")`; } notify('Đã tải ảnh'); } catch (error) { notify(error.message); } });
    bindHeroSliderAdmin(main, s);
    $('#logoFile', main).onchange = async event => { try { const url = await uploadFile(event.target.files[0]); $('[name="logo_url"]', main).value = url; $('[name="favicon_url"]', main).value = url; notify('Đã tải logo'); } catch (error) { notify(error.message); } };
    $('#faviconFile', main).onchange = async event => { try { $('[name="favicon_url"]', main).value = await uploadFile(event.target.files[0]); notify('Đã tải favicon'); } catch (error) { notify(error.message); } };
    const preview = () => { const draft = Object.fromEntries(new FormData($('#siteForm', main)).entries()); setSiteTheme({ ...state.site, ...draft }); $('#bodySizeOut').value = `${draft.body_font_size}px`; $('#headingScaleOut').value = `${draft.heading_scale}x`; $('#lineHeightOut').value = draft.body_line_height; $('#radiusOut').value = `${draft.corner_radius}px`; };
    ['bodySize','headingScale','lineHeight','cornerRadius'].forEach(id => $(`#${id}`, main).addEventListener('input', preview)); ['body_font','heading_font','primary_color','accent_color','background_color','text_color'].forEach(name => $(`[name="${name}"]`, main).addEventListener('change', preview)); preview();
    const updateSharePreview = () => { const title=$('[name="share_title"]',main)?.value || $('[name="page_title"]',main)?.value || ''; const desc=$('[name="share_description"]',main)?.value || ''; const image=$('[name="share_image"]',main)?.value || $('[name="hero_image"]',main)?.value || ''; const t=$('#sharePreviewTitle',main), d=$('#sharePreviewDescription',main), i=$('#sharePreviewImage',main); if(t)t.textContent=title; if(d)d.textContent=desc; if(i&&image)i.style.backgroundImage=`url("${image.replace(/"/g,'%22')}")`; };
    ['share_title','share_description','share_image'].forEach(name => $(`[name="${name}"]`,main)?.addEventListener('input', updateSharePreview)); updateSharePreview();
    $('#siteForm', main).onsubmit = async event => { event.preventDefault(); try { await saveSiteForm(event.target, [], 'Đã lưu giao diện và nội dung website.'); } catch (error) { notify(error.message); } };
  }
  async function adminContacts(main) {
    const data = await request('/api/admin/site'); const s = data.site;
    main.innerHTML = `<div class="admin-page-head"><div><span>Thông tin liên hệ</span><h1 class="admin-title">Liên hệ & nút nổi</h1><p class="admin-sub">Tự chọn icon mặc định, tải icon riêng, màu nút, kiểu bo góc và nút nào được nhấp nháy.</p></div><div class="admin-page-badge">Nút nổi thực tế</div></div>
      <form id="contactsForm" class="admin-product-form admin-pro-form"><fieldset class="fieldset"><legend>Liên hệ & mạng xã hội</legend><div class="form-three"><div class="field"><label>Hotline</label><input name="hotline" value="${escapeHTML(s.hotline || '')}"></div><div class="field"><label>Email</label><input name="support_email" value="${escapeHTML(s.support_email || '')}"></div><div class="field"><label>Địa chỉ</label><input name="address" value="${escapeHTML(s.address || '')}"></div><div class="field"><label>Zalo URL</label><input name="zalo_url" value="${escapeHTML(s.zalo_url || '')}" placeholder="https://zalo.me/..."></div><div class="field"><label>Messenger URL</label><input name="messenger_url" value="${escapeHTML(s.messenger_url || '')}" placeholder="https://m.me/..."></div><div class="field"><label>Facebook URL</label><input name="facebook_url" value="${escapeHTML(s.facebook_url || '')}" placeholder="https://facebook.com/..."></div><div class="field"><label>TikTok URL</label><input name="tiktok_url" value="${escapeHTML(s.tiktok_url || '')}" placeholder="https://tiktok.com/@..."></div><div class="field"><label>YouTube URL</label><input name="youtube_url" value="${escapeHTML(s.youtube_url || '')}" placeholder="https://youtube.com/..."></div><div class="field"><label>Google Map embed URL</label><input name="map_embed_url" value="${escapeHTML(s.map_embed_url || '')}"></div><div class="field full"><label>Giờ làm việc</label><textarea name="business_hours">${escapeHTML(s.business_hours || '')}</textarea></div></div></fieldset>
      <fieldset class="fieldset"><legend>Nút nổi & hiệu ứng nhấp nháy</legend><div class="form-three"><div class="field"><label>Nút nhấp nháy chính</label><select name="floating_primary_action"><option value="call" ${s.floating_primary_action==='call'||!s.floating_primary_action?'selected':''}>Gọi ngay</option><option value="zalo" ${s.floating_primary_action==='zalo'?'selected':''}>Zalo</option><option value="chat" ${s.floating_primary_action==='chat'?'selected':''}>Chat trực tuyến</option></select></div><div class="field"><label>Tốc độ nhấp nháy</label><select name="floating_pulse_speed"><option value="slow" ${s.floating_pulse_speed==='slow'?'selected':''}>Chậm, nhẹ</option><option value="normal" ${!s.floating_pulse_speed||s.floating_pulse_speed==='normal'?'selected':''}>Vừa</option><option value="fast" ${s.floating_pulse_speed==='fast'?'selected':''}>Nhanh</option></select></div><div class="field"><label>Hiệu ứng</label><label class="switch-row"><input name="floating_pulse_enabled" type="checkbox" ${s.floating_pulse_enabled!==false?'checked':''}><span> Bật nhấp nháy thật</span></label></div></div><div class="check-row floating-settings"><label><input name="floating_show_zalo" type="checkbox" ${s.floating_show_zalo!==false?'checked':''}> Hiện Zalo</label><label><input name="floating_show_messenger" type="checkbox" ${s.floating_show_messenger!==false?'checked':''}> Hiện Messenger</label><label><input name="floating_show_facebook" type="checkbox" ${s.floating_show_facebook?'checked':''}> Hiện Facebook</label><label><input name="floating_show_tiktok" type="checkbox" ${s.floating_show_tiktok?'checked':''}> Hiện TikTok</label><label><input name="floating_show_chat" type="checkbox" ${s.floating_show_chat!==false?'checked':''}> Hiện Chat</label></div><div class="dock-config-grid">${iconConfigCard('call','Gọi ngay','Hotline trên thiết bị khách',s)}${iconConfigCard('zalo','Zalo','Mở trực tiếp Zalo',s)}${iconConfigCard('messenger','Messenger','Mở hội thoại Messenger',s)}${iconConfigCard('facebook','Facebook','Đi đến Fanpage',s)}${iconConfigCard('tiktok','TikTok','Đi đến TikTok',s)}${iconConfigCard('chat','Chat tư vấn','Mở chat ngay trên website',s)}</div><div class="form-two"><div class="field"><label>Nhãn nút gọi</label><input name="floating_call_label" value="${escapeHTML(s.floating_call_label || 'Gọi ngay')}"></div><div class="field"><label>Nhãn nút chat</label><input name="floating_chat_label" value="${escapeHTML(s.floating_chat_label || 'Tư vấn')}"></div></div></fieldset><button class="btn btn-primary">Lưu liên hệ & nút nổi</button></form>`;
    $$('.floating-icon-upload', main).forEach(input => input.onchange = async () => { try { const url=await uploadFile(input.files[0]); $(`[name="${input.dataset.field}"]`, main).value=url; const preview=$(`[data-preview="${input.dataset.field}"]`, main); if(preview) preview.src=url; notify('Đã tải icon riêng.'); } catch(error){ notify(error.message); } });
    $('#contactsForm', main).onsubmit = async event => { event.preventDefault(); try { await saveSiteForm(event.target, ['floating_show_zalo','floating_show_messenger','floating_show_facebook','floating_show_tiktok','floating_show_chat','floating_pulse_enabled'], 'Đã lưu liên hệ và nút nổi.'); } catch(error) { notify(error.message); } };
  }
  async function adminNotices(main) {
    const data = await request('/api/admin/site');
    const s = data.site;
    const examples = String(s.notice_items || 'Tâm An|Khám phá {xe} tại showroom hôm nay.\nƯu đãi|Liên hệ để nhận tư vấn trả góp và quà tặng hiện hành.');
    main.innerHTML = `<div class="admin-page-head"><div><span>Nội dung nổi bật</span><h1 class="admin-title">Thông báo luân phiên</h1><p class="admin-sub">Tạo các thông báo chạy tự động trên website. Mục này hiển thị dưới nhãn “Thông báo nổi bật”; dùng nội dung đúng với chương trình và thông tin showroom của bạn.</p></div><div class="admin-page-badge">Tự động luân phiên</div></div>
      <form id="noticeForm" class="admin-product-form admin-pro-form">
        <fieldset class="fieldset"><legend>Bật và hiển thị</legend><div class="form-three">
          <div class="field"><label class="admin-check"><input name="notice_enabled" type="checkbox" ${s.notice_enabled ? 'checked' : ''}><span>✓</span> Hiện thông báo ngoài website</label></div>
          <div class="field"><label>Tiêu đề nhãn</label><input name="notice_title" value="${escapeHTML(s.notice_title || 'Thông báo nổi bật')}" maxlength="48"></div>
          <div class="field"><label>Vị trí</label><select name="notice_position"><option value="left" ${(!s.notice_position || s.notice_position === 'left') ? 'selected' : ''}>Góc trái phía dưới</option><option value="right" ${s.notice_position === 'right' ? 'selected' : ''}>Góc phải phía dưới</option><option value="center" ${s.notice_position === 'center' ? 'selected' : ''}>Giữa đáy màn hình</option></select></div>
          <div class="field"><label>Tốc độ chuyển (giây)</label><input name="notice_interval_seconds" type="number" min="3" max="30" value="${Math.round(Number(s.notice_interval || 6000) / 1000)}"></div>
        </div></fieldset>
        <fieldset class="fieldset"><legend>Nội dung thông báo</legend>
          <div class="field"><label>Mỗi dòng một thông báo</label><textarea name="notice_items" rows="8" placeholder="Nhãn | Nội dung">${escapeHTML(examples)}</textarea><small class="field-help">Cú pháp: <b>Nhãn | Nội dung</b>. Có thể dùng <code>{xe}</code> để tự chèn tên xe đang có trong kho. Ví dụ: <code>Ưu đãi | {xe} đang có hỗ trợ tư vấn trả góp.</code></small></div>
          <div class="notice-admin-preview"><span>HIỂN THỊ MẪU</span><div class="notice-preview-card"><i>✦</i><div><b id="noticePreviewTitle">${escapeHTML(s.notice_title || 'Thông báo nổi bật')}</b><p id="noticePreviewContent"></p></div></div></div>
        </fieldset>
        <button class="btn btn-primary">Lưu thông báo nổi bật</button>
      </form>`;
    const form = $('#noticeForm', main);
    const content = $('#noticePreviewContent', main);
    const title = $('#noticePreviewTitle', main);
    const preview = () => {
      const rows = String($('[name="notice_items"]', form).value || '').split('\n').map(v => v.trim()).filter(Boolean);
      const first = rows[0] || 'Tâm An | Chưa có nội dung thông báo.';
      const parts = first.split('|').map(v => v.trim());
      const label = parts.length > 1 ? parts.shift() : 'Tâm An';
      const body = parts.join('|') || first;
      title.textContent = $('[name="notice_title"]', form).value || 'Thông báo nổi bật';
      content.textContent = `${label}: ${body.replace(/\{xe\}/gi, 'Tên xe trong kho')}`;
    };
    $('[name="notice_items"]', form).addEventListener('input', preview);
    $('[name="notice_title"]', form).addEventListener('input', preview);
    preview();
    form.onsubmit = async event => {
      event.preventDefault();
      const fd = new FormData(form);
      const body = Object.fromEntries(fd.entries());
      body.notice_enabled = fd.get('notice_enabled') === 'on';
      body.notice_interval = Math.max(3, Math.min(30, Number(body.notice_interval_seconds || 6))) * 1000;
      delete body.notice_interval_seconds;
      try {
        const out = await request('/api/admin/site', { method:'PUT', body });
        state.site = out.site;
        notify('Đã lưu thông báo nổi bật.');
      } catch (error) { notify(error.message); }
    };
  }

  async function adminMarketingAi(main) {
    const [siteData, aiData] = await Promise.all([request('/api/admin/site'), request('/api/admin/ai/status').catch(error => ({ error:error.message }))]); const s=siteData.site;
    const legacyModels = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];
    const provider = s.ai_provider || 'cloudflare';
    const displayAiModel = provider === 'cloudflare'
      ? (String(s.ai_model || '').startsWith('@cf/') ? s.ai_model : '@cf/aisingapore/gemma-sea-lion-v4-27b-it')
      : (legacyModels.includes(String(s.ai_model || '').trim()) || !s.ai_model ? 'gemini-3.1-flash-lite' : s.ai_model);
    const modelLabel = provider === 'cloudflare' ? 'Model Cloudflare Workers AI' : provider === 'webhook' ? 'Tên model/ghi chú webhook' : 'Model Gemini';
    const status = aiData.error ? `<div class="ai-health ai-health-error"><b>Không đọc được trạng thái AI</b><span>${escapeHTML(aiData.error)}</span></div>` : `<div class="ai-health ${aiData.key_configured ? 'ai-health-ready' : 'ai-health-warn'}"><b>${aiData.key_configured ? 'AI đã được cấu hình' : 'AI chưa được cấu hình'}</b><span>Nhà cung cấp: ${escapeHTML(aiData.provider || 'cloudflare')} • Model: ${escapeHTML(aiData.model || '')} • Chatbot: ${aiData.enabled ? 'đang bật' : 'đang tắt'}</span></div>`;
    main.innerHTML = `<div class="admin-page-head"><div><span>Quảng cáo & tự động hoá</span><h1 class="admin-title">Pixel & Chatbot AI</h1><p class="admin-sub">Đặt Meta Pixel, TikTok Pixel và cấu hình AI ở một nơi riêng. API key luôn đặt trong Cloudflare Secret, không dán vào website.</p></div><div class="admin-page-badge">Bảo mật key</div></div>${status}<form id="marketingForm" class="admin-product-form admin-pro-form"><fieldset class="fieldset"><legend>Đo lường quảng cáo</legend><div class="form-two"><div class="field"><label>Meta / Facebook Pixel ID</label><input name="meta_pixel_id" value="${escapeHTML(s.meta_pixel_id || '')}" placeholder="Ví dụ: 123456789..."><small class="field-help">Website ghi PageView, xem xe và gửi form sau khi Pixel được cấu hình.</small></div><div class="field"><label>TikTok Pixel ID</label><input name="tiktok_pixel_id" value="${escapeHTML(s.tiktok_pixel_id || '')}" placeholder="Ví dụ: CXXXX..."><small class="field-help">Chỉ nhập Pixel ID, không nhập access token.</small></div></div></fieldset><fieldset class="fieldset"><legend>Chatbot AI</legend><div class="form-three"><div class="field"><label>Tên chatbot</label><input name="ai_name" value="${escapeHTML(s.ai_name || 'Tâm An AI')}"></div><div class="field"><label>Nhà cung cấp</label><select name="ai_provider"><option value="cloudflare" ${provider==='cloudflare'?'selected':''}>Cloudflare Workers AI</option><option value="gemini" ${provider==='gemini'?'selected':''}>Gemini API</option><option value="webhook" ${provider==='webhook'?'selected':''}>Webhook / chatbot bên khác</option></select></div><div class="field"><label>${modelLabel}</label><input name="ai_model" value="${escapeHTML(displayAiModel)}" placeholder="@cf/aisingapore/gemma-sea-lion-v4-27b-it"></div></div><label class="admin-check"><input name="ai_enabled" type="checkbox" ${s.ai_enabled?'checked':''}><span>✓</span> Bật chatbot tự động khi chưa có nhân viên nhận chat</label><div class="field"><label>Lời chào chatbot</label><textarea name="ai_greeting">${escapeHTML(s.ai_greeting || '')}</textarea></div><div class="field"><label>Kiến thức chatbot</label><textarea name="ai_knowledge">${escapeHTML(s.ai_knowledge || '')}</textarea></div><div class="field"><label>Từ khoá chuyển nhân viên (ngăn cách bằng dấu phẩy)</label><input name="ai_handoff_words" value="${escapeHTML(s.ai_handoff_words || '')}"></div><div class="ai-action-row"><button type="button" id="aiTestButton" class="btn btn-dark">Kiểm tra kết nối AI</button><span id="aiTestResult" class="muted">Cloudflare Workers AI không cần Gemini key. Cần có binding AI trong wrangler.jsonc.</span></div><p class="muted">Cloudflare Workers AI dùng binding <code>AI</code> trong <code>wrangler.jsonc</code>. Gemini dùng Secret <code>GEMINI_API_KEY</code>. Chatbot bên khác dùng Secret <code>AI_WEBHOOK_URL</code>.</p></fieldset><button class="btn btn-primary">Lưu Pixel & Chatbot AI</button></form>`;
    $('#marketingForm',main).onsubmit = async event => { event.preventDefault(); try { await saveSiteForm(event.target,['ai_enabled'],'Đã lưu Pixel & Chatbot AI.'); } catch(error){ notify(error.message); } };
    $('#aiTestButton',main).onclick = async () => { const button=$('#aiTestButton',main), result=$('#aiTestResult',main); button.disabled=true; button.textContent='Đang kiểm tra…'; result.textContent='Worker đang gửi một câu thử tới nhà cung cấp AI.'; try { const out=await request('/api/admin/ai/test',{method:'POST'}); result.textContent=`Kết nối thành công (${out.model}): ${String(out.reply || '').slice(0,160)}`; result.className='ai-test-success'; } catch(error) { result.textContent=`Chưa kết nối được: ${error.message}`; result.className='ai-test-error'; } finally { button.disabled=false; button.textContent='Kiểm tra kết nối AI'; } };
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
      $('#leadRows').innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Khách</th><th>Nội dung</th><th>Ngày</th><th>Nhân viên</th><th>Trạng thái</th><th></th></tr></thead><tbody>${data.leads.map(lead => `<tr><td><b>${escapeHTML(lead.name)}</b><br><a href="tel:${escapeHTML(lead.phone)}">${escapeHTML(lead.phone)}</a></td><td><b>${escapeHTML(lead.type)}</b><br><span class="lead-payment">${escapeHTML(paymentPlanLabel(lead.payment_plan))}${lead.down_payment ? ` • ${escapeHTML(lead.down_payment)}` : ''}</span>${lead.note ? `<br><span class="muted">${escapeHTML(lead.note)}</span>` : ''}</td><td>${escapeHTML(vietnamTime(lead.created_at))}</td><td>${state.admin.role === 'admin' ? `<select class="lead-assignee" data-id="${lead.id}"><option value="">Chưa gán</option>${users.filter(u => u.role === 'employee').map(u => `<option value="${u.id}" ${lead.assigned_to === u.id ? 'selected' : ''}>${escapeHTML(u.full_name)}</option>`).join('')}</select>` : escapeHTML(lead.assigned_name || '')}</td><td><div class="status-editor"><select class="lead-state" data-id="${lead.id}"><option value="new" ${lead.status === 'new' ? 'selected' : ''}>Chưa xử lý</option><option value="in_progress" ${lead.status === 'in_progress' ? 'selected' : ''}>Đang xử lý</option><option value="done" ${lead.status === 'done' ? 'selected' : ''}>✓ Đã xong</option></select>${lead.status === 'done' ? `<button class="small-btn reopen-lead" data-id="${lead.id}">↻ Mở lại</button>` : ''}</div></td><td>${state.admin.role === 'admin' ? `<button class="small-btn danger delete-lead" data-id="${lead.id}">Xoá</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="admin-empty">Chưa có form phù hợp.</td></tr>'}</tbody></table></div>`;
      $$('.lead-state').forEach(select => select.onchange = async () => { const row = select.closest('tr'); const payload = { status:select.value }; if (state.admin.role === 'admin') payload.assigned_to = $('.lead-assignee', row)?.value || null; try { await request(`/api/admin/leads/${select.dataset.id}`, { method:'PUT', body:payload }); notify('Đã cập nhật'); } catch (error) { notify(error.message); } });
      $$('.lead-assignee').forEach(select => select.onchange = async () => { const row = select.closest('tr'); const status = $('.lead-state', row).value; try { await request(`/api/admin/leads/${select.dataset.id}`, { method:'PUT', body:{ status, assigned_to:select.value || null } }); notify('Đã gán nhân viên'); } catch (error) { notify(error.message); } });
      $$('.reopen-lead').forEach(button => button.onclick = async () => { try { await request(`/api/admin/leads/${button.dataset.id}`, { method:'PUT', body:{ status:'in_progress' } }); notify('Đã mở lại form để xử lý'); load(); } catch (error) { notify(error.message); } });
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
    main.innerHTML = `<h1 class="admin-title">Nhật ký hệ thống</h1><p class="admin-sub">Chỉ admin xem được lịch sử thao tác quan trọng.</p><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hoạt động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>${data.logs.map(log => `<tr><td>${escapeHTML(vietnamTime(log.created_at))}</td><td>${escapeHTML(log.actor_name || '')}</td><td><b>${escapeHTML(log.action)}</b></td><td>${escapeHTML(log.entity_type || '')} #${escapeHTML(log.entity_id || '')}</td><td>${escapeHTML(log.detail || '')}</td></tr>`).join('') || '<tr><td colspan="5" class="admin-empty">Chưa có nhật ký.</td></tr>'}</tbody></table></div></div>`;
  }

  // V1.14: định dạng giá VNĐ khi nhập trong mọi biểu mẫu quản trị.
  document.addEventListener('input', event => {
    const input = event.target;
    if (!input?.classList?.contains('vnd-input')) return;
    const end = input.selectionStart || input.value.length;
    const before = input.value.slice(0, end).replace(/\D/g, '').length;
    input.value = formatVndInput(input.value);
    let pos = 0, seen = 0;
    while (pos < input.value.length && seen < before) { if (/\d/.test(input.value[pos])) seen++; pos++; }
    try { input.setSelectionRange(pos, pos); } catch {}
  });

  /* ===== V1.14 — vận hành, danh mục động, Hero, vị trí, bảo mật ===== */
  const V14_DEFAULT_CATEGORIES = [
    { id:'motor_new', label:'Xe máy mới', icon:'🏍️', visible:true, sort:1 },
    { id:'motor_used', label:'Xe máy cũ', icon:'🏍️', visible:true, sort:2 },
    { id:'electric_new', label:'Xe điện mới', icon:'⚡', visible:true, sort:3 },
    { id:'electric_used', label:'Xe điện cũ', icon:'⚡', visible:true, sort:4 }
  ];
  const V14_DEFAULT_TRUST = [
    { icon:'✓', title:'Thông tin rõ ràng', text:'Giá hiển thị theo cài đặt cửa hàng.', visible:true, sort:1 },
    { icon:'✦', title:'Hỗ trợ trả góp', text:'Kiểm tra hồ sơ trước khi xác nhận.', visible:true, sort:2 },
    { icon:'⌁', title:'Tình trạng cập nhật', text:'Còn hàng, sắp về, đang giữ xe.', visible:true, sort:3 },
    { icon:'☎', title:'Tư vấn nhanh', text:'Gọi điện hoặc chat trực tiếp.', visible:true, sort:4 }
  ];

  function parseConfigArray(value, fallback) {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed) && parsed.length ? parsed : fallback;
    } catch { return fallback; }
  }
  function categoryDefinitions() {
    const rows = parseConfigArray(state.site?.categories_json, V14_DEFAULT_CATEGORIES)
      .map((item, index) => ({
        id: String(item?.id || '').trim().replace(/[^a-z0-9_-]/gi, '').slice(0,80),
        label: String(item?.label || '').trim().slice(0,80),
        icon: String(item?.icon || '🏍️').trim().slice(0,12),
        visible: item?.visible !== false,
        sort: Number(item?.sort ?? index + 1)
      }))
      .filter(item => item.id && item.label)
      .sort((a,b) => a.sort - b.sort);
    return rows.length ? rows : V14_DEFAULT_CATEGORIES;
  }
  function categoryLabel(id) { return categoryDefinitions().find(x => x.id === id)?.label || CATEGORY[id] || String(id || 'Xe'); }
  function categoryIcon(id) { return categoryDefinitions().find(x => x.id === id)?.icon || (String(id).includes('electric') ? '⚡' : '🏍️'); }
  function trustBlocks() {
    return parseConfigArray(state.site?.trust_blocks_json, V14_DEFAULT_TRUST)
      .map((item,index) => ({ icon:String(item?.icon || '✓').slice(0,12), title:String(item?.title || '').slice(0,100), text:String(item?.text || '').slice(0,220), visible:item?.visible !== false, sort:Number(item?.sort ?? index+1) }))
      .filter(item => item.title && item.visible)
      .sort((a,b) => a.sort-b.sort);
  }
  function formatVndInput(value) {
    const raw = String(value ?? '').trim();
    const digits = raw.replace(/\D/g, '');
    return digits ? Number(digits).toLocaleString('vi-VN') : '';
  }
  function v14EditDistance(a, b) {
    const left = String(a || ''), right = String(b || '');
    const prev = Array.from({length:right.length + 1}, (_,i)=>i);
    for (let i=1;i<=left.length;i++) { const cur=[i]; for(let j=1;j<=right.length;j++) cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(left[i-1]===right[j-1]?0:1)); for(let j=0;j<cur.length;j++) prev[j]=cur[j]; }
    return prev[right.length];
  }
  fuzzyMatch = function(product, query) {
    const needle = normalize(query).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
    if (!needle) return true;
    const source = normalize([product.name, product.brand, categoryLabel(product.category), product.engine, ...(allProductColors(product).map(c=>c.name)), ...((product.versions||[]).flatMap(v=>[v.name,v.description||'']))].join(' ')).replace(/[^a-z0-9 ]/g,' ');
    if (source.includes(needle)) return true;
    const words = source.split(/\s+/).filter(Boolean); const ask = needle.split(/\s+/).filter(Boolean);
    return ask.every(part => words.some(word => word.includes(part) || part.includes(word) || (part.length >= 4 && v14EditDistance(word, part) <= Math.max(1, Math.floor(part.length / 4)))) || [...source].reduce((acc,ch)=>{if(ch===part[acc]) return acc+1; return acc;},0)===part.length);
  };

  function productLowestPrice(product) {
    const values = [product.price, ...(product.versions || []).map(v => v?.price)].map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0);
    return values.length ? Math.min(...values) : null;
  }
  function locationConsentField() {
    if (state.site?.location_capture_enabled !== true && state.site?.location_capture_enabled !== 'true') return '';
    return `<div class="field full location-consent"><label class="consent-control"><input name="location_consent" type="checkbox"><span class="consent-box" aria-hidden="true">✓</span><span><b>${escapeHTML(state.site.location_consent_text || 'Tôi đồng ý chia sẻ vị trí gần đúng để Tâm An tư vấn giao xe thuận tiện hơn.')}</b><small>Chỉ lấy vị trí khi bạn tự đồng ý. Có thể từ chối mà vẫn gửi yêu cầu bình thường.</small></span></label></div>`;
  }
  function manualLocationField() {
    return `<div class="field full"><label>Khu vực đang ở <span class="muted">(không bắt buộc)</span></label><input name="customer_location" maxlength="180" autocomplete="address-level2" placeholder="Ví dụ: Cái Dầu, Châu Phú, An Giang"><small class="field-help">Nhân viên sẽ thấy khu vực này trong Form khách hàng. Bạn có thể nhập tay hoặc bật chia sẻ vị trí gần đúng bên dưới.</small></div>`;
  }
  async function captureOptInLocation(formElement) {
    const manual = String($('[name="customer_location"]', formElement)?.value || '').trim().slice(0, 180);
    const base = manual ? `Khu vực khách nhập: ${manual}` : '';
    const allow = $('[name="location_consent"]', formElement);
    if (!allow?.checked || !navigator.geolocation) return base;
    return new Promise(resolve => navigator.geolocation.getCurrentPosition(
      position => {
        const lat = Number(position.coords.latitude).toFixed(5);
        const lng = Number(position.coords.longitude).toFixed(5);
        const gps = `Vị trí gần đúng: ${lat}, ${lng} | https://www.google.com/maps?q=${lat},${lng}`;
        resolve([base, gps].filter(Boolean).join(' | '));
      },
      () => resolve(base),
      { enableHighAccuracy:false, timeout:3500, maximumAge:600000 }
    ));
  }

  // Mọi form tư vấn đều dùng cùng khối thanh toán + xin phép vị trí (nếu admin bật).
  paymentIntentFields = function(productMinimum = null) {
    const choices = configuredDownPayments(productMinimum);
    return `<div class="field full payment-intent-field"><label>Dự kiến thanh toán *</label><select name="payment_plan" class="payment-plan" required><option value="">Chọn hình thức</option><option value="cash">Trả thẳng</option><option value="installment">Trả góp</option><option value="bad_debt">Hồ sơ có nợ xấu / cần kiểm tra</option></select><small class="field-help">Chọn đúng nhu cầu để Tâm An tư vấn phù hợp. Hồ sơ nợ xấu cần kiểm tra thực tế, không cam kết duyệt trước.</small></div><div class="field full down-payment-field is-hidden"><label>Dự kiến trả trước *</label><select name="down_payment" class="down-payment"><option value="">Chọn mức trả trước</option>${choices.map(value => `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`).join('')}</select><small class="field-help">Chỉ cần chọn khi anh/chị dự kiến trả góp.</small></div>${manualLocationField()}${locationConsentField()}`;
  };

  const bindHomeEventsV13 = bindHomeEvents;
  bindHomeEvents = function() {
    const counts = Object.fromEntries((state.categories || []).map(x => [x.category, Number(x.count || 0)]));
    const activeCategories = categoryDefinitions().filter(c => c.visible && Number(counts[c.id] || 0) > 0);
    const categoryGrid = $('.category-grid');
    if (categoryGrid) categoryGrid.innerHTML = activeCategories.map(c => `<a href="/#inventory" class="category-card filter-category" data-category="${escapeHTML(c.id)}"><b>${escapeHTML(c.label)}</b><span>${counts[c.id]} sản phẩm đang hiển thị</span><i>${escapeHTML(c.icon)}</i></a>`).join('');
    const chips = $('#categoryChips');
    if (chips) chips.innerHTML = `<button class="chip active" data-category="">Tất cả xe</button>${activeCategories.map(c => `<button class="chip" data-category="${escapeHTML(c.id)}">${escapeHTML(c.label)}</button>`).join('')}`;
    if (chips && !$('#catalogFilters')) chips.insertAdjacentHTML('afterend', `<div id="catalogFilters" class="catalog-filters"><label><span>Giá từ</span><select id="priceFrom"><option value="">Tất cả</option><option value="0">Dưới 20 triệu</option><option value="20000000">20 triệu</option><option value="30000000">30 triệu</option><option value="50000000">50 triệu</option><option value="80000000">80 triệu</option></select></label><label><span>Giá đến</span><select id="priceTo"><option value="">Tất cả</option><option value="20000000">20 triệu</option><option value="30000000">30 triệu</option><option value="50000000">50 triệu</option><option value="80000000">80 triệu</option><option value="200000000">200 triệu</option></select></label><label><span>Sắp xếp</span><select id="priceSort"><option value="default">Mặc định</option><option value="low">Giá thấp đến cao</option><option value="high">Giá cao đến thấp</option></select></label></div>`);
    bindHomeEventsV13();
    const renderEnhanced = () => {
      const query = $('#searchInput')?.value || '';
      const selected = $('#categoryChips .chip.active')?.dataset.category || '';
      const from = Number($('#priceFrom')?.value || 0);
      const to = Number($('#priceTo')?.value || 0);
      const sort = $('#priceSort')?.value || 'default';
      let items = state.products.filter(p => {
        if (selected && p.category !== selected) return false;
        if (!fuzzyMatch(p, query)) return false;
        const price = productLowestPrice(p);
        if (from && (!price || price < from)) return false;
        if (to && (!price || price > to)) return false;
        return true;
      });
      if (sort === 'low') items = [...items].sort((a,b) => (productLowestPrice(a) || Number.MAX_SAFE_INTEGER) - (productLowestPrice(b) || Number.MAX_SAFE_INTEGER));
      if (sort === 'high') items = [...items].sort((a,b) => (productLowestPrice(b) || -1) - (productLowestPrice(a) || -1));
      const row = $('#productRow'); if (row) row.innerHTML = items.map(card).join('') || '<div class="admin-empty">Không tìm thấy xe phù hợp.</div>';
      const count = $('#productCount'); if (count) count.textContent = `${items.length} xe phù hợp`;
      bindProductEvents();
    };
    $('#searchInput')?.addEventListener('input', renderEnhanced);
    ['priceFrom','priceTo','priceSort'].forEach(id => $(`#${id}`)?.addEventListener('change', renderEnhanced));
    $$('#categoryChips .chip').forEach(button => button.addEventListener('click', () => setTimeout(renderEnhanced, 0)));
    $$('.filter-category').forEach(link => link.addEventListener('click', () => setTimeout(renderEnhanced, 60)));
    renderEnhanced();
  };

  const renderHomeV13 = renderHome;
  renderHome = function() {
    renderHomeV13();
    const grid = $('.trust-grid');
    if (grid) grid.innerHTML = trustBlocks().map(item => `<div class="trust-item"><i class="trust-icon">${escapeHTML(item.icon)}</i><div><b>${escapeHTML(item.title)}</b><span>${escapeHTML(item.text)}</span></div></div>`).join('');
  };

  bindHeroSlider = function() {
    const hero = $('.hero-slider'); if (!hero) return;
    const slides = $$('.hero-slide', hero); const dots = $$('.hero-dot', hero);
    if (slides.length < 2) return;
    let index = 0, timer = null, startX = null, dragging = false;
    const delay = Math.max(3, Math.min(20, Number(state.site?.hero_autoplay_seconds || 5))) * 1000;
    const apply = next => { index = (next + slides.length) % slides.length; slides.forEach((slide,i)=>slide.classList.toggle('is-active', i===index)); dots.forEach((dot,i)=>dot.classList.toggle('is-active', i===index)); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { stop(); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; timer = window.setInterval(() => apply(index + 1), delay); };
    $('#heroPrev')?.addEventListener('click', () => { apply(index - 1); start(); });
    $('#heroNext')?.addEventListener('click', () => { apply(index + 1); start(); });
    dots.forEach(dot => dot.addEventListener('click', () => { apply(Number(dot.dataset.heroDot)); start(); }));
    hero.addEventListener('mouseenter', stop); hero.addEventListener('mouseleave', () => !dragging && start());
    hero.addEventListener('pointerdown', e => { if (e.target.closest('button,a')) return; dragging=true; startX=e.clientX; hero.setPointerCapture?.(e.pointerId); stop(); });
    hero.addEventListener('pointerup', e => { if (!dragging) return; const end=e.clientX; if (Math.abs(end-startX)>34) apply(index + (end<startX?1:-1)); dragging=false; startX=null; start(); });
    hero.addEventListener('pointercancel', () => { dragging=false; start(); });
    hero.addEventListener('touchstart', e => { startX=e.changedTouches?.[0]?.clientX ?? null; stop(); }, {passive:true});
    hero.addEventListener('touchend', e => { const end=e.changedTouches?.[0]?.clientX ?? startX; if(startX!==null && Math.abs(end-startX)>34) apply(index+(end<startX?1:-1)); startX=null; start(); }, {passive:true});
    start();
  };

  adminTabs = function() {
    const groups = [{ title:'Vận hành', items:[['overview','Tổng quan'],['products','Kho xe'],['leads','Form khách'],['chats','Chat trực tuyến'],['accessories','Phụ kiện'],['security','Đổi mật khẩu']] }];
    if (state.admin.role === 'admin') groups.push(
      { title:'Nội dung & giao diện', items:[['categories','Danh mục sản phẩm'],['home_layout','Trang chủ & khối nội dung'],['promotions','Khuyến mại'],['site','Theme Studio'],['contacts','Liên hệ & nút nổi'],['notices','Thông báo nổi bật'],['policies','Chính sách']] },
      { title:'Quảng cáo & AI', items:[['marketing_ai','Pixel & Chatbot AI'],['analytics','Lượt truy cập']] },
      { title:'Hệ thống', items:[['users','Nhân viên'],['logs','Nhật ký hệ thống']] }
    );
    return groups;
  };
  const loadAdminTabV13 = loadAdminTab;
  loadAdminTab = async function(tab) {
    const main = $('#adminMain');
    if (tab === 'categories') return adminCategories(main);
    if (tab === 'home_layout') return adminHomeLayout(main);
    if (tab === 'security') return adminSecurity(main);
    return loadAdminTabV13(tab);
  };

  async function adminCategories(main) {
    const siteData = await request('/api/admin/site'); const categories = categoryDefinitions();
    main.innerHTML = `<div class="admin-page-head"><div><span>Cấu trúc kho hàng</span><h1 class="admin-title">Danh mục sản phẩm</h1><p class="admin-sub">Thêm, sửa, sắp xếp hoặc ẩn danh mục. Ngoài website, chỉ danh mục vừa bật vừa có sản phẩm mới xuất hiện.</p></div><div class="admin-page-badge">Hiển thị theo tồn kho</div></div><form id="categoriesForm" class="admin-product-form admin-pro-form"><div id="categoryRows" class="stack-editor"></div><button id="addCategory" type="button" class="small-btn">+ Thêm danh mục</button><button class="btn btn-primary" style="margin-top:16px">Lưu danh mục</button></form>`;
    let rows = categories.map(x => ({...x}));
    const render = () => {
      $('#categoryRows').innerHTML = rows.map((row,index) => `<div class="editor-row category-editor-row"><div class="form-three"><div class="field"><label>Tên hiển thị</label><input data-field="label" data-index="${index}" value="${escapeHTML(row.label)}" required></div><div class="field"><label>Mã danh mục</label><input data-field="id" data-index="${index}" value="${escapeHTML(row.id)}" pattern="[a-zA-Z0-9_-]+" required><small class="field-help">Không dấu, không khoảng trắng.</small></div><div class="field"><label>Icon</label><input data-field="icon" data-index="${index}" value="${escapeHTML(row.icon || '🏍️')}"></div><div class="field"><label>Thứ tự</label><input data-field="sort" data-index="${index}" type="number" value="${Number(row.sort || index+1)}"></div><div class="field"><label class="admin-check"><input data-field="visible" data-index="${index}" type="checkbox" ${row.visible!==false?'checked':''}><span>✓</span> Cho phép hiển thị</label></div><div class="field editor-row-action"><button type="button" class="small-btn danger remove-category" data-index="${index}" ${rows.length<=1?'disabled':''}>Xoá danh mục</button></div></div></div>`).join('');
      $$('#categoryRows input').forEach(input => input.addEventListener('input', () => { const r=rows[Number(input.dataset.index)]; const key=input.dataset.field; r[key]=key==='visible'?input.checked:input.value; }));
      $$('.remove-category').forEach(button => button.onclick=()=>{ rows.splice(Number(button.dataset.index),1); render(); });
    };
    render();
    $('#addCategory').onclick=()=>{ rows.push({id:`category_${Date.now()}`,label:'Danh mục mới',icon:'🏍️',visible:true,sort:rows.length+1});render(); };
    $('#categoriesForm').onsubmit=async e=>{e.preventDefault();const normalized=rows.map((row,index)=>({id:String(row.id||'').replace(/[^a-z0-9_-]/gi,'').slice(0,80),label:String(row.label||'').trim().slice(0,80),icon:String(row.icon||'🏍️').trim().slice(0,12),visible:row.visible!==false,sort:Number(row.sort||index+1)})).filter(row=>row.id&&row.label);if(!normalized.length)return notify('Cần ít nhất một danh mục.');if(new Set(normalized.map(x=>x.id)).size!==normalized.length)return notify('Mã danh mục bị trùng.');try{const out=await request('/api/admin/site',{method:'PUT',body:{categories_json:JSON.stringify(normalized)}});state.site=out.site;notify('Đã lưu danh mục.');}catch(error){notify(error.message);}};
  }

  async function adminHomeLayout(main) {
    const data=await request('/api/admin/site'); const site=data.site; let blocks=parseConfigArray(site.trust_blocks_json,V14_DEFAULT_TRUST).map(x=>({...x}));
    main.innerHTML=`<div class="admin-page-head"><div><span>Trang chủ</span><h1 class="admin-title">Khối nội dung & Hero</h1><p class="admin-sub">Chỉnh tốc độ Hero, các khối lợi ích dưới Hero và quyền xin vị trí khách.</p></div><div class="admin-page-badge">Nội dung linh hoạt</div></div><form id="homeLayoutForm" class="admin-product-form admin-pro-form"><fieldset class="fieldset"><legend>Hero nhiều ảnh</legend><div class="form-two"><div class="field"><label>Tự chuyển ảnh (giây)</label><input name="hero_autoplay_seconds" type="number" min="3" max="20" value="${Number(site.hero_autoplay_seconds || 5)}"><small class="field-help">Ảnh Hero được upload trong Theme Studio → Trang chủ & ảnh.</small></div><div class="field"><label>Hiệu ứng kéo / vuốt</label><input value="Máy tính: kéo chuột • Điện thoại: vuốt ngang" disabled></div></div></fieldset><fieldset class="fieldset"><legend>Khối lợi ích dưới Hero</legend><div id="trustRows" class="stack-editor"></div><button type="button" id="addTrust" class="small-btn">+ Thêm khối</button></fieldset><fieldset class="fieldset"><legend>Vị trí khách hàng (tùy chọn)</legend><div class="form-two"><div class="field"><label class="admin-check"><input name="location_capture_enabled" type="checkbox" ${site.location_capture_enabled===true||site.location_capture_enabled==='true'?'checked':''}><span>✓</span> Cho phép khách tự chọn chia sẻ vị trí gần đúng</label><small class="field-help">Website không tự lấy vị trí. Chỉ lấy sau khi khách tick đồng ý trong form.</small></div><div class="field"><label>Nội dung xin phép</label><textarea name="location_consent_text">${escapeHTML(site.location_consent_text || '')}</textarea></div></div></fieldset><button class="btn btn-primary">Lưu trang chủ</button></form>`;
    const renderBlocks=()=>{ $('#trustRows').innerHTML=blocks.map((block,index)=>`<div class="editor-row trust-editor-row"><div class="form-three"><div class="field"><label>Icon</label><input data-field="icon" data-index="${index}" value="${escapeHTML(block.icon||'✓')}"></div><div class="field"><label>Tiêu đề</label><input data-field="title" data-index="${index}" value="${escapeHTML(block.title||'')}"></div><div class="field"><label>Nội dung</label><input data-field="text" data-index="${index}" value="${escapeHTML(block.text||'')}"></div><div class="field"><label>Thứ tự</label><input data-field="sort" data-index="${index}" type="number" value="${Number(block.sort||index+1)}"></div><div class="field"><label class="admin-check"><input data-field="visible" data-index="${index}" type="checkbox" ${block.visible!==false?'checked':''}><span>✓</span> Hiển thị</label></div><div class="field editor-row-action"><button type="button" class="small-btn danger remove-trust" data-index="${index}">Xoá</button></div></div></div>`).join(''); $$('#trustRows input').forEach(input=>input.addEventListener('input',()=>{const item=blocks[Number(input.dataset.index)];const key=input.dataset.field;item[key]=key==='visible'?input.checked:input.value;}));$$('.remove-trust').forEach(button=>button.onclick=()=>{blocks.splice(Number(button.dataset.index),1);renderBlocks();});};
    renderBlocks(); $('#addTrust').onclick=()=>{blocks.push({icon:'✦',title:'Khối nội dung mới',text:'Nội dung có thể sửa trong Admin.',visible:true,sort:blocks.length+1});renderBlocks();};
    $('#homeLayoutForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);const normalized=blocks.map((block,index)=>({icon:String(block.icon||'✓').slice(0,12),title:String(block.title||'').trim().slice(0,100),text:String(block.text||'').trim().slice(0,220),visible:block.visible!==false,sort:Number(block.sort||index+1)})).filter(x=>x.title);try{const out=await request('/api/admin/site',{method:'PUT',body:{hero_autoplay_seconds:Number(fd.get('hero_autoplay_seconds')||5),location_capture_enabled:fd.get('location_capture_enabled')==='on',location_consent_text:fd.get('location_consent_text')||'',trust_blocks_json:JSON.stringify(normalized)}});state.site=out.site;notify('Đã lưu nội dung trang chủ.');}catch(error){notify(error.message);}};
  }

  async function adminSecurity(main) {
    main.innerHTML=`<div class="admin-page-head"><div><span>Bảo mật tài khoản</span><h1 class="admin-title">Đổi mật khẩu</h1><p class="admin-sub">Mật khẩu mới cần tối thiểu 8 ký tự. Nhân viên chỉ có thể đổi mật khẩu của chính mình; admin có thể đặt lại mật khẩu nhân viên trong mục Nhân viên.</p></div><div class="admin-page-badge">Bảo mật</div></div><div class="admin-card security-card"><form id="changePasswordForm" class="admin-product-form"><div class="form-two"><div class="field"><label>Mật khẩu hiện tại</label><input name="current_password" type="password" required></div><div class="field"><label>Mật khẩu mới</label><input name="new_password" type="password" minlength="8" required></div><div class="field"><label>Nhập lại mật khẩu mới</label><input name="confirm_password" type="password" minlength="8" required></div></div><button class="btn btn-primary">Đổi mật khẩu</button></form></div>`;
    $('#changePasswordForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);if(fd.get('new_password')!==fd.get('confirm_password'))return notify('Mật khẩu nhập lại chưa khớp.');try{await request('/api/admin/password',{method:'POST',body:{current_password:fd.get('current_password'),new_password:fd.get('new_password')}});e.target.reset();notify('Đã đổi mật khẩu.');}catch(error){notify(error.message);}};
  }

  adminUsers = async function(main) {
    const data=await request('/api/admin/users');
    main.innerHTML=`<div class="admin-toolbar"><div><h1 class="admin-title">Nhân viên</h1><p class="admin-sub">Nhân viên chỉ thêm/sửa xe, xử lý form và chat. Không có quyền xoá hay chỉnh website.</p></div><button id="addUser" class="btn btn-primary">+ Thêm nhân viên</button></div><div class="admin-card"><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Vai trò</th><th>Trạng thái</th><th></th></tr></thead><tbody>${data.users.map(user=>`<tr><td><b>${escapeHTML(user.full_name)}</b></td><td>${escapeHTML(user.username)}</td><td>${user.role==='admin'?'Chủ cửa hàng':'Nhân viên'}</td><td>${user.active?'Đang hoạt động':'Đã khoá'}</td><td>${user.role==='employee'?`<button class="small-btn reset-user-password" data-id="${user.id}" data-name="${escapeHTML(user.full_name)}">Đặt lại mật khẩu</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>`;
    $('#addUser').onclick=()=>{const modal=adminModal('Thêm nhân viên',`<form id="userForm" class="admin-product-form"><div class="field"><label>Họ và tên</label><input name="full_name" required></div><div class="field"><label>Tên đăng nhập</label><input name="username" required></div><div class="field"><label>Mật khẩu ban đầu</label><input name="password" type="password" minlength="8" required></div><button class="btn btn-primary">Tạo tài khoản</button></form>`);$('#userForm',modal).onsubmit=async e=>{e.preventDefault();try{await request('/api/admin/users',{method:'POST',body:Object.fromEntries(new FormData(e.target).entries())});notify('Đã tạo tài khoản nhân viên.');modal.remove();document.body.classList.remove('modal-open');adminUsers(main);}catch(error){notify(error.message);}};};
    $$('.reset-user-password').forEach(button=>button.onclick=()=>{const modal=adminModal(`Đổi mật khẩu: ${button.dataset.name}`,`<form id="resetStaffPassword" class="admin-product-form"><div class="field"><label>Mật khẩu mới</label><input name="new_password" type="password" minlength="8" required></div><div class="field"><label>Nhập lại mật khẩu</label><input name="confirm" type="password" minlength="8" required></div><button class="btn btn-primary">Lưu mật khẩu mới</button></form>`);$('#resetStaffPassword',modal).onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.target);if(fd.get('new_password')!==fd.get('confirm'))return notify('Mật khẩu nhập lại chưa khớp.');try{await request(`/api/admin/users/${button.dataset.id}/password`,{method:'PUT',body:{new_password:fd.get('new_password')}});notify('Đã đổi mật khẩu nhân viên.');modal.remove();document.body.classList.remove('modal-open');}catch(error){notify(error.message);}};});
  };

  // Luồng xử lý cuối: chọn ✓ Đã xong sẽ xác nhận và sau đó chỉ đọc, không mở lại / trả lời tiếp.
  adminLeads = async function(main) {
    const users=state.admin.role==='admin'?(await request('/api/admin/users')).users:[];
    main.innerHTML=`<div class="admin-toolbar admin-toolbar-pro"><div><span class="admin-kicker">CSKH</span><h1 class="admin-title">Form khách hàng</h1><p class="admin-sub">Lọc theo ngày, trạng thái và nhân viên. Form đã hoàn thành chỉ đọc lại.</p></div><div class="admin-filter-row admin-filter-pro"><div class="admin-filter-title"><span>⌁</span><div><b>Bộ lọc danh sách</b><small>Theo dõi form mới theo thời gian thực</small></div></div><label class="filter-control"><span>Trạng thái</span><select id="leadStatus"><option value="">Tất cả trạng thái</option><option value="new">Chưa xử lý</option><option value="in_progress">Đang xử lý</option><option value="done">Đã xong</option></select></label>${state.admin.role==='admin'?`<label class="filter-control"><span>Nhân viên</span><select id="leadAssigned"><option value="">Tất cả nhân viên</option>${users.filter(u=>u.role==='employee').map(u=>`<option value="${u.id}">${escapeHTML(u.full_name)}</option>`).join('')}</select></label>`:''}<label class="filter-control"><span>Từ ngày</span><input id="leadFrom" type="date"></label><label class="filter-control"><span>Đến ngày</span><input id="leadTo" type="date"></label><button type="button" id="leadReset" class="filter-reset">Xóa lọc</button></div></div><div id="leadRows" class="admin-card admin-data-card"></div>`;
    async function load(){const qs=new URLSearchParams();if($('#leadStatus').value)qs.set('status',$('#leadStatus').value);if($('#leadFrom').value)qs.set('from',$('#leadFrom').value);if($('#leadTo').value)qs.set('to',$('#leadTo').value);if($('#leadAssigned')?.value)qs.set('assigned_to',$('#leadAssigned').value);const data=await request(`/api/admin/leads?${qs}`);$('#leadRows').innerHTML=`<div class="admin-table-wrap"><table class="admin-table pro-table"><thead><tr><th>Khách</th><th>Nhu cầu</th><th>Ngày</th><th>Nhân viên</th><th>Trạng thái</th><th></th></tr></thead><tbody>${data.leads.map(lead=>{const done=lead.status==='done';return `<tr class="${done?'row-done':''}"><td><b>${escapeHTML(lead.name)}</b><br><a href="tel:${escapeHTML(lead.phone)}">${escapeHTML(lead.phone)}</a></td><td><b>${escapeHTML(lead.type)}</b><br><span class="lead-payment">${escapeHTML(paymentPlanLabel(lead.payment_plan))}${lead.down_payment?` • ${escapeHTML(lead.down_payment)}`:''}</span>${lead.note?`<br><span class="muted">${escapeHTML(lead.note)}</span>`:''}${leadLocationHTML(lead.location_text)}</td><td>${escapeHTML(vietnamTime(lead.created_at))}</td><td>${state.admin.role==='admin'?`<select class="lead-assignee" data-id="${lead.id}" ${done?'disabled':''}><option value="">Chưa gán</option>${users.filter(u=>u.role==='employee').map(u=>`<option value="${u.id}" ${lead.assigned_to===u.id?'selected':''}>${escapeHTML(u.full_name)}</option>`).join('')}</select>`:escapeHTML(lead.assigned_name||'')}</td><td>${done?`<span class="done-badge">✓ Đã xong</span>`:`<select class="lead-state" data-id="${lead.id}"><option value="new" ${lead.status==='new'?'selected':''}>Chưa xử lý</option><option value="in_progress" ${lead.status==='in_progress'?'selected':''}>Đang xử lý</option><option value="done">✓ Đã xong</option></select>`}</td><td>${state.admin.role==='admin'?`<button class="small-btn danger delete-lead" data-id="${lead.id}">Xoá</button>`:''}</td></tr>`;}).join('')||'<tr><td colspan="6" class="admin-empty">Chưa có form phù hợp.</td></tr>'}</tbody></table></div>`;
      $$('.lead-state').forEach(select=>select.onchange=async()=>{const row=select.closest('tr');const status=select.value;if(status==='done'&&!confirm('Xác nhận đánh dấu form này đã xử lý xong? Sau đó form chỉ đọc lại, không thể mở lại.')){select.value='in_progress';return;}const payload={status};if(state.admin.role==='admin')payload.assigned_to=$('.lead-assignee',row)?.value||null;try{await request(`/api/admin/leads/${select.dataset.id}`,{method:'PUT',body:payload});notify(status==='done'?'Đã hoàn tất form.':'Đã cập nhật form.');load();}catch(error){notify(error.message);}});
      $$('.lead-assignee').forEach(select=>select.onchange=async()=>{try{await request(`/api/admin/leads/${select.dataset.id}`,{method:'PUT',body:{status:'in_progress',assigned_to:select.value||null}});notify('Đã gán nhân viên.');}catch(error){notify(error.message);}});
      $$('.delete-lead').forEach(button=>button.onclick=async()=>{if(!confirm('Xoá form này?'))return;try{await request(`/api/admin/leads/${button.dataset.id}`,{method:'DELETE'});load();}catch(error){notify(error.message);}});
    }
    ['leadStatus','leadAssigned','leadFrom','leadTo'].forEach(id=>$(`#${id}`)&&($(`#${id}`).onchange=load));
    $('#leadReset')?.addEventListener('click',()=>{ ['leadStatus','leadAssigned','leadFrom','leadTo'].forEach(id=>{ const field=$(`#${id}`); if(field) field.value=''; }); load(); });
    await load();
    clearInterval(window.__tamAnAdminLeadTimer); window.__tamAnAdminLeadTimer=setInterval(()=>{ if ($('#leadRows')) load().catch(()=>{}); },8000);
  };

  adminChats = async function(main) {
    const users=state.admin.role==='admin'?(await request('/api/admin/users')).users:[];
    main.innerHTML=`<div class="admin-toolbar admin-toolbar-pro"><div><span class="admin-kicker">Hộp thư</span><h1 class="admin-title">Chat trực tuyến</h1><p class="admin-sub">Cuộn riêng vùng tin nhắn như Messenger. Chat đã xong chỉ xem lại.</p></div><button id="chatSound" class="small-btn">Bật chuông chat</button></div><div class="admin-filter-row admin-filter-pro"><div class="admin-filter-title"><span>⌁</span><div><b>Lọc hội thoại</b><small>Danh sách tự cập nhật mỗi 8 giây</small></div></div><label class="filter-control"><span>Trạng thái</span><select id="chatStatus"><option value="">Tất cả</option><option value="open">Đang mở</option><option value="done">Đã xong</option></select></label>${state.admin.role==='admin'?`<label class="filter-control"><span>Nhân viên</span><select id="chatAssigned"><option value="">Tất cả nhân viên</option>${users.filter(u=>u.role==='employee').map(u=>`<option value="${u.id}">${escapeHTML(u.full_name)}</option>`).join('')}</select></label>`:''}<label class="filter-control"><span>Từ ngày</span><input id="chatFrom" type="date"></label><label class="filter-control"><span>Đến ngày</span><input id="chatTo" type="date"></label></div><div class="admin-chat"><div id="conversationList" class="chat-list-admin"></div><div id="conversationThread" class="chat-admin-thread"><div class="admin-empty">Chọn hội thoại để xem.</div></div></div>`;
    let selected=null,soundOn=false;$('#chatSound').onclick=()=>{soundOn=true;notify('Đã bật chuông chat cho tab này.');};
    const beep=()=>{if(!soundOn)return;try{const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);g.gain.value=.08;o.frequency.value=720;o.start();o.stop(c.currentTime+.12);}catch{}};
    async function openThread(id){selected=id;const data=await request(`/api/admin/conversations/${id}`);const conv=data.conversation;const done=conv.status==='done';$('#conversationThread').innerHTML=`<div class="chat-body admin-message-scroll">${data.messages.map(m=>`<div class="chat-msg ${escapeHTML(m.sender_type)}"><small>${escapeHTML(m.sender_type==='visitor'?'Khách':(m.sender_name||'Tâm An'))}</small>${escapeHTML(m.body)}</div>`).join('')}</div><div class="chat-thread-actions"><div class="form-two">${done?`<span class="done-badge">✓ Đã xong</span>`:`<select id="conversationState"><option value="open" selected>Đang mở</option><option value="done">✓ Đã xong</option></select>`}${state.admin.role==='admin'?`<select id="conversationAssignee" ${done?'disabled':''}><option value="">Chưa gán</option>${users.filter(u=>u.role==='employee').map(u=>`<option value="${u.id}" ${conv.assigned_to===u.id?'selected':''}>${escapeHTML(u.full_name)}</option>`).join('')}</select>`:`<input value="${escapeHTML(conv.assigned_name||state.admin.name)}" disabled>`}</div>${done?`<div class="thread-read-only">Hội thoại đã hoàn thành — chỉ xem lại.</div>`:`<form id="replyForm" class="chat-form"><input name="body" placeholder="Trả lời với tên ${escapeHTML(state.admin.name)}…"><button>Gửi</button></form>`}${state.admin.role==='admin'?`<button id="deleteConversation" class="small-btn danger">Xoá hội thoại</button>`:''}</div>`;const body=$('.chat-body',$('#conversationThread'));if(body)body.scrollTop=body.scrollHeight;
      $('#conversationState')?.addEventListener('change',async()=>{const status=$('#conversationState').value;if(status==='done'&&!confirm('Xác nhận hoàn tất hội thoại? Sau đó chỉ xem lại, không thể nhắn thêm.')){ $('#conversationState').value='open'; return;}try{const payload={status};if(state.admin.role==='admin')payload.assigned_to=$('#conversationAssignee')?.value||null;await request(`/api/admin/conversations/${id}`,{method:'PUT',body:payload});notify(status==='done'?'Đã hoàn tất hội thoại.':'Đã cập nhật.');refresh(true);openThread(id);}catch(error){notify(error.message);}});
      $('#conversationAssignee')?.addEventListener('change',async()=>{try{await request(`/api/admin/conversations/${id}`,{method:'PUT',body:{status:'open',assigned_to:$('#conversationAssignee').value||null}});notify('Đã gán nhân viên.');}catch(error){notify(error.message);}});
      $('#replyForm')?.addEventListener('submit',async e=>{e.preventDefault();const input=$('input',e.target),body=input.value.trim();if(!body)return;try{await request(`/api/admin/conversations/${id}/messages`,{method:'POST',body:{body}});input.value='';openThread(id);refresh(true);}catch(error){notify(error.message);}});
      $('#deleteConversation')?.addEventListener('click',async()=>{if(!confirm('Xoá toàn bộ hội thoại?'))return;try{await request(`/api/admin/conversations/${id}`,{method:'DELETE'});selected=null;$('#conversationThread').innerHTML='<div class="admin-empty">Đã xoá hội thoại.</div>';refresh(true);}catch(error){notify(error.message);}});
    }
    async function refresh(silent=false){const qs=new URLSearchParams();if($('#chatStatus').value)qs.set('status',$('#chatStatus').value);if($('#chatFrom').value)qs.set('from',$('#chatFrom').value);if($('#chatTo').value)qs.set('to',$('#chatTo').value);if($('#chatAssigned')?.value)qs.set('assigned_to',$('#chatAssigned').value);const data=await request(`/api/admin/conversations?${qs}`);const old=$('#conversationList').dataset.ids||'',now=data.conversations.map(c=>`${c.id}:${c.updated_at}`).join(',');if(old&&old!==now&&!silent)beep();$('#conversationList').dataset.ids=now;$('#conversationList').innerHTML=data.conversations.map(c=>`<div class="chat-list-item ${selected===c.id?'active':''}" data-id="${c.id}"><b>${escapeHTML(c.visitor_name||'Khách')} ${c.status==='done'?'✓':''}</b><span>${escapeHTML(c.assigned_name||'Chưa gán')} • ${escapeHTML(c.last_message||'')}</span></div>`).join('')||'<div class="admin-empty">Chưa có hội thoại.</div>';$$('.chat-list-item').forEach(item=>item.onclick=()=>openThread(Number(item.dataset.id)));}
    ['chatStatus','chatAssigned','chatFrom','chatTo'].forEach(id=>$(`#${id}`)&&($(`#${id}`).onchange=()=>refresh()));await refresh();clearInterval(window.__tamAnAdminChatTimer);window.__tamAnAdminChatTimer=setInterval(()=>refresh(true).catch(()=>{}),9000);
  };

  async function boot() {
    try {
      await loadPublicData();
      trackVisit();
      if (location.pathname === '/admin') renderAdmin();
      else if (location.pathname === '/tra-gop') renderFinance();
      else { renderHome(); const direct = location.pathname.match(/^\/xe\/([^/]+)$/)?.[1] || new URLSearchParams(location.search).get('xe'); if (direct) setTimeout(() => openProduct(decodeURIComponent(direct)).catch(() => {}), 0); }
    } catch (error) {
      app.innerHTML = `<main class="admin-login"><div class="login-card"><img src="/assets/logo.jpg" alt=""><h1>Không tải được website</h1><p>${escapeHTML(error.message)}</p><button class="btn btn-primary" onclick="location.reload()">Thử lại</button></div></main>`;
    }
  }
  boot();
})();
