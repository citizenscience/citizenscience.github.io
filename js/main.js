$(function () {
    $("#main-splash").css({
        height: $(window).height(),
        padding: "" + ($(window).height() * 0.2) + "px 0 0 0"
    });

    $("#main-splash a.btn").on("click", function (e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $("#main-sections").offset().top - 20
        }, 1000);
    });

    $("#main-sections").css({
        height: $(window).height()
    });

    var first_image_height = $("#main-sections .thumbnail:first img").height();
    var last_image_height = $("#main-sections .thumbnail:last img").height();
    var padding = (first_image_height - last_image_height) / 2;
    $("#main-sections .thumbnail:last img").css({
        padding: "" + padding + "px 0"
    });


});
