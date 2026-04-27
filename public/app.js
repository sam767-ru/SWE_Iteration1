document.addEventListener("DOMContentLoaded", () => {
  setupLandingPage();
  setupLoginForm();
  setupSignupForm();
  setupGoogleSigninPlaceholder();
  setupDashboard();
});

function setupLandingPage() {
  const landingInput = document.getElementById("landingChatInput");
  const signInBtn = document.getElementById("landingSignInBtn");
  const createBtn = document.getElementById("landingCreateBtn");

  if (!landingInput) return;

  function savePendingMessage() {
    const text = landingInput.value.trim();
    if (text) {
      sessionStorage.setItem("pendingLandingMessage", text);
    } else {
      sessionStorage.removeItem("pendingLandingMessage");
    }
  }

  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      savePendingMessage();
    });
  }

  if (createBtn) {
    createBtn.addEventListener("click", () => {
      savePendingMessage();
    });
  }

  landingInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      savePendingMessage();
      window.location.href = "login.html";
    }
  });
}

function setupLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const message = document.getElementById("loginMessage");

    if (!username || !password) {
      message.textContent = "Please enter your username and password.";
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        message.textContent = "Login successful. Redirecting...";
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      } else {
        message.textContent = data.error || "Login failed.";
      }
    } catch (error) {
      message.textContent = "Server error during login.";
    }
  });
}

function setupSignupForm() {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const message = document.getElementById("signupMessage");

    if (!username || !email || !password) {
      message.textContent = "Please fill out all fields.";
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        message.textContent = "Account created successfully. Redirecting to sign in...";
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1000);
      } else {
        message.textContent = data.error || "Signup failed.";
      }
    } catch (error) {
      message.textContent = "Server error during signup.";
    }
  });
}

function setupGoogleSigninPlaceholder() {
  const googleSigninBtn = document.getElementById("googleSigninBtn");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");

  if (googleSigninBtn) {
    googleSigninBtn.addEventListener("click", () => {
      alert("Google sign-in is a placeholder for this iteration.");
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (event) => {
      event.preventDefault();
      alert("Forgot password is a placeholder for this iteration.");
    });
  }
}

async function checkSession() {
  try {
    const response = await fetch("/api/session");
    if (!response.ok) {
      window.location.href = "login.html";
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    window.location.href = "login.html";
    return null;
  }
}

async function setupDashboard() {
  const chatWindow = document.getElementById("chatWindow");
  if (!chatWindow) return;

  const user = await checkSession();
  if (!user) return;

  const profileBadge = document.querySelector(".profile-badge");
  const logoutBtn = document.getElementById("logoutBtn");
  const sendBtn = document.getElementById("sendBtn");
  const chatInput = document.getElementById("chatInput");
  const chatList = document.getElementById("chatList");
  const chatSearch = document.getElementById("chatSearch");
  const languageSelect = document.getElementById("languageSelect");
  const modelSelect = document.getElementById("modelSelect");
  const tokenCount = document.getElementById("tokenCount");
  const agentModeBtn = document.getElementById("agentModeBtn");
  const newChatBtn = document.getElementById("newChatBtn");

  let chats = [];
  let currentChatIndex = -1;
  let currentChat = null;
  let agentMode = false;
  let selectedModel = modelSelect ? modelSelect.value : "local";

  if (modelSelect) {
    modelSelect.addEventListener("change", () => {
      selectedModel = modelSelect.value;
      console.log("Selected model:", selectedModel);
    });
  }

  if (profileBadge && user.username) {
    profileBadge.textContent = user.username.charAt(0).toUpperCase();
  }

  async function loadChats() {
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) {
        throw new Error("Failed to load chats");
      }

      chats = await response.json();

      if (!Array.isArray(chats)) {
        chats = [];
      }
    } catch (error) {
      chats = [];
    }

    if (chats.length > 0) {
      currentChatIndex = 0;
      currentChat = chats[0];
    } else {
      currentChatIndex = -1;
      currentChat = createTemporaryChat();
    }

    renderChatList();
    renderMessages();
  }

  function renderChatList(filterText = "") {
    if (!chatList) return;
    chatList.innerHTML = "";

    chats.forEach((chat, index) => {
      if (!chat.title.toLowerCase().includes(filterText.toLowerCase())) {
        return;
      }

      const li = document.createElement("li");
      li.textContent = chat.title;

      if (index === currentChatIndex) {
        li.classList.add("active");
      }

      li.addEventListener("click", () => {
        currentChatIndex = index;
        currentChat = chats[index];
        renderChatList(chatSearch ? chatSearch.value : "");
        renderMessages();
      });

      chatList.appendChild(li);
    });
  }

  function ensureCurrentChatIsSaved() {
    if (!currentChat) return;

    if (currentChat.isTemporary) {
      currentChat.isTemporary = false;
      chats.unshift(currentChat);
      currentChatIndex = 0;
      renderChatList(chatSearch ? chatSearch.value : "");
    }
  }

  function createTemporaryChat() {
    return {
      id: Date.now(),
      title: "New Chat",
      isTemporary: true,
      messages: [
        {
          sender: "bot",
          text: "Welcome. Start a conversation by typing a message below."
        }
      ]
    };
  }

  function renderMessages() {
    if (!chatWindow || !currentChat) return;

    chatWindow.innerHTML = "";

    currentChat.messages.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("chat-message");
      messageDiv.classList.add(
        message.sender === "user" ? "user-message" : "bot-message"
      );
      messageDiv.textContent = message.text;
      chatWindow.appendChild(messageDiv);
    });

    updateTokenCount();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function updateTokenCount() {
    if (!tokenCount || !currentChat) return;

    const allText = currentChat.messages
      .map((message) => message.text)
      .join(" ");

    const count = allText.trim() ? allText.trim().split(/\s+/).length : 0;
    tokenCount.textContent = count;
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !currentChat) return;

    ensureCurrentChatIsSaved();

    currentChat.messages.push({
      sender: "user",
      text
    });

    if (currentChat.title === "New Chat") {
      currentChat.title = text.length > 30 ? text.slice(0, 30) + "..." : text;
      renderChatList(chatSearch ? chatSearch.value : "");
    }

    renderMessages();
    chatInput.value = "";
    console.log("Sending selected model:", selectedModel);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          language: languageSelect ? languageSelect.value : "english",
          model: selectedModel,
          agentMode
        })
      });

      const data = await response.json();

      currentChat.messages.push({
        sender: "bot",
        text: response.ok
          ? data.reply
          : (data.error || "Something went wrong.")
      });
    } catch (error) {
      currentChat.messages.push({
        sender: "bot",
        text: "Server error while sending message."
      });
    }

    renderMessages();
  }

  async function handlePendingLandingMessage() {
    const pendingMessage = sessionStorage.getItem("pendingLandingMessage");
    if (!pendingMessage) return;

    sessionStorage.removeItem("pendingLandingMessage");

    currentChatIndex = -1;
    currentChat = createTemporaryChat();

    renderChatList(chatSearch ? chatSearch.value : "");
    renderMessages();

    if (!chatInput) return;

    chatInput.value = pendingMessage;
    await sendMessage();
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  if (chatInput) {
    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const confirmed = confirm("Are you sure you want to sign out?");
      if (!confirmed) return;

      try {
        await fetch("/api/logout", { method: "POST" });
      } catch (error) {
        // ignore logout fetch failure
      }

      window.location.href = "index.html";
    });
  }

  if (agentModeBtn) {
    agentModeBtn.addEventListener("click", () => {
      agentMode = !agentMode;
      agentModeBtn.textContent = `Agentic Mode: ${agentMode ? "On" : "Off"}`;
    });
  }

  if (chatSearch) {
    chatSearch.addEventListener("input", () => {
      renderChatList(chatSearch.value);
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      updateTokenCount();
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      currentChatIndex = -1;
      currentChat = createTemporaryChat();

      renderChatList(chatSearch ? chatSearch.value : "");
      renderMessages();

      if (chatInput) {
        chatInput.value = "";
        chatInput.focus();
      }
    });
  }

  await loadChats();
  await handlePendingLandingMessage();
}