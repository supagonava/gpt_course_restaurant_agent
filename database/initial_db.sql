CREATE TABLE tb_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL
);

CREATE TABLE tb_cart (
    id_menu INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_menu) REFERENCES tb_menu(id)
);