// ============================================
// SUPABASE INTEGRATION
// Connect Supabase with existing HTML functions
// ============================================

// Store data globally for easy access
window.productsData = [];
window.reviewsData = [];
window.galleryData = [];
window.shippingSlides = [];
window.currentShippingSlide = 0;

// ============ PAGE INITIALIZATION ============
async function initializePageData() {
  console.log('Initializing page data from Supabase...');
  
  try {
    await loadAndDisplayProducts();
    await loadAndDisplayReviews();
    await loadAndDisplayGallery();
    await loadAndDisplayShippingCarousel();
    await updateAnnouncementBanner();
    
    // Setup real-time subscriptions
    setupRealtimeSubscriptions();
    
    console.log('✅ Page initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing page:', error);
  }
}

// ============ LOAD & DISPLAY PRODUCTS ============
async function loadAndDisplayProducts() {
  const products = await loadProducts();
  window.productsData = products;
  
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (products.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-center text-stone-500">No products available yet.</p>';
    return;
  }
  
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition';
    card.innerHTML = `
      <div class="h-48 bg-stone-100 overflow-hidden">
        <img 
          src="${product.image_url || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'}" 
          alt="${product.name_en}" 
          class="w-full h-full object-cover"
          onerror="this.src='https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name_en)}'"
        >
      </div>
      <div class="p-4">
        <h4 class="font-bold text-stone-900 text-sm">${product.name_en}</h4>
        <p class="text-xs text-stone-500 mb-2">${product.name_mr || ''}</p>
        <p class="text-xs text-stone-600 mb-3 line-clamp-2">${product.description || 'Premium quality grains'}</p>
        <div class="flex justify-between items-center">
          <span class="font-bold text-gold-700">₹${parseFloat(product.rate).toFixed(2)}/kg</span>
          <span class="text-[10px] font-bold px-2 py-1 rounded ${product.stock_status === 'instock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
            ${product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ============ LOAD & DISPLAY REVIEWS ============
async function loadAndDisplayReviews() {
  const reviews = await loadReviews();
  window.reviewsData = reviews;
  
  const container = document.getElementById('reviews-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (reviews.length === 0) {
    container.innerHTML = '<p class="text-center text-stone-500 text-sm">No reviews yet. Be the first to review!</p>';
    return;
  }
  
  reviews.forEach(review => {
    const stars = '⭐'.repeat(review.rating || 5);
    const reviewDiv = document.createElement('div');
    reviewDiv.className = 'bg-white p-4 rounded-xl border shadow-sm';
    reviewDiv.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <h5 class="font-bold text-stone-800 text-sm">${review.reviewer_name}</h5>
        <span class="text-xs">${stars}</span>
      </div>
      <p class="text-xs text-stone-600 leading-relaxed">${review.content}</p>
    `;
    container.appendChild(reviewDiv);
  });
}

// ============ LOAD & DISPLAY GALLERY ============
async function loadAndDisplayGallery() {
  const images = await loadGalleryImages();
  window.galleryData = images;
  
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  if (images.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-center text-stone-500">No gallery images yet.</p>';
    return;
  }
  
  images.forEach(img => {
    const imgDiv = document.createElement('div');
    imgDiv.className = 'rounded-lg overflow-hidden shadow-md h-40 bg-stone-100 cursor-pointer hover:opacity-75 transition';
    imgDiv.innerHTML = `
      <img 
        src="${img.image_url}" 
        alt="Gallery - ${img.category}" 
        class="w-full h-full object-cover"
        onerror="this.src='https://via.placeholder.com/300'"
      >
    `;
    grid.appendChild(imgDiv);
  });
}

// ============ LOAD & DISPLAY SHIPPING CAROUSEL ============
async function loadAndDisplayShippingCarousel() {
  const slides = await loadShippingSlides();
  window.shippingSlides = slides;
  window.currentShippingSlide = 0;
  
  console.log('Loaded shipping slides:', slides.length);
  
  if (slides.length > 0) {
    updateShippingCarousel();
  }
}

function updateShippingCarousel() {
  if (!window.shippingSlides || window.shippingSlides.length === 0) return;
  
  const slide = window.shippingSlides[window.currentShippingSlide];
  
  const titleEl = document.getElementById('shipping-carousel-title');
  const imageEl = document.getElementById('shipping-carousel-image');
  const descEl = document.getElementById('shipping-carousel-desc');
  
  if (titleEl) titleEl.textContent = slide.title || 'Dharashiv & Solapur';
  if (imageEl) {
    imageEl.src = slide.image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80';
    imageEl.onerror = function() { this.src = 'https://via.placeholder.com/300'; };
  }
  if (descEl) descEl.textContent = slide.description || 'Reliable direct-to-home deliveries';
}

function nextShippingSlide() {
  if (!window.shippingSlides || window.shippingSlides.length === 0) return;
  window.currentShippingSlide = (window.currentShippingSlide + 1) % window.shippingSlides.length;
  updateShippingCarousel();
}

function prevShippingSlide() {
  if (!window.shippingSlides || window.shippingSlides.length === 0) return;
  window.currentShippingSlide = (window.currentShippingSlide - 1 + window.shippingSlides.length) % window.shippingSlides.length;
  updateShippingCarousel();
}

// ============ UPDATE ANNOUNCEMENT BANNER ============
async function updateAnnouncementBanner() {
  const announcement = await loadAnnouncement();
  
  const announcementEl = document.getElementById('announcement-content');
  const announcementDupEl = document.getElementById('announcement-content-dup');
  
  if (announcementEl) announcementEl.textContent = announcement;
  if (announcementDupEl) announcementDupEl.textContent = announcement;
}

// ============ FILTER PRODUCTS ============
function filterProducts() {
  const searchTerm = document.getElementById('search-bar')?.value.toLowerCase() || '';
  const category = window.currentCategory || 'all';
  
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  let filtered = window.productsData;
  
  // Filter by category
  if (category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  
  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(p => 
      p.name_en.toLowerCase().includes(searchTerm) ||
      p.name_mr.toLowerCase().includes(searchTerm) ||
      (p.description || '').toLowerCase().includes(searchTerm)
    );
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-center text-stone-500">No products match your search.</p>';
    return;
  }
  
  filtered.forEach(product => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition';
    card.innerHTML = `
      <div class="h-48 bg-stone-100 overflow-hidden">
        <img 
          src="${product.image_url || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80'}" 
          alt="${product.name_en}" 
          class="w-full h-full object-cover"
          onerror="this.src='https://via.placeholder.com/300'"
        >
      </div>
      <div class="p-4">
        <h4 class="font-bold text-stone-900 text-sm">${product.name_en}</h4>
        <p class="text-xs text-stone-500 mb-2">${product.name_mr || ''}</p>
        <p class="text-xs text-stone-600 mb-3 line-clamp-2">${product.description || 'Premium quality grains'}</p>
        <div class="flex justify-between items-center">
          <span class="font-bold text-gold-700">₹${parseFloat(product.rate).toFixed(2)}/kg</span>
          <span class="text-[10px] font-bold px-2 py-1 rounded ${product.stock_status === 'instock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
            ${product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function changeCategoryFilter(category) {
  window.currentCategory = category;
  
  // Update button states
  document.getElementById('filter-btn-all')?.classList.remove('tab-btn-active');
  document.getElementById('filter-btn-grains')?.classList.remove('tab-btn-active');
  document.getElementById('filter-btn-flours')?.classList.remove('tab-btn-active');
  
  document.getElementById(`filter-btn-${category}`)?.classList.add('tab-btn-active');
  
  filterProducts();
}

// ============ SUBMIT REVIEW ============
async function submitReviewFromForm(event) {
  event.preventDefault();
  
  const nameInput = document.getElementById('reviewer-name');
  const contentInput = document.getElementById('reviewer-content');
  
  const name = nameInput?.value?.trim();
  const content = contentInput?.value?.trim();
  
  if (!name || !content) {
    alert('Please fill in all fields');
    return;
  }
  
  const success = await submitReview(name, content);
  
  if (success) {
    alert('✅ Review submitted! It will be visible after admin approval.');
    nameInput.value = '';
    contentInput.value = '';
  } else {
    alert('❌ Error submitting review. Please try again.');
  }
}

// ============ REAL-TIME SUBSCRIPTIONS ============
function setupRealtimeSubscriptions() {
  console.log('Setting up real-time subscriptions...');
  
  // Subscribe to product changes
  subscribeToProducts(async (payload) => {
    console.log('Products changed:', payload.eventType);
    await loadAndDisplayProducts();
  });
  
  // Subscribe to review changes
  subscribeToReviews(async (payload) => {
    console.log('Reviews changed:', payload.eventType);
    await loadAndDisplayReviews();
  });
  
  // Subscribe to announcement changes
  subscribeToAnnouncements(async (payload) => {
    console.log('Announcements changed:', payload.eventType);
    await updateAnnouncementBanner();
  });
  
  console.log('✅ Real-time subscriptions active');
}

// ============ INITIALIZE ON PAGE LOAD ============
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ready, initializing...');
  
  // Check if Supabase is loaded
  if (!window.supabaseClient) {
    console.error('❌ Supabase client not initialized. Check supabase-config.js');
    return;
  }
  
  console.log('✅ Supabase client ready');
  
  // Initialize page
  initializePageData();
  
  // Initialize category
  window.currentCategory = 'all';
});

// ============ EXPORT GLOBALS ============
window.filterProducts = filterProducts;
window.changeCategoryFilter = changeCategoryFilter;
window.nextShippingSlide = nextShippingSlide;
window.prevShippingSlide = prevShippingSlide;
window.submitReviewFromForm = submitReviewFromForm;
