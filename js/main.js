/* Bohdan Krasokha – CV website. Plain JavaScript, no libraries. */

/* ==========================================================
   Language switch
   ========================================================== */
    (function () {
        var buttons = document.querySelectorAll('[data-set-lang]');
        var titles = {
            de: 'Bohdan Krasokha – Ausbildung Fachinformatiker Systemintegration',
            en: 'Bohdan Krasokha – Apprenticeship in IT System Integration'
        };
        var switching = false;
        function show(lang) {
            document.documentElement.lang = lang;
            document.title = titles[lang];
            buttons.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.setLang === lang ? 'true' : 'false'); });
            document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
            window.dispatchEvent(new Event('resize'));
        }
        // The text blurs out, the language swaps, the text comes back: no jump, no flash
        buttons.forEach(function (b) {
            b.addEventListener('click', function () {
                var lang = b.dataset.setLang;
                if (lang === document.documentElement.lang || switching) return;
                switching = true;
                buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
                document.body.classList.add('lang-swap');
                setTimeout(function () {
                    // Keep the same spot of the same section under the header, even if the text gets shorter
                    var line = 80, anchor = null, ratio = 0;
                    document.querySelectorAll('[data-shape]').forEach(function (sec) {
                        var r = sec.getBoundingClientRect();
                        if (!anchor && r.top <= line && r.bottom > line) { anchor = sec; ratio = (line - r.top) / r.height; }
                    });
                    show(lang);
                    if (anchor) {
                        var nr = anchor.getBoundingClientRect();
                        window.scrollBy(0, nr.top - (line - ratio * nr.height));
                    }
                    try { localStorage.setItem('site-lang', lang); } catch (e) {}
                    requestAnimationFrame(function () {
                        document.body.classList.remove('lang-swap');
                        switching = false;
                    });
                }, 220);
            });
        });
        show(document.documentElement.lang);
    })();

/* ==========================================================
   Smooth travel to a section
   ========================================================== */
    /*
     * Clicking "Kontakt aufnehmen", "Meinen Plan ansehen" or a menu link glides there
     * with an ease-in-out curve. The particle field stretches into streaks on the way,
     * and on arrival the heading settles in and a pulse runs through the field.
     */
    (function () {
        var running = null;
        function ease(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }

        function arrive(target) {
            target.classList.remove('arrive');
            void target.offsetWidth;
            target.classList.add('arrive');
            var h = target.querySelector('h2') || target;
            var r = h.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent('fieldpulse', { detail: { x: r.left + Math.min(r.width, 320) / 2, y: r.top + r.height / 2 } }));
        }

        function go(target) {
            var startY = window.scrollY;
            var maxY = document.documentElement.scrollHeight - window.innerHeight;
            var endY = target === document.body ? 0 : Math.max(0, Math.min(maxY, target.getBoundingClientRect().top + startY - 8));
            var dist = endY - startY;
            if (Math.abs(dist) < 2) { arrive(target); return; }
            var dur = Math.min(1600, Math.max(900, 650 + Math.abs(dist) * .22));
            var t0 = performance.now(), id = {};
            running = id;
            (function stepScroll(now) {
                if (running !== id) return;
                var p = Math.min(1, (now - t0) / dur);
                window.scrollTo(0, startY + dist * ease(p));
                if (p < 1) requestAnimationFrame(stepScroll);
                else { running = null; if (target !== document.body) arrive(target); }
            })(t0);
        }

        function cancel() { running = null; }
        window.addEventListener('wheel', cancel, { passive: true });
        window.addEventListener('touchstart', cancel, { passive: true });
        window.addEventListener('keydown', cancel);

        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a || a.classList.contains('skip') || e.metaKey || e.ctrlKey) return;
            var id = a.getAttribute('href').slice(1);
            var target = id === 'top' ? document.body : document.getElementById(id);
            if (!target) return;
            e.preventDefault();
            try { history.replaceState(null, '', '#' + id); } catch (err) {}
            go(target);
        });
    })();

/* ==========================================================
   Page interactions: header, buttons, reveals, tilt, formulas
   ========================================================== */
    (function () {
        var calm = false;
        var mouse = window.matchMedia('(hover: hover)').matches;

        // Glass header after the first scroll, and a thin line that shows how far down you are
        var header = document.getElementById('site-header');
        var progress = document.getElementById('progress');
        var ticking = false;
        function onScrollHeader() {
            ticking = false;
            header.classList.toggle('scrolled', window.scrollY > 8);
            var max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
        }
        window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScrollHeader); } }, { passive: true });
        window.addEventListener('resize', onScrollHeader);
        onScrollHeader();

        // Phone menu: a full-screen sheet under the header
        var menuBtn = document.getElementById('menu-btn'), sheet = document.getElementById('sheet');
        function setMenu(open) {
            menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.documentElement.classList.toggle('menu-open', open);
            if (open) { sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('open'); }); }
            else {
                sheet.classList.remove('open');
                setTimeout(function () { if (!sheet.classList.contains('open')) sheet.hidden = true; }, 350);
            }
        }
        menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
        sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); } });
        window.matchMedia('(min-width: 641px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

        // Button fill starts where the pointer enters
        document.querySelectorAll('.fillable').forEach(function (el) {
            function at(e) {
                var r = el.getBoundingClientRect();
                el.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
                el.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
            }
            el.addEventListener('pointerenter', at);
            el.addEventListener('pointerleave', at);
        });

        // Fade things in when they scroll into view
        var reveals = document.querySelectorAll('.reveal, .tree');
        if ('IntersectionObserver' in window && !calm) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        e.target.dispatchEvent(new CustomEvent('revealed'));
                        io.unobserve(e.target);
                    }
                });
            }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
            reveals.forEach(function (el) { io.observe(el); });
        } else {
            reveals.forEach(function (el) { el.classList.add('in'); });
        }

        // Cards lean towards the pointer
        if (!calm && mouse) {
            document.querySelectorAll('.tilt').forEach(function (el) {
                el.addEventListener('pointermove', function (e) {
                    var r = el.getBoundingClientRect();
                    el.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 7) + 'deg');
                    el.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 7) + 'deg');
                });
                el.addEventListener('pointerleave', function () {
                    el.style.setProperty('--ry', '0deg');
                    el.style.setProperty('--rx', '0deg');
                });
            });
        }

        // Formulas: slight depth when scrolling, brighter when the pointer comes close
        var formulas = Array.prototype.slice.call(document.querySelectorAll('.f'));
        var px = -9999, py = -9999, pending = false;
        function updateFormulas() {
            pending = false;
            var H = window.innerHeight;
            formulas.forEach(function (f, i) {
                var r = f.getBoundingClientRect();
                if (r.bottom < -100 || r.top > H + 100) return;
                var depth = .06 + (i % 3) * .04;
                if (!calm) f.style.setProperty('--py', ((r.top + r.height / 2 - H / 2) * -depth).toFixed(1) + 'px');
                var d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py);
                f.style.setProperty('--glow', Math.max(0, 1 - d / 260).toFixed(2));
            });
        }
        function queue() { if (!pending) { pending = true; requestAnimationFrame(updateFormulas); } }
        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
        queue();
    })();

/* ==========================================================
   E-mail: not written in the HTML, so address-harvesting bots
   find nothing there. Put together here, then: link, text, copy button.
   ========================================================== */
    (function () {
        var link = document.querySelector('.mail-link');
        var mail = link ? link.dataset.u + '@' + link.dataset.d : '';
        window.__mail = mail;                                       // used by the terminal
        document.querySelectorAll('.mail-link').forEach(function (a) { a.href = 'mai' + 'lto:' + mail; });
        document.querySelectorAll('.mail-text').forEach(function (el) { el.textContent = mail; });

        var btn = document.getElementById('copy-mail'), timer;
        function done() { btn.classList.add('ok'); clearTimeout(timer); timer = setTimeout(function () { btn.classList.remove('ok'); }, 1800); }
        function fallback() {
            var t = document.createElement('textarea');
            t.value = mail; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
            document.body.appendChild(t); t.select();
            try { document.execCommand('copy'); } catch (e) {}
            t.remove(); done();
        }
        btn.addEventListener('click', function () {
            try { navigator.clipboard.writeText(mail).then(done, fallback); } catch (e) { fallback(); }
        });
    })();

/* ==========================================================
   Before / after slider for the laptop repair
   ========================================================== */
    (function () {
        var box = document.getElementById('compare'), range = document.getElementById('compare-range');
        if (!box || !range) return;
        var user = false;
        function set(v) { box.style.setProperty('--pos', v + '%'); }
        range.addEventListener('input', function () { user = true; set(range.value); });
        // Pointer drag anywhere on the photo (the invisible range input covers it too)
        box.addEventListener('pointerdown', function (e) {
            user = true;
            function at(ev) {
                var r = box.getBoundingClientRect();
                var v = Math.max(0, Math.min(100, (ev.clientX - r.left) / r.width * 100));
                range.value = v; set(v);
            }
            at(e);
            function up() { window.removeEventListener('pointermove', at); window.removeEventListener('pointerup', up); }
            window.addEventListener('pointermove', at);
            window.addEventListener('pointerup', up);
        });
        // A short sweep the first time it scrolls into view, so it is clear you can drag it
        var article = box.closest('.reveal');
        function hint() {
            if (user) return;
            var t0 = performance.now(), dur = 2200;
            (function step(now) {
                if (user) return;
                var p = Math.min(1, (now - t0) / dur);
                var v = 50 + Math.sin(p * Math.PI * 2) * 22 * (1 - p * .3);
                if (p >= 1) v = 50;
                range.value = v; set(v.toFixed(2));
                if (p < 1) requestAnimationFrame(step);
            })(t0);
        }
        if (article) article.addEventListener('revealed', function () { setTimeout(hint, 700); });
    })();

/* ==========================================================
   Portrait: the edge of the photo dissolves into particles,
   the same square dots as the galaxy around it. They breathe and
   swirl a little; under the pointer (or a tap) they come home and
   the photo turns from black-and-white to colour.
   If anything is missing (old browser, file://), the normal round photo stays.
   ========================================================== */
    (function () {
        var wrap = document.getElementById('portrait-wrap');
        var img = document.getElementById('portrait-img');
        var cv = document.getElementById('portrait-fx');
        if (!wrap || !img || !cv || !cv.getContext) return;
        var ctx = cv.getContext('2d');
        var pace = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? .55 : 1;
        var LEVELS = 22, coreGray, coreColor, P = null, size = 0, dpr = 1, R = 0, C = 0;
        var t = 0, last = performance.now(), visible = true, assemble = 0, target = 0, colour = 0;

        function build() {
            var w = wrap.offsetWidth;                          // layout size: not affected by the intro scale animation
            if (!w) return false;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            var css = w * 1.5;                          // canvas reaches 25% beyond the photo on each side
            size = Math.round(css * dpr);
            cv.width = cv.height = size;
            C = size / 2; R = w / 2 * dpr;

            // The photo drawn into a square the size of the circle
            var src = document.createElement('canvas'), d = Math.round(R * 2);
            src.width = src.height = d;
            var sg = src.getContext('2d');
            sg.drawImage(img, 0, 0, d, d);
            var data = sg.getImageData(0, 0, d, d).data;     // throws on file:// (tainted): we fall back

            // Core: solid in the middle, fading out towards the edge
            function core(gray) {
                var c = document.createElement('canvas');
                c.width = c.height = d;
                var g = c.getContext('2d');
                var id = g.createImageData(d, d), o = id.data, k = gray ? .55 : 0;
                for (var i = 0; i < o.length; i += 4) {
                    var y = data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114;
                    o[i] = data[i] + (y - data[i]) * k;
                    o[i + 1] = data[i + 1] + (y - data[i + 1]) * k;
                    o[i + 2] = data[i + 2] + (y - data[i + 2]) * k;
                    o[i + 3] = data[i + 3];               // the photo is a cut-out: keep its transparency
                }
                g.putImageData(id, 0, 0);
                g.globalCompositeOperation = 'destination-in';
                var rg = g.createRadialGradient(d / 2, d / 2, d / 2 * .7, d / 2, d / 2, d / 2 * .93);
                rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
                g.fillStyle = rg; g.fillRect(0, 0, d, d);
                return c;
            }
            coreGray = core(true); coreColor = core(false);

            // Particles: sampled from the ring where the core fades out
            var step = Math.max(2, Math.round(2.5 * dpr)), list = [];
            for (var gy = 0; gy < d; gy += step) for (var gx = 0; gx < d; gx += step) {
                var x = Math.min(d - 1, gx + Math.random() * step) | 0, y = Math.min(d - 1, gy + Math.random() * step) | 0;
                var dx = x - d / 2, dy = y - d / 2, r = Math.sqrt(dx * dx + dy * dy) / (d / 2);
                if (r < .64 || r > 1.02) continue;
                var u = (r - .64) / .38;
                if (Math.random() > 1 - u * .45) continue;          // thinner towards the outside
                var i4 = (y * d + x) * 4;
                if (data[i4 + 3] < 110) continue;                       // no particles from the empty background
                var lum = (data[i4] * .299 + data[i4 + 1] * .587 + data[i4 + 2] * .114) / 255;
                list.push({ a: Math.atan2(dy, dx), r: r * R, u: u, lum: .1 + lum * .62, ph: Math.random() * 6.283, sp: .6 + Math.random() * .8, z: .8 + Math.random() * .9 });
            }
            P = list;
            return true;
        }

        function frame(now) {
            var dt = Math.min(.05, (now - last) / 1000); last = now;
            if (visible && !document.hidden && P) {
                t += dt * pace;
                assemble += (target - assemble) * .07;
                colour += (target - colour) * .05;
                ctx.clearRect(0, 0, size, size);
                // the photo: black-and-white, colour fades in on hover
                var d = R * 2, o = C - R, breathe = 1 + Math.sin(t * .7) * .012 * (1 - assemble);
                ctx.save();
                ctx.translate(C, C); ctx.scale(breathe, breathe); ctx.translate(-C, -C);
                ctx.globalAlpha = 1; ctx.drawImage(coreGray, o, o, d, d);
                if (colour > .01) { ctx.globalAlpha = colour; ctx.drawImage(coreColor, o, o, d, d); }
                ctx.restore();
                ctx.globalAlpha = 1;
                // the dissolving edge, grouped by brightness so it is cheap to draw
                var spread = 1 - assemble, paths = [];
                for (var l = 0; l < LEVELS; l++) paths.push([]);
                for (var i = 0; i < P.length; i++) {
                    var p = P[i], u2 = p.u * p.u;
                    var down = Math.max(0, Math.sin(p.a));                                              // less spray below the chin
                    var out = u2 * R * (.4 - down * .16) * (.55 + .45 * Math.sin(t * .5 * p.sp + p.ph)) * spread;
                    var ang = p.a + (u2 * .5 + u2 * .25 * Math.sin(t * .3 + p.ph)) * spread;   // a slight spiral twist
                    var rr = p.r + out;
                    var x = C + Math.cos(ang) * rr, y = C + Math.sin(ang) * rr;
                    var alpha = p.lum * (1 - p.u * .7 * spread) * (assemble > .9 && p.u < .25 ? .4 : 1);
                    var lv = Math.min(LEVELS - 1, (alpha * LEVELS) | 0);
                    if (lv > 0) paths[lv].push(x, y, p.z * dpr);
                }
                for (l = 1; l < LEVELS; l++) {
                    var a = paths[l];
                    if (!a.length) continue;
                    ctx.beginPath();
                    for (var j = 0; j < a.length; j += 3) ctx.rect(a[j] - a[j + 2] / 2, a[j + 1] - a[j + 2] / 2, a[j + 2], a[j + 2]);
                    ctx.fillStyle = 'rgba(255,255,255,' + ((l + .5) / LEVELS).toFixed(3) + ')';
                    ctx.fill();
                }
            }
            requestAnimationFrame(frame);
        }

        function start() {
            try { if (!build()) return; } catch (e) { return; }      // keep the plain photo
            wrap.classList.add('fx-on');
            requestAnimationFrame(frame);
            var timer;
            window.addEventListener('resize', function () {
                clearTimeout(timer);
                timer = setTimeout(function () { try { build(); } catch (e) {} }, 200);
            });
        }

        // Pointer: come together. Touch: a tap toggles.
        wrap.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') target = 1; });
        wrap.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') target = 0; });
        wrap.addEventListener('click', function () { if (!window.matchMedia('(hover: hover)').matches) target = target ? 0 : 1; });

        if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(wrap);
        if (img.complete && img.naturalWidth) start();
        else img.addEventListener('load', start);
    })();

/* ==========================================================
   Orbits around the photo
   ========================================================== */
    (function () {
        var core = document.getElementById('core');
        var pace = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? .55 : 1;
        var chips = Array.prototype.slice.call(core.querySelectorAll('.chip'));
        var backs = core.querySelectorAll('.orbits.back ellipse');
        var fronts = core.querySelectorAll('.orbits.front path');

        // Same ellipses as in the SVG (viewBox units: core width = 200). Their tilt rocks slowly.
        var orbits = [
            { rx: 98, ry: 29, base: -16, wob: 6, wf: .12, speed: .15, tilt: 0 },
            { rx: 88, ry: 26, base: 22, wob: 7, wf: -.1, speed: -.12, tilt: 0 }
        ];
        var data = chips.map(function (el) {
            return { el: el, o: orbits[+el.dataset.orbit], phase: parseFloat(el.dataset.phase), w: 0, h: 0 };
        });
        var t0 = performance.now(), visible = true;

        function measure() { data.forEach(function (d) { d.w = d.el.offsetWidth; d.h = d.el.offsetHeight; }); }

        function frame(now) {
            if (visible && !document.hidden) {
                var t = (now - t0) / 1000 * pace;
                orbits.forEach(function (o, j) {
                    var deg = o.base + Math.sin(t * o.wf + j) * o.wob;
                    o.tilt = deg * Math.PI / 180;
                    backs[j].setAttribute('transform', 'rotate(' + deg.toFixed(2) + ')');
                    fronts[j].setAttribute('transform', 'rotate(' + deg.toFixed(2) + ')');
                });
                var size = core.clientWidth, k = size / 200, c = size / 2;
                var intro = Math.min(1, Math.max(0, (t - .8) / 1.2));
                data.forEach(function (d) {
                    var a = d.phase + t * d.o.speed;
                    var x = Math.cos(a) * d.o.rx, y = Math.sin(a) * d.o.ry;
                    var X = x * Math.cos(d.o.tilt) - y * Math.sin(d.o.tilt);
                    var Y = x * Math.sin(d.o.tilt) + y * Math.cos(d.o.tilt);
                    var front = Math.sin(a);                      // lower half of the ellipse is in front
                    var s = .82 + (front + 1) * .1;
                    d.el.style.transform = 'translate(' + (c + X * k - d.w / 2).toFixed(1) + 'px,' + (c + Y * k - d.h / 2).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
                    d.el.style.opacity = ((.35 + (front + 1) * .325) * intro).toFixed(3);
                    d.el.style.zIndex = front > 0 ? 4 : 1;
                });
            }
            requestAnimationFrame(frame);
        }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(core);
        }
        window.addEventListener('resize', measure);
        document.addEventListener('langchange', measure);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
        measure();
        requestAnimationFrame(frame);
    })();

/* ==========================================================
   Plan tree
   ========================================================== */
    (function () {
        var tree = document.getElementById('tree');
        var svg = document.getElementById('tree-lines');
        var nodes = Array.prototype.slice.call(tree.querySelectorAll('.node'));
        var byId = {}, stageOf = {};
        Array.prototype.forEach.call(tree.querySelectorAll('.stage'), function (st, i) {
            Array.prototype.forEach.call(st.querySelectorAll('.node'), function (n) { stageOf[n.id] = i; n.style.setProperty('--stage', i); });
        });
        nodes.forEach(function (n) { byId[n.id] = n; });
        var NS = 'http://www.w3.org/2000/svg';
        var edges = [];

        function box(el) {
            var t = tree.getBoundingClientRect(), r = el.getBoundingClientRect();
            return { l: r.left - t.left, r: r.right - t.left, t: r.top - t.top, b: r.bottom - t.top,
                     cx: r.left - t.left + r.width / 2, cy: r.top - t.top + r.height / 2 };
        }

        function draw() {
            svg.textContent = '';
            edges = [];
            var across = window.innerWidth > 1080;
            if (!across) return;            // stacked layout uses one clean spine instead (CSS)
            var settled = tree.classList.contains('settled');
            nodes.forEach(function (from) {
                (from.dataset.to || '').split(' ').filter(Boolean).forEach(function (id) {
                    var to = byId[id];
                    var a = box(from), b = box(to), d;
                    if (across) {
                        var mx = (a.r + b.l) / 2;
                        d = 'M' + a.r + ' ' + a.cy + 'C' + mx + ' ' + a.cy + ' ' + mx + ' ' + b.cy + ' ' + b.l + ' ' + b.cy;
                    } else {
                        var my = (a.b + b.t) / 2;
                        d = 'M' + a.cx + ' ' + a.b + 'C' + a.cx + ' ' + my + ' ' + b.cx + ' ' + my + ' ' + b.cx + ' ' + b.t;
                    }
                    var live = from.classList.contains('done') || from.classList.contains('now') || from.id === 'n-job';
                    var path = document.createElementNS(NS, 'path');
                    path.setAttribute('d', d);
                    path.setAttribute('class', 'edge ' + ((from.classList.contains('done') || from.classList.contains('now')) ? 'solid' : 'dashed'));
                    if (!settled) path.style.transitionDelay = (stageOf[id] * .17) + 's';
                    svg.appendChild(path);
                    var flow = null;
                    if (live) {
                        flow = document.createElementNS(NS, 'path');
                        flow.setAttribute('d', d);
                        flow.setAttribute('pathLength', '100');
                        flow.setAttribute('class', 'flow');
                        flow.style.animationDelay = (-Math.random() * 3) + 's';
                        if (!settled) flow.style.transitionDelay = (stageOf[id] * .17 + .3) + 's';
                        svg.appendChild(flow);
                    }
                    edges.push({ from: from.id, to: id, path: path, flow: flow });
                });
            });
        }

        tree.addEventListener('revealed', function () {
            setTimeout(function () {
                tree.classList.add('settled');
                edges.forEach(function (e) { e.path.style.transitionDelay = ''; if (e.flow) e.flow.style.transitionDelay = ''; });
            }, 1800);
        });

        function focus(start) {
            var seen = {}, queue = [start.id];
            while (queue.length) {
                var id = queue.shift();
                if (seen[id]) continue;
                seen[id] = true;
                (byId[id].dataset.to || '').split(' ').filter(Boolean).forEach(function (t) { queue.push(t); });
            }
            tree.classList.add('focus');
            nodes.forEach(function (n) { n.classList.toggle('lit', !!seen[n.id]); });
            edges.forEach(function (e) {
                var on = seen[e.from] && seen[e.to];
                e.path.classList.toggle('lit', on);
                if (e.flow) e.flow.classList.toggle('lit', on);
            });
        }
        function blur() {
            tree.classList.remove('focus');
            nodes.forEach(function (n) { n.classList.remove('lit'); });
            edges.forEach(function (e) { e.path.classList.remove('lit'); if (e.flow) e.flow.classList.remove('lit'); });
        }
        nodes.forEach(function (n) {
            n.addEventListener('pointerenter', function () { if (tree.classList.contains('settled') || !document.documentElement.classList.contains('js')) focus(n); });
            n.addEventListener('pointerleave', blur);
            n.addEventListener('focus', function () { focus(n); });
            n.addEventListener('blur', blur);
        });

        window.addEventListener('resize', draw);
        window.addEventListener('load', draw);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
        if (window.ResizeObserver) new ResizeObserver(draw).observe(tree);
        draw();
    })();

/* ==========================================================
   Terminal
   ========================================================== */
    (function () {
        var out = document.getElementById('term-out');
        var form = document.getElementById('term-form');
        var input = document.getElementById('term-in');
        var wrap = document.getElementById('term-wrap');
        var history = [], pos = 0, busy = false, started = false;

        function L() { return document.documentElement.lang === 'en' ? 'en' : 'de'; }
        function T(de, en) { return L() === 'en' ? en : de; }

        function line(text, cls) {
            var el = document.createElement('div');
            if (cls) el.className = cls;
            el.textContent = text;
            out.appendChild(el);
            out.scrollTop = out.scrollHeight;
            return el;
        }

        function printAll(lines, done) {
            var i = 0;
            busy = true;
            (function next() {
                if (i >= lines.length) { busy = false; if (done) done(); return; }
                var l = lines[i++];
                if (typeof l === 'function') l(); else line(l[0], l[1]);
                setTimeout(next, 40);
            })();
        }

        function neofetch() {
            var wrapEl = document.createElement('div');
            wrapEl.className = 'neo';
            var art = document.createElement('div');
            art.className = 'neo-art';
            art.textContent =
                '     .-""""-.\n' +
                '   .\'  .--.  \'.\n' +
                '  /   /  _ \\   \\\n' +
                ' |   |  (_) |   |\n' +
                '  \\   \'.__.\'   /\n' +
                '   \'.        .\'\n' +
                '     \'-....-\'';
            var info = document.createElement('div');
            info.className = 'neo-info';
            info.textContent = T(
                'bohdan@hamburg\n--------------\nOS:       Mensch, Version 2026\nStandort: Hamburg\nZiel:     Fachinformatiker SI, 2027\nDeutsch:  B1 ✓  B2 lädt …\nLernt:    Linux, Netzwerke, Python\nKaffee:   ausreichend\nUptime:   neugierig seit der Kindheit',
                'bohdan@hamburg\n--------------\nOS:       Human, version 2026\nLocation: Hamburg\nGoal:     IT specialist SI, 2027\nGerman:   B1 ✓  B2 loading …\nLearning: Linux, networking, Python\nCoffee:   sufficient\nUptime:   curious since childhood'
            );
            wrapEl.appendChild(art);
            wrapEl.appendChild(info);
            out.appendChild(wrapEl);
            out.scrollTop = out.scrollHeight;
        }

        function progress(label, after) {
            var el = line('', 'hi');
            var n = 0;
            busy = true;
            var t = setInterval(function () {
                n += 10;
                el.textContent = label + ' [' + '█'.repeat(n / 10) + '░'.repeat(10 - n / 10) + '] ' + n + '%';
                out.scrollTop = out.scrollHeight;
                if (n >= 100) { clearInterval(t); busy = false; after(); }
            }, 130);
        }

        function mailLink() {
            var el = document.createElement('div');
            var a = document.createElement('a');
            a.href = 'mai' + 'lto:' + window.__mail + '?subject=' + encodeURIComponent(T('Ausbildung / Praktikum', 'Apprenticeship / internship'));
            a.textContent = T('E-Mail an Bohdan schreiben', 'Write Bohdan an email');
            el.appendChild(a);
            out.appendChild(el);
            out.scrollTop = out.scrollHeight;
        }

        var commands = {
            help: function () {
                printAll([
                    [T('Über mich', 'About me'), 'dim'],
                    ['  whoami · neofetch · plan · skills · projekte'],
                    [T('Dateien & Navigation', 'Files & navigation'), 'dim'],
                    ['  ls · cat <datei> · cd <bereich> · lebenslauf · sha256sum lebenslauf.pdf'],
                    [T('Netzwerk-Werkzeuge (echt gerechnet)', 'Network tools (real maths)'), 'dim'],
                    ['  subnet <ip/cidr> · ping <ort> · traceroute ausbildung · ipconfig'],
                    [T('Ihr System – bleibt in Ihrem Browser', 'Your system – stays in your browser'), 'dim'],
                    ['  sysinfo'],
                    [T('Wichtig', 'Important'), 'dim'],
                    ['  hire bohdan · kontakt · coffee · clear · history'],
                    [T('Tipp: Tab ergänzt, ↑ holt den letzten Befehl. Es gibt auch versteckte Befehle …', 'Tip: Tab completes, ↑ recalls. There are hidden commands, too …'), 'dim']
                ]);
            },
            whoami: function () {
                printAll([
                    ['Bohdan Krasokha', 'hi'],
                    [T('Hamburg. Angehender Fachinformatiker für Systemintegration.', 'Hamburg. Future IT specialist for system integration.')],
                    [T('Baut PCs, lernt Netzwerke, hat diese Seite gebaut.', 'Builds PCs, learns networking, built this site.')],
                    [T('Schwäche: vergisst die Zeit, wenn das Problem gut ist.', 'Weakness: forgets the time when the problem is good.'), 'dim']
                ]);
            },
            neofetch: neofetch,
            plan: function () {
                printAll([
                    ['[✓] ' + T('Deutsch B1 (DTZ) – Sprechen 100/100', 'German B1 (DTZ) – speaking 100/100')],
                    ['[▸] ' + T('Berufsorientierung (MOVE)', 'Career orientation (MOVE)')],
                    ['[▸] Google IT Support (Coursera)'],
                    ['[ ] ' + T('Nebenjob', 'Part-time job')],
                    ['    ├─ ' + T('Deutsch B2', 'German B2')],
                    ['    ├─ Homelab: Ubuntu Server, Windows Server, AD'],
                    ['    ├─ Python – CS50P (Harvard)'],
                    ['    └─ Cisco Networking Basics'],
                    ['[ ] ' + T('Praktikum', 'Internship')],
                    ['[★] ' + T('Ausbildung FISI – August 2027', 'Apprenticeship FISI – August 2027'), 'hi']
                ]);
            },
            skills: function () {
                printAll([
                    [T('kann:    Windows, PC-Hardware, Laptop-Wartung, Heimnetz, cmd/PowerShell, HTML/CSS/JS', 'can:      Windows, PC hardware, laptop service, home network, cmd/PowerShell, HTML/CSS/JS')],
                    [T('lernt:   Netzwerke (IPv4/IPv6, Subnetting, OSI), Linux, Windows Server & AD, Python', 'learning: networking (IPv4/IPv6, subnetting, OSI), Linux, Windows Server & AD, Python')],
                    [T('extra:   After Effects, Alight Motion, Mathe', 'extra:    After Effects, Alight Motion, maths')]
                ]);
            },
            projekte: function () {
            printAll([
                ['[hw]  ' + T('Laptop-Wartung MSI GE75: Paste + Putty neu, Akku-Report, BIOS geprüft', 'Laptop service MSI GE75: new paste + putty, battery report, BIOS checked')],
                ['[art] ' + T('Wallpaper-Serie „Mein Stil“: Python/NumPy, Full HD + 4K', 'Wallpaper series "My style": Python/NumPy, Full HD + 4K')],
                ['[app] ' + T('Projekt Bankai: eigene Lern-App mit Plan, Tracker und Sync', 'Projekt Bankai: my own learning app with plan, tracker and sync')],
                [T('Details: weiter oben unter „Projekte“.', 'Details: further up under "Projects".'), 'dim']
            ]);
        },
        lebenslauf: function () {
            printAll([
                [T('Lebenslauf_Bohdan_Krasokha.pdf  2 Seiten  ✓ frisch', 'CV_Bohdan_Krasokha_EN.pdf  2 pages  ✓ fresh'), 'dim'],
                function () {
                    var el = document.createElement('div');
                    var a = document.createElement('a');
                    a.href = T('Lebenslauf_Bohdan_Krasokha.pdf', 'CV_Bohdan_Krasokha_EN.pdf'); a.setAttribute('download', '');
                    a.textContent = T('↓ Lebenslauf herunterladen', '↓ Download CV');
                    el.appendChild(a); out.appendChild(el); out.scrollTop = out.scrollHeight;
                }
            ]);
        },
        kontakt: function () {
                printAll([
                    ['E-Mail:   ' + window.__mail],
                    ['LinkedIn: linkedin.com/in/bohdan-krasokha'],
                    ['GitHub:   github.com/skv1ce'],
                    mailLink
                ]);
            },
            coffee: function () {
                printAll([
                    ['      ( (', 'dim'],
                    ['       ) )', 'dim'],
                    ['    ........'],
                    ['    |      |]'],
                    ['    \\      /'],
                    ['     `----\''],
                    [T('Kaffee wird gebrüht … Fehler 418: Ich bin eine Teekanne.', 'Brewing coffee … Error 418: I\'m a teapot.'), 'hi'],
                    [T('(Ein echter HTTP-Statuscode. Kein Witz. Okay, ein bisschen.)', '(A real HTTP status code. No joke. Well, a little.)'), 'dim']
                ]);
            },
            hire: function () {
                progress(T('Bewerbung wird geladen', 'Loading application'), function () {
                    printAll([
                        [T('Fertig. Motivation: 100 %. Pünktlichkeit: vom Bau gelernt.', 'Done. Motivation: 100%. Punctuality: learned on construction sites.')],
                        [T('Nächster Schritt:', 'Next step:'), 'dim'],
                        mailLink
                    ]);
                });
            },
            ping: function (arg) {
                var host = arg || 'hamburg';
                line('PING ' + host + ' (10.20.27.8): 56 data bytes', 'dim');
                var n = 0;
                busy = true;
                var t = setInterval(function () {
                    n++;
                    line('64 bytes from ' + host + ': icmp_seq=' + n + ' ttl=64 time=' + (8 + Math.random() * 9).toFixed(1) + ' ms');
                    if (n === 3) {
                        clearInterval(t);
                        busy = false;
                        line(T('3 gesendet, 3 empfangen, 0 % Verlust. Verbindung steht – schreiben Sie mir.', '3 sent, 3 received, 0% loss. Link is up – write to me.'), 'dim');
                    }
                }, 380);
            },
            sudo: function () { line(T('Netter Versuch. Admin-Rechte gibt es erst in der Ausbildung.', 'Nice try. Admin rights come with the apprenticeship.')); },
            rm: function () { line(T('Nicht auf meinem Server. Backups sind wichtig – das lerne ich gerade.', 'Not on my server. Backups matter – that\'s what I\'m learning.')); },
            exit: function () { line(T('Es gibt keinen Ausgang. Nur den Kontakt-Button.', 'There is no exit. Only the contact button.')); },
            wetter: function () { line(T('Hamburg: Regen. Überraschung.', 'Hamburg: rain. Surprise.')); },
            clear: function () { out.textContent = ''; },

            // ---- Real network maths: subnet calculator ----
            subnet: function (arg) {
                var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/.exec((arg || '').trim());
                if (!m || +m[5] > 32 || m.slice(1, 5).some(function (o) { return +o > 255; })) {
                    line(T('Verwendung: subnet 192.168.10.0/26', 'Usage: subnet 192.168.10.0/26'), 'dim'); return;
                }
                var ip = ((+m[1] << 24) >>> 0) + (+m[2] << 16) + (+m[3] << 8) + (+m[4]), n = +m[5];
                var mask = n === 0 ? 0 : (0xFFFFFFFF << (32 - n)) >>> 0;
                var net = (ip & mask) >>> 0, bc = (net | (~mask >>> 0)) >>> 0;
                function q(x) { return [x >>> 24, (x >>> 16) & 255, (x >>> 8) & 255, x & 255].join('.'); }
                var hosts = n === 32 ? 1 : n === 31 ? 2 : Math.pow(2, 32 - n) - 2;
                var first = n >= 31 ? net : net + 1, last = n >= 31 ? bc : bc - 1;
                var a = +m[1], b = +m[2];
                var kind = a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ? T('privat (RFC 1918)', 'private (RFC 1918)')
                         : a === 127 ? 'Loopback' : (a === 169 && b === 254) ? T('APIPA – DHCP hat nicht geantwortet', 'APIPA – DHCP did not answer') : T('öffentlich', 'public');
                function row(de, en, v) { var k = T(de, en) + ':'; while (k.length < 14) k += ' '; return k + v; }
                printAll([
                    [row('Netz', 'Network', q(net) + '/' + n), 'hi'],
                    [row('Maske', 'Mask', q(mask))],
                    [row('Erster Host', 'First host', q(first))],
                    [row('Letzter Host', 'Last host', q(last))],
                    [row('Broadcast', 'Broadcast', q(bc))],
                    [row('Hosts', 'Hosts', hosts.toLocaleString(L() === 'en' ? 'en' : 'de'))],
                    [row('Art', 'Type', kind)],
                    [n <= 30 ? T('Rechenweg: 2^(32 − ' + n + ') − 2 = ' + hosts + ' nutzbare Adressen.', 'Working: 2^(32 − ' + n + ') − 2 = ' + hosts + ' usable addresses.') : T('/31 und /32 sind Sonderfälle (Punkt-zu-Punkt, einzelner Host).', '/31 and /32 are special cases (point-to-point, single host).'), 'dim']
                ]);
            },
            traceroute: function () {
                printAll([
                    ['traceroute to ausbildung-2027 (10.20.27.8), 8 hops max', 'dim'],
                    [' 1  hamburg-harburg            0.4 ms   ' + T('angekommen 08/2025', 'arrived 08/2025')],
                    [' 2  deutsch-b1.dtz             1.1 ms   ✓'],
                    [' 3  google-it-support          2.7 ms   ' + T('läuft', 'running')],
                    [' 4  homelab.local              *        ' + T('als Nächstes', 'next up')],
                    [' 5  deutsch-b2 / cisco-netacad *        ' + T('geplant', 'planned')],
                    [' 6  ausbildung-fisi-2027       ★        ' + T('Ziel', 'goal'), 'hi'],
                    [T('Route steht. Es fehlt nur noch ein Betrieb, der „ja“ sagt.', 'Route is up. All it needs is a company that says "yes".'), 'dim']
                ]);
            },
            ipconfig: function () {
                printAll([
                    [T('Ethernet-Adapter Motivation:', 'Ethernet adapter Motivation:')],
                    ['   IPv4 . . . . . . . . : 10.20.27.8'],
                    ['   IPv6 . . . . . . . . : fe80::b0d:a4'],
                    [T('   Subnetzmaske . . . . : 255.255.255.0', '   Subnet mask  . . . . : 255.255.255.0')],
                    ['   Gateway  . . . . . . : ' + T('Ausbildung 2027', 'apprenticeship 2027')],
                    ['   DNS  . . . . . . . . : ' + T('neugier.local', 'curiosity.local')],
                    [T('(Spaß. Aber ich weiß, was jede Zeile bedeutet.)', '(A joke. But I know what every line means.)'), 'dim']
                ]);
            },

            // ---- The visitor's own system: read in the browser, sent nowhere ----
            sysinfo: function () {
                var ua = navigator.userAgent, os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '?';
                var br = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '?';
                var c = navigator.connection || {}, tz = '';
                try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
                var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var sw = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
                printAll([
                    [T('Ihr System (nur lokal gelesen):', 'Your system (read locally only):'), 'hi'],
                    ['OS:          ' + os + (os === 'Linux' ? T('  – sehr gute Wahl', '  – excellent choice') : '')],
                    ['Browser:     ' + br],
                    [T('Bildschirm:  ', 'Screen:      ') + screen.width + '×' + screen.height + ' @' + (window.devicePixelRatio || 1) + 'x'],
                    [T('CPU-Kerne:   ', 'CPU cores:   ') + (navigator.hardwareConcurrency || '?')],
                    [T('Sprache:     ', 'Language:    ') + (navigator.language || '?')],
                    [T('Zeitzone:    ', 'Time zone:   ') + (tz || '?')],
                    [T('Netz:        ', 'Network:     ') + (c.effectiveType ? c.effectiveType + (c.downlink ? ', ~' + c.downlink + ' Mbit/s' : '') : (navigator.onLine ? 'online' : 'offline'))],
                    [T('Dunkelmodus: ', 'Dark mode:   ') + (dark ? T('an', 'on') : T('aus', 'off'))],
                    ['Offline:     ' + (sw ? T('bereit ✓ – diese Seite läuft auch ohne Internet', 'ready ✓ – this page works without internet') : T('ab dem nächsten Besuch bereit', 'ready from your next visit'))],
                    [T('Nichts davon wird gesendet. Datenschutz gehört zum Job.', 'None of this is sent anywhere. Privacy is part of the job.'), 'dim']
                ]);
            },

            // ---- A tiny file system ----
            ls: function () {
                printAll([
                    ['drwxr-xr-x  projekte/'],
                    ['-rw-r--r--  lebenslauf.pdf'],
                    ['-rw-r--r--  lebenslauf.txt'],
                    ['-rw-r--r--  motivation.txt'],
                    ['-r--------  geheim.txt'],
                    [T('Tipp: cat motivation.txt', 'Tip: cat motivation.txt'), 'dim']
                ]);
            },
            cat: function (arg) {
                var f = (arg || '').trim().toLowerCase();
                if (f === 'motivation.txt') {
                    printAll([
                        [T('Ich will verstehen, worauf alles läuft – Netzwerke, Server, Konten.', 'I want to understand what everything runs on – networks, servers, accounts.')],
                        [T('Ich lerne jeden Tag, und ich mache Dinge fertig.', 'I learn every day, and I finish what I start.')],
                        [T('Und wenn etwas kaputt ist, werde ich nicht nervös, sondern neugierig.', 'And when something breaks, I don\'t get nervous – I get curious.')]
                    ]);
                } else if (f === 'geheim.txt') {
                    line(T('cat: geheim.txt: Keine Berechtigung. Aber gute Neugier – genau so arbeite ich auch.', 'cat: geheim.txt: Permission denied. But nice curiosity – that\'s how I work, too.'), 'dim');
                } else if (f === 'lebenslauf.txt' || f === 'cv.txt') {
                    busy = true;
                    fetch(L() === 'en' ? 'cv.txt' : 'lebenslauf.txt').then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (txt) {
                        var el = document.createElement('div'); el.className = 'neo-info'; el.textContent = txt;
                        out.appendChild(el); out.scrollTop = out.scrollHeight; busy = false;
                    }).catch(function () { line(T('Gerade nicht erreichbar. Versuchen Sie: lebenslauf', 'Not reachable right now. Try: lebenslauf'), 'dim'); busy = false; });
                } else if (f === 'lebenslauf.pdf') {
                    line(T('Binärdatei. Lieber: lebenslauf (Download) oder cat lebenslauf.txt', 'Binary file. Better: lebenslauf (download) or cat lebenslauf.txt'), 'dim');
                } else {
                    line('cat: ' + (f || '?') + T(': Datei nicht gefunden – siehe ls', ': no such file – see ls'), 'dim');
                }
            },
            cd: function (arg) {
                var map = { projekte: 'projects', projects: 'projects', plan: 'plan', kontakt: 'contacts', contact: 'contacts', skills: 'skills', kenntnisse: 'skills', story: 'story', about: 'story', '~': 'top', '..': 'top', '/': 'top' };
                var k = (arg || '').trim().toLowerCase().replace(/\/$/, ''), id = map[k];
                if (!id) { line('cd: ' + (k || '?') + T(': kein Bereich. Möglich: projekte, plan, skills, kontakt, ~', ': no such section. Try: projects, plan, skills, contact, ~'), 'dim'); return; }
                line(T('→ unterwegs nach ', '→ heading to ') + (id === 'top' ? '~' : k) + ' …', 'dim');
                setTimeout(function () {
                    var a = document.createElement('a'); a.href = '#' + id; a.style.display = 'none';
                    document.body.appendChild(a); a.click(); a.remove();     // uses the smooth glide
                }, 350);
            },
            sha256sum: function (arg) {
                var f = (arg || 'lebenslauf.pdf').trim().toLowerCase();
                if (f !== 'lebenslauf.pdf') { line(T('sha256sum: hier liegt nur lebenslauf.pdf', 'sha256sum: only lebenslauf.pdf lives here'), 'dim'); return; }
                if (!window.crypto || !crypto.subtle) { line(T('Ihr Browser rechnet SHA-256 nur über HTTPS.', 'Your browser only does SHA-256 over HTTPS.'), 'dim'); return; }
                busy = true;
                var file = L() === 'en' ? 'CV_Bohdan_Krasokha_EN.pdf' : 'Lebenslauf_Bohdan_Krasokha.pdf';
                line(T('rechne …', 'hashing …'), 'dim');
                fetch(file, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }).then(function (buf) {
                    return crypto.subtle.digest('SHA-256', buf).then(function (h) {
                        var hex = Array.prototype.map.call(new Uint8Array(h), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
                        line(hex + '  ' + file, 'hi');
                        line(T(Math.round(buf.byteLength / 1024) + ' KB, live in Ihrem Browser berechnet. Gleicher Hash = unveränderte Datei.', Math.round(buf.byteLength / 1024) + ' KB, computed live in your browser. Same hash = untouched file.'), 'dim');
                        busy = false;
                    });
                }).catch(function () { line(T('Konnte die Datei nicht laden.', 'Could not load the file.'), 'dim'); busy = false; });
            },
            history: function () {
                var h = history.slice(0, -1);
                if (!h.length) { line(T('Noch leer. Sie sind neu hier – willkommen!', 'Still empty. You\'re new here – welcome!'), 'dim'); return; }
                printAll(h.slice(-12).map(function (c, i) { return ['  ' + (i + 1) + '  ' + c]; }));
            },
            date: function () { line(new Date().toLocaleString(L() === 'en' ? 'en-GB' : 'de-DE') + T(' – ein guter Tag für eine Einladung.', ' – a good day for an invitation.')); },

            // ---- hidden ----
            sudo: function (arg) {
                if (/^hire\s+bohdan/i.test(arg || '')) {
                    printAll([
                        [T('[sudo] Passwort für gast: ********', '[sudo] password for gast: ********'), 'dim'],
                        [T('Zugriff gewährt. Root-Rechte gibt es bei mir übrigens erst nach der Probezeit.', 'Access granted. Root rights, by the way, only after probation.'), 'hi'],
                        mailLink
                    ]);
                } else line(T('Netter Versuch. Admin-Rechte gibt es erst in der Ausbildung.', 'Nice try. Admin rights come with the apprenticeship.'));
            },
            vim: function () { line(T('Sie kommen hier nie wieder raus. Spaß: :q! – und weiter geht\'s.', 'You will never get out. Kidding: :q! – carry on.'), 'dim'); },
            make: function (arg) { line(/sandwich/.test(arg || '') ? T('Mach es dir selbst.', 'Make it yourself.') : 'make: *** ' + T('Kein Ziel angegeben. Meins: Ausbildung 2027.', 'No target specified. Mine: apprenticeship 2027.'), 'dim'); },
            konami: function () { document.dispatchEvent(new CustomEvent('konami')); }
        };

        commands.contact = commands.kontakt;
    commands.projects = commands.projekte;
    commands.cv = commands.lebenslauf;
        commands.weather = commands.wetter;
        commands.ifconfig = commands.ipconfig;
        commands['ip'] = commands.ipconfig;
        commands.tracert = commands.traceroute;
        commands.whoareyou = commands.sysinfo;
        var names = Object.keys(commands);

        function run(raw) {
            var cmd = raw.trim();
            if (!cmd || busy) return;
            history.push(cmd); pos = history.length;
            line('gast@bohdan:~$ ' + cmd, 'cmd');
            var parts = cmd.split(/\s+/);
            var word = parts[0].toLowerCase();
            var arg = parts.slice(1).join(' ');
            if (commands[word]) { commands[word](arg); return; }
            var guess = names.filter(function (n) { return n[0] === word[0]; })[0];
            line(T('Befehl nicht gefunden: ', 'Command not found: ') + word +
                 (guess ? T(' – meinten Sie "' + guess + '"?', ' – did you mean "' + guess + '"?') : T(' – tippe "help".', ' – type "help".')), 'dim');
        }

        // Types a command letter by letter, then runs it
        function typeAndRun(cmd, after) {
            busy = true;
            var el = line('gast@bohdan:~$ ', 'cmd');
            var caret = document.createElement('span');
            caret.className = 'caret';
            el.appendChild(caret);
            var i = 0;
            (function next() {
                if (i < cmd.length) {
                    caret.insertAdjacentText('beforebegin', cmd[i++]);
                    setTimeout(next, 70 + Math.random() * 60);
                } else {
                    setTimeout(function () {
                        caret.remove();
                        busy = false;
                        commands[cmd]();
                        if (after) after();
                    }, 250);
                }
            })();
        }

        function start() {
            if (started) return;
            started = true;
            out.textContent = '';
            var calm = !document.documentElement.classList.contains('js');
            if (calm) {
                neofetch();
                line(T('Willkommen! Tippe "help" oder nutze die Knöpfe unten.', 'Welcome! Type "help" or use the buttons below.'), 'dim');
                return;
            }
            setTimeout(function () {
                typeAndRun('neofetch', function () {
                    line(T('Willkommen! Tippe "help" oder nutze die Knöpfe unten.', 'Welcome! Type "help" or use the buttons below.'), 'dim');
                });
            }, 500);
        }

        form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); input.value = ''; });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowUp' && pos > 0) { pos--; input.value = history[pos]; e.preventDefault(); }
            else if (e.key === 'ArrowDown') { pos = Math.min(history.length, pos + 1); input.value = history[pos] || ''; e.preventDefault(); }
            else if (e.key === 'Tab' && input.value) {
                var m = names.filter(function (n) { return n.indexOf(input.value.toLowerCase()) === 0; });
                if (m.length) { input.value = m[0] + (m[0] === 'hire' ? ' bohdan' : ''); e.preventDefault(); }
            }
        });
        document.querySelectorAll('[data-cmd]').forEach(function (b) {
            b.addEventListener('click', function () { start(); run(b.dataset.cmd); });
        });

        if (wrap.classList.contains('in')) start();
        wrap.addEventListener('revealed', start);
        if (!document.documentElement.classList.contains('js')) start();
        document.addEventListener('langchange', function () {
            if (started && out.children.length <= 3 && !busy) { started = false; start(); }
        });
    })();

/* ==========================================================
   Math figures: golden spiral, tesseract, caffeine
   ========================================================== */
    (function () {
        var calm = false;
        var pace = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? .55 : 1;
        var figs = Array.prototype.slice.call(document.querySelectorAll('canvas[data-fig]')).map(function (c) {
            return { c: c, ctx: c.getContext('2d'), type: c.dataset.fig, vis: false, w: 0, boost: 0, target: 0 };
        });
        var t0 = performance.now();

        function size(f) {
            var d = Math.min(window.devicePixelRatio || 1, 2);
            f.w = f.c.clientWidth || 200;
            f.c.width = f.w * d; f.c.height = f.w * d;
            f.ctx.setTransform(d, 0, 0, d, 0, 0);
        }

        // ---- Golden spiral built from Fibonacci squares ----
        var sq = (function () {
            var fib = [1, 1, 2, 3, 5, 8, 13], dirs = ['up', 'right', 'down', 'left'];
            var list = [{ x: 0, y: 0, s: 1, d: 'up' }], minX = 0, minY = 0, maxX = 1, maxY = 1;
            for (var i = 1; i < fib.length; i++) {
                var s = fib[i], d = dirs[i % 4], q;
                if (d === 'right') { q = { x: maxX, y: minY }; maxX += s; }
                else if (d === 'down') { q = { x: minX, y: maxY }; maxY += s; }
                else if (d === 'left') { q = { x: minX - s, y: minY }; minX -= s; }
                else { q = { x: minX, y: minY - s }; minY -= s; }
                q.s = s; q.d = d; list.push(q);
            }
            return { list: list, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, span: Math.hypot(maxX - minX, maxY - minY) };
        })();
        var arcAt = {
            up:    function (q) { return [q.x + q.s, q.y + q.s, Math.PI, Math.PI * 1.5]; },
            right: function (q) { return [q.x, q.y + q.s, -Math.PI / 2, 0]; },
            down:  function (q) { return [q.x, q.y, 0, Math.PI / 2]; },
            left:  function (q) { return [q.x + q.s, q.y, Math.PI / 2, Math.PI]; }
        };

        function golden(f, t) {
            var g = f.ctx, w = f.w, k = w * .9 / sq.span;
            g.clearRect(0, 0, w, w);
            g.save();
            g.translate(w / 2, w / 2);
            g.rotate(t * .09);
            g.scale(k, k);
            g.translate(-sq.cx, -sq.cy);
            g.lineWidth = 1 / k;
            g.strokeStyle = 'rgba(255,255,255,.16)';
            sq.list.forEach(function (q) { g.strokeRect(q.x, q.y, q.s, q.s); });

            // Draw the spiral bit by bit, hold it, start again
            var total = 0;
            sq.list.forEach(function (q) { total += q.s; });
            var cycle = (t % 10) / 6;
            var p = Math.min(1, cycle) * total, fade = cycle > 1.45 ? Math.max(0, 1 - (cycle - 1.45) * 4) : 1;
            g.strokeStyle = 'rgba(255,255,255,' + (.9 * fade).toFixed(3) + ')';
            g.lineWidth = 1.6 / k;
            g.beginPath();
            var done = 0, end = null;
            for (var i = 0; i < sq.list.length && done < p; i++) {
                var q = sq.list[i], a = arcAt[q.d](q);
                var part = Math.min(1, (p - done) / q.s);
                var a1 = a[2] + (a[3] - a[2]) * part;
                g.arc(a[0], a[1], q.s, a[2], a1);
                end = [a[0] + Math.cos(a1) * q.s, a[1] + Math.sin(a1) * q.s];
                done += q.s;
            }
            g.stroke();
            if (end) {
                g.fillStyle = 'rgba(255,255,255,' + fade.toFixed(3) + ')';
                g.beginPath(); g.arc(end[0], end[1], 2.6 / k, 0, Math.PI * 2); g.fill();
            }
            g.restore();
        }

        // ---- Tesseract: a 4D cube turned in two planes and projected ----
        var tv = [], te = [];
        for (var i = 0; i < 16; i++) tv.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
        for (var a = 0; a < 16; a++) for (var b = a + 1; b < 16; b++) {
            var diff = 0;
            for (var j = 0; j < 4; j++) if (tv[a][j] !== tv[b][j]) diff++;
            if (diff === 1) te.push([a, b]);
        }
        function tesseract(f, t) {
            var g = f.ctx, w = f.w, s = w * .44;
            g.clearRect(0, 0, w, w);
            var a1 = t * .42, a2 = t * .28, a3 = .5 + Math.sin(t * .18) * .3;
            var p = tv.map(function (v) {
                var x = v[0], y = v[1], z = v[2], ww = v[3], c, sn, n;
                c = Math.cos(a1); sn = Math.sin(a1); n = x * c - ww * sn; ww = x * sn + ww * c; x = n;   // XW
                c = Math.cos(a2); sn = Math.sin(a2); n = y * c - z * sn; z = y * sn + z * c; y = n;      // YZ
                c = Math.cos(a3); sn = Math.sin(a3); n = x * c - z * sn; z = x * sn + z * c; x = n;      // XZ
                var k4 = 1.6 / (3 - ww); x *= k4; y *= k4; z *= k4;
                var k3 = 2.4 / (4 - z);
                return [w / 2 + x * k3 * s, w / 2 + y * k3 * s, z];
            });
            g.lineWidth = 1;
            te.forEach(function (e) {
                var A = p[e[0]], B = p[e[1]];
                var depth = ((A[2] + B[2]) / 2 + 1.2) / 2.4;
                g.strokeStyle = 'rgba(255,255,255,' + (.15 + Math.max(0, Math.min(1, depth)) * .55).toFixed(3) + ')';
                g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
            });
            g.fillStyle = '#fff';
            p.forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], 1.8, 0, Math.PI * 2); g.fill(); });
        }

        // ---- Caffeine: the flat molecule turning in 3D ----
        var atoms = [
            ['C', -.866, -.5], ['N', 0, -1], ['C', .866, -.5], ['N', .866, .5], ['C', 0, 1], ['C', -.866, .5],   // 6-ring: C4 N3 C2 N1 C6 C5
            ['N', -1.817, .809], ['C', -2.405, 0], ['N', -1.817, -.809],                                      // 5-ring: N7 C8 N9
            ['O', 1.732, -1], ['O', 0, 2],                                                                    // C2=O, C6=O
            ['C', 1.732, 1], ['C', 0, -2], ['C', -2.35, 1.66]                                                 // methyl groups
        ];
        var bonds = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[5,6],[6,7],[7,8],[8,0],[2,9],[4,10],[3,11],[1,12],[6,13]];
        var doubles = { '2-9': 1, '4-10': 1, '7-8': 1, '0-5': 1 };
        atoms.forEach(function (a) { a[1] += .45; });
        function caffeine(f, t) {
            var g = f.ctx, w = f.w, s = w * .17;
            g.clearRect(0, 0, w, w);
            var ry = Math.sin(t * .38) * .85, rx = .35 + Math.sin(t * .27) * .3, rz = t * .14;
            var p = atoms.map(function (a) {
                var x = a[1], y = a[2], z = 0, n;
                n = x * Math.cos(rz) - y * Math.sin(rz); y = x * Math.sin(rz) + y * Math.cos(rz); x = n;
                n = x * Math.cos(ry) - z * Math.sin(ry); z = x * Math.sin(ry) + z * Math.cos(ry); x = n;
                n = y * Math.cos(rx) - z * Math.sin(rx); z = y * Math.sin(rx) + z * Math.cos(rx); y = n;
                var k = 5 / (5 - z);
                return [w / 2 + x * k * s, w / 2 + y * k * s, z, a[0]];
            });
            bonds.forEach(function (b) {
                var A = p[b[0]], B = p[b[1]];
                var al = .25 + ((A[2] + B[2]) / 2 + 2.5) / 5 * .5;
                g.strokeStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
                g.lineWidth = 1.1;
                g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
                if (doubles[b[0] + '-' + b[1]]) {
                    var dx = B[1] - A[1], dy = A[0] - B[0], l = Math.hypot(dx, dy) || 1;
                    dx = dx / l * 3; dy = dy / l * 3;
                    g.beginPath(); g.moveTo(A[0] + dx, A[1] + dy); g.lineTo(B[0] + dx, B[1] + dy); g.stroke();
                }
            });
            p.slice().sort(function (a, b) { return a[2] - b[2]; }).forEach(function (q) {
                var r = q[3] === 'O' ? 4.6 : q[3] === 'N' ? 4 : 2.8;
                var al = .45 + (q[2] + 2.5) / 5 * .55;
                g.fillStyle = q[3] === 'C' ? 'rgba(255,255,255,' + al.toFixed(3) + ')' : '#000';
                g.strokeStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
                g.lineWidth = 1.3;
                g.beginPath(); g.arc(q[0], q[1], r, 0, Math.PI * 2); g.fill(); g.stroke();
            });
        }

        // ---- Chip: a BGA package (board, die, solder balls) turning in 3D ----
        var balls = [];
        for (var bx = 0; bx < 9; bx++) for (var by = 0; by < 9; by++) {
            if (bx > 2 && bx < 6 && by > 2 && by < 6) continue;                 // empty field under the die
            balls.push([-.82 + bx * .205, -.82 + by * .205, -.16]);
        }
        var caps = [[.7, -.15], [.7, 0], [.7, .15], [-.15, .72], [0, .72], [.15, .72]];
        function chip(f, t) {
            var g = f.ctx, w = f.w, s = w * .3;
            g.clearRect(0, 0, w, w);
            var rz = t * .22, rx = 1 + Math.sin(t * .3) * .22, ry = Math.sin(t * .21) * .25;
            var cz = Math.cos(rz), sz = Math.sin(rz), cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
            function P(x, y, z) {
                var n = x * cz - y * sz; y = x * sz + y * cz; x = n;
                n = x * cy + z * sy; z = -x * sy + z * cy; x = n;
                n = y * cx - z * sx; z = y * sx + z * cx; y = n;
                var k = 4 / (4 - z);
                return [w / 2 + x * k * s, w / 2 + y * k * s, z];
            }
            function quad(pts, stroke, fill) {
                g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
                for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
                g.closePath();
                if (fill) { g.fillStyle = fill; g.fill(); }
                g.strokeStyle = stroke; g.stroke();
            }
            g.lineWidth = 1;
            // solder balls (under the board), dimmer
            balls.forEach(function (b) {
                var p = P(b[0], b[1], b[2]);
                g.fillStyle = 'rgba(255,255,255,' + (.25 + (p[2] + 1) * .18).toFixed(3) + ')';
                g.beginPath(); g.arc(p[0], p[1], 1.5, 0, Math.PI * 2); g.fill();
            });
            // board: bottom and top outline with corner edges
            var B = 1, zt = 0, zb = -.08;
            var top = [P(-B, -B, zt), P(B, -B, zt), P(B, B, zt), P(-B, B, zt)];
            var bot = [P(-B, -B, zb), P(B, -B, zb), P(B, B, zb), P(-B, B, zb)];
            quad(bot, 'rgba(255,255,255,.25)');
            for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(top[i][0], top[i][1]); g.lineTo(bot[i][0], bot[i][1]); g.strokeStyle = 'rgba(255,255,255,.3)'; g.stroke(); }
            quad(top, 'rgba(255,255,255,.6)', 'rgba(10,10,12,.9)');
            // marker dot in one corner
            var m = P(-.86, -.86, zt);
            g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(m[0], m[1], 1.6, 0, Math.PI * 2); g.fill();
            // small capacitors on the board
            caps.forEach(function (c) {
                quad([P(c[0] - .04, c[1] - .025, .02), P(c[0] + .04, c[1] - .025, .02), P(c[0] + .04, c[1] + .025, .02), P(c[0] - .04, c[1] + .025, .02)], 'rgba(255,255,255,.55)');
            });
            // the die: a raised, shiny block
            var D = .52, dz = .14;
            var dt = [P(-D, -D, dz), P(D, -D, dz), P(D, D, dz), P(-D, D, dz)];
            var db = [P(-D, -D, zt), P(D, -D, zt), P(D, D, zt), P(-D, D, zt)];
            for (i = 0; i < 4; i++) {
                var j = (i + 1) % 4;
                quad([db[i], db[j], dt[j], dt[i]], 'rgba(255,255,255,.35)', 'rgba(22,22,26,.95)');
            }
            var shine = (Math.sin(t * .6) + 1) / 2;
            var grad = g.createLinearGradient(dt[0][0], dt[0][1], dt[2][0], dt[2][1]);
            grad.addColorStop(0, 'rgba(255,255,255,.05)');
            grad.addColorStop(Math.max(.01, Math.min(.99, shine)), 'rgba(255,255,255,.32)');
            grad.addColorStop(1, 'rgba(255,255,255,.04)');
            quad(dt, 'rgba(255,255,255,.9)', grad);
        }

        var draw = { golden: golden, tesseract: tesseract, caffeine: caffeine, chip: chip };

        figs.forEach(function (f) {
            size(f);
            f.c.parentNode.addEventListener('pointerenter', function () { f.target = 1; });
            f.c.parentNode.addEventListener('pointerleave', function () { f.target = 0; });
            f.local = 0;
        });

        if (calm) { figs.forEach(function (f) { draw[f.type](f, 4); }); }
        else {
            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (e) { figs.forEach(function (f) { if (f.c === e.target) f.vis = e.isIntersecting; }); });
                });
                figs.forEach(function (f) { io.observe(f.c); });
            } else figs.forEach(function (f) { f.vis = true; });

            var last = performance.now();
            (function loop(now) {
                var dt = Math.min(.05, (now - last) / 1000); last = now;
                figs.forEach(function (f) {
                    f.boost += (f.target - f.boost) * .06;
                    f.local += dt * pace * (1 + f.boost * 2.5);                 // spins faster under the pointer
                    if (f.vis && !document.hidden) draw[f.type](f, f.local);
                });
                requestAnimationFrame(loop);
            })(last);
        }
        window.addEventListener('resize', function () { figs.forEach(function (f) { size(f); if (calm) draw[f.type](f, 4); }); });
    })();

/* ==========================================================
   Particle field
   ========================================================== */
    /*
     * Six particle figures, each living in its own part of the page and scrolling with
     * it like any other content: a galaxy round the photo, waves behind "Über mich",
     * a slowly turning globe round the goal, a DNA helix behind the skills, a dot grid
     * behind the terminal and an atom next to the contact. Nothing follows the visitor.
     * Each point hums gently on its own. The mouse only parts the points softly, a click
     * sends a small ripple. Only figures that are on screen are calculated and drawn.
     * If the system asks for less motion, everything runs at about half speed.
     */
    (function () {
        var canvas = document.getElementById('field');
        var ctx = canvas.getContext('2d');
        var pace = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? .55 : 1;
        var LEVELS = 16, GOLD = Math.PI * (3 - Math.sqrt(5));
        var W, H, dpr, small, m;
        var tSim = 0, lastT = performance.now();
        var mx = -9999, my = -9999, active = false, ripples = [];

        function q(sel) { return document.querySelector(sel); }
        var defs = [
            { kind: 'spiral', anchor: q('#core') },
            { kind: 'waves',  anchor: q('#story') },
            { kind: 'sphere', anchor: q('#n-goal') },
            { kind: 'helix',  anchor: q('#skills .skills') },
            { kind: 'circuit', anchor: q('#projects') },
            { kind: 'grid',   anchor: q('#terminal') },
            { kind: 'atom',   anchor: q('#contacts') }
        ];
        var systems = [];

        function countFor(d) {
            if (d.kind === 'grid') {
                d.gap = small ? 26 : 32;
                d.cols = Math.ceil(W / d.gap) + 1;
                d.rows = Math.ceil(d.anchor.offsetHeight / d.gap) + 1;
                return d.cols * d.rows;
            }
            if (d.kind === 'circuit') return circuitTraces(d);
            var big = { spiral: 1100, waves: 720, sphere: 820, helix: 700, atom: 680 };
            var low = { spiral: 600, waves: 380, sphere: 460, helix: 340, atom: 380 };
            return (small ? low : big)[d.kind];
        }

        // Traces like on a circuit board: straight runs with 45° jogs, left to right
        function circuitTraces(d) {
            var h = d.anchor.offsetHeight, K = small ? 7 : 12, traces = [];
            for (var k = 0; k < K; k++) {
                var y = h * (.06 + .88 * (k + .2 + Math.random() * .6) / K), x = -30, pts = [[x, y]];
                while (x < W + 30) {
                    x += 70 + Math.random() * (small ? 140 : 240); pts.push([x, y]);
                    var dy = (Math.random() < .5 ? -1 : 1) * (18 + Math.random() * 46);
                    if (y + dy < h * .03 || y + dy > h * .97) dy = -dy;
                    x += Math.abs(dy); y += dy; pts.push([x, y]);
                }
                var L = [0];
                for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
                traces.push({ p: pts, L: L, len: L[L.length - 1], speed: 60 + Math.random() * 70 });
            }
            d.traces = traces;
            return small ? 420 : 760;
        }

        function build(d, old) {
            var n = countFor(d);
            if (old && old.n === n) return old;
            var s = { def: d, n: n, born: old ? old.born : false,
                OX: new Float32Array(n), OY: new Float32Array(n), VX: new Float32Array(n), VY: new Float32Array(n),
                S: new Float32Array(n), PX: new Float32Array(n), PY: new Float32Array(n), A: new Float32Array(n),
                LV: new Uint8Array(n), SZ: new Float32Array(n) };
            for (var i = 0; i < n; i++) s.S[i] = Math.random();
            return s;
        }

        function setup() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = window.innerWidth; H = window.innerHeight; small = W < 760; m = Math.min(W, H);
            canvas.width = W * dpr; canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            systems = defs.map(function (d, i) { return build(d, systems[i]); });
        }

        // Where a figure sits on screen right now; null when it is far off screen
        function frame(s) {
            var r = s.def.anchor.getBoundingClientRect(), k = s.def.kind, f = { r: r };
            if (k === 'spiral') { f.x = r.left + r.width / 2; f.y = r.top + r.height / 2; f.R = r.width * (small ? .66 : .86); f.top = f.y - f.R; f.bottom = f.y + f.R; }
            else if (k === 'sphere') { f.x = r.left + r.width / 2; f.y = r.top + r.height / 2; f.R = small ? m * .42 : m * .37; f.top = f.y - f.R; f.bottom = f.y + f.R; }
            else if (k === 'helix') { f.y = r.top + r.height / 2; f.amp = small ? 50 : Math.min(110, H * .15); f.top = f.y - f.amp - 40; f.bottom = f.y + f.amp + 40; }
            else if (k === 'atom') { f.x = small ? W * .5 : W * .76; f.y = r.top + r.height * .42; f.R = small ? m * .42 : m * .36; f.top = f.y - f.R; f.bottom = f.y + f.R; }
            else { f.top = r.top; f.bottom = r.bottom; }
            return (f.bottom < -60 || f.top > H + 60) ? null : f;
        }

        function place(s, f, t) {
            var n = s.n, S = s.S, PX = s.PX, PY = s.PY, A = s.A, k = s.def.kind, i, u, r, a;
            if (k === 'spiral') {
                var r0 = f.R * .35, R = f.R * (1 + Math.sin(t * .4) * .025);
                for (i = 0; i < n; i++) {
                    u = i / n; r = r0 + (R - r0) * Math.sqrt(u);
                    a = i * GOLD + t * .16 * (2.4 - 2 * u);            // inner arms a little faster
                    PX[i] = f.x + Math.cos(a) * r; PY[i] = f.y + Math.sin(a) * r * .9;
                    A[i] = .22 + (1 - u) * .58;
                }
            } else if (k === 'waves') {
                var rows = small ? 9 : 13, per = Math.ceil(n / rows), rr = f.r;
                for (i = 0; i < n; i++) {
                    var row = Math.floor(i / per), j = i % per, x = (j / (per - 1)) * W * 1.1 - W * .05;
                    PX[i] = x;
                    PY[i] = rr.top + rr.height * (.2 + .68 * row / rows) + Math.sin(x * .005 + t * .55 + row * .42) * (26 + row * 2) + Math.sin(x * .012 - t * .35) * 6;
                    A[i] = .1 + (row / rows) * .3;
                }
            } else if (k === 'sphere') {
                var SR = f.R * (1 + Math.sin(t * .5) * .02), ay = t * .25, ax = .35 + Math.sin(t * .2) * .15;
                var cY = Math.cos(ay), sY = Math.sin(ay), cX = Math.cos(ax), sX = Math.sin(ax);
                for (i = 0; i < n; i++) {
                    var yy = 1 - (i / (n - 1)) * 2, rq = Math.sqrt(1 - yy * yy), th = i * GOLD;
                    var x3 = Math.cos(th) * rq, z3 = Math.sin(th) * rq;
                    var xr = x3 * cY - z3 * sY, zr = x3 * sY + z3 * cY;
                    var yr = yy * cX - zr * sX, zt = yy * sX + zr * cX;
                    PX[i] = f.x + xr * SR; PY[i] = f.y + yr * SR;
                    A[i] = .1 + (zt + 1) * .33;
                }
            } else if (k === 'helix') {
                var wave = small ? 240 : 420, x0 = -W * .02, x1 = W * 1.02, rungs = small ? 18 : 34;
                for (i = 0; i < n; i++) {
                    var kind = i % 5, sp = i / n;
                    if (kind < 2) {
                        var hx = x0 + sp * (x1 - x0), ph = hx / wave * Math.PI * 2 + t * .45 + (kind ? Math.PI : 0);
                        PX[i] = hx; PY[i] = f.y + Math.sin(hx * .003 + t * .35) * 16 + Math.sin(ph) * f.amp;
                        A[i] = .14 + (Math.cos(ph) + 1) * .28;
                    } else {
                        var qx = Math.floor(sp * rungs) / rungs, rx = x0 + qx * (x1 - x0);
                        var p0 = rx / wave * Math.PI * 2 + t * .45, axis = f.y + Math.sin(rx * .003 + t * .35) * 16;
                        var w = ((kind - 2) + S[i]) / 3, ya = axis + Math.sin(p0) * f.amp, yb = axis + Math.sin(p0 + Math.PI) * f.amp;
                        PX[i] = rx; PY[i] = ya + (yb - ya) * w;
                        A[i] = .09 + Math.abs(Math.cos(p0)) * .18;
                    }
                }
            } else if (k === 'grid') {
                var d = s.def, gr = f.r, cxg = W / 2, cyg = gr.top + gr.height / 2;
                for (i = 0; i < n; i++) {
                    var gx = (i % d.cols) * d.gap, gy = gr.top + Math.floor(i / d.cols) * d.gap;
                    var wv = Math.sin(Math.hypot(gx - cxg, gy - cyg) * .02 - t * 1.4);
                    PX[i] = gx; PY[i] = gy + wv * 6;
                    A[i] = .07 + (wv + 1) * .11;
                }
            } else if (k === 'circuit') {
                var tr = s.def.traces, K = tr.length, per = Math.ceil(n / K), top0 = f.r.top;
                for (i = 0; i < n; i++) {
                    var T = tr[i % K], slot = Math.floor(i / K), signal = slot % 11 === 0, dist;
                    if (signal) dist = (S[i] * T.len + t * T.speed) % T.len;          // a signal running along the trace
                    else dist = (slot / per) * T.len;                                  // the trace itself, as fine dots
                    var seg = 1;
                    while (seg < T.L.length - 1 && T.L[seg] < dist) seg++;
                    var p0 = T.p[seg - 1], p1 = T.p[seg], sl = (T.L[seg] - T.L[seg - 1]) || 1, w2 = (dist - T.L[seg - 1]) / sl;
                    PX[i] = p0[0] + (p1[0] - p0[0]) * w2;
                    PY[i] = top0 + p0[1] + (p1[1] - p0[1]) * w2;
                    A[i] = signal ? .9 : .17 + .06 * Math.sin(dist * .02 - t * 1.2);
                }
            } else if (k === 'atom') {
                for (i = 0; i < n; i++) {
                    if (i % 12 === 0) {
                        var nr = Math.sqrt(S[i]) * f.R * .1, na = i * GOLD + t * .5;
                        PX[i] = f.x + Math.cos(na) * nr; PY[i] = f.y + Math.sin(na) * nr; A[i] = .7;
                        continue;
                    }
                    var band = i % 3, tilt = band * Math.PI / 3 + t * .05;
                    var ang = (i / n) * Math.PI * 8 + t * (.6 + band * .15);
                    var ox = Math.cos(ang) * f.R, oy = Math.sin(ang) * f.R * .34;
                    PX[i] = f.x + ox * Math.cos(tilt) - oy * Math.sin(tilt);
                    PY[i] = f.y + ox * Math.sin(tilt) + oy * Math.cos(tilt);
                    A[i] = .18 + (Math.sin(ang) + 1) * .26;
                }
            }
            // A gentle hum on every point, like molecules (circuit traces stay straight)
            if (k !== 'circuit') for (i = 0; i < n; i++) {
                var f1 = .25 + S[i] * .45, amp = 1 + S[i] * 2.2;
                PX[i] += Math.cos(t * f1 + S[i] * 20) * amp;
                PY[i] += Math.sin(t * f1 * 1.13 + S[i] * 31) * amp;
            }
        }

        // Offsets from the figure: pushed by the mouse or a ripple, always springing back home
        function physics(s) {
            var n = s.n, OX = s.OX, OY = s.OY, VX = s.VX, VY = s.VY, PX = s.PX, PY = s.PY, SZ = s.SZ, i;
            if (!s.born) {
                s.born = true;
                for (i = 0; i < n; i++) {
                    var a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 380;
                    OX[i] = Math.cos(a) * d; OY[i] = Math.sin(a) * d;
                }
            }
            var R = 95, R2 = R * R;
            for (i = 0; i < n; i++) {
                var ox = OX[i], oy = OY[i], vx = VX[i] - ox * .045, vy = VY[i] - oy * .045;
                var px = PX[i] + ox, py = PY[i] + oy;
                if (active) {
                    var dx = px - mx, dy = py - my, d2 = dx * dx + dy * dy;
                    if (d2 < R2 && d2 > 1) { var dd = Math.sqrt(d2), f = 1 - dd / R; f = f * f * 1.3; vx += dx / dd * f; vy += dy / dd * f; }
                }
                for (var w = 0; w < ripples.length; w++) {
                    var rp = ripples[w], ex = px - rp.x, ey = py - rp.y, ed = Math.sqrt(ex * ex + ey * ey) || 1, band = Math.abs(ed - rp.r);
                    if (band < 36) { var p = (1 - band / 36) * rp.power; vx += ex / ed * p; vy += ey / ed * p; }
                }
                vx *= .86; vy *= .86;
                OX[i] = ox + vx; OY[i] = oy + vy; VX[i] = vx; VY[i] = vy;
                PX[i] = px + vx; PY[i] = py + vy;
                SZ[i] = Math.min(1, (Math.abs(vx) + Math.abs(vy)) * .08);   // speed, used for brightness
            }
        }

        function draw(s) {
            var n = s.n, PX = s.PX, PY = s.PY, A = s.A, S = s.S, LV = s.LV, SZ = s.SZ, i, l;
            var fade = (small ? (s.def.kind === 'spiral' ? .85 : .55) : 1) * (1 + nova * 1.4);
            for (i = 0; i < n; i++) {
                var a = Math.min(.999, (A[i] * (.6 + S[i] * .5) + SZ[i] * .35) * fade);
                LV[i] = (a * LEVELS) | 0;
            }
            for (l = 1; l < LEVELS; l++) {
                ctx.beginPath();
                for (i = 0; i < n; i++) if (LV[i] === l) { var z = 1.1 + S[i] * 1.1; ctx.rect(PX[i] - z / 2, PY[i] - z / 2, z, z); }
                ctx.fillStyle = 'rgba(255,255,255,' + ((l + .5) / LEVELS).toFixed(3) + ')';
                ctx.fill();
            }
        }

        // The cursor becomes a little network switch: thin links to the nearest points
        var nova = 0, LINK = 150;
        function collectNear(s, near) {
            var PX = s.PX, PY = s.PY, n = s.n, step = n > 900 ? 3 : 2;
            for (var i = 0; i < n && near.length < 26; i += step) {
                var dx = PX[i] - mx, dy = PY[i] - my, d2 = dx * dx + dy * dy;
                if (d2 < LINK * LINK && d2 > 400) near.push(PX[i], PY[i], Math.sqrt(d2));
            }
        }
        function links(near) {
            ctx.lineWidth = .6;
            for (var i = 0; i < near.length; i += 3) {
                var a = (1 - near[i + 2] / LINK) * .32;
                ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
                ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(near[i], near[i + 1]); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,.85)';
            ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);
        }
        window.addEventListener('supernova', function () {
            nova = 1;
            ripples.push({ x: W / 2, y: H / 2, r: 0, power: 6 });
            ripples.push({ x: W / 2, y: H / 2, r: -140, power: 4 });
        });

        function loop(now) {
            if (document.hidden) return;
            var dt = Math.min(.05, (now - lastT) / 1000) * pace;
            lastT = now; tSim += dt;
            ctx.clearRect(0, 0, W, H);
            nova *= .985; if (nova < .01) nova = 0;
            var near = [];
            for (var j = 0; j < systems.length; j++) {
                var s = systems[j], f = frame(s);
                if (!f) continue;
                place(s, f, tSim);
                physics(s);
                draw(s);
                if (active && near.length < 26) collectNear(s, near);
            }
            if (near.length) links(near);
            for (var r = ripples.length - 1; r >= 0; r--) {
                ripples[r].r += 600 * dt; ripples[r].power *= .93;
                if (ripples[r].power < .04) ripples.splice(r, 1);
            }
            requestAnimationFrame(loop);
        }

        // Mouse only: on a phone a finger is scrolling, not playing with the particles
        window.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'mouse') return;
            mx = e.clientX; my = e.clientY; active = true;
        }, { passive: true });
        window.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'mouse' || e.target.closest('a, button, input, .terminal')) return;
            ripples.push({ x: e.clientX, y: e.clientY, r: 0, power: 3.2 });
            if (ripples.length > 3) ripples.shift();
        }, { passive: true });
        window.addEventListener('fieldpulse', function (e) {
            ripples.push({ x: e.detail.x, y: e.detail.y, r: 0, power: 2.6 });
        });
        document.addEventListener('pointerleave', function () { active = false; });
        document.addEventListener('mouseleave', function () { active = false; });

        var timer, lastW = 0, lastH = 0;
        window.addEventListener('resize', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                // The language switch also fires resize: only rebuild what really changed
                if (window.innerWidth !== lastW || window.innerHeight !== lastH) { lastW = window.innerWidth; lastH = window.innerHeight; }
                setup();
            }, 150);
        });
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) { lastT = performance.now(); requestAnimationFrame(loop); }
        });

        setup();
        requestAnimationFrame(loop);
    })();

/* ==========================================================
   Little extras for curious people
   - a greeting in the developer console, with hire()
   - "/" jumps into the terminal, "?" shows the shortcuts
   - the Konami code (↑ ↑ ↓ ↓ ← → ← → B A)
   - the CV link follows the language
   - section headings "decode" themselves when they appear
   - buttons lean towards the pointer, cards light up under it
   - offline mode (service worker)
   ========================================================== */
    (function () {
        var de = function () { return document.documentElement.lang !== 'en'; };

        // ---- Developer console ----
        try {
            console.log('%c\n     .-""""-.\n   .\'  .--.  \'.\n  /   /  _ \\   \\\n |   |  (_) |   |\n  \\   \'.__.\'   /\n   \'.        .\'\n     \'-....-\'\n', 'color:#fff;font-family:monospace');
            console.log('%cHallo! Sie haben die Konsole geöffnet – dann sprechen wir dieselbe Sprache.', 'font:600 14px system-ui;color:#fff;background:#000;padding:6px 10px;border-radius:6px');
            console.log('%cTippen Sie  hire()  und drücken Sie Enter.   ·   Type  hire()  and press Enter.\nLebenslauf im Terminal:  curl ' + location.origin + location.pathname.replace(/[^/]*$/, '') + 'lebenslauf.txt', 'font:12px monospace;color:#aaa');
        } catch (e) {}
        window.hire = function () {
            var c = document.getElementById('contacts');
            if (c) { var a = document.createElement('a'); a.href = '#contacts'; document.body.appendChild(a); a.click(); a.remove(); }
            return de() ? '✓ Gute Entscheidung. Kontakt ist schon offen – ich freue mich auf Ihre Nachricht!' : '✓ Good call. Contact is open – looking forward to your message!';
        };

        // ---- Toast ----
        var toast = document.createElement('div');
        toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
        var tt;
        function say(html, ms) {
            toast.innerHTML = html; toast.classList.add('show');
            clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, ms || 3200);
        }

        // ---- Keyboard ----
        var seq = [], code = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
        document.addEventListener('keydown', function (e) {
            var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
            seq.push((e.key || '').toLowerCase()); if (seq.length > code.length) seq.shift();
            if (seq.join() === code.join()) { seq = []; document.dispatchEvent(new CustomEvent('konami')); return; }
            if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === '/') {
                e.preventDefault();
                var input = document.getElementById('term-in'), t = document.getElementById('terminal');
                if (t) t.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (input) setTimeout(function () { input.focus({ preventScroll: true }); }, 450);
            } else if (e.key === '?') {
                say(de() ? '<b>Tastenkürzel</b><br><kbd>/</kbd> Terminal · <kbd>?</kbd> diese Hilfe · <kbd>Esc</kbd> Menü zu<br><span>Und es gibt einen Klassiker aus den 80ern …</span>'
                         : '<b>Shortcuts</b><br><kbd>/</kbd> terminal · <kbd>?</kbd> this help · <kbd>Esc</kbd> close menu<br><span>And there is a classic from the 80s …</span>', 5000);
            }
        });
        document.addEventListener('konami', function () {
            document.documentElement.classList.add('supernova');
            window.dispatchEvent(new CustomEvent('supernova'));
            setTimeout(function () { document.documentElement.classList.remove('supernova'); }, 2600);
            say(de() ? '<b>★ Erfolg freigeschaltet: Konami-Code</b><br><span>Sie sind definitiv aus der IT. Wir sollten reden.</span>'
                     : '<b>★ Achievement unlocked: Konami code</b><br><span>You are definitely in IT. We should talk.</span>', 4500);
        });

        // ---- CV link follows the language ----
        function cvLinks() {
            document.querySelectorAll('.cv-link').forEach(function (a) {
                if (!a.dataset.de) a.dataset.de = a.getAttribute('href');
                a.setAttribute('href', de() ? a.dataset.de : (a.dataset.en || a.dataset.de));
            });
        }
        document.addEventListener('langchange', cvLinks); cvLinks();

        // ---- Headings decode themselves when they scroll in ----
        var glyphs = '01<>/\\[]{}=+*#_-';
        function scramble(el) {
            var span = el.querySelector('[lang="' + (de() ? 'de' : 'en') + '"]') || el;
            if (span.children.length) return;                          // only plain text
            var final = span.textContent, start = performance.now(), dur = 700;
            el.setAttribute('aria-label', el.textContent.trim());
            (function step(now) {
                var p = Math.min(1, (now - start) / dur), out = '';
                for (var i = 0; i < final.length; i++) {
                    var c = final[i];
                    out += (c === ' ' || i / final.length < p * 1.15 - .1) ? c : glyphs[(Math.random() * glyphs.length) | 0];
                }
                span.textContent = p < 1 ? out : final;
                if (p < 1) requestAnimationFrame(step); else el.removeAttribute('aria-label');
            })(start);
        }
        document.querySelectorAll('.section h2, .contact h2').forEach(function (h) {
            var host = h.closest('.reveal') || h;
            host.addEventListener('revealed', function () { setTimeout(function () { scramble(h); }, 120); });
        });

        // ---- Buttons lean towards the pointer, cards light up under it (mouse only) ----
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            document.querySelectorAll('.hero-actions .button, .contact-actions .copy').forEach(function (b) {
                b.addEventListener('pointermove', function (e) {
                    var r = b.getBoundingClientRect();
                    b.style.translate = ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px';
                });
                b.addEventListener('pointerleave', function () { b.style.translate = ''; });
            });
            document.querySelectorAll('.card, .project, .node').forEach(function (c) {
                c.classList.add('spot');
                c.addEventListener('pointermove', function (e) {
                    var r = c.getBoundingClientRect();
                    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
                });
            });
        }

        // ---- Offline mode: the site keeps working without internet after the first visit ----
        if ('serviceWorker' in navigator && location.protocol === 'https:') {
            window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
        }
    })();
