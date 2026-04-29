// Array di base per generare compiti
const baseTasks = [
    { icon: '👣', label: '8.000+ passi', xp: 10, done: false },
    { icon: '🏋️‍♀️', label: 'Allenamento', xp: 20, done: false },
    { icon: '🥗', label: 'Mangiare pulito', xp: 15, done: false },
    { icon: '🍩', label: 'No snack inutili', xp: 10, done: false },
    { icon: '💧', label: 'Bere 2L di acqua', xp: 5, done: false },
    { icon: '🌙', label: 'Dormire 7h', xp: 10, done: false }
];

// Capisce che giorno è oggi
const daysMap = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
const realToday = daysMap[new Date().getDay()];

// Genera una settimana pulita
const generateCleanHistory = () => {
    let history = {};
    ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"].forEach(day => {
        history[day] = { xp: 0, tasks: JSON.parse(JSON.stringify(baseTasks)) };
    });
    return history;
};

const defaultData = {
    level: 1, currentXp: 0, maxXPForLevel: 100, streak: 0, totalXp: 0,
    history: generateCleanHistory(),
    currentDay: realToday, 
    viewingDay: realToday  
};

let appData = loadData();

// --- GESTIONE DATI LOCALI ---
function loadData() {
    try {
        const saved = localStorage.getItem('fitness_data_v4');
        let data = saved ? JSON.parse(saved) : null;
        if (!data) {
            return { level: 1, currentXp: 0, maxXPForLevel: 100, streak: 0, totalXp: 0,
                history: generateCleanHistory(), currentDay: realToday, viewingDay: realToday };
        }
        data.currentDay = realToday;
        data.viewingDay = data.viewingDay || realToday;
        // Assicura che tutti i giorni esistano in history
        if (!data.history) {
            data.history = generateCleanHistory();
        } else {
            const clean = generateCleanHistory();
            Object.keys(clean).forEach(day => {
                if (!data.history[day]) data.history[day] = clean[day];
            });
        }
        return data;
    } catch (e) {
        console.error("Errore caricamento dati, reset:", e);
        return { level: 1, currentXp: 0, maxXPForLevel: 100, streak: 0, totalXp: 0,
            history: generateCleanHistory(), currentDay: realToday, viewingDay: realToday };
    }
}

function saveData() {
    try {
        localStorage.setItem('fitness_data_v4', JSON.stringify(appData));
    } catch (e) {
        console.error("Impossibile salvare i dati:", e);
    }
    updateUI();
}

// --- CLOUD SICURO (Nascosto sotto l'avatar) ---
function getCloudKeys() {
    return {
        apiKey: localStorage.getItem('my_secret_api_key'),
        binId: localStorage.getItem('my_secret_bin_id')
    };
}

window.setupCloud = function() {
    const keys = getCloudKeys();
    const newApi = prompt("🔐 AREA SEGRETA\nInserisci la tua API Key di JSONBin:", keys.apiKey || "");
    
    if (newApi !== null && newApi.trim() !== "") {
        const newBin = prompt("Inserisci il tuo BIN ID:", keys.binId || "");
        if (newBin !== null && newBin.trim() !== "") {
            localStorage.setItem('my_secret_api_key', newApi.trim());
            localStorage.setItem('my_secret_bin_id', newBin.trim());
            alert("✅ Chiavi salvate! L'app ora salverà in cloud.");
            loadFromCloud(); 
        }
    } else if (newApi === "") {
        localStorage.removeItem('my_secret_api_key');
        localStorage.removeItem('my_secret_bin_id');
        alert("☁️ Cloud disattivato.");
    }
}

async function loadFromCloud() {
    const { apiKey, binId } = getCloudKeys();
    if (!apiKey || !binId) return; 
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: { 'X-Master-Key': apiKey }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.record) {
                const cloudHistory = data.record.history;
                appData = {
                    level: 1, currentXp: 0, maxXPForLevel: 100, streak: 0, totalXp: 0,
                    ...data.record,
                    history: (cloudHistory && Object.keys(cloudHistory).length > 0) ? cloudHistory : generateCleanHistory(),
                    currentDay: realToday,
                    viewingDay: realToday
                };

                saveData(); // Salva nel telefono e aggiorna i cerchietti
                console.log("Dati sincronizzati dal cloud!");
            }
        }
    } catch (error) {
        console.error("Errore download cloud:", error);
    }
}

window.saveToCloud = async function() {
    const { apiKey, binId } = getCloudKeys();
    const btn = document.getElementById('sync-btn');
    
    if (!apiKey || !binId) {
        alert("Clicca sull'avatar 👧🏻 per inserire le tue chiavi prima di sincronizzare!");
        return;
    }

    btn.innerText = "⏳ Sync...";
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': apiKey },
            body: JSON.stringify(appData)
        });
        if (response.ok) {
            btn.innerText = "✅ Salvato!";
            setTimeout(() => btn.innerText = "☁️ Sincronizza", 2000);
        } else throw new Error("Errore API");
    } catch (error) {
        btn.innerText = "❌ Errore";
        setTimeout(() => btn.innerText = "☁️ Sincronizza", 2000);
    }
}

// --- NAVIGAZIONE INTERFACCIA ---
window.switchView = function(view, e) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (e) e.currentTarget.classList.add('active');
    
    if(view === 'week') changeDay(appData.currentDay);
    updateUI();
}

window.changeDay = function(day) {
    appData.viewingDay = day;
    document.querySelectorAll('.day-tab').forEach(tab => {
        tab.classList.remove('active');
        if(tab.innerText === day) tab.classList.add('active');
    });
    updateUI();
}

// --- AGGIORNAMENTO GRAFICO ---
function updateUI() {
    // HOME UI
    document.getElementById('ui-level').innerText = appData.level;
    document.getElementById('ui-xp-text').innerText = `${appData.currentXp} / ${appData.maxXPForLevel} XP`;
    document.getElementById('ui-total-xp').innerText = appData.totalXp;
    document.getElementById('ui-streak').innerText = appData.streak;
    
    let progressPercent = Math.max(0, Math.min((appData.currentXp / appData.maxXPForLevel) * 100, 100));
    document.getElementById('ui-progress').style.width = `${progressPercent}%`;
    document.getElementById('ui-next-level').innerText = `Prossimo livello: ${appData.maxXPForLevel} XP`;
    document.getElementById('ui-today-name').innerText = appData.currentDay;

    // Lista HOME
    const list = document.getElementById('task-list');
    list.innerHTML = '';
    const todayData = appData.history[appData.currentDay] || { tasks: [] };
    todayData.tasks.forEach((t, i) => {
        list.innerHTML += `
            <li class="task-item">
                <div class="task-left"><span class="task-icon">${t.icon}</span> <span>${t.label}</span></div>
                <div class="task-right">
                    <span class="task-xp">${t.xp} XP</span>
                    <div class="checkbox ${t.done ? 'checked' : ''}" onclick="toggleTask(${i})"></div>
                </div>
            </li>`;
    });

    // WEEK UI
    const viewingData = appData.history[appData.viewingDay] || appData.history[appData.currentDay];
    const fullDayNames = {"LUN":"LUNEDÌ", "MAR":"MARTEDÌ", "MER":"MERCOLEDÌ", "GIO":"GIOVEDÌ", "VEN":"VENERDÌ", "SAB":"SABATO", "DOM":"DOMENICA"};
    document.getElementById('selected-day-name').innerText = fullDayNames[appData.viewingDay];
    
    const weekList = document.getElementById('week-task-list');
    weekList.innerHTML = '';
    let doneCount = 0;
    
    viewingData.tasks.forEach((t, i) => {
        if(t.done) doneCount++;
        weekList.innerHTML += `
            <li class="task-item">
                <div class="task-left" style="${!t.done ? 'opacity:0.6;' : ''}">
                    <span class="task-icon">${t.icon}</span> 
                    <span style="${t.done ? 'text-decoration: line-through;' : ''}">${t.label}</span>
                </div>
                <div class="task-right">
                    <span class="task-xp">${t.xp} XP</span>
                    <div class="checkbox ${t.done ? 'checked' : ''}" onclick="toggleTaskWeek(${i})"></div>
                </div>
            </li>`;
    });
    
    document.getElementById('ui-completed-tasks').innerText = `${doneCount} / 6`;
    document.getElementById('ui-day-xp').innerText = viewingData.xp;
}

// --- GESTIONE SPUNTE E LIVELLI ---
window.toggleTask = function(index) { processTaskToggle(appData.currentDay, index); }
window.toggleTaskWeek = function(index) { processTaskToggle(appData.viewingDay, index); }

function processTaskToggle(dayKey, index) {
    const day = appData.history[dayKey];
    const task = day.tasks[index];
    task.done = !task.done;
    
    const xpChange = task.done ? task.xp : -task.xp;
    day.xp = Math.max(0, day.xp + xpChange);
    appData.currentXp += xpChange;
    appData.totalXp = Math.max(0, appData.totalXp + xpChange);

    if (appData.currentXp >= appData.maxXPForLevel) {
        appData.level++;
        appData.currentXp -= appData.maxXPForLevel;
        appData.maxXPForLevel += 50;
    } else if (appData.currentXp < 0) {
        if (appData.level > 1) {
            appData.level--;
            appData.maxXPForLevel -= 50;
            appData.currentXp += appData.maxXPForLevel;
        } else {
            appData.currentXp = 0;
        }
    }
    updateStreak();
    saveData();
}

function updateStreak() {
    const weekOrder = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];
    const todayIdx = weekOrder.indexOf(appData.currentDay);
    let streak = 0;
    for (let i = todayIdx; i >= 0; i--) {
        const dayData = appData.history[weekOrder[i]];
        if (dayData && dayData.tasks.some(t => t.done)) {
            streak++;
        } else {
            break;
        }
    }
    appData.streak = streak;
}

// Avvio applicazione
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    loadFromCloud();
});