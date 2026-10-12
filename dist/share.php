<?php
/**
 * CLICK2IT - High Compatibility OpenGraph & Social Media Preview Generator
 * Supports: WhatsApp, Facebook, Messenger, Twitter, Telegram, LinkedIn, Discord, etc.
 */

// 1. Gather input parameters
$product_id = isset($_GET['id']) ? trim($_GET['id']) : '';
$title = isset($_GET['title']) ? trim($_GET['title']) : '';
$price = isset($_GET['price']) ? trim($_GET['price']) : '';
$raw_image = isset($_GET['img']) ? trim($_GET['img']) : '';
$desc = isset($_GET['desc']) ? trim($_GET['desc']) : '';

// 2. Fallbacks
if (empty($title)) {
    $title = 'CLICK2IT - Computer & IT Store';
}
if (empty($desc)) {
    $desc = 'Best Price Computer, Laptop, CCTV, Components & IT Solutions in Bangladesh.';
}

$image = !empty($raw_image) ? $raw_image : 'https://click2itbd.com/logo.png';
if (strpos($image, 'http') !== 0) {
    $image = 'https://click2itbd.com' . (strpos($image, '/') === 0 ? '' : '/') . $image;
}

$display_title = $title;
if (!empty($price) && is_numeric($price)) {
    $display_title .= ' - ৳' . number_format((float)$price);
}

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https://" : "https://";
$host = !empty($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'click2itbd.com';
$target_url = $product_id ? ($protocol . $host . "/product/" . urlencode($product_id)) : ($protocol . $host);

// Detect image mime type
$image_type = 'image/jpeg';
if (stripos($image, '.png') !== false) {
    $image_type = 'image/png';
} elseif (stripos($image, '.webp') !== false) {
    $image_type = 'image/webp';
}

// 3. Crawler Detection
$user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
$is_crawler = preg_match('/(facebookexternalhit|Facebot|WhatsApp|Twitterbot|Pinterest|LinkedInBot|TelegramBot|Slackbot|Discordbot|SkypeUriPreview|Viber|kakaotalk-scrap|vkShare)/i', $user_agent);

// 4. If human visitor, redirect to the real React product page instantly
if (!$is_crawler && !empty($product_id)) {
    header("Location: " . $target_url, true, 302);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en" prefix="og: http://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($display_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($desc); ?>">

    <!-- Open Graph / Facebook / WhatsApp (og:type website guarantees broad mobile preview compatibility) -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="CLICK2IT">
    <meta property="og:url" content="<?php echo htmlspecialchars($target_url); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($display_title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($desc); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($image); ?>">
    <meta property="og:image:secure_url" content="<?php echo htmlspecialchars($image); ?>">
    <meta property="og:image:type" content="<?php echo $image_type; ?>">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="<?php echo htmlspecialchars($title); ?>">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@click2itbd">
    <meta name="twitter:url" content="<?php echo htmlspecialchars($target_url); ?>">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($display_title); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($desc); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($image); ?>">

    <!-- Meta refresh for browsers that bypass 302 -->
    <meta http-equiv="refresh" content="0;url=<?php echo htmlspecialchars($target_url); ?>">
    <script>
        window.location.replace("<?php echo $target_url; ?>");
    </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #1e293b;">
    <div style="text-align: center; padding: 24px; max-width: 480px;">
        <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Redirecting to Product...</h2>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">Please wait while we take you to CLICK2IT.</p>
        <a href="<?php echo htmlspecialchars($target_url); ?>" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">Click here if not redirected</a>
    </div>
</body>
</html>
