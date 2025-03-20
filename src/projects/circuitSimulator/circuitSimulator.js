

//HTML Elements!!!///////////////////////////////////////////////////////
var DrawModeElement = document.getElementById("drawMode");
var ValueInputTextElement = document.getElementById("valueInputText");
var SelectedComponentElement = document.getElementById("selectedComponent");

//var MovingComponentPointElement = document.getElementById("movingComponentPoint");
var SimulationSpeedSliderElement = document.getElementById("simulationSpeedSlider");
var CircuitCanvasElement = document.getElementById("circuitCanvas");

//checkboxes
var LabelNodesCheckboxElement = document.getElementById("labelNodesCheckbox");
var LabelNodeValuesCheckboxElement = document.getElementById('labelNodeValuesCheckbox');
var LabelComponentValuesCheckboxElement = document.getElementById('labelComponentValuesCheckbox');
var LabelComponentNamesCheckboxElement = document.getElementById('labelComponentNamesCheckbox');
var ColorComponentsCheckboxElement = document.getElementById("colorComponentsCheckbox");

//buttons
var AddPlotButtonElement = document.getElementById("addPlotButton");
var RemovePlotButtonElement = document.getElementById("removePlotButton");
var IncreasePlotScaleButtonElement = document.getElementById("increasePlotScaleButton");
var DecreasePlotScaleButtonElement = document.getElementById("decreasePlotScaleButton");
var StartStopButtonElement = document.getElementById("startStopButton");

//Grid
var GridElement = document.getElementById("inputGrid");
var GridInputElements = [];
var GridTextElements = [];
for (var i=0; i<5; i++)
{
    GridInputElements.push( document.getElementById("gridInput"+i) );
    GridTextElements.push( document.getElementById("gridText"+i) );
}






//Settings and such///////////////////////////////////////////////////////////
var width;
var height;
var nodeSize = 5;
var gridSize = 20;
var clickRange = 30;
var labelTextSize = 10;
var painter;

var plotManager;

//component and node stuff
var selectedComponent = null;
var components = [];            //List of all components
var points = [];                //List of all points shared by components
var nodes = [];                 //List of all nodes (electrical, meaning wires have 1 node)
var nodesNotCombined = [];      //List of all basic nodes (not electrical nodes, like junctions) <-- used for calculating currents through wires & such at the very end.


var shouldUpdateNodes = true;


//MISC variables
var updateInterval = setInterval(Update,100);
var calcUpdateInterval = setInterval(Calculate,100);
var running = true;
var drawMode = "";
var movingComponentPoint = ""; //can be "start" (move startPos),"end" (move endPos), "mid" (move entire component aka both points equally) or "" (do not move anything)
var vectorMouseToStart = new Point(0,0); //These two Vector variables are only used when we are in 'movingComponentPoint = "mid" '  mode.
var vectorMouseToEnd = new Point(0,0); //These are points just because I needed a tuple with x&y and I can't be f*cked  (i'm so sorry i'm so tired...)
var labelComponentNames = true; //should we draw the component names?
var labelNodes = true; //should we draw the node names and values?
var editingComponentValue = false;

//Circuit Analysis Variables
var timeStep = 0.000000001; //(1nS)
var calcCyclesPerCall = 1000;
var currentTime = 0;
var matrixA = [];
var matrixB = [];

//Debug Tools
var debugCalculate = false;
var debugGaussian = false;

//keydown variables
var shiftIsDown = false;
var controlIsDown = false;


var mousePos = new Point();


setup();
document.addEventListener('keydown', keyPressed);
document.addEventListener('mouseUp', mouseReleased);

function mouseMoved(event) {
    //mousePos.x = event.clientX;
    ///mousePos.y = event.clientY;
    mousePos = screenPointToCanvas(new Point(event.clientX, event.clientY), CircuitCanvasElement);

    if (movingComponentPoint != null && movingComponentPoint != "")
    {
        console.log(movingComponentPoint);
        if (!running) {
            FindNodes();
            RemoveWires();
        }
        Update();
    }
}

//Input Functions
function mousePressed(event) {
    mousePos = screenPointToCanvas(new Point(event.clientX, event.clientY), CircuitCanvasElement);

    if (editingComponentValue == true)
    {
        return;
    }

    if (drawMode != "") { //if drawMode != "", then on mousePressed we want to draw a new component, component type = drawMode
        selectedComponent = createNewComponent(drawMode);
        selectedComponent.startPos = worldRoundToGrid(mousePos); //set startPos and endPos
        selectedComponent.endPos = worldRoundToGrid(mousePos);
        components.push(selectedComponent); //add the new component (which is currently selected) to 'components' array
        movingComponentPoint = "end"; /*specify which end of the component we want to be moving. In this case, we place the startPos at the initial click
                                        and the endPos follows around the cursor until the mouse button is released  */
        selectedComponent.type = drawMode; /*and of course, how could I forget, we need to let the new component know what type of component it is 
                                            (wire, resistor, capacitor, voltagSource, or currentSource)*/
        if (selectedComponent.type == "capacitor" || selectedComponent.type == "inductor")
        {
            selectedComponent.voltage = 0;
            selectedComponent.current = 0;
        }
        if (drawMode == "ground") {
            selectedComponent.type = "voltageSource1n";
            selectedComponent.voltage = 0;
        }
        vectorMouseToEnd.x = 0;
        vectorMouseToEnd.y = 0;
        vectorMouseToStart.x = 0;
        vectorMouseToStart.y = 0;
    } else { //if drawMode == "", then we want to (potentially) move a component.
        
        //We need to search for the nearest component (in components), and check to see if it is within clickRange;
        var bestDist = clickRange;
        var dist = 100000000000;
        var pSelectedComponent = selectedComponent;
        selectedComponent = null;
        for (var i=0; i<components.length; i++)  //for each component...
        { 
            if (components[i].parentComponent != null) {continue;}
            dist = distToLine(components[i].startPos, components[i].endPos, mousePos); //Find the distance from the component to the mouse Position
            if (dist < bestDist) //If the dist is better (less than) the best Distance, we have found a winner! (the current best component)
            {
                bestDist = dist; 
                selectedComponent = components[i];

                //figure out which (start, mid, or end) point of selectedComponent we should move
                var midPoint = findMidpoint(components[i].startPos, components[i].endPos);
                var dS = distBetweenPoints(components[i].startPos, mousePos);
                var dM = distBetweenPoints(midPoint, mousePos);
                var dE = distBetweenPoints(components[i].endPos, mousePos);
                if (dS < gridSize) 
                {
                    vectorMouseToStart = getVector(mousePos,components[i].startPos);
                    movingComponentPoint = "start"; 
                } else if (dE < gridSize) {
                    vectorMouseToEnd = getVector(mousePos,components[i].endPos);
                    movingComponentPoint = "end";
                } else {
                    vectorMouseToStart = getVector(mousePos,components[i].startPos);
                    vectorMouseToEnd = getVector(mousePos,components[i].endPos);
                    movingComponentPoint = "mid"; 
                }
            }
            /*dist = distBetweenPoints(mousePos, components[i].startPos);
            if (dist < bestDist) { bestDist = dist; movingComponentPoint = "start"; selectedComponent = components[i];}
            dist = distBetweenPoints(mousePos, components[i].endPos);
            if (dist < bestDist) { bestDist = dist; movingComponentPoint = "end"; selectedComponent = components[i];}*/
        }

        //Toggling the switch
        if (selectedComponent != null && selectedComponent.type == "switch" && pSelectedComponent == selectedComponent)
        {
            if (selectedComponent.GetValue() == 1) {
                selectedComponent.SetValue(0);
            } else {
                selectedComponent.SetValue(1);
            }
        }

        //Check if we are selecting a plot!
        for (var i=0; i<plotManager.plots.length; i++)
        {
            var plot = plotManager.plots[i];
            //if within plot...
            if (mousePos.x > plot.pos.x && mousePos.x < plot.pos.x + plot.width && mousePos.y > plot.pos.y && mousePos.y < plot.pos.y + plot.height )
            {
                selectedComponent = plot.component;
                break;
            }
        }
    }
}
function mouseReleased() {
    //console.log("MOUSE_UP");
    movingComponentPoint = "";
}
function keyPressed(event) {
    var keyCode = event.key;
    //console.log("Key Presed:\""+keyCode+"\"");

    if (editingComponentValue == true && (keyCode == "Escape" || keyCode == "Enter")) //when we're done editing a component's value
    {
        editingComponentValue = false;
        numInputs = selectedComponent.GetInputs().length;
        var arr = [];
        for (var i=0; i<numInputs; i++) {

            if (selectedComponent.type == 'text')
            {

                arr.push(GridInputElements[i].value);
                continue;
            }

            //Parse string value from GridInputElement
            var output = parseStringValue( GridInputElements[i].value );
            if ((output != null && isNaN(Number(output)) == false))
            {
                arr.push(Number(output));
            } else {
                console.error("Failed to parse input   ( in keyPressed(event) )");
                return;
            }
        }
        selectedComponent.SetValues(arr);

        //Now, deselect the grid elements.
        for (var i=0; i<numInputs; i++)
        {
            GridInputElements[i].blur();
        }
        this.blur();
        return;
    }
    
    if (editingComponentValue == true) {
        return;
    }


    switch (keyCode) {
        case "Escape":
            drawMode = "";
            selectedComponent = null;
            break;
        case "Backspace":
            deleteComponent(selectedComponent);
            selectedComponent = null;
            shouldUpdateNodes = true;
            break;
        case "Delete":
            components = [];
            nodes = [];
            shouldUpdateNodes = true;
            break;
        case "Shift":
            shiftIsDown = true;
            break;
        case "Control":
            controlIsDown = true;
            break;
        case "p":
            PrintCircuit();
            break;
        case "L":
            //LoadCircuit("voltageSource2n 0 5 260 320 260 200 resistor 1 1000 260 200 400 200 resistor 2 1000 400 200 400 320 wire 3 _ 400 320 260 320 resistor 4 1000 400 200 540 200 wire 6 _ 540 320 400 320 currentSource 5 0.001 540 320 540 200 resistor 7 1000 540 200 640 200 resistor 8 1000 640 200 640 320 wire 9 _ 640 320 540 320 voltageSource2n 10 5 640 200 740 200 resistor 11 1000 740 200 740 320 wire 12 _ 740 320 640 320 voltageSource1n 13 0 260 320 260 360");
            //LoadCircuit("wire 347686 400 240 401 241 wire 938539 400 200 401 201 voltageSource1n 841538 500 220 450 220 Voltage -9.516000000000062V Freqeuncy 0Hz opamp 738254 400 220 500 220 Max Voltage 10V Min Voltage -10V Slew Rate (per uS) 1uV wire 231831 400 200 400 140 resistor 173223 400 140 500 140 Resistance 1000Ω wire 187158 500 140 500 220 wire 744532 400 240 400 280 resistor 645204 400 280 500 280 Resistance 1000Ω wire 468260 500 280 500 220 resistor 482420 400 280 400 340 Resistance 1000Ω voltageSource1n 402846 400 340 400 360 Voltage 0V Freqeuncy 0Hz capacitor 410889 320 200 400 200 Capacitance 50nF voltageSource1n 429836 320 200 320 240 Voltage 0V Freqeuncy 0Hz wire 339579 500 220 560 220 plot 339579");
            LoadCircuit("voltageSource2n 571646 320 260 320 160 5V 0Hz resistor 811385 320 160 400 160 1000Ω capacitor 596668 400 160 400 260 1uF wire 803844 400 260 320 260 voltageSource1n 190279 320 260 320 300 0V 0Hz plot 596668");
            shouldUpdateNodes = true;
            break;
        case 't': drawMode = "text"; break;
        case "w": drawMode = "wire"; break;
        case "r": drawMode = "resistor"; break;
        case "s": drawMode = "switch"; break;
        case "c": drawMode = "capacitor"; break;
        case "l": drawMode = "inductor"; break;
        case "v": drawMode = "voltageSource2n"; break;
        case "V": drawMode = "voltageSource1n"; break;
        case "g": drawMode = "ground"; break;
        case "i": drawMode = "currentSource"; break;
        case "f": drawMode = "freqSweep"; break;
        case "a": drawMode = "opamp"; break;
        case "d": drawMode = "diode"; break;
        case "z": drawMode = "zenerDiode"; break;
        case "<": 
            var plot = plotManager.GetPlotOfComponent(selectedComponent);
            if (plot != null)
            {
                plot.IncreaseHorizontalScale();
            }
            break;
        case ">": 
            var plot = plotManager.GetPlotOfComponent(selectedComponent);
            if (plot != null)
            {
                plot.DecreaseHorizontalScale();
            }
        break;
    }
    DrawModeElement.innerHTML = "Draw Mode: " + drawMode;
}
function keyReleased() {
    if (keyCode == SHIFT) {
        shiftIsDown = false;
    } else if (keyCode == CONTROL) {
        controlIsDown = false;
    }
}
function valueInputTextClicked() {
    if (editingComponentValue == false)
    {
        ValueInputTextElement.value = formatValue( selectedComponent.GetValue(),selectedComponent.GetStringSuffix());
        editingComponentValue = true;
    }
}
function simulationSpeedSliderChanged()
{
    //Range from 1 to 1000
    var val = Number(SimulationSpeedSliderElement.value);
    val = (31 - val);
    val = val*val;
    val = Math.max(val, 1);
    val = Math.min(val, 1000);
    //now val = value between 1 and 1000
    
    //remove old update interval and add new one!
    console.log("Calc Interval = "+val+"ms");
    clearInterval(calcUpdateInterval);
    calcUpdateInterval = setInterval(Calculate, val );
}
function simulationTimeStepChanged()
{
    var ts = parseStringValue(document.getElementById('timeStepTextbox').value);
    if (ts != null && isNaN(ts) == false && ts < 1 && ts >= 0.000000001)
    {
        timeStep = ts;
        ResetButtonClick();
    } else {
        console.error("invalid timestep.")
    }
    document.getElementById('timeStepTextbox').value = formatValue(timeStep, 'S');

}
function AddPlotButtonClick()
{
    if (selectedComponent != null)
    {
        //var MYNEWPLOT = new Plot(selectedComponent);
        //plotManager.AddPlot(MYNEWPLOT);
        plotManager.AddPlotOfComponent(selectedComponent);
    }
}
function RemovePlotButtonClick()
{
    if (selectedComponent != null)
    {
        plotManager.RemovePlotOfComponent(selectedComponent);
    }
}
function IncreasePlotScaleButtonClick()
{
    var plot = plotManager.GetPlotOfComponent(selectedComponent);
    if (plot == null) { return; }
    plot.IncreaseHorizontalScale();
}
function DecreasePlotScaleButtonClick()
{
    var plot = plotManager.GetPlotOfComponent(selectedComponent);
    if (plot == null) { return; }
    plot.DecreaseHorizontalScale();
}
function ComponentButtonClicked(element)
{
    drawMode = (element.id);
}

function StartStopButtonClick()
{
    if (running)
    {
        running = false;
        StartStopButtonElement.innerHTML = "Run Simulation";
        StartStopButtonElement.setAttribute("style", "background-color: red;");
    } else {
        running = true;
        StartStopButtonElement.innerHTML = "Stop Simulation";
        StartStopButtonElement.setAttribute("style", "background-color: green;");
    }
}
function ResetButtonClick() {
    for(var i=0; i<components.length; i++)
    {
        var c = components[i];
        c.voltageData = new Array(20000);
        c.currentData = new Array(20000);
        if (c instanceof VoltageSource1n == true || c instanceof VoltageSource2n == true || c instanceof CurrentSource == true)
        {
            continue;
        }
        if (c instanceof FrequencySweep)
        {
            c.currentFreq = c.startFreq;
            c.time = 0;
        }
        c.voltage = 0;
        c.current = 0;
    }
    currentTime = 0;
    console.log("Reset");
}



function setup() {
    InitExampleCircuits();

    width = window.innerWidth*19/20;
    height = window.innerHeight-100;
    plotManager = new PlotManager(width, height);
    resizeWindow();
    painter = new Painter(CircuitCanvasElement);
    simulationSpeedSliderChanged();


    document.getElementById('timeStepTextbox').value = formatValue(timeStep, 'S');

    //Calculate();
    //Update();
    //Calculate();
    //Update();
    //canvas = createCanvas(width, height);
    //canvas.parent('simulator');
    //LoadCircuit("resistor 0 1000 300 200 440 200 voltageSource2n 1 5 300 300 300 200 voltageSource1n 2 0 300 300 300 340 wire 3 _ 300 300 440 300 resistor 4 1000 440 300 440 200");
    //LoadCircuit("resistor 0 1 300 200 440 200 voltageSource2n 1 5 180 300 180 200 voltageSource1n 2 0 300 300 300 340 wire 3 _ 300 300 440 300 wire 5 _ 180 300 300 300 inductor 6 0.001 300 300 300 200 capacitor 4 0.000001 440 300 440 200 resistor 7 10 300 200 180 200");
    //LoadCircuit("resistor 0 1 900 280 1040 280 voltageSource2n 1 5 660 380 660 280 voltageSource1n 2 0 900 380 900 420 wire 3 _ 900 380 1040 380 wire 5 _ 660 380 900 380 inductor 6 0.001 900 380 900 280 capacitor 4 0.000001 1040 380 1040 280 resistor 7 10 900 280 780 280 switch 8 0 660 280 780 280");
    //LoadCircuit("resistor 0 1 740 280 880 280 voltageSource2n 1 5 500 380 500 280 voltageSource1n 2 0 740 380 740 420 wire 3 _ 740 380 880 380 wire 5 _ 500 380 740 380 inductor 6 0.001 740 380 740 280 capacitor 4 0.000001 880 380 880 280 resistor 7 10 740 280 620 280 switch 8 0 500 280 620 280 plot 1 _ _ _ _ _ plot 6 _ _ _ _ _ plot 4 _ _ _ _ _");
    //LoadCircuit("wire 916408 440 240 441 241 wire 557081 440 200 441 201 voltageSource1n 70008 580 220 510 220 10V 0Hz opamp 396956 440 220 580 220 10V -10V 1uV wire 132086 580 220 580 140 resistor 988489 580 140 440 140 1000Ω wire 314383 440 140 440 200 wire 743209 440 240 440 280 resistor 818196 440 280 580 280 1000Ω wire 140290 580 280 580 220 resistor 803248 440 280 440 360 1000Ω voltageSource1n 381550 440 360 440 380 0V 0Hz capacitor 290379 320 200 440 200 50nF voltageSource1n 666579 320 200 320 240 0V 0Hz wire 126540 580 220 680 220 resistor 513448 680 220 680 300 1000Ω voltageSource1n 758880 680 300 680 320 0V 0Hz plot 513448");
    //LoadCircuit("opamp 396956 440 220 580 220 10V -10V 1uV wire 132086 580 220 580 140 resistor 988489 580 140 440 140 1000Ω wire 314383 440 140 440 200 wire 743209 440 240 440 280 resistor 818196 440 280 580 280 1000Ω wire 140290 580 280 580 220 resistor 803248 440 280 440 360 1000Ω voltageSource1n 381550 440 360 440 380 0V 0Hz capacitor 290379 320 200 440 200 50nF voltageSource1n 666579 320 200 320 240 0V 0Hz wire 126540 580 220 680 220 resistor 513448 680 220 680 300 1000Ω voltageSource1n 758880 680 300 680 320 0V 0Hz plot 513448");
    //LoadCircuit("opamp 396956 440 220 580 220 10V -10V 1uV wire 132086 580 220 580 140 resistor 988489 580 140 440 140 1000Ω wire 314383 440 140 440 200 wire 743209 440 240 440 280 resistor 818196 440 280 580 280 1000Ω wire 140290 580 280 580 220 resistor 803248 440 280 440 360 1000Ω voltageSource1n 381550 440 360 440 380 0V 0Hz capacitor 290379 320 200 440 200 50nF voltageSource1n 666579 320 200 320 240 0V 0Hz wire 126540 580 220 680 220 resistor 513448 680 220 680 300 1000Ω voltageSource1n 758880 680 300 680 320 0V 0Hz plot 513448");
    //LoadCircuit("opamp 396956 440 220 580 220 10V -10V 1uV wire 132086 580 220 580 140 resistor 988489 580 140 440 140 1000Ω wire 314383 440 140 440 200 wire 743209 440 240 440 280 resistor 818196 440 280 580 280 1000Ω wire 140290 580 280 580 220 resistor 803248 440 280 440 360 1000Ω voltageSource1n 381550 440 360 440 380 0V 0Hz capacitor 290379 320 200 440 200 50nF voltageSource1n 666579 320 200 320 240 0V 0Hz wire 126540 580 220 680 220 resistor 513448 680 220 680 300 1000Ω voltageSource1n 758880 680 300 680 320 0V 0Hz resistor 563550 440 140 320 140 100kΩ voltageSource1n 790272 320 140 320 100 1V 0Hz plot 513448");
    //LoadCircuit("996022 200 260 200 100 -15V 0Hz resistor 948196 200 100 320 180 1000Ω diode 486492 320 180 200 260 700mV 10V voltageSource1n 17767 200 260 200 320 0V 0Hz");
    //LoadCircuit("voltageSource2n 574829 400 240 400 100 15V 5kHz resistor 168808 400 100 540 100 1000Ω diode 296754 540 100 540 240 700mV 1000MV wire 924756 540 240 400 240 zenerDiode 267851 660 40 660 240 700mV 10V wire 780386 660 240 540 240 wire 711496 400 100 400 40 resistor 73992 400 40 660 40 1000Ω voltageSource1n 246326 400 240 400 300 0V 0Hz plot 574829 plot 296754 plot 267851");
    var dropdownElement = document.getElementById("exampleCircuitDropDown");
    dropdownElement.value = "RLC circuit example";
    ChangeExampleCircuit();
}
window.onresize = resizeWindow();

function resizeWindow() {
    width = window.innerWidth-40;
    height = window.innerHeight*6/8;
    //canvas.resize(width,height);
    plotManager.screenWidth = width;
    plotManager.screenHeight = height;

    CircuitCanvasElement.setAttribute("style", 'width:'+width+"px; height:"+height+"px;margin:auto;");
    CircuitCanvasElement.width = width;
    CircuitCanvasElement.height = height;
}



function GridInputClicked(element)
{
    console.log("Clicked: " + element);
    if (editingComponentValue == false)
    {
        editingComponentValue = true;

    }
}





function Update() {
    //move the endpoint, the startpoint, or the entirety of the selected component     //THIS IF STATEMENT SHOULD BE PUT SOMEWHERE ELSE PROBABLY
    //console.log("movingComp: " + movingComponentPoint + "   selectedComp: " + selectedComponent);
    if (movingComponentPoint == "end" && selectedComponent != null) 
    {
        selectedComponent.endPos = worldRoundToGrid(mousePos.copy().add(vectorMouseToEnd)); //move endPos
        shouldUpdateNodes = true;
    } else if (movingComponentPoint == "start" && selectedComponent != null) 
    {
        selectedComponent.startPos = worldRoundToGrid(mousePos.copy().add(vectorMouseToStart)); //move startPos
        shouldUpdateNodes = true;
    } else if (movingComponentPoint == "mid" && selectedComponent != null) //move entire component ( translate )
    {
        selectedComponent.startPos = worldRoundToGrid(mousePos.copy().add(vectorMouseToStart));
        selectedComponent.endPos = worldRoundToGrid(mousePos.copy().add(vectorMouseToEnd));
        shouldUpdateNodes = true;
    } else if (selectedComponent != null){
        if (selectedComponent.startPos.equals(selectedComponent.endPos))
        {
            deleteComponent(selectedComponent);
            shouldUpdateNodes = true;
        }
    }

    UpdateDisplay(painter); //this updates the entire display (in graphics file)
    plotManager.Draw(painter);
}



function PrintCircuit() {
    /*
    var s = "";
    for(var i=0; i<components.length; i++)
    {
        s += components[i].GetEncodedDataString();
    }
    for (var i=0; i<plotManager.plots.length; i++)
    {
        s += plotManager.plots[i].GetEncodedDataString();
    }
    console.log(s);
    return s;*/
    var s = "";
    var c;
    for(var i=0; i<components.length; i++)
    {
        c = components[i];
        if (c.parentComponent != null) { continue; }
        s += c.type + " " + c.name + " " + c.startPos.x + " "+c.startPos.y+" "+c.endPos.x+" "+c.endPos.y+" ";
        var L = components[i].GetInputs();
        for (var j=0; j<L.length; j++)
        {
            s +=  L[j][1] + " ";
        }
    }
    for (var i=0; i<plotManager.plots.length; i++)
    {
        s += "plot " + plotManager.plots[i].component.name + " ";
    }
    console.log(s);
    return s;
}
/*This function takes a string and generates the components.
*   It is used at start to load the initial circuit, and whenever we want to load a saved circuit
*   See PrintCircuit() and component.GetString() to see more about the format: "TYPE NAME VALUE START.X START.Y END.X END.Y". 
*/
function LoadCircuit(dataString) {
    var data = dataString.split(" ");
    components = [];
    nodes = [];
    points = [];
    nodesNotCombined = [];
    selectedComponent = null;
    plotManager.plots = [];

    var itr = 0;
    while ( itr < data.length)
    {
        var compType = data[itr];
        itr += 1;
        var c = createNewComponent(compType);
        if (c != null)
        {
            c.name = data[itr];
            itr += 1;
            c.startPos.x = Math.round(Number(data[itr]));
            itr += 1;
            c.startPos.y = Math.round(Number(data[itr]));
            itr += 1;
            c.endPos.x = Math.round(Number(data[itr]));
            itr += 1;
            c.endPos.y = Math.round(Number(data[itr]));
            itr += 1;
            var len = c.GetInputs().length;
            var args = []
            for (var i = 0; i<len; i++)
            {
                args.push( parseStringValue(data[itr]) );
                itr += 1;
            }
            c.SetValues(args);
            if (c instanceof Capacitor) { c.voltage = 0.01; }
            components.push(c);
            selectedComponent = c;
        }
        else if (compType == "plot")
        {
            for (var i=0; i<components.length; i++)
            {
                if (data[itr] == components[i].name)
                {
                    plotManager.AddPlot( new Plot( components[i] ) );
                    break;
                }
            }
            itr += 1;
        }
    }
    shouldUpdateNodes = true;
    CenterCircuit();
    FindNodes();
    for (var i=0; i<components.length; i++)
    {
        console.log("UPDATE");
        //components[i].RecordData();
        //components[i].Update();
        //components[i].RecordData();
    }
    CenterCircuit();
    FindNodes();
    selectedComponent = null;
}
function LoadCircuit_OLD(dataString) {
    /* inputs data in the form "TYPE NAME VALUE startPos.x startPos.y endPos.x endPos.y" */
    //Start by splitting the dataString by spaces
    var dataArray = dataString.split(" "); 
    components = [];
    nodes = [];
    selectedComponent = null;

    if (dataArray.length % 7 != 0)  //We know the dataArray should be a multiple of 7 in length because of the format (see desc. above)
    {
        console.error("Error: Cannot load data in Load function because the number of terms in the input string is incorrect (not mod 7 = 0)");
        return;
    }
    
    var numComponents = dataArray.length/7;
    var type;
    var numComponents = dataArray.length/7;
    var c;
    for (var i=0; i<numComponents; i++)
    {
        type = dataArray[i*7+0];
        if (type == 'wire')
        {
            c = new Wire();
        } else if (type == 'resistor') {
            c = new Resistor();
        } else if (type == 'switch') {
            c = new Switch();
        } else if (type == 'capacitor') {
            c = new Capacitor();
        } else if (type == 'inductor') {
            c = new Inductor();
        } else if (type == 'voltageSource2n') {
            c = new VoltageSource2n();
        } else if (type == 'voltageSource1n') {
            c = new VoltageSource1n();
        } else if (type == 'currentSource') {
            c = new CurrentSource();
        } else if (type == 'plot') {
            for (var j=0; j<components.length; j++)
            {
                if (components[j].name == Number(dataArray[i*7+1]))
                {
                    plotManager.AddPlot(new Plot(components[j]));
                    break;
                }
            }
            continue;
        }
        
        c.name = Number(dataArray[i*7+1]);
        c.SetValue(Number(dataArray[i*7+2]));
        c.startPos = new Point(Number(dataArray[i*7+3]),Number(dataArray[i*7+4]));
        c.endPos = new Point(Number(dataArray[i*7+5]),Number(dataArray[i*7+6]));
        components.push(c);
    }
    
    CenterCircuit(); //Center the circuit to 
}
//Centers the circuit to the center of the screen
function CenterCircuit()
{
    resizeWindow();
    //now, lets center the circuit to the best of our ability!
    var maxPoint = new Point(0,0); //arbitrary small point (upper left corner of screen)
    var minPoint = new Point(100000,100000); //arbitrary large point (lower right in screen)
    for (var i=0; i<components.length; i++)
    {
        if (components[i].parentComponent != null) { continue;}
        maxPoint.x = Math.max( components[i].startPos.x, components[i].endPos.x, maxPoint.x );
        minPoint.x = Math.min( components[i].startPos.x, components[i].endPos.x, minPoint.x );
        
        maxPoint.y = Math.max( components[i].startPos.y, components[i].endPos.y, maxPoint.y );
        minPoint.y = Math.min( components[i].startPos.y, components[i].endPos.y, minPoint.y );
    }
    
    var curCenter = worldRoundToGrid(new Point((maxPoint.x+minPoint.x)/2, (maxPoint.y+minPoint.y)/2));
    var h;
    if (plotManager.plots.length != 0)
    {
        h = height-plotManager.plotHeight;
    } else {
        h = height;
    }
    var wantedCenter = worldRoundToGrid(new Point(width/2, h/2));
    var diff = new Point(curCenter.x-wantedCenter.x, curCenter.y-wantedCenter.y);
    for (var i=0; i<components.length; i++)
    {
        components[i].startPos.x -= diff.x;
        components[i].endPos.x -= diff.x;
        components[i].startPos.y -= diff.y;
        components[i].endPos.y -= diff.y;
    }
    shouldUpdateNodes = true;
}




//Call this to calculate the entire circuit.   When calling this, ignore the numCalcOn
function Calculate( numCalcOn ) {
    
    
    //If we're not running, just update the nodes and continue.
    if (!running)
    {
        if (shouldUpdateNodes == true)
        {
            FindNodes();
            RemoveWires();
            shouldUpdateNodes = false; 
        } else {
            shouldUpdateNodes = true;
        }
        return;
    }

    
    if (numCalcOn == null)
    {
        numCalcOn = 0;
        //Recording data!
        for (var i=0; i<components.length; i++)
        {
            components[i].RecordData();
        }
    } else if (numCalcOn > calcCyclesPerCall)
    {
        return;
    }

    currentTime += timeStep;
    
    //Update each componet ( important for capacitors and such )
    for (var i=0; i<components.length; i++)
    {
        components[i].Update(currentTime, timeStep);
    }
    
    //Check to see if we need to do the pathfinding and recreate all of the nodes or not
    if (shouldUpdateNodes == true) {
        FindNodes();
        RemoveWires();
        shouldUpdateNodes = false;
    } else {
        ResetNodes();   //if we don't recreate them, we have to reset a few parameters
    }

    MakeMatrices();
    if (debugCalculate == true) {console.log("initial Matrices:"); PrintMatrices(matrixA, matrixB);}
    try {
    ApplyVoltageSources();
    } catch (error) {
        if (error instanceof TypeError)
        {
            console.log("Type error in Apply Voltage Sources - Centering Circuit and breaking out of Calculate()");
            //CenterCircuit();
            return;
        }
    }
    if (debugCalculate == true) {console.log("After applying Voltage Sources:");PrintMatrices(matrixA, matrixB);}
    UpdateMatrices();
    if (debugCalculate == true) {console.log("After Updating.. : ");PrintMatrices(matrixA, matrixB);}
    CheckVoltageSources();
    GaussianElimination(matrixA, matrixB);
    if (debugCalculate == true) {console.log("\n\n\n\nGaussianElimination:");PrintMatrices(matrixA, matrixB);}


    CheckForSingleRow(matrixA,matrixB);

    CheckVoltageSources();

    CalcCurrents();

    Calculate(numCalcOn + 1);
}


//Finds all of the nodes
function FindNodes() {
    //Start by removing all old nodes and data
    if (components.length == 0) { return; }
    for(var i=0; i<components.length; i++)
    {
        components[i].startNode = null;
        components[i].endNode = null;
    }

    //now find all of the intersections between components
    points = [];
    nodes = [];
    var comp;
    var node;

    for(var i=0; i<components.length; i++)
    {
        if (components[i].type == 'opamp' || components[i].type == 'diode' || components[i].type == 'text') {
            continue;
        } else if (components[i].startPos.equals(components[i].endPos))
        {
            //console.log("startPos == endPos. returning...   comp="+ components[i].type+" "+components[i].name);
            continue;
        }
        //This component is made up of many other components, so we don't actually need this one's start and end positions.
        comp = components[i];

        //If the point is not in the list,
        if (isPointInList(points, comp.startPos) == false)
        {   //Make a new node! We haven't seen it before!
            points.push(comp.startPos);
            node = new Node();
            node.name = getNewNodeName();
            node.points.push(comp.startPos);
            node.startComponents.push(comp);
            comp.startNode = node;
            nodes.push(node);
        } else {
            //Node already exists, so lets find it... then, link the component to the node and vice versa
            for (var j=0; j<nodes.length; j++)
            {
                if (isPointInList(nodes[j].points, comp.startPos))
                {
                    node = nodes[j];
                    //node.points.push(comp.startPos);
                    node.startComponents.push(comp);
                    comp.startNode = node;
                    break;
                }
            }
        }


        if (isPointInList(points, comp.endPos) == false && comp.type != "voltageSource1n")  //but ignore the endNode for voltageSource1n components
        {
            points.push(comp.endPos);

            node = new Node();
            node.name = getNewNodeName();

            node.points.push(comp.endPos);
            node.endComponents.push(comp);
            comp.endNode = node;
            nodes.push(node);
        } else if (comp.type != "voltageSource1n") {
            //Node already exists, so lets find it... then, link the component to the node and vice versa
            for (var j=0; j<nodes.length; j++)
            {
                if (isPointInList(nodes[j].points, comp.endPos))
                {
                    node = nodes[j];
                    //node.points.push(comp.endPos);
                    node.endComponents.push(comp);
                    comp.endNode = node;
                    break;
                }
            }
        }
    }


    //saving a copy of the nodes (duplicating them and storing them in nodesNotCombined)
    nodesNotCombined = [];
    for (var i=0; i<nodes.length; i++)
    {
        var node = new Node();
        for (var j=0; j<nodes[i].startComponents.length; j++)
        {
            node.startComponents.push(nodes[i].startComponents[j]);
        }
        for (var j=0; j<nodes[i].endComponents.length; j++)
        {
            node.endComponents.push(nodes[i].endComponents[j]);
        }
        nodesNotCombined.push(node);
    }

    //Finally, combine all nodes which are between wire components.
    for (var i=0; i<components.length; i++) 
    {
        if (components[i].type == "wire" || (components[i].type == "switch" && components[i].GetValue() == 1))
        {
            if (combineNodes(components[i].startNode, components[i].endNode) == null)
            {
                console.error("    comp: " + components[i].type + "  " + components[i].name);
            }
        }
    }


    //Rename nodes so they're all named 0 though nodes.length-1
    for (var i=0; i<nodes.length; i++)
    {
        /*
        var isInternalNode = true; //internal as in inside a component and should be hidden
        for (var j=0; j<nodes[i].startComponents.length; j++)
        {
            if (nodes[i].startComponents[j].parentComponent == null)
            {
                isInternalNode = false;
                break;
            }
        }
        if (isInternalNode)
        {
            for (var j=0; j<nodes[i].endComponents.length; j++)
            {
                if (nodes[i].endComponents[j].parentComponent == null)
                {
                    isInternalNode = false;
                    break;
                }
            }
        }
        if (isInternalNode && nodes[i].startComponents.length + nodes[i].endComponents.length > 1)
        {
            nodes[i].name = i;
            nodes[i].drawGraphics = false;
        } else {
            nodes[i].name = i;
        }*/
        nodes[i].name = i;
    }

    //console.log("nodes: " + nodes);
}

//removes all wire components from nodes list
function RemoveWires() {
    //Removing all wires from each node
    for (var i=0; i<nodes.length; i++)
    {
        var newStartComponents = [];
        var newEndComponents = [];
        for (var j=0; j<nodes[i].startComponents.length; j++)
        {
            if (nodes[i].startComponents[j].type != "wire" && !(nodes[i].startComponents[j].type == "switch" && nodes[i].startComponents[j].GetValue() == 1))
            {
                newStartComponents.push( nodes[i].startComponents[j] );
            }
        }
        for (var j=0; j<nodes[i].endComponents.length; j++)
        {
            if (nodes[i].endComponents[j].type != "wire" && !(nodes[i].endComponents[j].type == "switch" && nodes[i].endComponents[j].GetValue() == 1))
            {
                newEndComponents.push( nodes[i].endComponents[j] );
            }
        }
        nodes[i].startComponents = newStartComponents;
        nodes[i].endComponents = newEndComponents;
    }
}

//Resets each node to default while keeping linked components
function ResetNodes() {
    /*
    this.name = -1; //give it a unique name (at some point)
    this.points = []; //different coordinates where this node exists
    this.startComponents = []; //components which start at this node
    this.endComponents = []; //components which end at this node
    this.voltage = null;

    this.forwardingAddress = -1; //has this node already been reduced? If so, leave a forwarding address for the other node.
    this.forwardingVoltage = 0;

    this.visited = false;
    this.currentOut = 0;
    this.numCurrentsOut = 0;*/
    for (var i=0; i<nodes.length; i++)
    {
        nodes[i].voltage = null;
        nodes[i].visited = false;
        nodes[i].currentOut = 0;
        nodes[i].numCurrentsOut = 0;
        nodes[i].forwardingAddress = -1; 
        nodes[i].forwardingVoltage = 0;
    }
}

//Creates New Matrices
function MakeMatrices() {
    //initialize matrixA and matrixB. We will be solving using the Ax=B form
    matrixA = [];
    matrixB = [];
    var row = [];
    for (var i=0; i<nodes.length; i++)
    {
        row = [];
        for (var j=0; j<nodes.length; j++)
        {
            row.push(0);
        }
        matrixA.push(row);
        matrixB.push(0);
    }

    //Now, lets populate the matrix with resistor and current variables!
    var node;
    for(var i=0; i<nodes.length; i++) { //for each node
        node = nodes[i];
        //console.log(node.name);
    
        for (var j=0; j<node.startComponents.length; j++) //for each startComponent in node[i]
        {
            if (node.startComponents[j].type == "wire" || node.startComponents[j].type == "switch") {
                //if it's a wire, do nothing.
            } else if (node.startComponents[j].type == "resistor") {
                matrixA[node.name][node.startComponents[j].endNode.name] -= 1/node.startComponents[j].resistance;
                matrixA[node.name][node.name] += 1/node.startComponents[j].resistance;
            } else if (node.startComponents[j].type == "currentSource" || node.startComponents[j].type == "inductor") {
                matrixB[node.name] -= node.startComponents[j].current;
            }
            //console.log(node.startComponents[j].type);
        }

        for (var j=0; j<node.endComponents.length; j++) //for each endComponent in node[i]
        {
            if (node.endComponents[j].type == "wire" || node.endComponents[j].type == "switch") {
                //if it's a wire, do nothing.
            } else if (node.endComponents[j].type == "resistor") {
                matrixA[node.name][node.endComponents[j].startNode.name] -= 1/node.endComponents[j].resistance;
                matrixA[node.name][node.name] += 1/node.endComponents[j].resistance;
            } else if (node.endComponents[j].type == "currentSource" || node.endComponents[j].type == "inductor") {
                matrixB[node.name] += node.endComponents[j].current;
            }
            //console.log(node.endComponents[j].type);
        }
    }
}

//A general refreshing function which 
function UpdateMatrices() {
    //This function checks through each node to see if it has a known voltage. If the node's voltage is known, then it is applied to the Matrices.
    for (var i=0; i<nodes.length; i++)
    {
        if (nodes[i].voltage != null) //if the voltage is NOT null
        {
            matrixB[i] = 0; 
            for (var j=0; j<nodes.length; j++)
            {
                matrixA[i][j] = 0; //clear the row
                matrixB[j] -= matrixA[j][i]*nodes[i].voltage; //apply the voltage to all other rows 
                matrixA[j][i] = 0; //clear column
            }
        }
    }
}


function UpdateMatricesSpecific(node) {
    //This function checks through each node to see if it has a known voltage. If the node's voltage is known, then it is applied to the Matrices.
    var i = node.name;
    matrixB[i] = 0; 
    for (var j=0; j<nodes.length; j++)
    {
        matrixA[i][j] = 0; //clear the row
        matrixB[j] -= matrixA[j][i]*nodes[i].voltage; //apply the voltage to all other rows 
        matrixA[j][i] = 0; //clear column
    }
}

//apply voltage sources to the matrices
function ApplyVoltageSources() {

    //Apply all constants / single node voltage components
    for (var i=0; i<components.length; i++)
    {
        if (components[i].type == "voltageSource1n")
        {
            if (components[i].startNode != null)
            {
                components[i].startNode.voltage = components[i].voltage;
                UpdateMatricesSpecific(components[i].startNode);
            } else {
                //console.error("voltageSource1n  -  startNode is null  comp.name="+components[i].name);
            }
        }
    }

    //Now, Keep applying 2n voltage components until we're gotten all of them.
    var foundAnother = true;
    while (foundAnother == true)
    {
        foundAnother = false;
        for (var i=0; i<components.length; i++) {
            if (components[i].enabled == true && ( components[i].type == "voltageSource2n" || components[i].type == "capacitor" || components[i].type == "freqSweep")) //if the component is a voltage source
            {
                if (components[i].startNode.voltage != null && components[i].endNode.voltage == null) //if the startNode voltage is known and endNode is not known
                {
                    //If the startNode is known, (the neg side of the voltage source), then we KNOW the endNode voltage. Let's apply it to the matrices.
                    components[i].endNode.voltage = components[i].startNode.voltage + components[i].voltage;
                    foundAnother = true;
                } else if (components[i].endNode.voltage != null && components[i].startNode.voltage == null) //if the endNode voltage is known and the startNode is not known.
                {
                    //If the endNode is known, (the pos side of the voltage source), then we KNOW the startNode voltage. Let's apply it to the matrices.
                    components[i].startNode.voltage = components[i].endNode.voltage - components[i].voltage;
                    foundAnother = true;
                }
            }
        }
    }

    for (var i = 0; i < components.length; i++) //for each component
    {
        if (components[i].enabled == true && ( components[i].type == "voltageSource2n" || components[i].type == "capacitor" || components[i].type == "freqSweep")) //if the component is a voltage source
        {
            if (components[i].startNode.voltage == null && components[i].endNode.voltage == null) //If both nodes are unknown, reduce!
            {
                //ahh yes this is where the fuckery begins. I need to somehow reduce all of the connected voltage sources to this. Wish me luck
                //In this case, we can simplify the endNode (pos side).     endNode = startNode + voltage
                var comp = components[i];
                var startNode = comp.startNode;
                var endNode = comp.endNode;
                var voltage = comp.voltage;


                if (startNode.forwardingAddress != -1)
                {
                    voltage += startNode.forwardingVoltage;
                    startNode = nodes[startNode.forwardingAddress];
                }
                
                matrixB[startNode.name] += matrixB[endNode.name]; //add the b matrix endNode row to startNode row
                for (var j=0; j<nodes.length; j++) //add the a matrix endNode row to the startNode row
                {
                    matrixA[startNode.name][j] += matrixA[endNode.name][j]; //add endNode row to startNode.row
                    matrixA[endNode.name][j] = 0; //clear row
                }
                matrixA[endNode.name][endNode.name] = 1;
                matrixA[endNode.name][startNode.name] = -1;
                matrixB[endNode.name] = voltage;

                endNode.forwardingAddress = startNode.name;
                endNode.forwardingVoltage = voltage;
            }
        }
    }
    UpdateMatrices();
}


function CheckVoltageSources() {
    for (var i=0; i<components.length; i++)
    {
        if (components[i].enabled == true && ( components[i].type == "voltageSource2n" || components[i].type == "capacitor" || components[i].type == "freqSweep"))
        {
            if (components[i].startNode.voltage != null && components[i].endNode.voltage == null)
            {
                components[i].endNode.voltage = components[i].startNode.voltage + components[i].voltage;
                //console.log("setting node " + components[i].endNode.name + " to " + components[i].endNode.voltage + " volts.");
                CheckVoltageSources();
            } else if (components[i].startNode.voltage == null && components[i].endNode.voltage != null)
            {
                components[i].startNode.voltage = components[i].endNode.voltage - components[i].voltage;
                //console.log("setting node " + components[i].endNode.name + " to " + components[i].endNode.voltage + " volts.");
                CheckVoltageSources();
            } else if (components[i].startNode.voltage != null && components[i].endNode.voltage != null)
            {
                //console.log("Both nodes are known");
            }
        }
    }

}


function PrintMatrices(matA, matB) {
    var s = "";
    for (var row=0; row<matA.length; row++)
    {
        for (var col=0; col<matA.length; col++)
        {
            var cs = (Math.round(matA[row][col]*10000)/10000).toString();
            var l = cs.length;
            while (l < 8)
            {
                l += 1;
                s += " ";
            }
            s += cs;
        }
        s += "   |   " + (Math.round(matB[row]*10000)/10000).toString() + "\n";
    }
    s += "\n";
    console.log(s);
}


function GaussianElimination(matA, matB) {
    //start by making new matrices with only unknown nodes (without any blank rows and columns)
    var mA = [];
    var mB = [];
    mA = matA;
    mB = matB;

    //now  that we have matA and B, we can start the Gaussian Elimination
    var stop = false;
    for(var col=0; col<mA.length-1; col++)
    {
        for(var row=mA.length-1; row>col; row-=1)
        {
            if (debugGaussian == true ) {console.log("col: " + col + "   row: " + row);}
            

            if (mA[row][col] == 0) //check to make sure the value we're trying to remove isn't 0. If it is, just skip.
            {
                if (debugGaussian == true)
                {
                    console.log("mat[row:"+row+"][col:"+col+"] == 0. Skipping");
                }
                continue;
            }

            var row2 = -1;
            for (var i=row - 1; i >= 0; i -= 1) //Find the "row2,col" we're going to use to reduce "row,col"
            {
                if (mA[i][col] != 0)
                {
                    row2 = i;
                    break;
                }
            }

            if (row2 == - 1) //if we didn't find a row2, just skip. This means we cannot reduce/remove anymore items in the column
            {
                if (debugGaussian == true ){console.log("could not find a row2");}
                continue;
            }

            var coef = mA[row][col]/mA[row2][col]; //calculate the coef we will multiply row2 by to reduce row1
            for (var i=0; i<mA.length; i++) //apply the coef*row2 to row1.
            {
                mA[row][i] -= mA[row2][i]*coef;
            }
            mB[row] -= mB[row2]*coef; //whatever we do to matrixA we must also do to matrixB
            if (debugGaussian == true ){PrintMatrices(mA,mB);}
        }
        if (stop == true)
        {
            break;
        }
    }

}


function CheckForSingleRow(A,B) {
    var numInRow = 0;
    var rowIndex = -1;
    for(var i=0; i<A.length; i++) //for each row
    {
        numInRow = 0;
        rowIndex = -1;
        for (var j=0; j<A[i].length; j++) //for each in row
        {
            if (A[i][j] != 0)
            {
                numInRow += 1;
                rowIndex = j;
            }
        }
        if (numInRow == 1)
        {   

            nodes[rowIndex].voltage = B[i]/A[i][rowIndex];
            A[i][rowIndex] = 0;
            B[i] = 0;

            UpdateMatricesSpecific(nodes[rowIndex]);
            CheckForSingleRow(A,B);
            return true;
        }
    }
    return false;
}

function CalcCurrents() {
    //clear components we don't know
    for (var i=0; i<components.length; i++)
    {
        if (components[i].type != "inductor" && components[i].type != "currentSource")
        {
            components[i].current = null;
        }
    }

    //Reseting current in/out of each node
    for (var i=0; i<nodes.length; i++)
    {
        nodes[i].currentOut = 0;
        nodes[i].numCurrentsOut = 0;
    }

    //find resistor currents
    for (var i=0; i<components.length; i++)
    {
        if (components[i].type == "resistor") 
        {
            //The resistor current = voltage across the component divided by its resistance    I=V/R
            components[i].voltage = components[i].startNode.voltage - components[i].endNode.voltage;
            components[i].current = components[i].voltage/components[i].resistance;
            
            components[i].startNode.currentOut += components[i].current;
            components[i].startNode.numCurrentsOut += 1;
            components[i].endNode.currentOut -= components[i].current;
            components[i].endNode.numCurrentsOut += 1;
        } else if (components[i].type == "inductor")
        {
            //
            if (components[i].startNode == null || components[i].endNode == null || components[i].endNode.voltage == null || components[i].startNode.voltage == null) { 
                SimulationSpeedSliderElement.value = 0; 
                console.error("startN or endN or volt == null  sn:"+components[i].startNode.name+"  en:"+components[i].endNode.name+"  snv:"+components[i].startNode.voltage + "   env:"+components[i].endNode.voltage);
                StartStopButtonClick();
                //components[i].voltage = 0;
                //components[i].current = 0;
            } else if (components[i].startNode == components[i].endNode) {
                console.error("CalcCurrents() inductor endnode == startnode");
                components[i].voltage = 0;
            } else {
                components[i].voltage = Math.min( Math.max((components[i].startNode.voltage - components[i].endNode.voltage),-1000000000), 1000000000);
                components[i].current += timeStep * components[i].voltage/components[i].inductance;
            }
            
            components[i].startNode.currentOut += components[i].current;
            components[i].startNode.numCurrentsOut += 1;
            components[i].endNode.currentOut -= components[i].current;
            components[i].endNode.numCurrentsOut += 1;
        } else if (components[i].type == "currentSource")
        {
            if (components[i].startNode != null) {
                components[i].startNode.currentOut += components[i].current;
                components[i].startNode.numCurrentsOut += 1;
            }
            if (components[i].endNode != null) {
                components[i].endNode.currentOut -= components[i].current;
                components[i].endNode.numCurrentsOut += 1;
            }
        }
    }


    var foundAnother = true;
    while (foundAnother == true)
    { 
        foundAnother = false;
        /*
        for (var i=0; i<nodes.length; i++)
        {
            if (nodes[i].numCurrentsOut == nodes[i].startComponents.length + nodes[i].endComponents.length - 1)
            {
                //console.log("Node: " +nodes[i].name);
                for (var j=0; j<nodes[i].startComponents.length; j++)
                {
                    if (nodes[i].startComponents[j].current == null && nodes[i].startComponents[j].type != "wire")
                    {
                        nodes[i].startComponents[j].current = -nodes[i].currentOut;
                        foundAnother = true;
                        //console.log("Comp: " + nodes[i].startComponents[j].type +" "+nodes[i].startComponents[j].name + " current = " + nodes[i].startComponents[j].current);
                        break;
                    }
                }

                if (foundAnother == true)
                {
                    break;
                }
                
                for (var j=0; j<nodes[i].endComponents.length; j++)
                {
                    if (nodes[i].endComponents[j].current == null && nodes[i].endComponents[j].type != "wire")
                    {
                        nodes[i].endComponents[j].current = nodes[i].currentOut;
                        foundAnother = true;
                        //console.log("Comp: " + nodes[i].endComponents[j].type +" "+nodes[i].endComponents[j].name + " current = " + nodes[i].endComponents[j].current);

                        break;
                    }
                }

                if (foundAnother == true)
                {
                    break;
                }

            }
        }*/
        for (var i=0; i<nodesNotCombined.length; i++) //for each node
        {
            var node = nodesNotCombined[i];
            var currentOutOfNode = 0;
            var compsWithUnknownCurrent = [];
            var snOrEn = [];
            for (var j=0; j<node.startComponents.length; j++)
            {
                var comp = node.startComponents[j];
                //if (comp.type == "wire" || comp.type == "switch") { continue ; }
                if (comp.current == null)
                {
                    compsWithUnknownCurrent.push(comp);
                    snOrEn.push(0);
                    continue;
                }
                currentOutOfNode += comp.current;
            }
            for (var j=0; j<node.endComponents.length; j++)
            {
                var comp = node.endComponents[j];
                //if (comp.type == "wire" || comp.type == "switch") { continue ; }
                if (comp.current == null)
                {
                    compsWithUnknownCurrent.push(comp);
                    snOrEn.push(1);
                    continue;
                }
                currentOutOfNode -= comp.current;
            }
            //We can only solve if there is 1 unknown
            if (compsWithUnknownCurrent.length == 1)
            {   
                var comp = compsWithUnknownCurrent[0];
                //console.log("Its working.... comp="+comp.type);
                if (snOrEn[0] == 0)
                {
                    comp.current = -currentOutOfNode;
                } else {
                    comp.current = currentOutOfNode;
                }
                foundAnother = true;
            }
        }
    }

    //Update capacitors
    for (var i=0; i<components.length; i++)
    {
        if (components[i].type == "capacitor")
        {
            if (components[i].startNode == components[i].endNode)
            {
                components[i].voltage = 0;
            } else {
                components[i].voltage -= timeStep * components[i].current/components[i].capacitance;
            }
        }
    }

    //Update generic currents. If we know all of the other components current at a node (only 1 unknown) we can easily find the current.
    
    /*for (var i=0; i<nodes.length; i++) //for each node
    {
        var node = nodes[i];
        var currentOutOfNode = 0;
        var compsWithUnknownCurrent = [];
        var snOrEn = [];
        for (var j=0; j<node.startComponents.length; j++)
        {
            var comp = node.startComponents[j];
            if (comp.current == null)
            {
                compsWithUnknownCurrent.push(comp);
                snOrEn.push(0);
                continue;
            }
            currentOutOfNode += comp.current;
        }
        for (var j=0; j<node.endComponents.length; j++)
        {
            var comp = node.endComponents[j];
            if (comp.current == null)
            {
                compsWithUnknownCurrent.push(comp);
                snOrEn.push(1);
                continue;
            }
            currentOutOfNode -= comp.current;
        }
        //We can only solve if there is 1 unknown
        if (compsWithUnknownCurrent.length == 1)
        {   
            var comp = compsWithUnknownCurrent[0];
            console.log("Its working.... comp="+comp.type);
            if (snOrEn[0] == 0)
            {
                comp.current = currentOutOfNode;
            } else {
                comp.current = -currentOutOfNode;
            }
        } else if (compsWithUnknownCurrent > 1)
        {
            console.log("Multiple unknown");
        }
        
    }*/


}





function invertMatrix() {
        //Alrighty this is math I don't really care for but I need so here goes nothing
        /*
        0  4  8   12
        1  5  9   13
        2  6  10  14
        3  7  11  15
        */
        var mat = this.copy();
        var mat2 = (new mat4()).makeIdentity();

        for(var c = 0; c<4; c++)
        {
            //console.log("C: "+c+" \n"+mat.toString()+"\n"+mat2.toString());
            if (mat.f32a[c*4 + c] == 0)
            {
                console.error("Cannot Invert Matrix: Diagonal has a 0. Cannot divide by zero");
                return;
            }

            //divide entire row to get 1.
            var X = mat.f32a[c*4 + c];
            for (var c2 = 0; c2 < 4; c2++)
            {
                mat.f32a[c2*4 + c] = mat.f32a[c2*4 + c]/X;
                mat2.f32a[c2*4 + c] = mat2.f32a[c2*4 + c]/X;
            }

            //remove all vals in column other than in row c
            var otherRow = -1;
            for (var r=0; r<4; r++)
            {
                if (r != c && mat.f32a[c*4 + r] != 0)
                {
                    //otherIndexVal + 1*X = 0   -->   X = -otherIndexVal
                    var X = mat.f32a[c*4 + r];
                    for (var c2=0; c2<4; c2++)
                    {
                        mat.f32a[c2*4 + r] += -X * mat.f32a[c2*4+c];
                        mat2.f32a[c2*4 + r] += -X * mat2.f32a[c2*4+c];
                    }
                }
                //console.log("After Clearing R: " +r+"\n"+mat.toString()+"\n"+mat2.toString());
            }
        }

        //console.log("REsult: \n"+mat.toString()+"\n"+mat2.toString());
        return mat2;
}