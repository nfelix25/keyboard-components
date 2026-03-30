import { BaseElement } from "../base";
import styles from "./piano-key.css?inline";
import templateHTML from "./piano-key.html?raw";

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const template = document.createElement("template");
template.innerHTML = templateHTML;

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const A4 = noteToFreq("A4"); // 440

class PianoKey extends BaseElement {
    #pressed = false;

    get template(): HTMLTemplateElement {
        return template;
    }

    protected connected() {
        this.shadowRoot?.adoptedStyleSheets.push(sheet);

        const key = this.shadowRoot?.querySelector<HTMLDivElement>(".key")!;

        key.addEventListener("pointerdown", () => this.#press());
        key.addEventListener("pointerenter", (e) => {
            if (e.buttons > 0) {
                this.#press();
            }
        });

        key.addEventListener("pointerup", () => this.#release());
        key.addEventListener("pointerleave", () => this.#release());
        key.addEventListener("pointercancel", () => this.#release());
    }

    #press() {
        this.#pressed = true;
        this.setAttribute("pressed", "");
        this.dispatchEvent(
            new CustomEvent("note:start", {
                bubbles: true,
                detail: { note: this.getAttribute("note") },
            }),
        );

        playNote(A4);
    }

    #release() {
        this.#pressed = false;
        this.removeAttribute("pressed");
        this.dispatchEvent(
            new CustomEvent("note:stop", {
                bubbles: false,
                detail: { note: this.getAttribute("note") },
            }),
        );
    }
}

customElements.define("piano-key", PianoKey);

const ctx = new AudioContext();

function playNote(frequency: number): () => void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.value = frequency;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.01); // attack
    gain.gain.linearRampToValueAtTime(0.5, now + 0.1); // decay → sustain

    osc.start(now);

    return () => {
        const released = ctx.currentTime;
        gain.gain.cancelScheduledValues(released);
        gain.gain.setValueAtTime(gain.gain.value, released);
        gain.gain.linearRampToValueAtTime(0, released + 0.3); // release
        osc.stop(released + 0.3);
    };
}

function noteToFreq(note: string): number {
    const name = note.slice(0, -1); // "C#"
    const octave = parseInt(note.slice(-1)); // 4
    const midi = (octave + 1) * 12 + NOTES.indexOf(name);
    return 440 * Math.pow(2, (midi - 69) / 12);
}
