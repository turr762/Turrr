import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

const containerHasilPublik = document.getElementById('containerHasilPublik');

if (containerHasilPublik) {
    // Tambahkan pelacak error di bagian onSnapshot
    onSnapshot(
        collection(db, "kandidat"), 
        (snapshot) => {
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

            if (kandidatList.length === 0) {
                htmlContent = '<p style="text-align: center;">Belum ada kandidat terdaftar.</p>';
            } else {
                kandidatList.forEach(kandidat => {
                    let persentase = totalSuaraSemua > 0 ? ((kandidat.jumlah_suara / totalSuaraSemua) * 100).toFixed(1) : 0;

                    htmlContent += `
                        <div style="background: #f4f7f6; padding: 20px; border-radius: 8px; border-left: 5px solid #0056b3;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <img src="${kandidat.foto}" alt="Foto ${kandidat.nama}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%; border: 2px solid white;">
                                    <div>
                                        <h4 style="margin: 0; color: #333; font-size: 16px;">No. Urut ${kandidat.no_urut} - ${kandidat.nama}</h4>
                                        <span style="font-size: 13px; color: #666;">Perolehan: <strong>${kandidat.jumlah_suara}</strong> Suara</span>
                                    </div>
                                </div>
                                <span style="font-size: 20px; font-weight: bold; color: #0056b3;">${persentase}%</span>
                            </div>
                            
                            <div style="width: 100%; background-color: #dee2e6; border-radius: 6px; height: 12px; overflow: hidden;">
                                <div style="width: ${persentase}%; background-color: #28a745; height: 100%; transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                    `;
                });

                htmlContent += `
                    <div style="text-align: center; font-size: 15px; color: #333; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        Total Suara Masuk Keseluruhan: <br>
                        <strong style="font-size: 24px; color: #0056b3;">${totalSuaraSemua}</strong> Suara
                    </div>
                `;
            }

            containerHasilPublik.innerHTML = htmlContent;
        },
        (error) => {
            // JIKA GAGAL, PESAN ERROR AKAN MUNCUL DI LAYAR
            console.error("Error Firebase:", error);
            containerHasilPublik.innerHTML = `
                <div style="background: #ffe6e6; padding: 20px; border-radius: 8px; text-align: center; color: #dc3545;">
                    <strong>GAGAL MEMUAT DATA!</strong><br><br>
                    Pesan Error: ${error.message}
                </div>
            `;
        }
    );
}
