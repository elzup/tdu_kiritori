var CONSUMER_KEY, CONSUMER_SECRET;

var runTimeList = {
    "9:0"  : "1限目開始",
    "10:30": "1限目終了",
    "10:40": "2限目開始",
    "12:10": "2限目終了",
    "13:10": "3限目開始",
    "14:40": "3限目終了",
    "14:50": "4限目開始",
    "16:20": "4限目終了",
    "16:30": "5限目開始",
    "18:0" : "5限目終了",
    "18:10": "6限目開始",
    "19:40": "6限目終了",
    "19:50": "7限目開始",
    "21:20": "7限目終了"
};

/**
 * Authorizes and makes a request to the Twitter API.
 */
function run(text) {
    var service = getService();
    if (service.hasAccess()) {
        var url = 'https://api.twitter.com/1.1/statuses/update.json';
        var payload = {
            status: text
        };
        payload = Object.keys(payload).map(function(key) {
                return encodeRfc3986(key) + '=' + encodeRfc3986(payload[key]);
                }).join('&');
        var response = service.fetch(url, {
            method: 'post',
            payload: payload,
            escaping: false
            }
        );
        var result = JSON.parse(response.getContentText());
        Logger.log(JSON.stringify(result, null, 2));
    } else {
        var authorizationUrl = service.authorize();
        Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
    }
}

/**
 * Encodes a string using the RFC 3986 spec.
 */
function encodeRfc3986(str) {
    return encodeURIComponent(str).replace(/[!'()]/g, function(char) {
            return escape(char);
            }).replace(/\*/g, "%2A");
}

/**
 * Reset the authorization state, so that it can be re-tested.
 */
function reset() {
    var service = getService();
    service.reset();
}

/**
 * Configures the service.
 */
function getService() {
    return OAuth1.createService('Twitter')
        // Set the endpoint URLs.
        .setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
        .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
        .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')

        // Set the consumer key and secret.
        .setConsumerKey(CONSUMER_KEY)
        .setConsumerSecret(CONSUMER_SECRET)

        // Set the name of the callback function in the script referenced
        // above that should be invoked to complete the OAuth flow.
        .setCallbackFunction('authCallback')

        // Set the property store where authorized tokens should be persisted.
        .setPropertyStore(PropertiesService.getUserProperties());
}

/**
 * Handles the OAuth2 callback.
 */
function authCallback(request) {
    var service = getService();
    var authorized = service.handleCallback(request);
    if (authorized) {
        return HtmlService.createHtmlOutput('Success!');
    } else {
        return HtmlService.createHtmlOutput('Denied');
    }
}


function post() {
    if (!isRunTime()) {
        return;
    }
    setKeys();
    run(makeText());
}

function isRunTime() {
    var date = new Date();
    // 土日は省く
    if (date.getDay() % 6 == 0) {
        return false;
    }
    var timeCode = date.getHours() + ":" + date.getMinutes();
    return (timeCode in runTimeList);
}


function makeText() {
    var date = new Date();
    var timeCode = date.getHours() + ":" + date.getMinutes();
    var middleText = runTimeList[timeCode];
    return "✄------------ " + middleText + " ------------✄";
}

function setKeys() {
    var tokens = selectTokens();
    CONSUMER_KEY = tokens[0];
    CONSUMER_SECRET = tokens[1];
}

function selectTokens() {
    var sheet = SpreadsheetApp.getActive().getSheetByName('tokens');
    var data = sheet.getSheetValues(1, 1, 1, sheet.getLastColumn());
    return data[0];
}
