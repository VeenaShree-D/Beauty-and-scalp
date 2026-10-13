<?php
require_once __DIR__ . '/../config/db.php';

$category = $_GET['category'] ?? 'all';
$skin_type = strtolower($_GET['skin_type'] ?? 'combination');
$hair_texture = strtolower($_GET['hair_texture'] ?? 'wavy');
$scalp_type = strtolower($_GET['scalp_type'] ?? 'balanced');
$body_skin_type = strtolower($_GET['body_skin_type'] ?? 'normal');
$fragrance_free = isset($_GET['fragrance_free']) ? (int)$_GET['fragrance_free'] : 0;
$skin_concerns = isset($_GET['skin_concerns']) ? explode(',', strtolower($_GET['skin_concerns'])) : [];
$hair_concerns = isset($_GET['hair_concerns']) ? explode(',', strtolower($_GET['hair_concerns'])) : [];

// Query products
$sql = "SELECT * FROM products";
$params = [];

if ($category !== 'all') {
    $sql .= " WHERE category_slug = ?";
    $params[] = $category;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Recommendation and Scoring Engine
$scored_products = [];

foreach ($products as $p) {
    $base_score = 75; // Baseline compatibility
    $cat = $p['category_slug'];
    $suit_types = array_map('trim', explode(',', strtolower($p['suitable_skin_types'])));
    $target_concerns = array_map('trim', explode(',', strtolower($p['targeted_concerns'])));
    $matches_reasons = [];

    // Category-specific scoring
    if ($cat === 'skincare') {
        if (in_array($skin_type, $suit_types)) {
            $base_score += 15;
            $matches_reasons[] = "Tailored precisely for " . ucfirst($skin_type) . " skin";
        }
        
        // Concern overlap
        $matched_concerns = array_intersect($skin_concerns, $target_concerns);
        if (!empty($matched_concerns)) {
            $base_score += count($matched_concerns) * 5;
            $matches_reasons[] = "Directly targets " . implode(', ', array_map('ucfirst', $matched_concerns));
        }

        // Fragrance preference
        if ($fragrance_free && (int)$p['is_fragrance_free'] === 1) {
            $base_score += 5;
            $matches_reasons[] = "100% Fragrance-free hypoallergenic formula";
        } elseif ($fragrance_free && (int)$p['is_fragrance_free'] === 0) {
            $base_score -= 30; // Deduct if user requested fragrance-free
        }
    } elseif ($cat === 'haircare') {
        if (in_array($hair_texture, $suit_types)) {
            $base_score += 12;
            $matches_reasons[] = "Optimized weight for " . ucfirst($hair_texture) . " hair strands";
        }
        if (in_array($scalp_type, $suit_types)) {
            $base_score += 10;
            $matches_reasons[] = "Formulated to balance " . ucfirst($scalp_type) . " scalp conditions";
        }

        $matched_concerns = array_intersect($hair_concerns, $target_concerns);
        if (!empty($matched_concerns)) {
            $base_score += count($matched_concerns) * 6;
            $matches_reasons[] = "Addresses " . implode(', ', array_map('ucfirst', $matched_concerns));
        }
    } elseif ($cat === 'bodycare') {
        if (in_array($body_skin_type, $suit_types)) {
            $base_score += 15;
            $matches_reasons[] = "Clinically selected for " . str_replace('_', ' ', ucfirst($body_skin_type)) . " body skin";
        }

        if (in_array('sun_protection', $target_concerns)) {
            $matches_reasons[] = "Essential broad-spectrum UV defense";
        }
    }

    // Clamp score between 60 and 99
    $final_score = min(99, max(60, $base_score));

    $p['compatibility_score'] = $final_score;
    $p['reasons'] = !empty($matches_reasons) ? $matches_reasons : ["Balances everyday cellular barrier health"];
    $p['is_fragrance_free'] = (bool)$p['is_fragrance_free'];
    $p['price'] = (float)$p['price'];
    $p['rating'] = (float)$p['rating'];
    $p['price_inr'] = round((float)$p['price'] * 83);

    $scored_products[] = $p;
}

// Sort descending by score
usort($scored_products, function($a, $b) {
    if ($a['step_order'] !== $b['step_order']) {
        return $a['step_order'] <=> $b['step_order'];
    }
    return $b['compatibility_score'] <=> $a['compatibility_score'];
});

send_json([
    'status' => 'success',
    'total' => count($scored_products),
    'category' => $category,
    'recommendations' => $scored_products
]);
