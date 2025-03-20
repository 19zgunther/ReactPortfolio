

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
const pseudoRandomInput1 = Math.random();
const pseudoRandomInput2 = Math.random();

//PERLIN NOISE FUNCTIONS
function pseudoRandom(vector3 = new vec4()) {
    const val = Math.sin(vector3.x*13.9898*pseudoRandomInput1 + vector3.y+78.233 + vector3.z*30.5489) * 43758.5453123*pseudoRandomInput2;
    return val - Math.floor(val);
}
function pseudoRandom3(x,y,z) {
    const val = Math.sin(x*13.9898*pseudoRandomInput1 + y+78.233 + z*30.5489) * 43758.5453123*pseudoRandomInput2;
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
    return new vec4(noise(p), noise(p.add(100.0)), noise(p.add(200.0)));
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




function initDepthShader(gl)//initialize the default shader
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
function renderDepth(gl, shaderData, projectionMatrix=new mat4(), cameraPosition=new vec(), cameraRotation=new vec4(), objectData = {})
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


    `+noiseFunctions+`


    void main() {

        vec3 normal = surfaceNormal;
        vec3 color = surfaceColor.xyz;


        if (surfaceMaterial.y > 0.001)
        {
            normal *= (1.0-surfaceMaterial.y) + surfaceMaterial.y*noise3d(modelPos*100.0 + 200.0*noise(modelPos*2.0));
            normal *= (1.0-surfaceMaterial.y) + surfaceMaterial.y*noise3d(modelPos*30.0 + noise(modelPos*2.0));
        }

        normal = normalize(normal);


        // color *= 0.8 + 0.2*noise(modelPos*200.0 + noise(modelPos*10.0));

        
        //Compute fragment illumination
        float illumination = dot(uLightDirectionVector.xyz, normal) * 0.8 + 0.2;

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

        gl_FragColor = vec4(color * illumination + spec*vec3(1,1,1), surfaceColor.a);
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
        },
    };
    return {
        shaderProgram: shaderProgram,
        programInfo: programInfo,
    }
}
function render(gl, shaderData, projectionMatrix=new mat4(), cameraPosition=new vec(), cameraRotation=new vec4(), objectData = {},
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

        //RENDER////////////////////////////////////////////////
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
}
function clear(gl, clearColor = null) //Clear the screen to default color
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



function initObjectBuffers(gl, vertices_=[], normals_=[], colors_=[], materials_=[], indices_=[])
{

    let ind = [];
    let nor = [];
    let vert = [];
    let col = [];
    let mat = [];

    if (indices_.length > 30000)
    {
        let indOffset = 0;

        let tempIndices = [];
        let tempVertices =[];
        let tempColors = [];
        let tempNormals = [];
        let tempMaterials = [];
        for (let i=0; i<indices_.length; i+=3)
        {
            if (tempVertices.length > 30000)
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
        }
    } else {
        ind.push(indices_);
        vert.push(vertices_);
        col.push(colors_);
        nor.push(normals_);
        mat.push(materials_);
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
function initPlanet(planetSubdivision=5, randomModifier=0.2, randomModifierAttenuation=1.8)
{
    const moon = moonGenerator(planetSubdivision, randomModifier, randomModifierAttenuation);
    const ocean = oceanGenerator(5, moon.minRadius/2 + moon.maxRadius/2);
    
    const moonBuffers = initObjectBuffers(gl, moon.vertices, moon.normals, moon.colors, moon.materials, moon.indices);
    const oceanBuffers = initObjectBuffers(gl, ocean.vertices, ocean.normals, ocean.colors, ocean.materials, ocean.indices);
    
    planetData = {
        position: new vec4(),
        rotation: new vec4(),

        buffers: [
            moonBuffers, oceanBuffers
        ]
    }
}



//Get canvasElement Html object from document, resize accordingly, and get webgl context

const canvasElement = document.getElementById("glcanvas");
let bb = canvasElement.getBoundingClientRect();
canvasElement.width  = Math.round(bb.width);
canvasElement.height = Math.round(bb.height);
const gl = canvasElement.getContext("webgl");



//Init ShaderData & Camera
const shaderData = initShader(gl);
const depthShaderData = initDepthShader(gl);
const cameraPosition = new vec4(0,0,-10);
const cameraRotation = new vec4(0,0,0);
const projectionMatrix = new mat4().makePerspective(0.2, canvasElement.width/canvasElement.height, 1, 1000);


//Generate Planet and Init Buffers
var planetData = {};

const lightDirection = new vec4(1,1,1).scaleToUnit();
const ambientLightLevel = 0.3;

const colorModifierVector = new vec4(1,0,0.5,0);
const normalModifierVector = new vec4(1,0,0.5,0);
const normalNoiseOffsetVector = new vec4(0,0,0,0);
const colorNoiseOffsetVector = new vec4(0,0,0,0);
handleInputs();
handleInputs_planetGen();
function handleInputs()
{
    // if (document.getElementById("colorModifierCheckbox").checked)
    // {
    //     // colorModifierVector.x = document.getElementById("colorModifierXSlider").value;
    //     // colorModifierVector.y = document.getElementById("colorModifierYSlider").value;
    //     // colorModifierVector.z = document.getElementById("colorModifierZSlider").value;
    //     // colorModifierVector.a = document.getElementById("colorModifierASlider").value;

    //     // colorNoiseOffsetVector.x = document.getElementById("colorRandomOffsetXSlider").value;
    //     // colorNoiseOffsetVector.y = document.getElementById("colorRandomOffsetYSlider").value;
    //     // colorNoiseOffsetVector.z = document.getElementById("colorRandomOffsetZSlider").value;
    //     // colorNoiseOffsetVector.a = document.getElementById("colorRandomOffsetASlider").value;
    // } else {
    //     colorModifierVector.set(0,0,0,0);
    // }
    
    // if (document.getElementById("normalModifierCheckbox").checked)
    // {
    //     // normalModifierVector.x = document.getElementById("normalModifierXSlider").value;
    //     // normalModifierVector.y = document.getElementById("normalModifierYSlider").value;
    //     // normalModifierVector.z = document.getElementById("normalModifierZSlider").value;
    //     // normalModifierVector.a = document.getElementById("normalModifierASlider").value;
 
    //     // normalNoiseOffsetVector.x = document.getElementById("normalRandomOffsetXSlider").value;
    //     // normalNoiseOffsetVector.y = document.getElementById("normalRandomOffsetYSlider").value;
    //     // normalNoiseOffsetVector.z = document.getElementById("normalRandomOffsetZSlider").value;
    //     // normalNoiseOffsetVector.a = document.getElementById("normalRandomOffsetASlider").value;
    // } else {
    //     normalModifierVector.set(0,0,0,0);
    // }
}
function handleInputs_planetGen()
{
    setRandomSeed(0);
    initPlanet(7,1,1.5);
}


var keys = {};
window.onkeydown = function (e) { keys[e.key.toLowerCase()] = true; }
window.onkeyup = function(e) { keys[e.key.toLowerCase()] = false; }


///Update Function 
setInterval(update, 70);
let t = 0;
let lightDir = new vec4(1,0,0);
let reflectance = 0;
function update()
{
    t++;

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
        reflectance += 0.1;
    } else if (keys['d'] == true)
    {
        reflectance -= 0.1;
    }

    lightDirection.x = (Math.cos(t/20));
    lightDirection.z = (Math.sin(t/20));
    lightDirection.scaleToUnit();
    planetData.rotation.y = t/200;

    //Clear canvas and render object
    clear(gl, new vec4(0,0,0,1));

    //renderDepth(gl, depthShaderData, projectionMatrix, cameraPosition, cameraRotation, planetData);

    //Render
    render(gl, shaderData, projectionMatrix, cameraPosition, cameraRotation, 
        planetData,
        lightDirection.scaleToUnit(), ambientLightLevel,
        colorModifierVector, colorNoiseOffsetVector, normalModifierVector, normalNoiseOffsetVector);
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

function moonGenerator(numDivisionSteps = 7, randomModifier = 0.05, randomModifierAttenuation = 2)
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
        let multiplier = 1;
        multiplier += randomModifier*0.3*perlin(vertices[i].mul(1.0).add( 10*perlin(vertices[i].mul(2.0))));
        multiplier += randomModifier*0.1*perlin(vertices[i].mul(10.0).add( 30*perlin(vertices[i].mul(2.0))));
        multiplier += randomModifier*0.05*perlin(vertices[i].mul(50.0).add( 100*perlin(vertices[i].mul(5.0))));
        multiplier += randomModifier*0.03*perlin(vertices[i].mul(300.0).add( 100*perlin(vertices[i].mul(5.0))));
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
        const desert = perlin(vertices[i]) > 0.7 ? true : false;
        const percentRadius = (radius - minRadius) / (maxRadius - minRadius);
        if (percentRadius < oceanPercent)                    // WATER
        {
            colors[i] = new vec4(0.1,0.1,0.8, 2).mul(percentRadius/oceanPercent);
            materials[i] = new vec4(0.1,0.8,0,0);
        } else if (percentRadius < sandPercent || desert)  // SAND/DESERT
        {
            colors[i] = new vec4(0.9, 0.8, 0.4, 3).mul(1 + sandPercent - percentRadius);
            materials[i] = new vec4(0.2,0.1,0,0);
        } else if (percentRadius < forestPercent)               // Forest
        {
            colors[i] = new vec4(0.1,0.8,0.1,3).mul((1-percentRadius) / forestPercent);
            materials[i] = new vec4(0,0.4,0,0);
        } else if (percentRadius < highlandsPercent)               // Mountains
        {
            colors[i] = new vec4(0.6,0.5,0.4,1);
            materials[i] = new vec4(0.1,0.4,0,0);
        } else {                                      //Snowy peaks
            colors[i] = new vec4(0.8,0.8,0.8,1);
            materials[i] = new vec4(0.8,0.7,0,0);
        }
    }

    console.log("minR: ",minRadius,"\nmaxR: ",maxRadius);

    console.log("Num Triangles: ", indices.length/3);

    return {
        vertices: vertices,
        indices: indices,
        normals: normals,
        slopes: slopes,
        materials: materials,
        colors: colors,
        minRadius: minRadius,
        maxRadius: maxRadius,
    }
}

function oceanGenerator(numDivisions, radius)
{
    const waterColor = new vec4(0.1,0.1,0.7,0.4);
    const waterMaterial = new vec4(1,0.7,0,0);


    let vertices = [];
    let normals = [];
    let colors = [];
    let materials = [];
    let slopes = [];
    let indices = [];

    ret = generateSphereMesh(numDivisions);
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
