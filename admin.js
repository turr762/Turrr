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
    const kandidatRef = collection(db, "kandidat");
    onSnapshot(kandidatRef, (snapshot) => {
        document.getElementById('totalKandidat').innerText = snapshot.size;
    });

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

        document.getElementById('totalAkun').innerText = total;
        document.getElementById('sudahVoting').innerText = sudah;
        document.getElementById('belumVoting').innerText = belum;

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
            const kolomNIS = baris.cells[1];
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
    muatDataDashboard();
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
                muatDataDashboard();
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

onSnapshot(collection(db, "pemilihan"), (snapshot) => {
    let opsiHTML = '<option value="">-- Pilih Acara Pemilihan --</option>';
    snapshot.forEach((doc) => {
        opsiHTML += `<option value="${doc.id}">${doc.data().judul}</option>`;
    });
    if (selectPemilihanKandidat) selectPemilihanKandidat.innerHTML = opsiHTML;
});

onSnapshot(collection(db, "kandidat"), (snapshot) => {
    let tableHTML = "";
    if (snapshot.empty) {
        tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada kandidat terdaftar.</td></tr>';
    } else {
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
                        <!-- PERBAIKAN: Fungsi hapus sudah menggunakan parameter 'this' -->
                        <button onclick="window.hapusKandidat(this, '${data.id}')" class="btn" style="background-color: #dc3545; padding: 5px 10px; font-size: 12px; margin-bottom: 0; width: 100%;">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }
    if (tableKandidat) tableKandidat.innerHTML = tableHTML;
});

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
            jumlah_suara: 0 
        };

        try {
            if (idEdit === "") {
                await addDoc(collection(db, "kandidat"), dataBaru);
            } else {
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

// ==========================================
// PENGATURAN ACARA PEMILIHAN 
// ==========================================
const btnTambahPemilihan = document.getElementById('btnTambahPemilihan');
const formPemilihanContainer = document.getElementById('formPemilihanContainer');
const btnBatalPemilihan = document.getElementById('btnBatalPemilihan');
const formPemilihan = document.getElementById('formPemilihan');
const judulFormPemilihan = document.getElementById('judulFormPemilihan');
const tablePemilihan = document.getElementById('tablePemilihan');
const pesanErrorPemilihan = document.getElementById('pesanErrorPemilihan');

if (btnTambahPemilihan && btnBatalPemilihan) {
    btnTambahPemilihan.addEventListener('click', () => {
        formPemilihan.reset();
        document.getElementById('idPemilihanEdit').value = "";
        judulFormPemilihan.innerText = "Buat Acara Baru";
        formPemilihanContainer.style.display = "block";
        pesanErrorPemilihan.style.display = "none";
    });

    btnBatalPemilihan.addEventListener('click', () => {
        formPemilihanContainer.style.display = "none";
    });
}

onSnapshot(collection(db, "pemilihan"), (snapshot) => {
    let tableHTML = "";
    if (snapshot.empty) {
        tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada acara pemilihan.</td></tr>';
    } else {
        const waktuSekarang = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            const waktuMulai = new Date(data.tanggal_mulai);
            const waktuSelesai = new Date(data.tanggal_selesai);

            let status = "";
            let warnaStatus = "";
            if (waktuSekarang < waktuMulai) {
                status = "Belum Mulai";
                warnaStatus = "#f0ad4e";
            } else if (waktuSekarang >= waktuMulai && waktuSekarang <= waktuSelesai) {
                status = "Berlangsung";
                warnaStatus = "#28a745";
            } else {
                status = "Selesai";
                warnaStatus = "#dc3545";
            }

            const formatMulai = waktuMulai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
            const formatSelesai = waktuSelesai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });

            tableHTML += `
                <tr>
                    <td style="font-weight: bold;">${data.judul}</td>
                    <td style="font-size: 13px;">${formatMulai}</td>
                    <td style="font-size: 13px;">${formatSelesai}</td>
                    <td><span style="background-color: ${warnaStatus}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${status}</span></td>
                    <td>
                        <button onclick="window.editPemilihan('${doc.id}', '${data.judul}', '${data.tanggal_mulai}', '${data.tanggal_selesai}')" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-bottom: 5px; width: 100%;">Edit</button>
                        <button onclick="window.hapusPemilihan(this, '${doc.id}')" class="btn" style="background-color: #dc3545; padding: 5px 10px; font-size: 12px; margin-bottom: 0; width: 100%;">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }
    if (tablePemilihan) tablePemilihan.innerHTML = tableHTML;
});

if (formPemilihan) {
    formPemilihan.addEventListener('submit', async (e) => {
        e.preventDefault();

        pesanErrorPemilihan.style.display = "none";
        const btnSimpan = document.getElementById('btnSimpanPemilihan');
        btnSimpan.innerText = "Menyimpan...";
        btnSimpan.disabled = true;

        const idEdit = document.getElementById('idPemilihanEdit').value;
        const dataBaru = {
            judul: document.getElementById('judulPemilihan').value,
            tanggal_mulai: document.getElementById('waktuMulaiPemilihan').value,
            tanggal_selesai: document.getElementById('waktuSelesaiPemilihan').value
        };

        try {
            if (idEdit === "") {
                await addDoc(collection(db, "pemilihan"), dataBaru);
            } else {
                const pemilihanRef = doc(db, "pemilihan", idEdit);
                await updateDoc(pemilihanRef, dataBaru);
            }
            formPemilihan.reset();
            formPemilihanContainer.style.display = "none";
        } catch (error) {
            console.error("Error simpan pemilihan: ", error);
            pesanErrorPemilihan.innerText = "Gagal menyimpan data ke database.";
            pesanErrorPemilihan.style.display = "block";
        } finally {
            btnSimpan.innerText = "Simpan";
            btnSimpan.disabled = false;
        }
    });
}

window.editPemilihan = (id, judul, mulai, selesai) => {
    judulFormPemilihan.innerText = "Edit Acara Pemilihan";
    document.getElementById('idPemilihanEdit').value = id;
    document.getElementById('judulPemilihan').value = judul;
    document.getElementById('waktuMulaiPemilihan').value = mulai;
    document.getElementById('waktuSelesaiPemilihan').value = selesai;

    formPemilihanContainer.style.display = "block";
    formPemilihanContainer.scrollIntoView({ behavior: 'smooth' });
};

// ==========================================
// FUNGSI GLOBAL HAPUS (TANPA ALERT)
// ==========================================
window.hapusPemilihan = async (btn, id) => {
    btn.innerText = "Menghapus...";
    btn.disabled = true;
    try {
        await deleteDoc(doc(db, "pemilihan", id));
    } catch (error) {
        console.error("Error hapus pemilihan: ", error);
        btn.innerText = "Hapus";
        btn.disabled = false;
    }
};

window.hapusKandidat = async (btn, id) => {
    btn.innerText = "Menghapus...";
    btn.disabled = true;
    try {
        await deleteDoc(doc(db, "kandidat", id));
    } catch (error) {
        console.error("Error hapus kandidat: ", error);
        btn.innerText = "Hapus";
        btn.disabled = false;
    }
};
