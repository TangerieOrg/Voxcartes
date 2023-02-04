import DebugConsole from "@VoxelLib/Debug/DebugConsole";
import SceneManager from "@VoxelLib/Scene/SceneManager";
import PostProcessingShaders from "@VoxelLib/assets/Shaders/PostProcessing";

const ls = () => SceneManager.currentScene?.renderer.postProcessing.getPasses().map(x => x.name).join("\n");
const rm = (name : string) => {
    SceneManager.currentScene?.renderer.postProcessing.removeByName(name);
    return `Removed ${name}`;
}
const getAllKeys = (data : object, prefix : string = "") : string[] => {
    const keys : string[] = [];
    for(const [key, value] of Object.entries(data)) {
        const k = Object.keys(value);
        if(typeof value === "object" && !(k.includes("Vertex") || k.includes("Fragment"))) {
            keys.push(...getAllKeys(value, prefix + key + "."))
        } else {
            keys.push(prefix + key)
        }
    }

    return keys;
}
const la = () => {
    return getAllKeys(PostProcessingShaders).join("\n");
}

const add = (name : string) => {
    SceneManager.currentScene?.renderer.postProcessing.addByName(name);
}

export default function registerPP() {
    const cmdMap : any = {
        ls,
        rm,
        la,
        add
    }
    DebugConsole.register({
        cmd: "pp",
        desc: "PostProcessing controls",
        exec: (args) => {
            const [sub, ...extra] = args._;
            if(!sub || !cmdMap[sub]) return;

            return cmdMap[sub](...extra);
        }
    })
}

