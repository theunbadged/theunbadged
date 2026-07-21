/* The Unbadged — scroll-scrubbed story engine.
   Native scroll remains authoritative. This file only eases presentation
   values and renders the self-hosted Three.js atmosphere. */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;
  var reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reducedQuery.matches;
  var rails = Array.prototype.slice.call(document.querySelectorAll("[data-ch]"));
  var progressBar = document.querySelector(".read-progress");
  var models = [];
  var rawScroll = window.scrollY || window.pageYOffset || 0;
  var easedScroll = rawScroll;
  var viewportHeight = window.innerHeight;
  var documentTravel = 1;
  var resizeQueued = false;
  var hidden = document.hidden;
  var blackoutModel = null;
  var canvasScene = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function range(value, start, end) {
    return clamp((value - start) / (end - start), 0, 1);
  }

  function smoothstep(value) {
    return value * value * (3 - 2 * value);
  }

  function mix(a, b, amount) {
    return a + (b - a) * amount;
  }

  function measure() {
    viewportHeight = window.innerHeight;
    documentTravel = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    models = rails.map(function (rail, index) {
      var stage = rail.querySelector(".hero-stage, .chapter-stage");
      var model = {
        rail: rail,
        stage: stage,
        chapter: parseInt(rail.getAttribute("data-ch"), 10),
        index: index,
        top: rail.offsetTop,
        travel: Math.max(1, rail.offsetHeight - viewportHeight),
        bottom: rail.offsetTop + rail.offsetHeight,
        beats: Array.prototype.slice.call(rail.querySelectorAll("[data-beat]")),
        lines: Array.prototype.slice.call(rail.querySelectorAll(".line-mask > span"))
      };
      if (model.chapter === 4) blackoutModel = model;
      return model;
    });
    if (canvasScene) canvasScene.resize();
  }

  function chapterProgress(model, scrollY) {
    return clamp((scrollY - model.top) / model.travel, 0, 1);
  }

  function setValue(element, name, value) {
    element.style.setProperty(name, String(value));
  }

  function revealStatic() {
    models.forEach(function (model) {
      model.rail.setAttribute("data-progress", "1");
      setValue(model.stage, "--p", 1);
      setValue(model.stage, "--stage-vis", 1);
      model.beats.forEach(function (beat) { setValue(beat, "--beat", 1); });
      model.lines.forEach(function (line) { setValue(line, "--line", 1); });
    });
    document.querySelectorAll(".count").forEach(function (count) {
      count.textContent = count.getAttribute("data-n");
    });
    body.setAttribute("data-blackout", "false");
    root.style.setProperty("--page-progress", "1");
  }

  function updateSpecialScenes(model, progress) {
    if (model.chapter === 4) {
      setValue(model.stage, "--blackout-cut", progress > 0.025 ? 1 : 0);
      setValue(model.stage, "--signal-4", 1 - range(progress, 0.43, 0.49));
      setValue(model.stage, "--signal-3", 1 - range(progress, 0.51, 0.57));
      setValue(model.stage, "--signal-2", 1 - range(progress, 0.59, 0.65));
      setValue(model.stage, "--signal-1", 1 - range(progress, 0.67, 0.73));
      setValue(model.stage, "--signal-caption", range(progress, 0.73, 0.79));
    }
    if (model.chapter === 5) {
      setValue(model.stage, "--plate", 1 - range(progress, 0.48, 0.63));
      setValue(model.stage, "--absence", range(progress, 0.63, 0.73));
    }
    if (model.chapter === 6) {
      var countProgress = smoothstep(range(progress, 0.28, 0.59));
      model.rail.querySelectorAll(".count").forEach(function (count) {
        var target = parseInt(count.getAttribute("data-n"), 10) || 0;
        count.textContent = String(Math.round(target * countProgress));
      });
      setValue(model.stage, "--zero-beat", smoothstep(range(progress, 0.62, 0.74)));
    }
  }

  function updateStory(scrollY) {
    var activeIndex = 0;
    var activeProgress = 0;
    var pageProgress = clamp(rawScroll / documentTravel, 0, 1);
    root.style.setProperty("--page-progress", pageProgress.toFixed(5));
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(Math.round(pageProgress * 100)));

    models.forEach(function (model, modelIndex) {
      var progress = chapterProgress(model, scrollY);
      var intro = smoothstep(range(progress, 0, 0.055));
      var outro = smoothstep(range(progress, 0.93, 1));
      var stageVisibility = model.chapter === 0
        ? 1 - outro
        : (model.chapter === 7 ? intro : intro * (1 - outro));

      model.rail.setAttribute("data-progress", progress.toFixed(3));
      setValue(model.stage, "--p", progress.toFixed(5));
      setValue(model.stage, "--stage-vis", stageVisibility.toFixed(4));

      if (model.chapter === 0) {
        setValue(model.stage, "--hero-p", progress.toFixed(4));
        setValue(model.stage, "--hero-out", smoothstep(range(progress, 0.55, 0.88)).toFixed(4));
      }

      model.beats.forEach(function (beat) {
        var start = parseFloat(beat.getAttribute("data-beat")) || 0;
        setValue(beat, "--beat", smoothstep(range(progress, start, start + 0.105)).toFixed(4));
      });

      model.lines.forEach(function (line, lineIndex) {
        var start = 0.09 + lineIndex * 0.045;
        setValue(line, "--line", smoothstep(range(progress, start, start + 0.12)).toFixed(4));
      });

      updateSpecialScenes(model, progress);
      if (scrollY >= model.top) {
        activeIndex = modelIndex;
        activeProgress = progress;
      }
    });

    var inBlackout = Boolean(
      blackoutModel &&
      rawScroll >= blackoutModel.top + 1 &&
      rawScroll < blackoutModel.bottom
    );
    body.setAttribute("data-blackout", inBlackout ? "true" : "false");
    return { index: activeIndex, progress: activeProgress, blackout: inBlackout };
  }
  function initCanvas() {
    if (typeof THREE === "undefined") return null;
    var canvas = document.getElementById("scene");
    if (!canvas) return null;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: false,
        antialias: window.innerWidth > 700,
        powerPreference: "high-performance"
      });
    } catch (error) {
      canvas.style.display = "none";
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x10151b, 0.052);
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 80);
    camera.position.set(0, 0, 7.4);

    var isSmall = window.innerWidth < 700;
    var particleCount = isSmall ? 360 : 950;
    var particlePositions = new Float32Array(particleCount * 3);
    var particleBase = new Float32Array(particleCount * 3);
    var particlePhase = new Float32Array(particleCount);
    for (var i = 0; i < particleCount; i += 1) {
      var i3 = i * 3;
      particleBase[i3] = (Math.random() - 0.5) * 18;
      particleBase[i3 + 1] = (Math.random() - 0.5) * 11;
      particleBase[i3 + 2] = (Math.random() - 0.5) * 9 - 1.5;
      particlePositions[i3] = particleBase[i3];
      particlePositions[i3 + 1] = particleBase[i3 + 1];
      particlePositions[i3 + 2] = particleBase[i3 + 2];
      particlePhase[i] = Math.random() * Math.PI * 2;
    }
    var particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    var particleMaterial = new THREE.PointsMaterial({
      size: isSmall ? 0.038 : 0.03,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x7e9bb2
    });
    scene.add(new THREE.Points(particleGeometry, particleMaterial));

    function segments(points, closed) {
      var values = [];
      var stop = closed ? points.length : points.length - 1;
      for (var pointIndex = 0; pointIndex < stop; pointIndex += 1) {
        var a = points[pointIndex];
        var b = points[(pointIndex + 1) % points.length];
        values.push(a[0], a[1], 0, b[0], b[1], 0);
      }
      return new Float32Array(values);
    }

    function circlePoints(radius, count) {
      var points = [];
      for (var pointIndex = 0; pointIndex < count; pointIndex += 1) {
        var angle = pointIndex / count * Math.PI * 2;
        points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
      return points;
    }

    function starPoints(outer, inner, count) {
      var points = [];
      for (var pointIndex = 0; pointIndex < count * 2; pointIndex += 1) {
        var radius = pointIndex % 2 ? inner : outer;
        var angle = pointIndex / (count * 2) * Math.PI * 2 - Math.PI / 2;
        points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
      return points;
    }

    var badge = new THREE.Group();
    var badgeParts = [];
    var shield = [[-1.18,1.18],[1.18,1.18],[1.18,-.12],[.82,-.86],[0,-1.43],[-.82,-.86],[-1.18,-.12]];

    function addPart(points, color, closed, scatterX, scatterY, scatterRotation) {
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(segments(points, closed), 3));
      var material = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.8 });
      var line = new THREE.LineSegments(geometry, material);
      line.userData.scatterX = scatterX;
      line.userData.scatterY = scatterY;
      line.userData.scatterRotation = scatterRotation;
      badge.add(line);
      badgeParts.push(line);
    }

    for (var shieldIndex = 0; shieldIndex < shield.length; shieldIndex += 1) {
      addPart(
        [shield[shieldIndex], shield[(shieldIndex + 1) % shield.length]],
        0x8da5b8, false,
        Math.cos(shieldIndex * 1.7) * (1.4 + shieldIndex * 0.12),
        Math.sin(shieldIndex * 1.31) * (1.2 + shieldIndex * 0.08),
        (shieldIndex - 3) * 0.15
      );
    }
    addPart(circlePoints(.72, 48), 0x8da5b8, true, 1.7, -.8, .6);
    addPart(starPoints(.58,.23,5), 0xd36b33, true, -1.5, .95, -.8);
    badge.position.set(0, 0, 0);
    scene.add(badge);

    var ledger = new THREE.Group();
    for (var row = 0; row < 7; row += 1) {
      var y = 1.25 - row * .4;
      addLedgerLine([[-1.7,y],[1.7,y]]);
    }
    for (var column = 0; column < 4; column += 1) {
      var x = -1.7 + column * 1.13;
      addLedgerLine([[x,1.25],[x,-1.15]]);
    }
    function addLedgerLine(points) {
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(segments(points, false), 3));
      ledger.add(new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: 0x7e9bb2, transparent: true, opacity: 0 })
      ));
    }
    ledger.position.z = -0.35;
    ledger.scale.setScalar(1.25);
    scene.add(ledger);
    var grades = [
      { bg:0x101820, pc:0x7898af, po:.48, drift:.18, badge:.84, dis:0, ledger:0, x:0, fog:.048 },
      { bg:0x121920, pc:0x87949e, po:.38, drift:.14, badge:.28, dis:.08, ledger:0, x:2.5, fog:.055 },
      { bg:0x1a150d, pc:0xc18d45, po:.48, drift:.28, badge:.24, dis:.18, ledger:0, x:2.5, fog:.052 },
      { bg:0x190807, pc:0xb24635, po:.68, drift:.82, badge:.30, dis:.52, ledger:0, x:2.7, fog:.072 },
      { bg:0x020304, pc:0x29323a, po:.10, drift:.03, badge:.07, dis:.90, ledger:0, x:2.4, fog:.095 },
      { bg:0x0b1117, pc:0x6f889d, po:.32, drift:.18, badge:.23, dis:1, ledger:0, x:2.45, fog:.066 },
      { bg:0x15100b, pc:0xb9773f, po:.40, drift:.22, badge:.18, dis:.82, ledger:.08, x:2.7, fog:.06 },
      { bg:0x09141c, pc:0x83a8c1, po:.50, drift:.14, badge:.92, dis:0, ledger:.3, x:2.8, fog:.046 }
    ];
    var current = {
      bg: new THREE.Color(grades[0].bg),
      pc: new THREE.Color(grades[0].pc),
      po: grades[0].po,
      drift: grades[0].drift,
      badge: grades[0].badge,
      dis: grades[0].dis,
      ledger: grades[0].ledger,
      x: grades[0].x,
      fog: grades[0].fog
    };
    var pointerX = 0;
    var pointerY = 0;
    var finePointer = window.matchMedia("(pointer: fine)").matches;
    if (finePointer && !reduced) {
      window.addEventListener("pointermove", function (event) {
        pointerX = event.clientX / window.innerWidth - .5;
        pointerY = event.clientY / window.innerHeight - .5;
      }, { passive: true });
    }

    function gradeAt(storyState) {
      var index = clamp(storyState.index, 0, grades.length - 1);
      var from = grades[index];
      var next = grades[Math.min(index + 1, grades.length - 1)];
      var amount = smoothstep(storyState.progress);
      if (index === 3) amount = 0;
      if (index === 4) amount = smoothstep(range(storyState.progress, .72, 1));
      return {
        bg: new THREE.Color(from.bg).lerp(new THREE.Color(next.bg), amount),
        pc: new THREE.Color(from.pc).lerp(new THREE.Color(next.pc), amount),
        po: mix(from.po, next.po, amount),
        drift: mix(from.drift, next.drift, amount),
        badge: mix(from.badge, next.badge, amount),
        dis: mix(from.dis, next.dis, amount),
        ledger: mix(from.ledger, next.ledger, amount),
        x: mix(from.x, next.x, amount),
        fog: mix(from.fog, next.fog, amount)
      };
    }

    function resize() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function render(time, storyState, forceStatic) {
      var target = forceStatic ? gradeAt({ index: 7, progress: 1 }) : gradeAt(storyState);
      var hardCut = storyState.blackout && storyState.index === 4 && storyState.progress < .12;
      var easing = hardCut || forceStatic ? 1 : .055;
      current.bg.lerp(target.bg, easing);
      current.pc.lerp(target.pc, easing);
      current.po = mix(current.po, target.po, easing);
      current.drift = mix(current.drift, target.drift, easing);
      current.badge = mix(current.badge, target.badge, easing);
      current.dis = mix(current.dis, target.dis, easing);
      current.ledger = mix(current.ledger, target.ledger, easing);
      current.x = mix(current.x, target.x, easing);
      current.fog = mix(current.fog, target.fog, easing);

      renderer.setClearColor(current.bg);
      scene.fog.color.copy(current.bg);
      scene.fog.density = current.fog;
      particleMaterial.color.copy(current.pc);
      particleMaterial.opacity = current.po;

      if (!forceStatic) {
        var positions = particleGeometry.attributes.position.array;
        for (var particleIndex = 0; particleIndex < particleCount; particleIndex += 1) {
          var particleOffset = particleIndex * 3;
          var phase = particlePhase[particleIndex];
          positions[particleOffset] = particleBase[particleOffset] + Math.sin(time * .17 + phase) * current.drift;
          positions[particleOffset + 1] = particleBase[particleOffset + 1] + Math.cos(time * .12 + phase * 1.7) * current.drift * .72;
        }
        particleGeometry.attributes.position.needsUpdate = true;
      }

      badge.position.x = current.x;
      badge.rotation.y = forceStatic ? 0 : time * .045;
      badge.rotation.x = forceStatic ? 0 : pointerY * .09 + Math.sin(time * .13) * .025;
      badgeParts.forEach(function (part, partIndex) {
        part.position.x = part.userData.scatterX * current.dis;
        part.position.y = part.userData.scatterY * current.dis;
        part.position.z = Math.sin(partIndex * 2.1) * current.dis * .42;
        part.rotation.z = part.userData.scatterRotation * current.dis;
        part.material.opacity = current.badge * (1 - current.dis * .35);
      });
      ledger.position.x = current.x;
      ledger.children.forEach(function (line) { line.material.opacity = current.ledger; });
      camera.position.x += (pointerX * .28 - camera.position.x) * .04;
      camera.position.y += (-pointerY * .16 - camera.position.y) * .04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }

    return { render: render, resize: resize };
  }

  function frame(timestamp) {
    if (hidden || reduced) return;
    rawScroll = window.scrollY || window.pageYOffset || 0;
    easedScroll += (rawScroll - easedScroll) * .085;
    if (Math.abs(rawScroll - easedScroll) < .08) easedScroll = rawScroll;
    var storyState = updateStory(easedScroll);
    if (canvasScene) canvasScene.render(timestamp / 1000, storyState, false);
    window.requestAnimationFrame(frame);
  }

  function queueMeasure() {
    if (resizeQueued) return;
    resizeQueued = true;
    window.requestAnimationFrame(function () {
      resizeQueued = false;
      measure();
      rawScroll = window.scrollY || window.pageYOffset || 0;
      easedScroll = rawScroll;
      if (!reduced) updateStory(easedScroll);
    });
  }

  window.addEventListener("scroll", function () {
    rawScroll = window.scrollY || window.pageYOffset || 0;
  }, { passive: true });
  window.addEventListener("resize", queueMeasure, { passive: true });
  window.addEventListener("load", queueMeasure, { once: true });
  document.addEventListener("visibilitychange", function () {
    hidden = document.hidden;
    if (!hidden && !reduced) {
      rawScroll = window.scrollY || window.pageYOffset || 0;
      easedScroll = rawScroll;
      window.requestAnimationFrame(frame);
    }
  });

  measure();
  canvasScene = initCanvas();
  if (canvasScene) canvasScene.resize();
  root.classList.add("is-enhanced");
  if (reduced) {
    revealStatic();
    if (canvasScene) canvasScene.render(0, { index: 7, progress: 1, blackout: false }, true);
  } else {
    updateStory(easedScroll);
    window.requestAnimationFrame(frame);
  }
})();
