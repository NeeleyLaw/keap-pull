const express = require('express');
const mysql = require('mysql');
const got = require("got");
const app = express();
const port = process.env.PORT || 3000;

const { refreshKeap, initKeap, keapSession, serverUrl, keapClientID } = require('./oauthUtils.js');

var running = true;

// Last email in june has id 3354568
var lastEmailInJuneID = 3354568;

const con = mysql.createConnection({
    host: 'keap-emails.c68hykezydet.us-west-1.rds.amazonaws.com',
    user: 'admin',
    password: 'n33l3ylaw!',
    database: 'sys'
});

app.get("/", (req, res) => {
    con.query("SELECT COUNT(*) FROM emails", function (err, result) {
        if (err) res.send(err);
        res.send("emails pulled: " + result[0]['COUNT(*)']);
    });
});

// Oauth and shit
app.get('/keapsuccess', async (req, res) => {
    initKeap(req.query.code);
    mainloop();
    res.redirect("/");
})
app.get('/login', (req, res) => {
    res.redirect(`https://accounts.infusionsoft.com/app/oauth/authorize?client_id=${keapClientID}&redirect_uri=${serverUrl}/keapsuccess&response_type=code`)
})

app.get("/stop", (req, res) => {
    running = false;
    console.log("TERMINATED")
    res.send("Stopping");
})

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

async function mainloop() {
    var newestFetchedEmailId = 0;
    var newestFetchedRowIndex = -1;
    con.query(`SELECT max(email_id) FROM emails`, function (err, result) {
        if (err) throw err;
        if (result[0]['max(email_id)'] != null) {
            newestFetchedEmailId = result[0]['max(email_id)'];
        }
    })
    con.query("SELECT COUNT(*) FROM emails", function (err, result) {
        if (err) throw err;
        newestFetchedRowIndex = (result[0]['COUNT(*)'] - 1)
    });

    await timer(2000);

    console.log("Starting at email id: " + (newestFetchedEmailId + 1));

    console.log("Running...");
    var i = newestFetchedEmailId + 1
    var mainInterval = setInterval(() => {
        if (!running) clearInterval(mainInterval);
        getKeapEmail(i).then((thisEmail) => {
            if (thisEmail && thisEmail != null && !thisEmail.message && !thisEmail.fault) {
                addEmailToDB(thisEmail.id, thisEmail.contact_id, thisEmail.subject, thisEmail.headers, thisEmail.plain_content, thisEmail.html_content, thisEmail.sent_to_address, thisEmail.sent_from_address, thisEmail.sent_date, thisEmail.received_date);
            }
        });
        i++;
    }, 40)
}

const timer = ms => new Promise(res => setTimeout(res, ms))

async function getKeapEmail(id) {
    if (!keapSession.accessToken) {
        return;
    }
    var res = await got.get(`https://api.infusionsoft.com/crm/rest/v1/emails/${id}`, {
        throwHttpErrors: false,
        responseType: "json",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${keapSession.accessToken}`
        }
    });
    if (res.body.error) {
        return;
    }
    return res.body;
}

async function addEmailToDB(email_id, contact_id, subject, headers, plain_content, html_content, sent_to_address, sent_from_address, sent_date, received_date) {
    if (subject != null) subject = '"' + subject.replaceAll("\"", "") + '"';
    if (plain_content != null) plain_content = '"' + plain_content.replaceAll("\"", "") + '"';
    if (html_content != null) html_content = '"' + html_content.replaceAll("\"", "") + '"';
    if (sent_to_address != null) sent_to_address = '"' + sent_to_address.replaceAll("\"", "") + '"';
    if (sent_from_address != null) sent_from_address = '"' + sent_from_address.replaceAll("\"", "") + '"';
    if (headers != null) headers = '"' + headers.replaceAll("\"", "") + '"';
    if (sent_date != null) sent_date = '"' + sent_date.replaceAll("\"", "") + '"';
    if (received_date != null) received_date = '"' + received_date.replaceAll("\"", "") + '"';

    con.query(`INSERT INTO emails (email_id, contact_id, subject, headers, plain_content, html_content, sent_to_address, sent_from_address, sent_date, received_date) VALUES (${email_id}, ${contact_id}, ${subject}, ${headers}, ${plain_content}, ${html_content}, ${sent_to_address}, ${sent_from_address}, ${sent_date}, ${received_date})`, function (err, result) {
        if (err) throw err;
    });
}