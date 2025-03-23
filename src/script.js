// src/script.js (Correct Frequency and Cents Display - No Cheating!)

import { Dhwani } from '../dhwani.js';

document.addEventListener('DOMContentLoaded', () => {
    const swarDial = document.getElementById('swarDial');
    const swarContainer = document.getElementById('swarContainer');
    const detailedSwarDisplay = document.getElementById('detailedSwarDisplay');

    let audioContext;
    let analyser;
    let microphone;
    let dataArray;
    let animationFrameId;

    // UI Update Interval
    const displayUpdateInterval = 50; // Update every 50ms
    let lastDisplayUpdate = 0;

    // Warm-up Period
    let isWarmingUp = true;
    const warmUpDuration = 500;

    // Dial position smoothing
    const dialPositionSmoothing = 0.2;
    let lastDialPosition = 0;

    // Swar Parameters
    let currentSwar = null;
    let currentSwarIndex = -1;
    let currentOctave = null;
    const swarHoldTime = 100;
    let lastSwarChangeTime = Date.now();

    // Hindustani Swar Frequencies (Just Intonation)
    const baseFrequencies = { "Sa": 240, "re": 256, "Re": 270, "ga": 288, "Ga": 300, "Ma": 320, "ma": 360, "Pa": 360, "dha": 384, "Dha": 400, "ni": 450, "Ni": 480 };
    const swarFrequencies = {};
    const octaves = [-1, 0, 1, 2];
    const octaveNames = { [-1]: "Mandra", [0]: "Madhya", [1]: "Taar", [2]: "Ati Taar" };

    for (const octave of octaves) {
        swarFrequencies[octave] = {};
        for (const swar in baseFrequencies) {
            swarFrequencies[octave][swar] = baseFrequencies[swar] * Math.pow(2, octave);
        }
    }

    const swarRangeCents = 50;
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
    const flatThreshold = -20;
    const sharpThreshold = 20;

    let dhwani;

    function centsDifference(f1, f2) { return 1200 * Math.log2(f1 / f2); }

    function getClosestSwar(frequency) {
        let closestSwar = null;
        let closestOctave = null;
        let minCentsDiff = Infinity;

        for (const oct of octaves) {
            for (const swar of swarOrder) {
                const range = swarRanges[oct][swar];
                if (frequency >= range.lower && frequency <= range.upper) {
                    const idealFrequency = swarFrequencies[oct][swar];
                    const centsDiff = centsDifference(frequency, idealFrequency);
                    if (Math.abs(centsDiff) < Math.abs(minCentsDiff)) {
                        minCentsDiff = centsDiff;
                        closestSwar = swar;
                        closestOctave = oct;
                    }
                }
            }
        }
        return { swar: closestSwar, octave: closestOctave, centsDiff: minCentsDiff };
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
                    indicator.innerHTML = '♭';
                } else if (centsDiff > sharpThreshold) {
                    indicator.classList.add('sharp');
                    indicator.innerHTML = '♯';
                } else {
                    indicator.classList.add('natural');
                    indicator.innerHTML = '♮';
                }
            }
        }
    }

    function updateDetailedDisplay(octave, frequency, centsDiff) {
      if (octave === null || currentSwar === null) {
        detailedSwarDisplay.textContent = "--";
        return;
      }

      let octaveName = octaveNames[octave] || "Unknown";
      let displayedFrequency;
      let displayedCentsDiff;

      if (frequency !== null) {
        displayedFrequency = frequency.toFixed(2); // Show actual detected frequency, formatted
        const idealFrequency = swarFrequencies[octave][currentSwar]; // Correct ideal freq
        displayedCentsDiff = centsDifference(frequency, idealFrequency).toFixed(0); // Cents, formatted
      } else {
        displayedFrequency = "--";
        displayedCentsDiff = "--";
      }

      detailedSwarDisplay.textContent =
        `${octaveName} Octave, Frequency: ${displayedFrequency} Hz, Cents Diff: ${displayedCentsDiff}`;
    }

    function updatePitch() {
        analyser.getFloatTimeDomainData(dataArray);

        if (isWarmingUp) {
            animationFrameId = requestAnimationFrame(updatePitch);
            return;
        }

        const detectedFrequency = dhwani.getPitch(dataArray);

        if (detectedFrequency) {
            let { swar: detectedSwar, octave: detectedOctave, centsDiff: detectedCentsDiff } = getClosestSwar(detectedFrequency);
            const now = Date.now();

            if (detectedSwar !== null) {
                if (currentSwar === null) {
                    currentSwar = detectedSwar;
                    currentOctave = detectedOctave;
                    lastSwarChangeTime = now;
                    console.log("Initial Swar:", currentSwar, currentOctave);
                } else if (detectedSwar !== currentSwar || detectedOctave !== currentOctave) {
                    if (now - lastSwarChangeTime > swarHoldTime) {
                        console.log("Swar Changed:", currentSwar, "->", detectedSwar, "|", currentOctave, "->", detectedOctave);
                        currentSwar = detectedSwar;
                        currentOctave = detectedOctave;
                        lastSwarChangeTime = now;
                    }
                }
            }

            if (now - lastDisplayUpdate > displayUpdateInterval) {
                if (currentSwar) {
                    updateSwarDial(currentSwar, detectedCentsDiff);
                }
                updateDetailedDisplay(currentOctave, detectedFrequency, detectedCentsDiff);
                lastDisplayUpdate = now;
            }

        } else {
            updateDetailedDisplay(null, null, null);
        }

        animationFrameId = requestAnimationFrame(updatePitch);
    }

    async function init() {
        try {
            audioContext = new AudioContext();
            microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(microphone);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            dataArray = new Float32Array(analyser.fftSize);
            dhwani = new Dhwani(audioContext.sampleRate, 0.15);

            createSwarDial();

            setTimeout(() => {
                isWarmingUp = false;
                console.log("Warm-up complete. Starting pitch detection.");
            }, warmUpDuration);

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