# dhwani

Zero-dependency Hindustani Classical pitch detection and swar mapping library.

## Features

- **Hindustani Swar Mapping**: Maps frequencies to the 12 swars (Sa, re, Re, ga, Ga, Ma, Ma#, Pa, dha, Dha, ni, Ni).
- **YIN Algorithm**: Robust and stable pitch detection for vocal and acoustic signals.
- **Just Intonation**: Based on traditional Indian musical tuning (Sa = 240Hz by default).
- **Cents Calculation**: Provides precision tuning information relative to the ideal swar frequency.
- **Multiple Octaves**: Supports swar detection across 4 octaves.

## Installation

```bash
npm install dhwani
```

## Usage

```javascript
import { Dhwani } from 'dhwani';

const dhwani = new Dhwani({
  sampleRate: 44100, // default
  threshold: 0.10    // sensitivity (lower = stricter)
});

// Detect pitch from an audio buffer (Float32Array)
const frequency = dhwani.getPitch(audioBuffer);

if (frequency) {
  // Get swar information
  const noteInfo = dhwani.getNote(frequency);
  console.log(`Swar: ${noteInfo.swar}`);
  console.log(`Octave: ${noteInfo.octave}`);
  console.log(`Cents Offset: ${noteInfo.cents}`);
}
```

## License

MIT