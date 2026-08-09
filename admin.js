import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
// ==========================================
// KELOLA KANDIDAT (TAMBAH, EDIT, HAPUS)
// ==========================================
const btnTambahKandidat = document.getElementById('btnTambahKandidat');
const formKandidatContainer = document.getElementById('formKandidatContainer');
const btnBatalKandidat = document.getElementById('btnBatalKandidat');
const formKandidat = document.getElementById('formKandidat');
const judulFormKandidat = document.getElementById('judulFormKandidat');
const tableKandidat = document.getElementById('tableKandidat');
const selectPemilihanKandidat = document.getElementById('pemilihanKandidat');

// 1. Munculkan & Sembunyikan Form
if (btnTambahKandidat && btnBatalKandidat) {
    btnTambahKandidat.addEventListener('click', () => {
        formKandidat.reset();
        document.getElementById('idKandidatEdit').value = "";
        judulFormKandidat.innerText = "Tambah Kandidat Baru";
        formKandidatContainer.style.display = "block";
    });

    btnBatalKandidat.addEventListener('click', () => {
        formKandidatContainer.style.display = "none";
    });
}

// 2. Ambil Pilihan "Pemilihan/Acara" untuk Dropdown
onSnapshot(collection(db, "pemilihan"), (snapshot) => {
    let opsiHTML = '<option value="">-- Pilih Acara Pemilihan --</option>';
    snapshot.forEach((doc) => {
        opsiHTML += `<option value="${doc.id}">${doc.data().judul}</option>`;
    });
    if (selectPemilihanKandidat) selectPemilihanKandidat.innerHTML = opsiHTML;
});

// 3. Tampilkan Data Kandidat di Tabel (Real-time)
onSnapshot(collection(db, "kandidat"), (snapshot) => {
    let tableHTML = "";
    if (snapshot.empty) {
        tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada kandidat terdaftar.</td></tr>';
    } else {
        // Mengurutkan berdasarkan nomor urut (terkecil ke terbesar)
        const dataKandidat = [];
        snapshot.forEach(doc => dataKandidat.push({ id: doc.id, ...doc.data() }));
        dataKandidat.sort((a, b) => a.no_urut - b.no_urut);

        dataKandidat.forEach(data => {
            tableHTML += `
                <tr>
                    <td style="font-weight: bold; font-size: 18px; text-align: center;">${data.no_urut}</td>
                    <td><img src="${data.foto}" alt="Foto ${data.nama}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;"></td>
                    <td style="font-weight: bold;">${data.nama}</td>
                    <td style="font-size: 12px;">
                        <strong>Visi:</strong> ${data.visi.substring(0, 30)}... <br>
                        <strong>Misi:</strong> ${data.misi.substring(0, 30)}...
                    </td>
                    <td>
                        <button onclick="window.editKandidat('${data.id}', '${data.no_urut}', '${data.nama}', '${data.foto}', '${data.visi}', '${data.misi}', '${data.id_pemilihan}')" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-bottom: 5px; width: 100%;">Edit</button>
                        <button onclick="window.hapusKandidat('${data.id}', '${data.nama}')" class="btn" style="background-color: #dc3545; padding: 5px 10px; font-size: 12px; margin-bottom: 0; width: 100%;">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }
    if (tableKandidat) tableKandidat.innerHTML = tableHTML;
});

// 4. Proses Simpan (Tambah / Edit)
if (formKandidat) {
    formKandidat.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btnSimpan = document.getElementById('btnSimpanKandidat');
        btnSimpan.innerText = "Menyimpan...";
        btnSimpan.disabled = true;

        const idEdit = document.getElementById('idKandidatEdit').value;
        const dataBaru = {
            no_urut: parseInt(document.getElementById('noUrutKandidat').value),
            nama: document.getElementById('namaKandidat').value,
            foto: document.getElementById('fotoKandidat').value,
            visi: document.getElementById('visiKandidat').value,
            misi: document.getElementById('misiKandidat').value,
            id_pemilihan: document.getElementById('pemilihanKandidat').value,
            jumlah_suara: 0 // Default awal
        };

        try {
            if (idEdit === "") {
                // Mode Tambah Baru
                await addDoc(collection(db, "kandidat"), dataBaru);
            } else {
                // Mode Edit (jumlah suara tidak diubah saat edit profil)
                delete dataBaru.jumlah_suara; 
                const kandidatRef = doc(db, "kandidat", idEdit);
                await updateDoc(kandidatRef, dataBaru);
            }
            formKandidat.reset();
            formKandidatContainer.style.display = "none";
        } catch (error) {
            console.error("Error simpan kandidat: ", error);
            alert("Gagal menyimpan data kandidat!");
        } finally {
            btnSimpan.innerText = "Simpan";
            btnSimpan.disabled = false;
        }
    });
}

// 5. Fungsi Global untuk Tombol Edit & Hapus (Dipanggil dari HTML HTML)
window.editKandidat = (id, no_urut, nama, foto, visi, misi, id_pemilihan) => {
    judulFormKandidat.innerText = "Edit Data Kandidat";
    document.getElementById('idKandidatEdit').value = id;
    document.getElementById('noUrutKandidat').value = no_urut;
    document.getElementById('namaKandidat').value = nama;
    document.getElementById('fotoKandidat').value = foto;
    document.getElementById('visiKandidat').value = visi;
    document.getElementById('misiKandidat').value = misi;
    document.getElementById('pemilihanKandidat').value = id_pemilihan;
    
    formKandidatContainer.style.display = "block";
    formKandidatContainer.scrollIntoView({ behavior: 'smooth' });
};

window.hapusKandidat = async (id, nama) => {
    const konfirmasi = confirm(`Yakin ingin menghapus kandidat ${nama}? Seluruh suaranya akan ikut terhapus.`);
    if (konfirmasi) {
        try {
            await deleteDoc(doc(db, "kandidat", id));
            // Catatan: Logika pengurangan/penghapusan data di riwayat_suara bisa ditambahkan nanti di sini jika dibutuhkan.
        } catch (error) {
            console.error("Error hapus kandidat: ", error);
            alert("Gagal menghapus data!");
        }
    }
};
