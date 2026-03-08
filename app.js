/**
 * 课堂实时听讲助手
 * - 实时语音转英文文字（Web Speech API）
 * - 英译中（免费翻译 API）
 */

(function () {
  'use strict';

  const btnToggle = document.getElementById('btnToggle');
  const btnTranslate = document.getElementById('btnTranslate');
  const statusEl = document.getElementById('status');
  const englishEl = document.getElementById('englishText');
  const chineseEl = document.getElementById('chineseText');
  const secureWarning = document.getElementById('secureWarning');

  let recognition = null;
  let isListening = false;
  let fullTranscript = '';
  let interimTranscript = '';

  // 麦克风仅在「安全上下文」可用：localhost、127.0.0.1 或 HTTPS。用 IP 的 HTTP 会被浏览器禁止
  if (!window.isSecureContext) {
    secureWarning.hidden = false;
    statusEl.textContent = '请用 localhost 或 HTTPS 打开';
    btnToggle.disabled = true;
  }

  // 检测并初始化语音识别
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusEl.textContent = '您的浏览器不支持语音识别，请使用 Chrome 或 Edge';
    btnToggle.disabled = true;
  } else if (window.isSecureContext) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      isListening = true;
      statusEl.textContent = '正在听…';
      btnToggle.classList.add('listening');
      btnToggle.querySelector('.btn-text').textContent = '停止听写';
      btnTranslate.disabled = false;
    };

    recognition.onend = function () {
      if (isListening) {
        recognition.start();
      } else {
        statusEl.textContent = '已停止';
        btnToggle.classList.remove('listening');
        btnToggle.querySelector('.btn-text').textContent = '开始听写';
      }
    };

    recognition.onresult = function (event) {
      interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          fullTranscript += transcript + ' ';
          fullTranscript = fullTranscript.trim();
        } else {
          interimTranscript += transcript;
        }
      }
      renderEnglish(fullTranscript, interimTranscript);
    };

    recognition.onerror = function (event) {
      if (event.error === 'not-allowed') {
        statusEl.textContent = '请允许使用麦克风';
        isListening = false;
      } else if (event.error !== 'aborted') {
        statusEl.textContent = '识别出错: ' + event.error;
      }
    };
  }

  function renderEnglish(final, interim) {
    const wrap = (text) => (text ? '<p>' + escapeHtml(text) + '</p>' : '');
    const html = wrap(final) + (interim ? '<p class="interim">' + escapeHtml(interim) + '</p>' : '');
    englishEl.innerHTML = html || '<p class="placeholder">暂无内容</p>';
    englishEl.scrollTop = englishEl.scrollHeight;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  btnToggle.addEventListener('click', function () {
    if (!recognition) return;
    if (isListening) {
      isListening = false;
      recognition.stop();
    } else {
      fullTranscript = '';
      interimTranscript = '';
      renderEnglish('', '');
      chineseEl.innerHTML = '<p class="placeholder">点击「翻译成中文」即可显示对应中文翻译。</p>';
      isListening = true;
      recognition.start();
    }
  });

  // 英译中：使用 MyMemory 免费 API，通过 CORS 代理避免跨域被拦
  function getTranslateUrl(trimmed) {
    return 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(trimmed) + '&langpair=en|zh-CN';
  }

  async function fetchTranslation(url) {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function translateToChinese(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      chineseEl.innerHTML = '<p class="placeholder">暂无英文内容可翻译。</p>';
      return;
    }
    chineseEl.classList.add('loading');
    chineseEl.innerHTML = '';

    const apiUrl = getTranslateUrl(trimmed);
    // 先直连，失败时用 CORS 代理（解决浏览器跨域限制）
    const proxies = [
      null,
      'https://corsproxy.io/?',
      'https://api.allorigins.win/raw?url='
    ];

    let data = null;
    let lastErr = null;

    for (const proxy of proxies) {
      try {
        const url = proxy == null ? apiUrl : proxy + encodeURIComponent(apiUrl);
        data = await fetchTranslation(url);
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    chineseEl.classList.remove('loading');

    if (data && data.responseStatus === 200 && data.responseData) {
      const translated = data.responseData.translatedText;
      chineseEl.innerHTML = '<p>' + escapeHtml(translated) + '</p>';
    } else if (lastErr) {
      chineseEl.innerHTML = '<p class="error-msg">网络错误或跨域被拦，无法翻译。请确保能访问外网，或用本地服务器打开页面（如 npx serve .）后重试。</p>';
    } else {
      chineseEl.innerHTML = '<p class="error-msg">翻译失败，请稍后再试。</p>';
    }
  }

  btnTranslate.addEventListener('click', function () {
    const text = fullTranscript + (interimTranscript ? ' ' + interimTranscript : '');
    translateToChinese(text);
  });

  // 可选：每句结束后自动翻译（可关闭以节省请求）
  // 这里仅手动翻译，用户点击「翻译成中文」时再请求
})();
