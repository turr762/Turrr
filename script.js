let currentUser = null;
let isSubmitting = false;

window.addEventListener('DOMContentLoaded', async () => {
    const savedUserId = localStorage.getItem("current_user_id");
    if (savedUserId) {
        try {
            const userRef = window.FS.doc(window.db, "users", savedUserId);
            const userSnap = await window.FS.getDoc(userRef);
            if (userSnap.exists()) {
                currentUser = { id: userSnap.id, ...userSnap.data() };
                loadAppDashboard();
            }
        } catch (e) {
            console.error("Session restore error:", e);
        }
    }
});

// 1. Handle Login Authentication (Case-Insensitive NIS Lookup)
async function handleLogin(event) {
    event.preventDefault();
    const rawInput = document.getElementById('username').value.trim();
    const nis = rawInput.toLowerCase(); 
    const pass = document.getElementById('password').value.trim();

    try {
        const userRef = window.FS.doc(window.db, "users", nis);
        const userSnap = await window.FS.getDoc(userRef);

        if (!userSnap.exists()) {
            showAlert("Login Gagal", "NIS / ID Akun tidak ditemukan di database!");
            return;
        }

        const userData = userSnap.data();
        if (userData.password !== pass) {
            showAlert("Login Gagal", "Kata sandi yang Anda masukkan salah!");
            return;
        }

        currentUser = { id: nis, ...userData };
        localStorage.setItem("current_user_id", nis);
        loadAppDashboard();

    } catch (error) {
        console.error("Login error:", error);
        showAlert("Error", "Terjadi kesalahan koneksi ke server Firebase.");
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem("current_user_id");
    document.getElementById('view-app-container').classList.add('hidden');
    document.getElementById('view-login').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

async function loadAppDashboard() {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-app-container').classList.remove('hidden');
    document.getElementById('user-display-name').textContent = `${currentUser.name} (${currentUser.role.toUpperCase()})`;

    if (currentUser.role === 'admin') {
        document.getElementById('subview-voter').classList.add('hidden');
        document.getElementById('subview-admin').classList.remove('hidden');
        loadAdminCandidates();
        loadAdminVotersTable();
    } else {
        document.getElementById('subview-admin').classList.add('hidden');
        document.getElementById('subview-voter').classList.remove('hidden');
        await renderVoterPortal();
    }
}

// 3. Voter Portal Render & Voting Logic
async function renderVoterPortal() {
    const banner = document.getElementById('voting-status-banner');
    const grid = document.getElementById('voter-candidates-grid');

    document.getElementById('step-1-dot').className = "w-3 h-3 rounded-full bg-blue-600";
    document.getElementById('step-2-dot').className = "w-3 h-3 rounded-full bg-blue-600";

    if (currentUser.hasVoted) {
        document.getElementById('step-3-dot').className = "w-3 h-3 rounded-full bg-blue-600";
        banner.className = "p-4 rounded-xl text-center font-medium text-sm bg-emerald-50 text-emerald-800 border border-emerald-200";
        banner.textContent = "Status: Terima kasih! Anda sudah menggunakan hak suara Anda.";
    } else {
        banner.className = "p-4 rounded-xl text-center font-medium text-sm bg-amber-50 text-amber-800 border border-amber-200";
        banner.textContent = "Status: Anda belum menggunakan hak suara. Silakan pilih kandidat di bawah.";
    }

    try {
        const querySnapshot = await window.FS.getDocs(window.FS.collection(window.db, "candidates"));
        let html = "";
        querySnapshot.forEach((docSnap) => {
            const c = docSnap.data();
            const cId = docSnap.id;
            const objectPosition = c.objectPosition || 'center center';
            html += `
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                    <div>
                        <div class="h-56 bg-slate-200 rounded-xl mb-4 overflow-hidden flex items-center justify-center text-slate-400 font-semibold relative">
                            ${c.photoUrl ? `<img src="${c.photoUrl}" style="object-position: ${objectPosition};" class="w-full h-full object-cover">` : `Paslon ${cId}`}
                        </div>
                        <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Nomor Urut ${cId}</span>
                        <h4 class="text-lg font-bold text-slate-900 mt-1">${c.names}</h4>
                        <p class="text-xs text-slate-600 mt-2 line-clamp-4"><strong>Visi & Misi:</strong> ${c.vision || '-'}</p>
                    </div>
                    <button onclick="${currentUser.hasVoted ? `showAlert('Info', 'Anda sudah memilih!')` : `openConfirmModal('${cId}', '${c.names}')`}" 
                        class="mt-5 w-full py-2.5 ${currentUser.hasVoted ? 'bg-slate-300 cursor-not-allowed text-slate-600' : 'bg-blue-600 hover:bg-blue-700 text-white shadow'} font-semibold rounded-xl transition">
                        ${currentUser.hasVoted ? 'Sudah Memilih' : 'Pilih Kandidat Ini'}
                    </button>
                </div>
            `;
        });
        grid.innerHTML = html;
    } catch (e) {
        console.error("Error loading candidates:", e);
    }
}

let pendingVoteCandidateId = null;

function openConfirmModal(candidateId, candidateNames) {
    pendingVoteCandidateId = candidateId;
    document.getElementById('modal-candidate-title').textContent = `Paslon ${candidateId}`;
    document.getElementById('modal-candidate-names').textContent = candidateNames;
    document.getElementById('modal-candidate-bold-name').textContent = candidateNames;
    document.getElementById('custom-confirm-modal').classList.remove('hidden');
}

function closeConfirmModal() {
    pendingVoteCandidateId = null;
    document.getElementById('custom-confirm-modal').classList.add('hidden');
}

// 4. Execute Final Vote with Immediate Redirection Back to Login Screen (No Browser Alert)
async function executeFinalVote() {
    if (isSubmitting) return; 
    isSubmitting = true;

    const selectedCandidateId = pendingVoteCandidateId;
    if (!selectedCandidateId || !currentUser) {
        isSubmitting = false;
        return;
    }

    try {
        const userRef = window.FS.doc(window.db, "users", currentUser.id);
        const freshUserSnap = await window.FS.getDoc(userRef);

        if (freshUserSnap.data().hasVoted) {
            showAlert("Akses Ditolak", "Anda sudah menggunakan hak suara sebelumnya!");
            closeConfirmModal();
            isSubmitting = false;
            return;
        }

        await window.FS.updateDoc(userRef, {
            hasVoted: true,
            votedCandidate: selectedCandidateId
        });

        const candidateRef = window.FS.doc(window.db, "candidates", selectedCandidateId);
        const candidateSnap = await window.FS.getDoc(candidateRef);
        const currentVotes = candidateSnap.exists() ? (candidateSnap.data().votes || 0) : 0;

        await window.FS.updateDoc(candidateRef, {
            votes: currentVotes + 1
        });

        closeConfirmModal();
        
        // Immediately clear session and return to login without pop-up alerts
        localStorage.removeItem("current_user_id");
        currentUser = null;
        isSubmitting = false;

        document.getElementById('view-app-container').classList.add('hidden');
        document.getElementById('view-login').classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';

    } catch (error) {
        console.error("Voting error:", error);
        showAlert("Gagal", "Gagal menyimpan suara. Periksa koneksi internet Anda.");
        isSubmitting = false;
    }
}

// 5. Admin Panel & Candidate Management Features (File Upload & Interactive Frame Adjustment)
function switchAdminTab(tabName) {
    const candBtn = document.getElementById('admin-tab-candidates');
    const voterBtn = document.getElementById('admin-tab-voters');
    const candPage = document.getElementById('admin-page-candidates');
    const voterPage = document.getElementById('admin-page-voters');

    if (tabName === 'candidates') {
        candBtn.className = "px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm shadow";
        voterBtn.className = "px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg text-sm";
        candPage.classList.remove('hidden');
        voterPage.classList.add('hidden');
    } else {
        voterBtn.className = "px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm shadow";
        candBtn.className = "px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium rounded-lg text-sm";
        voterPage.classList.remove('hidden');
        candPage.classList.add('hidden');
    }
}

async function loadAdminCandidates() {
    try {
        const querySnapshot = await window.FS.getDocs(window.FS.collection(window.db, "candidates"));
        let html = "";
        querySnapshot.forEach((docSnap) => {
            const c = docSnap.data();
            const id = docSnap.id;
            const currentPosition = c.objectPosition || 'center center';
            
            html += `
                <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 class="font-bold text-slate-900 text-base">Paslon ${id}: ${c.names}</h4>
                        <span class="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">Total Suara: ${c.votes || 0}</span>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <!-- Profile Crop Frame Preview Box -->
                        <div class="space-y-2 flex flex-col items-center">
                            <label class="block text-xs font-semibold text-slate-700">Preview Area Crop (Fixed Frame)</label>
                            <div class="w-40 h-48 bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
                                ${c.photoUrl ? `<img id="preview-img-${id}" src="${c.photoUrl}" style="object-position: ${currentPosition};" class="w-full h-full object-cover">` : `<span class="text-xs text-slate-400">Belum ada foto</span>`}
                            </div>
                        </div>

                        <!-- Form Controls -->
                        <div class="md:col-span-2 space-y-4">
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Ubah Visi & Misi</label>
                                <textarea id="vision-${id}" rows="2" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500">${c.vision || ''}</textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Unggah Foto dari Perangkat (File Manager)</label>
                                <input type="file" id="file-${id}" accept="image/*" onchange="previewLocalImage(event, '${id}')" class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50">
                                <input type="hidden" id="photourl-${id}" value="${c.photoUrl || ''}">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-slate-700 mb-1">Atur Posisi Tampilan Gambar (Framing / Crop Position)</label>
                                <select id="pos-${id}" onchange="updatePreviewPosition('${id}')" class="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white">
                                    <option value="center center" ${currentPosition === 'center center' ? 'selected' : ''}>Tengah (Center)</option>
                                    <option value="top center" ${currentPosition === 'top center' ? 'selected' : ''}>Geser ke Atas (Top)</option>
                                    <option value="bottom center" ${currentPosition === 'bottom center' ? 'selected' : ''}>Geser ke Bawah (Bottom)</option>
                                    <option value="center left" ${currentPosition === 'center left' ? 'selected' : ''}>Geser ke Kiri (Left)</option>
                                    <option value="center right" ${currentPosition === 'center right' ? 'selected' : ''}>Geser ke Kanan (Right)</option>
                                </select>
                            </div>
                            <button onclick="saveCandidateChanges('${id}')" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition shadow">
                                Simpan Perubahan Kandidat ${id}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        document.getElementById('admin-candidates-list').innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}

// Convert uploaded image file into Base64 string for storage and instant live preview
function previewLocalImage(event, id) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64String = e.target.result;
        document.getElementById(`photourl-${id}`).value = base64String;
        
        const previewImg = document.getElementById(`preview-img-${id}`);
        if (previewImg) {
            previewImg.src = base64String;
        } else {
            // Re-render container preview if none existed before
            loadAdminCandidates();
        }
    };
    reader.readAsDataURL(file);
}

function updatePreviewPosition(id) {
    const selectedPos = document.getElementById(`pos-${id}`).value;
    const previewImg = document.getElementById(`preview-img-${id}`);
    if (previewImg) {
        previewImg.style.objectPosition = selectedPos;
    }
}

async function saveCandidateChanges(id) {
    const newVision = document.getElementById(`vision-${id}`).value;
    const newPhotoUrl = document.getElementById(`photourl-${id}`).value;
    const newPosition = document.getElementById(`pos-${id}`).value;

    try {
        const candidateRef = window.FS.doc(window.db, "candidates", id);
        await window.FS.updateDoc(candidateRef, {
            vision: newVision,
            photoUrl: newPhotoUrl,
            objectPosition: newPosition
        });
        showAlert("Berhasil", `Data Paslon ${id} berhasil diperbarui!`);
        loadAdminCandidates();
    } catch (e) {
        console.error(e);
        showAlert("Gagal", "Gagal menyimpan pengaturan kandidat.");
    }
}

async function loadAdminVotersTable() {
    try {
        const querySnapshot = await window.FS.getDocs(window.FS.collection(window.db, "users"));
        window.allVotersData = [];
        querySnapshot.forEach((docSnap) => {
            window.allVotersData.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderVoterTableRows(window.allVotersData);
    } catch (e) {
        console.error(e);
    }
}

function renderVoterTableRows(data) {
    const tbody = document.getElementById('admin-voter-table-body');
    let html = "";
    data.forEach(v => {
        html += `
            <tr class="hover:bg-slate-50 border-b border-slate-100">
                <td class="p-4 font-mono text-xs text-slate-600">${v.id}</td>
                <td class="p-4 font-medium text-slate-900">${v.name}</td>
                <td class="p-4"><span class="px-2 py-1 bg-slate-100 rounded text-xs uppercase">${v.role}</span></td>
                <td class="p-4">
                    ${v.hasVoted ? '<span class="text-emerald-600 font-semibold text-xs">Sudah Voted</span>' : '<span class="text-amber-600 text-xs">Belum</span>'}
                </td>
                <td class="p-4 text-xs font-medium text-indigo-600">${v.votedCandidate ? 'Paslon ' + v.votedCandidate : '-'}</td>
                <td class="p-4 text-center">
                    ${v.hasVoted ? `<button onclick="resetVoterStatus('${v.id}')" class="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded transition">Reset Status</button>` : '<span class="text-slate-400 text-xs">-</span>'}
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function filterVoterTable() {
    const keyword = document.getElementById('voter-search-input').value.toLowerCase();
    const filtered = window.allVotersData.filter(v => v.id.toLowerCase().includes(keyword) || v.name.toLowerCase().includes(keyword));
    renderVoterTableRows(filtered);
}

// Reset voter status and safely remove their exact vote from the candidate they chose
async function resetVoterStatus(nis) {
    try {
        const userRef = window.FS.doc(window.db, "users", nis);
        const userSnap = await window.FS.getDoc(userRef);

        if (!userSnap.exists()) {
            showAlert("Gagal", "Data pengguna tidak ditemukan.");
            return;
        }

        const userData = userSnap.data();
        const votedCandidateId = userData.votedCandidate;

        await window.FS.updateDoc(userRef, {
            hasVoted: false,
            votedCandidate: null
        });

        if (votedCandidateId) {
            const candidateRef = window.FS.doc(window.db, "candidates", votedCandidateId);
            const candidateSnap = await window.FS.getDoc(candidateRef);

            if (candidateSnap.exists()) {
                const currentVotes = candidateSnap.data().votes || 0;
                const updatedVotes = Math.max(0, currentVotes - 1);

                await window.FS.updateDoc(candidateRef, {
                    votes: updatedVotes
                });
            }
        }

        showAlert("Berhasil", `Status pemilih ${nis} berhasil direset dan suara dari kandidat pilihannya telah ditarik.`);
        loadAdminVotersTable();
    } catch (e) {
        console.error("Error resetting voter:", e);
        showAlert("Gagal", "Terjadi kesalahan saat mereset status pemilih.");
    }
}

function showAlert(title, message) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    document.getElementById('custom-alert-modal').classList.remove('hidden');
}

function closeCustomAlert() {
    document.getElementById('custom-alert-modal').classList.add('hidden');
}
