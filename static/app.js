// Helper functions to get clean inline SVGs instead of emojis for attachments
function getFileIconSVG(contentType, filename) {
  if (contentType && contentType.startsWith("audio/")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
  }
  if (filename && filename.endsWith(".pdf")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: #ff3b30;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
  }
  if (filename && (filename.endsWith(".zip") || filename.endsWith(".rar") || filename.endsWith(".7z"))) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
}

function getFileIconSVGByType(fileType) {
  if (fileType.startsWith("image/")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
  }
  if (fileType.startsWith("video/")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
  }
  if (fileType.startsWith("audio/")) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`;
}

// Progress and Confirmation helpers
function showProgressModal(title, subtitle) {
  if (loadingModal) {
    const titleEl = loadingModal.querySelector(".loading-title");
    const subEl = loadingModal.querySelector(".loading-subtitle");
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
    loadingModal.style.display = "flex";
  }
}

function hideProgressModal() {
  if (loadingModal) {
    loadingModal.style.display = "none";
  }
}

function showCustomConfirm(title, message, okText, onConfirm) {
  const confirmModal = document.getElementById("confirmModal");
  if (!confirmModal) return;
  
  const titleEl = confirmModal.querySelector(".confirm-title");
  const msgEl = confirmModal.querySelector(".confirm-message");
  const cancelBtn = document.getElementById("confirmCancelBtn");
  const okBtn = document.getElementById("confirmOkBtn");
  
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (okBtn) {
    okBtn.textContent = okText;
    if (okText === "Sign Out" || okText === "ထွက်ရန်") {
      okBtn.style.background = "#ff3b30";
      okBtn.style.borderColor = "#ff3b30";
    } else {
      okBtn.style.background = "var(--ios-accent)";
      okBtn.style.borderColor = "var(--ios-accent)";
    }
  }
  
  confirmModal.style.display = "flex";
  
  const cleanup = () => {
    confirmModal.style.display = "none";
    cancelBtn.removeEventListener("click", onCancelClick);
    okBtn.removeEventListener("click", onOkClick);
  };
  
  const onCancelClick = () => {
    cleanup();
  };
  
  const onOkClick = () => {
    cleanup();
    if (onConfirm) onConfirm();
  };
  
  cancelBtn.addEventListener("click", onCancelClick);
  okBtn.addEventListener("click", onOkClick);
}

// Safe localStorage wrapper to prevent SecurityError in incognito/private modes
const safeStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore write errors in private mode
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  }
};

// ===== DOM References =====
const form = document.getElementById("ttsForm");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voice");
const localeHint = document.getElementById("localeHint");
const rateInput = document.getElementById("rate");
const pitchInput = document.getElementById("pitch");
const rateValue = document.getElementById("rateValue");
const pitchValue = document.getElementById("pitchValue");
const charCount = document.getElementById("charCount");
const statusCard = document.getElementById("statusCard");
const statusPill = document.getElementById("statusPill");
const generateButton = document.getElementById("generateButton");
const downloadLink = document.getElementById("downloadLink");
const audioPlayer = document.getElementById("audioPlayer");

const voiceScroller = document.getElementById("voiceScroller");
const miniBars = document.getElementById("miniBars");
const miniTitle = document.getElementById("miniTitle");
const miniSub = document.getElementById("miniSub");

const chatSendButton = document.getElementById("chatSendButton");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatMessages = document.getElementById("chatMessages");
const loginHeaderBtn = document.getElementById("loginHeaderBtn");
const lockSignInBtn = document.getElementById("lockSignInBtn");
const ttsLockOverlay = document.getElementById("ttsLockOverlay");
const lockTtsSignInBtn = document.getElementById("lockTtsSignInBtn");
const statusDot = document.querySelector(".status-dot");
const onlineCountEl = document.getElementById("onlineCount");
const chatInputLockOverlay = document.getElementById("chatInputLockOverlay");
const chatInputArea = document.getElementById("chatInputArea");

const miniPlayer = document.getElementById("miniPlayer");
const portalContainer = document.getElementById("portalContainer");
const appLayoutWrapper = document.getElementById("appLayoutWrapper");
const goTtsBtn = document.getElementById("goTtsBtn");
const goChatBtn = document.getElementById("goChatBtn");
const homeBtn = document.getElementById("homeBtn");
const loadingModal = document.getElementById("loadingModal");

const appContainer = document.querySelector(".app-container");
const chatCard = document.querySelector(".telegram-chat-card");

let currentAudioUrl = null;
const downloadedMediaCache = {};

const sampleText =
  "Welcome to burmeserecp dot tech. This sample demonstrates clear, professional text to speech generated with Edge TTS.";

// Custom country-locale flags helper
const localeFlags = {
  "en-US": "🇺🇸", "en-GB": "🇬🇧", "en-AU": "🇦🇺", "en-CA": "🇨🇦", "en-IN": "🇮🇳",
  "my-MM": "🇲🇲", "th-TH": "🇹🇭", "ja-JP": "🇯🇵", "ko-KR": "🇰🇷", "zh-CN": "🇨🇳",
  "vi-VN": "🇻🇳", "ms-MY": "🇲🇾", "id-ID": "🇮🇩", "fil-PH": "🇵🇭"
};

// ===== Utility functions =====
function setStatus(message, tone = "idle") {
  if (statusCard) statusCard.textContent = message;
  
  if (statusPill) {
    statusPill.textContent = tone === "loading" ? "Generating…" : tone === "ready" ? "Ready" : "Idle";
    statusPill.style.background = tone === "ready" ? "rgba(48, 209, 88, 0.15)" : "rgba(var(--ios-accent-rgb), 0.15)";
    statusPill.style.color = tone === "ready" ? "var(--ios-green)" : "var(--ios-accent)";
  }
}

const isLocalHost = (hn) => {
  return hn === "localhost" || hn === "127.0.0.1" || hn === "0.0.0.0" || 
         hn.startsWith("192.168.") || hn.startsWith("10.") || hn.startsWith("172.") || 
         hn.endsWith(".local");
};
const isLocalDev = isLocalHost(window.location.hostname) || window.location.port === "8080";
const API_BASE_URL = "";

function getApiUrl(url) {
  if (url.startsWith("/api/")) {
    return API_BASE_URL + url;
  }
  return url;
}

async function authFetch(url, options = {}) {
  const token = safeStorage.getItem("jwt_token");
  options.headers = options.headers || {};
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(getApiUrl(url), options);
  if (response.status === 401) {
    safeStorage.removeItem("jwt_token");
    safeStorage.setItem("tg_signed_in", "false");
    showToast("Session expired. Please log in again.");
    openAuthModal();
    initUserSession();
    throw new Error("Session expired.");
  }
  return response;
}

function showToast(message, duration = 3000) {
  let toast = document.getElementById("iosToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "iosToast";
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(255, 59, 48, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: white;
      padding: 12px 24px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(255, 59, 48, 0.3);
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.offsetHeight; // trigger reflow
  toast.style.opacity = "1";
  toast.style.transform = "translateX(-50%) translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
  }, duration);
}

function updateCount() {
  if (charCount && textInput) {
    charCount.textContent = `${textInput.value.length} / 5000`;
  }
}

function updateSliders() {
  if (rateInput && rateValue) {
    const r = Number(rateInput.value);
    rateValue.textContent = `${r > 0 ? '+' : ''}${r}%`;
  }
  if (pitchInput && pitchValue) {
    const p = Number(pitchInput.value);
    pitchValue.textContent = `${p > 0 ? '+' : ''}${p}Hz`;
  }
}

function setDownloadState(enabled) {
  if (!downloadLink) return;
  if (enabled) {
    downloadLink.classList.remove("disabled");
  } else {
    downloadLink.classList.add("disabled");
    downloadLink.removeAttribute("href");
  }
}

function updateLocaleHint() {
  if (voiceSelect && localeHint) {
    const selected = voiceSelect.selectedOptions[0];
    localeHint.value = selected?.dataset.locale || "Auto";
  }
}

// ===== Voice Selection Rendering =====
function renderVoiceCards() {
  if (!voiceScroller || !voiceSelect) return;
  voiceScroller.innerHTML = "";
  const options = [...voiceSelect.options];
  
  // Show first 15 voices or all if short
  const visible = options.slice(0, 15);

  visible.forEach((option, i) => {
    const card = createVoiceCard(option, i);
    voiceScroller.appendChild(card);
  });

  if (options.length > 15) {
    const more = document.createElement("div");
    more.className = "spotlight-card";
    more.innerHTML = `
      <div class="spotlight-name" style="font-weight: 600;">${TRANSLATIONS[currentLang]["more-voices"]}</div>
      <div class="spotlight-lang">${options.length - 15} ${TRANSLATIONS[currentLang]["hidden-voices"]}</div>
    `;
    more.addEventListener("click", () => {
      voiceScroller.innerHTML = "";
      options.forEach((opt, j) => {
        voiceScroller.appendChild(createVoiceCard(opt, j));
      });
    });
    voiceScroller.appendChild(more);
  }
}

function createVoiceCard(option, index) {
  const card = document.createElement("div");
  card.className = "spotlight-card";
  if (option.selected) card.classList.add("active");

  const label = option.textContent;
  // Ensure we get the full name before the " (Burmese)" or " (Multilingual)" details
  const shortName = label.includes(" (") ? label.split(" (")[0] : label;
  const lang = option.dataset.locale || "en-US";
  
  card.innerHTML = `
    <div class="spotlight-name" title="${label}" style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${shortName}</div>
    <div class="spotlight-lang" style="font-size: 11px; opacity: 0.6;">${lang}</div>
  `;

  card.addEventListener("click", () => {
    voiceSelect.value = option.value;
    updateLocaleHint();
    voiceScroller.querySelectorAll(".spotlight-card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");
    if (miniSub) miniSub.textContent = label;
  });

  return card;
}

// ===== Load voices from API =====
async function loadVoices() {
  if (!voiceSelect) return;
  voiceSelect.innerHTML = `<option>${currentLang === 'en' ? 'Loading voices...' : 'အသံများ တင်နေသည်...'}</option>`;
  try {
    const token = safeStorage.getItem("jwt_token") || "";
    const response = await fetch(getApiUrl(`/api/voices?user_token=${encodeURIComponent(token)}`));
    if (!response.ok) throw new Error("Could not load voices.");
    const voices = await response.json();

    voiceSelect.innerHTML = "";
    for (const voice of voices) {
      const option = document.createElement("option");
      option.value = voice.short_name;
      option.textContent = (voice.locked ? "🔒 " : "") + voice.label;
      option.dataset.locale = voice.locale;
      option.dataset.locked = voice.locked ? "true" : "false";
      voiceSelect.appendChild(option);
    }

    const preferredVoice =
      [...voiceSelect.options].find((o) =>
        o.value.includes("en-US-AvaMultilingualNeural")
      ) || [...voiceSelect.options][0];

    if (preferredVoice) preferredVoice.selected = true;
    updateLocaleHint();
    renderVoiceCards();
    setStatus(TRANSLATIONS[currentLang]["studio-ready-msg"]);
  } catch (error) {
    voiceSelect.innerHTML = `<option>${currentLang === 'en' ? 'Voice loading failed' : 'အသံတင်ခြင်း မအောင်မြင်ပါ'}</option>`;
    setStatus(TRANSLATIONS[currentLang]["unable-load-voices"]);
    if (voiceScroller) {
      voiceScroller.innerHTML = `
        <div class="spotlight-card placeholder-card">
          <div class="spotlight-emoji">⚠️</div>
          <div class="spotlight-name">${TRANSLATIONS[currentLang]["offline-card"]}</div>
          <div class="spotlight-lang">${TRANSLATIONS[currentLang]["no-connection"]}</div>
        </div>
      `;
    }
  }
}

// ===== Events =====

if (voiceSelect) voiceSelect.addEventListener("change", updateLocaleHint);
if (textInput) textInput.addEventListener("input", updateCount);
if (rateInput) rateInput.addEventListener("input", updateSliders);
if (pitchInput) pitchInput.addEventListener("input", updateSliders);

// ===== Telegram-style Inline TTS Generated Audio Player =====
function renderGeneratedAudioPlayer(audioBlob, audioUrl, voiceName) {
  const container = document.getElementById("generatedAudioContainer");
  if (!container) return;

  container.style.display = "block";
  const sizeMB = (audioBlob.size / 1024 / 1024).toFixed(2) + " MB";

  container.innerHTML = `
    <div class="generated-audio-card">
      <button class="audio-play-icon" id="generatedAudioPlayBtn" type="button">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-left: 2px;"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <div class="audio-info">
        <div class="audio-name">${voiceName} Voice Studio</div>
        <div class="audio-duration-size" id="generatedAudioDurationSize">0:00 / 0:00</div>
        <div class="audio-progress-bar-container" id="generatedAudioProgressContainer">
          <div class="audio-progress-bar-fill" id="generatedAudioProgressFill"></div>
        </div>
      </div>
      <div class="audio-actions">
        <button class="ios-btn secondary small-btn" id="generatedAudioSendBtn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 12px; height: 12px; margin-right: 3px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          <span>Share</span>
        </button>
        <a class="ios-btn icon-only circle-btn" id="generatedAudioDownloadBtn" href="${audioUrl}" download="burmeserecp-tts.mp3" style="width: 28px; height: 28px; border-radius: 50%; border: 0.5px solid var(--ios-border); display: flex; align-items: center; justify-content: center; color: var(--ios-accent);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>
      </div>
    </div>
  `;

  const audio = new Audio(audioUrl);
  audio.preload = "auto";

  const playBtn = document.getElementById("generatedAudioPlayBtn");
  const timeLabel = document.getElementById("generatedAudioDurationSize");
  const progressFill = document.getElementById("generatedAudioProgressFill");
  const progressContainer = document.getElementById("generatedAudioProgressContainer");
  const shareBtn = document.getElementById("generatedAudioSendBtn");

  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  audio.addEventListener("loadedmetadata", () => {
    timeLabel.textContent = `0:00 / ${formatTime(audio.duration)} (${sizeMB})`;
  });

  audio.addEventListener("timeupdate", () => {
    const cur = audio.currentTime;
    const dur = audio.duration || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;
    progressFill.style.width = pct + "%";
    timeLabel.textContent = `${formatTime(cur)} / ${formatTime(dur)} (${sizeMB})`;
  });

  audio.addEventListener("ended", () => {
    playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-left: 2px;"><path d="M8 5v14l11-7z"/></svg>`;
    progressFill.style.width = "0%";
  });

  playBtn.addEventListener("click", () => {
    document.querySelectorAll("audio, video").forEach(el => {
      el.pause();
    });

    if (audio.paused) {
      audio.play().then(() => {
        playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
      }).catch(err => console.error(err));
    } else {
      audio.pause();
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px; margin-left: 2px;"><path d="M8 5v14l11-7z"/></svg>`;
    }
  });

  progressContainer.addEventListener("click", (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const dur = audio.duration || 0;
    audio.currentTime = pos * dur;
  });

  shareBtn.addEventListener("click", async () => {
    if (!isUserSignedIn) {
      showToast(currentLang === 'en' ? "Please sign in to share in chat." : "ချက်တင်တွင် မျှဝေရန် ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။");
      openAuthModal();
      return;
    }

    const originalText = shareBtn.innerHTML;
    shareBtn.disabled = true;
    shareBtn.innerHTML = "⏳ Sharing...";

    try {
      const ttsFileName = "generated-tts-" + Date.now() + ".mp3";
      const resPresign = await authFetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: ttsFileName, content_type: "audio/mpeg" })
      });

      if (!resPresign.ok) throw new Error("Presign request failed");
      const presignData = await resPresign.json();

      const resUpload = await fetch(presignData.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "audio/mpeg",
          "x-amz-acl": "public-read"
        },
        body: audioBlob
      });

      if (!resUpload.ok) throw new Error("Failed to upload audio to storage");

      if (socket && socket.readyState === WebSocket.OPEN) {
        const tempId = "temp-upload-" + Date.now();
        const payload = {
          text: "",
          avatarBg: "",
          avatar_url: myAvatarUrl,
          tempId: tempId,
          attachment: {
            url: presignData.download_url,
            filename: ttsFileName,
            content_type: "audio/mpeg",
            size: audioBlob.size
          }
        };
        socket.send(JSON.stringify(payload));
        showToast(currentLang === 'en' ? "Audio shared to Community Chat!" : "အသံဖိုင်ကို Community ချက်တင်သို့ မျှဝေပြီးပါပြီ။");
        showChatPage();
      } else {
        throw new Error("Chat connection is offline.");
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to share audio.");
    } finally {
      shareBtn.innerHTML = originalText;
      shareBtn.disabled = false;
    }
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isUserSignedIn) {
      openAuthModal();
      return;
    }

    const scriptVal = textInput ? textInput.value.trim() : "";
    if (!scriptVal) {
      showToast(currentLang === 'en' ? "Please type or paste your script first!" : "ကျေးဇူးပြု၍ ဇာတ်ညွှန်းစာသား အရင်ရေးပါ!");
      if (textInput) textInput.focus();
      return;
    }

    // No fullscreen progress modal, show at bottom bar instead
    setStatus(TRANSLATIONS[currentLang]["generating-voice"], "loading");
    if (generateButton) {
      generateButton.disabled = true;
      const btnSpan = generateButton.querySelector("span:last-child");
      if (btnSpan) btnSpan.textContent = TRANSLATIONS[currentLang]["generating"];
    }
    setDownloadState(false);
    
    // Show skeleton shimmer inside generatedAudioContainer
    const generatedAudioContainer = document.getElementById("generatedAudioContainer");
    if (generatedAudioContainer) {
      generatedAudioContainer.style.display = "block";
      generatedAudioContainer.innerHTML = `
        <div class="generated-audio-card-skeleton">
          <div class="skeleton-play-btn"></div>
          <div class="skeleton-info">
            <div class="skeleton-line-title"></div>
            <div class="skeleton-line-detail"></div>
          </div>
        </div>
      `;
    }

    // Show miniPlayer immediately and set to generating state
    if (miniPlayer) {
      miniPlayer.style.display = "block";
      miniPlayer.classList.add("generating");
    }
    if (miniTitle) miniTitle.textContent = TRANSLATIONS[currentLang]["generating-player"];
    const selectedVoiceText = voiceSelect && voiceSelect.selectedOptions && voiceSelect.selectedOptions[0] ? voiceSelect.selectedOptions[0].textContent : "Voice";
    if (miniSub) miniSub.textContent = selectedVoiceText;

    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = null;
    }

    try {
      const payload = {
        text: textInput.value.trim(),
        voice: voiceSelect.value,
        rate: Number(rateInput.value),
        pitch: Number(pitchInput.value),
      };

      const response = await authFetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || TRANSLATIONS[currentLang]["generation-failed"]);
      }

      const audioBlob = await response.blob();
      currentAudioUrl = URL.createObjectURL(audioBlob);
      if (audioPlayer) audioPlayer.src = currentAudioUrl;
      if (downloadLink) downloadLink.href = currentAudioUrl;
      setDownloadState(true);
      if (miniPlayer) miniPlayer.style.display = "block";
      setStatus(TRANSLATIONS[currentLang]["audio-ready-desc"], "ready");
      if (miniTitle) miniTitle.textContent = TRANSLATIONS[currentLang]["audio-ready"];
      if (miniSub) miniSub.textContent = selectedVoiceText;
      
      // Render our inline Telegram-style audio player
      renderGeneratedAudioPlayer(audioBlob, currentAudioUrl, selectedVoiceText);
    } catch (error) {
      setStatus(error.message || TRANSLATIONS[currentLang]["something-wrong"]);
      if (miniTitle) miniTitle.textContent = TRANSLATIONS[currentLang]["error"];
      showToast(error.message || TRANSLATIONS[currentLang]["something-wrong"]);
      if (!currentAudioUrl && miniPlayer) {
        miniPlayer.style.display = "none";
      }
      const generatedAudioContainer = document.getElementById("generatedAudioContainer");
      if (generatedAudioContainer) {
        generatedAudioContainer.style.display = "none";
        generatedAudioContainer.innerHTML = "";
      }
    } finally {
      // hideProgressModal();
      if (miniPlayer) {
        miniPlayer.classList.remove("generating");
      }
      if (generateButton) {
        generateButton.disabled = false;
        const btnSpan = generateButton.querySelector("span:last-child");
        if (btnSpan) btnSpan.textContent = TRANSLATIONS[currentLang]["generate-btn"];
      }
    }
  });
}

// ===== Mini Player Dismiss Button =====
const miniDismissBtn = document.getElementById("miniDismissBtn");
if (miniDismissBtn) {
  miniDismissBtn.addEventListener("click", () => {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
    if (miniPlayer) {
      miniPlayer.style.display = "none";
      miniPlayer.classList.remove("generating");
    }
  });
}

// Prevent double download spam by intercepting and showing "Downloading..."
if (downloadLink) {
  downloadLink.addEventListener("click", async (e) => {
    // If we've already generated the blob, let's grab it once and download
    if (downloadLink.classList.contains("disabled") || downloadLink.classList.contains("downloading-active")) {
      e.preventDefault();
      return;
    }
    
    const audioUrl = downloadLink.getAttribute("href");
    if (!audioUrl) return;
    
    // Prevent default trigger
    e.preventDefault();
    
    // Lock link state
    downloadLink.classList.add("downloading-active");
    const originalTitle = downloadLink.getAttribute("title");
    downloadLink.setAttribute("title", currentLang === "en" ? "Downloading..." : "ဒေါင်းလုပ်ဆွဲနေသည်...");
    showToast(currentLang === "en" ? "Downloading audio..." : "အသံဖိုင်ဒေါင်းလုဒ်လုပ်နေသည်...");
    
    try {
      const res = await fetch(audioUrl);
      const blob = await res.blob();
      const tempUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = tempUrl;
      tempLink.download = downloadLink.getAttribute("download") || "burmeserecp-tts.mp3";
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(tempUrl);
    } catch (err) {
      console.error("Audio download error:", err);
    } finally {
      // Release download status
      setTimeout(() => {
        downloadLink.classList.remove("downloading-active");
        downloadLink.setAttribute("title", originalTitle);
      }, 1000);
    }
  });
}

// ===== Mini Player Visualizer Sync =====
if (miniBars && audioPlayer) {
  audioPlayer.addEventListener("play", () => {
    miniBars.classList.add("playing");
    if (miniTitle) miniTitle.textContent = TRANSLATIONS[currentLang]["now-playing"];
  });
  audioPlayer.addEventListener("pause", () => {
    miniBars.classList.remove("playing");
    if (miniTitle) miniTitle.textContent = TRANSLATIONS[currentLang]["paused"];
  });
  audioPlayer.addEventListener("ended", () => {
    miniBars.classList.remove("playing");
    if (miniTitle) miniTitle.textContent = TRANSLATIONS[currentLang]["audio-ready"];
  });
}

// ===== Translation Map & Language Switcher Logic =====
const TRANSLATIONS = {
  en: {
    "nav-title": "Burmese Recap",
    "app-title": "Generate Text To Speech",
    "app-subtitle": "Create natural-sounding voiceovers instantly using advanced text-to-speech engine.",
    "script-title": "SCRIPT",
    "script-placeholder": "Type or paste your script here...",
    "voice-selector-label": "VOICE SELECTOR",
    "tuning-control-label": "TUNING CONTROL",
    "speed-label": "Speed",
    "pitch-label": "Pitch",
    "generate-btn": "Generate Voice",
    "login-btn": "Sign In",
    "logout-btn": "Sign Out",
    "lock-text": "Sign in to send messages",
    "lock-tts-text": "Sign in to generate speech",
    "lock-signin-btn": "Sign In / Sign Up",
    "modal-title": "Community Account",
    "tab-signin": "Sign In",
    "tab-signup": "Sign Up",
    "signin-desc": "Enter your registered email to join the chat.",
    "label-email": "Email Address",
    "btn-signin": "Sign In",
    "signup-desc": "Create an account to start sharing messages.",
    "label-username": "Username / Nickname",
    "label-avatar": "Choose Avatar Profile",
    "label-custom-avatar": "Or Custom Avatar URL",
    "btn-signup": "Create Account",
    "studio-ready-msg": "Studio ready — pick a voice and start creating.",
    "unable-load-voices": "Unable to load voices. Check connection and refresh.",
    "sample-loaded": "Sample loaded — hit Generate when ready.",
    "generation-failed": "TTS generation failed.",
    "something-wrong": "Something went wrong.",
    "error": "Error",
    "chat-title": "BurmeseRecap Community",
    "connecting": "Connecting...",
    "updating": "Updating...",
    "offline": "Waiting for network...",
    "generating": "Generating...",
    "generating-voice": "Generating voice sample…",
    "generating-player": "Generating…",
    "audio-ready": "Audio Ready",
    "audio-ready-desc": "Audio ready — play or download.",
    "now-playing": "Now Playing",
    "paused": "Paused",
    "unsend": "Unsend",
    "copy-text": "Copy Text",
    "sign-in-prompt": "Sign in to send messages...",
    "write-message": "Write a message...",
    "sign-out-confirm": "Do you want to sign out from {username}?",
    "more-voices": "More Voices",
    "hidden-voices": "hidden",
    "offline-card": "Offline",
    "no-connection": "No connection",
    "pricing-title": "MEMBERSHIP PLANS",
    "plan-basic-badge": "Starter",
    "plan-basic-name": "Basic Plan",
    "plan-premium-badge": "Popular",
    "plan-premium-name": "Premium Plan",
    "plan-pro-badge": "Unlimited",
    "plan-pro-name": "Pro Plan",
    "plan-period-month": "/ month",
    "plan-choose": "Select Plan",
    "plan-feature-1": "100,000 Characters",
    "plan-feature-2": "Standard Voices",
    "plan-feature-3": "Email Support",
    "plan-feature-4": "500,000 Characters",
    "plan-feature-5": "Premium Neural Voices",
    "plan-feature-6": "Priority Support",
    "plan-feature-7": "Unlimited Characters",
    "plan-feature-8": "All Premium Voices",
    "plan-feature-9": "24/7 Dedicated Support"
  },
  my: {
    "nav-title": "Burmese Recap",
    "app-title": "အသံ ဖန်တီးစနစ်",
    "app-subtitle": "အဆင့်မြင့် စာဖတ်စနစ်ကို အသုံးပြုပြီး သဘာဝကျသော နောက်ခံစကားပြောသံများကို ချက်ချင်းဖန်တီးပါ။",
    "script-title": "ဇာတ်ညွှန်း",
    "script-placeholder": "သင်၏ဇာတ်ညွှန်းကို ဤနေရာတွင် ရိုက်ထည့်ပါ သို့မဟုတ် ကူးယူထည့်ပါ...",
    "voice-selector-label": "အသံ ရွေးချယ်ရန်",
    "tuning-control-label": "အသံ ချိန်ညှိမှု",
    "speed-label": "မြန်နှုန်း",
    "pitch-label": "အသံ အနိမ့်အမြင့်",
    "generate-btn": "အသံ ထုတ်လုပ်ရန်",
    "login-btn": "ဝင်ရောက်ရန်",
    "logout-btn": "ထွက်ရန်",
    "lock-text": "မက်ဆေ့ခ်ျပို့ရန် အကောင့်ဝင်ပါ",
    "lock-tts-text": "အသံဖန်တီးရန် အကောင့်ဝင်ပါ",
    "lock-signin-btn": "အကောင့်ဝင်ရန် / အကောင့်ဖွင့်ရန်",
    "modal-title": "အဖွဲ့အစည်း အကောင့်",
    "tab-signin": "အကောင့်ဝင်ရန်",
    "tab-signup": "အကောင့်ဖွင့်ရန်",
    "signin-desc": "စကားပြောခန်းသို့ ဝင်ရောက်ရန် သင်မှတ်ပုံတင်ထားသော အီးမေးလ်ကို ထည့်ပါ။",
    "label-email": "အီးမေးလ် လိပ်စာ",
    "btn-signin": "အကောင့်ဝင်ရန်",
    "signup-desc": "မက်ဆေ့ခ်ျများ စတင်ဝေမျှရန် အကောင့်တစ်ခု ပြုလုပ်ပါ။",
    "label-username": "အသုံးပြုသူအမည် / အမည်ပြောင်",
    "label-avatar": "ပရိုဖိုင်ပုံ ရွေးချယ်ရန်",
    "label-custom-avatar": "သို့မဟုတ် စိတ်ကြိုက်ပရိုဖိုင်လင့်ခ်",
    "btn-signup": "အကောင့်ဖွင့်ရန်",
    "studio-ready-msg": "စတူဒီယို အသင့်ဖြစ်ပါပြီ — အသံတစ်ခုရွေးချယ်ပြီး စတင်ထုတ်လုပ်ပါ။",
    "unable-load-voices": "အသံများကို တင်၍မရပါ။ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ပြန်ဖွင့်ပါ။",
    "sample-loaded": "နမူနာ တင်ပြီးပါပြီ — အသင့်ဖြစ်ပါက 'ထုတ်လုပ်ရန်' ကို နှိပ်ပါ။",
    "generation-failed": "အသံ ထုတ်လုပ်မှု မအောင်မြင်ပါ။",
    "something-wrong": "တစ်စုံတစ်ခု မှားယွင်းနေပါသည်။",
    "error": "အမှား",
    "chat-title": "BurmeseRecap အဖွဲ့အစည်း",
    "connecting": "ချိတ်ဆက်နေသည်...",
    "updating": "မွမ်းမံနေသည်...",
    "offline": "ကွန်ရက် စောင့်ဆိုင်းနေသည်...",
    "generating": "ထုတ်လုပ်နေသည်...",
    "generating-voice": "အသံနမူနာ ထုတ်လုပ်နေသည်…",
    "generating-player": "ထုတ်လုပ်နေသည်…",
    "audio-ready": "အသံ အဆင်သင့်ဖြစ်ပါပြီ",
    "audio-ready-desc": "အသံ အဆင်သင့်ဖြစ်ပါပြီ — ဖွင့်ပါ သို့မဟုတ် ဒေါင်းလုဒ်လုပ်ပါ။",
    "now-playing": "ဖွင့်နေသည်",
    "paused": "ရပ်တန့်ထားသည်",
    "unsend": "မက်ဆေ့ခ်ျဖျက်ရန်",
    "copy-text": "စာသားကူးရန်",
    "sign-in-prompt": "မက်ဆေ့ခ်ျပို့ရန် အကောင့်ဝင်ပါ...",
    "write-message": "မက်ဆေ့ခ်ျရေးရန်...",
    "sign-out-confirm": "{username} အကောင့်မှ ထွက်လိုပါသလား?",
    "more-voices": "အခြား အသံများ",
    "hidden-voices": "ခု ဝှက်ထားသည်",
    "offline-card": "လိုင်းမရှိပါ",
    "no-connection": "ချက်ဆက်မှုမရှိပါ",
    "pricing-title": "အသင်းဝင် အစီအစဉ်များ",
    "plan-basic-badge": "အခြေခံစတင်ရန်",
    "plan-basic-name": "အခြေခံ အစီအစဉ်",
    "plan-premium-badge": "လူကြိုက်အများဆုံး",
    "plan-premium-name": "အဆင့်မြင့် အစီအစဉ်",
    "plan-pro-badge": "အကန့်အသတ်မဲ့",
    "plan-pro-name": "ပရို အစီအစဉ်",
    "plan-period-month": "/ လစဉ်",
    "plan-choose": "အစီအစဉ် ရွေးချယ်ရန်",
    "plan-feature-1": "စာလုံးရေ ၁၀၀,၀၀၀ ဖတ်နိုင်သည်။",
    "plan-feature-2": "ပုံမှန် အသံစနစ်များ",
    "plan-feature-3": "အီးမေးလ်ဖြင့် ကူညီပံ့ပိုးမှု",
    "plan-feature-4": "စာလုံးရေ ၅၀၀,၀၀၀ ဖတ်နိုင်သည်။",
    "plan-feature-5": "အဆင့်မြင့် ဉာဏ်ရည်တု အသံစနစ်များ",
    "plan-feature-6": "ဦးစားပေး ကူညီပံ့ပိုးမှု",
    "plan-feature-7": "စာလုံးရေ အကန့်အသတ်မရှိ ဖတ်နိုင်သည်။",
    "plan-feature-8": "အဆင့်မြင့် အသံစနစ်အားလုံး အသုံးပြုနိုင်သည်။",
    "plan-feature-9": "၂၄/၇ သီးသန့် ကူညီပံ့ပိုးမှု"
  }
};

let currentLang = safeStorage.getItem("tg_lang") || "en";

function updateLanguage(lang) {
  currentLang = lang;
  safeStorage.setItem("tg_lang", lang);

  // Update DOM elements with data-translate
  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
    const translation = TRANSLATIONS[lang][key];
    if (translation) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  // Toggle active segment in the header lang selector
  const enBtn = document.getElementById("langEnBtn");
  const mmBtn = document.getElementById("langMmBtn");
  if (enBtn && mmBtn) {
    if (lang === "en") {
      enBtn.classList.add("active");
      mmBtn.classList.remove("active");
    } else {
      enBtn.classList.remove("active");
      mmBtn.classList.add("active");
    }
  }

  // Update dynamic texts
  initUserSession();
}

// Session State
let isUserSignedIn = safeStorage.getItem("tg_signed_in") === "true";
let myUsername = "";
let myAvatarUrl = "";
let myEmail = "";

function updateCreditsDisplay() {
  const badge = document.getElementById("userCreditsBadge");
  if (!badge) return;
  if (isUserSignedIn) {
    const plan = safeStorage.getItem("user_plan") || "Free";
    const credits = safeStorage.getItem("user_credits") || "0";
    badge.textContent = `${plan}: ${Number(credits).toLocaleString()} chars`;
    badge.style.display = "inline-flex";
  } else {
    badge.style.display = "none";
  }
}

function updatePricingPlansModalState(currentPlan) {
  document.querySelectorAll(".plan-btn").forEach(btn => {
    const plan = btn.getAttribute("data-plan");
    if (plan === currentPlan) {
      btn.textContent = currentLang === "en" ? "Active Plan" : "လက်ရှိ အသုံးပြုနေသည်";
      btn.disabled = true;
      btn.className = "ios-btn secondary plan-btn";
    } else {
      btn.textContent = currentLang === "en" ? "Select Plan" : "ရွေးချယ်မည်";
      btn.disabled = false;
      if (plan === "Premium") {
        btn.className = "ios-btn primary plan-btn";
      } else {
        btn.className = "ios-btn secondary plan-btn";
      }
    }
  });
}

function initUserSession() {
  isUserSignedIn = safeStorage.getItem("tg_signed_in") === "true";

  if (isUserSignedIn) {
    myUsername = safeStorage.getItem("tg_username");
    myAvatarUrl = safeStorage.getItem("tg_avatar_url") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";
    myEmail = safeStorage.getItem("tg_email");
    
    updateCreditsDisplay();
    authFetch("/api/profile")
      .then(res => res.json())
      .then(profile => {
        safeStorage.setItem("user_plan", profile.plan);
        safeStorage.setItem("user_credits", profile.credits_remaining);
        updateCreditsDisplay();
        updatePricingPlansModalState(profile.plan);
      })
      .catch(err => console.error("Failed to sync profile:", err));
    
    // Unlock Chat Input
    if (chatInputLockOverlay) chatInputLockOverlay.style.display = "none";
    if (chatInputArea) chatInputArea.style.display = "flex";
    if (chatMessageInput) {
      chatMessageInput.removeAttribute("disabled");
      chatMessageInput.placeholder = TRANSLATIONS[currentLang]["write-message"];
    }
    if (chatSendButton) chatSendButton.removeAttribute("disabled");

    // Unlock Speech Generation
    if (ttsLockOverlay) ttsLockOverlay.style.display = "none";
    if (generateButton) generateButton.style.display = "inline-flex";
    
    // Update Header Button to Sign Out
    if (loginHeaderBtn) {
      loginHeaderBtn.innerHTML = `<img src="${myAvatarUrl}" class="account-pic" style="border:none;border-radius:50%;object-fit:cover;" /> <span class="profile-btn-text">${TRANSLATIONS[currentLang]["logout-btn"]}</span>`;
      loginHeaderBtn.title = currentLang === "en" ? `Signed in as ${myUsername}. Click to Sign Out.` : `${myUsername} အဖြစ် အကောင့်ဝင်ထားသည်။ ထွက်ရန် နှိပ်ပါ။`;
    }
  } else {
    myUsername = "Guest";
    myAvatarUrl = "";
    myEmail = "";
    
    // Lock Chat Input
    if (chatInputLockOverlay) chatInputLockOverlay.style.display = "flex";
    if (chatInputArea) chatInputArea.style.display = "none";
    if (chatMessageInput) {
      chatMessageInput.setAttribute("disabled", "true");
      chatMessageInput.placeholder = TRANSLATIONS[currentLang]["sign-in-prompt"];
    }
    if (chatSendButton) chatSendButton.setAttribute("disabled", "true");

    // Lock Speech Generation
    if (ttsLockOverlay) ttsLockOverlay.style.display = "flex";
    if (generateButton) generateButton.style.display = "none";
    
    // Update Header Button to Sign In
    if (loginHeaderBtn) {
      loginHeaderBtn.innerHTML = `
        <span class="profile-btn-icon" style="display: inline-flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span class="profile-btn-text">${TRANSLATIONS[currentLang]["login-btn"]}</span>
      `;
      loginHeaderBtn.title = TRANSLATIONS[currentLang]["lock-signin-btn"];
    }
  }
}

let socket = null;
let reconnectInterval = 2000;
let maxReconnectInterval = 10000;
let currentReconnectDelay = reconnectInterval;
let reconnectTimer = null;

function formatCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

// Custom country-locale flags helper or generic fallback
function getInitials(name) {
  return name ? name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) : "G";
}

// ===== Apple & Telegram Emojis Mapping & Rendering System =====

const animatedEmojiMap = {
  // Smileys
  "😊": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Smiling%20Face.webp",
  "😂": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Face%20With%20Tears%20Of%20Joy.webp",
  "🤣": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Rolling%20On%20The%20Floor%20Laughing.webp",
  "😍": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Smiling%20Face%20With%20Hearts.webp",
  "🥰": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Smiling%20Face%20With%20Hearts.webp",
  "😘": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Face%20Blowing%20A%20Kiss.webp",
  "😭": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Loudly%20Crying%20Face.webp",
  "🤔": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Thinking%20Face.webp",
  "😮": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Face%20With%20Open%20Mouth.webp",
  "🤩": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Star%20Struck.webp",
  "😜": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Winking%20Face%20With%20Tongue.webp",
  "😎": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Smiling%20Face%20With%20Sunglasses.webp",
  "🥺": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Pleading%20Face.webp",
  "😡": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Pouting%20Face.webp",
  "🤯": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Exploding%20Head.webp",
  "🤗": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Smiling%20Face%20With%20Open%20Hands.webp",
  "🫡": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Saluting%20Face.webp",
  "🤫": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Shushing%20Face.webp",
  "😴": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Sleeping%20Face.webp",
  "💩": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Pile%20Of%20Poo.webp",
  "👻": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Ghost.webp",
  "💀": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Smileys/Skull.webp",
  // Gestures & People
  "👍": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Thumbs%20Up.webp",
  "👎": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Thumbs%20Down.webp",
  "👏": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Clapping%20Hands.webp",
  "🙏": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Folded%20Hands.webp",
  "👋": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Waving%20Hand.webp",
  "✌️": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Victory%20Hand.webp",
  "🤝": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Handshake.webp",
  "💪": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Flexed%20Biceps.webp",
  "👤": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/People/Bust%20In%20Silhouette.webp",
  // Symbols & Hearts
  "❤️": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Symbols/Red%20Heart.webp",
  "💔": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Symbols/Broken%20Heart.webp",
  "💯": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Symbols/Hundred%20Points.webp",
  "⭐": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Travel%20and%20Places/Star.webp",
  // Nature & Animals
  "🔥": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Fire.webp",
  "🐢": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Turtle.webp",
  "🦋": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Animals%20and%20Nature/Butterfly.webp",
  "🌈": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Travel%20and%20Places/Rainbow.webp",
  // Activity & Objects
  "🎉": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Activity/Party%20Popper.webp",
  "🎙️": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Objects/Studio%20Microphone.webp",
  "🎵": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Objects/Musical%20Note.webp",
  "🚀": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Travel%20and%20Places/Rocket.webp",
  "💎": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Objects/Gem%20Stone.webp",
  "🎯": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Telegram-Animated-Emojis/main/Activity/Bullseye.webp"
};

function emojiToHex(emoji) {
  return [...emoji].map(char => char.codePointAt(0).toString(16)).join("-");
}

function getEmojiHTML(emoji, size = 18) {
  const retryAttr = `onerror="if(!this.dataset.retries){this.dataset.retries=0}this.dataset.retries++;if(this.dataset.retries<3){setTimeout(()=>{this.src=this.src+'&r='+this.dataset.retries},800*this.dataset.retries)}else{this.style.display='none';if(this.parentElement){this.parentElement.querySelector('.emoji-shimmer').style.display='none'}}"`;
  const loadAttr = `onload="this.style.opacity='1';if(this.parentElement){this.parentElement.querySelector('.emoji-shimmer').style.display='none'}"`;
  const shimmer = `<span class="emoji-shimmer" style="position:absolute;top:0;left:0;width:${size}px;height:${size}px;border-radius:50%;"></span>`;
  const wrapper = `display:inline-flex;position:relative;width:${size}px;height:${size}px;vertical-align:middle;align-items:center;justify-content:center;flex-shrink:0;`;
  const imgStyle = `width:${size}px;height:${size}px;vertical-align:middle;opacity:0;transition:opacity 0.15s;`;
  if (animatedEmojiMap[emoji]) {
    return `<span style="${wrapper}">${shimmer}<img src="${animatedEmojiMap[emoji]}" class="ios-emoji animated" style="${imgStyle}" alt="${emoji}" ${loadAttr} ${retryAttr} loading="lazy" /></span>`;
  }
  const hex = emojiToHex(emoji);
  return `<span style="${wrapper}">${shimmer}<img src="https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/${hex}.png" class="ios-emoji" style="${imgStyle}" alt="${emoji}" ${loadAttr} ${retryAttr} /></span>`;
}

function parseMessageText(text) {
  // Safe HTML escape to prevent XSS before inserting innerHTML
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  return escaped.replace(emojiRegex, (match) => {
    return getEmojiHTML(match, 19);
  });
}

// Cache for optimistic reactions
window.messageReactionsMap = window.messageReactionsMap || {};

function toggleReactionOptimistically(messageId, emoji, msgBubble) {
  window.messageReactionsMap = window.messageReactionsMap || {};
  let reactions = window.messageReactionsMap[messageId] || {};
  // Deep copy reactions to prevent reference leaks
  reactions = JSON.parse(JSON.stringify(reactions));

  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }

  if (reactions[emoji].includes(myUsername)) {
    reactions[emoji] = reactions[emoji].filter(u => u !== myUsername);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    reactions[emoji].push(myUsername);
  }

  window.messageReactionsMap[messageId] = reactions;
  if (msgBubble) {
    renderReactions(msgBubble, messageId, reactions);
  }
}

// Render reactions wrapper inside the bubble container
function renderReactions(msgBubble, messageId, reactions) {
  window.messageReactionsMap = window.messageReactionsMap || {};
  if (reactions) {
    window.messageReactionsMap[messageId] = JSON.parse(JSON.stringify(reactions));
  } else {
    window.messageReactionsMap[messageId] = {};
  }
  let wrapper = msgBubble.querySelector('.msg-reactions-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'msg-reactions-wrapper';
    msgBubble.appendChild(wrapper);
  }
  wrapper.innerHTML = '';
  if (!reactions || Object.keys(reactions).length === 0) {
    wrapper.style.display = 'none';
    return;
  }
  wrapper.style.display = 'flex';

  Object.entries(reactions).forEach(([emoji, users]) => {
    if (!users || users.length === 0) return;
    const pill = document.createElement('div');
    pill.className = 'msg-reaction-pill';
    const hasReacted = users.includes(myUsername);
    if (hasReacted) {
      pill.classList.add('active');
    }
    
    // Show list of users who reacted on hover
    pill.title = users.join(', ');
    
    pill.innerHTML = `${getEmojiHTML(emoji, 13)} <span class="pill-count">${users.length}</span>`;
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isUserSignedIn) {
        openAuthModal();
        return;
      }
      toggleReactionOptimistically(messageId, emoji, msgBubble);
      socket.send(JSON.stringify({
        action: "react",
        message_id: messageId,
        emoji: emoji
      }));
    });
    wrapper.appendChild(pill);
  });
}

// Render desktop hover quick reaction bar
function renderHoverReactions(msgBubble, messageId) {
  let hoverBar = msgBubble.querySelector('.msg-hover-reactions');
  if (!hoverBar) {
    hoverBar = document.createElement('div');
    hoverBar.className = 'msg-hover-reactions';
    msgBubble.appendChild(hoverBar);
  }
  hoverBar.innerHTML = '';
  
  const emojis = ['👍', '❤️', '🔥', '😂', '👏', '🎉'];
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'tg-reaction-btn';
    btn.type = 'button';
    btn.innerHTML = getEmojiHTML(emoji, 20);
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!isUserSignedIn) {
        openAuthModal();
        return;
      }
      btn.classList.add('emoji-bounce');
      toggleReactionOptimistically(messageId, emoji, msgBubble);
      socket.send(JSON.stringify({
        action: "react",
        message_id: messageId,
        emoji: emoji
      }));
      setTimeout(() => {
        btn.classList.remove('emoji-bounce');
      }, 450);
    });
    hoverBar.appendChild(btn);
  });
}

// Show Telegram-style context menu
function showContextMenu(e, messageId, isSelf) {
  e.preventDefault();
  
  // Remove existing menu if any
  const existingMenu = document.querySelector('.tg-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  // Create menu container
  const menu = document.createElement('div');
  menu.className = 'tg-context-menu';

  // Create reaction row
  const reactionRow = document.createElement('div');
  reactionRow.className = 'tg-reaction-row';
  const emojis = ['👍', '❤️', '🔥', '😂', '👏', '🎉'];
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'tg-reaction-btn';
    btn.type = 'button';
    btn.innerHTML = getEmojiHTML(emoji, 22);
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!isUserSignedIn) {
        openAuthModal();
        menu.remove();
        return;
      }
      btn.classList.add('emoji-bounce');
      
      const msgEl = chatMessages.querySelector(`[data-msg-id="${messageId}"]`);
      const bubble = msgEl ? msgEl.querySelector('.msg-bubble') : null;
      toggleReactionOptimistically(messageId, emoji, bubble);

      socket.send(JSON.stringify({
        action: "react",
        message_id: messageId,
        emoji: emoji
      }));

      // Animate menu closing smoothly
      menu.style.transition = 'opacity 0.22s, transform 0.22s';
      menu.style.opacity = '0';
      menu.style.transform = 'scale(0.94)';
      setTimeout(() => {
        menu.remove();
      }, 220);
    });
    reactionRow.appendChild(btn);
  });
  menu.appendChild(reactionRow);

  // Unsend button for self, or Copy Text for others
  if (isSelf) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'tg-menu-item delete-item';
    deleteBtn.type = 'button';
    deleteBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
      ${TRANSLATIONS[currentLang]["unsend"]}
    `;
    deleteBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      socket.send(JSON.stringify({
        action: "delete",
        message_id: messageId
      }));
      menu.remove();
    });
    menu.appendChild(deleteBtn);
  } else {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'tg-menu-item';
    copyBtn.type = 'button';
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px;">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      ${TRANSLATIONS[currentLang]["copy-text"]}
    `;
    copyBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const msgEl = document.querySelector(`[data-msg-id="${messageId}"]`);
      if (msgEl) {
        const textEl = msgEl.querySelector('.msg-text');
        if (textEl) {
          navigator.clipboard.writeText(textEl.textContent).then(() => {
            console.log("Text copied to clipboard");
          }).catch(err => {
            console.error("Failed to copy text: ", err);
          });
        }
      }
      menu.remove();
    });
    menu.appendChild(copyBtn);
  }

  // Append to body
  document.body.appendChild(menu);

  // Position menu correctly near coordinates
  const menuWidth = menu.offsetWidth || 160;
  const menuHeight = menu.offsetHeight || 100;
  let left = e.clientX;
  let top = e.clientY;

  if (left + menuWidth > window.innerWidth) {
    left = window.innerWidth - menuWidth - 10;
  }
  if (top + menuHeight > window.innerHeight) {
    top = window.innerHeight - menuHeight - 10;
  }
  if (left < 10) left = 10;
  if (top < 10) top = 10;

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  menu.addEventListener('click', (ev) => {
    ev.stopPropagation();
  });
}

// ===== Telegram-style Media Download Placeholder with Circular Progress =====
function renderDownloadPlaceholder(attachDiv, attachment, type, successCallback) {
  const sizeMB = attachment.size ? (attachment.size / 1024 / 1024).toFixed(1) + " MB" : "Media";
  const aspectStyle = (attachment.width && attachment.height) ? `aspect-ratio: ${attachment.width} / ${attachment.height}; width: 100%;` : "width: 100%; height: 200px;";
  
  const container = document.createElement("div");
  container.className = "media-download-placeholder";
  container.style.cssText = `position: relative; width: 100%; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.45); overflow: hidden; border-radius: 8px; ${aspectStyle}`;
  
  const blurBg = document.createElement("div");
  blurBg.className = "media-blur-background";
  blurBg.style.cssText = "position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('images/community_logo.png') no-repeat center/cover; filter: blur(35px) brightness(0.5); opacity: 0.6; width: 100%; height: 100%;";
  container.appendChild(blurBg);
  
  const controlDiv = document.createElement("div");
  controlDiv.className = "media-download-control";
  controlDiv.style.cssText = "position: relative; z-index: 5; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;";
  
  const progressWrapper = document.createElement("div");
  progressWrapper.className = "download-progress-circle-wrapper";
  progressWrapper.style.cssText = "position: relative; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;";
  
  progressWrapper.innerHTML = `
    <svg width="50" height="50" style="position: absolute; transform: rotate(-90deg);">
      <circle stroke="rgba(255, 255, 255, 0.2)" stroke-width="3.5" fill="transparent" r="20" cx="25" cy="25"/>
      <circle class="progress-ring-fill" stroke="#ffffff" stroke-width="3.5" fill="transparent" r="20" cx="25" cy="25" stroke-dasharray="125.66" stroke-dashoffset="125.66" style="transition: stroke-dashoffset 0.1s;"/>
    </svg>
  `;
  
  const dlBtn = document.createElement("button");
  dlBtn.className = "media-download-action-btn";
  dlBtn.type = "button";
  dlBtn.style.cssText = "width: 36px; height: 36px; border-radius: 50%; background: rgba(0, 0, 0, 0.65); border: none; color: #ffffff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 2;";
  dlBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;
  progressWrapper.appendChild(dlBtn);
  
  controlDiv.appendChild(progressWrapper);
  
  const sizeLabel = document.createElement("span");
  sizeLabel.className = "media-download-size";
  sizeLabel.style.cssText = "color: #ffffff; font-size: 11px; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.6);";
  sizeLabel.textContent = sizeMB;
  controlDiv.appendChild(sizeLabel);
  
  container.appendChild(controlDiv);
  
  attachDiv.innerHTML = "";
  attachDiv.appendChild(container);
  
  const fillCircle = progressWrapper.querySelector(".progress-ring-fill");
  
  dlBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dlBtn.disabled = true;
    dlBtn.style.opacity = "0.5";
    
    dlBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width: 12px; height: 12px; animation: spin 1s linear infinite; color: #ffffff;">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
      </svg>
    `;
    
    const xhr = new XMLHttpRequest();
    xhr.open("GET", attachment.url, true);
    xhr.responseType = "blob";
    
    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        const currentMB = (event.loaded / 1024 / 1024).toFixed(1);
        const totalMB = (event.total / 1024 / 1024).toFixed(1);
        sizeLabel.textContent = `${currentMB} / ${totalMB} MB (${percent}%)`;
        
        const offset = 125.66 - (percent / 100) * 125.66;
        if (fillCircle) fillCircle.style.strokeDashoffset = offset;
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const localUrl = URL.createObjectURL(blob);
        downloadedMediaCache[attachment.url] = localUrl;
        successCallback(localUrl);
      } else {
        sizeLabel.textContent = "Error loading";
        dlBtn.disabled = false;
        dlBtn.style.opacity = "1";
        dlBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;
      }
    };
    
    xhr.onerror = () => {
      sizeLabel.textContent = "Failed";
      dlBtn.disabled = false;
      dlBtn.style.opacity = "1";
      dlBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;
    };
    
    xhr.send();
  });
}

// buildMessageElement: builds and returns a chat message DOM element without appending it.
// Used by both appendChatMessage and renderChatHistory (for batch history rendering).
function buildMessageElement(sender, text, isSelf, avatarBg = '', type = 'message', avatarUrl = '', messageId = '', reactions = {}, attachment = {}, tempId = '') {
  const msgDiv = document.createElement("div");
  if (messageId) {
    msgDiv.setAttribute("data-msg-id", messageId);
  }

  if (type === 'system') {
    msgDiv.className = "chat-system-message";
    msgDiv.innerHTML = `<span>${text}</span>`;
  } else {
    msgDiv.className = `chat-message ${isSelf ? 'sent' : 'received'}`;
    const timeStr = formatCurrentTime();

    if (isSelf) {
      const ticks = tempId ? "✓" : "✓✓";
      msgDiv.innerHTML = `
        <div class="msg-bubble">
          <div class="msg-text"></div>
          <div class="msg-time">
            <span>${timeStr}</span>
            <span class="msg-status-ticks">${ticks}</span>
          </div>
        </div>
      `;
      msgDiv.querySelector('.msg-text').innerHTML = parseMessageText(text);
    } else {
      let avatarContent = '';
      if (avatarUrl) {
        avatarContent = `<img src="${avatarUrl}" alt="${sender}" class="account-pic" loading="lazy" />`;
      } else {
        const initials = getInitials(sender);
        avatarContent = initials;
      }

      msgDiv.innerHTML = `
        <div class="msg-avatar" style="background: ${avatarBg || 'var(--ios-accent)'}">${avatarContent}</div>
        <div class="msg-bubble">
          <div class="msg-sender"></div>
          <div class="msg-text"></div>
          <div class="msg-time">${timeStr}</div>
        </div>
      `;
      msgDiv.querySelector('.msg-sender').textContent = sender;
      msgDiv.querySelector('.msg-text').innerHTML = parseMessageText(text);
    }

    const bubble = msgDiv.querySelector('.msg-bubble');
    if (bubble) {
      if (attachment && attachment.url) {
        bubble.classList.add('msg-bubble-has-attachment');
        const attachDiv = document.createElement('div');
        
        // Reserve aspect ratio space to prevent layout jumps on all clients
        if (attachment.width && attachment.height) {
          attachDiv.style.setProperty('--aspect-ratio', `${attachment.width} / ${attachment.height}`);
          attachDiv.style.aspectRatio = `${attachment.width} / ${attachment.height}`;
          attachDiv.style.width = "100%";
        }

        // Apply media-only styling for zero padding (Telegram-style image/video bubbles)
        const isMedia = attachment.content_type && (attachment.content_type.startsWith("image/") || attachment.content_type.startsWith("video/"));
        if (isMedia && (!text || text.trim() === '')) {
          bubble.classList.add('msg-bubble-media-only');
        }

        if (attachment.content_type && attachment.content_type.startsWith("image/")) {
          attachDiv.className = "msg-bubble-media";
          
          const renderImage = (url) => {
            attachDiv.innerHTML = "";
            const img = document.createElement("img");
            img.src = url;
            img.alt = attachment.filename || 'Image';
            img.loading = "lazy";
            img.addEventListener("error", () => {
              attachDiv.innerHTML = `
                <div class="media-load-failed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span class="error-text">Failed to load photo</span>
                  <button class="retry-load-btn" type="button">Tap to Retry</button>
                </div>
              `;
              const retryBtn = attachDiv.querySelector(".retry-load-btn");
              if (retryBtn) {
                retryBtn.addEventListener("click", (ev) => {
                  ev.stopPropagation();
                  const buster = attachment.url + (attachment.url.includes("?") ? "&" : "?") + "t=" + Date.now();
                  renderImage(buster);
                });
              }
            });
            img.addEventListener("click", (e) => {
              e.stopPropagation();
              openMediaViewer(url, 'image');
            });
            attachDiv.appendChild(img);
          };
          
          if (downloadedMediaCache[attachment.url]) {
            renderImage(downloadedMediaCache[attachment.url]);
          } else {
            renderDownloadPlaceholder(attachDiv, attachment, "image", renderImage);
          }

        } else if (attachment.content_type && attachment.content_type.startsWith("video/")) {
          attachDiv.className = "msg-video-player";
          
          const renderVideo = (url) => {
            attachDiv.innerHTML = "";
            const video = document.createElement("video");
            video.src = url;
            video.autoplay = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = "metadata";
            video.style.pointerEvents = "none";
            video.style.width = "100%";
            video.style.display = "block";
            
            video.addEventListener("error", () => {
              attachDiv.innerHTML = `
                <div class="media-load-failed">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span class="error-text">Failed to load video</span>
                  <button class="retry-load-btn" type="button">Tap to Retry</button>
                </div>
              `;
              const retryBtn = attachDiv.querySelector(".retry-load-btn");
              if (retryBtn) {
                retryBtn.addEventListener("click", (ev) => {
                  ev.stopPropagation();
                  const buster = attachment.url + (attachment.url.includes("?") ? "&" : "?") + "t=" + Date.now();
                  renderVideo(buster);
                });
              }
            });
            
            attachDiv.appendChild(video);
            
            const overlay = document.createElement("div");
            overlay.className = "inline-video-overlay-play";
            overlay.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg>`;
            attachDiv.appendChild(overlay);
          };
          
          if (downloadedMediaCache[attachment.url]) {
            renderVideo(downloadedMediaCache[attachment.url]);
          } else {
            renderDownloadPlaceholder(attachDiv, attachment, "video", renderVideo);
          }
          
          attachDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentVideo = attachDiv.querySelector("video");
            const playUrl = currentVideo ? currentVideo.src : (downloadedMediaCache[attachment.url] || attachment.url);
            openMediaViewer(playUrl, 'video');
          });
        } else if (attachment.content_type && attachment.content_type.startsWith("audio/")) {
          attachDiv.className = "msg-audio-card";
          const sizeMB = attachment.size ? (attachment.size / 1024 / 1024).toFixed(1) + " MB" : "Audio";
          
          const audio = document.createElement("audio");
          audio.src = attachment.url;
          audio.preload = "metadata";
          attachDiv.appendChild(audio);

          const playBtn = document.createElement("div");
          playBtn.className = "audio-play-icon";
          playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #ffffff; margin-left: 2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
          attachDiv.appendChild(playBtn);

          const infoDiv = document.createElement("div");
          infoDiv.className = "audio-info";
          infoDiv.innerHTML = `
            <div class="audio-name">${attachment.filename || 'Audio Attachment'}</div>
            <div class="audio-duration-size">0:00 / 0:00 (${sizeMB})</div>
            <div class="audio-progress-bar-container">
              <div class="audio-progress-bar-fill"></div>
            </div>
          `;
          attachDiv.appendChild(infoDiv);

          const durationSizeLabel = infoDiv.querySelector(".audio-duration-size");
          const progressContainer = infoDiv.querySelector(".audio-progress-bar-container");
          const progressFill = infoDiv.querySelector(".audio-progress-bar-fill");

          const formatTime = (secs) => {
            if (isNaN(secs)) return "0:00";
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
          };

          audio.addEventListener("loadedmetadata", () => {
            durationSizeLabel.textContent = `0:00 / ${formatTime(audio.duration)} (${sizeMB})`;
          });

          audio.addEventListener("timeupdate", () => {
            const cur = audio.currentTime;
            const dur = audio.duration || 0;
            const pct = dur > 0 ? (cur / dur) * 100 : 0;
            progressFill.style.width = pct + "%";
            durationSizeLabel.textContent = `${formatTime(cur)} / ${formatTime(dur)} (${sizeMB})`;
          });

          progressContainer.addEventListener("click", (e) => {
            e.stopPropagation();
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const dur = audio.duration || 0;
            audio.currentTime = pos * dur;
          });

          attachDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll("audio, video").forEach(el => {
              if (el !== audio) el.pause();
            });

            if (audio.paused) {
              audio.play().then(() => {
                playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #ffffff;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
              }).catch(err => console.error("Audio play failed:", err));
            } else {
              audio.pause();
              playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #ffffff; margin-left: 2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            }
          });

          audio.addEventListener('ended', () => {
            playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #ffffff; margin-left: 2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            progressFill.style.width = "0%";
          });
          audio.addEventListener('pause', () => {
            playBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: #ffffff; margin-left: 2px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
          });
        } else {
          attachDiv.style.display = "contents";
          const sizeMB = attachment.size ? (attachment.size / 1024 / 1024).toFixed(1) + " MB" : "File";
          let fileIcon = getFileIconSVG(attachment.content_type, attachment.filename);

          attachDiv.innerHTML = `
            <a href="${attachment.url}" class="msg-file-card" target="_blank" download="${attachment.filename || 'file'}" onclick="event.stopPropagation();">
              <div class="file-icon-circle">${fileIcon}</div>
              <div class="file-info">
                <div class="file-name">${attachment.filename || 'Attachment'}</div>
                <div class="file-size">${sizeMB}</div>
              </div>
            </a>
          `;
        }

        const textEl = bubble.querySelector('.msg-text');
        bubble.insertBefore(attachDiv, textEl);

        if (!text || text.trim() === '') {
          textEl.style.display = 'none';
        }
      }

      if (messageId && !messageId.startsWith("temp-msg-")) {
        renderReactions(bubble, messageId, reactions);

        const isDesktop = window.matchMedia("(hover: hover)").matches;
        if (isDesktop) {
          renderHoverReactions(bubble, messageId);
        }

        bubble.addEventListener('click', (e) => {
          e.stopPropagation();
          showContextMenu(e, messageId, isSelf);
        });
      }
    }
  }

  return msgDiv;
}

function appendChatMessage(sender, text, isSelf, avatarBg = '', type = 'message', avatarUrl = '', messageId = '', reactions = {}, attachment = {}, tempId = '') {
  if (!chatMessages) return;
  const msgDiv = buildMessageElement(sender, text, isSelf, avatarBg, type, avatarUrl, messageId, reactions, attachment, tempId);
  msgDiv.classList.add('new-message'); // Bouncy slide-up animation for real-time messages!
  // Remove empty-state placeholder if present before appending first real message
  const emptyState = chatMessages.querySelector('.chat-empty-state, [data-empty-state]');
  if (emptyState) emptyState.remove();
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


// Track if history has been loaded (to avoid wiping existing messages on reconnect)
let chatHistoryLoaded = false;

function showChatSkeleton() {
  if (!chatMessages || chatHistoryLoaded) return;
  chatMessages.innerHTML = `
    <div class="chat-date-separator"><span>Today</span></div>
    <div class="chat-skeleton-wrap">
      <div class="chat-skeleton-msg received">
        <div class="skel-avatar"></div>
        <div class="skel-bubble"><div class="skel-line w70"></div><div class="skel-line w40"></div></div>
      </div>
      <div class="chat-skeleton-msg sent">
        <div class="skel-bubble skel-bubble-right"><div class="skel-line w55"></div><div class="skel-line w30"></div></div>
      </div>
      <div class="chat-skeleton-msg received">
        <div class="skel-avatar"></div>
        <div class="skel-bubble"><div class="skel-line w80"></div><div class="skel-line w50"></div></div>
      </div>
      <div class="chat-skeleton-msg sent">
        <div class="skel-bubble skel-bubble-right"><div class="skel-line w65"></div></div>
      </div>
    </div>
  `;
}

function renderChatHistory(messages) {
  if (!chatMessages) return;
  chatHistoryLoaded = true;

  // Extract any local/temp messages that are still sending or uploading
  const tempBubbles = Array.from(chatMessages.querySelectorAll('[data-msg-id^="temp-"]'));

  chatMessages.innerHTML = '<div class="chat-date-separator"><span>Today</span></div>';

  if ((!messages || messages.length === 0) && tempBubbles.length === 0) {
    const empty = document.createElement('div');
    empty.setAttribute('data-empty-state', '1');
    empty.className = 'chat-empty-state';
    empty.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--ios-text-secondary);font-size:13px;opacity:0.7;"><div style="font-size:32px;margin-bottom:10px;">&#x1F4AC;</div><div>${currentLang === 'en' ? 'No messages yet. Be the first to say hi!' : 'မက်ဆေ့ချ် မရှိသေးပါ။ ပထမဆုံး ဖြစ်လိုက်ပါ!'}</div></div>`;
    chatMessages.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  messages.forEach(msg => {
    // Avoid double rendering if history contains a message that matches a temp bubble
    const alreadyRendered = tempBubbles.some(bubble => bubble.getAttribute('data-msg-id') === msg.message_id);
    if (alreadyRendered) return;

    const isSelf = msg.sender === myUsername;
    const msgDiv = buildMessageElement(msg.sender, msg.text, isSelf, msg.avatarBg || '', 'message', msg.avatar_url || '', msg.message_id, msg.reactions || {}, msg.attachment || {});
    if (msgDiv) fragment.appendChild(msgDiv);
  });

  // Re-append the temporary sending messages at the bottom
  tempBubbles.forEach(bubble => {
    fragment.appendChild(bubble);
  });

  chatMessages.appendChild(fragment);
  requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
}

function connectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  // Show skeleton only on first load — on reconnect keep existing messages visible
  if (!chatHistoryLoaded) {
    showChatSkeleton();
  }

  // Check if we are running from a local file protocol (or empty hostname)
  const isFileProtocol = window.location.protocol === "file:" || !window.location.hostname;
  
  // Set host and protocol. If file protocol, fallback to online production server. Otherwise use the current host.
  const wsProtocol = isFileProtocol ? "wss:" : (window.location.protocol === "https:" ? "wss:" : "ws:");
  const wsHost = isFileProtocol ? "burmeserecap.tech" : window.location.host;
  
  // Use a stable guest username stored in sessionStorage — prevents double-counting on reconnect
  let wsUsername;
  if (isUserSignedIn) {
    wsUsername = myUsername;
  } else {
    let guestId = sessionStorage.getItem('guest_ws_id');
    if (!guestId) {
      guestId = 'Guest_' + Math.floor(1000 + Math.random() * 9000);
      sessionStorage.setItem('guest_ws_id', guestId);
    }
    wsUsername = guestId;
  }
  const token = safeStorage.getItem("jwt_token") || "";
  const wsUrl = `${wsProtocol}//${wsHost}/ws/chat?token=${encodeURIComponent(token)}`;

  console.log(`Connecting to WebSocket as ${wsUsername}: ${wsUrl}`);
  
  if (statusDot) {
    statusDot.style.backgroundColor = "#ff9500";
    statusDot.style.boxShadow = "0 0 4px #ff9500";
  }
  if (onlineCountEl) {
    onlineCountEl.textContent = TRANSLATIONS[currentLang]["connecting"];
  }

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WebSocket connected.");
    currentReconnectDelay = reconnectInterval;
    if (statusDot) {
      statusDot.style.backgroundColor = "var(--ios-green)";
      statusDot.style.boxShadow = "0 0 4px var(--ios-green)";
    }
    if (onlineCountEl) {
      onlineCountEl.textContent = TRANSLATIONS[currentLang]["updating"];
    }
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      // Update ONLINE count only — show live connected users, not total members
      if (onlineCountEl && message.onlineCount !== undefined) {
        const count = message.onlineCount;
        if (currentLang === "en") {
          onlineCountEl.textContent = `${count.toLocaleString()} online`;
        } else {
          onlineCountEl.textContent = `${count.toLocaleString()} ဦး အွန်လိုင်းရှိသည်`;
        }
      }

      if (message.type === 'ping') {
        // Respond to server keepalive ping to maintain connection
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ action: 'pong' }));
        }
      } else if (message.type === 'history') {
        // Batch render all history at once — Telegram-like smooth load
        renderChatHistory(message.messages || []);
      } else if (message.type === 'system') {
        appendChatMessage("System", message.text, false, '', 'system');
      } else if (message.type === 'message') {
        const isSelf = message.sender === myUsername;
        
        // Prevent duplicate rendering of messages already in DOM
        if (message.message_id) {
          const existing = chatMessages.querySelector(`[data-msg-id="${message.message_id}"]`);
          if (existing) return;
        }

        if (isSelf && message.tempId) {
          const localBubble = chatMessages.querySelector(`[data-msg-id="${message.tempId}"]`);
          if (localBubble) {
            if (message.attachment && message.attachment.url) {
              if (localBubble.dataset.previewUrl) {
                downloadedMediaCache[message.attachment.url] = localBubble.dataset.previewUrl;
              }
              // Replace temporary upload preview bubble with final rendered element
              const newMsg = buildMessageElement(message.sender, message.text, isSelf, message.avatarBg, 'message', message.avatar_url, message.message_id, message.reactions, message.attachment);
              localBubble.replaceWith(newMsg);
            } else {
              // Text message: finalize ID, ticks and context menu
              localBubble.setAttribute("data-msg-id", message.message_id);
              const ticksEl = localBubble.querySelector(".msg-status-ticks");
              if (ticksEl) ticksEl.textContent = "✓✓";
              const bubbleEl = localBubble.querySelector(".msg-bubble");
              if (bubbleEl) {
                renderReactions(bubbleEl, message.message_id, message.reactions);
                const isDesktop = window.matchMedia("(hover: hover)").matches;
                if (isDesktop) {
                  renderHoverReactions(bubbleEl, message.message_id);
                }
                bubbleEl.addEventListener('click', (e) => {
                  e.stopPropagation();
                  showContextMenu(e, message.message_id, true);
                });
              }
            }
            return;
          }
        }
        appendChatMessage(message.sender, message.text, isSelf, message.avatarBg, 'message', message.avatar_url, message.message_id, message.reactions, message.attachment);
      } else if (message.type === 'delete') {
        const msgEl = chatMessages.querySelector(`[data-msg-id="${message.message_id}"]`);
        if (msgEl) {
          msgEl.classList.add('deleting');
          setTimeout(() => {
            msgEl.remove();
          }, 350);
        }
      } else if (message.type === 'react_update') {
        const msgEl = chatMessages.querySelector(`[data-msg-id="${message.message_id}"]`);
        if (msgEl) {
          const bubble = msgEl.querySelector('.msg-bubble');
          if (bubble) {
            renderReactions(bubble, message.message_id, message.reactions);
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse socket message:", err);
    }
  };

  socket.onclose = () => {
    console.warn("WebSocket closed. Attempting reconnect...");
    if (statusDot) {
      statusDot.style.backgroundColor = "#ff3b30";
      statusDot.style.boxShadow = "0 0 4px #ff3b30";
    }
    if (onlineCountEl) {
      onlineCountEl.textContent = TRANSLATIONS[currentLang]["offline"];
    }

    reconnectTimer = setTimeout(() => {
      currentReconnectDelay = Math.min(currentReconnectDelay * 1.5, maxReconnectInterval);
      connectWebSocket();
    }, currentReconnectDelay);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    socket.close();
  };
}

function handleSendChatMessage() {
  if (!chatMessageInput || !socket || socket.readyState !== WebSocket.OPEN || !isUserSignedIn) return;
  const text = chatMessageInput.value.trim();
  if (!text) return;

  const tempId = "temp-msg-" + Date.now();
  appendChatMessage(myUsername, text, true, "", "message", myAvatarUrl, tempId, {}, {}, tempId);

  const payload = {
    text: text,
    avatarBg: "",
    avatar_url: myAvatarUrl,
    tempId: tempId
  };

  socket.send(JSON.stringify(payload));
  chatMessageInput.value = "";
}

// ===== Preset Avatars list =====
const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aria",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Lulu",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Buster",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Patches",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Bubba"
];

// ===== Membership Plans Modal Flow =====
const plansModal = document.getElementById("plansModal");
const premiumBtn = document.getElementById("premiumBtn");
const closePlansModalBtn = document.getElementById("closePlansModalBtn");

function openPlansModal() {
  if (plansModal) {
    plansModal.style.display = "flex";
  }
}

function closePlansModal() {
  if (plansModal) {
    plansModal.style.display = "none";
  }
}

// ===== Local Authentication Modal Flow =====
const authModal = document.getElementById("authModal");
const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
const tabSignInBtn = document.getElementById("tabSignInBtn");
const tabSignUpBtn = document.getElementById("tabSignUpBtn");
const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");
const avatarGrid = document.getElementById("avatarGrid");

const signInEmail = document.getElementById("signInEmail");
const signUpUsername = document.getElementById("signUpUsername");
const signUpEmail = document.getElementById("signUpEmail");


const signInError = document.getElementById("signInError");
const signUpError = document.getElementById("signUpError");

let selectedAvatarUrl = PRESET_AVATARS[0];

function openAuthModal() {
  if (authModal) {
    switchTab("signin");
    authModal.style.display = "flex";
    signInError.textContent = "";
    signUpError.textContent = "";
  }
}

function closeAuthModal() {
  if (authModal) {
    authModal.style.display = "none";
  }
}

function switchTab(tab) {
  if (tab === "signin") {
    tabSignInBtn.classList.add("active");
    tabSignUpBtn.classList.remove("active");
    signInForm.style.display = "flex";
    signUpForm.style.display = "none";
  } else {
    tabSignInBtn.classList.remove("active");
    tabSignUpBtn.classList.add("active");
    signInForm.style.display = "none";
    signUpForm.style.display = "flex";
  }
}

function renderPresetAvatars() {
  if (!avatarGrid) return;
  avatarGrid.innerHTML = "";
  PRESET_AVATARS.forEach((url, index) => {
    const opt = document.createElement("div");
    opt.className = "avatar-option" + (index === 0 ? " active" : "");
    opt.innerHTML = `<img src="${url}" alt="Avatar preset ${index + 1}" />`;
    opt.addEventListener("click", () => {
      avatarGrid.querySelectorAll(".avatar-option").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      selectedAvatarUrl = url;
    });
    avatarGrid.appendChild(opt);
  });
}

// Custom Avatar Upload Integration
const avatarUploadBtn = document.getElementById("avatarUploadBtn");
const signUpAvatarFile = document.getElementById("signUpAvatarFile");

if (avatarUploadBtn && signUpAvatarFile) {
  avatarUploadBtn.addEventListener("click", () => {
    signUpAvatarFile.click();
  });

  signUpAvatarFile.addEventListener("change", async () => {
    const file = signUpAvatarFile.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Avatar image must be smaller than 5MB.");
      return;
    }

    const originalText = avatarUploadBtn.innerHTML;
    avatarUploadBtn.disabled = true;
    avatarUploadBtn.innerHTML = "⏳ Uploading (0%)...";

    try {
      let fileType = file.type || "image/jpeg";
      let fileName = file.name || ("avatar-" + Date.now() + ".jpg");

      // Fix generic/empty types on mobile
      if (fileType === "application/octet-stream" || !fileType) {
        const ext = fileName.split('.').pop().toLowerCase();
        if (ext === 'png') fileType = 'image/png';
        else if (ext === 'gif') fileType = 'image/gif';
        else fileType = 'image/jpeg';
      }

      const response = await authFetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: fileName, content_type: fileType })
      });

      if (!response.ok) throw new Error("Failed to get presigned URL");
      const data = await response.json();

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.upload_url, true);
      xhr.setRequestHeader("Content-Type", fileType);
      xhr.setRequestHeader("x-amz-acl", "public-read");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          avatarUploadBtn.innerHTML = `⏳ Uploading (${percent}%)...`;
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const downloadUrl = data.download_url;
          selectedAvatarUrl = downloadUrl;

          const opt = document.createElement("div");
          opt.className = "avatar-option active";
          opt.innerHTML = `<img src="${downloadUrl}" alt="Custom Uploaded Avatar" />`;
          
          if (avatarGrid) {
            avatarGrid.querySelectorAll(".avatar-option").forEach(o => o.classList.remove("active"));
            avatarGrid.insertBefore(opt, avatarGrid.firstChild);
          }

          opt.addEventListener("click", () => {
            avatarGrid.querySelectorAll(".avatar-option").forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            selectedAvatarUrl = downloadUrl;
          });

          showToast("Avatar uploaded successfully!");
        } else {
          showToast("Upload failed: " + xhr.statusText);
        }
        avatarUploadBtn.disabled = false;
        avatarUploadBtn.innerHTML = originalText;
      };

      xhr.onerror = () => {
        showToast("Upload failed due to network error.");
        avatarUploadBtn.disabled = false;
        avatarUploadBtn.innerHTML = originalText;
      };

      xhr.send(file);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      showToast("Avatar upload failed: " + err.message);
      avatarUploadBtn.disabled = false;
      avatarUploadBtn.innerHTML = originalText;
    }
  });
}

// Event bindings for Modal
if (closeAuthModalBtn) {
  closeAuthModalBtn.addEventListener("click", closeAuthModal);
}
if (authModal) {
  authModal.addEventListener("click", (e) => {
    if (e.target === authModal) {
      closeAuthModal();
    }
  });
}

// Event bindings for Plans Modal
if (premiumBtn) {
  premiumBtn.addEventListener("click", openPlansModal);
}
if (closePlansModalBtn) {
  closePlansModalBtn.addEventListener("click", closePlansModal);
}

// Pricing plan subscription handler
document.querySelectorAll(".plan-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const plan = btn.getAttribute("data-plan");
    if (!isUserSignedIn) {
      openAuthModal();
      closePlansModal();
      return;
    }
    if (plan === "Free") {
      showToast("Free Plan is active by default.");
      return;
    }
    
    showProgressModal(
      currentLang === 'en' ? "Upgrading Plan" : "အစီအစဉ် မြှင့်တင်နေသည်",
      currentLang === 'en' ? `Subscribing to ${plan} Plan...` : `${plan} အစီအစဉ်သို့ ပြောင်းလဲနေပါသည်...`
    );
    
    authFetch("/api/plans/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: plan })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upgrade subscription failed.");
      }
      return res.json();
    })
    .then((data) => {
      hideProgressModal();
      safeStorage.setItem("user_plan", data.plan);
      safeStorage.setItem("user_credits", data.credits_remaining);
      
      updateCreditsDisplay();
      updatePricingPlansModalState(data.plan);
      loadVoices(); // reload voices to unlock premium
      closePlansModal();
      
      showToast(currentLang === 'en' ? `Successfully subscribed to ${plan} Plan!` : `${plan} အစီအစဉ်သို့ အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ!`);
    })
    .catch((err) => {
      hideProgressModal();
      showToast("Subscription error: " + err.message);
    });
  });
});
if (plansModal) {
  plansModal.addEventListener("click", (e) => {
    if (e.target === plansModal) {
      closePlansModal();
    }
  });
}
if (tabSignInBtn) {
  tabSignInBtn.addEventListener("click", () => switchTab("signin"));
}
if (tabSignUpBtn) {
  tabSignUpBtn.addEventListener("click", () => switchTab("signup"));
}
if (loginHeaderBtn) {
  loginHeaderBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (isUserSignedIn) {
      handleSignOut();
    } else {
      openAuthModal();
    }
  });
}
if (lockSignInBtn) {
  lockSignInBtn.addEventListener("click", openAuthModal);
}
if (lockTtsSignInBtn) {
  lockTtsSignInBtn.addEventListener("click", openAuthModal);
}

// Sign In Form Submit
if (signInForm) {
  signInForm.addEventListener("submit", (e) => {
    e.preventDefault();
    signInError.textContent = "";

    const emailVal = signInEmail.value.trim();
    const passwordVal = document.getElementById("signInPassword").value;
    if (!emailVal || !passwordVal) return;

    showProgressModal(currentLang === 'en' ? "Signing In" : "ဝင်ရောက်နေသည်", currentLang === 'en' ? "Verifying credentials..." : "စစ်ဆေးနေပါသည်...");

    fetch(getApiUrl("/api/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passwordVal })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Authentication failed.");
      }
      return res.json();
    })
    .then((data) => {
      hideProgressModal();
      safeStorage.setItem("tg_signed_in", "true");
      safeStorage.setItem("jwt_token", data.token);
      safeStorage.setItem("tg_username", data.profile.username);
      safeStorage.setItem("tg_avatar_url", data.profile.avatar_url);
      safeStorage.setItem("tg_email", data.profile.email);
      safeStorage.setItem("user_plan", data.profile.plan || "Free");
      safeStorage.setItem("user_credits", data.profile.credits_remaining || 0);

      initUserSession();
      closeAuthModal();

      if (socket) socket.close(); // trigger reconnect
    })
    .catch((err) => {
      hideProgressModal();
      signInError.textContent = err.message;
    });
  });
}

// Sign Up Form Submit
if (signUpForm) {
  signUpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    signUpError.textContent = "";

    const userVal = signUpUsername.value.trim();
    const emailVal = signUpEmail.value.trim();
    const passwordVal = document.getElementById("signUpPassword").value;
    
    if (!userVal || !emailVal || !passwordVal) return;

    // Show progress to prevent double-clicks
    showProgressModal(
      currentLang === 'en' ? "Creating Account" : "အကောင့် ဖန်တီးနေသည်",
      currentLang === 'en' ? "Setting up your profile..." : "သင်၏ပရိုဖိုင်ကို ပြင်ဆင်နေပါသည်..."
    );

    fetch(getApiUrl("/api/signup"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: userVal,
        email: emailVal,
        password: passwordVal,
        avatar_url: selectedAvatarUrl
      })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Signup failed.");
      }
      return res.json();
    })
    .then((data) => {
      hideProgressModal();
      safeStorage.setItem("tg_signed_in", "true");
      safeStorage.setItem("jwt_token", data.token);
      safeStorage.setItem("tg_username", data.profile.username);
      safeStorage.setItem("tg_avatar_url", data.profile.avatar_url);
      safeStorage.setItem("tg_email", data.profile.email);
      safeStorage.setItem("user_plan", data.profile.plan || "Free");
      safeStorage.setItem("user_credits", data.profile.credits_remaining || 0);

      initUserSession();
      closeAuthModal();

      if (socket) socket.close(); // trigger reconnect
    })
    .catch((err) => {
      hideProgressModal();
      signUpError.textContent = err.message;
    });
  });
}

function handleSignOut() {
  const confirmMsg = TRANSLATIONS[currentLang]["sign-out-confirm"].replace("{username}", myUsername);
  const okText = currentLang === 'en' ? "Sign Out" : "ထွက်ရန်";
  const title = currentLang === 'en' ? "Sign Out" : "အကောင့်ထွက်မည်";
  showCustomConfirm(title, confirmMsg, okText, () => {
    safeStorage.removeItem("tg_signed_in");
    safeStorage.removeItem("tg_username");
    safeStorage.removeItem("tg_avatar_url");
    safeStorage.removeItem("tg_email");
    
    initUserSession();
    
    if (socket) socket.close();
  });
}

if (chatSendButton && chatMessageInput) {
  chatSendButton.addEventListener("click", handleSendChatMessage);
  chatMessageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSendChatMessage();
    }
  });
}

// ===== Emoji Picker Logic =====
const emojiPicker = document.getElementById("emojiPicker");
const emojiTrigger = document.querySelector(".emoji-trigger");
const pickerGrid = document.getElementById("pickerGrid");

function insertEmojiAtCursor(emoji) {
  if (!chatMessageInput) return;
  const start = chatMessageInput.selectionStart || 0;
  const end = chatMessageInput.selectionEnd || 0;
  const text = chatMessageInput.value;
  chatMessageInput.value = text.substring(0, start) + emoji + text.substring(end);
  chatMessageInput.focus();
  const newPos = start + emoji.length;
  chatMessageInput.setSelectionRange(newPos, newPos);
}

let isEmojiPickerPopulated = false;
function populateEmojiPicker() {
  if (isEmojiPickerPopulated || !pickerGrid) return;
  pickerGrid.innerHTML = "";
  Object.entries(animatedEmojiMap).forEach(([emoji, url]) => {
    const btn = document.createElement("button");
    btn.className = "picker-emoji-btn";
    btn.type = "button";
    btn.innerHTML = `<span style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;"><span class="emoji-shimmer" style="position:absolute;top:0;left:0;width:28px;height:28px;border-radius:50%;"></span><img src="${url}" alt="${emoji}" style="width:28px;height:28px;opacity:0;transition:opacity 0.15s;object-fit:contain;" loading="lazy" onload="this.style.opacity='1';this.parentElement.querySelector('.emoji-shimmer').style.display='none'" onerror="if(!this.dataset.retries){this.dataset.retries=0}this.dataset.retries++;if(this.dataset.retries<3){setTimeout(()=>{this.src=this.src+'&r='+this.dataset.retries},800*this.dataset.retries)}else{this.style.display='none';var s=this.parentElement.querySelector('.emoji-shimmer');if(s){s.textContent='${emoji}';s.classList.remove('emoji-shimmer');s.style.cssText='font-size:22px;display:flex;align-items:center;justify-content:center;width:28px;height:28px;'}}" /></span>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      insertEmojiAtCursor(emoji);
      btn.classList.add("emoji-bounce");
      setTimeout(() => {
        btn.classList.remove("emoji-bounce");
      }, 450);
    });
    pickerGrid.appendChild(btn);
  });
  isEmojiPickerPopulated = true;
}

// Dimension helper promises to calculate layout aspect ratios before uploading
function getImageDimensions(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const dims = { width: img.width, height: img.height };
      URL.revokeObjectURL(img.src);
      resolve(dims);
    };
    img.onerror = () => {
      resolve(null);
    };
  });
}

function getVideoDimensions(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("video/")) {
      resolve(null);
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      const dims = { width: video.videoWidth, height: video.videoHeight };
      URL.revokeObjectURL(video.src);
      resolve(dims);
    };
    video.onerror = () => {
      resolve(null);
    };
  });
}

// Chat Attachment Upload and Progress Tracker Logic
function uploadChatAttachment(file, dims = null) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !isUserSignedIn) return;

  if (file.size > 50 * 1024 * 1024) {
    showToast(currentLang === 'en' ? "File must be smaller than 50MB." : "ဖိုင်အရွယ်အစား 50MB အောက် ဖြစ်ရပါမည်။");
    return;
  }

  // Guaranteed unique tempId
  const tempId = "temp-upload-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
  const timeStr = formatCurrentTime();
  
  let fileIcon = getFileIconSVGByType(file.type);

  const msgDiv = document.createElement("div");
  msgDiv.setAttribute("data-msg-id", tempId); // Critical to match it later!
  msgDiv.className = "chat-message sent new-message";

  let previewUrl = null;
  let attachmentHTML = "";
  let aspectStyle = "";
  if (dims && dims.width && dims.height) {
    aspectStyle = `aspect-ratio: ${dims.width} / ${dims.height}; width: 100%;`;
  }

  if (file.type.startsWith("image/")) {
    previewUrl = URL.createObjectURL(file);
    attachmentHTML = `
      <div class="msg-bubble msg-bubble-has-attachment msg-bubble-media-only">
        <div class="msg-bubble-media" style="position:relative; margin-bottom: 0; ${aspectStyle}">
          <img src="${previewUrl}" style="filter: blur(8px); width: 100%; height: auto; max-height: 360px; object-fit: contain; ${aspectStyle}" />
          <div class="upload-progress-overlay">
            <div class="progress-spinner"></div>
            <div class="progress-text">0.0 / ${(file.size / 1024 / 1024).toFixed(1)} MB (0%)</div>
          </div>
        </div>
        <div class="msg-time" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.5); color: #ffffff !important; padding: 2px 6px; border-radius: 10px; font-size: 9.5px; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px; z-index: 2; margin: 0 !important; border: none !important;">
          <span style="color: #ffffff !important;">${timeStr}</span>
          <span class="msg-status-ticks" style="color: rgba(255, 255, 255, 0.8) !important; font-size: 9.5px;">...</span>
        </div>
      </div>
    `;
  } else if (file.type.startsWith("video/")) {
    previewUrl = URL.createObjectURL(file);
    attachmentHTML = `
      <div class="msg-bubble msg-bubble-has-attachment msg-bubble-media-only">
        <div class="msg-video-player" style="position:relative; margin-bottom: 0; ${aspectStyle}">
          <video src="${previewUrl}" style="filter: blur(8px); width: 100%; height: auto; max-height: 360px; object-fit: contain; ${aspectStyle}" muted></video>
          <div class="upload-progress-overlay">
            <div class="progress-spinner"></div>
            <div class="progress-text">0.0 / ${(file.size / 1024 / 1024).toFixed(1)} MB (0%)</div>
          </div>
        </div>
        <div class="msg-time" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.5); color: #ffffff !important; padding: 2px 6px; border-radius: 10px; font-size: 9.5px; backdrop-filter: blur(4px); display: inline-flex; align-items: center; gap: 3px; z-index: 2; margin: 0 !important; border: none !important;">
          <span style="color: #ffffff !important;">${timeStr}</span>
          <span class="msg-status-ticks" style="color: rgba(255, 255, 255, 0.8) !important; font-size: 9.5px;">...</span>
        </div>
      </div>
    `;
  } else {
    // Other files (including audio) show file card during upload
    attachmentHTML = `
      <div class="msg-bubble msg-bubble-has-attachment">
        <div class="msg-file-card" style="position:relative; margin-bottom: 0;">
          <div class="file-icon-circle">${fileIcon}</div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
          <div class="upload-progress-overlay">
            <div class="progress-spinner"></div>
            <div class="progress-text">0.0 / ${(file.size / 1024 / 1024).toFixed(1)} MB (0%)</div>
          </div>
        </div>
        <div class="msg-time">
          <span>${timeStr}</span>
          <span class="msg-status-ticks">...</span>
        </div>
      </div>
    `;
  }

  msgDiv.innerHTML = attachmentHTML;
  if (previewUrl) {
    msgDiv.dataset.previewUrl = previewUrl; // Store to revoke later
  }

  if (chatMessages) {
    // Remove empty state if present
    const emptyState = chatMessages.querySelector('.chat-empty-state, [data-empty-state]');
    if (emptyState) emptyState.remove();
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  const progressTextEl = msgDiv.querySelector(".progress-text");

  let fileType = file.type || "application/octet-stream";
  let fileName = file.name || ("attachment-" + Date.now() + ".bin");

  // Fix generic/empty content-type on mobile
  if (fileType === "application/octet-stream" || !fileType) {
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'zip': 'application/zip',
      'txt': 'text/plain'
    };
    if (mimeTypes[ext]) {
      fileType = mimeTypes[ext];
    }
  }

  authFetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: fileName, content_type: fileType })
  })
  .then(async (res) => {
    if (!res.ok) throw new Error("Sign request failed");
    return res.json();
  })
  .then((data) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.upload_url, true);
    xhr.setRequestHeader("Content-Type", fileType);
    xhr.setRequestHeader("x-amz-acl", "public-read");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        const uploadedMB = (e.loaded / 1024 / 1024).toFixed(1);
        const totalMB = (e.total / 1024 / 1024).toFixed(1);
        if (progressTextEl) {
          progressTextEl.textContent = `${uploadedMB} / ${totalMB} MB (${percent}%)`;
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const tempBubble = chatMessages.querySelector(`[data-msg-id="${tempId}"]`);
        if (tempBubble) {
          if (tempBubble.dataset.previewUrl) {
            downloadedMediaCache[data.download_url] = tempBubble.dataset.previewUrl;
          }
          const overlay = tempBubble.querySelector(".upload-progress-overlay");
          if (overlay) overlay.style.display = "none";
        }

        const payload = {
          text: "",
          avatarBg: "",
          avatar_url: myAvatarUrl,
          tempId: tempId, // Send tempId so server broadcasts it back!
          attachment: {
            url: data.download_url,
            filename: fileName,
            content_type: fileType,
            size: file.size,
            width: dims ? dims.width : dims.videoWidth || undefined,
            height: dims ? dims.height : dims.videoHeight || undefined
          }
        };
        socket.send(JSON.stringify(payload));
      } else {
        failUpload("Upload failed: " + xhr.statusText);
      }
    };

    xhr.onerror = () => {
      failUpload("Network error during upload.");
    };

    xhr.send(file);
  })
  .catch((err) => {
    console.error("Attachment upload error:", err);
    failUpload(err.message);
  });

  function failUpload(reason) {
    const tempBubble = chatMessages.querySelector(`[data-msg-id="${tempId}"]`);
    if (tempBubble) {
      if (tempBubble.dataset.previewUrl) {
        URL.revokeObjectURL(tempBubble.dataset.previewUrl);
      }
      const overlay = tempBubble.querySelector(".upload-progress-overlay");
      if (overlay) {
        overlay.innerHTML = `
          <span style="display: inline-flex; align-items: center; justify-content: center; color: #ff3b30;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </span>
          <span class="progress-text" style="font-size:9px; color: #ff3b30;">Failed</span>
        `;
        overlay.style.background = "rgba(255, 59, 48, 0.7)";
      }
      setTimeout(() => {
        tempBubble.remove();
      }, 4000);
    }
    showToast(reason);
  }
}

if (emojiTrigger && emojiPicker) {
  // Render trigger icon using the high-quality animated WebP emoji
  emojiTrigger.innerHTML = getEmojiHTML("😊", 20);

  emojiTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    populateEmojiPicker();
    const isHidden = emojiPicker.style.display === "none" || !emojiPicker.style.display;
    emojiPicker.style.display = isHidden ? "block" : "none";
  });

  document.addEventListener("click", (e) => {
    if (!emojiPicker.contains(e.target) && !emojiTrigger.contains(e.target)) {
      emojiPicker.style.display = "none";
    }
  });
}

// ===== Chat Attachment Button Logic (independent of emoji picker) =====
const chatAttachBtn = document.getElementById("chatAttachBtn");
const attachMenu = document.getElementById("attachMenu");
const attachMediaBtn = document.getElementById("attachMediaBtn");
const attachFileBtn = document.getElementById("attachFileBtn");
const chatMediaInput = document.getElementById("chatMediaInput");
const chatDocumentInput = document.getElementById("chatDocumentInput");

if (chatAttachBtn && attachMenu) {
  chatAttachBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!isUserSignedIn) {
      openAuthModal();
      return;
    }
    const isHidden = attachMenu.style.display === "none" || !attachMenu.style.display;
    attachMenu.style.display = isHidden ? "flex" : "none";
  });

  document.addEventListener("click", (e) => {
    if (!attachMenu.contains(e.target) && !chatAttachBtn.contains(e.target)) {
      attachMenu.style.display = "none";
    }
  });

  if (attachMediaBtn && chatMediaInput) {
    attachMediaBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      attachMenu.style.display = "none";
      chatMediaInput.click();
    });
  }

  if (attachFileBtn && chatDocumentInput) {
    attachFileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      attachMenu.style.display = "none";
      chatDocumentInput.click();
    });
  }

  const handleFileChange = async (inputElement) => {
    const files = inputElement.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let dims = null;
        try {
          if (file.type.startsWith("image/")) {
            dims = await getImageDimensions(file);
          } else if (file.type.startsWith("video/")) {
            dims = await getVideoDimensions(file);
          }
        } catch (e) {
          console.error("Failed to parse file dimensions:", e);
        }
        uploadChatAttachment(file, dims);
      }
    }
    inputElement.value = "";
  };

  if (chatMediaInput) {
    chatMediaInput.addEventListener("change", () => handleFileChange(chatMediaInput));
  }
  if (chatDocumentInput) {
    chatDocumentInput.addEventListener("change", () => handleFileChange(chatDocumentInput));
  }
}


// ===== Premium Centered Media Viewer Controls =====
function openMediaViewer(src, type) {
  const modal = document.getElementById("mediaViewerModal");
  const content = document.getElementById("mediaViewerContent");
  if (!modal || !content) return;
  
  content.innerHTML = "";
  if (type === "image") {
    content.innerHTML = `<img src="${src}" alt="Preview" />`;
  } else if (type === "video") {
    content.innerHTML = `
      <div class="custom-video-player" id="customVideoPlayer">
        <video src="${src}" playsinline autoplay id="viewerVideo"></video>
        
        <!-- Big Play Button Overlay -->
        <div class="video-overlay-play" id="videoOverlayPlay">
          <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg>
        </div>
        
        <!-- Custom Controls Bar -->
        <div class="video-controls-bar" id="videoControlsBar">
          <button class="video-control-btn" id="videoPlayPauseBtn">
            <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19 8 5"></polygon></svg>
            <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          </button>
          
          <div class="video-time-display" id="videoTimeDisplay">0:00</div>
          
          <div class="video-progress-container" id="videoProgressContainer">
            <div class="video-progress-bg">
              <div class="video-progress-fill" id="videoProgressFill"></div>
              <div class="video-progress-handle" id="videoProgressHandle"></div>
            </div>
          </div>
          
          <div class="video-duration-display" id="videoDurationDisplay">0:00</div>
          
          <button class="video-control-btn" id="videoMuteBtn">
            <svg class="unmuted-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>
            <svg class="muted-icon" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"></path></svg>
          </button>
        </div>
      </div>
    `;
    setupCustomVideoPlayer();
  }
  
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("active"), 10);
}

function setupCustomVideoPlayer() {
  const player = document.getElementById("customVideoPlayer");
  const video = document.getElementById("viewerVideo");
  if (!player || !video) return;

  const playPauseBtn = document.getElementById("videoPlayPauseBtn");
  const overlayPlay = document.getElementById("videoOverlayPlay");
  const timeDisplay = document.getElementById("videoTimeDisplay");
  const durationDisplay = document.getElementById("videoDurationDisplay");
  const progressContainer = document.getElementById("videoProgressContainer");
  const progressFill = document.getElementById("videoProgressFill");
  const progressHandle = document.getElementById("videoProgressHandle");
  const muteBtn = document.getElementById("videoMuteBtn");

  const playIcon = playPauseBtn.querySelector(".play-icon");
  const pauseIcon = playPauseBtn.querySelector(".pause-icon");
  const unmutedIcon = muteBtn.querySelector(".unmuted-icon");
  const mutedIcon = muteBtn.querySelector(".muted-icon");

  let controlsTimeout;

  function formatTime(secs) {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function showControlsTemporarily() {
    player.classList.add("controls-active");
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (!video.paused) {
        player.classList.remove("controls-active");
      }
    }, 2500);
  }

  function togglePlay() {
    if (video.paused) {
      video.play().catch(err => console.error(err));
      playIcon.style.display = "none";
      pauseIcon.style.display = "block";
      overlayPlay.classList.remove("visible");
    } else {
      video.pause();
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
      overlayPlay.classList.add("visible");
      player.classList.add("controls-active");
    }
  }

  function toggleMute() {
    video.muted = !video.muted;
    if (video.muted) {
      unmutedIcon.style.display = "none";
      mutedIcon.style.display = "block";
    } else {
      unmutedIcon.style.display = "block";
      mutedIcon.style.display = "none";
    }
  }

  function updateProgress() {
    const pct = (video.currentTime / video.duration) * 100 || 0;
    progressFill.style.width = `${pct}%`;
    progressHandle.style.left = `${pct}%`;
    timeDisplay.textContent = formatTime(video.currentTime);
  }

  function seek(e) {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = Math.min(Math.max(pos, 0), 1) * video.duration;
  }

  video.addEventListener("play", () => {
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
    overlayPlay.classList.remove("visible");
  });

  video.addEventListener("pause", () => {
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
    overlayPlay.classList.add("visible");
    player.classList.add("controls-active");
  });

  video.addEventListener("timeupdate", updateProgress);

  video.addEventListener("loadedmetadata", () => {
    durationDisplay.textContent = formatTime(video.duration);
  });

  video.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });

  player.addEventListener("mousemove", showControlsTemporarily);
  player.addEventListener("touchstart", showControlsTemporarily, {passive: true});

  playPauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMute();
  });

  let isDragging = false;
  progressContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    seek(e);
  });

  window.addEventListener("mousemove", (e) => {
    if (isDragging) seek(e);
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  player.addEventListener("click", (e) => {
    if (e.target === player) {
      closeMediaViewer();
    }
  });

  const handleKeyDown = (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    }
  };
  window.addEventListener("keydown", handleKeyDown);

  const observer = new MutationObserver((mutations, obs) => {
    if (!document.getElementById("customVideoPlayer")) {
      window.removeEventListener("keydown", handleKeyDown);
      obs.disconnect();
    }
  });
  observer.observe(document.getElementById("mediaViewerContent"), { childList: true });
}

function closeMediaViewer() {
  const modal = document.getElementById("mediaViewerModal");
  if (!modal) return;
  modal.classList.remove("active");
  setTimeout(() => {
    modal.style.display = "none";
    const content = document.getElementById("mediaViewerContent");
    if (content) content.innerHTML = "";
  }, 250);
}

const mediaViewerModal = document.getElementById("mediaViewerModal");
const mediaViewerCloseBtn = document.getElementById("mediaViewerCloseBtn");
if (mediaViewerCloseBtn) {
  mediaViewerCloseBtn.addEventListener("click", closeMediaViewer);
}
if (mediaViewerModal) {
  mediaViewerModal.addEventListener("click", (e) => {
    if (e.target === mediaViewerModal) {
      closeMediaViewer();
    }
  });
}

// ===== Play Audio in pre-existing bottom Now Playing bar (Mini Player) =====
function playAudioInMiniPlayer(url, filename, sender) {
  if (!audioPlayer || !miniPlayer) return;
  
  // Toggle play/pause if same URL is playing/paused
  if (audioPlayer.src === url) {
    if (audioPlayer.paused) {
      audioPlayer.play().catch(err => console.error(err));
    } else {
      audioPlayer.pause();
    }
    return;
  }
  
  audioPlayer.src = url;
  if (downloadLink) {
    downloadLink.href = url;
    downloadLink.classList.remove("disabled");
  }
  
  if (miniTitle) miniTitle.textContent = filename;
  if (miniSub) miniSub.textContent = sender;
  
  miniPlayer.style.display = "block";
  miniPlayer.classList.remove("generating"); // Ensure not hidden by generating mode
  
  const bars = document.getElementById("miniBars");
  if (bars) bars.style.display = "flex";
  
  audioPlayer.load();
  audioPlayer.play().catch(err => console.error("Audio playback failed:", err));
  
  if (statusPill) {
    statusPill.textContent = TRANSLATIONS[currentLang]["audio-ready"] || "Playing";
  }
}

// ===== Dashboard Portal Logic =====
function showTtsPage() {
  if (portalContainer) portalContainer.style.display = "none";
  if (appLayoutWrapper) {
    appLayoutWrapper.style.display = ""; 
    appLayoutWrapper.classList.add("show-tts-only");
    appLayoutWrapper.classList.remove("show-chat-only");
  }
  if (appContainer) appContainer.style.display = "block";
  if (chatCard) chatCard.style.display = "none";
  if (homeBtn) homeBtn.style.display = "inline-flex";
}

function showChatPage() {
  if (portalContainer) portalContainer.style.display = "none";
  if (appLayoutWrapper) {
    appLayoutWrapper.style.display = ""; 
    appLayoutWrapper.classList.remove("show-tts-only");
    appLayoutWrapper.classList.add("show-chat-only");
  }
  if (appContainer) appContainer.style.display = "none";
  if (chatCard) chatCard.style.display = "block";
  if (homeBtn) homeBtn.style.display = "inline-flex";
}

function showPortalPage() {
  if (portalContainer) portalContainer.style.display = "flex";
  if (appLayoutWrapper) {
    appLayoutWrapper.style.display = "none";
    appLayoutWrapper.classList.remove("show-tts-only", "show-chat-only");
  }
  if (homeBtn) homeBtn.style.display = "none";
}

// Bind to window object for inline HTML onclick handlers
window.showTtsPage = showTtsPage;
window.showChatPage = showChatPage;
window.showPortalPage = showPortalPage;

if (goTtsBtn) goTtsBtn.addEventListener("click", showTtsPage);
if (goChatBtn) goChatBtn.addEventListener("click", showChatPage);
if (homeBtn) homeBtn.addEventListener("click", showPortalPage);
