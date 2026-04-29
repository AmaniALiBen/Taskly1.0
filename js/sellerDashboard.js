// // ========================================
// // SELLER DASHBOARD - CLEAN VERSION
// // ========================================

// let sellerData = {
//     name: "Ahmed Ali",
//     email: "ahmed@taskly.com",
//     bio: "Software developer specialized in UI/UX and web interfaces. I have 5+ years of experience building modern web applications and working with international clients.",
//     skills: "UI/UX Design, React.js, Node.js, Python, Tailwind CSS, Figma",
//     country: "Libya",
//     languages: ["English", "Arabic"],
//     avatar: null,
//     balance: 0,
//     pending: 0,
//     totalEarned: 0,
//     gigs: [],
//     orders: [],
//     transactions: []
// };

// let currentWithdrawMethod = 'bank';
// let currentUser = null;

// // ========================================
// // جلب بيانات المستخدم من الجلسة
// // ========================================

// // ========================================
// // INITIALIZATION
// // ========================================
// document.addEventListener('DOMContentLoaded', async () => {
//     // جلب بيانات المستخدم أولاً
//     await fetchUserData();
    
//     // ثم باقي الدوال
//     updateStats();
//     loadProfile();
//     setupAvatarUpload();
//     renderLanguages();
//     setupMethodButtons();
//     setupCharCounter();
//     setupAutoResize();
//     updateSidebarProfile();
//     renderGigs();
//     renderOrders();
//     renderTransactions();
// });

// function updateStats() {
//     const availableBalance = document.getElementById('availableBalance');
//     const pendingBalance = document.getElementById('pendingBalance');
//     if (availableBalance) availableBalance.innerText = `$${sellerData.balance.toLocaleString()}`;
//     if (pendingBalance) pendingBalance.innerText = `$${sellerData.pending.toLocaleString()}`;
// }

// function updateSidebarProfile() {
//     const sidebarName = document.getElementById('sidebarName');
//     const sidebarAvatar = document.getElementById('sidebarAvatar');
//     const profileEmail=document.getElementById('profileEmail');

//     if (sidebarName) sidebarName.innerText = sellerData.name;
//     if(profileEmail)profileEmail.innerText=sellerData.email;
//     if (sidebarAvatar && !sidebarAvatar.style.backgroundImage) {
//         sidebarAvatar.innerText = sellerData.name.charAt(0);
//     }
// }

// function loadProfile() {
//     const profName = document.getElementById('profName');
//     const profEmail = document.getElementById('profEmail');
//     const profBio = document.getElementById('profBio');
//     const profSkills = document.getElementById('profSkills');
//     const profCountry = document.getElementById('profCountry');
    
//     if (profName) profName.value = sellerData.name;
//     if (profEmail) profEmail.value = sellerData.email;
//     if (profBio) profBio.value = sellerData.bio;
//     if (profSkills) profSkills.value = sellerData.skills;
//     if (profCountry) profCountry.value = sellerData.country;
    
//     updateCharCounter();
//     setTimeout(() => {
//         if (profBio) autoResize(profBio);
//         if (profSkills) autoResize(profSkills);
//     }, 100);
// }

// function saveProfile() {
//     const profName = document.getElementById('profName');
//     const profBio = document.getElementById('profBio');
//     const profSkills = document.getElementById('profSkills');
//     const profCountry = document.getElementById('profCountry');
    
//     if (profName) sellerData.name = profName.value;
//     if (profBio) sellerData.bio = profBio.value;
//     if (profSkills) sellerData.skills = profSkills.value;
//     if (profCountry) sellerData.country = profCountry.value;
    
//     updateSidebarProfile();
//     showToast("Profile saved successfully", "success");
// }

// function updatePassword() {
//     const oldPass = document.getElementById('oldPass');
//     const newPass = document.getElementById('newPass');
//     const confirmPass = document.getElementById('confirmPass');
    
//     if (!oldPass.value) return showToast("Current password is required", "error");
//     if (newPass.value.length < 6) return showToast("Password must be at least 6 characters", "error");
//     if (newPass.value !== confirmPass.value) return showToast("Passwords do not match", "error");
    
//     showToast("Password updated successfully", "success");
//     oldPass.value = "";
//     newPass.value = "";
//     confirmPass.value = "";
// }

// // ========================================
// // CHAR COUNTER
// // ========================================
// function setupCharCounter() {
//     const bioTextarea = document.getElementById('profBio');
//     if (bioTextarea) {
//         bioTextarea.addEventListener('input', updateCharCounter);
//     }
// }

// function updateCharCounter() {
//     const bioTextarea = document.getElementById('profBio');
//     const counter = document.getElementById('bioCounter');
//     if (bioTextarea && counter) {
//         const length = bioTextarea.value.length;
//         counter.innerText = `${length}/500`;
        
//         if (length > 450) {
//             counter.style.color = '#f59e0b';
//         } else if (length > 480) {
//             counter.style.color = '#ef4444';
//         } else {
//             counter.style.color = '#6b7280';
//         }
//     }
// }

// // ========================================
// // AUTO RESIZE
// // ========================================
// function setupAutoResize() {
//     const bioTextarea = document.getElementById('profBio');
//     const skillsTextarea = document.getElementById('profSkills');
    
//     if (bioTextarea) {
//         bioTextarea.addEventListener('input', function() { autoResize(this); });
//     }
//     if (skillsTextarea) {
//         skillsTextarea.addEventListener('input', function() { autoResize(this); });
//     }
// }

// function autoResize(textarea) {
//     if (!textarea) return;
//     textarea.style.height = 'auto';
//     textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
// }

// // ========================================
// // LANGUAGES
// // ========================================
// function renderLanguages() {
//     const container = document.getElementById('languagesContainer');
//     if (!container) return;
    
//     if (sellerData.languages.length === 0) {
//         container.innerHTML = '<span style="color: #6b7280; font-size: 0.75rem; padding: 8px; display: block; text-align: center;">No languages added</span>';
//         return;
//     }
    
//     container.innerHTML = sellerData.languages.map(lang => `
//         <span class="lang-tag">
//             ${escapeHtml(lang)}
//             <span class="remove-lang" onclick="removeLanguage('${escapeHtml(lang)}')">&times;</span>
//         </span>
//     `).join('');
// }

// function addLanguage() {
//     const select = document.getElementById('langSelect');
//     const language = select.value;
    
//     if (!language) {
//         showToast("Please select a language", "error");
//         return;
//     }
//     if (sellerData.languages.includes(language)) {
//         showToast("Language already added", "error");
//         return;
//     }
    
//     sellerData.languages.push(language);
//     renderLanguages();
//     select.value = "";
//     showToast(`Added ${language}`, "success");
// }

// function removeLanguage(language) {
//     sellerData.languages = sellerData.languages.filter(l => l !== language);
//     renderLanguages();
//     showToast(`Removed ${language}`, "success");
// }

// // ========================================
// // WALLET & WITHDRAWAL
// // ========================================
// function setWithdrawMethod(method) {
//     currentWithdrawMethod = method;
//     const methodLabel = document.getElementById('methodLabel');
//     if (methodLabel) {
//         methodLabel.innerText = method === 'bank' ? "IBAN / Account Number" : "PayPal Email Address";
//     }
    
//     document.querySelectorAll('.method-btn').forEach(btn => {
//         btn.classList.remove('active');
//         if (btn.getAttribute('data-method') === method) {
//             btn.classList.add('active');
//         }
//     });
// }

// function setupMethodButtons() {
//     document.querySelectorAll('.method-btn').forEach(btn => {
//         if (btn.getAttribute('data-method') === 'bank') {
//             btn.classList.add('active');
//         }
//     });
// }

// function requestWithdrawal() {
//     const account = document.getElementById('payoutAccount');
//     const amountInput = document.getElementById('payoutAmount');
    
//     if (!account.value) return showToast("Enter account details", "error");
    
//     const amount = parseFloat(amountInput.value);
//     if (!amount || amount <= 0) return showToast("Enter valid amount", "error");
//     if (amount > sellerData.balance) return showToast("Insufficient balance", "error");
    
//     sellerData.balance -= amount;
//     sellerData.transactions.unshift({
//         date: new Date().toISOString().split('T')[0],
//         amount: amount,
//         type: "withdrawal",
//         status: "pending"
//     });
    
//     updateStats();
//     renderTransactions();
//     amountInput.value = "";
//     showToast(`$${amount} withdrawal requested`, "success");
// }

// function renderTransactions() {
//     const container = document.getElementById('transactionsList');
//     if (!container) return;
    
//     if (sellerData.transactions.length === 0) {
//         container.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center;">No transactions yet</div>';
//         return;
//     }
    
//     container.innerHTML = sellerData.transactions.map(t => `
//         <div class="transaction-item">
//             <span class="transaction-date">${t.date}</span>
//             <span class="transaction-amount ${t.type === 'earning' ? 'positive' : 'negative'}">
//                 ${t.type === 'earning' ? '+' : '-'}$${t.amount}
//             </span>
//             <span class="transaction-status">${t.status === 'completed' ? 'Completed' : 'Pending'}</span>
//         </div>
//     `).join('');
// }

// // ========================================
// // GIGS MANAGEMENT
// // ========================================
// function renderGigs() {
//     const container = document.getElementById('gigsGrid');
//     if (!container) return;
    
//     if (typeof window.gigsData === 'undefined') {
//         container.innerHTML = `
//             <div class="empty-state" style="grid-column: 1/-1;">
//                 <div class="empty-message">
//                     <i class="fas fa-spinner fa-pulse"></i>
//                     <p>Loading your gigs...</p>
//                 </div>
//             </div>
//         `;
//     }
// }

// function updateGigStats(activeCount, pausedCount) {
//     const activeEl = document.getElementById('activeCount');
//     const pausedEl = document.getElementById('pausedCount');
//     if (activeEl) activeEl.innerText = activeCount;
//     if (pausedEl) pausedEl.innerText = pausedCount;
// }

// // ========================================
// // ORDERS MANAGEMENT
// // ========================================
// function renderOrders() {
//     const container = document.getElementById('ordersList');
//     if (!container) return;
    
//     container.innerHTML = `
//         <div class="empty-message">
//             <i class="fas fa-inbox"></i>
//             <p>No orders yet</p>
//             <span>When you receive orders, they'll appear here</span>
//         </div>
//     `;
// }

// // ========================================
// // UI HELPERS
// // ========================================
// function switchTab(tabName) {
//     document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
//     document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
//     const targetTab = document.getElementById(`${tabName}-tab`);
//     if (targetTab) targetTab.classList.add('active');
//     if (event && event.currentTarget) event.currentTarget.classList.add('active');
    
//     if (tabName === 'gigs' && typeof refreshGigsDisplay === 'function') {
//         refreshGigsDisplay();
//     }
// }

// function showAddGigModal() {
//     window.location.href = 'createGig.html';
// }

// function showToast(message, type) {
//     let container = document.getElementById('toastContainer');
//     if (!container) {
//         container = document.createElement('div');
//         container.className = 'toast-container';
//         container.id = 'toastContainer';
//         document.body.appendChild(container);
//     }
    
//     const toast = document.createElement('div');
//     toast.className = `toast ${type}`;
//     const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
//     toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
//     container.appendChild(toast);
    
//     setTimeout(() => {
//         toast.style.animation = 'slideOutRight 0.3s ease';
//         setTimeout(() => toast.remove(), 300);
//     }, 3500);
// }

// function setupAvatarUpload() {
//     const avatarInput = document.getElementById('avatarInput');
//     const avatarPreview = document.getElementById('avatarPreview');
//     const sidebarAvatar = document.getElementById('sidebarAvatar');
//     const navAvatar = document.querySelector('.nav-avatar-circle');
    
//     if (!avatarInput) return;
    
//     avatarInput.onchange = async (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
        
//         const formData = new FormData();
//         formData.append('avatar', file);
        
//         try {
//             const response = await fetch('../php/upload-avatar.php', {
//                 method: 'POST',
//                 body: formData
//             });
//             const data = await response.json();
            
//             if (data.success) {
//                 const url = data.avatar_url;
                
//                 if (avatarPreview) {
//                     avatarPreview.style.backgroundImage = `url(${url})`;
//                     avatarPreview.style.backgroundSize = 'cover';
//                     avatarPreview.style.backgroundPosition = 'center';
//                     avatarPreview.innerText = '';
//                 }
//                 if (sidebarAvatar) {
//                     sidebarAvatar.style.backgroundImage = `url(${url})`;
//                     sidebarAvatar.style.backgroundSize = 'cover';
//                     sidebarAvatar.innerText = '';
//                 }
//                 if (navAvatar) {
//                     navAvatar.style.backgroundImage = `url(${url})`;
//                     navAvatar.style.backgroundSize = 'cover';
//                     navAvatar.innerText = '';
//                 }
//                 showToast("Profile picture updated", "success");
//             } else {
//                 showToast(data.message || "Upload failed", "error");
//             }
//         } catch (error) {
//             showToast("Upload failed", "error");
//         }
//     };
// }

// function escapeHtml(str) {
//     if (!str) return '';
//     return str.replace(/[&<>]/g, function(m) {
//         if (m === '&') return '&amp;';
//         if (m === '<') return '&lt;';
//         if (m === '>') return '&gt;';
//         return m;
//     });
// }
// async function fetchUserData() {
//     try {
//         const response = await fetch('../php/getUser.php');
//         const data = await response.json();
        
//         console.log('Data from server:', data);
        
//         if (data.loggedIn) {
//             currentUser = data;
//             sellerData.name = data.username;
//             sellerData.email = data.email;
            
//             // تحديث الاسم
//             const sidebarName = document.getElementById('sidebarName');
//             const profName = document.getElementById('profName');
//             const profEmail = document.getElementById('profEmail');
//             const profileEmail=document.getElementById('profileEmail');
            
//             if (sidebarName) sidebarName.innerText = data.username;
//             if (profName) profName.value = data.username;
//             if (profEmail) profEmail.value = data.email;
//             if(profileEmail)profileEmail.value=data.email;

            
//             // تحديث الصورة
//             const sidebarAvatar = document.getElementById('sidebarAvatar');
//             const navAvatar = document.querySelector('.nav-avatar-circle');
//             const avatarPreview = document.getElementById('avatarPreview');
            
//             // التحقق من وجود صورة
//             if  (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
//                 const url = data.avatar;
//                 if (sidebarAvatar) {
//                     sidebarAvatar.style.backgroundImage = `url(${url})`;
//                     sidebarAvatar.style.backgroundSize = 'cover';
//                     sidebarAvatar.innerText = '';
//                 }
//                 if (navAvatar) {
//                     navAvatar.style.backgroundImage = `url(${url})`;
//                     navAvatar.style.backgroundSize = 'cover';
//                     navAvatar.innerText = '';
//                 }
//                 if (avatarPreview) {
//                     avatarPreview.style.backgroundImage = `url(${url})`;
//                     avatarPreview.style.backgroundSize = 'cover';
//                     avatarPreview.innerText = '';
//                 }
//             } else {
//                 const firstLetter = data.username.charAt(0).toUpperCase();
//                 if (sidebarAvatar) sidebarAvatar.innerText = firstLetter;
//                 if (navAvatar) navAvatar.innerText = firstLetter;
//                 if (avatarPreview) avatarPreview.innerText = firstLetter;
//             }
            
//             console.log('✅ User data loaded successfully');
            
//         } else {
//             console.log('User not logged in');
//             window.location.href = '../index.html';
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         window.location.href = '../index.html';
//     }
// }// ========================================
// SELLER DASHBOARD - COMPLETE VERSION
// ========================================

let sellerData = {
    name: "Ahmed Ali",
    email: "ahmed@taskly.com",
    bio: "Software developer specialized in UI/UX and web interfaces. I have 5+ years of experience building modern web applications and working with international clients.",
    skills: "UI/UX Design, React.js, Node.js, Python, Tailwind CSS, Figma",
    country: "Libya",
    languages: ["English", "Arabic"],
    avatar: null,
    balance: 1250.00,
    pending: 350.00,
    totalEarned: 4850.00,
    gigs: [],
    orders: [],
    transactions: [
        { date: "2025-04-15", amount: 150.00, type: "earning", status: "completed" },
        { date: "2025-04-10", amount: 200.00, type: "earning", status: "completed" },
        { date: "2025-04-05", amount: 100.00, type: "withdrawal", status: "completed" }
    ]
};

let currentWithdrawMethod = 'bank';
let currentUser = null;

// ========================================
// SAMPLE GIGS DATA
// ========================================
window.gigsData = [
    { id: 1, title: "Modern Web Development with React", category: "Development", price: 350, status: "active", image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400" },
    { id: 2, title: "UI/UX Design Package", category: "Design", price: 280, status: "active", image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=400" },
    { id: 3, title: "SEO Optimization & Marketing", category: "Marketing", price: 150, status: "paused", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400" },
    { id: 4, title: "Mobile App Development", category: "Development", price: 550, status: "active", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400" }
];

// ========================================
// SAMPLE ORDERS DATA
// ========================================
sellerData.orders = [
    { id: "ORD-001", customer: "John Doe", gig: "Modern Web Development with React", amount: 350, status: "in_progress", date: "2025-04-20" },
    { id: "ORD-002", customer: "Jane Smith", gig: "UI/UX Design Package", amount: 280, status: "completed", date: "2025-04-15" }
];

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserData();
    updateStats();
    loadProfile();
    setupAvatarUpload();
    renderLanguages();
    setupMethodButtons();
    setupCharCounter();
    setupAutoResize();
    updateSidebarProfile();
    renderGigs();
    renderOrders();
    renderTransactions();
});

// ========================================
// FETCH USER DATA FROM SERVER
// ========================================
async function fetchUserData() {
    try {
        const response = await fetch('../php/getUser.php');
        const data = await response.json();
        
        console.log('Data from server:', data);
        
        if (data.loggedIn) {
            currentUser = data;
            sellerData.name = data.username;
            sellerData.email = data.email;
            
            // Update name fields
            const sidebarName = document.getElementById('sidebarName');
            const profName = document.getElementById('profName');
            const profEmail = document.getElementById('profEmail');
            const profileEmail = document.getElementById('profileEmail');
            
            if (sidebarName) sidebarName.innerText = data.username;
            if (profName) profName.value = data.username;
            if (profEmail) profEmail.value = data.email;
            if (profileEmail) profileEmail.value = data.email;
            
            // Update avatar
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            const navAvatar = document.querySelector('.nav-avatar-circle');
            const avatarPreview = document.getElementById('avatarPreview');
            
            // Check if avatar exists and is valid
            const hasValidAvatar = data.avatar && 
                                   data.avatar !== '' && 
                                   data.avatar !== 'null' &&
                                   data.avatar !== 'undefined' &&
                                   !data.avatar.includes('default-avatar');
            
            if (hasValidAvatar) {
                const url = data.avatar;
                console.log('Loading avatar from URL:', url);
                
                if (sidebarAvatar) {
                    sidebarAvatar.style.backgroundImage = `url(${url})`;
                    sidebarAvatar.style.backgroundSize = 'cover';
                    sidebarAvatar.style.backgroundPosition = 'center';
                    sidebarAvatar.style.backgroundColor = 'transparent';
                    sidebarAvatar.innerText = '';
                }
                if (navAvatar) {
                    navAvatar.style.backgroundImage = `url(${url})`;
                    navAvatar.style.backgroundSize = 'cover';
                    navAvatar.style.backgroundPosition = 'center';
                    navAvatar.style.backgroundColor = 'transparent';
                    navAvatar.innerText = '';
                }
                if (avatarPreview) {
                    avatarPreview.style.backgroundImage = `url(${url})`;
                    avatarPreview.style.backgroundSize = 'cover';
                    avatarPreview.style.backgroundPosition = 'center';
                    avatarPreview.style.backgroundColor = 'transparent';
                    avatarPreview.innerText = '';
                }
            } else {
                // Show first letter as avatar
                const firstLetter = data.username.charAt(0).toUpperCase();
                console.log('No avatar, showing first letter:', firstLetter);
                
                const defaultStyles = {
                    backgroundImage: 'none',
                    backgroundColor: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: 'white'
                };
                
                if (sidebarAvatar) {
                    Object.assign(sidebarAvatar.style, defaultStyles);
                    sidebarAvatar.innerText = firstLetter;
                }
                if (navAvatar) {
                    Object.assign(navAvatar.style, defaultStyles);
                    navAvatar.innerText = firstLetter;
                }
                if (avatarPreview) {
                    Object.assign(avatarPreview.style, defaultStyles);
                    avatarPreview.innerText = firstLetter;
                }
            }
            
            console.log('✅ User data loaded successfully');
            
        } else {
            console.log('User not logged in');
            window.location.href = '../index.html';
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        // Don't redirect on error for development
        // window.location.href = '../index.html';
        
        // Set default avatar with first letter from sellerData
        const firstLetter = sellerData.name.charAt(0).toUpperCase();
        const sidebarAvatar = document.getElementById('sidebarAvatar');
        const navAvatar = document.querySelector('.nav-avatar-circle');
        const avatarPreview = document.getElementById('avatarPreview');
        
        const defaultStyles = {
            backgroundImage: 'none',
            backgroundColor: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1rem',
            color: 'white'
        };
        
        if (sidebarAvatar) {
            Object.assign(sidebarAvatar.style, defaultStyles);
            sidebarAvatar.innerText = firstLetter;
        }
        if (navAvatar) {
            Object.assign(navAvatar.style, defaultStyles);
            navAvatar.innerText = firstLetter;
        }
        if (avatarPreview) {
            Object.assign(avatarPreview.style, defaultStyles);
            avatarPreview.innerText = firstLetter;
        }
    }
}

// ========================================
// UPDATE STATS DISPLAY
// ========================================
function updateStats() {
    const availableBalance = document.getElementById('availableBalance');
    const pendingBalance = document.getElementById('pendingBalance');
    const totalEarned = document.getElementById('totalEarned');
    
    if (availableBalance) availableBalance.innerText = `$${sellerData.balance.toLocaleString()}`;
    if (pendingBalance) pendingBalance.innerText = `$${sellerData.pending.toLocaleString()}`;
    if (totalEarned) totalEarned.innerText = `$${sellerData.totalEarned.toLocaleString()}`;
}

// ========================================
// UPDATE SIDEBAR PROFILE
// ========================================
function updateSidebarProfile() {
    const sidebarName = document.getElementById('sidebarName');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const profileEmail = document.getElementById('profileEmail');

    if (sidebarName) sidebarName.innerText = sellerData.name;
    if (profileEmail) profileEmail.innerText = sellerData.email;
    
    // Only set text if no background image
    if (sidebarAvatar && !sidebarAvatar.style.backgroundImage) {
        sidebarAvatar.innerText = sellerData.name.charAt(0);
    }
}

// ========================================
// LOAD PROFILE DATA INTO FORM
// ========================================
function loadProfile() {
    const profName = document.getElementById('profName');
    const profEmail = document.getElementById('profEmail');
    const profBio = document.getElementById('profBio');
    const profSkills = document.getElementById('profSkills');
    const profCountry = document.getElementById('profCountry');
    
    if (profName) profName.value = sellerData.name;
    if (profEmail) profEmail.value = sellerData.email;
    if (profBio) profBio.value = sellerData.bio;
    if (profSkills) profSkills.value = sellerData.skills;
    if (profCountry) profCountry.value = sellerData.country;
    
    updateCharCounter();
    setTimeout(() => {
        if (profBio) autoResize(profBio);
        if (profSkills) autoResize(profSkills);
    }, 100);
}

// ========================================
// SAVE PROFILE DATA
// ========================================
function saveProfile() {
    const profName = document.getElementById('profName');
    const profBio = document.getElementById('profBio');
    const profSkills = document.getElementById('profSkills');
    const profCountry = document.getElementById('profCountry');
    
    if (profName) sellerData.name = profName.value;
    if (profBio) sellerData.bio = profBio.value;
    if (profSkills) sellerData.skills = profSkills.value;
    if (profCountry) sellerData.country = profCountry.value;
    
    updateSidebarProfile();
    showToast("Profile saved successfully", "success");
}

// ========================================
// UPDATE PASSWORD
// ========================================
function updatePassword() {
    const oldPass = document.getElementById('oldPass');
    const newPass = document.getElementById('newPass');
    const confirmPass = document.getElementById('confirmPass');
    
    if (!oldPass.value) return showToast("Current password is required", "error");
    if (newPass.value.length < 6) return showToast("Password must be at least 6 characters", "error");
    if (newPass.value !== confirmPass.value) return showToast("Passwords do not match", "error");
    
    showToast("Password updated successfully", "success");
    oldPass.value = "";
    newPass.value = "";
    confirmPass.value = "";
}

// ========================================
// CHARACTER COUNTER FOR BIO
// ========================================
function setupCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    if (bioTextarea) {
        bioTextarea.addEventListener('input', updateCharCounter);
    }
}

function updateCharCounter() {
    const bioTextarea = document.getElementById('profBio');
    const counter = document.getElementById('bioCounter');
    if (bioTextarea && counter) {
        const length = bioTextarea.value.length;
        counter.innerText = `${length}/500`;
        
        if (length > 450) {
            counter.style.color = '#f59e0b';
        } else if (length > 480) {
            counter.style.color = '#ef4444';
        } else {
            counter.style.color = '#6b7280';
        }
    }
}

// ========================================
// AUTO RESIZE TEXTAREAS
// ========================================
function setupAutoResize() {
    const bioTextarea = document.getElementById('profBio');
    const skillsTextarea = document.getElementById('profSkills');
    
    if (bioTextarea) {
        bioTextarea.addEventListener('input', function() { autoResize(this); });
    }
    if (skillsTextarea) {
        skillsTextarea.addEventListener('input', function() { autoResize(this); });
    }
}

function autoResize(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px';
}

// ========================================
// LANGUAGES MANAGEMENT
// ========================================
function renderLanguages() {
    const container = document.getElementById('languagesContainer');
    if (!container) return;
    
    if (sellerData.languages.length === 0) {
        container.innerHTML = '<span style="color: #6b7280; font-size: 0.75rem; padding: 8px; display: block; text-align: center;">No languages added</span>';
        return;
    }
    
    container.innerHTML = sellerData.languages.map(lang => `
        <span class="lang-tag">
            ${escapeHtml(lang)}
            <span class="remove-lang" onclick="removeLanguage('${escapeHtml(lang)}')">&times;</span>
        </span>
    `).join('');
}

function addLanguage() {
    const select = document.getElementById('langSelect');
    const language = select.value;
    
    if (!language) {
        showToast("Please select a language", "error");
        return;
    }
    if (sellerData.languages.includes(language)) {
        showToast("Language already added", "error");
        return;
    }
    
    sellerData.languages.push(language);
    renderLanguages();
    select.value = "";
    showToast(`Added ${language}`, "success");
}

function removeLanguage(language) {
    sellerData.languages = sellerData.languages.filter(l => l !== language);
    renderLanguages();
    showToast(`Removed ${language}`, "success");
}

// ========================================
// WALLET & WITHDRAWAL
// ========================================
function setWithdrawMethod(method) {
    currentWithdrawMethod = method;
    const methodLabel = document.getElementById('methodLabel');
    if (methodLabel) {
        methodLabel.innerText = method === 'bank' ? "IBAN / Account Number" : "PayPal Email Address";
    }
    
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-method') === method) {
            btn.classList.add('active');
        }
    });
}

function setupMethodButtons() {
    document.querySelectorAll('.method-btn').forEach(btn => {
        if (btn.getAttribute('data-method') === 'bank') {
            btn.classList.add('active');
        }
    });
}

function requestWithdrawal() {
    const account = document.getElementById('payoutAccount');
    const amountInput = document.getElementById('payoutAmount');
    
    if (!account.value) return showToast("Enter account details", "error");
    
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) return showToast("Enter valid amount", "error");
    if (amount > sellerData.balance) return showToast("Insufficient balance", "error");
    
    sellerData.balance -= amount;
    sellerData.transactions.unshift({
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        type: "withdrawal",
        status: "pending"
    });
    
    updateStats();
    renderTransactions();
    amountInput.value = "";
    showToast(`$${amount} withdrawal requested`, "success");
}

function renderTransactions() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    if (sellerData.transactions.length === 0) {
        container.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center;">No transactions yet</div>';
        return;
    }
    
    container.innerHTML = sellerData.transactions.map(t => `
        <div class="transaction-item">
            <span class="transaction-date">${t.date}</span>
            <span class="transaction-amount ${t.type === 'earning' ? 'positive' : 'negative'}">
                ${t.type === 'earning' ? '+' : '-'}$${Math.abs(t.amount).toLocaleString()}
            </span>
            <span class="transaction-status ${t.status === 'completed' ? 'completed' : 'pending'}">${t.status === 'completed' ? 'Completed' : 'Pending'}</span>
        </div>
    `).join('');
}

// ========================================
// GIGS MANAGEMENT
// ========================================
function renderGigs() {
    const container = document.getElementById('gigsGrid');
    if (!container) return;
    
    if (!window.gigsData || window.gigsData.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-message">
                    <i class="fas fa-briefcase"></i>
                    <p>No gigs created yet</p>
                    <span>Create your first gig to start selling</span>
                </div>
            </div>
        `;
        return;
    }
    
    const activeCount = window.gigsData.filter(g => g.status === 'active').length;
    const pausedCount = window.gigsData.filter(g => g.status === 'paused').length;
    updateGigStats(activeCount, pausedCount);
    
    container.innerHTML = window.gigsData.map(gig => `
        <div class="gig-card">
            <div class="gig-image">
                <img src="${gig.image}" alt="${gig.title}">
                <span class="gig-status ${gig.status}">${gig.status}</span>
            </div>
            <div class="gig-info">
                <h4>${escapeHtml(gig.title)}</h4>
                <p class="gig-category">${gig.category}</p>
                <div class="gig-price">$${gig.price}</div>
            </div>
            <div class="gig-actions">
                <button onclick="editGig(${gig.id})" class="btn-sm btn-outline">Edit</button>
                <button onclick="toggleGigStatus(${gig.id})" class="btn-sm ${gig.status === 'active' ? 'btn-warning' : 'btn-success'}">${gig.status === 'active' ? 'Pause' : 'Activate'}</button>
            </div>
        </div>
    `).join('');
}

function updateGigStats(activeCount, pausedCount) {
    const activeEl = document.getElementById('activeCount');
    const pausedEl = document.getElementById('pausedCount');
    if (activeEl) activeEl.innerText = activeCount;
    if (pausedEl) pausedEl.innerText = pausedCount;
}

function editGig(gigId) {
    window.location.href = `edit-gig.html?id=${gigId}`;
}

function toggleGigStatus(gigId) {
    const gig = window.gigsData.find(g => g.id === gigId);
    if (gig) {
        gig.status = gig.status === 'active' ? 'paused' : 'active';
        renderGigs();
        showToast(`Gig ${gig.status === 'active' ? 'activated' : 'paused'}`, "success");
    }
}

// ========================================
// ORDERS MANAGEMENT
// ========================================
function renderOrders() {
    const container = document.getElementById('ordersList');
    if (!container) return;
    
    if (sellerData.orders.length === 0) {
        container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-inbox"></i>
                <p>No orders yet</p>
                <span>When you receive orders, they'll appear here</span>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sellerData.orders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <span class="order-id">#${order.id}</span>
                <span class="order-gig">${escapeHtml(order.gig)}</span>
                <span class="order-customer">${escapeHtml(order.customer)}</span>
            </div>
            <div class="order-details">
                <span class="order-amount">$${order.amount}</span>
                <span class="order-status ${order.status}">${order.status === 'in_progress' ? 'In Progress' : 'Completed'}</span>
                <span class="order-date">${order.date}</span>
            </div>
        </div>
    `).join('');
}

// ========================================
// AVATAR UPLOAD
// ========================================
function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const navAvatar = document.querySelector('.nav-avatar-circle');
    
    if (!avatarInput) return;
    
    avatarInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show preview immediately using FileReader
        const reader = new FileReader();
        reader.onload = function(event) {
            const previewUrl = event.target.result;
            
            if (avatarPreview) {
                avatarPreview.style.backgroundImage = `url(${previewUrl})`;
                avatarPreview.style.backgroundSize = 'cover';
                avatarPreview.style.backgroundPosition = 'center';
                avatarPreview.innerText = '';
            }
            if (sidebarAvatar) {
                sidebarAvatar.style.backgroundImage = `url(${previewUrl})`;
                sidebarAvatar.style.backgroundSize = 'cover';
                sidebarAvatar.style.backgroundPosition = 'center';
                sidebarAvatar.innerText = '';
            }
            if (navAvatar) {
                navAvatar.style.backgroundImage = `url(${previewUrl})`;
                navAvatar.style.backgroundSize = 'cover';
                navAvatar.style.backgroundPosition = 'center';
                navAvatar.innerText = '';
            }
        };
        reader.readAsDataURL(file);
        
        // Upload to server
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch('../php/upload-avatar.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (data.success) {
                const url = data.avatar_url;
                
                if (avatarPreview) {
                    avatarPreview.style.backgroundImage = `url(${url})`;
                    avatarPreview.style.backgroundSize = 'cover';
                    avatarPreview.style.backgroundPosition = 'center';
                    avatarPreview.innerText = '';
                }
                if (sidebarAvatar) {
                    sidebarAvatar.style.backgroundImage = `url(${url})`;
                    sidebarAvatar.style.backgroundSize = 'cover';
                    sidebarAvatar.style.backgroundPosition = 'center';
                    sidebarAvatar.innerText = '';
                }
                if (navAvatar) {
                    navAvatar.style.backgroundImage = `url(${url})`;
                    navAvatar.style.backgroundSize = 'cover';
                    navAvatar.style.backgroundPosition = 'center';
                    navAvatar.innerText = '';
                }
                showToast("Profile picture updated", "success");
            } else {
                showToast(data.message || "Upload failed", "error");
            }
        } catch (error) {
            console.error('Upload error:', error);
            // Preview already shows the image, so no need to show error
        }
    };
}

// ========================================
// UI HELPERS
// ========================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) targetTab.classList.add('active');
    if (window.event && window.event.currentTarget) window.event.currentTarget.classList.add('active');
    
    if (tabName === 'gigs' && typeof renderGigs === 'function') {
        renderGigs();
    }
}

function showAddGigModal() {
    window.location.href = 'createGig.html';
}

function showToast(message, type) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.id = 'toastContainer';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========================================
// ADD CSS ANIMATION FOR TOAST
// ========================================
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);