# generate_fake_orders.py
import sqlite3
import random
import os
from datetime import datetime, timedelta

print("Gerando pedidos fake...")

# -----------------------------
# Caminho correto para o banco
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # volta 1 pasta (sai do /admin)
DB_PATH = os.path.join(BASE_DIR, "ecommerce.db")

if not os.path.exists(DB_PATH):
    print("ERRO: O arquivo ecommerce.db não foi encontrado!")
    print("Caminho esperado:", DB_PATH)
    exit(1)

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# -----------------------------
# Buscar usuários existentes
# -----------------------------
usuarios = cursor.execute("SELECT id FROM usuarios").fetchall()
if not usuarios:
    print("Nenhum usuário encontrado no banco!")
    print("Crie contas no frontend pelo register.html antes de rodar este script.")
    exit(1)

usuarios = [u[0] for u in usuarios]

# -----------------------------
# Buscar produtos existentes
# -----------------------------
produtos = cursor.execute("SELECT id, preco FROM produtos").fetchall()
if not produtos:
    print("Nenhum produto encontrado no banco!")
    print("Cadastre produtos no admin para gerar pedidos fake.")
    exit(1)

print(f"Usuários encontrados: {len(usuarios)}")
print(f"Produtos encontrados: {len(produtos)}")
print("Gerando 100 pedidos...")

# -----------------------------
# Gerar 100 pedidos fake
# -----------------------------
for _ in range(100):

    usuario_id = random.choice(usuarios)
    num_itens = random.randint(1, 4)

    itens = random.sample(produtos, num_itens)

    total = sum(p[1] for p in itens)
    shipping = 0 if total > 200 else 20

    data_pedido = datetime.now() - timedelta(days=random.randint(1, 40))
    data_str = data_pedido.strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO pedidos (usuario_id, total, shipping, status, criado_em)
        VALUES (?, ?, ?, ?, ?)
    """, (usuario_id, total, shipping, "concluido", data_str))

    pedido_id = cursor.lastrowid

    # Itens do pedido
    for prod in itens:
        cursor.execute("""
            INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
            VALUES (?, ?, ?, ?)
        """, (pedido_id, prod[0], 1, prod[1]))

conn.commit()
conn.close()

print("✔ 100 pedidos fake criados com sucesso!")
print("Abra o dashboard/admin para ver os pedidos.")
