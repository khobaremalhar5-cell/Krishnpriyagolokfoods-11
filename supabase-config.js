// ============================================
// SUPABASE DATABASE CONFIGURATION
// Complete replacement for Firebase
// ============================================

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // https://mmprftkkpqllemyljtjm.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_KEY'; // sb_publishable_GAxCsuByim8VxOIEyLgWZw_sPyru5i1

// ============================================
// LOAD SUPABASE CLIENT
// ============================================

async function initSupabase() {
  if (window.supabaseClient) return window.supabaseClient;
  
  const { createClient } = window.supabase;
  window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase Initialized');
  return window.supabaseClient;
}

// ============================================
// REAL-TIME PRODUCT SYNCHRONIZATION
// ============================================

async function loadProductsWithSync() {
  try {
    const client = await initSupabase();
    
    // Load initial products
    const { data: products, error } = await client
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Cache products
    localStorage.setItem('cached_products', JSON.stringify(products));
    console.log('✅ Products loaded:', products.length);
    
    // Display products
    displayProducts(products);
    
    // Subscribe to real-time changes
    setupProductSubscription();
    
    return products;
  } catch (error) {
    console.error('❌ Error loading products:', error);
    // Fallback to cached data
    const cached = localStorage.getItem('cached_products');
    if (cached) {
      displayProducts(JSON.parse(cached));
    }
  }
}

function setupProductSubscription() {
  const client = window.supabaseClient;
  
  client
    .channel('public:products')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        console.log('📡 Real-time product update:', payload);
        
        // Invalidate cache and reload
        localStorage.removeItem('cached_products');
        loadProductsWithSync();
        
        // Notify all users
        showNotification('Products updated! Refreshing...', 'success');
      }
    )
    .subscribe();
}

// ============================================
// ADMIN PRODUCT SAVE (WITH VERIFICATION)
// ============================================

async function saveProductToDatabase(productData) {
  try {
    const client = await initSupabase();
    
    console.log('📤 Saving product:', productData);
    
    let result;
    
    if (productData.id) {
      // UPDATE existing product
      result = await client
        .from('products')
        .update(productData)
        .eq('id', productData.id)
        .select();
    } else {
      // INSERT new product
      result = await client
        .from('products')
        .insert([productData])
        .select();
    }
    
    if (result.error) throw result.error;
    
    console.log('✅ Product saved successfully:', result.data[0]);
    
    // Verify write
    await verifyProductWrite(result.data[0].id);
    
    // Invalidate cache
    localStorage.removeItem('cached_products');
    
    return result.data[0];
  } catch (error) {
    console.error('❌ Error saving product:', error);
    showNotification('❌ Failed to save product: ' + error.message, 'error');
    throw error;
  }
}

async function verifyProductWrite(productId) {
  try {
    const client = await initSupabase();
    
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) throw error;
    
    console.log('✅ Verified: Product exists in database:', data);
    showNotification('✅ Product saved and verified!', 'success');
    
    return data;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    showNotification('⚠️ Warning: Could not verify save', 'warning');
  }
}

// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProductFromDatabase(productId) {
  try {
    const client = await initSupabase();
    
    const { error } = await client
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
    
    console.log('✅ Product deleted:', productId);
    localStorage.removeItem('cached_products');
    
    showNotification('✅ Product deleted!', 'success');
    return true;
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    showNotification('❌ Failed to delete product', 'error');
    throw error;
  }
}

// ============================================
// REVIEWS - REAL-TIME SYNC
// ============================================

async function loadReviewsWithSync() {
  try {
    const client = await initSupabase();
    
    const { data: reviews, error } = await client
      .from('customer_reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    localStorage.setItem('cached_reviews', JSON.stringify(reviews));
    displayReviews(reviews);
    setupReviewSubscription();
    
    return reviews;
  } catch (error) {
    console.error('❌ Error loading reviews:', error);
    const cached = localStorage.getItem('cached_reviews');
    if (cached) displayReviews(JSON.parse(cached));
  }
}

function setupReviewSubscription() {
  const client = window.supabaseClient;
  
  client
    .channel('public:reviews')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'customer_reviews' },
      () => {
        console.log('📡 Reviews updated');
        localStorage.removeItem('cached_reviews');
        loadReviewsWithSync();
      }
    )
    .subscribe();
}

async function submitReviewToDatabase(reviewData) {
  try {
    const client = await initSupabase();
    
    const { data, error } = await client
      .from('customer_reviews')
      .insert([{
        name: reviewData.name,
        content: reviewData.content,
        rating: reviewData.rating || 5,
        approved: false,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    console.log('✅ Review submitted:', data[0]);
    localStorage.removeItem('cached_reviews');
    
    showNotification('✅ Review submitted! Awaiting approval.', 'success');
    return data[0];
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    showNotification('❌ Failed to submit review', 'error');
    throw error;
  }
}

// ============================================
// GALLERY - REAL-TIME SYNC
// ============================================

async function loadGalleryWithSync() {
  try {
    const client = await initSupabase();
    
    const { data: gallery, error } = await client
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    localStorage.setItem('cached_gallery', JSON.stringify(gallery));
    displayGallery(gallery);
    setupGallerySubscription();
    
    return gallery;
  } catch (error) {
    console.error('❌ Error loading gallery:', error);
    const cached = localStorage.getItem('cached_gallery');
    if (cached) displayGallery(JSON.parse(cached));
  }
}

function setupGallerySubscription() {
  const client = window.supabaseClient;
  
  client
    .channel('public:gallery')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'gallery_images' },
      () => {
        console.log('📡 Gallery updated');
        localStorage.removeItem('cached_gallery');
        loadGalleryWithSync();
      }
    )
    .subscribe();
}

async function addGalleryImageToDatabase(imageData) {
  try {
    const client = await initSupabase();
    
    const { data, error } = await client
      .from('gallery_images')
      .insert([{
        image_url: imageData.image_url,
        caption: imageData.caption,
        category: imageData.category,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    localStorage.removeItem('cached_gallery');
    showNotification('✅ Gallery image added!', 'success');
    
    return data[0];
  } catch (error) {
    console.error('❌ Error adding gallery image:', error);
    showNotification('❌ Failed to add gallery image', 'error');
    throw error;
  }
}

// ============================================
// ANNOUNCEMENTS - REAL-TIME SYNC
// ============================================

async function loadAnnouncementWithSync() {
  try {
    const client = await initSupabase();
    
    const { data: announcement, error } = await client
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (announcement) {
      localStorage.setItem('cached_announcement', JSON.stringify(announcement));
      displayAnnouncement(announcement.content);
    }
    
    setupAnnouncementSubscription();
    return announcement;
  } catch (error) {
    console.error('❌ Error loading announcement:', error);
  }
}

function setupAnnouncementSubscription() {
  const client = window.supabaseClient;
  
  client
    .channel('public:announcements')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'announcements' },
      (payload) => {
        console.log('📡 New announcement:', payload);
        localStorage.removeItem('cached_announcement');
        loadAnnouncementWithSync();
      }
    )
    .subscribe();
}

async function saveAnnouncementToDatabase(content) {
  try {
    const client = await initSupabase();
    
    // Set all others to inactive
    await client
      .from('announcements')
      .update({ active: false })
      .eq('active', true);
    
    // Insert new announcement
    const { data, error } = await client
      .from('announcements')
      .insert([{
        content,
        active: true,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    
    localStorage.removeItem('cached_announcement');
    showNotification('✅ Announcement published!', 'success');
    
    return data[0];
  } catch (error) {
    console.error('❌ Error saving announcement:', error);
    showNotification('❌ Failed to save announcement', 'error');
    throw error;
  }
}

// ============================================
// SHIPPING SLIDES - REAL-TIME SYNC
// ============================================

async function loadShippingSlidesWithSync() {
  try {
    const client = await initSupabase();
    
    const { data: slides, error } = await client
      .from('shipping_slides')
      .select('*')
      .eq('enabled', true)
      .order('position', { ascending: true });
    
    if (error) throw error;
    
    localStorage.setItem('cached_shipping', JSON.stringify(slides));
    setupShippingCarousel(slides);
    setupShippingSubscription();
    
    return slides;
  } catch (error) {
    console.error('❌ Error loading shipping slides:', error);
    const cached = localStorage.getItem('cached_shipping');
    if (cached) setupShippingCarousel(JSON.parse(cached));
  }
}

function setupShippingSubscription() {
  const client = window.supabaseClient;
  
  client
    .channel('public:shipping')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'shipping_slides' },
      () => {
        console.log('📡 Shipping slides updated');
        localStorage.removeItem('cached_shipping');
        loadShippingSlidesWithSync();
      }
    )
    .subscribe();
}

// ============================================
// SYSTEM SETTINGS
// ============================================

async function loadSystemSettings() {
  try {
    const client = await initSupabase();
    
    const { data: settings, error } = await client
      .from('system_settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    localStorage.setItem('cached_settings', JSON.stringify(settings || {}));
    return settings || {};
  } catch (error) {
    console.error('❌ Error loading settings:', error);
    const cached = localStorage.getItem('cached_settings');
    return cached ? JSON.parse(cached) : {};
  }
}

async function saveSystemSettings(settings) {
  try {
    const client = await initSupabase();
    
    const { data: existing } = await client
      .from('system_settings')
      .select('id')
      .single();
    
    let result;
    if (existing?.id) {
      result = await client
        .from('system_settings')
        .update(settings)
        .eq('id', existing.id)
        .select();
    } else {
      result = await client
        .from('system_settings')
        .insert([settings])
        .select();
    }
    
    if (result.error) throw result.error;
    
    localStorage.removeItem('cached_settings');
    showNotification('✅ Settings saved!', 'success');
    
    return result.data[0];
  } catch (error) {
    console.error('❌ Error saving settings:', error);
    showNotification('❌ Failed to save settings', 'error');
    throw error;
  }
}

// ============================================
// FILE UPLOADS WITH VERIFICATION
// ============================================

async function uploadProductImage(file) {
  try {
    const client = await initSupabase();
    const fileName = `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
    
    const { data, error } = await client
      .storage
      .from('product-images')
      .upload(fileName, file, { upsert: true, cacheControl: '0' });
    
    if (error) throw error;
    
    const { data: publicData } = client
      .storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    console.log('✅ Image uploaded:', publicData.publicUrl);
    return publicData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    showNotification('❌ Failed to upload image', 'error');
    throw error;
  }
}

async function uploadGalleryImage(file) {
  try {
    const client = await initSupabase();
    const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.name.split('.').pop()}`;
    
    const { data, error } = await client
      .storage
      .from('gallery-images')
      .upload(fileName, file, { upsert: true, cacheControl: '0' });
    
    if (error) throw error;
    
    const { data: publicData } = client
      .storage
      .from('gallery-images')
      .getPublicUrl(fileName);
    
    return publicData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading gallery image:', error);
    throw error;
  }
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================

function showNotification(message, type = 'info') {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `${icon} ${message}`;
  toast.className = `fixed bottom-6 right-6 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[9999] border max-w-sm ${
    type === 'error' ? 'bg-red-600 text-white border-red-700' :
    type === 'success' ? 'bg-green-600 text-white border-green-700' :
    'bg-stone-900 text-white border-stone-800'
  }`;
  
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 4000);
}

// ============================================
// AUTO-INITIALIZE
// ============================================

window.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing Supabase Database System...');
  await initSupabase();
  await loadProductsWithSync();
  await loadReviewsWithSync();
  await loadGalleryWithSync();
  await loadShippingSlidesWithSync();
  await loadAnnouncementWithSync();
  console.log('✅ All systems synchronized and ready!');
});
