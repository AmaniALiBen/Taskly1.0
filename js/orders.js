// ============================================
// ORDERS PAGE - BUYER SIDE
// ============================================

const ORDER_API = '/Taskly/controllers/OrderController.php';

let allOrders     = [];
let currentFilter = 'active';

// ============================================
// FETCH USER AVATAR
// ============================================
async function fetchUserAvatar() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data     = await response.json();

        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');
            if (avatarImg) {
                avatarImg.src = (data.avatar && data.avatar !== 'null')
                    ? data.avatar
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}&background=7c3aed&color=fff&size=100`;
            }
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

// ============================================
// FETCH ORDERS FROM DATABASE
// ============================================
async function fetchOrders() {
    const listElement = document.getElementById('orders-list');
    if (!listElement) return;

    listElement.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading orders...</p>
        </div>`;

    try {
        const response = await fetch(`${ORDER_API}?action=my_orders`);
        const result   = await response.json();

        if (result.success) {
            allOrders = result.data;
            renderOrders(currentFilter);
        } else {
            listElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${result.message || 'Failed to load orders'}</p>
                </div>`;
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        listElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Connection error</p>
            </div>`;
    }
}

// ============================================
// MAP STATUS TO DISPLAY
// ============================================
function getStatusDisplay(status) {
    const map = {
        'awaiting_requirements': { label: 'Awaiting Requirements', code: 'warning'   },
        'in_progress':           { label: 'In Progress',           code: 'active'    },
        'delivered':             { label: 'Delivered',             code: 'completed' },
        'in_revision':           { label: 'In Revision',           code: 'warning'   },
        'completed':             { label: 'Completed',             code: 'completed' },
        'cancelled':             { label: 'Cancelled',             code: 'cancelled' }
    };
    return map[status] || { label: status, code: 'active' };
}

function getFilterCode(status) {
    const activeStatuses = ['awaiting_requirements', 'in_progress', 'in_revision', 'delivered'];
    if (activeStatuses.includes(status)) return 'active';
    return status; // 'completed' or 'cancelled'
}

// ============================================
// RENDER ORDERS
// ============================================
function renderOrders(filter = 'active') {
    currentFilter     = filter;
    const listElement = document.getElementById('orders-list');
    if (!listElement) return;

    const filtered = allOrders.filter(order => getFilterCode(order.status) === filter);

    if (filtered.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No ${filter} orders</p>
                <span>You don't have any ${filter} orders yet.</span>
            </div>`;
        return;
    }

    listElement.innerHTML = filtered.map(order => {
        const statusDisplay = getStatusDisplay(order.status);
        const deadline      = order.deadline
            ? new Date(order.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'No deadline';

        const sellerAvatar = (order.seller_avatar && order.seller_avatar !== 'null')
            ? order.seller_avatar
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(order.seller_name || 'S')}&background=7c3aed&color=fff&size=40`;

        return `
            <div class="order-card" onclick="goToOrder(${order.id})">
                <div class="order-img-container">
                    <img src="${order.gig_image || '/Taskly/images/default-gig.jpg'}"
                         class="order-img"
                         alt="${escapeHtml(order.gig_title)}"
                         onerror="this.src='/Taskly/images/default-gig.jpg'">
                </div>
                <div class="order-details-flex">
                    <div class="order-main-info">
                        <h3>${escapeHtml(order.gig_title)}</h3>
                        <div class="seller">
                            <img src="${sellerAvatar}" onerror="this.src='https://ui-avatars.com/api/?name=S&background=7c3aed&color=fff&size=40'">
                            <span>${escapeHtml(order.seller_name)}</span>
                        </div>
                    </div>
                    <div class="order-meta-group">
                        <div class="meta-item">
                            <span class="label">Due Date</span>
                            <span class="value">${deadline}</span>
                        </div>
                        <div class="status-badge status-${statusDisplay.code}">
                            ${statusDisplay.label}
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// ============================================
// FILTER TABS
// ============================================
function filterOrders(type) {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
        if (tab.innerText.toLowerCase() === type) tab.classList.add('active');
    });
    renderOrders(type);
}

// ============================================
// NAVIGATION
// ============================================
function goToOrder(orderId) {
    window.location.href = `order-tracking.html?id=${orderId}`;
}

function goBack() {
    window.history.back();
}

// ============================================
// HELPERS
// ============================================
function escapeHtml(value) {
    if (!value) return '';
    return String(value).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    fetchUserAvatar();
    fetchOrders();
});