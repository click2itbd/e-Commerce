<?php
$allowed_origins = [
    'https://click2itbd.com',
    'https://www.click2itbd.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://click2itbd.com");
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

$target_dir = __DIR__ . "/uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0755, true);
}

// Completely disable PHP and script execution inside uploads/ directory
$htaccess_path = $target_dir . ".htaccess";
$htaccess_rules = "Options -Indexes -ExecCGI\n"
    . "<IfModule mod_php.c>\n    php_flag engine off\n</IfModule>\n"
    . "<IfModule mod_php7.c>\n    php_flag engine off\n</IfModule>\n"
    . "<IfModule mod_php8.c>\n    php_flag engine off\n</IfModule>\n"
    . "RemoveHandler .php .phtml .php3 .php4 .php5 .php7 .php8 .phar .cgi .pl .py .sh\n"
    . "RemoveType .php .phtml .php3 .php4 .php5 .php7 .php8 .phar .cgi .pl .py .sh\n"
    . "<FilesMatch \"\\.(php[0-9]?|phtml|phar|pl|py|cgi|sh|asp|aspx|jsp|htaccess)$\">\n"
    . "    Require all denied\n"
    . "</FilesMatch>\n";

if (!file_exists($htaccess_path) || file_get_contents($htaccess_path) !== $htaccess_rules) {
    @file_put_contents($htaccess_path, $htaccess_rules);
    @chmod($htaccess_path, 0644);
}

if (!isset($_FILES["image"]) || !is_uploaded_file($_FILES["image"]["tmp_name"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No valid image file provided"]);
    exit();
}

$file = $_FILES["image"];

if ($file["error"] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "File upload error code: " . (int)$file["error"]]);
    exit();
}

// 1. Enforce maximum file size limit (5 MB)
$max_size = 5 * 1024 * 1024;
if ($file["size"] <= 0 || $file["size"] > $max_size) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "File size must be under 5MB."]);
    exit();
}

// 2. Reject dangerous double extensions in the original filename
$original_name = strtolower(basename($file["name"] ?? ''));
if (preg_match('/\.(php[0-9]?|phtml|phar|pl|py|cgi|sh|exe|bat|cmd|svg|html|htm|js)(\.|$)/i', $original_name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid or disallowed file name."]);
    exit();
}

// 3. Verify real MIME type using finfo and getimagesize()
$allowed_mimes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif'
];

$mime_type = '';
if (class_exists('finfo')) {
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime_type = $finfo->file($file["tmp_name"]) ?: '';
}

$img_info = @getimagesize($file["tmp_name"]);
if ($img_info === false || empty($img_info['mime'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "File is not a valid image."]);
    exit();
}

$detected_mime = $mime_type ?: $img_info['mime'];
if (!array_key_exists($detected_mime, $allowed_mimes) || !array_key_exists($img_info['mime'], $allowed_mimes)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Only JPG, PNG, WEBP, and GIF images are allowed."]);
    exit();
}

// 4. Generate cryptographically random filename with strict mapped extension
$ext = $allowed_mimes[$img_info['mime']];
try {
    $random_token = bin2hex(random_bytes(16));
} catch (Exception $e) {
    $random_token = md5(uniqid((string)mt_rand(), true));
}
$safe_file_name = time() . '_' . $random_token . '.' . $ext;
$target_file = $target_dir . $safe_file_name;

if (move_uploaded_file($file["tmp_name"], $target_file)) {
    @chmod($target_file, 0644);

    // Construct safe URL using validated host whitelist
    $raw_host = strtolower(trim($_SERVER['HTTP_HOST'] ?? 'click2itbd.com'));
    $allowed_hosts = ['click2itbd.com', 'www.click2itbd.com', 'localhost:3000', 'localhost:5173', 'localhost'];
    $safe_host = in_array($raw_host, $allowed_hosts, true) ? $raw_host : 'click2itbd.com';
    $protocol = (strpos($safe_host, 'localhost') === 0) ? "http" : "https";

    $base_dir = rtrim(str_replace('\\', '/', dirname($_SERVER['PHP_SELF'] ?? '')), '/');
    $url = $protocol . "://" . $safe_host . $base_dir . "/uploads/" . $safe_file_name;

    echo json_encode(["success" => true, "url" => $url]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Sorry, there was an error uploading your file."]);
}
?>
