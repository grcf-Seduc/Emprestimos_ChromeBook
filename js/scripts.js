// =============================================================
// scripts.js — Lógica principal da página de Empréstimos
// Responsável por: registrar empréstimos, exibir a lista,
// gerar o termo de responsabilidade para impressão e gerenciar
// as ações de devolver, excluir e marcar como assinado.
// Todos os dados são salvos no localStorage do navegador,
// ou seja, ficam guardados mesmo após fechar o navegador.
// =============================================================


// ── Armazenamento em memória ──────────────────────────────────
// Array que guarda todos os empréstimos ativos durante a sessão.
// É populado a partir do localStorage quando a página carrega.
let emprestimos = [];


// ── Inicialização da página ───────────────────────────────────
// O evento 'DOMContentLoaded' dispara quando o HTML terminou de
// ser lido pelo navegador, garantindo que todos os elementos
// (formulário, botões, divs) já existem antes de manipulá-los.
document.addEventListener('DOMContentLoaded', () => {
    carregarEmprestimos();   // lê os dados salvos no localStorage
    renderizarEmprestimos(); // desenha os cards na tela

    // Preenche o campo de data de empréstimo com a data de hoje
    // automaticamente, evitando que o usuário precise digitar.
    // toISOString() retorna "2024-05-12T00:00:00.000Z";
    // split('T')[0] pega só a parte "2024-05-12" (formato aceito pelo input date).
    const dataAtual = new Date().toISOString().split('T')[0];
    document.getElementById('data_emprestimo').value = dataAtual;
});


// ── Carregar do localStorage ──────────────────────────────────
// localStorage.getItem() retorna uma string JSON ou null.
// JSON.parse() converte a string de volta para um array de objetos.
function carregarEmprestimos() {
    const emprestimosSalvos = localStorage.getItem('emprestimos');
    if (emprestimosSalvos) {
        emprestimos = JSON.parse(emprestimosSalvos);
    }
}


// ── Salvar no localStorage ────────────────────────────────────
// Sempre que o array 'emprestimos' muda, chamamos esta função
// para persistir as alterações. JSON.stringify() converte o
// array de objetos para uma string que o localStorage consegue guardar.
function salvarEmprestimos() {
    localStorage.setItem('emprestimos', JSON.stringify(emprestimos));
}


// ── Capturar o envio do formulário de empréstimo ──────────────
// O evento 'submit' dispara ao clicar em "Emprestar" ou pressionar Enter.
// e.preventDefault() cancela o comportamento padrão do formulário
// (que seria recarregar a página), permitindo que tratemos os dados via JS.
document.getElementById('formEmprestimo').addEventListener('submit', (e) => {
    e.preventDefault();

    // Coleta o valor de cada campo do formulário pelo seu id.
    // Cria um objeto 'emprestimo' com todas as informações necessárias.
    const emprestimo = {
        id: Date.now(),             // ID único gerado pelo timestamp atual em milissegundos
        nome: document.getElementById('nome').value,
        setor: document.getElementById('setor').value,
        matricula: document.getElementById('matricula').value,
        telefone: document.getElementById('telefone').value,
        plaqueta: document.getElementById('plaqueta').value,
        data_emprestimo: document.getElementById('data_emprestimo').value,
        data_devolucao: document.getElementById('data_devolucao').value,
        cedente: document.getElementById('cedente').value,
        status: 'ativo',            // todo empréstimo começa como ativo
        assinadoManualmente: false, // o termo físico ainda não foi assinado
        data_registro: new Date().toISOString() // data/hora exata do registro
    };

    // Verifica se esse chromebook já está emprestado.
    // Array.some() retorna true se pelo menos um elemento satisfaz a condição.
    // Impede que o mesmo aparelho seja emprestado duas vezes ao mesmo tempo.
    if (emprestimos.some(emp => emp.plaqueta === emprestimo.plaqueta)) {
        alert('Esse chromebook já está emprestado!');
        return; // interrompe a função sem adicionar o registro
    }

    emprestimos.push(emprestimo); // adiciona ao array em memória
    salvarEmprestimos();          // persiste no localStorage
    renderizarEmprestimos();      // atualiza a lista na tela

    // Reseta todos os campos do formulário para os valores padrão
    document.getElementById('formEmprestimo').reset();

    // Recoloca a data de hoje no campo de empréstimo após o reset,
    // pois o reset() limpa o valor que foi preenchido automaticamente.
    const dataAtual = new Date().toISOString().split('T')[0];
    document.getElementById('data_emprestimo').value = dataAtual;

    alert('Empréstimo registrado com sucesso!');
});


// ── Renderizar a lista de empréstimos ─────────────────────────
// Esta função reconstrói toda a lista de empréstimos na tela.
// É chamada sempre que algo muda (novo registro, devolução, exclusão).
function renderizarEmprestimos() {
    const container = document.getElementById('listaEmprestimos');
    container.innerHTML = ''; // limpa o conteúdo atual antes de redesenhar

    // Se não há empréstimos, exibe a mensagem de estado vazio
    if (emprestimos.length === 0) {
        container.innerHTML = '<p class="sem-registros">Nenhum empréstimo registrado ainda.</p>';
        return;
    }

    // Cria uma cópia do array (spread [...]) para não alterar o original
    // e ordena do empréstimo mais recente para o mais antigo.
    // new Date() converte a string de data para um objeto Date comparável.
    const emprestimosSortidos = [...emprestimos].sort(
        (a, b) => new Date(b.data_emprestimo) - new Date(a.data_emprestimo)
    );

    // Array.map() transforma cada empréstimo em uma string HTML.
    // .join('') junta todas as strings em uma só, sem separador.
    // Template literals (` `) permitem inserir variáveis com ${}.
    container.innerHTML = emprestimosSortidos.map(emp => {
        const status = verificarStatus(emp);

        // Define a classe CSS de acordo com o status para colorir o badge
        const statusClass = status === 'ativo' ? 'status-ativo' : 'status-atrasado';

        // Retorna o HTML completo do card deste empréstimo
        return `
            <div class="emprestimo-card" data-id="${emp.id}">

                <!-- Cabeçalho do card: nome do tomador e número da plaqueta -->
                <div class="emprestimo-header">
                    <div class="emprestimo-titulo">${emp.nome}</div>
                    <div class="plaqueta-badge">${emp.plaqueta}</div>
                </div>

                <!-- Grade com as informações detalhadas do empréstimo -->
                <div class="emprestimo-info">
                    <div class="info-item">
                        <span class="info-label">Setor</span>
                        <span class="info-value">${emp.setor}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Matrícula</span>
                        <span class="info-value">${emp.matricula}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Telefone</span>
                        <span class="info-value">${emp.telefone}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data de Empréstimo</span>
                        <span class="info-value">${formatarData(emp.data_emprestimo)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Data de Devolução</span>
                        <span class="info-value">${formatarData(emp.data_devolucao)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Cedente</span>
                        <span class="info-value">${emp.cedente}</span>
                    </div>
                </div>

                <!-- Rodapé do card: status atual e botões de ação -->
                <div class="emprestimo-footer">
                    <div class="status-container">
                        <!-- Badge de status: ATIVO (verde) ou ATRASADO (vermelho) -->
                        <span class="status-badge ${statusClass}">${status.toUpperCase()}</span>

                        <!-- Badge de assinatura: só aparece se o termo foi assinado fisicamente -->
                        ${emp.assinadoManualmente ? '<span class="status-badge status-assinado">📄 ASSINADO</span>' : ''}
                    </div>
                    <div class="emprestimo-acoes">
                        <!-- Abre o termo de responsabilidade em nova aba para impressão -->
                        <button class="btn-assinar" onclick="gerarTermoEmprestimo(${emp.id})"> ✍️ Termo</button>
                        <!-- Remove o empréstimo da lista (devolução realizada) -->
                        <button class="btn-devolver" onclick="devolverChromebook(${emp.id})"> ✓ Devolver</button>
                        <!-- Remove o registro sem registrar devolução (uso administrativo) -->
                        <button class="btn-excluir" onclick="excluirEmprestimo(${emp.id})"> 🗑 Excluir</button>
                    </div>
                </div>

                <!-- Seção de rastreamento de assinatura física do termo impresso -->
                <div class="signature-tracking">
                   <label class="checkbox-container">
                        <!-- Marca ou desmarca se o termo físico foi assinado -->
                        <input type="checkbox" ${emp.assinadoManualmente ? 'checked' : ''} onchange="toggleAssinatura(${emp.id})">
                        Assinado fisicamente
                   </label>
                </div>
            </div>
        `;
    }).join('');
}


// ── Verificar status do empréstimo ────────────────────────────
// Compara a data de devolução prevista com a data de hoje.
// Se a devolução era para ter acontecido antes de hoje, é "atrasado".
// setHours(0,0,0,0) zera a parte de hora para comparar só as datas.
function verificarStatus(emprestimo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataDevolucao = new Date(emprestimo.data_devolucao);
    dataDevolucao.setHours(0, 0, 0, 0);

    // Só marca como atrasado se o empréstimo ainda estiver ativo.
    // Se já foi devolvido (status !== 'ativo'), não aplica essa lógica.
    if (dataDevolucao < hoje && emprestimo.status === 'ativo') {
        return 'atrasado';
    }
    return emprestimo.status; // retorna 'ativo' ou qualquer outro status salvo
}


// ── Formatar data para exibição ───────────────────────────────
// O input type="date" salva no formato ISO "YYYY-MM-DD".
// toLocaleDateString('pt-BR') converte para o padrão brasileiro "DD/MM/YYYY".
function formatarData(dataString) {
    if (!dataString) return '-'; // proteção: retorna traço se a data estiver vazia
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}


// ── Registrar devolução ───────────────────────────────────────
// Remove o empréstimo do array ao confirmar a devolução do aparelho.
// Array.filter() cria um novo array sem o item cujo id foi passado.
function devolverChromebook(id) {
    if (confirm('Confirmar devolução do Chromebook?')) {
        emprestimos = emprestimos.filter(emp => emp.id !== id);
        salvarEmprestimos();
        renderizarEmprestimos();
    }
}


// ── Excluir registro ──────────────────────────────────────────
// Funciona igual à devolução, mas com uma confirmação de aviso
// diferente, deixando claro que é uma exclusão administrativa.
function excluirEmprestimo(id) {
    if (confirm('Tem certeza que deseja excluir este empréstimo?')) {
        emprestimos = emprestimos.filter(emp => emp.id !== id);
        salvarEmprestimos();
        renderizarEmprestimos();
    }
}


// ── Alternar status de assinatura manual ──────────────────────
// Quando o checkbox é marcado/desmarcado, inverte o campo
// 'assinadoManualmente' do empréstimo correspondente e salva.
// Array.find() retorna o primeiro objeto cujo id bate com o passado.
function toggleAssinatura(id) {
    const emprestimo = emprestimos.find(e => e.id === id);
    if (emprestimo) {
        emprestimo.assinadoManualmente = !emprestimo.assinadoManualmente; // inverte true/false
        salvarEmprestimos();
        renderizarEmprestimos();
    }
}


// ── Gerar termo de responsabilidade para impressão ────────────
// Abre uma nova aba do navegador com o documento formatado.
// window.open('', '_blank') cria uma janela/aba em branco.
// document.write() injeta o HTML do termo nessa nova aba.
// Após a impressão, a aba é fechada automaticamente.
function gerarTermoEmprestimo(id) {
    const emp = emprestimos.find(e => e.id === id);
    if (!emp) return; // segurança: interrompe se o empréstimo não existir

    const printWindow = window.open('', '_blank');

    // Formata as datas antes de inserir no documento impresso
    const dataEmprestimo = formatarData(emp.data_emprestimo);
    const dataDevolucao = formatarData(emp.data_devolucao);

    // Escreve o HTML completo do termo na nova aba.
    // Os estilos são inline (dentro do próprio documento) porque
    // a nova aba não tem acesso ao estilos.css da página principal.
    printWindow.document.write(`
        <html>
        <head>
            <title>Termo de Empréstimo - ${emp.nome}</title>
            <style>
                /* Estilos específicos para o documento impresso */
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; line-height: 1.6; color: #000; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .header img { max-width: 400px; max-height: 150px; margin-bottom: 20px; object-fit: contain; }
                .title { font-size: 26px; font-weight: bold; margin: 10px 0; text-transform: uppercase; }
                .content { margin-bottom: 50px; font-size: 16px; text-align: justify; }
                .info-grid { 
                    display: block; 
                    margin: 40px 0;
                    border: 2px solid #000;
                    border-radius: 0;
                    overflow: hidden;
                }
                .info-row {
                    display: flex;
                    border-bottom: 1px solid #000;
                }
                .info-row:last-child { border-bottom: none; }
                .info-cell {
                    flex: 1;
                    padding: 15px 20px;
                    border-right: 1px solid #000;
                }
                .info-cell:last-child { border-right: none; }
                .label { 
                    font-weight: bold; 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    color: #000;
                    margin-bottom: 6px;
                    display: block;
                }
                .value { font-size: 15px; font-weight: 500; }
                /* Área de assinaturas em duas colunas lado a lado */
                .signatures { margin-top: 120px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; text-align: center; }
                .sig-line { border-top: 1.5px solid #000; margin-top: 60px; padding-top: 12px; font-size: 14px; font-weight: bold; }
                /* Regras aplicadas apenas ao imprimir (Ctrl+P / window.print()) */
                @media print { 
                    body { padding: 20px; }
                    .no-print { display: none; } 
                    .info-grid { border: 1px solid #000; }
                }
            </style>
        </head>
        <body>
            <!-- Cabeçalho do termo com logo da SEDUC e título -->
            <div class="header">
                <!-- O caminho da imagem é relativo ao index.html, não à nova aba.
                     Por isso usamos o mesmo caminho que funciona no contexto do servidor. -->
                <img src="img/SEDUC.png" alt="SEDUC LOGO">
                <div class="title">TERMO DE RESPONSABILIDADE</div>
                <p>Empréstimo de Equipamento Tecnológico (Chromebook)</p>
            </div>

            <!-- Corpo do termo com dados do empréstimo em formato de tabela -->
            <div class="content">
                <p>Eu, <strong>${emp.nome}</strong>, setor <strong>${emp.setor}</strong>, matrícula <strong>${emp.matricula}</strong>, 
                declaro para os devidos fins que recebi nesta data o equipamento abaixo descrito em perfeitas condições de uso.</p>
                
                <!-- Grade de informações do equipamento emprestado -->
                <div class="info-grid">
                    <div class="info-row">
                        <div class="info-cell"><span class="label">Equipamento</span><div class="value">Chromebook</div></div>
                        <div class="info-cell"><span class="label">Nº Plaqueta</span><div class="value">${emp.plaqueta}</div></div>
                    </div>
                    <div class="info-row">
                        <div class="info-cell"><span class="label">Data de Empréstimo</span><div class="value">${dataEmprestimo}</div></div>
                        <div class="info-cell"><span class="label">Data Prevista de Devolução</span><div class="value">${dataDevolucao}</div></div>
                    </div>
                    <div class="info-row">
                        <div class="info-cell"><span class="label">Telefone de Contato</span><div class="value">${emp.telefone}</div></div>
                        <div class="info-cell"><span class="label">Cedente Responsável</span><div class="value">${emp.cedente}</div></div>
                    </div>
                </div>

                <p style="margin-top: 20px;">Comprometo-me a zelar pela integridade do equipamento e a devolvê-lo na data estipulada. 
                Em caso de danos por mau uso ou extravio, assumo total responsabilidade pelo reparo ou reposição imediata do mesmo conforme normas vigentes.</p>
            </div>
            
            <!-- Espaço para as assinaturas físicas do receptor e do cedente -->
            <div class="signatures">
                <div>
                    <div class="sig-line">Assinatura do Receptor</div>
                </div>
                <div>
                    <div class="sig-line">Assinatura do Cedente</div>
                </div>
            </div>

            <!-- Rodapé com data de geração do documento -->
            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #888;">
                Gerado automaticamente pelo Sistema de Gestão de Chromebooks - ${new Date().toLocaleDateString('pt-BR')}
            </div>

            <script>
                // Quando a aba terminar de carregar (incluindo a imagem da SEDUC),
                // abre o diálogo de impressão após 500ms de espera.
                // O segundo setTimeout fecha a aba após a impressão ser acionada.
                window.onload = function() { 
                    setTimeout(function() {
                        window.print(); 
                        setTimeout(function() { window.close(); }, 500);
                    }, 500);
                };
            <\/script>
        </body>
        </html>
    `);

    // Fecha o stream de escrita do documento da nova aba,
    // sinalizando que o HTML foi completamente inserido.
    printWindow.document.close();
}
