// ============================================
// FRONTEND DISPLAY FUNCTIONS
// All data syncs in real-time from Supabase
// ============================================

// ============================================
// PRODUCTS DISPLAY
// ============================================

function displayProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  products.forEach(product => {
    if (product.stock_status !== 'instock') return; // Hide out of stock
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition border border-gold-100';
    card.innerHTML = `
      <div class="relative h-48 bg-stone-100 overflow-hidden group">
        <img src="${product.image_url}" alt="${product.name_en}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
        <div class="absolute top-3 right-3 bg-gold-600 text-white px-3 py-1.5 rounded-full text-xs font-bold">₹${product.rate}</div>
      </div>
      <div class="p-4 space-y-3">
        <div>
          <h4 class="font-bold text-stone-800 line-clamp-2">${product.name_en}</h4>
          <p class="text-xs text-stone-500">${product.name_mr}</p>
        </div>
        <p class="text-xs text-stone-600 line-clamp-2">${product.description || 'Premium quality product'}</p>
        <a href="https://wa.me/917758814247?text=I want to order ${product.name_en}" target="_blank" class="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition">
          Order on WhatsApp
        </a>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterProducts() {
  const searchTerm = document.getElementById('search-bar').value.toLowerCase();
  const category = window.currentCategoryFilter || 'all';
  
  let filtered = allProducts.filter(p => {
    const matchesSearch = p.name_en.toLowerCase().includes(searchTerm) || p.name_mr.toLowerCase().includes(searchTerm);
    const matchesCategory = category === 'all' || p.category === category;
    const inStock = p.stock_status === 'instock';
    
    return matchesSearch && matchesCategory && inStock;
  });
  
  displayProducts(filtered);
}

function changeCategoryFilter(category) {
  window.currentCategoryFilter = category;
  
  // Update button styles
  document.getElementById('filter-btn-all').classList.toggle('tab-btn-active', category === 'all');
  document.getElementById('filter-btn-grains').classList.toggle('tab-btn-active', category === 'grains');
  document.getElementById('filter-btn-flours').classList.toggle('tab-btn-active', category === 'flours');
  
  filterProducts();
}

// ============================================
// REVIEWS DISPLAY
// ============================================

function displayReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  reviews.forEach(review => {
    const div = document.createElement('div');
    div.className = 'bg-white p-4 rounded-xl border-l-4 border-gold-600 shadow-sm hover:shadow-md transition';
    
    const stars = '⭐'.repeat(review.rating);
    
    div.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div>
          <h5 class="font-bold text-stone-800">${review.name}</h5>
          <div class="text-sm text-gold-600 font-semibold">${stars}</div>
        </div>
        <span class="text-[10px] text-stone-400 font-bold">Verified Customer</span>
      </div>
      <p class="text-stone-600 text-sm leading-relaxed">${review.content}</p>
    `;
    
    container.appendChild(div);
  });
}

async function submitReview(event) {
  event.preventDefault();
  
  try {
    const name = document.getElementById('reviewer-name').value;
    const content = document.getElementById('reviewer-content').value;
    
    await submitReviewToDatabase({
      name,
      content,
      rating: 5
    });
    
    document.getElementById('review-form').reset();
    await loadReviewsWithSync();
  } catch (error) {
    console.error('❌ Error submitting review:', error);
  }
}

// ============================================
// GALLERY DISPLAY
// ============================================

function displayGallery(gallery) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  gallery.forEach(item => {
    const div = document.createElement('div');
    div.className = 'relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer group';
    div.innerHTML = `
      <img src="${item.image_url}" alt="${item.caption}" class="w-full h-40 object-cover group-hover:scale-105 transition duration-300">
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end">
        <p class="text-white text-xs font-semibold p-3 w-full bg-gradient-to-t from-black/60 to-transparent">${item.caption}</p>
      </div>
    `;
    grid.appendChild(div);
  });
}

// ============================================
// ANNOUNCEMENT DISPLAY
// ============================================

function displayAnnouncement(content) {
  const announcementContent = document.getElementById('announcement-content');
  const announcementContentDup = document.getElementById('announcement-content-dup');
  
  if (announcementContent) {
    announcementContent.textContent = content;
  }
  if (announcementContentDup) {
    announcementContentDup.textContent = content;
  }
}

// ============================================
// SHIPPING CAROUSEL DISPLAY
// ============================================

let shippingCurrentIndex = 0;
let shippingSlides = [];

function setupShippingCarousel(slides) {
  shippingSlides = slides;
  shippingCurrentIndex = 0;
  updateShippingCarousel();
}

function updateShippingCarousel() {
  if (shippingSlides.length === 0) return;
  
  const slide = shippingSlides[shippingCurrentIndex];
  
  document.getElementById('shipping-carousel-title').textContent = slide.title;
  document.getElementById('shipping-carousel-image').src = slide.image_url;
  document.getElementById('shipping-carousel-desc').textContent = slide.description;
}

function nextShippingSlide() {
  shippingCurrentIndex = (shippingCurrentIndex + 1) % shippingSlides.length;
  updateShippingCarousel();
}

function prevShippingSlide() {
  shippingCurrentIndex = (shippingCurrentIndex - 1 + shippingSlides.length) % shippingSlides.length;
  updateShippingCarousel();
}

// ============================================
// PAYMENT QR CODE
// ============================================

function regeneratePayQR() {
  const amount = document.getElementById('qr-custom-amount').value;
  const upi = document.getElementById('upi-string-display').textContent;
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${upi}@upi&am=${amount}`;
  document.getElementById('payment-qr').src = qrUrl;
}

// ============================================
// MOBILE NAVIGATION
// ============================================

function toggleMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const icon = document.getElementById('menu-icon');
  
  if (nav.classList.contains('hidden')) {
    nav.classList.remove('hidden');
    icon.classList.add('fa-xmark');
    icon.classList.remove('fa-bars');
  } else {
    nav.classList.add('hidden');
    icon.classList.remove('fa-xmark');
    icon.classList.add('fa-bars');
  }
}

function closeAnnouncement() {
  document.getElementById('announcement-banner').classList.add('hidden');
}

// ============================================
// AUTO-LOAD ALL DATA ON PAGE LOAD
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Loading KrishnaPriya website...');
  
  // Initialize Supabase
  await initSupabase();
  
  // Load all data
  await Promise.all([
    (async () => {
      const products = await loadProductsWithSync();
      allProducts = products;
      filterProducts();
    })(),
    (async () => {
      const reviews = await loadReviewsWithSync();
      displayReviews(reviews);
    })(),
    (async () => {
      const gallery = await loadGalleryWithSync();
      displayGallery(gallery);
    })(),
    (async () => {
      await loadShippingSlidesWithSync();
    })(),
    (async () => {
      await loadAnnouncementWithSync();
    })()
  ]);
  
  console.log('✅ Website ready!');
});
