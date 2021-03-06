var dev = false;

var firebaseURL;
var authToken;
if (dev) {
    firebaseURL = "https://beer-pong-dev.firebaseio.com/";
    authToken = "HEy0KdddJaQl8Cx10KmuS1iLPn1DTmBYpgur3cBn";
} else {
    firebaseURL = "https://beer-pong.firebaseio.com/";
    authToken = "iKCCsctxphzcK4mkO99UHfz3RWOWqeNhCUlU55BH";
}

// Constants
BP_CUPS_NEW  = "1111111111";
BP_CUPS_LOSE = "0000000000";
BP_RERACKS = 2;


// Get a reference to the root of the chat data.
var firebase = new Firebase(firebaseURL);
var currentPlayer = null;
var myTurn = false;

var xBar = $("progress#xBar");
var thetaBar = $("progress#thetaBar");
var powerBar = $("progress#powerBar");

// local copy of server data
var data = {};


// Auth tokens should be generated on the fly and randomized links created for each game
firebase.auth(authToken, function(error) {
    if (error) {
        console.log("Login Failed!", error);
    } else {
        console.log("Login Succeeded!");
    }
});


// UPDATE DATA
firebase.on("value", function(snapshot) {
    // local copy of data
    data = snapshot.val();

    // check status
    checkWin(data.p1.cups, data.p2.cups);
    updateCups();

    // assign "p1" and "p2"
    if (!currentPlayer) {
        if (!data.p1.online) {
            currentPlayer = "p1";
            firebase.child("p1/online").set(true);
            updatePlayerName("Player 1");
            updateGameStatus("Waiting for challenger...");
        } else if (!data.p2.online) {
            currentPlayer = "p2";
            firebase.child("p2/online").set(true);
            updatePlayerName("Player 2");
        } else {
            updatePlayerName("Spectating");
            currentPlayer = "spec";
        }
    }

    // Start game
    if (data.p1.cups == BP_CUPS_NEW && data.p2.cups == BP_CUPS_NEW
        && data.p1.online && data.p2.online) {
        updateGameStatus("Start!");
    }

    // assign turns
    assignTurn();
    checkAvailableReracks();

    //alert("You are " + currentPlayer);

    // disconnect
    firebase.child(currentPlayer + "/online").onDisconnect().set(false);
});

function updateCups() {
    var p1temp = data.p1.cups.toString().split("");
    var p2temp = data.p2.cups.toString().split("");

    for (var i = 0; i < p1temp.length; i++) {
        if (p1temp[i] == "0") {
            if (currentPlayer == "p1" || currentPlayer == "spec") {
                $('#me .cup-' + i).addClass("hiddenCup");
            }
            else if (currentPlayer == "p2") {
                $('#opponent .cup-' + i).addClass("hiddenCup");
            }
        }
        else if (p1temp[i] == "1") {
            if (currentPlayer == "p1" || currentPlayer == "spec") {
                $('#me .cup-' + i).removeClass("hiddenCup");
            }
            else if (currentPlayer == "p2") {
                $('#opponent .cup-' + i).removeClass("hiddenCup");
            }
        }
    }

    for (var i = 0; i < p2temp.length; i++) {
        if (p2temp[i] == "0") {
            if (currentPlayer == "p1" || currentPlayer == "spec") {
                $('#opponent .cup-' + i).addClass("hiddenCup");
            }
            else if (currentPlayer == "p2") {
                $('#me .cup-' + i).addClass("hiddenCup");
            }
        }
        else if (p2temp[i] == "1") {
            if (currentPlayer == "p1" || currentPlayer == "spec") {
                $('#opponent .cup-' + i).removeClass("hiddenCup");
            }
            else if (currentPlayer == "p2") {
                $('#me .cup-' + i).removeClass("hiddenCup");
            }
        }
    }
}

var onComplete = function(error) {
  if (error) alert('Synchronization failed.');
  //else alert('Synchronization succeeded.');
};

function resetAimingBars() {
    xBar.val(0);
    thetaBar.val(0);
    powerBar.val(0);
}

function shootBall() {
    console.log("x: " + xBar.val() + " | theta: " + thetaBar.val() + " | power: " + powerBar.val());
    var xVal = Math.floor((xBar.val() * 0.06) * 100) / 100;
    var thetaVal = Math.floor((thetaBar.val() * 0.3 + 30) * 100) / 100;
    var powerVal = Math.floor((powerBar.val() * 0.004 + 3.9)* 100) / 100;
    console.log("Calculated x: " + xVal + " | theta: " + thetaVal + " | power: " + powerVal);

    var cup = wentInWhichCup(xVal, thetaVal, powerVal);

    console.log(cup);

    if (currentPlayer == "p1") {
        shot("p2", cup);
    }
    else if (currentPlayer == "p2") {
        shot("p1", cup);
    }
}

function shot(player, cup) {
    if (!myTurn) {
        return;
    }
    if (cup == -1) {
        if (data.ball == 1) {
            data.ball = 2;
            firebase.update({ ball: data.ball }, onComplete);
        }
        else {
            firebase.update({
                turn: ((data.turn == "p1") ? "p2" : "p1"),
                ball: 1
            }, onComplete);
        }
        return;
    }

    var score = data[player].cups;
    console.log(score);
    var temp = score.toString().split("");
    temp[cup] = "0";
    score = temp.join("");
    firebase.child(player + "/cups").set(score);

    console.log("before = " + data.ball);
    // 1st/2nd shot
    if (data.ball == 1) {
        data.ball = 2;
        firebase.update({ ball: data.ball }, onComplete);
    }
    else {
        firebase.update({
            turn: ((data.turn == "p1") ? "p2" : "p1"),
            ball: 1
        }, onComplete);
    }
}

// When the user presses enter on the message input, write the message to firebase.
$('[class*=cup]').click(function (e) {
    var team = $(this).parent().parent().attr("id");
    var cup = $(this).attr("class").replace(/[^\d]+/g, '');

    if (currentPlayer == "p1") {
        // p1 attacked p2
        if (team == "opponent") {
            shot("p2", cup);
        }
        else {
            shot("p1", cup);
        }
    }
    else if (currentPlayer == "p2") {
        // p2 attacks p1
        if (team == "opponent") {
            shot("p1", cup);
        }
        else {
            shot("p2", cup);
        }
    }
});

function restartGame() {
    if (currentPlayer === "spec") {
        if (confirm("Are you sure you want to restart the game?")) {
            firebase.update({
                p1: {cups: BP_CUPS_NEW, reracks: BP_RERACKS},
                p2: {cups: BP_CUPS_NEW, reracks: BP_RERACKS},
                ball: 1,
                turn: "p1"
            }, onComplete);
            resetTable();
        }
    } else {
        firebase.update({
            p1: {cups: BP_CUPS_NEW, reracks: BP_RERACKS},
            p2: {cups: BP_CUPS_NEW, reracks: BP_RERACKS},
            ball: 1,
            turn: "p1"
        }, onComplete);
        resetTable();
    }
}

function resetTable() {
    $("[class*=cup] ").removeClass("hiddenCup");
}

function checkWin(p1cups, p2cups) {
    if (p1cups === BP_CUPS_LOSE && p2cups !== BP_CUPS_LOSE) {
        if (currentPlayer === "p1") {
            alert("Much sad, very lose");
        } else if (currentPlayer === "p2") {
            alert("Yes, much success, very joy");
        } else {
            alert("Player 2 has won the game");
        }
    } else if (p2cups === BP_CUPS_LOSE && p1cups !== BP_CUPS_LOSE) {
        if (currentPlayer === "p2") {
            alert("Much sad, very lose");
        } else if (currentPlayer === "p1") {
            alert("Yes, much success, very joy");
        } else {
            alert("Player 1 has won the game");
        }
    }
}

$('#power').keypress(function (e) {
    if (e.keyCode == 13) {
        var xVal = $('#xBar').val();
        var thetaVal = $('#thetaBar').val();
        var powerVal = $('#powerBar').val();
        //firebase.child("toss").set({xBar:xBar, theta:theta, power:power});

        $('#xBar').val(0);
        $('#thetaBar').val('');
        $('#powerBar').val('');


        var team = $(this).parent().parent().attr("id");
        var cup = wentInWhichCup(xBar, theta, power);

        console.log(cup);

        if (currentPlayer == "p1") {
            shot("p2", cup);
        }
        else if (currentPlayer == "p2") {
            shot("p1", cup);
        }
    }
});

function projectileDistance(theta, v) {
    theta = theta * (Math.PI/180);
    return (v*Math.cos(theta)/10)*(v*Math.sin(theta)+Math.sqrt(Math.pow((v*Math.sin(theta)),2) + 2*10*.863));
}

function wentInWhichCup(x, theta, v) {
    var d = projectileDistance(theta, v);
    console.log("Projectile Distance: " + d);
    if (d > 2.438) {
        return -1;
    } else if (d > 2.346) {
        if (x < 1) {
            return -1;
        } else if (x < 2) {
            return 9;
        } else if (x < 3) {
            return 8;
        } else if (x < 4) {
            return 7;
        } else if (x < 5) {
            return 6;
        } else {
            return -1;
        }
    } else if (d > 2.254) {
        if (x < 1.5) {
            return -1;
        } else if (x < 2.5) {
            return 5;
        } else if (x < 3.5) {
            return 4;
        } else if (x < 4.5) {
            return 3;
        } else {
            return -1;
        }
    } else if (d > 2.162) {
        if (x < 2) {
            return -1;
        } else if (x < 3) {
            return 2;
        } else if (x < 4) {
            return 1;
        } else {
            return -1;
        }
    } else if (d > 2.07) {
        if (x > 2.5 && x < 3.5) {
            return 0;
        } else {
            return -1;
        }
    }
    return -1;
}

function updateGameStatus(msg) {
    $("#status").html(msg);
}

function updatePlayerName(name) {
    $("#playerName").html("You are " + name);
}

function assignTurn() {
    myTurn = (data.turn === currentPlayer);

    if (myTurn) {
        $('[class*=cup]:hover').css({"cursor": "pointer"});
        updateGameStatus("It's your turn to shoot!");
    }
    else {
        $('[class*=cup]:hover').css({"cursor": "default"});
        updateGameStatus("Waiting for challenger to shoot!");
    }
}

function checkAvailableReracks() {
    var reracksCount = 0;
    if (currentPlayer == "p1")
        reracksCount = data.p1.reracks;
    else if (currentPlayer == "p2")
        reracksCount = data.p2.reracks;

    var rerackButton = $("#rerackButton");

    if (reracksCount < 1)
        rerackButton.hide();

    var cup_count = 0;
    $("#opponent .tableRow div").each(function(i) {
        if(!($(this).hasClass("hiddenCup")))
            cup_count++;
    });

    if (cup_count == 2 || cup_count == 3 || cup_count == 4 || cup_count == 6) {
        rerackButton.show();
    } else {
        rerackButton.hide();
    }
}

function rerack() {
    if (currentPlayer != "p1" && currentPlayer != "p2") {
        alert("Spectators cannont rerack");
        return;
    }

    var reracksCount = 0;
    if (currentPlayer == "p1") {
        reracksCount = data.p1.reracks;
    } else if (currentPlayer == "p2") {
        reracksCount = data.p2.reracks;
    }

    if (reracksCount < 1) {
        alert("No more reracks available");
        return;
    }

    var cup_count = 0;
    $("#opponent .tableRow div").each(function(i) {
        if(!($(this).hasClass("hiddenCup")))
            cup_count++;
    });

    if (cup_count != 2 && cup_count != 3 && cup_count != 4 && cup_count != 6) {
        alert("Valid number of cups to rerack is 2, 3, 4, and 6");
        return;
    }

    var opponent = (currentPlayer == "p1") ? "p2" : "p1";
    var rack;
    if (cup_count == 2)
        rack = "1000100000";
    else if (cup_count == 3)
        rack = "1110000000";
    else if (cup_count == 4)
        rack = "1110100000";
    else if (cup_count == 6)
        rack = "1111110000";

    firebase.child(opponent + "/cups").set(rack);
    firebase.child(currentPlayer + "/reracks").set(reracksCount - 1);
}

$(document).ready(function() {
    resetAimingBars();
    var currentBar = xBar;
    var currentBarUp = true;
    var currentBarRunning = false;
    var currentBarInterval;
    var inputKey = 13;
    var barSpeed = 10;

    window.onkeydown = function(e) {
        if (e.which === inputKey && myTurn === true && currentBarRunning === false) {
            currentBarRunning = true;
            currentBar.val(0);
            clearInterval(currentBarInterval);
            currentBarInterval = setInterval(function() {
                if (currentBar.val() >= 100)
                    currentBarUp = false;
                else if (currentBar.val() <= 0)
                    currentBarUp = true;

                if (currentBarUp === true)
                    currentBar.val(currentBar.val()+1);
                else
                    currentBar.val(currentBar.val()-1);
            }, barSpeed); // Speed of the bar
        }
    };
    window.onkeyup = function(e) {
        if (e.which === inputKey && myTurn === true && currentBarRunning === true) {
            currentBarRunning = false;
            clearInterval(currentBarInterval);
            if (currentBar == xBar) {
                currentBar = thetaBar;
            } else if (currentBar == thetaBar) {
                currentBar = powerBar;
            } else {
                currentBar = xBar;
                $(document).unbind("keydown");
                $(document).unbind("keyup");
                shootBall();
            }
        }
    };

});