
class Planet {
    constructor(easygl, pos = new vec4(), rot = new vec4(), radius=3) {
        this.position = pos;
        this.rotation = rot;
        this.radius = radius;
        this.easygl = easygl;
        this.id = "planet_"+random()+"_";

        this.generateMesh();
    }

    generateMesh() {
        const ret = generatePlanet3(8, this.radius);
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;
        for(let i=0; i<ret.vertices.length; i++)
        {
            this.easygl.createObject(this.id + i, new vec4(), new vec4(), new vec4(1,1,1), ret.vertices[i], ret.indices[i], ret.normals[i], ret.colors[i], false, 0.6);
        }
    }

    setPosition(pos) {
        this.position = pos;
        for (let i=0; i<1000; i++)
        {
            const planetName = this.id + i;
            if (!gl.getObjectExists(planetName))
            {
                break;
            }
            gl.setObjectPosition(planetName, this.position);
        }
    }
    setRotation(rot) {
        this.rotation = rot;
        for (let i=0; i<1000; i++)
        {
            const planetName = this.id + i;
            if (!gl.getObjectExists(planetName))
            {
                break;
            }
            gl.setObjectRotation(planetName, this.rotation);
        }
    }

    update(dt=1) {
        this.setRotation(this.rotation.addi(0,0.002*dt));
    }
}

class Satellite {
    constructor(easygl, orbitRadius = 8, orbitTilt = 4) {
        this.position = new vec4(orbitRadius,0,0);
        this.rotation = new vec4(random(), random());
        this.orbitRadius = orbitRadius;
        this.orbitAngle = random()*6.28;
        this.orbitTilt = orbitTilt;
        this.orbitTiltOffset = random()*6.29;
        this.deltaOrbitAngle = 0.25/(this.orbitRadius*this.orbitRadius);
        this.deltaRotation = random()/10;
        this.id = "satellite_" + random();
        this.easygl = easygl;
    }
    setPosition(pos) {
        this.position = pos;
        this.easygl.setObjectPosition(this.id, this.position);
    }
    setRotation(rot) {
        this.rotation = rot;
        this.easygl.setObjectRotation(this.id, this.rotation);
    }
    generateMesh()
    {
        console.error("Child class did not implement generateMesh()");
    }
    update(dt=1){
        this.setRotation(this.rotation.addi(this.deltaRotation/20 * dt,this.deltaRotation*dt,this.deltaRotation/10 * dt));
        this.setPosition(new vec4(this.orbitRadius*Math.sin(this.orbitAngle), this.orbitTilt*Math.sin(this.orbitAngle + this.orbitTiltOffset), this.orbitRadius*Math.cos(this.orbitAngle)));
        this.orbitAngle += this.deltaOrbitAngle*dt;
    }
}

class Astroid extends Satellite{
    constructor(easygl, radius = 0.25, surfaceDefinition = 3, surfaceVariation = 0.6, orbitRadius = 8, orbitTilt = 4) {
        super(easygl, orbitRadius, orbitTilt);
        this.radius = radius;
        this.surfaceDefinition = surfaceDefinition;
        this.surfaceVariation = surfaceVariation;
        this.generateMesh();
    }
    generateMesh()
    {
        let ret = generateAstroid2(this.surfaceDefinition, this.radius, this.surfaceVariation);
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;
        this.easygl.createObject(this.id, new vec4(), new vec4(), new vec4(1,1,1), ret.vertices, ret.indices, ret.normals, ret.colors, false, 0.6);
    }
}

class SpaceStation extends Satellite{
    constructor(easygl, orbitRadius = 8, orbitTilt = 4, size = 0.5, color = new vec4(0.7,0.7,0.7,1)) {
        super(easygl, orbitRadius, orbitTilt);
        this.id = "spaceStation_"+Math.random();
        this.size = size;
        this.color = color;
        
        this.generateMesh();
    }

    generateMesh() {
        let ret = generateSpaceStation(this.size, this.color);
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;
        this.easygl.createObject(this.id, new vec4(), new vec4(), new vec4(1,1,1), ret.vertices, ret.indices, ret.normals, ret.colors, false, 0.6);
    }

    update(dt=1){
        this.setRotation(new vec4(this.orbitAngle + this.orbitTiltOffset,this.orbitAngle + 3.14));
        this.setPosition(new vec4(this.orbitRadius*Math.sin(this.orbitAngle), this.orbitTilt*Math.sin(this.orbitAngle + this.orbitTiltOffset), this.orbitRadius*Math.cos(this.orbitAngle)));
        this.orbitAngle += this.deltaOrbitAngle*dt;
    }
}

class ManMadeSatellite extends Satellite{
    constructor(easygl, orbitRadius = 8, orbitTilt = 4, size = 1, orbitSpeedMultiplier = 0.25, localRotationSpeedMultiplier = 1, 
                numSolarPanels = 2, surfaceDefinition = 5, color = new vec4(0.5,0.5,0.5,1)) {
        super(easygl, orbitRadius, orbitTilt, orbitSpeedMultiplier, localRotationSpeedMultiplier);

        this.size = size;
        this.surfaceDefinition = Math.min( Math.max(surfaceDefinition, 8), 10);
        this.numSolarPanels = Math.min(Math.max(numSolarPanels,2),4);
        this.color = color;

        this.generateMesh();
    }

    generateMesh() {
        let ret = generateSatellite(this.size, this.numSolarPanels, this.color);
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;
        this.easygl.createObject(this.id, new vec4(), new vec4(), new vec4(1,1,1), ret.vertices, ret.indices, ret.normals, ret.colors, false, 0.6);
        //this.buffer = initBuffers(this.vertices, this.normals, this.colors, this.indices);
    }
}



class Object {
    constructor(position = new vec4(), rotation = new vec4()) {
        this.position = position;
        this.rotation = rotation;
        this.positionMatrix = new mat4().makeTranslation(this.position);
        this.rotationMatrix = new mat4().makeRotation(this.rotation);
        this.id = random();
    }
    setPosition(pos) {
        this.position = pos;
        this.positionMatrix.makeTranslation(this.position);
    }
    setRotation(rot) {
        this.rotation = rot;
        this.rotationMatrix.makeRotation(this.rotation);
    }
    draw(gl, perspectiveMatrix, viewMatrix) {
        DrawDefault(gl, perspectiveMatrix, viewMatrix, this.positionMatrix, this.rotationMatrix, this.indices, this.buffer, true);
    }
}

class Satellite2 extends Object{
    constructor(orbitRadius = 8, orbitTilt = 4, orbitSpeedMultiplier = 0.25, localRotationSpeedMultiplier = 1) {
        super(new vec4(), new vec4());
        
        this.orbitRadius = orbitRadius;
        this.orbitTilt = orbitTilt;
        this.orbitAngle = random()*6.28;
        this.orbitTiltOffset = random()*6.28;
        this.deltaOrbitAngle = 0.25*orbitSpeedMultiplier/(this.orbitRadius*this.orbitRadius);
        this.localRotationSpeedMultiplier = localRotationSpeedMultiplier/10;

    }
    generateMesh() {
        console.error("Satellite.generateMesh() not implemented");
        return;
    }
    update(dt=1){
        this.setRotation(this.rotation.addi(this.localRotationSpeedMultiplier/50,this.localRotationSpeedMultiplier,this.localRotationSpeedMultiplier/10));
        //this.setRotation(new vec4(this.orbitAngle + this.orbitTiltOffset,this.orbitAngle + 3.14));
        this.setPosition(new vec4(this.orbitRadius*Math.sin(this.orbitAngle), this.orbitTilt*Math.sin(this.orbitAngle + this.orbitTiltOffset), this.orbitRadius*Math.cos(this.orbitAngle)));
        this.orbitAngle += this.deltaOrbitAngle*dt;
    }
}

class ManMadeSatellite_OLD extends Satellite{
    constructor(orbitRadius = 8, orbitTilt = 4, size = 1, orbitSpeedMultiplier = 0.25, localRotationSpeedMultiplier = 1, 
                numSolarPanels = 2, surfaceDefinition = 5, color = new vec4(0.5,0.5,0.5,1)) {
        super(orbitRadius, orbitTilt, orbitSpeedMultiplier, localRotationSpeedMultiplier);

        this.size = size;
        this.surfaceDefinition = Math.min( Math.max(surfaceDefinition, 3), 10);
        this.numSolarPanels = Math.min(Math.max(numSolarPanels,2),10);
        this.color = color;

        this.generateMesh();
    }

    generateMesh() {
        let ret = generateSatellite(this.size, this.numSolarPanels, this.color);
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;
        this.buffer = initBuffers(this.vertices, this.normals, this.colors, this.indices);
    }
}

class SpaceStation_OLD extends Satellite{
    constructor(orbitRadius = 8, orbitTilt = 4, size = 0.5, color = new vec4(0.7,0.7,0.7,1)) {

        super(orbitRadius, orbitTilt);

        this.size = size;
        this.color = color;
        
        this.generateMesh();
    }

    generateMesh() {
        let ret = generateSpaceStation(this.size, this.color);
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;
        //this.buffer = initBuffers(this.vertices, this.normals, this.colors, this.indices);
    }

    update(dt=1){
        //this.setRotation(this.rotation.addi(this.deltaRotation/20,this.deltaRotation,this.deltaRotation/10));
        this.setRotation(new vec4(this.orbitAngle + this.orbitTiltOffset,this.orbitAngle + 3.14));
        this.setPosition(new vec4(this.orbitRadius*Math.sin(this.orbitAngle), this.orbitTilt*Math.sin(this.orbitAngle + this.orbitTiltOffset), this.orbitRadius*Math.cos(this.orbitAngle)));
        this.orbitAngle += this.deltaOrbitAngle*dt;
        //this.setPosition(new vec4(0,0,7));
    }
}

class Airplane extends Object {
    constructor(position = new vec4(0,0,8), rotation = new vec4(0,0,0))
    {
        super(position,rotation);
        this.generateMesh();
    }
    generateMesh()
    {
        //let ret = BakeText();
        let ret = generateAirplane();
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;
        this.buffer = initBuffers(ret.vertices, ret.normals, ret.colors, ret.indices);
    }
    update(dt=1){
        this.setRotation(this.rotation.addi(.01*dt, .01*dt, .01*dt));
    }
}

class TextSatellite extends Satellite {
    constructor(text = "hello world", textColor = new vec4(1,1,1,1), textScale = 0.3, orbitRadius = 8, orbitTilt = 0, orbitSpeedMultiplier = 0.5) {
        super(orbitRadius, orbitTilt, orbitSpeedMultiplier, 0);
        this.text = text;
        this.textColor = textColor;
        this.textScale = textScale;
        this.generateMesh();
        this.orbitAngle = -3.14/3;
    }
    generateMesh()
    {   
        let ret = BakeText(this.text, this.textColor, new vec4(this.textScale,this.textScale,this.textScale));
        this.vertices = ret.vertices;
        this.indices = ret.indices;
        this.normals = ret.normals;
        this.colors = ret.colors;


        //Let's take these vertices and curl them a bit to make it look like htey actually wrap around the planet
        for (var i=0; i<this.vertices.length; i+=3)
        {
            this.vertices[i+2] = this.orbitRadius * Math.cos(this.vertices[i]/this.orbitRadius) - this.orbitRadius;
        }


        this.buffer = initBuffers(ret.vertices, ret.normals, ret.colors, ret.indices);

    }
    update(dt = 1){
        //this.setRotation(this.rotation.addi(this.deltaRotation/20,this.deltaRotation,this.deltaRotation/10));
        this.setRotation(new vec4(0,this.orbitAngle));
        this.setPosition(new vec4(this.orbitRadius*Math.sin(this.orbitAngle), this.orbitTilt*Math.sin(this.orbitAngle), this.orbitRadius*Math.cos(this.orbitAngle)));
        this.orbitAngle += this.deltaOrbitAngle*dt;
        //this.setPosition(new vec4(0,0,7));
    }

}



//Using static random numbers with setRandomSeed() so we can reproduce generations
var randomVariables = [];
var randomVariableOn = 0;
for (let i=0; i<10000; i++)
{
    randomVariables.push(Math.random());
}
function random()
{
    randomVariableOn += 1;
    if (randomVariableOn >= randomVariables.length)
    {
        randomVariableOn = 0;
    }
    return randomVariables[randomVariableOn];
}
function setRandomSeed(seed=0)
{
    randomVariableOn = seed % randomVariables.length;
}




const glCanvasElement = document.getElementById("glcanvas");
const fovSliderElement = document.getElementById("fovSlider");
const zNearSliderElement = document.getElementById("zNearSlider");
const zFarSliderElement = document.getElementById("zFarSlider");

const keys = {};
var objects = [];

glCanvasElement.width = window.visualViewport.width;
glCanvasElement.height = window.visualViewport.height;
glCanvasElement.style.width = glCanvasElement.width + "px";
glCanvasElement.style.height = glCanvasElement.height + 'px';
var gl = new EasyGL(glCanvasElement);
var sunRotationSpeed = 0.1;


function setup()
{
    objects.push( new Planet(gl) );
    objects.push( new SpaceStation(gl) );
    for (let i=0; i<50; i++)
    {
        objects.push(new Astroid(gl, random()/10 + 0.01, 4, random()*3, random()*10 + 5, random()*2));
    }
    for (let i=0; i<20; i++)
    {
        objects.push(new ManMadeSatellite(gl, 7 + random()*5, 8-random()*16, random()+0.25, 0.75 + random()/5, random(), random()*2+2 ) );
    }
}

gl.setCameraPosition(new vec4(0,0,10));
gl.createTexture("myTexture");
gl.createTextureObject("myObj", null, null, null, 
    [0,0,0, 0,2,0, 2,2,0, 2,0,0],
    [0,1,2, 0,2,1, 0,2,3, 0,3,2], 
    [1,1,1, 1,1,1, 1,1,1, 1,1,1], 
    [0,0, 0,1, 1,1, 1,0], "myTexture"
);
updateCameraSettings();

var resizeInterval;
var updateInverval = setInterval(update,50); //20fps


function updateCameraSettings()
{
    const FOV = (Math.PI/180.0) * Number(fovSliderElement.value);
    const aspect = glCanvasElement.width/glCanvasElement.height;
    const zNear = Number(zNearSliderElement.value);
    const zFar = Number(zFarSliderElement.value);
    gl.setPerspective(FOV, aspect, zNear, zFar);
}

window.onkeydown = function (e) {
    keys[e.key] = true;
    //console.log(e.key);
}
window.onkeyup = function(e) {
    keys[e.key] = false;
}
var lastScrollTop =0;
window.onscroll = function(e) {

    let dt = 1;
    if (window.scrollY < lastScrollTop) {
        dt = -2;
    }

    lastScrollTop = window.scrollY;
    for (var i in objects) {
        objects[i].update(dt);
    }
}
window.onresize = function(e) {
    var padding = window.innerWidth - glCanvasElement.width;
    glCanvasElement.style.paddingLeft = Math.round(padding/2) + "px";
}
function addAstroids() {
    for( var i=0; i<50; i++)
    {
        objects.push(new Astroid(gl,  random()/10 + 0.01, 4, random()*3, random()*10 + 5, random()*2));
    }
}
function addSatellites() {
    for( var i=0; i<50; i++)
    {
        objects.push(new ManMadeSatellite(gl, 7 + random()*5, 8-random()*16, random()+0.25, 0.75 + random()/5, random(), random()*2+2 ) );
    }
}
function resetObjects() {
    objects = [
        new Planet(),
        new SpaceStation(),
        new TextSatellite("Made By Zack Gunther"), 
        //new Airplane, 
    ];
    
    for( var i=0; i<50; i++)
    {
        objects.push(new Astroid(random()/10+0.05, 2, random()/3 + 0.1, random()*5 + 9, 5-random()*10 ));
    }
    for (var i=0; i<20; i++)
    {
        //objects.push(new ManMadeSatellite(random()*6 + 6, 8-random()*16, Math.random+0.1, random()*5 + 2, 5) );
        objects.push(new ManMadeSatellite(7 + random()*4, 8-random()*16, random()+0.25, 0.75 + random()/5, random(), random()*2+2 ) );
    }
    //setup();
}
function setSunRotateSpeed(e) {
    sunRotationSpeed = Number(e.value);
}


var rot = 0;
let dt = 0;
let startTime = Date.now();
const initialStartTimeSeconds = Date.now()/1000;
function update() {
    if (dt != 0 && objects.length == 0)
    {
        setup();
    }

    const s = (1 + Date.now()/1000 - initialStartTimeSeconds) * sunRotationSpeed;
    gl.setAmbientLightLevel(0.3);
    gl.setDirectionalLightingDirection(new vec4( Math.sin(s), -0.2, Math.cos(s)));

    dt = (Date.now() - startTime)/100;
    startTime = Date.now();
    gl.renderAll();

    for (let i in objects)
    {
        objects[i].update(dt);
    }

    if (keys['w'] == true)
    {
        gl.setCameraPosition(gl.getCameraPosition().add( new vec4(0,0,-.1) ));
    } else if (keys['s'] == true)
    {
        gl.setCameraPosition(gl.getCameraPosition().add( new vec4(0,0,.1) ));
    }

    if (keys['ArrowLeft'] == true)
    {
        for (let i in objects)
        {
            objects[i].update(-10*dt);
        }
    } else  if (keys['ArrowRight'] == true)
    {
        for (let i in objects)
        {
            objects[i].update(10*dt);
        }
    }
}


//Unused 
function UpdateView() {

    var normalVec = new vec4();

    if (keys['w'] == true ) {
        normalVec.z += 1;
    }
    if (keys['s'] == true) {
        normalVec.z -= 1;
    }
    if (keys['d'] == true ) {
        normalVec.x += 1;
    }
    if (keys['a'] == true) {
        normalVec.x -= 1;
    }

    if (keys['ArrowRight'] == true)
    {
        rotation.y += 0.1;
    }
    if (keys['ArrowLeft'] == true)
    {
        rotation.y -= 0.1;
    }
    if (keys['ArrowUp'] == true)
    {
        rotation.z -= 0.1;
    }
    if (keys['ArrowDown'] == true)
    {
        rotation.z += 0.1;
    }

    if (keys[' '] == true) {
        normalVec.y -= 2;
    }
    if (keys['Shift'] == true ){
        normalVec.y += 2;
    }

    if (keys['p'] == true) {
        rot += 0.05;
    }


    position.addi(normalVec.mul(0.1));
}


function expandMesh(vertices = [], indices = [], color = new vec4(), colorVariation = 0.1)
{
    v = [];
    ind = [];
    n = [];
    c = [];

    var indOn = 0;
    for(var i=0; i<indices.length; i+=3)
    {
        v.push(  vertices[indices[i]*3]  );
        v.push(  vertices[indices[i]*3 + 1]  );
        v.push(  vertices[indices[i]*3 + 2] );

        v.push(  vertices[indices[i+1]*3]  );
        v.push(  vertices[indices[i+1]*3 + 1]  );
        v.push(  vertices[indices[i+1]*3 + 2] );

        v.push(  vertices[indices[i+2]*3]  );
        v.push(  vertices[indices[i+2]*3 + 1]  );
        v.push(  vertices[indices[i+2]*3 + 2] );

        ind.push(indOn, indOn +1, indOn +2);
        indOn += 3;

        var a = new vec4( 
            vertices[indices[i+1]*3    ] - vertices[indices[i]*3    ],
            vertices[indices[i+1]*3 + 1] - vertices[indices[i]*3 + 1],
            vertices[indices[i+1]*3 + 2] - vertices[indices[i]*3 + 2], );
        var b = new vec4( 
            vertices[indices[i+2]*3    ] - vertices[indices[i]*3    ],
            vertices[indices[i+2]*3 + 1] - vertices[indices[i]*3 + 1],
            vertices[indices[i+2]*3 + 2] - vertices[indices[i]*3 + 2], );
        b.scaleToUnit();
        a.scaleToUnit();
        
        var nx = a.y*b.z - a.z*b.y;
        var ny = a.z*b.x - a.x*b.z;
        var nz = a.x*b.y - a.y*b.x;

        n.push( nx,ny,nz, nx,ny,nz, nx,ny,nz,);
        
        var rx = random()*colorVariation;
        var ry = random()*colorVariation;
        var rz = random()*colorVariation;
        for (var k=0; k<3; k++){
            c.push(color.x + rx, color.y + ry, color.z + rz, color.a);
            //c.push(color.x + random() * colorVariation, color.y + random() * colorVariation, color.z + random() * colorVariation, color.a);
        }

    }
    //console.log(v, ind, n, c);
    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
}

function generateSphereMesh(steps = 1, radius = 1, randomModifier = 0.0)
{
    var vertices = [0,-1,0, 1,0,0, 0,0,1, -1,0,0, 0,0,-1, 0,1,0];
    for (var i in vertices)
    {
        vertices[i] = vertices[i]*radius;
    }
    var indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    var zz = new vec4();
    for (var s=0; s<steps; s++)
    {
        var inds = [];
        var verts = [];

        for( var i=0; i<indices.length; i+=3)
        {
            let v1 = new vec4(vertices[indices[i]*3], vertices[indices[i]*3 + 1], vertices[indices[i]*3 + 2]);
            let v2 = new vec4(vertices[indices[i+1]*3], vertices[indices[i+1]*3 + 1], vertices[indices[i+1]*3 + 2]);
            let v3 = new vec4(vertices[indices[i+2]*3], vertices[indices[i+2]*3 + 1], vertices[indices[i+2]*3 + 2]);

            let b1 = (v1.add(v2)).muli(0.5);
            b1.muli( radius/distanceBetweenPoints(b1, zz)  );
            let b2 = (v2.add(v3)).muli(0.5);
            b2.muli( radius/distanceBetweenPoints(b2, zz)  );
            let b3 = (v1.add(v3)).muli(0.5);
            b3.muli( radius/distanceBetweenPoints(b3, zz)  );

            let lv = verts.length/3;

            inds.push( lv, lv+3, lv+5 );  //bottom-left
            inds.push( lv+3, lv+1, lv+4); //top
            inds.push( lv+5, lv+4, lv+2); //bottom-right
            inds.push( lv+3, lv+4, lv+5); //center

            verts.push(v1.x, v1.y, v1.z,   v2.x, v2.y, v2.z,  v3.x, v3.y, v3.z);
            verts.push(b1.x, b1.y, b1.z,   b2.x, b2.y, b2.z,  b3.x, b3.y, b3.z);
        }

        //var ret = removeDuplicateVertices(verts, inds);
        //vertices = ret.vertices;
        //indices = ret.indices;
        vertices = verts;
        indices = inds;
    }

    var ret = removeDuplicateVertices(vertices, indices);

    for (var i=0; i<ret.vertices.length; i++)
    {
        ret.vertices[i] += random()*randomModifier*radius;
    }
    return ret;
    return expandMesh(ret.vertices, ret.indices, color, colorVariation);
}

function removeDuplicateVertices(verts, inds, norms, cols)
{
    var vertDict = {};
    var vertices = [];
    var indices = [];
    var normals = [];
    var colors = [];
    for(var i=0; i<inds.length; i++)
    {
        var hash = verts[inds[i]*3] + verts[inds[i]*3+1]*1000 + verts[inds[i]*3+2]*1000000;
        var ret = vertDict[hash];
        if (ret != null)
        {
            //If we've already encountered this vertex...
            // just change inds
            indices.push(ret);
        } else {
            var newInd = vertices.length/3;
            indices.push(newInd);
            vertices.push(  verts[inds[i]*3], verts[inds[i]*3+1], verts[inds[i]*3+2] );
            if (normals.length > inds[i]*3) { 
                normals.push(   norms[inds[i]*3], norms[inds[i]*3+1], norms[inds[i]*3+2] );
            }
            if (colors.length > inds[i]*4)
            {
                colors.push( cols[inds[i]*4], cols[inds[i]*4+1], cols[inds[i]*4+2], cols[inds[i]*4+3] );
            }
            
            vertDict[hash] = newInd;
        }
    }
    return {
        vertices: vertices,
        indices: indices,
        colors: colors,
        normals: normals,
    };
}












//Takes in steps which is precision of model, radius, randomModifier(height), and colorvariation
//Returns dicitonary of: vertices, indices, normals, colors
function generatePlanet(steps = 5, radius = 2, randomModifier = 0.1, colorVariation=0.2)
{
    //var vertices = [0,-1,0, 1,0,0, 0,0,1, -1,0,0, 0,0,-1, 0,1,0];
    var indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    var vertices = [
        new vec4(0,-1,0),
        new vec4(1,0,0),
        new vec4(0,0,1),
        new vec4(-1,0,0),
        new vec4(0,0,-1),
        new vec4(0,1,0),
    ];


    var vertDict = new Map();
    for (var i in vertices)
    {
        vertices[i].muli(radius);
        vertDict.set(vertices[i], i);
    }
   
    //Generate sphere mesh
    var zz = new vec4();
    for (var s=0; s<steps; s++)
    {
        var inds = [];

        for( var i=0; i<indices.length; i+=3)
        {
            let v1 = vertices[indices[i]];
            let v2 = vertices[indices[i+1]];
            let v3 = vertices[indices[i+2]];

            let b1 = (v1.add(v2)).muli(0.5);
            b1.muli( radius/distanceBetweenPoints(b1, zz)  );
            let b2 = (v2.add(v3)).muli(0.5);
            b2.muli( radius/distanceBetweenPoints(b2, zz)  );
            let b3 = (v1.add(v3)).muli(0.5);
            b3.muli( radius/distanceBetweenPoints(b3, zz)  );


            let r = vertDict.get(b1);
            if (r != null) {
                b1 = r;
            } else {
                r = vertices.length;
                vertDict.set(b1,r);
                vertices.push(b1);
                b1 = r;
            }

            r = vertDict.get(b2);
            if (r != null) {
                b2 = r;
            } else {
                r = vertices.length;
                vertDict.set(b2,r);
                vertices.push(b2);
                b2 = r;
            }

            r = vertDict.get(b3);
            if (r != null) {
                b3 = r;
            } else {
                r = vertices.length;
                vertDict.set(b3,r);
                vertices.push(b3);
                b3 = r;
            }

            inds.push(indices[i], b1, b3,   b1, indices[i+1], b2,   b3, b2, indices[i+2],  b1,b2,b3);
        }

        indices = inds;
    }

    //Modifying the shape to make it into a planet
    for (var t=0; t<50; t++) {
        var r = new vec4(0.5-random(), 0.5-random(), 0.5-random()).scaleToUnit().mul(radius);
        var multiplier = 1 + random()*randomModifier;
        var d = radius/(3+t/10);
        var a = r.x*r.x + r.y*r.y + r.z*r.z;
        for (var i in vertices)
        {
            let b = -2*( r.x*vertices[i].x + r.y*vertices[i].y + r.z*vertices[i].z );
            let c = vertices[i].x*vertices[i].x + vertices[i].y*vertices[i].y + vertices[i].z*vertices[i].z - d*d;
            if ( b*b - 4 * a * c >= 0)
            {
                vertices[i].muli(multiplier);
            }
        }
    }


    var v = [];
    var ind = [];
    var n = [];
    var c = [];

    //transform...

    var indOn = 0;
    for(var i=0; i<indices.length; i+=3)
    {

        v.push( vertices[indices[i]].x, vertices[indices[i]].y, vertices[indices[i]].z);
        v.push( vertices[indices[i+1]].x, vertices[indices[i+1]].y, vertices[indices[i+1]].z);
        v.push( vertices[indices[i+2]].x, vertices[indices[i+2]].y, vertices[indices[i+2]].z);


        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        

       
        //n.push( nx,ny,nz, nx,ny,nz, nx,ny,nz);
        
        var maxMag = Math.max(vertices[indices[i+0]].getLength(), vertices[indices[i+1]].getLength(), vertices[indices[i+2]].getLength())/radius;

        if (maxMag < -1)
        {
            var n1 = vertices[indices[i]].copy().scaleToUnit();
            var n2 = vertices[indices[i+1]].copy().scaleToUnit();
            var n3 = vertices[indices[i+2]].copy().scaleToUnit();
            n.push( n1.x, n1.y, n1.z,  n2.z, n2.y, n2.z, n3.x, n3.y, n3.z);
        } else {
            var a = vertices[indices[i+1]].sub(vertices[indices[i]]);
            var b = vertices[indices[i+2]].sub(vertices[indices[i]]);
            b.scaleToUnit();
            a.scaleToUnit();
            var nx = a.y*b.z - a.z*b.y;
            var ny = a.z*b.x - a.x*b.z;
            var nz = a.x*b.y - a.y*b.x;
            let newN = new vec4(nx,ny,nz).scaleToUnit();
            n.push( newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, );
        }


        for (var k=0; k<3; k++){
            let mag = vertices[indices[i+k]].getLength()/radius;
            let cv = random()*colorVariation;
            let yvar = Math.abs(vertices[indices[i+k]].y);
            /*
            if (mag < 1.01)
            {
                c.push(cv/2,cv/2,mag*mag,1);
            } else if (mag < 1 + randomModifier*1.3)
            {
                c.push((mag-1)*10,1-(mag-1)*3,(mag-1)*10,1);
            } else {
                c.push(1,1,1,1);
            }*/

            /*if (mag < 1.01)
            {
                c.push(cv/2,cv/2,mag*mag,1);
            } else {
                c.push((mag-1)*10,  1-0.2*(10*mag-11)*(50*mag-53),  (mag-1)*10,1);
            }*/
            if (yvar > radius*4/5)
            {
                c.push(1-cv,1-cv,1-cv,1);
                continue;
            }

            if (maxMag < 1.01)
            {
                c.push(0,0,.8,1);
            } else if (mag < 1 + randomModifier*1.2)
            {
                c.push(cv,.9-cv-yvar/5,cv,1);
            } else if (mag < 1 + randomModifier*1.4)
            {
                c.push(.45,.41,.33,1);
            } else {
                c.push(1-cv,1-cv,1-cv,1);
            }
        }
    }


    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
}

function generatePlanet2(steps = 5, radius = 3, randomModifier = 0.1, findRandomModifier = 3, colorVariation=0.2)
{
    setRandomSeed(0);
    //var vertices = [0,-1,0, 1,0,0, 0,0,1, -1,0,0, 0,0,-1, 0,1,0];
    let indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    let vertices = [
        new vec4(0,-1,0),
        new vec4(1,0,0),
        new vec4(0,0,1),
        new vec4(-1,0,0),
        new vec4(0,0,-1),
        new vec4(0,1,0),
    ];


    let vertDict = new Map();
    for (let i in vertices)
    {
        vertices[i].muli(radius);
        vertDict.set(vertices[i].getHash(), i);
    }
   
    //Generate sphere mesh with distortions
    let zz = new vec4();  //zero zero, the center of the sphere
    for (let s=0; s<steps; s++)
    {
        let inds = [];
        for( let i=0; i<indices.length; i+=3)
        {
            let v1 = vertices[indices[i]];
            let v2 = vertices[indices[i+1]];
            let v3 = vertices[indices[i+2]];
            let r1 = distanceBetweenPoints(v1, zz);
            let r2 = distanceBetweenPoints(v2, zz);
            let r3 = distanceBetweenPoints(v3, zz)
            let dv1v2 = (r1 + r2)/2;
            let dv1v3 = (r1 + r3)/2;
            let dv2v3 = (r2 + r3)/2;

            let rand = 1; //(0.95 + random()*0.05);
            let b1 = (v1.add(v2)).muli(0.5);
            b1.muli( dv1v2 /distanceBetweenPoints(b1, zz)  );
            let b2 = (v2.add(v3)).muli(0.5);
            b2.muli( dv2v3 /distanceBetweenPoints(b2, zz)  );
            let b3 = (v1.add(v3)).muli(0.5);
            b3.muli( dv1v3 /distanceBetweenPoints(b3, zz)  );

            
            let r = vertDict.get(b1.getHash());
            if (r != null) {
                b1 = r;
            } else {
                r = vertices.length;
                vertDict.set(b1.getHash(),r);
                vertices.push(b1);
                b1 = r;
            }

            r = vertDict.get(b2.getHash());
            if (r != null) {
                b2 = r;
            } else {
                r = vertices.length;
                vertDict.set(b2.getHash(),r);
                vertices.push(b2);
                b2 = r;
            }

            r = vertDict.get(b3.getHash());
            if (r != null) {
                b3 = r;
            } else {
                r = vertices.length;
                vertDict.set(b3.getHash(),r);
                vertices.push(b3);
                b3 = r;
            }

            inds.push(indices[i], b1, b3,   b1, indices[i+1], b2,   b3, b2, indices[i+2],  b1,b2,b3);
        }
        indices = inds;

        //distorting the mesh from a sphere
        for (let i in vertices)
        {
            let v = vertices[i];
            v.muli(1 + random()/(1/randomModifier + s*s*findRandomModifier));
            vertDict.set(v.getHash(), i);
        }
    }

    //Find new average radius, so that we can adjust the ocean height (coloring)
    radius = 0;
    let temp = 0;
    let maxi = 0;
    for (let i in vertices)
    {
        temp = vertices[i].getLength();
        radius += temp;
        if (temp > maxi){
            maxi = temp;
        }
    }
    radius /= vertices.length;
    const maxRadius = maxi;
    const mountainHeight = maxRadius - radius;
    const mountainPercent = mountainHeight/radius;

    //Now, smooth out oceans
    for (let i in vertices)
    {
        temp = vertices[i].getLength();
        if (temp < radius)
        {
            vertices[i].muli(radius/temp);
        }
    }

    //console.log("new radius: " + radius);
    let v = [];
    let ind = [];
    let n = [];
    let c = [];
    
    let vs = [];
    let inds = [];
    let ns = [];
    let cs = [];

    //transform...
    // and Color planet
    let indOn = 0;
    for(let i=0; i<indices.length; i+=3)
    {
        if (v.length > 100000)
        {
            vs.push(v);
            inds.push(ind);
            ns.push(n);
            cs.push(c);
            indOn = 0;
            v = [];
            ind = [];
            n = [];
            c = [];
        }
        v.push( vertices[indices[i]].x, vertices[indices[i]].y, vertices[indices[i]].z);
        v.push( vertices[indices[i+1]].x, vertices[indices[i+1]].y, vertices[indices[i+1]].z);
        v.push( vertices[indices[i+2]].x, vertices[indices[i+2]].y, vertices[indices[i+2]].z);

        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        const maxMag = Math.max(vertices[indices[i+0]].getLength(), vertices[indices[i+1]].getLength(), vertices[indices[i+2]].getLength())/radius;
        
        //Creating normal vectors
        if (maxMag < -10000)
        {
            const n1 = vertices[indices[i]].copy().scaleToUnit();
            const n2 = vertices[indices[i+1]].copy().scaleToUnit();
            const n3 = vertices[indices[i+2]].copy().scaleToUnit();
            n.push( n1.x, n1.y, n1.z,  n2.x, n2.y, n2.z, n3.x, n3.y, n3.z);
        } else {
            const a = vertices[indices[i+1]].sub(vertices[indices[i]]);
            const b = vertices[indices[i+2]].sub(vertices[indices[i]]);
            b.scaleToUnit();
            a.scaleToUnit();
            const nx = a.y*b.z - a.z*b.y;
            const ny = a.z*b.x - a.x*b.z;
            const nz = a.x*b.y - a.y*b.x;
            const newN = new vec4(nx,ny,nz).scaleToUnit();
            n.push( newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, );
        }

        //colors..?
        for (let k=0; k<3; k++){
            const vecMag = vertices[indices[i+k]].getLength();
            const mag = vecMag/radius;
            const magDifScaled = (vecMag - radius)/mountainHeight;
            const cv = random()*colorVariation;
            const yvar = Math.abs(vertices[indices[i+k]].y)/radius;
            
           
            if (yvar > 0.85)
            {
                c.push(1-cv,1-cv,1-cv,1); //color polar ice caps
            } else if (magDifScaled < 0.0001) 
            {
                c.push(0, (1-yvar)/4, cv +  .5 - yvar/2,1);//for water
            } else if (magDifScaled < 0.5) 
            {
                c.push(cv,(.5-cv-yvar*0.3)/mag,cv,1);//for forest
            } else if (magDifScaled < 0.7) 
            {
                c.push(.45,.41,.33,1);//for mountains
            } else { 
                c.push(1-cv,1-cv,1-cv,1);//for snowy peaks
            }
        }
    }
    vs.push(v);
    inds.push(ind);
    ns.push(n);
    cs.push(c);


    return {
        vertices: vs,
        indices: inds,
        normals: ns,
        colors: cs,
    }
}
function generatePlanet3(steps = 5, radius = 3, randomModifier = 0.1, findRandomModifier = 3, colorVariation=0.2)
{
    setRandomSeed(0);
    //var vertices = [0,-1,0, 1,0,0, 0,0,1, -1,0,0, 0,0,-1, 0,1,0];
    let indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    let vertices = [
        new vec4(0,-1,0),
        new vec4(1,0,0),
        new vec4(0,0,1),
        new vec4(-1,0,0),
        new vec4(0,0,-1),
        new vec4(0,1,0),
    ];


    let vertDict = new Map();
    for (let i in vertices)
    {
        vertices[i].muli(radius);
        vertDict.set(vertices[i].getHash(), i);
    }
   
    //Generate sphere mesh with distortions
    let zz = new vec4();  //zero zero, the center of the sphere
    for (let s=0; s<steps; s++)
    {
        let inds = [];
        for( let i=0; i<indices.length; i+=3)
        {
            let v1 = vertices[indices[i]];
            let v2 = vertices[indices[i+1]];
            let v3 = vertices[indices[i+2]];
            let r1 = distanceBetweenPoints(v1, zz);
            let r2 = distanceBetweenPoints(v2, zz);
            let r3 = distanceBetweenPoints(v3, zz)
            let dv1v2 = (r1 + r2)/2;
            let dv1v3 = (r1 + r3)/2;
            let dv2v3 = (r2 + r3)/2;

            let rand = 1; //(0.95 + random()*0.05);
            let b1 = (v1.add(v2)).muli(0.5);
            b1.muli( dv1v2 /distanceBetweenPoints(b1, zz)  );
            let b2 = (v2.add(v3)).muli(0.5);
            b2.muli( dv2v3 /distanceBetweenPoints(b2, zz)  );
            let b3 = (v1.add(v3)).muli(0.5);
            b3.muli( dv1v3 /distanceBetweenPoints(b3, zz)  );

            
            let r = vertDict.get(b1.getHash());
            if (r != null) {
                b1 = r;
            } else {
                r = vertices.length;
                vertDict.set(b1.getHash(),r);
                vertices.push(b1);
                b1 = r;
            }

            r = vertDict.get(b2.getHash());
            if (r != null) {
                b2 = r;
            } else {
                r = vertices.length;
                vertDict.set(b2.getHash(),r);
                vertices.push(b2);
                b2 = r;
            }

            r = vertDict.get(b3.getHash());
            if (r != null) {
                b3 = r;
            } else {
                r = vertices.length;
                vertDict.set(b3.getHash(),r);
                vertices.push(b3);
                b3 = r;
            }

            inds.push(indices[i], b1, b3,   b1, indices[i+1], b2,   b3, b2, indices[i+2],  b1,b2,b3);
        }
        indices = inds;

        //distorting the mesh from a sphere
        for (let i in vertices)
        {
            let v = vertices[i];
            v.muli(1 + random()/(1/randomModifier + s*s*findRandomModifier));
            vertDict.set(v.getHash(), i);
        }
    }

    //Find new average radius, so that we can adjust the ocean height (coloring)
    radius = 0;
    let temp = 0;
    let maxi = 0;
    for (let i in vertices)
    {
        temp = vertices[i].getLength();
        radius += temp;
        if (temp > maxi){
            maxi = temp;
        }
    }
    radius /= vertices.length;
    const maxRadius = maxi;
    const mountainHeight = maxRadius - radius;
    const mountainPercent = mountainHeight/radius;

    //Now, smooth out oceans
    for (let i in vertices)
    {
        temp = vertices[i].getLength();
        if (temp < radius)
        {
            vertices[i].muli(radius/temp);
        }
    }

    //console.log("new radius: " + radius);
    let v = [];
    let ind = [];
    let n = [];
    let c = [];
    
    let vs = [];
    let inds = [];
    let ns = [];
    let cs = [];

    //transform...
    // and Color planet
    let indOn = 0;
    for(let i=0; i<indices.length; i+=3)
    {
        if (v.length > 100000)
        {
            vs.push(v);
            inds.push(ind);
            ns.push(n);
            cs.push(c);
            indOn = 0;
            v = [];
            ind = [];
            n = [];
            c = [];
        }
        v.push( vertices[indices[i]].x, vertices[indices[i]].y, vertices[indices[i]].z);
        v.push( vertices[indices[i+1]].x, vertices[indices[i+1]].y, vertices[indices[i+1]].z);
        v.push( vertices[indices[i+2]].x, vertices[indices[i+2]].y, vertices[indices[i+2]].z);

        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        const maxMag = Math.max(vertices[indices[i+0]].getLength(), vertices[indices[i+1]].getLength(), vertices[indices[i+2]].getLength())/radius;
        
        //Creating normal vectors
        if (maxMag < -10000)
        {
            const n1 = vertices[indices[i]].copy().scaleToUnit();
            const n2 = vertices[indices[i+1]].copy().scaleToUnit();
            const n3 = vertices[indices[i+2]].copy().scaleToUnit();
            n.push( n1.x, n1.y, n1.z,  n2.x, n2.y, n2.z, n3.x, n3.y, n3.z);
        } else {
            const a = vertices[indices[i+1]].sub(vertices[indices[i]]);
            const b = vertices[indices[i+2]].sub(vertices[indices[i]]);
            b.scaleToUnit();
            a.scaleToUnit();
            const nx = a.y*b.z - a.z*b.y;
            const ny = a.z*b.x - a.x*b.z;
            const nz = a.x*b.y - a.y*b.x;
            const newN = new vec4(nx,ny,nz).scaleToUnit();
            n.push( newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, );
        }

        //colors..?
        for (let k=0; k<3; k++){
            const vecMag = vertices[indices[i+k]].getLength();
            const mag = vecMag/radius;
            const magDifScaled = (vecMag - radius)/mountainHeight;
            const cv = random()*colorVariation;
            const yvar = Math.abs(vertices[indices[i+k]].y)/radius;
            
           
            if (yvar > 0.85)
            {
                c.push(1-cv,1-cv,1-cv,1); //color polar ice caps
            } else if (magDifScaled < 0.0001) 
            {
                c.push(0, (1-yvar)/4, cv +  .5 - yvar/2,1);//for water
            } else if (magDifScaled < 0.5) 
            {
                c.push(cv,(.5-cv-yvar*0.3)/mag,cv,1);//for forest
            } else if (magDifScaled < 0.7) 
            {
                c.push(.45,.41,.33,1);//for mountains
            } else { 
                c.push(1-cv,1-cv,1-cv,1);//for snowy peaks
            }
        }
    }
    vs.push(v);
    inds.push(ind);
    ns.push(n);
    cs.push(c);


    return {
        vertices: vs,
        indices: inds,
        normals: ns,
        colors: cs,
    }
}

function generateAstroid2(steps = 3, radius = 3, randomModifier = 0.1, findRandomModifier = 3, colorVariation=0.2)
{
    //var vertices = [0,-1,0, 1,0,0, 0,0,1, -1,0,0, 0,0,-1, 0,1,0];
    let indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    let vertices = [
        new vec4(0,-1,0),
        new vec4(1,0,0),
        new vec4(0,0,1),
        new vec4(-1,0,0),
        new vec4(0,0,-1),
        new vec4(0,1,0),
    ];


    let vertDict = new Map();
    for (let i in vertices)
    {
        vertices[i].muli(radius);
        vertDict.set(vertices[i].getHash(), i);
    }
   
    //Generate sphere mesh with distortions
    let zz = new vec4();  //zero zero, the center of the sphere
    for (let s=0; s<steps; s++)
    {
        let inds = [];
        for( let i=0; i<indices.length; i+=3)
        {
            let v1 = vertices[indices[i]];
            let v2 = vertices[indices[i+1]];
            let v3 = vertices[indices[i+2]];
            let r1 = distanceBetweenPoints(v1, zz);
            let r2 = distanceBetweenPoints(v2, zz);
            let r3 = distanceBetweenPoints(v3, zz)
            let dv1v2 = (r1 + r2)/2;
            let dv1v3 = (r1 + r3)/2;
            let dv2v3 = (r2 + r3)/2;

            let rand = 1; //(0.95 + random()*0.05);
            let b1 = (v1.add(v2)).muli(0.5);
            b1.muli( dv1v2 /distanceBetweenPoints(b1, zz)  );
            let b2 = (v2.add(v3)).muli(0.5);
            b2.muli( dv2v3 /distanceBetweenPoints(b2, zz)  );
            let b3 = (v1.add(v3)).muli(0.5);
            b3.muli( dv1v3 /distanceBetweenPoints(b3, zz)  );

            
            let r = vertDict.get(b1.getHash());
            if (r != null) {
                b1 = r;
            } else {
                r = vertices.length;
                vertDict.set(b1.getHash(),r);
                vertices.push(b1);
                b1 = r;
            }

            r = vertDict.get(b2.getHash());
            if (r != null) {
                b2 = r;
            } else {
                r = vertices.length;
                vertDict.set(b2.getHash(),r);
                vertices.push(b2);
                b2 = r;
            }

            r = vertDict.get(b3.getHash());
            if (r != null) {
                b3 = r;
            } else {
                r = vertices.length;
                vertDict.set(b3.getHash(),r);
                vertices.push(b3);
                b3 = r;
            }

            inds.push(indices[i], b1, b3,   b1, indices[i+1], b2,   b3, b2, indices[i+2],  b1,b2,b3);
        }
        indices = inds;

        //distorting the mesh from a sphere
        for (let i in vertices)
        {
            let v = vertices[i];
            v.muli(1 + random()/(1/randomModifier + s*s*findRandomModifier));
            vertDict.set(v.getHash(), i);
        }
    }

    //Find new average radius, so that we can adjust the ocean height (coloring)
    radius = 0;
    let temp = 0;
    let maxi = 0;
    for (let i in vertices)
    {
        temp = vertices[i].getLength();
        radius += temp;
        if (temp > maxi){
            maxi = temp;
        }
    }
    radius /= vertices.length;
    const maxRadius = maxi;
    const mountainHeight = maxRadius - radius;
    const mountainPercent = mountainHeight/radius;

    // //Now, smooth out oceans
    // for (let i in vertices)
    // {
    //     temp = vertices[i].getLength();
    //     if (temp < radius)
    //     {
    //         vertices[i].muli(radius/temp);
    //     }
    // }

    //console.log("new radius: " + radius);
    
    let v = [];
    let ind = [];
    let n = [];
    let c = [];
    
    let vs = [];
    let inds = [];
    let ns = [];
    let cs = [];

    //transform...
    // and Color planet
    let indOn = 0;
    for(let i=0; i<indices.length; i+=3)
    {
        // if (v.length > 100000)
        // {
        //     vs.push(v);
        //     inds.push(ind);
        //     ns.push(n);
        //     cs.push(c);
        //     indOn = 0;
        //     v = [];
        //     ind = [];
        //     n = [];
        //     c = [];
        // }

        v.push( vertices[indices[i]].x, vertices[indices[i]].y, vertices[indices[i]].z);
        v.push( vertices[indices[i+1]].x, vertices[indices[i+1]].y, vertices[indices[i+1]].z);
        v.push( vertices[indices[i+2]].x, vertices[indices[i+2]].y, vertices[indices[i+2]].z);

        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        const maxMag = Math.max(vertices[indices[i+0]].getLength(), vertices[indices[i+1]].getLength(), vertices[indices[i+2]].getLength())/radius;
        
        //Creating normal vectors
        if (maxMag < -1)
        {
            const n1 = vertices[indices[i]].copy().scaleToUnit();
            const n2 = vertices[indices[i+1]].copy().scaleToUnit();
            const n3 = vertices[indices[i+2]].copy().scaleToUnit();
            n.push( n1.x, n1.y, n1.z,  n2.z, n2.y, n2.z, n3.x, n3.y, n3.z);
        } else {
            const a = vertices[indices[i+1]].sub(vertices[indices[i]]);
            const b = vertices[indices[i+2]].sub(vertices[indices[i]]);
            b.scaleToUnit();
            a.scaleToUnit();
            const nx = a.y*b.z - a.z*b.y;
            const ny = a.z*b.x - a.x*b.z;
            const nz = a.x*b.y - a.y*b.x;
            const newN = new vec4(nx,ny,nz).scaleToUnit();
            n.push( newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, );
        }

        //colors..?
        for (let k=0; k<3; k++){
            let cv = random()*colorVariation;
            c.push(0.32 + cv, 0.26 + cv, 0.13 + cv, 1);
            // const vecMag = vertices[indices[i+k]].getLength();
            // const mag = vecMag/radius;
            // const magDifScaled = (vecMag - radius)/mountainHeight;
            // const cv = random()*colorVariation;
            // const yvar = Math.abs(vertices[indices[i+k]].y)/radius;
            
           
            // if (yvar > 0.85)
            // {
            //     c.push(1-cv,1-cv,1-cv,1); //color polar ice caps
            // } else if (magDifScaled < 0.0001) 
            // {
            //     c.push(0, (1-yvar)/4, cv +  .8 - yvar/2,1);//for water
            // } else if (magDifScaled < 0.6) 
            // {
            //     c.push(cv,(.9-cv-yvar*0.8)/mag,cv,1);//for forest
            // } else if (magDifScaled < 0.8) 
            // {
            //     c.push(.45,.41,.33,1);//for mountains
            // } else { 
            //     c.push(1-cv,1-cv,1-cv,1);//for snowy peaks
            // }
        }
    }
    // vs.push(v);
    // inds.push(ind);
    // ns.push(n);
    // cs.push(c);


    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
}

function generateAstroid(steps = 2, radius = 0.5, randomModifier = 0.1, colorVariation=0.2)
{
    var indices = [0,1,2, 0,2,3, 0,3,4, 0,4,1, 1,5,2, 2,5,3, 3,5,4, 4,5,1];
    var vertices = [
        new vec4(0,-1,0),
        new vec4(1,0,0),
        new vec4(0,0,1),
        new vec4(-1,0,0),
        new vec4(0,0,-1),
        new vec4(0,1,0),
    ];


    var vertDict = new Map();
    for (var i in vertices)
    {
        vertices[i].muli(radius);
        vertDict.set(vertices[i], i);
    }

   
    var zz = new vec4();
    for (var s=0; s<steps; s++)
    {
        var inds = [];

        for( var i=0; i<indices.length; i+=3)
        {
            let v1 = vertices[indices[i]];
            let v2 = vertices[indices[i+1]];
            let v3 = vertices[indices[i+2]];

            let b1 = (v1.add(v2)).muli(0.5);
            b1.muli( radius/distanceBetweenPoints(b1, zz)  );
            let b2 = (v2.add(v3)).muli(0.5);
            b2.muli( radius/distanceBetweenPoints(b2, zz)  );
            let b3 = (v1.add(v3)).muli(0.5);
            b3.muli( radius/distanceBetweenPoints(b3, zz)  );


            let r = vertDict.get(b1);
            if (r != null) {
                b1 = r;
            } else {
                r = vertices.length;
                vertDict.set(b1,r);
                vertices.push(b1);
                b1 = r;
            }

            r = vertDict.get(b2);
            if (r != null) {
                b2 = r;
            } else {
                r = vertices.length;
                vertDict.set(b2,r);
                vertices.push(b2);
                b2 = r;
            }

            r = vertDict.get(b3);
            if (r != null) {
                b3 = r;
            } else {
                r = vertices.length;
                vertDict.set(b3,r);
                vertices.push(b3);
                b3 = r;
            }

            inds.push(indices[i], b1, b3,   b1, indices[i+1], b2,   b3, b2, indices[i+2],  b1,b2,b3);
        }

        indices = inds;
    }

    
    for (var t=0; t<50; t++) {
        var r = new vec4(0.5-random(), 0.5-random(), 0.5-random()).scaleToUnit().mul(radius);
        var multiplier = 1 + random()*randomModifier;
        var d = radius/(3+t/10);
        var a = r.x*r.x + r.y*r.y + r.z*r.z;
        for (var i in vertices)
        {
            let b = -2*( r.x*vertices[i].x + r.y*vertices[i].y + r.z*vertices[i].z );
            let c = vertices[i].x*vertices[i].x + vertices[i].y*vertices[i].y + vertices[i].z*vertices[i].z - d*d;
            if ( b*b - 4 * a * c >= 0)
            {
                vertices[i].muli(multiplier);
            }
        }
    }


    var v = [];
    var ind = [];
    var n = [];
    var c = [];

    var indOn = 0;
    for(var i=0; i<indices.length; i+=3)
    {
        v.push( vertices[indices[i]].x, vertices[indices[i]].y, vertices[indices[i]].z);
        v.push( vertices[indices[i+1]].x, vertices[indices[i+1]].y, vertices[indices[i+1]].z);
        v.push( vertices[indices[i+2]].x, vertices[indices[i+2]].y, vertices[indices[i+2]].z);


        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        var a = vertices[indices[i+1]].sub(vertices[indices[i]]);
        var b = vertices[indices[i+2]].sub(vertices[indices[i]]);

        b.scaleToUnit();
        a.scaleToUnit();
        
        var nx = a.y*b.z - a.z*b.y;
        var ny = a.z*b.x - a.x*b.z;
        var nz = a.x*b.y - a.y*b.x;

        n.push( nx,ny,nz, nx,ny,nz, nx,ny,nz,);
        
        
        for (var k=0; k<3; k++){
            let mag = vertices[indices[i+k]].getLength()/radius;
            let cv = random()*colorVariation;
            c.push(0.32 + cv, 0.26 + cv, 0.13 + cv, 1);
        }
    }

    //console.log(c.length/4, v.length/3)



    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
}





function generateSatellite(size = 1, numSolarPanels = 6, color = new vec4(0.5,0.5,.5,1)) {

    numSolarPanels = Math.min(Math.max(numSolarPanels,2),6);


    var vertices = [];
    var indices = [];
    var colors = [];

    var ret = generateRect(2,5,new vec4(0.2,0.2,0.9,1));

    //Adding the solar panels
    for (var i=0; i<numSolarPanels; i++)
    {
        addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,0,0), new vec4(i*6.28/numSolarPanels), new vec4(0.1*size,0.1*size,0.1*size));
    }
    //adding the main body
    ret = generateClosedCylinder(3,0.75,10, color)
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,0,-.05), new vec4(0,0,3.1415/2), new vec4(0.15*size,0.15*size,0.15*size));

    var v = [];
    var ind = [];
    var n = [];
    var c = [];

    var indOn = 0;
    for(var i=0; i<indices.length; i+=3)
    {
        v.push( vertices[indices[i]].x, vertices[indices[i]].y, vertices[indices[i]].z);
        v.push( vertices[indices[i+1]].x, vertices[indices[i+1]].y, vertices[indices[i+1]].z);
        v.push( vertices[indices[i+2]].x, vertices[indices[i+2]].y, vertices[indices[i+2]].z);


        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        var a = vertices[indices[i+1]].sub(vertices[indices[i]]);
        var b = vertices[indices[i+2]].sub(vertices[indices[i]]);

        b.scaleToUnit();
        a.scaleToUnit();
        
        var nx = a.y*b.z - a.z*b.y;
        var ny = a.z*b.x - a.x*b.z;
        var nz = a.x*b.y - a.y*b.x;

        let newN = new vec4(nx,ny,nz).scaleToUnit();

        n.push( newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, );
        //n.push( nx,ny,nz, nx,ny,nz, nx,ny,nz);

        c.push( colors[indices[i]].x, colors[indices[i]].y, colors[indices[i]].z, colors[indices[i]].a );
        c.push( colors[indices[i+1]].x, colors[indices[i+1]].y, colors[indices[i+1]].z, colors[indices[i+1]].a );
        c.push( colors[indices[i+2]].x, colors[indices[i+2]].y, colors[indices[i+2]].z, colors[indices[i+2]].a );
    }

    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
}

function generateSpaceStation(size=1, color=new vec4(0.5,.5,.5,1))
{
    var vertices = [];
    var indices = [];
    var colors = [];


    var ret = generateClosedCylinder(2,0.1,7,color);
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(), new vec4(), new vec4(1,1,1));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(.75,1,0), new vec4(3.14/2), new vec4(0.75,1,1));
    ret = generateClosedCylinder(0.5,0.2,10,color);
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,0.75,0), new vec4());
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(-.5,1,0), new vec4(3.14/2), new vec4(0.75,.75,.75));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(1,1,0), new vec4(3.14/2), new vec4(0.75,.75,.75));
    ret = generateRect(0.2,1,new vec4(0.2,0.2,0.9,1));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,.2,0), new vec4(3.14/2,0));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,.2,0), new vec4(-3.14/2,0));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,2-.2,0), new vec4(3.14/2,0));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,2-.2,0), new vec4(-3.14/2,0));

    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,.5,0), new vec4(3.14/2,0));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,.5,0), new vec4(-3.14/2,0));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,2-.5,0), new vec4(3.14/2,0));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,2-.5,0), new vec4(-3.14/2,0));

    var v = [];
    var ind = [];
    var n = [];
    var c = [];

    var indOn = 0;
    for(var i=0; i<indices.length; i+=3)
    {
        v.push( vertices[indices[i]].x * size, vertices[indices[i]].y * size, vertices[indices[i]].z * size);
        v.push( vertices[indices[i+1]].x * size, vertices[indices[i+1]].y * size, vertices[indices[i+1]].z * size);
        v.push( vertices[indices[i+2]].x * size, vertices[indices[i+2]].y * size, vertices[indices[i+2]].z * size);


        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        var a = vertices[indices[i+1]].sub(vertices[indices[i]]);
        var b = vertices[indices[i+2]].sub(vertices[indices[i]]);

        b.scaleToUnit();
        a.scaleToUnit();
        
        var nx = a.y*b.z - a.z*b.y;
        var ny = a.z*b.x - a.x*b.z;
        var nz = a.x*b.y - a.y*b.x;

        let newN = new vec4(nx,ny,nz).scaleToUnit();

        n.push( newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, );
        //n.push( nx,ny,nz, nx,ny,nz, nx,ny,nz);

        c.push( colors[indices[i]].x, colors[indices[i]].y, colors[indices[i]].z, colors[indices[i]].a );
        c.push( colors[indices[i+1]].x, colors[indices[i+1]].y, colors[indices[i+1]].z, colors[indices[i+1]].a );
        c.push( colors[indices[i+2]].x, colors[indices[i+2]].y, colors[indices[i+2]].z, colors[indices[i+2]].a );
    }

    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
}

function generateAirplane(size = 1){
    var vertices = [];
    var indices = [];
    var colors = [];

    let ret = generateClosedCylinder(5, .4, 9, new vec4(1,0,0,1));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4());

    ret = generateBox(1,2,.1);
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,0,-0.5), new vec4(3.14/2));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,0,0), new vec4(3.14/2, 0,3.14/2), new vec4(0.5,0.5,1));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,3,-1.5), new vec4(3.14/2), new vec4(2,1,3));
    ret = generateClosedCylinder(0.1,0.6,9,new vec4(1,0,0,0.5));
    addComponents(vertices, indices, colors, ret.vertices, ret.indices, ret.colors, new vec4(0,5));
    //addComponents(vertices, indices, colors, ret.vertices, 

    var v = [];
    var ind = [];
    var n = [];
    var c = [];

    var indOn = 0;
    for(var i=0; i<indices.length; i+=3)
    {
        v.push( vertices[indices[i]].x * size, vertices[indices[i]].y * size, vertices[indices[i]].z * size);
        v.push( vertices[indices[i+1]].x * size, vertices[indices[i+1]].y * size, vertices[indices[i+1]].z * size);
        v.push( vertices[indices[i+2]].x * size, vertices[indices[i+2]].y * size, vertices[indices[i+2]].z * size);


        ind.push(indOn, indOn+1, indOn+2);
        indOn += 3;

        var a = vertices[indices[i+1]].sub(vertices[indices[i]]);
        var b = vertices[indices[i+2]].sub(vertices[indices[i]]);

        b.scaleToUnit();
        a.scaleToUnit();
        
        var nx = a.y*b.z - a.z*b.y;
        var ny = a.z*b.x - a.x*b.z;
        var nz = a.x*b.y - a.y*b.x;

        let newN = new vec4(nx,ny,nz).scaleToUnit();

        n.push( newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, newN.x, newN.y, newN.z, );

        c.push( colors[indices[i]].x, colors[indices[i]].y, colors[indices[i]].z, colors[indices[i]].a );
        c.push( colors[indices[i+1]].x, colors[indices[i+1]].y, colors[indices[i+1]].z, colors[indices[i+1]].a );
        c.push( colors[indices[i+2]].x, colors[indices[i+2]].y, colors[indices[i+2]].z, colors[indices[i+2]].a );
    }

    return {
        vertices: v,
        indices: ind,
        normals: n,
        colors: c,
    }
}




/* Requires:
 *      vertices:list of vec4 vertices
 *      colors: list of vec4 colors
 *      indices: list of Numbers (corrosponding to vertices)
 *      newVertices, newIndices,andNewColors must all be the same
 */
function addComponents(vertices, indices, colors, newVertices = [], newIndices=[], newColors=[], posOffset = new vec4(), rotation = new vec4(), scale = new vec4(1,1,1,1))
{
   // console.log(newVertices, newIndices, newColors);
    
    var indicesOffset = vertices.length;
    var rotMat = new mat4().makeRotation(rotation.x,rotation.y, rotation.z);
    for (var i=0; i<newVertices.length; i++)
    {
        //console.log(newVertices[i]);
        vertices.push(  ( rotMat.mul(newVertices[i]) ).mul(scale).addi(posOffset));
        colors.push( newColors[i] );
    }
    for (var i=0; i<newIndices.length; i++)
    {
        indices.push(newIndices[i] + indicesOffset);
    }
}

//Returns cylinder of height with numSides & color
function generateCylinder(height=6,radius=1, numSides=6, color = new vec4(1,0,0,1))
{
    var v = [];
    var c = [];
    var i = [];
    var myheight = 2;
    for(var h=0; h<myheight; h++) {
        for (var d=0; d<numSides; d++)
        {
            v.push ( new vec4(radius*Math.sin(d*6.28/numSides), h*height, radius*Math.cos(d*6.28/numSides)));
            c.push(  color );
            if (h<myheight-1 && d<numSides-1) {
                i.push( h*numSides + d, (h+1)*numSides+d+1, (h+1)*numSides+d,   h*numSides + d, h*numSides+d+1,(h+1)*numSides+d+1);
            } else if (h<myheight-1 && d==numSides-1)
            {
                i.push( h*numSides + d, (h+1)*numSides+0,(h+1)*numSides+d,      h*numSides + d, h*numSides,(h+1)*numSides );
            }
        }
    }
    return {
        vertices:v,
        indices:i,
        colors:c,
    }
}

//Returns cylinder of height with numSides & color with end caps
function generateClosedCylinder(height=6,radius=1, numSides=6, color = new vec4(1,0,0,1))
{
    let v = [];
    let c = [];
    let i = [];
    let n = [];
    let myheight = 2;
    for(let h=0; h<myheight; h++) {
        for (let d=0; d<numSides; d++)
        {
            v.push ( new vec4(radius*Math.sin(d*6.28/numSides), h*height, radius*Math.cos(d*6.28/numSides)));
            n.push( new vec4(radius*Math.sin(d*6.28/numSides), 0, radius*Math.cos(d*6.28/numSides)).scaleToUnit() );
            c.push(  color );
            if (h<myheight-1 && d<numSides-1) {
                i.push( (h+1)*numSides+d+1, (h+1)*numSides+d, h*numSides + d,  h*numSides+d+1,(h+1)*numSides+d+1, h*numSides + d);
                //i.push( h*numSides + d, (h+1)*numSides+d+1, (h+1)*numSides+d,  (h+1)*numSides+d+1, h*numSides + d,h*numSides+d+1);
            } else if (h<myheight-1 && d==numSides-1)
            {
                //i.push( h*numSides + d, (h+1)*numSides+d+1, (h+1)*numSides+d,  h*numSides+d+1,(h+1)*numSides+d+1, h*numSides + d);
                i.push( h*numSides + d, (h+1)*numSides+0,(h+1)*numSides+d,    (h+1)*numSides,h*numSides + d,h*numSides );
            }
        }
    }
    let ind = v.length;
    v.push(new vec4(0,0,0));
    v.push(new vec4(0,height,0));
    n.push(new vec4(0,-1,0));
    n.push(new vec4(0,1,0));
    c.push(color);
    c.push(color);

    for(let d=0; d<numSides; d++)
    {
        i.push(d, ind, (d+1)%numSides);
        i.push(numSides+d, (d+1)%numSides + numSides, ind+1);
    }

    return {
        vertices:v,
        normals:n,
        indices:i,
        colors:c,
    }
}

function generateRect(width=1,height=1, color=new vec4(1,0,0,1))
{
    var v = [
        new vec4(-width/2,0,0), new vec4(-width/2,height,0), new vec4(width/2,height,0), new vec4(width/2,0,0)
    ];
    var i= [
        0,1,2, 2,3,0, 0,2,1, 2,0,3
    ];
    var c= [
        color, color, color, color
    ];
    return {
        vertices: v,
        indices: i,
        colors:c
    }
}

function generateBox(w=1, h=1, d = 1, color = new vec4(1,0,0,1))
{
    /*
    return {
        //vertices: [0,0,0, 0,0,height, width,0,height, width,0,0,  0,thickness,0, 0,thickness,height, width,thickness,height, width,thickness,0 ], 
        
        vertices: [0,0,h, w,0,h, w,0,0, 0,0,0,  //front
            0,0,h, 0,d,h, w,d,h, w,0,h, //top
            0,0,0, w,0,0, w,d,0, 0,d,0, //bottom
            0,d,h, 0,d,0, w,d,0, w,d,h, //back
            0,d,h, 0,0,h, 0,0,0, 0,d,0, //left
            w,0,h, w,d,h, w,d,0, w,0,0, //right
        ],

        indices: [0,1,2, 0,2,3,
            4,5,6, 4,6,7,
            8,9,10, 8,10,11,
            12,13,14, 12,14,15,
            16,17,18, 16,18,19,
            20,21,22, 20,22,23
        ],
        normals: [
            0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
            0,1,0, 0,1,0, 0,1,0, 0,1,0,
            0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0, 
            0,0,1, 0,0,1, 0,0,1, 0,0,1, 
            1,0,0, 1,0,0, 1,0,0, 1,0,0,
            -1,0,0, -1,0,0, -1,0,0, -1,0,0
        ],
        colors: [
            color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a,
            color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a,
            color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a,
            color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a,
            color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a,
            color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a, color.x,color.y,color.z,color.a,
        ]
    }*/
    let v0 = new vec4(0,0,h);
    let v1 = new vec4(w,0,h);
    let v2 = new vec4(w,0,0);
    let v3 = new vec4(0,0,0);
    let v4 = new vec4(0,d,h);
    let v5 = new vec4(w,d,h);
    let v6 = new vec4(w,d,0);
    let v7 = new vec4(0,d,0);
    return {
        vertices: [
            v0,v1,v2,v3, //front
            v0,v4,v5,v1, //top
            v3,v2,v6,v7, //bottom
            v4,v7,v6,v5, //back
            v0,v3,v7,v4, //left
            v1,v5,v6,v2, //right
        ],
        indices: [0,2,1, 0,3,2,
            4,6,5, 4,7,6,
            8,10,9, 8,11,10,
            12,14,13, 12,15,14,
            16,18,17, 16,19,18,
            20,22,21, 20,23,22
        ],

        colors: [
            color, color, color, color,
            color, color, color, color,
            color, color, color, color,
            color, color, color, color,
            color, color, color, color,
            color, color, color, color,
        ]
    }

}

























