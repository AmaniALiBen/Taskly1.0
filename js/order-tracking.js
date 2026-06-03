// ============================================
// ORDER TRACKING - WITH DATABASE INTEGRATION
// ============================================

const ORDERS_API = '/Taskly/controllers/OrderController.php';
const WALLET_API = '/Taskly/controllers/WalletController.php';

let selectedFiles = [];
let deliveryFiles = [];
let revisionsLeft = 3;
let totalRevisions = 3;
let orderCompleted = false;
let ratingSubmitted = false;
let orderData = null;

// ============================================
// MESSAGES POLLING VARIABLES
// ============================================
let lastMessageTime = null;
let messageInterval = null;
let currentOrderId = null;
let currentUserId = null;
let isSending = false;

// ============================================
// GET ORDER ID FROM URL
// ============================================
function getOrderIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// ============================================
// GET CURRENT USER ID
// ============================================
async function getCurrentUserId() {
    try {
        const response = await fetch('/Taskly/controllers/getUser.php');
        const data = await response.json();
        return data.loggedIn ? data.user_id : 0;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return 0;
    }
}

// ============================================
// LOAD ORDER FROM DATABASE (مع منع الطلبات الملغاة)
// ============================================
async function loadOrderFromDatabase() {
    const orderId = getOrderIdFromUrl();
    
    if (!orderId) {
        showToast('Invalid order ID', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${ORDERS_API}?action=get_order&order_id=${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            orderData = data.order;
            
            // ✅ إذا كان الطلب ملغى، امنع الوصول وأعد التوجيه
            if (orderData.status === 'cancelled') {
                showToast('This order has been cancelled. Returning to orders page.', 'error');
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 2000);
                return;
            }
            
            // التحقق إذا كان التقييم قد تم مسبقاً
            if (orderData.rating_score !== null && orderData.rating_score > 0) {
                ratingSubmitted = true;
            }
            
            renderOrderData();
            startMessagePolling(orderId);
        } else {
            showToast('Order not found', 'error');
        }
    } catch (error) {
        console.error('Error loading order:', error);
        showToast('Failed to load order', 'error');
    }
}

// ============================================
// UPDATE ORDER STATUS IN DATABASE
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${ORDERS_API}?action=update_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating status:', error);
        return { success: false };
    }
}

// ============================================
// UPDATE REVISIONS IN DATABASE
// ============================================
async function updateRevisions(orderId, newRevisionsLeft) {
    try {
        const response = await fetch(`${ORDERS_API}?action=update_revisions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, left_revisions: newRevisionsLeft })
        });
        return await response.json();
    } catch (error) {
        console.error('Error updating revisions:', error);
        return { success: false };
    }
}

// ============================================
// DISABLE CHAT WHEN ORDER COMPLETED
// ============================================
function disableChatOnCompletion() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.querySelector('#pane-messages .button-primary');
    
    if (chatInput) {
        chatInput.disabled = true;
        chatInput.placeholder = 'Order completed - Chat is closed';
        chatInput.style.opacity = '0.5';
        chatInput.style.cursor = 'not-allowed';
    }
    
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
    }
}

// ============================================
// RENDER ORDER DATA TO PAGE
// ============================================
function renderOrderData() {
    if (!orderData) return;
    
    // Update order number display
    const orderIdDisplay = document.getElementById('order-id-display');
    if (orderIdDisplay) {
        orderIdDisplay.textContent = `#${orderData.id}`;
    }
    
    // Update gig image
    const gigImage = document.getElementById('order-gig-image');
    if (gigImage && orderData.gig_image) {
        gigImage.src = orderData.gig_image;
        gigImage.alt = orderData.gig_title;
    }
    
    // Update gig title in header
    const gigTitle = document.getElementById('order-gig-title');
    if (gigTitle) {
        gigTitle.textContent = orderData.gig_title || 'Gig Title';
    }
    
    // Update sidebar title
    const sidebarTitle = document.getElementById('order-sidebar-title');
    if (sidebarTitle) {
        sidebarTitle.textContent = orderData.gig_title || 'Gig Title';
    }
    
    // Update total amount
    const orderAmount = document.getElementById('order-amount');
    if (orderAmount) {
        orderAmount.textContent = `$${parseFloat(orderData.price || 0).toFixed(2)}`;
    }
    
    // تحديث عدد المراجعات من قاعدة البيانات مباشرة
    totalRevisions = orderData.revisions_allowed || 3;
    revisionsLeft = orderData.left_revisions !== null && orderData.left_revisions !== undefined ? orderData.left_revisions : totalRevisions;
    
    const revisionsVal = document.getElementById('revisions-val');
    if (revisionsVal) {
        revisionsVal.innerHTML = `<i class="fas fa-redo-alt" style="font-size: 10px; margin-right: 5px;"></i> ${revisionsLeft} of ${totalRevisions}`;
    }
    
    // Update status
    const statusMap = {
        'awaiting_requirements': 'Awaiting Requirements',
        'in_progress': 'In Progress',
        'delivered': 'Delivered',
        'in_revision': 'In Revision',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    
    const statusVal = document.getElementById('status-val');
    if (statusVal) {
        statusVal.textContent = statusMap[orderData.status] || orderData.status;
        if (orderData.status === 'completed') statusVal.style.color = 'var(--success)';
        else if (orderData.status === 'in_progress') statusVal.style.color = 'var(--primary-color)';
        else if (orderData.status === 'awaiting_requirements') statusVal.style.color = 'var(--warning)';
        else if (orderData.status === 'delivered') statusVal.style.color = 'var(--primary-color)';
    }
    
    // If requirements already submitted, show view mode
    if (orderData.requirements_text) {
        document.getElementById('final-req-display').textContent = orderData.requirements_text;
        
        const filesDisplay = document.getElementById('final-files-display');
        if (filesDisplay && orderData.requirements_files && orderData.requirements_files.length > 0) {
            filesDisplay.innerHTML = '';
            orderData.requirements_files.forEach(file => {
                const chip = document.createElement('div');
                chip.className = 'file-chip';
                chip.style.background = 'rgba(255,255,255,0.05)';
                chip.innerHTML = `<i class="fas fa-paperclip"></i> <span>${escapeHtml(file.file_name)}</span>`;
                filesDisplay.appendChild(chip);
            });
        }
        
        document.getElementById('req-edit-mode').classList.add('hidden');
        document.getElementById('req-view-mode').classList.remove('hidden');
        document.getElementById('btn-messages').disabled = false;
        document.getElementById('btn-deliveries').disabled = false;
        
        document.getElementById('node-1').classList.replace('active', 'completed');
        document.getElementById('node-1').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';
        
        if (orderData.status === 'in_progress' || orderData.status === 'delivered') {
            document.getElementById('node-2').classList.add('active');
        }
        
        if (orderData.status === 'completed') {
            document.getElementById('node-2').classList.replace('active', 'completed');
            document.getElementById('node-2').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';
            document.getElementById('node-3').classList.add('completed');
            document.getElementById('node-3').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';
            orderCompleted = true;
            disableChatOnCompletion();
        }
    }
    
    renderDeliveryFiles();
}

// ============================================
// RENDER DELIVERY FILES
// ============================================
function renderDeliveryFiles() {
    const deliveryContainer = document.getElementById('delivery-items-list');
    const actionButtons = document.getElementById('delivery-action-buttons');
    const revisionBtn = document.getElementById('btn-revision');
    const acceptBtn = document.getElementById('btn-accept');
    
    if (!deliveryContainer) return;
    
    if (orderData && orderData.delivery_files && orderData.delivery_files.length > 0) {
        const deliveryHtml = orderData.delivery_files.map(file => {
            const uploadDate = new Date(file.uploaded_at);
            const formattedDate = uploadDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            
            return `
                <div class="delivery-item">
                    <div class="delivery-header">
                        <span class="delivery-tag tag-delivered">Delivered</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">${formattedDate}</span>
                    </div>
                    <h4 style="margin-top: 8px;">${escapeHtml(file.file_name)}</h4>
                    <div class="delivery-files" style="margin-top: 10px;">
                        <div class="file-download-item" onclick="downloadDeliveryFile(${file.id}, '${escapeHtml(file.file_name)}')">
                            <i class="fas fa-file"></i>
                            <span>${escapeHtml(file.file_name)}</span>
                            <i class="fas fa-download download-icon"></i>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        deliveryContainer.innerHTML = deliveryHtml;
        
        // المنطق الجديد للأزرار
        if (actionButtons) {
            // إذا كان الطلب مكتملاً أو ملغياً، إخفاء جميع الأزرار
            if (orderData.status === 'completed' || orderData.status === 'cancelled') {
                actionButtons.style.display = 'none';
            } 
            // إذا كانت الحالة delivered، إظهار الأزرار
            else if (orderData.status === 'delivered') {
                actionButtons.style.display = 'block';
                
                // زر المراجعة: يظهر فقط إذا كان هناك مراجعات متبقية
                if (revisionBtn) {
                    revisionBtn.style.display = (revisionsLeft > 0) ? 'inline-block' : 'none';
                }
                
                // زر القبول: يظهر دائماً
                if (acceptBtn) {
                    acceptBtn.style.display = 'inline-block';
                }
            } 
            // باقي الحالات (in_progress, awaiting_requirements) إخفاء الأزرار
            else {
                actionButtons.style.display = 'none';
            }
        }
    } else {
        deliveryContainer.innerHTML = '<div class="empty-message" style="text-align: center; padding: 40px;"><i class="fas fa-box-open"></i><p>No deliveries yet</p></div>';
        if (actionButtons) {
            actionButtons.style.display = 'none';
        }
    }
}

// ============================================
// BACK BUTTON
// ============================================
function goBackToOrders() {
    window.location.href = 'orders.html';
}

// ============================================
// TOAST FUNCTIONS
// ============================================
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
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
// RATING MODAL - حفظ في قاعدة البيانات
// ============================================
function openRatingModal() {
    // منع فتح المودال إذا تم التقييم مسبقاً
    if (ratingSubmitted) {
        showToast('You have already rated this order', 'info');
        return;
    }
    
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // إعادة تعيين التقييم
        const starsContainer = document.getElementById('rating-stars');
        starsContainer.dataset.selected = '0';
        updateStars(0);
        
        // إعداد النجوم
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

async function submitRating() {
    const starsContainer = document.getElementById('rating-stars');
    const rating = parseInt(starsContainer.dataset.selected || 0);
    
    if (rating === 0) {
        showToast('Please select a rating before submitting', 'error');
        return;
    }
    
    const orderId = getOrderIdFromUrl();
    
    try {
        const response = await fetch(`${ORDERS_API}?action=submit_rating`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                rating: rating
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`Thank you for your ${rating}-star rating!`, 'success');
            ratingSubmitted = true;
            
            // تحديث orderData محلياً
            if (orderData) {
                orderData.rating_score = rating;
            }
            
            closeRatingModal();
        } else {
            showToast(data.message || 'Failed to submit rating', 'error');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        showToast('Failed to submit rating. Please try again.', 'error');
    }
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
    
    // حفظ الشكوى في localStorage مؤقتاً (يمكن تعديلها لاحقاً للحفظ في DB)
    const complaintData = {
        orderId: getOrderIdFromUrl(),
        orderTitle: document.getElementById('order-gig-title')?.textContent || 'Order',
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
// FILE HANDLING
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
        chip.innerHTML = `<span>${escapeHtml(file.name)}</span><i class="fas fa-times" style="cursor:pointer; color: #ef4444;" onclick="removeFile(${index})"></i>`;
        list.appendChild(chip);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileChips();
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(id) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('pane-' + id).classList.add('active');
    document.getElementById('btn-' + id).classList.add('active');
}

// ============================================
// SUBMIT REQUIREMENTS TO DATABASE
// ============================================
async function submitRequirementsToDatabase(orderId, requirementsText) {
    const formData = new FormData();
    formData.append('order_id', orderId);
    formData.append('requirements_text', requirementsText);
    
    for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('requirements_files[]', selectedFiles[i]);
    }
    
    try {
        const response = await fetch(`${ORDERS_API}?action=submit_requirements`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            return { success: true, started_at: data.started_at, deadline: data.deadline, files: data.files };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Error submitting requirements:', error);
        return { success: false, message: 'Connection error' };
    }
}

async function submitRequirements() {
    const val = document.getElementById('req-text').value.trim();
    if (!val) return showToast("Please type your requirements first.", "error");
    
    const orderId = getOrderIdFromUrl();
    
    const result = await submitRequirementsToDatabase(orderId, val);
    
    if (!result.success) {
        showToast(result.message, 'error');
        return;
    }
    
    document.getElementById('final-req-display').textContent = val;
    const filesDisplay = document.getElementById('final-files-display');
    filesDisplay.innerHTML = '';
    
    if (result.files && result.files.length > 0) {
        result.files.forEach(file => {
            const chip = document.createElement('div');
            chip.className = 'file-chip';
            chip.style.background = 'rgba(255,255,255,0.05)';
            chip.innerHTML = `<i class="fas fa-paperclip"></i> <span>${escapeHtml(file.original_name)}</span>`;
            filesDisplay.appendChild(chip);
        });
    }
    
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

// ============================================
// DOWNLOAD DELIVERY FILE
// ============================================
function downloadDeliveryFile(fileId, fileName) {
    showToast(`Downloading ${fileName}...`, 'info');
    window.location.href = `${ORDERS_API}?action=download_file&file_id=${fileId}`;
}

// ============================================
// REQUEST REVISION
// ============================================
async function requestRevision() {
    if (revisionsLeft <= 0) {
        showToast("No revisions left!", "error");
        return;
    }
    if (orderCompleted) {
        showToast("Order is already completed!", "error");
        return;
    }
    
    openModal({
        title: 'Request Revision?',
        body: `You have ${revisionsLeft} revisions remaining. Requesting one will notify the seller.`,
        icon: 'fa-redo',
        confirmText: 'Request Now',
        onConfirm: async () => {
            const orderId = getOrderIdFromUrl();
            
            const newRevisionsLeft = revisionsLeft - 1;
            await updateRevisions(orderId, newRevisionsLeft);
            await updateOrderStatus(orderId, 'in_progress');
            
            revisionsLeft = newRevisionsLeft;
            await loadOrderFromDatabase();
            
            document.getElementById('revisions-val').innerHTML = `<i class="fas fa-redo-alt" style="font-size: 10px; margin-right: 5px;"></i> ${revisionsLeft} of ${totalRevisions}`;
            document.getElementById('status-val').textContent = "In Progress";
            document.getElementById('status-val').style.color = "var(--primary-color)";
            
            const actionButtons = document.getElementById('delivery-action-buttons');
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }
            
            showToast(`Revision requested! ${revisionsLeft} revisions remaining.`, "info");
            switchTab('messages');
            
            const chatBox = document.getElementById('chat-box');
            const log = document.createElement('div');
            log.style.textAlign = 'center';
            log.style.fontSize = '12px';
            log.style.color = 'var(--text-muted)';
            log.style.margin = '10px 0';
            log.innerHTML = `<i class="fas fa-redo"></i> Revision requested - ${revisionsLeft} revisions left`;
            chatBox.appendChild(log);
        }
    });
}

// ============================================
// ACCEPT ORDER
// ============================================
async function acceptOrder() {
    if (orderCompleted) {
        showToast("Order is already completed!", "error");
        return;
    }
    
    openModal({
        title: 'Approve Delivery?',
        body: 'This will complete the order and release payment. Make sure you have downloaded all files.',
        icon: 'fa-check-double',
        confirmText: 'Yes, Complete Order',
        onConfirm: async () => {
            const orderId = getOrderIdFromUrl();
            
            await updateOrderStatus(orderId, 'completed');
            
            document.getElementById('status-val').textContent = "Completed";
            document.getElementById('status-val').style.color = "var(--success)";
            
            document.getElementById('node-2').classList.replace('active', 'completed');
            document.getElementById('node-2').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';
            document.getElementById('node-3').classList.add('completed');
            document.getElementById('node-3').querySelector('.node-icon').innerHTML = '<i class="fas fa-check"></i>';
            
            const actionButtons = document.getElementById('delivery-action-buttons');
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }
            
            document.getElementById('btn-accept').disabled = true;
            document.getElementById('btn-accept').textContent = "Order Completed";
            
            const complaintBtn = document.getElementById('sidebar-complaint-btn');
            if (complaintBtn) complaintBtn.disabled = true;
            
            orderCompleted = true;
            disableChatOnCompletion();
            
            showToast("Order completed successfully!", "success");
            
            setTimeout(() => {
                if (!ratingSubmitted) {
                    openRatingModal();
                }
            }, 1000);
        }
    });
}

// ============================================
// MESSAGES POLLING
// ============================================
function startMessagePolling(orderId) {
    currentOrderId = orderId;
    fetchMessages();
    
    if (messageInterval) clearInterval(messageInterval);
    messageInterval = setInterval(() => {
        fetchMessages();
    }, 3000);
}

function stopMessagePolling() {
    if (messageInterval) {
        clearInterval(messageInterval);
        messageInterval = null;
    }
}

async function fetchMessages() {
    if (!currentOrderId) return;
    
    let url = `${ORDERS_API}?action=get_messages&order_id=${currentOrderId}`;
    if (lastMessageTime) {
        url += `&after_time=${encodeURIComponent(lastMessageTime)}`;
    }
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.messages && data.messages.length > 0) {
            const lastMessage = data.messages[data.messages.length - 1];
            lastMessageTime = lastMessage.sent_at;
            appendMessages(data.messages);
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

function appendMessages(messages) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    
    messages.forEach(msg => {
        const isMe = (msg.sender_id == currentUserId);
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${isMe ? 'msg-me' : 'msg-seller'}`;
        
        const senderName = isMe ? 'You' : (msg.sender_name || 'Seller');
        const time = new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        msgDiv.innerHTML = `
            <div class="msg-meta">${escapeHtml(senderName)} • ${time}</div>
            ${escapeHtml(msg.content)}
        `;
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

async function sendMessage() {
    if (orderCompleted) {
        showToast('Order is completed. Chat is closed.', 'error');
        return;
    }
    
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    
    if (isSending) return;
    isSending = true;
    
    const orderId = getOrderIdFromUrl();
    
    try {
        const response = await fetch(`${ORDERS_API}?action=send_message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_id: orderId,
                content: text
            })
        });
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    } finally {
        setTimeout(() => {
            isSending = false;
        }, 500);
    }
}

// ============================================
// FETCH USER AVATAR
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
                    avatarImg.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.username) + '&background=7c3aed&color=fff&size=100';
                }
            }
        }
    } catch (error) {
        console.error('Error fetching avatar:', error);
    }
}

// ============================================
// HELPER FUNCTION
// ============================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
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

document.addEventListener('DOMContentLoaded', async function() {
    fetchUserAvatar();
    currentUserId = await getCurrentUserId();
    await loadOrderFromDatabase();
    
    const orderId = getOrderIdFromUrl();
    if (orderId) {
        startMessagePolling(orderId);
    }
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

window.addEventListener('beforeunload', function() {
    stopMessagePolling();
});