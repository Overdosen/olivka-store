/**
 * Checkbox Service for Olivka Store
 * Handles fiscalization using Checkbox.ua API
 */
class CheckboxService {
  constructor() {
    this.baseUrl = process.env.CHECKBOX_API_URL || 'https://api.checkbox.ua/api/v1';
    this.login = process.env.CHECKBOX_LOGIN;
    this.password = process.env.CHECKBOX_PASSWORD;
    this.licenseKey = process.env.CHECKBOX_LICENSE_KEY;
    this.cashierName = process.env.CHECKBOX_CASHIER_NAME || 'ФОП';
    this.token = null;
  }

  /**
   * Authorize cashier and get token
   */
  async authenticate() {
    try {
      const response = await fetch(`${this.baseUrl}/cashier/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: this.login,
          password: this.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Checkbox Authentication Failed');
      }

      this.token = data.access_token;
      return this.token;
    } catch (error) {
      console.error('[Checkbox] Auth Error:', error.message);
      throw error;
    }
  }

  /**
   * Get common headers for API calls
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      'X-License-Key': this.licenseKey,
    };
  }

  /**
   * Check current shift status and open if closed
   */
  async ensureShiftOpened() {
    try {
      if (!this.token) await this.authenticate();

      // Check current shift
      const res = await fetch(`${this.baseUrl}/shifts/current`, {
        headers: this.getHeaders(),
      });

      if (res.status === 404) {
        // No current shift, need to open
        return await this.openShift();
      }

      const shiftData = await res.json();
      
      if (shiftData.status === 'CLOSED') {
        return await this.openShift();
      }

      if (shiftData.status === 'OPENING') {
        // Wait a bit and check again? 
        // For simplicity, we assume if it's opening, it will be ready soon.
        // But better to poll or just continue.
        return shiftData;
      }

      return shiftData;
    } catch (error) {
      console.error('[Checkbox] Shift Check Error:', error.message);
      throw error;
    }
  }

  /**
   * Open a new shift
   */
  async openShift() {
    console.log('[Checkbox] Opening new shift...');
    const response = await fetch(`${this.baseUrl}/shifts`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to open Checkbox shift');
    }

    // Note: status will be 'OPENING' initially. 
    // Checkbox usually handles receipts even if it's 'OPENING'.
    return data;
  }

  /**
   * Create a fiscal receipt
   * @param {Object} order - Order data from Supabase
   * @returns {Object} - Checkbox API response
   */
  async createReceipt(order) {
    try {
      await this.ensureShiftOpened();

      const { items, email, full_name, total } = order;

      // Map items to Checkbox goods
      const goods = items.map(item => ({
        good: {
          code: item.sku || `p-${item.product_id}`,
          name: `${item.name}${item.size ? ` (р. ${item.size})` : ''}`,
          price: Math.round(item.price * 100), // in kopecks
        },
        quantity: Math.round(item.qty * 1000), // in thousands (1.000 = 1000)
      }));

      // Map payment
      const body = {
        goods,
        payments: [
          {
            type: 'CASHLESS', // For LiqPay
            value: Math.round(total * 100), // in kopecks
          }
        ],
        cashier_name: this.cashierName,
        delivery: {
          email: email
        }
      };

      const response = await fetch(`${this.baseUrl}/receipts/sell`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[Checkbox] Receipt Creation Error:', result);
        throw new Error(result.message || 'Failed to create receipt');
      }

      console.log('[Checkbox] Receipt created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[Checkbox] Create Receipt Error:', error.message);
      throw error;
    }
  }
}

export const checkboxService = new CheckboxService();
