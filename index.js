const express = require('express');
const mysql = require('mysql');
const app = express();

const con = mysql.createConnection({
    host: 'keap-emails.c68hykezydet.us-west-1.rds.amazonaws.com',
    user: 'admin',
    password: 'n33l3ylaw!',
    database: 'sys'
});

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    con.query("SELECT * FROM emails", function (err, result) {
        if (err) res.send(err);
        res.send(result);
    });
})

app.get("/addrow", (req, res) => {
    con.query(`INSERT INTO emails VALUES (4, 2, "subject", "headers", "plain", "html", "sent_to", "sent_from", "2022-07-06T17:38:30.898Z","2022-07-06T17:38:30.898Z")`, function (err, result) {
        if (err) res.send(err);
        res.send(result);
    });
})

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})