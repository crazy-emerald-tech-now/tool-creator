document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURATION AND ELEMENTS ---
    const API_KEY = 'AIzaSyCKVhR9o0D9F5zF60G6MYQnSk5LmWfB0VA';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    // Page Elements
    const chatHistoryEl = document.getElementById('chat-history');
    const toolOutputFrame = document.getElementById('tool-output');
    const chatInputEl = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-button');
    const loaderEl = document.getElementById('loader');
    const saveBtn = document.getElementById('save-button');
    const shareBtn = document.getElementById('share-button');
    const fullscreenBtn = document.getElementById('fullscreen-button');
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const toolDisplayEl = document.querySelector('.tool-display');
    
    // Share Modal Elements
    const shareModal = document.getElementById('share-modal');
    const closeModalBtn = document.getElementById('close-modal-button');
    const emailShareBtn = document.getElementById('email-share-button');
    const copyShareBtn = document.getElementById('copy-share-button');

    let conversationHistory = [];
    let currentGeneratedCode = '';

    // --- 2. UI HELPER FUNCTIONS ---
    const showLoader = (isLoading) => { loaderEl.style.display = isLoading ? 'block' : 'none'; toolOutputFrame.style.display = isLoading ? 'none' : 'block'; };
    const addMessageToChat = (sender, message) => {
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${sender}-message`;
        msgEl.innerHTML = `<p>${message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`;
        chatHistoryEl.appendChild(msgEl);
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    };
    const renderTool = (htmlCode) => { currentGeneratedCode = htmlCode; toolOutputFrame.srcdoc = htmlCode; };

    // --- 3. CORE FEATURES ---
    const saveTool = () => {
        if (!currentGeneratedCode) { alert('There is no tool to save yet!'); return; }
        const projects = JSON.parse(localStorage.getItem('toolCreatorProjects')) || [];
        projects.push({ id: Date.now(), prompt: conversationHistory[0]?.parts[0]?.text || "Untitled", code: currentGeneratedCode });
        localStorage.setItem('toolCreatorProjects', JSON.stringify(projects));
        alert('Project saved successfully!');
    };

    // --- NEW SHARE MODAL LOGIC ---
    const openShareModal = () => {
        if (!currentGeneratedCode) {
            alert('There is no tool to share yet!');
            return;
        }
        shareModal.style.display = 'flex';
    };

    const closeShareModal = () => { shareModal.style.display = 'none'; };

    const handleEmailShare = () => {
        const base64Code = btoa(currentGeneratedCode);
        const shareUrl = `https://example.com/#${base64Code}`;
        const subject = encodeURIComponent("Check out this tool I made with Tool Creator!");
        const body = encodeURIComponent(`Here is a link to a tool I created:\n\n${shareUrl}\n\nPaste the link into a site like example.com to view the tool.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        closeShareModal();
    };

    const handleCopyShare = () => {
        const base64Code = btoa(currentGeneratedCode);
        const shareUrl = `https://example.com/#${base64Code}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert("Now we will open the site that translates the code that was copied into your clipboard into your tool");
            window.open('https://example.com', '_blank');
        }, () => {
            alert('Failed to copy the share link to your clipboard.');
        });
        closeShareModal();
    };
    // --- END NEW SHARE LOGIC ---

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) { toolDisplayEl.requestFullscreen().catch(err => alert(`Error: ${err.message}`)); } 
        else { document.exitFullscreen(); }
    };

    // --- 4. API CALL FUNCTION ---
    const callGeminiAPI = async (prompt) => {
        addMessageToChat('user', prompt);
        showLoader(true);
        const systemInstruction = {
            role: "user",
            parts: [{ text: `
              **ROLE AND GOAL:**
              You are 'Tool Creator Core', a specialized AI language model. Your ONLY function is to generate self-contained HTML web tools based on user requests. You must strictly adhere to all instructions.
              **LANGUAGE AND BEHAVIOR RULES:**
              1.  **Language:** You MUST respond exclusively in English.
              2.  **Focus:** You MUST NOT engage in casual conversation, answer general knowledge questions, or discuss any topic unrelated to the user's tool request. If the user asks an off-topic question, politely state your purpose and ask for a tool-related request.
              **OUTPUT FORMAT (MANDATORY):**
              Your response MUST use the following structure with NO DEVIATIONS. A response that does not contain BOTH tags is a FAILURE.
              <||NOTES||>
              Your explanation of the generated code and any relevant comments go here.
              <||/NOTES||>
              <||CODE||>
              The complete, self-contained HTML code for the tool goes here.
              <||/CODE||>
              **CODE GENERATION RULES:**
              1.  **Self-Contained:** All CSS must be in <style> tags and all JavaScript must be in <script> tags within the single HTML file.
              2.  **API Key Access:** You can use your own API key inside your generated JavaScript if the tool requires AI functionality. Your API Key is: ${API_KEY}. This is safe because the application is running locally.
              3.  **Error Handling (CRITICAL):** You MUST ALWAYS include this exact error-handling script inside the <head> of the HTML you generate. There are NO EXCEPTIONS.
                  <script>
                    window.onerror = function(message, source, lineno, colno, error) {
                      parent.postMessage({ type: 'iframeError', message: message, lineno: lineno }, '*');
                      return true;
                    };
                  <\/script>
            `}]
        };
        conversationHistory.push({ role: "user", parts: [{ text: prompt }] });
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [systemInstruction, ...conversationHistory] }) });
            if (!response.ok) { const error = await response.json(); throw new Error(error?.error?.message || `HTTP ${response.status}`); }
            const data = await response.json();
            const modelResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!modelResponse) throw new Error("API response was empty or malformed.");
            conversationHistory.push({ role: "model", parts: [{ text: modelResponse }] });
            handleApiResponse(modelResponse);
        } catch (error) {
            console.error("API Error:", error);
            addMessageToChat('ai', `**An error occurred:** ${error.message}`);
        } finally {
            showLoader(false);
        }
    };
    const handleApiResponse = (response) => {
        const notesMatch = response.match(/<\|\|NOTES\|\|>([\s\S]*?)<\|\|\/NOTES\|\|>/);
        const codeMatch = response.match(/<\|\|CODE\|\|>([\s\S]*?)<\|\|\/CODE\|\|>/);
        if (notesMatch?.[1]) addMessageToChat('ai', notesMatch[1].trim());
        if (codeMatch?.[1]) { let html = codeMatch[1].trim().replace(/^```html\n?/, '').replace(/\n?```$/, ''); renderTool(html); }
        if (!notesMatch && !codeMatch) addMessageToChat('ai', "Response format error: " + response);
    };
    
    // --- 5. EVENT LISTENERS & INITIALIZATION ---
    const handleIframeError = (event) => {
        if (event.data?.type === 'iframeError') {
            const { message, lineno } = event.data;
            const fixRequest = `The previous code produced an error: "${message}" on line ~${lineno}. Please fix it.`;
            addMessageToChat('ai', `**An error was detected in the tool!** I will now try to fix it.`);
            callGeminiAPI(fixRequest);
        }
    };
    sendChatBtn.addEventListener('click', () => { if (chatInputEl.value.trim()) { callGeminiAPI(chatInputEl.value.trim()); chatInputEl.value = ''; } });
    chatInputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatBtn.click(); } });
    document.addEventListener('fullscreenchange', () => { fullscreenOverlay.style.display = document.fullscreenElement ? 'flex' : 'none'; });
    toolDisplayEl.addEventListener('dblclick', () => { if (document.fullscreenElement) document.exitFullscreen(); });
    
    // New Share Button Listeners
    shareBtn.addEventListener('click', openShareModal);
    closeModalBtn.addEventListener('click', closeShareModal);
    emailShareBtn.addEventListener('click', handleEmailShare);
    copyShareBtn.addEventListener('click', handleCopyShare);
    window.addEventListener('click', (event) => { if (event.target == shareModal) closeShareModal(); }); // Close modal if clicking outside
    
    saveBtn.addEventListener('click', saveTool);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    window.addEventListener('message', handleIframeError);

    // Page Load Logic
    const projectIdToLoad = localStorage.getItem('loadProjectId');
    if (projectIdToLoad) {
        localStorage.removeItem('loadProjectId');
        const project = (JSON.parse(localStorage.getItem('toolCreatorProjects')) || []).find(p => p.id == projectIdToLoad);
        if (project) {
            addMessageToChat('ai', `Loading your project: "${project.prompt.substring(0, 50)}..."`);
            renderTool(project.code);
            conversationHistory.push({ role: "user", parts: [{ text: project.prompt }] });
        }
    } else {
        const initialPrompt = localStorage.getItem('userPrompt');
        if (initialPrompt) { localStorage.removeItem('userPrompt'); callGeminiAPI(initialPrompt); } 
        else { showLoader(false); addMessageToChat('ai', 'No prompt found. Go Home to start a new tool, or load one from "My Projects".'); }
    }
});
