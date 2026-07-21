/* The Unbadged — story engine.
   A single Three.js scene behind the scroll: a wireframe badge that the
   chapters dissolve, and a record that reassembles it at the end.
   Self-hosted three.js, no analytics, no external requests. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveals ---------- */
  var reveals = document.querySelectorAll(".reveal, .art, .figures");
  if (reduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("on"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-n"), 10) || 0;
    if (reduced) { el.textContent = target; return; }
    var t0 = null, dur = 1400;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counted = false;
  var figuresEl = document.querySelector(".figures");
  if (figuresEl) {
    if (reduced || !("IntersectionObserver" in window)) {
      document.querySelectorAll(".count").forEach(animateCount);
    } else {
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !counted) {
            counted = true;
            document.querySelectorAll(".count").forEach(animateCount);
            obs.disconnect();
          }
        });
      }, { threshold: 0.4 }).observe(figuresEl);
    }
  }

  /* ---------- three.js scene ---------- */
  if (typeof THREE === "undefined") return;
  var canvas = document.getElementById("scene");
  if (!canvas) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: false, antialias: true });
  } catch (e) { canvas.style.display = "none"; return; }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  camera.position.set(0, 0, 6);

  /* --- particles: dust / gas / embers --- */
  var isSmall = window.innerWidth < 700;
  var N = isSmall ? 700 : 1600;
  var pos = new Float32Array(N * 3);
  var seed = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    seed[i * 3] = Math.random() * 100;
    seed[i * 3 + 1] = Math.random() * 100;
    seed[i * 3 + 2] = 0.4 + Math.random() * 0.8;
  }
  var pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var pmat = new THREE.PointsMaterial({
    size: isSmall ? 0.045 : 0.035,
    transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false,
    color: new THREE.Color("#5b9bd5")
  });
  scene.add(new THREE.Points(pgeo, pmat));

  /* --- the badge: shield + star, wireframe --- */
  function loopPoints(pts, closed) {
    var arr = [];
    for (var j = 0; j < pts.length - (closed ? 0 : 1); j++) {
      var a = pts[j], b = pts[(j + 1) % pts.length];
      arr.push(a[0], a[1], 0, b[0], b[1], 0);
    }
    return new Float32Array(arr);
  }
  function star(cx, cy, rOut, rIn, n) {
    var pts = [];
    for (var k = 0; k < n * 2; k++) {
      var r = (k % 2 === 0) ? rOut : rIn;
      var a = (k / (n * 2)) * Math.PI * 2 - Math.PI / 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }
  function circle(cx, cy, r, n) {
    var pts = [];
    for (var k = 0; k < n; k++) {
      var a = (k / n) * Math.PI * 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }
  var shieldPts = [
    [-1.0, 1.05], [1.0, 1.05], [1.0, -0.15],
    [0.72, -0.75], [0.0, -1.25], [-0.72, -0.75], [-1.0, -0.15]
  ];

  var badge = new THREE.Group();
  var badgeParts = [];
  function addLoop(pts, color, closed) {
    var geo = new THREE.BufferGeometry();
    var base = loopPoints(pts, closed !== false);
    geo.setAttribute("position", new THREE.BufferAttribute(base.slice(0), 3));
    var mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.9 });
    var seg = new THREE.LineSegments(geo, mat);
    seg.userData.base = base;
    badge.add(seg);
    badgeParts.push(seg);
  }
  addLoop(shieldPts, "#8fa7bd");
  addLoop(circle(0, 0.02, 0.62, 40), "#8fa7bd");
  addLoop(star(0, 0.02, 0.52, 0.2, 5), "#d9822b");
  badge.position.set(0, 0.1, 0);
  scene.add(badge);

  /* --- chapter grades ---
     [bg, particleColor, particleOpacity, drift, badgeOpacity, dissolve, scale] */
  var CH = [
    ["#0b0d10", "#5b9bd5", 0.75, 0.25, 0.95, 0.0, 1.0],   // 0 hero
    ["#0d1014", "#8892a0", 0.55, 0.20, 0.40, 0.0, 1.0],   // 1 wait
    ["#12100b", "#d9a62b", 0.65, 0.45, 0.30, 0.05, 1.0],  // 2 morning
    ["#160b09", "#c85a45", 0.90, 1.35, 0.35, 0.35, 1.02], // 3 charge
    ["#040507", "#3a4552", 0.18, 0.05, 0.10, 0.7, 1.0],   // 4 blackout
    ["#0b0d11", "#7f93a8", 0.50, 0.30, 0.30, 1.0, 1.05],  // 5 unbadged
    ["#100c09", "#d9822b", 0.70, 0.40, 0.20, 1.0, 1.05],  // 6 count
    ["#0b0d10", "#5b9bd5", 0.80, 0.22, 1.00, 0.0, 1.12]   // 7 record
  ];

  var grade = CH.map(function (c) {
    return {
      bg: new THREE.Color(c[0]), pc: new THREE.Color(c[1]),
      po: c[2], drift: c[3], bo: c[4], dis: c[5], scale: c[6]
    };
  });

  /* live values, lerped toward scroll target every frame */
  var cur = { bg: grade[0].bg.clone(), pc: grade[0].pc.clone(),
              po: grade[0].po, drift: grade[0].drift, bo: grade[0].bo,
              dis: grade[0].dis, scale: grade[0].scale };

  /* section boundaries → continuous chapter coordinate */
  var sections = Array.prototype.slice.call(document.querySelectorAll("[data-ch]"));
  function chapterCoord() {
    var y = window.scrollY + window.innerHeight * 0.55;
    var coord = 0;
    for (var s = 0; s < sections.length; s++) {
      var top = sections[s].offsetTop;
      var next = (s + 1 < sections.length) ? sections[s + 1].offsetTop : document.body.scrollHeight;
      if (y >= top && y < next) {
        coord = s + Math.min(1, Math.max(0, (y - top) / (next - top)));
        return Math.min(coord, grade.length - 1);
      }
    }
    return (y >= document.body.scrollHeight - window.innerHeight) ? grade.length - 1 : 0;
  }

  function targetAt(coord) {
    var i = Math.floor(coord), f = coord - i;
    var a = grade[Math.min(i, grade.length - 1)];
    var b = grade[Math.min(i + 1, grade.length - 1)];
    return {
      bg: a.bg.clone().lerp(b.bg, f), pc: a.pc.clone().lerp(b.pc, f),
      po: a.po + (b.po - a.po) * f, drift: a.drift + (b.drift - a.drift) * f,
      bo: a.bo + (b.bo - a.bo) * f, dis: a.dis + (b.dis - a.dis) * f,
      scale: a.scale + (b.scale - a.scale) * f
    };
  }

  /* mouse parallax */
  var mx = 0, my = 0;
  window.addEventListener("pointermove", function (e) {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  var running = true;
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running && !reduced) requestAnimationFrame(frame);
  });

  var L = 0.06; // smoothing
  function frame(tms) {
    if (!running) return;
    var t = (tms || 0) / 1000;
    var tgt = targetAt(chapterCoord());

    cur.bg.lerp(tgt.bg, L); cur.pc.lerp(tgt.pc, L);
    cur.po += (tgt.po - cur.po) * L;
    cur.drift += (tgt.drift - cur.drift) * L;
    cur.bo += (tgt.bo - cur.bo) * L;
    cur.dis += (tgt.dis - cur.dis) * L;
    cur.scale += (tgt.scale - cur.scale) * L;

    renderer.setClearColor(cur.bg);
    pmat.color.copy(cur.pc);
    pmat.opacity = cur.po;

    /* particle drift */
    var p = pgeo.attributes.position.array;
    for (var i = 0; i < N; i++) {
      var i3 = i * 3;
      p[i3]     += Math.sin(t * 0.4 + seed[i3]) * 0.0016 * cur.drift * seed[i3 + 2] * 10;
      p[i3 + 1] += (0.001 + Math.cos(t * 0.3 + seed[i3 + 1]) * 0.0012) * cur.drift * seed[i3 + 2] * 10;
      if (p[i3 + 1] > 5.5) p[i3 + 1] = -5.5;
      if (p[i3] > 8.5) p[i3] = -8.5;
      if (p[i3] < -8.5) p[i3] = 8.5;
    }
    pgeo.attributes.position.needsUpdate = true;

    /* badge: rotate, breathe, dissolve */
    badge.rotation.y = t * 0.12;
    badge.rotation.x = Math.sin(t * 0.2) * 0.06 + my * 0.15;
    badge.scale.setScalar(cur.scale + Math.sin(t * 0.8) * 0.008);
    for (var b = 0; b < badgeParts.length; b++) {
      var part = badgeParts[b];
      part.material.opacity = cur.bo;
      var arr = part.geometry.attributes.position.array;
      var base = part.userData.base;
      if (cur.dis > 0.003) {
        for (var v = 0; v < arr.length; v += 3) {
          var n1 = Math.sin(v * 12.9898 + t * (0.6 + cur.dis)) * 0.5;
          var n2 = Math.cos(v * 78.233 + t * 0.7) * 0.5;
          arr[v]     = base[v]     + n1 * cur.dis * 1.6;
          arr[v + 1] = base[v + 1] + n2 * cur.dis * 1.4;
          arr[v + 2] = base[v + 2] + Math.sin(v + t) * cur.dis * 0.8;
        }
      } else {
        arr.set(base);
      }
      part.geometry.attributes.position.needsUpdate = true;
    }

    camera.position.x += (mx * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.3 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  if (reduced) {
    /* one static, dignified frame */
    renderer.setClearColor(grade[0].bg);
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }
})();
