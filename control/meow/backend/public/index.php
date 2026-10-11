<?php
declare(strict_types=1);
require dirname(__DIR__) . '/vendor/autoload.php';
use Dotenv\Dotenv;
use Meow\App;
Dotenv::createImmutable(dirname(__DIR__))->safeLoad();
App::run();
