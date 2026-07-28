// Simulated Global Database (Shared across views via localStorage if available, or fallback mock data)
const defaultDatabase = {
    users: [
        { id: "1001", pass: "123", name: "Andi Pratama", role: "siswa", voted: false, votedFor: "-" },
        { id: "1002", pass: "123", name: "Siti Rahma", role: "siswa", voted: true, votedFor: "Paslon 01" },
        { id: "2001", pass: "123", name: "Bapak Budi, S.Pd", role: "guru", voted: false, votedFor: "-" },
        { id: "admin01", pass: "admin123", name: "Ibu Ratna (Panitia)", role: "admin", voted: false, votedFor: "-" }
    ],
    candidates: [
        { id: 1, ketua: "Budi Santoso", wakil: "Citra Lestari", vision: "Mewujudkan OSIS yang aktif, kreatif, dan berintegritas tinggi.", votes: 1 },
        { id: 2, ketua: "Doni Pratama", wakil: "Eva Meliana", vision: "Menjadikan sekolah pusat pengembangan bakat digital siswa.", votes: 0 },
        { id: 3, ketua: "Fajar Hidayat", wakil: "Gita Safitri", vision: "Meningkatkan disiplin positif dan solidaritas antar angkatan.", votes: 0 }
    ]
};

// Initialize DB in localStorage if not exists
function getDatabase() {
    const saved = localStorage.getItem('osis_db_2026');
    if (saved) {
        return JSON.parse(saved);
    }
    localStorage.setItem('osis_db_2026', JSON.stringify(defaultDatabase));
    return defaultDatabase;
}

function saveDatabase(db) {
    localStorage.setItem('osis_db_2026', JSON.stringify(db));
}

// Custom Popup Replacement for alert()
function showCustomAlert(title, message) {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) {
        document.getElementById('alert-title').innerText = title;
        document.getElementById('alert-message').innerText = message;
        modal.classList.remove('hidden');
    } else {
        alert(`${title}: ${message}`);
    }
}

function closeCustomAlert() {
    const modal = document.getElementById('custom-alert-modal');
    if (modal) modal.classList.add('hidden');
}

// Session State Handling
let selectedCandidatePending = null;

function handleLogin(event) {
    event.preventDefault();
    const inputId = document.getElementById('username').value.trim();
    const inputPass = document.getElementById('password').value.trim();

    const db = getDatabase();
    const user = db.users.find(u => u.id === inputId && u.pass === inputPass);

    if (user) {
        localStorage.setItem('osis_current_user', JSON.stringify(user));
        window.location.href = 'portal.html';
    } else {
        showCustomAlert("Gagal Masuk", "NIS/ID atau Password salah! Periksa kembali data Anda.");
    }
}

function handleLogout() {
    localStorage.removeItem('osis_current_user');
    window.location.href = 'index.html';
}

// Page Load Controller for portal.html & results.html
window.addEventListener('DOMContentLoaded', () => {
    const currentUserJson = localStorage.getItem('osis_current_user');
    const path = window.location.pathname;

    // Handle portal.html protection
    if (path.includes('portal.html')) {
        if (!currentUserJson) {
            window.location.href = 'index.html';
            return;
        }
        const user = JSON.parse(currentUserJson);
        document.getElementById('user-display-name').innerText = `${user.name} (${user.role.toUpperCase()})`;

        if (user.role === 'admin') {
            document.getElementById('admin-portal-view').classList.remove('hidden');
            document.getElementById('voter-portal-view').classList.add('hidden');
            renderAdminCandidates();
            renderAdminVotersTable();
        } else {
            document.getElementById('voter-portal-view').classList.remove('hidden');
            document.getElementById('admin-portal-view').classList.add('hidden');
            renderVoterDashboard();
        }
    }

    // Handle results.html standalone rendering
    if (path.includes('results.html')) {
        renderStandaloneResults();
    }
});

// Voter Dashboard Logic
function renderVoterDashboard() {
    const db = getDatabase();
    const currentUserJson = JSON.parse(localStorage.getItem('osis_current_user'));
    const user = db.users.find(u => u.id === currentUserJson.id);

    const grid = document.getElementById('voter-candidates-grid');
    if (!grid) return;
    grid.innerHTML = '';

    db.candidates.forEach(cand => {
        grid.innerHTML += `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                    <div class="flex justify-center space-x-2 mb-4">
                        <div class="w-20 h-24 bg-slate-100 rounded border flex items-center justify-center text-[10px] text-slate-400 font-medium">Foto Ketua</div>
                        <div class="w-20 h-24 bg-slate-100 rounded border flex items-center justify-center text-[10px] text-slate-400 font-medium">Foto Wakil</div>
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
    const s1 = document.getElementById('step-1-dot');
    const s2 = document.getElementById('step-2-dot');
    const s3 = document.getElementById('step-3-dot');
    const s4 = document.getElementById('step-4-dot');
    if (!s1) return;

    s1.className = step >= 1 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
    s2.className = step >= 2 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
    s3.className = step >= 3 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
    s4.className = step >= 4 ? "w-3 h-3 rounded-full bg-blue-600" : "w-3 h-3 rounded-full bg-slate-300";
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
    const currentUserJson = JSON.parse(localStorage.getItem('osis_current_user'));

    // Update candidate votes
    const targetCand = db.candidates.find(c => c.id === selectedCandidatePending.id);
    if (targetCand) targetCand.votes += 1;

    // Update user status
    const targetUser = db.users.find(u => u.id === currentUserJson.id);
    if (targetUser) {
        targetUser.voted = true;
        targetUser.votedFor = `Paslon 0${selectedCandidatePending.id}`;
        localStorage.setItem('osis_current_user', JSON.stringify(targetUser));
    }

    saveDatabase(db);
    document.getElementById('custom-confirm-modal').classList.add('hidden');
    setStepProgress(4);
    renderVoterDashboard();
    showCustomAlert("Berhasil", "Suara Anda berhasil disimpan ke database secara permanen!");
}

// Standalone Results Website Rendering
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

// Admin Panel Logic
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
    if (!list) return;
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
    const visionInput = document.getElementById(`admin-vision-${id}`).value;
    const parts = nameInput.split('&');

    const cand = db.candidates.find(c => c.id === id);
    if (cand) {
        if (parts.length >= 2) {
            cand.ketua = parts[0].trim();
            cand.wakil = parts[1].trim();
        }
        cand.vision = visionInput.trim();
        saveDatabase(db);
        showCustomAlert("Sukses", `Data Paslon 0${id} berhasil diperbarui di database!`);
    }
}

function renderAdminVotersTable(filterText = '') {
    const db = getDatabase();
    const tbody = document.getElementById('admin-voter-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filteredUsers = db.users.filter(u => u.role !== 'admin' && (u.id.toLowerCase().includes(filterText) || u.name.toLowerCase().includes(filterText)));

    filteredUsers.forEach(u => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-4 font-semibold text-slate-900">${u.id}</td>
                <td class="p-4 text-slate-700">${u.name}</td>
                <td class="p-4"><span class="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs uppercase font-medium">${u.role}</span></td>
                <td class="p-4">
                    ${u.voted ? 
                        '<span class="text-emerald-600 font-semibold text-xs">Sudah Memilih</span>' : 
                        '<span class="text-amber-600 font-semibold text-xs">Belum Memilih</span>'
                    }
                </td>
                <td class="p-4 text-slate-600 font-medium">${u.votedFor}</td>
                <td class="p-4 text-center">
                    ${u.voted ? 
                        `<button onclick="resetVoterAccount('${u.id}')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition shadow-sm">Unblock / Reset</button>` : 
                        `<span class="text-xs text-slate-400 italic">Normal</span>`
                    }
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
        
        // Subtract vote from target candidate count safely
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

function exportData(format) {
    showCustomAlert("Export Data", `Mengekspor laporan rekapitulasi sistem dalam format ${format.toUpperCase()}... File laporan akan segera diunduh otomatis.`);
}
