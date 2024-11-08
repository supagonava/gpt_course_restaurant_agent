CREATE TABLE tb_menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL
);
CREATE TABLE tb_cart (
    id_user INTEGER NOT NULL,
    id_menu INTEGER NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_menu) REFERENCES tb_menu(id)
);
CREATE TABLE tb_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lineid TEXT NOT NULL,
    username TEXT NOT NULL,
    messages JSON
);