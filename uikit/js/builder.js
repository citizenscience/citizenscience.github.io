// ======================================================================================
// NOTE: 
// This is an experimental page builder I quickly developed for this project.
// I plan to refactor the code after the holidays, so please ignore any offensive bits :)
// ======================================================================================

// BUILDER INIT
// ==================================
var builder = {dropCount:0};
builder.canExport = false;
try {
  builder.canExport = !!new Blob;
} catch (e) {}
var iconPrefs = ["et-", "fa-", "lc", "ti"];
builder.blocksParent = $("#page-wrapper");
builder.parentNode = document.getElementById("page-wrapper");
builder.loaderCode = '<div class="drop-preloader valigner">' +
                     '<div class="v-middle loader-anim">' +
                     '<div class="la-ball-clip-rotate fg-primary hcenter"><div></div></div>' +
                     '</div></div>';
                     

builder.init = function(opts) {
  var defaults = {
    dir: "uikit/blocks/",
    blockList: blocks,
    classGroups: [
      {initKey:"initBg", activeKey:"activeBg", regex:/bg-\S+|cover-\S+|overlay-\S+|inverse\S*/g},
      {initKey:"initBorder", activeKey:"activeBorder", regex:/border-\S+/g},
      {initKey:"initOverlay", activeKey:"activeOverlay", regex:/overlay-\S+/g}
    ]
  };
  
  builder.opts = $.extend(defaults, opts, {});
  builder.listCode = "";
  builder.blockList = $("#block-list");
  
  // Build blocks list
  builder.blockList.html(builder.getBlockList("all"));
  
  // Resizing
  builder.resizeBuilder();
  $(window).resize(function(e) {
    builder.resizeBuilder();
  });
  
  // Strip top level comments
  builder.stripBlockComments();
  
  // Process blocks
  $(".block").each(function(index) {
    builder.initBlock($(this));
  });

  // Panel Toggler
  $("body").on("click", "#builder-toggler", function(e) {
    e.preventDefault();
    $(".builder-panel").toggleClass("open");
  });

  // Tabs Toggler
  $("body").on("click", "#lock-tabs", function(e) { 
    e.preventDefault();
    if($(".builder-panel").hasClass("lock-tabs")) {
      $(".builder-panel").removeClass("lock-tabs");
    } else {
      $(".builder-panel").addClass("lock-tabs");
    }
  });

  $("body").on("click", ".builder-panel [data-toggle='tab']", function(e) {
    $(".builder-panel").addClass("lock-tabs");
  });  
  
  $("body").on("click", "[data-tab-toggle]", function(e) {
    var $tabs = $($(this).attr("data-tab-toggle"));
    var $links = $($(this).attr("data-tab-links"));
    var href = $(this).attr("href");
    var $tab = $(href);
    
    $tabs.removeClass("active");
    $tab.addClass("active");
    $links.removeClass("active");
    $links.parent().find('[href="' + href +'"]').parent().addClass("active");
  });  
  
  // Blocks Filter
  $("body").on("change", "#block-categs", function(e) {
    e.preventDefault();
    var categ = $(this).val();
    builder.blockList.html(builder.getBlockList(categ));
  });
  
  // Undo button
  $("body").on("click", "#btn-undo", function(e) { builder.hist.back() });

  // History button
  $("body").on("click", "#btn-hist", function(e) { builder.hist.show() });
  
  // ID button
  $("body").on("click", "#btn-rename", function(e) { 
    e.preventDefault();
    var oldId = builder.activeBlock.attr("id");
    var newId = prompt("Enter new ID without #", oldId);
    if(newId) {
      builder.changeBlockId(builder.activeBlock, oldId, newId, true);
    }
  }); 
  
  // Up button
  $("body").on("click", "#btn-block-up", function(e) { 
    e.preventDefault();
    builder.moveBlockUp(builder.activeBlock, true);
    setTimeout(function(e){
      scrollPage("#" + builder.activeBlock.attr("id"));
    }, 500);
  });
  
  // Top button
  $("body").on("click", "#btn-block-top", function(e) { 
    e.preventDefault();
    builder.moveBlockToTop(builder.activeBlock, true);
    setTimeout(function(e){
      scrollPage("#" + builder.activeBlock.attr("id"));
    }, 500);
  });
  
  // Down button
  $("body").on("click", "#btn-block-down", function(e) { 
    e.preventDefault();
    builder.moveBlockDown(builder.activeBlock, true);
    setTimeout(function(e){
      scrollPage("#" + builder.activeBlock.attr("id"));
    }, 500);
  });   
  
  // Bottom button
  $("body").on("click", "#btn-block-bottom", function(e) { 
    e.preventDefault();
    builder.moveBlockToBottom(builder.activeBlock, true);
    setTimeout(function(e){
      scrollPage("#" + builder.activeBlock.attr("id"));
    }, 500);
  });  
  
  // Clone button
  $("body").on("click", "#btn-clone-block", function(e) { 
    e.preventDefault();
    var cloneID = "#" + builder.cloneBlock(builder.activeBlock);
    setTimeout(function(e){
      scrollPage(cloneID);
    }, 500);
  }); 
  
  // Deselect button
  $("body").on("click", "#btn-deselect", function(e) { 
    e.preventDefault();
    builder.closePanel();
  }); 
  
  // Remove button
  $("body").on("click", "#btn-del-block", function(e) { 
    e.preventDefault();
    builder.removeBlock(builder.activeBlock);
  }); 
  
  // Select block
  $("body").on("dblclick", ".block", function(e) { 
    document.getSelection().removeAllRanges();
    var $block = $(this);
    
    if($block.attr("data-edit") == "true") {
      builder.deselectBlock($block);
    } else {
      builder.selectBlock($block);
    }
  }); 
  
  // Page panels toggle
  $("body").on("click", ".page-wrapper", function(e) { 
    if(e.target == this && $(this).attr("data-editmode") == "true") {
      builder.closePanel();
    } 
  });
  
  // Reset button
  $("body").on("click", "#btn-reset-block", function(e) { 
    e.preventDefault();
    builder.resetBlock(builder.activeBlock);
  }); 
  
  // Export button
  $("#btn-export")[0].initText = $("#btn-export .text").html();
  $("#btn-export")[0].reset = function() {
    var val = $(this)[0].initText;
    $(this).find(".text").html(val);
  };
  $("#btn-export")[0].working = function() {
    $(this).find(".text").html("Exporting...");
  };
  $("body").on("click", "#btn-export", function(e) { 
     builder.exportPage();
  }); 
  
  // Border options
  $("body").on("click", ".bb-radio", function(e) { 
    var val = $(this).val();
    var newClass = "";
    
    switch(val) {
      case "0":
        newClass = "";
      break;

      case "1":
        newClass = "border-t";
      break;
      
      case "-1":
        newClass = "border-b";
      break;
      
      case "2":
        newClass = "border-t border-b";
      break;
    }
    
    var activeKey = "activeBorder";
    var initKey = "initBorder";
    var delClass = builder.activeBlock.data(activeKey);
    
    builder.switchClass(builder.activeBlock, newClass, delClass, activeKey, true);
  }); 
  
  // Class switcher lists
  $("body").on("click", ".dd-class-list a", function(e) {
    e.preventDefault();
    var $parent = $(this).parent().parent();
    $parent.find("li").removeClass("active");
    $(this).parent().addClass("active");
    var activeKey = $parent.data("activekey");
    var initKey = $parent.data("initkey");
    var delClass = builder.activeBlock.data(activeKey);
    var newClass = "";
    
    if($(this).data("add") != "!") {
      newClass = $(this).data("add");
    } else {
      newClass = builder.activeBlock.data(initKey);
    }
    
    builder.switchClass(builder.activeBlock, newClass, delClass, activeKey, true);
  });
  
  // Nav bg list
  $("body").on("click", ".nav-bg-list a", function(e) {
    e.preventDefault();
    var $parent = $(this).parent().parent();
    var delClass = builder.activeBlock.data("activeBg");
    var newClass = $(this).data("add");
    
    switch($parent.data().mode) {
    
      case "default":
        builder.switchClass(builder.activeBlock, newClass, delClass, "activeBg");
        builder.activeBlock.data("delBg", newClass);
        var str = newClass + " " + builder.activeBlock.data("delBorder");
        str = str.trim();
        builder.activeBlock.attr("data-del", str);
      break;
      
      case "scroll":
        builder.activeBlock.attr("data-add", newClass);
        builder.activeBlock.data("addBg", newClass);
        var str = newClass + " " + builder.activeBlock.data("addBorder");
        str = str.trim();
        builder.activeBlock.attr("data-add", str);
      break;
      
    }
  });
  
  // Nav border options
  $("body").on("click", ".nb-radio", function(e) {
    var $parent = $(this).parent().parent();
    var activeKey = "activeBorder";
    var initKey = "initBorder";
    var delClass = builder.activeBlock.data(activeKey);
    var newClass = $(this).val();
    builder.switchClass(builder.activeBlock, newClass, delClass, activeKey);
    builder.activeBlock.data("delBorder", newClass);
    var str = newClass + " " + builder.activeBlock.data("delBg");
    str = str.trim();
    builder.activeBlock.attr("data-del", str);
  });
  
  // Alt nav border options
  $("body").on("click", ".alt-nb-radio", function(e) {
    var newClass = $(this).val();
    builder.activeBlock.data("addBorder", newClass);
    var str = newClass + " " + builder.activeBlock.data("addBg");
    str = str.trim();
    builder.activeBlock.attr("data-add", str);
  });
  
  // Thumb Click
  $("body").on("click", ".block-thumb", function(e){  e.preventDefault() });
  $("body").on("dblclick", ".block-thumb", function(e){  
    e.preventDefault();
    var data = {};
    data.type = "block";
    data.src = $(this).data("src");
    data.categ = $(this).data("categ");
    data.subCateg = $(this).data("subcateg");
    data.target = builder.blocksParent;
    builder.insertNewBlock(data);
  });
  
  // Thumb Drag
  $("body").on("selectstart", ".block-thumb", function(e){      
    e.preventDefault && e.preventDefault();
    this.dragDrop && this.dragDrop(); 
    return false;
  });
  $("body").on("dragstart", ".block-thumb", function(e){
    e.originalEvent.dataTransfer.setData("type", "block");
    e.originalEvent.dataTransfer.setData("src",$(this).data("src"));
    e.originalEvent.dataTransfer.setData("categ",$(this).data("categ"));
    e.originalEvent.dataTransfer.setData("subCateg",$(this).data("subcateg"));
    builder.deselectAll();
  });

  // Drop
  $('body').on('dragover', '.page-wrapper, .block', function (evt) { 
      evt.stopPropagation();
      evt.preventDefault(); 
  }).on('dragenter', '.page-wrapper, .block', function (evt) { 
      evt.stopPropagation();
      evt.preventDefault(); 
      builder.showHolder($(this), evt);
  }).on('dragleave', '.page-wrapper, .block', function(evt) {
      evt.stopPropagation();
      evt.preventDefault(); 
      builder.hideHolder($(this));
  }).on('drop', '.page-wrapper, .block', function (evt) { 
      evt.stopPropagation();
      evt.preventDefault(); 
      
      var data = {};
      data.type = evt.originalEvent.dataTransfer.getData("type");
      data.src = evt.originalEvent.dataTransfer.getData("src");
      data.categ = evt.originalEvent.dataTransfer.getData("categ");
      data.subCateg = evt.originalEvent.dataTransfer.getData("subCateg");
      data.target = $(this);
      
      builder.insertNewBlock(data);
  });
};

// BUILDER FUNCTIONS
// ==================================

// Utils
// ----------------------------------
function trimAll(str) {
  var val = str.replace(/\s+/g, " ");
  val = val.replace(/^\s+|$\s+/g, "");
  return val;
}

function prefixRegex(prefs) {
  var str = "(";
  var i = prefs.length;
  while(i--) {
    str += "^" + prefs[i] + "|\\s+" + prefs[i] + "|";
  }
  str = str.replace(/\|$/, "");
  str += ")\\S+";
  return new RegExp(str, "g");
}

function swapClass(regex, str, val) {
  if(str.match(regex)) {
    var newStr = str.replace(regex, " " + val + " "); // Police instaces where spaces are matched
    return trimAll(newStr); // Trim unwanted spaces
  } else {
    var newStr = str + " " + val;
    return trimAll(newStr);
  }
}
// Resize builder
// -----------------------------------
builder.resizeBuilder = function() {
  var hpanelMax = $(window).height() - 88;
  var bpanelMax = $(window).height();
  $(".builder-panel .tab-pane").height(bpanelMax).css({"overflow":"auto"});
  $(".helper-panel .tab-pane").height(hpanelMax).css({"overflow":"auto"});
}

// Navbar checkers
// -----------------------------------
builder.stickyNavbarExists = function() {
  return $("[data-navbar='sticky']").length > 0 ? true : false
}

builder.navbarExists = function() {
  return $("[data-navbar]").length > 0 ? true : false
}

builder.isStickyNavbar = function(block) {
  return block.data("navbar") == "sticky";
}

// Insert NewBlock
// -----------------------------------
builder.insertNewBlock = function(data) {

  // Police work
  if(!data.target || data.target.length < 1) return;
  
  if(data.type != "block") {
    return;
  }
  
  if($(".page-wrapper").attr("data-editmode") == "true") {
    builder.hideHolder($target);
    alert("Exit Block editing mode first!");
    return;
  }
  
  if($(".page-wrapper [data-navbar]").length > 0 && data.categ == "navbar") {
    var navId = "#" + $(".page-wrapper [data-navbar]").attr("id");
    alert("You can't have 2 navbars. A navbar named [" + navId + "] already exists !\n\nDelete the first one first!");
    builder.hideHolder(data.target);
    return;
  }      
  
  // Get ID
  var blockId = prompt("Enter Block ID", "new-block-" + (builder.dropCount + 1));
  
  // Only proceed if supplied
  if(blockId) {
  
    // Prepare loader
    var $loader = $(builder.loaderCode);
    
    // Check for sticky navs
    if(data.subCateg == "sticky") {
      alert("Sticky navbar detected! It will be placed at the very top.");
      $(".page-wrapper").prepend($loader);
      
    } else {
      // ...else insert loader normal way
      if(data.target.hasClass("block")) {
        if(data.target.hasClass("drop-before")) {
          $loader.insertBefore(data.target);
        }else {
          $loader.insertAfter(data.target);
        }
      } else {
        data.target.append($loader);
      } 
    }

    // Hide placeholder
    builder.hideHolder(data.target);        
    
    // Get file
    $.ajax({
      crossOrigin: true,
      url: data.src,
      dataType: "html",
      success: function(val) {
        // Counts
        builder.dropCount++;
        
        // Append contents
        var $markup = $(val);
        $markup.attr("id", blockId);
        $loader.append($markup);
        $loader.find(".loader-anim").fadeOut().remove();
        $markup.unwrap();
        
        // Init new block
        var $newBlock = $("#" + blockId);
        builder.initBlock($newBlock);
        
        // Navigate to block position
        window.location.hash = "#" + blockId;
        
        // Cleanup
        builder.stripBlockComments();
        
      },
      error: function(err) {
        alert("An unhandled error occured!");
        $loader.remove();
      }            
    });

  } else {
    builder.hideHolder(data.target);
  }

};


// Get block list
// ---------------------------------
builder.getBlockList = function(cat) {
  var list = "";
  
  for (var i=0; i < builder.opts.blockList.length; i++) {
    var block = builder.opts.blockList[i];

    if(block.categ == cat || cat == "all") {
      var title = block.title;
      var file = builder.opts.dir + block.src;
      var categ = block.categ;
      var subCateg = block.subCateg;
      var img = (block.img)? builder.opts.dir + block.img : builder.opts.dir + block.src.replace("code", "png");
    
      list += "<li class='col-sm-12'><a href='#' title='drag or double click to insert' class='block-thumb' id='block-thumb-" + i + "'' draggable='true' data-src='" + file + "' data-categ='" + categ + "' data-subcateg='" + subCateg + "'>";
      list += "<img src='" + img + "' alt='' />";
      list += "<h4 class='font-cond lts-sm case-u'>" + title + "</h4></a></li>";
    
    }
  }
  
  return list;
};

// Show place holder
// -----------------------------------
builder.showHolder = function(target, e) {
  var hMid = Math.floor(target.height() / 2);
  var posY = target.offset().top;
  var mouseY = e.originalEvent.pageY;
  var relPosY = mouseY - posY;

  if(relPosY < hMid) {
    target.removeClass("drop-after").addClass("drop-before");
  } else {
    target.removeClass("drop-before").addClass("drop-after");
  }
}

// Hide place holder
// -----------------------------------
builder.hideHolder = function(target) {
  target.removeClass("drop-before drop-after drop-after-alt");
};

// Change ID
// -----------------------------------
builder.changeBlockId = function(block, oldId, newId, logHist) {
  if(block && newId) {
    block.attr("id", newId);
    $(".builder-panel .sel-id").html("#" + newId).attr("href", "#" + newId);
    if(logHist) {
      var entry = {cmd:"change-id", block:block, oldId:oldId, newId:newId, details:"From #" + oldId + " to #" + newId, undone:false};
      builder.hist.push(entry);
    }
  }
};

// Move Down
// -----------------------------------
builder.moveBlockDown = function(block, logHist)  {
  var index = block.index();
  var newIndex = cycleForward(index, $(".block").length);
  
  if(builder.isStickyNavbar(block)) {
    alert("Sorry, but you can't move a sticky nav from the top!");
    return;
  }
  
  block.insertIndex(newIndex);
  $(".builder-panel .sel-pos").html("[ " + block.index() + " ]");
  
  if(logHist) {
  var entry = {cmd:"down", block:block, oldIndex:index, newIndex:newIndex, details:"From position [" + index + "] to [" + newIndex + "]", undone:false};
    builder.hist.push(entry);
  }
};

// Move To Bottom
// -----------------------------------
builder.moveBlockToBottom = function(block, logHist)  {
  var index = block.index();
  var newIndex = $(".block").length - 1;
  
  if(builder.isStickyNavbar(block)) {
    if(!confirm("Do you really want to move the sticky nav from the top?")) {
      return;
    }
  }
  
  block.insertIndex(newIndex);
  $(".builder-panel .sel-pos").html("[ " + block.index() + " ]");
  if(logHist) {
    var entry = {cmd:"down", block:block, oldIndex:index, newIndex:newIndex, details:"From position [" + index + "] to [" + newIndex + "]", undone:false};
    builder.hist.push(entry);
  }
};

// Move Up
// -----------------------------------
builder.moveBlockUp = function(block, logHist)  {
  var index = block.index();
  var newIndex = cycleBack(index, $(".block").length);
  
  if(newIndex == 0 && $("[data-navbar='sticky']").index() == 0) {
    alert("Sorry but the current sticky navbar [#" + $("[data-navbar='sticky']").attr("id") + "] cannot be displaced from the top!");
    return;
  }
  block.insertIndex(newIndex);
  $(".builder-panel .sel-pos").html("[ " + block.index() + " ]");
  if(logHist) {
    var entry = {cmd:"up", block:block, oldIndex:index, newIndex:newIndex, details:"From position [" + index + "] to [" + newIndex + "]", undone:false};
    builder.hist.push(entry);
  }
};

// Move To Top
// -----------------------------------
builder.moveBlockToTop = function(block, logHist)  {
  var index = block.index();
  var newIndex = 0;
  
  if($("[data-navbar='sticky']").index() == 0) {
    if(confirm("The current sticky navbar [#" + $("[data-navbar='sticky']").attr("id") + "] cannot be displaced from the top!\n Move to position [1] instead? ")) {
      newIndex = 1;
    } else {
      return;
    }
  }

  block.insertIndex(newIndex);
  $(".builder-panel .sel-pos").html("[ " + block.index() + " ]");  
  
  if(logHist) {
    var entry = {cmd:"up", block:block, oldIndex:index, newIndex:newIndex, details:"From position [" + index + "] to [" + newIndex + "]", undone:false};
    builder.hist.push(entry);
  }
};

// Clone
// -----------------------------------
builder.cloneBlock = function(block)  {
  builder.cloneCount++;
  var $blockClone = block.clone();
  var cloneId = "clone-" + builder.cloneCount;
  $blockClone.attr("id", cloneId);
  $blockClone.data(block.data());
  $blockClone.insertAfter(block);
  $blockClone.find(".id-val").html("#" + cloneId);
  var entry = {cmd:"clone", block:$blockClone, details:"Copied from #" + block.attr("id") + " as #" + cloneId, undone:false};
  builder.hist.push(entry);
  return cloneId;
};

// Remove
// -----------------------------------
builder.removeBlock = function(block)  {
  if(confirm("Remove this block?")) {
    builder.deselectBlock(block);
    builder.destroySliders(block);
    var entry = {cmd:"remove", block:block.clone(), prev:block.prev(), next:block.next(), data: block.data(), details:"Deleted #" + block.attr("id"), undone:false};
    block.remove();
    builder.hist.push(entry);
    builder.closePanel();
  }
};

// Reset
// -----------------------------------
builder.resetBlock = function(block)  {
  if(builder.hist.entries.length > 0) {
    var toDel = block.attr("class");
    var toAdd = block.data("initClass");
    
    if(toDel != toAdd) {
      block.attr("class", toAdd);
      block.data("activeBg", block.data("initBg"));
      block.data("activeBorder", block.data("initBorder"));
      block.data("activeOverlay", block.data("initOverlay"));
      var entry = {cmd:"reset-class", block:block, deleted:toDel, added:toAdd, details:"Reset to <span class='fg-green'>'" + toAdd + "'</span>", undone:false};
      builder.hist.push(entry);
    } else {
      alert("There is nothing to reset!");
    }
  } else {
    alert("There is nothing to reset!");
  }
};

// Close Panel
// -----------------------------------
builder.closePanel = function() {
  $(".builder-panel").removeClass("open");  
  if(builder.activeBlock) {
    builder.deselectBlock(builder.activeBlock);
    builder.activeBlock = null;
  }
};

// Deselect All
// -----------------------------------
builder.deselectAll = function() {
  if(builder.activeBlock) {
    builder.deselectBlock(builder.activeBlock);
    builder.activeBlock = null;
  }
}

// Deselect Block
// -----------------------------------
builder.deselectBlock = function(block) {
  builder.activeBlock = null;
  builder.prevBlock = block;
  block.attr("data-edit", "false");
  builder.blocksParent.attr("data-editmode", "false");

  $(".builder-panel").removeClass("selected nav-selected block-selected");

  block.find("[contenteditable]").attr("contenteditable", "false");
  block.find("[data-edit]").attr("data-edit", "false");
  block.find("[data-scroll]").attr("data-scroll", "true");
  block.find("[data-swipebox]").attr("data-swipebox", "true");
  block.find("[data-hidden]").attr("data-hidden", "true");
  builder.initSliders(block);
};

// Get border opt
// -----------------------------------
builder.getBorderOptVal = function(block) {
  var v = 0;
  var str = block.data().activeBorder;
  if(str.match(/border-t+border-b+/)) {
    v = 2;
  } else if(str.match(/border-t/)) {
    v = 1;
  } else if(str.match(/border-b/)) {
    v = -1;
  }
  
  return v;
}

// Set border opt
// -----------------------------------
builder.setBorderOpt = function(block) {
  var v = ["0"];
  
  var str = block.data().activeBorder;
  if(str.match(/border-t.*border-b|border-b.*border-t/)) {
    v[0] = "2";
  } else if(str.match(/border-t/)) {
    v[0] = "1";
  } else if(str.match(/border-b/)) {
    v[0] = "-1";
  } 
  
  $(".bb-radio").val(v);
}

// Select Block
// -----------------------------------
builder.selectBlock = function(block) {
  $(".block[data-edit='true']").each(function(e) {
    builder.deselectBlock($(this));
  });
  builder.activeBlock = block;
  
  $(".builder-panel .sel-id").html("#" + block.attr("id")).attr("href", "#" + block.attr("id"));
  $(".builder-panel .sel-pos").html("[ " + block.index() + " ]");
  block.attr("data-edit", "true");
  builder.blocksParent.attr("data-editmode", "true");

  if(block.data("navbar")) {
    $(".builder-panel").addClass("open selected nav-selected");
    block.find(".navbar-nav").removeClass("hide-nav");
  } else {
    $(".builder-panel").addClass("open selected block-selected");
    builder.setBorderOpt(block);
  }
  
  $(".tab-links li").removeClass("active");
  $(".tab-links [href='#styles-tab']").parent().addClass("active");
  $(".builder-panel .tab-pane").removeClass("active");
  $("#styles-tab").addClass("active");
  
  block.find("[contenteditable]").attr("contenteditable", "true");
  block.find("[data-edit]").attr("data-edit", "true");
  block.find("[data-scroll]").attr("data-scroll", "false");
  block.find("[data-swipebox]").attr("data-swipebox", "false");
  block.find("[data-hidden]").attr("data-hidden", "false");
  builder.destroySliders(block);
};

// Switch classes
// -----------------------------------
builder.switchClass = function(block, addVal, delVal, dataVal, logHist)  {
  if(delVal != addVal) {
    block.removeClass(delVal).addClass(addVal);
    block.data(dataVal, addVal);
    var dets = "";
    if(delVal != "") dets += "Removed <span class='green'>' " + delVal + " '</span>";
    if(delVal != "" && addVal != "") dets += "<br/>";
    if(addVal != "") dets += "Added <span class='green'>' " + addVal + " '</span>";
    if(logHist) {
      var entry = {cmd:"change-class", block:block, added:addVal, deleted:delVal, dataKey:dataVal, details:dets, undone:false};
      builder.hist.push(entry);
    }
  }
};

// Init Block
// -----------------------------------
builder.initBlock = function(block, categ) {
  var initClass = block.attr("class");
  var initStyle = block.attr("style");
  block.data("initClass", initClass);
  block.data("activeClass", initClass);
  block.data("initStyle", initStyle);
  block.data("activeStyle", initStyle);
  if(categ) block.data("categ", categ);
  
  for(var i=0; i < builder.opts.classGroups.length; i++) {
    var valStr = "";
    var valCol = initClass.match(builder.opts.classGroups[i].regex);
    if(valCol) valStr = valCol.join(" ");
    block.data(builder.opts.classGroups[i].initKey, valStr);
    block.data(builder.opts.classGroups[i].activeKey, valStr);
  }
  
  var id = block.attr("id") ? "#" + block.attr("id") : "Block";
  block.data("startCom", "Start " + id);
  block.data("endCom", "/End " + id);  
  
  builder.initBlockPlugins(block);

  if(block.data("navbar")) {
    if(!block.data("initialized")) {
      setupNav(block);
    }
    
    if(block.data("navbar") == "sticky") {
      var dataDel = block.attr("data-del");
      var dataAdd = block.attr("data-add");
      if(dataDel) {
        var delBgCol = dataDel.match(/\S+-bg|inverse/g);
        if(delBgCol) {
          block.data("delBg", delBgCol.join(" "));
        } else {
          block.data("delBg", "");
        }

        var delBorderCol = dataDel.match(/border-\S+/g);
        if(delBorderCol) {
          block.data("delBorder", delBorderCol.join(" "));
        } else {
          block.data("delBorder", "");
        }
      }
      
      if(dataAdd) {
        var addBgCol = dataAdd.match(/\S+-bg|inverse/g);
        if(addBgCol) {
          block.data("addBg", addBgCol.join(" "));
        } else {
          block.data("addBg", "");
        }
        
        var addBorderCol = dataAdd.match(/border-\S+/g);
        if(addBorderCol) {
          block.data("addBorder", addBorderCol.join(" "));
        } else {
          block.data("addBorder", "");
        }
        
      }
    }
  }
};

// Init Sliders
// -----------------------------------
builder.initSliders = function(block) {
  block.find('[data-call="bxslider"][data-bxinit="false"]').each(function(index) {
    if(!$(this).attr("bxindex")) {
      var slider = $(this).bxSlider();
      var i = bxSliders.push(slider) - 1;
      slider.attr("bxindex", i);
    } else {
      var i = parseInt($(this).attr("bxindex"));
      bxSliders[i].reloadSlider();
    }
  });
};

// Recover Sliders
// -----------------------------------
builder.recoverSliders = function(block) {
  block.find('[data-call="bxslider"][data-bxinit="false"]').each(function(index) {
    var i = parseInt($(this).attr("bxindex"));
    bxSliders[i] = $(this).bxSlider();
  });
};
// Init Block Plugins
// -----------------------------------
builder.initBlockPlugins = function(block) {

  // Sliders
  builder.initSliders(block);
  
  // Just refresh swiper (doesn't play nice with $.each)
  $("[data-swipebox='true']").swipebox();
  
  // more plugins ...
};

// Destroy Sliders
// -----------------------------------
builder.destroySliders = function(block) {
  block.find('[data-call="bxslider"][data-bxinit="true"]').each(function(index) {
    if($(this).attr("bxindex")) {
      var i = parseInt($(this).attr("bxindex"));
      bxSliders[i].destroySlider();
    }
  });
};

// Destroy all Sliders
// -----------------------------------
builder.destroyAllSliders = function() {
  for(var i=0; i < bxSliders.length; i++) {
    bxSliders[i].destroySlider();
  }
}

// Reload all Sliders
// -----------------------------------
builder.reloadAllSliders = function() {
  for(var i=0; i < bxSliders.length; i++) {
    bxSliders[i].reloadSlider();
  }
}

// doExport
// -----------------------------------
function doExport(code) {
  var name = $("#pageName").val();
  var title = $("#pageTitle").val();
  var t = (title)? title : "untitled";
  var fname = name? name : "export.html" ;
  fname = fname.match(/\.\w+$/) ? fname : fname + ".html";
  code = code.replace(/<title>.*<\/title>/, "<title>" + t + "</title>");
  var blob = new Blob([code], {type: "text/plain;charset=utf-8"});
  saveAs(blob, fname);
  $("#btn-export")[0].reset();
}

// dontExport
// -----------------------------------
function dontExport() {
  $("#btn-export")[0].reset();
  $("#purchase-modal").modal('show');
}

// Export Page
// -----------------------------------
builder.exportPage = function(){
  if(builder.canExport) {
    $("#btn-export")[0].working();
    builder.deselectAll();
    builder.destroyAllSliders();
    builder.addBlockComments();
    var code = getDocType() + $("html")[0].outerHTML;
    builder.reloadAllSliders();
    builder.stripBlockComments();
    code = code.replace(/<!-- start-dont-export -->[\s\S]*?<!-- end-dont-export -->/gm, "");
    runTabifier(code, doExport);
  } else {
    alert("It appears that your browser does not support file exporting!");
  }
};

// Add comments
// -----------------------------------
builder.addBlockComments = function() {
  $(".block").each(function(e) {
    $(this).before("\n<!-- " + $(this).data().startCom + " -->\n");
    $(this).after("\n<!-- " + $(this).data().endCom + " -->\n");
  });
}

// Strip comments
// -----------------------------------
builder.stripBlockComments = function() {
  for(var i=0; i < builder.parentNode.childNodes.length; i++) {
    if(builder.parentNode.childNodes[i].nodeType == 8) {
      builder.parentNode.removeChild(builder.parentNode.childNodes[i]);
    }
  }
}

// HISTORY
// ===================================
builder.hist = {};
builder.hist.index = 0;
builder.hist.undoCount = 0;
builder.cloneCount = 0;
builder.hist.entries = [];

// Update display
// -----------------------------------
builder.updateHistDisplay = function() {
  $("#undo-count").html(builder.hist.undoCount);
};

// Push history
// -----------------------------------
builder.hist.push = function(entry) {
  builder.hist.entries.push(entry);
  builder.hist.index = builder.hist.entries.length - 1;
  builder.hist.undoCount += 1;
  builder.updateHistDisplay();
};

// Clear history
// -----------------------------------
builder.hist.clear = function(entry) {
  builder.hist.entries = [];
  builder.hist.index = 0;
  builder.hist.undoCount = 0;
  builder.updateHistDisplay();
  builder.hist.list();
};

// Show history
// -----------------------------------
builder.hist.show = function() {
  if(builder.hist.entries.length > 0) {
    $("#hist-modal").modal("show");
    builder.hist.list();
  } else {
    alert("There is no history to show!");
  }
};

// List history
// -----------------------------------
builder.hist.list = function() {
  var str = "";
  for(var i=0; i < builder.hist.entries.length; i++) {
    var entry = builder.hist.entries[i];
    str += "<tr>";
    str += "<td>#" + entry.block.attr("id") + "</td>";
    str += "<td>" + entry.cmd + "</td>";
    str += "<td>" + entry.details + "</td>";
    str += "<td>" + (entry.undone ? "<span class='fg-blue'>undone</span>" : "<span class='fg-red'>active</span>") + "</td>";
    str += "<td>" + (entry.undone ? "none": "<a href='#' class='fg-green hist-table-undo' data-index='" + i + "'>undo</a>") + "</td>";
    str += "</tr>";
  }
  $("#hist-table tbody").html(str);
}

// Single undo
// -----------------------------------
$("body").on("click", ".hist-table-undo", function(e) {
  e.preventDefault();
  var index = parseInt($(this).data("index"));
  builder.hist.undo(index);
  builder.hist.list();
});

// History undo all
// -----------------------------------
builder.hist.undoAll = function(index) {
  if(builder.hist.undoCount != 0) {
    if(confirm("This does not guarantee a full recovery as some actions may have lost their initial context.\n\nContinue anyway?")) {
      var i = builder.hist.entries.length;
      while(i--) {
        builder.hist.undo(i);
      }
      builder.hist.list();
    }
  } else {
    alert("There is nothing to undo!");
  }
};

// History undo
// -----------------------------------
builder.hist.undo = function(index) {
  var entry = builder.hist.entries[index];
  if(!entry.undone) {
  
    switch(entry.cmd) {
      case "up":
        entry.block.insertIndex(entry.oldIndex);
        entry.undone = true;
        $(".builder-panel .sel-pos").html("[ " + entry.oldIndex + " ]");
      break;
      
      case "down":
        entry.block.insertIndex(entry.oldIndex);
        entry.undone = true;
        $(".builder-panel .sel-pos").html("[ " + entry.oldIndex + " ]");
      break;
      
      case "remove":
        var $block = entry.block;
        var $next = entry.next;
        var $prev = entry.prev;

        $block.data(entry.data);
        
        if($prev.length > 0) {
          $block.insertAfter($prev);
        } else if ($next.length > 0) {
          $block.insertBefore($next);
        } else {
          $(".page-wrapper").append($block);
        }
        
        builder.recoverSliders($block);
        entry.undone = true;
        
        if($block.data("navbar")) {
          var navbar = $($block.data("navbar"));
          if(!navbar.data().initialized) {
            setupNav(navbar);
          }
        }
        
      break;
      
      case "clone":
        var $block = entry.block;
        $block.remove();
        entry.undone = true;
      break;
      
      case "change-class":
        var $block = entry.block;
        $block.removeClass(entry.added).addClass(entry.deleted);
        $block.data(entry.dataKey, entry.deleted);
        entry.undone = true;
      break;
      
      case "reset-class":
        var $block = entry.block;
        $block.attr("class", entry.deleted);
        
        entry.undone = true;
      break;
      
      case "change-id":
        var $block = entry.block;
        builder.changeBlockId($block, entry.newId, entry.oldId, false);
        entry.undone = true;
      break;
      
      default:
        alert("OOPS! Last action cannot be undone because it remains unhandled.");
      break;
    }
    
    builder.hist.undoCount--;
    builder.updateHistDisplay();
    
  } 
};

// History go back
// -----------------------------------
builder.hist.back = function() {

  // Police work
  if(builder.hist.entries.length == 0) {
    alert("There is nothing yet to undo!");
    return;
  }

  if(builder.hist.index < 0) {
    alert("There is nothing to undo");
    builder.hist.index = 0;
    return;
  }

  var entry = builder.hist.entries[builder.hist.index];

  if(builder.hist.undoCount == 0) {
    alert("There is nothing left to undo");
    return;
  } else {
    while(entry.undone) {
      builder.hist.index -= 1;
      entry = builder.hist.entries[builder.hist.index];
    }
  }
  
  // Passed all checks
  builder.hist.undo(builder.hist.index);
  builder.hist.index -=1;
};


// EDITORS
// ==================================

// CODE EDITOR
// ----------------------------------
var codeEditor = {};

codeEditor.init = function() {

  $("body").on("click", "#btn-html", function(e) {
    e.preventDefault();
    codeEditor.target = builder.activeBlock;
    var code = codeEditor.target.html();
    $("#code-modal").modal({show:true});
    $("#code-text").val(code);
  });
  
  $("body").on("click", "#btn-code-save", function(e) {
    e.preventDefault();
    var val = $("#code-text").val();
    codeEditor.target.html(val);
    $("#code-modal").modal("hide");
  });
  
};

// TAG EDITOR
// ----------------------------------
var attrEditor ={};

attrEditor.init = function() {

  $("body").on("click", "[data-editor='attr'][data-edit='true']", function(e) {
    e.preventDefault();
    attrEditor.target = $(this);
    attrEditor.attr = attrEditor.target.data("attr");
    var val = prompt("Enter new [" + attrEditor.target.data("attr") + "] value", attrEditor.target.attr(attrEditor.attr));
    if(val) {
      attrEditor.target.attr(attrEditor.attr, val);
    }
  });
  
};

// FIELD EDITOR
// ----------------------------------
var fieldEditor = {};

fieldEditor.init = function() {

  $("body").on("click", "[data-editor='field'][data-edit='true']", function(e) {
    e.preventDefault();
    fieldEditor.target = $(this);
    var $modal = $("#field-modal");

    var $content = $modal.find(".modal-body");
    $content.html("");
    fieldEditor.inputs = [];
    var count = 0;

    getFields(fieldEditor.target.data("field"), fieldEditor.target);
    fieldEditor.target.find("[data-field]").each(function(index) {
      getFields($(this).data("field"), $(this));
    });
    
    $modal.modal({show:true});
    
    function getFields(val, el) {
      if(val && el) {
        var col = val.split(";");
        
        for(var i =0; i < col.length; i++) {
          var str = "";
          count++;
          var m = col[i].match(/(\w+)\[([^\)]+)\]/);
          var input = {target:el, title:m[2], attrib:m[1], id:"field-input-" + count};
          var titleParts = input.title.split(",");
          if(titleParts.length == 2) {
            input.title = titleParts[0];
            input.editor = titleParts[1];
          }          
          if(input.attrib != "html") {
            input.val = el.attr(input.attrib);
          } else {
            input.val = el.html();
          }
          str += '<div class="form-group"><label class="font-cond-l case-c">' + input.title + '</label>';
          str += '<div class="pos-rel"><input id="' + input.id + '" type="text" class="form-control" value="' + input.val + '"/></div></div>';
          $content.append(str);
          input.el = $("#" + input.id);
          
          if(input.editor) {
          
            switch(input.editor) {
            
              case "icon":
              
                input.el.parent().append('<a id="icon-btn-' + input.id + '" class="input-btn btn-primary"><i class="ti-plus"></i></a>');
                $("body").on("click", "#icon-btn-" + input.id, function(e) {
                  iconEditor.launch(input.el);
                });
                
              break;
            
            }

          }
          
          fieldEditor.inputs.push(input);
        }
      }
    }
    
  });
  

  $("body").on("click", "#btn-field-save", function(e) {
    e.preventDefault();
    for(var i=0; i < fieldEditor.inputs.length; i++) {
      var input = fieldEditor.inputs[i];
      if(input.attrib != "html") {
        input.target.attr(input.attrib, input.el.val());
      } else {
        input.target.html(input.el.val());
      }
    }
    $("#field-modal").modal("hide");
  });
  
};

// MENU NEW
// ----------------------------------
var menuPrompt = {};

menuPrompt.launch = function() {
  if(menuPrompt.iconTitle) {
    $("body").on("click", "#menu-new-title", function(e) {
      iconEditor.launch($("#menu-new-title"), menuPrompt.iconSelected);
    });
  }
  menuPrompt.modal.modal("show");
};

menuPrompt.iconSelected = function(newVal) {
  var iconStr = '<i class="' + newVal + '"></i>';
  $("#menu-new-title").val(iconStr);
};

menuPrompt.close = function() {
  menuPrompt.target = null;
  $("body").off("click", "#menu-new-title");
  menuPrompt.modal.modal("hide");
};

menuPrompt.init = function() {
  menuPrompt.modal = $("#menu-new-modal");  
  
  $("body").on("click", "[data-editor='menu-new']", function(e) {
    e.preventDefault();
    menuPrompt.target = $(this);
    menuPrompt.nav = $($(this).attr("data-menu"));
    menuPrompt.iconTitle = (menuPrompt.nav.attr("data-icon-title") == "true")? true : false; 

    menuPrompt.launch();
  });
  
  $("body").on("click", "#btn-menu-new-insert", function(e) {
    e.preventDefault();
    var title = $("#menu-new-title").val();
    var url = $("#menu-new-url").val();

    if(title) {
      menuPrompt.nav.append("<li><a href='" + url + "'" + menuPrompt.nav.data("menu-attr") + ">" + title + "</a></li>");
      menuPrompt.close();
    }
  });

};  

// MENU EDITOR
// ----------------------------------
var menuEditor = {};

menuEditor.launch = function(target) {
  $("#menu-title").val(target.html());
  $("#menu-url").val(target.attr("href"));
  
  if(menuEditor.iconTitle) {
    $("body").on("click", "#menu-title", function(e) {
      iconEditor.launch($("#menu-title"));
    });
  }
  
  menuEditor.modal.modal("show");
};

menuEditor.close = function() {
  $("body").off("click", "#menu-title");
  menuEditor.modal.modal("hide");
};

menuEditor.init = function() {
  menuEditor.modal = $("#menu-modal");
  
  $("body").on("click", "[data-editor='menu'][data-edit='true']", function(e) {
    e.preventDefault();
    menuEditor.target = $(this);
    menuEditor.nav = menuEditor.target.parent().parent();
    menuEditor.iconTitle = (menuEditor.nav.attr("data-icon-title") == "true")? true : false; 
    menuEditor.launch(menuEditor.target);
  });
  
  $("body").on("click", "#btn-menu-save", function(e) {
    e.preventDefault();
    var title = $("#menu-title").val();
    var url = $("#menu-url").val();
    if(title) {
      menuEditor.target.html(title);
    }
    if(url) {
      menuEditor.target.attr("href", url);
    }
    menuEditor.close();
  });
  
  $("body").on("click", "#btn-menu-up", function(e) {
    e.preventDefault();
    var parent = menuEditor.target.parent();
    var i = cycleBack(parent.index(), menuEditor.nav.children().length);
    parent.insertIndex(i);
  });
  
  $("body").on("click", "#btn-menu-down", function(e) {
    e.preventDefault();
    var parent = menuEditor.target.parent();
    var i = cycleForward(parent.index(), menuEditor.nav.children().length);
    parent.insertIndex(i);
  });
  
  $("body").on("click", "#btn-menu-del", function(e) {
    e.preventDefault();
    var go = confirm("Delete this link ?");
    if(go) {
      var parent = menuEditor.target.parent();
      parent.remove();
      menuEditor.close();
    }
  });  
};

// ICON EDITOR
// ----------------------------------
var iconEditor = {};
iconEditor.regex = prefixRegex(["fa-", "ti-", "lc-", "et-"]);
iconEditor.modal = $("#icons-modal");
iconEditor.cbFunc = function(){};

iconEditor.switchIcons = function(str, val) {
  var newStr = "";
  if(str.match(iconEditor.regex)) {
    newStr = str.replace(iconEditor.regex, " " + val);
    return trimAll(newStr);
  } else {
    newStr = str + " " + val;
    return trimAll(newStr);
  }
}

iconEditor.launch = function(target, cbFunc) {
  iconEditor.target = target;
  iconEditor.cbFunc = cbFunc;
  $("#icons-modal").modal("show");
  $(".icon-selector-list li").removeClass("active");
};

iconEditor.close = function() {
  iconEditor.target = null;
  iconEditor.cbFunc = function(){};
  $("#icons-modal").modal("hide");
};

iconEditor.init = function() {

  $("body").on("click", "[data-editor='icon'][data-edit='true']", function(e) {
    iconEditor.launch($(this));
  });
  
  $("body").on("click", ".icon-selector-list li", function(e) {
    e.preventDefault();
    $(".icon-selector-list li").removeClass("active");
    $(this).addClass("active");
    var val = $(this).data("val");

    if(iconEditor.target.is("input")) {
      var inputVal = swapClass(iconEditor.regex, iconEditor.target.val(), val);
      iconEditor.target.val(inputVal);
    } else {
      var classVal = swapClass(iconEditor.regex, iconEditor.target.attr("class"), val);
      iconEditor.target.attr("class", classVal);
    }
    
    if(iconEditor.cbFunc) iconEditor.cbFunc(val);
  });
  
}
      
// SETUP
// ===================================
function insertBuilder(path) {
  $.ajax({
    crossOrigin: true,
    url: path,
    dataType: "html",
    success: function(data) {
      $("body").append(data);
      builder.init();
      iconEditor.init();
      fieldEditor.init();
      codeEditor.init();
      attrEditor.init();
      menuEditor.init();
      menuPrompt.init();
    },
    error: function(err) {
     // Some silly browsers like chrome block AJAX requests on local files 
     showLoadError();
    }            
  });
}

function showLoadError() {
  var modal = '<div id="load-error" class="bg-black-90pc valigner" style="top:0;left:0;width:100%;height:100%;z-index:10000;position:fixed">' +
              '<div class="v-middle">' +
              '<div class="bg-white vcard pad-30 hcenter pos-rel" style="width:450px">' +
              '<a id="close-error" href="javascript:closeLoadError()" class="btn-black-80 pos-abs-tr" style="padding:10px 15px; font-size:11px"><i class="ti-close"></i></a>' +
              '<div class="hmedia">' +
              '<div class="media-cell v-top"><i class="fa fa-warning fg-gold fs-400"></i></div>' +
              '<div class="text-cell"><h5 class="fg-text-d font-cond-b" style="font-size:17px">Please Turn Off AJAX Restrictions!</h5>' +
              '<p>The Builder Panel cannot be loaded because your browser is <b>blocking local AJAX connections</b>! Try the following remedies:</p>' +
              '<ul class="font-cond-l">' +
                '<li>Turn off the restrictions on your browser</li>' +
                '<li><i>or</i> Load this page from a server</li>' +
                '<li><i>or</i> Use an unrestricted browser like Firefox</li>' +
              '</ul>' +
             
              '</div></div></div></div>';
              
  $("body").append(modal);
}

function closeLoadError() {
  $("#load-error").remove();
}

$().ready(function() {
  if(!isSmallScreen()) insertBuilder("builder.code");
});