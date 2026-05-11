// Array de armazenamento dos empréstimos
let emprestimos = [];

//Carregar empréstimos do localStorage ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarEmprestimos();
    renderizarEmprestimos();

    //definir data atual como padrão para data de empréstimo
    const dataAtual = new Date().toISOString().split('T')[0];
    document.getElementById('data_emprestimo').value = dataAtual;
});

//carregar empréstimos do localStorage
function carregarEmprestimos() {
    const emprestimosSalvos = localStorage.getItem('emprestimos');
    if (emprestimosSalvos) {
        emprestimos = JSON.parse(emprestimosSalvos);
    }
}

// Salvar empréstimos do localStorage
function salvarEmprestimos() {
    localStorage.setItem('emprestimos', JSON.stringify(emprestimos));
}

// Capturar o envio de empréstimo
document.getElementById('formEmprestimo').addEventListener('submit', (e) => {
    e.preventDefault();
    // coleta de dados
    const emprestimo = {
        id: Date.now(),
        nome: document.getElementById('nome').value,
        setor: document.getElementById('setor').value,
        matricula: document.getElementById('matricula').value,
        telefone: document.getElementById('telefone').value,
        plaqueta: document.getElementById('plaqueta').value,
        data_emprestimo: document.getElementById('data_emprestimo').value,
        data_devolucao: document.getElementById('data_devolucao').value,
        cedente: document.getElementById('cedente').value,
        status: 'ativo',  
        assinadoManualmente: false,
        data_registro: new Date().toISOString()
    };
    if (emprestimos.some(emp => emp.plaqueta === emprestimo.plaqueta)) {
        alert('Esse chromebook já está emprestado!');
        return;
    }
    //adicionar no array
    emprestimos.push(emprestimo);
    //salvar no localStorage
    salvarEmprestimos();
    //renderizar na tela
    renderizarEmprestimos();
    //limpar o formulário
    document.getElementById('formEmprestimo').reset();

    //redefinir a data de empréstimo para a data atual
    const dataAtual = new Date().toISOString().split('T')[0];
    document.getElementById('data_emprestimo').value = dataAtual;

    //alerta visual de sucesso
    alert('Empréstimo registrado com sucesso!');
});

function renderizarEmprestimos(){
    const container = document.getElementById('listaEmprestimos');
    container.innerHTML = '';

    if (emprestimos.length === 0) {
        container.innerHTML = '<p class="sem-registros">Nenhum empréstimo registrado ainda.</p>';
        return;
    }
    // ordenar por data de emprestimo (mais recente para o mais antigo)
    const emprestimosSortidos = [...emprestimos].sort((a, b) => new Date(b.data_emprestimo) - new Date(a.data_emprestimo));

    container.innerHTML = emprestimosSortidos.map(emp => {
        const status = verificarStatus(emp);
        const statusClass = status === 'ativo' ? 'status-ativo' : 'status-atrasado';

        return `
            <div class="emprestimo-card" data-id="${emp.id}">
                <div class="emprestimo-header">
                    <div class="emprestimo-titulo">${emp.nome}</div>
                    <div class="plaqueta-badge">${emp.plaqueta}</div>
                </div>
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
                <div class="emprestimo-footer">
                    <div class="status-container">
                        <span class="status-badge ${statusClass}">${status.toUpperCase()}</span>
                        ${emp.assinadoManualmente ? '<span class="status-badge status-assinado">📄 ASSINADO</span>' : ''}
                    </div>
                    <div class="emprestimo-acoes">
                        <button class="btn-assinar" onclick="gerarTermoEmprestimo(${emp.id})"> ✍️ Termo</button>
                        <button class="btn-devolver" onclick="devolverChromebook(${emp.id})"> ✓ Devolver</button>
                        <button class="btn-excluir" onclick="excluirEmprestimo(${emp.id})"> 🗑 Excluir</button>
                    </div>
                </div>
                <div class="signature-tracking">
                   <label class="checkbox-container">
                        <input type="checkbox" ${emp.assinadoManualmente ? 'checked' : ''} onchange="toggleAssinatura(${emp.id})">
                        Assinado fisicamente
                   </label>
                </div>
            </div>
        `;
    }).join('');

    }

    // Verificar status do empréstimo
    function verificarStatus(emprestimo){
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const dataDevolucao = new Date(emprestimo.data_devolucao);
        dataDevolucao.setHours(0,0,0,0);

        if (dataDevolucao < hoje && emprestimo.status === 'ativo'){
            return 'atrasado';
        }
        return emprestimo.status;
    }

    // Função para formatar data
    function formatarData(dataString){
        if (!dataString) return '-';
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    }

    function devolverChromebook(id){
        if (confirm('Confirmar devolução do Chromebook?')){
            emprestimos = emprestimos.filter(emp => emp.id !== id);
            salvarEmprestimos();
            renderizarEmprestimos();
            
        }
    }

    // Função para excluir registro
    function excluirEmprestimo(id){
        if (confirm('Tem certeza que deseja excluir este empréstimo?')){
            emprestimos = emprestimos.filter(emp => emp.id !== id);
            salvarEmprestimos();
            renderizarEmprestimos();
        }
    }

    // Alternar status de assinatura manual
    function toggleAssinatura(id) {
        const emprestimo = emprestimos.find(e => e.id === id);
        if (emprestimo) {
            emprestimo.assinadoManualmente = !emprestimo.assinadoManualmente;
            salvarEmprestimos();
            renderizarEmprestimos();
        }
    }

    // Gerar termo para impressão
    function gerarTermoEmprestimo(id) {
        const emp = emprestimos.find(e => e.id === id);
        if (!emp) return;

        // Criar elemento temporário para impressão
        const printWindow = window.open('', '_blank');
        const dataEmprestimo = formatarData(emp.data_emprestimo);
        const dataDevolucao = formatarData(emp.data_devolucao);

        printWindow.document.write(`
            <html>
            <head>
                <title>Termo de Empréstimo - ${emp.nome}</title>
                <style>
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
                    
                    .signatures { margin-top: 120px; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; text-align: center; }
                    .sig-line { border-top: 1.5px solid #000; margin-top: 60px; padding-top: 12px; font-size: 14px; font-weight: bold; }
                    
                    @media print { 
                        body { padding: 20px; }
                        .no-print { display: none; } 
                        .info-grid { border: 1px solid #000; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="img/SEDUC.png" alt="SEDUC LOGO">
                    <div class="title">TERMO DE RESPONSABILIDADE</div>
                    <p>Empréstimo de Equipamento Tecnológico (Chromebook)</p>
                </div>
                <div class="content">
                    <p>Eu, <strong>${emp.nome}</strong>, setor <strong>${emp.setor}</strong>, matrícula <strong>${emp.matricula}</strong>, 
                    declaro para os devidos fins que recebi nesta data o equipamento abaixo descrito em perfeitas condições de uso.</p>
                    
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
                
                <div class="signatures">
                    <div>
                        <div class="sig-line">Assinatura do Receptor</div>
                    </div>
                    <div>
                        <div class="sig-line">Assinatura do Cedente</div>
                    </div>
                </div>

                <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #888;">
                    Gerado automaticamente pelo Sistema de Gestão de Chromebooks - ${new Date().toLocaleDateString('pt-BR')}
                </div>

                <script>
                    window.onload = function() { 
                        // Pequeno delay para garantir que a imagem carregou antes de imprimir
                        setTimeout(function() {
                            window.print(); 
                            setTimeout(function() { window.close(); }, 500);
                        }, 500);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

