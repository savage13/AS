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
        #print(shrine)
        name = name.replace(" Shrine", "")
        tmp[name] = get_shrine_data(sdata, shrine)
        tmp[name]['sub'] = shrines[shrine +'_sub']
    tmp['start'] = {'pos': [-1099.10, 242.00, 1876.31], 'value': 'Shrine of Resurrection'}
    tmp['Paraglider'] = {'pos': [-809.33, 263.58, 1964.35], 'value': 'Old Man', 'sub': 'Paraglider'}
    return tmp

def get_segments(data, shrines):
    oks = ['start','Paraglider','Castle','Blights','Dark Beast','Calamity','Tower']
    items = data['items']
    items = sorted(items, key=lambda x: x['time'])
    start,warp,ctrl = None,None,None
    out = []
    n = 0
    for item in items:
        name = item['value']
        if name in shrines and name not in ['start'] :
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
            out.append({
                'start': i0['value'].replace(" Warp",""),
                'end': i1['value'],
                'warp': warp_name,
                'sub': s1['sub'],
                't': t1 - t0,
                'tw': t1 - tw,
                'dist': d,
                't0': t0,
                't1': t1,
                't0w': tw,
                'geometry': geom,
                'video_id': data['video_id'],
                'video_type': data['video_type'],
                'runner': translate_runner(data['author']),
            })
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
        all_segs.extend(segs)
json.dump(all_segs, open('timings.json','w'))
