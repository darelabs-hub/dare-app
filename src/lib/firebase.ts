import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB3BGbg7M0Kbpm-TTninprtyryfSPnkkBo",
  authDomain: "gen-lang-client-0878556058.firebaseapp.com",
  projectId: "gen-lang-client-0878556058",
  storageBucket: "gen-lang-client-0878556058.firebasestorage.app",
  messagingSenderId: "224811567555",
  appId: "1:224811567555:web:190f621dbbc95fd64d5576",
  databaseId: "ai-studio-dareday-007f6080-13e8-4ca9-b315-aee0b29985cf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-dareday-007f6080-13e8-4ca9-b315-aee0b29985cf");
export const auth = getAuth(app);
