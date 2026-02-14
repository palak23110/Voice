// OOP Implementation: FilterManager Class
// This demonstrates Object-Oriented Programming concepts for managing filters

class FilterManager {
    constructor(containerId, filterButtonsId) {
        this.container = document.getElementById(containerId);
        this.filterButtons = document.querySelectorAll(`#${filterButtonsId} .filter-btn`);
        this.activeCategory = '';
        this.allCards = [];
        this.filteredCards = [];
        
        this.init();
    }

    // Initialize the filter manager
    init() {
        if (!this.container) return;

        // Collect all blog cards
        this.allCards = Array.from(this.container.querySelectorAll('.blog-card'));
        
        // Attach event listeners to filter buttons
        this.filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const category = button.getAttribute('data-category') || '';
                this.filterByCategory(category);
                this.updateActiveButton(button);
            });
        });

        // Initialize with all cards visible
        this.filteredCards = [...this.allCards];
    }

    // Filter cards by category
    filterByCategory(category) {
        this.activeCategory = category;
        
        if (category === '') {
            // Show all cards
            this.filteredCards = [...this.allCards];
        } else {
            // Filter by category
            this.filteredCards = this.allCards.filter(card => {
                return card.getAttribute('data-category') === category;
            });
        }

        this.renderFilteredCards();
        this.animateCards();
    }

    // Update active filter button
    updateActiveButton(activeButton) {
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    // Render filtered cards
    renderFilteredCards() {
        if (!this.container) return;

        // Hide all cards first
        this.allCards.forEach(card => {
            card.style.display = 'none';
            card.classList.remove('filtered-in');
        });

        // Show filtered cards
        this.filteredCards.forEach((card, index) => {
            card.style.display = 'block';
            // Add delay for animation
            setTimeout(() => {
                card.classList.add('filtered-in');
            }, index * 50);
        });

        // Show message if no results
        if (this.filteredCards.length === 0) {
            this.showNoResultsMessage();
        } else {
            this.hideNoResultsMessage();
        }
    }

    // Animate cards when filtering
    animateCards() {
        this.filteredCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    // Show no results message
    showNoResultsMessage() {
        let message = this.container.querySelector('.no-results-message');
        if (!message) {
            message = document.createElement('p');
            message.className = 'no-results-message no-blogs';
            message.textContent = `No blogs found in ${this.activeCategory || 'this category'}.`;
            this.container.appendChild(message);
        }
        message.style.display = 'block';
    }

    // Hide no results message
    hideNoResultsMessage() {
        const message = this.container.querySelector('.no-results-message');
        if (message) {
            message.style.display = 'none';
        }
    }

    // Search filter method
    filterBySearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredCards = this.activeCategory === '' 
                ? [...this.allCards] 
                : this.allCards.filter(card => 
                    card.getAttribute('data-category') === this.activeCategory
                );
        } else {
            this.filteredCards = this.allCards.filter(card => {
                const title = card.querySelector('.blog-card-title a')?.textContent.toLowerCase() || '';
                const excerpt = card.querySelector('.blog-card-excerpt')?.textContent.toLowerCase() || '';
                const category = card.getAttribute('data-category')?.toLowerCase() || '';
                
                const matchesSearch = title.includes(searchTerm) || 
                                    excerpt.includes(searchTerm) || 
                                    category.includes(searchTerm);
                
                const matchesCategory = this.activeCategory === '' || 
                                       card.getAttribute('data-category') === this.activeCategory;
                
                return matchesSearch && matchesCategory;
            });
        }

        this.renderFilteredCards();
        this.animateCards();
    }

    // Reset all filters
    reset() {
        this.activeCategory = '';
        this.filteredCards = [...this.allCards];
        this.renderFilteredCards();
        
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-category') === '') {
                button.classList.add('active');
            }
        });
    }

    // Get statistics
    getStats() {
        return {
            total: this.allCards.length,
            filtered: this.filteredCards.length,
            activeCategory: this.activeCategory
        };
    }
}

// Initialize FilterManager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const blogsGrid = document.getElementById('blogsGrid');
    const categoryFilters = document.getElementById('categoryFilters');
    
    if (blogsGrid && categoryFilters) {
        window.filterManager = new FilterManager('blogsGrid', 'categoryFilters');
        
        // Integrate search with filter manager
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                if (window.filterManager) {
                    window.filterManager.filterBySearch(e.target.value);
                }
            });
        }
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterManager;
}

