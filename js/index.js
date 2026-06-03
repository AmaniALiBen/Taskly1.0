// js/index.js

// ============================================
// API ENDPOINTS
// ============================================
const CAT_API = '/Taskly/controllers/CategoryController.php';
const GIG_API = '/Taskly/controllers/GigController.php';



// ============================================
// AUTHENTICATION STATE GLOBAL VARIABLES
// ============================================
let isLoggedIn = false;
let currentUser = null;
let categorySwiper = null;

function getBasePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
}



// ============================================
// GLOBAL VARIABLES
// ============================================
let toastTimeout;
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
    
    // ✅ أضف هذا السطر - لإزالة أي كلاس قديم
    toast.classList.remove('show', 'hide');
    
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="margin-right: 8px;"></i> ${message}`;
    toast.className = `toast-notification ${type}`;
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        // ✅ أضف هذا السطر - لإضافة كلاس الاختفاء
        toast.classList.add('hide');
    }, 3000);
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
// FETCH USER DATA FROM SERVER ON LOAD
// ============================================
async function fetchUserData() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php', { cache: 'no-cache', credentials: 'same-origin' });
        const data = await response.json();

        if (data.loggedIn) {
            isLoggedIn = true;
            currentUser = {
                name: data.username,
                email: data.email,
                role: data.role,
                id: data.user_id,
                avatar: data.avatar
            };
            return data;
        }

        isLoggedIn = false;
        currentUser = null;
        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        isLoggedIn = false;
        currentUser = null;
        return null;
    }
}

async function checkAuthStatus() {
    const data = await fetchUserData();
    if (data && data.loggedIn) {
        updateUIForLoggedInUser();
    } else {
        updateUIForLoggedOutUser();
    }
}

// ============================================
// UPDATE UI INTERFACES FOR AUTH STATE
// ============================================
function updateUIForLoggedInUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const adminLink = document.getElementById('admin-link');

    // أولاً: أظهر القائمة وأخفِ أزرار Auth
    if (authButtons) authButtons.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');

    // ثانياً: حدّث الصورة بعد ما العنصر صار ظاهر في DOM
    fetchUserAvatar();

    if (adminLink) {
        adminLink.style.display = (currentUser && currentUser.role === 'admin') ? 'inline-block' : 'none';
    }
}

function updateUIForLoggedOutUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const adminLink = document.getElementById('admin-link');
    const userAvatarImg = document.getElementById('user-avatar-img');

    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
    if (adminLink) adminLink.style.display = 'none';
    if (userAvatarImg) userAvatarImg.src = 'https://i.pravatar.cc/100?u=default';

    hideDropdown();
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
    window.location.href = getBasePath() + (window.location.pathname.includes('/pages/') ? 'orders.html' : 'pages/orders.html');
}

function goToProfile() {
    if (!isLoggedIn) {
        showToast('Please login to view your profile', 'error');
        openLoginModal();
        return;
    }
    window.location.href = getBasePath() + (window.location.pathname.includes('/pages/') ? 'profile.html' : 'pages/profile.html');
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
// SEARCH
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

    window.location.href = getBasePath() + (window.location.pathname.includes('/pages/') ? `gigs.html?search=${encodeURIComponent(searchTerm)}` : `pages/gigs.html?search=${encodeURIComponent(searchTerm)}`);
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
                    <img src="${gig.avatar || 'fallback-url'}" class="seller-avatar">
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
    window.location.href = getBasePath() + (window.location.pathname.includes('/pages/') ? `gig-details.html?id=${gigId}` : `pages/gig-details.html?id=${gigId}`);
}

// ============================================
// MODALS
// ============================================
function openRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeRoleModal() {
    const modal = document.getElementById('roleModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
}

function selectBuyer() {
    closeRoleModal();
    openBuyerModal();
}

function selectSeller() {
    closeRoleModal();
    setTimeout(() => {
        window.location.href = getBasePath() + (window.location.pathname.includes('/pages/') ? 'CreateSellerAccount.html' : 'pages/CreateSellerAccount.html');
    }, 500);
}

function openBuyerModal() {
    const modal = document.getElementById('buyerModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeBuyerModal() {
    const modal = document.getElementById('buyerModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    const form = document.getElementById('buyerSignupForm');
    if (form) form.reset();
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    const form = document.getElementById('loginForm');
    if (form) form.reset();
}

function openTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
}

function acceptTerms() {
    const termsCheckbox = document.getElementById('buyerTerms');
    if (termsCheckbox) termsCheckbox.checked = true;
    closeTermsModal();
    showToast('You have accepted the Terms and Conditions', 'success');
}

// ============================================
// BUYER AVATAR PREVIEW
// ============================================
function setupBuyerAvatarPreview() {
    const buyerProfilePic = document.getElementById('buyerProfilePic');
    const buyerAvatarPreview = document.getElementById('buyerAvatarPreview');

    if (buyerProfilePic && buyerAvatarPreview) {
        buyerProfilePic.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    buyerAvatarPreview.style.backgroundImage = `url(${event.target.result})`;
                    buyerAvatarPreview.style.backgroundSize = 'cover';
                    buyerAvatarPreview.style.backgroundPosition = 'center';
                    buyerAvatarPreview.innerHTML = '';
                };
                reader.readAsDataURL(file);
            } else {
                buyerAvatarPreview.innerHTML = '<i class="fas fa-camera" style="font-size: 24px; color: var(--primary-color);"></i>';
                buyerAvatarPreview.style.backgroundImage = 'none';
            }
        });
    }
}

// ============================================
// DROPDOWN MENU
// ============================================
function hideDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.remove('show-dropdown');
        dropdown.classList.add('hide-dropdown');
    }
}

function toggleUserMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        if (dropdown.classList.contains('hide-dropdown')) {
            dropdown.classList.remove('hide-dropdown');
            dropdown.classList.add('show-dropdown');
        } else {
            dropdown.classList.remove('show-dropdown');
            dropdown.classList.add('hide-dropdown');
        }
    }
}

document.addEventListener('click', function (e) {
    const dropdown = document.getElementById('user-dropdown');
    const avatar = document.querySelector('.user-avatar');
    if (dropdown && avatar) {
        if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show-dropdown');
            dropdown.classList.add('hide-dropdown');
        }
    }
});

// ============================================
// LOGOUT MODAL
// ============================================
function openLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = 'auto'; }
}

async function confirmLogout() {
    closeLogoutModal();

    try {
        await fetch('/Taskly/controllers/logout.php', {
            credentials: 'same-origin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.clear();
    document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    isLoggedIn = false;
    currentUser = null;

    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    if (authButtons) authButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');

    hideDropdown();
    showToast("Logged out successfully", "success");

    setTimeout(() => window.location.reload(), 1000);
}

function handleLogout() {
    openLogoutModal();
}

// ============================================
// LOGIN HANDLER
// ============================================
async function handleLogin(e) {
    if (e) e.preventDefault();

    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');
    const rememberEl = document.getElementById('rememberMe');

    if (!emailEl || !passwordEl) return;

    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const remember = rememberEl ? rememberEl.checked : false;

    if (!email || !password) return showToast('Please fill in all fields', 'error');

    try {
        const response = await fetch('/Taskly/controllers/login.php', {
            credentials: 'same-origin',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, remember })
        });
        const data = await response.json();

        if (data.success) {
            isLoggedIn = true;
            currentUser = {
                name: data.username,
                email: data.email,
                role: data.role,
                id: data.user_id
            };

            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('userName', data.username);

            if (remember) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            showToast(`Welcome back, ${data.username}!`, 'success');
            closeLoginModal();
            updateUIForLoggedInUser();

            setTimeout(() => {
                if (data.role === 'seller') {
                    window.location.href = '/Taskly/pages/sellerDashboard.html';
                } else if (data.role === 'admin') {
                    window.location.href = '/Taskly/pages/admin.php';
                } else {
                    window.location.reload();
                }
            }, 1000);
        } else {
            showToast(data.message || 'Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed', 'error');
    }
}

// ============================================
// BUYER SIGNUP HANDLER
// ============================================
async function handleBuyerSignup(e) {
    if (e) e.preventDefault();

    const nameEl = document.getElementById('buyerName');
    const emailEl = document.getElementById('buyerEmail');
    const passwordEl = document.getElementById('buyerPassword');
    const confirmEl = document.getElementById('buyerConfirmPassword');
    const termsEl = document.getElementById('buyerTerms');
    const profilePicEl = document.getElementById('buyerProfilePic');

    if (!nameEl || !emailEl || !passwordEl || !confirmEl) {
        showToast('Form error, please refresh the page', 'error');
        return;
    }

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const confirm = confirmEl.value;
    const terms = termsEl ? termsEl.checked : false;
    const profilePic = profilePicEl ? profilePicEl.files[0] : null;

    if (!name || !email || !password || !confirm) return showToast('Please fill in all fields', 'error');
    if (!email.includes('@') || !email.includes('.')) return showToast('Valid email required', 'error');
    if (password.length < 8) return showToast('Password must be 8+ characters', 'error');
    if (password !== confirm) return showToast('Passwords do not match', 'error');
    if (!terms) return showToast('You must accept the Terms & Conditions', 'error');

    const submitBtn = document.querySelector('#buyerSignupForm button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Register';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    }

    try {
        const formData = new FormData();
        formData.append('username', name);
        formData.append('email', email);
        formData.append('password', password);
        if (profilePic) formData.append('profilePic', profilePic);

        const response = await fetch('/Taskly/controllers/registerBuyer.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            showToast('Account created successfully! Please login.', 'success');

            nameEl.value = '';
            emailEl.value = '';
            passwordEl.value = '';
            confirmEl.value = '';
            if (termsEl) termsEl.checked = false;
            if (profilePicEl) profilePicEl.value = '';

            const preview = document.getElementById('buyerAvatarPreview');
            if (preview) {
                preview.innerHTML = '<i class="fas fa-camera" style="font-size: 24px; color: var(--primary-color);"></i>';
                preview.style.backgroundImage = 'none';
            }

            closeBuyerModal();
            setTimeout(() => openLoginModal(), 1000);
        } else {
            showToast(data.message || 'Signup failed. Please try again.', 'error');
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
// GLOBAL MODAL CLOSE HANDLERS
// ============================================
window.onclick = function (e) {
    if (e.target.classList.contains('modal-overlay')) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto';
    }
    if (e.target.classList.contains('terms-modal-overlay')) closeTermsModal();
    if (e.target.classList.contains('logout-modal-overlay')) closeLogoutModal();
};

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay, .terms-modal-overlay, .logout-modal-overlay').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = 'auto';
    }
});

// ============================================
// INITIALIZATION
// ============================================
window.onload = async function () {
    hideDropdown();
    await renderAvailableGigs();
    await initCategorySlider();
    await checkAuthStatus();
    setupSearchEnterKey();
    setupBuyerAvatarPreview();

    if (localStorage.getItem('triggerPopup') === 'true') {
        openLoginModal();
        localStorage.removeItem('triggerPopup');
    }

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = rememberedEmail;
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    const buyerForm = document.getElementById('buyerSignupForm');
    if (buyerForm) {
        buyerForm.removeAttribute('onsubmit');
        buyerForm.addEventListener('submit', handleBuyerSignup);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
};
