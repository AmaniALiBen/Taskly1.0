const gigs = [
    { id: 1, title: "Modern Luxury Brand Identity Design", price: 80, category: "Design", freelancer: "Ahmed B.", avatar: "https://i.pravatar.cc/100?u=1", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800", rating: 4.9, level: "pro", delivery: "3d" },
    { id: 2, title: "Full Stack Web Application Development", price: 350, category: "Coding", freelancer: "Sara M.", avatar: "https://i.pravatar.cc/100?u=2", image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800", rating: 5.0, level: "top", delivery: "7d" },
    { id: 3, title: "Social Media Video Marketing Content", price: 120, category: "Video", freelancer: "Omar K.", avatar: "https://i.pravatar.cc/100?u=3", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800", rating: 4.8, level: "rising", delivery: "3d" },
    { id: 4, title: "Business Strategy & Growth Consulting", price: 150, category: "Ads", freelancer: "Layla T.", avatar: "https://i.pravatar.cc/100?u=4", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", rating: 4.7, level: "pro", delivery: "7d" },
    { id: 5, title: "UX/UI Design for SaaS Product", price: 200, category: "UX/UI Design", freelancer: "Nadia R.", avatar: "https://i.pravatar.cc/100?u=5", image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800", rating: 4.9, level: "top", delivery: "24h" },
    { id: 6, title: "Architecture 3D Visualization", price: 280, category: "Architecture", freelancer: "Khaled M.", avatar: "https://i.pravatar.cc/100?u=6", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800", rating: 4.8, level: "pro", delivery: "7d" },
    { id: 7, title: "NFT Art Collection Creation", price: 180, category: "NFT Art", freelancer: "Mona L.", avatar: "https://i.pravatar.cc/100?u=7", image: "https://images.unsplash.com/photo-1536240474400-b8f2e8a3d7b1?w=800", rating: 4.9, level: "rising", delivery: "24h" },
    { id: 8, title: "Digital Marketing Strategy", price: 250, category: "Marketing", freelancer: "Ali H.", avatar: "https://i.pravatar.cc/100?u=8", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800", rating: 4.7, level: "top", delivery: "3d" }
];

let activeCategory = "All Services";
let currentPriceFilter = null;
let currentLevelFilter = null;
let currentTimeFilter = null;
let searchTerm = "";

// Available sub-categories
const subCategories = ["All Services", "UX/UI Design", "Architecture", "NFT Art", "Marketing"];

function renderSubNav() {
    const subNav = document.querySelector('.sub-nav');
    if (!subNav) return;
    
    subNav.innerHTML = subCategories.map(cat => `
        <div class="nav-item ${activeCategory === cat ? 'active' : ''}" data-category="${cat}">
            ${cat}
        </div>
    `).join('');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            activeCategory = item.dataset.category;
            renderSubNav();
            renderFilteredGigs();
        });
    });
}

function filterGigs() {
    let filtered = [...gigs];
    
    // Filter by category
    if (activeCategory !== "All Services") {
        filtered = filtered.filter(gig => gig.category === activeCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(gig => 
            gig.title.toLowerCase().includes(term) || 
            gig.freelancer.toLowerCase().includes(term)
        );
    }
    
    // Filter by price range
    if (currentPriceFilter) {
        filtered = filtered.filter(gig => {
            if (currentPriceFilter === 'low') return gig.price < 50;
            if (currentPriceFilter === 'mid') return gig.price >= 50 && gig.price <= 200;
            if (currentPriceFilter === 'high') return gig.price > 200;
            return true;
        });
    }
    
    // Filter by seller level
    if (currentLevelFilter) {
        filtered = filtered.filter(gig => gig.level === currentLevelFilter);
    }
    
    // Filter by delivery time
    if (currentTimeFilter) {
        filtered = filtered.filter(gig => gig.delivery === currentTimeFilter);
    }
    
    return filtered;
}

function renderFilteredGigs() {
    const container = document.getElementById('gigs-main-container');
    if (!container) return;
    
    const filteredGigs = filterGigs();
    
    if (filteredGigs.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No gigs found</h3>
                <p>Try adjusting your filters or search term</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredGigs.map(gig => `
        <div class="gig-card" onclick="navigateToGigDetails(${gig.id})">
            <div class="gig-image-container">
                <img src="${gig.image}" alt="${gig.title}">
            </div>
            <div class="gig-body-content">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <img src="${gig.avatar}" style="width: 28px; height: 28px; border-radius: 8px;">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">${gig.freelancer}</span>
                </div>
                <span class="gig-category-badge">${gig.category}</span>
                <h3 class="gig-title-text">${gig.title}</h3>
                <div class="gig-footer-info">
                    <div class="rating-display">
                        <i class="fas fa-star"></i> ${gig.rating}
                    </div>
                    <div class="price-container-box">
                        <span style="font-size: 0.6rem; color: var(--text-secondary); display: block; text-transform: uppercase; font-weight: 800;">Starting at</span>
                        <span class="price-value-text">$${gig.price}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupCustomSelects() {
    // Price Select
    const priceSelect = document.getElementById('priceSelect');
    if (priceSelect) {
        const trigger = priceSelect.querySelector('.select-trigger');
        const options = priceSelect.querySelectorAll('.option');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== priceSelect) s.classList.remove('active');
            });
            priceSelect.classList.toggle('active');
        });
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const value = opt.dataset.value;
                if (value) {
                    currentPriceFilter = value;
                    trigger.querySelector('span').innerText = opt.innerText;
                } else {
                    currentPriceFilter = null;
                    trigger.querySelector('span').innerText = 'Price Range';
                }
                priceSelect.classList.remove('active');
                renderFilteredGigs();
            });
        });
    }
    
    // Level Select
    const levelSelect = document.getElementById('levelSelect');
    if (levelSelect) {
        const trigger = levelSelect.querySelector('.select-trigger');
        const options = levelSelect.querySelectorAll('.option');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== levelSelect) s.classList.remove('active');
            });
            levelSelect.classList.toggle('active');
        });
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const value = opt.dataset.value;
                if (value) {
                    currentLevelFilter = value;
                    trigger.querySelector('span').innerText = opt.innerText;
                } else {
                    currentLevelFilter = null;
                    trigger.querySelector('span').innerText = 'Seller Level';
                }
                levelSelect.classList.remove('active');
                renderFilteredGigs();
            });
        });
    }
    
    // Time Select
    const timeSelect = document.getElementById('timeSelect');
    if (timeSelect) {
        const trigger = timeSelect.querySelector('.select-trigger');
        const options = timeSelect.querySelectorAll('.option');
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== timeSelect) s.classList.remove('active');
            });
            timeSelect.classList.toggle('active');
        });
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const value = opt.dataset.value;
                if (value) {
                    currentTimeFilter = value;
                    trigger.querySelector('span').innerText = opt.innerText;
                } else {
                    currentTimeFilter = null;
                    trigger.querySelector('span').innerText = 'Delivery';
                }
                timeSelect.classList.remove('active');
                renderFilteredGigs();
            });
        });
    }
    
    // Close selects when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('active'));
    });
}

function setupSearch() {
    const searchInput = document.querySelector('.search-wrapper input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderFilteredGigs();
        });
    }
}

function navigateToGigDetails(gigId) {
    window.location.href = `gig-details.html?id=${gigId}`;
}

function goBack() {
    window.history.back();
}

// Initialize on load
window.onload = () => {
    renderSubNav();
    renderFilteredGigs();
    setupCustomSelects();
    setupSearch();
    
    // Back button
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.onclick = goBack;
    }
};