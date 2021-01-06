// display previews of articles/reviewer comments
let subid;

window.onload =
    function() {
    const urlParams = new URLSearchParams(window.location.search);
    const curr_subid = urlParams.get('subid');
    subid = curr_subid;
    const url = 'get_submission';

    fetch(url, {
        method: 'POST',
        body: JSON.stringify({'subid': curr_subid}),
        headers: {'Content-Type': 'application/json'}
    })
        .then(response => response.json())
        .then(paperlist => showTitle(paperlist))
        .then(paperlist => showPapers(paperlist))
        .then(paperlist => {
            fetch('get_deadline', {
                method: 'POST',
                body: JSON.stringify({'subid': curr_subid}),
                headers: {'Content-Type': 'application/json'}
            })
                .then(resp => resp.json())
                .then(data => {
                    const dl = document.querySelector('.deadline');
                    if (paperlist.status == 'pending') {
                        dl.innerHTML = 'TBA' 
                    // reject or rejected?
                    } else if (paperlist.status == 'accept' 
                        || paperlist.status == 'rejected'
                        || paperlist.status == 'reject') {
                        dl.innerHTML = paperlist.status.charAt(0).toUpperCase() + paperlist.status.slice(1);
                    } else {
                        dl.innerHTML = `Deadline: ${(new Date(data.deadline)).toDateString()}`;
                    }
                })
        });

    fetch('get_my_info', {method: 'POST'})
        .then(resp => resp.json())
        .then(data => {
            document.querySelector('.decision').style.display =
                data.editor ? 'flex' : 'none';
        });
}

    // delete session, redirect to login page
    document.querySelector('.logout')
        .addEventListener('click', function() {
            console.log('hello');
            let url = 'logout',
                redirectUrl = 'http://localhost:8000/front_page.html';
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
    let container = document.querySelector('.container'), subcontainer, preview;
    let line, comment;
    for (let i = paperlist.revisions.length - 1; i >= 0; i--) {
        subcontainer = document.createElement('div');
        subcontainer.classList.add('subcontainer');
        subcontainer.classList.add('last');
        preview = document.createElement('embed');
        preview.src = '/' + paperlist.revisions[i].url;
        preview.type = 'application/pdf';
        subcontainer.appendChild(preview);
        let modi = document.createElement('div');
        modi.classList.add('modification');
        for (let j = paperlist.revisions[i].feedback.length - 1; j >= 0; j--) {
            comment = document.createElement('div');
            comment.classList.add('pcomment');
            comment.innerHTML = paperlist.revisions[i].feedback[j].feedback;
            modi.appendChild(comment);
        }
        subcontainer.appendChild(modi);
        container.appendChild(subcontainer);
        if (i != 0) {
            subcontainer.classList.remove('last');
            line = document.createElement('div');
            line.classList.add('line-break');
            container.appendChild(line);
        }
    }
    return paperlist
}

// Show paper title in title header
// might be undesirable with wonkey paper titles
function showTitle(paper) {
    document.querySelector('.title-header').innerHTML =
        `Paper Overview: ${paper.title}`;
    return paper;
}

function change_status(send) {
    const url = 'change_paper_status';
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({subid: subid, status: send}),
        headers: {'Content-Type': 'application/json'},
    })
}


document.querySelector('.accepted').addEventListener('click', function() {
    change_status('accept');
});

document.querySelector('.rejected').addEventListener('click', function() {
    change_status('reject');
});

document.querySelector('.min-revis').addEventListener('click', function() {
    change_status('minor');
});

document.querySelector('.maj-revis').addEventListener('click', function() {
    change_status('major');
});


const updateFile = document.getElementById('update-file');
const chooseButton = document.getElementById('choose-button');
const updateButton = document.getElementById('update-button');
const customText = document.getElementById('custom-text');
const errorText = document.getElementById('error-text');

chooseButton.addEventListener('click', function() {
    updateFile.click();
});

updateFile.addEventListener('change', function() {
    if (updateFile.value) {
        customText.innerHTML =
            updateFile.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
    } else {
        customText.innerHTML = 'No file chosen.';
    }
})

updateButton.addEventListener('click', function() {
    
    const currentTime = Date.now();
    let timeDue = -1;
    let status = 'error';

    let url0 = 'get_my_submissions';
    fetch(url0, {
        method: 'POST',
    })
        .then(response => response.json())
        .then(json => {
            console.log(json);
            for(i = 0; i < json.length; i++)
            {
                if (json[i].subid == subid)
                {
                   status = json[i].status;

                }
            }

        })


    if (updateFile.files.length) {
        var reader = new FileReader();
        reader.readAsBinaryString(updateFile.files[0]);
        reader.onload = function() {
            const obj = {
                subid: subid,
                paper: btoa(reader.result)
                
            };
            let url = 'update_paper';
            fetch(url, {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(obj),
            }).then(o => {
                location.reload();
            });

            errorText.style.visibility = 'hidden';
            errorText.style.display = 'none';
        };
        reader.onerror = function(error) {
            console.log('Error: ', error)
        };
    }
    else{
        errorText.style.visibility = 'visible';
        errorText.style.display = 'inline';
    }
})
    
