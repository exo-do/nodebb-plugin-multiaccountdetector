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
    controllers.getErrorPage = function (req, res, next) {
      //Renderiza la plantilla topic-error en el futuro enlace del foro //servidor.com/topicerror
      res.render('admin', {});
    };
    //Creamos las direcciones para poder ver los registros
    params.router.get('/admin/multiaccount',middleware.buildHeader, controllers.getErrorPage);
    params.router.get('/api/admin/multiaccount', controllers.getErrorPage);
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
      
      db.getSortedSetRevRange('ip:'+ips[0].ip+':uid', 0, 10, function(err, ips) {
        //console.log('Resultados con igual IP:');
        //console.log(err);
        //console.log(ips);
        // Obtenemos y guardamos los usuarios que han usado esa ip
        multiAccountDetector.ips = ips;
        multiAccountDetector.loggedUser = data;
        multiAccountDetector.ipsLoop(0); // Recorremos los usuarios con igual ip
      });
    });
  }


  multiAccountDetector.ipsLoop = function(i)
  {
    if(i < multiAccountDetector.ips.length)
    {
      if( multiAccountDetector.loggedUser != multiAccountDetector.ips[i] )
      { // Si no tienen el mismo id, es que no son el mismo usuario -> MULTICUENTA
        User.getUserField(multiAccountDetector.loggedUser, 'username', function(err, username1){
          User.getUserField(multiAccountDetector.ips[i], 'username', function(err, username2){
            // Insertamos un array [username1, username2, ip, tiempo]
            var message = '["'+username1+'","'+username2+'","'+multiAccountDetector.ip+'","'+Date.now()+'"]';
            db.setAdd('multiaccount', message);
          });
        });
      }
      multiAccountDetector.ipsLoop(i+1); // Recorremos el siguiente
    }
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
        // Insertamos un array [username1, username2, ip, tiempo]
        var message = '["'+username1+'","'+username2+'",null,"'+Date.now()+'"]';
        db.setAdd('multiaccount', message);
      });
    });
  };

module.exports = multiAccountDetector;
