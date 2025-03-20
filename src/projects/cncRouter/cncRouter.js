import { OBJFileRenderer } from "../OBJFileRenderer";
import { vec4 } from "../myMath";
import { cncRouterDataObj } from "./cncRouterData2";
import { useEffect, useRef, useState } from "react";

import IMG_7620 from "./IMG_7620.JPG";
import Schematic_CncRouterDriver_2023_04_10 from "./Schematic_CncRouterDriver_2023-04-10.png";
import guiScreenshot from "./guiScreenshot.png";
import PCB_inputImg from "./PCB_inputImg.png";
import PCB_outputImg_Straight from "./PCB_outputImg_Straight.png";
import pcb from "./pcb.png";
import PCB_outputImg_Rounded from "./PCB_outputImg_Rounded.png";
import pcb2_bottom from "./pcb2_bottom.png";
import GradientExampleImg_v2 from "./GradientExampleImg_v2.png";



function CncRouter()
{
    const canvasElementRef = useRef(null);
    const [objRenderer, setObjRenderer] = useState(null);
    const [mouseIsDown, setMouseIsDown] = useState(false);
    const [pressedKeys, setPressedKeys] = useState(new Map());
    const [rotationSpeed, setRotationSpeed] = useState(0);
    const [rotationAcceleration, setRotationAcceleration] = useState(0.0001);
    const [maxRotationSpeed, setMaxRotationSpeed] = useState(0.004);

    useEffect(() => {

        function render()
        {
            objRenderer.render();

            if (rotationSpeed < maxRotationSpeed && !mouseIsDown)
            {
                setRotationSpeed(rotationSpeed + rotationAcceleration);
            }
            try {
                objRenderer.setObjectRotation( objRenderer.getObjectRotation().add(0.00, rotationSpeed, 0));
            } catch (error) {
                
            }
            if (pressedKeys.get('w'))
            {
                objRenderer.setObjectPosition(objRenderer.getObjectPosition().add(0,0,0.1));
            } else if (pressedKeys.get('s'))
            {
                objRenderer.setObjectPosition(objRenderer.getObjectPosition().add(0,0,-0.1));
            }
        }


        function eventListener(e)
        {
            if (objRenderer == null)
            {
                return;
            }
            objRenderer.eventListener(e);
            if (e.type == "keyup")
            {
                pressedKeys.set(e.key.toLowerCase(), false);
            } else if (e.type == "keydown")
            {
                pressedKeys.set(e.key.toLowerCase(), true);
            } else if (e.type == "mousewheel")
            {
                setRotationSpeed(0);
            } else if (e.type == "mousedown")
            {
                setMouseIsDown(true);
                setRotationSpeed(0);
            } else if (e.type == "mouseup")
            {
                setMouseIsDown(false);
            }
        }
        
        // Initialize objRenderer if it hasn't been initialized yet
        if (objRenderer ==  null) {
            if (canvasElementRef.current) {
                const newObjRenderer = new OBJFileRenderer(canvasElementRef.current, cncRouterDataObj, new vec4(0,0,30), new vec4(0,0,0,1));
                newObjRenderer.setObjectRotation(new vec4(0,0,-1.55));
                setObjRenderer(newObjRenderer);
            }
        }

        // Add event listeners and render loop
        if (canvasElementRef.current)
        {
            const canvasElement = canvasElementRef.current;
            canvasElement.addEventListener("mousedown", eventListener);
            window.addEventListener("mouseup", eventListener);
            canvasElement.addEventListener("mousemove", eventListener);
            canvasElement.addEventListener("mousewheel", eventListener);
            window.addEventListener("keydown", eventListener);
            window.addEventListener("keyup", eventListener);
            const interval = setInterval(render, 60);

            return () => {
                canvasElement.removeEventListener("mousedown", eventListener);
                window.removeEventListener("mouseup", eventListener);
                canvasElement.removeEventListener("mousemove", eventListener);
                canvasElement.removeEventListener("mousewheel", eventListener);
                window.removeEventListener("keydown", eventListener);
                window.removeEventListener("keyup", eventListener);
                clearInterval(interval);
            }
        }
    }, [canvasElementRef, objRenderer, mouseIsDown, pressedKeys, rotationSpeed, rotationAcceleration, maxRotationSpeed]);

    return (
        <div className="project-page">
            <div style={{'textAlign': 'center'}}>
                <h1>CNC Router</h1>
            </div>
            {/* <div style={{width: '90vw', height: '70vh', marginLeft: '5vw', marginRight: '5vw', display: 'block', position:'relative'}}>
                <canvas ref={canvasElementRef} style={{width: '100%', height: '100%', position:'absolute', top:0, left:0}}></canvas>
            </div> */}

            <div style={{width: '80vw', paddingLeft: '10vw', paddingRight: '10vw', marginBottom: '5vmin', borderRadius: '3rem'}}>
                <h2>Problem Statement</h2>
                <p>
                    Over the years I have enjoyed making experimental guitar pedals and amplifiers but have always 
                    been frustrated by how long it takes to solder together circuits on perf boards, and how issue-prone
                    prototyping on breadboards can be. The best way to test such equipment is to order custom PCBs, and 
                    then to solder the components in place manually. Unfortunately, ordering custom PCBs is either expensive or 
                    requires patience as manufacturing and shipping times can easily add up to multiple weeks. Thus, if I want
                    to be able to prototype my circuits more rapidly, I need to find a way to make PCBs at home.
                </p>

                <br/><br/>

                <h2>Overview of PCB Manufacturing Methods</h2>
                <p>
                    There are two main ways to manufacture PCBs. The industry standard way is to etch copper clad circuit boards
                    using a corrosive solution to remove unwanted copper and a resin mask to shield the wanted copper (the traces)
                    from the corrosive solution. This method also requires the use of a CNC router to cut the board perimeter, drill holes for vias, 
                    and mounting holes for through-hole components. 
                    <br/><br/>
                    The second method for creating PCBs is to simply use a router to make isolation cuts in the copper cladding to isolate circuit traces.
                    As both methods require a CNC router, and one requires extra steps involving corrosive chemical, I decided to make PCBs using the
                    latter PCB milling method.
                </p>

                <br/><br/>

                <h2>Project Overview</h2>
                <div style={{margin: '0% 5% 0% 5%'}}>
                    <l>
                        <li><b>CNC Router Assembly</b> - An inexpensive & compact cnc router capable of less than 0.1mm precision in each dimension</li>
                        <br/>   
                        <li><b>CNC Motor Controller</b> - An embedded system that receives commands via USB, maintains relative router positioning, and drives stepper motors</li>
                        <br/>
                        <li><b>Router GUI Application</b> - An application that sends path commands to the router & allows user to start, pause/resume, and stop router programs as well as jog the router for relative positioning</li>
                        <br/>
                        <li><b>Image-Based PCB Slicer</b> - A program that takes a screenshot of a PCB & width information, and outputs a path that isolates all of the traces from one another</li>
                    </l>
                </div>

                <br/><br/>

                <h2>CNC Router Assembly</h2>
                <div>
                    <canvas ref={canvasElementRef} style={{width: '99%', height: '70vh', borderRadius: '0.5rem'}}></canvas>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={IMG_7620} alt="CNC Router Assembly" style={{maxWidth: '60vw%', maxHeight: '60vh', margin: 'auto', borderRadius: '0.5rem'}}/>
                    </div>
                </div>

                <br/><br/>

                <h2>CNC Motor Controller</h2>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <img src={Schematic_CncRouterDriver_2023_04_10} alt="CNC Motor Controller Schematic" style={{maxWidth: '60vw%', maxHeight: '60vh', margin: 'auto', borderRadius: '0.5rem'}}/>
                </div>

                <br/><br/>

                <h2>Controller GUI Application</h2>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <img src={guiScreenshot} alt="CNC Motor Controller GUI" style={{maxWidth: '60vw%', maxHeight: '60vh', margin: 'auto', borderRadius: '0.5rem'}}/>
                </div>

                <br/><br/>

                <h2>Image-Based PCB Slicer</h2>
                <div>
                    <div style={{display: 'flex'}}>
                        <div style={{width: '30%'}}>Input Image</div>
                        <div style={{width: '30%'}}>Sliced Preview Image</div>
                        <div style={{width: '30%'}}>Milled PCB</div>
                    </div>
                    <div style={{display: 'flex'}}>
                        <img src={PCB_inputImg} alt="PCB Input" style={{width: '30%'}}/>
                        <img src={PCB_outputImg_Straight} alt="Sliced Preview" style={{width: '30%'}}/>
                        <img src={pcb} alt="Milled PCB" style={{width: '30%'}}/>
                    </div>
                    <div style={{width: '97%', margin: '1.5%', borderRadius: '0.5rem'}}>Isolation Cuts with router bit radial offset:</div>
                    <div style={{display: 'flex'}}>
                        <div style={{width: '30%'}}>Input Image</div>
                        <div style={{width: '30%'}}>Sliced Preview Image</div>
                        <div style={{width: '30%'}}>Milled PCB</div>
                    </div>
                    <div style={{display: 'flex'}}>
                        <img src={PCB_inputImg} alt="PCB Input" style={{width: '30%'}}/>
                        <img src={PCB_outputImg_Rounded} alt="Sliced Preview" style={{width: '30%'}}/>
                        <img src={pcb2_bottom} alt="Milled PCB" style={{width: '30%'}}/>
                    </div>
                    <div style={{width: '97%', margin: '1.5%', borderRadius: '0.5rem'}}>Isolation Cut Expansion Gradient Image:</div>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <img src={GradientExampleImg_v2} alt="Gradient Example" style={{maxWidth: '60vw%', maxHeight: '60vh',margin: 'auto', borderRadius: '0.5rem'}}/>
                    </div>
                    </div>
            </div>
        </div>
    )
}

export default CncRouter;