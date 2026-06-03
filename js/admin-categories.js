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
async function postToAPI(url, data) {
    const form = new FormData();
    for (const key in data) {
        form.append(key, data[key]);
    }

    const response = await fetch(url, {
        method: 'POST',
        body: form
    });

    return response.json();
}

// ─── LOAD ALL CATEGORIES ─────────────────────────────────────
async function loadCategories() {
    const grid = document.getElementById('mainCategoriesList');
    if (!grid) return;
    
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

        grid.innerHTML = data.data.map(cat => buildCategoryCard(cat)).join('');

    } catch (err) {
        grid.innerHTML = '<p style="color:#f87171;">Failed to connect to server.</p>';
        console.error(err);
    }
}

// ─── BUILD A CATEGORY CARD ───────────────────────────────────
function buildCategoryCard(cat) {
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
    const name     = document.getElementById('mainCatName')?.value.trim();
    const icon_url = document.getElementById('mainCatIcon')?.value.trim();

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
        if (document.getElementById('mainCatName')) document.getElementById('mainCatName').value = '';
        if (document.getElementById('mainCatIcon')) document.getElementById('mainCatIcon').value = '';
        loadCategories();
    } else {
        showToast(data.message, 'error');
    }
}

// ─── DELETE CATEGORY ──────────────────────────────────────────
function deleteCategory(id) {
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
                if (selectedCategoryId === id) {
                    const panel = document.getElementById('subcategoriesPanel');
                    if (panel) panel.style.display = 'none';
                    selectedCategoryId = null;
                }
                loadCategories();
            } else {
                showToast(data.message, 'error');
            }
        }
    );
}

// ─── EDIT CATEGORY ───────────────────────────────────────────
function editCategory(id, currentName, currentIcon) {
    const cards = document.querySelectorAll('.main-category-card');
    let nameElement = null;

    cards.forEach(card => {
        const deleteBtn = card.querySelector('.category-delete-btn');
        if (deleteBtn && deleteBtn.getAttribute('onclick').includes(`deleteCategory(${id})`)) {
            nameElement = card.querySelector('.category-name');
        }
    });

    if (!nameElement) return;
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

    input.addEventListener('blur', async () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
            const data = await postToAPI(CATEGORY_API, {
                action: 'update',
                id,
                name: newName,
                icon_url: currentIcon
            });
            if (data.success) {
                showToast('Category updated!', 'success');
                nameElement.innerText = newName;
            } else {
                showToast(data.message, 'error');
                nameElement.innerText = currentName;
            }
        } else {
            nameElement.innerText = currentName;
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') nameElement.innerText = currentName;
    });
}

// ─── OPEN CATEGORY ───────────────────────────────────────────
async function openCategory(id, name) {
    selectedCategoryId   = id;
    selectedCategoryName = name;

    const titleEl = document.getElementById('selectedMainCategoryName');
    if (titleEl) titleEl.textContent = name;
    
    const panel = document.getElementById('subcategoriesPanel');
    if (panel) panel.style.display = 'block';

    await loadSubcategories(id);
    if (panel) panel.scrollIntoView({ behavior: 'smooth' });
}

// ─── LOAD SUBCATEGORIES ──────────────────────────────────────
async function loadSubcategories(categoryId) {
    const nav = document.getElementById('subcategoriesNav');
    if (!nav) return;
    
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

// ─── ADD SUBCATEGORY ─────────────────────────────────────────
async function addSubcategory() {
    const name = document.getElementById('subCatName')?.value.trim();

    if (!name) {
        showToast('Please enter a subcategory name', 'error');
        return;
    }

    if (!selectedCategoryId) {
        showToast('No category selected', 'error');
        return;
    }

    const data = await postToAPI(CATEGORY_API, {
        action: 'create_sub',
        category_id: selectedCategoryId,
        name
    });

    if (data.success) {
        showToast('Subcategory added!', 'success');
        if (document.getElementById('subCatName')) document.getElementById('subCatName').value = '';
        loadSubcategories(selectedCategoryId);
        loadCategories();
    } else {
        showToast(data.message, 'error');
    }
}

// ─── DELETE SUBCATEGORY ──────────────────────────────────────
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

// ─── SELECT SUBCATEGORY ──────────────────────────────────────
function selectSubcategory(id, name) {
    document.querySelectorAll('.subcat-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
}

// ─── ENTER KEY HANDLERS (without DOMContentLoaded) ───────────
// These will run when the elements exist
function setupCategoryEnterHandlers() {
    const mainCatName = document.getElementById('mainCatName');
    const mainCatIcon = document.getElementById('mainCatIcon');
    const subCatName = document.getElementById('subCatName');
    
    if (mainCatName) {
        mainCatName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addMainCategory();
        });
    }
    
    if (mainCatIcon) {
        mainCatIcon.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addMainCategory();
        });
    }
    
    if (subCatName) {
        subCatName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addSubcategory();
        });
    }
}

// Call this when categories tab is opened
function initCategoriesTab() {
    setupCategoryEnterHandlers();
    loadCategories();
}

// استدعاء التحميل بعد تحميل الصفحة مباشرة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initCategoriesTab();
    });
} else {
    initCategoriesTab();
}

// أيضاً إذا كان التبويب يتم تفعيله لاحقاً، استمع للنقرات
document.addEventListener('click', function(e) {
    // إذا تم النقر على أي عنصر يمكنه تغيير التبويب
    if (e.target.closest('.tab-btn') || e.target.closest('.nav-item')) {
        setTimeout(() => {
            checkAndInitCategories();
        }, 150);
    }
});