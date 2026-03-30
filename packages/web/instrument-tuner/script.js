import { ChromaticTuner } from 'chromatic-tuner';

let audioContext = null;
let tuner = null;
let isRunning = false;
let analyser = null;
let animationFrameId = null;

const noteDisplay = document.getElementById('current-note');
const octaveDisplay = document.getElementById('current-octave');
const freqDisplay = document.getElementById('frequency-display');
const centsDisplay = document.getElementById('cents-display');
const needle = document.getElementById('needle');
const startBtn = document.getElementById('start-btn');

const smoothingBufferSize = 24;
const pitchBuffer = [];

function getSmoothedFrequency(newFreq) {
    if (!newFreq) {
        if (pitchBuffer.length > 0) pitchBuffer.shift(); 
        return null;
    }
    pitchBuffer.push(newFreq);
    if (pitchBuffer.length > smoothingBufferSize) pitchBuffer.shift();
    const sorted = [...pitchBuffer].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function updateUI(noteData) {
    if (!noteData) {
        noteDisplay.innerText = "--";
        octaveDisplay.innerText = "";
        freqDisplay.innerText = "0.0 Hz";
        centsDisplay.innerText = "0 cents";
        needle.style.transform = `rotate(0deg)`;
        return;
    }

    noteDisplay.innerText = noteData.note;
    octaveDisplay.innerText = `Octave ${noteData.octave}`;
    freqDisplay.innerText = `${noteData.frequency.toFixed(1)} Hz`;
    centsDisplay.innerText = `${noteData.cents > 0 ? '+' : ''}${noteData.cents.toFixed(0)} cents`;

    const angle = (noteData.cents / 50) * 80;
    needle.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    
    if (Math.abs(noteData.cents) < 5) {
        noteDisplay.style.color = "#2ecc71";
    } else if (Math.abs(noteData.cents) < 15) {
        noteDisplay.style.color = "#f1c40f";
    } else {
        noteDisplay.style.color = "var(--text-color)";
    }
}

function loop() {
    if (!isRunning) return;
    
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    
    let frequency = tuner.getPitch(buffer);
    if (frequency && (frequency < 20 || frequency > 4000)) frequency = null;
    
    const smoothed = getSmoothedFrequency(frequency);
    const noteData = tuner.getNote(smoothed);
    
    updateUI(noteData);
    animationFrameId = requestAnimationFrame(loop);
}

async function start() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        
        tuner = new ChromaticTuner({ sampleRate: audioContext.sampleRate });
        isRunning = true;
        startBtn.style.display = 'none';
        loop();
    } catch (err) {
        console.error(err);
        alert("Microphone access is required for the tuner.");
    }
}

startBtn.addEventListener('click', start);