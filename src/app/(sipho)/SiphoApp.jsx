"use client";

import { useEffect, useRef } from "react";

const DECK_PDF = "/legitreach-sipho-investor-deck.pdf";
const DECK_HTML = "/investor-deck.html";

const moduleCatalog = [
  {
    id: "qdd-400g-dr4",
    name: "400GBASE-DR4 QSFP-DD SiPh",
    vendor: "FS / Generic compatible",
    speed: "400G",
    formFactor: "QSFP-DD",
    lanes: "8 x 50G PAM4 electrical, 4 x 100G optical",
    reachMeters: 500,
    reach: "500 m",
    protocol: "400GbE",
    wavelength: "1310 nm",
    connector: "MPO-12 / APC",
    technology: "Silicon photonics",
    power: "10-12 W",
    thermal: "Commercial 0-70 C",
    monitoring: "DDM / DOM, CMIS",
    status: "Active, broad second source",
    leadTime: "Stock to 3 weeks",
    hosts: ["Cisco Nexus", "Arista 7060", "Juniper QFX", "NVIDIA Spectrum", "Dell Z"],
    useCases: ["AI cluster", "Intra-DC", "Lab bench"],
    risk: "Verify FEC, CMIS revision, MPO polarity, and faceplate thermal budget.",
    substitute: "400G OSFP DR4 for OSFP cages; 400G FR4 if the fiber plant is duplex LC.",
    link: "https://www.fs.com/products/128245.html"
  },
  {
    id: "qdd-400g-fr4",
    name: "400GBASE-FR4 QSFP-DD",
    vendor: "FS / Cisco compatible",
    speed: "400G",
    formFactor: "QSFP-DD",
    lanes: "8 x 50G PAM4 electrical, 4 x 100G optical",
    reachMeters: 2000,
    reach: "2 km",
    protocol: "400GbE",
    wavelength: "CWDM4 1271/1291/1311/1331 nm",
    connector: "Duplex LC",
    technology: "EML / silicon photonics options",
    power: "9-12 W",
    thermal: "Commercial 0-70 C",
    monitoring: "DDM / DOM",
    status: "Active",
    leadTime: "Stock to 4 weeks",
    hosts: ["Cisco Nexus", "Arista 7060", "Juniper QFX", "Dell Z", "Lab switch"],
    useCases: ["Intra-DC", "Edge DC", "Lab bench"],
    risk: "FR4 is convenient on duplex fiber but more sensitive to link budget than DR4.",
    substitute: "400G DR4 if parallel SMF is available; 4 x 100G breakout if host supports it.",
    link: "https://www.fs.com/products/97307.html"
  },
  {
    id: "osfp-400g-dr4",
    name: "400GBASE-DR4 OSFP SiPh",
    vendor: "FS / Arista compatible",
    speed: "400G",
    formFactor: "OSFP",
    lanes: "8 x 50G PAM4 electrical, 4 x 100G optical",
    reachMeters: 500,
    reach: "500 m",
    protocol: "400GbE",
    wavelength: "1310 nm",
    connector: "MPO-12 / APC",
    technology: "Silicon photonics",
    power: "10-12 W",
    thermal: "Finned OSFP, 0-70 C",
    monitoring: "DDM / DOM, CMIS",
    status: "Active",
    leadTime: "Stock to 3 weeks",
    hosts: ["Arista 7060", "NVIDIA Spectrum", "Dell Z", "Lab switch"],
    useCases: ["AI cluster", "Intra-DC", "Lab bench"],
    risk: "OSFP thermal class must match cage airflow and heatsink style.",
    substitute: "QSFP-DD DR4 through adapter only when host vendor supports it.",
    link: "https://www.fs.com/products/148268.html"
  },
  {
    id: "osfp-800g-2fr4",
    name: "800GBASE 2 x FR4 OSFP",
    vendor: "FS / Arista compatible",
    speed: "800G",
    formFactor: "OSFP",
    lanes: "8 x 100G PAM4",
    reachMeters: 2000,
    reach: "2 km",
    protocol: "800GbE, 2 x 400G breakout",
    wavelength: "CWDM4 1271/1291/1311/1331 nm",
    connector: "Dual duplex LC",
    technology: "EML / silicon photonics options",
    power: "15-18 W",
    thermal: "Closed finned top, 0-70 C",
    monitoring: "DDM / DOM",
    status: "Active, fast-moving supply",
    leadTime: "2-6 weeks",
    hosts: ["Arista 7060", "NVIDIA Spectrum", "Cisco Nexus", "Juniper QFX"],
    useCases: ["AI cluster", "Intra-DC", "DCI"],
    risk: "Confirm host breakout mode, lane mapping, and firmware support for 2 x 400G.",
    substitute: "800G DR8 for shorter parallel SMF; dual 400G FR4 if ports are available.",
    link: "https://www.fs.com/products/229461.html"
  },
  {
    id: "osfp-800g-dr8-lpo",
    name: "800GBASE-DR8 OSFP LPO",
    vendor: "FS / Generic compatible",
    speed: "800G",
    formFactor: "OSFP",
    lanes: "8 x 100G PAM4 linear drive",
    reachMeters: 500,
    reach: "500 m",
    protocol: "800GbE",
    wavelength: "1310 nm",
    connector: "Parallel SMF MPO/MTP",
    technology: "LPO silicon photonics",
    power: "Lower than DSP retimed class",
    thermal: "Finned OSFP required",
    monitoring: "CMIS, host-dependent diagnostics",
    status: "Emerging, validate host list",
    leadTime: "Pilot to 8 weeks",
    hosts: ["NVIDIA Spectrum", "Arista 7060", "Lab switch"],
    useCases: ["AI cluster", "CPO-adjacent", "Lab bench"],
    risk: "LPO pushes signal integrity burden to the host; avoid without switch validation.",
    substitute: "Retimed 800G DR8 if host SI margin is unknown.",
    link: "https://www.fs.com/products/333563.html"
  },
  {
    id: "qdd-800g-2fr4",
    name: "800GBASE 2 x FR4 QSFP-DD",
    vendor: "FS / Cisco compatible",
    speed: "800G",
    formFactor: "QSFP-DD",
    lanes: "8 x 100G PAM4",
    reachMeters: 2000,
    reach: "2 km",
    protocol: "800GbE, 2 x 400G breakout",
    wavelength: "CWDM4 1271/1291/1311/1331 nm",
    connector: "Dual duplex LC",
    technology: "EML / silicon photonics options",
    power: "16-20 W",
    thermal: "High-power QSFP-DD, 0-70 C",
    monitoring: "DDM / DOM",
    status: "Active",
    leadTime: "3-7 weeks",
    hosts: ["Cisco Nexus", "Juniper QFX", "Dell Z", "Lab switch"],
    useCases: ["Intra-DC", "DCI", "Edge DC"],
    risk: "QSFP-DD thermal margin is tighter at 800G; audit airflow before bulk buys.",
    substitute: "800G OSFP 2 x FR4 when cage format allows higher thermal headroom.",
    link: "https://www.fs.com/products/248595.html"
  },
  {
    id: "osfp-1p6t-2dr4",
    name: "1.6T 2 x DR4/DR8 OSFP",
    vendor: "FS / NVIDIA-Mellanox compatible",
    speed: "1.6T",
    formFactor: "OSFP",
    lanes: "8 x 200G PAM4",
    reachMeters: 500,
    reach: "500 m",
    protocol: "InfiniBand XDR, Ethernet variants",
    wavelength: "1310 nm parallel optics",
    connector: "Parallel SMF, vendor-specific",
    technology: "Silicon photonics, 3 nm DSP class",
    power: "High-power 1.6T class",
    thermal: "Liquid/strict airflow planning",
    monitoring: "CMIS, host firmware dependent",
    status: "Early production",
    leadTime: "Allocation to 12 weeks",
    hosts: ["NVIDIA Quantum", "NVIDIA Spectrum", "Lab switch"],
    useCases: ["AI cluster", "CPO-adjacent"],
    risk: "Only buy against a qualified platform BOM; firmware and cooling are gating items.",
    substitute: "Two validated 800G optics until the 1.6T platform is qualified.",
    link: "https://www.fs.com/products/375353.html"
  },
  {
    id: "qdd-400zr",
    name: "400ZR QSFP-DD coherent",
    vendor: "OpenZR+ ecosystem",
    speed: "400G",
    formFactor: "QSFP-DD",
    lanes: "Coherent line side",
    reachMeters: 120000,
    reach: "80-120 km",
    protocol: "400ZR / OpenZR+",
    wavelength: "Tunable C-band",
    connector: "Duplex LC",
    technology: "Coherent DSP + photonic engine",
    power: "18-24 W",
    thermal: "High-power QSFP-DD",
    monitoring: "DDM / coherent telemetry",
    status: "Active",
    leadTime: "4-10 weeks",
    hosts: ["Cisco Nexus", "Juniper QFX", "Arista 7060", "Dell Z"],
    useCases: ["DCI", "Cloud WAN"],
    risk: "Validate router support, line system plan, chromatic dispersion, and optics license.",
    substitute: "400G FR4 for campus spans; 800ZR when port density and budget justify it.",
    link: "https://www.fs.com/c/400g-zr-zr-4834"
  },
  {
    id: "aec-800g",
    name: "800G AEC / DAC sanity option",
    vendor: "Multi-vendor cable ecosystem",
    speed: "800G",
    formFactor: "OSFP / QSFP-DD cable",
    lanes: "8 x 100G PAM4",
    reachMeters: 7,
    reach: "1-7 m",
    protocol: "800GbE / InfiniBand",
    wavelength: "Electrical",
    connector: "Cabled pluggable",
    technology: "Copper AEC / DAC",
    power: "Low to moderate",
    thermal: "Faceplate dependent",
    monitoring: "Cable EEPROM",
    status: "Active",
    leadTime: "Stock to 2 weeks",
    hosts: ["NVIDIA Quantum", "NVIDIA Spectrum", "Arista 7060", "Cisco Nexus", "Dell Z"],
    useCases: ["AI cluster", "Lab bench"],
    risk: "Best for rack-local links; bend radius and cable bulk can break serviceability.",
    substitute: "800G SR8 or DR8 optics when reach, airflow, or routing exceeds copper limits.",
    link: "https://www.fs.com/specials/1.6t-800g-400g-200g-transceivers-and-cables-156.html"
  }
];

const simulatorProfiles = {
  "400G": { label: "400G", gbps: 400, moduleWatts: 11, portsPerSwitch: 64 },
  "800G": { label: "800G", gbps: 800, moduleWatts: 17, portsPerSwitch: 64 },
  "1.6T": { label: "1.6T", gbps: 1600, moduleWatts: 31, portsPerSwitch: 32 }
};

let app = null;
let currentAnimationFrame = 0;
let animationCleanup = null;
const selectedModules = new Set();

function header() {
  return `
    <header class="site-header">
      <a class="wordmark" href="/" aria-label="LegitReach home">
        <img src="/lr-icon.svg" alt="" />
        <span>LegitReach</span>
      </a>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="/#newsletter">Silicon Photonics Monthly</a>
      </nav>
      <button id="openDeck" class="invest-button" type="button">Invest</button>
    </header>
  `;
}

function deckDialog() {
  return `
    <dialog id="deckDialog" class="deck-dialog" aria-label="Investor pitch deck">
      <div class="deck-frame">
        <div class="deck-header">
          <div>
            <span>Investor deck</span>
            <strong>LegitReach</strong>
          </div>
          <div class="deck-actions">
            <a href="${DECK_PDF}" download>Download PDF</a>
            <a href="${DECK_HTML}" target="_blank" rel="noreferrer">Open HTML</a>
            <button id="closeDeck" type="button" aria-label="Close investor deck">Close</button>
          </div>
        </div>
        <object data="${DECK_PDF}" type="application/pdf">
          <p>PDF preview is unavailable. <a href="${DECK_PDF}" download>Download the deck.</a></p>
        </object>
      </div>
    </dialog>
  `;
}

function landingPage() {
  return `
    <main>
      <section class="hero">
        <canvas id="cuspCanvas" class="cusp-canvas" aria-hidden="true"></canvas>
        ${header()}
        <div class="hero-copy-block">
          <h1>Cusp of electrons and photons.</h1>
          <p>
            Forbes like monthly-magazine for silicon optics. SiPho Model for enterprise teams moving from 200G to 1.6T optical fabrics.
          </p>
        </div>
        <div class="hero-actions" aria-label="Product links">
          <a class="link-button dark" href="/model">SiPho Model</a>
          <a class="link-button" href="/tetration">Data-Center Sim</a>
        </div>
      </section>

      <footer id="newsletter" class="landing-footer">
        <section class="monthly">
          <p class="section-label">Silicon Photonics Monthly</p>
          <h2>
            Monthly manga <span class="manga-aside">(you read that right)</span>
            on silicon, photonics & AI infrastructure.
          </h2>
          <p>
            A compact newsletter for buyers, builders, and investors following the optical layer of modern compute.
          </p>
          <form id="waitlistForm" class="waitlist-form">
            <input id="waitlistEmail" type="email" name="email" placeholder="you@company.com" autocomplete="email" required />
            <button type="submit">Interested</button>
            <p id="waitlistStatus" role="status"></p>
          </form>
        </section>
        <div class="footer-bottom">
          <a class="patron-button" href="https://discord.gg/JNssJsFQF" target="_blank" rel="noreferrer">
            <span class="discord-mark" aria-hidden="true">
              <svg viewBox="0 0 71 55" role="img">
                <path d="M60.1 4.9A58.4 58.4 0 0 0 45.7.5a40.1 40.1 0 0 0-1.9 3.9 54.2 54.2 0 0 0-16.4 0A40.1 40.1 0 0 0 25.5.5 58.7 58.7 0 0 0 11 4.9C1.9 18.5-.6 31.7.6 44.7A58.8 58.8 0 0 0 18.3 54a43 43 0 0 0 3.8-6.1 37.5 37.5 0 0 1-6-2.9l1.5-1.2a41.8 41.8 0 0 0 35.8 0l1.5 1.2a37.8 37.8 0 0 1-6 2.9 43 43 0 0 0 3.8 6.1 58.6 58.6 0 0 0 17.7-9.3c1.5-15.1-2.5-28.2-10.3-39.8ZM23.7 36.7c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1Zm23.6 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.6 0 6.5 3.2 6.4 7.1 0 3.9-2.8 7.1-6.4 7.1Z" />
              </svg>
            </span>
            Join as Patron
          </a>
        </div>
      </footer>
      ${deckDialog()}
    </main>
  `;
}

function modelPage() {
  return `
    <main>
      ${header()}
      <section class="page-hero model-hero">
        <p class="section-label">SiPho Model</p>
        <h1>Compatibility before purchase.</h1>
        <p>
          A purchase guide for optics buyers validating host platform, form factor, reach, connector, thermal envelope, firmware risk, substitutes, and ordering path.
        </p>
      </section>
      <section class="access-strip">
        <span>Start a buying conversation</span>
        <a class="access-button" href="mailto:manthan@legitreach.com?subject=Full%20access%20request%20-%20SiPho%20Model">Request access</a>
      </section>
      <section class="tool-shell">
        <aside class="filter-rail">
          <label>Use case
            <select id="useCaseFilter"></select>
          </label>
          <label>Host
            <select id="hostFilter"></select>
          </label>
          <label>Speed
            <select id="speedFilter"></select>
          </label>
          <label>Form factor
            <select id="formFactorFilter"></select>
          </label>
          <label>Reach
            <select id="reachFilter"></select>
          </label>
          <label>Connector
            <select id="connectorFilter"></select>
          </label>
          <label>Search
            <input id="modelSearch" type="search" placeholder="800G OSFP, DR4, Cisco, CPO..." autocomplete="off" />
          </label>
          <button id="clearFilters" class="plain-button" type="button">Reset</button>
        </aside>
        <section class="model-results">
          <div class="results-topline">
            <p id="resultsCount"></p>
            <p id="compareCount"></p>
          </div>
          <div id="moduleGrid" class="module-grid" aria-live="polite"></div>
        </section>
      </section>
      ${deckDialog()}
    </main>
  `;
}

function tetrationPage() {
  return `
    <main>
      ${header()}
      <section class="page-hero tetration-hero">
        <p class="section-label">Data-Center Sim</p>
        <h1>Build the first version in minutes.</h1>
        <p>
          A simple simulator for racks, accelerators, switches, optics, and power.
        </p>
      </section>
      <section class="access-strip">
        <span>Start a buying conversation</span>
        <a class="access-button" href="mailto:manthan@legitreach.com?subject=Full%20access%20request%20-%20Data-Center%20Sim">Request access</a>
      </section>
      <section class="simulator-shell">
        <div class="sim-controls" aria-label="Data-Center Sim controls">
          <label>Racks
            <input id="rackInput" type="range" min="1" max="16" step="1" value="4" />
            <strong id="rackValue"></strong>
          </label>
          <label>Accelerators per rack
            <select id="densityInput">
              <option value="8">8</option>
              <option value="16" selected>16</option>
              <option value="32">32</option>
            </select>
          </label>
          <label>Optics
            <select id="speedInput">
              <option value="400G">400G</option>
              <option value="800G" selected>800G</option>
              <option value="1.6T">1.6T</option>
            </select>
          </label>
          <label>Build goal
            <select id="goalInput">
              <option value="learn">Learn the basics</option>
              <option value="lab" selected>Lab cluster</option>
              <option value="ai-row">AI row</option>
            </select>
          </label>
        </div>
        <div class="chalkboard" aria-label="Data-Center Sim visual build">
          <div class="chalkboard-top">
            <span>Data-Center Sim</span>
            <span id="simTopologyLabel"></span>
          </div>
          <div id="factoryBoard" class="factory-board"></div>
        </div>
        <div id="simMetrics" class="sim-metrics" aria-live="polite"></div>
      </section>
      ${deckDialog()}
    </main>
  `;
}

function renderApp() {
  const path = window.location.pathname;
  if (path === "/model") {
    app.innerHTML = modelPage();
    setupDeckModal();
    setupModel();
    return;
  }
  if (path === "/tetration") {
    app.innerHTML = tetrationPage();
    setupDeckModal();
    setupSimulator();
    return;
  }
  app.innerHTML = landingPage();
  setupDeckModal();
  setupWaitlist();
  setupCuspAnimation();
}

function setupDeckModal() {
  const open = document.querySelector("#openDeck");
  const close = document.querySelector("#closeDeck");
  const dialog = document.querySelector("#deckDialog");
  open?.addEventListener("click", () => {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });
  close?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (!event.target.closest(".deck-frame")) dialog.close();
  });
}

function setupWaitlist() {
  const form = document.querySelector("#waitlistForm");
  const emailInput = document.querySelector("#waitlistEmail");
  const status = document.querySelector("#waitlistStatus");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = "Enter a valid email.";
      return;
    }
    const key = "legitreach-sipho-waitlist";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    if (!stored.includes(email)) {
      stored.push(email);
      localStorage.setItem(key, JSON.stringify(stored));
    }
    status.textContent = "Saving...";
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "Silicon Photonics Monthly" })
      });
      if (!response.ok) throw new Error("capture failed");
      status.textContent = "You are on the list.";
    } catch {
      const subject = encodeURIComponent("Silicon Photonics Monthly waitlist");
      const body = encodeURIComponent(`Please add ${email} to Silicon Photonics Monthly.`);
      status.innerHTML = `Saved locally. <a href="mailto:manthan@legitreach.com?subject=${subject}&body=${body}">Send email</a>`;
    }
  });
}

function setupModel() {
  const useCaseFilter = document.querySelector("#useCaseFilter");
  const hostFilter = document.querySelector("#hostFilter");
  const speedFilter = document.querySelector("#speedFilter");
  const formFactorFilter = document.querySelector("#formFactorFilter");
  const reachFilter = document.querySelector("#reachFilter");
  const connectorFilter = document.querySelector("#connectorFilter");
  const search = document.querySelector("#modelSearch");
  const clear = document.querySelector("#clearFilters");

  useCaseFilter.innerHTML = ["Any use case", ...new Set(moduleCatalog.flatMap((item) => item.useCases))]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  hostFilter.innerHTML = ["Any host", ...new Set(moduleCatalog.flatMap((item) => item.hosts))]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  speedFilter.innerHTML = ["Any speed", "400G", "800G", "1.6T"]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  formFactorFilter.innerHTML = ["Any form factor", ...new Set(moduleCatalog.map((item) => item.formFactor))]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  reachFilter.innerHTML = ["Any reach", "Under 100 m", "500 m", "2 km", "80 km+"]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
  connectorFilter.innerHTML = ["Any connector", ...new Set(moduleCatalog.map((item) => item.connector))]
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");

  [useCaseFilter, hostFilter, speedFilter, formFactorFilter, reachFilter, connectorFilter, search].forEach((control) => {
    control.addEventListener("input", renderModel);
    control.addEventListener("change", renderModel);
  });
  clear.addEventListener("click", () => {
    useCaseFilter.value = "Any use case";
    hostFilter.value = "Any host";
    speedFilter.value = "Any speed";
    formFactorFilter.value = "Any form factor";
    reachFilter.value = "Any reach";
    connectorFilter.value = "Any connector";
    search.value = "";
    selectedModules.clear();
    renderModel();
  });
  document.querySelector("#moduleGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-compare]");
    if (!button) return;
    const id = button.dataset.compare;
    if (selectedModules.has(id)) selectedModules.delete(id);
    else selectedModules.add(id);
    renderModel();
  });
  renderModel();
}

function renderModel() {
  const useCase = document.querySelector("#useCaseFilter").value;
  const host = document.querySelector("#hostFilter").value;
  const speed = document.querySelector("#speedFilter").value;
  const formFactor = document.querySelector("#formFactorFilter").value;
  const reach = document.querySelector("#reachFilter").value;
  const connector = document.querySelector("#connectorFilter").value;
  const query = document.querySelector("#modelSearch").value.trim().toLowerCase();
  const matches = moduleCatalog.filter((item) => {
    if (useCase !== "Any use case" && !item.useCases.includes(useCase)) return false;
    if (host !== "Any host" && !item.hosts.includes(host)) return false;
    if (speed !== "Any speed" && item.speed !== speed) return false;
    if (formFactor !== "Any form factor" && item.formFactor !== formFactor) return false;
    if (reach === "Under 100 m" && item.reachMeters > 100) return false;
    if (reach === "500 m" && item.reachMeters !== 500) return false;
    if (reach === "2 km" && item.reachMeters !== 2000) return false;
    if (reach === "80 km+" && item.reachMeters < 80000) return false;
    if (connector !== "Any connector" && item.connector !== connector) return false;
    if (!query) return true;
    return [
      item.name,
      item.vendor,
      item.speed,
      item.formFactor,
      item.protocol,
      item.wavelength,
      item.connector,
      item.technology,
      item.hosts.join(" "),
      item.useCases.join(" "),
      item.risk,
      item.substitute
    ].join(" ").toLowerCase().includes(query);
  });
  document.querySelector("#resultsCount").textContent = `${matches.length} compatibility paths`;
  document.querySelector("#compareCount").textContent = selectedModules.size
    ? `${selectedModules.size} selected`
    : "Select modules to compare";
  document.querySelector("#moduleGrid").innerHTML = matches.map(renderModuleCard).join("");
}

function moduleFitScore(item) {
  let score = 78;
  if (item.status.includes("Active")) score += 8;
  if (item.leadTime.includes("Stock")) score += 6;
  if (item.technology.includes("Silicon photonics")) score += 4;
  if (item.risk.includes("Only buy") || item.status.includes("Emerging")) score -= 12;
  if (item.formFactor.includes("cable")) score -= 3;
  return Math.max(58, Math.min(96, score));
}

function fitTone(score) {
  if (score >= 88) return "high";
  if (score >= 74) return "medium";
  return "caution";
}

function renderTags(values) {
  return values.map((value) => `<span>${value}</span>`).join("");
}

function renderModuleCard(item) {
  const selected = selectedModules.has(item.id);
  const score = moduleFitScore(item);
  const tone = fitTone(score);
  const validateSubject = encodeURIComponent(`Validate fit: ${item.name}`);
  const validateBody = encodeURIComponent(`Can you validate this module for our host and deployment?\n\nModule: ${item.name}\nForm factor: ${item.formFactor}\nReach: ${item.reach}\nProtocol: ${item.protocol}`);
  return `
    <article class="module-card${selected ? " is-selected" : ""}" data-tone="${tone}">
      <div class="module-title">
        <span>${item.speed}</span>
        <h2>${item.name}</h2>
        <p>${item.vendor}</p>
      </div>
      <div class="fit-panel">
        <span>Fit score</span>
        <strong>${score}</strong>
        <small>${item.status}</small>
      </div>
      <div class="use-tags" aria-label="Best use cases">${renderTags(item.useCases)}</div>
      <dl class="spec-list">
        <div><dt>Form factor</dt><dd>${item.formFactor}</dd></div>
        <div><dt>Reach</dt><dd>${item.reach}</dd></div>
        <div><dt>Protocol</dt><dd>${item.protocol}</dd></div>
        <div><dt>Connector</dt><dd>${item.connector}</dd></div>
        <div><dt>Wavelength</dt><dd>${item.wavelength}</dd></div>
        <div><dt>Power</dt><dd>${item.power}</dd></div>
      </dl>
      <div class="buyer-notes">
        <p class="validation"><strong>Check before buying</strong>${item.risk}</p>
        <p class="validation"><strong>Closest substitute</strong>${item.substitute}</p>
      </div>
      <footer class="module-actions">
        <span>${item.leadTime}</span>
        <div>
          <button class="compare-button" type="button" data-compare="${item.id}">${selected ? "Selected" : "Compare"}</button>
          <a class="validate-link" href="mailto:manthan@legitreach.com?subject=${validateSubject}&body=${validateBody}">Validate fit</a>
          <a class="order-link" href="${item.link}" target="_blank" rel="noreferrer">Order</a>
        </div>
      </footer>
    </article>
  `;
}

function setupSimulator() {
  ["#rackInput", "#densityInput", "#speedInput", "#goalInput"].forEach((selector) => {
    const control = document.querySelector(selector);
    control.addEventListener("input", renderTetration);
    control.addEventListener("change", renderTetration);
  });
  renderTetration();
}

function renderTetration() {
  const racks = Number(document.querySelector("#rackInput").value);
  const rackDensity = Number(document.querySelector("#densityInput").value);
  const profile = simulatorProfiles[document.querySelector("#speedInput").value];
  const goal = document.querySelector("#goalInput").value;
  const accelerators = racks * rackDensity;
  const lanes = goal === "ai-row" ? 8 : goal === "lab" ? 4 : 2;
  const endpointPorts = accelerators * lanes;
  const opticalLinks = endpointPorts;
  const modules = opticalLinks * 2;
  const leafSwitches = racks;
  const spineSwitches = Math.max(1, Math.ceil(racks / 4));
  const switches = leafSwitches + spineSwitches;
  const throughputTbps = (endpointPorts * profile.gbps) / 1000;
  const networkKw = (modules * profile.moduleWatts) / 1000;
  const fiberPairs = opticalLinks;

  document.querySelector("#rackValue").textContent = `${racks.toLocaleString()} rack${racks === 1 ? "" : "s"}`;
  document.querySelector("#simTopologyLabel").textContent = `${profile.label} / ${goal.replace("-", " ")}`;
  document.querySelector("#simMetrics").innerHTML = [
    metric("Accelerators", accelerators.toLocaleString(), `${rackDensity} per rack`),
    metric("Optical modules", modules.toLocaleString(), `${profile.label} estimate`),
    metric("Switches", switches.toLocaleString(), `${leafSwitches} leaf / ${spineSwitches} spine`),
    metric("Fabric bandwidth", `${throughputTbps.toLocaleString()} Tbps`, `${lanes} lanes per accelerator`),
    metric("Optics power", `${networkKw.toFixed(1)} kW`, `${profile.moduleWatts} W per optic`),
    metric("Fiber pairs", fiberPairs.toLocaleString(), "one link per lane")
  ].join("");
  renderFactory({ racks, leafSwitches, spineSwitches, opticalLinks, accelerators, profile });
}

function metric(label, value, note) {
  return `<div><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`;
}

function renderFactory({ racks, leafSwitches, spineSwitches, opticalLinks, accelerators, profile }) {
  const visibleRacks = Math.min(racks, 12);
  const rackHtml = Array.from({ length: visibleRacks }, (_, index) => `
    <div class="sim-rack">
      <span>Rack ${index + 1}</span>
      <i></i><i></i><i></i><i></i>
    </div>
  `).join("");
  const linkHtml = Array.from({ length: Math.min(18, Math.max(6, racks + spineSwitches)) }, (_, index) => (
    `<i class="sim-link" style="--top:${12 + ((index * 11) % 72)}%; --delay:${(index % 6) * 180}ms"></i>`
  )).join("");
  document.querySelector("#factoryBoard").innerHTML = `
    <div class="sim-map">
      <div class="sim-core">
        <span>Spine</span>
        <strong>${spineSwitches}</strong>
      </div>
      <div class="sim-links">${linkHtml}</div>
      <div class="sim-racks">${rackHtml}</div>
    </div>
    <div class="sim-caption">
      <span>${accelerators.toLocaleString()} accelerators</span>
      <span>${leafSwitches.toLocaleString()} leaf switches</span>
      <span>${opticalLinks.toLocaleString()} optical links</span>
      <span>${profile.label} optics</span>
    </div>
  `;
}

function setupCuspAnimation() {
  if (animationCleanup) animationCleanup();
  const canvas = document.querySelector("#cuspCanvas");
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const prismMark = new Image();
  let prismLoaded = false;
  const electrons = Array.from({ length: 34 }, (_, index) => ({
    seed: index * 0.72,
    radius: 38 + (index % 5) * 19,
    speed: 0.00032 + (index % 6) * 0.000052,
    size: 1.1 + (index % 4) * 0.34
  }));
  const photons = Array.from({ length: 44 }, (_, index) => ({
    seed: index * 0.29,
    speed: 0.00054 + (index % 7) * 0.00004,
    size: 1 + (index % 3) * 0.36
  }));
  let width = 0;
  let height = 0;
  let dpr = 1;

  prismMark.decoding = "async";
  prismMark.onload = () => {
    prismLoaded = true;
    draw(performance.now());
  };
  prismMark.src = "/lr-icon.svg";

  function resize() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = Math.floor(box.width);
    height = Math.floor(box.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  }

  function drawPrism(cx, cy, scale) {
    const size = 232 * scale;
    const height = size;
    context.save();
    context.translate(cx, cy);
    context.globalAlpha = 0.105;
    if (prismLoaded) {
      context.drawImage(prismMark, -size / 2, -height / 2, size, height);
      context.restore();
      return;
    }
    context.scale(size / 1024, height / 1024);
    context.translate(-512, -512);
    context.beginPath();
    context.moveTo(512, 183);
    context.lineTo(132, 841);
    context.lineTo(892, 841);
    context.closePath();
    context.fillStyle = "#070707";
    context.fill();
    context.beginPath();
    context.moveTo(-50, 420);
    context.lineTo(1074, 820);
    context.globalAlpha = 1;
    context.strokeStyle = "#faf8f3";
    context.lineWidth = 54;
    context.stroke();
    context.restore();
  }

  function draw(time) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#faf8f3";
    context.fillRect(0, 0, width, height);
    const isMobile = width < 720;
    const cx = width * (isMobile ? 0.5 : 0.5);
    const cy = isMobile ? Math.min(280, Math.max(210, height * 0.3)) : height * 0.48;
    const left = cx - Math.max(isMobile ? 118 : 178, width * (isMobile ? 0.34 : 0.19));
    const right = cx + Math.max(isMobile ? 118 : 178, width * (isMobile ? 0.34 : 0.19));
    const scale = isMobile ? 0.56 : 1.06;

    context.strokeStyle = "rgba(7,7,7,0.06)";
    context.lineWidth = 1;
    for (let y = 90; y < height; y += 70) {
      context.beginPath();
      context.moveTo(28, y);
      context.lineTo(width - 28, y);
      context.stroke();
    }

    for (let lane = -2; lane <= 2; lane += 1) {
      const offset = lane * 18 * scale;
      context.beginPath();
      context.moveTo(left + 48 * scale, cy + offset);
      context.bezierCurveTo(cx - 120 * scale, cy + offset * 0.72, cx - 58 * scale, cy + offset * 0.28, cx - 14 * scale, cy + offset * 0.1);
      context.bezierCurveTo(cx + 28 * scale, cy - offset * 0.08, cx + 78 * scale, cy + offset * 0.4, right - 42 * scale, cy + offset);
      context.strokeStyle = `rgba(7,7,7,${0.055 + Math.abs(lane) * 0.012})`;
      context.lineWidth = lane === 0 ? 1.45 : 0.9;
      context.stroke();
    }

    electrons.forEach((electron, index) => {
      const t = time * electron.speed + electron.seed;
      const orbit = electron.radius * scale;
      const x = left + Math.cos(t) * orbit * 1.56;
      const y = cy + Math.sin(t * 1.22) * orbit;
      if (index % 6 === 0) {
        context.beginPath();
        context.ellipse(left, cy, orbit * 1.56, orbit, 0, 0, Math.PI * 2);
        context.strokeStyle = "rgba(7,7,7,0.075)";
        context.stroke();
      }
      context.beginPath();
      context.arc(x, y, electron.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(7,7,7,${0.28 + (index % 5) * 0.06})`;
      context.fill();
    });

    context.strokeStyle = "rgba(7,7,7,0.18)";
    context.beginPath();
    context.moveTo(left + 42 * scale, cy);
    context.quadraticCurveTo(cx - 82 * scale, cy - 32 * scale, cx - 6 * scale, cy);
    context.moveTo(cx + 6 * scale, cy);
    context.quadraticCurveTo(cx + 82 * scale, cy + 32 * scale, right - 38 * scale, cy);
    context.stroke();

    drawPrism(cx, cy + 2, scale * 1.08);

    for (let wave = 0; wave < 3; wave += 1) {
      context.beginPath();
      for (let step = 0; step <= 128; step += 1) {
        const progress = step / 128;
        const x = cx + 6 * scale + progress * (right - cx - 22 * scale);
        const y = cy + Math.sin(progress * Math.PI * 5 + time * 0.001 + wave) * (13 + wave * 11) * scale + (wave - 1) * 20 * scale;
        if (step === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = `rgba(7,7,7,${0.11 + wave * 0.04})`;
      context.lineWidth = 1.1;
      context.stroke();
    }

    photons.forEach((photon, index) => {
      const travel = (time * photon.speed + photon.seed) % 1;
      const x = cx + 8 * scale + travel * (right - cx - 28 * scale);
      const y = cy + Math.sin(travel * Math.PI * 6 + photon.seed) * (38 * scale) + ((index % 4) - 1.5) * 10;
      context.beginPath();
      context.arc(x, y, photon.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(7,7,7,${0.22 + (index % 6) * 0.055})`;
      context.fill();
    });

    if (!reducedMotion) currentAnimationFrame = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  animationCleanup = () => {
    window.removeEventListener("resize", resize);
    if (currentAnimationFrame) cancelAnimationFrame(currentAnimationFrame);
    currentAnimationFrame = 0;
    animationCleanup = null;
  };
  resize();
}

export default function SiphoApp() {
  const rootRef = useRef(null);

  useEffect(() => {
    app = rootRef.current;
    if (!app) return undefined;
    selectedModules.clear();
    renderApp();
    return () => {
      if (animationCleanup) animationCleanup();
      app = null;
    };
  }, []);

  return <div ref={rootRef} />;
}
