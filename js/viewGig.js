// ============================================
// ADMIN GIG VIEW - DATA
// ============================================

// Report data (passed from URL or from reports page)
let currentReport = {
    id: 1,
    gigId: 1001,
    reportedBy: "user@example.com",
    reportDate: "2024-01-15",
    reportReason: "Inappropriate content",
    reportDescription: "This gig contains offensive material that violates our terms of service."
};

// Gig data
let gig = {
    id: 1001,
    title: "Elite Branding & Identity System",
    seller: "Vector Aura",
    sellerId: 101,
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
let pendingDeleteId = null;

// ============================================
// GET DATA FROM URL
// ============================================
function getParamsFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const gigId = urlParams.get('gigId');
    const reportId = urlParams.get('reportId');
    
    if (gigId) {
        console.log(`Loading gig ID: ${gigId} from report ID: ${reportId}`);
        // Here you would fetch the actual gig and report data from API
        // For now, using static data
    }
}

// ============================================
// NAVIGATION
// ============================================
function goBack() {
    window.location.href = 'Admin.html?tab=reports';
    // window.history.back();
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
// GALLERY
// ============================================
function initGallery() {
    const mainImg = document.getElementById("mainImage");
    const thumbContainer = document.getElementById("thumbnails");
    if (!mainImg || !thumbContainer) return;
    
    mainImg.src = gig.images[0];
    
    thumbContainer.innerHTML = gig.images.map((img, index) => `
        <img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="updateGallery(this, '${img}')" alt="Work Sample">
    `).join("");
}

function updateGallery(el, src) {
    const mainImg = document.getElementById("mainImage");
    if (!mainImg) return;
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
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll(".package-tab").forEach(x => x.classList.remove("active"));
    const tabElement = document.getElementById("tab-" + tab);
    if (tabElement) tabElement.classList.add("active");
    renderPackage(currentTab);
}

function renderPackage(tab) {
    const p = gig.packages[tab];
    if (!p) return;
    
    const pkgName = document.getElementById("pkgName");
    const pkgPrice = document.getElementById("pkgPrice");
    const pkgDesc = document.getElementById("pkgDesc");
    const delivery = document.getElementById("delivery");
    const revisions = document.getElementById("revisions");
    const features = document.getElementById("features");
    
    if (pkgName) pkgName.innerText = p.name;
    if (pkgPrice) pkgPrice.innerText = "$" + p.price;
    if (pkgDesc) pkgDesc.innerText = p.desc;
    if (delivery) delivery.innerHTML = `<i class="far fa-clock"></i> ${p.delivery}`;
    if (revisions) revisions.innerHTML = `<i class="fas fa-sync"></i> ${p.revisions}`;
    if (features) {
        features.innerHTML = p.features.map(f => `<div class="feature-item"><i class="fas fa-check"></i>${f}</div>`).join("");
    }
}

// ============================================
// DELETE MODAL
// ============================================
function openDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function confirmDelete() {
    // Here you would call API to delete the gig
    console.log(`Deleting gig ID: ${gig.id} and report ID: ${currentReport.id}`);
    showNotification('Gig deleted successfully');
    
    setTimeout(() => {
        window.location.href = 'admin-dashboard.html?tab=reports';
    }, 1500);
}

// ============================================
// NOTIFICATION
// ============================================
function showNotification(message) {
    let toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--glass-card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-left: 3px solid #10b981;
            border-radius: 12px;
            padding: 12px 20px;
            color: white;
            font-size: 0.85rem;
            z-index: 10003;
            transform: translateX(450px);
            transition: 0.3s;
        `;
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 8px; color: #10b981;"></i> ${message}`;
    toast.style.transform = 'translateX(0)';
    setTimeout(() => {
        toast.style.transform = 'translateX(450px)';
    }, 3000);
}

// ============================================
// LOAD REPORT DATA INTO BANNER
// ============================================
function loadReportData() {
    const reportedBy = document.getElementById('reportedBy');
    const reportDate = document.getElementById('reportDate');
    const reportReason = document.getElementById('reportReason');
    const reportDesc = document.getElementById('reportDesc');
    
    if (reportedBy) reportedBy.innerText = currentReport.reportedBy;
    if (reportDate) reportDate.innerText = currentReport.reportDate;
    if (reportReason) reportReason.innerText = currentReport.reportReason;
    if (reportDesc) reportDesc.innerText = currentReport.reportDescription;
}

// ============================================
// LOAD GIG DATA
// ============================================
function loadGigData() {
    const title = document.getElementById("title");
    const seller = document.getElementById("seller");
    const avatar = document.getElementById("avatar");
    const ratingContainer = document.getElementById("gig-rating-container");
    const desc = document.getElementById("desc");
    const levelBadge = document.getElementById("levelBadge");
    
    if (title) title.innerText = gig.title;
    if (seller) seller.innerText = gig.seller;
    if (avatar) avatar.src = "https://i.pravatar.cc/100?u=aura_vector";
    if (levelBadge) {
        const levelNames = {1: "New Seller", 2: "Professional", 3: "Expert"};
        levelBadge.innerText = levelNames[gig.sellerLevel] || "Seller";
    }
    
    if (ratingContainer) {
        ratingContainer.innerHTML = `
            <div class="gig-stars">${getGigRatingStars(gig.gigRating)}</div>
            <span class="gig-rating-value">${gig.gigRating}</span>
            <span class="gig-review-count">(${gig.gigReviewCount} reviews)</span>
        `;
    }
    
    if (desc) {
        desc.innerHTML = gig.desc.map(d => `<p>${d}</p>`).join("");
    }
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
    getParamsFromUrl();
    loadReportData();
    loadGigData();
    initGallery();
    renderPackage(currentTab);
    
    // Close modal when clicking outside
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeDeleteModal();
        };
    }
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDeleteModal();
    });
}

document.addEventListener('DOMContentLoaded', init);