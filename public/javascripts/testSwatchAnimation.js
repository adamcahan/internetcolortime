/************************************************************************************************* 
 * TESTSWATCHANIMATION.JS
 * TEST FILE FOR WORKING ON ANIMATION. DO NOT USE IN 'PRODUCTION'
 * displayColorOfTheDay.js
 * THIS FILE MUST BE IN public/javascripts
 * Generate rounded shapeangles - 'swatches'
 * Use 'swatches' to represent discrete chunks of time with color
 * A 'SwatchSpace' contains a group of Swatches and information about itself
 * For example, a SwatchSpace of 60 swatches can represent one minute with 15 '4-second' Swatches
 * This files contains classes and functions for creating and rendering SwatchSpaces and Swatches
 *
 * IMPORTANT 8/8/14:
 * This class also currently handles Canvas rendering and 
 * websockets for internetcolortime. All the action happens here
 ************************************************************************************************/

//Text for testing activeSwatch
var drawText = function (point, text){
    return new PointText({
      point: point,
           justification: 'center',
           fontSize: 30,
           fillColor: 'pink'
    });
}

//Circle for testing ActiveSwatch
var drawCircle = function (center){
    return new Path.Circle({
      center: center,
      radius: 40,
      fillColor: 'pink'
    });
}


/********************************Main Application*************************/

//Properties of the coordinate space we are displaying our swatches in
/*Set Canvas width and height - eventually these should be derived from CSS container of canvas*/
var canWidth = 1000;
var canHeight = 500;
view.viewSize.width = canWidth;
view.viewSize.height = canHeight;

var cools = SwatchSpace(canWidth, canHeight, 5,3);
var cpArr = cools.centerPoints;
var activeSwatch = cools.activeSwatch;//easier typing


//myCircle = drawCircle(cools.centerPoints[0]);


/*** Websocket Stuff And Animation/drawing Swatches  ***/

//CHANGE TO YOUR SETTINGS. Currently set for Heroku deployment
var socket = io.connect(window.location.hostname);

//confirm connection
socket.on('test', function(data){
  console.log("websocket test message: ", data);
});

//when new colorstamp received draw swatch to represent it
socket.on('colorstamp', function(colorstamp){
  
  //Draw a swatch
  var swatchColor = colorstamp.modeColors[0];//for now ignore ties...
  cools.drawSwatchesForever(swatchColor, createSmallSwatch);
  view.update();//needed to re-render canvas correctly on draw

  /*** test/debug ***/
  //iterate thru colorswatch obj. a lot of console messages. Note client receives LOTS more data than we currently use...
  console.log('Received colorstamp! start: '+colorstamp.start+ ' end: '+colorstamp.end);
  colorstamp.modeColors.forEach(function(color){console.log("Top color is: ",color)});
  console.log('Count of top color is: ',colorstamp.modeCount);

  var allColors = colorstamp.allColors;
  var colorKeys = Object.keys(allColors);

  console.log('Additional colors.....');
  for(var i = 0; i< colorKeys.length; i++){
    var color = colorKeys[i];
    console.log(color +' -- ' +allColors[color]);
  }
});//close socket.on('colorstamp'

//when new colorstamp received draw swatch to represent it
socket.on('colorstamp', function(colorstamp){
  
  //Draw a swatch
  var swatchColor = colorstamp.modeColors[0];//for now ignore ties...
  cools.drawSwatchesForever(swatchColor, createSmallSwatch);
  view.update();//needed to re-render canvas correctly on draw

  /*** test/debug ***/
  //iterate thru colorswatch obj. a lot of console messages. Note client receives LOTS more data than we currently use...
  console.log('Received colorstamp! start: '+colorstamp.start+ ' end: '+colorstamp.end);
  colorstamp.modeColors.forEach(function(color){console.log("Top color is: ",color)});
  console.log('Count of top color is: ',colorstamp.modeCount);

  var allColors = colorstamp.allColors;
  var colorKeys = Object.keys(allColors);

  console.log('Additional colors.....');
  for(var i = 0; i< colorKeys.length; i++){
    var color = colorKeys[i];
    console.log(color +' -- ' +allColors[color]);
  }
});//close socket.on('colorstamp'
//TEST COLORS FOR WORKING W/PAPER.JS ONLY
var testColors = ['black','white','black','red','green','blue','orange','yellow','green','black','white','purple','pink','brown','blue'];

for(var i = 0; i< testColors.length; i++){
  cools.drawSwatchesForever(testColors[i], createSmallSwatch);
  view.update();//needed to re-render canvas correctly on draw
}

/*Paper.js animation*/

var ani = cools.swatches[4]; 
endpoints = [];

for(var i = 0; i< cools.swatches.length;i++){
  endpoints.push(Point.random() * view.size);
}
var destination = Point.random() * view.size;
function onFrame(){
  //ani.alpha += 1;
  for(var i = 0; i<cools.swatches.length;i++){
    ani = cools.swatches[i];
    var vector = endpoints[i] - ani.position;
    ani.position += vector /30;
    ani.content = Math.round(vector.length);
    if(vector.length < 5){
      endpoints[i] = Point.random() * view.size;
    }
  }
}

/*************************************************************************************************************************
 * Function: SwatchSpace
 * 
 * Constructor Function Arguments:
 *   pixelWidth -- width of SwatchSpace in pixels
 *   pixeHeight -- height of SwatchSpace in pixels
 *   xSpace -- Number of columns (x coordinates) SwatchSpace is divided into
 *   ySpace -- Number of rows (y coordinates) SwatchSpace is divided into
 *
 * Returns: SwatchSpace object
 *
 * This function essentially defines the SwatchSpace class. Used to create SwatchSpace object.
 * SwatchSpace is the primary tool for creating and handling Swatches and interacting with the canvas in internetcolortime
 ************************************************************************************************************************/
function SwatchSpace(pixelWidth, pixelHeight, xSpace, ySpace){

  var ss = {
    //vars
    width: pixelWidth,
    height: pixelHeight,
    xSpace: xSpace,
    ySpace: ySpace,
    totalSwatches: 0,//set w/setSwatchSize init func
    swatchSize: null,//Will be replaced w/paper.js Size obj on init
    firstPoint: null,//will be replaced w/paper.js Point obj on init
    swatchFull: false,//true if all gridpoints in swatch are 'filled', i.e. rendered

    paperLayers: [],
    swatches: [], 
    activeSwatch_pointer: 0, //pointer for swatches[]. Wraps around to limit max # of swatches. 
    centerPoints:  [],
    cp_pointer: 0,//pointer for centerPoints arr to track most recently created swatch
    activeSwatch: null, //hold Paper obj of most recently created or 'active' swatch. cp_pointer points to centerpoint for this swatch. Prob should consolidate data structures
    

    setSwatchSize: function(){ //Also sets totalSwatches val
                     this.swatchSize = new Size(this.width/this.xSpace, this.height/this.ySpace);
    },

    
    //Must be run after setSwatchSize. SwatchSpace uses 'top left' coordinate as start point for drawing swatches
    setTopLeftPoint: function(){
                       this.firstPoint = new Point(view.center.x/(this.xSpace),view.center.y/(this.ySpace));
                     },

    setTotalSwatches: function(){
                     this.totalSwatches = this.xSpace*this.ySpace;
                      },


    testSwatchSize: function(){//test func
                      console.log('testing swatch size...');
                      var x = this.width/this.xSpace;
                      console.log('x is ',x);
                          y = this.height/this.ySpace;
                      this.swatchSize = x ;
                    },


    //Generate center point for each swatch grid point
    generateCenterPoints:  function(){
      var daPoint = this.firstPoint.clone();//counter point, sort of..

      //Loop thru all grid points and generate center points
      for(var y = 0; y < this.ySpace;y++){
        for(var x = 0; x < this.xSpace;x++){
          this.centerPoints.push(daPoint.clone());//copies Point adds to arr
          daPoint.x += this.swatchSize.width;//gives us x-pos of centerpoint for this grid square    
        }
        daPoint.y += this.swatchSize.height;//same as above, but for y
        daPoint.x = this.firstPoint.x;//reset for the next round of looping...
      }
    },

    //Initialization function.Must be run before using a SwatchSpace
    init: function(){
            this.setSwatchSize();//Must run before setTopLeftPoint()
            this.setTopLeftPoint();
            this.setTotalSwatches();
            this.generateCenterPoints();
          },

    //Applies a swatch-rendering function of choice to draw Swatch at a given point
    /* Func: drawSwatch
     * Args: Point, Size, Color, Function
     * Notes: renderFunc arg must return a Paper.js Object (should be a Swatch). renderFunc does the actual rendering on screen.
     */
    drawSwatch:  function(centerPoint, size, color, renderFunc){
       renderedSwatch = renderFunc(centerPoint, size, color);
       this.swatches[this.activeSwatch_pointer] = renderedSwatch;
       this.activeSwatch_pointer += 1 % (this.totalSwatches);//total # of swatches. Array 'wraps' back around, ring-buffer-like.
       return renderedSwatch
       
    },

    //Move activeSwatch_pointer to next position. Essentially using swatches[] like a ring buffer
    moveAcSwatchPointer: function(){
       this.activeSwatch_pointer += 1 % (this.xSpace*this.ySpace);//total # of swatches. Array 'wraps' back around, ring-buffer-like.
    },
                         
                             

    //Draw swatch @ centerpoint[cp_pointer] - used to fill swatchspaces in an order..
    //Checks pointer position and will not draw once array size is reached
    //Returns true on successful draw and false on max reached
    drawNextSwatch:  function(color, renderFunc){
      if(this.cp_pointer < this.centerPoints.length){
        this.drawSwatch(this.centerPoints[this.cp_pointer],this.swatchSize,color,renderFunc);
        this.cp_pointer +=1;
        console.log('drawing gridPos ',this.cp_pointer);
        return true;
      }
      else{
        this.swatchFull = true;
        return false;
      }
    },


    //Like drawNextSwatch but 'loops' - draws over from initial pos once swatchspace is full
    //Return statement is an anachronism BUT allows this to be interchanged w/drawNextSwatch easily
    //....a hacked-up function....
    drawSwatchesForever:  function(color, renderFunc){
      if(this.cp_pointer < this.centerPoints.length){
        this.activeSwatch = this.drawSwatch(this.centerPoints[this.cp_pointer],this.swatchSize,color,renderFunc);
        console.log('***ACTIVESWATCH GROUPID: '+this.activeSwatch.id+' FILLCOLOR: '+this.activeSwatch.fillColor);
        this.cp_pointer +=1;
        console.log('drawing gridPos ',this.cp_pointer);
        return true;
      }
      //reset and draw from the top
      else{
        this.cp_pointer = 0;
        return true;
      }
    }
  }//close SwatchSpace obj 

  //Do the pseudo-classical constructor-type stuff....
  ss.init();

  return ss;
}//end SwatchSpace func



/* Function: createSwatch
 *
 * Create a color swatch. 
 * Args: center point of swatch (Paper.js Point obj), size (Paper.js Size obj), color (can be Paper.js color)
 * Returns: Paper.js Group which can be used to manipulate the swatch
 */
function createSwatch(centerPoint, theSize, color){

    console.log('running createswatch2');
    var borderColor = 'white';//color of the swatch border

    //Create outer shape
    var shape = new Rectangle([0, 0], theSize);
    var cornerSize = new Size(80,80);
    var path = new Path.Rectangle(shape, cornerSize);

    //Create inner shape to get a nice swatch with a double stroke. Inner shape proportionate to outer shape
    var innerShape = shape.clone();
    var shapeOffSet = 60;
    innerShape.width -= shapeOffSet;
    innerShape.height -= shapeOffSet; 
    var innerCornerSize = cornerSize - 25;//The #25 determined by trial&error
    innerShape.center = shape.center;
    var innerShapePath = new Path.Rectangle(innerShape, innerCornerSize);
    innerShapePath.strokeColor = borderColor;
    innerShapePath.strokeWidth = 40;//strokeWidth also determined by trial&error

    //Create a group for our Swatch and apply position & color
    mySwatch = new Group([path, innerShapePath]);
    mySwatch.position = centerPoint;
    mySwatch.fillColor = color;

    //Return the Group so it can be used
    return mySwatch;
}

/* Function: CreateSmallSwatch
 *
 * Another swatch creation function - renders better for smaller sizes
 * 8/8/14 -- args and return same as createSwatch()
 */
function createSmallSwatch(centerPoint, theSize, color){

    var borderColor = 'white';//color of the swatch border

    //Create outer shape
    var shape = new Rectangle([0, 0], theSize);
    var cornerSize = new Size(10,10);
    var path = new Path.Rectangle(shape, cornerSize);

    //Create inner shape to get a nice swatch with a double stroke. Inner shape proportionate to outer shape
    var innerShape = shape.clone();
    var shapeOffSet = 6;
    innerShape.width -= shapeOffSet;
    innerShape.height -= shapeOffSet; 
    var innerCornerSize = 9;//this val determined by trial&error
    innerShape.center = shape.center;
    var innerShapePath = new Path.Rectangle(innerShape, innerCornerSize);
    innerShapePath.strokeColor = borderColor;
    innerShapePath.strokeWidth = 4;//strokeWidth also determined by trial&error

    //Create a group for our Swatch and apply position & color
    mySwatch = new Group([path, innerShapePath]);
    mySwatch.position = centerPoint;
    mySwatch.fillColor = color;

    //Return the Group so it can be used
    return mySwatch;
}


