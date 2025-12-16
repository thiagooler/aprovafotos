document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos ---
    const configSection = document.getElementById('config-section');
    const tokenInput = document.getElementById('gh-token');
    const userInput = document.getElementById('gh-user');
    const repoInput = document.getElementById('gh-repo');
    const saveConfigBtn = document.getElementById('save-config-btn');
    
    const clientNameInput = document.getElementById('client-name');
    const whatsappInput = document.getElementById('whatsapp-number');
    
    // MUDANÇA: Input de arquivo em vez de textarea
    const fileInput = document.getElementById('file-input'); // Precisamos mudar isso no HTML também
    const publishBtn = document.getElementById('publish-btn');
    
    const statusContainer = document.getElementById('status-container');
    const progressBar = document.getElementById('progress-bar'); // Novo elemento de progresso
    const progressText = document.getElementById('progress-text'); // Texto do progresso
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    const finalUrlInput = document.getElementById('final-url');
    const openLinkBtn = document.getElementById('open-link-btn');

    // --- 1. Configurações (Mantido igual) ---
    function loadConfig() {
        const config = JSON.parse(localStorage.getItem('nbv_gh_config'));
        if (config) {
            tokenInput.value = config.token || '';
            userInput.value = config.user || '';
            repoInput.value = config.repo || '';
        } else {
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
        alert('Configurações salvas!');
        configSection.classList.add('hidden');
    });

    loadConfig();

    // --- Auxiliar: Ler arquivo como Base64 (apenas para o upload, não para o HTML) ---
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });

    // --- 2. Função Principal de Publicação ---
    publishBtn.addEventListener('click', async () => {
        const config = JSON.parse(localStorage.getItem('nbv_gh_config'));
        if (!config || !config.token) {
            alert("Configure as credenciais primeiro.");
            return;
        }

        const clientSlug = clientNameInput.value.trim().toLowerCase().replace(/\s+/g, '-');
        const files = fileInput.files;
        
        if (!clientSlug || files.length === 0) {
            alert("Preencha o nome do cliente e selecione as fotos.");
            return;
        }

        // UI Reset
        statusContainer.classList.remove('hidden');
        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');
        publishBtn.disabled = true;
        publishBtn.classList.add('opacity-50');
        
        // Exibir barra de progresso
        document.getElementById('loading-ui').classList.remove('hidden');

        try {
            const uploadedImageUrls = [];
            const totalFiles = files.length;

            // --- ETAPA 1: Upload das Imagens ---
            for (let i = 0; i < totalFiles; i++) {
                const file = files[i];
                // Limpa nome do arquivo para evitar caracteres estranhos na URL
                const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, ''); 
                const path = `clientes/${clientSlug}/img/${cleanFileName}`;
                
                // Atualiza progresso
                const percent = Math.round(((i) / totalFiles) * 100);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `Enviando foto ${i + 1} de ${totalFiles}...`;

                // Converte para base64 APENAS para enviar para a API
                const contentBase64 = await toBase64(file);

                // PUT request para o GitHub
                const response = await fetch(`https://api.github.com/repos/${config.user}/${config.repo}/contents/${path}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${config.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `Upload img ${cleanFileName}`,
                        content: contentBase64,
                        branch: 'main' // ou master
                    })
                });

                if (!response.ok) {
                    // Se der erro (ex: arquivo já existe), tentamos continuar ou paramos?
                    // Vamos logar e continuar para não perder tudo
                    console.error(`Erro ao subir ${file.name}`, await response.json());
                }

                // Monta a URL pública onde a imagem vai ficar
                const rawUrl = `https://${config.user}.github.io/${config.repo}/clientes/${clientSlug}/img/${cleanFileName}`;
                uploadedImageUrls.push(rawUrl);
            }

            // --- ETAPA 2: Gerar e Subir o HTML ---
            progressText.textContent = "Gerando galeria...";
            const htmlContent = generateApprovalGalleryHtml(uploadedImageUrls, whatsappInput.value);
            const htmlBase64 = btoa(unescape(encodeURIComponent(htmlContent)));

            const htmlPath = `clientes/${clientSlug}/index.html`;
            
            await fetch(`https://api.github.com/repos/${config.user}/${config.repo}/contents/${htmlPath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${config.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Create gallery index for ${clientSlug}`,
                    content: htmlBase64,
                    branch: 'main'
                })
            });

            // Sucesso
            progressBar.style.width = `100%`;
            const pagesUrl = `https://${config.user}.github.io/${config.repo}/clientes/${clientSlug}/`;
            
            document.getElementById('loading-ui').classList.add('hidden');
            successMessage.classList.remove('hidden');
            finalUrlInput.value = pagesUrl;
            openLinkBtn.href = pagesUrl;

        } catch (error) {
            document.getElementById('loading-ui').classList.add('hidden');
            errorMessage.classList.remove('hidden');
            errorMessage.textContent = `Erro: ${error.message}`;
            publishBtn.disabled = false;
            publishBtn.classList.remove('opacity-50');
        }
    });
});

// --- Função Geradora de HTML (Mantida a mesma do passo anterior, ou reduzida) ---
function generateApprovalGalleryHtml(imageUrls, whatsappNumber) {
    // ... (Copie a função generateApprovalGalleryHtml completa da resposta anterior aqui) ...
    // Vou incluir a versão curta aqui para o contexto, mas use a completa que mandei antes.
    
    const style = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css');
        :root { --bg-color: #1a1a2e; --card-bg-color: #2e305e; --text-color: #e0e0e0; --accent: #4169E1; --green: #22c55e; }
        body { font-family: 'Inter', sans-serif; background: var(--bg-color); color: var(--text-color); margin: 0; padding: 20px; padding-bottom: 100px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .photo-card { background: var(--card-bg-color); border-radius: 10px; overflow: hidden; position: relative; }
        .photo-card img { width: 100%; height: 250px; object-fit: contain; background: #000; cursor: pointer; }
        .controls { padding: 15px; display: flex; gap: 10px; }
        button { flex: 1; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; color: #fff; }
        .btn-approve { background: #555; } .btn-approve.active { background: var(--green); }
        .btn-comment { background: #555; } .btn-comment.active { background: var(--accent); }
        textarea { width: 100%; background: #1a1a2e; color: #fff; border: 1px solid #444; padding: 10px; margin-top: 10px; display: none; }
        textarea.show { display: block; }
        .submit-bar { position: fixed; bottom: 0; left: 0; width: 100%; background: #2e305e; padding: 20px; text-align: center; box-shadow: 0 -5px 20px rgba(0,0,0,0.5); z-index: 99; }
        .btn-final { background: var(--green); padding: 15px 40px; font-size: 1.1em; border-radius: 8px; cursor: pointer; border: none; color: white; font-weight: bold;}
        .modal { display: none; position: fixed; z-index: 999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); justify-content: center; align-items: center; }
        .modal img { max-width: 90%; max-height: 90%; }
        .close-modal { position: absolute; top: 20px; right: 30px; color: #fff; font-size: 40px; cursor: pointer; }
    `;

    const photoCards = imageUrls.map((url, i) => {
        const name = url.split('/').pop();
        return `
            <div class="photo-card" id="card-${i}">
                <img src="${url}" onclick="openModal('${url}')" loading="lazy">
                <div class="controls">
                    <button class="btn-approve" onclick="toggleStatus(${i}, 'approved')"><i class="fas fa-check"></i> Aprovar</button>
                    <button class="btn-comment" onclick="toggleComment(${i})"><i class="fas fa-comment"></i> Comentar</button>
                </div>
                <textarea id="comment-${i}" placeholder="O que precisa ajustar?"></textarea>
            </div>`;
    }).join('');

    const clientScript = `
        const state = {};
        function toggleStatus(id, status) {
            const card = document.getElementById('card-' + id);
            const btnApprove = card.querySelector('.btn-approve');
            if (state[id]?.status === status) {
                state[id].status = null;
                btnApprove.classList.remove('active');
                btnApprove.innerHTML = '<i class="fas fa-check"></i> Aprovar';
            } else {
                if(!state[id]) state[id] = {};
                state[id].status = status;
                btnApprove.classList.add('active');
                btnApprove.innerHTML = '<i class="fas fa-check"></i> APROVADA';
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
        document.querySelector('.close-modal').onclick = () => document.getElementById('modal').style.display = 'none';
        document.getElementById('modal').onclick = (e) => { if(e.target === document.getElementById('modal')) document.getElementById('modal').style.display = 'none'; }
        
        function sendWhatsapp() {
            let msg = "*Aprovação de Fotos*\\nCliente: ${whatsappNumber}\\n\\n"; // Aqui você pode por o nome do cliente dinamicamente se quiser
            let hasComment = false;
            document.querySelectorAll('.photo-card').forEach((card, i) => {
                const name = card.querySelector('img').src.split('/').pop();
                const status = state[i]?.status;
                const comment = document.getElementById('comment-' + i).value.trim();
                if (status === 'approved') {
                    // msg += "✅ " + name + "\\n";
                } else if (comment) {
                    msg += "⚠️ " + name + ": " + comment + "\\n";
                    hasComment = true;
                }
            });
            if (!hasComment) msg += "Todas as fotos marcadas foram aprovadas! ✅";
            else msg += "\\nVeja as observações acima.";
            
            window.open("https://api.whatsapp.com/send?phone=${whatsappNumber}&text=" + encodeURIComponent(msg), '_blank');
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
        <div class="header"><h1>Galeria de Aprovação</h1></div>
        <div class="gallery">${photoCards}</div>
    </div>
    <div class="submit-bar"><button class="btn-final" onclick="sendWhatsapp()">Enviar via WhatsApp</button></div>
    <div id="modal" class="modal"><span class="close-modal">&times;</span><img id="modal-img"></div>
    <script>${clientScript}<\/script>
</body>
</html>`;
}
