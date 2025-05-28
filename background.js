chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tabId && changeInfo.url) {
        const newUrl = changeInfo.url;
        if (newUrl && (newUrl.includes("chatgpt") || newUrl.includes("gemini") || newUrl.includes("claude"))) {
            setTimeout(() => {
                chrome.tabs.sendMessage(tabId, { action: "reinitialize" }, (response) => {
                    try {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError.message);
                        } else {
                            console.log("Response from content script:", response);
                        }
                    } catch (e) {
                        console.log(e);
                    }
                });
            }, 1000);
        }
    }
});