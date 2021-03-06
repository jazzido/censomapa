/**
 * @author LNDATA
 */
 function mover_con_scroll(objScroll, objMover, relativeObj){
    /*
    *   objScroll   : punterq JQ del obj que va a hacer scroll
    *   objMover    : punterq JQ del obj que se va a mover scroll --> css: tiene que estar en position:absolute
    *   relativeObj : punterq JQ del obj que contiene al que se va a cover con el scroll
    */
    var self = this;
    self.obj_top = objMover.offset().top - (relativeObj ? relativeObj.offset().top : 0);
    self.obj_off = objMover.offset().top;    
    objScroll.scroll(function(e){
        var o = {
            condition : objScroll.scrollTop() >= self.obj_off,
            top : objScroll.scrollTop() - self.obj_off + self.obj_top   
        }
        if(o.condition){
            objMover.css("top", o.top);
        }
    })
}

function filtros(){ // eventos unidades de relevamiento
    $(".filtro").click(function(){
        var oThis = $(this);
        // $("table #filtro").html("ok");
        check_active(oThis, $(".filtro.active"));
        // var dm;
        // if (dm = $(this).data('default-map')) location.hash = dm;
        return false;
    });
}

function variables(){ // eventos unidades de relevamiento
    $("ul#variaciones li").click(function(){
        var oThis = $(this);
        check_active(oThis, $("ul#variaciones .active"));
//        $('div.active ul.active li:first-child')
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
    // selecciona el primer mapa de cada tab
    location.hash = $(".active .active li:first-child a").attr("href")
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
        postion.left= e.pageX + 10;
        
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

function start_spin(){
}

function Loader(cont_spin){
    // cont_spin -> id del div que va a contiener el loader 
    
    // config spin
    var opts = {
      lines: 9, // The number of lines to draw
      length: 10, // The length of each line
      width: 5, // The line thickness
      radius: 8, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: '100px', // Top position relative to parent in px
      left: '150px' // Left position relative to parent in px
    };
    
    var target = document.getElementById(cont_spin);
    var spinner = new Spinner(opts).spin(target);
    var $target = $(target);

    this.mostrar= function(){
        $target.show();
    };
    this.ocultar= function(){
        $target.fadeOut();
    };
    this.destruir= function(){
        $target.remove();
    };
}
var loader;
$(function(){
    filtros();
    variables();
    creditos();
    poner_bg_li();
    loader = new Loader("spin");
    var btn_volver= new mover_con_scroll($(window), $("#volver"), $("#svg"));
});

