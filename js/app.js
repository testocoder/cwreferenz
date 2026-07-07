/* ============================================================
   Crushconnect · Navigation, 3D-Kacheln, Modal, π-Timer, Konfetti
   ============================================================ */

(function () {
  "use strict";

  var screens = Array.prototype.slice.call(document.querySelectorAll(".screen"));
  var validIds = screens.map(function (s) { return s.id; });
  var backBtn = document.getElementById("backBtn");
  var historyStack = [];
  var current = null;

  /* ---------------- Navigation ---------------- */

  function show(id) {
    if (validIds.indexOf(id) === -1) id = "start";
    screens.forEach(function (s) { s.classList.toggle("active", s.id === id); });
    document.body.setAttribute("data-screen", id);
    current = id;
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

    if (id === "crushconnect") startPiTimer();
    if (id === "match") fireConfetti();
  }

  function navigate(id) {
    if (id === current) return;
    if (id === "start") {
      historyStack = [];
    } else if (current) {
      historyStack.push(current);
    }
    show(id);
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* file:// Fallback */ }
  }

  function goBack() {
    var prev = historyStack.pop() || "start";
    show(prev);
    try { history.replaceState(null, "", "#" + prev); } catch (e) { /* egal */ }
  }

  backBtn.addEventListener("click", goBack);

  document.addEventListener("click", function (e) {
    var target = e.target.closest("[data-goto]");
    if (target) navigate(target.getAttribute("data-goto"));
  });

  // Einstieg: Deep-Link per Hash erlauben, sonst Start
  show((location.hash || "#start").slice(1));

  /* ---------------- Modal (Kachel-Details) ---------------- */

  var modal = document.getElementById("modal");
  var modalContent = document.getElementById("modalContent");

  function openModal(templateId) {
    var tpl = document.getElementById(templateId);
    if (!tpl) return;
    modalContent.innerHTML = "";
    modalContent.appendChild(tpl.content.cloneNode(true));
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal-card").scrollTop = 0;
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var tile = e.target.closest("[data-detail]");
    if (tile) openModal(tile.getAttribute("data-detail"));
    if (e.target.closest("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* ---------------- 3D-Tilt für Kacheln ---------------- */

  var supportsHover = window.matchMedia("(hover: hover)").matches;
  if (supportsHover) {
    document.querySelectorAll(".tile").forEach(function (tile) {
      tile.addEventListener("mousemove", function (e) {
        var r = tile.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        tile.style.transform =
          "rotateY(" + (x * 14).toFixed(2) + "deg)" +
          " rotateX(" + (-y * 14).toFixed(2) + "deg)" +
          " translateY(-6px) scale(1.03)";
      });
      tile.addEventListener("mouseleave", function () {
        tile.style.transform = "";
      });
    });
  }

  /* ---------------- π-Timer (3,141592653 Minuten) ---------------- */

  var PI_SECONDS = 3.141592653 * 60; // 188,496 s
  var timerEl = document.getElementById("piTimer");
  var timerPill = document.getElementById("timerPill");
  var timerStarted = false;

  function startPiTimer() {
    if (timerStarted || !timerEl) return;
    timerStarted = true;
    var end = Date.now() + PI_SECONDS * 1000;

    var interval = setInterval(function () {
      var rest = (end - Date.now()) / 1000;
      if (rest <= 0) {
        clearInterval(interval);
        timerPill.innerHTML = "⏳ Zeit um. Und? Überzeugt? 😏";
        return;
      }
      var m = Math.floor(rest / 60);
      var s = Math.floor(rest % 60);
      var hs = Math.floor((rest % 1) * 100);
      timerEl.textContent =
        m + ":" + (s < 10 ? "0" : "") + s + "," + (hs < 10 ? "0" : "") + hs;
    }, 50);
  }

  /* ---------------- Konfetti ---------------- */

  var confettiFired = false;

  function fireConfetti() {
    if (confettiFired) return;
    confettiFired = true;

    var canvas = document.getElementById("confetti");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);

    var colors = ["#f45fa4", "#e83e8c", "#7b3fe4", "#5f2bbf", "#ffd166", "#ffffff"];
    var parts = [];
    for (var i = 0; i < 160; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 120,
        y: innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 13 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        heart: Math.random() < 0.18
      });
    }

    var start = Date.now();
    (function frame() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32;
        p.vx *= 0.99;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.heart) {
          ctx.font = p.size * 2 + "px serif";
          ctx.textAlign = "center";
          ctx.fillText("💘", 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      });
      if (Date.now() - start < 3200) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        confettiFired = false; // beim nächsten Besuch wieder feiern
      }
    })();
  }
})();
