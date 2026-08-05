/* 椿日部 · 公共脚本：页面壳、工具函数、全局音乐播放器 */
(function(){
  var C = window.C = window.C || {};

  C.esc = function(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  };

  C.fetchJSON = function(path){
    return fetch(path + (path.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now(), {cache:'no-store'})
      .then(function(res){
        if(!res.ok) throw new Error('加载失败: ' + path + ' (' + res.status + ')');
        return res.json();
      });
  };

  C.currentPage = function(){
    var p = location.pathname.split('/').pop();
    return p === '' ? 'index.html' : p;
  };

  C.toast = function(msg, type){
    var el = document.getElementById('toast');
    if(!el){
      el = document.createElement('div');
      el.id = 'toast'; el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'toast show ' + (type || '');
    clearTimeout(el._t);
    el._t = setTimeout(function(){ el.className = 'toast ' + (type || ''); }, 2600);
  };

  var NAV = [
    ['index.html','首页'], ['about.html','关于'], ['members.html','成员'],
    ['activities.html','活动'], ['guides.html','攻略'], ['daily.html','江湖日报'], ['recruit.html','招新']
  ];

  C.injectShell = function(){
    var hp = document.getElementById('site-header-placeholder');
    if(hp){
      var cur = C.currentPage();
      var links = NAV.map(function(n){
        return '<a href="' + n[0] + '"' + (n[0] === cur ? ' class="active"' : '') + '>' + n[1] + '</a>';
      }).join('');
      hp.innerHTML =
        '<header class="site-header"><div class="header-inner">' +
        '<a class="brand" href="index.html">' +
        '<img class="seal-sm" src="assets/svg/seal.svg" alt="椿日部印章">' +
        '<span class="brand-name">椿日部<small>燕云十六声 · 天涯阁</small></span>' +
        '</a>' +
        '<nav class="nav">' + links + '</nav>' +
        '</div></header>';
    }
    var fp = document.getElementById('site-footer-placeholder');
    if(fp){
      fp.innerHTML =
        '<footer class="site-footer"><div class="footer-inner">' +
        '<div class="footer-text" id="footer-text">椿日部 · 燕云十六声百业社团</div>' +
        '<div class="footer-links">' +
        '<a href="admin.html">管理</a>' +
        '<a href="member-edit.html">成员资料</a>' +
        '</div>' +
        '<img class="footer-seal" src="assets/svg/seal.svg" alt="椿日部印章">' +
        '</div></footer>';
    }
    C.fetchJSON('config.json').then(function(cfg){
      var ft = document.getElementById('footer-text');
      if(ft && cfg && cfg.site && cfg.site.footer) ft.textContent = cfg.site.footer;
    }).catch(function(){});
  };

  /* ---------- 全局背景音乐播放器 ---------- */
  var audio = new Audio();
  audio.preload = 'none';
  var currentBgm = '';
  function norm(u){ try { return new URL(u, location.href).href; } catch(e){ return u; } }
  function resetBtns(){
    document.querySelectorAll('.bgm-btn').forEach(function(b){
      b.classList.remove('playing');
      b.textContent = '♪ 听曲';
    });
  }
  audio.addEventListener('ended', function(){ currentBgm = ''; resetBtns(); });

  C.bgm = function(url, btn){
    var target = norm(url);
    if(currentBgm && currentBgm === target && !audio.paused){
      audio.pause();
      currentBgm = '';
      resetBtns();
      return;
    }
    if(audio.src && norm(audio.src) !== target) audio.src = target;
    if(!audio.src) audio.src = target;
    currentBgm = target;
    audio.play().then(function(){
      resetBtns();
      if(btn){ btn.classList.add('playing'); btn.textContent = '⏸ 停曲'; }
    }).catch(function(){ C.toast('无法播放音乐，请检查链接', 'err'); currentBgm = ''; });
  };

  C.setupBgm = function(){
    document.querySelectorAll('.bgm-btn').forEach(function(btn){
      btn.addEventListener('click', function(){ C.bgm(btn.dataset.bgm, btn); });
    });
  };

  /* ---------- 图片压缩（用于上传前瘦身） ---------- */
  C.compressImage = function(file, maxW, q){
    maxW = maxW || 1920; q = q || 0.85;
    var url = URL.createObjectURL(file);
    return new Promise(function(resolve, reject){
      var img = new Image();
      img.onload = function(){
        var scale = Math.min(1, maxW / img.width);
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function(b){ URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error('压缩失败')); }, 'image/jpeg', q);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('图片读取失败')); };
      img.src = url;
    });
  };

  /* ---------- 弹窗 ---------- */
  C.modal = {
    open: function(html){
      var m = document.getElementById('modal');
      if(!m){ m = document.createElement('div'); m.id = 'modal'; m.className = 'modal-mask'; document.body.appendChild(m); }
      m.innerHTML = '<div class="modal"><button class="modal-close" onclick="C.modal.close()">✕</button>' + html + '</div>';
      m.classList.add('show');
    },
    close: function(){ var m = document.getElementById('modal'); if(m) m.classList.remove('show'); }
  };
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') C.modal.close(); });

  document.addEventListener('DOMContentLoaded', function(){ C.injectShell(); });
})();