interface Observer {
    execute: () => void;
    dependencies: Set<Set<Observer>>;
}

let context: Observer[] = [];

function cleanup(observer: Observer) {
    for (const dep of observer.dependencies) {
        dep.delete(observer);
    }
    observer.dependencies.clear();
}

function subscribe(observer: Observer, subscriptions: Set<Observer>) {
    subscriptions.add(observer);
    observer.dependencies.add(subscriptions);
}

export function untrack<T>(fn: () => T) {
    const prevContext = context;
    context = [];
    const result = fn();
    context = prevContext;
    return result;
}

export function createSignal<T>(value: T) {
    const subscriptions = new Set<Observer>();

    const read: () => T = () => {
        const observer = context[context.length - 1];
        if (observer) {
            subscribe(observer, subscriptions);
        }

        return value;
    };

    const write: (nv: T) => void = (newValue: T) => {
        if (value !== newValue) {
            value = newValue;
            for (const observer of [...subscriptions]) {
                observer.execute();
            }
        }
    };

    return [read, write] as const;
}

export function createEffect(fn: () => void) {
    const effect = {
        execute() {
            cleanup(effect);
            context.push(effect);
            fn();
            context.pop();
        },
        dependencies: new Set<Set<Observer>>(),
    };

    effect.execute();
}

export function createMemo<T>(fn: () => T) {
    const [signal, setSignal] = createSignal<T>(fn());
    createEffect(() => setSignal(fn()));
    return signal;
}
