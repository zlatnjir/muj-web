<?php
/**
 * Aurel DevStudio — process.php
 * Zpracování kontaktního formuláře
 * 
 * Autoři: Jiří Zlatník & Vilém Orálek
 * 
 * Bezpečnostní opatření:
 * - Sanitizace vstupů
 * - Validace e-mailu
 * - Anti-spam honeypot
 * - Rate limiting (session-based)
 * - AJAX-only ochrana
 * - JSON odpovědi
 */

declare(strict_types=1);

/* ── Hlavičky odpovědi ── */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

/* ── Přijímáme pouze AJAX POST požadavky ── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Nepodporovaná metoda.']);
    exit;
}

if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || 
    strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Neplatný požadavek.']);
    exit;
}

/* ── Session-based rate limiting ── */
session_start();

$now       = time();
$limit     = 3;         // max. odesílání
$timeframe = 3600;      // za 1 hodinu

if (!isset($_SESSION['submissions'])) {
    $_SESSION['submissions'] = [];
}

// Vyfiltrujeme stará odeslání mimo časové okno
$_SESSION['submissions'] = array_filter(
    $_SESSION['submissions'],
    fn($ts) => ($now - $ts) < $timeframe
);

if (count($_SESSION['submissions']) >= $limit) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Příliš mnoho požadavků. Zkuste to znovu za hodinu.'
    ]);
    exit;
}

/* ── Honeypot anti-spam ochrana ── */
// Boti vyplňují skrytá pole, lidé ne
if (!empty($_POST['website'])) {
    // Simulujeme úspěch, ale nic neodešleme
    echo json_encode(['success' => true, 'message' => 'Zpráva odeslána.']);
    exit;
}

/* ── Pomocné funkce ── */

/**
 * Sanitizuje textový vstup
 * Odstraní HTML tagy, escapuje speciální znaky
 */
function sanitizeText(string $input): string {
    $clean = trim($input);
    $clean = strip_tags($clean);
    $clean = htmlspecialchars($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return $clean;
}

/**
 * Validuje e-mailovou adresu
 */
function validateEmail(string $email): bool {
    $filtered = filter_var($email, FILTER_VALIDATE_EMAIL);
    if (!$filtered) return false;
    
    // Dodatečná kontrola — MX záznam domény (optional, může být pomalé)
    // [$local, $domain] = explode('@', $email);
    // return checkdnsrr($domain, 'MX');
    
    return true;
}

/* ── Zpracování vstupů ── */

$errors = [];

// Jméno
$name = sanitizeText($_POST['name'] ?? '');
if (strlen($name) < 2 || strlen($name) > 100) {
    $errors['name'] = 'Jméno musí mít 2–100 znaků.';
}

// E-mail
$email = sanitizeText($_POST['email'] ?? '');
if (!validateEmail($email)) {
    $errors['email'] = 'Neplatná e-mailová adresa.';
}

// Zpráva
$message = sanitizeText($_POST['message'] ?? '');
if (strlen($message) < 10 || strlen($message) > 5000) {
    $errors['message'] = 'Zpráva musí mít 10–5000 znaků.';
}

// Typ projektu (volitelný)
$projectType = sanitizeText($_POST['project_type'] ?? '');
$allowedTypes = ['', 'landing', 'web', 'redesign', 'other'];
if (!in_array($projectType, $allowedTypes, true)) {
    $projectType = 'other';
}

/* ── Vrátíme chyby validace ── */
if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Opravte prosím chyby ve formuláři.',
        'errors'  => $errors
    ]);
    exit;
}

/* ── Sestavení e-mailu ── */

$projectLabels = [
    'landing'  => 'Digitální vizitka (6 000–8 000 Kč)',
    'web'      => 'Klasický web (10 000–15 000 Kč)',
    'redesign' => 'Redesign zastaralého webu',
    'other'    => 'Jiné / Nejsem si jist/a',
    ''         => '— neuvedeno —',
];

$projectLabel = $projectLabels[$projectType] ?? '— neuvedeno —';

$to      = 'info@aureldevstudio.cz'; // ← Změňte na svůj skutečný e-mail
$subject = "Nová poptávka od {$name} — Aurel DevStudio";

// Plaintext verze e-mailu
$emailBody = <<<EOT
Nová poptávka z webu Aurel DevStudio
=====================================

Jméno:          {$name}
E-mail:         {$email}
Typ projektu:   {$projectLabel}

Zpráva:
--------
{$message}

=====================================
Odesláno: {$now}
IP:       {$_SERVER['REMOTE_ADDR']}
EOT;

// HTML verze e-mailu (přehlednější v poštovním klientu)
$emailHtml = <<<HTML
<!DOCTYPE html>
<html lang="cs">
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f5f5f5; margin:0; padding:20px">
  <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    <div style="background:#0a0a0c; padding:24px 32px">
      <h1 style="margin:0; color:#e8e8f0; font-size:1.3rem; letter-spacing:-0.02em">
        <span style="color:#7c6fff">Aurel</span> DevStudio
      </h1>
      <p style="margin:6px 0 0; color:#5a5a72; font-size:0.85rem">Nová poptávka z webu</p>
    </div>
    <div style="padding:32px">
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem">
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0; color:#666; width:140px">Jméno</td>
          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0; font-weight:600">{$name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0; color:#666">E-mail</td>
          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0">
            <a href="mailto:{$email}" style="color:#7c6fff">{$email}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0; color:#666">Typ projektu</td>
          <td style="padding:10px 0; border-bottom:1px solid #f0f0f0">{$projectLabel}</td>
        </tr>
      </table>
      <div style="margin-top:24px">
        <div style="color:#666; font-size:0.85rem; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.06em">Zpráva</div>
        <div style="background:#f9f9f9; border-left:3px solid #7c6fff; padding:16px; border-radius:0 6px 6px 0; line-height:1.7">
          {$message}
        </div>
      </div>
    </div>
    <div style="background:#f9f9f9; padding:16px 32px; border-top:1px solid #eee; font-size:0.75rem; color:#999">
      Odesláno z aureldevstudio.cz
    </div>
  </div>
</body>
</html>
HTML;

/* ── Odeslání e-mailu ── */

// Hlavičky pro multipart e-mail (text + HTML)
$boundary  = md5(uniqid('', true));
$headers   = implode("\r\n", [
    "From: Aurel DevStudio Web <no-reply@aureldevstudio.cz>",
    "Reply-To: {$name} <{$email}>",
    "MIME-Version: 1.0",
    "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
    "X-Mailer: PHP/" . PHP_VERSION,
]);

$emailContent = "--{$boundary}\r\n"
    . "Content-Type: text/plain; charset=utf-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n\r\n"
    . $emailBody . "\r\n"
    . "--{$boundary}\r\n"
    . "Content-Type: text/html; charset=utf-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n\r\n"
    . $emailHtml . "\r\n"
    . "--{$boundary}--";

$sent = mail($to, $subject, $emailContent, $headers);

/* ── Záznam odesílání do session (rate limiting) ── */
if ($sent) {
    $_SESSION['submissions'][] = $now;
}

/* ── Odpověď klientovi ── */
if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Zpráva byla úspěšně odeslána. Ozveme se do 48 hodin.'
    ]);
} else {
    // Fallback — logujeme chybu, ale informujeme uživatele přívětivě
    error_log("Aurel DevStudio: Chyba odeslání e-mailu od {$email}");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Nepodařilo se odeslat zprávu. Zkuste nás prosím kontaktovat přímo na info@aureldevstudio.cz'
    ]);
}