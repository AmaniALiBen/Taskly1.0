// ============================================
// ADMIN REPORTS TAB - REAL DATA FROM DATABASE
// ============================================

let reportsData = [];
let selectedReport = null;

// ============================================
// LOAD REPORTS FROM DATABASE
// ============================================
async function loadReports() {
    const container = document.getElementById('reportsList');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i> Loading reports...</div>';
    
    try {
        const response = await fetch('/Taskly/controllers/GigController.php?action=get_reports');
        const result = await response.json();
        
        if (result.success && result.data) {
            reportsData = result.data;
            renderReportsList();
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-flag"></i><p>No reports found</p></div>';
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load reports</p></div>';
    }
}

// ============================================
// RENDER REPORTS LIST
// ============================================
function renderReportsList() {
    const container = document.getElementById('reportsList');
    if (!reportsData.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-flag"></i><p>No reports</p></div>`;
        return;
    }
    
    container.innerHTML = reportsData.map(r => `
        <div class="report-item" onclick="selectReport(${r.id})" data-id="${r.id}">
            <div class="report-item-title">${escapeHtml(r.gig_title || 'Unknown Gig')}</div>
            <div class="report-item-meta">Reported by: ${escapeHtml(r.reporter_name || 'Unknown')}</div>
            <div class="report-item-meta">Seller: ${escapeHtml(r.seller_name || 'Unknown')}</div>
            <div class="report-item-meta">${new Date(r.report_date).toLocaleDateString()}</div>
            <span class="report-badge">Pending</span>
        </div>
    `).join('');
}

// ============================================
// SELECT A REPORT TO VIEW DETAILS
// ============================================
function selectReport(reportId) {
    selectedReport = reportsData.find(r => r.id === reportId);
    if (!selectedReport) return;
    
    document.querySelectorAll('.report-item').forEach(item => item.classList.remove('active'));
    const selectedItem = document.querySelector(`.report-item[data-id="${reportId}"]`);
    if (selectedItem) selectedItem.classList.add('active');
    
    document.getElementById('reportDetailsContent').innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Gig Title</div>
            <div class="detail-value">${escapeHtml(selectedReport.gig_title || 'Unknown')}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Reported By</div>
            <div class="detail-value">${escapeHtml(selectedReport.reporter_name)} (${escapeHtml(selectedReport.reporter_email)})</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Seller</div>
            <div class="detail-value">${escapeHtml(selectedReport.seller_name)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date</div>
            <div class="detail-value">${new Date(selectedReport.report_date).toLocaleString()}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Reason</div>
            <div class="detail-value">${escapeHtml(selectedReport.reason)}</div>
        </div>
    `;
    document.getElementById('reportActions').style.display = 'flex';
}

// ============================================
// DELETE REPORTED GIG
// ============================================
async function deleteSelectedReportedGig() {
    if (!selectedReport) return;
    
    showConfirmModal(
        "Delete Gig",
        `Are you sure you want to delete "${selectedReport.gig_title}"? This will also dismiss all reports for this gig.`,
        async () => {
            try {
                const formData = new FormData();
                formData.append('action', 'delete_reported_gig');
                formData.append('gig_id', selectedReport.gig_id);
                formData.append('report_id', selectedReport.id);
                
                const response = await fetch('/Taskly/controllers/GigController.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                if (result.success) {
                    showToast('Gig deleted successfully', 'success');
                    loadReports();
                    document.getElementById('reportDetailsContent').innerHTML = `<div class="empty-details"><i class="fas fa-flag"></i><p>Select a report to view details</p></div>`;
                    document.getElementById('reportActions').style.display = 'none';
                    selectedReport = null;
                } else {
                    showToast(result.message || 'Failed to delete gig', 'error');
                }
            } catch (error) {
                showToast('Connection error', 'error');
            }
        }
    );
}

// ============================================
// DISMISS REPORT (RESOLVE WITHOUT DELETING GIG)
// ============================================
async function dismissSelectedReport() {
    if (!selectedReport) return;
    
    showConfirmModal(
        "Dismiss Report",
        `Are you sure you want to dismiss this report? The gig will remain active.`,
        async () => {
            try {
                const formData = new FormData();
                formData.append('action', 'resolve_report');
                formData.append('report_id', selectedReport.id);
                
                const response = await fetch('/Taskly/controllers/GigController.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                
                if (result.success) {
                    showToast('Report dismissed', 'success');
                    loadReports();
                    document.getElementById('reportDetailsContent').innerHTML = `<div class="empty-details"><i class="fas fa-flag"></i><p>Select a report to view details</p></div>`;
                    document.getElementById('reportActions').style.display = 'none';
                    selectedReport = null;
                } else {
                    showToast(result.message || 'Failed to dismiss', 'error');
                }
            } catch (error) {
                showToast('Connection error', 'error');
            }
        }
    );
}
function viewReportedGig() {
    if (!selectedReport) return;
    window.open(`/Taskly/pages/gig-details.html?id=${selectedReport.gig_id}`, '_blank');
}

// ============================================
// INITIALIZE REPORTS TAB
// ============================================
function initReportsTab() {
    loadReports();
}