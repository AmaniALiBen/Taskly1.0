// ========================================
// GIG MANAGEMENT - SELLER DASHBOARD
// ========================================

let myGigs      = [];
let gigToDelete = null;
let currentFilter = 'active';

const GIG_API = '/Taskly/controllers/GigController.php';

// ========================================
// LOAD GIGS FROM DATABASE
// ========================================
async function loadGigs() {
    const grid = document.getElementById('gigsGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i></div>';

    try {
        const response = await fetch(`${GIG_API}?action=my_gigs`);
        const result   = await response.json();

        if (result.success) {
            myGigs = result.gigs;
            updateStats();
            renderGigs(currentFilter);
        } else {
            grid.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">Failed to load gigs</div>';
        }
    } catch (error) {
        console.error('Error loading gigs:', error);
        grid.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">Error loading gigs</div>';
    }
}

// ========================================
// RENDER GIG CARDS
// ========================================
function renderGigs(filter) {
    currentFilter = filter;
    const grid = document.getElementById('gigsGrid');
    if (!grid) return;

    const filtered = myGigs.filter(g => g.status === filter);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center;padding:60px;color:#94a3b8;grid-column:1/-1;">
                <i class="fas fa-box-open" style="font-size:2.5rem;margin-bottom:15px;opacity:0.4;display:block;"></i>
                <p>No ${filter} gigs found</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map(gig => `
        <div class="gig-portrait-card">
            <div class="card-top-img" style="background-image: url('${gig.image || 'https://via.placeholder.com/500x300?text=No+Image'}')"></div>
            <div class="card-main-body">
                <h3>${escapeHtml(gig.title)}</h3>
                <div class="rating-info-line">
                    <i class="fas fa-star"></i>
                    <span class="r-num">${Number(gig.rating || 0).toFixed(1)}</span>
                    <span class="r-total">(${gig.reviews || 0})</span>
                </div>
                <div class="card-action-footer">
                    <div class="price-display"><span>STARTING AT</span>$${Number(gig.price || 0).toFixed(2)}</div>
                    <div class="ctrl-btns-group">
                        <button class="control-btn" onclick="toggleStatus(${gig.id})" title="${gig.status === 'active' ? 'Pause' : 'Activate'}">
                            <i class="fas ${gig.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="control-btn" title="Edit" onclick="openEditGig(${gig.id})">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="control-btn btn-delete-red" onclick="openDeleteModal(${gig.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ========================================
// TOGGLE ACTIVE / PAUSED
// ========================================
async function toggleStatus(id) {
    const gig = myGigs.find(g => g.id === id);
    if (!gig) return;

    const newStatus   = gig.status === 'active' ? 'paused' : 'active';
    const newIsActive = newStatus === 'active' ? 1 : 0;

    try {
        const formData = new FormData();
        formData.append('gig_id',    id);
        formData.append('is_active', newIsActive);

        const response = await fetch(`${GIG_API}?action=toggle_status`, {
            method: 'POST',
            body:   formData
        });
        const result = await response.json();

        if (result.success) {
            gig.status = newStatus;
            updateStats();
            renderGigs(currentFilter);
        } else {
            showToast('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Toggle error:', error);
        showToast('Connection error', 'error');
    }
}

// ========================================
// EDIT GIG
// ========================================
function openEditGig(id) {
    window.location.href = `editGig.html?id=${id}`;
}

// ========================================
// DELETE GIG
// ========================================
function openDeleteModal(id) {
    gigToDelete = id;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    gigToDelete = null;
    document.getElementById('deleteModal').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!gigToDelete) return;

            try {
                const response = await fetch(`${GIG_API}?action=delete&id=${gigToDelete}`, {
                    method: 'GET'
                });
                const result = await response.json();

                if (result.success) {
                    myGigs = myGigs.filter(g => g.id !== gigToDelete);
                    closeDeleteModal();
                    updateStats();
                    renderGigs(currentFilter);
                    showToast('Gig deleted successfully', 'success');
                } else {
                    showToast('Failed to delete gig', 'error');
                }
            } catch (error) {
                console.error('Delete error:', error);
                showToast('Connection error', 'error');
            }
        });
    }
});

// ========================================
// STATS
// ========================================
function updateStats() {
    const activeCount = document.getElementById('activeCount');
    const pausedCount = document.getElementById('pausedCount');
    if (activeCount) activeCount.innerText = myGigs.filter(g => g.status === 'active').length;
    if (pausedCount) pausedCount.innerText = myGigs.filter(g => g.status === 'paused').length;
}

// ========================================
// FILTER TABS
// ========================================
function filterGigs(status, event) {
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
    renderGigs(status);
}

// ========================================
// HELPERS
// ========================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}