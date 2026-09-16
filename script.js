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
