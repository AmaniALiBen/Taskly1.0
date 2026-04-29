// =========================================
// FREELANCER ORDER TRACKING - JAVASCRIPT
// =========================================

let deliveryFiles = [];
let revisionsLeft = 3;
let orderCompleted = false;
let cancelRequestSubmitted = false;

// =========================================
// TOAST FUNCTIONS
// =========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
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
// MESSAGES
// =========================================
function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const chatBox = document.getElementById('chat-box');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg msg-me';
    msgDiv.innerHTML = `<div class="msg-meta">You • Just now</div>${text}`;
    chatBox.appendChild(msgDiv);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
    setTimeout(() => {
        const reply = document.createElement('div');
        reply.className = 'msg msg-buyer';
        reply.innerHTML = `<div class="msg-meta">Sarah Johnson (Buyer) • Just now</div>Thanks for the update! Looking forward to it.`;
        chatBox.appendChild(reply);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1500);
}

// =========================================
// DOWNLOAD FILES
// =========================================
function downloadRequirementFile(fileName) {
    showToast(`Downloading ${fileName}...`, 'info');
    setTimeout(() => {
        const content = `This is a simulated download of ${fileName}\nOrder: #882-991\nDownloaded on: ${new Date().toLocaleString()}`;
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
    }, 500);
}

// =========================================
// DELIVERY FILES
// =========================================
function handleDeliveryFiles(event) {
    const files = Array.from(event.target.files);
    deliveryFiles = [...deliveryFiles, ...files];
    renderDeliveryFiles();
    showToast(`${files.length} file(s) added for delivery`, 'success');
}

function renderDeliveryFiles() {
    const list = document.getElementById('delivery-files-list');
    list.innerHTML = '';
    deliveryFiles.forEach((file, index) => {
        const chip = document.createElement('div');
        chip.className = 'delivery-file-chip';
        chip.innerHTML = `<span>${file.name}</span><i class="fas fa-times" style="cursor:pointer; color: #ef4444;" onclick="removeDeliveryFile(${index})"></i>`;
        list.appendChild(chip);
    });
}

function removeDeliveryFile(index) {
    deliveryFiles.splice(index, 1);
    renderDeliveryFiles();
}

function submitDelivery() {
    if (cancelRequestSubmitted) {
        showToast('Cancellation request is pending. Cannot submit delivery.', 'error');
        return;
    }
    if (orderCompleted) {
        showToast('Order is already completed. Cannot submit delivery.', 'error');
        return;
    }
    if (deliveryFiles.length === 0) {
        showToast('Please select files to deliver', 'error');
        return;
    }

    showToast(`Delivery submitted successfully! ${deliveryFiles.length} file(s) sent to buyer.`, 'success');

    const historyContainer = document.getElementById('delivery-history');
    const versionNum = document.querySelectorAll('#delivery-history .delivery-item').length + 1;
    const newDelivery = document.createElement('div');
    newDelivery.className = 'delivery-item';
    newDelivery.id = `delivery-item-${versionNum}`;
    newDelivery.innerHTML = `
        <div class="delivery-header">
            <span class="delivery-tag tag-delivered">Delivered</span>
            <span style="font-size: 12px; color: var(--text-secondary);">Just now</span>
        </div>
        <h4 style="margin-bottom: 8px;">Version ${versionNum} - New Delivery</h4>
        <div class="delivery-files">
            ${deliveryFiles.map(f => `<span class="delivery-file"><i class="fas fa-file"></i> ${f.name}</span>`).join('')}
        </div>
        <div style="margin-top: 10px;">
            <span class="delivery-tag tag-pending" id="delivery-status-${versionNum}">Pending Review</span>
            <button class="button-outline" style="margin-left: 10px; padding: 4px 12px; font-size: 11px;" onclick="simulateRevisionRequestForDelivery(${versionNum})">Simulate Revision</button>
            <button class="button-primary" style="margin-left: 5px; padding: 4px 12px; font-size: 11px;" onclick="simulateAcceptanceForDelivery(${versionNum})">Simulate Accept</button>
        </div>
    `;
    historyContainer.insertBefore(newDelivery, historyContainer.firstChild);

    deliveryFiles = [];
    renderDeliveryFiles();
    document.getElementById('delivery-file-input').value = '';
}

// =========================================
// REVISION & ACCEPTANCE SIMULATIONS
// =========================================
function simulateRevisionRequest() {
    simulateRevisionRequestForDelivery(1);
}

function simulateRevisionRequestForDelivery(deliveryId) {
    if (revisionsLeft <= 0) {
        showToast('No revisions left! Cannot request more revisions.', 'error');
        return;
    }

    revisionsLeft--;
    document.getElementById('revisions-left').textContent = revisionsLeft;

    const statusSpan = document.getElementById(`delivery-status-${deliveryId}`);
    if (statusSpan) {
        statusSpan.className = 'delivery-tag tag-revision';
        statusSpan.textContent = 'Revision Requested';
    }

    showToast(`Revision requested! ${revisionsLeft} revisions remaining.`, 'warning');

    const chatBox = document.getElementById('chat-box');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'msg msg-system';
    systemMsg.innerHTML = `<div class="msg-meta">System • Just now</div>Buyer has requested a revision on Delivery #${deliveryId}. Please update your work.`;
    chatBox.appendChild(systemMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function simulateAcceptance() {
    simulateAcceptanceForDelivery(1);
}

function simulateAcceptanceForDelivery(deliveryId) {
    const statusSpan = document.getElementById(`delivery-status-${deliveryId}`);
    if (statusSpan) {
        statusSpan.className = 'delivery-tag tag-accepted';
        statusSpan.textContent = 'Accepted ✓';
    }

    document.getElementById('status-val').textContent = 'Completed';
    document.getElementById('status-val').style.color = 'var(--success)';
    orderCompleted = true;

    const submitBtn = document.getElementById('submit-delivery-btn');
    if (submitBtn) submitBtn.disabled = true;

    const cancelBtn = document.getElementById('cancel-request-btn');
    if (cancelBtn) cancelBtn.disabled = true;

    showToast('Order completed successfully! Payment has been released.', 'success');

    const chatBox = document.getElementById('chat-box');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'msg msg-system';
    systemMsg.innerHTML = `<div class="msg-meta">System • Just now</div>Buyer has accepted Delivery #${deliveryId} and marked the order as COMPLETED.`;
    chatBox.appendChild(systemMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
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

    const cancelRequest = {
        orderId: '882-991',
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
    document.getElementById('status-val').textContent = 'Cancellation Requested';
    document.getElementById('status-val').style.color = 'var(--error)';

    const submitBtn = document.getElementById('submit-delivery-btn');
    if (submitBtn) submitBtn.disabled = true;

    const cancelBtn = document.getElementById('cancel-request-btn');
    if (cancelBtn) cancelBtn.disabled = true;

    showToast('Cancellation request submitted to admin. You will be notified once reviewed.', 'success');
    closeCancelModal();

    const chatBox = document.getElementById('chat-box');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'msg msg-system';
    systemMsg.innerHTML = `<div class="msg-meta">System • Just now</div>Cancellation request has been submitted to admin for review.`;
    chatBox.appendChild(systemMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// =========================================
// MODAL CLOSE ON OUTSIDE CLICK
// =========================================
window.onclick = function (event) {
    const cancelModal = document.getElementById('cancelModal');
    if (event.target === cancelModal) closeCancelModal();
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeCancelModal();
});