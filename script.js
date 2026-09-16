// Array para armazenar os produtos do carrinho
let carrinho = [];

// Seleciona os elementos do DOM
const botoesComprar = document.querySelectorAll('.btn-comprar');
const listaCarrinho = document.getElementById('lista-carrinho');
const valorTotal = document.getElementById('valor-total');
const contadorCarrinho = document.getElementById('contador-carrinho');
const btnFinalizar = document.getElementById('btn-finalizar');

// Adiciona evento de clique em cada botão de compra
botoesComprar.forEach(botao => {
    botao.addEventListener('click', (evento) => {
        const produtoDiv = evento.target.parentElement;
        const id = produtoDiv.getAttribute('data-id');
        const nome = produtoDiv.getAttribute('data-nome');
        const preco = parseFloat(produtoDiv.getAttribute('data-preco'));

        adicionarAoCarrinho(id, nome, preco);
    });
});

function adicionarAoCarrinho(id, nome, preco) {
    // Verifica se o item já está no carrinho
    const itemExistente = carrinho.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ id, nome, preco, quantidade: 1 });
    }

    atualizarCarrinho();
}

function atualizarCarrinho() {
    // Limpa a lista visual
    listaCarrinho.innerHTML = '';
    let total = 0;
    let quantidadeTotal = 0;

    carrinho.forEach((item, index) => {
        total += item.preco * item.quantidade;
        quantidadeTotal += item.quantidade;

        // Cria o elemento HTML para cada item do carrinho
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.nome} (x${item.quantidade}) - R$ ${(item.preco * item.quantidade).toFixed(2)}
            <button onclick="removerItem(${index})">❌</button>
        `;
        listaCarrinho.appendChild(li);
    });

    // Atualiza os totais na tela
    valorTotal.textContent = total.toFixed(2);
    contadorCarrinho.textContent = quantidadeTotal;
}

function removerItem(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

btnFinalizar.addEventListener('click', () => {
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    alert('Compra finalizada com sucesso! O total foi R$ ' + valorTotal.textContent);
    carrinho = [];
    atualizarCarrinho();
});
