window.onload = function () {
  const county_geomap_api =
    "https://hexschool.github.io/tw_revenue/taiwan-geomap.json";
  const county_revenue_api =
    "https://hexschool.github.io/tw_revenue/tw_revenue.json";

  const getMap = async () => {
    const result = await fetch(county_geomap_api).then((res) => res.json());
    return result;
  };

  const getRevenue = async () => {
    const result = await fetch(county_revenue_api).then((res) => res.json());
    return result;
  };

  const combineData = (map, revenue) => {
    const { data } = revenue[0];
    for (let vo of map) {
      const { COUNTYNAME } = vo.properties;
      const target = data.find((ele) => ele.city === COUNTYNAME);
      // console.log("target", target)
      if (target) {
        vo.revenue = toNumber(target.revenue);
      }
    }
  };

  const toNumber = (str) => {
    return parseFloat(str.replace(/,/g, ""));
  };

  // 設定 svg 的寬高
  const map = d3.select(".map").attr("width", 600).attr("height", 500);

  const projection = d3.geoMercator().center([123, 24]).scale(5500);

  // 將投影資料轉換為路徑
  const path = d3.geoPath(projection);

  const toolTip = d3
    .select(".map")
    .append("text")
    .attr("class", "tip")
    .attr("font-size", "20px")
    .attr("fill", "#f3dc71")
    .attr("x", "400")
    .attr("y", "350");

  const draw = () => {
    Promise.all([getMap(), getRevenue()]).then(([mapData, revenue]) => {
      let renderData = topojson.feature(
        mapData,
        mapData.objects["COUNTY_MOI_1090820"]
      ).features;
      combineData(renderData, revenue);
      const revenueData = revenue[0].data;
      //顏色範圍
      const colorScale = d3
        .scaleLinear()
        .domain([
          d3.min(revenueData, (d) => toNumber(d.revenue)),
          d3.max(revenueData, (d) => toNumber(d.revenue)),
        ])
        .range([
          "#bcafb0", // <= the lightest shade we want
          "#ec595c", // <= the darkest shade we want
        ]);

      // 繪製地圖
      map
        .selectAll("path")
        .data(renderData)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("stroke", "#3f2ab2")
        .attr("stroke-width", "0.7")
        .attr("fill", (d) => colorScale(d.revenue) || "#d6d6d6")
        .on("mouseover", function (d) {
          const target = d3.select(this).data()[0];
          const rev = target.revenue ?? 0;
          toolTip
            .style("visibility", "visible")
            .text(`${target.properties.COUNTYNAME},${rev}`);
        })
        .on("mouseleave", function () {
          toolTip.style("visibility", "hidden");
        });
    });
  };

  draw();
};
