// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
// 1. Acesse: https://console.firebase.google.com
// 2. Crie um projeto (ou use um existente)
// 3. Vá em "Configurações do projeto" > "Seus apps" > Adicione um app Web
// 4. Copie as credenciais e cole abaixo
// 5. No console do Firebase, ative:
//    - Authentication > Método de login > E-mail/Senha
//    - Firestore Database > Criar banco de dados (modo produção)
// ============================================================

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD3NXIcLLJDOGbfBt0nUOteuhnEcPOJzhw",
  authDomain: "financasbirowjoe.firebaseapp.com",
  projectId: "financasbirowjoe",
  storageBucket: "financasbirowjoe.firebasestorage.app",
  messagingSenderId: "619729852935",
  appId: "1:619729852935:web:935a812ddc616c45a1a8a2"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
