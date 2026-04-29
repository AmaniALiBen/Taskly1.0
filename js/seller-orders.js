const sellerOrdersData = [
    {
        id: 1,
        title: "Professional Tech Logo Design",
        buyer: { name: "John Doe", avatar: "https://i.pravatar.cc/100?u=buyer1" },
        amount: 150,
        dueDate: "Apr 25, 2026",
        status: "Awaiting Requirements",
        statusCode: "awaiting",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=400",
        requirementsSubmitted: false
    },
    {
        id: 2,
        title: "Responsive Landing Page Build",
        buyer: { name: "Sarah Johnson", avatar: "https://i.pravatar.cc/100?u=buyer2" },
        amount: 350,
        dueDate: "Apr 28, 2026",
        status: "In Progress",
        statusCode: "active",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400",
        requirementsSubmitted: true
    },
    {
        id: 3,
        title: "10 Social Media Copy Posts",
        buyer: { name: "Michael Chen", avatar: "https://i.pravatar.cc/100?u=buyer3" },
        amount: 120,
        dueDate: "Apr 23, 2026",
        status: "Completed",
        statusCode: "completed",
        image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=400",
        requirementsSubmitted: true
    },
    {
        id: 4,
        title: "E-commerce Website Development",
        buyer: { name: "Emily Watson", avatar: "https://i.pravatar.cc/100?u=buyer4" },
        amount: 850,
        dueDate: "May 5, 2026",
        status: "Awaiting Requirements",
        statusCode: "awaiting",
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400",
        requirementsSubmitted: false
    },
    {
        id: 5,
        title: "Mobile App UI/UX Design",
        buyer: { name: "David Kim", avatar: "https://i.pravatar.cc/100?u=buyer5" },
        amount: 450,
        dueDate: "Apr 30, 2026",
        status: "In Progress",
        statusCode: "active",
        image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=400",
        requirementsSubmitted: true
    }
];

let totalEarnings = 0;
let completedOrders = 0;
let activeOrders = 0;
let awaitingOrders = 0;

function calculateStats() {
    totalEarnings = sellerOrdersData
        .filter(order => order.statusCode === 'completed')
        .reduce((sum, order) => sum + order.amount, 0);
    
    completedOrders = sellerOrdersData.filter(order => order.statusCode === 'completed').length;
    activeOrders = sellerOrdersData.filter(order => order.statusCode === 'active').length;
    awaitingOrders = sellerOrdersData.filter(order => order.statusCode === 'awaiting').length;
    
    document.getElementById('total-earned').textContent = `$${totalEarnings}`;
    document.getElementById('total-earnings-card').textContent = `$${totalEarnings}`;
    document.getElementById('completed-count').textContent = completedOrders;
    document.getElementById('active-orders-count').textContent = activeOrders;
    document.getElementById('awaiting-count').textContent = awaitingOrders;
}

function renderOrders(filter = 'awaiting') {
    const listElement = document.getElementById('orders-list');
    listElement.innerHTML = '';

    const filtered = sellerOrdersData.filter(order => {
        if (filter === 'awaiting') return order.statusCode === 'awaiting';
        if (filter === 'active') return order.statusCode === 'active';
        if (filter === 'completed') return order.statusCode === 'completed';
        if (filter === 'cancelled') return order.statusCode === 'cancelled';
        return true;
    });

    if (filtered.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>No orders found</p>
                <span>You don't have any ${filter} orders yet.</span>
            </div>
        `;
        return;
    }

    filtered.forEach(order => {
        let badgeClass = '';
        switch(order.statusCode) {
            case 'awaiting':
                badgeClass = 'status-awaiting';
                break;
            case 'active':
                badgeClass = 'status-active';
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

        const cardHtml = `
            <div class="order-card" onclick="goToOrder(${order.id})">
                <div class="order-img-container">
                    <img src="${order.image}" class="order-img">
                </div>
                <div class="order-details-flex">
                    <div class="order-main-info">
                        <h3>${order.title}</h3>
                        <div class="buyer">
                            <img src="${order.buyer.avatar}"> <span>${order.buyer.name}</span>
                        </div>
                    </div>
                    <div class="order-meta-group">
                        <div class="meta-item">
                            <span class="label">Amount</span>
                            <span class="value price-value">$${order.amount}</span>
                        </div>
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
        listElement.innerHTML += cardHtml;
    });
}

function filterOrders(type) {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.remove('active');
        if (tab.innerText.toLowerCase().replace(/\s/g, '') === type) tab.classList.add('active');
    });
    renderOrders(type);
}

function goToOrder(orderId) {
    window.location.href = `FreelancerOrderTracking.html?id=${orderId}`;
}

// Add empty state styles
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        text-align: center;
        padding: 60px;
        background: var(--glass-card-bg);
        border-radius: 16px;
        border: 1px solid var(--glass-border);
    }
    .empty-state i {
        font-size: 3rem;
        color: var(--text-secondary);
        margin-bottom: 15px;
        opacity: 0.5;
    }
    .empty-state p {
        font-size: 1.1rem;
        margin-bottom: 5px;
    }
    .empty-state span {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
`;
document.head.appendChild(style);

window.onload = () => {
    calculateStats();
    renderOrders('awaiting');
};