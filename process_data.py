#!/usr/bin/env python3

import sys
import json
import math

def translate_runner(name):
    if name == 'Judger Fantasy':
        return 'iTNTPiston'
    return name

def get_shrine_data(sdata, name):
    for s in sdata:
        if s['messageid'] == name:
            return s
    raise ValueError('cound not find shrine', name)

def shrine_data():
    shrines = json.load(open('Dungeon.json', 'r')) # Shrine name mapping
    sdata = json.load(open('shrines.json','r')) # Shrine data
    tmp = {}
    for shrine, name in shrines.items():
        if shrine.endswith('_master') or shrine.endswith('_sub'):
            continue
        if shrine.startswith('Endurance'):
            continue
        num = int(shrine.replace("Dungeon",""))
        if num >= 120:
            continue
        #print(shrine)
        name = name.replace(" Shrine", "")
        tmp[name] = get_shrine_data(sdata, shrine)
        tmp[name]['sub'] = shrines[shrine +'_sub']
    tmp['start'] = {'pos': [-1099.10, 242.00, 1876.31], 'value': 'Shrine of Resurrection'}
    tmp['Paraglider'] = {'pos': [-809.33, 263.58, 1964.35], 'value': 'Old Man', 'sub': 'Paraglider'}
    tmp['Hateno Ancient Tech Lab'] = {'pos': [3777.71, 355.49, 2127.36], 'value': 'Hateno Ancient Tech Lab'}
    tmp['Dark Beast'] = {'pos': [0,0,0], 'value': 'Dark Beast','sub':'Dark Beast'}
    return tmp

def get_segments(data, shrines):
    oks = ['start','Paraglider','Castle','Blights','Dark Beast','Calamity','Tower']
    items = data['items']
    items = sorted(items, key=lambda x: x['time'])
    start,warp,ctrl = None,None,None
    run_start = None
    out = []
    n = 0
    for item in items:
        name = item['value']
        if (name in shrines and name not in ['start']) or name == 'Dark Beast':
            if name == 'start':
                run_start = item
            if start is None:
                raise ValueError('starting point is undefind')
            n += 1
            i0 = start
            i1 = item
            if warp:
                i0 = warp
            s0 = shrines[i0['value'].replace(" Warp", "")]
            s1 = shrines[i1['value']]
            p0 = s0['pos']
            p1 = s1['pos']
            t0 = i0['time']
            t1 = i1['time']
            tw = start['time']
            d = dist(p1, p0)
            t = t1 - t0
            warp_name = None
            if warp:
                warp_name = start['value']
            geom = {'coordinates': [p0,p1]}
            seg = {
                'start': i0['value'].replace(" Warp",""),
                'end': i1['value'],
                'warp': warp_name,
                'sub': s1['sub'],
                't': t1 - t0,   # Segment time
                'tw': t1 - tw,  # Segment time without warp
                'dist': d,
                't0': t0,       # Time in video start
                't1': t1,       # Time in video end
                't0w': tw,      # Time in video without warp
                'geometry': geom,
                'video_id': data['video_id'],
                'video_type': data['video_type'],
                'runner': translate_runner(data['author']),
                'time': t1 - run_start['time']
            }
            if warp:
                sw = shrines[start['value'].replace(" Warp", "")]
                pw = sw['pos']
                seg['warp_path'] = {
                    'geometry': {
                        'coordinates': [
                            pw,
                            p0,
                        ]
                    }
                }
            out.append(seg)
            start, warp, ctrl = item, None, None

        else:
            if name.endswith(' control'):
                ctrl = item
            elif name.endswith(' Warp'):
                warp = item
            elif name == 'Paraglider':
                start = item
            elif name == 'start':
                start = item
                run_start = item
            elif name not in oks:
                print(f'"{name}"')
    return out

def dist(a,b):
    d = 0.0
    for i in range(3):
        d += (a[i] - b[i])**2
    return math.sqrt(d)

if __name__ == '__main__':
    files = sys.argv[1:]
    all_segs = []
    shrines = shrine_data()
    for file in files:
        print(file)
        data = json.load(open(file, 'r'))
        segs = get_segments(data, shrines)
        names = set([s['end'] for s in segs])
        missing = set(shrines.keys()) - names
        missing = missing - set(['start','Hateno Ancient Tech Lab'])
        if len(missing) > 0:
            print(missing)
        all_segs.extend(segs)
    json.dump(all_segs, open('timings.json','w'))
