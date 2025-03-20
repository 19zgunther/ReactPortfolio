

class Node {
    constructor() {
        this.name = -1; //give it a unique name (at some point)
        this.points = []; //different coordinates where this node exists
        this.startComponents = []; //components which start at this node
        this.endComponents = []; //components which end at this node
        this.voltage = null;

        this.drawGraphics = true;

        this.forwardingAddress = -1; //has this node already been reduced? If so, leave a forwarding address for the other node.
        this.forwardingVoltage = 0;

        this.visited = false;
        this.currentOut = 0;
        this.numCurrentsOut = 0;
    }
    Delete() {
        //IDK maybe in the future i'll need to do something here
    }
    GetComponents(type) {
        //if type = null or "" then return ALL components. Else, just return one type
        var L = []
        if (type != null && type != "")
        {
            for (var i=0; i<this.startComponents.length;i++)
            {
                if (this.startComponents[i].type == type)
                {
                    L.push(this.startComponents[i]);
                }
            }
            for (var i=0; i<this.endComponents.length;i++)
            {
                if (this.endComponents[i].type == type)
                {
                    L.push(this.endComponents[i]);
                }
            }
        } else {
            for (var i=0; i<this.startComponents.length;i++)
            {
                L.push(this.startComponents[i]);
            }
            for (var i=0; i<this.endComponents.length;i++)
            {
                L.push(this.endComponents[i]);
            }
        }
        return L;
    }
    equals(n2)
    {
        if (n2.name != null && this.name == n2.name)
        {
            return true;
        }
    }
}

