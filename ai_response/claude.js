// Access via window object
const src = chrome.runtime.getURL('llm-api/response.js');
import(src).then(module => {
    const { callPerplexityAPI, DEFAULT_CONFIG } = module;


    // Configuration
    const CONFIG = {
        ...DEFAULT_CONFIG  // Use the defaults from response.js
    };

    // CSS Styles
    const STYLES = `
    .promper-enhancing {
        position: relative;
        background: linear-gradient(90deg, rgb(240 244 249), rgb(211 227 253), rgb(240 203 255));
        background-size: 300% 100%;
        animation: promper-gradient 2s ease infinite;
        border-radius: 8px;
    }
    
    @keyframes promper-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    .promper-enhancing::after {
        content: "Enhancing prompt...";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
        background-color: #d97757;
        opacity: 0;
        animation: promper-fade 2s ease infinite;
        border-radius: 8px;
    }
    
    @keyframes promper-fade {
        0% { opacity: 0.2; }
        50% { opacity: 0.8; }
        100% { opacity: 0.2; }
    }
    
    .promper-pulse-dot {
        display: inline-block;
        margin-left: 3px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: #d97757;
        animation: promper-pulse 1.5s infinite ease-in-out;
    }
    
    .promper-pulse-dot:nth-child(2) {
        animation-delay: 0.3s;
    }
    
    .promper-pulse-dot:nth-child(3) {
        animation-delay: 0.6s;
    }
    
    @keyframes promper-pulse {
        0%, 100% { transform: scale(0.6); opacity: 0.6; }
        50% { transform: scale(1.2); opacity: 1; }
    }
    
    .promper-temporary-message {
        display: inline-block;
        color: #d97757;
        font-style: italic;
        padding: 2px 4px;
        margin: 4px 0;
        max-height:10px;
    }
`;

    /**
     * Extracts the last user messages from the conversation
     * @param {number} count - Number of messages to extract
     * @returns {Array} Array of message objects
     */
    function extractLastMessages(count = 5) {
        const allElements = Array.from(document.querySelectorAll("div[data-testid='user-message']"));
        const messages = [];

        for (let i = allElements.length - 1; i >= 0 && count > 0; i--) {
            const element = allElements[i];
            const text = element.textContent.trim();
            count--;
            messages.unshift({
                role: "user",
                parts: [{ text }]
            });
        }

        return messages;
    }

    /**
     * Enhances a prompt using Perplexity API
     * @param {HTMLElement} editableDiv - The div to show animations in
     * @param {string} systemPrompt - The system prompt
     * @param {string} currentUserQuery - The query to enhance
     * @param {number} userMessages - Number of previous messages to include
     * @returns {Promise<string>} Enhanced prompt
     */
    async function sendToPerplexityAPI(editableDiv, systemPrompt, currentUserQuery, userMessages = 5) {
        const userContent = extractLastMessages(userMessages);

        if (userContent.length > 3) {
            // Show loading animation
            editableDiv.classList.add("promper-enhancing");
            editableDiv.innerHTML = ` `;

            return await callPerplexityAPI({
                systemPrompt,
                query: currentUserQuery,
                messages: userContent
            });
        }
    }

    /**
     * Initializes the event listener for the textarea
     */
    function initializeTextboxListerener() {
        const textarea = document.querySelector("fieldset > * div[contenteditable='true']");
        if (!textarea) return;

        textarea.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.shiftKey) {
                const systemPrompt = CONFIG.DEFAULT_SYSTEM_PROMPT;
                const currentUserQuery = textarea.textContent || "";

                if (currentUserQuery.trim() !== "") {
                    const editableDiv = textarea;

                    try {
                        const res = await sendToPerplexityAPI(textarea, systemPrompt, currentUserQuery);

                        if (res && res.trim() !== "") {
                            editableDiv.classList.remove("promper-enhancing");
                            editableDiv.innerHTML = `<p>${res}</p>`;
                            editableDiv.focus();

                            setTimeout(() => {
                                document.querySelector("button[aria-label='Send message']").click();
                            }, 200);
                        } else {
                            editableDiv.classList.remove("promper-enhancing");
                            editableDiv.innerHTML = `<p>${currentUserQuery}</p>`;
                            editableDiv.focus();
                        }
                    } catch (error) {
                        console.error("Error enhancing prompt:", error);
                        editableDiv.classList.remove("promper-enhancing");
                        editableDiv.innerHTML = currentUserQuery;

                        const errorMessage = document.createElement("div");
                        errorMessage.style.color = "#ff7070";
                        errorMessage.style.fontSize = "12px";
                        errorMessage.style.padding = "2px 5px";
                        errorMessage.style.backgroundColor = "rgba(50, 10, 10, 0.7)";
                        errorMessage.style.borderRadius = "4px";
                        errorMessage.style.marginTop = "4px";
                        errorMessage.textContent = "Failed to enhance prompt";
                        editableDiv.parentNode.appendChild(errorMessage);

                        setTimeout(() => {
                            errorMessage.remove();
                        }, 3000);
                    }
                }
            }
        });
    }

    /**
     * Initialize Promper on page load
     */
    function initPromper() {
        // Add styles
        const style = document.createElement('style');
        style.textContent = STYLES;
        document.head.appendChild(style);

        // Initialize listeners
        setTimeout(() => {
            initializeTextboxListerener();
        }, 2000);
    }

    // Message handler for extension communication
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.action === "reinitialize") {
            const style = document.createElement('style');
            style.textContent = STYLES;
            document.head.appendChild(style);
            initializeTextboxListerener();
            sendResponse({ success: true });
        }
    });

    // Initialize on page load
    window.addEventListener('load', initPromper);

});