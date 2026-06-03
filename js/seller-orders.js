// ============================================
// SELLER ORDERS - SELLER DASHBOARD
// ============================================

const ORDER_API = '/Taskly/controllers/OrderController.php';

let sellerOrders  = [];
let currentOrderFilter = 'all';


// ============================================
// LOAD ORDERS FROM DATABASE
// ============================================
async function loadSellerOrders() {
    const listEl = document.getElementById('orders-list');
    if (!listEl) return;

    listEl.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading orders...</p>
        </div>`;

    try {
        const response = await fetch(`${ORDER_API}?action=seller_orders`);
        const result   = await response.json();

        if (result.success) {
            sellerOrders = result.data;
            updateOrderStats();
            filterOrders(currentOrderFilter);
        } else {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${result.message || 'Failed to load orders'}</p>
                </div>`;
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Connection error</p>
            </div>`;
    }
}

// ============================================
// UPDATE STATS CARDS
// ============================================
function updateOrderStats() {
    const total     = document.getElementById('total-orders-card');
    const active    = document.getElementById('active-orders-count');
    const completed = document.getElementById('completed-count');
    const awaiting  = document.getElementById('awaiting-count');

    if (total)     total.innerText     = sellerOrders.length;
    if (active)    active.innerText    = sellerOrders.filter(o => o.status === 'in_progress' || o.status === 'in_revision' || o.status === 'delivered').length;
    if (completed) completed.innerText = sellerOrders.filter(o => o.status === 'completed').length;
    if (awaiting)  awaiting.innerText  = sellerOrders.filter(o => o.status === 'awaiting_requirements').length;
}

// ============================================
// STATUS DISPLAY MAP
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
    if (status === 'awaiting_requirements')                          return 'awaiting';
    if (status === 'in_progress' || status === 'in_revision' || status === 'delivered') return 'active';
    if (status === 'completed')                                      return 'completed';
    if (status === 'cancelled')                                      return 'cancelled';
    return 'active';
}

// ============================================
// FILTER & RENDER ORDERS
// ============================================
function filterOrders(filter) {
    currentOrderFilter = filter;

    // Update active tab
    document.querySelectorAll('#orders-tab .tab-item').forEach(tab => {
        tab.classList.remove('active');
        if (tab.innerText.trim().toLowerCase().includes(filter === 'awaiting' ? 'awaiting' : filter)) {
            tab.classList.add('active');
        }
    });

    renderOrders(filter);
}

function renderOrders(filter) {
    const listEl = document.getElementById('orders-list');
    if (!listEl) return;

    const filtered = filter === 'all' 
             ? sellerOrders 
             : sellerOrders.filter(o => getFilterCode(o.status) === filter);
    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No ${filter} orders</p>
                <span>Orders will appear here when buyers place them</span>
            </div>`;
        return;
    }

    listEl.innerHTML = filtered.map(order => {
        const statusDisplay = getStatusDisplay(order.status);
        const deadline      = order.deadline
            ? new Date(order.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'No deadline';

        const buyerAvatar = (order.buyer_avatar && order.buyer_avatar !== 'null')
            ? order.buyer_avatar
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(order.buyer_name || 'B')}&background=7c3aed&color=fff&size=40`;

            

        return `
            <div class="order-card" onclick="goToOrderTracking(${order.id})">
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
                            <img src="${buyerAvatar}" onerror="this.src='https://ui-avatars.com/api/?name=B&background=7c3aed&color=fff&size=40'">
                            <span>${escapeHtml(order.buyer_name)}</span>
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
// NAVIGATION
// ============================================
function goToOrderTracking(orderId) {
    window.location.href = `freelancerOrderTracking.html?id=${orderId}`;
}

// ============================================
// HELPERS
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}