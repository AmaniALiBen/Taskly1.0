// ============================================
// ADMIN DASHBOARD - CLEAN VERSION
// ============================================

// ========== GLOBAL VARIABLES ==========
let currentMainCategory = null;
let currentSubcategory = null;
// let selectedReport = null;
let pendingDeleteAction = null;

// ========== CONFIRM MODAL ==========
function showConfirmModal(title, message, onConfirm, confirmText = 'Confirm') {
    pendingDeleteAction = onConfirm;
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;
    const confirmBtn = document.getElementById('confirmModalConfirmBtn');
    if (confirmBtn) confirmBtn.innerText = confirmText;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    pendingDeleteAction = null;
}

function confirmDelete() {
    if (pendingDeleteAction) {
        pendingDeleteAction();
        closeConfirmModal();
    }
}

// ========== TAB SWITCHING ==========
function switchTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    
    if (tabName === 'users') {
        if (typeof loadUsers === 'function') loadUsers('sellers');
    }
    if (tabName === 'reports') {
        if (typeof loadReports === 'function') loadReports();
    }
}

// ========== TOAST ==========
function showToast(msg, type) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== HELPERS ==========
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;'
    })[m]);
}

// ========== FETCH ADMIN AVATAR ==========
async function fetchAdminAvatar() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        
        if (data.loggedIn) {
            const navAvatar = document.querySelector('.nav-avatar-circle');
            if (navAvatar) {
                if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                    navAvatar.style.backgroundImage = `url('${data.avatar}')`;
                    navAvatar.style.backgroundSize = 'cover';
                    navAvatar.style.backgroundPosition = 'center';
                    navAvatar.innerText = '';
                } else {
                    navAvatar.style.backgroundImage = 'none';
                    navAvatar.style.backgroundColor = '#8b5cf6';
                    navAvatar.style.display = 'flex';
                    navAvatar.style.alignItems = 'center';
                    navAvatar.style.justifyContent = 'center';
                    navAvatar.innerText = data.username.charAt(0).toUpperCase();
                }
            }
        }
    } catch (error) {
        console.error('Error fetching admin avatar:', error);
    }
}

// ========== CLOSE GIG DETAILS MODAL ==========
function closeGigDetailsModal() {
    const modal = document.getElementById('gigDetailsModal');
    if (modal) modal.classList.remove('active');
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    fetchAdminAvatar();
    
    setTimeout(() => {
        if (typeof loadUsers === 'function') {
            loadUsers('sellers');
        }
    }, 100);
});// ── Add to admin.js ───────────────────────────────────────────

// Toggle avatar dropdown
function toggleAdminMenu() {
    const dropdown = document.getElementById('adminDropdown');
    if (!dropdown) return;
    dropdown.classList.toggle('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const wrapper  = document.querySelector('.admin-avatar-wrapper');
    const dropdown = document.getElementById('adminDropdown');
    if (!wrapper || !dropdown) return;

    if (!wrapper.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});

// Logout — clears session and redirects to homepage
async function adminLogout() {
    try {
        await fetch('/Taskly/controllers/logout.php', {
            method:      'POST',
            credentials: 'same-origin'
        });
    } catch (err) {
        console.error('Logout error:', err);
    }

    // Clear any localStorage just in case
    localStorage.clear();

    // Delete all cookies
    document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });

    // Redirect to homepage
    window.location.href = '/Taskly/index.html';
}