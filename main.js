import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB1Ab-K6ehYQZbjX-QxJQiodqSajGPFdmE",
    authDomain: "pemilihan-ketos-2627.firebaseapp.com",
    projectId: "pemilihan-ketos-2627",
    storageBucket: "pemilihan-ketos-2627.firebasestorage.app",
    messagingSenderId: "924205874158",
    appId: "1:924205874158:web:be0bab0495c02d1182acff"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// LOGIKA LOGIN VOTER (TANPA ALERT)
// ==========================================
const formLoginVoter = document.getElementById('formLoginVoter');
const pesanErrorVoter = document.getElementById('pesanErrorVoter');

if (formLoginVoter) {
    formLoginVoter.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        // Sembunyikan pesan error sebelumnya
        pesanErrorVoter.style.display = "none";
        pesanErrorVoter.innerText = "";

        const nis = document.getElementById('nisVoter').value;
        const pass = document.getElementById('passVoter').value;

        const btnSubmit = formLoginVoter.querySelector('button');
        const originalText = btnSubmit.innerText;
        btnSubmit.innerText = "Memproses...";
        btnSubmit.disabled = true;

        try {
            const voterRef = collection(db, "voter");
            const q = query(voterRef, where("nis", "==", nis), where("password", "==", pass));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                let voterData = null;
                let voterId = null;
                
                querySnapshot.forEach((doc) => {
                    voterData = doc.data();
                    voterId = doc.id;
                });

                // Cek status akun
                if (voterData.is_active === false) {
                    pesanErrorVoter.innerText = "Akun kamu sedang dinonaktifkan. Silakan hubungi Panitia OSIS.";
                    pesanErrorVoter.style.display = "block";
                } else if (voterData.sudah_voting === true) {
                    pesanErrorVoter.innerText = "Maaf, kamu sudah menggunakan hak suaramu.";
                    pesanErrorVoter.style.display = "block";
                } else {
                    // Login Berhasil -> Simpan sesi dan langsung pindah halaman
                    sessionStorage.setItem("voterId", voterId);
                    sessionStorage.setItem("voterNama", voterData.nama);
                    
                    window.location.href = "halaman_pilihan.html"; 
                }
            } else {
                pesanErrorVoter.innerText = "NIS atau Password salah!";
                pesanErrorVoter.style.display = "block";
            }
        } catch (error) {
            console.error("Error saat login voter: ", error);
            pesanErrorVoter.innerText = "Terjadi kesalahan sistem, coba lagi.";
            pesanErrorVoter.style.display = "block";
        } finally {
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    });
}
