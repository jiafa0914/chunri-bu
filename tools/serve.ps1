param([int]$Port = 8080, [string]$Root = (Split-Path $PSScriptRoot -Parent))
$Root = [System.IO.Path]::GetFullPath($Root)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Serving $Root at http://localhost:$Port/ (ghapi proxy enabled)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    $rel = $req.Url.AbsolutePath.TrimStart('/')

    # ---------- GitHub API 代理 ----------
    if ($rel -eq 'ghapi' -or $rel -like 'ghapi/*') {
      $apiPath = if ($rel -eq 'ghapi') { '' } else { $rel.Substring(6) }
      $apiUrl = 'https://api.github.com/' + $apiPath
      if ($req.Url.Query) { $apiUrl += $req.Url.Query }
      $target = [System.Net.HttpWebRequest]::Create($apiUrl)
      $target.UserAgent = "ChunriSiteProxy/1.0 (local relay)"
      $target.Method = $req.HttpMethod
      $target.AutomaticDecompression = [System.Net.DecompressionMethods]::GZip -bor [System.Net.DecompressionMethods]::Deflate
      $auth = $req.Headers['Authorization']
      if ($auth) { $target.Headers['Authorization'] = $auth }
      if ($req.HttpMethod -in @('POST','PUT','PATCH','DELETE')) {
        $ms = New-Object System.IO.MemoryStream
        $req.InputStream.CopyTo($ms)
        if ($ms.Length -gt 0) {
          $target.ContentLength = $ms.Length
          $rs = $target.GetRequestStream()
          $ms.Position = 0
          $ms.CopyTo($rs)
          $rs.Close()
        }
      }
      $resp = $null
      try { $resp = $target.GetResponse() }
      catch [System.Net.WebException] { $resp = $_.Exception.Response }
      if ($resp) {
        $res.StatusCode = [int]$resp.StatusCode
        if ($resp.ContentType) { $res.ContentType = $resp.ContentType }
        $rs2 = $resp.GetResponseStream()
        $out = New-Object System.IO.MemoryStream
        $rs2.CopyTo($out)
        $res.ContentLength64 = $out.Length
        $out.Position = 0
        $out.CopyTo($res.OutputStream)
        $resp.Close()
      } else {
        $res.StatusCode = 502
        $b = [System.Text.Encoding]::UTF8.GetBytes('proxy error')
        $res.OutputStream.Write($b, 0, $b.Length)
      }
      $res.Close()
      continue
    }

    # ---------- 静态文件 ----------
    if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }
    $path = [System.IO.Path]::GetFullPath((Join-Path $Root ($rel -replace '/', '\')))
    if (-not $path.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403; $res.Close(); continue
    }
    if (Test-Path -LiteralPath $path) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $mime = switch ($ext) {
        '.html' { 'text/html; charset=utf-8' }
        '.css'  { 'text/css; charset=utf-8' }
        '.js'   { 'application/javascript; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.svg'  { 'image/svg+xml' }
        '.png'  { 'image/png' }
        '.jpg'  { 'image/jpeg' }
        '.jpeg' { 'image/jpeg' }
        '.webp' { 'image/webp' }
        '.mp3'  { 'audio/mpeg' }
        '.ico'  { 'image/x-icon' }
        default { 'application/octet-stream' }
      }
      $res.ContentType = $mime
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
      $res.OutputStream.Write($body, 0, $body.Length)
    }
    $res.Close()
  }
} finally {
  $listener.Stop()
}