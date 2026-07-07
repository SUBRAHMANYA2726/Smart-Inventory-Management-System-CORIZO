from datetime import datetime, timezone
from pathlib import Path
import os
import sqlite3

from flask import Flask, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / 'database.db'

try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass

MONGODB_URI = os.getenv('MONGODB_URI')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'ECOM')
MONGODB_COLLECTION = os.getenv('MONGODB_COLLECTION', 'items')

app = Flask(__name__)


@app.after_request
def add_local_development_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

SQLITE_COLUMNS = {
    'category': "TEXT DEFAULT 'General'",
    'supplier': "TEXT DEFAULT ''",
    'sku': "TEXT DEFAULT ''",
    'barcode': "TEXT DEFAULT ''",
    'purchase_date': "TEXT DEFAULT ''",
    'expiry_date': "TEXT DEFAULT ''",
    'min_stock': "INTEGER DEFAULT 5",
    'status': "TEXT DEFAULT 'Active'",
    'image': "TEXT DEFAULT ''",
    'created_at': "TEXT DEFAULT ''",
    'updated_at': "TEXT DEFAULT ''",
}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def get_mongo_collection():
    if not MONGODB_URI:
        return None

    from pymongo import MongoClient

    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    return client[MONGODB_DATABASE][MONGODB_COLLECTION]


def init_db():
    if MONGODB_URI:
        return

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT NOT NULL,
            description TEXT,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL
        );
    """)

    cursor.execute("PRAGMA table_info(items)")
    existing_columns = {row['name'] for row in cursor.fetchall()}
    for column, definition in SQLITE_COLUMNS.items():
        if column not in existing_columns:
            cursor.execute(f"ALTER TABLE items ADD COLUMN {column} {definition}")

    timestamp = now_iso()
    cursor.execute("UPDATE items SET created_at = ? WHERE created_at IS NULL OR created_at = ''", (timestamp,))
    cursor.execute("UPDATE items SET updated_at = ? WHERE updated_at IS NULL OR updated_at = ''", (timestamp,))
    conn.commit()
    conn.close()


def clean_text(data, key, default=''):
    return str(data.get(key, default) or default).strip()


def validate_item_payload(data):
    if not data or 'name' not in data or 'quantity' not in data or 'price' not in data:
        return None, "Missing required fields."

    name = clean_text(data, 'name')
    if not name:
        return None, "Item name is required."

    try:
        quantity = int(data['quantity'])
        price = float(data['price'])
        min_stock = int(data.get('min_stock', data.get('minStock', 5)) or 0)
    except (TypeError, ValueError):
        return None, "Quantity, price, and minimum stock must be valid numbers."

    if quantity < 0 or price < 0 or min_stock < 0:
        return None, "Quantity, price, and minimum stock cannot be negative."

    status = clean_text(data, 'status', 'Active') or 'Active'
    allowed_statuses = {'Active', 'Low Stock', 'Out of Stock', 'Archived'}
    if status not in allowed_statuses:
        status = 'Active'

    return {
        'name': name,
        'description': clean_text(data, 'description'),
        'quantity': quantity,
        'price': price,
        'category': clean_text(data, 'category', 'General') or 'General',
        'supplier': clean_text(data, 'supplier'),
        'sku': clean_text(data, 'sku'),
        'barcode': clean_text(data, 'barcode'),
        'purchase_date': clean_text(data, 'purchase_date'),
        'expiry_date': clean_text(data, 'expiry_date'),
        'min_stock': min_stock,
        'status': status,
        'image': clean_text(data, 'image'),
    }, None


def enrich_status(payload):
    if payload['quantity'] == 0:
        payload['status'] = 'Out of Stock'
    elif payload['quantity'] <= payload['min_stock'] and payload['status'] == 'Active':
        payload['status'] = 'Low Stock'
    return payload


def serialize_mongo_item(item):
    return {
        'id': str(item['_id']),
        'name': item.get('name', ''),
        'desc': item.get('description', ''),
        'qty': int(item.get('quantity', 0)),
        'price': float(item.get('price', 0)),
        'category': item.get('category', 'General'),
        'supplier': item.get('supplier', ''),
        'sku': item.get('sku', ''),
        'barcode': item.get('barcode', ''),
        'purchase_date': item.get('purchase_date', ''),
        'expiry_date': item.get('expiry_date', ''),
        'min_stock': int(item.get('min_stock', 5)),
        'status': item.get('status', 'Active'),
        'image': item.get('image', ''),
        'created_at': item.get('created_at', ''),
        'updated_at': item.get('updated_at', ''),
    }


def serialize_sqlite_item(item):
    return {
        'id': item['id'],
        'name': item['item_name'],
        'desc': item['description'] or '',
        'qty': item['quantity'],
        'price': float(item['price']),
        'category': item['category'] or 'General',
        'supplier': item['supplier'] or '',
        'sku': item['sku'] or '',
        'barcode': item['barcode'] or '',
        'purchase_date': item['purchase_date'] or '',
        'expiry_date': item['expiry_date'] or '',
        'min_stock': item['min_stock'] if item['min_stock'] is not None else 5,
        'status': item['status'] or 'Active',
        'image': item['image'] or '',
        'created_at': item['created_at'] or '',
        'updated_at': item['updated_at'] or '',
    }


init_db()


@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/style.css')
def styles():
    return send_from_directory(BASE_DIR, 'style.css')


@app.route('/script.js')
def scripts():
    return send_from_directory(BASE_DIR, 'script.js')


@app.route('/api/items', methods=['GET'])
def get_items():
    collection = get_mongo_collection()
    if collection is not None:
        items = collection.find().sort('updated_at', -1)
        return jsonify([serialize_mongo_item(item) for item in items])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items ORDER BY updated_at DESC, id DESC")
    items = cursor.fetchall()
    conn.close()
    return jsonify([serialize_sqlite_item(item) for item in items])


@app.route('/api/items', methods=['POST'])
def create_item():
    data = request.get_json(silent=True)
    payload, error = validate_item_payload(data)
    if error:
        return jsonify({'error': error}), 400

    timestamp = now_iso()
    payload = enrich_status(payload)
    payload['created_at'] = timestamp
    payload['updated_at'] = timestamp

    collection = get_mongo_collection()
    if collection is not None:
        result = collection.insert_one(payload)
        return jsonify({'message': 'Item created successfully!', 'id': str(result.inserted_id)}), 201

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO items (
                item_name, description, quantity, price, category, supplier, sku,
                barcode, purchase_date, expiry_date, min_stock, status, image,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload['name'], payload['description'], payload['quantity'], payload['price'],
            payload['category'], payload['supplier'], payload['sku'], payload['barcode'],
            payload['purchase_date'], payload['expiry_date'], payload['min_stock'],
            payload['status'], payload['image'], payload['created_at'], payload['updated_at']
        ))
        conn.commit()
    except Exception as exc:
        print(f"Error creating item: {exc}")
        return jsonify({'error': 'Database error occurred.'}), 500
    finally:
        conn.close()

    return jsonify({'message': 'Item created successfully!'}), 201


@app.route('/api/items/<item_id>', methods=['PUT'])
def update_item(item_id):
    data = request.get_json(silent=True)
    payload, error = validate_item_payload(data)
    if error:
        return jsonify({'error': error}), 400

    payload = enrich_status(payload)
    payload['updated_at'] = now_iso()

    collection = get_mongo_collection()
    if collection is not None:
        from bson import ObjectId
        from bson.errors import InvalidId

        try:
            result = collection.update_one({'_id': ObjectId(item_id)}, {'$set': payload})
        except InvalidId:
            return jsonify({'error': f'Item with ID {item_id} not found.'}), 404

        if result.matched_count == 0:
            return jsonify({'error': f'Item with ID {item_id} not found.'}), 404

        return jsonify({'message': f'Item ID {item_id} updated successfully!'})

    try:
        sqlite_item_id = int(item_id)
    except ValueError:
        return jsonify({'error': f'Item with ID {item_id} not found.'}), 404

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE items SET
                item_name = ?, description = ?, quantity = ?, price = ?,
                category = ?, supplier = ?, sku = ?, barcode = ?,
                purchase_date = ?, expiry_date = ?, min_stock = ?, status = ?,
                image = ?, updated_at = ?
            WHERE id = ?
        """, (
            payload['name'], payload['description'], payload['quantity'], payload['price'],
            payload['category'], payload['supplier'], payload['sku'], payload['barcode'],
            payload['purchase_date'], payload['expiry_date'], payload['min_stock'],
            payload['status'], payload['image'], payload['updated_at'], sqlite_item_id
        ))
        updated_rows = cursor.rowcount
        conn.commit()
    except Exception as exc:
        print(f"Error updating item: {exc}")
        return jsonify({'error': 'Database error occurred during update.'}), 500
    finally:
        conn.close()

    if updated_rows == 0:
        return jsonify({'error': f'Item with ID {item_id} not found.'}), 404

    return jsonify({'message': f'Item ID {item_id} updated successfully!'})


@app.route('/api/items/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    collection = get_mongo_collection()
    if collection is not None:
        from bson import ObjectId
        from bson.errors import InvalidId

        try:
            result = collection.delete_one({'_id': ObjectId(item_id)})
        except InvalidId:
            return jsonify({'error': f'Item with ID {item_id} not found.'}), 404

        if result.deleted_count > 0:
            return jsonify({'message': f'Item ID {item_id} deleted successfully!'})

        return jsonify({'error': f'Item with ID {item_id} not found.'}), 404

    try:
        sqlite_item_id = int(item_id)
    except ValueError:
        return jsonify({'error': f'Item with ID {item_id} not found.'}), 404

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM items WHERE id = ?", (sqlite_item_id,))
        deleted_rows = cursor.rowcount
        conn.commit()
    except Exception as exc:
        print(f"Error deleting item: {exc}")
        return jsonify({'error': 'Database error occurred during deletion.'}), 500
    finally:
        conn.close()

    if deleted_rows > 0:
        return jsonify({'message': f'Item ID {item_id} deleted successfully!'})

    return jsonify({'error': f'Item with ID {item_id} not found.'}), 404


if __name__ == '__main__':
    print("Starting Flask app...")
    app.run(host='127.0.0.1', port=5000, debug=False)
