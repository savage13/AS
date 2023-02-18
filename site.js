
function close_sidebar() {
    document.querySelector('#sidebar').style.display = 'none';
    document.querySelector('#fakesidebar').style.display = 'block';
}
function open_sidebar() {
    document.querySelector('#sidebar').style.display = 'block';
    document.querySelector('#fakesidebar').style.display = 'none';
}

function to_objmap( btb ) {
    return {
        searchGroups : [],
        OBJMAP_SV_VERSION : 3,
        searchExcludeSets : [],
        drawData: {
            features: [ btb ]
        }
    }
}

function doit( file ) {
    var x = btbs.find(b => b.properties.file == file);
    x = to_objmap( x );
    downloadObjectAsJson(x, file);
    return false;
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    if(!(exportName.endsWith(".json"))) {
        exportName = exportName + ".json";
    }
    downloadAnchorNode.setAttribute("download", exportName);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function $(x) {
    return document.querySelector(x);
}


async function get_file( name ) {
    return fetch(name)
        .then(res  => res.json())
        .then(data => data);
}

function table() {
    let t = document.createElement('div');
    t.classList.add('table');
    return t;
}

function col( html ) {
    var col = document.createElement('div');
    col.classList.add('col');
    col.innerHTML = html;
    return col;
}

function rowc(data, col_class) {
    let r = document.createElement('div');
    r.classList.add('row');
    data.forEach(c => {
        if(typeof c === "object") {
            let x = col(c.text);
            if(col_class !== "") {
                x.classList.add(col_class);
            }
            x.setAttribute('title', c.title);
            r.appendChild( x );
        } else {
            let x2 = col(c);
            if(col_class !== "") {
                x2.classList.add(col_class);
            }
            r.appendChild( x2 );
        }
    });
    return r;
}
function row( data ) {
    return rowc(data, "");
}

function mps_to_kmph(x) {
    return x * (1/1000) * (60*60);
}
function mps_to_mph(x) {
    let ft_per_meter = 3.28084;
    let ft_per_mile = 5280;
    return x * ft_per_meter * 1/ft_per_mile * (60*60);
}
function property(b, prop) {
    return props(b)[prop];
}
function feature(b) {
    return b;//.data.drawData.features[0];
}
function props(b) {
    //return b.data.drawData.features[0].properties;
    return b.properties;
}
let sx = 600 / (6000*2);
let sy = 500 / (5000*2);

let paths = [];
let btbs = [];

function matches_search( b ) {
    let prop = props(b)
    if(search.length == 0) {
        return true;
    }
    if(prop.name.toLowerCase().includes(search)) {
        return true;
    }
    if(prop.to.toLowerCase().includes(search)) {
        return true;
    }
    if(prop.from.toLowerCase().includes(search)) {
        return true;
    }
    if(prop.enemy.toLowerCase().includes(search)) {
        return true;
    }
    if(prop.enemy_id.toLowerCase().includes(search)) {
        return true;
    }
    if(prop.urls.some(url => url.user.toLowerCase().includes(search) || url.category.toLowerCase().includes(search))) {
        return true;
    }
    return false;
}

function btb_dist(btb) {
    let feat = feature(btb);
    let prop = props(btb);
    let p = feat.geometry.coordinates[0];
    let q = feat.geometry.coordinates[1];
    let dx = p[0]-q[0];
    let dy = p[1]-q[1];
    let dist = Math.sqrt(dx*dx + dy*dy);
    return dist;
}

function populate_table() {
    let v = $("#app");
    v.innerHTML = "";
    let t = table();
    for(var i = 0; i < times.length; i++) {
        let b = times[i];
        if(! matches_search(b)) {
            continue;
        }
        var d = btb_popup([b], false);
        d.classList.add("topborder");
        d.classList.add("mb10");
        t.appendChild(d);
    }
    v.appendChild(t);
}
let times;
let shrines;
let dungeons;
let starts = {};
let ends = {};
async function init() {
    shrines = await get_file('shrines.json');
    dungeons = await get_file('Dungeon.json');
    times = await get_file("timings.json")

    //btbs = file.drawData.features;
    for(var i = 0; i < times.length; i++) {
        let feat = times[i];
        let prop = feat.properties;
        let p = feat.geometry.coordinates[0];
        let q = feat.geometry.coordinates[1];
        paths.push( [{x: p[0], y: p[2]},
                     {x: q[0], y: q[2]}]);
        if(!(feat.start in starts)) {
            starts[feat.start] = [];
        }
        if(!(feat.end in ends)) {
            ends[feat.end] = [];
        }
        starts[feat.start].push(feat);
        ends[feat.end].push(feat);
            
    }
    draw_shrines();
    populate_table();
    //draw_btbs();
}
function draw_btbs() {
    paths.forEach((p,i) => draw_btb(p[0], p[1], "red", times[i]));
}

function div() {
    return document.createElement('div');
}

function t2ms(t) {
    let m = Math.floor(t / 60.0);
    let sfull = t - m * 60.0;
    let s = Math.floor(sfull).toFixed(0).padStart(2,'0');
    let part = ((sfull - s) * 1000).toFixed(0).padStart(3,'0');
    return `${m}:${s}.${part}`;
}

function btb_popup( btbs, long) {
    let btb = btbs[0];
    //let prop = props( btb )
    let up = div();
    //let dist = btb_dist(btb);
    let dist = btb.dist;
    let speed_ms = dist / btb.t;
    let speed_kmh = mps_to_kmph(speed_ms);
    let speed_mph = mps_to_mph(speed_ms);
    let d = div();
    d.innerHTML = `<b>${btb.start} - ${btb.end}</b>`;
    up.appendChild(d);
    let rows = [
        //`<b>From:</b> ${btb.start}`,
        //`<b>To:</b>   ${btb.end}`,
    ];
    
    for(const btb of btbs.sort((a,b) => {return a.t-b.t;})) {
        let warp = "";
        if(btb.warp) {
            warp = `Warp ${btb.warp}`;
        }
        let url = `https://youtu.be/${btb.youtube_id}?t=${btb.t0}`;
        rows.push(`${t2ms(btb.t)} <a href=${url} target="_blank">video</a> ${btb.runner} ${warp}`);
    }
    
    if(long) {
        rows.push( ... [ `Distance ${btb.dist.toFixed(2)} m`,
                        // `- ${btb.t.toFixed(2)} s`,
                         //`- ${speed_ms.toFixed(2)} m/s`,
                         //`- ${speed_kmh.toFixed(2)} km/h (${speed_mph.toFixed(2)} mph)`]);
                       ]);
    } else {
        //rows.push(`<a href="#" onclick="return open_popup('${prop.name}');">Open Popup</a>`);
    }
    //rows.push( `<a href="#" onclick="return doit('${prop.file}');">json</a>` )
    let ul = document.createElement('ul');
    rows.forEach(row => {
        //let d = div();
        let d = document.createElement('li');
        d.innerHTML = row;
        //d.classList.add("pl10");
        ul.appendChild(d);
    });
    up.appendChild(ul);

    return up;
}

function open_popup( name ) {
    let marker = markers[name];
    if(marker !== undefined) {
        marker.fire('click');
        return true;
    }
    return false;
}

function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}
let xcolor = 'black';
xcolor = 'rgba(237,174,192,1)'; // Rosewater
//xcolor = 'rgba(6,204,255,1)'; // Silent Princess Blue

var markers = {};
let shrine_icon = L.icon({
    iconUrl: 'mapicon_dungeon.svg',
    iconSize: [36,36],
    iconAnchor: [18,18],
});
let shrine_dlc_icon = L.icon({
    iconUrl: 'mapicon_dungeon_dlc.svg',
    iconSize: [36,36],
    iconAnchor: [18,18],
});

function xyz2pt(v) {
    return {x: v[0], y: v[2], z: v[1] };
}

let shrine_start_group = {};
let shrine_end_group = {};
function clear_layers() {
    Object.values(shrine_start_group).forEach(group => {
        group.eachLayer(function (layer) {
            layer.remove()
        });
    });
    Object.values(shrine_end_group).forEach(group => {
        group.eachLayer(function (layer) {
            layer.remove()
        });
    });
}

function show_layer(shrine_name, group, color, paths) {
    if(shrine_name in group) {
        group[shrine_name].eachLayer(function(layer) {
            layer.addTo(map);
        });
    } else {
        let markers = [];
        let groups = {};
        for(const path of paths) {
            let key = `${path.start}-${path.end}`;
            if(!(key in groups)) {
                groups[key] = [];
            }
            groups[key].push(path);
        }
        console.log(groups);
        for(const paths of Object.values(groups)) {
            let p0 = xyz2pt(paths[0].geometry.coordinates[0]);
            let p1 = xyz2pt(paths[0].geometry.coordinates[1]);
            let m = draw_btb(p0, p1, color, paths);
            markers.push( ... m);
        }
        group[shrine_name] = L.layerGroup(markers);
    }
}

function select_shrine(ev, shrine, shrine_name) {
    // Remove all Layer from Map
    clear_layers();
    // Add paths if existing
    show_layer(shrine_name, shrine_start_group, "rgba(237,174,192)", starts[shrine_name] || []);
    show_layer(shrine_name, shrine_end_group, "#dbfcdc", ends[shrine_name] || []);
}
function draw_shrines() {
    for(const shrine of shrines) {
        if(shrine.messageid == "StartPoint") {
            continue;
        }
        const n = parseInt(shrine.messageid.slice(-3));
        let name = dungeons[shrine.messageid];
        let icon = shrine_icon;
        if(n > 119) {
            icon = shrine_dlc_icon;
        }
        name = name.replace("Shrine","").trim();
        let m = L.marker([shrine.pos[2], shrine.pos[0]], {icon: icon})
            .bindTooltip(name)
            .addTo(map)
            .on("click", (ev) => {select_shrine(ev, shrine, name)});

    }
}

function draw_btb(p1, p2, color, btbs) {
    //var prop = props(btb);
    var q1 = tr.transform(L.point(p1.x,p1.y)); // From
    var q2 = tr.transform(L.point(p2.x,p2.y)); // To
    var q3 = q1.add(q2).divideBy(2);           // Midpoint
    var line = [[q1.y, q1.x],[q2.y, q2.x]];    // Line
    var marker = L.polyline(line, {weight: 2, color: color}).addTo(map);
    let head = arrow_head(marker).addTo(map);
    let btb = btbs[0];
    marker.bindTooltip( `${btb.start} - ${btb.end}` );
    // Do not open tooltip on click, grumble
    marker._events.click.pop();
    marker.bindPopup( btb_popup( btbs, true) );
    map.almostOver.addLayer( marker );
    //markers[btb.end] = marker;
    return [marker, head];
}
function arrow_head( line ) {
    return L.polylineDecorator(line, {
        patterns: [
            {
                offset: '100%', repeat: 0, symbol:
                L.Symbol.arrowHead({pixelSize: 7.5, polygon: false,
                                    pathOptions: {weight: 2, stroke: true, color: xcolor}})}
        ]
    });
}


function handleSearch(ev) {
    search = event.target.value.toLowerCase().trim();
    populate_table();
}

let search = "";
$("#search").addEventListener('input', handleSearch);

init();

var TILE_SIZE = 256;
var MAP_SIZE = [24000, 20000];
const crs = L.Util.extend({}, L.CRS.Simple);
crs.transformation = new L.Transformation(4 / TILE_SIZE,
                                          MAP_SIZE[0] / TILE_SIZE,
                                          4 / TILE_SIZE,
                                          MAP_SIZE[1] / TILE_SIZE);
let MIN_ZOOM = 2;
let MAX_ZOOM = 7;

var map = L.map('map', {
    minZoom: MIN_ZOOM,
		maxZoom: MAX_ZOOM,
    zoomControl: false,
		center: [0, 0],
    zoom: 3,
    crs: crs
});
var single_image = false;
if(single_image) {
    L.imageOverlay('BotW-Map_6.jpg', bounds).addTo(map);
} else {
    L.tileLayer(
        "https://objmap.zeldamods.org/game_files/maptex/{z}/{x}/{y}.png",
        {
            attribution: '<a href="https://objmap.zeldamods.org/">Zeldamods Object Map</a>',
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            tileSize: 256,
        }).addTo(map);
}
var sW = map.unproject([-6000, -5000], 0);
var nE = map.unproject([6000, 5000], 0);
map.setMaxBounds( L.latLngBounds( sW, nE ));

var tr = L.transformation(1.0, 0.0, 1.0, 0.0);
L.control.zoom({
    position: 'topright'
}).addTo(map);
L.control.mousePosition({
    lngFirst: true,
    position: 'bottomright',
    latFormatter: (x => (-x).toFixed(0)),
}).addTo(map);

// Catch "Almost" clicks for people with fat fingers on touch screens
//   The fingers you have used to dial are too fat ...
//   https://www.youtube.com/watch?v=OqjF7HKSaaI
map.on('almost:click', function(ev) {
    var layer = ev.layer;
    if(layer.openPopup) {
        layer.fire('click', ev);
    }
});

