/********************************************************************
 * AUTO CAR — ADMIN PAINEL — VERSÃO COMPLETA E CORRIGIDA
 ********************************************************************/

const API = "http://127.0.0.1:5000";

/* ======================================================
   LOGIN
====================================================== */
function adminLogin() {
    const user = document.getElementById("admin-user").value;
    const pass = document.getElementById("admin-pass").value;

    if (user === "admin" && pass === "1234") {
        localStorage.setItem("ADMIN_LOGGED", "1");
        window.location.href = "index.html";
    } else {
        alert("Usuário ou senha incorretos!");
    }
}

/* ======================================================
   PROTEÇÃO
====================================================== */
function requireAdmin() {
    if (localStorage.getItem("ADMIN_LOGGED") !== "1") {
        window.location.href = "login.html";
    }
}

/* ======================================================
   FETCH HELPERS
====================================================== */
async function apiGet(url) {
    return fetch(API + url).then(r => r.json());
}

async function apiPost(url, data) {
    return fetch(API + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(r => r.json());
}

async function apiPut(url, data) {
    return fetch(API + url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }).then(r => r.json());
}

async function apiDelete(url) {
    return fetch(API + url, { method: "DELETE" }).then(r => r.json());
}

/* ======================================================
   DASHBOARD
====================================================== */
async function loadDashboard() {
    requireAdmin();

    const produtos = await apiGet("/admin/produtos");
    const pedidos = await apiGet("/admin/pedidos");

    document.getElementById("card-produtos").textContent = produtos.length;
    document.getElementById("card-clientes").textContent = 100; 
    document.getElementById("card-pedidos").textContent = pedidos.length;
    document.getElementById("card-faturamento").textContent =
        "R$ " +
        pedidos.reduce((acc, p) => acc + p.total, 0).toFixed(2).replace(".", ",");

    const tbody = document.getElementById("ultimos-pedidos");

    tbody.innerHTML = pedidos
        .slice(-3)
        .reverse()
        .map(
            p => `
        <tr>
            <td>${p.id}</td>
            <td>R$ ${p.total.toFixed(2).replace(".", ",")}</td>
            <td>${p.cliente || "—"}</td>
            <td>${p.status}</td>
        </tr>
    `
        )
        .join("");
}

/* ======================================================
   PRODUTOS
====================================================== */
async function loadProdutos() {
    requireAdmin();

    const produtos = await apiGet("/admin/produtos");
    const tbody = document.getElementById("tabela-produtos");

    tbody.innerHTML = produtos
        .map(
            p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nome}</td>
            <td>R$ ${p.preco.toFixed(2)}</td>
            <td>${p.categoria}</td>
            <td>${p.marca}</td>
            <td>${p.estoque}</td>
            <td>
                <button onclick="editarProduto(${p.id})" class="btn-sm btn-edit">Editar</button>
                <button onclick="excluirProduto(${p.id})" class="btn-sm btn-delete">Excluir</button>
            </td>
        </tr>
    `
        )
        .join("");
}

function editarProduto(id) {
    window.location.href = "produto-editar.html?id=" + id;
}

async function excluirProduto(id) {
    if (!confirm("Tem certeza?")) return;
    await apiDelete("/admin/produto/" + id);
    loadProdutos();
}

/* ======================================================
   CLIENTES (FAKE)
====================================================== */
function loadClientes() {
    requireAdmin();

    const tbody = document.getElementById("tabela-clientes");

    const clientes = Array.from({ length: 40 }).map((_, i) => ({
        id: i + 1,
        nome: "Cliente " + (i + 1),
        email: `cliente${i + 1}@gmail.com`,
        pedidos: Math.floor(Math.random() * 8),
    }));

    tbody.innerHTML = clientes
        .map(
            c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.nome}</td>
            <td>${c.email}</td>
            <td>${c.pedidos}</td>
        </tr>
    `
        )
        .join("");
}

/* ======================================================
   PEDIDOS
====================================================== */
async function loadPedidos() {
    requireAdmin();

    const tbody = document.getElementById("tabela-pedidos");
    const pedidos = await apiGet("/admin/pedidos");

    tbody.innerHTML = pedidos
        .map(
            p => `
        <tr>
            <td>${p.id}</td>
            <td>R$ ${p.total.toFixed(2)}</td>
            <td>${p.cliente || "—"}</td>
            <td>${p.status}</td>
            <td><button onclick="verPedido(${p.id})" class="btn-sm btn-edit">Ver</button></td>
        </tr>
    `
        )
        .join("");
}

function verPedido(id) {
    window.location.href = "pedido-detalhe.html?id=" + id;
}

async function loadPedidoDetalhe() {
    requireAdmin();

    const id = new URLSearchParams(window.location.search).get("id");
    const pedido = await apiGet("/admin/pedido/" + id);

    document.getElementById("pedido-id").textContent = pedido.id;

    document.querySelector(".order-info").innerHTML = `
        <p><strong>Cliente:</strong> ${pedido.cliente}</p>
        <p><strong>Email:</strong> ${pedido.email}</p>
        <p><strong>Status:</strong> ${pedido.status}</p>
        <p><strong>Data:</strong> ${pedido.data}</p>
    `;

    const tbody = document.querySelector(".table-default tbody");

    tbody.innerHTML = pedido.items
        .map(
            i => `
        <tr>
            <td>${i.produtoNome}</td>
            <td>${i.quantidade}</td>
            <td>R$ ${i.preco_unitario.toFixed(2)}</td>
            <td>R$ ${(i.preco_unitario * i.quantidade).toFixed(2)}</td>
        </tr>
    `
        )
        .join("");

    document.querySelector(".pedido-total").innerHTML = `
        <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
    `;
}
