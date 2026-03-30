/**
 * Chromatic Tuner - Optimized pitch detection and note mapping.
 * Uses a refined YIN-like algorithm for stability.
 */

export class ChromaticTuner {
    constructor(config = {}) {
        this.sampleRate = config.sampleRate || 44100;
        this.threshold = config.threshold || 0.15;
        this.A4 = config.A4 || 440;
        this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    }

    /**
     * Pitch detection using Auto-Correlation + CMNDF (YIN-lite)
     */
    getPitch(buffer) {
        if (!buffer || buffer.length < 512) return null;

        const N = buffer.length;
        const halfN = Math.floor(N / 2);
        const difference = new Float32Array(halfN);

        // Step 1: Squared Difference Function (O(N^2) but limited to halfN)
        for (let tau = 0; tau < halfN; tau++) {
            for (let i = 0; i < halfN; i++) {
                const delta = buffer[i] - buffer[i + tau];
                difference[tau] += delta * delta;
            }
        }

        // Step 2: Cumulative Mean Normalized Difference Function
        const cmndf = new Float32Array(halfN);
        cmndf[0] = 1;
        let runningSum = 0;
        for (let tau = 1; tau < halfN; tau++) {
            runningSum += difference[tau];
            cmndf[tau] = difference[tau] / ((1 / tau) * runningSum);
        }

        // Step 3: Absolute Threshold / Peak Picking
        let tauEstimate = -1;
        for (let tau = 2; tau < halfN; tau++) {
            if (cmndf[tau] < this.threshold) {
                while (tau + 1 < halfN && cmndf[tau + 1] < cmndf[tau]) {
                    tau++;
                }
                tauEstimate = tau;
                break;
            }
        }

        // If no fundamental found below threshold, return null
        if (tauEstimate === -1) return null;

        // Step 4: Parabolic Interpolation for sub-sample accuracy
        const betterTau = this._parabolicInterpolation(cmndf, tauEstimate);
        return this.sampleRate / betterTau;
    }

    getNote(frequency) {
        if (!frequency || frequency < 20 || frequency > 4000) return null;
        
        const halfStepsFromA4 = 12 * Math.log2(frequency / this.A4);
        const roundHalfSteps = Math.round(halfStepsFromA4);
        const centsDiff = (halfStepsFromA4 - roundHalfSteps) * 100;
        
        // A4 is index 9 (A) in middle octave (4)
        const noteIndexRaw = (roundHalfSteps + 9) % 12;
        const noteIndex = noteIndexRaw < 0 ? noteIndexRaw + 12 : noteIndexRaw;
        const octave = Math.floor((roundHalfSteps + 9 + (4 * 12)) / 12);
        
        return {
            note: this.notes[noteIndex],
            octave: octave,
            cents: centsDiff,
            frequency: frequency
        };
    }

    _parabolicInterpolation(cmndf, tau) {
        if (tau < 1 || tau >= cmndf.length - 1) return tau;
        const s0 = cmndf[tau - 1];
        const s1 = cmndf[tau];
        const s2 = cmndf[tau + 1];
        
        const denominator = 2 * (2 * s1 - s2 - s0);
        if (denominator === 0) return tau;
        return tau + (s2 - s0) / denominator;
    }
}