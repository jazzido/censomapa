#!/bin/env python

import requests
import simplejson

API_KEY = 'AIzaSyBrM8jb4-i5xxm0uPZtEUaQSD8JbsKiY3E'
TABLE_ID = ''
QUERY_PREFIX = 'https://www.googleapis.com/fusiontables/v1/query'
DEFAULT_PARAMS = { 'typed': 'false', 'key': API_KEY }

def query(query):
    params = DEFAULT_PARAMS
    params.update({'sql': query})
    r = requests.get(QUERY_PREFIX, params=params)

    return r.json()

QUERY_POBLACION = ""



if __name__ == '__main__':
    print query('SELECT DNE_ID, Poblacion_Total_2001 FROM 1LLUZN9UWi_et0W8GVeRw_QwCkP_JUIgrfjIA8ec')
