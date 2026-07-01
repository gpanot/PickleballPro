# RacketPro Video Downloader — Chrome Extension

A Chrome extension to download videos from [RacketPro](https://racketpro.org) course pages.

## How it works

RacketPro embeds Vimeo videos using **adaptive streaming** (MediaSource Extensions):
- Videos are split into byte-range segments served from `vod-adaptive-ak.vimeocdn.com`
- Each segment has a signed URL (`pathsig=` token) — you cannot reconstruct a full-file URL by changing the range
- The extension uses two strategies to capture downloads:

**Strategy 1 — Direct download links (best)**  
When you play a video, the Vimeo player fetches a config JSON from `player.vimeo.com/video/{id}/config`.  
This config often contains `progressive` download links at multiple qualities (1080p, 720p, 540p, etc.).  
The extension intercepts this config response and presents direct, single-file MP4 download links.

**Strategy 2 — Segment collection (fallback)**  
If progressive links aren't available (DRM-protected content), the extension intercepts all segment requests via `chrome.webRequest` and lets you download each segment individually, then merge them with `ffmpeg`.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder
5. The extension icon appears in your toolbar

## Usage

1. Navigate to a RacketPro course page (e.g., `https://racketpro.org/en/course?id=2`)
2. Log in and click on a video lesson to start playing it
3. Click the **download button** (blue circle, bottom-right corner of the page), OR click the **extension icon** in the toolbar
4. Available download options appear automatically:
   - **Direct downloads**: Click to download a complete MP4 at your chosen quality
   - **Segments**: Download all segments, then merge with `ffmpeg`

## Merging segments with ffmpeg

If you downloaded segments (Strategy 2):

```bash
# Step 1: Sort and concatenate video segments
cat video_*_seg*.mp4 > video_raw.mp4

# Step 2: Sort and concatenate audio segments  
cat audio_*_seg*.mp4 > audio_raw.mp4

# Step 3: Merge video + audio into final file
ffmpeg -i video_raw.mp4 -i audio_raw.mp4 -c copy output.mp4
```

## Files

```
chrome-extension/
├── manifest.json      # Extension config (MV3)
├── background.js      # Service worker: webRequest interception, download management
├── content.js         # Page script: fetch interception, floating UI
├── popup.html/js      # Extension popup UI
├── icon*.png          # Extension icons
└── README.md          # This file
```

## Technical notes

- Uses **Manifest V3** (current Chrome standard)
- `webRequest` permission is used in non-blocking mode (no response modification)
- The content script runs at `document_start` to intercept the Vimeo player config fetch before the page JS runs
- Signed segment URLs expire — download promptly after capturing
