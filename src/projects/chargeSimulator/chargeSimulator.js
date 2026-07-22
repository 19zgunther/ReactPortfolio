import { useState, useEffect, useRef } from 'react';
import { vec4 } from '../myMath';
import chargeSimulatorCSS from './chargeSimulator.css';


class Particle {
    constructor(charge, pos) {
        this.charge = charge;
        this.pos = pos;
    }
}

const gridUnits = 0.001;      //0.01 = cm, 1=m, 1000 = km per grid line
const k = 9*Math.pow(10,9); //phsyics constant

function ChargeSimulator() {

    const gridCanvasRef = useRef(null);
    const arrowCanvasRef = useRef(null);
    const particleCanvasRef = useRef(null);
    const equipotentialCanvasRef = useRef(null);

    const [gridCanvasCtx, setGridCanvasCtx] = useState(null);
    const [arrowCanvasCtx, setArrowCanvasCtx] = useState(null);
    const [particleCanvasCtx, setParticleCanvasCtx] = useState(null);
    const [equipotentialCanvasCtx, setEquipotentialCanvasCtx] = useState(null);

    const [gridCanvasBoundingClientRect, setGridCanvasBoundingClientRect] = useState(null);

    const [maxMinCharge, setMaxMinCharge] = useState([-1, 1]);
    const [selectedParticle, setSelectedParticle] = useState(null);
    const [createNewParticle, setCreateNewParticle] = useState(false);
    const [showForceInfo, setShowForceInfo] = useState(true);

    const [gridSizePx, setGridSizePx] = useState(20);
    const [particles, setParticles] = useState([
        new Particle(0.000000001, new vec4(22, 14)),
        new Particle(-0.000000001, new vec4(26, 18)),
        new Particle(0.000000002, new vec4(24, 10)),
    ]);
    const [equipotentialLinesString, setEquipotentialLinesString] = useState('-1,0,1');

    const [rerenderIndex, setRerenderIndex] = useState(0);

    const [globals, setGlobals] = useState({
        mousePosPx: new vec4(0, 0),
        mousePos: new vec4(0, 0),
        mouseDown: false,
        mouseDownPosPx: new vec4(0, 0),
        mouseDownPos: new vec4(0, 0),
        mouseWasDown: false,
        draggingSelectedParticle: false,
        draggedParticle: null,
        escapePressed: false,
        deletePressed: false,
        chargeInputFocused: false,
    });

    const [settings, setSettings] = useState({
        chargeRadius: 10,
        fontSize: 15,
        gridMinorColor: 'rgba(255,255,255,0.1)',
        gridMajorColor: 'rgba(255,255,255,0.5)',
        gridMinorWidth: 1,
        gridMajorWidth: 2,
        voltageScalar: 100,
        chargeScalar: 1000000000,
    });
    

    // Used for updating the canvas/
    useEffect(() => {
        
        if (!gridCanvasCtx) {
            return;
        }

        const widthPx = gridCanvasRef.current.width;
        const heightPx = gridCanvasRef.current.height;
        const width = widthPx / gridSizePx;
        const height = heightPx / gridSizePx;

        function Calc(pos, particle)
        {
            let volt = 0;
            let negVolt = 0;
            let posVolt = 0;

            const tot = new vec4(0, 0);

            for(var i=0;i<particles.length;i++)
            {
                if (particles[i] === particle) {continue;}
                const d = particles[i].pos.sub(pos);
                const dist = d.getMagnitude();
                const mag = (k*particles[i].charge)/(dist*dist);
                
                tot.addi(d.scaleToUnit().mul(mag));

                volt += k*particles[i].charge/dist;
                if (particles[i].charge>0) {
                    posVolt += k*particles[i].charge/dist;
                } else {
                    negVolt -= k*particles[i].charge/dist;
                }
            }
            const angle = Math.PI*3/2-Math.atan2(tot.y,tot.x);
            const mag = tot.getMagnitude();

            return {
                mag: mag,
                volt: volt,
                potentialEnergy: particle !== undefined ? volt*particle.charge : undefined,
                force: particle !== undefined ? mag*particle.charge : undefined,
                angle: angle,
                posVolt: posVolt,
                negVolt: negVolt,
                vec: tot,
            }
        }
        function CalcOnlyVolt(pos)
        {
            let volt = 0;
            for(var i=0;i<particles.length;i++)
            {
                volt += k*particles[i].charge/ (particles[i].pos.sub(pos)).getMagnitude();
            }
            return volt;
        }
        
        // function CalcForceVector(particle)
        // {
        //     var force = 0;
        //     var q;      //will hold particle charge
        //     var dx = 0;     //will hold difference in x position
        //     var dy = 0;     //will hold difference in y position
        //     var dist = 0;   //distance
        //     var mag = 0;    //magnitude
        //     var totx = 0;
        //     var toty = 0;
        //     var angle = 0;
        //     var volt = 0;
        //     var potentialEnergy = 0;
        //     for (var j=0; j<particles.length; j++)
        //     {
        //         if (particles[j] === particle) {continue;}
                
        //         q = particles[j].charge;
        //         dx = (particles[j].posx-particle.posx)*gridUnits/gridSize;
        //         dy = (particles[j].posy-particle.posy)*gridUnits/gridSize;
        //         dist = Math.sqrt(dx*dx+dy*dy);
        //         mag = (k*q)/(dist*dist);
                
        //         totx += mag*dx/dist;
        //         toty += mag*dy/dist;

        //         volt += k*q/dist;
        //     }
        //     angle = Math.PI*3/2-Math.atan2(toty,totx);
        //     if (particle.charge < 0) { angle += Math.PI; }
        //     force = Math.sqrt(toty*toty+totx*totx)*particle.charge;
        //     potentialEnergy = particle.charge * volt;
        //     return [force,angle,potentialEnergy];
        // }
        // function CalcVolt(posx, posy)
        // {
        //     var volt = 0;
        //     var q;      //will hold particle charge
        //     var dx;     //will hold difference in x position
        //     var dy;     //will hold difference in y position
        //     var dist;   //distance

        //     for(var i=0;i<particles.length;i++)
        //     {
        //         q = particles[i].charge;
        //         dx = (particles[i].posx-posx)*gridUnits/gridSize;
        //         dy = (particles[i].posy-posy)*gridUnits/gridSize;
        //         dist = Math.sqrt(dx*dx+dy*dy);
        //         volt += k*q/dist;
        //     }
        //     return volt;
        // }
        // function CalcElectricMag(posx, posy)
        // {
        //     var q;      //will hold particle charge
        //     var dx;     //will hold difference in x position
        //     var dy;     //will hold difference in y position
        //     var dist;   //distance
        //     var mag;    //magnitude
        //     var totx = 0;
        //     var toty = 0;

        //     for(var i=0;i<particles.length;i++)
        //     {
        //         q = particles[i].charge;
        //         dx = (particles[i].posx-posx)*gridUnits/gridSize;
        //         dy = (particles[i].posy-posy)*gridUnits/gridSize;
        //         dist = Math.sqrt(dx*dx+dy*dy);
        //         mag = (k*q)/(dist*dist);
                
        //         totx += mag*dx/dist;
        //         toty += mag*dy/dist;
        //     }
        //     return Math.sqrt(toty*toty+totx*totx);
        // }
        // function CalcMedium(posx, posy)
        // {
        //     var volt = 0;
        //     var q;      //will hold particle charge
        //     var dx;     //will hold difference in x position
        //     var dy;     //will hold difference in y position
        //     var dist;   //distance

        //     var mag = 0;
        //     var totx = 0;
        //     var toty = 0;

        //     for(var i=0;i<particles.length;i++)
        //     {
        //         q = particles[i].charge;
        //         dx = (particles[i].posx-posx)*gridUnits/gridSize;
        //         dy = (particles[i].posy-posy)*gridUnits/gridSize;
        //         dist = Math.sqrt(dx*dx+dy*dy);
        //         volt += k*q/dist;
        //         mag = (k*q)/(dist*dist);

        //         totx += mag*dx/dist;
        //         toty += mag*dy/dist;
        //     }

        //     angle = Math.PI*3/2-Math.atan2(toty,totx);
        //     return [volt,angle];
        // }
        // function CalcAngle(posx, posy)
        // {
        //     var q;      //will hold particle charge
        //     var dx;     //will hold difference in x position
        //     var dy;     //will hold difference in y position
        //     var dist;   //distance

        //     var mag = 0;
        //     var totx = 0;
        //     var toty = 0;

        //     for(var i=0;i<particles.length;i++)
        //     {
        //         q = particles[i].charge;
        //         dx = (particles[i].posx-posx)*gridUnits/gridSize;
        //         dy = (particles[i].posy-posy)*gridUnits/gridSize;
        //         dist = Math.sqrt(dx*dx+dy*dy);
        //         mag = (k*q)/(dist*dist);

        //         totx += mag*dx/dist;
        //         toty += mag*dy/dist;
        //     }

        //     angle = Math.PI*3/2-Math.atan2(toty,totx);
        //     return angle;
        // }
        // function CalcForceVector(particle)
        // {
        //     var force = 0;
        //     var q;      //will hold particle charge
        //     var dx = 0;     //will hold difference in x position
        //     var dy = 0;     //will hold difference in y position
        //     var dist = 0;   //distance
        //     var mag = 0;    //magnitude
        //     var totx = 0;
        //     var toty = 0;
        //     var angle = 0;
        //     var volt = 0;
        //     var potentialEnergy = 0;
        //     for (var j=0; j<particles.length; j++)
        //     {
        //         if (particles[j] == particle) {continue;}
                
        //         q = particles[j].charge;
        //         dx = (particles[j].posx-particle.posx)*gridUnits/gridSize;
        //         dy = (particles[j].posy-particle.posy)*gridUnits/gridSize;
        //         dist = Math.sqrt(dx*dx+dy*dy);
        //         mag = (k*q)/(dist*dist);
                
        //         totx += mag*dx/dist;
        //         toty += mag*dy/dist;

        //         volt += k*q/dist;
        //     }
        //     angle = Math.PI*3/2-Math.atan2(toty,totx);
        //     if (particle.charge < 0) { angle += Math.PI; }
        //     force = Math.sqrt(toty*toty+totx*totx)*particle.charge;
        //     potentialEnergy = particle.charge * volt;
        //     return [force,angle,potentialEnergy];
        // }

        function chargeToColor(charge) {
            // const normalizedCharge = (charge - maxMinCharge[0]) / (maxMinCharge[1] - maxMinCharge[0]);
            const r = charge*255*settings.chargeScalar;
            const g = 0;
            const b = -charge*255*settings.chargeScalar;
            return `rgba(${r}, ${g}, ${b}, ${1})`;
        }
        function voltageToColor(posVolt, negVolt) {
            const r = posVolt*settings.voltageScalar;
            const g = 0;
            const b = negVolt*settings.voltageScalar;
            return `rgba(${r}, ${g}, ${b}, 1)`;
        }

        function renderGrid() {
            console.log("render grid")
            const ctx = gridCanvasCtx;

            // Selectively don't render, because nothing's changed
            const hash = JSON.stringify({gridSizePx:gridSizePx, particles:particles, ctx:ctx, heightPx: heightPx, widthPx: widthPx});
            if (hash === globals.lastRenderGridHash && globals.lastRenderGridTime !== undefined && Date.now() - globals.lastRenderGridTime < 1000) { return; }
            globals.lastRenderGridHash = hash;
            globals.lastRenderGridTime = Date.now();


            ctx.beginPath();
            ctx.strokeStyle = settings.gridMinorColor;
            ctx.clearRect(0, 0, widthPx, heightPx);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, widthPx, heightPx);
            for (let x=0; x<heightPx; x+=gridSizePx) {
                ctx.moveTo(0, x);
                ctx.lineTo(widthPx, x);
            }
            for (let y=0; y<widthPx; y+=gridSizePx) {
                ctx.moveTo(y, 0);
                ctx.lineTo(y, heightPx);
            }

            ctx.stroke();
            ctx.closePath();

            // Render arrows
            // const table = [];
            for (let y=0; y<heightPx; y+=gridSizePx) {
                // const row = [];
                for (let x=0; x<widthPx; x+=gridSizePx) {
                    ctx.beginPath();
                    const pos = new vec4(x/gridSizePx, y/gridSizePx);
                    const data = Calc(pos, undefined);
                    const vec = data.vec;
                    const norm = vec.copy().scaleToUnit();
                    const color = voltageToColor(data.posVolt, data.negVolt);
                    // row.push(data);

                    // if (x == 0 && y == 0) {
                    //     console.log(data);
                    // }
                    // Draw arrow at x,y px using Vec for the angle

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + norm.x*10, y + norm.y*10);
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    ctx.closePath();
                }
                // table.push(row);
            }
        }

        function renderParticles() {
            const ctx = particleCanvasCtx;
            ctx.clearRect(0, 0, widthPx, heightPx);
            
            for (let particle of particles) {
                const data = Calc(particle.pos, particle);
                ctx.beginPath()
                ctx.fillStyle = chargeToColor(particle.charge);
                // circle with white border radius 10   

                // if selected particle, draw a red border
                ctx.moveTo(particle.pos.x*gridSizePx + settings.chargeRadius, particle.pos.y*gridSizePx);
                ctx.arc(particle.pos.x*gridSizePx, particle.pos.y*gridSizePx, settings.chargeRadius, 0, 2*Math.PI);
                ctx.fill();
                if (particle === selectedParticle) {
                    ctx.strokeStyle = 'rgba(255,255,255,1)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                if (showForceInfo) {
                    const l1 = `${particle.charge}nC`;
                    const l2 = `|F|: ${data.force.toPrecision(5)}N`;
                    const l3 = `PE: ${data.potentialEnergy.toPrecision(5)}J`;
                    const m1 = ctx.measureText(l1);
                    const m2 = ctx.measureText(l2);
                    const m3 = ctx.measureText(l3);
                    ctx.font = Math.round(settings.fontSize) + 'px Arial';
                    const x =particle.pos.x*gridSizePx + settings.chargeRadius+5;
                    let y = particle.pos.y*gridSizePx;
                    // ctx.fillStyle = 'rgba(255,255,255,0.2)';
                    // ctx.fillRect(x, particle.pos.y*gridSizePx, m1.width, m1.actualBoundingBoxAscent);
                    ctx.fillStyle = 'rgba(255,255,255,1)';
                    ctx.fillText(l1, x, y);
                    y += m1.actualBoundingBoxAscent + m1.actualBoundingBoxDescent + 5;
                    ctx.fillText(l2, x, y);
                    y += m2.actualBoundingBoxAscent + m2.actualBoundingBoxDescent + 5;
                    ctx.fillText(l3, x, y);
                    ctx.closePath();
                }
            }

        }

        function renderEquipotentials() {
            const ctx = equipotentialCanvasCtx;
            const hash = JSON.stringify({equipotentialLinesString:equipotentialLinesString, gridSizePx:gridSizePx, particles:particles, ctx:ctx, heightPx: heightPx, widthPx: widthPx});
            if (hash === globals.lastRenderEquipotentialsHash) { return; }
            globals.lastRenderEquipotentialsHash = hash;

            ctx.beginPath();
            ctx.clearRect(0, 0, widthPx, heightPx);
            ctx.strokeStyle = 'rgba(255,255,255,1)';

            const euipVoltages = [];
            for (let i=0; i<equipotentialLinesString.split(',').length; i++) { euipVoltages.push(parseFloat(equipotentialLinesString.split(',')[i])); }

            for (let y=3; y<heightPx-3; y+=4) {
                let last_was_greater = [];
                for (let i=0; i<euipVoltages.length; i++) { last_was_greater.push(null); }

                for (let x=3; x<widthPx-3; x+=4) {
                    const posPx = new vec4(x, y);
                    // const data = Calc(posPx.mul(1/gridSizePx), undefined);
                    const curVolt = CalcOnlyVolt(posPx.mul(1/gridSizePx));
                    for (let i=0; i<euipVoltages.length; i++) {
                        const voltage = euipVoltages[i];
                        if ((last_was_greater[i] !== null) && ((last_was_greater[i] && curVolt < voltage) || (!last_was_greater[i] && curVolt > voltage))) {
                            // last_was_greater[i] = data.volt >= voltage;
                            ctx.moveTo(posPx.x, posPx.y);
                            ctx.lineTo(posPx.x+1, posPx.y+1);
                        }
                        last_was_greater[i] = curVolt >= voltage; 
                    }
                }
            }
            ctx.stroke();
            ctx.closePath();
        }

        const hitRadiusGrid = settings.chargeRadius / gridSizePx;

        function findNearestParticle(pos, maxDist = hitRadiusGrid) {
            let nearest = null;
            let nearestDist = maxDist;
            for (const particle of particles) {
                const dist = particle.pos.distTo(pos);
                if (dist < nearestDist) {
                    nearest = particle;
                    nearestDist = dist;
                }
            }
            return nearest;
        }

        function syncMousePos(event) {
            if (!gridCanvasBoundingClientRect) { return; }
            globals.mousePosPx = new vec4(
                event.clientX - gridCanvasBoundingClientRect.left,
                event.clientY - gridCanvasBoundingClientRect.top
            );
            globals.mousePos = globals.mousePosPx.mul(1 / gridSizePx);
        }

        function eventHandler(event) {
            switch(event.type) {
                case 'mousedown':
                    globals.mouseDown = true;
                    syncMousePos(event);
                    break;
                case 'mouseup':
                    globals.mouseDown = false;
                    globals.draggingSelectedParticle = false;
                    globals.draggedParticle = null;
                    break;
                case 'mousemove':
                    syncMousePos(event);
                    break;
                case 'keydown':
                    if (event.key === 'Escape') {
                        globals.escapePressed = true;
                    } else if (event.key === 'Delete' || event.key === 'Backspace') {
                        globals.deletePressed = true;
                    }
                    break;
                default:
                    break;
            }
        }

        function update() {
            if (createNewParticle) {
                const newParticle = new Particle(0.000000001, new vec4(width / 2, height / 2));
                setParticles([...particles, newParticle]);
                setSelectedParticle(newParticle);
                setCreateNewParticle(false);
                globals.draggingSelectedParticle = false;
                globals.draggedParticle = null;
                globals.mouseWasDown = globals.mouseDown;
                globals.escapePressed = false;
                globals.deletePressed = false;
                return;
            }

            if (globals.deletePressed && selectedParticle && !globals.chargeInputFocused) {
                setParticles(particles.filter(particle => particle !== selectedParticle));
                setSelectedParticle(null);
                globals.draggingSelectedParticle = false;
                globals.draggedParticle = null;
            }

            if (globals.escapePressed) {
                setSelectedParticle(null);
                globals.draggingSelectedParticle = false;
                globals.draggedParticle = null;
            }

            if (!globals.mouseDown) {
                globals.draggingSelectedParticle = false;
                globals.draggedParticle = null;
            }

            // Fresh press: select nearest particle under cursor, or deselect.
            // Keep the drag target on globals so stale React closures can't
            // keep moving a previously selected particle.
            if (globals.mouseDown && !globals.mouseWasDown) {
                const hit = findNearestParticle(globals.mousePos);
                if (hit) {
                    setSelectedParticle(hit);
                    globals.draggingSelectedParticle = true;
                    globals.draggedParticle = hit;
                } else {
                    setSelectedParticle(null);
                    globals.draggingSelectedParticle = false;
                    globals.draggedParticle = null;
                }
            }

            if (globals.draggingSelectedParticle && globals.draggedParticle && globals.mouseDown) {
                globals.draggedParticle.pos = globals.mousePos.copy().round();
            }

            globals.mouseWasDown = globals.mouseDown;
            globals.escapePressed = false;
            globals.deletePressed = false;
        }

        const equipotentialCanvas = equipotentialCanvasRef.current;
        // mousedown stays on the canvas; mouseup/move on window so drag state
        // doesn't stick when the cursor is released outside the canvas
        equipotentialCanvas.addEventListener('mousedown', eventHandler);
        window.addEventListener('mouseup', eventHandler);
        window.addEventListener('mousemove', eventHandler);
        window.addEventListener('keydown', eventHandler);
        const updateInterval = setInterval(update, 20);
        const renderGridInterval = setInterval(renderGrid, 100);
        const renderParticlesInterval = setInterval(renderParticles, 30);
        const equipotentialUpdateInterval = setInterval(renderEquipotentials, 300);

        return () => {
            equipotentialCanvas.removeEventListener('mousedown', eventHandler);
            window.removeEventListener('mouseup', eventHandler);
            window.removeEventListener('mousemove', eventHandler);
            window.removeEventListener('keydown', eventHandler);
            clearInterval(updateInterval);
            clearInterval(equipotentialUpdateInterval);
            clearInterval(renderGridInterval);
            clearInterval(renderParticlesInterval);
        }

    }, [gridCanvasCtx, arrowCanvasCtx, particleCanvasCtx, equipotentialCanvasCtx, gridSizePx, particles, maxMinCharge, globals, selectedParticle, gridCanvasBoundingClientRect, createNewParticle, settings, showForceInfo, equipotentialLinesString]);

    // Used for setting up the canvas
    useEffect(() => {

        const gridCanvas = gridCanvasRef.current;
        const arrowCanvas = arrowCanvasRef.current;
        const particleCanvas = particleCanvasRef.current;
        const equipotentialCanvas = equipotentialCanvasRef.current;

        if (!gridCanvas || !arrowCanvas || !particleCanvas || !equipotentialCanvas) {
            return;
        }

        function resize() {
            const gridCanvasBB = gridCanvas.getBoundingClientRect();
            const arrowCanvasBB = arrowCanvas.getBoundingClientRect();
            const particleCanvasBB = particleCanvas.getBoundingClientRect();
            const equipotentialCanvasBB = equipotentialCanvas.getBoundingClientRect();
            
            gridCanvas.width = gridCanvasBB.width;
            gridCanvas.height = gridCanvasBB.height;
            arrowCanvas.width = arrowCanvasBB.width;
            arrowCanvas.height = arrowCanvasBB.height;
            particleCanvas.width = particleCanvasBB.width;
            particleCanvas.height = particleCanvasBB.height;
            equipotentialCanvas.width = equipotentialCanvasBB.width;
            equipotentialCanvas.height = equipotentialCanvasBB.height;
            setGridCanvasBoundingClientRect(gridCanvasBB);
        }

        resize();
        
        setGridCanvasCtx(gridCanvas.getContext('2d'));
        setArrowCanvasCtx(arrowCanvas.getContext('2d'));
        setParticleCanvasCtx(particleCanvas.getContext('2d'));
        setEquipotentialCanvasCtx(equipotentialCanvas.getContext('2d'));

        window.addEventListener('resize', resize);
        return () => {window.removeEventListener('resize', resize)}

    }, [gridCanvasRef, arrowCanvasRef, particleCanvasRef, equipotentialCanvasRef]);

    return (
        <div className="project-page">
            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                <h1>Charge Simulator</h1>
            </div>
            <div style={{display: 'flex', justifyContent: 'center'}}>
                <p>
                    Click and drag to move and edit the charged particles.
                </p>
            </div>
            <div className="canvas-container">
                <canvas ref={gridCanvasRef} className="grid-canvas charge-simulator-canvas"></canvas>
                <canvas ref={arrowCanvasRef} className="arrow-canvas charge-simulator-canvas"></canvas>
                <canvas ref={particleCanvasRef} className="particle-canvas charge-simulator-canvas"></canvas>
                <canvas ref={equipotentialCanvasRef} className="equipotential-canvas charge-simulator-canvas"></canvas>

                <div className="charge-simulator-canvas-overlay">
                    <div className="charge-simulator-overlay-section">
                        <p className="charge-simulator-overlay-title">Controls</p>
                        <button onClick={() => setCreateNewParticle(true)}>
                            Create New Particle
                        </button>
                        <div className="charge-simulator-overlay-row">
                            <span className="charge-simulator-overlay-label">Show force info</span>
                            <input type="checkbox" checked={showForceInfo} onChange={() => setShowForceInfo(!showForceInfo)} />
                        </div>
                        <label className="charge-simulator-overlay-label" htmlFor="equipotential-lines">Equipotential lines</label>
                        <input
                            id="equipotential-lines"
                            type="text"
                            value={equipotentialLinesString}
                            onChange={(e) => {setEquipotentialLinesString(e.target.value)}}
                            placeholder="-1, 0, 1"
                        />
                    </div>

                    <div className="charge-simulator-overlay-divider" />

                    {selectedParticle ? (
                        <div className="charge-simulator-overlay-section">
                            <p className="charge-simulator-overlay-title">Selected particle</p>
                            <div className="charge-simulator-overlay-row">
                                <span className="charge-simulator-overlay-label">Charge</span>
                                <div className="charge-simulator-charge-field">
                                    <input
                                        type="number"
                                        step={0.01}
                                        onFocus={()=>{globals.chargeInputFocused = true}}
                                        onBlur={()=>{globals.chargeInputFocused = false}}
                                        value={selectedParticle.charge*1000000000}
                                        onChange={(e) => {selectedParticle.charge = parseFloat(e.target.value)/1000000000; setRerenderIndex(rerenderIndex+1)}}
                                    />
                                    <span className="charge-simulator-unit">nC</span>
                                </div>
                            </div>
                            <button className="danger" onClick={() => globals.deletePressed = true}>Delete Particle</button>
                        </div>
                    ) : (
                        <p className="charge-simulator-selected-hint">Click a particle to edit</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChargeSimulator;