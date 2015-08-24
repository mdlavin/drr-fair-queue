var Deque = require('double-ended-queue');

function Flow() {
    this.queue = new Deque();
    this.deficit = 0;
}

function DRRQueue(options) {
    if (!options) {
        options = {};
    }

    // A queue of flows that have some data to process
    this.activeList = new Deque();
    // A map of flows from id -> Flow
    this.flows = {};

    this.quantumSize = options.quantumSize || 1;

    this.onUnidle = function () {};
};

function lookupFlow(drrqueue, flowId) {
    var flow = drrqueue.flows[flowId];
    if (!flow) {
        flow = new Flow();
        drrqueue.flows[flowId] = flow;
    }
    return flow;
}

DRRQueue.prototype.push = function (flowId, data, size) {
    var flow = lookupFlow(this, flowId);

    if (typeof(size) !== 'number' || !isFinite(size)) {
        throw new Error('The size must be a finite number');
    }

    var count = flow.queue.push({data: data, size: size});
    
    // If the flow is transitioning from 'no data' to 'some data'
    // then push the flow into the active list
    if (count === 1) {
        var activeCount = this.activeList.push(flow);
        if (activeCount) {
            this.onUnidle();
        }
    }
};

DRRQueue.prototype._processActiveFlow = function () {
    var activeFlow = this.activeFlow;
    var queue = activeFlow.queue;
    if (!queue.isEmpty()) {
        var next = queue.peekFront();
        if (next.size <= activeFlow.deficit) {
            activeFlow.deficit -= next.size;
            queue.shift();
            return next.data;
        } else {
            this.activeList.push(activeFlow);
        }
    }
    this.activeFlow = null;
    return null;
};

DRRQueue.prototype.pop = function () {
    var result;

    if (this.activeFlow) {
        result = this._processActiveFlow();
        if (result) {
            return result;
        }
    }
    
    while (!this.activeList.isEmpty()) {
        this.activeFlow = this.activeList.shift();
        this.activeFlow.deficit += this.quantumSize;
        result = this._processActiveFlow();
        if (result) {
            return result;
        }
    }
    
    // If no work was in the queue, then return undefined
    return undefined;
};

module.exports = DRRQueue;
