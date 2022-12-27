precision highp float;

uniform sampler2D source;

varying vec2 vPos;

void main(){
    vec4 src=texture2D(source,vPos);
    vec3 color=src.rgb/max(src.a,1.);
    color=pow(color,vec3(1./2.2));
    gl_FragColor=vec4(color,1);
}
