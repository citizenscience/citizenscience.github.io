// UTILS
// -------------------------------------------------
var htmlMap = {"&": "&amp;","<": "&lt;",">": "&gt;",'"': '&quot;',"'": '&#39;',"/": '&#x2F;'};

function toJsonFormat(str) {
  str = str.replace(/([a-zA-Z0-9]+?):/g, '"$1":');
  str= str.replace(/:(?!true|false)([a-zA-Z]+)/g, ':"$1"');
  str = str.replace(/'/g, '"');
  return str;
}
function jsonify(str) {
  str = toJsonFormat(str);
  return jQuery.parseJSON(str);
}
function escapeHtml(string) {
  return String(string).replace(/[&<>"'\/]/g, function (s) {
    return htmlMap[s];
  });
}
function cycleForward(index, total) {
  var i = index + 1;
  i = (i >= total)? 0 : i;
  return i;
}
function cycleBack(index, total) {
  var i = index - 1;
  i = (i < 0)? total - 1 : i;
  return i;
}
function invert(v, a, b) {
  return (v == a)? b : a;
}
function getDocType() { 
 var node = document.doctype;
 return node ? "<!DOCTYPE "
           + node.name
           + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '')
           + (!node.publicId && node.systemId ? ' SYSTEM' : '') 
           + (node.systemId ? ' "' + node.systemId + '"' : '')
           + '>\n' : '';
}

function getNodeIndex(parent, child) {
  return Array.prototype.indexOf.call(parent.childNodes, child);
}

function isSmallScreen() {
  return $(window).width() < 768
}

$.fn.insertIndex = function (i) {
    // The element we want to swap with
    var $target = this.parent().children().eq(i);

    // Determine the direction of the appended index so we know what side to place it on
    if (this.index() > i) {
        $target.before(this);
    } else {
        $target.after(this);
    }

    return this;
};

function showPageLoader() {
  $('.page-loader').show(); 
  $('.page-loader .anim').show();
}
function hidePageLoader() {
  $('.page-loader .anim').fadeOut(); 
  $('.page-loader').delay(350).fadeOut();
}

// NAV
// ---------------------------------
var nav = {};

nav.normal = {};
nav.normal.init = function(navbar) {
  // Nothing much to do here..hehe
  navbar.data("initialized", true);
  nav.active = nav.normal;
};

nav.sticky = {};
nav.sticky.init = function(navbar) {

  nav.sticky.triggerEl = navbar.data("trigger")? $(navbar.data("trigger")) : navbar;
  nav.sticky.triggerH = nav.sticky.triggerEl.height();
  nav.sticky.navbar = navbar;
  nav.sticky.scrollOffset = - navbar.outerHeight();
  nav.sticky.spyOffset = navbar.outerHeight() + 1;
  
  $('body').scrollspy({
     offset: nav.sticky.spyOffset
  });
  
  nav.sticky.autoToggle = function(){
    if ($(window).scrollTop() > nav.sticky.triggerH) {
      navbar.removeClass(navbar.attr("data-del")).addClass(navbar.attr("data-add"));
    } else {
      navbar.removeClass(navbar.attr("data-add")).addClass(navbar.attr("data-del"));
    }
  }
  
  nav.sticky.autoToggle();
  
  $(window).scroll(function() {
    nav.sticky.autoToggle();
  });
  
  navbar.data("initialized", true);
  nav.active = nav.sticky;
  nav.offset = nav.sticky.scrollOffset;
}


function setupNav(target) {
  if(target.length > 0) nav[target.data().navbar].init(target);
}

// WIN LOAD
// ------------------------------------------
$(window).load(function() {
  hidePageLoader();
})

// DOC READY
// ------------------------------------------
$().ready(function() {

  // IMAGE BOX
  // ----------------------------------------
  $("[data-swipebox='true']").swipebox();
  
  // NAV
  // ----------------------------------------
  setupNav($("[data-navbar]"));
  
  // TOOLTIPPS
  // ----------------------------------------
  $("[data-show='tooltip']").tooltip();   
  
  // NAV TOGGLE LINKS
  // ----------------------------------------
  $("body").on("click", "[data-toggle-nav]", function(e) {
    e.preventDefault();
    var target = $(this).attr("data-toggle-nav");
    if(target) {
      $(target).toggleClass("hide-nav");
    }
  });
  
  // SCROLLER
  // ----------------------------------------
  $("body").on("click", "[data-scroll='true']", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    var target = $(this).attr("href");
    if($(target).length > 0 ) {
      $.scrollTo(target, 500, {offset:nav.active.scrollOffset});
    } else {
      //alert("The link [" + target + "] cannot be found!\n\nMake sure your links are pointing to the correct blocks")
    }
  });
  
});

function scrollPage(target) {
  if(target) $.scrollTo(target, 500, {offset: nav.offset || 0});
}