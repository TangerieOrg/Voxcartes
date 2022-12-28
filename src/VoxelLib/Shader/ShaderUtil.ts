import { ShaderInitType } from "./Shader";
import ShaderVertexFiles from "./ShaderFragments/**/*.vert";
import ShaderFragmentFiles from "./ShaderFragments/**/*.frag";

const INCLUDE_REGEX = /^\/\/ #include<([^>]+)>/gm;
const GL_ES_REGEX = /^precision.*$/gm;
const MAIN_REGEX = /void main.*$/gm;

export type ShaderIncludeType = "frag" | "vert";

export type ShaderIncludeFiles = {
    begin? : string;
    main? : string;
    end?: string;
} & Record<string, string>;

export function createShader(fragment : string, vertex : string) : ShaderInitType {
    const Fragment = replaceShaderIncludes(fragment, "frag");
    const Vertex = replaceShaderIncludes(vertex, "vert");

    return {
        source: { Fragment, Vertex }
    }
}

export function getIncludesInShader(shader : string) : string[] {
    const includes : string[] = []

    let curMatch : RegExpExecArray | null;

    while((curMatch = INCLUDE_REGEX.exec(shader)) !== null) includes.push(curMatch[1]);

    return includes;
}

export function replaceShaderIncludes(shader : string, type : ShaderIncludeType) : string {
    let output : string;
    output = shader;
    
    const includes = getIncludesInShader(shader).reverse();

    for(const inc of includes) {
        output = applyShaderInclude(output, type, inc);
    }

    return output;
}



// TODO => Direct replacements
function applyShaderInclude(shader : string, type : ShaderIncludeType, name : string) : string {
    const files = getIncludeFiles(name, type);
    if(!files) {
        console.warn(`Includes for "${name}" do not exist`);
        return shader;
    }

    if(files.begin) {
        let start_index : number;
        const glmatch = GL_ES_REGEX.exec(shader);
        if(!glmatch) {
            start_index = 0;
        } else {
            console.warn("Shader begin is untested");
            start_index = GL_ES_REGEX.lastIndex + glmatch[0].length;
        }

        shader = shader.substring(0, start_index) + "\n" + files.begin + "\n" + shader.substring(start_index);
    }

    if(files.end) {
        shader = shader + "\n" + files.end + "\n";
    }

    if(files.main) {
        shader = shader.replace(MAIN_REGEX,`void main() {\n\t${files.main}\n`);   
    }

    return shader;
}

function cleanInclude(shader : string) {
    return shader.replace("#define GLSLIFY 1\n", "");
}

export function getIncludeFiles(name : string, type : ShaderIncludeType) : ShaderIncludeFiles | null {
    const includeSource = type === "frag" ? ShaderFragmentFiles : ShaderVertexFiles;
    const files = includeSource[name];
    if(!files) return null;

    for(const key in files) {
        files[key] = `\n//=== START ${name} [${key}] ===\n${cleanInclude(files[key])}\n//=== END ${name} [${key}] ===\n`;
    }

    return files;
}