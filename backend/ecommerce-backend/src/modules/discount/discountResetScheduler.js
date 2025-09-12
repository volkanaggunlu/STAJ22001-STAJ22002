// PRETTY MUCH USELESS, SINCE IN THE FRONTEND THERE IS CODE THAT ALWAYS GIVES 2 MORE HOURS OF DISCOUNT...
// IF USER'S DISCOUNT ENDS AND THEY NEVER ENTER THE SITE THAT DAY, IT WILL RESET TO START THOUGH

const cron = require('node-cron');
const DiscountTimer = require('../../models/discountTimer');
const logger = require('../../logger/logger');

// Schedule tasks to be run on the server.
cron.schedule('0 0 * * *', async () => {
  try {
    await DiscountTimer.deleteMany({ endLastDiscount: { $lt: new Date() } });
    logger.info('Expired discounts reset at 00.00:'
    );
  } catch (error) {
    console.error('Error resetting discounts:', error);
  }
}, {
  timezone: 'Turkey'
});