# Voxcartes

## Resources / Libraries
 - [REGL](http://regl.party/)
 - [REGL Examples](https://regl-project.github.io/regl/www/gallery.html)


## ShaderFragments
```
<FragmentName>
    - begin (before main())
    - main (in main())
    - end (at end of file)
    - <name> (direct replacement)
```

For example


```glsl
// shader.vert

// #include<Screenspace>

#ifdef GL_ES
precision highp float;
#endif

attribute vec2 position;

void main() {
    gl_Position = vec4(position, 0, 1);
}
```

```glsl
// Screenspace/begin.vert
varying vec2 vPos;
```

```glsl
// Screenspace/main.vert
vPos = position * 0.5 + 0.5;
```

becomes

```glsl
// shader.vert

varying vec2 vPos;

precision highp float;

attribute vec2 position;

void main() {
    vPos = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}
```