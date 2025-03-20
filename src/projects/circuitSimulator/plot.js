
const PlotYAxisIntervals = [10000000000,5000000000,100000000,50000000,10000000,5000000,1000000,500000,100000,50000,10000,5000,1000,500,100,50,25,10,5,2,1,0.5,0.25,0.2,0.1,0.05,0.025,0.02,0.01,0.005,0.0025,0.002,0.001,0.0005,0.00025,0.0002,0.0001,0.00005,0.00001,0.000005,0.000001];

class Plot {
    constructor(comp){
        this.component = comp;
        this.horizontalModifier = 1;

        this.autoYScaleEnable = false;
        this.voltageYAxisGridScaleIndex = 18; //index of PlotYAxisIntervals[13] = 1
        this.currentYAxisGridScaleIndex = 18; 

        this.numGridLines = 5; //must be an odd number...?

        //These variables are set each time this.Draw() function is called, so don't ever set them. it won't do anything :-D
        this.pos = null;
        this.width = null;
        this.height = null;
    }
    Draw(pos = null, width = null, height = null, painter)
    {
        var p = painter;
        this.pos = pos;
        this.width = width;
        this.height = height;

        if (this.component == selectedComponent)
        {
            p.SetStrokeWidth(2);
        } else {
            p.SetStrokeWidth(1);
        }
        p.SetStrokeColor('#888888');
        p.SetTextSize(14);

        //drawing the outside box
        //p.DrawLine(pos.x, pos.y, pos.x+width, pos.y);
        //p.DrawLine(pos.x, pos.y, pos.x, pos.y+height);
        //p.DrawLine(pos.x+width, pos.y+height, pos.x+width, pos.y);
        //p.DrawLine(pos.x+width, pos.y+height, pos.x, pos.y+height);
        p.DrawRect(pos.x,pos.y, width, height);


        var lineStep = height/(this.numGridLines+1); //num pixels per vertical division
        var curY = pos.y +lineStep;
        
        //drawing the horizontal lines and vertical axis grid text
        p.SetStrokeWidth(1);
        for (var i=0; i<this.numGridLines; i++)
        {
            p.SetStrokeColor('#333333');
            p.DrawLine(pos.x+100, curY, pos.x+width, curY);
            p.SetStrokeColor(0,0,0);
            p.DrawLine(0,200,0);
            p.SetTextColor('green');
            p.DrawText(pos.x+10, curY+5,  formatValue(((this.numGridLines-1)/2-i)*PlotYAxisIntervals[this.voltageYAxisGridScaleIndex], 'V' ) );
            p.SetTextColor('yellow');
            p.DrawText(pos.x+50, curY+5, formatValue(((this.numGridLines-1)/2-i)*PlotYAxisIntervals[this.currentYAxisGridScaleIndex], 'A' ) );
            curY += lineStep;
        }
        p.SetTextColor('white');
        p.DrawText(pos.x+10, pos.y+15, this.component.type + " " + this.component.name);

       
        //This will be used for drawing the vertical bars (time scale stuff)   50 because it's a nice number of pixels.
        var baseHorizontalDivision = 50*this.horizontalModifier;
        p.DrawText(pos.x+10, pos.y+height-10, formatValue( Number((timeStep*baseHorizontalDivision).toPrecision(2)), 's') + " per division");


        var data = this.component.voltageData
        var voltageScaler = lineStep / PlotYAxisIntervals[this.voltageYAxisGridScaleIndex];
        var p1 = new Point(pos.x +width, pos.y + height/2 - voltageScaler*data[0]);
        var p2 = new Point(pos.x +width, pos.y + height/2);
        
        p.SetStrokeColor('green');
        var scaleTooSmall = true;
        
        
        //This is where we draw all of the data to the screen.
        var drewVerticalDivisionLastLoop = false;
        for (var i=1; i<data.length && i/this.horizontalModifier<width-100; i++)
        {
            p2.x = p1.x;
            p2.y = p1.y;
            p1.x = pos.x + width - i/this.horizontalModifier;
            p1.y = pos.y + height/2 - voltageScaler * data[data.length - i];

            //check if the plot goes outside of the box
            if (p1.y < pos.y || p1.y > p1.y + height || p2.y < pos.y || p2.y > pos.y + height)
            {
                this.IncreaseVoltageYScale();
                return;
            } 

            p.DrawLine(p1.x, p1.y, p2.x, p2.y, 'green'); //Drawing the tiny line segment


            //this chunk is to determine if we need to draw a vertical line or not
            if ( (Math.round(currentTime/timeStep)-i + baseHorizontalDivision/2) % baseHorizontalDivision < baseHorizontalDivision/2)
            {
                if (drewVerticalDivisionLastLoop == false)
                {
                    p.DrawLine(p1.x, pos.y, p1.x, pos.y+height, '#333333');
                }
                drewVerticalDivisionLastLoop = true;
            } else {
                drewVerticalDivisionLastLoop = false;
            }
            
            //check if the plot is too small (needs to be streched vertically)
            if (scaleTooSmall == true && (p1.y < pos.y + height*3/8 || p1.y > p1.y + height*5/8 || p2.y < pos.y + height*3/8 || p2.y > pos.y + height*5/8))
            {
                scaleTooSmall = false;
            } 
        }
        if (scaleTooSmall) //checking to see if we need to decrease the voltage y scale
        {
            this.DecreaseVoltageYScale();
        }
        
        var scaleTooSmall = true;
        var data = this.component.currentData;
        var currentScaler = lineStep / PlotYAxisIntervals[this.currentYAxisGridScaleIndex];
        p.SetStrokeColor('yellow');
        p1 = new Point(pos.x + width, pos.y + height/2 - currentScaler*data[0]);
        for (var i=1; i<data.length && i/this.horizontalModifier<width-100; i++)
        {
            p2.x = p1.x;
            p2.y = p1.y;
            p1.x = pos.x + width - i/this.horizontalModifier;
            p1.y = pos.y + height/2 - currentScaler * data[data.length - i];

            //check if the plot goes outside of the box
            if (p1.y < pos.y || p1.y > p1.y + height || p2.y < pos.y || p2.y > pos.y + height)
            {
                this.IncreaseCurrentYScale();
                return;
            } 

            p.DrawLine(p1.x, p1.y, p2.x, p2.y);
            
            //check if the plot is too small (needs to be streched vertically)
            if (scaleTooSmall == true && (p1.y < pos.y + height*3/8 || p1.y > p1.y + height*5/8 || p2.y < pos.y + height*3/8 || p2.y > pos.y + height*5/8))
            {
                scaleTooSmall = false;
            } 
        }
        if (scaleTooSmall)
        {
            this.DecreaseCurrentYScale();
        }

    }

    SetComponent(newComponentToPlot = null)
    {
        if (newComponentToPlot != null)
        {
            this.component = newComponentToPlot;
        }
    }

    SetAutoScale(shouldScaleAutomatically = true)
    {
        this.autoScale = shouldScaleAutomatically;
    }

    IncreaseVoltageYScale() 
    {
        this.voltageYAxisGridScaleIndex -= 1;
        this.voltageYAxisGridScaleIndex = Math.max(this.voltageYAxisGridScaleIndex, 0);
    }

    DecreaseVoltageYScale()
    {
        this.voltageYAxisGridScaleIndex += 1;
        this.voltageYAxisGridScaleIndex = Math.min(this.voltageYAxisGridScaleIndex, PlotYAxisIntervals.length-1);
    }

    IncreaseCurrentYScale() 
    {
        this.currentYAxisGridScaleIndex -= 1;
        this.currentYAxisGridScaleIndex = Math.max(this.currentYAxisGridScaleIndex, 0);
    }

    DecreaseCurrentYScale()
    {
        this.currentYAxisGridScaleIndex += 1;
        this.currentYAxisGridScaleIndex = Math.min(this.currentYAxisGridScaleIndex, PlotYAxisIntervals.length-1);
    }

    IncreaseHorizontalScale()
    {
        this.horizontalModifier *= 2;
    }
    DecreaseHorizontalScale()
    {
        this.horizontalModifier /= 2;
    }
    GetAutoScale()
    {
        return this.autoScale;
    }

    GetComponent()
    {
        return this.component;
    }
    GetEncodedDataString()
    {
        return "plot " + this.component.name + " _ _ _ _ _ ";
    }
}


class PlotManager {
    constructor(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.plotHeight = Math.max(100, screenHeight/4);
        this.plots = [];
        this.gapBetweenPlots = 10;
    }

    AddPlot(plot = null)
    {
        if (plot != null)
        {
            this.plots.push(plot);
        }
    }

    AddPlotOfComponent(component = null)
    {
        if (component != null)
        {
            this.plots.push(new Plot(component));
        }
    }

    RemovePlotOfComponent(component_of_plot = null)
    {
        var tempList = [];
        for (var i=0; i<this.plots.length; i++)
        {
            if (this.plots[i].component.name == component_of_plot.name)
            {

            } else {
                tempList.push(this.plots[i]);
            }
        }
        this.plots = tempList;
    }

    RemovePlot(plot = null)
    {
        var tempList = [];
        for (var i=0; i<this.plots.length; i++)
        {
            if (this.plots[i] == plot)
            {

            } else {
                tempList.push(this.plots[i]);
            }
        }
        this.plots = tempList;
    }

    GetPlotOfComponent(component_of_plot = null)
    {
        for(var i=0; i<this.plots.length; i++)
        {
            if (this.plots[i].component == component_of_plot)
            {
                return this.plots[i];
            }
        }
        return null;
    }

    Draw(painter)
    {
        var plotWidth = ( this.screenWidth - this.gapBetweenPlots*(this.plots.length-1) ) / this.plots.length;
        var xPos = 0;
        var yPos = this.screenHeight - this.plotHeight;
        for(var i=0; i<this.plots.length; i++)
        {
            if (components.includes(this.plots[i].GetComponent()) == false)
            {
                console.log("HERE");
                this.RemovePlot(this.plots[i]);
                return;
            }

            this.plots[i].Draw(new Point(xPos, yPos), plotWidth, this.plotHeight, painter);
            xPos += plotWidth;
            xPos += this.gapBetweenPlots;
        }
    }

    GetPlots()
    {
        return this.plots;
    }

    GetPlot(comp)
    {
        for(var i=0; i<this.plots.length; i++)
        {
            if (this.plots[i].comp == comp)
            {
                return this.plots[i];
            }
        }
        return null;
    }
}










