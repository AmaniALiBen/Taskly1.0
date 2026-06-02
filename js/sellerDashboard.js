// ========================================
// SELLER DASHBOARD
// Handles: profile, wallet, languages, tabs, avatar
// Gig logic is in seller-gigs.js
// Orders logic is in seller-orders.js
// ========================================

let sellerData = {
    name: "",
    email: "",
    bio: "",
    skills: "",
    country: "",
    languages: [],
    avatar: null,
    balance: 0,
    pending: 0,
    totalEarned: 0,
    transactions: []
};

let currentWithdrawMethod = 'bank';

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameter to open specific tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    fetchUserData();
    updateStats();
    loadProfile();
    setupAvatarUpload();
    renderLanguages();
    setupMethodButtons();
    setupCharCounter();
    setupAutoResize();
    updateSidebarProfile();
    renderOrders();
    renderTransactions();
    loadGigs(); // defined in seller-gigs.js
    
    // Switch to gigs tab if parameter exists (increased timeout to ensure DOM is ready)
    if (tabParam === 'gigs') {
        setTimeout(() => {
            switchTab('gigs');
            // Remove the tab parameter from URL to avoid re-triggering on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 300);
    }
});

// ========================================
// FETCH USER DATA FROM DATABASE
// ========================================
async function fetchUserData() {
    try {
        const response = await fetch('/Taskly/php/getUser.php');
        const data = await response.json();

        console.log('User data:', data);

        if (data.loggedIn) {
            sellerData.name  = data.username;
            sellerData.email = data.email;

            const sidebarName  = document.getElementById('sidebarName');
            const profileEmail = document.getElementById('profileEmail');
            const profName     = document.getElementById('profName');
            const profEmail    = document.getElementById('profEmail');

            if (sidebarName)  sidebarName.innerText  = data.username;
            if (profileEmail) profileEmail.innerText  = data.email;
            if (profName)     profName.value           = data.username;
            if (profEmail)    profEmail.value           = data.email;

            const sidebarAvatar = document.getElementById('sidebarAvatar');
            const navAvatar     = document.querySelector('.nav-avatar-circle');
            const avatarPreview = document.getElementById('avatarPreview');

            if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                const imgUrl = data.avatar;
                [sidebarAvatar, navAvatar, avatarPreview].forEach(el => {
                    if (el) {
                        el.style.backgroundImage    = `url('${imgUrl}')`;
                        el.style.backgroundSize     = 'cover';
                        el.style.backgroundPosition = 'center';
                        el.innerText = '';
                    }
                });
            } else {
                const firstLetter = data.username.charAt(0).toUpperCase();
                [sidebarAvatar, navAvatar, avatarPreview].forEach(el => {
                    if (el) {
                        el.style.backgroundImage  = 'none';
                        el.style.backgroundColor  = '#8b5cf6';
                        el.style.display          = 'flex';
                        el.style.alignItems       = 'center';
                        el.style.justifyContent   = 'center';
                        el.innerText = firstLetter;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

// ========================================
// STATS
// ========================================
function updateStats() {
    const availableBalance = document.getElementById('availableBalance');
    const pendingBalance   = document.getElementById('pendingBalance');
    if (availableBalance) availableBalance.innerText = `$${sellerData.balance.toLocaleString()}`;
    if (pendingBalance)   pendingBalance.innerText   = `$${sellerData.pending.toLocaleString()}`;
}

function updateSidebarProfile() {
    const sidebarName   = document.getElementById('sidebarName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarName)   sidebarName.innerText   = sellerData.name;
    if (sidebarAvatar) sidebarAvatar.innerText = sellerData.name.charAt(0);
}

// ========================================
// PROFILE
// ========================================
function loadProfile() {
    const profName    = document.getElementById('profName');
    const profEmail   = document.getElementById('profEmail');
    const profBio     = document.getElementById('profBio');
    const profSkills  = document.getElementById('profSkills');
    const profCountry = document.getElementById('profCountry');

    if (profName)    profName.value    = sellerData.name;
    if (profEmail)   profEmail.value   = sellerData.email;
    if (profBio)     profBio.value     = sellerData.bio;
    if (profSkills)  profSkills.value  = sellerData.skills;
    if (profCountry) profCountry.value = sellerData.country;

    updateCharCounter();
    setTimeout(() => {
        if (profBio)    autoResize(profBio);
        if (profSkills) autoResize(profSkills);
    }, 100);
}

function saveProfile() {
    const profName    = document.getElementById('profName');
    const profBio     = document.getElementById('profBio');
    const profSkills  = document.getElementById('profSkills');
    const profCountry = document.getElementById('profCountry');

    if (profName)    sellerData.name    = profName.value;
    if (profBio)     sellerData.bio     = profBio.value;
    if (profSkills)  sellerData.skills  = profSkills.value;
    if (profCountry) sellerData.country = profCountry.value;

    updateSidebarProfile();
    showToast('Profile saved successfully', 'success');
}

function updatePassword() {
    const oldPass     = document.getElementById('oldPass');
    const newPass     = document.getElementById('newPass');
    const confirmPass = document.getElementById('confirmPass');

    if (!oldPass.value)                         return showToast('Current password is required', 'error');
    if (newPass.value.length < 6)               return showToast('Password must be at least 6 characters', 'error');
    if (newPass.value !== confirmPass.value)    return showToast('Passwords do not match', 'error');

    showToast('Password updated successfully', 'success');
    oldPass.value = '';
    newPass.value = '';
    confirmPass.value = '';
}

// ========================================
// CHAR COUNTER
// ========================================
function setupCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    if (bioTextarea) bioTextarea.addEventListener('input', updateCharCounter);
}

function updateCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    const counter     = document.getElementById('bioCounter');
    if (!bioTextarea || !counter) return;

    const length = bioTextarea.value.length;
    counter.innerText = `${length}/500`;
    counter.style.color = length > 480 ? '#ef4444' : length > 450 ? '#f59e0b' : '#6b7280';
}

// ========================================
// AUTO RESIZE
// ========================================
function setupAutoResize() {
    const bioTextarea    = document.getElementById('profBio');
    const skillsTextarea = document.getElementById('profSkills');
    if (bioTextarea)    bioTextarea.addEventListener('input',    function() { autoResize(this); });
    if (skillsTextarea) skillsTextarea.addEventListener('input', function() { autoResize(this); });
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
        container.innerHTML = '<span style="color:#6b7280;font-size:0.75rem;padding:8px;display:block;text-align:center;">No languages added</span>';
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
    const select   = document.getElementById('langSelect');
    const language = select.value;

    if (!language)                              return showToast('Please select a language', 'error');
    if (sellerData.languages.includes(language)) return showToast('Language already added', 'error');

    sellerData.languages.push(language);
    renderLanguages();
    select.value = '';
    showToast(`Added ${language}`, 'success');
}

function removeLanguage(language) {
    sellerData.languages = sellerData.languages.filter(l => l !== language);
    renderLanguages();
    showToast(`Removed ${language}`, 'success');
}

// ========================================
// WALLET & WITHDRAWAL
// ========================================
function setWithdrawMethod(method) {
    currentWithdrawMethod = method;
    const methodLabel = document.getElementById('methodLabel');
    if (methodLabel) {
        methodLabel.innerText = method === 'bank' ? 'IBAN / Account Number' : 'PayPal Email Address';
    }
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-method') === method);
    });
}

function setupMethodButtons() {
    document.querySelectorAll('.method-btn').forEach(btn => {
        if (btn.getAttribute('data-method') === 'bank') btn.classList.add('active');
    });
}

function requestWithdrawal() {
    const account     = document.getElementById('payoutAccount');
    const amountInput = document.getElementById('payoutAmount');

    if (!account.value) return showToast('Enter account details', 'error');

    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0)          return showToast('Enter valid amount', 'error');
    if (amount > sellerData.balance)     return showToast('Insufficient balance', 'error');

    sellerData.balance -= amount;
    sellerData.transactions.unshift({
        date:   new Date().toISOString().split('T')[0],
        amount: amount,
        type:   'withdrawal',
        status: 'pending'
    });

    updateStats();
    renderTransactions();
    amountInput.value = '';
    showToast(`$${amount} withdrawal requested`, 'success');
}

function renderTransactions() {
    const container = document.getElementById('transactionsList');
    if (!container) return;

    if (sellerData.transactions.length === 0) {
        container.innerHTML = '<div class="empty-message" style="padding:20px;text-align:center;">No transactions yet</div>';
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
// ORDERS
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
// TAB SWITCHING
// ========================================
function switchTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) selectedTab.classList.add('active');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    if (tabName === 'gigs') loadGigs(); // defined in seller-gigs.js
}

// ========================================
// AVATAR UPLOAD
// ========================================
function setupAvatarUpload() {
    const avatarInput   = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const navAvatar     = document.querySelector('.nav-avatar-circle');

    if (!avatarInput) return;

    avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target.result;
            [avatarPreview, sidebarAvatar, navAvatar].forEach(el => {
                if (el) {
                    el.style.backgroundImage    = `url(${url})`;
                    el.style.backgroundSize     = 'cover';
                    el.style.backgroundPosition = 'center';
                    el.innerText = '';
                }
            });
            showToast('Profile picture updated', 'success');
        };
        reader.readAsDataURL(file);
    };
}

// ========================================
// UTILITIES
// ========================================
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}