// ============================================
// ADMIN USERS TAB - REAL DATA FROM DATABASE
// ============================================

const USER_API = '/Taskly/controllers/UserController.php';

let currentUserFilter = 'sellers';
let allSellers = [];
let allBuyers = [];

// ============================================
// LOAD USERS BASED ON FILTER
// ============================================
async function loadUsers(type) {
    currentUserFilter = type;
    
    // Update active tab
    document.querySelectorAll('.user-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });
    
    const container = document.getElementById('usersList');
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Loading...</div>';
    
    try {
        let url = type === 'sellers' 
            ? `${USER_API}?action=get_sellers`
            : `${USER_API}?action=get_buyers`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            if (type === 'sellers') {
                allSellers = result.data;
                renderSellers(allSellers);
            } else {
                allBuyers = result.data;
                renderBuyers(allBuyers);
            }
        } else {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>${result.message || 'Failed to load users'}</p></div>`;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Connection error</p></div>';
    }
}

// ============================================
// RENDER SELLERS LIST - SIMPLE VERSION
// ============================================
function renderSellers(sellers) {
    const container = document.getElementById('usersList');
    
    if (!sellers || sellers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No sellers found</p></div>';
        return;
    }
    
    container.innerHTML = sellers.map(seller => {
        const avatarHtml = seller.picture_name 
            ? `<div class="user-row-avatar" style="background-image: url('/Taskly/avatars/sellers/${seller.picture_name}'); background-size: cover;">&nbsp;</div>`
            : `<div class="user-row-avatar">${(seller.name || 'S').charAt(0).toUpperCase()}</div>`;
        
        return `
            <div class="user-row" data-user-id="${seller.id}">
                <div class="user-row-info">
                    ${avatarHtml}
                    <div class="user-row-details">
                        <h4>${escapeHtml(seller.name)}</h4>
                        <p>${escapeHtml(seller.email)}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <span class="user-row-status ${seller.is_active ? 'status-active' : 'status-suspended'}">
                        ${seller.is_active ? 'Active' : 'Suspended'}
                    </span>
                    <div class="user-row-actions">
                        <button class="btn-icon" onclick="toggleUserStatus(${seller.id}, ${seller.is_active ? 0 : 1})">
                            <i class="fas ${seller.is_active ? 'fa-pause' : 'fa-play'}"></i> 
                            ${seller.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button class="btn-icon delete-btn" onclick="deleteUser(${seller.id}, '${escapeHtml(seller.name)}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// RENDER BUYERS LIST - SIMPLE VERSION
// ============================================
function renderBuyers(buyers) {
    const container = document.getElementById('usersList');
    
    if (!buyers || buyers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No buyers found</p></div>';
        return;
    }
    
    container.innerHTML = buyers.map(buyer => {
        const avatarHtml = buyer.picture_name 
            ? `<div class="user-row-avatar" style="background-image: url('/Taskly/avatars/buyers/${buyer.picture_name}'); background-size: cover;">&nbsp;</div>`
            : `<div class="user-row-avatar">${(buyer.name || 'B').charAt(0).toUpperCase()}</div>`;
        
        return `
            <div class="user-row" data-user-id="${buyer.id}">
                <div class="user-row-info">
                    ${avatarHtml}
                    <div class="user-row-details">
                        <h4>${escapeHtml(buyer.name)}</h4>
                        <p>${escapeHtml(buyer.email)}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 20px;">
                    <span class="user-row-status ${buyer.is_active ? 'status-active' : 'status-suspended'}">
                        ${buyer.is_active ? 'Active' : 'Suspended'}
                    </span>
                    <div class="user-row-actions">
                        <button class="btn-icon" onclick="toggleUserStatus(${buyer.id}, ${buyer.is_active ? 0 : 1})">
                            <i class="fas ${buyer.is_active ? 'fa-pause' : 'fa-play'}"></i> 
                            ${buyer.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button class="btn-icon delete-btn" onclick="deleteUser(${buyer.id}, '${escapeHtml(buyer.name)}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// TOGGLE USER STATUS (ACTIVATE/SUSPEND)
// ============================================
async function toggleUserStatus(userId, newStatus) {
    const actionText = newStatus === 1 ? 'activate' : 'suspend';
    
    showConfirmModal(
        `${newStatus === 1 ? 'Activate' : 'Suspend'} User`,
        `Are you sure you want to ${actionText} this user?`,
        async () => {
            try {
                const formData = new FormData();
                formData.append('action', 'toggle_status');
                formData.append('user_id', userId);
                formData.append('is_active', newStatus);
                
                const response = await fetch(USER_API, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                if (result.success) {
                    showToast(result.message, 'success');
                    loadUsers(currentUserFilter);
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                showToast('Failed to update user status', 'error');
            }
        }
    );
}

function deleteUser(userId, userName) {
    showConfirmModal(
        'Delete User',
        `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
        async () => {
            try {
                const formData = new FormData();
                formData.append('action', 'delete_user');
                formData.append('user_id', userId);
                
                const response = await fetch(USER_API, {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                if (result.success) {
                    showToast(result.message, 'success');
                    loadUsers(currentUserFilter);
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                showToast('Failed to delete user', 'error');
            }
        },
        'Delete'
    );
}
function filterUsers(type) {
    loadUsers(type);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;'
    })[m]);
}

