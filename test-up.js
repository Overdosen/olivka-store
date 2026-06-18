async function test() {
  const ttn = '0500100100100'; // random or some ttn
  const bearer = '5f5149d3-dd2a-30a2-86f5-19be208e5c3f';
  const token = 'ee32d9af-e33a-4333-b2e6-e29d521ecbd3';
  try {
    const res = await fetch(`https://www.ukrposhta.ua/ecom/0.0.1/shipments/barcode/${ttn}?token=${token}`, {
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Accept': 'application/json'
      }
    });
    const text = await res.text();
    console.log("eCom barcode response:", res.status, text);
  } catch (e) {
    console.error(e);
  }
}

test();
