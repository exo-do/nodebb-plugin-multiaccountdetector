
(function(MultiAccount) {
	// Funcion para deteccion de multicuenta por cookie
	init = function()
	{
		$(window).on('action:ajaxify.contentLoaded', function () {
			if( !localStorage.mus && (app.username != "[[global:guest]]") )
				localStorage.mus = app.username;
			if(app.username != localStorage.mus && app.username != "[[global:guest]]")
			{
				socket.emit('plugins.multiAccountAccessDetected',{ user:app.username, user2:localStorage.mus });
				localStorage.mus = app.username;
			}
		});
	}

	init();

})(window.MultiAccount);

