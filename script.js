document.addEventListener('DOMContentLoaded', () => {
    const swarDial = document.getElementById('swarDial');
    const swarContainer = document.getElementById('swarContainer');
    const detailedSwarDisplay = document.getElementById('detailedSwarDisplay');

    let audioContext;
    let analyser;
    let microphone;
    let dataArray;
    let animationFrameId;

    // Smoothing parameters - Reduced, as we rely more on range and stickiness
    const frequencySmoothing = 0.4; // Less smoothing
    const dialPositionSmoothing = 0.2; // Less dial smoothing

    let lastFrequency = 0;
    let lastDialPosition = 0;

    // "Sticky" swar parameters
    let currentSwar = null;
    let currentSwarIndex = -1;
    let currentOctave = null;
    let currentSwarStartTime = 0;
    const swarHoldTime = 100; // Shorter hold time (more responsive)
    const confidenceThreshold = 40; //  Cents -  for changing swars

       // --- Hindustani Swar Frequencies (Just Intonation) ---
    const baseFrequencies = {
        "Sa": 240,
        "re": 256,
        "Re": 270,
        "ga": 288,
        "Ga": 300,
        "Ma": 320,
        "ma": 360,
        "Pa": 360,
        "dha": 384,
        "Dha": 400,
        "ni": 450,
        "Ni": 480,
    };

    const swarFrequencies = {};
    const octaves = [-1, 0, 1, 2];
    const octaveNames = {
      [-1]: "Mandra",
      [0]: "Madhya",
      [1]: "Taar",
      [2]: "Ati Taar"
    }

    for (const octave of octaves) {
        swarFrequencies[octave] = {};
        for (const swar in baseFrequencies) {
            swarFrequencies[octave][swar] = baseFrequencies[swar] * Math.pow(2, octave);
        }
    }

    const swarRangeCents = 30;

    const swarRanges = {};
    for (const octave of octaves) {
        swarRanges[octave] = {};
        for (const swar in swarFrequencies[octave]) {
            const baseFrequency = swarFrequencies[octave][swar];
            const lowerFrequency = baseFrequency * Math.pow(2, -swarRangeCents / 1200);
            const upperFrequency = baseFrequency * Math.pow(2, swarRangeCents / 1200);
            swarRanges[octave][swar] = { lower: lowerFrequency, upper: upperFrequency };
        }
    }

    const swarOrder = ["Sa", "re", "Re", "ga", "Ga", "Ma", "ma", "Pa", "dha", "Dha", "ni", "Ni"];

    const flatThreshold = -12;
    const sharpThreshold = 12;

    function centsDifference(f1, f2) {
        return 1200 * Math.log2(f1 / f2);
    }

    // --- Get Closest Swar (Allows Direct Jumps) ---
    function getClosestSwar(frequency, currentSwar, currentOctave) {
        let closestSwar = null;
        let octave = null;
        let centsDiff = 0;
        let isInCurrentRange = false;

        // 1. Check if within the current swar's range (if any)
        if (currentSwar && currentOctave !== null) {
            const currentRange = swarRanges[currentOctave][currentSwar];
            if (frequency >= currentRange.lower && frequency <= currentRange.upper) {
                const idealFrequency = swarFrequencies[currentOctave][currentSwar];
                centsDiff = centsDifference(frequency, idealFrequency);
                return {
                    swar: currentSwar,
                    octave: currentOctave,
                    centsDiff: centsDiff,
                    isInCurrentRange: true,
                };
            }
        }

        // 2. If not in current range, check ALL swars in ALL octaves
        for (const oct of octaves) {
            for (const swar of swarOrder) {
                const range = swarRanges[oct][swar];
                if (frequency >= range.lower && frequency <= range.upper) {
                    // Found a swar within range!  Return immediately.
                    const idealFrequency = swarFrequencies[oct][swar];
                    centsDiff = centsDifference(frequency, idealFrequency);
                    return {
                        swar: swar,
                        octave: oct,
                        centsDiff: centsDiff,
                        isInCurrentRange: false, // We know it's not the current range
                    };
                }
            }
        }

        // No swar found within range
        return {
            swar: null,
            octave: null,
            centsDiff: 0,
            isInCurrentRange: false,
        };
    }
    // Autocorrelation function (same)
    function autoCorrelate(buf, sampleRate) {
        let size = buf.length;
        let rms = 0;

        for (let i = 0; i < size; i++) {
            const val = buf[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / size);
        if (rms < 0.01) { // Not enough signal
            return -1;
        }

        let r1 = 0, r2 = -1, diff = 0;
        for (let i = 0; i < size / 2; i++) {
            diff += Math.abs(buf[i] - buf[i + size / 2]);
        }
        diff = 1 - (diff / (size / 2));

        let best_offset = -1;
        let best_correlation = 0;
        let last_correlation = 1;

        for (let offset = 0; offset < size / 2; offset++) {
            let correlation = 0;

            for (let i = 0; i < size / 2; i++) {
                correlation += Math.abs((buf[i]) - (buf[i + offset]));
            }
            correlation = 1 - (correlation / (size / 2));

           if ((correlation > 0.9) && (correlation > last_correlation)) {
                if (correlation > best_correlation) {
                    best_correlation = correlation;
                    best_offset = offset;
                }
            }
            last_correlation = correlation;
        }

        if (best_offset === -1) {
            return -1; // No good correlation found
        }

        const better_offset = best_offset + (buf[best_offset + 1] - buf[best_offset - 1]) / (2 * (2 * buf[best_offset] - buf[best_offset + 1] - buf[best_offset - 1]));
        return sampleRate / better_offset;
    }
    function createSwarDial() {
        swarContainer.innerHTML = '';
        for (const swar of swarOrder) {
            const swarItem = document.createElement('div');
            swarItem.classList.add('swarItem');

            const swarName = document.createElement('div');
            swarName.textContent = swar;
            swarItem.appendChild(swarName);

            const swarIndicator = document.createElement('div');
            swarIndicator.classList.add('swarIndicator');
            swarItem.appendChild(swarIndicator);

            swarContainer.appendChild(swarItem);
        }
    }

    function updateSwarDial(swar, centsDiff) {
        const index = swarOrder.indexOf(swar);
        if (index === -1) return;

        currentSwarIndex = index;

        const dialWidth = swarDial.offsetWidth;
        const swarWidth = swarContainer.children[0].offsetWidth;
        const targetOffset = (dialWidth / 2) - (swarWidth * (index + 0.5));

        lastDialPosition = dialPositionSmoothing * lastDialPosition + (1 - dialPositionSmoothing) * targetOffset;
        swarContainer.style.left = `${lastDialPosition.toFixed(0)}px`;

        for (let i = 0; i < swarContainer.children.length; i++) {
            const item = swarContainer.children[i];
            const indicator = item.querySelector('.swarIndicator');

            item.classList.remove('active');
            indicator.classList.remove('flat', 'natural', 'sharp', 'active');
            indicator.innerHTML = '';

            const distance = Math.abs(i - index);
            let opacity = 1 - (distance * 0.2);
            opacity = Math.max(0, Math.min(1, opacity));
            item.style.opacity = opacity;

            if (i === index) {
                item.classList.add('active');
                indicator.classList.add('active');

                if (centsDiff < flatThreshold) {
                    indicator.classList.add('flat');
                    indicator.innerHTML = '&flat;';
                } else if (centsDiff > sharpThreshold) {
                    indicator.classList.add('sharp');
                    indicator.innerHTML = '&sharp;';
                } else {
                    indicator.classList.add('natural');
                    indicator.innerHTML = '&natural;';
                }
            }
        }
    }

    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    const updateDetailedDisplay = debounce((octave, frequency, centsDiff) => {
        let octaveName = octaveNames[octave] || "Unknown";
        detailedSwarDisplay.textContent = `${octaveName} Octave, Frequency: ${frequency.toFixed(2)} Hz, Cents Diff: ${centsDiff.toFixed(0)}`;
    }, 100);

    // --- updatePitch (Prioritize Stickiness and Allow Jumps) ---
    function updatePitch() {
        analyser.getFloatTimeDomainData(dataArray);
        let frequency = autoCorrelate(dataArray, audioContext.sampleRate);

        if (frequency !== -1) {
            frequency = frequencySmoothing * lastFrequency + (1 - frequencySmoothing) * frequency;
            lastFrequency = frequency;

            let { swar, octave, centsDiff, isInCurrentRange } = getClosestSwar(frequency, currentSwar, currentOctave);
            const now = Date.now();

            // --- Update Swar Logic (Simplified and More Robust) ---
            if (
                swar !== null && // A swar is detected within range
                (currentSwar === null || // No current swar OR
                 (!isInCurrentRange && //  Not in current range AND
                  Math.abs(centsDiff) >= confidenceThreshold) || //  Confident change
                 now - currentSwarStartTime > swarHoldTime) // Hold time expired
            ) {
                currentSwar = swar;
                currentSwarIndex = swarOrder.indexOf(swar);
                currentOctave = octave;
                currentSwarStartTime = now;
                updateSwarDial(currentSwar, centsDiff);
            }

            if (swar && octave !== null) {
                updateDetailedDisplay(octave, frequency, centsDiff);
            }
        } else {
            // Low signal: Keep displaying last swar if available
            if (currentSwar) {
                updateSwarDial(currentSwar, 0); // Keep dial position
                detailedSwarDisplay.textContent = "Low Signal";
            } else {
                detailedSwarDisplay.textContent = "--"; // No previous swar
            }
        }

        animationFrameId = requestAnimationFrame(updatePitch);
    }

    async function init() {
        try {
            audioContext = new AudioContext();
            microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(microphone);

            const highPass = audioContext.createBiquadFilter();
            highPass.type = "highpass";
            highPass.frequency.value = 80;
            const lowPass = audioContext.createBiquadFilter();
            lowPass.type = "lowpass";
            lowPass.frequency.value = 12000;

            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;

            source.connect(highPass);
            highPass.connect(lowPass);
            lowPass.connect(analyser);

            dataArray = new Float32Array(analyser.fftSize);

            createSwarDial();
            updatePitch();

        } catch (err) {
            console.error('Error accessing microphone:', err);
            detailedSwarDisplay.textContent = "Error: Microphone Access Denied";
        }
    }

    window.addEventListener("beforeunload", function (event) {
        if (audioContext) {
            audioContext.close();
        }
        if (microphone) {
            microphone.getTracks().forEach(track => track.stop());
        }
       cancelAnimationFrame(animationFrameId)
    });

    init();
});