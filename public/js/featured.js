// JSON-driven featured blogs page
// This page loads data from JSON file via API

document.addEventListener('DOMContentLoaded', function() {
    loadFeaturedBlogs();
});

async function loadFeaturedBlogs() {
    try {
        const response = await fetch('/api/featured');
        const blogs = await response.json();
        
        const container = document.getElementById('featuredBlogsGrid');
        if (!container) return;
        
        if (blogs.length === 0) {
            container.innerHTML = '<p class="no-blogs">No featured blogs available.</p>';
            return;
        }
        
        // Filter out blogs with invalid IDs (like "featured-1" from JSON)
        const validBlogs = blogs.filter(blog => {
            // Check if ID is a valid MongoDB ObjectId (24 hex characters)
            return blog.id && /^[0-9a-fA-F]{24}$/.test(blog.id);
        });
        
        if (validBlogs.length === 0) {
            container.innerHTML = '<p class="no-blogs">No featured blogs available. <a href="/blog/list">Browse all blogs</a></p>';
            return;
        }
        
        // Use BlogCard class to render cards (OOP)
        if (typeof BlogCard !== 'undefined') {
            BlogCard.createCards(validBlogs, container);
        } else {
            // Fallback if BlogCard is not available
            container.innerHTML = validBlogs.map((blog, index) => `
                <div class="blog-card" data-blog-id="${blog.id}" data-aos="zoom-in" data-aos-delay="${index * 100}">
                    <div class="blog-card-image">
                        <img src="${blog.imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=90'}" 
                             alt="${blog.title}" 
                             onerror="this.src='https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=90'">
                        <span class="blog-category">${blog.category}</span>
                    </div>
                    <div class="blog-card-content">
                        <h3 class="blog-card-title"><a href="/blog/${blog.id}">${blog.title}</a></h3>
                        <p class="blog-card-excerpt">${blog.excerpt}</p>
                        <div class="blog-card-meta">
                            <span class="blog-author">By ${blog.author}</span>
                            <span class="blog-views">👁 ${blog.views || 0} views</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Refresh AOS after adding cards
            if (typeof AOS !== 'undefined') {
                AOS.refresh();
            }
        }
    } catch (error) {
        console.error('Error loading featured blogs:', error);
        const container = document.getElementById('featuredBlogsGrid');
        if (container) {
            container.innerHTML = '<p class="no-blogs">Error loading featured blogs. Please try again later.</p>';
        }
    }
}

