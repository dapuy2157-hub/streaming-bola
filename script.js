/**
 * ==========================================================
 * FIFA WORLD CUP STREAMING FREE
 * Supabase Version - Full Integration
 * ==========================================================
 */

// ==========================================================
// SUPABASE CONFIG
// ==========================================================
const SUPABASE_URL = 'https://anfafegvgcteuesaqfeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuZmFmZWd2Z2N0ZXVlc2FxZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mjk0MjYsImV4cCI6MjA5ODUwNTQyNn0.Jmzqtfb6jkXlJKP4PqraBD2l51diIY4QaGa4iy3WQog';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        flowType: 'pkce'
    }
});

// ==========================================================
// STATE
// ==========================================================
let currentUser = null;
let isLoginMode = true;
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
const toast = $('toast');
const rotateBtn = $('rotateBtn');
const googleLoginBtn = $('googleLoginBtn');

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
    const duration = 3000 + Math.random() * 2000;
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
// AUTH CHECK
// ==========================================================
async function checkAuth() {
    const saved = localStorage.getItem('user');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            showApp();
            return;
        } catch (e) {}
    }
    
    // Cek session Supabase
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
        
        if (!userError && userData) {
            currentUser = userData;
            localStorage.setItem('user', JSON.stringify(userData));
            showApp();
            return;
        }
    }
    
    showAuthModal();
}

// ==========================================================
// AUTH MODAL
// ==========================================================
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

// ==========================================================
// REGISTER
// ==========================================================
async function registerUser(username, email, password) {
    try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    role: 'user',
                    status: 'active'
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Registrasi gagal');

        const { error: insertError } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                username: username,
                email: email,
                role: 'user',
                status: 'active',
                photo: 'logo.png'
            }]);

        if (insertError) throw insertError;

        return authData.user;
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
}

// ==========================================================
// LOGIN
// ==========================================================
async function loginUser(email, password) {
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) throw authError;

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError) throw userError;

        return userData;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// ==========================================================
// LOGOUT
// ==========================================================
async function logoutUser() {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    currentUser = null;
}

// ==========================================================
// EVENT AUTH
// ==========================================================
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

    try {
        if (isLoginMode) {
            const user = await loginUser(email, password);
            currentUser = user;
            localStorage.setItem('user', JSON.stringify(user));
            authModal.classList.remove('show');
            showApp();
            showToast('✅ Selamat datang ' + user.username + '!', 'success');
        } else {
            await registerUser(username, email, password);
            showToast('✅ Registrasi berhasil! Silakan login.', 'success');
            toggleAuthMode();
            authUsername.value = '';
            authPassword.value = '';
            authEmail.value = '';
        }
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
});

// ==========================================================
// LOGIN DENGAN GOOGLE
// ==========================================================
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/'
                }
            });
            
            if (error) throw error;
            showToast('✅ Redirect ke Google...', 'success');
        } catch (error) {
            showToast('❌ Gagal login dengan Google: ' + error.message, 'error');
        }
    });
}

// ==========================================================
// HANDLE GOOGLE CALLBACK
// ==========================================================
async function handleGoogleCallback() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Session error:', error);
        return;
    }
    
    if (data.session) {
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
        
        if (userError) {
            // User belum ada, buat baru
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    id: data.session.user.id,
                    username: data.session.user.user_metadata.full_name || data.session.user.email,
                    email: data.session.user.email,
                    role: 'user',
                    status: 'active',
                    photo: data.session.user.user_metadata.avatar_url || 'logo.png'
                }]);
            
            if (insertError) {
                console.error('Insert error:', insertError);
                return;
            }
            
            const { data: newUserData, error: newUserError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.session.user.id)
                .single();
            
            if (newUserError) return;
            currentUser = newUserData;
            localStorage.setItem('user', JSON.stringify(newUserData));
            showApp();
            return;
        }
        
        currentUser = userData;
        localStorage.setItem('user', JSON.stringify(userData));
        showApp();
        showToast('✅ Selamat datang ' + userData.username + '!', 'success');
    }
}

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
                logoutUser();
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
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*', { count: 'exact' });
        
        if (!error && data) {
            document.getElementById('totalUsers').textContent = data.length;
        }
    } catch (e) {
        console.error('Load dashboard error:', e);
    }
}

// ==========================================================
// BERITA
// ==========================================================
async function loadBerita() {
    try {
        const { data, error } = await supabase
            .from('berita')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        const container = document.getElementById('beritaContainer');
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="berita-empty">
                    <i class="fas fa-newspaper"></i>
                    <p>Belum ada berita dari admin.</p>
                </div>
            `;
            return;
        }
        container.innerHTML = data.map(b => `
            <div class="berita-item">
                <div class="date">${new Date(b.created_at).toLocaleDateString('id-ID')}</div>
                <h4>${b.title}</h4>
                <p>${b.content}</p>
            </div>
        `).join('');
    } catch (e) {
        console.error('Load berita error:', e);
    }
}

// ==========================================================
// CONFIG
// ==========================================================
async function loadConfig() {
    try {
        const { data, error } = await supabase
            .from('config')
            .select('*')
            .single();
        
        if (!error && data) {
            document.getElementById('adminStreamUrl').value = data.stream_url || '';
            document.getElementById('announcementText').textContent = data.announcement || 'Selamat menonton FIFA World Cup 2026! 🏆';
            if (data.stream_url) {
                document.getElementById('liveIframe').src = data.stream_url;
            }
        }
    } catch (e) {
        console.error('Load config error:', e);
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

    setTimeout(() => {
        if (!iframe.classList.contains('loaded')) {
            loading.classList.add('hide');
            iframe.classList.add('loaded');
        }
    }, 8000);
}

// ==========================================================
// ADMIN
// ==========================================================
function setupAdmin() {
    document.getElementById('adminSaveStream').addEventListener('click', async () => {
        const url = document.getElementById('adminStreamUrl').value.trim();
        if (!url) {
            showToast('Masukkan URL!', 'error');
            return;
        }
        try {
            const { error } = await supabase
                .from('config')
                .update({ stream_url: url })
                .eq('id', 1);
            
            if (error) throw error;
            document.getElementById('liveIframe').src = url;
            showToast('✅ URL stream berhasil diupdate!', 'success');
        } catch (e) {
            showToast('Gagal update URL!', 'error');
        }
    });

    document.getElementById('adminSendBerita').addEventListener('click', async () => {
        const title = document.getElementById('adminBeritaTitle').value.trim();
        const content = document.getElementById('adminBeritaContent').value.trim();
        if (!title || !content) {
            showToast('Isi judul dan isi berita!', 'error');
            return;
        }
        try {
            const { error } = await supabase
                .from('berita')
                .insert([{
                    title: title,
                    content: content,
                    created_at: new Date().toISOString()
                }]);
            
            if (error) throw error;
            document.getElementById('adminBeritaTitle').value = '';
            document.getElementById('adminBeritaContent').value = '';
            loadBerita();
            loadAdminBeritaList();
            showToast('✅ Berita berhasil dikirim!', 'success');
        } catch (e) {
            showToast('Gagal kirim berita!', 'error');
        }
    });

    document.getElementById('refreshHistory').addEventListener('click', loadHistory);
}

// ==========================================================
// ADMIN - LOAD BERITA LIST
// ==========================================================
async function loadAdminBeritaList() {
    try {
        const { data, error } = await supabase
            .from('berita')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        const container = document.getElementById('adminBeritaList');
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color:#444;">Belum ada berita</p>';
            return;
        }
        container.innerHTML = data.map(b => `
            <div class="berita-item" style="padding-right:50px;position:relative;">
                <div class="date">${new Date(b.created_at).toLocaleDateString('id-ID')}</div>
                <h4>${b.title}</h4>
                <p>${b.content}</p>
                <button class="del-btn" onclick="deleteBerita('${b.id}')" style="position:absolute;top:12px;right:14px;background:none;border:none;color:#ff0040;cursor:pointer;font-size:0.85rem;padding:4px 8px;border-radius:6px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } catch (e) {
        console.error('Load admin berita error:', e);
    }
}

// ==========================================================
// ADMIN - DELETE BERITA
// ==========================================================
async function deleteBerita(beritaId) {
    if (!confirm('Hapus berita ini?')) return;
    try {
        const { error } = await supabase
            .from('berita')
            .delete()
            .eq('id', beritaId);
        
        if (error) throw error;
        loadBerita();
        loadAdminBeritaList();
        showToast('✅ Berita dihapus!', 'success');
    } catch (e) {
        showToast('Gagal hapus berita!', 'error');
    }
}

// ==========================================================
// ADMIN - HISTORY USERS
// ==========================================================
async function loadHistory() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*');
        
        if (error) throw error;
        const tbody = document.getElementById('historyTableBody');
        document.getElementById('historyTotalUsers').textContent = data.length;
        
        tbody.innerHTML = data.map(u => `
            <tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.email || '-'}</td>
                <td><span class="badge ${u.role}">${u.role}</span></td>
                <td>-</td>
                <td>-</td>
                <td>
                    ${u.role !== 'admin' ? `<button class="del-btn" onclick="deleteUser('${u.id}')"><i class="fas fa-trash"></i></button>` : '-'}
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Load history error:', e);
    }
}

// ==========================================================
// ADMIN - DELETE USER
// ==========================================================
async function deleteUser(userId) {
    if (!confirm('Hapus user ini?')) return;
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        loadHistory();
        loadDashboard();
        showToast('✅ User dihapus!', 'success');
    } catch (e) {
        showToast('Gagal hapus user!', 'error');
    }
}

// ==========================================================
// PLAYER ROTATE
// ==========================================================
function toggleRotate() {
    const playerWrap = document.getElementById('playerWrap');
    isRotated = !isRotated;
    if (isRotated) {
        playerWrap.classList.add('rotate');
        if (rotateBtn) rotateBtn.innerHTML = '<i class="fas fa-rotate-left"></i> Normal';
    } else {
        playerWrap.classList.remove('rotate');
        if (rotateBtn) rotateBtn.innerHTML = '<i class="fas fa-rotate-right"></i> Miring';
    }
    localStorage.setItem('playerRotate', isRotated ? 'true' : 'false');
}

function loadRotatePreference() {
    const saved = localStorage.getItem('playerRotate');
    if (saved === 'true') {
        isRotated = true;
        document.getElementById('playerWrap').classList.add('rotate');
        if (rotateBtn) rotateBtn.innerHTML = '<i class="fas fa-rotate-left"></i> Normal';
    }
}

if (rotateBtn) {
    rotateBtn.addEventListener('click', toggleRotate);
}

// ==========================================================
// HANDLE GOOGLE CALLBACK
// ==========================================================
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    handleGoogleCallback();
}

// ==========================================================
// INIT
// ==========================================================
startLoading();

console.log('%c⚽ FIFA WORLD CUP STREAMING FREE ', 'background:#ff2d55;color:#fff;font-size:18px;font-weight:bold;padding:8px 16px;border-radius:6px;');
console.log('%c 🔥 Login: admin / admin123 ', 'color:#888;font-size:13px;');
console.log('%c 🚀 Powered by Supabase ', 'color:#666;font-size:12px;');
