/**
 * @author LNDATA
 */

function filtros(){ // eventos unidades de relevamiento
    $(".filtro").click(function(){
        var oThis = $(this);
        check_active(oThis, $(".filtro.active"));
        return false;
    });
}

function variables(){ // eventos unidades de relevamiento
    $("ul#variaciones li").click(function(){
        var oThis = $(this);
        check_active(oThis, $("ul#variaciones .active"));
        
        return false;
    });
}


function check_active(btn, active){ // cambia el estado del btn
    if(!btn.is(".active")) {
            active.removeClass("active");
            btn.addClass("active")
        }
    var urel ={};
    if(btn.is(".filtro")){ // si es unidad de relevamiento
        urel.str= btn.data("urel");
        urel.obj= $("#cont_mapas ."+urel.str);
        if(!urel.obj.is(".active")){
            $("#cont_mapas .variables ul.active").removeClass("active");  
            urel.obj.addClass("active")
        }
        $("table#ranking").attr("class", urel.str); // para el color de los numeros
    }
    if(btn.parent().attr("id") == "variaciones") { // es variable
        urel.str= btn.attr("id");
        urel.obj= $(".variables."+urel.str);
        if(!urel.obj.is(".active")){
            $("#cont_mapas .variables.active").removeClass("active");  
            urel.obj.addClass("active");
        }
    }
    var dm;
    if (dm = $("div#cont_mapas div.active ul.active li:first-child a").attr("href")) location.hash = dm;

}
/*
   * mover objeto en el mouse over
   * recibe: 
   * objetoOver = puntero de jquery del objeto que recibe el over
   * objetoMover = puntero de jquery del objeto a moverse con el mouse
   * parent = puntero de jquery del objeto contenedor
   * */
function moverObjMouseOver(objetoOver, objetoMover, parent){
    if(!parent){
        parent = objetoOver.parent();
    }
    var postion={ left:0, top:0, parentW: parent.width(), parentH: parent.height() };
    
    objetoOver.hover(function(e){
    objetoMover.show(); // muestra el tooltip
    objetoMover.w = objetoMover.width(); // capturamos el width
    objetoMover.h = objetoMover.height(); // capturamos el height
    $(this).mousemove(function(e){  
        postion.top= e.pageY  + 10;
        postion.left= e.pageX  + 10;
        
        if((postion.top + objetoMover.h) > (postion.parentH + 40)){ // valida position left
            postion.top -= objetoMover.h + 50; //exedente
        }
        var validaLeft=(postion.left + objetoMover.w) > postion.parentW;
        if(validaLeft){ // valida position left 
            if( (e.pageX  - 30) - objetoMover.w < 0){
                postion.left= 10;
            }else{
                postion.left= (e.pageX  - 10) - objetoMover.w;

            }
        }
        objetoMover.css({
            top: postion.top,
            left:postion.left
        });
    });
    },
    function(){
        $(this).addClass("byn");
        objetoMover.hide();
    });
}
function creditos(){
    var ctos= {
        mostrar: $("a#ver_creditos"),
        cont: $("div#creditos"),
        box: $("div#creditos div.box"),  
        cerrar: $("div#creditos div.box li.cerrar, div#creditos div.bg_box")  
    }
    ctos.mostrar.click(function(){
        ctos.cont.fadeIn("slow", function(){
            ctos.box.slideDown("fast");
        });   
        return false; 
    });
    ctos.cerrar.click(function(){
        ctos.box.slideUp("slow", function(){
            ctos.cont.fadeOut("slow");
        });
        return false; 
    });
}

function poner_bg_li(){
    var lis= $("div.variables ul li");
    lis.each(function(){
        var $this = $(this);
        var src_img= $this.find("img").attr("src");
        $this.css("background-image", "url("+$this.find("img").attr("src")+")");
    });
}

$(function(){
    filtros();
    variables();
    creditos();
    poner_bg_li();
});

