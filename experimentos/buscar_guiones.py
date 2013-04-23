
import csv

r = csv.DictReader(open('/home/manuel/Downloads/Censo 2001-2001 Consolidado.csv'))

tiene_guion = []

for l in r:

    for k, v in l.items():
        if (k.startswith('Poblacion') or k.startswith('Hogares') or k.startswith('Vivienda')) and '-' in v:
            tiene_guion.append((l['DNE_ID'], l['AKA'], k))

print set([x[2] for x in tiene_guion])
