A fair queue based on Deficit Round Robin
=========================================

[![Build Status](https://travis-ci.org/mdlavin/drr-fair-queue.svg)](https://travis-ci.org/mdlavin/drr-fair-queue)
[![NPM version](https://badge.fury.io/js/drr-fair-queue.svg)](http://badge.fury.io/js/drr-fair-queue)
[![Dependency Status](https://david-dm.org/mdlavin/drr-fair-queue.svg)](https://david-dm.org/mdlavin/drr-fair-queue)

With this module, you can queue work from multiple incoming sources
and pull work for the queue in a fair order. One source cannot cause starvation
of the other sources. This module is an implemenation of the work in
[Efficient Fair Queuing Using Deficit Round-Robin](http://users.ece.gatech.edu/~siva/ECE4607/presentations/DRR.pdf)

A fair queue could be used to schedule incoming requests from users, to make
sure that no user reduces the performance of other users on the same server.
Or, the queue could be used to balance outgoing requests to a downstream server,
making sure that one user does not consume all of the connections in a pool.

Overview
--------
When inserting elements into the queue, three pieces of information are needed.

1. The source of the item
2. The item
3. The weight of the item

A simple example
----------------
In this example, source 1 will queue two items of work before source 2 can
queue anything.  But, when the items are popped, the work from source 2 will
be popped first so that source 1 does not starve source 2.

```js
var FairQueue = require('drr-fair-queue');
var queue = new FairQueue();

queue.push('source1', 'item1', 1);
queue.push('source1', 'item2', 1);
queue.push('source2', 'item3', 1);

queue.pop();  // Will pop item 1 from source 1
queue.pop();  // Will pop item 3 from source 2
queue.pop();  // Will pop item 2 from source 1
```

