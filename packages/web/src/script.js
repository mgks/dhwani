import { Dhwani } from 'dhwani';

// --- CONFIGURATION ---
const CONFIG = {
    smoothingBufferSize: 5,   // Higher = smoother needle, Lower = faster response
    uiUpdateFps: 60,          // Cap UI updates to screen refresh rate
    minVocalFreq: 70,         // Filter out AC hum/rumble below 70Hz
    maxVocalFreq: 1000,       // Filter out high hiss above 1000Hz
    dialWidthPx: 60,          // Width of one Swar item in CSS
};

// --- STATE ---
let audioContext = null;
let analyser = null;
let microphone = null;
let dhwani = null;
let isRunning = false;
let animationFrameId = null;

// Buffers for smoothing logic
const pitchBuffer = [];
let lastRenderTime = 0;

// DOM Elements
const swarContainer = document.getElementById('swarContainer');
const detailedDisplay = document.getElementById('detailedSwarDisplay');
const startButton = document.getElementById('startButton'); // Ensure you have a button in HTML or auto-start

// Visual Data
const swarOrder = ["Sa", "re", "Re", "ga", "Ga", "Ma", "Ma#", "Pa", "dha", "Dha", "ni", "Ni"];
// We render 3 octaves of Swars to create a "scrollable" range
const displaySwars = [...swarOrder, ...swarOrder, ...swarOrder];

/**
 * Initialize the Swar Dial (Infinite Tape)
 */
function initUI() {
    swarContainer.innerHTML = '';
    displaySwars.forEach((swar, index) => {
        const el = document.createElement('div');
        el.className = 'swarItem';
        el.dataset.index = index;
        el.innerHTML = `
            <div class="swarName">${swar}</div>
            <div class="swarIndicator"></div>
        `;
        swarContainer.appendChild(el);
    });
}

// --- THEME LOGIC ---
function initTheme() {
    const toggleBtn = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Check Local Storage first
    const savedTheme = localStorage.getItem('dhwani-theme');
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
    }

    toggleBtn.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        let newTheme = 'light';

        // Logic: If currently Dark (via attr or system), switch to Light
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (currentTheme === 'dark' || (!currentTheme && systemDark)) {
            newTheme = 'light';
        } else {
            newTheme = 'dark';
        }

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('dhwani-theme', newTheme);
    });
}

/**
 * Apply Median Filter + Moving Average to stabilize jittery pitch
 */
function getSmoothedFrequency(newFreq) {
    if (!newFreq) return null;

    // Add to buffer
    pitchBuffer.push(newFreq);
    if (pitchBuffer.length > CONFIG.smoothingBufferSize) {
        pitchBuffer.shift();
    }

    // 1. Median Filter (Remove outliers/glitches)
    const sorted = [...pitchBuffer].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // 2. Weighted Moving Average (Smooth transitions)
    // Give more weight to recent values? For now, simple average of the buffer is fine.
    const average = pitchBuffer.reduce((a, b) => a + b, 0) / pitchBuffer.length;
    
    // Return average, but if median is vastly different, prefer median (reject spark)
    return Math.abs(average - median) > 5 ? median : average;
}

/**
 * Update the Visual Dial
 */
function updateVisuals(noteData) {
    if (!noteData) {
        swarContainer.style.opacity = '0.3';
        detailedDisplay.innerText = "--";
        // Remove active classes
        Array.from(swarContainer.children).forEach(c => c.classList.remove('active', 'perfect'));
        return;
    }

    swarContainer.style.opacity = '1';

    // 1. Calculate Position
    // We target the Middle Octave set (Index 12 to 23 in our displaySwars array)
    const swarIndex = swarOrder.indexOf(noteData.swar);
    
    // Base index in the visual array (Offset by 12 to start in middle set)
    const visualBaseIndex = 12 + swarIndex;

    // Cents offset: -50 cents = -0.5 shift, +50 cents = +0.5 shift
    const offsetFraction = noteData.cents / 100;

    // Calculate Pixel Translation
    const itemWidth = CONFIG.dialWidthPx; // Must match CSS width
    const containerWidth = swarContainer.parentElement.offsetWidth;
    
    // Center logic: We want the current note (visualBaseIndex + offset) to be in the center of the screen
    // Formula: (ScreenCenter) - (Position of Note)
    // Position of Note = (Index * Width) + (Fraction * Width) + (HalfItemWidth)
    
    const absolutePosition = (visualBaseIndex + offsetFraction) * itemWidth;
    const centerOffset = (containerWidth / 2) - (itemWidth / 2);
    const translation = centerOffset - absolutePosition;

    // Apply Transform (GPU)
    swarContainer.style.transform = `translateX(${translation.toFixed(1)}px)`;

    // 2. Highlight Active Item
    const activeItem = swarContainer.children[visualBaseIndex];
    
    // Reset previous actives
    const currentActive = swarContainer.querySelector('.active');
    if (currentActive && currentActive !== activeItem) {
        currentActive.classList.remove('active', 'perfect');
    }

    if (activeItem) {
        activeItem.classList.add('active');
        
        // "Perfect" Tuning Glow (Green) if within +/- 10 cents
        if (Math.abs(noteData.cents) < 10) {
            activeItem.classList.add('perfect');
        } else {
            activeItem.classList.remove('perfect');
        }
    }

    // 3. Detailed Text
    detailedDisplay.innerText = `${noteData.swar} (${noteData.octave}) | ${noteData.frequency.toFixed(1)} Hz | ${noteData.cents > 0 ? '+' : ''}${noteData.cents.toFixed(0)} cents`;
}

/**
 * Main Audio Loop
 */
function loop() {
    if (!isRunning) return;

    animationFrameId = requestAnimationFrame(loop);

    // Rate Limiting (Optional, ensures we don't over-render if screen is 144hz)
    const now = Date.now();
    if (now - lastRenderTime < (1000 / CONFIG.uiUpdateFps)) return;
    lastRenderTime = now;

    // 1. Get Data
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    // 2. Detect Pitch (Raw)
    let frequency = dhwani.getPitch(buffer);

    // 3. Pre-Filter (Ignore noise outside vocal range)
    if (frequency && (frequency < CONFIG.minVocalFreq || frequency > CONFIG.maxVocalFreq)) {
        frequency = null;
    }

    // 4. Smooth
    const smoothedFreq = getSmoothedFrequency(frequency);

    // 5. Get Note Info from Library
    const noteData = dhwani.getNote(smoothedFreq);

    // 6. Update UI
    updateVisuals(noteData);
}

/**
 * Start Audio Context and Stream
 */
async function startTuner() {
    try {
        if (audioContext) await audioContext.close();

        audioContext = new AudioContext();
        
        // Microphone Setup: Disable processing for cleaner music signal
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        microphone = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048; // Good balance for latency/accuracy

        // HARDWARE FILTER: Bandpass
        // This cuts out AC hum (50/60hz) and high frequency hiss
        const bandpass = audioContext.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 400; // Center of human voice
        bandpass.Q.value = 0.5; // Wide Q factor to cover 100-800Hz range effectively

        microphone.connect(bandpass);
        bandpass.connect(analyser);

        // Initialize Library
        dhwani = new Dhwani({
            sampleRate: audioContext.sampleRate,
            threshold: 0.1 // Stricter threshold for cleaner UI
        });

        isRunning = true;
        
        // Hide Start Button / Overlay if you have one
        if (startButton) startButton.style.display = 'none';
        
        loop();

    } catch (err) {
        console.error("Microphone Error:", err);
        detailedDisplay.innerText = "Error: Microphone access denied.";
        alert("Please allow microphone access to use the tuner.");
    }
}

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    initTheme();

    // User interaction required to start AudioContext
    // If you have a start button:
    if (startButton) {
        startButton.addEventListener('click', startTuner);
    } else {
        // Or global click if you prefer minimal UI
        document.body.addEventListener('click', () => {
            if (!isRunning) startTuner();
        }, { once: true });
        
        detailedDisplay.innerText = "Tap anywhere to start";
    }
});

// Handle resize to keep dial centered
window.addEventListener('resize', () => {
    // Force a re-render/re-calc on next frame if needed
    // Usually CSS flexbox handles the container, but calculations might need update
});