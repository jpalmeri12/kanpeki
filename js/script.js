var menu = {
    tab: 0,
    screen: 0
};

var game = {
    mode: 0,
    level: 0,
    questions: [],
    score: 0,
    questionText: "",
    on: false,
    numQuestions: 5,
    startTime: 0,
    endTime: 0,
    gameWon: false,
    gameLost: false,
    newRecord: false,
    timerAnim: 0,
};

var levels = [];

var vocab = [];

var records = [];

var wordTable = [];

$(function () {
    loadVocab();
});

function loadVocab() {
    $.ajax("files/GenkiVocab.json").done(function (data) {
        vocab = data;
        continueLoading();
    });
}

function continueLoading() {
    makeLevels();
    makeLevelButtons();
    loadRecords();
    bindClicks();
    setupKanaBind();
    updateMenu();
    setScreen(0);
    showHelpScreen();
}

function loadRecords() {
    var oldRecords = localStorage.getItem("kanpekigenki");
    if (oldRecords == null) {
        makeRecords();
    }
    else {
        records = JSON.parse(oldRecords);
    }
}

function saveRecords() {
    var newRecords = JSON.stringify(records);
    localStorage.setItem("kanpekigenki", newRecords);
}

function setScreen(n) {
    $("#menu").removeClass("anim_menuMove" + (1 - n));
    $("#menu").addClass("anim_menuMove" + n);
    $("#game").removeClass("anim_gameMove" + (1 - n));
    $("#game").addClass("anim_gameMove" + n);
    if (n == 0) {
        updateMenu();
    }
}

function makeLevels() {
    levels = [];
    var allCh = [];
    var roman = ["", "I", "II", "III", "IV", "IV", "VI"];
    for (var i = 0; i < 6; i++) {
        var ch = [];
        for (var j = 1; j <= 4; j++) {
            var chNum = 4 * i + j;
            if (chNum < 24) {
                levels.push({
                    "name": "Lesson " + chNum,
                    "chapters": [chNum],
                    "words": 0
                });
                ch.push(chNum);
                allCh.push(chNum);
            }
        }
        levels.push({
            "name": "Review " + roman[i + 1],
            "chapters": ch,
            "words": 0
        });
    }
    levels.push({
        "name": "Final Exam",
        "chapters": allCh,
        "words": 0
    });
    for (var i = 0; i < vocab.length; i++) {
        for (var j = 0; j < levels.length; j++) {
            if (levels[j].chapters.indexOf(vocab[i].lesson) !== -1) {
                levels[j].words++;
            }
        }
    }
}

function makeRecords() {
    records = [];
    for (var i = 0; i < levels.length; i++) {
        records.push({
            trans: {
                score: 0,
                time: 0,
                clear: false
            },
            kanji: {
                score: 0,
                time: 0,
                clear: false
            }
        });
    }
}

function makeLevelButtons() {
    $("#levelButtons").empty();
    for (var i = 0; i < 30; i++) {
        var newButton = $('<div id="levelButton' + i + '" class="levelButton"></div>');
        var x = i % 5;
        var y = Math.floor(i / 5);
        newButton.append('<div class="levelButtonText">' + levels[i].name + '</div>');
        newButton.append('<div class="levelButtonScore"></div>');
        newButton.css({
            left: (1.5 + 3.5 * x) + "rem",
            top: (3.25 + 1.75 * y) + "rem",
        });
        $("#levelButtons").append(newButton);
        initLevelClick(i);
    }
}

function initLevelClick(i) {
    $("#levelButton" + i).click(function () {
        levelButtonClicked(i);
    });
}

function levelButtonClicked(i) {
    // Need to be on the menu to click menu buttons
    if (menu.screen == 0) {
        if (menu.tab > 0) {
            prepGame(menu.tab - 1, i);
            setScreen(1);
        } else if (menu.tab == 0) {
            showWordList(i);
        }
    }
}

function bindClicks() {
    $(".menuHeaderButton").click(function (data) {
        var btnid = $(this).attr("data-btnid");
        menu.tab = btnid;
        updateMenu();
    });
    $("#answerBox").keypress(function (e) {
        if (e.which == 13) {
            if (game.on) {
                submitAnswer();
            }
        }
    });
    $("#gameStartButton").click(function () {
        if (!game.on) {
            startGame();
        }
    });
    $("#gameExitButton").click(function () {
        if (!game.on) {
            setScreen(0);
        }
    });
    $("#wordListBox").click(function () {
        hideWordList();
        hideWordDetail();
    });
    $("#wordTableBox").click(function (evt) {
        evt.stopPropagation();
    });
    $("#wordDetailBox").click(function (evt) {
        hideWordDetail();
        evt.stopPropagation();
    });
    $("#menuHelpButton").click(function() {
        showHelpScreen();
    });
    $("#helpReadyButton").click(function() {
        hideHelpScreen();
    });
}

function setupKanaBind() {
    var input = document.getElementById('answerBox');
    wanakana.bind(input);
}

function loadWordTable(lv) {
    var levelInfo = levels[lv];
    $("#wordListTitle").text(levelInfo.name);
    var words = [];
    for (var i = 0; i < vocab.length; i++) {
        if (levelInfo.chapters.indexOf(vocab[i].lesson) !== -1) {
            words.push(vocab[i]);
        }
    }
    wordTable = words;
    $("#wordTable").empty();
    var tableText = "<tr><td class='tableHeader textEN'>English</td><td class='tableHeader textEN'>Kana</td><td class='tableHeader textEN'>Kanji</td></tr>";
    for (var i = 0; i < words.length; i++) {
        tableText += "<tr>";
        tableText += "<td class='textEN tr" + (i % 2) + " tc" + i + "'>" + words[i].en + "</td>";
        tableText += "<td class='textJP tr" + (i % 2) + " tc" + i + "'>" + words[i].kana + "</td>";
        tableText += "<td class='textJP tr" + (i % 2) + " tc" + i + "'>" + words[i].kanji + "</td>";
        tableText += "</tr>";
    }
    $("#wordTable").append(tableText);
    for (var i = 0; i < words.length; i++) {
        bindTableClick(i);
    }
}

function bindTableClick(n) {
    $(".tc" + n).click(function () {
        showWordDetail(n);
    });
}

function showWordDetail(n) {
    $("#wordDetailBox").removeClass("anim_wordDetailBoxOut");
    $("#wordDetailBox").addClass("anim_wordDetailBoxIn");
    $("#wordDetail").removeClass("anim_wordDetailOut");
    $("#wordDetail").addClass("anim_wordDetailIn");
    $("#wordDetailEN").text(wordTable[n].en);
    $("#wordDetailKana").text(wordTable[n].kana);
    $("#wordDetailKanji").text(wordTable[n].kanji);
}

function hideWordDetail() {
    $("#wordDetailBox").removeClass("anim_wordDetailBoxIn");
    $("#wordDetailBox").addClass("anim_wordDetailBoxOut");
    $("#wordDetail").removeClass("anim_wordDetailIn");
    $("#wordDetail").addClass("anim_wordDetailOut");
}

function updateMenu() {
    var gradients = ["gradGreen", "gradBlue", "gradRed"];
    for (var i = 0; i < gradients.length; i++) {
        if (i != menu.tab) {
            $(".levelButton").removeClass(gradients[i]);
            $("#headerBtn" + i).removeClass("headerButtonSelect");
        } else {
            $(".levelButton").addClass(gradients[i]);
            $("#headerBtn" + i).addClass("headerButtonSelect");
        }
    }
    var totalScore = 0;
    var totalTime = 0;
    var allClear = true;
    for (var i = 0; i < 30; i++) {
        // Show word count
        var scoreText = "";
        if (menu.tab == 0) {
            scoreText = levels[i].words + " words";
        } else if (menu.tab == 1) {
            if (records[i].trans.clear) {
                scoreText = "★" + formatTime(records[i].trans.time);
                totalTime += records[i].trans.time;
                totalScore += records[i].trans.score;
            } else {
                scoreText = records[i].trans.score + " pt" + (records[i].trans.score == 1 ? "" : "s") + ".";
                totalScore += records[i].trans.score;
                allClear = false;
            }
        } else if (menu.tab == 2) {
            if (records[i].kanji.clear) {
                scoreText = "★" + formatTime(records[i].kanji.time);
                totalTime += records[i].kanji.time;
                totalScore += records[i].kanji.score;
            } else {
                scoreText = records[i].kanji.score + " pt" + (records[i].kanji.score == 1 ? "" : "s") + ".";
                totalScore += records[i].kanji.score;
                allClear = false;
            }
        }
        $("#levelButton" + i + ">.levelButtonScore").text(scoreText);
    }
    if (menu.tab == 0) {
        $("#menuTotalScore").text("");
    } else if (totalScore > 0) {
        if (allClear) {
            $("#menuTotalScore").text("Total time: " + formatTime(totalTime));
        }
        else {
            $("#menuTotalScore").text("Total score: " + totalScore);
        }
    }
}

function showWordList(lv) {
    loadWordTable(lv);
    $("#wordListBox").removeClass("anim_screenOut");
    $("#wordListBox").addClass("anim_screenIn");
}

function hideWordList() {
    $("#wordListBox").removeClass("anim_screenIn");
    $("#wordListBox").addClass("anim_screenOut");
}

function showHelpScreen() {
    $("#helpScreenBox").removeClass("anim_screenOut");
    $("#helpScreenBox").addClass("anim_screenIn");
}

function hideHelpScreen() {
    $("#helpScreenBox").removeClass("anim_screenIn");
    $("#helpScreenBox").addClass("anim_screenOut");
}

function prepGame(mode, level) {
    // Show game screen
    $("#game").css("visibility", "visible");
    $("#gameTimer").removeClass("anim_gameTimerIn");
    // Set some game variables
    game.mode = mode;
    game.level = level;
    game.score = 0;
    game.on = false;
    game.gameWon = false;
    game.gameLost = false;
    game.newRecord = false;
    loadQuestions();
    $("#gameStartButton>.startPanelText").text("Start");
    $("#questionText").text("");
    $("#answerBox").val("");
    $("#answerSubLabel").text(game.mode == 0 ? "Translate to Kana" : "Write using Kana");
    $("#answerSubEN").text("");
    $("#answerSubJP").text("");
    updateGame();
}

function startGame() {
    // Init some variables
    game.score = 0;
    game.on = true;
    game.gameWon = false;
    game.gameLost = false;
    game.newRecord = false;
    loadQuestions();
    $("#score").removeClass("anim_scoreShake");
    $("#answerBox").val("");
    $("#answerSubLabel").text(game.mode == 0 ? "Translate to Kana" : "Write using Kana");
    $("#answerSubEN").text("");
    $("#answerSubJP").text("");
    updateGame();
    $("#answerBox").focus();
    game.startTime = new Date().getTime();
    var highScore;
    if (game.mode == 0) {
        highScore = records[game.level].trans;
    } else if (game.mode == 1) {
        highScore = records[game.level].kanji;
    }
    if (highScore.clear) {
        $("#gameTimer").addClass("anim_gameTimerIn");
        game.timerAnim = requestAnimationFrame(updateTimer);
    }
}

function loadQuestions() {
    // Load in questions
    var levelInfo = levels[game.level];
    game.questions = [];
    for (var i = 0; i < vocab.length; i++) {
        if (levelInfo.chapters.indexOf(vocab[i].lesson) !== -1) {
            if (game.mode == 0 || vocab[i].kanji.length > 0) {
                game.questions.push(vocab[i]);
            }
        }
    }
    // Shuffle questions
    game.questions = shuffle(game.questions);
    game.numQuestions = Math.min(100, game.questions.length);
}

function updateTimer() {
    var currentTime = new Date().getTime();
    var elapsedTime = (currentTime - game.startTime) / 1000;
    $("#gameTimerText").text(formatTime(elapsedTime));
    game.timerAnim = requestAnimationFrame(updateTimer);
}

function updateGame() {
    $("#levelInfo").text(levels[game.level].name);
    $("#scoreNum").text(game.score);
    if (game.mode == 0) {
        $("#levelMode").text("Translations");
    } else if (game.mode == 1) {
        $("#levelMode").text("Kanji Readings");
    }
    if (game.on) {
        $("#answerBox").prop("disabled", false);
        $("#score").removeClass("scoreFreeze");
        $("#score").addClass("scoreNormal");
        $("#scoreNum").removeClass("scoreNumFreeze");
        $("#scoreNum").addClass("scoreNumNormal");
        if (game.mode == 0) {
            $("#questionText").text(game.questions[game.score].en);
            $("#questionText").removeClass("textJP");
            $("#questionText").addClass("textEN");
        } else if (game.mode == 1) {
            $("#questionText").text(game.questions[game.score].kanji);
            $("#questionText").removeClass("textEN");
            $("#questionText").addClass("textJP");
        }
        $("#startPanel").removeClass("anim_startPanelIn");
        $("#startPanel").addClass("anim_startPanelOut");
        $("#startPanel").css("pointer-events", "none");
    } else {
        $("#answerBox").prop("disabled", true);
        $("#score").removeClass("scoreNormal");
        $("#score").addClass("scoreFreeze");
        $("#scoreNum").removeClass("scoreNumNormal");
        $("#scoreNum").addClass("scoreNumFreeze");
        $("#startPanel").removeClass("anim_startPanelOut");
        $("#startPanel").addClass("anim_startPanelIn");
        $("#startPanel").css("pointer-events", "auto");
    }
    // High score display
    var highScore;
    if (game.mode == 0) {
        highScore = records[game.level].trans;
    } else if (game.mode == 1) {
        highScore = records[game.level].kanji;
    }
    if (highScore.clear) {
        $("#bestText").text(formatTime(highScore.time));
        $("#bestSubtext").text("Best Time");
    } else {
        $("#bestText").text(highScore.score);
        $("#bestSubtext").text("Best Score");
    }
    // Mascot signs
    // Left
    var leftSignText = "";
    if (game.on) {
        var qLeft = game.numQuestions - game.score;
        if ((qLeft) % 10 == 0 || qLeft <= 5) {
            leftSignText = qLeft + " left!";
        }
    } else if (game.gameWon) {
        leftSignText = "Complete!";
    } else if (game.gameLost) {
        leftSignText = "Failed...";
    } else if (!game.gameWon && !game.gameLost) {
        leftSignText = "Ready?";
    }
    if (leftSignText != "") {
        $("#mascotSignTextLeft").text(leftSignText);
        $("#mascotSignLeft").removeClass("anim_mascotSignOut");
        $("#mascotSignLeft").addClass("anim_mascotSignIn");
    } else {
        $("#mascotSignLeft").removeClass("anim_mascotSignIn");
        $("#mascotSignLeft").addClass("anim_mascotSignOut");
    }
    // Right
    var rightSignText = "";
    if (game.newRecord) {
        rightSignText = "New record!";
    }
    if (!game.on && !game.gameWon && !game.gameLost) {
        rightSignText = "Go for " + game.numQuestions + "!";
    }
    if (rightSignText != "") {
        $("#mascotSignTextRight").text(rightSignText);
        $("#mascotSignRight").removeClass("anim_mascotSignOut");
        $("#mascotSignRight").addClass("anim_mascotSignIn");
    } else {
        $("#mascotSignRight").removeClass("anim_mascotSignIn");
        $("#mascotSignRight").addClass("anim_mascotSignOut");
    }
    // Mascot images/jumping
    if (game.gameWon) {
        $(".mascotImage").removeClass("mascotDead");
        $(".mascotImage").removeClass("mascotNormal");
        $(".mascotImage").addClass("mascotHappy");
        $(".mascot").removeClass("anim_mascotSway");
        $(".mascot").addClass("anim_mascotJump");
    } else if (game.gameLost) {
        $(".mascotImage").removeClass("mascotNormal");
        $(".mascotImage").removeClass("mascotHappy");
        $(".mascotImage").addClass("mascotDead");
        $(".mascot").removeClass("anim_mascotJump");
        $(".mascot").addClass("anim_mascotSway");
    } else {
        $(".mascotImage").removeClass("mascotDead");
        $(".mascotImage").removeClass("mascotHappy");
        $(".mascotImage").addClass("mascotNormal");
        $(".mascot").removeClass("anim_mascotSway");
        $(".mascot").removeClass("anim_mascotJump");
    }
}

function submitAnswer() {
    var userInput = $("#answerBox").val();
    if (userInput.length > 0) {
        var correctAnswer = game.questions[game.score].kana;
        var isCorrect = compareAnswers(userInput, correctAnswer);
        if (isCorrect) {
            game.score++;
            $("#answerBox").val("");
            $("#scoreNum").removeClass("anim_scoreNumJump");
            setTimeout(function () {
                $("#scoreNum").addClass("anim_scoreNumJump");
            }, 10);
            if (game.score >= game.numQuestions) {
                endGame(true);
            }
        } else {
            endGame(false);
        }
        updateGame();
    }
}

function compareAnswers(input, answer) {
    var tilde = "〜";
    input = (input + "").replace(tilde, "");
    input = (input + "").replace("n", "ん");
    input = (input + "").replace("N", "ン");
    answer = (answer + "").replace(tilde, "");
    return input == answer;
}

function endGame(isWin) {
    game.on = false;
    cancelAnimationFrame(game.timerAnim);
    game.timerAnim = 0;
    game.endTime = new Date().getTime();
    var elapsedTime = (game.endTime - game.startTime) / 1000;
    $("#gameTimerText").text(formatTime(elapsedTime));
    var highScore;
    if (game.mode == 0) {
        highScore = records[game.level].trans;
    } else if (game.mode == 1) {
        highScore = records[game.level].kanji;
    }
    if (game.score > highScore.score) {
        highScore.score = game.score;
        game.newRecord = true;
    }
    if (isWin) {
        game.gameWon = true;
        highScore.clear = true;
        if (highScore.time == 0 || elapsedTime < highScore.time) {
            highScore.time = elapsedTime;
            game.newRecord = true;
        }
    } else {
        game.gameLost = true;
        $("#score").addClass("anim_scoreShake");
        $("#gameStartButton>.startPanelText").text("Retry");
        $("#answerSubLabel").text("Answer: ");
        if (game.mode == 0) {
            $("#answerSubEN").text("");
            if (game.questions[game.score].kanji.length > 0) {
                $("#answerSubJP").text(game.questions[game.score].kanji + "・" + game.questions[game.score].kana);
            } else {
                $("#answerSubJP").text(game.questions[game.score].kana);
            }
        } else if (game.mode == 1) {
            $("#answerSubEN").text(game.questions[game.score].en);
            $("#answerSubJP").text("・" + game.questions[game.score].kana);
        }
    }
    updateGame();
    saveRecords();
}