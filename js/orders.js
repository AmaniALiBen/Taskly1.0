const ordersData = [
    {
        id: 1,
        title: "Professional Tech Logo Design",
        seller: { name: "Ahmed M.", avatar: "https://i.pravatar.cc/100?u=9" },
        dueDate: "Apr 25, 2026",
        status: "In Progress",
        statusCode: "active",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=400"
    },
    {
        id: 2,
        title: "Responsive Landing Page Build",
        seller: { name: "Sara Ali", avatar: "https://i.pravatar.cc/100?u=5" },
        dueDate: "Apr 28, 2026",
        status: "Awaiting Info",
        statusCode: "warning",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400"
    },
    {
        id: 3,
        title: "10 Social Media Copy Posts",
        seller: { name: "Khaled M.", avatar: "https://i.pravatar.cc/100?u=12" },
        dueDate: "Apr 23, 2026",
        status: "Delivered",
        statusCode: "completed",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=400"
    },
    {
        id: 4,
        title: "E-commerce Website Development",
        seller: { name: "Omar K.", avatar: "https://i.pravatar.cc/100?u=8" },
        dueDate: "May 10, 2026",
        status: "Cancelled",
        statusCode: "cancelled",
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400"
    }
];

// Load user avatar from localStorage
function loadUserAvatar() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        const user = JSON.parse(userData);
        const avatarImg = document.getElementById('user-avatar-img');
        if (avatarImg && user.avatar) {
            avatarImg.src = user.avatar;
        }
    }
}

function goBack() {
    window.history.back();
}

function renderOrders(filter = 'active') {
    const listElement = document.getElementById('orders-list');
    if (!listElement) return;
    
    // Show loading state
    listElement.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Loading orders...</p></div>';

    setTimeout(() => {
        let filtered = [];
        
        if (filter === 'active') {
            filtered = ordersData.filter(order => order.statusCode === 'active' || order.statusCode === 'warning');
        } else {
            filtered = ordersData.filter(order => order.statusCode === filter);
        }

        if (filtered.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No ${filter} orders</p>
                    <span>You don't have any ${filter} orders yet.</span>
                </div>
            `;
            return;
        }

        listElement.innerHTML = filtered.map(order => {
            let badgeClass = '';
            switch(order.statusCode) {
                case 'active':
                    badgeClass = 'status-active';
                    break;
                case 'warning':
                    badgeClass = 'status-warning';
                    break;
                case 'completed':
                    badgeClass = 'status-completed';
                    break;
                case 'cancelled':
                    badgeClass = 'status-cancelled';
                    break;
                default:
                    badgeClass = 'status-active';
            }

            return `
                <div class="order-card" onclick="goToOrder(${order.id})">
                    <div class="order-img-container">
                        <img src="${order.image}" class="order-img" alt="${order.title}">
                    </div>
                    <div class="order-details-flex">
                        <div class="order-main-info">
                            <h3>${order.title}</h3>
                            <div class="seller">
                                <img src="${order.seller.avatar}"> <span>${order.seller.name}</span>
                            </div>
                        </div>
                        <div class="order-meta-group">
                            <div class="meta-item">
                                <span class="label">Due Date</span>
                                <span class="value">${order.dueDate}</span>
                            </div>
                            <div class="status-badge ${badgeClass}">
                                ${order.status}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }, 300);
}

function filterOrders(type) {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
        if (tab.innerText.toLowerCase() === type) tab.classList.add('active');
    });
    renderOrders(type);
}

function goToOrder(orderId) {
    // Fixed: Changed from order_tracking.html to order-tracking.html
    window.location.href = `order-tracking.html?id=${orderId}`;
}

// Load user avatar on page load
window.onload = () => {
    loadUserAvatar();
    renderOrders('active');
};