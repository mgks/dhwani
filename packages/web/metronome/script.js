import { Metronome } from 'dhwani-metronome';

let audioContext = null;
let metronomeInstance = null;
const bpmDisplay = document.getElementById('bpm-value');
const bpmSlider = document.getElementById('bpm-slider');
const bpmMinus = document.getElementById('bpm-minus');
const bpmPlus = document.getElementById('bpm-plus');
const startBtn = document.getElementById('start-stop-btn');
const beatDot = document.getElementById('beat-dot');

function playClick(time) {
    const osc = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 880;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    setTimeout(() => {
        beatDot.classList.add('flash');
        setTimeout(() => beatDot.classList.remove('flash'), 50);
    }, (time - audioContext.currentTime) * 1000);
}

function updateBPM(val) {
    const bpm = Math.max(40, Math.min(240, Math.round(val)));
    bpmSlider.value = bpm;
    bpmDisplay.innerText = bpm;
    if (metronomeInstance) metronomeInstance.bpm = bpm;
}

function handleStep(isPlus) {
    const current = parseInt(bpmSlider.value);
    let next;
    if (isPlus) {
        next = current % 5 === 0 ? current + 5 : Math.ceil(current / 5) * 5;
    } else {
        next = current % 5 === 0 ? current - 5 : Math.floor(current / 5) * 5;
    }
    updateBPM(next);
}

let stepInterval = null;
function startStepping(isPlus) {
    handleStep(isPlus);
    stepInterval = setInterval(() => handleStep(isPlus), 150);
}

function stopStepping() {
    if (stepInterval) {
        clearInterval(stepInterval);
        stepInterval = null;
    }
}

bpmSlider.addEventListener('input', (e) => updateBPM(e.target.value));

bpmMinus.addEventListener('mousedown', () => startStepping(false));
bpmPlus.addEventListener('mousedown', () => startStepping(true));
window.addEventListener('mouseup', stopStepping);

// Touch support
bpmMinus.addEventListener('touchstart', (e) => { e.preventDefault(); startStepping(false); });
bpmPlus.addEventListener('touchstart', (e) => { e.preventDefault(); startStepping(true); });
window.addEventListener('touchend', stopStepping);

async function unlockAudioContext(context) {
    if (context.state === 'suspended') {
        await context.resume();
    }
    // Play silent buffer to unlock audio on iOS
    const buffer = context.createBuffer(1, 1, 22050);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start(0);
}

startBtn.addEventListener('click', async () => {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    await unlockAudioContext(audioContext);

    if (!metronomeInstance) {
        metronomeInstance = new Metronome(playClick);
        metronomeInstance.bpm = parseInt(bpmSlider.value);
    }

    if (metronomeInstance.isPlaying) {
        metronomeInstance.stop();
        startBtn.innerText = "Start";
    } else {
        metronomeInstance.start(audioContext);
        startBtn.innerText = "Stop";
    }
});