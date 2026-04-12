import crypto from 'crypto';

export class LiqPay {
  constructor(publicKey, privateKey) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  /**
   * Generates data and signature for LiqPay form.
   * @param {Object} params - Payment parameters (amount, currency, description, order_id, etc.)
   * @returns {Object} { data, signature }
   */
  cnfg_generate(params) {
    if (!params.version) params.version = 3;
    if (!params.public_key) params.public_key = this.publicKey;

    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = this.str_to_sign(this.privateKey + data + this.privateKey);

    return { data, signature };
  }

  /**
   * Generates signature for a string.
   * @param {string} str - String to sign
   * @returns {string} Base64(SHA1(str))
   */
  str_to_sign(str) {
    const sha1 = crypto.createHash('sha1');
    sha1.update(str);
    return sha1.digest('base64');
  }

  /**
   * Verifies signature from LiqPay callback.
   * @param {string} data - Base64 data from LiqPay
   * @param {string} signature - Signature from LiqPay
   * @returns {boolean}
   */
  verify_signature(data, signature) {
    const expectedSignature = this.str_to_sign(this.privateKey + data + this.privateKey);
    return expectedSignature === signature;
  }

  /**
   * Decodes Base64 data from LiqPay.
   * @param {string} data - Base64 encoded JSON
   * @returns {Object} JSON object
   */
  decode_data(data) {
    try {
      return JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    } catch (e) {
      console.error('Failed to decode LiqPay data:', e);
      return null;
    }
  }
}
