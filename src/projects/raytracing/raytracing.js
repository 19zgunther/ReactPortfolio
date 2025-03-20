import { useEffect, useState } from "react";

class vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.mag = null;
    }
    getMagnitude() {
        if (this.mag == null) {
            this.mag = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        }
        return this.mag;
    }
    normalize() {
        this.getMagnitude();
        this.x = this.x / this.mag;
        this.y = this.y / this.mag;
        this.z = this.z / this.mag;
        return this;
    }
    getDistanceTo(otherP) {
        return Math.sqrt(Math.pow(this.x - otherP.x, 2) + Math.pow(this.y - otherP.y, 2) + Math.pow(this.z - otherP.z, 2));
    }
    sub(other) {
        if (other instanceof vec3) {
            return new vec3(this.x - other.x, this.y - other.y, this.z - other.z);
        } else {
            return new vec3(this.x - other, this.y - other, this.z - other);
        }
    }
    add(other) {
        if (other instanceof vec3) {
            return new vec3(this.x + other.x, this.y + other.y, this.z + other.z);
        } else {
            return new vec3(this.x + other, this.y + other, this.z + other);
        }
    }
    addi(other) {
        if (other instanceof vec3) {
            this.x += other.x;
            this.y += other.y;
            this.z += other.z;
            return this;
        } else {
            this.x += other;
            this.y += other;
            this.z += other;
            return this;
        }
    }
    mul(other) {
        if (other instanceof vec3) {
            return new vec3(this.x * other.x, this.y * other.y, this.z * other.z);
        }
        return new vec3(this.x * other, this.y * other, this.z * other);
    }
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    copy() {
        return new vec3(this.x, this.y, this.z);
    }
    toString(p = 2) {
        return "x: " + this.x.toPrecision(p) + "  y: " + this.y.toPrecision(p) + " z: " + this.z.toPrecision(p);
    }
}

class Object {
    constructor(position = new vec3(), color = new vec3(255, 0, 0), reflectance = 0) {
        this.position = position;
        this.color = color;
        this.reflectance = reflectance;
    }
    raytrace() {
        console.error("Not implemented in child class");
    }
    getNormal() {
        console.error("Not implemented in child class");
    }
    getColor() {
        return this.color;
    }
}

class Sphere extends Object {
    constructor(position = new vec3(), radius = 1, color = new vec3(255, 255, 255), reflectance = 0.95) {
        super(position, color, reflectance);
        this.radius = radius;
        this.name = "Sphere";
    }
    raytrace(rayD, rayP) {

        //let a = Math.pow(rayD.x-rayP.x,2)  +  Math.pow(rayD.y-rayP.y,2)  +  Math.pow(rayD.z-rayP.z,2);
        //let b = -2*(   (rayD.x-rayP.x)*(this.position.x-rayP.x) +  (rayD.y-rayP.y)*(this.position.y-rayP.y) + (rayD.z-rayP.z)*(this.position.z-rayP.z)  );
        //let c = Math.pow(this.position.x-rayP.x,2)  +  Math.pow(this.position.y-rayP.y,2)  +  Math.pow(this.position.z-rayP.z,2) - this.radius*this.radius;
        let a = rayD.x * rayD.x + rayD.y * rayD.y + rayD.z * rayD.z;
        let b = 2 * (rayD.x * (rayP.x - this.position.x) + rayD.y * (rayP.y - this.position.y) + rayD.z * (rayP.z - this.position.z));
        let c = Math.pow(rayP.x - this.position.x, 2) + Math.pow(rayP.y - this.position.y, 2) + Math.pow(rayP.z - this.position.z, 2) - this.radius * this.radius;

        let ret = quadraticFormula(a, b, c);
        a = rayD.x * rayD.x + rayD.y * rayD.y + rayD.z * rayD.z;
        b = 2 * (rayD.x * (rayP.x - this.position.x) + rayD.y * (rayP.y - this.position.y) + rayD.z * (rayP.z - this.position.z));
        c = Math.pow(rayP.x - this.position.x, 2) + Math.pow(rayP.y - this.position.y, 2) + Math.pow(rayP.z - this.position.z, 2) - this.radius * this.radius;

        ret = quadraticFormula(a, b, c);

        if (ret == null) {
            //Do nothing... 
        } else if (ret.length === 1) {
            if (ret[0] > 0.01) {
                //let v1 = new vec3(ret[0]*rayD.x + rayP.x, ret[0]*rayD.y + rayP.y, ret[0]*rayD.z + rayP.z );
                let v1 = new vec3(ret[0] * rayD.x, ret[0] * rayD.y, ret[0] * rayD.z);
                return [v1.add(rayP), v1.getMagnitude()];
            }
        } else if (ret.length === 2) {

            if (ret[0] > 0.01 && ret[1] > 0.01) {
                //let v1 = new vec3(ret[0]*rayD.x + rayP.x, ret[0]*rayD.y + rayP.y, ret[0]*rayD.z + rayP.z );
                //let v2 = new vec3(ret[1]*rayD.x + rayP.x, ret[1]*rayD.y + rayP.y, ret[1]*rayD.z + rayP.z );
                let v1 = new vec3(ret[0] * rayD.x, ret[0] * rayD.y, ret[0] * rayD.z);
                let v2 = new vec3(ret[1] * rayD.x, ret[1] * rayD.y, ret[1] * rayD.z);
                if (v1.getMagnitude() < v2.getMagnitude()) {
                    return [v1.add(rayP), v1.getMagnitude()];
                } else {
                    return [v2.add(rayP), v2.getMagnitude()];
                }
            } else if (ret[0] > 0.01) {
                //let v1 = new vec3(ret[0]*rayD.x + rayP.x, ret[0]*rayD.y + rayP.y, ret[0]*rayD.z + rayP.z );
                let v1 = new vec3(ret[0] * rayD.x, ret[0] * rayD.y, ret[0] * rayD.z);
                return [v1.add(rayP), v1.getMagnitude()];
            } else if (ret[1] > 0.01) {
                //let v2 = new vec3(ret[1]*rayD.x + rayP.x, ret[1]*rayD.y + rayP.y, ret[1]*rayD.z + rayP.z );
                let v2 = new vec3(ret[1] * rayD.x, ret[1] * rayD.y, ret[1] * rayD.z);
                return [v2.add(rayP), v2.getMagnitude()];
            }
        }
        return null;
    }
    getNormal(point) {
        return this.position.sub(point).normalize();
    }
}

class Plane extends Object {
    constructor(position = new vec3(), normal = new vec3(0, 0, 1), color = new vec3(0, 0, 255), reflectance = 0) {
        super(position, color, reflectance);
        this.normal = normal.normalize();
        this.color = color;
        this.name = "Plane";
    }
    raytrace(rayD, rayP) {
        let t = (this.position.sub(rayP).dot(this.normal)) / (rayD.dot(this.normal));
        if (t > 0.1) {
            let vec = new vec3(rayD.x * t, rayD.y * t, rayD.z * t);
            return [vec.add(rayP), vec.getMagnitude()];
        }
    }
    getNormal() {
        return this.normal;
    }
    getColor(point) {
        //return this.color;
        if (Math.abs(point.x % 5) < 2 && Math.abs(point.y % 2) < 1 || Math.abs(point.z % 2) < 1)
        {
            return this.color;
        } else {
            return new vec3(255,255,255).sub(this.color);
        }
    }
}

class Disk extends Plane {
    constructor(position = new vec3(), normal = new vec3(0, 0, 1), color = new vec3(255, 255, 255), radius = 1, reflectance = 0.2) {
        super(position, normal, color, reflectance);
        this.radius = radius;
        this.name = "Disk";
    }
    raytrace(rayD, rayP) {
        let t = (this.position.sub(rayP).dot(this.normal)) / (rayD.dot(this.normal));
        if (t > 0.1) {
            let vec = new vec3(rayD.x * t, rayD.y * t, rayD.z * t);
            if (vec.add(rayP).getDistanceTo(this.position) < this.radius) {
                return [vec.add(rayP), vec.getMagnitude()];
            }
        }
        return null;
    }
}

class PointSource extends Object {
    constructor(position = new vec3(), lightColor = new vec3(5, 4, 4), shadowColor = new vec3(.1, .1, .1), radius = 0.5) {
        super(position, lightColor, 0);
        this.lightColor = lightColor;
        this.radius = radius;
        this.shadowColor = shadowColor;
        this.name = "PointSource";
    }
 
    getLightMultiplier(rayStartPositon, objects) {
        let rayD = this.position.sub(rayStartPositon).normalize();
        let rayP = rayStartPositon.copy();
        let bestMag = this.position.sub(rayStartPositon).getMagnitude();

        let ret = null;
        for (let i = 0; i < objects.length; i++) {
            if (objects[i] instanceof PointSource) {continue;}
            ret = objects[i].raytrace(rayD, rayP);
            if (ret != null && ret[1] < bestMag) {
                //Oh no! THere is an object blocking light.
                return this.shadowColor;
            }
        }
        return this.lightColor.mul(1 / (bestMag + 1));
    }
    raytrace(rayD, rayP) {
        let a = rayD.x * rayD.x + rayD.y * rayD.y + rayD.z * rayD.z;
        let b = 2 * (rayD.x * (rayP.x - this.position.x) + rayD.y * (rayP.y - this.position.y) + rayD.z * (rayP.z - this.position.z));
        let c = Math.pow(rayP.x - this.position.x, 2) + Math.pow(rayP.y - this.position.y, 2) + Math.pow(rayP.z - this.position.z, 2) - this.radius * this.radius;

        let ret = quadraticFormula(a, b, c);
        a = rayD.x * rayD.x + rayD.y * rayD.y + rayD.z * rayD.z;
        b = 2 * (rayD.x * (rayP.x - this.position.x) + rayD.y * (rayP.y - this.position.y) + rayD.z * (rayP.z - this.position.z));
        c = Math.pow(rayP.x - this.position.x, 2) + Math.pow(rayP.y - this.position.y, 2) + Math.pow(rayP.z - this.position.z, 2) - this.radius * this.radius;

        ret = quadraticFormula(a, b, c);

        if (ret != null && ret.length === 2 && ret[0] > 0.01 && ret[1] > 0.01) {
            
            //let v1 = new vec3(ret[0]*rayD.x + rayP.x, ret[0]*rayD.y + rayP.y, ret[0]*rayD.z + rayP.z );
            let t = Math.min(ret[0], ret[1]);
            let t2 = Math.max(ret[0], ret[1])-t;
            let v = new vec3(t * rayD.x, t * rayD.y, t * rayD.z);
            return [v.add(rayP), v.getMagnitude(), new vec3(t2 * rayD.x, t2 * rayD.y, t2 * rayD.z).getMagnitude()];
        }
        return null;
    }
    getNormal() {
        console.error("Not implemented");
    }
}

class TransparentSphere extends Sphere {

}

var width = 500;
var height = 500;
var ctx = null;
var canvasData = [];


function fireRay(rayD = new vec3(), rayP = new vec3(), objects = [], lightSource, pObject = null, recDepth = 0) {
    let bestMag = 10000000;
    let bestObject = null;
    let bestPoint = null;
    // let lightAmount = 0;
    let o;

    rayD.normalize();

    for (let i = 0; i < objects.length; i++) {
        if (objects[i] === pObject) { continue; }
        o = objects[i]

        let ret = o.raytrace(rayD, rayP);
        if (ret != null && ret[1] < bestMag) {
            bestMag = ret[1];
            bestPoint = ret[0];
            bestObject = o;
            // if (ret.length === 3)
            // {
            //     lightAmount = ret[2];
            // }
        }
    }

    if (bestObject != null) {
        if (bestObject !== lightSource) {
            if (bestObject.reflectance > 0.1 && recDepth < 10) {
                let normalVec = bestObject.getNormal(bestPoint);
                let newRayD = reflectRay(rayD, normalVec);
                let newColor = fireRay(newRayD, bestPoint, objects, lightSource, bestObject, recDepth + 1);
                let colorMultiplier = lightSource.getLightMultiplier(bestPoint, objects);
                return newColor.mul(bestObject.reflectance).add(bestObject.getColor(bestPoint).mul(1 - bestObject.reflectance).mul(colorMultiplier));
            } else {
                let colorMultiplier = lightSource.getLightMultiplier(bestPoint, objects);
                return bestObject.getColor(bestPoint).mul(colorMultiplier);
            }   
        }
        return new vec3(255,255,255);
    }
    return new vec3();
}
function reflectRay(Ri, N) {
    //Ri = incident Ray
    //N = normal to surface
    //returns reflected ray
    return Ri.sub(N.mul(Ri.dot(N) * 2))
}
function quadraticFormula(a = 1, b = 0, c = 0) {
    //console.log("a: " + a + "  b: " + b + "  c: " + c);
    let inside = (b * b) - (4 * a * c)
    //console.log("b*b: " + b*b + "  4*a*c: " + 4*a*c + "  inside: " + inside);

    if (inside < 0) {
        return null;
    } else if (inside === 0) {
        return [-b / (2 * a), null]
    }

    return [(-b + Math.sqrt(inside)) / (2 * a), (-b - Math.sqrt(inside)) / (2 * a)];
}

function Raytrace() {
    //Instantiate Point Source
    const pointSource = new PointSource(new vec3(0, 9, 5));

    //Instantiate Scene Objects
    const [objects, setObjects] = useState([
        new Sphere(new vec3(1,-9,8), 2, new vec3(50,50,50)),
        new Sphere(new vec3(4, 0, 5), 3),
        new Sphere(new vec3(-4, 0, 7), 3),
        new Plane(new vec3(-10, 0, 0), new vec3(1, 0, 0), new vec3(255, 0, 0), .1), //right
        new Plane(new vec3(0, 0, 10), new vec3(0, 0, -1), new vec3(0, 255, 0), 0), //back
        new Plane(new vec3(10, 0, 0), new vec3(-1, 0, 0), new vec3(0, 0, 255)), //left
        new Plane(new vec3(0, 10, 0), new vec3(0, -1, 0), new vec3(200, 0, 255)), //top
        new Plane(new vec3(0, -10, 0), new vec3(0, 1, 0), new vec3(150, 255, 0)), //bottom
    ]);

    useEffect(() => {
        render();
    }, [objects]);

    function render() {
        const canvasElement = document.getElementById('raytraceCanvas');
        if (canvasElement == null) {
            return;
        }
        ctx = canvasElement.getContext('2d');
        document.getElementById('ImageSize').value = width;
    
        document.getElementById('LSx').value = pointSource.position.x;
        document.getElementById('LSy').value = pointSource.position.y;
        document.getElementById('LSz').value = pointSource.position.z;
    
        //Get image data, and clear colors.
        canvasData = ctx.createImageData(width, height);
        for (let i = 0; i < width * height * 4; i += 4) {
            canvasData.data[i] = 0;
            canvasData.data[i + 1] = 0;
            canvasData.data[i + 2] = 0;
            canvasData.data[i + 3] = 255;
        }
    
        console.log("Rendering...");
        canvasElement.style.width = width + 'px';
        canvasElement.style.height = height + 'px';
        canvasElement.width = width;
        canvasElement.height = height;
    
        canvasData = ctx.createImageData(width, height);
    
        let numRuns = 1;
        for (let x = 0; x < width; x += 1) {
            for (let y = 0; y < height; y += 1) {
                let color = new vec3(0, 0, 0);
                for (let i = 0; i < numRuns; i++) {
                    //ret = fireRay(new vec3(3*(0.5-x/w),3*(0.5-y/h),1), new vec3( (0.5-x/w)/1, (0.5-y/h)/1 ), objects)
                    let ret = fireRay(new vec3(3.0 * (0.5 - x / width), 3.0 * (0.5 - y / height), 1), new vec3(), objects, pointSource)
                    color.addi(ret);
                }
                canvasData.data[x * 4 + y * width * 4] = color.x / numRuns;
                canvasData.data[x * 4 + y * width * 4 + 1] = color.y / numRuns;
                canvasData.data[x * 4 + y * width * 4 + 2] = color.z / numRuns;
                canvasData.data[x * 4 + y * width * 4 + 3] = 255;
            }
        }
        console.log("done!");
        ctx.putImageData(canvasData, 0, 0);
    
        return "done";
    }

    function imageSliderInputChanged(e) {
        width = height = Number(e.target.value);
        render();
    }

    function lightSourceXSliderInputChanged(e) {
        if (!isNaN(Number(e.target.value))) {
            pointSource.position.x = Number(e.target.value);
            render();
        }
    }

    function lightSourceYSliderInputChanged(e) {
        if (!isNaN(Number(e.target.value))) {
            pointSource.position.y = Number(e.target.value);
            render();
        }
    }

    function lightSourceZSliderInputChanged(e) {
        if (!isNaN(Number(e.target.value))) {
            pointSource.position.z = Number(e.target.value);
            render();
        }
    }


    function modObjectPosition(object, x, y, z) {
        if (!isNaN(object.position.x + x)) {
            object.position.x += x;
        }
        if (!isNaN(object.position.y + y)) {
            object.position.y += y;
        }
        if (!isNaN(object.position.z + z)) {
            object.position.z += z;
        }
        setObjects([...objects]);
    }

    function modObjectReflectance(object, reflectance) {
        object.reflectance = reflectance;
        setObjects([...objects]);
    }

    function modObjectColor(object, color) {
        // convert hex string to vec3
        let r = parseInt(color.slice(1, 3), 16);
        let g = parseInt(color.slice(3, 5), 16);
        let b = parseInt(color.slice(5, 7), 16);
        object.color = new vec3(r, g, b);
        setObjects([...objects]);
    }

    function vec3ColorToString(color) {
        return "#" + color.x.toString(16) + color.y.toString(16) + color.z.toString(16);
    }


    return (
        <div className="project-page">
            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                <h1>Brute Force Raytracing</h1>
            </div>

            <canvas id='raytraceCanvas' style = {{'width':'10%', 'height':'10%', 'padding':'5%', 'float':'right'}}></canvas>

            <div style = {{'padding':'5%'}}>
                <div style={{fontSize: '2em'}}>
                    Controls:
                </div>
                <div style={{display: 'table', fontSize: 'smaller'}}>
                    <div style={{display: 'table-row'}}>
                        <div style={{display: 'table-cell'}}>
                            Image Size: 
                        </div>
                        <div style={{display: 'table-cell'}}>
                            100px <input id ={'ImageSize'} type={'range'} min={100} max={1000} step={10} onChange = {imageSliderInputChanged}/> 1000px
                        </div>
                    </div>
                    <div style={{display: 'table-row'}}>
                        <div style={{display: 'table-cell'}}>
                            Light source x position:
                        </div>
                        <div style={{display: 'table-cell'}}>
                            -10 <input id ={'LSx'} type={'range'} min={-9} max={9} step={0.1} onChange = {lightSourceXSliderInputChanged}/> 10
                        </div>
                    </div>
                    <div style={{display: 'table-row'}}>
                        <div style={{display: 'table-cell'}}>
                            Light source y position:
                        </div>
                        <div style={{display: 'table-cell'}}>
                            -10 <input id ={'LSy'} type={'range'} min={-9} max={9} step={0.1} onChange = {lightSourceYSliderInputChanged}/> 10
                        </div>
                    </div>
                    <div style={{display: 'table-row'}}>
                        <div style={{display: 'table-cell'}}>
                            Light source z position:
                        </div>
                        <div style={{display: 'table-cell'}}>
                            -10 <input id ={'LSz'} type={'range'} min={-9} max={9} step={0.1} onChange = {lightSourceZSliderInputChanged}/> 10
                        </div>
                    </div>
                
                </div>


                <div style={{fontSize: '1.5em', paddingTop: '1rem'}}>
                            Objects:
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Reflectance</th>
                                    <th>Color</th>
                                </tr>
                                {objects.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.name} {index}</td>
                                        <td>
                                            <button onClick={(()=>{modObjectPosition(item, 0.5, 0, 0)})}>&larr;</button>
                                            <button onClick={(()=>{modObjectPosition(item, -0.5, 0, 0)})}>&rarr;</button>
                                            <button onClick={(()=>{modObjectPosition(item, 0, 0.5, 0)})}>&uarr;</button>
                                            <button onClick={(()=>{modObjectPosition(item, 0, -0.5, 0)})}>&darr;</button>
                                            <button onClick={(()=>{modObjectPosition(item, 0, 0, 0.5)})}>+</button>
                                            <button onClick={(()=>{modObjectPosition(item, 0, 0, -0.5)})}>-</button>
                                        </td>
                                        <td><input type="range" min={0} max={1} step={0.01} value={item.reflectance} onChange={(e)=>{modObjectReflectance(item, Number(e.target.value))}}/></td>
                                        <td><input type="color" value={vec3ColorToString(item.color)} onChange={(e)=>{modObjectColor(item, e.target.value)}}/></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>


                <div style={{fontSize: '2em', paddingTop: '1rem'}}>
                    About:
                </div>

                <p>One day while I was browsing through social media I found an image of reflective spheres and a few other basic objects. 
                The caption stated the image was rendered using ray tracing, a rendering technique I had heard of but knew little about.
                After a few hours of research, I began working on this project: A JS ray tracing program.
                </p>
                
                <p>This renderer (currently) can render two basic objects: Spheres and planes. It works by projecting a ray for each pixel and seeing what the ray intersects with. If the ray intersects with
                an object the object color is recorded, a ray from that intersection is shot to the point light source to determine the light level (based on distance and blocking objects), and finally a 
                new ray is recursively shot from the intersection in the reflected direction. The reflected ray returns a color value from what it hit, and all of the colors and light levels are accumulated
                to find the final pixel color to display on the screen.
                </p>
                <p>My implemenation of this rendering technique has some shortcomings. To start, each pixel can be computed completely independently of each other, thus it would make sense
                to create a parallelized program which computes each pixel at the same time (say by using the GPU). My implementation is purely single-threaded, thus it takes a significant
                amount of time to render even basic scenes (each pixel can be computed quickly, but there are very many pixels in each image). 
                In the future I plan to restart and use webgl to program the GPU to allow for parallelization, potentially even allowing for real-time rendering.
                </p>
                <p>
                Secondly, only two types of objects are currently renderable (Spheres and Planes) and no other light sources besides point light sources have been implemented.
                This means only hard shadows are renderable, and light source reflections are less than optimal. Currently the point light source appears to be a rather large sphere,
                but only the very center is used for computing shadows whereas the rest is simply a white-colored object. In the future I would like to change this lightsource issue
                and add more object types, but for now I am satisfied with the program.
                </p>

                <p>
                Note: Please check out my WebGL Raytracing project for a GPU-accelerated version!
                </p>

            </div>
        </div>

    );
}


export default Raytrace;



/*----------------------------------------------------------------


function intersectSphere(r, sp, sr){
    let a = Math.pow(r.getMagnitude(),2);
    let b = -2*(  r.x*sp.x + r.y*sp.y + r.z*sp.z  );
    let c = Math.pow(sp.getMagnitude(),2) - sr*sr;

    let ret = quadraticFormula(a,b,c);
    if (ret != null)
    {
        if (ret.length == 1)
        {
            //line is tangent to sphere
            //console.log("< "+lx*ret[0] + ", "+ly*ret[0] + ", " + lz*ret[0] + " >")
            return new vec3(ret[0]*r.x, ret[0]*r.y, ret[0]*r.z );
        } else {
            //line intersects sphere
            let v1 = new vec3(ret[0]*r.x, ret[0]*r.y, ret[0]*r.z );
            let v2 = new vec3(ret[1]*r.x, ret[1]*r.y, ret[1]*r.z );
            if (v1.getMagnitude() < v2.getMagnitude()){
                return v1;
            }
            return v2;
            //return new vec3(ret[1]*r.x, ret[1]*r.y, ret[1]*r.z );
            //console.log("< "+lx*ret[0] + ", "+ly*ret[0] + ", " + lz*ret[0] + " >")
        }
    } else {
        return null;
    }
}
function distance(p1x,p1y,p1z, p2x,p2y,p2z)
{
    return Math.sqrt(Math.pow(p1x-p2x,2) + Math.pow(p1y-p2y,2) + Math.pow(p1z-p2z,2) );
}
function magnitude(x,y,z)
{
    return Math.sqrt( x*x + y*y + z*z);
}


function getVectorColor(ray, sp,sr)
{
    ray.normalize();

    let ret = intersectSphere(ray, sp, sr);
    if (ret != null)
    {
        let N = (ret.sub(sp)).normalize();

        let Rr = reflectRay(ray, N).normalize(0);

        ret = intersectSphere(Rr, new vec3(1,0,10), 1);

        if (ret != null)
        {
            N = (ret.sub(sp)).normalize();
            let angle = Math.atan2(N.y, N.x);
            if (angle%.5<0.25)
            {
                return new vec3(255,0,0);
            } else {
                return new vec3(0,255,0);
            }
            return new vec3(10,100,255);
        } else {
            return N.mul(255);
        }


        //return N.mul(255);
    } else {
        return new vec3(0,0,0);
    }
}
*/
