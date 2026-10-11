<?php
// Smart OpenGraph / Social Media Link Preview Generator for React SPA
$product_id = $_GET['id'] ?? '';
$title = $_GET['title'] ?? 'Click Computers - IT Store';
$price = $_GET['price'] ?? '';
$image = $_GET['img'] ?? 'https://click2itbd.com/logo.png';
$desc = $_GET['desc'] ?? 'Best Price Computer, CCTV, Components & IT Solutions in Bangladesh.';

$display_title = $title;
if ($price) {
    $display_title .= ' - BDT ' . number_format((float)$price);
}

$target_url = "https://" . $_SERVER['HTTP_HOST'] . "/product/" . urlencode($product_id);

// Detect if request is from a human browser (not a social media crawler)
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$is_crawler = preg_match('/(facebookexternalhit|Facebot|WhatsApp|Twitterbot|Pinterest|LinkedInBot|TelegramBot|Slackbot|Discordbot)/i', $user_agent);

if (!$is_crawler && $product_id) {
    // Human visitor: instantly redirect to the actual React single page application product page
    header("Location: " . $target_url, true, 302);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo htmlspecialchars($display_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($desc); ?>">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="Click Computers">
    <meta property="og:url" content="<?php echo htmlspecialchars($target_url); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($display_title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($desc); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($image); ?>">
    <meta property="og:image:secure_url" content="<?php echo htmlspecialchars($image); ?>">
    <meta property="og:image:alt" content="<?php echo htmlspecialchars($title); ?>">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@ClickComputers">
    <meta name="twitter:url" content="<?php echo htmlspecialchars($target_url); ?>">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($display_title); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($desc); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($image); ?>">

    <!-- Fallback instant redirect for non-crawlers -->
    <script>
        window.location.replace("<?php echo $target_url; ?>");
    </script>
</head>
<body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
    <div style="text-align: center; padding: 20px;">
        <h2>Loading Product...</h2>
        <p><a href="<?php echo $target_url; ?>">Click here if you are not redirected</a></p>
    </div>
</body>
</html>
