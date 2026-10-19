# Builds fonts/piazzolla-*.woff2 and archivo-latin-var.woff2 (Latin + ES/PT accents) from the Google Fonts OFL sources:
#   github.com/google/fonts ofl/piazzolla/Piazzolla[opsz,wght].ttf, Piazzolla-Italic[opsz,wght].ttf, ofl/archivo/Archivo[wdth,wght].ttf
# usage: cd <dir with the .ttf files> && python gen-latin-fonts.py <repo>/fonts   (needs fonttools + brotli)
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset
U="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+0160-0161,U+0178,U+017D-017E,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2009,U+200A,U+2010-2015,U+2018-201E,U+2022,U+2026,U+2030,U+2032-2033,U+2039-203A,U+20A9,U+20AC,U+2116,U+2122,U+2190-2193,U+2212,U+2215"
def run(src,dst,limits):
    f=TTFont(src); f=instantiateVariableFont(f,limits)
    opts=subset.Options(); opts.flavor='woff2'; opts.layout_features=['kern','liga','calt','lnum','onum','pnum','tnum','case','ss01','frac','ordn','sups']; opts.name_IDs=['*']; opts.notdef_outline=True
    s=subset.Subsetter(opts); s.populate(unicodes=subset.parse_unicodes(U)); s.subset(f); f.flavor='woff2'; f.save(dst)
D=sys.argv[1]
run('Piazzolla[opsz,wght].ttf',D+'/piazzolla-latin-var.woff2',{'wght':(350,700)})
run('Piazzolla-Italic[opsz,wght].ttf',D+'/piazzolla-italic-latin-var.woff2',{'wght':(350,600)})
run('Archivo[wdth,wght].ttf',D+'/archivo-latin-var.woff2',{'wdth':(75,100),'wght':(400,700)})
