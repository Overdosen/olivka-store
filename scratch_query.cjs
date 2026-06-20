const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v) acc[k] = v.join('=').trim().replace(/\"/g, '').replace(/\'/g, '');
  return acc;
}, {});
fetch(env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/orders?order_number=eq.232', {
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
  }
}).then(r => r.json()).then(console.log).catch(console.error);
