// OOP Implementation: BlogCard Class
// This demonstrates Object-Oriented Programming concepts

class BlogCard {
    constructor(data) {
        this.id = data.id || data._id;
        this.title = data.title;
        this.excerpt = data.excerpt;
        this.author = data.author;
        this.category = data.category;
        this.views = data.views || 0;
        this.imageUrl = data.imageUrl || '/images/default-blog.jpg';
        this.createdAt = data.createdAt;
        this.tags = data.tags || [];
        this.element = null;
    }

    // Method to render the blog card HTML
    render() {
        const card = document.createElement('div');
        card.className = 'blog-card';
        card.setAttribute('data-blog-id', this.id);
        card.setAttribute('data-category', this.category);
        
        const formattedDate = this.createdAt 
            ? new Date(this.createdAt).toLocaleDateString() 
            : '';

        card.innerHTML = `
            <div class="blog-card-image">
                <img src="${this.imageUrl}" alt="${this.title}" loading="lazy">
                <span class="blog-category">${this.category}</span>
            </div>
            <div class="blog-card-content">
                <h3 class="blog-card-title">
                    <a href="/blog/${this.id}">${this.title}</a>
                </h3>
                <p class="blog-card-excerpt">${this.excerpt}</p>
                <div class="blog-card-meta">
                    <span class="blog-author">By ${this.author}</span>
                    <span class="blog-views">👁 ${this.views} views</span>
                </div>
                ${this.tags.length > 0 ? `
                    <div class="blog-card-tags">
                        ${this.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add AOS animation attribute
        card.setAttribute('data-aos', 'zoom-in');

        this.element = card;
        this.attachEventListeners();
        return card;
    }

    // Method to attach event listeners
    attachEventListeners() {
        if (!this.element) return;

        // Hover effect
        this.element.addEventListener('mouseenter', () => {
            this.element.classList.add('hover');
        });

        this.element.addEventListener('mouseleave', () => {
            this.element.classList.remove('hover');
        });

        // Click tracking (could be used for analytics)
        this.element.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                this.trackClick();
            }
        });
    }

    // Method to track clicks (for analytics)
    trackClick() {
        console.log(`Blog card clicked: ${this.title}`);
        // In a real application, you would send this to an analytics service
    }

    // Method to update views
    updateViews(newViews) {
        this.views = newViews;
        if (this.element) {
            const viewsElement = this.element.querySelector('.blog-views');
            if (viewsElement) {
                viewsElement.textContent = `👁 ${newViews} views`;
            }
        }
    }

    // Static method to create multiple blog cards from an array
    static createCards(blogDataArray, container) {
        if (!container) return;
        
        const cards = blogDataArray.map((data, index) => {
            const card = new BlogCard(data);
            const cardElement = card.render();
            cardElement.setAttribute('data-aos-delay', (index * 100).toString());
            return cardElement;
        });

        container.innerHTML = '';
        cards.forEach(card => container.appendChild(card));
        
        // Reinitialize AOS for new elements
        if (typeof AOS !== 'undefined') {
            AOS.refresh();
        }
        
        return cards.map(card => {
            const cardId = card.getAttribute('data-blog-id');
            return BlogCard.getCardById(cardId);
        });
    }

    // Static method to get card instance by ID
    static getCardById(id) {
        const element = document.querySelector(`[data-blog-id="${id}"]`);
        if (!element) return null;
        
        // Extract data from element
        const title = element.querySelector('.blog-card-title a')?.textContent;
        const excerpt = element.querySelector('.blog-card-excerpt')?.textContent;
        const author = element.querySelector('.blog-author')?.textContent.replace('By ', '');
        const category = element.querySelector('.blog-category')?.textContent;
        const viewsText = element.querySelector('.blog-views')?.textContent;
        const views = parseInt(viewsText?.match(/\d+/)?.[0] || '0');
        
        return new BlogCard({
            id,
            title,
            excerpt,
            author,
            category,
            views
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogCard;
}

