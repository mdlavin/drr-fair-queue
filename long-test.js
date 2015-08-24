var DRRQueue = require('./index.js');

var queue = new DRRQueue();

function insertElement() {
    var now = Date.now();
    var minute = Math.floor(now / 60000);
    var bucket = (now + Math.floor(Math.random() * 1000)) % 10;
    var flow = 'flow' + minute + '-' + bucket;
    queue.push(flow, flow, 1);
}

for (var i=0;i<100;i++) {
    insertElement();
}

var updateEvery=10000000;
var count=0;
var start = Date.now();
while (true) {
    queue.pop();
    count++;
    if (count === updateEvery) {
        count=0;
        var end = Date.now();
        console.log('Processed at a rate of ' + (updateEvery/(end-start)) +
                    '/ms');
        start = end;
    }
    insertElement();
}
