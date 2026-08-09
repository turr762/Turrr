import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1Ab-K6ehYQZbjX-QxJQiodqSajGPFdmE",
    authDomain: "pemilihan-ketos-2627.firebaseapp.com",
    projectId: "pemilihan-ketos-2627",
    storageBucket: "pemilihan-ketos-2627.firebasestorage.app",
    messagingSenderId: "924205874158",
    appId: "1:924205874158:web:be0bab0495c02d1182acff"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const formLoginAdmin = document.getElementById('formLoginAdmin');
const pesanError = document.getElementById('pesanError');
const adminMenuLinks = document.querySelectorAll('#adminMenu a[data-target]');
const contentSections = document.querySelectorAll('.content-section');
const judulHalaman = document.getElementById('judulHalaman');
const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

// ==========================================
// FUNGSI MUAT DATA DASHBOARD (REAL-TIME)
// ==========================================
function muatDataDashboard() {
    // 1. Ambil Total Kandidat
    const kandidatRef = collection(db, "kandidat");
    onSnapshot(kandidatRef, (snapshot) => {
        document.getElementById('totalKandidat').innerText = snapshot.size;
    });

    // 2. Ambil Data Voter (Total, Sudah Voting, Belum Voting, & Tabel)
    const voterRef = collection(db, "voter");
    onSnapshot(voterRef, (snapshot) => {
        let total = snapshot.size;
        let sudah = 0;
        let belum = 0;
        let tableHTML = "";
        let no = 1;

        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.sudah_voting === true) {
                sudah++;
            } else {
                belum++;
                // Masukkan ke tabel belum voting
                tableHTML += `
                    <tr>
                        <td>${no++}</td>
                        <td>${data.nis || '-'}</td>
                        <td>${data.nama || '-'}</td>
                        <td>${data.kelas || '-'}</td>
                    </tr>
                `;
            }
        });

        // Update Kotak Statistik
        document.getElementById('totalAkun').innerText = total;
        document.getElementById('sudahVoting').innerText = sudah;
        document.getElementById('belumVoting').innerText = belum;

        // Update Tabel
        const tbody = document.getElementById('tableBelumVoting');
        if (belum === 0 && total > 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Semua pemilih sudah menggunakan hak suaranya!</td></tr>';
        } else if (total === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada data pemilih.</td></tr>';
        } else {
            tbody.innerHTML = tableHTML;
        }
    });
}

// ==========================================
// FITUR PENCARIAN (SEARCH NIS) DI TABEL
// ==========================================
const searchNIS = document.getElementById('searchNISBelumVoting');
if (searchNIS) {
    searchNIS.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const barisTabel = document.querySelectorAll('#tableBelumVoting tr');
        
        barisTabel.forEach(baris => {
            const kolomNIS = baris.cells[1]; // Kolom NIS ada di urutan ke-2 (index 1)
            if (kolomNIS) {
                const teksNIS = kolomNIS.innerText.toLowerCase();
                baris.style.display = teksNIS.includes(keyword) ? '' : 'none';
            }
        });
    });
}

// ==========================================
// CEK STATUS LOGIN SAAT HALAMAN DIBUKA
// ==========================================
if (sessionStorage.getItem("adminLoggedIn") === "true") {
    loginSection.style.display = "none";
    dashboardSection.style.display = "flex";
    muatDataDashboard(); // Panggil data dashboard jika sudah login
}

// ==========================================
// LOGIKA LOGIN ADMIN
// ==========================================
if (formLoginAdmin) {
    formLoginAdmin.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        pesanError.style.display = "none";
        pesanError.innerText = "";
        
        const nis = document.getElementById('nisAdmin').value;
        const pass = document.getElementById('passAdmin').value;

        const btnSubmit = formLoginAdmin.querySelector('button');
        const originalText = btnSubmit.innerText;
        btnSubmit.innerText = "Memproses...";
        btnSubmit.disabled = true;

        try {
            const adminRef = collection(db, "admin");
            const q = query(adminRef, where("nis", "==", nis), where("password", "==", pass));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                sessionStorage.setItem("adminLoggedIn", "true");
                loginSection.style.display = "none";
                dashboardSection.style.display = "flex";
                formLoginAdmin.reset();
                muatDataDashboard(); // Panggil data dashboard setelah berhasil login
            } else {
                pesanError.innerText = "NIS atau Password salah!";
                pesanError.style.display = "block";
            }
        } catch (error) {
            console.error("Error saat login admin: ", error);
            pesanError.innerText = "Terjadi kesalahan sistem, coba lagi.";
            pesanError.style.display = "block";
        } finally {
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    });
}

// ==========================================
// LOGIKA NAVIGASI MENU (SPA)
// ==========================================
adminMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); 
        
        // Jangan jalankan kalau yang diklik adalah tombol Logout
        if (link.id === 'btnLogoutAdmin') return; 

        const targetId = link.getAttribute('data-target');

        contentSections.forEach(section => {
            section.style.display = 'none';
        });
        adminMenuLinks.forEach(menu => {
            menu.classList.remove('active');
        });

        document.getElementById(targetId).style.display = 'block';
        link.classList.add('active');
        judulHalaman.innerText = link.innerText.replace(/[0-9].\s/, ''); 
    });
});

// ==========================================
// LOGIKA LOGOUT ADMIN
// ==========================================
if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem("adminLoggedIn");
        dashboardSection.style.display = "none";
        loginSection.style.display = "block";
        
        // Kembalikan ke menu pertama (Dashboard) agar rapi saat login lagi
        adminMenuLinks[0].click();
    });
}
