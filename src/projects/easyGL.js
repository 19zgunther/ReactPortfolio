import { vec4, mat4, distanceBetweenPoints } from "./myMath";
/* This is a GL Wrapper class that makes rendering basic object easy.
*  Basic Functions:
*       constructor - takes htmlCanvasElement
*       set/get Camera Position/Rotation - gets and sets viewport/camera position and rotation
*       clear - clears the screen
*       create & delete object - create an object with a unique ID or name, with given vertices, indices, normals, and a color or colors.
*       set/get Object Position/Rotation - (given id) modify and get position and rotation of a given object
*       renderObject(objID) - renders a given object (given id) to the screen.
*       renderAll() - renders all objects
*
*       setAmbientLightLevel is setting the lowest light level for directional light (0.01 to 0.99, normal is 0.25)
*       enableDirectionalLighting is enabling/disabling directional lighting.
*       setDirectionalLightingDirection sets the direction the light is coming from
*
*       TODO:
*           - Possibly modify base shader to improve performance 
*           - Implement object picker functionality.
*           - Implement optional shadows
*/
class EasyGL {
    constructor(htmlCanvasElement = null, clearColor=new vec4(.1,.1,.1,1)) {
        //Make sure htmlCanvasElement is not null.
        if (htmlCanvasElement == null) { console.error("Cannot instantiate GL object without canvasElement"); return null;}
        this.htmlCanvasElement = htmlCanvasElement;
        let bb = this.htmlCanvasElement.getBoundingClientRect();
        this.htmlCanvasElement.width = Math.round(bb.width);
        this.htmlCanvasElement.height = Math.round(bb.height);

        this.gl = htmlCanvasElement.getContext('webgl');
        //Make sure this.webgl is instance of WebGlRenderingContext
        if (!(this.gl instanceof WebGLRenderingContext)) { console.error("Failed to create webgl context."); return null;}
    

        //Initialize camera Information
        this.cameraPosition = new vec4(0,0,1);
        this.cameraRotation = new vec4();
        this.cameraTranslationMatrix = new mat4().makeTranslation(this.cameraPosition.mul(-1));
        this.cameraRotationMatrix = new mat4().makeRotation(this.cameraRotation);
        this.FOV = 1;
        this.zNear = 1;
        this.zFar = 1000;
        this.aspectRatio = 1;
        this.viewMatrix = this.cameraTranslationMatrix.mul(this.cameraRotationMatrix);
        this.projectionMatrix = new mat4().makePerspective(1,1,1,1000);
        this._updateViewMatrix();

        //Environment Settings
        this.clearColor = clearColor;
        this.ambientLightLevel = 0.7;        //Minimum light level ranging from 0.01 to 0.99
        this.directionalLighting = true;      //Enable/disable directional lighting & use of normals;
        this.directionalLightingDirection = new vec4(0.74, 0.6, 0.4);

        //Rendering settings
        this.renderAllObjectsInOrder = true;   //Enable/disable rendering objects from farthest from camera to nearest, or just in order of instantiation.
                                        //Useful if trying to render semi-transparent objects
        this.renderAllObjectsInOrderDelayMs = 10; //if rendering at 60 fps, we don't need to sort every frame, but rather only update after every _ milliseconds
        this.renderReverseFaces = false; //Enable/disable rendering or culling faces not facing the camera.



        //Object Information
        this.objects = new Map();
        this.objectIDs = [];
        this.sortedSolidObjs = [];
        this.sortedTransObjs = []; 


        //Texture info
        this.textures = new Map();
        this.textureIDs = [];

        //Initialize Shader - following are set in _initShader()
        this.programInfo = null;
        this.shaderProgram = null;
        this.textureProgramInfo = null;
        this.textureShaderProgram = null;
        this.pickerProgramInfo = null;
        this.pickerShaderProgram = null;
        
        //Init Picker - 
        this.pickerFrameBuffer = null; //Set in _initPickerShader - frameBuffer for rendering to for picker
        this.pickerTexture = null; //Set in _initPickerShader - texture in frameBuffer ^
        this.pickerDepthBuffer = null; //^ depth buffer also needs to be stored

        this._initShader();
        this._initTextureShader();
        this._initPickerShader();
        this._initSkyboxShader();
        this.clear();
    }

    //Shader Indertnal Functions
    __loadShader(type, source)//helper function used by _initShader() and _initPickerShader()
     {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
    
        // See if it compiled successfully
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    _initShader()//initialize the default shader
    {
        
        let vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aNormalVector;
        attribute vec4 aColor;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uObjectMatrix;
        uniform mat4 uObjectRotationMatrix;
        uniform vec4 uLightDirectionVector;
        uniform float uAmbientLightLevel;

        varying highp vec4 color;
        varying highp vec4 pos;
        varying highp vec3 surfaceNormal;

        void main() {
            vec4 vPos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
            pos = uObjectMatrix * vPos;
            gl_Position = uProjectionMatrix * uViewMatrix * pos;
            
            surfaceNormal = (uObjectRotationMatrix * aNormalVector).xyz;
            float d = dot(surfaceNormal, uLightDirectionVector.xyz);

            float scalar = d*(1.0-uAmbientLightLevel) + uAmbientLightLevel;
            color = aColor * scalar;
            color.w = aColor.w;
        }`;
    
        const fsSource = `
        precision mediump float;
        varying vec4 color;
        varying vec4 pos;
        varying vec3 surfaceNormal;
        uniform highp vec4 uLightDirectionVector;
        uniform vec4 uCameraPositionVector;
        uniform float uObjectReflectivity;

        void main() {
            vec3 ray = reflect( normalize(pos.xyz - uCameraPositionVector.xyz), surfaceNormal);
            float d = dot(uLightDirectionVector.xyz, ray);
            if (d < 0.0) { 
                gl_FragColor = color;
            } else { 
                d = (d*d*d*d)*uObjectReflectivity; 
                gl_FragColor = color + d*vec4(0.9,0.9,0.9,0.9);
            }
        }
        `;
        const vertexShader = this.__loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.__loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexLocation: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                normalLocation: this.gl.getAttribLocation(shaderProgram, 'aNormalVector'),
                colorLocation: this.gl.getAttribLocation(shaderProgram, 'aColor'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                viewMatrix: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
                objectMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
                objectRotationMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectRotationMatrix'),
                lightDirectionVector: this.gl.getUniformLocation(shaderProgram, 'uLightDirectionVector'),
                ambientLightLevelFloat: this.gl.getUniformLocation(shaderProgram, 'uAmbientLightLevel'),
                cameraPositionVector: this.gl.getUniformLocation(shaderProgram, 'uCameraPositionVector'),
                objectReflectivity: this.gl.getUniformLocation(shaderProgram, 'uObjectReflectivity'),
            },
        };

        this.shaderProgram = shaderProgram;
        this.programInfo = programInfo;
    }
    _initTextureShader()//initialize the default shader
    {
        
        const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aNormalVector;
        attribute vec4 aColor;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uObjectMatrix;
        uniform mat4 uObjectRotationMatrix;
        uniform vec4 uLightDirectionVector;
        uniform float uAmbientLightLevel;

        varying highp float colorScalar;
        varying highp vec4 pos;
        varying highp vec3 surfaceNormal;

        attribute vec2 aTextureCoord;
        varying highp vec2 textureCoord;

        void main() {
            vec4 vPos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
            pos = uObjectMatrix * vPos;
            gl_Position = uProjectionMatrix * uViewMatrix * pos;
            
            surfaceNormal = (uObjectRotationMatrix * aNormalVector).xyz;
            float d = dot(surfaceNormal, uLightDirectionVector.xyz);

            colorScalar = d*(1.0-uAmbientLightLevel) + uAmbientLightLevel;
            //color = aColor * scalar;
            //color.w = aColor.w;

            textureCoord = aTextureCoord;
        }`;
    
        const fsSource = `
        precision mediump float;
        varying float colorScalar;
        varying vec4 pos;
        varying vec3 surfaceNormal;
        uniform highp vec4 uLightDirectionVector;
        uniform vec4 uCameraPositionVector;
        uniform float uObjectReflectivity;

        varying highp vec2 textureCoord;
        uniform sampler2D uTextureSampler;

        void main() {
            vec3 ray = reflect( normalize(pos.xyz - uCameraPositionVector.xyz), surfaceNormal);
            float d = dot(uLightDirectionVector.xyz, ray);
            
            vec4 color = texture2D(uTextureSampler, textureCoord)*0.5 + vec4(0.3,0.3,0.3, 0.5) * colorScalar;
            
            if (d < 0.0) { 
                gl_FragColor = color;
            } else { 
                d = (d*d*d*d)*uObjectReflectivity; 
                gl_FragColor = color + d*vec4(0.9,0.9,0.9,0.9);
            }
        }
        `;
        const vertexShader = this.__loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.__loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexLocation: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                normalLocation: this.gl.getAttribLocation(shaderProgram, 'aNormalVector'),
                textureCoordLocation: this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                viewMatrix: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
                objectMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
                objectRotationMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectRotationMatrix'),
                lightDirectionVector: this.gl.getUniformLocation(shaderProgram, 'uLightDirectionVector'),
                ambientLightLevelFloat: this.gl.getUniformLocation(shaderProgram, 'uAmbientLightLevel'),
                cameraPositionVector: this.gl.getUniformLocation(shaderProgram, 'uCameraPositionVector'),
                objectReflectivity: this.gl.getUniformLocation(shaderProgram, 'uObjectReflectivity'),
                textureSampler: this.gl.getUniformLocation(shaderProgram, 'uTextureSampler'),
            },
        };

        this.textureShaderProgram = shaderProgram;
        this.textureProgramInfo = programInfo;
    }
    _initPickerShader() //initialize shader for object picker
    {
        const vsSource = `
        attribute vec4 aVertexPosition;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uObjectMatrix;
        void main() {
            vec4 vPos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
            gl_Position = uProjectionMatrix * uViewMatrix * uObjectMatrix * vPos;
        }`;
    
        const fsSource = `
        precision mediump float;
        uniform vec4 uColorVector;
        void main() {
            gl_FragColor = uColorVector;
            //gl_FragColor = vec4(0.5,0,1,1);
        }
        `;
        const vertexShader = this.__loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.__loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }


        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexLocation: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                viewMatrix: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
                objectMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
                colorVector: this.gl.getUniformLocation(shaderProgram, 'uColorVector'),
            },
        };

        this.pickerShaderProgram = shaderProgram;
        this.pickerProgramInfo = programInfo;


        //Now for the framebuffer stuff...
         this.pickerFrameBuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,  this.pickerFrameBuffer);

        this.pickerTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickerTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.htmlCanvasElement.width, this.htmlCanvasElement.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        // attach the texture as the first color attachment
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.pickerTexture, 0);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,  this.pickerFrameBuffer);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickerTexture);

        this.pickerDepthBuffer = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.pickerDepthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.htmlCanvasElement.width, this.htmlCanvasElement.height);
        this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.pickerDepthBuffer);


        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    }
    _initSkyboxShader()
    {
        const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec4 aColor;
        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;

        varying highp vec4 pos;

        void main() {
            vec4 vPos = vec4(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z, 1.0);
            pos = vPos;
            gl_Position = uProjectionMatrix * uViewMatrix * pos;
        }`;
    
        const fsSource = `
        precision mediump float;
        varying vec4 pos;

        void main() {
            gl_FragColor = vec4(pos.xyz, 1.0);
        }
        `;
        const vertexShader = this.__loadShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.__loadShader(this.gl.FRAGMENT_SHADER, fsSource);

        // Create the shader program
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        // If creating the shader program failed, alert
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        const programInfo = {
            program: shaderProgram,
            attribLocations: {
                vertexLocation: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                normalLocation: this.gl.getAttribLocation(shaderProgram, 'aNormalVector'),
                textureCoordLocation: this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
            },
            uniformLocations: {
                projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                viewMatrix: this.gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
                objectMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectMatrix'),
                objectRotationMatrix: this.gl.getUniformLocation(shaderProgram, 'uObjectRotationMatrix'),
                lightDirectionVector: this.gl.getUniformLocation(shaderProgram, 'uLightDirectionVector'),
                ambientLightLevelFloat: this.gl.getUniformLocation(shaderProgram, 'uAmbientLightLevel'),
                cameraPositionVector: this.gl.getUniformLocation(shaderProgram, 'uCameraPositionVector'),
                objectReflectivity: this.gl.getUniformLocation(shaderProgram, 'uObjectReflectivity'),
                textureSampler: this.gl.getUniformLocation(shaderProgram, 'uTextureSampler'),
            },
        };

        this.skyboxShaderProgram = shaderProgram;
        this.skyboxProgramInfo = programInfo;
    }


    //Rendering Functions
    clear(tempClearColor_Vec4 = null) //Clear the screen to default color
    {
        // Clear the canvas before we start drawing on it.
        if (tempClearColor_Vec4 instanceof vec4) {
            this.gl.clearColor(tempClearColor_Vec4.x, tempClearColor_Vec4.y, tempClearColor_Vec4.z, tempClearColor_Vec4.a);    // Clear to temp color
        } else {
            this.gl.clearColor(this.clearColor.x, this.clearColor.y, this.clearColor.z, this.clearColor.a);    // Clear to this.clearColor
        }
        this.gl.clearDepth(1);                   // Clear everything

        //Enable depth testing & blending
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.enable(this.gl.BLEND);
        this.gl.depthMask(true);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        
        if (this.renderReverseFaces == true) { this.gl.disable(this.gl.CULL_FACE);
        } else {                                this.gl.enable(this.gl.CULL_FACE); }
        
        //Clearing color and depth buffer
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
        //Set Viewport
        this.gl.viewport(0, 0, this.htmlCanvasElement.width, this.htmlCanvasElement.height);
    }
    clearDepthBuffer() // clears the depth buffer, thus allowing for rendering items after to be "on top" of closer elements (used for UI and such).
    {
        this.gl.clearDepth(1);
        this.gl.clear(this.gl.DEPTH_BUFFER_BIT);
    }
    renderObject(objectID = 0) //renders specific object
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { return; console.error("Object: " + objectID + " Does Not Exist. Cannot Render."); return; }

        if (objectData.textureID != undefined && objectData.textureID != null)
        {
            const textureData = this.textures.get(objectData.textureID);
            if (textureData == null) { console.error("Cannot render textured object with invalid texture ID"); return; }
            this.gl.useProgram(this.textureProgramInfo.program);

            //BIND BUFFERS ///////////////////////////////////////////
            //Bind Vertices Buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.verticesBuffer);
            this.gl.vertexAttribPointer(this.textureProgramInfo.attribLocations.vertexLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.textureProgramInfo.attribLocations.vertexLocation);
    
            //Bind Normals Buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.normalsBuffer);
            this.gl.vertexAttribPointer(this.textureProgramInfo.attribLocations.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.textureProgramInfo.attribLocations.normalLocation);
    
            //Bind textureCoord Buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.textureCoordBuffer);
            this.gl.vertexAttribPointer(this.textureProgramInfo.attribLocations.textureCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.textureProgramInfo.attribLocations.textureCoordLocation);
    
            //Bind Indices
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, objectData.indicesBuffer);

            //this.gl.activeTexture(gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, textureData.texture);

            //BIND UNIFORMS////////////////////////////////////////
            // Set the shader uniforms
            this.gl.uniformMatrix4fv(this.textureProgramInfo.uniformLocations.projectionMatrix,  false, this.projectionMatrix.getFloat32Array());
            this.gl.uniformMatrix4fv(this.textureProgramInfo.uniformLocations.viewMatrix, false, this.viewMatrix.getFloat32Array());
            this.gl.uniformMatrix4fv(this.textureProgramInfo.uniformLocations.objectMatrix, false, objectData.objectMatrix.getFloat32Array());
            this.gl.uniformMatrix4fv(this.textureProgramInfo.uniformLocations.objectRotationMatrix, false, objectData.objectRotationMatrix.getFloat32Array());
            this.gl.uniform4fv(this.textureProgramInfo.uniformLocations.lightDirectionVector, this.directionalLightingDirection.getFloat32Array());
            this.gl.uniform4fv(this.textureProgramInfo.uniformLocations.cameraPositionVector, this.cameraPosition.getFloat32Array());
            this.gl.uniform1f(this.textureProgramInfo.uniformLocations.objectReflectivity, objectData.reflectivity);
            this.gl.uniform1f(this.textureProgramInfo.uniformLocations.ambientLightLevelFloat, this.ambientLightLevel);
            this.gl.uniform1i(this.textureProgramInfo.uniformLocations.textureSampler, 0);

            //RENDER////////////////////////////////////////////////
            this.gl.drawElements(this.gl.TRIANGLES, objectData.indices.length, this.gl.UNSIGNED_SHORT, 0);
            //this.gl.drawArrays(this.gl.TRIANGLES, 0, objectData.indices.length, this.gl.UNSIGNED_SHORT, 0);

            //this.gl.bindTexture(gl.TEXTURE_2D, null);
            return;
        }
        this.gl.useProgram(this.programInfo.program);

        //BIND BUFFERS ///////////////////////////////////////////
        //Bind Vertices Buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.verticesBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexLocation);

        //Bind Normals Buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.normalsBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.normalLocation);

        //Bind Colors Buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.colorsBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.colorLocation, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.colorLocation);

        //Bind Indices
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, objectData.indicesBuffer);

        
        //BIND UNIFORMS////////////////////////////////////////
        // Set the shader uniforms
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix,  false, this.projectionMatrix.getFloat32Array());
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.viewMatrix, false, this.viewMatrix.getFloat32Array());
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.objectMatrix, false, objectData.objectMatrix.getFloat32Array());
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.objectRotationMatrix, false, objectData.objectRotationMatrix.getFloat32Array());
        this.gl.uniform4fv(this.programInfo.uniformLocations.lightDirectionVector, this.directionalLightingDirection.getFloat32Array());
        this.gl.uniform4fv(this.programInfo.uniformLocations.cameraPositionVector, this.cameraPosition.getFloat32Array());
        this.gl.uniform1f(this.programInfo.uniformLocations.objectReflectivity, objectData.reflectivity);
        this.gl.uniform1f(this.programInfo.uniformLocations.ambientLightLevelFloat, this.ambientLightLevel);
        
        //RENDER////////////////////////////////////////////////
        this.gl.drawElements(this.gl.TRIANGLES, objectData.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
    renderObjectCustomView(objectID = 0, projectionMatrix = this.projectionMatrix, viewMatrix = this.viewMatrix) //renders specific object, local to camera (no view matrix)
    {
        if (projectionMatrix == null) { projectionMatrix = this.projectionMatrix; }
        if (viewMatrix == null) { viewMatrix = this.viewMatrix; }

        const objectData = this.objects.get(objectID);
        if (objectData == null) { return; console.error("Object: " + objectID + " Does Not Exist. Cannot Render."); return; }

        this.gl.useProgram(this.programInfo.program);

        //BIND BUFFERS ///////////////////////////////////////////
        //Bind Vertices Buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.verticesBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.vertexLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexLocation);

        //Bind Normals Buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.normalsBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.normalLocation);

        //Bind Colors Buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.colorsBuffer);
        this.gl.vertexAttribPointer(this.programInfo.attribLocations.colorLocation, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.programInfo.attribLocations.colorLocation);

        //Bind Indices
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, objectData.indicesBuffer);

        
        //BIND UNIFORMS////////////////////////////////////////
        // Set the shader uniforms
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix,  false, projectionMatrix.getFloat32Array());
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.viewMatrix, false, viewMatrix.getFloat32Array());
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.objectMatrix, false, objectData.objectMatrix.getFloat32Array());
        this.gl.uniformMatrix4fv(this.programInfo.uniformLocations.objectRotationMatrix, false, objectData.objectRotationMatrix.getFloat32Array());
        this.gl.uniform4fv(this.programInfo.uniformLocations.lightDirectionVector, this.directionalLightingDirection.getFloat32Array());
        this.gl.uniform4fv(this.programInfo.uniformLocations.cameraPositionVector, this.cameraPosition.getFloat32Array());
        this.gl.uniform1f(this.programInfo.uniformLocations.objectReflectivity, objectData.reflectivity);

        //RENDER////////////////////////////////////////////////
        this.gl.drawElements(this.gl.TRIANGLES, objectData.indices.length, this.gl.UNSIGNED_SHORT, 0);
    }
    renderAll() //renders all objects 
    {
        if (this.renderAllObjectsInOrder == true) {
            if (this.lastSortTimeStamp == null || ((Date.now() - this.lastSortTimeStamp) > this.renderAllObjectsInOrderDelayMs))
            {
                //Start by putting each object into a list with it's distance to the camera.
                this.sortedSolidObjs = [];
                this.sortedTransObjs = []; 
                const camPos = this.cameraPosition.mul(1,1,-1);
                for (let i=0; i<this.objectIDs.length; i++)
                {
                    let obj = this.objects.get(this.objectIDs[i]);
                    if (obj.hide) //if we hide, do not render
                    {
                        continue;
                    }

                    let isTransparent = obj.isTransparent;
                    if (obj.textureID != null)
                    {
                        const textureData = this.textures.get(obj.textureID);
                        if (textureData.isTransparent)
                        {
                            isTransparent = true;
                        }
                    }

                    if (isTransparent != true)
                    {
                        this.sortedSolidObjs.push(this.objectIDs[i])
                    } else {
                        let dist = distanceBetweenPoints( obj.position, camPos);
                        this.sortedTransObjs.push( {id: this.objectIDs[i], dist: dist} );
                    }
                }

                //Sort the list, from farthest obejct to closest
                this.sortedTransObjs.sort((a,b) => (a.dist < b.dist) ? 1 : -1);
                this.lastSortTimeStamp = Date.now();
                //console.log(this.sortedSolidObjs.length, this.sortedTransObjs.length);
            }
            //Now, render each object in the new order
            for (let i=0; i<this.sortedSolidObjs.length; i++)
            {
                this.renderObject( this.sortedSolidObjs[i] );
            }
            for (let i=0; i<this.sortedTransObjs.length; i++)
            {
                this.renderObject( this.sortedTransObjs[i].id );
            }
        } else {
            for (let i=0; i<this.objectIDs.length; i++)
            {
                this.renderObject( this.objectIDs[i] );
            }
        }
    }
    

    //Set & Get for Camera/viewport positioning
    setCameraPosition(position = new vec4(), y=0, z=0)
    {
        if (!(position instanceof vec4))
        {
            this.cameraPosition = new vec4(position, y, z);
        } else {
            this.cameraPosition = position.copy();
        }
        this._updateViewMatrix();
    }
    setCameraRotation(rotation = new vec4(), y=0, z=0)
    {
        if (!(rotation instanceof vec4))
        {
            this.cameraRotation = new vec4(rotation, y, z);
        } else {
            this.cameraRotation = rotation.copy();
        }
        this._updateViewMatrix();
    }
    setViewMatrix(matrix = new mat4().makeRotation())
    {
        if (!(matrix instanceof mat4))
        {
            console.error("Cannot set view matrix if not passed a matrix mat4");
            return;
        }
        this.viewMatrix = matrix;
    }
    _updateViewMatrix()
    {
        this.cameraTranslationMatrix.makeTranslation(this.cameraPosition.mul(-1,-1,-1,1));
        this.cameraRotationMatrix.makeRotation(this.cameraRotation);
        this.viewMatrix = this.cameraRotationMatrix.mul(this.cameraTranslationMatrix);
    }
    setPerspective(FOV=1, aspectRatio=null, zNear=1, zFar=1000)
    {
        if (FOV == null || FOV == undefined) {FOV = 1;}
        if (zNear == null || zNear == undefined) {zNear = 1;}
        if (zFar == null || zFar == undefined) {zFar = 1000;}
        if (aspectRatio == null || aspectRatio == undefined) 
        {
            aspectRatio = this.htmlCanvasElement.width/this.htmlCanvasElement.height; 
        }
        this.FOV = FOV;
        this.zNear = zNear;
        this.zFar = zFar;
        this.aspectRatio = aspectRatio;
        this.projectionMatrix = new mat4().makePerspective(FOV,aspectRatio,zNear,zFar);
    }
    getCameraPosition()
    {
        return this.cameraPosition.copy();
    }
    getCameraRotation()
    {
        return this.cameraRotation.copy();
    }


    //Object Modifiers
    /*
    Creating Objects - takes a name or id 
        objectID: id used to uniquely identify  the object
        vertices: either array of vec4 or array of floats.
        indices: array of integers
        colors: either vec4, array of vec4, or array of floats.
        position: vec4
        rotation: vec4
    */
    createObject(objectID, position=new vec4(), rotation=new vec4(), scale=new vec4(1,1,1), vertices=cubeVertices, indices=cubeIndices, normals=cubeNormals, colors=cubeColors, shouldHideFromRenderAll = false, reflectivity=0.1) 
    {
        //Case statements to allow for passing null and undefined values
        if (objectID == null || objectID == undefined)
        {
            objectID = Math.round(Math.random()*10000+1000)
        }
        if (!(position instanceof vec4))
        {
            position = new vec4();
        }
        if (!(rotation instanceof vec4))
        {
            rotation = new vec4();
        }
        if (!(scale instanceof vec4))
        {
            scale = new vec4(1,1,1);
        }
        if (vertices == null || vertices == undefined)
        {
            vertices = cubeVertices;
        }
        if (normals == null || normals == undefined)
        {
            normals = cubeNormals;
        }
        if (indices == null || indices == undefined)
        {
            indices = cubeIndices;
        }
        if (colors == null || colors == undefined)
        {
            colors = cubeColors;
        }


        //Handle indices & check for correct format
        if (indices.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length indices"); return;}

        //Handle vertices & check for correct format & Data
        if (vertices instanceof Array && vertices.length > 0)
        {
            if (vertices[0] instanceof vec4)
            {
                //array of vec4s
                const vs = vertices;
                vertices = [];
                for (let i=0; i<vs.length; i++)
                {
                    if (!(vs[i] instanceof vec4))
                    {
                        console.error( "Error: Cannot create object with vertice "+i+"/"+vs.length+" of type: " + typeof(vs[i]) )
                        return
                    }
                    vertices.push(vs[i].x, vs[i].y, vs[i].z);
                }
            } else {
                //assuming vertices are correctly formatted.
                if (vertices.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length vertices"); return;}
            }
        } else {
            console.error("Cannot make object with non-array of vertices");
            return;
        }

        //Handle normals & check for correct format & Data
        if (normals instanceof Array && normals.length > 0)
        {
            if (normals[0] instanceof vec4)
            {
                //array of vec4s
                const ns = normals;
                normals = [];
                for (let i=0; i<ns.length; i++)
                {
                    if (!(ns[i] instanceof vec4 ))
                    {
                        console.error("Error: Normal "+i+" was undefined.");
                        continue;
                    }
                    normals.push(ns[i].x, ns[i].y, ns[i].z);
                }
            } else {
                //assuming vertices are correctly formatted.
                if (normals.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length normals"); return;}
            }
        } else {
            //normals = null;
            //NO NORMALS
            console.error("Cannot make object with non-array of normals", normals);
            return;
        }

        //Handle Colors. Can either be:
        let isTransparent = false;
        if (colors instanceof vec4)
        {
            //case 1: colors = vec4, so we need to expand to all vertices. 
            if (colors.a < 0.98) { isTransparent = true; }
            let c = colors;
            colors = [];
            for (let i=0; i<vertices.length; i++)
            {
                colors.push(c.x, c.y, c.z, c.a);
            }
        } else if (colors[0] instanceof vec4)
        {
            //case 2: colors = [ vec4, vec4, vec4...]
            const cs = colors;
            colors = [];
            for (let i=0; i<cs.length; i++)
            {
                colors.push(cs[i].x, cs[i].y, cs[i].z, cs[i].a);
                if (cs[i].a < 0.98) { isTransparent = true;}
            }
        } else {
            //Assume to be Array of Numbers
            for (let i=0; i<colors.length; i+=4)
            {
                if (colors[i+3] < 0.98) { isTransparent = true; }
            }
        }



        //Now, initialize the buffers
        const verticesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        const normalsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

        const colorsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);

        const indicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

        /*
        scale.a = 1;
        const tmat = new mat4().makeTranslation(position);
        const rmat = new mat4().makeRotation(rotation);
        const smat = new mat4().makeScale(scale);
        const objectMatrix = tmat.mul(rmat.mul(smat));*/
        const objectMatrix = new mat4().makeTranslationRotationScale(position, rotation, scale);
        const objectRotationMatrix = new mat4().makeRotation(rotation);
        //Save data to this.objects Map/Dictionary
        const objectData = {
            id: objectID,
            vertices: vertices,
            indices: indices,
            normals: normals,
            colors: colors,
            isTransparent: isTransparent,
            hide: shouldHideFromRenderAll,
            reflectivity,reflectivity,

            position: position.copy(),
            rotation: rotation.copy(),
            scale: scale.copy(),
            objectMatrix: objectMatrix,
            objectRotationMatrix: objectRotationMatrix,

            verticesBuffer: verticesBuffer,
            indicesBuffer: indicesBuffer, 
            colorsBuffer: colorsBuffer,
            normalsBuffer: normalsBuffer,
        };

        this.deleteObject(objectID);
        this.objects.set(objectID, objectData);
        this.objectIDs.push(objectID);

        return objectID;
    }
    createTexture(textureID = 0, data1DDataArray = defaultTexture)
    {
        const gl = this.gl;
        //this.gl.activeTexture(gl.TEXTURE0);
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const textureWidth = (Math.sqrt(data1DDataArray.length/4));
        const pixels = new Uint8Array(data1DDataArray);

        //check for transparency...
        let isTransparent = false;
        for (let i=3; i<data1DDataArray.length; i+=4)
        {
            if (data1DDataArray[i] < 250){
                isTransparent = true;
                break;
            }
        }

        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = textureWidth;
        const height = textureWidth;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(  gl.TEXTURE_2D, level, internalFormat, width,
            height, border, srcFormat, srcType, pixels
        );
        
        this.deleteTexture(textureID);
        this.textures.set(textureID, {
            texture: texture,
            isTransparent: isTransparent,
        });
        this.textureIDs.push(textureID);
    }
    createTextureObject(objectID, position=new vec4(), rotation=new vec4(), scale=new vec4(1,1,1), vertices=cubeVertices, indices=cubeIndices, normals=cubeNormals, textureCoordinates=cubeTextureCoordinates, textureID = 0, shouldHideFromRenderAll = false, reflectivity=0.1) 
    {
        //Case statements to allow for passing null and undefined values
        if (objectID == null || objectID == undefined)
        {
            objectID = Math.round(Math.random()*10000+1000)
        }
        if (!(position instanceof vec4))
        {
            position = new vec4();
        }
        if (!(rotation instanceof vec4))
        {
            rotation = new vec4();
        }
        if (!(scale instanceof vec4))
        {
            scale = new vec4(1,1,1);
        }
        if (vertices == null || vertices == undefined)
        {
            vertices = cubeVertices;
        }
        if (normals == null || normals == undefined)
        {
            normals = cubeNormals;
        }
        if (indices == null || indices == undefined)
        {
            indices = cubeIndices;
        }
        if (textureCoordinates == null || textureCoordinates == undefined)
        {
            textureCoordinates = cubeTextureCoordinates;
        }
        if (textureID == null || textureID == undefined)
        {
            textureID = 0;
        }


        //Handle indices & check for correct format
        if (indices.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length indices"); return;}

        //Handle vertices & check for correct format & Data
        if (vertices instanceof Array && vertices.length > 0)
        {
            if (vertices[0] instanceof vec4)
            {
                //array of vec4s
                const vs = vertices;
                vertices = [];
                for (let i=0; i<vs.length; i++)
                {
                    vertices.push(vs[i].x, vs[i].y, vs[i].z);
                }
            } else {
                //assuming vertices are correctly formatted.
                if (vertices.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length vertices"); return;}
            }
        } else {
            console.error("Cannot make object with non-array of vertices");
            return;
        }

        //Handle normals & check for correct format & Data
        if (normals instanceof Array && normals.length > 0)
        {
            if (normals[0] instanceof vec4)
            {
                //array of vec4s
                const vs = normals;
                normals = [];
                for (let i=0; i<vs.length; i++)
                {
                    normals.push(vs[i].x, vs[i].y, vs[i].z);
                }
            } else {
                //assuming vertices are correctly formatted.
                if (normals.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length normals"); return;}
            }
        } else {
            //normals = null;
            //NO NORMALS
            console.error("Cannot make object with non-array of normals", normals);
            return;
        }

        //Handle Colors. Can either be:
        // let isTransparent = false;
        // if (colors instanceof vec4)
        // {
        //     //case 1: colors = vec4, so we need to expand to all vertices. 
        //     if (colors.a < 0.98) { isTransparent = true; }
        //     let c = colors;
        //     colors = [];
        //     for (let i=0; i<vertices.length; i++)
        //     {
        //         colors.push(c.x, c.y, c.z, c.a);
        //     }
        // } else if (colors[0] instanceof vec4)
        // {
        //     //case 2: colors = [ vec4, vec4, vec4...]
        //     const cs = colors;
        //     colors = [];
        //     for (let i=0; i<cs.length; i++)
        //     {
        //         colors.push(cs[i].x, cs[i].y, cs[i].z, cs[i].a);
        //         if (cs[i].a < 0.98) { isTransparent = true;}
        //     }
        // } else {
        //     //Assume to be Array of Numbers
        //     for (let i=0; i<colors.length; i+=4)
        //     {
        //         if (colors[i+3] < 0.98) { isTransparent = true; }
        //     }
        // }
        let isTransparent = false;


        //Now, initialize the buffers
        const verticesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        const normalsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

        // const colorsBuffer = this.gl.createBuffer();
        // this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorsBuffer);
        // this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);
        const textureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), this.gl.STATIC_DRAW);

        const indicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);

        /*
        scale.a = 1;
        const tmat = new mat4().makeTranslation(position);
        const rmat = new mat4().makeRotation(rotation);
        const smat = new mat4().makeScale(scale);
        const objectMatrix = tmat.mul(rmat.mul(smat));*/
        const objectMatrix = new mat4().makeTranslationRotationScale(position, rotation, scale);
        const objectRotationMatrix = new mat4().makeRotation(rotation);
        //Save data to this.objects Map/Dictionary
        const objectData = {
            id: objectID,
            textureID: textureID,
            vertices: vertices,
            indices: indices,
            normals: normals,
            textureCoord: textureCoordinates,
            isTransparent: isTransparent,
            hide: shouldHideFromRenderAll,
            reflectivity,reflectivity,

            position: position.copy(),
            rotation: rotation.copy(),
            scale: scale.copy(),
            objectMatrix: objectMatrix,
            objectRotationMatrix: objectRotationMatrix,

            verticesBuffer: verticesBuffer,
            indicesBuffer: indicesBuffer, 
            textureCoordBuffer: textureCoordBuffer,
            normalsBuffer: normalsBuffer,
        };

        this.deleteObject(objectID);
        this.objects.set(objectID, objectData);
        this.objectIDs.push(objectID);

        return objectID;
    }
    createStandardObject(objectID, position=new vec4(), rotation=new vec4(), scale=new vec4(1,1,1), type='cube', color=new vec4(1,0,0,1)) 
    {
        console.error("Depreciated. DO NOT USE.");
        //create a standard object
        //  position: objects position, vec4
        //  rotation: objects rotation, vec4
        //  color: objects color, vec4
        //  type: type of object: cube, sphere, cylinder,

        //Case statements to allow for passing null and undefined values
        if (objectID == null || objectID == undefined)
        {
            objectID = Math.round(Math.random()*10000+1000)
        }
        if (!(position instanceof vec4))
        {
            position = new vec4();
        }
        if (!(rotation instanceof vec4))
        {
            rotation = new vec4();
        }
        if (!(scale instanceof vec4))
        {
            scale = new vec4();
        }
        if (!(color instanceof vec4))
        {
            console.error("color MUST be a vec4 for this createObject() overload"); return;
        }

        let vertices = null;
        let indices = null;
        let normals = null;
        let colors = null;

        switch(type)
        {
            case 'cube': 
                vertices = cubeVertices;
                indices = cubeIndices;
                normals = cubeNormals;
                break;
            case 'sphere':
                break;
        }
        //Make sure the switch statement found a shape
        if (vertices == null) {
            console.error("Could not create object type: ", color);
            return;
        }

        colors = [];
        for (let i=0; i<vertices.length/3; i++)
        {
            colors.push(color.x, color.y, color.z, color.a);
        }


        //Now, initialize the buffers
        const verticesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, verticesBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        const normalsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);

        const colorsBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, colorsBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(colors), this.gl.STATIC_DRAW);

        const indicesBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);


        /*scale.a = 1;
        const tmat = new mat4().makeTranslation(position);
        const rmat = new mat4().makeRotation(rotation);
        const smat = new mat4().makeScale(scale);
        const objectMatrix = tmat.mul(rmat.mul(smat));*/
        const objectMatrix = new mat4().makeTranslationRotationScale(position, rotation, scale);
        const objectRotationMatrix = new mat4().makeRotation(rotation);

        //Save data to this.objects Map/Dictionary
        const objectData = {
            id: objectID,
            vertices: vertices,
            indices: indices,
            normals: normals,
            colors: colors,
            hide: false,

            position: position.copy(),
            rotation: rotation.copy(),
            scale: scale.copy(),
            objectMatrix: objectMatrix,
            objectRotationMatrix: objectRotationMatrix,

            verticesBuffer: verticesBuffer,
            indicesBuffer: indicesBuffer, 
            colorsBuffer: colorsBuffer,
            normalsBuffer: normalsBuffer,
        };
        this.deleteObject(objectID);
        this.objects.set(objectID, objectData);
        this.objectIDs.push(objectID);

        return objectID;
    }
    createText(objectID, text = "hello", position=new vec4(), rotation=new vec4(), scale=new vec4(1,1,1), color = new vec4(1,1,1,1), shouldHideFromRenderAll = false, padding = 0.1)
    {
        let vertices = [];
        let indices = [];

        text = String(text);

        let xOffset = 0;
        for (let i=0; i<text.length; i++)
        {
            const charCode = text.charCodeAt(i);
            const inds = asciiIndices[charCode];
            if (inds == null)
            {
                console.error("character " + text[i] + " does not have associeated indices.");
                continue;
            }

            for (let j=0; j<inds.length; j+=3)
            {
                const i1 = inds[j];
                const i2 = inds[j+1];
                const i3 = inds[j+2];
                let v1 = new vec4(asciiVertices[i1*3], asciiVertices[i1*3 + 1], asciiVertices[i1*3 + 2]);
                let v2 = new vec4(asciiVertices[i2*3], asciiVertices[i2*3 + 1], asciiVertices[i2*3 + 2]);
                let v3 = new vec4(asciiVertices[i3*3], asciiVertices[i3*3 + 1], asciiVertices[i3*3 + 2]);

                let indOn = vertices.length/3;
                indices.push(indOn, indOn+1, indOn+2);
                
                vertices.push(v1.x+xOffset,v1.y,v1.z,  v2.x+xOffset,v2.y,v2.z, v3.x+xOffset,v3.y,v3.z);
            }

            xOffset += asciiWidths[charCode] + padding;
        }

        if (color == null)
        {
            color = new vec4(1,1,1,1);
        }

        this.createObject(objectID, position, rotation, scale, vertices, indices, null, color, shouldHideFromRenderAll);
        this.objects.get(objectID).text = text;
    }
    deleteObject(objectID)
    {
        this.objects.set(objectID, null);
        for (let i=0; i<this.objectIDs.length; i++)
        {
            if (this.objectIDs[i] == objectID)
            {
                this.objectIDs.splice(i,1);
                //we don't break out of the loop in case of duplicates.
            }
        }
    }
    deleteTexture(textureID)
    {
        this.textures.set(textureID, null);
        for (let i=0; i<this.textureIDs.length; i++)
        {
            if (this.textureIDs[i] == textureID)
            {
                this.textureIDs.splice(i,1);
                //we don't break out of the loop in case of duplicates.
            }
        }
    }
    setObjectShape(objectID, vertices=cubeVertices, indices=cubeIndices, normals=cubeNormals, colors=cubeColors)
    {
        //Case statements to allow for passing null and undefined values
        if (objectID == null || objectID == undefined)
        {
            console.error("EasyGL.setObjectShape() cannot set without objectID (Which object..?)");
            return;
        }
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set shape."); return;}

        //Handle indices & check for correct format
        if (indices != null && indices != undefined && indices.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length indices"); return;}

        //Handle vertices & check for correct format & Data
        if (vertices instanceof Array && vertices.length > 0)
        {
            if (vertices[0] instanceof vec4)
            {
                //array of vec4s
                const vs = vertices;
                vertices = [];
                for (let i=0; i<vs.length; i++)
                {
                    vertices.push(vs[i].x, vs[i].y, vs[i].z);
                }
            } else {
                //assuming vertices are correctly formatted.
                if (vertices.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length vertices"); return;}
            }
        }

        //Handle normals & check for correct format & Data
        if (normals instanceof Array && normals.length > 0)
        {
            if (normals[0] instanceof vec4)
            {
                //array of vec4s
                const vs = normals;
                normals = [];
                for (let i=0; i<vs.length; i++)
                {
                    normals.push(vs[i].x, vs[i].y, vs[i].z);
                }
            } else {
                //assuming vertices are correctly formatted.
                if (normals.length % 3 != 0) {console.error("Cannot make object with non-multiple of 3 length normals"); return;}
            }
        }

        //Pass it to this function, because we already wrote the logic...
        this.setObjectColor(objectID, colors);

        if (vertices != null && vertices != undefined)
        {
            //objectData.verticesBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.verticesBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
        }
        if (normals != null && normals != undefined)
        {
            //objectData.normalsBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.normalsBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
        }
        if (indices != null && indices != undefined)
        {
            //objectData.indicesBuffer = this.gl.createBuffer();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, objectData.indicesBuffer);
            this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
        }

        return objectID;
    }
    setObjectPosition(objectID, position = new vec4(), y=0, z=0)
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set position."); return;}
        if (!(position instanceof vec4)) {
            position = new vec4(position, y, z);
        }
        objectData.position = position.copy();

        //Update objectMatrix
        /*objectData.scale.a = 1;
        const tmat = new mat4().makeTranslation(objectData.position);
        const rmat = new mat4().makeRotation(objectData.rotation);
        const smat = new mat4().makeScale(objectData.scale);
        objectData.objectMatrix = tmat.mul(rmat.mul(smat));*/
        objectData.objectMatrix.makeTranslationRotationScale(objectData.position, objectData.rotation, objectData.scale);
    }
    setObjectRotation(objectID, rotation = new vec4(), y=0, z=0)
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set rotation."); return;}
        if (!(rotation instanceof vec4)) {
            rotation = new vec4(rotation, y, z, 1);
        }
        objectData.rotation = rotation.copy();

        //Update objectMatrix
        /*objectData.scale.a = 1;
        const tmat = new mat4().makeTranslation(objectData.position);
        const rmat = new mat4().makeRotation(objectData.rotation);
        const smat = new mat4().makeScale(objectData.scale);
        objectData.objectMatrix = tmat.mul(rmat.mul(smat));
        objectData.objectRotationMatrix = rmat;*/
        
        objectData.objectMatrix.makeTranslationRotationScale(objectData.position, objectData.rotation, objectData.scale);
        objectData.objectRotationMatrix.makeRotation(objectData.rotation);
    }
    setObjectScale(objectID, scale = new vec4(), y=0, z=0)
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set scale."); return;}
        if (!(scale instanceof vec4)) {
            scale = new vec4(scale, y, z);
        }
        objectData.scale = scale.copy();

        //Update objectMatrix
        /*objectData.scale.a = 1;
        const tmat = new mat4().makeTranslation(objectData.position);
        const rmat = new mat4().makeRotation(objectData.rotation);
        const smat = new mat4().makeScale(objectData.scale);
        objectData.objectMatrix = tmat.mul(rmat.mul(smat));*/
        objectData.objectMatrix.makeTranslationRotationScale(objectData.position, objectData.rotation, objectData.scale);
    }
    setObjectColor(objectID, color = new vec4(1,.2,0,1), g=0, b=0.4, a=1)
    {
        if (color == null)
        {
            return;
        }
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set color."); return;}

        if (color instanceof Number) //if passed 4 numbers, convert to vec4 and continue...
        {
            color = new vec4(color, g, b, a);
        }

        if (color instanceof vec4) //If color is a vec4, color the entire object ot be that color
        {
            //Set whether or not the object has transparency
            if (color.a < 0.98) {objectData.isTransparent = true; } else {objectData.isTransparent = false;}

            //create color array
            let length = objectData.vertices.length/3;
            objectData.colors = [];
            for (let i=0; i<length; i++)
            {
                objectData.colors.push(color.x, color.y, color.z, color.a);
            }

            //bindBuffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.colorsBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(objectData.colors), this.gl.STATIC_DRAW);
        } else if (color instanceof Array) //If it's an array...
        {
            if (color[0] instanceof vec4) //Array of vec4s
            {
                //Vec4 array
                objectData.colors = [];
                objectData.isTransparent = false;
                for (let i=0; i<color.length; i++)
                {
                    objectData.colors.push( color[i].x, color[i].y, color[i].z, color[i].a );
                    if (color[i].a < 0.98)
                    {
                        objectData.isTransparent = true;
                    }
                }

            } else {
                //Assume to be Number Array
                objectData.colors = [];
                objectData.isTransparent = false;
                for (let i=0; i<color.length; i+=4)
                {
                    objectData.colors.push( color[i], color[i+1], color[i+2], color[i+3] );
                    if (color[i+3] < 0.98)
                    {
                        objectData.isTransparent = true;
                    }
                }
            }

            //bindBuffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.colorsBuffer);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(objectData.colors), this.gl.STATIC_DRAW);
        } else {
            console.error("Needs color as a vec4 or Array");
        }
        return objectID;
    }
    setObjectHide(objectID, shouldHideFromRenderAll = false)
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set color."); return;}

        objectData.hide = shouldHideFromRenderAll;
    }
    setText(objectID, text, color = new vec4(0,0,0,1), padding=0.1)
    {
        //const objectData = this.objects.get(objectID);
        //if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set color."); return;}
        let vertices = [];
        let indices = [];
        let normals = [];
        let colors = [];

        text = String(text);

        let xOffset = 0;
        for (let i=0; i<text.length; i++)
        {
            const charCode = text.charCodeAt(i);
            const inds = asciiIndices[charCode];
            if (inds == null)
            {
                console.error("character " + text[i] + " does not have associeated indices.");
                continue;
            }

            for (let j=0; j<inds.length; j+=3)
            {
                const i1 = inds[j];
                const i2 = inds[j+1];
                const i3 = inds[j+2];
                let v1 = new vec4(asciiVertices[i1*3], asciiVertices[i1*3 + 1], asciiVertices[i1*3 + 2]);
                let v2 = new vec4(asciiVertices[i2*3], asciiVertices[i2*3 + 1], asciiVertices[i2*3 + 2]);
                let v3 = new vec4(asciiVertices[i3*3], asciiVertices[i3*3 + 1], asciiVertices[i3*3 + 2]);

                let indOn = vertices.length/3;
                indices.push(indOn, indOn+1, indOn+2);
                
                vertices.push(v1.x+xOffset,v1.y,v1.z,  v2.x+xOffset,v2.y,v2.z, v3.x+xOffset,v3.y,v3.z);
                normals.push(0,0,1, 0,0,1, 0,0,1);
                colors.push(color.x, color.y, color.z, color.a,   color.x, color.y, color.z, color.a,   color.x, color.y, color.z, color.a);
            }
            xOffset += asciiWidths[charCode] + padding;
        }

        this.setObjectShape(objectID, vertices, indices, normals, colors);
        this.objects.get(objectID).text = text;
    }
    setObjectReflectivity(objectID, reflectivity = 0.1)
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.log("Object: "+objectID+" does not exist. Cannot set reflectivity."); return;}

        objectData.reflectivity = reflectivity;
    }


    //Object Accessors
    getObjectPosition(objectID) //get position of object, given objectID
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.error("Object: "+objectID+" does not exist. Cannot get position."); return;}
        return objectData.position.copy();
    }
    getObjectRotation(objectID) //get rotation of object, given objectID
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.error("Object: "+objectID+" does not exist. Cannot get rotation."); return;}
        return objectData.rotation.copy();
    }
    getObjectScale(objectID) //get rotation of object, given objectID
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.error("Object: "+objectID+" does not exist. Cannot get scale."); return;}
        return objectData.scale.copy();
    }
    getObjectData(objectID) //get all data for object
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.error("Object: "+objectID+" does not exist. Cannot get data."); return;}
        return objectData;
    }
    getObjectExists(objectID)
    {
        if (this.objects.get(objectID) != null)
        {
            return true;
        }
        return false;
    }
    getText(objectID)
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.error("Object: "+objectID+" does not exist. Cannot get text."); return;}
        return objectData.text;
    }
    getObjectReflectivity(objectID)
    {
        const objectData = this.objects.get(objectID);
        if (objectData == null) { console.error("Object: "+objectID+" does not exist. Cannot get reflectivity."); return;}
        return objectData.reflectivity;
    }


    //Listeners for HTML elements
    resizeListener(event) //call this every time the window is resized
    {
        let bb = this.htmlCanvasElement.getBoundingClientRect();
        this.htmlCanvasElement.width = Math.round(bb.width);
        this.htmlCanvasElement.height = Math.round(bb.height);

        //resize picker...
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,  this.pickerFrameBuffer);

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickerTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.htmlCanvasElement.width, this.htmlCanvasElement.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);

        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.pickerDepthBuffer);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.htmlCanvasElement.width, this.htmlCanvasElement.height);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.setPerspective(this.FOW, null, this.zNear, this.zFar);
    }


    //Misc Functions
    //Set ambient light level - WARNING: CPU intensive. Do not do often.
    setAmbientLightLevel(value = 0.25) //sets minimum light level for directional lighting (in shadow, how dark it is)
    {
        //console.error("DEPRECIATED. DO NOT USE"); <-- I use it now... 
        if (isNaN(value))
        {
            console.error("Cannot set ambient light level to NaN.");
            return;
        }
        this.ambientLightLevel = value;
        this._initShader();
    }
    enableDirectionalLighting(enable = true) //enables/disables directional lighting
    {
        this.directionalLighting = enable;
        this._initShader();
    }
    setDirectionalLightingDirection(direction = new vec4(0.74, 0.6, 0.4), y=0.6, z=0.4) //sets the direction the light comes from in the scene
    {
        if (!(direction instanceof vec4))
        {
            direction = new vec4(direction, y,z);
        }
        this.directionalLightingDirection = direction.copy();
        this.directionalLightingDirection.scaleToUnit();
    }
    enableRenderingReverseFaces(enable = true) //enables rendering faces & triangles not facing the camera (for transparent objects)
    {
        this.renderReverseFaces = enable;
    }
    enableSortingObjects(enable = true) //enables sorting objects so transparent objects render correctly
    {
        //More details: enable sorting so webgl renders objects in order distance to closest to the camera.
        //          this makes it so transparent objects are actually transparent, and objects render behind them.
        this.renderAllObjectsInOrder = enable;
    }
    setSortingTimeDelayMs(delayBetweenSort = 100)
    {
        this.renderAllObjectsInOrderDelayMs = delayBetweenSort;
    }
    setClearColor(color=new vec4(), y=0.5, z=0.5, a=1)
    {
        if (color instanceof vec4)
        {
            this.clearColor = color.copy();
            return;
        }
        
        if (isNaN(color) == true ) {color=0.5;}
        if (isNaN(y) == true ) {y=0.5;}
        if (isNaN(z) == true ) {z=0.5;}
        if (isNaN(a) == true ) {a=1;}
        this.clearColor = new vec4(color, y, z, a);
    }
    getObjectFromScreen(canvasPixelX, canvasPixelY)
    {
        //Bind gl FrameBuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pickerFrameBuffer);

        //Clear frameBuffer
        this.gl.clearColor(1, 1, 1, 1);    // Clear to white, fully opaque
        this.gl.clearDepth(1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LESS);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.depthMask(true);
        this.gl.disable(this.gl.BLEND);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        let color = new vec4(0,0,0,1);

        //render all objects to texture
        for (let i=0; i<this.objectIDs.length; i++)
        {
            const multiple = Math.floor(i/255);   
            color.y = multiple/255;
            color.x = (i-multiple*255)/255;

            const objectData = this.objects.get(this.objectIDs[i]);
            
            this.gl.useProgram(this.pickerProgramInfo.program);

            //BIND BUFFERS ///////////////////////////////////////////
            //Bind Vertices Buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.verticesBuffer);
            this.gl.vertexAttribPointer(this.pickerProgramInfo.attribLocations.vertexLocation, 3, this.gl.FLOAT, false, 0, 0);
            this.gl.enableVertexAttribArray(this.pickerProgramInfo.attribLocations.vertexLocation);

            //Bind Normals Buffer
            //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.normalsBuffer);
            //this.gl.vertexAttribPointer(this.pickerProgramInfo.attribLocations.normalLocation, 3, this.gl.FLOAT, false, 0, 0);
            //this.gl.enableVertexAttribArray(this.pickerProgramInfo.attribLocations.normalLocation);

            //Bind Colors Buffer
            //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, objectData.colorsBuffer);
            //this.gl.vertexAttribPointer(this.pickerProgramInfo.attribLocations.colorLocation, 4, this.gl.FLOAT, false, 0, 0);
            //this.gl.enableVertexAttribArray(this.pickerProgramInfo.attribLocations.colorLocation);

            //Bind Indices
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, objectData.indicesBuffer);

            
            //BIND UNIFORMS////////////////////////////////////////
            // Set the shader uniforms
            this.gl.uniformMatrix4fv(this.pickerProgramInfo.uniformLocations.projectionMatrix,  false, this.projectionMatrix.getFloat32Array());
            this.gl.uniformMatrix4fv(this.pickerProgramInfo.uniformLocations.viewMatrix, false, this.viewMatrix.getFloat32Array());
            this.gl.uniformMatrix4fv(this.pickerProgramInfo.uniformLocations.objectMatrix, false, objectData.objectMatrix.getFloat32Array());
            //uColorVector
            this.gl.uniform4fv(this.pickerProgramInfo.uniformLocations.colorVector, color.getFloat32Array());
            //this.gl.uniform4fv(this.pickerProgramInfo.uniformLocations.lightDirectionVector, this.directionalLightingDirection.getFloat32Array());

            //RENDER////////////////////////////////////////////////
            this.gl.drawElements(this.gl.TRIANGLES, objectData.indices.length, this.gl.UNSIGNED_SHORT, 0);
        }

        //create buffer for pixel
        let pixels = new Uint8Array(4);

        //round and bound x,y coordinates to active texture
        let x = Math.min(Math.max(Math.round(canvasPixelX), 1), this.htmlCanvasElement.width-1);
        let y = Math.min(Math.max(Math.round( this.htmlCanvasElement.height - canvasPixelY), 1), this.htmlCanvasElement.height-1);

        //console.log(x,y);

        //Read Pixels
        this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

        //console.log(this.pickerDepthBuffer);

        //Detach framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        color.x = pixels[0];
        color.y = pixels[1];
        //console.log(color, pixels);

        /*
        const multiple = Math.floor(i/255);   
            color.y = multiple/255;
            color.x = (i-multiple*255)/255;*/
        
        const I = color.y * 255 + color.x;
        //console.log(color);
        //console.log(I);

        if (0 <= I && I < this.objectIDs.length)
        {
            return this.objectIDs[I];
        } 
        return null;

    }

}

//Default Cube
const cubeVertices =  [
    -0.5,0.5,0.5, 0.5,0.5,0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5, //front
    -0.5,0.5,-0.5, -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,0.5,-0.5, //back
    -0.5,0.5,0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5, //top
    -0.5,0.5,0.5, -0.5,-0.5,0.5, -0.5,-0.5,-0.5, -0.5,0.5,-0.5, //left
    0.5,0.5,0.5, 0.5,0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5, //right
    -0.5,-0.5,0.5, 0.5,-0.5,0.5, 0.5,-0.5,-0.5, -0.5,-0.5,-0.5, //bottom
];
const cubeIndices = [
    0,2,1, 0,3,2, //front
    4,6,5, 4,7,6, //back
    8,10,9, 8,11,10, //top
    12,14,13, 12,15,14, //left
    16,18,17, 16,19,18, //right
    20,22,21, 20,23,22, //bottom
];
const cubeNormals = [
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0, //top
    -1,0,0, -1,0,0, -1,0,0, -1,0,0, //right
    1,0,0, 1,0,0, 1,0,0, 1,0,0, //let
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, //bottom
    
];
const cubeColors = [
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
    0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1, 0.5,0.5,0.5,1,
];
const cubeTextureCoordinates = [
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1,
    0,0, 1,0, 1,1, 0,1
];
const defaultTexture = [
    0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 
    100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 
    200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 
    700, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 
    500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 
    255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 
    255, 0, 0, 0, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 
    200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300,
    300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255,
    100, 100, 100, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 
    100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 
    0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100,
    100, 100, 255, 0, 200, 200, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100,
    300, 700, 255, 0, 0, 0, 255, 255, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 
    0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 255, 300, 700, 255, 0, 0, 0, 255, 100, 
    100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 100, 100, 500, 255, 0, 200, 600, 255, 
    100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 255, 200, 200, 255, 100, 300, 300, 
    255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 255, 0, 0, 
    255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 0, 200, 600, 
    255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 
    255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 
    100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 
    100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 
    400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100,
    255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 
    500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 
    100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 
    300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 255, 200, 600, 255, 
    100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 255, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 
    100, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 255, 0, 0, 255, 255, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 
    255, 100, 500, 255, 255, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 
    255, 100, 100, 100, 255, 0, 200, 200, 255, 255, 300, 300, 255, 255, 0, 400, 255, 255, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 
    100, 300, 300, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 
    600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 
    200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400,
    255, 100, 100, 500, 255, 100, 300, 700, 255, 0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255, 100, 300, 700, 255, 
    0, 0, 0, 255, 100, 100, 100, 255, 0, 200, 200, 255, 100, 300, 300, 255, 0, 0, 400, 255, 100, 100, 500, 255, 0, 200, 600, 255
];


//Flat triangle
const triangleVertices = [-1,-1,0, 0,1,0, 1,-1,0];
const triangleIndices = [0,1,2];
const triangleNormals = [0,0,1, 0,0,1, 0,0,1];
const triangleColors = [1,0,0,1, 0,1,0,1, 0,0,1,1];



function generateSphereMesh(steps = 1, radius = 1, randomModifier = 0.0, color = new vec4(1,0,0,1), smoothNormals = false)
{
    let vertices = [0,-1,0, 1,0,0, 0,0,1, -1,0,0, 0,0,-1, 0,1,0];
    for (let i in vertices)
    {
        vertices[i] = vertices[i]*radius;
    }
    let indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    let zz = new vec4();
    for (let s=0; s<steps; s++)
    {
        let inds = [];
        let verts = [];

        for( let i=0; i<indices.length; i+=3)
        {
            let v1 = new vec4(vertices[indices[i]*3], vertices[indices[i]*3 + 1], vertices[indices[i]*3 + 2]);
            let v2 = new vec4(vertices[indices[i+1]*3], vertices[indices[i+1]*3 + 1], vertices[indices[i+1]*3 + 2]);
            let v3 = new vec4(vertices[indices[i+2]*3], vertices[indices[i+2]*3 + 1], vertices[indices[i+2]*3 + 2]);

            let b1 = (v1.add(v2)).muli(0.5);
            b1.muli( radius/distanceBetweenPoints(b1, zz)  );
            let b2 = (v2.add(v3)).muli(0.5);
            b2.muli( radius/distanceBetweenPoints(b2, zz)  );
            let b3 = (v1.add(v3)).muli(0.5);
            b3.muli( radius/distanceBetweenPoints(b3, zz)  );

            let lv = verts.length/3;

            inds.push( lv, lv+3, lv+5 );  //bottom-left
            inds.push( lv+3, lv+1, lv+4); //top
            inds.push( lv+5, lv+4, lv+2); //bottom-right
            inds.push( lv+3, lv+4, lv+5); //center

            verts.push(v1.x, v1.y, v1.z,   v2.x, v2.y, v2.z,  v3.x, v3.y, v3.z);
            verts.push(b1.x, b1.y, b1.z,   b2.x, b2.y, b2.z,  b3.x, b3.y, b3.z);
        }
        vertices = verts;
        indices = inds;
    }

    let n = [];
    let c = [];
    let ind = [];
    let v = [];
    /*for (let i=0; i<vertices.length;i+=3) { 
        normals.push(0,0,0);
        colors.push(color.x, color.y, color.z, color.a); 
    }*/

    for (let i=0; i<indices.length; i+=3)
    {
        const v1 = new vec4( vertices[indices[i  ]*3], vertices[indices[i  ]*3+1], vertices[indices[i  ]*3+2] );
        const v2 = new vec4( vertices[indices[i+1]*3], vertices[indices[i+1]*3+1], vertices[indices[i+1]*3+2] );
        const v3 = new vec4( vertices[indices[i+2]*3], vertices[indices[i+2]*3+1], vertices[indices[i+2]*3+2] );
        
        if (smoothNormals)
        {
            const r1 = v1.copy().scaleToUnit();
            const r2 = v2.copy().scaleToUnit();
            const r3 = v3.copy().scaleToUnit();
            n.push( r1.x, r1.y, r1.z,   r2.x, r2.y, r2.z,   r3.x, r3.y, r3.z);
        } else {
            const a = v2.sub(v1);
            const b = v3.sub(v1);
            b.scaleToUnit();
            a.scaleToUnit();
            const nx = a.y*b.z - a.z*b.y;
            const ny = a.z*b.x - a.x*b.z;
            const nz = a.x*b.y - a.y*b.x;
            const newN = new vec4(nx,ny,nz).scaleToUnit();
            n.push( newN.x, newN.y, newN.z,   newN.x, newN.y, newN.z,   newN.x, newN.y, newN.z);
        }
        let cur = v.length/3;
        ind.push(cur, cur+1, cur+2);
        c.push(color.x, color.y, color.z, color.a,  color.x, color.y, color.z, color.a,  color.x, color.y, color.z, color.a );
        v.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
    }

    //console.log(vertices, indices, normals, colors);
    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
    
    //return ret;
    //return expandMesh(ret.vertices, ret.indices, color, colorVariation);
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


export {EasyGL, cubeVertices, cubeIndices, cubeNormals, cubeColors, cubeTextureCoordinates, defaultTexture, generateSphereMesh, asciiVertices, asciiIndices, asciiWidths};