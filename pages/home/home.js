var ERR = require('async-stacktrace');
var express = require('express');
var router = express.Router();

var sqldb = require('@prairielearn/prairielib/sql-db');
var sqlLoader = require('@prairielearn/prairielib/sql-loader');

var sql = sqlLoader.loadSqlEquiv(__filename);

router.get('/', function(req, res, next) {
    res.locals.isAuthenticated = !!res.locals.authn_user;
    if (res.locals.isAuthenticated) {
        var params = {
            user_id: res.locals.authn_user.user_id,
            is_administrator: res.locals.is_administrator,
            req_date: res.locals.req_date,
        };
        sqldb.queryOneRow(sql.select_home, params, function(err, result) {
            if (ERR(err, next)) return;

            res.locals.instructor_courses = result.rows[0].instructor_courses;
            if (res.locals.instructor_courses.length > 0) {
                // If the list of instructor courses is non-empty, then prepend
                // with the list of example courses (otherwise, discard the list
                // of example courses).
                res.locals.instructor_courses = result.rows[0].example_courses.concat(res.locals.instructor_courses);
            }
            res.locals.student_courses = result.rows[0].student_courses;

            res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
        });
    } else {
        res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
    }
});

module.exports = router;
