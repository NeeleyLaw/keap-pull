// Utilities to help with OAuth in keap
const got = require("got");

var devMode = process.env.DEV == 1;

var keapClientID = process.env.KEAP_CLIENT_ID;
var keapClientSecret = process.env.KEAP_CLIENT_SECRET;
var keapSession = {};

var serverUrl = devMode ? "https://" + process.env.CODESPACE_NAME + "-3000.githubpreview.dev" : "https://keap-pull.herokuapp.com";

async function initKeap(code) {
    var res = await got.post("https://api.infusionsoft.com/token", {
        throwHttpErrors: false,
        responseType: "json",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&code=${code}&client_id=${keapClientID}&client_secret=${keapClientSecret}&redirect_uri=${serverUrl}/keapsuccess`,
    });
    if (res.body.error) {
        console.log("KEAP Error getting access token: " + res.body.error);
        return;
    }
    console.log("KEAP Access token: " + res.body.access_token);
    keapSession.accessToken = res.body.access_token;
}

// Use refresh token to renew keap access token
async function refreshKeap() {
    var res = await got.post("https://api.infusionsoft.com/token", {
        throwHttpErrors: false,
        responseType: "json",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=refresh_token&refresh_token=${keapSession.refreshToken}&client_id=${keapClientID}&client_secret=${keapClientSecret}`,
    });
    if (res.body.error) {
        console.log("KEAP Error refreshing access token: " + res.body.error);
        return;
    }
    console.log("KEAP Access token: " + res.body.access_token);
    keapSession.accessToken = res.body.access_token;
}

module.exports = { refreshKeap, initKeap, keapSession, serverUrl, keapClientID };