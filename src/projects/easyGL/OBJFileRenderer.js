

class OBJFileRenderer
{
    constructor(canvasElement, objFileText="", camPos = new vec4(0,0,25), clearColor = new vec4(.1,.1,.1,0.5), reflectivity = 0.5)
    {
        this.canvasElement = canvasElement;
        this.objText = objFileText;
        this.reflectivity = reflectivity;

        let bb = this.canvasElement.getBoundingClientRect();
        this.canvasElement.width = Math.round(bb.width);
        this.canvasElement.height = Math.round(bb.height);
        this.easyGl = new EasyGL(this.canvasElement, clearColor);
        this.id = "OBJ"+String(Math.random());

        this.easyGl.setPerspective(null, canvasElement.width/canvasElement.height);
        this.easyGl.enableRenderingReverseFaces(true);
        this.easyGl.setCameraPosition(camPos);

        this.mouseIsDown = false;

        this.mouseInteractionStyle = 2;

        this._parseObject(this.objText);
    }
    setPerspective(FOV, aspectRatio, zNear, zFar)
    {
        this.easyGl.setPerspective(FOV, aspectRatio, zNear, zFar);
    }
    setCameraPosition(x,y,z)
    {
        this.easyGl.setCameraPosition(x,y,z);
    }
    setCameraRotation(x,y,z)
    {
        this.easyGl.setCameraRotation(x,y,z);
    }
    setObjectPosition(x,y,z)
    {
        for (let i=0; i<this.vertices.length; i++)
        {
            this.easyGl.setObjectPosition(this.id+i,x,y,z);
        }
    }
    getObjectPosition()
    {
        return this.easyGl.getObjectPosition(this.id+"0");
    }
    getObjectRotation()
    {
        return this.easyGl.getObjectRotation(this.id+"0");
    }
    setObjectRotation(x,y,z)
    {
        for (let i=0; i<this.vertices.length; i++)
        {
            this.easyGl.setObjectRotation(this.id+i,x,y,z);
        }
    }
    _parseObject(text)
    {
        const lines = text.split("\n");
        lines.push("g end");

        let vs = [];
        let is = [];
        let ns = [];
        let cs = [];

        let vertices =  [];//[new vec4(1,0,0,), new vec4(0,1,0,), new vec4(-1,0,0)];
        let indices = [];//[0,1,2];
        let normals = [];//[new vec4(1,1,1), new vec4(1,1,1), new vec4(1,1,1)];
        let colors = [];//[new vec4(1,0,0,1), new vec4(1,0,0,1), new vec4(1,0,0,1),];
        let indOffset = 1;
        let color = new vec4(Math.random(), Math.random(), Math.random(), 1);
        let ret;

        let newV = [];
        let newC = [];
        let newI = [];
        let newN = [];
        let indOff = 0;
        

        const colorMap = new Map();
        for (let i=0; i<Math.min(lines.length, 10000000); i++)
        {
            const L = lines[i];
            if (L[0] == "v" && L[1] != "n")
            {
                let v = this._parseVertice(L);
                vertices.push(v);
            } else if (L[0] == "v" && L[1] == "n") {
                //normals.push(this._parseVertice(L).scaleToUnit());
            } else if (L[0] == "f") {
                ret = this._parseIndices(L);
                indices.push(ret[0]-indOffset, ret[1]-indOffset, ret[2]-indOffset);
            } else if (L[0] == "g" && L[1] == " ")
            {
                color = colorMap.get(L); 
                if (color == null)
                {
                    color = new vec4(Math.random(), Math.random(), Math.random(), 1);
                    colorMap.set(L, color);
                }

                if (vertices.length > 3)
                {
                    vs.push(vertices);
                    is.push(indices);
                    ns.push(normals);
                    cs.push(colors);
                }
                indOffset += vertices.length;
                vertices = [];
                indices = [];
                normals = [];
                colors = color;
            }
        }
        
        for (let j=0; j<vs.length; j++)
        {
            const ver = vs[j];
            const ind = is[j];
            const norms = ns[j];
            const cols = cs[j];

            let nNorms = []
            let nVers = []
            let nInds = []
            let indOn = 0;
            for (let i=0; i<ind.length; i+=3)
            {
                const v1 = ver[ind[i]];
                const v2 = ver[ind[i+1]];
                const v3 = ver[ind[i+2]];

                const A = v2.sub(v1)
                const B = v3.sub(v1)
                let n = new vec4();
                n.x = A.y*B.z - A.z*B.y;
                n.y = A.z*B.x - A.x*B.z;
                n.z = A.x*B.y - A.y*B.x;
                n.scaleToUnit()
                norms[ind[i]] = n.copy();
                norms[ind[i+1]] = n.copy();
                norms[ind[i+2]] = n.copy();

                nVers.push(v1.copy(), v2.copy(), v3.copy());
                nNorms.push(n,n,n);
                nInds.push(indOn, indOn+1, indOn+2);
                indOn += 3;
            }
            this.easyGl.createObject(this.id+j, new vec4(), new vec4(), new vec4(1,1,1), nVers, nInds, nNorms, cols, false, this.reflectivity);
        }

        this.vertices = vs;
        this.indices = is;
        this.normals = ns;
        this.colors = cs;
    }
    _parseVertice(line, multiplier = 100)
    {
        let numbers = this._getNumbersFromString(line);
        return new vec4(numbers[0]*multiplier, numbers[1]*multiplier, numbers[2]*multiplier);
    }
    _parseIndices(line)
    {
        let numbers = this._getNumbersFromString(line);
        return [numbers[0], numbers[2], numbers[4]];
    }
    _getNumbersFromString(string)
    {
        string += "  ";
        let currentNumber = "";
        let numbers = [];
        for (let i=0; i<string.length; i++)
        {
            const c = string[i];
            const charCode = string.charCodeAt(i);
            if (c == "e" || c == "-" || c == "." || (charCode >= 48 && charCode <= 57))
            {
                currentNumber += c;
            } else if (currentNumber != "") {
                numbers.push(Number(currentNumber));
                currentNumber = "";
            }
        }
        return numbers;
    }
    render()
    {
        this.easyGl.clear();
        for (let i=0; i<this.vertices.length; i++)
        {
            this.easyGl.renderObject(this.id+i);
        }
    }
    resize()
    {
        this.easyGl.setPerspective(null, this.canvasElement.width/this.anvasElement.height);
    }
    eventListener(event)
    {
        if (this.mouseInteractionStyle == 1)
        {
            if (event.type == "mousedown")
            {
                this.mouseIsDown = true;
            } else if (event.type == "mouseup")
            {
                this.mouseIsDown = false;
            } else if (event.type == "mousemove" && this.mouseIsDown)
            {
                let dx = event.movementX;
                let dy = event.movementY;
                objRenderer.setObjectRotation( objRenderer.getObjectRotation().add(0, dx/100, dy/100));
                //console.log(dx, dy);
            } else if (event.type == "mousewheel")
            {
                event.preventDefault();
                const bb = this.canvasElement.getBoundingClientRect();
                const x = event.offsetX - bb.width/2;
                const y = -(event.offsetY - bb.height/2);
                const dt = -event.deltaY/100;
                objRenderer.setObjectPosition( objRenderer.getObjectPosition().add(dt*x/300, dt*y/300, -dt));
            }
        } else if (this.mouseInteractionStyle == 2)
        {
            if (event.type == "mousedown")
            {
                this.mouseButtonDown = event.button;
                this.mouseIsDown = true;
            } else if (event.type == "mouseup")
            {
                this.mouseButtonDown = event.button;
                this.mouseIsDown = false;
            } else if (event.type == "mousemove" && this.mouseIsDown)
            {
                if (this.mouseButtonDown == 1) // translate
                {
                    console.log(event)
                    const x = event.movementX;
                    const y = -event.movementY;
                    console.log(x,y);
                    objRenderer.setObjectPosition( objRenderer.getObjectPosition().add(x/100, y/100, 0));
                } else { //rotate
                    let dx = event.movementX;
                    let dy = event.movementY;
                    objRenderer.setObjectRotation( objRenderer.getObjectRotation().add(0, dx/300, dy/300));
                }

            } else if (event.type == "mousewheel")
            {
                event.preventDefault();
                const bb = this.canvasElement.getBoundingClientRect();
                const x = 0;//event.offsetX - bb.width/2;
                const y = 0;//-(event.offsetY - bb.height/2);
                const dt = event.deltaY/100;
                objRenderer.setObjectPosition( objRenderer.getObjectPosition().add(dt*x/300, dt*y/300, -dt));
            }
        }
    }
}

