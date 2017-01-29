var restify = require('restify');
var builder = require('botbuilder');
//var botbuilder_azure = require("botbuilder-azure");
// var request = require('request');
var qs = require('querystring');
var request = require('sync-request');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
var useEmulator = (process.env.NODE_ENV == 'development');
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session) {


        session.send("Hello, Let's do some cool stuff today...");
        session.beginDialog('rootMenu');
    },
    function (session, results) {
        session.endConversation("Goodbye until next time...");
    }
]);

// Add root menu dialog
bot.dialog('rootMenu', [
    function (session) {
        builder.Prompts.choice(session, "Choose an option:", 'Flip A Coin|Roll Dice|Magic 8-Ball|Dictation practice|Picture game|Quit');
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('flipCoinDialog');
                break;
            case 1:
                session.beginDialog('rollDiceDialog');
                break;
            case 2:
                session.beginDialog('magicBallDialog');
                break;
            case 3:
                session.beginDialog('dictationDialog');
                break;
            case 4:
                session.beginDialog('pictureDialog');
                break;
            default:
                session.endDialog();
                break;
        }
    },
    function (session) {
        // Reload menu
        //TODO: IMPLEMENT THIS ENDING PROPERLY
        //TODO: FIND OUT WHAT THAT RELOADACTION DOES
        // session.replaceDialog('rootMenu');
    }
]);
// .reloadAction('showMenu', null, { matches: /^(menu|back)/i });

// Flip a coin
bot.dialog('flipCoinDialog', [
    function (session, args) {
        builder.Prompts.choice(session, "Choose heads or tails.", "heads|tails", { listStyle: builder.ListStyle.none })
    },
    function (session, results) {
        var flip = Math.random() > 0.5 ? 'heads' : 'tails';
        if (flip == results.response.entity) {
            session.endDialog("It's %s. YOU WIN!", flip);
        } else {
            session.endDialog("Sorry... It was %s. you lost :(", flip);
        }
    }
]);

// Roll some dice
bot.dialog('rollDiceDialog', [
    function (session, args) {
        builder.Prompts.number(session, "How many dice should I roll?");
    },
    function (session, results) {
        if (results.response > 0) {
            var msg = "I rolled:";
            for (var i = 0; i < results.response; i++) {
                var roll = Math.floor(Math.random() * 6) + 1;
                msg += ' ' + roll.toString();
            }
            session.endDialog(msg);
        } else {
            session.endDialog("Ummm... Ok... I rolled air.");
        }
    }
]);

// Magic 8-Ball
bot.dialog('magicBallDialog', [
    function (session, args) {
        builder.Prompts.text(session, "What is your question?");
    },
    function (session, results) {
        // Use the SDK's built-in ability to pick a response at random.
        session.endDialog(magicAnswers);
    }
]);

// Dictation Practice
bot.dialog('dictationDialog', [
    function (session, args) {
        builder.Prompts.text(session, "What is your question?");
    },
    function (session, results) {
        // Use the SDK's built-in ability to pick a response at random.
        session.endDialog(magicAnswers);
    }
]);

bot.dialog('pictureDialog', [
    function (session, args) {
        builder.Prompts.choice(session, "Choose an option:", 'Animals|Travel|Colours|Clothes');
    },
    function (session, results, next) {
        var categories = ["Animals", "Travel", "Colours", "Clothes"];
        var q = categories[results.response.index];
        var url = 'https://api.cognitive.microsoft.com/bing/v5.0/images/search?q='+q+'&count=1&offest=0&mkt=en-us&safeSearch=Strict';
        var res = request(
            'GET',
            url,
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': 'c1c3171e40a84965bd28375ea50f12ef'
                }   
            });

        var obj = JSON.parse(res.getBody());
        var imageUrl = obj.value[0].contentUrl;
        msg = new builder.Message(session)
            .text("Here you go:")
            .attachments([{
                contentType: "image/jpeg",
                contentUrl: imageUrl
            }]);
        session.send(typeof (msg) != "undefined" ? msg : "bye");
        session.beginDialog('guessDialog');
    }
]);
// .reloadAction('showMenu', null, { matches: /^(menu|back)/i });

bot.dialog('guessDialog', [
    function (session, args) {
        builder.Prompts.text(session, 'Enter you guess (comma separated)');
    },
    function (session, results, next){
        session.send("You entered " + JSON.stringify(results));

        // Reload menu
        // session.replaceDialog('rootMenu');
    }
])

var magicAnswers = [
    "It is certain",
    "It is decidedly so",
    "Without a doubt",
    "Yes, definitely",
    "You may rely on it",
    "As I see it, yes",
    "Most likely",
    "Outlook good",
    "Yes",
    "Signs point to yes",
    "Reply hazy try again",
    "Ask again later",
    "Better not tell you now",
    "Cannot predict now",
    "Concentrate and ask again",
    "Don't count on it",
    "My reply is no",
    "My sources say no",
    "Outlook not so good",
    "Very doubtful"
];


if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function () {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}