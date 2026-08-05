param([string]$Root,[string]$Owner,[string]$Repo,[string]$Token)
$ErrorActionPreference = 'Stop'
$headers = @{ Authorization = "Bearer $Token"; Accept = 'application/vnd.github+json' }
$base = "https://api.github.com/repos/$Owner/$Repo"

$repoInfo = Invoke-RestMethod -Uri "$base" -Headers $headers -TimeoutSec 60
$db = $repoInfo.default_branch
Write-Output ("default branch: " + $db)

$readmeContent = "# Chunri-bu`n`nChunri-bu guild website for YanYunShiLiuSheng.`n"
$b64readme = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($readmeContent))
$putBody = '{"message":"init","content":"' + $b64readme + '"}'
$init = Invoke-RestMethod -Method Put -Uri "$base/contents/README.md" -Headers $headers -Body $putBody -ContentType 'application/json' -TimeoutSec 60
$initCommitSha = $init.commit.sha
Write-Output ("initial commit: " + $initCommitSha)

$files = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.git(\\|$)' }
Write-Output ("files: " + $files.Count)
$tree = @()
foreach ($f in $files) {
  $rel = ($f.FullName.Substring($Root.Length)).TrimStart('\','/') -replace '\\','/'
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($f.FullName))
  $blobBody = '{"content":"' + $b64 + '","encoding":"base64"}'
  $blob = Invoke-RestMethod -Method Post -Uri "$base/git/blobs" -Headers $headers -Body $blobBody -ContentType 'application/json' -TimeoutSec 60
  $tree += @{ path = $rel; mode = '100644'; type = 'blob'; sha = $blob.sha }
  Write-Output ("blob OK: " + $rel)
}

$treeJson = @{ tree = $tree } | ConvertTo-Json -Depth 6
$newTree = Invoke-RestMethod -Method Post -Uri "$base/git/trees" -Headers $headers -Body $treeJson -ContentType 'application/json' -TimeoutSec 60
Write-Output ("tree: " + $newTree.sha)

$commitBody = '{"message":"deploy: chunri-bu website","tree":"' + $newTree.sha + '","parents":["' + $initCommitSha + '"]}'
$commit = Invoke-RestMethod -Method Post -Uri "$base/git/commits" -Headers $headers -Body $commitBody -ContentType 'application/json' -TimeoutSec 60
Write-Output ("commit: " + $commit.sha)

$refBody = '{"sha":"' + $commit.sha + '","force":true}'
Invoke-RestMethod -Method Patch -Uri "$base/git/refs/heads/$db" -Headers $headers -Body $refBody -ContentType 'application/json' -TimeoutSec 60 | Out-Null
Write-Output ("ref updated on " + $db)

if ($db -ne 'main') {
  Invoke-RestMethod -Method Patch -Uri "$base" -Headers $headers -Body '{"default_branch":"main"}' -ContentType 'application/json' -TimeoutSec 60 | Out-Null
  $refCreate = '{"ref":"refs/heads/main","sha":"' + $commit.sha + '"}'
  try { Invoke-RestMethod -Method Post -Uri "$base/git/refs" -Headers $headers -Body $refCreate -ContentType 'application/json' -TimeoutSec 60 | Out-Null; Write-Output "main ref created" }
  catch { Write-Output "main ref may already exist" }
}
Write-Output "DONE"