// 1. بيانات وهمية تحاكي البيانات القادمة من قاعدة البيانات (Database Mockup)
const dbData = {
    title: "Modern Luxury Brand Identity Design",
    description: "I will provide a complete premium branding package including logos, typography, and color palettes tailored for high-end businesses.",
    category: "design",
    subCategory: "logo-design",
    images: [
        "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=80",
        "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=400&q=80"
    ],
    basic: { 
        price: 50, delivery: 48, unit: "hours", revs: 2, revType: "limited", 
        features: ["1 Logo Concept", "High Quality JPG"] 
    },
    standard: { 
        price: 150, delivery: 5, unit: "days", revs: 5, revType: "limited", 
        features: ["3 Logo Concepts", "Vector Files", "Source File"] 
    },
    premium: { 
        price: 300, delivery: 10, unit: "days", revs: 0, revType: "unlimited", 
        features: ["5 Logo Concepts", "Full Stationery", "Social Media Kit"] 
    }
};
// ============================================
// FETCH USER AVATAR FROM DATABASE
// ============================================
async function fetchUserAvatar() {
    try {
        const response = await fetch('../php/getUser.php');
        const data = await response.json();
        
        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');
            
            if (avatarImg) {
                if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                    avatarImg.src = data.avatar;
                } else {
                    const firstLetter = data.username ? data.username.charAt(0).toUpperCase() : 'U';
                    avatarImg.src = `https://ui-avatars.com/api/?name=${firstLetter}&background=7c3aed&color=fff&size=100`;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}

// ============================================
// GO TO PROFILE PAGE
// ============================================
function goToProfile() {
    window.location.href = 'profile.html';
}
// 2. عند تحميل الصفحة: تعبئة كافة الحقول بالبيانات
document.addEventListener('DOMContentLoaded', () => {
        fetchUserAvatar();

    // تعبئة العناوين والوصف
    document.getElementById('editTitle').value = dbData.title;
    document.getElementById('editDesc').value = dbData.description;

    // تعبئة التصنيفات
    const mainCat = document.getElementById('mainCategory');
    mainCat.value = dbData.category;
    updateSubCategories(dbData.category, dbData.subCategory);

    // مراقبة تغيير التصنيف الأساسي لتحديث الفرعي
    mainCat.addEventListener('change', function() {
        updateSubCategories(this.value);
    });

    // تعبئة معرض الصور
    const previewContainer = document.getElementById('imagePreviewContainer');
    dbData.images.forEach(url => {
        const div = document.createElement('div');
        div.className = 'preview-sq-box';
        div.style.backgroundImage = `url(${url})`;
        div.innerHTML = `<div class="del-btn" onclick="this.parentElement.remove()">×</div>`;
        previewContainer.appendChild(div);
    });

    // تعبئة الباقات الثلاث
    fillPackageData('basic', dbData.basic);
    fillPackageData('standard', dbData.standard);
    fillPackageData('premium', dbData.premium);
});

// 3. دالة تعبئة بيانات الباقة (السعر، الوقت، المراجعات، المميزات)
function fillPackageData(tier, data) {
    document.getElementById(`${tier}Price`).value = data.price;
    document.getElementById(`${tier}Time`).value = data.delivery;
    document.getElementById(`${tier}Unit`).value = data.unit;
    document.getElementById(`${tier}RevNum`).value = data.revs;
    document.getElementById(`${tier}RevType`).value = data.revType;

    // تحديث حالة حقل المراجعات (إخفاء الرقم إذا كان Unlimited)
    const revSelect = document.getElementById(`${tier}RevType`);
    toggleUnlimited(revSelect);

    // إضافة عناصر القائمة (Features)
    const list = document.getElementById(`list-${tier}`);
    data.features.forEach(feat => {
        const li = document.createElement('li');
        li.innerHTML = `<input type="text" value="${feat}" class="li-input" />`;
        list.appendChild(li);
    });
}

// 4. دالة تحديث التصنيفات الفرعية
function updateSubCategories(selectedMain, selectedSub = "") {
    const subCat = document.getElementById('subCategory');
    const subData = {
        design: ['Logo Design', 'UI/UX Design', 'Branding'],
        coding: ['Web Development', 'Mobile Apps', 'Databases'],
        marketing: ['SEO', 'Social Media', 'Ads']
    };

    subCat.innerHTML = '<option value="" disabled selected>Select Sub-category</option>';
    
    if (subData[selectedMain]) {
        subData[selectedMain].forEach(sub => {
            const opt = document.createElement('option');
            const val = sub.toLowerCase().replace(/\s+/g, '-');
            opt.value = val;
            opt.textContent = sub;
            if (val === selectedSub) opt.selected = true;
            subCat.appendChild(opt);
        });
    }
}

// 5. وظائف الإضافة والحذف الديناميكي
function addNewItem(listId) {
    const list = document.getElementById(listId);
    const li = document.createElement('li');
    li.innerHTML = `<input type="text" placeholder="New feature item..." class="li-input" />`;
    list.appendChild(li);
    li.querySelector('input').focus();
}

// 6. التحكم في حقل المراجعات (Fixed / Unlimited)
function toggleUnlimited(select) {
    const numInput = select.parentElement.previousElementSibling;
    if (select.value === 'unlimited') {
        numInput.style.visibility = 'hidden';
        numInput.value = '';
    } else {
        numInput.style.visibility = 'visible';
    }
}

// 7. التعامل مع رفع الصور الجديدة ومعاينتها
const imgInput = document.getElementById('imgInput');
imgInput.addEventListener('change', function() {
    const previewContainer = document.getElementById('imagePreviewContainer');
    Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'preview-sq-box';
            div.style.backgroundImage = `url(${e.target.result})`;
            div.innerHTML = `<div class="del-btn" onclick="this.parentElement.remove()">×</div>`;
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    });
});

// 8. حفظ التعديلات وإرسال النموذج
document.getElementById('editGigForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    
    // تأثير التحميل الفخم
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating Database...';
    
    setTimeout(() => {
        showToast("Changes saved successfully!", "success");
        setTimeout(() => {
            window.location.href = 'manage-gigs.html';
        }, 1500);
    }, 2000);
});

// 9. نظام التنبيهات (Toasts)
function showToast(msg, type) {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${msg}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
function goBack() {
    window.history.back();
}