// ========================================
// ADMIN ORDER DETAILS - JAVASCRIPT
// ========================================

// زر العودة - يذهب إلى صفحة النزاعات
function goBackToDisputes() {
    window.history.back();
}

// الذهاب إلى صفحة البائع
function goToSellerProfile() {
    window.location.href = 'seller-profile.html?id=101';
}

// تحميل الملفات
function downloadFile(fileName, fileSize) {
    showToast(`Downloading ${fileName}...`);
    setTimeout(() => {
        showToast(`✓ ${fileName} downloaded!`);
    }, 800);
}

// إظهار الإشعارات
function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle" style="margin-right: 8px; color: #7c3aed;"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========================================
// TAB SWITCHING
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active from all buttons and panels
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            
            // Add active to current
            this.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
});