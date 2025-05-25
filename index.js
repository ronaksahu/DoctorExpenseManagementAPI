var server = require('./utility/server');
var indexRouter = require('./routes/index');
server.appWithRoute(indexRouter);