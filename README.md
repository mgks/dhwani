# Dhwani

<p align="left">
  <a href="https://www.npmjs.com/package/dhwani"><img src="https://img.shields.io/npm/v/dhwani.svg?style=flat-square&color=007acc" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/dhwani"><img src="https://img.shields.io/npm/dt/dhwani.svg?style=flat-square&color=success" alt="npm downloads"></a>
  <a href="https://github.com/mgks/dhwani/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mgks/dhwani.svg?style=flat-square&color=blue" alt="license"></a>
  <a href="https://github.com/mgks/dhwani/stargazers"><img src="https://img.shields.io/github/stars/mgks/dhwani?style=flat-square&logo=github" alt="stars"></a>
</p>

**Dhwani** is a precision vocal tuner engine designed specifically for **Hindustani Classical Music**. Unlike standard tuners that use Equal Temperament (12-TET), Dhwani uses **Just Intonation** relative to a base Sa, making it accurate for Indian Classical frequencies.

It functions as both a standalone **Web Application** and a lightweight, dependency-free **Node.js Library**.

## 🎵 For Musicians: The Web App

Dhwani is available as a free, responsive web application. It features a noise-resistant detection algorithm, a "visual tape" interface, and dark mode support.

👉 **Launch Tuner: [dhwani.mgks.dev](https://dhwani.mgks.dev)**

### Features
*   **Real-time Swar Detection:** Identifies the closest Hindustani note (Sa, re, Re, ga, Ga...).
*   **Just Intonation:** Tuned to the harmonic series (e.g., Pa is exactly 1.5x Sa), not the compromised piano tuning.
*   **Visual Feedback:** A sliding dial shows exactly how many "cents" (microtones) you are sharp or flat.
*   **Offline Capable:** Install it as a PWA (Progressive Web App) on your phone or desktop to use without internet.

## 👨‍💻 For Developers: The NPM Package

You can use the core pitch detection logic of Dhwani in your own music education apps, games, or research tools. The library is "headless" (no UI), zero-dependency, and lightweight.

### Installation

```bash
npm install dhwani
```

### Usage

The library provides a straightforward API to detect pitch from raw audio buffers and map frequencies to Hindustani notes.

```javascript
import { Dhwani } from 'dhwani';

// 1. Initialize
const tuner = new Dhwani({
    sampleRate: 44100, // Audio Context Sample Rate
    threshold: 0.1     // YIN Algorithm sensitivity (lower is stricter)
});

// 2. Detect Pitch (Raw Hz)
// 'buffer' should be a Float32Array from AnalyserNode.getFloatTimeDomainData()
const frequency = tuner.getPitch(buffer); 

if (frequency) {
    console.log(`Detected: ${frequency.toFixed(2)} Hz`);

    // 3. Map to Hindustani Swar
    const note = tuner.getNote(frequency);
    
    if (note) {
        console.log(`Swar: ${note.swar} (Octave ${note.octave})`);
        console.log(`Deviation: ${note.cents.toFixed(0)} cents`);
    }
}
```

### API Reference

#### `new Dhwani(config)`
*   `config.sampleRate` (number): The sample rate of your audio source (usually 44100 or 48000).
*   `config.threshold` (number, optional): YIN algorithm threshold (0.05 - 0.2). Defaults to `0.1`.

#### `getPitch(buffer)`
*   Analyzes a `Float32Array` (time domain data).
*   Returns: `number` (Frequency in Hz) or `null` (if silence/noise).

#### `getNote(frequency)`
*   Maps a frequency to the closest Just Intonation Swar.
*   Returns an object:
    ```javascript
    {
      "swar": "Pa",
      "octave": 0,
      "cents": -4.2,       // Deviation from the perfect harmonic frequency
      "frequency": 360     // The ideal frequency of this Swar
    }
    ```

## 🛠️ Development (Monorepo)

This repository is a monorepo containing both the core logic and the web interface.

### Directory Structure
*   `packages/core`: The NPM package source code (Math & Logic).
*   `packages/web`: The Vite-based Web Application (UI).

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mgks/dhwani.git
    cd dhwani
    ```

2.  **Install dependencies (Root):**
    ```bash
    npm install
    ```

3.  **Run the Web App:**
    This starts the Vite development server and links the local core package automatically.
    ```bash
    npm run dev
    ```

4.  **Build for Production:**
    ```bash
    npm run build
    ```

## 🧮 Tuning System

Dhwani uses a **Just Intonation** scale centered around **Sa = 240Hz** (approx B3, common for male vocals) for relative calculation.

| Swar | Ratio relative to Sa | Ideal Freq (Example) |
| :--- | :--- | :--- |
| **Sa** | 1/1 | 240 Hz |
| **re** (Komal) | 16/15 | 256 Hz |
| **Re** (Shuddh) | 9/8 | 270 Hz |
| **ga** (Komal) | 6/5 | 288 Hz |
| **Ga** (Shuddh) | 5/4 | 300 Hz |
| **Ma** (Shuddh) | 4/3 | 320 Hz |
| **Ma#** (Tivra) | 45/32 | 337.5 Hz |
| **Pa** | 3/2 | 360 Hz |
| **dha** (Komal) | 8/5 | 384 Hz |
| **Dha** (Shuddh) | 5/3 | 400 Hz |
| **ni** (Komal) | 9/5 | 450 Hz |
| **Ni** (Shuddh) | 15/8 | 480 Hz |

## License

MIT

> **{ github.com/mgks }**
> 
> ![Website Badge](https://img.shields.io/badge/Visit-mgks.dev-blue?style=flat&link=https%3A%2F%2Fmgks.dev) ![Sponsor Badge](https://img.shields.io/badge/%20%20Become%20a%20Sponsor%20%20-red?style=flat&logo=github&link=https%3A%2F%2Fgithub.com%2Fsponsors%2Fmgks)