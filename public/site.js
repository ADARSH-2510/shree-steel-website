let products=[],brands=[];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const logoByName=name=>{const b=brands.find(x=>x.name.toLowerCase()===name.toLowerCase());return b?.logo||''};
function productVisual(p,i){
  const names=(p.brands||'').split(',').map(x=>x.trim());
  const imgs=names.map(logoByName).filter(Boolean).slice(0,3);
  const logos=imgs.length?imgs.map(src=>`<img src="${esc(src)}" alt="Brand logo" loading="lazy">`).join(''):`<span class="product-symbol">${esc(p.name.slice(0,2).toUpperCase())}</span>`;
  return `<div class="product-visual v${i%6}"><div class="product-logo-stack">${logos}</div><div class="product-title">${esc(p.name)}</div></div>`;
}
async function load(){
  try{
    const [pa,ba]=await Promise.all([fetch('/api/products'),fetch('/api/brands')]);
    products=await pa.json(); brands=await ba.json();
    $('brandGrid').innerHTML=brands.map(x=>`<article class="brand-card ${x.logo?'has-logo':'no-logo'}"><div class="brand-logo-wrap">${x.logo?`<img src="${esc(x.logo)}" alt="${esc(x.name)} logo" loading="lazy">`:`<div class="brand-text-logo">${esc(x.name)}</div>`}</div><div class="brand-meta"><strong>${esc(x.name)}</strong><small>${esc(x.category)}</small></div></article>`).join('');
    $('productGrid').innerHTML=products.filter(x=>x.available).map((x,i)=>`<article class="product-card"><div>${productVisual(x,i)}</div><div class="product-body"><div class="product-cat">${esc(x.category)}</div><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="tags">${x.brands.split(',').map(y=>`<span class="tag">${esc(y.trim())}</span>`).join('')}</div><button class="enq" onclick="openQuote(${JSON.stringify(x.name)})">ENQUIRE NOW →</button></div></article>`).join('');
    $('qproduct').innerHTML='<option value="">Select product</option>'+products.map(x=>`<option>${esc(x.name)}</option>`).join('');
  }catch(e){console.error(e);$('brandGrid').innerHTML='<p>Unable to load brands.</p>';$('productGrid').innerHTML='<p>Unable to load products.</p>'}
}
function openQuote(p=''){ $('modal').classList.add('show'); if(p)$('qproduct').value=p }
function closeQuote(){ $('modal').classList.remove('show') }
function toggleNav(){document.querySelector('nav').classList.toggle('mobile')}
$('quoteForm').addEventListener('submit',async e=>{e.preventDefault();const data={name:$('qname').value.trim(),phone:$('qphone').value.trim(),product:$('qproduct').value,message:$('qmessage').value.trim()};const r=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json();if(!r.ok){$('formMsg').textContent=j.error||'Please try again';return}$('formMsg').textContent='Enquiry saved. Opening WhatsApp…';const text=encodeURIComponent(`Hello Shree Steel, I would like a quote.\n\nName: ${data.name}\nPhone: ${data.phone}\nProduct: ${data.product}\nRequirement: ${data.message}`);window.open('https://wa.me/918224899000?text='+text,'_blank');setTimeout(closeQuote,700)});
$('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeQuote()});
function calculateTmt(){
 const q=Number($('calcQty').value),w=Number($('calcBarWeight').value),p=Number($('calcPrice').value);
 if(!Number.isFinite(q)||!Number.isFinite(w)||!Number.isFinite(p)||q<0||w<0||p<0){$('calcWeight').textContent='Enter valid values';$('calcWeightMini').textContent='—';$('calcAmount').textContent='₹0.00';return}
 const totalWeight=q*w,totalAmount=totalWeight*p;
 const kg=totalWeight.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
 $('calcWeight').textContent=kg+' kg';$('calcWeightMini').textContent=kg+' kg';$('calcAmount').textContent='₹'+totalAmount.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});$('calcDetail').textContent=`${q.toLocaleString('en-IN')} bars × ${w.toLocaleString('en-IN',{maximumFractionDigits:3})} kg/bar`;
}
function resetCalculator(){ $('calcQty').value='';$('calcBarWeight').value='';$('calcPrice').value='';$('calcWeight').textContent='0.00 kg';$('calcWeightMini').textContent='0.00 kg';$('calcAmount').textContent='₹0.00';$('calcDetail').textContent='Enter values to calculate'; }
load();
