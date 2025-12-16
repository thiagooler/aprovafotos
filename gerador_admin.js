document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos ---
    const configSection = document.getElementById('config-section');
    const tokenInput = document.getElementById('gh-token');
    const userInput = document.getElementById('gh-user');
    const repoInput = document.getElementById('gh-repo');
    const saveConfigBtn = document.getElementById('save-config-btn');
    
    const clientNameInput = document.getElementById('client-name');
    const whatsappInput = document.getElementById('whatsapp-number');
    const urlListInput = document.getElementById('url-list');
    const publishBtn = document.getElementById('publish-btn');
    
    const statusContainer = document.getElementById('status-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const finalUrlInput = document.getElementById('final-url');
    const openLinkBtn = document.getElementById('open-link-btn');

    // --- 1. Gerenciamento de Configurações (LocalStorage) ---
    function loadConfig() {
        const config = JSON.parse(localStorage.getItem('nbv_gh_config'));
        if (config) {
            tokenInput.value = config.token || '';
            userInput.value = config.user || '';
            repoInput.value = config.repo || '';
        } else {
            // Se não tiver config, abre a aba automaticamente
            configSection.classList.remove('hidden');
        }
    }

    saveConfigBtn.addEventListener('click', () => {
        const config = {
            token: tokenInput.value.trim(),
            user: userInput.value.trim(),
            repo: repoInput.value.trim()
        };
        localStorage.setItem('nbv_gh_config', JSON.stringify(config));
        alert('Configurações salvas no navegador! Guerreiro, prossiga.');
        configSection.classList.add('hidden');
    });

    loadConfig();

    // --- 2. Função Auxiliar para Encodar Unicode para Base64 (GitHub exige) ---
    function utf8_to_b64(str) {
        return window.btoa(unescape(encodeURIComponent(str)));
    }

    // --- 3. Função Principal de Publicação ---
    publishBtn.addEventListener('click', async () => {
        // Validações básicas
        const config = JSON.parse(localStorage.getItem('nbv_gh_config'));
        if (!config || !config.token || !config.user || !config.repo) {
            alert("Erro: Configure as credenciais do GitHub primeiro (clique na engrenagem).");
            configSection.classList.remove('hidden');
            return;
        }

        const clientSlug = clientNameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
        const urls = urlListInput.value.split('\n').filter(u => u.trim() !== '');
        
        if (!clientSlug || urls.length === 0) {
            alert("Preencha o nome do cliente e as URLs das fotos.");
            return;
        }

        // UI de Carregamento
        statusContainer.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        publishBtn.disabled = true;
        publishBtn.classList.add('opacity-50');

        try {
            // 1. Gera o código HTML (Usa a função geradora interna)
            const htmlContent = generateApprovalGalleryHtml(urls, whatsappInput.value);
            
            // 2. Prepara os dados para a API do GitHub
            const filePath = `clientes/${clientSlug}/index.html`; // Caminho onde o arquivo será criado
            const apiUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${filePath}`;
            const message = `Adicionando galeria para cliente: ${clientSlug}`;
            const contentBase64 = utf8_to_b64(htmlContent);

            // 3. Verifica se o arquivo já existe (para pegar o SHA caso precise atualizar)
            let sha = null;
            try {
                const checkReq = await fetch(apiUrl, {
                    headers: { 
                        'Authorization': `token ${config.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (checkReq.ok) {
                    const fileData = await checkReq.json();
                    sha = fileData.sha; // Se existir, pegamos o SHA para sobrescrever
                }
            } catch (e) {
                console.log('Arquivo novo, sem SHA prévio.');
            }

            // 4. Faz o PUT (Upload)
            const bodyData = {
                message: message,
                content: contentBase64,
                branch: 'main' // ou 'master', dependendo do seu repo
            };
            if (sha) bodyData.sha = sha;

            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro GitHub: ${errorData.message}`);
            }

            // 5. Sucesso!
            const pagesUrl = `https://${config.user}.github.io/${config.repo}/clientes/${clientSlug}/`;
            
            loadingSpinner.classList.add('hidden');
            successMessage.classList.remove('hidden');
            finalUrlInput.value = pagesUrl;
            openLinkBtn.href = pagesUrl;

        } catch (error) {
            loadingSpinner.classList.add('hidden');
            errorMessage.classList.remove('hidden');
            errorMessage.textContent = `Falha na operação: ${error.message}`;
            publishBtn.disabled = false;
            publishBtn.classList.remove('opacity-50');
        }
    });
});


// --- LÓGICA DE GERAÇÃO DO HTML (A mesma que você já tinha, embutida aqui) ---
function generateApprovalGalleryHtml(imageUrls, whatsappNumber) {
    // ESTILOS CSS (Minificados para caber melhor na string)
    const style = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');
        :root { --bg-color: #1a1a2e; --card-bg-color: #2e305e; --text-color: #e0e0e0; --accent: #4169E1; --green: #22c55e; }
        body { font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-color); margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .photo-card { background: var(--card-bg-color); border-radius: 10px; overflow: hidden; position: relative; transition: transform 0.2s; }
        .photo-card:hover { transform: translateY(-5px); }
        .photo-card img { width: 100%; height: 250px; object-fit: contain; background: #000; cursor: pointer; }
        .controls { padding: 15px; display: flex; gap: 10px; flex-wrap: wrap; }
        button { flex: 1; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; color: #fff; transition: 0.3s; }
        .btn-approve { background: #555; } .btn-approve.active { background: var(--green); }
        .btn-comment { background: #555; } .btn-comment.active { background: var(--accent); }
        textarea { width: 100%; box-sizing: border-box; background: #1a1a2e; color: #fff; border: 1px solid #444; padding: 10px; margin-top: 10px; display: none; }
        textarea.show { display: block; }
        .submit-bar { position: fixed; bottom: 0; left: 0; width: 100%; background: #2e305e; padding: 20px; text-align: center; box-shadow: 0 -5px 20px rgba(0,0,0,0.5); z-index: 99; }
        .btn-final { background: var(--green); padding: 15px 40px; font-size: 1.1em; }
        /* Modal */
        .modal { display: none; position: fixed; z-index: 999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); justify-content: center; align-items: center; }
        .modal img { max-width: 90%; max-height: 90%; }
        .close-modal { position: absolute; top: 20px; right: 30px; color: #fff; font-size: 40px; cursor: pointer; }
    `;

    const photoCards = imageUrls.map((url, i) => {
        // Correção de segurança e nome do arquivo
        const name = url.split('/').pop().split('?')[0] || `Foto ${i+1}`;
        return `
            <div class="photo-card" id="card-${i}">
                <img src="${url}" onclick="openModal('${url}')" loading="lazy">
                <div class="controls">
                    <button class="btn-approve" onclick="toggleStatus(${i}, 'approved')"><i class="fas fa-check"></i> Aprovar</button>
                    <button class="btn-comment" onclick="toggleComment(${i})"><i class="fas fa-comment"></i> Comentar</button>
                </div>
                <textarea id="comment-${i}" placeholder="Descreva a alteração..."></textarea>
            </div>`;
    }).join('');

    // SCRIPT DO LADO DO CLIENTE (O que vai DENTRO do HTML gerado)
    const clientScript = `
        const state = {};
        
        function toggleStatus(id, status) {
            const card = document.getElementById('card-' + id);
            const btnApprove = card.querySelector('.btn-approve');
            
            if (state[id]?.status === status) {
                state[id].status = null; // Toggle off
                btnApprove.classList.remove('active');
                btnApprove.innerHTML = '<i class="fas fa-check"></i> Aprovar';
            } else {
                if(!state[id]) state[id] = {};
                state[id].status = status;
                btnApprove.classList.add('active');
                btnApprove.innerHTML = '<i class="fas fa-check"></i> APROVADA';
                // Remove comentário se aprovar? Opcional.
            }
        }

        function toggleComment(id) {
            const txt = document.getElementById('comment-' + id);
            txt.classList.toggle('show');
            if (txt.classList.contains('show')) txt.focus();
        }

        function openModal(src) {
            document.getElementById('modal-img').src = src;
            document.getElementById('modal').style.display = 'flex';
        }
        document.getElementById('modal').onclick = (e) => {
            if(e.target !== document.getElementById('modal-img')) 
                document.getElementById('modal').style.display = 'none';
        }

        function sendWhatsapp() {
            let msg = "*Aprovação de Fotos - ${new Date().toLocaleDateString()}*\\n\\n";
            let hasComment = false;
            
            document.querySelectorAll('.photo-card').forEach((card, i) => {
                const name = card.querySelector('img').src.split('/').pop().split('?')[0];
                const status = state[i]?.status;
                const comment = document.getElementById('comment-' + i).value.trim();
                
                if (status === 'approved') {
                    // msg += "✅ " + name + " (Aprovada)\\n"; 
                    // Opcional: listar apenas exceções ou todas
                } else if (comment) {
                    msg += "⚠️ " + name + ": " + comment + "\\n";
                    hasComment = true;
                }
            });

            if (!hasComment) {
                msg += "Todas as fotos marcadas foram aprovadas! ✅";
            } else {
                msg += "\\nPor favor, verifique as observações acima.";
            }

            const phone = "${whatsappNumber}"; 
            window.open("https://api.whatsapp.com/send?phone=" + phone + "&text=" + encodeURIComponent(msg), '_blank');
        }
    `;

    return `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galeria de Aprovação</title>
    <style>${style}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Galeria de Aprovação</h1>
            <p>Selecione as fotos para aprovar ou adicione comentários.</p>
        </div>
        <div class="gallery">
            ${photoCards}
        </div>
        <div style="height: 100px;"></div>
    </div>
    
    <div class="submit-bar">
        <button class="btn-final" onclick="sendWhatsapp()">Enviar Aprovação via WhatsApp</button>
    </div>

    <div id="modal" class="modal">
        <span class="close-modal">&times;</span>
        <img id="modal-img" src="">
    </div>

    <script>${clientScript}<\/script>
</body>
</html>`;
}

// Função simples para copiar URL
function copyUrl() {
    const copyText = document.getElementById("final-url");
    copyText.select();
    document.execCommand("copy");
    alert("Link copiado: " + copyText.value);
}
