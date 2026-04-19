// Agent Ops Dashboard · v2 · terminal aesthetic, sidebar layout, inspector panel
const SUPABASE_URL  = 'https://bniudmwlpaqqpthsgppv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaXVkbXdscGFxcXB0aHNncHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzYzNjcsImV4cCI6MjA4OTcxMjM2N30.WaNKfPUgUBv2HHt6KlbERVoTEGO2_YQnC4GlXCIxBhg';
const ADMIN_PASS = 'waleed-admin-2026';
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const MANAGERS = {
  strategy:    { name:'Strategy',    code:'STR', desc:'Memos, decks, case prep, modeling, PE/VC, M&A.',       employees:['consulting-frameworks','case-interview-prep','financial-modeling','private-equity-diligence','ma-advisory','consulting-slide-design','strategy-memo-writing','market-research','venture-capital-associate'], color:'#b4ff3a' },
  design:      { name:'Design',      code:'DES', desc:'Brand, UI/UX, motion, 3D, data viz, landing, social.', employees:['brand-identity-system','app-ui-designer','immersive-landing','webgl-3d-designer','shader-art-master','particle-systems','motion-interaction','scroll-experiences','svg-motion','generative-visuals','micro-interactions','premium-digital-art','typography-art','motion-reels','social-media-graphics','dashboard-dataviz','print-export-prep','3d-render-pipeline','image-generation','frontend-design'], color:'#ff2ea5' },
  engineering: { name:'Engineering', code:'ENG', desc:'Full-stack web, AI SaaS, Chrome ext, Shopify.',        employees:['webdev-fullstack','ai-saas-builder','chrome-extensions','shopify-dev'], color:'#00b8ff' },
  content:     { name:'Content',     code:'CNT', desc:'Decks, newsletters, LinkedIn, podcast, courses.',      employees:['pitch-decks','ai-voice-avatar','linkedin-ghostwriting','newsletter-ops','podcast-production','course-builder','gumroad-digital-products'], color:'#8b5cff' },
  growth:      { name:'Growth',      code:'GRW', desc:'Email, cold outreach, SEO, paid ads.',                 employees:['email-marketing','cold-outreach','seo-content-engine','paid-ads-creative'], color:'#ffb700' },
  ops:         { name:'Ops',         code:'OPS', desc:'Notion, Airtable, automation pipelines.',              employees:['notion-systems','airtable-bases','automation-plumbing'], color:'#00d4d4' },
  specialty:   { name:'Specialty',   code:'SPE', desc:'Legal, bookkeeping, RE, grants, TM research.',         employees:['legal-templates','bookkeeping-workflows','real-estate-listing','grant-writing','trademark-research'], color:'#00e08a' },
};

// ─── DOM refs ───
const bootErr = document.getElementById('bootErr');
const sbMeta = document.getElementById('sbMeta');
const sbMgrsEl = document.getElementById('sbMgrs');
const chipAll = document.getElementById('chipAll');
const statsEl = document.getElementById('stats');
const vitalsGrid = document.getElementById('vitalsGrid');
const vitalsPulse = document.getElementById('vitalsPulse');
const boardFilter = document.getElementById('boardFilter');
const tasksList = document.getElementById('tasksList');
const boardCount = document.getElementById('boardCount');
const lastSync = document.getElementById('lastSync');
const toast = document.getElementById('toast');
const insp = document.getElementById('insp');
const inspBody = document.getElementById('inspBody');
const inspClose = document.getElementById('inspClose');

// ─── STATE ───
let tasks = [];
let activeManager = 'all';
let activeSearch = '';
let selectedTaskId = null;
let pendingAttachments = [];

// ─── HELPERS ───
function showToast(msg, kind='ok'){
  toast.textContent = msg;
  toast.className = 'toast show ' + kind;
  setTimeout(() => toast.className = 'toast', 3000);
}
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function timeAgo(d){
  const s = Math.floor((Date.now() - d.getTime())/1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s/60) + 'm';
  if (s < 86400) return Math.floor(s/3600) + 'h';
  if (s < 604800) return Math.floor(s/86400) + 'd';
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
}

function renderMarkdown(md){
  if (!md) return '';
  let html = '';
  const lines = md.split('\n');
  let inCode = false, inTable = false, tableLines = [];
  const fmt = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--lime);text-decoration:underline">$1</a>');
  const flushTable = () => {
    if (!tableLines.length) return;
    const rows = tableLines.map(l => l.split('|').map(c => c.trim()).filter(c => c !== ''));
    if (rows.length < 2) { tableLines = []; return; }
    html += '<table><thead><tr>' + rows[0].map(c => '<th>'+fmt(c)+'</th>').join('') + '</tr></thead><tbody>' + rows.slice(2).map(r => '<tr>'+r.map(c => '<td>'+fmt(c)+'</td>').join('')+'</tr>').join('') + '</tbody></table>';
    tableLines = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) { if (inCode) { html += '</code></pre>'; inCode = false; } else { html += '<pre><code>'; inCode = true; } continue; }
    if (inCode) { html += esc(line) + '\n'; continue; }
    if (line.startsWith('|') && line.includes('|', 1)) { inTable = true; tableLines.push(line); continue; }
    if (inTable) { flushTable(); inTable = false; }
    if (line.startsWith('### ')) html += '<h3>'+fmt(line.slice(4))+'</h3>';
    else if (line.startsWith('## ')) html += '<h2>'+fmt(line.slice(3))+'</h2>';
    else if (line.startsWith('# ')) html += '<h2>'+fmt(line.slice(2))+'</h2>';
    else if (line.match(/^\d+\. /)) { if (!html.match(/<ol>[^]*$/) || html.endsWith('</ol>')) html += '<ol>'; html += '<li>'+fmt(line.replace(/^\d+\.\s+/,''))+'</li>'; if (!(lines[i+1]||'').match(/^\d+\. /)) html += '</ol>'; }
    else if (line.startsWith('- ')) { if (!html.match(/<ul>[^]*$/) || html.endsWith('</ul>')) html += '<ul>'; html += '<li>'+fmt(line.slice(2))+'</li>'; if (!(lines[i+1]||'').startsWith('- ')) html += '</ul>'; }
    else if (line.startsWith('> ')) html += '<blockquote>'+fmt(line.slice(2))+'</blockquote>';
    else if (line.trim() === '---') html += '<hr>';
    else if (line.trim() === '') html += '';
    else html += '<p>'+fmt(line)+'</p>';
  }
  if (inCode) html += '</code></pre>';
  flushTable();
  return html;
}

function guessType(url, name){
  const ext = (url || name || '').split('.').pop()?.toLowerCase() || '';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return 'image';
  if (ext === 'svg') return 'svg';
  if (ext === 'pdf') return 'pdf';
  if (['htm','html'].includes(ext)) return 'html';
  if (['md','markdown'].includes(ext)) return 'md';
  if (ext === 'csv') return 'csv';
  if (ext === 'txt') return 'txt';
  if (['zip'].includes(ext)) return 'zip';
  return 'file';
}

// ─── CLOCK ───
function tickClock(){
  const now = new Date();
  document.getElementById('clockTime').textContent = now.toTimeString().slice(0,8);
}
setInterval(tickClock, 1000);
tickClock();

// ─── BOOT ───
async function boot(){
  try {
    sbMeta.innerHTML = '<b>●</b> SYNC · ping';
    const { data, error } = await supa.rpc('get_agent_tasks', { admin_pass: ADMIN_PASS });
    if (error) throw error;
    tasks = data || [];
    sbMeta.innerHTML = `<b style="color:var(--ok)">●</b> LIVE · ${tasks.length} tasks`;
    render();
    lastSync.textContent = new Date().toLocaleTimeString();
    if (!localStorage.getItem('wiAgentsTourDone2')) setTimeout(() => startTour(), 700);
  } catch (err) {
    console.error('[boot]', err);
    bootErr.innerHTML = '<b>⚠ BACKEND UNREACHABLE</b><br>' + (err.message || 'unknown error') + '<br><br>→ try ⌘+Shift+R';
    bootErr.style.display = 'block';
    sbMeta.innerHTML = '<b style="color:var(--err)">●</b> ERR · retry';
  }
}
boot();

document.getElementById('refreshBtn').addEventListener('click', boot);

// ─── RENDER MAIN ───
function render(){
  renderStats();
  renderVitals();
  renderAnalytics();
  renderSidebarMgrs();
  renderBoardControls();
  renderBoard();
  if (selectedTaskId) renderInspector(tasks.find(t => t.id === selectedTaskId));
}

function renderStats(){
  const total = tasks.length;
  const running = tasks.filter(t => t.status === 'running').length;
  const queued = tasks.filter(t => t.status === 'queued').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const weekAgo = new Date(Date.now() - 7*864e5);
  const thisWeek = tasks.filter(t => new Date(t.created_at) > weekAgo).length;
  statsEl.innerHTML = `
    <div class="stat total"><div class="stat-label">TOTAL.TASKS</div><div class="stat-value">${String(total).padStart(3,'0')}</div><div class="stat-sub">lifetime · <b>${thisWeek}</b> this week</div></div>
    <div class="stat running"><div class="stat-label">RUNNING</div><div class="stat-value">${String(running).padStart(3,'0')}</div><div class="stat-sub">parallel</div></div>
    <div class="stat queued"><div class="stat-label">QUEUED</div><div class="stat-value">${String(queued).padStart(3,'0')}</div><div class="stat-sub">waiting dispatch</div></div>
    <div class="stat completed"><div class="stat-label">COMPLETED</div><div class="stat-value">${String(completed).padStart(3,'0')}</div><div class="stat-sub">shipped</div></div>
  `;
}

function renderSidebarMgrs(){
  chipAll.textContent = tasks.length;
  sbMgrsEl.innerHTML = Object.entries(MANAGERS).map(([k, m]) => {
    const n = tasks.filter(t => t.manager === k).length;
    return `<div class="sb-item ${activeManager===k?'active':''}" data-mgr="${k}" onclick="window.selMgr('${k}')">
      <span class="sb-key">${m.code} · ${m.name}</span>
      <span class="sb-chip">${n}</span>
    </div>`;
  }).join('');
}

function renderVitals(){
  const running = tasks.filter(t => t.status === 'running').length;
  vitalsPulse.textContent = running > 0 ? `${running} active` : 'idle';
  vitalsGrid.innerHTML = Object.entries(MANAGERS).map(([k, m]) => {
    const mgrTasks = tasks.filter(t => t.manager === k);
    const active = mgrTasks.filter(t => t.status === 'running' || t.status === 'queued').length;
    const done = mgrTasks.filter(t => t.status === 'completed').length;
    const pulseRate = active > 0 ? (1.2 / Math.min(active, 3)) : 3;
    // sparkline based on recent task status
    const recent = mgrTasks.slice(0, 8);
    const bars = Array.from({length: 8}, (_, i) => {
      const t = recent[i];
      if (!t) return 0.15;
      if (t.status === 'running') return 0.95;
      if (t.status === 'queued') return 0.6;
      if (t.status === 'completed') return 0.35;
      return 0.2;
    });
    const sparkW = 180, sparkH = 26;
    const barW = sparkW / bars.length - 2;
    const sparkBars = bars.map((h, i) => {
      const bh = h * sparkH;
      return `<rect x="${i * (barW + 2)}" y="${sparkH - bh}" width="${barW}" height="${bh}" fill="${m.color}" opacity="${h > 0.4 ? 0.9 : 0.35}"/>`;
    }).join('');
    return `<div class="vital ${k}" style="--vr:${pulseRate}s">
      <div class="vital-head">
        <div class="vital-name"><span class="p"></span>${m.code}</div>
        <div class="vital-stat"><b>${active}</b> · ${done} done</div>
      </div>
      <div class="vital-spark"><svg viewBox="0 0 ${sparkW} ${sparkH}" preserveAspectRatio="none" width="100%" height="26">${sparkBars}</svg></div>
    </div>`;
  }).join('');
}

// ─── ANALYTICS (dense SVG charts) ───
function renderAnalytics(){
  renderBar();
  renderDonut();
  renderLine();
  renderSubagents();
}

function renderBar(){
  const el = document.getElementById('chartBar');
  const items = Object.entries(MANAGERS).map(([k, m]) => ({
    k, name: m.code, full: m.name, color: m.color,
    total: tasks.filter(t => t.manager === k).length,
    done: tasks.filter(t => t.manager === k && t.status === 'completed').length,
  }));
  const max = Math.max(1, ...items.map(i => i.total));
  const w = 640, h = 220, padL = 60, padR = 40, padT = 8, padB = 24;
  const plotW = w - padL - padR;
  const rowH = (h - padT - padB - (items.length - 1) * 4) / items.length;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    <defs><pattern id="stripe" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.1)" stroke-width="2"/></pattern></defs>
    ${items.map((it, i) => {
      const y = padT + i * (rowH + 4);
      const fullW = (it.total / max) * plotW;
      const doneW = (it.done / max) * plotW;
      return `<g>
        <text x="${padL - 6}" y="${y + rowH/2 + 4}" fill="#a0a8b4" font-size="10" font-weight="700" text-anchor="end" font-family="JetBrains Mono" letter-spacing="1">${it.name}</text>
        <rect x="${padL}" y="${y}" width="${plotW}" height="${rowH}" fill="#0c0f14" stroke="#1f2530" stroke-width="1"/>
        <rect x="${padL}" y="${y}" width="${fullW}" height="${rowH}" fill="url(#stripe)"/>
        <rect x="${padL}" y="${y}" width="${doneW}" height="${rowH}" fill="${it.color}"/>
        <text x="${padL + fullW + 6}" y="${y + rowH/2 + 4}" fill="#e4e7ec" font-size="10" font-weight="700" font-family="JetBrains Mono">${String(it.total).padStart(2,'0')}</text>
      </g>`;
    }).join('')}
  </svg>
  <div class="chart-legend"><span><i style="background:${MANAGERS.strategy.color}"></i>● completed</span><span><i style="background:url(#stripe)"></i>● total</span></div>`;
}

function renderDonut(){
  const el = document.getElementById('chartDonut');
  const parts = [
    { k:'completed', name:'DONE', color:'#00e08a', val: tasks.filter(t => t.status === 'completed').length },
    { k:'running',   name:'RUN',  color:'#ffb700', val: tasks.filter(t => t.status === 'running').length },
    { k:'queued',    name:'WAIT', color:'#00b8ff', val: tasks.filter(t => t.status === 'queued').length },
    { k:'archived',  name:'ARCH', color:'#464e5a', val: tasks.filter(t => t.status === 'archived').length },
  ];
  const total = parts.reduce((a, p) => a + p.val, 0) || 1;
  const cx = 110, cy = 110, r = 65, stroke = 22;
  let angle = -Math.PI / 2;
  const arcs = parts.filter(p => p.val > 0).map(p => {
    const a = (p.val / total) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * r;
    const y1 = cy + Math.sin(angle) * r;
    const x2 = cx + Math.cos(angle + a) * r;
    const y2 = cy + Math.sin(angle + a) * r;
    const large = a > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    angle += a;
    return `<path d="${path}" fill="none" stroke="${p.color}" stroke-width="${stroke}"/>`;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 220 220" preserveAspectRatio="xMidYMid meet" style="max-width:220px;margin:0 auto;display:block">
    ${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="#e4e7ec" font-size="30" font-family="JetBrains Mono" font-weight="700">${String(total).padStart(2,'0')}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="#6b7380" font-size="9" font-family="JetBrains Mono" font-weight="700" letter-spacing="2">TOTAL</text>
  </svg>
  <div class="chart-legend">${parts.filter(p=>p.val>0).map(p => `<span><i style="background:${p.color}"></i>${p.name} ${String(p.val).padStart(2,'0')}</span>`).join('')}</div>`;
}

function renderLine(){
  const el = document.getElementById('chartLine');
  const days = 7;
  const buckets = Array.from({length: days}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i)); d.setHours(0,0,0,0);
    return { d, count: 0 };
  });
  tasks.forEach(t => {
    if (t.status !== 'completed' || !t.completed_at) return;
    const ct = new Date(t.completed_at);
    const idx = buckets.findIndex(b => ct.toDateString() === b.d.toDateString());
    if (idx !== -1) buckets[idx].count++;
  });
  const max = Math.max(1, ...buckets.map(b => b.count));
  const w = 460, h = 180, padL = 28, padR = 14, padT = 10, padB = 26;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const points = buckets.map((b, i) => ({
    x: padL + (i / (days - 1)) * plotW,
    y: padT + plotH - (b.count / max) * plotH,
    v: b.count, d: b.d,
  }));
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');
  const area = `${path} L ${padL + plotW} ${padT + plotH} L ${padL} ${padT + plotH} Z`;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4ff3a" stop-opacity="0.35"/><stop offset="1" stop-color="#b4ff3a" stop-opacity="0"/></linearGradient></defs>
    ${[0,1,2,3].map(i => `<line x1="${padL}" y1="${padT + (i/3)*plotH}" x2="${w-padR}" y2="${padT + (i/3)*plotH}" stroke="#1f2530" stroke-width="1" stroke-dasharray="2 3"/>`).join('')}
    <path d="${area}" fill="url(#lg)"/>
    <path d="${path}" fill="none" stroke="#b4ff3a" stroke-width="1.8"/>
    ${points.map(p => `
      <rect x="${p.x - 3}" y="${p.y - 3}" width="6" height="6" fill="#07090d" stroke="#b4ff3a" stroke-width="1.5"/>
      ${p.v > 0 ? `<text x="${p.x}" y="${p.y - 9}" text-anchor="middle" fill="#b4ff3a" font-size="10" font-weight="700" font-family="JetBrains Mono">${p.v}</text>` : ''}
    `).join('')}
    ${points.map(p => `<text x="${p.x}" y="${h - 6}" text-anchor="middle" fill="#6b7380" font-size="9" font-family="JetBrains Mono" font-weight="700" letter-spacing="1">${p.d.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3).toUpperCase()}</text>`).join('')}
  </svg>`;
}

function renderSubagents(){
  const el = document.getElementById('chartSubagents');
  const counts = new Map();
  tasks.forEach(t => (t.subagents_used || []).forEach(s => counts.set(s, (counts.get(s) || 0) + 1)));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!sorted.length) { el.innerHTML = '<div style="padding:40px 0;text-align:center;color:#6b7380;font-family:JetBrains Mono;font-size:11px;letter-spacing:0.1em">NO DEPLOYS YET</div>'; return; }
  const max = sorted[0][1];
  const w = 460, h = 200, padL = 168, padR = 24;
  const rowH = (h - 10) / sorted.length;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    ${sorted.map(([name, v], i) => {
      const y = i * rowH + 4;
      const ww = (v / max) * (w - padL - padR);
      return `<g>
        <text x="${padL - 6}" y="${y + rowH/2 + 4}" fill="#a0a8b4" font-size="10" text-anchor="end" font-family="JetBrains Mono">${name}</text>
        <rect x="${padL}" y="${y + 4}" width="${w - padL - padR}" height="${rowH - 12}" fill="#0c0f14" stroke="#1f2530" stroke-width="1"/>
        <rect x="${padL}" y="${y + 4}" width="${ww}" height="${rowH - 12}" fill="#b4ff3a"/>
        <text x="${padL + ww + 5}" y="${y + rowH/2 + 4}" fill="#e4e7ec" font-size="10" font-weight="700" font-family="JetBrains Mono">${String(v).padStart(2,'0')}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

// ─── BOARD ───
function renderBoardControls(){
  const cats = [['all','ALL',tasks.length]].concat(Object.entries(MANAGERS).map(([k,m]) => [k, m.code, tasks.filter(t => t.manager === k).length]));
  boardFilter.innerHTML = `
    ${cats.map(([k,l,n]) => `<button class="f-pill ${activeManager===k?'on':''}" onclick="window.selMgr('${k}')">${l}<span class="n">${n}</span></button>`).join('')}
    <div class="f-search"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input id="searchTasks" placeholder="search…" value="${esc(activeSearch)}" /></div>
  `;
  const si = document.getElementById('searchTasks');
  if (si) si.addEventListener('input', e => { activeSearch = e.target.value.toLowerCase().trim(); renderBoard(); });
}

function renderBoard(){
  const filtered = tasks.filter(t => {
    const mOk = activeManager === 'all' || t.manager === activeManager;
    const q = activeSearch;
    const sOk = !q || (t.title||'').toLowerCase().includes(q) || (t.brief||'').toLowerCase().includes(q) || (t.summary||'').toLowerCase().includes(q);
    return mOk && sOk;
  });
  boardCount.textContent = filtered.length;
  if (!filtered.length) {
    tasksList.innerHTML = '<div class="empty">▼ NO.TASKS · queue one via [+ NEW TASK]</div>';
    return;
  }
  tasksList.innerHTML = filtered.map(t => {
    const mgr = MANAGERS[t.manager];
    const artCount = (t.artifacts || []).length;
    return `<div class="task-row ${selectedTaskId === t.id ? 'sel' : ''}" data-id="${t.id}" onclick="window.selTask('${t.id}')">
      <span class="tt-dot s-${t.status}"></span>
      <div class="tt-title">
        <b>${esc(t.title)}</b>
        <span>${esc(t.summary || t.brief.slice(0, 120) + (t.brief.length > 120 ? '…' : ''))}</span>
        ${artCount ? `<span class="tt-arts">◼ ${artCount} artifact${artCount===1?'':'s'}</span>` : ''}
      </div>
      <span class="tt-mgr" style="background:${mgr?.color||'#b4ff3a'}">${mgr?.code||'---'}</span>
      <span class="tt-status s-${t.status}">${t.status.toUpperCase()}</span>
      <span class="tt-pri p-${t.priority}">${t.priority.toUpperCase()}</span>
      <span class="tt-age">${timeAgo(new Date(t.created_at))}</span>
    </div>`;
  }).join('');
}

// ─── INSPECTOR ───
function renderInspector(t){
  if (!t) { insp.classList.remove('open'); return; }
  const mgr = MANAGERS[t.manager];
  const color = mgr?.color || '#b4ff3a';
  const attachments = Array.isArray(t.attachments) ? t.attachments : [];
  const artifacts = Array.isArray(t.artifacts) ? t.artifacts : [];

  inspBody.innerHTML = `
    <div class="insp-mgr" style="background:${color}">${mgr?.code || '---'} · ${(mgr?.name||t.manager).toUpperCase()}</div>
    <div class="insp-title">${esc(t.title)}</div>
    <div style="font-family:var(--mono);font-size:10px;color:var(--ink-3);letter-spacing:0.08em;margin-bottom:18px">
      ID <span style="color:var(--ink-2)">${t.id.slice(0,8)}</span> ·
      STATUS <span style="color:${t.status==='running'?'var(--warn)':t.status==='completed'?'var(--ok)':'var(--info)'}">${t.status.toUpperCase()}</span> ·
      PRI <span style="color:${t.priority==='high'?'var(--err)':'var(--info)'}">${t.priority.toUpperCase()}</span> ·
      ${timeAgo(new Date(t.created_at))} ago
    </div>

    <div class="insp-field">
      <div class="insp-label">brief</div>
      <div class="brief">${esc(t.brief)}</div>
    </div>

    ${attachments.length ? `<div class="insp-field">
      <div class="insp-label">context attached <span class="count">${attachments.length}</span></div>
      <div class="insp-arts">${attachments.map(a => artItemHTML(a)).join('')}</div>
    </div>` : ''}

    ${(t.subagents_used && t.subagents_used.length) ? `<div class="insp-field">
      <div class="insp-label">subagents deployed <span class="count">${t.subagents_used.length}</span></div>
      <div class="emps">${t.subagents_used.map(s => '<span>'+s+'</span>').join('')}</div>
    </div>` : ''}

    ${t.status === 'running' ? `<div class="insp-field">
      <div class="insp-label">progress <span class="count">${t.progress||0}%</span></div>
      <div class="prog-bar"><div class="fill" style="width:${t.progress||0}%"></div></div>
    </div>` : ''}

    ${artifacts.length ? `<div class="insp-field">
      <div class="insp-label">artifacts · outputs <span class="count">${artifacts.length}</span></div>
      <div class="insp-arts">${artifacts.map(a => artItemHTML(a)).join('')}</div>
    </div>` : ''}

    ${t.output_markdown ? `<div class="insp-field">
      <div class="insp-label">report <button onclick="window.copyMd('${t.id}', event)" style="border:1px solid var(--line);background:transparent;color:var(--ink-3);font-family:var(--mono);font-size:9px;padding:2px 7px;border-radius:2px;letter-spacing:0.08em;cursor:pointer">COPY.MD</button></div>
      <div class="md">${renderMarkdown(t.output_markdown)}</div>
    </div>` : ''}

    <div class="insp-actions">
      ${t.status === 'queued' ? '<button class="primary" onclick="window.mark(\''+t.id+'\',\'running\')">▸ DISPATCH</button>' : ''}
      ${t.status === 'running' ? '<button class="primary" onclick="window.mark(\''+t.id+'\',\'completed\')">✓ COMPLETE</button>' : ''}
      ${t.status !== 'archived' ? '<button onclick="window.mark(\''+t.id+'\',\'archived\')">ARCHIVE</button>' : ''}
      <button class="danger" onclick="window.delTask(\''+t.id+'\')">DELETE</button>
    </div>
  `;
  insp.classList.add('open');
}

function artItemHTML(a){
  const type = (a.type || guessType(a.url, a.name)).toLowerCase();
  const name = a.name || a.url?.split('/').pop() || 'file';
  const viewable = ['image','svg','pdf','md','markdown','txt','csv','html','htm'];
  const click = viewable.includes(type) ? `window.openLightbox('${esc(a.url)}','${type}')` : `window.open('${esc(a.url)}','_blank')`;
  const inner = (type === 'image' || type === 'svg')
    ? `<img src="${esc(a.url)}" alt="" loading="lazy"/>`
    : `<div class="ico">${type==='pdf'?'📄':type==='md'?'📝':type==='csv'?'▦':type==='txt'?'≡':type==='link'?'→':type==='html'?'⌘':'📎'}</div>`;
  const tag = type.slice(0, 4).toUpperCase();
  return `<div class="insp-art-wrap"><div class="insp-art" onclick="${click}">
    <div class="thumb">${inner}</div>
    <div class="lbl">${esc(name)}</div>
    <div class="tag">${tag}</div>
  </div></div>`;
}

// ─── INTERACTIONS ───
window.selMgr = (k) => { activeManager = k; render(); };
window.selTask = (id) => {
  selectedTaskId = id;
  const t = tasks.find(x => x.id === id);
  renderInspector(t);
  renderBoard();
};
inspClose.addEventListener('click', () => { selectedTaskId = null; insp.classList.remove('open'); renderBoard(); });
window.copyMd = (id, evt) => {
  evt.stopPropagation();
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  navigator.clipboard.writeText(t.output_markdown || '').then(() => showToast('▸ markdown copied'));
};
window.openLightbox = async (url, type) => {
  const lb = document.getElementById('lightbox');
  const ext = (url || '').split('.').pop().toLowerCase().split('?')[0];
  const kind = type || (['png','jpg','jpeg','gif','webp','svg'].includes(ext) ? 'image' : ext);
  const fname = (url || '').split('/').pop().split('?')[0];

  const closeBtn = `<button class="lb-close" onclick="event.stopPropagation();document.getElementById('lightbox').classList.remove('show')">×</button>`;
  const title = `<div class="lb-doc-title">ARTIFACT · <b>${esc(fname)}</b></div>`;

  if (kind === 'image' || kind === 'svg') {
    lb.innerHTML = `<img src="${esc(url)}" alt="" onclick="event.stopPropagation()"/>`;
  }
  else if (kind === 'md' || kind === 'markdown' || kind === 'txt') {
    lb.innerHTML = `<div class="lb-doc" onclick="event.stopPropagation()">${closeBtn}${title}<div class="lb-loading">▸ loading ${esc(fname)}</div></div>`;
    lb.classList.add('show');
    try {
      const r = await fetch(url);
      const txt = await r.text();
      lb.querySelector('.lb-doc').innerHTML = closeBtn + title + `<div class="md">${renderMarkdown(txt)}</div>`;
    } catch (e) {
      lb.querySelector('.lb-doc').innerHTML = closeBtn + title + `<div style="padding:20px;color:var(--err);font-family:var(--mono);font-size:12px">▸ failed: ${esc(e.message)}</div>`;
    }
    return;
  }
  else if (kind === 'csv') {
    lb.innerHTML = `<div class="lb-doc" onclick="event.stopPropagation()">${closeBtn}${title}<div class="lb-loading">▸ loading ${esc(fname)}</div></div>`;
    lb.classList.add('show');
    try {
      const r = await fetch(url);
      const txt = await r.text();
      // tolerant CSV parse (no quoted-comma handling — fine for simple CSVs)
      const rows = txt.split('\n').filter(l => l.trim()).map(l => l.split(','));
      if (!rows.length) throw new Error('empty CSV');
      const head = rows[0];
      const body = rows.slice(1);
      lb.querySelector('.lb-doc').innerHTML = closeBtn + title + `<table class="lb-csv"><thead><tr>${head.map(h => '<th>' + esc(h) + '</th>').join('')}</tr></thead><tbody>${body.map(row => '<tr>' + row.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('')}</tbody></table>`;
    } catch (e) {
      lb.querySelector('.lb-doc').innerHTML = closeBtn + title + `<div style="padding:20px;color:var(--err)">▸ failed: ${esc(e.message)}</div>`;
    }
    return;
  }
  else if (kind === 'html' || kind === 'htm') {
    lb.innerHTML = `<iframe src="${esc(url)}" onclick="event.stopPropagation()"></iframe>`;
  }
  else if (kind === 'pdf') {
    lb.innerHTML = `<iframe src="${esc(url)}" onclick="event.stopPropagation()"></iframe>`;
  }
  else {
    // unknown type — open in new tab instead
    window.open(url, '_blank');
    return;
  }
  lb.classList.add('show');
};
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') document.getElementById('lightbox').classList.remove('show');
});

async function updateTask(id, fields){
  const { error } = await supa.rpc('update_agent_task', {
    task_id: id, admin_pass: ADMIN_PASS,
    new_status: fields.status ?? null,
    new_output: null, new_summary: null, new_subagents: null,
    new_progress: fields.progress ?? null,
    new_artifacts: null, new_attachments: null,
  });
  if (error) { showToast('update failed', 'err'); return false; }
  return true;
}
window.mark = async (id, status) => {
  const progress = status === 'running' ? 5 : (status === 'completed' ? 100 : null);
  if (await updateTask(id, { status, progress })) {
    const t = tasks.find(x => x.id === id);
    if (t) { t.status = status; if (progress !== null) t.progress = progress; }
    render();
    showToast('▸ marked ' + status);
  }
};
window.delTask = async id => {
  if (!confirm('delete permanently?')) return;
  const { error } = await supa.rpc('delete_agent_task', { task_id: id, admin_pass: ADMIN_PASS });
  if (error) { showToast('delete failed', 'err'); return; }
  tasks = tasks.filter(x => x.id !== id);
  if (selectedTaskId === id) { selectedTaskId = null; insp.classList.remove('open'); }
  render();
  showToast('▸ deleted');
};

// ─── MODAL + UPLOAD ───
const modalBack = document.getElementById('modalBack');
const newTaskBtn = document.getElementById('newTaskBtn');
const taskMgrSel = document.getElementById('taskManager');
const mgrPreview = document.getElementById('mgrPreview');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const taskForm = document.getElementById('taskForm');
const taskSubmit = document.getElementById('taskSubmit');

taskMgrSel.innerHTML = '<option value="">— pick manager —</option>' + Object.entries(MANAGERS).map(([k, m]) => `<option value="${k}">${m.code} · ${m.name}</option>`).join('');
function updatePreview(){
  const m = MANAGERS[taskMgrSel.value];
  if (!m) { mgrPreview.innerHTML = '<div class="lbl">pick a manager to see subagents</div>'; return; }
  mgrPreview.innerHTML = `<div class="lbl">${m.code} commands ${m.employees.length} subagents</div><div class="emps">${m.employees.map(e => '<span>'+e+'</span>').join('')}</div>`;
}
taskMgrSel.addEventListener('change', updatePreview);
updatePreview();

newTaskBtn.addEventListener('click', () => { modalBack.classList.add('show'); pendingAttachments = []; renderUploadPreview(); taskForm.reset(); updatePreview(); });
document.getElementById('modalClose').addEventListener('click', () => modalBack.classList.remove('show'));
modalBack.addEventListener('click', e => { if (e.target === modalBack) modalBack.classList.remove('show'); });

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'));
uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', e => handleFiles(e.target.files));
addEventListener('paste', e => {
  if (!modalBack.classList.contains('show')) return;
  const items = [...(e.clipboardData?.items || [])];
  const files = items.filter(i => i.kind === 'file').map(i => i.getAsFile()).filter(Boolean);
  if (files.length) handleFiles(files);
});

function handleFiles(fileList){
  [...fileList].forEach(f => {
    if (f.size > 10 * 1024 * 1024) { showToast(`${f.name} > 10MB`, 'err'); return; }
    const reader = new FileReader();
    reader.onload = () => { pendingAttachments.push({ name: f.name, type: f.type, size: f.size, file: f, preview: reader.result }); renderUploadPreview(); };
    reader.readAsDataURL(f);
  });
}
function renderUploadPreview(){
  uploadPreview.innerHTML = pendingAttachments.map((a, i) => {
    const isImg = a.type.startsWith('image/');
    return `<div class="upload-thumb">${isImg ? `<img src="${a.preview}" alt=""/>` : `<div class="file-icon">${a.name.endsWith('.pdf')?'📄':'📎'}</div>`}<button class="rm" onclick="window.rmAtt(${i})">×</button></div>`;
  }).join('');
}
window.rmAtt = i => { pendingAttachments.splice(i, 1); renderUploadPreview(); };

async function uploadOne(att){
  const ext = att.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supa.storage.from('task-attachments').upload(path, att.file, { contentType: att.type });
  if (error) throw error;
  const { data: pub } = supa.storage.from('task-attachments').getPublicUrl(data.path);
  return { name: att.name, url: pub.publicUrl, type: att.type.startsWith('image/') ? 'image' : guessType(att.name, att.name), size: att.size };
}

taskForm.addEventListener('submit', async e => {
  e.preventDefault();
  taskSubmit.disabled = true;
  taskSubmit.textContent = '▸ UPLOADING';
  try {
    const uploaded = [];
    for (const att of pendingAttachments) uploaded.push(await uploadOne(att));
    taskSubmit.textContent = '▸ QUEUEING';
    const data = Object.fromEntries(new FormData(taskForm));
    const { error } = await supa.from('agent_tasks').insert({
      manager: data.manager, title: data.title.trim(), brief: data.brief.trim(),
      priority: data.priority, status: 'queued', attachments: uploaded,
    });
    if (error) throw error;
    modalBack.classList.remove('show');
    pendingAttachments = [];
    showToast('▸ queued with ' + uploaded.length + ' file' + (uploaded.length===1?'':'s'));
    const { data: refreshed } = await supa.rpc('get_agent_tasks', { admin_pass: ADMIN_PASS });
    tasks = refreshed || tasks;
    render();
  } catch (err) {
    console.error(err);
    showToast('▸ failed: ' + err.message, 'err');
  } finally {
    taskSubmit.disabled = false;
    taskSubmit.textContent = '▸ QUEUE TASK';
  }
});

// ─── TOUR ───
const TOUR = [
  { illo:'◼', title:'Welcome to <code>agent.ops</code>', body:'Seven <b>managers</b>, fifty-one <b>subagents</b>, one terminal. Everything in here is live — stats, charts, task board — all reading from your Supabase in real time.' },
  { illo:'▤', title:'The <code>sidebar</code> is your filter', body:'Click any manager in the left column to filter every panel to their work. <b>+ NEW TASK</b> at the bottom queues a brief for any manager with optional context files.' },
  { illo:'❏', title:'Four <code>live panels</code>', body:'<b>Overview</b> counters · <b>Vitals</b> (pulse rate + sparkline per manager) · <b>Analytics</b> (bar, donut, 7-day velocity, top subagents) · <b>Task board</b> (dense data table).' },
  { illo:'▸', title:'Click any task <code>row</code>', body:'A right-side <b>inspector</b> slides in. You see the brief, any context files, subagents deployed, artifact grid with thumbnails, and the full markdown report. Click artifacts to preview in lightbox.' },
  { illo:'⌘', title:'Attach <code>context</code> at queue time', body:'In the new-task modal, drop files / paste screenshots / click to browse. Up to 10MB per file — images, PDFs, decks, docs. The manager uses them as brief context.' },
];
const tourEl = document.getElementById('tour');
let tourStep = 0;
function renderTour(){
  const s = TOUR[tourStep];
  document.getElementById('tourStep').textContent = `${String(tourStep+1).padStart(2,'0')} · ${String(TOUR.length).padStart(2,'0')}`;
  document.getElementById('tourIllo').textContent = s.illo;
  document.getElementById('tourTitle').innerHTML = s.title;
  document.getElementById('tourBody').innerHTML = s.body;
  document.getElementById('tourDots').innerHTML = TOUR.map((_,i)=>`<i class="${i===tourStep?'on':''}"></i>`).join('');
  document.getElementById('tourPrev').style.visibility = tourStep === 0 ? 'hidden' : 'visible';
  document.getElementById('tourNext').textContent = tourStep === TOUR.length - 1 ? 'got it' : 'next';
}
function startTour(){ tourStep = 0; renderTour(); tourEl.classList.add('show'); }
function endTour(){ tourEl.classList.remove('show'); localStorage.setItem('wiAgentsTourDone2', '1'); }
document.getElementById('tourPrev').addEventListener('click', () => { if (tourStep > 0) { tourStep--; renderTour(); } });
document.getElementById('tourNext').addEventListener('click', () => { if (tourStep < TOUR.length - 1) { tourStep++; renderTour(); } else endTour(); });
document.getElementById('tourSkip').addEventListener('click', endTour);
document.getElementById('tourLaunch').addEventListener('click', (e) => { e.preventDefault(); startTour(); });
