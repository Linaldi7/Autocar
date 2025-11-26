# app.py

import sqlite3

import json

import os

from flask import Flask, jsonify, request, g, send_file

from flask_cors import CORS



DATABASE = "ecommerce.db"

ENUNCIADO_PATH = r"/mnt/data/Challenge - Final Task - 4rd Bimester - E-Commerce.pdf"  # arquivo que você enviou



app = Flask(__name__)

CORS(app)



# ---------- Database helpers ----------

def get_db():

    db = getattr(g, "_database", None)

    if db is None:

        need_init = not os.path.exists(DATABASE)

        print(">>> USANDO BANCO:", os.path.abspath(DATABASE))
        db = g._database = sqlite3.connect(DATABASE)

        db.row_factory = sqlite3.Row

        # if the DB wasn't present, you may want to initialize schema here.

        # We assume you already ran db_init.py previously.

    return db



@app.teardown_appcontext

def close_connection(exception):

    db = getattr(g, "_database", None)

    if db is not None:

        db.close()



# ---------- Utility ----------

def row_to_dict(row):

    if row is None:

        return None

    return {k: row[k] for k in row.keys()}



# ---------- Public API (front-end) ----------



@app.route("/produtos", methods=["GET"])

def list_produtos():

    db = get_db()

    cur = db.execute("""

        SELECT p.id, p.sku, p.nome, p.preco, c.nome as categoria, p.marca, p.estoque, p.descricao, p.specs

        FROM produtos p

        LEFT JOIN categorias c ON p.categoria_id = c.id

        ORDER BY p.id

    """)

    rows = cur.fetchall()

    produtos = []

    for r in rows:

        pid = r["id"]

        imgs = db.execute("SELECT url FROM produtos_imagens WHERE produto_id=?", (pid,)).fetchall()

        imgs = [i["url"] for i in imgs]

        comp = db.execute("SELECT veiculo FROM produtos_compatibilidade WHERE produto_id=?", (pid,)).fetchall()

        comp = [c["veiculo"] for c in comp]

        specs = {}

        try:

            specs = json.loads(r["specs"]) if r["specs"] else {}

        except:

            specs = {}

        produtos.append({

            "id": r["id"],

            "sku": r["sku"],

            "nome": r["nome"],

            "preco": r["preco"],

            "categoria": r["categoria"],

            "marca": r["marca"],

            "estoque": r["estoque"],

            "descricao": r["descricao"],

            "specs": specs,

            "images": imgs,

            "compatibility": comp

        })

    return jsonify(produtos)



@app.route("/produtos/<int:pid>", methods=["GET"])

def get_produto(pid):

    db = get_db()

    r = db.execute("""

        SELECT p.id, p.sku, p.nome, p.preco, c.nome as categoria, p.marca, p.estoque, p.descricao, p.specs

        FROM produtos p

        LEFT JOIN categorias c ON p.categoria_id = c.id

        WHERE p.id = ?

    """, (pid,)).fetchone()

    if not r:

        return jsonify({"error": "Produto não encontrado"}), 404

    imgs = db.execute("SELECT url FROM produtos_imagens WHERE produto_id=?", (pid,)).fetchall()

    imgs = [i["url"] for i in imgs]

    comp = db.execute("SELECT veiculo FROM produtos_compatibilidade WHERE produto_id=?", (pid,)).fetchall()

    comp = [c["veiculo"] for c in comp]

    specs = {}

    try:

        specs = json.loads(r["specs"]) if r["specs"] else {}

    except:

        specs = {}

    produto = {

        "id": r["id"],

        "sku": r["sku"],

        "nome": r["nome"],

        "preco": r["preco"],

        "categoria": r["categoria"],

        "marca": r["marca"],

        "estoque": r["estoque"],

        "descricao": r["descricao"],

        "specs": specs,

        "images": imgs,

        "compatibility": comp

    }

    return jsonify(produto)



@app.route("/usuarios", methods=["POST"])

def create_usuario():

    db = get_db()

    data = request.get_json()

    if not data or not data.get("nome") or not data.get("email") or not data.get("senha"):

        return jsonify({"error": "dados incompletos"}), 400

    try:

        cur = db.execute("INSERT INTO usuarios (nome, email, senha, telefone) VALUES (?, ?, ?, ?)",

                         (data["nome"], data["email"], data["senha"], data.get("telefone")))

        db.commit()

        uid = cur.lastrowid

        return jsonify({"id": uid, "message": "Usuario criado"}), 201

    except sqlite3.IntegrityError:

        return jsonify({"error": "Email já cadastrado"}), 400


@app.route("/pedidos", methods=["POST"])
def create_pedido():
    db = get_db()
    data = request.get_json()

    if not data or not data.get("usuario_id") or not data.get("items"):
        return jsonify({"error": "dados incompletos"}), 400

    # verifica se o usuário existe
    user = db.execute("SELECT id FROM usuarios WHERE id = ?", (data["usuario_id"],)).fetchone()
    if not user:
        return jsonify({"error": "usuario inválido"}), 400

    try:
        total = 0.0

        for it in data["items"]:
            cur = db.execute("SELECT preco FROM produtos WHERE id=?", (it["produto_id"],)).fetchone()
            if not cur:
                return jsonify({"error": f"Produto inválido: {it['produto_id']}"}), 400

            total += cur["preco"] * int(it.get("quantidade", 1))

        # frete simples: 20 se total < 200
        shipping = 0 if total >= 200 else 20

        # cria o pedido
        cur = db.execute("""
            INSERT INTO pedidos (usuario_id, total, shipping, status)
            VALUES (?, ?, ?, ?)
        """, (data["usuario_id"], total, shipping, "pendente"))

        pedido_id = cur.lastrowid

        # cria itens do pedido
        for it in data["items"]:
            price = db.execute("SELECT preco FROM produtos WHERE id=?", (it["produto_id"],)).fetchone()
            db.execute("""
                INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
                VALUES (?, ?, ?, ?)
            """, (pedido_id, it["produto_id"], int(it.get("quantidade", 1)), price["preco"]))

        db.commit()

        return jsonify({
            "id": pedido_id,
            "total": total,
            "shipping": shipping,
            "message": "Pedido criado"
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- Admin API (CRUD produtos, usando categorias e imagens) ----------



def get_or_create_categoria(db, nome):

    if not nome:

        return None

    row = db.execute("SELECT id FROM categorias WHERE nome = ?", (nome,)).fetchone()

    if row:

        return row["id"]

    cur = db.execute("INSERT INTO categorias (nome) VALUES (?)", (nome,))

    db.commit()

    return cur.lastrowid



@app.route("/admin/produtos", methods=["GET"])

def admin_get_produtos():

    db = get_db()

    rows = db.execute("""

        SELECT p.id, p.sku, p.nome, p.preco, c.nome as categoria, p.marca, p.estoque, p.descricao, p.specs

        FROM produtos p

        LEFT JOIN categorias c ON p.categoria_id = c.id

        ORDER BY p.id DESC

    """).fetchall()

    produtos = []

    for r in rows:

        pid = r["id"]

        imgs_rows = db.execute("SELECT url FROM produtos_imagens WHERE produto_id=?", (pid,)).fetchall()

        imgs = [i["url"] for i in imgs_rows]

        produtos.append({

            "id": r["id"],

            "sku": r["sku"],

            "nome": r["nome"],

            "preco": r["preco"],

            "categoria": r["categoria"],

            "marca": r["marca"],

            "estoque": r["estoque"],

            "descricao": r["descricao"],

            "specs": json.loads(r["specs"]) if r["specs"] else {},

            "images": imgs

        })

    return jsonify(produtos)



@app.route("/admin/produto/<int:id>", methods=["GET"])

def admin_get_produto(id):

    db = get_db()

    r = db.execute("SELECT * FROM produtos WHERE id=?", (id,)).fetchone()

    if not r:

        return jsonify({"error": "not found"}), 404

    imgs_rows = db.execute("SELECT url FROM produtos_imagens WHERE produto_id=?", (id,)).fetchall()

    imgs = [i["url"] for i in imgs_rows]

    categoria = None

    if r["categoria_id"]:

        cat = db.execute("SELECT nome FROM categorias WHERE id=?", (r["categoria_id"],)).fetchone()

        categoria = cat["nome"] if cat else None

    produto = {

        "id": r["id"],

        "sku": r["sku"],

        "nome": r["nome"],

        "preco": r["preco"],

        "categoria": categoria,

        "marca": r["marca"],

        "estoque": r["estoque"],

        "descricao": r["descricao"],

        "specs": json.loads(r["specs"]) if r["specs"] else {},

        "images": imgs

    }

    return jsonify(produto)



@app.route("/admin/produto", methods=["POST"])

def admin_create_produto():

    db = get_db()

    data = request.get_json() or {}

    nome = data.get("nome")

    preco = float(data.get("preco") or 0)

    categoria_nome = data.get("categoria")

    marca = data.get("marca")

    estoque = int(data.get("estoque") or 0)

    descricao = data.get("descricao") or ""

    images = data.get("images") or []

    specs = data.get("specs") or {}



    cat_id = get_or_create_categoria(db, categoria_nome) if categoria_nome else None



    cur = db.execute("""

        INSERT INTO produtos (sku, nome, preco, categoria_id, marca, estoque, descricao, specs)

        VALUES (?, ?, ?, ?, ?, ?, ?, ?)

    """, (data.get("sku") or "", nome, preco, cat_id, marca, estoque, descricao, json.dumps(specs)))

    db.commit()

    pid = cur.lastrowid



    # imagens

    for img in images:

        if img and str(img).strip():

            db.execute("INSERT INTO produtos_imagens (produto_id, url) VALUES (?, ?)", (pid, img.strip()))

    db.commit()



    return jsonify({"status": "ok", "id": pid})



# GET lista de pedidos (admin)

@app.route("/admin/pedidos", methods=["GET"])

def admin_get_pedidos():

    db = get_db()

    rows = db.execute("SELECT p.id, p.usuario_id, u.nome as cliente, p.total, p.shipping, p.status, p.criado_em FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.id DESC").fetchall()

    pedidos = []

    for r in rows:

        pedidos.append({

            "id": r["id"],

            "clienteId": r["usuario_id"],

            "cliente": r["cliente"],

            "total": r["total"],

            "shipping": r["shipping"],

            "status": r["status"],

            "data": r["criado_em"]

        })

    return jsonify(pedidos)



# GET detalhe do pedido

@app.route("/admin/pedido/<int:pedido_id>", methods=["GET"])

def admin_get_pedido(pedido_id):

    db = get_db()

    p = db.execute("SELECT p.id, p.usuario_id, u.nome as cliente, u.email, p.total, p.shipping, p.status, p.criado_em FROM pedidos p LEFT JOIN usuarios u ON p.usuario_id = u.id WHERE p.id=?", (pedido_id,)).fetchone()

    if not p:

        return jsonify({"error":"not found"}), 404

    items = db.execute("SELECT i.produto_id, pr.nome as produto_nome, i.quantidade, i.preco_unitario FROM itens_pedido i LEFT JOIN produtos pr ON i.produto_id = pr.id WHERE i.pedido_id=?", (pedido_id,)).fetchall()

    items_list = []

    for it in items:

        items_list.append({

            "produtoId": it["produto_id"],

            "produtoNome": it["produto_nome"],

            "quantidade": it["quantidade"],

            "preco_unitario": it["preco_unitario"]

        })

    return jsonify({

        "id": p["id"],

        "clienteId": p["usuario_id"],

        "cliente": p["cliente"],

        "email": p["email"],

        "total": p["total"],

        "shipping": p["shipping"],

        "status": p["status"],

        "data": p["criado_em"],

        "items": items_list

    })

# ---------- Route to download the original enunciado PDF you uploaded ----------

@app.route("/enunciado", methods=["GET"])

def get_enunciado():

    # send the uploaded PDF file so you can include it in admin or download it

    if os.path.exists(ENUNCIADO_PATH):

        return send_file(ENUNCIADO_PATH, as_attachment=True)

    return jsonify({"error": "Arquivo do enunciado não encontrado no servidor."}), 404



# ---------- Simple health route ----------

@app.route("/", methods=["GET"])

def root():

    return jsonify({"status": "ok", "message": "API Ecommerce AutoCar"}), 200



# ---------- Run ----------

if __name__ == "__main__":

    print("Starting Flask API on http://127.0.0.1:5000")

    app.run(port=5000, debug=True)



@app.route("/usuarios/login", methods=["POST"])

def login_usuario():

    db = get_db()

    data = request.get_json() or {}



    email = data.get("email", "").strip()

    senha = data.get("senha", "").strip()



    if not email or not senha:

        return jsonify({"error": "Email e senha são obrigatórios"}), 400



    user = db.execute("""

        SELECT id, nome, email, telefone

        FROM usuarios

        WHERE email = ? AND senha = ?

    """, (email, senha)).fetchone()



    if not user:

        return jsonify({"error": "Credenciais inválidas"}), 401



    return jsonify({

        "id": user["id"],

        "nome": user["nome"],

        "email": user["email"],

        "telefone": user["telefone"]

    })
