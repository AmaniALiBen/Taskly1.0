
function goBackAndShowPopup() {
    console.log("Redirecting to index..."); // للتأكد في المتصفح
    localStorage.setItem('triggerPopup', 'true');
    window.location.href = "../index.html";
}

document.addEventListener('DOMContentLoaded', () => {
    const sellerForm = document.getElementById('sellerForm');

    // 1. معالجة معاينة الصورة الشخصية
    const fileInput = document.getElementById('profilePic');
    const imagePreview = document.getElementById('imagePreview');
    const plusIcon = document.getElementById('plus-icon');

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.style.backgroundImage = `url(${e.target.result})`;
                    imagePreview.style.backgroundSize = 'cover';
                    imagePreview.style.backgroundPosition = 'center';
                    if (plusIcon) plusIcon.style.display = 'none';
                    imagePreview.style.borderStyle = 'solid';
                    imagePreview.style.borderColor = 'var(--primary-color)';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. إدارة اللغات المتعددة
    const langSelect = document.getElementById('languageSelect');
    const langContainer = document.getElementById('languagesContainer');
    let selectedLangs = [];

    if (langSelect) {
        langSelect.addEventListener('change', function () {
            const val = this.value;
            if (val && !selectedLangs.includes(val)) {
                selectedLangs.push(val);
                renderLangs();
            }
            this.selectedIndex = 0;
        });
    }

    window.removeLang = (name) => {
        selectedLangs = selectedLangs.filter(l => l !== name);
        renderLangs();
    };

    function renderLangs() {
        if (!langContainer) return;
        langContainer.innerHTML = selectedLangs.map(l => `
            <div class="lang-tag" style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); padding: 6px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; margin: 5px;">
                <span>${l}</span>
                <span class="remove-btn" onclick="removeLang('${l}')" style="cursor: pointer; color: #ef4444; font-weight: bold;">&times;</span>
            </div>
        `).join('');
    }
    function goBackAndShowPopup() {
        // نضع علامة في مخزن المتصفح
        localStorage.setItem('triggerPopup', 'true');
        // نعود للصفحة السابقة
        window.location.href = "../index.html";
    }
    // 3. معالجة إرسال النموذج والتحقق الصارم
    if (sellerForm) {
        sellerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // جلب قيم الحقول
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // جلب صناديق النصوص (Textareas)
            const experience = this.querySelector('textarea[placeholder*="Summarize"]').value.trim();
            const aboutMe = this.querySelector('textarea[placeholder*="Tell us"]').value.trim();

            // --- التحققات (Validation) ---

            // 1. التأكد من رفع الصورة
            if (!fileInput.files[0]) {
                showToast("Your profile needs a professional photo.", "error");
                return;
            }

            // 2. التأكد من تعبئة الخبرة المهنية
            if (experience.length < 20) {
                showToast("Please provide more details about your experience (min 20 chars).", "error");
                return;
            }

            // 3. التأكد من تعبئة نبذة "عني"
            if (aboutMe.length < 30) {
                showToast("Your 'About Me' section is too short. Tell us more!", "error");
                return;
            }

            // 4. التأكد من إضافة لغة
            if (selectedLangs.length === 0) {
                showToast("Please select your spoken languages.", "error");
                return;
            }

            // 5. تطابق كلمة المرور
            if (password !== confirmPassword) {
                showToast("Passwords mismatch! Double check your entries.", "error");
                return;
            }

            // --- حالة النجاح ---
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> CREATING ACCOUNT...';

            setTimeout(() => {
                showToast("Welcome to Taskly! Redirecting to your dashboard.", "success");
                setTimeout(() => {
                    window.location.href = 'sellerDashboard.html';
                }, 2000);
            }, 1500);
        });
    }
});
function goBack(){ window.location.href = "../index.html";}
/**
 * دالة التنبيهات الزجاجية (Toast)
 */
function showToast(msg, type) {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}// 1. ضع هذه الدالة في البداية خارج كل الأقواس لكي يراها زر الـ HTML
