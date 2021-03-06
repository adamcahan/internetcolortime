/************************************************************************************************* 
 SwatchSpace.js
  9-28-14
 adam.cahan@gmail.com
 Functions for creating and managing Swatches, SwatchSpaces, etc
 ************************************************************************************************/

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
    swatchSize: null,//Will be replaced w/paper.js Size obj on init
    firstPoint: null,//will be replaced w/paper.js Point obj on init
    swatchFull: false,//true if all gridpoints in swatch are 'filled', i.e. rendered

    paperLayers: [],
    swatches: [], //Not used as of 9-26
    centerPoints:  [],
    activeSwatch: null, //hold Paper obj of most recently created or 'active' swatch. cp_pointer points to centerpoint for this swatch. Prob should consolidate data structures
    cp_pointer: 0,//pointer for centerPoints arr to track most recently created swatch
    

    setSwatchSize: function(){
                     this.swatchSize = new Size(this.width/this.xSpace, this.height/this.ySpace);
    },

    
    //Must be run after setSwatchSize. SwatchSpace uses 'top left' coordinate as start point for drawing swatches
    setTopLeftPoint: function(){
                       this.firstPoint = new Point(view.center.x/(this.xSpace),view.center.y/(this.ySpace));
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


    //Applies a swatch-rendering function of choice to draw Swatch at a given point
    /* Func: drawSwatch
     * Args: Point, Size, Color, Function
     * Notes: renderFunc arg must return a Paper.js Object (should be a Swatch). renderFunc does the actual rendering on screen.
     */
    drawSwatch:  function(centerPoint, size, color, renderFunc){
       renderedSwatch = renderFunc(centerPoint, size, color);
       return renderedSwatch
       
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
  ss.setSwatchSize();
  ss.setTopLeftPoint();
  ss.generateCenterPoints();

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

//Initializer for exporting
var create = function(){
  var c = {};
  c.SwatchSpace = SwatchSpace;
  c.createSwatch = createSwatch;
  c.createSmallSwatch = createSmallSwatch;
}

module.exports = create;
