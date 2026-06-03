// ========================================
// SELLER ORDERS - WITH DATABASE INTEGRATION
// ========================================

const ORDERS_API = '/Taskly/controllers/OrderController.php';

let sellerOrdersData = [];
let currentOrderFilter = 'all';

// ========================================
// LOAD SELLER ORDERS FROM DATABASE
// ========================================
async function loadSellerOrders() {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading orders...</p></div>';
    
    try {
        const response = await fetch(`${ORDERS_API}?action=seller_orders`);
        const result = await response.json();
        
        if (result.success && result.data) {
            // ✅ لا نقوم بتصفية الطلبات الملغاة - تظهر كل الطلبات
            sellerOrdersData = result.data;
            console.log('Seller orders loaded:', sellerOrdersData);
            updateSellerStats();
            renderSellerOrders(currentOrderFilter);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No orders found</p></div>';
        }
    } catch (error) {
        console.error('Error loading seller orders:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading orders</p></div>';
    }
}

// ========================================
// UPDATE SELLER STATS
// ========================================
function updateSellerStats() {
    const totalOrders = sellerOrdersData.length;
    const activeOrders = sellerOrdersData.filter(o => o.status === 'in_progress' || o.status === 'delivered').length;
    const completedOrders = sellerOrdersData.filter(o => o.status === 'completed').length;
    const awaitingOrders = sellerOrdersData.filter(o => o.status === 'awaiting_requirements').length;
    const cancelledOrders = sellerOrdersData.filter(o => o.status === 'cancelled').length;
    
    const totalEarned = sellerOrdersData
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.price || 0), 0);
    
    const totalOrdersCard = document.getElementById('total-orders-card');
    const activeOrdersCount = document.getElementById('active-orders-count');
    const completedCount = document.getElementById('completed-count');
    const awaitingCount = document.getElementById('awaiting-count');
    const totalEarnedElement = document.getElementById('total-earned');
    
    if (totalOrdersCard) totalOrdersCard.textContent = totalOrders;
    if (activeOrdersCount) activeOrdersCount.textContent = activeOrders;
    if (completedCount) completedCount.textContent = completedOrders;
    if (awaitingCount) awaitingCount.textContent = awaitingOrders;
    if (totalEarnedElement) totalEarnedElement.textContent = `$${totalEarned.toFixed(2)}`;
}

// ========================================
// RENDER SELLER ORDERS
// ========================================
function renderSellerOrders(filter = 'all') {
    const container = document.getElementById('orders-list');
    if (!container) return;
    
    let filtered = [...sellerOrdersData];
    
    switch(filter) {
        case 'awaiting':
            filtered = sellerOrdersData.filter(o => o.status === 'awaiting_requirements');
            break;
        case 'active':
            filtered = sellerOrdersData.filter(o => o.status === 'in_progress' || o.status === 'delivered');
            break;
        case 'completed':
            filtered = sellerOrdersData.filter(o => o.status === 'completed');
            break;
        case 'cancelled':
            filtered = sellerOrdersData.filter(o => o.status === 'cancelled');
            break;
        case 'all':
        default:
            filtered = sellerOrdersData;
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No orders found</p>
                <span>You don't have any ${filter} orders yet.</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(order => {
        let badgeClass = '';
        let statusText = '';
        let isCancelled = (order.status === 'cancelled');
        
        switch(order.status) {
            case 'awaiting_requirements':
                badgeClass = 'status-awaiting';
                statusText = 'Awaiting Requirements';
                break;
            case 'in_progress':
                badgeClass = 'status-active';
                statusText = 'In Progress';
                break;
            case 'delivered':
                badgeClass = 'status-active';
                statusText = 'Delivered';
                break;
            case 'completed':
                badgeClass = 'status-completed';
                statusText = 'Completed';
                break;
            case 'cancelled':
                badgeClass = 'status-cancelled';
                statusText = 'Cancelled';
                break;
            default:
                badgeClass = 'status-awaiting';
                statusText = order.status || 'Unknown';
        }
        
        const deadlineDate = order.deadline ? new Date(order.deadline).toLocaleDateString() : '-';
        const orderImage = order.gig_image || '../images/default-gig.jpg';
        
        // ✅ إذا كان الطلب ملغى، نضيف cursor: default و no onclick
        const onclickAttr = isCancelled ? '' : `onclick="goToOrder(${order.id})"`;
        const cursorStyle = isCancelled ? 'cursor: default; opacity: 0.7;' : 'cursor: pointer;';
        
        return `
            <div class="order-card" style="${cursorStyle}" ${onclickAttr}>
                <div class="order-img-container">
                    <img src="${orderImage}" class="order-img" alt="${escapeHtml(order.gig_title)}">
                </div>
                <div class="order-details-flex">
                    <div class="order-main-info">
                        <h3>${escapeHtml(order.gig_title || 'Gig Title')}</h3>
                        <div class="buyer">
                            <img src="${order.buyer_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(order.buyer_name || 'B') + '&background=7c3aed&color=fff'}" onerror="this.src='https://ui-avatars.com/api/?name=B&background=7c3aed&color=fff'">
                            <span>${escapeHtml(order.buyer_name || 'Buyer')}</span>
                        </div>
                    </div>
                    <div class="order-meta-group">
                        <div class="meta-item">
                            <span class="label">Amount</span>
                            <span class="value price-value">$${parseFloat(order.price || 0).toFixed(2)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="label">Due Date</span>
                            <span class="value">${deadlineDate}</span>
                        </div>
                        <div class="status-badge ${badgeClass}">
                            ${statusText}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// FILTER ORDERS
// ========================================
function filterOrders(type) {
    currentOrderFilter = type;
    
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
        if (tab.innerText.toLowerCase().replace(/\s/g, '') === type || 
            (type === 'all' && tab.innerText === 'All')) {
            tab.classList.add('active');
        }
    });
    
    renderSellerOrders(type);
}

// ========================================
// GO TO ORDER DETAILS
// ========================================
function goToOrder(orderId) {
    window.location.href = `FreelancerOrderTracking.html?id=${orderId}`;
}

// ========================================
// INITIALIZE SELLER ORDERS
// ========================================
function initSellerOrders() {
    loadSellerOrders();
}

// ========================================
// HELPER FUNCTION
// ========================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}