const pool = require("./config/db");

pool.query("SELECT NOW()", (err, res) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Connected");
        console.log(res.rows);
    }

    pool.end();
});