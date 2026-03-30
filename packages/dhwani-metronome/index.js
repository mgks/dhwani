/**
 * Metronome - Precision timing and scheduling.
 * @author Ghazi Khan
 * @license MIT
 */

export class Metronome {
    constructor(callback) {
        this.bpm = 120;
        this.isPlaying = false;
        this.callback = callback;
        this.timer = null;
        this.nextTickTime = 0;
    }

    start(audioContext) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.nextTickTime = audioContext.currentTime;
        this._scheduler(audioContext);
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this.timer);
    }

    _scheduler(audioContext) {
        while (this.nextTickTime < audioContext.currentTime + 0.1) {
            this.callback(this.nextTickTime);
            this.nextTickTime += 60.0 / this.bpm;
        }
        if (this.isPlaying) {
            this.timer = setTimeout(() => this._scheduler(audioContext), 25);
        }
    }
}