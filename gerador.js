// Arquivo: generateGallery.js

const fs = require('fs');
const path = require('path');

/**
 * Gera o conteúdo HTML completo da galeria de aprovação com estilo moderno.
 * (A função é uma adaptação da lógica do seu gerador.js)
 * @param {string[]} imageUrls Lista de URLs das imagens.
 * @param {string} whatsappNumber Número de telefone do WhatsApp.
 * @returns {string} O conteúdo HTML completo da galeria.
 */
function generateApprovalGalleryHtml(imageUrls, whatsappNumber) {
    // Conteúdo de estilo (STYLE) e script (JS_CODE) omitidos para brevidade.
    // Você deve copiar o conteúdo literal das variáveis 'style' e 'jsCode' do seu gerador.js
    // e incluí-las aqui como strings multilinhas.
    
    // EX:
    const style = `
        @import url('https://fonts.com/...');
        // ... todo o CSS aqui ...
    `;
    
    const jsCode = `
        document.addEventListener('DOMContentLoaded', () => { 
            // ... todo o JS de interação do cliente aqui ... 
        });
    `;

    // Mapeia as URLs para cartões de fotos HTML (Mesma lógica do seu gerador.js)
    const photoCardsHTML = imageUrls.map((url, index) => {
        const filename = url.split('/').pop().split('?')[0];
        return `
            <div class="photo-card" data-filename="${filename}" id="photo-${index}" data-id="${index}">
                <div class="image-container">
                    <img src="${url}" alt="Foto ${filename}" loading="lazy" onerror="this.src='https://placehold.co/300x250/1e1e1e/f5f5f5?text=Imagem+Nao+Encontrada'; this.alt='Imagem não encontrada;'">
                </div>
                <div class="photo-info">
                    <h3>${filename}</h3>
                    <div class="flex-row">
                        <button class="btn-action btn-approve"><i class="fas fa-check"></i> Aprovar</button>
                        <button class="btn-action btn-comment"><i class="fas fa-comment"></i> Comentar</button>
                    </div>
                </div>
                <div class="edit-section">
                    <textarea placeholder="Adicione seu comentário sobre esta foto..."></textarea>
                </div>
                <div class="status-indicator"></div>
            </div>
        `;
    }).join('');

    // Retorna o HTML completo da galeria
    return `<!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Aprovação de Fotos</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css">
            <style>${style}</style>
        </head>
        <body>
            <div class="container">
                <div class="info-card">
                    <h1>Aprovação de Fotos</h1>
                    <p class="description">Clique na foto para visualizar em tamanho maior. Use os botões para "Aprovar" ou "Comentar". Quando terminar, clique no botão azul no final da página para enviar as aprovações e comentários.</p>
                </div>
                
                <div class="status-panel">
                    <div class="status-item">
                        <span id="counter-total">0</span>
                        <p>Fotos Totais</p>
                    </div>
                    <div class="status-item">
                        <span id="counter-approved">0</span>
                        <p>Aprovadas</p>
                    </div>
                    <div class="status-item">
                        <span id="counter-pending">0</span>
                        <p>Pendentes</p>
                    </div>
                    <div class="status-filters">
                        <button id="filter-all" class="filter-btn active" data-filter="all">Mostrar Tudo</button>
                        <button id="filter-approved" class="filter-btn" data-filter="approved">Aprovadas</button>
                        <button id="filter-pending" class="filter-btn" data-filter="pending">Pendentes</button>
                    </div>
                </div>
                
                <div class="gallery" id="photo-gallery">
                    ${photoCardsHTML}
                </div>
                <button class="btn-submit-all">Finalizar e Enviar via WhatsApp</button>
                <div id="photo-modal">
                    <span class="close">&times;</span>
                    <img class="modal-content" id="modal-image">
                </div>
            </div>
            <script>${jsCode}</script>
        </body>
        </html>`;
}

// Lógica de execução:
// 1. Recebe os dados de entrada (URLs, Nome do Cliente/Subpasta, WhatsApp)
// 2. Chama generateApprovalGalleryHtml(urls, whatsapp)
// 3. Salva o resultado no caminho da subpasta (e.g., /galleries/cliente-x/index.html)
// 4. Retorna o link gerado (ex: https://seuusuario.github.io/seu-repo/galleries/cliente-x/index.html)

module.exports = {
    generateApprovalGalleryHtml
};

// --- Exemplo de uso em um script de automação: ---
// const clientName = process.argv[2]; // Ex: 'cliente-joao'
// const imageUrls = ['url1', 'url2', 'url3']; // De uma fonte de dados
// const whatsapp = '5542998370150';

// const html = generateApprovalGalleryHtml(imageUrls, whatsapp);
// const outputPath = path.join(__dirname, 'galleries', clientName, 'index.html');

// fs.mkdirSync(path.dirname(outputPath), { recursive: true });
// fs.writeFileSync(outputPath, html);
// console.log(\`Galeria gerada em: \${outputPath}\`);
