import { Dhwani } from 'dhwani';

let audioContext = null;
let tuner = null;
let isRunning = false;
let analyser = null;
let animationFrameId = null;

const swarDisplay = document.getElementById('current-swar');
const octaveDisplay = document.getElementById('current-octave');
const freqDisplay = document.getElementById('frequency-display');
const centsDisplay = document.getElementById('cents-display');
const needle = document.getElementById('needle');
const startBtn = document.getElementById('start-btn');

const smoothingBufferSize = 10;
const pitchBuffer = [];

function getSmoothedFrequency(newFreq) {
    if (!newFreq) return null;
    pitchBuffer.push(newFreq);
    if (pitchBuffer.length > smoothingBufferSize) pitchBuffer.shift();
    const sorted = [...pitchBuffer].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
}

function updateUI(noteData) {
    if (!noteData) {
        swarDisplay.innerText = "--";
        octaveDisplay.innerText = "";
        freqDisplay.innerText = "0.0 Hz";
        centsDisplay.innerText = "0 cents";
        needle.style.transform = `rotate(0deg)`;
        return;
    }

    swarDisplay.innerText = noteData.swar;
    octaveDisplay.innerText = `Oct ${noteData.octave}`;
    freqDisplay.innerText = `${noteData.frequency.toFixed(1)} Hz`;
    centsDisplay.innerText = `${noteData.cents > 0 ? '+' : ''}${noteData.cents.toFixed(0)} cents`;

    const angle = (noteData.cents / 50) * 80;
    needle.style.transform = `rotate(${angle.toFixed(1)}deg)`;
    
    if (Math.abs(noteData.cents) < 10) {
        swarDisplay.style.color = "#2ecc71";
    } else {
        swarDisplay.style.color = "var(--accent-color)";
    }
}

function loop() {
    if (!isRunning) return;
    
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);
    
    let frequency = tuner.getPitch(buffer);
    if (frequency && (frequency < 70 || frequency > 1200)) frequency = null;
    
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
        
        const filter = audioContext.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 400;
        filter.Q.value = 0.5;
        
        source.connect(filter);
        filter.connect(analyser);
        
        tuner = new Dhwani({ sampleRate: audioContext.sampleRate });
        isRunning = true;
        startBtn.style.display = 'none';
        loop();
    } catch (err) {
        console.error(err);
        alert("Microphone access is required for the tuner.");
    }
}

startBtn.addEventListener('click', start);