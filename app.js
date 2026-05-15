const express = require("express");

const app = express();
const PORT = 3000;

// Set view engine
app.set("view engine", "ejs");

// Serve static files (CSS, JS, images)
app.use(express.static("public"));

// Middleware to parse form data (needed for login/register forms)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== ROUTES ==========

// Homepage
app.get('/', (req, res) => {
    res.render('index', { 
        listings: [],
        title: 'Home',
        currentPage: 'home'
    });
});

// ========== AUTH ROUTES ==========

// Show login page
app.get('/login', (req, res) => {
    res.render('auth/login', { 
        title: 'Login',
        currentPage: 'auth'
    });
});

// Handle login form submission (temporary - will connect to DB later)
app.post('/login', (req, res) => {
    res.send("Login functionality coming soon!");
});

// Show register page
app.get('/register', (req, res) => {
    try {
        res.render('auth/register', { 
            title: 'Register',
            currentPage: 'auth'
        });
    } catch (error) {
        console.log("ERROR:", error);
        res.send(error.message);
    }
});

// Handle register form submission (temporary)
app.post('/register', (req, res) => {
    res.send("Register functionality coming soon!");
});

// Logout
app.get('/logout', (req, res) => {
    res.redirect('/');
});

// ========== LISTINGS ROUTES ==========

// Show all listings
app.get('/listings', (req, res) => {
    res.render('listings/index', {
        title: 'All Listings',
        currentPage: 'listings',
        listings: []  // Empty for now
    });
});

// Show form to create new listing
app.get('/listings/new', (req, res) => {
    res.render('listings/new', {
        title: 'Post a Room',
        currentPage: 'form'
    });
});

// Handle new listing submission (temporary)
app.post('/listings', (req, res) => {
    res.send("Create listing functionality coming soon!");
});

// Show single listing details
app.get('/listings/:id', (req, res) => {
    res.render('listings/show', {
        title: 'Listing Details',
        currentPage: 'listings',
        listing: {
            id: req.params.id,
            title: "Sample Room",
            price: 10000,
            location: "Sample Location",
            description: "This is a sample listing"
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`\n📝 Available routes:`);
    console.log(`   - Home: http://localhost:${PORT}/`);
    console.log(`   - Login: http://localhost:${PORT}/login`);
    console.log(`   - Register: http://localhost:${PORT}/register`);
    console.log(`   - Listings: http://localhost:${PORT}/listings`);
    console.log(`   - New Listing: http://localhost:${PORT}/listings/new`);
});