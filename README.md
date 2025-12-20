# Dhwani

Dhwani is a vocal tuner designed specifically for Hindustani classical music. It helps singers practice and improve their intonation by providing real-time feedback on the swar (note) being sung. Dhwani is available as both a web application and a reusable JavaScript library.

## Features (Web App & Library)

*   **Real-time Pitch Detection:**  Analyzes audio input and identifies the closest Hindustani swar.
*   **Just Intonation:** Uses a just intonation tuning system based on common Hindustani classical frequencies (starting with Sa at 240 Hz).
*   **Multiple Octaves:**  Handles multiple octaves, including Mandra, Madhya, Taar, and Ati-Taar saptaks.
*   **Noise Reduction:** Includes basic noise reduction.

## Web App Features

*   **Swar Dial Display:**  A visually intuitive dial shows the current swar, with neighboring swaras fading out to the sides.
*   **Flat/Natural/Sharp Indicators:**  Indicates whether the sung note is flat (komal), natural (shuddh), or sharp (tivra) relative to the ideal swar frequency.
*   **Detailed Information:** Displays the octave, detected frequency (in Hz), and the difference in cents from the ideal swar frequency.
*   **Responsive Design:** Works well on desktops, tablets, and mobile devices.
*   **Lightweight and Fast:** Built with just HTML, CSS, and JavaScript.

## How to Use (Web App)

1.  Open [dhwani.mgks.dev](https://dhwani.mgks.dev) in a modern web browser (Chrome, Firefox, Edge, or Safari recommended).
2.  Grant the website permission to access your microphone.
3.  Begin singing a Hindustani swar.  The tuner will display the detected swar and provide visual feedback.
4.  Humming is suggested for better accuracy.

## Using the Dhwani Library

The `Dhwani` library provides a simple API for pitch detection.

### Installation

You can include `dhwani.js` directly in your HTML:

```html
<script type="module">
    import { Dhwani } from './dhwani.js'; // Adjust path if needed

    // Your code using the Dhwani library here
</script>
```

Or, you can use it within a module bundler (like Webpack, Rollup, or Parcel):

```bash
#  This project doesn't have a package.json, so direct npm install isn't applicable
#  You would typically use:  npm install <package-name>
#  But for this project, you just include the dhwani.js file directly.
```

### API

#### `Dhwani` Class

*   **`constructor(sampleRate: number, threshold?: number)`**
    *   Creates a new `Dhwani` instance.
    *   `sampleRate`: The sample rate of the audio context (e.g., `audioContext.sampleRate`).
    *   `threshold` (optional):  The threshold for pitch detection (between 0 and 1).  Lower values are more sensitive but may be more prone to noise.  Defaults to 0.1.  Adjust this for optimal performance.

*   **`getPitch(buffer: Float32Array): number | null`**
    *   Analyzes an audio buffer and returns the detected pitch in Hz.
    *   `buffer`: A `Float32Array` containing the audio data (e.g., from `AnalyserNode.getFloatTimeDomainData()`).
    *   Returns the frequency in Hz if a pitch is detected, or `null` if no pitch is detected.

### Example (Library Usage)

```javascript
import { Dhwani } from './dhwani.js'; // Adjust path if necessary

async function startPitchDetection() {
    try {
        const audioContext = new AudioContext();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const buffer = new Float32Array(analyser.fftSize);

        const dhwani = new Dhwani(audioContext.sampleRate, 0.15); // Adjust threshold

        function updatePitch() {
            analyser.getFloatTimeDomainData(buffer);
            const frequency = dhwani.getPitch(buffer);

            if (frequency) {
                console.log("Detected Frequency:", frequency.toFixed(2), "Hz");
            } else {
                console.log("No pitch detected");
            }

            requestAnimationFrame(updatePitch);
        }

        updatePitch();

    } catch (error) {
        console.error("Error:", error);
    }
}

startPitchDetection();

```

## Technology

Dhwani is built using:

*   **HTML:**  For the structure of the web page (web app).
*   **CSS:**  For styling and visual presentation (web app).
*   **JavaScript:**  For real-time audio processing, pitch detection, and user interface updates (web app and library).
*   **Web Audio API:**  For accessing the microphone and analyzing audio.

## Development

The project is completely free and open-source.

Contributions, bug reports, and feature requests are welcome!

## License

MIT

> **{ github.com/mgks }**
> 
> ![Website Badge](https://img.shields.io/badge/Visit-mgks.dev-blue?style=flat&link=https%3A%2F%2Fmgks.dev) ![Sponsor Badge](https://img.shields.io/badge/%20%20Become%20a%20Sponsor%20%20-red?style=flat&logo=github&link=https%3A%2F%2Fgithub.com%2Fsponsors%2Fmgks)