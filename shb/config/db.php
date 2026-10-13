<?php
/**
 * Database Connection & Helper Functions
 * Supports MySQL with fallback to SQLite for zero-config local development.
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'shb_beauty';

$pdo = null;

try {
    // Attempt connection to MySQL first
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    // Graceful fallback to SQLite so the app can be run locally without requiring an active MySQL daemon
    try {
        $sqlite_file = __DIR__ . '/../shb_database.sqlite';
        $needs_init = !file_exists($sqlite_file);
        $pdo = new PDO("sqlite:" . $sqlite_file);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        if ($needs_init) {
            init_sqlite_schema($pdo);
        }
    } catch (PDOException $sqle) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $sqle->getMessage()
        ]);
        exit;
    }
}

function init_sqlite_schema($pdo) {
    $pdo->exec("
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
    ");

    // Populate initial items
    $stmt = $pdo->prepare("
        INSERT INTO products (category_slug, name, brand, sub_type, routine_time, step_order, price, description, key_actives, suitable_skin_types, targeted_concerns, is_fragrance_free, rating, image_icon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $products = [
        ['skincare', 'Gentle Hydrating Cleanser', 'PureBiome Labs', 'Cleanser', 'Both', 1, 19.00, 'Non-stripping amino acid cleansing wash that removes impurities without disrupting the lipid moisture barrier.', 'Ceramides NP, Amino Acids, Colloidal Oat', 'dry,sensitive,normal,combination', 'dehydration,redness,barrier_damage', 1, 4.9, 'droplets'],
        ['skincare', 'Clarifying BHA Pore Wash', 'DermaClear', 'Cleanser', 'Both', 1, 22.00, 'Micro-foaming cleanser with encapsulated salicylic acid and zinc PCA to unclog pores and reduce excess sebum.', 'Salicylic Acid 1.5%, Zinc PCA, Green Tea', 'oily,combination', 'acne,pores,oiliness', 1, 4.8, 'sparkles'],
        ['skincare', 'Luminous Niacinamide + Zinc Serum', 'Velvet Radiance', 'Active Serum', 'Both', 2, 28.00, 'Weightless balancing serum designed to refine pore texture, fade dark marks, and even skin tone.', 'Niacinamide 10%, Zinc PCA 1%, Licorice Root', 'oily,combination,normal', 'acne,hyperpigmentation,pores', 1, 4.9, 'activity'],
        ['skincare', 'Barrier Restore Ceramide Cloud Cream', 'Aura Dermaceuticals', 'Moisturizer', 'Both', 3, 34.00, 'Rich velvety cream infused with five multi-molecular ceramides and squalane to deeply soothe dry and compromised skin.', 'Ceramides 1-3-6, Squalane, Hyaluronic Acid', 'dry,sensitive,combination', 'dehydration,redness,fine_lines', 1, 4.9, 'shield'],
        ['skincare', 'Ultra-Light Invisible Water Gel', 'HydraBalance', 'Moisturizer', 'Both', 3, 26.00, 'Oil-free quenching gel cream that locks in 72-hour moisture with zero greasy finish.', 'Centella Asiatica, Hyaluronic Acid, Panthenol', 'oily,combination', 'oiliness,dehydration', 1, 4.7, 'sun'],
        ['skincare', 'Invisible Silk Mineral Fluid SPF 50+', 'SolShade Lab', 'Sunscreen', 'AM', 4, 32.00, 'Featherlight broad-spectrum mineral sunscreen that leaves no white cast and delivers an invisible matte glow.', 'Zinc Oxide 12%, Ectoin, Vitamin E', 'oily,dry,combination,sensitive,normal', 'sun_protection,anti_aging,redness', 1, 4.9, 'sun'],
        ['skincare', 'Midnight Retinol Lipid Oil', 'ChronoRepair', 'Night Treatment', 'PM', 3, 42.00, 'Encapsulated slow-release retinol suspended in nourishing rosehip seed oil for overnight renewal without redness.', 'Granactive Retinoid 2%, Rosehip Oil, Bakuchiol', 'dry,combination,normal', 'fine_lines,hyperpigmentation,texture', 1, 4.8, 'moon'],
        
        ['haircare', 'Rosemary Peppermint Scalp Clarifier', 'Follicle Botanics', 'Scalp Pre-Wash', 'Weekly', 1, 24.00, 'Exfoliating AHA and rosemary scalp serum that lifts product buildup, balances sebum, and revitalizes follicles.', 'Rosemary Leaf Extract, Glycolic Acid 3%, Biotin', 'oily,balanced', 'flaky_scalp,thinning,oiliness', 1, 4.8, 'feather'],
        ['haircare', 'Peptide Bond Repair Hair Mask', 'StrandTheory', 'Deep Conditioner', 'Weekly', 2, 38.00, 'Bio-identical peptide formulation that repairs broken keratin bonds caused by heat and color treatments.', 'Oligopeptide-78, Hydrolyzed Quinoa, Shea Butter', 'wavy,curly,coily,straight', 'color_damage,breakage,frizz', 1, 4.9, 'award'],
        ['haircare', 'Weightless Botanical Volumizing Cleanse', 'Verde Hair Lab', 'Shampoo', 'Both', 1, 21.00, 'Sulfate-free invigorating cleanser that boosts lift at the root for fine and easily weighed down strands.', 'Apple Amino Acids, Rice Protein, Bamboo Extract', 'straight,wavy', 'thinning,flatness', 0, 4.7, 'wind'],
        ['haircare', 'Curl Defining Moisture Butter', 'Flora & Coil', 'Leave-In Styling', 'Both', 3, 27.00, 'Intensely nourishing curl-clumping cream that locks in bounce, elongates coils, and seals split ends.', 'Murumuru Butter, Flaxseed Gel, Argan Oil', 'curly,coily', 'frizz,dryness', 1, 4.9, 'heart'],
        ['haircare', 'Scalp Calming Prebiotic Serum', 'DermaScalp', 'Scalp Serum', 'Both', 3, 29.00, 'Soothing leave-in peptide drops that comfort dry, tight, or sensitive scalps and rebuild microbiome balance.', 'Prebiotics, Niacinamide 3%, Allantoin', 'dry,sensitive', 'flaky_scalp,sensitivity', 1, 4.8, 'shield'],
        
        ['bodycare', 'Lactic Acid 10% Smoothing Body Polish', 'KeraSmooth', 'Exfoliator', 'Both', 1, 28.00, 'Gentle chemical smoothing wash that dissolves keratin plugs and rough keratosis pilaris bumps without scratching.', 'Lactic Acid 10%, Urea 5%, Niacinamide', 'bumpy_kp,normal', 'rough_texture,ingrowns', 1, 4.9, 'sparkles'],
        ['bodycare', 'Replenishing Ceramide Lipid Body Balm', 'HydraSoma', 'Body Cream', 'Both', 2, 25.00, 'Rich 24-hour restorative body butter designed to rescue intensely dry and eczema-prone skin barriers.', 'Ceramide Complex, Colloidal Oatmeal, Shea', 'very_dry,sensitive', 'extreme_dryness,itchiness,barrier_damage', 1, 4.9, 'shield'],
        ['bodycare', 'Radiant Glow SPF 50 Mineral Body Silk', 'Soleil Veil', 'Body Sunscreen', 'AM', 3, 30.00, 'Water-resistant, non-sticky mineral sunscreen with light-reflecting mica and antioxidant rich jojoba oil.', 'Non-Nano Zinc Oxide, Jojoba Oil, Vitamin C', 'normal,very_dry,bumpy_kp,sensitive', 'sun_protection,dullness', 1, 4.8, 'sun'],
        ['bodycare', 'Botanical Firming Body Oil', 'Elixir Botanica', 'Body Oil', 'PM', 3, 36.00, 'Fast-absorbing dry oil that enhances skin elasticity, nourishes stretch-prone zones, and seals in hydration.', 'Marula Oil, Sweet Almond Oil, Squalane', 'very_dry,normal', 'dryness,loss_of_elasticity', 0, 4.7, 'droplet']
    ];

    foreach ($products as $p) {
        $stmt->execute($p);
    }
}

function send_json($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}
