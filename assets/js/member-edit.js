/* 椿日部 · 成员自助编辑页 */
(function(){
  var C = window.C, GH = window.GH;
  function $(id){ return document.getElementById(id); }

  var params = new URLSearchParams(location.search);
  var mid = params.get('id') || '';
  var key = params.get('key') || '';
  var members = null, me = null;

  function showError(msg){
    $('me-form').classList.add('hidden');
    $('me-preview').classList.add('hidden');
    $('me-error').classList.remove('hidden');
    $('me-error').innerHTML = '<p style="color:var(--cinnabar);font-family:var(--font-title);letter-spacing:2px">' + C.esc(msg) + '</p>' +
      '<p class="hint" style="margin-top:8px">如需开通自助编辑，请联系社主，让社主在管理页「成员」中为你生成编辑链接。</p>';
  }

  function renderPreview(){
    var photo = me.photo ? '<img src="' + C.esc(me.photo) + '" alt="">' : '<div class="ph-placeholder">' + C.esc((me.name||'?').slice(0,1)) + '</div>';
    $('me-preview').innerHTML =
      '<div class="card member-card" style="max-width:260px;margin:0 auto">' +
      '<div class="member-photo">' + photo + '</div>' +
      '<div class="member-name">' + C.esc(me.name) + '</div>' +
      '<div class="member-role"><span class="badge">' + C.esc(me.role||'') + '</span></div>' +
      '<div class="member-signature">「' + C.esc(me.signature||'') + '」</div>' +
      (me.bgm ? '<button class="bgm-btn" data-bgm="' + C.esc(me.bgm) + '">♪ 听曲</button>' : '<p class="hint">（未设置背景音乐）</p>') +
      '</div>';
    C.setupBgm();
  }

  async function init(){
    C.injectShell();
    $('me-conn-owner').value = GH.repo().owner || '';
    $('me-conn-repo').value = GH.repo().name || '';
    $('me-conn-token').value = GH.token() || '';
    if(!mid){ showError('链接缺少成员编号（id）。'); return; }
    try {
      members = await C.fetchJSON('members.json');
    } catch(e){ showError('无法读取成员名单，请确认网站已部署。'); return; }
    me = members.members.find(function(m){ return m.id === mid; });
    if(!me){ showError('未找到该成员资料。'); return; }
    if(!me.editKey){ showError('该成员还没有开通自助编辑。'); return; }
    if(me.editKey !== key){ showError('编辑密钥不正确，请使用社主发给你的专属链接。'); return; }

    $('me-form').classList.remove('hidden');
    $('me-preview').classList.remove('hidden');
    $('me-error').classList.add('hidden');
    $('me-name-show').textContent = me.name + (me.role ? ' · ' + me.role : '');
    $('me-photo-url').value = me.photo || '';
    $('me-photo-preview').src = me.photo || 'assets/svg/plum.svg';
    $('me-signature').value = me.signature || '';
    $('me-bgm-url').value = me.bgm || '';
    renderPreview();
  }

  async function saveMe(){
    var owner = $('me-conn-owner').value.trim();
    var name = $('me-conn-repo').value.trim();
    var token = $('me-conn-token').value.trim();
    if(!owner || !name || !token){ C.toast('请填写编辑密钥（GitHub Owner / 仓库名 / Token）', 'err'); return; }
    GH.setRepo(owner, name); GH.setToken(token);

    me.photo = $('me-photo-url').value.trim();
    me.signature = $('me-signature').value.trim();
    me.bgm = $('me-bgm-url').value.trim();

    C.toast('正在保存…');
    try {
      var fresh = await GH.readFile('members.json');
      var data = JSON.parse(fresh.content);
      var idx = -1;
      for(var i=0;i<data.members.length;i++){ if(data.members[i].id === mid){ idx = i; break; } }
      if(idx < 0){ C.toast('未找到你的资料，请重新打开编辑链接', 'err'); return; }
      data.members[idx].photo = me.photo;
      data.members[idx].signature = me.signature;
      data.members[idx].bgm = me.bgm;
      await GH.writeFile('members.json', JSON.stringify(data, null, 2), '成员 ' + me.name + ' 更新个人资料');
      renderPreview();
      C.toast('保存成功，刷新页面即可看到新资料', 'ok');
    } catch(e){ C.toast('保存失败：' + e.message, 'err'); }
  }

  async function uploadPhoto(){
    var f = $('me-photo-file').files[0]; if(!f) return;
    C.toast('正在上传照片…');
    try {
      var blob = await C.compressImage(f, 800, 0.85);
      var p = await GH.uploadAsset(blob, 'assets/img/members', GH.fileName('member') + '.jpg');
      $('me-photo-url').value = p;
      $('me-photo-preview').src = p;
      C.toast('照片已上传，点击「保存」生效', 'ok');
    } catch(e){ C.toast('上传失败：' + e.message, 'err'); }
  }
  async function uploadBgm(){
    var f = $('me-bgm-file').files[0]; if(!f) return;
    if(f.size > 8*1024*1024){ C.toast('音频请控制在 8MB 以内', 'err'); return; }
    C.toast('正在上传音乐…');
    try {
      var p = await GH.uploadAsset(f, 'assets/music', GH.fileName('bgm') + '.mp3');
      $('me-bgm-url').value = p;
      C.toast('音乐已上传，点击「保存」生效', 'ok');
    } catch(e){ C.toast('上传失败：' + e.message, 'err'); }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('DOMContentLoaded', function(){
    $('me-save').addEventListener('click', saveMe);
    $('me-photo-file').addEventListener('change', uploadPhoto);
    $('me-bgm-file').addEventListener('change', uploadBgm);
    $('me-photo-url').addEventListener('input', function(){ $('me-photo-preview').src = $('me-photo-url').value || 'assets/svg/plum.svg'; });
  });
})();