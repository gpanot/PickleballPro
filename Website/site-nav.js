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
        : { href: 'https://cal.id/guillaume-panot/piklepro-academy', label: 'Start Free Trial' };

    var bannerHtml = !isPlayers
        ? '<div id="sport-banner" style="position:fixed;top:64px;left:0;width:100%;z-index:999;background:linear-gradient(90deg,#007AFF 0%,#0056cc 100%);color:#fff;text-align:center;padding:0.55rem 1rem;font-size:0.85rem;font-weight:700;letter-spacing:0.01em;box-sizing:border-box;">' +
              '<span style="background:rgba(255,255,255,0.22);border-radius:100px;padding:0.12rem 0.55rem;font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;margin-right:0.55rem;">NEW</span>' +
              'Start your Academy for <span style="text-decoration:underline;text-underline-offset:3px;">Pickleball</span> or <span style="text-decoration:underline;text-underline-offset:3px;">Padel</span> \u2014 one platform, both sports.\u00a0' +
              '<a href="https://cal.id/guillaume-panot/piklepro-academy" style="color:#fff;opacity:0.85;font-weight:600;white-space:nowrap;">Book a demo \u2192</a>' +
          '</div>'
        : '';

    root.innerHTML =
        '<nav class="site-nav" aria-label="Main">' +
            '<a href="' + academyHref + '" class="logo">AcademyPro</a>' +
            '<ul class="nav-links">' +
                '<li><a href="' + academyHref + '" class="nav-audience' + (isPlayers ? '' : ' active') + '">For Academies</a></li>' +
                '<li><a href="' + playersHref + '" class="nav-audience' + (isPlayers ? ' active' : '') + '">For Players</a></li>' +
            '</ul>' +
            '<a href="' + cta.href + '" class="nav-mobile-cta">' + cta.label + '</a>' +
        '</nav>' +
        bannerHtml;

    document.body.classList.add('has-site-nav');

    // If banner is present, push page content down so nothing hides behind it
    if (!isPlayers) {
        var style = document.createElement('style');
        style.textContent = 'body.has-site-nav { padding-top: 106px !important; } @media(max-width:768px){ #sport-banner { top: 52px; } body.has-site-nav { padding-top: 92px !important; } }';
        document.head.appendChild(style);
    }
})();
