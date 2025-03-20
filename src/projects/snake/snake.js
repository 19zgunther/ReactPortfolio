import { useRef, useEffect, useState } from "react";
import { Painter, rgbToHex } from "../../painter";



class ML
{
    constructor(columnInfo = [2,3,2]){
        this.columnInfo = columnInfo;

        this.layers = []; //in form this.columns[layer][node][weight]   or this.columns[layer][column][row]

        for (let i=1; i<columnInfo.length; i++)
        {
            let numNodes = this.columnInfo[i];
            let numWeights = this.columnInfo[i-1];
            let layer = [];
            for (let n=0; n<numNodes; n++)
            {
                let nodeWeights = [];
                for (let w=0; w<numWeights; w++)
                {
                    nodeWeights.push( Math.random() );
                }
                layer.push(nodeWeights);
            }
            this.layers.push(layer);
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
    getChild(randomModifier = 0.01)
    {
        const ml = new ML(this.columnInfo);
        for (let L=0; L<this.layers.length; L++)
        {
            for (let n=0; n<this.layers[L].length; n++)
            {
                for (let w=0; w<this.layers[L][n].length; w++)
                {
                   ml.layers[L][n][w] = Math.random()*randomModifier + this.layers[L][n][w] -randomModifier/2;
                }
            }
        }
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
        }
        return temp;
    }
    getModelNodeValues(input)
    {
        let nodes = [];
        let temp = input;
        for(let i=0; i<this.layers.length; i++)
        {
            nodes.push(temp);
            temp = this._multiplyLayers(temp, this.layers[i]);
        }
        nodes.push(temp);
        return nodes;
    }
}

// var canvasElement = document.getElementById("snakeCanvas");
// var neuralNetworkCanvasElement = document.getElementById('snakeNeuralNetworkCanvas');
var p = null;
var numCells = 10;
var cellWidth = null //set in setup();
var width = null; //set in setup()
var height = null;
var snake = [[4,5]];
var apple = [6,6];
var snakeDirection = 'right';
var playingGame = false;
var ml = null;
var timeInterval = 300;

var snakeData = {
    timeInterval: 300,
    ml: null,
    canvasElement: null,
    neuralNetworkCanvasElement: null,
};

//Snake Game
function Snake() {
    const [firstRender, setFirstRender] = useState(true);
    
    // use ref to canvas element
    const canvasRef = useRef(null);
    const neuralNetworkCanvasRef = useRef(null);

    useEffect(() => {
        function foo(e) {
            if (playingGame)
            {
                if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')
                {
                    snakeDirection = 'up';
                }
                if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')
                {
                    snakeDirection = 'down';
                }
                if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')
                {
                    snakeDirection = 'left';
                }
                if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight')
                {
                    snakeDirection = 'right';
                }
            } else {
                playingGame = true;
                snakeDirection = 'right';
                snake = [[1,1]];
                moveApple();
            }
        }
        window.onkeydown = foo;
    }, []);

    function reset()
    {
        snake = [[1,2],];//[4,5]];
        snake[0][0] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
        snake[0][1] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
        apple[0] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
        apple[1] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
    }
    function moveApple()
    {
        apple[0] = Math.max(Math.min(Math.round( Math.random() * numCells ), numCells-1),0);
        apple[1] = Math.max(Math.min(Math.round( Math.random() * numCells ), numCells-1),0);
    }

    useEffect(() => {
        function setup() {
            console.log("Setup")
            const canvasElement = canvasRef.current;
            const neuralNetworkCanvasElement = document.getElementById('snakeNeuralNetworkCanvas');
            
            if (canvasElement == null || neuralNetworkCanvasElement == null) {
                p = null;
                return;
            }

            p = new Painter(canvasElement);

            //resize snake canvas element
            let bb = canvasElement.getBoundingClientRect();
            canvasElement.width = bb.width;
            canvasElement.height = bb.height;
            width = bb.width;
            height = bb.height;

            //resize neural network canvas element
            bb = neuralNetworkCanvasElement.getBoundingClientRect();
            neuralNetworkCanvasElement.width = bb.width*2;
            neuralNetworkCanvasElement.height = bb.height*2;

            p.Clear('black');


            cellWidth = width/numCells;// ml = parent.getChild(0.1, i);
            drawGrid();
            moveApple();


            /*
            let bestScore = 0;
            let bestMachine = null;
            let columnInfo = [8,10,4];
            let parent = new ML(columnInfo);
            let bestScores = [];


            //Make a timer so it stops training after 1 minute max
            let endTime = new Date().getTime() + 60000;
            //let endTime = new Date().getTime() + 60000*5;

            for (let gen=1; gen<100000; gen++)
            {
                bestScore = 0;
                bestMachine = null;
                for (let i=0; i<1000; i++)
                {
                    let ml;
                    if (gen == 1 || i < 50)
                    {
                        ml = new ML(columnInfo)
                    } else if (i < 300) {
                        ml = parent.getChild(0.5, i);
                    } else if (i < 600) {
                        ml = parent.getChild(0.2, i);
                    } else {
                        ml = parent.getChild(0.08, i);
                    }

                    let score = 0;
                    for (let run=0; run<10; run++)
                    {
                        score += runGame(ml)/10;
                    }
                    if (bestScore < score && score != undefined)
                    { 
                        bestScore = score; 
                        bestMachine = ml;
                    }
                }

                //if (gen%100 == 0) {}
                console.log(bestScore);
                parent = bestMachine;
                bestScores.push(bestScore);

                if (bestScore > 10000 || new Date().getTime() > endTime)
                {
                    break;
                }
            }

            ml = parent;

            const maxScore = Math.max(...bestScores);
            console.log("best score: "+maxScore);

            const cnvs = document.getElementById('graphCanvas');
            const bb = cnvs.getBoundingClientRect();
            cnvs.width = bb.width;
            cnvs.height = bb.height;
            const p2 = new Painter(cnvs);
            p2.Clear('white');
            for (let i=0; i<bestScores.length; i++)
            {
                p2.DrawLine(i, bb.height, i, bb.height-(bestScores[i]/maxScore)*bb.height, 'red');
            }


            //Print model to console
            let output = String(columnInfo) + "\n";
            for (let L=0; L<ml.layers.length; L++)
            {
                for (let n=0; n<ml.layers[L].length; n++)
                {
                    output += String(ml.layers[L][n]) + "\n";
                }
            }
            console.log(output);*/

            let save = `8,10,10,4
            -4.301710864366431,0.8662122606768411,1.1815877436088114,1.0847635608384516,-5.241861141685687,-1.8299297473243439,0.34553485035888576,-0.1899122894103982
            0.7533939233257715,0.3095522126485506,-4.461460603006369,2.2856850215507403,1.3309034319273414,-2.5345078678943893,-2.981137278557868,2.6992790643843345
            -2.6808032997628253,1.3872016260507192,-2.9643615172680926,0.38499877303442054,-0.10572151951231669,-1.3487323126134108,1.1125222132563417,0.45369296735462084
            -0.7244513031025619,-0.4206188279382823,-1.79901867838158,2.496762598372312,-0.4988391677561467,2.555137252632325,2.6919422782212745,-0.61043964894226
            9.433381048721587,0.04230699290750192,0.7562853986111919,-2.8343402515383636,1.4846597263164327,3.7896703276538743,-4.3135148130439935,-4.749813390226505
            -0.7165376683106196,2.23962521820843,3.983768816693241,0.9489563987851103,2.6506367652754963,0.5051573752102725,-1.050790825110574,-0.23517876658393788
            -1.5068217661505272,0.0675143348384955,-2.7221760571506297,-0.4969373015389831,1.849386509014579,2.8871263335867434,-0.2182860947298163,-3.8127395077623034
            3.0992486119949074,3.824916103877781,1.2473649224631254,-4.25930813509154,-0.8640800728091689,1.6944800825593405,3.4100380663603547,2.3183469089262156
            -0.6024066236773991,1.7083896882800724,-0.268029594446071,4.183144847279945,0.3336953643501869,-2.4445592026939953,4.179786440119175,-1.4635650521270869
            -2.370574433055779,-1.934980702861551,-0.33695470449544757,-1.313869008316951,-3.172824416307877,4.241848559572513,-0.24772755736147004,2.3666312304510497
            5.740989152865147,0.4353338658323215,2.9115007127818937,3.045065001410826,0.019131468252866324,-2.7143196804608327,0.05918275487146055,0.4198132140620723,-0.2366715951514961,-1.7598007234633544
            2.4596356004979443,-0.261768863721437,-0.5859825531421338,-1.5574612029074335,0.16456988616612064,1.3000508987098085,-1.5726432361079137,-2.3837977222073525,4.235627432057616,1.7344641496359416
            2.782471362737879,11.053329931279553,-0.4302912467050509,-0.6530565581983133,-0.3103771869707364,0.661723409568373,-0.6808362062185177,1.9525058231104766,5.010335912015359,2.3683803278447653
            0.7359250274894823,-0.8559818534917099,1.5080693561526344,2.5094474475227693,-0.523999052970141,0.8470676567124787,2.2646811454991465,-1.769078231721421,1.2672035667660069,-2.8471969881187507
            2.6823650459607262,2.6382719011787046,2.1410957628481895,3.621460427090228,-1.4488862368165047,1.1251494576604189,-0.3851355832237723,-2.6267008726335375,-0.8768104404393816,0.7167702142376996
            0.8317640944991626,-0.31061312127159346,3.649702647089296,0.3694762957479669,0.5511716235475193,0.8498805683141659,0.10708788091442856,1.1915295865302948,0.841556967637685,2.0548276795896894
            -0.6853821313340533,-1.4771788296863382,-0.8420893602167365,4.28869615888004,-2.040377467477414,-0.6221814715201991,0.3194234322217486,-3.6744256636934107,-1.413506921367058,2.810872340543967
            -4.116426038204628,0.9595796475199717,-3.5168127762926247,-1.3621766486128437,1.1508814516588863,-1.5916995666390867,-2.309812055978227,4.038075225716055,-2.531329293222493,-2.1969801045487816
            2.140380747850108,-1.5824219728791757,0.049935960572716764,5.086314357451586,2.886746247130925,1.1103830937058174,5.155424340758232,1.9541697647402563,-7.788571642720999,0.1901574910082118
            2.912993028398849,-1.4697902061507726,-2.895543518713862,-2.3297322703709127,-0.7983749147115159,-0.779913350850535,0.0634269677508531,-3.123576495681885,8.801591658581968,2.1487808961328483
            2.2587201896052442,-0.4596836106164247,-0.7325407139066019,2.8478155348482397,3.838207231547655,-1.7523821848270131,-2.0229785668554277,3.775466858176975,4.233858628930847,-2.3566193878638364
            1.0272221226477485,4.586574489893042,-2.6521569306450017,1.410254786295645,-1.0727969486940108,-1.2420371687676612,-1.0333176359796588,3.8217202665942582,0.506448102804281,1.6123646393087823
            -2.6278967133002937,4.790060644999243,-4.276574892499845,2.765063070545908,0.30615083784168107,2.8497247399282863,-0.12035819517699453,2.9851791861556753,3.1726599983872052,3.991737099280756
            2.230077038043694,0.27863508085563415,0.6158852243937618,-1.8474460393042769,0.13336468220404354,5.2618747641522035,5.590067467641053,2.1764997875103136,4.985709687213263,6.138971756031425`;


            save = `8,10,10,4
            -4.301710864366431,0.8662122606768411,1.1815877436088114,1.0847635608384516,-5.241861141685687,-1.8299297473243439,0.34553485035888576,-0.1899122894103982
            0.7533939233257715,0.3095522126485506,-4.461460603006369,2.2856850215507403,1.3309034319273414,-2.5345078678943893,-2.981137278557868,2.6992790643843345
            -2.6808032997628253,1.3872016260507192,-2.9643615172680926,0.38499877303442054,-0.10572151951231669,-1.3487323126134108,1.1125222132563417,0.45369296735462084
            -0.7244513031025619,-0.4206188279382823,-1.79901867838158,2.496762598372312,-0.4988391677561467,2.555137252632325,2.6919422782212745,-0.61043964894226
            9.433381048721587,0.04230699290750192,0.7562853986111919,-2.8343402515383636,1.4846597263164327,3.7896703276538743,-4.3135148130439935,-4.749813390226505
            -0.7165376683106196,2.23962521820843,3.983768816693241,0.9489563987851103,2.6506367652754963,0.5051573752102725,-1.050790825110574,-0.23517876658393788
            -1.5068217661505272,0.0675143348384955,-2.7221760571506297,-0.4969373015389831,1.849386509014579,2.8871263335867434,-0.2182860947298163,-3.8127395077623034
            3.0992486119949074,3.824916103877781,1.2473649224631254,-4.25930813509154,-0.8640800728091689,1.6944800825593405,3.4100380663603547,2.3183469089262156
            -0.6024066236773991,1.7083896882800724,-0.268029594446071,4.183144847279945,0.3336953643501869,-2.4445592026939953,4.179786440119175,-1.4635650521270869
            -2.370574433055779,-1.934980702861551,-0.33695470449544757,-1.313869008316951,-3.172824416307877,4.241848559572513,-0.24772755736147004,2.3666312304510497
            5.740989152865147,0.4353338658323215,2.9115007127818937,3.045065001410826,0.019131468252866324,-2.7143196804608327,0.05918275487146055,0.4198132140620723,-0.2366715951514961,-1.7598007234633544
            2.4596356004979443,-0.261768863721437,-0.5859825531421338,-1.5574612029074335,0.16456988616612064,1.3000508987098085,-1.5726432361079137,-2.3837977222073525,4.235627432057616,1.7344641496359416
            2.782471362737879,11.053329931279553,-0.4302912467050509,-0.6530565581983133,-0.3103771869707364,0.661723409568373,-0.6808362062185177,1.9525058231104766,5.010335912015359,2.3683803278447653
            0.7359250274894823,-0.8559818534917099,1.5080693561526344,2.5094474475227693,-0.523999052970141,0.8470676567124787,2.2646811454991465,-1.769078231721421,1.2672035667660069,-2.8471969881187507
            2.6823650459607262,2.6382719011787046,2.1410957628481895,3.621460427090228,-1.4488862368165047,1.1251494576604189,-0.3851355832237723,-2.6267008726335375,-0.8768104404393816,0.7167702142376996
            0.8317640944991626,-0.31061312127159346,3.649702647089296,0.3694762957479669,0.5511716235475193,0.8498805683141659,0.10708788091442856,1.1915295865302948,0.841556967637685,2.0548276795896894
            -0.6853821313340533,-1.4771788296863382,-0.8420893602167365,4.28869615888004,-2.040377467477414,-0.6221814715201991,0.3194234322217486,-3.6744256636934107,-1.413506921367058,2.810872340543967
            -4.116426038204628,0.9595796475199717,-3.5168127762926247,-1.3621766486128437,1.1508814516588863,-1.5916995666390867,-2.309812055978227,4.038075225716055,-2.531329293222493,-2.1969801045487816
            2.140380747850108,-1.5824219728791757,0.049935960572716764,5.086314357451586,2.886746247130925,1.1103830937058174,5.155424340758232,1.9541697647402563,-7.788571642720999,0.1901574910082118
            2.912993028398849,-1.4697902061507726,-2.895543518713862,-2.3297322703709127,-0.7983749147115159,-0.779913350850535,0.0634269677508531,-3.123576495681885,8.801591658581968,2.1487808961328483
            2.2587201896052442,-0.4596836106164247,-0.7325407139066019,2.8478155348482397,3.838207231547655,-1.7523821848270131,-2.0229785668554277,3.775466858176975,4.233858628930847,-2.3566193878638364
            1.0272221226477485,4.586574489893042,-2.6521569306450017,1.410254786295645,-1.0727969486940108,-1.2420371687676612,-1.0333176359796588,3.8217202665942582,0.506448102804281,1.6123646393087823
            -2.6278967133002937,4.790060644999243,-4.276574892499845,2.765063070545908,0.30615083784168107,2.8497247399282863,-0.12035819517699453,2.9851791861556753,3.1726599983872052,3.991737099280756
            2.230077038043694,0.27863508085563415,0.6158852243937618,-1.8474460393042769,0.13336468220404354,5.2618747641522035,5.590067467641053,2.1764997875103136,4.985709687213263,6.138971756031425`;
            ml = new ML();
            ml.load(save);

            playingGame = true;
        }
        function update() {

            if (p == null) {setup(); return;}
            if (playingGame === true)
            {
                p.Clear('black');
                drawGrid();

                //Move the snake
                let last_pnt = snake[snake.length-1];
                let removed_pnt = null;
                switch(snakeDirection)
                {
                    case "up": 
                        snake.push( [ last_pnt[0], last_pnt[1]-1] );
                        removed_pnt = snake.shift();
                        break;
                    case "down":
                        snake.push( [ last_pnt[0], last_pnt[1]+1] );
                        removed_pnt = snake.shift();
                        break;
                    case "left":
                        snake.push( [ last_pnt[0]-1, last_pnt[1]] );
                        removed_pnt = snake.shift();
                        break;
                    default:
                        snake.push( [ last_pnt[0]+1, last_pnt[1]] );
                        removed_pnt = snake.shift();
                        break;
                }

                //check to see if it ate the apple
                last_pnt = snake[snake.length-1];
                if (last_pnt[0] === apple[0] && last_pnt[1] === apple[1])
                {
                    snake.unshift(removed_pnt);
                    moveApple();
                    timeInterval = Math.floor(timeInterval*0.9);
                    // clearInterval(updateInterval);
                    // updateInterval = setInterval(update, timeInterval);
                }

                //draw Snake
                for (let i=0; i<snake.length; i++){
                    let x = snake[i][0];
                    let y = snake[i][1];
                    p.DrawRectFilled( x*cellWidth + 3, y*cellWidth + 3, cellWidth-6, cellWidth-6, 'green' );
                }

                //draw apple
                p.DrawRectFilled( apple[0]*cellWidth + 3, apple[1]*cellWidth + 3, cellWidth-6, cellWidth-6, 'red' );


                //check to see if it hit itself or border
                if (checkForSnakeOverlap())
                {
                    playingGame = false;
                    p.DrawTextCentered(width/2, width/2, "Game Over!\nPress Any Key To Continue.", 'white');
                    timeInterval = 500;
                    // clearInterval(updateInterval);
                    // updateInterval = setInterval(update, timeInterval);
                }
            } else {

                p.Clear('black');
                drawGrid();

                //draw Snake
                for (let i=0; i<snake.length; i++){
                    let x = snake[i][0];
                    let y = snake[i][1];
                    p.DrawRectFilled( x*cellWidth + 3, y*cellWidth + 3, cellWidth-6, cellWidth-6, 'yellow' );
                }

                if (snake.length != 0)
                {
                    snake.shift();
                }

                //draw apple
                p.DrawRectFilled( apple[0]*cellWidth + 3, apple[1]*cellWidth + 3, cellWidth-6, cellWidth-6, 'red' );
                p.DrawTextCentered(width/2, width/2, "Press Any Key To Continue.\nUse WASD or the arrow keys to move", 'white');
            }
        }
        function drawGrid()
        {
            for (let i=1; i<numCells; i++)
            {
                p.DrawLine(i*cellWidth,0, i*cellWidth, width, '#444444');
                p.DrawLine(0, i*cellWidth, width, i*cellWidth, '#444444');
            }
        }
        function checkForSnakeOverlap()
        {
            for (let i=0; i<snake.length-1; i++)
            {
                if (snake[i][0] == snake[snake.length-1][0] && snake[i][1] == snake[snake.length-1][1])
                {
                    return true;
                }
            }
            let i = snake.length-1;
            if (snake[i][0] < 0 || snake[i][0] >= numCells || snake[i][1] < 0 || snake[i][1] >= numCells)
            {
                return true;
            } 
            return false;
        }
        function runGame(ml, numCells = 6)
        {
            
            /*  Inputs are:
            *       Is head.x < apple.x?
                    Is head.x > apple.x?
                    Is head.y < apple.y?
                    Is head.y > apple.y?

                Outputs (4) are: 
                    up, right, down, left
            */

            const apple = [Math.floor(Math.random()*numCells*0.5 + 0.25*numCells), Math.floor(Math.random()*numCells*0.5 + 0.25*numCells)];
            const snake = [[Math.floor(Math.random()*numCells*0.5 + 0.25*numCells), Math.floor(Math.random()*numCells*0.5 + 0.25*numCells)], ];

            //let currentDirection = 0; //0=up, 1=right, 2=down, 3=left
            let score = 0;
            let scoreMultiplier = 10;

            let head = snake[snake.length-1];
            let tick = 0;

            let board = [];
            for (let i=0; i<numCells+2;i++)
            {
                let row = [];
                for (let j=0; j<numCells+2;j++)
                {
                    row.push(0);
                }
                board.push(row);
            }

            while( tick<(10+score*10) && tick < 1000)
            {
                tick += 1;

                for (let i=0; i<numCells+2;i++)
                {
                    for (let j=0; j<numCells+2;j++)
                    {
                        board[i][j] = 0;
                    }
                }
                for (let i=0; i<snake.length; i++)
                {
                    board[snake[i][0]+1][snake[i][1]+1] = 1;
                }

                //get ml decision.
                head = snake[snake.length-1];
                let input = [
                    //1/(head[0]+1), 
                    //1/(numCells - head[0]),
                    //1/(head[1]+1), 
                    //1/(numCells - head[1]),
                    Number( head[0] < apple[0] ),
                    Number( head[0] == apple[0] ),
                    Number( head[1] < apple[1] ),
                    Number( head[1] == apple[1] ),
                    board[ head[0]     ][ head[1] + 1 ], //x-1, left
                    board[ head[0] + 2 ][ head[1] + 1 ], //x+2, right 
                    board[ head[0] + 1 ][ head[1]     ], //y-1, bottom
                    board[ head[0] + 1 ][ head[1] + 2 ], //y+2, top

                    board[ head[0] + 2 ][ head[1] + 2 ], //y+2, top
                    board[ head[0] + 2 ][ head[1] + 0 ], //y+2, top
                    board[ head[0] + 0 ][ head[1] + 2 ], //y+2, top
                    board[ head[0] + 0 ][ head[1] + 0 ], //y+2, top
                ];

                let output = ml.compute(input);

                //Move snake
                let maxVal = Math.max(...output);
                head = snake[snake.length-1];
                if (maxVal == output[0]) // up
                {
                    snake.push( [head[0], head[1]-1] );
                    //currentDirection = 0;
                } else if (maxVal == output[1]) //right
                {
                    snake.push( [head[0]+1, head[1]] );
                    //currentDirection = 1;
                } else if (maxVal == output[2]) //down
                {
                    snake.push( [head[0], head[1]+1] );
                    //currentDirection = 2;
                } else {//left
                    snake.push( [head[0]-1, head[1]] );
                    //currentDirection = 3;
                }

                //Check if we are on top of apple && move apple if eaten
                if (head[0] == apple[0] && head[1] == apple[1])
                {
                    score += 1;
                    apple[0] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
                    apple[1] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
                } else {
                    snake.shift();
                }


                //Make sure snake is within borders
                head = snake[snake.length-1];
                if (head[0] < 0 || head[0] >= numCells || head[1]<0 || head[1]>=numCells)
                {
                    //return  tick + score*scoreMultiplier;
                    return score*scoreMultiplier - tick;
                }

                
                //make sure snake is not overlapping
                for (let i=0; i<snake.length-1; i++)
                {
                    if (snake[i][0] == head[0] && snake[i][1] == head[1])
                    {
                        return score*scoreMultiplier - tick;
                    }
                }

            }
            //return  score*scoreMultiplier;
            return score*scoreMultiplier - tick;
        }
        function updateML(neuralNetworkCanvasElement)
        {
            if (p == null) {return;}
            p.Clear('#111111');
            p.SetStrokeWidth(1);
            //draw grid
            for (let i=1; i<numCells; i++)
            {
                p.DrawLine(i*cellWidth, 0, i*cellWidth, height, '#aaaaaa');
                p.DrawLine(0, i*cellWidth, width, i*cellWidth, '#aaaaaa');
            }
            //draw Snake
            for (let i=0; i<snake.length; i++){
                let x = snake[i][0];
                let y = snake[i][1];
                p.DrawRectFilled( x*cellWidth + 3, y*cellWidth + 3, cellWidth-6, cellWidth-6, rgbToHex(0,255-(snake.length-i)*10,0) );
            }
            let head = snake[snake.length-1];
            p.DrawCircleFilled(head[0]*cellWidth + cellWidth/2, head[1]*cellWidth + cellWidth/2, cellWidth/10, 'green');

            //draw apple
            p.DrawCircleFilled( apple[0]*cellWidth + cellWidth/2, apple[1]*cellWidth + cellWidth/2, cellWidth/3, 'red' );



            let board = [];
            for (let i=0; i<numCells+2;i++)
            {
                let row = [];
                for (let j=0; j<numCells+2;j++)
                {
                    row.push(0);
                }
                board.push(row);
            }

            for (let i=0; i<snake.length; i++)
            {
                board[snake[i][0]+1][snake[i][1]+1] = 1;
            }

            //get ml decision.
            head = snake[snake.length-1];
            const input = [
                Number( head[0] < apple[0] ),
                Number( head[0] == apple[0] ),
                Number( head[1] < apple[1] ),
                Number( head[1] == apple[1] ),
                board[ head[0]     ][ head[1] + 1 ], //x-1, left
                board[ head[0] + 2 ][ head[1] + 1 ], //x+2, right 
                board[ head[0] + 1 ][ head[1]     ], //y-1, bottom
                board[ head[0] + 1 ][ head[1] + 2 ], //y+2, top

                //board[ head[0] + 2 ][ head[1] + 2 ], //y+2, top
                //board[ head[0] + 2 ][ head[1] + 0 ], //y+2, top
                //board[ head[0] + 0 ][ head[1] + 2 ], //y+2, top
                //board[ head[0] + 0 ][ head[1] + 0 ], //y+2, top
            ];
            const output = ml.compute(input);




            //Draw Network.
            const painter = new Painter(neuralNetworkCanvasElement);
            painter.Clear('#00000000');

            /*
            const nodeValues = ml.getModelNodeValues(input);
            const columnPadding = neuralNetworkCanvasElement.width / ( nodeValues.length + 1);
            const nodeRadius = Math.min(neuralNetworkCanvasElement.width, neuralNetworkCanvasElement.height) / 40;
            let columnX = columnPadding;
            for (let c=0; c<nodeValues.length; c++)
            {
                const rowYPadding = neuralNetworkCanvasElement.height / ( nodeValues[c].length + 1);
                let rowY = rowYPadding;
                let maxNodeValue = 1; //get the max node value, so we can scale the color of each column from black to white
                for(let n=0; n<nodeValues[c].length; n++) { maxNodeValue = Math.max(maxNodeValue, nodeValues[c][n]); }
                

                for(let n=0; n<nodeValues[c].length; n++)
                {
                    const nodeValue = Math.floor( Math.max(Math.min(15*nodeValues[c][n]/maxNodeValue, 15), 2) ).toString(16);
                    const nodeColor = "#"+nodeValue+nodeValue+nodeValue+nodeValue+nodeValue+nodeValue;
                    painter.DrawCircleFilled(columnX, rowY, nodeRadius,  nodeColor);
                    rowY += rowYPadding;
                }
                columnX += columnPadding;
            }

            //Draw Network.
            const painter = new Painter(neuralNetworkCanvasElement);
            painter.Clear('#050505');
            
            const nodeValues = ml.getModelNodeValues(input);
            const columnPadding = neuralNetworkCanvasElement.width / ( nodeValues.length + 1);
            const nodeRadius = Math.min(neuralNetworkCanvasElement.width, neuralNetworkCanvasElement.height) / 40;
            let columnX = columnPadding;
            for (let c=0; c<nodeValues.length; c++)
            {
                const rowYPadding = neuralNetworkCanvasElement.height / ( nodeValues[c].length + 1);
                let rowY = rowYPadding;
                let maxNodeValue = 1; //get the max node value, so we can scale the color of each column from black to white
                for(let n=0; n<nodeValues[c].length; n++) { maxNodeValue = Math.max(maxNodeValue, nodeValues[c][n]); }
                

                for(let n=0; n<nodeValues[c].length; n++)
                {
                    const nodeValue = Math.floor( Math.max(Math.min(15*nodeValues[c][n]/maxNodeValue, 15), 2) ).toString(16);
                    const nodeColor = "#"+nodeValue+nodeValue+nodeValue+nodeValue+nodeValue+nodeValue;
                    painter.DrawCircleFilled(columnX, rowY, nodeRadius,  nodeColor);
                    rowY += rowYPadding;
                }
                columnX += columnPadding;
            }*/



            /////////////////////////////////////////////////////////////////////////////
            //Drawing the neural Network
            //First, getting constants and values
            const nodeValues = ml.getModelNodeValues(input);
            let maxNumNodesPerColumn = 1;
            let maxNodeValueInEachColumn = [];
            for (let c=0; c<nodeValues.length; c++)
            {
                maxNumNodesPerColumn = Math.max(maxNumNodesPerColumn, nodeValues[c].length);
                let maxNodeVal = 1;
                for (let n=0; n<nodeValues[c].length; n++)
                {
                    maxNodeVal = Math.max(maxNodeVal, nodeValues[c][n]);
                }
                maxNodeValueInEachColumn.push(maxNodeVal);
            }
            const nodeVerticalPadding = neuralNetworkCanvasElement.height / (maxNumNodesPerColumn + 1);
            const nodeHorizontalPadding = neuralNetworkCanvasElement.width / (nodeValues.length + 1);
            let columnVerticalPadding = [];
            for (let c=0; c<nodeValues.length; c++)
            {
                columnVerticalPadding.push(  (maxNumNodesPerColumn - nodeValues[c].length)*0.5*nodeVerticalPadding  );
            }

            const nodeRadius =  Math.floor( neuralNetworkCanvasElement.height / (maxNumNodesPerColumn*4) );
            painter.SetStrokeColor('#ffffff');
            painter.SetStrokeWidth(2);
            //Drawing...
            for (let c=0; c<nodeValues.length; c++)
            {
                for (let n=0; n<nodeValues[c].length; n++)
                {

                    //Draw Weights
                    if (c!=0)
                    {
                        let weightValues = [];
                        let maxWeightValue = 0;
                        for (let w=0; w<ml.layers[c-1][n].length; w++)
                        {
                            const weightValue =   Math.min( Math.max(ml.layers[c-1][n][w] * nodeValues[c-1][n], 2), 15) ;
                            weightValues.push(weightValue);
                            maxWeightValue = Math.max(maxWeightValue, weightValue);
                            //const weightColor = "#" + weightValue + weightValue + weightValue + weightValue + weightValue + weightValue;
                            //painter.DrawLine( c*nodeHorizontalPadding,  columnVerticalPadding[c-1] + (w+1)*nodeVerticalPadding, (c+1)*nodeHorizontalPadding, columnVerticalPadding[c] + (n+1)*nodeVerticalPadding, weightColor);
                        }

                        for (let w=0; w<ml.layers[c-1][n].length; w++)
                        {
                            const weightValue = Math.floor( weightValues[w]*10/maxWeightValue ).toString(16);
                            const weightColor = "#" + weightValue + weightValue + weightValue + weightValue + weightValue + weightValue;
                            painter.DrawLine( c*nodeHorizontalPadding,  columnVerticalPadding[c-1] + (w+1)*nodeVerticalPadding, (c+1)*nodeHorizontalPadding, columnVerticalPadding[c] + (n+1)*nodeVerticalPadding, weightColor);
                        }
                    }
                }
            }

            for (let c=0; c<nodeValues.length; c++)
            {
                for (let n=0; n<nodeValues[c].length; n++)
                {
                    //Draw nodes
                    const nodeValueScaled = Math.floor(Math.max(nodeValues[c][n]*15 / maxNodeValueInEachColumn[c], 1)).toString(16);
                    const nodeColor = '#' + nodeValueScaled + nodeValueScaled + nodeValueScaled + nodeValueScaled + nodeValueScaled + nodeValueScaled;
                    //console.log(nodeColor);
                    painter.DrawCircleFilled( (c+1)*nodeHorizontalPadding, columnVerticalPadding[c] + (n+1)*nodeVerticalPadding, nodeRadius,  nodeColor);
                }
            }



            //Move snake
            const maxVal = Math.max(...output);
            head = snake[snake.length-1];
            if (maxVal == output[0]) // up
            {
                snake.push( [head[0], head[1]-1] );
                // currentDirection = 0;
            } else if (maxVal == output[1]) //right
            {
                snake.push( [head[0]+1, head[1]] );
                // currentDirection = 1;
            } else if (maxVal == output[2]) //down
            {
                snake.push( [head[0], head[1]+1] );
                // currentDirection = 2;
            } else {//left
                snake.push( [head[0]-1, head[1]] );
                // currentDirection = 3;
            }
            
            //Check if we are on top of apple && move apple if eaten
            if (head[0] == apple[0] && head[1] == apple[1])
            {
                apple[0] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
                apple[1] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
            } else {
                snake.shift();
            }

            //Make sure snake is within borders
            let failed = false;
            head = snake[snake.length-1];
            if (head[0] < 0 || head[0] >= numCells || head[1]<0 || head[1]>=numCells)
            {
                failed = true;
            }

            //make sure snake is not overlapping
            for (let i=0; i<snake.length-1; i++)
            {
                if (snake[i][0] == head[0] && snake[i][1] == head[1])
                {
                    failed = true;
                    break;
                }
            }

            //If the snake ml lost, reset.
            if (failed)
            {
                snake = [[1,2],];//[4,5]];
                snake[0][0] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
                snake[0][1] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
                apple[0] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
                apple[1] = Math.floor(Math.random()*numCells*0.5 + 0.25*numCells);
            }
        } 
        function train() {
            let bestScore = 0;
            let bestMachine = null;
            let columnInfo = [8,10,4];
            let parent = new ML(columnInfo);
            let bestScores = [];


            //Make a timer so it stops training after 1 minute max
            let endTime = new Date().getTime() + 60000;
            //let endTime = new Date().getTime() + 60000*5;

            for (let gen=1; gen<100000; gen++)
            {
                bestScore = 0;
                bestMachine = null;
                for (let i=0; i<1000; i++)
                {
                    let ml;
                    if (gen == 1 || i < 50)
                    {
                        ml = new ML(columnInfo)
                    } else if (i < 300) {
                        ml = parent.getChild(0.5, i);
                    } else if (i < 600) {
                        ml = parent.getChild(0.2, i);
                    } else {
                        ml = parent.getChild(0.08, i);
                    }

                    let score = 0;
                    for (let run=0; run<10; run++)
                    {
                        score += runGame(ml)/10;
                    }
                    if (bestScore < score && score != undefined)
                    { 
                        bestScore = score; 
                        bestMachine = ml;
                    }
                }

                //if (gen%100 == 0) {}
                console.log(bestScore);
                parent = bestMachine;
                bestScores.push(bestScore);

                if (bestScore > 10000 || new Date().getTime() > endTime)
                {
                    break;
                }
            }

            ml = parent;

            const maxScore = Math.max(...bestScores);
            console.log("best score: "+maxScore);


            //Print model to console
            let output = String(columnInfo) + "\n";
            for (let L=0; L<ml.layers.length; L++)
            {
                for (let n=0; n<ml.layers[L].length; n++)
                {
                    output += String(ml.layers[L][n]) + "\n";
                }
            }
            console.log(output);

        }

        const canvasElement = canvasRef.current;
        const neuralNetworkCanvasElement = neuralNetworkCanvasRef.current;
        if (firstRender || canvasElement == null || neuralNetworkCanvasElement == null) {
            setup();
            setFirstRender(false);
            return;
        }
        let updateInterval = setInterval(() => updateML(neuralNetworkCanvasElement), timeInterval);
        return () => clearInterval(updateInterval);
    }, [firstRender]);

    return (
        <div className="project-page">
            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                <h1>Snake Game Neural Network</h1>
            </div>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                <canvas 
                    ref={canvasRef}
                    id='snakeCanvas' 
                    style={{ height: '45vmin', aspectRatio: '1/1', padding: '2vmin' }}
                />
                <canvas 
                    ref={neuralNetworkCanvasRef}
                    id='snakeNeuralNetworkCanvas' 
                    style={{ height: '45vmin', aspectRatio: '1/1', padding: '2vmin' }}
                />
            </div>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'center', paddingBottom: '5vmin' }}>
                <div 
                    style={{ 
                        width: 'fit-content', 
                        height: 'fit-content', 
                        backgroundColor: 'white', 
                        color: 'black', 
                        cursor: 'pointer', 
                        padding: '1vmin' 
                    }}
                    onClick={reset}
                >
                    Reset
                </div>
            </div>

            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                <div style={{ width: '90vmin', marginBottom: '5vmin' }}>
                    <p>
                        I have always been fascinated by brains, how they think and how they learn. Thus, I have always thought a machine learning project would be fun to work on!
                        For this project I decided to go with a neural network design, and instead of using a library like tensor flow, I decided to code the entire network and training algorithms myself.
                        As can be seen above on the left, I built a very basic snake game.
                    </p>
                    
                    <p>
                        To simplify the problem for the neural network, I decided to give it only eight inputs. The first four describe the direction
                        from the head of the snake to the apple.
                        The second four inputs describe the four squares adjacent to the head of the snake. If the square is out of bounds or the snake is on the square, the input is 1. If the square is blank the input is 0.
                        As for the outputs, I decided four nodes would correspond to the cardinal directions, and the snake would take whichever direction's node had the greatest value.
                    </p>
                    
                    <p>
                        After defining the inputs, I trained a neural network model using a generational method to adjust the network's weights.
                        This worked by generating 1000 machine models and randomly varying their weights. The best machine
                        would then become the parent for the next round of training, with the next 1000 machines generated with similar weight values.
                    </p>
                    
                    <p>
                        As I mentioned above, in each round of training I would select the best machine and use it as the parent network in the following round. To do this, I had to develop a method of ranking or grading
                        each model. Originally, I gave each machine 10 points for each apple consumed and 1 point for each time step it stayed alive for. After about two seconds of training and about 100 generations, the 
                        training process began to slow down dramatically, until each training round took about a second to complete. Upon watching the best machine run, I realized the machine was simply going back and fourth or in a circle indefinitely.
                        This made me realize I needed to make staying alive a punishment rather than a reward, thus only snakes which consumed apples rapidly would have a positive score.
                        After adjusting the grading to have a -1 punishment for each time step, the network began to learn and to do what I wanted it to do.
                        The machine model that is running right now trained for about a minute and went through 1000 generations.
                    </p>
                    
                    <p>
                        As you have probably noticed by now, this machine has a tendency to die after eating about twelve apples. I trained another model with the same inputs for about an hour, and didn't see any improvement whatsoever.
                        I also experimented with changing the number of hidden columns and nodes within each hidden column, with almost no improvement.
                        Because of this, I believe the current snake machine is almost as good as it can be given its simplicity and the limited input data. 
                        In the future, I would like to give a new machine the entire board as an input and to train it until it can beat the game, but for now it's probably best that I study for finals instead.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Snake;