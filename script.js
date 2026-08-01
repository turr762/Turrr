const defaultDatabase = {
    users: [
        { id: "1001", pass: "123", name: "Andi Pratama", role: "siswa", voted: false, votedFor: "-" },
        { id: "1002", pass: "123", name: "Siti Rahma", role: "siswa", voted: true, votedFor: "Paslon 01" },
        { id: "2001", pass: "123", name: "Bapak Budi, S.Pd", role: "guru", voted: false, votedFor: "-" },
        { id: "admin01", pass: "admin123", name: "Ibu Ratna (Panitia)", role: "admin", voted: false, votedFor: "-" }
    ],
    candidates: [
        { 
            id: 1, ketua: "Budi Santoso", wakil: "Citra Lestari", 
            vision: "Mewujudkan OSIS yang aktif, kreatif, dan berintegritas tinggi.", 
            fotoKetua: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", 
            fotoWakil: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
            votes: 1 
        },
        { 
            id: 2, ketua: "Doni Pratama", wakil: "Eva Meliana", 
            vision: "Menjadikan sekolah pusat pengembangan bakat digital siswa.", 
            fotoKetua: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", 
            fotoWakil: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            votes: 0 
        },
        { 
            id: 3, ketua: "Fajar Hidayat", wakil: "Gita Safitri", 
            vision: "Meningkatkan disiplin positif dan solidaritas antar angkatan.", 
            fotoKetua: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", 
            fotoWakil: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
            votes: 0 
        }
    ]
};

function getDatabase() {
    const saved = localStorage.getItem('osis_db_2026');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('osis_db_2026', JSON.stringify(defaultDatabase));
    return defaultDatabase;
}

function saveDatabase(db) {
    localStorage.setItem('osis_db_2026', JSON.stringify(db));
}

// Custom Alert (Zero browser alerts/domain says)
function showCustomAlert(title, message) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('custom-alert-modal').classList.remove('hidden');
}

function closeCustomAlert() {
    document.getElementById('custom-alert-modal').classList.add('hidden');
}

let loggedInUser = null;
let selectedCandidatePending = null;

// Page initialization handler
window.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // If on results.html standalone page
    if (path.includes('results.html')) {
        renderStandaloneResults();
        return;
    }

    // If on index.html SPA
    const savedUser = sessionStorage.getItem('osis_logged_in_user');
    if (savedUser) {
        loggedInUser = JSON.parse(savedUser);
        document.getElementById('user-display-name').innerText = `${loggedInUser.name} (${loggedInUser.role.toUpperCase()})`;
        showPortalView();
    }
});

function showPortalView() {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-app-container').classList.remove('hidden');

    if (loggedInUser.role === 'admin') {
        document.getElementById('subview-admin').classList.remove('hidden');
        document.getElementById('subview-voter').classList.add('hidden');
        renderAdminCandidates();
        renderAdminVotersTable();
    } else {
        document.getElementById('subview-voter').classList.remove('hidden');
        document.getElementById('subview-admin').classList.add('hidden');
        renderVoterDashboard();
    }
}

function handleLogin(event) {
    event.preventDefault();
    const inputId = document.getElementById('username').value.trim();
    const inputPass = document.getElementById('password').value.trim();

    const db = getDatabase();
    const user = db.users.find(u => u.id === inputId && u.pass === inputPass);

    if (user) {
        loggedInUser = user;
        sessionStorage.setItem('osis_logged_in_user', JSON.stringify(user));
        document.getElementById('user-display-name').innerText = `${user.name} (${user.role.toUpperCase()})`;
        showPortalView();
    } else {
        showCustomAlert("Gagal Masuk", "NIS/ID atau Password salah! Periksa kembali data Anda.");
    }
}

function handleLogout() {
    loggedInUser = null;
    sessionStorage.removeItem('osis_logged_in_user');
    selectedCandidatePending = null;
    document.getElementById('view-app-container').classList.add('hidden');
    document.getElementById('view-login').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Voter Dashboard UI
function renderVoterDashboard() {
    const db = getDatabase();
    const user = db.users.find(u => u.id === loggedInUser.id);
    const grid = document.getElementById('voter-candidates-grid');
    grid.innerHTML = '';

    db.candidates.forEach(cand => {
        grid.innerHTML += `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex justify-center space-x-3 mb-4">
                        <div class="flex flex-col items-center">
                            <div class="w-20 h-24 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
                                <img src="${cand.fotoKetua}" class="w-full h-full object-cover">
                            </div>
                            <span class="text-[10px] text-slate-400 mt-1 font-semibold uppercase">Ketua</span>
                        </div>
                        <div class="flex flex-col items-center">
                            <div class="w-20 h-24 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shadow-inner">
                                <img src="${cand.fotoWakil}" class="w-full h-full object-cover">
                            </div>
                            <span class="text-[10px] text-slate-400 mt-1 font-semibold uppercase">Wakil</span>
                        </div>
                    </div>
                    <h4 class="font-bold text-slate-900 text-center">Paslon 0${cand.id}</h4>
                    <p class="text-xs font-semibold text-blue-600 text-center mb-2">${cand.ketua} & ${cand.wakil}</p>
                    <p class="text-xs text-slate-500 text-center italic mb-4">"${cand.vision}"</p>
                </div>
                <div>
                    ${user.voted ? 
                        `<button disabled class="w-full py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed">Sudah Memilih</button>` :
                        `<button onclick="openConfirmModal(${cand.id})" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow">Pilih Paslon 0${cand.id}</button>`
                    }
                </div>
            </div>
        `;
    });

    const banner = document.getElementById('voting-status-banner');
    if (user.voted) {
        banner.className = "p-4 rounded-xl text-center font-medium text-sm bg-emerald-50 text-emerald-800 border border-emerald-200";
        banner.innerText = `Status: Anda sudah menggunakan hak suara (${user.votedFor}). Terima kasih!`;
        setStepProgress(4);
    } else {
        banner.className = "p-4 rounded-xl text-center font-medium text-sm bg-amber-50 text-amber-800 border border-amber-200";
        banner.innerText = "Status: Anda belum menggunakan hak suara. Silakan pilih kandidat di bawah.";
        setStepProgress(2);
    }
}

function setStepProgress(step) {
    document.getElementById('step-1-dot').className = step >= 1 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
    document.getElementById('step-2-dot').className = step >= 2 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
    document.getElementById('step-3-dot').className = step >= 3 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
    document.getElementById('step-4-dot').className = step >= 4 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
}

function openConfirmModal(candId) {
    const db = getDatabase();
    selectedCandidatePending = db.candidates.find(c => c.id === candId);
    document.getElementById('modal-candidate-title').innerText = `Paslon 0${selectedCandidatePending.id}`;
    document.getElementById('modal-candidate-names').innerText = `${selectedCandidatePending.ketua} & ${selectedCandidatePending.wakil}`;
    document.getElementById('modal-candidate-bold-name').innerText = `${selectedCandidatePending.ketua} & ${selectedCandidatePending.wakil}`;
    document.getElementById('custom-confirm-modal').classList.remove('hidden');
    setStepProgress(3);
}

function closeConfirmModal() {
    selectedCandidatePending = null;
    document.getElementById('custom-confirm-modal').classList.add('hidden');
    setStepProgress(2);
}

function executeFinalVote() {
    if (!selectedCandidatePending) return;

    let db = getDatabase();
    const targetCand = db.candidates.find(c => c.id === selectedCandidatePending.id);
    if (targetCand) targetCand.votes += 1;

    const targetUser = db.users.find(u => u.id === loggedInUser.id);
    if (targetUser) {
        targetUser.voted = true;
        targetUser.votedFor = `Paslon 0${selectedCandidatePending.id}`;
        loggedInUser = targetUser;
        sessionStorage.setItem('osis_logged_in_user', JSON.stringify(targetUser));
    }

    saveDatabase(db);
    document.getElementById('custom-confirm-modal').classList.add('hidden');
    setStepProgress(4);
    renderVoterDashboard();
    showCustomAlert("Berhasil", "Suara Anda berhasil disimpan ke database secara permanen!");
}

// Standalone Results Rendering (for results.html)
function renderStandaloneResults() {
    const db = getDatabase();
    const container = document.getElementById('public-results-breakdown');
    if (!container) return;
    container.innerHTML = '';

    const totalVotes = db.candidates.reduce((sum, c) => sum + c.votes, 0);
    const totalVoters = db.users.filter(u => u.role !== 'admin').length;

    document.getElementById('public-total-votes').innerText = totalVotes;
    document.getElementById('public-total-voters').innerText = totalVoters;

    db.candidates.forEach(cand => {
        const percent = totalVotes > 0 ? Math.round((cand.votes / totalVotes) * 100) : 0;
        container.innerHTML += `
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div class="flex justify-between text-sm font-semibold text-slate-800">
                    <span>Paslon 0${cand.id}: ${cand.ketua} & ${cand.wakil}</span>
                    <span>${cand.votes} Suara (${percent}%)</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-blue-600 h-3 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    });
}

// Admin Management Tabs & Functions (2 Pages inside Admin)
function switchAdminTab(tab) {
    const pageCandidates = document.getElementById('admin-page-candidates');
    const pageVoters = document.getElementById('admin-page-voters');
    const btnCand = document.getElementById('admin-tab-candidates');
    const btnVot = document.getElementById('admin-tab-voters');

    if (tab === 'candidates') {
        pageCandidates.classList.remove('hidden');
        pageVoters.classList.add('hidden');
        btnCand.className = "px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm shadow";
        btnVot.className = "px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg text-sm";
    } else {
        pageCandidates.classList.add('hidden');
        pageVoters.classList.remove('hidden');
        btnVot.className = "px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm shadow";
        btnCand.className = "px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg text-sm";
        renderAdminVotersTable();
    }
}

function renderAdminCandidates() {
    const db = getDatabase();
    const list = document.getElementById('admin-candidates-list');
    list.innerHTML = '';

    db.candidates.forEach(cand => {
        list.innerHTML += `
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                <h4 class="font-bold text-slate-800">Paslon 0${cand.id}</h4>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Ketua & Wakil</label>
                    <input type="text" id="admin-name-${cand.id}" value="${cand.ketua} & ${cand.wakil}" class="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">URL Foto Ketua</label>
                    <input type="text" id="admin-fotoketua-${cand.id}" value="${cand.fotoKetua}" class="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">URL Foto Wakil</label>
                    <input type="text" id="admin-fotowakil-${cand.id}" value="${cand.fotoWakil}" class="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-500 mb-1">Visi Misi</label>
                    <textarea id="admin-vision-${cand.id}" class="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white h-16">${cand.vision}</textarea>
                </div>
                <button onclick="updateCandidateInfo(${cand.id})" class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition">Simpan Perubahan</button>
            </div>
        `;
    });
}

function updateCandidateInfo(id) {
    let db = getDatabase();
    const nameInput = document.getElementById(`admin-name-${id}`).value;
    const fotoKetuaInput = document.getElementById(`admin-fotoketua-${id}`).value;
    const fotoWakilInput = document.getElementById(`admin-fotowakil-${id}`).value;
    const visionInput = document.getElementById(`admin-vision-${id}`).value;
    const parts = nameInput.split('&');

    const cand = db.candidates.find(c => c.id === id);
    if (cand) {
        if (parts.length >= 2) {
            cand.ketua = parts[0].trim();
            cand.wakil = parts[1].trim();
        }
        cand.fotoKetua = fotoKetuaInput.trim();
        cand.fotoWakil = fotoWakilInput.trim();
        cand.vision = visionInput.trim();
        saveDatabase(db);
        showCustomAlert("Sukses", `Data Paslon 0${id} berhasil diperbarui di database!`);
    }
}

function renderAdminVotersTable(filterText = '') {
    const db = getDatabase();
    const tbody = document.getElementById('admin-voter-table-body');
    tbody.innerHTML = '';

    const filteredUsers = db.users.filter(u => u.role !== 'admin' && (u.id.toLowerCase().includes(filterText) || u.name.toLowerCase().includes(filterText)));

    filteredUsers.forEach(u => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-4 font-semibold text-slate-900">${u.id}</td>
                <td class="p-4 text-slate-700">${u.name}</td>
                <td class="p-4"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs uppercase font-medium">${u.role}</span></td>
                <td class="p-4">
                    ${u.voted ? '<span class="text-emerald-600 font-semibold text-xs">Sudah Memilih</span>' : '<span class="text-amber-600 font-semibold text-xs">Belum Memilih</span>'}
                </td>
                <td class="p-4 text-slate-600 font-medium">${u.votedFor}</td>
                <td class="p-4 text-center">
                    ${u.voted ? `<button onclick="resetVoterAccount('${u.id}')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition shadow-sm">Unblock / Reset</button>` : `<span class="text-xs text-slate-400 italic">Normal</span>`}
                </td>
            </tr>
        `;
    });
}

function filterVoterTable() {
    const query = document.getElementById('voter-search-input').value.toLowerCase();
    renderAdminVotersTable(query);
}

function resetVoterAccount(userId) {
    let db = getDatabase();
    const user = db.users.find(u => u.id === userId);

    if (user && user.voted) {
        const previousVotePaslon = user.votedFor;
        db.candidates.forEach(cand => {
            if (`Paslon 0${cand.id}` === previousVotePaslon && cand.votes > 0) {
                cand.votes -= 1;
            }
        });

        user.voted = false;
        user.votedFor = "-";
        saveDatabase(db);

        renderAdminVotersTable(document.getElementById('voter-search-input').value.toLowerCase());
        showCustomAlert("Akun Direset", `Akun NIS ${user.id} (${user.name}) berhasil di-reset. Pemilih kini dapat melakukan voting kembali.`);
    }
}
