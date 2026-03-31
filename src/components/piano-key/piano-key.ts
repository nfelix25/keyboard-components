import { myhtml } from "../../reactivity/binder";
import { createSignal } from "../../reactivity/reactivity";
import { BaseElement } from "../base";
import styles from "./piano-key.css?inline" assert { type: "css" };
import templateHTML from "./piano-key.html?raw" assert { type: "html" };

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const [pressed, setPressed] = createSignal(false);

const template = document.createElement("template");
template.innerHTML = templateHTML;

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const A4 = noteToFreq("A4"); // 440

class PianoKey extends BaseElement {
    static observedAttributes = ["ready"];

    attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null,
    ) {
        console.log({ name, oldValue, newValue });
    }

    #pressed = false;

    get template(): HTMLTemplateElement {
        return template;
    }

    protected connected() {
        this.shadowRoot!.adoptedStyleSheets = [sheet];

        this.shadowRoot?.appendChild(
            myhtml`<div>This is text. ${() => (pressed() ? "PLAYING" : "WAITING")}</div>`,
        );

        const key = this.shadowRoot?.querySelector<HTMLDivElement>(".key")!;

        key.addEventListener("pointerdown", () => this.#press());
        key.addEventListener("pointerenter", (e) => {
            this.setAttribute("ready", "true");
            if (e.buttons > 0) {
                this.#press();
            }
        });

        key.addEventListener("pointerup", () => this.#release());
        key.addEventListener("pointerleave", () => {
            this.setAttribute("ready", "false");
            this.#release();
        });
        key.addEventListener("pointercancel", () => this.#release());
    }

    #press() {
        this.#pressed = true;
        setPressed(true);
        this.setAttribute("pressed", "");
        this.dispatchEvent(
            new CustomEvent("note:start", {
                bubbles: true,
                detail: { note: this.getAttribute("note") },
            }),
        );
    }

    #release() {
        this.#pressed = false;
        setPressed(false);
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
