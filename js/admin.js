// ============================================
// ADMIN DASHBOARD - NON-USER FUNCTIONS ONLY
// ============================================

// ========== GLOBAL VARIABLES ==========
let currentMainCategory = null;
let currentSubcategory = null;
let selectedReport = null;
let pendingDeleteAction = null;
let reportsData = [];

// ========== CONFIRM MODAL ==========
function showConfirmModal(title, message, onConfirm) {
    pendingDeleteAction = onConfirm;
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;
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

// ========== REPORTS FUNCTIONS ==========
function renderReportsList() {
    const container = document.getElementById('reportsList');
    if (!reportsData.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-flag"></i><p>No reports</p></div>`;
        return;
    }
    container.innerHTML = reportsData.map(r => `
        <div class="report-item" onclick="selectReport(${r.id})" data-id="${r.id}">
            <div class="report-item-title">${escapeHtml(r.gigTitle)}</div>
            <div class="report-item-meta">Reported by: ${r.reportedBy}</div>
            <div class="report-item-meta">${r.date}</div>
            <span class="report-badge">Pending</span>
        </div>
    `).join('');
}

function selectReport(reportId) {
    selectedReport = reportsData.find(r => r.id === reportId);
    document.querySelectorAll('.report-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.report-item[data-id="${reportId}"]`).classList.add('active');
    
    document.getElementById('reportDetailsContent').innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Gig Title</div>
            <div class="detail-value">${escapeHtml(selectedReport.gigTitle)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Reported By</div>
            <div class="detail-value">${selectedReport.reportedBy}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date</div>
            <div class="detail-value">${selectedReport.date}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Reason</div>
            <div class="detail-value">${escapeHtml(selectedReport.reason)}</div>
        </div>
    `;
    document.getElementById('reportActions').style.display = 'flex';
}

function deleteSelectedReportedGig() {
    if (selectedReport) {
        showConfirmModal("Delete Gig", `Are you sure you want to delete "${selectedReport.gigTitle}"?`, () => {
            reportsData = reportsData.filter(r => r.id !== selectedReport.id);
            selectedReport = null;
            renderReportsList();
            document.getElementById('reportDetailsContent').innerHTML = `<div class="empty-details"><i class="fas fa-flag"></i><p>Select a report to view details</p></div>`;
            document.getElementById('reportActions').style.display = 'none';
            showToast("Gig deleted", "success");
        });
    }
}

function dismissSelectedReport() {
    if (selectedReport) {
        showConfirmModal("Dismiss Report", "Are you sure you want to dismiss this report?", () => {
            reportsData = reportsData.filter(r => r.id !== selectedReport.id);
            selectedReport = null;
            renderReportsList();
            document.getElementById('reportDetailsContent').innerHTML = `<div class="empty-details"><i class="fas fa-flag"></i><p>Select a report to view details</p></div>`;
            document.getElementById('reportActions').style.display = 'none';
            showToast("Report dismissed", "success");
        });
    }
}

function closeGigDetailsModal() {
    document.getElementById('gigDetailsModal').classList.remove('active');
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    fetchAdminAvatar();
    
    // Make the Users tab active by default and load sellers
    setTimeout(() => {
        if (typeof loadUsers === 'function') {
            loadUsers('sellers');
        }
    }, 100);
});