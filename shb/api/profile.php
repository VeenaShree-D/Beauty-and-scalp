<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $user_id = (int)($input['user_id'] ?? 0);

    if (!$user_id) {
        send_json(['status' => 'error', 'message' => 'Valid user_id required.'], 400);
    }

    $skin_type = $input['skin_type'] ?? 'combination';
    $skin_concerns = json_encode($input['skin_concerns'] ?? []);
    $hair_texture = $input['hair_texture'] ?? 'wavy';
    $scalp_type = $input['scalp_type'] ?? 'balanced';
    $hair_concerns = json_encode($input['hair_concerns'] ?? []);
    $body_skin_type = $input['body_skin_type'] ?? 'normal';
    $sun_exposure = $input['sun_exposure'] ?? 'moderate';
    $fragrance_preference = $input['fragrance_preference'] ?? 'any';

    // Check if profile exists
    $stmt = $pdo->prepare("SELECT id FROM user_profiles WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $existing = $stmt->fetch();

    if ($existing) {
        $update = $pdo->prepare("
            UPDATE user_profiles 
            SET skin_type = ?, skin_concerns = ?, hair_texture = ?, scalp_type = ?, hair_concerns = ?, 
                body_skin_type = ?, sun_exposure = ?, fragrance_preference = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        ");
        $update->execute([$skin_type, $skin_concerns, $hair_texture, $scalp_type, $hair_concerns, $body_skin_type, $sun_exposure, $fragrance_preference, $user_id]);
    } else {
        $insert = $pdo->prepare("
            INSERT INTO user_profiles 
            (user_id, skin_type, skin_concerns, hair_texture, scalp_type, hair_concerns, body_skin_type, sun_exposure, fragrance_preference)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $insert->execute([$user_id, $skin_type, $skin_concerns, $hair_texture, $scalp_type, $hair_concerns, $body_skin_type, $sun_exposure, $fragrance_preference]);
    }

    send_json([
        'status' => 'success',
        'message' => 'Profile preferences saved successfully.',
        'profile' => [
            'user_id' => $user_id,
            'skin_type' => $skin_type,
            'skin_concerns' => json_decode($skin_concerns, true),
            'hair_texture' => $hair_texture,
            'scalp_type' => $scalp_type,
            'hair_concerns' => json_decode($hair_concerns, true),
            'body_skin_type' => $body_skin_type,
            'sun_exposure' => $sun_exposure,
            'fragrance_preference' => $fragrance_preference
        ]
    ]);
}

if ($method === 'GET') {
    $user_id = (int)($_GET['user_id'] ?? 0);
    if (!$user_id) {
        send_json(['status' => 'error', 'message' => 'user_id parameter required.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM user_profiles WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $profile = $stmt->fetch();

    if (!$profile) {
        send_json(['status' => 'not_found', 'message' => 'Profile not found.'], 404);
    }

    $profile['skin_concerns'] = json_decode($profile['skin_concerns'], true) ?? [];
    $profile['hair_concerns'] = json_decode($profile['hair_concerns'], true) ?? [];

    send_json(['status' => 'success', 'profile' => $profile]);
}

send_json(['status' => 'error', 'message' => 'Method not allowed.'], 405);
