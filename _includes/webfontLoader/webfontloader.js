WebFontConfig = {
    google: {
        families: ['Source Sans Pro:300,400,700']
    },
    timeout: 2400,
    // other options and settings
    active: function () {
        sessionStorage.fonts = true;
    }
};


(function(d) {
    var wf = d.createElement('script'), s = d.scripts[0];
    wf.src = 'https://cdnjs.cloudflare.com/ajax/libs/webfont/1.6.28/webfontloader.js';
    s.parentNode.insertBefore(wf, s);
})(document);