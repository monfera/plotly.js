module.exports = `

precision lowp float;

attribute vec4 p0, p1, p2, p3,
    p4, p5, p6, p7,
    p8, p9, pa, pb;

attribute float colorIndex;

attribute float x,
    depth;

uniform mat4 var1A, var2A, var1B, var2B, var1C, var2C,
    loA, hiA, loB, hiB, loC, hiC;

uniform vec2 resolution,
    viewBoxPosition,
    viewBoxSize;

uniform sampler2D palette;

uniform vec2 colorClamp;

varying vec4 fragColor;

vec4 zero = vec4(0, 0, 0, 0);
vec4 unit = vec4(1, 1, 1, 1);
vec2 xyProjection = vec2(1, -1);

mat4 mclamp(mat4 m, mat4 lo, mat4 hi) {
    return mat4(clamp(m[0], lo[0], hi[0]),
        clamp(m[1], lo[1], hi[1]),
        clamp(m[2], lo[2], hi[2]),
        clamp(m[3], lo[3], hi[3]));
}

bool mshow(mat4 p, mat4 lo, mat4 hi) {
    return mclamp(p, lo, hi) == p;
}

float val(mat4 p, mat4 v) {
    return dot(matrixCompMult(p, v) * unit, unit);
}

void main() {

    mat4 pA = mat4(p0, p1, p2, p3);
    mat4 pB = mat4(p4, p5, p6, p7);
    mat4 pC = mat4(p8, p9, pa, pb);

    float show = float(mshow(pA, loA, hiA) &&
        mshow(pB, loB, hiB) &&
        mshow(pC, loC, hiC));

    vec2 yy = show * vec2(val(pA, var1A) + val(pB, var1B) + val(pC, var1C),
            val(pA, var2A) + val(pB, var2B) + val(pC, var2C));

    float y = dot(yy, vec2(1.0 - x, x));

    vec2 viewBoxXY = viewBoxPosition + viewBoxSize * vec2(x, y);

    float depthOrHide = depth + 2.0 * (1.0 - show);

    gl_Position = vec4(
        xyProjection * (2.0 * viewBoxXY / resolution - 1.0),
        depthOrHide,
        1.0
    );

    //fragColor = vec4(colorIndex, 0, 1, 1);
    float clampedColorIndex = clamp((colorIndex - colorClamp[0]) / (colorClamp[1] - colorClamp[0]), 0.0, 1.0);
    fragColor = texture2D(palette, vec2((clampedColorIndex * 255.0 + 0.5) / 256.0, 0.5));
}

`