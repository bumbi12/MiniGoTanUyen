// Thay thế hoàn toàn bằng nội dung này
if (!firebase.apps.length) {
  const firebaseConfig = {
  apiKey: "AIzaSyCRc5OmLgHgG57MGwkDvPQLHI74Gv58fgg",
  authDomain: "minigotanuyen.firebaseapp.com",
  projectId: "minigotanuyen",
  storageBucket: "minigotanuyen.firebasestorage.app",
  messagingSenderId: "656079740242",
  appId: "1:656079740242:web:acf2bc7848c33cd1c7ae8b",
  measurementId: "G-T5BSB98505"
};
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();