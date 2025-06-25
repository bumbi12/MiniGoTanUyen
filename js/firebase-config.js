// Import Firebase SDK (nếu dùng module)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCRc5OmLgHgG57MGwkDvPQLHI74Gv58fgg",
  authDomain: "minigotanuyen.firebaseapp.com",
  projectId: "minigotanuyen",
  storageBucket: "minigotanuyen.firebasestorage.app",
  messagingSenderId: "656079740242",
  appId: "1:656079740242:web:acf2bc7848c33cd1c7ae8b",
  measurementId: "G-T5BSB98505"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export để sử dụng ở file khác
export { db };