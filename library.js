'use strict';

var User = module.parent.require('./user');
var Topic = module.parent.require('./topics');
var db = module.parent.require('./database');
var SocketAdmins = module.parent.require('./socket.io/admin');
var SocketPlugins = module.parent.require('./socket.io/plugins');
//var postTools = module.parent.require('./postTools');

var multiAccountDetector = {};


  multiAccountDetector.init = function(params, callback) {
    var middleware = params.middleware,
    controllers = params.controllers;
    controllers.getMultiAccount = function (req, res, next) {
      // Renderiza la plantilla
      res.render('admin', {});
    };
    //Creamos las direcciones para poder ver los registros
    params.router.get('/admin/multiaccount',middleware.buildHeader, controllers.getMultiAccount);
    params.router.get('/api/admin/multiaccount', controllers.getMultiAccount);
    callback();
  };

  multiAccountDetector.getAuth = function(data)
  {
    //console.log('Data: ');
    //console.log(data);

    User.getIPs(data, 4, function(err, ips){
      //console.log(ips[0].ip);
      // Obtenemos las ips del usuario, concretamente la ultima que esta usando
      multiAccountDetector.ip = ips[0].ip;
      
      db.getSortedSetRevRange('ip:'+ips[0].ip+':uid', 0, 10, function(err, users) {
        //console.log('Resultados con igual IP:');
        //console.log(err);
        //console.log(ips);
        // Obtenemos y guardamos los usuarios que han usado esa ip
        User.getUsersData(users, function(err, usData){
          var notBanned = 0;
          var sameUsers = "0";
          var message = "";
          for(var i=0;i<usData.length;i++)
          {
            if(!usData[i].banned)
            { // Compruebo el numero de multicuentas activas, pues solo permito 2
              notBanned++;
            }
            sameUsers = sameUsers + "," + usData[i].username;
          }

          if(notBanned > 2)
          { // Si tengo mas de dos cuentas con la misma ip y no baneadas
            // Baneo a la actual (si no es admin)
            User.isAdministrator(data, function(err, admin){
              if(!admin)
              {
                User.ban(data);
                message = '["'+usData[0].username+'","['+sameUsers+']","'+multiAccountDetector.ip+'","'+Date.now()+'", "banned"]';
                db.setAdd('multiaccount', message);
              }
              else
              {
                message = '["'+usData[0].username+'","['+sameUsers+']","'+multiAccountDetector.ip+'","'+Date.now()+'", null]';
                db.setAdd('multiaccount', message);
              }
            });
          }
          else
          {
            message = '["'+usData[0].username+'","['+sameUsers+']","'+multiAccountDetector.ip+'","'+Date.now()+'", null]';
            db.setAdd('multiaccount', message);
          }
        });
      });
    });
  }

  multiAccountDetector.addNavigation = function(custom_header, callback) {
    // Añadimos al menu de admin el acceso a ver los registros
    custom_header.plugins.push({
      route: '/multiaccount',
      icon: '',
      name: 'MultiAccount'
    });

    callback(null, custom_header);
  }


  // LLamadas por sockets
  SocketAdmins.getMultiAccountMessages = function (socket, data, callback) {
    //console.log('received socket');
    // Recivimos la peticion para mostrar las detecciones (al hacer por sockets de admin, solo se responden
    // las peticiones de admins!)
    db.getObject('multiaccount', callback);
  };

  SocketAdmins.deleteMultiAccountMessages = function (socket, data, callback) {
    //console.log('received socket');
    // Recibimos la peticion de borrar el regitro
    db.delete('multiaccount', callback);
  };

  SocketPlugins.multiAccountAccessDetected = function (socket, data, callback) {
    //console.log(data);
    // Deteccion de multicuenta por cookie, me viene por sockets
    User.getUserField(data.user, 'username', function(err, username1){
      User.getUserField(data.user2, 'username', function(err, username2){
        // Insertamos un array [username1, username2, ip, tiempo, accion]
        var message = '["'+username1+'","'+username2+'",null,"'+Date.now()+'", null]';
        db.setAdd('multiaccount', message);
      });
    });
  };

module.exports = multiAccountDetector;
