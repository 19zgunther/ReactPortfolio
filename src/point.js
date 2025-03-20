
class Point { //oh yea.... and I use this as a VECTOR sometimes so HAVE FUN trying to figure out what I'm doing :-D (i'm so sorry)
    constructor(x=0,y=0) {
        this.x = x;
        this.y = y;
    }
    add(p2) {
        return new Point(this.x + p2.x, this.y + p2.y);
    }
    sub(p2) {
        return new Point(this.x - p2.x, this.y - p2.y);
    }
    mul(p2) {
        if (p2 instanceof Point)
        {
            return new Point(this.x*p2.x, this.y*p2.y);
        } else {
            return new Point(this.x*p2, this.y*p2);
        }
    }
    equals(p2) {
        if (this.x == p2.x && this.y == p2.y)
        {
            return true;
        } else {
            return false;
        }
    }
    copy()
    {
        return new Point(this.x, this.y);
    }
    toString()
    {
        return "("+this.x+","+this.y+")";
    }
    fromString(str = "")
    {
        let arr = str.replace("(",'').replace(")",'').split(',');
        if (arr.length != 2)
        {
            console.error("Point.fromString(): Failed to parse from string '"+str+"'.");
            return;
        }
        this.x = Number(arr[0]);
        this.y = Number(arr[1]);
    }
    round()
    {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
}

function distBetweenPoints(p1,p2) {
    //Find the distance between two points (point objects) P1 and P2
    return Math.sqrt(Math.pow(p1.x-p2.x,2) + Math.pow(p1.y-p2.y,2));
}
function findMidpoint(p1,p2) {
    //Find the midpoint (return the object) between p1 and p2
    var slopeY = (p2.y-p1.y);
    var slopeX = (p2.x-p1.x);
    return new Point(p1.x+slopeX/2, p1.y+slopeY/2);
}
function distToLine(L1,L2,P, stepInPixels=10, stepStartOffset = 0, stepEndOffset = 0) {
    /*This function finds the distance between line(L1,L2) and point P
    L1 = line end 1 (a Point object),  L2 = line end 2 (a Point object),  P = point (a Point object)

    We are going to do this by turning the line into a series of points and finding the nearest point to P 
        We will find the total length of the line and put points along the line every ...idk yet... amount (see below)*/
    const len = distBetweenPoints(L1,L2); //len = line length (dist from L1 to L2)
    const numPoints = len/stepInPixels; //number of points, every 10 pixels or so.
    const incrementY = (L2.y-L1.y)/numPoints; //what we will increment the x and y positions by each time in the loop
    const incrementX = (L2.x-L1.x)/numPoints;
    let curPoint = new Point(L1.x + incrementX*stepStartOffset, L1.y + incrementY*stepStartOffset);
    let bestDist = 10000000000;
    let dist = 10000000000;
    for (let i=0; i<numPoints - stepEndOffset; i++)
    {
        dist = distBetweenPoints(curPoint,P);
        bestDist = Math.min(bestDist,dist);
        curPoint.y += incrementY;
        curPoint.x += incrementX;
    }
    return bestDist;
}

function getVector(p1,p2)
{
    return new Point(p2.x-p1.x, p2.y-p1.y);
}

export {Point, distBetweenPoints, findMidpoint, distToLine, getVector};