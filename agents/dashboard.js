// Agent Ops Dashboard · data + UI logic
const SUPABASE_URL  = 'https://bniudmwlpaqqpthsgppv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaXVkbXdscGFxcXB0aHNncHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzYzNjcsImV4cCI6MjA4OTcxMjM2N30.WaNKfPUgUBv2HHt6KlbERVoTEGO2_YQnC4GlXCIxBhg';
const ADMIN_PASS = 'waleed-admin-2026';
const supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

const MANAGERS = {
  strategy:    { name:'Strategy',    desc:'Memos, decks, case prep, modeling, PE/VC, M&A.',       employees:['consulting-frameworks','case-interview-prep','financial-modeling','private-equity-diligence','ma-advisory','consulting-slide-design','strategy-memo-writing','market-research','venture-capital-associate'], color:'#e8a962' },
  design:      { name:'Design',      desc:'Brand, UI/UX, motion, 3D, data viz, landing, social.', employees:['brand-identity-system','app-ui-designer','immersive-landing','webgl-3d-designer','shader-art-master','particle-systems','motion-interaction','scroll-experiences','svg-motion','generative-visuals','micro-interactions','premium-digital-art','typography-art','motion-reels','social-media-graphics','dashboard-dataviz','print-export-prep','3d-render-pipeline','image-generation'], color:'#ec4899' },
  engineering: { name:'Engineering', desc:'Full-stack web, AI SaaS, Chrome ext, Shopify.',        employees:['webdev-fullstack','ai-saas-builder','chrome-extensions','shopify-dev'], color:'#7EC8E3' },
  content:     { name:'Content',     desc:'Decks, newsletters, LinkedIn, podcast, courses.',      employees:['pitch-decks','ai-voice-avatar','linkedin-ghostwriting','newsletter-ops','podcast-production','course-builder','gumroad-digital-products'], color:'#8a5cf6' },
  growth:      { name:'Growth',      desc:'Email, cold outreach, SEO, paid ads.',                 employees:['email-marketing','cold-outreach','seo-content-engine','paid-ads-creative'], color:'#FF9F43' },
  ops:         { name:'Ops',         desc:'Notion, Airtable, automation pipelines.',              employees:['notion-systems','airtable-bases','automation-plumbing'], color:'#06b6d4' },
  specialty:   { name:'Specialty',   desc:'Legal, bookkeeping, RE, grants, TM research.',         employees:['legal-templates','bookkeeping-workflows','real-estate-listing','grant-writing','trademark-research'], color:'#6BC67E' },
};

// ─── STATE ───
const dash = document.getElementById('dash');
const bootErr = document.getElementById('bootErr');
const bootErrMsg = document.getElementById('bootErrMsg');
const statsEl = document.getElementById('stats');
const vitalsGrid = document.getElementById('vitalsGrid');
const vitalsPulse = document.getElementById('vitalsPulse');
const orgChart = document.getElementById('orgChart');
const boardFilter = document.getElementById('boardFilter');
const tasksList = document.getElementById('tasksList');
const orgCountEl = document.getElementById('orgCount');
const boardCount = document.getElementById('boardCount');
const toast = document.getElementById('toast');

let tasks = [];
let activeManager = 'all';
let activeSearch = '';
let pendingAttachments = [];

// ─── HELPERS ───
function showToast(msg, kind='ok'){
  toast.textContent = msg;
  toast.className = 'toast show ' + kind;
  setTimeout(() => toast.className = 'toast', 3200);
}
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function timeAgo(d){
  const s = Math.floor((Date.now() - d.getTime())/1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60)+'m ago';
  if (s < 86400) return Math.floor(s/3600)+'h ago';
  if (s < 604800) return Math.floor(s/86400)+'d ago';
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
}

// ─── markdown renderer (same as before, lite) ───
function renderMarkdown(md){
  if (!md) return '';
  let html = '';
  const lines = md.split('\n');
  let inCode = false;
  let inTable = false;
  let tableLines = [];
  const inlineFmt = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  const flushTable = () => {
    if (!tableLines.length) return;
    const rows = tableLines.map(l => l.split('|').map(c => c.trim()).filter(c => c !== ''));
    if (rows.length < 2) { tableLines = []; return; }
    html += '<table>';
    html += '<thead><tr>' + rows[0].map(c => '<th>'+inlineFmt(c)+'</th>').join('') + '</tr></thead>';
    html += '<tbody>' + rows.slice(2).map(r => '<tr>'+r.map(c => '<td>'+inlineFmt(c)+'</td>').join('')+'</tr>').join('') + '</tbody>';
    html += '</table>';
    tableLines = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCode) { html += '</code></pre>'; inCode = false; }
      else { html += '<pre><code>'; inCode = true; }
      continue;
    }
    if (inCode) { html += esc(line) + '\n'; continue; }
    if (line.startsWith('|') && line.includes('|', 1)) { inTable = true; tableLines.push(line); continue; }
    if (inTable) { flushTable(); inTable = false; }
    if (line.startsWith('### ')) html += '<h3>'+inlineFmt(line.slice(4))+'</h3>';
    else if (line.startsWith('## ')) html += '<h2>'+inlineFmt(line.slice(3))+'</h2>';
    else if (line.startsWith('# ')) html += '<h2>'+inlineFmt(line.slice(2))+'</h2>';
    else if (line.match(/^\d+\. /)) {
      if (!html.match(/<ol>[^]*$/) || html.endsWith('</ol>')) html += '<ol>';
      html += '<li>'+inlineFmt(line.replace(/^\d+\.\s+/,''))+'</li>';
      if (!(lines[i+1]||'').match(/^\d+\. /)) html += '</ol>';
    }
    else if (line.startsWith('- ')) {
      if (!html.match(/<ul>[^]*$/) || html.endsWith('</ul>')) html += '<ul>';
      html += '<li>'+inlineFmt(line.slice(2))+'</li>';
      if (!(lines[i+1]||'').startsWith('- ')) html += '</ul>';
    }
    else if (line.startsWith('> ')) html += '<blockquote>'+inlineFmt(line.slice(2))+'</blockquote>';
    else if (line.trim() === '---') html += '<hr>';
    else if (line.trim() === '') html += '';
    else html += '<p>'+inlineFmt(line)+'</p>';
  }
  if (inCode) html += '</code></pre>';
  flushTable();
  return html;
}

// ─── BOOT ───
async function boot(){
  try {
    const { data, error } = await supa.rpc('get_agent_tasks', { admin_pass: ADMIN_PASS });
    if (error) throw error;
    tasks = data || [];
    dash.classList.add('show');
    render();
    if (!localStorage.getItem('wiAgentsTourDone')) setTimeout(() => startTour(), 800);
  } catch (err) {
    console.error('[boot]', err);
    bootErrMsg.textContent = (err.message || 'unknown error') + '. Try ⌘+Shift+R.';
    bootErr.style.display = 'block';
    dash.classList.add('show');
  }
}
boot();

// ─── RENDER ───
function render(){
  renderStats();
  renderVitals();
  renderAnalytics();
  renderOrg();
  renderBoardControls();
  renderBoard();
}

function renderStats(){
  const total = tasks.length;
  const running = tasks.filter(t => t.status === 'running').length;
  const queued = tasks.filter(t => t.status === 'queued').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const weekAgo = new Date(Date.now() - 7*864e5);
  const thisWeek = tasks.filter(t => new Date(t.created_at) > weekAgo).length;
  statsEl.innerHTML = `
    <div class="stat total"><div class="stat-label">All tasks</div><div class="stat-value">${total}</div><div class="stat-meta">lifetime</div></div>
    <div class="stat running"><div class="stat-label">Running</div><div class="stat-value">${running}</div><div class="stat-meta">in parallel now</div></div>
    <div class="stat queued"><div class="stat-label">Queued</div><div class="stat-value">${queued}</div><div class="stat-meta">waiting</div></div>
    <div class="stat completed"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div><div class="stat-meta">${thisWeek} this week</div></div>
  `;
}

function renderVitals(){
  const running = tasks.filter(t => t.status === 'running').length;
  vitalsPulse.textContent = running > 0 ? `${running} active` : '— calm —';

  vitalsGrid.innerHTML = Object.entries(MANAGERS).map(([k, m]) => {
    const mgrTasks = tasks.filter(t => t.manager === k);
    const active = mgrTasks.filter(t => t.status === 'running' || t.status === 'queued').length;
    const done = mgrTasks.filter(t => t.status === 'completed').length;
    const total = mgrTasks.length;
    const load = total ? Math.min(100, Math.round((active / Math.max(total, 4)) * 100)) : 0;
    const pulseRate = active > 0 ? (1.5 / Math.min(active, 3)) : 2.4;
    // 8 bars of decaying height (last 8 tasks) as activity signal
    const recent = mgrTasks.slice(0, 8);
    const bars = Array.from({length: 8}, (_, i) => {
      const t = recent[i];
      if (!t) return 20;
      if (t.status === 'running') return 90 + Math.random() * 10;
      if (t.status === 'queued') return 55 + Math.random() * 10;
      if (t.status === 'completed') return 30 + Math.random() * 10;
      return 20;
    });
    return `<div class="vital ${k}" style="--vr:${pulseRate}s">
      <div class="vital-name"><span class="pulse"></span>${m.name}</div>
      <div class="vital-stat">${active}<span style="font-size:11px;color:var(--ink-3);font-family:Inter;font-style:normal;margin-left:4px">active · ${done} done</span></div>
      <div class="vital-bars">${bars.map((h, i) => `<div class="vital-bar ${h > 50 ? 'on' : ''}" style="height:${h}%"></div>`).join('')}</div>
    </div>`;
  }).join('');
}

// ─── ANALYTICS CHARTS (SVG from scratch) ───
function renderAnalytics(){
  renderBarChart();
  renderDonut();
  renderLineChart();
  renderSubagentChart();
}

function renderBarChart(){
  const el = document.getElementById('chartBar');
  const counts = Object.keys(MANAGERS).map(k => ({
    k, name: MANAGERS[k].name, color: MANAGERS[k].color,
    total: tasks.filter(t => t.manager === k).length,
    done: tasks.filter(t => t.manager === k && t.status === 'completed').length,
  }));
  const max = Math.max(1, ...counts.map(c => c.total));
  const w = 600, h = 240, padL = 70, padR = 20, padT = 10, padB = 30;
  const plotW = w - padL - padR;
  const barH = (h - padT - padB - (counts.length - 1) * 6) / counts.length;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    ${counts.map((c, i) => {
      const y = padT + i * (barH + 6);
      const ww = (c.total / max) * plotW;
      const doneW = (c.done / max) * plotW;
      return `<g>
        <text x="${padL - 8}" y="${y + barH/2 + 4}" fill="#b8b8c0" font-size="11" font-weight="600" text-anchor="end" font-family="Inter">${c.name}</text>
        <rect x="${padL}" y="${y}" width="${plotW}" height="${barH}" fill="rgba(255,255,255,0.04)" rx="3"/>
        <rect x="${padL}" y="${y}" width="${ww}" height="${barH}" fill="${c.color}" rx="3" opacity="0.4"/>
        <rect x="${padL}" y="${y}" width="${doneW}" height="${barH}" fill="${c.color}" rx="3"/>
        <text x="${padL + ww + 6}" y="${y + barH/2 + 4}" fill="#f5f5f7" font-size="11" font-weight="600" font-family="JetBrains Mono">${c.total}</text>
      </g>`;
    }).join('')}
  </svg>
  <div class="chart-legend"><span><i style="background:${MANAGERS.strategy.color}"></i>filled = completed</span><span><i style="background:rgba(255,255,255,0.15)"></i>faded = queued/running</span></div>`;
}

function renderDonut(){
  const el = document.getElementById('chartDonut');
  const parts = [
    { k:'completed', name:'Completed', color:'#6BC67E', val: tasks.filter(t => t.status === 'completed').length },
    { k:'running',   name:'Running',   color:'#FF9F43', val: tasks.filter(t => t.status === 'running').length },
    { k:'queued',    name:'Queued',    color:'#7EC8E3', val: tasks.filter(t => t.status === 'queued').length },
    { k:'archived',  name:'Archived',  color:'#7a7a85', val: tasks.filter(t => t.status === 'archived').length },
  ];
  const total = parts.reduce((a, p) => a + p.val, 0) || 1;
  const cx = 120, cy = 120, r = 70, stroke = 28;
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
    return `<path d="${path}" fill="none" stroke="${p.color}" stroke-width="${stroke}" stroke-linecap="butt"/>`;
  }).join('');
  el.innerHTML = `<svg viewBox="0 0 240 240" preserveAspectRatio="xMidYMid meet" style="max-width:240px;margin:0 auto">
    ${arcs}
    <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="#f5f5f7" font-size="32" font-family="Fraunces" font-style="italic" font-weight="500">${total}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="#7a7a85" font-size="10" font-family="Inter" font-weight="600" letter-spacing="0.2em">TOTAL</text>
  </svg>
  <div class="chart-legend">${parts.map(p => `<span><i style="background:${p.color}"></i>${p.name} (${p.val})</span>`).join('')}</div>`;
}

function renderLineChart(){
  const el = document.getElementById('chartLine');
  const days = 7;
  const buckets = Array.from({length: days}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    d.setHours(0,0,0,0);
    return { d, count: 0 };
  });
  tasks.forEach(t => {
    if (t.status !== 'completed' || !t.completed_at) return;
    const ct = new Date(t.completed_at);
    const idx = buckets.findIndex(b => ct.toDateString() === b.d.toDateString());
    if (idx !== -1) buckets[idx].count++;
  });
  const max = Math.max(1, ...buckets.map(b => b.count));
  const w = 500, h = 200, padL = 32, padR = 20, padT = 16, padB = 30;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const points = buckets.map((b, i) => {
    const x = padL + (i / (days - 1)) * plotW;
    const y = padT + plotH - (b.count / max) * plotH;
    return { x, y, v: b.count, d: b.d };
  });
  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');
  const areaPath = `${path} L ${padL + plotW} ${padT + plotH} L ${padL} ${padT + plotH} Z`;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    <defs><linearGradient id="lineG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8a962" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#e8a962" stop-opacity="0"/>
    </linearGradient></defs>
    ${[0,1,2,3].map(i => `<line x1="${padL}" y1="${padT + (i/3)*plotH}" x2="${w-padR}" y2="${padT + (i/3)*plotH}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`).join('')}
    <path d="${areaPath}" fill="url(#lineG)"/>
    <path d="${path}" fill="none" stroke="#e8a962" stroke-width="2.5" stroke-linejoin="round"/>
    ${points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#e8a962" stroke="#0a0a0d" stroke-width="2"/>
      ${p.v > 0 ? `<text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="#f5f5f7" font-size="11" font-weight="600" font-family="JetBrains Mono">${p.v}</text>` : ''}
    `).join('')}
    ${points.map(p => `<text x="${p.x}" y="${h - 8}" text-anchor="middle" fill="#7a7a85" font-size="10" font-family="Inter" font-weight="600">${p.d.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3)}</text>`).join('')}
  </svg>`;
}

function renderSubagentChart(){
  const el = document.getElementById('chartSubagents');
  const counts = new Map();
  tasks.forEach(t => (t.subagents_used || []).forEach(s => counts.set(s, (counts.get(s) || 0) + 1)));
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (sorted.length === 0) { el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-3);font-size:13px">No subagents deployed yet.</div>'; return; }
  const max = sorted[0][1];
  const w = 500, h = 220, padL = 150, padR = 30, padT = 10;
  const rowH = (h - padT - 20) / sorted.length;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    ${sorted.map(([name, v], i) => {
      const y = padT + i * rowH;
      const ww = (v / max) * (w - padL - padR);
      return `<g>
        <text x="${padL - 8}" y="${y + rowH/2 + 4}" fill="#b8b8c0" font-size="11" text-anchor="end" font-family="JetBrains Mono">${name}</text>
        <rect x="${padL}" y="${y + 4}" width="${w - padL - padR}" height="${rowH - 10}" fill="rgba(255,255,255,0.04)" rx="2"/>
        <rect x="${padL}" y="${y + 4}" width="${ww}" height="${rowH - 10}" fill="#e8a962" rx="2"/>
        <text x="${padL + ww + 6}" y="${y + rowH/2 + 4}" fill="#f5f5f7" font-size="11" font-weight="600" font-family="JetBrains Mono">${v}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

function renderOrg(){
  orgCountEl.textContent = '7 managers · ' + Object.values(MANAGERS).reduce((a, m) => a + m.employees.length, 0) + ' subagents';
  orgChart.innerHTML = Object.entries(MANAGERS).map(([k, m]) => {
    return `<div class="mgr ${k} ${activeManager === k ? 'sel' : ''}" data-mgr="${k}">
      <div class="mgr-row" onclick="window.toggleMgr('${k}', event)">
        <div class="mgr-icon">${m.name.charAt(0)}</div>
        <div class="mgr-body">
          <div class="mgr-name">${m.name} Manager</div>
          <div class="mgr-desc">${m.desc}</div>
        </div>
        <div class="mgr-count">${m.employees.length}<small>subagents</small></div>
        <div class="mgr-caret">›</div>
      </div>
      <div class="mgr-employees"><div class="mgr-employees-inner">
        ${m.employees.map(e => '<span class="emp">'+e+'</span>').join('')}
      </div></div>
    </div>`;
  }).join('');
}

function renderBoardControls(){
  const counts = [['all','All',tasks.length]].concat(Object.entries(MANAGERS).map(([k,m]) => [k, m.name, tasks.filter(t => t.manager === k).length]));
  boardFilter.innerHTML = `
    ${counts.map(([k,l,n]) => `<button class="f-pill ${activeManager===k?'on':''}" data-mgr="${k}">${l}<span>${n}</span></button>`).join('')}
    <div class="f-search"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><input id="searchTasks" placeholder="Search…" value="${esc(activeSearch)}" /></div>
  `;
  boardFilter.querySelectorAll('.f-pill').forEach(p => p.addEventListener('click', () => { activeManager = p.dataset.mgr; render(); }));
  document.getElementById('searchTasks').addEventListener('input', e => { activeSearch = e.target.value.toLowerCase().trim(); renderBoard(); });
}

function renderBoard(){
  const filtered = tasks.filter(t => {
    const mOk = activeManager === 'all' || t.manager === activeManager;
    const q = activeSearch;
    const sOk = !q || (t.title||'').toLowerCase().includes(q) || (t.brief||'').toLowerCase().includes(q) || (t.summary||'').toLowerCase().includes(q);
    return mOk && sOk;
  });
  boardCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'task' : 'tasks'}`;
  if (!filtered.length) { tasksList.innerHTML = '<div class="empty"><h3>Nothing here.</h3><p>Queue a task or try a different filter.</p></div>'; return; }
  tasksList.innerHTML = filtered.map(t => taskCardHTML(t)).join('');
}

function taskCardHTML(t){
  const mgr = MANAGERS[t.manager];
  const color = mgr?.color || '#e8a962';
  const attachments = Array.isArray(t.attachments) ? t.attachments : [];
  const artifacts = Array.isArray(t.artifacts) ? t.artifacts : [];
  return `<div class="task" data-id="${t.id}" data-status="${t.status}">
    <div class="task-row" onclick="window.toggleTask('${t.id}')">
      <div>
        <div class="task-title">
          <span>${esc(t.title)}</span>
          <span class="task-mgr-chip" style="background:${color}">${(mgr?.name||t.manager).toUpperCase()}</span>
        </div>
        <div class="task-sum">${esc(t.summary || t.brief.slice(0, 140) + (t.brief.length > 140 ? '…' : ''))}</div>
      </div>
      <div class="task-right">
        <span class="task-status s-${t.status}">${t.status}${t.status === 'running' ? ' · ' + (t.progress||0) + '%' : ''}</span>
        <span class="task-pill p-${t.priority}">${t.priority}</span>
        <span class="task-meta">${timeAgo(new Date(t.created_at))}</span>
      </div>
    </div>
    <div class="task-detail">
      <div class="task-detail-inner">
        <div class="brief-label">The brief</div>
        <div class="brief">${esc(t.brief)}</div>

        ${attachments.length ? `<div class="attachments">
          <div class="attach-label">Context attached (${attachments.length})</div>
          <div class="att-grid">${attachments.map(a => attachmentHTML(a)).join('')}</div>
        </div>` : ''}

        ${(t.subagents_used && t.subagents_used.length) ? `<div class="employees-used">
          <div class="lbl">Subagents deployed</div>
          <div class="employees-list">${t.subagents_used.map(s => '<span class="emp">'+s+'</span>').join('')}</div>
        </div>` : ''}

        ${t.status === 'running' ? `<div class="progress-bar"><div class="fill" style="width:${t.progress||0}%"></div></div>` : ''}

        ${artifacts.length ? `<div class="artifacts">
          <div class="artifacts-label">Output · artifacts (${artifacts.length})</div>
          <div class="art-grid">${artifacts.map(a => artifactHTML(a)).join('')}</div>
        </div>` : ''}

        ${t.output_markdown ? `<div class="output">
          <div class="output-label">Report<button class="copy-btn" onclick="window.copyOut('${t.id}', event)">copy md</button></div>
          <div class="md">${renderMarkdown(t.output_markdown)}</div>
        </div>` : (t.status === 'queued' ? '<div style="margin-top:14px;padding:12px;background:rgba(126,200,227,0.05);border:1px dashed rgba(126,200,227,0.25);border-radius:10px;font-size:12.5px;color:var(--ink-3);text-align:center"><b style="color:var(--blue)">Queued</b> — waiting to be dispatched.</div>' : '')}

        <div class="task-actions">
          ${t.status === 'queued' ? '<button class="primary" onclick="window.mark(\''+t.id+'\', \'running\')">Dispatch →</button>' : ''}
          ${t.status === 'running' ? '<button class="primary" onclick="window.mark(\''+t.id+'\', \'completed\')">Complete</button>' : ''}
          ${t.status !== 'archived' ? '<button onclick="window.mark(\''+t.id+'\', \'archived\')">Archive</button>' : ''}
          <button class="danger" onclick="window.delTask(\''+t.id+'\')">Delete</button>
        </div>
      </div>
    </div>
  </div>`;
}

function artifactHTML(a){
  const type = (a.type || guessType(a.url, a.name)).toLowerCase();
  const name = a.name || a.url?.split('/').pop() || 'file';
  const tag = (type === 'image' ? 'IMG' : type === 'html' ? 'HTML' : type === 'pdf' ? 'PDF' : type === 'md' ? 'MD' : type === 'svg' ? 'SVG' : type === 'link' ? 'LINK' : type.toUpperCase()).slice(0, 4);
  if (type === 'image' || type === 'svg') {
    return `<div class="art-item" onclick="window.openLightbox('${esc(a.url)}')">
      <div class="art-thumb"><img src="${esc(a.url)}" alt="${esc(name)}" loading="lazy"/></div>
      <div class="art-type-tag">${tag}</div>
      <div class="art-label">${esc(name)}</div>
    </div>`;
  }
  if (type === 'html' || type === 'link') {
    return `<div class="art-item" onclick="window.open('${esc(a.url)}','_blank')">
      <div class="art-thumb"><span class="icon">🌐</span></div>
      <div class="art-type-tag">${tag}</div>
      <div class="art-label">${esc(name)}</div>
    </div>`;
  }
  if (type === 'pdf') {
    return `<div class="art-item" onclick="window.openLightbox('${esc(a.url)}', 'pdf')">
      <div class="art-thumb"><span class="icon">📄</span></div>
      <div class="art-type-tag">${tag}</div>
      <div class="art-label">${esc(name)}</div>
    </div>`;
  }
  return `<a class="art-item" href="${esc(a.url)}" target="_blank" style="text-decoration:none">
    <div class="art-thumb"><span class="icon">📎</span></div>
    <div class="art-type-tag">${tag}</div>
    <div class="art-label">${esc(name)}</div>
  </a>`;
}

function attachmentHTML(a){
  const type = (a.type || guessType(a.url, a.name)).toLowerCase();
  const name = a.name || a.url?.split('/').pop() || 'file';
  if (type === 'image') {
    return `<div class="att-item" onclick="window.openLightbox('${esc(a.url)}')">
      <div class="att-thumb"><img src="${esc(a.url)}" alt="${esc(name)}" loading="lazy"/></div>
      <div class="att-label">${esc(name)}</div>
    </div>`;
  }
  return `<a class="att-item" href="${esc(a.url)}" target="_blank" style="text-decoration:none">
    <div class="att-thumb"><span class="icon">${type === 'pdf' ? '📄' : type === 'html' ? '🌐' : '📎'}</span></div>
    <div class="att-label">${esc(name)}</div>
  </a>`;
}

function guessType(url, name){
  const ext = (url || name || '').split('.').pop()?.toLowerCase() || '';
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return 'image';
  if (ext === 'svg') return 'svg';
  if (ext === 'pdf') return 'pdf';
  if (['htm','html'].includes(ext)) return 'html';
  if (['md','markdown'].includes(ext)) return 'md';
  if (['zip'].includes(ext)) return 'zip';
  return 'file';
}

// ─── INTERACTIONS ───
window.toggleMgr = (k) => {
  const el = document.querySelector(`.mgr[data-mgr="${k}"]`);
  if (el) el.classList.toggle('open');
  activeManager = (activeManager === k) ? 'all' : k;
  render();
};
window.toggleTask = id => {
  document.querySelector(`.task[data-id="${id}"]`)?.classList.toggle('open');
};
window.copyOut = (id, evt) => {
  evt.stopPropagation();
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  navigator.clipboard.writeText(t.output_markdown || '').then(() => showToast('Markdown copied'));
};
async function updateTask(id, body){
  const { error } = await supa.rpc('update_agent_task', {
    task_id: id, admin_pass: ADMIN_PASS,
    new_status: body.status ?? null,
    new_output: null, new_summary: null, new_subagents: null,
    new_progress: body.progress ?? null,
    new_artifacts: null, new_attachments: null,
  });
  if (error) { showToast('Update failed', 'err'); return false; }
  return true;
}
window.mark = async (id, newStatus) => {
  const progress = newStatus === 'running' ? 5 : (newStatus === 'completed' ? 100 : null);
  if (await updateTask(id, { status: newStatus, progress })) {
    const t = tasks.find(x => x.id === id);
    if (t) { t.status = newStatus; if (progress !== null) t.progress = progress; }
    render();
    showToast('Marked ' + newStatus);
  }
};
window.delTask = async id => {
  if (!confirm('Delete permanently?')) return;
  const { error } = await supa.rpc('delete_agent_task', { task_id: id, admin_pass: ADMIN_PASS });
  if (error) { showToast('Delete failed', 'err'); return; }
  tasks = tasks.filter(x => x.id !== id);
  render();
  showToast('Deleted');
};

// ─── LIGHTBOX ───
window.openLightbox = (url, type) => {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  if (type === 'pdf') {
    lb.innerHTML = `<iframe src="${esc(url)}"></iframe>`;
  } else {
    lb.innerHTML = `<img src="${esc(url)}" alt="" />`;
  }
  lb.classList.add('show');
};
document.getElementById('lightbox').addEventListener('click', () => {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('show');
  lb.innerHTML = '<img id="lightboxImg" />';
});

// ─── NEW TASK MODAL + FILE UPLOAD ───
const modalBack = document.getElementById('modalBack');
const newTaskBtn = document.getElementById('newTaskBtn');
const taskMgrSelect = document.getElementById('taskManager');
const mgrPreview = document.getElementById('mgrPreview');
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadPreview = document.getElementById('uploadPreview');
const taskForm = document.getElementById('taskForm');
const taskSubmit = document.getElementById('taskSubmit');

taskMgrSelect.innerHTML = '<option value="">— pick a manager —</option>' + Object.entries(MANAGERS).map(([k, m]) => `<option value="${k}">${m.name}</option>`).join('');
function updatePreview(){
  const m = MANAGERS[taskMgrSelect.value];
  if (!m) { mgrPreview.innerHTML = '<div class="lbl">Pick a manager to see available subagents</div>'; return; }
  mgrPreview.innerHTML = `<div class="lbl">${m.name} commands ${m.employees.length} subagents</div><div class="emps">${m.employees.map(e => '<span class="emp">'+e+'</span>').join('')}</div>`;
}
taskMgrSelect.addEventListener('change', updatePreview);
updatePreview();

newTaskBtn.addEventListener('click', () => { modalBack.classList.add('show'); pendingAttachments = []; renderUploadPreview(); taskForm.reset(); updatePreview(); });
document.getElementById('modalClose').addEventListener('click', () => modalBack.classList.remove('show'));
modalBack.addEventListener('click', e => { if (e.target === modalBack) modalBack.classList.remove('show'); });

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault(); uploadZone.classList.remove('drag');
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));
addEventListener('paste', e => {
  if (!modalBack.classList.contains('show')) return;
  const items = [...(e.clipboardData?.items || [])];
  const files = items.filter(i => i.kind === 'file').map(i => i.getAsFile()).filter(Boolean);
  if (files.length) handleFiles(files);
});

function handleFiles(fileList){
  const files = [...fileList];
  files.forEach(f => {
    if (f.size > 10 * 1024 * 1024) { showToast(`${f.name} > 10MB — skipped`, 'err'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      pendingAttachments.push({ name: f.name, type: f.type, size: f.size, file: f, preview: reader.result });
      renderUploadPreview();
    };
    reader.readAsDataURL(f);
  });
}

function renderUploadPreview(){
  uploadPreview.innerHTML = pendingAttachments.map((a, i) => {
    const isImg = a.type.startsWith('image/');
    return `<div class="upload-thumb">
      ${isImg ? `<img src="${a.preview}" alt="${esc(a.name)}"/>` : `<div class="file-icon">${a.name.endsWith('.pdf') ? '📄' : '📎'}</div>`}
      <button class="rm" onclick="window.rmAtt(${i})">×</button>
    </div>`;
  }).join('');
}
window.rmAtt = (i) => { pendingAttachments.splice(i, 1); renderUploadPreview(); };

async function uploadAttachment(att){
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
  taskSubmit.textContent = 'Uploading…';
  try {
    const uploaded = [];
    for (const att of pendingAttachments) uploaded.push(await uploadAttachment(att));
    taskSubmit.textContent = 'Queueing…';
    const fd = new FormData(taskForm);
    const data = Object.fromEntries(fd);
    const { error } = await supa.from('agent_tasks').insert({
      manager: data.manager, title: data.title.trim(), brief: data.brief.trim(),
      priority: data.priority, status: 'queued',
      attachments: uploaded,
    });
    if (error) throw error;
    modalBack.classList.remove('show');
    pendingAttachments = [];
    showToast('Task queued with ' + uploaded.length + ' files');
    const { data: refreshed } = await supa.rpc('get_agent_tasks', { admin_pass: ADMIN_PASS });
    tasks = refreshed || tasks;
    render();
  } catch (err) {
    console.error(err);
    showToast('Failed: ' + err.message, 'err');
  } finally {
    taskSubmit.disabled = false;
    taskSubmit.textContent = 'Queue task →';
  }
});

// ─── TOUR ───
const TOUR = [
  { illo:'🔥', title:'<span class="sans">Welcome</span> to the <em>control floor.</em>', body:'Scroll-revealed dashboard above a dystopian Tokyo campfire. Seven managers, fifty-one subagent skills, real execution. Let me show you around.' },
  { illo:'📊', title:'<em>Stats</em> + <em>live vitals</em> up top.', body:'Current state at a glance — total/running/queued/completed. Under that, <b>live vitals</b> show which managers are active right now with pulse indicators and load bars.' },
  { illo:'📈', title:'Four <em>live charts</em>.', body:'All computed from your real task data: <b>tasks per manager</b>, <b>status donut</b>, <b>completion velocity (7-day)</b>, <b>most-used subagents</b>. They update on every refresh.' },
  { illo:'🏢', title:'The <em>org chart</em> (left).', body:'Click any manager to expand their subagent roster. Click again to filter the task board to only their work.' },
  { illo:'📋', title:'The <em>task board</em> (right).', body:'Click any task to expand. You see the <b>brief, attached context files, subagents deployed, artifacts produced, and full markdown report</b>. Click images to open lightbox.' },
  { illo:'📎', title:'<em>Attach context</em> when queuing.', body:'The <b>+ New task</b> button opens the modal. Drop files, paste screenshots, attach decks or PDFs — they upload to storage and show up in the task detail for the manager to use as context.' },
];
const tourEl = document.getElementById('tour');
let tourStep = 0;
function renderTour(){
  const s = TOUR[tourStep];
  document.getElementById('tourStep').textContent = `${String(tourStep+1).padStart(2,'0')} · ${String(TOUR.length).padStart(2,'0')}`;
  document.getElementById('tourIllo').textContent = s.illo;
  document.getElementById('tourTitle').innerHTML = s.title;
  document.getElementById('tourBody').innerHTML = s.body;
  document.getElementById('tourDots').innerHTML = TOUR.map((_,i)=>`<div class="dot ${i===tourStep?'on':''}"></div>`).join('');
  document.getElementById('tourPrev').style.visibility = tourStep === 0 ? 'hidden' : 'visible';
  document.getElementById('tourNext').textContent = tourStep === TOUR.length - 1 ? 'Got it ✓' : 'Next →';
}
function startTour(){ tourStep = 0; renderTour(); tourEl.classList.add('show'); }
function endTour(){ tourEl.classList.remove('show'); localStorage.setItem('wiAgentsTourDone','1'); }
document.getElementById('tourPrev').addEventListener('click', () => { if (tourStep > 0) { tourStep--; renderTour(); } });
document.getElementById('tourNext').addEventListener('click', () => { if (tourStep < TOUR.length - 1) { tourStep++; renderTour(); } else endTour(); });
document.getElementById('tourSkip').addEventListener('click', endTour);
document.getElementById('helpBtn').addEventListener('click', startTour);
