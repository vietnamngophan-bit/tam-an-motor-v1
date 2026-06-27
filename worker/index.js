const CATEGORIES = [
  ['motor_new', 'Xe máy mới'],
  ['motor_used', 'Xe máy cũ'],
  ['electric_new', 'Xe điện mới'],
  ['electric_used', 'Xe điện cũ'],
];

const DEFAULT_SITE = {
  brand_name: 'XE MÁY TÂM AN NOMURA',
  page_title: 'Xe Máy Tâm An Nomura | Xe mới, xe cũ, trả góp',
  tagline: 'Chọn xe ưng ý. Lên đường an tâm.',
  hero_title: 'Chọn xe ưng ý.\nLên đường an tâm.',
  hero_subtitle: 'Xe máy mới, xe máy cũ và xe điện tuyển chọn. Hỗ trợ trả góp minh bạch, tư vấn nhanh tại Hải Phòng.',
  hero_image: '/assets/tam-an-promo.jpg',
  showroom_image: '/assets/showroom.jpg',
  logo_url: '/assets/logo.jpg',
  favicon_url: '/assets/logo.jpg',
  hotline: '0856 262 886',
  zalo_url: 'https://zalo.me/0856262886',
  messenger_url: '',
  facebook_url: '',
  tiktok_url: '',
  youtube_url: '',
  floating_primary_action: 'call',
  floating_show_zalo: true,
  floating_show_messenger: true,
  floating_show_facebook: false,
  floating_show_tiktok: false,
  floating_show_chat: true,
  floating_pulse_enabled: true,
  floating_pulse_speed: 'normal',
  floating_call_icon: 'phone', floating_call_icon_url: '', floating_call_color: '#d61726', floating_call_shape: 'rounded', floating_call_label: 'Gọi ngay',
  floating_zalo_icon: 'zalo', floating_zalo_icon_url: '', floating_zalo_color: '#157ee8', floating_zalo_shape: 'rounded',
  floating_messenger_icon: 'messenger', floating_messenger_icon_url: '', floating_messenger_color: '#1478f2', floating_messenger_shape: 'rounded',
  floating_facebook_icon: 'facebook', floating_facebook_icon_url: '', floating_facebook_color: '#1877f2', floating_facebook_shape: 'rounded',
  floating_tiktok_icon: 'tiktok', floating_tiktok_icon_url: '', floating_tiktok_color: '#151515', floating_tiktok_shape: 'rounded',
  floating_chat_icon: 'chat', floating_chat_icon_url: '', floating_chat_color: '#c81924', floating_chat_shape: 'rounded', floating_chat_label: 'Tư vấn',
  address: 'Cổng phụ KCN Nomura, Hải Phòng',
  map_embed_url: 'https://www.google.com/maps?q=C%E1%BB%95ng%20ph%E1%BB%A5%20KCN%20Nomura%20H%E1%BA%A3i%20Ph%C3%B2ng&output=embed',
  business_hours: 'Bán hàng: 08:00 – 21:00\nDịch vụ: 08:00 – 17:30',
  support_email: 'hethongxetaman@gmail.com',
  primary_color: '#c81924',
  accent_color: '#ff6b76',
  background_color: '#ffffff',
  text_color: '#1b1214',
  body_font: 'Be Vietnam Pro',
  heading_font: 'Barlow Condensed',
  body_font_size: 16,
  heading_scale: 1,
  body_line_height: 1.55,
  corner_radius: 22,
  promo_title: 'Ưu đãi đang diễn ra',
  promo_text: 'Liên hệ Tâm An để nhận thông tin quà tặng, hỗ trợ hồ sơ và ưu đãi theo từng mẫu xe.',
  promo_image: '/assets/tam-an-promo.jpg',
  delivery_title: 'Hỗ trợ giao xe tận nơi',
  delivery_text: 'Tư vấn quy trình giao xe và hồ sơ từ xa. Liên hệ để được báo chi tiết theo khu vực.',
  installment_title: 'Mua xe rõ ràng. Chọn phương án phù hợp.',
  installment_text: 'Điền thông tin để Tâm An tư vấn hồ sơ, khoản trả trước và mẫu xe phù hợp. Không cam kết duyệt khi chưa kiểm tra hồ sơ.',
  installment_image: '/assets/tam-an-promo.jpg',
  installment_docs: 'CCCD còn hiệu lực\nSố điện thoại chính chủ\nThông tin nơi ở hoặc nơi làm việc (khi cần)\nKhoản trả trước theo phương án đã tư vấn',
  installment_down_payments: 'Từ 3 triệu\nTừ 5 triệu\nTừ 7 triệu\nTừ 10 triệu\nTheo tư vấn',
  installment_steps: 'Đăng ký tư vấn|Liên hệ hotline hoặc để lại thông tin trực tuyến.\nNộp hồ sơ|Nhân viên hướng dẫn giấy tờ theo từng trường hợp.\nThẩm định|Đơn vị tài chính kiểm tra hồ sơ theo quy trình.\nNhận xe|Hoàn tất thủ tục và bàn giao xe theo thoả thuận.',
  installment_faqs: 'Khi mua xe trả góp cần mang theo giấy tờ gì?|Tối thiểu cần CCCD và số điện thoại chính chủ. Tâm An sẽ hướng dẫn giấy tờ phù hợp từng hồ sơ.\nĐăng ký trả góp có phát sinh phí gì không?|Khoản phí, lãi và lịch trả được nhân viên tư vấn rõ trước khi khách quyết định.\nNợ xấu có mua trả góp được không?|Tâm An không cam kết duyệt khi chưa kiểm tra hồ sơ thực tế.\nThời gian thẩm định hồ sơ mất bao lâu?|Tùy thời điểm và hồ sơ. Nhân viên sẽ cập nhật kết quả ngay khi có phản hồi.',
  meta_pixel_id: '',
  tiktok_pixel_id: '',
  ai_enabled: false,
  ai_provider: 'gemini',
  ai_model: 'gemini-3.1-flash-lite',
  ai_name: 'Tâm An AI',
  ai_greeting: 'Chào anh/chị, Tâm An AI có thể hỗ trợ tìm xe, thông tin trả góp và lịch hẹn. Anh/chị đang quan tâm mẫu xe nào ạ?',
  ai_knowledge: 'Không cam kết duyệt hồ sơ hoặc giá cuối cùng khi chưa có nhân viên xác nhận. Khi khách muốn gặp nhân viên, đặt xe, giữ xe, khiếu nại hoặc hỏi hồ sơ cụ thể thì chuyển người thật.',
  ai_handoff_words: 'gặp nhân viên, gọi lại, đặt xe, giữ xe, khiếu nại, hồ sơ của tôi, nợ xấu, giá chốt',
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY CHECK (id=1), data TEXT NOT NULL, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'employee', active INTEGER NOT NULL DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, brand TEXT, category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'in_stock', price INTEGER, old_price INTEGER, year INTEGER, mileage INTEGER, engine TEXT, documents TEXT, description TEXT, installment_from INTEGER, bad_debt_from INTEGER, images_json TEXT NOT NULL DEFAULT '[]', colors_json TEXT NOT NULL DEFAULT '[]', versions_json TEXT NOT NULL DEFAULT '[]', featured INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_by INTEGER, updated_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS promotions (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT, image_url TEXT, active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS accessories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, price INTEGER, image_url TEXT, description TEXT, published INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS policies (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL DEFAULT 'consultation', name TEXT NOT NULL, phone TEXT NOT NULL, note TEXT, payment_plan TEXT, down_payment TEXT, product_id INTEGER, status TEXT NOT NULL DEFAULT 'new', assigned_to INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS conversations (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_key TEXT UNIQUE NOT NULL, visitor_name TEXT, status TEXT NOT NULL DEFAULT 'open', assigned_to INTEGER, ai_count INTEGER NOT NULL DEFAULT 0, ai_day TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS chat_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, conversation_id INTEGER NOT NULL, sender_type TEXT NOT NULL, sender_name TEXT, body TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, actor_id INTEGER, actor_name TEXT, action TEXT NOT NULL, entity_type TEXT, entity_id TEXT, detail TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS page_views (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_key TEXT, path TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category, published, status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_conv ON chat_messages(conversation_id, created_at);
`;

let initPromise;
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
function text(data, status = 200) { return new Response(data, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } }); }
function asNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function parseJSON(v, fallback) { try { return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
function safeStr(v, max = 10000) { return String(v ?? '').trim().slice(0, max); }
async function ensureLeadColumns(env) {
  const info = await env.DB.prepare('PRAGMA table_info(leads)').all();
  const cols = new Set((info.results || []).map(row => row.name));
  if (!cols.has('payment_plan')) await env.DB.exec('ALTER TABLE leads ADD COLUMN payment_plan TEXT');
  if (!cols.has('down_payment')) await env.DB.exec('ALTER TABLE leads ADD COLUMN down_payment TEXT');
}
function slugify(s) { return safeStr(s, 160).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `xe-${Date.now()}`; }

async function ensureSchema(env) {
  if (!initPromise) initPromise = (async () => {
    await env.DB.exec(SCHEMA);
    await ensureLeadColumns(env);
    const existing = await env.DB.prepare('SELECT id FROM site_settings WHERE id=1').first();
    if (!existing) await env.DB.prepare('INSERT INTO site_settings (id,data) VALUES (1,?)').bind(JSON.stringify(DEFAULT_SITE)).run();
    const p = await env.DB.prepare('SELECT COUNT(*) c FROM policies').first();
    if (!p?.c) {
      const defaults = [
        ['bao-hanh','Chính sách bảo hành','Tâm An tư vấn bảo hành theo tình trạng và từng sản phẩm. Vui lòng giữ giấy tờ mua bán để được hỗ trợ nhanh nhất.',1],
        ['huong-dan-mua-hang','Hướng dẫn mua hàng','Khách có thể xem xe tại showroom, liên hệ hotline hoặc để lại thông tin tư vấn trên website.',2],
        ['bao-mat','Chính sách bảo mật thông tin','Thông tin khách để lại chỉ được sử dụng cho mục đích tư vấn, chăm sóc và xử lý yêu cầu tại Tâm An.',3],
        ['van-chuyen-giao-nhan','Chính sách vận chuyển và giao nhận','Tâm An hỗ trợ tư vấn giao xe tận nơi. Chi phí và thời gian giao được xác nhận theo khu vực.',4],
        ['khieu-nai','Chính sách xử lý khiếu nại','Mọi phản ánh xin gửi qua hotline hoặc chat trực tuyến. Chúng tôi sẽ tiếp nhận và phản hồi sớm.',5],
        ['kiem-hang','Chính sách kiểm hàng','Khách được kiểm tra tình trạng xe và phụ kiện trước khi nhận bàn giao theo thỏa thuận.',6],
      ];
      for (const [slug,title,content,sort] of defaults) await env.DB.prepare('INSERT INTO policies (slug,title,content,sort_order) VALUES (?,?,?,?)').bind(slug,title,content,sort).run();
    }
    if (env.ADMIN_PASSWORD) {
      const admin = await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
      if (!admin) await env.DB.prepare('INSERT INTO users (username,full_name,password_hash,role) VALUES (?,?,?,?)').bind('admin','Chủ cửa hàng',await hash(env.ADMIN_PASSWORD),'admin').run();
    }
  })().catch(err => { initPromise = null; throw err; });
  return initPromise;
}

async function hash(v) {
  const bytes = new TextEncoder().encode(String(v));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2,'0')).join('');
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64json(v) { return btoa(unescape(encodeURIComponent(JSON.stringify(v)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unb64json(v) { try { return JSON.parse(decodeURIComponent(escape(atob(v.replace(/-/g,'+').replace(/_/g,'/'))))); } catch { return null; } }
async function createToken(user, env) { const body = b64json({ id:user.id, name:user.full_name, role:user.role, exp:Date.now()+1000*60*60*24*7 }); return `${body}.${await sign(body, env.SESSION_SECRET || 'change-me')}`; }
async function currentUser(req, env) {
  const cookie = req.headers.get('cookie') || '';
  const value = cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('ta_session='))?.slice(11);
  if (!value) return null;
  const [body, sig] = value.split('.'); if (!body || !sig) return null;
  if (sig !== await sign(body, env.SESSION_SECRET || 'change-me')) return null;
  const payload = unb64json(body); if (!payload || payload.exp < Date.now()) return null;
  return payload;
}
function can(user, action) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return ['product:create','product:update','lead:update','chat:reply'].includes(action);
}
async function log(env, user, action, entityType='', entityId='', detail='') {
  await env.DB.prepare('INSERT INTO audit_logs(actor_id,actor_name,action,entity_type,entity_id,detail) VALUES (?,?,?,?,?,?)')
    .bind(user?.id || null,user?.name || 'Hệ thống',action,entityType,String(entityId || ''),safeStr(detail,2000)).run();
}
async function getSite(env) {
  const row = await env.DB.prepare('SELECT data FROM site_settings WHERE id=1').first();
  return { ...DEFAULT_SITE, ...parseJSON(row?.data, {}) };
}
async function saveSite(env, patch, user) { const before = await getSite(env); const data = { ...before, ...patch }; await env.DB.prepare('UPDATE site_settings SET data=?,updated_at=CURRENT_TIMESTAMP WHERE id=1').bind(JSON.stringify(data)).run(); await log(env,user,'Cập nhật nội dung website','site','1'); return data; }

function productOut(row) {
  if (!row) return null;
  return { ...row, price:row.price==null?null:Number(row.price), old_price:row.old_price==null?null:Number(row.old_price), mileage:row.mileage==null?null:Number(row.mileage), installment_from:row.installment_from==null?null:Number(row.installment_from), bad_debt_from:row.bad_debt_from==null?null:Number(row.bad_debt_from), images:parseJSON(row.images_json,[]), colors:parseJSON(row.colors_json,[]), versions:parseJSON(row.versions_json,[]) };
}
async function productPayload(req) {
  const b = await req.json();
  const name = safeStr(b.name,160); if (!name) throw new Error('Tên xe là bắt buộc.');
  const category = CATEGORIES.some(([id])=>id===b.category) ? b.category : 'motor_new';
  const images = Array.isArray(b.images) ? b.images.filter(x=>typeof x==='string' && x).slice(0,30) : [];
  const normalizeColor = c => ({ name:safeStr(c?.name,60), hex:safeStr(c?.hex,20)||'#d71920', images:Array.isArray(c?.images)?c.images.filter(x=>typeof x==='string'&&x).slice(0,12):[] });
  const colors = Array.isArray(b.colors) ? b.colors.slice(0,20).map(normalizeColor).filter(c=>c.name) : [];
  const versions = Array.isArray(b.versions) ? b.versions.slice(0,20).map(v=>({ name:safeStr(v?.name,80), description:safeStr(v?.description,500), price:asNumber(v?.price), old_price:asNumber(v?.old_price), colors:Array.isArray(v?.colors)?v.colors.slice(0,20).map(normalizeColor).filter(c=>c.name):[] })).filter(v=>v.name) : [];
  return { name, slug:slugify(b.slug || name), brand:safeStr(b.brand,80), category, status:['in_stock','incoming','reserved','sold'].includes(b.status)?b.status:'in_stock', price:asNumber(b.price), old_price:asNumber(b.old_price), year:asNumber(b.year), mileage:asNumber(b.mileage), engine:safeStr(b.engine,60), documents:safeStr(b.documents,300), description:safeStr(b.description,5000), installment_from:asNumber(b.installment_from), bad_debt_from:asNumber(b.bad_debt_from), images, colors, versions, featured:b.featured?1:0, published:b.published===false?0:1, sort_order:asNumber(b.sort_order)||0 };
}
async function sendLeadEmail(env, site, lead) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) return;
  const subject = `[Tâm An] Yêu cầu mới: ${lead.type}`;
  const planName = {cash:'Trả thẳng',installment:'Trả góp',bad_debt:'Hồ sơ có nợ xấu / cần kiểm tra'}[lead.payment_plan] || 'Chưa chọn';
  const html = `<h2>Khách để lại yêu cầu</h2><p><b>Họ tên:</b> ${escapeHtml(lead.name)}</p><p><b>SĐT:</b> ${escapeHtml(lead.phone)}</p><p><b>Dự kiến thanh toán:</b> ${escapeHtml(planName)}${lead.down_payment ? ` — ${escapeHtml(lead.down_payment)}` : ''}</p><p><b>Nội dung:</b> ${escapeHtml(lead.note||'')}</p>`;
  try { await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({from:'Tâm An Website <onboarding@resend.dev>',to:[env.NOTIFY_EMAIL],subject,html})}); } catch {}
}
function escapeHtml(s) { return String(s||'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m])); }
function q(url,k){return url.searchParams.get(k)||''}

async function publicApi(req, env, url) {
  if (url.pathname === '/api/health') return json({ok:true,status:'ready'});
  if (url.pathname === '/api/site') {
    const [site, cats, promos, accessories, policies] = await Promise.all([
      getSite(env),
      env.DB.prepare("SELECT category,COUNT(*) count FROM products WHERE published=1 GROUP BY category").all(),
      env.DB.prepare('SELECT * FROM promotions WHERE active=1 ORDER BY sort_order,id DESC').all(),
      env.DB.prepare('SELECT * FROM accessories WHERE published=1 ORDER BY sort_order,id DESC').all(),
      env.DB.prepare('SELECT id,slug,title,sort_order FROM policies WHERE published=1 ORDER BY sort_order,id').all(),
    ]);
    return json({ok:true,site,categories:cats.results||[],promotions:promos.results||[],accessories:accessories.results||[],policies:policies.results||[]});
  }
  if (url.pathname === '/api/products') {
    const category=q(url,'category'); const search=safeStr(q(url,'search'),100).toLowerCase(); const status=q(url,'status');
    let sql='SELECT * FROM products WHERE published=1'; const binds=[];
    if (category && CATEGORIES.some(([id])=>id===category)) { sql+=' AND category=?'; binds.push(category); }
    if (status && ['in_stock','incoming','reserved','sold'].includes(status)) { sql+=' AND status=?'; binds.push(status); }
    const rows=(await env.DB.prepare(sql+' ORDER BY featured DESC,sort_order,id DESC').bind(...binds).all()).results||[];
    let data=rows.map(productOut);
    if(search) data=data.filter(p=>{ const versionWords=(p.versions||[]).flatMap(v=>[v.name,...(v.colors||[]).map(c=>c.name)]); return fuzzy(`${p.name} ${p.brand||''} ${p.category} ${(p.colors||[]).map(c=>c.name).join(' ')} ${versionWords.join(' ')}`,search); });
    return json({ok:true,products:data});
  }
  if (url.pathname.startsWith('/api/products/')) {
    const slug=decodeURIComponent(url.pathname.slice('/api/products/'.length));
    const row=await env.DB.prepare('SELECT * FROM products WHERE slug=? AND published=1').bind(slug).first();
    if(!row)return json({ok:false,error:'Không tìm thấy xe.'},404);
    const product=productOut(row);
    const related=(await env.DB.prepare('SELECT * FROM products WHERE published=1 AND id<>? AND category=? ORDER BY featured DESC,sort_order,id DESC LIMIT 6').bind(row.id,row.category).all()).results.map(productOut);
    return json({ok:true,product,related});
  }
  if (url.pathname === '/api/policies' && req.method==='GET') { return json({ok:true,policies:(await env.DB.prepare('SELECT * FROM policies WHERE published=1 ORDER BY sort_order,id').all()).results||[]}); }
  if (url.pathname.startsWith('/api/policies/') && req.method==='GET') { const slug=decodeURIComponent(url.pathname.slice('/api/policies/'.length)); const row=await env.DB.prepare('SELECT * FROM policies WHERE slug=? AND published=1').bind(slug).first(); return row?json({ok:true,policy:row}):json({ok:false,error:'Không tìm thấy bài viết'},404); }
  if (url.pathname === '/api/track' && req.method==='POST') {
    const b=await req.json(); const visitor=safeStr(b.visitor_key,80); const path=safeStr(b.path,120)||'/';
    await env.DB.prepare('INSERT INTO page_views(visitor_key,path) VALUES (?,?)').bind(visitor,path).run();
    return json({ok:true});
  }
  if (url.pathname === '/api/leads' && req.method==='POST') {
    const b=await req.json(); const name=safeStr(b.name,120), phone=safeStr(b.phone,40); if(!name||!phone)return json({ok:false,error:'Vui lòng nhập họ tên và số điện thoại.'},400);
    const note=safeStr(b.note,3000); const type=safeStr(b.type,80)||'consultation'; const productId=asNumber(b.product_id);
    const paymentPlan=['cash','installment','bad_debt'].includes(b.payment_plan) ? b.payment_plan : '';
    const downPayment=paymentPlan==='installment' ? safeStr(b.down_payment,120) : '';
    if (!paymentPlan) return json({ok:false,error:'Vui lòng chọn dự kiến thanh toán.'},400);
    if (paymentPlan==='installment' && !downPayment) return json({ok:false,error:'Vui lòng chọn mức trả trước dự kiến.'},400);
    const r=await env.DB.prepare('INSERT INTO leads(type,name,phone,note,payment_plan,down_payment,product_id) VALUES (?,?,?,?,?,?,?)').bind(type,name,phone,note,paymentPlan,downPayment,productId).run();
    const site=await getSite(env); await sendLeadEmail(env,site,{type,name,phone,note,payment_plan:paymentPlan,down_payment:downPayment});
    return json({ok:true,id:r.meta.last_row_id,message:'Tâm An đã nhận thông tin. Nhân viên sẽ liên hệ sớm.'});
  }
  if (url.pathname === '/api/chat/start' && req.method==='POST') {
    const b=await req.json(); const visitorKey=safeStr(b.visitor_key,80), visitorName=safeStr(b.visitor_name,80); if(!visitorKey)return json({ok:false,error:'Thiếu mã trò chuyện'},400);
    let conv=await env.DB.prepare('SELECT * FROM conversations WHERE visitor_key=?').bind(visitorKey).first();
    if(!conv){const r=await env.DB.prepare('INSERT INTO conversations(visitor_key,visitor_name) VALUES (?,?)').bind(visitorKey,visitorName||'Khách').run();conv=await env.DB.prepare('SELECT * FROM conversations WHERE id=?').bind(r.meta.last_row_id).first();}
    else if(visitorName&&visitorName!==conv.visitor_name){await env.DB.prepare('UPDATE conversations SET visitor_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(visitorName,conv.id).run();conv={...conv,visitor_name:visitorName};}
    return json({ok:true,conversation:conv});
  }
  if (url.pathname === '/api/chat/messages' && req.method==='GET') {
    const key=q(url,'visitor_key'); const conv=await env.DB.prepare('SELECT * FROM conversations WHERE visitor_key=?').bind(key).first(); if(!conv)return json({ok:true,messages:[],conversation:null});
    const messages=(await env.DB.prepare('SELECT * FROM chat_messages WHERE conversation_id=? ORDER BY id').bind(conv.id).all()).results||[];
    return json({ok:true,conversation:conv,messages});
  }
  if (url.pathname === '/api/chat/messages' && req.method==='POST') {
    const b=await req.json(); const visitorKey=safeStr(b.visitor_key,80), body=safeStr(b.body,2000); if(!visitorKey||!body)return json({ok:false,error:'Tin nhắn trống.'},400);
    let conv=await env.DB.prepare('SELECT * FROM conversations WHERE visitor_key=?').bind(visitorKey).first(); if(!conv)return json({ok:false,error:'Hãy bắt đầu cuộc trò chuyện trước.'},400);
    if(conv.status==='done'){await env.DB.prepare("UPDATE conversations SET status='open',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(conv.id).run();conv.status='open';}
    await env.DB.prepare('INSERT INTO chat_messages(conversation_id,sender_type,sender_name,body) VALUES (?,?,?,?)').bind(conv.id,'visitor',conv.visitor_name||'Khách',body).run();
    await env.DB.prepare('UPDATE conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(conv.id).run();
    const site=await getSite(env);
    let ai = { status:'disabled' };
    if (site.ai_enabled && !conv.assigned_to) ai = await maybeAiReply(env,site,conv,body);
    else if (conv.assigned_to) ai = { status:'human_assigned' };
    return json({ok:true,ai});
  }
  return null;
}
function fuzzy(text, q) {
  const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  const t=norm(text), needle=norm(q); if(t.includes(needle))return true;
  let i=0; for(const ch of t){if(ch===needle[i])i++;if(i===needle.length)return true;} return false;
}
function normalizedAiModel(site) {
  const configured = safeStr(site.ai_model, 100);
  // The older model identifier used by early builds is no longer the default for this project.
  if (!configured || ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'].includes(configured)) return 'gemini-3.1-flash-lite';
  return configured;
}
function conciseAiError(data, fallback = 'Gemini không phản hồi.') {
  const raw = safeStr(data?.error?.message || data?.message || fallback, 500);
  if (/reported as leaked|leaked/i.test(raw)) return 'API key Gemini đã bị Google khóa vì bị lộ. Hãy tạo key mới và cập nhật Secret GEMINI_API_KEY.';
  if (/API key not valid|invalid api key|permission|unauthenticated|forbidden|403/i.test(raw)) return 'Gemini từ chối API key. Kiểm tra lại Secret GEMINI_API_KEY và quyền của key.';
  if (/not found|404|model/i.test(raw)) return 'Model Gemini chưa hợp lệ. Đặt Model Gemini là gemini-3.1-flash-lite.';
  if (/quota|rate|429/i.test(raw)) return 'Gemini đang hết quota hoặc bị giới hạn tạm thời. Thử lại sau ít phút.';
  return raw || fallback;
}
async function buildAiPrompt(env, site, latest) {
  const products=(await env.DB.prepare("SELECT name,status,price,old_price,year,engine,description FROM products WHERE published=1 AND status<>'sold' ORDER BY featured DESC,id DESC LIMIT 18").all()).results||[];
  return `Bạn là ${site.ai_name||'Tâm An AI'}, trợ lý tư vấn cho ${site.brand_name}. Trả lời tiếng Việt lịch sự, ngắn (tối đa 90 từ), chỉ dùng dữ liệu bên dưới. Không cam kết duyệt trả góp, không xác nhận nợ xấu hay giá chốt. Khi thiếu dữ liệu hãy nói nhân viên sẽ kiểm tra.\n\nThông tin cửa hàng: ${site.address}; hotline ${site.hotline}.\nKiến thức: ${site.ai_knowledge||''}\nKho xe: ${products.map(p=>`${p.name} | ${p.status} | ${p.price?Number(p.price).toLocaleString('vi-VN')+'đ':'Liên hệ'} | ${p.year||''} | ${p.engine||''}`).join('\n')}\n\nKhách hỏi: ${latest}`;
}
async function callAi(env, site, prompt, conversation = null) {
  if (site.ai_provider === 'webhook') {
    if (!env.AI_WEBHOOK_URL) throw new Error('Chưa có Secret AI_WEBHOOK_URL cho chatbot bên thứ ba.');
    const r=await fetch(env.AI_WEBHOOK_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt,conversation_id:conversation?.id || null,visitor_name:conversation?.visitor_name || null})});
    let data={}; try { data=await r.json(); } catch {}
    if (!r.ok) throw new Error(conciseAiError(data, `Webhook trả về lỗi ${r.status}.`));
    const out=safeStr(data?.reply||data?.message,1200);
    if(!out) throw new Error('Webhook không trả về nội dung phản hồi.');
    return out;
  }
  if (!env.GEMINI_API_KEY) throw new Error('Chưa có Secret GEMINI_API_KEY trên Cloudflare Worker.');
  const model=normalizedAiModel(site);
  // v1 is Gemini's stable API version. Send the API key only server-side from the Worker secret.
  const endpoint=`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:.35,maxOutputTokens:240}})});
  let data={}; try { data=await r.json(); } catch {}
  if(!r.ok) throw new Error(conciseAiError(data, `Gemini trả về lỗi ${r.status}.`));
  const out=safeStr(data?.candidates?.[0]?.content?.parts?.map(p=>p?.text||'').join('') || data?.text,1200);
  if(!out) throw new Error('Gemini không trả về câu trả lời.');
  return out;
}
async function maybeAiReply(env, site, conv, latest) {
  const today=new Date().toISOString().slice(0,10);
  if(conv.ai_day!==today){await env.DB.prepare('UPDATE conversations SET ai_day=?,ai_count=0 WHERE id=?').bind(today,conv.id).run();conv.ai_count=0;}
  if((conv.ai_count||0)>=12)return { status:'limit' };
  const words=(site.ai_handoff_words||'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
  if(words.some(w=>latest.toLowerCase().includes(w)))return { status:'handoff' };
  try {
    const prompt=await buildAiPrompt(env,site,latest);
    const out=await callAi(env,site,prompt,conv);
    await env.DB.prepare('INSERT INTO chat_messages(conversation_id,sender_type,sender_name,body) VALUES (?,?,?,?)').bind(conv.id,'ai',site.ai_name||'Tâm An AI',out).run();
    await env.DB.prepare('UPDATE conversations SET ai_count=ai_count+1,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(conv.id).run();
    return { status:'replied' };
  } catch (error) {
    // Detailed error is kept for the admin via the audit log. Visitors only receive a neutral notice.
    await log(env,{name:'Tâm An AI'},'Lỗi chatbot AI','conversation',conv.id,error?.message || 'Unknown AI error');
    return { status:'unavailable' };
  }
}

async function adminApi(req, env, url, user) {
  if(url.pathname==='/api/admin/login'&&req.method==='POST'){
    const b=await req.json(); const username=safeStr(b.username,80)||'admin', password=safeStr(b.password,300); const row=await env.DB.prepare('SELECT * FROM users WHERE username=? AND active=1').bind(username).first();
    if(!row || row.password_hash!==await hash(password))return json({ok:false,error:'Tài khoản hoặc mật khẩu chưa đúng.'},401);
    const u={id:row.id,name:row.full_name,role:row.role}; const token=await createToken(u,env); return json({ok:true,user:u},200, {'set-cookie':`ta_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure`});
  }
  if(url.pathname==='/api/admin/logout'&&req.method==='POST')return json({ok:true},200,{'set-cookie':'ta_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure'});
  if(url.pathname==='/api/admin/me')return user?json({ok:true,user}):json({ok:false,error:'Chưa đăng nhập'},401);
  if(!user)return json({ok:false,error:'Vui lòng đăng nhập'},401);
  if(url.pathname==='/api/admin/overview'){
    const [ps,ls,cs,as,vs]=await Promise.all([
      env.DB.prepare('SELECT COUNT(*) c FROM products').first(),env.DB.prepare('SELECT COUNT(*) c FROM leads WHERE status<>\'done\'').first(),env.DB.prepare("SELECT COUNT(*) c FROM conversations WHERE status='open'").first(),env.DB.prepare('SELECT COUNT(*) c FROM accessories').first(),env.DB.prepare("SELECT COUNT(*) c FROM page_views WHERE date(created_at)>=date('now','-30 day')").first()
    ]); return json({ok:true,counts:{products:ps.c,leads:ls.c,chats:cs.c,accessories:as.c,visits:vs.c}});
  }
  if(url.pathname==='/api/admin/ai/status'&&req.method==='GET'){
    if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được kiểm tra chatbot AI.'},403);
    const site=await getSite(env);
    return json({ok:true,enabled:!!site.ai_enabled,provider:site.ai_provider||'gemini',model:normalizedAiModel(site),key_configured:site.ai_provider==='webhook'?!!env.AI_WEBHOOK_URL:!!env.GEMINI_API_KEY});
  }
  if(url.pathname==='/api/admin/ai/test'&&req.method==='POST'){
    if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được kiểm tra chatbot AI.'},403);
    const site=await getSite(env);
    try {
      const prompt=await buildAiPrompt(env,site,'Xin chào, hãy trả lời một câu ngắn để xác nhận chatbot Tâm An đang hoạt động.');
      const reply=await callAi(env,site,prompt,null);
      await log(env,user,'Kiểm tra chatbot AI','ai','test',normalizedAiModel(site));
      return json({ok:true,model:normalizedAiModel(site),reply});
    } catch (error) {
      await log(env,user,'Lỗi kiểm tra chatbot AI','ai','test',error?.message || 'Unknown AI error');
      return json({ok:false,error:error?.message || 'Không thể kết nối Gemini.'},400);
    }
  }
  if(url.pathname==='/api/admin/site'){
    if(req.method==='GET')return json({ok:true,site:await getSite(env)});
    if(req.method==='PUT'){if(!can(user,'site:update'))return json({ok:false,error:'Bạn không có quyền.'},403);const b=await req.json();return json({ok:true,site:await saveSite(env,b,user)});}
  }
  if(url.pathname==='/api/admin/upload'&&req.method==='POST'){
    if(!env.IMAGES)return json({ok:false,error:'Chưa cấu hình R2 bucket IMAGES.'},500); const form=await req.formData(); const file=form.get('file'); if(!(file instanceof File))return json({ok:false,error:'Chưa chọn ảnh.'},400); if(file.size>8*1024*1024)return json({ok:false,error:'Ảnh tối đa 8MB.'},400); if(!file.type.startsWith('image/'))return json({ok:false,error:'Chỉ nhận ảnh.'},400);
    const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').slice(0,8);const key=`uploads/${Date.now()}-${crypto.randomUUID().slice(0,8)}.${ext}`; await env.IMAGES.put(key,file.stream,{httpMetadata:{contentType:file.type}}); return json({ok:true,url:`/media/${key}`});
  }
  if(url.pathname==='/api/admin/products'){
    if(req.method==='GET'){const rows=(await env.DB.prepare('SELECT * FROM products ORDER BY updated_at DESC,id DESC').all()).results||[];return json({ok:true,products:rows.map(productOut)});}
    if(req.method==='POST'){if(!can(user,'product:create'))return json({ok:false,error:'Bạn không có quyền thêm xe.'},403);const p=await productPayload(req); const slug=await uniqueSlug(env,p.slug); const r=await env.DB.prepare('INSERT INTO products(slug,name,brand,category,status,price,old_price,year,mileage,engine,documents,description,installment_from,bad_debt_from,images_json,colors_json,versions_json,featured,published,sort_order,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(slug,p.name,p.brand,p.category,p.status,p.price,p.old_price,p.year,p.mileage,p.engine,p.documents,p.description,p.installment_from,p.bad_debt_from,JSON.stringify(p.images),JSON.stringify(p.colors),JSON.stringify(p.versions),p.featured,p.published,p.sort_order,user.id,user.id).run();await log(env,user,'Thêm sản phẩm','product',r.meta.last_row_id,p.name);return json({ok:true,id:r.meta.last_row_id});}
  }
  const prodMatch=url.pathname.match(/^\/api\/admin\/products\/(\d+)$/);
  if(prodMatch){const id=Number(prodMatch[1]);if(req.method==='PUT'){if(!can(user,'product:update'))return json({ok:false,error:'Bạn không có quyền sửa xe.'},403);const p=await productPayload(req);const slug=await uniqueSlug(env,p.slug,id);await env.DB.prepare('UPDATE products SET slug=?,name=?,brand=?,category=?,status=?,price=?,old_price=?,year=?,mileage=?,engine=?,documents=?,description=?,installment_from=?,bad_debt_from=?,images_json=?,colors_json=?,versions_json=?,featured=?,published=?,sort_order=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(slug,p.name,p.brand,p.category,p.status,p.price,p.old_price,p.year,p.mileage,p.engine,p.documents,p.description,p.installment_from,p.bad_debt_from,JSON.stringify(p.images),JSON.stringify(p.colors),JSON.stringify(p.versions),p.featured,p.published,p.sort_order,user.id,id).run();await log(env,user,'Cập nhật sản phẩm','product',id,p.name);return json({ok:true});}
    if(req.method==='DELETE'){if(user.role!=='admin')return json({ok:false,error:'Chỉ chủ cửa hàng được xoá sản phẩm.'},403);await env.DB.prepare('DELETE FROM products WHERE id=?').bind(id).run();await log(env,user,'Xoá sản phẩm','product',id);return json({ok:true});}
  }
  if(url.pathname==='/api/admin/promotions'){
    if(req.method==='GET')return json({ok:true,promotions:(await env.DB.prepare('SELECT * FROM promotions ORDER BY sort_order,id DESC').all()).results||[]});
    if(req.method==='POST'){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được quản lý khuyến mại.'},403);const b=await req.json();const r=await env.DB.prepare('INSERT INTO promotions(title,content,image_url,active,sort_order) VALUES (?,?,?,?,?)').bind(safeStr(b.title,160),safeStr(b.content,4000),safeStr(b.image_url,1000),b.active?1:0,asNumber(b.sort_order)||0).run();await log(env,user,'Thêm khuyến mại','promotion',r.meta.last_row_id);return json({ok:true,id:r.meta.last_row_id});}
  }
  const promoMatch=url.pathname.match(/^\/api\/admin\/promotions\/(\d+)$/);
  if(promoMatch){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được quản lý khuyến mại.'},403);const id=Number(promoMatch[1]);if(req.method==='PUT'){const b=await req.json();await env.DB.prepare('UPDATE promotions SET title=?,content=?,image_url=?,active=?,sort_order=? WHERE id=?').bind(safeStr(b.title,160),safeStr(b.content,4000),safeStr(b.image_url,1000),b.active?1:0,asNumber(b.sort_order)||0,id).run();await log(env,user,'Cập nhật khuyến mại','promotion',id);return json({ok:true});}if(req.method==='DELETE'){await env.DB.prepare('DELETE FROM promotions WHERE id=?').bind(id).run();await log(env,user,'Xoá khuyến mại','promotion',id);return json({ok:true});}}
  if(url.pathname==='/api/admin/accessories'){
    if(req.method==='GET')return json({ok:true,accessories:(await env.DB.prepare('SELECT * FROM accessories ORDER BY sort_order,id DESC').all()).results||[]});
    if(req.method==='POST'){if(!can(user,'product:create'))return json({ok:false,error:'Bạn không có quyền.'},403);const b=await req.json();const r=await env.DB.prepare('INSERT INTO accessories(name,price,image_url,description,published,sort_order) VALUES (?,?,?,?,?,?)').bind(safeStr(b.name,160),asNumber(b.price),safeStr(b.image_url,1000),safeStr(b.description,3000),b.published===false?0:1,asNumber(b.sort_order)||0).run();await log(env,user,'Thêm phụ kiện','accessory',r.meta.last_row_id);return json({ok:true,id:r.meta.last_row_id});}
  }
  const accMatch=url.pathname.match(/^\/api\/admin\/accessories\/(\d+)$/);
  if(accMatch){const id=Number(accMatch[1]);if(req.method==='PUT'){if(!can(user,'product:update'))return json({ok:false,error:'Bạn không có quyền.'},403);const b=await req.json();await env.DB.prepare('UPDATE accessories SET name=?,price=?,image_url=?,description=?,published=?,sort_order=? WHERE id=?').bind(safeStr(b.name,160),asNumber(b.price),safeStr(b.image_url,1000),safeStr(b.description,3000),b.published===false?0:1,asNumber(b.sort_order)||0,id).run();await log(env,user,'Cập nhật phụ kiện','accessory',id);return json({ok:true});}if(req.method==='DELETE'){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được xoá.'},403);await env.DB.prepare('DELETE FROM accessories WHERE id=?').bind(id).run();await log(env,user,'Xoá phụ kiện','accessory',id);return json({ok:true});}}
  if(url.pathname==='/api/admin/policies'){
    if(req.method==='GET')return json({ok:true,policies:(await env.DB.prepare('SELECT * FROM policies ORDER BY sort_order,id').all()).results||[]});
    if(req.method==='POST'){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được quản lý chính sách.'},403);const b=await req.json();const title=safeStr(b.title,160);if(!title)return json({ok:false,error:'Nhập tiêu đề.'},400);const r=await env.DB.prepare('INSERT INTO policies(slug,title,content,published,sort_order) VALUES (?,?,?,?,?)').bind(await uniquePolicySlug(env,slugify(b.slug||title)),title,safeStr(b.content,10000),b.published===false?0:1,asNumber(b.sort_order)||0).run();await log(env,user,'Thêm bài chính sách','policy',r.meta.last_row_id,title);return json({ok:true,id:r.meta.last_row_id});}
  }
  const polMatch=url.pathname.match(/^\/api\/admin\/policies\/(\d+)$/);
  if(polMatch){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được quản lý chính sách.'},403);const id=Number(polMatch[1]);if(req.method==='PUT'){const b=await req.json();const title=safeStr(b.title,160);await env.DB.prepare('UPDATE policies SET slug=?,title=?,content=?,published=?,sort_order=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(await uniquePolicySlug(env,slugify(b.slug||title),id),title,safeStr(b.content,10000),b.published===false?0:1,asNumber(b.sort_order)||0,id).run();await log(env,user,'Cập nhật bài chính sách','policy',id,title);return json({ok:true});}if(req.method==='DELETE'){await env.DB.prepare('DELETE FROM policies WHERE id=?').bind(id).run();await log(env,user,'Xoá bài chính sách','policy',id);return json({ok:true});}}
  if(url.pathname==='/api/admin/leads'&&req.method==='GET'){const params=[];let sql='SELECT l.*,u.full_name assigned_name FROM leads l LEFT JOIN users u ON u.id=l.assigned_to WHERE 1=1';if(q(url,'status')){sql+=' AND l.status=?';params.push(q(url,'status'));}if(q(url,'from')){sql+=' AND date(l.created_at)>=date(?)';params.push(q(url,'from'));}if(q(url,'to')){sql+=' AND date(l.created_at)<=date(?)';params.push(q(url,'to'));}if(q(url,'assigned_to')){sql+=' AND l.assigned_to=?';params.push(Number(q(url,'assigned_to')));}sql+=' ORDER BY l.updated_at DESC,l.id DESC';return json({ok:true,leads:(await env.DB.prepare(sql).bind(...params).all()).results||[]});}
  const leadMatch=url.pathname.match(/^\/api\/admin\/leads\/(\d+)$/);
  if(leadMatch){const id=Number(leadMatch[1]);if(req.method==='PUT'){if(!can(user,'lead:update'))return json({ok:false,error:'Bạn không có quyền.'},403);const b=await req.json();const existing=await env.DB.prepare('SELECT assigned_to FROM leads WHERE id=?').bind(id).first();const assigned=Object.prototype.hasOwnProperty.call(b,'assigned_to')?asNumber(b.assigned_to):existing?.assigned_to??null;const status=['new','in_progress','done'].includes(b.status)?b.status:'new';await env.DB.prepare('UPDATE leads SET status=?,assigned_to=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(status,assigned,id).run();await log(env,user,'Cập nhật form khách','lead',id,status);return json({ok:true});}if(req.method==='DELETE'){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được xoá form.'},403);await env.DB.prepare('DELETE FROM leads WHERE id=?').bind(id).run();await log(env,user,'Xoá form khách','lead',id);return json({ok:true});}}
  if(url.pathname==='/api/admin/conversations'&&req.method==='GET'){const params=[];let sql='SELECT c.*,u.full_name assigned_name,(SELECT body FROM chat_messages m WHERE m.conversation_id=c.id ORDER BY id DESC LIMIT 1) last_message FROM conversations c LEFT JOIN users u ON u.id=c.assigned_to WHERE 1=1';if(q(url,'status')){sql+=' AND c.status=?';params.push(q(url,'status'));}if(q(url,'from')){sql+=' AND date(c.updated_at)>=date(?)';params.push(q(url,'from'));}if(q(url,'to')){sql+=' AND date(c.updated_at)<=date(?)';params.push(q(url,'to'));}if(q(url,'assigned_to')){sql+=' AND c.assigned_to=?';params.push(Number(q(url,'assigned_to')));}sql+=' ORDER BY c.updated_at DESC';return json({ok:true,conversations:(await env.DB.prepare(sql).bind(...params).all()).results||[]});}
  const convMatch=url.pathname.match(/^\/api\/admin\/conversations\/(\d+)$/);
  if(convMatch){const id=Number(convMatch[1]); if(req.method==='GET'){const conv=await env.DB.prepare('SELECT c.*,u.full_name assigned_name FROM conversations c LEFT JOIN users u ON u.id=c.assigned_to WHERE c.id=?').bind(id).first();const messages=(await env.DB.prepare('SELECT * FROM chat_messages WHERE conversation_id=? ORDER BY id').bind(id).all()).results||[];return json({ok:true,conversation:conv,messages});}if(req.method==='PUT'){const b=await req.json();const existing=await env.DB.prepare('SELECT assigned_to FROM conversations WHERE id=?').bind(id).first();const status=['open','done'].includes(b.status)?b.status:'open';const assigned=Object.prototype.hasOwnProperty.call(b,'assigned_to')?asNumber(b.assigned_to):existing?.assigned_to??null;await env.DB.prepare('UPDATE conversations SET status=?,assigned_to=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(status,assigned,id).run();await log(env,user,'Cập nhật hội thoại','chat',id,status);return json({ok:true});}if(req.method==='DELETE'){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được xoá hội thoại.'},403);await env.DB.prepare('DELETE FROM chat_messages WHERE conversation_id=?').bind(id).run();await env.DB.prepare('DELETE FROM conversations WHERE id=?').bind(id).run();await log(env,user,'Xoá hội thoại','chat',id);return json({ok:true});}}
  if(url.pathname.match(/^\/api\/admin\/conversations\/\d+\/messages$/)&&req.method==='POST'){if(!can(user,'chat:reply'))return json({ok:false,error:'Bạn không có quyền.'},403);const id=Number(url.pathname.split('/')[4]);const b=await req.json();const body=safeStr(b.body,2000);if(!body)return json({ok:false,error:'Tin nhắn trống'},400);await env.DB.prepare('INSERT INTO chat_messages(conversation_id,sender_type,sender_name,body) VALUES (?,?,?,?)').bind(id,'staff',user.name,body).run();await env.DB.prepare("UPDATE conversations SET status='open',assigned_to=COALESCE(assigned_to,?),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(user.id,id).run();await log(env,user,'Trả lời khách','chat',id);return json({ok:true});}
  if(url.pathname==='/api/admin/users'){
    if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được quản lý nhân viên.'},403);
    if(req.method==='GET')return json({ok:true,users:(await env.DB.prepare('SELECT id,username,full_name,role,active,created_at FROM users ORDER BY role,id').all()).results||[]});
    if(req.method==='POST'){const b=await req.json();const username=safeStr(b.username,80), full=safeStr(b.full_name,120),pass=safeStr(b.password,300);if(!username||!full||!pass)return json({ok:false,error:'Nhập đủ tên đăng nhập, tên nhân viên và mật khẩu.'},400);try{const r=await env.DB.prepare('INSERT INTO users(username,full_name,password_hash,role) VALUES (?,?,?,?)').bind(username,full,await hash(pass),'employee').run();await log(env,user,'Tạo tài khoản nhân viên','user',r.meta.last_row_id,full);return json({ok:true});}catch{return json({ok:false,error:'Tên đăng nhập đã tồn tại.'},400);}}
  }
  const userMatch=url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  if(userMatch){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được quản lý nhân viên.'},403);const id=Number(userMatch[1]);if(req.method==='PUT'){const b=await req.json();await env.DB.prepare('UPDATE users SET full_name=?,active=? WHERE id=? AND role<>\'admin\'').bind(safeStr(b.full_name,120),b.active?1:0,id).run();await log(env,user,'Cập nhật nhân viên','user',id);return json({ok:true});}}
  if(url.pathname==='/api/admin/analytics'&&req.method==='GET'){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được xem đo lường.'},403); const total=await env.DB.prepare("SELECT COUNT(*) c FROM page_views WHERE date(created_at)>=date('now','-30 day')").first(); const days=(await env.DB.prepare("SELECT date(created_at) day,COUNT(*) visits,COUNT(DISTINCT visitor_key) visitors FROM page_views WHERE date(created_at)>=date('now','-30 day') GROUP BY date(created_at) ORDER BY day DESC").all()).results||[]; return json({ok:true,total:total.c,days});}
  if(url.pathname==='/api/admin/logs'&&req.method==='GET'){if(user.role!=='admin')return json({ok:false,error:'Chỉ admin được xem nhật ký.'},403);return json({ok:true,logs:(await env.DB.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 300').all()).results||[]});}
  return json({ok:false,error:'Không tìm thấy API.'},404);
}
async function uniqueSlug(env, base, currentId=null){let s=base||`xe-${Date.now()}`;for(let i=0;i<20;i++){const cand=i?s+'-'+(i+1):s;const row=await env.DB.prepare('SELECT id FROM products WHERE slug=?').bind(cand).first();if(!row||row.id===currentId)return cand;}return s+'-'+Date.now();}
async function uniquePolicySlug(env,base,currentId=null){let s=base||`bai-viet-${Date.now()}`;for(let i=0;i<20;i++){const cand=i?s+'-'+(i+1):s;const row=await env.DB.prepare('SELECT id FROM policies WHERE slug=?').bind(cand).first();if(!row||row.id===currentId)return cand;}return s+'-'+Date.now();}

export default {
  async fetch(req, env) {
    const url=new URL(req.url);
    try {
      await ensureSchema(env);
      if(url.pathname.startsWith('/media/')){
        if(!env.IMAGES)return text('R2 chưa được cấu hình',500);const key=decodeURIComponent(url.pathname.slice(7));const obj=await env.IMAGES.get(key);if(!obj)return text('Không tìm thấy ảnh',404);const headers=new Headers();obj.writeHttpMetadata(headers);headers.set('etag',obj.httpEtag);headers.set('cache-control','public, max-age=31536000, immutable');return new Response(obj.body,{headers});
      }
      if(url.pathname.startsWith('/api/')){
        let out=await publicApi(req,env,url);if(out)return out;
        const user=await currentUser(req,env);out=await adminApi(req,env,url,user);if(out)return out;
      }
      return env.ASSETS.fetch(req);
    } catch(err) {
      console.error(err);return json({ok:false,error:err?.message||'Máy chủ đang bận, vui lòng thử lại.'},500);
    }
  }
};
