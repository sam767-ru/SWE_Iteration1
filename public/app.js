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

//what features look like

let pendingOptions = null;
let pendingQueryMessage = null;
let pendingChatId = null;

// Add option selection rendering function
function renderOptionButtons(options, queryMessage) {
  if (!chatWindow) return;
  
  const optionsDiv = document.createElement("div");
  optionsDiv.className = "options-container";
  optionsDiv.id = "responseOptions";
  
  const headerDiv = document.createElement("div");
  headerDiv.className = "options-header";
  headerDiv.textContent = "Choose a response:";
  optionsDiv.appendChild(headerDiv);
  
  options.forEach(option => {
    const optionBtn = document.createElement("button");
    optionBtn.className = `option-btn option-${option.type}`;
    optionBtn.textContent = `${option.type.charAt(0).toUpperCase() + option.type.slice(1)}: ${option.text.substring(0, 100)}${option.text.length > 100 ? "..." : ""}`;
    optionBtn.title = option.text;
    
    optionBtn.addEventListener("click", async () => {
      // Remove options container
      const optionsContainer = document.getElementById("responseOptions");
      if (optionsContainer) optionsContainer.remove();
      
      // Show loading indicator
      const loadingDiv = document.createElement("div");
      loadingDiv.className = "chat-message bot-message loading-message";
      loadingDiv.textContent = "Saving your selection...";
      chatWindow.appendChild(loadingDiv);
      chatWindow.scrollTop = chatWindow.scrollHeight;
      
      // Save selected option
      const response = await fetch(`/api/chats/${pendingChatId}/select-option`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionText: option.text,
          optionType: option.type
        })
      });
      
      loadingDiv.remove();
      
      if (response.ok) {
        const data = await response.json();
        // Add the selected response to chat window
        const responseDiv = document.createElement("div");
        responseDiv.className = "chat-message bot-message";
        responseDiv.textContent = option.text;
        chatWindow.appendChild(responseDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        
        // Add continue button
        const continueDiv = document.createElement("div");
        continueDiv.className = "continue-container";
        const continueBtn = document.createElement("button");
        continueBtn.className = "continue-btn";
        continueBtn.textContent = "Continue this conversation →";
        continueBtn.addEventListener("click", () => {
          continueDiv.remove();
          // Focus input for next message
          if (chatInput) chatInput.focus();
        });
        continueDiv.appendChild(continueBtn);
        chatWindow.appendChild(continueDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        
        // Refresh chat list to update title if needed
        await fetchChats(chatSearch ? chatSearch.value : "");
        renderChatList();
      } else {
        const errorDiv = document.createElement("div");
        errorDiv.className = "chat-message bot-message error-message";
        errorDiv.textContent = "Failed to save response. Please try again.";
        chatWindow.appendChild(errorDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
      
      pendingOptions = null;
      pendingQueryMessage = null;
      pendingChatId = null;
    });
    
    optionsDiv.appendChild(optionBtn);
  });
  
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "option-btn cancel-option-btn";
  cancelBtn.textContent = "Cancel - I'll rephrase";
  cancelBtn.addEventListener("click", () => {
    const optionsContainer = document.getElementById("responseOptions");
    if (optionsContainer) optionsContainer.remove();
    pendingOptions = null;
    pendingQueryMessage = null;
    pendingChatId = null;
    if (chatInput) chatInput.focus();
  });
  optionsDiv.appendChild(cancelBtn);
  
  chatWindow.appendChild(optionsDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Modify sendMessage to use multiple options
async function sendMessageWithOptions() {
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

  // Add user message to display
  const userMessageDiv = document.createElement("div");
  userMessageDiv.className = "chat-message user-message";
  userMessageDiv.textContent = text;
  chatWindow.appendChild(userMessageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  if (chatInput) {
    chatInput.value = "";
  }

  // Show loading indicator
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "chat-message bot-message loading-message";
  loadingDiv.textContent = "Generating response options...";
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(`/api/chats/${currentChat.id}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        language: languageSelect ? languageSelect.value : "english",
        agentMode
      })
    });

    loadingDiv.remove();

    if (response.ok) {
      const data = await response.json();
      pendingOptions = data.options;
      pendingQueryMessage = text;
      pendingChatId = currentChat.id;
      renderOptionButtons(data.options, text);
      await fetchChats(chatSearch ? chatSearch.value : "");
    } else {
      const errorData = await response.json();
      const errorDiv = document.createElement("div");
      errorDiv.className = "chat-message bot-message error-message";
      errorDiv.textContent = errorData.error || "Failed to generate responses.";
      chatWindow.appendChild(errorDiv);
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  } catch (error) {
    loadingDiv.remove();
    const errorDiv = document.createElement("div");
    errorDiv.className = "chat-message bot-message error-message";
    errorDiv.textContent = "Server error while generating responses.";
    chatWindow.appendChild(errorDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } finally {
    isSending = false;
  }
}

// Add delete chat function
async function deleteChat(chatId, chatElement) {
  const confirmed = confirm("Are you sure you want to delete this chat?");
  if (!confirmed) return;

  try {
    const response = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    
    if (response.ok) {
      // Remove from list
      if (chatElement) chatElement.remove();
      
      // Clear current chat if it was deleted
      if (currentChat && currentChat.id === chatId) {
        currentChat = null;
        renderMessages();
        
        // Load first available chat
        await fetchChats(chatSearch ? chatSearch.value : "");
        if (chats.length > 0) {
          await openChat(chats[0].id);
        }
      } else {
        await fetchChats(chatSearch ? chatSearch.value : "");
      }
    } else {
      const error = await response.json();
      alert(error.error || "Failed to delete chat.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Failed to delete chat.");
  }
}

// Modify renderChatList to include delete and save buttons
function renderChatListWithControls() {
  if (!chatList) return;

  chatList.innerHTML = "";

  chats.forEach((chat) => {
    const li = document.createElement("li");
    li.className = "chat-list-item";
    if (currentChat && chat.id === currentChat.id) {
      li.classList.add("active");
    }

    const titleSpan = document.createElement("span");
    titleSpan.className = "chat-title";
    titleSpan.textContent = chat.title || "Untitled Chat";
    titleSpan.addEventListener("click", async () => {
      await openChat(chat.id);
    });

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "chat-controls";
    
    const saveBtn = document.createElement("button");
    saveBtn.className = "chat-save-btn";
    saveBtn.innerHTML = "print";
    saveBtn.title = "Save/Rename chat";
    saveBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const newTitle = prompt("Enter new title for this chat:", chat.title || "Untitled Chat");
      if (newTitle && newTitle.trim()) {
        const response = await fetch(`/api/chats/${chat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim() })
        });
        if (response.ok) {
          await fetchChats(chatSearch ? chatSearch.value : "");
          if (currentChat && currentChat.id === chat.id) {
            currentChat.title = newTitle.trim();
            renderMessages();
          }
        } else {
          alert("Failed to save chat title.");
        }
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "chat-delete-btn";
    deleteBtn.innerHTML = "Delete";
    deleteBtn.title = "Delete chat";
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await deleteChat(chat.id, li);
    });

    controlsDiv.appendChild(saveBtn);
    controlsDiv.appendChild(deleteBtn);
    
    li.appendChild(titleSpan);
    li.appendChild(controlsDiv);
    chatList.appendChild(li);
  });
}

// Replace renderChatList with the enhanced version
const renderChatList = renderChatListWithControls;

// Update the send button event listener
if (sendBtn) {
  // Remove existing listeners and add new one
  const newSendBtn = sendBtn.cloneNode(true);
  sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
  newSendBtn.addEventListener("click", sendMessageWithOptions);
  
  // Update reference
  window.sendBtn = newSendBtn;
}

// Update the chat input enter key handler
if (chatInput) {
  chatInput.removeEventListener("keydown", chatInput._listener);
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessageWithOptions();
    }
  });
  chatInput._listener = chatInput.listeners?.["keydown"];
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

  let chats = [];
  let currentChat = null;
  let agentMode = false;
  let isSending = false;

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

    if (!currentChat || !Array.isArray(currentChat.messages) || currentChat.messages.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.classList.add("chat-message", "bot-message");
      emptyDiv.textContent = "Welcome. Start a conversation by typing a message below.";
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

      renderChatList();
      renderMessages();
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

    const optimisticUserMessage = {
      sender: "user",
      text
    };

    currentChat.messages.push(optimisticUserMessage);
    renderMessages();

    if (chatInput) {
      chatInput.value = "";
    }

    try {
      const response = await fetch(`/api/chats/${currentChat.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
      } else {
        currentChat.messages.push({
          sender: "bot",
          text: data.reply
        });

        await fetchChats(chatSearch ? chatSearch.value : "");
        const updatedChat = chats.find((chat) => chat.id === currentChat.id);
        if (updatedChat) {
          currentChat.title = updatedChat.title;
        }
      }
    } catch (error) {
      currentChat.messages.push({
        sender: "bot",
        text: "Server error while sending message."
      });
    } finally {
      isSending = false;
      renderChatList();
      renderMessages();
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

  try {
    await fetchChats();

    if (chats.length > 0) {
      await openChat(chats[0].id);
    } else {
      await createNewChat(false);
    }

    await handlePendingLandingMessage();
  } catch (error) {
    console.error("Dashboard init error:", error);
    currentChat = {
      id: null,
      title: "New Chat",
      messages: []
    };
    renderChatList();
    renderMessages();
  }
}
