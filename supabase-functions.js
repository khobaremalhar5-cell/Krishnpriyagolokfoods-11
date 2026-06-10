// ============================================
// SUPABASE FUNCTIONS - Database & Storage
// ============================================

const supabase = window.supabaseClient;

// ============ ERROR HANDLER ============
function handleError(error, context) {
  console.error(`Error in ${context}:`, error);
  return null;
}

// ============ PRODUCTS ============
async function loadProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'loadProducts');
    return [];
  }
}

async function saveProduct(productId, productData) {
  try {
    if (productId) {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update({ 
          ...productData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', productId);
      if (error) throw error;
      console.log('Product updated:', productId);
    } else {
      // Insert new product
      const { error } = await supabase
        .from('products')
        .insert([{ 
          ...productData, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        }]);
      if (error) throw error;
      console.log('Product created');
    }
    return true;
  } catch (error) {
    handleError(error, 'saveProduct');
    return false;
  }
}

async function deleteProduct(productId) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (error) throw error;
    console.log('Product deleted:', productId);
    return true;
  } catch (error) {
    handleError(error, 'deleteProduct');
    return false;
  }
}

// ============ REVIEWS ============
async function loadReviews() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'loadReviews');
    return [];
  }
}

async function loadAllReviews() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'loadAllReviews');
    return [];
  }
}

async function submitReview(name, content) {
  try {
    const { error } = await supabase
      .from('reviews')
      .insert([{ 
        reviewer_name: name, 
        content: content, 
        rating: 5, 
        approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    console.log('Review submitted for approval');
    return true;
  } catch (error) {
    handleError(error, 'submitReview');
    return false;
  }
}

async function saveAdminReview(reviewId, reviewData) {
  try {
    if (reviewId) {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          ...reviewData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', reviewId);
      if (error) throw error;
      console.log('Review updated');
    } else {
      const { error } = await supabase
        .from('reviews')
        .insert([{ 
          ...reviewData, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      if (error) throw error;
      console.log('Review created');
    }
    return true;
  } catch (error) {
    handleError(error, 'saveAdminReview');
    return false;
  }
}

async function deleteReview(reviewId) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
    if (error) throw error;
    console.log('Review deleted');
    return true;
  } catch (error) {
    handleError(error, 'deleteReview');
    return false;
  }
}

// ============ ANNOUNCEMENTS ============
async function loadAnnouncement() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('content')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data?.[0]?.content || '🌾 Pure Farm Fresh Wheat, Gavran Jowar & Premium Flours delivered directly to your doorstep!';
  } catch (error) {
    handleError(error, 'loadAnnouncement');
    return '🌾 Pure Farm Fresh Wheat, Gavran Jowar & Premium Flours delivered directly to your doorstep!';
  }
}

async function saveAnnouncement(content) {
  try {
    // Deactivate all previous announcements
    await supabase
      .from('announcements')
      .update({ active: false })
      .eq('active', true);
    
    // Insert new announcement
    const { error } = await supabase
      .from('announcements')
      .insert([{ 
        content: content, 
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    console.log('Announcement published');
    return true;
  } catch (error) {
    handleError(error, 'saveAnnouncement');
    return false;
  }
}

// ============ SHIPPING SLIDES ============
async function loadShippingSlides() {
  try {
    const { data, error } = await supabase
      .from('shipping_slides')
      .select('*')
      .eq('enabled', true)
      .order('slide_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'loadShippingSlides');
    return [];
  }
}

async function loadAllShippingSlides() {
  try {
    const { data, error } = await supabase
      .from('shipping_slides')
      .select('*')
      .order('slide_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'loadAllShippingSlides');
    return [];
  }
}

async function saveShippingSlide(slideId, slideData) {
  try {
    if (slideId) {
      const { error } = await supabase
        .from('shipping_slides')
        .update({ 
          ...slideData, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', slideId);
      if (error) throw error;
      console.log('Shipping slide updated');
    } else {
      const { error } = await supabase
        .from('shipping_slides')
        .insert([{ 
          ...slideData, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      if (error) throw error;
      console.log('Shipping slide created');
    }
    return true;
  } catch (error) {
    handleError(error, 'saveShippingSlide');
    return false;
  }
}

async function deleteShippingSlide(slideId) {
  try {
    const { error } = await supabase
      .from('shipping_slides')
      .delete()
      .eq('id', slideId);
    if (error) throw error;
    console.log('Shipping slide deleted');
    return true;
  } catch (error) {
    handleError(error, 'deleteShippingSlide');
    return false;
  }
}

// ============ GALLERY ============
async function loadGalleryImages() {
  try {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, 'loadGalleryImages');
    return [];
  }
}

async function saveGalleryImage(category, imageUrl) {
  try {
    const { error } = await supabase
      .from('gallery_images')
      .insert([{ 
        category: category, 
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    console.log('Gallery image added');
    return true;
  } catch (error) {
    handleError(error, 'saveGalleryImage');
    return false;
  }
}

async function deleteGalleryImage(imageId) {
  try {
    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', imageId);
    if (error) throw error;
    console.log('Gallery image deleted');
    return true;
  } catch (error) {
    handleError(error, 'deleteGalleryImage');
    return false;
  }
}

// ============ SETTINGS ============
async function loadSettings() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    
    if (error) throw error;
    
    const settings = {};
    data.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });
    return settings;
  } catch (error) {
    handleError(error, 'loadSettings');
    return {};
  }
}

async function saveSetting(key, value) {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert([{ 
        setting_key: key, 
        setting_value: value,
        updated_at: new Date().toISOString()
      }], { onConflict: 'setting_key' });
    
    if (error) throw error;
    console.log('Setting saved:', key);
    return true;
  } catch (error) {
    handleError(error, 'saveSetting');
    return false;
  }
}

// ============ IMAGE UPLOADS (Supabase Storage) ============
async function uploadProductImage(file) {
  try {
    const fileName = `products/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    console.log('Product image uploaded:', publicUrl);
    return publicUrl;
  } catch (error) {
    handleError(error, 'uploadProductImage');
    return null;
  }
}

async function uploadShippingImage(file) {
  try {
    const fileName = `shipping/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { error } = await supabase.storage
      .from('shipping-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('shipping-images')
      .getPublicUrl(fileName);
    
    console.log('Shipping image uploaded:', publicUrl);
    return publicUrl;
  } catch (error) {
    handleError(error, 'uploadShippingImage');
    return null;
  }
}

async function uploadGalleryImage(file) {
  try {
    const fileName = `gallery/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const { error } = await supabase.storage
      .from('gallery-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(fileName);
    
    console.log('Gallery image uploaded:', publicUrl);
    return publicUrl;
  } catch (error) {
    handleError(error, 'uploadGalleryImage');
    return null;
  }
}

// ============ REAL-TIME SUBSCRIPTIONS ============
function subscribeToProducts(callback) {
  try {
    const subscription = supabase
      .from('products')
      .on('*', payload => {
        console.log('Products updated:', payload);
        callback(payload);
      })
      .subscribe();
    
    return subscription;
  } catch (error) {
    handleError(error, 'subscribeToProducts');
    return null;
  }
}

function subscribeToReviews(callback) {
  try {
    const subscription = supabase
      .from('reviews')
      .on('*', payload => {
        console.log('Reviews updated:', payload);
        callback(payload);
      })
      .subscribe();
    
    return subscription;
  } catch (error) {
    handleError(error, 'subscribeToReviews');
    return null;
  }
}

function subscribeToAnnouncements(callback) {
  try {
    const subscription = supabase
      .from('announcements')
      .on('*', payload => {
        console.log('Announcements updated:', payload);
        callback(payload);
      })
      .subscribe();
    
    return subscription;
  } catch (error) {
    handleError(error, 'subscribeToAnnouncements');
    return null;
  }
}

// ============ ADMIN AUTHENTICATION ============
function verifyAdminPassword(password) {
  const isValid = password === window.ADMIN_PASSWORD;
  if (isValid) {
    console.log('Admin authenticated');
  } else {
    console.warn('Admin authentication failed');
  }
  return isValid;
}
