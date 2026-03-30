const socket = io('http://localhost:3001');

const list = document.getElementById('task-list');
const formTask = document.getElementById('task-form');
const inputTask = document.getElementById('task-input');
const formReminder = document.getElementById('reminder-form');
const inputReminderText = document.getElementById('reminder-text');
const inputReminderTime = document.getElementById('reminder-time');
const statusBadge = document.getElementById('network-status');

const PUBLIC_VAPID_KEY = 'BMD5dodqPL-fxpbcHBU-LVWUwZiWwYKyaj_oAm8FbeVJYot2MoTeNLWhuGdp6qP1p9GDDfqGgzHGqtqwWUXsZhA';

function updateNetworkStatus() {
    if (navigator.onLine) {
        statusBadge.textContent = '🌐 В сети';
        statusBadge.className = 'badge online';
    } else {
        statusBadge.textContent = '✈️ Офлайн';
        statusBadge.className = 'badge offline';
    }
}
window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus(); 

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    list.innerHTML = tasks.map(task => {
        let reminderHtml = '';
        if (task.reminder) {
            const dateObj = new Date(task.reminder);
            reminderHtml = `<span class="reminder-info">⏰ Напоминание: ${dateObj.toLocaleString('ru-RU')}</span>`;
        }
        return `<li><div class="task-content">${task.text} ${reminderHtml}</div><button class="btn-delete" onclick="deleteTask(${task.id})">✕</button></li>`;
    }).join('');
}

function addNoteLocal(text, reminderTimestamp = null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const newNote = { id: Date.now(), text, reminder: reminderTimestamp };
    tasks.push(newNote);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
    return newNote; 
}

window.deleteTask = function(taskId) {
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const tToDelete = tasks.find(t => t.id === taskId);
    if (tToDelete && tToDelete.reminder && navigator.onLine) socket.emit('deleteReminder', taskId);
    tasks = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
}

formTask.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = inputTask.value.trim();
    if (text) {
        addNoteLocal(text);
        if (navigator.onLine) socket.emit('newTask', { text, timestamp: Date.now() });
        inputTask.value = '';
    }
});

formReminder.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = inputReminderText.value.trim();
    const datetime = inputReminderTime.value;
    if (text && datetime) {
        const timestamp = new Date(datetime).getTime();
        if (timestamp > Date.now()) {
            const newNote = addNoteLocal(text, timestamp);
            if (navigator.onLine) socket.emit('newReminder', { id: newNote.id, text, reminderTime: timestamp });
            inputReminderText.value = ''; inputReminderTime.value = '';
        } else { alert('Время должно быть в будущем!'); }
    }
});

loadTasks();

socket.on('taskAdded', (task) => {
    const n = document.createElement('div');
    n.textContent = `⚡ Добавлено: ${task.text}`;
    n.style.cssText = `position: fixed; top: 20px; right: 20px; background: #fff; color: #000; padding: 15px 20px; border-radius: 12px; z-index: 1000; font-weight: bold; box-shadow: 0 10px 30px rgba(255,255,255, 0.2);`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 4000);
});

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY) });
        await fetch('http://localhost:3001/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
    } catch (err) { console.error(err); }
}

async function unsubscribeFromPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
        await fetch('http://localhost:3001/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('sw.js');
            const enableBtn = document.getElementById('enable-push');
            const disableBtn = document.getElementById('disable-push');
            const sub = await reg.pushManager.getSubscription();
            if (sub) { enableBtn.style.display = 'none'; disableBtn.style.display = 'inline-block'; }

            enableBtn.addEventListener('click', async () => {
                const p = await Notification.requestPermission();
                if (p === 'granted') { await subscribeToPush(); enableBtn.style.display = 'none'; disableBtn.style.display = 'inline-block'; }
            });

            disableBtn.addEventListener('click', async () => {
                await unsubscribeFromPush(); disableBtn.style.display = 'none'; enableBtn.style.display = 'inline-block';
            });
        } catch (err) {}
    });
}