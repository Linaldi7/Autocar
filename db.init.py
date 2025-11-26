# db_init.py
import sqlite3
import json
import random
from datetime import datetime, timedelta
import os

DB = "ecommerce.db"

# -------------------------------------
# APAGAR DB ANTIGO
# -------------------------------------
if os.path.exists(DB):
    print("Removendo banco antigo...")
    os.remove(DB)

conn = sqlite3.connect(DB)
c = conn.cursor()

# -------------------------------------
# CRIAR TABELAS
# -------------------------------------
c.executescript("""
PRAGMA foreign_keys = ON;

CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE
);

CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    nome TEXT,
    preco REAL,
    categoria_id INTEGER,
    marca TEXT,
    estoque INTEGER,
    descricao TEXT,
    specs TEXT,
    FOREIGN KEY(categoria_id) REFERENCES categorias(id)
);

CREATE TABLE produtos_imagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER,
    url TEXT,
    FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE produtos_compatibilidade (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER,
    veiculo TEXT,
    FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    email TEXT UNIQUE,
    senha TEXT,
    telefone TEXT
);

CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    total REAL,
    shipping REAL,
    status TEXT,
    criado_em TEXT,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER,
    produto_id INTEGER,
    quantidade INTEGER,
    preco_unitario REAL,
    FOREIGN KEY(pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY(produto_id) REFERENCES produtos(id)
);
""")

conn.commit()

# -------------------------------------
# PRODUTOS
# -------------------------------------

produtos = [
    {"sku": "BRK-1234", "nome": "Pastilha de Freio Dianteira - MarcaX", "preco": 129.90,
     "categoria": "Freios", "marca": "MarcaX", "estoque": 24,
     "images": ["img/pastilha_freio.jpg"],
     "descricao": "Pastilha de excelente atrito, uso urbano e rodoviário.",
     "specs": {"material": "Cerâmica", "warranty": "6 meses"},
     "compat": ["Fiat Palio", "Chevrolet Onix", "Volkswagen Gol"]},

    {"sku": "FLT-2001", "nome": "Filtro de Óleo HF-2001", "preco": 49.90,
     "categoria": "Filtros", "marca": "FiltroPlus", "estoque": 80,
     "images": ["img/filtro_oleo.png"],
     "descricao": "Filtro de óleo com alta capacidade de retenção de impurezas.",
     "specs": {"height": "95mm", "diameter": "65mm", "warranty": "3 meses"},
     "compat": ["Mercedes A200", "Volkswagen Fox"]},

    {"sku": "OIL-5W30", "nome": "Óleo 5W30 Sintético 1L", "preco": 79.90,
     "categoria": "Óleos", "marca": "AUTOCAR", "estoque": 160,
     "images": ["img/oleo.jpg"],
     "descricao": "Óleo sintético para maior proteção do motor.",
     "specs": {"viscosity": "5W-30", "spec": "API SN"},
     "compat": []},

    {"sku": "SPL-9090", "nome": "Vela Iridium V-9090", "preco": 39.90,
     "categoria": "Velas", "marca": "SparkPro", "estoque": 120,
     "images": ["img/vela.png"],
     "descricao": "Vela com ponta de irídio para ignição eficiente.",
     "specs": {"gap": "0.9mm", "warranty": "6 meses"},
     "compat": ["Ford Ka", "Fiat Uno"]},

    {"sku": "BAT-AGM45", "nome": "Bateria AGM 45Ah", "preco": 399.00,
     "categoria": "Baterias", "marca": "PowerCell", "estoque": 12,
     "images": ["img/bateria.png"],
     "descricao": "Bateria AGM de alta durabilidade e partida segura.",
     "specs": {"capacity": "45Ah", "voltage": "12V"},
     "compat": ["Varios modelos compactos"]},

    {"sku": "DIS-887", "nome": "Disco de Freio Dianteiro", "preco": 179.90,
     "categoria": "Freios", "marca": "BrakeTec", "estoque": 30,
     "images": ["img/disco_freio.png"],
     "descricao": "Disco ventilado para melhor dissipação de calor.",
     "specs": {},
     "compat": ["Chevrolet Onix", "Hyundai HB20"]},

    {"sku": "FAR-LED1", "nome": "Kit Farol LED 12V", "preco": 199.90,
     "categoria": "Iluminação", "marca": "LightPro", "estoque": 40,
     "images": ["img/kit_farol.png"],
     "descricao": "Kit de faróis LED com iluminação branca intensa.",
     "specs": {},
     "compat": []},

    {"sku": "AIR-101", "nome": "Filtro de Ar Motor", "preco": 69.90,
     "categoria": "Filtros", "marca": "FiltroPlus", "estoque": 70,
     "images": ["img/filtro_ar.png"],
     "descricao": "Filtro de ar de alta eficiência.",
     "specs": {},
     "compat": ["Fiat Palio", "Renault Clio"]},

    {"sku": "BELT-EX", "nome": "Correia Dentada EX", "preco": 149.90,
     "categoria": "Correias", "marca": "DriveLine", "estoque": 20,
     "images": ["img/correia_dentada.png"],
     "descricao": "Correia com reforço para maior durabilidade.",
     "specs": {},
     "compat": ["VW Golf", "Audi A3"]},

    {"sku": "KIT-TRV", "nome": "Kit de Reparo Suspensão", "preco": 249.90,
     "categoria": "Suspensão", "marca": "RideSafe", "estoque": 15,
     "images": ["img/kit_suspensao.png"],
     "descricao": "Kit com buchas e tirantes para manutenção completa.",
     "specs": {},
     "compat": []},

    {"sku": "OIL-10W40", "nome": "Óleo Mineral 10W40 1L", "preco": 39.90,
     "categoria": "Óleos", "marca": "LubriMax", "estoque": 220,
     "images": ["img/oleo_mineral.png"],
     "descricao": "Óleo mineral para motores mais antigos.",
     "specs": {"viscosity": "10W-40"},
     "compat": []},

    {"sku": "SPK-200", "nome": "Conjunto de Pastilhas Traseiras", "preco": 139.90,
     "categoria": "Freios", "marca": "MarcaX", "estoque": 26,
     "images": ["img/conjunto_pastilhas.png"],
     "descricao": "Conjunto com sensor de desgaste incluso.",
     "specs": {},
     "compat": []}
]

# -------------------------------------
# INSERIR PRODUTOS
# -------------------------------------

cat_cache = {}

for p in produtos:
    cat = p["categoria"]

    if cat not in cat_cache:
        c.execute("INSERT INTO categorias (nome) VALUES (?)", (cat,))
        cat_cache[cat] = c.lastrowid

    cat_id = cat_cache[cat]

    c.execute("""
        INSERT INTO produtos (sku, nome, preco, categoria_id, marca, estoque, descricao, specs)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        p["sku"], p["nome"], p["preco"], cat_id, p["marca"],
        p["estoque"], p["descricao"], json.dumps(p["specs"])
    ))

    pid = c.lastrowid

    for img in p["images"]:
        c.execute("INSERT INTO produtos_imagens (produto_id, url) VALUES (?, ?)", (pid, img))

    for v in p["compat"]:
        c.execute("INSERT INTO produtos_compatibilidade (produto_id, veiculo) VALUES (?, ?)", (pid, v))

conn.commit()

# -------------------------------------
# INSERIR CLIENTES
# -------------------------------------

first_last = [
    ("João", "Silva"), ("Maria", "Oliveira"), ("Lucas", "Pereira"),
    ("Ana", "Costa"), ("Rafael", "Almeida"), ("Gabriela", "Martins"),
    ("Felipe", "Santos"), ("Bruna", "Rodrigues"), ("Pedro", "Henrique"),
    ("Larissa", "Moreira"), ("André", "Castro"), ("Juliana", "Barros"),
    ("Thiago", "Fernandes"), ("Camila", "Lopes"), ("Marcelo", "Ribeiro"),
    ("Fernanda", "Souza"), ("Douglas", "Nascimento"), ("Paula", "Cardoso"),
    ("Vinicius", "Batista"), ("Thaís", "Carvalho")
] * 5  # Repete para formar 100

for i, (f, l) in enumerate(first_last[:100], start=1):
    nome = f"{f} {l}"
    email = f"{f.lower()}.{l.lower()}.{i}@example.com"
    senha = "senha123"
    telefone = f"11{random.randint(900000000, 999999999)}"

    c.execute("""
        INSERT INTO usuarios (nome, email, senha, telefone)
        VALUES (?, ?, ?, ?)
    """, (nome, email, senha, telefone))

conn.commit()

# -------------------------------------
# INSERIR 100 PEDIDOS RANDOM
# -------------------------------------

c.execute("SELECT id, preco FROM produtos")
prod_rows = c.fetchall()
prod_list = [(r[0], r[1]) for r in prod_rows]

def random_date_within(days=120):
    d = datetime.now() - timedelta(days=random.randint(0, days))
    return d.strftime("%Y-%m-%d %H:%M:%S")

for i in range(100):
    usuario_id = (i % 100) + 1
    item_count = random.randint(1, 5)

    items = []
    subtotal = 0.0

    for _ in range(item_count):
        pid, price = random.choice(prod_list)
        qty = random.randint(1, 3)
        subtotal += price * qty
        items.append((pid, qty, price))

    shipping = 0.0 if subtotal > 200 else 20.0
    total = round(subtotal + shipping, 2)
    status = random.choice(["Pago", "Enviado", "Entregue", "Aguardando Pagamento", "Cancelado"])

    criado_em = random_date_within()

    c.execute("""
        INSERT INTO pedidos (usuario_id, total, shipping, status, criado_em)
        VALUES (?, ?, ?, ?, ?)
    """, (usuario_id, total, shipping, status, criado_em))

    pedido_id = c.lastrowid

    for pid, qty, price in items:
        c.execute("""
            INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
            VALUES (?, ?, ?, ?)
        """, (pedido_id, pid, qty, price))

conn.commit()
conn.close()

print("DB inicializado em", DB)
