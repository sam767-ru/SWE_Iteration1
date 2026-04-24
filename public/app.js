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
    signInBtn.addEventListener("click", savePendingMessage);
  }

  if (createBtn) {
    createBtn.addEventListener("click", savePendingMessage);
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
      alert("Google sign-in is a placeholder for Iteration 1.");
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (event) => {
      event.preventDefault();
      alert("Forgot password is a placeholder for Iteration 1.");
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
  const tokenCount = document.getElementById("tokenCount");
  const agentModeBtn = document.getElementById("agentModeBtn");
  const newChatBtn = document.getElementById("newChatBtn");
  const responsesContainer = document.getElementById("responsesContainer");
  const saveBtn = document.getElementById("saveBtn");

  let chats = [];
  let currentChat = null;
  let agentMode = false;
  let isSending = false;
  let currentResponses = [];
  let selectedResponseIndex = null;
  let lastPrompt = "";

  if (profileBadge && user.username) {
    profileBadge.textContent = user.username.charAt(0).toUpperCase();
  }

  function updateTokenCount() {
    if (!tokenCount || !currentChat || !Array.isArray(currentChat.messages)) {
      if (tokenCount) tokenCount.textContent = "0";
      return;
    }

    const allText = currentChat.messages
      .map((message) => message.text || message.content || "")
      .join(" ");

    const count = allText.trim() ? allText.trim().split(/\s+/).length : 0;
    tokenCount.textContent = count;
  }

  function renderMessages() {
    if (!chatWindow) return;

    chatWindow.innerHTML = "";

    if (
      !currentChat ||
      !Array.isArray(currentChat.messages) ||
      currentChat.messages.length === 0
    ) {
      const emptyDiv = document.createElement("div");
      emptyDiv.classList.add("chat-message", "bot-message");
      emptyDiv.textContent =
        "Welcome. Start a conversation by typing a message below.";
      chatWindow.appendChild(emptyDiv);
      updateTokenCount();
      return;
    }

    currentChat.messages.forEach((message) => {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add("chat-message");
      messageDiv.classList.add(
        message.sender === "user" ? "user-message" : "bot-message"
      );
      messageDiv.textContent = message.text || message.content || "";
      chatWindow.appendChild(messageDiv);
    });

    updateTokenCount();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function renderResponses() {
    if (!responsesContainer) return;

    responsesContainer.innerHTML = "";

    if (!Array.isArray(currentResponses) || currentResponses.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.classList.add("chat-message", "bot-message");
      emptyDiv.textContent =
        "Multiple LLM responses will appear here after you send a message.";
      responsesContainer.appendChild(emptyDiv);
      return;
    }

    currentResponses.forEach((item, index) => {
      const card = document.createElement("div");
      card.classList.add("response-card");

      if (selectedResponseIndex === index) {
        card.classList.add("selected");
      }

      const title = document.createElement("h3");
      title.textContent = item.llm || `LLM ${index + 1}`;

      const text = document.createElement("p");
      text.textContent = item.text || "";

      const selectBtn = document.createElement("button");
      selectBtn.classList.add("selectBtn", "btn", "small-btn");
      selectBtn.textContent =
        selectedResponseIndex === index ? "Selected" : "Select";

      selectBtn.addEventListener("click", () => {
        selectedResponseIndex = index;
        renderResponses();
      });

      card.appendChild(title);
      card.appendChild(text);
      card.appendChild(selectBtn);

      responsesContainer.appendChild(card);
    });
  }

  function renderChatList() {
    if (!chatList) return;

    chatList.innerHTML = "";

    chats.forEach((chat) => {
      const li = document.createElement("li");
      li.textContent = chat.title || "Untitled Chat";

      if (currentChat && chat.id === currentChat.id) {
        li.classList.add("active");
      }

      li.addEventListener("click", async () => {
        await openChat(chat.id);
      });

      chatList.appendChild(li);
    });
  }

  async function fetchChats(searchText = "") {
    const url = searchText.trim()
      ? `/api/chats?q=${encodeURIComponent(searchText.trim())}`
      : "/api/chats";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to load chats.");
    }

    const data = await response.json();
    chats = Array.isArray(data) ? data : [];
    renderChatList();
  }

  async function openChat(chatId) {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);

      if (!response.ok) {
        throw new Error("Failed to load chat messages.");
      }

      const data = await response.json();

      currentChat = {
        id: data.chat.id,
        title: data.chat.title,
        created_at: data.chat.created_at,
        messages: Array.isArray(data.messages) ? data.messages : []
      };

      currentResponses = [];
      selectedResponseIndex = null;
      lastPrompt = "";

      renderChatList();
      renderMessages();
      renderResponses();
    } catch (error) {
      console.error("Open chat error:", error);
      alert("Failed to load that chat.");
    }
  }

  async function createNewChat(focusInput = true) {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: "New Chat" })
      });

      if (!response.ok) {
        throw new Error("Failed to create chat.");
      }

      const newChat = await response.json();

      await fetchChats(chatSearch ? chatSearch.value : "");
      await openChat(newChat.id);

      currentResponses = [];
      selectedResponseIndex = null;
      lastPrompt = "";
      renderResponses();

      if (chatInput && focusInput) {
        chatInput.value = "";
        chatInput.focus();
      }
    } catch (error) {
      console.error("Create chat error:", error);
      alert("Failed to create a new chat.");
    }
  }

  async function sendMessage() {
    if (isSending) return;

    const text = chatInput ? chatInput.value.trim() : "";
    if (!text) return;

    if (!currentChat || !currentChat.id) {
      await createNewChat(false);
    }

    if (!currentChat || !currentChat.id) {
      return;
    }

    isSending = true;
    lastPrompt = text;

    const optimisticUserMessage = {
      sender: "user",
      text
    };

    currentChat.messages.push(optimisticUserMessage);
    renderMessages();

    if (chatInput) {
      chatInput.value = "";
    }

    currentResponses = [];
    selectedResponseIndex = null;
    renderResponses();

    try {
      const response = await fetch("/api/multi-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chatId: currentChat.id,
          message: text,
          language: languageSelect ? languageSelect.value : "english",
          agentMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        currentChat.messages.push({
          sender: "bot",
          text: data.error || "Something went wrong."
        });
        currentResponses = [];
      } else {
        currentResponses = Array.isArray(data.responses) ? data.responses : [];
      }

      await fetchChats(chatSearch ? chatSearch.value : "");
      const updatedChat = chats.find((chat) => chat.id === currentChat.id);
      if (updatedChat) {
        currentChat.title = updatedChat.title;
      }
    } catch (error) {
      currentChat.messages.push({
        sender: "bot",
        text: "Server error while sending message."
      });
      currentResponses = [];
    } finally {
      isSending = false;
      renderChatList();
      renderMessages();
      renderResponses();
    }
  }

  async function handlePendingLandingMessage() {
    const pendingMessage = sessionStorage.getItem("pendingLandingMessage");
    if (!pendingMessage) return;

    sessionStorage.removeItem("pendingLandingMessage");

    if (!currentChat || !currentChat.id) {
      await createNewChat(false);
    }

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
    let searchTimer = null;

    chatSearch.addEventListener("input", () => {
      clearTimeout(searchTimer);

      searchTimer = setTimeout(async () => {
        try {
          await fetchChats(chatSearch.value);

          if (currentChat) {
            const stillVisible = chats.some((chat) => chat.id === currentChat.id);
            if (!stillVisible) {
              currentChat = null;
              renderMessages();
            } else {
              renderChatList();
            }
          } else {
            renderChatList();
          }
        } catch (error) {
          console.error("Search error:", error);
        }
      }, 250);
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      updateTokenCount();
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", async () => {
      await createNewChat(true);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (
        selectedResponseIndex === null ||
        !currentResponses[selectedResponseIndex]
      ) {
        alert("Please select a response first.");
        return;
      }

      const selected = currentResponses[selectedResponseIndex];

      try {
        const response = await fetch("/api/save-response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
           chatId: currentChat.id,
           prompt: lastPrompt,
           responseText: selected.text,
           llmName: selected.llm
          })
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || "Failed to save selected response.");
          return;
        }

        if(currentChat){
          currentChat.messages.push({
            sender: "bot",
            text: selected.text
          });
          renderMessages();
        }

        alert("Selected response saved successfully.");
        
        currentResponses = [];
        selectedResponseIndex = null;
        renderResponses();
      } catch (error) {
        alert("Server error while saving selected response.");
      }
    });
  }

  try {
    await fetchChats();

    if (chats.length > 0) {
      await openChat(chats[0].id);
    } else {
      await createNewChat(false);
    }

    await handlePendingLandingMessage();
    renderResponses();
  } catch (error) {
    console.error("Dashboard init error:", error);
    currentChat = {
      id: null,
      title: "New Chat",
      messages: []
    };
    renderChatList();
    renderMessages();
    renderResponses();
  }
}
