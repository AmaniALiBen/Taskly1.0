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
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        
        console.log('User data from server:', data);
        
        if (data.loggedIn) {
            // التحقق من أن المستخدم بائع
            if (data.role !== 'seller') {
                console.log('User is not a seller, redirecting...');
                window.location.href = '../index.html';
                return;
            }
            
            // ✅ تحديث الاسم في sellerData
            sellerData.name = data.username;
            sellerData.email = data.email;
            sellerData.role = data.role;
            
            // ✅ تحديث الاسم في السايدبار
            const sidebarName = document.getElementById('sidebarName');
            const profileEmail = document.getElementById('profileEmail');
            const profName = document.getElementById('profName');
            const profEmail = document.getElementById('profEmail');
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            const navAvatar = document.querySelector('.nav-avatar-circle');
            const avatarPreview = document.getElementById('avatarPreview');
            
            // ✅ تحديث الاسم
            if (sidebarName) sidebarName.innerText = data.username;
            if (profileEmail) profileEmail.innerText = data.email;
            if (profName) profName.value = data.username;
            if (profEmail) profEmail.value = data.email;
            
            // ✅ تحديث الصورة الشخصية
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
                // ✅ صورة افتراضية تعتمد على أول حرف من الاسم
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
            
            
            // تحديث باقي البيانات
if (data.seller_details) {
    const profBio = document.getElementById('profBio');       // experience
    const profSkills = document.getElementById('profSkills'); // about_me
    const profCountry = document.getElementById('profCountry');
    
    // experience → Professional Summary
    if (profBio && data.seller_details.experience) {
        profBio.value = data.seller_details.experience;
    }
    
    // about_me → Skills
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
            
            // تحديث اللغات
            if (data.languages && data.languages.length > 0) {
                sellerData.languages = data.languages.map(lang => lang.name);
                renderLanguages();
            }
            
            updateStats();
            
        } else {
            console.log('User not logged in, redirecting...');
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

// ========================================
// SAVE PROFILE TO DATABASE
// ========================================
// ========================================
// SAVE PROFILE TO DATABASE (WITH IMAGE)
// ========================================
async function saveProfile() {
    const name = document.getElementById('profName')?.value.trim();
    const summary = document.getElementById('profBio')?.value;     // summary → experience
    const skills = document.getElementById('profSkills')?.value;   // skills → about_me
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
        formData.append('summary', summary);   // summary → experience
        formData.append('skills', skills);     // skills → about_me
        formData.append('country', country);
        
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }
        
        const response = await fetch('http://localhost/Taskly/controllers/updateProfile.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Update response:', data);
        
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

// ========================================
// UPDATE PASSWORD - FIXED
// ========================================
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
        console.log('Password update response:', data);
        
        if (data.success) {
            showToast("Password updated successfully!", "success");
            // تفريغ الحقول
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
    const select = document.getElementById('langSelect');
    const selectedOption = select.options[select.selectedIndex];
    const languageId = select.value;
    const languageName = selectedOption?.text;
    
    console.log('Selected - ID:', languageId, 'Name:', languageName);
    
    if (!languageId || !languageName || languageId === "") {
        showToast("Please select a language", "error");
        return;
    }
    
    if (sellerData.languages.includes(languageName)) {
        showToast("Language already added", "error");
        return;
    }
    
    // أضف اسم اللغة وليس ID
    sellerData.languages.push(languageName);
    renderLanguages();
    select.value = "";
    showToast(`Added ${languageName}`, "success");
    
    // حفظ التغييرات في قاعدة البيانات
    updateSellerLanguages();
}

function removeLanguage(language) {
    sellerData.languages = sellerData.languages.filter(l => l !== language);
    renderLanguages();
    showToast(`Removed ${language}`, "success");
    
    // حفظ التغييرات في قاعدة البيانات
    updateSellerLanguages();
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


// ============================================
// LOGOUT FUNCTIONALITY
// ============================================

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
        const response = await fetch('/Taskly/controllers/logout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        await response.json();
        
        // مسح جميع البيانات المحلية
        localStorage.clear();
        
        // مسح الكوكيز
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        showToast("Logged out successfully", "success");
        
        // التوجيه إلى الصفحة الرئيسية
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


// ============================================
// UPDATE PROFILE FUNCTIONS FOR SELLER
// ============================================

// تحديث بيانات البائع
async function updateSellerProfile() {
    const name = document.getElementById('profName')?.value.trim();
    const bio = document.getElementById('profBio')?.value;
    const skills = document.getElementById('profSkills')?.value;
    const country = document.getElementById('profCountry')?.value;
    const experience = document.getElementById('profExperience')?.value;
    
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
        const response = await fetch('/Taskly/controllers/updateProfile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateProfile',
                name: name,
                bio: bio,
                skills: skills,
                country: country,
                experience: experience
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Profile updated successfully!', 'success');
            // تحديث الاسم في السايدبار
            const sidebarName = document.getElementById('sidebarName');
            if (sidebarName) sidebarName.innerText = name;
            
            // إعادة تحميل البيانات
            setTimeout(() => {
                loadUserData();
            }, 500);
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    }
}

// تحديث لغات البائع
// ========================================
// UPDATE SELLER LANGUAGES - FIXED
// ========================================
async function updateSellerLanguages() {
    // تحويل أسماء اللغات إلى IDs
    const languageIds = sellerData.languages.map(langName => {
        const found = allLanguages.find(l => l.name === langName);
        return found ? found.id : null;
    }).filter(id => id !== null);
    
    console.log('Updating languages - Names:', sellerData.languages);
    console.log('Updating languages - IDs:', languageIds);
    
    try {
        const response = await fetch('/Taskly/controllers/updateLanguages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                languages: languageIds
            })
        });
        
        const data = await response.json();
        console.log('Languages update response:', data);
        
        if (data.success) {
            showToast('Languages updated successfully!', 'success');
        } else {
            showToast(data.message || 'Failed to update languages', 'error');
        }
    } catch (error) {
        console.error('Error updating languages:', error);
        showToast('Server error: ' + error.message, 'error');
    }
}

async function updateSellerPassword() {
    const currentPassword = document.getElementById('oldPass')?.value;
    const newPassword = document.getElementById('newPass')?.value;
    const confirmPassword = document.getElementById('confirmPass')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    const updateBtn = document.querySelector('.btn-update');
    const originalText = updateBtn ? updateBtn.innerHTML : 'Update';
    
    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    try {
        const response = await fetch('/Taskly/controllers/updatePassword.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Password updated successfully!', 'success');
            document.getElementById('oldPass').value = '';
            document.getElementById('newPass').value = '';
            document.getElementById('confirmPass').value = '';
        } else {
            showToast(data.message || 'Password update failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error', 'error');
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalText;
        }
    }
}

async function loadCountries() {
    try {
        const response = await fetch('/Taskly/controllers/getSellerData.php');
        const data = await response.json();
        
        console.log('Countries and Languages data:', data);
        
        if (data.success) {
            // تعبئة قائمة الدول
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
            
            // ✅ تعبئة قائمة اللغات من قاعدة البيانات
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
