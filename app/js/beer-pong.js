
// Get a reference to the root of the chat data.
var firebase = new Firebase('https://beer-pong.firebaseio.com/');
var currentPlayer = null;

var data = {};

// Auth tokens should be generated on the fly and randomized links created for each game
firebase.auth("iKCCsctxphzcK4mkO99UHfz3RWOWqeNhCUlU55BH", function(error) {
    if (error) {
        console.log("Login Failed!", error);
    } else {
        console.log("Login Succeeded!");
    }
});


// update data
firebase.on("value", function(snapshot) {
    // local copy of data
    data = snapshot.val();
    console.log(data);

    // check status
    checkWin(data.p1.cups, data.p2.cups);

    var p1temp = data.p1.cups.toString().split("");
    var p2temp = data.p2.cups.toString().split("");

    for (var i = 0; i < p1temp.length; i++) {
        if (p1temp[i] == "0") {
            if (currentPlayer == "p1") {
                $('#me .cup-' + i).addClass("hide");
            }
            else if (currentPlayer == "p2") {
                $('#opponent .cup-' + i).addClass("hide");
            }
        }
        else if (p1temp[i] == "1") {
            if (currentPlayer == "p1") {
                $('#me .cup-' + i).removeClass("hide");
            }
            else if (currentPlayer == "p2") {
                $('#opponent .cup-' + i).removeClass("hide");
            }
        }
    }

    for (var i = 0; i < p2temp.length; i++) {
        if (p2temp[i] == "0") {
            if (currentPlayer == "p1") {
                $('#opponent .cup-' + i).addClass("hide");
            }
            else if (currentPlayer == "p2") {
                $('#me .cup-' + i).addClass("hide");
            }
        }
        else if (p2temp[i] == "1") {
            if (currentPlayer == "p1") {
                $('#opponent .cup-' + i).removeClass("hide");
            }
            else if (currentPlayer == "p2") {
                $('#me .cup-' + i).removeClass("hide");
            }
        }
    }

    if (!currentPlayer) {
        if (!data.p1.online) {
            currentPlayer = "p1";
            firebase.child("p1/online").set(true);
        }
        else if (!data.p2.online) {
            currentPlayer = "p2";
            firebase.child("p2/online").set(true);
        }
    }

    //alert("You are " + currentPlayer);

    // disconnect
    firebase.child(currentPlayer + "/online").onDisconnect().set(false);
});

function shot(player, cup) {
    if (cup == -1) {
        return;
    }
    var score = data[player].cups;
    console.log(score);
    var temp = score.toString().split("");
    temp[cup] = "0";
    score = temp.join("");
    firebase.child(player + "/cups").set(score);
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
    firebase.child("p1/cups").set("1111111111");
    firebase.child("p2/cups").set("1111111111");
    resetTable();
}
function resetTable() {
    $("[class*=cup] ").removeClass("hide");
}
function checkWin(p1cups, p2cups) {
    if (p1cups === "0000000000" && p2cups !== "0000000000") {
        if (currentPlayer === "p1") {
            alert("Much sad, very lose");
        } else {
            alert("Yes, much success, very joy");
        }
    } else if (p2cups === "0000000000") {
        if (currentPlayer === "p2") {
            alert("Much sad, very lose");
        } else {
            alert("Yes, much success, very joy");
        }
    }
}

$('#power').keypress(function (e) {
    if (e.keyCode == 13) {
        var xCoordinate = $('#xCoordinate').val();
        var theta = $('#theta').val();
        var power = $('#power').val();
        //firebase.child("toss").set({xCoordinate:xCoordinate, theta:theta, power:power});

        $('#xCoordinate').val('');
        $('#theta').val('');
        $('#power').val('');


        var team = $(this).parent().parent().attr("id");
        var cup = wentInWhichCup(xCoordinate, theta, power);

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
    return (v*Math.cos(theta)/10)*(v*Math.sin(theta)+Math.sqrt(Math.pow((v*Math.sin(theta)),2) + 2*10*.863));
}

function wentInWhichCup(x, theta, v) {
    var d = projectileDistance(theta, v);
    if (d > 2.438) {
        return -1;
    } else if (d > 2.346) {
        if (x < 1) {
            return -1;
        } else if (x < 2) {
            return 6;
        } else if (x < 3) {
            return 7;
        } else if (x < 4) {
            return 8;
        } else if (x < 5) {
            return 9;
        } else {
            return -1;
        }
    } else if (d > 2.254) {
        if (x < 1.5) {
            return -1;
        } else if (x < 2.5) {
            return 3;
        } else if (x < 3.5) {
            return 4;
        } else if (x < 4.5) {
            return 5;
        } else {
            return -1;
        }
    } else if (d > 2.162) {
        if (x < 2) {
            return -1;
        } else if (x < 3) {
            return 1;
        } else if (x < 4) {
            return 2;
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
