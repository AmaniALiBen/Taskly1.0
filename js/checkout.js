// ============================================
// CHECKOUT.JS - COMPLETE WITH DATABASE INTEGRATION
// ============================================

// ============================================
// API ENDPOINTS
// ============================================
const WALLET_API = '/Taskly/controllers/WalletController.php';
const GIG_API = '/Taskly/controllers/GigController.php';
const ORDERS_API = '/Taskly/controllers/OrderController.php';

// ============================================
// GLOBAL VARIABLES
// ============================================
let orderData = null;
let walletBalance = 0;
let selectedMethod = 'card';
let appleVerified = false;
let toastTimeout;
let isProcessing = false;
let currentUser = null;

// ============================================
// FETCH USER AVATAR FROM DATABASE
// ============================================
async function fetchUserAvatar() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        
        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');
            
            if (avatarImg) {
                if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                    avatarImg.src = data.avatar;
                } else {
                    avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=7c3aed&color=fff&size=100`;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}

// ============================================
// FETCH USER DATA FROM DATABASE
// ============================================
async function fetchUserData() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        
        if (data.loggedIn) {
            currentUser = {
                name: data.username,
                email: data.email,
                role: data.role,
                avatar: data.avatar
            };
            updateUserAvatar();
            
            await loadWalletBalance();
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

function loadUserData() {
    fetchUserData();
    fetchUserAvatar();
}

function updateUserAvatar() {
    const userAvatarImg = document.getElementById('user-avatar-img');
    if (userAvatarImg && currentUser && currentUser.avatar) {
        userAvatarImg.src = currentUser.avatar;
    }
}

// ============================================
// LOAD WALLET BALANCE FROM DATABASE
// ============================================
async function loadWalletBalance() {
    try {
        const response = await fetch(`${WALLET_API}?action=get_data`);
        const data = await response.json();
        
        if (data.success) {
            walletBalance = data.balance;
            
            const walletBalanceElement = document.getElementById('wallet-balance-amount');
            if (walletBalanceElement) {
                walletBalanceElement.textContent = `$${walletBalance.toFixed(2)}`;
            }
            
            updateWalletStatus();
        }
    } catch (error) {
        console.error('Error loading wallet balance:', error);
    }
}

// ============================================
// LOAD ORDER FROM localStorage (بيانات من gig-details)
// ============================================
function loadOrderFromStorage() {
    const storedOrder = localStorage.getItem('checkoutOrder');
    
    if (!storedOrder) {
        showToast('No order information found', 'error');
        setTimeout(() => window.location.href = 'gigs.html', 2000);
        return;
    }
    
    orderData = JSON.parse(storedOrder);
    updateOrderSummary();
}

function updateOrderSummary() {
    const titleElement = document.getElementById('order-title');
    const packageElement = document.getElementById('order-package');
    const totalElement = document.getElementById('total-amount');
    const sellerElement = document.getElementById('order-seller');
    const deliveryElement = document.getElementById('order-delivery');
    const revisionsElement = document.getElementById('order-revisions');
    const featuresContainer = document.getElementById('order-features');
    const orderImage = document.getElementById('order-image');
    
    if (titleElement) titleElement.textContent = orderData.title || "Loading...";
    if (packageElement) packageElement.textContent = orderData.packageName || "Loading...";
    if (sellerElement) sellerElement.textContent = orderData.seller || "Loading...";
    
    if (orderImage && orderData.image) {
        orderImage.src = orderData.image;
        orderImage.alt = orderData.title;
    }
    
    const totalPrice = orderData.price || 0;
    
    // ✅ السعر الكامل بدون أي رسوم
    if (totalElement) totalElement.textContent = `$${totalPrice.toFixed(2)}`;
    
    if (deliveryElement) {
        deliveryElement.innerHTML = `<i class="far fa-clock"></i> ${orderData.delivery || 'Standard Delivery'}`;
    }
    
    if (revisionsElement) {
        revisionsElement.innerHTML = `<i class="fas fa-sync"></i> ${orderData.revisions || '2 Revisions'}`;
    }
    
    if (featuresContainer && orderData.features && orderData.features.length > 0) {
        featuresContainer.innerHTML = orderData.features.map(f => `
            <div><i class="fa fa-check"></i> ${escapeHtml(f)}</div>
        `).join('');
    }
    
    updateWalletStatus();
}

// ============================================
// GET TOTAL AMOUNT
// ============================================
function getTotalAmount() {
    if (orderData && orderData.price && typeof orderData.price === 'number') {
        return orderData.price;
    }
    
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
    
    return 0;
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
                if (statusDiv) {
                    statusDiv.innerHTML = '<div class="verified-badge"><i class="fas fa-check-circle"></i> Identity Verified Successfully</div>';
                }
                
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
    if (walletStatus) {
        if (walletBalance >= totalAmount && totalAmount > 0) {
            walletStatus.innerHTML = '<div style="background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); border-radius: 12px; padding: 10px; text-align: center; font-size: 0.75rem; color: var(--success); margin-top: 10px;"><i class="fas fa-check-circle"></i> Sufficient balance! You can pay with your wallet.</div>';
        } else if (totalAmount > 0) {
            walletStatus.innerHTML = `<div style="background: rgba(239, 68, 68, 0.15); border: 1px solid var(--error); border-radius: 12px; padding: 10px; text-align: center; font-size: 0.75rem; color: var(--error); margin-top: 10px;"><i class="fas fa-exclamation-triangle"></i> Insufficient balance! You need $${(totalAmount - walletBalance).toFixed(2)} more.</div>`;
        }
    }
}

// ============================================
// VALIDATION FUNCTIONS
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
    if (!/^\d+$/.test(walletPin)) {
        showToast('PIN must contain only numbers', 'error');
        return false;
    }
    if (totalAmount <= 0) {
        showToast('Invalid order amount', 'error');
        return false;
    }
    if (walletBalance < totalAmount) {
        showToast(`Insufficient balance! Available: $${walletBalance.toFixed(2)}`, 'error');
        return false;
    }
    
    return true;
}

// ============================================
// PROCESS WALLET PAYMENT
// ============================================
async function processWalletPayment(amount, pin) {
    try {
        const response = await fetch(`${WALLET_API}?action=withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount: amount, 
                pin: pin, 
                account: `Payment for gig #${orderData?.gigId} - ${orderData?.packageName}`
            })
        });
        const data = await response.json();
        
        if (data.success) {
            showToast(`Payment of $${amount.toFixed(2)} completed successfully!`, 'success');
            return true;
        } else {
            showToast(data.message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Wallet payment error:', error);
        showToast('Payment failed. Please try again.', 'error');
        return false;
    }
}

// ============================================
// PROCESS PAYMENT (Main entry point)
// ============================================
async function processPayment() {
    if (selectedMethod === 'wallet') {
        const isValid = validateWalletPayment();
        if (!isValid) return false;
        
        const totalAmount = getTotalAmount();
        const pin = document.getElementById('wallet-pin').value.trim();
        
        return await processWalletPayment(totalAmount, pin);
    } 
    else if (selectedMethod === 'card') {
        return validateCardPayment();
    } 
    else if (selectedMethod === 'paypal') {
        return validatePaypalPayment();
    } 
    else if (selectedMethod === 'apple') {
        return validateApplePayment();
    }
    
    showToast('Please select a payment method', 'error');
    return false;
}

// ============================================
// CREATE ORDER IN DATABASE AFTER PAYMENT
// ============================================
async function createOrderInDatabase(paymentMethod) {
    if (!orderData) {
        console.error('No order data available');
        return null;
    }
    
    const orderPayload = {
        gig_id: orderData.gigId,
        package_id: orderData.packageId,
        seller_id: orderData.sellerId,
        amount: orderData.price,
        payment_method: paymentMethod
    };
    
    console.log('Creating order with payload:', orderPayload);
    
    try {
        const response = await fetch(`${ORDERS_API}?action=create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const data = await response.json();
        
        console.log('Order creation response:', data);
        
        if (data.success) {
            return data.order_id;
        } else {
            console.error('Failed to create order:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Error creating order:', error);
        return null;
    }
}

// ============================================
// CREATE LOCAL ORDER (localStorage backup)
// ============================================
function createLocalOrder(orderId, paymentMethod) {
    const totalAmount = getTotalAmount();
    
    const newOrder = {
        id: orderId,
        gigId: orderData?.gigId,
        packageId: orderData?.packageId,
        title: orderData?.title || "Web Development",
        packageName: orderData?.packageName || "Premium Package",
        amount: totalAmount,
        status: "awaiting_requirements",
        date: new Date().toISOString(),
        seller: orderData?.seller || "Vector Aura",
        sellerId: orderData?.sellerId,
        paymentMethod: paymentMethod,
        delivery: orderData?.delivery,
        revisions: orderData?.revisions,
        image: orderData?.image
    };
    
    let orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    orders.unshift(newOrder);
    localStorage.setItem('userOrders', JSON.stringify(orders));
    
    localStorage.removeItem('checkoutOrder');
}

// ============================================
// PAY BUTTON ACTION
// ============================================
function initPayButton() {
    const payBtn = document.getElementById('pay-btn');
    if (!payBtn) return;
    
    payBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        if (isProcessing) {
            showToast('Payment already in progress...', 'warning');
            return;
        }
        
        const isValid = await processPayment();
        
        if (!isValid) {
            return;
        }
        
        isProcessing = true;
        const originalText = payBtn.innerHTML;
        payBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        payBtn.disabled = true;
        
        setTimeout(async () => {
            try {
                // إنشاء الطلب في قاعدة البيانات
                let dbOrderId = await createOrderInDatabase(selectedMethod);
                
                console.log('Database order ID:', dbOrderId);
                
                if (!dbOrderId) {
                    dbOrderId = Math.floor(Math.random() * 10000) + 1000;
                    console.log('Using fallback order ID:', dbOrderId);
                }
                
                createLocalOrder(dbOrderId, selectedMethod);
                
                if (selectedMethod === 'wallet') {
                    await loadWalletBalance();
                }
                
                payBtn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Successful!';
                payBtn.classList.add('success');
                
                setTimeout(() => {
                    window.location.href = `order-tracking.html?id=${dbOrderId}`;
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
        walletPinInput.type = 'password';
        walletPinInput.setAttribute('inputmode', 'numeric');
        walletPinInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
        walletPinInput.addEventListener('keypress', (e) => {
            return e.charCode >= 48 && e.charCode <= 57;
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

    const defaultMethod = document.querySelector('[data-method="card"]');
    if (defaultMethod) {
        defaultMethod.classList.add('active');
    }
}

// ============================================
// HELPER FUNCTION
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    fetchUserAvatar();
    console.log('Checkout page loaded');
    loadUserData();
    loadOrderFromStorage();
    await loadWalletBalance();
    loadSavedData();
    initPaymentMethods();
    initApplePay();
    initCardFormatting();
    initPayButton();
});