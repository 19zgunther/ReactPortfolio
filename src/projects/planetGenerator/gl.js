


var defaultShaderProgram;
var defaultProgramInfo;

var textShaderProgram;
var textProgramInfo;

var textureShaderProgram;
var textureProgramInfo;




//BUFFERS//////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
function initBuffers(vertices, normals, colors, indices) {
    const verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const colorsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


    return {
        vertices: verticesBuffer,
        normals: normalsBuffer,
        colors: colorsBuffer,
        indices: indicesBuffer,
    };
}

function initBuffersForText(vertices, indices)
{
    const verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);

    return {
        vertices: verticesBuffer,
        indices: indicesBuffer,
    };
}


//Init shaders//////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
function InitShader(gl)
{
    [defaultShaderProgram, defaultProgramInfo] =  initDefaultShaderProgram(gl);
    [textShaderProgram, textProgramInfo] =  initTextShaderProgram(gl);
    [textureShaderProgram, textureProgramInfo] =  initTextureShaderProgram(gl);
}

// creates a shader of the given type, uploads the source and compiles it.
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initDefaultShaderProgram(gl) {
    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aNormalVector;
    attribute vec4 aColor;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uObjectPositionMatrix;
    uniform mat4 uObjectRotationMatrix;

    varying highp vec4 color;
    varying highp vec4 vertexPos;


    void main() {
        vec4 vPos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
        gl_Position = uProjectionMatrix * uViewMatrix * uObjectPositionMatrix * uObjectRotationMatrix * vPos;

        float vari = dot(vec4( 0.6, 0.2, 0.78, 0), uObjectRotationMatrix * aNormalVector);
        vari += 0.01;
        vari = vari*vari*vari;
        //vari = vari * (1.0-fract(sin(vPos.x)*49284.38272)/10.0);
        if (vari < 0.1)
        {
            vari = 0.1;
        }
        if (vari > 10.01 && aColor.z > 0.6 && aColor.x < 0.5) {
            color.x = 0.9;
            color.y = 0.7;
            color.z = 0.2;
        } else {
            color.x = aColor.x * vari;
            color.y = aColor.y * vari;
            color.z = aColor.z * vari;
        }
        color.a = 1.0;

        vertexPos = vPos;
    }
    `;
    const fsSource = `
    precision mediump float;

    varying vec4 color;
    varying vec4 vertexPos;


    void main() {
        //gl_FragColor = color + vec4(fract(vertexPos.x/100.0), fract(vertexPos.y/100.0), fract(vertexPos.z/100.0), 1.0)/10.0;
        //gl_FragColor = color + vec4(fract(sin(vertexPos.x*22.5392)), fract(sin(vertexPos.y*3.5392)), fract(sin(vertexPos.z*4.539)), 1.0)/10.0;
        gl_FragColor = color;
    }
    `;
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }


    const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexLocation: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
          normalLocation: gl.getAttribLocation(shaderProgram, 'aNormalVector'),
          colorLocation: gl.getAttribLocation(shaderProgram, 'aColor'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
          viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
          objectPositionMatrix: gl.getUniformLocation(shaderProgram, 'uObjectPositionMatrix'),
          objectRotationMatrix: gl.getUniformLocation(shaderProgram, 'uObjectRotationMatrix'),
        },
    };


    return [shaderProgram, programInfo]
}

function initTextShaderProgram(gl) {
    const vsSource = `
    attribute vec4 aVertexPosition;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uObjectMatrix;
    uniform vec4 uTextOffset;
    uniform vec4 uScaleVector;

    void main() {
        vec4 vPos = vec4(aVertexPosition.x + uTextOffset.x, aVertexPosition.y + uTextOffset.y, aVertexPosition.z + uTextOffset.z, 1.0) * uScaleVector;
        gl_Position = uProjectionMatrix * uViewMatrix * uObjectMatrix * vPos;
    }
    `;
    const fsSource = `
    precision mediump float;
    uniform vec4 uColorVector;
    void main() {
        gl_FragColor = uColorVector;
    }
    `;
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }


    const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexLocation: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
          viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
          objectMatrix: gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
          colorVector: gl.getUniformLocation(shaderProgram, 'uColorVector'),
          scaleVector: gl.getUniformLocation(shaderProgram, 'uScaleVector'),
          textOffset: gl.getUniformLocation(shaderProgram, 'uTextOffset'),
        },
    };


    return [shaderProgram, programInfo]
}




//Render & Drawing //////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

//Used for rendering tringles or lines
function DrawDefault(gl, projectionMatrix, viewMatrix, objectPositionMatrix, objectRotationMatrix, indices, buffers, drawTriangles = true)
{
    var programInfo = defaultProgramInfo;

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    {
        const numComponents = 3  // pull out 3 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);
    }
    {
        const numComponents = 3  // pull out 3 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normals);
        gl.vertexAttribPointer(programInfo.attribLocations.normalLocation, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.normalLocation);
    }
    {
        const numComponents = 4;  // pull out 4 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colors);
        gl.vertexAttribPointer(programInfo.attribLocations.colorLocation, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.colorLocation);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,  false, projectionMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, viewMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectPositionMatrix, false, objectPositionMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectRotationMatrix, false, objectRotationMatrix.getFloat32Array());

    const vertexCount = indices.length;
    if (drawTriangles == true)
    {
        gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);
    } else {
        gl.drawElements(gl.LINES, vertexCount, gl.UNSIGNED_SHORT, 0);
    }
}

function DrawText(gl, projectionMatrix, viewMatrix, objectMatrix, buffers, textColor = new vec4(255,0,0,255), text = "default_text", textScale = new vec4(1,1,1,1), spacing = 0.1)
{
    var programInfo = textProgramInfo;

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    
    //Bind Vertices
    {
        const numComponents = 3  // pull out 3 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);
    }

    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,  false, projectionMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, viewMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectMatrix, false, objectMatrix.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.colorVector, textColor.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.scaleVector, textScale.getFloat32Array());

    //For each letter...
    var xpos = 0;
    for (var i=0; i<text.length; i++)
    {
        var letter = text[i];
        var ascii = letter.charCodeAt(0);

        const indices = asciiIndices[ascii];

        //Bind Indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
        
        //Set Position (move over a 0.5)
        gl.uniform4fv(programInfo.uniformLocations.textOffset, ( new vec4(xpos,0,0,0) ).getFloat32Array());

        if (indices == null) { console.error("Cannot find ascii char - code: " + ascii); continue;}
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        xpos += asciiWidths[ascii] + spacing;
    }
}

function DrawBakedText(gl, projectionMatrix, viewMatrix, objectMatrix, buffers, indices, textColor = new vec4(255,0,0,255), textScale = new vec4(1,1,1,1))
{
    var programInfo = textProgramInfo;

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    
    //Bind Vertices
    {
        const numComponents = 3  // pull out 3 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);
    }

    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,  false, projectionMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, viewMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectMatrix, false, objectMatrix.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.colorVector, textColor.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.scaleVector, textScale.getFloat32Array());



    //Bind Indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    
}










//This is all used for Text. It contains all of the triangles necessary for creating each ascii shape
const asciiVertices = [
    0,-0.2,0,0,-0.1,0,0,0,0,0,0.1,0,0,0.2,0,0,0.3,0,0,0.4,0,0,0.5,0,0,0.6,0,0,0.7,0,0,0.8,0,0.1,
    -0.2,0,0.1,-0.1,0,0.1,0,0,0.1,0.1,0,0.1,0.2,0,0.1,0.3,0,0.1,0.4,0,0.1,0.5,0,0.1,0.6,0,0.1,0.7,
    0,0.1,0.8,0,0.2,-0.2,0,0.2,-0.1,0,0.2,0,0,0.2,0.1,0,0.2,0.2,0,0.2,0.3,0,0.2,0.4,0,0.2,0.5,0,
    0.2,0.6,0,0.2,0.7,0,0.2,0.8,0,0.3,-0.2,0,0.3,-0.1,0,0.3,0,0,0.3,0.1,0,0.3,0.2,0,0.3,0.3,0,0.3,
    0.4,0,0.3,0.5,0,0.3,0.6,0,0.3,0.7,0,0.3,0.8,0,0.4,-0.2,0,0.4,-0.1,0,0.4,0,0,0.4,0.1,0,0.4,0.2,
    0,0.4,0.3,0,0.4,0.4,0,0.4,0.5,0,0.4,0.6,0,0.4,0.7,0,0.4,0.8,0
];

const asciiIndices = [
    null,null,null,null,null,null,null,null,null,null,  //0-9
    null,null,null,null,null,null,null,null,null,null,  //10 - 19
    null,null,null,null,null,null,null,null,null,null,  //20 - 29
    null,null,  //30 - 31

    [], // (Space)
    [3,2,13,13,14,3,4,15,21,21,10,4], // !    
    [8,21,32,32,19,8,30,43,54,54,41,30], // "
    [2,20,31,31,13,2,24,42,53,53,35,24,7,51,50,50,6,7,5,49,48,48,4,5], //#
    null,
    [8,7,18,18,19,8,37,36,47,47,48,37,42,2,13,13,53,42], //% 
    null, // &
    [21,8,19,19,32,21], // '
    [7,4,13,13,20,7,20,32,31,31,19,20,13,23,24,24,14,13], // (
    [13,26,29,29,20,13,20,10,9,9,19,20,1,13,2,2,14,13], // )
    [7,21,19,19,29,21,19,9,20,19,31,20], //*
    [6,39,38,38,5,6,18,15,26,26,29,18], // +
    [14,2,1,14,25,24,1,24,14], // ,
    [6,39,38,38,5,6], // -
    [3,14,13,13,2,3], // .
    [1,43,54,54,12,1], //  /

    //Numbers: 48-57
    [13,3,9,9,21,13,21,43,53,53,9,21,53,47,35,35,43,53,47,3,13,13,35,47], //0
    [8,9,21,21,32,8,32,24,13,13,21,32,3,36,35,35,2,3], //1
    [46,2,3,3,47,46,3,52,51,51,2,3,51,53,43,43,39,51,43,21,9,9,53,43,21,9,8,8,19,21], //2
    [4,15,13,13,3,4,3,47,35,35,13,3,8,9,21,21,19,8,9,21,43,43,53,9,53,51,39,39,43,53,47,49,39,39,35,47,40,28,38], //3
    [10,6,17,17,21,10,43,35,46,46,54,43,50,6,7,7,51,50], //4
    [9,53,54,54,10,9,10,6,17,17,21,10,7,40,50,50,6,7,50,47,35,35,40,50,35,13,3,3,47,35,3,4,15,15,13,3],//5
    [3,47,35,35,13,3,3,6,18,18,40,50,50,6,18,18,13,3,50,47,35,35,40,50,17,43,32,32,6,17], //6
    [10,54,53,53,9,10,53,24,13,13,42,53],//7
    [9,21,43,43,53,9,9,7,17,17,21,9,7,51,39,39,17,7,39,43,53,53,51,39,18,6,3,3,13,18,40,50,47,47,35,40,3,47,35,35,13,3],//8
    [17,7,9,9,21,17,21,43,53,53,9,21,53,51,39,39,43,53,39,17,7,7,51,39,51,24,13,13,40,51], //9
    

    //Special characters 58-64
    [7,6,17,17,18,7,15,4,3,3,15,14], // :
    [3,15,12,12,1,3,7,6,17,17,18,7], // ;
    [6,51,52,6,49,48,49,17,6,17,51,6], // <
    [50,6,7,7,51,50,49,5,4,4,48,49], // = 
    [8,50,7,50,5,4,7,39,50,39,5,50], // >
    [18,7,9,9,21,18,21,43,53,53,9,21,53,51,39,39,43,53,40,37,26,26,28,40,25,24,35,36,25,35], // ?
    [48,53,43,43,38,48,43,21,9,9,53,43,9,2,12,12,21,9,2,46,34,34,12,2,28,26,48,48,39,28], //@

    //Uppercase Letters: 65-90
    [2,21,32,32,13,2,43,46,35,35,32,43,21,43,31,17,39,38,38,16,17], // A
    [10,2,13,13,21,10,10,43,53,53,9,10,53,51,39,39,43,53,39,49,47,47,35,39,35,2,3,3,47,35,7,40,39,39,6,7], //B
    [9,21,43,43,53,9,53,52,41,41,43,53,21,13,3,3,9,21,3,47,35,35,13,3,47,48,37,37,35,47], // C
    [10,2,13,13,21,10,52,47,35,35,2,3,3,47,35,41,52,35,10,32,42,42,9,10,42,52,41,41,31,42], //D
    [54,10,9,9,53,54,10,2,13,13,21,10,3,47,46,46,2,3,6,39,38,38,5,6], //E
    [2,10,21,21,13,2,10,54,53,53,9,10,6,39,38,38,5,6], //F
    [52,41,42,52,53,42,53,43,21,9,21,53,9,3,13,13,20,9,3,47,35,35,13,3,27,49,48,48,26,27,37,35,46,46,48,37], //G
    [10,21,13,13,2,10,6,50,49,49,5,6,43,35,46,46,54,43], //H
    [21,13,24,24,32,21,10,43,42,42,9,10,3,36,35,35,2,3], //I
    [10,54,53,53,9,10,43,36,24,24,32,43,24,13,3,3,36,24,3,4,15,15,13,3], //J
    [10,2,13,13,21,10,38,35,46,38,48,46,48,8,7,7,47,48,43,41,53,53,54,43,53,5,6,6,54,53], // K
    [10,2,13,13,21,10,3,47,46,46,2,3], //L
    [2,10,21,21,13,2,35,43,54,54,46,35,21,29,18,29,43,40,18,27,40], //M
    [13,21,10,10,2,13,54,46,35,35,43,54,21,46,35,35,10,21], //N
    [3,13,35,35,47,3,3,9,21,21,13,3,21,43,53,53,9,21,53,47,35,35,43,53], //O
    [10,2,13,13,21,10,10,43,53,53,9,10,53,51,39,39,43,53,39,6,7,7,51,39], //p
    [24,48,37,37,13,24,3,36,24,24,13,3,3,9,21,21,13,3,21,43,53,53,9,21,53,48,37,37,43,53,27,47,46,46,26,27], //Q
    [10,2,13,13,21,10,10,43,53,53,9,10,53,51,39,39,43,53,39,6,7,7,51,39,39,49,46,46,35,39,28,38,39], //R
    [53,43,21,53,9,21,3,13,35,35,47,3,9,7,17,17,21,9,47,49,39,39,35,47,38,17,18,18,39,38,14,4,3,42,52,53], //S
    [10,54,53,53,9,10,32,24,35,35,43,32], //T
    [10,3,13,13,21,10,13,46,47,47,3,13,46,54,43,43,35,46], //U
    [10,24,35,35,21,10,24,43,54,54,35,24], //V
    [10,2,13,13,21,10,43,35,46,46,54,43,13,26,15,26,35,37,15,28,37], //W
    [21,46,35,35,10,21,43,2,13,13,54,43], //X
    [24,28,39,39,35,24,28,10,21,21,39,28,39,54,43,43,28,39], //Y
    [10,54,53,53,9,10,53,14,3,3,42,53,3,2,46,46,47,3], //Z


    //91-96
    [31,32,10,10,9,31,10,1,12,12,21,10,2,24,23,23,1,2], // [
    [10,21,34,34,23,10], // \
    [10,32,31,31,9,10,32,23,12,12,21,32,2,24,23,23,1,2], // ]
    [9,8,21,21,20,8,20,30,31,31,21,20], // ^
    [2,46,45,45,1,2], // _
    [10,19,30,30,21,10], // `

    //Lowercase letters: 97-122
    [46,50,40,40,35,46,35,13,3,3,47,35,40,18,6,6,50,40,3,4,16,16,13,3,16,49,48,48,4,16], //a
    [10,2,13,21,10,13,7,40,50,50,6,7,50,47,35,35,40,50,35,2,3,3,47,35],     //b
    [50,6,18,18,40,50,3,47,35,35,13,3,13,18,6,6,3,13],   //c
    [46,54,43,43,35,46,46,13,3,3,47,46,3,6,18,18,13,3,18,51,50,50,6,18], //d
    [47,3,13,13,35,47,13,3,6,6,18,13,18,40,50,50,6,18,50,49,37,37,40,50,37,4,5,5,49,37], //e
    [13,20,32,32,24,13,32,43,53,53,20,32,53,52,42,7,40,39,39,6,7,42,41,52], //f
    [18,13,3,3,6,18,18,40,50,50,6,18,3,47,46,46,13,3,50,45,33,33,40,50,33,11,1,1,45,33], //g
    [2,10,21,13,2,21,7,40,50,50,6,7,50,46,35,35,40,50], //h
    [13,17,28,13,24,28,19,18,29,29,30,19], //i
    [2,1,11,11,13,2,1,34,22,22,11,1,34,39,28,28,22,34,30,29,40,40,41,30], //j
    [2,10,21,21,13,2,46,35,5,5,16,46,30,5,16,16,41,30], //k
    [10,3,13,13,21,10,14,24,13,14,25,24], //l
    [2,7,18,18,13,2,40,35,46,46,51,40,40,28,39,18,28,17,17,27,39], //m
    [2,6,18,18,13,2,40,35,46,46,51,40,18,51,50,50,6,18], //n
    [3,6,18,18,13,3,18,40,50,50,6,18,3,47,35,35,13,3,47,50,40,40,35,47], //o
    [0,6,18,18,11,0,18,40,50,50,6,18,3,47,35,35,3,2,47,50,40,40,35,47], //p
    [3,6,18,18,13,3,18,40,50,50,6,18,3,47,35,35,13,3,44,50,40,40,33,44], //q
    [13,18,7,7,2,13,6,29,28,28,5,6,29,40,39,39,28,29,40,50,49,49,38,40], //r
    [47,48,38,38,35,47,38,5,15,15,48,38,4,24,13,13,3,4,3,47,35,35,13,3,5,6,18,18,15,5,18,40,50,50,6,18,50,49,29], //s
    [24,14,21,21,32,24,14,36,35,35,24,14,7,40,39,39,6,7], //t
    [7,18,13,13,3,7,3,47,46,46,13,3,35,40,51,51,46,35], //u
    [18,35,24,24,7,18,35,51,40,40,24,35], //v
    [7,2,13,13,18,7,40,35,46,46,51,40,14,27,36,13,25,14,25,35,36], //w
    [46,18,7,7,35,46,13,51,40,40,2,13], //x
    [7,3,13,13,18,7,51,45,33,33,40,51,3,47,46,46,13,3,33,11,1,1,45,33], //y
    [7,51,50,50,6,7,3,47,46,46,2,3,3,39,50,50,14,3], //z         //122

    //Spectials 123-126
    [25,36,35,35,24,25,24,14,16,16,27,24,32,43,42,42,31,32,32,20,18,18,29,32,16,6,18,27,17,16,17,29,18],    // {
    [1,10,21,21,12,1],                                                                                      // |
    [2,3,13,13,14,3,13,25,27,27,16,13,10,21,20,20,9,10,21,31,29,29,18,21,29,39,27,16,28,27,18,28,29],       // }
    [17,5,6,6,18,28,28,40,39,17,27,39], //~

    null, null, null, //127-129
    null, null, null, null, null, null, null, null, null, null, //130-139
    null, null, null, null, null, null, null, null, null, null, //140-149
    null, null, null, null, null, null, null, null, null, null, //150-159
    null, null, null, null, null, null, null, null, null, null, //160-169
    null, null, null, null, null, null, //170-175
    [9,21,32,32,42,9,21,18,8,8,9,21,8,41,29,29,18,8,29,32,42,42,41,29],  //176 - Degree Symbol
    null, null, null, //177-179 
    null, null, null, null, null, null, null, null, null, null, //180-189
    null, null, null, null, null, null, null, null, null, null, //190-199
    null, null, null, null, null, null, null, null, null, null, //200-209
    null, null, null, null, null, null, null, null, null, null, //210-219
    null, null, null, null, null, null, null, null, null, null, //220-229
    null, null, null, null, null, null, null, null, null, null, //230-239
    null, null, null, null, null, null, null, null,  //240-247
    [9,21,32,32,42,9,21,18,8,8,9,21,8,41,29,29,18,8,29,32,42,42,41,29], // Degree Symbol - 248
    null, //249
    null, null, null, null, null, null, null, null, null, null, //250-259
    //
];

const asciiWidths = [
    0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.1, 0.4, 0.4, 0.4, 0.4, 0.4, 0.2, 0.2, 0.2, 0.2, 0.3, 0.2, 0.3, 0.1, 0.4, 0.4, 0.3, 0.4,
    0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.1, 0.1, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.3, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.2, 0.3, 0.2, 0.2, 0.4, 0.2, 0.4, 0.4, 0.4, 0.4, 0.4,
    0.4, 0.4, 0.4, 0.2, 0.3, 0.4, 0.2, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.3, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.3, 0.1, 0.3, 0.3, 0.4,

    0.4,0.4,//128,129
    0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4, //130-169
    0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4, //170-209
    0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4, //210-247
    0.3,
    0.4,//249
    0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,0.4,//250-259

];



function fixAsciiIndices() {

    for(var i=0; i<asciiIndices.length; i++) {

        let ind = asciiIndices[i];

        for(var j=0; j<ind.length; j++) {

        }
    }

}



function BakeText(string = 'Hello World', color = new vec4(1,1,1,1), scale = new vec4(1,1,1,1), textSpacing = 0.05)
{
    v = [];
    ind = [];
    n = [];
    c = [];
    normalVec = new vec4(0,0,1);
    horizOffset = 0;

    let indCounter = 0;

    let vertMap = new Map();

    for (var i=0; i<string.length; i++)
    {
        let ascii = string.charCodeAt(i);
        let indices = asciiIndices[ascii];
        for(var j=0; j<indices.length; j++)
        {
            //hash vertex, see if it's already been added to v, if not add to v and set hash to index
            let hash = (asciiVertices[indices[j]*3] + horizOffset)*scale.x + asciiVertices[indices[j]*3+1]*scale.y*1000 + asciiVertices[indices[j]*3+2]*scale.z*1000000;
            let res = vertMap.get(hash);
            if (res == null)
            {
                vertMap.set(hash, indCounter);
                v.push((asciiVertices[indices[j]*3] + horizOffset)*scale.x, asciiVertices[indices[j]*3+1]*scale.y, asciiVertices[indices[j]*3+2]*scale.z);
                ind.push(indCounter);
                indCounter++;
                n.push( normalVec.x, normalVec.y, normalVec.z);
                c.push( color.x, color.y, color.z, color.a);
            } else {
                ind.push(res);
            }
        }
        horizOffset += asciiWidths[ascii] + textSpacing*scale.x;
    }

    return {
        vertices:v,
        indices:ind,
        normals:n,
        colors:c,
    }
}















function initTextureShaderProgram(gl) {
    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoords;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uObjectMatrix;

    varying highp vec2 texCoord;

    void main() {
        vec4 vPos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
        gl_Position = uProjectionMatrix * uViewMatrix * uObjectMatrix * vPos;
        texCoord = aTextureCoords;
    }
    `;
    const fsSource = `
    precision mediump float;

    varying vec2 texCoord;

    uniform sampler2D uSampler;
    uniform vec4 uColor;

    void main() {
        //gl_FragColor = texture2D(uSampler, texCoord);

        if (texture2D(uSampler, texCoord).x > 0.5)
        {
            gl_FragColor = uColor;
        } else {
            return;
            ///gl_FragColor = vec4(0,0,0,0);   
        }
    }
    `;
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }


    const programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexLocation: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
          textureCoordsLocation: gl.getAttribLocation(shaderProgram, 'aTextureCoords'),
        },
        uniformLocations: {
          projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
          viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
          objectMatrix: gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
          uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
          colorVector: gl.getUniformLocation(shaderProgram, 'uColor'),
        },
    };


    return [shaderProgram, programInfo]
}

function initBuffersTexture(vertices, textureCoords, indices, textureImageData) {
    const verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const textureCoordsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


    const textureBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureBuffer);


    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    //gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, textureImageData.width, textureImageData.height, border, srcFormat, srcType, textureImageData.data);
    //gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    /*const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, textureBuffer);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = textureURL;*/

    return {
        vertices: verticesBuffer,
        textureCoords: textureCoordsBuffer,
        indices: indicesBuffer,
        texture: textureBuffer,
    };
}

function DrawTexture(gl, projectionMatrix, viewMatrix, objectMatrix, indices, buffers, color = new vec4(1,100,0,1))
{
    var programInfo = textProgramInfo;

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    {
        const numComponents = 3  // pull out 3 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);
    }
    // tell webgl how to pull out the texture coordinates from buffer
    {
        const num = 2; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoords);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoordsLocation, num, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoordsLocation);
    }

    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, buffers.texture);

    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.getExtension('EXT_frag_depth');

    // Set the shader uniforms
    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,  false, projectionMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, viewMatrix.getFloat32Array());
    gl.uniformMatrix4fv(programInfo.uniformLocations.objectMatrix, false, objectMatrix.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.colorVector, color.getFloat32Array());

    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}