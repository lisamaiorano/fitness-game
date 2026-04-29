// Struttura JSON iniziale dell'utente (TUTTO AZZERATO)
const defaultData = {
    level: 1,
    currentXp: 0,
    maxXPForLevel: 100, // Il primo livello richiede 100 XP
    streak: 0,
    totalXp: 0,
    tasks: [
        { id: 'steps', icon: '👣', label: '8.000+ passi', xp: 10, done: false },
        { id: 'workout', icon: '🏋️‍♀️', label: 'Allenamento', xp: 20, done: false },
        { id: 'food', icon: '🥗', label: 'Mangiare pulito', xp: 15, done: false },
        { id: 'snack', icon: '🍩', label: 'No snack inutili', xp: 10, done: false },
        { id: 'water', icon: '💧', label: 'Bere 2L di acqua', xp: 5, done: false },
        { id: 'sleep', icon: '🌙', label: 'Dormire 7h', xp: 10, done: false }
    ]
};

// Funzione principale di caricamento (Legge il JSON salvato offline)
function loadData() {
    // Usiamo una nuova chiave v2 così ignoriamo i vecchi test salvati
    const savedData = localStorage.getItem('fitnessApp_v2'); 
    if (savedData) {
        return JSON.parse(savedData);
    }
    return defaultData;
}

// Salva i dati offline in formato JSON
function saveData(data) {
    localStorage.setItem('fitnessApp_v2', JSON.stringify(data));
    updateUI(data);
}

// Funzione per aggiornare l'Interfaccia Grafica
function updateUI(data) {
    // Aggiorna Dashboard
    document.getElementById('ui-level').innerText = data.level;
    document.getElementById('ui-xp-text').innerText = `${data.currentXp} / ${data.maxXPForLevel} XP`;
    document.getElementById('ui-next-level').innerText = `Prossimo livello: ${data.maxXPForLevel - data.currentXp} XP`;
    document.getElementById('ui-streak').innerText = data.streak;
    document.getElementById('ui-total-xp').innerText = data.totalXp.toLocaleString('it-IT');
    
    // Aggiorna Barra (evita che superi il 100% visivamente se ci sono bug)
    const percentage = Math.min((data.currentXp / data.maxXPForLevel) * 100, 100);
    document.getElementById('ui-progress').style.width = `${percentage}%`;

    // Renderizza la lista missioni
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; 

    data.tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <div class="task-left">
                <span class="task-icon">${task.icon}</span>
                <span>${task.label}</span>
            </div>
            <div class="task-right">
                <span class="task-xp">${task.xp} XP</span>
                <div class="checkbox ${task.done ? 'checked' : ''}" onclick="toggleTask(${index})"></div>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// Logica per quando l'utente clicca una checkbox
window.toggleTask = function(index) {
    let data = loadData();
    let task = data.tasks[index];
    
    // Cambia stato completato
    task.done = !task.done;
    
    // Aggiungi o togli XP
    if (task.done) {
        data.currentXp += task.xp;
        data.totalXp += task.xp;
    } else {
        data.currentXp -= task.xp;
        data.totalXp -= task.xp;
    }

    // Gestione Livello (Level Up)
    if (data.currentXp >= data.maxXPForLevel) {
        data.level += 1;
        data.currentXp = data.currentXp - data.maxXPForLevel;
        data.maxXPForLevel += 50; // Ad ogni livello ci vogliono 50 XP in più per salire
        alert(`🎉 Complimenti! Sei salita al Livello ${data.level}!`);
    }

    // Salva e aggiorna
    saveData(data);
};

// Inizializza l'app all'apertura
document.addEventListener('DOMContentLoaded', () => {
    let data = loadData();
    updateUI(data);
});