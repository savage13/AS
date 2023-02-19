
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

let show_id = $('#show_ids').checked;
function show_ids() {
    let el = $('#show_ids');
    show_id = el.checked;
    clear_layers();
    shrine_start_group = {};
    shrine_end_group = {};
    populate_table();
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
    //let prop = props(b)
    if(search.length == 0) {
        return true;
    }
    if(b.start.toLowerCase().includes(search)) {
        return true;
    }
    if(b.end.toLowerCase().includes(search)) {
        return true;
    }
    if(b.runner.toLowerCase().includes(search)) {
        return true;
    }
    if(b.warp && b.warp.toLowerCase().includes(search)) {
        return true;
    }
    if(b.note) {
        let notes = b.note.note;
        if(!Array.isArray(notes)) {
            notes = [notes];
        }
        for(const note of notes) {
            if(note.toLowerCase().includes(search)) {
                return true;
            }
        }
    }
    if(["warp","war","wa","p"].includes(search) && b.warp) {
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

function ss(v) {
    select_shrine(undefined, undefined, v);
}
function $txt(v) {
    return document.createTextNode(v);
}
function $a(txt, url, onclick=undefined) {
    let a = document.createElement('a');
    a.appendChild($txt(txt));
    a.title = "txt";
    a.href = url;
    if(onclick) {
        a.addEventListener('click', onclick);
    }
    return a;
}

function video_url(data) {
    if(data.video_type == "youtube") {
        return `https://youtu.be/${data.video_id}?t=${data.t0.toFixed(0)}`;
    }
    if(data.video_type == "twitch") {
        return `https://www.twitch.tv/videos/${data.video_id}?t=${data.t0.toFixed(0)}s`
    }
}

function populate_table() {
    let v = $("#app");
    v.innerHTML = "";
    let t = table();
    for(const paths of Object.values(gtimes)) {
        let d = div();
        d.classList.add("topborder");
        d.classList.add("mb10");
        let val = div();
        let start = paths[0].start;
        let end = paths[0].end;
        val.appendChild($a(start, '#', ()=>{ss(start)}))
        val.appendChild($txt(" - "));
        val.appendChild($a(end, '#', ()=>{ss(end)}))
        d.appendChild(val);
        let ul = $ul();
        d.appendChild(ul);
        let add = false;
        for(const path of paths.sort((a,b) => {return a.t-b.t;})) {
            if(! matches_search(path)) {
                continue;
            }
            add = true;
            let val = $li();
            let url = video_url(path);//`https://youtu.be/${path.youtube_id}?t=${path.t0.toFixed(0)}`;
            val.innerHTML = `${t2ms(path.t)} <a href=${url} target="_blank">video</a> ${path.runner}`;
            ul.appendChild(val);
            if(path.note) {
                let ul2 = $ul();
                ul2.appendChild($li(path.note.note));
                ul.appendChild(ul2);
            }
            if(path.warp) {
                let ul2 = $ul();
                ul2.appendChild($li(`Warp from ${path.warp}`));
                ul.appendChild(ul2);
            }
            if(show_id) {
                let ul2 = $ul();
                ul2.appendChild($li(`ID: ${path.youtube_id}`));
                ul.appendChild(ul2);
            }
        }
        if(add) {
            t.appendChild(d);
        }
    }
    v.appendChild(t);
}
let times;
let shrines;
let dungeons;
let notes = {};
let starts = {};
let ends = {};
let gtimes = {};
async function init() {
    shrines = await get_file('shrines.json');
    dungeons = await get_file('Dungeon.json');
    times = await get_file("timings.json");
    let tmp_notes = await get_file("notes.json");

    // Convert notes to a hashmap (or dict with key start-end-youtube_id)
    for(const note of tmp_notes) {
        let key = `${note.start}-${note.end}-${note.youtube_id}`;
        if(key in notes) {
            console.log(`Multiple instances, using last version: ${key}`);
        }
        notes[key] = note;
    }

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
        let key = `${feat.start}-${feat.end}-${feat.youtube_id}`;
        if(key in notes) {
            feat.note = notes[key];
        }
        key = `${feat.start}-${feat.end}`;
        if(!(key in gtimes)) {
            gtimes[key] = [];
        }
        gtimes[key].push(feat);
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

function $li(txt) {
    let el = document.createElement("li");
    el.innerHTML = txt;
    return el;
}
function $ul(txt) {
    return document.createElement("ul");
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
    let rows = []
    let ul = $ul();
    for(const btb of btbs.sort((a,b) => {return a.t-b.t;})) {
        let warp = "";
        let url = video_url(btb);//`https://youtu.be/${btb.youtube_id}?t=${btb.t0.toFixed(0)}`;
        ul.appendChild($li(`${t2ms(btb.t)} <a href=${url} target="_blank">video</a> ${btb.runner} `));
        if(btb.note) {
            let notes = btb.note.note;
            if(!Array.isArray(notes)) {
                notes = [notes];
            }
            notes.forEach(note => {
                let ul2 = $ul();
                ul2.appendChild($li(note));
                ul.appendChild(ul2);
            });
        }
        if(btb.warp) {
            let ul2 = $ul();
            ul2.appendChild($li(`Warp from ${btb.warp}`));
            ul.appendChild(ul2);
        }
        if(show_id) {
            let ul2 = $ul();
            ul2.appendChild($li(`ID: ${btb.youtube_id}`));
            ul.appendChild(ul2);
        }
    }
    if(long) {
        ul.appendChild($li( `Distance ${btb.dist.toFixed(2)} m` ))
    }
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
        for(const paths of Object.values(groups)) {
            let p0 = xyz2pt(paths[0].geometry.coordinates[0]);
            let p1 = xyz2pt(paths[0].geometry.coordinates[1]);
            let m = draw_btb(p0, p1, color, paths);
            markers.push( ... m);
        }
        group[shrine_name] = L.layerGroup(markers);
    }
}

function select_shrine(_ev, _shrine, shrine_name) {
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
        const y = shrine.pos[1].toFixed(0);
        name = name.replace("Shrine","").trim();
        let m = L.marker([shrine.pos[2], shrine.pos[0]], {icon: icon})
            .bindTooltip(`${name} - ${y}m`)
            .addTo(map)
            .on("click", (ev) => {select_shrine(ev, shrine, name)});

    }
}

function draw_btb(p1, p2, color, btbs) {
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
    return [marker, head];
}
function arrow_head( line ) {
    return L.polylineDecorator(line, {
        patterns: [
            {
                offset: '100%', repeat: 0, symbol:
                L.Symbol.arrowHead({
                    pixelSize: 7.5, polygon: false,
                    pathOptions: {weight: 2, stroke: true, color: xcolor}})
            }
        ]
    });
}


function handleSearch(ev) {
    search = event.target.value.toLowerCase().trim();
    populate_table();
}

let search = "";
$("#search").addEventListener('input', handleSearch);
search = $("#search").value.toLowerCase().trim();

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
L.tileLayer("https://objmap.zeldamods.org/game_files/maptex/{z}/{x}/{y}.png", {
    attribution: '<a href="https://objmap.zeldamods.org/">Zeldamods Object Map</a>',
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    tileSize: 256,
}).addTo(map);
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

