class _InputManager {
    private activeKeys : Set<string> = new Set();

    constructor() {
        window.addEventListener("keydown", ev => {
            if (ev.defaultPrevented) return;
            ev.preventDefault()
            this.activeKeys.add(ev.key.toLowerCase());
        });

        window.addEventListener("keyup", ev => {
            if (ev.defaultPrevented) return;
            ev.preventDefault()
            this.activeKeys.delete(ev.key.toLowerCase());
        });
    }

    isKeyDown(key : string) { return this.activeKeys.has(key.toLowerCase()) };
}

const InputManager = new _InputManager();

export default InputManager;