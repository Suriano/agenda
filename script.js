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

// Elementos do Modal de Zoom e Transição de Imagens
const imagensProdutos = document.querySelectorAll('.produto-img');
const modalZoom = document.getElementById('modal-zoom');
const imagemZoomConteudo = document.getElementById('imagem-zoom-conteudo');
const btnFecharZoom = document.getElementById('btn-fechar-zoom');
const btnZoomAnt = document.getElementById('btn-zoom-ant');
const btnZoomProx = document.getElementById('btn-zoom-prox');

let galeriaAtual = [];
let indiceImagemAtual = 0;
let modoCadastro = false;

atualizarCarrinho();

// Função auxiliar para obter a data e hora atual do Brasil (Brasília)
function obterDataHoraBrasil() {
    return new Date().toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        hour12: false 
    });
}

// Funcionalidade de Zoom e Transição de Imagens
imagensProdutos.forEach(img => {
    img.addEventListener('click', () => {
        const galeriaAttr = img.getAttribute('data-galeria');
        if (galeriaAttr) {
            galeriaAtual = galeriaAttr.split(',').map(item => item.trim());
        } else {
            galeriaAtual = [img.src];
        }
        
        indiceImagemAtual = 0;
        atualizarImagemZoom();
        modalZoom.style.display = 'flex';
    });
});

function atualizarImagemZoom() {
    imagemZoomConteudo.style.opacity = 0;
    setTimeout(() => {
        imagemZoomConteudo.src = galeriaAtual[indiceImagemAtual];
        imagemZoomConteudo.style.opacity = 1;
    }, 150);

    if (galeriaAtual.length <= 1) {
        btnZoomAnt.style.display = 'none';
        btnZoomProx.style.display = 'none';
    } else {
        btnZoomAnt.style.display = 'block';
        btnZoomProx.style.display = 'block';
    }
}

btnZoomProx.addEventListener('click', () => {
    indiceImagemAtual = (indiceImagemAtual + 1) % galeriaAtual.length;
    atualizarImagemZoom();
});

btnZoomAnt.addEventListener('click', () => {
    indiceImagemAtual = (indiceImagemAtual - 1 + galeriaAtual.length) % galeriaAtual.length;
    atualizarImagemZoom();
});

btnFecharZoom.addEventListener('click', () => {
    modalZoom.style.display = 'none';
});

modalZoom.addEventListener('click', (e) => {
    if (e.target === modalZoom) {
        modalZoom.style.display = 'none';
    }
});

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

// Botão Finalizar Compra: Exibe a escolha entre Pix ou Mercado Livre (Mercado Pago)
btnFinalizar.addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('O seu carrinho está vazio!');
        return;
    }

    if (!usuarioLogado) {
        alert('Precisa de estar autenticado para finalizar a compra!');
        modalLogin.style.display = 'flex';
        return;
    }

    mostrarModalSelecaoPagamento();
});

// Modal para escolher a forma de pagamento
function mostrarModalSelecaoPagamento() {
    const modalExistente = document.getElementById('modal-selecao-pagamento');
    if (modalExistente) modalExistente.remove();

    const valorTotalStr = document.getElementById('valor-total').textContent;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal-selecao-pagamento';
    modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:2500; font-family:'Inter', sans-serif;";
    
    modalDiv.innerHTML = `
        <div style="background:white; padding:30px; border-radius:16px; text-align:center; max-width:380px; width:90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <h3>Escolha a Forma de Pagamento</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Total: <strong style="color: #059669; font-size: 18px;">R$ ${valorTotalStr}</strong></p>
            
            <button id="btn-escolha-pix" style="background: #059669; color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 12px; display:flex; align-items:center; justify-content:center; gap:8px;">🟢 Pagar com Pix</button>
            
            <button id="btn-escolha-ml" style="background: #2563eb; color: white; border: none; padding: 12px; width: 100%; border-radius: 8px; font-weight: 600; cursor: pointer; margin-bottom: 12px; display:flex; align-items:center; justify-content:center; gap:8px;">🔵 Pagar com Mercado Livre / Pago</button>
            
            <button id="btn-fechar-escolha" style="background: #6b7280; color: white; border: none; padding: 10px; width: 100%; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancelar</button>
        </div>
    `;

    document.body.appendChild(modalDiv);

    document.getElementById('btn-escolha-pix').addEventListener('click', () => {
        modalDiv.remove();
        processarPagamentoPix(valorTotalStr);
    });

    document.getElementById('btn-escolha-ml').addEventListener('click', () => {
        modalDiv.remove();
        processarPagamentoMercadoLivre();
    });

    document.getElementById('btn-fechar-escolha').addEventListener('click', () => {
        modalDiv.remove();
    });
}

// Fluxo de Pix
function processarPagamentoPix(valorTotalStr) {
    const idTransacao = "PEDIDO" + Math.floor(Math.random() * 10000);
    const minhaChavePix = "28127477818";
    const meuNome = "Anderson Pinheiro Suriano";
    const minhaCidade = "SAO PAULO";
    const payloadPix = gerarPayloadPix(minhaChavePix, meuNome, minhaCidade, valorTotalStr, idTransacao);

    mostrarTelaPagamentoPix(payloadPix, valorTotalStr);

    // Salvando no Firebase com data/hora ajustada para o Brasil
    push(ref(rtdb, `pedidos/${usuarioLogado.uid}`), {
        userId: usuarioLogado.uid,
        userEmail: usuarioLogado.email,
        itens: carrinho,
        total: parseFloat(valorTotalStr),
        metodoPagamento: "Pix",
        status: "Aguardando Pagamento",
        criadoEm: obterDataHoraBrasil()
    }).catch(e => {
        console.error("Erro ao salvar no banco:", e.message);
        alert("Erro ao gravar pedido no Firebase: " + e.message);
    });
}

// Fluxo de Mercado Livre / Mercado Pago via Render
async function processarPagamentoMercadoLivre() {
    const valorTotalStr = document.getElementById('valor-total').textContent;
    
    const originalText = btnFinalizar.innerHTML;
    btnFinalizar.innerHTML = `<span class="spinner"></span> A gerar Mercado Livre...`;
    btnFinalizar.disabled = true;

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
            // Salvando no Firebase com data/hora ajustada para o Brasil
            push(ref(rtdb, `pedidos/${usuarioLogado.uid}`), {
                userId: usuarioLogado.uid,
                userEmail: usuarioLogado.email,
                itens: carrinho,
                total: parseFloat(valorTotalStr),
                metodoPagamento: "Mercado Pago",
                status: "Aguardando Pagamento",
                criadoEm: obterDataHoraBrasil()
            }).catch(e => {
                console.error("Erro ao salvar no banco:", e.message);
            });

            window.location.href = dados.init_point;
        } else {
            alert('Não foi possível gerar o link de pagamento.');
            restaurarBotao();
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro de conexão com o servidor de pagamento.');
        restaurarBotao();
    }

    function restaurarBotao() {
        btnFinalizar.innerHTML = originalText;
        btnFinalizar.disabled = false;
    }
}

// Função para gerar o código Pix Copia e Cola
function gerarPayloadPix(chavePix, nomeRecebedor, cidadeRecebedor, valor, identificador) {
    const formatField = (id, value) => {
        const len = String(value.length).padStart(2, '0');
        return `${id}${len}${value}`;
    };

    const gui = formatField('00', 'br.gov.bcb.pix');
    const key = formatField('01', chavePix);
    const desc = identificador ? formatField('02', identificador) : '';
    const merchantAccount = formatField('26', gui + key + desc);
    
    const merchantCategoryCode = formatField('52', '0000');
    const currency = formatField('53', '986');
    const amount = formatField('54', Number(valor).toFixed(2));
    const country = formatField('58', 'BR');
    const merchantName = formatField('59', nomeRecebedor);
    const merchantCity = formatField('60', cidadeRecebedor);
    
    const additionalDataField = formatField('05', identificador || '***');
    const additionalData = formatField('62', additionalDataField);

    let payload = 
        formatField('00', '01') + 
        merchantAccount + 
        merchantCategoryCode + 
        currency + 
        amount + 
        country + 
        merchantName + 
        merchantCity + 
        additionalData + 
        '6304';

    function calcularCRC16(str) {
        let crc = 0xFFFF;
        for (let c = 0; c < str.length; c++) {
            crc ^= str.charCodeAt(c) << 8;
            for (let i = 0; i < 8; i++) {
                if (crc & 0x8000) {
                    crc = (crc << 1) ^ 0x1021;
                } else {
                    crc = crc << 1;
                }
            }
        }
        let hex = (crc & 0xFFFF).toString(16).toUpperCase();
        return hex.padStart(4, '0');
    }

    return payload + calcularCRC16(payload);
}

function mostrarTelaPagamentoPix(payload, valor) {
    const modalDiv = document.createElement('div');
    modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:1000; font-family:'Inter', sans-serif;";
    
    modalDiv.innerHTML = `
        <div style="background:white; padding:30px; border-radius:16px; text-align:center; max-width:400px; width:90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <h3 style="margin-bottom: 10px; color: #111; font-size: 20px;">Pague com Pix</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Total a pagar: <strong style="color: #059669; font-size: 18px;">R$ ${valor}</strong></p>
            
            <div id="qrcode-container" style="margin: 15px auto; display:flex; justify-content:center; background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; width: fit-content;"></div>
            
            <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">Escaneie o QR Code com o app do seu banco ou copie o código:</p>
            
            <input type="text" id="pix-copia-cola" value="${payload}" readonly style="width:100%; padding: 10px; font-size: 12px; margin-bottom:10px; border: 1px solid #d1d5db; border-radius: 6px; background: #f3f4f6; text-align: center;" />
            
            <button id="btn-copiar" style="background: #2563eb; color: white; border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">📋 Copiar Código Pix</button>
            
            <button id="btn-fechar-pix" style="background: #dc2626; color: white; border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: 600; cursor: pointer;">Fechar / Já Paguei</button>
        </div>
    `;

    document.body.appendChild(modalDiv);

    new QRCode(document.getElementById("qrcode-container"), {
        text: payload,
        width: 180,
        height: 180
    });

    document.getElementById('btn-copiar').addEventListener('click', () => {
        const inputCopia = document.getElementById('pix-copia-cola');
        inputCopia.select();
        navigator.clipboard.writeText(inputCopia.value);
        alert('Código Pix copiado com sucesso!');
    });

    document.getElementById('btn-fechar-pix').addEventListener('click', () => {
        modalDiv.remove();
        carrinho = [];
        salvarESincronizar();
    });
}
