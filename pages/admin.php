<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Taskly | Admin Dashboard</title>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/admin.css">
        <link rel="stylesheet" href="../css/gigStyle.css">
        <link rel="stylesheet" href="../css/admin-disputes.css">


    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <div class="animated-background"></div>

    <nav class="navbar">
        <div class="container nav-content">
            <a href="#" class="brand-logo">Task<span>ly</span></a>
            <div class="nav-profile-wrapper">
                <div class="nav-avatar-circle"></div>
            </div>
        </div>
    </nav>

<!-- Navigation Bar -->
<nav class="admin-nav">
    <div class="nav-container">
        <button class="nav-btn active" onclick="switchTab('users')">
            <i class="fas fa-users"></i> Users
        </button>
        <button class="nav-btn" onclick="switchTab('categories')">
            <i class="fas fa-tags"></i> Categories
        </button>
        <button class="nav-btn" onclick="switchTab('reports')">
            <i class="fas fa-flag"></i> Reports
        </button>
        <button class="nav-btn" onclick="switchTab('complaints')">
            <i class="fas fa-envelope"></i> Complaints
        </button>
    </div>
</nav>

<!-- Main Content -->
<main class="admin-main">
    
    <!-- ========== USERS TAB ========== -->
    <section id="users-tab" class="tab-content active">
        <div class="page-header">
            <h1>Manage Users</h1>
            <p>Manage sellers, and customers</p>
        </div>
        
        <div class="user-tabs">
            <button class="user-tab" data-type="sellers" onclick="filterUsers('sellers')">Sellers</button>
            <button class="user-tab" data-type="customers" onclick="filterUsers('customers')">Customers</button>
        </div>
        

        <div id="usersList" class="users-list"></div>
    </section>
    
    <!-- ========== CATEGORIES TAB ========== -->
    <section id="categories-tab" class="tab-content">
        <div class="page-header">
            <h1>Manage Categories</h1>
            <p>Manage main categories, subcategories, and gigs</p>
        </div>
        
        <!-- Add Main Category Panel -->
        <div class="add-category-panel">
            <input type="text" id="mainCatName" class="add-category-input" placeholder="Category name">
            <input type="text" id="mainCatIcon" class="add-category-input" placeholder="Icon (fa-code)">
            <button class="btn-primary" onclick="addMainCategory()">
                <i class="fas fa-plus"></i> Add Category
            </button>
        </div>
        
        <!-- Main Categories Grid -->
        <div id="mainCategoriesList" class="main-categories-grid"></div>
        
        <!-- Subcategories & Gigs Panel -->
        <div id="subcategoriesPanel" class="subcategories-panel" style="display: none;">
            <div class="panel-header">
    <div>
        <h2 id="selectedMainCategoryName"></h2>
        <p>Subcategories and gigs</p>
    </div>
</div>

<!-- Add Subcategory Panel -->
<div class="add-subcategory-panel">
    <input type="text" id="subCatName" class="add-subcategory-input" placeholder="Subcategory name">
    <button class="btn-primary btn-sm" onclick="addSubcategory()">
        <i class="fas fa-plus"></i> Add Subcategory
    </button>
</div>
            
            <!-- Subcategories Navigation -->
            <div id="subcategoriesNav" class="subcategories-nav"></div>
            
          
            
            <!-- Gigs Grid -->
            <div id="subcategoryGigsGrid" class="gigs-grid"></div>
        </div>
    </section>
    
    <!-- ========== REPORTS TAB ========== -->
    <section id="reports-tab" class="tab-content">
        <div class="page-header">
            <h1>Reports</h1>
            <p>Review reported gigs</p>
        </div>
        
        <div class="reports-layout">
            <!-- Left: Reports List -->
            <div class="reports-list-side">
                <div id="reportsList" class="reports-list"></div>
            </div>
            
            <!-- Right: Report Details -->
            <div class="report-details-side">
                <div class="report-details-header">
                    <h3>Report Details</h3>
                </div>
                <div id="reportDetailsContent" class="report-details-content">
                    <div class="empty-details">
                        <i class="fas fa-flag"></i>
                        <p>Select a report to view details</p>
                    </div>
                </div>
                <div id="reportActions" class="report-actions" style="display: none;">
                    <button class="btn-primary" onclick="deleteSelectedReportedGig()">
                        <i class="fas fa-trash"></i> Delete Gig
                    </button>
                    <button class="btn-secondary" onclick="dismissSelectedReport()">
                        <i class="fas fa-times"></i> Dismiss
                    </button>
                    <!-- Gig Details Modal -->
<div id="gigDetailsModal" class="modal">
    <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
            <h3>Gig Details</h3>
            <button type="button" onclick="closeGigDetailsModal()" class="modal-close">&times;</button>
        </div>
        <div id="gigDetailsContent"></div>
        <div class="modal-actions" style="margin-top: 20px;">
            <button class="btn-secondary" onclick="closeGigDetailsModal()">Close</button>
        </div>
    </div>
</div>
                </div>
                
            </div>
        </div>
    </section>
    
    <!-- ========== COMPLAINTS TAB ========== -->
    <section id="complaints-tab" class="tab-content">
        <div class="admin-main-container">
        <div class="admin-dispute-container">
            <div class="dispute-two-columns">
                
                <!-- LEFT PANEL - Dispute Details -->
                <div class="detail-panel">
                    <div class="detail-header">
                        <h2><i class="fas fa-scale-balanced"></i> Dispute inspector</h2>
                        <p>Click any report row to view details</p>
                    </div>
                    <div class="detail-body" id="detailContent">
                        <div style="text-align:center; padding:50px; color:#64748b;">
                            <i class="fas fa-inbox" style="font-size:2rem;"></i>
                            <p>Select a dispute from the list</p>
                        </div>
                    </div>
                </div>

                <!-- RIGHT PANEL - Disputes List -->
                <div class="right-panel">
                    <!-- Stats Cards -->
                    <div class="stats-row" id="statsRow">
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-flag-checkered"></i></div>
                            <div class="stat-info">
                                <div class="stat-title">Total Reports</div>
                                <div class="stat-number" id="totalCount">0</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-clock"></i></div>
                            <div class="stat-info">
                                <div class="stat-title">Pending</div>
                                <div class="stat-number" id="pendingCount">0</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-spinner"></i></div>
                            <div class="stat-info">
                                <div class="stat-title">In Review</div>
                                <div class="stat-number" id="reviewCount">0</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                            <div class="stat-info">
                                <div class="stat-title">Resolved</div>
                                <div class="stat-number" id="resolvedCount">0</div>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Tabs -->
                    <div class="filter-section">
                        <div class="filter-tabs" id="filterTabs">
                            <div class="filter-chip active" data-filter="all">All reports</div>
                            <div class="filter-chip" data-filter="pending">Pending</div>
                            <div class="filter-chip" data-filter="in-review">In review</div>
                            <div class="filter-chip" data-filter="resolved">Resolved</div>
                        </div>
                    </div>

                    <!-- Table Header -->
                    <div class="table-header">
                        <div>ID</div>
                        <div>Reason</div>
                        <div>Complainant</div>
                        <div>Raised by</div>
                        <div>Status</div>
                    </div>

                    <!-- Complaints List Scroll -->
                    <div class="complaint-list-scroll" id="complaintListScroll">
                        <div style="text-align:center; padding:30px;">Loading disputes...</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ACTION MODAL -->
    <div id="actionModal" class="modal-overlay">
        <div class="modal-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3><i class="fas fa-gavel" style="color:#7c3aed;"></i> Take action</h3>
                <button onclick="closeActionModal()" class="modal-close-btn">&times;</button>
            </div>
            <p style="color:#94a3b8; margin:10px 0 20px;">Select action for this dispute</p>
            <div class="radio-group">
                <label class="radio-option">
                    <input type="radio" name="resolutionAction" value="refund_buyer">
                    <span class="custom-radio"></span>
                    <span class="radio-text">Full refund to buyer (cancel order)</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="resolutionAction" value="release_payment">
                    <span class="custom-radio"></span>
                    <span class="radio-text">Release payment to seller</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="resolutionAction" value="partial_refund">
                    <span class="custom-radio"></span>
                    <span class="radio-text">Partial refund (50%)</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="resolutionAction" value="dismiss">
                    <span class="custom-radio"></span>
                    <span class="radio-text">Dismiss complaint</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="resolutionAction" value="suspend_seller">
                    <span class="custom-radio"></span>
                    <span class="radio-text">Suspend Seller</span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="resolutionAction" value="suspend_buyer">
                    <span class="custom-radio"></span>
                    <span class="radio-text">Suspend Buyer</span>
                </label>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn btn-outline-light" onclick="closeActionModal()">Cancel</button>
                <button class="btn btn-primary" id="confirmActionBtn">Apply</button>
            </div>
        </div>
    </div>

    <!-- SUSPEND SELLER WARNING MODAL -->
    <div id="warningSellerModal" class="modal-overlay">
        <div class="modal-card warning">
            <div class="modal-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h3 style="text-align:center;">⚠️ Suspend Seller</h3>
            <p style="text-align:center; color:#94a3b8; margin-bottom:16px;">
                You are about to suspend <strong id="suspendSellerName">this seller</strong>
            </p>
            <div class="warning-text">
                <i class="fas fa-ban"></i> Suspending this seller will:
                <ul>
                    <li>Cancel ALL their active orders</li>
                    <li>Refund all buyers in full</li>
                    <li>Prevent them from creating new gigs</li>
                    <li>Remove their gigs from the marketplace</li>
                </ul>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn btn-outline-light" onclick="closeSellerWarningModal()">Cancel</button>
                <button class="btn btn-danger" id="confirmSellerWarningBtn">Confirm Suspension</button>
            </div>
        </div>
    </div>

    <!-- SUSPEND BUYER WARNING MODAL -->
    <div id="warningBuyerModal" class="modal-overlay">
        <div class="modal-card warning">
            <div class="modal-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h3 style="text-align:center;">⚠️ Suspend Buyer</h3>
            <p style="text-align:center; color:#94a3b8; margin-bottom:16px;">
                You are about to suspend <strong id="suspendBuyerName">this buyer</strong>
            </p>
            <div class="warning-text">
                <i class="fas fa-ban"></i> Suspending this buyer will:
                <ul>
                    <li>Cancel ALL their active orders</li>
                    <li>Release payments to sellers for any in-progress orders</li>
                    <li>Prevent them from placing new orders</li>
                    <li>Refund any pending wallet balance</li>
                </ul>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button class="btn btn-outline-light" onclick="closeBuyerWarningModal()">Cancel</button>
                <button class="btn btn-danger" id="confirmBuyerWarningBtn">Confirm Suspension</button>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>
    </section>
    
</main>

<div class="toast-container"></div>
<!-- Confirm Delete Modal -->
<div id="confirmModal" class="confirm-modal">
    <div class="confirm-modal-content">
        <div class="confirm-modal-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="confirm-modal-title" id="confirmModalTitle">Confirm Delete</h3>
        <p class="confirm-modal-message" id="confirmModalMessage">Are you sure you want to delete this item?</p>
        <div class="confirm-modal-actions">
            <button class="btn-cancel" onclick="closeConfirmModal()">Cancel</button>
            <button class="btn-confirm" onclick="confirmDelete()">Delete</button>
        </div>
    </div>
</div>

<script src="../js/admin.js"></script>
<script src="../js/admin-categories.js"></script>
<script src="../js/admin-users.js"></script>
<script src="../js/admin-disputes.js"></script>
</body>
</html>