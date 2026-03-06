/* js/admin.js */

document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const loginForm = document.getElementById('adminLoginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    let currentSession = null;
    let bChart = null; // for Chart.js instance

    // --- Utility: Toast Notifications ---
    window.showToast = function (message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'info';
        if (type === 'success') icon = 'check_circle';
        if (type === 'error') icon = 'error';

        toast.innerHTML = `<span class="material-symbols-outlined toast-icon">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOutRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    };

    function formatDate(dateStr) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('it-IT', options);
    }

    // --- Authentication ---
    async function checkSession() {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session) {
            currentSession = session;
            document.getElementById('adminUserEmail').textContent = session.user.email;
            document.querySelector('.admin-avatar').textContent = session.user.email.charAt(0).toUpperCase();
            showDashboard();
        } else {
            showLogin();
        }
    }

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (session) {
            currentSession = session;
            document.getElementById('adminUserEmail').textContent = session.user.email;
            document.querySelector('.admin-avatar').textContent = session.user.email.charAt(0).toUpperCase();
            showDashboard();
        } else {
            currentSession = null;
            showLogin();
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const btn = loginForm.querySelector('button');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'Accesso in corso...';

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            showToast('Errore di accesso: credenziali non valide', 'error');
            loginError.textContent = "Credenziali non valide. Riprova.";
            loginError.style.display = 'block';
            btn.innerHTML = originalHTML;
        } else {
            loginError.style.display = 'none';
            btn.innerHTML = originalHTML;
            showToast('Accesso effettuato con successo', 'success');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        showToast('Logout effettuato', 'success');
    });

    function showLogin() {
        loginView.style.display = 'flex';
        dashboardView.style.display = 'none';
        document.body.style.background = 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)';
    }

    function showDashboard() {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        document.body.style.background = 'var(--admin-bg)';
        loadDashboardData();
        loadBookings();
    }

    // --- Sidebar Navigation ---
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
    const sections = document.querySelectorAll('.view-section');
    const topbarTitle = document.getElementById('topbarTitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            item.classList.add('active');
            const target = item.getAttribute('data-target');
            document.getElementById(`sec-${target}`).classList.add('active');

            // Set Title
            if (target === 'dashboard') topbarTitle.textContent = 'Dashboard Overview';
            if (target === 'bookings') topbarTitle.textContent = 'Gestione Prenotazioni';
            if (target === 'services') topbarTitle.textContent = 'Modifica Servizi & Prodotti';
            if (target === 'settings') topbarTitle.textContent = 'Impostazioni Globali';

            if (target === 'dashboard') {
                loadDashboardData();
            }
            if (target === 'bookings') loadBookings();
            if (target === 'services') loadServices();
            if (target === 'settings') loadSettings();
        });
    });

    // --- Dashboard logic ---
    async function loadDashboardData() {
        try {
            const todayStr = new Date().toISOString().split('T')[0];

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // 1. Stats
            const { count: todayCount } = await supabaseClient.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', todayStr);
            const { count: tomorrowCount } = await supabaseClient.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', tomorrowStr);
            const { count: pendingCount } = await supabaseClient.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
            const { count: totalCount } = await supabaseClient.from('bookings').select('*', { count: 'exact', head: true });

            document.getElementById('dashStatToday').textContent = todayCount || 0;
            document.getElementById('dashStatTomorrow').textContent = tomorrowCount || 0;
            document.getElementById('dashStatPending').textContent = pendingCount || 0;
            document.getElementById('dashStatTotal').textContent = totalCount || 0;

            // 2. Upcoming arrivals today
            const upcomingList = document.getElementById('upcomingList');
            const { data: todayBookings } = await supabaseClient
                .from('bookings')
                .select(`*, products_services(name), staff(name)`)
                .eq('booking_date', todayStr)
                .order('booking_time', { ascending: true })
                .limit(5);

            if (todayBookings && todayBookings.length > 0) {
                upcomingList.innerHTML = '';
                todayBookings.forEach(b => {
                    const time = b.booking_time.substring(0, 5);
                    const service = b.products_services ? b.products_services.name : '';
                    const staffName = b.staff ? b.staff.name : 'Nessuno';
                    upcomingList.innerHTML += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.8rem; background: rgba(255,255,255,0.02); border-radius: 8px;">
                            <div>
                                <strong style="color:var(--admin-accent); display:block; margin-bottom:0.2rem;">${time}</strong>
                                <span>${b.customer_name} <small style="color:var(--admin-text-muted)">(${staffName})</small></span>
                            </div>
                            <span class="badge badge-${b.status}" style="font-size:0.7rem;">${service}</span>
                        </div>
                    `;
                });
            } else {
                upcomingList.innerHTML = '<p style="color: var(--admin-text-muted); font-size: 0.9rem;">Nessun arrivo in vista per oggi.</p>';
            }

            // 3. Chart
            loadChartData();

        } catch (e) { console.error(e); }
    }

    async function loadChartData() {
        // Get last 7 days array
        const dates = [];
        const counts = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
            counts.push(0); // init with 0
        }

        const dateLabels = dates.map(d => {
            const dt = new Date(d);
            return dt.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
        });

        // Fetch bookings for these dates
        const { data } = await supabaseClient
            .from('bookings')
            .select('booking_date')
            .gte('booking_date', dates[0])
            .lte('booking_date', dates[6]);

        if (data) {
            data.forEach(b => {
                const idx = dates.indexOf(b.booking_date);
                if (idx !== -1) counts[idx]++;
            });
        }

        const ctx = document.getElementById('bookingsChart');
        if (bChart) bChart.destroy(); // remount

        bChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dateLabels,
                datasets: [{
                    label: 'Prenotazioni',
                    data: counts,
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#000',
                    pointBorderColor: '#d4af37',
                    pointHoverBackgroundColor: '#d4af37',
                    pointHoverBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#a0a0a0' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#a0a0a0' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // --- Bookings ---
    const filterStaffSelect = document.getElementById('filterStaff');

    const applyBookingFilters = () => {
        const searchTerm = document.getElementById('searchBookings').value.toLowerCase();
        const staffFilter = filterStaffSelect ? filterStaffSelect.value : '';
        const rows = document.querySelectorAll('#bookingsTable tbody tr');

        rows.forEach(row => {
            if (row.children.length === 1) return; // skip loading row
            const text = row.textContent.toLowerCase();
            const staffId = row.getAttribute('data-staff-id');

            const matchesSearch = text.includes(searchTerm);
            const matchesStaff = !staffFilter || staffId === staffFilter;

            row.style.display = (matchesSearch && matchesStaff) ? '' : 'none';
        });
    };

    document.getElementById('searchBookings').addEventListener('input', applyBookingFilters);
    if (filterStaffSelect) filterStaffSelect.addEventListener('change', applyBookingFilters);

    async function populateStaffFilter() {
        if (!filterStaffSelect) return;
        const { data: staff } = await supabaseClient.from('staff').select('id, name').eq('is_active', true).order('name');
        if (staff) {
            filterStaffSelect.innerHTML = '<option value="">Tutti gli Stylist</option>';
            staff.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                filterStaffSelect.appendChild(opt);
            });
        }
    }
    populateStaffFilter();

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        const rows = document.querySelectorAll('#bookingsTable tr');
        let csvContent = "data:text/csv;charset=utf-8,";

        rows.forEach(row => {
            if (row.style.display === 'none') return;
            let rowArray = [];
            row.querySelectorAll('th, td').forEach(cell => {
                // remove actions column
                if (cell.classList.contains('action-column')) return;

                let text = cell.innerText.replace(/(\r\n|\n|\r)/gm, " ");
                text = text.replace(/"/g, '""');
                // if select exists, get its value
                const sel = cell.querySelector('select');
                if (sel) {
                    text = sel.options[sel.selectedIndex].text;
                }
                rowArray.push(`"${text}"`);
            });
            if (rowArray.length > 0) csvContent += rowArray.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `prenotazioni_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('Esportazione CSV completata', 'success');
    });

    async function loadBookings() {
        const tbody = document.querySelector('#bookingsTable tbody');
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Caricamento in corso...</td></tr>';

        const { data, error } = await supabaseClient
            .from('bookings')
            .select(`*, products_services(name), staff(id, name)`)
            .order('booking_date', { ascending: false })
            .order('booking_time', { ascending: false });

        if (error) {
            tbody.innerHTML = `<tr><td colspan="7" style="color:var(--admin-danger); text-align:center;">Errore: ${error.message}</td></tr>`;
            return;
        }

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--admin-text-muted);">Nessuna prenotazione trovata nel sistema.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        data.forEach(booking => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-staff-id', booking.staff_id || '');

            const serviceName = booking.products_services ? booking.products_services.name : 'Servizio Rimosso';
            const staffName = booking.staff ? booking.staff.name : 'Nessuno';
            const dateFormatted = formatDate(booking.booking_date);
            const timeFormatted = booking.booking_time.substring(0, 5);

            tr.innerHTML = `
                <td>
                    <strong style="display:block; margin-bottom:0.3rem;">${dateFormatted}</strong>
                    <span style="color: var(--admin-text-muted); font-size:0.85rem;"><span class="material-symbols-outlined" style="font-size:1rem; vertical-align:middle;">schedule</span> ${timeFormatted}</span>
                </td>
                <td>
                    <strong style="display:block; margin-bottom:0.3rem; font-size:1rem;">${booking.customer_name}</strong>
                    <span style="color:var(--admin-text-muted); font-size:0.85rem;">${booking.customer_email || 'Nessuna email'}</span>
                </td>
                <td>
                    <a href="https://wa.me/${booking.customer_phone.replace(/\D/g, '')}" target="_blank" style="color: var(--admin-success); text-decoration: none; display:flex; align-items:center; gap:0.5rem; font-weight:500;">
                        <span class="material-symbols-outlined" style="font-size:1.2rem;">chat</span> ${booking.customer_phone}
                    </a>
                </td>
                <td><span style="background: rgba(255,255,255,0.05); padding: 0.4rem 0.8rem; border-radius:6px;">${serviceName}</span></td>
                <td><span style="color:var(--admin-accent); font-weight:500;">${staffName}</span></td>
                <td>
                    <select class="status-select badge badge-${booking.status}" data-id="${booking.id}" style="border:none;">
                        <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>⏳ In Attesa</option>
                        <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>✓ Confermato</option>
                        <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>⭐️ Completato</option>
                        <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>✕ Cancellato</option>
                    </select>
                </td>
                <td class="action-column" style="text-align:right;">
                    <button class="btn-icon-action delete" onclick="deleteBooking('${booking.id}')" title="Elimina Prenotazione">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        applyBookingFilters(); // apply initial search/filters if any

        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const id = e.target.getAttribute('data-id');
                const newStatus = e.target.value;

                e.target.className = `status-select badge badge-${newStatus}`;

                const { error } = await supabaseClient.from('bookings').update({ status: newStatus }).eq('id', id);
                if (error) {
                    showToast('Errore durante l\'aggiornamento dello stato', 'error');
                } else {
                    showToast('Stato prenotazione aggiornato', 'success');
                    loadDashboardData();
                }
            });
        });
    }

    window.deleteBooking = async (id) => {
        if (confirm('Sei sicuro di voler eliminare questa prenotazione? L\'azione è irreversibile.')) {
            const { error } = await supabaseClient.from('bookings').delete().eq('id', id);
            if (error) {
                showToast('Errore durante l\'eliminazione', 'error');
            } else {
                showToast('Prenotazione eliminata', 'success');
                loadBookings();
                loadDashboardData();
            }
        }
    };

    // --- Services ---
    const serviceModal = document.getElementById('serviceModal');
    const serviceForm = document.getElementById('serviceForm');

    document.getElementById('searchServices').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#servicesTable tbody tr');
        rows.forEach(row => {
            if (row.children.length === 1) return;
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    });

    document.getElementById('openServiceModalBtn').addEventListener('click', () => {
        serviceForm.reset();
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceModalTitle').textContent = 'Aggiungi Nuovo Servizio';
        serviceModal.classList.add('active');
    });

    document.getElementById('closeServiceModalBtn').addEventListener('click', () => serviceModal.classList.remove('active'));
    document.getElementById('cancelServiceBtn').addEventListener('click', () => serviceModal.classList.remove('active'));

    // Close on click outside
    serviceModal.addEventListener('click', (e) => {
        if (e.target === serviceModal) serviceModal.classList.remove('active');
    });

    async function loadServices() {
        const tbody = document.querySelector('#servicesTable tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Caricamento in corso...</td></tr>';

        const { data, error } = await supabaseClient
            .from('products_services')
            .select('*')
            .order('category')
            .order('name');

        if (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:var(--admin-danger); text-align:center;">Errore: ${error.message}</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        data.forEach(service => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="font-size:1.05rem;">${service.name}</strong><br><span style="color:var(--admin-text-muted); font-size:0.85rem;">${service.description ? service.description.substring(0, 30) + '...' : ''}</span></td>
                <td><span style="background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.3); color:var(--admin-accent); padding:0.3rem 0.6rem; border-radius:4px; font-size:0.8rem;">${service.category}</span></td>
                <td><span class="material-symbols-outlined" style="font-size:1rem; vertical-align:middle; color:var(--admin-text-muted);">schedule</span> ${service.duration_minutes} min</td>
                <td><strong style="font-size:1.1rem;">€${service.price}</strong></td>
                <td class="action-column" style="text-align:right;">
                    <button class="btn-icon-action" onclick='editService(${JSON.stringify(service).replace(/'/g, "&#39;")})' title="Modifica Servizio"><span class="material-symbols-outlined">edit</span></button>
                    <button class="btn-icon-action delete" style="margin-left: 0.5rem;" onclick="deleteService('${service.id}')" title="Elimina Servizio"><span class="material-symbols-outlined">delete</span></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.editService = (service) => {
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceName').value = service.name;
        document.getElementById('serviceCategory').value = service.category;
        document.getElementById('servicePrice').value = service.price;
        document.getElementById('serviceDuration').value = service.duration_minutes;
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('serviceModalTitle').textContent = 'Modifica Servizio';
        serviceModal.classList.add('active');
    };

    window.deleteService = async (id) => {
        if (confirm('Sicuro di voler eliminare questo servizio?')) {
            const { error } = await supabaseClient.from('products_services').delete().eq('id', id);
            if (error) {
                showToast('Errore durante l\'eliminazione', 'error');
            } else {
                showToast('Servizio eliminato', 'success');
                loadServices();
                loadDashboardData();
            }
        }
    };

    serviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('serviceId').value;
        const btn = serviceForm.querySelector('button[type="submit"]');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined">sync</span> Salvataggio...';
        btn.disabled = true;

        const serviceData = {
            name: document.getElementById('serviceName').value,
            category: document.getElementById('serviceCategory').value,
            price: parseFloat(document.getElementById('servicePrice').value),
            duration_minutes: parseInt(document.getElementById('serviceDuration').value),
            description: document.getElementById('serviceDescription').value
        };

        let result;
        if (id) {
            result = await supabaseClient.from('products_services').update(serviceData).eq('id', id);
        } else {
            result = await supabaseClient.from('products_services').insert([serviceData]);
        }

        btn.innerHTML = origHTML;
        btn.disabled = false;

        if (result.error) {
            showToast('Errore durante il salvataggio', 'error');
        } else {
            showToast(id ? 'Servizio modificato con successo' : 'Nuovo servizio aggiunto', 'success');
            serviceModal.classList.remove('active');
            loadServices();
            loadDashboardData();
        }
    });

    // --- Settings ---
    const settingsForm = document.getElementById('settingsForm');

    async function loadSettings() {
        const { data, error } = await supabaseClient.from('settings').select('*');
        if (error) return;

        data.forEach(setting => {
            if (setting.key === 'contact_info') {
                document.getElementById('contactPhone').value = setting.value.phone || '';
                document.getElementById('contactEmail').value = setting.value.email || '';
                document.getElementById('contactAddress').value = setting.value.address || '';
            }
            if (setting.key === 'business_hours') {
                document.getElementById('hoursMon').value = setting.value.monday || '';
                document.getElementById('hoursTue').value = setting.value.tuesday || '';
                document.getElementById('hoursWed').value = setting.value.wednesday || '';
                document.getElementById('hoursThu').value = setting.value.thursday || '';
                document.getElementById('hoursFri').value = setting.value.friday || '';
                document.getElementById('hoursSat').value = setting.value.saturday || '';
                document.getElementById('hoursSun').value = setting.value.sunday || '';
            }
        });
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveSettingsBtn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined">sync</span> Salvataggio...';
        btn.disabled = true;

        const contact_info = {
            phone: document.getElementById('contactPhone').value,
            email: document.getElementById('contactEmail').value,
            address: document.getElementById('contactAddress').value
        };

        const business_hours = {
            monday: document.getElementById('hoursMon').value,
            tuesday: document.getElementById('hoursTue').value,
            wednesday: document.getElementById('hoursWed').value,
            thursday: document.getElementById('hoursThu').value,
            friday: document.getElementById('hoursFri').value,
            saturday: document.getElementById('hoursSat').value,
            sunday: document.getElementById('hoursSun').value
        };

        const res1 = await supabaseClient.from('settings').update({ value: contact_info }).eq('key', 'contact_info');
        const res2 = await supabaseClient.from('settings').update({ value: business_hours }).eq('key', 'business_hours');

        btn.disabled = false;

        if (res1.error || res2.error) {
            showToast('Errore di connessione. Riprova.', 'error');
            btn.innerHTML = originalHTML;
        } else {
            showToast('Impostazioni sincronizzate al sito!', 'success');
            btn.innerHTML = '<span class="material-symbols-outlined">done</span> Salvato!';
            setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
        }
    });

    // Initialize
    checkSession();
});
