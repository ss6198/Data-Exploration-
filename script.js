
//  Load the CSV file
// Step 1: Load the arsenical bookbinding data from bindings.csv.
// Each row contains information about a book, including its title, author, publication date, arsenical material, and owner.
d3.csv("bindings.csv").then(function(data) { // Load the CSV and call its rows "data".

// Data

    // Step 2: Prepare each book record for the chart.
    data.forEach(function(d) { // Go through every row in the CSV.

        const material = d["Arsenical Material"].toLowerCase(); // Get the material description in lowercase.

        d.decade = Math.floor(+d.Date / 10) * 10; // Convert the publication year into a decade (1856 becomes 1850).

        // Combine similar arsenical material descriptions into six categories.
        if (material.includes("bookcloth")) { // Check whether the material contains "bookcloth".
            d.material = "Bookcloth"; // Assign the Bookcloth category.
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
            d.material = "Textblock Edges"; // Combine both descriptions into one category.
        } else {
            d.material = "Other"; // Put all remaining descriptions into Other.
        }

    });

    console.log(data); // Check the prepared data in the browser console.


    // Step 3: Create the SVG drawing area.
    const width = 800; // Set the chart width in pixels.
    const height = 650; // Set the chart height in pixels.

    const svg = d3.select("#chart") // Select the chart div in the HTML.
        .append("svg") // Add an SVG drawing area.
        .attr("width", width) // Set the SVG width.
        .attr("height", height); // Set the SVG height.


//tell me how to add the x axis

    // Step 4: Set up the x-axis categories.
    const materials = [ // List the six materials in their display order.
        "Bookcloth",
        "Paper Covers",
        "Cover (unspecified)",
        "Decorative Green Onlay",
        "Textblock Edges",
        "Other"
    ];

    const xScale = d3.scaleBand() // Create a scale for categories.
        .domain(materials) // Use the six material names.
        .range([100, 750]) // Position the categories between pixels 100 and 750.
        .padding(0.2); // Add space between categories.


// tell me how to add the y axis

    // Step 5: Set up the publication decades.
    const decades = d3.range(1800, 1900, 10); // Dont use year 1780, use from 1800 to 1900,10

    const yScale = d3.scaleBand() // Create a scale for the decades.
        .domain(decades) // Use the decades from 1800 to 1890.
        .range([50, 570]) // Position the decades between pixels 50 and 570.
        .padding(0.2); // Add space between decades.


// tell me how to add circles

    // Step 6: Keep only records from the 19th century.
    const validData = data.filter(function(d) { // Check every book record.
        return d.decade >= 1800 && d.decade < 1900; // Keep dates from 1800 through 1899.
    }); // JUST CHANGED FROM d.decade !== null

    console.log(validData); // Check which records remain after filtering.


    // Step 7: Group books by material and decade.
    const groups = d3.rollups( // Group records using two categories.
        validData, // Use only the filtered records.
        function(books) {
            return books; // Keep the book records in each group.
        },
        function(d) {
            return d.material; // First group by material.
        },
        function(d) {
            return d.decade; // Then group by decade.
        }
    );


    // Step 8: Turn the grouped data into circles.
    const circles = []; // Create an empty list to store the circles.

    groups.forEach(function(group) { // Go through each material group.
        group[1].forEach(function(decadeGroup) { // Go through its decade groups.
            circles.push({ // Add a new circle to the list.
                material: group[0], // Store the material name.
                decade: decadeGroup[0], // Store the publication decade.
                books: decadeGroup[1], // Store all records in the group.
                count: decadeGroup[1].length // Count the records in the group.
            });
        });
    });

    console.log(circles); // Check the circles data and record counts.


// tell me how to make the circles different sizes so they correspond to the number of books that have this specific arsenical material

    // Step 9: Make circles sizes correspond to record counts.
    const sizeScale = d3.scaleSqrt() // Create a square-root scale for circle radii.
        .domain([0, d3.max(circles, function(d) {
            return d.count; // Find the largest record count.
        })])
        .range([0, 25]); // Make radii range from 0 to 25 pixels.


    // Step 10: Give each material a different color palette.
    // The first color is the background; the next three are gradient colors.
    const palettes = {
        "Bookcloth": ["#594F3B", "#776258", "#896279", "#9C7CA5"],
        "Paper Covers": ["#181F1C", "#274029", "#315C2B", "#60712F"],
        "Cover (unspecified)": ["#EDADC7", "#D199B6", "#C493B0", "#A68BA5"],
        "Decorative Green Onlay": ["#E6C229", "#F17105", "#D11149", "#6610F2"],
        "Textblock Edges": ["#91C4F2", "#316D88", "#9D79BC", "#A14DA0"],
        "Other": ["#710627", "#9E1946", "#DE0D92", "#4D6CFA"]
    };


    // Step 11: Create three irregular gradients for each material.
    const defs = svg.append("defs"); // Store reusable gradient definitions in the SVG.

    const positions = [ // Set the center positions of the three gradients.
        ["25%", "25%"], // First gradient is near the upper-left.
        ["80%", "40%"], // Second gradient is near the right side.
        ["45%", "85%"] // Third gradient is near the bottom.
    ];

    materials.forEach(function(material, i) { // Go through each material.
        const colors = palettes[material]; // Get its color palette.

        positions.forEach(function(position, j) { // Create three gradients per material.
            const gradient = defs.append("radialGradient") // Create a radial gradient.
                .attr("id", "gradient-" + i + "-" + j) // Give it a unique ID.
                .attr("cx", position[0]) // Set its horizontal center.
                .attr("cy", position[1]) // Set its vertical center.
                .attr("r", "70%"); // Set the gradient's radius.

            gradient.append("stop") // Add the starting color.
                .attr("offset", "0%") // Start at the center.
                .attr("stop-color", colors[j + 1]); // Use this material's gradient color.

            gradient.append("stop") // Add the ending color.
                .attr("offset", "100%") // End at the outer edge.
                .attr("stop-color", colors[j + 1]) // Use the same color.
                .attr("stop-opacity", 0); // Fade it to transparency.
        });
    });


// tell me how to hover each circle so it includes information about
//  number of books included within the circle
// book title
//  author
//date
//owner of the book
// tell me how to fix the text box so i can somehow see all the text

    // Step 12: Create the information box for the books.
    const tooltip = d3.select("body") // Select the webpage body.
        .append("div") // Create a new HTML box.
        .style("position", "fixed") // Keep the box fixed on the screen.
        .style("right", "20px") // Position it 20 pixels from the right.
        .style("top", "20px") // Position it 20 pixels from the top.
        .style("background", "#FFFFFF") // Give it a white background.
        .style("border", "1px solid #3B444B") // Add a dark border.
        .style("padding", "15px") // Add space inside the box.
        .style("width", "350px") // Set its normal width.
        .style("max-width", "calc(100vw - 70px)") // Prevent it from being too wide on small screens.
        .style("max-height", "70vh") // Limit its height to 70% of the screen.
        .style("overflow-y", "auto") // Allow vertical scrolling.
        .style("z-index", "1000") // Keep the box above the chart.
        .style("display", "none"); // Hide it until a circle is hovered over.


    // Step 13: Create a group for each circle
    // Each group contains several overlapping circles.
    const circleGroups = svg.selectAll(".circle") // Select the circle groups.
        .data(circles) // Connect the circle data.
        .join("g") // Create one SVG group for each circle.
        .attr("class", "circle") // Give each group the class "circle".
        .attr("transform", function(d) { // Position the group on the chart.
            const x = xScale(d.material) + xScale.bandwidth() / 2; // Center it in the material category.
            const y = yScale(d.decade) + yScale.bandwidth() / 2; // Center it in the decade.
            return "translate(" + x + "," + y + ")"; // Move the group to those coordinates.
        })
        .style("cursor", "pointer"); // Show a hand cursor on hover.


    // Step 14: Draw the background of each circle.
    circleGroups.append("circle") // Add a circle to each group.
        .attr("r", function(d) {
            return sizeScale(d.count); // Set its radius using the record count.
        })
        .attr("fill", function(d) {
            return palettes[d.material][0]; // Use the material's background color.
        });


    // Step 15: Add three gradient layers to each circle.
    for (let j = 0; j < 3; j++) { // Repeat three times.

        circleGroups.append("circle") // Add another circle to each group.
            .attr("r", function(d) {
                return sizeScale(d.count); // Give it the same radius as the background.
            })
            .attr("fill", function(d) {
                const i = materials.indexOf(d.material); // Find the material's position in the list.
                return "url(#gradient-" + i + "-" + j + ")"; // Apply its matching gradient.
            });

    }


    // Step 16: Draw the orange outline around each circle.
    circleGroups.append("circle") // Add one final circle to each group.
        .attr("class", "circle-outline") // Name it so we can select it on hover.
        .attr("r", function(d) {
            return sizeScale(d.count); // Match the circle's radius.
        })
        .attr("fill", "none") // Make the center transparent.
        .attr("stroke", "#FFA700") // Set the outline to orange.
        .attr("stroke-width", 1); // Make the outline 1 pixel thick.


    // Step 17: Add the hover interaction.
    circleGroups
        .on("mouseover", function(event, d) { // Run when the cursor enters a circle.

            d3.select(this) // Select the hovered circle group.
                .select(".circle-outline") // Find its orange outline.
                .attr("stroke-width", 3); // Make the outline thicker.

            tooltip.style("display", "block").html(""); // Show the box and clear old content.

            tooltip.append("strong") // Add a bold heading.
                .text(d.material + " — " + d.decade + "s"); // Show the material and decade.

            tooltip.append("p") // Add a paragraph.
                .text("Number of books: " + d.count); // Show the number of records.

            const bookList = tooltip.append("ul"); // Create a list for the books.

            bookList.selectAll("li") // Select the list items.
                .data(d.books) // Connect the books in this circle.
                .join("li") // Create one list item per book.
                .each(function(book) { // Add information to each list item.

                    const item = d3.select(this); // Select the current list item.

                    item.append("strong") // Add a bold title.
                        .text(book.Title || "Untitled"); // Show the title or a fallback.

                    item.append("div") // Add an author line.
                        .text("Author: " + (book.Author || "Unknown")); // Show the author.

                    item.append("div") // Add a date line.
                        .text("Date: " + (book.Date || "Unknown")); // Show the date.

                    item.append("div") // Add an owner line.
                        .text("Owner: " + (book.Owner || "Unknown")); // Show the owner.

                });

        })
        .on("mouseout", function(event, d) { // Run when the cursor leaves the circle.

            d3.select(this) // Select the circle group.
                .select(".circle-outline") // Find its outline.
                .attr("stroke-width", 1); // Return it to its normal thickness.

        });


    // Step 18: Draw the x-axis and y-axis.
    svg.append("g") // Create a group for the x-axis.
        .attr("transform", "translate(0,570)") // Move it to the bottom of the chart.
        .call(d3.axisBottom(xScale)); // Draw the material labels and tick marks.

    svg.append("g") // Create a group for the y-axis.
        .attr("transform", "translate(100,0)") // Move it to the left side of the chart.
        .call(d3.axisLeft(yScale).tickFormat(function(d) {
            return d + "s"; // Display 1850 as 1850s.
        }));


// tell me how to add the labels for x axis

    // Step 19: Add the x-axis title.
    svg.append("text") // Create a text element.
        .attr("x", width / 2) // Center it horizontally.
        .attr("y", 625) // Position it below the x-axis.
        .attr("text-anchor", "middle") // Center the text at that position.
        .text("Arsenical Material"); // Set the title.


//tell me how to add the labels for y axis

    // Step 20: Add the y-axis title.
    svg.append("text") // Create a text element.
        .attr("transform", "rotate(-90)") // Rotate the text vertically.
        .attr("x", -height / 2) // Position it along the rotated axis.
        .attr("y", 25) // Move it to the left of the chart.
        .attr("text-anchor", "middle") // Center the text.
        .text("Publication Decade"); // Set the title.

});
