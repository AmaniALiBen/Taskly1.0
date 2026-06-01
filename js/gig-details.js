let gig = null;
let currentTab = "basic";
let toastTimeout;
let currentUser = null;

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

async function fetchUserData() {
    try {
        const response = await fetch('../php/getUser.php');
        const data = await response.json();

        if (data.loggedIn) {
            currentUser = {
                name: data.username,
                email: data.email,
                role: data.role,
                avatar: data.avatar
            };
            updateUserAvatar();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

async function fetchGigDetails() {
    const gigId = getGigIdFromUrl();

    if (!gigId) {
        showGigError('Missing gig ID');
        return;
    }

    try {
        const response = await fetch(`../php/get_gig.php?id=${encodeURIComponent(gigId)}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Gig not found');
        }

        gig = result.data;
        load();
    } catch (error) {
        console.error('Error loading gig:', error);
        showGigError('Could not load this gig');
    }
}

function updateUserAvatar() {
    const userAvatarImg = document.getElementById('user-avatar-img');
    if (userAvatarImg && currentUser && currentUser.avatar) {
        if (currentUser.avatar !== '' && currentUser.avatar !== 'null') {
            userAvatarImg.src = currentUser.avatar;
        } else {
            userAvatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=7c3aed&color=fff&size=100`;
        }
    }
}

function loadUserData() {
    fetchUserData();
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

function goToSellerProfile() {
    if (!gig) return;
    window.location.href = `freelancer-profile.html?id=${gig.sellerId}`;
}

function goToCheckout() {
    if (!gig || !gig.packages || !gig.packages[currentTab]) return;

    const selectedPackage = gig.packages[currentTab];
    const orderData = {
        gigId: gig.id,
        packageId: selectedPackage.id,
        title: gig.title,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        seller: gig.seller,
        sellerId: gig.sellerId
    };

    localStorage.setItem('checkoutOrder', JSON.stringify(orderData));
    window.location.href = 'checkout.html';
}

function showToast(message) {
    let toast = document.getElementById('custom-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'custom-toast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 8px; color: #10b981;"></i> ${escapeHtml(message)}`;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

function getGigRatingStars(rating) {
    const safeRating = Number(rating || 0);
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    let starsHtml = '';

    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
    if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';

    return starsHtml;
}

function initGallery() {
    const mainImg = document.getElementById("mainImage");
    const thumbContainer = document.getElementById("thumbnails");
    const images = Array.isArray(gig.images) && gig.images.length ? gig.images : ['../images/potato.png'];

    mainImg.src = images[0];

    thumbContainer.innerHTML = images.map((img, index) => `
        <img src="${escapeAttribute(img)}" class="thumbnail ${index === 0 ? 'active' : ''}" onclick="updateGallery(this, '${escapeAttribute(img)}')" alt="Work Sample">
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

function switchTab(t) {
    if (!gig || !gig.packages || !gig.packages[t]) return;

    currentTab = t;
    document.querySelectorAll(".package-tab").forEach(x => x.classList.remove("active"));
    document.getElementById("tab-" + t).classList.add("active");
    render(currentTab);
}

function render(t) {
    const p = gig.packages[t];

    document.getElementById("pkgName").innerText = p.name;
    document.getElementById("pkgPrice").innerText = "$" + Number(p.price || 0).toFixed(2);
    document.getElementById("pkgDesc").innerText = p.desc;
    document.getElementById("delivery").innerHTML = `<i class="far fa-clock"></i> ${escapeHtml(p.delivery)}`;
    document.getElementById("revisions").innerHTML = `<i class="fas fa-sync"></i> ${escapeHtml(p.revisions)}`;

    const features = Array.isArray(p.features) ? p.features : [];
    document.getElementById("features").innerHTML = features.length
        ? features.map(f => `<div class="feature-item"><i class="fas fa-check"></i>${escapeHtml(f)}</div>`).join("")
        : '<div class="feature-item"><i class="fas fa-check"></i>Package details included</div>';
}

function buy() {
    goToCheckout();
}

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

function getGigIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function load() {
    if (!gig) return;

    document.getElementById("title").innerText = gig.title;
    document.getElementById("seller").innerText = gig.seller;
    document.getElementById("avatar").src = gig.avatar || '../images/default-avatar.jpg';

    const ratingContainer = document.getElementById("gig-rating-container");
    ratingContainer.innerHTML = `
        <div class="gig-stars">${getGigRatingStars(gig.gigRating)}</div>
        <span class="gig-rating-value">${Number(gig.gigRating || 0).toFixed(1)}</span>
        <span class="gig-review-count">(${Number(gig.gigReviewCount || 0)} reviews)</span>
    `;

    const descriptions = Array.isArray(gig.desc) ? gig.desc : [gig.desc || 'No description available.'];
    document.getElementById("desc").innerHTML = descriptions.map(d => `<p style="margin-bottom:15px;">${escapeHtml(d)}</p>`).join("");

    const levelNames = { 1: "New Seller", 2: "Professional", 3: "Expert" };
    document.getElementById("levelBadge").innerText = levelNames[gig.sellerLevel] || "Seller";

    initGallery();

    const availableTabs = ['basic', 'standard', 'premium'].filter(type => gig.packages && gig.packages[type]);
    if (availableTabs.length === 0) {
        showGigError('This gig has no packages yet');
        return;
    }

    currentTab = availableTabs.includes(currentTab) ? currentTab : availableTabs[0];
    renderAvailablePackageTabs(availableTabs);
    switchTab(currentTab);
}

function renderAvailablePackageTabs(availableTabs) {
    ['basic', 'standard', 'premium'].forEach(type => {
        const tab = document.getElementById(`tab-${type}`);
        if (tab) {
            tab.style.display = availableTabs.includes(type) ? '' : 'none';
        }
    });
}

function showGigError(message) {
    const main = document.querySelector('main');
    if (!main) return;

    main.innerHTML = `
        <div class="overview-card glass-card" style="grid-column: 1 / -1; text-align: center;">
            <h2 class="section-title">${escapeHtml(message)}</h2>
            <p class="description-text">Please go back and choose another gig.</p>
        </div>
    `;
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

window.onclick = (e) => {
    if (e.target === document.getElementById('reportModal')) closeReportModal();
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeReportModal();
});

window.onload = () => {
    loadUserData();
    fetchUserAvatar();
    fetchGigDetails();
};
