// ============================================
// GIGS PAGE
// ============================================

let allGigs = [];
let allSubCategories = [];
let categories = [];
let activeSubCategoryId = null;
let currentPriceFilter = null;
let currentDeliveryFilter = null;
let currentLevelFilter = null;
let searchTerm = "";
let urlCategoryId = null;
let urlSearch = "";

const CAT_API = '../controllers/CategoryController.php';
const GIG_API = '../controllers/GigController.php';

// ============================================
// GET URL PARAMETERS
// ============================================
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    urlCategoryId = urlParams.get('category_id');
    urlSearch = urlParams.get('search');

    if (urlSearch) {
        searchTerm = urlSearch;
        const searchInput = document.querySelector('.search-wrapper input');
        if (searchInput) searchInput.value = searchTerm;
    }
}

// ============================================
// FETCH CATEGORIES
// ============================================
async function fetchCategories() {
    try {
        const response = await fetch(`${CAT_API}?action=get_all`);
        const data = await response.json();
        if (data.success && data.data.length > 0) return data.data;
        return [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// ============================================
// FETCH SUBCATEGORIES FOR A CATEGORY
// ============================================
async function fetchSubcategoriesByCategory(categoryId) {
    try {
        const response = await fetch(`${CAT_API}?action=get_subs&category_id=${categoryId}`);
        const data = await response.json();
        if (data.success && data.data.length > 0) return data.data;
        return [];
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        return [];
    }
}
// ============================================
// FETCH USER AVATAR FROM DATABASE
async function fetchUserAvatar() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php', {
            cache: 'no-cache',
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');
            if (!avatarImg) return;

            if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                avatarImg.src = data.avatar + '?t=' + Date.now();
            } else if (data.username) {
                avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=7c3aed&color=fff&size=100`;
            }
        }
    } catch (error) {
        console.error('Avatar error:', error);
    }
}


// ============================================
// FETCH GIGS
// ============================================
async function fetchGigs() {
    const container = document.getElementById('gigs-main-container');
    try {
        const response = await fetch(`${GIG_API}?action=public_gigs&limit=100`);
        const result = await response.json();

        if (result.success && result.data) {
            allGigs = result.data;
            renderFilteredGigs();
        } else {
            throw new Error('Failed to load gigs');
        }
    } catch (error) {
        console.error('Error:', error);
        if (container) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error loading gigs</h3>
                    <p>Please check that the server is running</p>
                </div>`;
        }
    }
}

// ============================================
// RENDER SUB-CATEGORIES AS TABS
// ============================================
function renderSubNav() {
    const subNav = document.querySelector('.sub-nav');
    if (!subNav) return;

    const tabItems = ['All Services', ...allSubCategories.map(sc => sc.name)];

    subNav.innerHTML = tabItems.map(tabName => {
        const isActive = (tabName === 'All Services' && activeSubCategoryId === null) ||
                         (tabName !== 'All Services' && allSubCategories.find(sc => sc.name === tabName)?.id === activeSubCategoryId);
        return `
            <div class="nav-item ${isActive ? 'active' : ''}" data-sub-category-name="${tabName}">
                ${escapeHtml(tabName)}
            </div>`;
    }).join('');

    document.querySelectorAll('.sub-nav .nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const subCategoryName = item.dataset.subCategoryName;
            if (subCategoryName === 'All Services') {
                activeSubCategoryId = null;
            } else {
                const subCategory = allSubCategories.find(sc => sc.name === subCategoryName);
                activeSubCategoryId = subCategory ? subCategory.id : null;
            }
            renderSubNav();
            renderFilteredGigs();
        });
    });
}

// ============================================
// FILTER GIGS
// ============================================
function filterGigs() {
    let filtered = [...allGigs];

    // Filter by main category (from URL)
    if (urlCategoryId) {
        filtered = filtered.filter(gig => gig.category_id == urlCategoryId);
    }

    // Filter by sub-category tab
    if (activeSubCategoryId !== null) {
        filtered = filtered.filter(gig => gig.sub_category_id == activeSubCategoryId);
    }

    // Filter by search term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(gig =>
            (gig.title || '').toLowerCase().includes(term) ||
            (gig.freelancer || '').toLowerCase().includes(term)
        );
    }

    // Filter by price
    if (currentPriceFilter) {
        filtered = filtered.filter(gig => {
            const price = Number(gig.price);
            if (currentPriceFilter === 'low')  return price < 50;
            if (currentPriceFilter === 'mid')  return price >= 50 && price <= 200;
            if (currentPriceFilter === 'high') return price > 200;
            return true;
        });
    }

    // Filter by delivery time
    if (currentDeliveryFilter) {
        filtered = filtered.filter(gig => {
            const days = Number(gig.delivery_time_days || gig.delivery || 999);
            if (currentDeliveryFilter === '24h') return days <= 1;
            if (currentDeliveryFilter === '3d')  return days <= 3;
            if (currentDeliveryFilter === '7d')  return days <= 7;
            return true;
        });
    }

    if (currentLevelFilter) {
    filtered = filtered.filter(gig => gig.seller_level === currentLevelFilter);
}
    return filtered;
}

// ============================================
// RENDER GIGS
// ============================================
function renderFilteredGigs() {
    const container = document.getElementById('gigs-main-container');
    if (!container) return;

    const filtered = filterGigs();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No gigs found</h3>
                <p>Try adjusting your filters or search term</p>
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(gig => {
        const hasRating = Number(gig.rating) > 0;
        const ratingHtml = hasRating
            ? `<div class="rating-display"><i class="fas fa-star"></i> ${Number(gig.rating).toFixed(1)}</div>`
            : `<div class="rating-display new-badge">✦ New</div>`;

        return `
        <div class="gig-card" onclick="navigateToGigDetails(${gig.id})">
            <div class="gig-image-container">
                <img src="${gig.image && gig.image !== 'null' ? gig.image : '../images/default-gig.jpg'}"
                     alt="${escapeHtml(gig.title)}"
                     onerror="this.src='../images/default-gig.jpg'">
            </div>
            <div class="gig-body-content">
                <div class="gig-seller-info">
                  
                    <img src="${gig.avatar || 'fallback-url'}" class="seller-avatar">
                    <span class="seller-name">${escapeHtml(gig.freelancer || 'Taskly Seller')}</span>
                </div>
                <span class="gig-category-badge">${escapeHtml(gig.sub_category || 'Service')}</span>
                <h3 class="gig-title-text">${escapeHtml(gig.title)}</h3>
                <div class="gig-footer-info">
                    ${ratingHtml}
                    <div class="price-container-box">
                        <span class="price-label">Starting at</span>
                        <span class="price-value-text">$${Number(gig.price || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// CUSTOM SELECTS (ALL 3 DROPDOWNS)
// ============================================
function setupCustomSelects() {
    // Price filter
    setupSelect('priceSelect', 'Price Range', (value) => {
        currentPriceFilter = value;
        updateClearButton();
        renderFilteredGigs();
    });

    setupSelect('levelSelect', 'Seller Level', (value) => {
        currentLevelFilter = value;
        updateClearButton();
        renderFilteredGigs();
    });

    // Delivery time filter
    setupSelect('timeSelect', 'Delivery', (value) => {
        currentDeliveryFilter = value;
        updateClearButton();
        renderFilteredGigs();
    });
}

function setupSelect(selectId, defaultText, onChange) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const trigger = select.querySelector('.select-trigger');
    const options = select.querySelectorAll('.option');

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other dropdowns
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== select) s.classList.remove('active');
            });
            select.classList.toggle('active');
        });
    }

    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = opt.dataset.value || null;
            if (onChange) onChange(value);
            if (trigger) {
                const span = trigger.querySelector('span');
                if (span) span.innerText = value ? opt.innerText.trim() : defaultText;
            }
            select.classList.remove('active');
        });
    });

    // Close on outside click
    document.addEventListener('click', () => {
        select.classList.remove('active');
    });
}

// ============================================
// CLEAR FILTERS BUTTON
// ============================================
function updateClearButton() {
    const controls = document.querySelector('.filter-controls');
    if (!controls) return;

    const hasActiveFilter = currentPriceFilter || currentDeliveryFilter || currentLevelFilter || searchTerm;
    let clearBtn = document.getElementById('clearFiltersBtn');

    if (hasActiveFilter) {
        if (!clearBtn) {
            clearBtn = document.createElement('button');
            clearBtn.id = 'clearFiltersBtn';
            clearBtn.className = 'clear-filters-btn';
            clearBtn.innerHTML = '<i class="fas fa-times"></i> Clear';
            clearBtn.onclick = clearAllFilters;
           controls.prepend(clearBtn);
        }
    } else {
        if (clearBtn) clearBtn.remove();
    }
}

function clearAllFilters() {
    // Reset all filter values
    currentPriceFilter    = null;
    currentDeliveryFilter = null;
    currentLevelFilter    = null;
    searchTerm            = '';

    // Reset dropdown labels
    const priceSpan = document.querySelector('#priceSelect .select-trigger span');
    const levelSpan = document.querySelector('#levelSelect .select-trigger span');
    const timeSpan  = document.querySelector('#timeSelect .select-trigger span');
    if (priceSpan) priceSpan.innerText = 'Price Range';
    if (levelSpan) levelSpan.innerText = 'Seller Level';
    if (timeSpan)  timeSpan.innerText  = 'Delivery';

    // Reset search input
    const searchInput = document.querySelector('.search-wrapper input');
    if (searchInput) searchInput.value = '';

    updateClearButton();
    renderFilteredGigs();
}

// ============================================
// SEARCH
// ============================================
function setupSearch() {
    const searchInput = document.querySelector('.search-wrapper input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            updateClearButton();
            renderFilteredGigs();
        });
    }
}


// ============================================
// NAVIGATION
// ============================================
function navigateToGigDetails(gigId) {
    window.location.href = `gig-details.html?id=${gigId}`;
}
function goBack()      { window.history.back(); }
function goToOrders()  { window.location.href = 'orders.html'; }
function goToProfile() { window.location.href = 'profile.html'; }

// ============================================
// HELPERS
// ============================================
function escapeHtml(value) {
    if (!value) return '';
    return String(value).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}

// ============================================
// INITIALIZATION
// ============================================
window.onload = async () => {
    fetchUserAvatar();
    getUrlParams();
    setupCustomSelects();
    setupSearch();

    // Load all gigs
    await fetchGigs();

    // Load subcategories and set page title from URL category
    if (urlCategoryId) {
        allSubCategories = await fetchSubcategoriesByCategory(urlCategoryId);
        categories = await fetchCategories();
        const category = categories.find(c => c.id == urlCategoryId);
        const pageTitle = document.getElementById('page-title');
        if (pageTitle && category) pageTitle.textContent = category.name;
    } else if (urlSearch) {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = `Search: "${urlSearch}"`;
    }

    renderSubNav();
    renderFilteredGigs();

    const backBtn = document.querySelector('.btn-back');
    if (backBtn) backBtn.onclick = goBack;
};