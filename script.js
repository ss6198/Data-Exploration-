
//  Load the CSV file
// Step 1: Load the arsenical bookbinding data from bindings.csv
// Each row contains information about a book, including its title, author, publication date, arsenical material, and owner
d3.csv("bindings.csv").then(function(data) { // Load the CSV and call its rows "data"

// Data

    // Step 2: Prepare each book record for the chart.
    data.forEach(function(d) { 

        const material = d["Arsenical Material"].toLowerCase(); // material description in lowercase.

        d.decade = Math.floor(+d.Date / 10) * 10; // Convert publication year into a decade (1856 becomes 1850)

        // Combine similar arsenical material descriptions into six categories.
        if (material.includes("bookcloth")) { // Check whether the material contains "bookcloth"
            d.material = "Bookcloth"; // Assign the Bookcloth category
        } else if (material.includes("paper cover")) { // Check for paper covers or paper coverings
            d.material = "Paper Covers"; // Assign the Paper Covers category (combine categories from original dataset)
        } else if (material === "cover") { // Check whether the description is exactly "cover"
            d.material = "Cover (unspecified)"; // Assign the unspecified cover category
        } else if (material.includes("decorative green onlay")) { // Check for decorative green onlay
            d.material = "Decorative Green Onlay"; // Assign the onlay category
        } else if (
            material.includes("textblock edge") || // Check for textblock edges
            material.includes("page edge") // Also check for page edges
        ) {
            d.material = "Textblock Edges"; // Combine both descriptions into one category
        } else {
            d.material = "Other"; // Put all remaining descriptions into "Other"
        }

    });

    console.log(data);

    // Step 3: C SVG drawing area.
    const width = 850; // chart width in pixels
    const height = 650; // chart height in pixels

    const svg = d3.select("#chart") 
        .append("svg") // Add svg drawing area
        .attr("width", width) // svg width
        .attr("height", height); // svg height


//x axis 

    // Step 4:  x-axis categories.
    const materials = [ // list the materials in their display order
        "Bookcloth",
        "Paper Covers",
        "Cover (unspecified)",
        "Decorative Green Onlay",
        "Textblock Edges",
        "Other"
    ];

    const xScale = d3.scaleBand() // create a scale for categories
        .domain(materials) // Use the material names.
        .range([100, 750]) // Position the categories between pixels 100 and 750
        .padding(0.3); //space between categories


//  y axis

    // Step 5:  publication decades
    const decades = d3.range(1800, 1900, 10); // Dont use year 1780, use from 1800 to 1900,10

    const yScale = d3.scaleBand() // scale for decades
        .domain(decades) // Use the decades from 1800 to 1890.
        .range([50, 570]) // Position decades between pixels 50 and 570
        .padding(0.3); // space between decades.


// circles

    // Step 6: Filter records from the 19th century.
    const validData = data.filter(function(d) { // Check every book record
        return d.decade >= 1800 && d.decade < 1900; // Keep dates from 1800 through 1899
    }); 

    console.log(validData); // filtering


    // Step 7: Group books by material and decade
    const groups = d3.rollups( // Group records using two categories
        validData, // Use only the filtered records.
        function(books) {
            return books; // Keep the book records in each group
        },
        function(d) {
            return d.material; // first group- material
        },
        function(d) {
            return d.decade; // other group-decade
        }
    );


    // Step 8: Turn grouped data into circles
    const circles = []; 

    groups.forEach(function(group) { // Go through  material group
        group[1].forEach(function(decadeGroup) { // Go through decade group
            circles.push({ // Add a new circle to the list.
                material: group[0], // Store  material name
                decade: decadeGroup[0], // Store publication decade
                books: decadeGroup[1], // Store all records in group
                count: decadeGroup[1].length // Count the records in the group
            });
        });
    });

    console.log(circles); // Check the circles data and record counts.


// make the circles different sizes so they correspond to the number of books that have this specific arsenical material

    // Step 9: Make circles sizes correspond to record counts
    const sizeScale = d3.scaleSqrt() 
        .domain([0, d3.max(circles, function(d) {
            return d.count; // Find the largest record count
        })])
        .range([0, 25]); // radii range: 0 to 25 pixels.


    // Step 10: Give circles/materials a different color palette.
    // first color is the background; the next three are gradient colors
    const palettes = {
        "Bookcloth": ["#594F3B", "#776258", "#896279", "#9C7CA5"],
        "Paper Covers": ["#181F1C", "#274029", "#315C2B", "#60712F"],
        "Cover (unspecified)": ["#EDADC7", "#D199B6", "#C493B0", "#A68BA5"],
        "Decorative Green Onlay": ["#E6C229", "#F17105", "#D11149", "#6610F2"],
        "Textblock Edges": ["#91C4F2", "#316D88", "#9D79BC", "#A14DA0"],
        "Other": ["#710627", "#9E1946", "#DE0D92", "#4D6CFA"]
    };


    // Step 11: Create three irregular gradients for each material
    const defs = svg.append("defs"); 

    const positions = [ // Set the center positions of the three gradients.
        ["35%", "20%"], // First gradient is near the upper-left.
        ["60%", "40%"], // Second gradient is near the right side.
        ["50%", "85%"] // Third gradient is near the bottom.
    ];

    materials.forEach(function(material, i) { // Go through each material.
        const colors = palettes[material]; // color palett

        positions.forEach(function(position, j) { // Create three gradients per material/circle
            const gradient = defs.append("radialGradient") // radial gradient
                .attr("id", "gradient-" + i + "-" + j) // Give it a unique ID.
                .attr("cx", position[0]) // horizontal center
                .attr("cy", position[1]) //  vertical center
                .attr("r", "70%"); // gradient's radius.

            gradient.append("stop") //  starting color.
                .attr("offset", "0%") // Start at the center.
                .attr("stop-color", colors[j + 1]); // Use this material's gradient color

            gradient.append("stop") // ending color
                .attr("offset", "100%") // End at the outer edge.
                .attr("stop-color", colors[j + 1]) // Use the same color
                .attr("stop-opacity", 0.1); // Fade it to transparency
        });
    });


// hover each circle so it includes information about number of books,  book title,  author, date, owner of the book


    // Step 12: Information box for the books
    const tooltip = d3.select("body") 
        .append("div") // Create  new HTML box
        .style("position", "fixed") // Keep the box fixed on the screen
        .style("right", "20px") // Position it 30 pixels from the right
        .style("top", "20px") // Position it 20 pixels from the top
        .style("background", "#FFFFFF") // white background.
        .style("border", "1px solid #3B444B") //  dark border
        .style("padding", "15px") // space inside box
        .style("width", "350px") // width 
        .style("max-width", "calc(100vw - 70px)") // Prevent it from being too wide on small screens
        .style("max-height", "70vh") // Limit its height to 70% of the screen
        .style("overflow-y", "auto") // vertical scrolling
        .style("z-index", "1000") //  box above the chart
        .style("display", "none"); // Hide box until a circle is hovered over


    // Step 13: Create a group for each circle
    // Each group contains several overlapping circles
    const circleGroups = svg.selectAll(".circle") 
        .data(circles) // add  circle data
        .join("g") 
        .attr("class", "circle") // Give each group the class "circle".
        .attr("transform", function(d) { // Position the group on the chart.
            const x = xScale(d.material) + xScale.bandwidth() / 2; // Center in  material 
            const y = yScale(d.decade) + yScale.bandwidth() / 2; // Center  in  decade
            return "translate(" + x + "," + y + ")"; // Move the group to those coordinates
        })
        .style("cursor", "pointer"); //cursor for hover


   

    // Step 15: Add three gradient layers to each circle
    for (let j = 0; j < 3; j++) { // Repeat three times

        circleGroups.append("circle") // Add another circle to each group
            .attr("r", function(d) {
                return sizeScale(d.count); // same radius as the background
            })
            .attr("fill", function(d) {
                const i = materials.indexOf(d.material); // Find the material's position in the list
                return "url(#gradient-" + i + "-" + j + ")"; // Apply matching gradient
            });

    }

    // Step 16:  chrome yellow outline around each circle.
    circleGroups.append("circle") // Add one final circle to each group.
        .attr("class", "circle-outline") 
        .attr("r", function(d) {
            return sizeScale(d.count); // Match the circle's radius
        })
        .attr("fill", "none") // Make the center transparent
        .attr("stroke", "#FFA700") // Set  outline to chrome yellow
        .attr("stroke-width", 1); // Make the outline 1 pixel thick


    // Step 17: Add  hover interaction.
    circleGroups
        .on("mouseover", function(event, d) { // hover over circle (cursor)

            d3.select(this) // Select  hovered circle 
                .select(".circle-outline") // Find its chrome yellow outline
                .attr("stroke-width", 3); // Make the outline thicker

            tooltip.style("display", "block").html(""); // Show  box and clear old content

            tooltip.append("strong") //bold heading
                .text(d.material + " — " + d.decade + "s"); // Show material and decade

            tooltip.append("p") // Add  paragraph.
                .text("Number of books: " + d.count); // Show the number of records

            const bookList = tooltip.append("ul"); // Create list for the books.

            bookList.selectAll("li") // Select the list items.
                .data(d.books) // Connect the books in this circle
                .join("li") // Create one list item per book
                .each(function(book) { // Add information to each list item

                    const item = d3.select(this); // Select the current list item

                    item.append("strong") // bold title for books
                        .text(book.Title || "Untitled"); // show title 

                    item.append("div") // Add author line 
                        .text("Author: " + (book.Author || "Unknown")); // add author name 

                    item.append("div") // Add date line
                        .text("Date: " + (book.Date || "Unknown")); // add date 

                    item.append("div") // Add  owner line
                        .text("Owner: " + (book.Owner || "Unknown")); // add owner name

                });

        })
        .on("mouseout", function(event, d) { // Run when the cursor leaves the circle

            d3.select(this) // Select circle group
                .select(".circle-outline") // Find outline
                .attr("stroke-width", 1); // Return it to its normal thickness

        });


    // Step 18: Draw the x-axis and y-axis
    svg.append("g") 
        .attr("transform", "translate(0,570)") // Move it to the bottom of the chart
        .call(d3.axisBottom(xScale)); //  material labels and tick marks

    svg.append("g") // Create group for the y-axis
        .attr("transform", "translate(100,0)") // Move it to the left side of the chart
        .call(d3.axisLeft(yScale).tickFormat(function(d) {
            return d + "s"; // Display 1850 as 1850s
        }));


// labels for x axis 

    // Step 19: Add the x-axis title
    svg.append("text") // Create text
        .attr("x", width / 2) //  horizontally
        .attr("y", 625) // Position below the x-axis
        .attr("text-anchor", "middle") // Center the text at that position
        .text("Arsenical Material"); // Set title


// labels for y axis

    // Step 20: Add the y-axis title
    svg.append("text") // Create text 
        .attr("transform", "rotate(-90)") // Rotate text vertically
        .attr("x", -height / 2) // Position  along the rotated axis -90
        .attr("y", 25) // left of chart
        .attr("text-anchor", "middle") // Center text
        .text("Publication Decade"); // Set  title

});
