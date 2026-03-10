const QRCode = require('qrcode');

/**
 * Generate a QR code as a Base64 PNG data URL.
 * @param {string} url
 * @returns {Promise<string>} data:image/png;base64,...
 */
const generateQR = async (url) => {
    try {
        return await QRCode.toDataURL(url, {
            errorCorrectionLevel: 'M',
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' },
            width: 300,
        });
    } catch (err) {
        console.error('QR generation error:', err);
        return null;
    }
};

module.exports = { generateQR };
