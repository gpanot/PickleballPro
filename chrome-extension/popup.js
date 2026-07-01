// RacketPro Video Downloader - Popup Script

let summary = null;
let activeTabId = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { showError('No active tab'); return; }
  activeTabId = tab.id;

  if (!tab.url?.includes('racketpro.org')) {
    document.getElementById('content').innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎾</div>
        <div class="empty-title">Go to RacketPro first</div>
        <div class="empty-desc">Open a RacketPro course page, start a video lesson, then click <strong>⚡ Turbo</strong> in the floating button on the page.</div>
        <button onclick="chrome.tabs.create({url:'https://racketpro.org/en/course?id=2'})" class="open-btn">Open RacketPro</button>
      </div>`;
    return;
  }

  await load();
}

async function load() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_DATA', tabId: activeTabId });
    summary = res?.summary;
    render();
  } catch (e) { showError('Could not load: ' + e.message); }
}

function render() {
  const content = document.getElementById('content');
  const subtitle = document.getElementById('subtitle');
  const s = summary;
  const hasP = s?.progressive?.length > 0;
  const hasS = s?.files?.length > 0;
  const title = s?.lessonTitle || '—';
  subtitle.textContent = title.length > 38 ? title.slice(0, 38) + '…' : title;

  // Turbo hint bar
  let captured = 0, totalSegs = 0, knownTotal = false;
  if (hasS) {
    for (const f of s.files) {
      captured += f.segmentCount;
      if (f.estimatedTotalSegs != null) { totalSegs += f.estimatedTotalSegs; knownTotal = true; }
    }
  }
  const allDone = knownTotal && captured >= totalSegs && totalSegs > 0;
  const pct = knownTotal && totalSegs > 0 ? Math.min(100, Math.round((captured / totalSegs) * 100)) : null;

  let turboHint = `
    <div class="turbo-bar">
      <div class="turbo-text">
        ${hasS
          ? (knownTotal
              ? `${captured} / ${totalSegs} segments${allDone ? ' ✓ ready' : ' — use ⚡ Turbo on the page'}`
              : `${captured} segments captured — waiting for size info`)
          : 'Play a lesson first, then use ⚡ Turbo on the page to grab all segments instantly'}
      </div>
      ${pct != null ? `<div class="progress-bg"><div class="progress-fill" style="width:${pct}%;background:${allDone?'#22c55e':'#f59e0b'};"></div></div>` : ''}
    </div>`;

  if (!hasP && !hasS) {
    content.innerHTML = turboHint + `
      <div class="empty">
        <div class="empty-icon">⏳</div>
        <div class="empty-title">No video detected yet</div>
        <div class="empty-desc">Start a video lesson on the RacketPro page, then click the <strong style="color:#fbbf24;">⚡ Turbo scan</strong> button on the floating panel to capture all segments in seconds.</div>
      </div>`;
    return;
  }

  let html = turboHint;

  if (hasP) {
    html += `<div class="section-label">⚡ Direct Downloads</div>`;
    [...s.progressive].sort((a, b) => (b.height||0)-(a.height||0)).forEach((p, i) => {
      const q = p.quality || `${p.width||'?'}×${p.height||'?'}`;
      const fps = p.fps ? ` · ${p.fps}fps` : '';
      html += `<div class="track">
        <div class="track-header">
          <span class="track-label">${q}${fps}</span>
          <span class="track-badge" style="color:#38bdf8;">Direct</span>
        </div>
        <div class="track-actions">
          <button class="btn btn-primary" data-action="dl-prog" data-idx="${i}">Download</button>
          <button class="btn btn-secondary" data-action="copy-prog" data-idx="${i}">Copy URL</button>
        </div>
      </div>`;
    });
  }

  if (hasS) {
    html += `<div class="section-label" style="margin-top:${hasP?10:0}px;">${hasP ? '📦 Segments' : '📦 Adaptive Segments'}</div>`;
    s.files.forEach((f, i) => {
      const label = s.files.length >= 2 ? (i===0 ? '🎬 Video' : '🔊 Audio') : '🎬 Video';
      const n = f.segmentCount;
      const tot = f.estimatedTotalSegs;
      const fp = tot != null ? Math.min(100, Math.round((n / tot) * 100)) : null;
      const done = tot != null && n >= tot;
      html += `<div class="track">
        <div class="track-header">
          <span class="track-label">${label}</span>
          <span class="track-badge" style="color:${done?'#86efac':'#f59e0b'};">
            ${n}${tot ? '/'+tot : ''} segs · ${f.displaySizeMB} MB${done?' ✓':''}
          </span>
        </div>
        ${fp!=null ? `<div class="progress-bg"><div class="progress-fill" style="width:${fp}%;background:${done?'#22c55e':'#3b82f6'};"></div></div>` : ''}
        <div class="track-actions">
          <button class="btn btn-primary" data-action="dl-segs" data-idx="${i}">
            ${done ? 'Download all '+n : 'Download '+n+' captured'}
          </button>
          <button class="btn btn-secondary" data-action="copy-seg" data-idx="${i}">1st URL</button>
        </div>
      </div>`;
    });

    if (s.files.length >= 2) {
      html += `<div class="tip">
        <strong>Merge after downloading:</strong>
        <code>cat video_seg*.mp4 > v.mp4\ncat audio_seg*.mp4 > a.mp4\nffmpeg -i v.mp4 -i a.mp4 -c copy out.mp4</code>
      </div>`;
    }
  }

  content.innerHTML = html;

  // Wire buttons
  content.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const idx = parseInt(btn.dataset.idx);
      const t = s.lessonTitle || 'video';
      const orig = btn.textContent;

      if (action === 'dl-prog') {
        const p = [...s.progressive].sort((a,b)=>(b.height||0)-(a.height||0))[idx];
        const q = p.quality || `${p.width}x${p.height}`;
        btn.textContent = '…'; btn.disabled = true;
        const res = await chrome.runtime.sendMessage({ type: 'DOWNLOAD', url: p.url, filename: san(t)+' - '+q+'.mp4' });
        status(res?.error ? 'Error: '+res.error : 'Download started!');
        btn.textContent = res?.error ? '✗' : '✓';
        btn.style.background = res?.error ? '#7f1d1d' : '#166534';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3000);

      } else if (action === 'copy-prog') {
        const p = [...s.progressive].sort((a,b)=>(b.height||0)-(a.height||0))[idx];
        await copyUrl(p.url, btn, orig);

      } else if (action === 'dl-segs') {
        const f = s.files[idx];
        if (!f?.segments?.length) { status('No segments yet'); return; }
        btn.textContent = 'Queuing…'; btn.disabled = true;
        const res = await chrome.runtime.sendMessage({
          type: 'DOWNLOAD_SEGMENT_LIST',
          segments: f.segments,
          filenameBase: san(t) + '_' + (idx === 0 ? 'video' : 'audio'),
        });
        status(`Queued ${res?.count || f.segments.length} downloads — check your Downloads folder`);
        btn.textContent = '✓ Queued'; btn.style.background = '#166534';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 4000);

      } else if (action === 'copy-seg') {
        const f = s.files[idx];
        await copyUrl(f.firstSegUrl, btn, orig);
      }
    });
  });
}

async function copyUrl(url, btn, orig) {
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = '✓ Copied'; btn.style.color = '#86efac';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 2000);
  } catch { chrome.tabs.create({ url }); }
}

function status(msg) {
  document.getElementById('status').textContent = msg;
}

function showError(msg) {
  document.getElementById('content').innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div><div class="empty-title">${msg}</div></div>`;
}

function san(s) { return (s||'video').replace(/[^a-z0-9 _-]/gi,'_').trim().substring(0,60); }

document.getElementById('btn-refresh').addEventListener('click', load);
document.getElementById('btn-clear').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR', tabId: activeTabId });
  summary = null; render(); status('Cleared');
});

init();
