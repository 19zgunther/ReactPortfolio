

function createNewComponent(drawMode)
{
    switch(drawMode)
    {
        case "text": return new Text();

        case "wire": return new Wire();
        case "resistor": return new Resistor();
        case "switch": return new Switch();
        case "capacitor": return new Capacitor();
        case "inductor": return new Inductor();
        case "voltageSource2n": return new VoltageSource2n();
        case "voltageSource1n": return new VoltageSource1n();
        case "currentSource": return new CurrentSource();
        case "ground": var comp = new VoltageSource1n(); comp.SetValue(0); return comp;
        case "freqSweep": return new FrequencySweep();

        case "opamp": return new OpAmp();
        case "diode": return new Diode();
        case "zenerDiode": var d = new Diode(); d.breakdownVoltage = 10; return d;
    }
}



class Component {
    constructor(type) {
        
        this.startPos = new Point(0,0);
        this.endPos = new Point(0,0);
        this.type = type //can be wire, resistor, capacitor, voltageSource1n, voltageSource2n, or currentSource, or inductor

        this.name = getNewComponentName(this.type);


        this.startNode = null;
        this.endNode = null;

        this.voltage = 5;
        this.current = 0.001;
        
        this.voltageData = new Array(20000);
        this.currentData = new Array(20000);
        this.dataStart = 0;

        this.parentComponent = null;

        this.enabled = true;
    }

    GetValueString() {console.error("GetValueString() not implmented for type: " + this.type)}
    GetEncodedDataString(){}
    toString() { 
        var voltage = "null";
        var current = "null";
        if (this.voltage != null) {
            voltage = this.voltage.toPrecision(3);
            voltage = voltage[0] + voltage[1] + voltage[2];
        }
        if (this.current != null) {
            //current = (Math.round( this.current * 1000000)/1000000).toPrecision(3);
            current = this.current.toPrecision(3);
            current = current[0] + current[1] + current[2];
        }
        return formatValue(this.GetValue(),this.GetStringSuffix())+" " + this.type + "  ΔV: "+formatValue(voltage, "v")+" I: "+formatValue(current,"A");
    }
    SetValue(){}
    GetValue(){}
    GetStringSuffix(){return "Null_Suffix";}
    Draw(){ console.error("Draw(painter) for Class = " + this.type + " not yet implemented"); }
    Update(){}
    GetInputs(){return[];}  //In form [inputNumber][0/1 (Title/Suffix)]
    SetValues(){}
    RecordData()
    {
        this.voltageData.shift(); //remove the first element in the array ( [0,1,2,3,4,5]  ->  [1,2,3,4,5])
        this.currentData.shift();
        this.voltageData.push(this.voltage); //push a new value onto the back
        this.currentData.push(this.current);
    }

    Delete() {
        //IDK maybe in the future i'll need to do something here
    }
}


class Wire extends Component {
    constructor() {
        super('wire');
        this.type = 'wire';
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+"_"+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    Draw(p) {
        //if (this.parentComponent != null) { return; }
        if (this.startNode != null)
        {
            var snColor = voltageToHexColor(this.startNode.voltage);
        }
        p.DrawLine(this.startPos.x,this.startPos.y,this.endPos.x,this.endPos.y, snColor);
        if (this.startPos.equals(this.endPos))
        {
            p.DrawCircle(this.startPos.x, this.startPos.y, 5, 'purple');
        }
    }
    Update()
    {
        if (this.startNode != null)
        {
            this.voltage = this.startNode.voltage;
        }
    }
    RecordData()
    {
        if (this.startNode != null)
        {
            this.voltage = this.startNode.voltage;
        }
        this.voltageData.shift(); //remove the first element in the array ( [0,1,2,3,4,5]  ->  [1,2,3,4,5])
        this.currentData.shift();
        this.voltageData.push(this.voltage); //push a new value onto the back
        this.currentData.push(this.current);
    }
}

class Switch extends Component {
    constructor() {
        super('switch');
        this.type = 'switch';
        this.name = getNewComponentName(this.type);
        this.switchClosed = 1; //1 = true = switch_Is_Closed, 0 = false = switch_is_open
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    SetValue(val)
    {   
        val = Number(val)
        if (val == NaN || val == null)
        {
            console.error("Component passed NaN or null in .SetValue(val)");
        }
        if (val == 0 || val == 1) {
            this.switchClosed = val;
        } else {
            console.error("Component type " + this.type + " was passed invalid value ("+val+"). Expected 0 or 1");
        }
    }
    GetValue() {
        return this.switchClosed;
    }
    GetStringSuffix() {
        return "B";
    }
    Draw(p) {

        var startPos = this.startPos; 
        var endPos = this.endPos;
        var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2)); //distance between startPos and endPos (start & end positions x and y)
        var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI; //angle from startPos to endPos, offset by Math.PI because it works
        var len = (dist/2) - 20; //length from each point to center minus resistor box length
        var p5 = new Point((Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y));
        var p6 = new Point((Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
        

        if (this.startNode != null && this.endNode != null) {
            var snColor = voltageToHexColor(this.startNode.voltage);
            var enColor = voltageToHexColor(this.endNode.voltage);
            var mid = voltageToHexColor((this.startNode.voltage + this.endNode.voltage)/2);
        }


        //Draw lines from endpoints to box
        p.DrawLine(startPos.x,startPos.y, p5.x, p5.y, snColor); //drawing line from startPos
        p.DrawLine(endPos.x,endPos.y, p6.x, p6.y, enColor); //drawing line from endPos
        p.DrawCircle(p5.x,p5.y,3);
        p.DrawCircle(p6.x,p6.y,3);
        
        if (this.switchClosed == 1) {
            p.DrawLine(p5.x + Math.cos(angle+Math.PI/2)*3, p5.y + Math.sin(angle+Math.PI/2)*3,  p6.x, p6.y, snColor);
        } else {
            p.DrawLine(p5.x + Math.cos(angle+Math.PI/2)*15, p5.y + Math.sin(angle+Math.PI/2)*15,  p6.x, p6.y,  enColor);
        }
    }
}


class Resistor extends Component {
    constructor() {
        super('resistor');
        this.type = 'resistor';
        this.name = getNewComponentName(this.type);
        this.resistance = 1000;
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    SetValue(val)
    {   
        val = Number(val)
        if (val == NaN || val == null)
        {
            console.error("Component passed NaN or null in .SetValue(val)");
        }
        this.resistance = val;
    }
    GetValue() {
        return this.resistance;
    }
    GetStringSuffix() {
        return "Ω";
    }
    GetInputs(){
        return [["Resistance", formatValue(this.resistance,"Ω")]]
    }
    SetValues(arr = []){
        this.resistance = arr[0];
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {
        if (this.parentComponent != null) { return; }
        var startPos = this.startPos; 
        var endPos = this.endPos;
        var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2)); //distance between startPos and endPos (start & end positions x and y)
        var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI; //angle from startPos to endPos, offset by Math.PI because it works
        var len = (dist/2) - 25; //length from each point to center minus resistor box length
        var p5 = new Point((Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y));
        var p6 = new Point((Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
        

        var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y)); //find the midpoint between startPos and endPos
        var height = 25; //this is the distance the points below are from the midpoint
        var angleModifier = 0.4; //how much we deviate from initial angle to draw 4 points which will make the box
        var p1 = new Point((Math.cos(angle+angleModifier)*height+midpoint.x),(Math.sin(angle+angleModifier)*height+midpoint.y)); //these 4 points make up a rectangle
        var p2 = new Point((Math.cos(angle-angleModifier)*height+midpoint.x),(Math.sin(angle-angleModifier)*height+midpoint.y));
        var p3 = new Point((Math.cos(angle+angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle+angleModifier+Math.PI)*height+midpoint.y));
        var p4 = new Point((Math.cos(angle-angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle-angleModifier+Math.PI)*height+midpoint.y));
        
        if (this.startNode != null && this.endNode != null) {
            var snColor = voltageToHexColor(this.startNode.voltage);
            var enColor = voltageToHexColor(this.endNode.voltage);
            var mid = voltageToHexColor((this.startNode.voltage + this.endNode.voltage)/2);
        }


        //Draw lines from endpoints to box
        p.DrawLine(startPos.x,startPos.y, p5.x, p5.y, snColor); //drawing line from startPos
        p.DrawLine(endPos.x,endPos.y, p6.x, p6.y, enColor); //drawing line from endPos
        
        var v = (this.startNode.voltage + this.endNode.voltage)/2;
        //actually drawing the box now (4 lines)
        var temp = p.GetStrokeColor();
        p.SetStrokeColor(mid);
        p.DrawLine(p1.x,p1.y,p2.x,p2.y); 
        p.DrawLine(p3.x,p3.y,p4.x,p4.y);
        p.DrawLine(p1.x,p1.y,p4.x,p4.y);
        p.DrawLine(p2.x,p2.y,p3.x,p3.y);
        p.SetStrokeColor(temp);


        while (angle > Math.PI/2) {
            angle -= Math.PI
        }
        while (angle < -Math.PI/2) {
            angle += Math.PI
        }

        if (labelComponentValues) {
            p.DrawTextRotatedCentered(midpoint.x, midpoint.y, formatValue(this.resistance, this.GetStringSuffix()), angle );
        }

        if (labelComponentNames == true) {
            //fill(255,255,255);
            //stroke(5);
            //strokeWeight(1);
            //textSize(labelTextSize);
            //text("R"+this.name+": "+comp.GetValueString(), midpoint.x, midpoint.y);
        }
    }
}

class Capacitor extends Component {
    constructor() {
        super('capacitor');
        this.type = 'capacitor';
        this.name = getNewComponentName(this.type);
        this.capacitance = 0.000001;
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    SetValue(val)
    {   
        val = Number(val)
        if (val == NaN || val == null)
        {
            console.error("Component passed NaN or null in .SetValue(val)");
        }
        this.capacitance = val;
    }
    GetValue() {
        return this.capacitance;
    }
    GetStringSuffix() {
        return "F";
    }
    GetInputs(){
        return [["Capacitance", formatValue(this.capacitance,"F")]]
    }
    SetValues(arr = []){
        this.capacitance = arr[0];
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {
        var startPos = this.startPos;
        var endPos = this.endPos;
        var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2));
        var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI;
        var len = (dist/2) - 7;
        var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y));

        var height = 20;
        var angleModifier = Math.PI/2-0.3;
        var ps = new Point((Math.cos(angle)*len+startPos.x),(Math.sin(angle)*len+startPos.y));
        var pe = new Point((Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
        var p1 = new Point((Math.cos(angle+angleModifier)*height+midpoint.x),(Math.sin(angle+angleModifier)*height+midpoint.y));
        var p2 = new Point((Math.cos(angle-angleModifier)*height+midpoint.x),(Math.sin(angle-angleModifier)*height+midpoint.y));
        var p3 = new Point((Math.cos(angle+angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle+angleModifier+Math.PI)*height+midpoint.y));
        var p4 = new Point((Math.cos(angle-angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle-angleModifier+Math.PI)*height+midpoint.y));
        
        if (this.startNode != null && this.endNode != null) {
            var snColor = voltageToHexColor(this.startNode.voltage);
            var enColor = voltageToHexColor(this.endNode.voltage);
            var mid = (this.startNode.voltage - this.endNode.voltage)/2;
        }


        var temp = p.GetStrokeColor();
        p.SetStrokeColor(snColor);
        p.DrawLine(startPos.x,startPos.y, ps.x, ps.y);
        p.DrawLine(p3.x,p3.y,p4.x,p4.y);
        p.SetStrokeColor(enColor);
        p.DrawLine(endPos.x,endPos.y, pe.x, pe.y);
        p.DrawLine(p1.x,p1.y,p2.x,p2.y);
        p.SetStrokeColor(temp);

        if (labelComponentValues)
        {
            p.DrawText(midpoint.x+height+2, midpoint.y, formatValue(this.capacitance, this.GetStringSuffix()) );
        }
    }
    RecordData()
    {
        this.voltageData.shift(); //remove the first element in the array ( [0,1,2,3,4,5]  ->  [1,2,3,4,5])
        this.currentData.shift();
        this.voltageData.push(this.voltage); //push a new value onto the back
        this.currentData.push(-this.current);
    }
}

class Inductor extends Component {
    constructor() {
        super('inductor');
        this.type = 'inductor';
        this.name = getNewComponentName(this.type);
        this.inductance = 0.001;
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    SetValue(val)
    {   
        val = Number(val)
        if (val == NaN || val == null)
        {
            console.error("Component passed NaN or null in .SetValue(val)");
        }
        this.inductance = val;
    }
    GetValue() {
        return this.inductance;
    }
    GetStringSuffix() {
        return "H";
    }
    GetInputs(){
        return [["Inductance", formatValue(this.inductance,"H")]]
    }
    SetValues(arr = []){
        this.inductance = arr[0];
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {
        //draws inductor on canvas
        var startPos = this.startPos;  //comp = a resistor Component object
        var endPos = this.endPos;
        var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2)); //distance between startPos and endPos (start & end positions x and y)
        var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI; //angle from startPos to endPos, offset by Math.PI because it works
        
        var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y)); //find the midpoint between startPos and endPos

        //drawing the arcs
        var len = (dist/2) - 20; //length from each point to center minus resistor box length
        var ps1 = new Point((Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y));
        var pe1 = new Point((Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
        len = (dist/2 - 15);
        var ps2 = new Point((Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y));
        var pe2 = new Point((Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
        len = (dist/2 - 5);
        var ps3 = new Point((Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y));
        var pe3 = new Point((Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));


        if (this.startNode != null && this.endNode != null) {
            var snColor = voltageToHexColor(this.startNode.voltage);
            var enColor = voltageToHexColor(this.endNode.voltage);
            var inc = (this.startNode.voltage - this.endNode.voltage)/5;
            var v = this.endNode.voltage;
        }

        p.DrawLine(startPos.x,startPos.y, ps1.x, ps1.y, snColor); //drawing line from startPos
        p.DrawLine(endPos.x,endPos.y, pe1.x, pe1.y, enColor); //drawing line from endPos
        

        p.DrawArc(ps2.x,ps2.y, 5, 0+angle, Math.PI+angle, voltageToHexColor(v+inc*4));
        p.DrawArc(ps3.x,ps3.y, 5, 0+angle, Math.PI+angle, voltageToHexColor(v+inc*3));
        p.DrawArc(pe3.x,pe3.y, 5, 0+angle, Math.PI+angle, voltageToHexColor(v+inc*2));
        p.DrawArc(pe2.x,pe2.y, 5, 0+angle, Math.PI+angle, voltageToHexColor(v+inc*1));


        //this is all for drawing the arrow next to the inductor specifying current direction
        /*
        var height = 13;
        len = dist/2 - 15;
        var p1 = new Point((Math.cos(angle)*len+startPos.x+Math.cos(angle+Math.PI/2)*height), (Math.sin(angle)*len+startPos.y+Math.sin(angle+Math.PI/2)*height));
        var p2 = new Point((Math.cos(angle+Math.PI)*len+endPos.x+Math.cos(angle+Math.PI/2)*height), (Math.sin(angle+Math.PI)*len+endPos.y+Math.sin(angle+Math.PI/2)*height));
        var p3;
        var p4;
        var armLength = 5;

        if (this.current < 0)
        {
            p3 = new Point(p1.x + Math.cos(angle+Math.PI/4)*armLength, p1.y + Math.sin(angle+Math.PI/4)*armLength);
            p4 = new Point(p1.x + Math.cos(angle-Math.PI/4)*armLength, p1.y + Math.sin(angle-Math.PI/4)*armLength);
        } else {
            
            p3 = new Point(p2.x - Math.cos(angle+Math.PI/4)*armLength, p2.y - Math.sin(angle+Math.PI/4)*armLength);
            p4 = new Point(p2.x - Math.cos(angle-Math.PI/4)*armLength, p2.y - Math.sin(angle-Math.PI/4)*armLength);
            var q = p1;
            p1 = p2;
            p2 = q;
        }

        if (this.current != 0)
        {
            p.DrawLine(p1.x,p1.y,p2.x,p2.y);
            p.DrawLine(p1.x,p1.y,p3.x,p3.y);
            p.DrawLine(p1.x,p1.y,p4.x,p4.y);
        }
        */

        if (labelComponentValues) {
            p.DrawText(midpoint.x+10, midpoint.y, formatValue(this.inductance, this.GetStringSuffix()) );   
        }



        if (labelComponentNames == true) {
            //fill(255,255,255);
            //stroke(5);
            //strokeWeight(1);
            //textSize(labelTextSize);
            //text("L"+comp.name+": "+comp.GetValueString(), midpoint.x, midpoint.y);
        }
    }

}

class VoltageSource1n extends Component {
    constructor() {
        super('voltageSource1n');
        this.type = 'voltageSource1n';
        this.targetVoltage = 0;
        this.frequency = 0;
        this.voltage = 0;
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    SetValue(val)
    {   
        val = Number(val)
        if (val == NaN || val == null)
        {
            console.error("Component passed NaN or null in .SetValue(val)");
            return;
        }
        this.voltage = val;
    }
    GetValue() {
        return this.voltage;
    }
    GetStringSuffix() {
        return "V";
    }
    GetInputs(){
        return [["Voltage", formatValue(this.targetVoltage,"V")],["Freqeuncy",formatValue(this.frequency, "Hz")]];
    }
    SetValues(arr = []){
        this.targetVoltage = arr[0];
        this.frequency = arr[1];
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {
        if (this.parentComponent != null) { return; }
        var color = voltageToHexColor(this.voltage);
        p.DrawLine(this.startPos.x,this.startPos.y,this.endPos.x,this.endPos.y, color);
        p.DrawLine(this.endPos.x - 10, this.endPos.y, this.endPos.x + 10, this.endPos.y, color);
        
        if (this.targetVoltage == 0)
        {
            if (this.startPos.y > this.endPos.y) //slope down, so draw number below.
            {
                p.DrawLine(this.endPos.x - 7, this.endPos.y-5, this.endPos.x + 7, this.endPos.y-5);
                p.DrawLine(this.endPos.x - 4, this.endPos.y-10, this.endPos.x + 4, this.endPos.y-10);
            } else {
                p.DrawLine(this.endPos.x - 7, this.endPos.y+5, this.endPos.x + 7, this.endPos.y+5);
                p.DrawLine(this.endPos.x - 4, this.endPos.y+10, this.endPos.x + 4, this.endPos.y+10);

            }
        } else {
            if (labelComponentValues) {
                if (this.startPos.y > this.endPos.y) //slope down, so draw number below.
                {
                    p.DrawTextCentered(this.endPos.x, this.endPos.y-8, formatValue(this.targetVoltage, this.GetStringSuffix()));
                } else {
                    p.DrawTextCentered(this.endPos.x, this.endPos.y+8, formatValue(this.targetVoltage, this.GetStringSuffix()));
                }
            }
        }
        
    }
    Update(currentTime, timeStep) {
        if (this.frequency != 0) {
            this.voltage = this.targetVoltage * Math.sin(currentTime * this.frequency * 6.283185);
        } else {
            this.voltage = this.targetVoltage;
        }
    }

}

class VoltageSource2n extends Component {
    constructor() {
        super('voltageSource2n');
        this.type = 'voltageSource2n';
        this.targetVoltage = 5;
        this.voltage = 5;
        this.frequency = 0;
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    SetValue(val)
    {   
        val = Number(val)
        if (val == NaN || val == null)
        {
            console.error("Component passed NaN or null in .SetValue(val)");
        }
        this.voltage = val;
    }
    GetValue() {
        return this.voltage;
    }
    GetStringSuffix() {
        return "V";
    }
    GetInputs(){
        return [["Voltage", formatValue(this.targetVoltage,"V")],["Freqeuncy",formatValue(this.frequency, "Hz")]];
    }
    SetValues(arr = []){
        this.targetVoltage = arr[0];
        this.frequency = arr[1];
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {
        if (this.parentComponent != null) { return; }
        var startPos = this.startPos;
        var endPos = this.endPos;
        var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2));
        var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI;
        var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y));
        var len = 1;

        if (this.startNode != null && this.endNode != null) {
            var snColor = voltageToHexColor(this.startNode.voltage);
            var enColor = voltageToHexColor(this.endNode.voltage);
            var mid = voltageToHexColor((this.startNode.voltage+this.endNode.voltage)/2);
        }

        if (this.frequency == 0) {
            //DC - draw battery
            len = (dist/2) - 7;

            var height1 = 20;
            var height2 = 10;
            var angleModifier = Math.PI/2-0.3;
            var p1 = new Point((Math.cos(angle+angleModifier)*height1+midpoint.x),(Math.sin(angle+angleModifier)*height1+midpoint.y));
            var p2 = new Point((Math.cos(angle-angleModifier)*height1+midpoint.x),(Math.sin(angle-angleModifier)*height1+midpoint.y));
            var p3 = new Point((Math.cos(angle+angleModifier+Math.PI)*height2+midpoint.x),(Math.sin(angle+angleModifier+Math.PI)*height2+midpoint.y));
            var p4 = new Point((Math.cos(angle-angleModifier+Math.PI)*height2+midpoint.x),(Math.sin(angle-angleModifier+Math.PI)*height2+midpoint.y));
            p.DrawLine(p1.x,p1.y,p2.x,p2.y, enColor);
            p.DrawLine(p3.x,p3.y,p4.x,p4.y, snColor);
            if (labelComponentValues) {
                p.DrawTextCentered(midpoint.x+25, midpoint.y, formatValue(this.targetVoltage, this.GetStringSuffix()) );
            }
        } else {
            //ac - draw circle..?
            len = (dist/2) - 25;
            p.DrawCircle(midpoint.x, midpoint.y, 25, mid);
            if (labelComponentValues) {
                p.DrawTextCentered(midpoint.x, midpoint.y, formatValue(this.frequency, "Hz"));
                p.DrawTextCentered(midpoint.x+35, midpoint.y, formatValue(this.targetVoltage, this.GetStringSuffix()) );
            }
        }

        p.DrawLine(startPos.x,startPos.y, (Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y), snColor);
        p.DrawLine(endPos.x,endPos.y, (Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y), enColor);
    }
    Update(currentTime, timeStep) {
        if (this.frequency != 0) {
            this.voltage = this.targetVoltage * Math.sin(currentTime * this.frequency * 6.283185);
        } else {
            this.voltage = this.targetVoltage;
        }
    }
}

class CurrentSource extends Component {
    constructor() {
        super('currentSource');
        this.type = 'currentSource';
        this.targetCurrent = 5;
        this.frequency = 0;
        this.current = 5;
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    GetStringSuffix() {
        return "A";
    }
    GetInputs(){
        return [["Current", formatValue(this.targetCurrent,"A")],["Freqeuncy",formatValue(this.frequency, "Hz")]];
    }
    SetValues(arr = []){
        this.targetCurrent = arr[0];
        this.frequency = arr[1];
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {
        var startPos = this.startPos;
        var endPos = this.endPos;
        var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2));
        var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI;
        var len = (dist/2) - 15;
        var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y));
        //fill(0,0,0,0);
        

        var height = 10;
        var angleModifier = Math.PI/2-0.3;

        if (this.startNode != null && this.endNode != null) {
            var snColor = voltageToHexColor(this.startNode.voltage);
            var enColor = voltageToHexColor(this.endNode.voltage);
            var mid = voltageToHexColor((this.startNode.voltage+this.endNode.voltage)/2);
        }

        p.DrawCircle(midpoint.x, midpoint.y, 15, mid);

        p.DrawLine(startPos.x,startPos.y, (Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y), snColor);
        p.DrawLine(endPos.x,endPos.y, (Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y), enColor);
        var p1 = new Point((Math.cos(angle)*height+midpoint.x),(Math.sin(angle)*height+midpoint.y));
        var p2 = new Point((Math.cos(angle+Math.PI)*height+midpoint.x),(Math.sin(angle+Math.PI)*height+midpoint.y));

        var p3 = new Point((Math.cos(angle+Math.PI/2)*height+midpoint.x),(Math.sin(angle+Math.PI/2)*height+midpoint.y));
        var p4 = new Point((Math.cos(angle-Math.PI/2)*height+midpoint.x),(Math.sin(angle-Math.PI/2)*height+midpoint.y));
        p.DrawLine(p1.x,p1.y,p2.x,p2.y, mid);
        p.DrawLine(p3.x,p3.y,p1.x,p1.y, mid);
        p.DrawLine(p4.x,p4.y,p1.x,p1.y, mid);

        if (labelComponentValues) {
            p.DrawText(midpoint.x + 20, midpoint.y, formatValue(this.targetCurrent, "A"));
        }   
    }
    Update(currentTime, timeStep) {
        if (this.frequency != 0) {
            this.current = this.targetCurrent * Math.sin(currentTime * this.frequency * 6.283185);
        } else {
            this.current = this.targetCurrent;
        }
    }
}

class FrequencySweep extends Component {
    constructor() {
        super('freqSweep');
        this.type = 'freqSweep';
        this.targetVoltage = 5;
        this.voltage = 5;
        this.startFreq = 100;
        this.stopFreq = 10000;
        this.sweepDuration = .001;
        this.currentFreq = this.startFreq;
        this.time = 0;
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+this.GetValue()+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    GetValue() {
        return this.voltage;
    }
    GetStringSuffix() {
        return "V";
    }
    GetInputs(){
        var arr = [["Voltage", formatValue(this.targetVoltage,"V")],["Start Freqeuncy",formatValue(this.startFreq, "Hz")],["Stop Freqeuncy",formatValue(this.stopFreq, "Hz")],["Sweep Duration", formatValue(this.sweepDuration, "s")]];
        //console.log(arr);
        return arr;
    }
    SetValues(arr = []){
        this.targetVoltage = arr[0];
        this.startFreq = arr[1];
        this.stopFreq = arr[2];
        this.sweepDuration = arr[3];
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {
        var startPos = this.startPos;
        var endPos = this.endPos;
        var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2));
        var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI;
        var len = (dist/2) - 25;
        var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y));

        var height1 = 15;
        var height2 = 10;
        var angleModifier = Math.PI/2-0.3;
        if (this.startNode != null && this.endNode != null) {
            var snColor = voltageToHexColor(this.startNode.voltage);
            var enColor = voltageToHexColor(this.endNode.voltage);
            var mid = voltageToHexColor((this.startNode.voltage+this.endNode.voltage)/2);
        }
        p.DrawLine(startPos.x,startPos.y, (Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y), snColor);
        p.DrawLine(endPos.x,endPos.y, (Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y), enColor);

        p.DrawCircle(midpoint.x, midpoint.y, 25, mid);
        if (labelComponentValues) {
            p.DrawTextCentered(midpoint.x, midpoint.y, (this.currentFreq).toPrecision(2));
            p.DrawTextCentered(midpoint.x, midpoint.y+15, "Hz");

            p.DrawText(midpoint.x+30, midpoint.y, formatValue(this.targetVoltage, "V"));
        }

    }
    Update(currentTime, timeStep) {
        //var x = Math.round(currentTime/timeStep) % Math.round(this.sweepDuration/timeStep);
        this.time += timeStep;
        if (this.time >= this.sweepDuration) {this.time = 0;}

        //console.log("t: " + this.time + "   freq: " + this.currentFreq);
        this.currentFreq =  (this.stopFreq - this.startFreq) * (this.time)/(this.sweepDuration)  + this.startFreq;
        if (this.frequency != 0) {
            this.voltage = this.targetVoltage * Math.sin(this.time * this.currentFreq * 6.283185);
        } else {
            this.voltage = this.targetVoltage;
        }
    }
}

class OpAmp extends Component {
    constructor() {
        super('opamp');
        this.type = 'opamp';
        this.minVoltage = -10;
        this.maxVoltage = 10;
        this.maxCurrent = 0.5;

        this.slewRate = 0.000001; //slew rate in voltage per uS

        this.pOutputCurrent = 0;
        this.increasedVoltageLastUpdate = true;

        this.posInputWire = new Wire();
        this.negInputWire = new Wire();
        this.outputVoltageSource1n = new VoltageSource1n();
        
        this.posInputWire.parentComponent = this;
        this.negInputWire.parentComponent = this;
        this.outputVoltageSource1n.parentComponent = this;

        components.push(this.posInputWire);
        components.push(this.negInputWire);
        components.push(this.outputVoltageSource1n);
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+"_"+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {

        //p.DrawLine(this.startPos.x,this.startPos.y,this.endPos.x,this.endPos.y, '#222222');
        
        var a = Math.atan2(this.startPos.y-this.endPos.y, this.startPos.x-this.endPos.x) + Math.PI; //angle from startPos to endPos
        var midpoint = findMidpoint(this.startPos, this.endPos);

        var a1 = a + Math.PI/2; //angle to + terminal  (90 deg/ perpendicular to angle a)

        var sp = new Point(midpoint.x - Math.cos(a)*gridSize, midpoint.y - Math.sin(a)*gridSize); //point on line from startPos to endPos, start of triangle
        var ep = new Point(midpoint.x + Math.cos(a)*gridSize, midpoint.y + Math.sin(a)*gridSize);

        try {
            var plusInputColor = voltageToHexColor(this.posInputWire.startNode.voltage);
            var negInputColor = voltageToHexColor(this.negInputWire.startNode.voltage);
            var avgColor = voltageToHexColor(  (this.posInputWire.startNode.voltage + this.negInputWire.startNode.voltage+this.outputVoltageSource1n.targetVoltage)/3  );
            var outputColor = voltageToHexColor(this.outputVoltageSource1n.targetVoltage);
        }catch(e){

        }

        //Draw line for + and - input pins to triangle
        var l1_1 = new Point(this.startPos.x + Math.cos(a1)*gridSize, this.startPos.y + Math.sin(a1)*gridSize);
        var l1_2 = new Point(sp.x + Math.cos(a1)*gridSize, sp.y + Math.sin(a1)*gridSize);
        var l2_1 = new Point(this.startPos.x - Math.cos(a1)*gridSize, this.startPos.y - Math.sin(a1)*gridSize);
        var l2_2 = new Point(sp.x - Math.cos(a1)*gridSize, sp.y - Math.sin(a1)*gridSize);
        this.posInputWire.startPos = l1_1;
        this.posInputWire.endPos = new Point(l1_1.x+1, l1_1.y+1);
        this.negInputWire.startPos = l2_1;
        this.negInputWire.endPos = new Point(l2_1.x+1, l2_1.y+1);
        p.DrawLine(l1_1.x, l1_1.y, l1_2.x, l1_2.y, plusInputColor);
        p.DrawLine(l2_1.x, l2_1.y, l2_2.x, l2_2.y, negInputColor);
        var l1_2 = new Point(l1_2.x + Math.cos(a)*5, l1_2.y + Math.sin(a)*5);
        if (labelComponentValues) {
            p.DrawTextCentered(l1_2.x + Math.cos(a)*4, l1_2.y + Math.sin(a)*4, "+");
            p.DrawTextCentered(l2_2.x + Math.cos(a)*4, l2_2.y + Math.sin(a)*4, "-");
        }

        //draw triangle
        var t1 = new Point(sp.x + Math.cos(a1)*gridSize*1.8, sp.y + Math.sin(a1)*gridSize*1.8);
        var t2 = new Point(sp.x - Math.cos(a1)*gridSize*1.8, sp.y - Math.sin(a1)*gridSize*1.8);
        var t3 = ep;
        p.DrawTriangle(t1.x, t1.y, t2.x, t2.y, t3.x, t3.y, avgColor);


        //Draw output line
        p.DrawLine(ep.x, ep.y, this.endPos.x, this.endPos.y, outputColor);
        this.outputVoltageSource1n.startPos = new Point(this.endPos.x, this.endPos.y);
        this.outputVoltageSource1n.endPos = midpoint;
    }
    GetInputs(){
        return [["Max Voltage", formatValue(this.maxVoltage,"V")],  ["Min Voltage",formatValue(this.minVoltage, "V")],  ["Slew Rate (per uS)",formatValue(this.slewRate, "V")]  ];
    }
    SetValues(arr = []){
        this.maxVoltage = arr[0];
        this.minVoltage = arr[1];
        this.slewRate = arr[2];
    }

    RecordData()
    {
        if (this.startNode != null)
        {
            this.voltage = this.startNode.voltage;
        }
        this.voltageData.shift(); //remove the first element in the array ( [0,1,2,3,4,5]  ->  [1,2,3,4,5])
        this.currentData.shift();
        this.voltageData.push(this.voltage); //push a new value onto the back
        this.currentData.push(this.current);
    }
    Update(currentTime, timeStep) {
        if (this.posInputWire.voltage == null || this.negInputWire.voltage == null)
        {
            //console.error("one or more inputs are null");
            return;
        }
        var v = (this.slewRate/1000000) * (1/timeStep);
        var current = Math.abs(this.outputVoltageSource1n.current);
        if (this.posInputWire.voltage >= this.negInputWire.voltage) {
            this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  + v )  );
            this.increasedVoltageLastUpdate = true;
            /*
            if (current < this.maxCurrent)
            {
                //increase voltage
                this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  + v )  );
                this.increasedVoltageLastUpdate = true;
            } else {
                if (current > this.pOutputCurrent && this.increasedVoltageLastUpdate == true)
                {
                    //decrease voltage - drawing too much current
                    this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  - v )  );
                    this.increasedVoltageLastUpdate = false;
                } else {
                    //increase voltage - drawing too much current
                    this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  + v )  );
                    this.increasedVoltageLastUpdate = true;
                }
            }*/
        } else {
            this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  - v )  );
            this.increasedVoltageLastUpdate = false;
            /*if (current < this.maxCurrent)
            {
                //increase voltage
                this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  - v )  );
                this.increasedVoltageLastUpdate = false;
            } else {
                if (current > this.pOutputCurrent && this.increasedVoltageLastUpdate == true)
                {
                    //decrease voltage - drawing too much current
                    this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  - v )  );
                    this.increasedVoltageLastUpdate = false;
                } else {
                    //increase voltage - drawing too much current
                    this.outputVoltageSource1n.targetVoltage = Math.max(this.minVoltage, Math.min( this.maxVoltage,    this.outputVoltageSource1n.targetVoltage  + v )  );
                    this.increasedVoltageLastUpdate = true;
                }
            }*/
        }
        this.outputVoltageSource1n.voltage = this.outputVoltageSource1n.targetVoltage;
        this.pOutputCurrent = current;
    }

    Delete() {
        this.posInputWire.Delete();
        this.negInputWire.Delete();
        this.outputVoltageSource1n.Delete();

        removeComponentFromList(components, this.posInputWire);
        removeComponentFromList(components, this.negInputWire);
        removeComponentFromList(components, this.outputVoltageSource1n);
    }
}

class Diode extends Component {
    constructor() {
        super('diode');
        this.type = 'diode';
        this.thresholdVoltage = 0.7;
        this.breakdownVoltage = 1000000000;

        this.inActiveMode = false;
        this.inBreakdownMode = false;

        this.voltageSource2n = new VoltageSource2n();
        this.resistorParallel = new Resistor();
        this.resistorParallel.resistance = 1000000000;
        this.internalResistor = new Resistor();
        this.internalResistor.resistance = 0.01;

        this.voltageSource2n.parentComponent = this;
        this.resistorParallel.parentComponent = this;
        this.internalResistor.parentComponent = this;

        components.push(this.voltageSource2n);
        components.push(this.resistorParallel);
        components.push(this.internalResistor);
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+"_"+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    Draw(p, labelComponentNames = false, labelComponentValues = false) {

        var a = Math.atan2(this.startPos.y-this.endPos.y, this.startPos.x-this.endPos.x) + Math.PI; //angle from startPos to endPos
        var midpoint = findMidpoint(this.startPos, this.endPos);
        var dist = distBetweenPoints(this.startPos, this.endPos);
        var size = 10;
        var len = dist/2 - size;
        var p1 = new Point(this.startPos.x + len*Math.cos(a), this.startPos.y + len*Math.sin(a));
        var p2 = new Point(this.endPos.x - len*Math.cos(a), this.endPos.y - len*Math.sin(a));
        
        if (this.resistorParallel != null && this.resistorParallel.startNode != null && this.resistorParallel.endNode != null) {
            var snColor = voltageToHexColor(this.resistorParallel.startNode.voltage);
            var enColor = voltageToHexColor(this.resistorParallel.endNode.voltage);
            var mid = voltageToHexColor((this.resistorParallel.startNode.voltage+this.resistorParallel.endNode.voltage)/2);
            this.internalResistor.startNode.drawGraphics = false;
        }


        p.DrawLine(this.startPos.x, this.startPos.y, p1.x, p1.y, snColor);
        p.DrawLine(this.endPos.x, this.endPos.y, p2.x, p2.y, enColor);

        var a1 = a + Math.PI/2; //angle to + terminal  (90 deg/ perpendicular to angle a)

        var p3 = new Point(p1.x + size*Math.cos(a1), p1.y + size*Math.sin(a1));
        var p4 = new Point(p1.x - size*Math.cos(a1), p1.y - size*Math.sin(a1));
        var p5 = new Point(p2.x + size*Math.cos(a1), p2.y + size*Math.sin(a1));
        var p6 = new Point(p2.x - size*Math.cos(a1), p2.y - size*Math.sin(a1));
        p.DrawLine(p3.x, p3.y, p4.x, p4.y, mid);//back line
        p.DrawLine(p5.x, p5.y, p6.x, p6.y, mid);//front line

        p.DrawLine(p3.x, p3.y, p2.x, p2.y, mid);//angles
        p.DrawLine(p4.x, p4.y, p2.x, p2.y, mid);

        if (this.breakdownVoltage < 100000000)
        {
            var a2 = a1 + Math.PI/4;
            p.DrawLine(p5.x, p5.y, p5.x + size*Math.cos(a2)/2, p5.y + size*Math.sin(a2)/2, mid);
            p.DrawLine(p6.x, p6.y, p6.x - size*Math.cos(a2)/2, p6.y - size*Math.sin(a2)/2, mid);
        }

        this.voltageSource2n.startPos = this.startPos;
        this.voltageSource2n.endPos = new Point(midpoint.x+1, midpoint.y);
        this.internalResistor.startPos = new Point(midpoint.x+1, midpoint.y);
        this.internalResistor.endPos = this.endPos;
        this.resistorParallel.startPos = this.startPos;
        this.resistorParallel.endPos = this.endPos;
    }
    GetInputs(){
        return [["Threshold Voltage", formatValue(this.thresholdVoltage,"V")],  ["Breakdown Voltage", formatValue(this.breakdownVoltage,"V")], ["Internal Resistance", formatValue(this.internalResistor.resistance, "Ω")]];
    }
    SetValues(arr = []){
        this.thresholdVoltage = arr[0];
        this.breakdownVoltage = arr[1];
        this.internalResistor.resistance = arr[2];
    }

    RecordData()
    {
        if (this.startNode != null)
        {
            this.voltage = this.startNode.voltage;
        }
        this.voltageData.shift(); //remove the first element in the array ( [0,1,2,3,4,5]  ->  [1,2,3,4,5])
        this.currentData.shift();
        this.voltageData.push(this.resistorParallel.voltage); //push a new value onto the back
        this.currentData.push(this.voltageSource2n.current);
    }
    Update(currentTime, timeStep) {
        if (this.voltageSource2n.enabled == true) //if the voltage source is on, make sure the current is -
        {
            if (this.inBreakdownMode)
            {
                if (this.voltageSource2n.current <= 0)
                {
                    //do nothing
                    this.voltageSource2n.voltage = this.breakdownVoltage;
                } else {
                    this.inBreakdownMode = false;
                    this.voltageSource2n.enabled = false;
                    this.voltageSource2n.voltage = -this.thresholdVoltage;
                }
            } else {
                if (this.voltageSource2n.current >= 0)
                {
                    //do nothing
                    this.voltageSource2n.voltage = -this.thresholdVoltage;
                } else {
                    //if current is positive (flowing out of the source) we don't want it to be enabled!
                    this.voltageSource2n.enabled = false;
                    this.inActiveMode = false;
                }
            }
        } else {
            //if the voltage source is off, should it be on?
            if (this.resistorParallel.voltage > this.thresholdVoltage-.01)
            {
                //It should be on! 
                this.inActiveMode = true;
                this.voltageSource2n.enabled = true;
                this.voltageSource2n.voltage = -this.thresholdVoltage;
            } else if (this.resistorParallel.voltage < -this.breakdownVoltage)
            {
                //Uhhu! breakdown! voltage too high!
                this.inBreakdownMode = true;
                this.voltageSource2n.enabled = true;
                this.voltageSource2n.voltage = this.breakdownVoltage;
            }
        }
    }

    Delete() {
        this.voltageSource2n.Delete();
        removeComponentFromList(components, this.voltageSource2n);
    }
}



class Text extends Component {
    constructor() {
        super('text');
        this.type = 'text';
        this.color = 'white';
        this.text = 'default_text';
    }
    GetEncodedDataString() {
        return this.type+" "+this.name+" "+"_"+" "+this.startPos.x+" "+this.startPos.y+" "+this.endPos.x+" "+this.endPos.y+" ";
    }
    Draw(p) {
        p.DrawTextCentered(this.startPos.x, this.startPos.y, this.text, this.color);
    }
    Update()
    {
        this.endPos.x = this.startPos.x + 1;
        this.endPos.y = this.startPos.y + 1;
    }

    GetInputs(){
        return [["Text", this.text],] ;
    }
    SetValues(arr = []){
        this.text = arr[0];
    }
}







function voltageToHexColor(v)
{
    var abs = (v)*25;
    return rgbToHex(255-abs, 255+abs, 255-Math.abs(abs));
}