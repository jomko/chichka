<?php
declare(strict_types=1);
// DEPLOY TEMPLATE. Place this file at the actual public docroot's /api/index.php.
// Keep Composer vendor, PHP sources, and .env in the NON-public meow-private dir.
$private = '/home/jomko/meow-private';
require $private . '/vendor/autoload.php';
\Dotenv\Dotenv::createImmutable($private)->safeLoad();
\Meow\App::run();
