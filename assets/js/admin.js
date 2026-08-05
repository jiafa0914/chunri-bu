/* 椿日部 · 社主管理面板 */
(function(){
  var C = window.C, GH = window.GH;
  function $(id){ return document.getElementById(id); }

  var cfg = null, members = null, activities = null, guides = null, daily = null, albums = null;
  var annEdit = -1, aboutEdit = -1, memEdit = -1, actEdit = -1, guideEdit = -1, dailyEdit = -1, albumEdit = -1;

  function loadAll(){
    var useApi = GH.ready();
    function getJson(path){
      if(useApi) return GH.readFile(path).then(function(r){ return JSON.parse(r.content); });
      return C.fetchJSON(path);
    }
    return Promise.all([
      getJson('config.json').then(function(d){ cfg = d; }),
      getJson('members.json').then(function(d){ members = d; }),
      getJson('activities.json').then(function(d){ activities = d; }),
      getJson('guides.json').then(function(d){ guides = d; }),
      getJson('daily.json').then(function(d){ daily = d; }),
      getJson('albums.json').then(function(d){ albums = d; })
    ]);
  }

  /* ================= 导航 ================= */
  function bindNav(){
    var nav = $('admin-nav');
    nav.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click', function(){
        nav.querySelectorAll('button').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.admin-panel').forEach(function(p){ p.classList.remove('active'); });
        $(btn.dataset.panel).classList.add('active');
      });
    });
  }

  /* ================= 连接 ================= */
  var DEF_OWNER = 'jiafa0914', DEF_REPO = 'chunri-bu';
  function fillConn(){
    var r = GH.repo();
    $('conn-owner').value = r.owner || DEF_OWNER;
    $('conn-repo').value = r.name || DEF_REPO;
    $('conn-token').value = GH.token() || '';
  }
  async function saveConn(){
    var owner = $('conn-owner').value.trim();
    var name = $('conn-repo').value.trim();
    var token = $('conn-token').value.trim();
    if(!owner || !name || !token){ C.toast('请填写 Owner、仓库名和 Token', 'err'); return; }
    GH.setRepo(owner, name);
    GH.setToken(token);
    try {
      var info = await GH.api('');
      C.toast('已连接 ' + info.full_name, 'ok');
      await loadAll(); renderAll();
    } catch(e){ C.toast('连接失败：' + e.message, 'err'); }
  }
  async function refreshData(){
    if(!GH.ready()){ C.toast('请先保存并连接 GitHub', 'err'); return; }
    try { await loadAll(); renderAll(); C.toast('已从仓库刷新', 'ok'); }
    catch(e){ C.toast('刷新失败：' + e.message, 'err'); }
  }

  /* ================= 背景图 ================= */
  function renderBg(){
    var url = cfg && cfg.site && cfg.site.background ? cfg.site.background : 'assets/img/bg/hero-default.svg';
    $('bg-preview').src = url;
    $('bg-label').textContent = (cfg && cfg.site && cfg.site.backgroundLabel) ? cfg.site.backgroundLabel : '';
  }
  async function uploadBg(){
    var f = $('bg-file').files[0];
    if(!f){ C.toast('请先选择图片', 'err'); return; }
    C.toast('正在压缩上传…');
    try {
      var blob = await C.compressImage(f, 1920, 0.85);
      var path = await GH.uploadAsset(blob, 'assets/img/bg', GH.fileName('bg') + '.jpg');
      cfg.site.background = path;
      cfg.site.backgroundLabel = '自定义背景 · ' + f.name;
      await saveConfigFile('更新背景图');
      renderBg(); listBg();
      C.toast('背景图已更新', 'ok');
    } catch(e){ C.toast('上传失败：' + e.message, 'err'); }
  }
  async function listBg(){
    var box = $('bg-list');
    box.innerHTML = '<p class="hint" style="margin:6px 0">已上传的背景图：</p>';
    try {
      var items = await GH.listDir('assets/img/bg');
      items.forEach(function(it){
        if(it.type !== 'file') return;
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;margin:6px 0';
        row.innerHTML =
          '<img src="assets/img/bg/' + encodeURIComponent(it.name) + '" style="width:64px;height:42px;object-fit:cover;border:1px solid var(--line);border-radius:4px">' +
          '<span style="font-size:13px;flex:1">' + C.esc(it.name) + '</span>' +
          '<button class="btn btn-paper btn-sm" data-bg="assets/img/bg/' + encodeURIComponent(it.name) + '">使用</button>';
        row.querySelector('button').addEventListener('click', function(){
          cfg.site.background = 'assets/img/bg/' + it.name;
          cfg.site.backgroundLabel = '背景图 · ' + it.name;
          saveConfigFile('切换背景图为 ' + it.name).then(function(){ renderBg(); C.toast('已切换背景', 'ok'); });
        });
        box.appendChild(row);
      });
    } catch(e){ box.innerHTML = '<p class="hint">读取背景列表失败（需已连接）</p>'; }
  }

  /* ================= 站点设置 ================= */
  function renderSettings(){
    var s = cfg.site;
    $('set-name').value = s.name || '';
    $('set-subtitle').value = s.subtitle || '';
    $('set-type').value = s.type || '';
    $('set-level').value = s.level || '';
    $('set-server').value = s.server || '';
    $('set-guildid').value = s.guildId || '';
    $('set-slogan').value = s.slogan || '';
    $('set-founded').value = s.founded || '';
    $('set-footer').value = s.footer || '';
    $('set-bgm').value = s.bgm || '';
    $('set-qq').value = (s.contact && s.contact.qq) || '';
    $('set-wechat').value = (s.contact && s.contact.wechat) || '';
    $('set-gameid').value = (s.contact && s.contact.gameId) || '';
  }
  function saveSettings(){
    var s = cfg.site;
    s.name = $('set-name').value.trim();
    s.subtitle = $('set-subtitle').value.trim();
    s.type = $('set-type').value.trim();
    s.level = $('set-level').value.trim();
    s.server = $('set-server').value.trim();
    s.guildId = $('set-guildid').value.trim();
    s.slogan = $('set-slogan').value.trim();
    s.founded = $('set-founded').value.trim();
    s.footer = $('set-footer').value.trim();
    s.bgm = $('set-bgm').value.trim();
    s.contact = s.contact || {};
    s.contact.qq = $('set-qq').value.trim();
    s.contact.wechat = $('set-wechat').value.trim();
    s.contact.gameId = $('set-gameid').value.trim();
    saveConfigFile('更新站点设置');
  }

  /* ================= 公告 ================= */
  function renderAnn(){
    var box = $('ann-list');
    if(!cfg.announcements || !cfg.announcements.length){ box.innerHTML = '<p class="hint">暂无公告</p>'; return; }
    box.innerHTML = cfg.announcements.map(function(a, i){
      return '<div class="item-row"><div class="row-top">' +
        '<div><b>' + C.esc(a.title) + '</b> <span class="hint">' + C.esc(a.date) + '</span></div>' +
        '<div class="row-actions"><button class="btn btn-paper btn-sm" data-e="' + i + '">编辑</button>' +
        '<button class="btn btn-danger btn-sm" data-d="' + i + '">删除</button></div></div>' +
        '<p style="font-size:13.5px;color:var(--ink-2);margin-top:6px">' + C.esc(a.content) + '</p></div>';
    }).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editAnn(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delAnn(+b.dataset.d); }); });
  }
  function editAnn(i){
    annEdit = i;
    var a = cfg.announcements[i];
    $('ann-date').value = a.date || '';
    $('ann-title').value = a.title || '';
    $('ann-content').value = a.content || '';
    $('ann-form-title').textContent = '编辑公告';
    $('ann-cancel').classList.remove('hidden');
  }
  function resetAnnForm(){
    annEdit = -1;
    $('ann-date').value = ''; $('ann-title').value = ''; $('ann-content').value = '';
    $('ann-form-title').textContent = '新增公告';
    $('ann-cancel').classList.add('hidden');
  }
  function saveAnn(){
    cfg.announcements = cfg.announcements || [];
    var item = { date: $('ann-date').value.trim() || new Date().toISOString().slice(0,10), title: $('ann-title').value.trim(), content: $('ann-content').value.trim() };
    if(!item.title){ C.toast('请填写标题', 'err'); return; }
    if(annEdit >= 0) cfg.announcements[annEdit] = item; else cfg.announcements.unshift(item);
    saveConfigFile('更新公告').then(function(){ renderAnn(); resetAnnForm(); });
  }
  function delAnn(i){ cfg.announcements.splice(i,1); saveConfigFile('删除公告').then(renderAnn); }

  /* ================= 关于 ================= */
  function renderAbout(){
    var box = $('about-list');
    if(!cfg.about || !cfg.about.length){ box.innerHTML = '<p class="hint">暂无内容</p>'; return; }
    box.innerHTML = cfg.about.map(function(a, i){
      return '<div class="item-row"><div class="row-top">' +
        '<b>' + C.esc(a.title) + '</b>' +
        '<div class="row-actions"><button class="btn btn-paper btn-sm" data-e="' + i + '">编辑</button>' +
        '<button class="btn btn-danger btn-sm" data-d="' + i + '">删除</button></div></div>' +
        '<p style="font-size:13.5px;color:var(--ink-2);margin-top:6px">' + C.esc(a.content) + '</p></div>';
    }).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editAbout(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delAbout(+b.dataset.d); }); });
  }
  function editAbout(i){ aboutEdit = i; var a = cfg.about[i]; $('ab-title').value = a.title; $('ab-content').value = a.content; $('ab-cancel').classList.remove('hidden'); }
  function resetAboutForm(){ aboutEdit = -1; $('ab-title').value=''; $('ab-content').value=''; $('ab-cancel').classList.add('hidden'); }
  function saveAbout(){
    cfg.about = cfg.about || [];
    var item = { title: $('ab-title').value.trim(), content: $('ab-content').value.trim() };
    if(!item.title){ C.toast('请填写小标题', 'err'); return; }
    if(aboutEdit >= 0) cfg.about[aboutEdit] = item; else cfg.about.push(item);
    saveConfigFile('更新关于页').then(function(){ renderAbout(); resetAboutForm(); });
  }
  function delAbout(i){ cfg.about.splice(i,1); saveConfigFile('删除关于内容').then(renderAbout); }

  /* ================= 成员（云数据库） ================= */
  var profiles = [];
  function memberCardHtml(m, idx){
    var photo = m._photoUrl ? '<img src="' + C.esc(m._photoUrl) + '" alt="">' : '<div class="ph-placeholder">' + C.esc((m.name||'?').slice(0,1)) + '</div>';
    return '<div class="item-row"><div class="row-top">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<span style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:1px solid var(--line);display:inline-block;background:var(--paper-2)">' + photo + '</span>' +
      '<div><b>' + C.esc(m.name) + '</b> <span class="badge" style="margin-left:6px">' + C.esc(m.role||'') + '</span>' +
      (m.active === false ? ' <span class="badge badge-dai">暂离</span>' : '') + '</div></div>' +
      '<div class="row-actions">' +
      '<button class="btn btn-paper btn-sm" data-e="' + idx + '">编辑</button>' +
      '<button class="btn btn-danger btn-sm" data-d="' + idx + '">删除</button></div></div>' +
      '<p class="hint" style="margin-top:6px">' + (m.email ? C.esc(m.email) + ' · ' : '') + '签名：' + C.esc(m.signature||'—') + '</p></div>';
  }
  async function loadProfiles(){
    profiles = [];
    try {
      var docs = await CB.listProfiles();
      profiles = docs || [];
      var need = [];
      profiles.forEach(function(p){ if(p.photo) need.push(p.photo); });
      var urls = {};
      try { urls = await CB.fileUrls(need); } catch(e){}
      profiles.forEach(function(p){ p._photoUrl = p.photo ? (urls[p.photo] || '') : ''; });
    } catch(e){ profiles = []; }
  }
  async function renderMembers(){
    var box = $('member-list');
    var hint = $('mem-cloud-hint');
    if(!CB.isLoggedIn()){
      box.innerHTML = '<p class="hint">请先在「① 云账号」标签登录，才能管理成员。</p>';
      if(hint) hint.textContent = '';
      return;
    }
    await loadProfiles();
    if(!profiles.length){ box.innerHTML = '<p class="hint">暂无成员。可点「从旧数据导入」把旧成员迁过来，或「＋ 新增成员」。</p>'; return; }
    box.innerHTML = profiles.map(memberCardHtml).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editMember(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delMember(+b.dataset.d); }); });
  }
  function newMember(){ memEdit = -1; $('mem-name').value=''; $('mem-role').value=''; $('mem-title').value=''; $('mem-photo-url').value=''; $('mem-signature').value=''; $('mem-bgm-url').value=''; $('mem-bio').value=''; $('mem-joindate').value=''; $('mem-active').checked=true; $('mem-photo-preview').src='assets/svg/plum.svg'; $('mem-cancel').classList.add('hidden'); $('mem-form-title').textContent='新增成员'; }
  function editMember(i){
    memEdit = i; var m = profiles[i];
    $('mem-form-title').textContent = '编辑成员 · ' + (m.name || '');
    $('mem-name').value = m.name||''; $('mem-role').value = m.role||''; $('mem-title').value = m.title||'';
    $('mem-photo-url').value = m.photo||''; $('mem-signature').value = m.signature||''; $('mem-bgm-url').value = m.bgm||'';
    $('mem-bio').value = m.bio||''; $('mem-joindate').value = m.joinDate||'';
    $('mem-active').checked = m.active !== false;
    $('mem-photo-preview').src = m._photoUrl || 'assets/svg/plum.svg';
    $('mem-cancel').classList.remove('hidden');
  }
  async function saveMember(){
    if(!CB.isLoggedIn()){ C.toast('请先在云账号登录', 'err'); return; }
    if(!$('mem-name').value.trim()){ C.toast('请填写成员名字', 'err'); return; }
    var m = {
      name: $('mem-name').value.trim(),
      role: $('mem-role').value.trim() || '成员',
      title: $('mem-title').value.trim(),
      photo: $('mem-photo-url').value.trim(),
      signature: $('mem-signature').value.trim(),
      bgm: $('mem-bgm-url').value.trim(),
      bio: $('mem-bio').value.trim(),
      joinDate: $('mem-joindate').value.trim(),
      active: $('mem-active').checked,
      updatedAt: new Date().toISOString()
    };
    try {
      if(memEdit >= 0){
        var id = profiles[memEdit]._id || profiles[memEdit].id;
        await CB.coll('profiles').doc(id).update(m);
      } else {
        m.createdAt = new Date().toISOString();
        await CB.coll('profiles').add(m);
      }
      newMember(); await renderMembers(); C.toast('成员已保存', 'ok');
    } catch(e){ C.toast('保存失败：' + (e.message || e), 'err'); }
  }
  async function delMember(i){
    var m = profiles[i];
    if(!confirm('确定删除成员 ' + (m.name||'') + ' 吗？')) return;
    try {
      await CB.coll('profiles').doc(m._id || m.id).remove();
      await renderMembers(); C.toast('已删除', 'ok');
    } catch(e){ C.toast('删除失败：' + (e.message || e), 'err'); }
  }
  function genEditKey(){ C.toast('已升级为账号机制：成员登录后自己改档案', 'ok'); }
  async function uploadMemberPhoto(){
    var f = $('mem-photo-file').files[0]; if(!f) return;
    C.toast('正在上传照片…');
    try {
      var blob = await C.compressImage(f, 800, 0.85);
      var r = await CB.upload('members/' + Date.now().toString(36) + '.jpg', blob);
      var fid = r.id || r.path || '';
      $('mem-photo-url').value = fid;
      var u = await CB.fileUrl(fid);
      $('mem-photo-preview').src = u || 'assets/svg/plum.svg';
      C.toast('照片已上传', 'ok');
    } catch(e){ C.toast('上传失败：' + (e.message || e), 'err'); }
  }
  async function uploadMemberBgm(){
    var f = $('mem-bgm-file').files[0]; if(!f) return;
    if(f.size > 8*1024*1024){ C.toast('音频请控制在 8MB 以内', 'err'); return; }
    C.toast('正在上传音乐…');
    try {
      var r = await CB.upload('members/' + Date.now().toString(36) + '.mp3', f);
      $('mem-bgm-url').value = r.id || r.path || '';
      C.toast('音乐已上传', 'ok');
    } catch(e){ C.toast('上传失败：' + (e.message || e), 'err'); }
  }
  async function importOldMembers(){
    if(!CB.isLoggedIn()){ C.toast('请先在云账号登录', 'err'); return; }
    C.toast('正在导入旧成员…');
    try {
      var data = await C.fetchJSON('members.json');
      var oldList = (data.members || []);
      await loadProfiles();
      var names = {};
      profiles.forEach(function(p){ names[p.name] = 1; });
      var added = 0;
      for(var k = 0; k < oldList.length; k++){
        var o = oldList[k];
        if(names[o.name]) continue;
        await CB.coll('profiles').add({
          name: o.name || '未命名', role: o.role || '成员', title: o.title || '',
          photo: /^https?:/.test(o.photo||'') ? (o.photo||'') : '', signature: o.signature||'',
          bgm: /^https?:/.test(o.bgm||'') ? (o.bgm||'') : '', bio: o.bio||'',
          joinDate: o.joinDate || '', active: o.active !== false,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        });
        names[o.name] = 1; added++;
      }
      await renderMembers(); C.toast('导入完成，新增 ' + added + ' 位', 'ok');
    } catch(e){ C.toast('导入失败：' + (e.message || e), 'err'); }
  }
  /* ================= 活动 ================= */
  function renderAct(){
    var box = $('act-list');
    if(!activities.activities.length){ box.innerHTML = '<p class="hint">暂无活动</p>'; return; }
    box.innerHTML = activities.activities.map(function(a, i){
      return '<div class="item-row"><div class="row-top">' +
        '<div><b>' + C.esc(a.title) + '</b> <span class="badge">' + C.esc(a.type||'') + '</span> <span class="badge badge-dai">' + C.esc(a.status||'') + '</span></div>' +
        '<div class="row-actions"><button class="btn btn-paper btn-sm" data-e="' + i + '">编辑</button>' +
        '<button class="btn btn-paper btn-sm" data-s="' + i + '">报名</button>' +
        '<button class="btn btn-danger btn-sm" data-d="' + i + '">删除</button></div></div>' +
        '<p class="hint" style="margin-top:6px">' + C.esc(a.date||'') + ' ' + C.esc(a.time||'') + ' · ' + C.esc(a.location||'') + '</p></div>';
    }).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editAct(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delAct(+b.dataset.d); }); });
    box.querySelectorAll('[data-s]').forEach(function(b){ b.addEventListener('click', function(){ viewSignups(activities.activities[+b.dataset.s].id); }); });
  }
  function editAct(i){
    actEdit = i; var a = activities.activities[i];
    $('act-title').value=a.title||''; $('act-date').value=a.date||''; $('act-time').value=a.time||''; $('act-location').value=a.location||'';
    $('act-type').value=a.type||''; $('act-status').value=a.status||''; $('act-desc').value=a.desc||'';
    $('act-cancel').classList.remove('hidden'); $('act-form-title').textContent='编辑活动';
  }
  function resetActForm(){ actEdit=-1; ['act-title','act-date','act-time','act-location','act-type','act-status','act-desc'].forEach(function(i){ $(i).value=''; }); $('act-cancel').classList.add('hidden'); $('act-form-title').textContent='新增活动'; }
  function saveAct(){
    var item = { id: (actEdit>=0)?activities.activities[actEdit].id:('a'+Date.now().toString(36)), title:$('act-title').value.trim(), date:$('act-date').value.trim(), time:$('act-time').value.trim(), location:$('act-location').value.trim(), type:$('act-type').value.trim(), status:$('act-status').value.trim(), desc:$('act-desc').value.trim() };
    if(!item.title){ C.toast('请填写活动标题','err'); return; }
    if(actEdit>=0) activities.activities[actEdit]=item; else activities.activities.unshift(item);
    GH.writeFile('activities.json', JSON.stringify(activities,null,2), '更新活动').then(function(){ renderAct(); resetActForm(); C.toast('活动已保存','ok'); }).catch(function(e){ C.toast(e.message,'err'); });
  }
  function delAct(i){ if(!confirm('删除该活动？')) return; activities.activities.splice(i,1); GH.writeFile('activities.json', JSON.stringify(activities,null,2), '删除活动').then(function(){ renderAct(); }).catch(function(e){ C.toast(e.message,'err'); }); }
  async function viewSignups(actId){
    var act = activities.activities.find(function(a){ return a.id === actId; });
    var title = act ? act.title : '活动';
    function localTime(iso){
      if(!iso) return '';
      var d = new Date(iso);
      if(isNaN(d.getTime())) return '';
      var p = function(n){ return (n<10?'0':'')+n; };
      return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
    }
    try {
      await CB.ensureAnon();
      var r = await CB.coll('signups').where({ activityId: actId }).limit(200).get();
      var list = (r.data || []).slice().sort(function(a,b){ return String(b.createdAt||'').localeCompare(String(a.createdAt||'')); });
      var html = list.length ? list.map(function(s){
        return '<div style="padding:8px 0;border-bottom:1px dashed var(--line)">' +
          '<b>' + C.esc(s.name||'') + '</b>' + (s.gameId ? ' <span class="hint">ID：' + C.esc(s.gameId) + '</span>' : '') +
          (s.note ? '<div class="hint">' + C.esc(s.note) + '</div>' : '') +
          '<div class="hint" style="font-size:12px;color:var(--ink-3)">' + C.esc(localTime(s.createdAt)) + '</div>' +
          '</div>';
      }).join('') : '<p class="hint">还没有人报名这个活动</p>';
      C.modal.open('<div class="modal-title">报名详情 · ' + C.esc(title) + '</div>' +
        '<p class="hint" style="margin-bottom:10px">共 ' + list.length + ' 人报名</p>' + html);
    } catch(e){ C.toast('读取报名失败：' + (e.message || e), 'err'); }
  }

  /* ================= 攻略 ================= */
  function renderGuides(){
    var box = $('guide-list');
    if(!guides.guides.length){ box.innerHTML='<p class="hint">暂无攻略</p>'; return; }
    box.innerHTML = guides.guides.map(function(g, i){
      return '<div class="item-row"><div class="row-top"><div><b>' + C.esc(g.title) + '</b> <span class="badge badge-gold">' + C.esc(g.category||'') + '</span></div>' +
        '<div class="row-actions"><button class="btn btn-paper btn-sm" data-e="' + i + '">编辑</button><button class="btn btn-danger btn-sm" data-d="' + i + '">删除</button></div></div></div>';
    }).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editGuide(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delGuide(+b.dataset.d); }); });
  }
  function editGuide(i){ guideEdit=i; var g=guides.guides[i]; $('guide-title').value=g.title||''; $('guide-category').value=g.category||''; $('guide-content').value=(g.content||[]).join('\n'); $('guide-cancel').classList.remove('hidden'); $('guide-form-title').textContent='编辑攻略'; }
  function resetGuideForm(){ guideEdit=-1; $('guide-title').value=''; $('guide-category').value=''; $('guide-content').value=''; $('guide-cancel').classList.add('hidden'); $('guide-form-title').textContent='新增攻略'; }
  function saveGuide(){
    var item={ id:(guideEdit>=0)?guides.guides[guideEdit].id:('g'+Date.now().toString(36)), title:$('guide-title').value.trim(), category:$('guide-category').value.trim(), content:$('guide-content').value.split(/\r?\n/).map(function(s){return s.trim();}).filter(Boolean) };
    if(!item.title){ C.toast('请填写标题','err'); return; }
    if(guideEdit>=0) guides.guides[guideEdit]=item; else guides.guides.unshift(item);
    GH.writeFile('guides.json', JSON.stringify(guides,null,2), '更新攻略').then(function(){ renderGuides(); resetGuideForm(); C.toast('攻略已保存','ok'); }).catch(function(e){ C.toast(e.message,'err'); });
  }
  function delGuide(i){ if(!confirm('删除该攻略？')) return; guides.guides.splice(i,1); GH.writeFile('guides.json', JSON.stringify(guides,null,2), '删除攻略').then(function(){ renderGuides(); }).catch(function(e){ C.toast(e.message,'err'); }); }

  /* ================= 日报 ================= */
  function renderDaily(){
    var box = $('daily-list');
    if(!daily.issues.length){ box.innerHTML='<p class="hint">暂无日报</p>'; return; }
    box.innerHTML = daily.issues.map(function(d, i){
      return '<div class="item-row"><div class="row-top"><div><b>' + C.esc(d.issue||'') + ' · ' + C.esc(d.title) + '</b> <span class="hint">' + C.esc(d.date||'') + '</span></div>' +
        '<div class="row-actions"><button class="btn btn-paper btn-sm" data-e="' + i + '">编辑</button><button class="btn btn-danger btn-sm" data-d="' + i + '">删除</button></div></div></div>';
    }).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editDaily(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delDaily(+b.dataset.d); }); });
  }
  function editDaily(i){ dailyEdit=i; var d=daily.issues[i]; $('daily-issue').value=d.issue||''; $('daily-date').value=d.date||''; $('daily-title').value=d.title||''; $('daily-content').value=(d.content||[]).join('\n'); $('daily-cancel').classList.remove('hidden'); $('daily-form-title').textContent='编辑日报'; }
  function resetDailyForm(){ dailyEdit=-1; $('daily-issue').value=''; $('daily-date').value=''; $('daily-title').value=''; $('daily-content').value=''; $('daily-cancel').classList.add('hidden'); $('daily-form-title').textContent='新增日报'; }
  function saveDaily(){
    var item={ id:(dailyEdit>=0)?daily.issues[dailyEdit].id:('d'+Date.now().toString(36)), issue:$('daily-issue').value.trim(), date:$('daily-date').value.trim(), title:$('daily-title').value.trim(), content:$('daily-content').value.split(/\r?\n/).map(function(s){return s.trim();}).filter(Boolean) };
    if(!item.title){ C.toast('请填写标题','err'); return; }
    if(dailyEdit>=0) daily.issues[dailyEdit]=item; else daily.issues.unshift(item);
    GH.writeFile('daily.json', JSON.stringify(daily,null,2), '更新江湖日报').then(function(){ renderDaily(); resetDailyForm(); C.toast('日报已保存','ok'); }).catch(function(e){ C.toast(e.message,'err'); });
  }
  function delDaily(i){ if(!confirm('删除该期日报？')) return; daily.issues.splice(i,1); GH.writeFile('daily.json', JSON.stringify(daily,null,2), '删除日报').then(function(){ renderDaily(); }).catch(function(e){ C.toast(e.message,'err'); }); }

  /* ================= 公共保存 ================= */
  function saveConfigFile(msg){
    return GH.writeFile('config.json', JSON.stringify(cfg, null, 2), msg || '更新配置')
      .then(function(){ C.toast('已保存', 'ok'); renderAll(); })
      .catch(function(e){ C.toast('保存失败：' + e.message, 'err'); });
  }

  /* ================= 云账号（CloudBase） ================= */
  async function renderAccount(){
    try {
      var ls = await CB.getLoginState();
      var status = $('acc-status');
      if(ls && ls.user){
        $('acc-login-form').style.display = 'none';
        $('acc-logged').style.display = '';
        $('acc-email-show').textContent = CB.getEmail() || CB.getUid() || '已登录';
        var role = '成员';
        try {
          var docs = await CB.listProfiles();
          var mine = (docs || []).filter(function(p){ return p.uid === CB.getUid(); })[0];
          if(mine && mine.role) role = mine.role;
        } catch(e){}
        $('acc-role-show').textContent = role;
        if(status) status.textContent = role === '社主' ? '已登录，身份：社主（可管理成员和相册）' : '已登录，身份：' + role;
      } else {
        $('acc-login-form').style.display = '';
        $('acc-logged').style.display = 'none';
        if(status) status.textContent = '未登录。用注册邮箱登录；第一个注册的成员自动成为「社主」。';
      }
    } catch(e){ console.warn(e); }
  }
  async function accLogin(){
    var email = $('acc-email').value.trim(), pwd = $('acc-pwd').value;
    if(!email || !pwd){ C.toast('请填写邮箱和密码', 'err'); return; }
    C.toast('登录中…');
    try {
      await CB.signIn(email, pwd);
      C.toast('登录成功', 'ok');
      await renderAccount();
      renderMembers(); renderAlbums();
    } catch(e){ C.toast('登录失败：' + (e.message || e), 'err'); }
  }
  async function accLogout(){
    await CB.signOut();
    await renderAccount();
    renderMembers(); renderAlbums();
    C.toast('已退出', 'ok');
  }
  async function setShepherd(){
    if(!CB.isLoggedIn()){ C.toast('请先登录', 'err'); return; }
    try {
      var uid = CB.getUid();
      var docs = await CB.listProfiles();
      var mine = (docs || []).filter(function(p){ return p.uid === uid; })[0];
      if(mine){
        await CB.coll('profiles').doc(mine._id || mine.id).update({ role: '社主' });
      } else {
        await CB.coll('profiles').add({ uid: uid, email: CB.getEmail() || '', name: '社主', role: '社主', active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      await renderAccount(); C.toast('已设为社主', 'ok');
    } catch(e){ C.toast('操作失败：' + (e.message || e), 'err'); }
  }
  /* ================= 相册（云存储 + 云数据库） ================= */
  var albums = [];
  async function renderAlbums(){
    var box = $('album-list');
    if(!CB.isLoggedIn()){
      box.innerHTML = '<p class="hint">请先在「① 云账号」标签登录，才能管理相册。</p>';
      return;
    }
    try {
      var docs = await CB.listAlbums();
      albums = docs || [];
    } catch(e){
      albums = [];
      box.innerHTML = '<p class="hint">读取相册失败：' + C.esc(e.message || e) + '</p>';
      return;
    }
    if(!albums.length){ box.innerHTML = '<p class="hint">还没有相册。先点上方「＋ 新增相册」创建，保存后会自动进入「上传照片」界面。</p>'; return; }
    box.innerHTML = albums.map(function(a, i){
      var cnt = (a.images || []).length;
      return '<div class="item-row"><div class="row-top">' +
        '<div><b>' + C.esc(a.title || '未命名') + '</b> <span class="hint">' + cnt + ' 张</span></div>' +
        '<div class="row-actions"><button class="btn btn-paper btn-sm" data-e="' + i + '">编辑</button>' +
        '<button class="btn btn-danger btn-sm" data-d="' + i + '">删除</button></div></div>' +
        '<p class="hint" style="margin-top:6px">' + C.esc(a.desc || '') + '</p></div>';
    }).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editAlbum(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delAlbum(+b.dataset.d); }); });
  }
  function resetAlbumForm(){
    albumEdit = -1;
    $('album-title').value = ''; $('album-desc').value = '';
    $('album-form-title').textContent = '新增相册';
    $('album-cancel').classList.add('hidden');
    $('album-edit-area').innerHTML = '';
  }
  function newAlbum(){ resetAlbumForm(); }
  async function editAlbum(i){
    albumEdit = i;
    var a = albums[i];
    $('album-title').value = a.title || ''; $('album-desc').value = a.desc || '';
    $('album-form-title').textContent = '编辑相册 · ' + (a.title || '');
    $('album-cancel').classList.remove('hidden');
    await renderAlbumEdit(i);
  }
  async function saveAlbumInfo(){
    if(!CB.isLoggedIn()){ C.toast('请先在云账号登录', 'err'); return; }
    var title = $('album-title').value.trim();
    if(!title){ C.toast('请填写相册标题', 'err'); return; }
    try {
      if(albumEdit >= 0){
        var doc = albums[albumEdit];
        await CB.coll('albums').doc(doc._id || doc.id).update({ title: title, desc: $('album-desc').value.trim(), updatedAt: new Date().toISOString() });
        doc.title = title; doc.desc = $('album-desc').value.trim();
      } else {
        var r = await CB.coll('albums').add({ id: 'al' + Date.now().toString(36), title: title, desc: $('album-desc').value.trim(), cover: '', images: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        albums.unshift({ _id: (r && (r._id || r.id)) || '', id: 'al' + Date.now().toString(36), title: title, desc: $('album-desc').value.trim(), cover: '', images: [] });
        albumEdit = 0;
      }
      await renderAlbums();
      C.toast('相册信息已保存', 'ok');
      if(albumEdit >= 0) renderAlbumEdit(albumEdit);
    } catch(e){ C.toast('保存失败：' + (e.message || e), 'err'); }
  }
  async function delAlbum(i){
    var a = albums[i];
    if(!confirm('删除相册「' + (a.title || '') + '」？')) return;
    try {
      await CB.coll('albums').doc(a._id || a.id).remove();
      albums.splice(i, 1);
      if(albumEdit === i) resetAlbumForm();
      await renderAlbums(); C.toast('已删除', 'ok');
    } catch(e){ C.toast('删除失败：' + (e.message || e), 'err'); }
  }
  async function renderAlbumEdit(i){
    var a = albums[i];
    var box = $('album-edit-area');
    if(!a){ box.innerHTML = ''; return; }
    var imgs = a.images || [];
    var need = [];
    imgs.forEach(function(im){ if(im && im.src) need.push(im.src); });
    if(a.cover) need.push(a.cover);
    var urls = {};
    try { urls = await CB.fileUrls(need); } catch(e){}
    box.innerHTML =
      '<h3>管理图片（' + imgs.length + ' 张）</h3>' +
      '<div class="field"><label>上传图片（可多选，自动压缩，直接进云存储）</label><input id="album-img-file" type="file" accept="image/*" multiple></div>' +
      '<div id="album-thumbs">' + imgs.map(function(img, j){
        var u = img && img.src ? (urls[img.src] || '') : '';
        return '<span class="album-img-thumb">' +
          (img.src === a.cover ? '<span class="cover-tag">封面</span>' : '') +
          (u ? '<img src="' + C.esc(u) + '" alt="">' : '<span style="display:block;width:100%;height:80px;background:var(--paper-2)"></span>') +
          '<span class="thumb-bar">' +
            '<input data-cap="' + j + '" value="' + C.esc((img && img.caption) || '') + '" placeholder="图片说明">' +
            '<span class="thumb-actions">' +
              '<button class="btn btn-paper btn-sm" data-act="cover" data-idx="' + j + '">设封面</button>' +
              '<button class="btn btn-paper btn-sm" data-act="rot" data-idx="' + j + '">旋转90°</button>' +
              '<button class="btn btn-paper btn-sm" data-act="up" data-idx="' + j + '">↑上移</button>' +
              '<button class="btn btn-paper btn-sm" data-act="down" data-idx="' + j + '">↓下移</button>' +
              '<button class="btn btn-danger btn-sm" data-act="del" data-idx="' + j + '">删除</button>' +
            '</span>' +
          '</span></span>';
      }).join('') + '</div>' +
      '<div class="form-actions"><button class="btn btn-cinnabar btn-sm" id="album-imgs-save">保存图片修改</button></div>';
    $('album-img-file').addEventListener('change', function(){ uploadAlbumImages(i, this.files); });
    box.querySelectorAll('[data-cap]').forEach(function(inp){
      inp.addEventListener('change', function(){ albums[i].images[+inp.dataset.cap].caption = inp.value; });
    });
    box.querySelectorAll('[data-act]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var act = btn.dataset.act, idx = +btn.dataset.idx;
        var a2 = albums[i];
        if(act === 'cover'){ a2.cover = a2.images[idx].src; renderAlbumEdit(i); C.toast('已设为封面，记得点「保存图片修改」'); }
        else if(act === 'up'){ if(idx > 0){ var t = a2.images[idx]; a2.images[idx] = a2.images[idx-1]; a2.images[idx-1] = t; renderAlbumEdit(i); } }
        else if(act === 'down'){ if(idx < a2.images.length-1){ var t2 = a2.images[idx]; a2.images[idx] = a2.images[idx+1]; a2.images[idx+1] = t2; renderAlbumEdit(i); } }
        else if(act === 'rot'){ rotateAlbumImage(i, idx); }
        else if(act === 'del'){ if(confirm('删除这张图片？')){ a2.images.splice(idx, 1); if(a2.cover && !a2.images.some(function(x){ return x.src === a2.cover; })) a2.cover = ''; renderAlbumEdit(i); C.toast('已删除，记得点保存'); } }
      });
    });
    $('album-imgs-save').addEventListener('click', async function(){ await saveAlbumImages(i); });
  }
  async function saveAlbumImages(i){
    var a = albums[i];
    try {
      await CB.coll('albums').doc(a._id || a.id).update({ cover: a.cover || '', images: a.images || [], updatedAt: new Date().toISOString() });
      C.toast('图片修改已保存', 'ok');
    } catch(e){ C.toast('保存失败：' + (e.message || e), 'err'); }
  }
  async function uploadAlbumImages(i, files){
    var a = albums[i];
    a.images = a.images || [];
    C.toast('正在上传 ' + files.length + ' 张…');
    try {
      for(var k = 0; k < files.length; k++){
        var blob = await C.compressImage(files[k], 1600, 0.85);
        var r = await CB.upload('albums/' + (a.id || i) + '/' + Date.now().toString(36) + '.jpg', blob);
        a.images.push({ src: r.id || r.path || '', caption: '' });
      }
      await saveAlbumImages(i);
      await renderAlbumEdit(i);
      C.toast('上传完成', 'ok');
    } catch(e){ C.toast('上传失败：' + (e.message || e), 'err'); }
  }
  async function rotateAlbumImage(i, idx){
    var a = albums[i];
    var img = a.images[idx];
    C.toast('正在旋转…');
    try {
      var newFid = await rotateCloudImage(img.src, a.id || i);
      a.images[idx].src = newFid;
      if(a.cover === img.src) a.cover = newFid;
      await saveAlbumImages(i);
      await renderAlbumEdit(i);
      C.toast('旋转完成', 'ok');
    } catch(e){ C.toast('旋转失败：' + (e.message || e), 'err'); }
  }
  async function rotateCloudImage(fileId, folder){
    var url = await CB.fileUrl(fileId);
    if(!url) throw new Error('无法读取图片');
    var img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise(function(res, rej){ img.onload = res; img.onerror = function(){ rej(new Error('图片加载失败')); }; img.src = url; });
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalHeight; canvas.height = img.naturalWidth;
    var ctx = canvas.getContext('2d');
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    var blob = await new Promise(function(res){ canvas.toBlob(res, 'image/jpeg', 0.85); });
    var r = await CB.upload('albums/' + folder + '/' + Date.now().toString(36) + '.jpg', blob);
    return r.id || r.path || '';
  }
  async function uploadSiteBgm(){
    var f = $('set-bgm-file').files[0]; if(!f) return;
    if(f.size > 8*1024*1024){ C.toast('音频请控制在 8MB 以内', 'err'); return; }
    C.toast('正在上传官网音乐…');
    try {
      var p = await GH.uploadAsset(f, 'assets/music', GH.fileName('sitebgm') + '.mp3');
      $('set-bgm').value = p;
      C.toast('音乐已上传，点「保存站点设置」生效', 'ok');
    } catch(e){ C.toast('上传失败：' + e.message, 'err'); }
  }
  function renderAll(){ renderBg(); renderSettings(); renderAnn(); renderAbout(); renderAct(); renderGuides(); renderDaily(); renderAccount(); renderMembers(); renderAlbums(); }

  /* ================= 初始化 ================= */
  document.addEventListener('DOMContentLoaded', async function(){
    C.injectShell();
    bindNav();
    fillConn();
    $('conn-save').addEventListener('click', saveConn);
    $('conn-refresh').addEventListener('click', refreshData);
    $('bg-file').addEventListener('change', uploadBg);
    $('settings-save').addEventListener('click', saveSettings);
    $('ann-add').addEventListener('click', resetAnnForm);
    $('ann-save').addEventListener('click', saveAnn);
    $('ann-cancel').addEventListener('click', resetAnnForm);
    $('about-add').addEventListener('click', resetAboutForm);
    $('ab-save').addEventListener('click', saveAbout);
    $('ab-cancel').addEventListener('click', resetAboutForm);
    $('member-add').addEventListener('click', newMember);
    $('mem-save').addEventListener('click', saveMember);
    $('mem-cancel').addEventListener('click', newMember);
    $('mem-photo-file').addEventListener('change', uploadMemberPhoto);
    $('mem-bgm-file').addEventListener('change', uploadMemberBgm);
    $('mem-editkey-reg').addEventListener('click', genEditKey);
    $('act-add').addEventListener('click', resetActForm);
    $('act-save').addEventListener('click', saveAct);
    $('act-cancel').addEventListener('click', resetActForm);
    $('guide-add').addEventListener('click', resetGuideForm);
    $('guide-save').addEventListener('click', saveGuide);
    $('guide-cancel').addEventListener('click', resetGuideForm);
    $('daily-add').addEventListener('click', resetDailyForm);
    $('daily-save').addEventListener('click', saveDaily);
    $('daily-cancel').addEventListener('click', resetDailyForm);
    $('set-bgm-file').addEventListener('change', uploadSiteBgm);
    $('album-add').addEventListener('click', newAlbum);
    $('album-save').addEventListener('click', saveAlbumInfo);
    $('album-cancel').addEventListener('click', resetAlbumForm);
    $('acc-login').addEventListener('click', accLogin);
    $('acc-logout').addEventListener('click', accLogout);
    $('acc-set-shepherd').addEventListener('click', setShepherd);
    $('mem-import').addEventListener('click', importOldMembers);

    try { await loadAll(); renderAll(); } catch(e){ console.warn(e); }
    if(GH.ready()){
      try { await loadAll(); renderAll(); C.toast('已连接 GitHub', 'ok'); listBg(); }
      catch(e){ C.toast('连接失败：' + e.message, 'err'); }
    }
  });
})();
