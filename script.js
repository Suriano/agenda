let carrinho = [];

const botoesComprar = document.querySelectorAll('.btn-comprar');
const listaCarrinho = document.getElementById('lista-carrinho');
const valorTotal = document.getElementById('valor-total');
const contadorCarrinho = document.getElementById('contador-carrinho');
const btnFinalizar = document.getElementById('btn-finalizar');

botoesComprar.forEach(botao => {
    botao.addEventListener('click', (evento) => {
        const produtoDiv = evento.target.parentElement;
        const id = produtoDiv.getAttribute('data-id');
        const nome = produtoDiv.getAttribute('data-nome');
        const preco = parseFloat(produtoDiv.getAttribute('data-preco'));
        const imagem = produtoDiv.getAttribute('data-img'); // Pega a imagem

        adicionarAoCarrinho(id, nome, preco, imagem);
    });
});

// Adicionamos o parâmetro 'imagem' na função
function adicionarAoCarrinho(id, nome, preco, imagem) {
    const itemExistente = carrinho.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ id, nome, preco, imagem, quantidade: 1 });
    }

    atualizarCarrinho();
}

function atualizarCarrinho() {
    listaCarrinho.innerHTML = '';
    let total = 0;
    let quantidadeTotal = 0;

    carrinho.forEach((item, index) => {
        total += item.preco * item.quantidade;
        quantidadeTotal += item.quantidade;

        const li = document.createElement('li');
        
        // Incluímos a tag <img> dentro do HTML gerado do carrinho
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

function removerItem(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}


// Função para gerar o código Copia e Cola do Pix Estático
function gerarPayloadPix(chavePix, nomeRecebedor, cidadeRecebedor, valor, identificador) {
    // Função auxiliar para formatar os campos do padrão Pix (EMV)
    const formatField = (id, value) => {
        const len = String(value.length).padStart(2, '0');
        return `${id}${len}${value}`;
    };

    const gui = formatField('00', 'br.gov.bcb.pix');
    const key = formatField('01', chavePix);
    const desc = identificador ? formatField('02', identificador) : '';
    const merchantAccount = formatField('26', gui + key + desc);
    
    const merchantCategoryCode = formatField('52', '0000');
    const currency = formatField('53', '986'); // Real brasileiro
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
        '6304'; // CRC16 (checksum simplificado)

    // Cálculo do CRC16 do Pix (padrão BCC)
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



// No seu script.js, adapte o botão finalizar:
btnFinalizar.addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    const valorTotalStr = document.getElementById('valor-total').textContent;
    
    // Insira seus dados reais aqui:
    const minhaChavePix = "12345678900"; // Seu CPF (somente números) ou chave
    const meuNome = "SEU NOME COMPLETO";  // Nome da sua conta bancária
    const minhaCidade = "SAO PAULO";     // Sua cidade
    const idTransacao = "PEDIDO" + Math.floor(Math.random() * 1000);

    // Gera a string do Pix Copia e Cola
    const payloadPix = gerarPayloadPix(minhaChavePix, meuNome, minhaCidade, valorTotalStr, idTransacao);

    // Cria um modal ou exibe na tela os dados do Pix para o cliente pagar
    mostrarTelaPagamentoPix(payloadPix, valorTotalStr);
});

function mostrarTelaPagamentoPix(payload, valor) {
    // Cria uma caixa de pagamento na tela dinamicamente
    const modalDiv = document.createElement('div');
    modalDiv.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:1000;";
    
    modalDiv.innerHTML = `
        style="background:white; padding:30px; border-radius:12px; text-align:center; max-width:400px; width:90%;">
            <h3>Pague via Pix</h3>
            <p>Valor: <strong>R$ ${valor}</strong></p>
            <div id="qrcode-container" style="margin: 15px 0; display:flex; justify-content:center;"></div>
            <p style="font-size: 12px; color: #666;">Escaneie o QR Code acima ou copie o código abaixo:</p>
            <textarea readonly style="width:100%; height:60px; font-size:11px; margin-bottom:10px;">${payload}</textarea>
            <button id="btn-fechar-pix" style="background:#dc2626; width:100%;">Fechar / Já Paguei</button>
        </div>
    `;

    document.body.appendChild(modalDiv);

    // Desenha o QR Code visualmente usando a biblioteca importada
    new QRCode(document.getElementById("qrcode-container"), {
        text: payload,
        width: 200,
        height: 200
    });

    document.getElementById('btn-fechar-pix').addEventListener('click', () => {
        modalDiv.remove();
        carrinho = [];
        atualizarCarrinho();
    });
}
