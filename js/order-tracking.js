let selectedFiles = [];
let revisionsLeft = 3;
let orderCompleted = false;
let ratingSubmitted = false;

// ============================================
// BACK BUTTON - Go to Orders Page
// ============================================
function goBackToOrders() {
    window.location.href = 'orders.html';
}

// ============================================
// TOAST FUNCTIONS
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ============================================
// CONFIRMATION MODAL
// ============================================
function openModal({ title, body, icon, confirmText, onConfirm }) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('m-title').innerText = title;
    document.getElementById('m-body').innerText = body;
    document.getElementById('m-icon').innerHTML = `<i class="fas ${icon}"></i>`;
    const confirmBtn = document.getElementById('m-confirm');
    confirmBtn.innerText = confirmText;

    confirmBtn.onclick = () => {
        onConfirm();
        closeModal();
    };

    overlay.classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
}

// ============================================
// RATING MODAL
// ============================================
function openRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const stars = document.querySelectorAll('#rating-stars i');
        stars.forEach(star => {
            star.onmouseenter = function() {
                const rating = parseInt(this.dataset.rating);
                updateStars(rating);
            };
            star.onmouseleave = function() {
                const currentRating = parseInt(document.getElementById('rating-stars').dataset.selected || 0);
                updateStars(currentRating);
            };
            star.onclick = function() {
                const rating = parseInt(this.dataset.rating);
                document.getElementById('rating-stars').dataset.selected = rating;
                updateStars(rating);
            };
        });
    }
}

function updateStars(rating) {
    const stars = document.querySelectorAll('#rating-stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
            star.style.color = '#fbbf24';
        } else {
            star.className = 'far fa-star';
            star.style.color = 'var(--text-secondary)';
        }
    });
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function submitRating() {
    const starsContainer = document.getElementById('rating-stars');
    const rating = parseInt(starsContainer.dataset.selected || 0);
    
    if (rating === 0) {
        showToast('Please select a rating before submitting', 'error');
        return;
    }
    
    const reviewData = {
        orderId: '882-991',
        rating: rating,
        timestamp: new Date().toISOString()
    };
    
    let reviews = JSON.parse(localStorage.getItem('orderReviews') || '[]');
    reviews.push(reviewData);
    localStorage.setItem('orderReviews', JSON.stringify(reviews));
    
    showToast(`Thank you for your ${rating}-star rating!`, 'success');
    ratingSubmitted = true;
    closeRatingModal();
}

// ============================================
// COMPLAINT MODAL
// ============================================
function openComplaintModal() {
    if (orderCompleted) {
        showToast('Cannot file complaint on completed order', 'error');
        return;
    }
    const modal = document.getElementById('complaintModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeComplaintModal() {
    const modal = document.getElementById('complaintModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.querySelectorAll('input[name="complaint-type"]').forEach(radio => radio.checked = false);
        document.getElementById('complaint-description').value = '';
    }
}

function submitComplaint() {
    const selectedRadio = document.querySelector('input[name="complaint-type"]:checked');
    const complaintType = selectedRadio ? selectedRadio.value : null;
    const description = document.getElementById('complaint-description').value;
    
    if (!complaintType) {
        showToast('Please select an issue type', 'error');
        return;
    }
    if (!description.trim()) {
        showToast('Please describe the issue', 'error');
        return;
    }
    
    const complaintData = {
        orderId: '882-991',
        orderTitle: 'UI/UX Design for Mobile Application',
        type: complaintType,
        description: description,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    
    let complaints = JSON.parse(localStorage.getItem('orderComplaints') || '[]');
    complaints.unshift(complaintData);
    localStorage.setItem('orderComplaints', JSON.stringify(complaints));
    
    showToast('Complaint submitted successfully! Support team will contact you within 24 hours.', 'success');
    closeComplaintModal();
}

// ============================================
// CORE ORDER MANAGEMENT FUNCTIONS
// ============================================
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    selectedFiles = [...selectedFiles, ...files];
    renderFileChips();
    showToast(`${files.length} file(s) added`, 'info');
}

function renderFileChips() {
    const list = document.getElementById('selected-files-list');
    if (!list) return;
    list.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.innerHTML = `<span>${file.name}</span><i class="fas fa-times" style="cursor:pointer; color: #ef4444;" onclick="removeFile(${index})"></i>`;
        list.appendChild(chip);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileChips();
}

function switchTab(id) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('pane-' + id).classList.add('active');
    document.getElementById('btn-' + id).classList.add('active');
}

function submitRequirements() {
    const val = document.getElementById('req-text').value.trim();
    if (!val) return showToast("Please type your requirements first.", "error");

    openModal({
        title: 'Lock Requirements?',
        body: 'Once submitted, the seller will start working and you cannot change these details.',
        icon: 'fa-lock',
        confirmText: 'Submit & Start',
        onConfirm: () => {
            document.getElementById('final-req-display').textContent = val;
            const filesDisplay = document.getElementById('final-files-display');
            selectedFiles.forEach(file => {
                const chip = document.createElement('div');
                chip.className = 'file-chip';
                chip.style.background = 'rgba(255,255,255,0.05)';
                chip.innerHTML = `<i class="fas fa-paperclip"></i> <span>${file.name}</span>`;
                filesDisplay.appendChild(chip);
            });

            document.getElementById('req-edit-mode').classList.add('hidden');
            document.getElementById('req-view-mode').classList.remove('hidden');
            document.getElementById('btn-messages').disabled = false;
            document.getElementById('btn-deliveries').disabled = false;

            document.getElementById('node-1').classList.replace('active', 'completed');
            document.getElementById('node-1').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';
            document.getElementById('node-2').classList.add('active');

            document.getElementById('status-val').textContent = "In Progress";
            document.getElementById('status-val').style.color = "var(--primary-color)";

            showToast("Project started successfully!", "success");
            setTimeout(() => switchTab('messages'), 400);
        }
    });
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg msg-me';
    msgDiv.innerHTML = `<div class="msg-meta">Me • Just now</div>${text}`;

    chatBox.appendChild(msgDiv);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'msg msg-seller';
        reply.innerHTML = `<div class="msg-meta">Alex Studio • Just now</div>Got it! I'm working on the update.`;
        chatBox.appendChild(reply);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1500);
}

function requestRevision() {
    if (revisionsLeft <= 0) return showToast("No revisions left!", "error");
    if (orderCompleted) return showToast("Order is already completed!", "error");

    openModal({
        title: 'Request Revision?',
        body: `You have ${revisionsLeft} revisions remaining. Requesting one will notify the seller.`,
        icon: 'fa-redo',
        confirmText: 'Request Now',
        onConfirm: () => {
            revisionsLeft--;
            document.getElementById('revisions-val').innerHTML = `<i class="fas fa-redo-alt" style="font-size: 10px; margin-right: 5px;"></i> ${revisionsLeft} of 3`;

            showToast("Revision requested. Please explain the changes in chat.", "info");
            switchTab('messages');

            const chatBox = document.getElementById('chat-box');
            const log = document.createElement('div');
            log.style.textAlign = 'center';
            log.style.fontSize = '12px';
            log.style.color = 'var(--text-muted)';
            log.style.margin = '10px 0';
            log.innerHTML = `<i class="fas fa-redo"></i> Revision #${3 - revisionsLeft} requested`;
            chatBox.appendChild(log);
        }
    });
}

function acceptOrder() {
    if (orderCompleted) return showToast("Order is already completed!", "error");
    
    openModal({
        title: 'Approve Delivery?',
        body: 'This will complete the order and release payment. Make sure you have downloaded all files.',
        icon: 'fa-check-double',
        confirmText: 'Yes, Complete Order',
        onConfirm: () => {
            document.getElementById('status-val').textContent = "Completed";
            document.getElementById('status-val').style.color = "var(--success)";

            document.getElementById('node-2').classList.replace('active', 'completed');
            document.getElementById('node-2').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';
            document.getElementById('node-3').classList.add('completed');
            document.getElementById('node-3').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';

            const revisionBtn = document.getElementById('btn-revision');
            if (revisionBtn) {
                revisionBtn.style.display = 'none';
            }
            
            document.getElementById('btn-accept').disabled = true;
            document.getElementById('btn-accept').textContent = "Order Completed";
            
            const complaintBtn = document.getElementById('sidebar-complaint-btn');
            if (complaintBtn) complaintBtn.disabled = true;
            
            orderCompleted = true;
            
            showToast("Order completed successfully!", "success");
            
            setTimeout(() => {
                if (!ratingSubmitted) {
                    openRatingModal();
                }
            }, 1000);
        }
    });
}

function downloadFile(fileName, fileSize) {
    showToast(`Downloading ${fileName}...`, 'info');
    setTimeout(() => {
        const content = `This is a simulated download of ${fileName}\nFile size: ${fileSize}\nOrder: #882-991`;
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`✓ ${fileName} downloaded successfully!`, 'success');
        
        let downloadedFiles = JSON.parse(localStorage.getItem('downloadedFiles') || '[]');
        if (!downloadedFiles.includes(fileName)) {
            downloadedFiles.push(fileName);
            localStorage.setItem('downloadedFiles', JSON.stringify(downloadedFiles));
        }
    }, 800);
}

// ============================================
// INITIALIZATION
// ============================================
window.onclick = function(event) {
    const ratingModal = document.getElementById('ratingModal');
    const complaintModal = document.getElementById('complaintModal');
    const confirmModal = document.getElementById('modal-overlay');
    
    if (event.target === ratingModal) closeRatingModal();
    if (event.target === complaintModal) closeComplaintModal();
    if (event.target === confirmModal && confirmModal.classList.contains('active')) closeModal();
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeRatingModal();
        closeComplaintModal();
        closeModal();
    }
});

// Load user avatar from localStorage
function loadUserAvatar() {
    const userData = localStorage.getItem('userData');
    if (userData) {
        const user = JSON.parse(userData);
        const avatarImg = document.getElementById('user-avatar-img');
        if (avatarImg && user.avatar) {
            avatarImg.src = user.avatar;
        }
    }
}

window.onload = function() {
    loadUserAvatar();
};

// ============================================
// FETCH USER AVATAR FROM SESSION
// ============================================
async function fetchUserAvatar() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        
        if (data.loggedIn) {
            const avatarImg = document.getElementById('user-avatar-img');
            if (avatarImg) {
                if (data.avatar && data.avatar !== '' && data.avatar !== 'null') {
                    avatarImg.src = data.avatar + '?t=' + Date.now();
                } else {
                    avatarImg.src = 'https://i.pravatar.cc/100?u=' + data.user_id;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}

// استدعاء الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    fetchUserAvatar();
});
