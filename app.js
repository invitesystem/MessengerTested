const SUPABASE_URL = 'ВАШ_SUPABASE_URL';
const SUPABASE_KEY = 'ВАШ_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-input');
const sendBtn = document.getElementById('send-btn');

async function loadMessages() {
    const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
    
    chatBox.innerHTML = '';
    if (data) data.forEach(renderMessage);
}

function renderMessage(msg) {
    const div = document.createElement('div');
    div.className = 'message';
    
    if (msg.text) {
        const textNode = document.createTextNode(msg.text);
        div.appendChild(textNode);
    }
    
    if (msg.image_url) {
        const img = document.createElement('img');
        img.src = msg.image_url;
        div.appendChild(img);
    }
    
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

supabase.channel('room1')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        renderMessage(payload.new);
    })
    .subscribe();

async function sendMessage() {
    const text = messageInput.value.trim();
    const file = fileInput.files[0];
    
    if (!text && !file) return;

    sendBtn.disabled = true;
    let image_url = null;

    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        await supabase.storage
            .from('chat-images')
            .upload(fileName, file);
            
        const { data } = supabase.storage
            .from('chat-images')
            .getPublicUrl(fileName);
            
        image_url = data.publicUrl;
    }

    await supabase
        .from('messages')
        .insert([{ text, image_url }]);

    messageInput.value = '';
    fileInput.value = '';
    sendBtn.disabled = false;
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

loadMessages();
