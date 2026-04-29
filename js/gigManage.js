let myGigs = [
    { id: 1, title: "Modern Luxury Logo Design for Premium Tech Brands", price: 65, rating: 4.9, reviews: 124, status: "active", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500" },
    { id: 2, title: "High-End UI/UX Design for iOS & Android Mobile Apps", price: 450, rating: 5.0, reviews: 92, status: "active", image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=500" },
    { id: 3, title: "Professional Cinematic Video Editing & Post-Production", price: 150, rating: 4.8, reviews: 31, status: "paused", image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500" }
];

let gigToDelete = null;

function renderGigs(filter) {
    const grid = document.getElementById('gigsGrid');
    grid.innerHTML = '';
    const filtered = myGigs.filter(g => g.status === filter);

    filtered.forEach(gig => {
        const card = document.createElement('div');
        card.className = 'gig-portrait-card';
        card.innerHTML = `
            <div class="card-top-img" style="background-image: url('${gig.image}')"></div>
            <div class="card-main-body">
                <h3>${gig.title}</h3>
                <div class="rating-info-line">
                    <i class="fas fa-star"></i>
                    <span class="r-num">${gig.rating}</span>
                    <span class="r-total">(${gig.reviews})</span>
                </div>
                <div class="card-action-footer">
                    <div class="price-display"><span>STARTING AT</span>$${gig.price}</div>
                    <div class="ctrl-btns-group">
                        <button class="control-btn" onclick="toggleStatus(${gig.id})" title="${gig.status === 'active' ? 'Pause' : 'Activate'}">
                            <i class="fas ${gig.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="control-btn" title="Edit" onclick="openEditGig()"><i class="fas fa-pen" ></i></button>
                        <button class="control-btn btn-delete-red" onclick="openDeleteModal(${gig.id})" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}
function openEditGig(){
    window.location.href="editGig.html"
}
function toggleStatus(id) {
    const gig = myGigs.find(g => g.id === id);
    if (gig) {
        const oldStatus = gig.status;
        gig.status = oldStatus === 'active' ? 'paused' : 'active';
        updateStats();
        renderGigs(oldStatus);
    }
}

function updateStats() {
    document.getElementById('activeCount').innerText = myGigs.filter(g => g.status === 'active').length;
    document.getElementById('pausedCount').innerText = myGigs.filter(g => g.status === 'paused').length;
}

function filterGigs(status, event) {
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderGigs(status);
}

function openDeleteModal(id) {
    gigToDelete = id;
    document.getElementById('deleteModal').classList.add('show');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    myGigs = myGigs.filter(g => g.id !== gigToDelete);
    closeDeleteModal();
    updateStats();
    const currentTab = document.querySelector('.tab-link.active').innerText.toLowerCase().includes('active') ? 'active' : 'paused';
    renderGigs(currentTab);
});

document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    renderGigs('active');
});