const express = require("express");

const app = express();

const authRoutes = require("./routes/authRoutes");
const session = require('express-session');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'mysupersecret',
    resave: false,
    saveUninitialized: false
}));



// Static files
app.use(express.static("public"));

// View engine
app.set("view engine", "ejs");


// Auth Routes
app.use("/", authRoutes);


// ========== ROUTES ==========

// Homepage
app.get('/', (req, res) => {
    res.render('index', {
        listings: [],
        title: 'Home',
        currentPage: 'home',
        user: req.session.user
    });
});


// ========== AUTH ROUTES ==========

// Login page
app.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Login',
        currentPage: 'auth'
    });
});

// Register page
app.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        currentPage: 'auth'
    });
});


// ========== LISTINGS ROUTES ==========

// All listings
app.get('/listings', (req, res) => {
    res.render('listings/index', {
        title: 'All Listings',
        currentPage: 'listings',
        listings: []
    });
});

// New listing form
app.get('/listings/new', (req, res) => {
    res.render('listings/new', {
        title: 'Post a Room',
        currentPage: 'form'
    });
});

// Single listing page
app.get('/listings/:id', (req, res) => {
    res.render('listings/show', {
        title: 'Listing Details',
        currentPage: 'listings',
        listing: {
            id: req.params.id,
            title: "Sample Room",
            price: 10000,
            location: "Ahmedabad",
            description: "Sample listing description"
        }
    });
});


module.exports = app;