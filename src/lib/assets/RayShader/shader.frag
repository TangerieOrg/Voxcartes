#ifdef GL_ES
precision highp float;
#endif

varying vec2 vPos;

void main() {
    gl_FragColor = vec4(vPos, 0, 1);
}