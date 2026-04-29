// ========================================
// ADMIN DISPUTES - MAIN JAVASCRIPT
// ========================================

// Disputes Data
let disputesDB = [
    { id: "CMP-101", orderId: "ORD-882", raisedBy: "Buyer", complainant: "Sarah Johnson", sellerName: "Alex Rivera", buyerName: "Sarah Johnson", reason: "Late delivery", status: "pending", description: "The seller missed the deadline by 5 days. Work is incomplete and late. Request refund.", createdAt: "2025-04-20" },
    { id: "CMP-102", orderId: "ORD-991", raisedBy: "Seller", complainant: "Alex Rivera", sellerName: "Alex Rivera", buyerName: "John Carter", reason: "Buyer unresponsive", status: "in-review", description: "Buyer hasn't replied for 2 weeks. Cannot proceed.", createdAt: "2025-04-18" },
    { id: "CMP-103", orderId: "ORD-453", raisedBy: "Buyer", complainant: "Emily Zhang", sellerName: "Mike Design", buyerName: "Emily Zhang", reason: "Poor quality work", status: "pending", description: "Logo design is unprofessional, colors don't match.", createdAt: "2025-04-22" },
    { id: "CMP-104", orderId: "ORD-712", raisedBy: "Seller", complainant: "Marcus Chen", sellerName: "Marcus Chen", buyerName: "John Doe", reason: "Technical issues", status: "resolved", description: "Hardware failure, order cancelled.", createdAt: "2025-04-10" },
    { id: "CMP-105", orderId: "ORD-539", raisedBy: "Buyer", complainant: "Linda Grey", sellerName: "Anna Smith", buyerName: "Linda Grey", reason: "Incomplete delivery", status: "in-review", description: "Only 3 out of 10 screens delivered.", createdAt: "2025-04-21" },
    { id: "CMP-106", orderId: "ORD-124", raisedBy: "Seller", complainant: "Nadia Khan", sellerName: "Nadia Khan", buyerName: "Tom Wilson", reason: "Requirements unclear", status: "pending", description: "Buyer keeps changing scope.", createdAt: "2025-04-23" }
];

// Global Variables
let currentFilter = "all";
let selectedId = disputesDB[0]?.id || null;
let pendingDisputeForSuspension = null;

// ========================================
// TOAST FUNCTION
// ========================================
function showToast(msg, type) {
    let container = document.getElementById('toastContainer');
    let toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ========================================
// STATS FUNCTIONS
// ========================================
function updateStats() {
    document.getElementById("totalCount").innerText = disputesDB.length;
    document.getElementById("pendingCount").innerText = disputesDB.filter(d => d.status === "pending").length;
    document.getElementById("reviewCount").innerText = disputesDB.filter(d => d.status === "in-review").length;
    document.getElementById("resolvedCount").innerText = disputesDB.filter(d => d.status === "resolved").length;
}

// ========================================
// RENDER COMPLAINT ROWS
// ========================================
function renderComplaintRows() {
    let filtered = currentFilter === "all" ? disputesDB : disputesDB.filter(d => d.status === currentFilter);
    let container = document.getElementById("complaintListScroll");
    
    if (!filtered.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;">No reports match filter</div>';
        return;
    }
    
    container.innerHTML = filtered.map(d => {
        let statusClass = d.status === 'pending' ? 'status-pending' : (d.status === 'in-review' ? 'status-in-review' : 'status-resolved');
        let raisedDisplay = d.raisedBy === 'Buyer' ? 'Buyer' : 'Seller';
        return `<div class="complaint-row-card ${selectedId === d.id ? 'selected' : ''}" data-id="${d.id}">
            <div class="row-grid">
                <div><div class="complaint-id">${d.id}</div></div>
                <div><div class="reason-text">${d.reason}</div></div>
                <div><div class="complainant-name">${d.complainant}</div></div>
                <div><span class="raised-by-badge">${raisedDisplay}</span></div>
                <div><span class="status-badge ${statusClass}">${d.status}</span></div>
            </div>
        </div>`;
    }).join('');
    
    document.querySelectorAll('.complaint-row-card').forEach(row => {
        row.addEventListener('click', () => {
            selectedId = row.dataset.id;
            renderComplaintRows();
            renderDetailPanel(selectedId);
        });
    });
}

// ========================================
// RENDER DETAIL PANEL
// ========================================
function renderDetailPanel(id) {
    let d = disputesDB.find(x => x.id === id);
    let c = document.getElementById("detailContent");
    
    if (!d) {
        c.innerHTML = '<div style="padding:30px;">Report not found</div>';
        return;
    }
    
    let statusClass = d.status === 'pending' ? 'status-pending' : (d.status === 'in-review' ? 'status-in-review' : 'status-resolved');
    
    c.innerHTML = `
        <div class="complaint-meta-grid">
            <div class="meta-row"><span class="meta-label">ID</span><span class="meta-value">${d.id}</span></div>
            <div class="meta-row"><span class="meta-label">Order ID</span><span class="meta-value">${d.orderId}</span></div>
            <div class="meta-row"><span class="meta-label">Reason</span><span class="meta-value">${d.reason}</span></div>
            <div class="meta-row"><span class="meta-label">Complainant</span><span class="meta-value">${d.complainant}</span></div>
            <div class="meta-row"><span class="meta-label">Raised by</span><span class="meta-value">${d.raisedBy}</span></div>
            <div class="meta-row"><span class="meta-label">Status</span><span class="meta-value"><span class="status-badge ${statusClass}">${d.status}</span></span></div>
            <div class="meta-row"><span class="meta-label">Date</span><span class="meta-value">${d.createdAt}</span></div>
        </div>
        <div class="complaint-detail-card">
            <h4>Complaint details</h4>
            <p>${d.description}</p>
        </div>
        <div class="action-buttons">
            <button class="btn btn-outline-light" id="viewOrderBtn"><i class="fas fa-external-link-alt"></i> View order details</button>
            <button class="btn btn-warning" id="takeActionBtn"><i class="fas fa-gavel"></i> Take action</button>
        </div>
    `;
    
    document.getElementById("viewOrderBtn")?.addEventListener("click", () => {
        window.location.href = `orderTrackingAdmin.html?id=${d.orderId}`;
    });
    
    document.getElementById("takeActionBtn")?.addEventListener("click", () => openActionModal(d));
}

// ========================================
// MODAL FUNCTIONS
// ========================================
function openActionModal(dispute) {
    pendingDisputeForSuspension = dispute;
    document.getElementById("actionModal").style.display = "flex";
    document.querySelectorAll('input[name="resolutionAction"]').forEach(r => r.checked = false);
}

function closeActionModal() {
    document.getElementById("actionModal").style.display = "none";
}

function closeSellerWarningModal() {
    document.getElementById("warningSellerModal").style.display = "none";
}

function closeBuyerWarningModal() {
    document.getElementById("warningBuyerModal").style.display = "none";
}

// ========================================
// APPLY RESOLUTION
// ========================================
function applyResolution() {
    if (!pendingDisputeForSuspension) return;
    
    let selected = document.querySelector('input[name="resolutionAction"]:checked');
    if (!selected) {
        showToast("Please select an action", "error");
        return;
    }
    
    let action = selected.value;
    
    if (action === 'suspend_seller') {
        closeActionModal();
        document.getElementById('suspendSellerName').innerText = pendingDisputeForSuspension.sellerName || 'this seller';
        document.getElementById('warningSellerModal').style.display = 'flex';
    } else if (action === 'suspend_buyer') {
        closeActionModal();
        document.getElementById('suspendBuyerName').innerText = pendingDisputeForSuspension.buyerName || 'this buyer';
        document.getElementById('warningBuyerModal').style.display = 'flex';
    } else {
        let msg = action === 'refund_buyer' ? 'Refund issued to buyer' : 
                  action === 'release_payment' ? 'Payment released to seller' : 
                  action === 'partial_refund' ? '50% partial refund' : 'Complaint dismissed';
        
        pendingDisputeForSuspension.status = 'resolved';
        pendingDisputeForSuspension.resolution = action;
        updateStats();
        renderComplaintRows();
        renderDetailPanel(pendingDisputeForSuspension.id);
        showToast(`Dispute resolved: ${msg}`, 'success');
        closeActionModal();
        pendingDisputeForSuspension = null;
    }
}

// ========================================
// CONFIRM SUSPENSIONS
// ========================================
document.getElementById("confirmSellerWarningBtn")?.addEventListener("click", () => {
    if (pendingDisputeForSuspension) {
        showToast(`Seller "${pendingDisputeForSuspension.sellerName}" suspended. All orders cancelled, buyers refunded.`, 'success');
        closeSellerWarningModal();
        pendingDisputeForSuspension.status = 'resolved';
        updateStats();
        renderComplaintRows();
        renderDetailPanel(pendingDisputeForSuspension.id);
        pendingDisputeForSuspension = null;
    } else {
        closeSellerWarningModal();
    }
});

document.getElementById("confirmBuyerWarningBtn")?.addEventListener("click", () => {
    if (pendingDisputeForSuspension) {
        showToast(`Buyer "${pendingDisputeForSuspension.buyerName}" suspended. Orders cancelled, payments released to sellers.`, 'success');
        closeBuyerWarningModal();
        pendingDisputeForSuspension.status = 'resolved';
        updateStats();
        renderComplaintRows();
        renderDetailPanel(pendingDisputeForSuspension.id);
        pendingDisputeForSuspension = null;
    } else {
        closeBuyerWarningModal();
    }
});

// ========================================
// SETUP FILTERS
// ========================================
function setupFilters() {
    document.querySelectorAll(".filter-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-chip").forEach(f => f.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderComplaintRows();
            let first = disputesDB.find(d => currentFilter === "all" || d.status === currentFilter);
            if (first) {
                selectedId = first.id;
                renderDetailPanel(selectedId);
            }
        });
    });
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
    updateStats();
    setupFilters();
    renderComplaintRows();
    if (disputesDB.length) {
        selectedId = disputesDB[0].id;
        renderDetailPanel(selectedId);
    }
}

// Event Listeners
document.getElementById("confirmActionBtn")?.addEventListener("click", applyResolution);

window.addEventListener("click", (e) => {
    if (e.target === document.getElementById("actionModal")) closeActionModal();
    if (e.target === document.getElementById("warningSellerModal")) closeSellerWarningModal();
    if (e.target === document.getElementById("warningBuyerModal")) closeBuyerWarningModal();
});

// Start the app
init();