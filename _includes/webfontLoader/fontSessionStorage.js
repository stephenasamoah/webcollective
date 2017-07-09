
(function() {
    if (sessionStorage.fonts) {
        console.log("Fonts cached.");
        document.documentElement.classList.add('wf-active');
    } else {
        console.log("Fonts not yet cached.");
    }
})();
