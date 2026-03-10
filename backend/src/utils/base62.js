const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = 62;

/**
 * Encode a positive integer to a Base62 string.
 * @param {number} num
 * @returns {string}
 */
const encode = (num) => {
    if (num === 0) return CHARS[0];
    let result = '';
    while (num > 0) {
        result = CHARS[num % BASE] + result;
        num = Math.floor(num / BASE);
    }
    return result;
};

/**
 * Decode a Base62 string back to a positive integer.
 * @param {string} str
 * @returns {number}
 */
const decode = (str) => {
    let result = 0;
    for (const char of str) {
        result = result * BASE + CHARS.indexOf(char);
    }
    return result;
};

module.exports = { encode, decode };
