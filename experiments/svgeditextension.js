svgEditor.addExtension("Change Hooks", function() {
        return {
                elementChanged: function(e) {
                   console.log("ech",e)
                },
                selectedChanged: function(e) {
                   console.log("sch",e)
                },
                canvasUpdate: function(e) {
                   console.log("cu",e)
                },
        };
});
