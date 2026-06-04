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
// REAL-TIME UPDATE VARIABLES (بدون توست)
// =========================================
let orderPollingInterval = null;
let lastOrderStatus = null;
let lastRevisionsLeft = null;
let lastDeliveryCount = 0;
let lastRequirementsText = null;
let isPageActive = true;

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
// LOAD ORDER FROM DATABASE
// =========================================
async function loadOrderFromDatabase() {
    const orderId = getOrderIdFromUrl();
    
    if (!orderId) {
        console.log('Invalid order ID');
        return;
    }
    
    try {
        const response = await fetch(`${ORDERS_API}?action=get_order&order_id=${orderId}`);
        const data = await response.json();
        
        if (data.success) {
            orderData = data.order;
            
            if (orderData.status === 'cancelled') {
                setTimeout(() => {
                    window.location.href = 'sellerDashboard.html?tab=orders';
                }, 2000);
                return;
            }
            
            // تهيئة القيم للمقارنة
            if (!lastOrderStatus) {
                lastOrderStatus = orderData.status;
                lastRevisionsLeft = orderData.left_revisions;
                lastDeliveryCount = orderData.delivery_files?.length || 0;
                lastRequirementsText = orderData.requirements_text;
            }
            
            renderOrderData();
            startMessagePolling(orderId);
            startOrderMonitoring();
        } else {
            console.log('Order not found');
        }
    } catch (error) {
        console.error('Error loading order:', error);
    }
}

// =========================================
// REAL-TIME ORDER MONITORING (بدون توست)
// =========================================
function startOrderMonitoring() {
    if (orderPollingInterval) clearInterval(orderPollingInterval);
    
    orderPollingInterval = setInterval(() => {
        if (isPageActive && currentOrderId) {
            checkOrderChangesSilent();
        }
    }, 5000);
}

function stopOrderMonitoring() {
    if (orderPollingInterval) {
        clearInterval(orderPollingInterval);
        orderPollingInterval = null;
    }
}

async function checkOrderChangesSilent() {
    try {
        const orderId = getOrderIdFromUrl();
        if (!orderId) return;
        
        const response = await fetch(`${ORDERS_API}?action=get_order&order_id=${orderId}&t=${Date.now()}`);
        const data = await response.json();
        
        if (data.success && data.order) {
            const newOrderData = data.order;
            let needsRefresh = false;
            
            // 1. التحقق من تغيير الحالة
            if (lastOrderStatus !== newOrderData.status) {
                console.log('📊 Order status changed:', lastOrderStatus, '->', newOrderData.status);
                lastOrderStatus = newOrderData.status;
                needsRefresh = true;
                
                // تحديث الحالة في الواجهة
                updateStatusDisplaySilent(newOrderData.status);
                
                // تعطيل الدردشة إذا اكتمل الطلب
                if (newOrderData.status === 'completed') {
                    orderCompleted = true;
                    disableChatOnCompletion();
                    const submitBtn = document.getElementById('submit-delivery-btn');
                    if (submitBtn) submitBtn.disabled = true;
                    const cancelBtn = document.getElementById('cancel-request-btn');
                    if (cancelBtn) cancelBtn.disabled = true;
                    const deliveryUploadZone = document.querySelector('#delivery-container .delivery-upload-zone');
                    if (deliveryUploadZone) deliveryUploadZone.style.display = 'none';
                }
            }
            
            // 2. التحقق من تغيير المراجعات
            if (lastRevisionsLeft !== newOrderData.left_revisions) {
                console.log('🔄 Revisions changed:', lastRevisionsLeft, '->', newOrderData.left_revisions);
                lastRevisionsLeft = newOrderData.left_revisions;
                revisionsLeft = newOrderData.left_revisions;
                totalRevisions = newOrderData.revisions_allowed;
                needsRefresh = true;
                
                const revisionsLeftSpan = document.getElementById('revisions-left');
                if (revisionsLeftSpan) revisionsLeftSpan.textContent = revisionsLeft;
            }
            
            // 3. التحقق من ملفات تسليم جديدة
            const currentDeliveryCount = newOrderData.delivery_files?.length || 0;
            if (currentDeliveryCount > lastDeliveryCount) {
                console.log('📎 New delivery files added');
                lastDeliveryCount = currentDeliveryCount;
                needsRefresh = true;
            }
            
            // 4. التحقق من تغيير المتطلبات
            if (lastRequirementsText !== newOrderData.requirements_text && newOrderData.requirements_text) {
                console.log('📝 Requirements updated');
                lastRequirementsText = newOrderData.requirements_text;
                needsRefresh = true;
            }
            
            // 5. تحديث البيانات والواجهة إذا لزم الأمر
            if (needsRefresh) {
                orderData = newOrderData;
                renderOrderDataSilent();
            }
        }
    } catch (error) {
        console.error('Error checking order changes:', error);
    }
}

// ✅ تحديث الحالة بدون توست
function updateStatusDisplaySilent(newStatus) {
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
        statusVal.textContent = statusMap[newStatus] || newStatus;
        if (newStatus === 'completed') statusVal.style.color = 'var(--success)';
        else if (newStatus === 'in_progress') statusVal.style.color = 'var(--primary-color)';
        else if (newStatus === 'awaiting_requirements') statusVal.style.color = 'var(--warning)';
        else if (newStatus === 'delivered') statusVal.style.color = 'var(--primary-color)';
        else if (newStatus === 'cancelled') statusVal.style.color = '#ef4444';
        
        // تأثير وميض
        statusVal.classList.add('data-flash');
        setTimeout(() => statusVal.classList.remove('data-flash'), 500);
    }
    
    // تحديث الأزرار حسب الحالة
    updateButtonsByStatus(newStatus);
}

// ✅ تحديث الأزرار حسب الحالة
function updateButtonsByStatus(status) {
    const submitBtn = document.getElementById('submit-delivery-btn');
    const cancelBtn = document.getElementById('cancel-request-btn');
    
    if (status === 'completed' || status === 'cancelled') {
        if (submitBtn) submitBtn.disabled = true;
        if (cancelBtn) cancelBtn.disabled = true;
    } else {
        if (submitBtn) submitBtn.disabled = false;
        if (cancelBtn && !cancelRequestSubmitted) cancelBtn.disabled = false;
    }
}

// ✅ تحديث الواجهة بالكامل بدون توست
function renderOrderDataSilent() {
    if (!orderData) return;
    
    // تحديث رقم الطلب
    const orderIdDisplay = document.getElementById('order-id-display');
    if (orderIdDisplay) orderIdDisplay.textContent = `#${orderData.id}`;
    
    // تحديث عنوان الخدمة
    const orderTitle = document.getElementById('order-title');
    if (orderTitle) orderTitle.textContent = orderData.gig_title || 'Gig Title';
    
    // تحديث اسم المشتري
    const buyerName = document.getElementById('buyer-name');
    if (buyerName) buyerName.textContent = orderData.buyer_name || 'Buyer';
    
    // تحديث صورة المشتري
    const buyerAvatar = document.getElementById('buyer-avatar');
    if (buyerAvatar) {
        const buyerPicture = orderData.buyer_picture;
        if (buyerPicture && buyerPicture !== 'null' && buyerPicture !== '') {
            buyerAvatar.src = buyerPicture;
        } else {
            buyerAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(orderData.buyer_name || 'B') + '&background=7c3aed&color=fff&size=100';
        }
    }
    
    // تحديث الميزانية
    const orderBudget = document.getElementById('order-budget');
    if (orderBudget) orderBudget.textContent = `$${parseFloat(orderData.price || 0).toFixed(2)}`;
    orderBudget?.classList.add('data-flash');
    setTimeout(() => orderBudget?.classList.remove('data-flash'), 500);
    
    // تحديث الموعد النهائي
    const orderDeadline = document.getElementById('order-deadline');
    if (orderDeadline) {
        if (orderData.deadline) {
            const date = new Date(orderData.deadline);
            orderDeadline.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
            orderDeadline.textContent = '-';
        }
    }
    
    // تحديث المراجعات
    const revisionsLeftSpan = document.getElementById('revisions-left');
    if (revisionsLeftSpan) revisionsLeftSpan.textContent = revisionsLeft;
    
    // تحديث الحالة
    updateStatusDisplaySilent(orderData.status);
    
    // تحديث نص المتطلبات
    const requirementsText = document.getElementById('requirements-text');
    if (requirementsText) {
        requirementsText.textContent = orderData.requirements_text || 'No requirements submitted yet.';
    }
    
    // تحديث الملفات المرفقة
    renderAttachedFilesSilent();
    
    // تحديث تاريخ التسليم
    renderDeliveryHistorySilent();
}

// ✅ تحديث الملفات المرفقة بدون توست
function renderAttachedFilesSilent() {
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

// ✅ تحديث تاريخ التسليم بدون توست
function renderDeliveryHistorySilent() {
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

// ✅ التحقق من الرسائل الجديدة بدون توست
async function fetchMessagesSilent() {
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
            
            // إضافة الرسائل الجديدة فقط (بدون إشعار)
            const chatBox = document.getElementById('chat-box');
            if (chatBox && !document.hidden) {
                const oldHeight = chatBox.scrollHeight;
                const wasAtBottom = chatBox.scrollHeight - chatBox.scrollTop <= 100;
                
                data.messages.forEach(msg => {
                    const isMe = (msg.sender_id == currentUserId);
                    // التحقق من عدم وجود الرسالة مسبقاً
                    const existingMsg = chatBox.querySelector(`[data-msg-id="${msg.id}"]`);
                    if (!existingMsg) {
                        const msgDiv = document.createElement('div');
                        msgDiv.className = `msg ${isMe ? 'msg-me' : 'msg-buyer'}`;
                        msgDiv.setAttribute('data-msg-id', msg.id);
                        const senderName = isMe ? 'You' : (msg.sender_name || 'Buyer');
                        const time = new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        msgDiv.innerHTML = `
                            <div class="msg-meta">${escapeHtml(senderName)} • ${time}</div>
                            ${escapeHtml(msg.content)}
                        `;
                        chatBox.appendChild(msgDiv);
                    }
                });
                
                // التمرير للأسفل إذا كان المستخدم في الأسفل
                if (wasAtBottom) {
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            }
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

// =========================================
// RENDER ORDER DATA TO PAGE (أصلي)
// =========================================
function renderOrderData() {
    if (!orderData) return;
    
    const orderIdDisplay = document.getElementById('order-id-display');
    if (orderIdDisplay) orderIdDisplay.textContent = `#${orderData.id}`;
    
    const orderTitle = document.getElementById('order-title');
    if (orderTitle) orderTitle.textContent = orderData.gig_title || 'Gig Title';
    
    const buyerName = document.getElementById('buyer-name');
    if (buyerName) buyerName.textContent = orderData.buyer_name || 'Buyer';
    
    const buyerAvatar = document.getElementById('buyer-avatar');
    if (buyerAvatar) {
        const buyerPicture = orderData.buyer_picture;
        if (buyerPicture && buyerPicture !== 'null' && buyerPicture !== '') {
            buyerAvatar.src = buyerPicture;
        } else {
            buyerAvatar.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(orderData.buyer_name || 'B') + '&background=7c3aed&color=fff&size=100';
        }
    }
    
    const orderBudget = document.getElementById('order-budget');
    if (orderBudget) orderBudget.textContent = `$${parseFloat(orderData.price || 0).toFixed(2)}`;
    
    const orderDeadline = document.getElementById('order-deadline');
    if (orderDeadline) {
        if (orderData.deadline) {
            const date = new Date(orderData.deadline);
            orderDeadline.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } else {
            orderDeadline.textContent = '-';
        }
    }
    
    totalRevisions = orderData.revisions_allowed || 3;
    revisionsLeft = orderData.left_revisions !== null && orderData.left_revisions !== undefined ? orderData.left_revisions : totalRevisions;
    
    const revisionsLeftSpan = document.getElementById('revisions-left');
    if (revisionsLeftSpan) revisionsLeftSpan.textContent = revisionsLeft;
    
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
    
    const requirementsText = document.getElementById('requirements-text');
    if (requirementsText) {
        requirementsText.textContent = orderData.requirements_text || 'No requirements submitted yet.';
    }
    
    renderAttachedFiles();
    renderDeliveryHistory();
    
    if (orderData.status === 'completed') {
        orderCompleted = true;
        const submitBtn = document.getElementById('submit-delivery-btn');
        if (submitBtn) submitBtn.disabled = true;
        const cancelBtn = document.getElementById('cancel-request-btn');
        if (cancelBtn) cancelBtn.disabled = true;
        disableChatOnCompletion();
        const deliveryUploadZone = document.querySelector('#delivery-container .delivery-upload-zone');
        if (deliveryUploadZone) deliveryUploadZone.style.display = 'none';
    }
}

// =========================================
// RENDER ATTACHED FILES (أصلي)
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
// RENDER DELIVERY HISTORY (أصلي)
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
    window.location.href = `${ORDERS_API}?action=download_file&file_id=${fileId}`;
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
    if (orderCompleted) {
        return;
    }
    
    const orderId = getOrderIdFromUrl();
    
    if (!orderId) {
        return;
    }
    
    if (deliveryFiles.length === 0) {
        return;
    }
    
    const formData = new FormData();
    formData.append('order_id', orderId);
    
    for (let i = 0; i < deliveryFiles.length; i++) {
        formData.append('delivery_files[]', deliveryFiles[i]);
    }
    
    const submitBtn = document.getElementById('submit-delivery-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const response = await fetch(`${ORDERS_API}?action=submit_delivery`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            deliveryFiles = [];
            renderDeliveryFilesUpload();
            document.getElementById('delivery-file-input').value = '';
            await loadOrderFromDatabase();
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Submit Delivery';
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
    if (orderCompleted) {
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
        }
    } catch (error) {
        console.error('Error sending message:', error);
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
    if (orderCompleted) return;
    if (cancelRequestSubmitted) return;
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

    if (!selectedReason) return;
    if (!detail.trim()) return;

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
// CSS للتأثيرات البصرية
// =========================================
function addTrackingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes dataFlash {
            0% { opacity: 0.5; background: rgba(139, 92, 246, 0.2); }
            100% { opacity: 1; background: transparent; }
        }
        .data-flash {
            animation: dataFlash 0.5s ease;
        }
        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: #10b981;
            background: rgba(16, 185, 129, 0.1);
            padding: 4px 10px;
            border-radius: 20px;
            margin-left: 15px;
        }
        .live-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
            0% { opacity: 1; transform: scale(1); }
            100% { opacity: 0.3; transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
}

function addLiveIndicator() {
    const header = document.querySelector('.card-header');
    if (header && !document.querySelector('.live-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'live-indicator';
        indicator.innerHTML = '<span class="live-dot"></span> Live updates';
        header.appendChild(indicator);
    }
}

// =========================================
// INITIALIZATION
// =========================================
document.addEventListener('visibilitychange', () => {
    isPageActive = !document.hidden;
    if (isPageActive && currentOrderId) {
        checkOrderChangesSilent();
        fetchMessages();
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    addTrackingStyles();
    addLiveIndicator();
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
    stopOrderMonitoring();
});