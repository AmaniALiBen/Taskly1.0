// ============================================
// GIG DETAILS PAGE
// ============================================

const GIG_API = '/Taskly/controllers/GigController.php';

let gig         = null;
let currentTab  = 'basic';
let toastTimeout;
let currentUser = null;

// ── INITIALIZATION ────────────────────────────────────────────
window.onload = () => {
    fetchUserData();
    fetchGigDetails();
};

async function fetchUserData() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php', {
            cache: 'no-cache',
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.loggedIn) {
            currentUser = {
                name:   data.username,
                email:  data.email,
                role:   data.role,
                avatar: data.avatar
            };

            const avatarImg = document.getElementById('user-avatar-img');
            if (avatarImg) {
                avatarImg.src = (data.avatar && data.avatar !== 'null')
                    ? data.avatar + '?t=' + Date.now()
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=7c3aed&color=fff&size=100`;
            }
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

// ── FETCH GIG FROM DB ─────────────────────────────────────────
async function fetchGigDetails() {
    const gigId = new URLSearchParams(window.location.search).get('id');

    if (!gigId) {
        showGigError('Missing gig ID');
        return;
    }

    try {
        const response = await fetch(`${GIG_API}?action=get_gig_details&id=${gigId}`);
        const result   = await response.json();

        if (!result.success) throw new Error(result.message || 'Gig not found');

        gig = result.data;
        loadPage();
    } catch (error) {
        console.error('Error loading gig:', error);
        showGigError('Could not load this gig');
    }
}

// ── LOAD ALL PAGE DATA ────────────────────────────────────────
function loadPage() {
    if (!gig) return;

    document.getElementById('title').innerText = gig.title;
    document.getElementById('seller').innerText = gig.seller;
    document.getElementById('avatar').src = gig.avatar;
        
    const levelNames = { 1: 'New Seller', 2: 'Professional', 3: 'Expert' };
    document.getElementById('levelBadge').innerText = levelNames[gig.sellerLevel] || 'Seller';

    document.getElementById('gig-rating-container').innerHTML = `
        <div class="gig-stars">${getGigRatingStars(gig.gigRating)}</div>
        <span class="gig-rating-value">${Number(gig.gigRating || 0).toFixed(1)}</span>
        <span class="gig-review-count">(${Number(gig.gigReviewCount || 0)} reviews)</span>
    `;

    document.getElementById('desc').innerHTML = gig.desc
        ? `<p style="margin-bottom:15px;">${escapeHtml(gig.desc)}</p>`
        : '<p>No description available.</p>';

    initGallery();

    const availableTabs = ['basic', 'standard', 'premium'].filter(t => gig.packages && gig.packages[t]);
    if (availableTabs.length === 0) {
        showGigError('This gig has no packages yet');
        return;
    }

    ['basic', 'standard', 'premium'].forEach(type => {
        const tab = document.getElementById(`tab-${type}`);
        if (tab) tab.style.display = availableTabs.includes(type) ? '' : 'none';
    });

    currentTab = availableTabs.includes(currentTab) ? currentTab : availableTabs[0];
    switchTab(currentTab);
}

// ── GALLERY ───────────────────────────────────────────────────
function initGallery() {
    const mainImg      = document.getElementById('mainImage');
    const thumbContainer = document.getElementById('thumbnails');
    const images       = Array.isArray(gig.images) && gig.images.length
        ? gig.images
        : ['/Taskly/images/default-gig.jpg'];

    mainImg.src = images[0];

    thumbContainer.innerHTML = images.map((img, index) => `
        <img src="${escapeHtml(img)}"
             class="thumbnail ${index === 0 ? 'active' : ''}"
             onclick="updateGallery(this, '${escapeHtml(img)}')"
             alt="Work Sample">
    `).join('');
}

function updateGallery(el, src) {
    const mainImg = document.getElementById('mainImage');
    mainImg.style.opacity = '0';
    setTimeout(() => {
        mainImg.src = src;
        mainImg.style.opacity = '1';
    }, 200);
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
}

// ── PACKAGE TABS ──────────────────────────────────────────────
function switchTab(t) {
    if (!gig || !gig.packages || !gig.packages[t]) return;
    currentTab = t;
    document.querySelectorAll('.package-tab').forEach(x => x.classList.remove('active'));
    document.getElementById('tab-' + t).classList.add('active');
    renderPackage(t);
}

function renderPackage(t) {
    const p = gig.packages[t];

    document.getElementById('pkgName').innerText  = p.name;
    document.getElementById('pkgPrice').innerText = '$' + Number(p.price || 0).toFixed(2);
    document.getElementById('pkgDesc').innerText  = p.desc || '';
    document.getElementById('delivery').innerHTML  = `<i class="far fa-clock"></i> ${escapeHtml(p.delivery)}`;
    document.getElementById('revisions').innerHTML = `<i class="fas fa-sync"></i> ${escapeHtml(p.revisions)}`;

    const features = Array.isArray(p.features) ? p.features : [];
    document.getElementById('features').innerHTML = features.length
        ? features.map(f => `<div class="feature-item"><i class="fas fa-check"></i>${escapeHtml(f)}</div>`).join('')
        : '<div class="feature-item"><i class="fas fa-check"></i>Package details included</div>';
}

// ── BUY BUTTON ────────────────────────────────────────────────
function buy() {
    if (!gig || !gig.packages || !gig.packages[currentTab]) return;

    const selectedPackage = gig.packages[currentTab];
    
    let gigImage = '';
    if (gig.images && gig.images.length > 0) {
        gigImage = gig.images[0];
    } else {
        gigImage = '/Taskly/images/default-gig.jpg';
    }
    
    let deliveryText = '';
    if (selectedPackage.delivery) {
        deliveryText = selectedPackage.delivery;
    } else if (selectedPackage.delivery_time_days) {
        const days = parseInt(selectedPackage.delivery_time_days);
        deliveryText = `${days} Day${days > 1 ? 's' : ''} Delivery`;
    } else {
        deliveryText = 'Standard Delivery';
    }
    
    let revisionsText = '';
    if (selectedPackage.revisions) {
        revisionsText = selectedPackage.revisions;
    } else if (selectedPackage.revisions_allowed !== undefined) {
        const revs = parseInt(selectedPackage.revisions_allowed);
        if (revs === 999 || revs === 0) {
            revisionsText = 'Unlimited Revisions';
        } else {
            revisionsText = `${revs} Revision${revs > 1 ? 's' : ''}`;
        }
    } else {
        revisionsText = '2 Revisions';
    }
    
    const features = Array.isArray(selectedPackage.features) ? selectedPackage.features : [];
    
    const orderData = {
        gigId:       gig.id,
        packageId:   selectedPackage.id,
        title:       gig.title,
        packageName: selectedPackage.name,
        price:       parseFloat(selectedPackage.price),
        seller:      gig.seller,
        sellerId:    gig.sellerId,
        image:       gigImage,
        delivery:    deliveryText,
        revisions:   revisionsText,
        features:    features
    };

    console.log('Order data saved:', orderData);
    localStorage.setItem('checkoutOrder', JSON.stringify(orderData));
    window.location.href = 'checkout.html';
}

// ── REPORT MODAL ──────────────────────────────────────────────
function openReportModal() {
    document.getElementById('reportModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.querySelectorAll('input[name="report-issue"]').forEach(r => r.checked = false);
}

async function submitReport() {
    const selected = document.querySelector('input[name="report-issue"]:checked');

    if (!selected) {
        showToast('Please select an issue type', 'error');
        return;
    }

    const reasonMap = {
        'prohibited':   'Prohibited service',
        'inappropriate':'Inappropriate content',
        'non-original': 'Non-original elements',
        'copyright':    'Intellectual property violation'
    };

    const reason = reasonMap[selected.value] || selected.value;

    try {
        const form = new FormData();
        form.append('gig_id', gig.id);
        form.append('reason', reason);

        const response = await fetch(`${GIG_API}?action=report`, {
            method: 'POST',
            body:   form
        });
        const result = await response.json();

        if (result.success) {
            showToast('Report submitted. Thank you!', 'success');
            closeReportModal();
        } else {
            showToast(result.message || 'Failed to submit report', 'error');
        }
    } catch (err) {
        console.error('Report error:', err);
        showToast('Connection error', 'error');
    }
}

// ── RATING STARS ──────────────────────────────────────────────
function getGigRatingStars(rating) {
    const safeRating = Number(rating || 0);
    const fullStars  = Math.floor(safeRating);
    const hasHalf    = safeRating % 1 >= 0.5;
    let html = '';
    for (let i = 0; i < fullStars; i++)      html += '<i class="fas fa-star"></i>';
    if (hasHalf)                              html += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < 5 - fullStars - (hasHalf ? 1 : 0); i++) html += '<i class="far fa-star"></i>';
    return html;
}

// ── ERROR STATE ───────────────────────────────────────────────
function showGigError(message) {
    const main = document.querySelector('main');
    if (main) main.innerHTML = `
        <div class="overview-card glass-card" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
            <h2 class="section-title">${escapeHtml(message)}</h2>
            <p class="description-text">Please go back and choose another gig.</p>
            <button onclick="goBack()" class="btn-buy" style="margin-top: 20px; width: auto; padding: 14px 30px;">
                Go Back
            </button>
        </div>
    `;
}

// ── NAVIGATION ────────────────────────────────────────────────
function goBack()            { window.history.back(); }
function goToOrders()        { window.location.href = 'orders.html'; }
function goToProfile()       { window.location.href = 'profile.html'; }
function goToSellerProfile() {
    if (!gig) return;
    window.location.href = `freelancer-profile.html?id=${gig.sellerId}`;
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(message, type = 'success') {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    if (toastTimeout) clearTimeout(toastTimeout);
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const color = type === 'success' ? '#10b981' : '#ef4444';
    toast.innerHTML = `<i class="fas ${icon}" style="margin-right:8px;color:${color};"></i>${escapeHtml(message)}`;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── HELPERS ───────────────────────────────────────────────────
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
}

window.onclick = (e) => {
    if (e.target === document.getElementById('reportModal')) closeReportModal();
};
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReportModal();
});