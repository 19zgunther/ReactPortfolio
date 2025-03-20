
var defaultShaderProgram;
var defaultProgramInfo;

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

    uniform vec4 uViewPosition;
    precision highp float;

    varying highp vec4 vScreenPos;
    //varying highp vec4 viewPosition;

    void main() {
        gl_Position = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
        vScreenPos = gl_Position;
        //viewPosition = uViewPosition;
    }
    `;

    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, generateShader3());

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
            viewPosition: gl.getUniformLocation(shaderProgram, 'uViewPosition'),
            viewRotation: gl.getUniformLocation(shaderProgram, 'uViewRotation'),
            rotationMatrix: gl.getUniformLocation(shaderProgram, 'uRotationMatrix'),
            lightDistanceDivisor: gl.getUniformLocation(shaderProgram, 'uLightDistanceDivisor'),
            planeReflectance: gl.getUniformLocation(shaderProgram, 'uPlaneReflectance'),
            sphereReflectance: gl.getUniformLocation(shaderProgram, 'uSphereReflectance'),
            sphereDeformationFrequency: gl.getUniformLocation(shaderProgram, 'uSphereDeformationFrequency'),
            sphereDeformationMultiplier: gl.getUniformLocation(shaderProgram, 'uSphereDeformationMultiplier'),
            aspectRatio: gl.getUniformLocation(shaderProgram, 'uAspectRatio')
        },
    };

    return [shaderProgram, programInfo]
}



const glCanvasElement = document.getElementById('glcanvas');
const lightDistanceDivisorElement = document.getElementById('lightDistanceDivisor');
const planeReflectanceElement = document.getElementById('planeReflectance');
const sphereReflectanceElement = document.getElementById('sphereReflectance');
const maxReflectionsElement = document.getElementById('maxReflections');
const sphereDeformationFrequencyElement = document.getElementById('sphereDeformationFrequency');
const sphereDeformationMultiplierElement = document.getElementById('sphereDeformationMultiplier');
var gl;
var camPos = new vec4(0,0,-5);
var camRot = new vec4(Math.PI/2,0,0);
var camRotMat = new mat4();
var pressedKeys = {};
var tick = 0;
var mousePos = new vec4();
var mouseIsDown = false;

setup();

const vertices = [-1,1,0, 1,1,0, 1,-1,0, -1,-1,0];
const indices = [0,1,2, 0,2,3];
const buffers = initBuffers(vertices, null, null, indices);

var updateInterval = setInterval(update, 1000);
document.addEventListener('keydown', keyPressed);
document.addEventListener('keyup', keyReleased);
glCanvasElement.addEventListener('mousedown', mouseDown);
glCanvasElement.addEventListener('mousemove', mouseMove);
document.addEventListener('mouseup', mouseUp);


function setup() {
    //var min = Math.min(window.visualViewport.width, window.visualViewport.height);
    /*glCanvasElement.width = window.visualViewport.width;
    glCanvasElement.height = window.visualViewport.height;
    glCanvasElement.style.width = glCanvasElement.width + "px";
    glCanvasElement.style.height = glCanvasElement.height + 'px';*/
    //glCanvasElement.width = min;
    //glCanvasElement.height = min;
    //glCanvasElement.style.width = min + "px";
    //glCanvasElement.style.height = min + 'px';
    let bb = glCanvasElement.getBoundingClientRect();
    glCanvasElement.width = bb.width;
    glCanvasElement.height = bb.height;

    gl = glCanvasElement.getContext("webgl");
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    } else {
        console.log("GL defined ")
    }

    //InitShader(gl);
    [defaultShaderProgram, defaultProgramInfo] =  initDefaultShaderProgram(gl);
}
function keyPressed(event)
{
    var keyCode = event.key;
    pressedKeys[keyCode.toLowerCase()] = true;
    console.log(keyCode);
    if (keyCode == "Enter")
    {
        setup();
    }
}
function keyReleased(event)
{
    var keyCode = event.key;
    pressedKeys[keyCode.toLowerCase()] = false;
}
function mouseDown(event)
{
    console.log(event);
    mouseIsDown = true;
    mousePos.x = event.clientX;
    mousePos.y = event.clientY;
}
function mouseMove(event)
{
    if (mouseIsDown)
    {
        let x = event.clientX;
        let y = event.clientY;
        let dx = mousePos.x - x;
        let dy = mousePos.y - y;
        camRot.y += dx/500;
        camRot.x += -dy/500;
        mousePos.x = x;
        mousePos.y = y;
    }
}
function mouseUp(event)
{
    mouseIsDown = false;
}

function frameRate(element)
{
    let fr = Number(element.value);
    clearInterval(updateInterval);
    updateInterval = setInterval(update, Math.ceil(1000/fr));
}


function updateCamera() {
    let tempTrans = new vec4();
    let tempRot = new vec4();
    let transSpeed = 0.1;
    let rotSpeed = 0.05;
    if (pressedKeys['w'])
    {
        tempTrans.z += transSpeed;// * Math.cos(camRot.y);
    }
    if (pressedKeys['s'])
    {
        tempTrans.z -= transSpeed;// * Math.cos(camRot.y);
    }
    if (pressedKeys['d'])
    {
        tempTrans.x += transSpeed;// * Math.cos(camRot.y);
    }
    if (pressedKeys['a'])
    {
        tempTrans.x -= transSpeed;// * Math.cos(camRot.y);
    }
    if (pressedKeys[' '])
    {
        tempTrans.y += transSpeed;
    }
    if (pressedKeys['shift'])
    {
        tempTrans.y -= transSpeed;
    }


    if (pressedKeys['arrowright'])
    {
        tempRot.y += rotSpeed;
    }
    if (pressedKeys['arrowleft'])
    {
        tempRot.y -= rotSpeed;
    }
    if (pressedKeys['arrowup'] && camRot.x < 2)
    {
        tempRot.x += rotSpeed;
    }
    if (pressedKeys['arrowdown'] && camRot.x > 1)
    {
        tempRot.x -= rotSpeed;
    }

    camRot.addi(tempRot);
    //camRotMat.makeRotation(0, camRot.y, 0);
    camPos.addi( new mat4().makeRotation(0,camRot.y,0).mul(tempTrans) );

    //camRotMat.makeRotation(camRot.x*Math.sin(camRot.y), camRot.y, camRot.x * Math.cos(camRot.y))
    //camRotMat =   new mat4().makeRotation(0,0,camRot.x).mul(  new mat4().makeRotation(0,camRot.y,0) ) ;
    camRotMat =   new mat4().makeRotation(0,camRot.y, (-camRot.x + Math.PI/2)%Math.PI);

    //camRotMat.makeRotation(camRot.x, camRot.y, camRot.z);
}


function update() {
    tick += 1;

    updateCamera();

    camPos.addi(0,Math.sin(tick/10)/500)

    gl.clearColor(0.01, 0.01, 0.01, 1);    // Clear to black, fully opaque
    gl.clearDepth(1);                   // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    var programInfo = defaultProgramInfo;

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertices);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexLocation);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Set the shader uniforms
    lightDistanceDivisor = [Number(lightDistanceDivisorElement.value)];
    planeReflectance = [Number(planeReflectanceElement.value)];
    let sphereReflectance = [Number(sphereReflectanceElement.value)];
    let sphereDeformationMultiplier = [Number(sphereDeformationMultiplierElement.value)];
    let sphereDeformationFrequency = [Number(sphereDeformationFrequencyElement.value)];
    gl.uniform4fv(programInfo.uniformLocations.viewPosition, camPos.getFloat32Array());
    gl.uniform4fv(programInfo.uniformLocations.viewRotation, camRot.getFloat32Array());
    gl.uniformMatrix4fv( programInfo.uniformLocations.rotationMatrix, false, camRotMat.getFloat32Array() );
    gl.uniform1fv(programInfo.uniformLocations.lightDistanceDivisor, new Float32Array(lightDistanceDivisor));
    gl.uniform1fv(programInfo.uniformLocations.planeReflectance, new Float32Array(planeReflectance));
    gl.uniform1fv(programInfo.uniformLocations.sphereReflectance, new Float32Array(sphereReflectance));
    gl.uniform1fv(programInfo.uniformLocations.sphereDeformationMultiplier, new Float32Array(sphereDeformationMultiplier));
    gl.uniform1fv(programInfo.uniformLocations.sphereDeformationFrequency, new Float32Array(sphereDeformationFrequency));
    let bb = glCanvasElement.getBoundingClientRect();
    gl.uniform2fv(programInfo.uniformLocations.aspectRatio, new Float32Array([Number(3*bb.width/bb.height),0]));
    
    const vertexCount = indices.length;
    gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, 0);
}





function generateShader3_OLD() {
    const defaultCode = `
    precision highp float;
    varying vec4 vScreenPos;

    uniform vec4 uViewPosition;
    uniform mat4 uRotationMatrix;
    uniform float uLightDistanceDivisor;
    uniform float uPlaneReflectance;
    uniform float uSphereReflectance;
    uniform float uSphereDeformationMultiplier;
    uniform float uSphereDeformationFrequency;
    uniform vec2 uAspectRatio;


    vec3 unit(vec3 r)
    {
        float d = sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
        if (d < 0.0) { d = -d;}
        r.x = r.x / d;
        r.y = r.y / d;
        r.z = r.z / d;
        return r;
    }

    vec3 reflectRay(vec3 rayD, vec3 N)
    {
        float d = dot(rayD, N)*2.0;
        return unit( rayD - N*d );
    }
    float distToSphere(vec3 rayD, vec3 rayP, vec3 sC, float sR)
    {
        float a = rayD.x*rayD.x + rayD.y*rayD.y + rayD.z*rayD.z;
        float b = 2.0 * (rayD.x * (rayP.x - sC.x) + rayD.y * (rayP.y - sC.y) + rayD.z * (rayP.z - sC.z));
        float c = (rayP.x-sC.x)*(rayP.x-sC.x) + (rayP.y-sC.y)*(rayP.y-sC.y) + (rayP.z-sC.z)*(rayP.z-sC.z) - sR*sR;
        float top = b*b - 4.0*a*c;

        if (top >= 0.001)
        {
            top = sqrt(top);
            float t1 = (-b-top)/(2.0*a);
            float t2 = (-b+top)/(2.0*a);
            if (t1 > 0.01 && (t1 < t2 || t2 < 0.01))
            {
            return t1;
            } else if (t2 > 0.01 && (t2 < t1 || t1 < 0.01))
            {
            return t2;
            }
        }
        return 100000.0;
    }

    float distToPlane(vec3 rayD, vec3 rayP, vec3 pP, vec3 pN)
    {
        float t = dot(pP-rayP, pN) / dot(rayD, pN);
        if (t > 0.001)
        {
            return t;
        }
        return 10000.0;
    }

    float distToPoint(vec3 rayP, vec3 P)
    {
        vec3 x = P-rayP;
        return sqrt( dot(x,x) );
    }

    float distToCube(vec3 rayD, vec3 rayP, vec3 cubeCenter, float cubeR)
    {
        float r = cubeR;
        float d = distToPlane(rayD, rayP, cubeCenter + vec3(0,0,r), vec3(0,0,1));
        vec3 interPoint = rayP + rayD*d;
        if (interPoint.x < cubeCenter.x+r && 
            interPoint.x > cubeCenter.x-r &&
            interPoint.y < cubeCenter.y+r &&
            interPoint.y > cubeCenter.y-r
            )
        {
            return d;
        }
        return 100000.0;
    }


    vec4 fireRay(vec3 rayD, vec3 rayP) {
        vec4 fragColor = vec4(0,0,0,1);
        float percentDone = 0.0;

        vec3 lightSource = vec3(4,4,4);


        //SPhERES//////////////////////
        const int numSpheres = 9;
        vec3 sphereC[numSpheres];
        sphereC[0] = vec3(0,-3,0);
        sphereC[1] = vec3(0,-2,1);
        sphereC[2] = vec3(0,-1,2);
        sphereC[3] = vec3(1,0,0);
        sphereC[4] = vec3(1,1,1);
        sphereC[5] = vec3(1,2,2);
        sphereC[6] = vec3(2,3,0);
        sphereC[7] = vec3(2,4,1);
        sphereC[8] = vec3(2,5,2);
       
        float sphereR[numSpheres];
        sphereR[0] = 2.;
        sphereR[1] = .5;
        sphereR[2] = .5;
        sphereR[3] = .5;
        sphereR[4] = .5;
        sphereR[5] = .5;
        sphereR[6] = .5;
        sphereR[7] = .5;
        sphereR[8] = .5;

        vec3 sphereColor[numSpheres];
        sphereColor[0] = vec3( 1, 0.5, 0.5);
        sphereColor[1] = vec3( 0.5, 1, 0.5);
        sphereColor[2] = vec3( 0.5, 0.5, 1);
        sphereColor[3] = vec3( 1, 0.5, 1);
        sphereColor[4] = vec3( 1, 1, 0.5);
        sphereColor[5] = vec3( 0.5, 1, 1);
        sphereColor[6] = vec3( 1, 1, 1);
        sphereColor[7] = vec3( 1, 0.5, 0.5);
        sphereColor[8] = vec3( 1, 0.5, 0.5);

        //PLANES////////////////////////
        const int numPlanes = 5;
        vec3 planeC[numPlanes];
        planeC[0] = vec3(0,0,10);
        planeC[1] = vec3(0,5,0);
        planeC[2] = vec3(0,-5,0);
        planeC[3] = vec3(-5,0,0);
        planeC[4] = vec3(5,0,0);

        vec3 planeN[numPlanes];
        planeN[0] = vec3(0,0,1);
        planeN[1] = vec3(0,1,0);
        planeN[2] = vec3(0,1,0);
        planeN[3] = vec3(1,0,0);
        planeN[4] = vec3(1,0,0);

        vec3 planeColor[numPlanes];
        planeColor[0] = vec3(1,0,0);
        planeColor[1] = vec3(0,1,0);
        planeColor[2] = vec3(0,0,1);
        planeColor[3] = vec3(0.6,0,0.6);
        planeColor[4] = vec3(0.5,0.5,0.5);

        //CUBES/////////////////////////
        const int numCubes = 1;
        vec3 cubeCenters[numCubes];
        cubeCenters[0] = vec3(0,0,0);

        float cubeRs[numCubes];
        cubeRs[0] = 0.5;
        

        
        float temp = 1000.0;
        float bestD = 1000000.0;
        bool bestIsSphere = false;
        int leavingSphere = -1;
        int sphereHit = -1;

        vec3 C;
        vec3 N;
        vec3 color;
        float R;

        for (int tick=0; tick<10; tick++) {
            bestD = 100000.0;

            //initial distances
            for (int i=0; i<numSpheres; i++)
            {
                if (leavingSphere == i) { continue; }
                temp = distToSphere(rayD, rayP, sphereC[i], sphereR[i]);
                if (temp < bestD && temp > 0.0)
                {
                    bestD = temp;
                    C = sphereC[i];
                    R = sphereR[i];
                    bestIsSphere = true;
                    color = sphereColor[i];
                    sphereHit = i;
                }
            }

            for (int i=0; i<numPlanes; i++)
            {
                temp = distToPlane(rayD, rayP, planeC[i], planeN[i]);
                if (temp < bestD && temp > 0.0)
                {
                    bestD = temp;
                    C = planeC[i];
                    N = planeN[i];
                    color = planeColor[i];
                    bestIsSphere = false;
                }
            }

            temp = 100000.0;
            for (int i=0; i<numCubes; i++)
            {
                float r = cubeRs[i];
                float d = distToPlane(rayD, rayP, cubeCenters[i] + vec3(0,0,r), vec3(0,0,1));
                vec3 interPoint = rayP + rayD*d;
                if ( d < bestD &&
                    interPoint.x < cubeCenters[i].x+r && 
                    interPoint.x > cubeCenters[i].x-r &&
                    interPoint.y < cubeCenters[i].y+r &&
                    interPoint.y > cubeCenters[i].y-r
                    )
                {
                    bestD = d;
                    C = vec3(1,0,0);
                    N = vec3(0,0,1);
                    bestIsSphere = false;
                }
            }


            if (bestD < 10000.0 && bestIsSphere == true)
            {
                //Hit a sphere!!
                leavingSphere = sphereHit;
                
                rayP = rayP + rayD*bestD;
                rayD = reflectRay(rayD, unit( C - rayP)) + vec3(sin(uSphereDeformationFrequency*rayP.x), sin(uSphereDeformationFrequency*rayP.y), sin(uSphereDeformationFrequency*rayP.z))*uSphereDeformationMultiplier;
                rayD = normalize(rayD);

                if (sphereHit > 2 && sphereHit < 6)
                {
                    rayD = -rayD;
                    continue;
                }
                
                vec3 newRayD = unit(lightSource - rayP);

                float d = distToPoint(rayP, lightSource);
                
                for (int i=0; i<numSpheres; i++)
                {

                    //if (i == sphereHit) { continue; }

                    temp = distToSphere(newRayD, rayP, sphereC[i], sphereR[i]);
                    if (temp < d && temp > 0.01)
                    {
                        d = d*2.0;
                        break;
                    }
                }
                
                d = d/uLightDistanceDivisor;
                temp = (1.0-percentDone)*uSphereReflectance;
                fragColor += temp*vec4(color.x/d, color.y/d, color.z/d, 0);
                percentDone += temp;


            } else if (bestD < 10000.0)
            {
                //Hit a plane!
                leavingSphere = -1;

                rayP = rayP + bestD*rayD;
                rayD = reflectRay(rayD, N);
                vec3 newRayD = unit(lightSource - rayP);

                float d = distToPoint(rayP, lightSource);
                
                for (int i=0; i<numSpheres; i++)
                {
                    temp = distToSphere(newRayD, rayP, sphereC[i], sphereR[i]);
                    if (temp < d && temp > 0.0)
                    {
                        d = d*2.0;
                        break;
                    }
                }
                
                d = d/uLightDistanceDivisor;
                temp = (1.0-percentDone)*uPlaneReflectance;
                /*if (sin(rayP.x*5.) > 0. && sin(rayP.y*5.) > 0.)
                {
                    fragColor += temp*vec4(color.x/d, color.y/d, color.z/d, 0);
                } else {
                    fragColor += temp*vec4(color.y/d, color.z/d, color.x/d, 0);
                }*/
                fragColor += temp*vec4(color.x/d, color.y/d, color.z/d, 0);

                percentDone += temp;
            } else {
                return fragColor;
            }


            if (percentDone > 0.9)
            {
                return fragColor;
            }
            
        }

        //Return white if there's an issue and nothing is hit.
        return fragColor;
    }

    void main() {
        vec3 rayD = unit(vec3(vScreenPos.x*3.0*uAspectRatio[0]/3.0, vScreenPos.y*3.0, 5.0));
        rayD = ( uRotationMatrix * vec4(rayD.xyz,1.0) ).xyz;        
        vec3 rayP = uViewPosition.xyz;  //vec3(0.0, 0.0, 0.0);
        gl_FragColor = fireRay(rayD, rayP);
        gl_FragColor.a = 1.0;
    }
    `;

    return defaultCode;
}

///THIS IS THE ONE USED

//
function generateShader3() {

    //SPHERES
    let numSpheres = 10;
    let spheres = [];
    for (let i=0; i<numSpheres; i++)
    {
        let center = new vec4( - Math.random() * 4, 3 - Math.random()*6, 3 - Math.random()*6);
        let color = new vec4(Math.random(),Math.random(), Math.random(), 1);
        let radius = Math.random() + 0.3;
        spheres.push(
            {
                center:center,
                radius:radius,
                color:color,
            }
        )
    }
    
    //PLANES
    let planes = [];
    planes.push({ center: new vec4(0,0,10),  normal: new vec4(0,0,1),  color: new vec4(Math.random(),0,Math.random()) });
    planes.push({ center: new vec4(0,5,0),  normal: new vec4(0,1,0),  color: new vec4(0,Math.random(),0) });
    planes.push({ center: new vec4(0,-5,0),  normal: new vec4(0,1,0),  color: new vec4(Math.random(),0,Math.random()) });
    planes.push({ center: new vec4(-5,0,0),  normal: new vec4(1,0,0),  color: new vec4(Math.random(),0.6,0) });
    planes.push({ center: new vec4(5,0,10),  normal: new vec4(1,0,0),  color: new vec4(Math.random(),Math.random(),Math.random()) });
    let numPlanes = planes.length;


    //Trianlges vertices in form [ t1_v1, t1_v2, t1_v3,   t2_v1, t2_v2, ... ]
    //Colors length = 1 per vertex
    //TRIANGLES
    let vertices = [
        new vec4(0,0,4),
        new vec4(2,0,4),
        new vec4(0,2,4),
        new vec4(0,-1,4),
        new vec4(-2,-1,4),
        new vec4(0,1,4)
    ];
    let colors = [
        new vec4(1,0,0),
        new vec4(0,1,0),
        new vec4(0,0,1),
        new vec4(0,0,1),
        new vec4(0,1,0),
        new vec4(1,0,0)
    ];

    // for (let i=0; i<3; i++)
    // {
    //     //vertices.push(new vec4(0, i, 0), new vec4(1, i, 0), new vec4(1,i+1,0));
    //     //colors.push(new vec4(1,0,0), new vec4(0,1,0), new vec4(0,0,1));
    // }
    // const r = 3
    // for (let a = 0; a < 3; a += 0.5)
    // {
    //     let a2 = a + 0.25;
    //     let a3 = a + 0.5;
    //     vertices.push(
    //         new vec4(r * Math.sin(a ),     r*Math.cos(a ),     Math.random()),
    //         new vec4(1.5*r * Math.sin(a2), 1.5*r*Math.cos(a2), Math.random()),
    //         new vec4(r * Math.sin(a3),     r*Math.cos(a3),     Math.random())
    //     );
    //     colors.push(
    //         new vec4(Math.random(), Math.random(), Math.random()).scaleToUnit(),
    //         new vec4(Math.random(), Math.random(), Math.random()).scaleToUnit(),
    //         new vec4(Math.random(), Math.random(), Math.random()).scaleToUnit()
    //     );
    // }




    //CREATE CODE>>>>
    const precision = 4;
    let sphereCode = "const int numSpheres = " + numSpheres + ";\n";
    sphereCode += "vec3 sphereC[numSpheres];\n";
    sphereCode += "float sphereR[numSpheres];\n";
    sphereCode += "vec3 sphereColor[numSpheres];\n";
    for (let i=0; i<numSpheres; i++)
    {
        const s = spheres[i];
        sphereCode += "sphereC["+i+"] = vec3("+s.center.x.toPrecision(precision)+","+s.center.y.toPrecision(precision)+","+s.center.z.toPrecision(precision)+");\n";
        sphereCode += "sphereColor["+i+"] = vec3("+s.color.x.toPrecision(precision)+","+s.color.y.toPrecision(precision)+","+s.color.z.toPrecision(precision)+");\n";
        sphereCode += "sphereR["+i+"] = " + s.radius.toPrecision(precision)+";\n";
    }

    let planeCode = "const int numPlanes = " + numPlanes + ";\n";
    planeCode += "vec3 planeC[numPlanes];\n";
    planeCode += "vec3 planeN[numPlanes];\n";
    planeCode += "vec3 planeColor[numPlanes];\n";
    for (let i=0; i<numPlanes; i++)
    {
        const s = planes[i];
        planeCode += "planeC["+i+"] = vec3("+s.center.x.toPrecision(precision)+","+s.center.y.toPrecision(precision)+","+s.center.z.toPrecision(precision)+");\n";
        planeCode += "planeColor["+i+"] = vec3("+s.color.x.toPrecision(precision)+","+s.color.y.toPrecision(precision)+","+s.color.z.toPrecision(precision)+");\n";
        planeCode += "planeN["+i+"] = vec3("+s.normal.x.toPrecision(precision)+","+s.normal.y.toPrecision(precision)+","+s.normal.z.toPrecision(precision)+");\n";
    }

    let numVertices = vertices.length;
    let numColors = colors.length;
    let triangleCode = "vec3 vertices["+numVertices+"];\n";
    triangleCode += "vec3 colors["+numColors+"];\n";
    for (let i=0; i<numVertices; i++)
    {
        triangleCode += "vertices["+i+"] = vec3("+vertices[i].x.toPrecision(precision)+","+vertices[i].y.toPrecision(precision)+","+vertices[i].z.toPrecision(precision)+");\n";
    }
    for (let i=0; i<numColors; i++)
    {
        triangleCode += "colors["+i+"] = vec3("+colors[i].x.toPrecision(precision)+","+colors[i].y.toPrecision(precision)+","+colors[i].z.toPrecision(precision)+");\n";
    }



    const beginning = `
    precision highp float;
    varying vec4 vScreenPos;

    uniform vec4 uViewPosition;
    uniform mat4 uRotationMatrix;
    uniform float uLightDistanceDivisor;
    uniform float uPlaneReflectance;
    uniform float uSphereReflectance;
    uniform float uSphereDeformationMultiplier;
    uniform float uSphereDeformationFrequency;
    uniform vec2 uAspectRatio;


    struct MyData {
        float distance;
        vec3 normal;
        vec3 position;
        vec3 color;
        int sphereHit;
        int planeHit;
        int triangleHit;
    };


    vec3 unit(vec3 r)
    {
        float d = sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
        if (d < 0.0) { d = -d;}
        r.x = r.x / d;
        r.y = r.y / d;
        r.z = r.z / d;
        return r;
    }
    vec3 reflectRay(vec3 rayD, vec3 N)
    {
        float d = dot(rayD, N)*2.0;
        return unit( rayD - N*d );
    }`;

    const findHitData = `
    MyData findHitData(vec3 rayD, vec3 rayP,
        vec3 sphereCenters[`+numSpheres+`], float sphereRs[`+numSpheres+`], vec3 sphereColors[`+numSpheres+`], int sphereToSkip,
        vec3 planeCenters[`+numPlanes+`], vec3 planeNormals[`+numPlanes+`], vec3 planeColors[`+numPlanes+`], int planeToSkip,
        vec3 vertices[`+numVertices+`], vec3 colors[`+numColors+`]
        )
    {
        const int numSpheres = `+numSpheres+`;
        const int numPlanes = `+numPlanes+`;
        const int numVertices = `+numVertices+`;

        MyData data;
        data.distance = 100000.0;

        /////////////// FOR EACH SPHERE /////////////////////
        float a,b,c,top,dist,sR,t1,t2;
        for (int i=0; i<numSpheres; i++)
        {
            if (sphereToSkip == i) {continue;}
            vec3 sC = sphereCenters[i];
            sR = sphereRs[i];
            a = rayD.x*rayD.x + rayD.y*rayD.y + rayD.z*rayD.z;
            b = 2.0 * (rayD.x * (rayP.x - sC.x) + rayD.y * (rayP.y - sC.y) + rayD.z * (rayP.z - sC.z));
            c = (rayP.x-sC.x)*(rayP.x-sC.x) + (rayP.y-sC.y)*(rayP.y-sC.y) + (rayP.z-sC.z)*(rayP.z-sC.z) - sR*sR;
            top = b*b - 4.0*a*c;
            dist = 100000.0;
            if (top >= 0.001)
            {
                top = sqrt(top); 
                t1 = (-b-top)/(2.0*a);
                t2 = (-b+top)/(2.0*a);
                if (t1 > 0.01 && (t1 < t2 || t2 < 0.01))         { dist = t1;
                } else if (t2 > 0.01 && (t2 < t1 || t1 < 0.01)) {  dist = t2; }
            }
            if (dist < data.distance)
            {
                data.distance = dist;
                data.position = rayP + rayD*dist;
                data.color = sphereColors[i];
                data.normal = data.position - sphereCenters[i];
                data.sphereHit = i;
                data.planeHit = -1;
                data.triangleHit = -1;
            }
        }

        //////////////// FOR EACH PLANE ///////////////////
        for (int i=0; i < numPlanes; i++)
        {
            if (planeToSkip == i) {continue;}
            dist = dot(planeCenters[i]-rayP, planeNormals[i]) / dot(rayD, planeNormals[i]);
            if (dist > 0.001 && dist < data.distance)
            {
                data.distance = dist;
                data.position = rayP + rayD*dist;
                data.normal = planeNormals[i];
                data.color = planeColors[i];
                data.sphereHit = -1;
                data.planeHit = i;
                data.triangleHit = -1;
            }
        }

        ////////////////// FOR EACH TRIANGLE /////////////////
        vec3 v1,v2,v3,U,V,norm,P;
        float d1,d2,d3,divisor;
        for (int i=0; i<numVertices; i+=3)
        {
            v1 = vertices[i];
            v2 = vertices[i+1];
            v3 = vertices[i+2];
            U = v2-v1;
            V = v3-v1;
            norm = vec3( U.y*V.z-U.z*V.y,  U.z*V.x - U.x*V.z,  U.x*V.y - U.y*V.x);
            dist = dot(v1-rayP, norm) / dot(rayD, norm);
            if (dist > 0.001 && dist < data.distance)
            {
                P = rayP + rayD*dist;
                if (
                    dot(norm, cross(v2-v1,P-v1)) > 0.0 &&
                    dot(norm, cross(v3-v2,P-v2)) > 0.0 &&
                    dot(norm, cross(v1-v3,P-v3)) > 0.0 )
                {
                    d1 = length(v1-P);
                    d2 = length(v2-P);
                    d3 = length(v3-P);
                    divisor = d1+d2+d3;
                    d1 = 1.0 - d1/divisor;
                    d2 = 1.0 - d2/divisor;
                    d3 = 1.0 - d3/divisor;

                    data.distance = dist;
                    data.position = P;
                    data.normal = norm;
                    data.color = colors[i]*d1 + colors[i+1]*d2 + colors[i+2]*d3;
                    data.sphereHit = -1;
                    data.planeHit = -1;
                    data.triangleHit = i;
                }
            }
        }
        return data;
    }`;

    const fireRayAndMain = `
    vec4 fireRay(vec3 rayD, vec3 rayP) {

        ` + sphereCode + "\n" + planeCode + "\n" + triangleCode + `

        //CUBES/////////////////////////
        const int numCubes = 1;
        vec3 cubeCenters[numCubes];
        cubeCenters[0] = vec3(0,0,0);

        float cubeRs[numCubes];
        cubeRs[0] = 0.5;

        // vec3 vertices[3];
        // vertices[0] = vec3(0,0,0);
        // vertices[1] = vec3(0,5,0);
        // vertices[2] = vec3(10,0,0);

        // vec3 colors[1];
        // colors[0] = vec3(1,0,0);


        float temp = 1000.0;
        float d = 0.0;
        vec4 fragColor = vec4(0,0,0,1);
        float percentDone = 0.0;
        vec3 lightSource = vec3(4,4,4);
        int previousSphereHit = -1;
        int previousPlaneHit = -1;


        for (int tick=0; tick<10; tick++) {

            //Find intersecting object, distance, normal, etc.
            MyData data;
            data = findHitData(rayD, rayP, 
                sphereC, sphereR, sphereColor, previousSphereHit, 
                planeC, planeN, planeColor, previousPlaneHit,
                vertices, colors);
            previousSphereHit = data.sphereHit;
            previousPlaneHit = data.planeHit;

            vec3 newRayD = reflectRay(rayD, unit(data.normal));
            vec3 newRayP = data.position;
            vec3 tempRayD = unit(lightSource - data.position);
            vec3 tempRayP = data.position;

            //Check if we can see the light source
            MyData dataToLightSource;
            dataToLightSource = findHitData(tempRayD, tempRayP, 
                sphereC, sphereR, sphereColor, -1, 
                planeC, planeN, planeColor, -1,
                vertices, colors);
            
            float distToLight = length(newRayP - lightSource);
            
            vec3 color = data.color;
            
            float reflectance = uSphereReflectance;
            if (data.planeHit > -1)
            {
                reflectance = uPlaneReflectance;
            } else if (data.triangleHit > -1) {
                reflectance = 0.7;
            }

            float minLightLevelMultiplier = 0.2;
            float dt = minLightLevelMultiplier;
            if (distToLight < dataToLightSource.distance)
            {
                //We're in light
                d = distToLight/uLightDistanceDivisor;
                temp = (1.0-percentDone)*reflectance;
                dt = max(dot(data.normal, tempRayD), minLightLevelMultiplier);

                fragColor += temp*vec4(dt * color.x/d, dt * color.y/d, dt * color.z/d, 0);
                percentDone += temp;
            } else {
                //In shadow
                d = 2.0*distToLight/uLightDistanceDivisor;
                temp = (1.0-percentDone)*reflectance;
                fragColor += temp*vec4(dt*color.x/d, dt*color.y/d, dt*color.z/d, 0);
                percentDone += temp;
            }

            if (percentDone > 0.9 || tick > 8)
            {
                fragColor.a = 1.0;
                return fragColor;
            }


            rayD = newRayD;
            rayP = newRayP;
            if (data.sphereHit > -1)
            {
                rayD += vec3(sin(uSphereDeformationFrequency*rayP.x), sin(uSphereDeformationFrequency*rayP.y), sin(uSphereDeformationFrequency*rayP.z))*uSphereDeformationMultiplier;
            }
        }
    }


    void main() {
        vec3 rayD = unit(vec3(vScreenPos.x*3.0*uAspectRatio[0]/3.0, vScreenPos.y*3.0, 5.0));
        rayD = ( uRotationMatrix * vec4(rayD.xyz,1.0) ).xyz;        
        vec3 rayP = uViewPosition.xyz;  //vec3(0.0, 0.0, 0.0);
        gl_FragColor = fireRay(rayD, rayP);
        gl_FragColor.a = 1.0;
    }
    `;
    
    const combined = beginning + findHitData + fireRayAndMain;
    console.log(combined);
    return combined;
}









function generateShader() {
    const defaultCode = `
    precision highp float;
varying vec4 vScreenPos;

uniform vec4 uViewPosition;
uniform mat4 uRotationMatrix;
uniform float uLightDistanceDivisor;
uniform float uPlaneReflectance;

vec3 unit(vec3 r)
{
	float d = sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
	if (d < 0.0) { d = -d;}
	r.x = r.x / d;
	r.y = r.y / d;
	r.z = r.z / d;
	return r;
}

vec3 reflectRay(vec3 rayD, vec3 N)
{
	float d = dot(rayD, N)*2.0;
	return unit( rayD - N*d );
}
float distToSphere(vec3 rayD, vec3 rayP, vec3 sC, float sR)
{
	float a = rayD.x*rayD.x + rayD.y*rayD.y + rayD.z*rayD.z;
	float b = 2.0 * (rayD.x * (rayP.x - sC.x) + rayD.y * (rayP.y - sC.y) + rayD.z * (rayP.z - sC.z));
	float c = (rayP.x-sC.x)*(rayP.x-sC.x) + (rayP.y-sC.y)*(rayP.y-sC.y) + (rayP.z-sC.z)*(rayP.z-sC.z) - sR*sR;
	float top = b*b - 4.0*a*c;

	if (top >= 0.001)
	{
	    top = sqrt(top);
	    float t1 = (-b-top)/(2.0*a);
	    float t2 = (-b+top)/(2.0*a);
	    if (t1 > 0.01 && (t1 < t2 || t2 < 0.01))
	    {
		return t1;
	    } else if (t2 > 0.01 && (t2 < t1 || t1 < 0.01))
	    {
		return t2;
	    }
	}
	return 100000.0;
}

float distToPlane(vec3 rayD, vec3 rayP, vec3 pP, vec3 pN)
{
	float t = dot(pP-rayP, pN) / dot(rayD, pN);
	if (t > 0.001)
	{
	    return t;
	}
	return 10000.0;
}
float distToPoint(vec3 rayP, vec3 P)
{
	vec3 x = P-rayP;
	return sqrt( dot(x,x) );
}
    `;
    const mainFunction = `void main() {
        vec3 rayD = unit(vec3(vScreenPos.x*3.0, vScreenPos.y*3.0, 5.0));
        rayD = ( uRotationMatrix * vec4(rayD.xyz,1.0) ).xyz;        
        vec3 rayP = uViewPosition.xyz;  //vec3(0.0, 0.0, 0.0);
        gl_FragColor = fireRay(rayD, rayP);
    }`;
    var planes = [
        //Position              Normal         Color
        [new vec4(0,0,10), new vec4(0,0,1), new vec4(1,0,0)], //back
        [new vec4(0,5,0), new vec4(0,-1,0), new vec4(0,1,0)], //top
        [new vec4(0,-5,0), new vec4(0,1,0), new vec4(0,0,1)], //bottom
        [new vec4(5,0,0), new vec4(-1,0,0), new vec4(0.5,0.5,0)], //right
        [new vec4(-5,0,0), new vec4(1,0,0), new vec4(0,0.5,0.5)], //left
    ];
    var spheres = [
        [new vec4(0,0,5), 1],
        [new vec4(1,2,6), 1],
        [new vec4(-3,-2,6), 1],
        [new vec4(0,-2,6), 2],
    ];
    /*
    var spheres = [];
    let max = 4;
    for (var x=0; x<max; x++)
    {
        for (var z=0;z<max;z++)
        {
            for (var y=0; y<max; y++)
            {
                spheres.push( [ new vec4(x*2,y*2,z*2), 1])
            }
        }
    }*/

    var planeReflectance = 0.99; //any value 0.1 to 0.99;



    
    var str = "vec4 fireRay(vec3 rayD, vec3 rayP) { \nvec4 color = vec4(0,0,0,1); \nfloat percentDone = 0.0;\n";
    str += "vec3 lightSource = vec3(3,3,6);\n"; //adding lightsource

    //Adding sphere & plane distance and leaving variables
    str +="\n\n//Spheres:\n";
    for (var i in spheres)
    {
        str += "float SD"+i+"=10000.0; bool leavingS"+i+"=false;\n";
        str += "vec3 SC"+i+"=vec3("+spheres[i][0].x+", "+spheres[i][0].y+", "+spheres[i][0].z+"); float SR"+i+"="+spheres[i][1]+".0;\n";
    }

    str +="\n\n//Planes:\n";
    for (var i in planes)
    {
        str += "float PD"+i+"=10000.0; bool leavingP"+i+"=false;\n";
        str += "vec3 PC"+i+"=vec3("+planes[i][0].x+", "+planes[i][0].y+", "+planes[i][0].z+"); vec3 PN"+i+"=vec3("+planes[i][1].x+", "+planes[i][1].y+", "+planes[i][1].z+");\n";
    }

    //beginning of for loop
    str += "\n\n//Loop:\nfor (int i=0; i<10; i++) {\n";

    //Get initial distances
    str += "\n\n//Get Distances:\n";
    for (var i in spheres)
    {
        str += "if (!leavingS"+i+") {SD"+i+"=distToSphere(rayD, rayP, SC"+i+", SR"+i+");} else {SD"+i+"=10000.0;} \n";
    }
    for (var i in planes)
    {
        str += "if (!leavingP"+i+") {PD"+i+"=distToPlane(rayD, rayP, PC"+i+", PN"+i+");} else {PD"+i+"=10000.0;} \n";
    }


    //Reset all 'leaving...' booleans
    str += "\n\n//Reseting leaving...\n";
    for (var i in spheres)
    {
        str += "leavingS"+i+" = false;\n";
    }
    for (var i in planes)
    {
        str += "leavingP"+i+" = false;\n";
    }


    //Min Function - Needs Optimization.
    str += "\n\n//MinFunction:\n";
    str += "float m = ";
    var ds = [];
    for (var i in spheres) {ds.push("SD"+i);}
    for (var i in planes) {ds.push("PD"+i);}
    for (var i=0; i<ds.length-1; i++)
    {
        str +='min(';
    }
    str += ds[0] +", ";
    for (var i=1; i<ds.length-1; i++)
    {
        str += ds[i] +"), ";
    }
    str += ds[ds.length-1] +");";
    

    //Sphere if statements
    str += "\n\n//Spheres If Statements:\n"
    for (var i in spheres)
    {
        str += "if (m == SD"+i+"){\n";
        str += "rayP += rayD*m;\n";
        str += "rayD = reflectRay(rayD, unit(SC"+i+"-rayP));\n";
        str += "leavingS"+i+" = true;\n";
        str += "continue; \n}\n";
    }


    //Plane if statements
    str += "\n\n//Plane If Statements:\n"
    str += "vec3 newRayP = rayP + rayD*m;\n";
    str += "vec3 newRayD = unit(lightSource - newRayP);\n";
    str += "float d = distToPoint(newRayP, lightSource);\n";
    for (var i in spheres)
    {
        str += "SD"+i+"=distToSphere(newRayD, newRayP, SC"+i+", SR"+i+");\n";
    }
    str += "if (";
    for (var i in spheres)
    {
        str += "(SD"+i+"<d && SD"+i+">0.01)";
        if (i != spheres.length-1) { str += " || ";}
    }
    str += "){ d = d*1.5; }\n";
    str += "d = d/uLightDistanceDivisor;";

    for (var i in planes)
    {
        str += "if (m == PD"+i+"){\n";
        str += "rayP += rayD*m;\n";
        str += "rayD = reflectRay(rayD, PN"+i+");\n";
        str += "color += (1.0-percentDone)*"+planeReflectance+"*vec4("+planes[i][2].x.toPrecision(2)+"/d, "+planes[i][2].y.toPrecision(2)+"/d, "+planes[i][2].z.toPrecision(2)+"/d, 0);\n";
        str += "percentDone += (1.0-percentDone)*uPlaneReflectance;\n";
        str += "leavingP"+i+" = true;\n";
        str += "continue; \n}\n";
    }

    str += "\n\nif (percentDone > 0.95) { return color; }\n";
    str += "} return color;}";
    console.log(defaultCode + str + mainFunction);
    return defaultCode + str + mainFunction;
}

function generateShader4() {
    const defaultCode = `
    precision highp float;
varying vec4 vScreenPos;

uniform vec4 uViewPosition;
uniform mat4 uRotationMatrix;
uniform float uLightDistanceDivisor;
uniform float uPlaneReflectance;

vec3 unit(vec3 r)
{
	float d = sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
	if (d < 0.0) { d = -d;}
	r.x = r.x / d;
	r.y = r.y / d;
	r.z = r.z / d;
	return r;
}

vec3 reflectRay(vec3 rayD, vec3 N)
{
	float d = dot(rayD, N)*2.0;
	return unit( rayD - N*d );
}
float distToSphere(vec3 rayD, vec3 rayP, vec3 sC, float sR)
{
	float a = rayD.x*rayD.x + rayD.y*rayD.y + rayD.z*rayD.z;
	float b = 2.0 * (rayD.x * (rayP.x - sC.x) + rayD.y * (rayP.y - sC.y) + rayD.z * (rayP.z - sC.z));
	float c = (rayP.x-sC.x)*(rayP.x-sC.x) + (rayP.y-sC.y)*(rayP.y-sC.y) + (rayP.z-sC.z)*(rayP.z-sC.z) - sR*sR;
	float top = b*b - 4.0*a*c;

	if (top >= 0.001)
	{
	    top = sqrt(top);
	    float t1 = (-b-top)/(2.0*a);
	    float t2 = (-b+top)/(2.0*a);
	    if (t1 > 0.01 && (t1 < t2 || t2 < 0.01))
	    {
		return t1;
	    } else if (t2 > 0.01 && (t2 < t1 || t1 < 0.01))
	    {
		return t2;
	    }
	}
	return 100000.0;
}

float distToPlane(vec3 rayD, vec3 rayP, vec3 pP, vec3 pN)
{
	float t = dot(pP-rayP, pN) / dot(rayD, pN);
	if (t > 0.001)
	{
	    return t;
	}
	return 10000.0;
}
float distToPoint(vec3 rayP, vec3 P)
{
	vec3 x = P-rayP;
	return sqrt( dot(x,x) );
}
    `;
    const mainFunction = `void main() {
        vec3 rayD = unit(vec3(vScreenPos.x*3.0, vScreenPos.y*3.0, 5.0));
        rayD = ( uRotationMatrix * vec4(rayD.xyz,1.0) ).xyz;        
        vec3 rayP = uViewPosition.xyz;  //vec3(0.0, 0.0, 0.0);
        gl_FragColor = fireRay(rayD, rayP);
    }`;
    var planes = [
        //Position              Normal         Color
        [new vec4(0,0,10), new vec4(0,0,1), new vec4(1,0,0)], //back
        [new vec4(0,5,0), new vec4(0,-1,0), new vec4(0,1,0)], //top
        [new vec4(0,-5,0), new vec4(0,1,0), new vec4(0,0,1)], //bottom
        [new vec4(5,0,0), new vec4(-1,0,0), new vec4(0.5,0.5,0)], //right
        [new vec4(-5,0,0), new vec4(1,0,0), new vec4(0,0.5,0.5)], //left
    ];
    var spheres = [
        [new vec4(0,0,5), 1],
        [new vec4(1,2,6), 1],
        [new vec4(-3,-2,6), 1],
        [new vec4(0,-2,6), 2],
    ];
    /*
    var spheres = [];
    let max = 4;
    for (var x=0; x<max; x++)
    {
        for (var z=0;z<max;z++)
        {
            for (var y=0; y<max; y++)
            {
                spheres.push( [ new vec4(x*2,y*2,z*2), 1])
            }
        }
    }*/

    var planeReflectance = 0.99; //any value 0.1 to 0.99;



    
    var str = "vec4 fireRay(vec3 rayD, vec3 rayP) { \nvec4 color = vec4(0,0,0,1); \nfloat percentDone = 0.0;\n";
    str += "vec3 lightSource = vec3(3,3,6);\n"; //adding lightsource

    //Adding sphere & plane distance and leaving variables
    str +="\n\n//Spheres:\n";
    for (var i in spheres)
    {
        str += "float SD"+i+"=10000.0; bool leavingS"+i+"=false;\n";
        str += "vec3 SC"+i+"=vec3("+spheres[i][0].x+", "+spheres[i][0].y+", "+spheres[i][0].z+"); float SR"+i+"="+spheres[i][1]+".0;\n";
    }

    str +="\n\n//Planes:\n";
    for (var i in planes)
    {
        str += "float PD"+i+"=10000.0; bool leavingP"+i+"=false;\n";
        str += "vec3 PC"+i+"=vec3("+planes[i][0].x+", "+planes[i][0].y+", "+planes[i][0].z+"); vec3 PN"+i+"=vec3("+planes[i][1].x+", "+planes[i][1].y+", "+planes[i][1].z+");\n";
    }

    //beginning of for loop
    str += "\n\n//Loop:\nfor (int i=0; i<10; i++) {\n";

    //Get initial distances
    str += "\n\n//Get Distances:\n";
    for (var i in spheres)
    {
        str += "if (!leavingS"+i+") {SD"+i+"=distToSphere(rayD, rayP, SC"+i+", SR"+i+");} else {SD"+i+"=10000.0;} \n";
    }
    for (var i in planes)
    {
        str += "if (!leavingP"+i+") {PD"+i+"=distToPlane(rayD, rayP, PC"+i+", PN"+i+");} else {PD"+i+"=10000.0;} \n";
    }


    //Reset all 'leaving...' booleans
    str += "\n\n//Reseting leaving...\n";
    for (var i in spheres)
    {
        str += "leavingS"+i+" = false;\n";
    }
    for (var i in planes)
    {
        str += "leavingP"+i+" = false;\n";
    }


    //Min Function - Needs Optimization.
    str += "\n\n//MinFunction:\n";
    str += "float m = ";
    var ds = [];
    for (var i in spheres) {ds.push("SD"+i);}
    for (var i in planes) {ds.push("PD"+i);}
    for (var i=0; i<ds.length-1; i++)
    {
        str +='min(';
    }
    str += ds[0] +", ";
    for (var i=1; i<ds.length-1; i++)
    {
        str += ds[i] +"), ";
    }
    str += ds[ds.length-1] +");";
    

    //Sphere if statements
    str += "\n\n//Spheres If Statements:\n"
    for (var i in spheres)
    {
        str += "if (m == SD"+i+"){\n";
        str += "rayP += rayD*m;\n";
        str += "rayD = reflectRay(rayD, unit(SC"+i+"-rayP));\n";
        str += "leavingS"+i+" = true;\n";
        str += "continue; \n}\n";
    }


    //Plane if statements
    str += "\n\n//Plane If Statements:\n"
    str += "vec3 newRayP = rayP + rayD*m;\n";
    str += "vec3 newRayD = unit(lightSource - newRayP);\n";
    str += "float d = distToPoint(newRayP, lightSource);\n";
    for (var i in spheres)
    {
        str += "SD"+i+"=distToSphere(newRayD, newRayP, SC"+i+", SR"+i+");\n";
    }
    str += "if (";
    for (var i in spheres)
    {
        str += "(SD"+i+"<d && SD"+i+">0.01)";
        if (i != spheres.length-1) { str += " || ";}
    }
    str += "){ d = d*1.5; }\n";
    str += "d = d/uLightDistanceDivisor;";

    for (var i in planes)
    {
        str += "if (m == PD"+i+"){\n";
        str += "rayP += rayD*m;\n";
        str += "rayD = reflectRay(rayD, PN"+i+");\n";
        str += "color += (1.0-percentDone)*"+planeReflectance+"*vec4("+planes[i][2].x.toPrecision(2)+"/d, "+planes[i][2].y.toPrecision(2)+"/d, "+planes[i][2].z.toPrecision(2)+"/d, 0);\n";
        str += "percentDone += (1.0-percentDone)*uPlaneReflectance;\n";
        str += "leavingP"+i+" = true;\n";
        str += "continue; \n}\n";
    }

    str += "\n\nif (percentDone > 0.95) { return color; }\n";
    str += "} return color;}";
    console.log(defaultCode + str + mainFunction);
    return defaultCode + str + mainFunction;
}


function generateShader2() {
    const defaultCode = `
    precision highp float;
    varying vec4 vScreenPos;

    uniform vec4 uViewPosition;
    uniform mat4 uRotationMatrix;
    uniform float uLightDistanceDivisor;
    uniform float uPlaneReflectance;

    vec3 unit(vec3 r)
    {
        float d = sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
        if (d < 0.0) { d = -d;}
        r.x = r.x / d;
        r.y = r.y / d;
        r.z = r.z / d;
        return r;
    }

    vec3 reflectRay(vec3 rayD, vec3 N)
    {
        float d = dot(rayD, N)*2.0;
        return unit( rayD - N*d );
    }
    float distToSphere(vec3 rayD, vec3 rayP, vec3 sC, float sR)
    {
        float a = rayD.x*rayD.x + rayD.y*rayD.y + rayD.z*rayD.z;
        float b = 2.0 * (rayD.x * (rayP.x - sC.x) + rayD.y * (rayP.y - sC.y) + rayD.z * (rayP.z - sC.z));
        float c = (rayP.x-sC.x)*(rayP.x-sC.x) + (rayP.y-sC.y)*(rayP.y-sC.y) + (rayP.z-sC.z)*(rayP.z-sC.z) - sR*sR;
        float top = b*b - 4.0*a*c;

        if (top >= 0.001)
        {
            top = sqrt(top);
            float t1 = (-b-top)/(2.0*a);
            float t2 = (-b+top)/(2.0*a);
            if (t1 > 0.01 && (t1 < t2 || t2 < 0.01))
            {
            return t1;
            } else if (t2 > 0.01 && (t2 < t1 || t1 < 0.01))
            {
            return t2;
            }
        }
        return 100000.0;
    }

    float distToPlane(vec3 rayD, vec3 rayP, vec3 pP, vec3 pN)
    {
        float t = dot(pP-rayP, pN) / dot(rayD, pN);
        if (t > 0.001)
        {
            return t;
        }
        return 10000.0;
    }
    float distToPoint(vec3 rayP, vec3 P)
    {
        vec3 x = P-rayP;
        return sqrt( dot(x,x) );
    }


    vec4 fireRay(vec3 rayD, vec3 rayP) {
        vec4 color = vec4(0,0,0,1);
        float percentDone = 0.0;

        vec3 sC = vec3(0,0,4);
        float sR = 1.0;

        vec3 sC2 = vec3(1,2,5);
        float sR2 = 0.6;

        vec3 lC = vec3(4,0,8);

        bool leavingSphere = false;
        bool leavingSphere2 = false;

        float sD = 10000.0;
        float sD2 = 10000.0;
        float pD1 = 10000.0;
        float pD2 = 10000.0;
        float pD3 = 10000.0;
        float pD4 = 10000.0;
        float pD5 = 10000.0;


        for (int i=0; i<10; i++) {

            if (!leavingSphere) { sD = distToSphere(rayD, rayP, sC, sR); } else { sD = 10000.0; }
            //if (!leavingSphere) { sD = distToCube(rayD, rayP, sC, sR); } else { sD = 10000.0; }
            if (!leavingSphere2) { sD2 = distToSphere(rayD, rayP, sC2, sR2); } else { sD2 = 10000.0; }
            //pD1 = distToPlane(rayD, rayP, vec3(0,  0,  10), vec3(0,0,1));
            //pD2 = distToPlane(rayD, rayP, vec3(5,  0,  0), vec3(1,0,0));
            //pD3 = distToPlane(rayD, rayP, vec3(-5, 0,  0), vec3(1,0,0));
            pD4 = distToPlane(rayD, rayP, vec3(0,  5,  0), vec3(0,1,0));
            pD5 = distToPlane(rayD, rayP, vec3(0,  -5, 0), vec3(0,1,0));

            float m = min(min(min(sD, pD1), min(pD2, pD3)), min(pD4, pD5));
            m = min(m, sD2);


            if (m == sD)
            {
                rayP = rayP + rayD*m;
                rayD = reflectRay(rayD, unit(sC-rayP + vec3(sin(rayP.x*50.0), sin(rayP.y*50.0),sin(rayP.z*50.0))*0.1 ));
                leavingSphere = true;
            } else if (m == sD2)
            {
                rayP = rayP + rayD*m;
                rayD = reflectRay(rayD, unit(rayP-sC2) );
                leavingSphere2 = true;
            } else {
                leavingSphere = false;
                leavingSphere2 = false;

                vec3 newRayP = rayP + rayD*m;
                vec3 newRayD = unit( lC - newRayP);
                float d = distToPoint(newRayP, lC);
                float d2 = distToSphere(newRayD, newRayP, sC, sR);
                float d3 = distToSphere(newRayD, newRayP, sC2, sR2);
                if ((d2 < d && d2 > 0.0) || (d3 < d && d3 > 0.0)){
                    d = d*2.0;
                }

                d = d/uLightDistanceDivisor;

                if (m == pD1)
                {
                    return vec4(1.0/d,0,0,1)*(1.0-percentDone) + percentDone*color;
                }else if (m == pD2)
                {
                    rayP = rayP + m*rayD;
                    rayD = reflectRay(rayD, vec3(1,0,0));
                    color += (1.0-percentDone)*uPlaneReflectance*vec4(0,0,1.0/d,0);
                    percentDone += (1.0-percentDone)*uPlaneReflectance;
                }else if (m == pD3)
                {
                    rayP = rayP + m*rayD;
                    rayD = reflectRay(rayD, vec3(1,0,0));
                    color += (1.0-percentDone)*uPlaneReflectance*vec4(0,1.0/d,1.0/d,0);
                    percentDone += (1.0-percentDone)*uPlaneReflectance;
                    //return vec4(0,0.5/d,0.5/d,1)*(1.0-percentDone) + percentDone*color;
                }else if (m == pD4)
                {
                    return vec4(0.5/d,0.5/d,0,1)*(1.0-percentDone) + percentDone*color;
                }else if (m == pD5)
                {
                    rayP = rayP + m*rayD;
                    rayD = reflectRay(rayD, vec3(0,1,0));
                    color += (1.0-percentDone)*uPlaneReflectance*vec4(1.0/d,1.0/d,1.0/d,0);
                    percentDone += (1.0-percentDone)*uPlaneReflectance;
                    //return vec4(1.0/d,1.0/d,1.0/d,1)*(1.0-percentDone) + percentDone*color;
                }
            }


            if (percentDone > 0.95)
            {
                return color;
            }
            
        }

        //Return white if there's an issue and nothing is hit.
        return color;
    }

    void main() {
        vec3 rayD = unit(vec3(vScreenPos.x*3.0, vScreenPos.y*3.0, 5.0));
        rayD = ( uRotationMatrix * vec4(rayD.xyz,1.0) ).xyz;        
        vec3 rayP = uViewPosition.xyz;  //vec3(0.0, 0.0, 0.0);
        gl_FragColor = fireRay(rayD, rayP);
    }
    `;

    return defaultCode;
}










/*



Concrete density: 0.087 lbs per cubic inch
Radius: 3"
Height: 5"

Volume: 141 cubit inches
Mass: 12.2 lbs per side

Circumference: 19"

Cardboard dimensions: 19" x 5" (make it 6" tall)



*/







/* OLD CODE:
    const fsSourceHeader = `
    precision highp float;
    varying vec4 vScreenPos;

    uniform vec4 uViewPosition;
    uniform mat4 uRotationMatrix;
    uniform float uLightDistanceDivisor;

    `;
    const toUnitFunction = `
    vec3 unit(vec3 r)
    {
        float d = sqrt(r.x*r.x + r.y*r.y + r.z*r.z);
        if (d < 0.0) { d = -d;}
        r.x = r.x / d;
        r.y = r.y / d;
        r.z = r.z / d;
        return r;
    }
    `;
    const reflectRayFunction = `
    vec3 reflectRay(vec3 rayD, vec3 N)
    {
        //float d = (rayD.x*N.x + rayD.y*N.y + rayD.z*N.z)*2.0;
        float d = dot(rayD, N)*2.0;
        return unit( rayD - N*d );
    }
    `;
    const distToSphereFunction = `
    float distToSphere(vec3 rayD, vec3 rayP, vec3 sC, float sR)
    {
        float a = rayD.x*rayD.x + rayD.y*rayD.y + rayD.z*rayD.z;
        float b = 2.0 * (rayD.x * (rayP.x - sC.x) + rayD.y * (rayP.y - sC.y) + rayD.z * (rayP.z - sC.z));
        float c = (rayP.x-sC.x)*(rayP.x-sC.x) + (rayP.y-sC.y)*(rayP.y-sC.y) + (rayP.z-sC.z)*(rayP.z-sC.z) - sR*sR;
        float top = b*b - 4.0*a*c;

        if (top >= 0.001)
        {
            top = sqrt(top);
            float t1 = (-b-top)/(2.0*a);
            float t2 = (-b+top)/(2.0*a);
            if (t1 > 0.01 && (t1 < t2 || t2 < 0.01))
            {
                return t1;
            } else if (t2 > 0.01 && (t2 < t1 || t1 < 0.01))
            {
                return t2;
            }
        }
        return 100000.0;
    }
    `;
    const distToCubeFunction = `
    float distToCube(vec3 rayD, vec3 rayP, vec3 bC, float bR)
    {
        float d = distToPlane(rayD, rayP, bC + vec3(0,0,bR), vec3(0,0,1));
        if (d > 0.0 && d < 1000.0)
        {
            vec3 newRayP = rayP + rayD * d;
            if (newRayP.x < bC.x + bR   &&  newRayP.x > bC.x - bR 
                && newRayP.y < bC.y + bR   &&  newRayP.y > bC.y - bR)
            {
                return d;
            }
        }
        return 10000.0;
    }
    `;
    const distToPlaneFunction = `
    float distToPlane(vec3 rayD, vec3 rayP, vec3 pP, vec3 pN)
    {
        float t = dot(pP-rayP, pN) / dot(rayD, pN);
        if (t > 0.001)
        {
            return t;
        }
        return 10000.0;
    }
    `;
    const distToPointFunction = `
    float distToPoint(vec3 rayP, vec3 P)
    {
        vec3 x = P-rayP;
        return sqrt( dot(x,x) );
    }
    `;
    const mainFunction = `
    void main() {
        vec3 rayD = unit(vec3(vScreenPos.x*3.0, vScreenPos.y*3.0, 5.0));
        rayD = ( uRotationMatrix * vec4(rayD.xyz,1.0) ).xyz;        

        vec3 rayP = uViewPosition.xyz;  //vec3(0.0, 0.0, 0.0);
    
        gl_FragColor = fireRay(rayD, rayP);
    }
    `;
    const fireRayFunction = `

    vec4 fireRay(vec3 rayD, vec3 rayP)
    {
        vec4 color = vec4(0,0,0,1);
        float percentDone = 0.0;

        vec3 sC = vec3(0,0,4);
        float sR = 1.0;

        vec3 sC2 = vec3(1,2,5);
        float sR2 = 0.6;

        vec3 lC = vec3(4,0,8);

        bool leavingSphere = false;
        bool leavingSphere2 = false;

        float sD = 10000.0;
        float sD2 = 10000.0;
        float pD1 = 10000.0;
        float pD2 = 10000.0;
        float pD3 = 10000.0;
        float pD4 = 10000.0;
        float pD5 = 10000.0;


        for (int i=0; i<10; i++) {

            if (!leavingSphere) { sD = distToSphere(rayD, rayP, sC, sR); } else { sD = 10000.0; }
            //if (!leavingSphere) { sD = distToCube(rayD, rayP, sC, sR); } else { sD = 10000.0; }
            if (!leavingSphere2) { sD2 = distToSphere(rayD, rayP, sC2, sR2); } else { sD2 = 10000.0; }
            pD1 = distToPlane(rayD, rayP, vec3(0,  0,  10), vec3(0,0,1));
            pD2 = distToPlane(rayD, rayP, vec3(5,  0,  0), vec3(1,0,0));
            pD3 = distToPlane(rayD, rayP, vec3(-5, 0,  0), vec3(1,0,0));
            //pD4 = distToPlane(rayD, rayP, vec3(0,  5,  0), vec3(0,1,0));
            pD5 = distToPlane(rayD, rayP, vec3(0,  -5, 0), vec3(0,1,0));

            float m = min(min(min(sD, pD1), min(pD2, pD3)), min(pD4, pD5));
            m = min(m, sD2);


            if (m == sD)
            {
                rayP = rayP + rayD*m;
                rayD = reflectRay(unit(rayD), unit(sC-rayP));
                //rayD = reflectRay(rayD, vec3(0,0,1));
                
                float d2 = distToSphere(rayD, rayP, sC, sR);
                float d = distToPoint(rayP, lC);
                if (d2 > d)
                {
                    //color += (1.0-percentDone)*0.0*vec4(1,1,1,0);
                    //percentDone += (1.0-percentDone)*0.0;
                }
                leavingSphere = true;
            } else if (m == sD2)
            {
                rayP = rayP + rayD*m;
                rayD = reflectRay(rayD, unit(sC2-rayP) );

                leavingSphere2 = true;
            } else {
                leavingSphere = false;
                leavingSphere2 = false;

                vec3 newRayP = rayP + rayD*m;
                vec3 newRayD = unit( lC - newRayP);
                float d = distToPoint(newRayP, lC);
                float d2 = distToSphere(newRayD, newRayP, sC, sR);
                float d3 = distToSphere(newRayD, newRayP, sC2, sR2);
                if ((d2 < d && d2 > 0.0) || (d3 < d && d3 > 0.0)){
                    d = d*2.0;
                }

                d = d/uLightDistanceDivisor;

                if (m == pD1)
                {
                    return vec4(1.0/d,0,0,1)*(1.0-percentDone) + percentDone*color;
                }else if (m == pD2)
                {
                    return vec4(0,1.0/d,0,1)*(1.0-percentDone) + percentDone*color;
                }else if (m == pD3)
                {
                    rayP = rayP + m*rayD;
                    rayD = reflectRay(rayD, vec3(1,0,0));
                    color += (1.0-percentDone)*0.9*vec4(0,1.0/d,1.0/d,0);
                    percentDone += (1.0-percentDone)*0.9;
                    //return vec4(0,0.5/d,0.5/d,1)*(1.0-percentDone) + percentDone*color;
                }else if (m == pD4)
                {
                    return vec4(0.5/d,0.5/d,0,1)*(1.0-percentDone) + percentDone*color;
                }else if (m == pD5)
                {
                    rayP = rayP + m*rayD;
                    rayD = reflectRay(rayD, vec3(0,1,0));
                    color += (1.0-percentDone)*0.99*vec4(1.0/d,1.0/d,1.0/d,0);
                    percentDone += (1.0-percentDone)*0.99;
                    //return vec4(1.0/d,1.0/d,1.0/d,1)*(1.0-percentDone) + percentDone*color;
                }
            }


            if (percentDone > 0.95)
            {
                return color;
            }
            
        }

        //Return white if there's an issue and nothing is hit.
        return vec4(1,1,1,1);
    }
    `;

    //let fireRayFunction2 = generateShader();

    const fsSource  =  fsSourceHeader + toUnitFunction + reflectRayFunction + distToPlaneFunction + distToCubeFunction + distToPointFunction + distToSphereFunction +
    fireRayFunction + mainFunction;
*/