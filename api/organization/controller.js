'use strict';
const _ = require('lodash');
const utils = require('../../lib/utils');
const DB = require('../../config/db');
const config = require('../../config');
const events = require('../event/controller');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// get list of user organizations (hosted or followed)
module.exports.list = (req, res) => {
    const user = req.user;
     DB.query(`SELECT o.id as id, o.name as name, o.image as image, o.location as location, ou.role,
        (SELECT COUNT(*) FROM event WHERE event.organizationId = o.id) as eventsCount,
        (SELECT COUNT(*) FROM organizationUser as ou WHERE ou.organizationId = o.id AND ou.role = 0)
         as followersCount
        FROM organization o LEFT JOIN organizationUser ou ON o.id=ou.organizationId 
        WHERE ou.userId = ? `, 
        [user.id], (err, rows) => {
        if (err || !rows) {
            return utils.errorResponse(res, 404, 'sysERR_CANT_GET_ORGANIZATION_LIST');
        }
        const orgList = _.groupBy(rows, 'role');
        res.status(200).json(orgList).end();
    });
};


// Get Events of the specific event
module.exports.events = (req, res) => {
    const orgId = req.params.orgId;
    const fields = {'t.name': 'tags'};
    const condition = {
        'e.status': config.statuses.event.published,
        'e.organizationId': orgId
    };

    events.getEvents(fields, condition, function(err = null, data = null) {
        if (!data) {
            return utils.errorResponse(res, 404, 'sysERR_CANT_GET_EVENT');
            }
            res.status(200).json(data).end();
        }
    );
}

module.exports.get = (req, res) => {
    const orgId = req.params.orgId;
    
    DB.query(`SELECT o.id as id, o.name as name, o.image as image, o.location as location, 
        o.description as description, o.contactInfo as contactInfo, ou.role FROM organization o 
        LEFT JOIN organizationUser ou ON o.id=ou.organizationId WHERE o.id = ?`,
        [orgId], (err, rows) => {
            if (err || !rows[0]) {
                return utils.errorResponse(res, 404, 'sysERR_CANT_GET_ORDER');
            }
            
            res.status(200).json(rows).end();
    });
};

module.exports.create = (req, res) => {
    let orgData = req.body.data._parts;

    const insertData = utils.parseInsertFields(orgData, 'org');
    const insertQuery = `INSERT INTO organization SET ?`;
     insertData.fields.status = config.statuses.organization.active;
        DB.query(insertQuery, insertData.fields, (err, rows) => {
        if (err) {
            return utils.errorResponse(res, 500, 'sysERR_CANT_CREATE_ORGANIZATION');
        } 
        const orgId = rows.insertId;
        const user = req.user;
        const timeFormat = moment().format('YYYY-MM-DD HH:mm:ss');
        const insertQueryOrgUser = `INSERT INTO organizationUser 
                (organizationId, userId , role, createdAt, modifiedAt)
                values (?,?,?,?,?)`;
        DB.query(insertQueryOrgUser, [orgId, user.id, config.organizationUserRoles.admin, 
        timeFormat, timeFormat], 
        (err, result) => {
            if (err) {
                return utils.errorResponse(res, 500, 'sysERR_CANT_CREATE_ORGANIZATION_USER');
            }
        });
        res.status(200).json(orgId);
    });
};

// TODO: Implement validation
module.exports.update = (req, res) => {
   let orgData = req.body.data._parts;
    const orgId = req.params.orgId;

    const updateData = utils.parseInsertFields(orgData, 'org', 'update');
    const updateQuery = `UPDATE organization SET ? WHERE organization.id = ${orgId}`;

    DB.query(updateQuery, updateData.fields, (err, result) => {
        if (err) {
            return utils.errorResponse(res, 500, 'sysERR_CANT_UPDATE_ORGANIZATION_USER');
        }
    });

    res.status(200).json(orgId);
};

//Follow organization
module.exports.follow = (req, res) => {
    const orgId = req.params.orgId;
    const userId = req.user.id;

    const timeFormat = moment().format('YYYY-MM-DD HH:mm:ss');
    const insertQueryOrgUser = `INSERT INTO organizationUser 
                (organizationId, userId , role, createdAt, modifiedAt)
                values (?,?,?,?,?)`;
    DB.query(insertQueryOrgUser, [orgId, userId, config.organizationUserRoles.follower, 
        timeFormat, timeFormat], 
        (err, result) => {
            if (err) {
                return utils.errorResponse(res, 500, 'sysERR_CANT_CREATE_ORGANIZATION_USER');
            }
        });

    res.status(200).json(orgId);
};

//user {Iid, role}
// const insertOrgUser = (orgId, user, callback) => {

// };


// module.exports.addUser = (req, res) => {

// };

// module.exports.userList = (req, res) => {

// };
