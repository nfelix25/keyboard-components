import "./style.css";
import "./components/piano-key/piano-key.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML =
    `<piano-key></piano-key>`;
