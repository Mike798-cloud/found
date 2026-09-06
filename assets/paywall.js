/**
 * 通用付费打赏系统 v1.0
 * 纯前端 localStorage / sessionStorage / cookie 方案 - 自愿打赏模式
 * 《未认领》版本：沿用《松涛粮站》的付款流程与浮层结构，仅调整文案、存储标记与触发时机。
 */
(function(){
'use strict';

const Paywall = {
  STORAGE_KEY: '_unclaimed_support',
  SESSION_KEY: '_unclaimed_support_session',
  COOKIE_KEY: '_unclaimed_pay_flag',
  AUTO_KEY: '_unclaimed_support_auto_shown',
  AUTO_COOKIE_KEY: '_unclaimed_support_auto',
  JOURNEY_KEY: '_unclaimed_support_journey_v1',
  DEFAULT_CONFIG: {
    qrCode: 'https://mike798-cloud.github.io/songtao-grainstation/paycode.png',
    price: '1元',
    title: '支持《未认领》',
    studio: 'abc studio'
  },

  _safeGet(store, key) {
    try { return store ? store.getItem(key) : ''; } catch (_) { return ''; }
  },
  _safeSet(store, key, value) {
    try { if (store) store.setItem(key, value); } catch (_) {}
  },

  hasPaid() {
    const ls = this._safeGet(window.localStorage, this.STORAGE_KEY);
    const ss = this._safeGet(window.sessionStorage, this.SESSION_KEY);
    const cookie = this._getCookie(this.COOKIE_KEY);
    let tab = '';
    try { tab = window.name || ''; } catch (_) {}
    return !!(ls || ss || cookie || tab.includes('__UNCLAIMED_SUPPORTED__'));
  },

  markPaid() {
    const token = this._generateToken();
    this._safeSet(window.localStorage, this.STORAGE_KEY, token);
    this._safeSet(window.sessionStorage, this.SESSION_KEY, token);
    this._setCookie(this.COOKIE_KEY, token, 365);
    try { if (!(window.name || '').includes('__UNCLAIMED_SUPPORTED__')) window.name = `${window.name || ''}__UNCLAIMED_SUPPORTED__`; } catch (_) {}
    this._refreshSupportButton();
  },

  hasAutoShown() {
    let tab = '';
    try { tab = window.name || ''; } catch (_) {}
    return !!(this._safeGet(window.localStorage, this.AUTO_KEY) || this._safeGet(window.sessionStorage, this.AUTO_KEY) || this._getCookie(this.AUTO_COOKIE_KEY) || tab.includes('__UNCLAIMED_PAYWALL_SHOWN__'));
  },

  markAutoShown() {
    this._safeSet(window.localStorage, this.AUTO_KEY, '1');
    this._safeSet(window.sessionStorage, this.AUTO_KEY, '1');
    this._setCookie(this.AUTO_COOKIE_KEY, '1', 365);
    try { if (!(window.name || '').includes('__UNCLAIMED_PAYWALL_SHOWN__')) window.name = `${window.name || ''}__UNCLAIMED_PAYWALL_SHOWN__`; } catch (_) {}
  },

  _generateToken() {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 10);
    try { return btoa(`${ts}_${rand}_abc_studio`); }
    catch (_) { return `${ts}_${rand}_abc_studio`; }
  },

  _setCookie(name, value, days) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    } catch (_) {}
  },

  _getCookie(name) {
    try {
      const cname = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        const c = ca[i].trim();
        if (c.indexOf(cname) === 0) return c.substring(cname.length);
      }
    } catch (_) {}
    return '';
  },

  show(config) {
    if (this.hasPaid()) {
      this._showThanks('已经收到你的支持，谢谢。');
      return;
    }
    const cfg = Object.assign({}, this.DEFAULT_CONFIG, config || {});
    const overlay = document.getElementById('paywall-overlay');
    if (!overlay) {
      this._createOverlay(cfg);
    } else {
      overlay.style.display = 'flex';
      overlay.classList.remove('paywall-closing', 'paywall-show');
      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('paywall-show')));
    }
  },

  hide() {
    const overlay = document.getElementById('paywall-overlay');
    if (!overlay) return;
    overlay.classList.add('paywall-closing');
    overlay.classList.remove('paywall-show');
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('paywall-closing');
    }, 400);
  },

  _onSupport() {
    this.markPaid();
    this.hide();
    this._showThanks('感谢你的支持！这张旧档案会继续留在这里。');
  },

  _showThanks(message) {
    document.querySelectorAll('.paywall-toast').forEach(x => x.remove());
    const toast = document.createElement('div');
    toast.className = 'paywall-toast';
    toast.textContent = message || '感谢你的支持！';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  },

  _animateIn() {
    const overlay = document.getElementById('paywall-overlay');
    if (overlay) requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('paywall-show')));
  },

  _createOverlay(cfg) {
    const html = `
      <div class="paywall-overlay" id="paywall-overlay" role="dialog" aria-modal="true" aria-label="支持作者">
        <div class="paywall-card">
          <button class="paywall-close" type="button" data-paywall-close title="关闭" aria-label="关闭">&times;</button>
          <div class="paywall-card-inner">
            <div class="paywall-header">
              <div class="paywall-title-row">
                <span class="paywall-heart">♡</span>
                <span class="paywall-title">${cfg.title}</span>
                <span class="paywall-heart">♡</span>
              </div>
              <div class="paywall-subtitle">${cfg.price} 自愿打赏 · 感谢支持</div>
            </div>
            <div class="paywall-body">
              <div class="paywall-qr-wrapper">
                <img src="${cfg.qrCode}" alt="收款码" class="paywall-qr-img" />
                <div class="paywall-qr-glow"></div>
              </div>
              <div class="paywall-qr-tip">请用 <strong style="color:#1677ff;">某宝</strong> 扫码打赏 ${cfg.price}</div>
              <div class="paywall-message">
                <p class="paywall-msg-warm">你好，我是 ${cfg.studio} 的独立开发者。</p>
                <p class="paywall-msg-body">
                  《未认领》里的旧站网页、档案照片和普通留言都花了很长时间反复整理。<br>
                  如果你愿意支持 <strong>${cfg.price}</strong>，它会直接支持我继续制作下一部网页解谜。
                </p>
                <p class="paywall-msg-cute">不支持也不会影响任何内容，关掉这里就能继续完整调查。</p>
                <p class="paywall-msg-warm2">谢谢你愿意把时间留给这段没有被认领的旧记录。</p>
              </div>
            </div>
            <div class="paywall-footer">
              <div class="paywall-hint">
                <span class="paywall-hint-icon">💡</span>
                <span>小提示：请勿清除浏览器数据，否则下次打开可能会再次看到这里。</span>
              </div>
              <div class="paywall-btns">
                <button class="paywall-btn paywall-btn-support" type="button" data-paywall-supported>已完成支持 ♡</button>
                <button class="paywall-btn paywall-btn-later" type="button" data-paywall-later>下次一定</button>
              </div>
            </div>
            <div class="paywall-studio">${cfg.studio}</div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const overlay = document.getElementById('paywall-overlay');
    overlay.querySelector('[data-paywall-close]').addEventListener('click', () => this.hide());
    overlay.querySelector('[data-paywall-later]').addEventListener('click', () => this.hide());
    overlay.querySelector('[data-paywall-supported]').addEventListener('click', () => this._onSupport());
    overlay.addEventListener('click', e => { if (e.target === overlay) this.hide(); });
    document.addEventListener('keydown', this._escHandler ||= (e => { if (e.key === 'Escape') this.hide(); }));
    this._animateIn();
  },

  _section() {
    const parts = location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.at(-1) === 'index.html') parts.pop();
    const last = (parts.at(-1) || '').toLowerCase();
    return ['portal','lost','guestbook','service','equipment','term03','lost2','mail','final'].includes(last) ? last : 'root';
  },

  _readJourney() {
    try {
      const raw = this._safeGet(window.sessionStorage, this.JOURNEY_KEY) || this._safeGet(window.localStorage, this.JOURNEY_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) { return {}; }
  },

  _writeJourney(state) {
    let raw = '{}';
    try { raw = JSON.stringify(state || {}); } catch (_) {}
    // sessionStorage 负责本轮顺序；localStorage 让刷新或跨目录跳转后仍能保持上下文。
    this._safeSet(window.sessionStorage, this.JOURNEY_KEY, raw);
    this._safeSet(window.localStorage, this.JOURNEY_KEY, raw);
  },

  _trackJourney() {
    const section = this._section();
    const q = new URLSearchParams(location.search);
    const state = this._readJourney();
    let changed = false;
    const mark = key => { if (!state[key]) { state[key] = 1; changed = true; } };

    if (section === 'lost' && (q.get('record') === '2008-0716-042' || q.get('attachment') === '042-PH-01')) mark('lost042');
    if (section === 'portal' && q.get('view') === 'k124') mark('k124');
    if (section === 'service' && q.get('sheet') === '0716-N') mark('service16');
    if (section === 'service' && q.get('sheet') === '0717-M') mark('service17');
    if (section === 'guestbook' && (q.get('date') === '2008-07-17' || (q.get('user') || '').toUpperCase() === 'NING')) mark('guest17');
    if (section === 'portal' && q.get('view') === 'address') mark('address');
    if (section === 'equipment' && (q.get('device') || '').toUpperCase() === 'TERM-03') mark('terminal03');
    if (section === 'term03') mark('term03');

    if (changed) this._writeJourney(state);
    return state;
  },

  _isTriggerPoint(journey) {
    const section = this._section();
    const q = new URLSearchParams(location.search);
    const state = journey || this._readJourney();

    // 正常流程：确认无证少女身份、追到石榴巷旧址后，在从“找人”转入“查设备”前出现。
    // 只有前置调查确实走过时才在地址页弹出，避免玩家随手浏览站前交通时过早遇到打赏层。
    if (section === 'portal' && q.get('view') === 'address') {
      return !!(state.lost042 && state.k124 && state.service17 && state.guest17);
    }
    if ((location.hash || '').includes('page/address')) {
      return !!(state.lost042 && state.k124 && state.service17 && state.guest17);
    }

    // 直链、旧存档或非标准探索顺序的兜底：最迟在第一次真正找到 TERM-03 时出现。
    if (section === 'equipment' && (q.get('device') || '').toUpperCase() === 'TERM-03') return true;
    if (section === 'term03') return true;
    return false;
  },

  _ensureSupportButton() {
    if (!(this.hasAutoShown() || this.hasPaid())) return;
    let btn = document.getElementById('support-author-fixed');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'support-author-fixed';
      btn.className = 'support-author-fixed';
      btn.type = 'button';
      btn.addEventListener('click', () => {
        this.markAutoShown();
        this.show();
      });
      document.body.appendChild(btn);
    }
    this._refreshSupportButton();
  },

  _refreshSupportButton() {
    const btn = document.getElementById('support-author-fixed');
    if (!btn) return;
    if (this.hasPaid()) {
      btn.textContent = '已支持 ♡';
      btn.classList.add('supported');
      btn.setAttribute('aria-label', '已支持作者');
    } else {
      btn.textContent = '支持作者 1元';
      btn.classList.remove('supported');
      btn.setAttribute('aria-label', '支持作者1元');
    }
  },

  init() {
    // 保持开场扫描件完全沉浸：尚未进入调查时不显示任何作者按钮。
    if (this._section() === 'root') return;
    const journey = this._trackJourney();
    this._ensureSupportButton();
    if (!this.hasPaid() && !this.hasAutoShown() && this._isTriggerPoint(journey)) {
      // 自动弹层只出现一次；时机处于“石榴巷身份/旧址确认”与 TERM-03 深层调查之间。
      this.markAutoShown();
      this._ensureSupportButton();
      setTimeout(() => this.show(), 900);
    }
  }
};

window.Paywall = Paywall;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Paywall.init(), {once:true});
else Paywall.init();
})();
