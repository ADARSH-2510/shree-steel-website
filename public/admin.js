(() => {
  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  let tab = "products";
  let products = [],
    brands = [],
    enquiries = [];
  let selectedBrandNames = new Set();

  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>'"]/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[c],
    );
  const arr = (data) =>
    Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];
  const api = async (url, options = {}) => {
    const r = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    let data = {};
    try {
      data = await r.json();
    } catch {}
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  };
  const notify = (msg, error = false) => {
    toast.textContent = msg;
    toast.className = "toast show" + (error ? " error" : "");
    clearTimeout(notify.t);
    notify.t = setTimeout(() => (toast.className = "toast"), 2400);
  };

  async function boot() {
    try {
      const me = await api("/api/admin/me", { headers: {} });
      me.authenticated ? dashboard() : login();
    } catch {
      login();
    }
  }

  function login() {
    app.innerHTML = `<div class="login-wrap"><div class="login-card">
      <img src="/assets/shree-steel-logo.png" alt="Shree Steel">
      <p class="eyebrow">SHREE STEEL</p><h1>Admin Panel</h1>
      <p class="muted">Manage products, trusted brands and customer enquiries.</p>
      <form id="loginForm"><label class="field">Admin password<input id="password" type="password" required autocomplete="current-password"></label><button class="btn blue" style="width:100%">LOGIN</button><p id="loginError" class="meta"></p></form>
    </div></div>`;
    document.getElementById("loginForm").onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({
            password: document.getElementById("password").value,
          }),
        });
        dashboard();
      } catch (err) {
        document.getElementById("loginError").textContent = err.message;
      }
    };
  }

  function dashboard() {
    app.innerHTML = `<header class="top"><div class="brand">SHREE STEEL · ADMIN</div><div class="top-actions"><button class="btn gray" data-action="refresh">Refresh</button><button class="btn gray" data-action="logout">Logout</button></div></header>
      <div class="shell"><aside class="sidebar">
        <button class="nav active" data-tab="products">Products</button><button class="nav" data-tab="brands">Trusted Brands</button><button class="nav" data-tab="enquiries">Enquiries</button><button class="nav" data-tab="dashboard">Overview</button>
      </aside><main class="main"><div id="content"></div></main></div>`;
    document.querySelectorAll("[data-tab]").forEach(
      (b) =>
        (b.onclick = () => {
          tab = b.dataset.tab;
          document
            .querySelectorAll("[data-tab]")
            .forEach((x) =>
              x.classList.toggle("active", x.dataset.tab === tab),
            );
          render();
        }),
    );
    render();
  }

  async function loadAll() {
    const [p, b, e] = await Promise.all([
      api("/api/products", { headers: {} }),
      api("/api/brands", { headers: {} }),
      api("/api/admin/enquiries", { headers: {} }),
    ]);
    products = arr(p);
    brands = arr(b);
    enquiries = arr(e);
  }

  async function render() {
    const c = document.getElementById("content");
    if (!c) return;
    try {
      await loadAll();
    } catch (err) {
      if (/401|Unauthorized/i.test(err.message)) return login();
      c.innerHTML = `<div class="panel"><b>Could not load admin data.</b><p class="meta">${esc(err.message)}</p></div>`;
      return;
    }
    if (tab === "dashboard") return renderOverview(c);
    if (tab === "brands") return renderBrands(c);
    if (tab === "enquiries") return renderEnquiries(c);
    renderProducts(c);
  }

  function renderOverview(c) {
    const newCount = enquiries.filter(
      (x) => String(x.status || "New").toLowerCase() === "new",
    ).length;
    c.innerHTML = `<div class="head"><div><p class="eyebrow">OVERVIEW</p><h1>Catalogue Dashboard</h1></div></div>
      <div class="stats"><div class="stat"><span>Products</span><strong>${products.length}</strong></div><div class="stat"><span>Trusted Brands</span><strong>${brands.length}</strong></div><div class="stat"><span>New Enquiries</span><strong>${newCount}</strong></div><div class="stat"><span>Total Enquiries</span><strong>${enquiries.length}</strong></div></div>
      <div class="panel" style="margin-top:16px"><p class="eyebrow">PRODUCT → BRAND ARCHITECTURE</p><h2>Central catalogue relationships</h2><p class="muted">Products remain the primary catalogue items. Trusted Brands are managed centrally and assigned to products from a controlled selector, while the existing API contract remains compatible.</p></div>`;
  }

  function renderProducts(c) {
    c.innerHTML = `<div class="head"><div><p class="eyebrow">CATALOGUE</p><h1>Products</h1></div><button class="btn blue" data-action="add-product">+ Add Product</button></div>
      <div class="panel"><div class="toolbar"><input id="productSearch" placeholder="Search products, categories or brands"></div><div id="productRows"></div></div>`;
    const draw = () => {
      const q = (
        document.getElementById("productSearch").value || ""
      ).toLowerCase();
      const list = products.filter((p) =>
        `${p.name} ${p.category} ${p.brands} ${p.description}`
          .toLowerCase()
          .includes(q),
      );
      document.getElementById("productRows").innerHTML = list.length
        ? list
            .map(
              (p) => `<div class="record">
        <div><div class="title">${esc(p.name)}</div><div class="meta">${esc(p.category)} · Sort ${Number(p.sort_order || 0)}<br>${esc(p.description || "")}</div>
        <div>${Number(p.available) ? '<span class="badge ok">AVAILABLE</span>' : '<span class="badge warn">OUT OF STOCK</span>'}${String(
          p.brands || "",
        )
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
          .map((b) => `<span class="badge">${esc(b)}</span>`)
          .join("")}</div></div>
        <div class="actions"><button class="btn gray small" data-action="edit-product" data-id="${p.id}">Edit</button><button class="btn danger small" data-action="delete-product" data-id="${p.id}">Delete</button></div></div>`,
            )
            .join("")
        : '<div class="empty">No products found.</div>';
    };
    document.getElementById("productSearch").oninput = draw;
    draw();
  }

  function renderBrands(c) {
    c.innerHTML = `<div class="head"><div><p class="eyebrow">PARTNERS</p><h1>Trusted Brands</h1></div><button class="btn blue" data-action="add-brand">+ Add Brand</button></div>
      <div class="panel"><div class="toolbar"><input id="brandSearch" placeholder="Search brands or categories"></div><div id="brandRows"></div></div>`;
    const draw = () => {
      const q = (
        document.getElementById("brandSearch").value || ""
      ).toLowerCase();
      const list = brands.filter((b) =>
        `${b.name} ${b.category} ${b.description}`.toLowerCase().includes(q),
      );
      document.getElementById("brandRows").innerHTML = list.length
        ? list
            .map(
              (b) =>
                `<div class="record"><div><div class="title">${esc(b.name)}</div><div class="meta">${esc(b.category)} · Sort ${Number(b.sort_order || 0)}<br>${esc(b.description || "")}<br>${esc(b.logo || "No logo path")}</div></div><div class="actions"><button class="btn gray small" data-action="edit-brand" data-id="${b.id}">Edit</button><button class="btn danger small" data-action="delete-brand" data-id="${b.id}">Delete</button></div></div>`,
            )
            .join("")
        : '<div class="empty">No brands found.</div>';
    };
    document.getElementById("brandSearch").oninput = draw;
    draw();
  }

  function renderEnquiries(c) {
    c.innerHTML = `<div class="head"><div><p class="eyebrow">CUSTOMERS</p><h1>Enquiries</h1></div></div><div class="panel">${enquiries.length ? enquiries.map((x) => `<div class="record"><div><div class="title">${esc(x.name)} · ${esc(x.phone)}</div><div class="meta">${esc(x.product)} · ${esc(x.message)}<br>${esc(x.created_at)}</div></div><div class="actions"><select data-action="status-enquiry" data-id="${x.id}">${["New", "Contacted", "Quoted", "Closed"].map((s) => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}</select><button class="btn danger small" data-action="delete-enquiry" data-id="${x.id}">Delete</button></div></div>`).join("") : '<div class="empty">No enquiries yet.</div>'}</div>`;
  }

  function modal(title, type, record = null) {
    selectedBrandNames = new Set(
      String(record?.brands || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    );
    const isProduct = type === "product";
    const brandOptions = brands
      .map(
        (b) =>
          `<button type="button" class="brand-chip ${selectedBrandNames.has(b.name) ? "selected" : ""}" data-brand-name="${esc(b.name)}">${esc(b.name)}</button>`,
      )
      .join("");
    const body = isProduct
      ? `<div class="form-grid"><label class="field">Product name<input id="fName" required value="${esc(record?.name || "")}"></label><label class="field">Category<input id="fCategory" required value="${esc(record?.category || "")}"></label><label class="field full">Description<textarea id="fDescription" rows="4">${esc(record?.description || "")}</textarea></label><div class="full"><label class="field">Trusted brands</label><div class="brand-picker">${brandOptions || '<span class="meta">No brands available yet.</span>'}</div><div class="hint">Select the trusted brands associated with this product.</div></div><label class="field">Availability<select id="fAvailable"><option value="1" ${Number(record?.available ?? 1) ? "selected" : ""}>Available</option><option value="0" ${!Number(record?.available ?? 1) ? "selected" : ""}>Out of stock</option></select></label><label class="field">Sort order<input id="fSort" type="number" min="0" value="${Number(record?.sort_order || 0)}"></label></div>`
      : `<div class="form-grid"><label class="field">Brand name<input id="fName" required value="${esc(record?.name || "")}"></label><label class="field">Category<input id="fCategory" required value="${esc(record?.category || "")}"></label><label class="field full">Description<textarea id="fDescription" rows="4">${esc(record?.description || "")}</textarea></label><label class="field">Accent<input id="fAccent" value="${esc(record?.accent || "#087fe3")}"></label><label class="field">Logo path<input id="fLogo" value="${esc(record?.logo || "")}"></label><label class="field">Sort order<input id="fSort" type="number" min="0" value="${Number(record?.sort_order || 0)}"></label></div>`;
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="backdrop"></div><div class="dialog"><div class="dialog-head"><div><p class="eyebrow">${isProduct ? "PRODUCT CATALOGUE" : "TRUSTED BRANDS"}</p><h2>${title}</h2></div><button class="close" type="button">×</button></div><form id="editor">${body}<div class="dialog-actions"><button type="button" class="btn gray" id="cancel">Cancel</button><button class="btn blue">Save</button></div></form></div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.querySelector(".close").onclick = close;
    m.querySelector("#cancel").onclick = close;
    m.querySelector(".backdrop").onclick = close;
    m.querySelectorAll("[data-brand-name]").forEach(
      (b) =>
        (b.onclick = () => {
          const n = b.dataset.brandName;
          if (selectedBrandNames.has(n)) {
            selectedBrandNames.delete(n);
            b.classList.remove("selected");
          } else {
            selectedBrandNames.add(n);
            b.classList.add("selected");
          }
        }),
    );
    m.querySelector("#editor").onsubmit = async (e) => {
      e.preventDefault();
      const id = record?.id;
      try {
        if (isProduct) {
          const payload = {
            name: m.querySelector("#fName").value.trim(),
            category: m.querySelector("#fCategory").value.trim(),
            brands: [...selectedBrandNames].join(", "),
            description: m.querySelector("#fDescription").value.trim(),
            available: Number(m.querySelector("#fAvailable").value),
            sort_order: Number(m.querySelector("#fSort").value) || 0,
          };
          if (!payload.name || !payload.category)
            throw new Error("Product name and category are required");
          await api(id ? `/api/admin/products/${id}` : "/api/admin/products", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload),
          });
        } else {
          const payload = {
            name: m.querySelector("#fName").value.trim(),
            category: m.querySelector("#fCategory").value.trim(),
            description: m.querySelector("#fDescription").value.trim(),
            accent: m.querySelector("#fAccent").value.trim() || "#087fe3",
            logo: m.querySelector("#fLogo").value.trim(),
            sort_order: Number(m.querySelector("#fSort").value) || 0,
          };
          if (!payload.name || !payload.category)
            throw new Error("Brand name and category are required");
          await api(id ? `/api/admin/brands/${id}` : "/api/admin/brands", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload),
          });
        }
        close();
        notify(id ? "Updated successfully." : "Added successfully.");
        await render();
      } catch (err) {
        notify(err.message, true);
      }
    };
  }

  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action,
      id = Number(el.dataset.id);
    try {
      if (action === "logout") {
        await api("/api/admin/logout", { method: "POST" });
        return login();
      }
      if (action === "refresh") return render();
      if (action === "add-product") return modal("Add Product", "product");
      if (action === "add-brand") return modal("Add Brand", "brand");
      if (action === "edit-product") {
        const p = products.find((x) => Number(x.id) === id);
        if (p) modal("Edit Product", "product", p);
        return;
      }
      if (action === "edit-brand") {
        const b = brands.find((x) => Number(x.id) === id);
        if (b) modal("Edit Brand", "brand", b);
        return;
      }
      if (action === "delete-product") {
        if (confirm("Delete this product? This cannot be undone.")) {
          await api("/api/admin/products/" + id, { method: "DELETE" });
          notify("Product deleted.");
          await render();
        }
        return;
      }
      if (action === "delete-brand") {
        if (confirm("Delete this brand? This cannot be undone.")) {
          await api("/api/admin/brands/" + id, { method: "DELETE" });
          notify("Brand deleted.");
          await render();
        }
        return;
      }
      if (action === "delete-enquiry") {
        if (confirm("Delete this enquiry? This cannot be undone.")) {
          await api("/api/admin/enquiries/" + id, { method: "DELETE" });
          notify("Enquiry deleted.");
          await render();
        }
        return;
      }
    } catch (err) {
      notify(err.message, true);
    }
  });

  document.addEventListener("change", async (e) => {
    if (e.target.dataset.action !== "status-enquiry") return;
    try {
      await api("/api/admin/enquiries/" + Number(e.target.dataset.id), {
        method: "PATCH",
        body: JSON.stringify({ status: e.target.value }),
      });
      notify("Status updated.");
    } catch (err) {
      notify(err.message, true);
    }
  });

  boot();
})();
