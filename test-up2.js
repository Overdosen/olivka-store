async function test() {
  const ttn = '0500100100100'; // random or some ttn
  const bearer = '5f5149d3-dd2a-30a2-86f5-19be208e5c3f';
  try {
    const res = await fetch(`https://www.ukrposhta.ua/eCommerce/0.0.1/statuses?barcode=${ttn}`, {
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Accept': 'application/json'
      }
    });
    const text = await res.text();
    console.log("eCommerce status:", res.status, text);
  } catch (e) {
    console.error(e);
  }
}

test();
