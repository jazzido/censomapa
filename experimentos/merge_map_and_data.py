import sys
import simplejson
import csv
from itertools import ifilter

def merge(topojson, data):
    """ topojson: parsed topojson file
        data: a csv.DictReader instance """

    merged_dptos = set()
    all_dptos = set()
    departamentos = topojson['objects']['departamentos']['geometries']

    for r in data:
        all_dptos.add(r['DNE_ID'])
        dpto_geoms = filter(lambda d: d['id'] == r['DNE_ID'], departamentos)
        if len(dpto_geoms) == 0: continue

        for dpto in dpto_geoms:
            dpto['properties']['p'] = dpto['properties'].pop('PROVINCIA')
            dpto['properties']['a'] = r['AKA']
            dpto['properties']['c'] = r['CABECERA']
            dpto['properties']['d'] = dpto['properties'].pop('DEPARTAMEN')
            if 'HASC_ID' in dpto['properties']: del(dpto['properties']['HASC_ID'])
            if 'IGN_ID' in dpto['properties']: del(dpto['properties']['IGN_ID'])
            if 'DNE_ID' in dpto['properties']: del(dpto['properties']['DNE_ID'])

        merged_dptos.add(r['DNE_ID'])

    # borrar Tierra del Fuego, etc
    for i in ['ISLAS', 'D24003']:
        o = next(ifilter(lambda x: x['id'] == i, departamentos), None)
        if o is None: continue
        print >>sys.stderr, "deleting: %r" % o
        departamentos.remove(o)

    print >>sys.stderr, "remaining dptos: %s" % (all_dptos - merged_dptos)
    
def UnicodeDictReader(utf8_data, **kwargs):
    csv_reader = csv.DictReader(utf8_data, **kwargs)
    for row in csv_reader:
        yield dict([(key, unicode(value, 'utf-8')) for key, value in row.iteritems()])

if __name__ == '__main__':
    topojson = simplejson.load(open(sys.argv[1]))
#    data = csv.DictReader(open(sys.argv[2]))
    data = UnicodeDictReader(open(sys.argv[2]))
    merge(topojson, data)

#    import pdb; pdb.set_trace()

    print simplejson.dumps(topojson)
    
