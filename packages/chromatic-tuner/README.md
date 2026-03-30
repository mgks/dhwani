# chromatic-tuner

Universal chromatic pitch detection and note mapping with sub-sample accuracy.

## Features

- **Optimal Pitch Detection**: Uses a refined YIN-lite algorithm for high stability and low latency.
- **Standard Western Notation**: Maps frequencies to the 12-note chromatic scale (C, C#, D, etc.).
- **Sub-sample Accuracy**: Employs parabolic interpolation to provide precision frequency estimates.
- **Configurable Reference**: Default tuning is A4 = 440Hz, but fully configurable.

## Installation

```bash
npm install chromatic-tuner
```

## Usage

```javascript
import { ChromaticTuner } from 'chromatic-tuner';

const tuner = new ChromaticTuner({
  A4: 440,      // Reference pitch
  threshold: 0.15 // Peak-picking sensitivity
});

const frequency = tuner.getPitch(audioBuffer);

if (frequency) {
  const noteInfo = tuner.getNote(frequency);
  console.log(`Note: ${noteInfo.note}${noteInfo.octave}`);
  console.log(`Cents: ${noteInfo.cents.toFixed(2)}`);
}
```

## License

MIT