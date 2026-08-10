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
// FUNGSI MUAT DATA DASHBOARD
// ==========================================
function muatDataDashboard() {
    onSnapshot(collection(db, "kandidat"), (snapshot) => {
        document.getElementById('totalKandidat').innerText = snapshot.size;
    });

    onSnapshot(collection(db, "voter"), (snapshot) => {
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
                tableHTML += `<tr><td>${no++}</td><td>${data.nis || '-'}</td><td>${data.nama || '-'}</td><td>${data.kelas || '-'}</td></tr>`;
            }
        });

        document.getElementById('totalAkun').innerText = total;
        document.getElementById('sudahVoting').innerText = sudah;
        document.getElementById('belumVoting').innerText = belum;

        const tbody = document.getElementById('tableBelumVoting');
        if (belum === 0 && total > 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Semua pemilih sudah menggunakan hak suaranya!</td></tr>';
        else if (total === 0) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Belum ada data pemilih.</td></tr>';
        else tbody.innerHTML = tableHTML;
    });
}

const searchNIS = document.getElementById('searchNISBelumVoting');
if (searchNIS) {
    searchNIS.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        document.querySelectorAll('#tableBelumVoting tr').forEach(baris => {
            if (baris.cells[1]) baris.style.display = baris.cells[1].innerText.toLowerCase().includes(keyword) ? '' : 'none';
        });
    });
}

// ==========================================
// CEK LOGIN & NAVIGASI SPA
// ==========================================
if (sessionStorage.getItem("adminLoggedIn") === "true") {
    loginSection.style.display = "none";
    dashboardSection.style.display = "flex";
    muatDataDashboard();
}

if (formLoginAdmin) {
    formLoginAdmin.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        pesanError.style.display = "none";
        const nis = document.getElementById('nisAdmin').value;
        const pass = document.getElementById('passAdmin').value;
        const btnSubmit = formLoginAdmin.querySelector('button');
        const originalText = btnSubmit.innerText;
        btnSubmit.innerText = "Memproses...";
        btnSubmit.disabled = true;

        try {
            const q = query(collection(db, "admin"), where("nis", "==", nis), where("password", "==", pass));
            if (!(await getDocs(q)).empty) {
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
            console.error(error);
            pesanError.innerText = "Terjadi kesalahan sistem, coba lagi.";
            pesanError.style.display = "block";
        } finally {
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    });
}

adminMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); 
        if (link.id === 'btnLogoutAdmin') return; 
        contentSections.forEach(section => section.style.display = 'none');
        adminMenuLinks.forEach(menu => menu.classList.remove('active'));
        document.getElementById(link.getAttribute('data-target')).style.display = 'block';
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
const formKandidatContainer = document.getElementById('formKandidatContainer');
const formKandidat = document.getElementById('formKandidat');

document.getElementById('btnTambahKandidat')?.addEventListener('click', () => {
    formKandidat.reset();
    document.getElementById('idKandidatEdit').value = "";
    document.getElementById('judulFormKandidat').innerText = "Tambah Kandidat Baru";
    formKandidatContainer.style.display = "block";
});
document.getElementById('btnBatalKandidat')?.addEventListener('click', () => formKandidatContainer.style.display = "none");

onSnapshot(collection(db, "kandidat"), (snapshot) => {
    let tableHTML = "";
    if (snapshot.empty) tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada kandidat terdaftar.</td></tr>';
    else {
        let dataKandidat = [];
        snapshot.forEach(doc => dataKandidat.push({ id: doc.id, ...doc.data() }));
        dataKandidat.sort((a, b) => a.no_urut - b.no_urut).forEach(data => {
            tableHTML += `
                <tr>
                    <td style="font-weight: bold; font-size: 18px; text-align: center;">${data.no_urut}</td>
                    <td><img src="${data.foto}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;"></td>
                    <td style="font-weight: bold;">${data.nama}</td>
                    <td style="font-size: 12px;"><strong>Visi:</strong> ${data.visi.substring(0, 30)}... <br><strong>Misi:</strong> ${data.misi.substring(0, 30)}...</td>
                    <td>
                        <button onclick="window.editKandidat('${data.id}', '${data.no_urut}', '${data.nama}', '${data.foto}', '${data.visi}', '${data.misi}', '${data.id_pemilihan}')" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-bottom: 5px; width: 100%;">Edit</button>
                        <button onclick="window.hapusKandidat(this, '${data.id}')" class="btn" style="background-color: #dc3545; padding: 5px 10px; font-size: 12px; margin-bottom: 0; width: 100%;">Hapus</button>
                    </td>
                </tr>`;
        });
    }
    const tableEl = document.getElementById('tableKandidat');
    if (tableEl) tableEl.innerHTML = tableHTML;
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
            if (idEdit === "") await addDoc(collection(db, "kandidat"), dataBaru);
            else {
                delete dataBaru.jumlah_suara; 
                await updateDoc(doc(db, "kandidat", idEdit), dataBaru);
            }
            formKandidat.reset();
            formKandidatContainer.style.display = "none";
        } catch (error) { console.error(error); } 
        finally { btnSimpan.innerText = "Simpan"; btnSimpan.disabled = false; }
    });
}

// ==========================================
// 2. KELOLA VOTER (MANUAL & IMPORT EXCEL)
// ==========================================
const formVoterContainer = document.getElementById('formVoterContainer');
const formVoter = document.getElementById('formVoter');
const roleVoterInput = document.getElementById('roleVoterInput');
const kelasVoterInput = document.getElementById('kelasVoterInput');
const absenVoterInput = document.getElementById('absenVoterInput');
const fileExcelVoter = document.getElementById('fileExcelVoter');
const pesanImportVoter = document.getElementById('pesanImportVoter');

document.getElementById('btnTambahVoter')?.addEventListener('click', () => {
    formVoter.reset();
    document.getElementById('idVoterEdit').value = "";
    document.getElementById('judulFormVoter').innerText = "Tambah Voter Baru";
    formVoterContainer.style.display = "block";
    kelasVoterInput.disabled = false;
    absenVoterInput.disabled = false;
});
document.getElementById('btnBatalVoter')?.addEventListener('click', () => formVoterContainer.style.display = "none");

if (roleVoterInput) {
    roleVoterInput.addEventListener('change', (e) => {
        if (e.target.value === "Guru" || e.target.value === "Tata Usaha") {
            kelasVoterInput.value = "-"; absenVoterInput.value = "";
            kelasVoterInput.disabled = true; absenVoterInput.disabled = true;
            kelasVoterInput.style.backgroundColor = "#e9ecef"; absenVoterInput.style.backgroundColor = "#e9ecef";
        } else {
            kelasVoterInput.value = ""; kelasVoterInput.disabled = false; absenVoterInput.disabled = false;
            kelasVoterInput.style.backgroundColor = "#fff"; absenVoterInput.style.backgroundColor = "#fff";
        }
    });
}

onSnapshot(collection(db, "voter"), (snapshot) => {
    let tableHTML = "";
    if (snapshot.empty) tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada voter terdaftar.</td></tr>';
    else {
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
                </tr>`;
        });
    }
    const tableEl = document.getElementById('tableDataVoter');
    if (tableEl) tableEl.innerHTML = tableHTML;
});

document.getElementById('searchDataVoter')?.addEventListener('input', (e) => {
    const keyword = e.target.value.toLowerCase();
    document.querySelectorAll('#tableDataVoter tr').forEach(baris => {
        if (baris.cells[0] && baris.cells[1]) {
            const teks = baris.cells[0].innerText.toLowerCase() + " " + baris.cells[1].innerText.toLowerCase();
            baris.style.display = teks.includes(keyword) ? '' : 'none';
        }
    });
});

if (formVoter) {
    formVoter.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSimpan = document.getElementById('btnSimpanVoter');
        btnSimpan.innerText = "Menyimpan...";
        btnSimpan.disabled = true;

        const idEdit = document.getElementById('idVoterEdit').value;
        const roleVal = roleVoterInput.value;
        const dataBaru = {
            nis: document.getElementById('nisVoterInput').value,
            password: document.getElementById('passVoterInput').value,
            nama: document.getElementById('namaVoterInput').value,
            role: roleVal,
            kelas: roleVal === "Siswa" ? kelasVoterInput.value : "-",
            no_absen: roleVal === "Siswa" ? parseInt(absenVoterInput.value) : null,
            id_pemilihan: document.getElementById('pemilihanVoterInput').value,
        };

        try {
            if (idEdit === "") {
                dataBaru.is_active = true;
                dataBaru.sudah_voting = false;
                await addDoc(collection(db, "voter"), dataBaru);
            } else await updateDoc(doc(db, "voter", idEdit), dataBaru);
            formVoter.reset();
            formVoterContainer.style.display = "none";
        } catch (error) { console.error(error); }
        finally { btnSimpan.innerText = "Simpan"; btnSimpan.disabled = false; }
    });
}

// LOGIKA SHEETJS IMPORT EXCEL
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
                const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                
                if (excelData.length === 0) {
                    pesanImportVoter.innerText = "File Excel kosong!";
                    pesanImportVoter.style.color = "red"; return;
                }
                pesanImportVoter.innerText = `Menyimpan ${excelData.length} data. Mohon tunggu...`;

                for (let i = 0; i < excelData.length; i++) {
                    const b = excelData[i];
                    if (String(b.nis || "") !== "") {
                        await addDoc(collection(db, "voter"), {
                            nis: String(b.nis || ""),
                            password: String(b.password || ""),
                            nama: String(b.nama || ""),
                            role: String(b.role || "Siswa"),
                            kelas: String(b.role) === "Siswa" ? String(b.kelas || "") : "-",
                            no_absen: String(b.role) === "Siswa" ? parseInt(b.no_absen || 0) : null,
                            id_pemilihan: String(b.id_pemilihan || ""),
                            is_active: true, sudah_voting: false
                        });
                    }
                }
                pesanImportVoter.innerText = "Import Excel Berhasil!";
                pesanImportVoter.style.color = "#28a745";
                setTimeout(() => pesanImportVoter.style.display = "none", 3000);
            } catch (error) {
                console.error(error);
                pesanImportVoter.innerText = "Terjadi kesalahan saat mengolah file Excel.";
                pesanImportVoter.style.color = "red";
            } finally { fileExcelVoter.value = ""; }
        };
        reader.readAsArrayBuffer(file);
    });
}

// ==========================================
// 3. PENGATURAN ACARA PEMILIHAN
// ==========================================
const formPemilihanContainer = document.getElementById('formPemilihanContainer');
const formPemilihan = document.getElementById('formPemilihan');

document.getElementById('btnTambahPemilihan')?.addEventListener('click', () => {
    formPemilihan.reset();
    document.getElementById('idPemilihanEdit').value = "";
    document.getElementById('judulFormPemilihan').innerText = "Buat Acara Baru";
    formPemilihanContainer.style.display = "block";
});
document.getElementById('btnBatalPemilihan')?.addEventListener('click', () => formPemilihanContainer.style.display = "none");

onSnapshot(collection(db, "pemilihan"), (snapshot) => {
    let opsiHTML = '<option value="">-- Pilih Acara Pemilihan --</option>';
    let tableHTML = "";
    
    if (snapshot.empty) tableHTML = '<tr><td colspan="5" style="text-align: center;">Belum ada acara pemilihan.</td></tr>';
    else {
        const waktuSekarang = new Date();
        snapshot.forEach(doc => {
            const data = doc.data();
            opsiHTML += `<option value="${doc.id}">${data.judul}</option>`;
            
            const wMulai = new Date(data.tanggal_mulai);
            const wSelesai = new Date(data.tanggal_selesai);
            let status = waktuSekarang < wMulai ? "Belum Mulai" : (waktuSekarang <= wSelesai ? "Berlangsung" : "Selesai");
            let warnaStatus = waktuSekarang < wMulai ? "#f0ad4e" : (waktuSekarang <= wSelesai ? "#28a745" : "#dc3545");

            tableHTML += `
                <tr>
                    <td style="font-weight: bold;">${data.judul}</td>
                    <td style="font-size: 13px;">${wMulai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td style="font-size: 13px;">${wSelesai.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td><span style="background-color: ${warnaStatus}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${status}</span></td>
                    <td>
                        <button onclick="window.editPemilihan('${doc.id}', '${data.judul}', '${data.tanggal_mulai}', '${data.tanggal_selesai}')" class="btn btn-outline" style="padding: 5px 10px; font-size: 12px; margin-bottom: 5px; width: 100%;">Edit</button>
                        <button onclick="window.hapusPemilihan(this, '${doc.id}')" class="btn" style="background-color: #dc3545; padding: 5px 10px; font-size: 12px; margin-bottom: 0; width: 100%;">Hapus</button>
                    </td>
                </tr>`;
        });
    }
    const selectKan = document.getElementById('pemilihanKandidat');
    const selectVot = document.getElementById('pemilihanVoterInput');
    const tabPem = document.getElementById('tablePemilihan');
    if (selectKan) selectKan.innerHTML = opsiHTML;
    if (selectVot) selectVot.innerHTML = opsiHTML;
    if (tabPem) tabPem.innerHTML = tableHTML;
});

if (formPemilihan) {
    formPemilihan.addEventListener('submit', async (e) => {
        e.preventDefault();
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
            if (idEdit === "") await addDoc(collection(db, "pemilihan"), dataBaru);
            else await updateDoc(doc(db, "pemilihan", idEdit), dataBaru);
            formPemilihan.reset();
            formPemilihanContainer.style.display = "none";
        } catch (error) { console.error(error); } 
        finally { btnSimpan.innerText = "Simpan"; btnSimpan.disabled = false; }
    });
}

// ==========================================
// 4. HASIL SUARA
// ==========================================
const containerHasilSuara = document.getElementById('containerHasilSuara');
if (containerHasilSuara) {
    onSnapshot(collection(db, "kandidat"), (snapshot) => {
        let kandidatList = [];
        let totalSuaraSemua = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            const suara = data.jumlah_suara || 0;
            totalSuaraSemua += suara;
            kandidatList.push({ id: doc.id, ...data, jumlah_suara: suara });
        });

        kandidatList.sort((a, b) => a.no_urut - b.no_urut);
        let htmlContent = "";

        if (kandidatList.length === 0) htmlContent = '<p style="text-align: center;">Belum ada kandidat terdaftar.</p>';
        else {
            kandidatList.forEach(kandidat => {
                let persentase = totalSuaraSemua > 0 ? ((kandidat.jumlah_suara / totalSuaraSemua) * 100).toFixed(1) : 0;
                htmlContent += `
                    <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 5px solid #0056b3;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <img src="${kandidat.foto}" alt="Foto" style="width: 45px; height: 45px; object-fit: cover; border-radius: 50%;">
                                <div>
                                    <h4 style="margin: 0; color: #333; font-size: 16px;">No. Urut ${kandidat.no_urut} - ${kandidat.nama}</h4>
                                    <span style="font-size: 12px; color: #666;">Perolehan: <strong>${kandidat.jumlah_suara}</strong> Suara</span>
                                </div>
                            </div>
                            <span style="font-size: 16px; font-weight: bold; color: #0056b3;">${persentase}%</span>
                        </div>
                        <div style="width: 100%; background-color: #e9ecef; border-radius: 6px; height: 12px; overflow: hidden;">
                            <div style="width: ${persentase}%; background-color: #0056b3; height: 100%; transition: width 0.4s ease;"></div>
                        </div>
                    </div>`;
            });
            htmlContent += `<div style="text-align: right; font-size: 14px; color: #666; margin-top: 10px;">Total Suara Masuk: <strong>${totalSuaraSemua} Suara</strong></div>`;
        }
        containerHasilSuara.innerHTML = htmlContent;
    });
}

// ==========================================
// 5. LAPORAN EXCEL
// ==========================================
const btnDownloadLaporan = document.getElementById('btnDownloadLaporan');
if (btnDownloadLaporan) {
    btnDownloadLaporan.addEventListener('click', async () => {
        btnDownloadLaporan.innerText = "Menyiapkan Laporan...";
        btnDownloadLaporan.disabled = true;

        try {
            const voterSnap = await getDocs(collection(db, "voter"));
            const riwayatSnap = await getDocs(collection(db, "riwayat_suara"));
            const kandidatSnap = await getDocs(collection(db, "kandidat"));

            const mapKandidat = {};
            kandidatSnap.forEach(doc => mapKandidat[doc.id] = doc.data().nama);

            const mapRiwayat = {};
            riwayatSnap.forEach(doc => {
                const data = doc.data();
                mapRiwayat[data.id_voter] = { waktu: data.waktu_voting || "-", kandidat: mapKandidat[data.id_kandidat] || "-" };
            });

            let dataLaporan = []; let no = 1;
            voterSnap.forEach(doc => {
                const voter = doc.data(); const riwayat = mapRiwayat[doc.id];
                dataLaporan.push({
                    "No": no++,
                    "NIS / NIP": voter.nis || "-", "Nama Lengkap": voter.nama || "-",
                    "Role": voter.role || "Siswa", "Kelas": voter.kelas || "-",
                    "Status Voting": voter.sudah_voting ? "Sudah Memilih" : "Belum Memilih",
                    "Pilihan Kandidat": riwayat ? riwayat.kandidat : "-", "Waktu Memilih": riwayat ? riwayat.waktu : "-"
                });
            });

            if (dataLaporan.length === 0) { console.error("Tidak ada data"); return; }

            const worksheet = XLSX.utils.json_to_sheet(dataLaporan);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan_Voter");
            worksheet['!cols'] = [{wch: 5}, {wch: 15}, {wch: 25}, {wch: 12}, {wch: 10}, {wch: 15}, {wch: 20}, {wch: 20}];
            
            XLSX.writeFile(workbook, "Laporan_Pemilihan_OSIS_SMPN219.xlsx");
        } catch (error) { console.error(error); } 
        finally { btnDownloadLaporan.innerText = "Download Laporan Excel"; btnDownloadLaporan.disabled = false; }
    });
}

// ==========================================
// FUNGSI GLOBAL KLIK
// ==========================================
window.editKandidat = (id, no_urut, nama, foto, visi, misi, id_pemilihan) => {
    document.getElementById('judulFormKandidat').innerText = "Edit Data Kandidat";
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
    document.getElementById('judulFormVoter').innerText = "Edit Data Voter";
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
    document.getElementById('judulFormPemilihan').innerText = "Edit Acara Pemilihan";
    document.getElementById('idPemilihanEdit').value = id;
    document.getElementById('judulPemilihan').value = judul;
    document.getElementById('waktuMulaiPemilihan').value = mulai;
    document.getElementById('waktuSelesaiPemilihan').value = selesai;
    formPemilihanContainer.style.display = "block";
    formPemilihanContainer.scrollIntoView({ behavior: 'smooth' });
};

window.hapusKandidat = async (btn, id) => {
    btn.innerText = "Menghapus..."; btn.disabled = true;
    try { await deleteDoc(doc(db, "kandidat", id)); } 
    catch (error) { console.error(error); btn.innerText = "Hapus"; btn.disabled = false; }
};

window.hapusVoter = async (btn, id) => {
    btn.innerText = "Menghapus..."; btn.disabled = true;
    try { await deleteDoc(doc(db, "voter", id)); } 
    catch (error) { console.error(error); btn.innerText = "Hapus"; btn.disabled = false; }
};

window.hapusPemilihan = async (btn, id) => {
    btn.innerText = "Menghapus..."; btn.disabled = true;
    try { await deleteDoc(doc(db, "pemilihan", id)); } 
    catch (error) { console.error(error); btn.innerText = "Hapus"; btn.disabled = false; }
};

window.toggleStatusVoter = async (btn, id, isActiveSaatIni) => {
    btn.innerText = "Memproses..."; btn.disabled = true;
    try {
        const voterRef = doc(db, "voter", id);
        if (!isActiveSaatIni) {
            const riwayatSnap = await getDocs(query(collection(db, "riwayat_suara"), where("id_voter", "==", id)));
            if (!riwayatSnap.empty) {
                riwayatSnap.forEach(async (riwayatDoc) => {
                    await updateDoc(doc(db, "kandidat", riwayatDoc.data().id_kandidat), { jumlah_suara: increment(-1) });
                    await deleteDoc(doc(db, "riwayat_suara", riwayatDoc.id));
                });
                await updateDoc(voterRef, { is_active: false, sudah_voting: false });
            } else await updateDoc(voterRef, { is_active: false });
        } else await updateDoc(voterRef, { is_active: true });
    } catch (error) { console.error(error); btn.innerText = isActiveSaatIni ? "Nonaktifkan" : "Aktifkan"; btn.disabled = false; }
};
