// clang-format off
// for reference
// document.querySelector(".regis-button").addEventListener('click',
// function() {
//     if (changePage("register")) return;
//     let url = "register";
//     fetch(url, {
//         method: 'POST',
//         body: JSON.stringify({
//             "firstname": document.querySelector("#first-name").value,
//             "lastname": document.querySelector("#last-name").value,
//             "email": document.querySelector("#email").value,
//             "password": document.querySelector("#password").value
//         }),
//         headers: {
//             'Content-Type':'application/json'
//         }
//     })
//     .then(response => response.json())
//     .then(json => showError(json))
// })

const stat_to_class = {'minor':'min-revis', 'major':'maj-revis','accept':'accepted','reject':'rejected','rejected':'rejected','pending':'pending'};

const cand_list = [];

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.substring(1);
}

function reviewers_onchange()
{
    console.log(' reviewers_onchange()');
}

function reviewers_onload()
{

   var reviewersList1 = document.getElementById("reviewer-list1");
   var reviewersList2 = document.getElementById("reviewer-list2");
   var reviewersList3 = document.getElementById("reviewer-list3");

    let url = 'get_reviewers';
    fetch(url, {method: 'POST'})
    .then(response => response.json())
    .then(obj => 
        {   
            for (i = 0; i < obj.length; i++)
            {
                var email = obj[i];
                let htmlstr = email.firstname + " " +  email.lastname + " [" + email.email + "] ";

                var option1 = document.createElement('option');
                var option2 = document.createElement('option');
                var option3 = document.createElement('option');
                option1.value = email.email;
                option1.innerHTML = htmlstr;
                option2.value = email.email;
                option2.innerHTML = htmlstr;
                option3.value = email.email;
                option3.innerHTML = htmlstr;

                reviewersList1.appendChild(option1);
                reviewersList2.appendChild(option2);
                reviewersList3.appendChild(option3);
            }
        })

}

function showDetail(obj) {
    console.log(obj);
	document.querySelector('#detail-title').innerHTML = obj.title + " by " + obj.authorfirst + " " + obj.authorlast + "(" + obj.authoremail + ")";
	let recs = document.querySelector('#wanted-container');
	while (recs.firstChild) 
		recs.removeChild(recs.lastChild);
    console.log("showdetail obj");
    console.log(obj);
	for (let i in obj.suggestedreviewers) {
		let li = document.createElement("li");
        li.classList.add("rec-el");
		li.innerHTML = obj.suggestedreviewers[i];
        recs.appendChild(li);
	}

    for(let i = 0; i < 3 - obj.suggestedreviewers.length; i++) {
		let li = document.createElement("li");
        li.classList.add("rec-el");
        li.innerHTML = ' ';
        recs.appendChild(li);
        
    }

	let ul = document.querySelector('#interested-container');
	// Delete all children
	while (ul.firstChild) 
		ul.removeChild(ul.lastChild);
	for (let o of obj.interestedreviewers) {
		let a = document.createElement("li");
        a.classList.add('rec-el');
		a.innerHTML = o.email;
		ul.appendChild(a);
	}
	// Fill this up to 3 children
	while (ul.childNodes.length < 3) {
        let b = document.createElement('li');
        b.classList.add('rec-el');
		ul.appendChild(b);
    }
	let but = document.querySelector('.assign-row button');
	but.dataset['subid'] = obj.subid;
	but.dataset['email'] = obj.authoremail;
}

// Fill new submissions list for editor
function fill_new_sub() {
	let url = "get_unassigned_submissions";
	fetch(url, {
		method: 'POST',
	})
	.then(resp => resp.json())
	.then(list => {
		let ul = document.querySelector('#new-list');
        while(ul.firstChild)
            ul.removeChild(ul.lastChild);

		for (let el of list) {
            console.log("el");
            console.log(el);
			let li = document.createElement("li");	
			// I need the reviewers they recomended 
			li.innerHTML = el.title;
			li.dataset['email'] = el.authoremail;
			li.dataset['first'] = el.authorfirst;
			li.dataset['last'] = el.authorlast;
			li.dataset['subid'] = el.subid;
			li.addEventListener('click', () => {
				showDetail(el);
			});
			ul.appendChild(li);
		}
	});
}


function fillNonEditors() {
    let url = 'get_users';
    fetch(url, {
        method: 'POST'
    })
    .then(resp => resp.json())
    .then(data => {
        console.log(data);
        let se = document.querySelector('.appoint');
        for (let i in data) {
            let op = document.createElement('option'); 
            const u = data[i];
            console.log(i);
            op.value = u.email;
            op.innerHTML = u.firstname + " " + u.lastname + " [" + u.email + "]";
            se.appendChild(op);
        }
    });
    
}

// Search paper list
document.querySelector('.interest-search').addEventListener('keyup', function() {			
    let filter, list, against;
    filter = document.querySelector('.interest-search').value.toUpperCase();
    list = document.querySelector('.interest-list').getElementsByTagName('li');
    for (let prev of list) {
        against = prev.innerText.toUpperCase();
        prev.style.display = against.indexOf(filter) > -1 ? '' : 'none';
    }
});

// Search assigned submissions list
document.querySelector('.assigned-search').addEventListener('keyup', function() {			
    let filter, list, against;
    filter = document.querySelector('.assigned-search').value.toUpperCase();
    list = document.querySelector('.assigned-list').getElementsByTagName('li');
    for (let prev of list) {
        against = prev.innerText.toUpperCase();
        prev.style.display = against.indexOf(filter) > -1 ? '' : 'none';
    }
});

// search new submissions list
document.querySelector('.newsub-search').addEventListener('keyup', function() {			
    let filter, list, against;
    filter = document.querySelector('.newsub-search').value.toUpperCase();
    list = document.querySelector('.new-list').getElementsByTagName('li');
    for (let prev of list) {
        against = prev.innerText.toUpperCase();
        prev.style.display = against.indexOf(filter) > -1 ? '' : 'none';
    }
});

// search pending submissions list 
document.querySelector('.pending-search').addEventListener('keyup', function() {			
    let filter, list, against;
    filter = document.querySelector('.pending-search').value.toUpperCase();
    list = document.querySelector('.pend-list').getElementsByTagName('li');
    for (let prev of list) {
        against = prev.innerText.toUpperCase();
        prev.style.display = against.indexOf(filter) > -1 ? '' : 'none';
    }
});

// Fill pending decisions list for editor
function fill_pend_dec() {
	let url = 'get_pending_submissions';
	fetch(url, {
		method: 'POST',
	})
	.then(resp => resp.json())
	.then(list => {
		let ul = document.querySelector('#pend-list');
		for (let el of list) {
			let li = document.createElement('li');
			console.log(el);
			li.innerHTML = el.title;
			li.addEventListener('click', function() {
				console.log('click');
				window.location.replace(`http://localhost:8000/paperoverview_page.html?subid=${el.subid}`); 
		
			})
			ul.appendChild(li);
		}
	})
}

function showDeadline() {
	let url = '';
	fetch(url, {
		method: 'POST',
	})
	.then(resp => resp.json())
	.then(json => {
		let da = document.querySelector(".deadline-alert");
		let dadiff = json.deadline - Date.now();
		let week = 604800000;
		// No deadline yet 
		if (dadiff < 0) {
			da.classList.remove("deadline-y");
			da.classList.add("deadline-b");
			da.innerHTML = "No Current Deadline";
		// deadline within wee
		} else if (dadiff < week) {
			da.classList.remove('deadline-b');
			da.classList.add('deadline-y');
			da.innerHTML = `Current Deadline is ${(new Date(dadiff)).toDateString()}`;
		} else {
			da.classList.remove('deadline-y');
			da.classList.add('deadline-b');
			da.innerHTML = `Current Deadline is ${(new Date(dadiff)).toDateString()}`;
		}
	});
}

function showAssigned() {
    let url = "get_assigned_submissions";
    fetch(url, {
        method: 'POST',
    })
    .then(resp => resp.json())
    .then(list => {
        if (list.msg) return
        let ul = document.querySelector("#assigned-list");
        for (let p of list) {
            console.log(p);
            let li = document.createElement("li"); 
            li.innerHTML = p.title; 
            li.addEventListener('click', function() {
                console.log(p.subid);
                window.location.replace(`http://localhost:8000/review.html?subid=${p.subid}`);
				// window.location.replace(`http://localhost:8000/paperoverview_page.html?subid=${el.subid}`); 
            });
            ul.appendChild(li);
        }
    });
}

function fillReviewers() {
    let url = 'get_reviewers';
    fetch(url, {
        method: 'POST'
    })
    .then(resp => resp.json())
    .then(list => {
        let a1 = document.querySelector('#assign1');
        let a2 = document.querySelector('#assign2');
        let a3 = document.querySelector('#assign3');
        for (let el of list) {
            let op1 = document.createElement('option'); 
            let op2 = document.createElement('option'); 
            let op3 = document.createElement('option'); 
            let html  = el.firstname + " " + el.lastname + " [" +  el.email + "]";
            op1.value = op2.value = op3.value = el.email;
            op1.innerHTML = op2.innerHTML = op3.innerHTML = html;
            a1.appendChild(op1);
            a2.appendChild(op2);
            a3.appendChild(op3);
        }
    })
}

function showInterested() {
    let url = "get_uninterested_submissions";
    fetch(url, {
        method: 'POST',
    })
    .then(resp => resp.json())
    .then(list => {
        if (list.msg) return
        let ul = document.querySelector("#interest-list");
        for (let p of list) {
            let li = document.createElement("li"); 
            let pt = document.createElement("span");
            pt.classList.add('paper-title');
            pt.innerHTML = p.title;
            let ps = document.createElement("span");
            ps.classList.add("paper-status");
            ps.innerHTML = "Interested!";
            ps.style.color = "#FFFFFF";
            li.appendChild(pt);
            li.appendChild(ps);
            ul.appendChild(li);
            ps.addEventListener('click', function() {
                fetch('add_interest', {
                    method: 'POST',
                    body: JSON.stringify({
                        subid:p.subid
                    }),
                    headers: {
                        'Content-Type':'application/json'
                    }
                })
                .then(resp => {
                    if (resp.ok) {
                        ul.removeChild(li);
                    }
                })
            });
        }
    });
}


function researcher_load() {
    let url = 'get_my_submissions';
    fetch(url, {
        method: 'POST',
    })
        .then(response => response.json())
        .then(json => {
            if (json.msg) return
            let ul = document.getElementById('submit-list');
            while (ul.firstChild)
                ul.removeChild(ul.lastChild);
            json.forEach(paper => {
                let li = document.createElement('li');

                let titleSpan = document.createElement('span');
                titleSpan.classList.add('paper-title');
                titleSpan.appendChild(
                    document.createTextNode(capitalize(paper.title)));
                titleSpan.addEventListener('click', function() {
                    window.location.replace(`http://localhost:8000/paperoverview_page.html?subid=${paper.subid}`); 
                });

                let statusSpan = document.createElement('span');
                statusSpan.classList.add('paper-status');
                statusSpan.classList.add(stat_to_class[paper.status]);
                statusSpan.appendChild(
                    document.createTextNode(capitalize(paper.status)));

                li.appendChild(titleSpan);
                li.appendChild(statusSpan);
                ul.appendChild(li);
            });
        })
}

function window_load()
{
	showDeadline();
    showAssigned();
    showInterested();
    researcher_load();
    fillReviewers();

	let get_info = "get_my_info";
	fetch(get_info, {
		method: 'POST'
	})
	.then(response => response.json())
	.then(json => {
        let res_tab = document.querySelector(".researcher");
		let rev_tab = document.querySelector(".reviewer");
		let edit_tab = document.querySelector(".editor");

		res_tab.style.display = json.researcher ? "inline-block":"none";
		rev_tab.style.display = json.reviewer ? "inline-block":"none";
		edit_tab.style.display = json.editor ? "inline-block":"none";


        // must give priorities to these things  editor > researcher > reviewer 
        
        document.querySelector('.at-tab').classList.remove('at-tab');
        if (json.editor) {
            edit_tab.classList.add('at-tab'); 
            set_tab("editor");
			fill_new_sub();
			fill_pend_dec();
            fillNonEditors();
        } else if (json.researcher) {
            res_tab.classList.add('at-tab'); 
            set_tab("researcher");
        } else {
            rev_tab.classList.add('at-tab'); 
            set_tab("reviewer");
        }

        if(json.researcher) {
            researcher_load();
        }



	});

}

window.onload = window_load();

function set_tab(tab_name) {
    let tabs = document.querySelectorAll('.tab');
    for (let tab of tabs) {
        tab.style.display =
            tab.id == tab_name ? 'block' : 'none';
    }
}

// Set eventlistener to switch views (researcher, reviewer, editor) 
let tabButtons = document.querySelectorAll('.tab-button');
for (let tabButton of tabButtons) {
    tabButton.addEventListener('click', () => {
        document.querySelector('.at-tab').classList.remove('at-tab');
        tabButton.classList.add('at-tab');

        set_tab(tabButton.classList[1]);
		// Remove alert if reviewer tab selected
		const al = document.querySelector(".alert");
		if (tabButton.classList.contains("reviewer") && al) {
			al.parentNode.removeChild(al);
		}
    });
}

// display search results that match every keyup
document.querySelector('.search-submit').addEventListener('keyup', function() {
    let filter, list, against;
    filter = document.querySelector('.search-submit').value.toUpperCase();
    list = document.querySelector('.submit-list').getElementsByTagName('li');
    for (let prev of list) {
        against = prev.innerText.toUpperCase();
        prev.style.display = against.indexOf(filter) > -1 ? '' : 'none';
    }
})

// delete session, and redirect page upon logout
document.querySelector('.logout').addEventListener('click', function() {
    let url = 'logout', redirectUrl = 'http://localhost:8000/front_page.html'; 
    fetch(url, {
        method: 'POST'
    })
    .then(() => {
        window.location.replace(redirectUrl);
    });
})

const realFileBtn = document.getElementById('real-file');
const customBtn = document.getElementById('upload-button');
const customText = document.getElementById('custom-text');
const submitBtn = document.getElementById('submit-button');
errorText = document.getElementById('error-text');
successText = document.getElementById('success-text');
const journalNameText = document.getElementById('journal-name');

reviewers_onload();

customBtn.addEventListener('click', function() {
    realFileBtn.click();
});

realFileBtn.addEventListener('change', function() {
    if (realFileBtn.value) {
        customText.innerHTML =
            realFileBtn.value.match(/[\/\\]([\w\d\s\.\-\(\)]+)$/)[1];
    } else {
        customText.innerHTML = 'No file chosen.';
    }
})

submitBtn.addEventListener('click', function() {
    var reviewersList1 = document.getElementById("reviewer-list1");
    var reviewersList2 = document.getElementById("reviewer-list2");
    var reviewersList3 = document.getElementById("reviewer-list3");

    var reviewers_selected = true;

    var reviewer1 = reviewersList1.options[reviewersList1.selectedIndex].value;
    var reviewer2 = reviewersList2.options[reviewersList2.selectedIndex].value;
    var reviewer3 = reviewersList3.options[reviewersList3.selectedIndex].value;

    var reviewers = [reviewer1, reviewer2, reviewer3];
    
    console.log(reviewers);

    for (i = 0; i < reviewers.length; i++)
    {
        if (reviewers[i] == 'select a reviewer')
        {
            reviewers_selected = false;
        }
    }

    if (realFileBtn.files.length && journalNameText.value.length && reviewers_selected) {
        var reader = new FileReader();
        reader.readAsBinaryString(realFileBtn.files[0]);
        reader.onload = function() {
            const obj = {
                title: journalNameText.value,
                paper: btoa(reader.result),
                reviewer1: reviewer1,
                reviewer2: reviewer2,
                reviewer3: reviewer3
            };
            let url = 'submit_paper';
            fetch(url, {
                method: 'post',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(obj),
            }).then(o => {
                researcher_load();
            });

            errorText.style.visibility = 'hidden';
            errorText.style.display = 'none';
            successText.style.visibility = 'visible';
            successText.style.display = 'inline';

           // reload page to update the previous submissions
        };
        reader.onerror = function(error) {
            console.log('Error: ', error)
        };
    } else {
        if (realFileBtn.files.length == 0 &&
            journalNameText.value.length == 0) {
            errorText.innerHTML = 'no file selected, journal needs a title';
        } else if (realFileBtn.files.length == 0) {
            errorText.innerHTML = 'no file selected';
        } else if (!reviewers_selected) 
        {
            errorText.innerHTML = 'must select three reviewers';
        }
        else {
            errorText.innerHTML = 'journal needs a title';
        }

        errorText.style.visibility = 'visible';
        errorText.style.display = 'inline';
    }
});

// Start of editor code 


// TODO: Assign Reviewers (NEEDS TESTING)

// Need to check that they exist 
document.querySelector("#assign-reviewers-btn").addEventListener('click', function() {
	const author = document.querySelector(".assign-row button").dataset['email'];
	const subid =  document.querySelector(".assign-row button").dataset['subid'];
	// nothing selected
	if (!subid) return
	const a1 = document.querySelector("#assign1");
	const a2 = document.querySelector("#assign2");
	const a3 = document.querySelector("#assign3");
    let set = {};
    set[a1.value] = a1.value == "" ? 0 : 1;
    set[a2.value] = a2.value == "" ? 0 : 1;
    set[a3.value] = a3.value == "" ? 0 : 1;
    const numReviewers = ((s) => {
        let sum = 0;
        for(const [k, v] of Object.entries(s)) 
            sum += v;
        return sum;
    }) (set);
	const al = document.querySelector("#assign-error");
	if (a1.value == author || a2.value == author || a3.value == author) {
        al.classList.remove("success");
		al.classList.add("error");
		al.innerHTML = "Cannot review self written paper";
	} else if (numReviewers < 2) {
		al.classList.add("error");
		al.innerHTML = "Need to assign at least 2 reviewers";
	} else {
		let url = 'assign_reviewer';
		rev_list = [];
		if (a1.value != "") { rev_list.push(a1.value); }
		if (a2.value != "") { rev_list.push(a2.value); }
		if (a3.value != "") { rev_list.push(a3.value); }
		fetch(url, {
			method: 'POST',
			body: JSON.stringify({
				subid: subid,
				reviewer: rev_list
			}),
			headers: {
				'Content-Type':'application/json'
			}
		})
		.then(
            response => response.json().then(
                data => ({status: response.status, msg: data.msg}))
		)
		.then(data => {
			if (data.status == 400) {
                al.classList.remove("success");
				al.classList.add("error");
				al.innerHTML = data.msg;	
				return;
			} 

            al.classList.add("success");
            al.innerHTML = data.msg;
            fill_new_sub();
            return;
		});

	} 
	setTimeout(function() {
		al.classList.remove('error');
		al.classList.remove('success');
		// dl.classList.remove('error');
	}, 3000);
});

// Appoints someoen to a position 'r' or 'e'
function appointSomeone(position) {
	let url = 'change_user_status';
    let al = document.querySelector("#admin-status");


	fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			email: document.querySelector('.appoint').value,
            researcher: position == 's',
			reviewer: position == 'r',
            editor: position == 'e'
		}),
		headers: {
			'Content-Type':'application/json'
		}
	})
	.then(
		response => response.json().then(
		data => ({status: response.status, stuff: data}))
	)
	.then(data => {
        console.log(data);
		if (data.status == 400) {
		    al.classList.remove('success');
            al.classList.add('error');
            al.innerHTML = data.stuff.msg;
            return;
		} 

        al.classList.add('success');
        al.classList.remove('error');
        al.innerHTML = "Success!";
        return;
	});

	setTimeout(function() {
		al.classList.remove('error');
		al.classList.remove('success');
		// dl.classList.remove('error');
	}, 3000);
}


document.querySelector("#appoint-res").addEventListener('click', function() {
	appointSomeone('s');
});
document.querySelector("#appoint-rev").addEventListener('click', function() {
	appointSomeone('r');
});
document.querySelector("#appoint-edit").addEventListener('click', function() {
	appointSomeone('e');
});




