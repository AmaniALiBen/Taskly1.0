// ============================================
// PROFILE.JS - CLEAN VERSION
// ============================================

let currentMode = 'deposit';
let biometricVerified = false;
let currentBalance = 450.00;
let walletPin = localStorage.getItem('walletPin');

// ============================================
// TOAST FUNCTIONS
// ============================================
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    const toastText = document.getElementById('toast-text');
    
    if (toastText) {
        toastText.innerText = message;
    } else {
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span id="toast-text">${message}</span>`;
    }
    
    const icon = toast.querySelector('i');
    if (icon) {
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle';
            toast.style.background = '#ef4444';
            toast.style.borderLeft = '4px solid #b91c1c';
        } else if (type === 'warning') {
            icon.className = 'fas fa-exclamation-triangle';
            toast.style.background = '#f59e0b';
            toast.style.borderLeft = '4px solid #b45309';
        } else {
            icon.className = 'fas fa-check-circle';
            toast.style.background = '#10b981';
            toast.style.borderLeft = '4px solid #047857';
        }
    }
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// NAVIGATION
// ============================================
function goBack() {
    window.location.href = '../index.html';
}

// ============================================
// LOGOUT
// ============================================
// ============================================
// LOGOUT WITH CUSTOM TOAST CONFIRMATION
// ============================================
function openLogoutConfirm() {
    // إنشاء مودال تأكيد مخصص بدلاً من confirm
    const modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        z-index: 100001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1a1a2e, #0f0f1a);
                    border: 1px solid #7c3aed;
                    border-radius: 20px;
                    padding: 30px;
                    max-width: 350px;
                    width: 90%;
                    text-align: center;
                    animation: fadeIn 0.3s ease;">
            <div style="width: 70px;
                        height: 70px;
                        background: rgba(124, 58, 237, 0.15);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                        font-size: 2rem;
                        color: #f43f5e;">
                <i class="fas fa-sign-out-alt"></i>
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 10px; color: white;">Logout?</h3>
            <p style="color: #94a3b8; margin-bottom: 25px;">Are you sure you want to log out?</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="cancelLogoutBtn" style="background: rgba(255,255,255,0.1);
                                                   border: 1px solid rgba(255,255,255,0.2);
                                                   color: white;
                                                   padding: 10px 25px;
                                                   border-radius: 30px;
                                                   cursor: pointer;
                                                   font-weight: 600;">
                    Cancel
                </button>
                <button id="confirmLogoutBtn" style="background: #f43f5e;
                                                    border: none;
                                                    color: white;
                                                    padding: 10px 25px;
                                                    border-radius: 30px;
                                                    cursor: pointer;
                                                    font-weight: 600;">
                    Yes, Logout
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    document.getElementById('cancelLogoutBtn').onclick = function() {
        modal.remove();
        document.body.style.overflow = 'auto';
        showToast("Logout cancelled", "info");
    };
    
    document.getElementById('confirmLogoutBtn').onclick = async function() {
        modal.remove();
        document.body.style.overflow = 'auto';
        await performLogout();
    };
}

async function performLogout() {
    try {
        const response = await fetch('/Taskly/controllers/logout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast("👋 Logged out successfully! See you soon!", "success");
            
            localStorage.clear();
            document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1500);
        } else {
            showToast(data.message || "Logout failed", "error");
        }
    } catch (error) {
        console.error('Logout error:', error);
        showToast("⚠️ Something went wrong, but you've been logged out", "warning");
        localStorage.clear();
        setTimeout(() => {
            window.location.href = "../index.html";
        }, 1000);
    }
}

// استبدال دالة handleLogout القديمة
async function handleLogout() {
    openLogoutConfirm();
}

// ============================================
// FETCH USER DATA FROM DATABASE
// ============================================
async function fetchUserData() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        
        console.log('User data from server:', data);
        
        if (data.loggedIn) {
            const usernameInput = document.getElementById('username-input');
            const displayName = document.getElementById('display-name');
            const emailInput = document.querySelector('#personal-info input[type="email"]');
            const roleElement = document.querySelector('.sidebar-header p');
            
            if (usernameInput) usernameInput.value = data.username;
            if (displayName) displayName.innerText = data.username;
            if (emailInput) emailInput.value = data.email;
            
            if (roleElement) {
                if (data.role === 'admin') roleElement.innerText = 'Admin Account';
                else if (data.role === 'seller') roleElement.innerText = 'Seller Account';
                else roleElement.innerText = 'Buyer Account';
            }
            
            const profileImg = document.getElementById('profile-img');
            if (profileImg) {
                if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                    profileImg.src = data.avatar + '?t=' + new Date().getTime();
                } else {
                    profileImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=7c3aed&color=fff&size=150`;
                }
            }
            
            if (data.balance !== undefined && data.balance !== null) {
                currentBalance = parseFloat(data.balance);
                updateBalanceUI();
                localStorage.setItem('walletBalance', currentBalance);
            }
            
            showToast(`Welcome back, ${data.username}!`, 'success');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// ============================================
// UPDATE PROFILE INFO
// ============================================
async function updateProfileInfo() {
    const name = document.getElementById('username-input')?.value.trim();
    
    if (!name) {
        showToast('Name is required', 'error');
        return;
    }
    
    const submitBtn = event?.target;
    const originalText = submitBtn ? submitBtn.innerHTML : 'Update';
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    }
    
    try {
        const response = await fetch('/Taskly/controllers/updateProfile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'updateProfile',
                name: name
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Profile updated successfully!', 'success');
            document.getElementById('display-name').innerText = name;
            localStorage.setItem('userName', name);
        } else {
            showToast(data.message || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// ============================================
// UPDATE PASSWORD
// ============================================
async function updatePassword() {
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Please fill in all password fields', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('New password must be at least 8 characters', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('New passwords do not match', 'error');
        return;
    }
    
    const submitBtn = event?.target;
    const originalText = submitBtn ? submitBtn.innerHTML : 'Update';
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
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
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } else {
            showToast(data.message || 'Password update failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// ============================================
// AVATAR UPLOAD FOR BUYER
// ============================================
function setupAvatarUpload() {
    const avatarUpload = document.getElementById('avatar-upload');
    const profileImg = document.getElementById('profile-img');
    
    if (!avatarUpload) return;
    
    avatarUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB', 'error');
            avatarUpload.value = '';
            return;
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Invalid image format. Allowed: JPG, PNG, WEBP, GIF', 'error');
            avatarUpload.value = '';
            return;
        }
        
        // معاينة محلية
        const reader = new FileReader();
        reader.onload = (event) => {
            if (profileImg) {
                profileImg.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
        
        // رفع إلى السيرفر
        await uploadBuyerAvatar(file);
    });
}

async function uploadBuyerAvatar(file) {
    const formData = new FormData();
    formData.append('action', 'updateAvatar');
    formData.append('avatar', file);
    
    showToast('Uploading image...', 'info');
    
    try {
        const response = await fetch('/Taskly/controllers/updateAvatar.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        console.log('Upload response:', data);
        
        if (data.success) {
            showToast('Profile picture updated successfully!', 'success');
            
            const profileImg = document.getElementById('profile-img');
            if (profileImg && data.avatar) {
                profileImg.src = data.avatar + '?t=' + new Date().getTime();
            }
            
            localStorage.setItem('avatarUpdated', Date.now());
        } else {
            showToast(data.message || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Server error: ' + error.message, 'error');
    }
}

// ============================================
// SECTION NAVIGATION
// ============================================
function showSection(id, btn) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    btn.classList.add('active');
}

// ============================================
// WALLET PIN MANAGEMENT
// ============================================
let isChangingPin = false;

function updatePinStatusUI() {
    const pinStatusIcon = document.getElementById('pin-status-icon');
    const pinStatusTitle = document.getElementById('pin-status-title');
    const pinStatusDesc = document.getElementById('pin-status-desc');
    const pinActionBtn = document.getElementById('pin-action-btn');
    
    if (walletPin) {
        pinStatusIcon.className = 'pin-status-icon set';
        pinStatusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        pinStatusTitle.innerHTML = 'PIN Protected';
        pinStatusDesc.innerHTML = 'Your wallet is secured with a PIN';
        pinActionBtn.innerHTML = 'Change PIN';
    } else {
        pinStatusIcon.className = 'pin-status-icon not-set';
        pinStatusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        pinStatusTitle.innerHTML = 'PIN Not Set';
        pinStatusDesc.innerHTML = 'Set a PIN to secure your wallet transactions';
        pinActionBtn.innerHTML = 'Set PIN';
    }
}

function openPinModal() {
    const modal = document.getElementById('pinModal');
    const pinSetupForm = document.getElementById('pin-setup-form');
    const pinChangeForm = document.getElementById('pin-change-form');
    const actionBtn = document.getElementById('pin-modal-action-btn');
    
    if (!modal) return;
    
    if (walletPin) {
        isChangingPin = true;
        pinSetupForm.style.display = 'none';
        pinChangeForm.style.display = 'block';
        actionBtn.innerHTML = 'Change PIN';
        if (document.getElementById('current-pin')) document.getElementById('current-pin').value = '';
        if (document.getElementById('change-new-pin')) document.getElementById('change-new-pin').value = '';
        if (document.getElementById('change-confirm-pin')) document.getElementById('change-confirm-pin').value = '';
    } else {
        isChangingPin = false;
        pinSetupForm.style.display = 'block';
        pinChangeForm.style.display = 'none';
        actionBtn.innerHTML = 'Set PIN';
        if (document.getElementById('new-pin')) document.getElementById('new-pin').value = '';
        if (document.getElementById('confirm-pin')) document.getElementById('confirm-pin').value = '';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePinModal() {
    const modal = document.getElementById('pinModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function setupOrChangePin() {
    if (isChangingPin) {
        const currentPin = document.getElementById('current-pin').value;
        const newPin = document.getElementById('change-new-pin').value;
        const confirmPin = document.getElementById('change-confirm-pin').value;
        
        if (!currentPin) {
            showToast('Please enter your current PIN', 'error');
            return;
        }
        
        if (currentPin !== walletPin) {
            showToast('Current PIN is incorrect', 'error');
            return;
        }
        
        if (!newPin || !confirmPin) {
            showToast('Please enter and confirm your new PIN', 'error');
            return;
        }
        
        if (newPin.length !== 4 || confirmPin.length !== 4) {
            showToast('PIN must be 4 digits', 'error');
            return;
        }
        
        if (!/^\d+$/.test(newPin)) {
            showToast('PIN can only contain numbers', 'error');
            return;
        }
        
        if (newPin !== confirmPin) {
            showToast('New PINs do not match', 'error');
            return;
        }
        
        if (newPin === currentPin) {
            showToast('New PIN must be different from current PIN', 'error');
            return;
        }
        
        walletPin = newPin;
        localStorage.setItem('walletPin', walletPin);
        
        showToast('PIN changed successfully!', 'success');
        updatePinStatusUI();
        closePinModal();
        
    } else {
        const newPin = document.getElementById('new-pin').value;
        const confirmPin = document.getElementById('confirm-pin').value;
        
        if (!newPin || !confirmPin) {
            showToast('Please enter and confirm your PIN', 'error');
            return;
        }
        
        if (newPin.length !== 4 || confirmPin.length !== 4) {
            showToast('PIN must be 4 digits', 'error');
            return;
        }
        
        if (!/^\d+$/.test(newPin)) {
            showToast('PIN can only contain numbers', 'error');
            return;
        }
        
        if (newPin !== confirmPin) {
            showToast('PINs do not match', 'error');
            return;
        }
        
        walletPin = newPin;
        localStorage.setItem('walletPin', walletPin);
        
        showToast('PIN set successfully! Your wallet is now secure.', 'success');
        updatePinStatusUI();
        closePinModal();
    }
}

// ============================================
// WALLET FUNCTIONS
// ============================================
function setWalletMode(mode, btn) {
    currentMode = mode;
    document.querySelectorAll('.wallet-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const mainBtn = document.getElementById('main-btn');
    if (mainBtn) {
        mainBtn.innerText = mode === 'deposit' ? 'Complete Deposit' : 'Request Withdrawal';
    }
}

function switchFields(method, btn) {
    document.querySelectorAll('.method-card').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.dynamic-fields').forEach(f => f.classList.remove('active'));
    const fields = document.getElementById('fields-' + method);
    if (fields) fields.classList.add('active');
    
    if (method === 'apple') {
        biometricVerified = false;
        const icon = document.getElementById('apple-icon');
        if (icon) {
            icon.className = "fas fa-fingerprint";
            icon.style.color = "var(--accent-glow)";
        }
    } else {
        biometricVerified = true;
    }
}

function simulateBiometric() {
    const icon = document.getElementById('apple-icon');
    if (icon) {
        icon.style.color = "#10b981";
        icon.className = "fas fa-check-circle";
    }
    biometricVerified = true;
    showToast("Identity Verified");
}

function updateBalanceUI() {
    const balanceElement = document.getElementById('current-balance');
    if (balanceElement) {
        balanceElement.innerText = `$${currentBalance.toFixed(2)}`;
    }
}

// ============================================
// PAYMENT FORM SUBMIT
// ============================================
const paymentForm = document.getElementById('payment-form');
if (paymentForm) {
    paymentForm.onsubmit = function (e) {
        e.preventDefault();

        const amountInput = document.getElementById('transaction-amount');
        const amount = parseFloat(amountInput ? amountInput.value : 0);

        if (!amount || amount <= 0) {
            showToast("Please enter a valid amount", 'error');
            return;
        }

        if (!biometricVerified) {
            showToast("Verification required for Apple Pay", 'error');
            return;
        }

        const activeMethodCard = document.querySelector('.method-card.active');
        if (activeMethodCard) {
            const activeMethodSpan = activeMethodCard.querySelector('span');
            const activeMethod = activeMethodSpan ? activeMethodSpan.innerText : '';
            
            if (activeMethod === 'PayPal') {
                const paypalPasscode = document.getElementById('paypal-passcode');
                const passcode = paypalPasscode ? paypalPasscode.value : '';
                if (!passcode || passcode.length !== 6) {
                    showToast("Please enter your 6-digit PayPal passcode", 'error');
                    return;
                }
                if (!/^\d+$/.test(passcode)) {
                    showToast("Passcode must contain only numbers", 'error');
                    return;
                }
            }
        }

        if (currentMode === 'withdraw' && amount > currentBalance) {
            showToast("Insufficient balance for withdrawal", 'error');
            return;
        }

        const btn = document.getElementById('main-btn');
        const originalText = btn ? btn.innerText : '';
        if (btn) {
            btn.innerText = "Processing...";
            btn.disabled = true;
        }

        setTimeout(() => {
            if (currentMode === 'deposit') {
                currentBalance += amount;
                showToast(`Success! $${amount.toFixed(2)} deposited to your wallet.`);
            } else {
                currentBalance -= amount;
                showToast(`Success! $${amount.toFixed(2)} withdrawn from your wallet.`);
            }

            updateBalanceUI();
            localStorage.setItem('walletBalance', currentBalance);

            if (amountInput) amountInput.value = '';

            const paypalPasscode = document.getElementById('paypal-passcode');
            if (paypalPasscode) paypalPasscode.value = '';

            if (btn) {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        }, 1500);
    };
}

// ============================================
// PIN INPUT RESTRICTIONS
// ============================================
function setupPinInputRestrictions() {
    const pinInputs = document.querySelectorAll('.pin-input');
    pinInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    });
}

// ============================================
// STORAGE EVENT LISTENER FOR AVATAR UPDATE
// ============================================
window.addEventListener('storage', function(e) {
    if (e.key === 'avatarUpdated') {
        console.log('Avatar updated, refreshing...');
        fetchUserData();
    }
});

window.addEventListener('pageshow', function() {
    fetchUserData();
});

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    loadBuyerWalletData();
    fetchUserData();
    updatePinStatusUI();
    setupPinInputRestrictions();
    updateBalanceUI();
    setupAvatarUpload();
    
    const savedName = localStorage.getItem('userName');
    if (savedName && document.getElementById('username-input')) {
        document.getElementById('username-input').value = savedName;
        document.getElementById('display-name').innerText = savedName;
    }
    
    const savedBalance = localStorage.getItem('walletBalance');
    if (savedBalance) {
        currentBalance = parseFloat(savedBalance);
        updateBalanceUI();
    }
});

window.onclick = function(event) {
    const pinModal = document.getElementById('pinModal');
    if (event.target === pinModal) {
        closePinModal();
    }
};

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePinModal();
    }
});

// ============================================
// WALLET API CONNECTION (نفس حق البائع)
// ============================================
const WALLET_API = '/Taskly/controllers/WalletController.php';

// متغيرات المحفظة
let buyerWalletBalance = 0;
let buyerHasPin = false;
let pendingBuyerTransaction = null;

// ============================================
// LOAD WALLET DATA FROM DATABASE
// ============================================
async function loadBuyerWalletData() {
    try {
        const response = await fetch(`${WALLET_API}?action=get_data`);
        const data = await response.json();
        
        if (data.success) {
            buyerWalletBalance = data.balance;
            buyerHasPin = data.has_pin;
            
            // تحديث الرصيد في الواجهة
            const balanceElement = document.getElementById('current-balance');
            if (balanceElement) {
                balanceElement.innerText = `$${data.balance.toFixed(2)}`;
            }
            
            // تحديث حالة PIN في الواجهة
            updateBuyerPinStatusUI(data.has_pin);
        }
    } catch (error) {
        console.error('Error loading wallet:', error);
    }
}

function updateBuyerPinStatusUI(hasPin) {
    const pinStatusIcon = document.getElementById('pin-status-icon');
    const pinStatusTitle = document.getElementById('pin-status-title');
    const pinStatusDesc = document.getElementById('pin-status-desc');
    const pinActionBtn = document.getElementById('pin-action-btn');
    
    if (hasPin) {
        if (pinStatusIcon) {
            pinStatusIcon.className = 'pin-status-icon set';
            pinStatusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        }
        if (pinStatusTitle) pinStatusTitle.innerHTML = 'PIN Protected';
        if (pinStatusDesc) pinStatusDesc.innerHTML = 'Your wallet is secured with a PIN';
        if (pinActionBtn) pinActionBtn.innerHTML = 'Change PIN';
    } else {
        if (pinStatusIcon) {
            pinStatusIcon.className = 'pin-status-icon not-set';
            pinStatusIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        }
        if (pinStatusTitle) pinStatusTitle.innerHTML = 'PIN Not Set';
        if (pinStatusDesc) pinStatusDesc.innerHTML = 'Set a PIN to secure your wallet transactions';
        if (pinActionBtn) pinActionBtn.innerHTML = 'Set PIN';
    }
}

// ============================================
// PIN MODAL FOR BUYER (يستخدم نفس Modal الموجود)
// ============================================
function openBuyerPinModal() {
    // استخدام الـ Modal الموجود بالفعل في الصفحة
    openPinModal();
}

// تعديل دالة setupOrChangePin لتتواصل مع API
const originalSetupOrChangePin = setupOrChangePin;
setupOrChangePin = async function() {
    if (isChangingPin) {
        // تغيير PIN
        const currentPin = document.getElementById('current-pin').value;
        const newPin = document.getElementById('change-new-pin').value;
        const confirmPin = document.getElementById('change-confirm-pin').value;
        
        if (!currentPin) {
            showToast('Please enter your current PIN', 'error');
            return;
        }
        
        if (!newPin || !confirmPin) {
            showToast('Please enter and confirm your new PIN', 'error');
            return;
        }
        
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            showToast('PIN must be 4 digits', 'error');
            return;
        }
        
        if (newPin !== confirmPin) {
            showToast('PINs do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${WALLET_API}?action=set_pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_pin: currentPin, new_pin: newPin })
            });
            const data = await response.json();
            
            if (data.success) {
                showToast('PIN changed successfully!', 'success');
                closePinModal();
                loadBuyerWalletData();
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            showToast('Failed to change PIN', 'error');
        }
        
    } else {
        // تعيين PIN لأول مرة
        const newPin = document.getElementById('new-pin').value;
        const confirmPin = document.getElementById('confirm-pin').value;
        
        if (!newPin || !confirmPin) {
            showToast('Please enter and confirm your PIN', 'error');
            return;
        }
        
        if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
            showToast('PIN must be 4 digits', 'error');
            return;
        }
        
        if (newPin !== confirmPin) {
            showToast('PINs do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${WALLET_API}?action=set_pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_pin: newPin })
            });
            const data = await response.json();
            
            if (data.success) {
                showToast('PIN set successfully!', 'success');
                closePinModal();
                loadBuyerWalletData();
            } else {
                showToast(data.message, 'error');
            }
        } catch (error) {
            showToast('Failed to set PIN', 'error');
        }
    }
};

// ============================================
// VERIFY PIN MODAL (مودال إدخال PIN قبل العملية)
// ============================================
function openBuyerVerifyPinModal(transactionType, amount, account = null) {
    pendingBuyerTransaction = {
        type: transactionType,
        amount: amount,
        account: account
    };
    
    // إنشاء مودال مؤقت
    const modal = document.createElement('div');
    modal.id = 'verifyPinModal';
    modal.className = 'pin-modal-overlay';
    modal.innerHTML = `
        <div class="pin-modal-card">
            <button class="pin-modal-close" onclick="this.closest('.pin-modal-overlay').remove()">&times;</button>
            <div class="pin-modal-header">
                <div class="pin-modal-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h2>Verify <span>PIN</span></h2>
                <p>Enter your 4-digit PIN to confirm ${transactionType === 'deposit' ? 'deposit' : 'withdrawal'}</p>
            </div>
            <div class="pin-modal-body">
                <div class="input-box">
                    <input type="password" id="verifyPinInput" class="pin-input" placeholder="Enter PIN" maxlength="4" autocomplete="off" onkeypress="return event.charCode >= 48 && event.charCode <= 57">
                </div>
            </div>
            <div class="pin-modal-footer">
                <button class="btn-outline" onclick="this.closest('.pin-modal-overlay').remove()">Cancel</button>
                <button class="btn-primary" id="confirmVerifyPinBtn">Confirm</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    document.getElementById('confirmVerifyPinBtn').onclick = async () => {
        const pin = document.getElementById('verifyPinInput').value;
        
        if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
            showToast('Please enter a valid 4-digit PIN', 'error');
            return;
        }
        
        modal.remove();
        document.body.style.overflow = 'auto';
        
        // تنفيذ العملية بعد التحقق
        await executeBuyerTransaction(pendingBuyerTransaction.type, pendingBuyerTransaction.amount, pendingBuyerTransaction.account, pin);
        pendingBuyerTransaction = null;
    };
}

// ============================================
// EXECUTE TRANSACTION AFTER PIN VERIFICATION
// ============================================
async function executeBuyerTransaction(type, amount, account, pin) {
    try {
        let response;
        
        if (type === 'deposit') {
            response = await fetch(`${WALLET_API}?action=deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount })
            });
        } else {
            response = await fetch(`${WALLET_API}?action=withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amount, pin: pin, account: account })
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            
            // تفريغ الحقول
            if (type === 'deposit') {
                document.getElementById('transaction-amount').value = '';
            } else {
                document.getElementById('transaction-amount').value = '';
                const accountField = document.querySelector('#fields-paypal input') || document.querySelector('#fields-card input');
                if (accountField) accountField.value = '';
            }
            
            loadBuyerWalletData();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        showToast('Transaction failed', 'error');
    }
}

// ============================================
// MODIFIED PAYMENT FORM SUBMIT (مع PIN)
// ============================================
const buyerPaymentForm = document.getElementById('payment-form');
if (buyerPaymentForm) {
    buyerPaymentForm.onsubmit = async function(e) {
        e.preventDefault();

        const amountInput = document.getElementById('transaction-amount');
        const amountRaw = amountInput ? amountInput.value : '';
        
        // التحقق من أن الحقل ليس فارغاً
        if (!amountRaw || amountRaw.trim() === '') {
            showToast('Please enter an amount', 'error');
            return;
        }
        
        // التحقق من أن القيمة أرقام فقط
        if (!/^\d+(\.\d+)?$/.test(amountRaw)) {
            showToast('Please enter numbers only (e.g., 100 or 50.50)', 'error');
            return;
        }
        
        const amount = parseFloat(amountRaw);
        
        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid positive number', 'error');
            return;
        }

        // التحقق من وجود PIN أولاً
        const checkRes = await fetch(`${WALLET_API}?action=get_data`);
        const checkData = await checkRes.json();
        
        if (!checkData.has_pin) {
            showToast('Please set a PIN first', 'error');
            openPinModal();
            return;
        }

        const activeMethodCard = document.querySelector('.method-card.active');
        let account = null;
        
        if (currentMode === 'withdraw') {
            if (amount > checkData.balance) {
                showToast('Insufficient balance', 'error');
                return;
            }
            
            // الحصول على معلومات الحساب حسب الطريقة المختارة
            if (activeMethodCard) {
                const methodSpan = activeMethodCard.querySelector('span');
                const method = methodSpan ? methodSpan.innerText : '';
                
                if (method === 'PayPal') {
                    const paypalEmail = document.getElementById('paypal-email');
                    if (paypalEmail && paypalEmail.value) {
                        account = paypalEmail.value;
                    } else {
                        showToast('Please enter PayPal email', 'error');
                        return;
                    }
                } else {
                    const cardName = document.querySelector('#fields-card input[placeholder="Full Name"]');
                    if (cardName && cardName.value) {
                        account = cardName.value;
                    } else {
                        account = 'Card payment';
                    }
                }
            }
        }
        
        // فتح مودال إدخال PIN
        openBuyerVerifyPinModal(currentMode, amount, account);
    };
}

// ============================================
// UPDATE BALANCE UI from DATABASE
// ============================================
function updateBalanceUI() {
    // replaced by loadBuyerWalletData
}

// ============================================
// MODIFIED setWalletMode (لإزالة زر main-btn القديم)
// ============================================
const originalSetWalletMode = setWalletMode;
setWalletMode = function(mode, btn) {
    currentMode = mode;
    document.querySelectorAll('.wallet-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    // تغيير نص الزر في الفورم
    const submitBtn = document.querySelector('#payment-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerText = mode === 'deposit' ? 'Complete Deposit' : 'Request Withdrawal';
    }
};

// ============================================
// منع الحروف في حقل المبلغ
// ============================================
const amountField = document.getElementById('transaction-amount');
if (amountField) {
    amountField.type = 'text';
    amountField.setAttribute('inputmode', 'numeric');
    amountField.setAttribute('pattern', '[0-9]*');
    amountField.onkeypress = function(e) {
        return (e.charCode >= 48 && e.charCode <= 57) || e.charCode === 46;
    };
}

// ============================================
// تحميل بيانات المحفظة عند فتح الصفحة
// ============================================
// أضف هذا السطر داخل DOMContentLoaded
// loadBuyerWalletData();