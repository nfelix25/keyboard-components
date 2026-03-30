export abstract class BaseElement extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: "open" });
        this.shadowRoot?.appendChild(this.template.content.cloneNode(true));
        this.connected();
    }

    disconnectedCallback() {
        this.disconnected();
    }

    abstract get template(): HTMLTemplateElement;
    protected connected(): void {}
    protected disconnected(): void {}
}

export const html = String.raw;
export const css = String.raw;
