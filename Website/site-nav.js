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

    root.innerHTML =
        '<nav class="site-nav" aria-label="Main">' +
            '<a href="' + academyHref + '" class="logo">PicklePro</a>' +
            '<ul class="nav-links">' +
                '<li><a href="' + academyHref + '" class="nav-audience' + (isPlayers ? '' : ' active') + '">For Academies</a></li>' +
                '<li><a href="' + playersHref + '" class="nav-audience' + (isPlayers ? ' active' : '') + '">For Players</a></li>' +
            '</ul>' +
            '<a href="' + cta.href + '" class="nav-mobile-cta">' + cta.label + '</a>' +
        '</nav>';

    document.body.classList.add('has-site-nav');
})();
