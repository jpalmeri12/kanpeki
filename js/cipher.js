// Fades to a particular div with the given name.
function showScreen(scr) {
    $(".screenBox.anim_fadeIn").removeClass("anim_fadeIn").addClass("anim_fadeOut");
    setTimeout(function () {
        $("#" + scr).removeClass("anim_fadeOut").addClass("anim_fadeIn");
    }, 250);
}

// Shuffles an array.
function shuffle(array) {
    var m = array.length,
        t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

// Returns a time formatted string.
function formatTime(sec) {
    var hours = Math.floor(sec / 3600);
    var minutes = Math.floor((sec - (hours * 3600)) / 60);
    var seconds = sec - (hours * 3600) - (minutes * 60);
    seconds = Math.floor(100 * seconds) / 100;
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    seconds = "" + seconds;
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    if (seconds.length == 2) {
        seconds += ".";
    }
    while (seconds.length < 5) {
        seconds += "0";
    }
    return (hours > 0 ? hours + ':' : "") + minutes + ':' + seconds;
}