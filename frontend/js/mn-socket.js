!function(){
    const production = location.hostname === 'mexy.pro';
	const port = production ? 8443 : location.port;
	if(production && location.protocol != 'https:') location.protocol = 'https:';
	const host = production ? 'mexy-lepta.rhcloud.com' : '';
	socket = io(host+':'+port,{transports: ['websocket'],'reconnectionAttempts': 5});
}();
log.until('connecting...');
socket
.on('connect',() => {
	log.until();
	connected=1;
	f_loadingHide();
	socket.sendBuffer = [];
	f_App_authorize();
})
.on('disconnect', (v) => {
	connected=0;
	f_dc_emit('u_login');
})
.on('app_local_mode', (v) => {
	app_local_mode=1;
})
.on('error', (v) => {
	log.until('socket error');
	// 
});
function f_socket_authorized(){
// set App listeners after authorization
socket.on('newm', (v) => {//new message
	chat.received(v);
});
socket.on('viewedm', (v) => {
	chat.viewed(v);
});
socket.on('typing', (v) => {
	chat.typing(v);
});
socket.on('contact_online', (v) => {
	f_known_people.online(v.uid, 1);
	f_dc_emit('contacts');
});
socket.on('contact_offline', (v) => {
	f_known_people.online(v.uid, 0);
	f_dc_emit('contacts');
});
socket.on('userdata', (v) => {
	// my userdata
	for(let s in v) U.userdata[s] = v[s];
	f_dc_emit('u_data');
});
socket.on('push', (v) => {
	// server says something else
});
}