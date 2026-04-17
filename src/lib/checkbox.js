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
    console.log(`[Checkbox] Authenticating with ${this.baseUrl}...`);
    try {
      const response = await fetch(`${this.baseUrl}/cashier/signin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-License-Key': this.licenseKey,
        },
        body: JSON.stringify({
          login: this.login,
          password: this.password,
        }),
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Checkbox] Auth Failed Status:', response.status);
        console.error('[Checkbox] Auth Error Response:', JSON.stringify(data, null, 2));
        throw new Error(data.message || `Checkbox Authentication Failed: ${response.status}`);
      }

      this.token = data.access_token;
      console.log('[Checkbox] Authentication successful.');
      return this.token;
    } catch (error) {
      console.error('[Checkbox] Auth Exception:', error.message);
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
        console.log('[Checkbox] No current shift found (404). Opening...');
        return await this.openShiftAndWait();
      }

      const shiftData = await res.json();
      console.log('[Checkbox] Current shift status:', shiftData.status);
      
      if (shiftData.status === 'CLOSED' || !shiftData.status) {
        console.log('[Checkbox] Shift is closed. Opening...');
        return await this.openShiftAndWait();
      }

      // If shift is still OPENING — wait for it to become OPENED
      if (shiftData.status === 'OPENING') {
        console.log('[Checkbox] Shift is OPENING. Waiting for it to become OPENED...');
        return await this.waitForShiftOpened(shiftData.id);
      }

      return shiftData;
    } catch (error) {
      console.error('[Checkbox] Shift Check Error:', error.message);
      throw error;
    }
  }

  /**
   * Open a new shift and wait until it becomes OPENED
   */
  async openShiftAndWait() {
    console.log('[Checkbox] Opening new shift...');
    const response = await fetch(`${this.baseUrl}/shifts`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Checkbox] Open Shift Error Response:', data);
      throw new Error(data.message || `Failed to open Checkbox shift: ${response.status}`);
    }

    console.log('[Checkbox] Shift opened with status:', data.status);

    // If already OPENED — great, return immediately
    if (data.status === 'OPENED') return data;

    // Otherwise poll until OPENED (Checkbox API takes 2-5 seconds)
    return await this.waitForShiftOpened(data.id);
  }

  /**
   * Poll shift status until it becomes OPENED (max 15 seconds)
   */
  async waitForShiftOpened(shiftId) {
    const maxAttempts = 10;
    const delay = 1500; // 1.5 seconds between checks

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const res = await fetch(`${this.baseUrl}/shifts/${shiftId}`, {
        headers: this.getHeaders(),
        cache: 'no-store'
      });
      const shiftData = await res.json();
      console.log(`[Checkbox] Shift poll attempt ${attempt}/${maxAttempts}: status = ${shiftData.status}`);

      if (shiftData.status === 'OPENED') {
        console.log('[Checkbox] Shift is now OPENED. Proceeding...');
        return shiftData;
      }

      if (shiftData.status === 'CLOSED' || shiftData.status === 'CLOSING') {
        throw new Error(`[Checkbox] Shift entered unexpected status: ${shiftData.status}`);
      }
    }

    throw new Error('[Checkbox] Timed out waiting for shift to become OPENED after 15 seconds');
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
      const goods = items.map(item => {
        const itemPrice = Math.round(Number(item.price) * 100);
        const itemQty = Number(item.qty);
        
        return {
          good: {
            code: item.sku || `p-${item.product_id}`,
            name: `${item.name}${item.size ? ` (р. ${item.size})` : ''}`,
            price: itemPrice, // in kopecks
          },
          quantity: itemQty, // Actual quantity (1.0 = 1 item)
        };
      });

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
          emails: [email]
        }
      };

      const response = await fetch(`${this.baseUrl}/receipts/sell`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[Checkbox] Receipt Creation Error Status:', response.status);
        console.error('[Checkbox] Receipt Creation Error Body:', JSON.stringify(result, null, 2));
        throw new Error(result.message || `Failed to create receipt: ${response.status}`);
      }

      console.log('[Checkbox] Receipt created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('[Checkbox] createReceipt Exception:', error.message);
      throw error;
    }
  }
}

export const checkboxService = new CheckboxService();
