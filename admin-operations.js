// ============================================
// ADMIN PANEL OPERATIONS - FIXED VERSION
// All operations now use Supabase with verification
// ============================================

let currentEditProductId = null;
let currentCategoryFilter = 'all';
let allProducts = [];
let allReviews = [];
let allGallery = [];
let allShippingSlides = [];

// ============================================
// ADMIN AUTHENTICATION
// ============================================

const ADMIN_PASSWORD = 'KrishnaPriya@2024'; // Change this to your secret

function verifyAdminAccess(event) {
  event.preventDefault();
  const password = document.getElementById('admin-password-field').value;
  
  if (password === ADMIN_PASSWORD) {
    document.getElementById('admin-auth-modal').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    loadAdminPanel();
    showNotification('✅ Admin access granted!', 'success');
  } else {
    document.getElementById('auth-error-msg').classList.remove('hidden');
    showNotification('❌ Invalid password', 'error');
  }
}

function openAdminPanel() {
  document.getElementById('admin-auth-modal').classList.remove('hidden');
}

function closeAdminPanel() {
  document.getElementById('admin-panel').classList.add('hidden');
  document.getElementById('admin-auth-modal').classList.add('hidden');
}

function closeAdminAuth() {
  document.getElementById('admin-auth-modal').classList.add('hidden');
}

// ============================================
// ADMIN PANEL TAB SWITCHING
// ============================================

function switchAdminTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.admin-tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  // Deactivate all buttons
  document.querySelectorAll('[id^="admin-tab-btn-"]').forEach(btn => {
    btn.classList.remove('bg-stone-200');
    btn.classList.add('text-stone-700');
  });
  
  // Show selected tab
  document.getElementById(`admin-tab-${tabName}`).classList.remove('hidden');
  document.getElementById(`admin-tab-btn-${tabName}`).classList.add('bg-stone-200');
  
  // Load tab data
  if (tabName === 'products-tab') loadProductsTable();
  else if (tabName === 'reviews-tab') loadReviewsTable();
  else if (tabName === 'gallery-tab') loadGalleryTable();
  else if (tabName === 'shipping-tab') loadShippingTable();
  else if (tabName === 'settings-tab') loadSettingsForm();
}

// ============================================
// PRODUCTS MANAGEMENT
// ============================================

async function loadProductsTable() {
  try {
    allProducts = await loadProductsWithSync();
    renderProductsTable(allProducts);
  } catch (error) {
    console.error('❌ Error loading products table:', error);
    showNotification('❌ Failed to load products', 'error');
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('admin-products-table-body');
  tbody.innerHTML = '';
  
  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="p-3">${product.name_en}<br><small class="text-stone-500">${product.name_mr}</small></td>
      <td class="p-3"><span class="px-2 py-1 bg-gold-100 text-gold-700 rounded text-xs font-bold">${product.category}</span></td>
      <td class="p-3 font-semibold">₹${parseFloat(product.rate).toFixed(2)}</td>
      <td class="p-3"><span class="px-2 py-1 rounded text-xs font-bold ${
        product.stock_status === 'instock' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-red-100 text-red-700'
      }">${product.stock_status === 'instock' ? '✓ In Stock' : '✗ Out'}</span></td>
      <td class="p-3 text-right space-x-2">
        <button onclick="editProduct(${product.id})" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-bold">Edit</button>
        <button onclick="deleteProduct(${product.id})" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-bold">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function openAddProductModal() {
  currentEditProductId = null;
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('edit-product-id').value = '';
  document.getElementById('product-modal').classList.remove('hidden');
}

function editProduct(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  
  currentEditProductId = productId;
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('edit-product-id').value = productId;
  document.getElementById('prod-name-en').value = product.name_en;
  document.getElementById('prod-name-mr').value = product.name_mr;
  document.getElementById('prod-category').value = product.category;
  document.getElementById('prod-rate').value = product.rate;
  document.getElementById('prod-stock-status').value = product.stock_status;
  document.getElementById('prod-image').value = product.image_url;
  document.getElementById('prod-description').value = product.description || '';
  
  if (product.image_url) {
    document.getElementById('product-img-preview').src = product.image_url;
    document.getElementById('product-img-preview-container').classList.remove('hidden');
  }
  
  document.getElementById('product-modal').classList.remove('hidden');
}

async function saveProduct(event) {
  event.preventDefault();
  
  try {
    const imageFile = document.getElementById('prod-image-file').files[0];
    let imageUrl = document.getElementById('prod-image').value;
    
    // Upload image if new one is selected
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }
    
    const productData = {
      name_en: document.getElementById('prod-name-en').value,
      name_mr: document.getElementById('prod-name-mr').value,
      category: document.getElementById('prod-category').value,
      rate: parseFloat(document.getElementById('prod-rate').value),
      stock_status: document.getElementById('prod-stock-status').value,
      image_url: imageUrl,
      description: document.getElementById('prod-description').value,
      updated_at: new Date().toISOString()
    };
    
    if (currentEditProductId) {
      productData.id = currentEditProductId;
    }
    
    await saveProductToDatabase(productData);
    
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-form').reset();
    loadProductsTable();
  } catch (error) {
    console.error('❌ Error saving product:', error);
    showNotification('❌ Failed to save product', 'error');
  }
}

async function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return;
  
  try {
    await deleteProductFromDatabase(productId);
    loadProductsTable();
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    showNotification('❌ Failed to delete product', 'error');
  }
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
  currentEditProductId = null;
}

// ============================================
// REVIEWS MANAGEMENT
// ============================================

async function loadReviewsTable() {
  try {
    const client = await initSupabase();
    const { data, error } = await client
      .from('customer_reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    allReviews = data || [];
    renderReviewsTable(allReviews);
  } catch (error) {
    console.error('❌ Error loading reviews:', error);
  }
}

function renderReviewsTable(reviews) {
  const container = document.getElementById('admin-reviews-list');
  container.innerHTML = '';
  
  reviews.forEach(review => {
    const div = document.createElement('div');
    div.className = 'bg-white p-4 rounded-lg border';
    div.innerHTML = `
      <div class="flex justify-between items-start mb-2">
        <div>
          <h5 class="font-bold text-stone-800">${review.name}</h5>
          <div class="text-yellow-500 text-sm">★ ${'⭐'.repeat(review.rating)}</div>
        </div>
        <span class="px-2 py-1 rounded text-xs font-bold ${
          review.approved 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'
        }">${review.approved ? 'Approved' : 'Pending'}</span>
      </div>
      <p class="text-stone-600 text-sm mb-3">${review.content}</p>
      <div class="flex gap-2">
        <button onclick="editReview(${review.id})" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-bold">Edit</button>
        <button onclick="deleteReview(${review.id})" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-bold">Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function editReview(reviewId) {
  const review = allReviews.find(r => r.id === reviewId);
  if (!review) return;
  
  document.getElementById('edit-review-id').value = reviewId;
  document.getElementById('rev-edit-name').value = review.name;
  document.getElementById('rev-edit-content').value = review.content;
  document.getElementById('rev-edit-rating').value = review.rating;
  document.getElementById('rev-edit-approved').value = review.approved ? 'true' : 'false';
  
  document.getElementById('review-edit-modal').classList.remove('hidden');
}

async function saveAdminReview(event) {
  event.preventDefault();
  
  try {
    const reviewId = document.getElementById('edit-review-id').value;
    const client = await initSupabase();
    
    const reviewData = {
      name: document.getElementById('rev-edit-name').value,
      content: document.getElementById('rev-edit-content').value,
      rating: parseInt(document.getElementById('rev-edit-rating').value),
      approved: document.getElementById('rev-edit-approved').value === 'true'
    };
    
    if (reviewId) {
      // Update
      const { error } = await client
        .from('customer_reviews')
        .update(reviewData)
        .eq('id', parseInt(reviewId));
      
      if (error) throw error;
    }
    
    document.getElementById('review-edit-modal').classList.add('hidden');
    loadReviewsTable();
    showNotification('✅ Review saved!', 'success');
  } catch (error) {
    console.error('❌ Error saving review:', error);
    showNotification('❌ Failed to save review', 'error');
  }
}

async function deleteReview(reviewId) {
  if (!confirm('Delete this review?')) return;
  
  try {
    const client = await initSupabase();
    const { error } = await client
      .from('customer_reviews')
      .delete()
      .eq('id', reviewId);
    
    if (error) throw error;
    
    loadReviewsTable();
    showNotification('✅ Review deleted!', 'success');
  } catch (error) {
    console.error('❌ Error deleting review:', error);
    showNotification('❌ Failed to delete review', 'error');
  }
}

function openAddNewReviewModal() {
  document.getElementById('edit-review-id').value = '';
  document.getElementById('review-edit-form').reset();
  document.getElementById('review-edit-modal').classList.remove('hidden');
}

function closeReviewEditModal() {
  document.getElementById('review-edit-modal').classList.add('hidden');
}

// ============================================
// GALLERY MANAGEMENT
// ============================================

async function loadGalleryTable() {
  try {
    allGallery = await loadGalleryWithSync();
    renderGalleryTable(allGallery);
  } catch (error) {
    console.error('❌ Error loading gallery:', error);
  }
}

function renderGalleryTable(gallery) {
  const container = document.getElementById('admin-gallery-list');
  container.innerHTML = '';
  
  gallery.forEach(item => {
    const div = document.createElement('div');
    div.className = 'relative group rounded-lg overflow-hidden';
    div.innerHTML = `
      <img src="${item.image_url}" alt="${item.caption}" class="w-full h-32 object-cover">
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
        <button onclick="deleteGalleryImage(${item.id})" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-bold">Delete</button>
      </div>
      <p class="text-xs p-2 text-stone-600 line-clamp-2">${item.caption}</p>
    `;
    container.appendChild(div);
  });
}

function openAddGalleryModal() {
  document.getElementById('gallery-form').reset();
  document.getElementById('gallery-modal').classList.remove('hidden');
}

async function saveGalleryImage(event) {
  event.preventDefault();
  
  try {
    const imageFile = document.getElementById('gal-image-file').files[0];
    let imageUrl = document.getElementById('gal-image-url').value;
    
    if (imageFile) {
      imageUrl = await uploadGalleryImage(imageFile);
    }
    
    await addGalleryImageToDatabase({
      image_url: imageUrl,
      caption: document.getElementById('gal-caption').value,
      category: document.getElementById('gal-category').value
    });
    
    document.getElementById('gallery-modal').classList.add('hidden');
    loadGalleryTable();
  } catch (error) {
    console.error('❌ Error saving gallery image:', error);
    showNotification('❌ Failed to save gallery image', 'error');
  }
}

async function deleteGalleryImage(imageId) {
  if (!confirm('Delete this image?')) return;
  
  try {
    const client = await initSupabase();
    const { error } = await client
      .from('gallery_images')
      .delete()
      .eq('id', imageId);
    
    if (error) throw error;
    
    loadGalleryTable();
    showNotification('✅ Image deleted!', 'success');
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    showNotification('❌ Failed to delete image', 'error');
  }
}

function closeGalleryModal() {
  document.getElementById('gallery-modal').classList.add('hidden');
}

// ============================================
// ANNOUNCEMENTS
// ============================================

async function saveAnnouncement() {
  const content = document.getElementById('admin-announcement-text').value;
  
  if (!content.trim()) {
    showNotification('❌ Please enter announcement text', 'error');
    return;
  }
  
  try {
    await saveAnnouncementToDatabase(content);
    document.getElementById('admin-announcement-text').value = '';
  } catch (error) {
    console.error('❌ Error saving announcement:', error);
  }
}

// ============================================
// SHIPPING SLIDES
// ============================================

async function loadShippingTable() {
  try {
    allShippingSlides = await loadShippingSlidesWithSync();
    renderShippingTable(allShippingSlides);
  } catch (error) {
    console.error('❌ Error loading shipping slides:', error);
  }
}

function renderShippingTable(slides) {
  const container = document.getElementById('admin-shipping-slides-list');
  container.innerHTML = '';
  
  slides.forEach(slide => {
    const div = document.createElement('div');
    div.className = 'bg-white p-4 rounded-lg border';
    div.innerHTML = `
      <img src="${slide.image_url}" alt="${slide.title}" class="w-full h-24 object-cover rounded mb-2">
      <h5 class="font-bold text-stone-800">${slide.title}</h5>
      <p class="text-xs text-stone-500 mb-3">${slide.description}</p>
      <div class="flex gap-2">
        <button onclick="editShipping(${slide.id})" class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-bold flex-1">Edit</button>
        <button onclick="deleteShipping(${slide.id})" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-bold flex-1">Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function openAddShippingSlideModal() {
  document.getElementById('edit-shipping-id').value = '';
  document.getElementById('shipping-form').reset();
  document.getElementById('shipping-modal').classList.remove('hidden');
}

async function saveShippingSlide(event) {
  event.preventDefault();
  
  try {
    const client = await initSupabase();
    const imageFile = document.getElementById('ship-image-file').files[0];
    let imageUrl = document.getElementById('ship-image-url').value;
    
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }
    
    const slideData = {
      title: document.getElementById('ship-title').value,
      description: document.getElementById('ship-desc').value,
      image_url: imageUrl,
      enabled: document.getElementById('ship-enabled').value === 'true',
      position: allShippingSlides.length + 1
    };
    
    const shippingId = document.getElementById('edit-shipping-id').value;
    
    if (shippingId) {
      // Update
      const { error } = await client
        .from('shipping_slides')
        .update(slideData)
        .eq('id', parseInt(shippingId));
      
      if (error) throw error;
    } else {
      // Insert
      const { error } = await client
        .from('shipping_slides')
        .insert([slideData]);
      
      if (error) throw error;
    }
    
    document.getElementById('shipping-modal').classList.add('hidden');
    loadShippingTable();
    showNotification('✅ Shipping slide saved!', 'success');
  } catch (error) {
    console.error('❌ Error saving shipping slide:', error);
    showNotification('❌ Failed to save shipping slide', 'error');
  }
}

function editShipping(slideId) {
  const slide = allShippingSlides.find(s => s.id === slideId);
  if (!slide) return;
  
  document.getElementById('edit-shipping-id').value = slideId;
  document.getElementById('ship-title').value = slide.title;
  document.getElementById('ship-desc').value = slide.description;
  document.getElementById('ship-image-url').value = slide.image_url;
  document.getElementById('ship-enabled').value = slide.enabled ? 'true' : 'false';
  
  document.getElementById('shipping-modal').classList.remove('hidden');
}

async function deleteShipping(slideId) {
  if (!confirm('Delete this shipping slide?')) return;
  
  try {
    const client = await initSupabase();
    const { error } = await client
      .from('shipping_slides')
      .delete()
      .eq('id', slideId);
    
    if (error) throw error;
    
    loadShippingTable();
    showNotification('✅ Shipping slide deleted!', 'success');
  } catch (error) {
    console.error('❌ Error deleting shipping slide:', error);
    showNotification('❌ Failed to delete shipping slide', 'error');
  }
}

function closeShippingModal() {
  document.getElementById('shipping-modal').classList.add('hidden');
}

// ============================================
// SETTINGS / GLOBAL CONFIG
// ============================================

async function loadSettingsForm() {
  try {
    const settings = await loadSystemSettings();
    
    document.getElementById('setting-owner-name').value = settings.owner_name || 'Sushilkumar Khobare';
    document.getElementById('setting-upi').value = settings.upi_id || '7758814247';
    document.getElementById('setting-phone').value = settings.phone || '+91 7758814247';
    document.getElementById('setting-address').value = settings.address || 'Arli BK, Tuljapur, Dharashiv';
    document.getElementById('setting-tagline').value = settings.tagline || 'Pure Grains | Pure Tradition | Farm to Family';
    document.getElementById('setting-custom-qr-url').value = settings.custom_qr_url || '';
    
    document.getElementById('setting-hero-image').value = settings.hero_image_url || '';
    document.getElementById('setting-story-1').value = settings.story_img_1 || '';
    document.getElementById('setting-story-2').value = settings.story_img_2 || '';
    document.getElementById('setting-story-3').value = settings.story_img_3 || '';
    document.getElementById('setting-story-4').value = settings.story_img_4 || '';
  } catch (error) {
    console.error('❌ Error loading settings:', error);
  }
}

async function saveGlobalSettings() {
  try {
    const settings = {
      owner_name: document.getElementById('setting-owner-name').value,
      upi_id: document.getElementById('setting-upi').value,
      phone: document.getElementById('setting-phone').value,
      address: document.getElementById('setting-address').value,
      tagline: document.getElementById('setting-tagline').value,
      custom_qr_url: document.getElementById('setting-custom-qr-url').value,
      hero_image_url: document.getElementById('setting-hero-image').value,
      story_img_1: document.getElementById('setting-story-1').value,
      story_img_2: document.getElementById('setting-story-2').value,
      story_img_3: document.getElementById('setting-story-3').value,
      story_img_4: document.getElementById('setting-story-4').value
    };
    
    await saveSystemSettings(settings);
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    showNotification('❌ Failed to save settings', 'error');
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function handleProductImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('product-img-preview').src = e.target.result;
      document.getElementById('product-img-preview-container').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

function triggerProductImageUpload() {
  document.getElementById('prod-image-file').click();
}

function triggerGalleryImageUpload() {
  document.getElementById('gal-image-file').click();
}

// ============================================
// EXPORT / IMPORT BACKUP
// ============================================

async function exportSystemData() {
  try {
    const client = await initSupabase();
    
    const [products, reviews, gallery, shipping, settings] = await Promise.all([
      client.from('products').select('*'),
      client.from('customer_reviews').select('*'),
      client.from('gallery_images').select('*'),
      client.from('shipping_slides').select('*'),
      client.from('system_settings').select('*')
    ]);
    
    const backup = {
      exported_at: new Date().toISOString(),
      products: products.data || [],
      reviews: reviews.data || [],
      gallery: gallery.data || [],
      shipping: shipping.data || [],
      settings: settings.data || []
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `krishnpriya-backup-${new Date().getTime()}.json`;
    link.click();
    
    showNotification('✅ Backup exported!', 'success');
  } catch (error) {
    console.error('❌ Error exporting backup:', error);
    showNotification('❌ Failed to export backup', 'error');
  }
}

function triggerRestoreUpload() {
  document.getElementById('restore-file-input').click();
}

// ============================================
// LOAD ADMIN PANEL INITIAL DATA
// ============================================

async function loadAdminPanel() {
  switchAdminTab('products-tab');
  await loadProductsTable();
}
