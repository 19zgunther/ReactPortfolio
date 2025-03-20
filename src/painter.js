
class Painter {
    constructor (HTMLCanvasElement)
    {
        if (HTMLCanvasElement == null) { console.log("ERROR: class Painter constructor was passesed a NULL HTML Canvas Element"); }
        this.canvas = HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d');

        this.plotStrokeWidth = 1;
    }
    Clear(color)
    {
        if (color == null)
        {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            var tempFill = this.GetFillColor();
            var tempStroke = this.GetStrokeColor();
            this.SetFillColor(color);
            this.SetStrokeColor(color);
            this.DrawRectFilled(0,0,this.canvas.width,this.canvas.height);
            this.SetFillColor(tempFill);
            this.SetStrokeColor(tempStroke);
        }
    }
    ClearTransparent()
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    DrawLine(x1 = 0, y1 = 0, x2 = 10, y2 = 10, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.moveTo(x1,y1);
            this.ctx.lineTo(x2,y2);
            this.ctx.stroke();
        } else {
            var temp = this.GetStrokeColor();
            this.SetStrokeColor(color);
            this.ctx.moveTo(x1,y1);
            this.ctx.lineTo(x2,y2);
            this.ctx.stroke();
            this.SetStrokeColor(temp);
        }
        this.ctx.closePath();
    }
    DrawRectFilled(x = 0, y = 0, width = 10, height = 10, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.fillRect(x,y,width,height);
        } else {
            var temp = this.GetFillColor();
            this.SetFillColor(color);
            this.ctx.fillRect(x,y,width,height);
            this.SetFillColor(temp);
        }
        this.ctx.closePath();
    }
    DrawRect(x = 0, y = 0, width = 10, height = 10, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.moveTo(x,y);
            this.ctx.lineTo(x+width,y);
            this.ctx.lineTo(x+width,y+height);
            this.ctx.lineTo(x,y+height);
            this.ctx.lineTo(x,y);
            this.ctx.stroke();
        } else {
            var temp = this.GetStrokeColor();
            this.SetStrokeColor(color);
            this.ctx.moveTo(x,y);
            this.ctx.lineTo(x+width,y);
            this.ctx.lineTo(x+width,y+height);
            this.ctx.lineTo(x,y+height);
            this.ctx.lineTo(x,y);
            this.ctx.stroke();
            this.SetStrokeColor(temp);
        }
        this.ctx.closePath();
    }
    DrawTriangleFilled(x1 = 0, y1 = 0, x2=0, y2=0, x3=0,y3=0, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.moveTo(x1,y1);
            this.ctx.lineTo(x2,y2);
            this.ctx.lineTo(x3,y3);
            this.ctx.lineTo(x1,y1);
            this.ctx.fill();
        } else {
            var temp = this.GetFillColor();
            this.SetFillColor(color);
            this.ctx.moveTo(x1,y1);
            this.ctx.lineTo(x2,y2);
            this.ctx.lineTo(x3,y3);
            this.ctx.lineTo(x1,y1);
            this.ctx.fill();
            this.SetFillColor(temp);
        }
        this.ctx.closePath();
    }
    DrawTriangle(x1 = 0, y1 = 0, x2=0, y2=0, x3=0,y3=0, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.moveTo(x1,y1);
            this.ctx.lineTo(x2,y2);
            this.ctx.lineTo(x3,y3);
            this.ctx.lineTo(x1,y1);
            this.ctx.stroke();
        } else {
            var temp = this.GetStrokeColor();
            this.SetStrokeColor(color);
            this.ctx.moveTo(x1,y1);
            this.ctx.lineTo(x2,y2);
            this.ctx.lineTo(x3,y3);
            this.ctx.lineTo(x1,y1);
            this.ctx.stroke();
            this.SetStrokeColor(temp);
        }
        this.ctx.closePath();
    }
    DrawCircleFilled(x = 0, y = 0, radius = 5, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.arc(x,y,radius,0,2*Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            var temp = this.GetFillColor();
            this.SetFillColor(color);
            this.ctx.arc(x,y,radius,0,2*Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
            this.SetFillColor(temp);
        }
        this.ctx.closePath();
    }
    DrawCircle(x = 0, y = 0, radius = 5, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.arc(x,y,radius,0,2*Math.PI);
            this.ctx.stroke();
        } else {
            var temp = this.GetStrokeColor();
            this.SetStrokeColor(color);
            this.ctx.arc(x,y,radius,0,2*Math.PI);
            this.ctx.stroke();
            this.SetStrokeColor(temp);
        }
        this.ctx.closePath();
    }
    DrawArcFilled(x = 0, y = 0, radius = 5, start_radians = 0, end_radians = Math.PI, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.arc(x,y,radius,start_radians,end_radians);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            var temp = this.GetFillColor();
            this.SetFillColor(color);
            this.ctx.arc(x,y,radius,start_radians,end_radians);
            this.ctx.fill();
            this.ctx.stroke();
            this.SetFillColor(temp);
        }
        this.ctx.closePath();
    }
    DrawArc(x = 0, y = 0, radius = 5, start_radians = 0, end_radians = Math.PI, color)
    {
        this.ctx.beginPath();
        if (color == null)
        {
            this.ctx.arc(x,y,radius,start_radians,end_radians);
            this.ctx.stroke();
        } else {
            var temp = this.GetStrokeColor();
            this.SetStrokeColor(color);
            this.ctx.arc(x,y,radius,start_radians,end_radians);
            this.ctx.stroke();
            this.SetStrokeColor(temp);
        }
        this.ctx.closePath();
    }
    DrawText(x = 0, y = 0, text = 'default_text',color)
    {
        if (color == null)
        {
            var tempFill = this.GetFillColor();
            var tempStroke = this.GetStrokeColor();
            this.SetFillColor(this.textColor);
            this.SetStrokeColor(this.textColor);
            this.ctx.fillText(text, x, y);
            this.SetFillColor(tempFill);
            this.SetStrokeColor(tempStroke);
        } else {
            var tempFill = this.GetFillColor();
            var tempStroke = this.GetStrokeColor();
            this.SetFillColor(color);
            this.SetStrokeColor(color);
            this.ctx.fillText(text, x, y);
            this.SetFillColor(tempFill);
            this.SetStrokeColor(tempStroke);
        }
    }
    DrawTextRight(x = 0, y = 0, text = 'default_text', color)
    {
        if (color == null)
        {
            var tempFill = this.GetFillColor();
            var tempStroke = this.GetStrokeColor();
            this.SetFillColor(this.textColor);
            this.SetStrokeColor(this.textColor);
            this.ctx.fillText(text, x-this.GetTextWidth(text), y);
            this.SetFillColor(tempFill);
            this.SetStrokeColor(tempStroke);
        } else {
            var tempFill = this.GetFillColor();
            var tempStroke = this.GetStrokeColor();
            this.SetFillColor(color);
            this.SetStrokeColor(color);
            this.ctx.fillText(text, x-this.GetTextWidth(text), y);
            this.SetFillColor(tempFill);
            this.SetStrokeColor(tempStroke);
        }
    }
    DrawTextCentered(x = 0, y = 0, text = 'default_text', color)
    {
        this.DrawText(x - this.GetTextWidth(text)/2, y+this.GetTextHeight(text)/2, text, color);
    }
    DrawTextRotated(x = 0, y = 0, text = 'default_text', rotation = Math.PI/2, color)
    {
        this.ctx.save();
        this.ctx.translate(x,y);
        this.ctx.rotate(rotation);
        this.DrawText(0,0,text,color);
        this.ctx.restore();
    }
    DrawTextRotatedRight(x = 0, y = 0, text = 'default_text', rotation = Math.PI/2, color)
    {
        this.ctx.save();
        this.ctx.translate(x,y);
        this.ctx.rotate(rotation);
        this.DrawText(-this.GetTextWidth(text),0,text,color);
        this.ctx.restore();
    }
    DrawTextRotatedCentered(x = 0, y = 0, text = 'default_text', rotation = Math.PI/2, color)
    {
        this.ctx.save();
        this.ctx.translate(x,y);
        this.ctx.rotate(rotation);
        //this.DrawText(- this.GetTextWidth(text)/2, 0, text, color);
        this.DrawTextCentered(0,0,text,color);
        this.ctx.restore();
    }

    SetFillColor(color)
    {
        this.ctx.fillStyle = color;
    }
    SetTextSize(size = 20)
    {
        this.textSize = size
        this.ctx.font = this.textSize+"px "+this.textFont;
    }
    SetTextFont(fontString = 'Arial')
    {
        this.font = fontString;
        this.ctx.font = this.textSize+"px "+this.textFont;
    }
    SetTextColor(color)
    {
        this.textColor = color;
    }
    SetStrokeWidth(width = 1)
    {
        this.ctx.lineWidth = width;
    }
    SetStrokeColor(color)
    {
        this.ctx.strokeStyle = color;
    }


    GetTextWidth(text = 'default_text')
    {
        return this.ctx.measureText(text).width;
    }
    GetTextHeight(text = 'default_text')
    {
        var m = this.ctx.measureText(text);
        return m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    }
    GetFillColor()
    {
        return this.ctx.fillStyle;
    }
    GetStrokeColor()
    {
        return this.ctx.strokeStyle;
    }
    GetStrokeWeight()
    {
        return this.ctx.lineWidth;
    }
    GetTextFont()
    {
        return this.font;
    }
    GetTextSize()
    {
        return this.textSize;
    }
    GetTextColor()
    {
        return this.textColor;
    }
}

function rgbToHex(r,g,b)
{
    if (r == null || isNaN(r))
    {
        r = 0;
    }
    if (g == null || isNaN(g))
    {
        g = 0;
    }
    if (b == null || isNaN(b))
    {
        b = 0;
    }
    r = Math.min(Math.max(0,Math.round(r)),255);
    g = Math.min(Math.max(0,Math.round(g)),255);
    b = Math.min(Math.max(0,Math.round(b)),255);


    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    while (r.length < 2)
    {
        r = "0"+r;
    }
    while (g.length < 2)
    {
        g = "0"+g;
    }
    while (b.length < 2)
    {
        b = "0"+b;
    }

    return '#'+r+g+b;
}



export {Painter, rgbToHex};
//NOTHING
