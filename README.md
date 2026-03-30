# 💰 Minhas Finanças

App de gestão financeira pessoal com sincronização em nuvem via Firebase.

## ✅ Funcionalidades

- 🔐 Login / cadastro / recuperação de senha (Firebase Auth)
- ☁️ Dados na nuvem sincronizados entre celular e computador
- 🌙 Modo escuro / claro
- ➕ Lançamentos de entrada, gasto e investimento
- 🔄 Parcelamento automático em vários meses
- 🔍 Busca e filtros por tipo e categoria
- 🥧 Gráfico de pizza por categoria de gastos
- 🤖 Análise financeira com Claude AI
- 📄 Exportar relatório mensal em PDF
- 🎯 Metas de economia com barra de progresso

---

## 🚀 Como fazer o deploy na Vercel

### 1. Pré-requisitos
- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com) (gratuita)
- Firebase configurado (já feito!)

### 2. Configurar o Firebase

No [Firebase Console](https://console.firebase.google.com/project/financasbirowjoe):

**a) Ativar Authentication:**
- Vá em `Authentication` → `Sign-in method`
- Ative `E-mail/Senha`

**b) Criar o Firestore:**
- Vá em `Firestore Database` → `Criar banco de dados`
- Escolha `Modo produção`
- Selecione a região mais próxima (ex: `southamerica-east1`)

**c) Configurar regras do Firestore:**
- Vá em `Firestore` → `Regras` e cole:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Publicar no GitHub

```bash
# Dentro da pasta financas-app:
git init
git add .
git commit -m "Minhas Finanças v2"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/financas-app.git
git push -u origin main
```

### 4. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**
2. Importe o repositório `financas-app` do GitHub
3. A Vercel detecta automaticamente que é Vite — não precisa alterar nada
4. Clique em **Deploy**
5. Em ~1 minuto o app estará online com uma URL como `financas-app.vercel.app`

---

## 🤖 Análise com Claude AI

A análise de IA usa a API da Anthropic diretamente no navegador.

> ⚠️ **Importante:** Para uso pessoal/local isso funciona. Para produção pública, crie uma API route no backend para não expor a chave.

A chave da API já está configurada no `AiModal.jsx` via fetch para `https://api.anthropic.com/v1/messages`.

---

## 📁 Estrutura do projeto

```
financas-app/
├── public/
│   └── icon.svg
├── src/
│   ├── components/
│   │   ├── AuthScreen.jsx      # Login/cadastro
│   │   ├── Header.jsx          # Cabeçalho + navegação
│   │   ├── SummaryCard.jsx     # Cards de resumo
│   │   ├── TransactionForm.jsx # Formulário de lançamentos
│   │   ├── TransactionList.jsx # Lista com busca/filtros
│   │   ├── GoalsPanel.jsx      # Metas de economia
│   │   ├── ChartModal.jsx      # Gráfico de pizza
│   │   └── AiModal.jsx         # Análise com Claude AI
│   ├── hooks/
│   │   ├── useDarkMode.js      # Dark mode persistente
│   │   ├── useTransactions.js  # CRUD no Firestore
│   │   └── useGoals.js         # Metas no Firestore
│   ├── lib/
│   │   ├── firebase.js         # Config Firebase
│   │   └── utils.js            # Utilitários + PDF
│   ├── App.jsx                 # Componente raiz
│   ├── main.jsx                # Entry point
│   └── index.css               # Estilos globais + dark mode
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🛠️ Desenvolver localmente

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`
