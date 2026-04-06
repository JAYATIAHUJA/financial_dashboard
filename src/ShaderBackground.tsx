import { useEffect, useRef } from 'react';

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform float time;
  uniform vec2 resolution;
  uniform float isDark;

  // Random / Noise functions for generating Clouds
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      vec2 u = f * f * (3.0 - 2.0 * f); // Smooth interpolation
      return mix(mix(random(i + vec2(0.0,0.0)), random(i + vec2(1.0,0.0)), u.x),
                 mix(random(i + vec2(0.0,1.0)), random(i + vec2(1.0,1.0)), u.x), u.y);
  }

  // Fractional Brownian Motion (fBm) for cloudy fractals
  float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.55; // Boost amplitude for higher contrast
      for (int i = 0; i < 5; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
      }
      return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    uv.x *= resolution.x / resolution.y; // Correct aspect ratio for thick clouds
    
    vec2 p = uv * 3.0; // Scale of the clouds
    
    // Abstract Cloud Domain Warping
    vec2 q = vec2(0.0);
    q.x = fbm(p + 0.1 * time);
    q.y = fbm(p + vec2(1.0));
    
    vec2 r = vec2(0.0);
    r.x = fbm(p + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time);
    r.y = fbm(p + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time);
    
    float f = fbm(p + r);
    f = smoothstep(0.1, 0.9, f); // Dramatic contrast boost
    
    // Light mode palette: VERY distinct visible clouds
    vec3 lightColor1 = vec3(0.65, 0.70, 0.85); // Deep cloud shadow (Blueish gray)
    vec3 lightColor2 = vec3(0.95, 0.85, 0.90); // Midtone mist (Pinkish)
    vec3 lightColor3 = vec3(1.0, 1.0, 1.0);    // Bright fluffy highlights (White)
    
    // Dark mode palette: Extremely punchy nebulae
    vec3 darkColor1 = vec3(0.02, 0.02, 0.06);  // Pitch black void
    vec3 darkColor2 = vec3(0.20, 0.10, 0.35);  // Bright purple nebula clouds
    vec3 darkColor3 = vec3(0.10, 0.40, 0.50);  // Electrifying cyan edges
    
    vec3 color1 = mix(lightColor1, darkColor1, isDark);
    vec3 color2 = mix(lightColor2, darkColor2, isDark);
    vec3 color3 = mix(lightColor3, darkColor3, isDark);
    
    // Hard blend to clearly separate the colors
    vec3 finalColor = mix(color1, color2, clamp(f * 1.5, 0.0, 1.0));
    finalColor = mix(finalColor, color3, clamp(length(q) * f * 2.0, 0.0, 1.0));
    
    // Ultra minimal dither to prevent gradient banding
    float dither = (random(uv + time) * 0.04) - 0.02;
    finalColor += dither;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ShaderBackground({ darkMode }: { darkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef(darkMode ? 1.0 : 0.0);

  useEffect(() => {
    darkRef.current = darkMode ? 1.0 : 0.0;
  }, [darkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const timeUniformLocation = gl.getUniformLocation(program, "time");
    const resolutionUniformLocation = gl.getUniformLocation(program, "resolution");
    const isDarkUniformLocation = gl.getUniformLocation(program, "isDark");

    let animationFrameId: number;
    let startTime = Date.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(timeUniformLocation, (Date.now() - startTime) / 1000);
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      
      if (isDarkUniformLocation !== null) {
        const currentDark = gl.getUniform(program, isDarkUniformLocation) as number || 0;
        const targetDark = darkRef.current;
        const newDark = currentDark + (targetDark - currentDark) * 0.05;
        gl.uniform1f(isDarkUniformLocation, newDark);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
