// This is pretty much the documentation for now.
// If some test fails, check if the createdProduct (its slug is "test-product") still exists in the database. If it does, delete it manually and if it doesn't run the tests again. If the tests still fail, check the logs for more information.

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URI = process.env.TEST_BASE_URL || 'http://localhost:8888';

let _product = {}; // This will be set when a product is created by tests
let _productId = ''; // This will be set when a product is created by tests
let ADMIN_TOKEN = ''; // This will be set with the login on the beforeAll hook
let session_id = ''; // This will be set when a session is created by tests
let headers = {} // This will be set with the login on the beforeAll hook
beforeAll(async () => {
  // Wait for the server to be ready
  await waitForServer();
  const res = await axios.post(`${BASE_URI}/api/auth/login`, {
    // These credentials are an admin user's credentials
    email: 'qusdfsta@gmail.com',
    password: '123asd21.'
  });
  ADMIN_TOKEN = res.data.token;
  const res2 = await axios.get(`${BASE_URI}/api/cart`, {
    headers: {
      'Authorization': 'Bearer ' + ADMIN_TOKEN
    }
  });
  session_id = res2.data._id;

  headers = {
    'Authorization': 'Bearer ' + ADMIN_TOKEN,
    'Cookie': 'session_id=' + session_id
  }
});

describe('API tests', () => {
  // AUTH TESTS
  // login
  it('GET /api/auth/login should return a user', async () => {
    // ADMIN_TOKEN must be a valid token
    expect(ADMIN_TOKEN).toBeTruthy();
  });
  // shared function to create a test product
  const createTestProduct = async () => {
    try {
      const formData = new FormData();
      formData.append('name', 'Test Product');
      formData.append('price', '99.99');
      formData.append('categories', JSON.stringify([{category: 'test', rank: 1}]));
      const filePath = path.join(__dirname, '../files/portlek-tavsan.jpg');
      const file = fs.readFileSync(filePath);
      const blob = new Blob([file], { type: 'image/jpeg' }); // Create a Blob object
      formData.append('images', blob, 'portlek-tavsan.jpg');

      const res = await axios.post(`${BASE_URI}/api/products`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      _productId = res.data.product._id;
      _product = res.data.product;


      return res;
    } catch (error) {
      console.error('Error creating test product. Probably the product already exists. Try logging the error if you think this error happens because something is broken.');
      // console.error(error);
    }


  };

  // shared function to delete a test product
  const deleteTestProductBySlug = async () => {
    const res = await axios.delete(`${BASE_URI}/api/products/slug/test-product`, {
      headers: {
        ...headers,
      }
    });
    return res;
  };

  // PRODUCTS TESTS
  // creating products - DOES NOT WORK RIGHT NOW BECAUSE OF THE IMAGE UPLOAD (NEEDS FORM DATA, SENDS JSON)
  it('POST /api/products should create a product with valid token', async () => {
    const res = await createTestProduct();
    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('product');
    expect(res.data.product.name).toBe('Test Product');
    expect(res.data.product.slug).toBe('test-product');
    _productId = res.data.product._id;
  });

  // getting products
  it('GET /api/products/id/:id should return a single product', async () => {
    const res = await axios.get(`${BASE_URI}/api/products/id/${_productId}`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('product.name');
  });

  it('GET /api/products should return all products', async () => {
    const res = await axios.get(`${BASE_URI}/api/products`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('products');
    expect(Array.isArray(res.data.products)).toBeTruthy();
  });

  it('GET /api/products/slug/:slug should return a single product', async () => {
    const res = await axios.get(`${BASE_URI}/api/products/slug/portlek-tavsan`);
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('product.name');
  });


  // deleting products
  it('DELETE /api/products/id/:id should delete a product with valid token', async () => {
    const res = await axios.delete(`${BASE_URI}/api/products/id/${_productId}`, {
      headers: {
        ...headers,
      }
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('product');
    expect(res.data.product._id).toBe(_productId);
  });


  it('DELETE /api/products/slug/:slug should delete a product with valid token', async () => {
    let product;
    try {
      product = await axios.get(`${BASE_URI}/api/products/slug/test-product`);
    } catch (error) {
      // test-product does not exist, create it
      if (product?.data?.product?.slug !== 'test-product') {
        await createTestProduct();
      }
    }

    const res = await axios.delete(`${BASE_URI}/api/products/slug/test-product`, {
      headers: {
        ...headers,
      }
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('product');
    expect(res.data.product.slug).toBe('test-product');
  });

  // CART TESTS
  // getting cart
  it('GET /api/cart should return a cart', async () => {
    const res = await axios.get(`${BASE_URI}/api/cart`, {
      headers: {
        ...headers,
      }
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('products');
  });

  // adding a product to cart
  it('POST /api/cart should add a product to cart', async () => {
    await createTestProduct();

    const res = await axios.post(`${BASE_URI}/api/cart`, {
      productId: _productId,
      quantity: 1
    }, {
      headers: {
        ...headers,
      }
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('products');
    expect(res.data.products.length).toBe(1); // might fail if there are more than 1 product in cart left in there somehow
  });

  // removing a product completely from cart
  it('DELETE /api/cart:productId should remove a product from cart', async () => {
    const res = await axios.delete(`${BASE_URI}/api/cart/${JSON.stringify(_product)}`, {
      headers: {
        ...headers,
      },
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('products');
  });

  // updating quantity of a product in cart
  it('PUT /api/cart:productId should update quantity of a product in cart', async () => {
    await axios.post(`${BASE_URI}/api/cart`, {
      productId: _productId,
      quantity: 1
    }, {
      headers: {
        ...headers,
      }
    });

    const res = await axios.put(`${BASE_URI}/api/cart/${_productId}`, {
      quantity: 4
    }, {
      headers: {
        ...headers,
      }
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('products');
    expect(res.data.products.length).toBe(1); // might fail if there are more than 1 product in cart left in there somehow
    expect(res.data.products[0].quantity).toBe(4);
  });

  // clearing cart
  it('DELETE /api/cart should clear the cart', async () => {
    const res = await axios.delete(`${BASE_URI}/api/cart`, {
      headers: {
        ...headers,
      }
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('products');
    expect(res.data.products.length).toBe(0);

  });

  // IMAGE TESTS
  // add an image to a product
  it('POST /api/products/images/:slug should add an image to a product', async () => {
    await createTestProduct();

    const file = new File([new Blob()], 'portlek-tavsan.jpg');
    const formData = new FormData();
    formData.append('image', file);

    const res = await axios.post(`${BASE_URI}/api/products/images/test-product`, formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data'
      }
    });

    expect(res.status).toBe(200);
    expect(res.data?.images[0]).toHaveProperty('url');
  });

  // get an image of a product
  it('GET /product-images/:slug/:filename should return an image', async () => {
    const res = await axios.get(`${BASE_URI}/api/product-images/portlek-tavsan/portlek-tavsan.jpg`);
    expect(res.status).toBe(200);

    // Check if the response is an image
    const contentType = res.headers['content-type'];
    expect(contentType).toMatch(/^image/);


    deleteTestProductBySlug(); // Clean up the test product. Keep it at the end of the last test.
  });
});

// More than 5 retries don't work because of the 5000ms limit for hook timeouts
async function waitForServer(retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await axios.get(`${BASE_URI}/api/products`);
      console.log('Server is ready');
      return;
    } catch (error) {
      console.log(`Attempt ${i + 1}: Server not ready, retrying in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Server did not become ready in time. Check whether container and node server in it is running and healthy.');
}

