class _InputManager {
    private activeKeys : Set<string> = new Set();

    constructor() {
        window.addEventListener("keydown", ev => {
            if (ev.defaultPrevented) return;
            ev.preventDefault()
            this.activeKeys.add(ev.key);
        });

        window.addEventListener("keyup", ev => {
            if (ev.defaultPrevented) return;
            ev.preventDefault()
            this.activeKeys.delete(ev.key);
        });
    }

    isKeyDown(key : string) { return this.activeKeys.has(key) };
}

const InputManager = new _InputManager();

export default InputManager;