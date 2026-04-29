let currentMode = 'deposit';
let biometricVerified = false;
let currentBalance = 450.00;
let walletPin = localStorage.getItem('walletPin');

// ============================================
// TOAST FUNCTIONS - FIXED
// ============================================
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    
    // Create toast if it doesn't exist
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    
    const toastText = document.getElementById('toast-text');
    
    // Set message
    if (toastText) {
        toastText.innerText = message;
    } else {
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span id="toast-text">${message}</span>`;
    }
    
    // Set icon and color based on type
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
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// BACK BUTTON FUNCTION
// ============================================
function goBack() {
    window.location.href = '../index.html';
}

// ============================================
// LOGOUT
// ============================================
function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('walletBalance');
        localStorage.removeItem('walletPin');
        window.location.href = "../index.html";
    }
}

// ============================================
// AVATAR UPLOAD
// ============================================
const avatarUpload = document.getElementById('avatar-upload');
const profileImg = document.getElementById('profile-img');

if (avatarUpload) {
    avatarUpload.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                profileImg.src = event.target.result;
                showToast('Profile photo updated!');
                localStorage.setItem('userAvatar', event.target.result);
            }
            reader.readAsDataURL(file);
        }
    });
}

const savedAvatar = localStorage.getItem('userAvatar');
if (savedAvatar && profileImg) {
    profileImg.src = savedAvatar;
}

// ============================================
// PROFILE UPDATE
// ============================================
function updateProfile() {
    const newName = document.getElementById('username-input').value;
    if (newName.trim()) {
        document.getElementById('display-name').innerText = newName;
        showToast('Profile updated successfully!');
        localStorage.setItem('userName', newName);
    }
}

const savedName = localStorage.getItem('userName');
if (savedName && document.getElementById('username-input')) {
    document.getElementById('username-input').value = savedName;
    document.getElementById('display-name').innerText = savedName;
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
// LOAD SAVED BALANCE
// ============================================
const savedBalance = localStorage.getItem('walletBalance');
if (savedBalance) {
    currentBalance = parseFloat(savedBalance);
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
// INITIALIZATION
// ============================================
function loadUserData() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        const user = JSON.parse(userData);
        if (user.avatar && profileImg) {
            profileImg.src = user.avatar;
        }
        if (user.name && document.getElementById('username-input')) {
            document.getElementById('username-input').value = user.name;
            document.getElementById('display-name').innerText = user.name;
        }
    }
}

updatePinStatusUI();
setupPinInputRestrictions();
updateBalanceUI();
loadUserData();

window.onclick = function(event) {
    const pinModal = document.getElementById('pinModal');
    if (event.target === pinModal) {
        closePinModal();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closePinModal();
    }
});