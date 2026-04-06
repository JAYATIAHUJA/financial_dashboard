import React, { useEffect, useRef } from 'react';

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

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Slow, subtle movement
    float f = sin(uv.x * 2.0 + time * 0.15) * sin(uv.y * 2.0 + time * 0.1) * 0.5 + 0.5;
    float f2 = sin(uv.x * 4.0 - time * 0.2) * cos(uv.y * 3.0 + time * 0.1) * 0.5 + 0.5;
    
    // Light mode palette (cream / very soft pastel)
    vec3 lightColor1 = vec3(0.98, 0.95, 0.92); // #faf2ec base
    vec3 lightColor2 = vec3(0.95, 0.92, 0.96); // slight purple tint
    vec3 lightColor3 = vec3(0.99, 0.90, 0.90); // slight pink tint
    
    // Dark mode palette (deep dark gray/soft black)
    vec3 darkColor1 = vec3(0.06, 0.06, 0.06); // #101010 base
    vec3 darkColor2 = vec3(0.08, 0.06, 0.10); // slight dark purple
    vec3 darkColor3 = vec3(0.10, 0.08, 0.08); // slight dark red
    
    vec3 color1 = mix(lightColor1, darkColor1, isDark);
    vec3 color2 = mix(lightColor2, darkColor2, isDark);
    vec3 color3 = mix(lightColor3, darkColor3, isDark);
    
    // Blend them
    vec3 finalColor = mix(color1, color2, f);
    finalColor = mix(finalColor, color3, f2 * 0.5);
    
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
      
      // Smoothly transition between dark mode and light mode
      const currentDark = gl.getUniform(program, isDarkUniformLocation) as number || 0;
      const targetDark = darkRef.current;
      const newDark = currentDark + (targetDark - currentDark) * 0.1;
      gl.uniform1f(isDarkUniformLocation, newDark);

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
