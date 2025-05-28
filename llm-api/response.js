/**
 * Default configuration for Perplexity Sonar API
 */
const DEFAULT_CONFIG = {
    API_KEY: "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", //sample key
    MODEL: "sonar-pro",
    ENDPOINT: "https://api.perplexity.ai/chat/completions",
    DEFAULT_SYSTEM_PROMPT: `You are an AI prompt enhancer. Given the current user query and a few of their previous messages, rewrite the current query into a clearer, more detailed, and goal-oriented prompt that will help an AI assistant generate the best possible response. Maintain the user's intent and context, if you found any irrelevance prompt then output only empty string otherwise output only the improved prompt.`
};

/**
 * Cleans and formats the Perplexity API response
 * @param {string} text - The raw response text
 * @returns {string} Cleaned response text
 */
function cleanPerplexityResponse(text) {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^["'`]{2}$/, "");
    cleaned = cleaned.replace(/^\\*["'`]{2}\\*\n*$/, "");

    if (!cleaned || cleaned.length < 2) {
        return "";
    }

    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
        (cleaned.startsWith('`') && cleaned.endsWith('`'))) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }

    return cleaned;
}

/**
 * Sends a request to Perplexity Sonar API
 * @param {Object} options - Configuration options
 * @param {string} options.systemPrompt - The system prompt to use
 * @param {string} options.query - The user query to enhance
 * @param {Array} options.messages - Previous messages for context
 * @param {string} options.apiKey - API key for Perplexity
 * @param {string} options.endpoint - API endpoint
 * @returns {Promise<string>} Enhanced prompt text
 */
async function callPerplexityAPI({
    systemPrompt = DEFAULT_CONFIG.DEFAULT_SYSTEM_PROMPT,
    query = "",
    messages = [],
    apiKey = DEFAULT_CONFIG.API_KEY,
    endpoint = DEFAULT_CONFIG.ENDPOINT,
    model = DEFAULT_CONFIG.MODEL
}) {
    try {
        // Format messages for Perplexity API (OpenAI compatible format)
        const formattedMessages = [
            {
                role: "system",
                content: systemPrompt
            }
        ];

        // Add previous messages if available
        if (messages && messages.length > 0) {
            // Convert messages from Preplexity format to Perplexity format
            messages.forEach(msg => {
                // Map the role appropriately
                let role = "user";
                if (msg.role === "model" || msg.role === "assistant" || msg.role === "ai") {
                    role = "assistant";
                }
                
                // Extract content from parts
                const content = msg.parts && msg.parts[0].text ? msg.parts[0].text : "";
                if (content) {
                    formattedMessages.push({ role, content });
                }
            });
        }

        // Add the current query as the final message
        formattedMessages.push({
            role: "user",
            content: query
        });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: formattedMessages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return cleanPerplexityResponse(data.choices[0].message.content);
    } catch (error) {
        console.error("Error calling Perplexity API:", error);
        throw error;
    }
}

// Expose the functions and configuration
window.PerplexityAPI = {
    callPerplexityAPI,
    cleanPerplexityResponse,
    DEFAULT_CONFIG
};