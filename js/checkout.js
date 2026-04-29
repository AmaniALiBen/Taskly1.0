// ============================================
// ORDER DATA from localStorage (from gig-details)
// ============================================
let orderData = null;
let walletBalance = 1250.00;
let selectedMethod = 'card';
let appleVerified = false;
let toastTimeout;
let isProcessing = false;

// ============================================
// AUTHENTICATION - Load user data
// ============================================
let currentUser = null;

function loadUserData() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserAvatar();
    }
}

function updateUserAvatar() {
    const userAvatarImg = document.getElementById('user-avatar-img');
    if (userAvatarImg && currentUser && currentUser.avatar) {
        userAvatarImg.src = currentUser.avatar;
    }
}

// ============================================
// GET TOTAL AMOUNT
// ============================================
function getTotalAmount() {
    // First try to get from orderData
    if (orderData && orderData.price && typeof orderData.price === 'number') {
        return orderData.price;
    }
    
    // Second try to get from the DOM
    const totalElement = document.getElementById('total-amount');
    if (totalElement) {
        const totalText = totalElement.textContent;
        const match = totalText.match(/\d+(?:\.\d+)?/);
        if (match) {
            const amount = parseFloat(match[0]);
            if (!isNaN(amount)) {
                return amount;
            }
        }
    }
    
    return 524;
}

// ============================================
// LOAD ORDER FROM GIG DETAILS
// ============================================
function loadOrderFromStorage() {
    const storedOrder = localStorage.getItem('checkoutOrder');
    
    if (storedOrder) {
        orderData = JSON.parse(storedOrder);
        updateOrderSummary();
    } else {
        orderData = {
            title: "Elite Branding & Identity System",
            packageName: "Startup Foundation",
            price: 150,
            gigId: 1,
            seller: "Vector Aura"
        };
        updateOrderSummary();
    }
}

function updateOrderSummary() {
    const titleElement = document.getElementById('order-title');
    const packageElement = document.getElementById('order-package');
    const basePriceElement = document.getElementById('base-price');
    const totalElement = document.getElementById('total-amount');
    
    if (titleElement) titleElement.textContent = orderData.title || "Web Development";
    if (packageElement) packageElement.textContent = orderData.packageName || "Premium Package";
    
    const totalPrice = orderData.price || 524;
    const basePrice = totalPrice - 25;
    
    if (basePriceElement) basePriceElement.textContent = `$${basePrice}`;
    if (totalElement) totalElement.textContent = `$${totalPrice}`;
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function goBack() {
    window.history.back();
}

function goToOrders() {
    window.location.href = 'orders.html';
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function goToOrderTracking(orderId) {
    window.location.href = `order-tracking.html?id=${orderId}`;
}

// ============================================
// TOAST FUNCTION
// ============================================
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// PAYMENT METHOD TOGGLE
// ============================================
function initPaymentMethods() {
    const methods = document.querySelectorAll(".method");
    const cardFields = document.getElementById('card-fields');
    const paypalFields = document.getElementById('paypal-fields');
    const appleFields = document.getElementById('apple-fields');
    const walletFields = document.getElementById('wallet-fields');

    methods.forEach(method => {
        method.addEventListener("click", () => {
            methods.forEach(m => m.classList.remove("active"));
            method.classList.add("active");
            
            const methodType = method.getAttribute('data-method');
            selectedMethod = methodType;
            
            cardFields.style.display = 'none';
            paypalFields.style.display = 'none';
            appleFields.style.display = 'none';
            walletFields.style.display = 'none';
            
            if (methodType === 'card') {
                cardFields.style.display = 'block';
            } else if (methodType === 'paypal') {
                paypalFields.style.display = 'block';
            } else if (methodType === 'apple') {
                appleFields.style.display = 'block';
            } else if (methodType === 'wallet') {
                walletFields.style.display = 'block';
                updateWalletStatus();
            }
        });
    });
}

// ============================================
// APPLE PAY VERIFICATION
// ============================================
function initApplePay() {
    const appleVerifyBtn = document.getElementById('apple-verify-btn');
    if (appleVerifyBtn) {
        appleVerifyBtn.addEventListener('click', () => {
            appleVerifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            appleVerifyBtn.disabled = true;
            
            setTimeout(() => {
                appleVerified = true;
                appleVerifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verified!';
                appleVerifyBtn.style.background = '#10b981';
                
                const statusDiv = document.getElementById('apple-verified-status');
                statusDiv.innerHTML = '<div class="verified-badge"><i class="fas fa-check-circle"></i> Identity Verified Successfully</div>';
                
                showToast('Apple Pay verification successful!', 'success');
            }, 1500);
        });
    }
}

// ============================================
// WALLET STATUS
// ============================================
function updateWalletStatus() {
    const totalAmount = getTotalAmount();
    const walletStatus = document.getElementById('wallet-status');
    if (walletBalance >= totalAmount) {
        walletStatus.innerHTML = '<div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); border-radius: 12px; padding: 10px; text-align: center; font-size: 0.75rem; color: var(--success); margin-top: 10px;"><i class="fas fa-check-circle"></i> Sufficient balance! You can pay with your wallet.</div>';
    } else {
        walletStatus.innerHTML = `<div style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--error); border-radius: 12px; padding: 10px; text-align: center; font-size: 0.75rem; color: var(--error); margin-top: 10px;"><i class="fas fa-exclamation-triangle"></i> Insufficient balance! You need $${(totalAmount - walletBalance).toFixed(2)} more.</div>`;
    }
}

// ============================================
// VALIDATION FUNCTIONS - FIXED
// ============================================
function validateCardPayment() {
    const cardName = document.getElementById('card-name')?.value.trim() || '';
    const cardNumber = document.getElementById('card-number')?.value.trim() || '';
    const cardExpiry = document.getElementById('card-expiry')?.value.trim() || '';
    const cardCvv = document.getElementById('card-cvv')?.value.trim() || '';
    
    if (!cardName) {
        showToast('Please enter cardholder name', 'error');
        return false;
    }
    if (!cardNumber) {
        showToast('Please enter card number', 'error');
        return false;
    }
    if (cardNumber.replace(/\s/g, '').length < 16) {
        showToast('Please enter a valid 16-digit card number', 'error');
        return false;
    }
    if (!cardExpiry) {
        showToast('Please enter expiry date', 'error');
        return false;
    }
    if (!cardCvv) {
        showToast('Please enter CVV', 'error');
        return false;
    }
    if (cardCvv.length < 3) {
        showToast('CVV must be 3 or 4 digits', 'error');
        return false;
    }
    return true;
}

function validatePaypalPayment() {
    const paypalEmail = document.getElementById('paypal-email')?.value.trim() || '';
    const paypalPassword = document.getElementById('paypal-password')?.value.trim() || '';
    
    if (!paypalEmail) {
        showToast('Please enter PayPal email', 'error');
        return false;
    }
    if (!paypalEmail.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }
    if (!paypalPassword) {
        showToast('Please enter PayPal password', 'error');
        return false;
    }
    return true;
}

function validateApplePayment() {
    if (!appleVerified) {
        showToast('Please verify your identity with Apple Pay first', 'error');
        return false;
    }
    return true;
}

function validateWalletPayment() {
    const walletPin = document.getElementById('wallet-pin')?.value.trim() || '';
    const totalAmount = getTotalAmount();
    
    if (!walletPin) {
        showToast('Please enter your wallet PIN', 'error');
        return false;
    }
    if (walletPin.length !== 4) {
        showToast('PIN must be 4 digits', 'error');
        return false;
    }
    if (walletBalance < totalAmount) {
        showToast(`Insufficient wallet balance! Available: $${walletBalance.toFixed(2)}`, 'error');
        return false;
    }
    return true;
}

// ============================================
// MAIN PROCESS PAYMENT FUNCTION - FIXED
// ============================================
function processPayment() {
    console.log('Processing payment for method:', selectedMethod);
    
    if (selectedMethod === 'card') {
        return validateCardPayment();
    } 
    else if (selectedMethod === 'paypal') {
        return validatePaypalPayment();
    } 
    else if (selectedMethod === 'apple') {
        return validateApplePayment();
    } 
    else if (selectedMethod === 'wallet') {
        return validateWalletPayment();
    }
    
    showToast('Please select a payment method', 'error');
    return false;
}

// ============================================
// EXECUTE PAYMENT
// ============================================
function executePayment() {
    const totalAmount = getTotalAmount();
    const orderId = Math.floor(Math.random() * 10000) + 1000;
    
    if (selectedMethod === 'wallet') {
        walletBalance -= totalAmount;
        localStorage.setItem('walletBalance', walletBalance);
        const walletElement = document.getElementById('wallet-balance-amount');
        if (walletElement) {
            walletElement.textContent = `$${walletBalance.toFixed(2)}`;
        }
        showToast(`$${totalAmount.toFixed(2)} deducted from your wallet!`, 'success');
    } else if (selectedMethod === 'card') {
        showToast('Payment processed successfully via Card!', 'success');
    } else if (selectedMethod === 'paypal') {
        showToast('Payment processed successfully via PayPal!', 'success');
    } else if (selectedMethod === 'apple') {
        showToast('Payment processed successfully via Apple Pay!', 'success');
    }
    
    // Store order in localStorage for tracking page
    const newOrder = {
        id: orderId,
        title: orderData?.title || "Web Development",
        packageName: orderData?.packageName || "Premium Package",
        amount: totalAmount,
        status: "In Progress",
        date: new Date().toISOString(),
        seller: orderData?.seller || "Vector Aura"
    };
    
    let orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    orders.unshift(newOrder);
    localStorage.setItem('userOrders', JSON.stringify(orders));
    
    // Clear checkout data
    localStorage.removeItem('checkoutOrder');
    
    return orderId;
}

// ============================================
// PAY BUTTON ACTION - FIXED
// ============================================
function initPayButton() {
    const payBtn = document.getElementById('pay-btn');
    if (!payBtn) return;
    
    payBtn.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Prevent multiple clicks
        if (isProcessing) {
            showToast('Payment already in progress...', 'warning');
            return;
        }
        
        // VALIDATE FIRST
        const isValid = processPayment();
        console.log('Validation result:', isValid);
        
        if (!isValid) {
            return; // Stop here if validation fails
        }
        
        // Start processing
        isProcessing = true;
        const originalText = payBtn.innerHTML;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        payBtn.disabled = true;
        
        // Execute payment after delay
        setTimeout(() => {
            try {
                const orderId = executePayment();
                console.log('Payment successful, Order ID:', orderId);
                
                payBtn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Successful!';
                payBtn.classList.add('success');
                
                // Redirect to order tracking page
                setTimeout(() => {
                    window.location.href = `order-tracking.html?id=${orderId}`;
                }, 1500);
                
            } catch (error) {
                console.error('Payment error:', error);
                showToast('Payment failed. Please try again.', 'error');
                payBtn.innerHTML = originalText;
                payBtn.disabled = false;
                isProcessing = false;
            }
        }, 1500);
    });
}

// ============================================
// CARD INPUT FORMATTING
// ============================================
function initCardFormatting() {
    const cardInput = document.getElementById('card-number');
    if (cardInput) {
        cardInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "").substring(0, 16);
            let formatted = value.match(/.{1,4}/g);
            e.target.value = formatted ? formatted.join(" ") : "";
        });
    }

    const expiryInput = document.getElementById('card-expiry');
    if (expiryInput) {
        expiryInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "").substring(0, 4);
            if (value.length > 2) {
                e.target.value = value.substring(0, 2) + " / " + value.substring(2, 4);
            } else {
                e.target.value = value;
            }
        });
    }

    const cvvInput = document.getElementById('card-cvv');
    if (cvvInput) {
        cvvInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
        });
    }

    const walletPinInput = document.getElementById('wallet-pin');
    if (walletPinInput) {
        walletPinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }
}

// ============================================
// LOAD SAVED DATA
// ============================================
function loadSavedData() {
    const savedBalance = localStorage.getItem('walletBalance');
    if (savedBalance) {
        walletBalance = parseFloat(savedBalance);
    }

    const walletBalanceElement = document.getElementById('wallet-balance-amount');
    if (walletBalanceElement) {
        walletBalanceElement.textContent = `$${walletBalance.toFixed(2)}`;
    }

    // Set default active method
    const defaultMethod = document.querySelector('[data-method="card"]');
    if (defaultMethod) {
        defaultMethod.classList.add('active');
    }
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page loaded');
    loadUserData();
    loadOrderFromStorage();
    loadSavedData();
    initPaymentMethods();
    initApplePay();
    initCardFormatting();
    initPayButton();
});