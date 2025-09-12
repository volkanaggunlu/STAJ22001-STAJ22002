const cron = require('node-cron');
const Product = require('../../models/Product');
const logger = require('../../logger/logger');

// Schedule tasks to be run on the server.
cron.schedule('0 3 * * *', async () => {
  try {
    const products = await Product.find({ enabled: true, type: 'simple' });

    // generate random integers for each product from 1 to 15 for fake stock
    const fakeStocks = products.map(product => ({ name: product.name, fakeStock: !(product.slug === "hediye-paketi" || product.slug === "kedi-otu") ? Math.floor(Math.random() * 15) + 1 : 9999 }));

    // Update all products with fake stock
    await Promise.all(products.map((product, i) => {
      return Product.findByIdAndUpdate(product._id, { fakeStock: fakeStocks[i].fakeStock });
    }));

    logger.info('Stock reset at 3:00 AM, new stocks:' + JSON.stringify(fakeStocks));
  } catch (error) {
    console.error('Error resetting stock:', error);
  }
}, {
  timezone: 'Turkey'
});
