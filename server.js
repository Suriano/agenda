import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const app = express();

// Configuração do CORS para permitir requisições vindas do seu GitHub Pages
app.use(cors({
    origin: '*' // Se preferir mais segurança, substitua '*' pela URL exata do seu site no GitHub Pages (ex: 'https://seuusuario.github.io')
}));

app.use(express.json());

// Inicializa o cliente do Mercado Pago usando a Variável de Ambiente configurada no Render
const client = new MercadoPagoConfig({ 
    accessToken: process.env.ACCESS_TOKEN 
});

// Rota de teste para verificar se o servidor está online
app.get('/', (req, res) => {
    res.json({ status: 'Servidor rodando com sucesso!' });
});

// Rota que cria a preferência de pagamento
app.post('/criar-preferencia', async (req, res) => {
    try {
        const { itens, emailComprador } = req.body;

        if (!itens || itens.length === 0) {
            return res.status(400).json({ erro: 'O carrinho está vazio.' });
        }

        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: itens.map(item => ({
                    title: item.nome,
                    quantity: Number(item.quantidade),
                    unit_price: Number(item.preco),
                    currency_id: 'BRL'
                })),
                payer: {
                    email: emailComprador || 'comprador@teste.com'
                },
                back_urls: {
                    success: 'https://seuusuario.github.io/seu-repositorio/sucesso.html', // Ajuste para sua página de sucesso
                    failure: 'https://suriano.github.io/agenda/',
                    pending: 'https://suriano.github.io/agenda/'
                },
                auto_return: 'approved',
            }
        });

        // Retorna o link de pagamento (init_point) gerado pelo Mercado Pago
        res.json({ init_point: result.init_point });
    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ erro: 'Erro interno ao processar o pagamento.' });
    }
});

// O Render define a porta automaticamente através de process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
