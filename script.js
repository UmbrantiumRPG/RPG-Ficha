function escapeHtml(str){
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ----------------------
// Rolagens Situacionais
// ----------------------
function rollSituacional(btn) {
    const container = btn.closest('.situacional-item');
    if(!container) return;
    
    const atributo = container.querySelector('.sit-atributo')?.value;
    const numDados = parseInt(container.querySelector('.sit-dados')?.value || "1") || 1;
    const soma = parseInt(container.querySelector('.sit-soma')?.value || "0") || 0;
    
    if(!atributo) {
        alert('Selecione um atributo!');
        return;
    }
    
    // Rolar múltiplos d20
    const rolls = [];
    for(let i = 0; i < numDados; i++) {
        rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    
    // Pegar o maior resultado
    const highest = Math.max(...rolls);
    const total = highest + soma;
    
    // Nome do atributo para exibir
    const attrNames = {
        'agi': 'AGI',
        'int': 'INT',
        'vig': 'VIG',
        'pre': 'PRE',
        'forca': 'FOR'
    };
    
    const skillName = `Situacional (${attrNames[atributo] || atributo})`;
    showRollModal(rolls, highest, soma, total, skillName);
}// --- Detecta a página pelo nome do arquivo ---
const pageKey = (() => {
    const path = location.pathname.split('/').pop();
    if (!path || path === "") return 'index';
    return path.replace('.html', '');
})();

// Prefixo único por página
const prefix = 'umbrantium-' + pageKey + '-';

// ----------------------
// Campos (salvar/carregar)
// ----------------------
function saveField(el) {
    if (!el || !el.id) return;
    try { localStorage.setItem(prefix + el.id, el.value); } catch(e){/*silencioso*/}
}
function loadField(el) {
    if (!el || !el.id) return;
    const saved = localStorage.getItem(prefix + el.id);
    if (saved !== null) el.value = saved;
}
function autoBindFields() {
    const fields = document.querySelectorAll("input[type=text], input[type=number], textarea, select");
    fields.forEach(el => {
        loadField(el);
        el.removeEventListener("input", fieldSaveListener);
        el.addEventListener("input", fieldSaveListener);
    });
}
function fieldSaveListener(e){ saveField(e.target); }

// ----------------------
// Inventário dinâmico
// ----------------------
let itemCounter = 0;
function createInventoryRow(name = "", desc = "", weight = "") {
    itemCounter++;
    const itemId = `inv-item-${itemCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "inv-item";
    wrapper.dataset.itemId = itemId;
    wrapper.innerHTML = `
        <input id="${itemId}-name" placeholder="Nome" value="${escapeHtml(name)}">
        <input id="${itemId}-desc" placeholder="Descrição" value="${escapeHtml(desc)}">
        <input id="${itemId}-weight" type="number" placeholder="Peso" value="${escapeHtml(weight)}">
        <button class="remove-btn">×</button>
    `;
    wrapper.querySelector(".remove-btn").addEventListener("click", () => {
        localStorage.removeItem(prefix + `${itemId}-name`);
        localStorage.removeItem(prefix + `${itemId}-desc`);
        localStorage.removeItem(prefix + `${itemId}-weight`);
        wrapper.remove();
        updateTotalWeight();
    });
    
    const weightInput = wrapper.querySelector(`#${itemId}-weight`);
    weightInput.addEventListener('input', updateTotalWeight);
    
    const container = document.getElementById("inventory-list");
    if (container) container.appendChild(wrapper);
    autoBindFields();
}

function addInventoryItem(){ 
    createInventoryRow(); 
    saveInventory();
    updateTotalWeight();
}

function saveInventory(){
    const rows = [...document.querySelectorAll(".inv-item")];
    const list = rows.map(r => ({
        name: r.querySelector(`[id$="-name"]`)?.value || "",
        desc:  r.querySelector(`[id$="-desc"]`)?.value || "",
        weight:r.querySelector(`[id$="-weight"]`)?.value || ""
    }));
    localStorage.setItem(prefix + 'inventory', JSON.stringify(list));
}

function loadInventory(){
    const data = JSON.parse(localStorage.getItem(prefix + 'inventory') || "[]");
    if (data && data.length) {
        data.forEach(it => createInventoryRow(it.name, it.desc, it.weight));
    }
    updateTotalWeight();
}

function updateTotalWeight() {
    const totalEl = document.getElementById('totalWeight');
    if (!totalEl) return;
    
    const weightInputs = document.querySelectorAll('.inv-item input[id$="-weight"]');
    let total = 0;
    
    weightInputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        total += val;
    });
    
    totalEl.textContent = total.toFixed(1);
}

// ----------------------
// Ataques dinâmicos
// ----------------------
let attackCounter = 0;
function createAttackRow(name="", dmg="", crit="", notes=""){
    attackCounter++;
    const id = `atk-${attackCounter}`;
    const wrapper = document.createElement("div");
    wrapper.className = "attack-item";
    wrapper.dataset.attackId = id;
    wrapper.innerHTML = `
      <input id="${id}-name" placeholder="Ataque" value="${escapeHtml(name)}">
      <input id="${id}-dmg" placeholder="Dano" value="${escapeHtml(dmg)}">
      <input id="${id}-crit" placeholder="Critico" value="${escapeHtml(crit)}">
      <input id="${id}-notes" placeholder="Observações" value="${escapeHtml(notes)}">
      <button class="remove-btn">×</button>
    `;
    wrapper.querySelector(".remove-btn").addEventListener("click", ()=>{
        localStorage.removeItem(prefix + `${id}-name`);
        localStorage.removeItem(prefix + `${id}-dmg`);
        localStorage.removeItem(prefix + `${id}-crit`);
        localStorage.removeItem(prefix + `${id}-notes`);
        wrapper.remove();
    });
    const container = document.getElementById("attacks-list");
    if (container) container.appendChild(wrapper);
    autoBindFields();
}
function addAttack(){ createAttackRow(); saveAttacks(); }
function saveAttacks(){
    const rows = [...document.querySelectorAll(".attack-item")];
    const list = rows.map(r => ({
        name: r.querySelector(`[id$="-name"]`)?.value || "",
        dmg: r.querySelector(`[id$="-dmg"]`)?.value || "",
        crit: r.querySelector(`[id$="-crit"]`)?.value || "",
        notes: r.querySelector(`[id$="-notes"]`)?.value || ""
    }));
    localStorage.setItem(prefix + 'attacks', JSON.stringify(list));
}
function loadAttacks(){
    const data = JSON.parse(localStorage.getItem(prefix + 'attacks') || "[]");
    if (data && data.length) data.forEach(a => createAttackRow(a.name, a.dmg, a.crit, a.notes));
}

// ----------------------
// Perícias (novo sistema)
// ----------------------
const PERICIA_KEY = prefix + 'pericias';

function loadPericias(){
    const saved = JSON.parse(localStorage.getItem(PERICIA_KEY) || "[]");
    document.querySelectorAll('.pericia').forEach((p, i)=>{
        const modEl = p.querySelector('.modificador');
        const outrosEl = p.querySelector('.outros');

        const data = saved[i] || {};
        if (modEl && (data.modificador !== undefined)) modEl.value = data.modificador;
        if (outrosEl && (data.outros !== undefined)) outrosEl.value = data.outros;
    });
    atualizarPericias();
}

function savePericias(){
    const data = [];
    document.querySelectorAll('.pericia').forEach(p=>{
        const modificador = parseInt(p.querySelector('.modificador')?.value || "0") || 0;
        const outros = parseInt(p.querySelector('.outros')?.value || "0") || 0;
        data.push({ modificador, outros, attr: p.dataset.attr });
    });
    localStorage.setItem(PERICIA_KEY, JSON.stringify(data));
}

function atualizarPericias(){
    document.querySelectorAll('.pericia').forEach(p=>{
        const modificador = parseInt(p.querySelector('.modificador')?.value || "0") || 0;
        const outros = parseInt(p.querySelector('.outros')?.value || "0") || 0;
        const total = modificador + outros;
        const calcEl = p.querySelector('.calc');
        if (calcEl) calcEl.textContent = (total >= 0 ? '+' + total : total);
    });
    savePericias();
}

// Rolar d20 com múltiplos dados baseado no atributo
function rollD20For(btn){
    const container = btn.closest('.pericia');
    if(!container) return;
    
    // Pegar o atributo associado à perícia
    const attr = container.dataset.attr;
    
    // Buscar valor do atributo
    const attrs = {
        agi:  parseInt(localStorage.getItem(prefix + 'agi') || localStorage.getItem('umbrantium-index-agi') || 0) || 0,
        int:  parseInt(localStorage.getItem(prefix + 'int') || localStorage.getItem('umbrantium-index-int') || 0) || 0,
        vig:  parseInt(localStorage.getItem(prefix + 'vig') || localStorage.getItem('umbrantium-index-vig') || 0) || 0,
        pre:  parseInt(localStorage.getItem(prefix + 'pre') || localStorage.getItem('umbrantium-index-pre') || 0) || 0,
        forca:parseInt(localStorage.getItem(prefix + 'forca') || localStorage.getItem('umbrantium-index-forca') || 0) || 0,
    };
    
    const attrValue = attrs[attr] || 1;
    const numDice = Math.max(1, attrValue); // Rola no mínimo 1 dado
    
    // Rolar múltiplos d20
    const rolls = [];
    for(let i = 0; i < numDice; i++) {
        rolls.push(Math.floor(Math.random() * 20) + 1);
    }
    
    // Pegar o maior resultado
    const highest = Math.max(...rolls);
    
    // Pegar modificadores da perícia
    const modificador = parseInt(container.querySelector('.modificador')?.value || "0") || 0;
    const outros = parseInt(container.querySelector('.outros')?.value || "0") || 0;
    const totalMod = modificador + outros;
    
    const total = highest + totalMod;
    
    // Mostrar modal com resultado
    showRollModal(rolls, highest, totalMod, total, container.querySelector('label')?.textContent || 'Perícia');
}

function showRollModal(rolls, highest, mod, total, skillName) {
    const existing = document.querySelector('.roll-modal');
    if(existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.className = 'roll-modal';
    
    const diceList = rolls.map(r => 
        `<span class="roll-die ${r === highest ? 'highest' : ''}">${r}</span>`
    ).join('');
    
    modal.innerHTML = `
        <div class="roll-modal-content">
            <h3>🎲 ${skillName}</h3>
            <p>Dados rolados (${rolls.length}d20):</p>
            <div class="roll-dice-list">
                ${diceList}
            </div>
            <div class="roll-summary">
                <p><strong>Maior resultado:</strong> ${highest}</p>
                <p><strong>Modificadores:</strong> ${mod >= 0 ? '+' + mod : mod}</p>
                <p class="roll-total">TOTAL: ${total}</p>
            </div>
            <button class="roll-close">Fechar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.roll-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.remove();
    });
}

function escapeHtml(str){
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ----------------------
// Inicialização
// ----------------------
window.addEventListener('DOMContentLoaded', ()=> {
    autoBindFields();

    if (document.getElementById('inventory-list')) {
        loadInventory();
        document.addEventListener('input', (e)=> {
            if(e.target.closest('.inv-item')) {
                saveInventory();
                updateTotalWeight();
            }
        });
    }

    if (document.getElementById('attacks-list')) {
        loadAttacks();
        document.getElementById('add-attack')?.addEventListener('click', ()=>{
            createAttackRow(); saveAttacks();
        });
        document.addEventListener('input', ()=> saveAttacks());
    }

    if (document.querySelectorAll('.pericia').length) {
        // Bind do botão de rolar
        document.addEventListener('click', (e)=>{
            if (e.target.classList.contains('roll')) rollD20For(e.target);
        });
        
        // Atualizar quando campos de perícia mudarem (input ou select)
        document.addEventListener('input', (e)=>{
            if(e.target.closest('.pericia') && (e.target.classList.contains('modificador') || e.target.classList.contains('outros'))) {
                atualizarPericias();
            }
        });
        
        // Atualizar quando select mudar
        document.addEventListener('change', (e)=>{
            if(e.target.closest('.pericia') && e.target.classList.contains('modificador')) {
                atualizarPericias();
            }
        });
        
        loadPericias();
    }

    document.addEventListener('input', ()=> {
        document.querySelectorAll("input[id], textarea[id], select[id]").forEach(el => saveField(el));
    });
});