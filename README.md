Mapa Censo 2001-2010
====================

## Comandos útiles

### Para convertir un KML a SHP

`ogr2ogr -skipfailures -explodecollections -f "ESRI Shapefile" pimba.shp ~/Downloads/Copy\ of\ Argentina\ -\ Divisiones\ Administrativas\ de\ Segundo\ Nivel.kml`

Tener en cuenta que hace falta gdal >= 1.9.2 (que use libkml), para poder exportar correctamente los <ExtendedData>del KML.

### Para convertir un SHP a TopoJSON

!TODO Escribir!
