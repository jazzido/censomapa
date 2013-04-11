#!/bin/env python
import re
import sys

import requests
import simplejson

API_KEY = 'AIzaSyBrM8jb4-i5xxm0uPZtEUaQSD8JbsKiY3E'
TABLE_ID = '1sDFx5KHuZ_aqRlAAaQb6aAdEMGKogWNM1Ib8tR0'
QUERY_PREFIX = 'https://www.googleapis.com/fusiontables/v1/query'
DEFAULT_PARAMS = { 'typed': 'false', 'key': API_KEY }


VARIABLES = ["Poblacion_Densidad_2001",
             "Poblacion_Densidad_2010",
             "Poblacion_Total_2001",
             "Poblacion_Total_2010",
             "Poblacion_Varones_2001",
             "Poblacion_Varones_2010",
             "Poblacion_Mujeres_2001",
             "Poblacion_Mujeres_2010",
             "Poblacion_Analfabetos_2001",
             "Poblacion_Analfabetos_2010",
             "Poblacion_Alfabetos_2001",
             "Poblacion_Alfabetos_2010",
             "Poblacion_0a14_2001",
             "Poblacion_0a14_2010",
             "Poblacion_15a64_2001",
             "Poblacion_15a64_2010",
             "Poblacion_65ymas_2001",
             "Poblacion_65ymas_2010",
             "Poblacion_Nacida_Extranjero_2001",
             "Poblacion_Nacida_Extranjero_2010",
             "Poblacion_Nacida_Argentina_2001",
             "Poblacion_Nacida_Argentina_2010",
             "Hogares_Total_2001",
             "Hogares_Total_2010",
             # "Hogares_Con_Bano_2001",
             # "Hogares_Con_Bano_2010",
             # "Hogares_Sin_Bano_2001",
             # "Hogares_Sin_Bano_2010",
             # "Hogares_Con_Gas_Corriente_2001",
             # "Hogares_Con_Gas_Corriente_2010",
             # "Hogares_Sin_Gas_Corriente_2001",
             # "Hogares_Sin_Gas_Corriente_2010",
             # "Hogares_Con_Agua_Corriente_2001",
             # "Hogares_Con_Agua_Corriente_2010",
             # "Hogares_Sin_Agua_Corriente_2001",
             # "Hogares_Sin_Agua_Corriente_2010",
             "Hogares_Con_Heladera_2001",
             "Hogares_Con_Heladera_2010",
             "Hogares_Sin_Heladera_2001",
             "Hogares_Sin_Heladera_2010",
             "Hogares_Con_Telefono_Linea_2001",
             "Hogares_Con_Telefono_Linea_2010",
             "Hogares_Sin_Telefono_Linea_2001",
             "Hogares_Sin_Telefono_Linea_2010",
             "Hogares_Con_Celular_2001",
             "Hogares_Con_Celular_2010",
             "Hogares_Sin_Celular_2001",
             "Hogares_Sin_Celular_2010",
             "Hogares_Sin_Computadora_2001",
             "Hogares_Sin_Computadora_2010",
             "Hogares_Con_Computadora_2001",
             "Hogares_Con_Computadora_2010",
             "Viviendas_Total_2001",
             "Viviendas_Total_2010",
             "Viviendas_Casa_2001",
             "Viviendas_Casa_2010",
             "Viviendas_Rancho_2001",
             "Viviendas_Rancho_2010",
             "Viviendas_Casilla_2001",
             "Viviendas_Casilla_2010",
             "Viviendas_Departamento_2001",
             "Viviendas_Departamento_2010",
             "Viviendas_Pieza_Inquilinato_2001",
             "Viviendas_Pieza_Inquilinato_2010",
             "Viviendas_Pieza_Hotel_Pension_2001",
             "Viviendas_Pieza_Hotel_Pension_2010",
             "Viviendas_Local_No_Construido_Para_habitacion_2001",
             "Viviendas_Local_No_Construido_Para_habitacion_2010",
             "Viviendas_movil_2001",
             "Viviendas_movil_2010"]

def query(query):
    params = DEFAULT_PARAMS
    params.update({'sql': query})
    r = requests.post(QUERY_PREFIX,data=params)
    return r.json()


def get_variables(vars):

    def to_f(s):
        try:
            return float(s)
        except:
            return None

    r = query("SELECT DNE_ID, %s FROM %s" % (', '.join(vars), TABLE_ID))

    # nombres de variables sin el agno
    variable_names = sorted(set([x[1]
                                 for x in map(lambda x: re.split(r'(.+)_(2010|2001)',
                                                                 x),
                                              r['columns'][1:])]))


    indexes = dict(zip(r['columns'][1:], range(len(r['columns']) - 1)))

    rv = {
        '_c': variable_names,
    }

    for row in r['rows']:
        dne_id, row = row[0], row[1:]

        rv[dne_id] = [
            map(lambda c: to_f(row[indexes[c + "_2001"]]), variable_names),
            map(lambda c: to_f(row[indexes[c + "_2010"]]), variable_names)
        ]

    return rv

if __name__ == '__main__':

    values = get_variables(VARIABLES)

    rv = dict()
    rv['_years'] = ['2001', '2010']
    rv['_column_names'] = values['_c']
    rv['_districts'] = {}

    del(values['_c'])

    for k, v in values.iteritems():
        rv['_districts'][k] = v


    print simplejson.dumps(rv)
