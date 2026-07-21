/* The Unbadged — the route walkthrough.
   A camera on rails over a dark, stylized Lutyens' Delhi built from
   OpenStreetMap street geometry (site/data/map.json, ODbL-credited).
   Scroll scrubs the camera from Jantar Mantar toward Parliament; event
   beacons ignite at the stations of 20 July. Self-contained: own canvas,
   renders only while its section is on screen. */
(function () {
  "use strict";

  var section = document.querySelector("[data-route-scene]");
  var canvas = document.getElementById("route-canvas");
  if (!section || !canvas || typeof THREE === "undefined") return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var captions = Array.prototype.slice.call(section.querySelectorAll(".route-caption"));

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function range(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }
  function smooth(v) { return v * v * (3 - 2 * v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function v3(a) { return new THREE.Vector3(a[0], a[1], a[2]); }

  /* ---------- camera script: [start, end, position, lookAt] ---------- */
  var LM = {};   // landmark id -> [x, z], filled from map.json
  var SHOTS = []; // built once landmarks are known

  function buildShots() {
    function at(id, dy, dx, dz) {
      var p = LM[id] || [0, 0];
      return { pos: [p[0] + dx, dy, p[1] + dz], look: [p[0], 0, p[1]] };
    }
    SHOTS = [
      { s: 0.00, e: 0.13, a: { pos: [0, 340, 130], look: [0, 0, -20] }, b: { pos: [10, 300, 110], look: [5, 0, -20] } },
      { s: 0.13, e: 0.30, a: null, b: at("jm", 20, 12, 32) },
      { s: 0.30, e: 0.45, a: null, b: at("park", 46, 32, 68) },
      { s: 0.45, e: 0.60, a: null, b: at("patel", 32, 24, 50) },
      { s: 0.60, e: 0.74, a: null, b: at("ps", 28, 26, 46) },
      { s: 0.74, e: 0.88, a: null, b: at("sansad", 26, 30, 42) },
      { s: 0.88, e: 1.00, a: null, b: { pos: [20, 800, 330], look: [20, 0, -30] } }
    ];
    // chain: each shot starts where the previous ended
    for (var i = 1; i < SHOTS.length; i++) SHOTS[i].a = SHOTS[i - 1].b;
  }

  /* beacon ignition points along the scrub */
  var BEACONS = [
    { id: "jm",     at: 0.16 },
    { id: "park",   at: 0.33 },
    { id: "patel",  at: 0.48 },
    { id: "ps",     at: 0.63 },
    { id: "sansad", at: 0.77 }
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
  var beaconMeshes = {};
  var ringMeshes = {};
  var blackoutRing = null;
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

  function buildScene(map) {
    map.landmarks.forEach(function (lm) { LM[lm.id] = lm.xz; });
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

    // key buildings: dark extruded volumes with lit edges (Parliament,
    // the Jantar Mantar yantras, ministries along the route)
    var edgePositions = [];
    (map.buildings || []).forEach(function (b) {
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
    group.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x2c3946, size: 1.4, transparent: true, opacity: 0.5, depthWrite: false })));

    // the march route: ember ribbon, drawn in as the camera travels
    var curve = new THREE.CatmullRomCurve3(map.route.map(function (p) { return new THREE.Vector3(p[0], 0.7, p[1]); }), false, "catmullrom", 0.35);
    var routePts = curve.getPoints(240);
    routeGeo = new THREE.BufferGeometry().setFromPoints(routePts);
    routeTotal = routePts.length;
    routeLine = new THREE.Line(routeGeo, new THREE.LineBasicMaterial({ color: 0xd9822b, transparent: true, opacity: 0.95 }));
    routeGeo.setDrawRange(0, 2);
    group.add(routeLine);

    // beacons: glow column + expanding ground ring per station
    map.landmarks.forEach(function (lm) {
      if (!BEACONS.some(function (b) { return b.id === lm.id; })) return;
      var col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 60, 8, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xd9822b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      col.position.set(lm.xz[0], 30, lm.xz[1]);
      group.add(col);
      beaconMeshes[lm.id] = col;

      var ring = new THREE.Mesh(
        new THREE.RingGeometry(1, 1.35, 48),
        new THREE.MeshBasicMaterial({ color: 0xd9822b, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(lm.xz[0], 0.4, lm.xz[1]);
      group.add(ring);
      ringMeshes[lm.id] = ring;
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
        var t = smooth(range(p, sh.s, sh.e));
        var pos = [lerp(sh.a.pos[0], sh.b.pos[0], t), lerp(sh.a.pos[1], sh.b.pos[1], t), lerp(sh.a.pos[2], sh.b.pos[2], t)];
        var look = [lerp(sh.a.look[0], sh.b.look[0], t), lerp(sh.a.look[1], sh.b.look[1], t), lerp(sh.a.look[2], sh.b.look[2], t)];
        camera.position.set(pos[0], pos[1], pos[2]);
        camera.lookAt(v3(look));
        return;
      }
    }
  }

  function update(time) {
    var p = progress();
    cameraAt(p);

    // route ribbon draws in across the journey
    if (routeGeo) routeGeo.setDrawRange(0, Math.max(2, Math.floor(routeTotal * smooth(range(p, 0.13, 0.85)))));

    // beacons ignite and breathe once lit
    BEACONS.forEach(function (b) {
      var lit = smooth(range(p, b.at, b.at + 0.05));
      var col = beaconMeshes[b.id], ring = ringMeshes[b.id];
      if (!col) return;
      col.material.opacity = lit * (0.5 + 0.14 * Math.sin(time * 0.003 + b.at * 40));
      var pulse = 1 + ((time * 0.001 + b.at * 7) % 1.6) * 9;
      ring.scale.setScalar(lit > 0 ? pulse : 1);
      ring.material.opacity = lit * clamp(1.25 - pulse / 9, 0, 1) * 0.6;
    });

    // blackout ring at the pull-back
    if (blackoutRing) blackoutRing.material.opacity = smooth(range(p, 0.9, 0.97)) * 0.5;

    // captions
    captions.forEach(function (cap) {
      var s = parseFloat(cap.getAttribute("data-s"));
      var e = parseFloat(cap.getAttribute("data-e"));
      var vis = Math.min(smooth(range(p, s, s + 0.03)), 1 - smooth(range(p, e - 0.03, e)));
      cap.style.opacity = vis.toFixed(3);
      cap.style.transform = "translateY(" + ((1 - vis) * 14).toFixed(1) + "px)";
      cap.style.visibility = vis > 0.01 ? "visible" : "hidden";
    });
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
    Object.keys(beaconMeshes).forEach(function (k) { beaconMeshes[k].material.opacity = 0.55; });
    if (blackoutRing) blackoutRing.material.opacity = 0.4;
    captions.forEach(function (c) { c.style.opacity = "1"; c.style.visibility = "visible"; c.style.position = "relative"; });
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
