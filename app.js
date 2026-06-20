// --- Navegación ---
function goToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0,0);
}

// --- Text To Speech ---
function playAudio(text) {
    if ('speechSynthesis' in window) {
        // Cancelar si algo ya está sonando
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-MX'; // Español de México o genérico
        utterance.rate = 0.9; // Un poco más lento para niños
        utterance.pitch = 1.1; // Tono más amigable
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Tu navegador no soporta lectura de voz.");
    }
}

// --- Nivel 1: Semáforo de Acciones (Drag & Drop Móvil y Desktop) ---
const actionsList = [
    { id: 1, icon: '🤝', type: 'good', active: true },
    { id: 2, icon: '😠', type: 'bad', active: true },
    { id: 3, icon: '🧹', type: 'good', active: true },
    { id: 4, icon: '😛', type: 'bad', active: true } // burlarse
];

function initLevel1() {
    const container = document.getElementById('draggable-container');
    container.innerHTML = '';
    
    actionsList.forEach(action => {
        if(action.active) {
            const el = document.createElement('div');
            el.className = 'draggable-item';
            el.draggable = true;
            el.dataset.type = action.type;
            el.dataset.id = action.id;
            el.textContent = action.icon;
            
            // Eventos Desktop
            el.addEventListener('dragstart', handleDragStart);
            el.addEventListener('dragend', handleDragEnd);
            
            // Eventos Móviles (Touch)
            el.addEventListener('touchstart', handleTouchStart, {passive: false});
            el.addEventListener('touchmove', handleTouchMove, {passive: false});
            el.addEventListener('touchend', handleTouchEnd);
            
            container.appendChild(el);
        }
    });

    const zones = document.querySelectorAll('.zone');
    zones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

// -- Drag Desktop --
let draggedItem = null;
function handleDragStart(e) {
    draggedItem = this;
    setTimeout(() => this.style.opacity = '0.5', 0);
}
function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedItem = null;
}
function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}
function handleDragLeave(e) {
    this.classList.remove('drag-over');
}
function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if(draggedItem) {
        checkDrop(draggedItem, this);
    }
}

// -- Drag Móvil (Touch) --
let touchOffsetX, touchOffsetY, originalPlaceholder;
function handleTouchStart(e) {
    draggedItem = this;
    const touch = e.touches[0];
    const rect = this.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;
    
    this.style.position = 'fixed';
    this.style.zIndex = '1000';
    this.style.left = (touch.clientX - touchOffsetX) + 'px';
    this.style.Top = (touch.clientY - touchOffsetY) + 'px';
}

function handleTouchMove(e) {
    if(!draggedItem) return;
    e.preventDefault(); // Evitar scroll
    const touch = e.touches[0];
    draggedItem.style.left = (touch.clientX - touchOffsetX) + 'px';
    draggedItem.style.top = (touch.clientY - touchOffsetY) + 'px';
}

function handleTouchEnd(e) {
    if(!draggedItem) return;
    
    draggedItem.style.position = 'relative';
    draggedItem.style.left = '0';
    draggedItem.style.top = '0';
    draggedItem.style.zIndex = '1';
    
    const touch = e.changedTouches[0];
    const zones = document.querySelectorAll('.zone');
    let droppedInZone = null;
    
    zones.forEach(zone => {
        const rect = zone.getBoundingClientRect();
        if(touch.clientX >= rect.left && touch.clientX <= rect.right &&
           touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            droppedInZone = zone;
        }
    });

    if(droppedInZone) {
        checkDrop(draggedItem, droppedInZone);
    }
    
    draggedItem = null;
}

// -- Chequeo general --
function checkDrop(item, zone) {
    const itemType = item.dataset.type;
    const zoneType = zone.dataset.type;
    
    if(itemType === zoneType) {
        item.remove(); // Desaparecer correcto
        playAudio(zoneType === 'good' ? '¡Muy bien! Eso nos ayuda.' : 'Correcto. Eso no ayuda.');
        checkLevel1Complete();
        // Lanzar unas mini estrellitas
        const rect = zone.getBoundingClientRect();
        confetti({
            particleCount: 20,
            spread: 40,
            origin: { x: (rect.left + rect.width/2)/window.innerWidth, y: (rect.top + rect.height/2)/window.innerHeight }
        });
    } else {
        // Error visual
        item.style.backgroundColor = '#fecaca';
        setTimeout(() => item.style.backgroundColor = 'white', 500);
        playAudio('Piénsalo otra vez.');
        // Si fue click móvil, regresarlo
        if(item.style.position === 'relative') {
            item.style.transform = 'translate(0,0)';
        }
    }
}

function checkLevel1Complete() {
    const container = document.getElementById('draggable-container');
    if(container.children.length === 0) {
        setTimeout(() => {
            playAudio("¡Felicidades! Terminaste el nivel uno.");
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
    }
}

// --- Nivel 2: Constructores de Acuerdos ---
const rulesList = [
    { id: 1, text: "Escuchar a quien habla", icon: "👂" },
    { id: 2, text: "Compartir juguetes", icon: "🧸" },
    { id: 3, text: "Levantar la mano", icon: "✋" },
    { id: 4, text: "Ayudar a ordenar", icon: "📦" }
];
let selectedRules = [];

function initLevel2() {
    const container = document.getElementById('rules-container');
    container.innerHTML = '';
    selectedRules = [];
    document.getElementById('rules-count').innerText = "0";
    document.getElementById('celebration').style.display = 'none';

    rulesList.forEach(rule => {
        const div = document.createElement('div');
        div.className = 'rule-card';
        div.innerHTML = `
            <div class="rule-icon">${rule.icon}</div>
            <p>${rule.text}</p>
        `;
        div.onclick = () => toggleRule(rule.id, div);
        container.appendChild(div);
    });
}

function toggleRule(id, cardElement) {
    if(selectedRules.includes(id)) {
        selectedRules = selectedRules.filter(r => r !== id);
        cardElement.classList.remove('selected');
    } else {
        if(selectedRules.length < 3) {
            selectedRules.push(id);
            cardElement.classList.add('selected');
            playAudio("Elegiste: " + rulesList.find(r=>r.id===id).text);
        } else {
             playAudio("Ya elegiste tres reglas.");
             return;
        }
    }
    
    document.getElementById('rules-count').innerText = selectedRules.length;
    
    if(selectedRules.length === 3) {
        document.getElementById('celebration').style.display = 'block';
        playAudio("¡Excelente! Esas reglas son fantásticas.");
        triggerConfetti(2); // Llamar confeti 2 segundos
    } else {
        document.getElementById('celebration').style.display = 'none';
    }
}

function triggerConfetti(seconds) {
    const duration = seconds * 1000;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        confetti({
            particleCount: 50,
            startVelocity: 30,
            spread: 360,
            origin: {
                x: Math.random(),
                y: Math.random() - 0.2
            }
        });
    }, 250);
}


// --- Nivel 3: El Dilema del Recreo ---
function selectStoryOutcome(type) {
    const choices = document.getElementById('story-choices');
    const result = document.getElementById('story-result');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultText = document.getElementById('result-text');

    choices.style.display = 'none';
    result.style.display = 'block';

    if(type === 'good') {
        resultIcon.innerText = '✨😄✨';
        resultTitle.innerText = "¡Gran decisión!";
        resultTitle.style.color = "#16a34a"; // verde
        resultText.innerText = "Tomar turnos hace que todos puedan jugar felices y seguros. ¡La resbaladilla fue divertida para los dos!";
        playAudio(resultText.innerText);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
        resultIcon.innerText = '😟🤕';
        resultTitle.innerText = "Oh no...";
        resultTitle.style.color = "#dc2626"; // rojo
        resultText.innerText = "Empujarse lastima y pone tristes a los demás. ¡Es importante cuidarnos!";
        playAudio(resultText.innerText);
    }
}

function resetStory() {
    document.getElementById('story-choices').style.display = 'flex';
    document.getElementById('story-result').style.display = 'none';
}


// --- Muro de la Paz ---
let currentStamp = '⭐';

function setCurrentStamp(stamp) {
    currentStamp = stamp;
    document.querySelectorAll('.stamp-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function initWall() {
    const wall = document.getElementById('peace-wall');
    
    // Evitar añadir múltiples listeners si se llama varias veces initWall
    wall.removeEventListener('click', placeStamp);
    wall.addEventListener('click', placeStamp);
}

function placeStamp(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const stampEl = document.createElement('div');
    stampEl.innerText = currentStamp;
    stampEl.className = 'stamp';
    stampEl.style.left = `${x}px`;
    stampEl.style.top = `${y}px`;
    
    // Rotación aleatoria ligeramente caótica
    const randomRot = Math.floor(Math.random() * 40) - 20; 
    stampEl.style.setProperty('--rot', randomRot);

    this.appendChild(stampEl);
    
    const sounds = ['¡Plop!', '¡Genial!', '¡Sello!', '¡Listo!'];
    const rnd = Math.floor(Math.random() * sounds.length);
    playAudio(sounds[rnd]);
}


// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    initLevel1();
    initLevel2();
    initWall();
});
