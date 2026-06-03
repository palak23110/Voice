// Main JavaScript file for interactive features

// Sticky navbar with transparency effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.main-header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    const mobileBackdrop = document.getElementById('mobileBackdrop');

    function setMenuState(isOpen) {
        navMenu.classList.toggle('active', isOpen);
        mobileMenuToggle.classList.toggle('active', isOpen);
        mobileBackdrop?.classList.toggle('active', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
        mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
    }

    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            const isOpen = !navMenu.classList.contains('active');
            setMenuState(isOpen);
        });

        mobileBackdrop?.addEventListener('click', function() {
            setMenuState(false);
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    setMenuState(false);
                }
            });
        });
    }

    // Dropdown menu functionality
    const dropdowns = document.querySelectorAll('.dropdown, .user-menu');
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-link');
        if (link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown') && !e.target.closest('.user-menu')) {
            dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
        }
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // Animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.blog-card, .category-card, .stat-card').forEach(el => {
        observer.observe(el);
    });

    // Image lazy loading
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
});

// Search function
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        alert('Please enter at least 2 characters to search');
        return;
    }

    // Fetch search results from API
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data);
        })
        .catch(error => {
            console.error('Search error:', error);
            alert('Error performing search. Please try again.');
        });
}

// Display search results
function displaySearchResults(data) {
    const blogsGrid = document.getElementById('blogsGrid');
    if (!blogsGrid) return;

    const results = Array.isArray(data) ? data : (data.blogs || []);

    if (results.length === 0) {
        blogsGrid.innerHTML = '<p class="no-blogs">No blogs found matching your search.</p>';
        return;
    }

    blogsGrid.innerHTML = results.map((blog, index) => `
        <div class="blog-card" data-blog-id="${blog._id}" data-aos="zoom-in" data-aos-delay="${index * 100}">
            <div class="blog-card-image">
                <img src="${blog.imageUrl || '/images/default-blog.jpg'}" alt="${blog.title}">
                <span class="blog-category">${blog.category}</span>
            </div>
            <div class="blog-card-content">
                <h3 class="blog-card-title"><a href="/blog/${blog._id}">${blog.title}</a></h3>
                <p class="blog-card-excerpt">${blog.excerpt}</p>
                <div class="blog-card-footer">
                    <div class="blog-card-byline">
                        <span class="blog-author">By ${blog.author}</span>
                        ${blog.createdAt ? `<span class="blog-date">${new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>` : ''}
                    </div>
                    <div class="blog-card-engagement">
                        <button type="button" class="blog-views blog-views-trigger" data-blog-id="${blog._id}">👁 ${blog.views || 0} Views</button>
                        <a href="/blog/${blog._id}?comments=1#comments" class="blog-comments-link">💬 Comments</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Popup functionality for notifications
function showPopup(message, type = 'info') {
    const popup = document.createElement('div');
    popup.className = `popup popup-${type}`;
    popup.textContent = message;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(popup);
        }, 300);
    }, 3000);
}

