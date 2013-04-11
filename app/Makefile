DATE=`date +'%Y%m%d%H%M'`
all:
	mkdir -p build
	awk '/BEGIN_JS/ {flag=1;next} /END_JS/{flag=0} flag {print}' index.html | cut -d\" -f 2 | xargs cat | uglifyjs > build/all_$(DATE).js
