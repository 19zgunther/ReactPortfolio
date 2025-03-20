
//Graphical functions ----------------------------------------------------------------------------------------------------------------

function UpdateDisplay(p) {
    if (!(p instanceof Painter))
    {
        console.error("UpdateDisplay needs a Painter object to run");
        return;
    }

    var drawComponentValues = LabelComponentValuesCheckboxElement.checked;
    var drawComponentNames = LabelComponentNamesCheckboxElement.checked;

    p.Clear(); //clear the entire screen
    p.SetFillColor('white');
    p.SetStrokeColor('white');
    p.SetTextColor('white');
    p.SetTextSize(15);

    //Draw each of the components////////////////////////////////////////////////////////////
    for (var i=0; i<components.length; i++)
    {
        if (components[i] == selectedComponent) //if the component == selectedComponent, make it more bold so we can easily see it's the selected Component
        {
            p.SetStrokeWidth(2);
        } else {
            p.SetStrokeWidth(1);
        }
        components[i].Draw(p, drawComponentNames, drawComponentValues);
    }
    
    p.SetStrokeWidth(1);

    //Label each node////////////////////////////////////////////////////////////////////
    for (var i=0; i<nodes.length; i++)
    {
        if ( nodes[i].drawGraphics == false ) {continue;} //for internal nodes (inside of diodes and such)
    
        for (var j=0; j<nodes[i].points.length; j++)
        {
            //p.SetFillColor(rgbToHex(-nodes[i].voltage*25, nodes[i].voltage*25, 0));
            //var val = 255-Math.abs(nodes[i].voltage*25);
            p.SetStrokeColor(voltageToHexColor(nodes[i].voltage));
            p.DrawCircleFilled(nodes[i].points[j].x, nodes[i].points[j].y, nodeSize , voltageToHexColor(nodes[i].voltage));
        }

        //Labeling the node & drawing the voltage. We must check the checkbox elements to see what the user wants displayed
        if (LabelNodesCheckboxElement.checked ==true && LabelNodeValuesCheckboxElement.checked ==true && nodes[i].voltage != null)
        {
            p.DrawText(nodes[i].points[0].x+5,nodes[i].points[0].y-8,nodes[i].name + ": "+(nodes[i].voltage).toPrecision(3)+"v");
        } else if (LabelNodesCheckboxElement.checked) {
            p.DrawText(nodes[i].points[0].x+5,nodes[i].points[0].y-8,nodes[i].name);
        } else if (LabelNodeValuesCheckboxElement.checked && nodes[i].voltage != null) {
            p.DrawText(nodes[i].points[0].x+5,nodes[i].points[0].y-8,(nodes[i].voltage).toPrecision(3)+"v");
        }        
    }

    //Misc UI Stuff//////////////////////////////////////////////////////////////////
    //Lets check if the selected component is currently being plotted or not, so we can enable the AddPlotButton and RemovePlotButton accordingly
    if (plotManager.GetPlotOfComponent(selectedComponent) != null) {
        RemovePlotButtonElement.style.display = "block";
        AddPlotButtonElement.style.display = "none";
        IncreasePlotScaleButtonElement.style.display = "block";
        DecreasePlotScaleButtonElement.style.display = "block";
    } else {
        RemovePlotButtonElement.style.display = "none";
        if (selectedComponent != null) {
            AddPlotButtonElement.style.display = "block";
        } else {
            AddPlotButtonElement.style.display = "none";
        }
        IncreasePlotScaleButtonElement.style.display = "none";
        DecreasePlotScaleButtonElement.style.display = "none";
    }

    
    if (selectedComponent != null)
    {
        SelectedComponentElement.innerHTML = "Selected Comp: " + selectedComponent.type + "  " + selectedComponent.name; 
    } else {
        SelectedComponentElement.innerHTML = "Selected Comp: None";
    }
    /*
    if (editingComponentValue == false && selectedComponent != null && selectedComponent.type != "wire")
    {
        ValueInputTextElement.style.width = "100px";
        ValueInputTextElement.value = formatValue( selectedComponent.GetValue(),  selectedComponent.GetStringSuffix());
    } else if (editingComponentValue == false){
        ValueInputTextElement.style.width = "5px";
    }*/

    if (selectedComponent == null)
    {
        GridElement.style.display = "none";
    } else if (editingComponentValue == false) {
        GridElement.style.display = "block";
        var inputs = selectedComponent.GetInputs();
        for (var i=0; i<GridTextElements.length; i++)
        {
            if (i < inputs.length)
            {
                GridTextElements[i].style.display = "block";
                GridInputElements[i].style.display = "block";
                GridTextElements[i].innerHTML = inputs[i][0];
                GridInputElements[i].value = inputs[i][1];
            } else {
                GridTextElements[i].style.display = "none";
                GridInputElements[i].style.display = "none";
            }
        }
    }

}















/*

function DrawPlot_OLD(comp, pos, yAxisStep, currentScale, maxHeight, maxWidth, AutoScale = true, timeScale = 1) {
    if (comp == null || pos == null)
    {
        return;
    }


    var voltageScale;
    if (AutoScale == true) {
        var maxV = 0;
        var maxC = 0;
        var index = 0;
        for (var i=0; i<Math.min(comp.voltageData.length, maxWidth); i++) {
            index = comp.voltageData.length-i;
            if (index < 0) { index -+ comp.voltageData.length;}
            if (Math.abs(comp.voltageData[index]) > maxV) {
                maxV = Math.abs(comp.voltageData[index]);
            }
        }
        for (var i=0; i<Math.min(comp.voltageData.length, maxWidth); i++) {
            index = comp.currentData.length-i;
            if (index < 0) { index -+ comp.currentData.length;}
            if (Math.abs(comp.currentData[index]) > maxC) {
                maxC = Math.abs(comp.currentData[index]);
            }
        }

        voltageScale = Math.ceil((maxHeight/2 - 20)/maxV);
        currentScale = Math.ceil((maxHeight/2 - 20)/maxC);
        var t = Math.ceil(Number(-numLines*gridLineStep/voltageScale).toPrecision(2));
    }

    var gridLineStep = 25;
    var currentTextXOffset = 35;
    var textYOffset = 0;
    var numLines = Math.ceil((maxHeight/gridLineStep)/2);

    strokeWeight(1);
    textSize(10);

    //draw horizontal grids and labels
    for (var i=-numLines+1; i<numLines; i++)
    {
        stroke(100-abs(i*10));
        line(pos.x, pos.y+i*gridLineStep, pos.x+maxWidth, pos.y+i*gridLineStep);
        stroke(0,0,0);
        fill(0,200,0);
        text(Number(-i*gridLineStep/voltageScale).toPrecision(4), pos.x,pos.y+i*gridLineStep+textYOffset);
        stroke(0,0,0);
        fill(200,200,0);
        text(Number(-i*gridLineStep/currentScale).toPrecision(4), pos.x+currentTextXOffset ,pos.y+i*gridLineStep+textYOffset);
    }



    //draw voltage

    stroke(0,255,0);
    var x = comp.voltageData.length-1;
    for (var i=0; i<maxWidth; i++)
    {
        line(pos.x-i+maxWidth,  pos.y-voltageScale*comp.voltageData[round(x)],  pos.x-i+maxWidth-1,  pos.y-voltageScale*comp.voltageData[round(x-timeScale)]);
        x -= timeScale;
    }
    //line(pos.x+maxWidth, 0, pos.x, 1000);

    //draw current

    stroke(255,255,0);
    var x = comp.currentData.length-1;
    for (var i=0; i<maxWidth; i++)
    {
        line(pos.x-i+maxWidth,  pos.y-currentScale*comp.currentData[round(x)],  pos.x-i+maxWidth-1,  pos.y-currentScale*comp.currentData[round(x-timeScale)]);
        x -= timeScale;
    }

    

    //draw mouse vertical line
    if (mouseX > pos.x && mouseX < pos.x+maxWidth && mouseY > pos.y-maxHeight/2 && mouseY < pos.y+maxHeight/2)
    {
        var x = Math.floor(pos.x + maxWidth - mouseX);
        var index = comp.dataStart - x;
        if (index < 0) { index += comp.voltageData.length; }
        
        //getting the pixel vertical position of the voltage and current lines at [index] (where the mouse is on the plot)
        var voltagePosY = pos.y-voltageScale*comp.voltageData[index];
        var currentPosY = pos.y-currentScale*comp.currentData[index];

        if (Math.abs(voltagePosY-mouseY) < Math.abs(currentPosY-mouseY)) //if the voltage line is closer to the mouse...
        {
            stroke(0,200,0);
            fill(0,200,0);
            line(mouseX, pos.y-maxHeight/2, mouseX, pos.y+maxHeight/2);
            stroke(0,0,0);
            text(Number(comp.voltageData[index]).toPrecision(5), mouseX, mouseY);
        } else { //if the current line is closer....
            stroke(200,200,0);
            fill(200,200,0);
            line(mouseX, pos.y-maxHeight/2, mouseX, pos.y+maxHeight/2);
            stroke(0,0,0);
            text(Number(comp.currentData[index]).toPrecision(5), mouseX, mouseY);
        }
    }



    stroke(255);
    noFill();
    rect(pos.x, pos.y-maxHeight/2, maxWidth, maxHeight);
}


function DrawPlot(plot, pos, width, height, yAxisGridScale, timeScale, autoYScaleEnable)
{
    if (plot.component == null || pos == null)
    {
        return;
    }
    strokeWeight(1);
    stroke(100);
    textSize(10);
    line(pos.x, pos.y, pos.x+width, pos.y);
    line(pos.x, pos.y, pos.x, pos.y+height);
    line(pos.x+width, pos.y+height, pos.x+width, pos.y);
    line(pos.x+width, pos.y+height, pos.x, pos.y+height);

    
    var gridLineSpacing = 20;
    var voltageScale = gridLineSpacing / yAxisGridScale;



    //draw horizontal grids and labels
    for (var i=-numLines+1; i<numLines; i++)
    {
        console.log("HERE2");
        stroke(100-abs(i*10));
        line(pos.x, pos.y+i*gridLineStep, pos.x+maxWidth, pos.y+i*gridLineStep);
        stroke(0,0,0);
        fill(0,200,0);
        text(Number(-i*plot.yAxisGridScale).toPrecision(4), pos.x,pos.y+i*gridLineStep+textYOffset);
        stroke(0,0,0);
        fill(200,200,0);
        text(Number(-i*plot.yAxisGridScale).toPrecision(4), pos.x+currentTextXOffset ,pos.y+i*gridLineStep+textYOffset);
    }


    var vData = plot.component.voltageData;
    var cData = plot.component.currentData;

    var xPos = pos.x + width;
    var centerY = pos.y + height/2;
    var vDataY1;
    var vDataY2;
    var vMaxVal = 0;
    var cDataY1;
    var cDataY2;
    var cMaxVal = 0;
    for (var i=1; i<width; i++)
    {
        if ( i < vData.length-1)
        {
            vDataY1 = vData[vData.length-i]*voltageScale;
            vDataY2 = vData[vData.length-i-1]*voltageScale;
            if (isNaN(vDataY2) == true || isNaN(vDataY1) == true)
            {
                continue;
            }
            vMaxVal = max(vMaxVal, abs(vDataY1));
            line( xPos, centerY + vDataY1,  xPos-1, centerY + vDataY2 );

        }

        if ( i < cData.length-1)
        {
            cDataY1 = cData[cData.length-i]*currentScale;
            cDataY2 = cData[cData.length-i-1]*currentScale;
            if (isNaN(cDataY2) == true || isNaN(cDataY1) == true)
            {
                continue;
            }
            cMaxVal = max(cMaxVal, abs(cDataY1));
            line( xPos, centerY + cDataY1,  xPos-1, centerY + cDataY2 );
        }
        xPos -= 1;
    }

    if (vMaxVal > height/2 - 10)
    {
        plot.IncreaseVoltageYScale();
    } else if (vMaxVal < height/4)
    {
        plot.DecreaseVoltageYScale();
    }



    return;
    var voltageScale = 1;
    if (plot.AutoScale == true) {
        var maxV = 0;
        var maxC = 0;
        var index = 0;
        for (var i=0; i<Math.min(comp.voltageData.length, maxWidth); i++) {
            index = comp.voltageData.length-i;
            if (index < 0) { index -+ comp.voltageData.length;}
            if (Math.abs(comp.voltageData[index]) > maxV) {
                maxV = Math.abs(comp.voltageData[index]);
            }
        }
        for (var i=0; i<Math.min(comp.voltageData.length, maxWidth); i++) {
            index = comp.currentData.length-i;
            if (index < 0) { index -+ comp.currentData.length;}
            if (Math.abs(comp.currentData[index]) > maxC) {
                maxC = Math.abs(comp.currentData[index]);
            }
        }

        voltageScale = Math.ceil((maxHeight/2 - 20)/maxV);
        currentScale = Math.ceil((maxHeight/2 - 20)/maxC);
        var t = Math.ceil(Number(-numLines*gridLineStep/voltageScale).toPrecision(2));
    }


    var gridLineStep = 20;
    var currentTextXOffset = 35;
    var textYOffset = 0;
    var numLines = Math.ceil((maxHeight/gridLineStep)/2);

    strokeWeight(1);
    textSize(10);

    //draw horizontal grids and labels
    for (var i=-numLines+1; i<numLines; i++)
    {
        console.log("HERE2");
        stroke(100-abs(i*10));
        line(pos.x, pos.y+i*gridLineStep, pos.x+maxWidth, pos.y+i*gridLineStep);
        stroke(0,0,0);
        fill(0,200,0);
        text(Number(-i*plot.yAxisGridScale).toPrecision(4), pos.x,pos.y+i*gridLineStep+textYOffset);
        stroke(0,0,0);
        fill(200,200,0);
        text(Number(-i*plot.yAxisGridScale).toPrecision(4), pos.x+currentTextXOffset ,pos.y+i*gridLineStep+textYOffset);
    }



    //draw voltage
    
    stroke(0,255,0);
    var x = comp.voltageData.length-1;
    for (var i=0; i<maxWidth; i++)
    {
        line(pos.x-i+maxWidth,  pos.y-voltageScale*comp.voltageData[round(x)],  pos.x-i+maxWidth-1,  pos.y-voltageScale*comp.voltageData[round(x-timeScale)]);
        x -= timeScale;
    }
    //line(pos.x+maxWidth, 0, pos.x, 1000);

    //draw current
    stroke(255,255,0);
    var x = comp.currentData.length-1;
    for (var i=0; i<maxWidth; i++)
    {
        line(pos.x-i+maxWidth,  pos.y-currentScale*comp.currentData[round(x)],  pos.x-i+maxWidth-1,  pos.y-currentScale*comp.currentData[round(x-timeScale)]);
        x -= timeScale;
    }

    

    //draw mouse vertical line
    if (mouseX > pos.x && mouseX < pos.x+maxWidth && mouseY > pos.y-maxHeight/2 && mouseY < pos.y+maxHeight/2)
    {
        var x = Math.floor(pos.x + maxWidth - mouseX);
        var index = comp.dataStart - x;
        if (index < 0) { index += comp.voltageData.length; }
        
        //getting the pixel vertical position of the voltage and current lines at [index] (where the mouse is on the plot)
        var voltagePosY = pos.y-voltageScale*comp.voltageData[index];
        var currentPosY = pos.y-currentScale*comp.currentData[index];

        if (Math.abs(voltagePosY-mouseY) < Math.abs(currentPosY-mouseY)) //if the voltage line is closer to the mouse...
        {
            stroke(0,200,0);
            fill(0,200,0);
            line(mouseX, pos.y-maxHeight/2, mouseX, pos.y+maxHeight/2);
            stroke(0,0,0);
            text(Number(comp.voltageData[index]).toPrecision(5), mouseX, mouseY);
        } else { //if the current line is closer....
            stroke(200,200,0);
            fill(200,200,0);
            line(mouseX, pos.y-maxHeight/2, mouseX, pos.y+maxHeight/2);
            stroke(0,0,0);
            text(Number(comp.currentData[index]).toPrecision(5), mouseX, mouseY);
        }
    }



    stroke(255);
    noFill();
    rect(pos.x, pos.y-maxHeight/2, maxWidth, maxHeight);
}



function DrawSlider(pos, width, thickness, val) {
    //position is the upper left corner of the object
    //width is how long/wide the slider is
    //thickness = the height/thickness of the slider
    //val is a value from 0 to 1 describing where the slider circle should be set to 
    
    strokeWeight(0);
    fill(150);
    rect(pos.x+thickness/2, pos.y, width-thickness, thickness);
    circle(pos.x+thickness/2, pos.y+thickness/2, thickness);
    circle(pos.x+width-thickness/2, pos.y+thickness/2, thickness);

    //centering the val
    if (val > 1) {val = 1;} 
    else if (val < 0) { val = 0;}
    fill(255);
    circle(pos.x+width*val, pos.y+thickness/2, thickness*2);
}

function DrawTextbox(pos, width, height, textSize_, text_)
{
    text_ = " " + text_;
    if (textSize_ == "default" || textSize_ == "auto" || textSize_ == null || textSize_ < 2)
    {
        textSize_ = 20;
    }
    if (width == "auto")
    {
        width = Math.max(text_.length*textSize_/1.9, 20);
    } else if (width == "defualt")
    {
        width = 50;
    }
    if (height == "auto" || height == "default")
    {
        height = textSize_;
    }
    stroke(200);
    strokeWeight(1);
    noFill();
    rect(pos.x, pos.y, width, height,4);
    stroke(0);
    fill(200);
    textSize(textSize_);
    text(text_, pos.x, pos.y+textSize_-2);
}

function DrawButton(pos, width, height, textSize_, text_, r,g,b)
{
    if (r == null)
    {
        r = 0.5;
        g = 0.5;
        b = 0.5;
    }
    stroke(0,0,0);
    fill(r*255,g*255,b*255);
    rect(pos.x,pos.y,width,height,4);
    fill(255);
    textSize(textSize_);
    text(text_, pos.x + (width - textWidth(text_))/2, pos.y+height/2+textSize_/2-2);
}

function drawWire(comp)
{
    line(comp.startPos.x,comp.startPos.y,comp.endPos.x,comp.endPos.y);
    var midpoint = findMidpoint(comp.startPos, comp.endPos);
}

function drawResistor(comp)
{   //draws resistor on canvas
    var startPos = comp.startPos;  //comp = a resistor Component object
    var endPos = comp.endPos;
    var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2)); //distance between startPos and endPos (start & end positions x and y)
    var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI; //angle from startPos to endPos, offset by Math.PI because it works
    var len = (dist/2) - 20; //length from each point to center minus resistor box length
    line(startPos.x,startPos.y, (Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y)); //drawing line from startPos
    line(endPos.x,endPos.y, (Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y)); //drawing line from endPos

    var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y)); //find the midpoint between startPos and endPos
    var height = 20; //this is the distance the points below are from the midpoint
    var angleModifier = 0.3; //how much we deviate from initial angle to draw 4 points which will make the box
    var p1 = new Point((Math.cos(angle+angleModifier)*height+midpoint.x),(Math.sin(angle+angleModifier)*height+midpoint.y)); //these 4 points make up a rectangle
    var p2 = new Point((Math.cos(angle-angleModifier)*height+midpoint.x),(Math.sin(angle-angleModifier)*height+midpoint.y));
    var p3 = new Point((Math.cos(angle+angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle+angleModifier+Math.PI)*height+midpoint.y));
    var p4 = new Point((Math.cos(angle-angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle-angleModifier+Math.PI)*height+midpoint.y));
    line(p1.x,p1.y,p2.x,p2.y); //actually drawing the box now (4 lines)
    line(p3.x,p3.y,p4.x,p4.y);
    line(p1.x,p1.y,p4.x,p4.y);
    line(p2.x,p2.y,p3.x,p3.y);
    if (labelComponentNames == true) {
        fill(255,255,255);
        stroke(5);
        //strokeWeight(1);
        textSize(labelTextSize);
        text("R"+comp.name+": "+comp.GetValueString(), midpoint.x, midpoint.y);
    }
}

function drawCapacitor(comp)
{
    var startPos = comp.startPos;
    var endPos = comp.endPos;
    var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2));
    var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI;
    var len = (dist/2) - 7;
    var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y));

    var height = 20;
    var angleModifier = Math.PI/2-0.3;
    var ps = new Point((Math.cos(angle)*len+startPos.x),(Math.sin(angle)*len+startPos.y));
    var pe = new Point((Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
    line(startPos.x,startPos.y, ps.x, ps.y);
    line(endPos.x,endPos.y, pe.x, pe.y);
    var p1 = new Point((Math.cos(angle+angleModifier)*height+midpoint.x),(Math.sin(angle+angleModifier)*height+midpoint.y));
    var p2 = new Point((Math.cos(angle-angleModifier)*height+midpoint.x),(Math.sin(angle-angleModifier)*height+midpoint.y));
    var p3 = new Point((Math.cos(angle+angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle+angleModifier+Math.PI)*height+midpoint.y));
    var p4 = new Point((Math.cos(angle-angleModifier+Math.PI)*height+midpoint.x),(Math.sin(angle-angleModifier+Math.PI)*height+midpoint.y));
    line(p1.x,p1.y,p2.x,p2.y);
    line(p3.x,p3.y,p4.x,p4.y);


    var size = 5;
    if (comp.voltage > 0) { 
        var p5 = new Point(pe.x + 15*Math.cos(angle+Math.PI/3), pe.y + 15*Math.sin(angle+Math.PI/3));
        var p6 = new Point(p5.x + size*2*Math.cos(angle), p5.y + size*2*Math.sin(angle));
        var p7 = new Point(p5.x + size*1.5*Math.cos(angle+Math.PI/4), p5.y + size*1.5*Math.sin(angle+Math.PI/4));
        var p8 = new Point(p5.x + size*1.5*Math.cos(angle-Math.PI/4), p5.y + size*1.5*Math.sin(angle-Math.PI/4));
        line(p5.x,p5.y,p6.x,p6.y);
        line(p7.x,p7.y,p8.x,p8.y);
    } else {
        var p5 = new Point(ps.x + 15*Math.cos(angle+Math.PI/3), ps.y - 15*Math.sin(angle+Math.PI/3));
        var p6 = new Point(p5.x - size*2*Math.cos(angle), p5.y - size*2*Math.sin(angle));
        var p7 = new Point(p5.x - size*1.5*Math.cos(angle+Math.PI/4), p5.y - size*1.5*Math.sin(angle+Math.PI/4));
        var p8 = new Point(p5.x - size*1.5*Math.cos(angle-Math.PI/4), p5.y - size*1.5*Math.sin(angle-Math.PI/4));
        line(p5.x,p5.y,p6.x,p6.y);
        line(p7.x,p7.y,p8.x,p8.y);
    }


    if (labelComponentNames == true) {
        fill(255,255,255);
        stroke(5);
        //strokeWeight(1);
        textSize(labelTextSize);
        text("C"+comp.name+": "+comp.GetValueString(), midpoint.x, midpoint.y);
    }
}

function drawInductor(comp)
{
    //draws inductor on canvas
    var startPos = comp.startPos;  //comp = a resistor Component object
    var endPos = comp.endPos;
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

    line(startPos.x,startPos.y, ps1.x, ps1.y); //drawing line from startPos
    line(endPos.x,endPos.y, pe1.x, pe1.y); //drawing line from endPos
    
    arc(ps2.x,ps2.y, 10,10, 0+angle, Math.PI+angle);
    arc(ps3.x,ps3.y, 10,10, 0+angle, Math.PI+angle);
    arc(pe2.x,pe2.y, 10,10, 0+angle, Math.PI+angle);
    arc(pe3.x,pe3.y, 10,10, 0+angle, Math.PI+angle);


    //this is all for drawing the arrow next to the inductor specifying current direction
    var height = 13;
    len = dist/2 - 15;
    var p1 = new Point((Math.cos(angle)*len+startPos.x+Math.cos(angle+Math.PI/2)*height), (Math.sin(angle)*len+startPos.y+Math.sin(angle+Math.PI/2)*height));
    var p2 = new Point((Math.cos(angle+Math.PI)*len+endPos.x+Math.cos(angle+Math.PI/2)*height), (Math.sin(angle+Math.PI)*len+endPos.y+Math.sin(angle+Math.PI/2)*height));
    var p3;
    var p4;
    var armLength = 5;

    if (comp.current < 0)
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

    if (comp.current != 0)
    {
        line(p1.x,p1.y,p2.x,p2.y);
        line(p1.x,p1.y,p3.x,p3.y);
        line(p1.x,p1.y,p4.x,p4.y);
    }




    if (labelComponentNames == true) {
        fill(255,255,255);
        stroke(5);
        //strokeWeight(1);
        textSize(labelTextSize);
        text("L"+comp.name+": "+comp.GetValueString(), midpoint.x, midpoint.y);
    }
}

function drawVoltageSource1n(comp)
{
    line(comp.startPos.x,comp.startPos.y,comp.endPos.x,comp.endPos.y);
    //strokeWeight(2);
    line(comp.endPos.x - 10, comp.endPos.y, comp.endPos.x + 10, comp.endPos.y);
    if (comp.startPos.y > comp.endPos.y) //slope down, so draw number below.
    {
        fill(255,255,255);
        stroke(5);
        //strokeWeight(1);
        textSize(labelTextSize);
        text("Vn"+comp.name+": "+comp.GetValueString(), comp.endPos.x-8, comp.endPos.y-5);
    } else {
        fill(255,255,255);
        stroke(5);
        //strokeWeight(1);
        textSize(labelTextSize);
        text("Vn"+comp.name+": "+comp.GetValueString(), comp.endPos.x-8, comp.endPos.y+10);
    }
    
    if (labelComponentNames == true) {
        //fill(255,255,255);
        //strokeWeight(1);
        textSize(labelTextSize);
        text(comp.name, midpoint.x, midpoint.y);
    }
}

function drawVoltageSource2n(comp)
{
    var startPos = comp.startPos;
    var endPos = comp.endPos;
    var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2));
    var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI;
    var len = (dist/2) - 7;
    var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y));

    var height1 = 20;
    var height2 = 10;
    var angleModifier = Math.PI/2-0.3;
    line(startPos.x,startPos.y, (Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y));
    line(endPos.x,endPos.y, (Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
    var p1 = new Point((Math.cos(angle+angleModifier)*height1+midpoint.x),(Math.sin(angle+angleModifier)*height1+midpoint.y));
    var p2 = new Point((Math.cos(angle-angleModifier)*height1+midpoint.x),(Math.sin(angle-angleModifier)*height1+midpoint.y));
    var p3 = new Point((Math.cos(angle+angleModifier+Math.PI)*height2+midpoint.x),(Math.sin(angle+angleModifier+Math.PI)*height2+midpoint.y));
    var p4 = new Point((Math.cos(angle-angleModifier+Math.PI)*height2+midpoint.x),(Math.sin(angle-angleModifier+Math.PI)*height2+midpoint.y));
    line(p1.x,p1.y,p2.x,p2.y);
    line(p3.x,p3.y,p4.x,p4.y);

    if (labelComponentNames == true) {
        fill(255,255,255);
        stroke(5);
        //strokeWeight(1);
        textSize(labelTextSize);
        text("Vs"+comp.name+": "+comp.GetValueString(), midpoint.x, midpoint.y);
    }
}

function drawCurrentSource(comp)
{
    var startPos = comp.startPos;
    var endPos = comp.endPos;
    var dist = Math.sqrt(Math.pow(startPos.x-endPos.x,2) + Math.pow(startPos.y-endPos.y,2));
    var angle = Math.atan2(startPos.y-endPos.y, startPos.x-endPos.x) + Math.PI;
    var len = (dist/2) - 15;
    var midpoint = new Point((Math.cos(angle)*dist/2+startPos.x),(Math.sin(angle)*dist/2+startPos.y));
    //fill(0,0,0,0);
    circle(midpoint.x, midpoint.y, 30);

    var height = 10;
    var angleModifier = Math.PI/2-0.3;
    line(startPos.x,startPos.y, (Math.cos(angle)*len+startPos.x), (Math.sin(angle)*len+startPos.y));
    line(endPos.x,endPos.y, (Math.cos(angle+Math.PI)*len+endPos.x), (Math.sin(angle+Math.PI)*len+endPos.y));
    var p1 = new Point((Math.cos(angle)*height+midpoint.x),(Math.sin(angle)*height+midpoint.y));
    var p2 = new Point((Math.cos(angle+Math.PI)*height+midpoint.x),(Math.sin(angle+Math.PI)*height+midpoint.y));

    var p3 = new Point((Math.cos(angle+Math.PI/2)*height+midpoint.x),(Math.sin(angle+Math.PI/2)*height+midpoint.y));
    var p4 = new Point((Math.cos(angle-Math.PI/2)*height+midpoint.x),(Math.sin(angle-Math.PI/2)*height+midpoint.y));
    line(p1.x,p1.y,p2.x,p2.y);
    line(p3.x,p3.y,p1.x,p1.y);
    line(p4.x,p4.y,p1.x,p1.y);

    if (labelComponentNames == true) {
        fill(255,255,255);
        stroke(5);
        //strokeWeight(1);
        textSize(labelTextSize);
        text("I"+comp.name+": "+comp.GetValueString(), midpoint.x, midpoint.y);
    }
}

*/