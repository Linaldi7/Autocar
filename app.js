// app.js - lógica do front (adaptado para API Flask)
// Dependências: agora carrega produtos via fetch da API em http://127.0.0.1:5000/produtos

/* ---------- Helpers ---------- */
function currencyBRL(v){
  return Number(v).toFixed(2).replace('.', ',');
}
function parseCurrency(str){
  return parseFloat(String(str).replace(',', '.')) || 0;
}

/* ---------- Produto cache (fetch) ---------- */
async function ensureProductsLoaded(){
  if(window.PRODUCTS_CACHE && Array.isArray(window.PRODUCTS_CACHE) && window.PRODUCTS_CACHE.length) return window.PRODUCTS_CACHE;
  try{
    const res = await fetch("http://127.0.0.1:5000/produtos");
    if(!res.ok) throw new Error('Falha ao carregar produtos');
    const data = await res.json();
    // mapear campos do backend (pt) para o formato existente no front (en)
    window.PRODUCTS_CACHE = data.map(p => ({
      id: p.id,
      sku: p.sku || '',
      name: p.nome || p.name || '',
      price: p.preco !== undefined ? Number(p.preco) : (p.price || 0),
      category: p.categoria || p.category || '',
      brand: p.marca || p.brand || '',
      stock: p.estoque !== undefined ? Number(p.estoque) : (p.stock || 0),
      images: Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []),
      description: p.descricao || p.description || '',
      specs: p.specs || {},
      compatibility: p.compatibility || p.compatibility || []
    }));
    return window.PRODUCTS_CACHE;
  }catch(err){
    console.error("Erro carregando produtos:", err);
    window.PRODUCTS_CACHE = [];
    return window.PRODUCTS_CACHE;
  }
}

function getProductFromCache(id){
  if(!window.PRODUCTS_CACHE) return null;
  return window.PRODUCTS_CACHE.find(p => Number(p.id) === Number(id)) || null;
}

/* ---------- CARRINHO (localStorage) ---------- */
const CART_KEY = 'autocar_cart_v1';
function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch(e){ return []; }
}
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function clearCart(){ localStorage.removeItem(CART_KEY); }

/* atualiza contador no header */
function updateCartCount(){
  const count = getCart().reduce((s,i)=> s + Number(i.qty), 0);
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
}

/* adicionar item ao carrinho */
async function addToCart(productId, qty=1){
  // garante que produtos estão carregados
  await ensureProductsLoaded();
  const product = getProductFromCache(productId);
  if(!product) return alert('Produto não encontrado');
  if(product.stock <= 0) return alert('Produto sem estoque');

  const cart = getCart();
  const exists = cart.find(i=>Number(i.id) === Number(productId));
  if(exists) exists.qty = Number(exists.qty) + Number(qty);
  else cart.push({ id: Number(productId), qty: Number(qty) });

  saveCart(cart);
  updateCartCount();
  alert('Item adicionado ao carrinho');
}

/* remove um item */
function removeFromCart(productId){
  let cart = getCart();
  cart = cart.filter(item => Number(item.id) !== Number(productId));
  saveCart(cart);
  updateCartCount();
}

/* atualiza qty */
function updateQty(productId, qty){
  const cart = getCart();
  const item = cart.find(i => Number(i.id) === Number(productId));
  if(!item) return;
  item.qty = Number(qty);
  if(item.qty <= 0) removeFromCart(productId);
  else saveCart(cart);
  updateCartCount();
}

/* calcula subtotal e frete simples */
function calculateTotals(){
  const cart = getCart();
  let subtotal = 0;
  for(const item of cart){
    const prod = getProductFromCache(item.id);
    if(!prod) continue;
    subtotal += Number(item.qty) * Number(prod.price);
  }
  const shipping = subtotal > 200 ? 0 : (subtotal === 0 ? 0 : 20.00);
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

/* ---------- RENDER HOME ---------- */
async function renderHomeProducts(){
  const container = document.getElementById('home-product-list');
  if(!container) return;
  await ensureProductsLoaded();
  const top = window.PRODUCTS_CACHE.slice(0,6);
  container.innerHTML = top.map(p => `
    <article class="product-card">
      <img src="${p.images[0] || 'img/placeholder.png'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <div class="sku">${p.sku} • ${p.brand}</div>
      <div class="price">R$ ${currencyBRL(p.price)}</div>
      <div class="actions">
        <a class="btn" href="produto.html?id=${p.id}">Ver produto</a>
        <button class="btn-outline" onclick="addToCart(${p.id},1)">Adicionar</button>
      </div>
    </article>
  `).join('');
}

/* ---------- CATALOG PAGE ---------- */
async function initCatalogPage(){
  await ensureProductsLoaded();
  const q = new URLSearchParams(location.search).get('q') || '';
  const pageSearchEl = document.getElementById('page-search');
  if(pageSearchEl) pageSearchEl.value = q;
  const pageSearchBtn = document.getElementById('page-search-btn');
  if(pageSearchBtn) pageSearchBtn.addEventListener('click', ()=> {
    const term = (document.getElementById('page-search') || {value:''}).value.trim();
    location.search = term ? `?q=${encodeURIComponent(term)}` : '';
  });

  // preencher filtros
  const categories = Array.from(new Set(window.PRODUCTS_CACHE.map(p => p.category))).sort();
  const brands = Array.from(new Set(window.PRODUCTS_CACHE.map(p => p.brand))).sort();
  const catSelect = document.getElementById('filter-category');
  const brandSelect = document.getElementById('filter-brand');
  if(catSelect){
    catSelect.innerHTML = `<option value="">Todas</option>`;
    for(const c of categories) catSelect.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
  }
  if(brandSelect){
    brandSelect.innerHTML = `<option value="">Todas</option>`;
    for(const b of brands) brandSelect.insertAdjacentHTML('beforeend', `<option value="${b}">${b}</option>`);
  }

  // event listeners
  if(document.getElementById('filter-category')) document.getElementById('filter-category').addEventListener('change', ()=> renderCatalog(1));
  if(document.getElementById('filter-brand')) document.getElementById('filter-brand').addEventListener('change', ()=> renderCatalog(1));
  if(document.getElementById('sort-by')) document.getElementById('sort-by').addEventListener('change', ()=> renderCatalog(1));
  const clearBtn = document.getElementById('clear-filters');
  if(clearBtn){
    clearBtn.addEventListener('click', () => {
      if(catSelect) catSelect.value = '';
      if(brandSelect) brandSelect.value = '';
      if(document.getElementById('sort-by')) document.getElementById('sort-by').value = 'relevance';
      if(document.getElementById('page-search')) document.getElementById('page-search').value = '';
      history.replaceState(null,'', 'loja.html');
      renderCatalog(1);
    });
  }

  renderCatalog(1);
}

/* render catalog with pagination */
function renderCatalog(page=1){
  const pageSize = 9;
  const term = (document.getElementById('page-search') || {value:''}).value.trim().toLowerCase();
  const category = (document.getElementById('filter-category') || {value:''}).value;
  const brand = (document.getElementById('filter-brand') || {value:''}).value;
  const sort = (document.getElementById('sort-by') || {value:'relevance'}).value;

  let items = (window.PRODUCTS_CACHE || []).slice();

  if(term){
    items = items.filter(p => (p.name + ' ' + p.sku + ' ' + p.brand).toLowerCase().includes(term));
  }
  if(category) items = items.filter(p => p.category === category);
  if(brand) items = items.filter(p => p.brand === brand);

  if(sort === 'price-asc') items.sort((a,b)=> a.price - b.price);
  if(sort === 'price-desc') items.sort((a,b)=> b.price - a.price);

  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if(page > pages) page = pages;

  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const resultsEl = document.getElementById('catalog-results');
  if(resultsEl) resultsEl.textContent = `${total} produto(s)`;

  const list = document.getElementById('product-list');
  if(list){
    list.innerHTML = pageItems.map(p => `
      <article class="product-card">
        <img src="${p.images[0] || 'img/placeholder.png'}" alt="${p.name}">
        <h3>${p.name}</h3>
        <div class="sku">${p.sku} • ${p.brand}</div>
        <div class="price">R$ ${currencyBRL(p.price)}</div>
        <div class="actions">
          <a class="btn" href="produto.html?id=${p.id}">Ver</a>
          <button class="btn-outline" onclick="addToCart(${p.id},1)">Adicionar</button>
        </div>
      </article>
    `).join('');
  }

  renderPagination(pages, page);
}

/* pagination html */
function renderPagination(pages, current){
  const el = document.getElementById('pagination');
  if(!el) return;
  let html='';
  for(let i=1;i<=pages;i++){
    html += `<button class="btn-outline" onclick="renderCatalog(${i})" ${i===current? 'disabled':''}>${i}</button>`;
  }
  el.innerHTML = html;
}

/* ---------- PRODUCT PAGE ---------- */
async function initProductPage(){
  await ensureProductsLoaded();
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  if(!id) {
    const detailEl = document.getElementById('product-detail');
    if(detailEl) detailEl.innerHTML = '<p>Produto não informado.</p>';
    return;
  }
  // tentar buscar no cache primeiro
  let product = getProductFromCache(id);
  // caso não esteja no cache (improvável), buscar direto da API
  if(!product){
    try{
      const resposta = await fetch(`http://127.0.0.1:5000/produtos/${id}`);
      if(resposta.ok) product = await resposta.json();
      // mapear caso venha em PT
      if(product && product.nome) {
        product = {
          id: product.id,
          sku: product.sku || '',
          name: product.nome || '',
          price: product.preco || 0,
          category: product.categoria || '',
          brand: product.marca || '',
          stock: product.estoque || 0,
          images: product.images || [],
          description: product.descricao || '',
          specs: product.specs || {},
          compatibility: product.compatibility || []
        };
      }
    }catch(e){
      console.error("Erro ao buscar produto individual:", e);
    }
  }
  if(!product){
    const detailEl = document.getElementById('product-detail');
    if(detailEl) detailEl.innerHTML = '<p>Produto não encontrado.</p>';
    return;
  }
  const html = `
    <div class="gallery">
      <img src="${product.images[0] || 'img/placeholder.png'}" alt="${product.name}">
    </div>
    <div class="info">
      <h2>${product.name}</h2>
      <div class="sku">${product.sku} • ${product.brand}</div>
      <div class="price">R$ ${currencyBRL(product.price)}</div>
      <p>${product.description}</p>
      <div class="specs">
        <h4>Especificações</h4>
        <pre>${JSON.stringify(product.specs, null, 2)}</pre>
      </div>
      <div style="margin-top:12px;">
        <label>Quantidade: <input id="prod-qty" type="number" min="1" value="1" style="width:80px;padding:6px;border-radius:6px;border:1px solid #ddd"></label>
        <button class="btn" id="add-cart-btn">Adicionar ao carrinho</button>
      </div>
    </div>
  `;
  const detailEl = document.getElementById('product-detail');
  if(detailEl) detailEl.innerHTML = html;
  const addBtn = document.getElementById('add-cart-btn');
  if(addBtn){
    addBtn.addEventListener('click', () => {
      const qty = Number(document.getElementById('prod-qty').value) || 1;
      addToCart(product.id, qty);
    });
  }
}

/* ---------- CART PAGE ---------- */
function renderCartPage(){
  const container = document.getElementById('cart-container');
  if(!container) return;
  const cart = getCart();
  if(cart.length === 0){
    container.innerHTML = '<p>Seu carrinho está vazio. <a href="loja.html">Voltar para a loja</a></p>';
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    if(subtotalEl) subtotalEl.textContent = '0,00';
    if(shippingEl) shippingEl.textContent = '0,00';
    if(totalEl) totalEl.textContent = '0,00';
    return;
  }

  let html = '<div>';
  for(const item of cart){
    const prod = getProductFromCache(item.id);
    if(!prod) continue;
    const lineTotal = Number(item.qty) * Number(prod.price);
    html += `
      <div class="cart-item">
        <img src="${prod.images[0] || 'img/placeholder.png'}" alt="${prod.name}">
        <div class="meta">
          <div><strong>${prod.name}</strong></div>
          <div class="sku">${prod.sku} • ${prod.brand}</div>
          <div>R$ ${currencyBRL(prod.price)} cada</div>
        </div>
        <div class="qty-control">
          <button class="btn-outline" onclick="updateQty(${prod.id}, ${Math.max(1, item.qty-1)}); renderCartPage();">${'-'}</button>
          <input style="width:48px;text-align:center;padding:6px;border-radius:6px;border:1px solid #ddd" value="${item.qty}" onchange="updateQty(${prod.id}, this.value); renderCartPage();">
          <button class="btn-outline" onclick="updateQty(${prod.id}, ${Number(item.qty)+1}); renderCartPage();">${'+'}</button>
        </div>
        <div style="min-width:120px;text-align:right">
          <div>R$ ${currencyBRL(lineTotal)}</div>
          <button class="btn-outline" style="margin-top:6px" onclick="removeFromCart(${prod.id}); renderCartPage();">Remover</button>
        </div>
      </div>
    `;
  }
  html += '</div>';
  container.innerHTML = html;

  // totals
  const totals = calculateTotals();
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  if(subtotalEl) subtotalEl.textContent = currencyBRL(totals.subtotal);
  if(shippingEl) shippingEl.textContent = currencyBRL(totals.shipping);
  if(totalEl) totalEl.textContent = currencyBRL(totals.total);
}

/* ---------- CHECKOUT PREVIEW ---------- */
function renderCheckoutPreview(){
  const previewItems = document.getElementById('order-items');
  if(!previewItems) return;
  const cart = getCart();
  if(cart.length === 0){
    previewItems.innerHTML = '<p>Sem itens no carrinho.</p>';
    return;
  }
  let html='';
  for(const it of cart){
    const prod = getProductFromCache(it.id);
    if(!prod) continue;
    html += `<div style="display:flex;justify-content:space-between;padding:6px 0">
      <div>${prod.name} x ${it.qty}</div>
      <div>R$ ${currencyBRL(Number(it.qty) * Number(prod.price))}</div>
    </div>`;
  }
  previewItems.innerHTML = html;
  const totals = calculateTotals();
  const sub = document.getElementById('preview-subtotal');
  const ship = document.getElementById('preview-shipping');
  const tot = document.getElementById('preview-total');
  if(sub) sub.textContent = currencyBRL(totals.subtotal);
  if(ship) ship.textContent = currencyBRL(totals.shipping);
  if(tot) tot.textContent = currencyBRL(totals.total);
}

/* ---------- UTILIDADES ---------- */
/* Função global para facilitar uso nos handlers inline */
window.addToCart = addToCart;
window.updateQty = function(id, v){ updateQty(Number(id), Number(v)); renderCartPage(); updateCartCount(); renderCheckoutPreview(); };
window.removeFromCart = function(id){
  const productId = Number(id);
  let cart = getCart();
  cart = cart.filter(item => Number(item.id) !== productId);
  saveCart(cart);
  updateCartCount();
  renderCartPage();
  renderCheckoutPreview();
};

/* Quando a página atual mudar por conteúdo, atualizar footer/cart count e carregar produtos */
document.addEventListener('DOMContentLoaded', async () => {
  updateCartCount();

  // carregar produtos e depois inicializar componentes da página
  await ensureProductsLoaded();

  // detectar páginas e inicializar
  if(document.getElementById('home-product-list')) await renderHomeProducts();
  if(document.getElementById('product-list')) await initCatalogPage();
  if(document.getElementById('product-detail')) await initProductPage();
  if(document.getElementById('cart-container')) renderCartPage();
  if(document.getElementById('order-items')) renderCheckoutPreview();

  // algumas integrações extras podem existir (ex.: forms)
  const form = document.querySelector(".contact-form");
  const popup = document.getElementById("popup");
  const closeBtn = document.getElementById("closePopup");
  if(form){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if(popup) popup.style.display = "flex";
      form.reset();
    });
  }
  if(closeBtn && popup){
    closeBtn.addEventListener("click", () => { popup.style.display = "none"; });
  }
});
