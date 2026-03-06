/* js/chat.js */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject HTML Structure
    const chatHTML = `
        <div id="chat-widget-launcher" title="Chiedi al nostro Assistente AI">
            <span class="material-symbols-outlined">smart_toy</span>
        </div>
        <div id="chat-widget-window">
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-bot-avatar">
                        <span class="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div class="chat-header-text">
                        <h3>Luxe Concierge</h3>
                        <p>AI Assistant • On-line</p>
                    </div>
                </div>
                <button class="chat-close-btn" id="chat-close">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div id="chat-messages">
                <div class="message bot">
                    Benvenuto in <strong>Hair Love Parrucchieri</strong>. Sono il tuo assistente virtuale. Come posso aiutarti oggi a esaltare la tua bellezza?
                </div>
            </div>
            <div class="chat-suggestions" id="chat-suggestions">
                <div class="suggestion-chip">Trattamenti Signature</div>
                <div class="suggestion-chip">Orari e Contatti</div>
                <div class="suggestion-chip">Come prenotare?</div>
                <div class="suggestion-chip">Chi sono gli Stylist?</div>
            </div>
            <div class="chat-input-area">
                <form id="chat-form">
                    <div class="chat-input-wrapper">
                        <input type="text" id="chat-input" placeholder="Scrivi un messaggio..." autocomplete="off">
                        <button type="submit" id="chat-send-btn">
                            <span class="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // 2. Element References
    const launcher = document.getElementById('chat-widget-launcher');
    const window = document.getElementById('chat-widget-window');
    const closeBtn = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');
    const suggestions = document.querySelectorAll('.suggestion-chip');

    let chatHistory = [];

    // 3. Toggle Logic
    launcher.addEventListener('click', () => {
        window.classList.add('active');
        launcher.style.display = 'none';
        chatInput.focus();
    });

    closeBtn.addEventListener('click', () => {
        window.classList.remove('active');
        launcher.style.display = 'flex';
    });

    // 4. Message Handling
    async function addMessage(role, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}`;
        msgDiv.innerHTML = content;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (role !== 'system') {
            chatHistory.push({ role, content });
        }
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTyping() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    async function sendMessage(text) {
        if (!text.trim()) return;

        addMessage('user', text);
        chatInput.value = '';
        showTyping();

        try {
            // Call Supabase Edge Function
            const { data, error } = await supabaseClient.functions.invoke('gemini-chat', {
                body: { messages: chatHistory }
            });

            hideTyping();

            if (error) throw error;

            if (data && data.content) {
                addMessage('assistant', data.content);
            } else {
                addMessage('assistant', "Mi dispiace, non sono riuscito a elaborare la richiesta. Riprova più tardi.");
            }
        } catch (err) {
            console.error('Chat AI Error:', err);
            hideTyping();
            addMessage('assistant', "Spiacente, si è verificato un errore di connessione. Puoi contattarci direttamente al numero in fondo alla pagina.");
        }
    }

    // 5. Event Listeners
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(chatInput.value);
    });

    suggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            sendMessage(chip.textContent);
        });
    });
});
