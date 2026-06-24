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
    const response = await fetch("/api/voices");
    if (!response.ok) throw new Error("Could not load voices.");
    const voices = await response.json();

    voiceSelect.innerHTML = "";
    for (const voice of voices) {
      const option = document.createElement("option");
      option.value = voice.short_name;
      option.textContent = voice.label;
      option.dataset.locale = voice.locale;
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

    setStatus(TRANSLATIONS[currentLang]["generating-voice"], "loading");
    if (generateButton) {
      generateButton.disabled = true;
      const btnSpan = generateButton.querySelector("span:last-child");
      if (btnSpan) btnSpan.textContent = TRANSLATIONS[currentLang]["generating"];
    }
    setDownloadState(false);
    
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

      const response = await fetch("/api/tts", {
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
    } catch (error) {
      setStatus(error.message || TRANSLATIONS[currentLang]["something-wrong"]);
      if (miniTitle) miniTitle.textContent = TRANSLATIONS[currentLang]["error"];
      showToast(error.message || TRANSLATIONS[currentLang]["something-wrong"]);
      if (!currentAudioUrl && miniPlayer) {
        miniPlayer.style.display = "none";
      }
    } finally {
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
}};

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

function initUserSession() {
  isUserSignedIn = safeStorage.getItem("tg_signed_in") === "true";
  
  if (isUserSignedIn) {
    myUsername = safeStorage.getItem("tg_username");
    myAvatarUrl = safeStorage.getItem("tg_avatar_url") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";
    myEmail = safeStorage.getItem("tg_email");
    
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
    return `<span style="${wrapper}">${shimmer}<img src="${animatedEmojiMap[emoji]}" class="ios-emoji animated" style="${imgStyle}" alt="${emoji}" ${loadAttr} ${retryAttr} /></span>`;
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

// Render reactions wrapper inside the bubble container
function renderReactions(msgBubble, messageId, reactions) {
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

function appendChatMessage(sender, text, isSelf, avatarBg = '', type = 'message', avatarUrl = '', messageId = '', reactions = {}, attachment = {}, tempId = '') {
  if (!chatMessages) return;

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
        avatarContent = `<img src="${avatarUrl}" alt="${sender}" class="account-pic" />`;
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
      // Render attachments (images, video, documents)
      if (attachment && attachment.url) {
        bubble.classList.add('msg-bubble-has-attachment');
        const attachDiv = document.createElement('div');
        
        if (attachment.content_type && attachment.content_type.startsWith("image/")) {
          attachDiv.className = "msg-bubble-media";
          attachDiv.innerHTML = `<img src="${attachment.url}" alt="${attachment.filename || 'Image'}" loading="lazy" />`;
          attachDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(attachment.url, '_blank');
          });
        } else if (attachment.content_type && attachment.content_type.startsWith("video/")) {
          attachDiv.className = "msg-video-player";
          attachDiv.innerHTML = `<video src="${attachment.url}" controls preload="metadata" playsinline></video>`;
          attachDiv.addEventListener('click', (e) => e.stopPropagation());
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

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function connectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  // Clear messages list on connect to avoid duplication of history
  if (chatMessages) {
    chatMessages.innerHTML = '<div class="chat-date-separator"><span>Today</span></div>';
  }

  // Check if we are running in local dev (localhost, 127.0.0.1, or file protocol)
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || !window.location.hostname;
  
  // Set host and protocol. If local, route to online production websocket server.
  const wsProtocol = isLocal ? "wss:" : (window.location.protocol === "https:" ? "wss:" : "ws:");
  const wsHost = isLocal ? "burmeserecap.tech" : window.location.host;
  
  const wsUsername = isUserSignedIn ? myUsername : `Guest_${Math.floor(100 + Math.random() * 900)}`;
  const wsUrl = `${wsProtocol}//${wsHost}/ws/chat?username=${encodeURIComponent(wsUsername)}`;

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

      if (onlineCountEl && message.onlineCount !== undefined && message.totalUsers !== undefined) {
        if (currentLang === "en") {
          onlineCountEl.textContent = `${message.totalUsers.toLocaleString()} members, ${message.onlineCount.toLocaleString()} online`;
        } else {
          onlineCountEl.textContent = `အဖွဲ့ဝင် ${message.totalUsers.toLocaleString()} ဦး၊ ${message.onlineCount.toLocaleString()} ဦး အွန်လိုင်းရှိသည်`;
        }
      }

      if (message.type === 'system') {
        appendChatMessage("System", message.text, false, '', 'system');
      } else if (message.type === 'message') {
        const isSelf = message.sender === myUsername;
        if (isSelf && message.tempId) {
          const localBubble = chatMessages.querySelector(`[data-msg-id="${message.tempId}"]`);
          if (localBubble) {
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
const signUpAvatarCustom = document.getElementById("signUpAvatarCustom");

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
    avatarUploadBtn.innerHTML = "⏳ Uploading...";

    try {
      const response = await fetch("/api/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type })
      });

      if (!response.ok) throw new Error("Failed to get presigned URL");
      const data = await response.json();

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.upload_url, true);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.setRequestHeader("x-amz-acl", "public-read");

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const downloadUrl = data.download_url;
          signUpAvatarCustom.value = downloadUrl;
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
            signUpAvatarCustom.value = downloadUrl;
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
    if (!emailVal) return;

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Account not found.");
      }
      return res.json();
    })
    .then((profile) => {
      safeStorage.setItem("tg_signed_in", "true");
      safeStorage.setItem("tg_username", profile.username);
      safeStorage.setItem("tg_avatar_url", profile.avatar_url);
      safeStorage.setItem("tg_email", profile.email);
      
      initUserSession();
      closeAuthModal();
      
      if (socket) socket.close(); // trigger reconnect
    })
    .catch((err) => {
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
    let avatarUrlVal = signUpAvatarCustom.value.trim();

    if (!userVal || !emailVal) return;
    if (!avatarUrlVal) {
      avatarUrlVal = selectedAvatarUrl;
    }

    fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: userVal,
        email: emailVal,
        avatar_url: avatarUrlVal
      })
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Signup failed.");
      }
      return res.json();
    })
    .then((profile) => {
      safeStorage.setItem("tg_signed_in", "true");
      safeStorage.setItem("tg_username", profile.username);
      safeStorage.setItem("tg_avatar_url", profile.avatar_url);
      safeStorage.setItem("tg_email", profile.email);
      
      initUserSession();
      closeAuthModal();
      
      if (socket) socket.close(); // trigger reconnect
    })
    .catch((err) => {
      signUpError.textContent = err.message;
    });
  });
}

function handleSignOut() {
  const confirmMsg = TRANSLATIONS[currentLang]["sign-out-confirm"].replace("{username}", myUsername);
  if (confirm(confirmMsg)) {
    safeStorage.removeItem("tg_signed_in");
    safeStorage.removeItem("tg_username");
    safeStorage.removeItem("tg_avatar_url");
    safeStorage.removeItem("tg_email");
    
    initUserSession();
    
    if (socket) socket.close();
  }
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

if (pickerGrid) {
  Object.entries(animatedEmojiMap).forEach(([emoji, url]) => {
    const btn = document.createElement("button");
    btn.className = "picker-emoji-btn";
    btn.type = "button";
    btn.innerHTML = `<span style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;"><span class="emoji-shimmer" style="position:absolute;top:0;left:0;width:28px;height:28px;border-radius:50%;"></span><img src="${url}" alt="${emoji}" style="width:28px;height:28px;opacity:0;transition:opacity 0.15s;object-fit:contain;" onload="this.style.opacity='1';this.parentElement.querySelector('.emoji-shimmer').style.display='none'" onerror="if(!this.dataset.retries){this.dataset.retries=0}this.dataset.retries++;if(this.dataset.retries<3){setTimeout(()=>{this.src=this.src+'&r='+this.dataset.retries},800*this.dataset.retries)}else{this.style.display='none';var s=this.parentElement.querySelector('.emoji-shimmer');if(s){s.textContent='${emoji}';s.classList.remove('emoji-shimmer');s.style.cssText='font-size:22px;display:flex;align-items:center;justify-content:center;width:28px;height:28px;'}}" /></span>`;
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
}

// Chat Attachment Upload and Progress Tracker Logic
function uploadChatAttachment(file) {
  if (!socket || socket.readyState !== WebSocket.OPEN || !isUserSignedIn) return;

  if (file.size > 50 * 1024 * 1024) {
    showToast(currentLang === 'en' ? "File must be smaller than 50MB." : "ဖိုင်အရွယ်အစား 50MB အောက် ဖြစ်ရပါမည်။");
    return;
  }

  const tempId = "temp-upload-" + Date.now();
  const timeStr = formatCurrentTime();
  
  let fileIcon = getFileIconSVGByType(file.type);

  const msgDiv = document.createElement("div");
  msgDiv.id = tempId;
  msgDiv.className = "chat-message sent";
  msgDiv.innerHTML = `
    <div class="msg-bubble msg-bubble-has-attachment">
      <div class="msg-file-card" style="position:relative; margin-bottom: 0;">
        <div class="file-icon-circle">${fileIcon}</div>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${(file.size / 1024 / 1024).toFixed(1)} MB</div>
        </div>
        <div class="upload-progress-overlay">
          <div class="progress-spinner"></div>
          <div class="progress-text">0%</div>
        </div>
      </div>
      <div class="msg-time">
        <span>${timeStr}</span>
        <span class="msg-status-ticks">...</span>
      </div>
    </div>
  `;
  if (chatMessages) {
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  const progressTextEl = msgDiv.querySelector(".progress-text");

  fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, content_type: file.type })
  })
  .then(async (res) => {
    if (!res.ok) throw new Error("Sign request failed");
    return res.json();
  })
  .then((data) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", data.upload_url, true);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-amz-acl", "public-read");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (progressTextEl) {
          progressTextEl.textContent = percent + "%";
        }
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const tempBubble = document.getElementById(tempId);
        if (tempBubble) tempBubble.remove();

        const payload = {
          text: "",
          avatarBg: "",
          avatar_url: myAvatarUrl,
          attachment: {
            url: data.download_url,
            filename: file.name,
            content_type: file.type,
            size: file.size
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
    const tempBubble = document.getElementById(tempId);
    if (tempBubble) {
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
    }
    showToast(reason);
    setTimeout(() => {
      if (tempBubble) tempBubble.remove();
    }, 4000);
  }
}

if (emojiTrigger && emojiPicker) {
  // Render trigger icon using the high-quality animated WebP emoji
  emojiTrigger.innerHTML = getEmojiHTML("😊", 20);
  
  const attachTrigger = document.querySelector(".attach-trigger");
  const chatFileInput = document.getElementById("chatFileInput");

  if (attachTrigger && chatFileInput) {
    attachTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isUserSignedIn) {
        openAuthModal();
        return;
      }
      chatFileInput.click();
    });

    chatFileInput.addEventListener("change", () => {
      const file = chatFileInput.files[0];
      if (file) {
        uploadChatAttachment(file);
      }
      chatFileInput.value = "";
    });
  }

  emojiTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = emojiPicker.style.display !== "flex";
    emojiPicker.style.display = isHidden ? "flex" : "none";
  });
  
  // Close picker when clicking outside
  document.addEventListener("click", (e) => {
    if (!emojiPicker.contains(e.target) && !e.target.closest(".emoji-trigger")) {
      emojiPicker.style.display = "none";
    }
  });
}

// Global click and scroll listeners to close context menu
document.addEventListener('click', () => {
  const existingMenu = document.querySelector('.tg-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
});

if (chatMessages) {
  chatMessages.addEventListener('scroll', () => {
    const existingMenu = document.querySelector('.tg-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  });
}

// ===== Translation switcher button listeners =====
const langEnBtn = document.getElementById("langEnBtn");
const langMmBtn = document.getElementById("langMmBtn");
if (langEnBtn && langMmBtn) {
  langEnBtn.addEventListener("click", () => updateLanguage("en"));
  langMmBtn.addEventListener("click", () => updateLanguage("my"));
}

// ===== Dashboard Portal Logic =====
function showTtsPage() {
  document.body.classList.remove("chat-only-view");
  if (portalContainer) portalContainer.style.display = "none";
  if (appLayoutWrapper) {
    appLayoutWrapper.style.display = ""; 
    appLayoutWrapper.classList.add("show-tts-only");
    appLayoutWrapper.classList.remove("show-chat-only");
  }
  if (appContainer) appContainer.style.display = "block";
  if (chatCard) chatCard.style.display = "none";
}

function showChatPage() {
  document.body.classList.add("chat-only-view");
  if (portalContainer) portalContainer.style.display = "none";
  if (appLayoutWrapper) {
    appLayoutWrapper.style.display = ""; 
    appLayoutWrapper.classList.remove("show-tts-only");
    appLayoutWrapper.classList.add("show-chat-only");
  }
  if (appContainer) appContainer.style.display = "none";
  if (chatCard) chatCard.style.display = "flex";
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function showPortalPage() {
  document.body.classList.remove("chat-only-view");
  if (portalContainer) portalContainer.style.display = "flex";
  if (appLayoutWrapper) {
    appLayoutWrapper.style.display = "none";
    appLayoutWrapper.classList.remove("show-tts-only", "show-chat-only");
  }
}

if (goTtsBtn) goTtsBtn.addEventListener("click", showTtsPage);
if (goChatBtn) goChatBtn.addEventListener("click", showChatPage);

// ===== Init =====
updateCount();
updateSliders();
setDownloadState(false);
loadVoices();
updateLanguage(currentLang);
connectWebSocket();
renderPresetAvatars();

// Show plans modal automatically on first visit
const hasSeenPlans = safeStorage.getItem("has_seen_plans_v2");
if (!hasSeenPlans) {
  openPlansModal();
  safeStorage.setItem("has_seen_plans_v2", "true");
}

// Scroll to bottom of chat on page load
if (chatMessages) {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
