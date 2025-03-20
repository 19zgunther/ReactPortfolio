import { useState, useEffect, useRef } from "react";
import { vec4 } from "../myMath";
import { EasyGL, generateSphereMesh } from "./../easyGL";
import { FPC } from "./fpc";
// import Clone from "./clone";


const c1Color = new vec4(.6,.3,.3,1);
const c2Color = new vec4(.3,.6,.3,1);
const c3Color = new vec4(.3,.3,.6,1);
const c4Color = new vec4(.6,.3,.6,1);
const c5Color = new vec4(.3,.1,.2,1);

function EasyGlMain() {

    const [easyGlInstances, setEasyglInstances] = useState([]);
    const [easyGlUpdateFunctions, setEasyGlUpdateFunctions] = useState([]);
    const [easyGlClearFunctions, setEasyGlClearFunctions] = useState([]);
    const [zNear, setZNear] = useState(3);
    const [zFar, setZFar] = useState(100);
    const [fov, setFOV] = useState(0.33);
    const easyGlCanvasRefMain = useRef(null);
    const easyGlCanvasRef1 = useRef(null);
    const easyGlCanvasRef2 = useRef(null);
    const easyGlCanvasRef3 = useRef(null);
    const easyGlCanvasRef4 = useRef(null);
    const easyGlCanvasRef5 = useRef(null);
    const easyGlCanvasRef11 = useRef(null);
    const easyGlCanvasRef12 = useRef(null);


    // Create EasyGL instances
    useEffect(() => {

        const newEasyGlInstances = [];
        const newEasyGlUpdateFunctions = [];
        const newEasyGlClearFunctions = [];

        // Canvas 1
        if (easyGlCanvasRef1.current) {
            const easygl = new EasyGL( easyGlCanvasRef1.current );
            newEasyGlInstances.push(easygl);
            easygl.setClearColor(c1Color);
            easygl.setCameraPosition( 0, 0, 2 );
            easygl.setPerspective();
            easygl.createObject( 'myObject1' );
            easygl.setObjectReflectivity('myObject1', 0.6);
            newEasyGlUpdateFunctions.push((t) => {
                easygl.setObjectRotation( 'myObject1', t, t/2, t/3 );
                easygl.clear();
                easygl.renderAll();
            });
        }

        // Canvas 2
        if (easyGlCanvasRef2.current) {
            const easygl = new EasyGL( easyGlCanvasRef2.current );
            newEasyGlInstances.push(easygl);
            easygl.setClearColor(c2Color);
            easygl.setCameraPosition( 0, 0, 3 );
            easygl.setPerspective();

            let sphere = generateSphereMesh(1,0.7,0);
            console.log(sphere);
            easygl.createObject( 's1' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, new vec4(1,0,0,1));
            easygl.setObjectPosition( 's1' , 0,2,0);
            easygl.setObjectReflectivity('s1', 0.6);

            sphere = generateSphereMesh(2,0.7,0);
            easygl.createObject( 's2' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, new vec4(0,1,0,1));
            easygl.setObjectPosition( 's2' , 0,0,0);
            easygl.setObjectReflectivity('s2', 0.6);

            sphere = generateSphereMesh(3,0.7,0);
            easygl.createObject( 's3' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, new vec4(0,0,1,1));
            easygl.setObjectPosition( 's3' , 0,-2,0);
            easygl.setObjectReflectivity('s3', 0.6);
            
            newEasyGlUpdateFunctions.push((t) => {
                easygl.setDirectionalLightingDirection( 
                    Math.cos(t), 
                    Math.sin(t/2), 
                    Math.sin(t/3) );
                easygl.clear();
                easygl.renderAll();
            });
        }

        // Canvas 3
        if (easyGlCanvasRef3.current) {
            const easygl = new EasyGL( easyGlCanvasRef3.current );
            newEasyGlInstances.push(easygl);
            easygl.setClearColor(c3Color);
            easygl.setPerspective();
            easygl.createObject( 'myObject1' );
            easygl.createObject( 'myObject2' );
            easygl.createObject( 'myObject3' );
            easygl.setObjectPosition( 'myObject1', 1, 1, 1,);
            easygl.setObjectPosition( 'myObject2', -1, -1, -1,);
            easygl.setObjectRotation( 'myObject1', 0.8, .1, 1);
            easygl.setObjectColor( 'myObject1', new vec4(1,0,0,1));
            easygl.setObjectColor( 'myObject2', new vec4(0,1,0,1));
            easygl.setObjectColor( 'myObject3', new vec4(0,0,1,1));

            easygl.setObjectReflectivity('myObject1', 0.2);
            easygl.setObjectReflectivity('myObject2', 0.5);
            easygl.setObjectReflectivity('myObject3', 0.7);
            newEasyGlUpdateFunctions.push((t) => {
                easygl.setObjectRotation( 'myObject2', t,t,t);
                easygl.setCameraPosition( 4*Math.cos(t), 0, -4*Math.sin(t) );
                easygl.setCameraRotation( 0, -t -Math.PI/2, 0);
                easygl.clear();
                easygl.renderAll();
            });
        }

        // Canvas 4
        if (easyGlCanvasRef4.current) {
            const easygl = new EasyGL( easyGlCanvasRef4.current );
            newEasyGlInstances.push(easygl);
            easygl.setClearColor(c4Color);
            easygl.setPerspective();

            const sphere = generateSphereMesh(3,1);

            easygl.createObject( 'myObject1' );
            easygl.createObject( 'myObject2' );
            easygl.createObject( 'myObject3' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, sphere.colors);
            easygl.setObjectPosition( 'myObject1', -1, 0, 0,);
            easygl.setObjectPosition( 'myObject2', 1, 0, 0,);
            easygl.setObjectPosition( 'myObject3', 0, 0, 0,);

            easygl.setObjectReflectivity('myObject1', 0.6);
            easygl.setObjectReflectivity('myObject2', 0.6);
            easygl.setObjectReflectivity('myObject3', 0.6);

            easygl.setObjectColor( 'myObject1', new vec4(1,0,0,1));
            easygl.setObjectColor( 'myObject2', new vec4(0,1,0,1));
            //easygl.setObjectColor( 'myObject3', new vec4(0,0,1,1));


            newEasyGlUpdateFunctions.push((t) => {
                t += 0.03;

                easygl.setObjectColor( 'myObject3', new vec4(0,0,1,Math.sin(t*3)/2+0.5));

                easygl.setCameraPosition( 4*Math.cos(t/2),0, -4*Math.sin(t/2) );
                easygl.setCameraRotation( 0, -t/2 -Math.PI/2, 0, 0);


                easygl.setObjectRotation( 'myObject3', t/10, t/11, t/12);

                easygl.clear();
                easygl.renderAll();
            });
        }

        // Canvas 11
        if (easyGlCanvasRef11.current) {
            const easygl = new EasyGL( easyGlCanvasRef11.current );
            newEasyGlInstances.push(easygl);

            const randTexture = [];
            for (let i=0; i<256*4; i++)
            {
                randTexture.push(Math.random()*255);
            }

            easygl.createTexture(); //creates default texture 16x16 smiley face image
            easygl.createTexture(2, randTexture);
            easyGlInstances.push(easygl);
            easygl.setClearColor(c3Color);
            easygl.setPerspective();
            easygl.createTextureObject( 'myObject1' , null, null, null, null, null, null, null, 2);
            easygl.createTextureObject( 'myObject2' ); //creates a textured object, using default texture & texture coordinates for cube
            easygl.createObject( 'myObject3' );
            easygl.setObjectPosition( 'myObject1', 1, 1, 1,);
            easygl.setObjectPosition( 'myObject2', -1, -1, -1,);
            easygl.setObjectRotation( 'myObject1', 0.8, .1, 1);
            //easygl.setObjectColor( 'myObject1', new vec4(1,0,0,1));
            //easygl.setObjectColor( 'myObject2', new vec4(0,1,0,1));
            easygl.setObjectColor( 'myObject3', new vec4(0,0,1,1));
            easygl.setObjectReflectivity('myObject1', 0.2);
            easygl.setObjectReflectivity('myObject2', 0.5);
            easygl.setObjectReflectivity('myObject3', 0.7);

            newEasyGlUpdateFunctions.push((t) => {
                t += 0.03;
                easygl.setObjectRotation( 'myObject2', t,t,t);
                easygl.setCameraPosition( 4*Math.cos(t), 0, -4*Math.sin(t) );
                easygl.setCameraRotation( 0, -t -Math.PI/2, 0);
                easygl.clear();
                easygl.renderAll();
            });
        }

        // Canvas 12
        if (easyGlCanvasRef12.current) {
            const easygl = new EasyGL( easyGlCanvasRef12.current );
            newEasyGlInstances.push(easygl);
            easygl.setClearColor(c2Color);
            easygl.setCameraPosition( 0, 0, 3 );
            easygl.setPerspective();

            let sphere = generateSphereMesh(1,0.7,0, new vec4(1,0,0,1), true);
            easygl.createObject( 's1' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, sphere.colors);
            easygl.setObjectPosition( 's1' , 0,2,0);
            easygl.setObjectReflectivity('s1', 0.6);

            sphere = generateSphereMesh(2,0.7,0,  new vec4(0,1,0,1), true);
            easygl.createObject( 's2' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, sphere.colors);
            easygl.setObjectPosition( 's2' , 0,0,0);
            easygl.setObjectReflectivity('s2', 0.6);

            sphere = generateSphereMesh(3,0.7,0,  new vec4(0,0,1,1), true);
            easygl.createObject( 's3' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, sphere.colors);
            easygl.setObjectPosition( 's3' , 0,-2,0);
            easygl.setObjectReflectivity('s3', 0.6);
            
            newEasyGlUpdateFunctions.push((t) => {
                t += 0.1;
                easygl.setDirectionalLightingDirection( 
                    Math.cos(t), 
                    Math.sin(t/2), 
                    Math.sin(t/3) );

                // Color each of the spheres based on time
                easygl.setObjectColor( 's1', new vec4(Math.sin(t+1),0,Math.cos(t/2),1));
                easygl.setObjectColor( 's2', new vec4(0,Math.sin(t+2),Math.cos(t/2),1));
                easygl.setObjectColor( 's3', new vec4(Math.cos(t/2),0,Math.sin(t+3),1));

                easygl.clear();
                easygl.renderAll();
            });
        }

        // Canvas 5
        if (easyGlCanvasRef5.current) {
            //INIT///////////////////////////////////////////////////////////////
            //This is abasic test program to test the EasyGL & FPC libraries
            //First, get the canvas element
            const easygl = new EasyGL( easyGlCanvasRef5.current );
            newEasyGlInstances.push(easygl);
            easygl.setClearColor(c5Color);
            easygl.setPerspective();

            //Create the EasyGL and FPC objects
            const fpc = new FPC();
            easygl.fpc = fpc;

            //SETUP////////////////////////////////////////////////////////////////////////////////////

            //Add the event listeners for the FPC
            ['keydown', 'keyup'].forEach( function(e) {
                document.addEventListener(e, function(event) {fpc.eventListener(event)});
            });
            ['mousedown','mouseup','mousemove'].forEach( function(e) {
                easyGlCanvasRef5.current.addEventListener(e, function(event) {fpc.eventListener(event)});
            });

            //add event listener for window resize, so the gl canvas can be resized
            window.addEventListener('resize', function(event) {easygl.resizeListener(event)} )


            //Set some basic parameters for the EasyGL instance
            easygl.setPerspective(); //set to default perspective mode values
            easygl.setClearColor(c5Color);

            const randTexture = [];
            for (let i=0; i<256*4; i++)
            {
                randTexture.push(Math.random()*255);
            }
            easygl.createTexture("randTexture", randTexture);

            //Create some EasyGL objects
            easygl.createObject('t1F', new vec4(0,0,2), null, null, [-0.7,0,0, 0.7,0,0, 0,1,0],  [0,1,2, 0,2,1],  [1,0,0, 0,1,0, 0,0,1], [1,0,0,1, 1,1,0,1, 1,0,1,1]);
            easygl.createObject('t2F', new vec4(0,0,-2), null, null, [-0.7,0,0, 0.7,0,0, 0,1,0],  [0,1,2, 0,2,1],  [1,0,0, 0,1,0, 0,0,1], [1,0,0,1, 0,1,0,1, 0,0,1,1]);
            easygl.createObject('myCube', new vec4(2,0,0), new vec4(0,3.14/4), new vec4(1,2,3));
            easygl.createTextureObject('transCube', new vec4(-2), null, null, null, null, null, null, "randTexture");
            easygl.createObject('bigCube', new vec4(0,2,0), null, null, undefined, undefined, undefined, new vec4(0,1,0,1));

            easygl.setObjectReflectivity('bigCube', 0.6);
            easygl.setObjectReflectivity('transCube', 0.6);
            

            let newColors = [];
            for (let i=0; i<24; i++)
            {
                newColors.push(Math.random(), Math.random(), Math.random(), 1);
            }

            easygl.setObjectColor('bigCube', newColors);

            fpc.setPosition(0, 2, -4);

            //RUN////////////////////////////////////////////////////////////////////////////////////
            //The update loop runs every frame

            //Update function, which runs once every frame. 1000/10 = 100FPS
            newEasyGlUpdateFunctions.push((t) => {
                //Update FPC, and send data (rotation & position) to EasyGL
                const fpc = easygl.fpc;
                fpc.update();
                easygl.setCameraPosition(fpc.getPosition().mul(1,1,-1));
                easygl.setCameraRotation(fpc.getRotation());

                //Randomly modify rotation and position so people know it's live...
                fpc.setPosition( fpc.getPosition().add(new vec4(Math.sin(t)/700, Math.cos(t/2)/1000, Math.sin(t/3)/2000)) );
                let rot = fpc.rotation;
                fpc.rotation = new vec4( rot.x, rot.y + Math.sin(t)/1000, rot.z + Math.cos(t)/1000 , rot.a)

                //Rendering! first, clearing the screen, then, rendering all objects
                easygl.clear(); //clear the screen
                easygl.renderAll(); //can also use gl.renderObject(objID) to render only specific objects instead of all objects
            });
        }

        setEasyglInstances(newEasyGlInstances);
        setEasyGlUpdateFunctions(newEasyGlUpdateFunctions);
        setEasyGlClearFunctions(newEasyGlClearFunctions);
    }, [easyGlCanvasRefMain, easyGlCanvasRef1, easyGlCanvasRef2, easyGlCanvasRef3, easyGlCanvasRef4, easyGlCanvasRef5,easyGlCanvasRef11, easyGlCanvasRef12]);



    // Resize listener
    useEffect(() => {
        function resize(event) {
            //Adjust for mobile view
            try {
                if (window.innerHeight > window.innerWidth)
                {
                    const divs = document.getElementsByClassName('flexDiv');
                    for (let i=0; i< divs.length-1; i++)
                    {
                        divs[i].style.flexWrap='wrap';
                    }

                    const canvases = document.getElementsByClassName('daCanvas');
                    for (let i=0; i<canvases.length; i++)
                    {
                        canvases[i].style.width='98vw';
                        canvases[i].style.height='50vw'
                    }
                }
            } catch (e){
                console.error("Failed to adjust for width: ",e);
            }

            for (let i=0; i<easyGlInstances.length; i++)
            {
                easyGlInstances[i].resizeListener(event);
            }
        }

        function update() {
            for (let i=0; i<easyGlUpdateFunctions.length; i++) {
                easyGlUpdateFunctions[i](Date.now()/1000);
            }
        }

        const updateInterval = setInterval(update, 50);

        window.addEventListener('resize', resize);
        document.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('resize', resize);
            clearInterval(updateInterval);
        }

    }, [easyGlInstances, easyGlUpdateFunctions]);

    
    return (
        <div>
            <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                <h1>
                    EasyGl
                </h1>
            </div>
            <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                <h2>
                    A webgl-based library designed for rendering basic objects
                </h2>
            </div>
            <div style={{display: 'flex', width: '100%', justifyContent: 'center'}}>
                <h2>
                    <a href={"https://github.com/19zgunther/EasyGL"}>
                        See https://github.com/19zgunther/EasyGL for details
                    </a>
                </h2>
            </div>
            
            <div style={{display: 'block', position: 'relative'}}>
                <div class='flexDiv' style={{maxWidth: '99vw', flexWrap: 'wrap', display: 'flex', position: 'relative', justifyContent: 'center'}}>
                    {/* <p style={{position: 'absolute', top: '0', left: '0', display: 'block', margin: '1vmin', zIndex: '100'}}>
                        Hover over each panel to run
                    </p> */}
                    <canvas class = 'daCanvas' id='c1' style={{width: '24.9vw', height: '80vh'}} ref={easyGlCanvasRef1}></canvas>
                    <canvas class = 'daCanvas' id='c2' style={{width: '24.9vw', height: '80vh'}} ref={easyGlCanvasRef2}></canvas>
                    <canvas class = 'daCanvas' id='c3' style={{width: '24.9vw', height: '80vh'}} ref={easyGlCanvasRef3}></canvas>
                    <canvas class = 'daCanvas' id='c4' style={{width: '24.9vw', height: '80vh'}} ref={easyGlCanvasRef4}></canvas>
                    <canvas class = 'daCanvas' id='c11' style={{width: '24.9vw', height: '80vh'}} ref={easyGlCanvasRef11}></canvas>
                    <canvas class = 'daCanvas' id='c12' style={{width: '24.9vw', height: '80vh'}} ref={easyGlCanvasRef12}></canvas>
                </div>
                <div class = 'flexDiv' style={{display: 'flex', position: 'relative', justifyContent: 'center'}}>
                    <p style={{position: 'absolute', top: '0', left: '0', display: 'block', margin: '1vmin'}}>
                        Use WASD to move.<br />Click & Drag or use arrow keys to rotate camera
                    </p>
                    <canvas id='c5' style={{width: '99.9vw', height: '80vh'}} ref={easyGlCanvasRef5}></canvas>
                    <p style={{position: 'absolute', bottom: '0', left: '0', display: 'block', margin: '1vmin', userSelect: 'none'}}>
                        Lines of code: ~80
                    </p>
                </div>
            </div>

            {/* <Clone /> */}
        </div>
    );
}


export default EasyGlMain;



/*
generateSphereMesh

//canvas 6
{


    const canvasElement = document.getElementById( "c6" );
    const easygl = new EasyGL( canvasElement );
    easygl.setClearColor(c1Color);
    easygl.setCameraPosition( 0, 0, -2 );
    easygl.setPerspective();
    const sphere = generateSphereMesh(4,1,0);
    easygl.createObject( 'myObject1' , null, null, null, sphere.vertices, sphere.indices, sphere.normals, sphere.colors);

    let t=0;


    let updateInterval = setInterval( update, 100 );


    function update() {
        t += 0.03;
        easygl.setObjectRotation( 'myObject1', t, t/2, t/3 );
        easygl.clear();
        easygl.renderAll();
    }

    canvasElement.addEventListener('mouseenter', function() {
        clearInterval(updateInterval);
        updateInterval = setInterval(update, 20);
    });
    canvasElement.addEventListener('mouseleave', function() {
        clearInterval(updateInterval);
        updateInterval = setInterval(update, 100);
    });


}
*/