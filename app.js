class SimanisApp {
    constructor() {
        // 1. Tangkap elemen UI Login & Container Utama
        this.loginScreen = document.getElementById('loginScreen');
        this.appContainer = document.getElementById('appContainer');
        this.loginBtnSubmit = document.getElementById('loginBtnSubmit');
        this.loginError = document.getElementById('loginError');

        // 2. State untuk Peta, Grafik, dan Poligon Layer
        this.map = null;
        this.chartsLoaded = false;
        this.polygonLayers = {};

        // 3. Jalankan fungsi inisialisasi
        this.initEvents();
        this.checkSession();
    }

    // ==========================================
    // LOGIKA LOGIN & SESSION
    // ==========================================
    checkSession() {
        if (sessionStorage.getItem('isSimanisLoggedIn') === 'true') {
            this.showApp();
        }
    }

    handleLogin() {
        const user = document.getElementById('loginUsername').value;
        const pass = document.getElementById('loginPassword').value;

        if (user === 'admin' && pass === '1234') {
            sessionStorage.setItem('isSimanisLoggedIn', 'true');
            if(this.loginError) this.loginError.classList.add('hidden');
            this.showApp();
        } else {
            if(this.loginError) this.loginError.classList.remove('hidden');
        }
    }

    handleLogout() {
        if (confirm("Apakah Anda yakin ingin keluar dari sistem SIMANIS?")) {
            sessionStorage.removeItem('isSimanisLoggedIn');
            this.appContainer.style.display = 'none';
            this.loginScreen.style.display = 'flex';
            
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        }
    }

    showApp() {
        this.loginScreen.style.display = 'none';
        this.appContainer.style.display = 'block';
        
        if (!this.chartsLoaded) {
            this.initCharts();
            this.chartsLoaded = true;
        }
    }

    // ==========================================
    // LOGIKA NAVIGASI TAB
    // ==========================================
    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('block');
        });
        
        const activeTab = document.getElementById('tab-' + tabId);
        if(activeTab) {
            activeTab.classList.remove('hidden');
            activeTab.classList.add('block');
        }
        
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.remove('active', 'bg-emerald-50', 'text-emerald-600', 'font-semibold');
        });
        
        const activeBtn = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-emerald-50', 'text-emerald-600', 'font-semibold');
        }

        if (tabId === 'peta') {
            if (!this.map) {
                this.initMap();
            } else {
                setTimeout(() => { this.map.invalidateSize(); }, 300);
            }
        }
    }

    // ==========================================
    // ANIMASI ZOOM KAMERA HALUS
    // ==========================================
    focusToZone(zoneKey) {
        if (!this.map || !this.polygonLayers[zoneKey]) return;

        const layer = this.polygonLayers[zoneKey];
        const bounds = layer.getBounds();

        // 1. Animasi smooth zoom in membingkai poligon zona
        this.map.flyToBounds(bounds, {
            padding: [50, 50],
            duration: 1.8,
            easeLinearity: 0.25
        });

        // 2. Buka popup informasi zona secara otomatis setelah animasi selesai
        setTimeout(() => {
            layer.openPopup();
        }, 1900);
    }

    // ==========================================
    // EVENT LISTENER MANAJER
    // ==========================================
    initEvents() {
        if(this.loginBtnSubmit) this.loginBtnSubmit.addEventListener('click', () => this.handleLogin());
        
        const loginPass = document.getElementById('loginPassword');
        if(loginPass) {
            loginPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        const btnLogout = document.getElementById('btnLogout');
        if(btnLogout) btnLogout.addEventListener('click', () => this.handleLogout());

        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        const darkModeToggle = document.getElementById('toggleDarkMode');
        if(darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                if(e.target.checked) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            });
        }

        const btnTambahData = document.getElementById('btnTambahData');
        if(btnTambahData) btnTambahData.addEventListener('click', () => alert("Membuka modal Form Tambah Data Bibit Baru..."));

        const btnExportPDF = document.getElementById('btnExportPDF');
        if(btnExportPDF) btnExportPDF.addEventListener('click', () => alert("Mengekspor laporan ke format PDF. Mohon tunggu..."));

        const btnReset = document.getElementById('btnReset');
        if(btnReset) btnReset.addEventListener('click', () => confirm("Yakin ingin mengatur ulang semua parameter ke nilai bawaan pabrik?"));

        const btnSimpan = document.getElementById('btnSimpanPengaturan');
        if(btnSimpan) btnSimpan.addEventListener('click', () => alert("Pengaturan berhasil disimpan ke dalam sistem!"));

        // Interaksi Tombol Peta dengan Animasi Zoom Halus
        const btnZoomTalise = document.getElementById('btnZoomTalise');
        if(btnZoomTalise) btnZoomTalise.addEventListener('click', () => this.focusToZone('talise'));

        const btnZoomDonggala = document.getElementById('btnZoomDonggala');
        if(btnZoomDonggala) btnZoomDonggala.addEventListener('click', () => this.focusToZone('donggala'));

        const btnZoomMuara = document.getElementById('btnZoomMuara');
        if(btnZoomMuara) btnZoomMuara.addEventListener('click', () => this.focusToZone('muara'));

        const btnZoomMamboro = document.getElementById('btnZoomMamboro');
        if(btnZoomMamboro) btnZoomMamboro.addEventListener('click', () => this.focusToZone('mamboro'));

        // Fitur Filter Tabel
        const filterButtons = document.querySelectorAll('#tab-data button.rounded-full');
        const tableRows = document.querySelectorAll('#tab-data tbody tr');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => {
                    b.classList.remove('bg-emerald-600', 'text-white');
                    b.classList.add('bg-gray-50', 'text-gray-500', 'border', 'border-gray-200');
                });
                e.target.classList.remove('bg-gray-50', 'text-gray-500', 'border', 'border-gray-200');
                e.target.classList.add('bg-emerald-600', 'text-white');

                const selectedZone = e.target.textContent.trim().toLowerCase();

                tableRows.forEach(row => {
                    const zoneCell = row.querySelector('td:nth-child(3)').textContent.trim().toLowerCase();
                    if (selectedZone === 'semua zona' || zoneCell.includes(selectedZone.replace('muara s. palu', 'muara sungai palu'))) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
    }

    // ==========================================
    // RENDER GRAFIK (CHART.JS)
    // ==========================================
    initCharts() {
        new Chart(document.getElementById('mainChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep'],
                datasets: [{
                    label: 'Pohon Sehat Terakumulasi',
                    data: [1200, 1500, 1850, 2300, 2750, 2900, 3100, 3350, 3530],
                    borderColor: '#10b981', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    fill: true, tension: 0.4, borderWidth: 3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        new Chart(document.getElementById('barChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Pantai Talise', 'Pantai Donggala', 'Muara S. Palu', 'Ps. Mamboro'],
                datasets: [
                    { label: 'Tumbuh (Sehat)', data: [2180, 1350, 0, 0], backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Terancam (Kritis)', data: [0, 0, 850, 920], backgroundColor: '#fbbf24', borderRadius: 4 },
                    { label: 'Mati (Rusak)', data: [0, 0, 400, 520], backgroundColor: '#ef4444', borderRadius: 4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        new Chart(document.getElementById('doughnutChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Tumbuh', 'Terancam', 'Mati'],
                datasets: [{ 
                    data: [3530, 1770, 920], 
                    backgroundColor: ['#10b981', '#fbbf24', '#ef4444'], 
                    borderWidth: 0, 
                    cutout: '70%' 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // ==========================================
    // RENDER PETA (LEAFLET.JS)
    // ==========================================
    initMap() {
        this.map = L.map('map').setView([-0.7800, 119.8000], 11);
        
        // Basemap OpenStreetMap & Esri Satellite
        const osmMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        });

        L.control.layers({
            "🗺️ Peta Jalan": osmMap,
            "🛰️ Citra Satelit": esriSat
        }).addTo(this.map);

        // Data 4 Zona dengan Titik Koordinat Presisi
        const zonesData = [
            { 
                key: "talise",
                name: "Pantai Talise", status: "Sehat", color: "#10b981", 
                points: [
                    [-0.88435466, 119.8678142], [-0.884265835, 119.8681214], [-0.883743988, 119.8688876],
                    [-0.883403492, 119.8693762], [-0.883055594, 119.8695983], [-0.882844635, 119.8696131],
                    [-0.882770215, 119.8696529], [-0.882720114, 119.8698199], [-0.882400427, 119.8699106],
                    [-0.882228655, 119.8699917], [-0.881588087, 119.8703508], [-0.881387686, 119.8703842],
                    [-0.881008356, 119.8704272], [-0.880791255, 119.8705226], [-0.879815896, 119.8708847],
                    [-0.879888973, 119.8709243], [-0.879535769, 119.8710674], [-0.879276956, 119.8715242],
                    [-0.878929842, 119.8714724], [-0.87840917, 119.8712562], [-0.877120389, 119.8718153],
                    [-0.876069687, 119.8719187], [-0.874329999, 119.8719818], [-0.873422834, 119.871999],
                    [-0.870219049, 119.8721828], [-0.870242015, 119.8706669], [-0.88435466, 119.8678142]
                ] 
            },
            { 
                key: "donggala",
                name: "Pantai Donggala (Tanjung Karang)", status: "Sehat", color: "#10b981", 
                points: [
                    [-0.688386095, 119.760496], [-0.688846088, 119.7600439], [-0.689242633, 119.7598932],
                    [-0.690019863, 119.7596869], [-0.691225362, 119.7590762], [-0.69155846, 119.7587827],
                    [-0.692137416, 119.7580848], [-0.692914645, 119.7578072], [-0.693025678, 119.7575058],
                    [-0.694040834, 119.7575216], [-0.695024266, 119.7575296], [-0.695111506, 119.7573154],
                    [-0.695833219, 119.7572996], [-0.696221833, 119.7571013], [-0.697966631, 119.7563636],
                    [-0.698934201, 119.7563399], [-0.699616258, 119.756435], [-0.69998901, 119.7568792],
                    [-0.700131766, 119.7574503], [-0.700409348, 119.7575296], [-0.700623482, 119.7577199],
                    [-0.700988303, 119.7575375], [-0.70140864, 119.7571727], [-0.701924148, 119.7568316],
                    [-0.702288969, 119.756673], [-0.702669652, 119.7567206], [-0.70309792, 119.7571171],
                    [-0.704580997, 119.7589652], [-0.70487444, 119.7594966], [-0.705310639, 119.7604087],
                    [-0.705366155, 119.7610036], [-0.705707183, 119.7613446], [-0.705929248, 119.761765],
                    [-0.706143382, 119.7622964], [-0.705976833, 119.7628913], [-0.706333723, 119.7635178],
                    [-0.706706474, 119.7636685], [-0.706944401, 119.7640889], [-0.706928539, 119.764652],
                    [-0.706333723, 119.7652231], [-0.705334431, 119.7658497], [-0.704525481, 119.7658973],
                    [-0.703851355, 119.7664842], [-0.702542758, 119.7663018], [-0.702217591, 119.7663177],
                    [-0.702273108, 119.766976], [-0.701868632, 119.7667856], [-0.702051043, 119.7659052],
                    [-0.702812408, 119.7657069], [-0.703795839, 119.7657149], [-0.704327208, 119.7656831],
                    [-0.705025127, 119.765469], [-0.705516842, 119.7651517], [-0.705619943, 119.7640731],
                    [-0.705445464, 119.7629071], [-0.704858578, 119.7624312], [-0.703692737, 119.7613208],
                    [-0.703851355, 119.760377], [-0.703668945, 119.7598535], [-0.703193091, 119.7594569],
                    [-0.702154144, 119.7591555], [-0.702257246, 119.7579658], [-0.70185277, 119.7578072],
                    [-0.701107266, 119.7586479], [-0.700615551, 119.75864], [-0.699941425, 119.7585686],
                    [-0.699465571, 119.75818], [-0.698260074, 119.7575772], [-0.697506639, 119.757831],
                    [-0.697173541, 119.7575692], [-0.696491484, 119.7576961], [-0.695944251, 119.7577041],
                    [-0.695135299, 119.7579499], [-0.694802201, 119.7578706], [-0.694017041, 119.757712],
                    [-0.693366707, 119.7581086], [-0.691843973, 119.7595521], [-0.691613976, 119.7597504],
                    [-0.690749507, 119.7600676], [-0.690614681, 119.7600518], [-0.68999607, 119.7602104],
                    [-0.689139532, 119.7604563], [-0.688465404, 119.7607736], [-0.688386095, 119.760496]
                ] 
            },
            { 
                key: "muara",
                name: "Muara Sungai Palu", status: "Rusak", color: "#ef4444", 
                points: [
                    [-0.884228259, 119.855111787], [-0.88481081, 119.86167206], [-0.88514761, 119.86162209],
                    [-0.88507266, 119.86022617], [-0.88539188, 119.85989488], [-0.88613671, 119.85969038],
                    [-0.88616632, 119.85804414], [-0.88493387, 119.85770731], [-0.88447957, 119.85514218]
                ] 
            },
            { 
                key: "mamboro",
                name: "Pesisir Mamboro", status: "Rusak", color: "#ef4444", 
                points: [
                    [-0.792326963, 119.8662772], [-0.793221994, 119.8666855], [-0.794776521, 119.8678476],
                    [-0.795828575, 119.8692139], [-0.797351696, 119.8704388], [-0.798812009, 119.8742705],
                    [-0.79992687, 119.8751499], [-0.800916113, 119.8756053], [-0.800806197, 119.8760607],
                    [-0.801418586, 119.8763905], [-0.802313615, 119.8772385], [-0.803067324, 119.877317],
                    [-0.805092915, 119.8765475], [-0.805501173, 119.8765004], [-0.805454067, 119.8749614],
                    [-0.793080673, 119.864754], [-0.792326963, 119.8662772]
                ] 
            }
        ];

        zonesData.forEach(zone => {
            const polygon = L.polygon(zone.points, { 
                color: zone.color, 
                fillColor: zone.color, 
                fillOpacity: 0.5, 
                weight: 2 
            }).addTo(this.map);

            polygon.bindPopup(`
                <div class="text-center font-sans">
                    <h5 class="font-bold text-gray-800 m-0">${zone.name}</h5>
                    <p class="text-xs mt-1 mb-0">Status: <span class="font-bold uppercase" style="color:${zone.color}">${zone.status}</span></p>
                </div>
            `);

            // Simpan layer poligon berdasarkan key untuk fitur zoom interaktif
            this.polygonLayers[zone.key] = polygon;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new SimanisApp();
});