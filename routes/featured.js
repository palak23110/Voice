const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Featured blogs page (JSON-driven)
router.get('/', async (req, res) => {
    try {
        // Load featured blogs from JSON file
        const jsonDataPath = path.join(__dirname, '../data/featured-blogs.json');
        let featuredData = [];
        
        try {
            const jsonData = fs.readFileSync(jsonDataPath, 'utf8');
            featuredData = JSON.parse(jsonData);
        } catch (error) {
            console.error('Error reading featured blogs JSON:', error);
        }
        
        res.render('featured/index', {
            title: 'Featured Blogs - Voices',
            featuredBlogs: featuredData,
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading featured page:', error);
        res.status(500).render('error', { error: 'Error loading featured blogs' });
    }
});

module.exports = router;

