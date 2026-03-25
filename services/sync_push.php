<?php
// sync_push.php
require_once __DIR__ . '/db.php';
$raw = file_get_contents('php://input');
$data = json_decode($raw,true);
if (!$data || !isset($data['changes'])) { echo json_encode(['ok'=>false,'message'=>'Invalid']); exit; }

$applied = [];
foreach ($data['changes'] as $chg) {
    // struktur minimal: { type: 'journal', action:'create', payload: {...}, client_id: 'tmp-1' }
    if ($chg['type'] === 'journal' && $chg['action'] === 'create') {
        $p = $chg['payload'];
        // reuse create_journal logic (minimal)
        $stmt = $pdo->prepare("INSERT INTO journals (title, abstract, file_upload_id, cover_upload_id, authors, tags, client_temp_id, client_updated_at) VALUES (?,?,?,?,?,?,?,?)");
        $file_upload_id = null; $cover_upload_id = null;
        if (!empty($p['fileUrl'])) {
            $s = $pdo->prepare("SELECT id FROM uploads WHERE url = ? LIMIT 1"); $s->execute([$p['fileUrl']]); $r=$s->fetch(); if ($r) $file_upload_id=$r['id'];
        }
        if (!empty($p['coverUrl'])) {
            $s = $pdo->prepare("SELECT id FROM uploads WHERE url = ? LIMIT 1"); $s->execute([$p['coverUrl']]); $r=$s->fetch(); if ($r) $cover_upload_id=$r['id'];
        }
        $authors = isset($p['authors']) ? json_encode($p['authors']) : null;
        $tags = isset($p['tags']) ? json_encode($p['tags']) : null;
        $stmt->execute([$p['title'] ?? '', $p['abstract'] ?? null, $file_upload_id, $cover_upload_id, $authors, $tags, $chg['client_id'] ?? null, $p['client_updated_at'] ?? null]);
        $server_id = $pdo->lastInsertId();
        $applied[] = ['client_id'=>$chg['client_id'] ?? null, 'status'=>'ok','server_id'=>$server_id];
    } else {
        $applied[] = ['client_id'=>$chg['client_id'] ?? null, 'status'=>'unsupported'];
    }
}
echo json_encode(['ok'=>true,'applied'=>$applied]);
