// for localhost settings
var islocal = true,
  port = 8778,
  host = 'localhost';
// for website settings
if (process.env.OPENSHIFT_NODEJS_IP) {
  port = process.env.OPENSHIFT_NODEJS_PORT;
  host = process.env.OPENSHIFT_NODEJS_IP;
  islocal = false;
}

module.exports = {
  'islocal': islocal,
  'port': port,
  'host': host,
  'token_secret': 'secret-secret-secret',
  'serverSalt': 'salt-secret',
  db: {
    name: islocal ? 'mexy-local' : 'mexy',
    url: islocal ? 'localhost/' : process.env.OPENSHIFT_MONGODB_DB_URL,
  },
  'mailing': {
    service: 'Mailgun',
    from: 'MEXY.PRO <user@mexy.pro>',
    user: 'user@mexy.pro',
    pass: 'ab8979a8b789a9b79a8b9877b9a87b97'
  },
  cloudinary: {
    cloud_name: 'mexy-pro',
    api_key: '111222112121212',
    api_secret: 'secret-secret-secret'
  }

};