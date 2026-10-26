/* Limani Labs home: the globe hero (owner-approved design v14, 25 Oct 2026). Own code; uses cobe 0.6.3 + phenomenon 1.6.0 (MIT, see /licenses/).
   Where the visitor is comes from the browser's time zone only: nothing is sent anywhere, nothing is stored. */
import createGlobe from "./cobe.js";

const $ = id => document.getElementById(id);
const stage = $("gstage"), canvas = $("globe");
if (stage && canvas) {
  const html = document.documentElement, EL = html.lang === "el";
  const T = EL ? {
    coords: "Λευκωσία · 35.17° Β · 33.36° Α", near: " · είστε κοντά μας", km: n => ` · ${n} km από εσάς`, you: "Εσείς", here: "εδώ",
    cities: [["Λευκωσία", "Η βάση μας"], ["Αμμόχωστος", "περιοχή"], ["Λάρνακα", ""], ["Λεμεσός", ""], ["Πάφος", ""]]
  } : {
    coords: "Nicosia · 35.17° N · 33.36° E", near: " · you are close by", km: n => ` · ${n} km from you`, you: "You", here: "right here",
    cities: [["Nicosia", "Our base"], ["Famagusta", "area"], ["Larnaca", ""], ["Limassol", ""], ["Paphos", ""]]
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DEG = Math.PI / 180;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const smooth = (a, b, v) => clamp((v - a) / (b - a), 0, 1);
  const wrap = a => { a = (a + Math.PI) % (2 * Math.PI); return a < 0 ? a + Math.PI : a - Math.PI; };
  const toAngles = (lat, lng) => [Math.PI - (lng * DEG - Math.PI / 2), lat * DEG];      // cobe: these angles put lat/lng in the centre

  /* where is the visitor? the time zone only */
  const TZ = {
    "Asia/Nicosia": [35.17, 33.36, "Nicosia"], "Asia/Famagusta": [35.12, 33.94, "Famagusta"], "Europe/Athens": [37.98, 23.73, "Athens"],
    "Europe/London": [51.51, -0.13, "London"], "Europe/Dublin": [53.35, -6.26, "Dublin"], "Europe/Lisbon": [38.72, -9.14, "Lisbon"],
    "Europe/Madrid": [40.42, -3.70, "Madrid"], "Europe/Paris": [48.86, 2.35, "Paris"], "Europe/Brussels": [50.85, 4.35, "Brussels"],
    "Europe/Amsterdam": [52.37, 4.90, "Amsterdam"], "Europe/Berlin": [52.52, 13.40, "Berlin"], "Europe/Zurich": [47.38, 8.54, "Zurich"],
    "Europe/Rome": [41.90, 12.50, "Rome"], "Europe/Vienna": [48.21, 16.37, "Vienna"], "Europe/Prague": [50.08, 14.44, "Prague"],
    "Europe/Warsaw": [52.23, 21.01, "Warsaw"], "Europe/Budapest": [47.50, 19.04, "Budapest"], "Europe/Stockholm": [59.33, 18.07, "Stockholm"],
    "Europe/Oslo": [59.91, 10.75, "Oslo"], "Europe/Copenhagen": [55.68, 12.57, "Copenhagen"], "Europe/Helsinki": [60.17, 24.94, "Helsinki"],
    "Europe/Bucharest": [44.43, 26.10, "Bucharest"], "Europe/Sofia": [42.70, 23.32, "Sofia"], "Europe/Belgrade": [44.79, 20.45, "Belgrade"],
    "Europe/Istanbul": [41.01, 28.98, "Istanbul"], "Europe/Kiev": [50.45, 30.52, "Kyiv"], "Europe/Kyiv": [50.45, 30.52, "Kyiv"],
    "Europe/Moscow": [55.76, 37.62, "Moscow"], "Asia/Beirut": [33.89, 35.50, "Beirut"], "Asia/Jerusalem": [31.77, 35.21, "Jerusalem"],
    "Asia/Tel_Aviv": [32.09, 34.78, "Tel Aviv"], "Asia/Amman": [31.95, 35.93, "Amman"], "Africa/Cairo": [30.04, 31.24, "Cairo"],
    "Asia/Dubai": [25.20, 55.27, "Dubai"], "Asia/Riyadh": [24.71, 46.68, "Riyadh"], "Asia/Qatar": [25.29, 51.53, "Doha"],
    "Asia/Tehran": [35.69, 51.39, "Tehran"], "Asia/Karachi": [24.86, 67.01, "Karachi"], "Asia/Kolkata": [22.57, 88.36, "Kolkata"],
    "Asia/Calcutta": [22.57, 88.36, "Kolkata"], "Asia/Bangkok": [13.76, 100.50, "Bangkok"], "Asia/Singapore": [1.35, 103.82, "Singapore"],
    "Asia/Hong_Kong": [22.32, 114.17, "Hong Kong"], "Asia/Shanghai": [31.23, 121.47, "Shanghai"], "Asia/Tokyo": [35.68, 139.69, "Tokyo"],
    "Asia/Seoul": [37.57, 126.98, "Seoul"], "Australia/Sydney": [-33.87, 151.21, "Sydney"], "Australia/Melbourne": [-37.81, 144.96, "Melbourne"],
    "Pacific/Auckland": [-36.85, 174.76, "Auckland"], "Africa/Johannesburg": [-26.20, 28.05, "Johannesburg"], "Africa/Lagos": [6.52, 3.38, "Lagos"],
    "Africa/Nairobi": [-1.29, 36.82, "Nairobi"], "America/New_York": [40.71, -74.01, "New York"], "America/Toronto": [43.65, -79.38, "Toronto"],
    "America/Chicago": [41.88, -87.63, "Chicago"], "America/Denver": [39.74, -104.99, "Denver"], "America/Los_Angeles": [34.05, -118.24, "Los Angeles"],
    "America/Vancouver": [49.28, -123.12, "Vancouver"], "America/Mexico_City": [19.43, -99.13, "Mexico City"], "America/Sao_Paulo": [-23.55, -46.63, "São Paulo"],
    "America/Argentina/Buenos_Aires": [-34.60, -58.38, "Buenos Aires"], "America/Bogota": [4.71, -74.07, "Bogotá"], "America/Santiago": [-33.45, -70.67, "Santiago"]
  };
  let tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  let you = TZ[tz] || null;
  /* Cyprus check (owner bug 26 Oct): Windows "(UTC+02:00) Athens, Bucharest" (GTB) - the zone most Cyprus PCs use - is reported as
     Europe/Bucharest (or Europe/Athens), and E. Europe as Europe/Chisinau. Those zones decide by the browser languages only:
     a Cyprus locale (xx-CY) or Greek/Turkish -> Nicosia; Romanian -> Bucharest; Greek under Athens -> Athens; else unknown (no You). */
  const SHARED = { "Europe/Bucharest": "ro", "Europe/Athens": "el", "Europe/Chisinau": "ro" };
  if (tz in SHARED) {
    let langs = []; try { langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]).map(l => String(l).toLowerCase()); } catch (e) {}
    const has = c => langs.some(l => l === c || l.startsWith(c + "-"));
    const cy = langs.some(l => /-cy$/.test(l));
    if (cy || (tz !== "Europe/Athens" && (has("el") || has("tr")))) you = TZ["Asia/Nicosia"];
    else if (has(SHARED[tz]) && TZ[tz]) you = TZ[tz];
    else { you = null; tz = ""; }
  }
  if (!you && tz) { const off = -new Date().getTimezoneOffset() / 60; you = [30, clamp(off * 15, -170, 170), ""]; }
  const NIC = [35.1856, 33.3823];
  const km = (a, b) => { const R = 6371, dl = (b[0] - a[0]) * DEG, dn = (b[1] - a[1]) * DEG;
    const h = Math.sin(dl / 2) ** 2 + Math.cos(a[0] * DEG) * Math.cos(b[0] * DEG) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  const youKm = you ? km(you, NIC) : null;
  const youLocal = youKm !== null && youKm < 160;
  const ct = $("gcoordsText");
  if (ct && youKm !== null) ct.textContent = T.coords + (youLocal ? T.near : T.km(Math.round(youKm).toLocaleString(EL ? "el" : "en")));

  /* Cyprus cities: an exact dot + a label with a leader line when zoomed in */
  const CITIES = [
    { loc: [35.1856, 33.3823], size: .045, off: [0, -64] }, { loc: [35.0377, 33.9829], size: .02, off: [96, -18] },
    { loc: [34.9003, 33.6232], size: .022, off: [78, 52] }, { loc: [34.6786, 33.0413], size: .022, off: [-6, 78] },
    { loc: [34.7720, 32.4297], size: .02, off: [-96, 26] }
  ];
  const markers = CITIES.map(c => ({ location: c.loc, size: c.size }));
  if (you && !youLocal) markers.push({ location: [you[0], you[1]], size: .03 });
  const pins = $("gpins"), svg = $("glines"), NS = "http://www.w3.org/2000/svg";
  CITIES.forEach((c, i) => {
    const el = document.createElement("div"); el.className = "gpin";
    const b = document.createElement("b"); b.textContent = T.cities[i][0]; el.appendChild(b);
    if (T.cities[i][1]) { const s = document.createElement("span"); s.textContent = T.cities[i][1]; el.appendChild(s); }
    pins.appendChild(el); c.el = el;
    const ln = document.createElementNS(NS, "line"); ln.setAttribute("class", "gline"); ln.style.opacity = 0; svg.appendChild(ln); c.line = ln;
    const dot = document.createElementNS(NS, "circle"); dot.setAttribute("class", "gdot"); dot.setAttribute("r", i === 0 ? "5" : "3.5"); dot.style.opacity = 0; svg.appendChild(dot); c.dot = dot;
  });
  const youRing = $("youRing"), youLabel = $("youLabel");
  youLabel.textContent = T.you; if (youLocal || (you && you[2])) { const s = document.createElement("span"); s.textContent = " · " + (youLocal ? T.here : you[2]); youLabel.appendChild(s); }

  /* camera */
  const [cyPhi, cyTheta] = toAngles(35.0, 33.2);
  const startA = you && !youLocal ? toAngles(you[0], you[1]) : [cyPhi - 1.6, 0.3];
  let phi = startA[0], theta = clamp(startA[1], -0.9, 0.9);
  let vPhi = 0, vTheta = 0, dragging = false, lastX = 0, lastY = 0, lastMove = 0, idleSince = performance.now();
  const t0 = performance.now();
  const sticky = canvas.parentElement, giant = $("ggiant"), zoomText = $("gzoom"), dimEl = $("gdim"), scrim = $("gscrim");
  const fades = [...stage.querySelectorAll(".gfade")];
  let W = 0, H = 0, dpr = 1, mouse = null, prog = 0, heroBottom = 0, topOff = 0, curScale = 1;
  const size = () => {
    W = sticky.clientWidth; H = sticky.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2.6e6 / Math.max(1, W * H)));
    heroBottom = giant ? giant.offsetTop + giant.offsetHeight : H * .25;
    topOff = parseFloat(getComputedStyle(sticky).top) || 0;
  };
  size(); addEventListener("resize", size, { passive: true });
  if (document.fonts) document.fonts.ready.then(size);
  // the globe sits fully below the big name (phone and desktop alike)
  const baseRadius = () => Math.max(90, Math.min(W * .47, 460, (H - heroBottom - 56) / 2));

  /* free drag with inertia (mouse: both axes; touch: sideways only, so the page still scrolls) */
  canvas.addEventListener("pointerdown", e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY; lastMove = performance.now(); vPhi = vTheta = 0;
    canvas.setPointerCapture(e.pointerId); canvas.classList.add("dragging");
  });
  const endDrag = () => { if (!dragging) return; dragging = false; idleSince = performance.now(); canvas.classList.remove("dragging"); };
  canvas.addEventListener("pointerup", endDrag); canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointermove", e => {
    const r0 = sticky.getBoundingClientRect(); mouse = [e.clientX - r0.left, e.clientY - r0.top];
    if (!dragging) return;
    const r = baseRadius() * curScale, dx = e.clientX - lastX, dy = e.clientY - lastY;
    const dp = dx / r, dt = (e.pointerType === "mouse" ? dy : 0) / r;
    phi += dp; theta = clamp(theta + dt, -1.2, 1.2);
    const now = performance.now(), ms = Math.max(8, now - lastMove);
    vPhi = dp / ms * 16; vTheta = dt / ms * 16; lastX = e.clientX; lastY = e.clientY; lastMove = now;
  });
  canvas.addEventListener("pointerleave", () => { mouse = null; });

  /* scroll camera */
  const readScroll = () => { const total = stage.offsetHeight - H; prog = total > 0 ? clamp((topOff - stage.getBoundingClientRect().top) / total, 0, 1) : 0; };
  addEventListener("scroll", readScroll, { passive: true }); readScroll();

  // a lat/lng on the screen, with cobe's own maths (sphere radius .8 in clip space, rotation L(theta, phi))
  const project = (lat, lng, ph, th, cx, cy, R) => {
    const t = lat * DEG, l = lng * DEG - Math.PI, r = Math.cos(t);
    const P = [-r * Math.cos(l), Math.sin(t), r * Math.sin(l)];
    const c = Math.cos(th), e = Math.sin(th), d = Math.cos(ph), f = Math.sin(ph);
    return [cx + (d * P[0] + f * P[2]) * R, cy - (f * e * P[0] + c * P[1] - d * e * P[2]) * R, -f * c * P[0] + e * P[1] + d * c * P[2]];
  };
  const light = () => html.getAttribute("data-theme") === "light";

  // a computer without a graphics chip (old PCs, virtual machines, test browsers) draws WebGL on the CPU: ~140 ms a frame,
  // measured 25 Oct 2026 - there the hero shows the still picture (showStill below)
  const softGL = () => {
    try {
      const c = document.createElement("canvas"), g = c.getContext("webgl", { failIfMajorPerformanceCaveat: true });
      if (!g) return true;
      const e = g.getExtension("WEBGL_debug_renderer_info");
      const r = String(g.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : g.RENDERER));
      const x = g.getExtension("WEBGL_lose_context"); if (x) x.loseContext();
      return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(r);
    } catch (e) { return true; }
  };
  let globe = null;
  // no fast WebGL, or the visitor asked for less motion: a still picture of the same globe, in the same place
  const showStill = () => {
    stage.classList.add("noglobe");
    const still = document.createElement("div"); still.className = "gstill"; still.setAttribute("aria-hidden", "true");
    sticky.insertBefore(still, canvas);
    const place = () => {
      size(); const R = baseRadius(), half = R * 1.25;      // the pictures are cut at 1.25 x the globe's radius (glow included)
      still.style.width = still.style.height = `${(2 * half).toFixed(1)}px`;
      still.style.left = `${(W / 2 - half).toFixed(1)}px`; still.style.top = `${(Math.min(H / 2 + R, heroBottom + 24 + R) - half).toFixed(1)}px`;
      still.style.backgroundImage = `url(/assets/globe/still-${light() ? "light" : "dark"}.jpg)`;
    };
    place(); addEventListener("resize", place, { passive: true });
    if (document.fonts) document.fonts.ready.then(place);
    new MutationObserver(place).observe(html, { attributes: true, attributeFilter: ["data-theme"] });
  };
  const start = () => { try {
    globe = createGlobe(canvas, {
      devicePixelRatio: dpr, width: W * dpr, height: H * dpr, phi, theta, dark: 1, diffuse: 1.25,
      mapSamples: 36000, mapBrightness: 4.2, mapBaseBrightness: 0.015,
      baseColor: [0.2, 0.2, 0.21], markerColor: [0.79, 0.53, 0.35], glowColor: [0.16, 0.16, 0.18],
      markers, opacity: 0.95, scale: 1,
      onRender: state => {
        const now = performance.now(), t = (now - t0) / 1000;
        if (!dragging) {
          if (t < 3.4 && !reduce) {
            const k = ease(Math.min(1, t / 3.4));
            phi = startA[0] + wrap(cyPhi - startA[0]) * k; theta = startA[1] + (cyTheta * .8 - startA[1]) * k;
          } else {
            phi += vPhi; theta = clamp(theta + vTheta, -1.2, 1.2); vPhi *= .94; vTheta *= .94;
            if (!reduce && now - idleSince > 2500) phi += 0.0016;
          }
        }
        const w = ease(smooth(.05, .72, prog)), zk = ease(smooth(.08, .8, prog));
        const showPh = phi + wrap(cyPhi - phi) * w, showTh = theta + (cyTheta - theta) * w;
        const zoom = 1 + 1.9 * zk; curScale = zoom;
        const R0 = baseRadius(), Rcss = R0 * zoom;
        const cy0 = Math.min(H / 2 + R0, heroBottom + 24 + R0);
        const cx = W / 2, cy = cy0 + (H / 2 - cy0) * zk;
        canvas.style.transform = `translateY(${(cy - H / 2).toFixed(1)}px)`;
        state.phi = showPh; state.theta = showTh; state.width = W * dpr; state.height = H * dpr;
        state.scale = Rcss / (.8 * H / 2);
        const L = light();                                   // the site's light theme: a pale globe
        state.dark = L ? 0 : 1; state.mapBrightness = L ? 6 : 4.2; state.diffuse = L ? 1.1 : 1.25;
        state.baseColor = L ? [1, 1, 1] : [0.2, 0.2, 0.21]; state.glowColor = L ? [0.93, 0.92, 0.89] : [0.16, 0.16, 0.18];
        state.markerColor = L ? [0.64, 0.34, 0.16] : [0.79, 0.53, 0.35];
        const heroFade = 1 - smooth(.04, .28, prog);
        fades.forEach(el => el.style.opacity = heroFade);
        if (giant) { giant.style.opacity = 1 - smooth(.02, .3, prog); giant.style.transform = `translateY(${-prog * 120}px)`; }
        zoomText.classList.toggle("on", prog > .7); scrim.classList.toggle("on", prog > .7);
        dimEl.style.opacity = smooth(.15, .8, prog);
        const showCities = smooth(.66, .82, prog);
        CITIES.forEach(c => {
          const [x, y, z] = project(c.loc[0], c.loc[1], showPh, showTh, cx, cy, Rcss);
          const near = mouse && z > 0 && Math.hypot(mouse[0] - x, mouse[1] - y) < 26 ? 1 : 0;
          const ox = showCities > 0 ? c.off[0] : 0, oy = showCities > 0 ? c.off[1] : -22;
          c.el.style.transform = `translate(${x + ox}px,${y + oy}px) translate(-50%,-50%)`;
          c.el.style.opacity = z > 0 ? Math.max(showCities, near) : 0;
          c.line.setAttribute("x1", x); c.line.setAttribute("y1", y); c.line.setAttribute("x2", x + ox * .72); c.line.setAttribute("y2", y + oy * .72);
          c.line.style.opacity = showCities > 0 && z > 0 ? showCities : 0;
          c.dot.setAttribute("cx", x); c.dot.setAttribute("cy", y); c.dot.style.opacity = z > 0 ? smooth(.4, .6, prog) : 0;
        });
        const mk = 1 - smooth(.4, .6, prog);              // the globe's own copper dots grow huge when zoomed: they fade, the exact dots take over
        state.markers = markers.map((m, i) => ({ location: m.location, size: i < CITIES.length ? m.size * mk : m.size }));
        if (you) {
          const [x, y, z] = project(you[0], you[1], showPh, showTh, cx, cy, Rcss);
          const o = z > .05 && t > .8 ? 1 : 0;
          youRing.style.transform = `translate(${x}px,${y}px)`; youRing.style.opacity = o;
          youLabel.style.transform = `translate(${x + 14}px,${y}px) translateY(-50%)`; youLabel.style.opacity = youLocal && showCities > 0 ? 0 : o;
        }
        return state;
      }
    });
    stage.classList.add("live");
    requestAnimationFrame(() => canvas.classList.add("ready"));
    addEventListener("pagehide", () => globe && globe.destroy());
  } catch (e) { showStill(); } };
  // the live globe starts after the browser reports its first paint (or after "load" where paint timing is missing), so it never holds up
  // the first view; a 4 s fail-safe starts it anyway if no paint entry ever arrives
  const afterFirstPaint = cb => {
    let done = false; const go = () => { if (!done) { done = true; setTimeout(cb, 0); } };
    const paints = (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes) || [];
    if (paints.includes("paint")) {
      new PerformanceObserver((list, obs) => { obs.disconnect(); go(); }).observe({ type: "paint", buffered: true });
      setTimeout(go, 4000);  // fail-safe: if no paint entry ever arrives, the globe still starts
    }
    else { const late = () => requestAnimationFrame(go); if (document.readyState === "complete") late(); else addEventListener("load", late, { once: true }); }  // browsers without paint timing
  };
  if (reduce || softGL()) showStill(); else afterFirstPaint(start);
}
