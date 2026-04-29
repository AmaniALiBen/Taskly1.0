/**
 * Freelancer Profile Page JavaScript
 * Handles loading freelancer data and gigs from database
 */

// Freelancer Data - Ready for database integration
const freelancerData = {
    id: 1,
    name: "Ahmed Mansour",
    email: "ahmed.mansour@taskly.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    country: "Cairo, Egypt",
    bio: "Full-Stack Developer with 7+ years of experience. I build high-quality web applications with clean code and attention to detail. I deliver projects on time and provide ongoing support.",
    skills: "JavaScript, React, Node.js, Python, HTML5, CSS3, MongoDB, Git",
    languages: ["English", "Arabic", "French"],
    level: "Pro",
    rating: 4.9,
    totalOrders: 247,
    memberSince: "2022"
};

// Gigs Data - 8 gigs total
const gigsData = [
    {
        id: 1,
        title: "Modern Web Development with React & Node.js",
        category: "Web Development",
        price: 350,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800"
    },
    {
        id: 2,
        title: "React & Next.js Expert - Modern Frontend Development",
        category: "Frontend",
        price: 280,
        rating: 5.0,
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800"
    },
    {
        id: 3,
        title: "RESTful API Development with Node.js & Express",
        category: "Backend",
        price: 420,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800"
    },
    {
        id: 4,
        title: "Complete Full Stack Web Application Development",
        category: "Full Stack",
        price: 550,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
    },
    {
        id: 5,
        title: "Mobile App UI/UX Design with Figma",
        category: "Design",
        price: 180,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?w=800"
    },
    {
        id: 6,
        title: "SEO Optimization & Digital Marketing Package",
        category: "Marketing",
        price: 320,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
    },
    {
        id: 7,
        title: "Professional Video Editing & Animation",
        category: "Video",
        price: 250,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"
    },
    {
        id: 8,
        title: "Content Writing & Copywriting Services",
        category: "Writing",
        price: 120,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800"
    }
];

/**
 * Load freelancer data into the page
 */
function loadFreelancerData() {
    // Basic info
    const nameEl = document.getElementById('freelancer-name');
    const countryEl = document.getElementById('freelancer-country');
    const bioEl = document.getElementById('freelancer-bio');
    const skillsEl = document.getElementById('freelancer-skills');
    const emailEl = document.getElementById('freelancer-email');
    const avatarEl = document.getElementById('profile-avatar');
    
    if (nameEl) nameEl.textContent = freelancerData.name;
    if (countryEl) countryEl.textContent = freelancerData.country;
    if (bioEl) bioEl.textContent = freelancerData.bio;
    if (skillsEl) skillsEl.textContent = freelancerData.skills;
    if (emailEl) emailEl.textContent = freelancerData.email;
    if (avatarEl) avatarEl.src = freelancerData.avatar;
    
    // Load languages
    const languagesContainer = document.getElementById('freelancer-languages');
    if (languagesContainer) {
        languagesContainer.innerHTML = '';
        freelancerData.languages.forEach(lang => {
            const langDiv = document.createElement('div');
            langDiv.className = 'language-item';
            langDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${lang}`;
            languagesContainer.appendChild(langDiv);
        });
    }
    
    // Load level
    const levelEl = document.getElementById('freelancer-level');
    if (levelEl) {
        levelEl.innerHTML = `<i class="fas fa-crown"></i> ${freelancerData.level}`;
    }
    
    // Load rating stars
    const ratingContainer = document.getElementById('freelancer-rating');
    if (ratingContainer) {
        const fullStars = Math.floor(freelancerData.rating);
        const hasHalfStar = freelancerData.rating % 1 >= 0.5;
        
        ratingContainer.innerHTML = '';
        for (let i = 0; i < fullStars; i++) {
            ratingContainer.innerHTML += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            ratingContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            ratingContainer.innerHTML += '<i class="far fa-star"></i>';
        }
    }
    
    // Load orders count
    const ordersEl = document.getElementById('freelancer-orders');
    if (ordersEl) {
        ordersEl.textContent = `${freelancerData.rating} · ${freelancerData.totalOrders} orders`;
    }
}

/**
 * Load gigs into the page
 */
function loadGigs() {
    const container = document.getElementById('gigs-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    gigsData.forEach(gig => {
        const gigCard = document.createElement('div');
        gigCard.className = 'gig-card';
        gigCard.onclick = () => window.location.href = `gig-details.html?id=${gig.id}`;
        
        gigCard.innerHTML = `
            <div class="gig-image-container">
                <img src="${gig.image}" alt="${gig.title}" loading="lazy">
            </div>
            <div class="gig-body-content">
                <span class="gig-category-badge">${gig.category}</span>
                <h3 class="gig-title-text">${gig.title}</h3>
                <div class="gig-footer-info">
                    <span class="rating-display"><i class="fas fa-star"></i> ${gig.rating}</span>
                    <span class="price-value-text">$${gig.price}</span>
                </div>
            </div>
        `;
        
        container.appendChild(gigCard);
    });
}

/**
 * Initialize the page
 */
function init() {
    loadFreelancerData();
    loadGigs();
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);