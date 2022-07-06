const express = require('express');
const mysql = require('mysql');
const app = express();

const connection = mysql.createConnection({
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

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})