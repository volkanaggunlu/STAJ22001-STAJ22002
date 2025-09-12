// Admin API Endpoint Test Script
// Bu script admin panel için gereken API endpoint'lerinin hangilerinin mevcut olduğunu kontrol eder

const endpoints = [
  // Dashboard Endpoints
  {
    name: 'Dashboard Stats',
    method: 'GET',
    url: '/api/admin/dashboard/stats',
    description: 'Dashboard istatistikleri (toplam ürün, kullanıcı, sipariş, satış, vs.)',
    required: true
  },

  // Admin Users Management
  {
    name: 'Admin Users List',
    method: 'GET', 
    url: '/api/admin/users',
    description: 'Kullanıcı listesi (sayfalama, arama, filtreleme)',
    required: true
  },

  // Admin Products Management
  {
    name: 'Admin Products List',
    method: 'GET',
    url: '/api/admin/products',
    description: 'Ürün listesi (sayfalama, arama, kategori filtresi)',
    required: true
  },
  {
    name: 'Top Selling Products',
    method: 'GET',
    url: '/api/admin/products/top-selling',
    description: 'En çok satan ürünler listesi',
    required: true
  },

  // Admin Orders Management  
  {
    name: 'Admin Orders List',
    method: 'GET',
    url: '/api/admin/orders',
    description: 'Sipariş listesi (sayfalama, durum filtresi, tarih aralığı)',
    required: true
  },

  // Analytics Endpoints
  {
    name: 'Sales Analytics',
    method: 'GET',
    url: '/api/admin/analytics/sales',
    description: 'Satış analitikleri (chart verileri, trend analizi)',
    required: true
  },
  {
    name: 'Category Distribution',
    method: 'GET',
    url: '/api/admin/analytics/categories', 
    description: 'Kategori dağılım analitikleri (pie chart için)',
    required: true
  },

  // Admin Settings
  {
    name: 'Admin Settings',
    method: 'GET',
    url: '/api/admin/settings',
    description: 'Admin panel ayarları',
    required: false
  },

  // Product Management (CRUD Operations)
  {
    name: 'Create Product',
    method: 'POST',
    url: '/api/admin/products',
    description: 'Yeni ürün oluşturma',
    required: true
  },
  {
    name: 'Update Product',
    method: 'PUT',
    url: '/api/admin/products/:id',
    description: 'Ürün güncelleme',
    required: true
  },
  {
    name: 'Update Product Status',
    method: 'PUT',
    url: '/api/admin/products/:id/status',
    description: 'Ürün durumu değiştirme (active, inactive, discontinued)',
    required: true
  },
  {
    name: 'Delete Product',
    method: 'DELETE',
    url: '/api/admin/products/:id',
    description: 'Ürün silme',
    required: true
  },

  // User Management
  {
    name: 'Update User Role',
    method: 'PUT',
    url: '/api/admin/users/:id/role',
    description: 'Kullanıcı rol değiştirme',
    required: true
  },
  {
    name: 'Deactivate User',
    method: 'PUT',
    url: '/api/admin/users/:id/deactivate',
    description: 'Kullanıcı deaktifleştirme',
    required: true
  },

  // Order Management
  {
    name: 'Update Order Status',
    method: 'PUT',
    url: '/api/admin/orders/:id/status',
    description: 'Sipariş durumu güncelleme',
    required: true
  },
  {
    name: 'Add Tracking Number',
    method: 'PUT',
    url: '/api/admin/orders/:id/tracking',
    description: 'Kargo takip numarası ekleme',
    required: true
  },

  // Category Management
  {
    name: 'Admin Categories List',
    method: 'GET',
    url: '/api/admin/categories',
    description: 'Kategori yönetimi listesi',
    required: true
  },
  {
    name: 'Create Category',
    method: 'POST',
    url: '/api/admin/categories',
    description: 'Yeni kategori oluşturma',
    required: true
  },
  {
    name: 'Update Category',
    method: 'PUT',
    url: '/api/admin/categories/:id',
    description: 'Kategori güncelleme',
    required: true
  },
  {
    name: 'Delete Category',
    method: 'DELETE',
    url: '/api/admin/categories/:id',
    description: 'Kategori silme (soft delete)',
    required: true
  },

  // Review Management
  {
    name: 'Admin Reviews List',
    method: 'GET',
    url: '/api/admin/reviews',
    description: 'Yorum listesi ve moderasyon',
    required: true
  },
  {
    name: 'Approve Review',
    method: 'PUT',
    url: '/api/admin/reviews/:id/approve',
    description: 'Yorum onaylama',
    required: true
  },
  {
    name: 'Reject Review',
    method: 'PUT',
    url: '/api/admin/reviews/:id/reject',
    description: 'Yorum reddetme',
    required: true
  },

  // Coupon Management
  {
    name: 'Admin Coupons List',
    method: 'GET',
    url: '/api/admin/coupons',
    description: 'Kupon listesi',
    required: false
  },
  {
    name: 'Create Coupon',
    method: 'POST',
    url: '/api/admin/coupons',
    description: 'Yeni kupon oluşturma',
    required: false
  },

  // Payment Management
  {
    name: 'Admin Payments List',
    method: 'GET',
    url: '/api/admin/payments',
    description: 'Ödeme işlemleri listesi',
    required: true
  },
  {
    name: 'Approve Bank Transfer',
    method: 'PUT',
    url: '/api/admin/payments/:id/approve',
    description: 'Havale/EFT ödeme onaylama',
    required: true
  },

  // File Upload
  {
    name: 'Upload Product Image',
    method: 'POST',
    url: '/api/admin/upload/product-images',
    description: 'Ürün resmi yükleme',
    required: true
  },

  // Reports
  {
    name: 'Sales Report',
    method: 'GET',
    url: '/api/admin/reports/sales',
    description: 'Satış raporları (PDF/Excel)',
    required: false
  },
  {
    name: 'Product Performance Report',
    method: 'GET',
    url: '/api/admin/reports/products',
    description: 'Ürün performans raporları',
    required: false
  }
];

// Test function
async function testEndpoint(endpoint) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const testUrl = endpoint.url.replace(':id', '1'); // Replace :id with test ID
    
    const response = await fetch(`${baseUrl}${testUrl}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add admin auth token here if needed
        // 'Authorization': 'Bearer ' + token
      }
    });

    return {
      ...endpoint,
      status: response.status,
      exists: response.status !== 404,
      working: response.status < 400 || response.status === 401 || response.status === 403, // 401/403 means auth issue but endpoint exists
      needsAuth: response.status === 401 || response.status === 403
    };
  } catch (error) {
    return {
      ...endpoint,
      status: 'ERROR',
      exists: false,
      working: false,
      error: error.message
    };
  }
}

// Main test function
async function testAllEndpoints() {
  console.log('🔍 Admin API Endpoint Test Başlıyor...\n');
  
  const results = [];
  const missingEndpoints = [];
  const workingEndpoints = [];
  const authRequiredEndpoints = [];
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name}`);
    console.log(`  ${endpoint.method} ${endpoint.url}`);
    
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Log detailed result
    if (result.status === 'ERROR') {
      console.log(`  ❌ ERROR: ${result.error}`);
    } else {
      const statusIcon = result.working ? '✅' : '❌';
      const authNote = result.needsAuth ? ' (Auth Required)' : '';
      console.log(`  ${statusIcon} Status: ${result.status}${authNote}`);
    }
    
    // Categorize results
    if (!result.exists && result.required) {
      missingEndpoints.push(result);
    } else if (result.working) {
      workingEndpoints.push(result);
      if (result.needsAuth) {
        authRequiredEndpoints.push(result);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Rate limiting - wait between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Results summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SONUÇLARI:');
  console.log('='.repeat(50));
  console.log(`✅ Çalışan endpoint'ler: ${workingEndpoints.length}`);
  console.log(`🔐 Auth gerektiren endpoint'ler: ${authRequiredEndpoints.length}`);
  console.log(`❌ Eksik zorunlu endpoint'ler: ${missingEndpoints.length}`);
  console.log(`⚠️  Toplam test edilen: ${results.length}`);
  
  // Working endpoints details
  if (workingEndpoints.length > 0) {
    console.log('\n✅ ÇALIŞAN ENDPOINT\'LER:');
    workingEndpoints.forEach(endpoint => {
      const authNote = endpoint.needsAuth ? ' 🔐' : ' ✨';
      console.log(`  ${endpoint.method} ${endpoint.url}${authNote}`);
    });
  }
  
  // Missing endpoints details
  if (missingEndpoints.length > 0) {
    console.log('\n❌ EKSİK ZORUNLU ENDPOINT\'LER:');
    missingEndpoints.forEach(endpoint => {
      console.log(`  ${endpoint.method} ${endpoint.url}`);
      console.log(`    └─ ${endpoint.description}`);
    });
  }
  
  // Summary for dashboard
  const dashboardEndpoints = workingEndpoints.filter(e => 
    e.url.includes('/dashboard/') || 
    e.url.includes('/analytics/') ||
    e.url.includes('/products/top-selling') ||
    (e.url === '/api/admin/orders' && e.method === 'GET') ||
    (e.url === '/api/admin/users' && e.method === 'GET')
  );
  
  console.log('\n📊 DASHBOARD HAZIRLIK DURUMU:');
  console.log(`Dashboard için gerekli endpoint'ler: ${dashboardEndpoints.length}/5`);
  
  if (dashboardEndpoints.length >= 3) {
    console.log('🎉 Dashboard test edilebilir durumda!');
  } else {
    console.log('⚠️  Dashboard için daha fazla endpoint gerekli');
  }
  
  return {
    total: results.length,
    working: workingEndpoints.length,
    missing: missingEndpoints.length,
    authRequired: authRequiredEndpoints.length,
    dashboardReady: dashboardEndpoints.length >= 3,
    missingEndpoints,
    workingEndpoints,
    allResults: results
  };
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAllEndpoints, endpoints };
} else {
  // Browser environment - attach to window
  window.testAdminEndpoints = testAllEndpoints;
}

// If running directly
if (typeof require !== 'undefined' && require.main === module) {
  testAllEndpoints().then(results => {
    console.log('\n📝 Test tamamlandı!');
    if (results.dashboardReady) {
      console.log('🚀 Admin panel dashboard\'u test etmeye hazır!');
    }
    process.exit(0);
  });
} 