#!/usr/bin/env python3
"""Herramienta de re-skin Game Boy (rama claude/gb-maps-redesign).

Funciones:
  segment(sheet)              -> bloques (bbox, tw, th) de un sheet compuesto GB
  reskin(map_id, sheet, box, method) -> recorta sub-mapa, re-deriva walls,
                                         reemplaza quirúrgicamente el bloque walls del .ts
  verify(map_id)              -> BFS desde start; comprueba que warps/salidas son alcanzables

Convención: opera por map_id usando public/editor/map-data.json (sourceFile/imageFile/dims/warps).
Las imágenes se escriben en game-src/src/assets/map/<imageFile>.
"""
import json, os, re
from collections import Counter, deque
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAPDIR = os.path.join(ROOT, 'game-src/src/maps')
ASSET  = os.path.join(ROOT, 'game-src/src/assets/map')
MAPDATA= os.path.join(ROOT, 'public/editor/map-data.json')

def _md():
    return json.load(open(MAPDATA))

# ---------- segmentación (guillotina por franjas de fondo) ----------
def segment(sheet_path, minpx=48):
    im = Image.open(sheet_path).convert('RGBA'); W,H=im.size; px=im.load(); bg=px[0,0]
    def isbg(x,y):
        p=px[x,y]; return abs(p[0]-bg[0])<8 and abs(p[1]-bg[1])<8 and abs(p[2]-bg[2])<8
    def cbg(x,y0,y1): return all(isbg(x,y) for y in range(y0,y1))
    def rbg(y,x0,x1): return all(isbg(x,y) for x in range(x0,x1))
    out=[]
    def g(x0,y0,x1,y1):
        while x0<x1 and cbg(x0,y0,y1): x0+=1
        while x1>x0 and cbg(x1-1,y0,y1): x1-=1
        while y0<y1 and rbg(y0,x0,x1): y0+=1
        while y1>y0 and rbg(y1-1,x0,x1): y1-=1
        if x1-x0<8 or y1-y0<8: return
        for x in range(x0+1,x1-1):
            if cbg(x,y0,y1): g(x0,y0,x,y1); g(x+1,y0,x1,y1); return
        for y in range(y0+1,y1-1):
            if rbg(y,x0,x1): g(x0,y0,x1,y); g(x0,y+1,x1,y1); return
        out.append((x0,y0,x1,y1))
    g(0,0,W,H)
    return [( (b[0],b[1],b[2],b[3]), (b[2]-b[0])//16, (b[3]-b[1])//16 )
            for b in out if b[2]-b[0]>=minpx and b[3]-b[1]>=minpx]

# ---------- parseo de campos del .ts ----------
def _pos(t,k):
    m=re.search(k+r'\s*:\s*\{\s*x\s*:\s*(\d+)\s*,\s*y\s*:\s*(\d+)',t)
    return (int(m.group(1)),int(m.group(2))) if m else None
def _block(t,k):
    m=re.search(r'\b'+k+r'\s*:\s*\{',t)
    if not m: return None,None,None
    i=t.index('{',m.start()); dep=0; j=i
    while j<len(t):
        if t[j]=='{': dep+=1
        elif t[j]=='}':
            dep-=1
            if dep==0: break
        j+=1
    return i,j,t[i+1:j]
def _rc(inner):
    s=set()
    if not inner: return s
    for rm in re.finditer(r'(\d+)\s*:\s*\[([^\]]*)\]',inner):
        for c in re.findall(r'\d+',rm.group(2)): s.add((int(c),int(rm.group(1))))
    return s
def _rcm(inner):
    s=set()
    if not inner: return s
    for rm in re.finditer(r'(\d+)\s*:\s*\{([^}]*)\}',inner):
        for cm in re.finditer(r'(\d+)\s*:',rm.group(2)): s.add((int(cm.group(1)),int(rm.group(1))))
    return s

def walkable_anchors(t):
    """tiles que DEBEN quedar transitables: start, warps, salidas, grass, recover, flySpot."""
    s=set()
    for k in ('start','recoverLocation','flySpot'):
        p=_pos(t,k); s.add(p) if p else None
    s|=_rcm(_block(t,'maps')[2]); s|=_rcm(_block(t,'teleports')[2])
    s|=_rc(_block(t,'exits')[2]); s|=_rc(_block(t,'grass')[2])
    return s

# ---------- re-skin ----------
def reskin(map_id, sheet_path, box, method='dom', tol=22, floor_frac=0.5):
    md=_md(); m=md[map_id]; tsf=m['sourceFile']; imgf=m['imageFile']
    path=os.path.join(MAPDIR,tsf); t=open(path).read()
    sheet=Image.open(sheet_path).convert('RGB'); crop=sheet.crop(box)
    TW,TH=crop.size[0]//16, crop.size[1]//16
    crop.save(os.path.join(ASSET,imgf)); px=crop.load()
    floor=Counter(px[x,y] for y in range(crop.size[1]) for x in range(crop.size[0])).most_common(1)[0][0]
    near=lambda a,b,tl=tol: all(abs(a[i]-b[i])<=tl for i in range(3))
    def dom(tx,ty):
        c=Counter()
        for y in range(ty*16,ty*16+16):
            for x in range(tx*16,tx*16+16): c[px[x,y]]+=1
        return c.most_common(1)[0][0]
    def frac(tx,ty):
        n=sum(1 for y in range(ty*16,ty*16+16) for x in range(tx*16,tx*16+16) if near(px[x,y],floor))
        return n/256.0
    anchors=walkable_anchors(t)
    walls={}
    for y in range(TH):
        if method=='dom':
            cols=[x for x in range(TW) if not near(dom(x,y),floor) and (x,y) not in anchors]
        else:
            cols=[x for x in range(TW) if frac(x,y)<floor_frac and (x,y) not in anchors]
        if cols: walls[y]=cols
    body="\n".join(f"    {y}: [{', '.join(map(str,walls[y]))}]," for y in sorted(walls))
    nw="walls: {\n"+body+"\n  }"
    i,j,_=_block(t,'walls'); ws=re.search(r'\bwalls\s*:\s*\{',t).start()
    open(path,'w').write(t[:ws]+nw+t[j+1:])
    return {'id':map_id,'tw':TW,'th':TH,'walls':sum(len(v) for v in walls.values()),
            'dim_match': (TW==m['width'] and TH==m['height']),'cur':(m['width'],m['height'])}

# ---------- verificación automática ----------
def verify(map_id):
    """BFS desde start sobre tiles no-pared; comprueba warps/salidas alcanzables."""
    md=_md(); m=md[map_id]; W,H=m['width'],m['height']
    wall=set()
    for y,cols in m['walls'].items():
        for x in cols: wall.add((int(x),int(y)))
    for y,cols in (m.get('water') or {}).items():
        for x in cols: wall.add((int(x),int(y)))
    start=m['start']; s=(start['x'],start['y'])
    # objetivos: warps (maps), teleports, exits
    targets=set()
    for row,cm in (m.get('maps') or {}).items():
        for col in cm: targets.add((int(col),int(row)))
    for row,cm in (m.get('teleports') or {}).items():
        for col in cm: targets.add((int(col),int(row)))
    for row,cols in (m.get('exits') or {}).items():
        for col in cols: targets.add((int(col),int(row)))
    # BFS
    seen={s}; q=deque([s])
    while q:
        x,y=q.popleft()
        for dx,dy in ((0,1),(0,-1),(1,0),(-1,0)):
            nx,ny=x+dx,y+dy
            if 0<=nx<W and 0<=ny<H and (nx,ny) not in wall and (nx,ny) not in seen:
                seen.add((nx,ny)); q.append((nx,ny))
    unreachable=[tg for tg in targets if tg not in seen]
    nwall=len(wall); ratio=nwall/(W*H)
    start_ok = s not in wall
    return {'id':map_id,'start_ok':start_ok,'targets':len(targets),
            'unreachable':unreachable,'wall_ratio':round(ratio,2),
            'reachable_floor':len(seen),'dims':(W,H)}

# ---------- render de verificación ----------
def render(map_id, scale=2, out=None):
    md=_md(); m=md[map_id]
    im=Image.open(os.path.join(ASSET,m['imageFile'])).convert('RGBA')
    im=im.resize((im.width*scale,im.height*scale),Image.NEAREST)
    from PIL import ImageDraw
    ov=Image.new('RGBA',im.size,(0,0,0,0)); dr=ImageDraw.Draw(ov); T=16*scale
    for y,cols in m['walls'].items():
        for x in cols: dr.rectangle([int(x)*T,int(y)*T,(int(x)+1)*T,(int(y)+1)*T],fill=(255,0,0,90))
    for row,cm in (m.get('maps') or {}).items():
        for col in cm: dr.rectangle([int(col)*T+2,int(row)*T+2,(int(col)+1)*T-2,(int(row)+1)*T-2],outline=(0,220,0,255),width=2)
    out=out or f'/tmp/verify-{map_id}.png'
    Image.alpha_composite(im,ov).save(out); return out

if __name__=='__main__':
    import sys
    print(json.dumps(verify(sys.argv[1]),indent=2))
