// dhwani.js (Added threshold adjustment)
class Dhwani {
    constructor(sampleRate, threshold = 0.1) { // Default threshold, but now adjustable
        this.sampleRate = sampleRate;
        this.threshold = threshold;
    }

    getPitch(buffer) {
        const difference = this.differenceFunction(buffer);
        const cmndf = this.cumulativeMeanNormalizedDifferenceFunction(difference);
        const period = this.absoluteThreshold(cmndf);

        if (period === null) {
            return null;
        }
        const betterPeriod = this.parabolicInterpolation(cmndf, period);
        return this.sampleRate / betterPeriod;
    }

    differenceFunction(buffer) {
        const bufferSize = buffer.length;
        const difference = new Float32Array(bufferSize);
        for (let tau = 0; tau < bufferSize; tau++) {
            for (let i = 0; i < bufferSize - tau; i++) {
                const delta = buffer[i] - buffer[i + tau];
                difference[tau] += delta * delta;
            }
        }
        return difference;
    }

    cumulativeMeanNormalizedDifferenceFunction(difference) {
        const bufferSize = difference.length;
        const cmndf = new Float32Array(bufferSize);
        cmndf[0] = 1;
        let runningSum = 0;
        for (let tau = 1; tau < bufferSize; tau++) {
            runningSum += difference[tau];
            cmndf[tau] = difference[tau] / ((1 / tau) * runningSum);
        }
        return cmndf;
    }

    absoluteThreshold(cmndf) {
        for (let tau = 2; tau < cmndf.length; tau++) {
            if (cmndf[tau] < this.threshold) {
                while (tau + 1 < cmndf.length && cmndf[tau + 1] < cmndf[tau]) {
                    tau++;
                }
                return tau;
            }
        }
        return null;
    }

    parabolicInterpolation(cmndf, tau) {
        let betterTau;
        let x0, x2;
        if (tau < 1) {
            x0 = tau;
        } else {
            x0 = tau - 1;
        }
        if (tau + 1 > cmndf.length - 1) {
            x2 = tau;
        } else {
            x2 = tau + 1;
        }
        if (x0 === tau) {
            if (cmndf[tau] <= cmndf[x2]) {
                betterTau = tau;
            } else {
                betterTau = x2;
            }
        } else if (x2 === tau) {
            if (cmndf[tau] <= cmndf[x0]) {
                betterTau = tau;
            } else {
                betterTau = x0;
            }
        } else {
            let s0 = cmndf[x0];
            let s1 = cmndf[tau];
            let s2 = cmndf[x2];
            betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        }
        return betterTau;
    }
}

export { Dhwani };