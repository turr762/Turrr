// Mengimpor fungsi Firebase
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

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 1. ELEMEN HTML YANG DIBUTUHKAN
// ==========================================
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const formLoginAdmin = document.getElementById('formLoginAdmin');
const adminMenuLinks = document.querySelectorAll('#adminMenu a[data-target]');
const contentSections = document.querySelectorAll('.content-section');
const judulHalaman = document.getElementById('judulHalaman');
const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');

// ==========================================
// 2. CEK STATUS LOGIN SAAT HALAMAN DIBUKA
// ==========================================
// Jika admin sudah login sebelumnya, langsung tampilkan dashboard
if (sessionStorage.getItem("adminLoggedIn") === "true") {
    loginSection.style.display = "none";
    dashboardSection.style.display = "flex";
}

// ==========================================
// 3. LOGIKA LOGIN ADMIN
// ==========================================
if (formLoginAdmin) {
    formLoginAdmin.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const nis = document.getElementById('nisAdmin').value;
        const pass = document.getElementById('passAdmin').value;

        // Mengubah teks tombol saat loading
        const btnSubmit = formLoginAdmin.querySelector('button');
        const originalText = btnSubmit.innerText;
        btnSubmit.innerText = "Memproses...";
        btnSubmit.disabled = true;

        try {
            // Cek ke collection "admin" di Firebase
            const adminRef = collection(db, "admin");
            const q = query(adminRef, where("nis", "==", nis), where("password", "==", pass));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Login Berhasil
                sessionStorage.setItem("adminLoggedIn", "true");
                alert("Login Admin berhasil!");
                
                // Sembunyikan form login, tampilkan dashboard
                loginSection.style.display = "none";
                dashboardSection.style.display = "flex";
                
                // Kosongkan form
                formLoginAdmin.reset();
            } else {
                alert("NIS atau Password Admin salah!");
            }
        } catch (error) {
            console.error("Error saat login admin: ", error);
            alert("Terjadi kesalahan sistem saat menghubungi database.");
        } finally {
            // Kembalikan tombol ke keadaan semula
            btnSubmit.innerText = originalText;
            btnSubmit.disabled = false;
        }
    });
}

// ==========================================
// 4. LOGIKA NAVIGASI MENU (SPA)
// ==========================================
adminMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Mencegah pindah halaman

        // Ambil target ID menu yang diklik
        const targetId = link.getAttribute('data-target');

        // 1. Sembunyikan semua konten
        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        // 2. Hapus class 'active' dari semua link sidebar
        adminMenuLinks.forEach(menu => {
            menu.classList.remove('active');
        });

        // 3. Tampilkan konten yang dituju dan tandai link sebagai aktif
        document.getElementById(targetId).style.display = 'block';
        link.classList.add('active');

        // 4. Ubah judul halaman (header) sesuai nama menu yang diklik
        judulHalaman.innerText = link.innerText.replace(/[0-9].\s/, ''); // Menghilangkan angka di depan nama menu
    });
});

// ==========================================
// 5. LOGIKA LOGOUT ADMIN
// ==========================================
if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
        
        if (konfirmasi) {
            // Hapus sesi login
            sessionStorage.removeItem("adminLoggedIn");
            
            // Sembunyikan dashboard, kembalikan ke form login
            dashboardSection.style.display = "none";
            loginSection.style.display = "block";
        }
    });
}
