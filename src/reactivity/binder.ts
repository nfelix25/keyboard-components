import { createEffect } from "./reactivity";

const HOLE_RE = /^__h(\d+)__$/;

function bindFragment(root: Node, values: unknown[]) {
    // --- Text holes ---
    // Collect first, then replace (avoid mutating whe making)
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    const comments: Comment[] = [];

    let node: Node | null;
    while ((node = walker.nextNode())) comments.push(node as Comment);

    for (const comment of comments) {
        const match = comment.nodeValue?.match(HOLE_RE);
        if (!match) continue;

        const value = values[+match[1]];
        const text = new Text();
        comment.replaceWith(text);

        if (typeof value === "function") {
            createEffect(() => {
                text.nodeValue = String((value as () => unknown)());
            });
        } else {
            text.nodeValue = String(value ?? "");
        }
    }

    // --- Attribute holes ---
    const elemWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    while ((node = elemWalker.nextNode())) {
        const el = node as Element;

        for (const attr of [...el.attributes]) {
            const match = attr.value.match(HOLE_RE);
            if (!match) continue;

            const value = values[+match[1]];
            const name = attr.name;
            el.removeAttribute(name);

            // Event handler: @click=${fn}
            if (name.startsWith("@")) {
                el.addEventListener(name.slice(1), value as EventListener);
                continue;
            }

            if (typeof value === "function") {
                createEffect(() => {
                    el.setAttribute(name, String((value as () => unknown)()));
                });
            } else {
                el.setAttribute(name, String(value ?? ""));
            }
        }
    }
}

export function myhtml(
    strings: TemplateStringsArray,
    ...values: unknown[]
): DocumentFragment {
    console.log({ strings, values });
    // 1. Build HTML with comment markers
    const markup = strings.reduce(
        (acc, str, i) =>
            acc + str + (i < values.length ? `<!--__h${i}__-->` : ""),
        "",
    );

    const template = document.createElement("template");
    template.innerHTML = markup;
    const fragment = template.content.cloneNode(true) as DocumentFragment;

    // 2. Bind values to the cloned fragment
    bindFragment(fragment, values);
    return fragment;
}
