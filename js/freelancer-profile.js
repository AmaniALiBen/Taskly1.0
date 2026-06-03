/**
 * Freelancer Profile Page JavaScript
 * Fetches real data from database using GigController
 */

const GIG_API = '/Taskly/controllers/GigController.php';
const USER_API = '/Taskly/controllers/UserController.php';

let sellerId = null;

// ── GET URL PARAMETERS ────────────────────────────────────────
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    sellerId = urlParams.get('id');
    return sellerId;
}

// ── FETCH SELLER PROFILE ──────────────────────────────────────
async function fetchSellerProfile() {
    try {
        // Try to get from GigController first (it has seller data from gigs)
        const response = await fetch(`${GIG_API}?action=seller_profile&seller_id=${sellerId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
        
        // Fallback: Get from UserController if available
        const userResponse = await fetch(`${USER_API}?action=get_seller&id=${sellerId}`);
        const userResult = await userResponse.json();
        
        if (userResult.success && userResult.data) {
            return userResult.data;
        }
        
        throw new Error('Seller not found');
    } catch (error) {
        console.error('Error fetching seller:', error);
        return null;
    }
}

// ── FETCH SELLER'S GIGS ───────────────────────────────────────
async function fetchSellerGigs() {
    try {
        const response = await fetch(`${GIG_API}?action=seller_gigs&seller_id=${sellerId}&limit=10`);
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching gigs:', error);
        return [];
    }
}

// ── LOAD PROFILE DATA ─────────────────────────────────────────
async function loadProfile() {
    const profile = await fetchSellerProfile();
    if (!profile) {
        showError('Seller not found');
        return;
    }
    
    // Basic info
    const nameEl = document.getElementById('freelancer-name');
    const countryEl = document.getElementById('freelancer-country');
    const bioEl = document.getElementById('freelancer-bio');
    const skillsEl = document.getElementById('freelancer-skills');
    const emailEl = document.getElementById('freelancer-email');
    const avatarEl = document.getElementById('profile-avatar');
    
    if (nameEl) nameEl.textContent = profile.name || 'Unknown Seller';
    if (countryEl) countryEl.textContent = profile.country_name || profile.country || 'Location not specified';
    if (bioEl) bioEl.textContent = profile.bio || profile.about_me || 'No bio available';
    if (skillsEl) skillsEl.textContent = profile.skills || profile.experience || 'No skills listed';
    if (emailEl) emailEl.textContent = profile.email || 'Email not available';
    
    // Avatar
    if (avatarEl) {
        if (profile.avatar && profile.avatar !== 'null' && profile.avatar !== '') {
            avatarEl.src = profile.avatar;
        } else if (profile.picture_name) {
            avatarEl.src = `/Taskly/uploads/avatars/${profile.picture_name}`;
        } else {
            avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=7c3aed&color=fff&size=135`;
        }
    }
    
    // Languages
    const languagesContainer = document.getElementById('freelancer-languages');
    if (languagesContainer) {
        const languages = profile.languages || [];
        if (languages.length === 0) {
            languagesContainer.innerHTML = '<div class="language-item">No languages specified</div>';
        } else {
            languagesContainer.innerHTML = '';
            languages.forEach(lang => {
                const langDiv = document.createElement('div');
                langDiv.className = 'language-item';
                langDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${typeof lang === 'string' ? lang : lang.name}`;
                languagesContainer.appendChild(langDiv);
            });
        }
    }
    
    // Level
    const levelEl = document.getElementById('freelancer-level');
    if (levelEl) {
        const levelMap = {
            'raising star': 'Raising Star',
            'top rated': 'Top Rated',
            'pro': 'Pro',
            1: 'Raising Star',
            2: 'Top Rated',
            3: 'Pro'
        };
        const level = profile.level || profile.seller_level || 'raising star';
        levelEl.innerHTML = `<i class="fas fa-crown"></i> ${levelMap[level] || 'Seller'}`;
    }
    
    // Rating stars
    const ratingContainer = document.getElementById('freelancer-rating');
    const ordersEl = document.getElementById('freelancer-orders');
    const rating = parseFloat(profile.rating || profile.gigRating || 0);
    const totalOrders = profile.total_orders || profile.totalOrders || 0;
    
    if (ratingContainer) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        ratingContainer.innerHTML = '';
        for (let i = 0; i < fullStars; i++) {
            ratingContainer.innerHTML += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            ratingContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            ratingContainer.innerHTML += '<i class="far fa-star"></i>';
        }
    }
    
    if (ordersEl) {
        ordersEl.textContent = `${rating.toFixed(1)} · ${totalOrders} orders`;
    }
}

// ── LOAD GIGS ─────────────────────────────────────────────────
async function loadGigs() {
    const container = document.getElementById('gigs-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Loading gigs...</div>';
    
    const gigs = await fetchSellerGigs();
    
    if (gigs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i> No gigs published yet</div>';
        return;
    }
    
    container.innerHTML = '';
    
    gigs.forEach(gig => {
        const gigCard = document.createElement('div');
        gigCard.className = 'gig-card';
        gigCard.onclick = () => window.location.href = `gig-details.html?id=${gig.id}`;
        
        gigCard.innerHTML = `
            <div class="gig-image-container">
                <img src="${gig.image || '/Taskly/images/default-gig.jpg'}" alt="${escapeHtml(gig.title)}" loading="lazy" onerror="this.src='/Taskly/images/default-gig.jpg'">
            </div>
            <div class="gig-body-content">
                <span class="gig-category-badge">${escapeHtml(gig.category)}</span>
                <h3 class="gig-title-text">${escapeHtml(gig.title)}</h3>
                <div class="gig-footer-info">
                    <span class="rating-display"><i class="fas fa-star"></i> ${gig.rating || 'New'}</span>
                    <span class="price-value-text">$${gig.price}</span>
                </div>
            </div>
        `;
        
        container.appendChild(gigCard);
    });
}

// ── ERROR STATE ───────────────────────────────────────────────
function showError(message) {
    const wrapper = document.getElementById('profile-wrapper');
    if (wrapper) {
        wrapper.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 60px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #ef4444;"></i>
                <h2>${escapeHtml(message)}</h2>
                <button onclick="goBack()" class="btn-buy" style="margin-top: 20px; padding: 12px 24px; background: #7c3aed; color: white; border: none; border-radius: 12px; cursor: pointer;">Go Back</button>
            </div>
        `;
    }
}

// ── HELPER FUNCTIONS ──────────────────────────────────────────
function escapeHtml(value) {
    if (!value) return '';
    return String(value).replace(/[&<>]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;'
    })[m]);
}

function goBack() {
    window.history.back();
}

// ── INITIALIZATION ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const id = getUrlParams();
    if (!id) {
        showError('No seller ID provided');
        return;
    }
    
    await loadProfile();
    await loadGigs();
});