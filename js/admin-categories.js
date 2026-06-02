// =============================================================
//  CATEGORY MANAGEMENT
//  All functions talk to CategoryController.php via fetch()
//  and update the UI based on the JSON response
// =============================================================

const CATEGORY_API = '../controllers/CategoryController.php';

// Tracks which category is currently selected
let selectedCategoryId   = null;
let selectedCategoryName = null;


// ─── HELPER: send a POST request ─────────────────────────────
// Instead of repeating fetch() code everywhere, one helper does it
async function postToAPI(url, data) {
    // FormData is the easiest way to send POST fields in fetch()
    const form = new FormData();
    for (const key in data) {
        form.append(key, data[key]);
    }

    const response = await fetch(url, {
        method: 'POST',
        body: form
    });

    return response.json(); // always returns a JS object
}


// ─── LOAD ALL CATEGORIES ─────────────────────────────────────
// Called once when the categories tab is opened
async function loadCategories() {
    const grid = document.getElementById('mainCategoriesList');
    grid.innerHTML = '<p style="color:#6b7280; padding:20px;">Loading...</p>';

    try {
        const res = await fetch(`${CATEGORY_API}?action=get_all`);
        const data = await res.json();

        if (!data.success) {
            grid.innerHTML = `<p style="color:#f87171;">Error: ${data.message}</p>`;
            return;
        }

        if (data.data.length === 0) {
            grid.innerHTML = '<p style="color:#6b7280; padding:20px;">No categories yet.</p>';
            return;
        }

        // Build a card for each category
        grid.innerHTML = data.data.map(cat => buildCategoryCard(cat)).join('');

    } catch (err) {
        grid.innerHTML = '<p style="color:#f87171;">Failed to connect to server.</p>';
        console.error(err);
    }
}


// ─── BUILD A CATEGORY CARD (HTML string) ─────────────────────
function buildCategoryCard(cat) {
    // cat.icon_url stores the FontAwesome class like "fa-code"
    const icon = cat.icon_url
        ? `<i class="fas ${cat.icon_url}"></i>`
        : `<i class="fas fa-tag"></i>`;

    return `
        <div class="main-category-card" onclick="openCategory(${cat.id}, '${escapeHtml(cat.name)}')">
            <div class="category-actions">
                <button class="category-edit-btn"
                    onclick="event.stopPropagation(); editCategory(${cat.id}, '${escapeHtml(cat.name)}', '${escapeHtml(cat.icon_url ?? '')}')"
                    title="Edit">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="category-delete-btn"
                    onclick="event.stopPropagation(); deleteCategory(${cat.id})"
                    title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="category-icon">${icon}</div>
            <div class="category-name">${escapeHtml(cat.name)}</div>
            <div class="category-stats">${cat.sub_count} subcategories</div>
        </div>
    `;
}


// ─── ADD CATEGORY ─────────────────────────────────────────────
async function addMainCategory() {
    const name     = document.getElementById('mainCatName').value.trim();
    const icon_url = document.getElementById('mainCatIcon').value.trim();

    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }

    const data = await postToAPI(CATEGORY_API, {
        action: 'create',
        name,
        icon_url
    });

    if (data.success) {
        showToast('Category added!', 'success');
        document.getElementById('mainCatName').value  = '';
        document.getElementById('mainCatIcon').value  = '';
        loadCategories(); // refresh the grid
    } else {
        showToast(data.message, 'error');
    }
}


// ─── DELETE CATEGORY ──────────────────────────────────────────
function deleteCategory(id) {
    // Use your existing confirm modal
    showConfirmModal(
        'Delete Category',
        'This will also delete all its subcategories. Are you sure?',
        async () => {
            const data = await postToAPI(CATEGORY_API, {
                action: 'delete',
                id
            });

            if (data.success) {
                showToast('Category deleted', 'success');
                // Hide subcategories panel if we deleted the selected category
                if (selectedCategoryId === id) {
                    document.getElementById('subcategoriesPanel').style.display = 'none';
                    selectedCategoryId = null;
                }
                loadCategories();
            } else {
                showToast(data.message, 'error');
            }
        }
    );
}


// ─── EDIT CATEGORY (inline — clicking pencil turns name into input) ───
function editCategory(id, currentName, currentIcon) {
    // Find the name element inside the card for this category
    // We locate it by finding the card that contains this category's delete button
    const cards = document.querySelectorAll('.main-category-card');
    let nameElement = null;

    cards.forEach(card => {
        const deleteBtn = card.querySelector('.category-delete-btn');
        if (deleteBtn && deleteBtn.getAttribute('onclick').includes(`deleteCategory(${id})`)) {
            nameElement = card.querySelector('.category-name');
        }
    });

    if (!nameElement) return;

    // Don't create a second input if one already exists
    if (nameElement.querySelector('input')) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid #8b5cf6;
        border-radius: 8px;
        padding: 6px 10px;
        color: white;
        font-size: 1rem;
        text-align: center;
        width: 100%;
    `;

    nameElement.innerHTML = '';
    nameElement.appendChild(input);
    input.focus();
    input.select();

    // Save on blur (clicking away)
    input.addEventListener('blur', async () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            const data = await postToAPI(CATEGORY_API, {
                action:   'update',
                id,
                name:     newName,
                icon_url: currentIcon
            });
            if (data.success) {
                showToast('Category updated!', 'success');
                nameElement.innerText = newName; // update in place, no full reload
            } else {
                showToast(data.message, 'error');
                nameElement.innerText = currentName; // restore original
            }
        } else {
            nameElement.innerText = currentName; // restore if unchanged
        }
    });

    // Save on Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
            nameElement.innerText = currentName;
        }
    });
}


// ─── OPEN CATEGORY (show its subcategories) ───────────────────
async function openCategory(id, name) {
    selectedCategoryId   = id;
    selectedCategoryName = name;

    document.getElementById('selectedMainCategoryName').textContent = name;
    document.getElementById('subcategoriesPanel').style.display = 'block';

    await loadSubcategories(id);

    // Smooth scroll to the panel
    document.getElementById('subcategoriesPanel').scrollIntoView({ behavior: 'smooth' });
}


// ─── LOAD SUBCATEGORIES ───────────────────────────────────────
async function loadSubcategories(categoryId) {
    const nav = document.getElementById('subcategoriesNav');
    nav.innerHTML = '<p style="color:#6b7280;">Loading...</p>';

    try {
        const res  = await fetch(`${CATEGORY_API}?action=get_subs&category_id=${categoryId}`);
        const data = await res.json();

        if (!data.success) {
            nav.innerHTML = `<p style="color:#f87171;">${data.message}</p>`;
            return;
        }

        if (data.data.length === 0) {
            nav.innerHTML = '<p style="color:#6b7280;">No subcategories yet.</p>';
            return;
        }

        nav.innerHTML = data.data.map(sub => `
            <div class="subcat-item">
                <button class="subcat-btn" onclick="selectSubcategory(${sub.id}, '${escapeHtml(sub.name)}')">
                    ${escapeHtml(sub.name)}
                </button>
                <button class="subcat-delete" onclick="deleteSubcategory(${sub.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

    } catch (err) {
        nav.innerHTML = '<p style="color:#f87171;">Failed to load subcategories.</p>';
        console.error(err);
    }
}


// ─── ADD SUBCATEGORY ──────────────────────────────────────────
async function addSubcategory() {
    const name = document.getElementById('subCatName').value.trim();

    if (!name) {
        showToast('Please enter a subcategory name', 'error');
        return;
    }

    if (!selectedCategoryId) {
        showToast('No category selected', 'error');
        return;
    }

    const data = await postToAPI(CATEGORY_API, {
        action:      'create_sub',
        category_id: selectedCategoryId,
        name
    });

    if (data.success) {
        showToast('Subcategory added!', 'success');
        document.getElementById('subCatName').value = '';
        loadSubcategories(selectedCategoryId); // refresh the nav
        loadCategories(); // refresh count on the card
    } else {
        showToast(data.message, 'error');
    }
}


// ─── DELETE SUBCATEGORY ───────────────────────────────────────
function deleteSubcategory(id) {
    showConfirmModal(
        'Delete Subcategory',
        'Are you sure you want to delete this subcategory?',
        async () => {
            const data = await postToAPI(CATEGORY_API, {
                action: 'delete_sub',
                id
            });

            if (data.success) {
                showToast('Subcategory deleted', 'success');
                loadSubcategories(selectedCategoryId);
                loadCategories();
            } else {
                showToast(data.message, 'error');
            }
        }
    );
}


// ─── SELECT SUBCATEGORY ───────────────────────────────────────
// Highlights the selected subcategory tab (gigs loading can be added later)
function selectSubcategory(id, name) {
    document.querySelectorAll('.subcat-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    // TODO: load gigs for this subcategory here later
}


// ─── HELPERS ──────────────────────────────────────────────────

// Prevent XSS when injecting user data into HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Show toast notification (uses your existing showToast function)
// If you don't have one yet, this is a basic version:
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Wire up the confirm modal to accept a callback
let confirmCallback = null;

function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmModalTitle').textContent   = title;
    document.getElementById('confirmModalMessage').textContent = message;
    document.getElementById('confirmModal').classList.add('active');
    confirmCallback = onConfirm;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

function confirmDelete() {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
}


// ─── TAB SWITCHING ────────────────────────────────────────────
// Load categories when the categories tab is opened
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');

    // Load data for the tab that was just opened
    if (tabName === 'categories') loadCategories();
    // TODO: add loadUsers(), loadReports(), loadComplaints() here later
}

document.addEventListener('DOMContentLoaded', () => {

    // Category name + icon → clicks "Add Category" button
    document.getElementById('mainCatName').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.querySelector('.add-category-panel .btn-primary').click();
    });
    document.getElementById('mainCatIcon').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.querySelector('.add-category-panel .btn-primary').click();
    });

    // Subcategory name → clicks "Add Subcategory" button
    document.getElementById('subCatName').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.querySelector('.add-subcategory-panel .btn-primary').click();
    });

    // Add admin inputs → clicks "Add Admin" button
    document.getElementById('adminOnlyName').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.querySelector('.add-admin-only-panel .btn-primary').click();
    });
    document.getElementById('adminOnlyEmail').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.querySelector('.add-admin-only-panel .btn-primary').click();
    });
    document.getElementById('adminOnlyPassword').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.querySelector('.add-admin-only-panel .btn-primary').click();
    });

});


// Load categories on page start since it might not be the first tab
// (users tab is active by default — categories load when you click the tab)