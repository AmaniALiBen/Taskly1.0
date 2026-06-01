let gigs = [];
let subCategories = ["All Services"];
let activeCategory = "All Services";
let currentPriceFilter = null;
let currentLevelFilter = null;
let currentTimeFilter = null;
let searchTerm = "";

async function fetchUserAvatar() {
    try {
        const response = await fetch('../php/getUser.php');
        const data = await response.json();

        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');

            if (avatarImg) {
                if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                    avatarImg.src = data.avatar;
                } else {
                    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=7c3aed&color=fff&size=100`;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}

async function fetchGigs() {
    const container = document.getElementById('gigs-main-container');

    try {
        const response = await fetch('../php/get_gigs.php');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load gigs');
        }

        gigs = Array.isArray(result.data) ? result.data : [];
        subCategories = Array.isArray(result.categories) && result.categories.length ? result.categories : ["All Services"];

        if (!subCategories.includes(activeCategory)) {
            activeCategory = "All Services";
        }

        renderSubNav();
        renderFilteredGigs();
    } catch (error) {
        console.error('Error loading gigs:', error);

        if (container) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Could not load gigs</h3>
                    <p>Please check the database tables and try again.</p>
                </div>
            `;
        }
    }
}

function goToOrders() {
    window.location.href = 'orders.html';
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function renderSubNav() {
    const subNav = document.querySelector('.sub-nav');
    if (!subNav) return;

    subNav.innerHTML = subCategories.map(cat => `
        <div class="nav-item ${activeCategory === cat ? 'active' : ''}" data-category="${escapeAttribute(cat)}">
            ${escapeHtml(cat)}
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

    if (activeCategory !== "All Services") {
        filtered = filtered.filter(gig => gig.category === activeCategory);
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(gig =>
            String(gig.title || '').toLowerCase().includes(term) ||
            String(gig.freelancer || '').toLowerCase().includes(term)
        );
    }

    if (currentPriceFilter) {
        filtered = filtered.filter(gig => {
            const price = Number(gig.price);
            if (currentPriceFilter === 'low') return price < 50;
            if (currentPriceFilter === 'mid') return price >= 50 && price <= 200;
            if (currentPriceFilter === 'high') return price > 200;
            return true;
        });
    }

    if (currentLevelFilter) {
        filtered = filtered.filter(gig => gig.level === currentLevelFilter);
    }

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
        <div class="gig-card" onclick="navigateToGigDetails(${Number(gig.id)})">
            <div class="gig-image-container">
                <img src="${escapeAttribute(gig.image)}" alt="${escapeAttribute(gig.title)}">
            </div>
            <div class="gig-body-content">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <img src="${escapeAttribute(gig.avatar)}" style="width: 28px; height: 28px; border-radius: 8px;" alt="">
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">${escapeHtml(gig.freelancer)}</span>
                </div>
                <span class="gig-category-badge">${escapeHtml(gig.category)}</span>
                <h3 class="gig-title-text">${escapeHtml(gig.title)}</h3>
                <div class="gig-footer-info">
                    <div class="rating-display">
                        <i class="fas fa-star"></i> ${Number(gig.rating || 0).toFixed(1)}
                    </div>
                    <div class="price-container-box">
                        <span style="font-size: 0.6rem; color: var(--text-secondary); display: block; text-transform: uppercase; font-weight: 800;">Starting at</span>
                        <span class="price-value-text">$${Number(gig.price || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupCustomSelects() {
    setupSelect('priceSelect', 'Price Range', value => currentPriceFilter = value);
    setupSelect('levelSelect', 'Seller Level', value => currentLevelFilter = value);
    setupSelect('timeSelect', 'Delivery', value => currentTimeFilter = value);

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('active'));
    });
}

function setupSelect(selectId, defaultText, onChange) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const trigger = select.querySelector('.select-trigger');
    const options = select.querySelectorAll('.option');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.custom-select').forEach(s => {
            if (s !== select) s.classList.remove('active');
        });
        select.classList.toggle('active');
    });

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const value = opt.dataset.value || null;
            onChange(value);
            trigger.querySelector('span').innerText = value ? opt.innerText : defaultText;
            select.classList.remove('active');
            renderFilteredGigs();
        });
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

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

window.onload = () => {
    renderSubNav();
    setupCustomSelects();
    setupSearch();
    fetchUserAvatar();
    fetchGigs();

    const backBtn = document.querySelector('.btn-back');
    if (backBtn) {
        backBtn.onclick = goBack;
    }
};
