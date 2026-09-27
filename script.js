// qba.dev: plansza „portfolio w przygotowaniu”

(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;

    // Wejście elementów
    requestAnimationFrame(() => document.body.classList.add('is-ready'));

    // Zegar czasu lokalnego (Trzebnica)
    const clock = document.getElementById('clock');
    const fmt = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 10000);

    // Kursor: wspólny stan dla kuli, przycisku i tła
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    window.addEventListener('pointermove', (e) => {
        mouse.tx = e.clientX / window.innerWidth;
        mouse.ty = e.clientY / window.innerHeight;
    }, { passive: true });

    // Przyciski kontaktu lekko przyciągają się do kursora
    const magnets = [...document.querySelectorAll('[data-magnet]')].map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));

    if (fine && !reduced) {
        for (const m of magnets) {
            m.el.addEventListener('pointermove', (e) => {
                const r = m.el.getBoundingClientRect();
                m.tx = (e.clientX - (r.left + r.width / 2)) * 0.12;
                m.ty = (e.clientY - (r.top + r.height / 2)) * 0.25;
            });
            m.el.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
        }
    }

    const loop = () => {
        mouse.x += (mouse.tx - mouse.x) * 0.06;
        mouse.y += (mouse.ty - mouse.y) * 0.06;
        if (fine && !reduced) {
            for (const m of magnets) {
                m.x += (m.tx - m.x) * 0.15;
                m.y += (m.ty - m.y) * 0.15;
                m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
            }
        }
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Sfera z cząsteczek: kursor je rozprasza, sprężyny ściągają z powrotem
    (() => {
        const cv = document.getElementById('dots');
        const ctx = cv.getContext('2d');
        if (!ctx) return;

        const small = window.innerWidth < 700;
        const N = small ? 900 : 1700;
        const pts = [];
        const golden = Math.PI * (3 - Math.sqrt(5));
        for (let i = 0; i < N; i++) {
            const y = 1 - (i / (N - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const th = golden * i;
            pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, px: 0, py: 0, vx: 0, vy: 0, init: false });
        }

        // Kolory od tyłu (jasny liliowy) do przodu (głęboki fiolet)
        const BINS = 10;
        const from = [196, 184, 255], to = [70, 48, 190];
        const colors = Array.from({ length: BINS }, (_, i) => {
            const t = i / (BINS - 1);
            const c = from.map((v, k) => Math.round(v + (to[k] - v) * t));
            return `rgba(${c[0]},${c[1]},${c[2]},${(0.28 + t * 0.62).toFixed(2)})`;
        });
        const buckets = Array.from({ length: BINS }, () => []);

        let W = 0, H = 0, dpr = 1, R = 0, rect = null;
        const size = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            rect = cv.getBoundingClientRect();
            W = cv.width = Math.round(rect.width * dpr);
            H = cv.height = Math.round(rect.height * dpr);
            R = (W / 1.6) * 0.37; // płótno = 160% sfery; z perspektywą obrys ok. 0.44 sfery
        };
        size();
        window.addEventListener('resize', size);
        window.addEventListener('scroll', () => { rect = cv.getBoundingClientRect(); }, { passive: true });

        const p = { x: -9999, y: -9999, lx: -9999, ly: -9999, speed: 0, active: false };
        const toLocal = (e) => {
            p.x = (e.clientX - rect.left) * dpr;
            p.y = (e.clientY - rect.top) * dpr;
        };
        window.addEventListener('pointermove', (e) => { toLocal(e); p.active = true; }, { passive: true });
        document.addEventListener('pointerleave', () => { p.active = false; });
        cv.addEventListener('pointerdown', (e) => {
            toLocal(e);
            // kliknięcie: mocne rozrzucenie wokół punktu
            for (const q of pts) {
                const dx = q.px - p.x, dy = q.py - p.y;
                const d = Math.hypot(dx, dy) || 1;
                const f = Math.max(0, 1 - d / (R * 1.4)) * 38 * dpr;
                q.vx += (dx / d) * f;
                q.vy += (dy / d) * f;
            }
        });

        let angle = 0;
        const frame = () => {
            angle += reduced ? 0 : 0.0028;
            const tilt = 0.38 + (mouse.y - 0.5) * 0.5;
            const yaw = angle + (mouse.x - 0.5) * 0.8;
            const cy = Math.cos(yaw), sy = Math.sin(yaw);
            const cx = Math.cos(tilt), sx = Math.sin(tilt);
            const ox = W / 2, oy = H / 2;

            // prędkość kursora wzmacnia rozproszenie
            const mv = Math.hypot(p.x - p.lx, p.y - p.ly);
            p.speed += (Math.min(mv, 80 * dpr) - p.speed) * 0.25;
            p.lx = p.x; p.ly = p.y;
            const radius = R * 0.6;
            const push = p.active ? (2.4 + p.speed / dpr * 0.45) * dpr : 0;

            for (const b of buckets) b.length = 0;

            for (const q of pts) {
                const x1 = q.x * cy - q.z * sy;
                const z1 = q.x * sy + q.z * cy;
                const y2 = q.y * cx - z1 * sx;
                const z2 = q.y * sx + z1 * cx;
                const persp = 3.4 / (3.4 - z2 * 0.9);
                const tx = ox + x1 * R * persp;
                const ty = oy + y2 * R * persp;

                if (!q.init) { q.px = tx; q.py = ty; q.init = true; }

                if (push) {
                    const dx = q.px - p.x, dy = q.py - p.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < radius * radius) {
                        const d = Math.sqrt(d2) || 1;
                        const f = (1 - d / radius) ** 2 * push;
                        q.vx += (dx / d) * f;
                        q.vy += (dy / d) * f;
                    }
                }

                q.vx += (tx - q.px) * 0.022;
                q.vy += (ty - q.py) * 0.022;
                q.vx *= 0.9;
                q.vy *= 0.9;
                q.px += q.vx;
                q.py += q.vy;
                q.z2 = z2;

                const bin = Math.min(BINS - 1, Math.max(0, Math.floor((z2 + 1) / 2 * BINS)));
                buckets[bin].push(q);
            }

            ctx.clearRect(0, 0, W, H);
            for (let i = 0; i < BINS; i++) {
                ctx.fillStyle = colors[i];
                const s = (0.7 + (i / BINS) * 1.5) * dpr;
                ctx.beginPath();
                for (const q of buckets[i]) {
                    ctx.moveTo(q.px + s, q.py);
                    ctx.arc(q.px, q.py, s, 0, Math.PI * 2);
                }
                ctx.fill();
            }

            if (!reduced && !document.hidden) requestAnimationFrame(frame);
        };
        document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduced) requestAnimationFrame(frame); });
        requestAnimationFrame(frame);
    })();

    // Tło: perłowy „jedwab” w WebGL
    const canvas = document.getElementById('silk');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;

    const vert = `
        attribute vec2 p;
        void main() { gl_Position = vec4(p, 0.0, 1.0); }
    `;

    const frag = `
        precision highp float;
        uniform vec2 uRes;
        uniform float uTime;
        uniform vec2 uMouse;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
            for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
            return v;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uRes;
            vec2 p = uv;
            p.x *= uRes.x / uRes.y;
            float t = uTime * 0.045;

            vec2 m = (uMouse - 0.5) * vec2(0.35, -0.35);
            vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.1));
            vec2 r = vec2(fbm(p * 1.2 + 2.2 * q + m + t * 0.8), fbm(p * 1.2 + 2.2 * q - m - t * 0.6 + 7.4));
            float f = fbm(p * 1.1 + 2.6 * r);

            vec3 pearl = vec3(0.953, 0.949, 0.973);
            vec3 lilac = vec3(0.835, 0.800, 1.000);
            vec3 ice   = vec3(0.820, 0.878, 1.000);
            vec3 blush = vec3(0.965, 0.878, 0.957);
            vec3 white = vec3(1.0);

            vec3 col = pearl;
            col = mix(col, lilac, smoothstep(0.35, 0.85, f) * 0.85);
            col = mix(col, ice, smoothstep(0.3, 0.9, r.x) * 0.55);
            col = mix(col, blush, smoothstep(0.55, 0.95, q.y) * 0.35);

            // połysk jedwabiu: cienkie jasne fałdy
            float fold = pow(abs(sin((f + r.y) * 9.0 + t * 2.0)), 18.0);
            col = mix(col, white, fold * 0.45);

            // rozjaśnienie po lewej, żeby tekst był czytelny
            col = mix(col, pearl, smoothstep(0.75, 0.0, uv.x) * 0.45);

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };

    const vs = compile(gl.VERTEX_SHADER, vert);
    const fs = compile(gl.FRAGMENT_SHADER, frag);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');

    // Tło jest rozmyte z natury, więc renderujemy w obniżonej rozdzielczości
    const scale = 0.5;
    const resize = () => {
        canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
        canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    let visible = true;
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) requestAnimationFrame(draw); });

    function draw(now) {
        gl.uniform1f(uTime, reduced ? 12.0 : (now - start) / 1000);
        gl.uniform2f(uMouse, mouse.x, mouse.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!reduced && visible) requestAnimationFrame(draw);
    }
    requestAnimationFrame((now) => { draw(now); canvas.classList.add('is-on'); });
})();
