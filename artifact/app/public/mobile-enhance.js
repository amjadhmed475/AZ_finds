(function () {
  const STORE_KEY = "azfinds_mobile_operator_state_v2";
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { saved: {}, rejected: {}, validated: {} }; }
    catch { return { saved: {}, rejected: {}, validated: {} }; }
  };
  const writeState = (s) => localStorage.setItem(STORE_KEY, JSON.stringify(s));

  let state = readState();
  let products = [];
  let activeTab = "today";
  let activeFilter = "all";
  let activeSort = "fit";
  let currentQuery = "";

  const style = document.createElement("style");
  style.textContent = `
    #az-shell{position:fixed;inset:0;z-index:99999;background:#f3f6fb;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;flex-direction:column;overflow:hidden}
    #az-shell *{box-sizing:border-box}
    #az-shell button,#az-shell input,#az-shell select{font:inherit}
    #az-shell button{cursor:pointer;border:0}

    .azm-top{height:58px;display:flex;align-items:center;gap:10px;padding:0 16px;background:rgba(255,255,255,.97);border-bottom:1px solid rgba(15,23,42,.1);backdrop-filter:blur(14px);flex-shrink:0;z-index:10}
    .azm-brand{flex:1;min-width:0}.azm-brand strong{display:block;font-size:17px;color:#b76f09;line-height:1;font-weight:900}.azm-brand span{display:block;margin-top:2px;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.08em}
    .azm-chip{height:28px;display:inline-flex;align-items:center;padding:0 10px;border-radius:8px;font-size:11px;font-weight:850;border:1px solid rgba(5,150,105,.22);background:rgba(5,150,105,.1);color:#047857;white-space:nowrap}
    .azm-max{height:30px;border-radius:8px;background:#6d28d9;color:white;font-size:11px;font-weight:900;padding:0 10px;white-space:nowrap;border:0}

    .azm-body{display:flex;flex:1;min-height:0;overflow:hidden}

    .azm-sidebar{display:none;width:210px;flex-shrink:0;background:white;border-right:1px solid rgba(15,23,42,.09);padding:10px 8px;flex-direction:column;gap:2px;overflow-y:auto}
    .azm-sidebar-btn{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;border-radius:10px;background:transparent;color:#64748b;font-size:13px;font-weight:700;padding:0 10px;text-align:left;border:0;cursor:pointer}
    .azm-sidebar-btn.azm-on{background:rgba(37,99,235,.09);color:#2563eb}
    .azm-sidebar-icon{width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:#edf2f8;font-size:12px;font-weight:950;flex-shrink:0}
    .azm-sidebar-btn.azm-on .azm-sidebar-icon{background:rgba(37,99,235,.14)}
    .azm-sidebar-div{height:1px;background:rgba(15,23,42,.07);margin:8px 4px}
    .azm-sidebar-stats{padding:12px;border-radius:10px;background:#f8fafc;border:1px solid rgba(15,23,42,.08);margin-top:auto}
    .azm-srow{display:flex;justify-content:space-between;padding:3px 0;font-size:12px}.azm-srow span{color:#64748b}.azm-srow b{color:#0f172a;font-weight:800}

    .azm-main{flex:1;min-width:0;min-height:0;overflow:auto;padding:14px 14px 100px;background:linear-gradient(180deg,rgba(37,99,235,.05),transparent 36%),radial-gradient(760px 420px at 100% 0%,rgba(245,158,11,.11),transparent 54%),#f3f6fb}
    .azm-panel{display:none}.azm-panel.azm-on{display:block}

    .azm-nav{position:fixed;left:0;right:0;bottom:0;z-index:100000;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));padding:8px 8px max(8px,env(safe-area-inset-bottom));background:rgba(255,255,255,.96);border-top:1px solid rgba(15,23,42,.1);backdrop-filter:blur(16px)}
    .azm-nav button{height:52px;background:transparent;color:#64748b;font-size:9px;font-weight:950;text-transform:uppercase;line-height:1.1;white-space:nowrap;border:0;border-radius:8px}
    .azm-nav b{margin:0 auto 4px;width:22px;height:22px;border-radius:7px;display:grid;place-items:center;background:#edf2f8}
    .azm-nav button.azm-on{color:#2563eb;background:rgba(37,99,235,.07)}

    .azm-card{background:white;border:1px solid rgba(15,23,42,.09);border-radius:12px;box-shadow:0 4px 14px rgba(15,23,42,.045)}
    .azm-title{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin:2px 0 14px}
    .azm-title h1{margin:0;font-size:20px;letter-spacing:-.02em;font-weight:900}.azm-title p{margin:3px 0 0;color:#64748b;font-size:12px;line-height:1.35}
    .azm-hero{padding:16px;margin-bottom:12px}
    .azm-hero-row{display:flex;justify-content:space-between;gap:12px}
    .azm-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;font-weight:900}
    .azm-big{margin-top:8px;font-size:38px;font-weight:950;line-height:1}.azm-big span{color:#047857}
    .azm-right{text-align:right;font-size:11px;color:#64748b}.azm-right strong{display:block;color:#2563eb;font-size:24px}
    .azm-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:12px}
    .azm-metric{padding:9px 7px;border-radius:8px;background:#edf2f8;border:1px solid rgba(15,23,42,.08)}
    .azm-metric b{display:block;font-size:15px;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:800}
    .azm-metric small{display:block;color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
    .azm-signal{height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin-top:11px}
    .azm-signal span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#059669,#2563eb);width:var(--w)}
    .azm-queue{display:grid;gap:8px}
    .azm-q{padding:13px;display:flex;align-items:center;gap:10px}
    .azm-code{width:38px;height:38px;display:grid;place-items:center;border-radius:9px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.28);color:#b76f09;font-weight:950;flex-shrink:0;font-size:12px}
    .azm-q strong{display:block;font-size:13px;font-weight:700}.azm-q span{display:block;margin-top:2px;color:#64748b;font-size:12px;line-height:1.35}
    .azm-q button,.azm-action{margin-left:auto;min-height:34px;border-radius:8px;background:#0f172a;color:white;font-size:12px;font-weight:900;padding:0 12px;white-space:nowrap;flex-shrink:0}

    .azm-toolbar{position:sticky;top:0;z-index:2;padding:0 0 10px;background:linear-gradient(180deg,rgba(243,246,251,.99) 85%,rgba(243,246,251,.91));backdrop-filter:blur(10px)}
    .azm-search{width:100%;height:42px;border-radius:10px;border:1px solid rgba(15,23,42,.15);background:white;padding:0 13px;outline:none;color:#0f172a;font-size:14px}
    .azm-chips{display:flex;gap:7px;overflow-x:auto;padding:7px 0 0;scrollbar-width:none}.azm-chips::-webkit-scrollbar{display:none}
    .azm-filter{flex:0 0 auto;height:30px;border-radius:8px;padding:0 11px;background:white;color:#64748b;border:1px solid rgba(15,23,42,.1);font-size:12px;font-weight:900}
    .azm-filter.azm-on{background:#b76f09;color:#17100a;border-color:#b76f09}
    .azm-selectrow{display:grid;grid-template-columns:1fr 110px;gap:8px;margin-top:7px}
    .azm-selectrow select{height:36px;border-radius:8px;border:1px solid rgba(15,23,42,.13);background:white;color:#0f172a;padding:0 8px;font-size:12px;font-weight:800}

    .azm-list{display:grid;gap:10px}
    .azm-lead{padding:13px}
    .azm-lead-top{display:grid;grid-template-columns:42px 1fr auto;gap:10px;align-items:start}
    .azm-grade{width:42px;height:42px;border-radius:9px;display:grid;place-items:center;background:rgba(37,99,235,.12);border:1px solid rgba(37,99,235,.32);color:#2563eb;font-weight:950;font-size:15px}
    .azm-name strong{display:block;font-size:14px;line-height:1.25;font-weight:700}.azm-name span{display:block;font-size:12px;color:#64748b;margin-top:3px}
    .azm-score{text-align:right;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;font-weight:900}
    .azm-score b{display:block;color:#047857;font-size:18px;letter-spacing:0;font-weight:900}
    .azm-lead-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:10px}
    .azm-lead-metrics .azm-metric{padding:7px 5px}
    .azm-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}
    .azm-tag{display:inline-flex;align-items:center;min-height:23px;padding:0 8px;border-radius:7px;background:#edf2f8;border:1px solid rgba(15,23,42,.1);color:#64748b;font-size:11px;font-weight:900}
    .azm-tag.good{background:rgba(5,150,105,.1);color:#047857;border-color:rgba(5,150,105,.24)}
    .azm-tag.warn{background:rgba(245,158,11,.12);color:#b76f09;border-color:rgba(245,158,11,.26)}
    .azm-tag.bad{background:rgba(220,38,38,.09);color:#b91c1c;border-color:rgba(220,38,38,.18)}
    .azm-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:11px}
    .azm-actions button{min-height:36px;border-radius:8px;background:#edf2f8;color:#0f172a;border:1px solid rgba(15,23,42,.1);font-size:12px;font-weight:900}
    .azm-actions button:first-child{background:#0f172a;color:white;border-color:#0f172a}
    .azm-actions .azm-saved{background:rgba(5,150,105,.12);border-color:rgba(5,150,105,.24);color:#047857}
    .azm-actions .azm-rejected{background:rgba(220,38,38,.1);border-color:rgba(220,38,38,.2);color:#b91c1c}

    .azm-dim{position:fixed;inset:0;z-index:100001;background:rgba(15,23,42,.32);opacity:0;pointer-events:none;transition:opacity .2s ease}
    .azm-dim.azm-open{opacity:1;pointer-events:auto}
    .azm-sheet{position:fixed;bottom:0;left:0;right:0;z-index:100002;max-height:90dvh;background:white;border-radius:18px 18px 0 0;box-shadow:0 -24px 60px rgba(15,23,42,.18);transform:translateY(110%);transition:transform .25s cubic-bezier(.34,1.56,.64,1);overflow:hidden;display:flex;flex-direction:column}
    .azm-sheet.azm-open{transform:translateY(0)}
    .azm-sheet-head{display:flex;align-items:center;gap:10px;padding:14px;border-bottom:1px solid rgba(15,23,42,.1);flex-shrink:0}
    .azm-sheet-head>div:nth-child(2){flex:1;min-width:0}
    .azm-sheet-head strong{display:block;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .azm-sheet-head span{display:block;color:#64748b;font-size:12px;margin-top:2px}
    .azm-close{width:34px;height:34px;border-radius:8px;background:#edf2f8;color:#0f172a;font-weight:950;font-size:16px}
    .azm-sheet-body{overflow:auto;padding:14px;flex:1}
    .azm-subhead{font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:14px 0 7px}
    .azm-ai{padding:13px;margin-top:12px}
    .azm-ai strong{font-size:14px;font-weight:700;display:block}
    .azm-bubble{margin-top:8px;padding:11px 13px;border-radius:9px;background:#edf2f8;border-left:3px solid #6d28d9;color:#0f172a;font-size:13px;line-height:1.5}
    .azm-check{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:8px;border:1px solid rgba(15,23,42,.1);background:#f8fafc;margin-bottom:6px}
    .azm-check b{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font-size:11px;flex:0 0 auto}
    .azm-check.pass b{background:rgba(5,150,105,.12);color:#047857}
    .azm-check.fail b,.azm-check.pending b{background:rgba(245,158,11,.14);color:#b76f09}
    .azm-check span{font-size:12px;color:#334155;line-height:1.3}
    .azm-sheet-actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 14px max(12px,env(safe-area-inset-bottom));border-top:1px solid rgba(15,23,42,.1);flex-shrink:0}
    .azm-sheet-actions button{min-height:42px;border-radius:8px;background:#edf2f8;color:#0f172a;border:1px solid rgba(15,23,42,.1);font-size:12px;font-weight:950}
    .azm-sheet-actions button:nth-child(2){background:#f59e0b;border-color:#f59e0b;color:#1d1303}

    .azm-toast{position:fixed;left:14px;right:14px;bottom:90px;z-index:100004;padding:11px 13px;border-radius:9px;background:#0f172a;color:white;font-size:13px;font-weight:800;box-shadow:0 18px 38px rgba(15,23,42,.24);opacity:0;transform:translateY(8px);transition:.2s}
    .azm-toast.azm-show{opacity:1;transform:translateY(0)}

    /* ====== DESKTOP 768px+ ====== */
    @media(min-width:768px){
      .azm-sidebar{display:flex}
      .azm-nav{display:none}
      .azm-main{padding:28px 32px 32px}
      .azm-toast{bottom:24px;left:auto;right:24px;width:300px}
      .azm-title h1{font-size:24px}
      .azm-list{grid-template-columns:repeat(2,minmax(0,1fr))}
      .azm-today-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
      .azm-sheet{top:0;bottom:0;left:auto;right:0;width:min(480px,90vw);max-height:100%;border-radius:0;transform:translateX(110%)}
      .azm-sheet.azm-open{transform:translateX(0)}
    }
    @media(min-width:1200px){
      .azm-sidebar{width:230px}
      .azm-list{grid-template-columns:repeat(2,minmax(0,1fr))}
      .azm-main{padding:32px 40px 40px}
    }
    @media(min-width:1440px){
      .azm-list{grid-template-columns:repeat(3,minmax(0,1fr))}
    }
  `;
  document.head.appendChild(style);

  const shell = document.createElement("div");
  shell.id = "az-shell";
  shell.innerHTML = `
    <header class="azm-top">
      <div class="azm-brand"><strong>AZ Finds</strong><span>FBM command center</span></div>
      <div class="azm-chip" id="azmPassed">Loading</div>
      <button class="azm-max" data-go="maximus">MAXIMUS</button>
    </header>
    <div class="azm-body">
      <nav class="azm-sidebar">
        <button class="azm-sidebar-btn azm-on" data-go="today"><div class="azm-sidebar-icon">T</div>Today</button>
        <button class="azm-sidebar-btn" data-go="leads"><div class="azm-sidebar-icon">L</div>Leads</button>
        <button class="azm-sidebar-btn" data-go="checks"><div class="azm-sidebar-icon">C</div>Checks</button>
        <button class="azm-sidebar-btn" data-go="suppliers"><div class="azm-sidebar-icon">S</div>Supply</button>
        <button class="azm-sidebar-btn" data-go="maximus"><div class="azm-sidebar-icon">M</div>AI / Maximus</button>
        <div class="azm-sidebar-div"></div>
        <div class="azm-sidebar-stats">
          <div class="azm-srow"><span>Active leads</span><b id="ss-active">–</b></div>
          <div class="azm-srow"><span>Top bucket</span><b id="ss-top">–</b></div>
          <div class="azm-srow"><span>Need check</span><b id="ss-check">–</b></div>
          <div class="azm-srow"><span>Saved</span><b id="ss-saved">–</b></div>
        </div>
      </nav>
      <main class="azm-main">
        <section class="azm-panel azm-on" data-panel="today"></section>
        <section class="azm-panel" data-panel="leads"></section>
        <section class="azm-panel" data-panel="checks"></section>
        <section class="azm-panel" data-panel="suppliers"></section>
        <section class="azm-panel" data-panel="maximus"></section>
      </main>
    </div>
    <nav class="azm-nav">
      <button class="azm-on" data-go="today"><b>T</b>Today</button>
      <button data-go="leads"><b>L</b>Leads</button>
      <button data-go="checks"><b>C</b>Checks</button>
      <button data-go="suppliers"><b>S</b>Supply</button>
      <button data-go="maximus"><b>M</b>AI</button>
    </nav>
    <div class="azm-dim" id="azmDim"></div>
    <aside class="azm-sheet" id="azmSheet">
      <div class="azm-sheet-head">
        <div class="azm-grade" id="azmSheetGrade">B</div>
        <div><strong id="azmSheetName">Product</strong><span id="azmSheetMeta">Category</span></div>
        <button class="azm-close" id="azmClose">&#x2715;</button>
      </div>
      <div class="azm-sheet-body" id="azmSheetBody"></div>
      <div class="azm-sheet-actions">
        <button data-sheet-action="reject">Reject</button>
        <button data-sheet-action="validate">Validate</button>
        <button data-go="maximus">Ask AI</button>
      </div>
    </aside>
    <div class="azm-toast" id="azmToast"></div>
  `;
  document.body.appendChild(shell);

  const money = (n) => Number.isFinite(Number(n)) ? "$" + Number(n).toFixed(2) : "$--";
  const pct = (n) => Number.isFinite(Number(n)) ? Number(n).toFixed(1) + "%" : "--";
  const short = (n) => { const v = Number(n || 0); if (v >= 1000) return (Math.round(v / 100) / 10) + "k"; return String(Math.round(v)); };
  const grade = (p) => (p.grade && p.grade.grade) || "B";
  const score = (p) => Number((p.grade && p.grade.score_out_of_100) || p.opportunity_score || 0);
  const roi = (p) => Number((p.profitability && p.profitability.roi) || 0);
  const margin = (p) => Number((p.profitability && p.profitability.margin) || 0);
  const profit = (p) => Number(p.profitability && p.profitability.netProfit);
  const landed = (p) => Number(p.profitability && (p.profitability.landedCost || p.profitability.unitCost));
  const supplier = (p) => (p.suppliers && p.suppliers[0]) || {};
  const checks = (p) => Array.isArray(p.checks) ? p.checks : [];
  const passCount = (p) => checks(p).filter((c) => c.state === "pass").length;
  const failCount = (p) => checks(p).filter((c) => c.state !== "pass").length;
  const needsCheck = (p) => p.bucket === "needs_check" || failCount(p) > 0;
  const isSaved = (id) => !!state.saved[id];
  const isRejected = (id) => !!state.rejected[id];
  const isValidated = (id) => !!state.validated[id];
  const realProducts = () => products.filter((p) => !isRejected(p.id) || activeFilter === "rejected");

  function fitScore(p) {
    const s = supplier(p);
    const scorePart = score(p) * 0.52;
    const roiPart = clamp(roi(p), 0, 100) * 0.16;
    const marginPart = clamp(margin(p), 0, 35) / 35 * 10;
    const supplierPart = clamp(Number(s.match_quality_score || 0), 0, 100) * 0.08;
    const velocityPart = clamp(Math.log10(Number(p.estimatedMonthlySales || 0) + 1) / 4, 0, 1) * 7;
    const checkPart = checks(p).length ? (passCount(p) / checks(p).length) * 5 : 2.5;
    const riskPenalty = p.risk_level === "low" ? 0 : p.risk_level === "medium" ? 5 : 10;
    const bucketBonus = p.bucket === "top" ? 3 : 0;
    return Math.round(clamp(scorePart + roiPart + marginPart + supplierPart + velocityPart + checkPart + bucketBonus - riskPenalty, 0, 100));
  }

  function recommendation(p) {
    if (failCount(p) > 0) return "Audit failed checks before sourcing.";
    if (isValidated(p.id)) return "Validated locally. Ready for supplier confirmation.";
    if (roi(p) >= 75 && profit(p) >= 5) return "High ROI. Validate Seller Central and request sample quote.";
    if (/US|USA/i.test(supplier(p).region || "")) return "Fast supplier path. Confirm exact match and landed cost.";
    if (p.bucket === "needs_check") return "Good lead, but margin or confidence needs another pass.";
    return p.recommended_action || "Validate, sample, then small test order.";
  }

  function title(label, sub) {
    return `<div class="azm-title"><div><h1>${label}</h1><p>${sub}</p></div></div>`;
  }

  function toast(message) {
    const node = document.getElementById("azmToast");
    node.textContent = message;
    node.classList.add("azm-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => node.classList.remove("azm-show"), 2400);
  }

  function setAction(id, action) {
    if (action === "save") { state.saved[id] = Date.now(); delete state.rejected[id]; toast("Lead saved"); }
    if (action === "reject") { state.rejected[id] = Date.now(); delete state.saved[id]; toast("Lead rejected"); }
    if (action === "validate") { state.validated[id] = Date.now(); toast("Marked validated"); }
    writeState(state);
    renderAll(true);
  }

  function leadCard(p) {
    const s = supplier(p);
    const fit = fitScore(p);
    const tags = [
      `<span class="azm-tag ${p.risk_level === "low" ? "good" : "warn"}">${p.risk_level || "risk"} risk</span>`,
      `<span class="azm-tag ${needsCheck(p) ? "warn" : "good"}">${needsCheck(p) ? "needs check" : "checks pass"}</span>`,
      `<span class="azm-tag warn">${s.supplier_name || "Supplier"} ${s.lead_time || ""}</span>`,
      isSaved(p.id) ? `<span class="azm-tag good">saved</span>` : "",
      isValidated(p.id) ? `<span class="azm-tag good">validated</span>` : "",
    ].join("");
    return `<article class="azm-card azm-lead">
      <div class="azm-lead-top"><div class="azm-grade">${grade(p)}</div><div class="azm-name"><strong>${p.name}</strong><span>${p.category || ""}</span></div><div class="azm-score"><b>${fit}</b>AZ Fit</div></div>
      <div class="azm-signal" style="--w:${fit}%"><span></span></div>
      <div class="azm-lead-metrics"><div class="azm-metric"><b>${pct(roi(p))}</b><small>ROI</small></div><div class="azm-metric"><b>${money(profit(p))}</b><small>profit</small></div><div class="azm-metric"><b>${short(p.estimatedMonthlySales)}</b><small>sales</small></div><div class="azm-metric"><b>${money(landed(p))}</b><small>landed</small></div></div>
      <div class="azm-tags">${tags}</div>
      <div class="azm-actions"><button data-open="${p.id}">Details</button><button class="${isSaved(p.id) ? "azm-saved" : ""}" data-action="save" data-id="${p.id}">${isSaved(p.id) ? "Saved ✓" : "Save"}</button><button class="${isRejected(p.id) ? "azm-rejected" : ""}" data-action="reject" data-id="${p.id}">Reject</button></div>
    </article>`;
  }

  function filteredProducts() {
    const q = currentQuery.toLowerCase().trim();
    let list = realProducts().filter((p) => {
      const s = supplier(p);
      const hay = [p.name, p.category, s.supplier_name, s.region, p.bucket, grade(p)].join(" ").toLowerCase();
      const matchQ = !q || hay.includes(q);
      const matchF = activeFilter === "all"
        || (activeFilter === "top" && p.bucket === "top")
        || (activeFilter === "check" && needsCheck(p))
        || (activeFilter === "saved" && isSaved(p.id))
        || (activeFilter === "validated" && isValidated(p.id))
        || (activeFilter === "us" && /usa|us/i.test(s.region || ""))
        || (activeFilter === "rejected" && isRejected(p.id));
      return matchQ && matchF;
    });
    list.sort((a, b) => {
      if (activeSort === "roi") return roi(b) - roi(a);
      if (activeSort === "profit") return profit(b) - profit(a);
      if (activeSort === "sales") return Number(b.estimatedMonthlySales || 0) - Number(a.estimatedMonthlySales || 0);
      if (activeSort === "landed") return landed(a) - landed(b);
      return fitScore(b) - fitScore(a);
    });
    return list.slice(0, 60);
  }

  function renderLeads() {
    const list = filteredProducts();
    shell.querySelector('[data-panel="leads"]').innerHTML = `${title("Leads", "Ranked by AZ Fit — score, ROI, margin, supplier fit, velocity, checks, risk.")}
      <div class="azm-toolbar">
        <input class="azm-search" id="azmSearch" placeholder="Search products, categories, suppliers..." value="${currentQuery.replace(/"/g, "&quot;")}"/>
        <div class="azm-selectrow">
          <div class="azm-chips">${["all:All","top:Top","check:Needs check","saved:Saved","validated:Validated","us:US supply","rejected:Rejected"].map((r) => { const [id, lbl] = r.split(":"); return `<button class="azm-filter ${id === activeFilter ? "azm-on" : ""}" data-filter="${id}">${lbl}</button>`; }).join("")}</div>
          <select id="azmSort"><option value="fit">AZ Fit</option><option value="roi">ROI</option><option value="profit">Profit</option><option value="sales">Sales</option><option value="landed">Low cost</option></select>
        </div>
      </div>
      <div class="azm-list">${list.map(leadCard).join("") || `<div class="azm-card azm-q"><div><strong>No matching leads</strong><span>Try a different filter or search term.</span></div></div>`}</div>`;
    const search = document.getElementById("azmSearch");
    const sort = document.getElementById("azmSort");
    sort.value = activeSort;
    search.addEventListener("input", (e) => {
      currentQuery = e.target.value;
      renderLeads();
      const r = document.getElementById("azmSearch");
      r.focus(); r.setSelectionRange(r.value.length, r.value.length);
    });
    sort.addEventListener("change", (e) => { activeSort = e.target.value; renderLeads(); });
  }

  function renderSuppliers() {
    const rows = [];
    for (const p of realProducts().sort((a, b) => fitScore(b) - fitScore(a)).slice(0, 30)) {
      for (const s of (p.suppliers || []).slice(0, 1)) rows.push({ p, s });
    }
    shell.querySelector('[data-panel="suppliers"]').innerHTML = `${title("Supply", "Confirm exact matches, MOQ, landed cost, and sample timing.")}
      <div class="azm-list">${rows.map(({ p, s }) => `<article class="azm-card azm-lead"><div class="azm-lead-top"><div class="azm-grade">S</div><div class="azm-name"><strong>${s.supplier_name || "Supplier"}</strong><span>${p.name}</span></div><div class="azm-score"><b>${s.match_quality_score || "--"}</b>match</div></div><div class="azm-lead-metrics"><div class="azm-metric"><b>${money(s.estimated_landed_cost)}</b><small>landed</small></div><div class="azm-metric"><b>${s.moq || "--"}</b><small>MOQ</small></div><div class="azm-metric"><b>${(s.lead_time || "--").split(" ")[0]}</b><small>days</small></div><div class="azm-metric"><b>${s.supplier_risk || "--"}</b><small>risk</small></div></div><div class="azm-tags"><span class="azm-tag">confirm exact match</span><span class="azm-tag">${s.region || "region"}</span><span class="azm-tag ${s.sample_available ? "good" : "warn"}">sample ${s.sample_available ? "ready" : "check"}</span></div><div class="azm-actions"><button data-open="${p.id}">Product</button><button data-action="save" data-id="${p.id}">Save</button><button data-action="validate" data-id="${p.id}">Checked</button></div></article>`).join("") || `<div class="azm-card azm-q"><div><strong>No suppliers found</strong><span>Load a dashboard to see supplier data.</span></div></div>`}</div>`;
  }

  function renderChecks() {
    const queue = realProducts().filter(needsCheck).sort((a, b) => fitScore(b) - fitScore(a)).slice(0, 40);
    shell.querySelector('[data-panel="checks"]').innerHTML = `${title("Checks", "Validation work before inventory moves: Seller Central, margin, supplier, and risk.")}
      <div class="azm-list">${queue.map((p) => `<div class="azm-card azm-q"><div class="azm-code">${grade(p)}</div><div><strong>${p.name}</strong><span>${recommendation(p)} — ${failCount(p)} failed, ${passCount(p)} passed.</span></div><button data-open="${p.id}">Open</button></div>`).join("") || `<div class="azm-card azm-q"><div><strong>No check queue</strong><span>All visible leads are currently passing local checks.</span></div></div>`}</div>`;
  }

  function updateSidebarStats(visible, topCount, checkCount, savedCount) {
    const a = document.getElementById("ss-active");
    if (!a) return;
    document.getElementById("ss-active").textContent = visible.length;
    document.getElementById("ss-top").textContent = topCount;
    document.getElementById("ss-check").textContent = checkCount;
    document.getElementById("ss-saved").textContent = savedCount;
  }

  function renderToday(data) {
    const visible = realProducts();
    const best = visible.slice().sort((a, b) => fitScore(b) - fitScore(a))[0] || {};
    const checkCount = visible.filter(needsCheck).length;
    const savedCount = Object.keys(state.saved).length;
    const topCount = visible.filter((p) => p.bucket === "top").length;
    document.getElementById("azmPassed").textContent = `${data.summary.productsPassed} passed`;
    updateSidebarStats(visible, topCount, checkCount, savedCount);
    shell.querySelector('[data-panel="today"]').innerHTML = `${title("Today", "Fast decisions, validation queue, and deal flow.")}
      <div class="azm-today-cols">
        <div>
          <div class="azm-card azm-hero">
            <div class="azm-hero-row">
              <div><div class="azm-label">Best operator lead</div><div class="azm-big"><span>${fitScore(best)}</span>/100</div></div>
              <div class="azm-right"><strong>${pct(roi(best))}</strong>ROI estimate</div>
            </div>
            <div class="azm-signal" style="--w:${fitScore(best)}%"><span></span></div>
            <div class="azm-metrics">
              <div class="azm-metric"><b>${visible.length}</b><small>active</small></div>
              <div class="azm-metric"><b>${topCount}</b><small>top leads</small></div>
              <div class="azm-metric"><b>${checkCount}</b><small>checks</small></div>
              <div class="azm-metric"><b>${savedCount}</b><small>saved</small></div>
            </div>
          </div>
        </div>
        <div class="azm-queue">
          <div class="azm-card azm-q"><div class="azm-code">1</div><div><strong>Validate ${best.name || "top lead"}</strong><span>${recommendation(best)}</span></div><button data-open="${best.id || ""}">Open</button></div>
          <div class="azm-card azm-q"><div class="azm-code">SC</div><div><strong>${checkCount} leads need deeper check</strong><span>Margin, confidence, supplier match, and Seller Central review.</span></div><button data-go="checks">Check</button></div>
          <div class="azm-card azm-q"><div class="azm-code">PO</div><div><strong>Supplier shortlist ready</strong><span>Confirm exact matches, landed costs, MOQ, and sample availability.</span></div><button data-go="suppliers">View</button></div>
        </div>
      </div>`;
  }

  function renderMaximus() {
    const best = realProducts().slice().sort((a, b) => fitScore(b) - fitScore(a))[0] || {};
    shell.querySelector('[data-panel="maximus"]').innerHTML = `${title("MAXIMUS", "Context-aware operator assistant for the current AZ Finds batch.")}
      <div class="azm-card azm-ai"><div class="azm-chip">Product context ready</div><div class="azm-bubble">Top move: validate ${best.name || "the top product"}, confirm exact supplier match, and only then run a small sample/test order. AZ Fit is deterministic from score, ROI, margin, supplier match, sales velocity, checks, and risk.</div>
      <div class="azm-chips" style="margin-top:10px"><button class="azm-filter azm-on">Rank safest</button><button class="azm-filter">Draft supplier email</button><button class="azm-filter">Find risks</button><button class="azm-filter">Plan sample order</button></div></div>`;
  }

  function openSheet(id) {
    const p = products.find((item) => item.id === id);
    if (!p) return;
    const s = supplier(p);
    document.getElementById("azmSheetGrade").textContent = grade(p);
    document.getElementById("azmSheetName").textContent = p.name;
    document.getElementById("azmSheetMeta").textContent = `${p.category || ""} · ${s.supplier_name || "Supplier"} · ${s.lead_time || ""}`;
    document.getElementById("azmSheet").dataset.currentId = p.id;
    const risk = p.risks && p.risks[0] ? p.risks[0] : {};
    const steps = Array.isArray(risk.manual_verification_steps) ? risk.manual_verification_steps.slice(0, 4) : [];
    document.getElementById("azmSheetBody").innerHTML = `
      <div class="azm-lead-metrics" style="grid-template-columns:repeat(4,minmax(0,1fr))">
        <div class="azm-metric"><b>${fitScore(p)}</b><small>AZ Fit</small></div>
        <div class="azm-metric"><b>${pct(roi(p))}</b><small>ROI</small></div>
        <div class="azm-metric"><b>${money(profit(p))}</b><small>profit</small></div>
        <div class="azm-metric"><b>${pct(margin(p))}</b><small>margin</small></div>
        <div class="azm-metric"><b>${money(landed(p))}</b><small>landed</small></div>
        <div class="azm-metric"><b>${short(p.bsr)}</b><small>BSR</small></div>
        <div class="azm-metric"><b>${short(p.estimatedMonthlySales)}</b><small>sales</small></div>
        <div class="azm-metric"><b>${s.moq || "--"}</b><small>MOQ</small></div>
      </div>
      <div class="azm-tags" style="margin-top:10px">
        <span class="azm-tag ${p.risk_level === "low" ? "good" : "warn"}">${p.risk_level || "risk"} risk</span>
        <span class="azm-tag ${needsCheck(p) ? "warn" : "good"}">${needsCheck(p) ? "needs check" : "checks pass"}</span>
        <span class="azm-tag warn">estimate mode</span>
        <span class="azm-tag">${s.region || "supplier"} path</span>
      </div>
      <div class="azm-card azm-ai"><strong>Recommended next step</strong><div class="azm-bubble">${recommendation(p)}</div></div>
      <div class="azm-subhead">Checks (${passCount(p)} pass / ${failCount(p)} fail)</div>
      ${checks(p).slice(0, 8).map((c) => `<div class="azm-check ${c.state || "pending"}"><b>${c.state === "pass" ? "✓" : "!"}</b><span>${c.label}</span></div>`).join("")}
      <div class="azm-subhead">Best supplier</div>
      <div class="azm-card azm-ai"><strong>${s.supplier_name || "Supplier needed"}</strong><div class="azm-bubble">Landed ${money(s.estimated_landed_cost)}. MOQ ${s.moq || "--"}. ${s.lead_time || "Lead time unknown"}. Risk ${s.supplier_risk || "--"}. Confirm exact match before ordering.</div></div>
      ${steps.length ? `<div class="azm-subhead">Manual validation steps</div>${steps.map((st) => `<div class="azm-check pending"><b>SC</b><span>${st}</span></div>`).join("")}` : ""}
    `;
    document.getElementById("azmDim").classList.add("azm-open");
    document.getElementById("azmSheet").classList.add("azm-open");
  }

  function closeSheet() {
    document.getElementById("azmDim").classList.remove("azm-open");
    document.getElementById("azmSheet").classList.remove("azm-open");
  }

  function go(panel) {
    activeTab = panel;
    shell.querySelectorAll(".azm-panel").forEach((n) => n.classList.toggle("azm-on", n.dataset.panel === panel));
    shell.querySelectorAll("[data-go]").forEach((n) => n.classList.toggle("azm-on", n.dataset.go === panel));
    shell.querySelector(".azm-main").scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderAll(keepTab) {
    const data = window.__azDashboardData || { summary: { productsPassed: products.length } };
    renderToday(data);
    renderLeads();
    renderChecks();
    renderSuppliers();
    renderMaximus();
    go(keepTab ? activeTab : activeTab);
  }

  shell.addEventListener("click", (e) => {
    const goBtn = e.target.closest("[data-go]");
    const openBtn = e.target.closest("[data-open]");
    const filterBtn = e.target.closest("[data-filter]");
    const actionBtn = e.target.closest("[data-action]");
    const sheetAct = e.target.closest("[data-sheet-action]");
    if (goBtn) { go(goBtn.dataset.go); closeSheet(); }
    if (openBtn && openBtn.dataset.open) openSheet(openBtn.dataset.open);
    if (filterBtn) { activeFilter = filterBtn.dataset.filter; renderLeads(); }
    if (actionBtn) setAction(actionBtn.dataset.id, actionBtn.dataset.action);
    if (sheetAct) {
      const id = document.getElementById("azmSheet").dataset.currentId;
      if (id) { setAction(id, sheetAct.dataset.sheetAction); closeSheet(); }
    }
  });

  document.getElementById("azmClose").addEventListener("click", closeSheet);
  document.getElementById("azmDim").addEventListener("click", closeSheet);

  async function fetchDashboard() {
    let r = await fetch("/.netlify/functions/dashboard?t=" + Date.now(), { cache: "no-store" });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.includes("application/json")) {
      r = await fetch("/sample-dashboard.json?t=" + Date.now(), { cache: "no-store" });
    }
    return r.json();
  }

  async function boot() {
    try {
      const data = await fetchDashboard();
      window.__azDashboardData = data;
      products = [...(data.products || [])].sort((a, b) => fitScore(b) - fitScore(a));
      renderAll(true);
    } catch (err) {
      shell.querySelector('[data-panel="today"]').innerHTML = `<div class="azm-card azm-q"><div><strong>Dashboard failed to load</strong><span>${String(err)}</span></div></div>`;
    }
  }

  boot();
})();
