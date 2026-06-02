// ============================================
// API ENDPOINTS
// ============================================
const CAT_API = '/Taskly/controllers/CategoryController.php';
const GIG_API = '/Taskly/controllers/GigController.php';

// ============================================
// TEMPORARY - AUTO LOGIN FOR DEVELOPMENT
// ============================================
// 🔧 REMOVE THIS BLOCK WHEN LOGIN IS READY 🔧
const DEV_MODE = true;
// ============================================

// ============================================
// GLOBAL VARIABLES
// ============================================
let isLoggedIn = false;
let currentUser = null;
let toastTimeout;
let categorySwiper = null;
let globalCategories = []; // Store categories globally

// ============================================
// TOAST FUNCTIONS
// ============================================
function showToast(message, type = 'success') {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="margin-right: 8px;"></i> ${message}`;
    toast.className = `toast-notification ${type}`;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// FETCH CATEGORIES FROM DATABASE
// ============================================
async function fetchCategories() {
    try {
        const response = await fetch(`${CAT_API}?action=get_all`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            globalCategories = data.data; // Store globally
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

// ============================================
// FETCH POPULAR GIGS FROM DATABASE
// ============================================
async function fetchPopularGigs() {
    try {
        const response = await fetch(`${GIG_API}?action=public_gigs&limit=8`);
        const data = await response.json();
        
        console.log('Popular gigs:', data);
        
        if (data.success && data.data.length > 0) {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching gigs:', error);
        return [];
    }
}

// ============================================
// FETCH USER AVATAR FROM DATABASE
// ============================================
async function fetchUserAvatar() {
    try {
        const response = await fetch('/Taskly/php/getUser.php');
        const data = await response.json();
        
        console.log('Avatar data:', data);
        
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

// ============================================
// UPDATE UI WHEN USER IS LOGGED IN
// ============================================
function updateUIForLoggedInUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userNameSpan = document.getElementById('user-name');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const adminLink = document.getElementById('admin-link');
    
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userNameSpan && currentUser) {
        userNameSpan.textContent = currentUser.name;
    }
    
    if (userAvatarImg) {
        fetchUserAvatar();
    }
    
    if (adminLink && currentUser && currentUser.role === 'admin') {
        adminLink.style.display = 'inline-block';
    } else if (adminLink) {
        adminLink.style.display = 'none';
    }
}

// ============================================
// UPDATE UI WHEN USER IS LOGGED OUT
// ============================================
function updateUIForLoggedOutUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const adminLink = document.getElementById('admin-link');
    const userNameSpan = document.getElementById('user-name');
    const userAvatarImg = document.getElementById('user-avatar-img');
    
    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    if (adminLink) adminLink.style.display = 'none';
    if (userNameSpan) userNameSpan.textContent = '';
    if (userAvatarImg) {
        userAvatarImg.src = 'https://i.pravatar.cc/100?u=default';
    }
}

// ============================================
// FETCH USER DATA FROM SERVER
// ============================================
async function fetchUserData() {
    // 🔧 TEMPORARY: Skip real login check during development
    if (DEV_MODE) {
        isLoggedIn = true;
        currentUser = {
            name: 'Developer',
            email: 'dev@taskly.com',
            role: 'buyer',
            avatar: null
        };
        updateUIForLoggedInUser();
        return;
    }
    // 🔧 END OF TEMPORARY CODE - REMOVE ABOVE BLOCK WHEN LOGIN IS READY
    
    // ORIGINAL CODE (unchanged)
    try {
        const response = await fetch('/Taskly/php/getUser.php');
        const data = await response.json();
        
        if (data.loggedIn) {
            isLoggedIn = true;
            currentUser = {
                name: data.username,
                email: data.email,
                role: data.role,
                avatar: data.avatar
            };
            updateUIForLoggedInUser();
        } else {
            isLoggedIn = false;
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        updateUIForLoggedOutUser();
    }
}

async function checkAuthStatus() {
    await fetchUserData();
    await fetchUserAvatar();
}

// ============================================
// NAVIGATION
// ============================================
function goToOrders() {
    if (!isLoggedIn) {
        showToast('Please login to view your orders', 'error');
        openLoginModal();
        return;
    }
    window.location.href = 'pages/orders.html';
}

function goToProfile() {
    if (!isLoggedIn) {
        showToast('Please login to view your profile', 'error');
        openLoginModal();
        return;
    }
    window.location.href = 'pages/profile.html';
}

// ============================================
// CATEGORY SLIDER (Swiper) - FROM DATABASE
// ============================================
async function initCategorySlider() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="swiper-slide">
            <div class="category-item">
                <div class="category-icon" style="background: rgba(124,58,237,0.15); color: #a78bfa;">
                    <i class="fas fa-spinner fa-pulse"></i>
                </div>
                <span class="category-label">Loading...</span>
            </div>
        </div>
    `;

    const categories = await fetchCategories();
    
    if (categories.length === 0) {
        container.innerHTML = `
            <div class="swiper-slide">
                <div class="category-item">
                    <div class="category-icon" style="background: rgba(239,68,68,0.15); color: #f87171;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <span class="category-label">No categories</span>
                </div>
            </div>
        `;
    } else {
        // Default icons and colors for categories
        const defaultIcons = ['fa-palette', 'fa-code', 'fa-video', 'fa-pen', 'fa-bullhorn', 'fa-music'];
        const defaultColors = ['#a78bfa', '#60a5fa', '#f87171', '#4ade80', '#facc15', '#f472b6'];
        const defaultBgs = ['rgba(124,58,237,0.15)', 'rgba(59,130,246,0.15)', 'rgba(239,68,68,0.15)', 'rgba(34,197,94,0.15)', 'rgba(234,179,8,0.15)', 'rgba(236,72,153,0.15)'];
        
        container.innerHTML = categories.map((cat, index) => {
            const icon = cat.icon_url || defaultIcons[index % defaultIcons.length];
            const color = defaultColors[index % defaultColors.length];
            const bg = defaultBgs[index % defaultBgs.length];
            return `
                <div class="swiper-slide">
                    <div class="category-item" data-category-id="${cat.id}" data-category-name="${escapeHtml(cat.name)}">
                        <div class="category-icon" style="background: ${bg}; color: ${color};">
                            <i class="fas ${icon}"></i>
                        </div>
                        <span class="category-label">${escapeHtml(cat.name)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers to category items
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const categoryId = item.dataset.categoryId;
                const categoryName = item.dataset.categoryName;
                filterByCategory(categoryName, categoryId);
            });
        });
    }

    if (categorySwiper) categorySwiper.destroy(true, true);

    categorySwiper = new Swiper('.category-slider', {
        slidesPerView: 2,
        spaceBetween: 15,
        freeMode: true,
        mousewheel: true,
        navigation: {
            nextEl: '.swiper-button-next-custom',
            prevEl: '.swiper-button-prev-custom',
        },
        breakpoints: {
            480: { slidesPerView: 3, spaceBetween: 15 },
            640: { slidesPerView: 4, spaceBetween: 15 },
            768: { slidesPerView: 5, spaceBetween: 20 },
            1024: { slidesPerView: 6, spaceBetween: 20 },
        }
    });
}

function filterByCategory(categoryName, categoryId) {
    if (!isLoggedIn) {
        showToast('Please login to view gigs', 'error');
        openLoginModal();
        return;
    }
    
    // Use the categoryId passed from the click event
    window.location.href = `pages/gigs.html?category_id=${categoryId}`;
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    if (!searchTerm) {
        showToast('Please enter a search term', 'error');
        return;
    }

    if (!isLoggedIn) {
        showToast('Please login to search for gigs', 'error');
        openLoginModal();
        return;
    }

    window.location.href = `pages/gigs.html?search=${encodeURIComponent(searchTerm)}`;
}

function setupSearchEnterKey() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    }
}

// ============================================
// GIG RENDERING - FROM DATABASE
// ============================================
async function renderAvailableGigs() {
    const container = document.getElementById('gigs-main-container');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 60px;">
            <i class="fas fa-spinner fa-pulse" style="font-size: 2rem;"></i>
            <p>Loading gigs...</p>
        </div>
    `;

    const gigs = await fetchPopularGigs();

    if (gigs.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <i class="fas fa-folder-open" style="font-size: 2rem; opacity: 0.5;"></i>
                <p>No gigs available yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = gigs.map(gig => `
        <div class="gig-card" onclick="navigateToGigDetails(${gig.id})">
            <div class="gig-image-container">
                <img src="${gig.image || '/Taskly/images/default-gig.jpg'}" alt="${escapeHtml(gig.title)}" loading="lazy">
            </div>
            <div class="gig-body-content">
                <div class="gig-seller-info">
                    <img src="${gig.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(gig.freelancer || 'U') + '&background=7c3aed&color=fff'}" class="seller-avatar">
                    <span class="seller-name">${escapeHtml(gig.freelancer || 'Taskly Seller')}</span>
                </div>
                <span class="gig-category-badge">${escapeHtml(gig.category)}</span>
                <h3 class="gig-title-text">${escapeHtml(gig.title)}</h3>
                <div class="gig-footer-info">
                    <div class="rating-display">
                        <i class="fas fa-star"></i> ${gig.rating || 'New'}
                    </div>
                    <div>
                        <span class="price-label">Starting at</span>
                        <span class="price-value">$${gig.price}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function navigateToGigDetails(gigId) {
    if (!isLoggedIn) {
        showToast('Please login to view gig details', 'error');
        openLoginModal();
        return;
    }
    window.location.href = `pages/gig-details.html?id=${gigId}`;
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function openRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function selectBuyer() {
    closeRoleModal();
    openBuyerModal();
}

function selectSeller() {
    closeRoleModal();
    setTimeout(() => { window.location.href = 'pages/CreateSellerAccount.html'; }, 500);
}

function openBuyerModal() {
    const modal = document.getElementById('buyerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeBuyerModal() {
    const modal = document.getElementById('buyerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    const form = document.getElementById('buyerSignupForm');
    if (form) form.reset();
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    const form = document.getElementById('loginForm');
    if (form) form.reset();
}

function openTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function acceptTerms() {
    const termsCheckbox = document.getElementById('buyerTerms');
    if (termsCheckbox) {
        termsCheckbox.checked = true;
    }
    closeTermsModal();
    showToast('You have accepted the Terms and Conditions', 'success');
}

// ============================================
// LOGIN HANDLER
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    
    if (!email || !password) return showToast('Please fill in all fields', 'error');
    
    try {
        const response = await fetch('/Taskly/php/logIn.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, remember })
        });
        const data = await response.json();
        
        if (data.success) {
            isLoggedIn = true;
            currentUser = { name: data.username, email: data.email, role: data.role };
            updateUIForLoggedInUser();
            showToast(`Welcome back, ${data.username}!`, 'success');
            closeLoginModal();
            location.reload();
        } else {
            showToast(data.message || 'Invalid email or password', 'error');
        }
    } catch (error) {
        showToast('Login failed', 'error');
    }
}

// ============================================
// SIGNUP HANDLER
// ============================================
async function handleBuyerSignup(e) {
    e.preventDefault();
    const name = document.getElementById('buyerName').value;
    const email = document.getElementById('buyerEmail').value;
    const password = document.getElementById('buyerPassword').value;
    const confirm = document.getElementById('buyerConfirmPassword').value;
    const terms = document.getElementById('buyerTerms').checked;

    if (!name || !email || !password || !confirm) return showToast('Please fill in all fields', 'error');
    if (!email.includes('@')) return showToast('Valid email required', 'error');
    if (password.length < 6) return showToast('Password must be 6+ characters', 'error');
    if (password !== confirm) return showToast('Passwords do not match', 'error');
    if (!terms) return showToast('You must accept the Terms & Conditions', 'error');

    try {
        const response = await fetch('/Taskly/php/signup.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: name, 
                email: email, 
                password: password,
            })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(`Account created successfully! Please login.`, 'success');
            closeBuyerModal();
            setTimeout(() => openLoginModal(), 500);
        } else {
            showToast(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        showToast('Signup failed', 'error');
    }
}

// ============================================
// SETUP ENTER KEY FOR ALL FORMS
// ============================================
function setupEnterKeyForForms() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin(e);
            }
        });
    }

    const signupForm = document.getElementById('buyerSignupForm');
    if (signupForm) {
        signupForm.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleBuyerSignup(e);
            }
        });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================================
// INITIALIZATION
// ============================================
window.onclick = function (e) {
    if (e.target.classList.contains('modal-overlay')) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto';
    }
    if (e.target.classList.contains('terms-modal-overlay')) {
        closeTermsModal();
    }
};

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay, .terms-modal-overlay').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto';
    }
});

window.onload = async function () {
    await renderAvailableGigs();
    await initCategorySlider();
    await checkAuthStatus();
    setupSearchEnterKey();
    setupEnterKeyForForms();
    
    if (localStorage.getItem('triggerPopup') === 'true') {
        openLoginModal();
        localStorage.removeItem('triggerPopup');
    }

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = rememberedEmail;
    }
};