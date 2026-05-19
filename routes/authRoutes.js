const express = require("express");
const pool = require('../config/db');
const router = express.Router();


// REGISTER
router.post('/register', async (req, res) => {

    try {

        const { fname, email, pass } = req.body;

        // check if email already exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.send('Email already registered');
        }

        // insert new user
        await pool.query(
            `
            INSERT INTO users(full_name, email, password)
            VALUES($1, $2, $3)
            `,
            [fname, email, pass]
        );

        res.redirect('/?login=true');

    } catch (err) {

        console.log(err);
        res.send('Registration failed');

    }

});

//LOGIN
router.post('/login', async (req, res) => {

    try {

        const { email, pass } = req.body;

        // find user from database
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        // check if user exists
        if (result.rows.length === 0) {
            return res.send("User not found");
        }

        const user = result.rows[0];

        // check password
        if (user.password !== pass) {
            return res.send("Invalid password");
        }

        // session
        req.session.user = {
            id: user.user_id,
            fullname: user.full_name,
            email: user.email
        };

        res.redirect('/');

    } catch (err) {

        console.log(err);
        res.send("Login failed");

    }

});
router.get('/logout', (req, res) => {

    req.session.destroy(() => {
        res.redirect('/');
    });

});
module.exports = router;