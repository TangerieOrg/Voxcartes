import InputManager from "@VoxelLib/InputManager/InputManager";
import ConsoleStyles from "./console.module.css";
import minimist, { ParsedArgs } from "minimist";
import EventEmitter from "@VoxelLib/Utility/EventEmitter";
const ACTIVE_KEY = "`";

const ELS = {
    container: document.body.appendChild(document.createElement("div")),
    input: document.createElement("input"),
    text: document.createElement("ul")
}

ELS.container.appendChild(ELS.text);
ELS.container.appendChild(ELS.input);

export interface Command {
    cmd : string;
    desc : string;
    exec: (args : minimist.ParsedArgs) => string[] | string | void;
}

const DebugConsole = new (class DebugConsole {
    private active = false;
    private commands : Record<string, Command> = {};

    constructor() {
        ELS.container.classList.add(ConsoleStyles.container);
        ELS.container.hidden = true;
        InputManager.emitter.on("keydown", ev => {
            if(ev === ACTIVE_KEY) this.setActive(true);
        });

        window.addEventListener("keydown", ev => {
            if(!this.active || ev.defaultPrevented) return;
            if(ev.key.toLowerCase() === ACTIVE_KEY) {
                ev.preventDefault()
                this.setActive(false);
            }
        });

        ELS.input.addEventListener("keydown", ev => {
            if(ev.key === "Enter") {
                const cmdString = ELS.input.value;
                console.log("[COMMAND]", cmdString);
                logLevel("cmd", cmdString);
                ELS.input.value = "";
                this.parseCommand(cmdString);
            }
        });
    }

    setActive(active = !this.active) {
        if(this.active === active) return;
        this.active = active;
        ELS.container.hidden = !active;
        InputManager.active = !active;
        if(active) ELS.input.focus();
    }

    public register(cmd : Command) {
        this.commands[cmd.cmd] = cmd;
    }

    log = (...args : any[]) => logLevel("log", ...args);
    warn = (...args : any[]) => logLevel("warn", ...args);
    error = (...args : any[]) => logLevel("error", ...args);

    private parseCommand(cmdString : string) {
        const [cmd, ...argList] = cmdString.split(" ");
        const args = minimist(argList);
        if(this.commands[cmd]) {
            this.executeCommand(cmd, args);
        } else {
            this.error(`No command "${cmd}" exists`)
        }
    }

    private executeCommand(cmd : string, args : minimist.ParsedArgs) {
        const txt = this.commands[cmd].exec(args);
        let text : string[];
        if(!txt) return;
        else if(typeof txt === "string") text = [txt];
        else text = txt;
        this.log(...text);
    }
})();

DebugConsole.register({
    cmd: "help",
    desc: "This command",
    exec: (args) => {
        return "Help: "
    }
})

export default DebugConsole;

function stringify(arg : any) {
    if(typeof arg === "string") return arg;
    else if (typeof arg === "number") return arg.toFixed(2);
    else return JSON.stringify(arg);
}

function logLevel(level : string, ...args : any[]) {
    const str = args.map(x => stringify(x)).join(", ");
    console.log(`[${level.toUpperCase()}]`, str);
    const el = ELS.text.appendChild(document.createElement("li"));
    el.innerText = str;
    el.classList.add(ConsoleStyles["debug-" + level])
    el.scroll()
    return el;
}