'use strict';

const expressJwt = require('express-jwt');
const config = require('../config/');

module.exports = (app) => {
    app.use('/api/*', expressJwt({
        secret: config.jwt.secret
    }).unless({
        path: [
            '/api/login',
            '/api/register',
            '/api/events/list',
            new RegExp('/api/events/view.*/', 'i'),
            '/api/orgs/list',
            new RegExp('/api/organizations/view.*/', 'i'),
        ]
    }));

    app.post('/api/register', require('./auth/controller').register);
    app.post('/api/refresh', require('./auth/controller').refreshToken);
    app.post('/api/login', require('./auth/controller').login);

    app.get('/api/events/list', require('./event/controller').list);
    app.get('/api/events/view/:eventId', require('./event/controller').get);
    app.post('/api/events/create', require('./event/controller').create);
    app.post('/api/events/regsiter/:eventId', require('./event/controller').regsiter);

    app.get('/api/orgs/my', require('./organization/controller').list);
    app.get('/api/orgs/view/:orgId', require('./organization/controller').get);
    app.get('/api/orgs/events/:orgId', require('./organization/controller').events);
    app.post('/api/orgs/create', require('./organization/controller').create);
    app.post('/api/orgs/update/:orgId', require('./organization/controller').update);
    app.get('/api/orgs/follow/:orgId', require('./organization/controller').follow);
    //app.get('/api/user/checkin/:eventId', require('./user/controller').checkin);

    app.get('/api/user/profile', require('./user/controller').profile);
    app.get('/api/user/profile/:userId', require('./user/controller').profile);
    app.get('/api/user/list/:term', require('./user/controller').userList);
    app.get('/api/user/add/:userId/:orgId', require('./user/controller').userAdd);
    app.post('/api/user/update/:userId', require('./user/controller').userUpdate);

  // All routes should redirect to root url
};
