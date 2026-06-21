(function () {
  const nativeFetch = window.fetch.bind(window);
  const json = (body, init = {}) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status: init.status || 200,
        headers: { "content-type": "application/json" },
      })
    );

  async function dashboardSummary() {
    try {
      const response = await nativeFetch("/.netlify/functions/dashboard?t=" + Date.now(), {
        cache: "no-store",
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      try {
        const fallback = await nativeFetch("/sample-dashboard.json?t=" + Date.now(), {
          cache: "no-store",
        });
        if (!fallback.ok) return null;
        return await fallback.json();
      } catch {
        return null;
      }
    }
  }

  window.fetch = async function patchedFetch(input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    const method = (init && init.method ? init.method : "GET").toUpperCase();
    if (!url || typeof url !== "string" || !url.startsWith("/api/")) {
      return nativeFetch(input, init);
    }

    if (url === "/api/auth/status" || url === "/api/auth/me") {
      return json({ authenticated: false, user: null, hasUsers: false });
    }

    if (url === "/api/auth/login" || url === "/api/auth/register") {
      return json({
        ok: false,
        authenticated: false,
        message: "Auth backend is not connected in this deploy.",
      }, { status: 200 });
    }

    if (url === "/api/alerts" && method === "GET") {
      const data = await dashboardSummary();
      const manual = data && data.summary ? data.summary.manualCheckRequiredCount : 0;
      const best = data && data.summary ? data.summary.bestScore : 0;
      return json({
        unread: manual > 0 ? 1 : 0,
        alerts: manual > 0 ? [{
          id: "seller-central-checks",
          severity: "warning",
          category: "opportunity",
          title: `${manual} Seller Central checks needed`,
          body: `Best score is ${best}/100. Validate gating, brand, IP, and hazmat before buying inventory.`,
          recommendation: "Work the top leads first, then save or reject each product.",
          read: false,
          created_at: new Date().toISOString(),
        }] : [],
      });
    }

    if (url.startsWith("/api/alerts/") || url === "/api/alerts/read-all") {
      return json({ ok: true });
    }

    if (url.startsWith("/api/pnl")) {
      const data = await dashboardSummary();
      const revenue = data && data.products
        ? data.products.slice(0, 10).reduce((sum, p) => sum + (p.estimatedRevenue || 0), 0)
        : 0;
      const profit = data && data.products
        ? data.products.slice(0, 10).reduce((sum, p) => sum + ((p.profitability && p.profitability.netProfit) || 0) * Math.min(p.estimatedMonthlySales || 0, 25), 0)
        : 0;
      return json({
        revenue,
        ad_spend: 0,
        net_profit: profit,
        revenue_trend: 0,
        profit_trend: 0,
        mode: "estimated_from_research",
      });
    }

    if (url === "/api/suppliers" && method === "GET") {
      const data = await dashboardSummary();
      const suppliers = [];
      if (data && data.products) {
        for (const product of data.products.slice(0, 20)) {
          for (const supplier of (product.suppliers || []).slice(0, 2)) {
            suppliers.push({ ...supplier, product_name: product.name });
          }
        }
      }
      return json({ suppliers });
    }

    if (url.startsWith("/api/suppliers/")) {
      return json({ ok: true, saved: true });
    }

    if (url.startsWith("/api/generate-po/")) {
      const id = decodeURIComponent(url.split("/").pop() || "product");
      return json({
        ok: true,
        productId: id,
        poNumber: "AZF-" + Date.now().toString().slice(-6),
        status: "draft",
        note: "Draft PO generated from local AZ Finds estimate data. Confirm supplier terms before sending.",
      });
    }

    if (url.startsWith("/api/generate-supplier-email/")) {
      const id = decodeURIComponent(url.split("/").pop().split("?")[0] || "product");
      return json({
        ok: true,
        productId: id,
        subject: "Sample and wholesale quote request",
        body: "Hi, I am evaluating this item for a small test order. Please confirm exact product specs, MOQ, sample cost, lead time, packaging options, and landed cost to the United States.",
      });
    }

    if (url === "/api/maximus" || url === "/api/agent/trigger") {
      return json({
        ok: true,
        message: "MAXIMUS fallback is running from the current dashboard payload.",
        response: "Validate Seller Central eligibility, confirm exact supplier match, check margin after landed cost, then run a small sample/test order before scaling.",
      });
    }

    if (url.startsWith("/api/tasks")) return json({ tasks: [], count: 0, ok: true });
    if (url.startsWith("/api/agent/")) return json({ running: false, history: [], total: 0 });
    if (url.startsWith("/api/research/")) return json({ total: 0, products: [], categories: [] });
    if (url.startsWith("/api/marketplace/")) return json({ connected: false, ok: false });
    if (url.startsWith("/api/seo/")) return json([]);

    return nativeFetch(input, init);
  };
})();
