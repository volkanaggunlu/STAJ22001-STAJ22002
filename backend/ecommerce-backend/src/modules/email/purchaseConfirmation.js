const nodemailer = require('nodemailer')
const logger = require('../../logger/logger')
const { GOOGLE_PURCHASE_CONFIRMATION_EMAIL, GOOGLE_PURCHASE_CONFIRMATION_EMAIL_APP_KEY } = require('../../config/environment')

const { formatImageURL } = require('../../utils/helpers')

const transporter =
    nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: GOOGLE_PURCHASE_CONFIRMATION_EMAIL,
            pass: GOOGLE_PURCHASE_CONFIRMATION_EMAIL_APP_KEY
        }
    });

async function sendPurchaseConfirmationEmail(order) {
    logger.verbose('Entering sendPurchaseConfirmationEmail')
    const shipmentTrackingLink = `https://selfyarns.com/kargo-takip?id=${order.merchant_oid}`
    // show selfyarns.com link that shows the state of the order
    const html = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>Sipariş Onayı - Self Yarns</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    margin: 0;
                    padding: 0;
                    color: #333;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .header {
                    background-color: #f4e1d2;
                    padding: 20px;
                    text-align: center;
                }
                .header img {
                    max-width: 150px;
                }
                .content {
                    padding: 20px;
                }
                .content h1 {
                    color: #d2691e;
                }
                .button-container {
                    text-align: center;
                    margin: 20px 0;
                }
                .button {
                    background-color: #d2691e;
                    color: #ffffff;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-size: 16px;
                    display: inline-block;
                }
                .button:hover {
                    background-color: #b35716;
                }
                .order-details {
                    margin-top: 20px;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 20px;
                }
                .order-details table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .order-details th, .order-details td {
                    text-align: left;
                    padding: 8px;
                    border-bottom: 1px solid #e0e0e0;
                }
                .order-details th {
                    background-color: #f4e1d2;
                    color: #333;
                }
                .footer {
                    background-color: #f4e1d2;
                    padding: 10px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                }
                .footer a {
                    color: #d2691e;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://selfyarns.com/logo.png" alt="Self Yarns Logo">
                </div>
                <div class="content">
                    <h1>Değerli ${order.name.charAt(0).toUpperCase() + order.name.slice(1)},</h1>
                    <p>Siparişiniz için teşekkür ederiz! Örgü örme kararınıza çok seviniyoruz 🥰 Siparişiniz onaylandı ve özenle hazırlanıyor!</p>
                    <div class="button-container">
                        <a href="${shipmentTrackingLink}" class="button">Kargonu Takip Et</a>
                    </div>
                    <div class="order-details">
                        <table>
                            <tr>
                                <th>Fotoğraf</th>
                                <th>Ürün</th>
                                <th>Adet</th>
                            </tr>
                            ${
                                order.cart.products.map(product => {
                                    return `
                                        <tr>
                                            <td>
                                                <img src=${formatImageURL(product.product.images.filter(image => image.isThumbnail)[0] ? product.product.images.filter(image => image.isThumbnail)[0] : product.product.images[0], product.product.slug)} 
                                                alt="Ürün Fotoğrafı" 
                                                style="width: 80px; height: auto; border-radius: 4px;">
                                            </td>
                                            <td>${product.product.name}</td>
                                            <td>${product.quantity}</td>
                                        </tr>
                                    `
                                }).join('')
                            }
                            <tr>
                                <td colspan="2" style="text-align: right;"><strong>Toplam:</strong></td>
                                <td><strong>${(order.payment_amount / 100).toFixed(2)} ₺</strong></td>
                            </tr>
                        </table>
                    </div>
                    <p>Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir. Herhangi bir şikayetiniz olursa lütfen bizimle iletişime geçmekten çekinmeyin.</p>
                    <p>İyi örmeler!</p>
                </div>
                <div class="footer">
                    <p>Self Yarns | <a href="https://selfyarns.com">www.selfyarns.com</a></p>
                    <p>İletişim: info@selftextile.com | +90 546 435 74 22</p>
                    <p>Sosyal Medya: 
                        <a href="https://www.instagram.com/selfyarns/">Instagram</a>, 
                        <a href="https://www.tiktok.com/@selforgukitleri?lang=tr-TR">TikTok</a>, 
                        <a href="https://www.youtube.com/@selfyarns">YouTube</a>, 
                        <a href="https://www.tiktok.com/@selfyarns?lang=tr-TR">Facebook</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `

    const mailOptions = {
        from: `SelfYarns <${GOOGLE_PURCHASE_CONFIRMATION_EMAIL}>`,
        to: order.email,
        subject: `SelfYarns 🧶 ${order.order_no_string} Numaralı Siparişiniz Onaylandı 🎉🥳`,
        html: html
    }

    try {
        await transporter.sendMail(mailOptions)
        order.emailSent = true;
        await order.save()
        logger.info(`Purchase confirmation email sent to ${order.email} for order ${order.order_no_string}`)
        logger.verbose('Exiting sendPurchaseConfirmationEmail')
    } catch (error) {
        throw error
    }
}

module.exports = {
    sendPurchaseConfirmationEmail
}