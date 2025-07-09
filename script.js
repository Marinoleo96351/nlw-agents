const apiKeyInput = document.getElementById('apiKey');
const gameSelect = document.getElementById('gameSelect');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const aiResponse = document.getElementById('aiResponse');
const form = document.getElementById('form');

const markdownToHTML = (text) => {
    // Esta função assume que a biblioteca 'showdown' está importada no seu HTML.
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
}

const perguntarAI = async (question, game, apiKey) => {
    // CORREÇÃO: O nome do modelo foi atualizado para um modelo válido e recente.
    // O modelo "gemini-2.0-flash" não existe publicamente.
    const model = "gemini-1.5-flash-latest";

    // CORREÇÃO: A URL da API foi corrigida. O parâmetro da chave de API
    // deve ser separado por '=', e não por '+'.
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // CORREÇÃO: O formato da data foi alterado para o padrão ISO (YYYY-MM-DD)
    // para evitar ambiguidades de localidade.
    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `
    ## Especialidade
    Você é um especialista assistente de meta para o jogo ${game}.

    ## Tarefa
    Você deve responder as perguntas do usuário com base no seu conhecimento do jogo, estratégias, build e dicas.

    ## Regras
    - Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
    - Se a pergunta não está relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'.
    - Considere a data atual ${currentDate}.
    - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente.
    - Nunca responda itens que você não tenha certeza de que existem no patch atual.

    ## Resposta
    - Economize na resposta, seja direto e responda no máximo 500 caracteres.
    - Responda em markdown.
    - Não precisa fazer nenhuma saudação ou despedida, apenas responda o que o usuário está querendo.

    ## Exemplo de resposta
    pergunta do usuário: Melhor build rengar jungle
    resposta: A build mais atual é:

    **Itens:**

    [Itens aqui]

    **Runas:**

    [Runas aqui]

    ---
    Aqui está a pergunta do usuário: ${question}
    `;

    const contents = [{
        role: "user",
        parts: [{
            text: prompt
        }]
    }];

    // CORREÇÃO: A ferramenta de busca do Google deve ser referenciada em camelCase ('googleSearch').
    const tools = [{
        "googleSearch": {}
    }];

    // Chamada à API
    const response = await fetch(geminiURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents,
            tools
        })
    });

    // CORREÇÃO: Adicionada verificação de erro para a resposta da API.
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro na API: ${response.statusText} - ${errorData.error.message}`);
    }

    const data = await response.json();

    // CORREÇÃO: Adicionada verificação para o caso de não haver candidatos na resposta.
    if (!data.candidates || data.candidates.length === 0) {
        // Isso pode ocorrer devido a filtros de segurança, por exemplo.
        return "Não foi possível obter uma resposta da IA. Tente reformular sua pergunta.";
    }

    return data.candidates[0].content.parts[0].text;
}

const enviarFormulario = async (event) => {
    event.preventDefault();
    const apiKey = apiKeyInput.value.trim(); // .trim() para remover espaços em branco
    const game = gameSelect.value;
    const question = questionInput.value.trim(); // .trim() para remover espaços em branco

    if (apiKey === '' || game === '' || question === '') {
        alert('Por favor, preencha todos os campos');
        return;
    }

    askButton.disabled = true;
    askButton.textContent = 'Perguntando...';
    askButton.classList.add('loading');
    aiResponse.classList.add('hidden'); // Esconder a resposta anterior

    try {
        const text = await perguntarAI(question, game, apiKey);
        aiResponse.querySelector('.response-content').innerHTML = markdownToHTML(text);
        aiResponse.classList.remove('hidden');
    } catch (error) {
        // Exibe o erro de forma mais amigável para o usuário
        const errorContent = `**Ocorreu um erro:**\n\n${error.message}`;
        aiResponse.querySelector('.response-content').innerHTML = markdownToHTML(errorContent);
        aiResponse.classList.remove('hidden');
        console.error('Erro: ', error); // Mantém o log do erro no console para depuração
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Perguntar";
        askButton.classList.remove('loading');
    }
}

form.addEventListener('submit', enviarFormulario);