// Carrega o carrinho salvo no navegador (localStorage) ao abrir a página
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

const botoesComprar = document.querySelectorAll('.btn-comprar');
const listaCarrinho = document.getElementById('lista-carrinho');
const valorTotal = document.getElementById('valor-total');
const contadorCarrinho = document.getElementById('contador-carrinho');
const btnFinalizar = document.getElementById('btn-finalizar');

// Atualiza a tela imediatamente com os itens carregados do armazenamento
atualizarCarrinho();

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

// Salva as alterações no localStorage do navegador e atualiza a interface
function salvarESincronizar() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinho();
}

function removerItem(index) {
    carrinho.splice(index, 1);
    salvarESincronizar();
}

// Função para gerar o código Copia e Cola do Pix Estático
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

// Finalizar Compra e Exibir o Modal Pix
btnFinalizar.addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const valorTotalStr = document.getElementById('valor-total').textContent;
    
    const minhaChavePix = "28127477819"; // Seu CPF
    const meuNome = "Anderson Pinheiro Suriano";
    const minhaCidade = "SAO PAULO";
    const idTransacao = "PEDIDO" + Math.floor(Math.random() * 1000);

    const payloadPix = gerarPayloadPix(minhaChavePix, meuNome, minhaCidade, valorTotalStr, idTransacao);

    mostrarTelaPagamentoPix(payloadPix, valorTotalStr);
});

function mostrarTelaPagamentoPix(payload, valor) {
    const modalDiv = document.createElement('div');
    modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:1000; font-family:'Inter', sans-serif;";
    
    modalDiv.innerHTML = `
        <div style="background:white; padding:30px; border-radius:16px; text-align:center; max-width:400px; width:90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <h3 style="margin-bottom: 10px; color: #111; font-size: 20px;">Pague com Pix</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Total a pagar: <strong style="color: #059669; font-size: 18px;">R$ ${valor}</strong></p>
            
            <div id="qrcode-container" style="margin: 15px auto; display:flex; justify-content:center; background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; width: fit-content;"></div>
            
            <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">Escaneie o QR Code com o app do seu banco ou copie o código abaixo:</p>
            
            <input type="text" id="pix-copia-cola" value="${payload}" readonly style="width:100%; padding: 10px; font-size: 12px; margin-bottom:10px; border: 1px solid #d1d5db; border-radius: 6px; background: #f3f4f6; text-align: center;" />
            
            <button id="btn-copiar" style="background: #2563eb; color: white; border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 8px;">📋 Copiar Código Pix</button>
            
            <button id="btn-fechar-pix" style="background: #dc2626; color: white; border: none; padding: 10px; width: 100%; border-radius: 6px; font-weight: 600; cursor: pointer;">Fechar / Já Paguei</button>
        </div>
    `;

    document.body.appendChild(modalDiv);

    // Desenha o QR Code
    new QRCode(document.getElementById("qrcode-container"), {
        text: payload,
        width: 180,
        height: 180
    });

    // Ação do botão Copiar
    document.getElementById('btn-copiar').addEventListener('click', () => {
        const inputCopia = document.getElementById('pix-copia-cola');
        inputCopia.select();
        navigator.clipboard.writeText(inputCopia.value);
        alert('Código Pix copiado com sucesso!');
    });

    // Ação de fechar e limpar carrinho do armazenamento local após pagamento
    document.getElementById('btn-fechar-pix').addEventListener('click', () => {
        modalDiv.remove();
        carrinho = [];
        salvarESincronizar();
    });
}
