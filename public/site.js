let products = [], brands = [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const logoByName = name => brands.find(b => b.name.toLowerCase() === name.toLowerCase())?.logo || '';

function productVisual(product, index) {
  const logos = (product.brands || '').split(',').map(x => logoByName(x.trim())).filter(Boolean).slice(0, 3);
  const visual = logos.length
    ? logos.map(src => `<img src="${esc(src)}" alt="Brand logo" loading="lazy">`).join('')
    : `<span class="product-symbol">${esc(product.name.slice(0, 2).toUpperCase())}</span>`;
  return `<div class="product-visual v${index % 6}"><div class="product-logo-stack">${visual}</div><div class="product-title">${esc(product.name)}</div></div>`;
}

async function load() {
  try {
    const [productRes, brandRes] = await Promise.all([fetch('/api/products'), fetch('/api/brands')]);
    products = await productRes.json();
    brands = await brandRes.json();

    $('brandGrid').innerHTML = brands.map(b => `<article class="brand-card"><div class="brand-logo-wrap">${b.logo ? `<img src="${esc(b.logo)}" alt="${esc(b.name)} logo" loading="lazy">` : `<div class="brand-text-logo">${esc(b.name)}</div>`}</div><div class="brand-meta"><strong>${esc(b.name)}</strong><small>${esc(b.category)}</small></div></article>`).join('');
    $('productGrid').innerHTML = products.filter(p => p.available).map((p, i) => `<article class="product-card">${productVisual(p, i)}<div class="product-body"><div class="product-cat">${esc(p.category)}</div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="tags">${(p.brands || '').split(',').map(b => `<span class="tag">${esc(b.trim())}</span>`).join('')}</div><button class="enq" onclick="openQuote(${JSON.stringify(p.name)})">ENQUIRE NOW →</button></div></article>`).join('');
    $('qproduct').innerHTML = '<option value="">Select product</option>' + products.map(p => `<option>${esc(p.name)}</option>`).join('');
  } catch (error) {
    console.error(error);
    $('brandGrid').innerHTML = '<p>Unable to load brands.</p>';
    $('productGrid').innerHTML = '<p>Unable to load products.</p>';
  }
}

function openQuote(product = '') { $('modal').classList.add('show'); if (product) $('qproduct').value = product; }
function closeQuote() { $('modal').classList.remove('show'); }
function toggleNav() { document.querySelector('nav').classList.toggle('mobile'); }

$('quoteForm').addEventListener('submit', async event => {
  event.preventDefault();
  const data = { name: $('qname').value.trim(), phone: $('qphone').value.trim(), product: $('qproduct').value, message: $('qmessage').value.trim() };
  try {
    const response = await fetch('/api/enquiries', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) return $('formMsg').textContent = result.error || 'Please try again';
    $('formMsg').textContent = 'Enquiry saved. Opening WhatsApp…';
    const text = encodeURIComponent(`Hello Shree Steel, I would like a quote.\n\nName: ${data.name}\nPhone: ${data.phone}\nProduct: ${data.product}\nRequirement: ${data.message}`);
    window.open(`https://wa.me/918224899000?text=${text}`, '_blank');
    setTimeout(closeQuote, 700);
  } catch { $('formMsg').textContent = 'Unable to send enquiry. Please try again.'; }
});
$('modal').addEventListener('click', event => { if (event.target.id === 'modal') closeQuote(); });

function calculateTmt() {
  const q = Number($('calcQty').value), w = Number($('calcBarWeight').value), p = Number($('calcPrice').value);
  if (![q, w, p].every(Number.isFinite) || [q, w, p].some(v => v < 0)) {
    $('calcWeight').textContent = 'Enter valid values'; $('calcWeightMini').textContent = '—'; $('calcAmount').textContent = '₹0.00'; return;
  }
  const weight = q * w, amount = weight * p, kg = weight.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  $('calcWeight').textContent = `${kg} kg`; $('calcWeightMini').textContent = `${kg} kg`;
  $('calcAmount').textContent = `₹${amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  $('calcDetail').textContent = `${q.toLocaleString('en-IN')} bars × ${w.toLocaleString('en-IN', {maximumFractionDigits: 3})} kg/bar`;
}
function resetCalculator() {
  ['calcQty', 'calcBarWeight', 'calcPrice'].forEach(id => $(id).value = '');
  $('calcWeight').textContent = $('calcWeightMini').textContent = '0.00 kg';
  $('calcAmount').textContent = '₹0.00'; $('calcDetail').textContent = 'Enter values to calculate';
}
load();
