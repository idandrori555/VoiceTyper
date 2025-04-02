document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const startBtn = document.getElementById("start-btn");
  const stopBtn = document.getElementById("stop-btn");
  const resetBtn = document.getElementById("reset-btn");
  const promptText = document.getElementById("prompt-text");
  const recognizedText = document.getElementById("recognized-text");
  const wordCountEl = document.getElementById("word-count");
  const wpmEl = document.getElementById("wpm");
  const timerEl = document.getElementById("timer");
  const accuracyEl = document.getElementById("accuracy");
  const recordingsList = document.getElementById("recordings");

  // Sample texts for speech practice
  const sampleTexts = [
    "Ani Yeled Tov",
    "Sagiv Sagiv Sagiv",
    "🥀🥀"
  ];

  // App state
  let isRecording = false;
  let recognition = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let startTime = 0;
  let timerInterval = null;
  let currentWordIndex = 0;
  let correctWords = 0;
  let totalSpokenWords = 0;
  let currentText = "";
  let currentPromptWords = [];
  let elapsedTimeInSeconds = 0;

  // Initialize speech recognition
  function initSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari."
      );
      return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          processTranscript(transcript);
        } else {
          interimTranscript += transcript;
        }
      }

      recognizedText.textContent = finalTranscript + interimTranscript;
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert(`Speech recognition error: ${event.error}`);
      stopRecording();
    };

    return true;
  }

  // Initialize media recorder for saving audio
  function initMediaRecorder() {
    return navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          saveRecording(audioBlob);
        };

        return true;
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
        alert(`Error accessing microphone: ${error.message}`);
        return false;
      });
  }

  // Generate a random text prompt
  function generatePrompt() {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    currentText = sampleTexts[randomIndex];
    currentPromptWords = currentText.split(/\s+/);

    promptText.innerHTML = "";
    currentPromptWords.forEach((word, index) => {
      const wordSpan = document.createElement("span");
      wordSpan.textContent = word;
      wordSpan.classList.add("word");
      if (index === 0) wordSpan.classList.add("current");
      promptText.appendChild(wordSpan);

      // Add space after each word except the last one
      if (index < currentPromptWords.length - 1) {
        promptText.appendChild(document.createTextNode(" "));
      }
    });

    currentWordIndex = 0;
    correctWords = 0;
  }

  // Process spoken transcript
  function processTranscript(transcript) {
    const words = transcript.trim().split(/\s+/);

    words.forEach((spokenWord) => {
      if (currentWordIndex >= currentPromptWords.length) return;

      const promptWord = currentPromptWords[currentWordIndex];
      const wordElements = promptText.querySelectorAll(".word");

      // Remove 'current' class from previous word
      wordElements[currentWordIndex].classList.remove("current");

      // Check if the spoken word matches the prompt word
      const normalizedSpokenWord = spokenWord
        .toLowerCase()
        .replace(/[.,!?;:]$/, "");
      const normalizedPromptWord = promptWord
        .toLowerCase()
        .replace(/[.,!?;:]$/, "");

      if (normalizedSpokenWord === normalizedPromptWord) {
        wordElements[currentWordIndex].classList.add("correct");
        correctWords++;
      } else {
        wordElements[currentWordIndex].classList.add("incorrect");
      }

      currentWordIndex++;
      totalSpokenWords++;

      // Add 'current' class to the next word if available
      if (currentWordIndex < wordElements.length) {
        wordElements[currentWordIndex].classList.add("current");
      } else {
        // All words completed
        setTimeout(() => {
          generatePrompt();
        }, 1000);
      }

      updateStats();
    });
  }

  // Update statistics display
  function updateStats() {
    wordCountEl.textContent = totalSpokenWords;

    if (elapsedTimeInSeconds > 0) {
      const wpm = Math.round((totalSpokenWords / elapsedTimeInSeconds) * 60);
      wpmEl.textContent = wpm;

      if (totalSpokenWords > 0) {
        const accuracyPercentage = Math.round(
          (correctWords / totalSpokenWords) * 100
        );
        accuracyEl.textContent = `${accuracyPercentage}%`;
      }
    }
  }

  // Update timer
  function updateTimer() {
    elapsedTimeInSeconds = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = `${elapsedTimeInSeconds}s`;
  }

  // Start recording
  function startRecording() {
    if (!recognition || !mediaRecorder) return;

    generatePrompt();
    recognizedText.textContent = "";
    totalSpokenWords = 0;
    correctWords = 0;
    audioChunks = [];
    elapsedTimeInSeconds = 0;

    updateStats();

    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);

    recognition.start();
    mediaRecorder.start();

    isRecording = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }

  // Stop recording
  function stopRecording() {
    if (!isRecording) return;

    clearInterval(timerInterval);

    if (recognition) recognition.stop();
    if (mediaRecorder && mediaRecorder.state !== "inactive")
      mediaRecorder.stop();

    isRecording = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  // Reset the application
  function resetApp() {
    stopRecording();
    recognizedText.textContent = "";
    promptText.textContent = "Press Start to begin...";
    wordCountEl.textContent = "0";
    wpmEl.textContent = "0";
    timerEl.textContent = "0s";
    accuracyEl.textContent = "0%";
    totalSpokenWords = 0;
    correctWords = 0;
    currentWordIndex = 0;
  }

  // Save recording to server
  function saveRecording(audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("totalWords", totalSpokenWords);
    formData.append("wordsPerMinute", wpmEl.textContent);
    formData.append("accuracy", accuracyEl.textContent);

    fetch("/save-recording", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Recording saved:", data);
        addRecordingToList(data.stats, audioBlob);
      })
      .catch((error) => {
        console.error("Error saving recording:", error);
        alert("Error saving recording. Please try again.");
      });
  }

  // Add recording to the list
  function addRecordingToList(stats, audioBlob) {
    const li = document.createElement("li");

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = document.createElement("audio");
    audio.src = audioUrl;
    audio.controls = true;

    const statsDiv = document.createElement("div");
    statsDiv.classList.add("recording-stats");
    statsDiv.innerHTML = `
        <p>Words: <span>${stats.totalWords}</span></p>
        <p>WPM: <span>${stats.wordsPerMinute}</span></p>
        <p>Accuracy: <span>${stats.accuracy}</span></p>
      `;

    li.appendChild(audio);
    li.appendChild(statsDiv);

    recordingsList.prepend(li);
  }

  // Initialize the application
  async function initApp() {
    const speechRecognitionInitialized = initSpeechRecognition();

    if (!speechRecognitionInitialized) {
      startBtn.disabled = true;
      return;
    }

    const mediaRecorderInitialized = await initMediaRecorder();

    if (!mediaRecorderInitialized) {
      startBtn.disabled = true;
      return;
    }

    resetApp();

    // Event listeners
    startBtn.addEventListener("click", startRecording);
    stopBtn.addEventListener("click", stopRecording);
    resetBtn.addEventListener("click", resetApp);
  }

  // Start the app
  initApp();
});
