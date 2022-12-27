precision highp float;

attribute vec2 position;

varying vec2 vPos;

void main() {
    gl_Position = vec4(position, 0, 1);
    vPos = position * 0.5 + 0.5;
}
