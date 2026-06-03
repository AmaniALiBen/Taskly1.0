// ========================================
// CREATE GIG
// ========================================

const CAT_API = '/Taskly/controllers/CategoryController.php';
const GIG_API = '/Taskly/controllers/GigController.php';

// Store all selected files across multiple picks
let selectedImageFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchUserAvatar();
    loadCategories();

    // ── IMAGE UPLOAD PREVIEW ─────────────────────────────────
    const imgInput         = document.getElementById('imgInput');
    const previewContainer = document.getElementById('imgInput').closest('.image-upload-grid');

   

    if (imgInput) {
        imgInput.addEventListener('change', function () {
            Array.from(this.files).forEach(file => {
                if (!file.type.startsWith('image/')) return;
                if (file.size > 5 * 1024 * 1024) {
                    showToast(`${file.name} is larger than 5MB`, 'error');
                    return;
                }
                if (selectedImageFiles.length >= 20) {
                    showToast('Maximum 20 images allowed', 'error');
                    return;
                }

                selectedImageFiles.push(file);
                const fileIndex = selectedImageFiles.length - 1;

                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement('div');
                    div.className = 'preview-sq-box';
                    div.style.backgroundImage = `url(${e.target.result})`;
                    div.innerHTML = `<div class="del-btn" onclick="removeImage(this, ${fileIndex})">×</div>`;
                    previewContainer.appendChild(div);
                };
                reader.readAsDataURL(file);
            });

            this.value = ''; // reset so same file can be re-picked
        });
    }

    // ── SUBCATEGORY ON CATEGORY CHANGE ───────────────────────
    const mainCat = document.getElementById('mainCategory');
    const subCat  = document.getElementById('subCategory');

    if (mainCat) {
        mainCat.addEventListener('change', function () {
            loadSubcategories(this.value, subCat);
        });
    }

    // ── FORM SUBMIT ──────────────────────────────────────────
    const gigForm = document.getElementById('gigForm');

    if (gigForm) {
        gigForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const tiers = ['list-basic', 'list-standard', 'list-premium'];

            // Validate features
            for (const tierId of tiers) {
                const list   = document.getElementById(tierId);
                const inputs = list.querySelectorAll('.li-input');
                let hasFeature = false;
                let hasEmpty   = false;

                inputs.forEach(input => {
                    if (input.value.trim() !== '') {
                        hasFeature = true;
                        input.style.borderBottomColor = 'rgba(255,255,255,0.05)';
                    } else {
                        hasEmpty = true;
                        input.style.borderBottomColor = '#ef4444';
                    }
                });

                if (!hasFeature) {
                    showToast(`The ${tierId.split('-')[1].toUpperCase()} package needs at least one feature`, 'error');
                    return;
                }
                if (hasEmpty) {
                    showToast('Please fill or remove empty feature fields', 'error');
                    return;
                }
            }

            // Validate prices
            let priceValid = true;
            document.querySelectorAll('.price-input').forEach(input => {
                if (!input.value || parseInt(input.value) <= 0) {
                    priceValid = false;
                    input.parentElement.style.borderColor = '#ef4444';
                } else {
                    input.parentElement.style.borderColor = 'rgba(255,255,255,0.05)';
                }
            });

            if (!priceValid) {
                showToast('Price must be greater than $0', 'error');
                return;
            }

            const submitBtn = gigForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Gig...';

            const formData = new FormData();
            formData.append('title',           document.querySelector('.title-field').value.trim());
            formData.append('description',     document.querySelector('.desc-field').value.trim());
            formData.append('sub_category_id', subCat.value);

            // Build packages
            tiers.forEach(tierId => {
                const tierKey    = tierId.split('-')[1];
                const listEl     = document.getElementById(tierId);
                const parentCard = listEl.closest('.p-card');

                const allNumInputs = parentCard.querySelectorAll('.meta-num-input');
                const timeVal      = allNumInputs[0]?.value || '1';
                const unitVal      = parentCard.querySelectorAll('.meta-unit-select')[0]?.value || 'days';

                let deliveryDays = parseInt(timeVal) || 1;
                if (unitVal === 'hours') deliveryDays = Math.ceil(deliveryDays / 24) || 1;

                const revSelect  = parentCard.querySelectorAll('.meta-unit-select')[1];
                const revNum     = allNumInputs[1];
                let revisionsVal = 999;
                if (revSelect && revSelect.value === 'limited') {
                    revisionsVal = parseInt(revNum?.value) || 0;
                }

                formData.append(`packages[${tierKey}][price]`,              parentCard.querySelector('.price-input').value);
                formData.append(`packages[${tierKey}][delivery_time_days]`, deliveryDays);
                formData.append(`packages[${tierKey}][revisions_allowed]`,  revisionsVal);

                listEl.querySelectorAll('.li-input').forEach(input => {
                    if (input.value.trim() !== '') {
                        formData.append(`packages[${tierKey}][features][]`, input.value.trim());
                    }
                });
            });

            // Append all stored images
            selectedImageFiles.forEach(file => {
                formData.append('images[]', file);
            });

            try {
                const response = await fetch(`${GIG_API}?action=create`, {
                    method: 'POST',
                    body:   formData
                });
                const result = await response.json();

                if (result.success) {
                    showToast('Gig created successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = '/Taskly/pages/sellerDashboard.html?tab=gigs';
                    }, 1500);
                } else {
                    showToast(result.message || 'Failed to create gig', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create Gig';
                }
            } catch (error) {
                console.error('Submission error:', error);
                showToast('Connection error with server', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Gig';
            }
        });
    }
});

// ── REMOVE IMAGE ──────────────────────────────────────────────
function removeImage(btn, index) {
    selectedImageFiles.splice(index, 1);
    btn.parentElement.remove();
}

// ── LOAD CATEGORIES FROM DB ───────────────────────────────────
async function loadCategories() {
    const mainCat = document.getElementById('mainCategory');
    if (!mainCat) return;

    try {
        const res  = await fetch(`${CAT_API}?action=get_all`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            mainCat.innerHTML = '<option value="" disabled selected>Select Category</option>';
            data.data.forEach(cat => {
                const option       = document.createElement('option');
                option.value       = cat.id;
                option.textContent = cat.name;
                mainCat.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading categories:', err);
    }
}

// ── LOAD SUBCATEGORIES ────────────────────────────────────────
async function loadSubcategories(categoryId, subCatEl) {
    if (!categoryId || !subCatEl) return;
    subCatEl.innerHTML = '<option value="" disabled selected>Loading...</option>';

    try {
        const res  = await fetch(`${CAT_API}?action=get_subs&category_id=${categoryId}`);
        const data = await res.json();
        subCatEl.innerHTML = '<option value="" disabled selected>Select Sub-category</option>';

        if (data.success && data.data.length > 0) {
            data.data.forEach(sub => {
                const option       = document.createElement('option');
                option.value       = sub.id;
                option.textContent = sub.name;
                subCatEl.appendChild(option);
            });
        } else {
            subCatEl.innerHTML = '<option value="" disabled selected>No subcategories found</option>';
        }
    } catch (err) {
        subCatEl.innerHTML = '<option value="" disabled selected>Failed to load</option>';
    }
}

// ── ADD FEATURE ITEM ──────────────────────────────────────────
function addNewItem(listId) {
    const list      = document.getElementById(listId);
    const allInputs = list.querySelectorAll('.li-input');
    const lastInput = allInputs[allInputs.length - 1];

    if (lastInput && lastInput.value.trim() === '') {
        showToast('Please fill the current feature before adding a new one', 'error');
        lastInput.style.borderBottomColor = '#ef4444';
        lastInput.focus();
        return;
    }

    const li = document.createElement('li');
    li.style.cssText = 'display:flex; align-items:center;';
    li.innerHTML = `
        <input type="text" placeholder="Enter feature details..." class="li-input">
        <i class="fas fa-times del-item-icon" style="color:#ef4444;cursor:pointer;font-size:0.7rem;margin-left:10px" onclick="this.parentElement.remove()"></i>
    `;
    list.appendChild(li);
    li.querySelector('input').focus();
}

// ── TOGGLE UNLIMITED REVISIONS ────────────────────────────────
function toggleUnlimited(selectElement) {
    const wrapper  = selectElement.closest('.meta-input-flex');
    const numInput = wrapper ? wrapper.querySelector('.meta-num-input') : null;
    if (selectElement.value === 'unlimited') {
        if (numInput) { numInput.style.visibility = 'hidden'; numInput.value = ''; }
    } else {
        if (numInput) numInput.style.visibility = 'visible';
    }
}

// ── AVATAR ────────────────────────────────────────────────────
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
function showToast(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

function goBack() { window.location.href = '/Taskly/pages/sellerDashboard.html?tab=gigs'; }