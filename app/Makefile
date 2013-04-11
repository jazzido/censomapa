DATE=`date +'%Y%m%d%H%M'`
all:
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
