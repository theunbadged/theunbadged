/* The Unbadged — the route, now the whole story.
   A camera on rails over a dark, stylized Lutyens' Delhi built from
   OpenStreetMap street geometry (site/data/map.json, ODbL-credited).
   Scroll scrubs the flight from Jantar Mantar to Parliament; event beacons
   ignite at the stations of 20 July. Two hero landmarks are hand-modeled:
   the Jantar Mantar instruments (blue, the protest's home) and the
   Parliament complex, old circle and new triangle (steel, the state's).
   Blue dots are the marchers, red dots the police lines; both illustrative.
   Self-contained: own canvas, renders only while on screen. */
(function () {
  "use strict";

  var root = document.documentElement;
  var section = document.querySelector("[data-route-scene]");
  var canvas = document.getElementById("route-canvas");
  if (!section || !canvas || typeof THREE === "undefined") return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var captions = Array.prototype.slice.call(section.querySelectorAll(".route-caption"));
  var veil = section.querySelector(".evidence-veil");
  var scenes = Array.prototype.slice.call(section.querySelectorAll(".evidence-scene")).map(function (el) {
    return {
      el: el,
      s: parseFloat(el.getAttribute("data-s")),
      e: parseFloat(el.getAttribute("data-e")),
      slides: Array.prototype.slice.call(el.querySelectorAll(".ex-slide")),
      video: el.querySelector("video")
    };
  });

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function range(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }
  function smooth(v) { return v * v * (3 - 2 * v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function v3(a) { return new THREE.Vector3(a[0], a[1], a[2]); }

  var ACCENT = 0xc53b2c;        // police actions: beacons, the crackdown red
  var POLICE = 0xd0453a;        // police dots
  var PROTEST = 0x6da2df;       // the marchers: dots, the route, Jantar Mantar
  var PROTEST_EDGE = 0x7db2e8;
  var STEEL_EDGE = 0x9fc4de;
  var JM_SITE = [50.0, -59.0]; // the observatory itself, NE of the protest-road anchor

  /* ---------- camera script: [start, end, position, lookAt] ---------- */
  var LM = {};   // landmark id -> [x, z], filled from map.json
  var SHOTS = []; // built once landmarks are known

  function buildShots() {
    function at(id, dy, dx, dz, lx, lz) {
      var p = LM[id] || [0, 0];
      return { pos: [p[0] + dx, dy, p[1] + dz], look: [p[0] + (lx || 0), 0, p[1] + (lz || 0)] };
    }
    SHOTS = [
      { s: 0.000, e: 0.060, a: { pos: [0, 340, 130], look: [0, 0, -20] }, b: { pos: [8, 300, 105], look: [4, 0, -25] } },
      { s: 0.060, e: 0.125, a: null, b: at("sansad", 22, -30, 26, 3, 0) },  // cold open: descend to the cordon, the unbadged
      { s: 0.125, e: 0.180, a: null, b: at("sansad", 40, -16, 42, 4, 0) },  // exhibit A behind the veil
      { s: 0.180, e: 0.245, a: null, b: at("jm", 18, 13, 28, 14, -17) },    // the long glide back to where it began
      { s: 0.245, e: 0.300, a: null, b: at("park", 46, 32, 68) },           // fortress glide
      { s: 0.300, e: 0.355, a: null, b: at("park", 34, 24, 52) },           // exhibit B
      { s: 0.355, e: 0.425, a: null, b: at("park", 22, 16, 34) },           // 7:30 am: the first lathis, on video
      { s: 0.425, e: 0.478, a: null, b: at("patel", 30, 22, 46) },
      { s: 0.478, e: 0.559, a: null, b: at("ps", 34, 30, 52) },             // exhibit C, two slides
      { s: 0.559, e: 0.605, a: null, b: at("ps", 26, 24, 42) },
      { s: 0.605, e: 0.655, a: null, b: at("charge", 22, 18, 36) },
      { s: 0.655, e: 0.710, a: null, b: at("charge", 34, 30, 48) },         // exhibit D: the buses
      { s: 0.710, e: 0.791, a: null, b: at("sansad", 34, 44, 44, 12, -3) }, // exhibit E, two slides
      { s: 0.791, e: 0.845, a: null, b: at("sansad", 26, 36, 34, 12, -3) }, // arrival: both houses
      { s: 0.845, e: 0.895, a: null, b: at("sansad", 110, 16, 110, 8, 0) }, // the count: rise
      { s: 0.895, e: 0.936, a: null, b: { pos: [16, 520, 240], look: [10, 0, -10] } }, // blackout
      { s: 0.936, e: 1.000, a: null, b: { pos: [20, 820, 330], look: [20, 0, -30] } }  // the record
    ];
    // chain: each shot starts where the previous ended
    for (var i = 1; i < SHOTS.length; i++) SHOTS[i].a = SHOTS[i - 1].b;
  }

  /* beacon ignition points along the scrub */
  var BEACONS = [
    { id: "jm",     at: 0.195, color: PROTEST },
    { id: "park",   at: 0.365, color: ACCENT },
    { id: "patel",  at: 0.437, color: ACCENT },
    { id: "ps",     at: 0.568, color: ACCENT },
    { id: "charge", at: 0.615, color: ACCENT },
    { id: "sansad", at: 0.800, color: ACCENT }
  ];

  /* ---------- renderer ---------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: false, antialias: window.innerWidth > 700, powerPreference: "high-performance" });
  } catch (e) { canvas.style.display = "none"; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color("#070a0e");
  scene.fog = new THREE.Fog(0x070a0e, 300, 1500);
  var camera = new THREE.PerspectiveCamera(46, 1, 1, 2200);

  var group = new THREE.Group();
  scene.add(group);

  var routeLine = null, routeGeo = null, routeTotal = 0;
  var routePtsArr = null;
  var crowd = null, crowdSeed = null, crowdN = 0;
  var police = null;
  var beaconMeshes = {};
  var ringMeshes = {};
  var blackoutRing = null;
  var heroPulseMats = [];
  var ready = false;

  function segmentsFromRoads(roads, weight) {
    var arr = [];
    roads.forEach(function (r) {
      if (r.w !== weight) return;
      for (var i = 0; i < r.pts.length - 1; i++) {
        arr.push(r.pts[i][0], 0, r.pts[i][1], r.pts[i + 1][0], 0, r.pts[i + 1][1]);
      }
    });
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arr), 3));
    return g;
  }

  function flatShape(pts) {
    // baked (x, z) -> Shape space (x, -z); rotateX(-PI/2) restores world z
    return new THREE.Shape(pts.map(function (p) { return new THREE.Vector2(p[0], -p[1]); }));
  }

  /* widen a polyline into a flat triangle ribbon */
  function ribbon(pts, width, y, positions, indices) {
    var hw = width / 2;
    var base = positions.length / 3;
    for (var i = 0; i < pts.length; i++) {
      var prev = pts[Math.max(0, i - 1)], next = pts[Math.min(pts.length - 1, i + 1)];
      var dx = next[0] - prev[0], dz = next[1] - prev[1];
      var len = Math.sqrt(dx * dx + dz * dz) || 1;
      var nx = -dz / len * hw, nz = dx / len * hw;
      positions.push(pts[i][0] + nx, y, pts[i][1] + nz, pts[i][0] - nx, y, pts[i][1] - nz);
    }
    for (var j = 0; j < pts.length - 1; j++) {
      var a = base + j * 2;
      indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  }

  /* ---------- hero landmarks ---------- */
  function heroPart(target, geo, fill, edgeColor, edgeOpacity, edgeThreshold) {
    var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: fill, side: THREE.DoubleSide }));
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    target.add(mesh);
    var em = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: edgeOpacity });
    em.userData.base = edgeOpacity;
    var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, edgeThreshold || 14), em);
    edges.matrixAutoUpdate = false; edges.updateMatrix();
    target.add(edges);
    heroPulseMats.push(em);
    return mesh;
  }

  /* soft round sprite so dots render as dots, not squares */
  var dotMap = null;
  function dotTexture() {
    if (dotMap) return dotMap;
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.45, "rgba(255,255,255,.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(32, 32, 30, 0, Math.PI * 2); ctx.fill();
    dotMap = new THREE.CanvasTexture(c);
    return dotMap;
  }

  function groundHalo(cx, cz, radius, color) {
    var halo = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.5, radius, 64),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(cx, 0.25, cz);
    group.add(halo);
  }

  /* Jantar Mantar, laid out per the observatory yard: Misra Yantra at the
     north end, the great Samrat Yantra mid-yard, the Ram Yantra drums south. */
  function buildJantarMantar() {
    var FILL = 0x0e1722;
    var jm = new THREE.Group();
    jm.position.set(JM_SITE[0], 0, JM_SITE[1]);

    // Samrat Yantra: the gnomon wall with its stair ridge
    var tri = new THREE.Shape();
    tri.moveTo(-3.4, 0); tri.lineTo(3.4, 0); tri.lineTo(-3.4, 2.7); tri.closePath();
    var gnomon = new THREE.ExtrudeGeometry(tri, { depth: 1.0, bevelEnabled: false });
    gnomon.translate(0, 0, 1.5);
    heroPart(jm, gnomon, FILL, PROTEST_EDGE, 0.9);

    // its two flanking quadrant crescents
    [-0.6, 4.6].forEach(function (dz) {
      var arc = new THREE.RingGeometry(2.0, 2.6, 28, 1, 0, Math.PI);
      arc.translate(0, 0, dz);
      heroPart(jm, arc, FILL, PROTEST_EDGE, 0.75, 30);
    });

    // Misra Yantra: wings curving to a point, arched notch, stair spine —
    // and its nested arc bands, the shape's signature
    var mi = new THREE.Shape();
    mi.moveTo(-1.55, 0);
    mi.quadraticCurveTo(-1.75, 1.55, 0, 2.25);
    mi.quadraticCurveTo(1.75, 1.55, 1.55, 0);
    mi.lineTo(0.5, 0);
    mi.absarc(0, 0, 0.5, 0, Math.PI, false);
    mi.lineTo(-1.55, 0);
    var MI_ROT = 0.55, MI_X = -2, MI_Z = -7;
    var misra = new THREE.ExtrudeGeometry(mi, { depth: 1.0, bevelEnabled: false });
    misra.translate(0, 0, -0.5);
    misra.rotateY(MI_ROT);
    misra.translate(MI_X, 0, MI_Z);
    heroPart(jm, misra, FILL, PROTEST_EDGE, 0.9);
    var spine = new THREE.BoxGeometry(0.42, 2.7, 1.5);
    spine.translate(0, 1.35, 0);
    spine.rotateY(MI_ROT);
    spine.translate(MI_X, 0, MI_Z);
    heroPart(jm, spine, FILL, PROTEST_EDGE, 0.85);
    [0.78, 0.55].forEach(function (k) {
      var pts = mi.getPoints(36).map(function (v) { return new THREE.Vector3(v.x * k, v.y * k, 0.52); });
      var lg = new THREE.BufferGeometry().setFromPoints(pts);
      lg.rotateY(MI_ROT);
      lg.translate(MI_X, 0, MI_Z);
      var lm = new THREE.LineBasicMaterial({ color: PROTEST_EDGE, transparent: true, opacity: 0.7 });
      lm.userData.base = 0.7;
      var loop = new THREE.LineLoop(lg, lm);
      loop.matrixAutoUpdate = false; loop.updateMatrix();
      jm.add(loop);
      heroPulseMats.push(lm);
    });

    // Ram Yantra: the pair of open cylindrical drums
    [[-5.5, 8, 1.7, 1.3], [-1.5, 9.5, 1.1, 1.0]].forEach(function (r) {
      var cyl = new THREE.CylinderGeometry(r[2], r[2], r[3], 24, 1, true);
      cyl.translate(r[0], r[3] / 2, r[1]);
      heroPart(jm, cyl, FILL, PROTEST_EDGE, 0.7, 30);
    });

    group.add(jm);
    groundHalo(JM_SITE[0] - 3, JM_SITE[1] + 2, 13, PROTEST);
  }

  /* Parliament, honest to the aerial: the old Sansad Bhavan as an annular
     ring with three chamber halls and a central dome inside; the new
     building as a triangle with its hexagonal courtyard core, flat side
     facing the old house. */
  function buildParliament() {
    var FILL = 0x101a24;
    var old = LM.sansad || [0, 0];
    var pl = new THREE.Group();
    pl.position.set(old[0], 0, old[1]);

    // plinth, then the circular ring building (annular, not a solid drum)
    var plinth = new THREE.CylinderGeometry(7.0, 7.0, 0.3, 48);
    plinth.translate(0, 0.15, 0);
    heroPart(pl, plinth, FILL, STEEL_EDGE, 0.5, 30);
    var ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, 5.8, 0, Math.PI * 2, false);
    var ringHole = new THREE.Path();
    ringHole.absarc(0, 0, 4.3, 0, Math.PI * 2, true);
    ringShape.holes.push(ringHole);
    var ringGeo = new THREE.ExtrudeGeometry(ringShape, { depth: 1.7, bevelEnabled: false });
    ringGeo.rotateX(-Math.PI / 2);
    heroPart(pl, ringGeo, FILL, STEEL_EDGE, 0.55, 30);

    // the outer ring of columns
    var colArr = [];
    for (var i = 0; i < 32; i++) {
      var a = i / 32 * Math.PI * 2;
      var cx = Math.cos(a) * 6.4, cz = Math.sin(a) * 6.4;
      colArr.push(cx, 0.3, cz, cx, 1.7, cz);
    }
    var colGeo = new THREE.BufferGeometry();
    colGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(colArr), 3));
    var colMat = new THREE.LineBasicMaterial({ color: STEEL_EDGE, transparent: true, opacity: 0.8 });
    colMat.userData.base = 0.8;
    pl.add(new THREE.LineSegments(colGeo, colMat));
    heroPulseMats.push(colMat);

    // the three chamber halls inside the ring, 120 degrees apart
    [30, 150, 270].forEach(function (deg) {
      var a = deg * Math.PI / 180;
      var hall = new THREE.CylinderGeometry(1.9, 1.9, 1.5, 24);
      hall.translate(Math.cos(a) * 2.4, 0.75, Math.sin(a) * 2.4);
      heroPart(pl, hall, FILL, STEEL_EDGE, 0.6, 30);
    });

    // central dome
    var domeBase = new THREE.CylinderGeometry(1.7, 1.7, 1.6, 32);
    domeBase.translate(0, 0.8, 0);
    heroPart(pl, domeBase, FILL, STEEL_EDGE, 0.6, 30);
    var dome = new THREE.SphereGeometry(1.4, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(0, 1.6, 0);
    var domeMesh = new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ color: 0x16222e }));
    domeMesh.matrixAutoUpdate = false; domeMesh.updateMatrix();
    pl.add(domeMesh);

    // the new building: a clear gap east of the circle, the pair aligned
    // on the triangle's median (the east-west line through both centers)
    var NB_X = 14.5, NB_Y = 0; // shape space: y maps to -z (north)
    var t = new THREE.Shape();
    [0, 120, 240].forEach(function (deg, idx) {
      var a = deg * Math.PI / 180;
      var px = NB_X + Math.cos(a) * 7.2, py = NB_Y + Math.sin(a) * 7.2;
      if (idx === 0) t.moveTo(px, py); else t.lineTo(px, py);
    });
    t.closePath();
    var tri = new THREE.ExtrudeGeometry(t, { depth: 2.4, bevelEnabled: false });
    tri.rotateX(-Math.PI / 2);
    heroPart(pl, tri, FILL, STEEL_EDGE, 0.8);

    // its hexagonal courtyard core, standing proud of the roof
    var hex = new THREE.Shape();
    var hexHole = new THREE.Path();
    for (var h = 0; h < 6; h++) {
      var ha = h / 6 * Math.PI * 2;
      var ox = NB_X + Math.cos(ha) * 2.4, oy = NB_Y + Math.sin(ha) * 2.4;
      var ix = NB_X + Math.cos(ha) * 1.6, iy = NB_Y + Math.sin(ha) * 1.6;
      if (h === 0) { hex.moveTo(ox, oy); hexHole.moveTo(ix, iy); }
      else { hex.lineTo(ox, oy); hexHole.lineTo(ix, iy); }
    }
    hex.closePath(); hexHole.closePath();
    hex.holes.push(hexHole);
    var hexGeo = new THREE.ExtrudeGeometry(hex, { depth: 2.7, bevelEnabled: false });
    hexGeo.rotateX(-Math.PI / 2);
    heroPart(pl, hexGeo, FILL, STEEL_EDGE, 0.7);

    group.add(pl);
    groundHalo(old[0] + 7, old[1], 19, 0x7e9bb2);
  }

  /* the metro stations closed that morning: ringed M-less markers, crossed out */
  var METRO = [
    [78.2, -123.8],  // Rajiv Chowk
    [73.3, -40.9],   // Janpath
    [22.5, -14.4]    // Patel Chowk
  ];
  var metroMats = [];
  function buildMetro() {
    METRO.forEach(function (m) {
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(1.35, 1.8, 32),
        new THREE.MeshBasicMaterial({ color: STEEL_EDGE, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(m[0], 0.35, m[1]);
      group.add(ring);
      metroMats.push(ring.material);

      var d = 1.05;
      var xArr = [
        m[0] - d, 0.38, m[1] - d, m[0] + d, 0.38, m[1] + d,
        m[0] - d, 0.38, m[1] + d, m[0] + d, 0.38, m[1] - d
      ];
      var xg = new THREE.BufferGeometry();
      xg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(xArr), 3));
      var xm = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 });
      group.add(new THREE.LineSegments(xg, xm));
      metroMats.push(xm);
    });
  }

  /* ---------- the people: blue protestors, red police lines ----------
     Illustrative, not headcounts (the credit line says so), but the ratio
     is honest: protestors outnumber police roughly 10 to 1. Three blue
     populations: the sit-in around the Jantar Mantar grounds, an ambient
     scatter seeded on the surrounding streets, and the march, which moves
     down the route in soft traveling waves rather than a column. Density
     pools wherever the story's current event is flaring. Every dot is
     simulated each frame: a spring toward where it wants to be, slow
     wander, and close-range dynamics against the police line. A protestor
     meeting a police dot either backs off or, if bold and fresh, presses
     in while others gather; press too long and it breaks away; press hard
     enough in numbers and the police line itself bows before re-forming. */
  var polBase = null, polDisp = null, polSeed = null, polN = 0;
  var polClusters = [];
  var crowdMode = null, crowdAux = null, crowdVel = null, ambAnchor = null;

  function buildCrowds(map) {
    var small = window.innerWidth < 700;

    crowdN = small ? 750 : 1800;
    crowdSeed = new Float32Array(crowdN * 3);
    crowdMode = new Uint8Array(crowdN);   // 0 sit-in, 1 marcher, 2 ambient
    crowdAux = new Float32Array(crowdN * 2);   // courage, engagement clock
    crowdVel = new Float32Array(crowdN * 2);
    ambAnchor = new Float32Array(crowdN * 2);

    // street points near the corridor seed the ambient scatter
    var streets = [];
    (map.roads || []).forEach(function (r) {
      r.pts.forEach(function (pt) {
        if (pt[0] > -45 && pt[0] < 95 && pt[1] > -95 && pt[1] < 75) streets.push(pt);
      });
    });
    function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) * 0.8; }

    var home = LM.jm || [0, 0];
    for (var i = 0; i < crowdN; i++) {
      var r20 = i % 20;
      crowdMode[i] = r20 < 5 ? 0 : (r20 < 11 ? 2 : 1);
      crowdSeed[i * 3] = Math.random();
      crowdSeed[i * 3 + 1] = (Math.random() - 0.5) * 4.4;
      crowdSeed[i * 3 + 2] = Math.random() * Math.PI * 2;
      crowdAux[i * 2] = Math.random(); // courage
      if (crowdMode[i] === 2) {
        if (streets.length && Math.random() < 0.55) {
          var sp = streets[(Math.random() * streets.length) | 0];
          ambAnchor[i * 2] = sp[0] + gauss() * 2;
          ambAnchor[i * 2 + 1] = sp[1] + gauss() * 2;
        } else {
          ambAnchor[i * 2] = home[0] + gauss() * 11;
          ambAnchor[i * 2 + 1] = home[1] + gauss() * 11;
        }
      }
    }
    var cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(crowdN * 3), 3));
    crowd = new THREE.Points(cg, new THREE.PointsMaterial({
      color: PROTEST, size: small ? 1.15 : 0.95, map: dotTexture(), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    group.add(crowd);

    var pp = [];
    polClusters = [];
    function cluster(id, count, spread) {
      var p = LM[id];
      if (!p) return;
      var startIdx = pp.length / 3;
      for (var k = 0; k < count; k++) {
        var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
        pp.push(p[0] + Math.cos(a) * r, 0.55, p[1] + Math.sin(a) * r);
      }
      polClusters.push({ x: p[0], z: p[1], r: spread, start: startIdx, n: count });
    }
    cluster("park", 14, 2.0);
    cluster("patel", 18, 2.4);
    cluster("ps", 14, 2.0);
    cluster("charge", 24, 2.6);
    if (LM.sansad) {
      // the cordon: two arcs across the approach from the north-east
      var toward = Math.atan2(LM.charge[1] - LM.sansad[1], LM.charge[0] - LM.sansad[0]);
      var cordonStart = pp.length / 3;
      for (var row = 0; row < 2; row++) {
        var rr = 13.5 + row * 1.5;
        var nRow = small ? 22 : 36;
        for (var d = 0; d < nRow; d++) {
          var aa = toward - 0.12 + (d / (nRow - 1) - 0.5) * 1.2;
          pp.push(
            LM.sansad[0] + Math.cos(aa) * rr + (Math.random() - 0.5) * 0.7, 0.55,
            LM.sansad[1] + Math.sin(aa) * rr + (Math.random() - 0.5) * 0.7
          );
        }
      }
      polClusters.push({
        x: LM.sansad[0] + Math.cos(toward - 0.12) * 14.2,
        z: LM.sansad[1] + Math.sin(toward - 0.12) * 14.2,
        r: 10, start: cordonStart, n: pp.length / 3 - cordonStart
      });
    }
    polN = pp.length / 3;
    polBase = new Float32Array(polN * 2);
    polDisp = new Float32Array(polN * 2);
    polSeed = new Float32Array(polN);
    for (var j = 0; j < polN; j++) {
      polBase[j * 2] = pp[j * 3];
      polBase[j * 2 + 1] = pp[j * 3 + 2];
      polSeed[j] = Math.random() * Math.PI * 2;
    }
    var pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pp), 3));
    police = new THREE.Points(pg, new THREE.PointsMaterial({
      color: POLICE, size: small ? 1.3 : 1.1, map: dotTexture(), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    group.add(police);

    updateCrowd(0, 0, 0, 0);
  }

  var RP = { x: 0, z: 0, nx: 0, nz: 0 };
  function routePoint(t, out) {
    var tt = clamp(t, 0, 1) * (routeTotal - 1);
    var idx = Math.floor(tt), f = tt - idx;
    var a = routePtsArr[idx], b = routePtsArr[Math.min(idx + 1, routeTotal - 1)];
    out.x = a.x + (b.x - a.x) * f;
    out.z = a.z + (b.z - a.z) * f;
    var dx = b.x - a.x, dz = b.z - a.z;
    var len = Math.sqrt(dx * dx + dz * dz) || 1;
    out.nx = -dz / len;
    out.nz = dx / len;
  }

  function updateCrowd(p, m, time, dt) {
    if (!crowd || !routePtsArr) return;
    var pos = crowd.geometry.attributes.position.array;
    var start = routePtsArr[0];
    var park = LM.park || [start.x, start.z];
    var cdx = park[0] - start.x, cdz = park[1] - start.z;
    var clen = Math.sqrt(cdx * cdx + cdz * cdz) || 1;
    var cnx = -cdz / clen, cnz = cdx / clen;

    // where the story is flaring right now, crowds pool
    var events = [];
    for (var b = 0; b < BEACONS.length; b++) {
      var bk = BEACONS[b];
      if (!LM[bk.id]) continue;
      var s = smooth(range(p, bk.at - 0.01, bk.at + 0.03)) *
              (1 - smooth(range(p, bk.at + 0.1, bk.at + 0.16)));
      if (s > 0.01) events.push([LM[bk.id][0], LM[bk.id][1], s]);
    }

    // the police line: bowed by pressure, springing back, small sway
    var ppos = police ? police.geometry.attributes.position.array : null;
    var polActive = ppos && police.material.opacity > 0.04;
    if (ppos) {
      var decay = Math.max(0, 1 - 2.2 * dt);
      for (var j = 0; j < polN; j++) {
        polDisp[j * 2] *= decay;
        polDisp[j * 2 + 1] *= decay;
        ppos[j * 3] = polBase[j * 2] + polDisp[j * 2] + Math.sin(time * 0.0011 + polSeed[j]) * 0.16;
        ppos[j * 3 + 2] = polBase[j * 2 + 1] + polDisp[j * 2 + 1] + Math.cos(time * 0.0009 + polSeed[j] * 1.7) * 0.16;
      }
      police.geometry.attributes.position.needsUpdate = true;
    }

    for (var i = 0; i < crowdN; i++) {
      var i3 = i * 3, i2 = i * 2;
      var u = crowdSeed[i3], lat = crowdSeed[i3 + 1], ph = crowdSeed[i3 + 2];
      var mode = crowdMode[i];
      var tx, tz;
      if (mode === 0) {
        // the sit-in: thinning up the corridor toward the Park Hotel stretch
        var v = u * u;
        tx = start.x + cdx * v + cnx * lat * 2.0 + Math.sin(time * 0.0003 + ph) * 1.4;
        tz = start.z + cdz * v + cnz * lat * 2.0 + Math.cos(time * 0.00023 + ph * 1.7) * 1.4;
      } else if (mode === 2) {
        // ambient: scattered on the streets, drifting slowly
        tx = ambAnchor[i2] + Math.sin(time * 0.00021 + ph) * 2.2;
        tz = ambAnchor[i2 + 1] + Math.cos(time * 0.00017 + ph * 1.3) * 2.2;
      } else {
        // the march: personal reach thinning toward the front, and soft
        // waves of bunching that travel up the column
        var reach = 0.86 * Math.pow(u, 1.6);
        var t = Math.min(m * 1.12, reach);
        t -= 0.03 * (0.5 + 0.5 * Math.sin(t * 16 - time * 0.00055 + ph * 0.6)) * Math.min(t * 10, 1);
        if (t < 0) t = 0;
        routePoint(t, RP);
        var w = lat * (1.5 + 0.7 * Math.sin(ph + time * 0.00028));
        tx = RP.x + RP.nx * w;
        tz = RP.z + RP.nz * w;
      }
      for (var e = 0; e < events.length; e++) {
        var ex = events[e][0] - tx, ez = events[e][1] - tz;
        var ed2 = ex * ex + ez * ez;
        if (ed2 < 196) {
          var ed = Math.sqrt(ed2) + 0.001;
          var pull = events[e][2] * 0.5 * (1 - ed / 14);
          tx += ex * pull;
          tz += ez * pull;
        }
      }

      if (dt <= 0) {
        pos[i3] = tx; pos[i3 + 1] = 0.55; pos[i3 + 2] = tz;
        continue;
      }

      var x = pos[i3], z = pos[i3 + 2];
      var ax = (tx - x) * 2.4, az = (tz - z) * 2.4;

      // close quarters with the police line
      var engaged = false;
      if (polActive) {
        var courage = crowdAux[i2], eng = crowdAux[i2 + 1];
        for (var c = 0; c < polClusters.length; c++) {
          var cl = polClusters[c];
          var dcx = x - cl.x, dcz = z - cl.z;
          var reachR = cl.r + 5.5;
          if (dcx * dcx + dcz * dcz > reachR * reachR) continue;
          for (var k = cl.start; k < cl.start + cl.n; k++) {
            var pdx = x - ppos[k * 3], pdz = z - ppos[k * 3 + 2];
            var d2 = pdx * pdx + pdz * pdz;
            if (d2 > 9) continue;
            var d = Math.sqrt(d2) + 0.001;
            var nx = pdx / d, nz = pdz / d;
            engaged = true;
            // bold and fresh presses in; tired or timid backs away
            var bold = courage > 0.5 && eng < 1.5 + courage * 3.5;
            var f = bold ? -3.4 * (1.1 - d / 3.2) : 5.2 * (1.1 - d / 3.2);
            f += Math.sin(time * 0.004 + ph * 7) * 1.8; // the shoving
            ax += nx * f;
            az += nz * f;
            // and pressure bends the police line
            polDisp[k * 2] -= nx * 0.9 * dt;
            polDisp[k * 2 + 1] -= nz * 0.9 * dt;
          }
        }
        crowdAux[i2 + 1] = engaged ? eng + dt : Math.max(0, eng - dt * 0.6);
      }

      var vx = crowdVel[i2] * Math.max(0, 1 - 3.0 * dt) + ax * dt;
      var vz = crowdVel[i2 + 1] * Math.max(0, 1 - 3.0 * dt) + az * dt;
      // leash: dynamics never smear the crowd's intended shape
      var lx = tx - (x + vx * dt), lz = tz - (z + vz * dt);
      if (lx * lx + lz * lz > 64) { vx += lx * 6 * dt; vz += lz * 6 * dt; }
      crowdVel[i2] = vx;
      crowdVel[i2 + 1] = vz;
      pos[i3] = x + vx * dt;
      pos[i3 + 1] = 0.55;
      pos[i3 + 2] = z + vz * dt;
    }
    crowd.geometry.attributes.position.needsUpdate = true;
  }

  /* baked OSM footprints under the hero models make way for them */
  function nearHeroSite(b) {
    var xs = 0, zs = 0;
    b.pts.forEach(function (p) { xs += p[0]; zs += p[1]; });
    var cx = xs / b.pts.length, cz = zs / b.pts.length;
    var sites = [[JM_SITE[0], JM_SITE[1], 10]];
    if (LM.sansad) {
      sites.push([LM.sansad[0], LM.sansad[1], 9]);
      sites.push([LM.sansad[0] + 14.5, LM.sansad[1], 9]);
    }
    return sites.some(function (s) {
      var dx = cx - s[0], dz = cz - s[1];
      return dx * dx + dz * dz < s[2] * s[2];
    });
  }

  function buildScene(map) {
    map.landmarks.forEach(function (lm) { LM[lm.id] = lm.xz; });
    LM.charge = [-8.8, 33.2]; // Sansad Marg lower stretch, from the route bake
    buildShots();

    // parks and greens: barely-there fills that shape the city's negative space
    (map.parks || []).forEach(function (pk, i) {
      var g = new THREE.ShapeGeometry(flatShape(pk.pts));
      g.rotateX(-Math.PI / 2);
      var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
        color: 0x0c1712, transparent: true, opacity: 0.55, depthWrite: false
      }));
      m.position.y = 0.03 + (i % 7) * 0.002; // avoid z-fighting between overlaps
      m.matrixAutoUpdate = false; m.updateMatrix();
      group.add(m);
    });

    // major roads as width ribbons under the line grid
    var rpos = [], ridx = [];
    map.roads.forEach(function (r) { if (r.w === 2) ribbon(r.pts, 1.5, 0.08, rpos, ridx); });
    var rgeo = new THREE.BufferGeometry();
    rgeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(rpos), 3));
    rgeo.setIndex(ridx);
    group.add(new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({
      color: 0x1a222c, transparent: true, opacity: 0.9, depthWrite: false
    })));

    // street grid: minor faint, major brighter
    var minor = new THREE.LineSegments(segmentsFromRoads(map.roads, 1),
      new THREE.LineBasicMaterial({ color: 0x27313d, transparent: true, opacity: 0.5 }));
    minor.position.y = 0.12; group.add(minor);
    var major = new THREE.LineSegments(segmentsFromRoads(map.roads, 2),
      new THREE.LineBasicMaterial({ color: 0x46596d, transparent: true, opacity: 0.85 }));
    major.position.y = 0.15; group.add(major);

    // context buildings: dark extruded volumes with lit edges
    var edgePositions = [];
    (map.buildings || []).forEach(function (b) {
      if (nearHeroSite(b)) return;
      var g = new THREE.ExtrudeGeometry(flatShape(b.pts), { depth: b.h || 0.8, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      var mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x111922 }));
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      group.add(mesh);
      var eg = new THREE.EdgesGeometry(g, 18);
      var arr = eg.attributes.position.array;
      for (var k = 0; k < arr.length; k++) edgePositions.push(arr[k]);
      eg.dispose();
    });
    var egeo = new THREE.BufferGeometry();
    egeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(edgePositions), 3));
    group.add(new THREE.LineSegments(egeo, new THREE.LineBasicMaterial({
      color: 0x51667c, transparent: true, opacity: 0.6
    })));

    // the two hero landmarks, and the closed metro stations
    buildJantarMantar();
    buildParliament();
    buildMetro();

    // ground shimmer: sparse points so the dark isn't empty
    var n = window.innerWidth < 700 ? 250 : 600;
    var pts = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      pts[i * 3] = (Math.random() - 0.5) * 640;
      pts[i * 3 + 1] = Math.random() * 2;
      pts[i * 3 + 2] = (Math.random() - 0.5) * 640;
    }
    var pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    group.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x2c3946, size: 1.4, map: dotTexture(), transparent: true, opacity: 0.5, depthWrite: false })));

    // the march route: ember ribbon, drawn in as the camera travels
    var curve = new THREE.CatmullRomCurve3(map.route.map(function (p) { return new THREE.Vector3(p[0], 0.7, p[1]); }), false, "catmullrom", 0.35);
    var routePts = curve.getPoints(240);
    routePtsArr = routePts;
    routeGeo = new THREE.BufferGeometry().setFromPoints(routePts);
    routeTotal = routePts.length;
    routeLine = new THREE.Line(routeGeo, new THREE.LineBasicMaterial({ color: PROTEST, transparent: true, opacity: 0.95 }));
    routeGeo.setDrawRange(0, 2);
    group.add(routeLine);

    buildCrowds(map);

    // beacons: glow column + expanding ground ring per station
    BEACONS.forEach(function (b) {
      var p = LM[b.id];
      if (!p) return;
      var col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 60, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      col.position.set(p[0], 30, p[1]);
      group.add(col);
      beaconMeshes[b.id] = col;

      var ring = new THREE.Mesh(
        new THREE.RingGeometry(1, 1.35, 48),
        new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p[0], 0.4, p[1]);
      group.add(ring);
      ringMeshes[b.id] = ring;
    });

    // the blackout: a ~5 km ring (500 units) that appears at the pull-back
    blackoutRing = new THREE.Mesh(
      new THREE.RingGeometry(494, 500, 96),
      new THREE.MeshBasicMaterial({ color: 0x8091a5, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    blackoutRing.rotation.x = -Math.PI / 2;
    blackoutRing.position.set(LM.jm ? LM.jm[0] : 0, 0.3, LM.jm ? LM.jm[1] : 0);
    group.add(blackoutRing);

    ready = true;
    if (reduced) renderStatic();
  }

  fetch("/data/map.json").then(function (r) { return r.json(); }).then(buildScene)
    .catch(function () { canvas.style.display = "none"; });

  /* ---------- scrub ---------- */
  function progress() {
    var rect = section.getBoundingClientRect();
    var travel = section.offsetHeight - window.innerHeight;
    return clamp(-rect.top / Math.max(1, travel), 0, 1);
  }

  function cameraAt(p) {
    for (var i = 0; i < SHOTS.length; i++) {
      var sh = SHOTS[i];
      if (p <= sh.e || i === SHOTS.length - 1) {
        // settle early: the camera reaches its mark ~70% through the window
        // and holds, so the subject is centered while its text is still up
        var t = smooth(range(p, sh.s, sh.s + (sh.e - sh.s) * 0.72));
        var pos = [lerp(sh.a.pos[0], sh.b.pos[0], t), lerp(sh.a.pos[1], sh.b.pos[1], t), lerp(sh.a.pos[2], sh.b.pos[2], t)];
        var look = [lerp(sh.a.look[0], sh.b.look[0], t), lerp(sh.a.look[1], sh.b.look[1], t), lerp(sh.a.look[2], sh.b.look[2], t)];
        camera.position.set(pos[0], pos[1], pos[2]);
        camera.lookAt(v3(look));
        return;
      }
    }
  }

  var lastTime = 0;
  function update(time) {
    var p = progress();
    cameraAt(p);
    root.style.setProperty("--page-progress", p.toFixed(4));

    var dt = clamp((time - lastTime) / 1000, 0.001, 0.05);
    lastTime = time;

    // the march sets out only after the 7:30 am video scene: until the
    // Patel Chowk chapter the column stays massed at Jantar Mantar, then
    // the wave and its route ribbon roll out together
    var m = smooth(range(p, 0.432, 0.798));
    if (routeGeo) routeGeo.setDrawRange(0, Math.max(2, Math.floor(routeTotal * m)));
    updateCrowd(p, m, time, dt);
    if (crowd) crowd.material.opacity = smooth(range(p, 0.18, 0.22)) * 0.6;
    // police were in place before the story reaches them: the cold open
    // descends onto an already-formed cordon
    if (police) police.material.opacity = smooth(range(p, 0.07, 0.11)) * 0.8;
    var metroVis = smooth(range(p, 0.25, 0.29)) * 0.75;
    metroMats.forEach(function (mm) { mm.opacity = metroVis; });

    // beacons ignite and breathe once lit
    BEACONS.forEach(function (b) {
      var lit = smooth(range(p, b.at, b.at + 0.04));
      var col = beaconMeshes[b.id], ring = ringMeshes[b.id];
      if (!col) return;
      col.material.opacity = lit * (0.5 + 0.14 * Math.sin(time * 0.003 + b.at * 40));
      var pulse = 1 + ((time * 0.001 + b.at * 7) % 1.6) * 9;
      ring.scale.setScalar(lit > 0 ? pulse : 1);
      ring.material.opacity = lit * clamp(1.25 - pulse / 9, 0, 1) * 0.6;
    });

    // hero landmark edges breathe gently
    var breathe = 0.85 + 0.15 * Math.sin(time * 0.0016);
    heroPulseMats.forEach(function (m) { m.opacity = m.userData.base * breathe; });

    // blackout ring at the pull-back
    if (blackoutRing) blackoutRing.material.opacity = smooth(range(p, 0.905, 0.945)) * 0.5;

    // captions
    captions.forEach(function (cap) {
      var s = parseFloat(cap.getAttribute("data-s"));
      var e = parseFloat(cap.getAttribute("data-e"));
      var fadeIn = s <= 0 ? 1 : smooth(range(p, s, s + 0.022));
      var vis = Math.min(fadeIn, 1 - smooth(range(p, e - 0.022, e)));
      cap.style.opacity = vis.toFixed(3);
      cap.style.transform = "translateY(" + ((1 - vis) * 14).toFixed(1) + "px)";
      cap.style.visibility = vis > 0.01 ? "visible" : "hidden";
    });

    // evidence interludes: the lights dim, the exhibit holds, the map resumes
    var veilMax = 0;
    scenes.forEach(function (sc) {
      if (sc.el.getAttribute("data-dead") === "1") return;
      // short fades: the dwell (fully-visible span) is what the reader gets,
      // so it must own most of the window
      var vis = Math.min(smooth(range(p, sc.s, sc.s + 0.012)), 1 - smooth(range(p, sc.e - 0.012, sc.e)));
      veilMax = Math.max(veilMax, vis);
      sc.el.style.opacity = vis.toFixed(3);
      sc.el.style.transform = "translateY(" + ((1 - vis) * 10).toFixed(1) + "px)";
      sc.el.style.visibility = vis > 0.01 ? "visible" : "hidden";
      if (sc.video) {
        // the clip runs only while its scene is up
        if (vis > 0.05) {
          if (sc.video.paused) {
            sc.video.muted = true;
            var pr = sc.video.play();
            if (pr && pr.catch) pr.catch(function () {});
          }
        } else if (!sc.video.paused) sc.video.pause();
      }
      if (sc.slides.length > 1 && vis > 0.01) {
        // slideshow: crossfade the slides across the fully-visible window,
        // so the last slide holds as long as the first
        var t = range(p, sc.s + 0.012, sc.e - 0.012);
        var per = 1 / sc.slides.length;
        sc.slides.forEach(function (slide, si) {
          var a = si * per, b = (si + 1) * per;
          var so = si === 0
            ? 1 - smooth(range(t, b - 0.03, b + 0.03))
            : Math.min(smooth(range(t, a - 0.03, a + 0.03)),
                       si === sc.slides.length - 1 ? 1 : 1 - smooth(range(t, b - 0.03, b + 0.03)));
          slide.style.opacity = so.toFixed(3);
        });
      }
    });
    if (veil) veil.style.opacity = (veilMax * 0.96).toFixed(3);
  }

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  function renderStatic() {
    resize();
    // reduced motion: single readable overview, everything lit
    camera.position.set(0, 480, 220);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    if (routeGeo) routeGeo.setDrawRange(0, routeTotal);
    updateCrowd(1, 1, 0, 0);
    if (crowd) crowd.material.opacity = 0.6;
    if (police) police.material.opacity = 0.8;
    metroMats.forEach(function (mm) { mm.opacity = 0.75; });
    Object.keys(beaconMeshes).forEach(function (k) { beaconMeshes[k].material.opacity = 0.55; });
    if (blackoutRing) blackoutRing.material.opacity = 0.4;
    captions.forEach(function (c) { c.style.opacity = "1"; c.style.visibility = "visible"; c.style.position = "relative"; });
    scenes.forEach(function (sc) {
      sc.el.style.opacity = "1"; sc.el.style.visibility = "visible";
      if (sc.video) sc.video.setAttribute("controls", "controls");
    });
    if (veil) veil.style.opacity = "0";
    renderer.render(scene, camera);
  }

  if (!reduced) {
    var inView = false;
    var observer = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
    }, { threshold: 0 });
    observer.observe(section);

    (function loop(t) {
      requestAnimationFrame(loop);
      if (!inView || document.hidden || !ready) return;
      update(t || 0);
      renderer.render(scene, camera);
    })(0);
  }
})();
