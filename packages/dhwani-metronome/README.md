# dhwani-metronome

High-precision timing and tick scheduling for Web Audio applications.

## Features

- **Precision Scheduling**: Uses a look-ahead scheduler for rock-solid timing regardless of JS event loop lag.
- **Adjustable BPM**: Effortlessly change tempo in real-time.
- **Callback Driven**: Simple interface to trigger audio samples or visual updates exactly on the beat.

## Installation

```bash
npm install dhwani-metronome
```

## Usage

```javascript
import { Metronome } from 'dhwani-metronome';

const audioContext = new AudioContext();

const metronome = new Metronome((time) => {
  // Use 'time' to schedule sound in Web Audio API
  const osc = audioContext.createOscillator();
  osc.connect(audioContext.destination);
  osc.start(time);
  osc.stop(time + 0.1);
});

metronome.bpm = 120;
metronome.start(audioContext);
```

## License

MIT
