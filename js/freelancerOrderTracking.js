// =========================================
// FREELANCER ORDER TRACKING - WITH DATABASE
// =========================================

const ORDERS_API = '/Taskly/controllers/OrderController.php';

let deliveryFiles = [];
let revisionsLeft = 3;
let totalRevisions = 3;
let orderCompleted = false;
let cancelRequestSubmitted = false;
let orderData = null;
let currentUserId = null;

// =========================================
// MESSAGES POLLING VARIABLES
// =========================================
let lastMessageTime = null;
let messageInterval = null;
let currentOrderId = null;
let isSending = false;

// =========================================
// GET ORDER ID FROM URL
// =========================================
function getOrderIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    console.log('Order ID from URL:', orderId);
    return orderId;
}

// =========================================
// GET CURRENT USER ID
// =========================================
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

// =========================================
// DISABLE CHAT WHEN ORDER COMPLETED
// =========================================
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

// =========================================
// LOAD ORDER FROM DATABASE (مع منع الطلبات الملغاة)
// =========================================
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
                showToast('This order has been cancelled. Returning to dashboard.', 'error');
                setTimeout(() => {
                    window.location.href = 'sellerDashboard.html?tab=orders';
                }, 2000);
                return;
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

// =========================================
// RENDER ORDER DATA TO PAGE
// =========================================
function renderOrderData() {
    if (!orderData) return;
    
    // Update order number
    const orderIdDisplay = document.getElementById('order-id-display');
    if (orderIdDisplay) {
        orderIdDisplay.textContent = `#${orderData.id}`;
    }
    
    // Update title
    const orderTitle = document.getElementById('order-title');
    if (orderTitle) {
        orderTitle.textContent = orderData.gig_title || 'Gig Title';
    }
    
    // Update buyer info
    const buyerName = document.getElementById('buyer-name');
    if (buyerName) {
        buyerName.textContent = orderData.buyer_name || 'Buyer';
    }
    
    // Update buyer avatar
    const buyerAvatar = document.getElementById('buyer-avatar');
    if (buyerAvatar) {
        const buyerPicture = orderData.buyer_picture;
        if (buyerPicture && buyerPicture !== 'null' && buyerPicture !== '') {
            buyerAvatar.src = buyerPicture;
        } else {
            buyerAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(orderData.buyer_name || 'B') + '&background=7c3aed&color=fff&size=100';
        }
    }
    
    // Update budget
    const orderBudget = document.getElementById('order-budget');
    if (orderBudget) {
        orderBudget.textContent = `$${parseFloat(orderData.price || 0).toFixed(2)}`;
    }
    
    // Update deadline
    const orderDeadline = document.getElementById('order-deadline');
    if (orderDeadline) {
        if (orderData.deadline) {
            const date = new Date(orderData.deadline);
            orderDeadline.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
            orderDeadline.textContent = '-';
        }
    }
    
    // ✅ تحديث عدد المراجعات من قاعدة البيانات مباشرة
    totalRevisions = orderData.revisions_allowed || 3;
    revisionsLeft = orderData.left_revisions !== null && orderData.left_revisions !== undefined ? orderData.left_revisions : totalRevisions;
    
    const revisionsLeftSpan = document.getElementById('revisions-left');
    if (revisionsLeftSpan) {
        revisionsLeftSpan.textContent = revisionsLeft;
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
    }
    
    // Update requirements text (read only for seller)
    const requirementsText = document.getElementById('requirements-text');
    if (requirementsText) {
        requirementsText.textContent = orderData.requirements_text || 'No requirements submitted yet.';
    }
    
    // Update attached files (read only for seller)
    renderAttachedFiles();
    
    // Update delivery history
    renderDeliveryHistory();
    
    // Disable buttons and chat if order completed
    if (orderData.status === 'completed') {
        orderCompleted = true;
        const submitBtn = document.getElementById('submit-delivery-btn');
        if (submitBtn) submitBtn.disabled = true;
        const cancelBtn = document.getElementById('cancel-request-btn');
        if (cancelBtn) cancelBtn.disabled = true;
        
        // تعطيل الدردشة
        disableChatOnCompletion();
        
        // إخفاء منطقة رفع الملفات
        const deliveryUploadZone = document.querySelector('#delivery-container .delivery-upload-zone');
        if (deliveryUploadZone) {
            deliveryUploadZone.style.display = 'none';
        }
    }
}

// =========================================
// RENDER ATTACHED FILES (للبائع - للعرض فقط)
// =========================================
function renderAttachedFiles() {
    const attachedFilesDiv = document.getElementById('attached-files');
    if (!attachedFilesDiv) return;
    
    if (orderData && orderData.requirements_files && orderData.requirements_files.length > 0) {
        attachedFilesDiv.innerHTML = orderData.requirements_files.map(file => `
            <div class="download-item" onclick="downloadFile(${file.id}, '${escapeHtml(file.file_name)}')" style="cursor:pointer;">
                <i class="fas ${getFileIcon(file.extension)}"></i>
                <span>${escapeHtml(file.file_name)}</span>
                <i class="fas fa-download download-icon"></i>
            </div>
        `).join('');
    } else {
        attachedFilesDiv.innerHTML = '<div class="empty-message" style="text-align: center; padding: 20px;">No files attached</div>';
    }
}

// =========================================
// RENDER DELIVERY HISTORY
// =========================================
function renderDeliveryHistory() {
    const historyContainer = document.getElementById('delivery-history');
    if (!historyContainer) return;
    
    if (orderData && orderData.delivery_files && orderData.delivery_files.length > 0) {
        const sortedFiles = [...orderData.delivery_files].sort((a, b) => {
            return new Date(b.uploaded_at) - new Date(a.uploaded_at);
        });
        
        const historyHtml = sortedFiles.map((file, index) => {
            const uploadDate = new Date(file.uploaded_at);
            const formattedDate = uploadDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            const versionNum = sortedFiles.length - index;
            
            return `
                <div class="delivery-item" id="delivery-item-${file.id}">
                    <div class="delivery-header">
                        <span class="delivery-tag tag-delivered">Delivered</span>
                        <span style="font-size: 12px; color: var(--text-secondary);">${formattedDate}</span>
                    </div>
                    <h4 style="margin-bottom: 8px;">Version ${versionNum}</h4>
                    <div class="delivery-files">
                        <span class="delivery-file" onclick="downloadFile(${file.id}, '${escapeHtml(file.file_name)}')" style="cursor:pointer;">
                            <i class="fas ${getFileIcon(file.extension)}"></i> ${escapeHtml(file.file_name)}
                        </span>
                    </div>
                    <div style="margin-top: 10px;">
                        <span class="delivery-tag tag-pending" id="delivery-status-${file.id}">Pending Review</span>
                    </div>
                </div>
            `;
        }).join('');
        historyContainer.innerHTML = historyHtml;
    } else {
        historyContainer.innerHTML = '<div class="empty-message" style="text-align: center; padding: 40px;"><i class="fas fa-box-open"></i><p>No deliveries yet</p></div>';
    }
}

// =========================================
// GET FILE ICON
// =========================================
function getFileIcon(extension) {
    const ext = (extension || '').toLowerCase();
    if (ext === 'pdf') return 'fa-file-pdf';
    if (ext === 'zip' || ext === 'rar' || ext === '7z') return 'fa-file-archive';
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp') return 'fa-file-image';
    if (ext === 'doc' || ext === 'docx') return 'fa-file-word';
    if (ext === 'xls' || ext === 'xlsx') return 'fa-file-excel';
    return 'fa-file';
}

// =========================================
// DOWNLOAD FILE
// =========================================
async function downloadFile(fileId, fileName) {
    showToast(`Downloading ${fileName}...`, 'info');
    window.location.href = `${ORDERS_API}?action=download_file&file_id=${fileId}`;
}

// =========================================
// TOAST FUNCTIONS
// =========================================
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

// =========================================
// TAB SWITCHING
// =========================================
function switchTab(id) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('pane-' + id).classList.add('active');
    document.getElementById('btn-' + id).classList.add('active');
}

// =========================================
// DELIVERY FILES HANDLING
// =========================================
function handleDeliveryFiles(event) {
    const files = Array.from(event.target.files);
    deliveryFiles = [...deliveryFiles, ...files];
    renderDeliveryFilesUpload();
    showToast(`${files.length} file(s) added for delivery`, 'success');
}

function renderDeliveryFilesUpload() {
    const list = document.getElementById('delivery-files-list');
    if (!list) return;
    list.innerHTML = '';
    deliveryFiles.forEach((file, index) => {
        const chip = document.createElement('div');
        chip.className = 'delivery-file-chip';
        chip.innerHTML = `<span>${escapeHtml(file.name)}</span><i class="fas fa-times" style="cursor:pointer; color: #ef4444;" onclick="removeDeliveryFile(${index})"></i>`;
        list.appendChild(chip);
    });
}

function removeDeliveryFile(index) {
    deliveryFiles.splice(index, 1);
    renderDeliveryFilesUpload();
}

// =========================================
// SUBMIT DELIVERY TO DATABASE
// =========================================
async function submitDelivery() {
    // منع رفع التسليم إذا كان الطلب مكتملاً
    if (orderCompleted) {
        showToast('Order is completed. Cannot submit delivery.', 'error');
        return;
    }
    
    const orderId = getOrderIdFromUrl();
    
    if (!orderId) {
        showToast('No order ID found', 'error');
        return;
    }
    
    if (deliveryFiles.length === 0) {
        showToast('Please select files to deliver', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('order_id', orderId);
    
    for (let i = 0; i < deliveryFiles.length; i++) {
        formData.append('delivery_files[]', deliveryFiles[i]);
    }
    
    const submitBtn = document.getElementById('submit-delivery-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    
    try {
        const response = await fetch(`${ORDERS_API}?action=submit_delivery`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            showToast('Delivery submitted successfully!', 'success');
            deliveryFiles = [];
            renderDeliveryFilesUpload();
            document.getElementById('delivery-file-input').value = '';
            await loadOrderFromDatabase();
        } else {
            showToast(data.message || 'Failed to submit delivery', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to submit delivery', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// =========================================
// MESSAGES POLLING
// =========================================
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
        msgDiv.className = `msg ${isMe ? 'msg-me' : 'msg-buyer'}`;
        
        const senderName = isMe ? 'You' : (msg.sender_name || 'Buyer');
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
    // منع الإرسال إذا كان الطلب مكتملاً
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

// =========================================
// CANCEL REQUEST MODAL
// =========================================
function openCancelModal() {
    if (orderCompleted) {
        showToast('Order is already completed. Cannot request cancellation.', 'error');
        return;
    }
    if (cancelRequestSubmitted) {
        showToast('Cancellation request already submitted. Please wait for admin review.', 'error');
        return;
    }
    document.getElementById('cancelModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCancelModal() {
    document.getElementById('cancelModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.querySelectorAll('input[name="cancel-reason"]').forEach(radio => radio.checked = false);
    document.getElementById('cancel-reason-detail').value = '';
}

function submitCancelRequest() {
    const selectedReason = document.querySelector('input[name="cancel-reason"]:checked');
    const detail = document.getElementById('cancel-reason-detail').value;

    if (!selectedReason) {
        showToast('Please select a reason for cancellation', 'error');
        return;
    }

    if (!detail.trim()) {
        showToast('Please provide additional details', 'error');
        return;
    }

    const reasonText = selectedReason.nextElementSibling.innerText;
    const orderId = getOrderIdFromUrl();

    const cancelRequest = {
        orderId: orderId,
        reason: reasonText,
        details: detail,
        requestedBy: 'Freelancer',
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    let requests = JSON.parse(localStorage.getItem('cancelRequests') || '[]');
    requests.push(cancelRequest);
    localStorage.setItem('cancelRequests', JSON.stringify(requests));

    cancelRequestSubmitted = true;
    const statusVal = document.getElementById('status-val');
    if (statusVal) {
        statusVal.textContent = 'Cancellation Requested';
        statusVal.style.color = 'var(--error)';
    }

    const submitBtn = document.getElementById('submit-delivery-btn');
    if (submitBtn) submitBtn.disabled = true;

    const cancelBtn = document.getElementById('cancel-request-btn');
    if (cancelBtn) cancelBtn.disabled = true;

    showToast('Cancellation request submitted to admin. You will be notified once reviewed.', 'success');
    closeCancelModal();

    const chatBox = document.getElementById('chat-box');
    if (chatBox) {
        const systemMsg = document.createElement('div');
        systemMsg.className = 'msg msg-system';
        systemMsg.innerHTML = `<div class="msg-meta">System • Just now</div>Cancellation request has been submitted to admin for review.`;
        chatBox.appendChild(systemMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// =========================================
// HELPER FUNCTION
// =========================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// =========================================
// INITIALIZATION
// =========================================
window.onclick = function (event) {
    const cancelModal = document.getElementById('cancelModal');
    if (event.target === cancelModal) closeCancelModal();
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeCancelModal();
});

document.addEventListener('DOMContentLoaded', async function() {
    currentUserId = await getCurrentUserId();
    await loadOrderFromDatabase();
    
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