/* =============================================================
 * 药搭子 · 语音播报
 * -------------------------------------------------------------
 * 用浏览器自带的 Web Speech API，不联网、不装包、不花一分钱。
 * 主要服务「适老模式」：把风险摘要念出来，比小字更管用。
 * 浏览器不支持时（例如部分老版本 Firefox）会安静地降级。
 * ============================================================= */

(function (YDZ) {
  'use strict';

  var synth = window.speechSynthesis || null;
  var current = null;
  var listeners = [];

  function supported() {
    return !!(synth && window.SpeechSynthesisUtterance);
  }

  function notify(state) {
    listeners.forEach(function (fn) { fn(state); });
  }

  /* 挑一个中文音色，挑不到就用默认 */
  function pickVoice() {
    if (!synth) return null;
    var voices = synth.getVoices() || [];
    var zh = voices.filter(function (v) { return /zh|Chinese|中文/i.test(v.lang + ' ' + v.name); });
    if (!zh.length) return null;
    /* 优先本地音色，延迟更低 */
    var local = zh.filter(function (v) { return v.localService; });
    return (local[0] || zh[0]);
  }

  function stop() {
    if (!synth) return;
    synth.cancel();
    current = null;
    notify('idle');
  }

  /**
   * @param {string} text 要朗读的文字
   */
  function speak(text) {
    if (!supported()) {
      notify('unsupported');
      return false;
    }

    stop();

    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.95;
    u.pitch = 1;

    var v = pickVoice();
    if (v) u.voice = v;

    u.onstart = function () { notify('speaking'); };
    u.onend = function () { current = null; notify('idle'); };
    u.onerror = function () { current = null; notify('idle'); };

    current = u;
    synth.speak(u);
    return true;
  }

  /* 音色列表是异步加载的，加载完成后回调节省一次试听 */
  if (synth && typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = function () { pickVoice(); };
  }

  /* 页面关闭时别让声音继续念 */
  window.addEventListener('pagehide', stop);

  YDZ.voice = {
    supported: supported,
    speak: speak,
    stop: stop,
    isSpeaking: function () { return !!(synth && synth.speaking); },
    onChange: function (fn) { listeners.push(fn); }
  };
})(window.YDZ);
