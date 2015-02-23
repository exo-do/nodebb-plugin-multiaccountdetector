
(function(MultiAccount) {
	// Funcion para deteccion de multicuenta por cookie
	init = function()
	{
		$(window).on('action:ajaxify.contentLoaded', function () {
			try{
				if( !localStorage.mus && (app.user.uid > 0) )
					localStorage.mus = app.user.uid;
				if( (app.user.uid != localStorage.mus) && (app.user.uid > 0) )
				{
					socket.emit('plugins.multiAccountAccessDetected',{ user:app.user.uid, user2:localStorage.mus });
					localStorage.mus = app.user.uid;
				}
			}catch(e){
			}
		});
	}

	init();

})(window.MultiAccount);

