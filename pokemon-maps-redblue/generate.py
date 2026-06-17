#!/usr/bin/env python3
"""Generador: re-skin GB autoritativo de un mapa del proyecto.

Por cada mapa: fija dims+walls (pokered), regenera el campo `maps`
(conexiones de borde + warps traducidos a MapId del proyecto), recorta la
imagen GB sobre su PNG, sanea posiciones de narrativa (trainers/text/items)
para que caigan en tiles válidos, y deja el .ts listo. Verificar con
reskin_tool.verify (BFS).
"""
import os, re, json, sys
from collections import deque
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pokered_parse as P

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAPDIR = os.path.join(ROOT, 'game-src/src/maps')
ASSET  = os.path.join(ROOT, 'game-src/src/assets/map')
STAGE  = os.path.join(ROOT, 'pokemon-maps-redblue')

def _md(): return json.load(open(os.path.join(ROOT,'public/editor/map-data.json')))

# enum MapId: kebab-value -> PascalKey
def enum_map():
    t=open(os.path.join(MAPDIR,'map-types.ts')).read()
    return {v:k for k,v in re.findall(r'(\w+)\s*=\s*"([^"]+)"',t)}
ENUM=enum_map()

# correspondencia inversa: pokered-camel -> project-id
_corr=json.load(open(os.path.join(STAGE,'correspondence.json')))['matched']
REV={v:k for k,v in _corr.items()}

# ---------- helpers de bloque ----------
def _block(t,k):
    m=re.search(r'\b'+k+r'\s*:\s*\{',t)
    if not m: return None,None
    i=t.index('{',m.start()); dep=0; j=i
    while j<len(t):
        if t[j]=='{': dep+=1
        elif t[j]=='}':
            dep-=1
            if dep==0: break
        j+=1
    return i,j

def _replace_block(t,key,new_inner):
    """reemplaza `key: { ... }` por `key: { new_inner }` (quirúrgico)."""
    i,j=_block(t,key)
    ks=re.search(r'\b'+key+r'\s*:\s*\{',t).start()
    return t[:ks]+f"{key}: {{\n{new_inner}\n  }}"+t[j+1:]

def _set_scalar(t,key,val):
    return re.sub(r'\b'+key+r'\s*:\s*\d+', f'{key}: {val}', t, count=1)

def _set_block(t,key,inner):
    """reemplaza key:{...} si existe; si no, lo inserta tras el bloque walls."""
    if re.search(r'\b'+key+r'\s*:\s*\{',t):
        return _replace_block(t,key,inner)
    i,j=_block(t,'walls')
    return t[:j+1]+f",\n  {key}: {{\n{inner}\n  }}"+t[j+1:]

def _ensure_direction_import(t):
    if 'Direction' in t and re.search(r'import\s*\{[^}]*\bDirection\b[^}]*\}\s*from\s*"\.\./state/state-types"',t):
        return t
    if re.search(r'import\s*\{[^}]*\}\s*from\s*"\.\./state/state-types"',t):
        return re.sub(r'(import\s*\{)([^}]*)(\}\s*from\s*"\.\./state/state-types")',
                      lambda m: m.group(1)+m.group(2)+(', Direction' if 'Direction' not in m.group(2) else '')+m.group(3),t,count=1)
    # añadir import nuevo tras la primera línea import
    return re.sub(r'(\n)', '\nimport { Direction } from "../state/state-types";', t, count=1)

# ---------- maps field (conexiones + warps) ----------
DIR_NONE='LAST_MAP'
def main_component(Wt,Ht,walls):
    """mayor región transitable conexa (el área jugable real)."""
    walk=set((x,y) for y in range(Ht) for x in range(Wt) if (x,y) not in walls)
    seen=set(); best=set()
    for s in walk:
        if s in seen: continue
        comp=set(); q=deque([s]); seen.add(s)
        while q:
            x,y=q.popleft(); comp.add((x,y))
            for dx,dy in ((0,1),(0,-1),(1,0),(-1,0)):
                n=(x+dx,y+dy)
                if n in walk and n not in seen: seen.add(n); q.append(n)
        if len(comp)>len(best): best=comp
    return best

def build_maps_field(info, reach):
    Wt,Ht=info['tiles']; walls=info['walls']
    walk=lambda x,y: 0<=x<Wt and 0<=y<Ht and (x,y) not in walls
    # apertura real: tile de borde transitable con vecino interior transitable
    # (evita esquinas selladas pero NO exige la componente principal — las rutas
    # largas se fragmentan por salientes y la apertura puede estar en otra sección)
    def opening(x,y):
        return walk(x,y) and any(walk(x+dx,y+dy) for dx,dy in ((0,1),(0,-1),(1,0),(-1,0)))
    cells={}  # (col,row)->MapId key
    def add(x,y,key): cells[(x,y)]=key
    edge={'north':[(x,0) for x in range(Wt)],
          'south':[(x,Ht-1) for x in range(Wt)],
          'west':[(0,y) for y in range(Ht)],
          'east':[(Wt-1,y) for y in range(Ht)]}
    for (d,camel,const,off) in info['connections']:
        pid=REV.get(camel); key=ENUM.get(pid) if pid else None
        if not key: continue
        for (x,y) in edge.get(d,[]):
            if opening(x,y): add(x,y,key)
    # warps (puertas/escaleras) -> tile exacto
    for (x,y,dest_const,wid) in info['warps']:
        if dest_const==DIR_NONE: continue
        dest_camel=P._CONST2CAMEL.get(dest_const)
        pid=REV.get(dest_camel) if dest_camel else None
        key=ENUM.get(pid) if pid else None
        if key and 0<=x<Wt and 0<=y<Ht: add(x,y,key)
    # serializar Record<row,Record<col,MapId>>
    byrow={}
    for (x,y),key in cells.items(): byrow.setdefault(y,{})[x]=key
    lines=[]
    for y in sorted(byrow):
        inner=", ".join(f"{x}: MapId.{byrow[y][x]}" for x in sorted(byrow[y]))
        lines.append(f"    {y}: {{ {inner} }},")
    return "\n".join(lines), bool(cells)

# ---------- saneo de posiciones (clamp + snap a transitable) ----------
def walkset(info):
    Wt,Ht=info['tiles']; w=info['walls']
    return Wt,Ht,set((x,y) for y in range(Ht) for x in range(Wt) if (x,y) not in w)

def snap(x,y,Wt,Ht,walk):
    x=max(0,min(Wt-1,x)); y=max(0,min(Ht-1,y))
    if (x,y) in walk: return x,y
    best=None;bd=1e9
    for (wx,wy) in sorted(walk):
        d=(wx-x)**2+(wy-y)**2
        if d<bd: bd=d;best=(wx,wy)
    return best or (x,y)

def sanitize_trainers(t,Wt,Ht,walk):
    # mueve cada pos: { x: N, y: M } de trainers a tile válido
    def fix(m):
        x,y=int(m.group(1)),int(m.group(2)); nx,ny=snap(x,y,Wt,Ht,walk)
        return f'pos: {{ x: {nx}, y: {ny} }}'
    i,j=_block(t,'trainers')
    if i is None: return t
    seg=t[i:j+1]
    seg2=re.sub(r'pos:\s*\{\s*x:\s*(\d+)\s*,\s*y:\s*(\d+)\s*\}',fix,seg)
    return t[:i]+seg2+t[j+1:]

def clamp_start(t,Wt,Ht,walk):
    m=re.search(r'start:\s*\{\s*x:\s*(\d+)\s*,\s*y:\s*(\d+)\s*\}',t)
    if not m: return t
    nx,ny=snap(int(m.group(1)),int(m.group(2)),Wt,Ht,walk)
    return t[:m.start()]+f'start: {{ x: {nx}, y: {ny} }}'+t[m.end():]

# ---------- walls serialize ----------
def walls_inner(walls,Wt,Ht):
    byrow={}
    for (x,y) in walls: byrow.setdefault(y,[]).append(x)
    return "\n".join(f"    {y}: [{', '.join(map(str,sorted(byrow[y])))}]," for y in sorted(byrow))

# ---------- generar un mapa ----------
def generate(project_id, sheet_path, box):
    md=_md(); m=md[project_id]; tsf=m['sourceFile']; imgf=m['imageFile']
    camel=_corr[project_id]
    info=P.map_info(camel)
    Wt,Ht=info['tiles']
    # imagen
    sheet=Image.open(sheet_path).convert('RGB'); crop=sheet.crop(box)
    cw,ch=crop.size[0]//16,crop.size[1]//16
    if (cw,ch)!=(Wt,Ht):
        return {'id':project_id,'error':f'crop {cw}x{ch} != pokered {Wt}x{Ht}'}
    crop.save(os.path.join(ASSET,imgf))
    # forzar transitables los tiles de warp (puertas: se pisan para teletransportar)
    walls=set(info['walls'])
    for (x,y,dest,wid) in info['warps']:
        if dest!=DIR_NONE and 0<=x<Wt and 0<=y<Ht: walls.discard((x,y))
    info['walls']=walls
    reach=main_component(Wt,Ht,walls)   # área jugable principal
    walk=set((x,y) for y in range(Ht) for x in range(Wt) if (x,y) not in walls)
    # .ts
    path=os.path.join(MAPDIR,tsf); t=open(path).read()
    t=_set_scalar(t,'width',Wt); t=_set_scalar(t,'height',Ht)
    t=_replace_block(t,'walls',walls_inner(walls,Wt,Ht))
    # fences (salientes) + fenceDirections
    fences=info.get('fences') or {}
    if fences:
        byrow={}
        for (x,y) in fences: byrow.setdefault(y,[]).append(x)
        fi="\n".join(f"    {y}: [{', '.join(map(str,sorted(byrow[y])))}]," for y in sorted(byrow))
        t=_set_block(t,'fences',fi)
        drow={}
        for (x,y),d in fences.items(): drow.setdefault(y,{})[x]=d
        fdi="\n".join(f"    {y}: {{ "+", ".join(f"{x}: Direction.{drow[y][x]}" for x in sorted(drow[y]))+" }," for y in sorted(drow))
        t=_set_block(t,'fenceDirections',fdi)
        t=_ensure_direction_import(t)
    mf,has=build_maps_field(info, reach)
    t=_replace_block(t,'maps',mf if has else "")
    # exits = warps a LAST_MAP (salida al mapa padre); el resto se limpia
    exrow={}
    for (x,y,dest,wid) in info['warps']:
        if dest==DIR_NONE and 0<=x<Wt and 0<=y<Ht: exrow.setdefault(y,[]).append(x)
    ex="\n".join(f"    {y}: [{', '.join(map(str,sorted(exrow[y])))}]," for y in sorted(exrow))
    t=_set_block(t,'exits',ex)
    if re.search(r'\bteleports\s*:\s*\{',t): t=_replace_block(t,'teleports',"")
    t=clamp_start(t,Wt,Ht,reach or walk)   # start dentro del área principal
    t=sanitize_trainers(t,Wt,Ht,reach or walk)
    open(path,'w').write(t)
    return {'id':project_id,'camel':camel,'tiles':(Wt,Ht),'walls':len(walls),
            'maps':has,'conns':len(info['connections']),'warps':len(info['warps'])}
