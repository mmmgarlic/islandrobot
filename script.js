document.addEventListener("DOMContentLoaded", function () {
  const backgroundAudio = document.getElementById("backgroundAudio");

  // Ensure the background audio starts playing and handles autoplay issues
  backgroundAudio.play().catch((error) => {
    console.warn("Autoplay might be blocked by the browser. User interaction may be needed to start audio:", error);
  });

  const chatMessagesDiv = document.getElementById("chatMessages");
  
  function saveChatToLocalStorage() {
  const allMessages = [];
  document.querySelectorAll('.chatBubble').forEach(el => {
    allMessages.push({
      sender: el.classList.contains('user') ? 'user' : 'bot',
      text: el.textContent
    });
  });
  localStorage.setItem("islandChatHistory", JSON.stringify(allMessages));
}

function loadChatFromLocalStorage() {
  const saved = JSON.parse(localStorage.getItem("islandChatHistory") || "[]");
  
  // Remove intro messages if they exist in saved history
  const introMessages = [
    "Welcome to Thirsty Robot, the eco-conscious, text-based AI assistant! 💧 Processing AI queries consumes energy and water – to save resources, I use as few words as possible.",
    "With each interaction, I’ll calculate and visually track your approximate water usage throughout this session. Avoid the blue screen of death! 🔵",
    "So, how can I quench your thirst for knowledge today?",
  ];

  const filteredMessages = saved.filter(msg => !introMessages.includes(msg.text));
  filteredMessages.forEach(msg => {
    addMessage(msg.text, msg.sender);
  });
}

 
document.getElementById("resetChatBtn").addEventListener("click", () => {
  localStorage.removeItem("islandChatHistory");
  chatMessagesDiv.innerHTML = "";
  addIntroductoryMessages(); 
});

  
  const queryInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const chatInterface = document.getElementById("chatInterface");
  const waterCounter = document.getElementById("waterCounter");
  const loadingSpinner = document.getElementById("loadingSpinner");

  let sessionId;

  // Variables to track total water usage for min and max ranges
  let totalWaterUsedMin = 0;
  let totalWaterUsedMax = 0;

  const API_KEY = "<%= API_KEY %>";
  const ASSISTANT_ID = "<%= ASSISTANT_ID %>";

  async function initializeChat() {
    try {
      const response = await axios.post('/api/chat/session');
      sessionId = response.data.session_id;
      console.log("Chat session initialized:", sessionId);
    } catch (error) {
      console.error("Error initializing chat session:", error);
      const errorMessage = document.createElement("div");
      errorMessage.textContent = "Error initializing chat session. Please try refreshing the page.";
      errorMessage.style.color = "red";
      document.getElementById("chatMessages").appendChild(errorMessage);
    }
  }

  async function sendMessage(message) {
    try {
      const response = await axios.post('/api/message', {
        api_key: API_KEY,
        session_id: sessionId,
        assistant_id: ASSISTANT_ID,
        message: message
      });

      console.log("Bot response:", response.data);

      const botReply = response.data.botReply || "No response from chatbot.";
      const tokensUsed = response.data.tokensUsed || 0;
      console.log("Tokens used:", tokensUsed);

      const waterUsed = calculateWaterUsage(tokensUsed);
      updateWaterCounter(waterUsed);
      updateWaterLevel(totalWaterUsedMax);

      return botReply;
    } catch (error) {
      console.error("Error sending message:", error);
      return "Sorry, the developer of this site is a student and they've hit their monthly OpenAI API usage budget ... so try again next month (or just reach out to me at anaya.maheshwari@gmail.com and I'll fix it! Thank you for your patience!)";
    }
  }

  function calculateWaterUsage(tokenCount) {
    const waterPerTokenMin = 0.15;
    const waterPerTokenMax = 0.54;
    const waterUsedMin = tokenCount * waterPerTokenMin;
    const waterUsedMax = tokenCount * waterPerTokenMax;

    console.log(`Water Usage Min: ${waterUsedMin} mL, Max: ${waterUsedMax} mL`);

    return { min: waterUsedMin, max: waterUsedMax };
  }

  function updateWaterLevel(waterUsedMax) {
    const waterElement = document.getElementById("water");
    const inputField = document.getElementById("user-input");
    const inputFieldPosition = inputField.getBoundingClientRect().top;
    const initialWaterHeight = 100;
    const maxHeightBeforeInput = inputFieldPosition;

    let proportionalHeight =
      initialWaterHeight +
      (waterUsedMax / 900) * (maxHeightBeforeInput - initialWaterHeight);

    if (waterUsedMax >= 550) {
      proportionalHeight = window.innerHeight;
      waterElement.style.transition = "height 4s ease-out";
    } else {
      waterElement.style.transition = "height 0.5s ease-out";
    }

    waterElement.style.height = `${proportionalHeight}px`;
  }

  function updateWaterCounter(waterAmount) {
    if (waterCounter) {
      totalWaterUsedMin += waterAmount.min;
      totalWaterUsedMax += waterAmount.max;

      console.log("Total Water Used Min: ", totalWaterUsedMin);
      console.log("Total Water Used Max: ", totalWaterUsedMax);

      waterCounter.textContent = `Water Used: ${totalWaterUsedMin.toFixed(
        2
      )} mL - ${totalWaterUsedMax.toFixed(2)} mL`;

      updateWaterLevel(totalWaterUsedMax);
    } else {
      console.error("Water counter element not found.");
    }
  }

function addMessage(content, type, shouldSave = true) {
  const bubble = document.createElement("div");
  bubble.classList.add("chatBubble", type);
  bubble.textContent = content;
  chatMessagesDiv.appendChild(bubble);

  setTimeout(() => {
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  }, 10);

  if (shouldSave) saveChatToLocalStorage();
}


function addIntroductoryMessages() {
  const introMessages = [
    "Welcome to Thirsty Robot, the eco-conscious, text-based AI assistant! 💧 Processing AI queries consumes energy and water – to save resources, I use as few words as possible.",
    "With each interaction, I’ll calculate and visually track your approximate water usage throughout this session. Avoid the blue screen of death! 🔵",
    "So, how can I quench your thirst for knowledge today?",
  ];

  introMessages.forEach((message, index) => {
    setTimeout(() => {
      addMessage(message, "bot", false); // 👈 prevent saving
    }, index * 3000);
  });
}


  async function handleSendMessage() {
    const message = queryInput.value.trim();
    if (!message) return;

    addMessage(message, "user");

    queryInput.value = "ThirstyRobot is thinking...";
    queryInput.disabled = true;
    sendBtn.disabled = true;
    queryInput.style.backgroundColor = "#f0f0f0";
    sendBtn.style.backgroundColor = "#e0e0e0";
    loadingSpinner.style.display = "inline-block";

    try {
      const botReply = await sendMessage(message);
      addMessage(botReply, "bot");
    } finally {
      queryInput.disabled = false;
      sendBtn.disabled = false;
      queryInput.value = "";
      sendBtn.style.backgroundColor = "#ccda69";
      loadingSpinner.style.display = "none";
    }
  }

  sendBtn.addEventListener("click", handleSendMessage);
  queryInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  });

loadChatFromLocalStorage();
addIntroductoryMessages();
initializeChat();

  // Music toggle functionality
  const musicToggle = document.getElementById("music-toggle");
  const audio = new Audio("/oceanwaves.mp3");


  let isPlaying = false;

  musicToggle.addEventListener("click", () => {
    if (isPlaying) {
      audio.pause();
      musicToggle.classList.remove("active");
      isPlaying = false;
    } else {
      audio.play().catch((err) => {
        console.error("Audio playback failed:", err);
      });
      musicToggle.classList.add("active");
      isPlaying = true;
    }
  });

  audio.load();

  // Check water level periodically
  const waterElement = document.getElementById("water");
  const blueScreenText = document.getElementById("blue-screen-text");

  function checkWaterLevel() {
    const waterHeight = parseFloat(window.getComputedStyle(waterElement).height);
    const containerHeight = waterElement.parentElement.offsetHeight;

    console.log("Water Height (px):", waterHeight);
    console.log("Container Height (px):", containerHeight);

    // Compare pixel height to the container height
    if (waterHeight >= containerHeight) {
      console.log("Water has reached the threshold. Showing blue screen text.");
      blueScreenText.style.display = "block"; // Ensure visibility
      blueScreenText.classList.remove("hidden");
    }
  }

  setInterval(checkWaterLevel, 500);

  // Ensure pop-up opening functionality
  const aboutPopup = document.getElementById("aboutPopup");
  const usagePopup = document.getElementById("usageStatementsPopup");
  const closeAbout = document.getElementById("closeAbout");
  const closeUsage = document.getElementById("closeUsageStatements");

  // Get the links
  const aboutLink = document.getElementById("about-link");
  const usageLink = document.getElementById("usage-link");

  aboutLink.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent default link behavior
    console.log('About link clicked');
    aboutPopup.classList.remove("hidden"); // Show the pop-up
  });

  usageLink.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent default link behavior
    console.log('Usage link clicked');
    usagePopup.classList.remove("hidden"); // Show the pop-up
  });

  // Close the About pop-up when the close button is clicked
  closeAbout.addEventListener("click", function () {
    aboutPopup.classList.add("hidden"); // Hide the pop-up
  });

  // Close the Usage Statements pop-up when the close button is clicked
  closeUsage.addEventListener("click", function () {
    usagePopup.classList.add("hidden"); // Hide the pop-up
  });
});
