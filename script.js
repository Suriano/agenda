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



btnFinalizar.addEventListener('click', async () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    try {
        // Envia o carrinho para o seu backend
        const resposta = await fetch('http://localhost:3000/criar-preferencia', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itens: carrinho })
        });

        const dados = await resposta.json();

        if (dados.init_point) {
            // Redireciona o usuário para o ambiente de pagamento seguro do Mercado Pago
            window.location.href = dados.init_point;
        } else {
            alert('Erro ao gerar o pagamento.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível conectar ao servidor de pagamento.');
    }
});
