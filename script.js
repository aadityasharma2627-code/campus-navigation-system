// ---------------- FLOOR DATA ----------------
const floorData = {
  1: {
    map: "map1.jpg",
    coordinates: {
      A: { x: 80, y: 520 },
      B: { x: 120, y: 480 },
      R1: { x: 520, y: 100 },
      R2: { x: 520, y: 140 },
      R3: { x: 520, y: 180 },
      R4: { x: 520, y: 240 },
      R5: { x: 520, y: 280 },
      R6: { x: 520, y: 320 },
      R7: { x: 520, y: 360 },
      R8: { x: 520, y: 400 },
      G: { x: 180, y: 520 },
      H: { x: 140, y: 580 },
      J: { x: 340, y: 300 }
    },
    graph: {
      A: { B: 5 },
      B: { A: 5, J: 15 },
      J: { B: 15, R4: 12, G: 15 },

      R1: { R2: 5 },
      R2: { R1: 5, R3: 5 },
      R3: { R2: 5, R4: 5 },
      R4: { R3: 5, R5: 5, J: 12 },
      R5: { R4: 5, R6: 5 },
      R6: { R5: 5, R7: 5 },
      R7: { R6: 5, R8: 5 },
      R8: { R7: 5 },

      G: { H: 5, J: 15 },
      H: { G: 5 }
    }
  }
};

// ---------------- INIT ----------------
let currentFloor = 1;

const startSelect = document.getElementById("start");
const endSelect = document.getElementById("end");

// ---------------- LOAD LOCATIONS ----------------
function loadLocations() {
  startSelect.innerHTML = "";
  endSelect.innerHTML = "";

  let coords = floorData[currentFloor].coordinates;

  for (let key in coords) {
    startSelect.add(new Option(key, key));
    endSelect.add(new Option(key, key));
  }
}

loadLocations();

// ---------------- FLOOR SWITCH ----------------
document.getElementById("floor").addEventListener("change", function () {
  currentFloor = this.value;
  document.getElementById("map").src = floorData[currentFloor].map;
  loadLocations();
});

// ---------------- DIJKSTRA ----------------
function dijkstra(graph, start, end) {
  let distances = {}, prev = {}, visited = new Set();

  for (let node in graph) distances[node] = Infinity;
  distances[start] = 0;

  while (true) {
    let closest = null;

    for (let node in distances) {
      if (!visited.has(node)) {
        if (closest === null || distances[node] < distances[closest]) {
          closest = node;
        }
      }
    }

    if (closest === null || closest === end) break;
    visited.add(closest);

    for (let n in graph[closest]) {
      let d = distances[closest] + graph[closest][n];
      if (d < distances[n]) {
        distances[n] = d;
        prev[n] = closest;
      }
    }
  }

  let path = [], cur = end;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }

  return { path, distance: distances[end] };
}

// ---------------- DRAW ----------------
function drawPath(path) {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const img = document.getElementById("map");

  const rect = img.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width / 650;
  const scaleY = canvas.height / 650;

  let coords = floorData[currentFloor].coordinates;

  let points = path.map(n => ({
    x: coords[n].x * scaleX,
    y: coords[n].y * scaleY
  }));

  // 🔥 DRAW + ANIMATE
  let i = 0;
  function animate() {
    if (i >= points.length - 1) return;

    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;

    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();

    // 🧭 ARROW
    let dx = points[i + 1].x - points[i].x;
    let dy = points[i + 1].y - points[i].y;
    let angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(points[i].x, points[i].y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-10, 5);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.restore();

    i++;
    requestAnimationFrame(animate);
  }

  animate();
}

// ---------------- ROUTE ----------------
function findRoute() {
  let start = startSelect.value;
  let end = endSelect.value;

  let { path, distance } = dijkstra(
    floorData[currentFloor].graph,
    start,
    end
  );

  document.getElementById("result").innerText =
    path.join(" → ") + " (" + distance + "m)";

  drawPath(path);
}

// ---------------- DARK MODE ----------------
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// ---------------- CLICK SELECT ----------------
document.getElementById("map").addEventListener("click", function (e) {
  const rect = this.getBoundingClientRect();

  let x = (e.clientX - rect.left) * (650 / rect.width);
  let y = (e.clientY - rect.top) * (650 / rect.height);

  let coords = floorData[currentFloor].coordinates;

  let closest = null, min = Infinity;

  for (let node in coords) {
    let dx = coords[node].x - x;
    let dy = coords[node].y - y;
    let d = Math.sqrt(dx * dx + dy * dy);

    if (d < min) {
      min = d;
      closest = node;
    }
  }

  if (!window.last || window.last === "end") {
    startSelect.value = closest;
    window.last = "start";
  } else {
    endSelect.value = closest;
    window.last = "end";
  }
});