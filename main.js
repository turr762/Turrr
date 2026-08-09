// Mengimpor fungsi Firebase dari CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Konfigurasi Firebase dari project pemilihan-ketos-2627
const firebaseConfig = {
    apiKey: "AIzaSyB1Ab-K6ehYQZbjX-QxJQiodqSajGPFdmE",
    authDomain: "pemilihan-ketos-2627.firebaseapp.com",
    projectId: "pemilihan-ketos-2627",
    storageBucket: "pemilihan-ketos-2627.firebasestorage.app",
    messagingSenderId: "924205874158",
    appId: "1:924205874158:web:be0bab0495c02d1182acff"
};

// Inisialisasi Firebase dan Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 1. LOGIKA LOGIN VOTER
// ==========================================
const formLoginVoter = document.getElementById('formLoginVoter');

if (formLoginVoter) {
    formLoginVoter.addEventListener('submit', async (e) => {
        e.preventDefault(); // Mencegah halaman reload
        
        const nis = document.getElementById('nisVoter').value;
        const pass = document.getElementById('passVoter').value;

        try {
            // Mencari data voter berdasarkan NIS dan Password
            const voterRef = collection(db, "voter");
            const q = query(voterRef, where("nis", "==", nis), where("password", "==", pass));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                let voterData = null;
                let voterId = null;
                
                // Mengambil data dari hasil pencarian
                querySnapshot.forEach((doc) => {
                    voterData = doc.data();
                    voterId = doc.id;
                });

                // Cek status akun sesuai kesepakatan fitur
                if (voterData.is_active === false) {
                    alert("Akun kamu sedang dinonaktifkan. Silakan hubungi Panitia OSIS.");
                } else if (voterData.sudah_voting === true) {
                    alert("Maaf, kamu sudah menggunakan hak suaramu.");
                } else {
                    // Menyimpan data sesi login menggunakan sessionStorage
                    sessionStorage.setItem("voterId", voterId);
                    sessionStorage.setItem("voterNama", voterData.nama);
                    
                    alert("Login berhasil! Mengalihkan ke halaman pemilihan...");
                    // Mengarahkan ke halaman daftar kandidat (nama file bisa disesuaikan nanti)
                    window.location.href = "halaman_pilihan.html"; 
                }
            } else {
                alert("NIS atau Password salah!");
            }
        } catch (error) {
            console.error("Error saat login voter: ", error);
            alert("Terjadi kesalahan sistem saat mencoba login.");
        }
    });
}

// ==========================================
// 2. LOGIKA LOGIN ADMIN
// ==========================================
const formLoginAdmin = document.getElementById('formLoginAdmin');

if (formLoginAdmin) {
    formLoginAdmin.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const nis = document.getElementById('nisAdmin').value;
        const pass = document.getElementById('passAdmin').value;

        try {
            // Mencari data admin berdasarkan NIS dan Password
            const adminRef = collection(db, "admin");
            const q = query(adminRef, where("nis", "==", nis), where("password", "==", pass));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Menyimpan status login admin
                sessionStorage.setItem("adminLoggedIn", "true");
                
                alert("Login Admin berhasil!");
                // Mengarahkan ke dashboard admin (nama file bisa disesuaikan nanti)
                window.location.href = "dashboard_admin.html"; 
            } else {
                alert("NIS atau Password Admin salah!");
            }
        } catch (error) {
            console.error("Error saat login admin: ", error);
            alert("Terjadi kesalahan sistem saat mencoba login admin.");
        }
    });
}
