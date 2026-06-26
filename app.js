const express = require("express");
const db = require("./config/db");
const app = express();

const authRoutes = require("./routes/authRoutes");
const session = require('express-session');
const multer = require('multer');
const path = require('path');

// Auth middleware
const authenticate = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    next();
};

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));


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
app.get('/listings', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT l.*, u.full_name, u.profession, u.age 
             FROM listings l
             JOIN users u ON l.owner_id = u.id
             WHERE l.status = 'active'
             ORDER BY l.created_at DESC`
        );

        res.render('listings/index', {
            title: 'All Listings',
            currentPage: 'listings',
            listings: result.rows,
            user: req.session.user || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// New listing form
// New listing form
app.get('/listings/new', (req, res) => {
    // Check if user is logged in
    if (!req.session.user) {
        return res.redirect('/login');
    }

    res.render('listings/new', {
        title: 'Post a Room',
        currentPage: 'form',
        user: req.session.user  // ADD THIS LINE
    });
});
// GET /api/listings/:id - Get single listing (for API)
app.get('/api/listings/:id', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM listings WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// Single listing page
app.get('/listings/:id', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM listings WHERE id = $1',
            [req.params.id]
        );

        const listing = result.rows[0];

        if (!listing) {
            return res.status(404).send('Listing not found');
        }

        res.render('listings/show', {
            title: listing.title,
            currentPage: 'listings',
            listing
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
// Dashboard route
// Dashboard route - add this BEFORE your other routes
// Dashboard route - GET /dashboard
app.get('/dashboard', authenticate, async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Check if user has active listing (status = 'active')
        const activeListingQuery = `
            SELECT id FROM listings 
            WHERE owner_id = $1
            AND status IN ('active', 'occupied')
            LIMIT 1
        `;
        const activeListingResult = await db.query(activeListingQuery, [userId]);
        const hasActiveListing = activeListingResult.rows.length > 0;

        // Get user's listings (only active ones)
        const listingsQuery = `
            SELECT l.*, 
                   COALESCE(l.occupancy, 1) as occupancy
            FROM listings l
            WHERE l.owner_id = $1 AND l.status = 'active'
            ORDER BY l.created_at DESC
        `;
        const listingsResult = await db.query(listingsQuery, [userId]);
        const myListings = listingsResult.rows;

        // Get saved listings
        const savedQuery = `
            SELECT l.*, sl.id as saved_id
            FROM saved_listings sl
            JOIN listings l ON sl.listing_id = l.id
            WHERE sl.user_id = $1 AND l.status = 'active'
            ORDER BY l.created_at DESC
        `;
        const savedResult = await db.query(savedQuery, [userId]);
        const savedListings = savedResult.rows;

        // Get listings from OTHER users
        const exploreListingsQuery = `
    SELECT 
        l.*,
        u.full_name,
        u.profession,
        u.age
    FROM listings l
    JOIN users u ON l.owner_id = u.id
    WHERE l.owner_id != $1
      AND l.status = 'active'
    ORDER BY l.created_at DESC
`;

        const exploreListingsResult = await db.query(exploreListingsQuery, [userId]);

        const exploreListings = exploreListingsResult.rows;
        // Recent Matches feature removed
        const myRequestsQuery = `
    SELECT rr.id, rr.status, rr.created_at,
           l.title as listing_title, l.city, l.rent, l.id as listing_id
    FROM roommate_requests rr
    JOIN listings l ON rr.listing_id = l.id
    WHERE rr.sender_id = $1
    ORDER BY rr.created_at DESC
`;
        const myRequestsResult = await db.query(myRequestsQuery, [userId]);
        const myRequests = myRequestsResult.rows;
        const sentRequestsResult = await db.query(
            `SELECT listing_id, status FROM roommate_requests WHERE sender_id = $1 ORDER BY id ASC`,
            [userId]
        );
        const sentRequestsMap = {};
        sentRequestsResult.rows.forEach(r => {
            sentRequestsMap[r.listing_id] = r.status;
        });
        // Get user info (includes profile fields to check completeness + show avatar in nav)
        const userQuery = `SELECT id, full_name, email, profile_photo, age, gender, workplace,
                                   profession, city, budget_min, budget_max
                            FROM users WHERE id = $1`;
        const userResult = await db.query(userQuery, [userId]);
        const currentUser = userResult.rows[0];

        // Profile is "complete" once the key fields owners actually care about are filled
        const profileComplete = !!(
            currentUser.age &&
            currentUser.gender &&
            (currentUser.workplace || currentUser.profession) &&
            currentUser.city &&
            currentUser.budget_min &&
            currentUser.budget_max
        );

        res.render('dashboard', {
            user: currentUser,
            myListings: myListings,
            savedListings: savedListings,
            exploreListings: exploreListings,
            hasActiveListing: hasActiveListing,
            myRequests: myRequests,
            sentRequestsMap: sentRequestsMap,
            profileComplete: profileComplete

        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Server error');
    }
});
// ========== PROFILE ROUTES ==========

// GET /profile/edit - Edit profile form (own profile)
app.get('/profile/edit', authenticate, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        res.render('profile/edit', {
            title: 'Edit Profile',
            currentPage: 'profile',
            profile: result.rows[0]
        });
    } catch (err) {
        console.error('Profile edit page error:', err);
        res.status(500).send('Server error');
    }
});

// POST /api/profile - Update own profile (with optional profile photo upload)
app.post('/api/profile', authenticate, upload.single('profile_photo'), async (req, res) => {
    try {
        const userId = req.session.user.id;
        const {
            full_name, age, gender, workplace, profession, bio,
            city, area, budget_min, budget_max,
            smoker, pets_friendly, veg, sleep_schedule,
            cleanliness_level, looking_for_roommate
        } = req.body;

        const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await db.query(
            `UPDATE users SET
                full_name = COALESCE($1, full_name),
                age = $2,
                gender = $3,
                workplace = $4,
                profession = $5,
                bio = $6,
                city = $7,
                area = $8,
                budget_min = $9,
                budget_max = $10,
                smoker = $11,
                pets_friendly = $12,
                veg = $13,
                sleep_schedule = $14,
                cleanliness_level = $15,
                looking_for_roommate = $16,
                profile_photo = COALESCE($17, profile_photo)
             WHERE id = $18
             RETURNING id, full_name, email, profile_photo`,
            [
                full_name || null,
                age ? parseInt(age) : null,
                gender || null,
                workplace || null,
                profession || null,
                bio || null,
                city || null,
                area || null,
                budget_min ? parseInt(budget_min) : null,
                budget_max ? parseInt(budget_max) : null,
                smoker === 'true',
                pets_friendly === 'true',
                veg === 'true',
                sleep_schedule || null,
                cleanliness_level || null,
                looking_for_roommate !== 'false', // checkbox absent = unchecked, treat as explicit false only when sent
                photoPath,
                userId
            ]
        );

        // Keep the session display name in sync (used in the nav greeting)
        req.session.user.fullname = result.rows[0].full_name;

        res.json({ message: 'Profile updated successfully', profile: result.rows[0] });

    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Error updating profile' });
    }
});

// GET /api/users/:id - Fetch another user's public profile
// Used by the "View Profile" modal so a room owner can actually see who's
// requesting to join before they accept/reject, instead of just a name.
app.get('/api/users/:id', authenticate, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, full_name, profile_photo, age, gender, workplace, profession,
                    bio, city, area, budget_min, budget_max, smoker, pets_friendly,
                    veg, sleep_schedule, cleanliness_level, looking_for_roommate
             FROM users WHERE id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Get user profile error:', err);
        res.status(500).json({ error: 'Error loading profile' });
    }
});

// DELETE /api/saved/:listingId
app.delete('/api/saved/:listingId', async (req, res) => {
    const userId = req.session.user.id;
    await db.query(
        'DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
        [userId, req.params.listingId]
    );
    res.json({ success: true });
});
// POST new listing
// POST new listing
// POST /api/listings - Create new listing (with one listing per user check)
app.post('/api/listings', authenticate, upload.array('images', 5), async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Check if user already has an active listing
        const existingListing = await db.query(
            `SELECT id FROM listings WHERE owner_id = $1 AND status IN ('active', 'occupied')`,
            [userId]
        );

        if (existingListing.rows.length > 0) {
            return res.status(400).json({
                error: 'You already have an active listing. Only one listing allowed per user.'
            });
        }
        const {
            listing_type, title, description, rent, city, area, address,
            occupancy, furnished, gender_preference, available_from
        } = req.body;

        const occupancyValue = Math.max(1, parseInt(occupancy) || 1);

        const result = await db.query(
            `INSERT INTO listings (
        owner_id,
        listing_type,
        title,
        description,
        rent,
        city,
        area,
        address,
        occupancy,
        current_occupants,
        furnished,
        gender_preference,
        available_from,
        status
    )
    VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, 'active'
    )
    RETURNING *`,
            [
                userId,
                listing_type,
                title,
                description,
                rent,
                city,
                area,
                address,
                occupancyValue,
                1,
                furnished,
                gender_preference,
                available_from
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: 'Error creating listing' });
    }
});

// PUT /api/listings/:id - Update listing
app.put('/api/listings/:id', authenticate, async (req, res) => {
    try {
        const listingId = req.params.id;
        const userId = req.session.user.id;

        // Verify ownership
        const listingCheck = await db.query(
            `SELECT owner_id FROM listings WHERE id = $1`,
            [listingId]
        );

        if (listingCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listingCheck.rows[0].owner_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const {
            title, description, city, area, rent, available_from,
            occupancy, furnished, gender_preference
        } = req.body;

        const result = await db.query(
            `UPDATE listings 
             SET title = $1, description = $2, city = $3, area = $4, 
                 rent = $5, available_from = $6,
                 occupancy = $7, furnished = $8, gender_preference = $9
             WHERE id = $10 AND owner_id = $11
             RETURNING *`,
            [title, description, city, area, rent, available_from,
                occupancy, furnished, gender_preference,
                listingId, userId]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ error: 'Error updating listing' });
    }
});

// DELETE /api/listings/:id - Soft delete listing
app.delete('/api/listings/:id', authenticate, async (req, res) => {
    try {
        const listingId = req.params.id;
        const userId = req.session.user.id;

        // Verify ownership
        const listingCheck = await db.query(
            `SELECT owner_id FROM listings WHERE id = $1`,
            [listingId]
        );

        if (listingCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listingCheck.rows[0].owner_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Soft delete - set status to 'closed'
        await db.query(
            `UPDATE listings SET status = 'deleted' WHERE id = $1`,
            [listingId]
        );

        res.json({ message: 'Listing deleted successfully' });

    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ error: 'Error deleting listing' });
    }
});

// POST /api/listings/:id/request - Request to join listing
app.post('/api/listings/:id/request', authenticate, async (req, res) => {
    try {
        const listingId = req.params.id;
        const senderId = req.session.user.id;
        const { message } = req.body;

        // Check if listing exists and is active
        const listingCheck = await db.query(
            `SELECT owner_id, status, occupancy
             FROM listings WHERE id = $1`,
            [listingId]
        );

        if (listingCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        const listing = listingCheck.rows[0];

        if (listing.status !== 'active') {
            return res.status(400).json({ error: 'Listing is not active' });
        }

        if (listing.owner_id === senderId) {
            return res.status(400).json({ error: 'You cannot request your own listing' });
        }

        // Check if already requested
        const existingRequest = await db.query(
            `SELECT id, status FROM roommate_requests 
     WHERE listing_id = $1 AND sender_id = $2 AND status NOT IN ('rejected', 'left')`,
            [listingId, senderId]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ error: 'You have already requested to join this listing' });
        }

        // Create request
        const result = await db.query(
            `INSERT INTO roommate_requests (listing_id, sender_id, message, status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING *`,
            [listingId, senderId, message || null]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ error: 'Error sending request' });
    }
});

// GET /api/listings/:id/requests - Get join requests for a listing
app.get('/api/listings/:id/requests', authenticate, async (req, res) => {
    try {
        const listingId = req.params.id;
        const userId = req.session.user.id;

        // Verify ownership
        const listingCheck = await db.query(
            `SELECT owner_id FROM listings WHERE id = $1`,
            [listingId]
        );

        if (listingCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listingCheck.rows[0].owner_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Get pending requests with sender info (profile fields included so the
        // owner gets a real preview, not just a name, before accepting/rejecting)
        const requests = await db.query(
            `SELECT rr.*, u.full_name as sender_name, u.age, u.profession,
                    u.profile_photo, u.gender, u.workplace
             FROM roommate_requests rr
             JOIN users u ON rr.sender_id = u.id
             WHERE rr.listing_id = $1 AND rr.status = 'pending'
             ORDER BY rr.created_at DESC`,
            [listingId]
        );

        res.json(requests.rows);

    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Error loading requests' });
    }
});

// POST /api/join-requests/:id/accept - Accept a join request
app.post('/api/join-requests/:id/accept', authenticate, async (req, res) => {
    const client = await db.connect();

    try {
        const requestId = req.params.id;
        const userId = req.session.user.id;

        await client.query('BEGIN');

        // Get request details and verify ownership
        const requestQuery = await client.query(
            `SELECT rr.*, l.owner_id, l.id as listing_id, l.occupancy
             FROM roommate_requests rr
             JOIN listings l ON rr.listing_id = l.id
             WHERE rr.id = $1`,
            [requestId]
        );

        if (requestQuery.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestQuery.rows[0];

        if (request.owner_id !== parseInt(userId)) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (request.status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Request already processed' });
        }

        // Update the accepted request
        await client.query(
            `UPDATE roommate_requests SET status = 'accepted' WHERE id = $1`,
            [requestId]
        );
        const updatedListing = await client.query(
            `UPDATE listings
    SET current_occupants = current_occupants + 1
    WHERE id = $1
    RETURNING current_occupants, occupancy`,
            [request.listing_id]
        );

        // If the room is now full, flip status so it stops showing as active/joinable
        const { current_occupants, occupancy } = updatedListing.rows[0];
        if (current_occupants >= occupancy) {
            await client.query(
                `UPDATE listings SET status = 'occupied' WHERE id = $1`,
                [request.listing_id]
            );
        }

        await client.query(
            `UPDATE roommate_requests 
     SET status = 'rejected' 
     WHERE listing_id = $1 AND id != $2 AND status = 'pending'`,
            [request.listing_id, requestId]
        );

        await client.query('COMMIT');

        res.json({ message: 'Request accepted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Accept request error:', error);
        res.status(500).json({ error: 'Error accepting request' });
    } finally {
        client.release();
    }
});
// POST /api/listings/:id/leave - Leave a room you previously joined
app.post('/api/listings/:id/leave', authenticate, async (req, res) => {
    const client = await db.connect();

    try {
        const listingId = req.params.id;
        const userId = req.session.user.id;

        await client.query('BEGIN');

        // Lock the listing row so a concurrent accept/leave can't race us
        const listingResult = await client.query(
            `SELECT id, owner_id, occupancy, current_occupants, status
             FROM listings WHERE id = $1 FOR UPDATE`,
            [listingId]
        );

        if (listingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Listing not found' });
        }

        const listing = listingResult.rows[0];

        if (listing.owner_id === parseInt(userId)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Owners cannot leave their own listing. Delete the listing instead.' });
        }

        // Find this user's accepted membership in this listing
        const requestResult = await client.query(
            `SELECT id FROM roommate_requests
             WHERE listing_id = $1 AND sender_id = $2 AND status = 'accepted'
             FOR UPDATE`,
            [listingId, userId]
        );

        if (requestResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'You are not currently a roommate in this listing' });
        }

        const requestId = requestResult.rows[0].id;

        // 1 & 3: remove him from the room / change his request status
        await client.query(
            `UPDATE roommate_requests SET status = 'left' WHERE id = $1`,
            [requestId]
        );

        // 2: decrease occupancy (never below 0)
        const newOccupants = Math.max(0, listing.current_occupants - 1);
        await client.query(
            `UPDATE listings SET current_occupants = $1 WHERE id = $2`,
            [newOccupants, listingId]
        );

        // 5: if listing was full, reopen it so others can request again
        if (listing.status === 'occupied') {
            await client.query(
                `UPDATE listings SET status = 'active' WHERE id = $1`,
                [listingId]
            );
        }

        await client.query('COMMIT');

        // 4: allow sending requests again - handled automatically since the
        // existing-request checks elsewhere exclude status = 'left'

        res.json({ message: 'You have left the room successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Leave room error:', error);
        res.status(500).json({ error: 'Error leaving room' });
    } finally {
        client.release();
    }
});
// POST /api/join-requests/:id/reject - Reject a join request
app.post('/api/join-requests/:id/reject', authenticate, async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.session.user.id;

        // Get request details and verify ownership
        const requestQuery = await db.query(
            `SELECT rr.*, l.owner_id
             FROM roommate_requests rr
             JOIN listings l ON rr.listing_id = l.id
             WHERE rr.id = $1`,
            [requestId]
        );

        if (requestQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const request = requestQuery.rows[0];

        if (request.owner_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        // Update request status to 'rejected'
        await db.query(
            `UPDATE roommate_requests SET status = 'rejected' WHERE id = $1`,
            [requestId]
        );

        res.json({ message: 'Request rejected' });

    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ error: 'Error rejecting request' });
    }
});
app.post('/send-request/:listingId', authenticate, async (req, res) => {

    try {

        const senderId = req.session.user.id;
        const listingId = req.params.listingId;

        const listingQuery = `
            SELECT owner_id
            FROM listings
            WHERE id = $1
        `;

        const listingResult = await db.query(listingQuery, [listingId]);

        if (listingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }

        const receiverId = listingResult.rows[0].owner_id;

        if (senderId == receiverId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send request to yourself'
            });
        }

        const existingQuery = `
    SELECT *
    FROM roommate_requests
    WHERE sender_id = $1
    AND listing_id = $2
    AND status NOT IN ('rejected', 'left')
`;

        const existingResult = await db.query(existingQuery, [
            senderId,
            listingId
        ]);

        if (existingResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Request already sent'
            });
        }

        await db.query(
            `
            INSERT INTO roommate_requests
        (sender_id, listing_id, status)
        VALUES ($1, $2, 'pending')
            `,
            [senderId, listingId]
        );

        res.json({
            success: true,
            message: 'Request sent successfully'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// GET /api/my-requests - Get status of requests sent by current user
app.get('/api/my-requests', authenticate, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const result = await db.query(
            `SELECT rr.id, rr.status, rr.created_at,
                    l.title as listing_title, l.city, l.rent, l.id as listing_id
             FROM roommate_requests rr
             JOIN listings l ON rr.listing_id = l.id
             WHERE rr.sender_id = $1
             ORDER BY rr.created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('My requests error:', error);
        res.status(500).json({ error: 'Error fetching requests' });
    }
});
module.exports = app;