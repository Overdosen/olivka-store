import { getOrderEmailHtml } from '../../components/emails/OrderEmail';

export default function TestEmailPage() {
  const mockOrder = {
    order_number: '10254',
    full_name: 'Денис Сопин',
    items: [
      {
        name: 'Комплект для немовлят інтерлок 62 боді, повзунята та шапочка',
        price: 355,
        qty: 1,
        size: '62',
        sku: '338',
        image_url: 'https://olivka.store/placeholder-product.png'
      }
    ],
    total: 355,
    delivery_method: 'nova_poshta',
    address: 'м. Київ, Відділення №1',
    phone: '+380991234567',
    email: 'test@example.com'
  };

  return (
    <div style={{ backgroundColor: '#f0f0f0', padding: '40px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#524f25' }}>Email Preview (All Types)</h1>
        
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ padding: '10px 20px', backgroundColor: '#524f25', color: 'white', borderRadius: '8px 8px 0 0', margin: 0 }}>1. IBAN (100% Payment)</h2>
          <div dangerouslySetInnerHTML={{ __html: getOrderEmailHtml({ ...mockOrder, payment_method: 'iban' }) }} />
        </div>

        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ padding: '10px 20px', backgroundColor: '#9a866a', color: 'white', borderRadius: '8px 8px 0 0', margin: 0 }}>2. Cash on Delivery (Advance)</h2>
          <div dangerouslySetInnerHTML={{ __html: getOrderEmailHtml({ ...mockOrder, payment_method: 'cash_on_delivery' }) }} />
        </div>

        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ padding: '10px 20px', backgroundColor: '#6b8e23', color: 'white', borderRadius: '8px 8px 0 0', margin: 0 }}>3. LiqPay (Success)</h2>
          <div dangerouslySetInnerHTML={{ __html: getOrderEmailHtml({ ...mockOrder, payment_method: 'liqpay' }) }} />
        </div>
      </div>
    </div>
  );
}
