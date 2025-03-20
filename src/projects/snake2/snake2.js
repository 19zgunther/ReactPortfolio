import { useState, useEffect, useRef } from 'react';
import { Painter, rgbToHex } from '../../painter';

function maxInList(list)
{
    let maxi = -100000000;
    let maxIndex = -1;
    for (let i=0; i<list.length; i++)
    {
        if (list[i] > maxi)
        {
            maxi = list[i];
            maxIndex = i;
        }
    }
    return {
        index: maxIndex,
        value: maxi
    };
}
function getGridValue(grid, gridWidth, x, y, outOfBoundsValue = -1)
{
    if (x < 0 || y < 0 || x >= gridWidth || y >= gridWidth)
    {
        return outOfBoundsValue;
    }
    return grid[x*gridWidth+y];
}
function copyList(L)
{
    let temp = [];
    for (let i in L)
    {
        temp.push(L[i]);
    }
    return temp;
}
function distBetweenPoints(p1=[0,0],p2=[1,1])
{
    return Math.sqrt(  Math.pow(p1[0]-p2[0],2) + Math.pow(p1[1]-p2[1], 2) );
}

class ML
{
    constructor(columnInfo = [2,3,2]){
        this.columnInfo = columnInfo;

        this.avgWeight = 0.5;
        this.avgWeights = [];//[0]*this.columnInfo.length;

        this.layers = []; //in form this.columns[layer][node][weight]   or this.columns[layer][column][row]

        this.numWeightsInEachLayer = [];

        for (let i=1; i<columnInfo.length; i++)
        {
            let numNodes = this.columnInfo[i];
            let numWeights = this.columnInfo[i-1];
            let layer = [];
            let totalNumWeights = 0;
            for (let n=0; n<numNodes; n++)
            {
                let nodeWeights = [];
                for (let w=0; w<numWeights; w++)
                {
                    nodeWeights.push( 0.5 - Math.random() );
                    totalNumWeights++;
                }
                layer.push(nodeWeights);
            }
            this.layers.push(layer);
            this.avgWeights.push(0);
            this.numWeightsInEachLayer.push(totalNumWeights);
        }
    }
    load(text = '')
    {
        try {
            let arr = text.split('\n');
            let layerArr = arr[0].split(',');

            //set columnInfo
            this.columnInfo = []; //in form this.columns[layer][node][weight]   or this.columns[layer][column][row]
            for (let i=0; i<layerArr.length; i++)
            {
                this.columnInfo.push( Number(layerArr[i]) );
            }

            //load all weights into wArr
            let wArr = [];
            for (let i=1; i<arr.length; i++)
            {
                wArr = wArr.concat(arr[i].split(','));
            }

            //load all weights from wArr into the this.layers[]
            this.layers = [];
            let count = 0;
            for (let i=1; i<this.columnInfo.length; i++)
            {
                let numNodes = this.columnInfo[i];
                let numWeights = this.columnInfo[i-1];
                let layer = [];
                for (let n=0; n<numNodes; n++)
                {
                    let nodeWeights = [];
                    for (let w=0; w<numWeights; w++)
                    {
                        nodeWeights.push( wArr[count] );
                        if (wArr[count] == undefined)
                        {
                            throw "Ml.load(): not enough weights for given columnInfo.";
                        }
                        count += 1;
                    }
                    layer.push(nodeWeights);
                }
                this.layers.push(layer);
            }
        } catch (ex){
            console.error("Ml.load(): Failed to load() weights. Error: " + ex);
        }
    }
    toString()
    {
        //Print model to console
        let output = String(this.columnInfo) + "\n";
        for (let L=0; L<this.layers.length; L++)
        {
            for (let n=0; n<this.layers[L].length; n++)
            {
                output += String(this.layers[L][n]) + "\n";
            }
        }
        return output;
    }
    saveToFile(filename='myNNSave.txt')
    {
        // Create element with <a> tag
        const link = document.createElement("a");

        // Create a blog object with the file content which you want to add to the file
        const file = new Blob([this.toString()], { type: 'text/plain' });

        // Add file content in the object URL
        link.href = URL.createObjectURL(file);

        // Add file name
        link.download = filename;

        // Add click event to <a> tag to save file.
        link.click();
        URL.revokeObjectURL(link.href);
    }
    getChild(randomModifier = 0.01)
    {
        const ml = new ML(this.columnInfo);
        for (let L=0; L<this.layers.length; L++)
        {
            for (let n=0; n<this.layers[L].length; n++)
            {
                for (let w=0; w<this.layers[L][n].length; w++)
                {
                   // ml.layers[L][n][w] = this.layers[L][n][w];
                   ml.layers[L][n][w] = Math.random()*randomModifier + this.layers[L][n][w] -randomModifier/2;
                }
            }
        }

        //let L = Math.floor(ml.layers.length * Math.random());
        //let n = Math.floor(ml.layers[L].length * Math.random());
        //let w = Math.floor(ml.layers[L][n].length * Math.random());
        //ml.layers[L][n][w] = Math.random()*randomModifier + this.layers[L][n][w] -randomModifier/2;
        return ml;
    }
    _multiplyLayers(input, layer)
    {
        //takes in matrices in form: mat[node][weight]
        let output = [];
        for (let i=0; i<layer.length; i++)
        {
            let sum = 0;
            for (let j=0; j<layer[i].length; j++)
            {
                sum += input[j]*layer[i][j];
            }
            output.push(sum);
        }
        return output;
    }
    compute(input)
    {
        let temp = input;
        for(let i=0; i<this.layers.length; i++)
        {
            temp = this._multiplyLayers(temp, this.layers[i]);
            temp = this.activationFunction(temp);
        }
        return temp;
    }
    activationFunction(vals = [])
    {
        for (let i=0; i<vals.length; i++)
        {
            vals[i] = this._fx(vals[i]);
        }
        return vals;
    }
    _fx(x)
    {
        return Math.tanh(x);

        if (x>1) { return 0.9 + x/10; }
        if (x>-1) { return x; }
        return -0.9+x/10;
        // if (x>0) { return 1 + x/10}
        // if (x>-1) { return x;}
        // return -1+x/10;
    }
    _fxPrime(x)
    {
        return 1 - Math.pow(Math.tanh(x), 2);
        if (x>1 || x < -1) { return 0.1; }
        return 1;
        // if (x>1 || x<-1) {return 0.1;}
        // return 1;
    }
    getModelNodeValues(input)
    {
        let nodes = [];
        let temp = input;
        for(let i=0; i<this.layers.length; i++)
        {
            nodes.push(temp);
            temp = this._multiplyLayers(temp, this.layers[i]);
            temp = this.activationFunction(temp);
        }
        nodes.push(temp);
        return nodes;
    }
    punishResponsibleNeurons(input = [], outputNeuronIndex = 0, punishMultiplier = 0.9)
    {
        return;
        const nodeValues = this.getModelNodeValues(input);

        //Node value is in form: neuron values in columns, 2d array

        let responsibleNeuron = outputNeuronIndex;
        let weightColumnOn = this.layers.length-1;
        for (let i=nodeValues.length-1; i>=1; i--)
        {
            const prevLayerNodes = nodeValues[i-1];
            let weights = this.layers[weightColumnOn];
            const numWeightsInLayer = this.numWeightsInEachLayer[weightColumnOn];
            weightColumnOn -= 1;

            weights = weights[responsibleNeuron]; // we only want the weights leading to the respondible neuron
            
            let largestVal = -100000000;
            let largestValIndex = -1;
            for (let j=0; j<weights.length; j++)
            {
                let curVal = weights[j] * prevLayerNodes[j];
                if (curVal > largestVal)
                {
                    largestVal = curVal;
                    largestValIndex = j;
                }
            }
            //now, we have the weight index. Let's modify it.
            
            //const m = 1 - (1 - punishMultiplier) * numWeightsInLayer;
            weights[largestValIndex] *= punishMultiplier;
            responsibleNeuron = largestValIndex;
        }
        this.randomlyModifyWeights();
    }
    randomlyModifyWeights(randomMultiplier = 0.0001)
    {
        return;
        let avgWeight = 0;
        let numWeights = 0;
        let add = 1;

        for (let i=0; i<this.layers.length; i++)
        {
            add = 1;
            if (this.avgWeights[i] < 0.1)
            {
                add = 1.01;
            } else {
                add = 0.999;
            }
            this.avgWeights[i] = 0;
            numWeights = 0;
            for (let j=0; j<this.layers[i].length; j++)
            {
                for (let k=0; k<this.layers[i][j].length; k++)
                {
                    this.layers[i][j][k] = Math.min(2, Math.max(0, this.layers[i][j][k] + (0.5 - Math.random()) * randomMultiplier));
                    //avgWeight += this.layers[i][j][k];
                    this.layers[i][j][k] *= add;
                    this.avgWeights[i] += this.layers[i][j][k];
                    numWeights++;
                }
            }
            this.avgWeights[i] /= numWeights;
        }
        //this.avgWeight = avgWeight/numWeights;
        //console.log("Avg weight: " + this.avgWeight);
    }
    learnBatch(inputs, outputs, learningConstant = 0.0001, iterations = 10, batchSize = 100, printDebug = false, printCost = false)
    {
        let adjustedLearningConstant = learningConstant/batchSize
        //Create gradients array
        let gradients = []
        for (let l in this.layers)
        {
            let layer = [];
            for(let n in this.layers[l])
            {
                let temp = [];
                for (let w in this.layers[l][n])
                {
                    temp.push(0);
                }
                layer.push(temp);
            }
            gradients.push(layer)
        }
        
        for (let itr=0; itr<iterations;itr++)
        {
            //Find gradient descent
            for (let i_=0; i_<batchSize; i_++)
            {
                const i = Math.floor(Math.random()*inputs.length);  //Generate index
                const X = inputs[i];
                const Y = outputs[i];

                let nodeValues = this.getModelNodeValues(X);
                let xys = [];
                for (let n in nodeValues)
                {
                    let temp = [];
                    for (let n2 in nodeValues[n])
                    {
                        temp.push(0);
                    }
                    xys.push(temp);
                }
                
                //For output layer...
                let lastLayer = nodeValues.length - 1;
                for (let n=0; n<nodeValues[lastLayer].length; n++)
                {
                    const x = nodeValues[lastLayer][n] - Y[n];
                    const y = this._fxPrime(nodeValues[lastLayer][n]);
                    const xy = x*y;
                    for(let n2=0; n2<nodeValues[lastLayer-1].length; n2++)
                    {
                        const z = nodeValues[lastLayer-1][n2]
                        const grad = xy*z
                        gradients[lastLayer-1][n][n2] += grad
                        xys[lastLayer-1][n2] += this.layers[lastLayer-1][n][n2] * xy
                    }
                }
                for (let l = nodeValues.length-2; l > 0; l-=1)
                {
                    for (let n=0; n<nodeValues[l].length; n++)
                    {
                        const x = xys[l][n];
                        const y = this._fxPrime(nodeValues[l][n]);
                        const xy = x*y
                        //console.log(x,y,xy);
                        for (let n2 in nodeValues[l-1])
                        {
                            const z = nodeValues[l-1][n2]
                            const grad = xy*z
                            gradients[l-1][n][n2] += grad
                            xys[l-1][n2] += this.layers[l-1][n][n2] * xy
                        }
                    }
                }

            
            }
            //Apply gradients array
            let num0 = 0;
            let num = 0;
            let gradientWasNaN = false;
            let weightWasNaN = false;
            for (let l in this.layers)
            {
                for (let n in this.layers[l])
                {
                    for (let w in this.layers[l][n])
                    {
                        const v = adjustedLearningConstant * gradients[l][n][w];
                        num++;
                        if (v == 0) { num0 ++;}
                        if (!isNaN(v)) 
                        {
                            this.layers[l][n][w] -= v;
                            gradients[l][n][w] = 0;
                        } else {
                            gradientWasNaN = true;
                        }
                        if (isNaN(this.layers[l][n][w]))
                        {
                            this.layers[l][n][w] = Math.random();
                            weightWasNaN = true;
                        }
                    }
                }
            }
            if (gradientWasNaN)
            {
                console.log("Gradient was NaN");
            }
            if (weightWasNaN)
            {
                console.log("weight was NaN");
            }
        }
    }
}

class Snake
{
    constructor(startPos = [0,0], ml = null)
    {
        this.positions= [startPos];
        this.pDirection = [0,0];
        let val = Math.random();
        if (val > 0.75)
        {
            this.positions.push( [startPos[0]+1, startPos[1]]);
        } else if (val > 0.5)
        {
            this.positions.push( [startPos[0], startPos[1]+1]);
        }  else if (val > 0.25)
        {
            this.positions.push( [startPos[0], startPos[1]-1]);
        }  else
        {
            this.positions.push( [startPos[0]-1, startPos[1]]);
        }
        
        this.inputs = [];
        this.isDead = false;
        //this.score = 0;
        this.age = 0;
        this.numApplesConsumed = 0;

        this.prevDirX = 0;
        this.prevDirY = 0;
        this.numTurns = 0;

        for (let i=0; i<49; i++)
        {
            this.inputs.push(0);
        }
    }
    update(grid = [], gridWidth = 10)
    {
        this.age += 1;
        //this.score += UPDATE_REWARD;
        let headX = this.positions[0][0];
        let headY = this.positions[0][1];
        let itr = 0;
        let nearestApple = null;
        let nearestAppleDist = 1000000;
        let nearestAppleDir = null;


        //Compute the inputs - find head offsets, and optimal grid around snake head
        let multiplier = 2;
        while (multiplier*multiplier < SNAKE_ML.columnInfo[0])
        {
            multiplier+=1;
        }

        let headOffsetLow = Math.floor(multiplier/2);
        let headOffsetHigh = Math.ceil(multiplier/2);

        for (let i=headX-headOffsetLow; i<headX+headOffsetHigh; i++)
        {
            for (let j=headY-headOffsetLow; j<headY+headOffsetHigh; j++)
            {
                this.inputs[itr] = getGridValue(grid, GRID_WIDTH, i,j, WALL_VALUE);
                if (this.inputs[itr] == APPLE_VALUE)
                {
                    const d = distBetweenPoints([headX, headY], [i,j]);
                    if (d < nearestAppleDist)
                    {
                        nearestAppleDist = d;
                        nearestApple = [i,j];
                        nearestAppleDir = [ (i-headX)/d, (j-headY)/d ];
                    }
                }
                itr+=1;
            }
        }

        //console.log("apple dist: ", nearestAppleDist);
        //console.log("   dir:", nearestAppleDir);

        const up = getGridValue(grid, GRID_WIDTH, headX, headY+1, WALL_VALUE);
        const down = getGridValue(grid, GRID_WIDTH, headX, headY-1, WALL_VALUE);
        const left = getGridValue(grid, GRID_WIDTH, headX-1, headY, WALL_VALUE);
        const right = getGridValue(grid, GRID_WIDTH, headX+1, headY, WALL_VALUE);
        const appleIsNearby = up == APPLE_VALUE || down == APPLE_VALUE || left == APPLE_VALUE || right == APPLE_VALUE;
        
        this.inputs[0] = this.pDirection[0];
        this.inputs[1] = this.pDirection[1];

        const output = SNAKE_ML.compute(this.inputs);
        let ret = maxInList(output);
        if (ret.index == 0)
        {
            //up
            headY += 1;
            this.pDirection = [0,1];
        } else if (ret.index == 1)
        {
            //down
            headY -= 1;
            this.pDirection = [0,-1];
        } else if (ret.index == 2)
        {
            //left
            headX -= 1;
            this.pDirection = [-1,0];
        } else
        {
            //right
            headX += 1;
            this.pDirection = [1,0];
        }
        

        const NNL = -1
        const NNH = 1;


        if (LEARNING_DATA_INPUTS.length > 1000000)
        {
            console.log("culling learning data");
            LEARNING_DATA_INPUTS = [];
            LEARNING_DATA_OUTPUTS = [];
        }

        if (nearestApple != null)
        {
            let temp = [NNL,NNL,NNL,NNL];
            let val = NNH;//SNAKE_ML.columnInfo[0] / Math.max(nearestAppleDist,1);
            if (nearestAppleDir[0] >= 0)
            {
                if (nearestAppleDir[1] >= 0)
                {
                    //up or right
                    if (up != WALL_VALUE) { temp[0] = val; }
                    if (right != WALL_VALUE) { temp[3] = val; }
                } else {
                    //down or right
                    if (down != WALL_VALUE) { temp[1] = val; }
                    if (right != WALL_VALUE) { temp[3] = val; }
                }
            } else {
                if (nearestAppleDir[1] >= 0)
                {
                    //up or left
                    if (up != WALL_VALUE) { temp[0] = val; }
                    if (left != WALL_VALUE) { temp[2] = val; }
                } else {
                    //down or left
                    if (down != WALL_VALUE) { temp[1] = val; }
                    if (left != WALL_VALUE) { temp[2] = val; }
                }
            }
            LEARNING_DATA_INPUTS.push( copyList(this.inputs) );
            LEARNING_DATA_OUTPUTS.push( temp );
        }

        const headGridVal = getGridValue(grid, GRID_WIDTH, headX, headY, WALL_VALUE);

        if (up != WALL_VALUE || down != WALL_VALUE || left != WALL_VALUE || right != WALL_VALUE)
        {
            SNAKE_ML.randomlyModifyWeights(0.001);
            let temp = [NNL,NNL,NNL,NNL];
            if (up    != WALL_VALUE) { temp[0]=NNH;}
            if (down  != WALL_VALUE) { temp[1]=NNH;}
            if (left  != WALL_VALUE) { temp[2]=NNH;}
            if (right != WALL_VALUE) { temp[3]=NNH;}
            LEARNING_DATA_INPUTS.push( copyList(this.inputs) );
            LEARNING_DATA_OUTPUTS.push( temp );
        }
        if (headGridVal == WALL_VALUE)
        {
            //Hit a wall. Punish.
            this.isDead = true;
            // if (up != WALL_VALUE || down != WALL_VALUE || left != WALL_VALUE || right != WALL_VALUE)
            // {
            //     SNAKE_ML.randomlyModifyWeights(0.001);
            //     let temp = [0,0,0,0];
            //     if (up    != WALL_VALUE) { temp[0]=10;}
            //     if (down  != WALL_VALUE) { temp[1]=10;}
            //     if (left  != WALL_VALUE) { temp[2]=10;}
            //     if (right != WALL_VALUE) { temp[3]=10;}
            //     LEARNING_DATA_INPUTS.push( copyList(this.inputs) );
            //     LEARNING_DATA_OUTPUTS.push( temp );
            // }
            return;
        }

        //now, update tail
        this.positions.unshift([headX,headY]);
        if (headGridVal == APPLE_VALUE)
        {
            this.numApplesConsumed++;
        } else if (this.positions.length > 2){
            let p = this.positions.pop();
            //grid[p[0]*GRID_WIDTH+p[1]] = 0;
        }
        grid[headX*GRID_WIDTH+headY] = WALL_VALUE;
    }
}

// let bb = canvasElement.getBoundingClientRect();
// canvasElement.width = Math.round(bb.width);
// canvasElement.height = Math.round(bb.height);

var neuralNetworkCanvas = null;// document.getElementById("neuralNetworkCanvas");
// bb = neuralNetworkCanvas.getBoundingClientRect();
// neuralNetworkCanvas.width = Math.round(bb.width);
// neuralNetworkCanvas.height = Math.round(bb.height);
var nnColorMultiplier = 60;

var WEIGHT_MODIFIER = 0.001;
var GRAD_DESCENT_ITERS_PER_UPDATE = 2;
var RANDOM_PRUNE_PERCENTAGE = 0.1;

var snake2data = {
    updateOn: 0,
    renderOn: 0,
    renderDelayMs: 0,
    previousRenderTime: Date.now(),
    avgNumApplesConsumed: 0,
    cellWidthPx: 0,
}

var UPDATE_INTERVAL; //set in setup()

var WALL_VALUE = -1;
var APPLE_VALUE = 1;
var NUM_APPLES = 30;
var NUM_SNAKES = 20;
var GRID_WIDTH = 32;

var SNAKE_ML = new ML([81,42,8,4]);

var AVERAGE_AGE = 0;
var AVERAGE_APPLES_CONSUMED = 0;

var LEARNING_DATA_INPUTS = [];
var LEARNING_DATA_OUTPUTS = [];


let apples = []; //initialized in setup()
let snakes = [];

//Snake Game//////////////////////////////
function Snake2() {

    const canvasRef = useRef(null);
    const neuralNetworkCanvasRef = useRef(null);
    const [iterator, setIterator] = useState(0);
    
    function setup()
    {
        const canvasElement = canvasRef.current;
        if (canvasElement == null) {return;}
        let bb = canvasElement.getBoundingClientRect();
        canvasElement.width = Math.round(bb.width);
        canvasElement.height = Math.round(bb.height);

        neuralNetworkCanvas = neuralNetworkCanvasRef.current;
        if (neuralNetworkCanvas == null) {return;}
        bb = neuralNetworkCanvas.getBoundingClientRect();
        neuralNetworkCanvas.width = Math.round(bb.width);
        neuralNetworkCanvas.height = Math.round(bb.height);
    

        //create all of the snakes
        snakes = [];
        apples = [];
        for (let i=0; i<NUM_SNAKES; i++)
        {
            let x = Math.round(Math.random() * GRID_WIDTH);
            let y = Math.round(Math.random() * GRID_WIDTH);
            snakes.push( new Snake( [x,y]) )
        }

        //Create all of the apples
        for (let i=0; i<NUM_APPLES; i++)
        {
            let x = 1 + Math.round(Math.random() * (GRID_WIDTH-2));
            let y = 1 + Math.round(Math.random() * (GRID_WIDTH-2));
            apples.push([x,y]);
        }
        clearInterval(UPDATE_INTERVAL)

        if (canvasElement != null)
        {
            snake2data.cellWidthPx = canvasElement.width / GRID_WIDTH;
        }
    }

    simulationSpeedSliderUpdate();

    function simulationSpeedSliderUpdate()
    {
        const canvasElement = canvasRef.current;
        if (canvasElement == null) {return;}

        const el_names = ["speedSlider", "weightSlider", "gradDescentIterSlider", "randomPruneSlider", "gridWidthSlider", "numSnakesSlider", "numApplesSlider", "gridWidthSliderText"];
        for (let i=0; i<el_names.length; i++)
        {
            if (document.getElementById(el_names[i]) == null) {
                console.log("Element not found: ", el_names[i]);
                return;
            }
        }

        const speedSlider = document.getElementById("speedSlider");
        const speedSliderText = document.getElementById("speedSliderText");
        const weightSlider = document.getElementById("weightSlider");
        const weightSliderText = document.getElementById("weightSliderText");
        const gradDescentIterSlider = document.getElementById("gradDescentIterSlider");
        const gradDescentIterSliderText = document.getElementById("gradDescentIterSliderText");
        const randomPruneSlider = document.getElementById("randomPruneSlider");
        const randomPruneSliderText = document.getElementById("randomPruneSliderText");
        const gridWidthSlider = document.getElementById("gridWidthSlider");
        const gridWidthSliderText = document.getElementById("gridWidthSliderText");
        const numSnakesSlider = document.getElementById("numSnakesSlider");
        const numSnakesSliderText = document.getElementById("numSnakesSliderText");
        const numApplesSlider = document.getElementById("numApplesSlider");
        const numApplesSliderText = document.getElementById("numApplesSliderText");

        let val = 1000-speedSlider.value*10;
        speedSliderText.innerText = val.toPrecision(4) + "ms";

        //Weight Modifier
        WEIGHT_MODIFIER = weightSlider.value / 1000;
        weightSliderText.innerText = WEIGHT_MODIFIER.toPrecision(5);
        
        //Grad Desc Itrs
        GRAD_DESCENT_ITERS_PER_UPDATE = gradDescentIterSlider.value;
        gradDescentIterSliderText.innerText = Math.round(GRAD_DESCENT_ITERS_PER_UPDATE);

        //Random Prune Percentage
        RANDOM_PRUNE_PERCENTAGE = randomPruneSlider.value / 100;
        randomPruneSliderText.innerText = RANDOM_PRUNE_PERCENTAGE.toPrecision(3);
        
        //Num Snakes
        val = Math.max(1,numSnakesSlider.value);
        numSnakesSliderText.innerText = val.toPrecision(3);
        while (val < snakes.length)
        {
            snakes.pop();
        }
        while (val > snakes.length)
        {
            let x = Math.round(Math.random() * GRID_WIDTH);
            let y = Math.round(Math.random() * GRID_WIDTH);
            snakes.push( new Snake( [x,y]) );
        }

        //Num Apples
        val = Math.max(1,numApplesSlider.value);
        numApplesSliderText.innerText = val.toPrecision(3);
        while (val < apples.length)
        {
            apples.pop();
        }
        while (val > apples.length)
        {
            let x = 1+Math.round(Math.random() * (GRID_WIDTH-2));
            let y = 1+Math.round(Math.random() * (GRID_WIDTH-2));
            apples.push( [x,y] );
        }
        

        GRID_WIDTH = Math.max(8,gridWidthSlider.value);
        gridWidthSliderText.innerText = GRID_WIDTH.toPrecision(3);
        snake2data.cellWidthPx = canvasElement.width / GRID_WIDTH;
        for (let i in apples)
        {
            if (apples[i][0] >= GRID_WIDTH || apples[i][0] >= GRID_WIDTH)
            {
                apples[i][0] = 1 + Math.round( Math.random() * (GRID_WIDTH-2));
                apples[i][1] = 1 + Math.round( Math.random() * (GRID_WIDTH-2));
            }
        }
    
    }
    function randomlyPruneWeights()
    {
        for (let l in SNAKE_ML.layers)
        {
            for (let n in SNAKE_ML.layers[l])
            {
                for (let w in SNAKE_ML.layers[l][n])
                {
                    if (Math.random() < RANDOM_PRUNE_PERCENTAGE)
                    {
                        SNAKE_ML.layers[l][n][w] = 0;
                    }
                }
            }
        }
        
    }
    function resetTrainingData()
    {
        LEARNING_DATA_INPUTS = [];
        LEARNING_DATA_OUTPUTS = [];
    }
    function saveNNWeights()
    {
        SNAKE_ML.saveToFile();
    }
    function loadNNWeights()
    {
        const el =  document.getElementById('fileInput');
        el.addEventListener('click', (event)=>{
            var fr=new FileReader();
            fr.onload=function(){
                console.log(fr.result);
                SNAKE_ML.load(fr.result);
            }
            fr.readAsText(el.files[0]);
        });
        el.click();
    }
    function renderSnakeGame()
    {
        const canvasElement = canvasRef.current;
        const bb = canvasElement.getBoundingClientRect();
        canvasElement.width = Math.round(bb.width);
        canvasElement.height = Math.round(bb.height);
        if (canvasElement == null) {setup(); return;}
        const p = new Painter(canvasElement);
        p.ClearTransparent();

        //Draw grid
        for (let i=0; i<GRID_WIDTH*snake2data.cellWidthPx*1.2; i+=snake2data.cellWidthPx)
        {
            p.DrawLine(i,0,i,canvasElement.height, 'rgb(90,90,90)');
            p.DrawLine(0,i,canvasElement.width,i, 'rgb(90,90,90)');
        }
        
        //draw apples
        for (let i=0; i<apples.length; i++)
        {
            p.DrawRectFilled(apples[i][0]*snake2data.cellWidthPx, apples[i][1]*snake2data.cellWidthPx, snake2data.cellWidthPx, snake2data.cellWidthPx, 'rgb(200,30,30)');
        }

        //draw snakes
        AVERAGE_AGE = AVERAGE_AGE*0.98;
        AVERAGE_APPLES_CONSUMED = AVERAGE_APPLES_CONSUMED*0.98;
        // const snakeCellPadding = 3;
        //let numLearningData = 0;
        for (let i=0; i<snakes.length; i++)
        {
            const s = snakes[i];
            AVERAGE_AGE += 0.02*s.age/snakes.length;
            AVERAGE_APPLES_CONSUMED += 0.02 * s.numApplesConsumed / snakes.length;
            let pos;
            //let pos2;
            //const pad = cellWidthPx/3;
            for (let j=0; j<s.positions.length; j++)
            {
                pos = s.positions[j];
                p.DrawRectFilled(pos[0]*snake2data.cellWidthPx+3, pos[1]*snake2data.cellWidthPx+3, snake2data.cellWidthPx-6, snake2data.cellWidthPx-6, 'green');
                // if (j+1 < s.positions.length) //if it's not the last cell...
                // {
                //     pos2 = s.positions[j+1];
                //     pos2[0] = (pos[0] + pos2[0])/2;
                //     pos2[1] = (pos[1] + pos2[1])/2;
                //     p.DrawRectFilled(pos2[0]*cellWidthPx+pad, pos2[1]*cellWidthPx+pad, cellWidthPx-pad*2, cellWidthPx-pad*2, 'blue');
                // }
            }
            p.DrawRectFilled(s.positions[0][0]*snake2data.cellWidthPx + 5, s.positions[0][1]*snake2data.cellWidthPx + 5, 5, 5, 'blue');
            //numLearningData += s.LEARNING_DATA_INPUTS.length;
        }
        p.SetTextColor("white");
        p.SetTextSize(15);
        p.DrawText(10,30,"Average Age: "+AVERAGE_AGE.toPrecision(3));
        p.DrawText(10,45,"Average Apples Consumed: "+AVERAGE_APPLES_CONSUMED.toPrecision(3));
        p.DrawText(10,60,"Num Training Samples: "+LEARNING_DATA_INPUTS.length);
    }
    function renderNeuralNetwork()
    {
        const neuralNetworkCanvas = neuralNetworkCanvasRef.current;
        const bb = neuralNetworkCanvas.getBoundingClientRect();
        neuralNetworkCanvas.width = Math.round(bb.width);
        neuralNetworkCanvas.height = Math.round(bb.height);
        const p2 = new Painter(neuralNetworkCanvas);
        //Neural Network
        //p2.Clear("black");
        //p2.ClearTransparent();
        const ml = SNAKE_ML;
        const layers = ml.layers;

        let x = 0;
        let xStep = neuralNetworkCanvas.width/layers.length;
        // let yMultiplier = 33;
        let maxC = 0;
        let avgC = 0;
        let numWeights = 0;
        
        for (let i=0; i<layers.length; i++)
        {
            let j_yMultiplier = neuralNetworkCanvas.height / layers[i].length;
            for (let j=0; j<layers[i].length; j++)
            {
                let k_yMultiplier = neuralNetworkCanvas.height / layers[i][j].length;
                for (let k=0; k<layers[i][j].length; k++)
                {
                    let r = Math.min(255, Math.max(0, layers[i][j][k]*nnColorMultiplier));
                    let b = Math.min(255, Math.max(0, -layers[i][j][k]*nnColorMultiplier));
                    maxC = Math.max(maxC, Math.max(r,b));
                    avgC += r + b;
                    numWeights++;
                    if (r < 20 && b < 20) { continue;}
                    p2.DrawLine(x,k*k_yMultiplier, x+xStep,j*j_yMultiplier, rgbToHex(r,0,b));
                }
            }
            x += xStep; 
        }

        avgC /= numWeights;
        if (avgC < 80)
        {
            nnColorMultiplier *= 1.05;
        } else {
            nnColorMultiplier /= 1.05;
        }
    }
    function update()
    {
        snake2data.updateOn += 1;

        //Check for rendering
        if (Date.now() - snake2data.renderDelayMs > snake2data.previousRenderTime)
        {
            snake2data.renderOn++;
            snake2data.previousRenderTime = Date.now();
            if (snake2data.renderOn % 4 === 0)
            {
                renderNeuralNetwork();
            }   
            renderSnakeGame();
        }

        if (LEARNING_DATA_INPUTS.length > 1)
        {
            SNAKE_ML.learnBatch(LEARNING_DATA_INPUTS, LEARNING_DATA_OUTPUTS, WEIGHT_MODIFIER, 1, GRAD_DESCENT_ITERS_PER_UPDATE, false, false);
        }

        //create grid
        let grid = []
        for (let i=0; i<GRID_WIDTH*GRID_WIDTH; i++)
        {
            grid.push(0);
        }

        //load the apples into the grid
        for (let i=0; i<apples.length; i++)
        {
            grid[apples[i][0]*GRID_WIDTH + apples[i][1]] = APPLE_VALUE;
        }


        //put snakes into grid, and check for eaten apples
        for (let i=0; i<snakes.length; i++)
        {
            const s = snakes[i];
            for (let j=0; j<s.positions.length; j++)
            {
                const pos = s.positions[j];
                grid[pos[0]*GRID_WIDTH + pos[1]] = WALL_VALUE;
            }
            const head = s.positions[0];
            for (let j=0; j<apples.length; j++)
            {
                if (apples[j][0] === head[0] && apples[j][1] === head[1])
                {
                    let x = 1 + Math.round(Math.random() * (GRID_WIDTH-2));
                    let y = 1 + Math.round(Math.random() * (GRID_WIDTH-2));
                    apples[j][0] = x;
                    apples[j][1] = y;
                }
            }
        }

        //update each snake
        for (let i=0; i<snakes.length; i++)
        {
            const s = snakes[i];
            s.update(grid, GRID_WIDTH);
            if (s.isDead)//|| s.score < KILL_SCORE_THRESHOLD)
            {
                snake2data.avgNumApplesConsumed = snake2data.avgNumApplesConsumed*0.99 + s.numApplesConsumed * 0.01;
                snakes[i].age = 0;
                snakes[i].numApplesConsumed = 0;
                let x = Math.round(Math.random() * GRID_WIDTH);
                let y = Math.round(Math.random() * GRID_WIDTH);
                snakes[i].positions = [[x,y]]
                snakes[i].isDead = false;
            }
        }
    }

    useEffect(() => {
        const canvasElement = canvasRef.current;
        const neuralNetworkCanvas = neuralNetworkCanvasRef.current;
        if (canvasElement == null || neuralNetworkCanvas == null) {
            setup();
        }
    }, []);

    useEffect(() => {
        const updateInterval = setInterval(update, snake2data.updateIntervalMs);
        setTimeout(() => {
            console.log("Iterator: ", iterator);
            setIterator(iterator + 1);
        }, 1000);
        return () => clearInterval(updateInterval);
    }, [iterator]);

    return (
        <div className="project-page">
            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                <h1>Snake Game Neural Network V2</h1>
            </div>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                <div style={{ display: 'block', width: 'fit-content', maxWidth: '80vw' }}>
                    <p>
                        This is my second attempt at making a perfect AI for playing snake game! 
                        This time, the snake learns in real time on your computer.
                    </p>
                    <p>
                        The inputs to this model are the surrounding tiles, and the outputs are Up, Down, Left, and Right. 
                        The neural network rendering below shows the weights of the current model, with red and blue lines representing positive and negative weights respectively.
                    </p>
                    <p>
                        Each snake uses the same neural network, thus should all behave the same given the same situation.
                        A centralized machine learning model with multiple snakes is being used to collect more training data per time step.
                        As for the training data, as the snakes navigate the world, training data is generated based on if the snake makes a sub-optimal move.
                        For example, if the model decides to run the head of the snake into a wall, we record the inputs and find an output that if had been generated would have kept the snake alive.
                        To incentivize the snake eating apples, at each update the closest apple is found to the snake and the outputs which would move the snake closer are recorded.
                        For modifying the weights a simple gradient descent back-propagation algorithm was implemented. The activation function used is a linearized tanh function. 
                        Through these two means of learning and gradient descent, the snake is able to learn that 1.) Hitting walls is bad, and 2.) Apples are good
                    </p>
                    <p>
                        Feel free to mess around with the different parameters available, and see how the snake learns differently!
                    </p>
                </div>
            </div>

            <div style={{ paddingLeft: '10vw', paddingRight: '10vw' }}>
                <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                    <table style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr style={{ border: '1px solid white', padding: '1vmin' }}>
                                <td style={{ padding: '0.5vmin' }}>Update Speed:</td>
                                <td>
                                    <input 
                                        id="speedSlider" 
                                        type="range" 
                                        defaultValue="90" 
                                        min="0" 
                                        max="100" 
                                        step="1" 
                                        onChange={simulationSpeedSliderUpdate}
                                    />
                                </td>
                                <td><div id="speedSliderText"></div></td>
                            </tr>
                            <tr style={{ border: '1px solid white', padding: '1vmin' }}>
                                <td style={{ padding: '0.5vmin' }}>Num Snakes:</td>
                                <td>
                                    <input 
                                        id="numSnakesSlider" 
                                        type="range" 
                                        defaultValue="20" 
                                        min="1" 
                                        max="100" 
                                        step="1" 
                                        onChange={simulationSpeedSliderUpdate}
                                    />
                                </td>
                                <td><div id="numSnakesSliderText"></div></td>
                            </tr>
                            <tr style={{ border: '1px solid white', padding: '1vmin' }}>
                                <td style={{ padding: '0.5vmin' }}>Num Apples:</td>
                                <td>
                                    <input 
                                        id="numApplesSlider" 
                                        type="range" 
                                        defaultValue="20" 
                                        min="1" 
                                        max="100" 
                                        step="1" 
                                        onChange={simulationSpeedSliderUpdate}
                                    />
                                </td>
                                <td><div id="numApplesSliderText"></div></td>
                            </tr>
                            <tr style={{ border: '1px solid white', padding: '1vmin' }}>
                                <td style={{ padding: '0.5vmin' }}>Grid Width:</td>
                                <td>
                                    <input 
                                        id="gridWidthSlider" 
                                        type="range" 
                                        defaultValue="32" 
                                        min="1" 
                                        max="100" 
                                        step="1" 
                                        onChange={simulationSpeedSliderUpdate}
                                    />
                                </td>
                                <td>
                                    <div id="gridWidthSliderText"></div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table style={{ borderCollapse: 'collapse', marginLeft:'1rem' }}>  
                        <tbody>
                            <tr style={{ border: '1px solid white', padding: '1vmin' }}>
                                <td style={{ padding: '0.5vmin' }}>
                                    Weight Modifier:
                                </td>
                                <td>
                                    <input 
                                        id="weightSlider" 
                                        type="range" 
                                        min="1" 
                                        max="100" 
                                        step="1" 
                                        onInput={simulationSpeedSliderUpdate}
                                    />
                                </td>
                                <td >
                                    <div id="weightSliderText"></div>
                                </td>
                            </tr>
                
                            <tr style={{ border: '1px solid white', padding: '1vmin' }}>
                                <td style={{ padding: '0.5vmin' }}>
                                    G.D. Iters Per Update:
                                </td>
                                <td>
                                    <input id="gradDescentIterSlider" type="range" defaultValue="50" min="1" max="100" step="1" onInput={simulationSpeedSliderUpdate} />
                                </td>
                                <td >
                                    <div id="gradDescentIterSliderText"></div>
                                </td>
                            </tr>
                
                            <tr style={{ border: '1px solid white', padding: '1vmin' }}>
                                <td style={{ padding: '0.5vmin' }}>
                                    Random Prune Percentage:
                                </td>
                                <td>
                                    <input id="randomPruneSlider" type="range" defaultValue="10" min="1" max="100" step="1" onInput={simulationSpeedSliderUpdate} />
                                    
                                </td>
                                <td>
                                    <div id="randomPruneSliderText"></div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div style={{ display: 'block', width: '1vw' }}></div>

                </div>

                <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                    <button 
                        style={{
                            width: 'fit-content',
                            height: 'fit-content',
                            backgroundColor: 'white',
                            color: 'black',
                            cursor: 'pointer',
                            padding: '1vmin',
                            margin: '1vmin'
                        }}
                        onClick={setup}
                    >
                        Reset
                    </button>
                    <button 
                        style={{
                            width: 'fit-content',
                            height: 'fit-content',
                            backgroundColor: 'white',
                            color: 'black',
                            cursor: 'pointer',
                            padding: '1vmin',
                            margin: '1vmin'
                        }}
                        onClick={randomlyPruneWeights}
                    >
                        Randomly Prune Weights
                    </button>
                    <button 
                        style={{
                            width: 'fit-content',
                            height: 'fit-content',
                            backgroundColor: 'white',
                            color: 'black',
                            cursor: 'pointer',
                            padding: '1vmin',
                            margin: '1vmin'
                        }}
                        onClick={resetTrainingData}
                    >
                        Reset Training Data
                    </button>
                    <button 
                        style={{
                            width: 'fit-content',
                            height: 'fit-content',
                            backgroundColor: 'white',
                            color: 'black',
                            cursor: 'pointer',
                            padding: '1vmin',
                            margin: '1vmin'
                        }}
                        onClick={saveNNWeights}
                    >
                        Save NN Weights
                    </button>
                    <button 
                        style={{
                            width: 'fit-content',
                            height: 'fit-content',
                            backgroundColor: 'white',
                            color: 'black',
                            cursor: 'pointer',
                            padding: '1vmin',
                            margin: '1vmin'
                        }}
                        onClick={loadNNWeights}
                    >
                        Load NN Weights
                    </button>
                    <input 
                        id="fileInput" 
                        type="file" 
                        style={{ position: 'fixed', top: '-100%' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                <canvas 
                    id="snakeCanvas"
                    ref={canvasRef}
                    style={{ height: '45vw', aspectRatio: '1/1', padding: '2vmin' }}
                />
                <canvas 
                    id="neuralNetworkCanvas"
                    ref={neuralNetworkCanvasRef}
                    style={{ height: '45vw', aspectRatio: '1/1', padding: '2vmin' }}
                />
            </div>
        </div>
    );
}

export default Snake2;



