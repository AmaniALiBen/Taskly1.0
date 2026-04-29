// ============================================
// GIG DATA (Will be replaced by API)
// ============================================
const gig = {
    id: 1,
    title: "Elite Branding & Identity System",
    seller: "Vector Aura",
    sellerId: 101,  // Added seller ID for profile link
    sellerLevel: 3,
    gigRating: 4.9,
    gigReviewCount: 247,
    images: [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000",
        "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=1000",
        "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=1000",
        "https://images.unsplash.com/photo-1572044162444-ad60f128bde2?w=1000"
    ],
    desc: [
        "Looking for a world-class visual identity? I provide top-tier branding systems for tech startups and modern enterprises.",
        "My process involves deep research, moodboarding, and precision design to ensure your brand stands out."
    ],
    packages: {
        basic: {
            name: "Startup Foundation",
            price: 150,
            desc: "Perfect for early stage startups needing a professional starting point.",
            delivery: "3 Days Delivery",
            revisions: "2 Revisions",
            features: ["Professional Logo", "Color Palette", "High-Res PNG/JPG"]
        },
        standard: {
            name: "Business Growth",
            price: 350,
            desc: "A comprehensive branding kit for growing businesses looking to scale.",
            delivery: "5 Days Delivery",
            revisions: "5 Revisions",
            features: ["Everything in Basic", "Source Files (AI)", "Social Media Kit"]
        },
        premium: {
            name: "Enterprise Elite",
            price: 750,
            desc: "The ultimate identity solution including motion and full brand guidelines.",
            delivery: "10 Days Delivery",
            revisions: "Unlimited",
            features: ["Everything in Standard", "Brand Guidelines", "Motion Logo"]
        }
    }
};

let currentTab = "basic";
let toastTimeout;
let currentUser = null;

// ============================================
// AUTHENTICATION - Load user data
// ============================================
function loadUserData() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserAvatar();
    }
}

function updateUserAvatar() {
    const userAvatarImg = document.getElementById('user-avatar-img');
    if (userAvatarImg && currentUser && currentUser.avatar) {
        userAvatarImg.src = currentUser.avatar;
    }
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function goBack() {
    window.history.back();
}

function goToOrders() {
    window.location.href = 'orders.html';
}

function goToProfile() {
    window.location.href = 'profile.html';
}

// NEW FUNCTION: Go to Seller Profile
function goToSellerProfile() {
    window.location.href = `freelancer-profile.html?id=${gig.sellerId}`;
}

function goToCheckout() {
    const selectedPackage = gig.packages[currentTab];
    // Store selected package data in localStorage for checkout page
    const orderData = {
        gigId: gig.id,
        title: gig.title,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        seller: gig.seller,
        sellerId: gig.sellerId
    };
    localStorage.setItem('checkoutOrder', JSON.stringify(orderData));
    window.location.href = 'checkout.html';
}

// ============================================
// TOAST FUNCTION
// ============================================
function showToast(message) {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 8px; color: #10b981;"></i> ${message}`;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// RATING STARS
// ============================================
function getGigRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
    if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';
    return starsHtml;
}

// ============================================
// GALLERY FUNCTIONS
// ============================================
function initGallery() {
    const mainImg = document.getElementById("mainImage");
    const thumbContainer = document.getElementById("thumbnails");
    mainImg.src = gig.images[0];
    
    thumbContainer.innerHTML = gig.images.map((img, index) => `
        <img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="updateGallery(this, '${img}')" alt="Work Sample">
    `).join("");
}

function updateGallery(el, src) {
    const mainImg = document.getElementById("mainImage");
    mainImg.style.opacity = '0';
    setTimeout(() => { 
        mainImg.src = src; 
        mainImg.style.opacity = '1'; 
    }, 200);
    document.querySelectorAll(".thumbnail").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
}

// ============================================
// PACKAGE FUNCTIONS
// ============================================
function switchTab(t) {
    currentTab = t;
    document.querySelectorAll(".package-tab").forEach(x => x.classList.remove("active"));
    document.getElementById("tab-" + t).classList.add("active");
    render(currentTab);
}

function render(t) {
    const p = gig.packages[t];
    document.getElementById("pkgName").innerText = p.name;
    document.getElementById("pkgPrice").innerText = "$" + p.price;
    document.getElementById("pkgDesc").innerText = p.desc;
    document.getElementById("delivery").innerHTML = `<i class="far fa-clock"></i> ${p.delivery}`;
    document.getElementById("revisions").innerHTML = `<i class="fas fa-sync"></i> ${p.revisions}`;
    document.getElementById("features").innerHTML = p.features.map(f => `<div class="feature-item"><i class="fas fa-check"></i>${f}</div>`).join("");
}

function buy() {
    goToCheckout();
}

// ============================================
// REPORT MODAL FUNCTIONS
// ============================================
function openReportModal() {
    document.getElementById('reportModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.querySelectorAll('input[name="report-issue"]').forEach(radio => radio.checked = false);
}

function submitReport() {
    const selectedIssue = document.querySelector('input[name="report-issue"]:checked');
    if (!selectedIssue) { 
        showToast('Please select an issue type'); 
        return; 
    }
    const issueText = selectedIssue.nextElementSibling.innerText;
    showToast(`Gig reported: ${issueText}`);
    closeReportModal();
}

// ============================================
// GET GIG ID FROM URL
// ============================================
function getGigIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        // Here you would fetch the gig data from API using the ID
        console.log(`Loading gig with ID: ${id}`);
        // For now, using static data
    }
}

// ============================================
// LOAD PAGE DATA
// ============================================
function load() {
    getGigIdFromUrl();
    
    document.getElementById("title").innerText = gig.title;
    document.getElementById("seller").innerText = gig.seller;
    document.getElementById("avatar").src = "https://i.pravatar.cc/100?u=aura_vector";
    
    const ratingContainer = document.getElementById("gig-rating-container");
    ratingContainer.innerHTML = `
        <div class="gig-stars">${getGigRatingStars(gig.gigRating)}</div>
        <span class="gig-rating-value">${gig.gigRating}</span>
        <span class="gig-review-count">(${gig.gigReviewCount} reviews)</span>
    `;
    
    document.getElementById("desc").innerHTML = gig.desc.map(d => `<p style="margin-bottom:15px;">${d}</p>`).join("");
    
    const levelNames = {1: "New Seller", 2: "Professional", 3: "Expert"};
    document.getElementById("levelBadge").innerText = levelNames[gig.sellerLevel];
    
    initGallery();
    render(currentTab);
}

// ============================================
// INITIALIZATION
// ============================================
window.onclick = (e) => { 
    if (e.target === document.getElementById('reportModal')) closeReportModal(); 
};

document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') closeReportModal(); 
});

window.onload = () => {
    loadUserData();
    load();
};