const PRODUCTS = window.VELORA_PRODUCTS;
const CATEGORIES = window.VELORA_CATEGORIES;
const STORAGE_KEY = "velora-store-v1";
const TAX_RATE = 0.085;
const SHIPPING = 8;
const FREE_SHIP = 120;
const PROMOS = {
  VELORA10: { type: "percent", value: 10, label: "10% off" },
  WELCOME15: { type: "percent", value: 15, label: "15% off" },
  FREESHIP: { type: "shipping", value: 0, label: "Free shipping" }
};

const icons = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
  bag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z"/></svg>`,
  heartFill: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>`
};

const state = loadState();
const ui = {
  searchOpen: false,
  menuOpen: false,
  search: "",
  sort: "featured",
  gallery: 0,
  qty: 1,
  color: "",
  size: "",
  toasts: []
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cart: parsed.cart || [],
        wishlist: parsed.wishlist || [],
        orders: parsed.orders || [],
        promo: parsed.promo || "",
        newsletter: parsed.newsletter || false
      };
    }
  } catch (e) {}
  return { cart: [], wishlist: [], orders: [], promo: "", newsletter: false };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cart: state.cart,
    wishlist: state.wishlist,
    orders: state.orders,
    promo: state.promo,
    newsletter: state.newsletter
  }));
}

function toast(message) {
  const id = Date.now() + Math.random();
  ui.toasts.push({ id, message });
  renderToasts();
  setTimeout(() => {
    ui.toasts = ui.toasts.filter((t) => t.id !== id);
    renderToasts();
  }, 2400);
}

function money(n) {
  return `$${n.toFixed(2)}`;
}

function productById(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartLines() {
  return state.cart.map((item) => {
    const product = productById(item.id);
    return { ...item, product, lineTotal: product ? product.price * item.qty : 0 };
  }).filter((l) => l.product);
}

function totals() {
  const subtotal = cartLines().reduce((s, l) => s + l.lineTotal, 0);
  const promo = PROMOS[state.promo];
  let discount = 0;
  let shipping = subtotal >= FREE_SHIP || subtotal === 0 ? 0 : SHIPPING;
  if (promo?.type === "percent") discount = subtotal * (promo.value / 100);
  if (promo?.type === "shipping") shipping = 0;
  const taxed = Math.max(0, subtotal - discount);
  const tax = taxed * TAX_RATE;
  return { subtotal, discount, shipping, tax, total: taxed + shipping + tax, promo };
}

function route() {
  const raw = (location.hash || "#/").replace(/^#/, "") || "/";
  const [pathPart, queryPart] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const params = new URLSearchParams(queryPart || "");
  return { name: parts[0] || "home", id: parts[1] || "", params, parts };
}

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function header() {
  const r = route();
  const nav = [
    ["home", "#/", "Home"],
    ["shop", "#/shop", "Shop"],
    ["about", "#/about", "About"],
    ["orders", "#/orders", "Orders"]
  ];
  return `
    <div class="announcement">Complimentary shipping on orders over $120 · Code VELORA10 for 10% off</div>
    <header class="header">
      <div class="header-inner">
        <button class="icon-btn menu-btn" data-action="menu" aria-label="Open menu">${icons.menu}</button>
        <a class="logo" href="#/">VELORA</a>
        <nav class="nav">
          ${nav.map(([key, href, label]) => `<a class="${r.name === key || (key === "home" && r.name === "home") ? "active" : ""}" href="${href}">${label}</a>`).join("")}
        </nav>
        <div class="header-actions">
          <button class="icon-btn" data-action="search" aria-label="Search">${icons.search}</button>
          <a class="icon-btn" href="#/wishlist" aria-label="Wishlist">${icons.heart}${state.wishlist.length ? `<span class="badge">${state.wishlist.length}</span>` : ""}</a>
          <a class="icon-btn" href="#/cart" aria-label="Cart">${icons.bag}${cartCount() ? `<span class="badge">${cartCount()}</span>` : ""}</a>
        </div>
      </div>
    </header>
  `;
}

function footer() {
  return `
    <footer class="footer">
      <div class="footer-inner">
        <div>
          <div class="logo">VELORA</div>
          <p>Contemporary essentials — clothing, objects, and quiet jewelry made to last.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <a href="#/shop">All products</a>
          <a href="#/shop?cat=Apparel">Apparel</a>
          <a href="#/shop?cat=Bags">Bags</a>
          <a href="#/shop?cat=Home">Home</a>
        </div>
        <div>
          <h4>Help</h4>
          <a href="#/about">Our story</a>
          <a href="#/orders">Order history</a>
          <a href="#/cart">Your bag</a>
        </div>
        <div>
          <h4>Visit</h4>
          <p>12 Mercer Lane<br>Studio 4, Brooklyn NY</p>
          <p>hello@velora.store</p>
        </div>
      </div>
      <div class="copy">© ${new Date().getFullYear()} Velora. Demo boutique — checkout is fully functional on this device, with no live card charges.</div>
    </footer>
  `;
}

function productCard(p) {
  const loved = state.wishlist.includes(p.id);
  return `
    <article class="product-card">
      <a class="thumb" href="#/product/${p.id}">
        ${p.badge ? `<span class="pill">${p.badge}</span>` : ""}
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </a>
      <button class="wish-mini ${loved ? "loved" : ""}" data-action="wish" data-id="${p.id}" aria-label="Wishlist">${loved ? icons.heartFill : icons.heart}</button>
      <div class="meta">
        <div class="cat">${p.category}</div>
        <h3><a href="#/product/${p.id}">${p.name}</a></h3>
        <div class="price">
          <span class="now">${money(p.price)}</span>
          ${p.originalPrice ? `<span class="was">${money(p.originalPrice)}</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function homePage() {
  const featured = PRODUCTS.filter((p) => p.featured);
  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="kicker">Fall collection · 2026</div>
        <h1>Clothes and objects with a slower pulse.</h1>
        <p>A small boutique of silk, leather, and handmade homeware. Browse, bag, and checkout — then send this link to anyone.</p>
        <div>
          <a class="btn btn-primary" href="#/shop">Shop the edit</a>
          <a class="btn btn-ghost" href="#/about" style="margin-left:8px">Our story</a>
        </div>
      </div>
      <div class="hero-media">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80" alt="Velora lookbook">
        <div class="hero-chip">New in: Tailored Wool Overcoat · $340</div>
      </div>
    </section>
    <div class="section-head">
      <div>
        <h2>Shop by room</h2>
        <p>Four shelves. Everything we make.</p>
      </div>
    </div>
    <div class="cats">
      ${CATEGORIES.map((c) => `
        <a class="cat-card" href="#/shop?cat=${encodeURIComponent(c.id)}">
          <img src="${c.image}" alt="${c.label}" loading="lazy">
          <span><strong>${c.label}</strong><em>${c.copy}</em></span>
        </a>
      `).join("")}
    </div>
    <div class="section-head">
      <div>
        <h2>This week’s edit</h2>
        <p>Pieces the studio is wearing and gifting.</p>
      </div>
      <a class="btn btn-ghost" href="#/shop">View all</a>
    </div>
    <div class="grid">${featured.map(productCard).join("")}</div>
    <section class="editorial">
      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80" alt="Atelier">
      <div class="editorial-copy">
        <div class="kicker" style="color:#e7dccb">Atelier notes</div>
        <h2>Made in small batches, finished by hand.</h2>
        <p>We work with a handful of mills and makers. When a run sells out, we wait for the next one rather than rush a copy.</p>
        <a class="btn btn-ghost" href="#/about" style="border-color:#f4efe6;color:#f4efe6;width:fit-content;margin-top:18px">Read the story</a>
      </div>
    </section>
    <div class="quotes">
      <div class="quote"><p>“The tote is already scuffed in the best way. This is the bag I take everywhere.”</p><span>— Priya, Brooklyn</span></div>
      <div class="quote"><p>“Finally a blouse that looks expensive and actually washes like a dream.”</p><span>— Elise, London</span></div>
      <div class="quote"><p>“Candle lasted the whole month. The vase is staying on the table indefinitely.”</p><span>— Marco, Lisbon</span></div>
    </div>
    <section class="newsletter">
      <div>
        <h2>10% off your first order</h2>
        <p>Join the list. We write once a month, if that.</p>
      </div>
      <form data-form="newsletter">
        <input type="email" name="email" required placeholder="Email address" aria-label="Email">
        <button class="btn btn-clay" type="submit">Sign up</button>
      </form>
    </section>
  `;
}

function shopPage() {
  const r = route();
  const cat = r.params.get("cat") || "all";
  const q = (r.params.get("q") || "").toLowerCase();
  let items = PRODUCTS.filter((p) => (cat === "all" || p.category === cat) && (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
  if (ui.sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
  if (ui.sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
  if (ui.sort === "name") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const cats = ["all", ...new Set(PRODUCTS.map((p) => p.category))];
  return `
    <div class="section-head">
      <div>
        <div class="kicker">Catalog</div>
        <h2>${cat === "all" ? "All products" : cat}</h2>
        <p>${items.length} piece${items.length === 1 ? "" : "s"}</p>
      </div>
    </div>
    <div class="toolbar">
      ${cats.map((c) => `<a class="chip ${cat === c ? "on" : ""}" href="#/shop${c === "all" ? "" : `?cat=${encodeURIComponent(c)}`}">${c === "all" ? "All" : c}</a>`).join("")}
      <div class="grow">
        <label>
          <select data-action="sort">
            <option value="featured" ${ui.sort === "featured" ? "selected" : ""}>Featured</option>
            <option value="price-asc" ${ui.sort === "price-asc" ? "selected" : ""}>Price: low to high</option>
            <option value="price-desc" ${ui.sort === "price-desc" ? "selected" : ""}>Price: high to low</option>
            <option value="name" ${ui.sort === "name" ? "selected" : ""}>Name</option>
          </select>
        </label>
      </div>
    </div>
    ${items.length ? `<div class="grid">${items.map(productCard).join("")}</div>` : `<div class="empty"><h2>Nothing here yet</h2><p>Try another category or search.</p></div>`}
  `;
}

function productPage() {
  const p = productById(route().id);
  if (!p) return `<div class="empty"><h2>Product not found</h2><a class="btn btn-primary" href="#/shop">Back to shop</a></div>`;
  const color = ui.color || p.colors[0];
  const size = ui.size || p.sizes[0];
  const img = p.images[ui.gallery] || p.image;
  const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const loved = state.wishlist.includes(p.id);
  const shareText = encodeURIComponent(`Look at ${p.name} on Velora — ${location.href.split("#")[0]}#/product/${p.id}`);
  return `
    <article class="pdp">
      <div class="gallery">
        <div class="thumbs">
          ${p.images.map((src, i) => `<button class="${i === ui.gallery ? "on" : ""}" data-action="gallery" data-index="${i}"><img src="${src}" alt=""></button>`).join("")}
        </div>
        <div class="main-shot"><img src="${img}" alt="${p.name}"></div>
      </div>
      <div>
        <div class="kicker">${p.category}${p.badge ? ` · ${p.badge}` : ""}</div>
        <h1 style="font-family:var(--serif);font-size:48px;line-height:.95;margin:8px 0 10px;font-weight:500">${p.name}</h1>
        <div class="price" style="font-size:22px;margin-bottom:8px">
          <span class="now">${money(p.price)}</span>
          ${p.originalPrice ? `<span class="was">${money(p.originalPrice)}</span>` : ""}
        </div>
        <div class="stars">${stars(p.rating)} <span style="color:var(--muted);letter-spacing:0">${p.rating} · ${p.reviews} reviews</span></div>
        <p style="color:var(--ink-soft)">${p.description}</p>
        <div class="opt-label">Color · ${color}</div>
        <div class="swatches">${p.colors.map((c) => `<button class="swatch ${c === color ? "on" : ""}" data-action="color" data-value="${c}">${c}</button>`).join("")}</div>
        <div class="opt-label">Size · ${size}</div>
        <div class="sizes">${p.sizes.map((s) => `<button class="size ${s === size ? "on" : ""}" data-action="size" data-value="${s}">${s}</button>`).join("")}</div>
        <div class="qty-row">
          <div class="qty">
            <button data-action="qty" data-delta="-1" aria-label="Decrease">−</button>
            <span>${ui.qty}</span>
            <button data-action="qty" data-delta="1" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="pdp-actions">
          <button class="btn btn-primary" data-action="add" data-id="${p.id}">Add to bag</button>
          <button class="btn btn-ghost" data-action="wish" data-id="${p.id}">${loved ? "Saved" : "Save"}</button>
          <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${shareText}">Share</a>
        </div>
        <div class="details">
          <strong>Details</strong>
          <ul>${p.details.map((d) => `<li>${d}</li>`).join("")}</ul>
        </div>
      </div>
    </article>
    <div class="section-head" style="margin-top:56px"><div><h2>You may also like</h2></div></div>
    <div class="grid">${related.map(productCard).join("")}</div>
  `;
}

function summaryBox(ctaHref, ctaLabel, extra = "") {
  const t = totals();
  return `
    <aside class="summary">
      <h3>Summary</h3>
      <div class="row"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
      <div class="row"><span>Discount ${t.promo ? `(${state.promo})` : ""}</span><span>−${money(t.discount)}</span></div>
      <div class="row"><span>Shipping</span><span>${t.shipping === 0 ? "Free" : money(t.shipping)}</span></div>
      <div class="row"><span>Tax</span><span>${money(t.tax)}</span></div>
      <div class="row total"><span>Total</span><span>${money(t.total)}</span></div>
      <form class="promo" data-form="promo">
        <input name="code" placeholder="Promo code" value="${state.promo}" aria-label="Promo code">
        <button class="btn btn-ghost" type="submit">Apply</button>
      </form>
      ${extra}
      ${ctaHref ? `<a class="btn btn-primary btn-block" href="${ctaHref}">${ctaLabel}</a>` : ""}
    </aside>
  `;
}

function cartPage() {
  const lines = cartLines();
  if (!lines.length) {
    return `<div class="empty"><h2>Your bag is empty</h2><p>The silk blouse and the tote are a good place to start.</p><a class="btn btn-primary" href="#/shop">Continue shopping</a></div>`;
  }
  return `
    <div class="section-head"><div><h2>Your bag</h2><p>${cartCount()} item${cartCount() === 1 ? "" : "s"}</p></div></div>
    <div class="cart-layout">
      <div>
        ${lines.map((l, i) => `
          <div class="line">
            <a href="#/product/${l.product.id}"><img src="${l.product.image}" alt="${l.product.name}"></a>
            <div>
              <h3><a href="#/product/${l.product.id}">${l.product.name}</a></h3>
              <div class="sub">${l.color} · ${l.size}</div>
              <div class="qty" style="margin-top:10px;width:fit-content">
                <button data-action="cart-qty" data-index="${i}" data-delta="-1">−</button>
                <span>${l.qty}</span>
                <button data-action="cart-qty" data-index="${i}" data-delta="1">+</button>
              </div>
              <button class="remove" data-action="remove" data-index="${i}">Remove</button>
            </div>
            <div><strong>${money(l.lineTotal)}</strong></div>
          </div>
        `).join("")}
      </div>
      ${summaryBox("#/checkout", "Checkout")}
    </div>
  `;
}

function checkoutPage() {
  if (!cartLines().length) {
    location.hash = "#/cart";
    return "";
  }
  return `
    <div class="section-head"><div><h2>Checkout</h2><p>Demo store — no real payment is taken.</p></div></div>
    <div class="checkout-layout">
      <form class="fields" data-form="checkout">
        <h3 style="margin:0;font-family:var(--serif);font-size:28px;font-weight:500">Contact & shipping</h3>
        <div class="two">
          <div class="field"><label>First name</label><input name="first" required></div>
          <div class="field"><label>Last name</label><input name="last" required></div>
        </div>
        <div class="field"><label>Email</label><input type="email" name="email" required></div>
        <div class="field"><label>Phone</label><input name="phone" required placeholder="+1 555 0100"></div>
        <div class="field"><label>Address</label><input name="address" required></div>
        <div class="two">
          <div class="field"><label>City</label><input name="city" required></div>
          <div class="field"><label>Postal code</label><input name="zip" required></div>
        </div>
        <div class="field">
          <label>Country</label>
          <select name="country"><option>United States</option><option>United Kingdom</option><option>India</option><option>Canada</option><option>Australia</option></select>
        </div>
        <h3 style="margin:12px 0 0;font-family:var(--serif);font-size:28px;font-weight:500">Payment</h3>
        <div class="field"><label>Name on card</label><input name="cardName" required></div>
        <div class="field"><label>Card number</label><input name="card" required placeholder="4242 4242 4242 4242" maxlength="19"></div>
        <div class="two">
          <div class="field"><label>Expiry</label><input name="exp" required placeholder="MM/YY" maxlength="5"></div>
          <div class="field"><label>CVC</label><input name="cvc" required placeholder="123" maxlength="4"></div>
        </div>
        <button class="btn btn-primary" type="submit">Place order · ${money(totals().total)}</button>
      </form>
      ${summaryBox("", "")}
    </div>
  `;
}

function successPage() {
  const order = state.orders.find((o) => o.id === route().id);
  if (!order) return `<div class="empty"><h2>Order not found</h2><a class="btn btn-primary" href="#/shop">Shop</a></div>`;
  return `
    <div class="success">
      <div class="kicker">Order confirmed</div>
      <h1>Thank you, ${order.customer.first}.</h1>
      <p>Your order <strong>${order.id}</strong> is saved on this device. A confirmation would go to ${order.customer.email}.</p>
      <div class="order-box">
        ${order.items.map((i) => `<div class="row"><span>${i.name} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join("")}
        <div class="row total"><span>Total</span><span>${money(order.total)}</span></div>
        <p class="sub">Ships to ${order.customer.address}, ${order.customer.city}</p>
      </div>
      <a class="btn btn-primary" href="#/shop">Keep shopping</a>
      <a class="btn btn-ghost" href="#/orders" style="margin-left:8px">View orders</a>
    </div>
  `;
}

function ordersPage() {
  if (!state.orders.length) {
    return `<div class="empty"><h2>No orders yet</h2><p>Once you checkout, they will appear here on this browser.</p><a class="btn btn-primary" href="#/shop">Shop now</a></div>`;
  }
  return `
    <div class="section-head"><div><h2>Orders</h2><p>Saved on this device</p></div></div>
    ${state.orders.map((o) => `
      <div class="order-box" style="max-width:none;margin:0 0 14px">
        <div class="row"><strong>${o.id}</strong><span>${new Date(o.date).toLocaleString()}</span></div>
        ${o.items.map((i) => `<div class="row"><span>${i.name} × ${i.qty}</span><span>${money(i.price * i.qty)}</span></div>`).join("")}
        <div class="row total"><span>Total</span><span>${money(o.total)}</span></div>
      </div>
    `).join("")}
  `;
}

function wishlistPage() {
  const items = PRODUCTS.filter((p) => state.wishlist.includes(p.id));
  if (!items.length) return `<div class="empty"><h2>Nothing saved</h2><p>Tap the heart on a product to keep it here.</p><a class="btn btn-primary" href="#/shop">Browse</a></div>`;
  return `<div class="section-head"><div><h2>Saved</h2><p>${items.length} piece${items.length === 1 ? "" : "s"}</p></div></div><div class="grid">${items.map(productCard).join("")}</div>`;
}

function aboutPage() {
  return `
    <section class="about">
      <div>
        <div class="kicker">Since 2021</div>
        <h1>A boutique that still feels like a studio.</h1>
        <p>Velora began as a weekend rack in a Brooklyn loft. We still design in the same room: fewer pieces, better cloth, packaging you can reuse.</p>
        <p>This site is a live storefront you can share. Add to bag, apply VELORA10 or WELCOME15, and check out. Orders stay in the browser so anyone with the link can try the full flow.</p>
        <a class="btn btn-primary" href="#/shop">Shop the collection</a>
      </div>
      <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80" alt="Studio">
    </section>
  `;
}

function overlays() {
  let html = "";
  if (ui.searchOpen) {
    const q = ui.search.trim().toLowerCase();
    const hits = q ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8) : PRODUCTS.slice(0, 5);
    html += `
      <div class="overlay" data-action="close-search">
        <div class="search-panel" onclick="event.stopPropagation()">
          <div class="search-field"><input data-action="search-input" placeholder="Search silk, tote, candle…" value="${ui.search}" autofocus></div>
          ${hits.map((p) => `<a class="search-result" href="#/product/${p.id}" data-action="close-search"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><div class="sub">${p.category}</div></div><span>${money(p.price)}</span></a>`).join("")}
        </div>
      </div>`;
  }
  if (ui.menuOpen) {
    html += `
      <div class="overlay" data-action="close-menu">
        <nav class="mobile-nav" onclick="event.stopPropagation()">
          <button class="icon-btn" data-action="close-menu" aria-label="Close">${icons.close}</button>
          <a href="#/" data-action="close-menu">Home</a>
          <a href="#/shop" data-action="close-menu">Shop</a>
          <a href="#/about" data-action="close-menu">About</a>
          <a href="#/orders" data-action="close-menu">Orders</a>
          <a href="#/wishlist" data-action="close-menu">Saved</a>
        </nav>
      </div>`;
  }
  return html;
}

function renderToasts() {
  const el = document.getElementById("toasts");
  if (el) el.innerHTML = ui.toasts.map((t) => `<div class="toast">${t.message}</div>`).join("");
}

function page() {
  const r = route();
  if (r.name === "shop") return shopPage();
  if (r.name === "product") return productPage();
  if (r.name === "cart") return cartPage();
  if (r.name === "checkout") return checkoutPage();
  if (r.name === "success") return successPage();
  if (r.name === "orders") return ordersPage();
  if (r.name === "wishlist") return wishlistPage();
  if (r.name === "about") return aboutPage();
  return homePage();
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = `${header()}<main class="page">${page()}</main>${footer()}${overlays()}`;
  renderToasts();
  const search = app.querySelector("[data-action=search-input]");
  if (search) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
}

function addToCart(id) {
  const p = productById(id);
  if (!p) return;
  const color = ui.color || p.colors[0];
  const size = ui.size || p.sizes[0];
  const existing = state.cart.find((i) => i.id === id && i.color === color && i.size === size);
  if (existing) existing.qty += ui.qty;
  else state.cart.push({ id, color, size, qty: ui.qty });
  saveState();
  toast(`${p.name} added to bag`);
  ui.qty = 1;
  render();
}

function toggleWish(id) {
  if (state.wishlist.includes(id)) state.wishlist = state.wishlist.filter((x) => x !== id);
  else state.wishlist.push(id);
  saveState();
  render();
}

function placeOrder(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const card = data.card.replace(/\s/g, "");
  if (card.length < 13) {
    toast("Enter a valid card number (try 4242 4242 4242 4242)");
    return;
  }
  const t = totals();
  const order = {
    id: "VL-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    date: Date.now(),
    customer: data,
    items: cartLines().map((l) => ({ id: l.id, name: l.product.name, qty: l.qty, price: l.product.price, color: l.color, size: l.size })),
    total: t.total,
    promo: state.promo
  };
  state.orders.unshift(order);
  state.cart = [];
  saveState();
  location.hash = `#/success/${order.id}`;
}

document.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  if (action === "search") { ui.searchOpen = true; render(); }
  if (action === "close-search") { ui.searchOpen = false; render(); }
  if (action === "menu") { ui.menuOpen = true; render(); }
  if (action === "close-menu") { ui.menuOpen = false; render(); }
  if (action === "wish") { e.preventDefault(); toggleWish(actionEl.dataset.id); }
  if (action === "add") addToCart(actionEl.dataset.id);
  if (action === "gallery") { ui.gallery = Number(actionEl.dataset.index); render(); }
  if (action === "color") { ui.color = actionEl.dataset.value; render(); }
  if (action === "size") { ui.size = actionEl.dataset.value; render(); }
  if (action === "qty") {
    ui.qty = Math.max(1, ui.qty + Number(actionEl.dataset.delta));
    render();
  }
  if (action === "cart-qty") {
    const item = state.cart[Number(actionEl.dataset.index)];
    if (!item) return;
    item.qty = Math.max(1, item.qty + Number(actionEl.dataset.delta));
    saveState();
    render();
  }
  if (action === "remove") {
    state.cart.splice(Number(actionEl.dataset.index), 1);
    saveState();
    render();
  }
});

document.addEventListener("input", (e) => {
  if (e.target.dataset.action === "search-input") {
    ui.search = e.target.value;
    const panel = document.querySelector(".search-panel");
    if (!panel) return;
    const q = ui.search.trim().toLowerCase();
    const hits = q ? PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8) : PRODUCTS.slice(0, 5);
    const field = panel.querySelector(".search-field").outerHTML;
    panel.innerHTML = field + hits.map((p) => `<a class="search-result" href="#/product/${p.id}" data-action="close-search"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><div class="sub">${p.category}</div></div><span>${money(p.price)}</span></a>`).join("");
    const input = panel.querySelector("input");
    input.focus();
    input.value = ui.search;
    input.setSelectionRange(ui.search.length, ui.search.length);
  }
  if (e.target.dataset.action === "sort") {
    ui.sort = e.target.value;
    render();
  }
});

document.addEventListener("change", (e) => {
  if (e.target.dataset.action === "sort") {
    ui.sort = e.target.value;
    render();
  }
});

document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-form]");
  if (!form) return;
  e.preventDefault();
  if (form.dataset.form === "promo") {
    const code = new FormData(form).get("code").toString().trim().toUpperCase();
    if (PROMOS[code]) {
      state.promo = code;
      saveState();
      toast(`${PROMOS[code].label} applied`);
    } else {
      state.promo = "";
      saveState();
      toast("Code not recognized");
    }
    render();
  }
  if (form.dataset.form === "newsletter") {
    state.newsletter = true;
    saveState();
    toast("You’re on the list. Use WELCOME15 at checkout.");
    form.reset();
  }
  if (form.dataset.form === "checkout") placeOrder(form);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    ui.searchOpen = false;
    ui.menuOpen = false;
    render();
  }
});

window.addEventListener("hashchange", () => {
  ui.gallery = 0;
  ui.qty = 1;
  ui.color = "";
  ui.size = "";
  ui.searchOpen = false;
  ui.menuOpen = false;
  render();
  window.scrollTo(0, 0);
});

render();
