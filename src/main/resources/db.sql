-- DROP TABLE IF EXISTS order_items;
-- DROP TABLE IF EXISTS orders;
-- DROP TABLE IF EXISTS supplier_orders;
-- DROP TABLE IF EXISTS media;
-- DROP TABLE IF EXISTS appointments;
-- DROP TABLE IF EXISTS forgot_password;
-- DROP TABLE IF EXISTS inventory;
-- DROP TABLE IF EXISTS category;
-- DROP TABLE IF EXISTS users;

-- Creare tabela users
-- role_id 1 = client
-- role_id 2 = employee
-- role_id 3 = admin
CREATE TABLE IF NOT EXISTS users (
                                     id            SERIAL PRIMARY KEY,
                                     first_name    TEXT   NOT NULL,
                                     last_name     TEXT   NOT NULL,
                                     role_id       INTEGER NOT NULL,
                                     password      TEXT   NOT NULL,
                                     phone_number  TEXT   NOT NULL,
                                     email         TEXT   NOT NULL
);

-- Creare tabela forgot_password
CREATE TABLE IF NOT EXISTS forgot_password (
                                               id               SERIAL PRIMARY KEY,
                                               user_id          INTEGER NOT NULL,
                                               token            TEXT    NOT NULL,
                                               expiration_date  TEXT    NOT NULL,
                                               FOREIGN KEY(user_id) REFERENCES users(id)
    );

-- Creare tabela category
CREATE TABLE IF NOT EXISTS category (
                                        id    SERIAL PRIMARY KEY,
                                        name  TEXT   NOT NULL UNIQUE
);

-- Inserare valori în tabela category (doar dacă nu există deja)
INSERT INTO category (name) VALUES
                                ('Brake System'),
                                ('Transmission System'),
                                ('Wheels and Tires'),
                                ('Suspension and Fork'),
                                ('Electrical Components'),
                                ('Battery and Charging'),
                                ('Lighting'),
                                ('Engine and Clutch'),
                                ('Cables and Housings'),
                                ('Consumables'),
                                ('Bearings and Seals'),
                                ('Fasteners and Mounts')
    ON CONFLICT (name) DO NOTHING;

-- Creare tabela inventory
-- //pe viitor ar putea fi:
-- //pk id nume_furnizor nume_produs
CREATE TABLE IF NOT EXISTS inventory (
                                         id             SERIAL PRIMARY KEY,
                                         name           TEXT    NOT NULL,
                                         category       INTEGER NOT NULL,
                                         quantity       INTEGER NOT NULL,
                                         price          REAL    NOT NULL,
                                         supplier       TEXT    NOT NULL,
                                         status         TEXT    DEFAULT '',  -- in-stock, out-of-stock, low-stock, ordered,deleted
                                         FOREIGN KEY(category) REFERENCES category(id)
    );

-- Creare tabela appointments
CREATE TABLE IF NOT EXISTS appointments (
                                            id              SERIAL PRIMARY KEY,
                                            client_id       INTEGER NOT NULL,
                                            date            TEXT    NOT NULL,
                                            start_time      TEXT    NOT NULL,
                                            end_time        TEXT    NOT NULL,
                                            vehicle_brand   TEXT,
                                            vehicle_model   TEXT,
                                            vehicle_type    TEXT    NOT NULL,
                                            description     TEXT    NOT NULL,
                                            status          TEXT    DEFAULT 'pending',  -- canceled (clientul anulează), modified, pending, approved, rejected, completed
                                            admin_message   TEXT,
                                            estimated_price REAL,
                                            warranty_months INTEGER,
                                            FOREIGN KEY(client_id) REFERENCES users(id)
    );

-- Creare tabela media
CREATE TABLE IF NOT EXISTS media (
                                     id              SERIAL PRIMARY KEY,
                                     appointment_id  INTEGER NOT NULL,
                                     file_name       TEXT,
                                     type            TEXT,
                                     file_data       BYTEA,
                                     FOREIGN KEY(appointment_id) REFERENCES appointments(id)
    );

-- Creare tabela supplier_orders
CREATE TABLE IF NOT EXISTS supplier_orders (
                                               id            SERIAL PRIMARY KEY,
                                               inventory_id  INTEGER,
                                               quantity      INTEGER,
                                               order_date    TEXT,
                                               status        TEXT,
                                               FOREIGN KEY(inventory_id) REFERENCES inventory(id)
    );

-- Creare tabela orders
CREATE TABLE IF NOT EXISTS orders (
                                      id               SERIAL PRIMARY KEY,
                                      appointment_id   INTEGER NOT NULL,
                                      order_date       TEXT    NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
    status           TEXT    NOT NULL DEFAULT 'pending',
    estimated_total  REAL,
    FOREIGN KEY(appointment_id) REFERENCES appointments(id)
    );

-- Creare tabela order_items
CREATE TABLE IF NOT EXISTS order_items (
                                           id           SERIAL PRIMARY KEY,
                                           order_id     INTEGER NOT NULL,
                                           inventory_id INTEGER NOT NULL,
                                           quantity     INTEGER NOT NULL,
                                           unit_price   REAL    NOT NULL,
                                           FOREIGN KEY(order_id) REFERENCES orders(id),
                                            FOREIGN KEY(inventory_id) REFERENCES inventory(id)
    );


INSERT INTO inventory (name, category, quantity, price, supplier, status) VALUES
    (
        'Ulei Motor 10W40',
        (SELECT id FROM category WHERE name = 'Consumables'),
        25,
        45.99,
        'MotorOil SRL',
        'in-stock'
    ),
    (
        'Filtru ulei Honda',
        (SELECT id FROM category WHERE name = 'Engine and Clutch'),
        12,
        29.99,
        'AutoParts SRL',
        'in-stock'
    ),
    (
        'Plăcuțe frână Shimano',
        (SELECT id FROM category WHERE name = 'Brake System'),
        5,
        79.99,
        'BikeZone',
        'low-stock'
    ),
    (
        'Baterie trotinetă Xiaomi',
        (SELECT id FROM category WHERE name = 'Battery and Charging'),
        0,
        349.99,
        'TechParts',
        'out-of-stock'
    );



   CREATE OR REPLACE FUNCTION trg_update_inventory_stock()
   RETURNS TRIGGER AS $$
   DECLARE
     current_quantity  INTEGER;
     new_quantity      INTEGER;
     new_status   TEXT;
   BEGIN
     SELECT quantity
       INTO current_quantity
       FROM inventory
      WHERE id = NEW.inventory_id
      FOR UPDATE;  -- blocchez randul ca să nu apara conditii de concurenta

     new_quantity := current_quantity - NEW.quantity;

     IF new_quantity < 0 THEN
       RAISE EXCEPTION 'Nu pot scadea % bucati din produsul #% – stoc insuficient (stoc curent: %).',
                       NEW.quantity, NEW.inventory_id, current_quantity;
     END IF;

     IF new_quantity = 0 THEN
       new_status := 'out-of-stock';
     ELSIF new_quantity < 5 THEN
       new_status := 'low-stock';
     ELSE
       new_status := 'in-stock';
     END IF;

     UPDATE inventory
     SET
       quantity = new_quantity,
       status   = new_status
     WHERE id = NEW.inventory_id;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trg_order_items_after_insert
   AFTER INSERT ON order_items
   FOR EACH ROW
   EXECUTE FUNCTION trg_update_inventory_stock();



   CREATE OR REPLACE FUNCTION trg_restore_inventory_on_order_cancel()
   RETURNS TRIGGER AS $$
   DECLARE
     rec_item        RECORD;
     current_qty     INTEGER;
     restored_qty    INTEGER;
     new_inv_status  TEXT;
   BEGIN
     IF OLD.status IS DISTINCT FROM 'canceled'
        AND NEW.status = 'canceled'
     THEN
       FOR rec_item IN
         SELECT inventory_id, quantity
           FROM order_items
          WHERE order_id = NEW.id
       LOOP
         SELECT quantity
           INTO current_qty
           FROM inventory
          WHERE id = rec_item.inventory_id
          FOR UPDATE;

         restored_qty := current_qty + rec_item.quantity;

         IF restored_qty = 0 THEN
           new_inv_status := 'out-of-stock';
         ELSIF restored_qty < 5 THEN
           new_inv_status := 'low-stock';
         ELSE
           new_inv_status := 'in-stock';
         END IF;

         UPDATE inventory
         SET
           quantity = restored_qty,
           status   = new_inv_status
         WHERE id = rec_item.inventory_id;
       END LOOP;

     END IF;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trg_orders_after_update_restore_items
   AFTER UPDATE ON orders
   FOR EACH ROW
   EXECUTE FUNCTION trg_restore_inventory_on_order_cancel();

CREATE OR REPLACE FUNCTION inventory_prevent_delete_if_active_orders()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'deleted' AND OLD.status IS DISTINCT FROM 'deleted' THEN
        IF EXISTS (
            SELECT 1
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
             WHERE oi.inventory_id = NEW.id
               AND o.status IN ('pending')
        ) THEN
            RAISE EXCEPTION 'Nu poți marca item-ul % ca "deleted": există comenzi active (pending) care folosesc aceasta piesa.', NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;


CREATE TRIGGER trg_inventory_before_update_status
BEFORE UPDATE OF status ON inventory
FOR EACH ROW
EXECUTE FUNCTION inventory_prevent_delete_if_active_orders();


CREATE OR REPLACE FUNCTION trg_check_appointment_overlap()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status NOT IN ('canceled', 'rejected') THEN

        IF EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.date = NEW.date
              AND a.id <> COALESCE(NEW.id, 0)
              AND a.status NOT IN ('canceled', 'rejected')
              AND NOT (
                a.end_time::time <= NEW.start_time::time
                    OR a.start_time::time >= NEW.end_time::time
                )
        ) THEN
            RAISE EXCEPTION
                'Intervalul [% - %] se suprapune cu o alta programare activa in data %',
                NEW.start_time, NEW.end_time, NEW.date;
        END IF;
    END IF;

    RETURN NEW;
END;
$$
    LANGUAGE plpgsql;


CREATE TRIGGER trg_appointments_no_overlap
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW
EXECUTE FUNCTION trg_check_appointment_overlap();
