<?php
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

if ($action === 'register') {
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? '');
    $full_name = trim($input['full_name'] ?? '');

    if (!$username || !$email || !$password) {
        send_json(['status' => 'error', 'message' => 'Username, email, and password are required.'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_json(['status' => 'error', 'message' => 'Please provide a valid email address.'], 400);
    }

    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        send_json(['status' => 'error', 'message' => 'Username or email is already registered.'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)");
    $stmt->execute([$username, $email, $hash, $full_name ?: $username]);
    $user_id = $pdo->lastInsertId();

    send_json([
        'status' => 'success',
        'message' => 'User registered successfully.',
        'user' => [
            'id' => (int)$user_id,
            'username' => $username,
            'email' => $email,
            'full_name' => $full_name ?: $username
        ]
    ], 201);
}

if ($action === 'login') {
    $login = trim($input['username'] ?? $input['email'] ?? '');
    $password = trim($input['password'] ?? '');

    if (!$login || !$password) {
        send_json(['status' => 'error', 'message' => 'Please enter username/email and password.'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        send_json(['status' => 'error', 'message' => 'Invalid credentials.'], 401);
    }

    // Fetch user profile if questionnaire already completed
    $stmtProfile = $pdo->prepare("SELECT * FROM user_profiles WHERE user_id = ?");
    $stmtProfile->execute([$user['id']]);
    $profile = $stmtProfile->fetch();

    if ($profile && isset($profile['skin_concerns'])) {
        $profile['skin_concerns'] = json_decode($profile['skin_concerns'], true) ?? [];
        $profile['hair_concerns'] = json_decode($profile['hair_concerns'], true) ?? [];
    }

    send_json([
        'status' => 'success',
        'message' => 'Login successful.',
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name']
        ],
        'profile' => $profile ?: null
    ]);
}

send_json(['status' => 'error', 'message' => 'Invalid auth action.'], 400);
