// RacketPro Video Downloader - Content Script
// Runs at document_start on racketpro.org

(function () {
  'use strict';

  // ── Intercept fetch to capture Vimeo player config (progressive links) ────
  const _origFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const response = await _origFetch.apply(this, args);
    if (url.includes('player.vimeo.com') && url.includes('config')) {
      try {
        const json = await response.clone().json();
        const progressive = (json?.request?.files?.progressive || [])
          .map(p => ({ url: p.url, quality: p.quality, width: p.width, height: p.height, fps: p.fps }))
          .filter(p => p.url);
        const lessonTitle = json?.video?.title || '';
        if (progressive.length || lessonTitle) {
          chrome.runtime.sendMessage({ type: 'PROGRESSIVE_LINKS', links: progressive, lessonTitle }).catch(() => {});
        }
      } catch (_) {}
    }
    return response;
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let summary = null;
  let panelOpen = false;
  let turboActive = false;
  let turboTimer = null;

  // ── Init UI after DOM is ready ────────────────────────────────────────────
  function initUI() {
    if (!document.body) { requestAnimationFrame(initUI); return; }
    injectStyles();
    document.body.appendChild(makeFloatBtn());
    document.body.appendChild(makePanel());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
  else initUI();

  // Listen for updates from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type !== 'DATA_UPDATED') return;
    summary = msg.summary;
    updateBadge();
    if (panelOpen) repaint();
  });

  // ── Turbo ─────────────────────────────────────────────────────────────────
  function runTurbo() {
    if (turboActive) { stopTurbo(); return; }

    const video = document.querySelector('video');
    if (!video) { toast('Play a lesson first, then use Turbo', 'warn'); return; }
    if (!video.duration || isNaN(video.duration) || video.duration < 1) {
      toast('Video still loading — try again in a second', 'warn'); return;
    }

    turboActive = true;
    const dur = video.duration;
    const savedVol = video.volume;
    const savedMuted = video.muted;
    const savedTime = video.currentTime;
    video.muted = true;
    video.volume = 0;

    // Seek every 8s of video content every 300ms wall-clock → ~26× faster than realtime
    const STEP = 8;
    let pos = 0;
    const totalSteps = Math.ceil(dur / STEP);
    let step = 0;

    toast(`Turbo: scanning ${Math.round(dur)}s video…`, 'info');

    turboTimer = setInterval(() => {
      if (!turboActive || pos > dur) {
        clearInterval(turboTimer); turboTimer = null;
        turboActive = false;
        try { video.muted = savedMuted; video.volume = savedVol; video.currentTime = savedTime; video.pause(); } catch (_) {}
        toast('Turbo done — all segments captured!', 'ok');
        repaint();
        return;
      }
      try { video.currentTime = Math.min(pos, dur - 0.1); } catch (_) {}
      pos += STEP;
      step++;
      // Update button text live
      const pct = Math.min(100, Math.round((step / totalSteps) * 100));
      const btn = document.getElementById('rp-turbo');
      if (btn) btn.textContent = turboActive ? `⚡ ${pct}% — tap to stop` : '⚡ Turbo scan';
    }, 300);
  }

  function stopTurbo() {
    turboActive = false;
    if (turboTimer) { clearInterval(turboTimer); turboTimer = null; }
    const btn = document.getElementById('rp-turbo');
    if (btn) btn.textContent = '⚡ Turbo scan';
    toast('Turbo stopped', 'warn');
  }

  // ── Floating button ───────────────────────────────────────────────────────
  function makeFloatBtn() {
    const btn = document.createElement('button');
    btn.id = 'rp-fab';
    btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span id="rp-badge"></span>`;
    btn.onclick = () => togglePanel();
    return btn;
  }

  function makePanel() {
    const el = document.createElement('div');
    el.id = 'rp-panel';
    return el;
  }

  function updateBadge() {
    const b = document.getElementById('rp-badge');
    if (!b) return;
    const n = (summary?.files?.length || 0) + (summary?.progressive?.length ? 1 : 0);
    b.textContent = n; b.style.display = n ? 'flex' : 'none';
  }

  function togglePanel() {
    const panel = document.getElementById('rp-panel');
    if (!panel) return;
    panelOpen = !panelOpen;
    panel.style.display = panelOpen ? 'flex' : 'none';
    if (panelOpen) repaint();
  }

  function repaint() {
    const panel = document.getElementById('rp-panel');
    if (!panel) return;
    paint(panel);
  }

  // ── Main render ───────────────────────────────────────────────────────────
  function paint(panel) {
    const s = summary;
    const title = s?.lessonTitle || document.title || 'Video';
    const hasP = s?.progressive?.length > 0;
    const hasS = s?.files?.length > 0;

    // Overall turbo progress
    let captured = 0, totalSegs = 0, knownTotal = false;
    if (hasS) {
      for (const f of s.files) {
        captured += f.segmentCount;
        if (f.estimatedTotalSegs != null) { totalSegs += f.estimatedTotalSegs; knownTotal = true; }
      }
    }
    const pct = knownTotal && totalSegs > 0 ? Math.min(100, Math.round((captured / totalSegs) * 100)) : null;
    const allDone = knownTotal && captured >= totalSegs && totalSegs > 0;
    const turboBg = turboActive ? '#92400e' : (allDone ? '#14532d' : '#78350f');
    const turboLabel = turboActive
      ? `⚡ Scanning… tap to stop`
      : allDone ? '⚡ Complete ✓' : '⚡ Turbo scan';

    // Turbo bar
    const turboBar = `
      <div style="padding:10px 14px;border-bottom:1px solid #1e293b;background:#150e00;">
        <div style="display:flex;gap:8px;align-items:center;${hasS ? 'margin-bottom:6px;' : ''}">
          <div style="flex:1;font-size:11px;color:#a16207;line-height:1.4;">
            ${hasS
              ? (knownTotal
                  ? `${captured} / ${totalSegs} segments · ${allDone ? '✓ ready' : 'use Turbo to finish'}`
                  : `${captured} segments captured · waiting for size info…`)
              : 'Start a video lesson, then tap Turbo to grab everything instantly'}
          </div>
          <button id="rp-turbo" onclick="window._rp.turbo()"
            style="background:${turboBg};color:#fde68a;border:none;border-radius:6px;padding:6px 11px;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;flex-shrink:0;">
            ${turboLabel}
          </button>
        </div>
        ${hasS && pct != null ? `
          <div style="background:#0f172a;border-radius:3px;height:3px;overflow:hidden;">
            <div style="background:${allDone ? '#22c55e' : '#f59e0b'};height:100%;width:${pct}%;"></div>
          </div>` : ''}
      </div>`;

    // Progressive links
    let progHtml = '';
    if (hasP) {
      const rows = [...s.progressive]
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map(p => {
          const q = p.quality || `${p.width || '?'}×${p.height || '?'}`;
          const fps = p.fps ? ` · ${p.fps}fps` : '';
          return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #1e293b;">
            <span style="font-weight:600;color:#60a5fa;">${h(q)}${fps}</span>
            <div style="display:flex;gap:6px;">
              <button class="rp-btn rp-pri" onclick="window._rp.dl('${e(p.url)}','${e(title+' - '+q+'.mp4')}',this)">Download</button>
              <button class="rp-btn rp-ghost" onclick="window._rp.cp('${e(p.url)}',this)">URL</button>
            </div>
          </div>`;
        }).join('');
      progHtml = `<div style="background:#0c4a6e;border-radius:10px;padding:14px;margin-bottom:12px;">
        <div style="font-weight:700;color:#38bdf8;margin-bottom:10px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;">✓ Direct Downloads (single file, best)</div>
        ${rows}
      </div>`;
    }

    // Segment files
    let segsHtml = '';
    if (hasS) {
      const items = s.files.map((f, i) => {
        const label = s.files.length >= 2 ? (i === 0 ? '🎬 Video' : '🔊 Audio') : '🎬 Video';
        const n = f.segmentCount;
        const tot = f.estimatedTotalSegs;
        const fp = tot != null ? Math.min(100, Math.round((n / tot) * 100)) : null;
        const done = tot != null && n >= tot;
        const dlLabel = done ? `⬇ Download all ${n}` : `⬇ Download ${n} captured${tot ? ' / '+tot : ''}`;
        return `<div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${fp!=null?6:10}px;">
            <span style="font-weight:600;color:#93c5fd;">${label}</span>
            <span style="color:${done?'#86efac':'#f59e0b'};font-size:11px;font-weight:600;">
              ${n}${tot?'/'+tot:''} segs · ${f.displaySizeMB} MB${done?' ✓':''}
            </span>
          </div>
          ${fp!=null?`<div style="background:#0f172a;border-radius:3px;height:3px;margin-bottom:10px;overflow:hidden;"><div style="background:${done?'#22c55e':'#3b82f6'};height:100%;width:${fp}%;"></div></div>`:''}
          <div style="display:flex;gap:6px;">
            <button class="rp-btn rp-pri" style="flex:1;" onclick="window._rp.segs('${h(f.uuid)}',this)">${dlLabel}</button>
            <button class="rp-btn rp-ghost" onclick="window._rp.cp('${e(f.firstSegUrl)}',this)">1st URL</button>
          </div>
        </div>`;
      }).join('');

      const merge = s.files.length >= 2 ? `
        <div style="background:#1c1917;border:1px solid #292524;border-radius:8px;padding:10px;margin-top:6px;font-size:11px;color:#a8a29e;line-height:1.5;">
          <strong style="color:#d4a574;">After downloading, merge:</strong>
          <code style="display:block;margin-top:4px;background:#0c0a09;color:#86efac;padding:6px;border-radius:4px;font-size:10px;font-family:monospace;white-space:pre;">cat video_seg*.mp4 > v.mp4
cat audio_seg*.mp4 > a.mp4
ffmpeg -i v.mp4 -i a.mp4 -c copy out.mp4</code>
        </div>` : '';

      const lbl = hasP
        ? `<div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">📦 Segments (fallback)</div>`
        : `<div style="font-size:10px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">📦 Adaptive Segments</div>`;
      segsHtml = lbl + items + merge;
    }

    const empty = !hasP && !hasS ? `
      <div style="text-align:center;padding:28px 16px;color:#475569;">
        <div style="font-size:32px;margin-bottom:10px;">⏳</div>
        <div style="font-weight:700;font-size:14px;color:#94a3b8;margin-bottom:6px;">Waiting for video</div>
        <div style="font-size:12px;line-height:1.6;">Click a lesson to start it, then press <strong style="color:#fbbf24;">⚡ Turbo scan</strong> above.</div>
      </div>` : '';

    panel.innerHTML = `
      <div style="padding:13px 15px 11px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <div style="font-weight:700;font-size:14px;color:#f1f5f9;">RacketPro Downloader</div>
          <div style="color:#475569;font-size:11px;margin-top:2px;max-width:270px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${h(title)}">${h(title)}</div>
        </div>
        <button onclick="window._rp.close()" style="background:none;border:none;color:#475569;cursor:pointer;font-size:20px;line-height:1;padding:0;">✕</button>
      </div>
      ${turboBar}
      <div style="padding:12px 14px;overflow-y:auto;flex:1;">${empty}${progHtml}${segsHtml}</div>
      <div style="padding:9px 14px;border-top:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;">
        <span id="rp-st" style="color:#475569;font-size:11px;"></span>
        <button onclick="window._rp.clear()" style="background:none;border:1px solid #334155;color:#64748b;border-radius:5px;padding:4px 10px;cursor:pointer;font-size:11px;">Clear</button>
      </div>`;

    window._rp = {
      close: togglePanel,
      turbo: runTurbo,
      clear() {
        // Get actual tab id via background ping
        chrome.runtime.sendMessage({ type: 'CLEAR', tabId: -1 }).catch(() => {});
        summary = null; updateBadge(); repaint();
      },
      dl(eu, ef, btn) {
        const url = decodeURIComponent(eu), file = decodeURIComponent(ef);
        const orig = btn.textContent; btn.textContent = '…'; btn.disabled = true;
        chrome.runtime.sendMessage({ type: 'DOWNLOAD', url, filename: file })
          .then(r => {
            btn.textContent = r?.error ? '✗ Error' : '✓ Started';
            btn.style.background = r?.error ? '#7f1d1d' : '#166534';
            st(r?.error ? 'Error: ' + r.error : 'Download started!');
            setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3000);
          }).catch(() => window.open(url, '_blank'));
      },
      cp(eu, btn) {
        navigator.clipboard.writeText(decodeURIComponent(eu))
          .then(() => { const o = btn.textContent; btn.textContent = '✓'; btn.style.color = '#86efac'; setTimeout(() => { btn.textContent = o; btn.style.color = ''; }, 2000); })
          .catch(() => prompt('Copy URL:', decodeURIComponent(eu)));
      },
      segs(uuid, btn) {
        const f = summary?.files?.find(x => x.uuid === uuid);
        if (!f || !f.segments?.length) { st('No segments captured yet'); return; }
        const title = summary?.lessonTitle || document.title || 'video';
        const i = summary.files.indexOf(f);
        const orig = btn.textContent; btn.textContent = 'Starting…'; btn.disabled = true;
        chrome.runtime.sendMessage({
          type: 'DOWNLOAD_SEGMENT_LIST',
          segments: f.segments,
          filenameBase: san(title) + '_' + (i === 0 ? 'video' : 'audio'),
        }).then(r => {
          st(`Queued ${r?.count || f.segments.length} downloads`);
          btn.textContent = '✓ Queued'; btn.style.background = '#166534';
          setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3000);
        }).catch(err => { st('Error: ' + err.message); btn.textContent = orig; btn.disabled = false; });
      },
    };
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('rp-css')) return;
    const s = document.createElement('style');
    s.id = 'rp-css';
    s.textContent = `
      #rp-fab{position:fixed!important;bottom:24px!important;right:24px!important;width:52px!important;height:52px!important;
        background:#1d4ed8!important;color:#fff!important;border-radius:50%!important;
        display:flex!important;align-items:center!important;justify-content:center!important;
        cursor:pointer!important;z-index:2147483647!important;box-shadow:0 4px 20px rgba(0,0,0,0.4)!important;
        border:none!important;outline:none!important;transition:transform .15s,box-shadow .15s!important;}
      #rp-fab:hover{transform:scale(1.08)!important;box-shadow:0 6px 28px rgba(0,0,0,0.5)!important;}
      #rp-badge{position:absolute!important;top:-3px!important;right:-3px!important;background:#ef4444!important;
        color:#fff!important;border-radius:50%!important;width:18px!important;height:18px!important;
        font-size:10px!important;font-weight:700!important;display:none!important;
        align-items:center!important;justify-content:center!important;}
      #rp-panel{position:fixed!important;bottom:90px!important;right:24px!important;width:380px!important;
        max-height:560px!important;background:#0f172a!important;border-radius:14px!important;
        box-shadow:0 12px 48px rgba(0,0,0,0.6)!important;z-index:2147483646!important;
        display:none!important;flex-direction:column!important;overflow:hidden!important;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important;
        font-size:13px!important;color:#e2e8f0!important;border:1px solid rgba(255,255,255,0.08)!important;}
      .rp-btn{padding:7px 10px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;}
      .rp-btn:disabled{opacity:0.45;cursor:not-allowed;}
      .rp-pri{background:#1d4ed8;color:#fff;} .rp-pri:hover:not(:disabled){background:#2563eb;}
      .rp-ghost{background:#1e293b;color:#94a3b8;border:1px solid #334155;} .rp-ghost:hover:not(:disabled){background:#334155;}
    `;
    document.head.appendChild(s);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function st(msg) { const el = document.getElementById('rp-st'); if (el) el.textContent = msg; }
  function h(s) { return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function e(s) { return encodeURIComponent(s||''); }
  function san(s) { return (s||'video').replace(/[^a-z0-9 _-]/gi,'_').trim().substring(0,60); }

  function toast(msg, type = 'info') {
    const bg = {info:'#1e3a5f',ok:'#14532d',warn:'#78350f',error:'#7f1d1d'}[type]||'#1e3a5f';
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = `position:fixed!important;bottom:90px!important;right:88px!important;background:${bg}!important;
      color:#fff!important;padding:9px 14px!important;border-radius:8px!important;font-size:12px!important;
      font-weight:600!important;z-index:2147483648!important;box-shadow:0 4px 16px rgba(0,0,0,0.4)!important;
      max-width:280px!important;font-family:sans-serif!important;border:1px solid rgba(255,255,255,0.1)!important;`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }
})();
