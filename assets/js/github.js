/* 椿日部 · GitHub API 读写（用于在线修改背景图 / 成员资料等）
   Token 仅保存在浏览器 localStorage，由管理员输入。 */
(function(){
  var GH = window.GH = {};

  function encPath(p){ return p.split('/').map(encodeURIComponent).join('/'); }

  function readCookie(name){
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch(e){ return ''; }
  }
  function writeCookie(name, val){
    try { document.cookie = name + '=' + encodeURIComponent(val) + ';max-age=31536000;path=/;SameSite=Lax'; } catch(e){}
  }
  GH.repo = function(){
    try {
      var r = JSON.parse(localStorage.getItem('chunri_repo') || '{}');
      if(r && r.owner && r.name) return {owner:r.owner, name:r.name};
    } catch(e){}
    try {
      var c = JSON.parse(readCookie('chunri_repo') || '{}');
      if(c && c.owner && c.name) return {owner:c.owner, name:c.name};
    } catch(e){}
    return {owner:'', name:''};
  };
  GH.setRepo = function(owner, name){
    var v = JSON.stringify({owner:owner, name:name});
    localStorage.setItem('chunri_repo', v);
    writeCookie('chunri_repo', v);
  };
  GH.token = function(){
    var t = localStorage.getItem('chunri_token');
    if(t) return t;
    return readCookie('chunri_token');
  };
  GH.setToken = function(t){
    if(t){ localStorage.setItem('chunri_token', t); writeCookie('chunri_token', t); }
    else { localStorage.removeItem('chunri_token'); try { document.cookie = 'chunri_token=;max-age=0;path=/'; } catch(e){} }
  };
  GH.ready = function(){ var r = GH.repo(); return !!(r.owner && r.name && GH.token()); };

  GH.api = async function(path, opts){
    opts = opts || {};
    var r = GH.repo();
    var headers = { 'Accept': 'application/vnd.github+json' };
    if(opts.body) headers['Content-Type'] = 'application/json';
    var t = GH.token();
    if(t) headers['Authorization'] = 'Bearer ' + t;
    var apiBase = (location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? location.protocol + '//' + location.host + '/ghapi/' : 'https://api.github.com/';
    var res = await fetch(apiBase + 'repos/' + encodeURIComponent(r.owner) + '/' + encodeURIComponent(r.name) + (path ? '/' + path : ''), Object.assign({}, opts, {headers: headers}));
    if(!res.ok){
      var msg = 'GitHub API ' + res.status;
      try { var j = await res.json(); if(j && j.message) msg = j.message; } catch(e){}
      throw new Error(msg);
    }
    if(res.status === 204) return null;
    return res.json();
  };

  GH.readFile = async function(path){
    var j = await GH.api('contents/' + encPath(path));
    var bin = atob(j.content.replace(/\n/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    var text = new TextDecoder('utf-8').decode(bytes);
    return { content: text, sha: j.sha };
  };

  GH.writeFile = async function(path, content, message){
    var bytes = new TextEncoder().encode(content);
    var bin = '';
    for(var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    var base64 = btoa(bin);
    var sha = null;
    try { sha = (await GH.api('contents/' + encPath(path))).sha; } catch(e){}
    var body = { message: message || '更新 ' + path, content: base64 };
    if(sha) body.sha = sha;
    await GH.api('contents/' + encPath(path), { method: 'PUT', body: JSON.stringify(body) });
  };

  GH.uploadAsset = async function(file, folder, name){
    var base64;
    if(typeof file === 'string'){
      base64 = file.split(',')[1] || file;
    } else {
      base64 = await new Promise(function(res, rej){
        var fr = new FileReader();
        fr.onload = function(){ res(String(fr.result).split(',')[1]); };
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
    }
    var path = folder + '/' + name;
    var sha = null;
    try { sha = (await GH.api('contents/' + encPath(path))).sha; } catch(e){}
    await GH.api('contents/' + encPath(path), {
      method: 'PUT',
      body: JSON.stringify({ message: '上传素材 ' + name, content: base64, sha: sha || undefined })
    });
    return path;
  };

  GH.listDir = async function(folder){
    var j = await GH.api('contents/' + encPath(folder));
    return Array.isArray(j) ? j : [];
  };

  GH.fileName = function(folder){
    var ts = new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
    return folder + '-' + ts + '-' + Math.random().toString(36).slice(2,6);
  };
})();