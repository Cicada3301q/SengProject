const fs = require('fs')
const axios = require('axios');

fs.readFile('./submissions/9805082.pdf', (err, data) => {
    if (err) {
        console.log(err);
    } else {
        axios
            .post('http://localhost:8000/submit_paper', {
                title: 'Quantum Counting',
                paper: data.toString('base64'),
            })
            .then((res) => {
                console.log(res);
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

