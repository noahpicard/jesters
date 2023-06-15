/*
TODO:
Have public (shared) vs private (single user) state
(so that a user can select a piece
    without other players seeing the move options)

Have players assigned a color when they start the game
& restrict taking action unless you are the proper color
& set additional players joining as "viewers"
    who can't change the game
*/


function getCurrentTimeStamp() {
    return (new Date()).getTime() / 1000;
}

var game_id = null;

var stateUpdater = {
    errorSleepTime: 500,
    last_updated: -1,

    poll: function() {
        if (!game_id) {
            window.setTimeout(stateUpdater.poll, 1000);
            return
        };
        var args = {"_xsrf": getCookie("_xsrf")};
        if (game_id) args.game_id = game_id;
        if (stateUpdater.last_updated) args.last_updated = stateUpdater.last_updated;
        $.ajax({url: "/a/state/current", type: "POST", dataType: "text",
                data: $.param(args), success: stateUpdater.onSuccess,
                error: stateUpdater.onError});
    },

    onSuccess: function(response) {
        try {
            stateUpdater.currentState(eval("(" + response + ")"));
        } catch (e) {
            stateUpdater.onError(e);
            return;
        }
        stateUpdater.errorSleepTime = 500;
        window.setTimeout(stateUpdater.poll, 0);
    },

    onError: function(response) {
        stateUpdater.errorSleepTime *= 2;
        console.log("Poll error; sleeping for", stateUpdater.errorSleepTime, "ms", response);
        window.setTimeout(stateUpdater.poll, stateUpdater.errorSleepTime);
    },

    currentState: function(response) {
        if (!response.stateMessage) return;
        var stateMessage = response.stateMessage;
        console.log("stateMessage", stateMessage);
        stateUpdater.renderState(stateMessage);
        console.log("saved state", state, stateUpdater.last_updated); 
    },

    renderState: function(stateMessage) {
        state = stateMessage["state"];
        stateUpdater.last_updated = stateMessage["last_updated"];
    }
};

$(document).ready(function() {
    if (!window.console) window.console = {};
    if (!window.console.log) window.console.log = function() {};

    // $("#messageform").on("submit", function() {
    //     newMessage($(this));
    //     return false;
    // });
    // $("#messageform").on("keypress", function(e) {
    //     if (e.keyCode == 13) {
    //         newMessage($(this));
    //         return false;
    //     }
    //     return true;
    // });
    // $("#message").select();
    // updater.poll();
    // stateUpdater.poll();
});

// function newMessage(form) {
//     var message = form.formToDict();
//     var disabled = form.find("input[type=submit]");
//     disabled.disable();
//     $.postJSON("/a/message/new", message, function(response) {
//         updater.showMessage(response);
//         if (message.id) {
//             form.parent().remove();
//         } else {
//             form.find("input[type=text]").val("").select();
//             disabled.enable();
//         }
//     });
// }

function newStateUpdate(state) {
    var stateMessage = {state: JSON.stringify(state), game_id: game_id};
    $.postJSON("/a/state/update", stateMessage, function(response) {
        console.log(response);
        stateUpdater.renderState({state: state, last_updated: getCurrentTimeStamp()})
    });
  }

function updateGameId(new_game_id) {
    game_id = new_game_id;
    document.getElementById('current_game_id').innerHTML = "Current game id: " + game_id;
    console.log("new_game_id", new_game_id);
    stateUpdater.poll();
}

function startNewGame() {
    $.postJSON("/a/game/new", {}, function(response) {
        updateGameId(response.game_id)
    });
}

function joinExistingGame() {
    updateGameId(document.getElementById('game_id').value);
}

function getCookie(name) {
    var r = document.cookie.match("\\b" + name + "=([^;]*)\\b");
    return r ? r[1] : undefined;
}

jQuery.postJSON = function(url, args, callback) {
    args._xsrf = getCookie("_xsrf");
    $.ajax({url: url, data: $.param(args), dataType: "text", type: "POST",
            success: function(response) {
        console.log("response", response);
        if (callback) callback(eval("(" + response + ")"));
    }, error: function(response) {
        console.log("ERROR:", response);
    }});
};

jQuery.fn.formToDict = function() {
    var fields = this.serializeArray();
    var json = {};
    for (var i = 0; i < fields.length; i++) {
        json[fields[i].name] = fields[i].value;
    }
    if (json.next) delete json.next;
    return json;
};

jQuery.fn.disable = function() {
    this.enable(false);
    return this;
};

jQuery.fn.enable = function(opt_enable) {
    if (arguments.length && !opt_enable) {
        this.attr("disabled", "disabled");
    } else {
        this.removeAttr("disabled");
    }
    return this;
};

// var updater = {
//     errorSleepTime: 500,
//     cursor: null,

//     poll: function() {
//         var args = {"_xsrf": getCookie("_xsrf")};
//         if (updater.cursor) args.cursor = updater.cursor;
//         $.ajax({url: "/a/message/updates", type: "POST", dataType: "text",
//                 data: $.param(args), success: updater.onSuccess,
//                 error: updater.onError});
//     },

//     onSuccess: function(response) {
//         try {
//             updater.newMessages(eval("(" + response + ")"));
//         } catch (e) {
//             updater.onError();
//             return;
//         }
//         updater.errorSleepTime = 500;
//         window.setTimeout(updater.poll, 0);
//     },

//     onError: function(response) {
//         updater.errorSleepTime *= 2;
//         console.log("Poll error; sleeping for", updater.errorSleepTime, "ms", [response]);
//         window.setTimeout(updater.poll, updater.errorSleepTime);
//     },

//     newMessages: function(response) {
//         if (!response.messages) return;
//         var messages = response.messages;
//         updater.cursor = messages[messages.length - 1].id;
//         console.log(messages.length, "new messages, cursor:", updater.cursor);
//         for (var i = 0; i < messages.length; i++) {
//             updater.showMessage(messages[i]);
//         }
//     },

//     showMessage: function(message) {
//         var existing = $("#m" + message.id);
//         if (existing.length > 0) return;
//         var node = $(message.html);
//         node.hide();
//         $("#inbox").append(node);
//         node.slideDown();
//     }
// };