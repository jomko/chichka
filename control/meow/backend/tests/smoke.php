<?php
declare(strict_types=1);
// Static smoke check. Integration tests need local MariaDB and OAuth test credentials.
$files = [__DIR__.'/../src/App.php', __DIR__.'/../migrations/001_initial.sql'];
foreach ($files as $file) { if (!is_file($file)) { fwrite(STDERR, "Missing $file\n"); exit(1); } }
echo "MEOW API scaffold files OK\n";
