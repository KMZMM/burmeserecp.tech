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

let currentAudioUrl = null;

const sampleText =
  "Welcome to BurmeseRecp.tech. This voice sample is generated with Edge TTS and presented in a polished, iOS-inspired studio interface.";

function setStatus(message, tone = "idle") {
  statusCard.textContent = message;
  statusPill.textContent =
    tone === "loading" ? "Generating" : tone === "ready" ? "Ready" : "Idle";
  statusPill.style.color = tone === "ready" ? "var(--success)" : "var(--text)";
}

function updateCount() {
  charCount.textContent = `${textInput.value.length} / 5000`;
}

function updateSliders() {
  rateValue.textContent = `${Number(rateInput.value)}%`;
  pitchValue.textContent = `${Number(pitchInput.value)}Hz`;
}

function setDownloadState(enabled) {
  if (enabled) {
    downloadLink.classList.remove("disabled");
  } else {
    downloadLink.classList.add("disabled");
    downloadLink.removeAttribute("href");
  }
}

function updateLocaleHint() {
  const selected = voiceSelect.selectedOptions[0];
  localeHint.value = selected?.dataset.locale || "Auto from voice";
}

async function loadVoices() {
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
      [...voiceSelect.options].find((option) =>
        option.value.includes("en-US-AvaMultilingualNeural")
      ) || [...voiceSelect.options][0];

    if (preferredVoice) preferredVoice.selected = true;
    updateLocaleHint();
    setStatus("Voices loaded. Your studio is ready.");
  } catch (error) {
    voiceSelect.innerHTML = `<option>Voice loading failed</option>`;
    setStatus("Unable to load voices. Check your connection and refresh.");
  }
}

sampleButton.addEventListener("click", () => {
  textInput.value = sampleText;
  updateCount();
  setStatus("Sample script loaded. Generate a preview when you are ready.");
});

voiceSelect.addEventListener("change", updateLocaleHint);
textInput.addEventListener("input", updateCount);
rateInput.addEventListener("input", updateSliders);
pitchInput.addEventListener("input", updateSliders);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  setStatus("Rendering your voice sample. This usually takes a few seconds.", "loading");
  generateButton.disabled = true;
  generateButton.textContent = "Generating...";
  setDownloadState(false);

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "TTS generation failed.");
    }

    const audioBlob = await response.blob();
    currentAudioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = currentAudioUrl;
    downloadLink.href = currentAudioUrl;
    setDownloadState(true);
    setStatus("Audio is ready. Play it back or download the MP3.", "ready");
  } catch (error) {
    setStatus(error.message || "Something went wrong while generating audio.");
  } finally {
    generateButton.disabled = false;
    generateButton.textContent = "Generate voice";
  }
});

updateCount();
updateSliders();
setDownloadState(false);
loadVoices();
