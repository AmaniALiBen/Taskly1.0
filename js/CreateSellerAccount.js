// ============================================
// CREATE SELLER ACCOUNT - FIXED VERSION
// ============================================

function goBackAndShowPopup() {
    localStorage.setItem('triggerPopup', 'true');
    window.location.href = "../index.html";
}

function goBack() { 
    window.location.href = "../index.html"; 
}

// متغيرات عامة
let selectedLangs = [];
let countriesData = [];
let languagesData = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Page loaded, fetching countries and languages...");
    
    // جلب البيانات من قاعدة البيانات
    await loadCountriesAndLanguages();
    
    const sellerForm = document.getElementById('sellerForm');
    const fileInput = document.getElementById('profilePic');
    const imagePreview = document.getElementById('imagePreview');
    const plusIcon = document.getElementById('plus-icon');
    const countrySelect = document.getElementById('countrySelect');
    const langSelect = document.getElementById('languageSelect');
    const langContainer = document.getElementById('languagesContainer');

    // التحقق من وجود العناصر في الصفحة
    if (!sellerForm) console.error("sellerForm not found!");
    if (!fileInput) console.error("profilePic not found!");
    if (!countrySelect) console.error("countrySelect not found!");
    if (!langSelect) console.error("languageSelect not found!");

    // تحميل الصورة
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                // التحقق من حجم الصورة
                if (file.size > 5 * 1024 * 1024) {
                    showToast("Image size must be less than 5MB", "error");
                    this.value = '';
                    return;
                }
                
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

    // إضافة لغة جديدة
    if (langSelect) {
        langSelect.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            const langId = this.value;
            const langName = selectedOption.text;
            
            if (langId && !selectedLangs.some(l => l.id == langId)) {
                selectedLangs.push({ id: parseInt(langId), name: langName });
                renderLangs();
                showToast(`${langName} added`, "success");
            }
            this.selectedIndex = 0;
        });
    }

    window.removeLang = (langId) => {
        const removedLang = selectedLangs.find(l => l.id == langId);
        selectedLangs = selectedLangs.filter(l => l.id != langId);
        renderLangs();
        if (removedLang) {
            showToast(`${removedLang.name} removed`, "info");
        }
    };

    function renderLangs() {
        if (!langContainer) return;
        langContainer.innerHTML = selectedLangs.map(l => `
            <div class="lang-tag" style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); padding: 6px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; margin: 5px;">
                <span>${escapeHtml(l.name)}</span>
                <span class="remove-btn" onclick="removeLang(${l.id})" style="cursor: pointer; color: #ef4444; font-weight: bold;">&times;</span>
            </div>
        `).join('');
    }

    // تقديم النموذج
    if (sellerForm) {
        sellerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            console.log("Form submitted");
            
            // جلب الحقول
            const nameInput = document.getElementById('fullName');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const countrySelectElem = document.getElementById('countrySelect');
            const experienceTextarea = document.getElementById('experience');
            const aboutMeTextarea = document.getElementById('aboutMe');
            const termsCheck = document.getElementById('termsCheck');

            const fullName = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
            const countryId = countrySelectElem ? countrySelectElem.value : '';
            const experience = experienceTextarea ? experienceTextarea.value.trim() : '';
            const aboutMe = aboutMeTextarea ? aboutMeTextarea.value.trim() : '';
            const termsAccepted = termsCheck ? termsCheck.checked : false;

            console.log("Form data:", { fullName, email, countryId, experienceLength: experience.length, aboutMeLength: aboutMe.length, languagesCount: selectedLangs.length });

            // التحقق من الصورة
            if (!fileInput.files[0]) {
                showToast("Your profile needs a professional photo.", "error");
                return;
            }
            
            // التحقق من الحقول الأساسية
            if (!fullName) {
                showToast("Please enter your full name.", "error");
                return;
            }
            if (!email) {
                showToast("Please enter your email address.", "error");
                return;
            }
            if (!password) {
                showToast("Please enter a password.", "error");
                return;
            }
            if (!countryId) {
                showToast("Please select your country.", "error");
                return;
            }
            
            // التحقق من صحة الإيميل
            if (!email.includes('@') || !email.includes('.')) {
                showToast("Please enter a valid email address.", "error");
                return;
            }
            
            // التحقق من تطابق كلمة المرور
            if (password !== confirmPassword) {
                showToast("Passwords do not match.", "error");
                return;
            }
            
            // التحقق من طول كلمة المرور
            if (password.length < 8) {
                showToast("Password must be at least 8 characters.", "error");
                return;
            }
            
            // التحقق من طول الخبرة
            if (experience.length < 20) {
                showToast("Experience section is too short (min 20 characters).", "error");
                return;
            }
            
            // التحقق من طول نبذة عني
            if (aboutMe.length < 30) {
                showToast("About Me section is too short (min 30 characters).", "error");
                return;
            }
            
            // التحقق من اختيار لغة واحدة على الأقل
            if (selectedLangs.length === 0) {
                showToast("Please select at least one language.", "error");
                return;
            }
            
            // التحقق من الموافقة على الشروط
            if (!termsAccepted) {
                showToast("You must agree to the terms and conditions.", "error");
                return;
            }

            // تعطيل الزر أثناء المعالجة
            const submitBtn = sellerForm.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> CREATING ACCOUNT...';
            }

          // في دالة submit، تأكد من إرسال الصورة بشكل صحيح
const formData = new FormData();
formData.append('profilePic', fileInput.files[0]);  // هذا صحيح
formData.append('name', fullName);
formData.append('email', email);
formData.append('password', password);
formData.append('country_id', countryId);
formData.append('experience', experience);
formData.append('aboutMe', aboutMe);
formData.append('languages', JSON.stringify(selectedLangs.map(l => l.id)));

            try {
                console.log("Sending request to API...");
                const apiUrl = '/Taskly/controllers/registerSeller.php';
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: formData
                });
                
                console.log("Response status:", response.status);
                
                const data = await response.json();
                console.log("Response data:", data);
                
                if (data.success) {
                    showToast("Welcome to Taskly! Redirecting to your dashboard.", "success");
                    setTimeout(() => {
                        window.location.href = 'sellerDashboard.html';
                    }, 2000);
                } else {
                    showToast(data.message || "Signup failed. Please try again.", "error");
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'Create My Account';
                    }
                }
            } catch (error) {
                console.error('Fetch error:', error);
                showToast("Network error: " + error.message, "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Create My Account';
                }
            }
        });
    }
});

// دالة لجلب الدول واللغات من قاعدة البيانات
async function loadCountriesAndLanguages() {
    try {
        console.log("Fetching countries and languages from API...");
        const response = await fetch('/Taskly/controllers/getSellerData.php');
        const data = await response.json();
        
        console.log("API response:", data);
        
        if (data.success) {
            countriesData = data.countries || [];
            languagesData = data.languages || [];
            
            // تعبئة قائمة الدول
            const countrySelect = document.getElementById('countrySelect');
            if (countrySelect) {
                countrySelect.innerHTML = '<option value="" disabled selected>-- Select Country --</option>';
                if (countriesData.length > 0) {
                    countriesData.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country.id;
                        option.textContent = country.name;
                        countrySelect.appendChild(option);
                    });
                } else {
                    // خيارات افتراضية
                    const defaultCountries = [
                        { id: 1, name: 'Libya' },
                        { id: 2, name: 'Egypt' },
                        { id: 3, name: 'Saudi Arabia' }
                    ];
                    defaultCountries.forEach(country => {
                        const option = document.createElement('option');
                        option.value = country.id;
                        option.textContent = country.name;
                        countrySelect.appendChild(option);
                    });
                }
            }
            
            // تعبئة قائمة اللغات
            const langSelect = document.getElementById('languageSelect');
            if (langSelect) {
                langSelect.innerHTML = '<option value="" disabled selected>-- Select Language --</option>';
                if (languagesData.length > 0) {
                    languagesData.forEach(language => {
                        const option = document.createElement('option');
                        option.value = language.id;
                        option.textContent = language.name;
                        langSelect.appendChild(option);
                    });
                } else {
                    // خيارات افتراضية
                    const defaultLanguages = [
                        { id: 1, name: 'Arabic' },
                        { id: 2, name: 'English' }
                    ];
                    defaultLanguages.forEach(language => {
                        const option = document.createElement('option');
                        option.value = language.id;
                        option.textContent = language.name;
                        langSelect.appendChild(option);
                    });
                }
            }
            
            console.log("Countries loaded:", countriesData.length);
            console.log("Languages loaded:", languagesData.length);
        } else {
            console.error('Failed to load data:', data.message);
            setDefaultOptions();
        }
    } catch (error) {
        console.error('Error loading countries and languages:', error);
        setDefaultOptions();
    }
}

function setDefaultOptions() {
    const countrySelect = document.getElementById('countrySelect');
    if (countrySelect) {
        countrySelect.innerHTML = '<option value="" disabled selected>-- Select Country --</option>';
        const defaultCountries = [
            { id: 1, name: 'Libya' },
            { id: 2, name: 'Egypt' },
            { id: 3, name: 'Saudi Arabia' }
        ];
        defaultCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.id;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });
    }
    
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.innerHTML = '<option value="" disabled selected>-- Select Language --</option>';
        const defaultLanguages = [
            { id: 1, name: 'Arabic' },
            { id: 2, name: 'English' }
        ];
        defaultLanguages.forEach(language => {
            const option = document.createElement('option');
            option.value = language.id;
            option.textContent = language.name;
            langSelect.appendChild(option);
        });
    }
}

// دالة لعرض الإشعارات
function showToast(msg, type) {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-info-circle');
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${msg}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// دالة لحماية الـ HTML من الـ XSS
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
