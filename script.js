// Importando o Firebase SDK via CDN Modular ESM (Auth, App e Realtime Database)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configurações do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDDPLoikLfkFx1C_PZLRyVWXPtP6i9weoU",
  authDomain: "pizzariasuriano.firebaseapp.com",
  databaseURL: "https://pizzariasuriano-default-rtdb.firebaseio.com",
  projectId: "pizzariasuriano",
  storageBucket: "pizzariasuriano.firebasestorage.app",
  messagingSenderId: "403698750387",
  appId: "1:403698750387:web:0a38059c12d7015c7931c6",
  measurementId: "G-9T7YB5N6VS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const rtdb = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let usuarioLogado = null;

const botoesComprar = document.querySelectorAll('.btn-comprar');
const listaCarrinho = document.getElementById('lista-carrinho');
const valorTotal = document.getElementById('valor-total');
const contadorCarrinho = document.getElementById('contador-carrinho');
const btnFinalizar = document.getElementById('btn-finalizar');

// Elementos da UI de Autenticação
const modalLogin = document.getElementById('modal-login');
const btnLoginModal = document.getElementById('btn-login-modal');
const btnLogout = document.getElementById('btn-logout');
const btnFecharModal = document.getElementById('btn-fechar-modal');
const btnAcaoAuth = document.getElementById('btn-acao-auth');
const btnGoogle = document.getElementById('btn-google');
const toggleAuthMode = document.getElementById('toggle-auth-mode');
const tituloAuth = document.getElementById('titulo-auth');
const inputEmail = document.getElementById('auth-email');
const inputSenha = document.getElementById('auth-senha');
const spanUserInfo = document.getElementById('user-info');
const spanUserEmail = document.getElementById('user-email');

let modoCadastro = false;

atualizarCarrinho();

// Monitorar estado de autenticação do usuário
onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioLogado = user;
        spanUserEmail.textContent = user.email;
        spanUserInfo.style.display = 'inline';
        btnLoginModal.style.display = 'none';
        btnLogout.style.display = 'inline-block';
    } else {
        usuarioLogado = null;
        spanUserInfo.style.display = 'none';
        btnLoginModal.style.display = 'inline-block';
        btnLogout.style.display = 'none';
    }
});

// Controle do Modal de Login
btnLoginModal.addEventListener('click', () => modalLogin.style.display = 'flex');
btnFecharModal.addEventListener('click', () => modalLogin.style.display = 'none');

toggleAuthMode.addEventListener('click', () => {
    modoCadastro = !modoCadastro;
    if (modoCadastro) {
        tituloAuth.textContent = "Criar Nova Conta";
        btnAcaoAuth.textContent = "Cadastrar";
        toggleAuthMode.textContent = "Já tem uma conta? Entrar";
    } else {
        tituloAuth.textContent = "Entrar na Loja";
        btnAcaoAuth.textContent = "Entrar";
        toggleAuthMode.textContent = "Não tem uma conta? Cadastre-se";
    }
});

function traduzirErroFirebase(errorCode) {
    switch (errorCode) {
        case 'auth/email-already-in-use': return 'Este e-mail já está cadastrado em outra conta.';
        case 'auth/invalid-email': return 'O formato do e-mail digitado é inválido.';
        case 'auth/weak-password': return 'A senha é muito fraca (mínimo de 6 caracteres).';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': return 'E-mail ou senha incorretos.';
        case 'auth/too-many-requests': return 'Muitas tentativas. Tente mais tarde.';
        default: return 'Ocorreu um erro na autenticação: ' + errorCode;
    }
}

btnGoogle.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        alert('Login com Google realizado com sucesso!');
        modalLogin.style.display = 'none';
    } catch (error) {
        alert(traduzirErroFirebase(error.code));
    }
});

btnAcaoAuth.addEventListener('click', async () => {
    const email = inputEmail.value.trim();
    const senha = inputSenha.value.trim();

    if (!email || !senha) {
        alert('Preencha e-mail e senha!');
        return;
    }

    try {
        if (modoCadastro) {
            await createUserWithEmailAndPassword(auth, email, senha);
            alert('Conta criada com sucesso!');
        } else {
            await signInWithEmailAndPassword(auth, email, senha);
            alert('Login realizado com sucesso!');
        }
        modalLogin.style.display = 'none';
        inputEmail.value = '';
        inputSenha.value = '';
    } catch (error) {
        alert(traduzirErroFirebase(error.code));
    }
});

btnLogout.addEventListener('click', async () => {
    await signOut(auth);
    alert('Você saiu da sua conta.');
});

botoesComprar.forEach(botao => {
    botao.addEventListener('click', (evento) => {
        const produtoDiv = evento.target.parentElement;
        const id = produtoDiv.getAttribute('data-id');
        const nome = produtoDiv.getAttribute('data-nome');
        const preco = parseFloat(produtoDiv.getAttribute('data-preco'));
        const imagem = produtoDiv.getAttribute('data-img');

        adicionarAoCarrinho(id, nome, preco, imagem);
    });
});

function adicionarAoCarrinho(id, nome, preco, imagem) {
    const itemExistente = carrinho.find(item => item.id === id);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ id, nome, preco, imagem, quantidade: 1 });
    }
    salvarESincronizar();
}

function atualizarCarrinho() {
    listaCarrinho.innerHTML = '';
    let total = 0;
    let quantidadeTotal = 0;

    carrinho.forEach((item, index) => {
        total += item.preco * item.quantidade;
        quantidadeTotal += item.quantidade;

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="item-info">
                <img src="${item.imagem}" alt="${item.nome}" class="carrinho-img">
                <span>${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
            </div>
            <button onclick="removerItem(${index})">❌</button>
        `;
        listaCarrinho.appendChild(li);
    });

    valorTotal.textContent = total.toFixed(2);
    contadorCarrinho.textContent = quantidadeTotal;
}

function salvarESincronizar() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
}

window.removerItem = function(index) {
    carrinho.splice(index, 1);
    salvarESincronizar();
}

// Botão Finalizar Compra integrado com o Mercado Pago e o Render
btnFinalizar.addEventListener('click', async () => {
    if (carrinho.length === 0) {
        alert('O seu carrinho está vazio!');
        return;
    }

    if (!usuarioLogado) {
        alert('Precisa de estar autenticado para finalizar a compra!');
        modalLogin.style.display = 'flex';
        return;
    }

    const valorTotalStr = document.getElementById('valor-total').textContent;

    try {
        const resposta = await fetch('https://agenda-i8bg.onrender.com/criar-preferencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                itens: carrinho,
                emailComprador: usuarioLogado.email
            })
        });

        const dados = await resposta.json();

        if (dados.init_point) {
            push(ref(rtdb, 'pedidos'), {
                userId: usuarioLogado.uid,
                userEmail: usuarioLogado.email,
                itens: carrinho,
                total: parseFloat(valorTotalStr),
                status: "Aguardando Pagamento",
                criadoEm: new Date().toISOString()
            }).catch(e => console.log("Erro ao salvar no banco:", e.message));

            window.location.href = dados.init_point;
        } else {
            alert('Não foi possível gerar o link de pagamento.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão com o servidor de pagamento.');
    }
});
