/* 椿日部 · CloudBase 云开发封装（账号 / 云存储 / 云数据库） */
(function(){
  var ENV = 'chunri-bu-d7gvy3e6naad3ba52';
  var REGION = 'ap-shanghai';
  var CB = window.CB = {};
  var app = null, auth = null;

  function init(){
    if(app) return app;
    if(!window.cloudbase) throw new Error('云开发 SDK 未加载');
    app = cloudbase.init({ env: ENV, region: REGION });
    auth = app.auth();
    return app;
  }
  CB.env = ENV;
  CB.init = init;

  /* ---------- 登录 ---------- */
  CB.getAuth = function(){ init(); return auth; };
  CB.getLoginState = function(){
    try { return CB.getAuth().getLoginState(); } catch(e){ return Promise.resolve(null); }
  };
  CB.currentUser = function(){
    try { return CB.getAuth().currentUser || null; } catch(e){ return null; }
  };
  CB.getUid = function(){ var u = CB.currentUser(); return u ? (u.uid || u.openid || '') : ''; };
  CB.getEmail = function(){ var u = CB.currentUser(); return u ? (u.email || '') : ''; };
  CB.isLoggedIn = function(){ return !!CB.getUid(); };
  CB.ensureAnon = async function(){
    var ls = await CB.getLoginState();
    if(!ls) await CB.getAuth().signInAnonymously();
  };
  CB.signIn = function(email, password){ return CB.getAuth().signIn({ username: email, password: password }); };
  CB.sendEmailCode = function(email){ return CB.getAuth().getVerification({ email: email }); };
  CB.verifyCode = function(verificationId, code){ return CB.getAuth().verify({ verification_id: verificationId, verification_code: code }); };
  CB.signUp = function(opts){ return CB.getAuth().signUp(opts); };
  CB.signOut = async function(){ try { await CB.getAuth().signOut(); } catch(e){} };

  /* ---------- 云存储 ---------- */
  CB.upload = async function(path, file){
    init();
    var r = await app.storage.from().upload(path, file);
    if(r.error) throw new Error(r.error.message || '上传失败');
    return r.data; // { id, path, fullPath }
  };
  CB.fileUrl = async function(fileId){
    if(!fileId) return '';
    if(/^https?:/.test(fileId)) return fileId;
    init();
    try {
      var p = app.storage.from().getPublicUrl(fileId);
      if(p && p.data && p.data.publicUrl) return p.data.publicUrl;
    } catch(e){}
    try {
      var r = await app.storage.from().createSignedUrl(fileId, 7*24*3600);
      if(r && r.data && r.data.signedUrl) return r.data.signedUrl;
    } catch(e){}
    return '';
  };
  CB.fileUrls = async function(fileIds){
    var out = {}, need = [];
    (fileIds || []).forEach(function(id){
      if(!id) return;
      if(/^https?:/.test(id)){ out[id] = id; } else { need.push(id); }
    });
    if(!need.length) return out;
    init();
    try {
      var r = await app.storage.from().createSignedUrls(need, 7*24*3600);
      if(r && r.data){ r.data.forEach(function(it){ if(it && it.path && it.signedUrl) out[it.path] = it.signedUrl; }); }
    } catch(e){}
    for(var i = 0; i < need.length; i++){
      if(out[need[i]]) continue;
      try {
        var p = app.storage.from().getPublicUrl(need[i]);
        if(p && p.data && p.data.publicUrl) out[need[i]] = p.data.publicUrl;
      } catch(e){}
    }
    return out;
  };
  CB.delFile = async function(fileId){
    if(!fileId || /^https?:/.test(fileId)) return;
    init();
    var r = await app.storage.from().remove([fileId]);
    if(r.error) throw new Error(r.error.message || '删除文件失败');
  };

  /* ---------- 云数据库 ---------- */
  CB.coll = function(name){ init(); return app.database().collection(name); };
  CB.listProfiles = async function(){
    var res = await CB.coll('profiles').limit(100).get();
    return res && res.data ? res.data : [];
  };
  CB.listAlbums = async function(){
    var res = await CB.coll('albums').limit(100).get();
    return res && res.data ? res.data : [];
  };
  CB.upsertDoc = async function(name, docId, data){
    if(docId){
      await CB.coll(name).doc(docId).update(data);
      return docId;
    }
    var r = await CB.coll(name).add(data);
    return (r && (r._id || r.id || (r.data && r.data._id))) || '';
  };
  CB.removeDoc = async function(name, docId){
    await CB.coll(name).doc(docId).remove();
  };
})();