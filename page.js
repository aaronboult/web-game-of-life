let cursorDown = false;
let gridRefresher;

$(function(){
    
    $("#WidthInput").val(24);

    $("#HeightInput").val(24);

    window.onresize = ResizeGrid

    $("#WidthInput").on("change", GenerateGrid);
    
    $("#HeightInput").on("change", GenerateGrid);

    $("#BeginButton").click(function(){

        gridRefresher = setInterval(RefreshGrid, 1000);

        $(this).prop("disabled", true);

    });

    $("#NextButton").click(function(){

        RefreshGrid();
        
        if (gridRefresher){

            clearInterval(gridRefresher);

            gridRefresher = setInterval(RefreshGrid, 1000);

        }

    });

    $("#StopButton").click(function(){
        
        TryClearRefresher();

        $("#BeginButton").prop("disabled", false);

    });

    $("#ResetButton").click(function(){
        
        TryClearRefresher();

        GenerateGrid();

        $("#BeginButton").prop("disabled", false);

    });

    $("#GridPresets").on("change", function(){

        $("#ResetButton").click();

        switch($(this).val()){

            case "0":
                DrawPreset([
                    [1, 0],
                    [2, 1],
                    [0, 2],
                    [1, 2],
                    [2, 2]
                ]);
                break;
            case "1":
                DrawPreset([
                    [3, 1], // Line (3 coordinates on the line)
                    [4, 1],
                    [5, 1],

                    [1, 3], // Line (3 coordinates on the line)
                    [1, 4],
                    [1, 5],

                    [3, 7], // Line (3 coordinates on the line)
                    [4, 7],
                    [5, 7],

                    [7, 3], // Line (3 coordinates on the line)
                    [7, 4],
                    [7, 5],
                ]);
                break;

        }

    })

    GenerateGrid();

    $("#GridContainer").mousedown((e) => { cursorDown = true; e.target.focus() });

    window.onmouseup = () => cursorDown = false;

    window.ondrag = (e) => e.preventDefault();

});

/**
 * Select a given predetermined set of cells on the grid
 * @param {number[][]} coordinates The cells to select for the preset
 */
function DrawPreset(coordinates){

    for (let i = 0 ; i < coordinates.length ; i++){

        $(`#Cell-${coordinates[i][1]}-${coordinates[i][0]}`).click();

    }

}

/**
 * Update the grid to show the next generation of cells
 */
function RefreshGrid(){
    
    grid = [];
            
    let width = GetDimension("Width");

    let height = GetDimension("Height");

    if (!(width >= 10 && width <= 32) || !(height >= 10 && height <= 32)){

        $("#WidthInput").val(10);

        $("#HeightInput").val(10);

        return GenerateGrid();

    }

    for (let y = 0 ; y < height ; y++){

        grid.push([]);

        for (let x = 0 ; x < width ; x++){

            grid[y].push($(`#Cell-${y}-${x}`).attr("cellchecked") === "true");
    
        }   

    }

    let neighbors;
    
    for (let y = 0 ; y < height ; y++){

        for (let x = 0 ; x < width ; x++){

            neighbors = GetNumberOfLiveNeighbors(x, y, grid);

            if (neighbors === 3 || (neighbors === 2 && grid[y][x])){

                $(`#Cell-${y}-${x}`).attr("cellchecked", "true");

                $(`#Cell-${y}-${x}`).addClass("CellChecked")

            }
            else{

                $(`#Cell-${y}-${x}`).attr("cellchecked", "false");

                $(`#Cell-${y}-${x}`).removeClass("CellChecked")

            }

        }

    }

}

/**
 * 
 * @param {number} x The x coordinate of the current cell
 * @param {number} y The y coordinate of the current cell
 * @param {boolean[][]} grid The grid of cells
 */
function GetNumberOfLiveNeighbors(x, y, grid){

    let neighbors = 0;

    for (let yOffset = -1 ; yOffset < 2 ; yOffset++){
        
        for (let xOffset = -1 ; xOffset < 2 ; xOffset++){
    
            if (!(yOffset === 0 && xOffset === 0)){

                if (CheckIndexBounds(y + yOffset, grid.length) && CheckIndexBounds(x + xOffset, grid[0].length)){

                    if (grid[y + yOffset][x + xOffset]){
                        
                        neighbors++;

                    }

                }

            }

        }

    }

    return neighbors;

}

/**
 * Check whether the given index lies within a valid range
 * @param {number} index The current index
 * @param {number} max The highest value the given index can be
 */
function CheckIndexBounds(index, max){

    return index >= 0 && index < max;

}

/**
 * Clear the interval set to constantly evolve the simulation
 */
function TryClearRefresher(){

    if (gridRefresher){

        clearInterval(gridRefresher);

        gridRefresher = null;

    }
    
}

/**
 * Get the length, in cells, of the given dimension
 * @param {string} dimension Either 'Width' or 'Height'
 */
function GetDimension(dimension){
            
    let value = parseInt($(`#${dimension}Input`).val());

    if (isNaN(value)){

        value = 10;

        $(`#${dimension}Input`).val(10);

    }

    return value;

}

/**
 * Create and inject the grid of given width and height onto the DOM
 */
function GenerateGrid(){

    TryClearRefresher();
            
    let width = GetDimension("Width");

    let height = GetDimension("Height");

    if (!(width >= 10 && width <= 32) || !(height >= 10 && height <= 32)){

        $("#WidthInput").val(10);

        $("#HeightInput").val(10);

        return GenerateGrid();

    }

    $("#GridContainer").html("");

    for (let y = 0 ; y < height ; y++){

        $("#GridContainer").append(`<div id='Row-${y}' class='Row'></div>`);
    
        for (let x = 0 ; x < width ; x++){
    
            $(`#Row-${y}`).append(`<div class='Cell' id='Cell-${y}-${x}'></div>`);

        }
            
    }

    ResizeGrid()

    $(".Cell").each(function(){

        $(this).mouseenter(function(){
            
            if (cursorDown){

                $(this).attr("entered", "false");
                
                $(this).click();

            }
            else{

                $(this).attr("entered", "true");

            }

        });

        $(this).mouseleave(function(){

            if ($(this).attr("entered") === "true" && cursorDown){

                $(this).click();

            }

            $(this).attr("entered", "false");

        });

        $(this).click(function(){
            
            $(this).toggleClass("CellChecked");

            $(this).attr("cellChecked", !$(this).attr("cellChecked") || $(this).attr("cellChecked") === "false");

        });

    });

}

/**
 * Change the height and width of each cell depending on the size of the page
 */
function ResizeGrid(){
            
    let width = GetDimension("Width");

    let height = GetDimension("Height");

    if (!(width >= 10 && width <= 32) || !(height >= 10 && height <= 32)){

        $("#WidthInput").val(10);

        $("#HeightInput").val(10);

        return GenerateGrid();

    }

    let cellWidth;

    let cellHeight;
            
    $("#GridContainer").css("height", "");
    
    if ($("#GridContainer").width() < $("#GridContainer").height()){

        cellWidth = $("#GridContainer").width() / width;
    
        cellHeight = $("#GridContainer").width() / height;
        
        if (window.matchMedia("screen and (max-width: 735px)").matches){
            
            $("#GridContainer").css("height", $("#GridContainer").width().toString() + "px");
    
        }

    }
    else{

        cellWidth = $("#GridContainer").height() / width;
    
        cellHeight = $("#GridContainer").height() / height;

    }

    for (let y = 0 ; y < height ; y++){

        $(`#Row-${y}`).css("height", `${cellHeight - 2}px`)
    
        for (let x = 0 ; x < width ; x++){

            $(`#Cell-${y}-${x}`).css("width", `${cellWidth - 2}px`)

            $(`#Cell-${y}-${x}`).css("height", `${cellHeight - 2}px`)

        }
            
    }

}