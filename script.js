const width = 860;
const height = 500;
let criteria = "totalPoints";
let mapType = "worldMap";
let rankings = null;

const tooltip = d3.select("body").append("div").attr("class", "tooltip");

const colorScale = d3.scaleLinear().range(["#f7fcb9", "#31a354"]);

const laverScale = d3
  .scaleOrdinal()
  .domain(["Europe", "World"])
  .range(["#143490", "#D22C1E"]);

const europeScale = d3.scaleLinear().range(["#73c2fb", "#002366"]);

const worldScale = d3.scaleLinear().range(["#ffcbcb", "#D22C1E"]);

const svg = d3
  .select("#map")
  .append("svg")
  .attr("height", height)
  .attr("width", width)
  // .style("border", "1px solid #ccc")
  .style("border-radius", "4px");

const projection = d3.geoMercator().center([40, 40]).scale(110);

const path = d3.geoPath().projection(projection);

Promise.all([d3.json("./countries.json"), d3.csv("./rankings.csv")]).then(
  function (data) {
    const mapData = data[0];
    rankings = data[1];

    const rangeSlider = d3
      .sliderBottom()
      .min(d3.min(rankings, (rank) => +rank.Age))
      .max(d3.max(rankings, (rank) => +rank.Age))
      .width(400)
      .tickFormat(d3.format("d"))
      .default([
        d3.min(rankings, (rank) => +rank.Age),
        d3.max(rankings, (rank) => +rank.Age),
      ])
      .step(1)
      .fill("#2196f3");

    d3.select("#range-slider")
      .append("svg")
      .attr("width", 500)
      .attr("height", 100)
      .append("g")
      .attr("transform", "translate(30,30)")
      .call(rangeSlider);

    updateMap(mapData, rankings);

    d3.selectAll("input[name='criteria']").on("change", function () {
      criteria = this.value;

      svg.selectAll("*").remove();

      updateMap(mapData, rankings, mapType);
    });

    d3.selectAll("input[name='mapType']").on("change", function () {
      mapType = this.value;

      svg.selectAll("*").remove();

      updateMap(mapData, rankings, mapType);
    });

    rangeSlider.on("onchange", (val) => {
      d3.select("input[name='mapType']").property("checked", false);
      let filteredRankings = rankings.filter(
        (rank) => +rank.Age >= val[0] && +rank.Age <= val[1]
      );

      svg.selectAll("*").remove();

      updateMap(mapData, filteredRankings, mapType);
    });
  }
);

function updateMap(countryData, rankings, mapType) {
  const countries = [...new Set(rankings.map((rank) => rank.Country))];

  let minValue = d3.min(countries, (country) =>
    rankings
      .filter((rank) => rank.Country === country)
      .reduce((acc, curr) => acc + +curr.Points, 0)
  );
  let minTotalPlayers = d3.min(
    countries,
    (country) => rankings.filter((rank) => rank.Country === country).length
  );

  let maxValue = d3.max(countries, (country) =>
    rankings
      .filter((rank) => rank.Country === country)
      .reduce((acc, curr) => acc + +curr.Points, 0)
  );
  let maxTotalPlayers = d3.max(
    countries,
    (country) => rankings.filter((rank) => rank.Country === country).length
  );

  const colorScale = d3
    .scaleLinear()
    .domain(
      criteria === "totalPoints"
        ? [minValue, maxValue]
        : [minTotalPlayers, maxTotalPlayers]
    )
    .range(["#f7fcb9", "#31a354"]);

  worldScale.domain(
    criteria === "totalPoints"
      ? [minValue, maxValue]
      : [minTotalPlayers, maxTotalPlayers]
  );

  europeScale.domain(
    criteria === "totalPoints"
      ? [minValue, maxValue]
      : [minTotalPlayers, maxTotalPlayers]
  );

  svg
    .append("g")
    .attr("class", "countries")
    .selectAll("path")
    .data(countryData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("stroke", "#fff")
    .attr("fill", (d) => {
      let players = rankings.filter(
        (rank) => rank.Country === d.properties.ISO_A3
      );

      if (mapType === "laverCup") {
        let playersInCountry = rankings.filter(
          (rank) => rank.Country === d.properties.ISO_A3
        );

        if (playersInCountry.length > 0) {
          let scaleValue =
            criteria === "totalPoints"
              ? playersInCountry.reduce((prev, curr) => prev + +curr.Points, 0)
              : playersInCountry.length;
          return playersInCountry[0]["Laver Cup Team"] === "Europe"
            ? europeScale(scaleValue)
            : worldScale(scaleValue);
        }

        return "#ccc";
      }

      if (players.length > 0) {
        let filterValue =
          criteria === "totalPoints"
            ? players.reduce((prev, curr) => prev + +curr.Points, 0)
            : players.length;
        return colorScale(filterValue);
      }

      return "#ccc";
    })
    .style("cursor", "pointer")
    .on("mousemove", onMouseMove)
    .on("mouseout", onMouseLeave)
    .on("click", onMouseClick);

  function onMouseMove(event, d) {
    d3.select(this).attr("fill", "cornflowerblue");

    tooltip.transition().duration(200).style("opacity", 1);

    let players = rankings.filter(
      (rank) => rank.Country === d.properties.ISO_A3
    );

    if (players.length > 0) {
      let totalPoints = players.reduce((prev, curr) => prev + +curr.Points, 0);

      tooltip
        .html(
          `<p>Country:  <span>${d.properties.ADMIN}</span></p>
            <p>Total Points:  <span>${totalPoints}</span></p>
            <p>Total Players:  <span>${players.length}</span></p>
            <p>Average age:  <span>${d3.format(".2f")(
              d3.mean(players, (player) => player.Age)
            )} years </span></p>

            ${players
              .slice(0, 5)
              .map((player) => {
                return `<p>${player.Name} (#${player.Rank}) - ${player.Points} points</p>`;
              })
              .join("")}
            `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    } else {
      tooltip
        .html(
          `<p>Country:  <span>${d.properties.ADMIN}</span></p>
            <p>Total Points:  <span>N/A</span></p>
            <p>Total Players:  <span>N/A</span></p>
            <p>Average age:  <span>N/A</span></p>
            `
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    }
  }

  function onMouseLeave() {
    d3.select(this).attr("fill", (d) => {
      let players = rankings.filter(
        (rank) => rank.Country === d.properties.ISO_A3
      );

      if (mapType === "laverCup") {
        let playersInCountry = rankings.filter(
          (rank) => rank.Country === d.properties.ISO_A3
        );

        if (playersInCountry.length > 0) {
          let scaleValue =
            criteria === "totalPoints"
              ? playersInCountry.reduce((prev, curr) => prev + +curr.Points, 0)
              : playersInCountry.length;
          return playersInCountry[0]["Laver Cup Team"] === "Europe"
            ? europeScale(scaleValue)
            : worldScale(scaleValue);
        }

        return "#ccc";
      }

      if (players.length > 0) {
        let filterValue =
          criteria === "totalPoints"
            ? players.reduce((prev, curr) => prev + +curr.Points, 0)
            : players.length;
        return colorScale(filterValue);
      }

      return "#ccc";
    });
    tooltip.transition().duration(200).style("opacity", 0);
  }

  function onMouseClick(e, d) {
    let clickedCountryPlayers = rankings.filter(
      (rank) => rank.Country === d.properties.ISO_A3
    );

    if (clickedCountryPlayers.length > 0) {
      d3.select("#table").selectAll("tr").remove();
      d3.select("table").style("visibility", "visible");
      d3.select("#table")
        .selectAll("tr")
        .data(clickedCountryPlayers)
        .enter()
        .append("tr")
        .html((d) => {
          return `<td>${d.Rank}</td><td>${d.Name}</td><td>${d.Country}</td><td>${d.Points}</td>`;
        });
    }
  }
}
