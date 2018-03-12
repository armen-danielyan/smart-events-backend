'use strict';

const utils = require('../../lib/utils');
const DB = require('../../config/db');
const config = require('../../config');
const moment = require('moment');
const path = require('path');
const QRCode = require('qrcode');

const eventDefaultFields = {
    'e.id' : 'id', 
    'e.title': 'title', 
    'e.image': 'image',
    'e.location': 'location',
    'e.startDate': 'startDate', 
    'o.name': 'organizationName'
};

module.exports.getEvents = (addFields, condition, callback) => {
    let fields  = eventDefaultFields;
    if(addFields) {
        fields = Object.assign(eventDefaultFields, addFields);
    }
    let queryFields = '',
        queryTag = '',
        queryUser = '';
    
    for (let fieldName in fields) {
      if (fields.hasOwnProperty(fieldName)) {
        queryFields +=`${fieldName} as ${fields[fieldName]}, `;
      } 
    }

    queryFields = queryFields.substr(0, queryFields.length - 2);

    if(fields['ou.userId']) {
        queryUser = ` LEFT JOIN (SELECT DISTINCT organizationId, role,
            group_concat(userId separator ', ') 
            as userId FROM organizationUser GROUP BY organizationId, role ) as ou 
            ON o.id = ou.organizationId`;
    }

    if(fields['t.name']) {
        queryTag = ` LEFT JOIN (SELECT tt.tid as tid, group_concat(tt.name separator ', ') 
         as name FROM (SELECT tag.name as name, tagEvent.eventId as tid FROM tagEvent 
         LEFT JOIN tag ON tagEvent.tagId = tag.id) as tt GROUP BY tt.tid) as t
         ON e.id = t.tid `;
    }

    const conditionFields = Object.keys(condition).map((field) => {
        return field + '=?';
    }).join(' AND ');

    let conditionValues = [];
    for (let fieldName in condition)  {
        if (condition.hasOwnProperty(fieldName)) {
            conditionValues.push(condition[fieldName]);
          } 
    }

    DB.query(`SELECT ${queryFields},
        (SELECT COUNT(*) FROM eventUser as eu WHERE eu.eventId = e.id) as eventAttendees
         FROM event e LEFT JOIN organization o ON e.organizationId=o.id 
         ${queryUser}
         ${queryTag} 
         WHERE ${conditionFields} `, 
        conditionValues, 
        (err, rows) => {
            callback(err, rows);
            }
        );
};

//Get list of events by category/tag, location, popularity ?
// should add another serach param
module.exports.list = (req, res) => {
    const fields = {'t.name': 'tags'};
    const condition = {
        'e.status': config.statuses.event.published
    };

    this.getEvents(fields, condition, function(err = null, data = null) {
        if (!data) {
            return utils.errorResponse(res, 404, 'sysERR_CANT_GET_EVENT');
            }
            res.status(200).json(data).end();
        }
    );
};

//Get single event data
//Get and serve image/s
module.exports.get = (req, res) => {
    const fields = {
        'e.description': 'description', 
        'o.id': 'organizationId',
        'ou.userId': 'ownerId'
    };
    const condition = {
        'e.id': req.params.eventId,
        'ou.role': 1
    };

    this.getEvents(fields, condition, function(err = null, data = null) {
        if (!data) {
            return utils.errorResponse(res, 404, 'sysERR_CANT_GET_EVENT');
        }
            res.status(200).json(data).end();
        });
};


module.exports.create = (req, res) => {
    let eventData = req.body.data._parts;

    const insertData = utils.parseInsertFields(eventData, 'event');
    const insertQuery = `INSERT INTO event SET ?`;
     insertData.fields.status = config.statuses.event.published;
        DB.query(insertQuery, insertData.fields, (err, rows) => {
        if (err) {
            return utils.errorResponse(res, 500, 'sysERR_CANT_CREATE_EVENT');
        } 
        const eventId = rows.insertId;
        //insert Tags
        res.status(200).json(eventId);
    });
};

module.exports.regsiter = (req, res) => {
    const eventId = req.params.eventId;
    const user = req.user;
    const timeFormat = moment().format('YYYY-MM-DD HH:mm:ss');

    const insertValues = {
        userId: user.id,
        eventId: eventId,
        userStatus: config.eventUserStatuses.registered,
        createdAt: timeFormat,
        modifiedAt: timeFormat
    };

    const registerQuery = `INSERT INTO eventUser SET ?`;
    DB.query(registerQuery, insertValues, 
        (err, rows) => {
            if(err) {
                return utils.errorResponse(res, 500, 'sysERR_CANT_REGISTER_FOR_EVENT');
            }
            const insertId = rows.insertId;
            const QRroute = path.join(process.cwd(), `api/events/checkin/${insertId}`);
            QRCode.toDataURL(QRroute, function (err, result) {
              res.status(200).json(result);
            });
        }
    );
};


// // TODO: Implement validation
 module.exports.update = (req, res) => {

 };

 module.exports.attendeesList = (req, res) => {

 };
