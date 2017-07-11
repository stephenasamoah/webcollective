var
    browserSync = require('browser-sync'),
    cache = require('gulp-cache'),
    cp = require('child_process'),
    concat = require('gulp-concat'),
    critical = require('critical').stream,
    deploy = require('gulp-gh-pages'),
    del = require('del'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    jpegtran = require('imagemin-jpegtran'),
    ngrok = require('ngrok'),
    pkg = require('./package.json'),
    purge = require('gulp-css-purge'),
    imagemin = require('gulp-imagemin'),
    newer = require('gulp-newer'),
    svgo = require('gulp-svgo'),
    size = require('gulp-size'),
    htmlclean = require('gulp-htmlclean'),
    nano = require('gulp-cssnano'),
    uncss = require('gulp-uncss'),

    rename = require('gulp-rename'),
    replace = require('gulp-string-replace'),
    runSequence = require('run-sequence'),
    please = require('gulp-pleeease'),
    postcss = require('gulp-postcss'),
    print = require('gulp-print'),
    psi = require('psi'),
    sass = require('gulp-sass'),
    smacss = require('css-declaration-sorter'),
    uglify = require('gulp-uglify');


// Directory
var
    devBuild = ((process.env.NODE_ENV || 'development').trim().toLowerCase() !== 'production'),
    paths = require('./_assets/gulp_config/paths'),
    jekyll = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll',
    reload = browserSync.reload(),
    messages = {
        jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
    };


// Show Deployment Build Number
console.log(pkg.name + ' ' + pkg.version + ', ' + (devBuild ? 'development' : 'production') + ' build');

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn(jekyll, ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function (cb) {
    browserSync.reload();
    cb();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'jekyll-build', 'uncss'], function (cb) {
    browserSync(paths.browserSync.bsOpts);
    cb();
});


// #HTML
gulp.task('htmlmin', function () {
    return gulp.src(paths.htmldir.in)
        .pipe(gulp.dest(paths.htmldir.out))
        .pipe(print())

        .pipe(size({title: 'HTML size in:'}))
        .pipe(htmlclean(paths.htmldir.minifyOpts))
        .pipe(size({title: 'HTML size out:'}))
        .pipe(gulp.dest(paths.htmldir.jekyllOut))
});


// #CSS
gulp.task('sass', function () {
    return gulp.src(paths.cssdir.in)
        .pipe(sass(paths.cssdir.sassOpts, {onError: browserSync.notify}))
        .pipe(size({title: 'Applying purge...'}))
        .pipe(purge())
        .pipe(size({title: 'File size after purge:'}))

        .pipe(size({title: 'Applying Automaton:'}))
        .pipe(please(paths.cssdir.automaton.options))
        .pipe(size({title: 'CSS filesize after Automaton:'}))

        .pipe(size({title: 'Sorting to SMACSS:'}))
        .pipe(postcss([smacss(paths.cssdir.sortOrder)]))
        .pipe(size({title: 'SMACSS applied!'}))
        .pipe(gulp.dest(paths.cssdir.out))
        .pipe(print())

        .pipe(size({title: 'Applying nano:'}))
        .pipe(nano())
        .pipe(size({title: 'CSS filesize after nano:'}))
        .pipe(gulp.dest(paths.cssdir.jekyllOut))
        .pipe(print())
        .pipe(browserSync.stream())
});

/**
 * #Javascript
 */
gulp.task('js', function () {
    return gulp.src(paths.jsdir.in)
        .pipe(gulp.dest(paths.jsdir.out))
        .pipe(print())
        .pipe(concat('bundle.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.jsdir.jekyllOut));
});

/**
 * #UnCSS
 */
gulp.task('uncss', function () {
    return gulp.src(paths.cssdir.out + '**/*.css')
        .pipe(uncss(paths.cssdir.uncssOpts))
        .pipe(rename(paths.cssdir.mini))
        .pipe(nano())
        .pipe(size({title: 'CSS filesize after uncss:'}))
        .pipe(size({title: 'Replacing:'}))
        .pipe(replace('critical:this;', ''))
        .pipe(gulp.dest(paths.cssdir.jekyllOut))
        .pipe(print())
        .pipe(gulp.dest(paths.cssdir.stream))
        .pipe(print()) // For BrowserSync Stream
        .pipe(browserSync.stream())
        .on('error', gutil.log);
});


// #Image Optimizer
gulp.task('imagemin', function () {
    return gulp.src(paths.imagedir.in)
        .pipe(newer(paths.imagedir.out))
        .pipe(imagemin(paths.imagedir.imgOpts, {use: [jpegtran({progressive: true})]}))
        .pipe(svgo())
        .pipe(gulp.dest(paths.imagedir.out))
        .pipe(print());
});

// Directory Cleaner
gulp.task('clear', function (done) {
    return cache.clearAll(done);
});

gulp.task('clean', ['clear'], function () {
    if (devBuild) {
        del([
            paths.dest
        ]);
    } else {
        del(paths.cleanPaths);
    }
});

// ==========================================================================
// #Critical
// ==========================================================================

gulp.task('critical', function () {
    if (!devBuild) {
        return gulp.src(paths.htmldir.in)
            .pipe(critical(paths.cssdir.criticalOpts))
            .pipe(concat('critical.css'))
            .pipe(size({title: 'Purging:'}))
            .pipe(purge())
            .pipe(nano())
            .pipe(gulp.dest(paths.includeDir))
            .pipe(print())
            .pipe(size({title: 'Current critical size:'}));
    }
});
// ==========================================================================
// #RunSequence
// ==========================================================================

// Default
gulp.task('build-sequence', function (cb) {
    if (devBuild) {
        runSequence(['imagemin', 'sass', 'jekyll-build'], 'critical', ['uncss', 'htmlmin'], 'browser-sync', cb);
    } else {
        runSequence('clean', 'imagemin', ['sass', 'jekyll-build'], 'critical', 'jekyll-rebuild', ['uncss', 'htmlmin'], 'browser-sync', cb);
    }
});


// CSS Tasks
gulp.task('css-sequence', function (cb) {
    if (devBuild) {
        runSequence('sass', 'uncss', cb);
    } else {
        runSequence('sass', 'critical', 'uncss', 'jekyll-rebuild', 'htmlmin', cb);
    }
});


// ==========================================================================
// #Default
// ==========================================================================
gulp.task('default', ['build-sequence'], function () {
    // Watch css source files and compile on change + remove unused
    gulp.watch(paths.assetsDirIn + 'scss/**/*.scss', ['css-sequence']);

    // Watch HTML files + critical path and rebuild & reload
    gulp.watch([paths.jekyllWatch], ['jekyll-rebuild', 'htmlmin']);

    // Watch JS files
    gulp.watch(paths.jsdir.in, reload);

    // Watch and optimize new images
    gulp.watch(paths.imagedir.in, ['imagemin'])
});

// ==========================================================================
// #Deploy
// ==========================================================================
gulp.task('deploy', function () {
    return gulp.src(paths.dest + '**/*')
        .pipe(deploy());
});
