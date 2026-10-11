<?php
declare(strict_types=1);
namespace Meow;

use Google\Client as GoogleClient;
use PDO;
use Slim\Factory\AppFactory;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class App
{
    public static function run(): void
    {
        $production = (($_ENV['APP_ENV'] ?? '') === 'production');
        $url = rtrim($_ENV['APP_BASE_URL'] ?? '', '/');
        if (!$url || ($production && !str_starts_with($url, 'https://'))) {
            http_response_code(503);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'CONFIGURATION_INVALID']);
            return;
        }
        session_name('MEOWSESSID');
        session_set_cookie_params([
            'lifetime' => 0, 'path' => '/', 'secure' => $production,
            'httponly' => true, 'samesite' => 'Lax',
        ]);
        ini_set('session.use_strict_mode', '1');
        session_start();
        header('Cache-Control: no-store, private');

        $app = AppFactory::create();
        $app->addBodyParsingMiddleware();
        $app->addRoutingMiddleware();
        $app->addErrorMiddleware(!$production, true, true);

        $json = static function (Response $res, array $body, int $status = 200): Response {
            $res->getBody()->write(json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            return $res->withStatus($status)->withHeader('Content-Type', 'application/json; charset=utf-8');
        };
        $allowed = static function (): array {
            $emails = array_values(array_unique(array_filter(array_map(
                static fn($s) => strtolower(trim($s)),
                explode(',', $_ENV['ALLOWED_GOOGLE_EMAILS'] ?? '')
            ))));
            // Fail closed if two explicit addresses are not configured.
            return count($emails) === 2 && $emails[0] !== $emails[1] ? $emails : [];
        };
        $google = static function () use ($url): GoogleClient {
            if (empty($_ENV['GOOGLE_CLIENT_ID']) || empty($_ENV['GOOGLE_CLIENT_SECRET'])) {
                throw new \RuntimeException('Google sign-in is not configured');
            }
            $client = new GoogleClient();
            $client->setClientId($_ENV['GOOGLE_CLIENT_ID']);
            $client->setClientSecret($_ENV['GOOGLE_CLIENT_SECRET']);
            $client->setRedirectUri($url . '/api/auth/callback');
            $client->setScopes(['openid', 'email', 'profile']);
            $client->setAccessType('online');
            return $client;
        };
        $auth = static function () use ($allowed): ?array {
            $u = $_SESSION['user'] ?? null;
            if (!is_array($u) || !isset($u['email'], $u['sub'])) return null;
            return in_array(strtolower($u['email']), $allowed(), true) ? $u : null;
        };
        $csrf = static function (): string {
            if (!isset($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
            return $_SESSION['csrf'];
        };
        $guard = static function (Request $req, Response $res, callable $callback) use ($auth, $csrf, $json): Response {
            $user = $auth();
            if (!$user) return $json($res, ['error' => 'UNAUTHORIZED'], 401);
            if (!in_array($req->getMethod(), ['GET','HEAD'], true)) {
                $sent = $req->getHeaderLine('X-CSRF-Token');
                if (!$sent || !hash_equals($csrf(), $sent)) return $json($res, ['error'=>'CSRF_INVALID'], 403);
            }
            return $callback($user);
        };

        $app->get('/api/health', fn(Request $req, Response $res) => $json($res, ['status'=>'ok']));
        $app->get('/api/auth/login', function (Request $req, Response $res) use ($allowed, $google, $json): Response {
            if (!$allowed()) return $json($res, ['error'=>'ALLOWLIST_NOT_CONFIGURED'], 503);
            try {
                $state = bin2hex(random_bytes(32));
                $nonce = bin2hex(random_bytes(32));
                $_SESSION['oauth_state'] = $state;
                $_SESSION['oauth_nonce'] = $nonce;
                $_SESSION['oauth_started'] = time();
                $client = $google();
                $client->setState($state);
                $authUrl = $client->createAuthUrl();
                $authUrl .= (str_contains($authUrl, '?') ? '&' : '?') . http_build_query(['nonce'=>$nonce]);
                return $res->withHeader('Location', $authUrl)->withStatus(302);
            } catch (Throwable $e) { return $json($res, ['error'=>'AUTH_UNAVAILABLE'], 503); }
        });
        $app->get('/api/auth/callback', function (Request $req, Response $res) use ($allowed, $google, $json, $url): Response {
            $q = $req->getQueryParams();
            $state = $_SESSION['oauth_state'] ?? '';
            $nonce = $_SESSION['oauth_nonce'] ?? '';
            $started = $_SESSION['oauth_started'] ?? 0;
            unset($_SESSION['oauth_state'], $_SESSION['oauth_nonce'], $_SESSION['oauth_started']);
            if (empty($q['code']) || !is_string($q['code']) ||
                empty($q['state']) || !is_string($q['state']) || !$state ||
                !hash_equals($state, $q['state']) || !$nonce || (time() - (int)$started > 600)) {
                return $json($res, ['error'=>'INVALID_OAUTH_CALLBACK'], 403);
            }
            try {
                $client = $google();
                $token = $client->fetchAccessTokenWithAuthCode($q['code']);
                if (!empty($token['error']) || empty($token['id_token'])) throw new \RuntimeException('Invalid token');
                $claims = $client->verifyIdToken($token['id_token']);
                if (!is_array($claims) || ($claims['nonce'] ?? '') !== $nonce ||
                    !in_array($claims['iss'] ?? '', ['https://accounts.google.com','accounts.google.com'], true) ||
                    empty($claims['sub']) || ($claims['email_verified'] ?? false) !== true) {
                    throw new \RuntimeException('Invalid identity');
                }
                $email = strtolower(trim((string)($claims['email'] ?? '')));
                if (!in_array($email, $allowed(), true)) return $json($res, ['error'=>'ACCESS_DENIED'], 403);
                session_regenerate_id(true);
                $_SESSION['user'] = [
                    'sub' => (string)$claims['sub'], 'email' => $email,
                    'name' => (string)($claims['name'] ?? $email),
                ];
                $_SESSION['csrf'] = bin2hex(random_bytes(32));
                return $res->withHeader('Location', $url . '/')->withStatus(302);
            } catch (Throwable $e) {
                unset($_SESSION['user']);
                return $json($res, ['error'=>'SIGN_IN_FAILED'], 403);
            }
        });
        $app->get('/api/auth/me', fn(Request $req, Response $res) =>
            $guard($req, $res, fn(array $user) => $json($res, ['user'=>$user,'csrf'=>$csrf()])));
        $app->post('/api/auth/logout', fn(Request $req, Response $res) =>
            $guard($req, $res, function () use ($res, $json): Response {
                $_SESSION = [];
                session_regenerate_id(true);
                return $json($res, ['ok'=>true]);
            }));

        $db = static function (): PDO {
            $pdo = new PDO(
                sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                    $_ENV['DB_HOST'] ?? '127.0.0.1', $_ENV['DB_PORT'] ?? '3306', $_ENV['DB_NAME'] ?? ''),
                $_ENV['DB_USER'] ?? '', $_ENV['DB_PASSWORD'] ?? '',
                [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES=>false]
            );
            return $pdo;
        };
        // Separate owner scopes: both emails can sign in; only the owner of a
        // record can access it. No other Google account may list private data.
        $app->get('/api/projects', fn(Request $req, Response $res) =>
            $guard($req, $res, function (array $user) use ($res, $json, $db): Response {
                $stmt = $db()->prepare('SELECT id, title, description, status, created_at FROM projects WHERE owner_sub = ? ORDER BY created_at DESC');
                $stmt->execute([$user['sub']]);
                return $json($res, ['data'=>$stmt->fetchAll()]);
            }));
        $app->post('/api/projects', fn(Request $req, Response $res) =>
            $guard($req, $res, function (array $user) use ($req, $res, $json, $db): Response {
                $input = (array)($req->getParsedBody() ?? []);
                $title = trim((string)($input['title'] ?? ''));
                if ($title === '' || mb_strlen($title) > 180) return $json($res, ['error'=>'INVALID_TITLE'], 422);
                $pdo = $db();
                $stmt = $pdo->prepare('INSERT INTO projects (owner_sub, title, description, status) VALUES (?, ?, ?, ?)');
                $stmt->execute([$user['sub'], $title, '', 'active']);
                return $json($res, ['id'=>(int)$pdo->lastInsertId()], 201);
            }));
        $app->get('/api/tasks', fn(Request $req, Response $res) =>
            $guard($req, $res, function (array $user) use ($res, $json, $db): Response {
                $stmt = $db()->prepare('SELECT t.id, t.project_id, t.title, t.status, t.priority, t.due_at, p.title AS project_title FROM tasks t JOIN projects p ON p.id=t.project_id AND p.owner_sub=t.owner_sub WHERE t.owner_sub=? ORDER BY t.due_at IS NULL, t.due_at, t.id DESC');
                $stmt->execute([$user['sub']]);
                return $json($res, ['data'=>$stmt->fetchAll()]);
            }));
        $app->post('/api/tasks', fn(Request $req, Response $res) =>
            $guard($req, $res, function (array $user) use ($req, $res, $json, $db): Response {
                $in = (array)($req->getParsedBody() ?? []);
                $title = trim((string)($in['title'] ?? ''));
                $projectId = filter_var($in['project_id'] ?? null, FILTER_VALIDATE_INT);
                if (!$projectId || $title==='' || mb_strlen($title)>180) return $json($res, ['error'=>'INVALID_TASK'],422);
                $pdo=$db();
                $check=$pdo->prepare('SELECT id FROM projects WHERE id=? AND owner_sub=?');
                $check->execute([$projectId,$user['sub']]);
                if (!$check->fetch()) return $json($res,['error'=>'PROJECT_NOT_FOUND'],404);
                $stmt=$pdo->prepare("INSERT INTO tasks (owner_sub,project_id,title,status,priority) VALUES (?,?,?,'open','normal')");
                $stmt->execute([$user['sub'],$projectId,$title]);
                return $json($res,['id'=>(int)$pdo->lastInsertId()],201);
            }));
        $app->patch('/api/tasks/{id}', fn(Request $req, Response $res, array $args) =>
            $guard($req, $res, function (array $user) use ($req, $res, $args, $json, $db): Response {
                $payload = $req->getParsedBody();
                $status = is_array($payload) ? (string)($payload['status'] ?? '') : '';
                if (!in_array($status,['open','done'],true)) return $json($res,['error'=>'INVALID_STATUS'],422);
                $stmt=$db()->prepare('UPDATE tasks SET status=? WHERE id=? AND owner_sub=?');
                $stmt->execute([$status,$args['id'],$user['sub']]);
                return $stmt->rowCount() ? $json($res,['ok'=>true]) : $json($res,['error'=>'NOT_FOUND'],404);
            }));
        $app->get('/api/exports/tasks', fn(Request $req, Response $res) =>
            $guard($req, $res, function (array $user) use ($req,$res,$db): Response {
                $ids = array_map('intval', array_filter(explode(',',(string)($req->getQueryParams()['ids'] ?? '')), 'ctype_digit'));
                $ids = array_slice(array_values(array_unique(array_filter($ids, fn($id)=>$id>0))), 0, 40);
                if (!$ids) return $res->withStatus(400);
                $marks=implode(',',array_fill(0,count($ids),'?'));
                $stmt=$db()->prepare("SELECT t.title,t.due_at,t.priority,p.title AS project FROM tasks t JOIN projects p ON p.id=t.project_id AND p.owner_sub=t.owner_sub WHERE t.owner_sub=? AND t.id IN ($marks)");
                $stmt->execute(array_merge([$user['sub']],$ids));
                $body="# Assignment brief\n\n";
                foreach ($stmt->fetchAll() as $row) {
                    $body.="## ".str_replace(["\r","\n"],' ', $row['title'])."\n";
                    $body.="Project: ".str_replace(["\r","\n"],' ', $row['project'])."\n";
                    $body.="Priority: ".$row['priority']."\n";
                    $body.="Due: ".($row['due_at'] ?? 'Not set')."\n\n";
                }
                $res->getBody()->write($body);
                return $res->withHeader('Content-Type','text/markdown; charset=utf-8')
                    ->withHeader('Content-Disposition','attachment; filename="meow-brief.md"');
            }));
        $app->run();
    }
}
