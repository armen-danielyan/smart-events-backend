'use strict';

const utils = require('../../lib/utils');
const DB = require('../../config/db');
const config = require('../../config');
const events = require('../event/controller');
const moment = require('moment');
const security = require('../../lib/security');


// profile data
// preferrances

// Add User to the Organization
module.exports.userAdd = (req, res) => {
    const userId = req.params.userId;
    const orgId = req.params.orgId;
    const timeFormat = moment().format('YYYY-MM-DD HH:mm:ss');
    const adminRole = config.organizationUserRoles.admin;

    const queryInsertAdminUser = `INSERT INTO organizationUser (organizationId, userId, role, 
        createdAt, modifiedAt) VALUES (?,?,?,?,?)`;
    const queryExistingAdminUser = `SELECT id FROM organizationUser WHERE 
            organizationId = ${orgId} AND userId = ${userId} AND role = ${adminRole}`;

    DB.query(queryExistingUser, (err, rows) => {
        if (err || rows[0]) {
            return utils.errorResponse(res, 404, 'sysERR_ORG_USER_EXISTS');
        }

        DB.query(queryInsertAdminUser, [orgId, userId, adminRole, timeFormat, timeFormat], 
            (err, rows) => {
                if (err) {
                    return utils.errorResponse(res, 404, 'sysERR_CANT_ADD_ADMIN_USER');
                }
                const rowId = rows.insertId;
                return res.status(200).json(rowId).end();
        });
    });
};

// Search User by firstName, lastName, username, email
module.exports.userList = (req, res) => {
    const term = req.params.term;
    const querySearch = `SELECT email, firstName, lastName, username, image FROM user
        WHERE user.firstName LIKE %${term}% OR user.lastName LIKE%${term}% OR 
        user.username LIKE %${term}% OR user.emil LIKE %${term}%`;
    DB.query(querySearch, (err, rows) => {
        if (err || !rows[0]) {
            return utils.errorResponse(res, 404, 'sysERR_CANT_FIND_USER');
        }
        return res.status(200).json(rows).end();
    });
};

// Get User Profile
module.exports.profile = (req, res) => {
    const userId = req.params.userId || req.user.id;
    const querySelect = `SELECT email, firstName, lastName, username, location, image, preferences
        FROM user WHERE user.id = ?`;
    DB.query(querySelect, [userId], (err, rows) => {
        if (err || !rows[0]) {
            return utils.errorResponse(res, 404, 'sysERR_CANT_GET_USER');
        }
        return res.status(200).json(rows).end();
    });
};

// Update User Profile
module.exports.userUpdate = (req, res) => {
    let profileData = req.body.data._parts;
    let userId = req.params.userId;

    const updateData = utils.parseInsertFields(profileData, 'profile', 'update');
    const updateQuery = `UPDATE user SET ? WHERE user.id = ${userId}`;

    DB.query(updateQuery, updateData.fields, (err, result) => {
        if (err) {
            return utils.errorResponse(res, 500, 'sysERR_CANT_UPDATE_ORGANIZATION_USER');
        }

        const querySelect = `SELECT email, firstName, lastName, username, location, image, preferences
        FROM user WHERE user.id = ?`;
        DB.query(querySelect, [userId], (err, rows) => {
            if (err || !rows[0]) {
                return utils.errorResponse(res, 404, 'sysERR_CANT_GET_USER');
            }

            return res.status(200).json(rows).end();
        });
    });
};