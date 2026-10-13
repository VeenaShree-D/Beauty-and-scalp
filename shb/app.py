"""
Skin, Hair & Body Care (SHB) Recommendation Service
Python Backend Application & Recommendation Engine
"""

import os
import json
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__, static_folder=".", static_url_path="")

DB_PATH = os.path.join(os.path.dirname(__file__), "shb_database.sqlite")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            skin_type TEXT NOT NULL DEFAULT 'combination',
            skin_concerns TEXT,
            hair_texture TEXT NOT NULL DEFAULT 'wavy',
            scalp_type TEXT NOT NULL DEFAULT 'balanced',
            hair_concerns TEXT,
            body_skin_type TEXT NOT NULL DEFAULT 'normal',
            sun_exposure TEXT NOT NULL DEFAULT 'moderate',
            fragrance_preference TEXT NOT NULL DEFAULT 'any',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_slug TEXT NOT NULL,
            name TEXT NOT NULL,
            brand TEXT NOT NULL,
            sub_type TEXT NOT NULL,
            routine_time TEXT NOT NULL DEFAULT 'Both',
            step_order INTEGER NOT NULL DEFAULT 1,
            price REAL NOT NULL,
            description TEXT NOT NULL,
            key_actives TEXT NOT NULL,
            suitable_skin_types TEXT NOT NULL,
            targeted_concerns TEXT NOT NULL,
            is_fragrance_free INTEGER NOT NULL DEFAULT 1,
            rating REAL NOT NULL DEFAULT 4.8,
            image_icon TEXT DEFAULT 'droplet'
        );
    """)

    # Check if products exist, otherwise seed
    cursor.execute("SELECT COUNT(*) FROM products")
    if cursor.fetchone()[0] == 0:
        products = [
            # Skincare
            ('skincare', 'Gentle Hydrating Cleanser', 'PureBiome Labs', 'Cleanser', 'Both', 1, 19.00,
             'Non-stripping amino acid cleansing wash that removes impurities without disrupting the lipid moisture barrier.',
             'Ceramides NP, Amino Acids, Colloidal Oat', 'dry,sensitive,normal,combination', 'dehydration,redness,barrier_damage', 1, 4.9, 'droplets'),
            ('skincare', 'Clarifying BHA Pore Wash', 'DermaClear', 'Cleanser', 'Both', 1, 22.00,
             'Micro-foaming cleanser with encapsulated salicylic acid and zinc PCA to unclog pores and reduce excess sebum.',
             'Salicylic Acid 1.5%, Zinc PCA, Green Tea', 'oily,combination', 'acne,pores,oiliness', 1, 4.8, 'sparkles'),
            ('skincare', 'Luminous Niacinamide + Zinc Serum', 'Velvet Radiance', 'Active Serum', 'Both', 2, 28.00,
             'Weightless balancing serum designed to refine pore texture, fade dark marks, and even skin tone.',
             'Niacinamide 10%, Zinc PCA 1%, Licorice Root', 'oily,combination,normal', 'acne,hyperpigmentation,pores', 1, 4.9, 'activity'),
            ('skincare', 'Barrier Restore Ceramide Cloud Cream', 'Aura Dermaceuticals', 'Moisturizer', 'Both', 3, 34.00,
             'Rich velvety cream infused with five multi-molecular ceramides and squalane to deeply soothe dry and compromised skin.',
             'Ceramides 1-3-6, Squalane, Hyaluronic Acid', 'dry,sensitive,combination', 'dehydration,redness,fine_lines', 1, 4.9, 'shield'),
            ('skincare', 'Ultra-Light Invisible Water Gel', 'HydraBalance', 'Moisturizer', 'Both', 3, 26.00,
             'Oil-free quenching gel cream that locks in 72-hour moisture with zero greasy finish.',
             'Centella Asiatica, Hyaluronic Acid, Panthenol', 'oily,combination', 'oiliness,dehydration', 1, 4.7, 'sun'),
            ('skincare', 'Invisible Silk Mineral Fluid SPF 50+', 'SolShade Lab', 'Sunscreen', 'AM', 4, 32.00,
             'Featherlight broad-spectrum mineral sunscreen that leaves no white cast and delivers an invisible matte glow.',
             'Zinc Oxide 12%, Ectoin, Vitamin E', 'oily,dry,combination,sensitive,normal', 'sun_protection,anti_aging,redness', 1, 4.9, 'sun'),
            ('skincare', 'Midnight Retinol Lipid Oil', 'ChronoRepair', 'Night Treatment', 'PM', 3, 42.00,
             'Encapsulated slow-release retinol suspended in nourishing rosehip seed oil for overnight renewal without redness.',
             'Granactive Retinoid 2%, Rosehip Oil, Bakuchiol', 'dry,combination,normal', 'fine_lines,hyperpigmentation,texture', 1, 4.8, 'moon'),

            # Hair Care
            ('haircare', 'Rosemary Peppermint Scalp Clarifier', 'Follicle Botanics', 'Scalp Pre-Wash', 'Weekly', 1, 24.00,
             'Exfoliating AHA and rosemary scalp serum that lifts product buildup, balances sebum, and revitalizes follicles.',
             'Rosemary Leaf Extract, Glycolic Acid 3%, Biotin', 'oily,balanced', 'flaky_scalp,thinning,oiliness', 1, 4.8, 'feather'),
            ('haircare', 'Peptide Bond Repair Hair Mask', 'StrandTheory', 'Deep Conditioner', 'Weekly', 2, 38.00,
             'Bio-identical peptide formulation that repairs broken keratin bonds caused by heat and color treatments.',
             'Oligopeptide-78, Hydrolyzed Quinoa, Shea Butter', 'wavy,curly,coily,straight', 'color_damage,breakage,frizz', 1, 4.9, 'award'),
            ('haircare', 'Weightless Botanical Volumizing Cleanse', 'Verde Hair Lab', 'Shampoo', 'Both', 1, 21.00,
             'Sulfate-free invigorating cleanser that boosts lift at the root for fine and easily weighed down strands.',
             'Apple Amino Acids, Rice Protein, Bamboo Extract', 'straight,wavy', 'thinning,flatness', 0, 4.7, 'wind'),
            ('haircare', 'Curl Defining Moisture Butter', 'Flora & Coil', 'Leave-In Styling', 'Both', 3, 27.00,
             'Intensely nourishing curl-clumping cream that locks in bounce, elongates coils, and seals split ends.',
             'Murumuru Butter, Flaxseed Gel, Argan Oil', 'curly,coily', 'frizz,dryness', 1, 4.9, 'heart'),
            ('haircare', 'Scalp Calming Prebiotic Serum', 'DermaScalp', 'Scalp Serum', 'Both', 3, 29.00,
             'Soothing leave-in peptide drops that comfort dry, tight, or sensitive scalps and rebuild microbiome balance.',
             'Prebiotics, Niacinamide 3%, Allantoin', 'dry,sensitive', 'flaky_scalp,sensitivity', 1, 4.8, 'shield'),

            # Body Care
            ('bodycare', 'Lactic Acid 10% Smoothing Body Polish', 'KeraSmooth', 'Exfoliator', 'Both', 1, 28.00,
             'Gentle chemical smoothing wash that dissolves keratin plugs and rough keratosis pilaris bumps without scratching.',
             'Lactic Acid 10%, Urea 5%, Niacinamide', 'bumpy_kp,normal', 'rough_texture,ingrowns', 1, 4.9, 'sparkles'),
            ('bodycare', 'Replenishing Ceramide Lipid Body Balm', 'HydraSoma', 'Body Cream', 'Both', 2, 25.00,
             'Rich 24-hour restorative body butter designed to rescue intensely dry and eczema-prone skin barriers.',
             'Ceramide Complex, Colloidal Oatmeal, Shea', 'very_dry,sensitive', 'extreme_dryness,itchiness,barrier_damage', 1, 4.9, 'shield'),
            ('bodycare', 'Radiant Glow SPF 50 Mineral Body Silk', 'Soleil Veil', 'Body Sunscreen', 'AM', 3, 30.00,
             'Water-resistant, non-sticky mineral sunscreen with light-reflecting mica and antioxidant rich jojoba oil.',
             'Non-Nano Zinc Oxide, Jojoba Oil, Vitamin C', 'normal,very_dry,bumpy_kp,sensitive', 'sun_protection,dullness', 1, 4.8, 'sun'),
            ('bodycare', 'Botanical Firming Body Oil', 'Elixir Botanica', 'Body Oil', 'PM', 3, 36.00,
             'Fast-absorbing dry oil that enhances skin elasticity, nourishes stretch-prone zones, and seals in hydration.',
             'Marula Oil, Sweet Almond Oil, Squalane', 'very_dry,normal', 'dryness,loss_of_elasticity', 0, 4.7, 'droplet'),

            # Lip Care
            ('lipcare', 'Overnight Peptide Barrier Lip Butter', 'PureBiome Labs', 'Lip Sleeping Mask', 'PM', 1, 16.00,
             'Deeply restorative overnight sleeping butter that heals chapped, bleeding, or cracked lip tissue with bio-identical lipids.',
             'Palmitoyl Tripeptide-1, Ceramide NP, Shea Butter', 'chapped,dry_lips,sensitive_lips', 'peeling,fine_lines', 1, 4.9, 'heart'),
            ('lipcare', 'Mineral Silk Lip Shield SPF 30+', 'SolShade Lab', 'Lip Sun Protection', 'AM', 1, 14.00,
             'Hydrating invisible mineral sunscreen balm with natural plant waxes and antioxidants to prevent photo-damage and dark borders.',
             'Zinc Oxide 8%, Vitamin E, Jojoba Oil', 'chapped,dry_lips,pigmented_lips,normal_lips', 'sun_protection', 1, 4.8, 'sun'),
            ('lipcare', 'Bio-Plumping Hyaluronic Lip Nectar', 'Velvet Radiance', 'Plumping Gloss', 'Both', 2, 22.00,
             'Non-stinging volume gloss with multi-molecular hyaluronic spheres that delivers plush, pillowy bounce and glass shine.',
             'Hyaluronic Micro-Spheres, Volulip, Plant Squalane', 'normal_lips,dry_lips,pigmented_lips', 'thinness,fine_lines', 1, 4.9, 'sparkles'),
            ('lipcare', 'Cica Calming Lip Rescue Salve', 'Aura Dermaceuticals', 'Barrier Salve', 'Both', 1, 15.00,
             'Hypoallergenic soothing salve formulated without irritants or flavorings to soothe contact cheilitis and reactive lips.',
             'Centella Asiatica, Bisabolol, Panthenol 5%', 'sensitive_lips,chapped', 'peeling', 1, 4.9, 'shield'),

            # Eye Care
            ('eyecare', 'Caffeine 5% + EGCG Awakening Eye Serum', 'Velvet Radiance', 'Drainage Serum', 'AM', 1, 26.00,
             'High-potency botanical drainage fluid that visibly reduces morning under-eye water retention and vascular shadows.',
             'Caffeine 5%, Green Tea EGCG, Niacinamide', 'puffiness,dark_circles', 'morning_puffiness,vascular_shadows', 1, 4.9, 'sparkles'),
            ('eyecare', 'Multi-Peptide 360° Firming Eye Elixir', 'StrandTheory', 'Firming Treatment', 'Both', 2, 38.00,
             'Advanced firming formula targeting crow’s feet, eyelid laxity, and fine dynamic crinkles around the orbital bone.',
             'Matrixyl 3000, Argireline 10%, Haloxyl', 'fine_lines_eye,dry_crepey', 'eyelid_laxity', 1, 4.9, 'award'),
            ('eyecare', 'Barrier Restorative Ceramide Eye Cushion Balm', 'PureBiome Labs', 'Eye Cream', 'Both', 2, 29.00,
             'Intensely nourishing cushion cream that seals moisture into crepey, parchment-thin under-eye skin without causing milia.',
             'Ceramides 1-3-6, Plant Squalane, Vitamin E', 'dry_crepey,sensitive_eyes', 'thin_skin', 1, 4.8, 'shield'),
            ('eyecare', 'Gentle Bakuchiol Eye Renewal Complex', 'ChronoRepair', 'Night Treatment', 'PM', 2, 34.00,
             'Plant-derived retinol alternative designed specifically for delicate periorbital tissue to fade dark circles and smooth texture.',
             'Bakuchiol 1%, Chrysin, Hyaluronic Acid', 'dark_circles,fine_lines_eye,sensitive_eyes', 'vascular_shadows,thin_skin', 1, 4.8, 'moon')
        ]
        cursor.executemany("""
            INSERT INTO products 
            (category_slug, name, brand, sub_type, routine_time, step_order, price, description, key_actives, suitable_skin_types, targeted_concerns, is_fragrance_free, rating, image_icon)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, products)
    conn.commit()
    conn.close()

# CORS & Response Headers
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# Static Frontend Route
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Authentication Endpoints
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()
    full_name = data.get('full_name', '').strip() or username

    if not username or not email or not password:
        return jsonify({'status': 'error', 'message': 'Username, email, and password are required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (username, email))
    if cursor.fetchone():
        conn.close()
        return jsonify({'status': 'error', 'message': 'Username or email already exists'}), 409

    pwd_hash = generate_password_hash(password)
    cursor.execute("INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)",
                   (username, email, pwd_hash, full_name))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    return jsonify({
        'status': 'success',
        'message': 'Account created successfully',
        'user': {'id': user_id, 'username': username, 'email': email, 'full_name': full_name}
    }), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    login_id = data.get('username') or data.get('email') or ''
    password = data.get('password', '')

    if not login_id or not password:
        return jsonify({'status': 'error', 'message': 'Credentials required'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (login_id, login_id))
    user = cursor.fetchone()

    if not user or not check_password_hash(user['password_hash'], password):
        conn.close()
        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

    # Fetch profile if exists
    cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user['id'],))
    profile_row = cursor.fetchone()
    profile = None
    if profile_row:
        profile = dict(profile_row)
        profile['skin_concerns'] = json.loads(profile.get('skin_concerns') or '[]')
        profile['hair_concerns'] = json.loads(profile.get('hair_concerns') or '[]')

    conn.close()
    return jsonify({
        'status': 'success',
        'user': {'id': user['id'], 'username': user['username'], 'email': user['email'], 'full_name': user['full_name']},
        'profile': profile
    })

# Profile & Questionnaire Endpoints
@app.route('/api/profile', methods=['POST'])
def save_profile():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'user_id required'}), 400

    skin_type = data.get('skin_type', 'combination')
    skin_concerns = json.dumps(data.get('skin_concerns', []))
    hair_texture = data.get('hair_texture', 'wavy')
    scalp_type = data.get('scalp_type', 'balanced')
    hair_concerns = json.dumps(data.get('hair_concerns', []))
    body_skin_type = data.get('body_skin_type', 'normal')
    sun_exposure = data.get('sun_exposure', 'moderate')
    fragrance_preference = data.get('fragrance_preference', 'any')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM user_profiles WHERE user_id = ?", (user_id,))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE user_profiles 
            SET skin_type=?, skin_concerns=?, hair_texture=?, scalp_type=?, hair_concerns=?, 
                body_skin_type=?, sun_exposure=?, fragrance_preference=?, updated_at=CURRENT_TIMESTAMP
            WHERE user_id=?
        """, (skin_type, skin_concerns, hair_texture, scalp_type, hair_concerns, body_skin_type, sun_exposure, fragrance_preference, user_id))
    else:
        cursor.execute("""
            INSERT INTO user_profiles 
            (user_id, skin_type, skin_concerns, hair_texture, scalp_type, hair_concerns, body_skin_type, sun_exposure, fragrance_preference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, skin_type, skin_concerns, hair_texture, scalp_type, hair_concerns, body_skin_type, sun_exposure, fragrance_preference))

    conn.commit()
    conn.close()

    return jsonify({
        'status': 'success',
        'message': 'Diagnostic profile recorded successfully',
        'profile': {
            'user_id': user_id,
            'skin_type': skin_type,
            'skin_concerns': json.loads(skin_concerns),
            'hair_texture': hair_texture,
            'scalp_type': scalp_type,
            'hair_concerns': json.loads(hair_concerns),
            'body_skin_type': body_skin_type,
            'sun_exposure': sun_exposure,
            'fragrance_preference': fragrance_preference
        }
    })

# Recommendation Algorithm Endpoint
@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    category = request.args.get('category', 'all').lower()
    skin_type = request.args.get('skin_type', 'combination').lower()
    hair_texture = request.args.get('hair_texture', 'wavy').lower()
    scalp_type = request.args.get('scalp_type', 'balanced').lower()
    body_skin_type = request.args.get('body_skin_type', 'normal').lower()
    fragrance_free = request.args.get('fragrance_free', '0') == '1'

    raw_skin_concerns = request.args.get('skin_concerns', '')
    skin_concerns = [c.strip().lower() for c in raw_skin_concerns.split(',') if c.strip()]
    raw_hair_concerns = request.args.get('hair_concerns', '')
    hair_concerns = [c.strip().lower() for c in raw_hair_concerns.split(',') if c.strip()]

    conn = get_db()
    cursor = conn.cursor()
    if category != 'all':
        cursor.execute("SELECT * FROM products WHERE category_slug = ?", (category,))
    else:
        cursor.execute("SELECT * FROM products")
    rows = cursor.fetchall()
    conn.close()

    scored_items = []
    for r in rows:
        item = dict(r)
        cat = item['category_slug']
        suit_types = [s.strip().lower() for s in item['suitable_skin_types'].split(',')]
        target_concerns = [c.strip().lower() for c in item['targeted_concerns'].split(',')]
        
        base_score = 75
        reasons = []

        if cat == 'skincare':
            if skin_type in suit_types:
                base_score += 15
                reasons.append(f"Precision match for {skin_type.capitalize()} skin types")
            matched_c = set(skin_concerns).intersection(set(target_concerns))
            if matched_c:
                base_score += len(matched_c) * 6
                reasons.append(f"Directly addresses {', '.join([c.replace('_', ' ').capitalize() for c in matched_c])}")
            if fragrance_free and item['is_fragrance_free'] == 1:
                base_score += 4
                reasons.append("100% Fragrance-free clean formula")
            elif fragrance_free and item['is_fragrance_free'] == 0:
                base_score -= 25

        elif cat == 'haircare':
            if hair_texture in suit_types:
                base_score += 12
                reasons.append(f"Weight balanced for {hair_texture.capitalize()} hair pattern")
            if scalp_type in suit_types:
                base_score += 10
                reasons.append(f"Formulated to balance {scalp_type.capitalize()} scalp microbiome")
            matched_hc = set(hair_concerns).intersection(set(target_concerns))
            if matched_hc:
                base_score += len(matched_hc) * 6
                reasons.append(f"Targets {', '.join([c.replace('_', ' ').capitalize() for c in matched_hc])}")

        elif cat == 'bodycare':
            if body_skin_type in suit_types:
                base_score += 15
                reasons.append(f"Clinical formulation for {body_skin_type.replace('_', ' ').capitalize()} body skin")
            if 'sun_protection' in target_concerns:
                reasons.append("Essential broad-spectrum shield against photo-aging")

        final_score = min(99, max(60, base_score))
        item['compatibility_score'] = final_score
        item['reasons'] = reasons if reasons else ["Strengthens dermal barrier health"]
        item['is_fragrance_free'] = bool(item['is_fragrance_free'])
        item['price_inr'] = round(item['price'] * 83)
        scored_items.append(item)

    scored_items.sort(key=lambda x: (x['step_order'], -x['compatibility_score']))

    return jsonify({
        'status': 'success',
        'category': category,
        'total': len(scored_items),
        'recommendations': scored_items
    })

if __name__ == '__main__':
    init_db()
    print("SHB Beauty Recommendation Engine running on http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
