(function () {
    var root = document.getElementById('site-nav-root');
    if (!root) return;

    var page = document.body.getAttribute('data-nav-page');
    var path = window.location.pathname || '';
    var isPlayers = page === 'players' || path.indexOf('players') !== -1;
    var isLocal = window.location.protocol === 'file:';
    var academyHref = isLocal ? 'index.html' : '/';
    var playersHref = isLocal ? 'players.html' : '/players';

    var cta = isPlayers
        ? { href: '#download', label: 'Get the App' }
        : { href: '#', label: 'Start Now', onclick: 'openDownloadModal();return false;' };

    var bannerHtml = !isPlayers
        ? '<style>@media(max-width:768px){#sport-banner{justify-content:flex-start!important;text-align:left!important;}#sport-banner a{margin-left:auto;}}</style>' +
          '<div id="sport-banner" style="position:fixed;top:64px;left:0;width:100%;z-index:999;background:linear-gradient(90deg,#007AFF 0%,#0056cc 100%);color:#fff;text-align:center;padding:0.55rem 1rem;font-size:0.85rem;font-weight:700;letter-spacing:0.01em;box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:0.5rem 0.75rem;">' +
              '<span style="display:flex;align-items:center;gap:0.5rem;flex-shrink:1;min-width:0;">' +
                '<span style="background:#fff;color:#007AFF;border-radius:100px;padding:0.12rem 0.6rem;font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;white-space:nowrap;">NEW</span>' +
                '<span style="flex-shrink:1;">Earn more. Run your academy. All in one app.</span>' +
              '</span>' +
              '<a href="#" onclick="openDownloadModal();return false;" style="display:inline-block;background:#fff;color:#007AFF;border-radius:20px;padding:4px 14px;font-weight:500;font-size:0.85rem;white-space:nowrap;text-decoration:none;flex-shrink:0;line-height:1.4;">Start for FREE \u2192</a>' +
          '</div>'
        : '';

    root.innerHTML =
        '<nav class="site-nav" aria-label="Main">' +
            '<a href="' + academyHref + '" class="logo">AcademyPro</a>' +
            '<ul class="nav-links">' +
                '<li><a href="' + academyHref + '" class="nav-audience' + (isPlayers ? '' : ' active') + '">For Academies</a></li>' +
                '<li><a href="' + playersHref + '" class="nav-audience' + (isPlayers ? ' active' : '') + '">For Players</a></li>' +
            '</ul>' +
            '<a href="' + cta.href + '" class="nav-mobile-cta"' + (cta.onclick ? ' onclick="' + cta.onclick + '"' : '') + '>' + cta.label + '</a>' +
        '</nav>' +
        bannerHtml;

    document.body.classList.add('has-site-nav');

    // If banner is present, push page content down so nothing hides behind it.
    // We measure the banner's actual rendered height so wrapping on narrow screens
    // never leaves a gap between the banner and the hero content.
    if (!isPlayers) {
        var style = document.createElement('style');
        // Initial estimate — will be corrected by JS after render
        style.id = 'site-nav-push-style';
        style.textContent = 'body.has-site-nav { padding-top: 106px !important; } @media(max-width:768px){ #sport-banner { top: 52px; } body.has-site-nav { padding-top: 92px !important; } }';
        document.head.appendChild(style);

        function updateNavPush() {
            var navEl = document.querySelector('.site-nav');
            var bannerEl = document.getElementById('sport-banner');
            if (!navEl || !bannerEl) return;
            var navH = navEl.getBoundingClientRect().height;
            var bannerH = bannerEl.getBoundingClientRect().height;
            var total = Math.ceil(navH + bannerH);
            var pushStyle = document.getElementById('site-nav-push-style');
            if (pushStyle) {
                pushStyle.textContent =
                    'body.has-site-nav { padding-top: ' + total + 'px !important; }' +
                    '#sport-banner { top: ' + Math.ceil(navH) + 'px !important; }';
            }
        }

        // Run after layout is painted
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateNavPush);
        } else {
            // rAF ensures the banner has been laid out
            requestAnimationFrame(updateNavPush);
        }
        window.addEventListener('resize', updateNavPush);
    }

    if (!isPlayers) {
        var modalStyle = document.createElement('style');
        modalStyle.textContent = [
            '.download-modal { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 24px; opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.2s ease, visibility 0.2s ease; }',
            '.download-modal.is-open { opacity: 1; visibility: visible; pointer-events: auto; }',
            '.download-modal-backdrop { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.55); }',
            '.download-modal-panel { position: relative; width: min(100%, 420px); background: #fff; border-radius: 20px; padding: 36px 32px 32px; text-align: center; box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18); transform: translateY(12px) scale(0.98); transition: transform 0.2s ease; }',
            '.download-modal.is-open .download-modal-panel { transform: translateY(0) scale(1); }',
            '.download-modal-close { position: absolute; top: 14px; right: 14px; width: 36px; height: 36px; border: none; border-radius: 50%; background: #f1f5f9; color: #475569; font-size: 22px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; }',
            '.download-modal-close:hover { background: #e2e8f0; color: #0f172a; }',
            '.download-modal-title { font-size: clamp(24px, 4vw, 30px); font-weight: 800; line-height: 1.15; color: #0f172a; margin-bottom: 10px; }',
            '.download-modal-text { color: #475569; font-size: 15px; line-height: 1.55; margin-bottom: 24px; }',
            '.download-modal .store-row { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }',
            '.download-modal .store-badge { display: inline-block; line-height: 0; transition: opacity 0.15s, transform 0.15s; }',
            '.download-modal .store-badge:hover { opacity: 0.92; }',
            '.download-modal .store-badge:active { transform: translateY(1px); }',
            '.download-modal .store-badge img { height: 44px; width: auto; display: block; }',
            'body.download-modal-open { overflow: hidden; }'
        ].join('');
        document.head.appendChild(modalStyle);

        function ensureDownloadModal() {
            if (document.getElementById('download-modal')) return;
            var modal = document.createElement('div');
            modal.id = 'download-modal';
            modal.className = 'download-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'download-modal-title');
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML =
                '<div class="download-modal-backdrop" onclick="closeDownloadModal()"></div>' +
                '<div class="download-modal-panel">' +
                    '<button type="button" class="download-modal-close" onclick="closeDownloadModal()" aria-label="Close">&times;</button>' +
                    '<h2 id="download-modal-title" class="download-modal-title">Start Now</h2>' +
                    '<p class="download-modal-text">Download AcademyPro and launch your academy on Pickleball or Padel.</p>' +
                    '<div class="store-row">' +
                        '<a href="https://apps.apple.com/us/app/picklepro-pickleball-hero/id6753142959" class="store-badge" aria-label="Download on the App Store" target="_blank" rel="noopener noreferrer">' +
                            '<img src="Assets/Store=App Store, Type=Light, Language=English@4x.png" alt="Download on the App Store" height="44">' +
                        '</a>' +
                        '<a href="https://play.google.com/store/apps/details?id=com.picklepro.mobile" class="store-badge" aria-label="Get it on Google Play" target="_blank" rel="noopener noreferrer">' +
                            '<img src="Assets/Store=Google Play, Type=Light, Language=English@4x.png" alt="Get it on Google Play" height="44">' +
                        '</a>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(modal);
        }

        window.openDownloadModal = function () {
            ensureDownloadModal();
            var modal = document.getElementById('download-modal');
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('download-modal-open');
        };

        window.closeDownloadModal = function () {
            var modal = document.getElementById('download-modal');
            if (!modal) return;
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('download-modal-open');
        };

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && document.body.classList.contains('download-modal-open')) {
                window.closeDownloadModal();
            }
        });
    }
})();
