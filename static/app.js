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
const sampleButton = document.getElementById("sampleButton");

const voiceScroller = document.getElementById("voiceScroller");
const miniBars = document.getElementById("miniBars");
const miniTitle = document.getElementById("miniTitle");
const miniSub = document.getElementById("miniSub");

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
      <div class="spotlight-emoji">➕</div>
      <div class="spotlight-name">More Voices</div>
      <div class="spotlight-lang">${options.length - 15} hidden</div>
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
  const shortName = label.split("•")[0].trim().split(" ").pop() || "Voice";
  const lang = option.dataset.locale || "en-US";
  
  // Choose flag or generic speech icon
  const langPrefix = lang.split("-").slice(0, 2).join("-");
  const flag = localeFlags[langPrefix] || "🗣️";

  card.innerHTML = `
    <div class="spotlight-emoji">${flag}</div>
    <div class="spotlight-name" title="${label}">${shortName}</div>
    <div class="spotlight-lang">${lang}</div>
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
  voiceSelect.innerHTML = `<option>Loading voices...</option>`;
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
    setStatus("Studio ready — pick a voice and start creating.");
  } catch (error) {
    voiceSelect.innerHTML = `<option>Voice loading failed</option>`;
    setStatus("Unable to load voices. Check connection and refresh.");
    if (voiceScroller) {
      voiceScroller.innerHTML = `
        <div class="spotlight-card placeholder-card">
          <div class="spotlight-emoji">⚠️</div>
          <div class="spotlight-name">Offline</div>
          <div class="spotlight-lang">No connection</div>
        </div>
      `;
    }
  }
}

// ===== Events =====
if (sampleButton) {
  sampleButton.addEventListener("click", () => {
    if (textInput) {
      textInput.value = sampleText;
      updateCount();
    }
    setStatus("Sample loaded — hit Generate when ready.");
  });
}

if (voiceSelect) voiceSelect.addEventListener("change", updateLocaleHint);
if (textInput) textInput.addEventListener("input", updateCount);
if (rateInput) rateInput.addEventListener("input", updateSliders);
if (pitchInput) pitchInput.addEventListener("input", updateSliders);

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    setStatus("Generating voice sample…", "loading");
    if (generateButton) {
      generateButton.disabled = true;
      const btnSpan = generateButton.querySelector("span:last-child");
      if (btnSpan) btnSpan.textContent = "Generating…";
    }
    setDownloadState(false);
    if (miniTitle) miniTitle.textContent = "Generating…";

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
        throw new Error(errorData.detail || "TTS generation failed.");
      }

      const audioBlob = await response.blob();
      currentAudioUrl = URL.createObjectURL(audioBlob);
      if (audioPlayer) audioPlayer.src = currentAudioUrl;
      if (downloadLink) downloadLink.href = currentAudioUrl;
      setDownloadState(true);
      setStatus("Audio ready — play or download.", "ready");
      if (miniTitle) miniTitle.textContent = "Audio Ready";
      if (miniSub) miniSub.textContent = voiceSelect.selectedOptions[0]?.textContent || "Voice";
    } catch (error) {
      setStatus(error.message || "Something went wrong.");
      if (miniTitle) miniTitle.textContent = "Error";
    } finally {
      if (generateButton) {
        generateButton.disabled = false;
        const btnSpan = generateButton.querySelector("span:last-child");
        if (btnSpan) btnSpan.textContent = "Generate Voice";
      }
    }
  });
}

// ===== Mini Player Visualizer Sync =====
if (miniBars && audioPlayer) {
  audioPlayer.addEventListener("play", () => {
    miniBars.classList.add("playing");
    if (miniTitle) miniTitle.textContent = "Now Playing";
  });
    audioPlayer.addEventListener("pause", () => {
    miniBars.classList.remove("playing");
    if (miniTitle) miniTitle.textContent = "Paused";
  });
  audioPlayer.addEventListener("ended", () => {
    miniBars.classList.remove("playing");
    if (miniTitle) miniTitle.textContent = "Audio Ready";
  });
}

// ===== Telegram Live Chat Interactivity (WebSockets & Official Google Auth) =====
const chatMessages = document.getElementById("chatMessages");
const chatMessageInput = document.getElementById("chatMessageInput");
const chatSendButton = document.getElementById("chatSendButton");
const onlineCountEl = document.getElementById("onlineCount");
const statusDot = document.querySelector(".status-dot");

const loginHeaderBtn = document.getElementById("loginHeaderBtn");
const chatInputLockOverlay = document.getElementById("chatInputLockOverlay");
const chatInputArea = document.getElementById("chatInputArea");
const lockSignInBtn = document.getElementById("lockSignInBtn");

// Session State
let isUserSignedIn = localStorage.getItem("tg_signed_in") === "true";
let myUsername = "";
let myAvatarUrl = "";
let myEmail = "";

function initUserSession() {
  isUserSignedIn = localStorage.getItem("tg_signed_in") === "true";
  
  if (isUserSignedIn) {
    myUsername = localStorage.getItem("tg_username");
    myAvatarUrl = localStorage.getItem("tg_avatar_url") || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80";
    myEmail = localStorage.getItem("tg_email");
    
    // Unlock Chat Input
    if (chatInputLockOverlay) chatInputLockOverlay.style.display = "none";
    if (chatMessageInput) {
      chatMessageInput.removeAttribute("disabled");
      chatMessageInput.placeholder = "Write a message...";
    }
    if (chatSendButton) chatSendButton.removeAttribute("disabled");
    
    // Update Header Button to Sign Out
    if (loginHeaderBtn) {
      loginHeaderBtn.innerHTML = `<img src="${myAvatarUrl}" class="account-pic" style="width:16px;height:16px;border:none;margin-right:4px;border-radius:50%;object-fit:cover;" /> Sign Out`;
      loginHeaderBtn.title = `Signed in as ${myUsername}. Click to Sign Out.`;
    }
  } else {
    myUsername = "Guest";
    myAvatarUrl = "";
    myEmail = "";
    
    // Lock Chat Input
    if (chatInputLockOverlay) chatInputLockOverlay.style.display = "flex";
    if (chatMessageInput) {
      chatMessageInput.setAttribute("disabled", "true");
      chatMessageInput.placeholder = "Sign in to send messages...";
    }
    if (chatSendButton) chatSendButton.setAttribute("disabled", "true");
    
    // Update Header Button to Sign In
    if (loginHeaderBtn) {
      loginHeaderBtn.innerHTML = `👤 Sign In`;
      loginHeaderBtn.title = "Sign In / Sign Up";
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

function appendChatMessage(sender, text, isSelf, avatarBg = '', type = 'message', avatarUrl = '') {
  if (!chatMessages) return;

  const msgDiv = document.createElement("div");

  if (type === 'system') {
    msgDiv.className = "chat-date-separator";
    msgDiv.innerHTML = `<span>${text}</span>`;
  } else {
    msgDiv.className = `chat-message ${isSelf ? 'sent' : 'received'}`;
    const timeStr = formatCurrentTime();

    if (isSelf) {
      msgDiv.innerHTML = `
        <div class="msg-bubble">
          <div class="msg-text">${text}</div>
          <div class="msg-time">
            <span>${timeStr}</span>
            <span class="msg-status-ticks">✓✓</span>
          </div>
        </div>
      `;
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
          <div class="msg-sender">${sender}</div>
          <div class="msg-text">${text}</div>
          <div class="msg-time">${timeStr}</div>
        </div>
      `;
    }
  }

  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function connectWebSocket() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  // Check if we are running in local dev (localhost, 127.0.0.1, or file protocol)
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || !window.location.hostname;
  
  // Set host and protocol. If local, route to online production websocket server.
  const wsProtocol = isLocal ? "wss:" : (window.location.protocol === "https:" ? "wss:" : "ws:");
  const wsHost = isLocal ? "burmeserecp.tech" : window.location.host;
  
  const wsUsername = isUserSignedIn ? myUsername : `Guest_${Math.floor(100 + Math.random() * 900)}`;
  const wsUrl = `${wsProtocol}//${wsHost}/ws/chat?username=${encodeURIComponent(wsUsername)}`;

  console.log(`Connecting to WebSocket as ${wsUsername}: ${wsUrl}`);
  
  if (statusDot) {
    statusDot.style.backgroundColor = "#ff9500";
    statusDot.style.boxShadow = "0 0 4px #ff9500";
  }
  if (onlineCountEl) {
    onlineCountEl.textContent = "Connecting to community server...";
  }

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WebSocket connected.");
    currentReconnectDelay = reconnectInterval;
    if (statusDot) {
      statusDot.style.backgroundColor = "var(--ios-green)";
      statusDot.style.boxShadow = "0 0 4px var(--ios-green)";
    }
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (onlineCountEl && message.onlineCount !== undefined) {
        onlineCountEl.textContent = `1,428 members, ${message.onlineCount} online`;
      }

      if (message.type === 'system') {
        appendChatMessage("System", message.text, false, '', 'system');
      } else if (message.type === 'message') {
        const isSelf = message.sender === myUsername;
        appendChatMessage(message.sender, message.text, isSelf, message.avatarBg, 'message', message.avatar_url);
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
      onlineCountEl.textContent = "Offline. Reconnecting...";
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

  const payload = {
    text: text,
    avatarBg: "",
    avatar_url: myAvatarUrl
  };

  socket.send(JSON.stringify(payload));
  chatMessageInput.value = "";
}

// ===== Preset Avatars list =====
const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&h=80&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&h=80&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&h=80&q=80"
];

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

// Event bindings for Modal
if (closeAuthModalBtn) {
  closeAuthModalBtn.addEventListener("click", closeAuthModal);
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
      localStorage.setItem("tg_signed_in", "true");
      localStorage.setItem("tg_username", profile.username);
      localStorage.setItem("tg_avatar_url", profile.avatar_url);
      localStorage.setItem("tg_email", profile.email);
      
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
      localStorage.setItem("tg_signed_in", "true");
      localStorage.setItem("tg_username", profile.username);
      localStorage.setItem("tg_avatar_url", profile.avatar_url);
      localStorage.setItem("tg_email", profile.email);
      
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
  if (confirm(`Do you want to sign out from ${myUsername}?`)) {
    localStorage.removeItem("tg_signed_in");
    localStorage.removeItem("tg_username");
    localStorage.removeItem("tg_avatar_url");
    localStorage.removeItem("tg_email");
    
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

// ===== Init =====
updateCount();
updateSliders();
setDownloadState(false);
loadVoices();
initUserSession();
connectWebSocket();
renderPresetAvatars();

// Scroll to bottom of chat on page load
if (chatMessages) {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
