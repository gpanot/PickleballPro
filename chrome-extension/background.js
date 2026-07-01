// RacketPro Video Downloader - Background Service Worker

const tabData = new Map();

// Vimeo adaptive segment URL pattern
// .../v2/range/prot/<base64(range=X-Y)>/avf/<uuid>.mp4?pathsig=...&r=...&range=X-Y
const SEGMENT_PATTERN = /^(https:\/\/vod-adaptive-ak\.vimeocdn\.com\/.+?)\/v2\/range\/prot\/[^/]+\/avf\/([a-f0-9-]+\.mp4)\?(.+)$/;

function getTabData(tabId) {
  if (!tabData.has(tabId)) {
    tabData.set(tabId, {
      segments: new Map(),       // uuid -> Map<rangeStart, segInfo>
      progressive: [],
      lessonTitle: '',
      totalFileSize: new Map(),  // uuid -> exact file size from Content-Range header
    });
  }
  return tabData.get(tabId);
}

function parseSegmentUrl(url) {
  const m = url.match(SEGMENT_PATTERN);
  if (!m) return null;
  const qs = m[3];
  const pathsig = qs.match(/pathsig=([^&]+)/)?.[1] || '';
  const region  = qs.match(/(?:^|&)r=([^&]+)/)?.[1] || '';
  const rm      = qs.match(/(?:^|&)range=(\d+)-(\d+)/);
  if (!rm) return null;
  return {
    baseWithAuth: m[1],
    uuid: m[2],
    pathsig,
    region,
    rangeStart: parseInt(rm[1]),
    rangeEnd:   parseInt(rm[2]),
    fullUrl: url,
  };
}

// ─── Intercept outgoing requests ──────────────────────────────────────────────
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.url.includes('vimeocdn.com')) return;
    const p = parseSegmentUrl(details.url);
    if (!p) return;

    const data = getTabData(details.tabId);
    if (!data.segments.has(p.uuid)) data.segments.set(p.uuid, new Map());

    const byRange = data.segments.get(p.uuid);
    if (!byRange.has(p.rangeStart)) {
      byRange.set(p.rangeStart, {
        baseWithAuth: p.baseWithAuth,
        rangeStart: p.rangeStart,
        rangeEnd:   p.rangeEnd,
        pathsig:    p.pathsig,
        region:     p.region,
        fullUrl:    p.fullUrl,
        capturedAt: Date.now(),
      });
      notifyContentScript(details.tabId, data);
    }
  },
  { urls: ['https://*.vimeocdn.com/*'] },
  ['requestBody']
);

// ─── Capture total file size from Content-Range response header ───────────────
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (!details.url.includes('vimeocdn.com')) return;
    const p = parseSegmentUrl(details.url);
    if (!p) return;

    const data = getTabData(details.tabId);

    // Content-Range: bytes X-Y/TOTAL  ← this is the exact file size
    const cr = details.responseHeaders?.find(h => h.name.toLowerCase() === 'content-range');
    if (cr) {
      const m = cr.value.match(/bytes \d+-\d+\/(\d+)/);
      if (m) {
        const total = parseInt(m[1]);
        if (total > (data.totalFileSize.get(p.uuid) || 0)) {
          data.totalFileSize.set(p.uuid, total);
          notifyContentScript(details.tabId, data);
        }
      }
    }
  },
  { urls: ['https://*.vimeocdn.com/*'] },
  ['responseHeaders']
);

function notifyContentScript(tabId, data) {
  chrome.tabs.sendMessage(tabId, { type: 'DATA_UPDATED', summary: buildSummary(data) }).catch(() => {});
}

function buildSummary(data) {
  const files = [];

  for (const [uuid, byRange] of data.segments) {
    if (byRange.size === 0) continue;

    const segs = [...byRange.values()].sort((a, b) => a.rangeStart - b.rangeStart);
    const first = segs[0];
    const last  = segs[segs.length - 1];

    // Use Content-Range total if available, otherwise use max rangeEnd as a lower bound
    const exactFileSize = data.totalFileSize.get(uuid) || null;
    const segByteSize   = first.rangeEnd - first.rangeStart + 1;

    // Estimate total segment count from file size ÷ segment byte size
    // Only valid if we have the exact file size from Content-Range
    const estimatedTotalSegs = exactFileSize && segByteSize > 0
      ? Math.ceil(exactFileSize / segByteSize)
      : null; // null = unknown, show "?" in UI

    const displaySize = exactFileSize || (last.rangeEnd + 1);

    files.push({
      uuid,
      segmentCount:          segs.length,
      estimatedTotalSegs,    // null if unknown
      exactFileSize,
      displaySizeMB:         (displaySize / 1024 / 1024).toFixed(1),
      firstSegUrl:           first.fullUrl,
      capturedAt:            first.capturedAt,
      segments: segs.map(s => ({ url: s.fullUrl, start: s.rangeStart, end: s.rangeEnd })),
    });
  }

  // Larger file = video track
  files.sort((a, b) => (b.exactFileSize || 0) - (a.exactFileSize || 0));

  return { files, progressive: data.progressive, lessonTitle: data.lessonTitle };
}

// ─── Messages ─────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'GET_DATA') {
    const data = tabData.get(msg.tabId);
    sendResponse({ summary: data ? buildSummary(data) : { files: [], progressive: [], lessonTitle: '' } });
    return true;
  }

  if (msg.type === 'PROGRESSIVE_LINKS') {
    const data = getTabData(sender.tab.id);
    data.progressive = msg.links;
    data.lessonTitle = msg.lessonTitle || data.lessonTitle;
    notifyContentScript(sender.tab.id, data);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'LESSON_TITLE') {
    getTabData(sender.tab.id).lessonTitle = msg.title;
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'CLEAR') {
    // tabId -1 means "clear the tab this message came from"
    const tid = msg.tabId === -1 ? sender.tab?.id : msg.tabId;
    if (tid) tabData.delete(tid);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'DOWNLOAD') {
    chrome.downloads.download({
      url: msg.url,
      filename: sanitize(msg.filename),
      saveAs: true,
    }, (downloadId) => {
      sendResponse(chrome.runtime.lastError
        ? { error: chrome.runtime.lastError.message }
        : { downloadId });
    });
    return true; // keep channel open for async callback
  }

  if (msg.type === 'DOWNLOAD_SEGMENT_LIST') {
    // Fire all downloads immediately — no stagger needed, Chrome queues them
    const { segments, filenameBase } = msg;
    const base = sanitize(filenameBase);
    segments.forEach((seg, i) => {
      chrome.downloads.download({
        url: seg.url,
        filename: `${base}_seg${String(i).padStart(4, '0')}.mp4`,
        conflictAction: 'overwrite',
      });
    });
    // Respond synchronously — don't wait for all downloads to start
    sendResponse({ ok: true, count: segments.length });
    return false; // synchronous response, close channel
  }
});

function sanitize(name) {
  return (name || 'video').replace(/[^a-z0-9_\-. ]/gi, '_').trim().replace(/\s+/g, '_').substring(0, 100);
}

chrome.tabs.onRemoved.addListener((tabId) => tabData.delete(tabId));
