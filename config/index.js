'use strict';

module.exports = {
    jwt: {
        expires: 3600, // in secconds
        tokenLiveTime: 24 * 60 * 60,
        secret: 'SNSkkcTTibRl5Csu7DpArEfCZ5zIa6pU59gjEN9T8Wk7T5ud1QrTjfQ1VLRPH'
    },
    ip: process.env.IP,
    port: process.env.PORT || 3400,
    mysql: {
        host: 'localhost',
        username: 'root',
        password: 'passWord',
        dbname: 'smartevents'
    },
    organizationUserRoles: {
        admin: 1,
        follower: 2,
    }, 
    statuses: {
        user: {
            pending: 0,
            active: 1,
            cancelled: 2
        }, 
        event: {
            draft: 0,
            published: 1,
            cancelled: 2
        },
        organization: { 
            hold: 0,
            active: 1,
            closed: 2
        }
    },
    eventUserStatuses: {
      registered: 1,
      checked: 2  
    }
};
