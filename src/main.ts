import "./style.css";
import "./components/piano-key/piano-key.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML =
    `<piano-key color="purple" ready="false"></piano-key>`;
