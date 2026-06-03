// ========================================
// EDIT GIG
// ========================================

const CAT_API = '/Taskly/controllers/CategoryController.php';
const GIG_API = '/Taskly/controllers/GigController.php';

document.addEventListener('DOMContentLoaded', () => {
    fetchUserAvatar();

    const urlParams = new URLSearchParams(window.location.search);
    const gigId     = urlParams.get('id');

    if (!gigId) {
        showToast('Error: No Gig ID specified.', 'error');
        setTimeout(() => window.location.href = '/Taskly/pages/sellerDashboard.html?tab=gigs', 2000);
        return;
    }

    // Load categories first, then load gig data
    loadCategories().then(() => loadGigData(gigId));

    // When category changes, reload subcategories
    document.getElementById('mainCategory').addEventListener('change', function () {
        loadSubcategories(this.value, null);
    });

    // ── IMAGE UPLOAD PREVIEW ─────────────────────────────────
    const imgInput         = document.getElementById('imgInput');
    const previewContainer = document.getElementById('imagePreviewContainer');

    if (imgInput) {
        imgInput.addEventListener('change', function () {
            Array.from(this.files).forEach(file => {
                if (!file.type.startsWith('image/')) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement('div');
                    div.className = 'preview-sq-box';
                    div.style.backgroundImage = `url(${e.target.result})`;
                    div.innerHTML = `<div class="del-btn" onclick="this.parentElement.remove()">×</div>`;
                    previewContainer.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // ── FORM SUBMIT ──────────────────────────────────────────
    document.getElementById('editGigForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        const formData = new FormData();
        formData.append('gig_id',         gigId);
        formData.append('title',          document.getElementById('editTitle').value.trim());
        formData.append('description',    document.getElementById('editDesc').value.trim());
        formData.append('sub_category_id', document.getElementById('subCategory').value);

        // Build packages
        ['basic', 'standard', 'premium'].forEach(tier => {
            const timeVal  = document.getElementById(`${tier}Time`).value;
            const unitVal  = document.getElementById(`${tier}Unit`).value;
            const revType  = document.getElementById(`${tier}RevType`).value;
            const revNum   = document.getElementById(`${tier}RevNum`).value;

            // Convert hours to days
            let deliveryDays = parseInt(timeVal) || 1;
            if (unitVal === 'hours') deliveryDays = Math.ceil(deliveryDays / 24) || 1;

            const revisions = revType === 'unlimited' ? 999 : (parseInt(revNum) || 0);

            formData.append(`packages[${tier}][price]`,              document.getElementById(`${tier}Price`).value);
            formData.append(`packages[${tier}][delivery_time_days]`, deliveryDays);
            formData.append(`packages[${tier}][revisions_allowed]`,  revisions);

            // Features
            document.querySelectorAll(`#list-${tier} .li-input`).forEach(input => {
                if (input.value.trim() !== '') {
                    formData.append(`packages[${tier}][features][]`, input.value.trim());
                }
            });
        });

        // New images
        if (imgInput && imgInput.files.length > 0) {
            for (let i = 0; i < imgInput.files.length; i++) {
                formData.append('images[]', imgInput.files[i]);
            }
        }

        try {
            const response = await fetch(`${GIG_API}?action=update`, {
                method: 'POST',
                body:   formData
            });
            const result = await response.json();

            if (result.success) {
                showToast('Changes saved successfully!', 'success');
                setTimeout(() => {
                    window.location.href = '/Taskly/pages/sellerDashboard.html?tab=gigs';
                }, 1500);
            } else {
                showToast(result.message || 'Failed to update gig', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Update Gig';
            }
        } catch (error) {
            console.error('Update error:', error);
            showToast('Connection error with server', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Update Gig';
        }
    });
});

// ── LOAD CATEGORIES FROM DB ───────────────────────────────────
async function loadCategories() {
    const mainCat = document.getElementById('mainCategory');
    mainCat.innerHTML = '<option value="" disabled selected>Loading...</option>';

    try {
        const res  = await fetch(`${CAT_API}?action=get_all`);
        const data = await res.json();

        mainCat.innerHTML = '<option value="" disabled selected>Select Category</option>';

        if (data.success && data.data.length > 0) {
            data.data.forEach(cat => {
                const option       = document.createElement('option');
                option.value       = cat.id;
                option.textContent = cat.name;
                mainCat.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading categories:', err);
        mainCat.innerHTML = '<option value="" disabled selected>Failed to load</option>';
    }
}

// ── LOAD SUBCATEGORIES ────────────────────────────────────────
async function loadSubcategories(categoryId, selectedSubId = null) {
    const subCat = document.getElementById('subCategory');
    subCat.innerHTML = '<option value="" disabled selected>Loading...</option>';

    try {
        const res  = await fetch(`${CAT_API}?action=get_subs&category_id=${categoryId}`);
        const data = await res.json();

        subCat.innerHTML = '<option value="" disabled selected>Select Sub-category</option>';

        if (data.success && data.data.length > 0) {
            data.data.forEach(sub => {
                const option       = document.createElement('option');
                option.value       = sub.id;
                option.textContent = sub.name;
                if (selectedSubId && sub.id == selectedSubId) option.selected = true;
                subCat.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading subcategories:', err);
        subCat.innerHTML = '<option value="" disabled selected>Failed to load</option>';
    }
}

// ── LOAD GIG DATA AND FILL THE FORM ──────────────────────────
async function loadGigData(gigId) {
    try {
        const res    = await fetch(`${GIG_API}?action=get&gig_id=${gigId}`);
        const result = await res.json();

        console.log('FULL API RESPONSE:', result);
        if (!result.success) {
            showToast('Failed to load gig data', 'error');
            return;
        }

        const gig = result.data;
        console.log('Gig data:', gig);
        console.log('Basic package:', gig.basic);
        console.log('Standard package:', gig.standard);
        console.log('Premium package:', gig.premium);

        // Fill basic fields
        document.getElementById('editTitle').value = gig.title;
        document.getElementById('editDesc').value  = gig.description;

        // Set category and load its subcategories with the correct one selected
        const mainCat = document.getElementById('mainCategory');
        mainCat.value = gig.category_id;
        await loadSubcategories(gig.category_id, gig.sub_category_id);

        // Fill existing images
        const previewContainer = document.getElementById('imagePreviewContainer');
        previewContainer.innerHTML = '';
        if (gig.images && gig.images.length > 0) {
            gig.images.forEach(url => {
                const div = document.createElement('div');
                div.className = 'preview-sq-box';
                div.style.backgroundImage = `url(${url})`;
                div.innerHTML = `<div class="del-btn" onclick="this.parentElement.remove()">×</div>`;
                previewContainer.appendChild(div);
            });
        }

        // Fill packages
        ['basic', 'standard', 'premium'].forEach(tier => {
            fillPackageData(tier, gig[tier]);
        });

    } catch (err) {
        console.error('Error loading gig:', err);
        showToast('Failed to load gig data', 'error');
    }
}

// ── FILL PACKAGE FIELDS ───────────────────────────────────────
function fillPackageData(tier, data) {
    if (!data) return;

    document.getElementById(`${tier}Price`).value  = data.price;
    document.getElementById(`${tier}Time`).value   = data.delivery;
    document.getElementById(`${tier}Unit`).value   = data.unit || 'days';
    document.getElementById(`${tier}RevNum`).value = data.revs;

    const revSelect   = document.getElementById(`${tier}RevType`);
    revSelect.value   = data.revType || 'limited';
    toggleUnlimited(revSelect);

    // Fill features
    const list = document.getElementById(`list-${tier}`);
    list.innerHTML = '';
    (data.features || []).forEach(feat => {
        const li = document.createElement('li');
        li.innerHTML = `<input type="text" value="${feat}" class="li-input" />`;
        list.appendChild(li);
    });
}

// ── ADD FEATURE ITEM ──────────────────────────────────────────
function addNewItem(listId) {
    const list = document.getElementById(listId);
    const li   = document.createElement('li');
    li.innerHTML = `
        <input type="text" placeholder="New feature item..." class="li-input" />
        <i class="fas fa-times del-item-icon" style="color:#ef4444;cursor:pointer;font-size:0.7rem;margin-left:10px" onclick="this.parentElement.remove()"></i>
    `;
    list.appendChild(li);
    li.querySelector('input').focus();
}

// ── TOGGLE UNLIMITED REVISIONS (FIXED) ────────────────────────
function toggleUnlimited(select) {
    // Find the parent container and the number input inside it
    const wrapper = select.closest('.meta-input-flex');
    const numInput = wrapper ? wrapper.querySelector('.meta-num-input') : null;
    
    if (select.value === 'unlimited') {
        if (numInput) {
            numInput.style.visibility = 'hidden';
            numInput.value = '';
        }
    } else {
        if (numInput) {
            numInput.style.visibility = 'visible';
        }
    }
}

// ── AVATAR (FIXED PATH) ───────────────────────────────────────
async function fetchUserAvatar() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data     = await response.json();
        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');
            if (avatarImg) {
                avatarImg.src = (data.avatar && data.avatar !== 'null')
                    ? data.avatar
                    : `https://ui-avatars.com/api/?name=${data.username?.charAt(0).toUpperCase() || 'U'}&background=7c3aed&color=fff&size=100`;
            }
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}

// ── HELPERS ───────────────────────────────────────────────────
function showToast(msg, type) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
function goBack()       { window.location.href = '/Taskly/pages/sellerDashboard.html?tab=gigs'; }
