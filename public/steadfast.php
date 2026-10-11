<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Api-Key, Secret-Key");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$api_key = $_SERVER['HTTP_API_KEY'] ?? '';
$secret_key = $_SERVER['HTTP_SECRET_KEY'] ?? '';

if (!$api_key || !$secret_key) {
    http_response_code(401);
    echo json_encode(["status" => 401, "message" => "Missing API Key or Secret Key"]);
    exit();
}

$action = $_GET['action'] ?? 'create_order';
$tracking_code = $_GET['tracking_code'] ?? '';
$phone = $_GET['phone'] ?? '';

$url = 'https://portal.steadfast.com.bd/api/v1/create_order';
$is_post = true;

if ($action === 'status' && $tracking_code) {
    $url = 'https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/' . urlencode($tracking_code);
    $is_post = false;
} else if ($action === 'fraud_check' && $phone) {
    // Sanitize phone number (strip spaces, symbols, international code)
    $clean_phone = preg_replace('/[^0-9]/', '', $phone);
    if (strlen($clean_phone) > 11 && substr($clean_phone, 0, 2) === '88') {
        $clean_phone = substr($clean_phone, 2);
    }
    $url = 'https://portal.steadfast.com.bd/api/v1/fraud_check/' . urlencode($clean_phone);
    $is_post = false;
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

if ($is_post) {
    $input = file_get_contents("php://input");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Api-Key: ' . $api_key,
    'Secret-Key: ' . $secret_key
]);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpcode);
echo $response;
?>
