// ========================================
// SELLER DASHBOARD - COMPLETE
// Handles: profile, wallet (with PIN), languages, tabs, avatar
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
let allLanguages = [];

// ========================================
// WALLET API ENDPOINT
// ========================================
const WALLET_API = '/Taskly/controllers/WalletController.php';

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    loadCountries();
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
    loadGigs();
    
    if (tabParam === 'gigs') {
        setTimeout(() => {
            switchTab('gigs');
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 300);
    }
});

// ========================================
// FETCH USER DATA FROM DATABASE
// ========================================
async function fetchUserData() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        
        console.log('User data from server:', data);
        
        if (data.loggedIn) {
            if (data.role !== 'seller') {
                window.location.href = '../index.html';
                return;
            }
            
            sellerData.name = data.username;
            sellerData.email = data.email;
            sellerData.role = data.role;
            
            const sidebarName = document.getElementById('sidebarName');
            const profileEmail = document.getElementById('profileEmail');
            const profName = document.getElementById('profName');
            const profEmail = document.getElementById('profEmail');
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            const navAvatar = document.querySelector('.nav-avatar-circle');
            const avatarPreview = document.getElementById('avatarPreview');
            
            if (sidebarName) sidebarName.innerText = data.username;
            if (profileEmail) profileEmail.innerText = data.email;
            if (profName) profName.value = data.username;
            if (profEmail) profEmail.value = data.email;
            
            if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                const imgUrl = data.avatar;
                [sidebarAvatar, navAvatar, avatarPreview].forEach(el => {
                    if (el) {
                        el.style.backgroundImage = `url('${imgUrl}')`;
                        el.style.backgroundSize = 'cover';
                        el.style.backgroundPosition = 'center';
                        el.innerText = '';
                    }
                });
            } else {
                const firstLetter = data.username.charAt(0).toUpperCase();
                if (sidebarAvatar) {
                    sidebarAvatar.style.backgroundImage = 'none';
                    sidebarAvatar.style.backgroundColor = '#8b5cf6';
                    sidebarAvatar.style.display = 'flex';
                    sidebarAvatar.style.alignItems = 'center';
                    sidebarAvatar.style.justifyContent = 'center';
                    sidebarAvatar.innerText = firstLetter;
                }
                if (navAvatar) {
                    navAvatar.style.backgroundImage = 'none';
                    navAvatar.style.backgroundColor = '#8b5cf6';
                    navAvatar.style.display = 'flex';
                    navAvatar.style.alignItems = 'center';
                    navAvatar.style.justifyContent = 'center';
                    navAvatar.innerText = firstLetter;
                }
                if (avatarPreview) {
                    avatarPreview.style.backgroundImage = 'none';
                    avatarPreview.style.backgroundColor = '#8b5cf6';
                    avatarPreview.style.display = 'flex';
                    avatarPreview.style.alignItems = 'center';
                    avatarPreview.style.justifyContent = 'center';
                    avatarPreview.innerText = firstLetter;
                }
            }
            
            if (data.seller_details) {
                const profBio = document.getElementById('profBio');
                const profSkills = document.getElementById('profSkills');
                const profCountry = document.getElementById('profCountry');
                
                if (profBio && data.seller_details.experience) {
                    profBio.value = data.seller_details.experience;
                }
                if (profSkills && data.seller_details.about_me) {
                    profSkills.value = data.seller_details.about_me;
                }
                if (profCountry && data.country) {
                    for (let i = 0; i < profCountry.options.length; i++) {
                        if (profCountry.options[i].text === data.country) {
                            profCountry.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
            
            if (data.languages && data.languages.length > 0) {
                sellerData.languages = data.languages.map(lang => lang.name);
                renderLanguages();
            }
            
            updateStats();
            loadWalletData();
        } else {
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

// ========================================
// STATS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCountries();
    fetchUserData();
    updateStats();
    loadProfile();
    setupAvatarUpload();
    renderLanguages();
    setupMethodButtons();
    setupCharCounter();
    setupAutoResize();
    updateSidebarProfile();
   
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

// ========================================
// PROFILE
// ========================================
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

async function saveProfile() {
    const name = document.getElementById('profName')?.value.trim();
    const summary = document.getElementById('profBio')?.value;
    const skills = document.getElementById('profSkills')?.value;
    const country = document.getElementById('profCountry')?.value;
    const avatarInput = document.getElementById('avatarInput');
    const avatarFile = avatarInput?.files[0];
    
    if (!name) {
        showToast('Name is required', 'error');
        return;
    }
    
    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn ? saveBtn.innerHTML : 'Save';
    
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }
    
    try {
        const formData = new FormData();
        formData.append('action', 'updateProfile');
        formData.append('name', name);
        formData.append('summary', summary);
        formData.append('skills', skills);
        formData.append('country', country);
        
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        
        const response = await fetch('http://localhost/Taskly/controllers/updateProfile.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Profile saved successfully!', 'success');
            
            const sidebarName = document.getElementById('sidebarName');
            if (sidebarName) sidebarName.innerText = name;
            
            if (data.avatar) {
                const sidebarAvatar = document.getElementById('sidebarAvatar');
                if (sidebarAvatar) {
                    sidebarAvatar.style.backgroundImage = `url('${data.avatar}')`;
                    sidebarAvatar.style.backgroundSize = 'cover';
                    sidebarAvatar.innerText = '';
                }
                const avatarPreview = document.getElementById('avatarPreview');
                if (avatarPreview) {
                    avatarPreview.style.backgroundImage = `url('${data.avatar}')`;
                    avatarPreview.style.backgroundSize = 'cover';
                    avatarPreview.innerText = '';
                }
                avatarInput.value = '';
            }
            
            setTimeout(() => fetchUserData(), 500);
        } else {
            showToast(data.message || 'Save failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error: ' + error.message, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
}

async function updatePassword() {
    const oldPass = document.getElementById('oldPass')?.value;
    const newPass = document.getElementById('newPass')?.value;
    const confirmPass = document.getElementById('confirmPass')?.value;
    
    if (!oldPass || !newPass || !confirmPass) {
        showToast("Please fill in all password fields", "error");
        return;
    }
    
    if (newPass.length < 8) {
        showToast("Password must be at least 8 characters", "error");
        return;
    }
    
    if (newPass !== confirmPass) {
        showToast("Passwords do not match", "error");
        return;
    }
    
    const updateBtn = document.querySelector('.btn-update');
    const originalText = updateBtn ? updateBtn.innerHTML : 'Update';
    
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    try {
        const response = await fetch('/Taskly/controllers/updateProfile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updatePassword',
                currentPassword: oldPass,
                newPassword: newPass
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast("Password updated successfully!", "success");
            document.getElementById('oldPass').value = '';
            document.getElementById('newPass').value = '';
            document.getElementById('confirmPass').value = '';
        } else {
            showToast(data.message || "Password update failed", "error");
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error: ' + error.message, 'error');
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        }
    }
}

// ========================================
// CHAR COUNTER & AUTO RESIZE
// ========================================
function setupCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    if (bioTextarea) bioTextarea.addEventListener('input', updateCharCounter);
}

function updateCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    const counter = document.getElementById('bioCounter');
    if (!bioTextarea || !counter) return;

    const length = bioTextarea.value.length;
    counter.innerText = `${length}/500`;
    counter.style.color = length > 480 ? '#ef4444' : length > 450 ? '#f59e0b' : '#6b7280';
}

function setupAutoResize() {
    const bioTextarea = document.getElementById('profBio');
    const skillsTextarea = document.getElementById('profSkills');
    if (bioTextarea) bioTextarea.addEventListener('input', function() { autoResize(this); });
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
    const select = document.getElementById('langSelect');
    const selectedOption = select.options[select.selectedIndex];
    const languageId = select.value;
    const languageName = selectedOption?.text;
    
    if (!languageId || !languageName || languageId === "") {
        showToast("Please select a language", "error");
        return;
    }
    
    if (sellerData.languages.includes(languageName)) {
        showToast("Language already added", "error");
        return;
    }
    
    sellerData.languages.push(languageName);
    renderLanguages();
    select.value = "";
    showToast(`Added ${languageName}`, "success");
    updateSellerLanguages();
}

function removeLanguage(language) {
    sellerData.languages = sellerData.languages.filter(l => l !== language);
    renderLanguages();
    showToast(`Removed ${language}`, "success");
    updateSellerLanguages();
}

async function updateSellerLanguages() {
    const languageIds = sellerData.languages.map(langName => {
        const found = allLanguages.find(l => l.name === langName);
        return found ? found.id : null;
    }).filter(id => id !== null);
    
    try {
        const response = await fetch('/Taskly/controllers/updateLanguages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ languages: languageIds })
        });
        
        const data = await response.json();
        if (!data.success) {
            showToast(data.message || 'Failed to update languages', 'error');
        }
    } catch (error) {
        console.error('Error updating languages:', error);
    }
}

// ========================================
// WALLET & PIN FUNCTIONS
// ========================================

async function loadWalletData() {
    try {
        const response = await fetch(`${WALLET_API}?action=get_data`);
        const data = await response.json();
        
        if (data.success) {
            sellerData.balance = data.balance;
            
            const balanceEl = document.getElementById('availableBalance');
            if (balanceEl) balanceEl.innerText = `$${data.balance.toFixed(2)}`;
            
            const noPinScreen = document.getElementById('noPinScreen');
            const walletNormalScreen = document.getElementById('walletNormalScreen');
            
            if (data.has_pin) {
                if (noPinScreen) noPinScreen.style.display = 'none';
                if (walletNormalScreen) walletNormalScreen.style.display = 'block';
            } else {
                if (noPinScreen) noPinScreen.style.display = 'block';
                if (walletNormalScreen) walletNormalScreen.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading wallet:', error);
    }
}

function openPinModal() {
    fetch(`${WALLET_API}?action=get_data`)
        .then(res => res.json())
        .then(data => {
            const title = document.getElementById('pinModalTitle');
            const desc = document.getElementById('pinModalDesc');
            const currentPinGroup = document.getElementById('currentPinGroup');
            const saveBtn = document.getElementById('savePinBtn');
            
            if (data.has_pin) {
                title.innerHTML = 'Change Wallet <span>PIN</span>';
                desc.innerText = 'Enter your current PIN and choose a new one';
                currentPinGroup.style.display = 'block';
                saveBtn.innerText = 'Change PIN';
            } else {
                title.innerHTML = 'Set Wallet <span>PIN</span>';
                desc.innerText = 'Create a 4-digit PIN to secure your wallet';
                currentPinGroup.style.display = 'none';
                saveBtn.innerText = 'Set PIN';
            }
            
            document.getElementById('currentPin').value = '';
            document.getElementById('newPin').value = '';
            document.getElementById('confirmPin').value = '';
            
            document.getElementById('pinModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
}

function closePinModal() {
    document.getElementById('pinModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.getElementById('savePinBtn')?.addEventListener('click', async () => {
    const newPin = document.getElementById('newPin').value;
    const confirmPin = document.getElementById('confirmPin').value;
    const currentPin = document.getElementById('currentPin').value;
    
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
        showToast('PIN must be 4 digits only (numbers 0-9)', 'error');
        return;
    }
    
    if (newPin !== confirmPin) {
        showToast('PINs do not match', 'error');
        return;
    }
    
    const payload = { new_pin: newPin };
    if (currentPin) payload.current_pin = currentPin;
    
    try {
        const response = await fetch(`${WALLET_API}?action=set_pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            closePinModal();
            loadWalletData();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Failed to save PIN', 'error');
    }
});

// ========================================
// DEPOSIT
// ========================================
document.getElementById('depositBtn')?.addEventListener('click', async () => {
    const amountRaw = document.getElementById('depositAmount').value;
    
    if (!amountRaw || amountRaw.trim() === '') {
        showToast('Please enter an amount', 'error');
        return;
    }
    
    if (!/^\d+$/.test(amountRaw)) {
        showToast('Please enter numbers only (e.g., 100, 250)', 'error');
        return;
    }
    
    const amount = parseFloat(amountRaw);
    
    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid positive number', 'error');
        return;
    }
    
    const btn = document.getElementById('depositBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const response = await fetch(`${WALLET_API}?action=deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('depositAmount').value = '';
            loadWalletData();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Deposit failed', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

// ========================================
// WITHDRAW (مع التحقق من PIN)
// ========================================
function setWithdrawMethod(method) {
    currentWithdrawMethod = method;
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-method') === method);
    });
}

function setupMethodButtons() {
    document.querySelectorAll('.method-btn').forEach(btn => {
        if (btn.getAttribute('data-method') === 'bank') btn.classList.add('active');
    });
}
// متغير لتخزين بيانات السحب المؤقتة
let pendingWithdrawal = null;

async function requestWithdrawal() {
    const account = document.getElementById('payoutAccount').value;
    const amountRaw = document.getElementById('payoutAmount').value;
    
    if (!account.trim()) {
        showToast('Enter account details', 'error');
        return;
    }
    
    if (!amountRaw || amountRaw.trim() === '') {
        showToast('Please enter an amount', 'error');
        return;
    }
    
    if (!/^\d+$/.test(amountRaw)) {
        showToast('Please enter numbers only (e.g., 100, 250)', 'error');
        return;
    }
    
    const amount = parseFloat(amountRaw);
    
    if (isNaN(amount) || amount <= 0) {
        showToast('Enter valid amount', 'error');
        return;
    }
    
    // التحقق من الرصيد أولاً
    const balanceRes = await fetch(`${WALLET_API}?action=get_data`);
    const balanceData = await balanceRes.json();
    
    if (amount > balanceData.balance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    if (!balanceData.has_pin) {
        showToast('Please set a PIN first', 'error');
        openPinModal();
        return;
    }
    
    // تخزين بيانات السحب مؤقتاً
    pendingWithdrawal = {
        amount: amount,
        account: account,
        pin: null
    };
    
    // فتح مودال إدخال PIN
    document.getElementById('verifyPinModal').classList.add('active');
    document.getElementById('verifyPinInput').value = '';
    document.body.style.overflow = 'hidden';
}

function closeVerifyPinModal() {
    document.getElementById('verifyPinModal').classList.remove('active');
    document.getElementById('verifyPinInput').value = '';
    pendingWithdrawal = null;
    document.body.style.overflow = 'auto';
}

// تأكيد السحب بعد إدخال PIN
document.getElementById('confirmVerifyPinBtn')?.addEventListener('click', async () => {
    const pin = document.getElementById('verifyPinInput').value;
    
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
        showToast('Please enter a valid 4-digit PIN', 'error');
        return;
    }
    
    if (!pendingWithdrawal) {
        showToast('Something went wrong. Please try again.', 'error');
        closeVerifyPinModal();
        return;
    }
    
    const btn = document.getElementById('confirmVerifyPinBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const response = await fetch(`${WALLET_API}?action=withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: pendingWithdrawal.amount, 
                pin: pin, 
                account: pendingWithdrawal.account 
            })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            document.getElementById('payoutAmount').value = '';
            document.getElementById('payoutAccount').value = '';
            closeVerifyPinModal();
            loadWalletData();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Withdrawal failed', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});


// ========================================
// ORDERS
// ========================================
function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-message" style="text-align: center; padding: 60px;">
            <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.5;"></i>
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

    if (tabName === 'wallet') loadWalletData();
    if (tabName === 'gigs') loadGigs();
}

// ========================================
// AVATAR UPLOAD
// ========================================
function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const navAvatar = document.querySelector('.nav-avatar-circle');

    if (!avatarInput) return;

    avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target.result;
            [avatarPreview, sidebarAvatar, navAvatar].forEach(el => {
                if (el) {
                    el.style.backgroundImage = `url(${url})`;
                    el.style.backgroundSize = 'cover';
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
// COUNTRIES
// ========================================
async function loadCountries() {
    try {
        const response = await fetch('/Taskly/controllers/getSellerData.php');
        const data = await response.json();
        
        if (data.success) {
            const countrySelect = document.getElementById('profCountry');
            if (countrySelect && data.countries) {
                countrySelect.innerHTML = '<option value="">Select Country</option>';
                data.countries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.name;
                    option.textContent = country.name;
                    countrySelect.appendChild(option);
                });
            }
            
            if (data.languages) {
                allLanguages = data.languages;
                const langSelect = document.getElementById('langSelect');
                if (langSelect) {
                    langSelect.innerHTML = '<option value="">-- Select Language --</option>';
                    data.languages.forEach(language => {
                        const option = document.createElement('option');
                        option.value = language.id;
                        option.textContent = language.name;
                        langSelect.appendChild(option);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading countries:', error);
    }
}

// ========================================
// LOGOUT
// ========================================
function openLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

async function confirmLogout() {
    closeLogoutModal();
    
    try {
        await fetch('/Taskly/controllers/logout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        localStorage.clear();
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        showToast("Logged out successfully", "success");
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.clear();
        window.location.href = '../index.html';
    }
}

async function handleLogout() {
    openLogoutModal();
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