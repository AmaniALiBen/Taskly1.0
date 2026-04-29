// ============================================
// DATA (Will be replaced by API calls)
// ============================================
const categoriesData = [
    { id: 1, name: "Design", icon: "fa-palette", color: "#a78bfa", bg: "rgba(124, 58, 237, 0.15)" },
    { id: 2, name: "Coding", icon: "fa-code", color: "#60a5fa", bg: "rgba(59, 130, 246, 0.15)" },
    { id: 3, name: "Video", icon: "fa-video", color: "#f87171", bg: "rgba(239, 68, 68, 0.15)" },
    { id: 4, name: "Writing", icon: "fa-pen", color: "#4ade80", bg: "rgba(34, 197, 94, 0.15)" },
    { id: 5, name: "Ads", icon: "fa-bullhorn", color: "#facc15", bg: "rgba(234, 179, 8, 0.15)" },
    { id: 6, name: "Music", icon: "fa-music", color: "#f472b6", bg: "rgba(236, 72, 153, 0.15)" }
];

const gigsList = [
    { id: 1, title: "Modern Luxury Brand Identity Design", price: 80, category: "Design", freelancer: "Ahmed B.", avatar: "https://i.pravatar.cc/100?u=1", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800", rating: 4.9 },
    { id: 2, title: "Full Stack Web Application Development", price: 350, category: "Coding", freelancer: "Sara M.", avatar: "https://i.pravatar.cc/100?u=2", image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800", rating: 5.0 },
    { id: 3, title: "Social Media Video Marketing Content", price: 120, category: "Video", freelancer: "Omar K.", avatar: "https://i.pravatar.cc/100?u=3", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800", rating: 4.8 },
    { id: 4, title: "Business Strategy & Growth Consulting", price: 150, category: "Ads", freelancer: "Layla T.", avatar: "https://i.pravatar.cc/100?u=4", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800", rating: 4.7 },
    { id: 5, title: "UI/UX Design for Mobile App", price: 200, category: "Design", freelancer: "Nadia R.", avatar: "https://i.pravatar.cc/100?u=5", image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800", rating: 4.9 },
    { id: 6, title: "Backend API Development", price: 400, category: "Coding", freelancer: "Khaled M.", avatar: "https://i.pravatar.cc/100?u=6", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800", rating: 4.8 }
];

// ============================================
// AUTHENTICATION STATE
// ============================================
let isLoggedIn = false;
let currentUser = null;
let toastTimeout;
let categorySwiper = null;

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
// AUTHENTICATION FUNCTIONS
// ============================================
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        isLoggedIn = true;
        currentUser = JSON.parse(userData);
        updateUIForLoggedInUser();
    } else {
        isLoggedIn = false;
        updateUIForLoggedOutUser();
    }
}

function updateUIForLoggedInUser() {
    document.getElementById('auth-buttons')?.classList.add('hidden');
    document.getElementById('user-menu')?.classList.remove('hidden');
    if (currentUser) {
        const userNameSpan = document.getElementById('user-name');
        if (userNameSpan) {
            userNameSpan.textContent = currentUser.name || currentUser.email.split('@')[0];
        }
        const userAvatarImg = document.getElementById('user-avatar-img');
        if (userAvatarImg && currentUser.avatar) {
            userAvatarImg.src = currentUser.avatar;
        }
    }
}

function updateUIForLoggedOutUser() {
    document.getElementById('auth-buttons')?.classList.remove('hidden');
    document.getElementById('user-menu')?.classList.add('hidden');
}

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
// CATEGORY SLIDER (Swiper)
// ============================================
function initCategorySlider() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    
    container.innerHTML = categoriesData.map(cat => `
        <div class="swiper-slide">
            <div class="category-item" data-category="${cat.name}" onclick="filterByCategory('${cat.name}')">
                <div class="category-icon" style="background: ${cat.bg}; color: ${cat.color};">
                    <i class="fas ${cat.icon}"></i>
                </div>
                <span class="category-label">${cat.name}</span>
            </div>
        </div>
    `).join('');

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

function filterByCategory(categoryName) {
    if (!isLoggedIn) {
        showToast('Please login to view gigs', 'error');
        openLoginModal();
        return;
    }
    window.location.href = `pages/gigs.html?category=${encodeURIComponent(categoryName)}`;
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

// Add Enter key support for search
function setupSearchEnterKey() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    }
}

// ============================================
// GIG RENDERING
// ============================================
function renderAvailableGigs() {
    const container = document.getElementById('gigs-main-container');
    if (!container) return;
    
    container.innerHTML = gigsList.map(gig => `
        <div class="gig-card" onclick="navigateToGigDetails(${gig.id})">
            <div class="gig-image-container">
                <img src="${gig.image}" alt="${gig.title}" loading="lazy">
            </div>
            <div class="gig-body-content">
                <div class="gig-seller-info">
                    <img src="${gig.avatar}" class="seller-avatar">
                    <span class="seller-name">${gig.freelancer}</span>
                </div>
                <span class="gig-category-badge">${gig.category}</span>
                <h3 class="gig-title-text">${gig.title}</h3>
                <div class="gig-footer-info">
                    <div class="rating-display">
                        <i class="fas fa-star"></i> ${gig.rating}
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
    showToast('Redirecting to seller registration page...', 'info');
    setTimeout(() => { window.location.href = 'pages/register-seller.html'; }, 500);
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
// AUTH HANDLERS
// ============================================
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe').checked;
    
    if (!email || !password) return showToast('Please fill in all fields', 'error');
    if (!email.includes('@')) return showToast('Valid email required', 'error');
    if (password.length < 6) return showToast('Password must be 6+ characters', 'error');
    
    // Simulate login - Replace with actual API call
    const mockUser = { name: email.split('@')[0], email: email, avatar: 'https://i.pravatar.cc/100?u=' + Date.now() };
    localStorage.setItem('authToken', 'mock-token-' + Date.now());
    localStorage.setItem('userData', JSON.stringify(mockUser));
    
    isLoggedIn = true;
    currentUser = mockUser;
    updateUIForLoggedInUser();
    
    showToast(`Welcome back, ${mockUser.name}!`, 'success');
    setTimeout(() => closeLoginModal(), 500);
}

function handleBuyerSignup(e) {
    e.preventDefault();
    const name = document.getElementById('buyerName').value;
    const email = document.getElementById('buyerEmail').value;
    const password = document.getElementById('buyerPassword').value;
    const confirm = document.getElementById('buyerConfirmPassword').value;
    const terms = document.getElementById('buyerTerms').checked;
    
    if (!name || !email || !password || !confirm) return showToast('Please fill in all fields', 'error');
    if (!email.includes('@')) return showToast('Valid email required', 'error');
    if (password.length < 8) return showToast('Password must be 8+ characters', 'error');
    if (password !== confirm) return showToast('Passwords do not match', 'error');
    if (!terms) return showToast('You must accept the Terms & Conditions', 'error');
    
    // Simulate signup - Replace with actual API call
    const mockUser = { name: name, email: email, avatar: 'https://i.pravatar.cc/100?u=' + Date.now() };
    localStorage.setItem('authToken', 'mock-token-' + Date.now());
    localStorage.setItem('userData', JSON.stringify(mockUser));
    
    isLoggedIn = true;
    currentUser = mockUser;
    updateUIForLoggedInUser();
    
    showToast(`Welcome to Taskly, ${name}!`, 'success');
    setTimeout(() => closeBuyerModal(), 500);
}

// ============================================
// SETUP ENTER KEY FOR ALL FORMS
// ============================================
function setupEnterKeyForForms() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin(e);
            }
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('buyerSignupForm');
    if (signupForm) {
        signupForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleBuyerSignup(e);
            }
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================
window.onclick = function(e) {
    // Close modals when clicking outside
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

window.onload = function() {
    renderAvailableGigs();
    initCategorySlider();
    checkAuthStatus();
    setupSearchEnterKey();
    setupEnterKeyForForms();
    
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = rememberedEmail;
    }
};