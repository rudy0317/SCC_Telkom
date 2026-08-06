<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Form SCC Telkom (Proxy Mode)</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23e60000'/%3E%3Cpath d='M8 10h16v3H8zm6 3h4v10h-4z' fill='%23ffffff'/%3E%3C/svg%3E">
    <style>
        :root {
            --bg: #0f172a;
            --panel: #1e293b;
            --border: #334155;
            --text: #f8fafc;
            --muted: #94a3b8;
            --red: #e60000;
            --accent: #38bdf8;
            --green: #22c55e;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background-color: var(--bg); color: var(--text); height: 100vh; display: flex; overflow: hidden; }

        aside {
            width: 360px; background: var(--panel); border-right: 1px solid var(--border);
            padding: 24px; display: flex; flex-direction: column; gap: 20px; flex-shrink: 0;
        }

        .brand { font-size: 16px; font-weight: 700; color: var(--muted); letter-spacing: 0.5px; text-transform: uppercase; }
        .brand span { color: var(--red); }

        form { display: flex; flex-direction: column; gap: 16px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; position: relative; }
        .input-group label { font-size: 13px; font-weight: 600; color: var(--muted); }
        .input-group input {
            background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
            color: var(--text); padding: 12px; font-size: 14px; outline: none; transition: border-color 0.2s;
        }
        .input-group input:focus { border-color: var(--accent); }

        .suggestions {
            position: absolute; top: 100%; left: 0; right: 0; background: var(--panel);
            border: 1px solid var(--border); border-radius: 6px; max-height: 200px; overflow-y: auto;
            z-index: 1000; display: none; margin-top: 4px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5);
        }
        .suggestion-item {
            padding: 10px 14px; font-size: 13px; cursor: pointer; border-bottom: 1px solid var(--border);
        }
        .suggestion-item:hover { background: rgba(56, 189, 248, 0.1); color: var(--accent); }

        button {
            background: var(--red); color: white; border: none; border-radius: 6px;
            padding: 12px; font-weight: 600; font-size: 14px; cursor: pointer; transition: opacity 0.2s; margin-top: 8px;
        }
        button:hover { opacity: 0.9; }

        .status-badge {
            background: rgba(34, 197, 94, 0.15); border: 1px solid var(--green); color: var(--green);
            padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-align: center;
        }

        main { flex: 1; position: relative; background: #000; height: 100vh; display: flex; flex-direction: column; }
        .top-bar {
            background: var(--panel); border-bottom: 1px solid var(--border); padding: 10px 16px;
            display: none; align-items: center; justify-content: space-between; font-size: 13px;
        }
        .top-bar .active-gps { color: var(--green); font-weight: 600; }

        iframe { width: 100%; flex: 1; border: none; display: block; }

        .placeholder {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            text-align: center; color: var(--muted); font-size: 14px;
        }

        @media (max-width: 768px) {
            body { flex-direction: column; overflow: auto; }
            aside { width: 100%; border-right: none; border-bottom: 1px solid var(--border); }
            main { height: 650px; }
        }
    </style>
</head>
<body>

    <aside>
        <div class="brand">SYSTEM <span>SCC TELKOM</span></div>
        <div style="font-size: 11px; color: var(--accent); margin-top: -14px; font-weight: 600;">FAKE GPS INJECTOR ACTIVE</div>

        <div class="status-badge">⚡ SILENT GEOLOCATION READY</div>

        <form id="sccForm">
            <div class="input-group">
                <label for="ticketId">Nomor Tiket</label>
                <input type="text" id="ticketId" placeholder="Contoh: INC40660193" required autocomplete="off">
            </div>

            <div class="input-group">
                <label for="odpSearch">Cari ODP (Auto-fill Tikor GPS)</label>
                <input type="text" id="odpSearch" placeholder="Ketik nama ODP..." required autocomplete="off">
                <div class="suggestions" id="suggestions"></div>
            </div>

            <div class="input-group">
                <label for="nd">Nomor Internet</label>
                <input type="text" id="nd" placeholder="Contoh: 162201205432" required autocomplete="off">
            </div>

            <input type="hidden" id="selectedLat" value="">
            <input type="hidden" id="selectedLng" value="">

            <button type="submit">Submit Check & Inject GPS</button>
        </form>
    </aside>

    <main>
        <div class="top-bar" id="topBar">
            <div>
                📍 Fake GPS Active: <span class="active-gps" id="currentGpsText">-3.3194, 114.5908</span>
            </div>
            <div style="font-size: 11px; color: var(--muted);">
                Tikor ODP otomatis terinjeksi saat tahap Speedtest.
            </div>
        </div>

        <div class="placeholder" id="placeholder">
            <p>Silakan isi form di sebelah kiri<br>lalu klik <b>Submit Check & Inject GPS</b>.</p>
        </div>
        <iframe id="sccFrame" src="" allow="geolocation *; geolocation" style="display: none;"></iframe>
    </main>

    <script>
        const odpInput = document.getElementById('odpSearch');
        const suggestions = document.getElementById('suggestions');
        const latInput = document.getElementById('selectedLat');
        const lngInput = document.getElementById('selectedLng');
        const form = document.getElementById('sccForm');
        const iframe = document.getElementById('sccFrame');
        const placeholder = document.getElementById('placeholder');
        const topBar = document.getElementById('topBar');
        const currentGpsText = document.getElementById('currentGpsText');

        let debounceTimer;

        odpInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const query = this.value.trim();
            if (query.length < 2) {
                suggestions.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(() => {
                fetch(`/api/odp/search?q=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => {
                        suggestions.innerHTML = '';
                        if (data.length === 0) {
                            suggestions.style.display = 'none';
                            return;
                        }
                        data.forEach(item => {
                            const div = document.createElement('div');
                            div.className = 'suggestion-item';
                            div.textContent = `${item.name} (${item.lat}, ${item.lng})`;
                            div.addEventListener('click', () => {
                                odpInput.value = item.name;
                                latInput.value = item.lat;
                                lngInput.value = item.lng;
                                suggestions.style.display = 'none';
                            });
                            suggestions.appendChild(div);
                        });
                        suggestions.style.display = 'block';
                    });
            }, 250);
        });

        document.addEventListener('click', function(e) {
            if (!odpInput.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.style.display = 'none';
            }
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const ticketId = document.getElementById('ticketId').value.trim();
            const nd = document.getElementById('nd').value.trim();
            const lat = latInput.value || -3.3194;
            const lng = lngInput.value || 114.5908;

            currentGpsText.textContent = `${lat}, ${lng}`;
            topBar.style.display = 'flex';

            const proxyUrl = `/scc/proxy?ticketId=${encodeURIComponent(ticketId)}&nd=${encodeURIComponent(nd)}&lat=${lat}&lng=${lng}`;

            placeholder.style.display = 'none';
            iframe.style.display = 'block';
            iframe.src = proxyUrl;
        });
    </script>
</body>
</html>
