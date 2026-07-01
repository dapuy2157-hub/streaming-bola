/**
 * ==========================================================
 * FIFA WORLD CUP STREAMING FREE
 * Full JavaScript - Login, Register, Admin, Streaming, Rotate
 * ==========================================================
 */

// ==========================================================
// KONFIGURASI GIST
// ==========================================================
const GIST_ID = 'dde9e0ca0b50e38f9b2af7e44b5686bb';
const GIST_TOKEN = process.env.GIST_TOKEN || '';
// ==========================================================
// STATE
// ==========================================================
let currentUser = null;
let isLoginMode = true;
let allUsers = [];
let allBerita = [];
let configData = {};
let isRotated = false;

// ==========================================================
// DOM REFS
// ==========================================================
const $ = (id) => document.getElementById(id);
const loadingScreen = $('loadingScreen');
const loaderFill = $('loaderFill');
const loaderPercent = $('loaderPercent');
const authModal = $('authModal');
const authTitle = $('authTitle');
const authSub = $('authSub');
const authUsername = $('authUsername');
const authPassword = $('authPassword');
const authEmail = $('authEmail');
const authSubmitBtn = $('authSubmitBtn');
const authSwitchText = $('authSwitchText');
const authSwitchLink = $('authSwitchLink');
const mainApp = $('mainApp');
const sidebar = $('sidebar');
const sidebarOverlay = $('sidebarOverlay');
const toggleSidebar = $('toggleSidebar');
const closeSidebar = $('closeSidebar');
const sidebarName = $('sidebarName');
const sidebarRole = $('sidebarRole');
const contentArea = $('contentArea');
const toast = $('toast');
const rotateBtn = $('rotateBtn');

// ==========================================================
// TOAST
// ==========================================================
let toastTimer;

function showToast(msg, type = 'info') {
    toast.textContent = msg;
    toast.className = 'toast show ' + type;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==========================================================
// LOADING SCREEN
// ==========================================================
function startLoading() {
    let progress = 0;
    const minDuration = 3000;
    const maxDuration = 5000;
    const duration = minDuration + Math.random() * (maxDuration - minDuration);
    const interval = 30;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
        progress += increment + (Math.random() * 2);
        if (progress > 100) progress = 100;
        loaderFill.style.width = progress + '%';
        loaderPercent.textContent = Math.floor(progress) + '%';
        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                loadingScreen.classList.add('hide');
                checkAuth();
            }, 300);
        }
    }, interval);
}

// ==========================================================
// GIST API
// ==========================================================
async function fetchGist() {
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`);
    return await res.json();
}

async function updateGist(files) {
    const payload = { files: {} };
    for (const [name, content] of Object.entries(files)) {
        payload.files[name] = { content: typeof content === 'string' ? content : JSON.stringify(content, null, 2) };
    }
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${GIST_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
}

async function getFile(filename) {
    try {
        const gist = await fetchGist();
        if (gist.files && gist.files[filename]) {
            return JSON.parse(gist.files[filename].content);
        }
        return null;
    } catch (e) {
        console.error('Error getFile:', e);
        return null;
    }
}

// ==========================================================
// GET USER IP & LOKASI
// ==========================================================
async function getUserLocation() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        return {
            ip: data.ip || '0.0.0.0',
            country: data.country_name || 'Unknown',
            city: data.city || 'Unknown',
            region: data.region || 'Unknown'
        };
    } catch (e) {
        return { ip: '0.0.0.0', country: 'Unknown', city: 'Unknown', region: 'Unknown' };
    }
}

// ==========================================================
// AUTH
// ==========================================================
function checkAuth() {
    const saved = localStorage.getItem('user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            showApp();
            return;
        } catch (e) {}
    }
    showAuthModal();
}

function showAuthModal() {
    authModal.classList.add('show');
    isLoginMode = true;
    authTitle.textContent = 'WORLD CUP ACCESS';
    authSub.textContent = 'Login untuk menonton streaming gratis';
    authSubmitBtn.textContent = 'Login';
    authEmail.style.display = 'none';
    authSwitchText.innerHTML = 'Belum punya akun? <a id="authSwitchLink">Daftar Sekarang</a>';
    document.getElementById('authSwitchLink').onclick = toggleAuthMode;
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    authTitle.textContent = isLoginMode ? 'WORLD CUP ACCESS' : 'BUAT AKUN';
    authSub.textContent = isLoginMode ? 'Login untuk menonton streaming gratis' : 'Daftar untuk akses gratis';
    authSubmitBtn.textContent = isLoginMode ? 'Login' : 'Daftar';
    authEmail.style.display = isLoginMode ? 'none' : 'block';
    authSwitchText.innerHTML = isLoginMode ?
        'Belum punya akun? <a id="authSwitchLink">Daftar Sekarang</a>' :
        'Sudah punya akun? <a id="authSwitchLink">Login</a>';
    document.getElementById('authSwitchLink').onclick = toggleAuthMode;
}

authSubmitBtn.addEventListener('click', async () => {
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    const email = authEmail.value.trim();

    if (!username || !password) {
        showToast('Isi semua kolom!', 'error');
        return;
    }
    if (!isLoginMode && !email) {
        showToast('Masukkan email!', 'error');
        return;
    }

    const data = await getFile('users.json');
    if (!data || !data.users) {
        showToast('Gagal load database!', 'error');
        return;
    }
    allUsers = data.users;

    if (isLoginMode) {
        // LOGIN
        const user = allUsers.find(u => u.username === username && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('user', JSON.stringify(user));
            authModal.classList.remove('show');
            showApp();
            showToast('✅ Selamat datang ' + user.username + '!', 'success');
        } else {
            showToast('❌ Username atau password salah!', 'error');
        }
    } else {
        // REGISTER
        if (allUsers.find(u => u.username === username)) {
            showToast('Username sudah dipakai!', 'error');
            return;
        }
        if (allUsers.find(u => u.email === email)) {
            showToast('Email sudah terdaftar!', 'error');
            return;
        }
        const newUser = {
            id: 'user_' + Date.now(),
            username,
            email,
            password,
            role: 'user',
            created_at: new Date().toISOString()
        };
        allUsers.push(newUser);
        await updateGist({ 'users.json': { users: allUsers } });
        showToast('✅ Registrasi berhasil! Silakan login.', 'success');
        toggleAuthMode();
        authUsername.value = '';
        authPassword.value = '';
        authEmail.value = '';
    }
});

// Enter key support
authPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') authSubmitBtn.click();
});
authUsername.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') authPassword.focus();
});

// ==========================================================
// SHOW APP
// ==========================================================
function showApp() {
    mainApp.classList.add('show');
    updateSidebar();
    loadDashboard();
    loadBerita();
    loadConfig();
    loadHistory();
    loadAdminBeritaList();
    setupNavigation();
    setupAdmin();
    setupStreaming();
    loadRotatePreference();
}

// ==========================================================
// SIDEBAR
// ==========================================================
function updateSidebar() {
    if (!currentUser) return;
    sidebarName.textContent = currentUser.username;
    sidebarRole.textContent = currentUser.role;
    if (currentUser.role === 'admin') {
        sidebarRole.style.background = 'rgba(255,45,85,0.15)';
        sidebarRole.style.color = '#ff2d55';
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('show'));
    } else {
        sidebarRole.style.background = 'rgba(255,255,255,0.02)';
        sidebarRole.style.color = '#666';
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('show'));
    }
}

toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
});

// ==========================================================
// NAVIGATION
// ==========================================================
function setupNavigation() {
    document.querySelectorAll('.menu li[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'logout') {
                localStorage.removeItem('user');
                currentUser = null;
                mainApp.classList.remove('show');
                showAuthModal();
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
                return;
            }
            document.querySelectorAll('.menu li').forEach(l => l.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const target = document.getElementById('page-' + page);
            if (target) target.classList.add('active');
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    });
}

// ==========================================================
// DASHBOARD
// ==========================================================
async function loadDashboard() {
    const data = await getFile('users.json');
    if (data && data.users) {
        document.getElementById('totalUsers').textContent = data.users.length;
    }
    const berita = await getFile('berita.json');
    if (berita && berita.berita) {
        document.getElementById('beritaCount').textContent = berita.berita.length;
    }
}

// ==========================================================
// BERITA
// ==========================================================
async function loadBerita() {
    const container = document.getElementById('beritaContainer');
    const data = await getFile('berita.json');
    if (!data || !data.berita || data.berita.length === 0) {
        container.innerHTML = `
            <div class="berita-empty">
                <i class="fas fa-newspaper"></i>
                <p>Belum ada berita dari admin.</p>
            </div>
        `;
        return;
    }
    allBerita = data.berita;
    container.innerHTML = data.berita.map((b, i) => `
        <div class="berita-item" data-id="${b.id}">
            <div class="date">${b.date || 'Baru'}</div>
            <h4>${b.title}</h4>
            <p>${b.content}</p>
        </div>
    `).join('');
}

// ==========================================================
// ADMIN - LOAD BERITA LIST (DENGAN DELETE)
// ==========================================================
async function loadAdminBeritaList() {
    const container = document.getElementById('adminBeritaList');
    const data = await getFile('berita.json');
    if (!data || !data.berita || data.berita.length === 0) {
        container.innerHTML = '<p style="color:#444;font-size:0.85rem;">Belum ada berita</p>';
        return;
    }
    container.innerHTML = data.berita.map((b, i) => `
        <div class="berita-item" data-id="${b.id}" style="padding-right:50px;position:relative;">
            <div class="date">${b.date || 'Baru'}</div>
            <h4>${b.title}</h4>
            <p>${b.content}</p>
            <button class="del-btn" onclick="deleteBerita('${b.id}')" style="position:absolute;top:12px;right:14px;background:none;border:none;color:#ff0040;cursor:pointer;font-size:0.85rem;padding:4px 8px;border-radius:6px;transition:0.3s;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// ==========================================================
// ADMIN - DELETE BERITA
// ==========================================================
async function deleteBerita(beritaId) {
    if (!confirm('Hapus berita ini?')) return;
    try {
        const data = await getFile('berita.json');
        if (!data || !data.berita) {
            showToast('Data berita tidak ditemukan!', 'error');
            return;
        }
        data.berita = data.berita.filter(b => b.id !== beritaId);
        await updateGist({ 'berita.json': data });
        loadBerita();
        loadAdminBeritaList();
        loadDashboard();
        showToast('✅ Berita berhasil dihapus!', 'success');
    } catch (e) {
        console.error('Error delete berita:', e);
        showToast('❌ Gagal menghapus berita!', 'error');
    }
}

// ==========================================================
// CONFIG
// ==========================================================
async function loadConfig() {
    const data = await getFile('config.json');
    if (data) {
        configData = data;
        document.getElementById('adminStreamUrl').value = data.streamUrl || '';
        document.getElementById('announcementText').textContent = data.announcement || 'Selamat menonton FIFA World Cup 2026! 🏆';
        if (data.streamUrl) {
            document.getElementById('liveIframe').src = data.streamUrl;
        }
    }
}

// ==========================================================
// STREAMING
// ==========================================================
function setupStreaming() {
    const iframe = document.getElementById('liveIframe');
    const loading = document.getElementById('playerLoading');

    iframe.addEventListener('load', () => {
        loading.classList.add('hide');
        iframe.classList.add('loaded');
    });

    // Fallback timeout
    setTimeout(() => {
        if (!iframe.classList.contains('loaded')) {
            loading.classList.add('hide');
            iframe.classList.add('loaded');
        }
    }, 8000);
}

// ==========================================================
// ADMIN - GANTI API
// ==========================================================
function setupAdmin() {
    document.getElementById('adminSaveStream').addEventListener('click', async () => {
        const url = document.getElementById('adminStreamUrl').value.trim();
        if (!url) {
            showToast('Masukkan URL!', 'error');
            return;
        }
        const config = await getFile('config.json') || {};
        config.streamUrl = url;
        await updateGist({ 'config.json': config });
        document.getElementById('liveIframe').src = url;
        document.getElementById('streamStatus').innerHTML = 'Status: <span style="color:#00c864;">✅ Online</span>';
        showToast('✅ URL stream berhasil diupdate!', 'success');
    });

    // ADMIN - SEND BERITA
    document.getElementById('adminSendBerita').addEventListener('click', async () => {
        const title = document.getElementById('adminBeritaTitle').value.trim();
        const content = document.getElementById('adminBeritaContent').value.trim();
        if (!title || !content) {
            showToast('Isi judul dan isi berita!', 'error');
            return;
        }
        const data = await getFile('berita.json') || { berita: [] };
        data.berita.unshift({
            id: Date.now(),
            title,
            content,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        });
        await updateGist({ 'berita.json': data });
        document.getElementById('adminBeritaTitle').value = '';
        document.getElementById('adminBeritaContent').value = '';
        loadBerita();
        loadAdminBeritaList();
        loadDashboard();
        showToast('✅ Berita berhasil dikirim!', 'success');
    });

    // REFRESH HISTORY
    document.getElementById('refreshHistory').addEventListener('click', loadHistory);
}

// ==========================================================
// ADMIN - HISTORY USERS
// ==========================================================
async function loadHistory() {
    const tbody = document.getElementById('historyTableBody');
    const data = await getFile('users.json');
    if (!data || !data.users) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#444;">Tidak ada data</td></tr>`;
        return;
    }
    document.getElementById('historyTotalUsers').textContent = data.users.length;

    const location = await getUserLocation();

    tbody.innerHTML = data.users.map(u => `
        <tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.email || '-'}</td>
            <td><span class="badge ${u.role}">${u.role}</span></td>
            <td>${location.ip}</td>
            <td>${location.country} - ${location.city}</td>
            <td>
                ${u.role !== 'admin' ? `<button class="del-btn" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>` : '-'}
            </td>
        </tr>
    `).join('');
}

// ==========================================================
// ADMIN - DELETE USER
// ==========================================================
async function deleteUser(userId) {
    if (!confirm('Hapus user ini secara permanen?')) return;
    try {
        const data = await getFile('users.json');
        if (!data || !data.users) {
            showToast('Data user tidak ditemukan!', 'error');
            return;
        }
        data.users = data.users.filter(u => u.id !== userId);
        await updateGist({ 'users.json': data });
        loadHistory();
        loadDashboard();
        showToast('✅ User berhasil dihapus!', 'success');
    } catch (e) {
        console.error('Error delete user:', e);
        showToast('❌ Gagal menghapus user!', 'error');
    }
}

// ==========================================================
// PLAYER ROTATE - TOGGLE
// ==========================================================
function toggleRotate() {
    const playerWrap = document.getElementById('playerWrap');
    const rotateBtn = document.getElementById('rotateBtn');
    
    isRotated = !isRotated;
    
    if (isRotated) {
        playerWrap.classList.add('rotate');
        if (rotateBtn) {
            rotateBtn.innerHTML = '<i class="fas fa-rotate-left"></i> Normal';
        }
    } else {
        playerWrap.classList.remove('rotate');
        if (rotateBtn) {
            rotateBtn.innerHTML = '<i class="fas fa-rotate-right"></i> Miring';
        }
    }
    
    localStorage.setItem('playerRotate', isRotated ? 'true' : 'false');
}

function loadRotatePreference() {
    const saved = localStorage.getItem('playerRotate');
    const playerWrap = document.getElementById('playerWrap');
    const rotateBtn = document.getElementById('rotateBtn');
    
    if (saved === 'true') {
        isRotated = true;
        if (playerWrap) playerWrap.classList.add('rotate');
        if (rotateBtn) {
            rotateBtn.innerHTML = '<i class="fas fa-rotate-left"></i> Normal';
        }
    } else {
        isRotated = false;
        if (playerWrap) playerWrap.classList.remove('rotate');
        if (rotateBtn) {
            rotateBtn.innerHTML = '<i class="fas fa-rotate-right"></i> Miring';
        }
    }
}

// Event listener untuk tombol rotate
if (rotateBtn) {
    rotateBtn.addEventListener('click', toggleRotate);
}

// ==========================================================
// INIT
// ==========================================================
startLoading();

console.log('%c⚽ FIFA WORLD CUP STREAMING FREE ', 'background:#ff2d55;color:#fff;font-size:18px;font-weight:bold;padding:8px 16px;border-radius:6px;');
console.log('%c 🔥 Login: admin / admin123 ', 'color:#888;font-size:13px;');
console.log('%c 🚀 Powered by DapzxPloit ', 'color:#666;font-size:12px;');
