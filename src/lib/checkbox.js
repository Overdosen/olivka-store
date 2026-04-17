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
   * This is the main entry point for shift management
   */
  async ensureShiftOpened() {
    try {
      if (!this.token) await this.authenticate();

      // 1. Check primary active shift status
      const activeShift = await this.getActiveShift();
      
      if (activeShift) {
        console.log(`[Checkbox] Active shift found: ${activeShift.id} (${activeShift.status})`);
        
        if (activeShift.status === 'OPENED') {
          return activeShift;
        }
        
        if (activeShift.status === 'OPENING') {
          console.log('[Checkbox] Shift is currently OPENING, waiting...');
          return await this.waitForShiftOpened(activeShift.id);
        }
        
        // If it's something else like CREATED, we might need to wait or handle it
        console.log(`[Checkbox] Active shift has status ${activeShift.status}, treating as valid or waiting...`);
        if (activeShift.status === 'CREATED') return await this.waitForShiftOpened(activeShift.id);
      }

      // 2. If no active shift reported by /cashier/shift, check the list just in case
      console.log('[Checkbox] No active shift via primary check. Searching recent shifts list...');
      const fallbackShift = await this.findActiveShiftInList();
      
      if (fallbackShift) {
        console.log(`[Checkbox] Found active shift in list: ${fallbackShift.id} (${fallbackShift.status})`);
        if (fallbackShift.status === 'OPENING' || fallbackShift.status === 'CREATED') {
          return await this.waitForShiftOpened(fallbackShift.id);
        }
        return fallbackShift;
      }

      // 3. If still nothing, attempt to open a new shift
      try {
        return await this.openShiftAndWait();
      } catch (error) {
        // If opening fails with conflict, try to find the shift one last time
        if (error.message.includes('вже працює') || error.message.includes('Conflict')) {
          console.log('[Checkbox] Conflict while opening shift. Performing emergency rescue search...');
          const emergencyShift = await this.findActiveShiftInList();
          if (emergencyShift) {
            console.log('[Checkbox] Rescue search successful.');
            return emergencyShift;
          }
          throw new Error(`CRITICAL: Cashier busy error, but no active shifts found. Error: ${error.message}`);
        }
        throw error;
      }
    } catch (error) {
      console.error('[Checkbox] ensureShiftOpened Fatal Error:', error.message);
      throw error;
    }
  }

  /**
   * Get current cashier shift using /cashier/shift
   */
  async getActiveShift() {
    const response = await fetch(`${this.baseUrl}/cashier/shift`, {
      method: 'GET',
      headers: this.getHeaders(),
      cache: 'no-store'
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Checkbox] getActiveShift Error:', response.status, errorData);
      return null;
    }

    return await response.json();
  }

  /**
   * Universal helper to find any active shift (OPENED or OPENING)
   */
  async findActiveShiftInList() {
    console.log('[Checkbox] Fetching recent shifts to find an active one...');
    const res = await fetch(`${this.baseUrl}/shifts?limit=10&desc=true`, {
      headers: this.getHeaders(),
      cache: 'no-store'
    });
    
    if (!res.ok) {
        console.error('[Checkbox] Failed to fetch shifts list:', res.status);
        return null;
    }

    const data = await res.json();
    const shifts = data.entities || [];
    
    console.log(`[Checkbox] Found ${shifts.length} recent shifts. Checking for active entries...`);
    
    // Log full entities for debugging
    console.log(`[Checkbox] Shift entities: ${JSON.stringify(shifts)}`);
    shifts.forEach(s => console.log(`  - Shift ${s.id}: ${s.status}`));

    const activeShift = shifts.find(s => {
      const status = (s.status || '').toUpperCase();
      return status !== 'CLOSED';
    });
    
    if (activeShift) {
        console.log(`[Checkbox] Selected active shift: ${activeShift.id} (${activeShift.status})`);
        return activeShift;
    }

    return null;
  }

  /**
   * Open a new shift and wait until it becomes OPENED
   */
  async openShiftAndWait() {
    console.log('[Checkbox] Opening new shift...');
    const response = await fetch(`${this.baseUrl}/shifts`, {
      method: 'POST',
      headers: this.getHeaders(),
      cache: 'no-store'
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
