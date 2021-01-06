let subid, email;
// display previews of articles/reviewer comments
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const curr_subid = urlParams.get('subid');
    subid = curr_subid;

    document.querySelector('#viewcbox').remove();

    const url = 'get_submission';
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({'subid': curr_subid}),
        headers: {'Content-Type': 'application/json'}
    })
        .then(response => response.json())
        .then(paperlist => showPapers(paperlist));
};



// delete session, redirect to login page
document.querySelector('.logout').addEventListener('click', function() {
    console.log('hello');
    let url = 'logout', redirectUrl = 'http://localhost:8000/front_page.html';
    fetch(url, {method: 'POST'}).then(() => {
        window.location.replace(redirectUrl);
    });
})

// go back to main view
document.querySelector('.back').addEventListener('click', function() {
    let mainpage = 'http://localhost:8000/main_page.html';
    window.location.replace(mainpage);
})

// Show all revisions and feedback
function showPapers(paperlist) {
    console.log(paperlist);
    let container = document.querySelector('.container')
    for (let i = paperlist.revisions.length - 1; i >= 0; i--) {
        let subcontainer = document.createElement('div');
        subcontainer.classList.add('subcontainer');
        subcontainer.classList.add('last');
        subcontainer.classList.add('view_pdf');

        let revisionHeader = document.createElement('h3');
        revisionHeader.innerHTML = 'Revision ' + (i + 1);
        subcontainer.appendChild(revisionHeader);

        let preview = document.createElement('embed');
        preview.src = '/' + paperlist.revisions[i].url;
        preview.type = 'application/pdf';
        subcontainer.appendChild(preview);

        if (i == paperlist.revisions.length - 1) {
            let commentsdiv = document.createElement('div');
            commentsdiv.classList.add('comments');
            commentsdiv.innerHTML = '<h3>Your Comments</h3>' +
                '<textarea class="comment_box" ></textarea>' +
                '<button class="save">Save</button>';
            subcontainer.appendChild(commentsdiv);
        }

        let modi = document.createElement('div');
        modi.classList.add('modification');
        for (let j = paperlist.revisions[i].feedback.length - 1; j >= 0; j--) {
            let comment = document.createElement('div');
            comment.classList.add('pcomment');
            comment.innerHTML = paperlist.revisions[i].feedback[j].feedback;
            let datediv = document.createElement('div');
            datediv.classList.add('pcommentdate');
            let date = new Date(paperlist.revisions[i].feedback[j].time);
            datediv.innerHTML = date.getDate() + '/' + (date.getMonth() + 1) +
                '/' + date.getFullYear();
            comment.appendChild(datediv);
            modi.appendChild(comment);
        }
        subcontainer.appendChild(modi);
        container.appendChild(subcontainer);

        if (i != 0) {
            subcontainer.classList.remove('last');
            let line = document.createElement('div');
            line.classList.add('line-break');
            container.appendChild(line);
        }
    }
    saveButtonSelector();
}

function saveButtonSelector() {
    document.querySelector('.save').addEventListener('click', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const curr_subid = urlParams.get('subid');
        let url = 'add_feedback';
        fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                subid: subid,
                feedback: document.querySelector('.comment_box').value,
            }),
            headers: {'Content-Type': 'application/json'}
        }).then(o => {
            location.reload();
        });
    });
}
