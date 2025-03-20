import { vec4, mat4 } from "../myMath";
import { useEffect, useRef, useState } from "react";


function vec3ArrayToNumberArray(array)
{
    if (array[0] instanceof vec4)
    {
        let temp = [];
        for (let i=0; i<array.length; i++)
        {
            temp.push(array[i].x, array[i].y, array[i].z);
        }
        return temp;
    }
    return array;
}
function vec4ArrayToNumberArray(array)
{
    if (array[0] instanceof vec4)
    {
        let temp = [];
        for (let i=0; i<array.length; i++)
        {
            temp.push(array[i].x, array[i].y, array[i].z, array[i].a);
        }
        return temp;
    }
    return array;
}
function r() { 
    randomValuesIndex++;
    if (randomValuesIndex >= 10000) { randomValuesIndex = 0; }
    return randomValues[randomValuesIndex];
}
function setRandomSeed(index)
{
    randomValuesIndex = index;
}
var randomValues = [];
var randomValuesIndex = 0;
for (let i=0; i<10000; i++)
{
    randomValues.push(Math.random());
}

var randomPerlinOffset = Math.random();

//PERLIN NOISE FUNCTIONS
function pseudoRandom(vector3 = new vec4()) {
    const val = Math.sin(vector3.x*13.9898 + vector3.y+78.233 + vector3.z*30.5489) * (43758.5453123 + 10*randomPerlinOffset);
    return val - Math.floor(val);
}
function pseudoRandom3(x,y,z) {
    const val = Math.sin(x*13.9898 + y+78.233 + z*30.5489) * (43758.5453123 + 10*randomPerlinOffset);
    return val - Math.floor(val);
}
function perlin(p = new vec4()) {
    const corner = new vec4(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    const x = corner.x;
    const y = corner.y;
    const z = corner.z;
    const f = p.sub(corner);

    //Compute Corner Random Values
    const c000 = pseudoRandom3(x  ,y  ,z  );
    const c100 = pseudoRandom3(x+1,y  ,z  );
    const c110 = pseudoRandom3(x+1,y+1,z  );
    const c010 = pseudoRandom3(x  ,y+1,z  );
    const c001 = pseudoRandom3(x  ,y  ,z+1);
    const c101 = pseudoRandom3(x+1,y  ,z+1);
    const c111 = pseudoRandom3(x+1,y+1,z+1);
    const c011 = pseudoRandom3(x  ,y+1,z+1);

    //Interpolate to find 'p' position, and return value
    const c00 = c000*(1.0 - f.x) + c100*f.x;
    const c01 = c001*(1.0 - f.x) + c101*f.x;
    const c10 = c010*(1.0 - f.x) + c110*f.x;
    const c11 = c011*(1.0 - f.x) + c111*f.x;
    const c0 = c00*(1.0 - f.y) + c10*f.y;
    const c1 = c01*(1.0 - f.y) + c11*f.y;
    return c0*(1.0-f.z) + c1*f.z;
}
function perlin3d(p = new vec4())
{
    return new vec4(pseudoRandom(p), pseudoRandom(p.add(100.0)), pseudoRandom(p.add(200.0)));
}
function perlinCombined(p=new vec4(), baseFreq=2.0, freqMultiplier=1.5, iterations=10)
{
    let val = 0;
    for (let i=0; i<iterations; i++)
    {
        val += perlin(p.mul(baseFreq));
        baseFreq *= freqMultiplier;
    }
    return val/iterations;
}





function initDepthShader(gl, canvasElement)//initialize the default shader
{
    function _loadShader(gl, type, source)//helper function used by _initShader() and _initPickerShader()
    {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    let vsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uCameraMatrix;
    uniform mat4 uObjectMatrix;

    varying highp vec4 worldPos;
    varying highp vec4 perspectivePos;

    void main() {
        //Compute Model & WorldVertex Position
        vec4 vPos = uObjectMatrix * vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
        worldPos = vPos;
        perspectivePos = uCameraMatrix * vPos;

        //Compute Position relative to camera
        gl_Position = perspectivePos;
    }`;

    const fsSource = `
    precision highp float;

    varying vec4 worldPos;
    varying vec4 perspectivePos;

    uniform vec4 uCameraPositionVector;

    void main() {
        float dist = distance(worldPos, uCameraPositionVector);

        float r = fract(dist / 256.0);
        float g = fract(dist);
        float b = fract(dist * 256.0);

        gl_FragColor = vec4( r, g, b, 1.0);
    }
    `;
    const vertexShader = _loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = _loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexLocation: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
            cameraMatrix: gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
            objectMatrix: gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
            cameraPositionVector: gl.getUniformLocation(shaderProgram, 'uCameraPositionVector'),
        },
    };

    const frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER,  frameBuffer);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasElement.width, canvasElement.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // attach the texture as the first color attachment
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER,  frameBuffer);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvasElement.width, canvasElement.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    return {
        shaderProgram: shaderProgram,
        programInfo: programInfo,
        frameBuffer: frameBuffer,
        texture: texture,
        depthBuffer: depthBuffer,
    }
}
function renderDepth(gl, shaderData, projectionMatrix=new mat4(), cameraPosition=new vec4(), cameraRotation=new vec4(), objectData = {})
{
    const objectPosition = objectData.position;
    const objectRotation = objectData.rotation;

    const verticesBuffer = objectData.verticesBuffer;
    const indicesBuffer = objectData.indicesBuffer;
    const indices = objectData.indices;

    const programInfo           = shaderData.programInfo;
    const viewMatrix            = new mat4().makeTranslationRotationScale(cameraPosition, cameraRotation, new vec4(1,1,1,1));
    const objectMatrix          = new mat4().makeTranslationRotationScale(objectPosition, objectRotation, new vec4(1,1,1,1));


    gl.bindFramebuffer(gl.FRAMEBUFFER, shaderData.frameBuffer);
    //Clear frameBuffer
    gl.clearColor(1, 1, 1, 1);    // Clear to white, fully opaque
    gl.clearDepth(1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    

    gl.useProgram(programInfo.program);

    //BIND BUFFERS ///////////////////////////////////////////
    //Bind Vertices Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);

    //Bind Indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

    //BIND UNIFORMS////////////////////////////////////////
    // Projection, View, Object Position, and Object Rotation matrices
    gl.uniformMatrix4fv(programInfo.uniformLocations.cameraMatrix,          false, projectionMatrix.mul(viewMatrix).getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectMatrix,          false, objectMatrix.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.cameraPositionVector,               cameraPosition.getFloat32Array());

    //RENDER////////////////////////////////////////////////
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);


    // let pixels = new Uint8Array(4);

    // let x = Math.round(canvasElement.width/2);
    // let y = Math.round(canvasElement.height/2);

    // //Read Pixels
    // gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // console.log(pixels);


    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}





function initShader(gl)//initialize the default shader
{
    function _loadShader(gl, type, source)//helper function used by _initShader() and _initPickerShader()
    {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        // See if it compiled successfully
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    let vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aNormalVector;
    attribute vec4 aColorVector;
    attribute vec4 aMaterialVector;

    uniform mat4 uCameraMatrix;
    uniform mat4 uObjectMatrix;
    uniform mat4 uObjectRotationMatrix;

    varying highp vec3 worldPos;
    varying highp vec3 modelPos;
    varying highp vec3 glPos;
    varying highp vec3 surfaceNormal;
    varying highp vec4 surfaceColor;
    varying highp vec4 surfaceMaterial;

    void main() {
        //Compute Model & WorldVertex Position
        vec4 vPos = uObjectMatrix * vec4(aVertexPosition.xyz, 1.0);
        modelPos = aVertexPosition.xyz;
        worldPos = vPos.xyz;

        //Compute Position relative to camera
        gl_Position = uCameraMatrix * vPos;
        glPos = (uCameraMatrix * vPos).xyz;
        
        //Compute triangle lighting, and scale color accordingly
        surfaceNormal = (uObjectRotationMatrix * aNormalVector).xyz;

        surfaceMaterial = aMaterialVector;
        surfaceColor = aColorVector;
    }`;
    const noiseFunctions = `
    // 2D Random
    float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // 3D Random
    float random (vec3 st) {
        return fract(sin(dot(st.xyz, vec3(12.9898,78.233,30.5489))) * 43758.5453123);
    }

    float noise (vec3 p) {
        vec3 corner = floor(p);
        vec3 f = fract(p);

        //Compute Corner Random Values
        float c000 = random(corner);
        float c100 = random(corner + vec3(1,0,0));
        float c110 = random(corner + vec3(1,1,0));
        float c010 = random(corner + vec3(0,1,0));
        float c001 = random(corner + vec3(0,0,1));
        float c101 = random(corner + vec3(1,0,1));
        float c111 = random(corner + vec3(1,1,1));
        float c011 = random(corner + vec3(0,1,1));

        //Interpolate to find 'p' position, and return value
        float c00 = c000*(1.0 - f.x) + c100*f.x;
        float c01 = c001*(1.0 - f.x) + c101*f.x;
        float c10 = c010*(1.0 - f.x) + c110*f.x;
        float c11 = c011*(1.0 - f.x) + c111*f.x;
        float c0 = c00*(1.0 - f.y) + c10*f.y;
        float c1 = c01*(1.0 - f.y) + c11*f.y;
        return c0*(1.0-f.z) + c1*f.z;
    }

    vec3 noise3d(vec3 p)
    {
        return vec3(noise(p), noise(p + 100.0), noise(p + 200.0));
    }


    vec3 modify(vec3 vector, vec4 modifier, vec4 noiseOffsetMultiplier, vec4 frequencies)
    {
        if (modifier.x > 0.01)
        {
            vector *= (1.0 - modifier.x) + modifier.x * noise3d(modelPos*frequencies.x + noiseOffsetMultiplier.x*noise(modelPos*frequencies.x));
        }
        if (modifier.y > 0.01)
        {
            vector *= (1.0 - modifier.y) + modifier.y * noise3d(modelPos*frequencies.y + noiseOffsetMultiplier.y*noise(modelPos*frequencies.y));
        }
        if (modifier.z > 0.01)
        {
            vector *= (1.0 - modifier.z) + modifier.z * noise3d(modelPos*frequencies.z + noiseOffsetMultiplier.z*noise(modelPos*frequencies.z));
        }
        if (modifier.a > 0.01)
        {
            vector *= (1.0 - modifier.a) + modifier.a * noise3d(modelPos*frequencies.a + noiseOffsetMultiplier.a*noise(modelPos*frequencies.a));
        }
        return vector;
    }


    //Marble/Stone like - use 3.0 as baseFreq
    float compoundNoise7(vec3 p, float baseFreq)
    {
        float sum = 0.0;
        float freq = baseFreq;
        float offset = 0.0;
        for (int i=0; i<7; i++)
        {
            sum += noise(p*freq + 10.0*offset);
            offset += fract(sum);
            freq *= 1.7;
        }
        return sum / 7.0;
    }

    //Camo Pattern
    float compoundNoise7_2(vec3 p, float baseFreq)
    {
        float sum = 0.0;
        float freq = baseFreq;
        float offset = 0.0;
        for (int i=0; i<10; i++)
        {
            float temp = noise(p*freq + 1.0*offset);
            if (temp > 0.5)
            {
                sum += temp;
                offset += fract(sum);
                freq *= 1.4;
            }
        }
        return sum / 10.0;
    }

    //Camo Pattern
    float compoundNoise7_3(vec3 p)
    {
        float freq = 3.0;

        float sum = 0.0;
        float offset = 0.0;
        for (int i=0; i<3; i++)
        {
            float temp = noise(p*freq + 1.0*offset);
            if (temp > 0.5)
            {
                sum += temp;
                offset += fract(sum);
            }
            freq *= 1.7;
        }
        return sum / 3.0;
    }


    float compoundNoise7_4(vec3 p)
    {
        vec3 corner = floor(p);
        vec3 f = fract(p);

        float radius = 0.5;
        float threshold = 0.8;

        float d;
        float r;

        d = distance(f, vec3(0,0,0));
        r = random(corner);
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        d = distance(f, vec3(1,0,0));
        r = random(corner + vec3(1,0,0));
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        d = distance(f, vec3(1,1,0));
        r = random(corner + vec3(1,1,0));
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        d = distance(f, vec3(0,1,0));
        r = random(corner + vec3(0,1,0));
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        


        d = distance(f, vec3(0,0,1));
        r = random(corner + vec3(0,0,1));
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        d = distance(f, vec3(1,0,1));
        r = random(corner + vec3(1,0,1));
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        d = distance(f, vec3(1,1,1));
        r = random(corner + vec3(1,1,1));
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        d = distance(f, vec3(0,1,1));
        r = random(corner + vec3(0,1,1));
        if (d < radius)
        { if (r > threshold) { return d / radius; } return 0.0; }

        return 0.0;
    }
    `;
    const fsSource = `
    precision highp float;

    varying vec3 worldPos;
    varying vec3 modelPos;
    varying vec3 glPos;
    varying vec3 surfaceNormal;
    varying vec4 surfaceColor;
    varying vec4 surfaceMaterial;

    uniform vec4 uLightDirectionVector;
    uniform float uAmbientLightLevel;
    uniform vec4 uCameraPositionVector;

    uniform vec4 uColorModifierVector;
    uniform vec4 uColorNoiseOffsetVector;
    uniform vec4 uNormalModifierVector;
    uniform vec4 uNormalNoiseOffsetVector;

    uniform sampler2D uSampler;

    uniform float uTimeFloat;


    `+noiseFunctions+`


    void main() {

        vec3 normal = surfaceNormal;
        vec3 color = surfaceColor.xyz;
        float opacity = surfaceColor.a;
        if (opacity > 1.0) { opacity = 1.0; } else if (opacity < 0.0){ opacity = 0.0;}


        if (surfaceMaterial.y > 0.001) // for water
        {
            normal *= (1.0-surfaceMaterial.y) + surfaceMaterial.y*noise3d( modelPos*100.0 + 200.0*noise(modelPos*2.0) + uTimeFloat);
            normal *= (1.0-surfaceMaterial.y) + surfaceMaterial.y*noise3d( modelPos*30.0 + noise(modelPos*2.0) + uTimeFloat);
        } else {
            //Randomly adjust land texture & color
            normal += 0.2*noise3d( modelPos*20.0 + 10.0*noise(modelPos*2.0)) + 0.1*noise3d( modelPos*100.0 + 10.0*noise(modelPos*2.0));
            color *= 0.9 + 0.1*noise(modelPos*100.0);
            normal = normalize(normal);
        }

        normal = normalize(normal);


        if (surfaceMaterial.a > 0.001) {
            float d = dot(normalize(worldPos.xyz - uCameraPositionVector.xyz), normal);
            if (d < 0.0)
            {
                d = -d;
            }
            d = sin(d*3.141592)*0.9 + 0.1;
            if (d > 0.0)
            {
                opacity *= d;
            }


            float n = 0.7*noise(modelPos*2.0 + 0.1*uTimeFloat) 
                + 0.2*noise(modelPos*5.0 + 0.1*uTimeFloat) 
                + 0.2*noise(modelPos*10.0 + 3.0*noise(modelPos*10.0) + 0.1*uTimeFloat)
                + 0.1*noise(modelPos*50.0 + 3.0*noise(modelPos*50.0) + 0.1*uTimeFloat)
                ;
            n = n - 0.65;
            if (n > 0.0)
            {
                n *= 5.0;
                if (n > 1.0) { n=1.0;}
                opacity += n * surfaceMaterial.z;
            }
        }
        
        //Compute fragment illumination
        float illumination = dot(uLightDirectionVector.xyz, normal) * (1.0-uAmbientLightLevel) + uAmbientLightLevel;

        //Check for specular reflection
        float spec = dot(reflect(normalize(worldPos.xyz - uCameraPositionVector.xyz), normal), -uLightDirectionVector.xyz);
        
        if (spec > 0.0)
        {
            spec = spec*spec*spec; //raise it to a high power
            spec = spec*spec*spec;
            spec = spec*spec*spec;
            spec = spec * surfaceMaterial.x;
        } else {
            spec = 0.0;
        }

        gl_FragColor = vec4(color * illumination + spec*vec3(1,1,1), opacity);
        return;
    }
    `;
    const vertexShader = _loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = _loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexLocation: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            normalLocation: gl.getAttribLocation(shaderProgram, 'aNormalVector'),
            colorLocation: gl.getAttribLocation(shaderProgram, 'aColorVector'),
            materialLocation: gl.getAttribLocation(shaderProgram, 'aMaterialVector'),
        },
        uniformLocations: {
            cameraMatrix: gl.getUniformLocation(shaderProgram, 'uCameraMatrix'),
            objectMatrix: gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
            objectRotationMatrix: gl.getUniformLocation(shaderProgram, 'uObjectRotationMatrix'),
            lightDirectionVector: gl.getUniformLocation(shaderProgram, 'uLightDirectionVector'),
            ambientLightLevelFloat: gl.getUniformLocation(shaderProgram, 'uAmbientLightLevel'),
            cameraPositionVector: gl.getUniformLocation(shaderProgram, 'uCameraPositionVector'),

            colorModifierVector: gl.getUniformLocation(shaderProgram, 'uColorModifierVector'),
            colorNoiseOffsetVector: gl.getUniformLocation(shaderProgram, 'uColorNoiseOffsetVector'),
            normalModifierVector: gl.getUniformLocation(shaderProgram, 'uNormalModifierVector'),
            normalNoiseOffsetVector: gl.getUniformLocation(shaderProgram, 'uNormalNoiseOffsetVector'),

            textureSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),

            timeFloat: gl.getUniformLocation(shaderProgram, 'uTimeFloat')
        },
    };
    return {
        shaderProgram: shaderProgram,
        programInfo: programInfo,
    }
}
function render(gl, shaderData, projectionMatrix=new mat4(), cameraPosition=new vec4(), cameraRotation=new vec4(), objectData = {},
    lightingDirection = new vec4(0.7,0.7,0.1), ambientLightLevel = 0.1,
    colorModifierVector=new vec4(0,0,0,0), colorNoiseOffsetVector=new vec4(0,0,0,0), normalModifierVector=new vec4(0,0,0,0), normalNoiseOffsetVector=new vec4(0,0,0,0))
{
    const programInfo           = shaderData.programInfo;

    const objectPosition =  objectData.position;
    const objectRotation =  objectData.rotation;

    const viewMatrix            = new mat4().makeTranslationRotationScale(cameraPosition, cameraRotation, new vec4(1,1,1,1));
    const objectMatrix          = new mat4().makeTranslationRotationScale(objectPosition, objectRotation, new vec4(1,1,1,1));
    const objectRotationMatrix  = new mat4().makeRotation(objectRotation);

    
    //Render Object
    for (let i=0; i<objectData.buffers.length; i++)
    {
        const verticesBuffer =  objectData.buffers[i].verticesBuffer;
        const normalsBuffer =   objectData.buffers[i].normalsBuffer;
        const colorsBuffer =    objectData.buffers[i].colorsBuffer;
        const materialsBuffer = objectData.buffers[i].materialsBuffer;
        const indicesBuffer =   objectData.buffers[i].indicesBuffer;
        const indices =         objectData.buffers[i].indices;

        gl.useProgram(programInfo.program);

        //BIND BUFFERS ///////////////////////////////////////////
        //Bind Vertices Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);

        //Bind Normals Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.normalLocation);

        //Bind Colors Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.colorLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.colorLocation);

        //Bind Materials Buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, materialsBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.materialLocation, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.materialLocation);

        //Bind Indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);


        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_2D, depthShaderData.texture);


        //BIND UNIFORMS////////////////////////////////////////
        // Projection, View, Object Position, and Object Rotation matrices
        gl.uniformMatrix4fv(programInfo.uniformLocations.cameraMatrix,          false, projectionMatrix.mul(viewMatrix).getFloat32Array());
        gl.uniformMatrix4fv(programInfo.uniformLocations.objectMatrix,          false, objectMatrix.getFloat32Array());
        gl.uniformMatrix4fv(programInfo.uniformLocations.objectRotationMatrix,  false, objectRotationMatrix.getFloat32Array());
        gl.uniform4fv(programInfo.uniformLocations.lightDirectionVector,    lightingDirection.getFloat32Array());
        gl.uniform1f(programInfo.uniformLocations.ambientLightLevelFloat,   ambientLightLevel);
        gl.uniform4fv(programInfo.uniformLocations.cameraPositionVector,    cameraPosition.getFloat32Array());

        gl.uniform4fv(programInfo.uniformLocations.colorModifierVector,    colorModifierVector.getFloat32Array());
        gl.uniform4fv(programInfo.uniformLocations.colorNoiseOffsetVector,   colorNoiseOffsetVector.getFloat32Array());
        gl.uniform4fv(programInfo.uniformLocations.normalModifierVector,   normalModifierVector.getFloat32Array());
        gl.uniform4fv(programInfo.uniformLocations.normalNoiseOffsetVector,   normalNoiseOffsetVector.getFloat32Array());

        gl.uniform1i(programInfo.uniformLocations.textureSampler, 0);
        gl.uniform1f(programInfo.uniformLocations.timeFloat, ((Date.now()) / 1000) % 1000)

        //RENDER////////////////////////////////////////////////
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
}
function clear(gl, canvasElement, clearColor = null) //Clear the screen to default color
{
    if (!(clearColor instanceof vec4)) { clearColor = new vec4(1,0,0,1); }

    // Clear the canvas before we start drawing on it.
    gl.clearColor(clearColor.x, clearColor.y, clearColor.z, clearColor.a);
    gl.clearDepth(1);                   // Clear everything

    //Enable depth testing & blending
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.enable(gl.BLEND);
    gl.depthMask(true);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    gl.enable(gl.CULL_FACE);
    // if (renderReverseFaces == true) { gl.disable(gl.CULL_FACE);
    // } else {                                gl.enable(gl.CULL_FACE); }
    
    //Clearing color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //Set Viewport
    gl.viewport(0, 0, canvasElement.width, canvasElement.height);
}
function renderObject(gl, programInfo, projectionMatrix=new mat4(), cameraPosition=new vec4(), cameraRotation=new vec4(),
    objectPosition=new vec4(), objectRotation=new vec4(), objectScale=new vec4(1,1,1,1), verticesBuffer, normalsBuffer, colorsBuffer, materialsBuffer, indicesBuffer, numIndices=0,
    lightingDirection=new vec4(0.7,0.7,0.1), ambientLightLevel=0.1
)
{
    if (projectionMatrix== null) {projectionMatrix  =new mat4().makePerspective(1,1,1,1000);}
    if (cameraPosition  == null) {cameraPosition    =new vec4();}
    if (cameraRotation  == null) {cameraRotation    =new vec4();}
    if (objectPosition  == null) {objectPosition    =new vec4(1,1,1,1);}
    if (objectRotation  == null) {objectRotation    =new vec4(1,1,1,1);}
    if (objectScale     == null) {objectScale       =new vec4(1,1,1,1);}
    const objectMatrix = new mat4().makeTranslationRotationScale(objectPosition, objectRotation, objectScale);
    const objectRotationMatrix = new mat4().makeRotation(objectRotation);
    const viewMatrix = new mat4().makeTranslationRotationScale(cameraPosition, cameraRotation);

    gl.useProgram(programInfo.program);

    //BIND BUFFERS ///////////////////////////////////////////
    //Bind Vertices Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);

    //Bind Normals Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.normalLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.normalLocation);

    //Bind Colors Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.colorLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.colorLocation);

    //Bind Materials Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, materialsBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.materialLocation, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.materialLocation);

    //Bind Indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, depthShaderData.texture);

    //BIND UNIFORMS////////////////////////////////////////
    gl.uniformMatrix4fv(programInfo.uniformLocations.cameraMatrix,          false, projectionMatrix.mul(viewMatrix).getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectMatrix,          false, objectMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectRotationMatrix,  false, objectRotationMatrix.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.lightDirectionVector,    lightingDirection.getFloat32Array());
    gl.uniform1f(programInfo.uniformLocations.ambientLightLevelFloat,   ambientLightLevel);
    gl.uniform4fv(programInfo.uniformLocations.cameraPositionVector,    cameraPosition.getFloat32Array());
    gl.uniform1i(programInfo.uniformLocations.textureSampler, 0); // unused
    gl.uniform1f(programInfo.uniformLocations.timeFloat, ((Date.now()) / 1000) % 1000)

    //RENDER////////////////////////////////////////////////
    gl.drawElements(gl.TRIANGLES, numIndices, gl.UNSIGNED_SHORT, 0);
}



function initObjectBuffers(gl, vertices_=[], normals_=[], colors_=[], materials_=[], indices_=[])
{

    let ind = [];
    let nor = [];
    let vert = [];
    let col = [];
    let mat = [];

    if (vertices_.length > 100000)
    {
        let indOffset = 0;

        let tempIndices = [];
        let tempVertices =[];
        let tempColors = [];
        let tempNormals = [];
        let tempMaterials = [];
        for (let i=0; i<indices_.length; i+=3)
        {
            if (tempVertices.length > 100000)
            {
                ind.push(tempIndices);
                vert.push(tempVertices);
                col.push(tempColors);
                mat.push(tempMaterials);
                nor.push(tempNormals);

                tempIndices = [];
                tempVertices =[];
                tempColors = [];
                tempNormals = [];
                tempMaterials = [];

                indOffset = 0;
            }

            tempVertices.push(vertices_[indices_[i  ]]);
            tempVertices.push(vertices_[indices_[i+1]]);
            tempVertices.push(vertices_[indices_[i+2]]);

            tempNormals.push(normals_[indices_[i  ]]);
            tempNormals.push(normals_[indices_[i+1]]);
            tempNormals.push(normals_[indices_[i+2]]);

            tempMaterials.push(materials_[indices_[i  ]]);
            tempMaterials.push(materials_[indices_[i+1]]);
            tempMaterials.push(materials_[indices_[i+2]]);

            tempColors.push(colors_[indices_[i  ]]);
            tempColors.push(colors_[indices_[i+1]]);
            tempColors.push(colors_[indices_[i+2]]);

            tempIndices.push(indOffset, indOffset+1, indOffset+2);
            indOffset += 3;
        }



    } else {
        ind.push(indices_);
        vert.push(vertices_);
        col.push(colors_);
        nor.push(normals_);
        mat.push(materials_);
    }

    if (ind.length > 1)
    {
        const buffers = [];
        for (let i=0; i<ind.length; i++)
        {
            const vertices  = vec3ArrayToNumberArray(vert[i]);
            const normals   = vec3ArrayToNumberArray(nor[i]);
            const colors    = vec4ArrayToNumberArray(col[i]);
            const materials = vec4ArrayToNumberArray(mat[i]);
            const indices   = ind[i];

            const verticesBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            const normalsBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

            const colorsBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

            const materialsBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, materialsBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(materials), gl.STATIC_DRAW);

            const indicesBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

            buffers.push({
                verticesBuffer: verticesBuffer,
                normalsBuffer: normalsBuffer,
                colorsBuffer: colorsBuffer,
                materialsBuffer: materialsBuffer,
                indicesBuffer: indicesBuffer,
        
                indices: indices,
                normals: normals,
                colors: colors,
                materals: materials,
                vertices: vertices,
            });
        }
        return buffers;
    }

    const vertices  = vec3ArrayToNumberArray(vertices_);
    const normals   = vec3ArrayToNumberArray(normals_);
    const colors    = vec4ArrayToNumberArray(colors_);
    const materials = vec4ArrayToNumberArray(materials_);
    const indices   = indices_;

    const verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const colorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const materialsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, materialsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(materials), gl.STATIC_DRAW);

    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        verticesBuffer: verticesBuffer,
        normalsBuffer: normalsBuffer,
        colorsBuffer: colorsBuffer,
        materialsBuffer: materialsBuffer,
        indicesBuffer: indicesBuffer,

        indices: indices,
        normals: normals,
        colors: colors,
        materals: materials,
        vertices: vertices,
    }
}
function initPlanet(gl, radius = 1, planetSubdivision=7, randomModifier=1, randomModifierAttenuation=1.8, numAtmosphereLevels=10)
{
    const moon      = moonGenerator(radius, planetSubdivision, randomModifier, randomModifierAttenuation);
    const ocean     = oceanGenerator(3, moon.oceanRadius);
    const atmosphere= atmosphereGenerator(3, moon.maxRadius*1.1, moon.maxRadius, numAtmosphereLevels);
    // const cloud     = cloudGenerator(3, moon.oceanRadius, moon.maxRadius*1.1);
    // const trees     = treeGenerator(moon.vertices, moon.oceanRadius);
    
    const moonBuffers = initObjectBuffers(gl, moon.vertices, moon.normals, moon.colors, moon.materials, moon.indices);
    const oceanBuffers = initObjectBuffers(gl, ocean.vertices, ocean.normals, ocean.colors, ocean.materials, ocean.indices);
    const atmosphereBuffers = initObjectBuffers(gl, atmosphere.vertices, atmosphere.normals, atmosphere.colors, atmosphere.materials, atmosphere.indices);
    // const cloudBuffers = initObjectBuffers(gl, cloud.vertices, cloud.normals, cloud.colors, cloud.materials, cloud.indices);
    // const treeBuffers = initObjectBuffers(gl, trees.vertices, trees.normals, trees.colors, trees.materials, trees.indices);

    const retObj = {
        position: new vec4(),
        rotation: new vec4(),

        buffers: [
        ]
    }
    
    if (moonBuffers instanceof Array)
    {
        for (let i=0; i<moonBuffers.length;i++)
        {
            retObj.buffers.push(moonBuffers[i])
        }
    } else {
        retObj.buffers.push(moonBuffers);
    }

    retObj.buffers.push(
        oceanBuffers,
        atmosphereBuffers
    );
    console.log(retObj)
    return retObj;

}

function generateSphereMesh(numDivisions = 6)
{
    //Initialize Indices and Vertices
    let indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    let vertices = [
        new vec4(0,-1,0),
        new vec4(1,0,0),
        new vec4(0,0,1),
        new vec4(-1,0,0),
        new vec4(0,0,-1),
        new vec4(0,1,0),
    ];

    let verticeMap = new Map();  //maps position hash to indice

    //Generate unit sphere mesh with distortions
    for (let divItr=0; divItr<numDivisions; divItr++)
    {
        let newVertices = [];
        let newIndices = [];
        verticeMap = new Map(); //maps hash to indice

        for( let i=0; i<indices.length; i+=3)
        {
            //Compute all triangle vertices & midpoints
            const v1 = vertices[indices[i]];                // bottom left, 
            const v2 = vertices[indices[i+1]];              // top center
            const v3 = vertices[indices[i+2]];              // bottom right
            const v1v2 = (v1.add(v2)).scaleToUnit().mul((v1.getLength() + v2.getLength())/2);
            const v2v3 = (v2.add(v3)).scaleToUnit().mul((v2.getLength() + v3.getLength())/2);
            const v3v1 = (v1.add(v3)).scaleToUnit().mul((v3.getLength() + v1.getLength())/2);

            //Find all indices in verticeMap. If indice == undefined, add to vert
            let v1_i = verticeMap.get(v1.getHash());
            let v2_i = verticeMap.get(v2.getHash());
            let v3_i = verticeMap.get(v3.getHash());
            let v1v2_i = verticeMap.get(v1v2.getHash());
            let v2v3_i = verticeMap.get(v2v3.getHash());
            let v3v1_i = verticeMap.get(v3v1.getHash());

            //For each vertex, check to see if it's already in the newVertices array. If not, add it, and update verticeMap
            if (v1_i == undefined) { 
                v1_i = newVertices.length;
                verticeMap.set(v1.getHash(), v1_i);
                newVertices.push(v1);
            }
            if (v2_i == undefined) { 
                v2_i = newVertices.length;
                verticeMap.set(v2.getHash(), v2_i);
                newVertices.push(v2);
            }
            if (v3_i == undefined) { 
                v3_i = newVertices.length;
                verticeMap.set(v3.getHash(), v3_i);
                newVertices.push(v3);
            }
            if (v1v2_i == undefined) { 
                v1v2_i = newVertices.length;
                verticeMap.set(v1v2.getHash(), v1v2_i);
                newVertices.push(v1v2);
            }
            if (v2v3_i == undefined) { 
                v2v3_i = newVertices.length;
                verticeMap.set(v2v3.getHash(), v2v3_i);
                newVertices.push(v2v3);
            }
            if (v3v1_i == undefined) { 
                v3v1_i = newVertices.length;
                verticeMap.set(v3v1.getHash(), v3v1_i);
                newVertices.push(v3v1);
            }

            //Add triangle indices for 4 sub-triangles
            newIndices.push(  v1_i, v1v2_i, v3v1_i,     //Left Triangle
                            v1v2_i, v2_i, v2v3_i,       //Top triangle
                            v3v1_i, v2v3_i, v3_i,       //Right triangle
                            v1v2_i, v2v3_i, v3v1_i );   //Center triangle
        }

        //Set the indices & vertices to the new arrays
        indices = newIndices;
        vertices = newVertices;
    }
    return {
        indices: indices,
        vertices: vertices,
    }
}
function moonGenerator(radius = 1, numDivisionSteps = 5, randomModifier = 0.05, randomModifierAttenuation = 2)
{
    const oceanPercent = 0.4;
    const sandPercent = 0.45;
    const forestPercent = 0.7;
    const highlandsPercent = 0.8;


    let ret = generateSphereMesh(numDivisionSteps);
    let vertices = ret.vertices;
    let indices = ret.indices;
    
    let maxRadius = 0;
    let minRadius = 10000;

    //Randomly modify world
    for (let i=0; i<vertices.length; i++)
    {
        let multiplier = 0;
        multiplier += randomModifier*0.3*perlin(vertices[i].mul(1.0).add( 4*perlin(vertices[i].mul(2.0))));
        multiplier += randomModifier*0.1*perlin(vertices[i].mul(10.0).add( 5*perlin(vertices[i].mul(2.0))));
        multiplier += randomModifier*0.05*perlin(vertices[i].mul(50.0).add( 10*perlin(vertices[i].mul(5.0))));
        multiplier += randomModifier*0.02*perlin(vertices[i].mul(300.0).add( 10*perlin(vertices[i].mul(5.0))));
        multiplier *= 1 - 0.5*perlin(vertices[i].mul(2.0)); // To make some regions flat...
        multiplier += 1.1;

        vertices[i].muli( radius );
        vertices[i].muli( multiplier );
        
        const r = vertices[i].getLength();
        if (r > maxRadius) {maxRadius = r;}
        if (r < minRadius) {minRadius = r;}
    }

    //Generate colors - ALSO modifies below-ocean vertice heights
    let normals = [];
    let colors = [];
    let slopes = [];
    let materials = [];
    for (let i=0; i<vertices.length; i++)
    {
        colors.push(null);
        normals.push(null);
        slopes.push(null);
        materials.push(null);
    }

    //Compute normals
    for (let i=0; i<indices.length; i+=3)
    {
        const v1 = vertices[indices[i  ]];
        const v2 = vertices[indices[i+1]];
        const v3 = vertices[indices[i+2]];
        const normal = computeNormal(v1,v2,v3);
        normal.a = 1;

        if   (normals[indices[i  ]] == null) { normals[indices[i  ]] = normal.copy();}
        else {normals[indices[i  ]].addi(normal);}

        if   (normals[indices[i+1]] == null) { normals[indices[i+1]] = normal.copy();}
        else {normals[indices[i+1]].addi(normal);}

        if   (normals[indices[i+2]] == null) { normals[indices[i+2]] = normal.copy();}
        else {normals[indices[i+2]].addi(normal);}
    }
    for (let i=0; i<normals.length; i++)
    {
        normals[i].muli( 1 / normals[i].a );
        normals[i].a = 0;
    }

    //Compute Colors and Materials
    for (let i=0; i<vertices.length; i++)
    {
        const radius = vertices[i].getLength();
        let desert = perlin(vertices[i]) - 0.5;
        // if (desert < 0) { desert = 0; }
        const percentRadius = (radius - minRadius) / (maxRadius - minRadius);
        if (percentRadius < oceanPercent)                    // WATER
        {
            colors[i] = new vec4(0.1,0.1,0.8, 2).mul(percentRadius/oceanPercent);
            materials[i] = new vec4(0.8,0.8,0,0);
        } else if (percentRadius < (sandPercent + desert))  // SAND/DESERT
        {
            colors[i] = new vec4(0.8, 0.7, 0.4, 3).mul(1 + sandPercent - percentRadius);
            materials[i] = new vec4(0.1,0,0,0);
        } else if (percentRadius < forestPercent)               // Forest
        {
            colors[i] = new vec4(0.1,1.0-percentRadius,0.1,3);
            materials[i] = new vec4(0,0,0,0);
        } else if (percentRadius < highlandsPercent)               // Mountains
        {
            colors[i] = new vec4(0.6,0.5,0.4,1);
            materials[i] = new vec4(0.1,0,0,0);
        } else {                                      //Snowy peaks
            colors[i] = new vec4(0.8,0.8,0.8,1);
            materials[i] = new vec4(0.3,0,0,0);
        }
    }


    // for (let k=0; k<vertices.length; k++)
    // {
    //     const radius = vertices[k].getLength();
    //     if (radius > (maxRadius+minRadius)*0.5 && r() > 0.9)
    //     {
    //         const ret = treeGenerator();
    //         const indOffset = vertices.length;
    //         for (let i=0; i<ret.vertices.length; i++)
    //         {
    //             vertices.push(ret.vertices[i]);
    //             normals.push(ret.normals[i]);
    //             colors.push(ret.colors[i]);
    //             materials.push(ret.materials[i]);
    //         }
    //         for (let i=0; i<ret.indices.length; i++)
    //         {
    //             indices.push(ret.indices[i] + indOffset);
    //         }
    //     }
    // }


    console.log("minR: ",minRadius,"\nmaxR: ",maxRadius);
    console.log("Num Triangles: ", indices.length/3);

    // const oceanRadius = 0.4  * (maxRadius - minRadius) + minR= (radius - minRadius);

    return {
        vertices: vertices,
        indices: indices,
        normals: normals,
        slopes: slopes,
        materials: materials,
        colors: colors,
        minRadius: minRadius,
        maxRadius: maxRadius,
        oceanRadius: 0.4 * (maxRadius-minRadius) + minRadius
    }
}
function oceanGenerator(numDivisions, radius)
{
    const waterColor = new vec4(0.1,0.1,0.7,0.7);
    const waterMaterial = new vec4(1,0.7,0,0);


    let vertices = [];
    let normals = [];
    let colors = [];
    let materials = [];
    let slopes = [];
    let indices = [];

    let ret = generateSphereMesh(numDivisions);
    for (let i=0; i<ret.indices.length; i+=3)
    {
        const indOffset = vertices.length;
        const v1 = ret.vertices[ret.indices[i  ]].mul(radius);
        const v2 = ret.vertices[ret.indices[i+1]].mul(radius);
        const v3 = ret.vertices[ret.indices[i+2]].mul(radius);
        vertices.push(v1,v2,v3);
        indices.push(indOffset, indOffset+1, indOffset+2);
        normals.push(v1.copy().scaleToUnit(), v2.copy().scaleToUnit(), v3.copy().scaleToUnit());
        materials.push(waterMaterial, waterMaterial, waterMaterial);
        colors.push(waterColor, waterColor, waterColor);
        slopes.push(0,0,0);
    }
    return {
        vertices: vertices,
        indices: indices,
        normals: normals,
        slopes: slopes,
        materials: materials,
        colors: colors,
    }
}
function atmosphereGenerator(numDivisions, maxRadius, minRadius, numSpheres=10)
{
    const airColor = new vec4(0.7,0.9,0.9,0.04);
    const airMaterial = new vec4(1,0,0,1);

    let vertices = [];
    let normals = [];
    let colors = [];
    let materials = [];
    let slopes = [];
    let indices = [];

    const numCloudLevels = 2;
    for (let j=0; j<numSpheres; j++)
    {
        // radiusMultiplier = radius * (0.8 + 0.2*j/numSpheres);
        const radiusMultiplier = maxRadius * (j/numSpheres) + minRadius*(1- j/numSpheres);
        const color = airColor.add(0.5 - 0.5*j/numSpheres, 0, 0, 0);
        let cloudModifier =  (Math.sin(-0.1 + numCloudLevels*3.14159265*j/numSpheres)) * (1-j/numSpheres);
        if (cloudModifier < 0) { cloudModifier = 0;}
        const material = new vec4(airMaterial.x, airMaterial.y, cloudModifier, airMaterial.a);
        const ret = generateSphereMesh(numDivisions);
        for (let i=0; i<ret.indices.length; i+=3)
        {
            const indOffset = vertices.length;
            const v1 = ret.vertices[ret.indices[i  ]].mul(radiusMultiplier);
            const v2 = ret.vertices[ret.indices[i+1]].mul(radiusMultiplier);
            const v3 = ret.vertices[ret.indices[i+2]].mul(radiusMultiplier);
            vertices.push(v1,v2,v3);
            indices.push(indOffset, indOffset+1, indOffset+2);
            normals.push(v1.copy().scaleToUnit(), v2.copy().scaleToUnit(), v3.copy().scaleToUnit());
            materials.push(material, material, material);
            colors.push(color, color, color);
            slopes.push(0,0,0);
        }
    }
    console.log(vertices.length);
    return {
        vertices: vertices,
        indices: indices,
        normals: normals,
        slopes: slopes,
        materials: materials,
        colors: colors,
    }
}
function cloudGenerator(numDivisions, minRadius, maxRadius) //unused...
{

    const cloudColor = new vec4(0.9,0.9,0.9,0.8);
    const cloudMaterial = new vec4(1,0,0,0);

    let vertices = [];
    let normals = [];
    let colors = [];
    let materials = [];
    let slopes = [];
    let indices = [];

    const ret = generateSphereMesh(numDivisions);
    for (let c=0; c<100; c++)
    {   
        const percent = r();
        const vec = new vec4(0.5 - r(), 0.5-r(), 0.5-r()).scaleToUnit().muli(minRadius*percent + maxRadius*(1-percent));
        const size = perlin(vec.mul(100))*0.3 + 0.01;
        const tempVertices = [];
        for (let i=0; i<ret.vertices.length; i++)
        {
            const v = ret.vertices[i].copy();
            let p = perlin(v.add(perlin(v.mul(2.2)))) + 0.3*perlin(v.mul(10)) + 0.1*perlin(v.mul(100));
            let d = v.copy().scaleToUnit().dot(vec);
            if (d<0){d=-d;}
            d = 1 - d*0.7;
            v.muli(d).muli(size).muli(p).addi(vec);
            tempVertices.push(v);
        }

        const vertexToIndexMap = new Map();
        for (let i=0; i<ret.indices.length; i+=3)
        {    
            let indOffset = vertices.length;
            const v1 = tempVertices[ret.indices[i  ]];
            const v2 = tempVertices[ret.indices[i+1]];
            const v3 = tempVertices[ret.indices[i+2]];

            let index;
            index = vertexToIndexMap[v1.getHash()]
            if (index != null) { indices.push(index); }
            else { vertexToIndexMap[v1.getHash()] = indOffset; indices.push(indOffset); 
                vertices.push(v1); 
                normals.push(v1.copy().scaleToUnit());
                materials.push(cloudMaterial);
                indOffset++;}
            
            index = vertexToIndexMap[v2.getHash()]
            if (index != null) { indices.push(index); }
            else { vertexToIndexMap[v2.getHash()] = indOffset; indices.push(indOffset); 
                vertices.push(v2); 
                normals.push(v2.copy().scaleToUnit());
                materials.push(cloudMaterial);
                indOffset++;}

            index = vertexToIndexMap[v3.getHash()]
            if (index != null) { indices.push(index); }
            else { vertexToIndexMap[v3.getHash()] = indOffset; indices.push(indOffset); 
                vertices.push(v3); 
                normals.push(v3.copy().scaleToUnit());
                materials.push(cloudMaterial);
                indOffset++;}

            // vertices.push(v1,v2,v3);
            // indices.push(indOffset, indOffset+1, indOffset+2);
            // normals.push(v1.copy().scaleToUnit(), v2.copy().scaleToUnit(), v3.copy().scaleToUnit());
            // materials.push(cloudMaterial, cloudMaterial, cloudMaterial);

            // const c1 = new vec4(cloudColor.x, cloudColor.y, cloudColor.z, cloudColor.a * perlin(v1.mul(30)));
            // const c2 = new vec4(cloudColor.x, cloudColor.y, cloudColor.z, cloudColor.a * perlin(v2.mul(30)));
            // const c3 = new vec4(cloudColor.x, cloudColor.y, cloudColor.z, cloudColor.a * perlin(v3.mul(30)));
            // colors.push(c1,c2,c3);
            colors.push(cloudColor, cloudColor, cloudColor);
            slopes.push(0,0,0);
        }
    }   
    console.log("len indices: ", indices.length, "\nlen vertices: ", vertices.length);
    return {
        vertices: vertices,
        indices: indices,
        normals: normals,
        slopes: slopes,
        materials: materials,
        colors: colors,
    }
}
function treeGenerator(moonVertices, minVerticeRadius)
{

    let vertices = [];
    let normals = [];
    let colors = [];
    let materials = [];
    let indices = [];

    // const ret = {
    //     vertices: [
    //         new vec4(0,0,0), new vec4(0,.1,0), new vec4(0,0,.1)
    //     ],
    //     normals: [
    //         new vec4(1,1,1), new vec4(1,1,1), new vec4(1,1,1)
    //     ],
    //     colors: [
    //         new vec4(0,1,0,1), new vec4(0,1,0,1), new vec4(0,1,0,1)
    //     ],
    //     materials:
    //     [
    //         new vec4(), new vec4(), new vec4()
    //     ],
    //     indices: [
    //         0,1,2, 0,2,1
    //     ]
    // }

    function pyramid(scale = 0.02)
    {
        const s = scale;
        return {
            vertices: [
                new vec4(0,s,0), new vec4(s,0,s), new vec4(s,0,-s), new vec4(-s,0,-s), new vec4(-s,0,s)
            ],
            normals: [
                new vec4(0,1,0), new vec4(1,1,1), new vec4(1,1,1), new vec4(1,1,1), new vec4(1,1,1), new vec4(1,1,1), 
            ],
            colors: [
                new vec4(0,1,0,1), new vec4(0,1,0,1), new vec4(0,1,0,1), new vec4(0,1,0,1),new vec4(0,1,0,1),
            ],
            materials:
            [
                new vec4(), new vec4(), new vec4(), new vec4(), new vec4()
            ],
            indices: [
                0,1,2, 0,2,1, 0,2,3, 0,3,2, 0,3,4, 0,4,3, 0,4,1, 0,1,4
            ]
        }
    }


    function getTree(vec)
    {
        let vertices = [];
        let normals = [];
        let colors = [];
        let materials = [];
        let indices = [];

        return pyramid();
    }
    

    for (let k=0; k<moonVertices.length; k++)
    {
        if (moonVertices[k].getLength() > minVerticeRadius && r() > 0.9)
        {
            const ret = getTree(moonVertices[k].copy());
            const indOffset = vertices.length;
            for (let i=0; i<ret.vertices.length; i++)
            {
                vertices.push(ret.vertices[i].add(moonVertices[k]));
                normals.push(ret.normals[i]);
                colors.push(ret.colors[i]);
                materials.push(ret.materials[i]);
            }
            for (let i=0; i<ret.indices.length; i++)
            {
                indices.push(ret.indices[i] + indOffset);
            }
        }
    }

    return {
        vertices: vertices,
        indices: indices,
        normals: normals,
        materials: materials,
        colors: colors,
    }
}
function atmosphereGenerator_Rays(numDivisions, radius)
{
    const airColor = new vec4(0.5,0.5,1,0.1);
    const airMaterial = new vec4(1,0.7,0,0);

    let vertices = [];
    let normals = [];
    let colors = [];
    let materials = [];
    let slopes = [];
    let indices = [];
    
    const numAngles = 100
    for (let j=0; j<numAngles; j++)
    {
        const a = j * Math.PI * 2 / numAngles; //a = angle
        const a2 = a + Math.PI;

        const v1 = new vec4(Math.sin(a), 1, Math.cos(a)).muli(radius);
        const v2 = new vec4(Math.sin(a2), 1, Math.cos(a2)).muli(radius);
        const v3 = new vec4(Math.sin(a), -1, Math.cos(a)).muli(radius);
        const v4 = new vec4(Math.sin(a2), -1, Math.cos(a2)).muli(radius);

        const indOffset = vertices.length;
        vertices.push(v1,v2,v3,v4, v1,v4,v3,v2);
        indices.push(indOffset, indOffset+1, indOffset+2,  indOffset, indOffset+2, indOffset+3,
            indOffset+4, indOffset+5, indOffset+6,  indOffset+4, indOffset+6, indOffset+7);
        const n = computeNormal(v1,v2,v3).muli(-1);
        const nn = n.mul(-1);
        normals.push(n, n, n, n, nn, nn, nn, nn);
        materials.push(airMaterial, airMaterial, airMaterial, airMaterial, airMaterial, airMaterial, airMaterial, airMaterial);
        colors.push(airColor, airColor, airColor, airColor, airColor, airColor, airColor, airColor);
    }
    console.log(vertices.length);
    return {
        vertices: vertices,
        indices: indices,
        normals: normals,
        slopes: slopes,
        materials: materials,
        colors: colors,
    }
}
function computeNormal(v1,v2,v3)
{
    const a = v2.sub(v1);
    const b = v3.sub(v1);
    // b.scaleToUnit();
    // a.scaleToUnit();
    return new vec4(
        a.y*b.z - a.z*b.y,
        a.z*b.x - a.x*b.z,
        a.x*b.y - a.y*b.x,
        0
    ).scaleToUnit();
}

function MoonGenerator2() {
    const canvasElementRef = useRef(null);
    const [gl, setGl] = useState(null);
    const [shaderData, setShaderData] = useState(null);
    const [depthShaderData, setDepthShaderData] = useState(null);
    const [cameraPosition, setCameraPosition] = useState(new vec4(0,0,-10));
    const [cameraRotation, setCameraRotation] = useState(new vec4(0,0,0));
    const [projectionMatrix, setProjectionMatrix] = useState(new mat4().makePerspective(0.2, 1, 1, 1000));
    const [startTimestamp, setStartTimestamp] = useState(Date.now());

    const [planetData, setPlanetData] = useState(null);
    const [lightDirection, setLightDirection] = useState(new vec4(1,1,1).scaleToUnit());
    const [ambientLightLevel, setAmbientLightLevel] = useState(0.001);
    const [keys, setKeys] = useState({});
    const [reflectance, setReflectance] = useState(0);

    const [planetGenRadius, setPlanetGenRadius] = useState(1);
    const [planetGenSubdivisions, setPlanetGenSubdivisions] = useState(7);
    const [planetGenRandomModifier, setPlanetGenRandomModifier] = useState(1);
    const [planetGenRandomModifierAttenuation, setPlanetGenRandomModifierAttenuation] = useState(1);
    const [planetGenNumAtmosphereLevels, setPlanetGenNumAtmosphereLevels] = useState(10);

    // Handle Initialization of Canvas, GL, and resizing
    useEffect(() => {
        console.log("Init")
        const canvasElement = canvasElementRef.current;
        const bb = canvasElement.getBoundingClientRect();
        canvasElement.width  = Math.round(bb.width);
        canvasElement.height = Math.round(bb.height);
        const newGL = canvasElement.getContext("webgl");
        setGl(newGL);
        setShaderData(initShader(newGL));
        setDepthShaderData(initDepthShader(newGL, canvasElement));
        setProjectionMatrix(new mat4().makePerspective(0.2, canvasElement.width/canvasElement.height, 1, 1000));

        function handleResize() {
            let bb = canvasElement.getBoundingClientRect();
            canvasElement.width  = Math.round(bb.width);
            canvasElement.height = Math.round(bb.height);
            setProjectionMatrix(new mat4().makePerspective(0.2, canvasElement.width/canvasElement.height, 1, 1000));
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [canvasElementRef]);

    // Handle key presses
    useEffect(() => {
        function handleKeyPress(e) {
            keys[e.key.toLowerCase()] = true;
            setKeys({...keys});
        }
        function handleKeyRelease(e) {
            keys[e.key.toLowerCase()] = false;
            setKeys({...keys});
        }
        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('keyup', handleKeyRelease);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('keyup', handleKeyRelease);
        }
    }, [keys]);


    // Update
    useEffect(() => {

        function update()
        {
            const canvasElement = canvasElementRef.current;
            const t = (Date.now() - startTimestamp) / 100;
            if (gl != null && canvasElement != null && shaderData != null)
            {
                if (planetData == null)
                {
                    setPlanetData(initPlanet(gl, planetGenRadius, planetGenSubdivisions, planetGenRandomModifier, planetGenRandomModifierAttenuation, planetGenNumAtmosphereLevels));
                    return;
                }
                // console.log("cameraPos: ",cameraPosition, cameraRotation);

                if (keys['w'] == true)
                {
                    if (keys['shift'] == true)
                    {
                        cameraPosition.z+=0.2;
                    } else {
                        cameraPosition.z+=0.05;
                    }
                } else if (keys['s'] == true)
                {
                    if (keys['shift'] == true)
                    {
                        cameraPosition.z-=0.2;
                    } else {
                        cameraPosition.z-=0.05;
                    }
                }
                if (keys['arrowup'])
                {
                    cameraRotation.z += 0.05;
                } else if (keys['arrowdown'])
                {
                    cameraRotation.z -= 0.05;
                }

                if (keys['a'] == true)
                {
                    setReflectance(reflectance+0.1);
                } else if (keys['d'] == true)
                {
                    setReflectance(reflectance-0.1);
                }


                // lightDirection.x = (Math.cos(t/40));
                // lightDirection.z = (Math.sin(t/40));
                lightDirection.scaleToUnit();
                planetData.rotation.y = t/400;

                //Clear canvas and render object
                clear(gl, canvasElement, new vec4(0,0,0,1));

                //renderDepth(gl, depthShaderData, projectionMatrix, cameraPosition, cameraRotation, planetData);

                //Render
                // render(gl, shaderData, projectionMatrix, cameraPosition, cameraRotation, 
                //     planetData,
                //     lightDirection.scaleToUnit(), ambientLightLevel,
                //     colorModifierVector, colorNoiseOffsetVector, normalModifierVector, normalNoiseOffsetVector);
                for (let i=0; i<planetData.buffers.length; i++)
                {
                    renderObject(gl, shaderData.programInfo, projectionMatrix, cameraPosition, cameraRotation, 
                        planetData.position, planetData.rotation, null, planetData.buffers[i].verticesBuffer, planetData.buffers[i].normalsBuffer, planetData.buffers[i].colorsBuffer, planetData.buffers[i].materialsBuffer, planetData.buffers[i].indicesBuffer, planetData.buffers[i].indices.length, 
                        lightDirection.scaleToUnit(), ambientLightLevel);
                }
                // planetData2.position = new vec4(1,0,0);
                // render(gl, shaderData, projectionMatrix, cameraPosition, cameraRotation, 
                //     planetData2,
                //     lightDirection.scaleToUnit(), ambientLightLevel,
                //     colorModifierVector, colorNoiseOffsetVector, normalModifierVector, normalNoiseOffsetVector);
            }
        }
        update();
        const interval = setInterval(update, 1000/20);
        return () => clearInterval(interval);
    }, [gl, canvasElementRef, keys, planetData, cameraPosition, cameraRotation, lightDirection, reflectance, ambientLightLevel, projectionMatrix, shaderData, startTimestamp, planetGenRadius, planetGenSubdivisions, planetGenRandomModifier, planetGenRandomModifierAttenuation, planetGenNumAtmosphereLevels]);

    

    useEffect(() => {
        setPlanetData(null);
    }, [planetGenRadius, planetGenSubdivisions, planetGenRandomModifier, planetGenRandomModifierAttenuation, planetGenNumAtmosphereLevels]);
    return (
        <div className="project-page">
            <div style={{'textAlign': 'center'}}>
                <h1>Planet Generator</h1>
            </div>
            <div style={{display: 'block', position: 'relative', minHeight: 'fit-content', width: '99vw', height: '89vh', marginLeft: 'auto', marginRight: 'auto'}}>
                <div style={{'display': 'block', 'position': 'absolute', 'top': '0', 'left': '0', zIndex: 200, 'padding': '0.3rem', 'margin':'0.3rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.4rem'}}>
                    <table>
                        <tbody>
                            <tr>
                                <td colSpan={2} style={{'textAlign': 'center', 'color': 'white'}}>
                                    Lighting
                                </td>
                            </tr>
                            <tr>
                                <td>Light Direction</td>
                                <td>
                                    <div><input type="range" min="-1" max="1" step="0.01" value={lightDirection.x} onChange={(e) => setLightDirection(new vec4(e.target.value, lightDirection.y, lightDirection.z))}/></div>
                                    <div><input type="range" min="-1" max="1" step="0.01" value={lightDirection.y} onChange={(e) => setLightDirection(new vec4(lightDirection.x, e.target.value, lightDirection.z))}/></div>
                                    <div><input type="range" min="-1" max="1" step="0.01" value={lightDirection.z} onChange={(e) => setLightDirection(new vec4(lightDirection.x, lightDirection.y, e.target.value))}/></div>
                                </td>
                            </tr>
                            <tr>
                                <td>Ambient Light Level</td>
                                <td>
                                    <div><input type="range" min="-1" max="1" step="0.001" value={ambientLightLevel} onChange={(e) => setAmbientLightLevel(e.target.value)}/></div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{'textAlign': 'center', 'color': 'white'}}>
                                    Planet Generation
                                </td>
                            </tr>
                            <tr>
                                <td>Planet Radius</td>
                                <td><input type="range" min="0" max="10" step="0.01" value={planetGenRadius} onChange={(e) => setPlanetGenRadius(e.target.value)}/></td>
                            </tr>
                            <tr>
                                <td>Planet Subdivisions</td>
                                <td><input type="range" min="0" max="8" step="1" value={planetGenSubdivisions} onChange={(e) => setPlanetGenSubdivisions(e.target.value)}/></td>
                            </tr>
                            <tr>
                                <td>Planet Random Modifier</td>
                                <td><input type="range" min="0" max="10" step="0.01" value={planetGenRandomModifier} onChange={(e) => setPlanetGenRandomModifier(e.target.value)}/></td>
                            </tr>
                            <tr>
                                <td>Planet Random Modifier Attenuation</td>
                                <td><input type="range" min="0" max="10" step="0.01" value={planetGenRandomModifierAttenuation} onChange={(e) => setPlanetGenRandomModifierAttenuation(e.target.value)}/></td>
                            </tr>
                            <tr>
                                <td>Planet Num Atmosphere Levels</td>
                                <td><input type="range" min="0" max="10" step="0.01" value={planetGenNumAtmosphereLevels} onChange={(e) => setPlanetGenNumAtmosphereLevels(e.target.value)}/></td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{'textAlign': 'center'}}>
                                    <button onClick={() => {randomPerlinOffset = Math.random(); setPlanetData(null);}}>Randomize Perlin Offset</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <canvas style={{'display': 'block', 'position': 'absolute', 'top': '0', 'left': '0', 'width': '100%', 'height': '100%'}} ref={canvasElementRef}></canvas>
            </div>
            <div style={{'padding': '10%', 'padding-top': '1%'}}>
                I have always been interested in procedurally generated terrain and objects, but never really knew where to start. While browsing the internet 
                one day I came across a cartoon-ish rendering of Earth, inspiring me to experiment with planet generation.
                <br/><br/>
                For this project I learned WebGL as opposed to basic html contexts for increased performace, as I knew I would likely need to render thousands of triangles each frame (30 times per second).
                WebGL requires all object models to be defined in the vertice-indice model, where vertices are 3d points in space and the indices are triples of vertice indexes defining triangles.
                <br/><br/>
                To generate the spherical planet I started with an octohedron, and iteratively subdivided each triangle into four smaller triangles. At the end of each division iteration, 
                each vertex was normalized to scale it all to a unit sphere.
                <br/><br/>
                Now, to modify the sphere and color it accordingly, I experimented with a few different methods. First, I tried to randomly extend or contract each vertex, and 
                was left with a fuzzy little sphere which didn't look at all like a planet. Second, I experimented with pushing regions in or out of varying sizes 
                with the hope of producing mountain ranges and canyons and such. This method did work, but the runtime was too long for my liking (>10 seconds for small planets).
                Third, I implemented a basic pseudo-random number generator/hasher and with that perlin noise. By layering a multiple differnet frequencies of perlin noise 
                and offsetting each layer with more random noise, I was able to produce what you now see in the rendering.
                <br/><br/>
                To color the now lumpy sphere I found the minimum and maximum vertex heights and scaled a color gradient to fit within the range. Thus, in two loops I could color
                each vertex, producing a earth-like model.
                <br/><br/>
                Along with coloring, I also added perlin noise in the fragment shader to each surface to modify the normal vectors and colors. This greatly
                improved the perceived resolution with minimal computational cost.
                <br/><br/>
                As for the oceans, I decided to split the model and generate a smooth, semi-transparent blue sphere to go over the existing model. This, with the 
                addition of some elongated noise, produces the appearance of an ocean. Unfortunately, I have not yet implemented depth testing, thus the water is the same 
                color regardless of depth and viewing angle.
                <br/><br/>
                Overall, I am satisfied with the planet, although in the future I would like to add an atmosphere and a better ocean.
            </div>
        </div>
    )
}

export default MoonGenerator2;