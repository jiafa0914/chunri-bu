/* 椿日部 · 公共脚本：页面壳、官网音乐、成员音乐切换、工具函数 */
(function(){
  var C = window.C = window.C || {};

  C.esc = function(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  };

  C.pad = function(n){ return (n < 10 ? '0' : '') + n; };
  C.today = function(){
    var d = new Date();
    return d.getFullYear() + '-' + C.pad(d.getMonth()+1) + '-' + C.pad(d.getDate());
  };
  C.fmtTime = function(iso){
    if(!iso) return '';
    var d = new Date(iso);
    if(isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + C.pad(d.getMonth()+1) + '-' + C.pad(d.getDate()) + ' ' + C.pad(d.getHours()) + ':' + C.pad(d.getMinutes());
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
    el._t = setTimeout(function(){ el.className = 'toast ' + (type || ''); }, 3800);
  };

  var NAV = [
    ['index.html','首页'], ['about.html','关于'], ['members.html','成员'],
    ['activities.html','活动'], ['guides.html','攻略'], ['daily.html','江湖日报'],
    ['gallery.html','相册'], ['recruit.html','招新']
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
        '<span class="brand-seal">椿</span>' +
        '<span class="brand-name">椿日部<small>燕云十六声 · 天涯阁</small></span>' +
        '</a>' +
'<nav class="nav">' + links + '</nav>' + '<div class="auth-chip" id="auth-chip"></div>' +
        '</div></header>';
    }
    var fp = document.getElementById('site-footer-placeholder');
    if(fp){
      fp.innerHTML =
        '<footer class="site-footer"><div class="footer-inner">' +
        '<div class="footer-text" id="footer-text">椿日部 · 燕云十六声百业社团</div>' +
        '<div class="footer-links">' +
          '<a href="admin.html">管理</a>' +
'<a href="login.html">登录</a>' +
        '</div>' +
        '<img class="footer-seal" src="assets/svg/seal.svg" alt="椿日部印章">' +
        '</div></footer>';
    }
    /* 官网音乐浮动按钮 */
    if(!document.getElementById('site-bgm-btn')){
      var b = document.createElement('button');
      b.id = 'site-bgm-btn'; b.className = 'site-bgm-btn'; b.textContent = '♪'; b.title = '官网背景音乐';
      b.style.display = 'none';
      b.addEventListener('click', C.toggleSiteBgm);
      document.body.appendChild(b);
      siteBtn = b;
    }
    /* 微信内置浏览器引导 */
    (function(){
      var ua = navigator.userAgent || '';
      if(/MicroMessenger/i.test(ua) && !/wxwork/i.test(ua) && (location.hostname.indexOf('github.io') >= 0)){
        try { if(sessionStorage.getItem('wx_guide_done')) return; } catch(e){}
        var g = document.createElement('div');
        g.id = 'wx-guide';
        g.innerHTML = '<div class="wx-guide-box">' +
          '<div class="wx-guide-title">请用浏览器打开</div>' +
          '<p>微信内置浏览器可能无法正常打开本站。</p>' +
          '<p>请点击右上角「<b>···</b>」，选择「<b>在浏览器打开</b>」。</p>' +
          '<button id="wx-guide-close" class="btn btn-cinnabar btn-sm">我知道了</button></div>';
        g.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(38,35,28,.62);display:flex;align-items:center;justify-content:center;padding:24px';
        document.body.appendChild(g);
        var btn = document.getElementById('wx-guide-close');
        if(btn) btn.addEventListener('click', function(){ g.style.display='none'; try { sessionStorage.setItem('wx_guide_done','1'); } catch(e){} });
      }
    })();    /* 登录状态显示（仅当页面引入了云开发 SDK 时） */
    if(window.CB){
      (function(){
        var chip = document.getElementById('auth-chip');
        if(!chip) return;
        CB.getLoginState().then(function(ls){
          var chipEmail = CB.getEmail() || '';
          if(ls && ls.user && chipEmail){
            chip.innerHTML = '<a href="my.html">我的档案</a><a href="#" id="auth-logout">退出</a>';
            var lo = document.getElementById('auth-logout');
            if(lo) lo.addEventListener('click', function(ev){
              ev.preventDefault();
              CB.signOut().then(function(){ location.reload(); }).catch(function(){ location.reload(); });
            });
          } else {
            chip.innerHTML = '<a href="login.html">登录</a>';
          }
        }).catch(function(){ chip.innerHTML = '<a href="login.html">登录</a>'; });
      })();
    }
    C.fetchJSON('config.json').then(function(cfg){
      var ft = document.getElementById('footer-text');
      if(ft && cfg && cfg.site && cfg.site.footer) ft.textContent = cfg.site.footer;
      if(cfg && cfg.site && cfg.site.bgm){
      var __bgm = cfg.site.bgm;
      if(/^cloud:\/\//i.test(__bgm)){
        CB.fileUrl(__bgm).then(function(u){ if(u) C.setSiteBgm(u); }).catch(function(){});
      } else {
        C.setSiteBgm(__bgm);
      }
    }
    }).catch(function(){});
  };

  /* ============ 音乐播放器（官网 / 成员 自动切换） ============ */
  var audio = new Audio();
  audio.preload = 'none';
  var siteBgm = '';
  var currentMode = 'none';   // none | site | member
  var siteWasPlaying = false;
  var siteResumeAt = 0;
  var siteBtn = null;

  function norm(u){ try { return new URL(u, location.href).href; } catch(e){ return u; } }
  function refreshSiteBtn(){
    if(!siteBtn) return;
    if(currentMode === 'site' && !audio.paused){
      siteBtn.classList.add('playing'); siteBtn.classList.remove('member');
      siteBtn.innerHTML = '<span class="eq"><i></i><i></i><i></i></span>';
      siteBtn.title = '暂停官网音乐';
    } else if(currentMode === 'member' && !audio.paused){
      siteBtn.classList.remove('playing'); siteBtn.classList.add('member');
      siteBtn.textContent = '♪';
      siteBtn.title = '正在播放成员音乐';
    } else {
      siteBtn.classList.remove('playing','member');
      siteBtn.textContent = '♪';
      siteBtn.title = '播放官网音乐';
    }
  }
  audio.addEventListener('ended', function(){ if(currentMode === 'member') currentMode = 'none'; refreshSiteBtn(); });
  audio.addEventListener('play', refreshSiteBtn);
  audio.addEventListener('pause', refreshSiteBtn);

  C.setSiteBgm = function(url){
    siteBgm = url || '';
    if(siteBtn) siteBtn.style.display = siteBgm ? '' : 'none';
  };
  C.toggleSiteBgm = function(){
    if(!siteBgm) return;
    if(currentMode === 'site' && !audio.paused){
      audio.pause(); currentMode = 'none'; refreshSiteBtn(); return;
    }
    currentMode = 'site';
    audio.src = siteBgm;
    audio.play().then(refreshSiteBtn).catch(function(){ currentMode = 'none'; C.toast('无法播放音乐', 'err'); refreshSiteBtn(); });
  };
  C.playMemberBgm = function(url){
    if(!url) return;
    currentMode = 'member';
    audio.src = url;
    audio.play().then(refreshSiteBtn).catch(function(){ C.toast('无法播放音乐，请检查链接', 'err'); });
    refreshSiteBtn();
  };
  /* 打开成员详情：记住官网音乐是否在播及位置，播放成员音乐；成员没设音乐则不打断官网音乐 */
  C.openMember = function(m){
    if(m && m.bgm){
      siteWasPlaying = (currentMode === 'site' && !audio.paused);
      if(siteWasPlaying){ siteResumeAt = audio.currentTime || 0; audio.pause(); }
      currentMode = 'member';
      audio.src = m.bgm;
      audio.play().then(refreshSiteBtn).catch(function(){ C.toast('无法播放成员音乐', 'err'); refreshSiteBtn(); });
      refreshSiteBtn();
    } else {
      if(currentMode === 'member'){ audio.pause(); currentMode = 'none'; refreshSiteBtn(); }
    }
  };
  /* 关闭成员详情：官网音乐从上次位置继续播 */
  C.closeMember = function(){
    if(siteWasPlaying){
      siteWasPlaying = false;
      currentMode = 'site';
      audio.src = siteBgm;
      try { audio.currentTime = siteResumeAt || 0; } catch(e){}
      audio.play().then(refreshSiteBtn).catch(function(){ currentMode = 'none'; refreshSiteBtn(); });
      return;
    }
    if(currentMode === 'member'){ audio.pause(); currentMode = 'none'; refreshSiteBtn(); }
  };

  /* 首次点击页面任意处：自动开始官网音乐（除非点在音乐按钮上） */
  var firstInteraction = true;
  document.addEventListener('click', function(e){
    if(!firstInteraction) return;
    firstInteraction = false;
    if(e.target && e.target.closest && e.target.closest('#site-bgm-btn')) return;
    if(siteBgm && currentMode === 'none'){
      currentMode = 'site';
      audio.src = siteBgm;
      audio.play().catch(function(){ currentMode = 'none'; });
      refreshSiteBtn();
    }
  });

  /* 成员详情里的「播放/暂停」按钮 */
  C.setupBgm = function(){
    document.querySelectorAll('.bgm-btn').forEach(function(btn){
      var url = btn.dataset.bgm;
      var playing = (currentMode === 'member' && !audio.paused && norm(audio.src) === norm(url));
      btn.classList.toggle('playing', playing);
      btn.innerHTML = playing ? '⏸ 暂停' : '♪ 播放';
      btn.onclick = function(ev){
        if(ev) ev.stopPropagation();
        if(currentMode === 'member' && !audio.paused && norm(audio.src) === norm(url)){
          audio.pause(); currentMode = 'none'; refreshSiteBtn(); C.setupBgm(); return;
        }
        C.playMemberBgm(url);
        refreshSiteBtn(); C.setupBgm();
      };
    });
  };

  /* ---------- 图片压缩 ---------- */
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

  /* 旋转图片并上传（相册用） */
  C.rotateUpload = function(src, folder){
    return new Promise(function(resolve, reject){
      var img = new Image();
      img.onload = function(){
        var canvas = document.createElement('canvas');
        canvas.width = img.height; canvas.height = img.width;
        var ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        canvas.toBlob(function(b){ b ? resolve(b) : reject(new Error('旋转失败')); }, 'image/jpeg', 0.9);
      };
      img.onerror = function(){ reject(new Error('读取图片失败')); };
      img.src = src;
    }).then(function(blob){
      return GH.uploadAsset(blob, folder, GH.fileName('img') + '.jpg');
    });
  };
  /* ---------- 弹窗（支持关闭回调，用于恢复官网音乐） ---------- */
  C.modal = {
    onClose: null,
    open: function(html){
      var m = document.getElementById('modal');
      if(!m){ m = document.createElement('div'); m.id = 'modal'; m.className = 'modal-mask'; document.body.appendChild(m); }
      m.innerHTML = '<div class="modal"><button class="modal-close" onclick="C.modal.close()">✕</button>' + html + '</div>';
      m.classList.add('show');
    },
    close: function(){
      var m = document.getElementById('modal');
      if(m){
        m.classList.remove('show');
        if(C.modal.onClose){ var cb = C.modal.onClose; C.modal.onClose = null; cb(); }
      }
    }
  };
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') C.modal.close(); });

  document.addEventListener('DOMContentLoaded', function(){ C.injectShell(); });
})();
