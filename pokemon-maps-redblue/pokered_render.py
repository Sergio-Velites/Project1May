#!/usr/bin/env python3
"""Renderiza la ESTRUCTURA en grayscale de un mapa pokered (blk+blockset+tileset.png),
para desambiguar qué bloque coloreado de un sheet corresponde a cada mapa.
Requiere /tmp/pokered/gfx/tilesets/*.png (gráficos 8px, 16 tiles de ancho, mode L)."""
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pokered_parse as P

GFX = '/tmp/pokered/gfx/tilesets'

def render_struct(camel):
    hdr=P._HDRS[camel]; const=hdr['const']; Wb,Hb=P._DIMS[const]
    ts=P._C2C_TS[hdr['tileset']]
    bstfile=P._BST[ts]; png=os.path.join(GFX, bstfile.replace('.bst','.png'))
    if not os.path.exists(png): return None
    tiles=Image.open(png).convert('L')  # 16 tiles de ancho
    bst=open(os.path.join(P.PK,'blocksets',bstfile),'rb').read()
    blk=open(os.path.join(P.PK,'maps',camel+'.blk'),'rb').read()
    out=Image.new('L',(Wb*32,Hb*32))
    for by in range(Hb):
        for bx in range(Wb):
            i=by*Wb+bx
            if i>=len(blk): continue
            bid=blk[i]
            for r in range(4):
                for c in range(4):
                    t=bst[bid*16+r*4+c]
                    sx,sy=(t%16)*8,(t//16)*8
                    tile=tiles.crop((sx,sy,sx+8,sy+8))
                    out.paste(tile,(bx*32+c*8, by*32+r*8))
    return out  # tamaño Wb*32 x Hb*32 = Wt*16 x Ht*16

def similarity(a_gray, b_gray, size=(32,32)):
    """correlación estructural simple: MSE invertido sobre versiones normalizadas."""
    import statistics
    A=a_gray.resize(size).convert('L'); B=b_gray.resize(size).convert('L')
    pa=list(A.getdata()); pb=list(B.getdata())
    # normalizar contraste (las paletas difieren: pokered grayscale vs SGB color->gray)
    def norm(p):
        mn,mx=min(p),max(p); rng=(mx-mn) or 1
        return [(v-mn)*255//rng for v in p]
    pa,pb=norm(pa),norm(pb)
    mse=sum((x-y)**2 for x,y in zip(pa,pb))/len(pa)
    return -mse  # mayor = más parecido

if __name__=='__main__':
    import importlib; importlib.reload(P)
    # test: ViridianMart vs los bloques 8x8 del sheet viridian
    import reskin_tool as R
    struct=render_struct(sys.argv[1] if len(sys.argv)>1 else 'ViridianMart')
    print('render', struct.size if struct else None)
