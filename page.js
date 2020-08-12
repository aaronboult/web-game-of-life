let leftMouseDown = false;
let rightMouseDown = false;

let touchMoved;

let previousCellUpdate = {}; // id: the id of the previous cell, which: the mousebutton identifier (from event.which)

let gridUpdateInterval;

let presets = [ // Each preset is an object containing the X and Y sizes of the grid, as well as the necessary cell values
    {
        name: "Glider",
        xSize: 9,
        ySize: 9,
        data: [
            [false, true, false],
            [false, false, true],
            [true, true, true]
        ]
    }
];

function initialize(){

    let presetHtml = "<option value=-1>None</option>";

    for (let i = 0 ; i < presets.length ; i++){

        presetHtml += `<option value=${i}>${presets[i].name}</option>`;

    }

    document.getElementById("preset-select").innerHTML = presetHtml;
    
    document.getElementById("preset-select").onchange = resetGrid;

    const axisX = document.getElementById("axis-x-size");

    const axisY = document.getElementById("axis-y-size");
    
    axisX.onchange = createUniverse;

    axisY.onchange = createUniverse;

    let tableSize = 16;

    if (window.matchMedia("screen and (max-width: 800px)").matches){ // Generate a small table for smaller screens

        tableSize = 9;

    }

    axisX.value = tableSize;

    axisY.value = tableSize;

    window.onmousedown = event => {
        
        if (event.which === 1){

            leftMouseDown = true;

        }
        else if (event.which === 3){

            rightMouseDown = true;

        }

    };

    window.onmouseup = event => {

        if (event.which === 1){

            leftMouseDown = false;

        }
        else if (event.which === 3){

            rightMouseDown = false;

        }

    };

    window.onmousemove = event => {
        
        if (leftMouseDown){

            toggleCell(event, true);

            event.preventDefault();

        }

        if (rightMouseDown){

            toggleCell(event, false);

            event.preventDefault();

        }

    };

    window.onkeydown = handleKeybind;

    document.getElementById("play").onclick = playSimulation;

    document.getElementById("stop").onclick = stopSimulation;

    document.getElementById("step").onclick = updateGrid;

    document.getElementById("reset").onclick = resetGrid;

    document.getElementById("timescale").onchange = () => {

        if (gridUpdateInterval){ // Restart the simulation on timescale change to update the interval period

            stopSimulation();
    
            playSimulation();

        }

    };

    const universeGrid = document.getElementById("universe-grid");

    universeGrid.oncontextmenu = () => {

        toggleCell(event, false);

        return false;

    }; // Use right click to clear cells

    universeGrid.ontouchmove = event => {

        touchMoved = true;

        const target = document.elementFromPoint(
            event.changedTouches[0].clientX,
            event.changedTouches[0].clientY,
        );

        if (target.classList.contains("cell")){

            toggleCell(
                {
                    target: target,
                    type: "touchmove",
                    which: 0
                }, // Pass a mimic of the event object using the correct target element
                target.getAttribute("alive") === "false"
            );
    
            event.preventDefault();

        }

    };
    
    createUniverse();

}

function createUniverse(event){

    stopSimulation();

    const [xSize, ySize] = getGridSize();

    const cellData = getCellValues();

    document.getElementById("axis-x-size-display").innerText = xSize;

    document.getElementById("axis-y-size-display").innerText = ySize;

    let gridHtml = "";

    for (let y = 0 ; y < ySize ; y++){

        gridHtml += "<tr>";

        for (let x = 0 ; x < xSize ; x++){

            let alive = false;

            if (y < cellData.length){ // If the current cell is within the bounds of the preserved data

                if (x < cellData[y].length){

                    alive = cellData[y][x];

                }

            }
            
            gridHtml += `
                <td class="cell" id="cell-${y}-${x}" alive=${alive}></td>
            `;

        }

        gridHtml += "</tr>";

    }

    document.getElementById("grid").innerHTML = gridHtml;

    for (let y = 0 ; y < ySize ; y++){

        for (let x = 0 ; x < xSize ; x++){

            const cell = document.getElementById(`cell-${y}-${x}`);

            cell.ontouchend = event => {

                if (!touchMoved){ // Ensure the first cell is not toggle again after a drag
                    
                    toggleCell(
                        event, 
                        event.target.getAttribute("alive") === "false"
                    );

                }

                touchMoved = false;

                event.preventDefault(); // Stop a click event firing

            };

            cell.onclick = event => {
                
                if (event.which === 1){

                    toggleCell(event, true);

                }

            };

        }

    }

}

function handleKeybind(event){

    switch (event.keyCode){

        case 32: // Space
            if (gridUpdateInterval){ // Toggle between play and stop
                stopSimulation();
            }
            else{
                playSimulation();
            }
            break;
        
        case 39: // Right arrow
            updateGrid();
            break;

        case 82: // R
            resetGrid();
            break;

    }

}

function playSimulation(event){

    if (gridUpdateInterval){

        clearInterval(gridUpdateInterval);

    }

    gridUpdateInterval = setInterval(
        updateGrid,
        parseInt(
            document.getElementById("timescale").value
        )
    );

    document.getElementById("play").disabled = true;

}

function stopSimulation(event){

    clearInterval(gridUpdateInterval);

    gridUpdateInterval = null;

    document.getElementById("play").disabled = false;

}

function setPreset(event){

    const presetIndex = parseInt(
        document.getElementById("preset-select").value
    );

    if (presetIndex === -1){ // -1 is the value of the "none" option

        return;

    }

    const chosenPreset = presets[presetIndex];

    const [xSize, ySize] = getGridSize();

    if (xSize < chosenPreset.xSize || ySize < chosenPreset.ySize){

        document.getElementById("axis-x-size").value = chosenPreset.xSize;
    
        document.getElementById("axis-y-size").value = chosenPreset.ySize;
    
        createUniverse();

    }

    writeCellData(
        chosenPreset.data
    );

}

function resetGrid(event){
    
    stopSimulation();

    const [xSize, ySize] = getGridSize();

    for (let x = 0 ; x < xSize ; x++){

        for (let y = 0 ; y < ySize ; y++){

            document.getElementById(`cell-${y}-${x}`).setAttribute(
                "alive", false
            );

        }

    }

    setPreset();

}

function getCellValues(){

    const cells = [];

    const [xSize, ySize] = getGridSize();

    for (let y = 0 ; y < ySize ; y++){

        cells.push([]);

        for (let x = 0 ; x < xSize ; x++){

            const cell = document.getElementById(`cell-${y}-${x}`);

            if (cell){

                cells[
                    cells.length - 1
                ].push(
                    cell.getAttribute("alive") === "true"
                );

            }

        }

    }
    
    return cells;

}

function getGridSize(){

    return [
        parseInt(
            document.getElementById("axis-x-size").value
        ),
        parseInt(
            document.getElementById("axis-y-size").value
        )
    ];

}

function toggleCell(event, value){
    
    if (event.target.classList.contains("cell")){

        if (
            event.target.id !== previousCellUpdate.id ||
            event.which !== previousCellUpdate.which ||
            event.type === "touchend"
        ){ // touchend events toggle cells so they pass regardless of previous actions

            previousCellUpdate.id = event.target.id;

            previousCellUpdate.which = event.which;

            event.target.setAttribute("alive", value);

        }

    }

}

function updateGrid(){

    let newCellData = [];

    const currentCellData = getCellValues();

    for (let y = 0 ; y < currentCellData.length ; y++){

        newCellData.push([]);

        for (let x = 0 ; x < currentCellData[y].length ; x++){

            const neighbors = getNumberOfNeighbors(x, y, currentCellData);

            if (neighbors === 3 || (currentCellData[y][x] && neighbors === 2)){ // Either the cell is alive with 2 neighbors, or it is dead or alive with 3 neighbors

                newCellData[y].push(true);

            }
            else{

                newCellData[y].push(false);

            }

        }

    }

    writeCellData(newCellData);

}

function getNumberOfNeighbors(x, y, data){

    let neighbors = 0;

    for (let yOffset = -1 ; yOffset <= 1 ; yOffset++){ // Check all 8 possible neighbors using x and y offsets from -1 to 1

        for (let xOffset = -1 ; xOffset <= 1 ; xOffset++){

            if (!(yOffset === 0 && xOffset === 0)){ // Ensure the cell itself is not included

                const yPosition = y + yOffset;
    
                if (yPosition >= 0 && yPosition < data.length){ // Check the y position is within the bounds of the grid
    
                    const xPosition = x + xOffset;
    
                    if (xPosition >= 0 && xPosition < data[yPosition].length){ // Check the x position is within the bounds of the grid
    
                        if (data[yPosition][xPosition]){
    
                            neighbors++;
    
                        }
    
                    }
    
                }

            }
    
        }

    }

    return neighbors;

}

function writeCellData(data){
    
    const [xSize, ySize] = getGridSize();

    for (let y = 0 ; y < ySize ; y++){

        if (y < data.length){

            for (let x = 0 ; x < xSize ; x++){

                if (x < data[y].length){
    
                    document.getElementById(`cell-${y}-${x}`).setAttribute(
                        "alive", data[y][x]
                    );

                }
        
            }

        }

    }

}