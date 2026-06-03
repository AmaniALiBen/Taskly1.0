// ========================================
// SELLER GIGS MANAGEMENT
// ========================================

const GIG_API = '/Taskly/controllers/GigController.php';

let gigIdToDelete = null;

// ─── LOAD GIGS ────────────────────────────────────────────────
async function loadGigs() {
    const container = document.getElementById('gigsGrid');
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-message">
                <i class="fas fa-spinner fa-pulse"></i>
                <p>Loading your gigs...</p>
            </div>
        </div>
    `;

    try {
        const response = await fetch(`${GIG_API}?action=my_gigs`);
        const data = await response.json();

        if (data.success && data.gigs && data.gigs.length > 0) {
            const activeGigs = data.gigs.filter(g => g.status === 'active');
            const pausedGigs = data.gigs.filter(g => g.status === 'paused');
            updateGigStats(activeGigs.length, pausedGigs.length);
            renderGigsList(activeGigs);
        } else {
            updateGigStats(0, 0);
            renderGigsList([]);
        }
    } catch (err) {
        console.error('Error loading gigs:', err);
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading gigs</p>
                    <span>Please check your connection</span>
                </div>
            </div>
        `;
    }
}

// ─── RENDER GIGS LIST ─────────────────────────────────────────
function renderGigsList(gigs) {
    const container = document.getElementById('gigsGrid');
    if (!container) return;

    if (!gigs || gigs.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-message">
                    <i class="fas fa-folder-open"></i>
                    <p>No gigs found</p>
                    <span>Click "Add New Gig" to create your first service</span>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = gigs.map(gig => `
        <div class="gig-portrait-card" id="gig-${gig.id}">
            <div class="card-top-img" style="background-image: url('${gig.image || '/Taskly/images/default-gig.jpg'}')"></div>
            <div class="card-main-body">
                <h3>${escapeHtml(gig.title)}</h3>
                <div class="rating-info-line">
                    <i class="fas fa-star"></i>
                    <span class="r-num">New</span>
                </div>
                <div class="card-action-footer">
                    <div class="price-display">
                        <span>STARTING AT</span>
                        $${gig.price}
                    </div>
                    <div class="ctrl-btns-group">
                        <button onclick="editGig(${gig.id})" class="control-btn" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleGigStatus(${gig.id}, '${gig.status}')"
                                class="control-btn"
                                title="${gig.status === 'active' ? 'Pause' : 'Activate'}">
                            <i class="fas ${gig.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button onclick="openDeleteModal(${gig.id})" class="control-btn" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ─── UPDATE GIG STATS ─────────────────────────────────────────
function updateGigStats(activeCount, pausedCount) {
    const activeEl = document.getElementById('activeCount');
    const pausedEl = document.getElementById('pausedCount');
    if (activeEl) activeEl.innerText = activeCount;
    if (pausedEl) pausedEl.innerText = pausedCount;
}

// ─── FILTER GIGS (Active / Paused tabs) ──────────────────────
function filterGigs(status, event) {
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    fetch(`${GIG_API}?action=my_gigs`)
        .then(res => res.json())
        .then(data => {
            if (data.success && data.gigs) {
                const filtered = data.gigs.filter(g => g.status === status);
                renderGigsList(filtered);
            } else {
                renderGigsList([]);
            }
        })
        .catch(err => {
            console.error('Error filtering gigs:', err);
            renderGigsList([]);
        });
}

// ─── TOGGLE GIG STATUS (Pause / Activate) ────────────────────
async function toggleGigStatus(id, currentStatus) {
    const newIsActive = currentStatus === 'active' ? 0 : 1;

    try {
        const form = new FormData();
        form.append('gig_id',    id);
        form.append('is_active', newIsActive);

        const response = await fetch(`${GIG_API}?action=toggle_status`, {
            method: 'POST',
            body:   form
        });
        const result = await response.json();

        if (result.success) {
            showToast(newIsActive ? 'Gig activated' : 'Gig paused', 'success');
            loadGigs();
        } else {
            showToast(result.message || 'Failed to update status', 'error');
        }
    } catch (err) {
        console.error('Toggle error:', err);
        showToast('Connection error', 'error');
    }
}

// ─── EDIT GIG ─────────────────────────────────────────────────
function editGig(id) {
    window.location.href = `/Taskly/pages/editGig.html?id=${id}`;
}

// ─── DELETE GIG ───────────────────────────────────────────────
function openDeleteModal(id) {
    gigIdToDelete = id;
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.add('active');
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.classList.remove('active');
    gigIdToDelete = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            if (!gigIdToDelete) return;

            try {
                const response = await fetch(`${GIG_API}?action=delete&id=${gigIdToDelete}`, {
                    method: 'POST'
                });
                const result = await response.json();

                if (result.success) {
                    showToast('Gig deleted successfully', 'success');
                    loadGigs();
                    closeDeleteModal();
                } else {
                    showToast(result.message || 'Failed to delete gig', 'error');
                }
            } catch (err) {
                console.error('Delete error:', err);
                showToast('Failed to delete gig', 'error');
            }
        });
    }
});

// ─── NAVIGATE TO CREATE GIG ───────────────────────────────────
function showAddGigModal() {
    window.location.href = '/Taskly/pages/createGig.html';
}

// ─── HELPERS ─────────────────────────────────────────────────
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c]));
}