import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

// ==========================================
// ELEMEN HTML GLOBAL
// ==========================================
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
// FITUR PENCARIAN DASHBOARD
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
// CEK LOGIN SAAT HALAMAN DIBUKA
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
            console.error("Error saat login: ", error);
            pesanError.innerText = "Terjadi kesalahan sistem, coba lagi.";
            pesanError.style.display = "block";
        } finally {
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    });
}

// ==========================================
// NAVIGASI SPA & LOGOUT
// ==========================================
adminMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (link.id === 'btnLogoutAdmin') return; 

        const targetId = link.getAttribute('data-target');
        contentSections.forEach(section => section.style.display = 'none');
        adminMenuLinks.forEach(menu => menu.classList.remove('active'));

        document.getElementById(targetId).style.display = 'block';
        link.classList.add('active');
        judulHalaman.innerText = link.innerText.replace(/[0-9].\s/, ''); 
    });
});

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
// 1. KELOLA KANDIDAT
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
    btnBatalKandidat.addEventListener('click', () => formKandidatContainer.style.display = "none");
}

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
                await updateDoc(doc(db, "kandidat", idEdit), dataBaru);
            }
            formKandidat.reset();
            formKandidatContainer.style.display = "none";
        } catch (error) {
            console.error(error);
            alert("Gagal menyimpan data kandidat!");
        } finally {
            btnSimpan.innerText = "Simpan";
            btnSimpan.disabled = false;
        }
    });
}

// ==========================================
// 2. KELOLA VOTER (MANUAL & IMPORT EXCEL)
// ==========================================
const btnTambahVoter = document.getElementById('btnTambahVoter');
const formVoterContainer = document.getElementById('formVoterContainer');
const btnBatalVoter = document.getElementById('btnBatalVoter');
const formVoter = document.getElementById('formVoter');
const judulFormVoter = document.getElementById('judulFormVoter');
const tableDataVoter = document.getElementById('tableDataVoter');
const selectPemilihanVoter = document.getElementById('pemilihanVoterInput');
const roleVoterInput = document.getElementById('roleVoterInput');
const kelasVoterInput = document.getElementById('kelasVoterInput');
const absenVoterInput = document.getElementById('absenVoterInput');
const fileExcelVoter = document.getElementById('fileExcelVoter');
const pesanImportVoter = document.getElementById('pesanImportVoter');

if (btnTambahVoter && btnBatalVoter) {
    btnTambahVoter.addEventListener('click', () => {
        formVoter.reset();
        document.getElementById('idVoterEdit').value = "";
        judulFormVoter.innerText = "Tambah Voter Baru";
        formVoterContainer.style.display = "block";
        kelasVoterInput.disabled = false;
        absenVoterInput.disabled = false;
    });
    btnBatalVoter.addEventListener('click', () => formVoterContainer.style.display = "none");
}

if (roleVoterInput) {
    roleVoterInput.addEventListener('change', (e) => {
        if (e.target.value === "Guru" || e.target.value === "Tata Usaha") {
            kelasVoterInput.value = "-";
            absenVoterInput.value = "";
            kelasVoterInput.disabled = true;
            absenVoterInput.disabled = true;
            kelasVoterInput.style.backgroundColor = "#e9ecef";
            absenVoterInput.style.backgroundColor = "#e9ecef";
        } else {
            kelasVoterInput.value = "";
            kelasVoterInput.disabled = false;
            absenVoterInput.disabled = false;
            kelasVoterInput.style.backgroundColor = "#fff";
            absenVoterInput.style.backgroundColor = "#fff";
        }
    });
}

onSnapshot(collection(db, "voter"), (snapshot) => {
    let tableHTML = "";
    if (snapshot.empty) {
        tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada voter terdaftar.</td></tr>';
    } else {
        snapshot.forEach(doc => {
            const data = doc.data();
            let textStatus = data.is_active ? "Aktif" : "Nonaktif";
            let warnaStatus = data.is_active ? "#28a745" : "#dc3545";
            let infoKelas = data.role === "Siswa" ? `Kelas: ${data.kelas || '-'}` : '';

            tableHTML += `
                <tr>
                    <td style="font-weight: bold;">${data.nis}</td>
                    <td>${data.nama}</td>
                    <td style="font-size: 13px;"><strong>${data.role}</strong><br>${infoKelas}</td>
                    <td><span style="background-color: ${warnaStatus}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${textStatus}</span></td>
                    <td>
                        <button onclick="window.editVoter('${doc.id}', '${data.nis}', '${data.password}', '${data.nama}', '${data.role}', '${data.kelas}', '${data.no_absen}', '${data.id_pemilihan}')" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-bottom: 5px; width: 100%;">Edit</button>
                        <button onclick="window.toggleStatusVoter(this, '${doc.id}', ${data.is_active})" class="btn" style="background-color: ${data.is_active ? '#f0ad4e' : '#28a745'}; padding: 5px 10px; font-size: 12px; margin-bottom: 5px; width: 100%;">${data.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
                        <button onclick="window.hapusVoter(this, '${doc.id}')" class="btn" style="background-color: #dc3545; padding: 5px 10px; font-size: 12px; margin-bottom: 0; width: 100%;">Hapus</button>
                    </td>
                </tr>
            `;
        });
    }
    if (tableDataVoter) tableDataVoter.innerHTML = tableHTML;
});

const searchDataVoter = document.getElementById('searchDataVoter');
if (searchDataVoter) {
    searchDataVoter.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const barisTabel = document.querySelectorAll('#tableDataVoter tr');
        barisTabel.forEach(baris => {
            const kolomNIS = baris.cells[0]; 
            const kolomNama = baris.cells[1];
            if (kolomNIS && kolomNama) {
                const teksBaris = kolomNIS.innerText.toLowerCase() + " " + kolomNama.innerText.toLowerCase();
                baris.style.display = teksBaris.includes(keyword) ? '' : 'none';
            }
        });
    });
}

if (formVoter) {
    formVoter.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSimpan = document.getElementById('btnSimpanVoter');
        btnSimpan.innerText = "Menyimpan...";
        btnSimpan.disabled = true;

        const idEdit = document.getElementById('idVoterEdit').value;
        const roleVal = document.getElementById('roleVoterInput').value;
        
        const dataBaru = {
            nis: document.getElementById('nisVoterInput').value,
            password: document.getElementById('passVoterInput').value,
            nama: document.getElementById('namaVoterInput').value,
            role: roleVal,
            kelas: roleVal === "Siswa" ? document.getElementById('kelasVoterInput').value : "-",
            no_absen: roleVal === "Siswa" ? parseInt(document.getElementById('absenVoterInput').value) : null,
            id_pemilihan: document.getElementById('pemilihanVoterInput').value,
        };

        try {
            if (idEdit === "") {
                dataBaru.is_active = true;
                dataBaru.sudah_voting = false;
                await addDoc(collection(db, "voter"), dataBaru);
            } else {
                await updateDoc(doc(db, "voter", idEdit), dataBaru);
            }
            formVoter.reset();
            formVoterContainer.style.display = "none";
        } catch (error) {
            console.error(error);
        } finally {
            btnSimpan.innerText = "Simpan";
            btnSimpan.disabled = false;
        }
    });
}

if (fileExcelVoter) {
    fileExcelVoter.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        pesanImportVoter.style.display = "block";
        pesanImportVoter.style.color = "#0056b3";
        pesanImportVoter.innerText = "Sedang membaca file Excel...";

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                
                if (excelData.length === 0) {
                    pesanImportVoter.innerText = "File Excel kosong!";
                    pesanImportVoter.style.color = "red";
                    return;
                }

                pesanImportVoter.innerText = `Menyimpan ${excelData.length} data ke database. Mohon tunggu...`;

                for (let i = 0; i < excelData.length; i++) {
                    const baris = excelData[i];
                    const dataBaru = {
                        nis: String(baris.nis || ""),
                        password: String(baris.password || ""),
                        nama: String(baris.nama || ""),
                        role: String(baris.role || "Siswa"),
                        kelas: String(baris.role) === "Siswa" ? String(baris.kelas || "") : "-",
                        no_absen: String(baris.role) === "Siswa" ? parseInt(baris.no_absen || 0) : null,
                        id_pemilihan: String(baris.id_pemilihan || ""),
                        is_active: true,
                        sudah_voting: false
                    };
                    if (dataBaru.nis !== "") {
                        await addDoc(collection(db, "voter"), dataBaru);
                    }
                }

                pesanImportVoter.innerText = "Import Excel Berhasil!";
                pesanImportVoter.style.color = "#28a745";
                setTimeout(() => pesanImportVoter.style.display = "none", 3000);
                fileExcelVoter.value = "";
            } catch (error) {
                console.error(error);
                pesanImportVoter.innerText = "Terjadi kesalahan saat mengolah file Excel.";
                pesanImportVoter.style.color = "red";
            }
        };
        reader.readAsArrayBuffer(file);
    });
}

// ==========================================
// 3. PENGATURAN ACARA PEMILIHAN
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
    btnBatalPemilihan.addEventListener('click', () => formPemilihanContainer.style.display = "none");
}

// Sinkronisasi Data Pemilihan ke Dropdown (Kandidat & Voter)
onSnapshot(collection(db, "pemilihan"), (snapshot) => {
    let opsiHTML = '<option value="">-- Pilih Acara Pemilihan --</option>';
    let tableHTML = "";
    
    if (snapshot.empty) {
        tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada acara pemilihan.</td></tr>';
    } else {
        const waktuSekarang = new Date();
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Tambahkan ke opsi dropdown
            opsiHTML += `<option value="${doc.id}">${data.judul}</option>`;

            // Proses untuk tabel
            const waktuMulai = new Date(data.tanggal_mulai);
            const waktuSelesai = new Date(data.tanggal_selesai);
            
            let status = waktuSekarang < waktuMulai ? "Belum Mulai" : (waktuSekarang <= waktuSelesai ? "Berlangsung" : "Selesai");
            let warnaStatus = waktuSekarang < waktuMulai ? "#f0ad4e" : (waktuSekarang <= waktuSelesai ? "#28a745" : "#dc3545");

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
    
    if (selectPemilihanKandidat) selectPemilihanKandidat.innerHTML = opsiHTML;
    if (selectPemilihanVoter) selectPemilihanVoter.innerHTML = opsiHTML;
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
                await updateDoc(doc(db, "pemilihan", idEdit), dataBaru);
            }
            formPemilihan.reset();
            formPemilihanContainer.style.display = "none";
        } catch (error) {
            pesanErrorPemilihan.innerText = "Gagal menyimpan data ke database.";
            pesanErrorPemilihan.style.display = "block";
        } finally {
            btnSimpan.innerText = "Simpan";
            btnSimpan.disabled = false;
        }
    });
}

// ==========================================
// FUNGSI GLOBAL EDIT (DIPANGGIL DARI HTML)
// ==========================================
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

window.editVoter = (id, nis, pass, nama, role, kelas, absen, id_pemilihan) => {
    judulFormVoter.innerText = "Edit Data Voter";
    document.getElementById('idVoterEdit').value = id;
    document.getElementById('nisVoterInput').value = nis;
    document.getElementById('passVoterInput').value = pass;
    document.getElementById('namaVoterInput').value = nama;
    document.getElementById('roleVoterInput').value = role;
    document.getElementById('kelasVoterInput').value = kelas !== "undefined" ? kelas : "";
    document.getElementById('absenVoterInput').value = absen !== "null" ? absen : "";
    document.getElementById('pemilihanVoterInput').value = id_pemilihan;
    roleVoterInput.dispatchEvent(new Event('change')); 
    formVoterContainer.style.display = "block";
    formVoterContainer.scrollIntoView({ behavior: 'smooth' });
};

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
// FUNGSI GLOBAL HAPUS & STATUS (TANPA ALERT)
// ==========================================
window.hapusKandidat = async (btn, id) => {
    btn.innerText = "Menghapus...";
    btn.disabled = true;
    try {
        await deleteDoc(doc(db, "kandidat", id));
    } catch (error) {
        console.error(error);
        alert("Gagal menghapus! Pesan Error: " + error.message); // Dimunculkan sementara untuk cek bug
        btn.innerText = "Hapus";
        btn.disabled = false;
    }
};

window.hapusVoter = async (btn, id) => {
    btn.innerText = "Menghapus...";
    btn.disabled = true;
    try {
        await deleteDoc(doc(db, "voter", id));
    } catch (error) {
        console.error(error);
        btn.innerText = "Hapus";
        btn.disabled = false;
    }
};

window.hapusPemilihan = async (btn, id) => {
    btn.innerText = "Menghapus...";
    btn.disabled = true;
    try {
        await deleteDoc(doc(db, "pemilihan", id));
    } catch (error) {
        console.error(error);
        btn.innerText = "Hapus";
        btn.disabled = false;
    }
};

window.toggleStatusVoter = async (btn, id, isActiveSaatIni) => {
    btn.innerText = "Memproses...";
    btn.disabled = true;
    try {
        const statusBaru = !isActiveSaatIni;
        const voterRef = doc(db, "voter", id);

        if (statusBaru === false) {
            const q = query(collection(db, "riwayat_suara"), where("id_voter", "==", id));
            const riwayatSnap = await getDocs(q);
            
            if (!riwayatSnap.empty) {
                riwayatSnap.forEach(async (riwayatDoc) => {
                    const dataRiwayat = riwayatDoc.data();
                    const kandidatRef = doc(db, "kandidat", dataRiwayat.id_kandidat);
                    await updateDoc(kandidatRef, { jumlah_suara: increment(-1) });
                    await deleteDoc(doc(db, "riwayat_suara", riwayatDoc.id));
                });
                await updateDoc(voterRef, { is_active: false, sudah_voting: false });
            } else {
                await updateDoc(voterRef, { is_active: false });
            }
        } else {
            await updateDoc(voterRef, { is_active: true });
        }
    } catch (error) {
        console.error(error);
        btn.innerText = isActiveSaatIni ? "Nonaktifkan" : "Aktifkan";
        btn.disabled = false;
    }
};
