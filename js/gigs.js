// ============================================
// GIGS PAGE - BROWSE GIGS BY CATEGORY
// ============================================

let allGigs = [];
let allSubCategories = [];
let categories = [];
let activeSubCategoryId = null;
let currentPriceFilter = null;
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
    
    console.log('URL params - category_id:', urlCategoryId, 'search:', urlSearch);
    
    if (urlSearch) {
        searchTerm = urlSearch;
        const searchInput = document.querySelector('.search-wrapper input');
        if (searchInput) searchInput.value = searchTerm;
    }
}

// ============================================
// FETCH ALL CATEGORIES
// ============================================
async function fetchCategories() {
    try {
        const response = await fetch(`${CAT_API}?action=get_all`);
        const data = await response.json();
        
        console.log('Categories API response:', data);
        
        if (data.success && data.data.length > 0) {
            return data.data;
        }
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
        
        console.log('Subcategories API response:', data);
        
        if (data.success && data.data.length > 0) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        return [];
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
        
        console.log('Gigs API response:', result);
        
        if (result.success && result.data) {
            allGigs = result.data;
            console.log('Gigs loaded:', allGigs.length);
            renderFilteredGigs();
        } else {
            throw new Error('Failed to load gigs');
        }
    } catch (error) {
        console.error('Error:', error);
        if (container) {
            container.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-circle"></i><h3>Error loading gigs</h3><p>Please check that the server is running</p></div>';
        }
    }
}

// ============================================
// RENDER SUB NAVIGATION (SUB-CATEGORIES AS TABS)
// ============================================
function renderSubNav() {
    const subNav = document.querySelector('.sub-nav');
    if (!subNav) {
        console.error('Sub-nav element not found');
        return;
    }
    
    // Create tab items: "All" + subcategories
    const tabItems = ['All Services', ...allSubCategories.map(sc => sc.name)];
    
    subNav.innerHTML = tabItems.map(tabName => {
        const isActive = (tabName === 'All Services' && activeSubCategoryId === null) ||
                         (tabName !== 'All Services' && allSubCategories.find(sc => sc.name === tabName)?.id === activeSubCategoryId);
        
        return `
            <div class="nav-item ${isActive ? 'active' : ''}" data-sub-category-name="${tabName}">
                ${escapeHtml(tabName)}
            </div>
        `;
    }).join('');
    
    // Add click handlers
    document.querySelectorAll('.sub-nav .nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const subCategoryName = item.dataset.subCategoryName;
            
            if (subCategoryName === 'All Services') {
                activeSubCategoryId = null;
            } else {
                const subCategory = allSubCategories.find(sc => sc.name === subCategoryName);
                activeSubCategoryId = subCategory ? subCategory.id : null;
            }
            
            console.log('Active sub-category ID:', activeSubCategoryId);
            
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
    
    // Filter by category (from URL or selected)
    if (urlCategoryId) {
        filtered = filtered.filter(gig => gig.category_id == urlCategoryId);
    }
    
    // Filter by sub-category (from tab selection)
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
            if (currentPriceFilter === 'low') return price < 50;
            if (currentPriceFilter === 'mid') return price >= 50 && price <= 200;
            if (currentPriceFilter === 'high') return price > 200;
            return true;
        });
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
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(gig => `
        <div class="gig-card" onclick="navigateToGigDetails(${gig.id})">
            <div class="gig-image-container">
                <img src="${gig.image && gig.image !== 'null' ? gig.image : '../images/default-gig.jpg'}" alt="${escapeHtml(gig.title)}">
            </div>
            <div class="gig-body-content">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                    <div style="width: 28px; height: 28px; border-radius: 8px; background: #7c3aed; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${(gig.freelancer || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">${escapeHtml(gig.freelancer || 'Taskly Seller')}</span>
                </div>
                <span class="gig-category-badge">${escapeHtml(gig.sub_category || 'Service')}</span>
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

// ============================================
// CUSTOM SELECTS (FILTERS)
// ============================================
function setupCustomSelects() {
    setupSelect('priceSelect', 'Price Range', (value) => {
        currentPriceFilter = value;
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
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== select) s.classList.remove('active');
            });
            select.classList.toggle('active');
        });
    }
    
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const value = opt.dataset.value || null;
            if (onChange) onChange(value);
            if (trigger) {
                const span = trigger.querySelector('span');
                if (span) span.innerText = value ? opt.innerText : defaultText;
            }
            select.classList.remove('active');
        });
    });
    
    document.addEventListener('click', () => {
        select.classList.remove('active');
    });
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function setupSearch() {
    const searchInput = document.querySelector('.search-wrapper input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderFilteredGigs();
        });
    }
}

// ============================================
// FETCH USER AVATAR
// ============================================
async function fetchUserAvatar() {
    try {
        const response = await fetch('/Taskly/php/getUser.php');
        const data = await response.json();
        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');
            if (avatarImg) {
                avatarImg.src = (data.avatar && data.avatar !== 'null')
                    ? data.avatar
                    : `https://ui-avatars.com/api/?name=${data.username?.charAt(0).toUpperCase() || 'U'}&background=7c3aed&color=fff&size=100`;
            }
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}

// ============================================
// NAVIGATION
// ============================================
function navigateToGigDetails(gigId) {
    window.location.href = `gig-details.html?id=${gigId}`;
}

function goBack() {
    window.history.back();
}

function goToOrders() {
    window.location.href = 'orders.html';
}

function goToProfile() {
    window.location.href = 'profile.html';
}

// ============================================
// HELPERS
// ============================================
function escapeHtml(value) {
    if (!value) return '';
    return String(value).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================================
// INITIALIZATION
// ============================================
window.onload = async () => {
    console.log('Page loaded - gigs.js');
    fetchUserAvatar();
    getUrlParams();
    setupCustomSelects();
    setupSearch();
    
    // Load all gigs first
    await fetchGigs();
    
    // If we have a category_id from URL, load its subcategories
    if (urlCategoryId) {
        allSubCategories = await fetchSubcategoriesByCategory(urlCategoryId);
        console.log('Subcategories loaded:', allSubCategories);
        
        // Get the category name for the page title
        categories = await fetchCategories();
        const category = categories.find(c => c.id == urlCategoryId);
        if (category) {
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) pageTitle.textContent = category.name;
        }
    } else if (urlSearch) {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = `Search: "${urlSearch}"`;
    }
    
    // Render the sub-nav (tabs) and filter gigs
    renderSubNav();
    renderFilteredGigs();
    
    // Setup back button
    const backBtn = document.querySelector('.btn-back');
    if (backBtn) backBtn.onclick = goBack;
};