const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const LowdbStore = require('lowdb-session-store')(session);
const args = require('commander');
const fs = require('fs');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const _ = require('lodash');

args.option('--port <number>', 'Server port number', 8000).parse(process.argv);

const fsAdapter = new FileSync('db.json');
const db = (() => {
    console.log('Using lowdb');
    let ret = lowdb(fsAdapter);
    ret.defaults({
           users: [],
           researchers: [],
           reviewers: [],
           editors: [],
           sessions: [],
           usersessions: [],
           papers: []
       })
        .write();
    return ret;
})();

db._.mixin({
    pushUnique: function(array, key, newEl) {
        if (array.findIndex((el) => el[key] === newEl[key]) === -1) {
            array.push(newEl);
        }
        return array;
    }
});

const app = express();
app.set('trust proxy', 1);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(require('sanitize').middleware);
app.use(session({
    secret: 'some random information',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
    },
    store: new LowdbStore(db.get('sessions'), {}),
}));

const guidir = __dirname + '/gui';
app.use(express.static(guidir + '/login_page'));
app.use(express.static(guidir + '/paperoverview_page'));
app.use(express.static(guidir + '/review_page'));
app.use('/submissions', express.static(__dirname + '/submissions'));

// Ensures all properties are defined and not null
function invalidObject(obj) {
    for (const property in obj) {
        const val = obj[property];
        if (val === undefined)
            return true;
        if (val === null)
            return true;
    }
    return false;
}

// Creates a random id, consisting of length alphanumeric characters.
function makeid(length) {
    var result = '';
    var characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result +=
            characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Looks up the current session, checking is logged in
// req.email then stores the current user
function isAuthorized(req, res, next) {
    console.log('Sessid');
    console.log(req.sessionID);

    const us = db.get('usersessions').find({sessid: req.sessionID}).value();
    console.log(us);
    if (us) {
        console.log('authenticated');
        req.email = us.email;


        req.isResearcher = db.get('researchers')
                               .some(user => user.email === req.email)
                               .value();

        req.isReviewer =
            db.get('reviewers').some(user => user.email === req.email).value();

        req.isEditor =
            db.get('editors').some(user => user.email === req.email).value();

        return next();
    } else {
        console.log('failed auth check');
        return next(new Error('forbidden'));
    }
}

// Checks if current session is a reviewer session
// Must be called after isAuthorized
function isResearcher(req, res, next) {
    console.log('researcher check ' + req.email);
    const us = db.get('researchers').find({email: req.email}).value();
    console.log(us);
    if (us) {
        console.log('isResearcher');
        req.isResearcher = true;
        return next();
    } else {
        console.log('notResearcher');
        req.isResearcher = false;
        return next(new Error('forbidden'));
    }
}

// Checks if current session is a reviewer session
// Must be called after isAuthorized
function isReviewer(req, res, next) {
    console.log('reviewer check ' + req.email);
    const us = db.get('reviewers').find({email: req.email}).value();
    console.log(us);
    if (us) {
        console.log('isReviewer');
        req.isReviewer = true;
        return next();
    } else {
        console.log('notReviewer');
        req.isReviewer = false;
        return next(new Error('forbidden'));
    }
}

// Same as above, but checks for if user is editor
function isEditor(req, res, next) {
    const us = db.get('editors').find({email: req.email}).value();
    console.log(us);
    if (us) {
        console.log('isEditor');
        req.isEditor = true;
        return next();
    } else {
        console.log('notEditor');
        req.isEditor = false;
        return next(new Error('forbidden'));
    }
}

app.get('/', (req, res) => {
    res.redirect('front_page.html');
});

// Serve main page static content
app.get('/main_page.html', isAuthorized, (req, res) => {
    res.sendFile('main_page.html', {root: guidir + '/main_page'});
});
app.get(
    '/main_page.css',
    (req,
     res) => {res.sendFile('main_page.css', {root: guidir + '/main_page'})});
app.get(
    '/main_page.js',
    (req,
     res) => {res.sendFile('main_page.js', {root: guidir + '/main_page'})});

// Serve main page static content
app.get('/review.html', isAuthorized, isReviewer, (req, res) => {
    res.sendFile('review.html', {root: guidir + '/review_page'});
});
app.get(
    '/review.css',
    (req,
     res) => {res.sendFile('review.css', {root: guidir + '/review_page'})});
app.get(
    '/review.js',
    (req,
     res) => {res.sendFile('review_page.js', {root: guidir + '/review_page'})});

// Register a researcher. Takes a request in the form
// {
//      email: <email address>
//      password: <password>
//      firstname: <firstname>
//      lastname: <lastname>
// }
app.post('/register', (req, ares) => {
    const sreq = {
        email: req.bodyEmail('email'),
        password: req.bodyString('password'),
        firstname: req.bodyString('firstname'),
        lastname: req.bodyString('lastname'),
        submissions: [],
    };
    console.log('Register request: ');
    console.log(sreq);
    if (invalidObject(sreq)) {  // validate input
        ares.status(400);
        ares.json({msg: 'Invalid request'});
        return;
    }

    const searchRes = db.get('users').find({email: sreq.email}).value();
    if (searchRes === undefined) {
        const res = db.get('users').push(sreq).write();
        db.get('researchers').push({email: sreq.email}).write();
    } else {
        ares.status(400);
        ares.json({msg: 'Email already registered'});
        return;
    }

    ares.json({msg: 'Success!'});
});

// Associates a user with a session
//
// Input: {
//      email: <email address>
//      password: <password>
// }
//
// Output: { msg: <success or fail> }
app.post('/login', (req, ares) => {
    const sreq = {
        email: req.bodyEmail('email'),
        password: req.bodyString('password'),
    };
    if (invalidObject(sreq)) {
        ares.status(400);
        ares.json({msg: 'Invalid object'});
        return;
    }
    console.log('Got login request: ');
    console.log(sreq);

    const ret = db.get('users').find(sreq).value();
    if (ret === undefined) {
        ares.status(400);
        ares.json({msg: 'Invalid login credentials'});
    } else {
        db.get('usersessions').remove({sessid: req.sessionID}).write();
        db.get('usersessions')
            .push({email: sreq.email, sessid: req.sessionID})
            .write();

        ares.status(302);
        ares.json({msg: 'Success'});
    }
});

// Removes the user from the current session
app.post('/logout', (req, res) => {
    db.get('usersessions').remove({sessid: req.sessionID}).write();
    res.json({msg: 'Success!'});
});

app.post('/search_names', (req, ares) => {
    let users = db.get('users').value();
    let names = [];
    users.forEach(
        u => names.push({firstname: u.firstname, latname: u.lastname}));
    ares.json(names);
});

// Submits a paper into the system
// Requires user to be logged in
// Input: {
//      title: <paper title>
//      paper: <base64 encoding of paper>
//      reviewer1: <email of reviewer>
//      reviewer2: <email of reviewer>
//      reviewer3: <email of reviewer>
// }
//
// Output: { msg: <success or fail message> }
app.post('/submit_paper', isAuthorized, isResearcher, (req, res) => {
    let sreq = {
        title: req.bodyString('title'),
        paper: req.bodyString('paper'),
        reviewers: []
    };

    if (invalidObject(sreq)) {
        res.status(400);
        res.json({msg: 'Invalid object'});
        return;
    }

    sreq.reviewers = [
        req.bodyEmail('reviewer1'), req.bodyEmail('reviewer2'),
        req.bodyEmail('reviewer3')
    ];
    console.log(sreq.reviewers);


    sreq.reviewers.forEach(r => {
        const rev = db.get('reviewers').find({email: r}).value();
        if (rev == undefined)
            return res.status(400).json({msg: 'Reviewer does not exist ' + r});
        if (rev.email === req.email)
            return res.status(400).json({msg: 'Cannot review self'});
    });


    console.log('Got submit request');
    console.log(sreq.reviewers);

    sreq.titlelower = sreq.title.toLowerCase();

    const subId = makeid(16);
    const paperId = makeid(16);

    const filename = 'submissions/' + subId + paperId + '.pdf';
    fs.writeFile(filename, sreq.paper, 'base64', err => {
        if (err) {
            console.log(err);
            res.status(500);
            return res.json({msg: 'Internal server error'});
        } else {
            db.get('papers')
                .push({
                    id: subId,
                    titlelower: sreq.titlelower,
                    title: sreq.title,
                    papers: [{id: paperId, feedback: []}],
                    status: 'pending',
                    authoremail: req.email,
                    suggestedreviewers: sreq.reviewers,
                    assignedreviewers: [],
                    interestedreviewers: []

                })
                .write();
            // isAuthorized ensures emails do exist
            db.get('users')
                .find({email: req.email})
                .get('submissions')
                .push(subId)
                .write();
            return res.json({subId: subId});
        }
    });
});


// Allows a reviewer to declare interest in a paper
//
// Input: { subid: <submission id> }
//
// Output: { msg: <success or failure> }
//
app.post('/add_interest', isAuthorized, isReviewer, (req, res) => {
    let sreq = {subid: req.bodyString('subid')};
    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});
    db.get('papers')
        .find({id: sreq.subid})
        .get('interestedreviewers')
        .pushUnique('email', {email: req.email})
        .write();
    return res.json({msg: 'Success!'});
});

// Gets all the papers in the database and formats them for sending over the
// network
//
// Input: filter object
//
// Output: [Array of formatted papers]
//
function getPapers(filterObj) {
    const papers = db.get('papers').filter(filterObj).value();
    console.log(papers);
    let ret = [];
    papers.forEach(p => {
        const u = db.get('users').find({email: p.authoremail}).value();
        ret.push({
            title: p.title,
            status: p.status,
            authorfirst: u.firstname,
            authorlast: u.lastname,
            authoremail: u.email,
            subid: p.id,
            papers: p.papers,
            suggestedreviewers: p.suggestedreviewers,
            assignedreviewers: p.assignedreviewers,
            interestedreviewers: p.interestedreviewers
        });
    });
    return ret;
}

// Gets all the submissions by the logged in user
//
// Requires: isAuthorized, isResearcher
//
// Input: {}
//
// Output: [List of submissions]
//
app.post('/get_my_submissions', isAuthorized, isResearcher, (req, res) => {
    res.json(getPapers({authoremail: req.email}));
});

// Assign a reviewer to a submission
//
// Requires: isAuthorized, isReviewer
//
// Input: {}
//
// Output: [list of submissions which have been assigned to the user]
app.post('/get_assigned_submissions', isAuthorized, isReviewer, (req, res) => {
    res.json(getPapers(o => o.assignedreviewers.includes(req.email)));
});

// Gets submissions which do not have reviewers assigned to it
//
// Requires: isAuthorized, isEditor
//
// Input: {}
//
// Output: [list of submissions without enough reviewers]
app.post('/get_unassigned_submissions', isAuthorized, isEditor, (req, res) => {
    let papers = getPapers(o => true);
    let ret = papers.filter(o => {return o.assignedreviewers.length < 2});
    res.json(ret);
})

// Gets a list of submissions which are not accepted or rejected, and reviewers
// have left comments on the paper
//
// Input: {}
//
// Output: [list of pending submissions]
//
app.post('/get_pending_submissions', isAuthorized, (req, res) => {
    let papers = getPapers(o => true);
    let ret = papers.filter(o => {
        if (o.status == 'accept' || o.status == 'reject')
            return false;
        if (o.assignedreviewers.length == 0)
            return false;
        let commented = true;
        console.log('papers: ');
        console.log(o);
        let paper = o.papers[o.papers.length - 1];
        o.assignedreviewers.forEach(
            reviewer => {
                commented = commented &&
                    paper.feedback.findIndex(f => f.email === reviewer) != -1});
        return commented;
    });
    res.json(ret);
});

// Gets a list of submissions which a reviewer is not interested in
// Requires: isReviewer, isAuthorized
// Input: {}
// Output: [list of submissions]
app.post(
    '/get_uninterested_submissions', isAuthorized, isReviewer, (req, res) => {
        let papers = getPapers(undefined);
        let ret = _.filter(papers, (o => {
                               let res = true;
                               o.interestedreviewers.forEach(o => {
                                   res = res && o.email != req.email;
                               });
                               return res;
                           }));
        console.log(ret);
        res.json(ret);
    });

// Get all submissions in the system
// Input: {}
// Output: <list of submissions>
app.post('/get_submissions', (req, res) => {
    res.json(getPapers(undefined));
});

// Gets a deadline for a paper
// Input:  { subid: <submission id> }
// Output: { deadline: <deadline> }
app.post('/get_deadline', isAuthorized, (req, res) => {
    let sreq = {subid: req.bodyString('subid')};
    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});
    let paper = db.get('papers')
                    .find({id: sreq.subid})
                    .get('papers')
                    .takeRight(1)
                    .value();
    if (paper == undefined)
        return res.status(400).json({msg: 'Invalid submission'});

    console.log(paper);

    return res.json({deadline: paper[0].deadline});
})
app.post('/set_deadline', isAuthorized, (req, res) => {
    if (!(req.isEditor || req.isReviewer))
        return res.status(400).json({msg: 'Unauthorized'});

    let sreq = {
        subid: req.bodyString('subid'),
        deadline: req.bodyString('deadline'),
    };
    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});
    let paper = db.get('papers')
                    .find({id: sreq.subid})
                    .get('papers')
                    .takeRight(1)
                    .value();

    if (paper == undefined)
        return res.status(400).json({msg: 'Invalid submission identifier'});

    if (sreq.deadline <= Date.now())
        return res.status(400).json({msg: 'Deadline has already passed'});

    db.get('papers')
        .find({id: sreq.subid})
        .get('papers')
        .takeRight(1)
        .assign({deadline: sreq.deadline})
        .write();

    return res.json({msg: 'Success'});
})

// Update a submission with a new paper/revision
app.post('/update_paper', isAuthorized, isResearcher, (req, res) => {
    let sreq = {
        subId: req.bodyString('subid'),
        paper: req.bodyString('paper'),
    };
    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});

    console.log('update req');


    const submission = db.get('papers').find({id: sreq.subId}).value();
    console.log(submission);

    if (submission.authoremail != req.email)
        return res.status(403).json({msg: 'Forbidden'});



    let canresub =
        submission.status === 'major' || submission.status === 'minor';
    console.log(canresub)
    if (!canresub) {
        return res.status(400).json(
            {msg: 'Cannot resubmit unless revisons are required'});
    }

    const subId = submission.id;
    const paperId = makeid(16);

    const filename = 'submissions/' + subId + paperId + '.pdf';
    fs.writeFile(filename, sreq.paper, 'base64', err => {
        if (err) {
            console.log(err);
            res.status(500);
            return res.json({msg: 'Internal server error'});
        } else {
            db.get('papers')
                .find({id: sreq.subId})
                .get('papers')
                .push({id: paperId, feedback: [], deadline: -1})
                .write();

            db.get('papers')
                .find({id: sreq.subId})
                .set('status', 'pending')
                .write();

            return res.json({msg: 'Success'});
        }
    })
})

// Get info about current session
// Input: {}
// Output: {
//      email: <session email>
//      researcher: <bool>
//      reviewer: <bool>
//      editor: <bool>
// }
app.post('/get_my_info', isAuthorized, (req, res) => {
    return res.json({
        email: req.email,
        researcher: req.isResearcher,
        reviewer: req.isReviewer,
        editor: req.isEditor,
    });
});


// Add feedback to a submission
app.post('/add_feedback', isAuthorized, isReviewer, (req, res) => {
    let sreq = {
        subid: req.bodyString('subid'),
        feedback: req.bodyString('feedback'),
    };
    console.log(sreq);

    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});

    let cf = {email: req.email, feedback: sreq.feedback, time: Date.now()};
    console.log('add_feedback');
    console.log(sreq);
    let feedback = db.get('papers')
                       .find({id: sreq.subid})
                       .get('papers')
                       .takeRight(1)
                       .get(0)
                       .get('feedback')
                       .push(cf)
                       .write();
    return res.json({msg: 'Success'});
});

// Get feedback from a submission
app.post('/get_feedback', isAuthorized, (req, res) => {
    let sreq = {subid: req.bodyString('subid')};
    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});

    const feedback = db.get('papers')
                         .find({id: sreq.subid})
                         .get('papers')
                         .takeRight(1)
                         .get(0)
                         .get('feedback')
                         .value();
    if (feedback)
        return res.json(feedback);
    else
        return res.status(400).json([]);
});

app.post('/remove_my_new_submissions', isAuthorized, isReviewer, (req, res) => {
    db.get('reviewers').find({email: req.email}).set('newpapers', []).write();
    return res.json({msg: 'Success!'});
});

app.post('/get_my_new_submissions', isAuthorized, isReviewer, (req, res) => {
    let rev = db.get('reviewers').find({email: req.email}).value();
    return res.json(rev.newpapers);
});

// Get all the reviewers in the system
app.post('/get_reviewers', isAuthorized, (req, res) => {
    const reviewers = db.get('reviewers').value();
    let ret = [];
    reviewers.forEach(r => {
        let user = db.get('users').find({email: r.email}).value();
        if (user.email !== req.email)
            ret.push({
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
            });
    });
    res.json(ret);
});
app.post('/get_users', isAuthorized, (req, res) => {
    const users = db.get('users').value();
    let ret = [];
    users.forEach(r => {
        ret.push({
            email: r.email,
            firstname: r.firstname,
            lastname: r.lastname,
        });
    });
    res.json(ret);
});



// Forward paperoverview_page name
app.get('/paperoverview', isAuthorized, (req, res) => {
    const subid = req.query.subid;
    console.log('subid ' + subid);

    return res.sendFile(
        'paperoverview_page.html', {root: guidir + '/paperoverview_page'});
});

// Gets all information about a single submission
app.post('/get_submission', (req, res) => {
    let sreq = {subid: req.bodyString('subid')};
    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});
    const sub = db.get('papers').find({id: sreq.subid}).value();
    if (sub) {
        let paperurls = [];
        sub.papers.forEach(p => {paperurls.push({
                               url: 'submissions/' + sreq.subid + p.id + '.pdf',
                               feedback: p.feedback
                           })});
        const author = db.get('users').find({email: sub.authoremail}).value();
        return res.json({
            id: sub.id,
            title: sub.title,
            revisions: paperurls,
            authorfirst: author.firstname,
            authorlast: author.lastname,
            suggestedreviewers: sub.suggestedreviewers,
            assignedreviewers: sub.assignedreviewers,
            interestedreviewers: sub.interestedreviewers,
            status: sub.status,
        });
    } else {
        return res.status(400).json({msg: 'Invalid submission'});
    }
});

// Changes the status of a paper.
// Which statuses can be accepted depend on the authorization level of the user.
//
// Requires:  isAuthorized
//
// Input: {
//      subid: <>
//      status <accept/reject/major/minor/pending>
//  }
//
// Output: {
//      msg: <success or failure>
// }
//
app.post('/change_paper_status', isAuthorized, (req, res) => {
    let sreq = {
        subid: req.bodyString('subid'),
        status: req.bodyString('status'),
    };
    console.log('change paper status req');
    console.log(sreq);

    console.log(req.body.subid);
    console.log(req.body.status);

    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});

    const reviewerStatus = ['major', 'minor'];
    const editorStatus = reviewerStatus.concat(['accept', 'reject', 'pending']);

    // console.log(reviewerStatus);
    // console.log(editorStatus);

    if (req.isReviewer && !req.isEditor &&
        !reviewerStatus.includes(sreq.status)) {
        return res.status(400).json({msg: 'Invalid object: reviewer'});
    }
    if (req.isEditor && !editorStatus.includes(sreq.status))
        return res.status(400).json({msg: 'Invalid object: editor'});

    const sub = db.get('papers').find({id: sreq.subid}).value();
    if (sub) {
        db.get('papers')
            .find({id: sreq.subid})
            .assign({status: sreq.status})
            .write();

        if (sreq.status == 'major' || sreq.status == 'minor') {
            console.log('wrote new deadline!');
            db.get('papers')
                .find({id: sreq.subid})
                .get('papers')
                .takeRight(1)
                .nth(0)
                .set('deadline', Date.now() + 2419200000)
                .write();

            let v = db.get('papers')
                        .find({id: sreq.subid})
                        .get('papers')
                        .takeRight(1)
                        .nth(0)
                        .value();
            console.log(v);
        }

        return res.json({msg: 'Success!'});
    } else {
        return res.status(400).json({msg: 'Invalid submission'});
    }
});


// Editors can add editors, and reviewers
// Input: {
//      email: <user email>
//      researcher: true/false
//      reviewer: true/false
//      editor: true/false
// }
app.post('/change_user_status', isAuthorized, isEditor, (req, res) => {
    let sreq = {
        email: req.bodyEmail('email'),
        researcher: req.bodyString('researcher'),
        reviewer: req.bodyString('reviewer'),
        editor: req.bodyString('editor'),
    };

    console.log('user status change');
    console.log(sreq);

    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid object'});


    const boolstrings = ['true', 'false'];

    if (!boolstrings.includes(sreq.researcher))
        return res.status(400).json({msg: 'Invalid object'});

    if (!boolstrings.includes(sreq.reviewer))
        return res.status(400).json({msg: 'Invalid object'});

    if (!boolstrings.includes(sreq.editor))
        return res.status(400).json({msg: 'Invalid object'});

    console.log('change user req');
    console.log(sreq);



    if (sreq.researcher === 'true') {
        if (db.get('researchers').find({email: sreq.email}).value()) {
            // because js is whack
        } else {
            db.get('researchers').push({email: sreq.email}).write();
        }
    }

    if (sreq.reviewer === 'true') {
        if (db.get('reviewers').find({email: sreq.email}).value()) {
            // because js is whack
        } else {
            db.get('reviewers')
                .push({email: sreq.email, newpapers: []})
                .write();
        }
    }

    if (sreq.editor === 'true') {
        if (db.get('editors').find({email: sreq.email}).value()) {
            // because js is whack
        } else {
            db.get('editors').push({email: sreq.email}).write();
        }
    }


    // db.get('usersessions').remove({sessid: req.sessionID}).write();
    return res.json({msg: 'Success'});
});


// Assign a reviewer to a submission
//
// Requires: isAuthorized, isEditor
//
// Input: {
// subid: <submission id>
// reviewer: <reviewer email>
// }
//
// Output: { msg: <success or fail> }
app.post('/assign_reviewer', isAuthorized, isEditor, (req, res) => {
    let sreq = {
        subid: req.bodyString('subid'),
        reviewer:
            [req.body.reviewer[0], req.body.reviewer[1], req.body.reviewer[2]]
    };
    console.log('assign reviewer req');
    console.log(sreq);

    if (invalidObject(sreq))
        return res.status(400).json({msg: 'Invalid submission'});

    for (let r of sreq.reviewer) {
        const rev = db.get('reviewers').find({email: r}).value();
        if (rev === undefined)
            return res.status(400).json({msg: 'Unknown reviewer ' + r});
    }


    let handle =
        db.get('papers').find({id: sreq.subid}).get('assignedreviewers');
    // console.log(handle);


    let rev = handle.value();


    if (rev === undefined) {
        return res.status(400).json({msg: 'Invalid subid'});
    }

    const next = _.union(rev, sreq.reviewer);
    console.log('next');
    console.log(next);

    if (next >= 3) {
        return res.status(400).json({msg: 'Cannot assign more reviewers'});
    }

    console.log('subid');
    console.log(sreq);
    console.log(rev);

    db.get('papers')
        .find({id: sreq.subid})
        .set('assignedreviewers', next)
        .write();

    next.forEach(email => {
        db.get('reviewers')
            .find({email: email})
            .get('newpapers')
            .push(sreq.subid)
            .write();
    });

    return res.json({msg: 'Success!'});
});


// Gets all researchers and reviewers
//
// Requires: isAuthorized
//
// Input: {}
//
// Output: [list of all non_editor users]
app.post('/get_non_editors', isAuthorized, (req, res) => {
    let researchers = db.get('researchers').value();
    let reviewers = db.get('reviewers').value();
    let ret = [];
    researchers.forEach(o => ret.push(o.email));
    reviewers.forEach(o => ret.push(o.email));
    ret = _.uniq(ret);
    return res.json(ret);
});


// Forbidden access error handler
// Redirects user on failure
app.use((err, req, res, next) => {
    if (err.message == 'forbidden') {
        if (req.method == 'GET')
            res.status(403).redirect('front_page.html');
        else if (req.method == 'POST')
            res.status(403).json({msg: 'Not authenticated'});
        else
            res.status(403);
    } else {
        next(err);
    }
});

app.listen(args.port, () => {
    console.log('Started on port ' + args.port);
});
