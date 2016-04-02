var DRRQueue = require('./index');
var expect = require('chai').expect;
var uuid = require('uuid');
var sinon = require('sinon');
var Reflect = require('harmony-reflect');

function testInvariants(queue) {
    // The activeFlow should not also be in the active list
    if (queue.activeFlow) {
        for (var i=0;i<queue.activeList.length;i++) {
            expect(queue.activeList.get(i)).to.not.equal(queue.activeFlow);
        }
    }

    // The queued count should equal the number of elements in all flows
    var actualQueued = 0;
    if (queue.activeFlow) {
        actualQueued += queue.activeFlow.queue.length;
    }

    for (var a=0;a<queue.activeList.length;a++) {
        actualQueued += queue.activeList.get(a).queue.length;
    }
    expect(queue.length).to.equal(actualQueued);
    
}

function newQueue(options) {
    var queue = new DRRQueue(options);
    var proxy = new Proxy(queue, {
        get: function(target, name, receiver) {
            var result = Reflect.get(target, name, receiver);
            if (typeof(result) === 'function') {
                return function() {
                    var returnValue = result.apply(target, arguments);
                    testInvariants(target);
                    return returnValue;
                };
            }
            return result;
        }
    });
    return proxy;
}

describe('DRRQueue', function () {

    describe('#pop', function () {
        it('returns undefined when the queue is empty', function () {
            var queue = newQueue();
            expect(queue.pop()).to.be.undefined;
        });

        it('returns the only element if there is only one', function () {
            var queue = newQueue();
            var element = uuid.v4();
            queue.push('only-flow', element, 1);
            expect(queue.pop()).to.equal(element);
        });

        it(
            'returns the elements in order if there is only one flow',
            function () {
                var queue = newQueue();
                var element1 = uuid.v4();
                queue.push('only-flow', element1, 1);
                var element2 = uuid.v4();
                queue.push('only-flow', element2, 1);
                expect(queue.pop(), 'first pop').to.equal(element1);
                expect(queue.pop(), 'second pop').to.equal(element2);
            }
        );

        it('returns undefined again after emptying the queue', function () {
            var queue = newQueue();
            var element = uuid.v4();
            queue.push('only-flow', element, 1);
            queue.pop();
            expect(queue.pop()).to.be.undefined;
        });

        it(
            'correctly pops elements that are smaller than the quantum',
            function () {
                var queue = newQueue({quantumSize: 4});
                var element = uuid.v4();
                queue.push('only-flow', element, 2);
                expect(queue.pop()).to.equal(element);
            }
        );

        it(
            'correctly pops elements that are larger than the quantum',
            function () {
                var queue = newQueue({quantumSize: 4});
                var element = uuid.v4();
                queue.push('only-flow', element, 5);
                expect(queue.pop()).to.equal(element);
            }
        );

        it(
            'correctly pops elements that are sized to 0',
            function () {
                var queue = newQueue({quantumSize: 4});
                var element = uuid.v4();
                queue.push('only-flow', element, 0);
                expect(queue.pop()).to.equal(element);
            }
        );

        it(
            'alternative between two flows with equal sized elements',
            function () {
                var queue = newQueue();
                var element1 = 'element1';
                queue.push('flow1', element1, 1);
                var element3 = 'element3';
                queue.push('flow1', element3, 1);
                var element2 = 'element2';
                queue.push('flow2', element2, 1);

                expect(queue.pop(), 'first pop').to.equal(element1);
                expect(queue.pop(), 'second pop').to.equal(element2);
                expect(queue.pop(), 'third pop').to.equal(element3);
            }
        );

        it(
            'returns two elements in a row from the same queue if they ' +
                'are below the quantum size',
            function () {
                var queue = newQueue({quantumSize: 2});
                var element1 = 'element1';
                queue.push('flow1', element1, 1);
                var element2 = 'element2';
                queue.push('flow2', element2, 1);
                var element3 = 'element3';
                queue.push('flow1', element3, 1);

                expect(queue.pop(), 'first pop').to.equal(element1);
                expect(queue.pop(), 'second pop').to.equal(element3);
                expect(queue.pop(), 'third pop').to.equal(element2);
            }
        );

    });

    describe('#push', function () {
        it('requires that the size be a number', function () {
            var queue = newQueue({quantumSize: 4});
            var callWithAString = function () {
                queue.push('only-flow', 'element', {test: true});
            };
            expect(callWithAString).to.throw(
                'The size must be a finite number'
            );
        });

        it('requires that the size be a finite number', function () {
            var queue = newQueue({quantumSize: 4});
            var callWithAString = function () {
                queue.push('only-flow', 'element', Number.NaN);
            };
            expect(callWithAString).to.throw(
                'The size must be a finite number'
            );
        });

        it('calls onUnidle if it\'s the first work pushed', function () {
            var onUnidle = sinon.stub();
            var queue = newQueue({onUnidle: onUnidle});
            
            sinon.assert.notCalled(onUnidle);
            queue.push('one', 'element', 1);
            sinon.assert.calledOnce(onUnidle);
        });

        it('calls onUnidle when work is pushed to a deficited active flow', function () {
            var onUnidle = sinon.stub();
            var queue = newQueue({onUnidle: onUnidle, quantumSize: 4});
            
            sinon.assert.notCalled(onUnidle);
            queue.push('one', 'element', 1);
            sinon.assert.calledOnce(onUnidle);
            queue.pop();
            queue.push('one', 'element 2', 1);
            sinon.assert.calledTwice(onUnidle);
        });

        it('does not call onUnidle if there is pending work in the same queue', function () {
            var onUnidle = sinon.stub();
            var queue = newQueue({onUnidle: onUnidle});
            
            queue.push('one', 'element', 1);
            queue.push('two', 'element 1', 1);
            sinon.assert.calledOnce(onUnidle);
        });
    });
    
});
