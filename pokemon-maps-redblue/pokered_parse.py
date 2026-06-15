#!/usr/bin/env python3
"""Parser autoritativo de pokered → estructura de mapa en el sistema del proyecto.

Para un mapa GB (nombre CamelCase, p.ej. 'PalletTown') devuelve:
  dims en tiles 16px, walls (set de (x,y) no transitables), warps, conexiones, signs, npcs.

Regla de colisión Gen 1 (validada contra Pallet): un tile 16px es transitable si su
sub-tile 8px INFERIOR-IZQUIERDO está en la lista de colisión del tileset.
"""
import os, re

PK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_pokered')

# ---------- tilesets ----------
def _tileset_camel_order():
    names=[]
    for l in open(os.path.join(PK,'data','tileset_headers.asm')):
        m=re.match(r'\s*tileset\s+(\w+)',l)
        if m: names.append(m.group(1))
    return names  # índice = const value

def _const_to_camel():
    # tileset_constants.asm: const OVERWORLD (orden) ; tileset_headers orden = mismo índice
    consts=[]
    for l in open(os.path.join(PK,'constants','tileset_constants.asm')):
        m=re.match(r'\s*const\s+(\w+)',l)
        if m: consts.append(m.group(1))
    camel=_tileset_camel_order()
    return {c:camel[i] for i,c in enumerate(consts) if i<len(camel)}

def _blockset_file():
    """CamelCase tileset -> ruta .bst (maneja labels compartidos)."""
    out={}; pending=[]
    for l in open(os.path.join(PK,'data','tilesets.asm')):
        for m in re.finditer(r'(\w+)_Block::',l): pending.append(m.group(1))
        mi=re.search(r'blocksets/(\w+\.bst)',l)
        if mi:
            for p in pending: out[p]=mi.group(1)
            pending=[]
    return out

def _collision_sets():
    """CamelCase tileset -> set de tile-ids transitables (labels compartidos)."""
    out={}; pending=[]
    for l in open(os.path.join(PK,'data','collision_tile_ids.asm')):
        for m in re.finditer(r'(\w+)_Coll::',l): pending.append(m.group(1))
        mi=re.search(r'coll_tiles\s+(.+)',l)
        if mi and pending:
            ids=set(int(x,16) for x in re.findall(r'\$([0-9a-fA-F]+)',mi.group(1)))
            for p in pending: out[p]=ids
            pending=[]
    return out

# ---------- dims ----------
def _dims():
    out={}
    for l in open(os.path.join(PK,'constants','map_constants.asm')):
        m=re.match(r'\s*map_const\s+(\w+)\s*,\s*(\d+)\s*,\s*(\d+)',l)
        if m: out[m.group(1)]=(int(m.group(2)),int(m.group(3)))  # (Wb,Hb)
    return out

# ---------- headers (const<->camel, tileset, conexiones) ----------
def _headers():
    H={}; const2camel={}
    for fn in os.listdir(os.path.join(PK,'headers')):
        camel=fn[:-4]; txt=open(os.path.join(PK,'headers',fn)).read()
        m=re.search(r'map_header\s+(\w+)\s*,\s*(\w+)\s*,\s*(\w+)',txt)
        if not m: continue
        const2camel[m.group(2)]=camel
        conns=[]
        for cm in re.finditer(r'connection\s+(\w+)\s*,\s*(\w+)\s*,\s*(\w+)\s*,\s*(-?\d+)',txt):
            conns.append((cm.group(1),cm.group(2),cm.group(3),int(cm.group(4))))
        H[camel]={'const':m.group(2),'tileset':m.group(3),'connections':conns}
    return H,const2camel

# ---------- objects (warps, signs, npcs) ----------
def _objects(camel):
    p=os.path.join(PK,'objects',camel+'.asm')
    if not os.path.exists(p): return {'warps':[],'signs':[],'npcs':[]}
    txt=open(p).read()
    warps=[(int(m.group(1)),int(m.group(2)),m.group(3),int(m.group(4)))
           for m in re.finditer(r'warp_event\s+(\d+)\s*,\s*(\d+)\s*,\s*(\w+)\s*,\s*(\d+)',txt)]
    signs=[(int(m.group(1)),int(m.group(2)),m.group(3))
           for m in re.finditer(r'bg_event\s+(\d+)\s*,\s*(\d+)\s*,\s*(\w+)',txt)]
    npcs=[(int(m.group(1)),int(m.group(2)),m.group(3))
          for m in re.finditer(r'object_event\s+(\d+)\s*,\s*(\d+)\s*,\s*(\w+)',txt)]
    return {'warps':warps,'signs':signs,'npcs':npcs}

# caches
_DIMS=_dims(); _C2C_TS=_const_to_camel(); _BST=_blockset_file(); _COLL=_collision_sets()
_HDRS,_CONST2CAMEL=_headers()

def walls_of(camel):
    """set de (x,y) NO transitables en tiles 16px, regla BL."""
    hdr=_HDRS[camel]; const=hdr['const']
    Wb,Hb=_DIMS[const]; Wt,Ht=Wb*2,Hb*2
    blk=open(os.path.join(PK,'maps',camel+'.blk'),'rb').read()
    ts_camel=_C2C_TS[hdr['tileset']]
    bst=open(os.path.join(PK,'blocksets',_BST[ts_camel]),'rb').read()
    coll=_COLL[ts_camel]
    # 8px tilemap
    TH8,TW8=Hb*4,Wb*4
    tmap=[[0]*TW8 for _ in range(TH8)]
    for by in range(Hb):
        for bx in range(Wb):
            if by*Wb+bx>=len(blk): continue
            bid=blk[by*Wb+bx]; t=bst[bid*16:bid*16+16]
            for r in range(4):
                for c in range(4):
                    tmap[by*4+r][bx*4+c]=t[r*4+c]
    walls=set()
    for y in range(Ht):
        for x in range(Wt):
            bl=tmap[2*y+1][2*x]   # sub-tile inferior-izquierdo
            if bl not in coll: walls.add((x,y))
    return walls,(Wt,Ht)

def map_info(camel):
    hdr=_HDRS[camel]; const=hdr['const']; Wb,Hb=_DIMS[const]
    walls,(Wt,Ht)=walls_of(camel)
    obj=_objects(camel)
    conns=[(d,_CONST2CAMEL.get(c,cam),cam,off) for (d,cam,c,off) in hdr['connections']]
    return {'camel':camel,'const':const,'tiles':(Wt,Ht),'tileset':hdr['tileset'],
            'walls':walls,'warps':obj['warps'],'signs':obj['signs'],'npcs':obj['npcs'],
            'connections':conns}

if __name__=='__main__':
    import sys,json
    info=map_info(sys.argv[1] if len(sys.argv)>1 else 'PalletTown')
    print('tiles',info['tiles'],'tileset',info['tileset'],'walls',len(info['walls']))
    print('warps',info['warps'])
    print('connections',info['connections'])
