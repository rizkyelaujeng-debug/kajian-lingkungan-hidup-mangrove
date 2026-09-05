class SimanisApp {
    constructor() {
        // 1. Tangkap elemen UI Login & Container Utama
        this.loginScreen = document.getElementById('loginScreen');
        this.appContainer = document.getElementById('appContainer');
        this.loginBtnSubmit = document.getElementById('loginBtnSubmit');
        this.loginError = document.getElementById('loginError');

        // 2. State untuk Peta dan Grafik agar tidak dirender berulang
        this.map = null;
        this.chartsLoaded = false;

        // 3. Jalankan fungsi inisialisasi
        this.initEvents();
        this.checkSession();
    }

    // ==========================================
    // LOGIKA LOGIN & SESSION
    // ==========================================
    checkSession() {
        // Cek apakah user sudah login sebelumnya
        if (sessionStorage.getItem('isSimanisLoggedIn') === 'true') {
            this.showApp();
        }
    }

    handleLogin() {
        const user = document.getElementById('loginUsername').value;
        const pass = document.getElementById('loginPassword').value;

        // Validasi Hardcode (admin / 1234)
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
            
            // Bersihkan form input
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        }
    }

    showApp() {
        this.loginScreen.style.display = 'none';
        this.appContainer.style.display = 'block';
        
        // Lazy Load: Render grafik hanya saat sistem berhasil masuk pertama kali
        if (!this.chartsLoaded) {
            this.initCharts();
            this.chartsLoaded = true;
        }
    }

    // ==========================================
    // LOGIKA NAVIGASI TAB
    // ==========================================
    switchTab(tabId) {
        // Sembunyikan semua tab content
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('block');
        });
        
        // Tampilkan tab yang dituju
        const activeTab = document.getElementById('tab-' + tabId);
        if(activeTab) {
            activeTab.classList.remove('hidden');
            activeTab.classList.add('block');
        }
        
        // Reset styling tombol navigasi
        document.querySelectorAll('.nav-link').forEach(el => {
            el.classList.remove('active', 'bg-emerald-50', 'text-emerald-600', 'font-semibold');
        });
        
        // Beri styling pada tombol navigasi yang sedang aktif
        const activeBtn = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-emerald-50', 'text-emerald-600', 'font-semibold');
        }

        // PENTING: Fix Bug Peta Leaflet agar merender ulang ukurannya saat tab dibuka
        if (tabId === 'peta') {
            if (!this.map) {
                this.initMap();
            } else {
                setTimeout(() => { this.map.invalidateSize(); }, 300);
            }
        }
    }

    // ==========================================
    // EVENT LISTENER MANAJER
    // ==========================================
    initEvents() {
        // --- Event Login & Logout ---
        if(this.loginBtnSubmit) this.loginBtnSubmit.addEventListener('click', () => this.handleLogin());
        
        const loginPass = document.getElementById('loginPassword');
        if(loginPass) {
            loginPass.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        const btnLogout = document.getElementById('btnLogout');
        if(btnLogout) btnLogout.addEventListener('click', () => this.handleLogout());

        // --- Event Tab Navigasi ---
        document.querySelectorAll('.nav-link').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // --- Fitur Pengaturan: Dark Mode Toggle Animasi Slide ---
        const darkModeToggle = document.getElementById('toggleDarkMode');
        if(darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                // Tambahkan atau hapus class 'dark-mode' pada tag <body>
                if(e.target.checked) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            });
        }

        // --- Tombol-tombol Fungsional UI (Dummy Peringatan) ---
        const btnTambahData = document.getElementById('btnTambahData');
        if(btnTambahData) btnTambahData.addEventListener('click', () => alert("Membuka modal Form Tambah Data Bibit Baru..."));

        const btnExportPDF = document.getElementById('btnExportPDF');
        if(btnExportPDF) btnExportPDF.addEventListener('click', () => alert("Mengekspor laporan ke format PDF. Mohon tunggu..."));

        const btnReset = document.getElementById('btnReset');
        if(btnReset) btnReset.addEventListener('click', () => confirm("Yakin ingin mengatur ulang semua parameter ke nilai bawaan pabrik?"));

        const btnSimpan = document.getElementById('btnSimpanPengaturan');
        if(btnSimpan) btnSimpan.addEventListener('click', () => alert("Pengaturan berhasil disimpan ke dalam sistem!"));

        // --- Interaksi Kamera Peta (Fitur FlyTo Leaflet) ---
        const btnZoomTalise = document.getElementById('btnZoomTalise');
        if(btnZoomTalise) btnZoomTalise.addEventListener('click', () => {
            if(this.map) this.map.flyTo([-0.880, 119.878], 15, { duration: 1.5 });
        });

        const btnZoomDonggala = document.getElementById('btnZoomDonggala');
        if(btnZoomDonggala) btnZoomDonggala.addEventListener('click', () => {
            if(this.map) this.map.flyTo([-0.680, 119.740], 14, { duration: 1.5 });
        });

        const btnZoomMuara = document.getElementById('btnZoomMuara');
        if(btnZoomMuara) btnZoomMuara.addEventListener('click', () => {
            if(this.map) this.map.flyTo([-0.893, 119.863], 15, { duration: 1.5 });
        });

        const btnZoomMamboro = document.getElementById('btnZoomMamboro');
        if(btnZoomMamboro) btnZoomMamboro.addEventListener('click', () => {
            if(this.map) this.map.flyTo([-0.810, 119.863], 15, { duration: 1.5 });
        });

        // --- FITUR FILTER TABEL BERDASARKAN ZONA ---
        const filterButtons = document.querySelectorAll('#tab-data button.rounded-full');
        const tableRows = document.querySelectorAll('#tab-data tbody tr');

        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 1. Ubah styling tombol aktif & non-aktif
                filterButtons.forEach(b => {
                    b.classList.remove('bg-emerald-600', 'text-white');
                    b.classList.add('bg-gray-50', 'text-gray-500', 'border', 'border-gray-200');
                });
                e.target.classList.remove('bg-gray-50', 'text-gray-500', 'border', 'border-gray-200');
                e.target.classList.add('bg-emerald-600', 'text-white');

                // 2. Ambil teks zona yang diklik
                const selectedZone = e.target.textContent.trim().toLowerCase();

                // 3. Filter baris tabel
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
        // 1. Line Chart (Tren Pertumbuhan Tumbuh/Sehat) di Dashboard
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

        // 2. Bar Chart (Perbandingan Kondisi per Zona Tersinkronisasi) di Laporan
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

        // 3. Doughnut Chart (Distribusi Keseluruhan 6.220 Bibit) di Laporan
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
        // Set pandangan awal mencakup wilayah Teluk Palu hingga Pantai Donggala
        this.map = L.map('map').setView([-0.7800, 119.8000], 11);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // Titik Koordinat Pesisir Tersinkronisasi
        const zonesData = [
            { 
                name: "Pantai Talise", status: "Sehat", color: "#10b981", 
                points: [[-0.875, 119.880], [-0.880, 119.878], [-0.888, 119.876], [-0.890, 119.879], [-0.880, 119.883]] 
            },
            { 
                name: "Pantai Donggala (Tanjung Karang)", status: "Sehat", color: "#10b981", 
                points: [[-0.665, 119.740], [-0.675, 119.745], [-0.680, 119.740], [-0.670, 119.735]] 
            },
            { 
                name: "Muara Sungai Palu", status: "Rusak", color: "#ef4444", 
                points: [[-0.890, 119.860], [-0.893, 119.865], [-0.898, 119.862], [-0.895, 119.858]] 
            },
            { 
                name: "Pesisir Mamboro", status: "Rusak", color: "#ef4444", 
                points: [[-0.795, 119.864], [-0.805, 119.862], [-0.815, 119.860], [-0.815, 119.864], [-0.800, 119.868]] 
            }
        ];

        // Looping untuk menggambar polygon zona di atas peta
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
        });
    }
}

// Inisialisasi program saat struktur HTML selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    const app = new SimanisApp();
});