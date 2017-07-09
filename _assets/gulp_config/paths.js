var paths = {},
    assetSass = require('node-sass-asset-functions'),
    forceCritical = require('../critical.json'),
    devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production');

// #Directory Locations
paths.source = './';
paths.dest = '_site/';
paths.assetsDirIn = paths.source + '_assets/';
paths.assetsDirOut = paths.dest + 'assets/';
paths.includeDir = paths.source + '_includes/';
paths.jekyllHtmlWatch = ['*.html', '_includes/*.html', '_layouts/*.html', '_posts/*', '_config.yml'];
paths.criticalPath = paths.includeDir + 'critical.css';
paths.generatedDir = paths.assetsDirIn + 'generated/';
paths.site = '';
paths.cleanPaths = [paths.dest, paths.generatedDir + '.', paths.source + 'css/.'];
paths.deployPath = [paths.source + '.publish/'];


//#Images
paths.imagedir = {
    in: paths.assetsDirIn + 'images/**/*',
    out: paths.assetsDirOut + 'images',

    imgOpts: {
        cache: false
    }
};
// #htmldir
paths.htmldir = {
    in: paths.dest + '**/*.html',
    out: paths.generatedDir + 'html/',
    jekyllOut: paths.dest,

    removeUnused: {
        html: [paths.dest + '**/*.html'],
        ignore: []
    },

    minifyOpts: {
        collapseWhitespace: true,
        removeComments: true,
        removeEmptyAttributes: true
    }
};

// #cssdir
paths.cssdir = {
    in: paths.assetsDirIn + 'scss/*.scss',
    jekyllOut: paths.source + 'css/',
    stream: paths.dest + 'css/',
    out: paths.generatedDir + 'css/',
    mini: {suffix: '.min'},

    // Pleeease
    sassOpts: {
        outputStyle: 'expanded',
        precision: 3,
        errLogToConsole: true,

        functions: assetSass({
            http_images_path: '../assets/images',
            http_fonts_path: '../assets/fonts/'
        })
    },

    // PropertySortOrder
    sortOrder: {
        order: 'smacss',
        verbose: true
    },


    // Automaton
    automaton: {
        options: {
            autoprefixer: {browsers: ['last 10 versions', '> 2%']},
            rem: ['16px'],
            pseudoElements: true,
            mqpacker: true,
            minifier: !devBuild
        },

        rename: {
            extname: '.css'
        }
    },

    // UnCSS
    uncssOpts: {
        html: [paths.dest + '**/*.html']
    },

    criticalOpts: {
        base: paths.dest,
        css: [paths.source + 'css/styles.css'],
        include: forceCritical.selectors,
        minify: !devBuild
    }
};

// #javascript
paths.jsdir = {
    in: paths.includeDir + 'scripts/*.js',
    out: paths.generatedDir + 'scripts/',
    jekyllOut: paths.dest + 'scripts/'
};

// #browsersync
paths.browserSync = {
    bsOpts: {
        server: {
            baseDir: paths.dest
        },
        browser: "chrome",
        online: false
    }
};

// #PSI
paths.psi = {
    deskOpts: {
        nokey: true,
        strategy: 'desktop',
        threshold: 95
    },
    mobileOpts: {
        nokey: true,
        strategy: 'mobile',
        threshold: 95
    }
}

module.exports = paths;