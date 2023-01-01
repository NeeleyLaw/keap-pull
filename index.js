const express = require("express");
const mysql = require("mysql");
const got = require("got");
const app = express();
const port = process.env.PORT || 3000;

const {
    refreshKeap,
    initKeap,
    keapSession,
    serverUrl,
    keapClientID,
} = require("./oauthUtils.js");

var running = true;

var pulledEmails = 0;

// Last email in june has id 3354568

var goUntilID = 4263489; // NGL this is some random ass email on December 31st

const con = mysql.createConnection({
    host: "keap-emails-aurora.cluster-c68hykezydet.us-west-1.rds.amazonaws.com",
    user: "admin",
    password: "n33l3ylaw!",
    database: "main",
});

app.get("/", (req, res) => {
    if (pulledEmails != 0) {
        res.send("Emails pulled: " + pulledEmails);
    } else {
        res.send("Email count still loading...");
    }
});

// Oauth and shit
app.get("/keapsuccess", async(req, res) => {
    initKeap(req.query.code);
    mainloop();
    res.redirect("/");
});
app.get("/login", (req, res) => {
    res.redirect(
        `https://accounts.infusionsoft.com/app/oauth/authorize?client_id=${keapClientID}&redirect_uri=${serverUrl}/keapsuccess&response_type=code`
    );
});

app.get("/stop", (req, res) => {
    running = false;
    console.log("TERMINATED");
    res.send("Stopping");
});

con.connect(function(err) {
    if (err) console.log(err);
    console.log("Connected!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

async function mainloop() {
    var newestFetchedEmailId = 0;

    con.query(`SELECT max(email_id) FROM emails`, function(err, result) {
        if (err) throw err;
        if (result[0]["max(email_id)"] != null) {
            newestFetchedEmailId = result[0]["max(email_id)"];
        }
    });

    await timer(2000);

    console.log("Starting at email id: " + (newestFetchedEmailId + 2));

    console.log("Running...");
    var i = newestFetchedEmailId + 2;
    var mainInterval = setInterval(() => {
        if (!running || i > goUntilID) {
            console.log("DONE");
            clearInterval(mainInterval);
        }
        getKeapEmail(i).then((thisEmail) => {
            if (
                thisEmail &&
                thisEmail != null &&
                !thisEmail.message &&
                !thisEmail.fault
            ) {
                if (thisEmail.contact_id != 0)
                    addEmailToDB(
                        thisEmail.id,
                        thisEmail.contact_id,
                        thisEmail.subject,
                        thisEmail.headers,
                        thisEmail.plain_content,
                        thisEmail.html_content,
                        thisEmail.sent_to_address,
                        thisEmail.sent_from_address,
                        thisEmail.sent_to_cc_addresses,
                        thisEmail.sent_date,
                        thisEmail.received_date
                    );
                else console.log("Zero contact id for email " + thisEmail.id);
            } else if (thisEmail.message) {
                i -= 1;
            }
        });
        i += 2;
    }, 600);

    // var countInterval = setInterval(() => {
    //     con.query("SELECT COUNT(*) FROM emails", function (err, result) {
    //         if (err) throw err;
    //         pulledEmails = result[0]['COUNT(*)'];
    //     });
    // }, 300000)
}

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

async function getKeapEmail(id) {
    if (!keapSession.accessToken) {
        return;
    }
    var res = await got.get(
        `https://api.infusionsoft.com/crm/rest/v1/emails/${id}`, {
            throwHttpErrors: false,
            responseType: "json",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Bearer ${keapSession.accessToken}`,
            },
        }
    );
    if (res.body.error) {
        return;
    }
    return res.body;
}

async function addEmailToDB(
    email_id,
    contact_id,
    subject,
    headers,
    plain_content,
    html_content,
    sent_to_address,
    sent_from_address,
    sent_to_cc_addresses,
    sent_date,
    received_date
) {
    if (subject != null) subject = '"' + subject.replaceAll('"', "") + '"';
    if (plain_content != null)
        plain_content = '"' + plain_content.replaceAll('"', "") + '"';
    if (html_content != null)
        html_content = '"' + html_content.replaceAll('"', "") + '"';
    if (sent_to_address != null)
        sent_to_address = '"' + sent_to_address.replaceAll('"', "") + '"';
    if (sent_from_address != null)
        sent_from_address = '"' + sent_from_address.replaceAll('"', "") + '"';
    if (sent_to_cc_addresses != null)
        sent_to_cc_addresses = '"' + sent_to_cc_addresses.replaceAll('"', "") + '"';
    if (headers != null) headers = '"' + headers.replaceAll('"', "") + '"';
    if (sent_date != null) sent_date = '"' + sent_date.replaceAll('"', "") + '"';
    if (received_date != null)
        received_date = '"' + received_date.replaceAll('"', "") + '"';

    var query = `INSERT INTO emails (email_id, contact_id, subject, headers, plain_content, html_content, sent_to_address, sent_from_address, sent_date, received_date, sent_to_cc_addresses) VALUES (${email_id}, ${contact_id}, ${subject}, ${headers}, ${plain_content}, ${html_content}, ${sent_to_address}, ${sent_from_address}, ${sent_date}, ${received_date}, ${sent_to_cc_addresses})`;

    con.query(query, function(err, result) {
        if (err) console.log(err);
    });
}