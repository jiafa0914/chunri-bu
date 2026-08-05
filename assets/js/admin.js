/* 椿日部 · 社主管理面板 */
(function(){
  var C = window.C, GH = window.GH;
  function $(id){ return document.getElementById(id); }

  var cfg = null, members = null, activities = null, guides = null, daily = null;
  var annEdit = -1, aboutEdit = -1, memEdit = -1, actEdit = -1, guideEdit = -1, dailyEdit = -1;

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
      getJson('daily.json').then(function(d){ daily = d; })
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

  /* ================= 成员 ================= */
  function memberCardHtml(m, idx){
    var photo = m.photo ? '<img src="' + C.esc(m.photo) + '" alt="">' : '<div class="ph-placeholder">' + C.esc((m.name||'?').slice(0,1)) + '</div>';
    return '<div class="item-row"><div class="row-top">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<span style="width:40px;height:40px;border-radius:50%;overflow:hidden;border:1px solid var(--line);display:inline-block;background:var(--paper-2)">' + photo + '</span>' +
      '<div><b>' + C.esc(m.name) + '</b> <span class="badge" style="margin-left:6px">' + C.esc(m.role||'') + '</span>' +
      (m.active === false ? ' <span class="badge badge-dai">暂离</span>' : '') + '</div></div>' +
      '<div class="row-actions">' +
      '<button class="btn btn-paper btn-sm" data-link="' + idx + '">编辑链接</button>' +
      '<button class="btn btn-paper btn-sm" data-e="' + idx + '">编辑</button>' +
      '<button class="btn btn-danger btn-sm" data-d="' + idx + '">删除</button></div></div>' +
      '<p class="hint" style="margin-top:6px">签名：' + C.esc(m.signature||'—') + '</p></div>';
  }
  function renderMembers(){
    var box = $('member-list');
    if(!members.members.length){ box.innerHTML = '<p class="hint">暂无成员</p>'; return; }
    box.innerHTML = members.members.map(memberCardHtml).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editMember(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delMember(+b.dataset.d); }); });
    box.querySelectorAll('[data-link]').forEach(function(b){ b.addEventListener('click', function(){ copyMemberLink(+b.dataset.link); }); });
  }
  function newMember(){ memEdit = -1; $('mem-name').value=''; $('mem-role').value=''; $('mem-title').value=''; $('mem-photo-url').value=''; $('mem-signature').value=''; $('mem-bgm-url').value=''; $('mem-bio').value=''; $('mem-joindate').value=''; $('mem-active').checked=true; $('mem-editkey').value=''; $('mem-photo-preview').src='assets/svg/plum.svg'; $('mem-cancel').classList.add('hidden'); $('mem-form-title').textContent='新增成员'; }
  function editMember(i){
    memEdit = i; var m = members.members[i];
    $('mem-form-title').textContent = '编辑成员 · ' + m.name;
    $('mem-name').value = m.name||''; $('mem-role').value = m.role||''; $('mem-title').value = m.title||'';
    $('mem-photo-url').value = m.photo||''; $('mem-signature').value = m.signature||''; $('mem-bgm-url').value = m.bgm||'';
    $('mem-bio').value = m.bio||''; $('mem-joindate').value = m.joinDate||''; $('mem-active').checked = m.active !== false;
    $('mem-editkey').value = m.editKey||'';
    $('mem-photo-preview').src = m.photo || 'assets/svg/plum.svg';
    $('mem-cancel').classList.remove('hidden');
  }
  async function saveMember(){
    if(!$('mem-name').value.trim()){ C.toast('请填写成员名字', 'err'); return; }
    var m = {
      id: (memEdit >= 0) ? members.members[memEdit].id : ('m' + Date.now().toString(36)),
      name: $('mem-name').value.trim(),
      role: $('mem-role').value.trim(),
      title: $('mem-title').value.trim(),
      photo: $('mem-photo-url').value.trim(),
      signature: $('mem-signature').value.trim(),
      bgm: $('mem-bgm-url').value.trim(),
      bio: $('mem-bio').value.trim(),
      joinDate: $('mem-joindate').value.trim(),
      active: $('mem-active').checked,
      editKey: $('mem-editkey').value.trim()
    };
    if(memEdit >= 0) members.members[memEdit] = m; else members.members.push(m);
    try {
      await GH.writeFile('members.json', JSON.stringify(members, null, 2), '更新成员资料');
      renderMembers(); newMember(); C.toast('成员已保存', 'ok');
    } catch(e){ C.toast('保存失败：' + e.message, 'err'); }
  }
  function delMember(i){
    if(!confirm('确定删除成员 ' + members.members[i].name + ' 吗？')) return;
    members.members.splice(i,1);
    GH.writeFile('members.json', JSON.stringify(members, null, 2), '删除成员').then(function(){ renderMembers(); C.toast('已删除', 'ok'); }).catch(function(e){ C.toast(e.message,'err'); });
  }
  function genEditKey(){
    var k = '';
    var chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    for(var i=0;i<10;i++) k += chars[Math.floor(Math.random()*chars.length)];
    $('mem-editkey').value = k;
  }
  function copyMemberLink(i){
    var m = members.members[i];
    if(!m.editKey){ C.toast('该成员还没有编辑密钥，请先生成', 'err'); return; }
    var url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'member-edit.html?id=' + encodeURIComponent(m.id) + '&key=' + encodeURIComponent(m.editKey);
    if(navigator.clipboard){ navigator.clipboard.writeText(url).then(function(){ C.toast('编辑链接已复制', 'ok'); }); }
    else C.modal.open('<div class="modal-title">成员编辑链接</div><p style="word-break:break-all;font-size:13.5px">' + C.esc(url) + '</p><p class="hint">把链接发给该成员，他/她就能自己设置照片、签名和背景音乐。</p>');
  }
  async function uploadMemberPhoto(){
    var f = $('mem-photo-file').files[0]; if(!f) return;
    C.toast('正在上传照片…');
    try { var blob = await C.compressImage(f, 800, 0.85); var p = await GH.uploadAsset(blob, 'assets/img/members', GH.fileName('member') + '.jpg'); $('mem-photo-url').value = p; $('mem-photo-preview').src = p; C.toast('照片已上传', 'ok'); }
    catch(e){ C.toast('上传失败：' + e.message, 'err'); }
  }
  async function uploadMemberBgm(){
    var f = $('mem-bgm-file').files[0]; if(!f) return;
    if(f.size > 8*1024*1024){ C.toast('音频请控制在 8MB 以内', 'err'); return; }
    C.toast('正在上传音乐…');
    try { var p = await GH.uploadAsset(f, 'assets/music', GH.fileName('bgm') + '.mp3'); $('mem-bgm-url').value = p; C.toast('音乐已上传', 'ok'); }
    catch(e){ C.toast('上传失败：' + e.message, 'err'); }
  }

  /* ================= 活动 ================= */
  function renderAct(){
    var box = $('act-list');
    if(!activities.activities.length){ box.innerHTML = '<p class="hint">暂无活动</p>'; return; }
    box.innerHTML = activities.activities.map(function(a, i){
      return '<div class="item-row"><div class="row-top">' +
        '<div><b>' + C.esc(a.title) + '</b> <span class="badge">' + C.esc(a.type||'') + '</span> <span class="badge badge-dai">' + C.esc(a.status||'') + '</span></div>' +
        '<div class="row-actions"><button class="btn btn-paper btn-sm" data-e="' + i + '">编辑</button>' +
        '<button class="btn btn-danger btn-sm" data-d="' + i + '">删除</button></div></div>' +
        '<p class="hint" style="margin-top:6px">' + C.esc(a.date||'') + ' ' + C.esc(a.time||'') + ' · ' + C.esc(a.location||'') + '</p></div>';
    }).join('');
    box.querySelectorAll('[data-e]').forEach(function(b){ b.addEventListener('click', function(){ editAct(+b.dataset.e); }); });
    box.querySelectorAll('[data-d]').forEach(function(b){ b.addEventListener('click', function(){ delAct(+b.dataset.d); }); });
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
  function renderAll(){
    renderBg(); renderSettings(); renderAnn(); renderAbout(); renderMembers(); renderAct(); renderGuides(); renderDaily();
  }

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

    try { await loadAll(); renderAll(); } catch(e){ console.warn(e); }
    if(GH.ready()){
      try { await loadAll(); renderAll(); C.toast('已连接 GitHub', 'ok'); listBg(); }
      catch(e){ C.toast('连接失败：' + e.message, 'err'); }
    }
  });
})();