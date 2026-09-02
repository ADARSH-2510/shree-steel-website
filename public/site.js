let products = [], brands = [], quoteProducts = [];
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Customer-facing names selected for the final Shree Steel layout.
function displayProductName(value) {
  const key = normalizeName(value);
  const names = {
    'tmt steel': 'TMT STEEL BARS',
    'tmt steel bars': 'TMT STEEL BARS',
    'roofing sheets': 'ROOFING SHEET',
    'roofing sheet': 'ROOFING SHEET',
    'square construction rings': 'SQUARE COLUMN RING',
    'square column ring': 'SQUARE COLUMN RING'
  };
  return names[key] || String(value || '').toUpperCase();
}

function displayBrandName(value, productName = '') {
  const key = normalizeName(value);
  const names = {
    'bangur': 'Bangur Cement',
    'bangur cement': 'Bangur Cement',
    'jindal panther': 'Jindal Panther Cement',
    'jindal panther cement': 'Jindal Panther Cement',
    'jindal cement': 'Jindal Panther Cement',
    'jindal steel power': 'Jindal Steel & Power Limited',
    'jindal steel and power limited': 'Jindal Steel & Power Limited',
    'jindal steel power limited': 'Jindal Steel & Power Limited',
    'hil charminar': 'HIL Charminar Sheet',
    'hil charminar sheet': 'HIL Charminar Sheet',
    'everest': 'Everest Sheet',
    'everest sheet': 'Everest Sheet'
  };
  if (key === 'msp' && normalizeName(productName) === 'tmt steel') return 'MSP PREMIUM TMT BARS';
  if (key === 'msp' && normalizeName(productName) === 'pipes') return 'MSP PIPE';
  if (key === 'msp premium tmt bars') return 'MSP PREMIUM TMT BARS';
  if (key === 'msp steel and power limited') return 'MSP';
  return names[key] || value;
}

function brandLogoPath(name) {
  const key = normalizeName(name);
  const logos = {
    'msp': '/assets/brands/msp-steel.png',
    'msp premium tmt bars': '/assets/brands/msp-steel.png',
    'gk tmt': '/assets/brands/gk-tmt.jpeg',
    'bangur': '/assets/brands/bangur-cement.jpeg',
    'bangur cement': '/assets/brands/bangur-cement.jpeg',
    'jindal panther': '/assets/brands/jindal-panther-cement.png',
    'jindal panther cement': '/assets/brands/jindal-panther-cement.png',
    'hil charminar': '/assets/brands/hil-birla-nu.png',
    'hil charminar sheet': '/assets/brands/hil-birla-nu.png',
    'everest': '/assets/brands/everest-roofing.webp',
    'everest sheet': '/assets/brands/everest-roofing.webp',
    'jindal steel power': '/assets/brands/jindal-steel.png',
    'jindal steel and power limited': '/assets/brands/jindal-steel.png',
    'jindal steel power limited': '/assets/brands/jindal-steel.png',
    'jindal bricks': '/assets/brands/jindal-steel.png'
  };
  return logos[key] || '';
}

const brandVarieties = {
  'bangur cement': [
    { name:'Bangur Powermax Cement', image:'/assets/products/bangur-powermax-cement.jpg', available:true, description:'Designed for strong, durable construction with Power Grind technology and a smooth finish, including plastering applications.', source:'https://www.bangurcement.com/product/bangur-powermax' },
    { name:'Bangur Magna Cement', image:'/assets/products/bangur-magna-cement.jpg', available:true, description:'Designed for solid concrete and strong foundations, slabs and columns, with a formulation focused on rapid solidification and dependable strength.', source:'https://www.bangurcement.com/product/bangur-magna' }
  ],
  'jindal panther cement': [
    { name:'Jindal Panther Shield Cement', image:'/assets/products/jindal-panther-shield-cement.png', available:true, description:'A composite cement from the Jindal Panther range, positioned around durability, strength and reliable construction performance.', source:'https://jindalpanthercement.com/' }
  ],
  'msp pipe': [
    { name:'Round Pipe', image:'/assets/products/msp-pipes.webp', available:true, quoteProduct:'Round Pipes', description:'MSP round steel pipes for construction, fabrication and general structural requirements. Ask Shree Steel for current sizes and stock.', source:'https://products.mspsteel.com/pipes/' },
    { name:'Square Pipe', image:'/assets/products/msp-pipes.webp', available:true, quoteProduct:'Square Pipes', description:'MSP square steel pipes for construction, fabrication and structural applications. Ask Shree Steel for current sizes and stock.', source:'https://products.mspsteel.com/pipes/' }
  ],
  'msp binding wire': [
    { name:'MSP Binding Wire', image:'', available:true, description:'MSP binding wire for reinforcement tying and construction work. Current coil sizes can be confirmed with Shree Steel.', source:'https://mspsteel.com/' }
  ],
  'msp ring': [
    { name:'Square Column Ring', image:'/assets/products/msp-square-column-ring.webp', available:true, description:'MSP square construction rings used for column reinforcement and RCC column construction. Confirm current sizes with Shree Steel.', source:'https://mspsteel.com/' }
  ],
  'msp premium tmt bars': [
    { name:'MSP Premium TMT Bars', image:'/assets/products/msp-premium-tmt-bars.webp', available:true, description:'Premium TMT reinforcement steel for RCC construction. Current bar diameters and supply availability can be confirmed with Shree Steel.', source:'https://products.mspsteel.com/tmt-bar/' }
  ],
  'gk tmt': [
    { name:'GK TMT Bars', image:'/assets/products/gk-tmt.jpeg', available:true, description:'GK TMT reinforcement bars for RCC construction. Confirm current grades, diameters and availability with Shree Steel.', source:'https://realgroup.org/gk-tmt' }
  ],
  'hil charminar sheet': [
    { name:'HIL Charminar Sheet', image:'/assets/products/hil-charminar-sheet.jpg', available:true, description:'HIL Charminar fibre-cement roofing sheets for durable roofing applications across homes, sheds and buildings.', source:'https://hil.in/' }
  ],
  'everest sheet': [
    { name:'Everest Coloured AC Sheet', image:'/assets/products/everest-sheet.jpg', available:true, description:'Everest coloured roofing sheets for durable roof coverage with a practical range of colour options.', source:'https://www.everestind.com/roofing/fibre-cement-roofing' },
    { name:'Everest Hi-Tech Roofing Sheet', image:'/assets/products/everest-sheet.jpg', available:true, description:'A fibre-cement roofing solution designed for demanding environments, with strength and durable performance.', source:'https://www.everestind.com/' }
  ],
  'jindal steel power limited': [
    { name:'Jindal Steel & Power Limited Bricks', image:'/assets/products/jindal-bricks.jpg', available:true, description:'Jindal Steel & Power construction bricks for walling and general building requirements. Confirm current size and availability with Shree Steel.', source:'https://www.jindalsteelpower.com/' }
  ],
  'msp': []
};

function brandDisplayKey(brandName, productName='') {
  const key = normalizeName(displayBrandName(brandName, productName));
  if (key === 'msp' && ['pipes','round pipes','square pipes'].includes(normalizeName(productName))) return 'msp pipe';
  if (key === 'msp' && normalizeName(productName) === 'binding wire') return 'msp binding wire';
  if (key === 'msp' && normalizeName(productName) === 'square construction rings') return 'msp ring';
  return key;
}

function brandDetailsMarkup(brand, product) {
  const label = displayBrandName(brand.name, product.name);
  const logo = brand.logo || brandLogoPath(brand.name);
  return `<button type="button" class="product-brand product-brand-button" data-brand-name="${esc(brand.name)}" data-product-name="${esc(product.name)}" aria-label="View ${esc(label)} details">${logo ? `<img src="${esc(logo)}" alt="${esc(label)} logo" loading="lazy">` : ''}<span class="product-brand-name">${esc(label)}</span><span class="brand-tap-hint">TAP TO VIEW</span></button>`;
}

function openBrandDetails(productName, brandName) {
  let product = products.find(p => normalizeName(p.name) === normalizeName(productName));
  if (!product && normalizeName(productName) === 'pipes') {
    const pipeBase = products.find(p => ['round pipes','square pipes'].includes(normalizeName(p.name)));
    product = { ...(pipeBase || {}), name:'Pipes', category:'Pipes', description:'MSP round and square pipes for construction and fabrication requirements.', brands:'MSP', __syntheticPipes:true };
  }
  if (!product) return;
  const brand = productBrandData(product).find(b => normalizeName(b.name) === normalizeName(brandName));
  if (!brand) return;
  const label = displayBrandName(brand.name, product.name);
  const key = brandDisplayKey(brand.name, product.name);
  const dynamicVarieties = Array.isArray(brand.varieties) ? brand.varieties : [];
const varieties = dynamicVarieties.length
  ? dynamicVarieties.map(v => ({
      name: v.name || '',
      image: v.product_image || '',
      available: v.visible !== false,
      description: v.description || 'Product variety available from Shree Steel. Contact us for current sizes and stock.',
      source: v.source || '',
      quoteProduct: v.quoteProduct || product.name
    }))
  : (brandVarieties[key] || []);
  const logo = brand.logo || brandLogoPath(brand.name);
  $('brandDetailsTitle').textContent = label;
  $('brandDetailsContent').innerHTML = `
    <div class="brand-detail-head">${logo ? `<img src="${esc(logo)}" alt="${esc(label)} logo">` : ''}<div><div class="brand-detail-product">${esc(displayProductName(product.name))}</div><h3>${esc(label)}</h3></div></div>
    ${varieties.length ? `<div class="brand-variety-block"><strong>PRODUCTS / VARIETIES</strong><div class="brand-variety-cards">${varieties.map(v => `
      <article class="brand-variety-card">
        <div class="brand-variety-media">${v.image ? `<img src="${esc(v.image)}" alt="${esc(v.name)}" loading="lazy">` : `<div class="brand-variety-placeholder">${logo ? `<img src="${esc(logo)}" alt="${esc(label)}">` : esc(label.slice(0,2).toUpperCase())}<span>PRODUCT IMAGE</span></div>`}</div>
        <div class="brand-variety-copy"><h4>${esc(v.name)}</h4><p>${esc(v.description)}</p><div class="availability ${v.available ? 'is-available' : 'is-unavailable'}"><span></span>${v.available ? 'AVAILABLE' : 'CURRENTLY UNAVAILABLE'}</div>${v.source ? `<a class="official-source" href="${esc(v.source)}" target="_blank" rel="noopener">OFFICIAL PRODUCT SOURCE →</a>` : ''}</div>
        <button type="button" class="btn primary variety-quote" data-product-name="${esc(v.quoteProduct || product.name)}" data-variety-name="${esc(v.name)}">REQUEST THIS PRODUCT →</button>
      </article>`).join('')}</div></div>` : `<p class="brand-no-variety">Product details and current sizes are available on enquiry. Request a quote to tell us exactly what you need.</p>`}
    <button type="button" class="btn primary brand-detail-quote" data-product-name="${esc(product.name)}">REQUEST MY QUOTE →</button>`;
  $('brandDetailsModal').classList.add('show');
}
function closeBrandDetails() { $('brandDetailsModal').classList.remove('show'); }

function productBrandData(product) {
  const quoteProduct = quoteProducts.find(q => Number(q.id) === Number(product.id) || normalizeName(q.name) === normalizeName(product.name));
  const relationshipFallbacks = {
    'tmt steel': ['MSP', 'GK TMT'],
    'cement': ['Bangur Cement', 'Jindal Panther Cement'],
    'roofing sheets': ['HIL Charminar', 'Everest'],
    'pipes': ['MSP'],
    'round pipes': ['MSP'],
    'square pipes': ['MSP'],
    'binding wire': ['MSP'],
    'square construction rings': ['MSP'],
    'bricks': ['Jindal Steel & Power Limited']
  };
  const aliases = {
    'hil birlanu': 'HIL Charminar',
    'jindal panther': 'Jindal Panther Cement',
    'jindal cement': 'Jindal Panther Cement',
    'jindal steel power': 'Jindal Steel & Power Limited',
    'jindal bricks': 'Jindal Steel & Power Limited'
  };
  const desired = relationshipFallbacks[normalizeName(product.name)];
  const raw = desired || (quoteProduct?.brands?.length ? quoteProduct.brands.map(b => b.name) : (product.brands || '').split(',').map(raw => raw.trim()).filter(Boolean));
  const mapped = raw.map(name => {
    const canonical = aliases[normalizeName(name)] || name;
    const found = brands.find(b => normalizeName(b.name) === normalizeName(canonical));
    return found || { name: canonical, logo: brandLogoPath(canonical) };
  });
  return mapped.map(b => ({ ...b, logo: brandLogoPath(b.name) || b.logo || '' }));
}

function productVisual(product, index, productBrands) {
  const logoEntries = productBrands.filter(b => b.logo).slice(0, 3);
  const visual = logoEntries.length
    ? logoEntries.map(b => `<img src="${esc(b.logo)}" alt="${esc(displayBrandName(b.name, product.name))} logo" loading="lazy">`).join('')
    : `<span class="product-symbol">${esc(product.name.slice(0, 2).toUpperCase())}</span>`;
  return `<div class="product-visual v${index % 6}"><div class="product-logo-stack">${visual}</div><div class="product-title">${esc(displayProductName(product.name))}</div></div>`;
}

async function load() {
  try {
    const [productRes, brandRes, quoteRes] = await Promise.all([
      fetch('/api/products'), fetch('/api/brands'), fetch('/api/quote-data')
    ]);
    products = await productRes.json();
    brands = await brandRes.json();
    quoteProducts = (await quoteRes.json()).products || [];

    const visibleProducts = products.filter(p => p.available && p.visible !== 0);
    const pipeProducts = visibleProducts.filter(p => ['round pipes','square pipes'].includes(normalizeName(p.name)));
    const hasPipeSection = pipeProducts.length > 0;
    const pipeBase = pipeProducts[0] || { name:'Pipes', category:'Pipes', description:'MSP round and square pipes for construction and fabrication requirements.', brands:'MSP' };
    const displayProducts = visibleProducts.filter(p => !['round pipes','square pipes'].includes(normalizeName(p.name)));
    if (hasPipeSection || !displayProducts.some(p => normalizeName(p.name) === 'pipes')) displayProducts.splice(Math.min(3, displayProducts.length), 0, { ...pipeBase, name:'Pipes', category:'Pipes', description:'MSP round and square pipes for construction and fabrication requirements.', brands:'MSP', __syntheticPipes:true });
    $('productGrid').innerHTML = displayProducts.map((p, i) => {
      const productBrands = productBrandData(p);
      const brandMarkup = productBrands.length
        ? `<div class="trusted-brands"><div class="trusted-brands-label">TRUSTED BRANDS · TAP A BRAND TO VIEW</div><div class="product-brand-list">${productBrands.map(b => brandDetailsMarkup(b, p)).join('')}</div></div>`
        : '';
      return `<article class="product-card">${productVisual(p, i, productBrands)}<div class="product-body"><div class="product-cat">${esc(p.category)}</div><h3>${esc(displayProductName(p.name))}</h3><p>${esc(p.description)}</p>${brandMarkup}<button class="enq" onclick="${p.__syntheticPipes ? 'openQuote()' : `openQuoteByName(${JSON.stringify(p.name)})`}">REQUEST MY QUOTE →</button></div></article>`;
    }).join('');
  } catch (error) {
    console.error(error);
    $('productGrid').innerHTML = '<p>Unable to load products.</p>';
  }
}

function openQuote(product = '') {
  $('modal').classList.add('show');
  if (!document.querySelector('.quote-item')) addQuoteItem(product);
  else if (product) addQuoteItem(product);
  renderQuoteItems();
}
function openQuoteByName(name) { openQuote(name); }
function closeQuote() { $('modal').classList.remove('show'); }
function toggleNav() { document.querySelector('nav').classList.toggle('mobile'); }

function addQuoteItem(productName = '') {
  const p = quoteProducts.find(x => x.name === productName);
  const id = `quote-item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const item = document.createElement('div');
  item.className = 'quote-item';
  item.dataset.key = id;
  item.innerHTML = `
    <div class="quote-item-head"><strong>Requirement ${document.querySelectorAll('.quote-item').length + 1}</strong><button type="button" class="quote-remove" onclick="removeQuoteItem('${id}')">Remove</button></div>
    <select class="qi-product" required onchange="renderQuoteItemOptions(this.closest('.quote-item'))"><option value="">Select product</option>${quoteProducts.map(x => `<option value="${x.id}" ${p && x.id === p.id ? 'selected' : ''}>${esc(displayProductName(x.name))}</option>`).join('')}</select>
    <div class="quote-fields">
      <select class="qi-brand" onchange="renderQuoteItemOptions(this.closest('.quote-item'))"><option value="">Select brand (optional)</option></select>
      <select class="qi-spec"><option value="">Select specification (optional)</option></select>
      <div class="quote-qty"><input class="qi-quantity" type="number" min="0.01" step="0.01" placeholder="Quantity" required><span class="qi-unit">Unit</span></div>
    </div>`;
  $('quoteItems').appendChild(item);
  renderQuoteItemOptions(item);
}
function removeQuoteItem(key) {
  const item = document.querySelector(`.quote-item[data-key="${key}"]`);
  if (item) item.remove();
  if (!document.querySelector('.quote-item')) addQuoteItem();
  renderQuoteItems();
}
function renderQuoteItemOptions(item) {
  const p = quoteProducts.find(x => x.id === Number(item.querySelector('.qi-product').value));
  const brand = item.querySelector('.qi-brand');
  const spec = item.querySelector('.qi-spec');
  const unit = item.querySelector('.qi-unit');
  const selectedBrandId = Number(brand.value);
  const selectedBrand = (p?.brands || []).find(b => Number(b.id) === selectedBrandId);
  brand.innerHTML = `<option value="">Select brand (optional)</option>` + (p?.brands || []).map(b => `<option value="${b.id}">${esc(displayBrandName(b.name, p.name))}</option>`).join('');
  brand.value = selectedBrandId || '';
  const isCement = normalizeName(p?.name || '') === 'cement';
  const options = isCement
    ? (Array.isArray(selectedBrand?.varieties) ? selectedBrand.varieties : []).map(v => ({ name: 'Variant', value: v.name }))
    : (p?.options || []);
  spec.innerHTML = `<option value="">Select specification (optional)</option>` + options.map(o => `<option value="${esc(o.value)}">${esc(o.name)}: ${esc(o.value)}</option>`).join('');
  unit.textContent = p?.unit || 'Unit';
}function renderQuoteItems() {
  document.querySelectorAll('.quote-item').forEach((item, i) => {
    const h = item.querySelector('.quote-item-head strong');
    if (h) h.textContent = `Requirement ${i + 1}`;
  });
}

$('quoteForm').addEventListener('submit', async event => {
  event.preventDefault();
  const items = [...document.querySelectorAll('.quote-item')].map(item => ({
    productId: Number(item.querySelector('.qi-product').value),
    brandId: item.querySelector('.qi-brand').value ? Number(item.querySelector('.qi-brand').value) : null,
    specification: item.querySelector('.qi-spec').value.trim(),
    quantity: Number(item.querySelector('.qi-quantity').value)
  }));
  if (!items.length || items.some(x => !x.productId || !Number.isFinite(x.quantity) || x.quantity <= 0)) {
    $('formMsg').textContent = 'Please complete every product requirement.';
    return;
  }
  const data = {
    name: $('qname').value.trim(), phone: $('qphone').value.trim(), location: $('qlocation').value.trim(),
    additionalRequirement: $('qmessage').value.trim(), items
  };
  try {
    $('quoteSubmit').disabled = true;
    $('quoteSubmit').textContent = 'SUBMITTING…';
    const response = await fetch('/api/quote', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) { $('formMsg').textContent = result.error || 'Please try again'; return; }
    const lines = items.map((x, i) => {
      const p = quoteProducts.find(q => q.id === x.productId);
      const b = p?.brands.find(q => q.id === x.brandId)?.name;
      return `${i + 1}. ${displayProductName(p?.name || 'Product')}${b ? ` | ${displayBrandName(b)}` : ''}${x.specification ? ` | ${x.specification}` : ''} | Qty: ${x.quantity} ${p?.unit || ''}`;
    });
    const text = encodeURIComponent(`Hello Shree Steel, I would like to request a quote.\n\nEnquiry: ${result.enquiryNo}\nName: ${data.name}\nPhone: ${data.phone}\nLocation: ${data.location}\n\nRequirements:\n${lines.join('\n')}\n\nAdditional requirement: ${data.additionalRequirement || 'None'}`);
    $('formMsg').textContent = `Enquiry ${result.enquiryNo} saved. Opening WhatsApp…`;
    window.open(`https://wa.me/918224899000?text=${text}`, '_blank');
    setTimeout(() => { closeQuote(); resetQuoteForm(); }, 900);
  } catch (error) { $('formMsg').textContent = 'Unable to send enquiry. Please try again.'; }
  finally { $('quoteSubmit').disabled = false; $('quoteSubmit').textContent = 'SUBMIT REQUEST'; }
});
function resetQuoteForm() {
  $('quoteForm').reset(); $('quoteItems').innerHTML = ''; $('formMsg').textContent = ''; addQuoteItem(); renderQuoteItems();
}
$('modal').addEventListener('click', event => { if (event.target.id === 'modal') closeQuote(); });
document.addEventListener('click', event => {
  const brandButton = event.target.closest('.product-brand-button');
  if (brandButton) {
    event.preventDefault();
    openBrandDetails(brandButton.dataset.productName, brandButton.dataset.brandName);
    return;
  }
  const varietyButton = event.target.closest('.variety-quote');
  if (varietyButton) {
    closeBrandDetails();
    openQuoteByName(varietyButton.dataset.productName);
    return;
  }
  const brandQuoteButton = event.target.closest('.brand-detail-quote');
  if (brandQuoteButton) {
    closeBrandDetails();
    openQuoteByName(brandQuoteButton.dataset.productName);
  }
  if (event.target.id === 'brandDetailsModal') closeBrandDetails();
});

/* =========================================================
   CONSTRUCTION MATERIAL CALCULATOR
   TMT + CEMENT + BRICKS
   Planning estimates only
   ========================================================= */

const CONSTRUCTION_FACTORS = {
  residential: {
    tmtKgPerSqFt: 4.0,
    cementBagsPerSqFt: 0.40,
    bricksPerSqFt: 10
  },

  commercial: {
    tmtKgPerSqFt: 4.5,
    cementBagsPerSqFt: 0.45,
    bricksPerSqFt: 11
  }
};

let selectedConstructionMaterial = 'all';

function selectConstructionMaterial(material) {

  selectedConstructionMaterial = material;

  document.querySelectorAll('.material-tab').forEach(tab => {
    tab.classList.toggle(
      'active',
      tab.dataset.material === material
    );
  });

  const title = {
    all: 'TMT + CEMENT + BRICKS',
    tmt: 'TMT STEEL',
    cement: 'CEMENT',
    bricks: 'BRICKS'
  };

  const resultTitle = document.getElementById('constructionResultTitle');

  if (resultTitle) {
    resultTitle.textContent = title[material] || title.all;
  }

  const cards = {
    tmt: document.getElementById('tmtResultCard'),
    cement: document.getElementById('cementResultCard'),
    bricks: document.getElementById('brickResultCard')
  };

  Object.values(cards).forEach(card => {
    if (card) card.style.display = 'block';
  });

  if (material !== 'all' && cards[material]) {
    Object.entries(cards).forEach(([key, card]) => {
      if (card) {
        card.style.display =
          key === material ? 'block' : 'none';
      }
    });
  }
}

function calculateConstructionMaterials() {

  const area = Number(
    document.getElementById('constructionArea')?.value
  );

  const floors = Number(
    document.getElementById('constructionFloors')?.value
  );

  const type =
    document.getElementById('constructionType')?.value ||
    'residential';

  const factor = CONSTRUCTION_FACTORS[type];

  if (
    !Number.isFinite(area) ||
    area <= 0 ||
    !Number.isFinite(floors) ||
    floors <= 0 ||
    !factor
  ) {
    document.getElementById('constructionTmtResult').textContent = '— kg';
    document.getElementById('constructionCementResult').textContent = '— bags';
    document.getElementById('constructionBrickResult').textContent = '— pieces';

    document.getElementById('constructionCalculationDetail').textContent =
      'Please enter a valid built-up area and select the number of floors.';

    return;
  }

  const totalArea = area * floors;

  const tmtKg =
    totalArea * factor.tmtKgPerSqFt;

  const cementBags =
    totalArea * factor.cementBagsPerSqFt;

  const bricks =
    totalArea * factor.bricksPerSqFt;

  const tmtFormatted =
    Math.round(tmtKg).toLocaleString('en-IN');

  const cementFormatted =
    Math.ceil(cementBags).toLocaleString('en-IN');

  const bricksFormatted =
    Math.ceil(bricks).toLocaleString('en-IN');

  document.getElementById('constructionTmtResult').textContent =
    `${tmtFormatted} kg`;

  document.getElementById('constructionCementResult').textContent =
    `${cementFormatted} bags`;

  document.getElementById('constructionBrickResult').textContent =
    `${bricksFormatted} pieces`;

  const typeLabel =
    type === 'commercial'
      ? 'Commercial'
      : 'Residential';

  document.getElementById('constructionCalculationDetail').textContent =
    `${area.toLocaleString('en-IN')} sq.ft. per floor × ` +
    `${floors} floor${floors > 1 ? 's' : ''} = ` +
    `${totalArea.toLocaleString('en-IN')} sq.ft. total ` +
    `(${typeLabel}).`;
}

function resetConstructionCalculator() {

  const area = document.getElementById('constructionArea');
  const floors = document.getElementById('constructionFloors');
  const type = document.getElementById('constructionType');

  if (area) area.value = '';
  if (floors) floors.value = '1';
  if (type) type.value = 'residential';

  document.getElementById('constructionTmtResult').textContent = '— kg';
  document.getElementById('constructionCementResult').textContent = '— bags';
  document.getElementById('constructionBrickResult').textContent = '— pieces';

  document.getElementById('constructionCalculationDetail').textContent =
    'Enter your project details and calculate.';

  selectConstructionMaterial('all');
}

load();

/* =========================================================
   STAGE A - CONSTRUCTION STORY SLIDER
   ========================================================= */

(function initConstructionStorySlider(){

  const slider = document.querySelector('.story-slider');
  if (!slider) return;

  const slides = [...slider.querySelectorAll('.story-slide')];
  const dots = [...slider.querySelectorAll('.story-dot')];
  const previous = slider.querySelector('.story-prev');
  const next = slider.querySelector('.story-next');

  if (!slides.length) return;

  let current = 0;
  let timer = null;
  let touchStartX = 0;
  let touchEndX = 0;

  function showStory(index){
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-current', i === current ? 'true' : 'false');
    });
  }

  function nextStory(){
    showStory(current + 1);
  }

  function previousStory(){
    showStory(current - 1);
  }

  function startAutoSlide(){
    stopAutoSlide();
    timer = setInterval(nextStory, 4500);
  }

  function stopAutoSlide(){
    if (timer){
      clearInterval(timer);
      timer = null;
    }
  }

  next?.addEventListener('click', () => {
    nextStory();
    startAutoSlide();
  });

  previous?.addEventListener('click', () => {
    previousStory();
    startAutoSlide();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      showStory(index);
      startAutoSlide();
    });
  });

  slider.addEventListener('mouseenter', stopAutoSlide);
  slider.addEventListener('mouseleave', startAutoSlide);

  slider.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].screenX;
    stopAutoSlide();
  }, {passive:true});

  slider.addEventListener('touchend', event => {
    touchEndX = event.changedTouches[0].screenX;

    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) > 45){
      if (distance < 0) nextStory();
      else previousStory();
    }

    startAutoSlide();
  }, {passive:true});

  showStory(0);
  startAutoSlide();

})();


/* =========================================================
   FINAL STAGE A - HERO CONSTRUCTION STORY SLIDER
   ========================================================= */

(function initHeroConstructionSlider(){

  const slider = document.querySelector('.hero-story-slider');
  if (!slider) return;

  const slides = [...slider.querySelectorAll('.hero-story-slide')];
  const dots = [...slider.querySelectorAll('.hero-story-dot')];
  const prev = slider.querySelector('.hero-story-prev');
  const next = slider.querySelector('.hero-story-next');

  let current = 0;
  let timer = null;
  let touchStart = 0;

  function show(index){
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
    });
  }

  function start(){
    stop();
    timer = setInterval(() => show(current + 1), 4500);
  }

  function stop(){
    if(timer){
      clearInterval(timer);
      timer = null;
    }
  }

  next?.addEventListener('click', () => {
    show(current + 1);
    start();
  });

  prev?.addEventListener('click', () => {
    show(current - 1);
    start();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      show(i);
      start();
    });
  });

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);

  slider.addEventListener('touchstart', event => {
    touchStart = event.changedTouches[0].screenX;
    stop();
  }, {passive:true});

  slider.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].screenX - touchStart;

    if(Math.abs(distance) > 45){
      show(distance < 0 ? current + 1 : current - 1);
    }

    start();
  }, {passive:true});

  show(0);
  start();

})();


/* =========================================================
   PHASE A.2 - REAL SHREE STEEL SHOP PHOTO SLIDER
   ========================================================= */

(function initShreeSteelShopSlider(){

  const slider = document.querySelector('.shop-photo-slider');
  if (!slider) return;

  const slides = [...slider.querySelectorAll('.shop-photo-slide')];
  const dots = [...slider.querySelectorAll('.shop-photo-dot')];
  const prev = slider.querySelector('.shop-photo-prev');
  const next = slider.querySelector('.shop-photo-next');

  let current = 0;
  let timer = null;
  let touchStart = 0;

  function show(index){
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
    });
  }

  function start(){
    stop();
    timer = setInterval(() => show(current + 1), 5000);
  }

  function stop(){
    if(timer){
      clearInterval(timer);
      timer = null;
    }
  }

  next?.addEventListener('click', () => {
    show(current + 1);
    start();
  });

  prev?.addEventListener('click', () => {
    show(current - 1);
    start();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      show(i);
      start();
    });
  });

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);

  slider.addEventListener('touchstart', event => {
    touchStart = event.changedTouches[0].screenX;
    stop();
  }, {passive:true});

  slider.addEventListener('touchend', event => {
    const distance =
      event.changedTouches[0].screenX - touchStart;

    if(Math.abs(distance) > 45){
      show(distance < 0 ? current + 1 : current - 1);
    }

    start();
  }, {passive:true});

  show(0);
  start();

})();
