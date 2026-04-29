// ========================================
// ADMIN DASHBOARD - FIXED VERSION
// ========================================

let categoriesData = [
    { id: 1, name: "Programming & Tech", icon: "fa-code", subcategories: [
        { id: 101, name: "Website Development", gigs: [
            { id: 1001, title: "Full Stack Website", description: "Complete website with React", price: 499, delivery: 7, seller: "Ahmed", rating: 4.9, orders: 127 }
        ]},
        { id: 102, name: "Mobile App", gigs: [
            { id: 2001, title: "React Native App", description: "Cross-platform app", price: 899, delivery: 14, seller: "Omar", rating: 4.7, orders: 45 }
        ]}
    ]},
    { id: 2, name: "Design & Creative", icon: "fa-paintbrush", subcategories: [
        { id: 201, name: "UI/UX Design", gigs: [
            { id: 4001, title: "Modern UI/UX Design", description: "Complete interface design", price: 349, delivery: 5, seller: "Fatima", rating: 5.0, orders: 189 }
        ]}
    ]}
];

let usersData = {
    admins: [{ id: 1, name: "Ahmed Admin", email: "ahmed@taskly.com", status: "active", avatar: "A" }],
    sellers: [
        { id: 101, name: "Mohamed Seller", email: "seller1@taskly.com", status: "active", avatar: "M", gigsCount: 12, earnings: 8450 },
        { id: 102, name: "Fatima Designer", email: "fatima@taskly.com", status: "suspended", avatar: "F", gigsCount: 8, earnings: 3200 }
    ],
    customers: [
        { id: 201, name: "Sara Customer", email: "sara@email.com", status: "active", avatar: "S", ordersCount: 12, spent: 2450 },
        { id: 202, name: "Omar Client", email: "omar@email.com", status: "active", avatar: "O", ordersCount: 5, spent: 1200 }
    ]
};

let reportsData = [
    { id: 1, gigId: 1001, gigTitle: "Full Stack Website", reportedBy: "sara@email.com", reason: "Inappropriate content",  date: "2024-01-15" },
    { id: 2, gigId: 4001, gigTitle: "Modern UI/UX Design", reportedBy: "omar@email.com", reason: "Copyright violation", date: "2024-01-14" }
];

let currentUserFilter = "admins";
let currentMainCategory = null;
let currentSubcategory = null;
let selectedReport = null;
let pendingDeleteAction = null;

// ========== CONFIRM MODAL ==========
function showConfirmModal(title, message, onConfirm) {
    pendingDeleteAction = onConfirm;
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    pendingDeleteAction = null;
}

function confirmDelete() {
    if (pendingDeleteAction) {
        pendingDeleteAction();
        closeConfirmModal();
    }
}

// ========== TAB SWITCHING ==========
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.currentTarget.classList.add('active');
    if (tabName === 'users') renderUsers();
    if (tabName === 'categories') renderMainCategories();
    if (tabName === 'reports') renderReportsList();
}

// ========== USERS ==========
let currentAdminId = 1; // ID الأدمن الحالي

// ========== USERS ==========
function filterUsers(type) {
    currentUserFilter = type;
    document.querySelectorAll('.user-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) btn.classList.add('active');
    });
    renderUsers();
}

function renderUsers() {
    const container = document.getElementById('usersList');
    const users = usersData[currentUserFilter];
    if (!users || users.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>No ${currentUserFilter} found</p></div>`;
        return;
    }
    
    // تحديد الـ role بناءً على الفلتر الحالي
    const currentRole = currentUserFilter === 'admins' ? 'admin' : (currentUserFilter === 'sellers' ? 'seller' : 'customer');
    
    container.innerHTML = users.map(user => `
        <div class="user-row">
            <div class="user-row-info">
                <div class="user-row-avatar">${user.avatar}</div>
                <div class="user-row-details">
                    <h4>${escapeHtml(user.name)}</h4>
                    <p>${user.email}</p>
                </div>
                <div class="user-row-stats">
                    ${user.gigsCount ? `<span>📦 ${user.gigsCount} gigs</span>` : ''}
                    ${user.earnings ? `<span>💰 $${user.earnings}</span>` : ''}
                    ${user.ordersCount ? `<span>🛒 ${user.ordersCount} orders</span>` : ''}
                    ${user.spent ? `<span>💸 $${user.spent}</span>` : ''}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 20px;">
                <span class="user-row-status ${user.status === 'active' ? 'status-active' : 'status-suspended'}">
                    ${user.status === 'active' ? 'Active' : 'Suspended'}
                </span>
                <div class="user-row-actions">
                    ${!(currentRole === 'admin' && user.id === currentAdminId) ? `
                        <button class="btn-icon" onclick="toggleUserStatus(${user.id}, '${currentRole}')">
                            <i class="fas ${user.status === 'active' ? 'fa-pause' : 'fa-play'}"></i> ${user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button class="btn-icon danger" onclick="deleteUserWithConfirm(${user.id}, '${currentRole}', '${escapeHtml(user.name)}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// دالة إيقاف وتفعيل الحسابات (تشمل الأدمن)
function toggleUserStatus(id, role) {
    console.log("Toggling user - ID:", id, "Role:", role);
    
    // البحث عن المستخدم حسب دوره
    let user = null;
    if (role === 'admin') {
        user = usersData.admins.find(u => u.id === id);
        // منع تعليق نفس الأدمن
        if (user && user.id === currentAdminId) {
            showToast("You cannot suspend yourself", "error");
            return;
        }
    } else if (role === 'seller') {
        user = usersData.sellers.find(u => u.id === id);
    } else if (role === 'customer') {
        user = usersData.customers.find(u => u.id === id);
    }
    
    if (user) {
        if (user.status === 'active') {
            user.status = 'suspended';
            showToast(`User "${user.name}" has been suspended`, "success");
        } else {
            user.status = 'active';
            showToast(`User "${user.name}" has been activated`, "success");
        }
        renderUsers();
    } else {
        showToast("User not found", "error");
    }
}

// دالة حذف المستخدم (تشمل الأدمن)
function deleteUserWithConfirm(id, role, name) {
    // منع حذف نفس الأدمن
    if (role === 'admin' && id === currentAdminId) {
        showToast("You cannot delete yourself", "error");
        return;
    }
    
    showConfirmModal("Delete User", `Are you sure you want to delete "${name}"? This action cannot be undone.`, () => {
        if (role === 'admin') {
            usersData.admins = usersData.admins.filter(u => u.id !== id);
        } else if (role === 'seller') {
            usersData.sellers = usersData.sellers.filter(u => u.id !== id);
        } else if (role === 'customer') {
            usersData.customers = usersData.customers.filter(u => u.id !== id);
        }
        renderUsers();
        showToast("User deleted successfully", "success");
    });
}

function addAdminOnly() {
    const name = document.getElementById('adminOnlyName').value.trim();
    const email = document.getElementById('adminOnlyEmail').value.trim();
    const password = document.getElementById('adminOnlyPassword').value;
    
    if (!name || !email || !password) return showToast("Fill all fields", "error");
    if (password.length < 6) return showToast("Password must be 6+ chars", "error");
    
    usersData.admins.push({ 
        id: Date.now(), 
        name, 
        email, 
        status: "active", 
        avatar: name.charAt(0).toUpperCase(), 
        role: "admin" 
    });
    
    document.getElementById('adminOnlyName').value = '';
    document.getElementById('adminOnlyEmail').value = '';
    document.getElementById('adminOnlyPassword').value = '';
    if (currentUserFilter === 'admins') renderUsers();
    showToast("Admin added successfully", "success");
}

// عند تحميل الصفحة، تأكد من أن تبويب Users هو النشط
document.addEventListener('DOMContentLoaded', () => {
    // جعل تبويب Users نشطاً
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById('users-tab').classList.add('active');
    document.querySelector('.nav-btn:first-child').classList.add('active');
    setTimeout(() => {
        if (categoriesData.length > 0) {
            viewMainCategory(categoriesData[0].id);
        }
    }, 100);
    // عرض المستخدمين
    renderUsers();
    renderMainCategories();
    renderReportsList();
});





// ========== MAIN CATEGORIES ==========
function renderMainCategories() {
    const container = document.getElementById('mainCategoriesList');
    if (!categoriesData.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-tags"></i><p>No categories</p><button class="btn-primary" onclick="document.getElementById('mainCatName').focus()">Add Category</button></div>`;
        return;
    }
    container.innerHTML = categoriesData.map(cat => `
        <div class="main-category-card" onclick="viewMainCategory(${cat.id})">
            <div class="category-icon"><i class="fas ${cat.icon}"></i></div>
            <div class="category-name" ondblclick="makeCategoryEditable(${cat.id}, this)">${escapeHtml(cat.name)}</div>
            <div class="category-stats">${cat.subcategories.length} subcategories</div>
            <div class="category-actions" onclick="event.stopPropagation()">
                <button class="category-edit-btn" onclick="makeCategoryEditable(${cat.id}, this.parentElement.parentElement.querySelector('.category-name'))" title="Edit Category">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="category-delete-btn" onclick="deleteCategoryWithConfirm(${cat.id}, '${escapeHtml(cat.name)}')" title="Delete Category">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// دالة تعديل الاسم (تستخدم للدبل كليك وللزر)
function makeCategoryEditable(catId, element) {
    const currentName = element.innerText;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.style.cssText = 'background: rgba(255,255,255,0.1); border: 1px solid #8b5cf6; border-radius: 8px; padding: 6px 10px; color: white; font-size: 1rem; text-align: center; width: 100%;';
    
    element.innerHTML = '';
    element.appendChild(input);
    input.focus();
    
    input.addEventListener('blur', () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            const cat = categoriesData.find(c => c.id === catId);
            cat.name = newName;
            renderMainCategories();
            showToast("Category updated", "success");
        } else {
            element.innerText = currentName;
        }
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
    });
}

function addMainCategory() {
    const name = document.getElementById('mainCatName').value.trim();
    const icon = document.getElementById('mainCatIcon').value.trim();
    if (!name || !icon) return showToast("Fill all fields", "error");
    categoriesData.push({ id: Date.now(), name, icon: icon.startsWith('fa-') ? icon : `fa-${icon}`, subcategories: [] });
    document.getElementById('mainCatName').value = '';
    document.getElementById('mainCatIcon').value = '';
    renderMainCategories();
    showToast("Category added", "success");
}

function editCategoryWithButton(catId) {
    const cat = categoriesData.find(c => c.id === catId);
    const newName = prompt("Edit category name:", cat.name);
    if (newName && newName.trim()) {
        cat.name = newName.trim();
        renderMainCategories();
        showToast("Category updated", "success");
    }
}

function deleteCategoryWithConfirm(id, name) {
    showConfirmModal("Delete Category", `Are you sure you want to delete "${name}"? All subcategories and gigs will be lost.`, () => {
        categoriesData = categoriesData.filter(c => c.id !== id);
        renderMainCategories();
        showToast("Category deleted", "success");
    });
}

// ========== VIEW MAIN CATEGORY ==========
function viewMainCategory(catId) {
    currentMainCategory = categoriesData.find(c => c.id === catId);
    document.getElementById('selectedMainCategoryName').innerHTML = `<i class="fas ${currentMainCategory.icon}"></i> ${currentMainCategory.name}`;
    
    const navContainer = document.getElementById('subcategoriesNav');
    navContainer.innerHTML = currentMainCategory.subcategories.map((sub, i) => `
        <div class="subcat-item">
            <button class="subcat-btn ${i === 0 ? 'active' : ''}" onclick="selectSubcategory(${sub.id})">${escapeHtml(sub.name)}</button>
            <button class="subcat-delete" onclick="deleteSubcategoryWithConfirm(${sub.id}, '${escapeHtml(sub.name)}')" title="Delete Subcategory">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    if (currentMainCategory.subcategories.length > 0) {
        currentSubcategory = currentMainCategory.subcategories[0];
        renderGigs();
    } else {
        document.getElementById('subcategoryGigsGrid').innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><p>No subcategories yet</p><button class="btn-primary btn-sm" onclick="showAddSubcategoryForm()">Add Subcategory</button></div>`;
    }
    document.getElementById('subcategoriesPanel').style.display = 'block';
}

// دالة جديدة لإضافة تصنيف فرعي (بدلاً من البانل الثابت)
function showAddSubcategoryForm() {
    const name = prompt("Enter subcategory name:");
    if (name && name.trim()) {
        currentMainCategory.subcategories.push({ id: Date.now(), name: name.trim(), gigs: [] });
        viewMainCategory(currentMainCategory.id);
        showToast("Subcategory added", "success");
    }
}



function selectSubcategory(subId) {
    currentSubcategory = currentMainCategory.subcategories.find(s => s.id === subId);
    document.querySelectorAll('.subcat-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    renderGigs();
}

// ========== SUBCATEGORIES ==========
function addSubcategory() {
    const name = document.getElementById('subCatName').value.trim();
    if (!name) return showToast("Enter name", "error");
    currentMainCategory.subcategories.push({ id: Date.now(), name, gigs: [] });
    document.getElementById('subCatName').value = '';
    viewMainCategory(currentMainCategory.id);
    showToast("Subcategory added", "success");
}

function deleteSubcategoryWithConfirm(subId, name) {
    showConfirmModal("Delete Subcategory", `Are you sure you want to delete "${name}"? All gigs inside will be lost.`, () => {
        currentMainCategory.subcategories = currentMainCategory.subcategories.filter(s => s.id !== subId);
        if (currentMainCategory.subcategories.length > 0) viewMainCategory(currentMainCategory.id);
        else closeSubcategoriesPanel();
        showToast("Subcategory deleted", "success");
    });
}

// ========== GIGS ==========
function showAddGigForm() { document.getElementById('addGigForm').style.display = 'block'; }
function hideAddGigForm() { document.getElementById('addGigForm').style.display = 'none'; }

function renderGigs() {
    const container = document.getElementById('subcategoryGigsGrid');
    const gigs = currentSubcategory.gigs;
    
    if (!gigs || gigs.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-briefcase"></i><p>No gigs in this subcategory</p></div>`;
        return;
    }
    
    container.innerHTML = `<div style="margin-bottom: 20px;"></div>
    <div class="gigs-main-grid">` + gigs.map(gig => `
        <div class="gig-card">
            <div class="gig-image-container">
                <img src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=500" alt="gig image">
            </div>
            <div class="gig-body-content">
                <div class="gig-category-badge">${escapeHtml(currentSubcategory.name)}</div>
                <h3 class="gig-title-text">${escapeHtml(gig.title)}</h3>
                <div class="gig-footer-info">
                    <div class="rating-display">
                        <i class="fas fa-star"></i> ${gig.rating} (${gig.orders})
                    </div>
                    <div class="price-value-text">$${gig.price}</div>
                </div>
                <div class="gig-admin-actions">
                    <button class="btn-icon danger" onclick="deleteGigWithConfirm(${gig.id}, '${escapeHtml(gig.title)}')" title="Delete Gig">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('') + `</div>`;
}

function deleteGigWithConfirm(gigId, title) {
    showConfirmModal("Delete Gig", `Are you sure you want to delete "${title}"?`, () => {
        currentSubcategory.gigs = currentSubcategory.gigs.filter(g => g.id !== gigId);
        renderGigs();
        showToast("Gig deleted", "success");
    });
}

function addNewGig() {
    const title = document.getElementById('gigTitle').value.trim();
    const desc = document.getElementById('gigDesc').value.trim();
    const price = parseFloat(document.getElementById('gigPrice').value);
    const delivery = parseInt(document.getElementById('gigDelivery').value);
    const seller = document.getElementById('gigSeller').value.trim();
    if (!title || !desc || !price || !delivery || !seller) return showToast("Fill all fields", "error");
    
    currentSubcategory.gigs.push({
        id: Date.now(), title, description: desc, price, delivery, seller,
        sellerAvatar: seller.charAt(0).toUpperCase(), rating: 0, orders: 0
    });
    document.getElementById('gigTitle').value = '';
    document.getElementById('gigDesc').value = '';
    document.getElementById('gigPrice').value = '';
    document.getElementById('gigDelivery').value = '';
    document.getElementById('gigSeller').value = '';
    hideAddGigForm();
    renderGigs();
    showToast("Gig added", "success");
}

// ========== REPORTS ==========
// ========== REPORTS ==========
function renderReportsList() {
    const container = document.getElementById('reportsList');
    if (!reportsData.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-flag"></i><p>No reports</p></div>`;
        return;
    }
    container.innerHTML = reportsData.map(r => `
        <div class="report-item" onclick="selectReport(${r.id})" data-id="${r.id}">
            <div class="report-item-title">${escapeHtml(r.gigTitle)}</div>
            <div class="report-item-meta">Reported by: ${r.reportedBy}</div>
            <div class="report-item-meta">${r.date}</div>
            <span class="report-badge">Pending</span>
        </div>
    `).join('');
}

function selectReport(reportId) {
    selectedReport = reportsData.find(r => r.id === reportId);
    document.querySelectorAll('.report-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.report-item[data-id="${reportId}"]`).classList.add('active');
    
    // البحث عن الجيج المبلغ عليها
    let reportedGig = null;
    for (let cat of categoriesData) {
        for (let sub of cat.subcategories) {
            const gig = sub.gigs.find(g => g.id === selectedReport.gigId);
            if (gig) {
                reportedGig = gig;
                reportedGig.subcategoryName = sub.name;
                reportedGig.mainCategoryName = cat.name;
                break;
            }
        }
        if (reportedGig) break;
    }
    
    document.getElementById('reportDetailsContent').innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Gig Title</div>
            <div class="detail-value">${escapeHtml(selectedReport.gigTitle)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Reported By</div>
            <div class="detail-value">${selectedReport.reportedBy}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date</div>
            <div class="detail-value">${selectedReport.date}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Reason</div>
            <div class="detail-value">${escapeHtml(selectedReport.reason)}</div>
        </div>
        
        ${reportedGig ? `
            <div class="detail-row">
                <div class="detail-label">Gig Location</div>
                <div class="detail-value">${escapeHtml(reportedGig.mainCategoryName)} → ${escapeHtml(reportedGig.subcategoryName)}</div>
            </div>
        ` : ''}
    `;
    
    // تخزين معلومات الجيج المبلغ عليها للاستخدام في زر View Gig
    window.reportedGigData = reportedGig;
    
    document.getElementById('reportActions').innerHTML = `
        <button class="btn-primary" onclick="viewReportedGig()">
            <i class="fas fa-eye"></i> View Gig
        </button>
        <button class="btn-primary" onclick="deleteSelectedReportedGig()">
            <i class="fas fa-trash"></i> Delete Gig
        </button>
        <button class="btn-secondary" onclick="dismissSelectedReport()">
            <i class="fas fa-times"></i> Dismiss
        </button>
    `;
    document.getElementById('reportActions').style.display = 'flex';
}

// عرض الجيج المبلغ عليها في مودال
function viewReportedGig() {
    const gig = window.location.href="viewGig.html";
    if (!gig) {
        showToast("Gig not found", "error");
        return;
    }
    
    document.getElementById('gigDetailsContent').innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Main Category</div>
            <div class="detail-value">${escapeHtml(gig.mainCategoryName)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Subcategory</div>
            <div class="detail-value">${escapeHtml(gig.subcategoryName)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Gig ID</div>
            <div class="detail-value">#${gig.id}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Title</div>
            <div class="detail-value">${escapeHtml(gig.title)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Description</div>
            <div class="detail-value">${escapeHtml(gig.description)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Seller</div>
            <div class="detail-value">${escapeHtml(gig.seller)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Price</div>
            <div class="detail-value">$${gig.price}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Delivery Time</div>
            <div class="detail-value">${gig.delivery} days</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Rating</div>
            <div class="detail-value">${gig.rating} ⭐ (${gig.orders} orders)</div>
        </div>
    `;
    document.getElementById('gigDetailsModal').classList.add('active');
}

function closeGigDetailsModal() {
    document.getElementById('gigDetailsModal').classList.remove('active');
}

function deleteSelectedReportedGig() {
    if (selectedReport) {
        showConfirmModal("Delete Gig", `Are you sure you want to delete "${selectedReport.gigTitle}"?`, () => {
            // حذف الجيج من التصنيفات
            for (let cat of categoriesData) {
                for (let sub of cat.subcategories) {
                    sub.gigs = sub.gigs.filter(g => g.id !== selectedReport.gigId);
                }
            }
            // حذف البلاغ
            reportsData = reportsData.filter(r => r.id !== selectedReport.id);
            selectedReport = null;
            window.reportedGigData = null;
            renderReportsList();
            document.getElementById('reportDetailsContent').innerHTML = `<div class="empty-details"><i class="fas fa-flag"></i><p>Select a report to view details</p></div>`;
            document.getElementById('reportActions').style.display = 'none';
            showToast("Gig deleted", "success");
        });
    }
}

function dismissSelectedReport() {
    if (selectedReport) {
        showConfirmModal("Dismiss Report", `Are you sure you want to dismiss this report?`, () => {
            reportsData = reportsData.filter(r => r.id !== selectedReport.id);
            selectedReport = null;
            window.reportedGigData = null;
            renderReportsList();
            document.getElementById('reportDetailsContent').innerHTML = `<div class="empty-details"><i class="fas fa-flag"></i><p>Select a report to view details</p></div>`;
            document.getElementById('reportActions').style.display = 'none';
            showToast("Report dismissed", "success");
        });
    }
}

// ========== UTILITIES ==========
function showToast(msg, type) {
    let container = document.querySelector('.toast-container');
    if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOutRight 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'); }