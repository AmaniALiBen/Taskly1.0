// ========================================
// SELLER DASHBOARD - CLEAN VERSION
// ========================================

let sellerData = {
    name: "Ahmed Ali",
    email: "ahmed@taskly.com",
    bio: "Software developer specialized in UI/UX and web interfaces. I have 5+ years of experience building modern web applications and working with international clients.",
    skills: "UI/UX Design, React.js, Node.js, Python, Tailwind CSS, Figma",
    country: "Libya",
    languages: ["English", "Arabic"],
    avatar: null,
    balance: 0,
    pending: 0,
    totalEarned: 0,
    gigs: [],
    orders: [],
    transactions: []
};

let currentWithdrawMethod = 'bank';

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    loadProfile();
    setupAvatarUpload();
    renderLanguages();
    setupMethodButtons();
    setupCharCounter();
    setupAutoResize();
    updateSidebarProfile();
    renderGigs();       // يعرض واجهة إدارة الخدمات
    renderOrders();     // يعرض واجهة الطلبات
    renderTransactions();
});

function updateStats() {
    const availableBalance = document.getElementById('availableBalance');
    const pendingBalance = document.getElementById('pendingBalance');
    if (availableBalance) availableBalance.innerText = `$${sellerData.balance.toLocaleString()}`;
    if (pendingBalance) pendingBalance.innerText = `$${sellerData.pending.toLocaleString()}`;
}

function updateSidebarProfile() {
    const sidebarName = document.getElementById('sidebarName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarName) sidebarName.innerText = sellerData.name;
    if (sidebarAvatar) sidebarAvatar.innerText = sellerData.name.charAt(0);
}

function loadProfile() {
    const profName = document.getElementById('profName');
    const profEmail = document.getElementById('profEmail');
    const profBio = document.getElementById('profBio');
    const profSkills = document.getElementById('profSkills');
    const profCountry = document.getElementById('profCountry');
    
    if (profName) profName.value = sellerData.name;
    if (profEmail) profEmail.value = sellerData.email;
    if (profBio) profBio.value = sellerData.bio;
    if (profSkills) profSkills.value = sellerData.skills;
    if (profCountry) profCountry.value = sellerData.country;
    
    updateCharCounter();
    setTimeout(() => {
        if (profBio) autoResize(profBio);
        if (profSkills) autoResize(profSkills);
    }, 100);
}

function saveProfile() {
    const profName = document.getElementById('profName');
    const profBio = document.getElementById('profBio');
    const profSkills = document.getElementById('profSkills');
    const profCountry = document.getElementById('profCountry');
    
    if (profName) sellerData.name = profName.value;
    if (profBio) sellerData.bio = profBio.value;
    if (profSkills) sellerData.skills = profSkills.value;
    if (profCountry) sellerData.country = profCountry.value;
    
    updateSidebarProfile();
    showToast("Profile saved successfully", "success");
}

function updatePassword() {
    const oldPass = document.getElementById('oldPass');
    const newPass = document.getElementById('newPass');
    const confirmPass = document.getElementById('confirmPass');
    
    if (!oldPass.value) return showToast("Current password is required", "error");
    if (newPass.value.length < 6) return showToast("Password must be at least 6 characters", "error");
    if (newPass.value !== confirmPass.value) return showToast("Passwords do not match", "error");
    
    showToast("Password updated successfully", "success");
    oldPass.value = "";
    newPass.value = "";
    confirmPass.value = "";
}

// ========================================
// CHAR COUNTER
// ========================================
function setupCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    if (bioTextarea) {
        bioTextarea.addEventListener('input', updateCharCounter);
    }
}

function updateCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    const counter = document.getElementById('bioCounter');
    if (bioTextarea && counter) {
        const length = bioTextarea.value.length;
        counter.innerText = `${length}/500`;
        
        if (length > 450) {
            counter.style.color = '#f59e0b';
        } else if (length > 480) {
            counter.style.color = '#ef4444';
        } else {
            counter.style.color = '#6b7280';
        }
    }
}

// ========================================
// AUTO RESIZE
// ========================================
function setupAutoResize() {
    const bioTextarea = document.getElementById('profBio');
    const skillsTextarea = document.getElementById('profSkills');
    
    if (bioTextarea) {
        bioTextarea.addEventListener('input', function() { autoResize(this); });
    }
    if (skillsTextarea) {
        skillsTextarea.addEventListener('input', function() { autoResize(this); });
    }
}

function autoResize(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
}

// ========================================
// LANGUAGES
// ========================================
function renderLanguages() {
    const container = document.getElementById('languagesContainer');
    if (!container) return;
    
    if (sellerData.languages.length === 0) {
        container.innerHTML = '<span style="color: #6b7280; font-size: 0.75rem; padding: 8px; display: block; text-align: center;">No languages added</span>';
        return;
    }
    
    container.innerHTML = sellerData.languages.map(lang => `
        <span class="lang-tag">
            ${escapeHtml(lang)}
            <span class="remove-lang" onclick="removeLanguage('${escapeHtml(lang)}')">&times;</span>
        </span>
    `).join('');
}

function addLanguage() {
    const select = document.getElementById('langSelect');
    const language = select.value;
    
    if (!language) {
        showToast("Please select a language", "error");
        return;
    }
    if (sellerData.languages.includes(language)) {
        showToast("Language already added", "error");
        return;
    }
    
    sellerData.languages.push(language);
    renderLanguages();
    select.value = "";
    showToast(`Added ${language}`, "success");
}

function removeLanguage(language) {
    sellerData.languages = sellerData.languages.filter(l => l !== language);
    renderLanguages();
    showToast(`Removed ${language}`, "success");
}

// ========================================
// WALLET & WITHDRAWAL
// ========================================
function setWithdrawMethod(method) {
    currentWithdrawMethod = method;
    const methodLabel = document.getElementById('methodLabel');
    if (methodLabel) {
        methodLabel.innerText = method === 'bank' ? "IBAN / Account Number" : "PayPal Email Address";
    }
    
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-method') === method) {
            btn.classList.add('active');
        }
    });
}

function setupMethodButtons() {
    document.querySelectorAll('.method-btn').forEach(btn => {
        if (btn.getAttribute('data-method') === 'bank') {
            btn.classList.add('active');
        }
    });
}

function requestWithdrawal() {
    const account = document.getElementById('payoutAccount');
    const amountInput = document.getElementById('payoutAmount');
    
    if (!account.value) return showToast("Enter account details", "error");
    
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) return showToast("Enter valid amount", "error");
    if (amount > sellerData.balance) return showToast("Insufficient balance", "error");
    
    sellerData.balance -= amount;
    sellerData.transactions.unshift({
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        type: "withdrawal",
        status: "pending"
    });
    
    updateStats();
    renderTransactions();
    amountInput.value = "";
    showToast(`$${amount} withdrawal requested`, "success");
}

function renderTransactions() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    if (sellerData.transactions.length === 0) {
        container.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center;">No transactions yet</div>';
        return;
    }
    
    container.innerHTML = sellerData.transactions.map(t => `
        <div class="transaction-item">
            <span class="transaction-date">${t.date}</span>
            <span class="transaction-amount ${t.type === 'earning' ? 'positive' : 'negative'}">
                ${t.type === 'earning' ? '+' : '-'}$${t.amount}
            </span>
            <span class="transaction-status">${t.status === 'completed' ? 'Completed' : 'Pending'}</span>
        </div>
    `).join('');
}

// ========================================
// GIGS MANAGEMENT - داخل نفس الصفحة
// ========================================
function renderGigs() {
    const container = document.getElementById('gigsGrid');
    if (!container) return;
    
    // يتم ملء هذا القسم بواسطة gigManage.js
    // لكن نعرض رسالة انتظار إذا لم يتم تحميل البيانات بعد
    if (typeof window.gigsData === 'undefined') {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-message">
                    <i class="fas fa-spinner fa-pulse"></i>
                    <p>Loading your gigs...</p>
                </div>
            </div>
        `;
    }
}

// دالة لتحديث إحصائيات الخدمات
function updateGigStats(activeCount, pausedCount) {
    const activeEl = document.getElementById('activeCount');
    const pausedEl = document.getElementById('pausedCount');
    if (activeEl) activeEl.innerText = activeCount;
    if (pausedEl) pausedEl.innerText = pausedCount;
}

// ========================================
// ORDERS MANAGEMENT
// ========================================
function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-message">
            <i class="fas fa-inbox"></i>
            <p>No orders yet</p>
            <span>When you receive orders, they'll appear here</span>
        </div>
    `;
}

// ========================================
// UI HELPERS
// ========================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) targetTab.classList.add('active');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    
    // تحديث عرض الخدمات عند الدخول للتبويب
    if (tabName === 'gigs' && typeof refreshGigsDisplay === 'function') {
        refreshGigsDisplay();
    }
}

function showAddGigModal() {
    window.location.href = 'createGig.html';
}

function showToast(message, type) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const navAvatar = document.querySelector('.nav-avatar-circle');
    
    if (!avatarInput) return;
    
    avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target.result;
                if (avatarPreview) {
                    avatarPreview.style.backgroundImage = `url(${url})`;
                    avatarPreview.style.backgroundSize = 'cover';
                    avatarPreview.style.backgroundPosition = 'center';
                    avatarPreview.innerText = '';
                }
                if (sidebarAvatar) {
                    sidebarAvatar.style.backgroundImage = `url(${url})`;
                    sidebarAvatar.style.backgroundSize = 'cover';
                    sidebarAvatar.innerText = '';
                }
                if (navAvatar) {
                    navAvatar.style.backgroundImage = `url(${url})`;
                    navAvatar.style.backgroundSize = 'cover';
                    navAvatar.innerText = '';
                }
                showToast("Profile picture updated", "success");
            };
            reader.readAsDataURL(file);
        }
    };
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
