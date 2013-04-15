DATE=$(shell date +'%Y%m%d%H%M')
all:
	$(call data,)
	mkdir -p build
	rm -rf build/*
	# minificar javascript
	awk '/BEGIN_JS/ {flag=1;next} /END_JS/{flag=0} flag {print}' index.html | cut -d\" -f 2 | xargs cat | uglifyjs > build/all_$(DATE).js
	# procesar html y cambiar el path al js
	head -n `grep -n "BEGIN_JS" index.html | cut -d: -f 1` index.html > build/index.html
	echo "<script type=\"text/javascript\" src=\"all_$(DATE).js\"></script>" >> build/index.html
	tail -n +`grep -n "END_JS" index.html | cut -d: -f 1` index.html >> build/index.html
	# copiar css y eso
	cp -RL css build
	cp -RL data build

TOPOJSON_QUANTIZATION=3000
TOPOJSON_SIMPLIFY_PROPORTION=.45
data:
	# genero mapa en topojson
	topojson -p DNE_ID -p PROVINCIA -p DEPARTAMEN --id-property DNE_ID -q $(TOPOJSON_QUANTIZATION) --simplify-proportion=$(TOPOJSON_SIMPLIFY_PROPORTION) -o /tmp/ea.json ../mapas/departamentos.shp ../mapas/provincias.shp
	# bajo la data del FT y la guardo en el formato que necesita el mapa
	python ../experimentos/export_data.py > data/data.json
	# la bajo de vuelta en CSV para mergear con el topojson
	curl --header "accept-charset:ISO-8859-1,utf-8;q=0.7,*;q=0.3" -o /tmp/data.csv "https://www.google.com/fusiontables/exporttable?query=select+*+from+1SgJ4aJEsxG2unWQA_qW__bSA_b2yu6_1Gn-vZHo"
	# mergear data y propiedades en el topojson
	python ../experimentos/merge_map_and_data.py /tmp/ea.json /tmp/data.csv > ../experimentos/topo/data/ea.json
	rm /tmp/ea.json
	rm /tmp/data.csv
