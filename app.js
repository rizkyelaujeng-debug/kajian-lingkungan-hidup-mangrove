class SimanisApp {
    constructor() {
        // 1. Tangkap Elemen UI Utama
        this.loginScreen = document.getElementById('loginScreen');
        this.appContainer = document.getElementById('appContainer');
        this.loginBtnSubmit = document.getElementById('loginBtnSubmit');
        this.loginError = document.getElementById('loginError');

        // Elemen Modal Tambah Data
        this.modalTambahBibit = document.getElementById('modalTambahBibit');
        this.modalTambahBibitContent = document.getElementById('modalTambahBibitContent');
        this.formTambahBibit = document.getElementById('formTambahBibit');

        // 2. State Instance Aplikasi
        this.map = null;
        this.polygonLayers = {};
        this.charts = {};
        this.chartsLoaded = false;
        this.activeZoneFilter = 'Semua Zona';
        this.searchQuery = '';

        // 3. MASTER DATA BIBIT DINAMIS
        this.bibitData = [
            { id: "BB-001", spesies: "Rhizophora mucronata", zona: "Pantai Talise", jumlah: 1200, tglTanam: "2026-01-12", usia: "7 bln", tinggi: "45 cm", status: "Tumbuh" },
            { id: "BB-002", spesies: "Avicennia marina", zona: "Pantai Talise", jumlah: 980, tglTanam: "2026-01-15", usia: "7 bln", tinggi: "38 cm", status: "Tumbuh" },
            { id: "BB-003", spesies: "Sonneratia alba", zona: "Pantai Donggala", jumlah: 750, tglTanam: "2026-02-03", usia: "6 bln", tinggi: "30 cm", status: "Tumbuh" },
            { id: "BB-004", spesies: "Bruguiera gymnorrhiza", zona: "Pantai Donggala", jumlah: 600, tglTanam: "2026-02-10", usia: "6 bln", tinggi: "28 cm", status: "Tumbuh" },
            { id: "BB-005", spesies: "Rhizophora apiculata", zona: "Muara Sungai Palu", jumlah: 850, tglTanam: "2026-03-20", usia: "5 bln", tinggi: "22 cm", status: "Terancam" },
            { id: "BB-006", spesies: "Avicennia officinalis", zona: "Muara Sungai Palu", jumlah: 400, tglTanam: "2026-03-25", usia: "5 bln", tinggi: "18 cm", status: "Mati" },
            { id: "BB-007", spesies: "Rhizophora mucronata", zona: "Pesisir Mamboro", jumlah: 920, tglTanam: "2026-04-05", usia: "4 bln", tinggi: "15 cm", status: "Terancam" },
            { id: "BB-008", spesies: "Ceriops tagal", zona: "Pesisir Mamboro", jumlah: 520, tglTanam: "2026-04-12", usia: "4 bln", tinggi: "12 cm", status: "Mati" }
        ];

        // 4. Inisialisasi
        this.initEvents();
        this.checkSession();
    }

    // ==========================================
    // LOGIKA SESI & LOGIN
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
            this.showToast("Berhasil login sebagai Admin Dinas Kota Palu", "success");
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
            this.showToast("Anda telah keluar dari sistem.", "info");
        }
    }

    showApp() {
        this.loginScreen.style.display = 'none';
        this.appContainer.style.display = 'block';
        
        if (!this.chartsLoaded) {
            this.initCharts();
            this.chartsLoaded = true;
        }
        
        this.syncAllViews();
    }

    // ==========================================
    // NAVIGASI TAB
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
    // KALKULASI & REKAPITULASI DATA DINAMIS
    // ==========================================
    getStats() {
        let totalBibit = 0;
        let tumbuh = 0;
        let terancam = 0;
        let mati = 0;

        const zoneStats = {
            "Pantai Talise": { total: 0, tumbuh: 0, terancam: 0, mati: 0 },
            "Pantai Donggala": { total: 0, tumbuh: 0, terancam: 0, mati: 0 },
            "Muara Sungai Palu": { total: 0, tumbuh: 0, terancam: 0, mati: 0 },
            "Pesisir Mamboro": { total: 0, tumbuh: 0, terancam: 0, mati: 0 }
        };

        this.bibitData.forEach(item => {
            totalBibit += item.jumlah;
            if (item.status === "Tumbuh") tumbuh += item.jumlah;
            else if (item.status === "Terancam") terancam += item.jumlah;
            else if (item.status === "Mati") mati += item.jumlah;

            if (zoneStats[item.zona]) {
                zoneStats[item.zona].total += item.jumlah;
                if (item.status === "Tumbuh") zoneStats[item.zona].tumbuh += item.jumlah;
                else if (item.status === "Terancam") zoneStats[item.zona].terancam += item.jumlah;
                else if (item.status === "Mati") zoneStats[item.zona].mati += item.jumlah;
            }
        });

        const survivalRate = totalBibit > 0 ? Math.round((tumbuh / totalBibit) * 100) : 0;

        let totalZonaSehat = 0;
        let totalZonaRusak = 0;
        const rusakZoneNames = [];

        Object.keys(zoneStats).forEach(zName => {
            const z = zoneStats[zName];
            const zRate = z.total > 0 ? Math.round((z.tumbuh / z.total) * 100) : 0;
            if (zRate >= 50) {
                totalZonaSehat++;
            } else {
                totalZonaRusak++;
                rusakZoneNames.push(zName.replace('Muara Sungai Palu', 'Muara Palu'));
            }
        });

        return {
            totalBibit,
            totalEntri: this.bibitData.length,
            tumbuh,
            terancam,
            mati,
            survivalRate,
            totalZonaSehat,
            totalZonaRusak,
            rusakZoneNames,
            zoneStats
        };
    }

    // SINKRONISASI UNIVERSAL SELURUH UI
    syncAllViews() {
        const stats = this.getStats();

        // 1. Update Dashboard Indicators
        const dashTotalBibit = document.getElementById('dashTotalBibit');
        if(dashTotalBibit) dashTotalBibit.textContent = `${stats.totalBibit.toLocaleString('id-ID')} Pohon`;

        const dashTotalEntri = document.getElementById('dashTotalEntri');
        if(dashTotalEntri) dashTotalEntri.textContent = `Tersinkronisasi dari ${stats.totalEntri} entri`;

        const dashSurvivalRate = document.getElementById('dashSurvivalRate');
        if(dashSurvivalRate) dashSurvivalRate.textContent = `${stats.survivalRate}%`;

        const dashStatusSurvival = document.getElementById('dashStatusSurvival');
        if(dashStatusSurvival) dashStatusSurvival.textContent = `Status: ${stats.survivalRate >= 70 ? 'Sangat Baik' : stats.survivalRate >= 50 ? 'Sedang' : 'Perlu Peningkatan'}`;

        const dashZonaKritis = document.getElementById('dashZonaKritis');
        if(dashZonaKritis) dashZonaKritis.textContent = `${stats.totalZonaRusak} Zona`;

        const dashZonaKritisKet = document.getElementById('dashZonaKritisKet');
        if(dashZonaKritisKet) dashZonaKritisKet.textContent = stats.rusakZoneNames.length > 0 ? stats.rusakZoneNames.join(' & ') : 'Tidak ada zona kritis';

        this.renderSideProgress(stats.zoneStats);
        this.renderDashLogs();

        // 2. Update Tab Data Bibit KPI
        const kpiTotalEntri = document.getElementById('kpiTotalEntri');
        if(kpiTotalEntri) kpiTotalEntri.textContent = stats.totalEntri;

        const kpiTotalBibit = document.getElementById('kpiTotalBibit');
        if(kpiTotalBibit) kpiTotalBibit.textContent = stats.totalBibit.toLocaleString('id-ID');

        const kpiTumbuh = document.getElementById('kpiTumbuh');
        if(kpiTumbuh) kpiTumbuh.textContent = stats.tumbuh.toLocaleString('id-ID');

        const kpiTerancamMati = document.getElementById('kpiTerancamMati');
        if(kpiTerancamMati) kpiTerancamMati.textContent = (stats.terancam + stats.mati).toLocaleString('id-ID');

        this.renderMainTable();

        // 3. Update Tab Laporan Indicators
        const lapTotalBibit = document.getElementById('lapTotalBibit');
        if(lapTotalBibit) lapTotalBibit.textContent = stats.totalBibit.toLocaleString('id-ID');

        const lapSurvivalRate = document.getElementById('lapSurvivalRate');
        if(lapSurvivalRate) lapSurvivalRate.textContent = `${stats.survivalRate}%`;

        const lapZonaSehat = document.getElementById('lapZonaSehat');
        if(lapZonaSehat) lapZonaSehat.textContent = stats.totalZonaSehat;

        const lapZonaRusak = document.getElementById('lapZonaRusak');
        if(lapZonaRusak) lapZonaRusak.textContent = stats.totalZonaRusak;

        const lapDoughnutTotal = document.getElementById('lapDoughnutTotal');
        if(lapDoughnutTotal) lapDoughnutTotal.textContent = stats.totalBibit.toLocaleString('id-ID');

        // 4. Update Cards di Tab Peta
        this.renderPetaCards(stats.zoneStats);

        // 5. Update Charts
        if (this.chartsLoaded) {
            this.updateCharts(stats);
        }
    }

    // ==========================================
    // RENDER SISI KANAN DASHBOARD (SURVIVAL RATE)
    // ==========================================
    renderSideProgress(zoneStats) {
        const container = document.getElementById('dashSideProgressContainer');
        if(!container) return;

        container.innerHTML = '';

        Object.keys(zoneStats).forEach(zName => {
            const z = zoneStats[zName];
            const rate = z.total > 0 ? Math.round((z.tumbuh / z.total) * 100) : 0;
            const isHealthy = rate >= 50;

            const div = document.createElement('div');
            div.innerHTML = `
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-bold text-gray-800">${zName}</span>
                    <span class="${isHealthy ? 'text-emerald-700' : 'text-red-500'} font-bold text-[10px]">${rate}% Sehat ${!isHealthy ? '(Rusak)' : ''}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 mt-1">
                    <div class="${isHealthy ? 'bg-emerald-500' : 'bg-red-500'} h-2 rounded-full transition-all duration-500" style="width: ${rate}%"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // RENDER LOG UNTUK DASHBOARD
    renderDashLogs() {
        const tbody = document.getElementById('dashLogTableBody');
        if(!tbody) return;

        tbody.innerHTML = '';
        const recentItems = [...this.bibitData].slice(-5).reverse();

        recentItems.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50/50";
            
            let badgeClass = "bg-emerald-100 text-emerald-700";
            if (item.status === "Terancam") badgeClass = "bg-yellow-100 text-yellow-700";
            if (item.status === "Mati") badgeClass = "bg-red-100 text-red-700";

            tr.innerHTML = `
                <td class="px-6 py-4"><span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">LOG-2026-0${95 - index}</span></td>
                <td class="px-6 py-4 font-semibold text-gray-800"><span class="w-2 h-2 inline-block ${item.status === 'Tumbuh' ? 'bg-emerald-500' : 'bg-red-500'} rounded-full mr-2"></span>${item.zona}</td>
                <td class="px-6 py-4 text-gray-500">${this.formatDate(item.tglTanam)}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 ${badgeClass} rounded-full text-xs font-bold">● ${item.status} (+${item.jumlah})</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // RENDER TABEL DATA BIBIT MAIN
    // ==========================================
    renderMainTable() {
        const tbody = document.getElementById('mainDataTableBody');
        if(!tbody) return;

        tbody.innerHTML = '';

        const filtered = this.bibitData.filter(item => {
            const matchZone = (this.activeZoneFilter === 'Semua Zona') || 
                              (item.zona.toLowerCase() === this.activeZoneFilter.toLowerCase()) ||
                              (this.activeZoneFilter === 'Muara Sungai Palu' && item.zona.includes('Muara'));
            
            const matchSearch = item.spesies.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                                item.id.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                                item.zona.toLowerCase().includes(this.searchQuery.toLowerCase());

            return matchZone && matchSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-400 text-sm">Tidak ada data bibit yang sesuai filter.</td></tr>`;
            return;
        }

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50/50 transition-colors";

            let badgeClass = "bg-emerald-100 text-emerald-700";
            if (item.status === "Terancam") badgeClass = "bg-yellow-100 text-yellow-700";
            if (item.status === "Mati") badgeClass = "bg-red-100 text-red-700";

            tr.innerHTML = `
                <td class="px-6 py-4"><span class="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-mono">${item.id}</span></td>
                <td class="px-6 py-4 font-bold text-gray-800 italic">${item.spesies}</td>
                <td class="px-6 py-4 text-gray-600">${item.zona}</td>
                <td class="px-6 py-4 font-bold text-gray-800">${item.jumlah.toLocaleString('id-ID')}</td>
                <td class="px-6 py-4 text-gray-500">${this.formatDate(item.tglTanam)}</td>
                <td class="px-6 py-4 text-gray-500">${item.usia}</td>
                <td class="px-6 py-4 text-gray-500">${item.tinggi}</td>
                <td class="px-6 py-4"><span class="px-3 py-1 ${badgeClass} rounded-full text-[11px] font-bold">● ${item.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // RENDER KARTU INFORMASI PETA ZONA
    // ==========================================
    renderPetaCards(zoneStats) {
        const container = document.getElementById('petaCardsContainer');
        if(!container) return;

        container.innerHTML = '';

        const zoneKeyMap = {
            "Pantai Talise": "talise",
            "Pantai Donggala": "donggala",
            "Muara Sungai Palu": "muara",
            "Pesisir Mamboro": "mamboro"
        };

        Object.keys(zoneStats).forEach(zName => {
            const z = zoneStats[zName];
            const rate = z.total > 0 ? Math.round((z.tumbuh / z.total) * 100) : 0;
            const isHealthy = rate >= 50;
            const key = zoneKeyMap[zName];

            const card = document.createElement('div');
            card.className = `bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-${isHealthy ? 'emerald' : 'red'}-500 transition-all`;
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-bold text-gray-900">${zName}</h4>
                        <p class="text-xs text-gray-500 mt-0.5">${z.total.toLocaleString('id-ID')} pohon terpantau</p>
                    </div>
                    <span class="px-2 py-1 ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} text-xs font-bold rounded-md">${isHealthy ? 'Sehat' : 'Rusak'}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 mt-3">
                    <div class="${isHealthy ? 'bg-emerald-500' : 'bg-red-500'} h-2 rounded-full" style="width: ${rate}%"></div>
                </div>
            `;

            card.addEventListener('click', () => {
                if (key) this.focusToZone(key);
            });

            container.appendChild(card);
        });
    }

    // ==========================================
    // LOGIKA MODAL TAMBAH BIBIT BARU
    // ==========================================
    openModalTambahBibit() {
        if (!this.modalTambahBibit) return;
        this.formTambahBibit.reset();
        
        // Set default tanggal hari ini
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('inputTglTanam').value = today;

        this.modalTambahBibit.classList.remove('hidden');
        setTimeout(() => {
            this.modalTambahBibit.classList.remove('opacity-0');
            this.modalTambahBibitContent.classList.remove('scale-95');
        }, 10);
    }

    closeModalTambahBibit() {
        if (!this.modalTambahBibit) return;
        this.modalTambahBibit.classList.add('opacity-0');
        this.modalTambahBibitContent.classList.add('scale-95');
        setTimeout(() => {
            this.modalTambahBibit.classList.add('hidden');
        }, 300);
    }

    handleTambahBibitSubmit(e) {
        e.preventDefault();

        const zona = document.getElementById('inputZona').value;
        const spesies = document.getElementById('inputSpesies').value;
        const jumlah = parseInt(document.getElementById('inputJumlah').value);
        const tglTanam = document.getElementById('inputTglTanam').value;
        const usia = document.getElementById('inputUsia').value || "1 bln";
        const tinggi = document.getElementById('inputTinggi').value || "15 cm";
        const status = "Tumbuh"; // Terkunci otomatis ke Tumbuh (Sehat) untuk bibit baru

        if (!zona || !spesies || isNaN(jumlah) || jumlah <= 0) {
            this.showToast("Mohon lengkapi seluruh field dengan benar!", "error");
            return;
        }

        // Buat ID Baru
        const newIdNumber = this.bibitData.length + 1;
        const newId = `BB-0${newIdNumber < 10 ? '0' + newIdNumber : newIdNumber}`;

        const newEntry = {
            id: newId,
            spesies,
            zona,
            jumlah,
            tglTanam,
            usia,
            tinggi,
            status
        };

        this.bibitData.push(newEntry);
        this.syncAllViews();
        this.closeModalTambahBibit();
        this.showToast(`Berhasil menambahkan ${jumlah.toLocaleString('id-ID')} bibit ${spesies} di ${zona}!`, "success");
    }

    // ==========================================
    // HELPER TOAST NOTIFICATION
    // ==========================================
    showToast(message, type = "info") {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        let bgClass = "bg-gray-800 text-white";
        if (type === "success") bgClass = "bg-emerald-600 text-white";
        if (type === "error") bgClass = "bg-red-600 text-white";

        toast.className = `${bgClass} px-4 py-3 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-4 opacity-0`;
        toast.innerHTML = `
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        }, 10);

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ==========================================
    // RENDER & UPDATE GRAFIK (CHART.JS)
    // ==========================================
    initCharts() {
        const stats = this.getStats();

        // 1. Line Chart Tren
        this.charts.mainChart = new Chart(document.getElementById('mainChart').getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep'],
                datasets: [{
                    label: 'Pohon Sehat Terakumulasi',
                    data: [1200, 1500, 1850, 2300, 2750, 2900, 3100, 3350, stats.tumbuh],
                    borderColor: '#10b981', 
                    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                    fill: true, tension: 0.4, borderWidth: 3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });

        // 2. Bar Chart Kondisi Per Zona
        this.charts.barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Pantai Talise', 'Pantai Donggala', 'Muara S. Palu', 'Ps. Mamboro'],
                datasets: [
                    { label: 'Tumbuh (Sehat)', data: [stats.zoneStats["Pantai Talise"].tumbuh, stats.zoneStats["Pantai Donggala"].tumbuh, stats.zoneStats["Muara Sungai Palu"].tumbuh, stats.zoneStats["Pesisir Mamboro"].tumbuh], backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Terancam (Kritis)', data: [stats.zoneStats["Pantai Talise"].terancam, stats.zoneStats["Pantai Donggala"].terancam, stats.zoneStats["Muara Sungai Palu"].terancam, stats.zoneStats["Pesisir Mamboro"].terancam], backgroundColor: '#fbbf24', borderRadius: 4 },
                    { label: 'Mati (Rusak)', data: [stats.zoneStats["Pantai Talise"].mati, stats.zoneStats["Pantai Donggala"].mati, stats.zoneStats["Muara Sungai Palu"].mati, stats.zoneStats["Pesisir Mamboro"].mati], backgroundColor: '#ef4444', borderRadius: 4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // 3. Doughnut Chart Distribusi Total
        this.charts.doughnutChart = new Chart(document.getElementById('doughnutChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Tumbuh', 'Terancam', 'Mati'],
                datasets: [{ 
                    data: [stats.tumbuh, stats.terancam, stats.mati], 
                    backgroundColor: ['#10b981', '#fbbf24', '#ef4444'], 
                    borderWidth: 0, 
                    cutout: '70%' 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    updateCharts(stats) {
        // Update Line Chart
        if (this.charts.mainChart) {
            this.charts.mainChart.data.datasets[0].data[8] = stats.tumbuh;
            this.charts.mainChart.update();
        }

        // Update Bar Chart
        if (this.charts.barChart) {
            this.charts.barChart.data.datasets[0].data = [
                stats.zoneStats["Pantai Talise"].tumbuh,
                stats.zoneStats["Pantai Donggala"].tumbuh,
                stats.zoneStats["Muara Sungai Palu"].tumbuh,
                stats.zoneStats["Pesisir Mamboro"].tumbuh
            ];
            this.charts.barChart.data.datasets[1].data = [
                stats.zoneStats["Pantai Talise"].terancam,
                stats.zoneStats["Pantai Donggala"].terancam,
                stats.zoneStats["Muara Sungai Palu"].terancam,
                stats.zoneStats["Pesisir Mamboro"].terancam
            ];
            this.charts.barChart.data.datasets[2].data = [
                stats.zoneStats["Pantai Talise"].mati,
                stats.zoneStats["Pantai Donggala"].mati,
                stats.zoneStats["Muara Sungai Palu"].mati,
                stats.zoneStats["Pesisir Mamboro"].mati
            ];
            this.charts.barChart.update();
        }

        // Update Doughnut Chart
        if (this.charts.doughnutChart) {
            this.charts.doughnutChart.data.datasets[0].data = [stats.tumbuh, stats.terancam, stats.mati];
            this.charts.doughnutChart.update();
        }
    }

    // ==========================================
    // RENDER PETA (LEAFLET.JS)
    // ==========================================
    initMap() {
        this.map = L.map('map').setView([-0.7800, 119.8000], 11);
        
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

        const zonesData = [
            { 
                key: "talise", name: "Pantai Talise", status: "Sehat", color: "#10b981", 
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
                key: "donggala", name: "Pantai Donggala (Tanjung Karang)", status: "Sehat", color: "#10b981", 
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
                key: "muara", name: "Muara Sungai Palu", status: "Rusak", color: "#ef4444", 
                points: [
                    [-0.884228259, 119.855111787], [-0.88481081, 119.86167206], [-0.88514761, 119.86162209],
                    [-0.88507266, 119.86022617], [-0.88539188, 119.85989488], [-0.88613671, 119.85969038],
                    [-0.88616632, 119.85804414], [-0.88493387, 119.85770731], [-0.88447957, 119.85514218]
                ] 
            },
            { 
                key: "mamboro", name: "Pesisir Mamboro", status: "Rusak", color: "#ef4444", 
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

            this.polygonLayers[zone.key] = polygon;
        });
    }

    focusToZone(zoneKey) {
        if (!this.map || !this.polygonLayers[zoneKey]) return;

        const layer = this.polygonLayers[zoneKey];
        const bounds = layer.getBounds();

        this.map.flyToBounds(bounds, {
            padding: [50, 50],
            duration: 1.8,
            easeLinearity: 0.25
        });

        setTimeout(() => {
            layer.openPopup();
        }, 1900);
    }

    // ==========================================
    // EVENT LISTENERS MANAJER
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

        // Toggle Dark Mode
        const darkModeToggle = document.getElementById('toggleDarkMode');
        if(darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                if(e.target.checked) {
                    document.body.classList.add('dark-mode');
                    this.showToast("Mode Gelap diaktifkan", "info");
                } else {
                    document.body.classList.remove('dark-mode');
                    this.showToast("Mode Terang diaktifkan", "info");
                }
            });
        }

        // Tombol Tambah Data & Modal Events
        const btnTambahData = document.getElementById('btnTambahData');
        if(btnTambahData) btnTambahData.addEventListener('click', () => this.openModalTambahBibit());

        const btnCloseModalBibit = document.getElementById('btnCloseModalBibit');
        if(btnCloseModalBibit) btnCloseModalBibit.addEventListener('click', () => this.closeModalTambahBibit());

        const btnBatalTambahBibit = document.getElementById('btnBatalTambahBibit');
        if(btnBatalTambahBibit) btnBatalTambahBibit.addEventListener('click', () => this.closeModalTambahBibit());

        if(this.formTambahBibit) this.formTambahBibit.addEventListener('submit', (e) => this.handleTambahBibitSubmit(e));

        // Navigation Link Shortcut dari Dashboard
        const btnLihatSemuaLog = document.getElementById('btnLihatSemuaLog');
        if(btnLihatSemuaLog) btnLihatSemuaLog.addEventListener('click', () => this.switchTab('data'));

        // Action Buttons
        const btnExportPDF = document.getElementById('btnExportPDF');
        if(btnExportPDF) btnExportPDF.addEventListener('click', () => this.showToast("Mengekspor laporan ke format PDF...", "info"));

        const btnReset = document.getElementById('btnReset');
        if(btnReset) btnReset.addEventListener('click', () => {
            if(confirm("Yakin ingin mengatur ulang semua parameter ke nilai bawaan pabrik?")) {
                this.showToast("Parameter sistem dikembalikan ke default.", "info");
            }
        });

        const btnSimpan = document.getElementById('btnSimpanPengaturan');
        if(btnSimpan) btnSimpan.addEventListener('click', () => this.showToast("Pengaturan berhasil disimpan!", "success"));

        // Event Filtering Zona
        const filterBtns = document.querySelectorAll('#filterZoneButtons .btn-filter');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-emerald-600', 'text-white');
                    b.classList.add('bg-gray-50', 'text-gray-500', 'border', 'border-gray-200');
                });
                e.target.classList.remove('bg-gray-50', 'text-gray-500', 'border', 'border-gray-200');
                e.target.classList.add('bg-emerald-600', 'text-white');

                this.activeZoneFilter = e.target.getAttribute('data-zone') || 'Semua Zona';
                this.renderMainTable();
            });
        });

        // Event Search Input
        const searchInput = document.getElementById('searchInputData');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.renderMainTable();
            });
        }
    }

    // HELPER FORMAT TANGGAL
    formatDate(dateStr) {
        if(!dateStr) return "-";
        const date = new Date(dateStr);
        if(isNaN(date.getTime())) return dateStr;
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new SimanisApp();
});