/**
 * @author LNDATA
 */

// var configNav= {
//     afterClickLi:function(nodoDom){ // se ejecuta despues del click en las opciones
//         var $nodoDom    = $(nodoDom),
//         value           = $nodoDom.data("value"),
//         $parent         = $nodoDom.parent(),
//         esProvincia =$parent.is("#provincia"),
//         esVariable      =$parent.parent().parent().is("#categorias");
//         if(esProvincia){ // ejecuta si es provincia
//             console.log("provincia= "+ value);

//         }else if(esVariable){ // ejecuta si es variable
//             console.log("variable= "+ value)
//         }
//     },
//     afterShowUl     :function(nodoDom){ // se ejecuta despues de mostrar/ocultar una lista
//         var $nodoDom = $(nodoDom);
//     }
// }

// jQuery.fn.extend({
//     navUl: function(callback){ // navegacion desde lista
//         callback ? callback : callback = {};
//         var oNav = $(this).find("li:has(ul)");
//         var option = $(this).find("li:not(:has(ul))");
//         option.bind("click", function(){ // evento click sobre los items
//             if(callback.afterClickLi) callback.afterClickLi(this)
//             return false;
//         });
//         oNav.click(function(){ // muestra ul
//             var $ul = $(this).find("> ul");
//             if($ul.is(":animated")){
//                 return false;
//             }
//             if($ul.is(":hidden")){
//                 $ul.slideDown(300, "easeOutExpo");
//                 if(callback.afterShowUl) callback.afterShowUl(this);
//             }else{
//                 $ul.slideUp(300, "easeOutExpo");
//             }

//             return false;
//         });
//     },
//     navMapas: function(){ // navegacion desde las img de mapas
//         var li          = $(this).find(">li"),
//         ver_mas = $("#ver_mas");
//         li.click(function(){
//             var $oLi                = $(this),
//             listaMapas      = $oLi.attr("id");
//             if(!$oLi.hasClass("active")){ // si no esta activo

//                 $("."+ver_mas.data("relevamiento")).slideUp({
//                     duration: 700,
//                     easing: "easeInOutQuint",
//                     complete: function(){}
//                 });
//                 ver_mas.removeClass("menos");
//                 ver_mas.data("relevamiento", listaMapas)
//                     .animate({"left":$oLi.data("left")}, 300, "easeOutElastic");
//             }
//             li.filter(".active").removeClass("active");
//             $oLi.addClass("active");
//             return false;
//         });

//         ver_mas.click(function(){
//             var relevamiento = $("."+ver_mas.data("relevamiento"));
//             if(relevamiento.is(":hidden")){
//                 relevamiento.slideDown({
//                     duration: 1000,
//                     easing: "easeOutElastic",
//                     complete: function(){}
//                 });
//                 ver_mas.addClass("menos");
//             }else{
//                 relevamiento.slideUp({
//                     duration: 1000,
//                     easing: "easeInOutQuint",
//                     complete: function(){}
//                 });
//                 ver_mas.removeClass("menos");
//             }
//             return false;
//         });

//         $(document).bind("ready", function(){
//             var a=li.filter(".active");
//             listaMapas      = a.attr("id");
//             ver_mas.data("relevamiento", listaMapas);
//         });
//     }
// });

function filtros(){ // eventos unidades de relevamiento
    $(".filtro").click(function(){
        var oThis = $(this);
        check_active(oThis, $(".filtro.active"));
        $("table#ranking").attr("class", oThis.data("urel"));
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

function check_active(btn, active){ // ambia el estado del btn
    if(!btn.hasClass("active")) {
            active.removeClass("active");
            btn.addClass("active")
        }
}


$(function(){
    filtros();
    variables();
    // $("#filtros").navUl(configNav);
    // $("#u_relevamiento").navMapas()
});
