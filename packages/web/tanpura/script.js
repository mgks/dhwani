let audioContext = null;
let isPlaying = false;
let oscillators = [];
let gainNodes = [];
let currentHz = 240;
let currentMode = 'Pa';

const playBtn = document.getElementById('play-btn');
const hzDisplay = document.getElementById('hz-value');
const strings = document.querySelectorAll('.string');
const presetBtns = document.querySelectorAll('.preset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

const tuningRatios = {
    'Pa': [1.5, 1, 1, 0.5],
    'Ma': [1.333, 1, 1, 0.5],
    'Ni': [1.875, 1, 1, 0.5]
};

function stopStrings() {
    oscillators.forEach(osc => {
        try { osc.stop(); } catch(e) {}
    });
    oscillators = [];
    gainNodes = [];
    strings.forEach(s => s.classList.remove('vibrating'));
}

function startStrings(hz, mode) {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();

    const ratios = tuningRatios[mode] || tuningRatios['Pa'];
    
    ratios.forEach((ratio, i) => {
        const baseFreq = hz * ratio;
        const startTime = i * 0.5; 
        
        const gain = audioContext.createGain();
        gain.gain.value = 0;
        gain.connect(audioContext.destination);

        const osc1 = audioContext.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = baseFreq;
        
        const osc2 = audioContext.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = baseFreq * 2;
        
        const filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = baseFreq * 4;
        filter.Q.value = 5; 

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        
        // Schedule audio
        const scheduleTime = audioContext.currentTime + startTime;
        osc1.start(scheduleTime);
        osc2.start(scheduleTime);
        gain.gain.setTargetAtTime(0.12, scheduleTime, 0.2);
        
        // Staggered UI Animation
        setTimeout(() => {
            if (isPlaying) strings[i].classList.add('vibrating');
        }, startTime * 1000);
        
        oscillators.push(osc1, osc2);
        gainNodes.push(gain);
    });
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        stopStrings();
        playBtn.innerText = "Play Drone";
    } else {
        startStrings(currentHz, currentMode);
        playBtn.innerText = "Stop Drone";
    }
    isPlaying = !isPlaying;
});

presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentHz = parseFloat(btn.dataset.hz);
        hzDisplay.innerText = currentHz;
        
        if (isPlaying) {
            stopStrings();
            startStrings(currentHz, currentMode);
        }
    });
});

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        if (isPlaying) {
            stopStrings();
            startStrings(currentHz, currentMode);
        }
    });
});
