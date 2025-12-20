/**
 * Dhwani - Hindustani Classical Vocal Tuner Library
 * @author Ghazi Khan <mgks@mgks.dev>
 * @license MIT
 */

export class Dhwani {
    /**
     * Create a new Dhwani instance.
     * @param {Object} config - Configuration object.
     * @param {number} [config.sampleRate=44100] - The sample rate of the audio context.
     * @param {number} [config.threshold=0.10] - Sensitivity threshold for the YIN algorithm (lower is stricter).
     */
    constructor(config = {}) {
        this.sampleRate = config.sampleRate || 44100;
        this.threshold = config.threshold || 0.10;

        // Base Frequencies for Middle Octave (Octave 0)
        // Based on Just Intonation relative to Sa = 240Hz
        this.baseFrequencies = {
            "Sa": 240,
            "re": 256,
            "Re": 270,
            "ga": 288,
            "Ga": 300,
            "Ma": 320,
            "Ma#": 337.5,
            "Pa": 360,
            "dha": 384,
            "Dha": 400,
            "ni": 450,
            "Ni": 480
        };

        this.swarOrder = ["Sa", "re", "Re", "ga", "Ga", "Ma", "Ma#", "Pa", "dha", "Dha", "ni", "Ni"];
        
        // Pre-calculate frequencies for valid octaves to save CPU during detection
        this.octaves = [-1, 0, 1, 2];
        this.swarMap = this._generateSwarMap();
    }

    /**
     * Detects the pitch of an audio buffer using the YIN algorithm.
     * @param {Float32Array} buffer - The audio buffer (time domain data).
     * @returns {number|null} The detected frequency in Hz, or null if no pitch is found.
     */
    getPitch(buffer) {
        if (!buffer || buffer.length === 0) return null;

        const bufferSize = buffer.length;
        
        // Step 1: Difference Function
        const difference = new Float32Array(bufferSize);
        for (let tau = 0; tau < bufferSize; tau++) {
            for (let i = 0; i < bufferSize - tau; i++) {
                const delta = buffer[i] - buffer[i + tau];
                difference[tau] += delta * delta;
            }
        }

        // Step 2: Cumulative Mean Normalized Difference Function
        const cmndf = new Float32Array(bufferSize);
        cmndf[0] = 1;
        let runningSum = 0;
        for (let tau = 1; tau < bufferSize; tau++) {
            runningSum += difference[tau];
            cmndf[tau] = difference[tau] / ((1 / tau) * runningSum);
        }

        // Step 3: Absolute Threshold
        let tauEstimate = -1;
        for (let tau = 2; tau < bufferSize; tau++) {
            if (cmndf[tau] < this.threshold) {
                while (tau + 1 < bufferSize && cmndf[tau + 1] < cmndf[tau]) {
                    tau++;
                }
                tauEstimate = tau;
                break;
            }
        }

        if (tauEstimate === -1) return null;

        // Step 4: Parabolic Interpolation (Refining the estimate)
        const betterTau = this._parabolicInterpolation(cmndf, tauEstimate);
        
        return this.sampleRate / betterTau;
    }

    /**
     * Finds the closest Hindustani Swar for a given frequency.
     * @param {number} frequency - The detected frequency in Hz.
     * @returns {Object|null} Information about the note (swar, octave, cents, idealFrequency).
     */
    getNote(frequency) {
        if (!frequency || frequency <= 0) return null;

        let closestSwar = null;
        let closestOctave = null;
        let minCentsDiff = Infinity;
        let idealFreq = 0;

        // Iterate through pre-calculated map to find the closest match
        for (const oct of this.octaves) {
            for (const swar of this.swarOrder) {
                const targetFreq = this.swarMap[oct][swar];
                
                // Optimization: If target is too far, skip heavy math
                if (Math.abs(targetFreq - frequency) > 50) continue; 

                const centsDiff = this.getCentsDifference(frequency, targetFreq);

                if (Math.abs(centsDiff) < Math.abs(minCentsDiff)) {
                    minCentsDiff = centsDiff;
                    closestSwar = swar;
                    closestOctave = oct;
                    idealFreq = targetFreq;
                }
            }
        }

        // Safety check: if the note is wildly out of range (more than 1 semitone/100 cents), ignore it
        if (Math.abs(minCentsDiff) > 100) return null;

        return {
            swar: closestSwar,
            octave: closestOctave,
            cents: minCentsDiff,
            frequency: idealFreq
        };
    }

    /**
     * Calculates the difference in cents between two frequencies.
     * @param {number} f1 - Detected frequency.
     * @param {number} f2 - Reference (Ideal) frequency.
     * @returns {number} Difference in cents.
     */
    getCentsDifference(f1, f2) {
        return 1200 * Math.log2(f1 / f2);
    }

    // --- Private Helpers ---

    _generateSwarMap() {
        const map = {};
        for (const octave of this.octaves) {
            map[octave] = {};
            for (const swar in this.baseFrequencies) {
                map[octave][swar] = this.baseFrequencies[swar] * Math.pow(2, octave);
            }
        }
        return map;
    }

    _parabolicInterpolation(cmndf, tau) {
        let betterTau;
        const x0 = tau < 1 ? tau : tau - 1;
        const x2 = tau + 1 < cmndf.length ? tau + 1 : tau;

        if (x0 === tau) {
            betterTau = (cmndf[tau] <= cmndf[x2]) ? tau : x2;
        } else if (x2 === tau) {
            betterTau = (cmndf[tau] <= cmndf[x0]) ? tau : x0;
        } else {
            const s0 = cmndf[x0];
            const s1 = cmndf[tau];
            const s2 = cmndf[x2];
            betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        }
        return betterTau;
    }
}