const express = require('express');
const mysql = require('mysql');
const app = express();

var running = false;

const con = mysql.createConnection({
    host: 'keap-emails.c68hykezydet.us-west-1.rds.amazonaws.com',
    user: 'admin',
    password: 'n33l3ylaw!',
    database: 'sys'
});

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    con.query("SELECT COUNT(*) FROM emails", function (err, result) {
        if (err) res.send(err);
        res.send("emails pulled: " + result[0]['COUNT(*)']);
    });
});

app.get("/start", (req, res) => {
    running = true;
    mainloop();
    res.send("Started");
})

app.get("/start", (req, res) => {
    running = false;
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

}