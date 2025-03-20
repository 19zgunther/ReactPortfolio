//Elements
var simulatorElement = document.getElementById("Simulator");
var voltagePotentialText = document.getElementById("VoltagePotentialText");
var electricFieldMagnitudeText = document.getElementById("ElectricFieldMagnitudeText");
var GridSizeInputElement = document.getElementById("GridSizeInput");
var NewParicleChargeInputElement = document.getElementById("NewParticleChargeInput");
var SelectedParticleChargeInputElement = document.getElementById("SelectedParticleChargeInput");
var ShowChargeValueCheckboxElement = document.getElementById("ShowChargeValuesCheckbox");
var ShowForceVectorCheckboxElement = document.getElementById("ShowForceVectorsCheckbox");
var arrowBrightnessSliderElement = document.getElementById("ArrowBrightnessSlider");
var showEquipotentialsButtonElement = document.getElementById("ShowEquipotentialsButton");
var equipotentialInputElement = document.getElementById("EquipotentialsInput");
var TEST = document.getElementById("TEST");
var canvas = null;

//Screen Settings
var updateInterval = setInterval(Update,50);
var width;
var height;
var arrowSize;
var sensorSize;
var particleSize;
var gridSize;

//world settings
var arrowBrightnessMultiplier = 50;
var mouseClickDistance = 20; //in pixels
var selectedParticle = null;
var prevSelectedParticle = null;
var selectedSensor = null;
var moveSelectedParticle = false;
var moveSelectedSensor = false;
var changingParticleCharge = false;
var snapToGrid = true;
var gridUnits = 1;      //0.01 = cm, 1=m, 1000 = km per grid line
var minNumberMinorGridLines = 40;
var majorGridLineOpacity = 150;     //out of 255
var minorGridLineOpacity = 70;      //out of 255
var enableEquipotentials = false;   //This is the boolean variable determining if we compute&draw the equipotential lines or not
var equipotentialsInputString = "";
var enableChargeLabels = true;
var enableForceVectors = true;

//Objects
var particles = [];     //an array of particle objects
var sensors = [];
var equipotentials = [];

//Misc
const k = 9*Math.pow(10,9); //phsyics constant
var avgArrowBrightness = 0;
var selectedParticleRingThickness = 5;
var needUpdate = true;
var firstSetup = true;

var GraphCanvas = null;
var ArrowCanvas = null;
var ParticleCanvas = null;
var EquipotentialCanvas = null;
var updateCounter = 0;


//If we resize, get rid of all the arrows and particles. We'll just remake them
window.onresize = function(event){
    //clear();
    setup();
    for(const p in particles)
    {
        p.posx = worldToScreen(screenToWorldRound(p.posx));
        p.posy = worldToScreen(screenToWorldRound(p.posy));
    }
    for(const s in sensors)
    {
        s.posx = worldToScreen(screenToWorldRound(s.posx));
        s.posy = worldToScreen(screenToWorldRound(s.posy));
    }
    updateCounter = 0;
}
function CreateNewParticle()
{   //This function is EXCLUSIVELY called by "onClick = ...." in the html
    var charge = Number(NewParicleChargeInputElement.value)*0.000000001;
    selectedParticle = new Particle(charge, particleSize, mouseX,mouseY);
    particles.push(selectedParticle);
    moveSelectedParticle= true;
    SelectedParticleChargeInputElement.value = selectedParticle.charge*1000000000;
    selectedSensor = null;
}
function CreateNewSensor() {
    selectedSensor = new Sensor(0,0,sensorSize);
    selectedParticle = null;
    sensors.push(selectedSensor);
    moveSelectedSensor = true;
    updateCounter = 0;
}
function DeleteParticle(particle) {
    for(var i=0; i<particles.length; i++)
    {
        if (particles[i] == particle)
        {
            particles.splice(i,1);
            particle.Delete();
        }
    }
    updateCounter = 0;
}
function DeleteSensor(sensor) {
    for(var i=0; i<sensors.length; i++)
    {
        if (sensors[i] == sensor)
        {
            sensors.splice(i,1);
            sensor.Delete();
        }
    }
}
function mousePressed() {
    var rect = SelectedParticleChargeInputElement.getBoundingClientRect();
    var dx = (rect.right+rect.left)/2 - mouseX;
    var dy = (rect.top+rect.bottom)/2 - mouseY;
    var dist = Math.sqrt(dx*dx+dy*dy);
    var minDist = mouseClickDistance;


    //selectedParticle = null;
    //selectedParticle = prevSelectedParticle;
    //selectedSensor = null;
    for(var i=0; i<particles.length; i++)
    {
        dx = particles[i].posx-mouseX;
        dy = particles[i].posy-mouseY;
        dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < minDist)
        {
            moveSelectedParticle = true;
            moveSelectedSensor = false;
            minDist = dist;
            selectedParticle = particles[i];
            selectedSensor = null;
            SelectedParticleChargeInputElement.value = selectedParticle.charge*1000000000;
        }
    }
    for(var i=0; i<sensors.length; i++)
    {
        dx = sensors[i].posx-mouseX;
        dy = sensors[i].posy-mouseY;
        dist = Math.sqrt(dx*dx+dy*dy)
        if (dist < minDist)
        {
            moveSelectedSensor = true;
            moveSelectedParticle = false;
            selectedParticle = null;
            minDist = dist;
            selectedSensor = sensors[i];
        }
    }

    



}
function mouseReleased() {
    if (selectedParticle != null)
    {
        if (snapToGrid == true)
        {
            selectedParticle.posx = worldToScreen(screenToWorldRound(selectedParticle.posx));
            selectedParticle.posy = worldToScreen(screenToWorldRound(selectedParticle.posy));
        }
    }
    if (selectedSensor != null)
    {
        if (snapToGrid == true)
        {
            selectedSensor.posx = worldToScreen(screenToWorldRound(selectedSensor.posx));
            selectedSensor.posy = worldToScreen(screenToWorldRound(selectedSensor.posy));
        }
    }
    moveSelectedParticle = false;
    moveSelectedSensor = false;
}
function keyPressed() {
    if ((keyCode == DELETE || keyCode == BACKSPACE) && changingParticleCharge == false)
    {
        if (selectedParticle != null)
        {
            DeleteParticle(selectedParticle);
        }
        if (selectedSensor != null)
        {
            DeleteSensor(selectedSensor);
        }
        selectedParticle = null;
        selectedSensor = null;
        updateCounter = 0;
    } else if (keyCode == ESCAPE)
    {
        changingParticleCharge = false;
        if (selectedParticle != null)
        {
            if (snapToGrid == true)
            {
                selectedParticle.posx = worldToScreen(screenToWorldRound(selectedParticle.posx));
                selectedParticle.posy = worldToScreen(screenToWorldRound(selectedParticle.posy));
            }
        }
        if (selectedSensor != null)
        {
            if (snapToGrid == true)
            {
                selectedSensor.posx = worldToScreen(screenToWorldRound(selectedSensor.posx));
                selectedSensor.posy = worldToScreen(screenToWorldRound(selectedSensor.posy));
            }
        }
        selectedParticle = null;
        selectedSensor = null;
        updateCounter = 0;
    }
}
function NewParticleChargeClick() {
    selectedSensor = null;
    selectedParticle = null;
}
function SelectedParticleChargeInputClick() {
    if (selectedParticle != null)
    {
        changingParticleCharge = true;
    }
}
function ShowEquipotentialButtonClick() {
    if (enableEquipotentials == true)
    {
        enableEquipotentials = false;
        showEquipotentialsButtonElement.innerHTML = "Show Equipotential Lines";
        updateCounter = 0;
    } else {
        enableEquipotentials = true;
        showEquipotentialsButtonElement.innerHTML = "Hide Equipotential Lines";
        updateCounter = 0;
    }
}
function EquipotentialsInputClick() {
    selectedParticle = null;
    selectedSensor = null;
}
function ShowChargeLabelCheckboxClick() {
    if (ShowChargeValueCheckboxElement.checked == true)
    {
        enableChargeLabels = true;
    } else {
        enableChargeLabels = false;
    }
    updateCounter = 0;
}
function ShowForceVectorCheckboxClick() {
    if (ShowForceVectorCheckboxElement.checked == true)
    {
        enableForceVectors = true;
    } else {
        enableForceVectors = false;
    }
    updateCounter = 0;
}


function setup() {
    //initialize global variables
    width = window.innerWidth*19/20;
    height = window.innerHeight*6/8;
    arrowSize = Math.min(width,height)/75;
    sensorSize = arrowSize*2;
    particleSize = Math.min(width,height)/30;
    gridSize = Math.min(width,height)/minNumberMinorGridLines;

    //Create a new canvas
    canvas = createCanvas(width, height);
    canvas.parent('sketch-container-main');


    //Handling The Background Grid
    if (GraphCanvas == null) {
        GraphCanvas = new p5(P5GridSketch);
        GraphCanvas.resizeCanvas(width, height);
        GraphCanvas.Update();
    } else {
        GraphCanvas.resizeCanvas(width, height);
        GraphCanvas.Update();
    }

    if (ArrowCanvas == null) {
        ArrowCanvas = new p5(P5ArrowSketch);
    }

    if (ParticleCanvas == null) {
        ParticleCanvas = new p5(P5ParticleSketch);
    }

    if (EquipotentialCanvas == null) {
        EquipotentialCanvas = new p5(P5EquipotentialSketch);
    }

    //Misc
    GridSizeInputElement.value = "1";
    NewParicleChargeInputElement.value = "1";

    if (firstSetup == true) {
        if (width > worldToScreen(45)) {
            particles.push(new Particle(1*Math.pow(10,-9),particleSize, worldToScreen(45), worldToScreen(15)));
            particles.push(new Particle(-1*Math.pow(10,-9),particleSize, worldToScreen(55), worldToScreen(25)));
            particles.push(new Particle(1*Math.pow(10,-9),particleSize, worldToScreen(45), worldToScreen(25)));
        }
        firstSetup = false;
    }

    simulatorElement.style.width = width;
    simulatorElement.style.height = height;
    updateCounter = 0;
}

function Update() {
    if (moveSelectedParticle == true || moveSelectedSensor == true)
    {
        updateCounter = 0;
    }
    if (updateCounter < 3)
    {
        updateCounter += 1;

        //Arrows
        ArrowCanvas.Update();

        //Equipotentials
        EquipotentialCanvas.Update();

        //Draw Particles
        ParticleCanvas.Update();

        //Draw Sensors
        clear(); //Clear the canvas
        for(var i=0; i<sensors.length; i++)
        {
            sensors[i].Update();
            sensors[i].Draw();
        }
    }


    voltagePotentialText.innerHTML = "Voltage Potential: " + Math.round(CalcVolt(mouseX,mouseY)*1000)/1000;
    electricFieldMagnitudeText.innerHTML = "Electric Field Magnitude: " + Math.round(CalcElectricMag(mouseX,mouseY)*1000)/1000;

    //Updating Selected Particle and Sensor
    if (selectedParticle != null && moveSelectedParticle == true) {
        var closestDist = 1000000;
        var dist = 1000000;
        for (var i=0; i<particles.length; i++)
        {
            if (particles[i] == selectedParticle) {continue;}
            dist = Math.sqrt(Math.pow(Math.abs(particles[i].posx-mouseX),2)+Math.pow(Math.abs(particles[i].posy-mouseY),2));
            if (dist < closestDist)
            {
                closestDist = dist;
            }
        }
        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
        {
            if (closestDist > 30)
            {
                selectedParticle.posx = mouseX;
                selectedParticle.posy = mouseY;
            }
        }
    }
    if (selectedSensor != null && moveSelectedSensor == true) {
        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height)
        {
            selectedSensor.posx = mouseX;
            selectedSensor.posy = mouseY;
        }
    }


    //MISC///////////////////
    //Updating gridUnits
    if (gridUnits != parseFloat(GridSizeInputElement.value)/10 && Number(GridSizeInputElement.value) != 0) {
        gridUnits = parseFloat(GridSizeInputElement.value)/10;  //Updating grid units - we need to divide by 10 because we have 10 minor grid line divisions between major grid lines
        updateCounter = 0;
    }

    //Updating selected particle charge input
    if (changingParticleCharge == true)
    {
        if (selectedParticle.charge != Number(SelectedParticleChargeInputElement.value)/1000000000)
        {
            selectedParticle.charge = Number(SelectedParticleChargeInputElement.value)/1000000000;
            updateCounter = 0;
        }
    }

    //Updating SelectedParticleChargeInput
    if (selectedParticle == null)
    {
        SelectedParticleChargeInputElement.value = "";
    }

    //Update Arrow Brightness Input Slider/Multiplier
    if (arrowBrightnessMultiplier != arrowBrightnessSliderElement.value/50)
    {
        arrowBrightnessMultiplier = arrowBrightnessSliderElement.value/50;
        updateCounter = 0;
    }

    //Update Equipotentials Input
    if (enableEquipotentials == true && equipotentialsInputString != equipotentialInputElement.value)
    {
        equipotentialsInputString = equipotentialInputElement.value;
        var part = "";
        equipotentials = []
        for (var i=0; i<equipotentialsInputString.length+1; i++)
        {
            if (equipotentialsInputString[i] == "," || i == equipotentialsInputString.length)
            {
                equipotentials.push(Number(part));
                part = "";
            } else {
                part += equipotentialsInputString[i];
            }
        }
        updateCounter=0;
    }
}


function Calc(posx, posy)
{
    var volt = 0;
    var negVolt = 0;
    var posVolt = 0;
    var angle = 0;
    var q;      //will hold particle charge
    var dx;     //will hold difference in x position
    var dy;     //will hold difference in y position
    var dist;   //distance
    var mag;    //magnitude
    
    var totx = 0;
    var toty = 0;

    for(var i=0;i<particles.length;i++)
    {
        q = particles[i].charge;
        dx = (particles[i].posx-posx)*gridUnits/gridSize;
        dy = (particles[i].posy-posy)*gridUnits/gridSize;
        dist = Math.sqrt(dx*dx+dy*dy);
        mag = (k*q)/(dist*dist);
        
        totx += mag*dx/dist;
        toty += mag*dy/dist;

        volt += k*q/dist;
        if (q>0) {
            posVolt += k*q/dist;
        } else {
            negVolt -= k*q/dist;
        }
    }
    angle = Math.PI*3/2-Math.atan2(toty,totx);
    mag = Math.sqrt(toty*toty+totx*totx);

    return [mag, volt, angle, posVolt, negVolt];
}
function CalcVolt(posx, posy)
{
    var volt = 0;
    var q;      //will hold particle charge
    var dx;     //will hold difference in x position
    var dy;     //will hold difference in y position
    var dist;   //distance

    for(var i=0;i<particles.length;i++)
    {
        q = particles[i].charge;
        dx = (particles[i].posx-posx)*gridUnits/gridSize;
        dy = (particles[i].posy-posy)*gridUnits/gridSize;
        dist = Math.sqrt(dx*dx+dy*dy);
        volt += k*q/dist;
    }
    return volt;
}
function CalcElectricMag(posx, posy)
{
    var q;      //will hold particle charge
    var dx;     //will hold difference in x position
    var dy;     //will hold difference in y position
    var dist;   //distance
    var mag;    //magnitude
    var totx = 0;
    var toty = 0;

    for(var i=0;i<particles.length;i++)
    {
        q = particles[i].charge;
        dx = (particles[i].posx-posx)*gridUnits/gridSize;
        dy = (particles[i].posy-posy)*gridUnits/gridSize;
        dist = Math.sqrt(dx*dx+dy*dy);
        mag = (k*q)/(dist*dist);
        
        totx += mag*dx/dist;
        toty += mag*dy/dist;
    }
    return Math.sqrt(toty*toty+totx*totx);
}
function CalcMedium(posx, posy)
{
    var volt = 0;
    var q;      //will hold particle charge
    var dx;     //will hold difference in x position
    var dy;     //will hold difference in y position
    var dist;   //distance

    var mag = 0;
    var totx = 0;
    var toty = 0;

    for(var i=0;i<particles.length;i++)
    {
        q = particles[i].charge;
        dx = (particles[i].posx-posx)*gridUnits/gridSize;
        dy = (particles[i].posy-posy)*gridUnits/gridSize;
        dist = Math.sqrt(dx*dx+dy*dy);
        volt += k*q/dist;
        mag = (k*q)/(dist*dist);

        totx += mag*dx/dist;
        toty += mag*dy/dist;
    }

    angle = Math.PI*3/2-Math.atan2(toty,totx);
    return [volt,angle];
}
function CalcAngle(posx, posy)
{
    var q;      //will hold particle charge
    var dx;     //will hold difference in x position
    var dy;     //will hold difference in y position
    var dist;   //distance

    var mag = 0;
    var totx = 0;
    var toty = 0;

    for(var i=0;i<particles.length;i++)
    {
        q = particles[i].charge;
        dx = (particles[i].posx-posx)*gridUnits/gridSize;
        dy = (particles[i].posy-posy)*gridUnits/gridSize;
        dist = Math.sqrt(dx*dx+dy*dy);
        mag = (k*q)/(dist*dist);

        totx += mag*dx/dist;
        toty += mag*dy/dist;
    }

    angle = Math.PI*3/2-Math.atan2(toty,totx);
    return angle;
}
function CalcForceVector(particle)
{
    var force = 0;
    var q;      //will hold particle charge
    var dx = 0;     //will hold difference in x position
    var dy = 0;     //will hold difference in y position
    var dist = 0;   //distance
    var mag = 0;    //magnitude
    var totx = 0;
    var toty = 0;
    var angle = 0;
    var volt = 0;
    var potentialEnergy = 0;
    for (var j=0; j<particles.length; j++)
    {
        if (particles[j] == particle) {continue;}
        
        q = particles[j].charge;
        dx = (particles[j].posx-particle.posx)*gridUnits/gridSize;
        dy = (particles[j].posy-particle.posy)*gridUnits/gridSize;
        dist = Math.sqrt(dx*dx+dy*dy);
        mag = (k*q)/(dist*dist);
        
        totx += mag*dx/dist;
        toty += mag*dy/dist;

        volt += k*q/dist;
    }
    angle = Math.PI*3/2-Math.atan2(toty,totx);
    if (particle.charge < 0) { angle += Math.PI; }
    force = Math.sqrt(toty*toty+totx*totx)*particle.charge;
    potentialEnergy = particle.charge * volt;
    return [force,angle,potentialEnergy];
}


class Particle {
    constructor(charge, size, posx, posy)
    {
        this.posx = posx;
        this.posy = posy;
        this.charge = charge;
        this.force = 0;
        this.angle = 0;
        this.potentialEnergy = 0;
        this.size = size;
        this.text = document.createElement("div");
        this.text.setAttribute("class", "SensorText");
        simulatorElement.append(this.text);
        this.text.style = "left:"+this.posx+"px; top:"+this.posy+"px;";
        this.text.innerHTML = this.charge*1000000000 + "nC";
    }
    Update()
    {
        if (enableChargeLabels)
        {
            this.text.hidden = false;
            this.text.style = "left:"+this.posx+"px; top:"+this.posy+"px;";
            this.text.innerHTML = this.charge*1000000000 + "nC<br>";
            this.text.innerHTML += "PE= " + this.potentialEnergy.toPrecision(3) + "<br>";
            this.text.innerHTML += "F= <" +(this.force*Math.sin(this.angle)).toPrecision(3) + ",  " + (this.force *-Math.cos(this.angle)).toPrecision(3)+"><br>";
            
            this.text.innerHTML += "|F|=" + this.force.toPrecision(3);
            //this.text.innerHTML += "<"+(this.force*Math.sin(this.angle)).toPrecision(3) + ",  " + (this.force *-Math.cos(this.angle)).toPrecision(3)+">";
        
            //this.text.innerHTML = this.charge*1000000000 + "nC<br>PE: " + this.potentialEnergy.toPrecision(3) + "J<br>F: "+this.force.toPrecision(3)+"N";
        } else {
            this.text.hidden = true;
        }
    }
    Delete()
    {
        this.text.remove();
    }
}
class Sensor {
    constructor(posx, posy, size) {
        this.posx = posx;
        this.posy = posy;
        this.size = size;
        //this.arrow = new Arrow(size*2,posx,posy);
        this.angle = 0;
        this.line1 = [0,0,0,0];
        this.line2 = [0,0];
        this.line3 = [0,0];
        this.mag = 0;
        this.volt = 0;
        this.text = document.createElement("div");
        this.text.setAttribute("class", "SensorText");
        simulatorElement.append(this.text);
    }
    Update()
    {
        var out = Calc(this.posx,this.posy);
        this.mag = out[0];
        this.volt = out[1];
        this.angle = out[2];
        //this.text.setAttribute("left",this.posx+"px");
        //this.text.setAttribute("top", )
        this.text.style = "left:"+this.posx+"px; top:"+this.posy+"px;";
        this.text.innerHTML = "E= <" +(this.mag*Math.sin(this.angle)).toPrecision(3) + ",  " + (this.mag*-Math.cos(this.angle)).toPrecision(3)+"><br>";
        this.text.innerHTML += "|E|= " +Math.round(this.mag*10)/10 + " V/m<br>" + Math.round(this.volt*10)/10 + " V<br>";

        this.line1[0] = this.posx- Math.sin(this.angle)*this.size;
        this.line1[1] = this.posy- Math.cos(this.angle)*this.size;
        this.line1[2] = this.posx+ Math.sin(this.angle)*this.size;
        this.line1[3] = this.posy+ Math.cos(this.angle)*this.size;

        this.line2[0] = this.posx- Math.cos(this.angle)*this.size/2;
        this.line2[1] = this.posy- Math.sin(-this.angle)*this.size/2;

        this.line3[0] = this.posx+ Math.cos(this.angle)*this.size/2;
        this.line3[1] = this.posy+ Math.sin(-this.angle)*this.size/2;
    }
    Draw()
    {
        stroke(255,230,0);
        strokeWeight(2);
    
        line(this.line1[0], this.line1[1], this.line1[2],this.line1[3]);
        line(this.line2[0], this.line2[1], this.line1[2],this.line1[3]);
        line(this.line3[0], this.line3[1], this.line1[2],this.line1[3]);
        if (this == selectedSensor)
        {
            fill(255,255,255);
            circle(this.posx, this.posy, this.size/2 + selectedParticleRingThickness);
        } else {
            fill(255,230,0);
        }
        circle(this.posx, this.posy, this.size/3);
        strokeWeight(1);
    }
    Delete()
    {
        this.text.remove();
    }
}




function screenToWorld(pixel_coordinate)
{
    return pixel_coordinate/gridSize;
}
function screenToWorldRound(pixel_coordinate)
{
    return Math.round(pixel_coordinate/gridSize);
}
function worldToScreen(world_coordinate)
{
    return gridSize*world_coordinate;
}


const P5GridSketch = p =>
{
    var canvas;
    p.setup = function() {
        canvas = p.createCanvas(width,height);
        canvas.parent('sketch-container-main');
    };
    p.Update = function() {
        p.clear();
        p.stroke(255,255,255, minorGridLineOpacity);
        for(var i=0; i<1000; i++) //Draw Vertical GridLines
        {
            if (gridSize*i > width+arrowSize) { break; }
            if (i%10==5) {
                p.stroke(255,255,255, majorGridLineOpacity);
                p.line(gridSize*i, 0, gridSize*i,height);
                p.stroke(255,255,255, minorGridLineOpacity);
            } else {
                p.line(gridSize*i, 0, gridSize*i,height);
            }
        }
        for(var i=0; i<1000; i++) //Draw Horizontal GridLines
        {
            if (gridSize*i > height+arrowSize) { break; }
            if (i%10==5) {
                p.stroke(255,255,255, majorGridLineOpacity);
                p.line(0, gridSize*i, width, gridSize*i);
                p.stroke(255,255,255, minorGridLineOpacity);
            } else {
                p.line(0, gridSize*i, width, gridSize*i);
            }
        }
    };
};

const P5ArrowSketch = p => {
    var canvas;
    var myWidth;
    var myHeight;
    p.setup = function()
    {
        myWidth = width;
        myHeight = height;
        canvas = p.createCanvas(width,height);
        canvas.parent('sketch-container-main');
    }
    p.Update = function()
    {
        if (width != myWidth || height != myHeight)
        {
            myWidth = width;
            myHeight = height;
            p.resizeCanvas(width,height);
        }
        p.clear();
        if (particles.length == 0) {return;}
        var x;
        var y;
        var P0 = [0,0];
        var P1 = [0,0];
        var P2 = [0,0];
        var P3 = [0,0];
        var out;
        var mag;
        var posVolt;
        var negVolt;
        var angle;
        for(var i=1; i<500; i+=2)
        {
            if (gridSize*i>width+arrowSize) { break; }
            for (var j=1; j<500; j+=2)
            {
                if (gridSize*j>height+arrowSize) { break; }
                x = gridSize*i;
                y = gridSize*j;
                
                out = Calc(x,y); //[mag, volt, angle, posVolt, negVolt];
                mag = out[0]
                angle = out[2];
                posVolt = out[3];
                negVolt = out[4];
                

                P0[0] = x-Math.sin(angle)*arrowSize;
                P0[1] = y-Math.cos(angle)*arrowSize;
                P1[0] = x+Math.sin(angle)*arrowSize;
                P1[1] = y+Math.cos(angle)*arrowSize;
                P2[0] = x-Math.cos(angle)*arrowSize/2;
                P2[1] = y-Math.sin(-angle)*arrowSize/2;
                P3[0] = x+Math.cos(angle)*arrowSize/2;
                P3[1] = y+Math.sin(-angle)*arrowSize/2;

                var tot= posVolt+negVolt;
                p.stroke(400*posVolt/tot, 50, 400*negVolt/tot, mag*arrowBrightnessMultiplier);
                p.line(P0[0], P0[1], P1[0],P1[1]);
                p.line(P2[0], P2[1], P1[0],P1[1]);
                p.line(P3[0], P3[1], P1[0],P1[1]);
            }
        }
    }
};

const P5ParticleSketch = p => {
    var canvas;
    var myWidth;
    var myHeight;
    p.setup = function() {
        canvas = p.createCanvas(width,height);
        canvas.parent('sketch-container-main');
    };
    p.Update = function() {
        if (width != myWidth || height != myHeight)
        {
            myWidth = width;
            myHeight = height;
            p.resizeCanvas(width,height);
        }
        p.clear();
        for (var i=0; i<particles.length; i++)
        {
            particles[i].Update();
            if (particles[i] == selectedParticle)
            {
                p.fill(200,200,200);
                p.circle(particles[i].posx, particles[i].posy, particles[i].size+selectedParticleRingThickness);
                p.fill(200,200,200);
            }
            if (particles[i].charge > 0)
            {
                p.fill(255,50,50);
            } else if (particles[i].charge < 0) {
                p.fill(50,50,255);
            } else {
                p.fill(100,100,100);
            }
            
            p.circle(particles[i].posx, particles[i].posy, particles[i].size);
        }

        
        var out;
        var force;
        var angle;
        var potentialEnergy;
        var x,y;
        var P0 = [2];
        var P1 = [2];
        var P2 = [2];
        var P3 = [2];

        for (var i=0; i<particles.length; i++)
        {
            x = particles[i].posx;
            y = particles[i].posy;

            out = CalcForceVector(particles[i]);
            force = out[0];
            angle = out[1];
            potentialEnergy = out[2];

            particles[i].force = force;
            particles[i].angle = angle;
            particles[i].potentialEnergy = potentialEnergy;

            p.stroke(255,255,255);
            
            if (force != 0 && enableForceVectors == true) {
                P0[0] = x-Math.sin(angle)*arrowSize;
                P0[1] = y-Math.cos(angle)*arrowSize;
                P1[0] = x+Math.sin(angle)*arrowSize;
                P1[1] = y+Math.cos(angle)*arrowSize;
                P2[0] = x-Math.cos(angle)*arrowSize/2;
                P2[1] = y-Math.sin(-angle)*arrowSize/2;
                P3[0] = x+Math.cos(angle)*arrowSize/2;
                P3[1] = y+Math.sin(-angle)*arrowSize/2;

                p.line(P0[0], P0[1], P1[0],P1[1]);
                p.line(P2[0], P2[1], P1[0],P1[1]);
                p.line(P3[0], P3[1], P1[0],P1[1]);
            }

        }
        

    };
};

const P5EquipotentialSketch = p => {
    var canvas;
    var myWidth;
    var myHeight;
    p.setup = function() {
        canvas = p.createCanvas(width,height);
        canvas.parent('sketch-container-main');
    };
    p.Update = function() {
        
        if (width != myWidth || height != myHeight)
        {
            myWidth = width;
            myHeight = height;
            p.resizeCanvas(width,height);
        }

        if (enableEquipotentials == false || particles.length < 1) // || moveSelectedParticle == true
        {
            canvas.clear();
            return;
        }

        canvas.clear();
        p.stroke(255,255,255);

    

        //Calculating the center of charge. We will need this (draw a line from each charge to this, and check for equipotentials along this line)
        var centerOfChargeX = 0;
        var centerOfChargeY = 0;
        var totalCharge = 0;
        for (var i = 0; i < particles.length; i++)
        {
            centerOfChargeX += Math.abs(particles[i].charge * particles[i].posx);
            centerOfChargeY += Math.abs(particles[i].charge * particles[i].posy);
            totalCharge += Math.abs(particles[i].charge);
        }
        centerOfChargeX = centerOfChargeX/totalCharge;
        centerOfChargeY = centerOfChargeY/totalCharge;


        var startRadius = 5; //these two values cannot be above 20 for some reason or else the page freezes.
        var searchRadius = 5;
        var drawRadius = 20;
        var angleToCenter, currentBestAngle = 0;
        var angleRotator;
        var currentBestAngleStep;
        var x, y = 0;
        var nextX, nextY = 0;
        var startX, startY = 0;
        var currentVolt = 0;
        var targetVolt = 0;
        var safetyBrake = 0; 

        
        for (var i=0; i<particles.length; i++) //for each particle
        {
            if (particles[i].charge == 0) {continue;} //fixes page freeze bug (don't remove)

            enableDrawing = false;
            angleToCenter = Math.atan2(centerOfChargeY-particles[i].posy, centerOfChargeX - particles[i].posx); //calculate angle from particle to centerOfCharge
            
            if (i%2==0)
            {
                angleRotator = Math.PI/2; //we update this each time to make so different particles draw in opposite directions. fixes 0v equipotential line.
                currentBestAngleStep = 0.02;
            } else {
                angleRotator = Math.PI*3/2; //we update this each time to make so different particles draw in opposite directions. fixes 0v equipotential line.
                currentBestAngleStep = -0.02;
            }

            for (var j=0; j<equipotentials.length; j++) //for each equipotential
            {
                targetVolt = equipotentials[j];   //the equipotential voltage value we're searching for
                x = particles[i].posx + startRadius*Math.cos(angleToCenter);   //Calculate startX and startY (based on angle and startRadius)
                y = particles[i].posy + startRadius*Math.sin(angleToCenter);

                //p.stroke(0,255,0); //This draws the ray to the center of charge
                //p.line(x,y, centerOfChargeX, centerOfChargeY);
                //p.stroke(255);
                p.stroke(targetVolt*20+150,Math.abs(targetVolt)*5,-targetVolt*20+150);

                //what we're doing is drawing a ray from the particle through the center of charge, and along that line searching for the target voltage equipotential
                var dx = searchRadius*Math.cos(angleToCenter); 
                var dy = searchRadius*Math.sin(angleToCenter);
                safetyBrake = 0;
                if (particles[i].charge > 0) {
                    while (CalcVolt(x,y) > targetVolt && safetyBrake < 500) //the way we decide if we found the particle, is if we go from being greater than the wanted voltage to less (and opposite for negative particle/charges)
                    {
                        x += dx;
                        y += dy;
                        safetyBrake += 1;
                    }
                } else {
                    while (CalcVolt(x,y) < targetVolt && safetyBrake < 500)
                    {
                        x += dx;
                        y += dy;
                        safetyBrake += 1;
                    }
                }
                if (safetyBrake > 495 || safetyBrake < 5){ //if we went 495 steps or more, just stop there's no point in continuing because the equipotential is SOOOO far away (and likely completely off the screen)
                    continue;
                }

                for (var runs=0; runs<500; runs++) //for 500 runs we're going to run a greedy algorithm to draw the equiptoential 
                {
                    currentBestAngle = CalcAngle(x,y) + angleRotator;   //Take the current electric field and rotate it 90 deg. We are headed in roughly this direction, perpendicular to the electric field vector
                    nextX = x + drawRadius * Math.sin(currentBestAngle); //computing the next point we're going to (nextX and nextY) drawRadius away from x,y
                    nextY = y + drawRadius * Math.cos(currentBestAngle);
                    currentVolt = CalcVolt(nextX,nextY);                    //Finding the voltage at this new point

                    safetyBrake = 0;
                    while (currentVolt < targetVolt && safetyBrake < 200)      //if and while the voltage at the nextX and nextY point is too low, rotate a little bit (towards opposite direction of electric field vector)
                    {
                        safetyBrake += 1;
                        currentBestAngle += currentBestAngleStep;
                        nextX = x + drawRadius * Math.sin(currentBestAngle);
                        nextY = y + drawRadius * Math.cos(currentBestAngle);
                        currentVolt = CalcVolt(nextX,nextY);
                    }

                    safetyBrake = 0;
                    while (currentVolt > targetVolt && safetyBrake < 200)   //if and while the voltage at the nextX and nextY point is too high, rotate a little bit (towards direction of electric field vector)
                    {
                        safetyBrake -= 1;
                        currentBestAngle += currentBestAngleStep;
                        nextX = x + drawRadius * Math.sin(currentBestAngle);
                        nextY = y + drawRadius * Math.cos(currentBestAngle);
                        currentVolt = CalcVolt(nextX,nextY);
                    }

                    if (runs > 2) { //Draw the line, only after a few runs to make sure we don't have any "Tags"... the first few positions aren't very accurate sometimes... 
                        p.line(x,y,nextX,nextY);
                    }
                    if (runs == 2)
                    {
                        angleRotator += Math.PI; //we update this each time to make so different particles draw in opposite directions. fixes 0v equipotential line.
                        currentBestAngleStep = -currentBestAngleStep;
                    }

                    if (startX-2<x && startX+2>x && startY-2<y && startY+2>y)
                    {
                        TEST.innerHTML = runs;
                        break;
                    }

                    if (runs == 10)
                    {
                        startX = x;
                        startY = y;
                    }

                    x = nextX;  //now fully commit to this new point, and continue the for loop.
                    y = nextY; 
                }
            }
        }
    };
};
