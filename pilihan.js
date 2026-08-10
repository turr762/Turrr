import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Konfigurasi Firebase
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

// 1. Cek Sesi Login Voter
const voterId = sessionStorage.getItem("voterId");
const voterNama = sessionStorage.getItem("voterNama");

if (!voterId) {
    // Jika ada yang mencoba buka link langsung tanpa login, lempar ke depan
    window.location.href = "voter.html";
} else {
    document.getElementById("namaVoterDisplay").innerText = `Halo, ${voterNama}`;
}

// 2. Ambil dan Tampilkan Data Kandidat
const kandidatContainer = document.getElementById("kandidatContainer");

async function muatKandidat() {
    try {
        const querySnapshot = await getDocs(collection(db, "kandidat"));
        let kandidatList = [];
        
        querySnapshot.forEach((doc) => {
            kandidatList.push({ id: doc.id, ...doc.data() });
        });

        // Urutkan berdasarkan nomor urut
        kandidatList.sort((a, b) => a.no_urut - b.no_urut);

        let htmlContent = "";
        kandidatList.forEach(kandidat => {
            htmlContent += `
                <div style="background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; border-top: 5px solid #0056b3; display: flex; flex-direction: column;">
                    <img src="${kandidat.foto}" alt="Foto ${kandidat.nama}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 50%; margin: 0 auto 15px auto; border: 3px solid #f4f7f6;">
                    
                    <span style="background: #0056b3; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; width: fit-content; margin: 0 auto 10px auto;">Nomor Urut ${kandidat.no_urut}</span>
                    
                    <h3 style="color: #333; margin-bottom: 15px; font-size: 20px;">${kandidat.nama}</h3>
                    
                    <div style="text-align: left; font-size: 13px; color: #555; background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; flex-grow: 1;">
                        <strong>Visi:</strong><br>
                        <p style="margin-bottom: 10px;">${kandidat.visi}</p>
                        <strong>Misi:</strong><br>
                        <p>${kandidat.misi}</p>
                    </div>
                    
                    <button onclick="bukaModalVote('${kandidat.id}', '${kandidat.nama}')" class="btn" style="width: 100%; padding: 12px; font-size: 16px; margin: 0;">PILIH KANDIDAT INI</button>
                </div>
            `;
        });

        if (kandidatList.length === 0) {
            kandidatContainer.innerHTML = '<p style="text-align: center; width: 100%;">Belum ada kandidat yang terdaftar untuk dipilih.</p>';
        } else {
            kandidatContainer.innerHTML = htmlContent;
        }

    } catch (error) {
        console.error("Gagal memuat kandidat:", error);
        kandidatContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Gagal memuat data kandidat. Periksa koneksi internetmu.</p>';
    }
}

muatKandidat();

// 3. Sistem Modal Konfirmasi Custom
const modalKonfirmasi = document.getElementById('modalKonfirmasi');
const namaKandidatTerpilih = document.getElementById('namaKandidatTerpilih');
const btnYakinVote = document.getElementById('btnYakinVote');
const btnBatalVote = document.getElementById('btnBatalVote');
const pesanErrorModal = document.getElementById('pesanErrorModal');
const modalSukses = document.getElementById('modalSukses');

let idKandidatTarget = "";

window.bukaModalVote = (idKandidat, namaKandidat) => {
    idKandidatTarget = idKandidat;
    namaKandidatTerpilih.innerText = namaKandidat;
    pesanErrorModal.style.display = "none";
    modalKonfirmasi.style.display = "flex";
};

// Tombol Batal
btnBatalVote.addEventListener('click', () => {
    modalKonfirmasi.style.display = "none";
    idKandidatTarget = "";
});

// 4. Eksekusi Voting (Tombol Yakin)
btnYakinVote.addEventListener('click', async () => {
    pesanErrorModal.style.display = "none";
    const originalText = btnYakinVote.innerText;
    btnYakinVote.innerText = "Memproses...";
    btnYakinVote.disabled = true;
    btnBatalVote.disabled = true;

    try {
        // A. Tambahkan Suara ke Kandidat (+1)
        const kandidatRef = doc(db, "kandidat", idKandidatTarget);
        await updateDoc(kandidatRef, {
            jumlah_suara: increment(1)
        });

        // B. Catat ke Riwayat Suara (Untuk Laporan)
        const waktuSekarang = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
        await addDoc(collection(db, "riwayat_suara"), {
            id_voter: voterId,
            id_kandidat: idKandidatTarget,
            waktu_voting: waktuSekarang
        });

        // C. Update Status Voter (Supaya tidak bisa pilih 2x)
        const voterRef = doc(db, "voter", voterId);
        await updateDoc(voterRef, {
            sudah_voting: true
        });

        // D. Sukses! Tutup Modal Konfirmasi & Tampilkan Modal Sukses
        modalKonfirmasi.style.display = "none";
        modalSukses.style.display = "flex";

        // E. Otomatis Logout & Kembali ke Halaman Utama setelah 3 detik
        setTimeout(() => {
            sessionStorage.removeItem("voterId");
            sessionStorage.removeItem("voterNama");
            window.location.href = "index.html";
        }, 3000);

    } catch (error) {
        console.error("Error voting:", error);
        pesanErrorModal.innerText = "Gagal memproses suara. Coba lagi.";
        pesanErrorModal.style.display = "block";
        btnYakinVote.innerText = originalText;
        btnYakinVote.disabled = false;
        btnBatalVote.disabled = false;
    }
});

// 5. Fitur Logout Voter
document.getElementById('btnLogoutVoter')?.addEventListener('click', () => {
    sessionStorage.removeItem("voterId");
    sessionStorage.removeItem("voterNama");
    window.location.href = "index.html";
});
