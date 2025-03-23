# Dhwani

Dhwani is a web-based vocal tuner designed specifically for Hindustani classical music. It helps singers practice and improve their intonation by providing real-time feedback on the swar (note) being sung.

## Features

*   **Real-time Pitch Detection:**  Analyzes audio input from your microphone and identifies the closest Hindustani swar.
*   **Swar Dial Display:**  A visually intuitive dial shows the current swar, with neighboring swaras fading out to the sides.
*   **Flat/Natural/Sharp Indicators:**  Indicates whether the sung note is flat (komal), natural (shuddh), or sharp (tivra) relative to the ideal swar frequency.
*   **Detailed Information:** Displays the octave, detected frequency (in Hz), and the difference in cents from the ideal swar frequency.
*   **Just Intonation:** Uses a just intonation tuning system based on common Hindustani classical frequencies (starting with Sa at 240 Hz).
*   **Multiple Octaves:**  Handles multiple octaves, including Mandra, Madhya, Taar, and Ati-Taar saptaks.
*   **Noise Reduction:** Includes basic noise reduction filters to improve accuracy in less-than-ideal recording environments.
*   **Responsive Design:** Works well on desktops, tablets, and mobile devices.
*  **Lightweight and Fast**: Built with just HTML, CSS, and JavaScript.

## How to Use

1.  Open [dhwani.mgks.dev](https://dhwani.mgks.dev) in a modern web browser (Chrome, Firefox, Edge, or Safari recommended).
2.  Grant the website permission to access your microphone.
3.  Begin singing a Hindustani swar.  The tuner will display the detected swar and provide visual feedback.
4.  Humming is suggested for better accuracy.

## Technology

Dhwani is built using:

*   **HTML:**  For the structure of the web page.
*   **CSS:**  For styling and visual presentation.
*   **JavaScript:**  For real-time audio processing, pitch detection, and user interface updates.
*   **Web Audio API:**  For accessing the microphone and analyzing audio.

## Development

The project is completely free and open-source.

Contributions, bug reports, and feature requests are welcome!

## Future Improvements

*   **Shruti Detection:**  Implementing finer-grained pitch detection to identify shrutis (microtones) within each swar.
*   **That Selection:**  Allowing the user to select the specific That (melodic framework) they are singing in.
*   **Tuning Customization:**  Providing options for the user to adjust the base frequency of Sa and the tuning system.
*   **Recording and Playback:**  Adding the ability to record and play back vocals.
*   **Improved Pitch Detection:**  Exploring more advanced pitch detection algorithms (e.g., YIN) for better accuracy with spoken vowels.

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

## Support the Project

**[GitHub Sponsors](https://github.com/sponsors/mgks):** Support this project and my other work by becoming a GitHub sponsor, it means a lot :)

**[Follow Me](https://github.com/mgks) on GitHub** | **Add Project to Watchlist** | **Star the Project**

<br /><img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="Built with Love">